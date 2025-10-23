import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { HeroCtaData } from '../../../../domain/trainingToday';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

const TRAINING_COLOR = TRAINING_COLORS.action;

const HeroTrainingCTA: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<HeroCtaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const heroData = await trainingTodayService.getHeroCtaData();
        setData(heroData);
      } catch (error) {
        console.error('Error loading hero CTA data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStartTraining = () => {
    Haptics.press();
    navigate('/training/pipeline');
  };

  const formatOptimalWindow = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`;
  };

  if (loading) {
    return (
      <GlassCard
        className="p-8 text-center space-y-6"
        style={{
          background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 25%, transparent)`,
          minHeight: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="text-white/60">Chargement...</div>
      </GlassCard>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard
        className="p-8 text-center space-y-6 relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent) 0%, transparent 60%), radial-gradient(circle at 80% 80%, color-mix(in srgb, ${TRAINING_COLOR} 8%, transparent) 0%, transparent 50%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 25%, transparent)`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 40px color-mix(in srgb, ${TRAINING_COLOR} 18%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.15)`
        }}
      >
        <div className="training-hero-corners" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="corner-particle"
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                background: `linear-gradient(135deg, ${TRAINING_COLOR}, rgba(255, 255, 255, 0.8))`,
                boxShadow: `0 0 20px ${TRAINING_COLOR}`,
                top: i < 2 ? '12px' : 'auto',
                bottom: i >= 2 ? '12px' : 'auto',
                left: i % 2 === 0 ? '12px' : 'auto',
                right: i % 2 === 1 ? '12px' : 'auto'
              }}
              initial={{
                rotate: i % 2 === 0 ? 45 : -45
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
                rotate: i % 2 === 0 ? [45, 60, 45] : [-45, -60, -45]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: [0.4, 0, 0.2, 1]
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1
          }}
          className="flex justify-center mb-6 relative z-10"
        >
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              rotate: [0, 5, -5, 0],
              y: [0, -4, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              filter: 'drop-shadow(0 8px 32px rgba(24, 227, 255, 0.4))'
            }}
          >
            <GlowIcon
              icon="Dumbbell"
              color={TRAINING_COLOR}
              size="hero"
              glowIntensity={90}
              animate={true}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2
            className="text-3xl font-bold text-white mb-3"
            style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            {data.title}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-white/70 text-base mb-6">
            {data.subtitle}
          </p>
        </motion.div>

        {(data.showStreakBadge || data.showOptimalWindowBadge) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            {data.showStreakBadge && (
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-full flex items-center gap-2 cursor-default"
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS.Flame}
                    size={16}
                    style={{
                      color: '#22C55E',
                      filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
                    }}
                  />
                </motion.div>
                <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>
                  {data.streak} jours
                </span>
              </motion.div>
            )}

            {data.showOptimalWindowBadge && data.optimalWindow && (
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-full flex items-center gap-2 cursor-default"
                style={{
                  background: `color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${TRAINING_COLOR} 30%, transparent)`
                }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS.Clock}
                    size={16}
                    style={{
                      color: TRAINING_COLOR,
                      filter: `drop-shadow(0 0 8px color-mix(in srgb, ${TRAINING_COLOR} 60%, transparent))`
                    }}
                  />
                </motion.div>
                <span className="text-sm font-semibold" style={{ color: TRAINING_COLOR }}>
                  {formatOptimalWindow(data.optimalWindow.start)}-{formatOptimalWindow(data.optimalWindow.end)}
                </span>
              </motion.div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          <motion.button
            onClick={handleStartTraining}
            whileHover={{
              scale: 1.02,
              y: -4,
              transition: { type: 'spring', stiffness: 400, damping: 25 }
            }}
            whileTap={{
              scale: 0.98,
              y: 0,
              transition: { type: 'spring', stiffness: 500, damping: 30 }
            }}
            className="w-full px-8 py-5 rounded-2xl font-bold text-lg relative overflow-hidden group"
            style={{
              background: `linear-gradient(180deg, ${TRAINING_COLOR} 0%, color-mix(in srgb, ${TRAINING_COLOR} 85%, #000) 100%)`,
              border: `2px solid ${TRAINING_COLOR}`,
              color: '#FFFFFF',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              boxShadow: `0 1px 0 0 rgba(255, 255, 255, 0.4) inset, 0 -1px 0 0 rgba(0, 0, 0, 0.2) inset, 0 20px 50px -10px color-mix(in srgb, ${TRAINING_COLOR} 60%, transparent), 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 2px 8px 0 color-mix(in srgb, ${TRAINING_COLOR} 80%, transparent)`,
              transform: 'translateZ(0)',
              willChange: 'transform, box-shadow'
            }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(120deg, transparent 0%, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%, transparent 100%)'
              }}
              animate={{
                x: ['-200%', '200%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'easeInOut'
              }}
            />

            <div
              className="absolute top-0 left-8 right-8 h-[2px] rounded-full opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)'
              }}
            />

            <div className="flex items-center justify-center gap-3 relative z-10">
              <span className="tracking-wide">Lancer mon Training</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <SpatialIcon
                  Icon={ICONS.ArrowRight}
                  size={24}
                  style={{
                    color: '#FFFFFF',
                    filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6))'
                  }}
                />
              </motion.div>
            </div>

            <div
              className="absolute -bottom-2 left-8 right-8 h-2 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity"
              style={{
                background: `radial-gradient(ellipse, ${TRAINING_COLOR} 0%, transparent 70%)`
              }}
            />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-4 border-t border-white/10"
        >
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  data.recoveryStatus === 'ready'
                    ? '#22C55E'
                    : data.recoveryStatus === 'recovering'
                    ? '#F59E0B'
                    : '#EF4444',
                boxShadow: `0 0 12px ${
                  data.recoveryStatus === 'ready'
                    ? 'rgba(34, 197, 94, 0.6)'
                    : data.recoveryStatus === 'recovering'
                    ? 'rgba(245, 158, 11, 0.6)'
                    : 'rgba(239, 68, 68, 0.6)'
                }`
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <span className="text-sm text-white/60">
              {data.recoveryStatus === 'ready'
                ? 'Prêt pour une séance intense'
                : data.recoveryStatus === 'recovering'
                ? 'Récupération en cours'
                : 'Repos recommandé'}
            </span>
          </div>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
};

export default HeroTrainingCTA;
