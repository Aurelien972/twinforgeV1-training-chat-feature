import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../../components/UnderConstructionCard';
import PageHeader from '../../../ui/page/PageHeader';

export default function AvatarPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title="Avatar 3D"
        subtitle="Visualisez votre double numérique"
        showBackButton={false}
      />

      <UnderConstructionCard
        title="Avatar 3D Personnalisé"
        description="Le module d'avatar 3D sera bientôt disponible. Vous pourrez visualiser votre double numérique basé sur vos scans corporels et faciaux."
        features={[
          'Rendu 3D haute qualité de votre corps',
          'Visualisation des proportions et morphologie',
          'Simulation de l\'évolution physique',
          'Comparaison avant/après',
          'Personnalisation et customisation avancée'
        ]}
        ctaText="Retour à l'accueil"
        onCtaClick={() => navigate('/')}
      />
    </div>
  );
}
