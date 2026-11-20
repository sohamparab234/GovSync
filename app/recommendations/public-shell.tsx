'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { LanguageMenu } from '../login';
import { siteConfig } from '../site-config';
import ServiceRecommendations from '../service-recommendations';

function PublicRecommendationsContent() {
  const { t } = useLanguage();
  const [size, setSize] = useState(100);

  useEffect(() => {
    document.documentElement.style.fontSize = size + '%';
  }, [size]);

  return (
    <div className="app-frame">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>{t('Public recommendations assistant')}</span>
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
        <Link className="brand" href="/recommendations" aria-label={t('Smart Service Recommendations')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-mark" src={siteConfig.logo} alt="" />
          <span className="brand-copy">
            <strong>{siteConfig.name}</strong>
            <span>{t('Public information portal')}</span>
          </span>
        </Link>
        <nav className="main-navigation" aria-label={t('Main navigation')}>
          <Link className="nav-item active" href="/recommendations" aria-current="page">
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
          <strong>{t('No sign-in required for Recommendations')}</strong>
        </div>
        <span>{t('Session-only questionnaire: Your answers are evaluated strictly in application memory and are never saved or stored.')}</span>
      </div>

      <main className="workspace" id="main-content" tabIndex={-1}>
        <div className="breadcrumb">
          <Link href="/">{t('Home')}</Link>
          <span aria-hidden="true">/</span>
          <strong>{t('Smart Service Recommendations')}</strong>
        </div>
        <div className="content-canvas">
          <ServiceRecommendations mode="public" />
        </div>
      </main>

      <footer className="portal-footer">
        <div className="footer-inner">
          <div>
            <strong>{siteConfig.name}</strong>
            <p>{t('Integrated government services')}</p>
          </div>
          <div className="footer-links">
            <Link href="/recommendations">{t('Recommendations')}</Link>
            <Link href="/schemes">{t('Scheme Finder')}</Link>
            <Link href="/">{t('Citizen portal')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PublicRecommendationsShell() {
  return (
    <LanguageProvider>
      <PublicRecommendationsContent />
    </LanguageProvider>
  );
}
