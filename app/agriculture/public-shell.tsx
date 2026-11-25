'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Coins,
  Droplets,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Info,
  RotateCcw,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
  TrendingUp,
  X,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { LanguageMenu } from '../login';
import { siteConfig } from '../site-config';
import {
  AGRICULTURE_CATEGORIES,
  IMPORTANT_AGRICULTURE_PORTALS,
  HOW_TO_USE_STEPS,
  VERIFIED_AGRICULTURE_ITEMS,
  filterAgricultureItems,
  getAgricultureDepartments,
  type AgricultureCategoryKey,
  type AgricultureItem,
} from '@/lib/agriculture';

const categoryIconMap: Record<AgricultureCategoryKey, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  schemes: Sprout,
  subsidies: Coins,
  machinery: Tractor,
  irrigation: Droplets,
  insurance: ShieldCheck,
  soil_health: FileText,
  farmer_registry: CheckCircle2,
  marketing: TrendingUp,
  training_advisory: GraduationCap,
  disaster_relief: AlertTriangle,
};

export function PublicAgricultureContent({ embedded = false }: { embedded?: boolean }) {
  const { t, language } = useLanguage();
  const [size, setSize] = useState(100);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState<AgricultureItem | null>(null);

  useEffect(() => {
    if (!embedded) {
      document.documentElement.style.fontSize = size + '%';
    }
  }, [size, embedded]);

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModalItem) {
        setActiveModalItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalItem]);

  const departments = useMemo(() => getAgricultureDepartments(), []);

  const filteredItems = useMemo(() => {
    return filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, {
      query: searchQuery,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      department: selectedDepartment === 'all' ? undefined : selectedDepartment,
      itemType: selectedType === 'all' ? undefined : selectedType,
      verificationStatus: verifiedOnly ? 'verified' : undefined,
    });
  }, [searchQuery, selectedCategory, selectedDepartment, selectedType, verifiedOnly]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedCategory !== 'all' ||
      selectedDepartment !== 'all' ||
      selectedType !== 'all' ||
      verifiedOnly
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedType('all');
    setVerifiedOnly(false);
  };

  const handleCategorySelect = (catId: string) => {
    if (selectedCategory === catId) {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(catId);
    }
  };

  return (
    <div className={embedded ? 'agriculture-embedded-view' : 'app-frame'}>
      {!embedded && (
        <>
          <div className="utility-bar">
            <div className="utility-inner">
              <span>{t('Agriculture & Farmer Welfare')}</span>
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
            <Link className="brand" href="/agriculture" aria-label={t('Agriculture & Farmer Service Hub')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand-mark" src={siteConfig.logo} alt="" />
              <span className="brand-copy">
                <strong>{siteConfig.name}</strong>
                <span>{t('Public information portal')}</span>
              </span>
            </Link>
            <nav className="main-navigation" aria-label={t('Main navigation')}>
              <Link className="nav-item" href="/transparency">
                {t('Transparency')}
              </Link>
              <Link className="nav-item active" href="/agriculture" aria-current="page">
                {t('Agriculture')}
              </Link>
              <Link className="nav-item" href="/directory">
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
              <strong>{t('Agriculture & Farmer Service Hub')}</strong>
            </div>
            <span>
              {t(
                'Direct access to verified agricultural schemes, crop insurance, equipment subsidies, irrigation support, soil testing, and farmer welfare services across Maharashtra.'
              )}
            </span>
          </div>
        </>
      )}

      <main className={embedded ? '' : 'workspace'} id="main-content" tabIndex={-1}>
        <div className="content-canvas" style={{ maxWidth: '1180px', margin: '0 auto', padding: embedded ? '0' : '1.5rem 1rem' }}>
          {!embedded && (
            <div className="breadcrumb" style={{ marginBottom: '1.25rem' }}>
              <Link href="/">{t('Home')}</Link>
              <span aria-hidden="true">/</span>
              <strong>{t('Agriculture')}</strong>
            </div>
          )}

          {/* 1. Hero Section */}
          <section
            className="panel"
            style={{
              padding: '2rem 1.75rem',
              backgroundColor: '#102B3A',
              color: '#FFFDFA',
              borderRadius: '8px',
              border: '1px solid #0b1f2b',
              marginBottom: '1.75rem',
              boxShadow: '0 4px 12px rgba(16, 43, 58, 0.12)',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.825rem', color: '#e2e8f0', marginBottom: '1rem' }}>
              <Sprout size={16} style={{ color: '#4ade80' }} />
              <span>{t('Government of Maharashtra • Agriculture & Farmer Welfare')}</span>
            </div>

            <h1
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '2.1rem',
                fontWeight: 600,
                color: '#ffffff',
                margin: '0 0 0.85rem 0',
                lineHeight: 1.25,
              }}
            >
              {t('Agriculture & Farmer Service Hub')}
            </h1>

            <p
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.55,
                color: '#cbd5e1',
                maxWidth: '820px',
                margin: '0 0 1.75rem 0',
              }}
            >
              {t(
                'Direct access to verified agricultural schemes, crop insurance, equipment subsidies, irrigation support, soil testing, and farmer welfare services across Maharashtra.'
              )}
            </p>

            {/* Quick Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.85rem 1rem', borderRadius: '6px' }}>
                <strong style={{ display: 'block', fontSize: '1.6rem', color: '#4ade80', fontFamily: 'Georgia, serif' }}>
                  {VERIFIED_AGRICULTURE_ITEMS.length}+
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {t('Verified Agricultural Services')}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.85rem 1rem', borderRadius: '6px' }}>
                <strong style={{ display: 'block', fontSize: '1.6rem', color: '#38bdf8', fontFamily: 'Georgia, serif' }}>
                  10
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {t('All Categories')}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.85rem 1rem', borderRadius: '6px' }}>
                <strong style={{ display: 'block', fontSize: '1.6rem', color: '#fbbf24', fontFamily: 'Georgia, serif' }}>
                  {IMPORTANT_AGRICULTURE_PORTALS.length}
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {t('Integrated Portals')}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.85rem 1rem', borderRadius: '6px' }}>
                <strong style={{ display: 'block', fontSize: '1.6rem', color: '#f472b6', fontFamily: 'Georgia, serif' }}>
                  100%
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {t('Direct Benefit Transfer (DBT)')}
                </span>
              </div>
            </div>
          </section>

          {/* 2. Official Notice Box */}
          <section
            className="panel"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#FFFDF9',
              border: '1px solid #E5D5C5',
              borderLeft: '4px solid #B94220',
              borderRadius: '6px',
              marginBottom: '1.75rem',
            }}
            aria-label={t('Official Agriculture & Farmer Services Notice')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Info size={20} style={{ color: '#B94220', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#102B3A', marginBottom: '4px' }}>
                  {t('Official Agriculture & Farmer Services Notice')}
                </strong>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.45 }}>
                  {t(
                    'GovSync connects cultivators and landholders directly to verified government schemes and official portals. Subsidies, insurance policies, and scheme criteria are sourced from official Government of Maharashtra and Government of India agricultural portals.'
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* 3. Explore by Category Section */}
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.4rem',
                  color: '#102B3A',
                  margin: '0 0 0.35rem 0',
                }}
              >
                {t('Explore by Category')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                {t('Select an agricultural sector to view dedicated schemes, subsidies, and citizen services.')}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {AGRICULTURE_CATEGORIES.map((cat) => {
                const IconComponent = categoryIconMap[cat.id] || Sprout;
                const isSelected = selectedCategory === cat.id;
                const catLabel = language === 'mr' ? cat.marathiLabel : language === 'hi' ? cat.hindiLabel : cat.label;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      textAlign: 'left',
                      backgroundColor: isSelected ? '#102B3A' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#102B3A',
                      border: isSelected ? '1px solid #102B3A' : '1px solid #E2E8F0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(16,43,58,0.2)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : '#F1F5F9',
                        color: isSelected ? '#4ade80' : '#B94220',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={18} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem', lineHeight: 1.3, marginBottom: '2px' }}>
                        {t(cat.label) || catLabel}
                      </strong>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          color: isSelected ? '#cbd5e1' : '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t(cat.description)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Search and Multi-Attribute Filter Bar */}
          <section
            className="panel"
            style={{
              padding: '1.25rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Search input */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Search agricultural services, schemes, subsidies, or machinery…')}
                  aria-label={t('Search by scheme name, subsidy, crop, equipment, department, or keyword')}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 2.35rem',
                    fontSize: '0.95rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    outline: 'none',
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    boxSizing: 'border-box',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('Clear search query')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Multi-attribute dropdowns & toggles */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}
              >
                {/* Category select */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    {t('Category')}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label={t('Select Category')}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      fontSize: '0.875rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      color: '#1E293B',
                    }}
                  >
                    <option value="all">{t('All Categories')}</option>
                    {AGRICULTURE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t(c.label)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department select */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    {t('Department')}
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    aria-label={t('Select Department')}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      fontSize: '0.875rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      color: '#1E293B',
                    }}
                  >
                    <option value="all">{t('All Departments')}</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Type select */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    {t('Service Type')}
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    aria-label={t('Service Type')}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      fontSize: '0.875rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      color: '#1E293B',
                    }}
                  >
                    <option value="all">{t('All Service Types')}</option>
                    <option value="scheme">{t('Scheme')}</option>
                    <option value="service">{t('Service')}</option>
                  </select>
                </div>

                {/* Verified Toggle & Clear */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      color: '#334155',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      style={{ accentColor: '#102B3A', cursor: 'pointer' }}
                    />
                    <span>{t('Verified Services Only')}</span>
                  </label>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.825rem',
                        color: '#B94220',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      <RotateCcw size={14} />
                      {t('Clear Filters')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Count Announcement */}
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                color: '#64748b',
              }}
              aria-live="polite"
            >
              <span>{t('Showing {count} agricultural services & schemes', { count: filteredItems.length })}</span>
              {hasActiveFilters && (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {t('Showing all {total} services', { total: VERIFIED_AGRICULTURE_ITEMS.length })}
                </span>
              )}
            </div>
          </section>

          {/* 5. Results Section: Featured Schemes & Services Grid */}
          <section style={{ marginBottom: '2.5rem' }}>
            {filteredItems.length === 0 ? (
              <div
                className="panel"
                style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px dashed #CBD5E1',
                }}
              >
                <Sprout size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#102B3A', margin: '0 0 0.5rem 0' }}>
                  {t('No agricultural services found matching your criteria')}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
                  {t('Try clearing your search query or adjusting your category and department filters.')}
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={resetFilters}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <RotateCcw size={15} />
                  {t('Clear Filters')}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {filteredItems.map((item) => {
                  const IconComp = categoryIconMap[item.category] || Sprout;
                  const catInfo = AGRICULTURE_CATEGORIES.find((c) => c.id === item.category);
                  const itemName = language === 'mr' ? item.marathiName : language === 'hi' ? item.hindiName : item.name;

                  return (
                    <article
                      key={item.id}
                      className="panel"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '1.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'box-shadow 0.15s ease',
                      }}
                    >
                      {/* Card Header: Category & Type badges */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                          }}
                        >
                          <IconComp size={13} style={{ color: '#B94220' }} />
                          {t(catInfo?.label || item.category)}
                        </span>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: '#ECFDF5',
                            color: '#065F46',
                            border: '1px solid #A7F3D0',
                          }}
                        >
                          <ShieldCheck size={12} />
                          {t('Verified Official Source')}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '1.15rem',
                          fontWeight: 600,
                          color: '#102B3A',
                          margin: '0 0 0.5rem 0',
                          lineHeight: 1.35,
                        }}
                      >
                        {itemName}
                      </h3>

                      {/* Department */}
                      <p
                        style={{
                          fontSize: '0.775rem',
                          color: '#64748b',
                          margin: '0 0 0.75rem 0',
                          fontWeight: 500,
                        }}
                      >
                        {item.department}
                      </p>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: '#334155',
                          lineHeight: 1.5,
                          margin: '0 0 1rem 0',
                          flex: 1,
                        }}
                      >
                        {item.shortDescription}
                      </p>

                      {/* Highlights */}
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '6px',
                          padding: '0.75rem',
                          marginBottom: '1rem',
                          border: '1px solid #F1F5F9',
                          fontSize: '0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#1E293B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '2px' }}>
                            {t('Eligibility Criteria')}
                          </strong>
                          <span style={{ color: '#475569', lineHeight: 1.4 }}>
                            {item.eligibilityRequirements[0]}
                            {item.eligibilityRequirements.length > 1 && ` (+${item.eligibilityRequirements.length - 1} more)`}
                          </span>
                        </div>

                        <div>
                          <strong style={{ color: '#047857', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '2px' }}>
                            {t('Statutory Benefits & Financial Assistance')}
                          </strong>
                          <span style={{ color: '#065F46', lineHeight: 1.4, fontWeight: 500 }}>
                            {item.benefits[0]}
                            {item.benefits.length > 1 && ` (+${item.benefits.length - 1} more)`}
                          </span>
                        </div>
                      </div>

                      {/* Card Action CTAs */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveModalItem(item)}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#102B3A',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          {t('View Details & Criteria')}
                        </button>

                        <a
                          href={item.officialApplicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.5rem 0.85rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            backgroundColor: '#B94220',
                            border: '1px solid #B94220',
                            borderRadius: '5px',
                            textDecoration: 'none',
                          }}
                          aria-label={`${t('Apply on Official Portal')} - ${item.name}`}
                        >
                          <span>{t('Apply Now')}</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* 6. Important Government Portals Directory */}
          <section
            className="panel"
            style={{
              padding: '1.75rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              marginBottom: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#B94220', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                <Globe size={16} />
                <span>{t('Official Agriculture Portals')}</span>
              </div>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.4rem',
                  color: '#102B3A',
                  margin: '0 0 0.35rem 0',
                }}
              >
                {t('Direct Gateways & Digital Services')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                {t(
                  'Direct authenticated gateways for scheme applications, crop insurance filing, and digital services across Maharashtra.'
                )}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              {IMPORTANT_AGRICULTURE_PORTALS.map((portal) => {
                const pName = language === 'mr' ? portal.marathiName : language === 'hi' ? portal.hindiName : portal.name;
                return (
                  <div
                    key={portal.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#102B3A' }}>
                          {pName}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.4rem',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            borderRadius: '4px',
                          }}
                        >
                          {portal.badge}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0 0 6px 0', fontWeight: 500 }}>
                        {portal.authority}
                      </p>

                      <p style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.45, margin: '0 0 1rem 0' }}>
                        {portal.description}
                      </p>
                    </div>

                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        color: '#B94220',
                        textDecoration: 'none',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <span>{t('Visit Portal')}</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 7. Step-by-Step Help & Guidance Section */}
          <section
            className="panel"
            style={{
              padding: '1.75rem',
              backgroundColor: '#FFFDF9',
              border: '1px solid #E5D5C5',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#B94220', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                <BookOpen size={16} />
                <span>{t('How to Access Farmer Services in 4 Steps')}</span>
              </div>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.4rem',
                  color: '#102B3A',
                  margin: '0 0 0.35rem 0',
                }}
              >
                {t('Guidance for Cultivators & Landholders')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                {t(
                  'A plain-language guide for cultivators, women farmers, and landholders to obtain benefits smoothly.'
                )}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {HOW_TO_USE_STEPS.map((step) => {
                const sTitle = language === 'mr' ? step.marathiTitle : language === 'hi' ? step.hindiTitle : step.title;
                const sDesc = language === 'mr' ? step.marathiDescription : language === 'hi' ? step.hindiDescription : step.description;
                return (
                  <div
                    key={step.step}
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: '1.25rem',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#102B3A',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        marginBottom: '0.75rem',
                      }}
                    >
                      {step.step}
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#102B3A', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                      {sTitle}
                    </strong>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                      {sDesc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 8. Citizen Portal Callout */}
          {!embedded && (
            <section
              className="panel"
              style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#102B3A',
                color: '#fff',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.4rem' }}>
                {t('Ready to apply or track public services?')}
              </h3>
              <p style={{ margin: '0 auto 1.5rem auto', color: '#94a3b8', maxWidth: '540px', fontSize: '0.95rem' }}>
                {t(
                  'Sign in to your GovSync citizen account to submit applications, track RTS deadlines, and receive real-time verification updates.'
                )}
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
                  textDecoration: 'none',
                }}
              >
                {t('Citizen portal')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>
          )}
        </div>
      </main>

      {/* 9. Interactive Detail Modal / Drawer */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-scheme-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModalItem(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#102B3A',
                color: '#FFFFFF',
                borderRadius: '8px 8px 0 0',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#4ade80', marginBottom: '4px' }}>
                  <ShieldCheck size={14} />
                  <span>{t('Verified Official Source')}</span>
                  <span>•</span>
                  <span>{activeModalItem.department}</span>
                </div>
                <h2
                  id="modal-scheme-title"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '1.35rem',
                    color: '#FFFFFF',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {language === 'mr' ? activeModalItem.marathiName : language === 'hi' ? activeModalItem.hindiName : activeModalItem.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                aria-label={t('Close specifications')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Detailed Description */}
              <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.55, margin: 0 }}>
                {activeModalItem.detailedDescription}
              </p>

              {/* Statutory Benefits */}
              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '6px',
                  padding: '1rem',
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#065F46', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <Coins size={16} />
                  {t('Statutory Benefits & Financial Assistance')}
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#047857', fontSize: '0.875rem', lineHeight: 1.45, fontWeight: 500 }}>
                  {activeModalItem.benefits.map((b, idx) => (
                    <li key={idx} style={{ marginBottom: '3px' }}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Eligibility Criteria */}
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#102B3A', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                  {t('Eligibility Criteria')}
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {activeModalItem.eligibilityRequirements.map((crit, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {crit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Documents */}
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#102B3A', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <FileText size={16} style={{ color: '#2563eb' }} />
                  {t('Required Documents Checklist')}
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {activeModalItem.requiredDocuments.map((doc, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Application Process */}
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#102B3A', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <BookOpen size={16} style={{ color: '#B94220' }} />
                  {t('Step-by-Step Application Process')}
                </strong>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {activeModalItem.applicationProcess.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Caveats */}
              <div
                style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '6px',
                  padding: '0.85rem 1rem',
                }}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400E', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <AlertTriangle size={15} />
                  {t('Important Conditions & Caveats')}
                </strong>
                <p style={{ margin: 0, color: '#B45309', fontSize: '0.825rem', lineHeight: 1.45 }}>
                  Beneficiaries: <strong>{activeModalItem.intendedBeneficiaries}</strong>. Level: {activeModalItem.level}.
                </p>
              </div>

              {/* Authority Link Box */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.825rem',
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {t('Source Authority & Official Portal')}: <strong>{activeModalItem.sourceTitle}</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {activeModalItem.lastVerified}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                borderRadius: '0 0 8px 8px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: '#475569',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                {t('Close')}
              </button>
              <a
                href={activeModalItem.officialApplicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: '#B94220',
                  border: '1px solid #B94220',
                  borderRadius: '5px',
                  textDecoration: 'none',
                }}
              >
                <span>{t('Apply on Official Portal')}</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {!embedded && (
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
      )}
    </div>
  );
}

export default function PublicAgricultureShell() {
  return (
    <LanguageProvider>
      <PublicAgricultureContent />
    </LanguageProvider>
  );
}
