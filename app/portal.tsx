'use client';
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useLanguage } from './i18n';
import { LanguageMenu } from './login';
import { siteConfig } from './site-config';
import { services, type Service } from '@/lib/services';
import type { Account, WorkspaceContext } from '@/lib/types';
import { CitizenDashboard } from './citizen-dashboard';

export { CitizenDashboard };

export function getServiceName(serviceId: string): string {
  return services[serviceId as Service]?.name || serviceId;
}

export interface PortalHeaderProps {
  view: string;
  mode: 'citizen' | 'admin';
  move: (view: string) => void;
  home: () => void;
  logout: () => void;
  busy: boolean;
  user: Account | null;
}

export function PortalHeader({ view, mode, move, home, logout, busy, user }: PortalHeaderProps) {
  const { t } = useLanguage(), [size, setSize] = useState(100);
  useEffect(() => { document.documentElement.style.fontSize = size + '%'; }, [size]);
  const links = mode === 'admin'
    ? [['dashboard', 'Overview'], ['audit', 'Activity'], ['mapping', 'Data mappings'], ['apis', 'API registry'], ['guide', 'Developer guide']]
    : [['apply', 'Services'], ['rts', 'RTS Deadlines'], ['journeys', 'Service Journeys'], ['recommendations', 'Recommendations'], ['schemes', 'Scheme Finder'], ['applications', 'My applications'], ['consent', 'Permissions'], ['audit', 'Activity'], ['resources', 'Help']];

  return (
    <>
      <div className="utility-bar">
        <div className="utility-inner">
          <span>{t('Citizen services prototype')}</span>
          <div className="utility-links">
            <a className="skip-link" href="#main-content">{t('Skip to main content')}</a>
            <div className="text-size-controls">
              <button aria-label={t('Decrease text size')} disabled={size === 100} onClick={() => setSize(Math.max(100, size - 25))}>A−</button>
              <button aria-label={t('Reset text size')} onClick={() => setSize(100)}>A</button>
              <button aria-label={t('Increase text size')} disabled={size === 200} onClick={() => setSize(Math.min(200, size + 25))}>A+</button>
            </div>
          </div>
        </div>
      </div>
      <header className="masthead">
        <button className="brand" onClick={home} aria-label={t('Home')}>
          <img className="brand-mark" src={siteConfig.logo} alt="" />
          <span className="brand-copy">
            <strong>{siteConfig.name}</strong>
            <span>{t(mode === 'admin' ? 'Administration' : 'Citizen portal')}</span>
          </span>
        </button>
        <nav className="main-navigation" aria-label={t('Main navigation')}>
          {links.map(([id, label]) => (
            <button
              className={'nav-item ' + (view === id ? 'active' : '')}
              key={id}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => id === 'apply' ? home() : move(id)}
            >
              {t(label)}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <LanguageMenu />
          <button className="btn logout" onClick={logout} disabled={busy}>
            <LogOut size={17} />{t('Sign out')}
          </button>
        </div>
      </header>
      <div className="account-strip">
        <div>
          <span>{t(mode === 'admin' ? 'Administration workspace' : 'Citizen workspace')}</span>
          <strong>{user?.name || ''}</strong>
        </div>
        <span>{t('Sample records only. No live government integration.')}</span>
      </div>
    </>
  );
}

export function PortalHome({ ctx: c, query, clearSearch }: { ctx: WorkspaceContext; query?: string; clearSearch?: () => void }) {
  return <CitizenDashboard ctx={c} query={query} clearSearch={clearSearch} />;
}

export function PortalResources({ ctx: c }: { ctx: WorkspaceContext }) {
  const { t } = useLanguage();
  return (
    <div className="resources-layout">
      <section className="panel">
        <div className="panel-head"><h2>{t('How to apply')}</h2></div>
        <div className="panel-body">
          <ol className="help-steps">
            <li><strong>{t('Choose your service')}</strong><p>{t('Select Scholarship or Residence and choose a sample applicant.')}</p></li>
            <li><strong>{t('Review and give permission')}</strong><p>{t('Choose the required sources and review the information before submission.')}</p></li>
            <li><strong>{t('Follow your application')}</strong><p>{t('Open My applications to view decisions, respond to clarification or download an approved demo certificate.')}</p></li>
          </ol>
          <button className="btn primary" onClick={() => c.reset()}>{t('Explore services')}</button>
        </div>
      </section>
      <section className="panel" id="about">
        <div className="panel-head"><h2>{t('About this prototype')}</h2></div>
        <div className="panel-body">
          <p>{t('GovSync demonstrates consent-based information sharing between sample departments.')}</p>
          <p className="section-gap">{t('It uses fictional records and does not issue government documents or send email or SMS.')}</p>
          <p className="section-gap">{t('Your saved applications, permissions and activity are available in this workspace.')}</p>
          <button className="btn section-gap" onClick={() => c.move('consent')}>{t('Manage your consent')}</button>
        </div>
      </section>
    </div>
  );
}

export function PortalFooter({ mode, move, home }: { mode: 'citizen' | 'admin'; move: (v: string) => void; home: () => void }) {
  const { t } = useLanguage();
  return (
    <footer className="portal-footer">
      <div className="footer-inner">
        <div>
          <strong>{siteConfig.name}</strong>
          <p>{t('Integrated government services')}</p>
        </div>
        <div className="footer-links">
          <button onClick={home}>{t(mode === 'admin' ? 'Overview' : 'Services')}</button>
          {mode === 'citizen' && (
            <>
              <button onClick={() => move('rts')}>{t('RTS Deadlines')}</button>
              <button onClick={() => move('journeys')}>{t('Service Journeys')}</button>
              <button onClick={() => move('recommendations')}>{t('Recommendations')}</button>
              <button onClick={() => move('schemes')}>{t('Scheme Finder')}</button>
            </>
          )}
          <button onClick={() => move(mode === 'admin' ? 'guide' : 'resources')}>
            {t(mode === 'admin' ? 'Developer guide' : 'Help and about')}
          </button>
        </div>
      </div>
    </footer>
  );
}
