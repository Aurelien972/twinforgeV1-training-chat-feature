/**
 * VolumeIntensityBalanceGauge Component
 * Triple gauge showing volume/intensity/recovery balance
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { VolumeIntensityBalance } from '../../../../domain/trainingToday';

const VolumeIntensityBalanceGauge: React.FC = () => {
  const [balance, setBalance] = useState<VolumeIntensityBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const data = await trainingTodayService.getVolumeIntensityBalance();
        setBalance(data);
      } catch (error) {
        console.error('Error loading balance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, []);

  if (loading || !balance) return null;

  const gauges = [
    { label: 'Volume', value: balance.volumeScore, color: '#8B5CF6' },
    { label: 'Intensité', value: balance.intensityScore, color: '#F59E0B' },
    { label: 'Récupération', value: balance.recoveryScore, color: '#22C55E' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.3,
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${balance.color} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${balance.color} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${balance.color} 12%, transparent)`
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0],
              y: [0, -2, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)'
            }}
          >
            <GlowIcon icon="Dumbbell" color={balance.color} size="large" glowIntensity={70} animate={true} />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-white">Volume Force</h3>
            <p className="text-white/60 text-sm">Équilibre Volume, Intensité, Récupération</p>
          </div>
        </div>

        <div className="space-y-4 mb-4">
          {gauges.map((gauge, index) => (
            <motion.div
              key={gauge.label}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: 0.4 + index * 0.1,
                type: 'spring',
                stiffness: 400,
                damping: 30
              }}
              whileHover={{
                scale: 1.02,
                x: 4,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 25
                }
              }}
              style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{gauge.label}</span>
                <span className="text-lg font-bold" style={{ color: gauge.color }}>
                  {gauge.value}%
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${gauge.value}%`, opacity: 1 }}
                  transition={{
                    width: {
                      duration: 1.2,
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.5 + index * 0.1
                    },
                    opacity: {
                      duration: 0.5,
                      delay: 0.4 + index * 0.1
                    }
                  }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, ${gauge.color}, color-mix(in srgb, ${gauge.color} 70%, white))`,
                    boxShadow: `0 0 12px ${gauge.color}60`,
                    willChange: 'width',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                >
                  {/* Animated shimmer */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)'
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 1 + index * 0.3
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 rounded-lg mt-4" style={{
          background: `color-mix(in srgb, ${balance.color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${balance.color} 25%, transparent)`
        }}>
          <div className="flex items-center gap-3 mb-2">
            <GlowIcon icon="Sparkles" color={balance.color} size="small" />
            <span className="text-sm font-semibold" style={{ color: balance.color }}>Recommandation</span>
          </div>
          <p className="text-sm text-white/80">{balance.recommendation}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default VolumeIntensityBalanceGauge;
