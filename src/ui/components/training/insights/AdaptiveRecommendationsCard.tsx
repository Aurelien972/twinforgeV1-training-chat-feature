/**
 * AdaptiveRecommendationsCard Component
 * AI-powered recommendations from training insights
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { supabase } from '../../../../system/supabase/client';
import logger from '../../../../lib/utils/logger';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'volume' | 'intensity' | 'recovery' | 'technique' | 'equipment';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  actionLabel?: string;
}

interface AdaptiveRecommendationsCardProps {
  discipline?: string;
}

const AdaptiveRecommendationsCard: React.FC<AdaptiveRecommendationsCardProps> = ({ discipline }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          logger.error('RECOMMENDATIONS', 'User not authenticated');
          setLoading(false);
          return;
        }

        let query = supabase
          .from('training_insights')
          .select('*')
          .eq('user_id', user.id)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (discipline) {
          query = query.eq('discipline', discipline);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          logger.error('RECOMMENDATIONS', 'Failed to fetch insights', { error: error.message });
          setLoading(false);
          return;
        }

        if (data && data.content) {
          const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          setRecommendations(content.recommendations || []);
          setSummary(content.summary || '');
          logger.info('RECOMMENDATIONS', 'Insights loaded', { count: content.recommendations?.length || 0 });
        }
      } catch (error) {
        logger.error('RECOMMENDATIONS', 'Error loading insights', {
          error: error instanceof Error ? error.message : 'Unknown'
        });
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [discipline]);

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-white/10 rounded"></div>
            <div className="h-20 bg-white/10 rounded"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (recommendations.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GlowIcon icon="Brain" color="#18E3FF" size="medium" />
          <div>
            <h3 className="text-lg font-bold text-white">Recommandations IA</h3>
            <p className="text-white/60 text-sm">Aucune recommandation disponible</p>
          </div>
        </div>
        <p className="text-sm text-white/60">
          Complétez quelques séances pour recevoir des recommandations personnalisées.
        </p>
      </GlassCard>
    );
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') return { label: 'Prioritaire', color: '#EF4444' };
    if (priority === 'medium') return { label: 'Important', color: '#F59E0B' };
    return { label: 'Optionnel', color: '#18E3FF' };
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, keyof typeof ICONS> = {
      volume: 'TrendingUp',
      intensity: 'Zap',
      recovery: 'Heart',
      technique: 'Target',
      equipment: 'Dumbbell'
    };
    return iconMap[category] || 'Info';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      volume: '#8B5CF6',
      intensity: '#EF4444',
      recovery: '#22C55E',
      technique: '#18E3FF',
      equipment: '#F59E0B'
    };
    return colorMap[category] || '#18E3FF';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(24, 227, 255, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(24, 227, 255, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px rgba(24, 227, 255, 0.12)'
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <GlowIcon icon="Brain" color="#18E3FF" size="medium" />
          <div>
            <h3 className="text-lg font-bold text-white">Recommandations IA</h3>
            <p className="text-white/60 text-sm">Basées sur vos 90 derniers jours</p>
          </div>
        </div>

        {summary && (
          <div className="p-4 rounded-lg mb-4" style={{
            background: 'rgba(24, 227, 255, 0.05)',
            border: '1px solid rgba(24, 227, 255, 0.15)'
          }}>
            <p className="text-sm text-white/80">{summary}</p>
          </div>
        )}

        <div className="space-y-3">
          {recommendations.slice(0, 5).map((rec, index) => {
            const badge = getPriorityBadge(rec.priority);
            const iconName = getCategoryIcon(rec.category);
            const color = getCategoryColor(rec.category);
            const IconComponent = ICONS[iconName];

            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="p-4 rounded-lg cursor-pointer"
                style={{
                  background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${color} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
                  border: `2px solid color-mix(in srgb, ${color} 20%, transparent)`
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg"
                    style={{
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`
                    }}
                  >
                    <SpatialIcon Icon={IconComponent} size={20} style={{ color }} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white text-sm">{rec.title}</h4>
                      <div className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: `color-mix(in srgb, ${badge.color} 20%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${badge.color} 30%, transparent)`,
                          color: badge.color
                        }}
                      >
                        {badge.label}
                      </div>
                    </div>

                    <p className="text-sm text-white/70 mb-3">
                      {rec.description}
                    </p>

                    {rec.actionable && rec.actionLabel && (
                      <button
                        onClick={() => navigate('/training/pipeline')}
                        className="text-xs font-medium hover:underline"
                        style={{ color }}
                      >
                        {rec.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AdaptiveRecommendationsCard;
