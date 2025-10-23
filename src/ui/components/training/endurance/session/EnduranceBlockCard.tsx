/**
 * Endurance Block Card
 * VisionOS26 styled card for endurance workout blocks
 */

import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';

// Add missing ExerciseIllustrationModal import if not already imported
import GlowIcon from '../../GlowIcon';
import type { EnduranceBlock } from '../../../../../domain/enduranceSession';
import { HEART_RATE_ZONES } from '../../../../../domain/enduranceSession';
import { ExerciseIllustration } from '../../illustrations';

const EnduranceMapCard = lazy(() => import('../widgets/EnduranceMapCard'));

interface EnduranceBlockCardProps {
  block: EnduranceBlock;
  blockTime: number;
  isActive: boolean;
  stepColor: string;
  onComplete: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstBlock?: boolean;
  isLastBlock?: boolean;
}

const EnduranceBlockCard: React.FC<EnduranceBlockCardProps> = ({
  block,
  blockTime,
  isActive,
  stepColor,
  onComplete,
  onNext,
  onPrevious,
  isFirstBlock = false,
  isLastBlock = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min((blockTime / (block.duration * 60)) * 100, 100);

  const zoneKey = block.targetZone.toUpperCase() as keyof typeof HEART_RATE_ZONES;
  const zoneConfig = HEART_RATE_ZONES[zoneKey] || HEART_RATE_ZONES.Z2;

  return (
    <div className="relative overflow-hidden rounded-[20px]" style={{ marginBottom: '12px' }}>
      {/* Shimmer Effect for Active Block - Now on the outer container */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                90deg,
                transparent 0%,
                color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.3)) 45%,
                color-mix(in srgb, ${stepColor} 30%, rgba(255, 255, 255, 0.4)) 50%,
                color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.3)) 55%,
                transparent 100%
              )`,
              width: '40%',
              height: '100%',
              animation: 'active-exercise-shimmer 3s ease-in-out infinite',
              willChange: 'transform',
            }}
          />
        </div>
      )}

      <GlassCard
        className="p-4 relative"
        style={{
          background: isActive
            ? `
                radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${stepColor} 25%, transparent) 0%, transparent 60%),
                radial-gradient(circle at 80% 80%, color-mix(in srgb, ${zoneConfig.color} 15%, transparent) 0%, transparent 50%),
                rgba(255, 255, 255, 0.08)
              `
            : 'rgba(255, 255, 255, 0.05)',
          border: isActive
            ? `2px solid color-mix(in srgb, ${stepColor} 40%, rgba(255, 255, 255, 0.2))`
            : '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: isActive
            ? `
                0 12px 48px rgba(0, 0, 0, 0.4),
                0 0 50px color-mix(in srgb, ${stepColor} 30%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
              `
            : '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div className="relative z-10 space-y-4">
        {/* Exercise Illustration - Full Width at Top */}
        <div
          className="-m-4 mb-4 overflow-hidden"
          style={{
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
          }}
        >
          <div className="relative w-full" style={{ aspectRatio: '3/2' }}>
            <ExerciseIllustration
              exerciseName={block.name}
              discipline="endurance"
              size="standard"
              fallbackIcon="Activity"
              className="w-full h-full"
              style={{
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* Gradient overlay for better text readability */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Exercise Title and Description */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-2">
                {block.name}
              </h3>
              {block.description && (
                <p className="text-white/70 text-sm leading-relaxed">
                  {block.description}
                </p>
              )}
            </div>
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="flex-shrink-0"
              >
                <GlowIcon icon="Radio" color={stepColor} size="medium" glowIntensity={45} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Time & Zone Info */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="p-3 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 18%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.08)
              `,
              border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.15))`,
            }}
          >
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(blockTime)}
            </div>
            <div className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              {isActive ? 'En cours' : 'Durée'} • {block.duration}min
            </div>
          </div>

          <div
            className="p-3 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, color-mix(in srgb, ${zoneConfig.color} 18%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.08)
              `,
              border: `1.5px solid color-mix(in srgb, ${zoneConfig.color} 30%, transparent)`,
              boxShadow: `0 0 20px color-mix(in srgb, ${zoneConfig.color} 20%, transparent)`,
            }}
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{
                color: zoneConfig.color,
                textShadow: `0 0 12px color-mix(in srgb, ${zoneConfig.color} 40%, transparent)`,
              }}
            >
              {block.targetZone}
            </div>
            <div className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              {zoneConfig.label}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isActive && (
          <div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <motion.div
                className="h-full"
                style={{
                  background: `linear-gradient(90deg, ${stepColor}, ${zoneConfig.color})`,
                  boxShadow: `0 0 16px color-mix(in srgb, ${zoneConfig.color} 40%, transparent)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-white/40 text-xs">Progression</span>
              <span className="text-white/70 text-xs font-bold">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
        )}

        {/* Zone Description Toggle */}
        <motion.button
          onClick={() => setShowDetails(!showDetails)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full rounded-xl flex items-center justify-between"
          style={{
            padding: '10px 12px',
            background: showDetails
              ? `color-mix(in srgb, ${zoneConfig.color} 12%, rgba(255, 255, 255, 0.06))`
              : 'rgba(255, 255, 255, 0.05)',
            border: showDetails
              ? `1.5px solid color-mix(in srgb, ${zoneConfig.color} 25%, transparent)`
              : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <GlowIcon icon="Info" color={zoneConfig.color} size="tiny" glowIntensity={35} />
            <span className="text-xs font-semibold text-white/80">
              Comprendre la zone {block.targetZone}
            </span>
          </div>
          <motion.div
            animate={{ rotate: showDetails ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <SpatialIcon
              Icon={ICONS.ChevronDown}
              size={16}
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            />
          </motion.div>
        </motion.button>

        {/* Zone Details (Collapsible) */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: `
                    radial-gradient(circle at 30% 20%, color-mix(in srgb, ${zoneConfig.color} 10%, transparent) 0%, transparent 70%),
                    rgba(255, 255, 255, 0.05)
                  `,
                  border: `1px solid color-mix(in srgb, ${zoneConfig.color} 20%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <GlowIcon icon="Heart" color={zoneConfig.color} size="small" glowIntensity={35} />
                  <span className="font-bold text-xs uppercase tracking-wider" style={{ color: zoneConfig.color }}>
                    Zone Cardiaque
                  </span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  <strong style={{ color: zoneConfig.color }}>{zoneConfig.description}</strong>
                </p>
                <div className="text-xs text-white/60">
                  <strong>Intensité:</strong> {zoneConfig.minPercent}% - {zoneConfig.maxPercent}% FC Max
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Toggle Button */}
        <motion.button
          onClick={() => setShowMap(!showMap)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full rounded-xl flex items-center justify-between"
          style={{
            padding: '10px 12px',
            background: showMap
              ? `color-mix(in srgb, ${stepColor} 12%, rgba(255, 255, 255, 0.06))`
              : 'rgba(255, 255, 255, 0.05)',
            border: showMap
              ? `1.5px solid color-mix(in srgb, ${stepColor} 25%, transparent)`
              : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <GlowIcon icon="MapPin" color={stepColor} size="tiny" glowIntensity={35} />
            <span className="text-xs font-semibold text-white/80">
              {showMap ? 'Masquer la carte' : 'Voir la carte du parcours'}
            </span>
          </div>
          <motion.div
            animate={{ rotate: showMap ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <SpatialIcon
              Icon={ICONS.ChevronDown}
              size={16}
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            />
          </motion.div>
        </motion.button>

        {/* Map Display (Collapsible) */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <Suspense
                fallback={
                  <div
                    className="rounded-xl p-4 flex items-center justify-center"
                    style={{
                      height: '200px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="text-white/60 text-sm">Chargement de la carte...</div>
                  </div>
                }
              >
                <EnduranceMapCard
                  locationName={block.name}
                  blockType={block.type}
                  height="220px"
                  showUserLocation={true}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cues */}
        {block.cues && block.cues.length > 0 && (
          <div
            className="rounded-xl p-3"
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <GlowIcon icon="Lightbulb" color="#3B82F6" size="small" glowIntensity={30} />
              <span className="font-bold text-blue-400 uppercase tracking-wider" style={{ fontSize: '10px' }}>
                Conseils Techniques
              </span>
            </div>
            <ul className="space-y-1">
              {block.cues.map((cue, idx) => (
                <li key={idx} className="text-white/70 flex items-start text-xs" style={{ gap: '6px' }}>
                  <span className="text-blue-400" style={{ marginTop: '2px' }}>•</span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation and Action Buttons */}
        {isActive && (
          <div className="space-y-3">
            {/* Complete Button - Shows at 50% progress */}
            {progressPercent >= 50 && (
              <motion.button
                onClick={onComplete}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 rounded-xl font-bold text-base"
                style={{
                  paddingTop: '14px',
                  paddingBottom: '14px',
                  minHeight: '52px',
                  background: `
                    radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 30%, transparent) 0%, transparent 70%),
                    color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.12))
                  `,
                  border: `2.5px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                  color: 'white',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.25),
                    0 0 40px color-mix(in srgb, ${stepColor} 30%, transparent)
                  `,
                  textShadow: `0 0 20px color-mix(in srgb, ${stepColor} 40%, transparent)`,
                }}
              >
                Bloc terminé
              </motion.button>
            )}

            {/* Navigation Buttons */}
            {(onNext || onPrevious) && (
              <div className="grid grid-cols-2 gap-3">
                {/* Previous Block Button */}
                <motion.button
                  onClick={onPrevious}
                  disabled={isFirstBlock || !onPrevious}
                  whileHover={!isFirstBlock && onPrevious ? { scale: 1.02 } : {}}
                  whileTap={!isFirstBlock && onPrevious ? { scale: 0.98 } : {}}
                  className="py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{
                    background: !isFirstBlock && onPrevious
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: !isFirstBlock && onPrevious
                      ? '2px solid rgba(255, 255, 255, 0.2)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    opacity: !isFirstBlock && onPrevious ? 1 : 0.3,
                    cursor: !isFirstBlock && onPrevious ? 'pointer' : 'not-allowed',
                  }}
                >
                  <SpatialIcon Icon={ICONS.ChevronLeft} size={20} style={{ color: 'white' }} />
                  <span className="text-sm">Précédent</span>
                </motion.button>

                {/* Next Block Button */}
                <motion.button
                  onClick={onNext}
                  disabled={isLastBlock || !onNext}
                  whileHover={!isLastBlock && onNext ? { scale: 1.02 } : {}}
                  whileTap={!isLastBlock && onNext ? { scale: 0.98 } : {}}
                  className="py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  style={{
                    background: !isLastBlock && onNext
                      ? `
                        radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 25%, transparent) 0%, transparent 70%),
                        color-mix(in srgb, ${stepColor} 15%, rgba(255, 255, 255, 0.1))
                      `
                      : 'rgba(255, 255, 255, 0.03)',
                    border: !isLastBlock && onNext
                      ? `2px solid color-mix(in srgb, ${stepColor} 35%, transparent)`
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'white',
                    opacity: !isLastBlock && onNext ? 1 : 0.3,
                    cursor: !isLastBlock && onNext ? 'pointer' : 'not-allowed',
                    boxShadow: !isLastBlock && onNext
                      ? `0 4px 16px color-mix(in srgb, ${stepColor} 20%, transparent)`
                      : 'none',
                  }}
                >
                  <span className="text-sm">Suivant</span>
                  <SpatialIcon Icon={ICONS.ChevronRight} size={20} style={{ color: 'white' }} />
                </motion.button>
              </div>
            )}
          </div>
        )}
        </div>
      </GlassCard>

    </div>
  );
};

export default EnduranceBlockCard;
