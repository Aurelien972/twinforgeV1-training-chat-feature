/**
 * LocationCardSkeleton Component
 * Skeleton loader pour les cartes de lieux d'entraînement
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';

const LocationCardSkeleton: React.FC = () => {
  return (
    <GlassCard
      className="relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
          var(--glass-opacity)
        `,
        borderColor: 'rgba(6, 182, 212, 0.2)'
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.2), transparent 70%), rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(6, 182, 212, 0.3)',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)'
              }}
              animate={{
                opacity: [0.6, 1, 0.6],
                boxShadow: [
                  '0 4px 12px rgba(6, 182, 212, 0.15)',
                  '0 4px 16px rgba(6, 182, 212, 0.25)',
                  '0 4px 12px rgba(6, 182, 212, 0.15)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="flex-1 space-y-2">
              <motion.div
                className="h-5 rounded w-2/3"
                style={{
                  background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))',
                  backgroundSize: '200% 100%'
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="h-4 rounded w-1/2"
                style={{
                  background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.08), rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.08))',
                  backgroundSize: '200% 100%'
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 0.2 }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <motion.div
              className="w-9 h-9 rounded-lg"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.2), transparent 70%), rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(59, 130, 246, 0.3)'
              }}
              animate={{
                opacity: [0.6, 1, 0.6],
                boxShadow: [
                  '0 2px 8px rgba(59, 130, 246, 0.15)',
                  '0 4px 12px rgba(59, 130, 246, 0.25)',
                  '0 2px 8px rgba(59, 130, 246, 0.15)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            <motion.div
              className="w-9 h-9 rounded-lg"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.2), transparent 70%), rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.3)'
              }}
              animate={{
                opacity: [0.6, 1, 0.6],
                boxShadow: [
                  '0 2px 8px rgba(239, 68, 68, 0.15)',
                  '0 4px 12px rgba(239, 68, 68, 0.25)',
                  '0 2px 8px rgba(239, 68, 68, 0.15)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <motion.div
            className="h-4 rounded w-1/3"
            style={{
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))',
              backgroundSize: '200% 100%'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 0.5 }}
          />

          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-20 h-20 rounded-lg"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15), transparent 70%), rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(6, 182, 212, 0.2)'
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.02, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 + i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default LocationCardSkeleton;
