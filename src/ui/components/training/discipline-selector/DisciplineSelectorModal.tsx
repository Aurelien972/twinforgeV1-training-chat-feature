/**
 * DisciplineSelectorModal - Main modal component for discipline selection
 * VisionOS-inspired design with fluid animations and glass morphism
 * RESPONSIVE: Modal appears centered between header and bottom bar on mobile
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import CategorySection from './CategorySection';
import type { DisciplineSelectorModalProps, Discipline } from './types';
import { DISCIPLINE_CATEGORIES, AVAILABLE_COACHES } from './constants';

const DisciplineSelectorModal: React.FC<DisciplineSelectorModalProps> = ({
  isOpen,
  onClose,
  currentDiscipline,
  profileDiscipline,
  onDisciplineChange,
  onSelect,
  initialCategoryId
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['force-powerbuilding', 'functional-crosstraining'])
  );
  const [pendingDiscipline, setPendingDiscipline] = useState<{
    value: string;
    coachType: any;
  } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Auto-expand selected category when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialCategoryId) {
        // Always expand the selected category
        setExpandedCategories(new Set([initialCategoryId]));
      } else if (currentDiscipline) {
        const category = DISCIPLINE_CATEGORIES.find(cat =>
          cat.disciplines.some(d => d.value === currentDiscipline)
        );
        if (category) {
          setExpandedCategories(new Set([category.id]));
        }
      }
    }
  }, [isOpen, currentDiscipline, initialCategoryId]);

  const handleDisciplineClick = (discipline: Discipline) => {
    if (!discipline.available || !AVAILABLE_COACHES.includes(discipline.coachType)) {
      return;
    }

    if (currentDiscipline !== discipline.value) {
      setPendingDiscipline({
        value: discipline.value,
        coachType: discipline.coachType
      });
      setShowConfirmModal(true);
    }
  };

  const confirmDisciplineChange = () => {
    if (pendingDiscipline) {
      if (onSelect) {
        onSelect(pendingDiscipline.value, pendingDiscipline.coachType);
      } else if (onDisciplineChange) {
        onDisciplineChange(pendingDiscipline.value, pendingDiscipline.coachType);
      }
      setShowConfirmModal(false);
      setPendingDiscipline(null);
      onClose();
    }
  };

  const cancelDisciplineChange = () => {
    setShowConfirmModal(false);
    setPendingDiscipline(null);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Filter to show only the selected category's disciplines
  const filteredCategories = initialCategoryId
    ? DISCIPLINE_CATEGORIES.filter(cat => cat.id === initialCategoryId)
    : DISCIPLINE_CATEGORIES;

  // Get selected category info for header
  const selectedCategory = initialCategoryId
    ? DISCIPLINE_CATEGORIES.find(cat => cat.id === initialCategoryId)
    : null;

  if (!isOpen) return null;

  const modalContent = (
    <>
      <motion.div
        key="discipline-selector-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center"
        style={{
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(30px) saturate(180%)',
          padding: '80px 16px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-2xl mx-auto relative flex flex-col"
          style={{
            maxHeight: '85vh',
          }}
        >
          {/* Close Button - Top Right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 sm:top-4 sm:right-4"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
          >
            <SpatialIcon Icon={ICONS.X} size={18} style={{ color: 'white' }} />
          </button>

          <div
            className="flex-1 rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: `
                radial-gradient(circle at 50% 0%, ${selectedCategory ? `color-mix(in srgb, ${selectedCategory.color} 18%, transparent)` : 'rgba(24, 227, 255, 0.15)'} 0%, transparent 50%),
                rgba(17, 24, 39, 0.98)
              `,
              border: selectedCategory ? `1px solid color-mix(in srgb, ${selectedCategory.color} 40%, transparent)` : '1px solid rgba(24, 227, 255, 0.4)',
              boxShadow: '0 8px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12) inset',
              backdropFilter: 'blur(50px) saturate(180%)'
            }}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6" style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}>
              {filteredCategories.map(category => (
                <CategorySection
                  key={category.id}
                  category={category}
                  currentDiscipline={currentDiscipline}
                  profileDiscipline={profileDiscipline}
                  onDisciplineClick={handleDisciplineClick}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingDiscipline && (
        <motion.div
          key="confirmation-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={cancelDisciplineChange}
        >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="max-w-md w-full"
            >
              <GlassCard
                className="p-6"
                style={{
                  background: `
                    radial-gradient(circle at 30% 20%, rgba(24, 227, 255, 0.12) 0%, transparent 60%),
                    rgba(17, 24, 39, 0.95)
                  `,
                  border: '2px solid rgba(24, 227, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(24, 227, 255, 0.35) 0%, transparent 60%), rgba(255, 255, 255, 0.12)',
                      border: '2px solid rgba(24, 227, 255, 0.5)'
                    }}
                  >
                    <SpatialIcon Icon={ICONS.Info} size={24} style={{ color: '#18E3FF' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">
                      Changer de discipline ?
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Votre séance sera adaptée pour cette nouvelle discipline. Le coach spécialisé vous accompagnera.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDisciplineChange}
                    className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all hover:bg-white/15"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDisciplineChange}
                    className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(24, 227, 255, 0.2) 0%, rgba(24, 227, 255, 0.3) 100%)',
                      border: '1px solid rgba(24, 227, 255, 0.5)',
                      boxShadow: '0 4px 16px rgba(24, 227, 255, 0.3)'
                    }}
                  >
                    Confirmer
                  </button>
                </div>
              </GlassCard>
            </motion.div>
        </motion.div>
      )}
    </>
  );

  return createPortal(modalContent, document.body);
};

export default DisciplineSelectorModal;
