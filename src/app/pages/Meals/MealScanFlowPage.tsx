import React from 'react';
import PlaceholderPage from '../PlaceholderPage';

export default function MealScanFlowPage() {
  return (
    <PlaceholderPage
      title="Scanner un Repas"
      subtitle="Reconnaissance IA de vos aliments"
      description="Scannez vos repas pour une analyse nutritionnelle instantanée et un suivi précis de votre alimentation."
      icon="Camera"
      color="#10B981"
      features={[
        'Reconnaissance automatique des aliments',
        'Estimation des portions',
        'Calcul automatique des calories',
        'Analyse des macronutriments',
        'Ajout au journal alimentaire'
      ]}
    />
  );
}
