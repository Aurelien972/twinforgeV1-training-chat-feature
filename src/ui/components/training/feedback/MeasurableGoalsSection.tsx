/**
 * MeasurableGoalsSection Component
 * Section pour gérer les objectifs SMART mesurables avec intégration Supabase
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import GlassCard from '../../../cards/GlassCard';
import { useTrainingGoals } from '../../../../hooks/useTrainingGoals';
import { useToast } from '../../../components/ToastProvider';

const MeasurableGoalsSection: React.FC = () => {
  const { goals, loading, error, createGoal, updateGoal, deleteGoal } = useTrainingGoals();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    current_value: undefined as number | undefined,
    target_value: 0,
    unit: '',
    deadline: ''
  });

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target_value || !newGoal.unit) {
      showToast({
        type: 'error',
        title: 'Champs requis',
        message: 'Veuillez remplir tous les champs obligatoires',
        duration: 3000
      });
      return;
    }

    try {
      setSaving(true);
      await createGoal({
        name: newGoal.name,
        description: newGoal.description,
        current_value: newGoal.current_value,
        target_value: newGoal.target_value,
        unit: newGoal.unit,
        deadline: newGoal.deadline || undefined
      });

      showToast({
        type: 'success',
        title: 'Objectif créé',
        message: 'Votre objectif a été créé avec succès',
        duration: 3000
      });

      setNewGoal({
        name: '',
        description: '',
        current_value: undefined,
        target_value: 0,
        unit: '',
        deadline: ''
      });
      setShowAddForm(false);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: err instanceof Error ? err.message : 'Impossible de créer l\'objectif',
        duration: 4000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'objectif "${goalName}" ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      await deleteGoal(goalId);
      showToast({
        type: 'success',
        title: 'Objectif supprimé',
        message: 'L\'objectif a été supprimé avec succès',
        duration: 3000
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer l\'objectif',
        duration: 4000
      });
    }
  };

  const calculateProgress = (currentValue?: number, targetValue?: number): number => {
    if (!currentValue || !targetValue) return 0;
    return Math.min(100, (currentValue / targetValue) * 100);
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <SpatialIcon Icon={ICONS.Loader2} size={48} className="text-cyan-400 animate-spin" />
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <SpatialIcon Icon={ICONS.AlertCircle} size={48} className="text-red-400 mb-4" />
          <p className="text-red-300 font-medium mb-2">Erreur de chargement</p>
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className="p-6"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
          var(--glass-opacity)
        `,
        borderColor: 'rgba(6, 182, 212, 0.2)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.35) 0%, transparent 60%),
                rgba(255, 255, 255, 0.12)
              `,
              border: '2px solid rgba(6, 182, 212, 0.5)',
              boxShadow: `
                0 4px 16px rgba(6, 182, 212, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <SpatialIcon
              Icon={ICONS.Target}
              size={24}
              style={{
                color: '#06B6D4',
                filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.7))'
              }}
            />
          </div>
          <div>
            <h3 className="text-white font-semibold text-xl">Objectifs Mesurables</h3>
            <p className="text-white/60 text-sm mt-1">
              Suivez votre progression avec des objectifs concrets
            </p>
          </div>
        </div>
      </div>

      {goals.length > 0 && (
        <div className="space-y-3 mb-4">
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => {
              const progress = calculateProgress(goal.current_value, goal.target_value);

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{goal.name}</h4>
                      {goal.description && (
                        <p className="text-white/60 text-sm mt-1">{goal.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id, goal.name)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors flex-shrink-0"
                      title="Supprimer"
                    >
                      <SpatialIcon Icon={ICONS.Trash2} size={14} className="text-white/80" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white/70">
                          {goal.current_value !== undefined && goal.current_value !== null
                            ? `${goal.current_value} ${goal.unit}`
                            : 'Non renseigné'}
                        </span>
                        <span className="text-white/70">
                          {goal.target_value} {goal.unit}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        />
                      </div>
                    </div>
                    {goal.deadline && (
                      <div className="text-right">
                        <span className="text-white/50 text-xs">Date cible</span>
                        <p className="text-white/80 text-sm">
                          {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showAddForm ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-400/30"
        >
          <h4 className="text-white font-medium">Nouvel Objectif</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              placeholder="Nom de l'objectif *"
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
            />

            <input
              type="text"
              value={newGoal.unit}
              onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
              placeholder="Unité (kg, min, reps...) *"
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <textarea
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            placeholder="Description (optionnel)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 resize-none"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              value={newGoal.current_value || ''}
              onChange={(e) =>
                setNewGoal({ ...newGoal, current_value: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="Valeur actuelle"
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
            />

            <input
              type="number"
              value={newGoal.target_value || ''}
              onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
              placeholder="Valeur cible *"
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
            />

            <input
              type="date"
              value={newGoal.deadline || ''}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddGoal}
              disabled={!newGoal.name || !newGoal.target_value || !newGoal.unit || saving}
              className="flex-1 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewGoal({
                  name: '',
                  description: '',
                  current_value: undefined,
                  target_value: 0,
                  unit: '',
                  deadline: ''
                });
              }}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 rounded-lg border-2 border-dashed border-cyan-400/40 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 font-medium transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <SpatialIcon Icon={ICONS.Plus} size={18} />
            <span>Ajouter un objectif mesurable</span>
          </div>
        </button>
      )}

      {goals.length === 0 && !showAddForm && (
        <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-400/20">
          <div className="flex items-start gap-3">
            <SpatialIcon Icon={ICONS.Info} size={18} className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-cyan-200">
              <p className="font-medium mb-2">Exemples d'objectifs SMART:</p>
              <ul className="space-y-1 text-cyan-300/90 text-xs">
                <li>• Courir 5km en moins de 25 minutes d'ici 3 mois</li>
                <li>• Atteindre 10 tractions strictes d'ici 6 mois</li>
                <li>• Soulever 100kg au développé couché d'ici 1 an</li>
                <li>• Perdre 5kg de masse grasse d'ici 12 semaines</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default MeasurableGoalsSection;
