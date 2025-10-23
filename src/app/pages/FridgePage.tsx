import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../components/UnderConstructionCard';
import PageHeader from '../../ui/page/PageHeader';

/**
 * FridgePage - Forge Culinaire
 * Module de gestion d'inventaire, recettes et courses
 */
const FridgePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title="Forge Culinaire"
        subtitle="Gérez votre inventaire et planifiez vos repas"
        showBackButton={false}
      />

      <UnderConstructionCard
        title="Module Frigo & Cuisine"
        description="Le module de gestion du frigo et de planification des repas sera bientôt disponible. Vous pourrez scanner votre frigo, gérer votre inventaire et planifier vos repas."
        features={[
          'Scan du frigo avec reconnaissance IA',
          'Gestion intelligente de l\'inventaire',
          'Génération de recettes adaptées',
          'Planification des repas hebdomadaire',
          'Liste de courses automatique'
        ]}
        ctaText="Retour à l'accueil"
        onCtaClick={() => navigate('/')}
      />
    </div>
  );
};

export default FridgePage;
