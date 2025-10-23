/**
 * Force Training Animation Configurations
 * Framer Motion animation presets for consistent motion design
 */

import type { Transition, Variants } from 'framer-motion';

/**
 * Easing curves
 */
export const EASING = {
  smooth: [0.16, 1, 0.3, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  swift: [0.4, 0, 0.2, 1] as const,
} as const;

/**
 * Spring configurations
 */
export const SPRING_CONFIG = {
  default: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 10,
  },
  stiff: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
  },
} as const;

/**
 * Fade in animation
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Scale animation
 */
export const scaleIn: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

/**
 * Slide up animation
 */
export const slideUp: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

/**
 * Card hover animation
 */
export const cardHover = {
  scale: 1.02,
  y: -2,
  transition: { duration: 0.2 },
};

/**
 * Card tap animation
 */
export const cardTap = {
  scale: 0.98,
  y: 0,
};

/**
 * Button hover animation
 */
export const buttonHover = {
  scale: 1.05,
  transition: SPRING_CONFIG.default,
};

/**
 * Button tap animation
 */
export const buttonTap = {
  scale: 0.95,
};

/**
 * Pulse animation for countdown
 */
export const pulse: Variants = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Countdown number animation
 */
export const countdownNumber: Variants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 1.5, opacity: 0 },
};

/**
 * Rotate animation for loading
 */
export const rotate: Transition = {
  duration: 1,
  repeat: Infinity,
  ease: 'linear',
};

/**
 * Expand/collapse animation
 */
export const expandCollapse: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1 },
};
