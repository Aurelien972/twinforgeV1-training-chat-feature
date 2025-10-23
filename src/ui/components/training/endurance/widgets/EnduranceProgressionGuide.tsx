/**
 * Endurance Progression Guide
 * Affiche un guide explicatif sur comment avancer dans une séance d'endurance
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import GlowIcon from '../../GlowIcon';
import { ICONS } from '../../../../icons/registry';

interface EnduranceProgressionGuideProps {
  isVisible: boolean;
  onDismiss: () => void;
  stepColor: string;
}

const EnduranceProgressionGuide: React.FC<EnduranceProgressionGuideProps> = ({
  isVisible,
  onDismiss,
  stepColor
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="px-4 mb-4"
      >
        <GlassCard
          className="p-5 space-y-4"
          style={{
            background: `
              radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${stepColor} 18%, transparent) 0%, transparent 60%),
              rgba(255, 255, 255, 0.08)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 30%, rgba(255, 255, 255, 0.2))`,
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.25),
              0 0 40px color-mix(in srgb, ${stepColor} 20%, transparent),
              inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <GlowIcon
                icon="Info"
                color={stepColor}
                size="medium"
                glowIntensity={40}
              />
              <h3 className="text-lg font-bold text-white">
                Comment avancer dans la séance
              </h3>
            </div>
            <motion.button
              onClick={onDismiss}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <SpatialIcon
                Icon={ICONS.X}
                size={16}
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              />
            </motion.button>
          </div>

          {/* Guide Items */}
          <div className="space-y-3">
            {/* Item 1: Progression automatique */}
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.1))`,
                    border: `1px solid color-mix(in srgb, ${stepColor} 30%, transparent)`
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: stepColor }}>1</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">
                    Progression du temps
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Chaque bloc a une durée définie. Le temps s'écoule automatiquement et une barre de progression vous indique votre avancement.
                  </p>
                </div>
              </div>
            </div>

            {/* Item 2: Bouton Bloc terminé */}
            <div
              className="p-3 rounded-xl"
              style={{
                background: `color-mix(in srgb, ${stepColor} 8%, rgba(255, 255, 255, 0.05))`,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.1))`
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.12))`,
                    border: `1.5px solid color-mix(in srgb, ${stepColor} 35%, transparent)`,
                    boxShadow: `0 0 16px color-mix(in srgb, ${stepColor} 25%, transparent)`
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: stepColor }}>2</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    Bouton "Bloc terminé"
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        background: `color-mix(in srgb, ${stepColor} 20%, transparent)`,
                        color: stepColor
                      }}
                    >
                      Important
                    </span>
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed mb-2">
                    À partir de <strong className="text-white">50% du temps</strong> du bloc, un bouton "Bloc terminé" apparaît. Cliquez dessus quand vous avez fini votre bloc pour passer au suivant.
                  </p>
                  <div
                    className="text-[10px] text-white/60 px-2 py-1 rounded"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    💡 Vous pouvez terminer avant 100% si vous avez fini votre effort
                  </div>
                </div>
              </div>
            </div>

            {/* Item 3: Navigation manuelle */}
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.1))`,
                    border: `1px solid color-mix(in srgb, ${stepColor} 30%, transparent)`
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: stepColor }}>3</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">
                    Navigation entre les blocs
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed mb-2">
                    Utilisez les boutons <strong className="text-white">Précédent</strong> et <strong className="text-white">Suivant</strong> pour naviguer librement entre les blocs si nécessaire.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-white/10 border border-white/20">
                      <SpatialIcon Icon={ICONS.ChevronLeft} size={12} style={{ color: 'white' }} />
                      <span className="text-white/70">Précédent</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-white/20" style={{
                      background: `color-mix(in srgb, ${stepColor} 15%, rgba(255, 255, 255, 0.1))`
                    }}>
                      <span className="text-white/70">Suivant</span>
                      <SpatialIcon Icon={ICONS.ChevronRight} size={12} style={{ color: 'white' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <motion.button
            onClick={onDismiss}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 30%, transparent) 0%, transparent 70%),
                color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.12))
              `,
              border: `2px solid color-mix(in srgb, ${stepColor} 35%, transparent)`,
              boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 20%, transparent)`
            }}
          >
            J'ai compris, commencer la séance
          </motion.button>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnduranceProgressionGuide;
