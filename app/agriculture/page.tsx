import type { Metadata } from 'next';
import PublicAgricultureShell from './public-shell';

export const metadata: Metadata = {
  title: 'GovSync · Agriculture & Farmer Service Hub',
  description:
    'Access verified agricultural schemes, crop insurance, machinery subsidies, irrigation support, soil health cards, and farmer services across Maharashtra.',
};

export default function AgriculturePage() {
  return <PublicAgricultureShell />;
}
