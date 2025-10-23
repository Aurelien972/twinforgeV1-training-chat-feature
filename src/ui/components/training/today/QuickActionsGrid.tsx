/**
 * QuickActionsGrid Component
 * Grid of quick action buttons for common training tasks
 */

import React from 'react';
import { motion } from 'framer-motion';
import QuickActionButton from './QuickActionButton';
import type { QuickAction } from '../../../../system/services/step5RecommendationService';

interface QuickActionsGridProps {
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  stepColor: string;
}

const actionIconMap: Record<string, string> = {
  schedule: 'Calendar',
  adjust: 'Settings',
  history: 'History',
  goals: 'Target',
  equipment: 'Dumbbell',
  nutrition: 'Utensils',
  recovery: 'Moon',
  stats: 'TrendingUp'
};

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  actions,
  onActionClick,
  stepColor
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        width: '100%'
      }}
    >
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.05,
            duration: 0.3,
            type: 'spring',
            stiffness: 200
          }}
        >
          <QuickActionButton
            type={action.type as any}
            icon={actionIconMap[action.type] || 'Zap'}
            label={action.label}
            onClick={() => onActionClick(action)}
            color={stepColor}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default QuickActionsGrid;
