import React from 'react';
import PlaceholderPage from './PlaceholderPage';

export default function FridgePage() {
  return (
    <PlaceholderPage
      title="Forge Culinaire"
      subtitle="Scanner de Frigo & Recettes"
      description="Le module de gestion du frigo et de planification des repas sera bientôt disponible. Vous pourrez scanner votre frigo, gérer votre inventaire et planifier vos repas."
      icon="Refrigerator"
      color="#EC4899"
      features={[
        'Scan du frigo avec reconnaissance IA',
        'Gestion intelligente de l\'inventaire',
        'Génération de recettes adaptées',
        'Planification des repas hebdomadaire',
        'Liste de courses automatique'
      ]}
    />
  );
}
