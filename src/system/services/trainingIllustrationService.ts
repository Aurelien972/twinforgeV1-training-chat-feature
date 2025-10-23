import { supabase } from '../supabase/client';
import type { SessionPrescription } from '../store/trainingPipeline/types';

export type IllustrationType = 'icon_composition' | 'data_visualization';

export type CoachType = 'force' | 'endurance' | 'functional' | 'competitions' | 'calisthenics';

export interface IllustrationData {
  type: IllustrationType;
  coachType: CoachType;
  data: any;
  previewUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    colors?: string[];
    chartType?: string;
    [key: string]: any;
  };
}

export interface TrainingIllustration {
  id: string;
  sessionId: string;
  coachType: CoachType;
  illustrationType: IllustrationType;
  illustrationData: any;
  previewUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export class TrainingIllustrationService {
  static async generateIllustration(
    sessionId: string,
    coachType: CoachType,
    prescription: SessionPrescription
  ): Promise<IllustrationData | null> {
    try {
      switch (coachType) {
        case 'force':
        case 'calisthenics':
          return this.generateIconComposition(coachType, prescription);

        case 'endurance':
          return this.generateEnduranceVisualization(prescription);

        case 'functional':
          return this.generateFunctionalVisualization(prescription);

        case 'competitions':
          return this.generateCompetitionsVisualization(prescription);

        default:
          return null;
      }
    } catch (error) {
      console.error('[TrainingIllustrationService] Error generating illustration:', error);
      return null;
    }
  }

  private static generateIconComposition(
    coachType: CoachType,
    prescription: SessionPrescription
  ): IllustrationData {
    const icons = this.selectIconsForPrescription(coachType, prescription);

    return {
      type: 'icon_composition',
      coachType,
      data: {
        icons,
        layout: 'grid',
        backgroundColor: coachType === 'force' ? '#1e293b' : '#0f172a',
        gradientColors: coachType === 'force'
          ? ['#3B82F6', '#60A5FA']
          : ['#06B6D4', '#22D3EE']
      },
      metadata: {
        width: 800,
        height: 400,
        colors: coachType === 'force' ? ['#3B82F6'] : ['#06B6D4']
      }
    };
  }

  private static selectIconsForPrescription(
    coachType: CoachType,
    prescription: SessionPrescription
  ): Array<{ name: string; size: number; position: { x: number; y: number }; opacity: number }> {
    const icons: Array<{ name: string; size: number; position: { x: number; y: number }; opacity: number }> = [];

    if (coachType === 'force') {
      const focus = prescription.focus || [];
      const exerciseCount = prescription.exercises?.length || 0;

      if (focus.includes('strength') || focus.includes('force')) {
        icons.push({ name: 'Dumbbell', size: 120, position: { x: 150, y: 150 }, opacity: 0.9 });
      }
      if (focus.includes('hypertrophy') || exerciseCount > 5) {
        icons.push({ name: 'Activity', size: 80, position: { x: 400, y: 180 }, opacity: 0.7 });
      }
      if (prescription.warmup) {
        icons.push({ name: 'Flame', size: 60, position: { x: 650, y: 200 }, opacity: 0.6 });
      }
    } else if (coachType === 'calisthenics') {
      icons.push({ name: 'User', size: 100, position: { x: 200, y: 160 }, opacity: 0.85 });
      icons.push({ name: 'TrendingUp', size: 70, position: { x: 450, y: 190 }, opacity: 0.7 });
      icons.push({ name: 'Target', size: 55, position: { x: 620, y: 210 }, opacity: 0.6 });
    }

    return icons;
  }

  private static generateEnduranceVisualization(
    prescription: SessionPrescription
  ): IllustrationData {
    const zones = this.extractZoneData(prescription);

    return {
      type: 'data_visualization',
      coachType: 'endurance',
      data: {
        chartType: 'zones',
        zones,
        totalDuration: prescription.durationTarget,
        discipline: prescription.discipline || 'running'
      },
      metadata: {
        width: 800,
        height: 400,
        chartType: 'bar',
        colors: ['#22C55E', '#10B981', '#059669', '#047857', '#065F46']
      }
    };
  }

  private static extractZoneData(prescription: SessionPrescription): Array<{ zone: string; duration: number; percentage: number }> {
    const zones: Array<{ zone: string; duration: number; percentage: number }> = [];
    const totalDuration = prescription.durationTarget || 60;

    if (prescription.mainWorkout) {
      const zoneMap: Record<string, number> = {};

      prescription.mainWorkout.forEach((item) => {
        const zone = item.targetZone || 'Z2';
        const duration = item.duration || 0;
        zoneMap[zone] = (zoneMap[zone] || 0) + duration;
      });

      Object.entries(zoneMap).forEach(([zone, duration]) => {
        zones.push({
          zone,
          duration,
          percentage: (duration / totalDuration) * 100
        });
      });
    }

    if (zones.length === 0) {
      zones.push({ zone: 'Z2', duration: totalDuration * 0.8, percentage: 80 });
      zones.push({ zone: 'Z3', duration: totalDuration * 0.2, percentage: 20 });
    }

    return zones.sort((a, b) => a.zone.localeCompare(b.zone));
  }

  private static generateFunctionalVisualization(
    prescription: SessionPrescription
  ): IllustrationData {
    const timeline = this.extractFunctionalTimeline(prescription);

    return {
      type: 'data_visualization',
      coachType: 'functional',
      data: {
        chartType: 'timeline',
        timeline,
        wodFormat: prescription.metrics?.wodFormat || 'AMRAP',
        targetTime: prescription.durationTarget
      },
      metadata: {
        width: 800,
        height: 400,
        chartType: 'gantt',
        colors: ['#DC2626', '#EF4444', '#F87171']
      }
    };
  }

  private static extractFunctionalTimeline(prescription: SessionPrescription): Array<{ name: string; duration: number; type: string }> {
    const timeline: Array<{ name: string; duration: number; type: string }> = [];

    if (prescription.warmup) {
      timeline.push({
        name: 'Warmup',
        duration: prescription.warmup.duration || 10,
        type: 'warmup'
      });
    }

    if (prescription.exercises && prescription.exercises.length > 0) {
      const wodDuration = prescription.durationTarget - (prescription.warmup?.duration || 0);
      timeline.push({
        name: 'WOD',
        duration: wodDuration,
        type: 'wod'
      });
    }

    return timeline;
  }

  private static generateCompetitionsVisualization(
    prescription: SessionPrescription
  ): IllustrationData {
    const stations = this.extractStationData(prescription);

    return {
      type: 'data_visualization',
      coachType: 'competitions',
      data: {
        chartType: 'circuit',
        stations,
        competitionFormat: prescription.metrics?.competitionFormat || 'HYROX'
      },
      metadata: {
        width: 800,
        height: 400,
        chartType: 'polar',
        colors: ['#F59E0B', '#FBBF24', '#FCD34D']
      }
    };
  }

  private static extractStationData(prescription: SessionPrescription): Array<{ name: string; order: number }> {
    const stations: Array<{ name: string; order: number }> = [];

    if (prescription.exercises && prescription.exercises.length > 0) {
      prescription.exercises.forEach((ex, idx) => {
        stations.push({
          name: ex.name,
          order: idx + 1
        });
      });
    }

    return stations;
  }

  static async saveIllustration(
    sessionId: string,
    illustrationData: IllustrationData
  ): Promise<TrainingIllustration | null> {
    try {
      const { data, error } = await supabase
        .from('training_session_illustrations')
        .insert({
          session_id: sessionId,
          coach_type: illustrationData.coachType,
          illustration_type: illustrationData.type,
          illustration_data: illustrationData.data,
          preview_url: illustrationData.previewUrl,
          metadata: illustrationData.metadata
        })
        .select()
        .single();

      if (error) {
        console.error('[TrainingIllustrationService] Error saving illustration:', error);
        return null;
      }

      return data as TrainingIllustration;
    } catch (error) {
      console.error('[TrainingIllustrationService] Error saving illustration:', error);
      return null;
    }
  }

  static async getIllustration(sessionId: string): Promise<TrainingIllustration | null> {
    try {
      const { data, error } = await supabase
        .from('training_session_illustrations')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        console.error('[TrainingIllustrationService] Error fetching illustration:', error);
        return null;
      }

      return data as TrainingIllustration | null;
    } catch (error) {
      console.error('[TrainingIllustrationService] Error fetching illustration:', error);
      return null;
    }
  }

  static async deleteIllustration(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('training_session_illustrations')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('[TrainingIllustrationService] Error deleting illustration:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TrainingIllustrationService] Error deleting illustration:', error);
      return false;
    }
  }
}
