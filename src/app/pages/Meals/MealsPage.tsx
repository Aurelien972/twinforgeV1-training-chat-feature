import React from 'react';
import PlaceholderPage from '../PlaceholderPage';

export default function MealsPage() {
  return (
    <PlaceholderPage
      title="Forge Nutritionnelle"
      subtitle="Scanner & Journal de Repas"
      description="Le module de gestion des repas et de nutrition sera bientôt disponible. Vous pourrez scanner vos repas, suivre votre nutrition et analyser vos habitudes alimentaires."
      icon="Utensils"
      color="#10B981"
      features={[
        'Scan de repas avec reconnaissance IA',
        'Scan de codes-barres',
        'Suivi des macronutriments',
        'Journal alimentaire détaillé',
        'Analyses et recommandations personnalisées'
      ]}
    />
  );
}
