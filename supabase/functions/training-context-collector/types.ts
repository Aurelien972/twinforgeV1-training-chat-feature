/**
 * Types and Interfaces for Training Context Collector
 */

export interface ContextCollectorRequest {
  userId: string;
}

export interface ContextCollectorResponse {
  success: boolean;
  data?: {
    userContext: any;
    summary: string;
    keyFactors: string[];
    warnings: string[];
  };
  error?: string;
  metadata: {
    agentType: string;
    modelUsed: string;
    reasoningEffort: string;
    verbosity: string;
    tokensUsed?: number;
    costUsd?: number;
    latencyMs: number;
    cached: boolean;
  };
}

export interface TrainingSession {
  id: string;
  user_id: string;
  prescription_data: any;
  created_at: string;
  completed_at?: string;
}

export interface UserProfile {
  id: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  fitness_level?: string;
  training_goals?: string[];
  movements_to_avoid?: string[];
  injuries?: string[];
  availability_hours?: number;
}

export interface TrainingGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value?: number;
  current_value?: number;
  deadline?: string;
  is_active: boolean;
  created_at: string;
}

export interface LocationEquipment {
  equipment_name: string;
  is_custom: boolean;
}

export interface TrainingLocation {
  id: string;
  user_id: string;
  name?: string;
  type: 'home' | 'gym' | 'outdoor';
  is_default: boolean;
  equipment: LocationEquipment[];
}
