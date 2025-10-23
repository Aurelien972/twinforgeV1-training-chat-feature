/**
 * Endurance Countdown Helper
 * Wrapper for countdowns in endurance sessions
 */

import React from 'react';
import { PreparationCountdown } from '../../force';
import { SetCountdown } from '../../session';

interface EnduranceCountdownHelperProps {
  type: 'preparation' | 'transition';
  blockName?: string;
  intervalNumber?: number;
  onComplete: () => void;
  stepColor: string;
}

const EnduranceCountdownHelper: React.FC<EnduranceCountdownHelperProps> = ({
  type,
  blockName,
  intervalNumber,
  onComplete,
  stepColor,
}) => {
  if (type === 'preparation') {
    return (
      <PreparationCountdown
        duration={10}
        exerciseName={blockName || 'Début de la séance'}
        onComplete={onComplete}
        stepColor={stepColor}
      />
    );
  }

  if (type === 'transition') {
    return (
      <SetCountdown
        duration={3}
        onComplete={onComplete}
        stepColor={stepColor}
      />
    );
  }

  return null;
};

export default EnduranceCountdownHelper;
