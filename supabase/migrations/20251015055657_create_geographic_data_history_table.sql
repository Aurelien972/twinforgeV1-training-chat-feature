/*
  # Système d'historique des données géographiques
  
  1. Nouvelle table
    - `geographic_data_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `recorded_at` (timestamptz) - Date d'enregistrement
      - `country_code` (text) - Code ISO du pays
      - `city` (text) - Ville
      - `latitude` (numeric) - Latitude
      - `longitude` (numeric) - Longitude
      - `weather` (jsonb) - Données météo
      - `air_quality` (jsonb) - Données qualité de l'air
      - `hydration_recommendation` (jsonb) - Recommandations d'hydratation
      - `environmental_exposure` (jsonb) - Expositions environnementales
      - `created_at` (timestamptz)
      
  2. Sécurité
    - Enable RLS sur `geographic_data_history`
    - Policies permettant aux utilisateurs de lire leur propre historique
    - Policies permettant l'insertion pour les utilisateurs authentifiés
    
  3. Index
    - Index sur user_id et recorded_at pour les requêtes d'historique
    - Index sur user_id et country_code
    
  4. Notes importantes
    - Permet de stocker un snapshot quotidien des données géographiques
    - Facilite le suivi dans le temps des conditions environnementales
    - Les données sont conservées pour permettre une analyse historique
*/

-- Create table
CREATE TABLE IF NOT EXISTS geographic_data_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recorded_at timestamptz DEFAULT now() NOT NULL,
  country_code text NOT NULL,
  city text,
  latitude numeric,
  longitude numeric,
  weather jsonb DEFAULT '{}'::jsonb,
  air_quality jsonb DEFAULT '{}'::jsonb,
  hydration_recommendation jsonb DEFAULT '{}'::jsonb,
  environmental_exposure jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_geographic_data_history_user_recorded 
  ON geographic_data_history(user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_geographic_data_history_user_country 
  ON geographic_data_history(user_id, country_code);

-- Enable RLS
ALTER TABLE geographic_data_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own geographic data history
CREATE POLICY "Users can read own geographic data history"
  ON geographic_data_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own geographic data
CREATE POLICY "Users can insert own geographic data"
  ON geographic_data_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own old geographic data (for cleanup)
CREATE POLICY "Users can delete own geographic data"
  ON geographic_data_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to automatically clean up old data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_geographic_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM geographic_data_history
  WHERE recorded_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Comment on table
COMMENT ON TABLE geographic_data_history IS 'Historique des données géographiques et environnementales pour analyse dans le temps';
