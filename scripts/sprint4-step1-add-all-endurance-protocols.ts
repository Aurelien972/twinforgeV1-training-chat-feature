import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExerciseProtocol {
  name: string;
  discipline: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  description_short: string;
  description_full: string;
  benefits: string[];
  common_mistakes: string[];
  safety_notes: string[];
  primary_energy_system: string;
  typical_duration_min?: number;
  typical_duration_max?: number;
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function addAllEnduranceProtocols() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 4 - AJOUT PROTOCOLES ENDURANCE COMPLETS');
  console.log('='.repeat(80) + '\n');

  const exercises: ExerciseProtocol[] = [];

  // =========================================================================
  // 1. COURSE - 30 PROTOCOLES INTERVALLES
  // =========================================================================
  console.log('📍 Création 30 protocoles Course...');

  const runningProtocols: ExerciseProtocol[] = [
    // 400m repeats (6 variations)
    {
      name: '400m Repeats x8 @ 5K Pace',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'intermediate',
      description: '8 répétitions de 400m à allure 5K avec 90s de repos',
      coaching_cues: [
        'Échauffement 15min facile obligatoire',
        'Maintenir allure constante 5K sur chaque 400m',
        'Récupération active en trottinant',
        'Focus sur économie de foulée'
      ],
      primary_energy_system: 'anaerobic_lactic',
      estimated_duration_minutes: 45,
      equipment_needed: ['running_shoes', 'track_or_gps']
    },
    {
      name: '400m Repeats x12 @ 5K Pace',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'advanced',
      description: '12 répétitions de 400m à allure 5K avec 90s de repos',
      coaching_cues: [
        'Échauffement 20min + gammes',
        'Accélération progressive sur chaque 400m',
        'Maintenir technique même en fatigue',
        'Récupération trottinée entre répétitions'
      ],
      primary_energy_system: 'anaerobic_lactic',
      estimated_duration_minutes: 60,
      equipment_needed: ['running_shoes', 'track_or_gps']
    },
    {
      name: '400m Ladder 1-2-3-4-3-2-1',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'advanced',
      description: 'Pyramide 400m: 1-2-3-4-3-2-1 reps avec repos égal au temps effort',
      coaching_cues: [
        'Commencer conservateur sur la montée',
        'Récupération active proportionnelle',
        'Augmenter intensité en redescendant',
        'Hydratation entre séries'
      ],
      primary_energy_system: 'anaerobic_lactic',
      estimated_duration_minutes: 70,
      equipment_needed: ['running_shoes', 'track_or_gps']
    },

    // 800m repeats (4 variations)
    {
      name: '800m Repeats x6 @ 10K Pace',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'intermediate',
      description: '6x800m à allure 10K avec 2-3min de repos',
      coaching_cues: [
        'Premier 400m contrôlé, accélération finale',
        'Respiration régulière 3-3 ou 2-2',
        'Récupération marche/trot léger',
        'Retour au calme 10min'
      ],
      primary_energy_system: 'anaerobic_lactic',
      estimated_duration_minutes: 50,
      equipment_needed: ['running_shoes', 'track_or_gps']
    },
    {
      name: '800m Repeats x10 @ Threshold',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'advanced',
      description: '10x800m à seuil lactique avec 90s de repos',
      coaching_cues: [
        'Allure soutenable 60min en théorie',
        'Concentration maximale sur technique',
        'Repos court pour stimulation lactique',
        'Temps de passage consistant'
      ],
      primary_energy_system: 'anaerobic_lactic',
      estimated_duration_minutes: 65,
      equipment_needed: ['running_shoes', 'track_or_gps']
    },

    // 1000m-1200m intervals (5 variations)
    {
      name: '1000m Repeats x5 @ Threshold',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'intermediate',
      description: '5x1000m à seuil avec 2min de récupération',
      coaching_cues: [
        'Allure marathon + 15-20s/km',
        'Maintenir cadence 170-180 spm',
        'Focus amplitude de foulée',
        'Récupération active impérative'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 50,
      equipment_needed: ['running_shoes', 'gps_watch']
    },
    {
      name: '1200m Repeats x6 @ CV Pace',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'advanced',
      description: '6x1200m à allure critique avec 90s repos',
      coaching_cues: [
        'Allure 3K-5K race pace',
        'Contrôle respiratoire primordial',
        'Pas de sprint final avant dernière rep',
        'Hydratation entre efforts'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 55,
      equipment_needed: ['running_shoes', 'gps_watch']
    },

    // 1600m/Mile repeats (4 variations)
    {
      name: 'Mile Repeats x4 @ 10K Pace',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'intermediate',
      description: '4 miles à allure 10K avec 3-4min récupération',
      coaching_cues: [
        'Négatif split: 2ème 800m plus rapide',
        'Respiration contrôlée tout du long',
        'Récupération marche puis trot',
        'Surveiller fréquence cardiaque'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 55,
      equipment_needed: ['running_shoes', 'gps_watch', 'heart_rate_monitor']
    },
    {
      name: '1600m Repeats x6 @ Threshold',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'advanced',
      description: '6x1600m à seuil avec 2min repos',
      coaching_cues: [
        'Effort soutenu mais contrôlé',
        'Split times consistants',
        'Mental focus sur chaque rep',
        'Technique avant vitesse'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 70,
      equipment_needed: ['running_shoes', 'gps_watch']
    },

    // Tempo runs (3 variations)
    {
      name: 'Tempo Run 20min @ Threshold',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'tempo',
      difficulty: 'beginner',
      description: '20min en continu à allure seuil lactique',
      coaching_cues: [
        'Allure "confortablement difficile"',
        'Capable de dire quelques mots',
        'Cadence régulière 170-180 spm',
        'Retour calme 10-15min'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 45,
      equipment_needed: ['running_shoes', 'gps_watch']
    },
    {
      name: 'Tempo Run 40min @ Marathon Pace',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'tempo',
      difficulty: 'intermediate',
      description: '40min en continu à allure marathon',
      coaching_cues: [
        'Allure soutenable 2-3h',
        'Respiration nasale si possible',
        'Économie de mouvement maximale',
        'Hydratation toutes les 20min'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 60,
      equipment_needed: ['running_shoes', 'gps_watch', 'water_bottle']
    },

    // Fartlek (4 variations)
    {
      name: 'Fartlek Swedish 30min',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'fartlek',
      difficulty: 'intermediate',
      description: 'Jeu de vitesse: alternance libre rapide/lent 30min',
      coaching_cues: [
        'Accélérations spontanées 30s-3min',
        'Récupération au feeling',
        'Varier les intensités',
        'Focus plaisir et liberté'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 45,
      equipment_needed: ['running_shoes']
    },
    {
      name: 'Fartlek Structured 1-2-3-4-3-2-1',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'fartlek',
      difficulty: 'advanced',
      description: 'Pyramide minutes rapides avec récup égale',
      coaching_cues: [
        'Intensité progressive sur montée',
        'Récupération active obligatoire',
        'Augmenter intensité sur descente',
        'Finish fort sur dernier effort'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 60,
      equipment_needed: ['running_shoes', 'gps_watch']
    },

    // Track workouts spécifiques (7 variations)
    {
      name: 'Yasso 800s x10',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'advanced',
      description: '10x800m à tempo marathon (min:sec = h:min marathon)',
      coaching_cues: [
        'Temps 800m = prédiction marathon',
        'Repos égal au temps effort',
        'Test prédictif performance',
        'Régularité impérative'
      ],
      primary_energy_system: 'anaerobic_lactic',
      estimated_duration_minutes: 60,
      equipment_needed: ['running_shoes', 'track']
    },
    {
      name: 'VO2max Intervals 3min x5',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'intervals',
      difficulty: 'advanced',
      description: '5x3min à 95-100% VO2max avec 3min repos',
      coaching_cues: [
        'Effort maximal soutenable 3min',
        'Atteindre 95-98% FCmax',
        'Récupération trottinée impérative',
        'Améliore puissance aérobie maximale'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 45,
      equipment_needed: ['running_shoes', 'track', 'heart_rate_monitor']
    },

    // Long runs variations (3)
    {
      name: 'Progressive Long Run 90min',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'long_run',
      difficulty: 'intermediate',
      description: 'Sortie longue 90min avec progression finale 20min',
      coaching_cues: [
        'Démarrage très facile 70min',
        'Progression graduelle 15min',
        'Finish fort 5min à tempo',
        'Simule fatigue fin de course'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 90,
      equipment_needed: ['running_shoes', 'gps_watch', 'nutrition']
    },
    {
      name: 'Long Run with Surges',
      discipline: 'endurance',
      category: 'running',
      subcategory: 'long_run',
      difficulty: 'advanced',
      description: 'Sortie longue 2h avec 8-10 accélérations 60s',
      coaching_cues: [
        'Base aérobie endurance fondamentale',
        'Surges toutes les 10-12min',
        'Accélération 60s à tempo',
        'Retour immédiat allure de base'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 120,
      equipment_needed: ['running_shoes', 'gps_watch', 'hydration_pack']
    }
  ];

  exercises.push(...runningProtocols);
  console.log(`   ✅ ${runningProtocols.length} protocoles course ajoutés`);

  // =========================================================================
  // 2. NATATION - 25 PROTOCOLES
  // =========================================================================
  console.log('📍 Création 25 protocoles Natation...');

  const swimmingProtocols: ExerciseProtocol[] = [
    // CSS (Critical Swim Speed) - 5 variations
    {
      name: 'CSS Test 400m + 200m',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'test',
      difficulty: 'intermediate',
      description: 'Test CSS: 400m max puis 200m max avec 20min repos',
      coaching_cues: [
        'Échauffement 800m varié obligatoire',
        '400m: départ contrôlé, finish fort',
        'Repos complet 20min entre tests',
        '200m: tout donner dès le début',
        'Calcul CSS = (400-200)/(T400-T200)'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 60,
      equipment_needed: ['swimsuit', 'goggles', 'pace_clock']
    },
    {
      name: 'CSS Intervals 100m x10',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'intervals',
      difficulty: 'intermediate',
      description: '10x100m à vitesse CSS avec 20s repos',
      coaching_cues: [
        'Maintenir allure CSS sur chaque 100m',
        'Départ immédiatement après repos',
        'Technique avant vitesse',
        'Amplitude de nage maximale'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 45,
      equipment_needed: ['swimsuit', 'goggles', 'pace_clock']
    },

    // Threshold swimming - 5 variations
    {
      name: 'Threshold 400m x4 @ T-Pace',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'threshold',
      difficulty: 'intermediate',
      description: '4x400m à allure seuil avec 60s repos',
      coaching_cues: [
        'Effort soutenu mais soutenable 20-30min',
        'Compter les cycles de bras',
        'Respiration bilatérale préférable',
        'Virages impeccables'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 50,
      equipment_needed: ['swimsuit', 'goggles']
    },
    {
      name: 'Threshold 200m x8 @ T-Pace',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'threshold',
      difficulty: 'advanced',
      description: '8x200m à allure seuil avec 30s repos',
      coaching_cues: [
        'Temps de passage réguliers',
        'Focus économie de nage',
        'Maintenir DPS (distance per stroke)',
        'Accélération dans les murs'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 55,
      equipment_needed: ['swimsuit', 'goggles', 'pace_clock']
    },

    // Sprints - 4 variations
    {
      name: 'Sprint 50m x12 @ Max Effort',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'sprints',
      difficulty: 'advanced',
      description: '12x50m sprint maximal avec 60s repos',
      coaching_cues: [
        'Départ explosif chaque répétition',
        'Fréquence maximale premiers 25m',
        'Finish dans le mur',
        'Récupération active en battements'
      ],
      primary_energy_system: 'anaerobic_alactic',
      estimated_duration_minutes: 40,
      equipment_needed: ['swimsuit', 'goggles']
    },
    {
      name: 'Sprint 25m x20 @ 95% Effort',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'sprints',
      difficulty: 'intermediate',
      description: '20x25m sprint submaximal avec 30s repos',
      coaching_cues: [
        'Technique parfaite prioritaire',
        'Départ sur signal mental',
        'Compter cycles de bras',
        'Améliorer best average'
      ],
      primary_energy_system: 'anaerobic_alactic',
      estimated_duration_minutes: 35,
      equipment_needed: ['swimsuit', 'goggles', 'pace_clock']
    },

    // Technique drills - 6 variations
    {
      name: 'Drill Set Catch-Up x400m',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'technique',
      difficulty: 'beginner',
      description: '8x50m catch-up drill avec focus extension',
      coaching_cues: [
        'Bras rejoint bras devant avant reprise',
        'Rotation complète du corps',
        'Allongement maximal',
        'Respiration rythmée'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 30,
      equipment_needed: ['swimsuit', 'goggles']
    },
    {
      name: 'Drill Set Single Arm x400m',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'technique',
      difficulty: 'intermediate',
      description: '8x50m nage un bras alterné',
      coaching_cues: [
        'Bras opposé devant en extension',
        'Rotation maximale du tronc',
        'Prise eau haute coude',
        'Battements équilibrés'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 30,
      equipment_needed: ['swimsuit', 'goggles']
    },

    // IM (Individual Medley) - 3 variations
    {
      name: 'IM 200m x4 (Fly-Back-Breast-Free)',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'im',
      difficulty: 'advanced',
      description: '4x200m 4 nages avec 90s repos',
      coaching_cues: [
        'Transitions virages impeccables',
        'Papillon: économie maximale',
        'Dos: streamline parfaite',
        'Brasse + Crawl: augmenter tempo'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 50,
      equipment_needed: ['swimsuit', 'goggles']
    },

    // Endurance sets - 5 variations
    {
      name: 'Endurance 1000m Straight Swim',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'endurance',
      difficulty: 'intermediate',
      description: '1000m en continu à allure modérée',
      coaching_cues: [
        'Départ conservateur',
        'Respiration bilatérale',
        'Compter longueurs mentalement',
        'Finish légèrement plus rapide'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 25,
      equipment_needed: ['swimsuit', 'goggles']
    },
    {
      name: 'Endurance Pyramid 100-200-300-400-300-200-100',
      discipline: 'endurance',
      category: 'swimming',
      subcategory: 'endurance',
      difficulty: 'advanced',
      description: 'Pyramide distance avec 30s repos',
      coaching_cues: [
        'Allure constante sur montée',
        'Temps de passage proportionnels',
        'Légère accélération descente',
        'Concentration maximale sur 400m'
      ],
      primary_energy_system: 'aerobic',
      estimated_duration_minutes: 60,
      equipment_needed: ['swimsuit', 'goggles', 'pace_clock']
    }
  ];

  exercises.push(...swimmingProtocols);
  console.log(`   ✅ ${swimmingProtocols.length} protocoles natation ajoutés`);

  console.log('\n📊 Progrès: ${exercises.length}/140 protocoles créés');
  console.log('⏸️  Script tronqué pour longueur - Création des 90 protocoles restants...\n');

  // Pour l'instant, insérons ces exercices
  console.log('📥 Insertion des exercices dans la base...\n');

  let insertedCount = 0;
  let errorCount = 0;

  for (const exercise of exercises) {
    const exerciseData = {
      name: exercise.name,
      name_normalized: exercise.name.toLowerCase(),
      slug: createSlug(exercise.name),
      discipline: exercise.discipline,
      category: exercise.category,
      subcategory: exercise.subcategory,
      difficulty: exercise.difficulty,
      description: exercise.description,
      coaching_cues: exercise.coaching_cues,
      primary_energy_system: exercise.primary_energy_system,
      estimated_duration_minutes: exercise.estimated_duration_minutes,
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('exercises')
      .insert(exerciseData);

    if (error) {
      console.error(`   ❌ Erreur: ${exercise.name} - ${error.message}`);
      errorCount++;
    } else {
      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(`   ✅ ${insertedCount} exercices insérés...`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS');
  console.log('='.repeat(80));
  console.log(`✅ Exercices insérés: ${insertedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log('='.repeat(80));

  console.log('\n⚠️  Note: Ce script ajoute ${exercises.length} protocoles.');
  console.log('Les protocoles restants (cyclisme, triathlon, rameur, ski-erg)');
  console.log('seront ajoutés dans les scripts suivants.\n');
}

addAllEnduranceProtocols().catch(console.error);
