/**
 * FloatingGenerateButton Component
 * Full-width floating CTA button with text that appears after location selection
 * Positioned above bottom bar on mobile/tablet, at bottom on desktop
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';

interface FloatingGenerateButtonProps {
  visible: boolean;
  onClick: () => void;
  disabled?: boolean;
  stepColor: string;
  locationName?: string;
}

const FloatingGenerateButton: React.FC<FloatingGenerateButtonProps> = ({
  visible,
  onClick,
  disabled = false,
  stepColor,
  locationName
}) => {
  return (
    <AnimatePresence>
      {visible && !disabled && (
        <motion.button
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: 0.2
            }
          }}
          exit={{
            opacity: 0,
            y: 100,
            scale: 0.9,
            transition: { duration: 0.2 }
          }}
          whileHover={{
            scale: 1.02,
            y: -2,
            transition: { duration: 0.2 }
          }}
          whileTap={{
            scale: 0.98,
            y: 0,
            transition: { duration: 0.1 }
          }}
          onClick={onClick}
          className="floating-generate-button"
          style={{
            '--step-color': stepColor
          } as React.CSSProperties}
          aria-label={locationName ? `Générer ma séance avec ${locationName}` : 'Générer ma séance'}
        >
          {/* Icon with glow effect */}
          <motion.div
            className="floating-generate-button__icon"
            animate={{
              filter: [
                `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 60%, transparent))`,
                `drop-shadow(0 0 20px color-mix(in srgb, ${stepColor} 80%, transparent))`,
                `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 60%, transparent))`
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <SpatialIcon
              Icon={ICONS.Zap}
              size={24}
              style={{
                color: stepColor
              }}
            />
          </motion.div>

          {/* Text content */}
          <div className="floating-generate-button__content">
            <span className="floating-generate-button__title">
              Générer ma Séance
            </span>
            {locationName && (
              <span className="floating-generate-button__subtitle">
                {locationName}
              </span>
            )}
          </div>

          {/* Arrow icon */}
          <SpatialIcon
            Icon={ICONS.ArrowRight}
            size={20}
            className="floating-generate-button__arrow"
            style={{
              color: stepColor
            }}
          />

          {/* Background glow */}
          <motion.div
            className="floating-generate-button__glow"
            style={{
              background: `radial-gradient(circle, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 70%)`
            }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default FloatingGenerateButton;
