# Coach Competitions Specification

**Version**: 1.0.0
**Last Updated**: October 2025
**Status**: ✅ Operational
**Purpose**: Complete specification for the Fitness Competitions Coach (HYROX, DEKA FIT)

---

## Overview

The **Coach Competitions** specializes in fitness competition preparation, focusing on HYROX, DEKA FIT, DEKA MILE, and DEKA STRONG formats. This coach provides event-specific programming, pacing strategies, transition training, and competition simulation sessions.

---

## Supported Disciplines

### 1. HYROX
- **Format**: 8 × 1km run + 8 workout stations
- **Fixed Stations**: SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, Rowing, Farmers Carry, Sandbag Lunges, Wall Balls
- **Duration**: 60-90min (level-dependent)
- **Key Focus**: Pacing, transitions < 10s, station efficiency

### 2. DEKA FIT
- **Format**: 10 fitness zones with transitions
- **Zones**: Mixed cardio (row, bike, ski) + strength (box, med ball, carries)
- **Duration**: 30-45min
- **Key Focus**: Explosiveness, muscular endurance, mental toughness

### 3. DEKA MILE
- **Format**: 1 mile run + 10 workout zones
- **Duration**: 25-35min
- **Key Focus**: Efficient running, station technique

### 4. DEKA STRONG
- **Format**: 10 strength-power stations (no running)
- **Duration**: 20-30min
- **Key Focus**: Maximal strength, perfect technique

---

## Training Methodologies

### Pacing Strategies (CRITICAL)
- **Start Conservative**: 80% max effort first stations/runs
- **Sustainable Pace**: 85-90% effort mid-session
- **Finish Strong**: 90-95% final stations
- **Avoid Redline**: Manage lactate, controlled breathing

### Session Types

#### 1. Full Simulation
- Complete competition format
- Race pace practice
- Frequency: 1× every 2-3 weeks MAX
- Duration: 60-90min

#### 2. Station Work
- Isolated station training
- 4-6 stations, 3-5 rounds each
- Frequency: 2-3× per week
- Duration: 30-45min

#### 3. Hybrid Sessions
- Alternating runs + stations
- Example: 5 rounds (800m + 2 stations)
- Frequency: 1-2× per week
- Duration: 45-60min

#### 4. Weakness Focus
- Target slow stations
- High volume, technique emphasis
- Frequency: 1× per week
- Duration: 30-45min

### Transition Training
- **Goal**: < 10s average transitions
- **Practice**: Run→station→run drills
- **Efficiency**: Movement economy, no wasted motion
- **Mental Prep**: Anticipate fatigue, stay focused

---

## Equipment Requirements

### Essential Competition Gear
- **Cardio Machines**: Concept2 Rower, SkiErg, Assault Bike
- **Sleds**: Push sled (heavy), Pull sled with rope
- **Strongman**: Sandbags (10-20kg), Farmers carry handles (2×16-32kg)
- **Functional**: Wall balls (6-9kg), Plyo box (75cm), Med balls (10kg)
- **Bodyweight**: Open floor space, pull-up bar

### Substitutions (If Equipment Missing)
- **No SkiErg**: Assault bike OR 100 burpees OR 150 mountain climbers
- **No Sled**: Prowler OR hill sprints OR leg press (high reps)
- **No Rower**: Assault bike OR 3× double-unders reps
- **No Sandbag**: Heavy dumbbell lunges OR goblet lunges
- **No Wall Balls**: Thrusters OR squat to overhead press

---

## Prescription Format (JSON)

### Key Fields (Competitions-Specific)

```typescript
{
  "competitionFormat": "hyrox" | "deka-fit" | "deka-mile" | "deka-strong" | "hybrid",
  "stations": [
    {
      "stationNumber": 1-10,
      "stationType": "cardio" | "strength" | "hybrid",
      "name": "Run 1km",
      "prescription": "1000m",
      "targetTime": 300, // seconds
      "targetPace": "5:00/km",
      "transitionTime": 10, // seconds
      "pacingStrategy": "Start 80%, finish 90%",
      "executionCues": ["Maintain pace", "Control breathing"],
      "coachNotes": "First run = race warm-up",
      "substitutions": ["800m run + 200m row"]
    }
  ],
  "pacingPlan": {
    "overall": "Start 80%, maintain 85%, finish 90-95%",
    "runPacing": "5:00-5:15/km consistent",
    "stationApproach": "Technique > Speed",
    "transitionGoal": "< 10s avg all transitions"
  }
}
```

---

## Progression System

### Metrics Tracked
- **Time per Station**: Compare to previous sessions
- **Transition Times**: Track improvements
- **Total Time**: Projected competition finish
- **Pacing Consistency**: Run splits analysis
- **Weakness Identification**: Slowest stations

### Progression Strategies
1. **Reduce Target Times**: 5-10s improvements per station
2. **Faster Transitions**: 15s → 10s → 5s goal
3. **Increase Load/Reps**: Heavier sandbag, more wall balls
4. **Add Complexity**: Full format → add bonus stations
5. **Pacing Refinement**: Better splits, negative splits

---

## Recovery Intelligence (CRITICAL)

### Pre-Generation Analysis
- **< 72h since full simulation**: Generate station work (light) ONLY
- **> 2 high-intensity last 3 days**: Technique session OR zone 2 cardio
- **High fatigue signals**: Auto-deload (50% volume)

### Competition Taper (Week Before Event)
- **Volume**: -50%
- **Intensity**: Maintained (race pace)
- **Focus**: Sleep++, nutrition++, mental prep
- **Last Hard Session**: 5-7 days before competition

---

## Scaling & Adaptations

### Beginner (First Competition Prep)
- **Distances**: 4×500m + 4 stations OR 5 DEKA-style zones
- **Stations**: Simplified (lighter loads, easier movements)
- **Rest**: 15-30s between stations OK
- **Focus**: Finish, learn movements, build base

### Intermediate (< 3 Competitions)
- **Distances**: Full format (8 HYROX stations, 10 DEKA zones)
- **Stations**: Rx or Scaled weights
- **Rest**: 5-10s transitions
- **Focus**: Improve times, solid technique, smart pacing

### Advanced (> 3 Competitions, Podium Hunters)
- **Distances**: Full format + bonus volume
- **Stations**: Rx+ (heavier weights, more reps)
- **Rest**: < 5s transitions, zero station breaks
- **Focus**: Max performance, perfect simulations, mental fortitude

---

## UI Components

### Step 2 (Activer - Prescription Display)
- **CompetitionPrescriptionCard**: Display stations with times, pacing
- **CompetitionAdjustmentButtons**: Adjust intensity, times, circuit complexity
- **Station Cards**: Each station with number, exercise, target time, cues

### Step 3 (Seance - Live Session)
- **CompetitionSessionDisplay**: Overall progress tracker
- **CompetitionStationCard**: Active station display with live timer
- **Progress Indicators**: X/8 stations, cumulative time
- **Next Station Preview**: Prepare for upcoming station

### Step 4 (Adapter - Feedback)
- **Station Performance Analysis**: Time per station vs targets
- **Transition Analysis**: Identify slow transitions
- **Pacing Chart**: Run splits consistency
- **Weakness Report**: Focus areas for next sessions

---

## Edge Function

**Name**: `training-coach-competitions`
**Model**: GPT-5 Mini
**Reasoning Effort**: Low
**Max Tokens**: 4500

### System Prompt Highlights
- Competition formats expertise (HYROX, DEKA)
- Pacing strategy generation (80-85-90% approach)
- Transition time optimization (< 10s goal)
- Equipment substitutions logic
- Recovery analysis integration

---

## Best Practices

### For Users
1. **Start with Hybrid Sessions**: Build base before full simulations
2. **Respect Recovery**: Max 1 full simulation per 2-3 weeks
3. **Focus Weaknesses**: Dedicate 1 session/week to slow stations
4. **Practice Transitions**: Drill run→station→run repeatedly
5. **Nutrition Strategy**: Practice race fueling during simulations

### For Coaches
1. **Pacing is King**: Emphasize 80% start, avoid early redline
2. **Technique > Speed**: Perfect form prevents injury, improves times
3. **Transition Drills**: Include dedicated transition practice
4. **Mental Prep**: Visualization, race plan rehearsal
5. **Taper Properly**: Don't overtrain final week before competition

---

## Integration Points

### Services
- `trainingGenerationService`: Routes to coach-competitions for hyrox/deka disciplines
- `competitionProgressionService`: Tracks station times, progression (TODO)
- `competitionNotificationService`: Coaching messages during sessions (TODO)

### Database
- `training_sessions.category`: 'fitness-competitions'
- `training_sessions.coach_type`: 'coach-competitions'
- Stores station-by-station performance data

### Equipment Detection
- Automatically detects competition gear (rower, ski erg, sleds)
- Suggests substitutions if equipment missing
- Equipment catalog includes competition-specific items

---

## Future Enhancements

### Phase 2 (Planned)
- **Live Pacing Guidance**: Real-time pace recommendations
- **Heart Rate Zone Integration**: Zone-based pacing adjustments
- **Competition Mode**: Race day simulation with countdowns
- **Benchmark Comparisons**: Compare to competition averages
- **Team Training**: Multi-user competition sessions

### Phase 3 (Advanced)
- **Video Analysis**: Form checking via camera
- **Leaderboards**: Compare times with community
- **Virtual Competitions**: Remote competition events
- **Personalized Tapering**: AI-optimized pre-competition week

---

**Document Version**: 1.0.0
**Maintained By**: TwinForge AI Team
**Status**: Coach Competitions Operational ✅
