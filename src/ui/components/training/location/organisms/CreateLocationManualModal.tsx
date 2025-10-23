/**
 * CreateLocationManualModal Component
 * Modal pour créer un lieu manuellement avec sélection d'équipements
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { LocationTypeCard } from '../atoms';
import { EquipmentSelector } from '../../equipment';
import type { CreateLocationManualModalProps, CreateLocationManualData, LocationType } from '../types';
import { LOCATION_NAME_PLACEHOLDERS } from '../constants';
import logger from '../../../../../lib/utils/logger';


const CreateLocationManualModal: React.FC<CreateLocationManualModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [locationType, setLocationType] = useState<LocationType>('home');
  const [locationName, setLocationName] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setStep(1);
    setLocationType('home');
    setLocationName('');
    setSelectedEquipment([]);
    setIsDefault(false);
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      logger.info('CREATE_LOCATION_MANUAL', 'Creating location', {
        locationType,
        equipmentCount: selectedEquipment.length
      });

      const locationData: CreateLocationManualData = {
        name: locationName.trim() || undefined,
        type: locationType,
        is_default: isDefault,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined
      };

      await onSave(locationData);
      handleClose();
    } catch (error) {
      logger.error('CREATE_LOCATION_MANUAL', 'Failed to create location', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Failed to create location:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceedToStep2 = locationType !== null;
  const canSave = selectedEquipment.length > 0;

  const getStepColor = () => {
    switch (step) {
      case 1: return '#10B981';
      case 2: return '#3B82F6';
      case 3: return '#F59E0B';
      default: return '#06B6D4';
    }
  };

  const stepColor = getStepColor();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            pointerEvents: 'auto',
            cursor: saving ? 'not-allowed' : 'default',
            overflow: 'hidden'
          }}
          onClick={saving ? undefined : handleClose}
        >
          <div
            className="relative w-full h-full sm:h-auto max-w-4xl max-h-[85vh] md:max-h-[90vh] flex flex-col mx-3 rounded-2xl"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-0 overflow-hidden rounded-2xl flex flex-col max-h-full"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 60%),
                  radial-gradient(circle at 70% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: '2px solid rgba(6, 182, 212, 0.3)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  0 0 40px rgba(6, 182, 212, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.15)
                `
              }}
            >
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Créer un Lieu Manuellement</h2>
                    <p className="text-white/60 text-sm mt-1">Étape {step} sur 3</p>
                  </div>
                  <motion.button
                    onClick={handleClose}
                    disabled={saving}
                    className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  >
                    <SpatialIcon Icon={ICONS.X} size={20} className="text-white" />
                  </motion.button>
                </div>

                <div className="flex gap-2 mt-4">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className="flex-1 h-1 rounded-full transition-all"
                      style={{
                        background: s <= step ? stepColor : 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                className="p-4 md:p-6 overflow-y-auto overscroll-contain flex-1"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(6, 182, 212, 0.3) transparent',
                  minHeight: 0,
                  maxHeight: 'calc(85vh - 180px)',
                  overscrollBehavior: 'contain',
                  overflowY: 'auto',
                  touchAction: 'pan-y'
                }}
              >
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent), transparent 70%)`,
                            border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                            boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent)`
                          }}
                        >
                          <SpatialIcon
                            Icon={ICONS.MapPin}
                            size={28}
                            style={{
                              color: stepColor,
                              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">Type de Lieu</h3>
                          <p className="text-white/60 text-sm">Où allez-vous vous entraîner ?</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <LocationTypeCard
                          type="home"
                          label="Maison"
                          description="Entraînement à domicile"
                          isSelected={locationType === 'home'}
                          onClick={() => setLocationType('home')}
                        />
                        <LocationTypeCard
                          type="gym"
                          label="Salle de Sport"
                          description="Salle équipée"
                          isSelected={locationType === 'gym'}
                          onClick={() => setLocationType('gym')}
                        />
                        <LocationTypeCard
                          type="outdoor"
                          label="Extérieur"
                          description="Entraînement en plein air"
                          isSelected={locationType === 'outdoor'}
                          onClick={() => setLocationType('outdoor')}
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent), transparent 70%)`,
                            border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                            boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent)`
                          }}
                        >
                          <SpatialIcon
                            Icon={ICONS.Edit}
                            size={28}
                            style={{
                              color: stepColor,
                              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">Nom du Lieu</h3>
                          <p className="text-white/60 text-sm">Donnez un nom personnalisé (optionnel)</p>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          placeholder={`Ex: ${
                            locationType === 'home'
                              ? 'Ma salle à domicile'
                              : locationType === 'gym'
                              ? 'Basic Fit Centre'
                              : 'Parc de la ville'
                          }`}
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors"
                        />
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-400/20">
                        <SpatialIcon Icon={ICONS.Info} size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-200">
                          <p className="font-medium mb-1">Pourquoi nommer votre lieu ?</p>
                          <p className="text-blue-300/90 text-xs">
                            Un nom personnalisé vous permet de différencier facilement plusieurs lieux du même type
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent), transparent 70%)`,
                            border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                            boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent)`
                          }}
                        >
                          <SpatialIcon
                            Icon={ICONS.Dumbbell}
                            size={28}
                            style={{
                              color: stepColor,
                              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">Équipements Disponibles</h3>
                          <p className="text-white/60 text-sm">
                            Sélectionnez les équipements disponibles dans ce lieu
                          </p>
                        </div>
                      </div>

                      <EquipmentSelector
                        locationType={locationType}
                        selectedEquipment={selectedEquipment}
                        onEquipmentChange={setSelectedEquipment}
                        color="#06B6D4"
                      />

                      <div className="space-y-3 pt-4 border-t border-white/10">
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors active:opacity-80">
                          <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="w-5 h-5"
                          />
                          <div>
                            <span className="text-white font-medium">Lieu par défaut</span>
                            <p className="text-white/60 text-xs mt-0.5">
                              Ce lieu sera présélectionné lors de la création de programmes
                            </p>
                          </div>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between gap-2 md:gap-4 flex-shrink-0">
                <button
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1 || saving}
                  className="px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-auto touch-manipulation flex items-center justify-center gap-2 active:opacity-80"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <SpatialIcon Icon={ICONS.ChevronLeft} size={18} />
                  <span className="text-sm md:text-base">Précédent</span>
                </button>

                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={(step === 1 && !canProceedToStep2) || saving}
                    className="flex-1 md:flex-initial px-6 py-2.5 md:px-8 md:py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-auto touch-manipulation flex items-center justify-center gap-2 active:opacity-80"
                    style={{
                      background: `linear-gradient(135deg, ${stepColor}, color-mix(in srgb, ${stepColor} 85%, black))`,
                      color: 'white',
                      boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 40%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span className="text-sm md:text-base">Suivant</span>
                    <SpatialIcon Icon={ICONS.ChevronRight} size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className="flex-1 md:flex-initial px-4 py-2.5 md:px-8 md:py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-auto touch-manipulation flex items-center justify-center gap-2 active:opacity-80"
                    style={{
                      background: `linear-gradient(135deg, #22C55E, #16A34A)`,
                      color: 'white',
                      boxShadow: `0 4px 16px rgba(34, 197, 94, 0.4)`,
                      border: '1px solid rgba(34, 197, 94, 0.6)',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {saving ? (
                      <>
                        <SpatialIcon Icon={ICONS.Loader2} size={18} className="animate-spin" />
                        <span className="text-xs md:text-sm leading-tight">Création...</span>
                      </>
                    ) : (
                      <>
                        <SpatialIcon Icon={ICONS.Check} size={18} />
                        <span className="text-xs md:text-sm leading-tight">Créer le Lieu</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CreateLocationManualModal;
