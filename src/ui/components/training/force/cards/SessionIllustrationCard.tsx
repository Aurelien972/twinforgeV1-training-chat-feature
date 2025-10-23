/**
 * Session Illustration Card
 * Displays session overview chart with exercise visualization
 */

import { ForceSessionChart } from '../../illustrations/ForceSessionChart';
import type { SessionPrescription } from '../../../../../system/store/trainingPipeline/types';

interface SessionIllustrationCardProps {
  prescription: SessionPrescription;
  onExerciseClick?: (exerciseId: string) => void;
  className?: string;
}

export function SessionIllustrationCard({
  prescription,
  onExerciseClick,
  className = ''
}: SessionIllustrationCardProps) {
  const category = prescription.category || prescription.type;
  const durationTarget = prescription.durationTarget || 60;

  return (
    <div className="w-full max-w-full overflow-hidden">
      <ForceSessionChart
        data={{
          exercises: prescription.exercises,
          sessionName: prescription.sessionName,
          category,
          totalDuration: durationTarget
        }}
        onExerciseClick={onExerciseClick}
        className={className}
      />
    </div>
  );
}
