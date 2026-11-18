import type { Metadata } from 'next';
import PublicSchemesShell from './public-shell';

export const metadata: Metadata = {
  title: 'GovSync · Government Scheme Finder',
  description:
    'Discover Maharashtra State and Central Government welfare schemes, review official eligibility criteria, and access verified government application portals.',
};

export default function SchemesPage() {
  return <PublicSchemesShell />;
}
