'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { LanguageMenu } from '../login';
import { siteConfig } from '../site-config';
import MultiServiceJourneys from '../multi-service-journeys';

function PublicJourneysContent() {
  const { t } = useLanguage();
  const [size, setSize] = useState(100);

  useEffect(() => {
    document.documentElement.style.fontSize = size + '%';
  }, [size]);

  return (
    <div className="app-frame">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>{t('Connected Public Service Journeys')}</span>
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
        <Link className="brand" href="/journeys" aria-label={t('Multi-Service Application Journeys')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-mark" src={siteConfig.logo} alt="" />
          <span className="brand-copy">
            <strong>{siteConfig.name}</strong>
            <span>{t('Public information portal')}</span>
          </span>
        </Link>
        <nav className="main-navigation" aria-label={t('Main navigation')}>
          <Link className="nav-item active" href="/journeys" aria-current="page">
            {t('Service Journeys')}
          </Link>
          <Link className="nav-item" href="/recommendations">
            {t('Recommendations')}
          </Link>
          <Link className="nav-item" href="/schemes">
            {t('Scheme Finder')}
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
          <strong>{t('No sign-in required to explore Journeys')}</strong>
        </div>
        <span>{t('Understand dependencies, satisfy prerequisites, and track connected government applications together.')}</span>
      </div>

      <main className="workspace" id="main-content" tabIndex={-1}>
        <div className="breadcrumb">
          <Link href="/">{t('Home')}</Link>
          <span aria-hidden="true">/</span>
          <strong>{t('Multi-Service Application Journeys')}</strong>
        </div>
        <div className="content-canvas">
          <MultiServiceJourneys mode="public" />
        </div>
      </main>

      <footer className="portal-footer">
        <div className="footer-inner">
          <div>
            <strong>{siteConfig.name}</strong>
            <p>{t('Integrated government services')}</p>
          </div>
          <div className="footer-links">
            <Link href="/journeys">{t('Service Journeys')}</Link>
            <Link href="/recommendations">{t('Recommendations')}</Link>
            <Link href="/schemes">{t('Scheme Finder')}</Link>
            <Link href="/">{t('Citizen portal')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PublicJourneysShell() {
  return (
    <LanguageProvider>
      <PublicJourneysContent />
    </LanguageProvider>
  );
}
