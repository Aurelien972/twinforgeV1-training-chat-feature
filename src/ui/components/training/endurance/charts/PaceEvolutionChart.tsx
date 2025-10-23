/**
 * PaceEvolutionChart Component
 * Shows pace progression over time for different distances
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import { format } from 'date-fns';

interface PaceEvolutionChartProps {
  discipline?: string;
}

const PaceEvolutionChart: React.FC<PaceEvolutionChartProps> = ({ discipline = 'running' }) => {
  const [selectedDistance, setSelectedDistance] = useState<string>('10K');

  const distances = [
    { value: '5K', label: '5K' },
    { value: '10K', label: '10K' },
    { value: 'Half', label: 'Semi' },
    { value: 'Marathon', label: 'Marathon' }
  ];

  const mockData = [
    { date: new Date(2025, 7, 1), pace: '5:30', seconds: 330 },
    { date: new Date(2025, 7, 15), pace: '5:22', seconds: 322 },
    { date: new Date(2025, 8, 1), pace: '5:18', seconds: 318 },
    { date: new Date(2025, 8, 20), pace: '5:10', seconds: 310 },
    { date: new Date(2025, 9, 5), pace: '5:05', seconds: 305 }
  ];

  const maxSeconds = Math.max(...mockData.map(d => d.seconds));
  const minSeconds = Math.min(...mockData.map(d => d.seconds));
  const range = maxSeconds - minSeconds;

  const improvement = ((mockData[0].seconds - mockData[mockData.length - 1].seconds) / mockData[0].seconds * 100).toFixed(1);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Évolution du Pace</h3>
        <div className="flex gap-2">
          {distances.map(dist => (
            <button
              key={dist.value}
              onClick={() => setSelectedDistance(dist.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                selectedDistance === dist.value
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={selectedDistance === dist.value ? {
                background: 'rgba(24, 227, 255, 0.2)',
                border: '1px solid rgba(24, 227, 255, 0.4)'
              } : {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {dist.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-white">{mockData[mockData.length - 1].pace}</span>
          <span className="text-sm text-white/60">/km</span>
          <span className="text-sm font-medium text-green-400 ml-2">
            -{improvement}%
          </span>
        </div>
        <p className="text-sm text-white/60">Pace moyen actuel pour {selectedDistance}</p>
      </div>

      <div className="relative h-64 mb-4">
        <svg viewBox="0 0 600 240" className="w-full h-full">
          <defs>
            <linearGradient id="pace-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#18E3FF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#18E3FF" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <line x1="40" y1="220" x2="580" y2="220" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {[0, 25, 50, 75, 100].map((pct, idx) => {
            const y = 220 - (pct / 100) * 200;
            return (
              <g key={pct}>
                <line x1="40" y1={y} x2="580" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4" />
              </g>
            );
          })}

          {mockData.map((point, idx) => {
            const x = 40 + (idx / (mockData.length - 1)) * 540;
            const normalizedValue = (maxSeconds - point.seconds) / range;
            const y = 220 - (normalizedValue * 200);

            return (
              <g key={idx}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#18E3FF"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                />
                <text
                  x={x}
                  y={y - 15}
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  {point.pace}
                </text>
              </g>
            );
          })}

          <motion.polyline
            points={mockData.map((point, idx) => {
              const x = 40 + (idx / (mockData.length - 1)) * 540;
              const normalizedValue = (maxSeconds - point.seconds) / range;
              const y = 220 - (normalizedValue * 200);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#18E3FF"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          <motion.polygon
            points={`40,220 ${mockData.map((point, idx) => {
              const x = 40 + (idx / (mockData.length - 1)) * 540;
              const normalizedValue = (maxSeconds - point.seconds) / range;
              const y = 220 - (normalizedValue * 200);
              return `${x},${y}`;
            }).join(' ')} 580,220`}
            fill="url(#pace-gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
        </svg>
      </div>

      <div className="grid grid-cols-5 gap-2 text-xs text-white/60 text-center">
        {mockData.map((point, idx) => (
          <div key={idx}>
            {format(point.date, 'dd/MM')}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg" style={{
        background: 'rgba(34, 197, 94, 0.05)',
        border: '1px solid rgba(34, 197, 94, 0.15)'
      }}>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <span>📈</span>
          <span className="font-medium">
            Progression constante de {improvement}% sur les 90 derniers jours
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

export default PaceEvolutionChart;
