/**
 * Training Pipeline Types
 * Types for the 5-step training generation pipeline
 */

export type TrainingPipelineStepId =
  | 'preparer'
  | 'activer'
  | 'seance'
  | 'adapter'
  | 'avancer';

export interface TrainingPipelineStep {
  id: TrainingPipelineStepId;
  label: string;
  icon: string;
  description: string;
  startProgress: number;
  endProgress: number;
}

export interface WeeklyProgress {
  currentWeek: number;
  weekStartDate: string;
  sessionsThisWeek: number;
  sessionsPlannedThisWeek: number;
  disciplinesThisWeek: string[];
  totalVolumeThisWeek: number;
  avgRpeThisWeek: number;
}

export interface PriorityToday {
  shouldPrioritize: string[];
  shouldAvoid: string[];
  reason: string;
  suggestedDiscipline?: string;
}

export interface RecentFocus {
  exerciseNames: string[];
  movementPatterns: string[];
  muscleGroups: string[];
  disciplines: string[];
}

export interface CyclePhase {
  currentWeek: number;
  totalWeeks: number;
  phase: 'accumulation' | 'intensification' | 'realization' | 'deload';
  nextPhase?: string;
  nextPhaseDate?: string;
}

export interface PreparerData {
  availableTime: number;
  wantsShortVersion: boolean;
  locationId: string;
  locationName: string;
  locationPhotos: string[];
  availableEquipment: string[];
  energyLevel: number;
  hasFatigue: boolean;
  hasPain: boolean;
  painDetails?: string;

  lastSessionDate?: string;
  daysSinceLastSession?: number;
  lastSessionType?: string;
  lastSessionDiscipline?: string;
  weeklyProgress?: WeeklyProgress;
  priorityToday?: PriorityToday;
  recentFocus?: RecentFocus;
  shouldAvoid?: string[];
  currentWeekInCycle?: number;
  cyclePhase?: CyclePhase;
  recoveryScore?: number;
  optimalTrainingWindow?: {
    isOptimal: boolean;
    hoursUntilOptimal?: number;
    reason?: string;
  };
}

export interface GenerationState {
  hasTriggered: boolean;
  timestamp: number | null;
  sessionId: string | null;
}

export type IntensificationTechnique =
  | 'rest-pause'
  | 'drop-set'
  | 'super-set'
  | 'giant-set'
  | 'myo-reps'
  | 'cluster-set'
  | 'tempo-contrast'
  | 'isometric-hold'
  | 'eccentric-focus'
  | 'partial-reps'
  | 'pause-reps'
  | '1.5-reps'
  | 'none';

export type ExecutionCue =
  | 'explosive-concentric'
  | 'controlled-eccentric'
  | 'max-contraction'
  | 'pause-at-bottom'
  | 'pause-at-top'
  | 'continuous-tension'
  | 'full-rom'
  | 'mind-muscle-connection';

export interface WarmupExercise {
  id: string;
  name: string;
  duration?: number;
  sets?: number;
  reps?: number;
  instructions: string;
  targetAreas: string[];
}

export interface WarmupPrescription {
  duration: number;
  description?: string;
  instructions?: string;
  targetZone?: string;
  targetHR?: string;
  exercises?: WarmupExercise[];
  dynamicDrills?: string[];
  notes?: string;
  isOptional?: boolean;
}

export interface CooldownPrescription {
  duration: number;
  description?: string;
  instructions?: string;
  targetZone?: string;
  dynamicDrills?: string[];
  stretching?: string[];
}

export interface Exercise {
  id: string;
  name: string;
  variant?: string;
  sets: number;
  reps: number;
  load?: number | number[];
  repsProgression?: number[];
  tempo?: string;
  rest: number;
  rpeTarget?: number;
  movementPattern?: string;
  muscleGroups?: string[];
  equipment?: string;
  category?: string;
  muscleGroup?: string;
  substitutions?: string[];
  intensificationTechnique?: IntensificationTechnique;
  intensificationDetails?: string;
  executionCues?: ExecutionCue[];
  coachNotes?: string;
  coachTips?: string[];
  safetyNotes?: string[];
  commonMistakes?: string[];
  scalingOptions?: Array<{
    level: 'rx' | 'scaled' | 'foundations';
    description: string;
  }>;
  currentScaling?: 'rx' | 'scaled' | 'foundations';
}

export interface EnduranceWorkoutItem {
  id: string;
  type: 'continuous' | 'intervals' | 'tempo';
  name: string;
  description?: string;
  duration: number;
  distance?: number;
  targetZone?: string;
  targetPace?: string;
  targetHR?: string;
  targetPower?: string;
  targetCadence?: string;
  intervals?: {
    work: { duration: number; intensity: string; pace?: string };
    rest: { duration: number; intensity: string; type?: string };
    repeats: number;
  };
  cues?: string[];
  coachNotes?: string;
  rpeTarget?: number;
}

export interface SessionPrescription {
  sessionId?: string;
  sessionName?: string;
  type: string;
  durationTarget: number;
  focus: string[];
  sessionSummary?: string;
  warmup?: WarmupPrescription;
  exercises: Exercise[];
  cooldown?: string | CooldownPrescription;
  category?: string;
  generatedAt?: string;
  cacheKey?: string;
  discipline?: string;
  distanceTarget?: number;
  focusZones?: string[];
  mainWorkout?: EnduranceWorkoutItem[];
  metrics?: any;
  overallNotes?: string;
  expectedRpe?: number;
  coachRationale?: string;
  nutritionAdvice?: string;
  recoveryAdvice?: string;
}

export interface ExerciseFeedback {
  exerciseId: string;
  completed: boolean;
  setsCompleted: number;
  repsActual: number[];
  loadUsed?: number | number[];
  rpe?: number;
  hadPain: boolean;
  painJoint?: string;
  technique?: number;
  wasSubstituted: boolean;
  notes?: string;
}

export interface FunctionalSessionMetrics {
  wodFormat: string;
  roundsCompleted: number;
  totalReps?: number;
  timeCapReached: boolean;
  wodName?: string;
}

export interface CompetitionSessionMetrics {
  totalTime: number;
  stationsCompleted: number;
  stationTimes: number[];
  competitionFormat?: string;
  userFeedbackText?: string;
}

export interface SessionFeedback {
  warmupCompleted?: boolean;
  warmupDuration?: number;
  exercises: ExerciseFeedback[];
  durationActual: number;
  overallRpe: number;
  effortPerceived: number;
  enjoyment: number;
  notes?: string;
  userFeedbackText?: string;
  functionalMetrics?: FunctionalSessionMetrics;
  competitionMetrics?: CompetitionSessionMetrics;
  wearableMetrics?: WearableSessionMetrics;
  wearableDeviceUsed?: string;
  hrTrackingEnabled: boolean;
}

export interface WearableSessionMetrics {
  heartRateData: Array<{ timestamp: string; bpm: number; zone?: number }>;
  avgHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  timeInZones: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  caloriesBurned: number;
  effortScore: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  deviceName: string;
  deviceId: string;
  sessionStartTime: string;
  sessionEndTime: string;
  durationSeconds: number;
}

export interface SessionAnalysisResult {
  sessionAnalysis: any;
  progressionRecommendations: any;
  personalizedInsights: any;
  coachRationale: string;
  wearableAnalysis?: {
    effortAccuracy: {
      score: number;
      rating: 'excellent' | 'good' | 'moderate' | 'poor';
      analysis: string;
      rpeVsHrCorrelation: number;
    };
    zoneCompliance?: {
      overallCompliance: number;
      targetZones: string[];
      actualDistribution: {
        zone1: number;
        zone2: number;
        zone3: number;
        zone4: number;
        zone5: number;
      };
      deviations: Array<{
        period: string;
        expectedZone: string;
        actualZone: string;
        duration: number;
      }>;
      recommendation: string;
    };
    recoveryImpact: {
      estimatedRecoveryHours: number;
      intensityLevel: 'light' | 'moderate' | 'hard' | 'very-hard';
      suggestedNextSessionDelay: number;
      warnings: string[];
    };
    insights: string[];
    recommendations: string[];
  };
}

export interface Adaptation {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: 'progression' | 'maintenance' | 'deload' | 'substitution';
  changeDescription: string;
  reason: string;
  beforeValue?: string;
  afterValue?: string;
  accepted: boolean;
}

export interface NextAction {
  type: 'next-session' | 'test-etalon' | 'palier-upgrade' | 'rest-week';
  title: string;
  description: string;
  scheduledDate?: string;
  palierFrom?: number;
  palierTo?: number;
}

export interface GenerationHistoryItem {
  sessionId: string;
  prescription: SessionPrescription;
  generatedAt: string;
  cacheKey?: string;
}

export interface SavedDraft {
  id: string;
  userId: string;
  prescription: SessionPrescription;
  preparerContext: PreparerData;
  savedAt: string;
  expiresAt: string;
  customName?: string;
}

export interface ExerciseIllustrationState {
  exerciseName: string;
  discipline: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isGenerating: boolean;
  error: boolean;
}

export interface TrainingPipelineState {
  currentStep: TrainingPipelineStepId;
  isActive: boolean;
  progress: number;

  userId: string | null;
  preparerData: PreparerData | null;
  sessionPrescription: SessionPrescription | null;
  sessionFeedback: SessionFeedback | null;
  sessionAnalysisResult: SessionAnalysisResult | null;
  adaptations: Adaptation[];
  nextAction: NextAction | null;

  currentSessionId: string | null;
  currentPlanId: string | null;

  generationHistory: GenerationHistoryItem[];
  savedDraft: SavedDraft | null;
  isSavingDraft: boolean;
  isLoadingDraft: boolean;
  isDraftSaved: boolean;

  exerciseIllustrations: Record<string, ExerciseIllustrationState>;

  // Anti-duplicate generation state
  generationState: GenerationState;

  loadingState: 'idle' | 'loading' | 'generating' | 'analyzing' | 'adapting';
  loadingMessage: string;
  error: string | null;

  steps: TrainingPipelineStep[];

  setCurrentStep: (step: TrainingPipelineStepId) => void;
  setProgress: (progress: number) => void;

  startPipeline: () => void;
  resetPipeline: () => void;
  cancelPipeline: () => void;
  cleanupAndReturn: () => Promise<void>;
  emergencyExit: (saveSessionData?: boolean) => Promise<void>;

  initializeUser: () => Promise<void>;

  setPreparerData: (data: PreparerData) => void;
  setSessionPrescription: (prescription: SessionPrescription) => void;
  updateExerciseLoad: (exerciseIndex: number, newLoad: number | number[]) => void;
  setSessionFeedback: (feedback: SessionFeedback) => void;
  setSessionAnalysisResult: (analysis: SessionAnalysisResult | null) => void;
  setAdaptations: (adaptations: Adaptation[]) => void;
  toggleAdaptationAcceptance: (adaptationId: string) => void;
  setNextAction: (action: NextAction) => void;
  setExerciseIllustrations: (illustrations: Record<string, ExerciseIllustrationState>) => void;

  // Anti-duplicate generation actions
  markGenerationTriggered: (sessionId: string) => void;
  resetGenerationFlag: () => void;
  canTriggerGeneration: () => Promise<boolean>;

  // Recovery actions
  attemptPrescriptionRecovery: (sessionId: string) => Promise<boolean>;
  resetSessionStateForRegeneration: (sessionId: string) => Promise<boolean>;

  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: TrainingPipelineStepId) => void;

  addToGenerationHistory: (prescription: SessionPrescription) => void;
  clearGenerationHistory: () => void;
  saveDraft: (customName?: string) => Promise<boolean>;
  loadDraft: (draftId: string) => Promise<boolean>;
  deleteDraft: () => Promise<boolean>;
  checkForExistingDraft: () => Promise<SavedDraft | null>;

  setLoadingState: (state: 'idle' | 'loading' | 'generating' | 'analyzing' | 'adapting', message?: string) => void;
  setError: (error: string | null) => void;
}
