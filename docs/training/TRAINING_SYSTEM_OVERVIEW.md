# Training System - Complete Overview

**Version:** 1.0.0 (MVP)
**Last Updated:** October 2025
**Status:** MVP Operational (5 Coaches Implemented)

**Note:** For a concise MVP summary, see [TRAINING_FORGE_MVP.md](./TRAINING_FORGE_MVP.md)

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Training Pipeline (5 Steps)](#training-pipeline-5-steps)
3. [Coach Specialization System](#coach-specialization-system)
4. [Equipment Detection & Matching](#equipment-detection--matching)
5. [Illustration System](#illustration-system)
6. [Wearable Integration](#wearable-integration)
7. [Draft System](#draft-system)
8. [AI Insights & Cache Strategy](#ai-insights--cache-strategy)
9. [Session State Recovery](#session-state-recovery)
10. [Data Flow & Synchronization](#data-flow--synchronization)
11. [Edge Functions](#edge-functions)
12. [Database Schema](#database-schema)
13. [UI Components Organization](#ui-components-organization)
14. [Performance Optimizations](#performance-optimizations)
15. [Future Enhancements](#future-enhancements)

---

## System Architecture

### High-Level Overview

```
User Profile (Training Preferences) → Coach Assignment
                 ↓
        5-Step Training Pipeline
                 ↓
    ┌─────────────────────────────────┐
    │  Step 1: Préparer (Prepare)   │  Context collection
    │  Step 2: Activer (Activate)   │  AI prescription generation
    │  Step 3: Séance (Session)     │  Live training execution
    │  Step 4: Adapter (Analyze)    │  Performance analysis
    │  Step 5: Avancer (Progress)   │  Next steps & progression
    └─────────────────────────────────┘
                 ↓
    Persistent Training Data + AI Analysis
                 ↓
        5 Dashboard Tabs
    (Today / Conseils / Progression / Records / History)
```

### Core Principles

1. **Context-Driven**: Every training session is adapted to user's current state
2. **AI-Powered**: GPT-5-mini specialized coaches with domain expertise
3. **Progressive**: Intelligent load progression based on performance
4. **Data-Safe**: All training data persisted with RLS policies
5. **Equipment-Aware**: Computer vision detects available equipment from photos
6. **Source Integrity**: ONLY training_sessions data (no manual activities mixing)

### Data Source Architecture

**CRITICAL**: The Training Workshop (Atelier) uses a **single, exclusive data source**:

```
┌──────────────────────────────────────────────────────────┐
│                 ATELIER TRAINING                         │
│              (Creation & Tracking)                       │
│                                                          │
│  Source: training_sessions ONLY                         │
│  • Sessions with 5 AI coaches                           │
│  • Real workout data                                    │
│  • Performance metrics                                  │
│  • AI analysis & insights                               │
│                                                          │
│  Tabs:                                                  │
│  ├─ Aujourd'hui: Today's training context              │
│  ├─ Conseils: AI coaching insights (GPT-5-mini)        │
│  ├─ Progression: Trends & AI analysis (GPT-5-mini)     │
│  ├─ Records: Personal bests                            │
│  └─ Historique: Session history                        │
└──────────────────────────────────────────────────────────┘
                         ↓
              Unidirectional Sync
                         ↓
┌──────────────────────────────────────────────────────────┐
│               FORGE ÉNERGÉTIQUE                          │
│              (Global Activity View)                      │
│                                                          │
│  Sources: training_sessions + manual_activities         │
│  • Training sessions (synced)                           │
│  • Manual activities (walk, swim, etc.)                 │
│  • Complete energy expenditure                          │
│  • Global activity trends                               │
└──────────────────────────────────────────────────────────┘
```

**Rules:**
- ❌ **NEVER**: Forge → Atelier (no backward sync)
- ✅ **ALWAYS**: Atelier → Forge (automatic forward sync)
- Atelier = CREATION space (workout with coaches)
- Forge = TRACKING space (all activities overview)

---

## Training Pipeline (5 Steps)

### Step 1: Préparer (Prepare) 🎯

**Purpose**: Collect contextual information for optimal training prescription

**Inputs Collected**:
- Energy level (1-10 scale)
- Available time (minutes)
- Training location (with detected equipment)
- Current pain/discomfort areas
- Recovery status from previous session

**UI Components**:
- `LocationQuickSelector`: Quick location picker
- `PhotoGallery`: Display location photos with equipment
- `EquipmentChip`: Visual equipment tags
- `TrainingCoachNotificationBubble`: Coach feedback

**Data Flow**:
```typescript
{
  energy: number,
  availableTime: number,
  locationId: string,
  equipment: string[],
  painAreas: string[],
  notes?: string
}
```

**Database Tables Used**:
- `training_locations` (user locations with photos)
- `training_location_equipment_detected` (AI-detected equipment)

---

### Step 2: Activer (Activate) ⚡

**Purpose**: AI generates personalized training prescription and allows discussion

**Features**:
- AI coach analyzes Step 1 context
- Generates exercise prescription (exercises, sets, reps, loads, tempo, rest, RPE)
- Interactive chat with coach
- Exercise substitution suggestions
- Feedback panel for quick adjustments

**UI Components**:
- `CoachChatInterface`: Main chat window
- `TrainingPrescriptionCard`: Exercise details with substitutions
- `WarmupCard`: Warmup phase prescription
- `ExerciseCardSkeleton`: Loading state
- `FeedbackPanel`: Quick feedback buttons

**Edge Functions**:
- `training-coach-force` (or specialized coach): Generates prescription
- `training-context-collector`: Gathers user context for AI

**Prescription Structure**:
```typescript
{
  type: 'force' | 'hypertrophy' | 'endurance' | 'mobility',
  warmup: Exercise[],
  main: Exercise[],
  cooldown: Exercise[],
  estimatedDuration: number,
  targetRPE: number,
  substitutions: Record<string, Exercise[]>
}
```

---

### Step 3: Séance (Session) 💪

**Purpose**: Live training execution with real-time tracking

**Features**:
- Pre-session briefing
- Exercise-by-exercise progression (Force)
- Block-by-block progression (Endurance)
- Set countdown timers
- Rest period countdowns
- Transition countdowns between exercises/blocks
- Real-time RPE tracking
- Exercise feedback (too easy/hard, change, remove)
- Session summary statistics
- Post-session feedback modal (text + voice)

**UI Components**:

**Force Sessions**:
- `PreSessionBriefing`: Overview before starting
- `ExerciseSessionCard`: Active exercise display
- `NextExercisePreview`: What's coming next
- `FloatingTimerCard`: Current set/rest timer
- `PreparationCountdown`: Get ready countdown
- `SetCountdown`: Rep countdown during set
- `TransitionCountdown`: Moving to next exercise
- `WarmupPhaseCard`: Warmup execution
- `SessionSummaryStats`: Post-session summary
- `SessionFeedbackModal`: Text + voice feedback collection

**Endurance Sessions**:
- `EnduranceSessionDisplay`: Main endurance session component
- `EnduranceBlockCard`: Current block display (warmup/intervals/tempo/cooldown)
- `EnduranceStickyHeaderV2`: Session time, zone, progress
- `EnduranceCountdownHelper`: Preparation and transition countdowns
- `EnduranceStopModal`: Stop confirmation
- `SessionFeedbackModal`: Text + voice feedback collection
- `DevModeControls`: Developer testing tools

**Real-Time Tracking (Force)**:
```typescript
{
  exerciseId: string,
  setNumber: number,
  reps: number,
  load: number,
  rpe: number,
  completed: boolean,
  feedback?: ExerciseFeedback
}
```

**Real-Time Tracking (Endurance)**:
```typescript
{
  blockId: string,
  blockIndex: number,
  blockType: 'warmup' | 'continuous' | 'intervals' | 'tempo' | 'cooldown',
  durationActual: number,
  avgHeartRate?: number,
  rpe: number,
  completed: boolean
}
```

**Database Tables Used**:
- `training_sessions` (session metadata for both force and endurance)
- `training_session_exercises` (exercise tracking for force)
- `training_session_sets` (set-by-set data for force)
- `training_session_endurance_blocks` (block tracking for endurance)
- `training_session_intervals` (interval tracking for endurance)
- `training_session_user_feedback` (text/voice feedback for all session types)

---

### Step 4: Adapter (Analyze) 📊

**Purpose**: AI analyzes session performance and provides adaptations

**Features**:
- Performance analysis per exercise
- Global session score
- Technique analysis
- Personalized insights
- Achievement badges
- Adaptation recommendations

**UI Components**:
- `PersonalizedMetricsCard`: Key performance metrics
- `ExerciseAnalysisCard`: Per-exercise breakdown
- `SessionBadgesCard`: Earned achievements
- `ScoreGlobalCard`: Overall session score
- `TechniqueAnalysisCard`: Form and technique feedback
- `PersonalizedInsightsCard`: AI-generated insights

**Edge Functions**:
- `training-coach-analyzer`: Analyzes session performance
- `training-context-collector`: Gathers recovery & context data

**Analysis Output**:
```typescript
{
  sessionScore: number,
  volumeLoad: number,
  intensityAverage: number,
  rpeAverage: number,
  badges: Badge[],
  insights: Insight[],
  adaptations: Adaptation[]
}
```

---

### Step 5: Avancer (Progress) 🚀

**Purpose**: Plan next session and track long-term progression

**Features**:
- Recovery status
- Next session recommendations
- Progression path visualization
- Motivational insights
- Quick actions (schedule next, adjust goal, etc.)

**UI Components**:
- `RecoveryStatusCard`: Current recovery state
- `NextActionRecommendationCard`: Suggested next steps
- `NextSessionRecommendationsCard`: Next workout preview
- `ProgressionPathCard`: Long-term progression plan
- `MotivationalInsightCard`: Motivational message
- `QuickActionsGrid`: Quick action buttons

**Data Tracking**:
- Recovery markers (soreness, fatigue, readiness)
- Progression triggers (when to increase load/volume)
- Optimal training window recommendations

---

## Coach Specialization System

### Coach Architecture

Each coach is a specialized AI agent with:
- Domain-specific prompts and expertise
- Equipment knowledge (300+ items catalog)
- Exercise selection algorithms
- Progression strategies
- Periodization models

### Current Coaches

#### 1. Coach Force (Operational) 💎
**Specializations**: Strength, Powerlifting, Bodybuilding, Strongman

**Training Categories**:
```typescript
{
  id: 'force-powerbuilding',
  coachSpecialization: 'force',
  types: ['strength', 'powerlifting', 'bodybuilding', 'strongman']
}
```

**Periodization Models**:
- Linear (beginners)
- Undulating (intermediate)
- Conjugate (advanced)
- Daily Undulating Periodization (DUP)

**Equipment Expertise**:
- Free weights (barbells, dumbbells, kettlebells)
- Machines (Smith, cable, leg press, etc.)
- Strongman equipment (log, axle bar, stones, yoke, etc.)
- Calisthenics structures (rings, parallettes, pegboard)

**Progression Strategies**:
- +2.5-5kg linear progression (beginners)
- Wave loading (intermediate)
- Block periodization (advanced)
- Auto-regulation via RPE

### Future Coaches (Roadmap)

#### 2. Coach Endurance (Operational) ✅
**Specializations**: Running, Cycling, Swimming, Triathlon, Cardio

**Training Categories**:
```typescript
{
  id: 'endurance-cardio',
  coachSpecialization: 'endurance',
  types: ['running', 'cycling', 'swimming', 'triathlon', 'cardio']
}
```

**Session Types**:
- Continuous endurance (Z2-Z3 steady state)
- Interval training (HIIT, Tabata, VO2max intervals)
- Tempo runs/rides (threshold training)
- Long slow distance (LSD) sessions
- Fartlek training

**Heart Rate Zones**:
- Z1: Active Recovery (50-60% max HR)
- Z2: Aerobic Base (60-70% max HR)
- Z3: Tempo (70-80% max HR)
- Z4: Threshold (80-90% max HR)
- Z5: VO2max (90-100% max HR)

**Feedback Collection**:
- Post-session modal with text + voice input
- RPE tracking per zone
- Hydration and nutrition tracking
- Zone adherence feedback

**Edge Function**: `training-coach-endurance`

---

#### 3. Coach Functional (Implemented) ⚙️
**Specializations**: CrossFit, HIIT, Functional Training, Circuit Training

**Training Categories**:
```typescript
{
  id: 'functional-crosstraining',
  coachSpecialization: 'functional',
  types: ['crossfit', 'hiit', 'functional', 'circuit']
}
```

**Status**: Edge Function deployed, testing phase
**Edge Function**: `training-coach-functional`

---

#### 4. Coach Competitions (Implemented) ⚙️
**Specializations**: HYROX, DEKA FIT, DEKA MILE, DEKA STRONG

**Status**: Edge Function deployed, testing phase
**Edge Function**: `training-coach-competitions`

---

#### 5. Coach Calisthenics (Implemented) ⚙️
**Specializations**: Calisthenics, Street Workout, Streetlifting, Freestyle

**Status**: Edge Function deployed, testing phase
**Edge Function**: `training-coach-calisthenics`

---

### Future Coaches (Out of MVP Scope)

**Not Implemented - Roadmap Phase 2+:**

- **Coach Wellness** (Yoga, Pilates, Mobility, Stretching) - Phase 2
- **Coach Combat** (Boxing, Kickboxing, MMA, Martial Arts) - Phase 3
- **Coach Sports** (Basketball, Football, Tennis, Sport-specific) - Phase 3
- **Coach Mixed** (Mixed training, Custom programs) - Phase 2

---

## Equipment Detection & Matching

### Photo Analysis Pipeline

```
User uploads location photos
         ↓
Edge Function: detect-equipment
         ↓
GPT-4o Vision Analysis
         ↓
Equipment extraction & categorization
         ↓
Stored in: training_location_equipment_detected
         ↓
Background processing via: process-detection-jobs
```

### Equipment Catalog

**300+ Equipment Items** organized by:

1. **Home Equipment** (100+ items)
   - Base: bodyweight, yoga mat, resistance bands, jump rope
   - Force: dumbbells, kettlebells, barbell sets, medicine balls
   - Structure: pull-up bar, dip station, benches, racks
   - Cardio: bikes, treadmills, rowers
   - Accessories: ab wheel, foam roller, TRX

2. **Gym Equipment** (200+ items)
   - Free weights: complete dumbbell sets, Olympic barbells, EZ bars
   - Racks & benches: squat racks, power racks, adjustable benches
   - Machines: Smith machine, cable machines, leg press, leg curl/extension
   - Cardio: rowers, treadmills, bikes, ellipticals, stair climbers, assault bikes
   - Functional: battle ropes, slam balls, plyo boxes, TRX
   - Recovery: foam rollers, massage guns

3. **Outdoor Equipment** (60+ items)
   - Street workout: public pull-up bars, parallel bars, public benches
   - Terrain: stairs, hills, parks
   - Running/cycling: tracks, trails, bikes, rollerblades
   - Sports facilities: sports fields, basketball/soccer courts, pools, beaches

### Equipment Matching Algorithm

```typescript
function matchExerciseToEquipment(
  exercise: Exercise,
  availableEquipment: string[]
): ExerciseMatch {
  // 1. Check required equipment
  // 2. Find alternatives if not available
  // 3. Suggest substitutions
  // 4. Adapt movement patterns to equipment
}
```

---

## Illustration System

### Overview

The Illustration System generates and manages AI-powered visual representations for training sessions and exercises, enhancing user experience with contextual imagery.

**Status**: ✅ Operational (Production)

### Architecture

```
User requests session → Coach generates prescription
         ↓
Exercise list extracted
         ↓
Illustration matching algorithm
         ↓
┌─────────────────────────────────────┐
│  Existing in library?               │
│  YES → Return cached illustration   │
│  NO  → Add to generation queue      │
└─────────────────────────────────────┘
         ↓
Background worker processes queue
         ↓
GPT-4o Vision generates illustration
         ↓
Store in illustration_library + storage
         ↓
Client polls and displays when ready
```

### Core Tables

#### illustration_library
Central repository for all illustrations (AI-generated and procedural).

```sql
CREATE TABLE illustration_library (
  id uuid PRIMARY KEY,
  type text CHECK (type IN ('session', 'exercise')),
  discipline text CHECK (discipline IN ('force', 'endurance', 'functional', 'competitions', 'calisthenics')),
  exercise_name text,
  exercise_name_normalized text,
  focus_tags text[],
  equipment_tags text[],
  muscle_groups text[],
  movement_pattern text,
  intensity_level text,
  visual_style text,
  view_angle text,
  image_url text NOT NULL,
  thumbnail_url text,
  generation_source text CHECK (generation_source IN ('ai', 'procedural', 'manual')),
  quality_score float,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**Indexes:**
- `idx_illustration_library_exercise_name` on `exercise_name_normalized`
- `idx_illustration_library_discipline` on `discipline`
- `idx_illustration_library_tags` on `focus_tags`, `equipment_tags`

#### exercise_visual_metadata
Enriched catalog for intelligent matching even without existing illustrations.

```sql
CREATE TABLE exercise_visual_metadata (
  id uuid PRIMARY KEY,
  exercise_name text UNIQUE NOT NULL,
  exercise_name_normalized text UNIQUE NOT NULL,
  visual_keywords text[],
  movement_characteristics text[],
  primary_muscle_groups text[],
  equipment_required text[],
  suggested_view_angles text[],
  difficulty_visual_cues text[]
);
```

#### illustration_generation_queue
Async generation queue with prioritization.

```sql
CREATE TABLE illustration_generation_queue (
  id uuid PRIMARY KEY,
  exercise_name text NOT NULL,
  discipline text NOT NULL,
  priority integer DEFAULT 5,
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count integer DEFAULT 0,
  error_message text,
  requested_by uuid REFERENCES auth.users,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
```

### Generation Process

**AI Generation (GPT-4o):**
1. Prompt engineering based on discipline
2. Visual style consistent with brand (minimalist, modern)
3. Accurate anatomical representation
4. Equipment and movement context
5. Multiple variations generated per exercise

**Procedural Generation:**
- Simple diagrams for basic exercises
- Muscle group highlighting
- Movement arrows and annotations
- Faster generation for common exercises

### Matching Algorithm

```typescript
function matchIllustration(
  exerciseName: string,
  discipline: string
): IllustrationMatch {
  // 1. Normalize exercise name (lowercase, remove accents)
  const normalized = normalizeExerciseName(exerciseName);

  // 2. Exact match in library
  const exact = library.find(ill => ill.exercise_name_normalized === normalized);
  if (exact) return { illustration: exact, confidence: 1.0 };

  // 3. Fuzzy match based on visual metadata
  const fuzzy = findSimilarExercise(normalized, discipline);
  if (fuzzy && fuzzy.confidence > 0.7) {
    return { illustration: fuzzy.illustration, confidence: fuzzy.confidence };
  }

  // 4. Queue for generation
  queueIllustrationGeneration(exerciseName, discipline);
  return { illustration: null, queued: true };
}
```

### Storage

**Supabase Storage Bucket:** `training-illustrations`

**Structure:**
```
training-illustrations/
├── sessions/
│   └── {session_id}/
│       ├── hero.webp
│       └── thumbnail.webp
├── exercises/
│   └── {discipline}/
│       └── {normalized_exercise_name}/
│           ├── main.webp
│           ├── variation-1.webp
│           └── thumbnail.webp
└── diptychs/
    └── {exercise_name}/
        ├── left-phase.webp
        └── right-phase.webp
```

**RLS Policies:**
- Authenticated users can read all illustrations
- Only Edge Functions can write (via service role key)

### Edge Functions

**generate-training-illustration:**
- Generates illustrations using GPT-4o
- Discipline-specific prompt generators
- Stores in library + storage
- Updates queue status

### Performance Optimizations

**Caching:**
- CDN caching for all illustration URLs (1 year)
- Client-side cache with React Query
- Usage count tracking for popular illustrations

**Lazy Loading:**
- Illustrations load on-demand during session
- Progressive image loading (thumbnail → full)
- Placeholder while generating

**Pregeneration:**
- Common exercises pregenerated offline
- Priority queue for frequently requested exercises

### Future Enhancements

- [ ] 3D model generation for complex movements
- [ ] Video clips for dynamic exercises
- [ ] User-uploaded custom illustrations
- [ ] AR overlay for real-time form feedback

---

## Wearable Integration

### Overview

The Wearable Integration system synchronizes health and fitness data from connected devices (Apple Watch, Garmin, Whoop, etc.) to enrich training sessions with real-time biometric metrics.

**Status**: ✅ Operational (MVP)

### Supported Metrics

**Heart Rate Data:**
- Average HR (bpm)
- Max HR (bpm)
- Min HR (bpm)
- HR timeline (jsonb array)
- HR zones distribution (Z1-Z5)

**Effort Metrics:**
- Calories burned
- Effort score (0-100)
- Recovery score
- Training stress score (TSS)

**Activity Tracking:**
- Steps count
- Active minutes
- Distance (for endurance activities)
- Pace/speed data

### Core Tables

#### training_session_wearable_metrics

```sql
CREATE TABLE training_session_wearable_metrics (
  session_id uuid PRIMARY KEY REFERENCES training_sessions,
  user_id uuid REFERENCES auth.users NOT NULL,
  device_id uuid REFERENCES connected_devices,
  hr_data jsonb, -- Timeline: [{timestamp, value}]
  avg_hr integer,
  max_hr integer,
  min_hr integer,
  zones_distribution jsonb, -- {z1: 120, z2: 480, z3: 300, z4: 60, z5: 0} seconds
  calories_burned integer,
  effort_score integer CHECK (effort_score >= 0 AND effort_score <= 100),
  data_quality text CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor')),
  device_name text,
  synced_at timestamptz DEFAULT now()
);
```

**Indexes:**
- `idx_wearable_metrics_user_date` on `user_id`, `synced_at`
- `idx_wearable_metrics_device` on `device_id`

#### connected_devices

```sql
CREATE TABLE connected_devices (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  device_type text CHECK (device_type IN ('apple_watch', 'garmin', 'whoop', 'fitbit', 'polar', 'coros')),
  device_name text,
  device_model text,
  status text CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
  last_sync_at timestamptz,
  sync_frequency_minutes integer DEFAULT 15,
  oauth_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### HR Zones Calculation

**Zone Definition (% of max HR):**
- **Z1 (Recovery)**: 50-60% max HR - Active recovery
- **Z2 (Aerobic Base)**: 60-70% max HR - Endurance building
- **Z3 (Tempo)**: 70-80% max HR - Lactate threshold
- **Z4 (Threshold)**: 80-90% max HR - VO2max improvement
- **Z5 (Max)**: 90-100% max HR - Anaerobic power

**Max HR Calculation:**
```typescript
// Default formula if not provided by user
const maxHR = 220 - age;

// Or user-provided from max HR test
const maxHR = profile.max_heart_rate;
```

**Zone Assignment:**
```typescript
function getHRZone(heartRate: number, maxHR: number): string {
  const percentage = (heartRate / maxHR) * 100;
  if (percentage < 60) return 'Z1';
  if (percentage < 70) return 'Z2';
  if (percentage < 80) return 'Z3';
  if (percentage < 90) return 'Z4';
  return 'Z5';
}
```

### UI Components

**WearableTodayDashboard:**
- Displays today's wearable metrics
- HR zones distribution with animated bars
- Calories and effort score cards
- Data quality badge
- Heart icon with pulse animation

**WearableInsightsCard:**
- Training stress analysis
- Recovery recommendations
- Zone distribution trends
- Optimal training windows

**HeartRateZonesChart:**
- Time spent in each zone (visualization)
- Target vs actual distribution
- Zone efficiency analysis

### Data Sync Flow

```
Connected Device → OAuth API
         ↓
Edge Function: wearable-sync
         ↓
Parse & validate metrics
         ↓
Store in training_session_wearable_metrics
         ↓
Trigger UI refresh (realtime)
         ↓
Display in WearableTodayDashboard
```

### Edge Functions

**wearable-sync:**
- Authenticates with device APIs
- Fetches latest metrics
- Stores in database
- Handles token refresh

**wearable-oauth-callback:**
- Handles OAuth flow completion
- Stores encrypted tokens
- Sets sync frequency

### Security

**Token Encryption:**
- OAuth tokens encrypted at rest
- Only Edge Functions can decrypt (service role)
- Automatic token refresh

**RLS Policies:**
- Users can only view their own wearable data
- No cross-user data leakage

### Future Enhancements

- [ ] Real-time HR streaming during session
- [ ] HRV (Heart Rate Variability) tracking
- [ ] Sleep quality integration
- [ ] Automatic workout detection
- [ ] Multi-device aggregation

---

## Draft System

### Overview

The Draft System allows users to save training prescriptions (generated in Step 2) without executing them, enabling flexible planning and session management.

**Status**: ✅ Operational

### Features

**Save Draft:**
- User generates prescription in Step 2
- Can save without starting session
- Custom name for identification
- Auto-expires after 48 hours

**Resume Draft:**
- View saved drafts in "Today" tab
- One-click resume to Step 2
- All prescription data preserved
- Can edit before starting

**Draft Management:**
- Multiple drafts allowed
- Delete unwanted drafts
- Automatic cleanup of expired drafts

### Database Schema

#### training_sessions (extended)

```sql
-- New columns added for draft support
ALTER TABLE training_sessions
ADD COLUMN status text DEFAULT 'scheduled'
  CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'skipped')),
ADD COLUMN custom_name text,
ADD COLUMN draft_expires_at timestamptz,
ADD COLUMN draft_saved_at timestamptz;

-- Indexes
CREATE INDEX idx_training_sessions_user_status
  ON training_sessions(user_id, status);

CREATE INDEX idx_training_sessions_draft_expires
  ON training_sessions(draft_expires_at)
  WHERE status = 'draft';
```

### Status Lifecycle

```
draft → scheduled → in_progress → completed
  ↓
skipped
```

**Draft:** Saved prescription, not started
**Scheduled:** Ready to start (default for backward compatibility)
**In Progress:** Step 3 session active
**Completed:** All 5 steps finished
**Skipped:** User decided not to do this session

### UI Components

**SavedDraftsCard:**
- Shows all user drafts
- Custom name + timestamp
- Resume button
- Delete button
- Expiration countdown

**Draft Save Flow:**
1. User completes Step 2 (prescription generated)
2. Click "Save Draft" instead of "Start Session"
3. Modal prompts for custom name (optional)
4. Draft saved with 48h expiration
5. Redirect to Today tab

**Draft Resume Flow:**
1. User clicks "Resume" on SavedDraftsCard
2. Loads prescription data into pipeline store
3. Navigates to Step 2 (can review/edit)
4. Can start session or save changes

### Automatic Cleanup

**Cron Job (Optional):**
```sql
-- Delete expired drafts (could be a scheduled function)
DELETE FROM training_sessions
WHERE status = 'draft'
  AND draft_expires_at < NOW();
```

**Manual Cleanup:**
Users can manually delete drafts anytime via UI.

### Business Logic

**Draft Limits:**
- No hard limit on number of drafts
- Soft recommendation: keep <10 active drafts
- UI shows warning if >5 drafts

**Expiration Logic:**
```typescript
const DRAFT_EXPIRATION_HOURS = 48;

function createDraft(session: TrainingSession): Draft {
  return {
    ...session,
    status: 'draft',
    draft_saved_at: new Date(),
    draft_expires_at: addHours(new Date(), DRAFT_EXPIRATION_HOURS)
  };
}
```

### Future Enhancements

- [ ] Share drafts with coach/friends
- [ ] Templates from favorite drafts
- [ ] Schedule drafts for specific date/time
- [ ] Recurring drafts (weekly programs)

---

## AI Insights & Cache Strategy

### Overview

The AI Insights system generates personalized training recommendations and progression analysis using GPT-5-mini, with a sophisticated two-tier caching strategy to optimize performance and cost.

**Status**: ✅ Operational

### Two-Tier Cache Architecture

```
Request → Memory Cache (2 min) → Database Cache (7 days / 24h) → AI Generation
              ↓ HIT                    ↓ HIT                         ↓ MISS
            Return                   Return                    Generate + Store
```

**Tier 1: Memory Cache**
- In-memory Map in service
- TTL: 2 minutes
- Scope: Current server instance
- Use case: Rapid repeated requests

**Tier 2: Database Cache**
- Stored in database tables
- TTL: Varies by insight type
- Scope: Global (all instances)
- Use case: Recent but stale data

### Insights Types

#### 1. Training Advice (Conseils Tab)

**Table:** `training_insights`

```sql
CREATE TABLE training_insights (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  insight_type text, -- 'advice' | 'recommendation' | 'warning'
  discipline text,
  content jsonb, -- {summary, progressionTrends, imbalances, weakPoints, recommendations, nextWeekFocus}
  sessions_analyzed integer,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- +7 days
  UNIQUE(user_id, insight_type)
);
```

**Cache Duration:** 7 days

**Invalidation Triggers:**
- New session completed
- User manually requests refresh
- Expiration reached

**Content Structure:**
```typescript
{
  summary: string,
  progressionTrends: {
    volume: { trend: 'up' | 'down' | 'stable', percentage: number, comment: string },
    intensity: { trend, avgRPE, comment },
    consistency: { percentage, comment }
  },
  imbalances: [{ type, description, severity }],
  weakPoints: [{ exercise, issue, recommendation }],
  recommendations: [{
    id, title, description, category, priority, actionable
  }],
  nextWeekFocus: {
    suggestedSessions, focusAreas, intensityDistribution, restDaysRecommended
  }
}
```

#### 2. Progression Analysis (Progression Tab)

**Table:** `training_progression_insights`

```sql
CREATE TABLE training_progression_insights (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  period text CHECK (period IN ('week', 'month', 'quarter')),
  content jsonb, -- {paragraph1, paragraph2, recommendations}
  sessions_analyzed integer,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- +24 hours
  UNIQUE(user_id, period)
);
```

**Cache Duration:** 24 hours

**Content Structure:**
```typescript
{
  paragraph1: string, // Factual analysis of current state
  paragraph2: string, // Concrete recommendations
  recommendations: string[] // 3 priority actions
}
```

### Edge Functions

#### training-insights-generator

**Purpose:** Generate multi-discipline training advice (Conseils tab)

**Model:** GPT-5-mini

**Input:**
```typescript
{
  userId: string,
  last90Days: TrainingSession[],
  profile: UserProfile
}
```

**Output:** Full insights object (see structure above)

**Prompt Engineering:**
```typescript
const prompt = `
Tu es un coach sportif expert multicompétence. Analyse les 90 derniers jours
d'entraînement et génère des insights actionnables.

Données de progression:
- Sessions totales: ${sessionsCount}
- Volume moyen: ${avgVolume}kg/semaine
- RPE moyen: ${avgRPE}/10
- Disciplines: ${disciplines.join(', ')}
- Tendances: volume ${volumeTrend}, intensité ${intensityTrend}

Génère un objet JSON avec:
1. summary: Vue d'ensemble en 2-3 phrases
2. progressionTrends: Analyse détaillée volume, intensité, consistance
3. imbalances: Déséquilibres groupes musculaires ou patterns
4. weakPoints: Points faibles identifiés avec recommandations
5. recommendations: 5-7 actions prioritaires actionnables
6. nextWeekFocus: Plan pour la semaine suivante

Ton ton est: factuel, motivant, expertise scientifique, pas de bullshit.
`;
```

#### training-progression-analyzer

**Purpose:** Generate progression analysis (Progression tab)

**Model:** GPT-5-mini

**Input:**
```typescript
{
  userId: string,
  period: 'week' | 'month' | 'quarter',
  sessions: TrainingSession[]
}
```

**Output:**
```typescript
{
  paragraph1: string,
  paragraph2: string,
  recommendations: string[]
}
```

**Prompt Engineering:**
```typescript
const prompt = `
Analyse les données de progression suivantes et génère une analyse
en EXACTEMENT 2 paragraphes + 3 recommandations.

Données:
- Période: ${period}
- Sessions: ${sessionsCount}
- Volume évolution: ${volumeChange}%
- RPE moyen: ${avgRPE}
- Consistance: ${consistency}%

Format JSON strict:
{
  "paragraph1": "Analyse factuelle: état actuel, tendances, points forts",
  "paragraph2": "Recommandations: ajustements, zones à surveiller, étapes",
  "recommendations": ["Action 1", "Action 2", "Action 3"]
}
`;
```

### Cache Service Implementation

```typescript
class InsightsCacheService {
  private memoryCache = new Map<string, { data: any; expiresAt: Date }>();

  async getInsights(userId: string, type: string): Promise<Insights> {
    // Tier 1: Memory cache
    const memoryCacheKey = `${userId}:${type}`;
    const memoryHit = this.memoryCache.get(memoryCacheKey);
    if (memoryHit && memoryHit.expiresAt > new Date()) {
      return memoryHit.data;
    }

    // Tier 2: Database cache
    const dbHit = await supabase
      .from('training_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('insight_type', type)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (dbHit.data) {
      // Store in memory cache
      this.memoryCache.set(memoryCacheKey, {
        data: dbHit.data.content,
        expiresAt: addMinutes(new Date(), 2)
      });
      return dbHit.data.content;
    }

    // Tier 3: Generate new insights
    const insights = await this.generateInsights(userId, type);

    // Store in database cache
    await supabase.from('training_insights').upsert({
      user_id: userId,
      insight_type: type,
      content: insights,
      generated_at: new Date(),
      expires_at: addDays(new Date(), 7)
    });

    // Store in memory cache
    this.memoryCache.set(memoryCacheKey, {
      data: insights,
      expiresAt: addMinutes(new Date(), 2)
    });

    return insights;
  }
}
```

### Performance Impact

**Without Cache:**
- AI generation: 3-5 seconds per request
- Cost: $0.01-0.05 per request
- Load on OpenAI API: High

**With Two-Tier Cache:**
- Memory cache hit: <10ms
- Database cache hit: 50-100ms
- AI generation: Only when expired or new user
- Cost reduction: 95%+
- User experience: Instant

### Manual Refresh

**UI Button:** "Actualiser les insights"
- Bypasses cache
- Forces new AI generation
- Updates database cache
- Shows loading indicator

**Rate Limiting:**
- Max 1 manual refresh per hour per user
- Prevents abuse and cost explosion

---

## Session State Recovery

### Overview

The Session State Recovery system ensures that users never lose progress if their training session is interrupted (browser closed, network loss, device crash).

**Status**: ✅ Operational

### Core Concept

Every action during Step 3 (Séance) is immediately persisted to the database, allowing complete session recovery at any point.

### Database Tables

#### session_state_snapshots

```sql
CREATE TABLE session_state_snapshots (
  id uuid PRIMARY KEY,
  session_id uuid REFERENCES training_sessions NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  current_step integer NOT NULL, -- 1-5
  current_exercise_index integer,
  current_set_index integer,
  completed_exercises jsonb[], -- Array of completed exercise IDs
  completed_sets jsonb[], -- Array of completed set data
  pipeline_state jsonb, -- Full pipeline store state
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_session_state_user_session
  ON session_state_snapshots(user_id, session_id);

CREATE INDEX idx_session_state_updated
  ON session_state_snapshots(updated_at DESC);
```

### Recovery Flow

```
User opens app after interruption
         ↓
Check for active session in DB
         ↓
┌────────────────────────────────────┐
│ Active session found?              │
│ YES → Load state & offer recovery  │
│ NO  → Normal flow                  │
└────────────────────────────────────┘
         ↓
User confirms recovery
         ↓
Restore pipeline store state
         ↓
Navigate to Step 3 with recovered data
         ↓
Continue from last completed set
```

### State Snapshot Strategy

**When to Snapshot:**
- After each set completion
- After each exercise completion
- After rest period
- Every 30 seconds during active session

**What to Store:**
```typescript
{
  sessionId: uuid,
  currentStep: 3,
  currentExerciseIndex: 2,
  currentSetIndex: 1,
  completedExercises: [
    { exerciseId, sets: [...], completed: true }
  ],
  completedSets: [
    { exerciseId, setNumber, reps, load, rpe, timestamp }
  ],
  pipelineState: {
    // Full trainingPipelineStore state
  }
}
```

### UI Components

**RecoveryModal:**
Shows when active session detected on app open.

```typescript
<Modal>
  <h3>Session en cours détectée</h3>
  <p>Vous avez une session démarrée le {date} à {time}</p>
  <p>Exercice en cours: {currentExercise}</p>
  <p>Progression: {completedSets}/{totalSets} séries</p>

  <Button onClick={handleRecover}>Reprendre</Button>
  <Button onClick={handleDiscard}>Annuler la session</Button>
</Modal>
```

**AutoSaveIndicator:**
Small badge showing last save time during session.

```typescript
<Badge>
  <Icon name="check" />
  Sauvegardé il y a {secondsAgo}s
</Badge>
```

### Recovery Service

```typescript
class SessionStateManager {
  async checkForActiveSession(userId: string): Promise<ActiveSession | null> {
    const snapshot = await supabase
      .from('session_state_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!snapshot.data) return null;

    // Check if session is still "active" (< 24h old)
    const hoursSinceUpdate = differenceInHours(new Date(), new Date(snapshot.data.updated_at));
    if (hoursSinceUpdate > 24) return null;

    return {
      sessionId: snapshot.data.session_id,
      snapshot: snapshot.data
    };
  }

  async recoverSession(sessionId: string): Promise<void> {
    const snapshot = await this.getLatestSnapshot(sessionId);

    // Restore pipeline store
    trainingPipelineStore.setState(snapshot.pipeline_state);

    // Navigate to Step 3
    navigate('/training/pipeline?step=3');
  }

  async saveSnapshot(state: SessionState): Promise<void> {
    await supabase.from('session_state_snapshots').upsert({
      session_id: state.sessionId,
      user_id: state.userId,
      current_step: state.currentStep,
      current_exercise_index: state.currentExerciseIndex,
      current_set_index: state.currentSetIndex,
      completed_exercises: state.completedExercises,
      completed_sets: state.completedSets,
      pipeline_state: state.pipelineState,
      updated_at: new Date()
    });
  }
}
```

### Automatic Cleanup

**Cleanup Strategy:**
- Delete snapshots > 7 days old
- Delete snapshots for completed sessions
- Keep only latest snapshot per session

```sql
-- Cleanup function (can be scheduled)
DELETE FROM session_state_snapshots
WHERE updated_at < NOW() - INTERVAL '7 days'
  OR session_id IN (
    SELECT id FROM training_sessions WHERE status = 'completed'
  );
```

### Edge Cases Handled

**Multiple Devices:**
- Latest snapshot wins
- Show warning if session active on another device

**Network Offline:**
- Queue snapshots locally
- Sync when online
- Conflict resolution: latest timestamp wins

**Session Expiration:**
- Sessions older than 24h considered abandoned
- User can still recover but with warning

### Future Enhancements

- [ ] Offline-first with IndexedDB
- [ ] Conflict resolution UI for multi-device
- [ ] Session analytics (recovery rate, abandonment rate)
- [ ] Smart recovery suggestions based on time elapsed

---

## Data Flow & Synchronization

### State Management

**Zustand Stores**:
- `trainingPipelineStore`: Pipeline state, current step, session data
- `coachChatStore`: Coach conversation history
- `trainingCoachStore`: Coach notifications and context
- `userStore`: User profile and preferences

**React Query**:
- Training locations fetching and caching
- Session history queries
- Progression data aggregation

### Persistence Strategy

**Real-Time**:
- Step 1 context → `useTrainingPipeline` store
- Step 2 prescription → `trainingPipelineStore.sessionPrescription`
- Step 3 set tracking → Immediate DB write after each set

**Batched**:
- Step 4 analysis → After session completion
- Step 5 recommendations → On pipeline completion

---

## Edge Functions

### 1. training-coach-force
**Purpose**: Generate Force/Powerbuilding training prescriptions

**Input**:
```typescript
{
  userId: string,
  context: {
    energy: number,
    time: number,
    equipment: string[],
    painAreas: string[],
    location: string
  },
  profile: UserProfile,
  history: TrainingSession[]
}
```

**Output**:
```typescript
{
  prescription: SessionPrescription,
  reasoning: string,
  alternatives: Exercise[]
}
```

**AI Model**: GPT-4o (with force-specific prompts)

---

### 2. training-context-collector
**Purpose**: Collect and optimize user context for AI analysis

**Input**:
```typescript
{
  userId: string,
  sessionId?: string,
  contextType: 'pre-session' | 'post-session' | 'recovery'
}
```

**Output**:
```typescript
{
  profile: ProfileContext,
  recentSessions: SessionSummary[],
  recovery: RecoveryMetrics,
  equipment: EquipmentAvailability,
  goals: TrainingGoals
}
```

---

### 3. training-coach-analyzer
**Purpose**: Analyze session performance and provide insights

**Input**:
```typescript
{
  sessionId: string,
  userId: string,
  sessionData: CompletedSession
}
```

**Output**:
```typescript
{
  score: number,
  analysis: PerformanceAnalysis,
  insights: Insight[],
  badges: Badge[],
  adaptations: Adaptation[]
}
```

---

### 4. training-exercise-regenerate
**Purpose**: Regenerate specific exercises during session (substitutions)

**Input**:
```typescript
{
  exerciseId: string,
  reason: 'too-hard' | 'too-easy' | 'equipment' | 'pain',
  context: SessionContext
}
```

**Output**:
```typescript
{
  newExercise: Exercise,
  reasoning: string
}
```

---

### 5. training-voice-transcribe
**Purpose**: Transcribe voice feedback during session

**Input**: Audio blob (WebM/MP3)

**Output**:
```typescript
{
  text: string,
  confidence: number,
  intent?: 'feedback' | 'question' | 'adjustment'
}
```

**AI Model**: Whisper-1

---

### 6. detect-equipment
**Purpose**: Detect equipment from location photos

**Input**:
```typescript
{
  locationId: string,
  photoUrls: string[],
  locationType: 'home' | 'gym' | 'outdoor'
}
```

**Output**:
```typescript
{
  detected: DetectedEquipment[],
  confidence: number,
  suggestions: string[]
}
```

**AI Model**: GPT-4o Vision

---

### 7. process-detection-jobs
**Purpose**: Background processing of equipment detection jobs

**Trigger**: Scheduled (every 5 minutes) or on-demand

**Function**: Processes pending detection jobs in queue

---

## Database Schema

### Core Tables

#### training_locations
```sql
CREATE TABLE training_locations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'home' | 'gym' | 'outdoor'
  address TEXT,
  notes TEXT,
  photo_urls TEXT[],
  equipment_list TEXT[], -- manually selected
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### training_location_equipment_detected
```sql
CREATE TABLE training_location_equipment_detected (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES training_locations NOT NULL,
  photo_url TEXT NOT NULL,
  equipment_detected TEXT[] NOT NULL,
  confidence FLOAT,
  detection_metadata JSONB,
  detected_at TIMESTAMPTZ DEFAULT now()
);
```

#### training_goals
```sql
CREATE TABLE training_goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  goal_type TEXT NOT NULL,
  target_value FLOAT,
  current_value FLOAT,
  unit TEXT,
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### training_sessions
```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  location_id UUID REFERENCES training_locations,
  coach_type TEXT NOT NULL,
  session_type TEXT,
  context JSONB NOT NULL, -- Step 1 data
  prescription JSONB NOT NULL, -- Step 2 data
  performance JSONB, -- Step 3 tracking
  analysis JSONB, -- Step 4 results
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### training_session_exercises
```sql
CREATE TABLE training_session_exercises (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES training_sessions NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_category TEXT,
  target_sets INTEGER,
  target_reps INTEGER,
  target_load FLOAT,
  target_rpe INTEGER,
  actual_sets INTEGER,
  completed BOOLEAN DEFAULT false,
  feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### training_session_sets
```sql
CREATE TABLE training_session_sets (
  id UUID PRIMARY KEY,
  exercise_id UUID REFERENCES training_session_exercises NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  load FLOAT,
  rpe INTEGER,
  rest_seconds INTEGER,
  completed_at TIMESTAMPTZ
);
```

### AI Context Tables

#### training_ai_context_snapshots
```sql
CREATE TABLE training_ai_context_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  session_id UUID REFERENCES training_sessions,
  context_type TEXT NOT NULL,
  context_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### training_session_analysis
```sql
CREATE TABLE training_session_analysis (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES training_sessions NOT NULL,
  analysis_type TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  insights TEXT[],
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## UI Components Organization

### Current Structure (Flat)
All 78 components in `/src/ui/components/training/*.tsx`

### Proposed Structure (Organized)

```
training/
├── session/           # Live session components
│   ├── ExerciseSessionCard.tsx
│   ├── NextExercisePreview.tsx
│   ├── FloatingTimerCard.tsx
│   ├── PreparationCountdown.tsx
│   ├── SetCountdown.tsx
│   ├── TransitionCountdown.tsx
│   ├── SessionSummaryStats.tsx
│   ├── SessionFeedbackModal.tsx
│   └── PreSessionBriefing.tsx
│
├── cards/             # Stat & info cards
│   ├── CurrentGoalCard.tsx
│   ├── RecoveryStatusCard.tsx
│   ├── ScoreGlobalCard.tsx
│   ├── TrainingPrescriptionCard.tsx
│   ├── WarmupCard.tsx
│   ├── WarmupPhaseCard.tsx
│   ├── PersonalizedMetricsCard.tsx
│   ├── PersonalizedInsightsCard.tsx
│   ├── ExerciseAnalysisCard.tsx
│   ├── TechniqueAnalysisCard.tsx
│   ├── SessionBadgesCard.tsx
│   ├── MotivationalInsightCard.tsx
│   ├── NextActionRecommendationCard.tsx
│   ├── NextSessionRecommendationsCard.tsx
│   ├── ProgressionPathCard.tsx
│   ├── AdaptiveRecommendationsCard.tsx
│   └── NextWeekPlanCard.tsx
│
├── location/          # Location management
│   ├── LocationQuickSelector.tsx
│   ├── TrainingLocationManager.tsx
│   ├── LocationEditorModal.tsx
│   ├── LocationPhotoCapture.tsx
│   ├── LocationTypeCard.tsx
│   ├── EquipmentDetectionViewer.tsx
│   ├── EquipmentSelector.tsx
│   ├── PhotoGallery.tsx
│   └── EquipmentChip.tsx
│
├── history/           # History & stats
│   ├── HistoryFilterBar.tsx
│   ├── SessionHistoryTimeline.tsx
│   ├── HistoryStatsOverview.tsx
│   ├── QuickHistoryCard.tsx
│   └── TimelineItem.tsx
│
├── progression/       # Charts & metrics
│   ├── ProgressionOverviewCard.tsx
│   ├── ProgressionTrendChart.tsx
│   ├── VolumeProgressionChart.tsx
│   ├── StrengthEvolutionChart.tsx
│   ├── MuscleGroupProgressGrid.tsx
│   ├── VolumeIntensityBalanceGauge.tsx
│   ├── ConsistencyCalendarHeatmap.tsx
│   ├── WeeklyPatternHeatmap.tsx
│   ├── PersonalRecordsGrid.tsx
│   ├── PersonalBestsTimeline.tsx
│   ├── AchievementsBadgesGrid.tsx
│   ├── MilestonesProgressCard.tsx
│   └── LazyProgressionComponent.tsx
│
├── today/             # Today tab components
│   ├── HeroTrainingCTA.tsx
│   ├── TodayStatusWidget.tsx
│   ├── QuickInsightsGrid.tsx
│   ├── QuickActionsGrid.tsx
│   ├── NextActionSuggestion.tsx
│   └── MeasurableGoalsSection.tsx
│
├── skeletons/         # Loading states
│   ├── ExerciseCardSkeleton.tsx
│   ├── LocationCardSkeleton.tsx
│   └── (other skeletons)
│
└── shared/            # Shared primitives
    ├── GlowIcon.tsx
    ├── TrainingCoachNotificationBubble.tsx
    ├── ProgressBarAnimated.tsx
    ├── StatComparisonBadge.tsx
    ├── TrendIndicator.tsx
    └── RecoveryGauge.tsx
```

---

## Future Enhancements

### Phase 2: Multi-Coach Support
- Implement all 9 specialized coaches
- Coach routing based on profile preferences
- Coach handoffs for mixed training

### Phase 3: Advanced Analytics
- Machine learning progression predictions
- Injury risk prediction
- Form analysis via computer vision
- Voice coaching with real-time feedback

### Phase 4: Social & Gamification
- Training buddies
- Leaderboards
- Challenges and competitions
- Achievement system expansion

### Phase 5: Integration
- Wearable data (Apple Watch, Garmin, Whoop)
- Gym equipment integration (Bluetooth weights)
- Smart home gym equipment

---

---

## See Also

- **[TRAINING_FORGE_MVP.md](./TRAINING_FORGE_MVP.md)** - Concise MVP documentation
- **[TRAINING_DISCIPLINES_AND_COACHES.md](./TRAINING_DISCIPLINES_AND_COACHES.md)** - Disciplines & coaches
- **[TRAINING_PAGE_TABS.md](./TRAINING_PAGE_TABS.md)** - Dashboard tabs documentation
- **[COACH_FORCE_SPECIFICATION.md](./COACH_FORCE_SPECIFICATION.md)** - Coach Force specification
- **[COACH_ENDURANCE_SPECIFICATION.md](./COACH_ENDURANCE_SPECIFICATION.md)** - Coach Endurance specification

---

**Document Version**: 1.0.0 (MVP)
**Next Review**: Post MVP testing phase
**Maintained By**: TwinForge AI Team
