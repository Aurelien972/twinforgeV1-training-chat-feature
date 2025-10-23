import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../../components/UnderConstructionCard';
import PageHeader from '../../../ui/page/PageHeader';

export default function MealScanFlowPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title="Scanner un Repas"
        subtitle="Analysez votre repas avec l'IA"
        showBackButton={true}
        onBackClick={() => navigate('/meals')}
      />

      <UnderConstructionCard
        title="Scan de Repas IA"
        description="Cette fonctionnalité sera bientôt disponible pour scanner et analyser vos repas automatiquement."
        features={[
          'Reconnaissance automatique des aliments',
          'Estimation des portions',
          'Analyse nutritionnelle instantanée',
          'Suggestions d\'amélioration',
          'Historique de vos scans'
        ]}
        ctaText="Retour"
        onCtaClick={() => navigate('/meals')}
      />
    </div>
  );
}
