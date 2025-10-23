# Training Forge - MVP Scope & Status

**Version:** 1.0.0 (MVP)
**Last Updated:** October 2025
**Status:** Operational - 5 Coaches Implemented
**Scope:** Core training system with specialized AI coaches

---

## Table of Contents

1. [MVP Overview](#mvp-overview)
2. [5-Step Training Pipeline](#5-step-training-pipeline)
3. [Specialized Coaches (5 Implemented)](#specialized-coaches-5-implemented)
4. [Training Dashboard (4 Tabs)](#training-dashboard-4-tabs)
5. [Equipment Detection System](#equipment-detection-system)
6. [Edge Functions Architecture](#edge-functions-architecture)
7. [Database Schema](#database-schema)
8. [Out of MVP Scope](#out-of-mvp-scope)
9. [Roadmap Phase 2+](#roadmap-phase-2)

---

## MVP Overview

Training Forge is TwinForge's AI-powered training system that generates personalized workout programs through a 5-step pipeline with specialized coaches.

### MVP Scope (Current)

**✅ Implemented:**
- 5-step training pipeline (Préparer → Activer → Séance → Analyser → Avancer)
- 5 specialized AI coaches with domain expertise
- Equipment detection via computer vision (GPT-4o Vision)
- Training locations management with photo analysis
- Real-time session tracking (Force & Endurance disciplines)
- AI-powered performance analysis
- Multi-discipline support (Force, Functional, Competitions, Calisthenics, Endurance)

**🔄 In Development:**
- Training Dashboard 4 tabs (partial functionality)
- Progression analytics and insights
- Historical data visualization

**❌ Not in MVP:**
- Apple Health / Google Fit integration
- Wearable device synchronization
- Advanced ML-based predictions
- Social features and leaderboards

---

## 5-Step Training Pipeline

### Architecture

```
User Profile → Context Collection → AI Coach → Live Session → Analysis → Progression

┌─────────────────────────────────────────────────────────────────────┐
│                    Training Forge Pipeline                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 1: Préparer (Prepare)         Progress: 0-20%                │
│  └─ Collect context (energy, time, location, equipment, recovery)  │
│                                                                     │
│  Step 2: Activer (Activate)         Progress: 21-40%               │
│  └─ AI generates prescription + interactive chat                   │
│                                                                     │
│  Step 3: Séance (Session)           Progress: 41-70%               │
│  └─ Live tracking with timers, RPE, feedback                       │
│                                                                     │
│  Step 4: Analyser (Analyze)         Progress: 71-90%               │
│  └─ AI analyzes performance + insights + badges                    │
│                                                                     │
│  Step 5: Avancer (Progress)         Progress: 91-100%              │
│  └─ Recovery status + next session recommendations                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step Details

#### Step 1: Préparer (Prepare) 🎯
**Purpose:** Collect contextual information

**Inputs:**
- Energy level (1-10 scale)
- Available time (15-120 minutes)
- Training location (with equipment detected)
- Pain/discomfort areas
- Recovery status from previous session

**Key Features:**
- Quick location selector
- Photo gallery with equipment visibility
- Equipment detection status display
- Coach feedback bubble

#### Step 2: Activer (Activate) ⚡
**Purpose:** AI prescription generation & discussion

**Features:**
- Specialized coach analyzes context
- Generates exercise prescription (sets, reps, load, tempo, rest, RPE)
- Interactive chat with coach
- Exercise substitution suggestions
- Quick feedback panel

**Edge Functions:**
- `training-coach-{force|endurance|functional|calisthenics|competitions}`
- `training-context-collector`

#### Step 3: Séance (Session) 💪
**Purpose:** Live training execution

**Features:**
- Pre-session briefing
- Exercise-by-exercise progression (Force disciplines)
- Block-by-block progression (Endurance disciplines)
- Set countdown timers
- Rest period countdowns
- Transition countdowns
- Real-time RPE tracking
- Exercise feedback (too easy/hard, change, remove)
- Post-session feedback modal (text + voice)

**Discipline-Specific UIs:**
- **Force/Powerbuilding:** Exercise cards with set tracking
- **Endurance:** Block cards with zone tracking and pacing guide
- **Functional/CrossFit:** WOD display with round tracking
- **Competitions:** Station-based progression for HYROX/DEKA
- **Calisthenics:** Skill-based progressions

#### Step 4: Analyser (Analyze) 📊
**Purpose:** AI performance analysis

**Features:**
- Performance analysis per exercise/block
- Global session score (1-100)
- Technique analysis
- Personalized insights
- Achievement badges
- Adaptation recommendations

**Edge Function:** `training-coach-analyzer`

#### Step 5: Avancer (Progress) 🚀
**Purpose:** Plan next session & track progression

**Features:**
- Recovery status display
- Next session recommendations
- Progression path visualization
- Motivational insights
- Quick actions (schedule next, adjust goal)

---

## Specialized Coaches (5 Implemented)

### 1. Coach Force (Operational ✅)

**Specializations:** Strength, Powerlifting, Bodybuilding, Strongman

**Disciplines:**
- `strength` - Musculation (Force et hypertrophie)
- `powerlifting` - Powerlifting (Force maximale)
- `bodybuilding` - Bodybuilding (Esthétique)
- `strongman` - Strongman (Force athlétique)

**Periodization Models:**
- Linear (beginners)
- Undulating (intermediate)
- Conjugate (advanced)
- Daily Undulating Periodization (DUP)

**Equipment Expertise:** 200+ items (free weights, machines, strongman equipment)

**Edge Function:** `training-coach-force`

**Documentation:** [COACH_FORCE_SPECIFICATION.md](./COACH_FORCE_SPECIFICATION.md)

---

### 2. Coach Endurance (Operational ✅)

**Specializations:** Running, Cycling, Swimming, Triathlon, Cardio

**Disciplines:**
- `running` - Course à pied (Route et trail)
- `cycling` - Cyclisme (Route et VTT)
- `swimming` - Natation
- `triathlon` - Triathlon (Multi-discipline)
- `cardio` - Cardio général

**Session Types:**
- Continuous endurance (Z2-Z3 steady state)
- Interval training (HIIT, Tabata, VO2max)
- Tempo runs/rides (threshold training)
- Long slow distance (LSD)
- Fartlek training

**Heart Rate Zones:**
- Z1: Active Recovery (50-60% max HR)
- Z2: Aerobic Base (60-70% max HR)
- Z3: Tempo (70-80% max HR)
- Z4: Threshold (80-90% max HR)
- Z5: VO2max (90-100% max HR)

**Equipment:** GPS watches, heart rate monitors, bikes, pools, smart trainers

**Edge Function:** `training-coach-endurance`

**Documentation:** [COACH_ENDURANCE_SPECIFICATION.md](./COACH_ENDURANCE_SPECIFICATION.md)

---

### 3. Coach Functional (Implemented ⚙️)

**Specializations:** CrossFit, HIIT, Functional Training, Circuit Training

**Disciplines:**
- `crossfit` - CrossFit (Entraînement fonctionnel varié haute intensité)
- `hiit` - HIIT (High Intensity Interval Training)
- `functional` - Functional Training (Mouvements multi-articulaires)
- `circuit` - Circuit Training (Enchaînements de stations)

**WOD Formats:**
- AMRAP (As Many Rounds As Possible)
- For Time (Complete for time)
- EMOM (Every Minute On the Minute)
- Tabata (20s work / 10s rest)
- Chipper (Complete list in order)
- Ladder (Ascending/descending reps)

**Movement Categories:**
- Olympic Lifts (Snatch, Clean & Jerk)
- Gymnastics (Muscle-ups, Handstands)
- Weighted (Thrusters, Wall balls)
- Monostructural (Row, Bike, Run)
- Bodyweight (Pull-ups, Push-ups)

**Equipment:** Olympic barbells, bumper plates, gymnastics rings, rowers, assault bikes, plyo boxes

**Edge Function:** `training-coach-functional`

**Documentation:** To be created

---

### 4. Coach Competitions (Implemented ⚙️)

**Specializations:** HYROX, DEKA FIT, DEKA MILE, DEKA STRONG

**Disciplines:**
- `hyrox` - HYROX (8 × 1km run + 8 workout stations)
- `deka-fit` - DEKA FIT (10 fitness zones with transitions)
- `deka-mile` - DEKA MILE (1 mile + 10 workout zones)
- `deka-strong` - DEKA STRONG (Strength-focused 10 zones)

**Event-Specific Training:**
- Station practice (SkiErg, Sled Push, Sled Pull, Burpee Broad Jump, etc.)
- Transition efficiency
- Pacing strategies
- Peak performance timing

**Equipment:** Rowers, ski ergs, assault bikes, sleds, sandbags, slam balls, wall balls

**Edge Function:** `training-coach-competitions`

**Documentation:** [COACH_COMPETITIONS_SPECIFICATION.md](./COACH_COMPETITIONS_SPECIFICATION.md)

---

### 5. Coach Calisthenics (Implemented ⚙️)

**Specializations:** Calisthenics, Street Workout, Streetlifting, Freestyle

**Disciplines:**
- `calisthenics` - Calisthenics (Poids du corps avancé et skills)
- `street-workout` - Street Workout (Barres et structures en extérieur)
- `streetlifting` - Streetlifting (Force au poids du corps lestée)
- `freestyle` - Freestyle (Figures acrobatiques et créativité)

**Skill Progressions:**
- Basics: Pull-ups, Dips, Push-ups, Squats
- Advanced: Muscle-ups, Handstands, Planches, Levers
- Static Holds: Front Lever, Back Lever, Human Flag
- Dynamic: Kipping, 360s, Flips

**Equipment:** Public structures (bars, parallel bars), minimal equipment (resistance bands, dip belt)

**Edge Function:** `training-coach-calisthenics`

**Documentation:** To be created

---

## Training Dashboard (4 Tabs)

### Status: 🔄 In Development (Partial Functionality)

The Training Page serves as the central hub with 4 specialized tabs:

### Tab 1: Today 📅
**Status:** ✅ Operational

**Features:**
- Hero CTA to start training pipeline
- Current status summary (sessions this week, streak, recovery)
- Active training goal card
- Quick insights mini-cards
- Next action recommendation
- Recent sessions preview

**Data Sources:**
- `trainingTodayService.getTodayData()`
- Real-time session status
- Active goals tracking

---

### Tab 2: Insights 💡
**Status:** 🔄 Partial (Basic insights operational, advanced analytics in development)

**Current Features:**
- Basic adaptive recommendations
- Pattern analysis (weekly distribution)
- Recent personal records

**In Development:**
- Advanced AI-generated insights
- Multi-week planning
- Volume/intensity balance analysis
- Muscle group imbalance detection

**Data Sources:**
- `training-coach-analyzer` (Edge Function)
- `trainingProgressionService.getInsightsData()`

---

### Tab 3: History 📚
**Status:** ✅ Operational

**Features:**
- Session filtering (period, type, location)
- Chronological session timeline
- Detailed session cards with:
  - Date, duration, location
  - Exercises performed
  - Total volume and average RPE
  - Session score and badges
- Aggregated statistics for filtered period

**Data Sources:**
- `trainingTodayService.getHistoryTabData()`
- Session query filters

---

### Tab 4: Progression 📈
**Status:** 🔄 Partial (Basic charts operational, advanced analytics in development)

**Current Features:**
- Volume progression chart
- Consistency calendar (GitHub-style heatmap)
- Personal records timeline

**In Development:**
- Strength evolution chart (estimated 1RM)
- Muscle group progress grid
- Weekly pattern heatmap
- Achievements & badges grid
- Advanced periodization tracking

**Data Sources:**
- `trainingProgressionService.getProgressionData()`
- Aggregated historical data

**Documentation:** [TRAINING_PAGE_TABS.md](./TRAINING_PAGE_TABS.md)

---

## Equipment Detection System

### Computer Vision Pipeline

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

### Equipment Catalog (300+ Items)

**Home Equipment (~100 items):**
- Base: Bodyweight, yoga mat, resistance bands, jump rope
- Force: Dumbbells, kettlebells, barbells, medicine balls
- Structure: Pull-up bar, dip station, benches, racks
- Cardio: Bikes, treadmills, rowers
- Accessories: Ab wheel, foam roller, TRX

**Gym Equipment (~200 items):**
- Free weights: Complete dumbbell sets, Olympic barbells, EZ bars
- Racks & benches: Squat racks, power racks, adjustable benches
- Machines: Smith, cable machines, leg press, leg curl/extension
- Cardio: Rowers, treadmills, bikes, ellipticals, stair climbers, assault bikes
- Functional: Battle ropes, slam balls, plyo boxes, TRX
- Recovery: Foam rollers, massage guns

**Outdoor Equipment (~60 items):**
- Street workout: Public pull-up bars, parallel bars, benches
- Terrain: Stairs, hills, parks
- Running/cycling: Tracks, trails, bikes, rollerblades
- Sports facilities: Fields, courts, pools, beaches

### Edge Functions

**`detect-equipment`**
- Input: Location ID, photo URLs, location type
- AI Model: GPT-4o Vision
- Output: Detected equipment array with confidence scores

**`process-detection-jobs`**
- Trigger: Scheduled (every 5 minutes) or on-demand
- Function: Processes pending detection jobs in queue

---

## Edge Functions Architecture

### Training System Edge Functions

```
Client (React) → Edge Functions (Deno) → OpenAI API
                       ↓
                  Supabase Database
```

#### 1. Coach Edge Functions (5 Coaches)

**Purpose:** Generate specialized training prescriptions

**Functions:**
- `training-coach-force` (Force/Powerbuilding specialist)
- `training-coach-endurance` (Endurance/Cardio specialist)
- `training-coach-functional` (CrossFit/HIIT specialist)
- `training-coach-competitions` (HYROX/DEKA specialist)
- `training-coach-calisthenics` (Bodyweight/Street specialist)

**Input:**
```typescript
{
  userId: string,
  context: {
    energy: number,
    time: number,
    equipment: string[],
    painAreas: string[],
    location: string,
    recovery: RecoveryMetrics
  },
  profile: UserProfile,
  history: TrainingSession[]
}
```

**Output:**
```typescript
{
  prescription: SessionPrescription,
  reasoning: string,
  alternatives: Exercise[]
}
```

**AI Model:** GPT-4o (with coach-specific prompts)

---

#### 2. Context Collector

**Function:** `training-context-collector`

**Purpose:** Collect and optimize user context for AI analysis

**Input:**
```typescript
{
  userId: string,
  sessionId?: string,
  contextType: 'pre-session' | 'post-session' | 'recovery'
}
```

**Output:**
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

#### 3. Session Analyzer

**Function:** `training-coach-analyzer`

**Purpose:** Analyze completed session performance

**Input:**
```typescript
{
  sessionId: string,
  userId: string,
  sessionData: CompletedSession
}
```

**Output:**
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

#### 4. Exercise Regenerate

**Function:** `training-exercise-regenerate`

**Purpose:** Regenerate specific exercises during session (substitutions)

**Input:**
```typescript
{
  exerciseId: string,
  reason: 'too-hard' | 'too-easy' | 'equipment' | 'pain',
  context: SessionContext
}
```

**Output:**
```typescript
{
  newExercise: Exercise,
  reasoning: string
}
```

---

#### 5. Voice Transcription

**Function:** `training-voice-transcribe`

**Purpose:** Transcribe voice feedback during session

**Input:** Audio blob (WebM/MP3)

**Output:**
```typescript
{
  text: string,
  confidence: number,
  intent?: 'feedback' | 'question' | 'adjustment'
}
```

**AI Model:** Whisper-1

---

#### 6. Insights Generator

**Function:** `training-insights-generator`

**Purpose:** Generate long-term insights and recommendations

**Input:**
```typescript
{
  userId: string,
  period: '7days' | '30days' | '90days'
}
```

**Output:**
```typescript
{
  insights: Insight[],
  trends: Trend[],
  recommendations: Recommendation[]
}
```

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

-- RLS Policy: Users can only access their own locations
CREATE POLICY "Users can manage own locations"
  ON training_locations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

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

-- RLS Policy: Users can view equipment for their locations
CREATE POLICY "Users can view equipment for own locations"
  ON training_location_equipment_detected FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = location_id
      AND training_locations.user_id = auth.uid()
    )
  );
```

---

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

-- RLS Policy: Users can manage own goals
CREATE POLICY "Users can manage own goals"
  ON training_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

#### training_sessions
```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  location_id UUID REFERENCES training_locations,
  coach_type TEXT NOT NULL, -- 'force' | 'endurance' | 'functional' | etc.
  session_type TEXT,
  context JSONB NOT NULL, -- Step 1 data
  prescription JSONB NOT NULL, -- Step 2 data
  performance JSONB, -- Step 3 tracking
  analysis JSONB, -- Step 4 results
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  is_draft BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy: Users can manage own sessions
CREATE POLICY "Users can manage own sessions"
  ON training_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

#### training_session_exercises
```sql
CREATE TABLE training_session_exercises (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES training_sessions NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_category TEXT,
  target_sets INTEGER,
  target_reps TEXT, -- Can be "10", "8-12", "AMRAP"
  target_load FLOAT,
  target_rpe INTEGER,
  actual_sets INTEGER,
  completed BOOLEAN DEFAULT false,
  feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy: Users can view exercises for their sessions
CREATE POLICY "Users can view own session exercises"
  ON training_session_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = session_id
      AND training_sessions.user_id = auth.uid()
    )
  );
```

---

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

-- RLS Policy: Users can view sets for their exercises
CREATE POLICY "Users can view own session sets"
  ON training_session_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_session_exercises e
      JOIN training_sessions s ON s.id = e.session_id
      WHERE e.id = exercise_id
      AND s.user_id = auth.uid()
    )
  );
```

---

#### training_session_endurance_blocks
```sql
CREATE TABLE training_session_endurance_blocks (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES training_sessions NOT NULL,
  block_index INTEGER NOT NULL,
  block_type TEXT NOT NULL, -- 'warmup' | 'continuous' | 'intervals' | 'tempo' | 'cooldown'
  duration_target INTEGER NOT NULL, -- minutes
  duration_actual INTEGER,
  intensity_zone TEXT, -- 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'
  avg_heart_rate INTEGER,
  rpe INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Additional Tables

**Full schema documentation:** See `/supabase/migrations/` for complete schema

**Key tables:**
- `training_session_analysis` - AI-generated session analysis
- `training_session_user_feedback` - Text and voice feedback
- `training_exercise_load_adjustments` - Progression tracking
- `training_ai_context_snapshots` - AI context caching
- `training_coach_notifications` - Coach feedback system

---

## Out of MVP Scope

The following features are **NOT included** in the current MVP:

### Wearable Integration ❌
- Apple Health synchronization
- Google Fit integration
- Heart rate monitor real-time streaming
- GPS tracking integration
- Automatic workout detection

**Reason:** Requires native mobile app development and platform-specific SDKs

**Roadmap:** Phase 3+

---

### Advanced Analytics ❌
- Machine learning progression predictions
- Injury risk prediction models
- Form analysis via computer vision
- Voice coaching with real-time feedback
- Automated video recording analysis

**Reason:** Requires significant ML model development and training data

**Roadmap:** Phase 4+

---

### Social Features ❌
- Training buddies / workout partners
- Public leaderboards
- Challenges and competitions
- Social sharing of workouts
- Community forums

**Reason:** Requires moderation systems and social infrastructure

**Roadmap:** Phase 5+

---

### Disciplines NOT in MVP

**Removed Categories:**

1. **Wellness & Mobilité** (Yoga, Pilates, Mobility, Stretching)
   - Reason: Lower priority for initial MVP target audience
   - Roadmap: Phase 2

2. **Sports de Combat** (Boxing, Kickboxing, MMA, Martial Arts)
   - Reason: Requires specialized technique guidance and safety protocols
   - Roadmap: Phase 3

3. **Sports Spécifiques** (Basketball, Football, Tennis, Other sports)
   - Reason: Highly sport-specific with fragmented user base
   - Roadmap: Phase 3

4. **Mixte & Personnalisé** (Mixed training, Custom programs)
   - Reason: Requires all other coaches to be operational first
   - Roadmap: Phase 2 (after all coaches implemented)

---

## Roadmap Phase 2+

### Phase 2: Coach Expansion
- Re-introduce Wellness & Mobilité coach
- Implement Mixte & Personnalisé coach
- Multi-coach programs (e.g., Strength + Endurance)
- Coach handoffs (change specialization mid-program)
- Hybrid programming (combine methodologies)

### Phase 3: Advanced Features
- Combat Sports coach
- Sports Spécifiques coach
- Wearable data integration (Apple Watch, Garmin, Whoop)
- Machine learning progression predictions
- Injury risk prediction
- Form analysis via computer vision

### Phase 4: Social & Gamification
- Training buddies
- Leaderboards
- Challenges and competitions
- Achievement system expansion
- Social sharing

### Phase 5: Integration & Optimization
- Gym equipment integration (Bluetooth weights)
- Smart home gym equipment
- Voice coaching with real-time feedback
- Automated video recording analysis
- Advanced periodization planning (12-week cycles)

---

**Document Version:** 1.0.0 (MVP)
**Next Review:** Post Phase 2 (Multi-Coach Implementation)
**Maintained By:** TwinForge AI Team
**Questions:** Refer to [TRAINING_SYSTEM_OVERVIEW.md](./TRAINING_SYSTEM_OVERVIEW.md) for detailed architecture
