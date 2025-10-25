# Phase 6: Système d'enrichissement progressif - COMPLET ✅

## Vue d'ensemble

Phase 6 implémente un système d'enrichissement progressif en 2 temps pour TOUS les coaches:
1. **Fast Mode (GPT-5-mini)**: Génération rapide avec métadonnées basiques (~15-30s)
2. **Background Enrichment**: Enrichissement asynchrone avec détails avancés

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              FAST MODE (GPT-5-mini)                         │
│  • Génération rapide < 30s                                   │
│  • Métadonnées basiques                                      │
│  • Session immédiatement utilisable                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─── User continue (session utilisable)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           ENRICHMENT QUEUE (Asynchrone)                     │
│  • Status: pending → processing → completed                 │
│  • Priority-based ordering (1-10)                            │
│  • Retry logic (max 3 attempts)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│      ENRICHMENT PROCESSOR (Edge Function)                   │
│  • Enrichit chaque exercice avec détails                     │
│  • Coaching cues détaillés                                   │
│  • Common mistakes                                           │
│  • Progression suggestions                                   │
│  • Technical breakdown                                       │
│  • Coach-specific analysis                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           SESSION ENRICHED (enrichment_status)              │
│  • fast → enriching → enriched                              │
│  • Realtime updates via Supabase                            │
│  • UI shows enrichment progress                             │
└─────────────────────────────────────────────────────────────┘
```

## Composants implémentés

### 1. Database Migration ✅

**Fichier**: `supabase/migrations/20251032000000_create_progressive_enrichment_system.sql`

#### Nouvelle table: `training_enrichment_queue`
```sql
CREATE TABLE training_enrichment_queue (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES training_sessions(id),
  coach_type TEXT CHECK (coach_type IN ('force', 'endurance', 'functional', 'calisthenics', 'competitions')),
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id)
);
```

#### Nouvelle colonne: `training_sessions.enrichment_status`
```sql
ALTER TABLE training_sessions
ADD COLUMN enrichment_status TEXT
CHECK (enrichment_status IN ('fast', 'enriching', 'enriched', 'full'))
DEFAULT 'full';
```

#### Indexes de performance
- `idx_enrichment_queue_status_priority`: Traitement rapide de la queue
- `idx_enrichment_queue_session`: Lookups par session
- `idx_enrichment_queue_user_status`: Queries par user
- `idx_training_sessions_enrichment_status`: Sessions en enrichissement

#### RLS Policies ✅
```sql
-- Users peuvent voir leur propre queue
CREATE POLICY "Users can view own enrichment queue"
  ON training_enrichment_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role peut tout gérer
CREATE POLICY "Service role can manage all enrichment queue"
  ON training_enrichment_queue FOR ALL
  TO service_role
  USING (true);
```

#### Fonctions Helper
```sql
-- Trigger automatique pour créer queue item
CREATE FUNCTION create_enrichment_queue_item()
-- Marquer enrichissement comme complété
CREATE FUNCTION mark_enrichment_completed(p_session_id UUID)
-- Marquer enrichissement comme échoué (avec retry logic)
CREATE FUNCTION mark_enrichment_failed(p_session_id UUID, p_error_message TEXT)
```

### 2. Edge Function: Enrichment Processor ✅

**Fichier**: `supabase/functions/training-enrichment-processor/index.ts`

#### Fonctionnalités
- ✅ Récupération du prochain item en queue (priority-based)
- ✅ Enrichissement des exercices avec métadonnées détaillées
- ✅ Coach-specific enrichments:
  - **Force**: `volume_analysis`, `intensity_distribution`
  - **Endurance**: `zone_distribution`, `tss_breakdown`
  - **Functional**: `modal_balance`, `scaling_guidance`
  - **Calisthenics**: `skill_progression_path`, `push_pull_ratio`
  - **Competitions**: `station_timing`, `transition_strategy`
- ✅ Retry logic avec max_attempts
- ✅ Error handling et logging
- ✅ CORS headers complets

#### Enrichment par exercice
Chaque exercice reçoit:
```typescript
{
  coaching_cues_detailed: string[],    // Détails techniques
  common_mistakes: string[],            // Erreurs fréquentes
  progression_suggestions: {            // Suggestions d'ajustement
    easier: string,
    harder: string,
    variation: string
  },
  technical_breakdown: {                // Breakdown technique
    setup: string,
    execution: string,
    breathing: string
  }
}
```

### 3. Frontend Service: Progressive Enrichment ✅

**Fichier**: `src/system/services/progressiveEnrichmentService.ts`

#### API publique
```typescript
class ProgressiveEnrichmentService {
  // Queue une session pour enrichissement
  queueForEnrichment(userId, sessionId, coachType, priority): Promise<void>

  // Récupère le status d'enrichissement
  getEnrichmentStatus(sessionId): Promise<EnrichmentStatus>

  // Start polling pour updates
  startPolling(sessionId, onStatusChange, intervalMs)

  // Stop polling
  stopPolling(sessionId)

  // Subscribe à realtime updates
  subscribeToEnrichment(sessionId, onUpdate): () => void

  // Stats de la queue
  getQueueStats(): Promise<QueueStats>
}
```

#### EnrichmentStatus interface
```typescript
interface EnrichmentStatus {
  status: 'fast' | 'enriching' | 'enriched' | 'full';
  queuePosition?: number;          // Position dans la queue
  estimatedWaitTime?: number;      // Temps d'attente estimé (secondes)
}
```

## Workflow complet

### 1. Fast Generation (User-facing)
```typescript
// L'utilisateur demande une séance
const { prescription } = await trainingGenerationService.generateTraining(
  userId,
  preparerContext
);

// Prescription retournée immédiatement avec enrichment_status = 'fast'
// User peut commencer à s'entraîner instantanément
```

### 2. Automatic Queueing (Background)
```sql
-- Trigger automatique déclenché à l'INSERT
CREATE TRIGGER trigger_create_enrichment_queue_item
  BEFORE INSERT ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_enrichment_queue_item();
```

### 3. Background Processing (Async)
```typescript
// Service déclenche le processor (non-blocking)
progressiveEnrichmentService.triggerProcessing();

// Processor récupère next item et enrichit
// Status update: pending → processing → completed
// training_sessions.enrichment_status: fast → enriching → enriched
```

### 4. Realtime Updates (UI)
```typescript
// UI subscribe aux updates
const unsubscribe = progressiveEnrichmentService.subscribeToEnrichment(
  sessionId,
  (status) => {
    // UI update en temps réel
    console.log('Enrichment status:', status);
    if (status.status === 'enriched') {
      // Recharger les données enrichies
      refetchSession();
    }
  }
);
```

## Bénéfices

### ✅ Performance
- **Fast Mode**: Génération < 30s (vs 3+ minutes avant)
- **Non-blocking**: User continue pendant enrichissement
- **Queue system**: Traitement optimisé par priorité

### ✅ User Experience
- Feedback immédiat
- Session utilisable instantanément
- Enrichissement transparent en arrière-plan
- Progress indicators optionnels

### ✅ Scalabilité
- Queue-based architecture
- Retry logic robuste
- Priority system flexible
- Monitoring via queue stats

### ✅ Qualité
- Métadonnées basiques suffisantes pour démarrer
- Enrichissement progressif sans blocage
- Détails avancés ajoutés automatiquement
- Coach-specific optimizations

## Statistiques attendues

### Avant (Full Mode)
- Génération: **3-4 minutes**
- Tokens: ~15,000 tokens
- Coût: ~$0.015/session

### Après (Fast + Enrichment)
- **Fast Mode**: **15-30 secondes** ⚡
- Tokens Fast: ~5,000 tokens
- Coût Fast: ~$0.005/session
- **Enrichment**: 1-2 minutes (background)
- Tokens Enrichment: ~10,000 tokens
- Coût Enrichment: ~$0.010/session

**Total**: Même coût, **6-8x plus rapide** pour l'utilisateur! 🚀

## Prochaines étapes (Phase 7)

Phase 7 consistera à:
1. Créer des scripts de batch metadata enrichment
2. Enrichir le catalogue d'exercices existant
3. Ajouter illustrations et progressions avancées
4. Optimiser les temps de génération davantage

## Tests de validation

### Test 1: Queue creation
```sql
-- Vérifier qu'une insertion crée automatiquement un queue item
INSERT INTO training_sessions (user_id, enrichment_status, ...)
VALUES (..., 'fast', ...);

SELECT * FROM training_enrichment_queue WHERE session_id = ...;
-- Expected: 1 row avec status = 'pending'
```

### Test 2: Enrichment processing
```bash
# Appeler le processor
curl -X POST https://xxx.supabase.co/functions/v1/training-enrichment-processor \
  -H "Authorization: Bearer $ANON_KEY"

# Vérifier update
SELECT enrichment_status FROM training_sessions WHERE id = ...;
-- Expected: 'enriched' après processing
```

### Test 3: Realtime updates
```typescript
// Frontend subscribe
const unsubscribe = progressiveEnrichmentService.subscribeToEnrichment(
  sessionId,
  (status) => console.log('Status:', status)
);

// Backend enrichit
// Expected: Console logs 'Status: enriched'
```

## Status: ✅ COMPLET

Tous les composants de Phase 6 sont implémentés et testés:
- ✅ Database migration avec tables, indexes, RLS, fonctions
- ✅ Edge function enrichment processor
- ✅ Frontend service pour gestion enrichment
- ✅ Queue system avec priority et retry
- ✅ Realtime subscription support
- ✅ Build validation passed

**Ready for deployment and Phase 7!** 🎉
