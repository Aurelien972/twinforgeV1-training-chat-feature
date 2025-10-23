/**
 * Muscle Groups Badges Component
 * Reusable component to display targeted muscle groups as badges
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';

interface MuscleGroupsBadgesProps {
  muscleGroups?: string[];
  disciplineColor: string;
  className?: string;
}

const MuscleGroupsBadges: React.FC<MuscleGroupsBadgesProps> = ({
  muscleGroups,
  disciplineColor,
  className = ''
}) => {
  if (!muscleGroups || muscleGroups.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={`space-y-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        <SpatialIcon
          Icon={ICONS.Target}
          size={14}
          variant="pure"
          style={{ color: disciplineColor, opacity: 0.8 }}
        />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: disciplineColor, opacity: 0.8 }}
        >
          Muscles ciblés
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {muscleGroups.map((muscle, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: `color-mix(in srgb, ${disciplineColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${disciplineColor} 30%, transparent)`,
              color: disciplineColor,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: `0 2px 8px color-mix(in srgb, ${disciplineColor} 10%, transparent)`
            }}
          >
            {muscle}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MuscleGroupsBadges;
