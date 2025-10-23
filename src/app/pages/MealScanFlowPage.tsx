import React from 'react';
import PlaceholderPage from './PlaceholderPage';

export default function MealScanFlowPage() {
  return (
    <PlaceholderPage
      title="Scanner un Repas"
      subtitle="Reconnaissance IA de vos plats"
      description="Cette fonctionnalité sera bientôt disponible pour scanner et analyser automatiquement vos repas."
      icon="Camera"
      color="#F59E0B"
      features={[
        'Photo et reconnaissance automatique',
        'Détection des ingrédients',
        'Calcul nutritionnel instantané',
        'Estimation des portions',
        'Ajout rapide au journal alimentaire'
      ]}
    />
  );
}
