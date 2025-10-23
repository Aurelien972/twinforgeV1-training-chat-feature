/**
 * TrainingLoadManager Component
 * Displays TSS, CTL, ATL, and Form (TSB) for endurance training
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../cards/GlassCard';
import { format, subDays } from 'date-fns';

interface TrainingLoadManagerProps {
  discipline?: string;
}

const TrainingLoadManager: React.FC<TrainingLoadManagerProps> = ({ discipline = 'running' }) => {
  const mockData = Array.from({ length: 42 }, (_, i) => {
    const date = subDays(new Date(), 42 - i);
    const baseTSS = 50 + Math.random() * 100;
    return {
      date,
      tss: Math.round(baseTSS),
      ctl: Math.round(60 + (i / 42) * 20),
      atl: Math.round(50 + Math.random() * 30),
      tsb: 0
    };
  });

  mockData.forEach((point, idx) => {
    point.tsb = point.ctl - point.atl;
  });

  const currentPoint = mockData[mockData.length - 1];
  const currentCTL = currentPoint.ctl;
  const currentATL = currentPoint.atl;
  const currentTSB = currentPoint.tsb;

  let formStatus: 'optimal' | 'fresh' | 'tired';
  let formColor: string;
  let formLabel: string;

  if (currentTSB >= -10 && currentTSB <= 10) {
    formStatus = 'optimal';
    formColor = '#22C55E';
    formLabel = 'Forme Optimale';
  } else if (currentTSB > 10) {
    formStatus = 'fresh';
    formColor = '#3B82F6';
    formLabel = 'Très Frais';
  } else {
    formStatus = 'tired';
    formColor = '#F59E0B';
    formLabel = 'Fatigué';
  }

  const maxCTL = Math.max(...mockData.map(d => d.ctl));
  const maxATL = Math.max(...mockData.map(d => d.atl));
  const maxValue = Math.max(maxCTL, maxATL) + 10;

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Gestion de la Charge</h3>
        <p className="text-sm text-white/60">Training Stress Balance (TSS/CTL/ATL)</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg" style={{
          background: 'rgba(24, 227, 255, 0.05)',
          border: '1px solid rgba(24, 227, 255, 0.15)'
        }}>
          <div className="text-xs text-white/60 mb-1">Fitness (CTL)</div>
          <div className="text-2xl font-bold text-[#18E3FF]">{currentCTL}</div>
          <div className="text-xs text-white/50 mt-1">42j moyenne</div>
        </div>

        <div className="p-4 rounded-lg" style={{
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.15)'
        }}>
          <div className="text-xs text-white/60 mb-1">Fatigue (ATL)</div>
          <div className="text-2xl font-bold text-[#F59E0B]">{currentATL}</div>
          <div className="text-xs text-white/50 mt-1">7j moyenne</div>
        </div>

        <div className="p-4 rounded-lg" style={{
          background: `rgba(${formStatus === 'optimal' ? '34, 197, 94' : formStatus === 'fresh' ? '59, 130, 246' : '245, 158, 11'}, 0.05)`,
          border: `1px solid rgba(${formStatus === 'optimal' ? '34, 197, 94' : formStatus === 'fresh' ? '59, 130, 246' : '245, 158, 11'}, 0.15)`
        }}>
          <div className="text-xs text-white/60 mb-1">Forme (TSB)</div>
          <div className="text-2xl font-bold" style={{ color: formColor }}>
            {currentTSB > 0 ? '+' : ''}{currentTSB}
          </div>
          <div className="text-xs" style={{ color: formColor }}>{formLabel}</div>
        </div>
      </div>

      <div className="relative h-64 mb-4">
        <svg viewBox="0 0 600 240" className="w-full h-full">
          <defs>
            <linearGradient id="ctl-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#18E3FF" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#18E3FF" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="atl-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <line x1="40" y1="220" x2="580" y2="220" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {[0, 25, 50, 75, 100].map((pct, idx) => {
            const y = 220 - (pct / 100) * 200;
            return (
              <line key={pct} x1="40" y1={y} x2="580" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4" />
            );
          })}

          <motion.polyline
            points={mockData.map((point, idx) => {
              const x = 40 + (idx / (mockData.length - 1)) * 540;
              const y = 220 - ((point.ctl / maxValue) * 200);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#18E3FF"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          <motion.polyline
            points={mockData.map((point, idx) => {
              const x = 40 + (idx / (mockData.length - 1)) * 540;
              const y = 220 - ((point.atl / maxValue) * 200);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="4,4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          />

          <text x="50" y="30" className="text-xs fill-[#18E3FF] font-medium">CTL (Fitness)</text>
          <text x="50" y="50" className="text-xs fill-[#F59E0B] font-medium">ATL (Fatigue)</text>
        </svg>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-lg" style={{
          background: 'rgba(24, 227, 255, 0.05)',
          border: '1px solid rgba(24, 227, 255, 0.15)'
        }}>
          <div className="flex items-start gap-3">
            <div className="text-xl">📚</div>
            <div className="flex-1 text-sm text-white/80">
              <p className="mb-2"><strong>CTL (Chronic Training Load):</strong> Votre fitness construit sur 42 jours. Plus c'est élevé, mieux c'est.</p>
              <p className="mb-2"><strong>ATL (Acute Training Load):</strong> Fatigue accumulée sur 7 jours. Attention si trop élevé.</p>
              <p><strong>TSB (Training Stress Balance):</strong> CTL - ATL. Entre -10 et +10 = forme optimale pour compétition.</p>
            </div>
          </div>
        </div>

        {currentTSB < -20 && (
          <div className="p-4 rounded-lg" style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)'
          }}>
            <div className="flex items-center gap-2 text-sm text-red-400">
              <span>⚠️</span>
              <span className="font-medium">
                Attention: Risque de surmenage. Considérez une semaine de récupération.
              </span>
            </div>
          </div>
        )}

        {currentTSB > 20 && (
          <div className="p-4 rounded-lg" style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.15)'
          }}>
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <span>💡</span>
              <span className="font-medium">
                Vous êtes très frais. Période idéale pour intensifier l'entraînement.
              </span>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default TrainingLoadManager;
