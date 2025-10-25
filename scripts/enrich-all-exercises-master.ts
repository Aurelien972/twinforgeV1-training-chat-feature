import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Load templates
const templatesPath = path.join(__dirname, 'visual-description-templates.json');
const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));

interface Exercise {
  id: string;
  name: string;
  discipline: string;
  category: string;
  difficulty: string;
  movement_pattern: string | null;
  visual_keywords: string[];
  description_short: string;
  muscles?: Array<{ muscle_group: { name: string } }>;
  equipment?: Array<{ equipment_type: { name: string } }>;
}

interface EnrichmentResult {
  exerciseId: string;
  exerciseName: string;
  visualDescriptionEnriched: string;
  executionPhases: string[];
  keyPositions: string[];
  recommendedViewAngle: string;
  recommendedVisualStyle: string;
  qualityScore: number;
  success: boolean;
  error?: string;
}

/**
 * Generate enriched visual description for an exercise
 * Professional sports and anatomy expert mode
 */
function generateEnrichedDescription(exercise: Exercise): EnrichmentResult {
  try {
    const discipline = exercise.discipline.toLowerCase();
    const template = templates.disciplineTemplates[discipline] || templates.disciplineTemplates.force;

    // Determine movement pattern
    const movementPattern = determineMovementPattern(exercise);
    const movementConfig = templates.movementPatterns[movementPattern];

    // Get muscles visual descriptions
    const musclesDescription = generateMusclesDescription(exercise);

    // Get equipment description
    const equipmentDescription = generateEquipmentDescription(exercise);

    // Generate each section of the description
    const startingPosition = generateStartingPosition(exercise, movementPattern);
    const equipmentSetup = equipmentDescription;
    const movementTrajectory = generateMovementTrajectory(exercise, movementConfig);
    const muscleActivation = musclesDescription;
    const technicalPoints = generateTechnicalPoints(exercise, movementPattern);
    const viewAndStyle = generateViewAndStyle(exercise, template);

    // Combine all sections
    const fullDescription = `${startingPosition} ${equipmentSetup} ${movementTrajectory} ${muscleActivation} ${technicalPoints} ${viewAndStyle}`.trim();

    // Generate execution phases
    const executionPhases = generateExecutionPhases(exercise, template);

    // Generate key positions
    const keyPositions = generateKeyPositions(exercise, movementPattern);

    // Determine view angle
    const viewAngle = template.defaultView || 'side_view';

    // Determine visual style
    const visualStyle = template.defaultStyle || 'technical_anatomical';

    // Calculate quality score
    const qualityScore = calculateQualityScore(fullDescription, executionPhases, keyPositions, viewAngle, visualStyle);

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      visualDescriptionEnriched: fullDescription,
      executionPhases,
      keyPositions,
      recommendedViewAngle: viewAngle,
      recommendedVisualStyle: visualStyle,
      qualityScore,
      success: true
    };
  } catch (error) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      visualDescriptionEnriched: '',
      executionPhases: [],
      keyPositions: [],
      recommendedViewAngle: 'side_view',
      recommendedVisualStyle: 'technical_anatomical',
      qualityScore: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function determineMovementPattern(exercise: Exercise): string {
  // Use existing movement_pattern if available
  if (exercise.movement_pattern) {
    return exercise.movement_pattern.toLowerCase().replace(/\s+/g, '_');
  }

  const name = exercise.name.toLowerCase();
  const category = exercise.category?.toLowerCase() || '';

  // Pattern matching based on exercise name and category
  if (name.includes('squat') || category.includes('squat')) return 'squat';
  if (name.includes('deadlift') || name.includes('soulevé') || category.includes('hinge')) return 'hinge';
  if (name.includes('press') && (name.includes('overhead') || name.includes('militaire') || name.includes('shoulder'))) return 'push_vertical';
  if (name.includes('bench') || name.includes('développé') || name.includes('push up')) return 'push_horizontal';
  if (name.includes('pull up') || name.includes('chin up') || name.includes('traction')) return 'pull_vertical';
  if (name.includes('row') || name.includes('rowing') || name.includes('tirage horizontal')) return 'pull_horizontal';
  if (name.includes('lunge') || name.includes('fente') || name.includes('split')) return 'lunge';
  if (name.includes('curl') || name.includes('flexion')) return 'pull_horizontal';
  if (name.includes('extension') && !name.includes('leg')) return 'push_horizontal';
  if (name.includes('rotation') || name.includes('twist') || name.includes('oblique')) return 'rotation';
  if (name.includes('carry') || name.includes('walk') || name.includes('marche')) return 'carry';

  // Default based on discipline
  if (exercise.discipline === 'calisthenics') return 'push_horizontal';
  if (exercise.discipline === 'endurance') return 'carry';

  return 'push_horizontal';
}

function generateMusclesDescription(exercise: Exercise): string {
  const muscles = exercise.muscles || [];
  if (muscles.length === 0) {
    return 'activation musculaire corps entier équilibrée';
  }

  // Get primary muscles (usually first 1-2 muscles)
  const primaryMuscles = muscles.slice(0, 2);
  const muscleDescriptions: string[] = [];

  primaryMuscles.forEach(m => {
    const muscleName = m.muscle_group.name.toLowerCase().replace(/\s+/g, '_');
    const muscleData = templates.anatomyDictionary[muscleName];

    if (muscleData) {
      muscleDescriptions.push(`${muscleData.visual} en contraction primaire`);
    } else {
      muscleDescriptions.push(`${m.muscle_group.name} highlighted rouge activation primaire`);
    }
  });

  return muscleDescriptions.join(', ');
}

function generateEquipmentDescription(exercise: Exercise): string {
  const equipment = exercise.equipment || [];

  if (equipment.length === 0) {
    return templates.equipmentDescriptors.none_bodyweight;
  }

  const equipmentDescriptions: string[] = [];

  equipment.forEach(e => {
    const eqName = e.equipment_type.name.toLowerCase().replace(/\s+/g, '_');
    const eqDesc = templates.equipmentDescriptors[eqName];

    if (eqDesc) {
      equipmentDescriptions.push(eqDesc);
    } else {
      equipmentDescriptions.push(`${e.equipment_type.name} positionné correctement`);
    }
  });

  return equipmentDescriptions.join(', ');
}

function generateStartingPosition(exercise: Exercise, movementPattern: string): string {
  const discipline = exercise.discipline.toLowerCase();

  // Generate starting position based on discipline and movement
  if (discipline === 'force') {
    if (movementPattern === 'squat') {
      return 'Athlète debout pieds largeur hanches ou légèrement plus large, pointes pieds légèrement ouvertes, barre positionnée trapèzes supérieurs ou clavicules, torse droit vertical, regard fixe devant hauteur yeux, poids réparti milieu pieds';
    } else if (movementPattern === 'hinge') {
      return 'Athlète debout pieds largeur hanches, barre au sol contre tibias ou en position rack, torse penché angle 45 degrés, colonne neutre de nuque à sacrum, épaules au-dessus barre, bras tendus verticalement, prise mains selon variante';
    } else if (movementPattern.includes('push')) {
      return 'Athlète positionné stable, pieds ancrés sol largeur hanches ou épaules, corps aligné tête hanches chevilles, prise équipement ferme contrôlée, scapulas rétractées déprimées, torse bombé fier, prêt à pousser';
    } else if (movementPattern.includes('pull')) {
      return 'Athlète positionné face équipement, prise ferme mains largeur épaules ou variante, bras initialement tendus ou légèrement fléchis, torse droit ou incliné selon exercice, scapulas en position neutre prêtes à rétracter';
    }
  } else if (discipline === 'calisthenics') {
    return 'Athlète corps entier engagé tension maximale, scapulas protractées ou rétractées selon skill, core verrouillé tight, jambes tendues ou positions spécifiques, contrôle total poids corps, équilibre précis';
  } else if (discipline === 'endurance') {
    return 'Athlète posture haute économique, torse légèrement penché avant 5-10 degrés, bras relâchés coudes angle 90 degrés, cadence régulière établie, respiration rythmée contrôlée, regard horizon';
  } else if (discipline === 'functional') {
    return 'Athlète position athlétique universelle, pieds largeur épaules, genoux légèrement fléchis, hanches chargées prêtes exploser, torse droit puissant, bras prêts saisir équipement ou propulser corps';
  }

  return 'Athlète en position de départ stable et contrôlée, corps aligné correctement, prêt à exécuter mouvement avec technique optimale';
}

function generateMovementTrajectory(exercise: Exercise, movementConfig: any): string {
  if (!movementConfig) {
    return 'mouvement contrôlé phase excentrique puis concentrique, amplitude complète articulaire, tempo constant, trajectoire optimale biomécanique';
  }

  const macroArrow = movementConfig.macroArrow;
  const microArrows = movementConfig.microArrows.join(', ');
  const trajectory = movementConfig.trajectory;

  return `${trajectory}, ${macroArrow} visible trajectoire principale, ${microArrows} montrant articulations clés`;
}

function generateTechnicalPoints(exercise: Exercise, movementPattern: string): string {
  const points: string[] = [];

  // General technical points
  points.push('colonne vertébrale maintenue neutre sans flexion excessive');

  if (movementPattern === 'squat') {
    points.push('genoux alignés avec pointes pieds sans valgus', 'hanches descendent sous parallèle si mobilité permet');
  } else if (movementPattern === 'hinge') {
    points.push('hanches pivot principal mouvement', 'jambes quasi-tendues genoux légère flexion sécurité');
  } else if (movementPattern.includes('push')) {
    points.push('scapulas stables rétractées', 'coudes trajectoire naturelle sans hyperextension');
  } else if (movementPattern.includes('pull')) {
    points.push('scapulas initient mouvement avant coudes', 'pas de momentum excessif corps reste stable');
  }

  points.push('respiration coordonnée expiration effort inspiration relâchement');

  return points.join(', ');
}

function generateViewAndStyle(exercise: Exercise, template: any): string {
  const viewAngle = template.defaultView || 'side_view';
  const visualStyle = template.defaultStyle || 'technical_anatomical';

  const viewDesc = templates.viewAngleRecommendations[viewAngle];
  const styleDesc = templates.visualStyles[visualStyle];

  return `${viewDesc}, ${styleDesc}`;
}

function generateExecutionPhases(exercise: Exercise, template: any): string[] {
  const phases = template.phases || ['setup', 'execution', 'completion'];

  return phases.map((phase: string) => {
    return `Phase ${phase}: ${getPhaseDescription(phase, exercise)}`;
  });
}

function getPhaseDescription(phase: string, exercise: Exercise): string {
  const phaseDescriptions: Record<string, string> = {
    'setup': 'Installation position départ, vérification alignements, engagement musculaire préparatoire',
    'eccentric': 'Phase excentrique contrôlée, descente ou étirement muscles sous tension',
    'pause_bottom': 'Pause position basse, maintien tension musculaire sans relâchement',
    'concentric': 'Phase concentrique explosive, contraction musculaire remontée puissante',
    'lockout': 'Verrouillage position finale, extension complète articulations',
    'preparation': 'Préparation corps, engagement core, positionnement optimal',
    'skill_entry': 'Entrée dans skill, transition contrôlée vers position cible',
    'hold_or_transition': 'Maintien position statique ou transition dynamique fluide',
    'skill_exit': 'Sortie skill contrôlée, retour position sécuritaire',
    'contact_phase': 'Phase contact sol, absorption impact, préparation propulsion',
    'propulsion': 'Propulsion puissante, extension triple cheville genou hanche',
    'flight_or_recovery': 'Phase vol ou récupération, relaxation musculaire préparation prochain cycle',
    'landing': 'Atterrissage sécuritaire, absorption forces, stabilisation',
    'loading_phase': 'Phase chargement, accumulation énergie élastique, préparation explosion',
    'explosive_movement': 'Mouvement explosif maximal, transfert énergie total corps',
    'landing_or_finish': 'Atterrissage ou finition mouvement, contrôle et stabilité'
  };

  return phaseDescriptions[phase] || `Phase ${phase} de l'exercice`;
}

function generateKeyPositions(exercise: Exercise, movementPattern: string): string[] {
  const positions: string[] = [];

  positions.push('Position départ: corps aligné optimal, tension musculaire initiale engagée');
  positions.push('Position intermédiaire: mi-chemin mouvement, muscles étirés ou contractés maximal');
  positions.push('Position finale: extension complète ou contraction peak, articulations verrouillées sécuritairement');

  if (movementPattern === 'squat') {
    positions.push('Position profondeur: hanches sous parallèle, genoux alignés, torse droit maintenu');
  } else if (movementPattern === 'hinge') {
    positions.push('Position étirement maximum: ischio-jambiers étirés, colonne neutre préservée');
  }

  return positions;
}

function calculateQualityScore(
  description: string,
  phases: string[],
  positions: string[],
  viewAngle: string,
  visualStyle: string
): number {
  let score = 0;
  const length = description.length;

  // Length scoring (20 points)
  if (length >= 250 && length <= 400) {
    score += 20;
  } else if (length >= 200 && length < 250) {
    score += 15;
  } else if (length >= 150) {
    score += 10;
  } else if (length > 0) {
    score += 5;
  }

  // Component checks (80 points total)
  const hasStartingPos = /position|posture|stance|debout|assis|allongé/i.test(description);
  const hasEquipment = /barbell|barre|dumbbell|haltère|kettlebell|cable|poulie|bench|banc|bodyweight|poids corps/i.test(description);
  const hasTrajectory = /trajectory|trajectoire|arc|ligne|vertical|horizontal|descente|montée|rotation/i.test(description);
  const hasMuscles = /muscle|activation|contraction|highlight|rouge|pectoral|dorsal|quadriceps|fessier/i.test(description);
  const hasTechnical = /alignment|alignement|neutral|neutre|spine|colonne|scapula|genou|coude/i.test(description);
  const hasView = /view|vue|side|lateral|front|profil|angle|perspective|diptych/i.test(description);

  if (hasStartingPos) score += 15;
  if (hasEquipment) score += 15;
  if (hasTrajectory) score += 20;
  if (hasMuscles) score += 15;
  if (hasTechnical) score += 10;
  if (hasView) score += 5;

  // Bonus for phases and positions
  if (phases.length >= 3) score = Math.min(score + 5, 100);
  if (positions.length >= 3) score = Math.min(score + 5, 100);

  return Math.min(score, 100);
}

/**
 * Process a single sprint (batch of exercises)
 */
async function processSprint(sprintNumber: number, batchSize: number = 220): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🏃 SPRINT ${sprintNumber} - Enrichissement de ${batchSize} exercices`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  try {
    // Get exercises for this sprint
    const { data: exercises, error } = await supabase
      .rpc('get_exercises_for_enrichment_batch', {
        p_batch_size: batchSize,
        p_sprint_number: sprintNumber
      });

    if (error) {
      console.error(`❌ Erreur récupération exercices:`, error);
      return;
    }

    if (!exercises || exercises.length === 0) {
      console.log(`✅ Aucun exercice à enrichir pour ce sprint`);
      return;
    }

    console.log(`📊 ${exercises.length} exercices récupérés`);
    console.log(`🎯 Disciplines: ${[...new Set(exercises.map((e: any) => e.discipline))].join(', ')}\n`);

    // Enrich each exercise
    const results: EnrichmentResult[] = [];
    const enrichedExercises: any[] = [];

    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];

      // Show progress every 20 exercises
      if ((i + 1) % 20 === 0 || i === 0 || i === exercises.length - 1) {
        console.log(`⚙️  Processing ${i + 1}/${exercises.length}: ${exercise.name}`);
      }

      const result = generateEnrichedDescription(exercise);
      results.push(result);

      if (result.success) {
        enrichedExercises.push({
          id: result.exerciseId,
          visual_description_enriched: result.visualDescriptionEnriched,
          execution_phases: result.executionPhases,
          key_positions: result.keyPositions,
          recommended_view_angle: result.recommendedViewAngle,
          recommended_visual_style: result.recommendedVisualStyle,
          enrichment_sprint_number: sprintNumber,
          enrichment_status: 'completed',
          enriched_at: new Date().toISOString()
        });
      }
    }

    console.log(`\n✅ Enrichissement terminé: ${results.filter(r => r.success).length}/${results.length} succès`);

    // Save to database in batches of 50
    console.log(`\n💾 Sauvegarde dans Supabase...`);

    for (let i = 0; i < enrichedExercises.length; i += 50) {
      const batch = enrichedExercises.slice(i, i + 50);

      for (const exercise of batch) {
        const { error: updateError } = await supabase
          .from('exercises')
          .update({
            visual_description_enriched: exercise.visual_description_enriched,
            execution_phases: exercise.execution_phases,
            key_positions: exercise.key_positions,
            recommended_view_angle: exercise.recommended_view_angle,
            recommended_visual_style: exercise.recommended_visual_style,
            enrichment_sprint_number: exercise.enrichment_sprint_number,
            enriched_at: exercise.enriched_at
          })
          .eq('id', exercise.id);

        if (updateError) {
          console.error(`❌ Erreur sauvegarde exercice ${exercise.id}:`, updateError);
        }
      }

      console.log(`   Batch ${Math.floor(i / 50) + 1}/${Math.ceil(enrichedExercises.length / 50)} sauvegardé`);
    }

    // Calculate statistics
    const avgQuality = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
    const avgDescLength = results.reduce((sum, r) => sum + r.visualDescriptionEnriched.length, 0) / results.length;

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n📊 STATISTIQUES SPRINT ${sprintNumber}:`);
    console.log(`   Exercices traités: ${results.length}`);
    console.log(`   Succès: ${results.filter(r => r.success).length}`);
    console.log(`   Échecs: ${results.filter(r => !r.success).length}`);
    console.log(`   Score qualité moyen: ${avgQuality.toFixed(1)}/100`);
    console.log(`   Longueur description moyenne: ${Math.round(avgDescLength)} caractères`);
    console.log(`   Durée: ${duration}s`);

    // Show examples
    const topExamples = results
      .filter(r => r.success)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 2);

    if (topExamples.length > 0) {
      console.log(`\n📝 EXEMPLES (Top Quality):`);
      topExamples.forEach((ex, idx) => {
        console.log(`\n${idx + 1}. ${ex.exerciseName} (Score: ${ex.qualityScore}/100)`);
        console.log(`   ${ex.visualDescriptionEnriched.substring(0, 150)}...`);
      });
    }

  } catch (error) {
    console.error(`❌ Erreur sprint ${sprintNumber}:`, error);
  }
}

/**
 * Run all sprints to enrich all 2665 exercises
 */
async function runAllSprints(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 DÉMARRAGE ENRICHISSEMENT COMPLET - 2665 EXERCICES');
  console.log('='.repeat(80));

  const totalStartTime = Date.now();

  // Get current statistics
  const { data: stats } = await supabase.rpc('get_enrichment_statistics');

  if (stats && stats.length > 0) {
    const s = stats[0];
    console.log(`\n📊 ÉTAT ACTUEL:`);
    console.log(`   Total exercices: ${s.total_exercises}`);
    console.log(`   Pending: ${s.pending}`);
    console.log(`   Completed: ${s.completed}`);
    console.log(`   Validated: ${s.validated}`);
    console.log(`   Completion: ${s.completion_percentage}%`);
  }

  // Run 12 sprints of 220 exercises each (2640 exercises)
  // Plus 1 final sprint for remaining exercises (25 exercises)
  for (let sprint = 1; sprint <= 12; sprint++) {
    await processSprint(sprint, 220);

    // Small delay between sprints to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final sprint for remaining exercises
  await processSprint(13, 100); // Get any remaining exercises

  // Final statistics
  console.log('\n' + '='.repeat(80));
  console.log('🎉 ENRICHISSEMENT COMPLET TERMINÉ');
  console.log('='.repeat(80));

  const { data: finalStats } = await supabase.rpc('get_enrichment_statistics');

  if (finalStats && finalStats.length > 0) {
    const s = finalStats[0];
    console.log(`\n📊 RÉSULTATS FINAUX:`);
    console.log(`   Total exercices: ${s.total_exercises}`);
    console.log(`   Enrichis (completed + validated): ${s.completed + s.validated}`);
    console.log(`   Score qualité moyen: ${s.avg_quality_score}/100`);
    console.log(`   Taux complétion: ${s.completion_percentage}%`);
  }

  const totalDuration = ((Date.now() - totalStartTime) / 1000 / 60).toFixed(1);
  console.log(`\n⏱️  Durée totale: ${totalDuration} minutes`);
  console.log('\n✅ Tous les exercices ont été enrichis avec des descriptions visuelles ultra-détaillées!');
  console.log('🎯 Objectif: 95%+ de générations d\'illustrations parfaites\n');
}

// Run if executed directly
runAllSprints().catch(console.error);

export { generateEnrichedDescription, processSprint, runAllSprints };
