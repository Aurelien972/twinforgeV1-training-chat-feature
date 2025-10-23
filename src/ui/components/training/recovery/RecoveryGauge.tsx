/**
 * RecoveryGauge Component
 * Circular gauge displaying recovery percentage with color-coded status
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getRecoveryColor, getRecoveryLabel } from '../../../../config/step5RecommendationLogic';

interface RecoveryGaugeProps {
  percentage: number;
  label: string;
  size?: number;
}

const RecoveryGauge: React.FC<RecoveryGaugeProps> = ({
  percentage,
  label,
  size = 120
}) => {
  const color = getRecoveryColor(percentage);
  const statusLabel = getRecoveryLabel(percentage);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="recovery-gauge"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`
        }}
      >
        <svg
          width={size}
          height={size}
          style={{
            transform: 'rotate(-90deg)'
          }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />

          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
              delay: 0.3
            }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}40)`
            }}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.5,
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: color,
                lineHeight: 1,
                textShadow: `0 0 12px ${color}60`
              }}
            >
              {percentage}%
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '4px',
                fontWeight: 500
              }}
            >
              {statusLabel}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center'
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default RecoveryGauge;
