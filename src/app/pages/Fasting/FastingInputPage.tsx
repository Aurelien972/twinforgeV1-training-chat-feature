import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../../components/UnderConstructionCard';
import PageHeader from '../../../ui/page/PageHeader';

export default function FastingInputPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title="Nouvelle Session de Jeûne"
        subtitle="Enregistrez une nouvelle période de jeûne"
        showBackButton={true}
        onBackClick={() => navigate('/fasting')}
      />

      <UnderConstructionCard
        title="Saisie de Session de Jeûne"
        description="Cette fonctionnalité sera bientôt disponible pour enregistrer vos sessions de jeûne."
        features={[
          'Enregistrement manuel des sessions',
          'Timer de jeûne en temps réel',
          'Suivi des sensations et notes',
          'Notifications et rappels',
          'Synchronisation avec vos objectifs'
        ]}
        ctaText="Retour"
        onCtaClick={() => navigate('/fasting')}
      />
    </div>
  );
}
