import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../components/UnderConstructionCard';
import PageHeader from '../../ui/page/PageHeader';

/**
 * FridgeScanPage - Scanner de Frigo
 * Page de scan du frigo avec reconnaissance IA
 */
const FridgeScanPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title="Scanner le Frigo"
        subtitle="Reconnaissance IA de vos aliments"
        showBackButton={true}
        onBackClick={() => navigate('/fridge')}
      />

      <UnderConstructionCard
        title="Scan du Frigo IA"
        description="Cette fonctionnalité sera bientôt disponible pour scanner automatiquement le contenu de votre frigo."
        features={[
          'Reconnaissance automatique des aliments',
          'Détection des quantités',
          'Mise à jour automatique de l\'inventaire',
          'Suggestions de recettes basées sur les ingrédients',
          'Alertes de péremption'
        ]}
        ctaText="Retour"
        onCtaClick={() => navigate('/fridge')}
      />
    </div>
  );
};

export default FridgeScanPage;
