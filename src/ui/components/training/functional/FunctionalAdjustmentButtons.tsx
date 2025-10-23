/**
 * Functional Adjustment Buttons
 * Quick adjustment interface for functional/CrossFit WODs in Step 2
 * Allows adjusting time cap, rounds, scaling, and exercises
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowIcon from '../GlowIcon';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';
import { useGlobalChatStore } from '../../../../system/store/globalChatStore';
import { functionalAdjustmentService } from '../../../../system/services/functionalAdjustmentService';
import logger from '../../../../lib/utils/logger';

interface FunctionalAdjustmentButtonsProps {
  stepColor: string;
  prescription: any;
  onPrescriptionUpdate: (updatedPrescription: any) => void;
}

const FunctionalAdjustmentButtons: React.FC<FunctionalAdjustmentButtonsProps> = ({
  stepColor,
  prescription,
  onPrescriptionUpdate,
}) => {
  const { open: openChat } = useGlobalChatStore();
  const [showAdjustmentPanel, setShowAdjustmentPanel] = useState(false);
  const [adjustmentMessage, setAdjustmentMessage] = useState<string | null>(null);

  const wodFormat = prescription.wodFormat || 'forTime';
  const isAMRAP = wodFormat === 'amrap';
  const currentTimeCap = prescription.timeCapMinutes || 20;

  const handleNeedHelp = () => {
    Haptics.press();
    logger.info('FUNCTIONAL_ADJUSTMENT', 'Opening chat for help', {
      wodFormat,
      wodName: prescription.wodName
    });
    openChat();
  };

  const handleTimeCapAdjustment = (delta: number) => {
    Haptics.tap();
    const result = functionalAdjustmentService.adjustTimeCap(prescription, delta);

    if (result.success) {
      onPrescriptionUpdate(result.updatedPrescription);
      showTemporaryMessage(result.message);
      logger.info('FUNCTIONAL_ADJUSTMENT', 'Time cap adjusted', {
        delta,
        newTimeCap: result.updatedPrescription.timeCapMinutes
      });
    }
  };

  const handleRoundsAdjustment = (delta: number) => {
    Haptics.tap();
    const result = functionalAdjustmentService.adjustTargetRounds(prescription, delta);

    if (result.success) {
      onPrescriptionUpdate(result.updatedPrescription);
      showTemporaryMessage(result.message);
      logger.info('FUNCTIONAL_ADJUSTMENT', 'Target rounds adjusted', {
        delta,
        newTarget: result.updatedPrescription.targetRounds
      });
    }
  };

  const handleToggleAdjustmentPanel = () => {
    Haptics.tap();
    setShowAdjustmentPanel(!showAdjustmentPanel);
  };

  const showTemporaryMessage = (message: string) => {
    setAdjustmentMessage(message);
    setTimeout(() => setAdjustmentMessage(null), 3000);
  };

  return (
    <div className="space-y-3">
      {/* Adjustment Message Toast */}
      <AnimatePresence>
        {adjustmentMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="rounded-xl px-4 py-3 text-center"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
                rgba(34, 197, 94, 0.15)
              `,
              border: `1.5px solid color-mix(in srgb, #22C55E 40%, transparent)`,
              boxShadow: `0 4px 16px rgba(34, 197, 94, 0.2)`,
            }}
          >
            <p className="text-sm font-semibold text-white">{adjustmentMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Adjustments - Vertical Layout */}
      <div className="space-y-3">
        {/* Time Cap Adjustment */}
        <div>
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2 px-1">
            Time Cap
          </label>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => handleTimeCapAdjustment(-2)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.12))`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
              }}
            >
              <SpatialIcon Icon={ICONS.Minus} size={16} style={{ color: stepColor }} />
            </motion.button>

            <div
              className="flex-1 text-center py-2 rounded-xl font-bold text-white"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {currentTimeCap}min
            </div>

            <motion.button
              onClick={() => handleTimeCapAdjustment(2)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.12))`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
              }}
            >
              <SpatialIcon Icon={ICONS.Plus} size={16} style={{ color: stepColor }} />
            </motion.button>
          </div>
        </div>

        {/* Rounds Adjustment (AMRAP only) */}
        {isAMRAP && (
          <div className="mt-3">
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2 px-1">
              Objectif
            </label>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => handleRoundsAdjustment(-2)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
                    rgba(255, 255, 255, 0.08)
                  `,
                  border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.12))`,
                  boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
                }}
              >
                <SpatialIcon Icon={ICONS.Minus} size={16} style={{ color: stepColor }} />
              </motion.button>

              <div
                className="flex-1 text-center py-2 rounded-xl text-xs font-bold text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {prescription.targetRounds || '10-15'}
              </div>

              <motion.button
                onClick={() => handleRoundsAdjustment(2)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
                    rgba(255, 255, 255, 0.08)
                  `,
                  border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.12))`,
                  boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
                }}
              >
                <SpatialIcon Icon={ICONS.Plus} size={16} style={{ color: stepColor }} />
              </motion.button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FunctionalAdjustmentButtons;
