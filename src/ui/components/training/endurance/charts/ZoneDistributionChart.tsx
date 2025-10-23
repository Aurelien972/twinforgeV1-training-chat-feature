/**
 * ZoneDistributionChart Component
 * Displays heart rate zone distribution with 80/20 analysis
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';

interface ZoneDistributionChartProps {
  discipline?: string;
}

const ZoneDistributionChart: React.FC<ZoneDistributionChartProps> = ({ discipline = 'running' }) => {
  const zones = [
    { name: 'Z1', label: 'Récupération', percentage: 25, color: '#22C55E', isEasy: true },
    { name: 'Z2', label: 'Endurance', percentage: 55, color: '#3B82F6', isEasy: true },
    { name: 'Z3', label: 'Tempo', percentage: 12, color: '#F59E0B', isEasy: false },
    { name: 'Z4', label: 'Seuil', percentage: 6, color: '#EF4444', isEasy: false },
    { name: 'Z5', label: 'VO2 Max', percentage: 2, color: '#DC2626', isEasy: false }
  ];

  const easyPercentage = zones.filter(z => z.isEasy).reduce((sum, z) => sum + z.percentage, 0);
  const hardPercentage = zones.filter(z => !z.isEasy).reduce((sum, z) => sum + z.percentage, 0);

  const isOptimal = easyPercentage >= 75 && easyPercentage <= 85;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Distribution des Zones</h3>
        {isOptimal ? (
          <span className="px-3 py-1 rounded-full text-sm font-medium" style={{
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#22C55E'
          }}>
            80/20 Optimal
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-sm font-medium" style={{
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#F59E0B'
          }}>
            Déséquilibre
          </span>
        )}
      </div>

      <div className="flex items-center gap-8 mb-8">
        <div className="flex-1">
          <div className="relative h-48 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full max-w-[200px]">
              <defs>
                {zones.map((zone, idx) => (
                  <linearGradient key={zone.name} id={`gradient-${zone.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={zone.color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={zone.color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>

              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="40"
              />

              {zones.reduce((acc, zone, idx) => {
                const previousPercentage = zones.slice(0, idx).reduce((sum, z) => sum + z.percentage, 0);
                const circumference = 2 * Math.PI * 70;
                const offset = (previousPercentage / 100) * circumference;
                const length = (zone.percentage / 100) * circumference;

                acc.push(
                  <motion.circle
                    key={zone.name}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke={`url(#gradient-${zone.name})`}
                    strokeWidth="40"
                    strokeDasharray={`${length} ${circumference}`}
                    strokeDashoffset={-offset}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: -offset }}
                    transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                    transform="rotate(-90 100 100)"
                  />
                );

                return acc;
              }, [] as React.ReactNode[])}

              <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold fill-white">
                {easyPercentage}%
              </text>
              <text x="100" y="115" textAnchor="middle" className="text-sm fill-white/60">
                Facile
              </text>
            </svg>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {zones.map((zone, idx) => (
            <motion.div
              key={zone.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="text-sm font-medium text-white/90">{zone.name}</span>
                <span className="text-xs text-white/50">{zone.label}</span>
              </div>
              <span className="text-sm font-semibold text-white">{zone.percentage}%</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg" style={{
        background: 'rgba(24, 227, 255, 0.05)',
        border: '1px solid rgba(24, 227, 255, 0.15)'
      }}>
        <div className="flex items-start gap-3">
          <div className="text-xl">💡</div>
          <div className="flex-1">
            <p className="text-sm text-white/80 mb-2">
              <strong>Principe 80/20:</strong> Pour progresser en endurance, ~80% du volume devrait être en Z1-Z2 (facile) et ~20% en Z3-Z5 (difficile).
            </p>
            {!isOptimal && hardPercentage > 25 && (
              <p className="text-sm text-amber-400">
                Attention: Trop de zone grise (Z3) peut limiter la progression et augmenter la fatigue.
              </p>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default ZoneDistributionChart;
