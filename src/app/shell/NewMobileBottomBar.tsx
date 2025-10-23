import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../ui/icons/SpatialIcon';
import { ICONS } from '../../ui/icons/registry';
import { useFeedback } from '../../hooks/useFeedback';
import { bottomBarClick, centralButtonClick } from '../../audio/effects/forgeronSounds';
import { useOverlayStore } from '../../system/store/overlayStore';
import { Haptics } from '../../utils/haptics';
import CentralActionsMenu from './CentralActionsMenu';
import { usePerformanceMode } from '../../system/context/PerformanceModeContext';

/**
 * Configuration des boutons de la nouvelle barre inférieure
 * 6 boutons : Repas - Frigo - Activité - Jeûne - Coaching - Twin
 * Le bouton éclair (Outils du Forgeron) est maintenant dans le header
 */
const BOTTOM_BAR_BUTTONS = [
  {
    id: 'meal-scan',
    label: 'Repas',
    icon: 'Utensils' as const,
    route: '/meals',
    color: '#10B981', // Vert nutrition
  },
  {
    id: 'fridge-scan',
    label: 'Frigo',
    icon: 'Refrigerator' as const,
    route: '/fridge',
    color: '#EC4899', // Rose
  },
  {
    id: 'activity',
    label: 'Activité',
    icon: 'Activity' as const,
    route: '/activity',
    color: '#3B82F6', // Bleu activité
  },
  {
    id: 'fasting',
    label: 'Jeûne',
    icon: 'Timer' as const,
    route: '/fasting',
    color: '#F59E0B', // Orange jeûne
  },
  {
    id: 'training',
    label: 'Coaching',
    icon: 'Dumbbell' as const,
    route: '/training',
    color: '#06B6D4', // Cyan
  },
  {
    id: 'twin',
    label: 'Twin',
    icon: 'User' as const,
    route: '/avatar',
    color: '#8B5CF6', // Violet
  },
];

/**
 * Bouton de barre mobile
 */
function BarButton({
  button,
  active,
  onClick,
  hasUnread,
  unreadCount,
}: {
  button: typeof BOTTOM_BAR_BUTTONS[0];
  active: boolean;
  onClick: () => void;
  hasUnread?: boolean;
  unreadCount?: number;
}) {
  const handleClick = () => {
    bottomBarClick(button.color, active);
    onClick();
  };

  const iconSize = 20;

  return (
    <motion.button
      onClick={handleClick}
      className="new-bottom-bar-button"
      style={{
        '--button-color': button.color,
        '--button-active': active ? '1' : '0'
      } as React.CSSProperties}
      aria-current={active ? 'page' : undefined}
      aria-label={`Aller à ${button.label}`}
    >
      <div className={`new-bottom-bar-icon-container ${active ? 'new-bottom-bar-icon-container--active' : ''}`}>
        <SpatialIcon
          Icon={ICONS[button.icon]}
          size={iconSize}
          style={{
            color: active ? button.color : 'rgba(255, 255, 255, 0.5)'
          }}
        />
      </div>
      <div className={`new-bottom-bar-label ${active ? 'new-bottom-bar-label--active' : ''}`}>
        {button.label}
      </div>
    </motion.button>
  );
}

/**
 * New Mobile Bottom Bar - Barre de navigation inférieure redesignée
 * 6 boutons : Repas - Frigo - Activité - Jeûne - Coaching - Twin
 * Le bouton éclair (Outils du Forgeron) a été déplacé dans le header
 */
const NewMobileBottomBar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { close } = useOverlayStore();
  const { isPerformanceMode } = usePerformanceMode();

  const handleButtonClick = (button: typeof BOTTOM_BAR_BUTTONS[0]) => {
    if (button.route) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      setTimeout(() => {
        navigate(button.route);
        close();
      }, 100);
    }
  };

  const isButtonActive = (button: typeof BOTTOM_BAR_BUTTONS[0]) => {
    return button.route ? pathname.startsWith(button.route) : false;
  };

  return (
    <>
      <nav
        className="new-mobile-bottom-bar"
        aria-label="Navigation principale mobile"
        style={{
          position: 'fixed',
          bottom: 'var(--new-bottom-bar-bottom-offset)',
          left: '8px',
          right: '8px',
          zIndex: 9996,
          background: isPerformanceMode
            ? 'rgba(11, 14, 23, 0.95)'
            : undefined,
          backdropFilter: isPerformanceMode ? 'blur(10px)' : undefined,
          WebkitBackdropFilter: isPerformanceMode ? 'blur(10px)' : undefined,
          border: isPerformanceMode ? '1px solid rgba(255, 255, 255, 0.1)' : undefined,
          borderRadius: '20px',
        }}
      >
        <div className="new-mobile-bottom-bar-container">
          <div className="new-mobile-bottom-bar-buttons">
            {BOTTOM_BAR_BUTTONS.map((button) => (
              <BarButton
                key={button.id}
                button={button}
                active={isButtonActive(button)}
                onClick={() => handleButtonClick(button)}
              />
            ))}
          </div>
        </div>
      </nav>

    </>
  );
};

export default NewMobileBottomBar;