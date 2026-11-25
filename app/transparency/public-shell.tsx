'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  HeartHandshake,
  Info,
  Landmark,
  Layers,
  LogIn,
  RotateCcw,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Tag,
  X,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { LanguageMenu } from '../login';
import { siteConfig } from '../site-config';
import {
  TRANSPARENCY_CATEGORIES,
  OFFICIAL_GOVERNMENT_PORTALS,
  VERIFIED_ANNOUNCEMENTS,
  filterAnnouncements,
  getTransparencyDepartments,
  getCategoryCounts,
  getTransparencySummary,
  getCitizenNotifications,
  type TransparencyCategoryKey,
  type AnnouncementRecord,
} from '@/lib/transparency';
import type { WorkspaceContext } from '@/lib/types';

const categoryIconMap: Record<
  TransparencyCategoryKey,
  React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
> = {
  government_resolutions: ScrollText,
  department_notifications: Bell,
  scheme_updates: Sparkles,
  public_notices: AlertTriangle,
  citizen_services: CheckCircle2,
  agriculture_updates: Sprout,
  education_scholarships: GraduationCap,
  health_welfare: HeartHandshake,
  public_infrastructure: Landmark,
  administrative_updates: ShieldCheck,
};

export function PublicTransparencyContent({
  embedded = false,
  ctx,
}: {
  embedded?: boolean;
  ctx?: WorkspaceContext;
}) {
  const { t } = useLanguage();
  const [size, setSize] = useState(100);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<string>('all');
  const [selectedValidity, setSelectedValidity] = useState<string>('all');
  const [includeArchive, setIncludeArchive] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // UI Tabs (Announcements Directory vs Citizen Notifications)
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications'>(
    embedded ? 'notifications' : 'announcements'
  );
  const [notificationFilter, setNotificationFilter] = useState<
    'all' | 'action_required' | 'application_status' | 'rts_alert' | 'relevant_announcement'
  >('all');

  // Modal State
  const [activeModalItem, setActiveModalItem] = useState<AnnouncementRecord | null>(null);

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

  const departments = useMemo(() => getTransparencyDepartments(), []);
  const categoryCounts = useMemo(() => getCategoryCounts(), []);
  const summary = useMemo(() => getTransparencySummary(), []);

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    return filterAnnouncements(VERIFIED_ANNOUNCEMENTS, {
      query: searchQuery,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      department: selectedDepartment === 'all' ? undefined : selectedDepartment,
      verificationStatus: selectedVerificationStatus === 'all' ? undefined : selectedVerificationStatus,
      validityStatus: selectedValidity === 'all' ? undefined : selectedValidity,
      includeArchive: includeArchive ? true : false,
      sortBy,
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedDepartment,
    selectedVerificationStatus,
    selectedValidity,
    includeArchive,
    sortBy,
  ]);

  // Citizen Notifications
  const citizenNotifications = useMemo(() => {
    if (!ctx) return [];
    const apps = ctx.workspace.applications || [];
    const audits = ctx.workspace.audit || [];
    const grvs = ctx.workspace.grievances || [];
    return getCitizenNotifications(apps, audits, grvs, VERIFIED_ANNOUNCEMENTS);
  }, [ctx]);

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'all') return citizenNotifications;
    return citizenNotifications.filter((n) => n.type === notificationFilter);
  }, [citizenNotifications, notificationFilter]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedCategory !== 'all' ||
      selectedDepartment !== 'all' ||
      selectedVerificationStatus !== 'all' ||
      selectedValidity !== 'all' ||
      includeArchive ||
      sortBy !== 'newest'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedVerificationStatus('all');
    setSelectedValidity('all');
    setIncludeArchive(false);
    setSortBy('newest');
  };

  const handleCategorySelect = (catId: string) => {
    if (selectedCategory === catId) {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(catId);
    }
  };

  return (
    <div className={embedded ? 'transparency-embedded-view' : 'app-frame'}>
      {!embedded && (
        <>
          <div className="utility-bar">
            <div className="utility-inner">
              <span>{t('Government Transparency & Updates')}</span>
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
            <Link className="brand" href="/" aria-label={t('Home')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand-mark" src={siteConfig.logo} alt="" />
              <span className="brand-copy">
                <strong>{siteConfig.name}</strong>
                <span>{t('Citizen portal')}</span>
              </span>
            </Link>
            <nav className="main-navigation" aria-label={t('Main navigation')}>
              <Link className="nav-item" href="/">
                {t('Services')}
              </Link>
              <Link className="nav-item active" href="/transparency" aria-current="page">
                {t('Transparency')}
              </Link>
              <Link className="nav-item" href="/agriculture">
                {t('Agriculture')}
              </Link>
              <Link className="nav-item" href="/directory">
                {t('Directory')}
              </Link>
              <Link className="nav-item" href="/rts">
                {t('RTS Deadlines')}
              </Link>
              <Link className="nav-item" href="/grievances">
                {t('Grievance Centre')}
              </Link>
              <Link className="nav-item" href="/schemes">
                {t('Scheme Finder')}
              </Link>
            </nav>
            <div className="header-actions">
              <LanguageMenu />
              <Link className="btn primary" href="/">
                <LogIn size={16} />
                {t('Citizen workspace')}
              </Link>
            </div>
          </header>

          <div className="account-strip">
            <div>
              <span>{t('Public Transparency & Notification Centre')}</span>
              <strong>{t('Official Government Gazette & Circulars')}</strong>
            </div>
            <span>{t('All announcements verified against state records.')}</span>
          </div>
        </>
      )}

      <main className="workspace transparency-main" id="main-content" tabIndex={-1}>
        {/* HERO SECTION */}
        <section className="transparency-hero" aria-labelledby="transparency-heading">
          <div className="transparency-hero-inner">
            <div className="transparency-hero-content">
              <div className="transparency-pill-badge">
                <ShieldCheck size={16} />
                <span>{t('Statutory Transparency Portal')}</span>
              </div>
              <h1 id="transparency-heading">{t('Government Transparency & Updates')}</h1>
              <p className="transparency-hero-desc">
                {t(
                  'Access government announcements, official notices and important public information from verified sources.'
                )}
              </p>

              {/* SEARCH BAR */}
              <div className="transparency-search-box">
                <label htmlFor="transparency-search-input" className="sr-only">
                  {t('Search announcements, GR numbers, or departments...')}
                </label>
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={20} aria-hidden="true" />
                  <input
                    id="transparency-search-input"
                    type="search"
                    className="transparency-search-input"
                    placeholder={t('Search announcements, GR numbers, or departments...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchQuery('')}
                      aria-label={t('Clear search query')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* STAT COUNTERS */}
              <div className="transparency-stats-row">
                <div className="transparency-stat-chip">
                  <span className="stat-number">{summary.verified}</span>
                  <span className="stat-label">{t('Verified Announcements')}</span>
                </div>
                <div className="transparency-stat-chip">
                  <span className="stat-number">{summary.categories}</span>
                  <span className="stat-label">{t('Statutory Categories')}</span>
                </div>
                <div className="transparency-stat-chip">
                  <span className="stat-number">{summary.departments}</span>
                  <span className="stat-label">{t('Government Departments')}</span>
                </div>
                <div className="transparency-stat-chip">
                  <span className="stat-number">{summary.archived}</span>
                  <span className="stat-label">{t('Historical Archive')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKSPACE INTEGRATION TABS (If embedded in citizen workspace) */}
        {ctx && (
          <div className="transparency-view-tabs" role="tablist" aria-label={t('Transparency Views')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'notifications'}
              className={`view-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} />
              <span>{t('Citizen Notification Centre')}</span>
              {citizenNotifications.length > 0 && (
                <span className="tab-badge">{citizenNotifications.length}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'announcements'}
              className={`view-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              <ScrollText size={18} />
              <span>{t('Public Announcements Directory')}</span>
              <span className="tab-badge">{summary.total}</span>
            </button>
          </div>
        )}

        {/* CITIZEN NOTIFICATION CENTRE (When active tab is notifications) */}
        {ctx && activeTab === 'notifications' && (
          <section className="citizen-notifications-section" aria-labelledby="notification-centre-heading">
            <div className="section-head">
              <div>
                <h2 id="notification-centre-heading">{t('Citizen Notification Centre')}</h2>
                <p className="subtext">
                  {t(
                    'Personalized notifications based on your active applications, statutory RTS deadlines, and relevant official announcements.'
                  )}
                </p>
              </div>
            </div>

            {/* Notification Filter Chips */}
            <div className="notification-filter-chips">
              <button
                type="button"
                className={`notif-chip ${notificationFilter === 'all' ? 'active' : ''}`}
                onClick={() => setNotificationFilter('all')}
              >
                {t('All Notifications')} ({citizenNotifications.length})
              </button>
              <button
                type="button"
                className={`notif-chip ${notificationFilter === 'action_required' ? 'active' : ''}`}
                onClick={() => setNotificationFilter('action_required')}
              >
                <AlertTriangle size={14} />
                {t('Action Required')} (
                {citizenNotifications.filter((n) => n.type === 'action_required').length})
              </button>
              <button
                type="button"
                className={`notif-chip ${notificationFilter === 'application_status' ? 'active' : ''}`}
                onClick={() => setNotificationFilter('application_status')}
              >
                <CheckCircle2 size={14} />
                {t('Application Updates')} (
                {citizenNotifications.filter((n) => n.type === 'application_status').length})
              </button>
              <button
                type="button"
                className={`notif-chip ${notificationFilter === 'rts_alert' ? 'active' : ''}`}
                onClick={() => setNotificationFilter('rts_alert')}
              >
                <Clock size={14} />
                {t('RTS Deadlines')} ({citizenNotifications.filter((n) => n.type === 'rts_alert').length})
              </button>
              <button
                type="button"
                className={`notif-chip ${notificationFilter === 'relevant_announcement' ? 'active' : ''}`}
                onClick={() => setNotificationFilter('relevant_announcement')}
              >
                <Sparkles size={14} />
                {t('Relevant Announcements')} (
                {citizenNotifications.filter((n) => n.type === 'relevant_announcement').length})
              </button>
            </div>

            {/* Notification List */}
            {filteredNotifications.length > 0 ? (
              <div className="notification-cards-list">
                {filteredNotifications.map((n) => (
                  <div key={n.id} className={`notification-card severity-${n.severity}`}>
                    <div className="notification-icon-col">
                      {n.severity === 'urgent' ? (
                        <AlertTriangle className="icon-urgent" size={22} />
                      ) : n.severity === 'warning' ? (
                        <Clock className="icon-warning" size={22} />
                      ) : n.severity === 'success' ? (
                        <CheckCircle2 className="icon-success" size={22} />
                      ) : (
                        <Info className="icon-info" size={22} />
                      )}
                    </div>
                    <div className="notification-body">
                      <div className="notification-header-row">
                        <strong>{t(n.title)}</strong>
                        <span className="notification-source-tag">
                          {n.source === 'official_announcement'
                            ? t('Official Government Announcement')
                            : t('GovSync Automated Tracking')}
                        </span>
                      </div>
                      <p className="notification-message">{t(n.message)}</p>
                      <div className="notification-meta-row">
                        <span className="notif-timestamp">
                          <Clock size={13} /> {n.timestamp}
                        </span>
                        {n.referenceId && (
                          <span className="notif-ref">
                            <Tag size={13} /> {n.referenceId}
                          </span>
                        )}
                        {n.linkTarget && (
                          <button
                            type="button"
                            className="btn small notif-action-btn"
                            onClick={() => {
                              if (n.linkTarget === 'transparency' && n.announcement) {
                                setActiveModalItem(n.announcement);
                              } else if (n.linkTarget) {
                                ctx?.move(n.linkTarget);
                              }
                            }}
                          >
                            {n.linkAction === 'open_application'
                              ? t('Respond to clarification')
                              : n.linkAction === 'view_certificate'
                              ? t('Download Certificate')
                              : n.linkAction === 'file_appeal'
                              ? t('File RTS Appeal')
                              : n.linkAction === 'track_rts'
                              ? t('Track RTS Deadline')
                              : t('View Details')}
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state panel">
                <CheckCircle2 size={36} style={{ color: 'var(--success, #16a34a)', margin: '0 auto 12px' }} />
                <h3>{t('No active notifications')}</h3>
                <p className="subtext">{t('All your applications and statutory deadlines are up to date.')}</p>
              </div>
            )}

            <div className="demo-notice-bar" style={{ marginTop: '20px' }}>
              <div className="demo-notice-content">
                <strong>{t('Privacy & Data Governance Notice')}</strong>
                <p>
                  {t(
                    'Notification delivery is contained strictly within your authenticated GovSync workspace. No external SMS or email is dispatched in this demonstration environment.'
                  )}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* PUBLIC ANNOUNCEMENTS DIRECTORY (Visible always on public route or when activeTab is announcements) */}
        {(!ctx || activeTab === 'announcements') && (
          <>
            {/* CATEGORIES NAVIGATION */}
            <section className="transparency-categories-section" aria-labelledby="categories-heading">
              <div className="section-head">
                <div>
                  <h2 id="categories-heading">{t('Announcement Categories')}</h2>
                  <p className="subtext">{t('Filter by statutory policy, department orders, or citizen services.')}</p>
                </div>
              </div>

              <div className="categories-grid" role="group" aria-label={t('Announcement Categories')}>
                <button
                  type="button"
                  className={`category-card-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                  aria-pressed={selectedCategory === 'all'}
                >
                  <div className="category-icon-wrapper">
                    <Layers size={22} />
                  </div>
                  <div className="category-info">
                    <strong>{t('All Categories')}</strong>
                    <span className="category-count">{summary.total} {t('announcements')}</span>
                  </div>
                </button>

                {TRANSPARENCY_CATEGORIES.map((cat) => {
                  const Icon = categoryIconMap[cat.id] || FileText;
                  const count = categoryCounts[cat.id] || 0;
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-card-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleCategorySelect(cat.id)}
                      aria-pressed={isSelected}
                    >
                      <div className="category-icon-wrapper">
                        <Icon size={22} />
                      </div>
                      <div className="category-info">
                        <strong>{t(cat.name)}</strong>
                        <span className="category-count">{count} {t('announcements')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ADVANCED FILTERS BAR */}
            <section className="transparency-filters-bar" aria-label={t('Filters')}>
              <div className="filters-row">
                {/* Department Dropdown */}
                <div className="filter-group">
                  <label htmlFor="dept-filter-select">{t('Department')}</label>
                  <select
                    id="dept-filter-select"
                    className="filter-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="all">{t('All Departments')}</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification Status */}
                <div className="filter-group">
                  <label htmlFor="status-filter-select">{t('Verification Status')}</label>
                  <select
                    id="status-filter-select"
                    className="filter-select"
                    value={selectedVerificationStatus}
                    onChange={(e) => setSelectedVerificationStatus(e.target.value)}
                  >
                    <option value="all">{t('All Statuses')}</option>
                    <option value="verified">{t('Fully Verified')}</option>
                    <option value="partially_verified">{t('Partially Verified')}</option>
                    <option value="historical_archive">{t('Historical Archive Record')}</option>
                  </select>
                </div>

                {/* Current Validity */}
                <div className="filter-group">
                  <label htmlFor="validity-filter-select">{t('Current Validity')}</label>
                  <select
                    id="validity-filter-select"
                    className="filter-select"
                    value={selectedValidity}
                    onChange={(e) => setSelectedValidity(e.target.value)}
                  >
                    <option value="all">{t('All Validities')}</option>
                    <option value="active">{t('Active / In Force')}</option>
                    <option value="expired">{t('Expired / Concluded')}</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="filter-group">
                  <label htmlFor="sort-select">{t('Sort by')}</label>
                  <select
                    id="sort-select"
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                  >
                    <option value="newest">{t('Newest First')}</option>
                    <option value="oldest">{t('Oldest First')}</option>
                    <option value="title">{t('Title (A-Z)')}</option>
                  </select>
                </div>

                {/* Historical Archive Toggle */}
                <div className="filter-group checkbox-group">
                  <label className="checkbox-label" htmlFor="include-archive-cb">
                    <input
                      id="include-archive-cb"
                      type="checkbox"
                      checked={includeArchive}
                      onChange={(e) => setIncludeArchive(e.target.checked)}
                    />
                    <span>{t('Include Historical Archive')}</span>
                  </label>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn small reset-filters-btn"
                    onClick={resetFilters}
                  >
                    <RotateCcw size={14} />
                    {t('Clear all filters')}
                  </button>
                )}
              </div>

              <div className="filter-results-summary">
                <span>
                  {t('Showing {count} of {total} announcements', {
                    count: filteredAnnouncements.length,
                    total: summary.total,
                  })}
                </span>
                {includeArchive && (
                  <span className="archive-pill">
                    <Clock size={12} /> {t('Historical archive included')}
                  </span>
                )}
              </div>
            </section>

            {/* ANNOUNCEMENT CARDS LIST */}
            <section className="transparency-list-section" aria-label={t('Verified Announcements')}>
              {filteredAnnouncements.length > 0 ? (
                <div className="announcements-grid">
                  {filteredAnnouncements.map((item) => {
                    const CategoryIcon = categoryIconMap[item.category] || FileText;

                    return (
                      <article key={item.id} className="announcement-card">
                        <div className="card-top-meta">
                          <div className="category-pill">
                            <CategoryIcon size={14} />
                            <span>{t(TRANSPARENCY_CATEGORIES.find((c) => c.id === item.category)?.name || item.category)}</span>
                          </div>
                          <div className="card-status-badges">
                            {item.isNew && !item.isArchive && item.validityStatus !== 'expired' && (
                              <span className="badge-new">{t('Newly Published')}</span>
                            )}
                            {item.verificationStatus === 'verified' ? (
                              <span className="badge-verified">{t('Fully Verified')}</span>
                            ) : item.verificationStatus === 'partially_verified' ? (
                              <span className="badge-partial">{t('Partially Verified')}</span>
                            ) : (
                              <span className="badge-archive">{t('Historical Archive Record')}</span>
                            )}
                            {item.validityStatus === 'expired' && (
                              <span className="badge-expired">{t('Expired / Concluded')}</span>
                            )}
                          </div>
                        </div>

                        <h3 className="announcement-title">
                          <button
                            type="button"
                            className="title-link-btn"
                            onClick={() => setActiveModalItem(item)}
                          >
                            {t(item.title)}
                          </button>
                        </h3>

                        <p className="announcement-summary">{t(item.summary)}</p>

                        <div className="announcement-meta-grid">
                          <div className="meta-item">
                            <Landmark size={14} className="meta-icon" />
                            <span>{item.department}</span>
                          </div>
                          <div className="meta-item">
                            <Clock size={14} className="meta-icon" />
                            <span>
                              {t('Publication Date')}: {item.publicationDate}
                            </span>
                          </div>
                          <div className="meta-item">
                            <Tag size={14} className="meta-icon" />
                            <code>{item.referenceNumber}</code>
                          </div>
                        </div>

                        <div className="announcement-actions">
                          <button
                            type="button"
                            className="btn primary small"
                            onClick={() => setActiveModalItem(item)}
                          >
                            {t('View Announcement Details')}
                            <ArrowRight size={14} />
                          </button>
                          <a
                            href={item.officialSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn small source-link-btn"
                            title={t('Open official portal in new tab')}
                          >
                            <ExternalLink size={14} />
                            {t('Official Source')}
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state panel">
                  <Search size={36} style={{ color: 'var(--text-muted, #64748b)', margin: '0 auto 12px' }} />
                  <h3>{t('No matching announcements found')}</h3>
                  <p className="subtext">
                    {t('Try broadening your search query or selecting a different category.')}
                  </p>
                  <button type="button" className="btn small" onClick={resetFilters}>
                    <RotateCcw size={14} />
                    {t('Clear all filters')}
                  </button>
                </div>
              )}
            </section>

            {/* TRANSPARENCY & VERIFICATION STANDARDS SECTION */}
            <section className="transparency-standards-section" aria-labelledby="standards-heading">
              <div className="section-head">
                <div>
                  <h2 id="standards-heading">{t('Transparency & Source Verification Standards')}</h2>
                  <p className="subtext">
                    {t('How GovSync verifies government announcements and preserves public records')}
                  </p>
                </div>
              </div>

              <div className="standards-grid">
                <div className="standard-card">
                  <div className="standard-icon-wrapper">
                    <ShieldCheck size={24} />
                  </div>
                  <h3>{t('1. Authoritative Government Portals Only')}</h3>
                  <p>
                    {t(
                      'Every announcement in this directory is sourced directly from Maharashtra Government Resolution (GR) databases (gr.maharashtra.gov.in), Aaple Sarkar, or official ministry notification gazettes.'
                    )}
                  </p>
                </div>

                <div className="standard-card">
                  <div className="standard-icon-wrapper">
                    <Clock size={24} />
                  </div>
                  <h3>{t('2. Verification Timestamp & Reference Codes')}</h3>
                  <p>
                    {t(
                      'Each record displays the exact government circular number, official issuing department, publication date, and the date our systems last audited the source link.'
                    )}
                  </p>
                </div>

                <div className="standard-card">
                  <div className="standard-icon-wrapper">
                    <FileText size={24} />
                  </div>
                  <h3>{t('3. Clear Distinction of Historical Records')}</h3>
                  <p>
                    {t(
                      'Old circulars, expired application windows, and concluded programs are never deleted. Instead, they are explicitly catalogued as historical archives to prevent confusion with active citizen policies.'
                    )}
                  </p>
                </div>

                <div className="standard-card">
                  <div className="standard-icon-wrapper">
                    <Info size={24} />
                  </div>
                  <h3>{t('4. Independent Civic Platform Disclaimer')}</h3>
                  <p>
                    {t(
                      'GovSync is an independent civic technology platform. We do not issue government resolutions, modify official policy, or operate as a government authority. Always review original government gazettes before legal or financial commitments.'
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* OFFICIAL GOVERNMENT PORTALS DIRECTORY */}
            <section className="official-portals-section" aria-labelledby="portals-heading">
              <div className="section-head">
                <div>
                  <h2 id="portals-heading">{t('Official Government Sources')}</h2>
                  <p className="subtext">{t('Direct access to Maharashtra and Government of India gazette portals.')}</p>
                </div>
              </div>

              <div className="portals-grid">
                {OFFICIAL_GOVERNMENT_PORTALS.map((portal) => (
                  <a
                    key={portal.id}
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-link-card"
                  >
                    <div className="portal-card-top">
                      <strong>{portal.name}</strong>
                      <ExternalLink size={16} className="portal-external-icon" />
                    </div>
                    <span className="portal-dept">{portal.department}</span>
                    <p className="portal-desc">{portal.description}</p>
                    <span className="portal-url-label">{portal.url.replace(/^https?:\/\//, '')}</span>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ANNOUNCEMENT DETAIL MODAL */}
        {activeModalItem && (
          <div
            className="transparency-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveModalItem(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-announcement-title"
          >
            <div className="transparency-modal-card">
              <div className="modal-header">
                <div>
                  <div className="modal-category-row">
                    <span className="badge category">
                      {t(
                        TRANSPARENCY_CATEGORIES.find((c) => c.id === activeModalItem.category)?.name ||
                          activeModalItem.category
                      )}
                    </span>
                    {activeModalItem.verificationStatus === 'verified' ? (
                      <span className="badge-verified">{t('Fully Verified')}</span>
                    ) : activeModalItem.verificationStatus === 'partially_verified' ? (
                      <span className="badge-partial">{t('Partially Verified')}</span>
                    ) : (
                      <span className="badge-archive">{t('Historical Archive Record')}</span>
                    )}
                    {activeModalItem.validityStatus === 'expired' && (
                      <span className="badge-expired">{t('Expired / Concluded')}</span>
                    )}
                  </div>
                  <h2 id="modal-announcement-title">{t(activeModalItem.title)}</h2>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setActiveModalItem(null)}
                  aria-label={t('Close Details')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* Reference Code Strip */}
                <div className="modal-ref-strip">
                  <div>
                    <span className="ref-label">{t('Reference / GR Code')}</span>
                    <code className="ref-value">{activeModalItem.referenceNumber}</code>
                  </div>
                  <div>
                    <span className="ref-label">{t('Issuing Department')}</span>
                    <strong className="ref-value">{activeModalItem.department}</strong>
                  </div>
                </div>

                {/* Summary */}
                <div className="modal-section">
                  <h3>{t('Summary')}</h3>
                  <p className="modal-summary-text">{t(activeModalItem.summary)}</p>
                </div>

                {/* Full Description */}
                <div className="modal-section">
                  <h3>{t('Full Announcement')}</h3>
                  <p className="modal-description-text">{activeModalItem.fullDescription}</p>
                </div>

                {/* Dates & Timeline Grid */}
                <div className="modal-dates-grid">
                  <div className="date-box">
                    <span className="date-label">{t('Publication Date')}</span>
                    <strong className="date-val">{activeModalItem.publicationDate}</strong>
                  </div>
                  <div className="date-box">
                    <span className="date-label">{t('Effective Date')}</span>
                    <strong className="date-val">{activeModalItem.effectiveDate}</strong>
                  </div>
                  {activeModalItem.expiryDate && (
                    <div className="date-box">
                      <span className="date-label">{t('Expiry Date')}</span>
                      <strong className="date-val">{activeModalItem.expiryDate}</strong>
                    </div>
                  )}
                  <div className="date-box">
                    <span className="date-label">{t('Last Verified')}</span>
                    <strong className="date-val">{activeModalItem.lastVerifiedDate}</strong>
                  </div>
                </div>

                {/* External Links Strip */}
                <div className="modal-actions-box">
                  <a
                    href={activeModalItem.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn primary"
                  >
                    <ExternalLink size={16} />
                    {t('Open Official Government Portal')}
                  </a>
                  {activeModalItem.documentUrl && (
                    <a
                      href={activeModalItem.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      <FileText size={16} />
                      {t('Original Document (PDF)')}
                    </a>
                  )}
                  {activeModalItem.relatedServiceId && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setActiveModalItem(null);
                        if (embedded && ctx) {
                          if (activeModalItem.relatedServiceId === 'agriculture') ctx.move('agriculture');
                          else if (activeModalItem.relatedServiceId === 'rts') ctx.move('rts');
                          else if (activeModalItem.relatedServiceId === 'grievances') ctx.move('grievances');
                          else ctx.move('schemes');
                        }
                      }}
                    >
                      <Sparkles size={16} />
                      {t('Explore Related Service')}
                    </button>
                  )}
                </div>

                <p className="modal-disclaimer">
                  <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  {t(
                    'External official government portal. GovSync does not claim ownership of official government orders.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {!embedded && (
        <footer className="portal-footer" role="contentinfo">
          <div className="footer-inner">
            <div className="footer-meta">
              <strong>{siteConfig.name} · {t('Government Transparency & Notification Centre')}</strong>
              <p>{t('Public civic utility for Maharashtra Government Resolutions and official notices.')}</p>
            </div>
            <div className="footer-links">
              <Link href="/">{t('Services')}</Link>
              <Link href="/transparency">{t('Transparency')}</Link>
              <Link href="/agriculture">{t('Agriculture')}</Link>
              <Link href="/directory">{t('Directory')}</Link>
              <Link href="/rts">{t('RTS Deadlines')}</Link>
              <Link href="/grievances">{t('Grievance Centre')}</Link>
            </div>
          </div>
        </footer>
      )}

      {/* STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        .transparency-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px 48px;
          box-sizing: border-box;
          width: 100%;
        }
        .transparency-embedded-view {
          width: 100%;
          box-sizing: border-box;
        }
        .transparency-hero {
          background: #FFFDFA;
          border: 1px solid rgba(185, 66, 32, 0.15);
          border-radius: 8px;
          padding: 32px 28px;
          margin-bottom: 28px;
          box-shadow: 0 2px 8px rgba(16, 43, 58, 0.04);
        }
        .transparency-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(185, 66, 32, 0.08);
          color: #B94220;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 9999px;
          margin-bottom: 12px;
        }
        .transparency-hero h1 {
          font-family: var(--font-serif, Georgia, serif);
          font-size: 2.1rem;
          color: #102B3A;
          margin: 0 0 10px;
          line-height: 1.25;
        }
        .transparency-hero-desc {
          font-size: 1.05rem;
          color: #475569;
          margin: 0 0 24px;
          line-height: 1.5;
          max-width: 800px;
        }
        .transparency-search-box {
          margin-bottom: 24px;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 680px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          color: #64748B;
          pointer-events: none;
        }
        .transparency-search-input {
          width: 100%;
          padding: 12px 42px 12px 44px;
          font-size: 1rem;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          background: #FFFFFF;
          color: #102B3A;
          box-sizing: border-box;
        }
        .transparency-search-input:focus {
          outline: none;
          border-color: #B94220;
          box-shadow: 0 0 0 3px rgba(185, 66, 32, 0.15);
        }
        .clear-search-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 4px;
        }
        .transparency-stats-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .transparency-stat-chip {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 8px 14px;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .stat-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: #102B3A;
        }
        .stat-label {
          font-size: 0.8125rem;
          color: #64748B;
        }
        .transparency-view-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 4px;
        }
        .view-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #475569;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          margin-bottom: -6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .view-tab-btn.active {
          color: #B94220;
          border-bottom-color: #B94220;
        }
        .tab-badge {
          background: #E2E8F0;
          color: #102B3A;
          font-size: 0.75rem;
          padding: 2px 7px;
          border-radius: 9999px;
        }
        .view-tab-btn.active .tab-badge {
          background: #B94220;
          color: #FFFFFF;
        }
        .citizen-notifications-section {
          background: #FFFDFA;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 28px;
        }
        .notification-filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0 20px;
        }
        .notif-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          font-size: 0.8125rem;
          border-radius: 9999px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #334155;
          cursor: pointer;
        }
        .notif-chip.active {
          background: #102B3A;
          color: #FFFFFF;
          border-color: #102B3A;
        }
        .notification-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .notification-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
        }
        .notification-card.severity-urgent {
          border-left: 4px solid #DC2626;
          background: #FEF2F2;
        }
        .notification-card.severity-warning {
          border-left: 4px solid #D97706;
          background: #FFFBEB;
        }
        .notification-card.severity-success {
          border-left: 4px solid #16A34A;
          background: #F0FDF4;
        }
        .notification-card.severity-info {
          border-left: 4px solid #2563EB;
          background: #EFF6FF;
        }
        .icon-urgent { color: #DC2626; }
        .icon-warning { color: #D97706; }
        .icon-success { color: #16A34A; }
        .icon-info { color: #2563EB; }
        .notification-body {
          flex: 1;
        }
        .notification-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 4px;
        }
        .notification-header-row strong {
          font-size: 0.95rem;
          color: #102B3A;
        }
        .notification-source-tag {
          font-size: 0.75rem;
          color: #64748B;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .notification-message {
          font-size: 0.875rem;
          color: #334155;
          margin: 0 0 10px;
          line-height: 1.45;
        }
        .notification-meta-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 0.8125rem;
          color: #64748B;
        }
        .notif-timestamp, .notif-ref {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .notif-action-btn {
          margin-left: auto;
        }
        .transparency-categories-section {
          margin-bottom: 28px;
        }
        .section-head {
          margin-bottom: 16px;
        }
        .section-head h2 {
          font-family: var(--font-serif, Georgia, serif);
          font-size: 1.4rem;
          color: #102B3A;
          margin: 0 0 4px;
        }
        .subtext {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0;
        }
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 12px;
        }
        .category-card-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #FFFDFA;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .category-card-btn:hover {
          border-color: #B94220;
          box-shadow: 0 2px 6px rgba(185, 66, 32, 0.08);
        }
        .category-card-btn.active {
          border-color: #B94220;
          background: #FFF5F2;
        }
        .category-icon-wrapper {
          color: #B94220;
          flex-shrink: 0;
        }
        .category-info strong {
          display: block;
          font-size: 0.875rem;
          color: #102B3A;
          line-height: 1.25;
        }
        .category-count {
          font-size: 0.75rem;
          color: #64748B;
        }
        .transparency-filters-bar {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .filters-row {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 14px;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
        }
        .filter-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .filter-select {
          padding: 8px 10px;
          font-size: 0.875rem;
          border: 1px solid #CBD5E1;
          border-radius: 4px;
          background: #FFFFFF;
          color: #102B3A;
        }
        .checkbox-group {
          justify-content: flex-end;
          padding-bottom: 6px;
        }
        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          color: #334155;
          cursor: pointer;
        }
        .reset-filters-btn {
          margin-bottom: 4px;
        }
        .filter-results-summary {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #E2E8F0;
          font-size: 0.8125rem;
          color: #64748B;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .archive-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #FEF3C7;
          color: #92400E;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }
        .announcements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .announcement-card {
          background: #FFFDFA;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .announcement-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(16, 43, 58, 0.05);
        }
        .card-top-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }
        .category-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #B94220;
          background: rgba(185, 66, 32, 0.08);
          padding: 3px 8px;
          border-radius: 4px;
        }
        .card-status-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .badge-verified {
          font-size: 0.6875rem;
          font-weight: 600;
          background: #DCFCE7;
          color: #15803D;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-partial {
          font-size: 0.6875rem;
          font-weight: 600;
          background: #FEF3C7;
          color: #B45309;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-archive {
          font-size: 0.6875rem;
          font-weight: 600;
          background: #F1F5F9;
          color: #475569;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-expired {
          font-size: 0.6875rem;
          font-weight: 600;
          background: #FEE2E2;
          color: #991B1B;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge-new {
          font-size: 0.6875rem;
          font-weight: 600;
          background: #E0E7FF;
          color: #3730A3;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .announcement-title {
          font-family: var(--font-serif, Georgia, serif);
          font-size: 1.05rem;
          color: #102B3A;
          margin: 0 0 8px;
          line-height: 1.35;
        }
        .title-link-btn {
          background: none;
          border: none;
          color: inherit;
          font: inherit;
          text-align: left;
          padding: 0;
          cursor: pointer;
        }
        .title-link-btn:hover {
          color: #B94220;
          text-decoration: underline;
        }
        .announcement-summary {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.45;
          margin: 0 0 14px;
          flex: 1;
        }
        .announcement-meta-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
          padding: 10px;
          background: #F8FAFC;
          border-radius: 4px;
          font-size: 0.8125rem;
          color: #475569;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .meta-icon {
          color: #64748B;
          flex-shrink: 0;
        }
        .meta-item code {
          font-size: 0.75rem;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          padding: 1px 4px;
          border-radius: 3px;
        }
        .announcement-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #F1F5F9;
        }
        .source-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #64748B;
          text-decoration: none;
        }
        .source-link-btn:hover {
          color: #102B3A;
        }
        .transparency-standards-section {
          background: #FFFDFA;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 28px;
        }
        .standards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .standard-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 16px;
        }
        .standard-icon-wrapper {
          color: #B94220;
          margin-bottom: 10px;
        }
        .standard-card h3 {
          font-size: 0.95rem;
          color: #102B3A;
          margin: 0 0 6px;
        }
        .standard-card p {
          font-size: 0.8125rem;
          color: #475569;
          line-height: 1.45;
          margin: 0;
        }
        .official-portals-section {
          margin-bottom: 32px;
        }
        .portals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }
        .portal-link-card {
          background: #FFFDFA;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 14px;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .portal-link-card:hover {
          border-color: #B94220;
          box-shadow: 0 2px 8px rgba(185, 66, 32, 0.08);
        }
        .portal-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }
        .portal-card-top strong {
          font-size: 0.9rem;
          color: #102B3A;
        }
        .portal-external-icon {
          color: #64748B;
          flex-shrink: 0;
        }
        .portal-dept {
          font-size: 0.75rem;
          color: #B94220;
          margin-bottom: 6px;
          display: block;
        }
        .portal-desc {
          font-size: 0.8125rem;
          color: #475569;
          line-height: 1.4;
          margin: 0 0 10px;
          flex: 1;
        }
        .portal-url-label {
          font-size: 0.75rem;
          color: #64748B;
          word-break: break-all;
        }

        /* MODAL STYLES */
        .transparency-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(16, 43, 58, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .transparency-modal-card {
          background: #FFFFFF;
          border-radius: 8px;
          max-width: 680px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 24px;
          border-bottom: 1px solid #E2E8F0;
        }
        .modal-category-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .modal-header h2 {
          font-family: var(--font-serif, Georgia, serif);
          font-size: 1.3rem;
          color: #102B3A;
          margin: 0;
          line-height: 1.3;
        }
        .modal-close-btn {
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .modal-close-btn:hover {
          color: #102B3A;
          background: #F1F5F9;
        }
        .modal-body {
          padding: 20px 24px;
        }
        .modal-ref-strip {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }
        .ref-label {
          display: block;
          font-size: 0.6875rem;
          color: #64748B;
          text-transform: uppercase;
        }
        .ref-value {
          font-size: 0.875rem;
          color: #102B3A;
        }
        .modal-section {
          margin-bottom: 18px;
        }
        .modal-section h3 {
          font-size: 0.875rem;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 6px;
        }
        .modal-summary-text {
          font-size: 0.95rem;
          font-weight: 500;
          color: #1E293B;
          line-height: 1.5;
          margin: 0;
        }
        .modal-description-text {
          font-size: 0.9rem;
          color: #334155;
          line-height: 1.55;
          margin: 0;
        }
        .modal-dates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 12px;
        }
        .date-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .date-label {
          font-size: 0.6875rem;
          color: #64748B;
          text-transform: uppercase;
        }
        .date-val {
          font-size: 0.875rem;
          color: #102B3A;
        }
        .modal-actions-box {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }
        .modal-disclaimer {
          font-size: 0.75rem;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 768px) {
          .transparency-hero {
            padding: 24px 18px;
          }
          .transparency-hero h1 {
            font-size: 1.6rem;
          }
          .announcements-grid {
            grid-template-columns: 1fr;
          }
          .filters-row {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-group {
            width: 100%;
          }
        }
        @media (max-width: 480px) {
          .transparency-main {
            padding: 16px 12px 32px;
          }
          .transparency-stats-row {
            gap: 8px;
          }
          .transparency-stat-chip {
            flex: 1 1 40%;
          }
          .categories-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </div>
  );
}

export default function PublicTransparencyShell() {
  return (
    <LanguageProvider>
      <PublicTransparencyContent />
    </LanguageProvider>
  );
}
