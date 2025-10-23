import React from 'react';
import PlaceholderPage from './PlaceholderPage';

export default function FaceScanPage() {
  return (
    <PlaceholderPage
      title="Face Scan"
      subtitle="Scanner Facial 3D"
      description="Le module de scan facial 3D sera bientôt disponible. Vous pourrez créer un modèle 3D précis de votre visage."
      icon="ScanFace"
      color="#8B5CF6"
      features={[
        'Scan 3D haute résolution du visage',
        'Détection des proportions faciales',
        'Analyse des traits et symétrie',
        'Suivi de l\'évolution du visage',
        'Export pour avatar 3D'
      ]}
    />
  );
}
