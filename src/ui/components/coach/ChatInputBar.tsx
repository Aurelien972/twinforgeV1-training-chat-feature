/**
 * Chat Input Bar
 * Sticky input for text and voice messaging with coach
 * Supports 3 modes: text, voice-to-text, and realtime
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import { useFeedback } from '../../../hooks/useFeedback';
import { Haptics } from '../../../utils/haptics';
import { openaiWhisperService } from '../../../system/services/openaiWhisperService';
import { useUnifiedCoachStore } from '../../../system/store/unifiedCoachStore';
import { useUserStore } from '../../../system/store/userStore';
import CentralInputZone from '../../components/chat/CentralInputZone';
import logger from '../../../lib/utils/logger';

type InputMode = 'text' | 'voice-to-text' | 'realtime';

interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  onStartVoiceRecording: () => void;
  onStopVoiceRecording: () => void;
  onStartRealtimeSession: () => Promise<void>;
  onStopRealtimeSession: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  realtimeState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';
  realtimeError?: string;
  voiceEnabled: boolean;
  stepColor: string;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onStartRealtimeSession,
  onStopRealtimeSession,
  isRecording,
  isProcessing,
  isSpeaking,
  realtimeState,
  realtimeError,
  voiceEnabled,
  stepColor,
  placeholder = 'Parle à ton coach...',
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | undefined>(undefined);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { click } = useFeedback();

  // Store state
  const setInputMode = useUnifiedCoachStore(state => state.setInputMode);

  // Déterminer le mode actif automatiquement
  const [currentInputMode, setCurrentInputMode] = useState<InputMode>('text');

  // Gérer le changement de mode automatique
  useEffect(() => {
    let newMode: InputMode = 'text';

    if (isRecording || isTranscribing) {
      newMode = 'voice-to-text';
    } else if (realtimeState !== 'idle' && realtimeState !== 'error') {
      newMode = 'realtime';
    }

    setCurrentInputMode(newMode);
    setInputMode(newMode); // Sync with store

    logger.debug('CHAT_INPUT_BAR', 'Input mode changed', {
      mode: newMode,
      isRecording,
      isTranscribing,
      realtimeState
    });
  }, [isRecording, isTranscribing, realtimeState, setInputMode]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      click();
      Haptics.tap();
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceToggle = async () => {
    click();
    Haptics.press();

    // Get user ID from store
    const { session } = useUserStore.getState();
    const userId = session?.user?.id;

    if (!userId) {
      logger.error('CHAT_INPUT_BAR', 'User not authenticated for voice transcription');
      setTranscriptionError('Utilisateur non authentifié');
      return;
    }

    if (isRecording) {
      // Arrêter l'enregistrement et transcrire
      logger.info('CHAT_INPUT_BAR', 'Stopping voice recording and starting transcription');
      onStopVoiceRecording();

      try {
        setTranscriptionError(undefined);
        setTranscribedText('');

        const audioBlob = await openaiWhisperService.stopRecording();
        logger.info('CHAT_INPUT_BAR', 'Audio blob captured', { size: audioBlob.size });

        setIsTranscribing(true);
        const result = await openaiWhisperService.transcribe(audioBlob, userId);
        setIsTranscribing(false);

        logger.info('CHAT_INPUT_BAR', 'Transcription completed', {
          textLength: result.text.length,
          text: result.text
        });

        // Afficher le texte transcrit
        if (result.text.trim()) {
          setTranscribedText(result.text.trim());
          // Envoyer automatiquement après un court délai pour que l'utilisateur puisse voir
          setTimeout(() => {
            onSendMessage(result.text.trim());
            setTranscribedText('');
            Haptics.impact();
            // IMPORTANT: Retour automatique au mode text après envoi
            logger.info('CHAT_INPUT_BAR', 'Returning to text mode after voice-to-text message sent');
          }, 500);
        } else {
          setTranscriptionError('Aucun texte détecté dans l\'enregistrement');
          // Retour au mode text même en cas d'erreur
          logger.info('CHAT_INPUT_BAR', 'Returning to text mode after transcription error');
        }
      } catch (error) {
        setIsTranscribing(false);
        const errorMessage = error instanceof Error ? error.message : 'Erreur de transcription';
        setTranscriptionError(errorMessage);
        logger.error('CHAT_INPUT_BAR', 'Transcription error', { error: errorMessage });
        // Retour au mode text en cas d'erreur
        logger.info('CHAT_INPUT_BAR', 'Returning to text mode after transcription exception');
      }
    } else {
      // Démarrer l'enregistrement
      logger.info('CHAT_INPUT_BAR', 'Starting voice recording');
      try {
        setTranscriptionError(undefined);
        setTranscribedText('');
        await openaiWhisperService.startRecording();
        onStartVoiceRecording();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur microphone';
        setTranscriptionError(errorMessage);
        logger.error('CHAT_INPUT_BAR', 'Recording start error', { error: errorMessage });
      }
    }
  };

  const handleRealtimeToggle = async () => {
    click();
    Haptics.press();

    if (realtimeState === 'idle' || realtimeState === 'error') {
      await onStartRealtimeSession();
    } else {
      onStopRealtimeSession();
    }
  };

  const isRealtimeActive = realtimeState !== 'idle' && realtimeState !== 'error';

  // Déterminer si on doit masquer l'interface de chat normale
  // Quand realtime ou voice-to-text est actif, on affiche UNIQUEMENT le CentralInputZone
  const shouldHideNormalChat = isRealtimeActive || isRecording || isTranscribing;

  return (
    <div
      className="chat-input-bar-container"
      style={{
        position: 'relative',
        width: '100%',
        zIndex: 1,
        pointerEvents: disabled ? 'none' : 'auto',
        opacity: disabled ? 0.6 : 1,
        margin: '0',
        padding: '0'
      }}
    >
      {/* Error Banners */}
      <AnimatePresence>
        {realtimeError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '8px 16px',
              marginBottom: '8px',
              borderRadius: '12px',
              background: 'linear-gradient(180deg, rgba(220, 38, 38, 0.2) 0%, rgba(153, 27, 27, 0.15) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SpatialIcon Icon={ICONS.AlertTriangle} size={14} style={{ color: '#EF4444' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
                {realtimeError}
              </span>
            </div>
          </motion.div>
        )}
        {transcriptionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '8px 16px',
              marginBottom: '8px',
              borderRadius: '12px',
              background: 'linear-gradient(180deg, rgba(220, 38, 38, 0.2) 0%, rgba(153, 27, 27, 0.15) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SpatialIcon Icon={ICONS.AlertTriangle} size={14} style={{ color: '#EF4444' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
                {transcriptionError}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Realtime Status Bar */}
      <AnimatePresence>
        {realtimeState === 'connecting' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '6px 16px',
              marginBottom: '8px',
              borderRadius: '12px',
              background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid #EF4444',
                borderTopColor: 'transparent',
                borderRadius: '50%'
              }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
              Connexion au coach vocal...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Status Bars */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '6px 16px',
              marginBottom: '8px',
              borderRadius: '12px',
              background: `
                linear-gradient(180deg,
                  rgba(11, 14, 23, 0.8) 0%,
                  rgba(11, 14, 23, 0.6) 100%
                )
              `,
              backdropFilter: 'blur(16px)',
              border: `1px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '12px',
                height: '12px',
                border: `2px solid ${stepColor}`,
                borderTopColor: 'transparent',
                borderRadius: '50%'
              }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Traitement en cours...
            </span>
          </motion.div>
        )}
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '6px 16px',
              marginBottom: '8px',
              borderRadius: '12px',
              background: `
                linear-gradient(180deg,
                  rgba(11, 14, 23, 0.8) 0%,
                  rgba(11, 14, 23, 0.6) 100%
                )
              `,
              backdropFilter: 'blur(16px)',
              border: `1px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '12px',
                height: '12px',
                border: `2px solid ${stepColor}`,
                borderTopColor: 'transparent',
                borderRadius: '50%'
              }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Transcription en cours...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {/* Mode VOICE-TO-TEXT ou REALTIME: afficher UNIQUEMENT CentralInputZone */}
        {shouldHideNormalChat ? (
          <motion.div
            key="voice-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="chat-input-bar"
            style={{
              background: `
                radial-gradient(ellipse at 50% 100%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 60%),
                var(--liquid-reflections-multi),
                var(--liquid-highlight-ambient),
                var(--liquid-glass-bg-elevated)
              `,
              backdropFilter: 'blur(var(--liquid-bottombar-blur)) saturate(var(--liquid-bottombar-saturate))',
              WebkitBackdropFilter: 'blur(var(--liquid-bottombar-blur)) saturate(var(--liquid-bottombar-saturate))',
              border: `1.5px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
              boxShadow: `
                0 4px 24px rgba(0, 0, 0, 0.25),
                0 0 32px color-mix(in srgb, ${stepColor} 20%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
              `,
              borderRadius: '18px',
              padding: '0',
              minHeight: '240px',
              transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
              overflow: 'hidden'
            }}
          >
            <CentralInputZone
              mode={currentInputMode}
              message={message}
              onMessageChange={setMessage}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              isFocused={isFocused}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              textareaRef={inputRef}
              disabled={disabled}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              onStopRecording={handleVoiceToggle}
              transcribedText={transcribedText}
              voiceState={realtimeState}
              onStopRealtime={handleRealtimeToggle}
              stepColor={stepColor}
            />
          </motion.div>
        ) : (
          /* Mode TEXT: afficher les contrôles classiques */
          <motion.div
            key="text-mode"
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.8, scale: 0.98 }}
            transition={{
              duration: 0.2,
              ease: 'easeInOut'
            }}
            className={`chat-input-bar ${isFocused ? 'chat-input-bar--focused' : ''}`}
            style={{
              background: `
                radial-gradient(ellipse at 50% 100%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 60%),
                var(--liquid-reflections-multi),
                var(--liquid-highlight-ambient),
                var(--liquid-glass-bg-base)
              `,
              backdropFilter: 'blur(var(--liquid-bottombar-blur)) saturate(var(--liquid-bottombar-saturate))',
              WebkitBackdropFilter: 'blur(var(--liquid-bottombar-blur)) saturate(var(--liquid-bottombar-saturate))',
              border: isFocused
                ? `1.5px solid color-mix(in srgb, ${stepColor} 40%, transparent)`
                : '1.5px solid rgba(255, 255, 255, 0.15)',
              boxShadow: isFocused
                ? `
                    0 4px 24px rgba(0, 0, 0, 0.25),
                    0 0 32px color-mix(in srgb, ${stepColor} 20%, transparent),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15)
                  `
                : `
                    0 4px 20px rgba(0, 0, 0, 0.2),
                    0 0 24px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `,
              borderRadius: '18px',
              padding: '6px 8px',
              minHeight: 'auto',
              transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
              overflow: 'hidden',
              willChange: 'transform, opacity'
            }}
          >
            <div className="flex items-center gap-2">
          {/* Voice Button */}
          {voiceEnabled && (
            <motion.button
              onClick={handleVoiceToggle}
              className={`chat-input-button flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${isRecording ? 'chat-input-button--recording' : ''}`}
              style={{
                background: isRecording
                  ? `
                      radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 70%),
                      rgba(239, 68, 68, 0.15)
                    `
                  : `
                      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18) 0%, transparent 50%),
                      var(--liquid-pill-bg)
                    `,
                border: isRecording ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: isRecording
                  ? '0 0 20px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
                  : 'var(--liquid-pill-shadow)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={disabled || isProcessing}
            >
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="recording"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <SpatialIcon
                      Icon={ICONS.MicOff}
                      size={18}
                      style={{ color: '#EF4444' }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -180 }}
                  >
                    <SpatialIcon
                      Icon={ICONS.Mic}
                      size={18}
                      style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Animation de pulsation pendant l'enregistrement */}
              {isRecording && (
                <>
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: -4,
                      borderRadius: '50%',
                      border: '2px solid rgba(239, 68, 68, 0.6)',
                      pointerEvents: 'none'
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 0, 0.8]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: -8,
                      borderRadius: '50%',
                      border: '2px solid rgba(239, 68, 68, 0.4)',
                      pointerEvents: 'none'
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.3
                    }}
                  />
                </>
              )}
            </motion.button>
          )}

          {/* Text Input - Utiliser CentralInputZone */}
          <CentralInputZone
            mode="text"
            message={message}
            onMessageChange={setMessage}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            isFocused={isFocused}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            textareaRef={inputRef}
            disabled={disabled}
            isRecording={false}
            isTranscribing={false}
            onStopRecording={() => {}}
            transcribedText=""
            voiceState="idle"
            onStopRealtime={() => {}}
            stepColor={stepColor}
          />

          {/* Dynamic Button: Realtime when empty, Send when typing */}
          {voiceEnabled && !message.trim() ? (
            // Bouton Realtime rouge quand aucun texte
            <motion.button
              onClick={handleRealtimeToggle}
              className="chat-input-button flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center relative"
              style={{
                background: isRealtimeActive
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 38, 1) 100%)'
                  : `
                      radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 70%),
                      linear-gradient(135deg, rgba(239, 68, 68, 0.7), rgba(220, 38, 38, 0.8))
                    `,
                border: isRealtimeActive ? '3px solid rgba(255, 255, 255, 0.3)' : '2px solid rgba(239, 68, 68, 0.6)',
                boxShadow: isRealtimeActive
                  ? `
                      0 0 40px rgba(239, 68, 68, 0.8),
                      0 8px 24px rgba(0, 0, 0, 0.6),
                      inset 0 2px 0 rgba(255, 255, 255, 0.4)
                    `
                  : `
                      0 0 20px rgba(239, 68, 68, 0.4),
                      0 4px 12px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2)
                    `
              }}
              whileHover={{
                scale: 1.08,
                boxShadow: isRealtimeActive
                  ? `
                      0 0 50px rgba(239, 68, 68, 0.9),
                      0 10px 28px rgba(0, 0, 0, 0.7),
                      inset 0 2px 0 rgba(255, 255, 255, 0.5)
                    `
                  : `
                      0 0 35px rgba(239, 68, 68, 0.7),
                      0 8px 20px rgba(0, 0, 0, 0.5),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4)
                    `
              }}
              whileTap={{ scale: 0.92 }}
              disabled={disabled}
            >
              {/* Radio/Square Icon inside the RED CIRCLE - Realtime Indicator */}
              <AnimatePresence mode="wait">
                {isRealtimeActive ? (
                  <motion.div
                    key="stop-icon"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <SpatialIcon
                      Icon={ICONS.Square}
                      size={18}
                      style={{
                        color: 'rgba(255, 255, 255, 0.95)',
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))',
                        zIndex: 2,
                        position: 'relative'
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="radio-icon"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <SpatialIcon
                      Icon={ICONS.Radio}
                      size={18}
                      style={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))',
                        zIndex: 2,
                        position: 'relative'
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pulsating glow effect */}
              {isRealtimeActive && (
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.3)',
                    filter: 'blur(8px)',
                    zIndex: -1
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}

              {/* Connecting state - spinning border */}
              {realtimeState === 'connecting' && (
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: '#EF4444',
                    borderRightColor: '#EF4444',
                    pointerEvents: 'none'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              )}
            </motion.button>
          ) : (
            // Bouton Send quand l'utilisateur écrit
            <motion.button
              onClick={handleSubmit}
              disabled={!message.trim() || disabled || isProcessing}
              className={`chat-input-button flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${message.trim() && !disabled ? 'chat-input-button--send-enabled' : ''}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: message.trim()
                  ? `
                      radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 70%),
                      linear-gradient(135deg, color-mix(in srgb, ${stepColor} 30%, transparent), color-mix(in srgb, ${stepColor} 18%, transparent))
                    `
                  : 'rgba(255, 255, 255, 0.05)',
                border: message.trim()
                  ? `1.5px solid color-mix(in srgb, ${stepColor} 50%, transparent)`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: message.trim()
                  ? `0 0 16px color-mix(in srgb, ${stepColor} 25%, transparent), 0 4px 12px rgba(0, 0, 0, 0.2)`
                  : 'none',
                cursor: message.trim() && !disabled ? 'pointer' : 'not-allowed',
                opacity: message.trim() && !disabled ? 1 : 0.5
              }}
              whileHover={message.trim() && !disabled ? { scale: 1.05 } : undefined}
              whileTap={message.trim() && !disabled ? { scale: 0.95 } : undefined}
            >
              <SpatialIcon
                Icon={ICONS.Send}
                size={18}
                style={{
                  color: message.trim() ? stepColor : 'rgba(255, 255, 255, 0.4)',
                  filter: message.trim() ? `drop-shadow(0 0 8px color-mix(in srgb, ${stepColor} 40%, transparent))` : 'none'
                }}
              />
            </motion.button>
          )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInputBar;
