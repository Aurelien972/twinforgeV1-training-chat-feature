/**
 * Chat Notification Bubble
 * Banner de notification en pleine largeur au-dessus de la bottom bar
 * Design VisionOS 26 glassmorphism avec animations fluides
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalChatStore } from '../../../system/store/globalChatStore';
import { useFeedback } from '../../../hooks/useFeedback';
import { Haptics } from '../../../utils/haptics';
import { unifiedNotificationService, type NotificationId } from '../../../system/services/unifiedNotificationService';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import '../../../styles/components/chat/chat-notification-bubble.css';

interface ChatNotificationBubbleProps {
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

const ChatNotificationBubble: React.FC<ChatNotificationBubbleProps> = ({ buttonRef }) => {
  const { currentNotification, open, hideNotification } = useGlobalChatStore();
  const { click } = useFeedback();
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    click();
    Haptics.press();

    if (currentNotification) {
      unifiedNotificationService.hideNotification(currentNotification.id as NotificationId);
    }

    open(currentNotification?.mode);
  };

  useEffect(() => {
    if (!currentNotification?.isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const isNotificationClick = notificationRef.current?.contains(target);
      const isButtonClick = buttonRef?.current?.contains(target);

      if (!isNotificationClick && !isButtonClick && currentNotification) {
        unifiedNotificationService.hideNotification(currentNotification.id as NotificationId);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as any);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [currentNotification?.isVisible, hideNotification]);

  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1025 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1025);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [positionStyles, setPositionStyles] = useState<React.CSSProperties>({ position: 'fixed' });

  useEffect(() => {
    if (!isDesktop || !currentNotification?.isVisible) return;

    const updatePosition = () => {
      if (buttonRef?.current && notificationRef?.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const notificationRect = notificationRef.current.getBoundingClientRect();
        const notificationWidth = 320;
        const gap = 8; // Espacement de 8px entre la bulle et le bouton

        // Obtenir les vraies positions du bouton
        const buttonWidth = buttonRect.width;
        const buttonHeight = buttonRect.height;
        const notificationHeight = notificationRect.height || 56;

        // Position horizontale : à gauche du bouton avec gap de 8px
        // Le bouton est à right: 24px de l'écran
        const right = window.innerWidth - buttonRect.left + gap;

        // Position verticale : ALIGNÉE HORIZONTALEMENT avec le bouton
        // Le centre du bouton en coordonnées de fenêtre
        const buttonCenterY = buttonRect.top + (buttonHeight / 2);

        // La notification doit avoir son centre au même Y que le bouton
        // On calcule le top de la notification pour que son centre soit à buttonCenterY
        const notificationTop = buttonCenterY - (notificationHeight / 2);

        setPositionStyles({
          position: 'fixed',
          right: `${right}px`,
          top: `${notificationTop}px`,
          transform: 'none',
          width: `${notificationWidth}px`,
          maxWidth: `${notificationWidth}px`
        });
      } else {
        // Fallback si le bouton n'est pas trouvé
        setPositionStyles({
          position: 'fixed',
          bottom: '24px',
          right: '92px', // 60px (largeur bouton) + 8px (gap) + 24px (marge droite)
          transform: 'none',
          width: '320px',
          maxWidth: '320px'
        });
      }
    };

    // Petit délai pour s'assurer que la notification est rendue et a une hauteur
    setTimeout(updatePosition, 0);

    // Recalculer sur resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isDesktop, currentNotification?.isVisible, buttonRef]);

  useEffect(() => {
    if (!isDesktop) {
      setPositionStyles({ position: 'fixed' });
    }
  }, [isDesktop]);

  return (
    <AnimatePresence>
      {currentNotification?.isVisible && (
        <motion.div
          ref={notificationRef}
          className={`chat-notification-bubble ${isDesktop ? 'chat-notification-bubble--desktop' : 'chat-notification-bubble--mobile'}`}
          style={positionStyles}
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
          <div className="chat-notification-bubble__message">
            <div className="chat-notification-bubble__icon">
              <SpatialIcon
                Icon={ICONS.MessageSquare}
                size={isDesktop ? 16 : 18}
                style={{
                  color: '#18E3FF',
                  filter: 'drop-shadow(0 0 8px rgba(24, 227, 255, 0.4))'
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

export default ChatNotificationBubble;
