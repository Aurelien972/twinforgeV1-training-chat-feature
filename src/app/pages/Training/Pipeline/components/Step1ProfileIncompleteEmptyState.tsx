/**
 * Step1ProfileIncompleteEmptyState Component
 * Premium empty state for Step 1 when profile is incomplete
 * Guides user to complete required profile fields with smart navigation
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../../../ui/cards/GlassCard';
import GlowIcon from '../../../../../ui/components/training/GlowIcon';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../../ui/icons/registry';
import { Haptics } from '../../../../../utils/haptics';
import { getProfileTabUrl, getProfileTabDisplayName } from '../../../../../hooks/useProfileValidation';
import type { ProfileValidationState } from '../../../../../hooks/useProfileValidation';

const STEP1_COLOR = '#18E3FF';

interface Step1ProfileIncompleteEmptyStateProps {
  validationState: ProfileValidationState;
}

const Step1ProfileIncompleteEmptyState: React.FC<Step1ProfileIncompleteEmptyStateProps> = ({
  validationState
}) => {
  const navigate = useNavigate();
  const { missingFieldsByTab, primaryMissingTab } = validationState;

  const handleNavigateToTab = (tab: 'identity' | 'training' | 'health') => {
    Haptics.press();
    const url = getProfileTabUrl(tab);
    navigate(url);
  };

  const handleNavigateToPrimary = () => {
    if (!primaryMissingTab) return;
    handleNavigateToTab(primaryMissingTab);
  };

  // Count total missing required fields
  const totalMissing =
    missingFieldsByTab.identity.length +
    missingFieldsByTab.training.length +
    missingFieldsByTab.health.length;

  if (totalMissing === 0) {
    return null;
  }

  // Group fields by section for better display
  const getFieldsBySection = (tab: 'identity' | 'training' | 'health') => {
    const sections: Record<string, string[]> = {};
    missingFieldsByTab[tab].forEach(field => {
      if (!sections[field.section]) {
        sections[field.section] = [];
      }
      sections[field.section].push(field.label);
    });
    return sections;
  };

  const getTabIcon = (tab: 'identity' | 'training' | 'health') => {
    const iconMap = {
      identity: ICONS.User,
      training: ICONS.Dumbbell,
      health: ICONS.Heart
    };
    return iconMap[tab];
  };

  const getTabColor = (tab: 'identity' | 'training' | 'health') => {
    const colorMap = {
      identity: '#60A5FA',
      training: '#18E3FF',
      health: '#EF4444'
    };
    return colorMap[tab];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
        className="space-y-6 mb-8"
      >
        {/* Main Hero Card */}
        <GlassCard
          className="px-10 py-16 text-center space-y-10"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, color-mix(in srgb, ${STEP1_COLOR} 15%, transparent) 0%, transparent 60%),
              radial-gradient(circle at 20% 80%, color-mix(in srgb, #F59E0B 10%, transparent) 0%, transparent 50%),
              rgba(255, 255, 255, 0.08)
            `,
            border: `2px solid color-mix(in srgb, ${STEP1_COLOR} 30%, transparent)`,
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 40px color-mix(in srgb, ${STEP1_COLOR} 20%, transparent),
              inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `
          }}
        >
          {/* Animated Icon Cluster */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="flex justify-center items-center gap-4"
          >
            <motion.div
              animate={{
                y: [0, -8, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <GlowIcon
                icon="AlertCircle"
                color="#F59E0B"
                size="large"
                glowIntensity={60}
                animate={true}
              />
            </motion.div>

            <motion.div
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5
              }}
            >
              <GlowIcon
                icon="User"
                color={STEP1_COLOR}
                size="hero"
                glowIntensity={70}
              />
            </motion.div>

            <motion.div
              animate={{
                y: [0, -12, 0],
                rotate: [0, -5, 0]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1
              }}
            >
              <GlowIcon
                icon="Dumbbell"
                color="#22C55E"
                size="large"
                glowIntensity={60}
              />
            </motion.div>
          </motion.div>

          {/* Title & Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2
              className="text-4xl font-bold text-white mb-4"
              style={{ letterSpacing: '-0.02em' }}
            >
              Completez votre profil
            </h2>
            <p className="text-xl text-white/80 mb-3">
              Quelques informations sont necessaires pour generer votre training personnalise
            </p>
            <p className="text-white/60">
              {totalMissing} champ{totalMissing > 1 ? 's' : ''} requis pour continuer
            </p>
          </motion.div>

          {/* Primary CTA */}
          {primaryMissingTab && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="pt-6"
            >
              <motion.button
                onClick={handleNavigateToPrimary}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="px-14 py-6 rounded-xl font-bold text-xl shadow-2xl"
                style={{
                  background: `
                    radial-gradient(circle at 50% 20%, ${STEP1_COLOR}90 0%, transparent 70%),
                    linear-gradient(135deg, ${STEP1_COLOR}60, ${STEP1_COLOR}40)
                  `,
                  border: `2px solid ${STEP1_COLOR}`,
                  color: '#FFFFFF',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  boxShadow: `
                    0 12px 40px rgba(0, 0, 0, 0.4),
                    0 0 50px ${STEP1_COLOR}50,
                    inset 0 1px 0 rgba(255, 255, 255, 0.25)
                  `
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <SpatialIcon
                    Icon={getTabIcon(primaryMissingTab)}
                    size={28}
                    style={{
                      color: '#FFFFFF',
                      filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                    }}
                  />
                  <span>Completer mon profil</span>
                  <SpatialIcon
                    Icon={ICONS.ArrowRight}
                    size={28}
                    style={{
                      color: '#FFFFFF',
                      filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                    }}
                  />
                </div>
              </motion.button>
            </motion.div>
          )}
        </GlassCard>

        {/* Missing Fields by Tab */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2 px-2">
            <SpatialIcon Icon={ICONS.List} size={20} style={{ color: STEP1_COLOR }} />
            Champs requis par onglet
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {(['identity', 'training', 'health'] as const).map((tab, index) => {
              const fields = missingFieldsByTab[tab];
              if (fields.length === 0) return null;

              const sections = getFieldsBySection(tab);
              const tabColor = getTabColor(tab);
              const tabIcon = getTabIcon(tab);
              const tabName = getProfileTabDisplayName(tab);

              return (
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <GlassCard
                    className="p-6"
                    style={{
                      background: `
                        radial-gradient(circle at 30% 20%, color-mix(in srgb, ${tabColor} 12%, transparent) 0%, transparent 60%),
                        rgba(255, 255, 255, 0.05)
                      `,
                      border: `1px solid color-mix(in srgb, ${tabColor} 30%, transparent)`
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{
                            background: `color-mix(in srgb, ${tabColor} 20%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${tabColor} 40%, transparent)`,
                            boxShadow: `0 4px 12px color-mix(in srgb, ${tabColor} 25%, transparent)`
                          }}
                        >
                          <SpatialIcon
                            Icon={tabIcon}
                            size={24}
                            style={{ color: tabColor }}
                          />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg">Onglet {tabName}</h4>
                          <p className="text-white/60 text-sm">
                            {fields.length} champ{fields.length > 1 ? 's' : ''} manquant{fields.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleNavigateToTab(tab)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg font-semibold text-sm"
                        style={{
                          background: `color-mix(in srgb, ${tabColor} 25%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${tabColor} 50%, transparent)`,
                          color: tabColor,
                          boxShadow: `0 2px 8px color-mix(in srgb, ${tabColor} 20%, transparent)`
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span>Remplir</span>
                          <SpatialIcon Icon={ICONS.ArrowRight} size={14} />
                        </div>
                      </motion.button>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(sections).map(([section, fieldLabels]) => (
                        <div key={section} className="pl-4 border-l-2" style={{ borderColor: `${tabColor}40` }}>
                          <p className="text-white/80 font-medium text-sm mb-2">{section}</p>
                          <ul className="space-y-1">
                            {fieldLabels.map((label, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-white/70 text-sm">
                                <div
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: tabColor }}
                                />
                                {label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <GlowIcon icon="Sparkles" color="#F59E0B" size="small" glowIntensity={40} />
              Pourquoi completer votre profil ?
            </h3>
            <div className="space-y-3">
              {[
                'Training personnalise base sur vos capacites reelles',
                'Programmes adaptes a votre niveau et objectifs',
                'Recommendations securisees selon votre sante',
                'Progression optimisee avec suivi intelligent'
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
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
    </AnimatePresence>
  );
};

export default Step1ProfileIncompleteEmptyState;
