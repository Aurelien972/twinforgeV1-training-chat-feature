/**
 * Training Coach Notification Bubble
 * Notification spécialisée pour le coaching dans les steps de training
 * Design VisionOS 26 glassmorphism aligné avec ChatNotificationBubble
 * Positionnement au-dessus de la bottom bar (mobile/tablet) ou à gauche du chat button (desktop)
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrainingCoachStore } from '../../../system/store/trainingCoachStore';
import { trainingCoachNotificationService } from '../../../system/services/trainingCoachNotificationService';
import { Haptics } from '../../../utils/haptics';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import '../../../styles/components/training-coach-notification.css';

const NOTIFICATION_TYPE_ICONS: Record<string, keyof typeof ICONS> = {
  motivation: 'Flame',
  instruction: 'Info',
  tip: 'MessageSquare',
  feedback: 'MessageSquare',
  warning: 'AlertTriangle',
  success: 'CheckCircle'
};

interface TrainingCoachNotificationBubbleProps {
  chatButtonRef?: React.RefObject<HTMLButtonElement>;
  isStep1?: boolean; // Deprecated - no longer used
  hidden?: boolean;
}

const TrainingCoachNotificationBubble: React.FC<TrainingCoachNotificationBubbleProps> = ({ chatButtonRef, isStep1 = false, hidden = false }) => {
  const { currentNotification, hideNotification } = useTrainingCoachStore();
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1025 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1025);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentNotification?.isVisible) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      const isNotificationClick = notificationRef.current?.contains(target);
      const isChatButtonClick = chatButtonRef?.current?.contains(target);

      if (!isNotificationClick && !isChatButtonClick) {
        hideNotification();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [currentNotification?.isVisible, hideNotification, chatButtonRef]);

  const handleClick = () => {
    if (currentNotification) {
      trainingCoachNotificationService.trackNotificationClick(currentNotification.id);
      Haptics.tap();
      hideNotification();
    }
  };

  const getNotificationColor = () => {
    if (currentNotification?.color) {
      return currentNotification.color;
    }

    switch (currentNotification?.type) {
      case 'motivation':
        return '#FF6B35';
      case 'instruction':
        return '#3B82F6';
      case 'tip':
        return '#10B981';
      case 'feedback':
        return '#8B5CF6';
      case 'warning':
        return '#F59E0B';
      case 'success':
        return '#22C55E';
      default:
        return '#18E3FF';
    }
  };

  const getIcon = () => {
    if (!currentNotification) return 'MessageSquare';
    const iconName = NOTIFICATION_TYPE_ICONS[currentNotification.type];
    return iconName || 'MessageSquare';
  };

  const [positionStyles, setPositionStyles] = useState<React.CSSProperties>({ position: 'fixed' });

  useEffect(() => {
    if (!isDesktop || !currentNotification?.isVisible) return;

    const updatePosition = () => {
      if (chatButtonRef?.current && notificationRef?.current) {
        const buttonRect = chatButtonRef.current.getBoundingClientRect();
        const notificationRect = notificationRef.current.getBoundingClientRect();
        const notificationWidth = 320;
        const gap = 16;

        const buttonWidth = buttonRect.width;
        const buttonHeight = buttonRect.height;
        const notificationHeight = notificationRect.height || 56;

        const right = window.innerWidth - buttonRect.left + gap;
        const buttonCenterY = buttonRect.top + (buttonHeight / 2);
        // Ajout de 2px pour un alignement horizontal parfait
        const notificationTop = buttonCenterY - (notificationHeight / 2) + 2;

        setPositionStyles({
          position: 'fixed',
          right: `${right}px`,
          top: `${notificationTop}px`,
          transform: 'none',
          width: `${notificationWidth}px`,
          maxWidth: `${notificationWidth}px`
        });
      } else {
        setPositionStyles({
          position: 'fixed',
          bottom: '24px',
          right: '108px',
          transform: 'none',
          width: '320px',
          maxWidth: '320px'
        });
      }
    };

    setTimeout(updatePosition, 0);

    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isDesktop, currentNotification?.isVisible, chatButtonRef]);

  useEffect(() => {
    if (!isDesktop) {
      setPositionStyles({ position: 'fixed' });
    }
  }, [isDesktop]);

  return (
    <AnimatePresence>
      {currentNotification?.isVisible && !hidden && (
        <motion.div
          ref={notificationRef}
          className={`training-coach-notification-bubble ${isDesktop ? 'training-coach-notification-bubble--desktop' : 'training-coach-notification-bubble--mobile'}`}
          style={{
            ...positionStyles,
            '--notification-color': getNotificationColor()
          } as React.CSSProperties}
          initial={isDesktop ? {
            x: -40,
            opacity: 0,
            scale: 0.85
          } : {
            y: 40,
            opacity: 0,
            scale: 0.95
          }}
          animate={isDesktop ? {
            x: 0,
            opacity: 1,
            scale: 1
          } : {
            y: 0,
            opacity: 1,
            scale: 1
          }}
          exit={isDesktop ? {
            x: -40,
            opacity: 0,
            scale: 0.85
          } : {
            y: 40,
            opacity: 0,
            scale: 0.95
          }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 28,
            mass: 0.8
          }}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label={currentNotification.message}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <div className="training-coach-notification-bubble__message">
            <div className="training-coach-notification-bubble__icon">
              <SpatialIcon
                Icon={ICONS[getIcon()]}
                size={isDesktop ? 16 : 18}
                style={{
                  color: getNotificationColor(),
                  filter: `drop-shadow(0 0 8px ${getNotificationColor()}60)`
                }}
              />
            </div>
            <span>{currentNotification.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrainingCoachNotificationBubble;
