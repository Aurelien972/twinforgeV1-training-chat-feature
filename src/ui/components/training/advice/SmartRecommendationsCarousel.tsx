/**
 * SmartRecommendationsCarousel Component
 * Horizontal scrollable carousel of categorized recommendations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { AdviceRecommendation } from '../../../../system/services/trainingAdviceService';

interface SmartRecommendationsCarouselProps {
  recommendations: AdviceRecommendation[];
  onMarkHelpful?: (recommendationId: string, helpful: boolean) => void;
}

const SmartRecommendationsCarousel: React.FC<SmartRecommendationsCarouselProps> = ({
  recommendations,
  onMarkHelpful
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Tous', icon: 'Sparkles', color: '#18E3FF' },
    { id: 'volume', label: 'Volume', icon: 'TrendingUp', color: '#8B5CF6' },
    { id: 'intensity', label: 'Intensité', icon: 'Zap', color: '#EF4444' },
    { id: 'recovery', label: 'Récupération', icon: 'Heart', color: '#22C55E' },
    { id: 'technique', label: 'Technique', icon: 'Target', color: '#18E3FF' },
    { id: 'strategy', label: 'Stratégie', icon: 'Brain', color: '#EC4899' }
  ];

  const filteredRecommendations = activeCategory === 'all'
    ? recommendations
    : recommendations.filter(r => r.category === activeCategory);

  const getCategoryConfig = (category: string) => {
    const configs: Record<string, { color: string; icon: keyof typeof ICONS }> = {
      volume: { color: '#8B5CF6', icon: 'TrendingUp' },
      intensity: { color: '#EF4444', icon: 'Zap' },
      recovery: { color: '#22C55E', icon: 'Heart' },
      technique: { color: '#18E3FF', icon: 'Target' },
      equipment: { color: '#F59E0B', icon: 'Dumbbell' },
      strategy: { color: '#EC4899', icon: 'Brain' }
    };
    return configs[category] || { color: '#18E3FF', icon: 'Sparkles' as keyof typeof ICONS };
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') return { label: 'Important', color: '#EF4444' };
    if (priority === 'medium') return { label: 'Recommandé', color: '#F59E0B' };
    return { label: 'Optionnel', color: '#94A3B8' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;

          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2.5"
              style={{
                background: isActive
                  ? `color-mix(in srgb, ${cat.color} 20%, transparent)`
                  : 'rgba(255, 255, 255, 0.05)',
                border: isActive
                  ? `2px solid color-mix(in srgb, ${cat.color} 40%, transparent)`
                  : '2px solid rgba(255, 255, 255, 0.1)',
                color: isActive ? cat.color : 'rgba(255, 255, 255, 0.6)',
                boxShadow: isActive ? `0 4px 16px color-mix(in srgb, ${cat.color} 25%, transparent)` : 'none'
              }}
            >
              <GlowIcon icon={cat.icon as keyof typeof ICONS} color={cat.color} size="tiny" glowIntensity={isActive ? 40 : 25} />
              <span>{cat.label}</span>
              {cat.id !== 'all' && (
                <span className="ml-1 text-xs opacity-60">
                  ({recommendations.filter(r => r.category === cat.id).length})
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {filteredRecommendations.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-white/60">Aucune recommandation dans cette catégorie</p>
            </GlassCard>
          ) : (
            filteredRecommendations.map((rec, index) => {
              const config = getCategoryConfig(rec.category);
              const badge = getPriorityBadge(rec.priority);

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard
                    className="p-5"
                    style={{
                      background: `
                        radial-gradient(circle at 30% 20%, color-mix(in srgb, ${config.color} 8%, transparent) 0%, transparent 50%),
                        rgba(255, 255, 255, 0.05)
                      `,
                      border: `2px solid color-mix(in srgb, ${config.color} 15%, transparent)`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <GlowIcon
                        icon={config.icon}
                        color={config.color}
                        size="small"
                        glowIntensity={35}
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{rec.title}</h4>
                          <div
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${badge.color} 25%, transparent)`,
                              color: badge.color
                            }}
                          >
                            {badge.label}
                          </div>
                        </div>

                        <p className="text-sm text-white/70 mb-3 leading-relaxed">
                          {rec.description}
                        </p>

                        <div className="flex items-center gap-2">
                          {rec.actionable && rec.actionLabel && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg"
                              style={{
                                background: `color-mix(in srgb, ${config.color} 20%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${config.color} 30%, transparent)`,
                                color: config.color
                              }}
                            >
                              {rec.actionLabel} →
                            </motion.button>
                          )}

                          {onMarkHelpful && (
                            <div className="flex items-center gap-1 ml-auto">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onMarkHelpful(rec.id, true)}
                                className="w-7 h-7 rounded flex items-center justify-center"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)'
                                }}
                                title="Utile"
                              >
                                <SpatialIcon Icon={ICONS.ThumbsUp} size={14} style={{ color: '#22C55E' }} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onMarkHelpful(rec.id, false)}
                                className="w-7 h-7 rounded flex items-center justify-center"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)'
                                }}
                                title="Pas utile"
                              >
                                <SpatialIcon Icon={ICONS.ThumbsDown} size={14} style={{ color: '#EF4444' }} />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SmartRecommendationsCarousel;
