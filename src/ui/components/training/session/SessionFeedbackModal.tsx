/**
 * SessionFeedbackModal Component
 * Universal modal for collecting user feedback after training sessions
 * Supports both text input and voice recording with transcription
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import TrainingButton from '../../../../app/pages/Training/Pipeline/components/TrainingButton';
import { voiceFeedbackTranscriptionService } from '../../../../system/services/voiceFeedbackTranscriptionService';
import { Haptics } from '../../../../utils/haptics';
import logger from '../../../../lib/utils/logger';

interface SessionFeedbackModalProps {
  sessionId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackText: string) => void;
  stepColor: string;
}

type InputMode = 'text' | 'voice';
type RecordingState = 'idle' | 'recording' | 'processing';

const SessionFeedbackModal: React.FC<SessionFeedbackModalProps> = ({
  sessionId,
  userId,
  isOpen,
  onClose,
  onSubmit,
  stepColor,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [feedbackText, setFeedbackText] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        const duration = voiceFeedbackTranscriptionService.getRecordingDuration();
        setRecordingDuration(duration);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingState === 'recording') {
        voiceFeedbackTranscriptionService.cancelRecording();
      }
      voiceFeedbackTranscriptionService.cleanup();
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      setRecordingError(null);
      setRecordingDuration(0);

      logger.info('FEEDBACK_MODAL', 'Starting voice recording', { sessionId });

      await voiceFeedbackTranscriptionService.startRecording();
      setRecordingState('recording');
      Haptics.impact('medium');

      logger.info('FEEDBACK_MODAL', 'Voice recording started successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'enregistrement';
      const suggestion = (error as any)?.suggestion || 'Veuillez réessayer';

      logger.error('FEEDBACK_MODAL', 'Failed to start recording', {
        error: errorMessage,
        retryCount,
      });

      setRecordingError(`${errorMessage}. ${suggestion}`);
      setRecordingState('idle');
      Haptics.error();

      // Auto-retry if not exceeded max retries
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleStartRecording();
        }, 1000);
      }
    }
  };

  const handleStopRecording = async () => {
    try {
      logger.info('FEEDBACK_MODAL', 'Stopping voice recording', {
        sessionId,
        duration: recordingDuration
      });

      setRecordingState('processing');
      Haptics.impact('light');

      const audioBlob = await voiceFeedbackTranscriptionService.stopRecording();

      logger.info('FEEDBACK_MODAL', 'Transcribing audio', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
      });

      const result = await voiceFeedbackTranscriptionService.transcribeAudio(audioBlob);

      logger.info('FEEDBACK_MODAL', 'Transcription completed', {
        textLength: result.text.length,
        language: result.language,
        duration: result.duration,
      });

      setFeedbackText(result.text);
      setRecordingState('idle');
      setInputMode('text'); // Switch to text mode to show transcription
      Haptics.success();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de transcription';

      logger.error('FEEDBACK_MODAL', 'Failed to process recording', {
        error: errorMessage,
        retryCount,
      });

      setRecordingError(errorMessage);
      setRecordingState('idle');
      Haptics.error();

      // Auto-retry if not exceeded max retries
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleStartRecording();
        }, 1000);
      }
    }
  };

  const handleCancelRecording = () => {
    logger.info('FEEDBACK_MODAL', 'Cancelling voice recording');
    voiceFeedbackTranscriptionService.cancelRecording();
    setRecordingState('idle');
    setRecordingDuration(0);
    Haptics.tap();
  };

  const handleSubmit = () => {
    const trimmedText = feedbackText.trim();

    if (trimmedText.length === 0) {
      logger.warn('FEEDBACK_MODAL', 'Attempted to submit empty feedback');
      Haptics.warning();
      return;
    }

    logger.info('FEEDBACK_MODAL', 'Submitting feedback', {
      sessionId,
      textLength: trimmedText.length,
      mode: inputMode,
    });

    onSubmit(trimmedText);
    Haptics.success();
  };

  const handleSkip = () => {
    logger.info('FEEDBACK_MODAL', 'Skipping feedback', { sessionId });
    onClose();
    Haptics.tap();
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && recordingState === 'idle') {
          handleSkip();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard
          className="p-8 space-y-6"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
              rgba(20, 20, 20, 0.95)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 30%, transparent)`,
            boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.6),
              0 0 40px color-mix(in srgb, ${stepColor} 20%, transparent)
            `,
          }}
        >
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `color-mix(in srgb, ${stepColor} 20%, transparent)`,
                  border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                  boxShadow: `0 0 30px color-mix(in srgb, ${stepColor} 30%, transparent)`,
                }}
              >
                <SpatialIcon
                  Icon={ICONS.MessageSquare}
                  size={32}
                  style={{ color: stepColor }}
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Comment s'est passée votre séance ?
            </h2>
            <p className="text-white/60 text-sm">
              Partagez vos impressions pour améliorer vos prochaines séances
            </p>
          </div>

          {/* Input Mode Toggle */}
          <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mt-4 mb-4">
            <button
              onClick={() => setInputMode('text')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                inputMode === 'text'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-white/60 hover:text-white/80'
              }`}
              disabled={recordingState !== 'idle'}
            >
              <div className="flex items-center justify-center gap-2">
                <SpatialIcon Icon={ICONS.Type} size={18} />
                <span>Texte</span>
              </div>
            </button>
            <button
              onClick={() => setInputMode('voice')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                inputMode === 'voice'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-white/60 hover:text-white/80'
              }`}
              disabled={recordingState !== 'idle'}
            >
              <div className="flex items-center justify-center gap-2">
                <SpatialIcon Icon={ICONS.Mic} size={18} />
                <span>Vocal</span>
              </div>
            </button>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {recordingError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/30"
              >
                <p className="text-red-400 text-sm font-medium">{recordingError}</p>
                {retryCount < maxRetries && (
                  <p className="text-red-300/60 text-xs mt-1">
                    Nouvelle tentative automatique... ({retryCount + 1}/{maxRetries})
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Input Mode */}
          {inputMode === 'text' && (
            <div className="space-y-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Ex: La séance était intense mais j'ai adoré les derniers intervalles..."
                className="w-full h-32 px-4 py-3 rounded-xl text-white placeholder-white/40 bg-white/5 border border-white/15 focus:border-white/30 focus:outline-none resize-none"
                style={{
                  fontFamily: 'inherit',
                }}
                autoFocus
              />
              <p className="text-white/40 text-xs">
                {feedbackText.length} caractères
              </p>
            </div>
          )}

          {/* Voice Input Mode */}
          {inputMode === 'voice' && (
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {recordingState === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-4"
                  >
                    <TrainingButton
                      variant="primary"
                      size="lg"
                      icon="Mic"
                      onClick={handleStartRecording}
                      fullWidth
                      stepColor={stepColor}
                    >
                      Commencer l'enregistrement
                    </TrainingButton>
                    <p className="text-white/40 text-xs">
                      Appuyez pour commencer à parler
                    </p>
                  </motion.div>
                )}

                {recordingState === 'recording' && (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center space-y-4"
                  >
                    {/* Recording Indicator */}
                    <div className="flex justify-center">
                      <motion.div
                        className="relative"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center"
                          style={{
                            background: `
                              radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%),
                              rgba(239, 68, 68, 0.15)
                            `,
                            border: '3px solid #EF4444',
                            boxShadow: '0 0 40px rgba(239, 68, 68, 0.6)',
                          }}
                        >
                          <SpatialIcon
                            Icon={ICONS.Mic}
                            size={40}
                            style={{ color: '#EF4444' }}
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Recording Duration */}
                    <div>
                      <p className="text-4xl font-bold text-white mb-1">
                        {formatRecordingTime(recordingDuration)}
                      </p>
                      <p className="text-white/60 text-sm">Enregistrement en cours...</p>
                    </div>

                    {/* Stop/Cancel Buttons */}
                    <div className="flex gap-3">
                      <TrainingButton
                        variant="secondary"
                        size="lg"
                        icon="X"
                        onClick={handleCancelRecording}
                      >
                        Annuler
                      </TrainingButton>
                      <TrainingButton
                        variant="primary"
                        size="lg"
                        icon="Check"
                        iconPosition="right"
                        onClick={handleStopRecording}
                        fullWidth
                        stepColor="#EF4444"
                      >
                        Terminer
                      </TrainingButton>
                    </div>
                  </motion.div>
                )}

                {recordingState === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-4 py-8"
                  >
                    <motion.div
                      className="w-16 h-16 mx-auto"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <SpatialIcon
                        Icon={ICONS.Loader}
                        size={64}
                        style={{ color: stepColor }}
                      />
                    </motion.div>
                    <p className="text-white font-medium">Transcription en cours...</p>
                    <p className="text-white/60 text-sm">
                      Conversion de votre enregistrement en texte
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <TrainingButton
              variant="secondary"
              size="lg"
              onClick={handleSkip}
              disabled={recordingState !== 'idle'}
            >
              Passer
            </TrainingButton>
            <TrainingButton
              variant="primary"
              size="lg"
              icon="Check"
              iconPosition="right"
              onClick={handleSubmit}
              fullWidth
              disabled={feedbackText.trim().length === 0 || recordingState !== 'idle'}
              stepColor={stepColor}
            >
              Valider
            </TrainingButton>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default SessionFeedbackModal;
