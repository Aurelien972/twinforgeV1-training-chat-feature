/**
 * Competition Adjustment Buttons
 * Permet d'ajuster la difficulté des sessions de compétition avant de commencer
 * Ajuste les temps cibles et RPE de toutes les stations proportionnellement
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';

interface CompetitionAdjustmentButtonsProps {
  stepColor: string;
  onAdjustEasier: () => void;
  onAdjustHarder: () => void;
  disabled?: boolean;
}

const CompetitionAdjustmentButtons: React.FC<CompetitionAdjustmentButtonsProps> = ({
  stepColor,
  onAdjustEasier,
  onAdjustHarder,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <GlowIcon icon="Sliders" color={stepColor} size="tiny" glowIntensity={35} />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Ajuster la difficulté
        </h3>
      </div>

      {/* Description */}
      <p className="text-xs text-white/60 leading-relaxed">
        Modifie les temps cibles et les RPE de toutes les stations pour adapter la séance à ton niveau d'énergie actuel.
      </p>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Easier Button */}
        <motion.button
          onClick={onAdjustEasier}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          className="py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
          style={{
            background: disabled
              ? 'rgba(255, 255, 255, 0.03)'
              : `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, #22C55E 15%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.08)
              `,
            border: disabled
              ? '1.5px solid rgba(255, 255, 255, 0.08)'
              : '1.5px solid color-mix(in srgb, #22C55E 30%, transparent)',
            boxShadow: disabled
              ? 'none'
              : '0 4px 16px color-mix(in srgb, #22C55E 15%, transparent)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
        >
          <SpatialIcon
            Icon={ICONS.TrendingDown}
            size={24}
            variant="pure"
            style={{
              color: '#22C55E',
              filter: disabled ? 'none' : 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.4))'
            }}
          />
          <div>
            <div className="text-sm font-bold text-white mb-0.5">Plus facile</div>
            <div className="text-[10px] text-white/60">+10% temps, -1 RPE</div>
          </div>
        </motion.button>

        {/* Harder Button */}
        <motion.button
          onClick={onAdjustHarder}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          className="py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
          style={{
            background: disabled
              ? 'rgba(255, 255, 255, 0.03)'
              : `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, #EF4444 15%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.08)
              `,
            border: disabled
              ? '1.5px solid rgba(255, 255, 255, 0.08)'
              : '1.5px solid color-mix(in srgb, #EF4444 30%, transparent)',
            boxShadow: disabled
              ? 'none'
              : '0 4px 16px color-mix(in srgb, #EF4444 15%, transparent)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
        >
          <SpatialIcon
            Icon={ICONS.TrendingUp}
            size={24}
            variant="pure"
            style={{
              color: '#EF4444',
              filter: disabled ? 'none' : 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))'
            }}
          />
          <div>
            <div className="text-sm font-bold text-white mb-0.5">Plus difficile</div>
            <div className="text-[10px] text-white/60">-10% temps, +1 RPE</div>
          </div>
        </motion.button>
      </div>

      {/* Warning */}
      <div
        className="px-3 py-2 rounded-lg text-xs text-white/50 flex items-start gap-2"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <SpatialIcon
          Icon={ICONS.Info}
          size={14}
          variant="pure"
          style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '1px' }}
        />
        <span>Les ajustements affectent toutes les stations de manière proportionnelle.</span>
      </div>
    </div>
  );
};

export default CompetitionAdjustmentButtons;
