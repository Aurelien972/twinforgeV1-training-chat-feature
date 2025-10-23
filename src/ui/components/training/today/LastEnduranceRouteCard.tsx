/**
 * Last Endurance Route Card
 * Display GPS route from last endurance session in Today tab
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../../../system/store/userStore';
import { supabase } from '../../../../system/supabase/client';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import logger from '../../../../lib/utils/logger';
import type { GPSCoordinate, RouteStats } from '../../../../system/services/gpsTrackingService';

const EnduranceMapCard = React.lazy(() => import('../endurance/widgets/EnduranceMapCard'));

interface SessionWithGPS {
  id: string;
  created_at: string;
  gps_data: GPSCoordinate[];
  route_summary: RouteStats;
  type: string;
  discipline?: string;
}

const LastEnduranceRouteCard: React.FC = () => {
  const { user } = useUserStore();
  const [lastSession, setLastSession] = useState<SessionWithGPS | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchLastEnduranceSession = async () => {
      try {
        logger.info('LAST_ENDURANCE_ROUTE', 'Fetching last GPS session');

        const { data, error } = await supabase
          .from('training_sessions')
          .select('id, created_at, gps_data, route_summary, type, discipline')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .not('gps_data', 'is', null)
          .neq('gps_data', '[]')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          if (error.code === '42703') {
            logger.error('LAST_ENDURANCE_ROUTE', 'Column gps_data does not exist - migration not applied', {
              error: error.message,
              hint: 'Run migration fix_add_gps_tracking_columns'
            });
          } else {
            logger.error('LAST_ENDURANCE_ROUTE', 'Error fetching session', {
              error: error.message,
              code: error.code
            });
          }
          return;
        }

        if (data && data.gps_data && Array.isArray(data.gps_data) && data.gps_data.length > 0) {
          setLastSession(data as SessionWithGPS);
          logger.info('LAST_ENDURANCE_ROUTE', 'GPS session found', {
            sessionId: data.id,
            pointsCount: data.gps_data.length,
            date: data.created_at
          });
        } else {
          logger.info('LAST_ENDURANCE_ROUTE', 'No GPS sessions found');
        }
      } catch (err) {
        logger.error('LAST_ENDURANCE_ROUTE', 'Exception fetching session', {
          error: err instanceof Error ? err.message : 'Unknown'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLastEnduranceSession();
  }, [user?.id]);

  if (loading) {
    return (
      <GlassCard variant="frosted" className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-white/5 rounded w-32 mb-2 animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-48 animate-pulse" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!lastSession) {
    return null;
  }

  const sessionDate = new Date(lastSession.created_at);
  const isToday = new Date().toDateString() === sessionDate.toDateString();
  const isYesterday = new Date(Date.now() - 86400000).toDateString() === sessionDate.toDateString();

  let dateLabel = sessionDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  if (isToday) {
    dateLabel = "Aujourd'hui";
  } else if (isYesterday) {
    dateLabel = 'Hier';
  }

  const disciplineColor = '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <React.Suspense
        fallback={
          <GlassCard variant="frosted" className="p-6">
            <div className="text-center text-white/60">Chargement de la carte...</div>
          </GlassCard>
        }
      >
        <EnduranceMapCard
          coordinates={lastSession.gps_data}
          routeStats={lastSession.route_summary}
          isLive={false}
          sessionName={`Dernier parcours - ${dateLabel}`}
          disciplineColor={disciplineColor}
          expanded={expanded}
          onToggleExpand={() => setExpanded(!expanded)}
        />
      </React.Suspense>
    </motion.div>
  );
};

export default LastEnduranceRouteCard;
