import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeTranslations() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SPRINT 8 - ANALYSE TRADUCTIONS & INTERNATIONALISATION');
  console.log('='.repeat(80) + '\n');

  // 1. Analyser exercise_translations table
  console.log('📊 EXERCISE TRANSLATIONS TABLE\n');

  const { data: translations, error: transError } = await supabase
    .from('exercise_translations')
    .select('*', { count: 'exact' });

  if (transError) {
    console.log('   ⚠️  Table exercise_translations non trouvée ou vide');
    console.log('   Erreur:', transError.message);
  } else if (translations && translations.length > 0) {
    console.log(`   ✅ ${translations.length} traductions trouvées`);

    // Grouper par langue
    const byLanguage = translations.reduce((acc: Record<string, number>, t) => {
      acc[t.language_code] = (acc[t.language_code] || 0) + 1;
      return acc;
    }, {});

    console.log('   Répartition par langue:');
    Object.entries(byLanguage).forEach(([lang, count]) => {
      console.log(`     ${lang}: ${count}`);
    });

    // Exemple de structure
    if (translations.length > 0) {
      console.log('\n   Structure exemple:');
      const example = translations[0];
      console.log('   Colonnes:', Object.keys(example));
    }
  } else {
    console.log('   ⚠️  Aucune traduction trouvée');
  }

  // 2. Analyser les exercices et leurs champs multilingues
  console.log('\n📊 EXERCICES - CONTENU MULTILINGUE\n');

  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      name_en,
      description_short,
      description_long,
      coaching_cues,
      safety_notes,
      common_mistakes,
      benefits,
      discipline,
      category
    `)
    .eq('is_active', true)
    .limit(1000);

  if (exError || !exercises) {
    console.error('❌ Erreur récupération exercices:', exError);
    return;
  }

  console.log(`   Total exercices analysés: ${exercises.length}\n`);

  // Statistiques de traduction
  const stats = {
    withNameEN: 0,
    withDescriptionShort: 0,
    withDescriptionLong: 0,
    withCoachingCues: 0,
    withSafetyNotes: 0,
    withCommonMistakes: 0,
    withBenefits: 0,
    avgCoachingCues: 0,
    avgSafetyNotes: 0,
    avgCommonMistakes: 0,
    avgBenefits: 0
  };

  let totalCoachingCues = 0;
  let totalSafetyNotes = 0;
  let totalCommonMistakes = 0;
  let totalBenefits = 0;

  exercises.forEach(ex => {
    if (ex.name_en) stats.withNameEN++;
    if (ex.description_short) stats.withDescriptionShort++;
    if (ex.description_long) stats.withDescriptionLong++;
    if (ex.coaching_cues && ex.coaching_cues.length > 0) {
      stats.withCoachingCues++;
      totalCoachingCues += ex.coaching_cues.length;
    }
    if (ex.safety_notes && ex.safety_notes.length > 0) {
      stats.withSafetyNotes++;
      totalSafetyNotes += ex.safety_notes.length;
    }
    if (ex.common_mistakes && ex.common_mistakes.length > 0) {
      stats.withCommonMistakes++;
      totalCommonMistakes += ex.common_mistakes.length;
    }
    if (ex.benefits && ex.benefits.length > 0) {
      stats.withBenefits++;
      totalBenefits += ex.benefits.length;
    }
  });

  stats.avgCoachingCues = stats.withCoachingCues > 0 ? totalCoachingCues / stats.withCoachingCues : 0;
  stats.avgSafetyNotes = stats.withSafetyNotes > 0 ? totalSafetyNotes / stats.withSafetyNotes : 0;
  stats.avgCommonMistakes = stats.withCommonMistakes > 0 ? totalCommonMistakes / stats.withCommonMistakes : 0;
  stats.avgBenefits = stats.withBenefits > 0 ? totalBenefits / stats.withBenefits : 0;

  const pct = (count: number) => ((count / exercises.length) * 100).toFixed(1);

  console.log('   Couverture Contenu Bilingue:');
  console.log(`     Nom Anglais (name_en): ${stats.withNameEN} (${pct(stats.withNameEN)}%)`);
  console.log(`     Description Courte: ${stats.withDescriptionShort} (${pct(stats.withDescriptionShort)}%)`);
  console.log(`     Description Longue: ${stats.withDescriptionLong} (${pct(stats.withDescriptionLong)}%)`);
  console.log(`     Coaching Cues: ${stats.withCoachingCues} (${pct(stats.withCoachingCues)}%) - Avg: ${stats.avgCoachingCues.toFixed(1)}`);
  console.log(`     Safety Notes: ${stats.withSafetyNotes} (${pct(stats.withSafetyNotes)}%) - Avg: ${stats.avgSafetyNotes.toFixed(1)}`);
  console.log(`     Common Mistakes: ${stats.withCommonMistakes} (${pct(stats.withCommonMistakes)}%) - Avg: ${stats.avgCommonMistakes.toFixed(1)}`);
  console.log(`     Benefits: ${stats.withBenefits} (${pct(stats.withBenefits)}%) - Avg: ${stats.avgBenefits.toFixed(1)}`);

  // Analyse par discipline
  console.log('\n📊 COUVERTURE PAR DISCIPLINE:\n');

  const byDiscipline: Record<string, any> = {};

  exercises.forEach(ex => {
    if (!byDiscipline[ex.discipline]) {
      byDiscipline[ex.discipline] = {
        total: 0,
        withNameEN: 0,
        withDescShort: 0,
        withCoachingCues: 0,
        withSafetyNotes: 0
      };
    }
    byDiscipline[ex.discipline].total++;
    if (ex.name_en) byDiscipline[ex.discipline].withNameEN++;
    if (ex.description_short) byDiscipline[ex.discipline].withDescShort++;
    if (ex.coaching_cues?.length > 0) byDiscipline[ex.discipline].withCoachingCues++;
    if (ex.safety_notes?.length > 0) byDiscipline[ex.discipline].withSafetyNotes++;
  });

  Object.entries(byDiscipline).forEach(([disc, data]) => {
    const d = data as any;
    console.log(`   ${disc.toUpperCase()}: ${d.total} exercices`);
    console.log(`     - Name EN: ${d.withNameEN} (${((d.withNameEN / d.total) * 100).toFixed(1)}%)`);
    console.log(`     - Desc Short: ${d.withDescShort} (${((d.withDescShort / d.total) * 100).toFixed(1)}%)`);
    console.log(`     - Coaching Cues: ${d.withCoachingCues} (${((d.withCoachingCues / d.total) * 100).toFixed(1)}%)`);
    console.log(`     - Safety Notes: ${d.withSafetyNotes} (${((d.withSafetyNotes / d.total) * 100).toFixed(1)}%)`);
  });

  // Exemples de contenu bilingue
  console.log('\n📋 EXEMPLES CONTENU BILINGUE:\n');

  const withBilingual = exercises.filter(ex =>
    ex.name_en &&
    ex.description_short &&
    ex.coaching_cues?.length >= 2 &&
    ex.safety_notes?.length >= 2
  );

  console.log(`   Exercices avec contenu bilingue riche: ${withBilingual.length} (${pct(withBilingual.length)}%)\n`);

  if (withBilingual.length > 0) {
    const example = withBilingual[0];
    console.log(`   Exemple: ${example.name} / ${example.name_en}`);
    console.log(`     Description: ${example.description_short?.substring(0, 80)}...`);
    console.log(`     Coaching Cues (${example.coaching_cues?.length}): ${example.coaching_cues?.slice(0, 2).join(', ')}...`);
    console.log(`     Safety Notes (${example.safety_notes?.length}): ${example.safety_notes?.slice(0, 1)}...`);
  }

  // Identifier exercices prioritaires sans traduction
  console.log('\n📊 EXERCICES PRIORITAIRES SANS TRADUCTION:\n');

  const priorityWithoutTranslation = exercises.filter(ex =>
    !ex.name_en &&
    ex.discipline &&
    ['force', 'calisthenics', 'functional', 'endurance'].includes(ex.discipline.toLowerCase())
  );

  console.log(`   Total exercices prioritaires sans name_en: ${priorityWithoutTranslation.length}`);

  const priorityByDiscipline = priorityWithoutTranslation.reduce((acc: Record<string, number>, ex) => {
    acc[ex.discipline] = (acc[ex.discipline] || 0) + 1;
    return acc;
  }, {});

  Object.entries(priorityByDiscipline).forEach(([disc, count]) => {
    console.log(`     ${disc}: ${count}`);
  });

  // Lacunes identifiées
  console.log('\n' + '='.repeat(80));
  console.log('🎯 LACUNES & OBJECTIFS SPRINT 8');
  console.log('='.repeat(80));

  const gaps = [];

  if (stats.withNameEN < exercises.length * 0.9) {
    gaps.push(`📍 Nom Anglais: ${pct(stats.withNameEN)}% → Objectif: 95%+ (500+ exercices)`);
  }
  if (stats.withDescriptionShort < exercises.length * 0.8) {
    gaps.push(`📍 Description Courte: ${pct(stats.withDescriptionShort)}% → Objectif: 90%+`);
  }
  if (stats.withDescriptionLong < exercises.length * 0.5) {
    gaps.push(`📍 Description Longue: ${pct(stats.withDescriptionLong)}% → Objectif: 70%+`);
  }
  if (stats.withCoachingCues < exercises.length * 0.5) {
    gaps.push(`📍 Coaching Cues: ${pct(stats.withCoachingCues)}% → Objectif: 80%+`);
  }
  if (stats.withSafetyNotes < exercises.length * 0.9) {
    gaps.push(`📍 Safety Notes: ${pct(stats.withSafetyNotes)}% → Objectif: 100%`);
  }

  console.log('\n🎯 LACUNES PRIORITAIRES:');
  if (gaps.length === 0) {
    console.log('   ✅ Traductions bien couvertes!');
  } else {
    gaps.forEach(gap => console.log(`   ${gap}`));
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 PLAN D\'INTERNATIONALISATION');
  console.log('='.repeat(80));
  console.log(`
1. TRADUCTIONS FR-EN EXERCICES (500+ prioritaires):
   - Force: Noms anglais standardisés (Squat, Bench Press, Deadlift)
   - Calisthenics: Terminologie internationale (Pull-up, Muscle-up, Planche)
   - Functional: WODs et formats CrossFit (Fran, Murph, AMRAP)
   - Endurance: Protocoles universels (Intervals, Tempo Run, Fartlek)
   - Competitions: Formats HYROX, DEKA, OCR anglais

2. DESCRIPTIONS BILINGUES:
   - Description courte (50-100 caractères): FR + EN
   - Description longue (200-500 caractères): FR + EN
   - Focus sur clarté et précision technique

3. COACHING CUES BILINGUES:
   - 3-5 cues par exercice minimum
   - Vocabulaire coaching international
   - Consignes techniques précises
   - FR: "Pousse à travers les talons" → EN: "Drive through your heels"

4. SAFETY NOTES BILINGUES:
   - Contraindications: FR + EN
   - Points de sécurité critiques
   - Adaptations nécessaires
   - FR: "Éviter si douleur lombaire" → EN: "Avoid if lower back pain"

5. NOMENCLATURE STANDARDISÉE:
   - Glossaire technique FR-EN:
     • Anatomie: muscles, articulations, plans
     • Mouvements: push, pull, hinge, squat, lunge
     • Équipement: barbell, dumbbells, kettlebell, rings
     • Intensité: RX, scaled, beginner, advanced
     • Formats: EMOM, AMRAP, For Time, Rounds

6. SYNONYMES & TERMES ALTERNATIFS:
   - Recherche multilingue:
     • "Tractions" = "Pull-ups" = "Chin-ups"
     • "Développé couché" = "Bench Press"
     • "Soulevé de terre" = "Deadlift"
   - Variations régionales:
     • US: "Burpees" vs UK: "Squat Thrusts"

7. COHÉRENCE TERMINOLOGIQUE:
   - Standards par discipline
   - Validation croisée FR-EN
   - Éviter incohérences (même exercice, noms différents)

8. GLOSSAIRE TECHNIQUE BILINGUE:
   - 200+ termes essentiels
   - Catégories:
     • Anatomie (muscles, joints)
     • Mouvements patterns
     • Équipement
     • Formats & protocols
     • Scaling options
  `);

  console.log('='.repeat(80));
  console.log('\n✅ ANALYSE COMPLÉTÉE');
}

analyzeTranslations().catch(console.error);
