import type { Metadata } from 'next';
import PublicJourneysShell from './public-shell';

export const metadata: Metadata = {
  title: 'GovSync · Multi-Service Application Journeys',
  description:
    'Understand dependencies, satisfy prerequisites, and track connected Maharashtra government services and welfare schemes together.',
};

export default function JourneysPage() {
  return <PublicJourneysShell />;
}
