/**
 * TrainingEmptyState Component
 * Empty state when no training data is available
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../cards/GlassCard';
import GlowIcon from './GlowIcon';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import { Haptics } from '../../../utils/haptics';

const TRAINING_COLOR = '#18E3FF';

const TrainingEmptyState: React.FC = () => {
  const navigate = useNavigate();

  const handleStartTraining = () => {
    Haptics.press();
    navigate('/training/pipeline');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <GlassCard
        className="p-12 text-center space-y-8"
        style={{
          background: `
            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, color-mix(in srgb, ${TRAINING_COLOR} 8%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 25%, transparent)`,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 40px color-mix(in srgb, ${TRAINING_COLOR} 18%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `
        }}
      >
        {/* Hero Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2
          }}
          className="flex justify-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
          >
            <GlowIcon
              icon="Dumbbell"
              color={TRAINING_COLOR}
              size="hero"
              glowIntensity={70}
              animate={true}
            />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2
            className="text-4xl font-bold text-white mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Lancez votre premier training
          </h2>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            Commencez votre parcours fitness avec un programme adapté à vos objectifs et votre morphologie
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 max-w-lg mx-auto"
        >
          {[
            {
              icon: ICONS.Target,
              text: 'Programmes personnalisés basés sur votre profil'
            },
            {
              icon: ICONS.Activity,
              text: 'Suivi temps réel avec coach IA'
            },
            {
              icon: ICONS.TrendingUp,
              text: 'Progression automatique adaptative'
            }
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${TRAINING_COLOR} 30%, transparent)`
                }}
              >
                <SpatialIcon
                  Icon={benefit.icon}
                  size={20}
                  style={{
                    color: TRAINING_COLOR,
                    filter: `drop-shadow(0 0 8px ${TRAINING_COLOR}60)`
                  }}
                />
              </div>
              <p className="text-white/80 text-left">{benefit.text}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={handleStartTraining}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="px-12 py-5 rounded-xl font-bold text-xl shadow-2xl"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, ${TRAINING_COLOR}80 0%, transparent 70%),
                ${TRAINING_COLOR}40
              `,
              border: `2px solid ${TRAINING_COLOR}80`,
              color: '#FFFFFF',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              boxShadow: `
                0 12px 40px rgba(0, 0, 0, 0.4),
                0 0 40px ${TRAINING_COLOR}40,
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <span>Commencer maintenant</span>
              <SpatialIcon
                Icon={ICONS.ArrowRight}
                size={28}
                style={{
                  color: '#FFFFFF',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                }}
              />
            </div>
          </motion.button>
        </motion.div>

        {/* Secondary Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-8 pt-4"
        >
          {[ICONS.Clock, ICONS.Target, ICONS.TrendingUp].map((Icon, index) => (
            <motion.div
              key={index}
              animate={{
                y: [0, -5, 0],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3
              }}
            >
              <SpatialIcon
                Icon={Icon}
                size={32}
                style={{
                  color: TRAINING_COLOR,
                  opacity: 0.5
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>
    </motion.div>
  );
};

export default TrainingEmptyState;
