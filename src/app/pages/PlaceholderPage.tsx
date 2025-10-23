import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnderConstructionCard from '../components/UnderConstructionCard';
import PageHeader from '../../ui/page/PageHeader';
import { ICONS } from '../../ui/icons/registry';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  description: string;
  icon?: keyof typeof ICONS;
  color?: string;
  features?: string[];
}

/**
 * Generic Placeholder Page
 * Reusable component for all placeholder features
 */
export default function PlaceholderPage({
  title,
  subtitle,
  description,
  icon = 'Construction',
  color = '#06B6D4',
  features = []
}: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        showBackButton={true}
        onBackClick={() => navigate('/')}
      />

      <UnderConstructionCard
        title={title}
        description={description}
        icon={icon}
        color={color}
        features={features}
      />
    </div>
  );
}
