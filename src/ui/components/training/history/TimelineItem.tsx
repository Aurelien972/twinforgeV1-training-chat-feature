/**
 * TimelineItem Component
 * Individual item in the progression timeline with icon, title, and details
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { IconName } from '../../../icons/registry';

export type TimelineStatus = 'completed' | 'active' | 'upcoming';

interface TimelineItemProps {
  icon: IconName;
  iconColor: string;
  title: string;
  subtitle?: string;
  description?: string;
  status: TimelineStatus;
  metrics?: Array<{ label: string; value: string }>;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  description,
  status,
  metrics,
  isLast = false
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return {
          iconBg: 'rgba(34, 197, 94, 0.15)',
          iconBorder: 'rgba(34, 197, 94, 0.4)',
          cardBg: 'rgba(255, 255, 255, 0.04)',
          cardBorder: 'rgba(255, 255, 255, 0.1)'
        };
      case 'active':
        return {
          iconBg: `rgba(${parseInt(iconColor.slice(1, 3), 16)}, ${parseInt(iconColor.slice(3, 5), 16)}, ${parseInt(iconColor.slice(5, 7), 16)}, 0.2)`,
          iconBorder: `${iconColor}60`,
          cardBg: `rgba(${parseInt(iconColor.slice(1, 3), 16)}, ${parseInt(iconColor.slice(3, 5), 16)}, ${parseInt(iconColor.slice(5, 7), 16)}, 0.08)`,
          cardBorder: `${iconColor}40`
        };
      case 'upcoming':
        return {
          iconBg: 'rgba(255, 255, 255, 0.08)',
          iconBorder: 'rgba(255, 255, 255, 0.2)',
          cardBg: 'rgba(255, 255, 255, 0.02)',
          cardBorder: 'rgba(255, 255, 255, 0.08)'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: '16px',
        paddingBottom: isLast ? '0' : '20px'
      }}
    >
      {/* Timeline line */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            left: '14px',
            top: '40px',
            bottom: '0',
            width: '3px',
            background: 'rgba(34, 197, 94, 0.2)',
            borderRadius: '2px'
          }}
        />
      )}

      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: styles.iconBg,
          border: `2px solid ${styles.iconBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 16px ${iconColor}30`,
          position: 'relative',
          zIndex: 1
        }}
      >
        <SpatialIcon
          Icon={ICONS[icon]}
          size={16}
          style={{
            color: iconColor,
            filter: `drop-shadow(0 0 4px ${iconColor}60)`
          }}
        />
      </motion.div>

      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.4
        }}
        style={{
          flex: 1,
          padding: '16px',
          borderRadius: '16px',
          background: styles.cardBg,
          border: `1.5px solid ${styles.cardBorder}`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: status === 'active' ? iconColor : 'rgba(255, 255, 255, 0.95)',
            marginBottom: subtitle || description ? '4px' : '0',
            textShadow: status === 'active' ? `0 0 8px ${iconColor}40` : 'none'
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: description ? '8px' : '0'
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Description */}
        {description && (
          <div
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.4,
              marginTop: '8px'
            }}
          >
            {description}
          </div>
        )}

        {/* Metrics */}
        {metrics && metrics.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {metrics.map((metric, index) => (
              <div key={index}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '2px'
                  }}
                >
                  {metric.label}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TimelineItem;
