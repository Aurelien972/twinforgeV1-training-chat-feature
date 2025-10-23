/*
  # Fonctions de Traitement en Arrière-plan pour l'IA

  1. Fonctions PostgreSQL
    - `process_ai_analysis_job` - Traite un job d'analyse IA
    - `trigger_ai_job_processing` - Fonction trigger pour déclencher le traitement
  
  2. Triggers
    - Trigger AFTER INSERT sur ai_analysis_jobs pour traitement automatique
  
  3. Extensions
    - Activation de pg_net pour les appels HTTP depuis PostgreSQL
*/

-- Activer l'extension pg_net pour les appels HTTP depuis PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction pour traiter un job d'analyse IA
CREATE OR REPLACE FUNCTION process_ai_analysis_job(job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_record ai_analysis_jobs%ROWTYPE;
  edge_function_url TEXT;
  request_body JSONB;
  response_data JSONB;
  http_response net.http_response_result;
BEGIN
  -- Récupérer le job
  SELECT * INTO job_record 
  FROM ai_analysis_jobs 
  WHERE id = job_id AND status = 'pending';
  
  -- Vérifier que le job existe et est en attente
  IF NOT FOUND THEN
    RAISE NOTICE 'Job % not found or not pending', job_id;
    RETURN;
  END IF;
  
  -- Marquer le job comme en cours de traitement
  UPDATE ai_analysis_jobs 
  SET status = 'processing', updated_at = NOW()
  WHERE id = job_id;
  
  -- Construire l'URL de la fonction Edge selon le type d'analyse
  CASE job_record.analysis_type
    WHEN 'daily_summary' THEN
      edge_function_url := current_setting('app.supabase_url') || '/functions/v1/daily-nutrition-summary';
    WHEN 'trend_analysis' THEN
      edge_function_url := current_setting('app.supabase_url') || '/functions/v1/nutrition-trend-analysis';
    ELSE
      -- Type d'analyse non supporté
      UPDATE ai_analysis_jobs 
      SET status = 'failed', 
          error_message = 'Unsupported analysis type: ' || job_record.analysis_type,
          updated_at = NOW()
      WHERE id = job_id;
      RETURN;
  END CASE;
  
  -- Préparer le corps de la requête
  request_body := job_record.request_payload;
  
  BEGIN
    -- Appeler la fonction Edge via pg_net
    SELECT INTO http_response * FROM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := request_body::TEXT
    );
    
    -- Vérifier le statut de la réponse HTTP
    IF http_response.status_code = 200 THEN
      -- Succès : parser la réponse et sauvegarder le résultat
      response_data := http_response.content::JSONB;
      
      UPDATE ai_analysis_jobs 
      SET status = 'completed',
          result_payload = response_data,
          updated_at = NOW()
      WHERE id = job_id;
      
      RAISE NOTICE 'Job % completed successfully', job_id;
      
    ELSE
      -- Échec : sauvegarder l'erreur
      UPDATE ai_analysis_jobs 
      SET status = 'failed',
          error_message = 'HTTP ' || http_response.status_code || ': ' || COALESCE(http_response.content, 'Unknown error'),
          updated_at = NOW()
      WHERE id = job_id;
      
      RAISE NOTICE 'Job % failed with HTTP %', job_id, http_response.status_code;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Gérer les exceptions lors de l'appel HTTP
    UPDATE ai_analysis_jobs 
    SET status = 'failed',
        error_message = 'Exception during processing: ' || SQLERRM,
        updated_at = NOW()
    WHERE id = job_id;
    
    RAISE NOTICE 'Job % failed with exception: %', job_id, SQLERRM;
  END;
  
END;
$$;

-- Fonction trigger pour déclencher le traitement automatique des nouveaux jobs
CREATE OR REPLACE FUNCTION trigger_ai_job_processing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que le nouveau job est en attente
  IF NEW.status = 'pending' THEN
    -- Déclencher le traitement de manière asynchrone
    -- Note: pg_net.http_post est asynchrone par défaut
    PERFORM process_ai_analysis_job(NEW.id);
    
    RAISE NOTICE 'Triggered processing for job %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger AFTER INSERT sur ai_analysis_jobs
DROP TRIGGER IF EXISTS on_ai_analysis_job_insert ON ai_analysis_jobs;
CREATE TRIGGER on_ai_analysis_job_insert
  AFTER INSERT ON ai_analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_job_processing();

-- Fonction utilitaire pour nettoyer les anciens jobs (optionnel)
CREATE OR REPLACE FUNCTION cleanup_old_ai_analysis_jobs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les jobs terminés (completed/failed) de plus de X jours
  DELETE FROM ai_analysis_jobs 
  WHERE status IN ('completed', 'failed') 
    AND created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old AI analysis jobs', deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Configuration des paramètres nécessaires pour les fonctions
-- Ces paramètres doivent être configurés dans votre environnement Supabase
-- Vous devrez les définir via l'interface Supabase ou via SQL :

-- ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.supabase_service_role_key = 'your-service-role-key';

-- Note: Pour des raisons de sécurité, ces valeurs doivent être configurées 
-- par un administrateur de base de données et ne doivent pas être hardcodées ici.