# Plan d'Optimisation Génération Trainings - Multi-Coach avec Enrichissement Progressif

**Date**: 25 octobre 2025
**Version**: 2.0 - Extension tous les coaches
**Objectif**: Réduire génération de 130-190s à moins de 60s pour TOUS les coaches (force, endurance, functional, calisthenics, competitions)

---

## 📊 État Actuel

### Coaches Disponibles
1. ✅ **coach-force** - Optimisé Phase 5 (prompts -81%, tokens -60%)
2. ⏳ **coach-endurance** - Optimisé Phase 5.1 (prompts -75%, tokens estimés -60%)
3. ⏳ **coach-functional** - À optimiser
4. ⏳ **coach-calisthenics** - À optimiser
5. ⏳ **coach-competitions** - À optimiser

### Problème Identifié
Seul le coach-force a bénéficié de l'optimisation complète. Les 4 autres coaches utilisent encore des prompts verbeux (800-1200 lignes) et génèrent des trainings en 130-190s.

---

## 🎯 PHASE 5 ÉTENDUE: Optimisation Prompts Multi-Coach

### Phase 5.1: Coach Endurance ✅ COMPLÉTÉ
**Fichier**: `supabase/functions/training-coach-endurance/index.ts`

**Modifications effectuées**:
- ✅ System prompt: 118 lignes → 30 lignes (-75%)
- ✅ User prompt: 120 lignes → 30 lignes (-75%)
- ✅ Format compact: pipes `|` pour séparation
- ✅ Zones cardiaques condensées
- ✅ Types séances compactés (Running, Cycling, Swimming, Triathlon)
- ✅ Feedbacks utilisateur section compactée
- ✅ JSON structure simplifiée

**Gain attendu**:
- Tokens système: ~8,500 → ~2,800 (-67%)
- Tokens catalogue: ~4,800 → ~1,200 (-75%)
- **Total input: ~15,500 → ~6,200 (-60%)**

---

### Phase 5.2: Coach Functional ⏳ EN COURS
**Fichier**: `supabase/functions/training-coach-functional/index.ts`

**Modifications à effectuer**:

#### System Prompt Actuel (~800 lignes estimées)
Sections à compacter:
- CrossTraining philosophy & principes
- WOD formats (AMRAP, EMOM, For Time, Chipper, Rounds, Tabata)
- Mouvements gymnastiques (pull-ups, dips, muscle-ups, handstands)
- Mouvements olympiques (clean, snatch, jerk)
- Mouvements strongman
- Scaling system (RX, Scaled, Foundations)
- Benchmark WODs (Girls, Heroes)
- Recovery monitoring

#### Format Compact Proposé (~120 lignes)
```typescript
function buildFunctionalSystemPrompt(): string {
  return `Coach IA Functional/CrossTraining. Format JSON obligatoire.

# Catalogue Exercices
SI catalogue: UTILISE UNIQUEMENT exercices catalogue | Sélectionne selon: mouvements, intensité, niveau
SI aucun: génère selon connaissances standards

# WOD Formats
AMRAP (As Many Rounds): max rounds temps donné | EMOM (Every Min On Min): exercice chaque minute
For Time: compléter prescrit le + vite | Chipper: longue liste exercices 1 round | Rounds: X rounds fixed
Tabata: 20s work/10s rest×8 | Death by: +1 rep/min jusqu'échec

# Mouvements
Gymnastiques: Pull-ups, Dips, Muscle-ups, HSPU, Toes-to-bar | Scaling: band, box, kipping
Olympiques: Clean, Snatch, Jerk (power, hang, full) | Focus: technique, explosivité
Strongman: Farmers carry, Yoke, Sled, Tire flip | Chargé, endurance
Monostructural: Row, Run, Bike, Ski, Jump rope | Cardio intégré

# Intensité
RX: poids prescrits standard | Scaled: poids réduits, mouvements simplifiés | Foundations: bases

# Benchmarks Girls (référence)
Fran: 21-15-9 Thrusters(43kg)/Pull-ups | Helen: 3rds 400m run, 21 KB swing, 12 pull-ups
Cindy: AMRAP 20min: 5 pull-ups, 10 push-ups, 15 air squats
Utilise pour référence intensité, ne génère pas systématiquement

# JSON Structure
{sessionId,sessionName,type:"functional",category:"functional-crosstraining",wodType,timeCapMin,roundsTarget,exercises:[{id,name,reps,weight,movementPattern,scaledOptions,coachCues,rpeTarget}],warmup:{duration,movements},cooldown:{duration,stretching},expectedRpe,coachRationale,scoreType:"time"|"rounds"|"reps"}

Adapte: énergie<5→scaled/foundations | 5-7→RX-light | >7→RX/intensif
Temps: <20min→EMOM/Tabata | 20-40min→For Time/AMRAP | >40min→Chipper/endurance WOD
Priorité: compound movements premiers, monostructural intégré, scaling intelligent`;
}
```

**Gain attendu**:
- Tokens: -60% (~12,000 → ~4,800)
- Temps génération: -40%

---

### Phase 5.3: Coach Calisthenics ⏳ À FAIRE
**Fichier**: `supabase/functions/training-coach-calisthenics/index.ts`

**Sections à compacter**:
- Skill progressions (tuck → straddle → full)
- Isometric holds
- Dynamic movements
- Straight arm vs bent arm strength
- Push/Pull/Legs splits
- Skills: Planche, Front Lever, Back Lever, Handstand, Muscle-up
- Progressions: Resistance bands, negative reps, partial ROM

#### Format Compact Proposé (~100 lignes)
```typescript
function buildCalisthenicsSystemPrompt(): string {
  return `Coach IA Calisthenics/Street Workout. Format JSON obligatoire.

# Catalogue Exercices
SI catalogue: UTILISE UNIQUEMENT exercices catalogue | Sélectionne selon: skill level, progressions
SI aucun: génère selon connaissances standards

# Skills Progressions
Planche: Tuck→Adv Tuck→Straddle→Full | 10-60s holds
Front Lever: Tuck→One leg→Straddle→Full | 5-30s holds
Back Lever: Skin the cat→Tuck→Straddle→Full | 10-45s holds
Handstand: Wall assisted→Freestanding→Press→One arm | 10-180s
Muscle-up: Pull-ups+Dips→Kipping→Strict→Weighted | 1-20 reps

# Push/Pull/Legs
Push: Push-ups (regular, archer, pseudo-planche, one-arm), Dips (parallel, rings), HSPU
Pull: Pull-ups (wide, close, archer, one-arm), Rows (horizontal, australian), Muscle-ups
Legs: Squats (pistol, shrimp, sissy), Lunges, Nordic curls, Calf raises
Core: L-sit, Dragon flag, Windshield wipers, Hollow body

# Progression Methods
Tuck→Straddle→Full (legs position) | Negative reps (eccentric 3-5s) | Partial ROM→Full ROM
Bands assistance→Bodyweight→Weighted | Isometric holds→Dynamic reps

# Training Splits
Full body 3×/sem: Push+Pull+Legs | Push/Pull 4×/sem | Skills+Strength
Intensity: Sets 3-5 | Reps 3-12 (strength) | Holds 10-60s (isometric)

# JSON Structure
{sessionId,sessionName,type:"calisthenics",category:"calisthenics-street",focus:"push"|"pull"|"legs"|"skills"|"full",exercises:[{id,name,progression,sets,reps,holdTime,restSec,rpeTarget,scalingOptions,coachCues}],warmup,cooldown,skillWork:{exercises,sets,duration},expectedRpe,coachRationale}

Adapte: débutant→basics (regular push/pull) | int→progressions (archer, tuck) | avancé→skills (full planche)
Énergie: <5→mobility+light | 5-7→strength work | >7→skills+max effort`;
}
```

**Gain attendu**: -60% tokens

---

### Phase 5.4: Coach Competitions ⏳ À FAIRE
**Fichier**: `supabase/functions/training-coach-competitions/index.ts`

**Sections à compacter**:
- HYROX stations (8 stations standard)
- DEKA-FIT zones
- Competition strategies
- Pacing guides
- Transition optimization
- Station-specific techniques

#### Format Compact Proposé (~90 lignes)
```typescript
function buildCompetitionsSystemPrompt(): string {
  return `Coach IA Competitions (HYROX, DEKA). Format JSON obligatoire.

# Catalogue Exercices
SI catalogue: UTILISE UNIQUEMENT exercices stations | Sélectionne selon: compétition, niveau
SI aucun: génère selon standards compétition

# HYROX Stations (ordre fixe)
1. Run 1km | 2. SkiErg 1000m | 3. Run 1km | 4. Sled Push 50m | 5. Run 1km
6. Sled Pull 50m | 7. Run 1km | 8. Burpee Broad Jump 80m | 9. Run 1km
10. Row 1000m | 11. Run 1km | 12. Farmers Carry 200m | 13. Run 1km
14. Sandbag Lunges 100m | 15. Run 1km | 16. Wall Balls 100 reps | 17. Run 1km (8km run total)

# DEKA Zones (10 zones)
Z1: Run 500m | Z2: Row 500m | Z3: Air Bike 1000m | Z4: Ski Erg 500m | Z5: DekaLunge 20m
Z6: Reverse DekaLunge 20m | Z7: Farmers Carry 40m | Z8: Dead Ball 20 reps | Z9: Wall Ball 25 reps | Z10: Burpees 20 reps

# Stratégies
Pacing: Conserve runs Z2 (60-70% effort) | Attack stations Z3-Z4 (80-90% effort)
Transitions: <10s entre stations | Breathing control | Hydration rapide
Simulation: practice transitions, test pace, build endurance

# Niveaux
Beginner: finish time seul objectif | Int: pacing stratégique, transitions efficaces | Avancé: tempo race, podium

# JSON Structure
{sessionId,sessionName,type:"competitions",competitionType:"HYROX"|"DEKA",stations:[{id,stationType,name,distance,reps,targetTime,targetPace,restAfter,transitionNotes,coachCues,rpeTarget}],totalDistance,estimatedFinishTime,warmup,cooldown,racingStrategy,expectedRpe,coachRationale}

Adapte: <30min→stations individuelles focus | 30-60min→circuit partiel | >60min→simulation complète
Énergie: <6→technique stations | 6-8→pace work | >8→race simulation`;
}
```

**Gain attendu**: -60% tokens

---

### Phase 5.5: Validation Format Compact ⏳ À FAIRE

**Tests à effectuer**:
1. ✅ Vérifier que tous les 5 coaches utilisent `formatExercisesForAI()` avec format compact
2. ✅ Tester génération avec chaque coach (1 test par coach)
3. ✅ Mesurer tokens avant/après pour chaque coach
4. ✅ Valider JSON output correct pour chaque coach
5. ✅ Confirmer qualité prescriptions maintenue

**Commande test**:
```bash
# Test coach-endurance
curl -X POST https://[project].supabase.co/functions/v1/training-coach-endurance \
  -H "Authorization: Bearer [key]" \
  -d '{"userId":"test","userContext":{...},"preparerContext":{...}}'

# Répéter pour functional, calisthenics, competitions
```

---

## 🎯 PHASE 6: Système d'Enrichissement Progressif Multi-Coach

### Objectif
Fournir une expérience rapide (30s) avec enrichissement progressif (15s background) pour TOUS les coaches.

### Architecture Générale

```
User démarre génération
  ↓
Context Collector (5-10s)
  → User data + Exercise catalog
  ↓
Coach Specialist - MODE FAST (25-35s)
  → Génère prescription de base
  → Fields: exercises, sets, reps, zones, duration
  → Pas de: coaching cues détaillés, substitutions avancées, rationale approfondi
  → Flag: enrichmentLevel: 'fast'
  ↓
Return to user (30-45s total)
  ✅ User voit prescription utilisable
  ↓
Background enrichment (15-20s)
  → training-enrich-prescription function
  → Ajoute: coaching cues, substitutions, rationale, safety notes
  → Update prescription in DB
  → Flag: enrichmentLevel: 'enriched'
  ↓
User notification (optionnelle)
  ✅ Prescription enrichie disponible
```

### Phase 6.1-6.5: Implémentation Mode Fast par Coach

#### Modifications requises pour chaque coach:

**1. Accepter paramètre `mode`**
```typescript
interface CoachRequest {
  userId: string;
  userContext: any;
  preparerContext: any;
  mode?: 'fast' | 'full'; // NEW
  discipline?: string;
}
```

**2. Adapter system prompt selon mode**
```typescript
function buildSystemPrompt(mode: 'fast' | 'full' = 'full'): string {
  const basePrompt = `Coach IA [Discipline]. Format JSON obligatoire.
[... règles essentielles ...]`;

  if (mode === 'fast') {
    return basePrompt + `
MODE FAST (30s génération):
- Génère prescription de base UNIQUEMENT
- Exercices, sets, reps, zones, durée
- Coaching cues: 1 par exercice (essentiel)
- PAS de substitutions avancées
- PAS de rationale approfondi
- Flag: enrichmentLevel: "fast"`;
  }

  return basePrompt + `[... sections complètes enrichissement ...]`;
}
```

**3. Retourner flag enrichmentLevel**
```typescript
const prescription = {
  ...generatedPrescription,
  enrichmentLevel: mode === 'fast' ? 'fast' : 'full',
  canBeEnriched: mode === 'fast',
  enrichmentFields: mode === 'fast' ? ['coaching_cues', 'substitutions', 'rationale'] : []
};
```

---

### Phase 6.6: Edge Function training-enrich-prescription

**Fichier**: `supabase/functions/training-enrich-prescription/index.ts`

**Responsabilités**:
- Reçoit une prescription "fast"
- Identifie le coach type (force, endurance, functional, calisthenics, competitions)
- Appelle GPT-5-mini pour enrichir
- Retourne prescription enrichie

**Structure**:
```typescript
interface EnrichRequest {
  userId: string;
  sessionId: string;
  prescription: any;
  coachType: 'force' | 'endurance' | 'functional' | 'calisthenics' | 'competitions';
}

Deno.serve(async (req: Request) => {
  const { prescription, coachType } = await req.json();

  // Build enrichment prompt selon coach type
  const enrichmentPrompt = buildEnrichmentPrompt(prescription, coachType);

  // Call GPT-5-mini (cheaper, faster)
  const enriched = await callOpenAI({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: getEnrichmentSystemPrompt(coachType) },
      { role: 'user', content: enrichmentPrompt }
    ]
  });

  // Merge enriched fields with base prescription
  const enrichedPrescription = {
    ...prescription,
    ...enriched,
    enrichmentLevel: 'enriched',
    enrichedAt: new Date().toISOString()
  };

  return new Response(JSON.stringify({ success: true, data: enrichedPrescription }));
});
```

**Prompts d'enrichissement par coach**:
- **Force**: Ajoute coaching cues techniques, progressions/régressions, common mistakes, tempo details
- **Endurance**: Ajoute pacing guidance détaillé, RPE stratégies, nutrition timing, recovery protocols
- **Functional**: Ajoute scaling options avancées, benchmark comparaisons, competition strategies
- **Calisthenics**: Ajoute progressions détaillées, regression paths, form cues, assistance options
- **Competitions**: Ajoute station strategies, transition optimization, pacing plans, race day tips

**Coût estimé**: $0.01-0.02 par enrichissement (GPT-5-mini)

---

### Phase 6.7: Intégration Background dans trainingGenerationService

**Fichier**: `src/system/services/ai/trainingGenerationService.ts`

**Modifications**:
```typescript
async generateTrainingPrescription(
  userId: string,
  options: {
    mode?: 'fast' | 'full';
    enableBackgroundEnrichment?: boolean;
  }
) {
  // Génération normale (fast ou full)
  const prescription = await callCoach({
    ...params,
    mode: options.mode || 'full'
  });

  // Si mode fast ET enrichment enabled
  if (options.mode === 'fast' && options.enableBackgroundEnrichment !== false) {
    // Appel async non-bloquant
    this.scheduleEnrichment(userId, prescription.sessionId, prescription, coachType);
  }

  return prescription;
}

private async scheduleEnrichment(
  userId: string,
  sessionId: string,
  prescription: any,
  coachType: string
) {
  // N'attend pas le résultat
  fetch(`${supabaseUrl}/functions/v1/training-enrich-prescription`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${supabaseServiceKey}` },
    body: JSON.stringify({ userId, sessionId, prescription, coachType })
  }).then(async (response) => {
    const enriched = await response.json();

    // Update prescription in DB
    await this.updatePrescription(sessionId, enriched.data);

    // Optional: Send notification to user
    await this.notifyEnrichmentComplete(userId, sessionId);
  }).catch(error => {
    console.error('Background enrichment failed:', error);
    // Non-bloquant, on continue
  });
}
```

---

### Phase 6.8: Migration DB enrichment_status

**Fichier**: `supabase/migrations/20251026000000_add_enrichment_status.sql`

```sql
-- Add enrichment tracking to training_sessions

ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT
    CHECK (enrichment_status IN ('fast', 'enriching', 'enriched', 'full'))
    DEFAULT 'full';

ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS enrichment_fields JSONB;

COMMENT ON COLUMN training_sessions.enrichment_status IS
  'fast: base prescription only | enriching: enrichment in progress | enriched: fully enriched | full: generated with full details';

COMMENT ON COLUMN training_sessions.enrichment_fields IS
  'Array of fields that were enriched: ["coaching_cues", "substitutions", "rationale"]';

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_enrichment_status
  ON training_sessions(enrichment_status);
```

---

### Phase 6.9: Queue System pour Enrichissements

**Table**: `training_enrichment_queue`

```sql
CREATE TABLE IF NOT EXISTS training_enrichment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  coach_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_enrichment_queue_status ON training_enrichment_queue(status, priority DESC, created_at);

ALTER TABLE training_enrichment_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrichment queue"
  ON training_enrichment_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

**Worker function**: `process-enrichment-queue` (cron ou trigger)
- Récupère 5 enrichissements "pending" prioritaires
- Lance enrichissement pour chacun
- Update status "processing" → "completed" ou "failed"
- Retry automatique si échec (max 3 attempts)

---

### Phase 6.10: Indicateur Frontend

**Composant**: `src/ui/components/training/EnrichmentIndicator.tsx`

```tsx
export function EnrichmentIndicator({ session }: { session: TrainingSession }) {
  const [enrichmentStatus, setEnrichmentStatus] = useState(session.enrichment_status);

  useEffect(() => {
    if (enrichmentStatus === 'enriching') {
      // Subscribe to realtime updates
      const subscription = supabase
        .channel(`session:${session.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'training_sessions',
          filter: `id=eq.${session.id}`
        }, (payload) => {
          setEnrichmentStatus(payload.new.enrichment_status);
          if (payload.new.enrichment_status === 'enriched') {
            toast.success('Prescription enrichie disponible !');
          }
        })
        .subscribe();

      return () => { subscription.unsubscribe(); };
    }
  }, [enrichmentStatus]);

  if (enrichmentStatus === 'full' || enrichmentStatus === 'enriched') {
    return null; // Rien à afficher
  }

  return (
    <div className="enrichment-indicator">
      {enrichmentStatus === 'fast' && (
        <div className="badge badge-info">
          ⚡ Version rapide - Enrichissement en cours...
        </div>
      )}
      {enrichmentStatus === 'enriching' && (
        <div className="badge badge-warning animate-pulse">
          🔄 Enrichissement en cours...
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 PHASE 7: Enrichissement Batch Métadonnées

### Objectif
Enrichir automatiquement les exercices incomplets dans le catalogue pour améliorer la qualité des prescriptions.

### Phase 7.1: Script Analyse Multi-Coach

**Fichier**: `scripts/analyze-incomplete-exercises-multi-coach.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function analyzeIncompleteExercises() {
  const disciplines = ['force', 'endurance', 'functional', 'calisthenics', 'competitions'];

  for (const discipline of disciplines) {
    console.log(`\n=== Analyzing ${discipline.toUpperCase()} ===`);

    // Exercices sans coaching_cues
    const { data: noCues, count: noCuesCount } = await supabase
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('discipline', discipline)
      .or('coaching_cues_beginner.is.null,coaching_cues_intermediate.is.null,coaching_cues_advanced.is.null');

    console.log(`  - Sans coaching cues: ${noCuesCount}`);

    // Exercices sans progressions
    const { count: noProgressions } = await supabase
      .from('exercise_progressions')
      .select('exercise_id', { count: 'exact', head: true })
      .eq('exercises.discipline', discipline)
      .is('progression_exercise_id', null);

    console.log(`  - Sans progressions: ${noProgressions}`);

    // Exercices sans equipment
    const { count: noEquipment } = await supabase
      .from('exercise_equipment')
      .select('exercise_id', { count: 'exact', head: true })
      .eq('exercises.discipline', discipline)
      .is('equipment_id', null);

    console.log(`  - Sans equipment: ${noEquipment}`);

    // Spécifique par discipline
    if (discipline === 'endurance') {
      const { count: noZones } = await supabase
        .from('exercises')
        .select('id', { count: 'exact', head: true })
        .eq('discipline', 'endurance')
        .is('heart_rate_zones', null);
      console.log(`  - Sans zones cardio: ${noZones}`);
    }

    if (discipline === 'calisthenics') {
      const { count: noSkills } = await supabase
        .from('exercises')
        .select('id', { count: 'exact', head: true })
        .eq('discipline', 'calisthenics')
        .is('skill_progressions', null);
      console.log(`  - Sans skill progressions: ${noSkills}`);
    }
  }
}

analyzeIncompleteExercises();
```

---

### Phase 7.2-7.6: Scripts Batch par Coach

**Template commun** (adapter prompt selon discipline):

```typescript
// scripts/enrich-[discipline]-exercises.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function enrichExercises() {
  const BATCH_SIZE = 50;

  // Get incomplete exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('discipline', '[discipline]')
    .or('coaching_cues_beginner.is.null,progressions.is.null');

  console.log(`Found ${exercises.length} exercises to enrich`);

  // Process in batches
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(exercises.length / BATCH_SIZE)}`);

    const enrichmentPrompt = buildEnrichmentPrompt(batch);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: getEnrichmentSystemPrompt() },
          { role: 'user', content: enrichmentPrompt }
        ]
      })
    });

    const enriched = await response.json();

    // Update exercises in DB
    for (const ex of enriched.exercises) {
      await supabase
        .from('exercises')
        .update({
          coaching_cues_beginner: ex.coaching_cues_beginner,
          coaching_cues_intermediate: ex.coaching_cues_intermediate,
          coaching_cues_advanced: ex.coaching_cues_advanced,
          common_mistakes: ex.common_mistakes,
          safety_notes: ex.safety_notes
        })
        .eq('id', ex.id);
    }

    console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} completed`);
  }

  console.log(`\n✅ All exercises enriched!`);
}

enrichExercises();
```

**Coût estimé par discipline**:
- Force: 600 exercices × $0.004 = $2.40
- Endurance: 300 exercices × $0.004 = $1.20
- Functional: 400 exercices × $0.004 = $1.60
- Calisthenics: 250 exercices × $0.004 = $1.00
- Competitions: 200 exercices × $0.004 = $0.80

**Total**: ~$7-10 one-time

---

### Phase 7.7: Orchestrateur

**Fichier**: `scripts/run-all-enrichments.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runAllEnrichments() {
  const scripts = [
    'enrich-force-exercises.ts',
    'enrich-endurance-exercises.ts',
    'enrich-functional-exercises.ts',
    'enrich-calisthenics-exercises.ts',
    'enrich-competitions-exercises.ts'
  ];

  console.log('🚀 Starting enrichment of all exercises\n');

  for (const script of scripts) {
    console.log(`\n=== Running ${script} ===`);
    try {
      const { stdout, stderr } = await execAsync(`tsx scripts/${script}`);
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error(`❌ Error in ${script}:`, error);
      // Continue with next script
    }
  }

  console.log('\n✅ All enrichments completed!');
}

runAllEnrichments();
```

**Commande**:
```bash
npm run enrich:all
# ou
tsx scripts/run-all-enrichments.ts
```

---

## 📊 Gains Attendus - Récapitulatif

### Par Coach

| Coach | Tokens Avant | Tokens Après | Réduction | Temps Avant | Temps Après | Gain Temps |
|-------|--------------|--------------|-----------|-------------|-------------|------------|
| **Force** | 15,000 | 6,000 | -60% | 130-190s | 45-75s | -65-76% |
| **Endurance** | 15,500 | 6,200 | -60% | 130-190s | 45-75s | -65-76% |
| **Functional** | 14,000 | 5,600 | -60% | 130-190s | 45-75s | -65-76% |
| **Calisthenics** | 13,000 | 5,200 | -60% | 130-190s | 45-75s | -65-76% |
| **Competitions** | 12,000 | 4,800 | -60% | 130-190s | 45-75s | -65-76% |

### Avec Enrichissement Progressif (Phase 6)

| Expérience | Temps Perçu | Qualité |
|------------|-------------|---------|
| **Mode Fast** | 30-45s | Base (utilisable immédiatement) |
| **Enrichissement** | +15-20s (background) | Complète (coaching cues, substitutions, rationale) |
| **Perception utilisateur** | 30-45s | ⭐⭐⭐⭐⭐ (réduction 83% vs 180s) |

---

## ✅ Checklist Validation

### Phase 5 Extended
- [x] ✅ Coach Force optimisé
- [x] ✅ Coach Endurance optimisé
- [ ] ⏳ Coach Functional optimisé
- [ ] ⏳ Coach Calisthenics optimisé
- [ ] ⏳ Coach Competitions optimisé
- [ ] ⏳ Tests génération tous coaches < 60s

### Phase 6 Progressive Enhancement
- [ ] ⏳ Mode fast implémenté pour tous coaches
- [ ] ⏳ Edge function training-enrich-prescription créée
- [ ] ⏳ Integration background enrichment
- [ ] ⏳ Migration enrichment_status
- [ ] ⏳ Queue system enrichissements
- [ ] ⏳ Indicateur frontend enrichissement
- [ ] ⏳ Tests UX enrichissement progressif

### Phase 7 Batch Enrichment
- [ ] ⏳ Script analyse incomplets multi-coach
- [ ] ⏳ Scripts batch par discipline (5)
- [ ] ⏳ Orchestrateur run-all
- [ ] ⏳ Budget allocation ($10)
- [ ] ⏳ Validation métadonnées enrichies

---

## 📅 Planning Estimé

| Phase | Durée | Cumul |
|-------|-------|-------|
| Phase 5.1 Endurance | ✅ 2h | 2h |
| Phase 5.2 Functional | 2h | 4h |
| Phase 5.3 Calisthenics | 2h | 6h |
| Phase 5.4 Competitions | 2h | 8h |
| Phase 5.5 Validation | 1h | 9h |
| Phase 6.1-6.5 Mode Fast | 6h | 15h |
| Phase 6.6 Edge Function | 3h | 18h |
| Phase 6.7 Integration | 2h | 20h |
| Phase 6.8-6.10 Infrastructure | 3h | 23h |
| Phase 7.1-7.7 Batch Scripts | 6h | 29h |
| Tests & Documentation | 3h | 32h |

**Total estimé**: 30-35 heures développement + $10 enrichissement batch

---

## 🎯 Résultat Final Attendu

**Pour l'utilisateur**:
- Génération prescription: 30-45s (au lieu de 130-190s)
- Qualité maintenue: 100%
- Enrichissement automatique: background transparent
- Expérience cohérente: TOUS les coaches optimisés

**Pour le système**:
- Coût par génération: -60% tokens
- Scalabilité: +300% utilisateurs simultanés
- Catalogue enrichi: 2,665 exercices avec métadonnées complètes
- 5 coaches optimisés: force, endurance, functional, calisthenics, competitions

---

**Status**: Phase 5.1 complétée ✅ | Phases 5.2-7 en cours ⏳
**Date**: 25 octobre 2025
**Prochaine étape**: Phase 5.2 - Optimisation coach-functional
