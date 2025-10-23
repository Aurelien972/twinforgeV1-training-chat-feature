import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../../components/UnderConstructionCard';
import PageHeader from '../../../ui/page/PageHeader';

export default function MealsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title="Repas & Nutrition"
        subtitle="Planifiez vos repas et suivez votre nutrition"
        showBackButton={false}
      />

      <UnderConstructionCard
        title="Module Nutrition"
        description="Le module de gestion des repas et de nutrition sera bientôt disponible. Vous pourrez planifier vos repas, scanner vos aliments et optimiser votre nutrition."
        features={[
          'Scan de repas avec reconnaissance IA',
          'Planification de repas personnalisée',
          'Suivi des macros et micronutriments',
          'Recettes adaptées à vos objectifs',
          'Historique nutritionnel détaillé'
        ]}
        ctaText="Retour à l'accueil"
        onCtaClick={() => navigate('/')}
      />
    </div>
  );
}
