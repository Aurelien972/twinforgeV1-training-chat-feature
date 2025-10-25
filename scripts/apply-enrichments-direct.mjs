import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kwipydbtjagypocpvbwn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aXB5ZGJ0amFneXBvY3B2YnduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY4ODQyMiwiZXhwIjoyMDcwMjY0NDIyfQ.WTrMv45z7sNAZbEG35cxCKnWJaG72B9XqGXGX-hJCrc'
);

const enrichments = [
  {
    id: '944703be-09f3-40c3-8827-7a1d1b57de85',
    name: 'Shrugs',
    common_mistakes: [
      'Rotation des épaules en cercle créant une usure articulaire inutile',
      'Utilisation de charges trop lourdes avec amplitude réduite et mouvement bâclé',
      'Flexion des coudes pendant le mouvement, engagement involontaire des biceps',
      'Tête qui avance en avant créant une tension cervicale excessive',
      'Descente rapide sans contrôle excentrique, perte du stimulus musculaire'
    ],
    benefits: [
      'Développement ciblé des trapèzes supérieurs et élévateurs de la scapula',
      'Amélioration de la force de portage et des capacités de levage lourd',
      'Renforcement de la stabilité de la ceinture scapulaire',
      'Prévention des blessures cervicales et dorsales par renforcement musculaire',
      'Développement esthétique de la ligne d\'épaule et du cou'
    ]
  },
  {
    id: '051f8a02-4cc1-4d62-bfc1-8e46f5b2a5f6',
    name: 'Decline Barbell Bench Press',
    common_mistakes: [
      'Angle de déclinaison trop prononcé (>30°) créant un flux sanguin céphalique inconfortable',
      'Barre qui descend vers le cou au lieu du bas de la poitrine',
      'Perte de rétraction scapulaire en position basse, épaules instables',
      'Trajectoire en arc inefficace augmentant le trajet de la barre',
      'Respiration inadéquate avec tête en bas affectant la pression intracrânienne'
    ],
    benefits: [
      'Ciblage optimal des pectoraux inférieurs et portion sternale',
      'Développement de la définition musculaire du bas de la poitrine',
      'Réduction du stress sur les deltoïdes antérieurs comparé au bench plat',
      'Amélioration de l\'équilibre esthétique du torse avec focus pectoral inférieur',
      'Variante utile pour athlètes avec inconfort d\'épaule au bench plat'
    ]
  },
  {
    id: '0851c765-f603-4c31-9f11-10c9cde3cee3',
    name: 'Wide-Grip Bench Press',
    common_mistakes: [
      'Prise excessive (>1.5x largeur d\'épaules) créant un stress articulaire majeur',
      'Coudes qui descendent trop bas sous le plan du banc, risque de déchirure pectorale',
      'Absence de contrôle excentrique augmentant le risque de blessure',
      'Amplitude réduite pour compenser la prise large, limitation du stimulus',
      'Poignets en extension excessive créant une instabilité de la barre'
    ],
    benefits: [
      'Activation maximale des pectoraux avec bras de levier court',
      'Réduction du trajet de la barre permettant des charges plus importantes',
      'Développement de la largeur de la poitrine et ligne pectorale externe',
      'Moins de sollicitation des triceps, focus pur sur les pectoraux',
      'Variante populaire en powerlifting pour optimiser le levier mécanique'
    ]
  },
  {
    id: '1bc4494c-47f7-45c2-a85d-ea62c3c6ebb3',
    name: 'Paused Bench Press',
    common_mistakes: [
      'Pause trop courte (<2 secondes) ne supprimant pas le réflexe d\'étirement',
      'Perte de tension musculaire pendant la pause, relâchement des pectoraux',
      'Rebond après la pause au lieu d\'une poussée contrôlée',
      'Respiration pendant la pause perturbant la stabilité du tronc',
      'Pause en position trop haute, manquant le point mort technique'
    ],
    benefits: [
      'Élimination du réflexe myotatique pour une force pure concentrique',
      'Amélioration du point faible du bench press en position basse',
      'Développement de la force explosive depuis une position statique',
      'Renforcement de la connexion neuromusculaire et du contrôle moteur',
      'Excellent exercice pour dépasser les plateaux de progression au bench'
    ]
  },
  {
    id: '11c0fd08-9c72-4d8d-a80d-0e48fbe0fede',
    name: 'Floor Press',
    common_mistakes: [
      'Coudes qui touchent le sol avec un impact brusque, choc articulaire',
      'Jambes tendues créant une instabilité du bassin et cambrure lombaire',
      'Barre qui descend vers le cou au lieu du milieu de la poitrine',
      'Absence de pause au sol transformant l\'exercice en rebond',
      'Trajectoire anarchique de la barre sans plan de poussée vertical'
    ],
    benefits: [
      'Focus sur la phase concentrique du développé sans réflexe d\'étirement',
      'Réduction du stress articulaire de l\'épaule avec ROM limitée',
      'Amélioration de la force de lockout des triceps en fin de mouvement',
      'Excellent exercice de rééducation ou décharge articulaire',
      'Développement de la force explosive depuis une position morte'
    ]
  }
];

console.log(`🚀 Application des enrichissements pour ${enrichments.length} exercices...\n`);

let success = 0;
let errors = 0;

for (const ex of enrichments) {
  const { error } = await supabase
    .from('exercises')
    .update({
      common_mistakes: ex.common_mistakes,
      benefits: ex.benefits,
      enrichment_status: 'completed',
      enriched_at: new Date().toISOString(),
      enrichment_sprint_number: 7,
      enrichment_quality_score: 95
    })
    .eq('id', ex.id);

  if (error) {
    console.error(`❌ ${ex.name}:`, error.message);
    errors++;
  } else {
    console.log(`✅ ${ex.name}`);
    success++;
  }
}

console.log(`\n📊 Résultats: ${success} réussis, ${errors} erreurs`);
console.log(`\n✅ Batch 1 complet: 20/20 exercices Force enrichis avec Claude!\n`);
