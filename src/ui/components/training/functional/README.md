# Functional Training Components

Components for CrossFit and Functional Fitness WOD session tracking.

## Overview

This module provides specialized UI components for functional training disciplines including CrossFit, HIIT, Circuit Training, and other WOD-based workouts.

## Components

### FunctionalSessionDisplay

Main live session tracker for functional/CrossFit workouts. Supports multiple WOD formats:

- **AMRAP** (As Many Rounds As Possible): Count-down timer with rounds tracking
- **For Time**: Count-up timer with time cap
- **EMOM** (Every Minute On the Minute): Structured minute intervals
- **Tabata**: 8 rounds of 20sec work / 10sec rest
- **Chipper**: Long list of movements done once
- **Ladder**: Progressive rep scheme

**Features:**
- Real-time timer display
- Rounds completed tracking
- Exercise progression indicator
- Time cap enforcement
- Play/Pause/Stop controls
- Progress bar visualization
- Session feedback collection

**Usage:**
```tsx
<FunctionalSessionDisplay
  sessionId={currentSessionId}
  prescription={sessionPrescription}
  userId={user.id}
  onComplete={(metrics) => {
    // Handle completion
  }}
  onExit={() => {
    // Handle exit
  }}
/>
```

## WOD Format Support

### AMRAP (As Many Rounds As Possible)
- Count-down timer from time cap
- Rounds counter increments on "Round Complete"
- Auto-stops at time cap
- Displays: Rounds completed + Time remaining

### For Time
- Count-up timer to time cap
- Single completion at finish
- Auto-stops at time cap if not completed
- Displays: Elapsed time + Time remaining

### EMOM (Every Minute On the Minute)
- Structured intervals every minute
- Work then rest pattern
- Auto-advances each minute
- Displays: Current minute + Work/Rest phase

### Tabata
- Fixed 8 rounds
- 20 seconds work, 10 seconds rest
- Auto-progresses through intervals
- Displays: Round count + Interval timer

### Chipper
- Single pass through long exercise list
- No rounds, complete once
- Count-up timer
- Displays: Exercise progress + Total time

### Ladder
- Progressive rep scheme (ascending or descending)
- May be time-capped
- Displays: Current rung + Total time

## Best Practices - CrossFit/Functional Training

### Timer Display
- Always show elapsed/remaining time prominently
- Use tabular-nums font for consistent digit width
- Update every second for real-time feedback

### Rounds Tracking
- Clear "Round Complete" button for AMRAP
- Auto-reset exercise index on new round
- Visual feedback on round completion (haptic + animation)

### Exercise Indication
- Highlight current exercise in the list
- Show all exercises for reference
- Include reps and load for each movement

### Safety & Scaling
- Display scaling options (Rx/Scaled/Foundations)
- Allow mid-WOD pausing for safety
- Confirm before stopping to prevent accidental exits

### Feedback Collection
- Collect rounds/time metrics
- Ask for RPE and subjective difficulty
- Optional voice feedback transcription

## State Management

Session state includes:
- `sessionTime`: Elapsed seconds
- `roundsCompleted`: Number of full rounds
- `currentExerciseIndex`: Which movement in the circuit
- `isRunning`: Session active
- `isPaused`: Temporarily stopped

## Metrics Captured

On completion, these metrics are returned:
- `wodFormat`: Type of WOD
- `roundsCompleted`: Full rounds finished
- `totalTime`: Total duration in seconds
- `timeCapReached`: Boolean if time cap hit
- `exercises`: Number of movements
- `wodName`: If benchmark WOD (e.g., "Fran", "Murph")
- `userFeedbackText`: Optional feedback

## Integration

Functional session display integrates with:
- `SessionFeedbackModal` for post-WOD feedback
- `TrainingCoachNotificationService` for live coaching cues
- `Haptics` for tactile feedback
- `Logger` for debugging and analytics

## Future Enhancements

- Rep-by-rep tracking within exercises
- Heart rate zone monitoring
- Split times for benchmark WODs
- Leaderboard comparison
- Video recording support
- Partner WOD coordination
