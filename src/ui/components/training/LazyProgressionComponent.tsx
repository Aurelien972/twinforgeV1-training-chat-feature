/**
 * LazyProgressionComponent
 * Wrapper for lazy loading progression components
 */

import React from 'react';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import GlassCard from '../../cards/GlassCard';

interface LazyProgressionComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
}

const LazyProgressionComponent: React.FC<LazyProgressionComponentProps> = ({
  children,
  fallback,
  minHeight = '300px'
}) => {
  const [ref, isVisible] = useLazyLoad({
    rootMargin: '200px',
    threshold: 0.01,
    triggerOnce: true
  });

  return (
    <div ref={ref} style={{ minHeight }}>
      {isVisible ? (
        children
      ) : (
        fallback || (
          <GlassCard className="p-6 animate-pulse" style={{ minHeight }}>
            <div className="space-y-4">
              <div className="h-6 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-32 bg-white/5 rounded mt-4" />
            </div>
          </GlassCard>
        )
      )}
    </div>
  );
};

export default LazyProgressionComponent;
