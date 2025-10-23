# Endurance Session Feedback Flow

## Overview

This document describes the complete flow for collecting user feedback after an endurance training session and how it integrates with the Step 4 analysis system.

## Architecture

### Components

1. **EnduranceSessionDisplay** - Main endurance session execution component
2. **SessionFeedbackModal** - Universal feedback collection modal (text + voice)
3. **Step3Seance** - Session orchestrator that handles both force and endurance sessions
4. **Step4Adapter** - Analysis step that processes session feedback

### Flow Diagram

```
Endurance Session Start
         |
         v
  Block Execution
         |
         v
   All Blocks
   Completed?
         |
         v
    YES - completeSession()
         |
         v
 showFeedbackModal = true
         |
         v
SessionFeedbackModal Opens
         |
    User Choice
    /         \
   /           \
Text Input   Voice Input
   |             |
   v             v
Submit       Transcribe
   |             |
   +-------------+
         |
         v
handleFeedbackSubmit()
         |
         v
Convert to SessionFeedback
         |
         v
   onComplete(metrics)
         |
         v
setSessionFeedback() in Step3
         |
         v
  goToNextStep() → Step 4
         |
         v
Step4Adapter receives feedback
         |
         v
  AI Analysis Triggered
```

## Key Implementation Details

### 1. Session Completion

When all blocks are completed in `EnduranceSessionDisplay`:

```typescript
const completeSession = async () => {
  // Update session metrics in database
  await enduranceSessionService.updateSessionMetrics(actualSessionId, metrics);

  // Set state to COMPLETED
  setSessionState(prev => ({
    ...prev,
    phase: 'COMPLETED',
    isRunning: false,
  }));

  // Show feedback modal immediately
  setShowFeedbackModal(true);
};
```

### 2. Feedback Collection

The `SessionFeedbackModal` component provides:
- **Text input** - Traditional textarea for written feedback
- **Voice input** - Audio recording with automatic transcription via edge function
- **Skip option** - Users can proceed without feedback

### 3. Feedback Submission

When user submits feedback:

```typescript
const handleFeedbackSubmit = (feedbackText: string) => {
  // Close modal
  setShowFeedbackModal(false);

  // Prepare metrics with feedback
  const metrics = {
    totalDuration: sessionState.sessionTime,
    blocksCompleted: allBlocks.length,
    intervalsCompleted: 0,
    zonesDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
    userFeedbackText: feedbackText,
  };

  // Call onComplete callback to Step3
  onComplete(metrics);
};
```

### 4. Conversion to SessionFeedback Format

In `Step3Seance`, endurance metrics are converted to the standard `SessionFeedback` format:

```typescript
const enduranceToSessionFeedback = {
  warmupCompleted: true,
  exercises: [], // Empty for endurance sessions
  durationActual: metrics.totalDuration || 0,
  overallRpe: 7, // Default RPE
  effortPerceived: 7,
  enjoyment: 8,
  userFeedbackText: metrics.userFeedbackText || undefined,
  notes: JSON.stringify({
    type: 'endurance',
    discipline: sessionPrescription.discipline,
    blocksCompleted: metrics.blocksCompleted || 0,
    intervalsCompleted: metrics.intervalsCompleted || 0,
    zonesDistribution: metrics.zonesDistribution || {},
  }),
};

setSessionFeedback(enduranceToSessionFeedback);
goToNextStep();
```

### 5. Step 4 Processing

`Step4Adapter` is enhanced to handle endurance sessions:

```typescript
// Check if this is an endurance session
const isEnduranceSession = !!sessionPrescription.mainWorkout;

// For endurance sessions, empty exercises array is expected
if (!isEnduranceSession && (!feedback.exercises || feedback.exercises.length === 0)) {
  logger.warn('STEP_4_ADAPTER', 'Skipping AI analysis - no exercise feedback');
  return;
}

// Proceed with analysis for both force and endurance
const { analysis: aiAnalysis } = await sessionAnalysisService.analyzeSession(
  userId,
  sessionPrescription,
  feedback,
  preparerData
);
```

## Data Structure

### Endurance Metrics (from EnduranceSessionDisplay)

```typescript
interface EnduranceMetrics {
  totalDuration: number;
  blocksCompleted: number;
  intervalsCompleted: number;
  zonesDistribution: {
    Z1: number;
    Z2: number;
    Z3: number;
    Z4: number;
    Z5: number;
  };
  userFeedbackText?: string;
}
```

### SessionFeedback (converted format)

```typescript
interface SessionFeedback {
  warmupCompleted?: boolean;
  exercises: ExerciseFeedback[]; // Empty array for endurance
  durationActual: number;
  overallRpe: number;
  effortPerceived: number;
  enjoyment: number;
  userFeedbackText?: string;
  notes?: string; // JSON-stringified endurance-specific data
}
```

## Voice Transcription

The voice feedback feature uses:

1. **Browser MediaRecorder API** - Records audio in browser
2. **Edge Function** (`training-voice-transcribe`) - Transcribes audio to text
3. **OpenAI Whisper API** - Performs the actual transcription

### Error Handling

The system handles multiple error scenarios:
- Permission denied for microphone
- Device not found
- Device in use by another app
- Browser not supported
- Transcription failures

Each error provides:
- Clear error message
- Helpful suggestion
- Retry capability (up to 2 retries)

## Database Persistence

Feedback is saved to `training_session_user_feedback` table:

```typescript
await supabase
  .from('training_session_user_feedback')
  .insert({
    session_id: sessionId,
    user_id: userId,
    feedback_text: feedbackText.trim(),
  });
```

## Benefits of This Architecture

1. **Unified Modal** - Same feedback modal used for force and endurance sessions
2. **Voice + Text** - Users can choose their preferred input method
3. **Type Safety** - Proper conversion ensures Step 4 receives valid data
4. **Extensibility** - Easy to add more feedback fields in the future
5. **Error Resilience** - Session completes even if feedback fails
6. **Database Tracking** - All feedback stored for historical analysis

## Future Enhancements

Potential improvements:
- Add structured feedback fields for endurance (RPE per zone, hydration, nutrition)
- Implement sentiment analysis on voice feedback
- Add post-session metrics input (actual HR zones, power data, etc.)
- Create feedback analytics dashboard
- Support for wearable device data import

## Related Files

- `/src/ui/components/training/EnduranceSessionDisplay.tsx`
- `/src/ui/components/training/SessionFeedbackModal.tsx`
- `/src/app/pages/Training/Pipeline/steps/Step3Seance.tsx`
- `/src/app/pages/Training/Pipeline/steps/Step4Adapter.tsx`
- `/src/system/services/voiceFeedbackTranscriptionService.ts`
- `/supabase/functions/training-voice-transcribe/index.ts`
