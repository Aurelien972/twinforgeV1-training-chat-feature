import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../../components/UnderConstructionCard';
import PageHeader from '../../../ui/page/PageHeader';

export default function FastingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title="Jeûne Intermittent"
        subtitle="Suivez vos périodes de jeûne et optimisez votre santé métabolique"
        showBackButton={false}
      />

      <UnderConstructionCard
        title="Jeûne Intermittent"
        description="Le module de suivi du jeûne intermittent sera bientôt disponible. Vous pourrez suivre vos périodes de jeûne, analyser vos résultats et optimiser votre pratique."
        features={[
          'Suivi des périodes de jeûne en temps réel',
          'Analyse des bienfaits métaboliques',
          'Conseils personnalisés basés sur vos objectifs',
          'Historique et progression détaillée',
          'Intégration avec vos données nutritionnelles'
        ]}
        ctaText="Retour à l'accueil"
        onCtaClick={() => navigate('/')}
      />
    </div>
  );
}
