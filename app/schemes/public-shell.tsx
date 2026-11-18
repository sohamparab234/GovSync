'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { LanguageMenu } from '../login';
import { siteConfig } from '../site-config';
import SchemeFinder from '../scheme-finder';

function PublicSchemesContent() {
  const { t } = useLanguage();
  const [size, setSize] = useState(100);

  useEffect(() => {
    document.documentElement.style.fontSize = size + '%';
  }, [size]);

  return (
    <div className="app-frame">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>{t('Public government scheme directory')}</span>
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
        <Link className="brand" href="/schemes" aria-label={t('Government Scheme Finder')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-mark" src={siteConfig.logo} alt="" />
          <span className="brand-copy">
            <strong>{siteConfig.name}</strong>
            <span>{t('Public information portal')}</span>
          </span>
        </Link>
        <nav className="main-navigation" aria-label={t('Main navigation')}>
          <Link className="nav-item active" href="/schemes" aria-current="page">
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
          <strong>{t('No sign-in required for Scheme Finder')}</strong>
        </div>
        <span>{t('Official links open verified government portals.')}</span>
      </div>

      <main className="workspace" id="main-content" tabIndex={-1}>
        <div className="breadcrumb">
          <Link href="/">{t('Home')}</Link>
          <span aria-hidden="true">/</span>
          <strong>{t('Scheme Finder')}</strong>
        </div>
        <div className="content-canvas">
          <SchemeFinder mode="public" />
        </div>
      </main>

      <footer className="portal-footer">
        <div className="footer-inner">
          <div>
            <strong>{siteConfig.name}</strong>
            <p>{t('Integrated government services')}</p>
          </div>
          <div className="footer-links">
            <Link href="/schemes">{t('Scheme Finder')}</Link>
            <Link href="/">{t('Citizen portal')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PublicSchemesShell() {
  return (
    <LanguageProvider>
      <PublicSchemesContent />
    </LanguageProvider>
  );
}
