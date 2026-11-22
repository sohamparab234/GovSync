import type { Metadata } from 'next';
import PublicGrievanceShell from './public-shell';

export const metadata: Metadata = {
  title: 'GovSync · Unified Grievance Centre',
  description:
    'Track and manage public service grievances, check resolution updates, and access official grievance channels.',
};

export default function GrievancePage() {
  return <PublicGrievanceShell />;
}
