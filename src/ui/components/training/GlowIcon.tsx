/**
 * GlowIcon - Composant d'icône lumineuse réutilisable
 * Style consistant avec les icônes de la Homepage
 *
 * Système de dimensionnement proportionnel:
 * - Ratio icône/container: 65% pour un équilibre optimal
 * - L'icône est toujours proportionnelle au cercle glow
 * - Support pour override manuel via iconSizeOverride si besoin spécifique
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS, type IconName } from '../../icons/registry';

type IconSize = 'tiny' | 'small' | 'medium' | 'large' | 'xl' | 'hero';

interface GlowIconProps {
  icon: IconName;
  color: string;
  size?: IconSize;
  glowIntensity?: number;
  className?: string;
  animate?: boolean;
  iconSizeOverride?: number;
}

const ICON_RATIO = 0.65;

const SIZE_CONFIG = {
  tiny: {
    container: 24,
    icon: Math.round(24 * ICON_RATIO),
  },
  small: {
    container: 32,
    icon: Math.round(32 * ICON_RATIO),
  },
  medium: {
    container: 48,
    icon: Math.round(48 * ICON_RATIO),
  },
  large: {
    container: 64,
    icon: Math.round(64 * ICON_RATIO),
  },
  xl: {
    container: 110,
    icon: Math.round(110 * ICON_RATIO),
  },
  hero: {
    container: 140,
    icon: Math.round(140 * ICON_RATIO),
  },
};

const GlowIcon: React.FC<GlowIconProps> = ({
  icon,
  color,
  size = 'medium',
  glowIntensity = 40,
  className = '',
  animate = false,
  iconSizeOverride,
}) => {
  const safeSize = SIZE_CONFIG[size] ? size : 'medium';
  const { container, icon: iconSize } = SIZE_CONFIG[safeSize];
  const finalIconSize = iconSizeOverride ?? iconSize;

  const containerStyles: React.CSSProperties = {
    width: `${container}px`,
    height: `${container}px`,
    background: `
      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
      linear-gradient(135deg, color-mix(in srgb, ${color} 35%, transparent), color-mix(in srgb, ${color} 25%, transparent))
    `,
    border: `2px solid color-mix(in srgb, ${color} 50%, transparent)`,
    boxShadow: `0 0 30px color-mix(in srgb, ${color} ${glowIntensity}%, transparent)`,
  };

  const iconStyles: React.CSSProperties = {
    color: color,
    filter: `drop-shadow(0 0 8px color-mix(in srgb, ${color} 60%, transparent))`,
    ...(iconSizeOverride ? { transform: 'scale(2)' } : {}),
  };

  const IconComponent = ICONS[icon];

  const content = (
    <div
      className={`rounded-full flex items-center justify-center ${className}`}
      style={containerStyles}
    >
      <SpatialIcon
        Icon={IconComponent}
        size={finalIconSize}
        style={iconStyles}
        variant="pure"
      />
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

export default GlowIcon;
