/**
 * RecordDetailModal Component
 * Modal displaying detailed information about a personal record and its history
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';
import { useFeedback } from '../../../../hooks/useFeedback';

interface PersonalRecord {
  id: string;
  exerciseName: string;
  recordType: 'max_weight' | 'max_volume' | 'max_distance' | 'max_duration';
  value: number;
  unit: string;
  achievedAt: Date;
  improvement: number;
  discipline: string;
}

interface RecordHistory {
  value: number;
  date: Date;
  sessionId: string;
  notes?: string;
}

interface RecordDetailModalProps {
  record: PersonalRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, isOpen, onClose }) => {
  const { click } = useFeedback();
  const [history, setHistory] = useState<RecordHistory[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (record) {
      const mockHistory: RecordHistory[] = [
        {
          value: record.value,
          date: record.achievedAt,
          sessionId: record.id,
          notes: ''
        },
        {
          value: record.value * 0.95,
          date: new Date(new Date(record.achievedAt).getTime() - 14 * 24 * 60 * 60 * 1000),
          sessionId: 'mock-1',
          notes: ''
        },
        {
          value: record.value * 0.90,
          date: new Date(new Date(record.achievedAt).getTime() - 28 * 24 * 60 * 60 * 1000),
          sessionId: 'mock-2',
          notes: ''
        }
      ];
      setHistory(mockHistory);
    }
  }, [record]);

  if (!record) return null;

  const getDisciplineColor = (discipline: string): string => {
    const colors: Record<string, string> = {
      strength: '#8B5CF6',
      endurance: '#F59E0B',
      functional: '#22C55E',
      calisthenics: '#06B6D4',
      competitions: '#EF4444'
    };
    return colors[discipline] || '#3B82F6';
  };

  const getRecordTypeLabel = (type: string): string => {
    switch (type) {
      case 'max_weight': return 'Poids Maximum';
      case 'max_volume': return 'Volume Maximum';
      case 'max_distance': return 'Distance Maximum';
      case 'max_duration': return 'Durée Maximum';
      default: return type;
    }
  };

  const getRecordIcon = (type: string): keyof typeof ICONS => {
    switch (type) {
      case 'max_weight': return 'Dumbbell';
      case 'max_volume': return 'TrendingUp';
      case 'max_distance': return 'MapPin';
      case 'max_duration': return 'Clock';
      default: return 'Trophy';
    }
  };

  const color = getDisciplineColor(record.discipline);

  const handleClose = () => {
    click();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${color} 12%, transparent) 0%, transparent 60%),
                  rgba(20, 20, 30, 0.98)
                `,
                border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                boxShadow: `
                  0 20px 60px rgba(0, 0, 0, 0.5),
                  0 0 40px color-mix(in srgb, ${color} 20%, transparent),
                  inset 0 2px 0 rgba(255, 255, 255, 0.15)
                `,
                backdropFilter: 'blur(20px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 p-6 pb-4"
                style={{
                  background: 'rgba(20, 20, 30, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderBottom: `1px solid color-mix(in srgb, ${color} 15%, transparent)`
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `
                          radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                          linear-gradient(135deg, color-mix(in srgb, ${color} 30%, transparent), color-mix(in srgb, ${color} 20%, transparent))
                        `,
                        border: `2px solid color-mix(in srgb, ${color} 40%, transparent)`,
                        boxShadow: `0 0 20px color-mix(in srgb, ${color} 30%, transparent)`
                      }}
                    >
                      <SpatialIcon Icon={ICONS[getRecordIcon(record.recordType)]} size={24} style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {record.exerciseName}
                      </h2>
                      <p className="text-sm" style={{ color }}>
                        {getRecordTypeLabel(record.recordType)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <SpatialIcon Icon={ICONS.X} size={20} style={{ color: '#ffffff' }} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Current Record */}
                <div
                  className="p-6 rounded-xl"
                  style={{
                    background: `color-mix(in srgb, ${color} 10%, transparent)`,
                    border: `2px solid color-mix(in srgb, ${color} 25%, transparent)`
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/70 text-sm font-medium">Record Actuel</span>
                    <div className="flex items-center gap-2">
                      <SpatialIcon Icon={ICONS.Calendar} size={14} style={{ color }} />
                      <span className="text-xs" style={{ color }}>
                        {format(record.achievedAt, 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold" style={{ color }}>
                      {record.value}
                    </span>
                    <span className="text-2xl text-white/70">{record.unit}</span>
                  </div>

                  {record.improvement > 0 && (
                    <div className="flex items-center gap-2 mt-4">
                      <SpatialIcon Icon={ICONS.TrendingUp} size={16} style={{ color: '#22C55E' }} />
                      <span className="text-green-400 text-sm font-medium">
                        +{record.improvement}% depuis le dernier record
                      </span>
                    </div>
                  )}
                </div>

                {/* History Timeline */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <SpatialIcon Icon={ICONS.Clock} size={18} style={{ color }} />
                    Historique des Tentatives
                  </h3>

                  <div className="space-y-3">
                    {history.map((entry, index) => (
                      <motion.div
                        key={`${entry.sessionId}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pl-8"
                      >
                        {/* Timeline dot */}
                        {index < history.length - 1 && (
                          <div
                            className="absolute left-2 top-8 bottom-0 w-0.5"
                            style={{
                              background: `color-mix(in srgb, ${color} 20%, transparent)`
                            }}
                          />
                        )}

                        <div
                          className="absolute left-0 top-4 w-4 h-4 rounded-full z-10"
                          style={{
                            background: index === 0 ? color : `color-mix(in srgb, ${color} 40%, transparent)`,
                            border: `2px solid color-mix(in srgb, ${color} 60%, transparent)`,
                            boxShadow: index === 0 ? `0 0 10px ${color}60` : 'none'
                          }}
                        />

                        <div
                          className="p-4 rounded-lg"
                          style={{
                            background: index === 0
                              ? `color-mix(in srgb, ${color} 8%, transparent)`
                              : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${index === 0 ? `color-mix(in srgb, ${color} 20%, transparent)` : 'rgba(255, 255, 255, 0.1)'}`
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold text-lg">
                              {entry.value}{record.unit}
                            </span>
                            <span className="text-white/60 text-xs">
                              {format(entry.date, 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>

                          {index === 0 && (
                            <div
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: `color-mix(in srgb, ${color} 20%, transparent)`,
                                color
                              }}
                            >
                              <SpatialIcon Icon={ICONS.Trophy} size={12} style={{ color }} />
                              Record Personnel
                            </div>
                          )}

                          {entry.notes && (
                            <p className="text-white/70 text-sm mt-2">{entry.notes}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <SpatialIcon Icon={ICONS.FileText} size={18} style={{ color }} />
                    Notes
                  </h3>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajoutez des notes sur ce record (conditions, sensations, stratégie...)"
                    className="w-full p-4 rounded-lg text-white text-sm resize-none"
                    rows={4}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
                    style={{
                      background: `color-mix(in srgb, ${color} 20%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
                      boxShadow: `0 0 20px color-mix(in srgb, ${color} 20%, transparent)`
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RecordDetailModal;
