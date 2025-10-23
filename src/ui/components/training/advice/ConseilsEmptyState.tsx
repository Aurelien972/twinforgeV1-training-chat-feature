/**
 * ConseilsEmptyState Component
 * Premium empty state for Conseils tab showing preview and progression
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../system/supabase/client';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';

const ADVICE_COLOR = '#18E3FF';
const CARD_COLORS = {
  volume: '#8B5CF6',
  intensity: '#EF4444',
  recovery: '#22C55E',
  strategy: '#F59E0B'
};

const ConseilsEmptyState: React.FC = () => {
  const navigate = useNavigate();

  const { data: completedSessionsCount = 0 } = useQuery({
    queryKey: ['completed-sessions-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { count, error } = await supabase
        .from('training_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', ninetyDaysAgo.toISOString());

      if (error) {
        console.error('Error fetching sessions count:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 30 * 1000,
  });

  const handleStartTraining = () => {
    Haptics.press();
    navigate('/training/pipeline');
  };

  const MIN_SESSIONS_FOR_INSIGHTS = 3;
  const progressPercentage = Math.min((completedSessionsCount / MIN_SESSIONS_FOR_INSIGHTS) * 100, 100);
  const remainingSessions = Math.max(MIN_SESSIONS_FOR_INSIGHTS - completedSessionsCount, 0);

  const adviceTypes = [
    {
      icon: ICONS.BarChart,
      title: 'Conseils Volume',
      description: 'Optimisez votre charge de travail',
      color: CARD_COLORS.volume
    },
    {
      icon: ICONS.Zap,
      title: 'Conseils Intensité',
      description: 'Gérez votre RPE et effort',
      color: CARD_COLORS.intensity
    },
    {
      icon: ICONS.Heart,
      title: 'Optimisation Récupération',
      description: 'Prévenez le surentraînement',
      color: CARD_COLORS.recovery
    },
    {
      icon: ICONS.Target,
      title: 'Stratégie Avancée',
      description: 'Planification et périodisation',
      color: CARD_COLORS.strategy
    }
  ];

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
            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${ADVICE_COLOR} 15%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 20% 80%, color-mix(in srgb, #A855F7 10%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${ADVICE_COLOR} 30%, transparent)`,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 40px color-mix(in srgb, ${ADVICE_COLOR} 20%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `
        }}
      >
        {/* Animated Brain Icon */}
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
              scale: [1, 1.15, 1],
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
              icon="Brain"
              color={ADVICE_COLOR}
              size="hero"
              glowIntensity={80}
              animate={true}
            />
          </motion.div>
        </motion.div>

        {/* Spacer under icon */}
        <div className="h-4" />

        {/* Title & Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2
            className="text-4xl font-bold text-white mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Débloquez vos Conseils IA
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-6">
            Complétez quelques séances pour recevoir des insights personnalisés
            basés sur votre progression réelle
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/70 text-sm font-medium">Progression</span>
            <span className="text-white/70 text-sm font-medium">
              {completedSessionsCount} / {MIN_SESSIONS_FOR_INSIGHTS} séances
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${ADVICE_COLOR}, color-mix(in srgb, ${ADVICE_COLOR} 70%, #A855F7))`,
                boxShadow: `0 0 15px ${ADVICE_COLOR}80`
              }}
            />
          </div>
          <p className="text-white/50 text-xs mt-2 text-center">
            {remainingSessions > 0
              ? `Encore ${remainingSessions} séance${remainingSessions > 1 ? 's' : ''} avant vos premiers conseils personnalisés`
              : 'Génération des conseils en cours...'
            }
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <motion.button
            onClick={handleStartTraining}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="px-12 py-5 rounded-xl font-bold text-lg shadow-2xl"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, ${ADVICE_COLOR}90 0%, transparent 70%),
                linear-gradient(135deg, ${ADVICE_COLOR}60, ${ADVICE_COLOR}40)
              `,
              border: `2px solid ${ADVICE_COLOR}`,
              color: '#FFFFFF',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              boxShadow: `
                0 12px 40px rgba(0, 0, 0, 0.4),
                0 0 50px ${ADVICE_COLOR}50,
                inset 0 1px 0 rgba(255, 255, 255, 0.25)
              `
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <span>Débloquer mes conseils</span>
              <SpatialIcon
                Icon={ICONS.Sparkles}
                size={24}
                style={{
                  color: '#FFFFFF',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                }}
              />
            </div>
          </motion.button>
        </motion.div>
      </GlassCard>

      {/* Preview Cards Grid */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-4"
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <GlowIcon icon="Eye" color={ADVICE_COLOR} size="small" glowIntensity={40} />
            Ce que vous débloquerez
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Aperçu des types de conseils que vous recevrez
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adviceTypes.map((advice, index) => (
            <motion.div
              key={advice.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <GlassCard
                className="p-5 relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(circle at 30% 20%, color-mix(in srgb, ${advice.color} 12%, transparent) 0%, transparent 60%),
                    rgba(255, 255, 255, 0.05)
                  `,
                  border: `1px solid color-mix(in srgb, ${advice.color} 25%, transparent)`,
                  opacity: 0.6
                }}
              >
                {/* Locked Badge */}
                <div
                  className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <div className="flex items-center gap-1">
                    <SpatialIcon Icon={ICONS.Lock} size={12} />
                    <span>Verrouillé</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `color-mix(in srgb, ${advice.color} 20%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${advice.color} 35%, transparent)`
                    }}
                  >
                    <SpatialIcon
                      Icon={advice.icon}
                      size={28}
                      style={{ color: advice.color }}
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="text-white font-bold mb-2">{advice.title}</h4>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {advice.description}
                    </p>

                    {/* Preview Skeleton */}
                    <div className="mt-3 space-y-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          width: '100%'
                        }}
                      />
                      <div
                        className="h-2 rounded-full"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          width: '80%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <GlowIcon icon="CheckCircle" color="#22C55E" size="small" glowIntensity={40} />
            Pourquoi suivre vos séances ?
          </h3>
          <div className="space-y-3">
            {[
              'Conseils basés sur vos données réelles, pas des généralités',
              'Détection automatique des déséquilibres et points faibles',
              'Recommandations adaptées à votre rythme et progression',
              'Prévention du surentraînement et optimisation de la récupération'
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <SpatialIcon
                  Icon={ICONS.Check}
                  size={18}
                  style={{ color: '#22C55E', marginTop: '2px' }}
                />
                <p className="text-white/70 text-sm leading-relaxed">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default ConseilsEmptyState;
