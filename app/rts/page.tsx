import type { Metadata } from 'next';
import PublicRtsShell from './public-shell';

export const metadata: Metadata = {
  title: 'GovSync · RTS Deadline & Escalation Assistant',
  description:
    'Track statutory service delivery deadlines and official appeal stages under the Maharashtra Right to Public Services Act, 2015.',
};

export default function RtsPage() {
  return <PublicRtsShell />;
}
