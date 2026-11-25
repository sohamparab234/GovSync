'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Landmark,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { LanguageMenu } from '../login';
import { siteConfig } from '../site-config';
import {
  ALL_OFFICE_CATEGORIES,
  GOVERNMENT_DEPARTMENTS,
  MAHARASHTRA_DISTRICTS_DIRECTORY,
  VERIFIED_GOVERNMENT_OFFICES,
  filterGovernmentOffices,
  getDistrictInfo,
  getTalukasForDistrict,
} from '@/lib/directory';

export function PublicDirectoryContent() {
  const { t } = useLanguage();
  const [size, setSize] = useState(100);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [district, setDistrict] = useState('all');
  const [taluka, setTaluka] = useState('all');
  const [department, setDepartment] = useState('all');
  const [category, setCategory] = useState('all');
  const [service, setService] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.fontSize = size + '%';
  }, [size]);

  // When district changes, reset taluka
  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setTaluka('all');
  };

  const availableTalukas = useMemo(() => {
    if (!district || district === 'all' || district === 'Maharashtra (Statewide)') {
      return [];
    }
    return getTalukasForDistrict(district);
  }, [district]);

  const filteredOffices = useMemo(() => {
    return filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, {
      query: searchQuery,
      district: district === 'all' ? undefined : district,
      taluka: taluka === 'all' ? undefined : taluka,
      department: department === 'all' ? undefined : department,
      officeCategory: category === 'all' ? undefined : category,
      service: service === 'all' ? undefined : service,
    });
  }, [searchQuery, district, taluka, department, category, service]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      district !== 'all' ||
      taluka !== 'all' ||
      department !== 'all' ||
      category !== 'all' ||
      service !== 'all'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setDistrict('all');
    setTaluka('all');
    setDepartment('all');
    setCategory('all');
    setService('all');
    setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const selectedDistrictInfo = useMemo(() => {
    if (!district || district === 'all' || district === 'Maharashtra (Statewide)') {
      return null;
    }
    return getDistrictInfo(district);
  }, [district]);

  return (
    <div className="app-frame">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>{t('Government Office Directory')}</span>
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
        <Link className="brand" href="/directory" aria-label={t('Maharashtra Government Office Directory')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-mark" src={siteConfig.logo} alt="" />
          <span className="brand-copy">
            <strong>{siteConfig.name}</strong>
            <span>{t('Public information portal')}</span>
          </span>
        </Link>
        <nav className="main-navigation" aria-label={t('Main navigation')}>
          <Link className="nav-item active" href="/directory" aria-current="page">
            {t('Directory')}
          </Link>
          <Link className="nav-item" href="/grievances">
            {t('Grievance Centre')}
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
          <strong>{t('Maharashtra Government Office Directory')}</strong>
        </div>
        <span>
          {t("Locate district administrative offices, tahsil centers, and department contact channels across Maharashtra's 36 districts.")}
        </span>
      </div>

      <main className="workspace" id="main-content" tabIndex={-1}>
        <div className="breadcrumb">
          <Link href="/">{t('Home')}</Link>
          <span aria-hidden="true">/</span>
          <strong>{t('Directory')}</strong>
        </div>

        <div className="content-canvas">
          {/* 1. Official Directory Notice Panel */}
          <section className="panel receipt section-gap" style={{ borderLeft: '4px solid #102B3A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Landmark size={20} style={{ color: '#102B3A' }} />
              <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#102B3A' }}>
                {t('Official Government Directory Notice')}
              </strong>
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '1.6rem', color: '#102B3A' }}>
              {t('Maharashtra Government Office Directory')}
            </h2>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--muted, #4b5563)', maxWidth: '820px', lineHeight: 1.5 }}>
              {t(
                'GovSync connects citizens to verified government offices and official portals. Physical addresses, official phone numbers, and web portals are sourced from official district administration websites.'
              )}
            </p>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                marginTop: '1rem',
              }}
            >
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>{t('Districts Covered')}</span>
                <strong style={{ fontSize: '1.4rem', color: '#102B3A' }}>36</strong>
              </div>
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>{t('Divisions')}</span>
                <strong style={{ fontSize: '1.4rem', color: '#102B3A' }}>6</strong>
              </div>
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>{t('Total Verified Offices')}</span>
                <strong style={{ fontSize: '1.4rem', color: '#102B3A' }}>{VERIFIED_GOVERNMENT_OFFICES.length}</strong>
              </div>
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>{t('Matching Offices')}</span>
                <strong style={{ fontSize: '1.4rem', color: '#B94220' }}>{filteredOffices.length}</strong>
              </div>
            </div>
          </section>

          {/* 2. Interactive Search & Filters Panel */}
          <section className="panel section-gap" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#102B3A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={18} style={{ color: '#B94220' }} />
                {t('Search & Filter Offices')}
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RotateCcw size={14} />
                  {t('Clear Filters')}
                </button>
              )}
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="search"
                  className="field"
                  placeholder={t('Search offices, departments, or services…')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.4rem' }}
                  aria-label={t('Search by office name, department, or service')}
                />
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {/* District Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  {t('District')}
                </label>
                <select
                  className="field"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="all">{t('All 36 Districts')}</option>
                  <option value="Maharashtra (Statewide)">{t('Secretariat / State Headquarters')}</option>
                  <optgroup label={t('All Districts')}>
                    {MAHARASHTRA_DISTRICTS_DIRECTORY.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.division})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Taluka Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  {t('Taluka')}
                </label>
                <select
                  className="field"
                  value={taluka}
                  onChange={(e) => setTaluka(e.target.value)}
                  disabled={availableTalukas.length === 0}
                  style={{ width: '100%', opacity: availableTalukas.length === 0 ? 0.6 : 1 }}
                >
                  <option value="all">
                    {availableTalukas.length > 0 ? t('All Talukas') : t('Select District')}
                  </option>
                  {availableTalukas.map((tal) => (
                    <option key={tal} value={tal}>
                      {tal}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  {t('Department')}
                </label>
                <select
                  className="field"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="all">{t('All Departments')}</option>
                  {GOVERNMENT_DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name} ({dept.shortCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Office Category Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  {t('Office Category')}
                </label>
                <select
                  className="field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="all">{t('All Office Categories')}</option>
                  {ALL_OFFICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  {t('Service')}
                </label>
                <select
                  className="field"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="all">{t('All Services')}</option>
                  <option value="residence">{t('Residence / Domicile Certificate')}</option>
                  <option value="income-certificate">{t('Income Certificate')}</option>
                  <option value="caste-certificate">{t('Caste / Community Certificate')}</option>
                  <option value="ration-card">{t('Ration Card (PDS Security)')}</option>
                  <option value="scholarship">{t('Scholarship Application')}</option>
                  <option value="pension">{t('Old Age Pension')}</option>
                  <option value="driving-license">{t('Driving License & Permits')}</option>
                  <option value="pm-kisan">{t('PM-KISAN & Farmer Assistance')}</option>
                  <option value="birth-certificate">{t('Birth & Death Certificates')}</option>
                </select>
              </div>
            </div>

            {/* Selected District Portal Callout Banner */}
            {selectedDistrictInfo && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                }}
              >
                <div>
                  <strong>{selectedDistrictInfo.name} {t('District Portal')}:</strong>{' '}
                  <span style={{ color: '#4b5563' }}>
                    {t('Division')}: {selectedDistrictInfo.division} | {t('Headquarters')}: {selectedDistrictInfo.headquarters}
                  </span>
                </div>
                <a
                  href={selectedDistrictInfo.officialPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#15803d',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {selectedDistrictInfo.officialPortal} <ExternalLink size={13} />
                </a>
              </div>
            )}
          </section>

          {/* 3. Office Directory Results List */}
          <section className="section-gap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#102B3A' }}>
                {t('Government Offices')} ({filteredOffices.length})
              </h3>
            </div>

            {filteredOffices.length === 0 ? (
              <div className="panel" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#fafaf9' }}>
                <Building size={36} style={{ color: '#9ca3af', margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#102B3A', fontSize: '1.2rem' }}>
                  {t('No offices match your search criteria')}
                </h4>
                <p style={{ margin: '0 auto 1.25rem auto', color: '#6b7280', maxWidth: '480px', fontSize: '0.9rem' }}>
                  {t('Try adjusting your search query, selecting another district, or clearing filters.')}
                </p>
                <button type="button" onClick={resetFilters} className="btn primary">
                  <RotateCcw size={14} style={{ marginRight: '6px' }} />
                  {t('Clear Filters')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredOffices.map((off) => {
                  const isExpanded = expandedId === off.id;
                  return (
                    <article
                      key={off.id}
                      className="panel directory-office-card"
                      style={{
                        padding: '1.25rem',
                        borderLeft: '4px solid #102B3A',
                        backgroundColor: '#fff',
                        transition: 'box-shadow 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <span className="badge neutral" style={{ fontWeight: 600, fontSize: '0.78rem' }}>
                              {t(off.officeCategory)}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                              {off.department}
                            </span>
                          </div>
                          <h4 style={{ margin: '0.2rem 0', fontSize: '1.2rem', color: '#102B3A' }}>
                            {off.name}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            className="badge green"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.78rem',
                            }}
                          >
                            <ShieldCheck size={12} />
                            {t('Verified Record')}
                          </span>
                        </div>
                      </div>

                      {/* Location & District Details */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          fontSize: '0.88rem',
                          color: '#4b5563',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={15} style={{ color: '#B94220' }} />
                          <strong>{off.district}</strong>
                          {off.taluka && <span>({t('Taluka')}: {off.taluka})</span>}
                        </span>

                        {off.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={14} style={{ color: '#0f766e' }} />
                            <a href={`tel:${off.phone.replace(/[^0-9+]/g, '')}`} style={{ color: 'inherit' }}>
                              {off.phone}
                            </a>
                          </span>
                        )}

                        {off.email && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Mail size={14} style={{ color: '#0f766e' }} />
                            <a href={`mailto:${off.email}`} style={{ color: 'inherit' }}>
                              {off.email}
                            </a>
                          </span>
                        )}
                      </div>

                      {/* Verified Address */}
                      {off.address && (
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#374151', lineHeight: 1.4 }}>
                          <strong style={{ color: '#4b5563' }}>{t('Address')}: </strong>
                          {off.address}
                        </p>
                      )}

                      {/* Services Handled Chips */}
                      {off.servicesHandled.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Tag size={12} />
                            {t('Services Handled')}:
                          </span>
                          {off.servicesHandled.map((s) => (
                            <span
                              key={s}
                              style={{
                                display: 'inline-block',
                                padding: '0.15rem 0.5rem',
                                backgroundColor: '#f1f5f9',
                                color: '#1e293b',
                                borderRadius: '3px',
                                fontSize: '0.78rem',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              {t(s)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Bar & Toggle */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid #f1f5f9',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <a
                            href={off.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#0f766e' }}
                          >
                            <Globe size={13} />
                            {t('Official Website')}
                            <ExternalLink size={12} />
                          </a>

                          <a
                            href={off.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6b7280' }}
                          >
                            {t('Official Source')}
                            <ExternalLink size={12} />
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpand(off.id)}
                          className="btn small directory-expand-btn"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          {isExpanded ? (
                            <>
                              {t('Hide Details')} <ChevronUp size={14} />
                            </>
                          ) : (
                            <>
                              {t('View Office Details')} <ChevronDown size={14} />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expanded Details Section */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: '#fafaf9',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            fontSize: '0.88rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                          }}
                        >
                          {off.jurisdiction && (
                            <div>
                              <strong style={{ color: '#102B3A' }}>{t('Jurisdiction')}: </strong>
                              <span>{off.jurisdiction}</span>
                            </div>
                          )}

                          {off.timings && (
                            <div>
                              <strong style={{ color: '#102B3A' }}>{t('Office Timings')}: </strong>
                              <span>{off.timings}</span>
                            </div>
                          )}

                          <div>
                            <strong style={{ color: '#102B3A' }}>{t('Last Verified')}: </strong>
                            <span>{off.lastVerified}</span>
                          </div>

                          <div>
                            <strong style={{ color: '#102B3A' }}>{t('Official Source URL')}: </strong>
                            <a
                              href={off.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#0f766e', wordBreak: 'break-all' }}
                            >
                              {off.sourceUrl}
                            </a>
                          </div>

                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Link href="/" className="btn primary small" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              {t('Citizen portal')} <ArrowRight size={13} />
                            </Link>
                            <Link href="/grievances" className="btn small" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              {t('Grievance Centre')}
                            </Link>
                            <Link href="/rts" className="btn small" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              {t('RTS Deadlines')}
                            </Link>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4. Maharashtra 36 Districts Quick Administration Grid */}
          <section className="panel section-gap" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#102B3A' }}>
              {t('Maharashtra 36 Districts Administration Portals')}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
              {t('Official NIC portals for all 36 districts of Maharashtra. Access district collectorate notices, officers list, and taluka information.')}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {MAHARASHTRA_DISTRICTS_DIRECTORY.map((d) => (
                <div
                  key={d.name}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#102B3A' }}>{d.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', backgroundColor: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: '2px' }}>
                        {d.division}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block' }}>
                      {d.talukas.length} {t('Talukas')} | HQ: {d.headquarters}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid #f8fafc' }}>
                    <button
                      type="button"
                      onClick={() => handleDistrictChange(d.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#B94220',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textAlign: 'left',
                      }}
                    >
                      {t('Browse Offices')}
                    </button>
                    <a
                      href={d.officialPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#0f766e',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                      title={`${d.name} ${t('Official Portal')}`}
                    >
                      NIC Portal <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Citizen Portal Callout */}
          <section className="panel section-gap" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#102B3A', color: '#fff' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.4rem' }}>
              {t('Ready to apply or track public services?')}
            </h3>
            <p style={{ margin: '0 auto 1.5rem auto', color: '#94a3b8', maxWidth: '540px', fontSize: '0.95rem' }}>
              {t('Sign in to your GovSync citizen account to submit applications, track RTS deadlines, and receive real-time verification updates.')}
            </p>
            <Link
              href="/"
              className="btn primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#B94220',
                borderColor: '#B94220',
                color: '#fff',
                padding: '0.65rem 1.5rem',
                fontSize: '1rem',
              }}
            >
              {t('Citizen portal')}
              <ArrowRight size={16} aria-hidden="true" />
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
            <Link href="/directory">{t('Directory')}</Link>
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

export default function PublicDirectoryShell() {
  return (
    <LanguageProvider>
      <PublicDirectoryContent />
    </LanguageProvider>
  );
}
