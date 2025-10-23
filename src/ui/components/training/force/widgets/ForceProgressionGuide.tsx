/**
 * Force Progression Guide
 * Affiche un guide explicatif sur comment avancer dans une séance de force
 * Similaire à EnduranceProgressionGuide mais adapté aux séances de force
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import GlowIcon from '../../GlowIcon';
import { ICONS } from '../../../../icons/registry';

interface ForceProgressionGuideProps {
  isVisible: boolean;
  onDismiss: () => void;
  stepColor: string;
}

const ForceProgressionGuide: React.FC<ForceProgressionGuideProps> = ({
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
            {/* Item 1: Progression par sets */}
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
                    Progression par sets
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Chaque exercice est divisé en sets. Complétez toutes vos répétitions, puis cliquez sur <strong className="text-white">"Set Terminé"</strong> pour démarrer le temps de repos.
                  </p>
                </div>
              </div>
            </div>

            {/* Item 2: Temps de repos */}
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
                    Gérer votre repos
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
                    Un <strong className="text-white">compte à rebours</strong> démarre automatiquement entre chaque set. Vous pouvez le passer avec <strong className="text-white">"Passer le repos"</strong> si vous êtes prêt.
                  </p>
                  <div
                    className="text-[10px] text-white/60 px-2 py-1 rounded"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    💡 Le repos adapté vous permet de maintenir votre intensité
                  </div>
                </div>
              </div>
            </div>

            {/* Item 3: RPE et feedback */}
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
                    Donner votre ressenti (RPE)
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed mb-2">
                    Après chaque exercice, évaluez votre effort sur une échelle de <strong className="text-white">1 à 10</strong>. Ce feedback aide l'IA à adapter vos prochaines séances.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-green-500/20 border border-green-500/30">
                      <span className="text-green-300 font-bold">1-3</span>
                      <span className="text-white/60">Facile</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      <span className="text-orange-300 font-bold">7-8</span>
                      <span className="text-white/60">Optimal</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-red-500/20 border border-red-500/30">
                      <span className="text-red-300 font-bold">9-10</span>
                      <span className="text-white/60">Maximal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 4: Ajustements en direct */}
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
                  <span className="text-sm font-bold" style={{ color: stepColor }}>4</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">
                    Ajuster en temps réel
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Utilisez les boutons <strong className="text-white">+ / -</strong> pour ajuster la charge si nécessaire. L'IA mémorisera ces ajustements pour vos prochaines séances.
                  </p>
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
            J'ai compris, continuer la séance
          </motion.button>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default ForceProgressionGuide;
