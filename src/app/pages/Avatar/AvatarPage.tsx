import React from 'react';
import PlaceholderPage from '../PlaceholderPage';

export default function AvatarPage() {
  return (
    <PlaceholderPage
      title="Mon Twin"
      subtitle="Avatar 3D Personnalisé"
      description="Le module d'avatar 3D sera bientôt disponible. Vous pourrez visualiser votre double numérique basé sur vos scans corporels et faciaux."
      icon="User"
      color="#A855F7"
      features={[
        'Rendu 3D haute qualité de votre corps',
        'Visualisation des proportions et morphologie',
        'Simulation de l\'évolution physique',
        'Comparaison avant/après',
        'Personnalisation et customisation avancée'
      ]}
    />
  );
}
