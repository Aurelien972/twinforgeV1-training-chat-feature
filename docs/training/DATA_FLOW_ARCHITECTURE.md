# Architecture des Flux de Données Training

## Vue d'Ensemble

Ce document décrit l'architecture des flux de données dans l'application, en particulier la séparation entre **Atelier Training** (création de sessions) et **Forge Énergétique** (tracking global d'activité).

## Principes Fondamentaux

### 1. Séparation des Responsabilités

**Atelier Training** (Training Workshop)
- **But**: Créer et exécuter des sessions d'entraînement structurées avec coaching AI
- **Source de données**: `training_sessions` UNIQUEMENT
- **Coaches AI**: 5 coaches spécialisés (Force, Endurance, Fonctionnel, Compétitions, Calisthenics)
- **Type de données**: Sessions planifiées, prescriptions d'exercices, feedbacks, progressions

**Forge Énergétique** (Energy Forge)
- **But**: Tracker et analyser TOUTE l'activité physique quotidienne
- **Sources de données**: `training_sessions` + `manual_activities` + wearable data
- **Type de données**: Dépense calorique globale, activités manuelles, métriques journalières

### 2. Flux Unidirectionnel

```
┌─────────────────────────────────────────────────────────────┐
│                    USER                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ATELIER TRAINING (Creation)                     │
│  • 5 AI Coaches (GPT-5-mini)                                │
│  • Session planning & execution                              │
│  • Exercise prescriptions                                    │
│  • Performance tracking                                      │
│                                                              │
│  Database: training_sessions ONLY                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Sync automatique
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            FORGE ÉNERGÉTIQUE (Tracking)                      │
│  • All activities (training + manual)                        │
│  • Daily calorie tracking                                    │
│  • Wearable integration                                      │
│  • Global activity analytics                                 │
│                                                              │
│  Database: activities (synced from training_sessions         │
│            + manual_activities + wearable_data)              │
└─────────────────────────────────────────────────────────────┘
```

**RÈGLE ABSOLUE**: Le flux est TOUJOURS unidirectionnel de Training vers Forge, JAMAIS l'inverse.

## Architecture des Données par Module

### Atelier Training - 5 Onglets

| Onglet | Source Données | AI Enrichment | Cache |
|--------|---------------|---------------|-------|
| **Aujourd'hui** | `training_sessions` | Non | 2 min |
| **Conseils** | `training_sessions` | GPT-5-mini (multi-disciplines) | 7 jours |
| **Progression** | `training_sessions` | GPT-5-mini (tendances) | 24h |
| **Records** | `training_sessions` | Non (calculs purs) | 5 min |
| **Historique** | `training_sessions` | Non (listing) | 5 min |

### Forge Énergétique - 4 Onglets

| Onglet | Source Données | AI Enrichment | Cache |
|--------|---------------|---------------|-------|
| **Jour** | `activities` (all sources) | Non | Temps réel |
| **Historique** | `activities` (all sources) | Non | 5 min |
| **Insights** | `activities` (all sources) | Possible (future) | N/A |
| **Progression** | `activities` (all sources) | Possible (future) | N/A |

## Tables de Base de Données

### Training System

```sql
-- Sessions créées par l'Atelier Training
training_sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  session_type text,
  discipline text,
  coach_type text,
  status text CHECK (status IN ('draft', 'active', 'completed')),
  exercises jsonb,
  completed_at timestamptz,
  rpe_avg numeric,
  duration_actual_min integer,
  -- ... autres colonnes
)

-- Métriques de performance
training_metrics (
  id uuid PRIMARY KEY,
  session_id uuid REFERENCES training_sessions,
  volume_kg numeric,
  distance_km numeric,
  reps_total integer,
  -- ... autres colonnes
)

-- Insights AI (GPT-5-mini) pour Conseils
training_insights (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  insight_type text,
  discipline text,
  content jsonb,
  recommendations jsonb[],
  expires_at timestamptz, -- Cache 7 jours
  -- ... autres colonnes
)

-- Insights AI (GPT-5-mini) pour Progression
training_progression_insights (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  period text CHECK (period IN ('week', 'month', 'quarter')),
  content jsonb, -- {paragraph1, paragraph2, recommendations}
  sessions_analyzed integer,
  expires_at timestamptz, -- Cache 24h
  -- ... autres colonnes
)

-- Objectifs d'entraînement
training_goals (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  goal_type text,
  target_value numeric,
  current_value numeric,
  is_active boolean,
  -- ... autres colonnes
)
```

### Forge Énergétique System

```sql
-- Activités globales (sync depuis training + manual)
activities (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  activity_type text,
  source text CHECK (source IN ('training_session', 'manual', 'wearable')),
  source_id uuid, -- Référence vers training_session si applicable
  calories_burned numeric,
  duration_min integer,
  activity_date timestamptz,
  -- ... autres colonnes
)

-- Activités manuelles entrées par l'utilisateur
manual_activities (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  activity_name text,
  calories_burned numeric,
  duration_min integer,
  activity_date timestamptz,
  -- ... autres colonnes
)

-- Données wearables synchronisées
wearable_data (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  device_id uuid,
  avg_hr numeric,
  calories_burned numeric,
  steps integer,
  activity_date timestamptz,
  -- ... autres colonnes
)
```

## Services et Flux de Données

### 1. trainingTodayDynamicService

**Responsabilité**: Fournir le contexte "Aujourd'hui" pour l'Atelier Training

**Méthode clé**: `getTodayContext()`

**Sources de données**:
- `training_sessions` (status: active, completed aujourd'hui, ou drafts)
- `training_goals` (objectifs actifs)
- `training_locations` (lieux d'entraînement)
- `connected_devices` (wearables connectés)

**Calculs**:
```typescript
// Stats d'aujourd'hui - UNIQUEMENT training_sessions
todayTrainingStats: {
  totalCalories: SUM(duration × RPE × facteur_métabolique),
  totalDuration: SUM(duration_actual_min),
  sessionsCount: COUNT(completed today)
}

// Score de préparation
readinessScore: {
  overall: 0-100 (moyenne pondérée),
  recovery: basé sur heures depuis dernière session,
  energy: basé sur wearable effort_score,
  consistency: basé sur streak + sessions/semaine
}
```

### 2. trainingHistoryService

**Responsabilité**: Historique des sessions d'entraînement

**Méthode clé**: `getSessionHistory(filters, page, limit)`

**Sources de données**: `training_sessions` UNIQUEMENT

**Filtres disponibles**:
- `period`: 'week' | 'month' | 'quarter' | 'year'
- `type`: 'all' | 'force' | 'endurance' | 'functional' | etc.
- `discipline`: filtrage par discipline spécifique

### 3. trainingProgressionInsightsService

**Responsabilité**: Insights AI de progression (GPT-5-mini)

**Méthode clé**: `getProgressionInsights(period)`

**Sources de données**: `training_sessions` + `training_progression_insights` (cache)

**Stratégie de cache**:
1. Local cache: 2 minutes (Map en mémoire)
2. Database cache: 24 heures (table `training_progression_insights`)
3. Génération: Appel edge function `training-progression-analyzer`

**Format insights**:
```typescript
{
  paragraph1: string, // Analyse factuelle état actuel
  paragraph2: string, // Recommandations concrètes
  recommendations: string[], // 3 actions prioritaires
  generatedAt: Date,
  expiresAt: Date, // +24h
  sessionsAnalyzed: number
}
```

### 4. trainingActivitySyncService

**Responsabilité**: Sync unidirectionnel Training → Forge

**Méthode clé**: `syncCompletedSession(sessionId)`

**Flux**:
```typescript
1. Détection: training_session status → 'completed'
2. Transformation:
   - sessionId → source_id
   - session_type → activity_type
   - duration_actual_min → duration_min
   - calories estimées (durée × RPE) → calories_burned
3. Insertion: nouvelle entrée dans activities
4. Link: activity.source = 'training_session'
```

**IMPORTANT**: Pas de sync inverse. Les manual_activities ne remontent JAMAIS dans training_sessions.

## Edge Functions avec GPT-5-mini

### 1. training-insights-generator

**But**: Générer conseils multi-disciplines (onglet Conseils)

**Modèle**: `gpt-5-mini`

**Input**:
- 90 derniers jours de `training_sessions`
- Profil utilisateur (niveau, objectifs)

**Output**:
```typescript
{
  summary: string,
  progressionTrends: {
    volume: { trend, percentage, comment },
    intensity: { trend, avgRPE, comment },
    consistency: { percentage, comment }
  },
  imbalances: [{ type, description, severity }],
  weakPoints: [{ exercise, issue, recommendation }],
  recommendations: [{
    id, title, description,
    category, priority, actionable
  }],
  nextWeekFocus: {
    suggestedSessions, focusAreas,
    intensityDistribution, restDaysRecommended
  }
}
```

**Cache**: 7 jours (`training_insights` table)

### 2. training-progression-analyzer

**But**: Générer analyse progression (onglet Progression)

**Modèle**: `gpt-5-mini`

**Input**:
- 4/12/24 semaines de `training_sessions` (selon période)
- Métriques calculées (volume, RPE, consistance)

**Output**:
```typescript
{
  paragraph1: string, // 2-3 phrases analyse factuelle
  paragraph2: string, // 2-3 phrases recommandations
  recommendations: string[] // 3 actions courtes
}
```

**Cache**: 24 heures (`training_progression_insights` table)

**Prompt structure**:
```
Tu es un coach sportif expert. Analyse les données de progression suivantes
et génère une analyse en EXACTEMENT 2 paragraphes + recommandations.

Données de progression:
- Sessions totales: X
- Volume progression: [données hebdomadaires]
- RPE moyen: X
- Consistance: X%
- Disciplines: [breakdown]
- Tendances: volume +X%, sessions +Y%

Génère:
1. Paragraphe 1: Analyse factuelle (état actuel, tendances, points forts)
2. Paragraphe 2: Recommandations (ajustements, zones à surveiller, prochaines étapes)
3. Recommendations: [3 actions courtes et actionnables]

JSON uniquement, factuel, motivant.
```

## Sécurité RLS (Row Level Security)

### Policies Training Tables

Toutes les tables training suivent ces principes:

```sql
-- SELECT: Users can view own data
CREATE POLICY "Users can view own [table]"
  ON [table]
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can insert own data
CREATE POLICY "Users can insert own [table]"
  ON [table]
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update own data
CREATE POLICY "Users can update own [table]"
  ON [table]
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete own data
CREATE POLICY "Users can delete own [table]"
  ON [table]
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Policies Forge Tables

Idem pour `activities`, `manual_activities`, `wearable_data`.

## Scénarios de Test

### Scénario A: User avec training_sessions + manual_activities

**Atelier Training**:
- Affiche UNIQUEMENT `training_sessions`
- Insights basés sur `training_sessions` uniquement
- Progression calculée depuis `training_sessions`

**Forge Énergétique**:
- Affiche `activities` (training synced + manual)
- Stats calories incluent TOUT
- Vue globale activité physique

**Résultat**: Stats différentes entre les deux = NORMAL et VOULU

### Scénario B: User sans manual_activities

**Atelier Training**:
- Affiche `training_sessions`

**Forge Énergétique**:
- Affiche `activities` (uniquement training synced)

**Résultat**: Stats identiques = OK

### Scénario C: User avec manual_activities mais pas de training

**Atelier Training**:
- Vide ou empty state
- Conseils: message starter

**Forge Énergétique**:
- Affiche `manual_activities` dans `activities`
- Tracking quotidien fonctionnel

**Résultat**: Séparation claire = OK

## Migration Path

Si un utilisateur veut migrer de Forge (manual activities) vers Training:

1. **Pas de migration automatique** - Les manual_activities restent dans Forge
2. **Nouveau départ** - User commence à créer des sessions dans Training
3. **Coexistence** - Les deux systèmes coexistent sans conflit
4. **Future feature** (optionnelle): Import manuel d'une manual_activity vers training_session template

## Avantages de cette Architecture

### 1. Séparation des Préoccupations

- **Training**: Focus performance, progression, coaching AI
- **Forge**: Focus tracking global, dépense énergétique quotidienne

### 2. Scalabilité

- Chaque système peut évoluer indépendamment
- Pas de couplage fort entre les tables
- Edge functions dédiées et spécialisées

### 3. Clarté pour l'Utilisateur

- Deux outils distincts avec des buts clairs
- Pas de confusion entre "créer une séance" vs "tracker une activité"
- Sync automatique visible (badge dans Forge: "X sessions training synchronisées")

### 4. Performance

- Caches optimisés par use case
- Queries simples (pas de JOIN complexes training/manual)
- Edge functions appelées uniquement quand nécessaire

### 5. Maintenance

- Code isolé et testable
- Services avec responsabilité unique
- Documentation claire des flux

## Diagramme Complet des Relations

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER ACTIONS                               │
└─────────────────────────────────────────────────────────────────────┘
                    │                                   │
        Create Training Session            Log Manual Activity / Sync Wearable
                    │                                   │
                    ▼                                   ▼
        ┌───────────────────────┐          ┌───────────────────────┐
        │  TRAINING WORKSHOP    │          │  FORGE ÉNERGÉTIQUE    │
        │  ─────────────────    │          │  ─────────────────    │
        │                       │          │                       │
        │  training_sessions ◄──┼──────────┼──► activities        │
        │  training_metrics     │   sync   │   (training synced   │
        │  training_goals       │          │    + manual          │
        │  training_locations   │          │    + wearable)       │
        │                       │          │                       │
        │  AI Coaches:          │          │  manual_activities   │
        │  • Force              │          │  wearable_data       │
        │  • Endurance          │          │                      │
        │  • Functional         │          │  Daily Tracking      │
        │  • Competitions       │          │  Global Stats        │
        │  • Calisthenics       │          │                      │
        │                       │          │                      │
        │  GPT-5-mini Insights: │          │                      │
        │  • Conseils (7j)      │          │                      │
        │  • Progression (24h)  │          │                      │
        └───────────────────────┘          └───────────────────────┘
                    │                                   │
                    ▼                                   ▼
        ┌───────────────────────┐          ┌───────────────────────┐
        │  TRAINING UI          │          │  FORGE UI             │
        │  ────────────         │          │  ────────            │
        │  5 Tabs:              │          │  4 Tabs:              │
        │  • Aujourd'hui        │          │  • Jour               │
        │  • Conseils           │          │  • Historique         │
        │  • Progression        │          │  • Insights           │
        │  • Records            │          │  • Progression        │
        │  • Historique         │          │                       │
        └───────────────────────┘          └───────────────────────┘
```

## Flux Illustration System

### Architecture des Illustrations

```
Training Pipeline Step 2 → Prescription générée
         ↓
Liste d'exercices extraite
         ↓
Pour chaque exercice:
  ├─ Recherche dans illustration_library
  │  ├─ Match exact trouvé → Retour immédiat
  │  └─ Pas de match → Ajouter à illustration_generation_queue
  └─ Polling client pour illustrations en attente
         ↓
Background worker (Edge Function)
  ├─ Lit la queue (priority order)
  ├─ Génère via GPT-4o (prompts par discipline)
  ├─ Stocke dans Supabase Storage
  └─ Insère dans illustration_library
         ↓
Client reçoit notification (realtime ou polling)
         ↓
Affichage de l'illustration dans Step 3
```

### Services et Tables

**illustration_library:**
- Repository central de toutes les illustrations
- Métadonnées riches: discipline, tags, muscle groups
- Usage tracking pour analytics

**illustration_generation_queue:**
- Queue asynchrone avec priorités
- Retry logic en cas d'échec
- Status tracking: pending → processing → completed/failed

**exercise_visual_metadata:**
- Catalogue enrichi pour matching intelligent
- Keywords visuels, caractéristiques de mouvement
- Permet suggestions même sans illustration existante

### Edge Functions

**generate-training-illustration:**
- Input: exercise name, discipline, context
- Génère via GPT-4o avec prompts spécialisés
- Output: image WebP optimisée
- Stockage: Supabase Storage bucket `training-illustrations`

**Caching Strategy:**
- Illustrations CDN-cached (1 an)
- Client-side cache avec React Query
- Popular exercises pregénérées offline

---

## Flux Wearable Integration

### Synchronisation des Données

```
Connected Device (Apple Watch, Garmin, etc.)
         ↓
OAuth 2.0 Authentication
         ↓
Edge Function: wearable-sync
  ├─ Fetch latest metrics via API
  ├─ Parse heart rate, calories, zones
  ├─ Validate data quality
  └─ Transform to TwinForge format
         ↓
Store in training_session_wearable_metrics
         ↓
┌──────────────────────────────────────┐
│ training_session_wearable_metrics    │
│ ├─ hr_data (timeline jsonb)          │
│ ├─ avg_hr, max_hr, min_hr           │
│ ├─ zones_distribution (Z1-Z5)       │
│ ├─ calories_burned                   │
│ ├─ effort_score (0-100)              │
│ └─ data_quality badge                │
└──────────────────────────────────────┘
         ↓
Link to training_sessions (session_id FK)
         ↓
Display in UI Components:
  ├─ WearableTodayDashboard (Today tab)
  ├─ WearableInsightsCard (Insights)
  └─ HeartRateZonesChart (Session view)
```

### Tables Relations

**connected_devices → training_session_wearable_metrics:**
- One-to-many (un device, plusieurs sessions)
- device_id FK tracking la source

**training_sessions → training_session_wearable_metrics:**
- One-to-one (une session, une métrique wearable)
- session_id PK/FK

**activities → wearable sync:**
- Lorsqu'une training_session est complétée
- Les wearable_metrics sont copiées dans activities
- Pour vue globale dans Forge Énergétique

### HR Zones Calculation

```typescript
// Calcul des zones basé sur max HR
const maxHR = user.max_heart_rate || (220 - user.age);

// Distribution par zone (en secondes)
const zones = {
  z1: timeInZone(hrData, 0.50 * maxHR, 0.60 * maxHR),
  z2: timeInZone(hrData, 0.60 * maxHR, 0.70 * maxHR),
  z3: timeInZone(hrData, 0.70 * maxHR, 0.80 * maxHR),
  z4: timeInZone(hrData, 0.80 * maxHR, 0.90 * maxHR),
  z5: timeInZone(hrData, 0.90 * maxHR, 1.00 * maxHR)
};

// Effort score (0-100)
const effortScore = calculateEffortScore(avgHR, maxHR, duration, zones);
```

### Data Quality Classification

**excellent:** >95% data completeness, <5% anomalies
**good:** 80-95% completeness, <10% anomalies
**fair:** 60-80% completeness, <20% anomalies
**poor:** <60% completeness or >20% anomalies

### Security & Privacy

**Token Encryption:**
- OAuth tokens chiffrés at rest (pg_crypto)
- Refresh automatique via Edge Functions
- Jamais exposés au client

**RLS Policies:**
```sql
CREATE POLICY "Users view own wearable data"
  ON training_session_wearable_metrics
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

---

## Flux AI Insights avec Cache

### Cache à Deux Niveaux

```
User requests insights (Conseils ou Progression tab)
         ↓
┌─────────────────────────────────────────────────┐
│ Tier 1: Memory Cache (in-service Map)          │
│ TTL: 2 minutes                                  │
│ Hit? → Return instantly (<10ms)                 │
└─────────────────────────────────────────────────┘
         ↓ Miss
┌─────────────────────────────────────────────────┐
│ Tier 2: Database Cache                          │
│ training_insights (7 days TTL)                  │
│ training_progression_insights (24h TTL)         │
│ Hit? → Return from DB (50-100ms)                │
└─────────────────────────────────────────────────┘
         ↓ Miss
┌─────────────────────────────────────────────────┐
│ Tier 3: AI Generation                           │
│ Edge Function: training-insights-generator      │
│ Model: GPT-5-mini                                │
│ Input: 90 days sessions + profile                │
│ Output: Full insights JSON                       │
│ Cost: $0.01-0.05 per request                    │
│ Duration: 3-5 seconds                            │
└─────────────────────────────────────────────────┘
         ↓
Store in database cache (Tier 2)
         ↓
Store in memory cache (Tier 1)
         ↓
Return to user
```

### Invalidation Strategy

**training_insights (Conseils):**
- Expires after 7 days
- Manual refresh button (rate limited: 1/hour)
- Invalidated on new session completion (optional)

**training_progression_insights (Progression):**
- Expires after 24 hours
- More frequent updates (daily analysis)
- Lighter payload (2 paragraphs + recommendations)

### Performance Impact

**Sans cache:**
- Latence: 3-5 secondes à chaque requête
- Coût: ~$50/mois pour 1000 utilisateurs actifs
- Charge OpenAI API: élevée

**Avec cache 2-tiers:**
- Latence Tier 1 hit: <10ms (95% des requêtes après warmup)
- Latence Tier 2 hit: 50-100ms (4% des requêtes)
- Latence Tier 3 miss: 3-5 secondes (1% des requêtes)
- Coût: ~$2-5/mois pour 1000 utilisateurs
- **Réduction coût: 90-95%**
- **Amélioration UX: instant pour 95%+ requêtes**

### Service Implementation

```typescript
// src/system/services/trainingProgressionInsightsService.ts
class InsightsCacheService {
  // Tier 1: In-memory cache
  private memoryCache = new Map<string, CachedInsight>();

  async getInsights(userId: string, type: string): Promise<Insights> {
    // 1. Check memory cache
    const memoryCacheKey = `${userId}:${type}`;
    const memoryHit = this.checkMemoryCache(memoryCacheKey);
    if (memoryHit) return memoryHit;

    // 2. Check database cache
    const dbHit = await this.checkDatabaseCache(userId, type);
    if (dbHit) {
      this.storeInMemoryCache(memoryCacheKey, dbHit);
      return dbHit;
    }

    // 3. Generate new insights
    const insights = await this.generateInsights(userId, type);
    await this.storeinDatabaseCache(userId, type, insights);
    this.storeInMemoryCache(memoryCacheKey, insights);

    return insights;
  }
}
```

---

## Flux Session State Recovery

### Auto-Save en Temps Réel

```
User performs action in Step 3 (Séance)
         ↓
┌───────────────────────────────────────┐
│ Actions déclenchant snapshot:         │
│ ├─ Set completed                      │
│ ├─ Exercise completed                 │
│ ├─ Rest period ended                  │
│ └─ Every 30 seconds (heartbeat)       │
└───────────────────────────────────────┘
         ↓
Serialize current pipeline state
         ↓
```sql
INSERT INTO session_state_snapshots (
  session_id,
  user_id,
  current_step,
  current_exercise_index,
  current_set_index,
  completed_exercises,
  completed_sets,
  pipeline_state,
  updated_at
) VALUES (...)
ON CONFLICT (session_id)
DO UPDATE SET
  current_exercise_index = EXCLUDED.current_exercise_index,
  current_set_index = EXCLUDED.current_set_index,
  completed_exercises = EXCLUDED.completed_exercises,
  completed_sets = EXCLUDED.completed_sets,
  pipeline_state = EXCLUDED.pipeline_state,
  updated_at = NOW();
```
         ↓
UI shows "Sauvegardé il y a Xs" badge
```

### Recovery Flow

```
User opens app (after interruption)
         ↓
Check for active session snapshots
```sql
SELECT * FROM session_state_snapshots
WHERE user_id = $1
  AND updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 1;
```
         ↓
Active snapshot found?
  ├─ YES → Show RecoveryModal
  │         ├─ "Reprendre" → Restore state
  │         └─ "Annuler" → Delete snapshot
  └─ NO  → Normal flow (start new session)
         ↓
If "Reprendre":
  ├─ Deserialize pipeline_state
  ├─ Load into trainingPipelineStore
  ├─ Navigate to Step 3
  └─ Resume from current_exercise_index, current_set_index
```

### Cleanup Strategy

**Automatic:**
```sql
-- Scheduled function (daily)
DELETE FROM session_state_snapshots
WHERE updated_at < NOW() - INTERVAL '7 days'
  OR session_id IN (
    SELECT id FROM training_sessions WHERE status = 'completed'
  );
```

**On Recovery Accept:**
- Keep snapshot until session completion

**On Recovery Cancel:**
- Delete snapshot immediately

---

## Conclusion

Cette architecture garantit:
- ✅ Source de données unique par module (training_sessions pour Training, activities pour Forge)
- ✅ Pas de confusion utilisateur
- ✅ Sync unidirectionnel clair et auditable
- ✅ Performance optimale (caches adaptés par use case)
- ✅ Illustrations enrichissent l'expérience utilisateur
- ✅ Wearables fournissent données biométriques précises
- ✅ AI insights avec cache réduisent coûts de 95%
- ✅ Session recovery élimine perte de progression
- ✅ Évolutivité (nouveaux coaches, nouvelles sources d'activités)
- ✅ Maintenance facilitée (code isolé, responsabilités claires)

**RÈGLE D'OR**: Ne jamais mélanger les sources. Training = training_sessions, Forge = activities (all sources).
