import { IconCompositionRenderer } from './IconCompositionRenderer';
import { EnduranceZonesChart } from './EnduranceZonesChart';
import { FunctionalTimelineChart } from './FunctionalTimelineChart';
import { CompetitionsCircuitChart } from './CompetitionsCircuitChart';
import type { IllustrationData } from '../../../../system/services/trainingIllustrationService';

interface IllustrationDisplayProps {
  illustration: IllustrationData;
  className?: string;
}

export function IllustrationDisplay({
  illustration,
  className = ''
}: IllustrationDisplayProps) {
  if (illustration.type === 'icon_composition') {
    return (
      <IconCompositionRenderer
        data={illustration.data}
        className={className}
      />
    );
  }

  if (illustration.type === 'data_visualization') {
    switch (illustration.coachType) {
      case 'endurance':
        return (
          <EnduranceZonesChart
            data={illustration.data}
            className={className}
          />
        );

      case 'functional':
        return (
          <FunctionalTimelineChart
            data={illustration.data}
            className={className}
          />
        );

      case 'competitions':
        return (
          <CompetitionsCircuitChart
            data={illustration.data}
            className={className}
          />
        );

      default:
        return null;
    }
  }

  return null;
}
