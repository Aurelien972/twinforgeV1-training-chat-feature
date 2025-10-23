import React from 'react';
import PlaceholderPage from './PlaceholderPage';

export default function FridgeScanPage() {
  return (
    <PlaceholderPage
      title="Scanner le Frigo"
      subtitle="Reconnaissance IA de vos aliments"
      description="Cette fonctionnalité sera bientôt disponible pour scanner automatiquement le contenu de votre frigo."
      icon="Camera"
      color="#22C55E"
      features={[
        'Reconnaissance automatique des aliments',
        'Détection des quantités',
        'Mise à jour automatique de l\'inventaire',
        'Suggestions de recettes basées sur les ingrédients',
        'Alertes de péremption'
      ]}
    />
  );
}
