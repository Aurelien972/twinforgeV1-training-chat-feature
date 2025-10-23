import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../components/UnderConstructionCard';
import PageHeader from '../../ui/page/PageHeader';

/**
 * BodyScan - Pipeline de scan corporel
 * Point d'entrée pour le processus de scan corporel complet
 */
const BodyScan: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title="Scan Corporel"
        subtitle="Créez votre double numérique en 3D"
        showBackButton={false}
      />

      <UnderConstructionCard
        title="Scan Corporel 3D"
        description="Le module de scan corporel sera bientôt disponible. Vous pourrez créer votre avatar 3D personnalisé à partir de photos."
        features={[
          'Capture photo guidée de votre corps',
          'Reconstruction 3D haute précision',
          'Analyse des proportions et morphologie',
          'Suivi de l\'évolution physique',
          'Visualisation immersive de votre avatar'
        ]}
        ctaText="Retour à l'accueil"
        onCtaClick={() => navigate('/')}
      />
    </div>
  );
};

export default BodyScan;