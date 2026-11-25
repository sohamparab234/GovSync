import type { Metadata } from 'next';
import PublicTransparencyShell from './public-shell';

export const metadata: Metadata = {
  title: 'GovSync · Government Transparency & Notification Centre',
  description:
    'Access verified government resolutions, official notifications, policy circulars, department announcements, and citizen notifications across Maharashtra.',
};

export default function TransparencyPage() {
  return <PublicTransparencyShell />;
}
