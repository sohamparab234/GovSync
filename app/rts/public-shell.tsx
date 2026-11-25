'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { LanguageMenu } from '../login';
import { siteConfig } from '../site-config';
import RtsAssistant from '../rts-assistant';

function PublicRtsContent() {
  const { t } = useLanguage();
  const [size, setSize] = useState(100);

  useEffect(() => {
    document.documentElement.style.fontSize = size + '%';
  }, [size]);

  return (
    <div className="app-frame">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>{t('Statutory Delivery Deadlines')}</span>
          <div className="utility-links">
            <a className="skip-link" href="#main-content">
              {t('Skip to main content')}
            </a>
            <div className="text-size-controls">
              <button
                type="button"
                aria-label={t('Decrease text size')}
                disabled={size === 100}
                onClick={() => setSize(Math.max(100, size - 25))}
              >
                A−
              </button>
              <button
                type="button"
                aria-label={t('Reset text size')}
                aria-pressed={size === 100}
                onClick={() => setSize(100)}
              >
                A
              </button>
              <button
                type="button"
                aria-label={t('Increase text size')}
                disabled={size === 200}
                onClick={() => setSize(Math.min(200, size + 25))}
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      <header className="masthead">
        <Link className="brand" href="/rts" aria-label={t('RTS Deadline & Escalation Assistant')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-mark" src={siteConfig.logo} alt="" />
          <span className="brand-copy">
            <strong>{siteConfig.name}</strong>
            <span>{t('Public information portal')}</span>
          </span>
        </Link>
        <nav className="main-navigation" aria-label={t('Main navigation')}>
          <Link className="nav-item active" href="/rts" aria-current="page">
            {t('RTS Deadlines')}
          </Link>
          <Link className="nav-item" href="/journeys">
            {t('Service Journeys')}
          </Link>
          <Link className="nav-item" href="/recommendations">
            {t('Recommendations')}
          </Link>
          <Link className="nav-item" href="/schemes">
            {t('Scheme Finder')}
          </Link>
          <Link className="nav-item" href="/grievances">
            {t('Grievance Centre')}
          </Link>
          <Link className="nav-item" href="/directory">
            {t('Directory')}
          </Link>
          <Link className="nav-item" href="/">
            {t('Citizen portal')}
          </Link>
        </nav>
        <div className="header-actions">
          <LanguageMenu />
          <Link className="btn small" href="/">
            {t('Sign in')}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="account-strip">
        <div>
          <span>{t('Public access')}</span>
          <strong>{t('Act No. XXXI of 2015')}</strong>
        </div>
        <span>
          {t(
            'Track Statutory Delivery Deadlines & Official Appeal Stages under Maharashtra Right to Public Services Act, 2015.'
          )}
        </span>
      </div>

      <main className="workspace" id="main-content" tabIndex={-1}>
        <div className="breadcrumb">
          <Link href="/">{t('Home')}</Link>
          <span aria-hidden="true">/</span>
          <strong>{t('RTS Deadline & Escalation Assistant')}</strong>
        </div>
        <div className="content-canvas">
          <RtsAssistant mode="public" />
        </div>
      </main>

      <footer className="portal-footer">
        <div className="footer-inner">
          <div>
            <strong>{siteConfig.name}</strong>
            <p>{t('Integrated government services')}</p>
          </div>
          <div className="footer-links">
            <Link href="/transparency">{t('Transparency')}</Link>
            <Link href="/agriculture">{t('Agriculture')}</Link>
            <Link href="/rts">{t('RTS Deadlines')}</Link>
            <Link href="/journeys">{t('Service Journeys')}</Link>
            <Link href="/recommendations">{t('Recommendations')}</Link>
            <Link href="/schemes">{t('Scheme Finder')}</Link>
            <Link href="/grievances">{t('Grievance Centre')}</Link>
            <Link href="/">{t('Citizen portal')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PublicRtsShell() {
  return (
    <LanguageProvider>
      <PublicRtsContent />
    </LanguageProvider>
  );
}
