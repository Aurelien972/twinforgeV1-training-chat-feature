/**
 * TodayEmptyState Component
 * Premium empty state for Today tab when no training data exists
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';

const TRAINING_COLOR = '#18E3FF';

const TodayEmptyState: React.FC = () => {
  const navigate = useNavigate();

  const handleStartTraining = () => {
    Haptics.press();
    navigate('/training/pipeline');
  };

  const handleSetGoals = () => {
    Haptics.press();
    navigate('/profile');
  };

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Bon matin';
    if (currentHour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getMotivation = () => {
    if (currentHour < 10) return 'C\'est le moment idéal pour s\'entraîner !';
    if (currentHour < 14) return 'Une séance maintenant maximisera votre énergie !';
    if (currentHour < 18) return 'Finissez votre journée en force !';
    return 'Une session relaxante avant le repos ?';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Main Hero Card */}
      <GlassCard
        className="p-10 text-center space-y-8"
        style={{
          background: `
            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, color-mix(in srgb, ${TRAINING_COLOR} 8%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 30%, transparent)`,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 40px color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `
        }}
      >
        {/* Animated Icons Cluster */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2
          }}
          className="flex justify-center items-center gap-4"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <GlowIcon
              icon="Dumbbell"
              color={TRAINING_COLOR}
              size="large"
              glowIntensity={60}
              animate={true}
            />
          </motion.div>

          <motion.div
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          >
            <GlowIcon
              icon="Target"
              color="#F59E0B"
              size="medium"
              glowIntensity={50}
            />
          </motion.div>

          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1
            }}
          >
            <GlowIcon
              icon="TrendingUp"
              color="#22C55E"
              size="medium"
              glowIntensity={50}
            />
          </motion.div>
        </motion.div>

        {/* Greeting & Motivation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2
            className="text-4xl font-bold text-white mb-3"
            style={{ letterSpacing: '-0.02em' }}
          >
            {getGreeting()} !
          </h2>
          <p className="text-xl text-white/80 mb-2">
            {getMotivation()}
          </p>
          <p className="text-white/60">
            Votre atelier de training vous attend
          </p>
        </motion.div>

        {/* CTA Primary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <motion.button
            onClick={handleStartTraining}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="px-14 py-6 rounded-xl font-bold text-xl shadow-2xl"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, ${TRAINING_COLOR}90 0%, transparent 70%),
                linear-gradient(135deg, ${TRAINING_COLOR}60, ${TRAINING_COLOR}40)
              `,
              border: `2px solid ${TRAINING_COLOR}`,
              color: '#FFFFFF',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              boxShadow: `
                0 12px 40px rgba(0, 0, 0, 0.4),
                0 0 50px ${TRAINING_COLOR}50,
                inset 0 1px 0 rgba(255, 255, 255, 0.25)
              `
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <SpatialIcon
                Icon={ICONS.Play}
                size={28}
                style={{
                  color: '#FFFFFF',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                }}
              />
              <span>Lancer une séance</span>
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
      </GlassCard>

      {/* Stats Preview Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { icon: ICONS.Calendar, label: 'Séances', value: '0', color: '#A855F7' },
          { icon: ICONS.Trophy, label: 'Records', value: '0', color: '#F59E0B' },
          { icon: ICONS.TrendingUp, label: 'Progression', value: 'À débloquer', color: '#22C55E' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.1 }}
          >
            <GlassCard
              className="p-5"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stat.color} 12%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.05)
                `,
                border: `1px solid color-mix(in srgb, ${stat.color} 25%, transparent)`
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `color-mix(in srgb, ${stat.color} 20%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${stat.color} 35%, transparent)`
                  }}
                >
                  <SpatialIcon
                    Icon={stat.icon}
                    size={20}
                    style={{ color: stat.color }}
                  />
                </div>
                <span className="text-white/60 text-sm">{stat.label}</span>
              </div>
              <div
                className="text-3xl font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <SpatialIcon Icon={ICONS.Zap} size={20} style={{ color: '#F59E0B' }} />
            Démarrez rapidement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.button
              onClick={handleStartTraining}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg text-left transition-all"
              style={{
                background: 'rgba(24, 227, 255, 0.1)',
                border: '1px solid rgba(24, 227, 255, 0.25)'
              }}
            >
              <div className="flex items-center gap-3">
                <SpatialIcon Icon={ICONS.Dumbbell} size={24} style={{ color: TRAINING_COLOR }} />
                <div>
                  <div className="text-white font-semibold">Créer une séance</div>
                  <div className="text-white/60 text-sm">Programme personnalisé IA</div>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={handleSetGoals}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg text-left transition-all"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}
            >
              <div className="flex items-center gap-3">
                <SpatialIcon Icon={ICONS.Target} size={24} style={{ color: '#F59E0B' }} />
                <div>
                  <div className="text-white font-semibold">Définir mes objectifs</div>
                  <div className="text-white/60 text-sm">Personnaliser mon profil</div>
                </div>
              </div>
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default TodayEmptyState;
