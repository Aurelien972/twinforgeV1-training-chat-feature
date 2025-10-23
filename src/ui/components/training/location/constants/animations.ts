/**
 * Animation Constants
 * Configurations d'animations réutilisables pour Framer Motion
 */

import type { Variants } from 'framer-motion';

/**
 * Animation de fade in/out standard
 */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

/**
 * Animation de scale in/out
 */
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

/**
 * Animation de slide depuis la droite
 */
export const slideRightVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

/**
 * Animation de slide depuis le bas
 */
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

/**
 * Configuration de transition standard
 */
export const standardTransition = {
  duration: 0.3,
  ease: 'easeInOut'
};

/**
 * Configuration de transition spring
 */
export const springTransition = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 15
};

/**
 * Animation de pulsation pour les badges nouveaux
 */
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1]
};

/**
 * Configuration de pulsation
 */
export const pulseTransition = {
  duration: 2,
  repeat: Infinity,
  ease: 'easeInOut' as const
};

/**
 * Animation de shimmer (effet de scan)
 */
export const shimmerAnimation = {
  x: ['-100%', '400%']
};

/**
 * Configuration du shimmer
 */
export const shimmerTransition = {
  duration: 1.5,
  repeat: Infinity,
  ease: 'linear' as const
};

/**
 * Animation de rotation (spinner)
 */
export const spinAnimation = {
  rotate: 360
};

/**
 * Configuration de rotation
 */
export const spinTransition = {
  duration: 2,
  repeat: Infinity,
  ease: 'linear' as const
};

/**
 * Animation de hover standard pour les boutons
 */
export const buttonHoverAnimation = {
  scale: 1.02,
  y: -2
};

/**
 * Animation de tap standard pour les boutons
 */
export const buttonTapAnimation = {
  scale: 0.98,
  y: 0
};

/**
 * Délais d'animation en cascade
 */
export const cascadeDelays = {
  item1: 0.1,
  item2: 0.2,
  item3: 0.3,
  item4: 0.4,
  item5: 0.5
};
