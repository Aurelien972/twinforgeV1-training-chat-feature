/**
 * Training Button Component
 * Reusable button with 3D effects and VisionOS 26+ styling
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../../ui/icons/registry';
import { useFeedback } from '../../../../../hooks/useFeedback';

interface TrainingButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof ICONS;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  stepColor?: string;
}

const TrainingButton: React.FC<TrainingButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  stepColor = 'var(--circuit-training)'
}) => {
  const { glassClick } = useFeedback();

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      glassClick();
      onClick();
    }
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const variantStyles = {
    primary: {
      background: `
        radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 40%, transparent) 0%, transparent 60%),
        radial-gradient(circle at 70% 80%, color-mix(in srgb, var(--brand-primary) 35%, transparent) 0%, transparent 50%),
        rgba(255, 255, 255, 0.15)
      `,
      border: `2px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
      boxShadow: `
        0 8px 24px rgba(0, 0, 0, 0.3),
        0 0 40px color-mix(in srgb, ${stepColor} 25%, transparent),
        inset 0 2px 0 rgba(255, 255, 255, 0.25),
        inset 0 -2px 0 rgba(0, 0, 0, 0.15)
      `,
      color: '#FFFFFF',
      textShadow: `0 0 20px color-mix(in srgb, ${stepColor} 60%, transparent)`
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      boxShadow: `
        0 4px 16px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
      `,
      color: '#FFFFFF'
    },
    ghost: {
      background: 'transparent',
      border: '2px solid transparent',
      boxShadow: 'none',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    danger: {
      background: `
        radial-gradient(circle at 30% 20%, color-mix(in srgb, #EF4444 40%, transparent) 0%, transparent 60%),
        rgba(239, 68, 68, 0.15)
      `,
      border: '2px solid color-mix(in srgb, #EF4444 50%, transparent)',
      boxShadow: `
        0 8px 24px rgba(239, 68, 68, 0.3),
        inset 0 2px 0 rgba(255, 255, 255, 0.2),
        inset 0 -2px 0 rgba(0, 0, 0, 0.15)
      `,
      color: '#FFFFFF'
    }
  };

  const Icon = icon ? ICONS[icon] : null;

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative rounded-xl font-semibold
        transition-all duration-200
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        ...variantStyles[variant],
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        willChange: 'transform, box-shadow',
        transform: 'translateZ(0)'
      }}
      whileHover={!disabled && !loading ? {
        y: -2,
        boxShadow: variant === 'primary'
          ? `
            0 12px 32px rgba(0, 0, 0, 0.4),
            0 0 60px color-mix(in srgb, ${stepColor} 35%, transparent),
            inset 0 3px 0 rgba(255, 255, 255, 0.3),
            inset 0 -3px 0 rgba(0, 0, 0, 0.2)
          `
          : variant === 'danger'
          ? `
            0 12px 32px rgba(239, 68, 68, 0.4),
            inset 0 3px 0 rgba(255, 255, 255, 0.25),
            inset 0 -3px 0 rgba(0, 0, 0, 0.2)
          `
          : `
            0 8px 24px rgba(0, 0, 0, 0.35),
            inset 0 2px 0 rgba(255, 255, 255, 0.2),
            inset 0 -2px 0 rgba(0, 0, 0, 0.15)
          `,
        transition: { duration: 0.2, ease: 'easeOut' }
      } : undefined}
      whileTap={!disabled && !loading ? {
        y: 1,
        scale: 0.98,
        boxShadow: `
          0 2px 8px rgba(0, 0, 0, 0.5),
          inset 0 3px 8px rgba(0, 0, 0, 0.3)
        `,
        transition: { duration: 0.1 }
      } : undefined}
    >
      <div className="flex items-center justify-center gap-2">
        {icon && iconPosition === 'left' && Icon && (
          <SpatialIcon
            Icon={Icon}
            size={iconSizes[size]}
            className={loading ? 'opacity-0' : ''}
          />
        )}

        {loading ? (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <SpatialIcon Icon={ICONS.Loader2} size={iconSizes[size]} />
            </motion.div>
            <span>{children}</span>
          </motion.div>
        ) : (
          <span>{children}</span>
        )}

        {icon && iconPosition === 'right' && Icon && !loading && (
          <SpatialIcon
            Icon={Icon}
            size={iconSizes[size]}
          />
        )}
      </div>
    </motion.button>
  );
};

export default TrainingButton;
