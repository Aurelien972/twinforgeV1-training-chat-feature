/**
 * Training Generation Loader - Optimized & Discipline-Aware
 * Loader enrichi pour la génération des trainings avec modules de progression
 * - Correction des conflits animation/animationDelay
 * - Design harmonisé entre contexte, conseils et modules
 * - Personnalisation par discipline
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../cards/GlassCard';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import { usePreferredMotion } from '../../../system/device/DeviceProvider';

interface TrainingGenerationLoaderProps {
  progress: number;
  locationName?: string;
  availableEquipment?: string[];
  discipline?: string;
  energyLevel?: number;
  availableTime?: number;
  disciplineColor?: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

interface ProcessingModule {
  icon: keyof typeof ICONS;
  label: string;
  sublabel: string;
  color: string;
  active: boolean;
}

interface DisciplineConfig {
  icon: keyof typeof ICONS;
  primaryColor: string;
  secondaryColor: string;
  name: string;
  modules: Array<{
    icon: keyof typeof ICONS;
    label: string;
    sublabel: string;
    color: string;
  }>;
  tips: Array<{
    icon: keyof typeof ICONS;
    title: string;
    description: string;
  }>;
}

const DISCIPLINE_CONFIGS: Record<string, DisciplineConfig> = {
  force: {
    icon: 'Dumbbell',
    primaryColor: '#10B981',
    secondaryColor: '#06B6D4',
    name: 'Force',
    modules: [
      {
        icon: 'Search',
        label: 'Analyse du Contexte',
        sublabel: 'Lieu, équipements, énergie',
        color: '#10B981'
      },
      {
        icon: 'Zap',
        label: 'Sélection des Exercices',
        sublabel: 'Mouvements de force adaptés',
        color: '#06B6D4'
      },
      {
        icon: 'Calculator',
        label: 'Calcul des Charges',
        sublabel: 'Optimisation poids et répétitions',
        color: '#8B5CF6'
      }
    ],
    tips: [
      {
        icon: 'Wind',
        title: 'Respiration contrôlée',
        description: 'Expirez pendant la phase concentrique (effort), inspirez pendant la phase excentrique.'
      },
      {
        icon: 'Flame',
        title: 'Échauffement articulaire',
        description: 'Mobilisez chaque articulation sollicitée pour prévenir les blessures.'
      },
      {
        icon: 'Heart',
        title: 'Temps sous tension',
        description: 'Contrôlez la vitesse d\'exécution pour maximiser l\'hypertrophie musculaire.'
      }
    ]
  },
  running: {
    icon: 'Activity',
    primaryColor: '#EF4444',
    secondaryColor: '#F59E0B',
    name: 'Course',
    modules: [
      {
        icon: 'Search',
        label: 'Analyse du Contexte',
        sublabel: 'Environnement et conditions',
        color: '#EF4444'
      },
      {
        icon: 'Target',
        label: 'Zones d\'Intensité',
        sublabel: 'Allures et fréquences cardiaques',
        color: '#F59E0B'
      },
      {
        icon: 'TrendingUp',
        label: 'Structure de Séance',
        sublabel: 'Intervalles et récupérations',
        color: '#06B6D4'
      }
    ],
    tips: [
      {
        icon: 'Activity',
        title: 'Cadence optimale',
        description: 'Visez 170-180 pas/minute pour une foulée efficace et économique.'
      },
      {
        icon: 'Droplet',
        title: 'Hydratation stratégique',
        description: 'Buvez 150-200ml toutes les 15-20 minutes lors des sorties longues.'
      },
      {
        icon: 'Heart',
        title: 'Zones cardiaques',
        description: 'Respectez vos zones pour optimiser les adaptations physiologiques.'
      }
    ]
  },
  cycling: {
    icon: 'Bike',
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    name: 'Cyclisme',
    modules: [
      {
        icon: 'Search',
        label: 'Analyse du Contexte',
        sublabel: 'Terrain et météo',
        color: '#F59E0B'
      },
      {
        icon: 'Gauge',
        label: 'Zones de Puissance',
        sublabel: 'FTP et intensités cibles',
        color: '#EF4444'
      },
      {
        icon: 'Route',
        label: 'Structure de Sortie',
        sublabel: 'Profil et intervalles',
        color: '#06B6D4'
      }
    ],
    tips: [
      {
        icon: 'Gauge',
        title: 'Cadence de pédalage',
        description: 'Maintenez 85-95 rpm pour optimiser l\'efficacité et préserver les articulations.'
      },
      {
        icon: 'Wind',
        title: 'Position aérodynamique',
        description: 'Abaissez votre buste dans les phases rapides pour réduire la résistance au vent.'
      },
      {
        icon: 'Zap',
        title: 'Gestion de l\'effort',
        description: 'Anticipez les montées et gérez votre puissance de manière stratégique.'
      }
    ]
  },
  'functional-crosstraining': {
    icon: 'Zap',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    name: 'Functional',
    modules: [
      {
        icon: 'Search',
        label: 'Analyse du Contexte',
        sublabel: 'Équipements et espace',
        color: '#8B5CF6'
      },
      {
        icon: 'Layers',
        label: 'Design du WOD',
        sublabel: 'Format et mouvements',
        color: '#EC4899'
      },
      {
        icon: 'Timer',
        label: 'Timing & Intensité',
        sublabel: 'Durées et répétitions',
        color: '#06B6D4'
      }
    ],
    tips: [
      {
        icon: 'Zap',
        title: 'Intensity matters',
        description: 'Maintenez une intensité élevée tout en préservant la technique d\'exécution.'
      },
      {
        icon: 'Target',
        title: 'Scaling intelligent',
        description: 'Adaptez les mouvements et charges à votre niveau sans compromettre le stimulus.'
      },
      {
        icon: 'Clock',
        title: 'Gestion du temps',
        description: 'Stratégisez vos transitions pour optimiser votre score final.'
      }
    ]
  },
  competitions: {
    icon: 'Trophy',
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    name: 'Compétitions',
    modules: [
      {
        icon: 'Search',
        label: 'Analyse du Contexte',
        sublabel: 'Format et équipements',
        color: '#F59E0B'
      },
      {
        icon: 'Target',
        label: 'Design des Stations',
        sublabel: 'Circuit et mouvements',
        color: '#EF4444'
      },
      {
        icon: 'BarChart',
        label: 'Optimisation Score',
        sublabel: 'Charges et stratégie',
        color: '#8B5CF6'
      }
    ],
    tips: [
      {
        icon: 'Trophy',
        title: 'Mindset compétitif',
        description: 'Visualisez votre performance et préparez-vous mentalement à donner le maximum.'
      },
      {
        icon: 'Zap',
        title: 'Pacing stratégique',
        description: 'Démarrez contrôlé et accélérez progressivement pour finir fort.'
      },
      {
        icon: 'Target',
        title: 'Standards de mouvement',
        description: 'Respectez les critères de validité pour éviter les no-reps coûteux.'
      }
    ]
  }
};

const TrainingGenerationLoader: React.FC<TrainingGenerationLoaderProps> = ({
  progress,
  locationName,
  availableEquipment = [],
  discipline = 'force',
  energyLevel = 7,
  availableTime = 60,
  disciplineColor,
  onCancel,
  showCancelButton = false
}) => {
  const reduceMotion = usePreferredMotion() === 'reduced';
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Get discipline configuration
  const config = useMemo(() => {
    const normalizedDiscipline = discipline?.toLowerCase() || 'force';
    return DISCIPLINE_CONFIGS[normalizedDiscipline] || DISCIPLINE_CONFIGS.force;
  }, [discipline]);

  const primaryColor = disciplineColor || config.primaryColor;
  const secondaryColor = config.secondaryColor;

  // Rotate tips every 6 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % config.tips.length);
    }, 6000);

    return () => clearInterval(tipInterval);
  }, [config.tips.length]);

  // Track elapsed time
  useEffect(() => {
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const safeProgress = Math.min(100, Math.max(0, progress));

  const modules: ProcessingModule[] = config.modules.map((module, idx) => ({
    ...module,
    active: safeProgress >= (idx + 1) * 30
  }));

  const currentTip = config.tips[currentTipIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <GlassCard
        className="p-6 md:p-8 text-center relative overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${primaryColor} 15%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, color-mix(in srgb, ${secondaryColor} 12%, transparent) 0%, transparent 50%),
            linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.08)),
            var(--glass-opacity)
          `,
          borderColor: `color-mix(in srgb, ${primaryColor} 30%, transparent)`,
          boxShadow: `
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 0 40px color-mix(in srgb, ${primaryColor} 20%, transparent),
            0 0 80px color-mix(in srgb, ${secondaryColor} 18%, transparent),
            inset 0 2px 0 rgba(255, 255, 255, 0.25),
            inset 0 -2px 0 rgba(0, 0, 0, 0.15)
          `,
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)'
        }}
      >
        {/* Grid Effect Background */}
        {!reduceMotion && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(${primaryColor}40 1px, transparent 1px),
                  linear-gradient(90deg, ${primaryColor}40 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                animationName: 'energyGridPulse',
                animationDuration: '3s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite'
              }}
            />
          </div>
        )}

        {/* Floating Energy Particles */}
        {!reduceMotion && [...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? '4px' : '3px',
              height: i % 3 === 0 ? '4px' : '3px',
              background: i % 2 === 0 ? primaryColor : secondaryColor,
              top: `${20 + Math.random() * 60}%`,
              left: `${5 + i * 6}%`,
              opacity: 0.6,
              animationName: 'energyParticleFloat',
              animationDuration: `${3 + Math.random() * 2}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${i * 0.2}s`,
              filter: `blur(${i % 4 === 0 ? 1 : 0.5}px)`
            }}
          />
        ))}

        <div className="space-y-6 relative z-10">
          {/* Central Icon */}
          <div className="flex justify-center">
            <motion.div
              className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%),
                  radial-gradient(circle at 70% 70%, color-mix(in srgb, ${secondaryColor} 15%, transparent) 0%, transparent 70%),
                  linear-gradient(135deg, color-mix(in srgb, ${primaryColor} 45%, transparent), color-mix(in srgb, ${primaryColor} 30%, transparent))
                `,
                border: `3px solid color-mix(in srgb, ${primaryColor} 70%, transparent)`,
                boxShadow: `
                  0 0 50px color-mix(in srgb, ${primaryColor} 40%, transparent),
                  0 0 25px color-mix(in srgb, ${primaryColor} 40%, transparent),
                  0 0 80px color-mix(in srgb, ${primaryColor} 20%, transparent),
                  inset 0 0 25px color-mix(in srgb, ${primaryColor} 18%, transparent),
                  inset 0 2px 0 rgba(255, 255, 255, 0.3)
                `
              }}
              animate={!reduceMotion ? {
                scale: [1, 1.08, 1],
                rotate: [0, 180, 360],
                boxShadow: [
                  `0 0 50px color-mix(in srgb, ${primaryColor} 40%, transparent), 0 0 25px color-mix(in srgb, ${primaryColor} 40%, transparent)`,
                  `0 0 70px color-mix(in srgb, ${primaryColor} 60%, transparent), 0 0 35px color-mix(in srgb, ${primaryColor} 60%, transparent)`,
                  `0 0 50px color-mix(in srgb, ${primaryColor} 40%, transparent), 0 0 25px color-mix(in srgb, ${primaryColor} 40%, transparent)`
                ]
              } : {}}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <SpatialIcon
                Icon={ICONS[config.icon]}
                size={56}
                className="text-white"
                style={{
                  filter: `drop-shadow(0 0 16px color-mix(in srgb, ${primaryColor} 60%, transparent)) drop-shadow(0 0 8px white)`
                }}
              />
            </motion.div>
          </div>

          {/* Main Messages */}
          <div className="space-y-3">
            <motion.h2
              className="text-2xl md:text-3xl font-bold text-white"
              style={{
                textShadow: `0 0 24px color-mix(in srgb, ${primaryColor} 40%, transparent), 0 0 48px color-mix(in srgb, ${primaryColor} 35%, transparent), 0 2px 4px rgba(0, 0, 0, 0.3)`
              }}
              animate={!reduceMotion ? {
                opacity: [0.95, 1, 0.95]
              } : {}}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Génération de Votre Séance
            </motion.h2>
            <motion.p
              className="text-white/85 text-base md:text-lg leading-relaxed max-w-lg mx-auto"
              style={{
                textShadow: `0 0 12px color-mix(in srgb, ${secondaryColor} 35%, transparent), 0 1px 2px rgba(0, 0, 0, 0.2)`
              }}
              animate={!reduceMotion ? {
                opacity: [0.9, 1, 0.9]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
            >
              Votre programme personnalisé est en cours de création
            </motion.p>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="w-3 h-3 bg-white/80 rounded-full"
                style={{
                  animationName: !reduceMotion ? 'loader-dot' : 'none',
                  animationDuration: '1.4s',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${index * 0.2}s`
                }}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="text-center">
              <span
                className="text-4xl md:text-5xl font-bold text-white"
                style={{
                  textShadow: `0 0 20px color-mix(in srgb, ${primaryColor} 40%, transparent)`
                }}
              >
                {Math.round(safeProgress)}%
              </span>
            </div>

            <div className="w-full max-w-md mx-auto h-2.5 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full rounded-full relative"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                  width: `${safeProgress}%`,
                  boxShadow: `0 0 12px color-mix(in srgb, ${primaryColor} 40%, transparent)`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${safeProgress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {safeProgress < 95 && !reduceMotion && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg,
                        transparent 0%,
                        rgba(255,255,255,0.4) 50%,
                        transparent 100%
                      )`,
                      animationName: 'energyShimmer',
                      animationDuration: '2s',
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite'
                    }}
                  />
                )}
              </motion.div>
            </div>
          </div>

          {/* Context Summary - Enhanced with Icons */}
          {(locationName || availableEquipment.length > 0) && (
            <div
              className="p-5 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${primaryColor} 12%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: `2px solid color-mix(in srgb, ${primaryColor} 25%, transparent)`,
                backdropFilter: 'blur(12px) saturate(140%)',
                boxShadow: `0 0 20px color-mix(in srgb, ${primaryColor} 15%, transparent)`
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `color-mix(in srgb, ${primaryColor} 25%, transparent)`,
                    border: `2px solid color-mix(in srgb, ${primaryColor} 50%, transparent)`,
                    boxShadow: `0 0 12px color-mix(in srgb, ${primaryColor} 30%, transparent)`
                  }}
                >
                  <SpatialIcon Icon={ICONS.MapPin} size={16} style={{ color: primaryColor }} variant="pure" />
                </div>
                <span className="text-sm font-bold text-white">Contexte de Génération</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {locationName && (
                  <div
                    className="p-3 rounded-xl flex flex-col items-center gap-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid color-mix(in srgb, ${secondaryColor} 20%, transparent)`
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: `color-mix(in srgb, ${secondaryColor} 20%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${secondaryColor} 40%, transparent)`,
                        boxShadow: `0 0 10px color-mix(in srgb, ${secondaryColor} 25%, transparent)`
                      }}
                    >
                      <SpatialIcon Icon={ICONS.Home} size={18} style={{ color: secondaryColor }} variant="pure" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-white/50 mb-0.5">Lieu</div>
                      <div className="text-xs font-semibold text-white/90">{locationName}</div>
                    </div>
                  </div>
                )}
                {availableEquipment.length > 0 && (
                  <div
                    className="p-3 rounded-xl flex flex-col items-center gap-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid color-mix(in srgb, #10B981 20%, transparent)`
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: 'color-mix(in srgb, #10B981 20%, transparent)',
                        border: '1px solid color-mix(in srgb, #10B981 40%, transparent)',
                        boxShadow: '0 0 10px color-mix(in srgb, #10B981 25%, transparent)'
                      }}
                    >
                      <SpatialIcon Icon={ICONS.Package} size={18} style={{ color: '#10B981' }} variant="pure" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-white/50 mb-0.5">Équipements</div>
                      <div className="text-xs font-semibold text-white/90">{availableEquipment.length} items</div>
                    </div>
                  </div>
                )}
                <div
                  className="p-3 rounded-xl flex flex-col items-center gap-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid color-mix(in srgb, #F59E0B 20%, transparent)'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'color-mix(in srgb, #F59E0B 20%, transparent)',
                      border: '1px solid color-mix(in srgb, #F59E0B 40%, transparent)',
                      boxShadow: '0 0 10px color-mix(in srgb, #F59E0B 25%, transparent)'
                    }}
                  >
                    <SpatialIcon Icon={ICONS.Clock} size={18} style={{ color: '#F59E0B' }} variant="pure" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/50 mb-0.5">Durée</div>
                    <div className="text-xs font-semibold text-white/90">{availableTime} min</div>
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl flex flex-col items-center gap-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid color-mix(in srgb, #EF4444 20%, transparent)'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'color-mix(in srgb, #EF4444 20%, transparent)',
                      border: '1px solid color-mix(in srgb, #EF4444 40%, transparent)',
                      boxShadow: '0 0 10px color-mix(in srgb, #EF4444 25%, transparent)'
                    }}
                  >
                    <SpatialIcon Icon={ICONS.Zap} size={18} style={{ color: '#EF4444' }} variant="pure" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/50 mb-0.5">Énergie</div>
                    <div className="text-xs font-semibold text-white/90">{energyLevel}/10</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.label}
                className="p-4 rounded-xl relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(circle at 30% 20%, color-mix(in srgb, ${module.color} ${module.active ? '15' : '8'}%, transparent) 0%, transparent 60%),
                    rgba(255,255,255,${module.active ? '0.08' : '0.04'})
                  `,
                  border: `2px solid color-mix(in srgb, ${module.color} ${module.active ? '40' : '20'}%, transparent)`,
                  backdropFilter: 'blur(12px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                  boxShadow: module.active ?
                    `0 0 20px color-mix(in srgb, ${module.color} 30%, transparent)` :
                    `0 0 8px color-mix(in srgb, ${module.color} 15%, transparent)`,
                  transition: 'all 0.6s ease'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Active Indicator */}
                {module.active && !reduceMotion && (
                  <div
                    className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                    style={{
                      background: module.color,
                      boxShadow: `0 0 12px color-mix(in srgb, ${module.color} 80%, transparent)`,
                      animationName: 'energyPulse',
                      animationDuration: '1.5s',
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite'
                    }}
                  />
                )}

                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      module.active && !reduceMotion ? 'breathing-icon' : ''
                    }`}
                    style={{
                      background: `
                        radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                        linear-gradient(135deg, color-mix(in srgb, ${module.color} 40%, transparent), color-mix(in srgb, ${module.color} 30%, transparent))
                      `,
                      border: `2px solid color-mix(in srgb, ${module.color} 60%, transparent)`,
                      boxShadow: `
                        0 0 20px color-mix(in srgb, ${module.color} 50%, transparent),
                        inset 0 2px 0 rgba(255,255,255,0.3)
                      `
                    }}
                  >
                    <SpatialIcon
                      Icon={ICONS[module.icon]}
                      size={20}
                      style={{ color: module.color }}
                      variant="pure"
                    />
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-bold mb-1" style={{ color: module.color }}>
                      {module.label}
                    </div>
                    <div className="text-xs text-white/60">
                      {module.sublabel}
                    </div>
                  </div>
                </div>

                {/* Energy Flow Effect */}
                {module.active && !reduceMotion && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden"
                    style={{
                      background: `linear-gradient(90deg,
                        transparent 0%,
                        ${module.color} 50%,
                        transparent 100%
                      )`,
                      animationName: 'energyFlow',
                      animationDuration: '2s',
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite'
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Training Tip - Harmonized Design */}
          <motion.div
            key={currentTipIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="p-5 rounded-2xl relative overflow-hidden"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, color-mix(in srgb, ${primaryColor} 12%, transparent) 0%, transparent 60%),
                rgba(255, 255, 255, 0.05)
              `,
              border: `2px solid color-mix(in srgb, ${primaryColor} 25%, transparent)`,
              backdropFilter: 'blur(12px) saturate(140%)',
              boxShadow: `0 0 15px color-mix(in srgb, ${primaryColor} 12%, transparent)`
            }}
          >
            {/* Progress Dots for Tips */}
            <div className="absolute top-3 right-3 flex gap-1.5">
              {config.tips.map((_, idx) => (
                <div
                  key={idx}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: idx === currentTipIndex ? primaryColor : 'rgba(255,255,255,0.2)',
                    boxShadow: idx === currentTipIndex ? `0 0 8px ${primaryColor}` : 'none'
                  }}
                />
              ))}
            </div>

            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                    linear-gradient(135deg, color-mix(in srgb, ${primaryColor} 30%, transparent), color-mix(in srgb, ${primaryColor} 20%, transparent))
                  `,
                  border: `2px solid color-mix(in srgb, ${primaryColor} 50%, transparent)`,
                  boxShadow: `
                    0 0 15px color-mix(in srgb, ${primaryColor} 40%, transparent),
                    inset 0 2px 0 rgba(255,255,255,0.2)
                  `
                }}
              >
                <SpatialIcon
                  Icon={ICONS[currentTip.icon]}
                  size={24}
                  style={{ color: primaryColor }}
                  variant="pure"
                />
              </div>
              <div className="flex-1 text-left pt-1">
                <h4 className="text-base font-bold text-white mb-2">{currentTip.title}</h4>
                <p className="text-sm text-white/75 leading-relaxed">{currentTip.description}</p>
              </div>
            </div>
          </motion.div>

          {/* Elapsed Time */}
          {elapsedTime > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/50 text-sm"
            >
              Temps écoulé: {formatTime(elapsedTime)}
            </motion.div>
          )}

          {/* Cancel Button */}
          {showCancelButton && onCancel && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={onCancel}
              className="mt-4 px-6 py-2.5 rounded-xl text-white/80 text-sm font-medium transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
              whileHover={{
                background: 'rgba(255, 255, 255, 0.12)',
                scale: 1.02,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 justify-center">
                <SpatialIcon Icon={ICONS.X} size={16} />
                <span>Annuler</span>
              </div>
            </motion.button>
          )}
        </div>

        {/* Custom Animations */}
        <style>{`
          @keyframes energyScanVertical {
            0%, 100% { transform: translateY(-100%); opacity: 0; }
            10%, 90% { opacity: 0.6; }
            50% { transform: translateY(0); opacity: 1; }
          }

          @keyframes energyParticleFloat {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
            25% { transform: translateY(-8px) scale(1.2); opacity: 1; }
            50% { transform: translateY(-4px) scale(0.9); opacity: 0.8; }
            75% { transform: translateY(-12px) scale(1.1); opacity: 1; }
          }

          @keyframes energyGridPulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }

          @keyframes energyPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
          }

          @keyframes energyShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }

          @keyframes energyFlow {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
          }

          @keyframes loader-dot {
            0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
          }

          .breathing-icon {
            animation: breathing 2s ease-in-out infinite;
          }

          @keyframes breathing {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </GlassCard>
    </motion.div>
  );
};

export default TrainingGenerationLoader;
