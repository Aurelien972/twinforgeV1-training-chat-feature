import React from 'react';
import PlaceholderPage from './PlaceholderPage';

export default function VitalPage() {
  return (
    <PlaceholderPage
      title="Vital"
      subtitle="Santé & Signes Vitaux"
      description="Le module de suivi des signes vitaux sera bientôt disponible. Vous pourrez suivre votre santé cardiovasculaire et vos paramètres vitaux."
      icon="Heart"
      color="#EF4444"
      features={[
        'Suivi de la fréquence cardiaque',
        'Monitoring de la pression artérielle',
        'Analyse du sommeil',
        'Suivi de la variabilité cardiaque',
        'Alertes santé personnalisées'
      ]}
    />
  );
}
