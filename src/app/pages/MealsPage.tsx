import React from 'react';
import PlaceholderPage from './PlaceholderPage';

export default function MealsPage() {
  return (
    <PlaceholderPage
      title="Repas"
      subtitle="Suivi Nutritionnel & Repas"
      description="Le module de suivi des repas sera bientôt disponible. Vous pourrez enregistrer vos repas, suivre vos macros et recevoir des recommandations nutritionnelles."
      icon="UtensilsCrossed"
      color="#10B981"
      features={[
        'Scanner et reconnaissance des aliments',
        'Suivi automatique des macros',
        'Historique détaillé des repas',
        'Recommandations nutritionnelles',
        'Plans de repas personnalisés'
      ]}
    />
  );
}
