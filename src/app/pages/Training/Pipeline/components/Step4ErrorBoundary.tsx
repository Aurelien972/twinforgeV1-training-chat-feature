/**
 * Step4ErrorBoundary Component
 * Error boundary specifically for Step 4 Adapter to catch and handle rendering errors
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { STEP_COLORS } from '../../../../../system/store/trainingPipeline';
import GlassCard from '../../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../../ui/icons/registry';
import TrainingButton from './TrainingButton';
import logger from '../../../../../lib/utils/logger';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class Step4ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our logging system
    logger.error('STEP4_ERROR_BOUNDARY', 'Component error caught', {
      error: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1
    });

    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // If error happens multiple times, it might be a persistent issue
    if (this.state.errorCount >= 2) {
      logger.error('STEP4_ERROR_BOUNDARY', 'Multiple errors detected - persistent issue', {
        errorCount: this.state.errorCount + 1
      });
    }
  }

  handleReset = () => {
    logger.info('STEP4_ERROR_BOUNDARY', 'User triggered error reset');

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call parent reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoBack = () => {
    logger.info('STEP4_ERROR_BOUNDARY', 'User navigating back from error');
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      const stepColor = STEP_COLORS.adapter;
      const error = this.state.error;
      const isDataError = error?.message?.includes('Cannot read') ||
                          error?.message?.includes('undefined') ||
                          error?.message?.includes('null');

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <GlassCard
            className="max-w-2xl w-full p-8"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, color-mix(in srgb, #EF4444 10%, transparent) 0%, transparent 60%),
                rgba(255, 255, 255, 0.08)
              `,
              border: '2px solid color-mix(in srgb, #EF4444 25%, transparent)',
              boxShadow: `
                0 4px 16px rgba(0, 0, 0, 0.2),
                0 0 24px color-mix(in srgb, #EF4444 15%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `
            }}
          >
            {/* Error Icon */}
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, #EF4444 40%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.15)
                `,
                border: '2px solid color-mix(in srgb, #EF4444 50%, transparent)',
                boxShadow: '0 4px 16px color-mix(in srgb, #EF4444 30%, transparent)'
              }}
            >
              <SpatialIcon
                Icon={ICONS.AlertTriangle}
                size={32}
                style={{ color: '#EF4444' }}
              />
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-white mb-3 text-center">
              {isDataError ? 'Données de séance invalides' : 'Erreur d\'affichage'}
            </h2>

            {/* Error Description */}
            <div className="text-center mb-6">
              <p className="text-white/70 mb-3">
                {isDataError
                  ? 'Les données de ta séance semblent incomplètes ou corrompues. Cela peut arriver si la séance n\'a pas été correctement enregistrée.'
                  : 'Une erreur inattendue s\'est produite lors de l\'affichage de ton analyse.'
                }
              </p>
              <p className="text-white/60 text-sm">
                Tes données sont sauvegardées et aucune information n'a été perdue.
              </p>
            </div>

            {/* Error Details (collapsible) */}
            {this.state.errorCount >= 2 && (
              <div
                className="mb-6 p-4 rounded-lg text-left"
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="text-xs text-white/50 mb-2 font-mono">
                  Détails techniques (erreur persistante):
                </div>
                <div className="text-xs text-white/70 font-mono overflow-x-auto">
                  {error?.message}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {this.state.errorCount < 3 && (
                <TrainingButton
                  variant="primary"
                  size="lg"
                  icon="RotateCw"
                  onClick={this.handleReset}
                  fullWidth
                  stepColor="#EF4444"
                >
                  Réessayer
                </TrainingButton>
              )}

              <TrainingButton
                variant="secondary"
                size="lg"
                icon="ArrowLeft"
                onClick={this.handleGoBack}
                fullWidth
              >
                Retour à la séance
              </TrainingButton>

              {isDataError && (
                <div className="text-center">
                  <p className="text-white/50 text-xs mt-4">
                    Si le problème persiste, contacte le support avec le code: STEP4_DATA_ERROR_{this.state.errorCount}
                  </p>
                </div>
              )}
            </div>

            {/* Helpful Tips */}
            <div
              className="mt-6 p-4 rounded-lg"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              <div className="flex items-start gap-3">
                <SpatialIcon Icon={ICONS.Info} size={20} style={{ color: '#3B82F6', marginTop: '2px' }} />
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Que faire ?</h4>
                  <ul className="text-white/70 text-xs space-y-1">
                    <li>• Retourne à la séance et vérifie que tous les exercices sont complétés</li>
                    <li>• Assure-toi d'avoir entré une durée valide</li>
                    <li>• Si tu as quitté la séance en cours, recommence une nouvelle séance</li>
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Step4ErrorBoundary;
