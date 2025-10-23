import React from 'react';
import PlaceholderPage from '../PlaceholderPage';

export default function BodyScanPage() {
  return (
    <PlaceholderPage
      title="Body Scan 3D"
      subtitle="Scanner Corporel Complet"
      description="Le module de scan corporel 3D sera bientôt disponible. Vous pourrez créer un modèle 3D précis de votre corps à partir de photos."
      icon="Camera"
      color="#3B82F6"
      features={[
        'Scan 3D haute précision du corps',
        'Mesures corporelles automatiques',
        'Suivi de l\'évolution morphologique',
        'Comparaison temporelle',
        'Export des données anthropométriques'
      ]}
    />
  );
}
