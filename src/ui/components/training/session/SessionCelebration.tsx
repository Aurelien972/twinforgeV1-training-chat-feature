/**
 * SessionCelebration Component
 * Full-screen celebration overlay after completing a training session
 * Displays achievements, badges, stats, and coach message
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import TrainingButton from '../../../../app/pages/Training/Pipeline/components/TrainingButton';
import { Haptics } from '../../../../utils/haptics';
import type { SessionFeedback, SessionPrescription } from '../../../../system/store/trainingPipeline/types';
import type { IconName } from '../../../icons/registry';
import { TRAINING_COACH_MESSAGES } from '../../../config/trainingCoachMessages';
import { calculateSessionVolume } from '../../../../utils/loadUtils';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  emoji: string;
}

interface SessionCelebrationProps {
  sessionFeedback: SessionFeedback;
  sessionPrescription: SessionPrescription;
  onContinue: () => void;
}

const SessionCelebration: React.FC<SessionCelebrationProps> = ({
  sessionFeedback,
  sessionPrescription,
  onContinue,
}) => {
  const [showCoachMessage, setShowCoachMessage] = useState(false);
  const celebrationColor = '#22C55E';

  useEffect(() => {
    Haptics.success();

    const timer = setTimeout(() => {
      setShowCoachMessage(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Calculate stats
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exercisesCompleted = sessionFeedback.exercises.filter(ex => ex.completed).length;
  const totalExercises = sessionPrescription.exercises.length;
  const avgRpe = sessionFeedback.overallRpe;

  // Calculate badges
  const calculateTotalVolume = () => {
    return calculateSessionVolume(sessionFeedback.exercises);
  };

  const calculateCaloriesBurned = () => {
    const totalVolume = calculateTotalVolume();
    const durationMinutes = sessionFeedback.durationActual / 60;
    const avgRpe = sessionFeedback.overallRpe || 7;

    if (isNaN(totalVolume) || isNaN(durationMinutes) || isNaN(avgRpe)) {
      return 0;
    }

    const baseCalories = (totalVolume / 100) + (durationMinutes * 5);
    const rpeMultiplier = 0.8 + (avgRpe / 10) * 0.4;
    const result = Math.round(baseCalories * rpeMultiplier);
    return isNaN(result) ? 0 : result;
  };

  const totalVolume = calculateTotalVolume();
  const caloriesBurned = calculateCaloriesBurned();
  const completionRate = exercisesCompleted / totalExercises;
  const avgTechnique = sessionFeedback.exercises.reduce((sum, ex) => sum + (ex.technique || 0), 0) / sessionFeedback.exercises.length;

  // Define badges
  const allBadges: Badge[] = [
    {
      id: 'volume-king',
      name: 'Volume King',
      description: '+5000kg',
      icon: 'Weight',
      color: '#8B5CF6',
      emoji: '👑',
    },
    {
      id: 'perfect-form',
      name: 'Perfect Form',
      description: 'Technique 8+',
      icon: 'Award',
      color: '#22C55E',
      emoji: '🎯',
    },
    {
      id: 'calorie-crusher',
      name: 'Calorie Crusher',
      description: '+400 cal',
      icon: 'Flame',
      color: '#EF4444',
      emoji: '🔥',
    },
    {
      id: 'consistency-master',
      name: 'Consistency Master',
      description: '100% complété',
      icon: 'CheckCircle',
      color: '#3B82F6',
      emoji: '✅',
    },
  ];

  const earnedBadges = allBadges.filter((badge) => {
    if (badge.id === 'volume-king') return totalVolume >= 5000;
    if (badge.id === 'perfect-form') return avgTechnique >= 8;
    if (badge.id === 'calorie-crusher') return caloriesBurned >= 400;
    if (badge.id === 'consistency-master') return completionRate === 1;
    return false;
  }).slice(0, 3);

  // Get random coach message
  const getCoachMessage = () => {
    const messages = [
      "Incroyable performance ! Tu as tout donné 💪",
      "Quelle séance ! Je suis fier de toi 🔥",
      "Tu viens de franchir un nouveau cap ! 🚀",
      "Excellente exécution, champion ! 🏆",
      "Cette séance était parfaite, continue ! ⚡",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const coachMessage = getCoachMessage();

  // Confetti particles (random positions)
  const confettiCount = 8;
  const confetti = Array.from({ length: confettiCount }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    color: ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)],
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 celebration-main-content"
      style={{
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 celebration-background-effects" style={{ pointerEvents: 'none' }}>
        {/* Ambient Glow */}
        <motion.div
          className="celebration-ambient-glow"
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '600px',
            background: `radial-gradient(circle, ${celebrationColor}30 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />

        {/* Floating Particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`celebration-particle celebration-particle--${i + 1}`}
            style={{
              position: 'absolute',
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              width: '4px',
              height: '4px',
              background: celebrationColor,
              borderRadius: '50%',
              boxShadow: `0 0 12px ${celebrationColor}`,
            }}
          />
        ))}

        {/* Rays */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`ray-${i}`}
            className={`celebration-ray celebration-ray--${i + 1}`}
            style={{
              position: 'absolute',
              bottom: '50%',
              left: '50%',
              width: '2px',
              height: '40vh',
              background: `linear-gradient(to top, ${celebrationColor}40, transparent)`,
              transformOrigin: 'bottom center',
              transform: `translateX(-50%) rotate(${i * 60}deg)`,
            }}
          />
        ))}

        {/* Confetti */}
        {confetti.map((conf) => (
          <motion.div
            key={`confetti-${conf.id}`}
            className={`celebration-confetti celebration-confetti--${conf.id + 1}`}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${conf.left}%`,
              width: '10px',
              height: '10px',
              background: conf.color,
              borderRadius: '2px',
              animationDelay: `${conf.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative w-full max-w-2xl space-y-6"
        style={{ zIndex: 1 }}
      >
        {/* Hero Section */}
        <div className="text-center space-y-4">
          {/* Icon with Pulse Rings */}
          <motion.div
            className="flex justify-center relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            {/* Pulse Rings */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={`ring-${i}`}
                className={`celebration-icon-pulse-ring celebration-icon-pulse-ring--${i}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: `3px solid ${celebrationColor}`,
                  borderRadius: '50%',
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}

            {/* Main Icon */}
            <motion.div
              className="celebration-icon-outer-glow"
              style={{
                padding: '32px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${celebrationColor}20 0%, transparent 70%)`,
              }}
            >
              <motion.div
                className="celebration-icon-inner-container"
                style={{
                  padding: '24px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${celebrationColor}30 0%, rgba(255, 255, 255, 0.1) 100%)`,
                  border: `3px solid ${celebrationColor}60`,
                  '--celebration-color': celebrationColor,
                } as React.CSSProperties}
              >
                <SpatialIcon Icon={ICONS.Trophy} size={64} style={{ color: celebrationColor }} />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="celebration-title-glow text-4xl md:text-5xl font-bold text-white"
            style={{
              letterSpacing: '-0.02em',
              '--celebration-color': celebrationColor,
            } as React.CSSProperties}
          >
            Séance Terminée !
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/70 text-lg"
          >
            Tu as tout donné, bravo champion !
          </motion.p>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard
            className="p-6"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, color-mix(in srgb, ${celebrationColor} 12%, transparent) 0%, transparent 60%),
                rgba(255, 255, 255, 0.08)
              `,
              border: `2px solid color-mix(in srgb, ${celebrationColor} 25%, transparent)`,
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.3),
                0 0 40px color-mix(in srgb, ${celebrationColor} 18%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.12)
              `,
            }}
          >
            <div className="grid grid-cols-3 gap-4">
              {/* Duration */}
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <GlowIcon icon="Clock" color="#3B82F6" size="medium" glowIntensity={40} />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatDuration(sessionFeedback.durationActual)}
                </p>
                <p className="text-white/60 text-sm">Durée</p>
              </div>

              {/* Exercises */}
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <GlowIcon icon="Dumbbell" color="#8B5CF6" size="medium" glowIntensity={40} />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {exercisesCompleted}/{totalExercises}
                </p>
                <p className="text-white/60 text-sm">Exercices</p>
              </div>

              {/* RPE */}
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <GlowIcon icon="Activity" color="#F59E0B" size="medium" glowIntensity={40} />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{avgRpe}/10</p>
                <p className="text-white/60 text-sm">RPE Moyen</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <GlassCard
              className="p-6 space-y-4"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${celebrationColor} 10%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `2px solid color-mix(in srgb, ${celebrationColor} 20%, transparent)`,
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.2),
                  0 0 24px color-mix(in srgb, ${celebrationColor} 15%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `,
              }}
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-1 flex items-center justify-center gap-2">
                  <span className="text-2xl">🏆</span>
                  Accomplissements
                </h3>
                <p className="text-white/60 text-sm">
                  {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''} débloqué
                  {earnedBadges.length > 1 ? 's' : ''} !
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {earnedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.9 + index * 0.15,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{
                        background: `
                          radial-gradient(circle at 50% 30%, color-mix(in srgb, ${badge.color} 15%, transparent) 0%, transparent 70%),
                          rgba(255, 255, 255, 0.06)
                        `,
                        border: `2px solid color-mix(in srgb, ${badge.color} 30%, transparent)`,
                        boxShadow: `
                          0 4px 20px rgba(0, 0, 0, 0.2),
                          0 0 30px color-mix(in srgb, ${badge.color} 20%, transparent),
                          inset 0 1px 0 rgba(255, 255, 255, 0.12)
                        `,
                      }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                        className="flex justify-center mb-2"
                      >
                        <div className="relative">
                          <GlowIcon icon={badge.icon} color={badge.color} size="small" glowIntensity={50} animate={true} />
                          <motion.div
                            className="absolute -top-1 -right-1 text-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + index * 0.15, type: 'spring', stiffness: 300 }}
                          >
                            {badge.emoji}
                          </motion.div>
                        </div>
                      </motion.div>
                      <h4 className="font-bold text-white text-xs mb-1">{badge.name}</h4>
                      <p className="text-white/60 text-xs">{badge.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Coach Message Bubble */}
        <AnimatePresence>
          {showCoachMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <GlassCard
                className="p-5"
                style={{
                  background: `
                    radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 60%),
                    rgba(255, 255, 255, 0.08)
                  `,
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: `
                    0 4px 20px rgba(0, 0, 0, 0.25),
                    0 0 30px rgba(16, 185, 129, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.12)
                  `,
                }}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <GlowIcon icon="MessageCircle" color="#10B981" size="medium" glowIntensity={40} />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">Coach</h4>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        IA
                      </span>
                    </div>
                    <p className="text-white/90 leading-relaxed">{coachMessage}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="relative">
            {/* Shimmer Effect */}
            <motion.div
              className="celebration-cta-shimmer"
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent, ${celebrationColor}40, transparent)`,
                borderRadius: '12px',
                pointerEvents: 'none',
              }}
            />

            {/* Sparkles */}
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={`sparkle-${i}`}
                className={`celebration-cta-sparkle celebration-cta-sparkle--${i}`}
                style={{
                  position: 'absolute',
                  top: `${20 + Math.random() * 60}%`,
                  left: `${10 + Math.random() * 80}%`,
                  width: '6px',
                  height: '6px',
                  background: celebrationColor,
                  borderRadius: '50%',
                  boxShadow: `0 0 12px ${celebrationColor}`,
                  pointerEvents: 'none',
                }}
              />
            ))}

            <TrainingButton
              variant="primary"
              size="lg"
              icon="BarChart3"
              iconPosition="right"
              onClick={() => {
                Haptics.press();
                onContinue();
              }}
              fullWidth
              stepColor={celebrationColor}
            >
              Voir mon Analyse Détaillée
            </TrainingButton>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SessionCelebration;
