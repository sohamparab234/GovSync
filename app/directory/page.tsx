import type { Metadata } from 'next';
import PublicDirectoryShell from './public-shell';

export const metadata: Metadata = {
  title: 'GovSync · Maharashtra District & Government Office Directory',
  description:
    'Find verified government administrative offices, collectorates, tahsil offices, and department portals across all 36 Maharashtra districts.',
};

export default function DirectoryPage() {
  return <PublicDirectoryShell />;
}
