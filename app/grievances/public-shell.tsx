'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ExternalLink,
  LifeBuoy,
  Search,
  Scale,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { LanguageMenu } from '../login';
import { siteConfig } from '../site-config';
import { GRIEVANCE_CATEGORIES, GRIEVANCE_STATUSES, type GrievanceRecord } from '@/lib/grievances';

function PublicGrievanceContent() {
  const { t, date } = useLanguage();
  const [size, setSize] = useState(100);
  const [lookupRef, setLookupRef] = useState('');
  const [searching, setSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState<GrievanceRecord | null>(null);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    document.documentElement.style.fontSize = size + '%';
  }, [size]);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const query = lookupRef.trim().toUpperCase();
    if (!query) return;

    setSearching(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await fetch(`/api/grievances?referenceNumber=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('Grievance reference not found or sign in required to view this record.');
      }
      const data = await res.json() as { grievances: GrievanceRecord[] };
      if (!data.grievances || data.grievances.length === 0) {
        setLookupError('No grievance found with this reference number. Please verify the code or sign in.');
      } else {
        setLookupResult(data.grievances[0]);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setLookupError(e.message || 'Lookup failed.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="app-frame">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>{t('Unified Grievance Centre')}</span>
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
        <Link className="brand" href="/grievances" aria-label={t('Unified Grievance Centre')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-mark" src={siteConfig.logo} alt="" />
          <span className="brand-copy">
            <strong>{siteConfig.name}</strong>
            <span>{t('Public information portal')}</span>
          </span>
        </Link>
        <nav className="main-navigation" aria-label={t('Main navigation')}>
          <Link className="nav-item active" href="/grievances" aria-current="page">
            {t('Grievance Centre')}
          </Link>
          <Link className="nav-item" href="/directory">
            {t('Directory')}
          </Link>
          <Link className="nav-item" href="/rts">
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
          <strong>{t('Citizen Support & Redressal')}</strong>
        </div>
        <span>
          {t('Track service grievances, review resolution status, and access official grievance authorities.')}
        </span>
      </div>

      <main className="workspace" id="main-content" tabIndex={-1}>
        <div className="breadcrumb">
          <Link href="/">{t('Home')}</Link>
          <span aria-hidden="true">/</span>
          <strong>{t('Unified Grievance Centre')}</strong>
        </div>

        <div className="content-canvas">
          {/* 1. Official Disclaimer & Coordination Desk Statement */}
          <section className="panel receipt section-gap" style={{ borderLeft: '4px solid #B94220' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <LifeBuoy size={20} style={{ color: '#B94220' }} />
              <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#B94220' }}>
                {t('GovSync Coordination Notice')}
              </strong>
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '1.6rem', color: '#102B3A' }}>
              {t('Unified Grievance Centre')}
            </h2>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--muted, #4b5563)', maxWidth: '820px', lineHeight: 1.5 }}>
              {t(
                'GovSync is an independent citizen coordination and tracking portal. Lodging a grievance in GovSync is for internal assistance and coordination; it does not automatically register a complaint with government grievance authorities (such as Aaple Sarkar Grievance Redressal or CPGRAMS).'
              )}
            </p>

            {/* Official Portals Box */}
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#fffbeb',
                borderRadius: '4px',
                border: '1px solid #fef3c7',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.88rem',
              }}
            >
              <strong>{t('Official Government Grievance Authorities')}:</strong>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <a
                  href="https://grievances.maharashtra.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0f766e', textDecoration: 'underline', fontWeight: 600 }}
                >
                  {t('Official Aaple Sarkar Grievance Portal')} <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>
                <a
                  href="https://pgportal.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0f766e', textDecoration: 'underline', fontWeight: 600 }}
                >
                  {t('Central CPGRAMS Portal')} <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>
              </div>
            </div>
          </section>

          {/* 2. Statutory RTS Act Distinction Banner */}
          <section
            className="panel section-gap"
            style={{
              padding: '1.25rem',
              backgroundColor: '#f8fafc',
              borderLeft: '4px solid #0f766e',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Scale size={24} style={{ color: '#0f766e', flexShrink: 0, marginTop: '0.15rem' }} />
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#102B3A' }}>
                  {t('Legal Separation: Grievances vs Statutory RTS Appeals')}
                </strong>
                <p style={{ margin: '0.35rem 0 0.75rem 0', color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {t(
                    'Filing a grievance does not constitute a statutory appeal under Section 9(1) or Section 9(3) of the Maharashtra Right to Public Services Act, 2015, nor does it pause, extend, or reset statutory delivery timelines. If your application is overdue, file an official appeal on Aaple Sarkar.'
                  )}
                </p>
                <Link className="btn small" href="/rts" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Scale size={14} />
                  {t('Open RTS Assistant')}
                </Link>
              </div>
            </div>
          </section>

          {/* 3. Track Existing Grievance by Reference */}
          <section className="panel section-gap" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#102B3A' }}>
              {t('Track existing grievance by reference')}
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
              {t('Enter your GovSync reference code (e.g. GRV-2026-...) to check status and progress.')}
            </p>

            <form onSubmit={(e) => void handleLookup(e)} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '600px' }}>
              <input
                type="text"
                className="field"
                placeholder={t('Enter Reference Number (e.g. GRV-2026-...)')}
                value={lookupRef}
                onChange={(e) => setLookupRef(e.target.value)}
                style={{ flex: '1 1 280px', textTransform: 'uppercase' }}
                required
              />
              <button type="submit" className="btn primary" disabled={searching}>
                <Search size={15} style={{ marginRight: '4px' }} />
                {searching ? t('Searching…') : t('Track Grievance')}
              </button>
            </form>

            {lookupError && (
              <div className="note error" role="alert" style={{ marginTop: '1rem', maxWidth: '600px' }}>
                {t(lookupError)}
              </div>
            )}

            {lookupResult && (
              <div className="panel" style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: '#fafaf9', borderLeft: '4px solid #102B3A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{lookupResult.reference_number}</strong>
                  <span className={`badge ${GRIEVANCE_STATUSES[lookupResult.status]?.badgeTone || 'neutral'}`}>
                    {t(GRIEVANCE_STATUSES[lookupResult.status]?.label || lookupResult.status)}
                  </span>
                </div>
                <h4 style={{ margin: '0.25rem 0 0.5rem 0' }}>{lookupResult.subject}</h4>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#4b5563' }}>{lookupResult.description}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', flexWrap: 'wrap' }}>
                  <span>{t('Category')}: <strong>{t(lookupResult.category)}</strong></span>
                  <span>{t('Department')}: <strong>{lookupResult.department ? t(lookupResult.department) : t('Department not verified')}</strong></span>
                  <span>{t('Date Submitted')}: {date(lookupResult.created_at)}</span>
                </div>
                {lookupResult.resolution_summary && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '4px', fontSize: '0.88rem' }}>
                    <strong style={{ color: '#16a34a' }}>{t('Resolution Summary')}: </strong>
                    <span>{lookupResult.resolution_summary}</span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 4. Grievance Categories Guide */}
          <section className="panel section-gap" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#102B3A' }}>
              {t('Grievance Classifications & Categories')}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
              {t('GovSync classifies public service issues into standardized categories to ensure accurate review.')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {GRIEVANCE_CATEGORIES.map((cat) => (
                <div key={cat.key} className="panel" style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid #e5e7eb' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#102B3A', display: 'block', marginBottom: '0.25rem' }}>
                    {t(cat.label)}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.4 }}>
                    {cat.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Sign In CTA */}
          <section className="panel section-gap" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#102B3A', color: '#fff' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.4rem' }}>
              {t('Ready to submit or manage your grievances?')}
            </h3>
            <p style={{ margin: '0 auto 1.5rem auto', color: '#94a3b8', maxWidth: '520px', fontSize: '0.95rem' }}>
              {t('Sign in to your GovSync citizen account to link service applications, track real-time resolution updates, and respond to coordination queries.')}
            </p>
            <Link
              href="/"
              className="btn primary"
              style={{ backgroundColor: '#B94220', borderColor: '#B94220', color: '#fff' }}
            >
              {t('Sign in to Citizen Portal')} <ArrowRight size={15} style={{ marginLeft: '4px' }} />
            </Link>
          </section>
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
            <Link href="/grievances">{t('Grievance Centre')}</Link>
            <Link href="/rts">{t('RTS Deadlines')}</Link>
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

export default function PublicGrievanceShell() {
  return (
    <LanguageProvider>
      <PublicGrievanceContent />
    </LanguageProvider>
  );
}
