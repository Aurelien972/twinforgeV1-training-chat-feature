/**
 * CurrentMedicationsCard Component
 * Manages current medications
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';

interface CurrentMedicationsCardProps {
  medications: string[];
  newMedication: string;
  setNewMedication: (value: string) => void;
  onAddMedication: () => void;
  onRemoveMedication: (index: number) => void;
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

const COMMON_MEDICATIONS = [
  'Metformine',
  'Lisinopril',
  'Atorvastatine',
  'Levothyroxine',
  'Oméprazole',
  'Amlodipine',
  'Aspirine',
  'Ibuprofène',
  'Paracétamol',
  'Ventoline (Salbutamol)',
];

export const CurrentMedicationsCard: React.FC<CurrentMedicationsCardProps> = ({
  medications,
  newMedication,
  setNewMedication,
  onAddMedication,
  onRemoveMedication,
  onSave,
  isSaving,
  isDirty,
}) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const filteredSuggestions = COMMON_MEDICATIONS.filter(
    (med) =>
      med.toLowerCase().includes(newMedication.toLowerCase()) &&
      !medications.includes(med)
  );

  const handleSuggestionClick = (medication: string) => {
    setNewMedication(medication);
    setShowSuggestions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <GlassCard
        className="p-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'rgba(239, 68, 68, 0.2)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.2))
              `,
              border: '2px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            }}
          >
            <SpatialIcon Icon={ICONS.Pill} size={24} style={{ color: '#EF4444' }} variant="pure" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-xl">Médicaments Actuels</h3>
            <p className="text-white/60 text-sm mt-1">Traitements en cours et suppléments</p>
          </div>
          {medications.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20">
              <span className="text-blue-300 font-bold text-sm">{medications.length}</span>
            </div>
          )}
        </div>

        {/* Medications Input with Suggestions */}
        <div className="relative mb-4">
          <label className="block text-white/90 text-sm font-medium mb-3">
            Ajouter un médicament
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newMedication}
                onChange={(e) => {
                  setNewMedication(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="glass-input w-full"
                placeholder="Ex: Metformine, Aspirine..."
              />
            </div>
            <button
              type="button"
              onClick={onAddMedication}
              disabled={!newMedication.trim()}
              className="btn-glass py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <SpatialIcon Icon={ICONS.Plus} size={14} className="inline mr-1" />
              Ajouter
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && newMedication.length > 0 && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-xl bg-gray-900/95 border border-white/10 backdrop-blur-xl shadow-2xl"
            >
              <div className="p-2">
                <div className="text-white/50 text-xs px-3 py-2">Médicaments courants:</div>
                {filteredSuggestions.map((medication, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(medication)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white text-sm"
                  >
                    {medication}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Medications List */}
        {medications.length > 0 && (
          <div className="space-y-2">
            {medications.map((medication, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-400/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-white font-medium text-sm">{medication}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveMedication(index)}
                  className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                >
                  <SpatialIcon Icon={ICONS.X} size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {medications.length === 0 && (
          <div className="text-center py-6 text-white/50 text-sm">
            <SpatialIcon Icon={ICONS.Pill} size={32} className="mx-auto mb-2 opacity-50" />
            <p>Aucun médicament ajouté</p>
            <p className="text-xs mt-1">Incluez les traitements et suppléments réguliers</p>
          </div>
        )}

        {/* Save Button */}
        <AnimatePresence>
          {isDirty && onSave && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex justify-end mt-6"
            >
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="btn-glass px-6 py-2.5 text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                }}
              >
                <div className="flex items-center gap-2">
                  {isSaving ? (
                    <SpatialIcon Icon={ICONS.Loader2} size={16} className="animate-spin" />
                  ) : (
                    <SpatialIcon Icon={ICONS.Save} size={16} />
                  )}
                  <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Banner */}
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-400/20">
          <div className="flex items-start gap-2">
            <SpatialIcon Icon={ICONS.AlertTriangle} size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/70 text-xs leading-relaxed">
              Important: Incluez tous vos médicaments prescrits et en vente libre. Ces informations peuvent influencer les recommandations nutritionnelles et sportives.
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
