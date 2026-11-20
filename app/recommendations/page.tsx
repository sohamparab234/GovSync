import type { Metadata } from 'next';
import PublicRecommendationsShell from './public-shell';

export const metadata: Metadata = {
  title: 'GovSync · Smart Service Recommendations',
  description:
    'Discover relevant government services and welfare schemes tailored to your specific situation and needs with our session-only discovery assistant.',
};

export default function RecommendationsPage() {
  return <PublicRecommendationsShell />;
}
