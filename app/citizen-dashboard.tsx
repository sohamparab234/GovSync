'use client';
import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  FileCheck2,
  GraduationCap,
  MapPin,
  ShoppingBasket,
  Plane,
  HeartHandshake,
  ScrollText,
  ShieldCheck,
  Layers,
  Calendar,
  Printer,
  User,
  Globe,
  RefreshCw,
  Sparkles,
  Route,
  LifeBuoy,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from './i18n';
import { Badge } from './workspace';
import { getServiceName } from './portal';
import { getAllServices, serviceCategories, services, type Service } from '@/lib/services';
import { getRtsSummary } from '@/lib/rts';
import type { AuditRecord, WorkspaceContext } from '@/lib/types';
import { getStageInfo, type StageInfo } from '@/lib/dashboard-helpers';

export { getStageInfo, type StageInfo };

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  GraduationCap,
  MapPin,
  ShoppingBasket,
  Plane,
  HeartHandshake,
  FileText,
  ScrollText,
};

export interface CitizenDashboardProps {
  ctx: WorkspaceContext;
  query?: string;
  clearSearch?: () => void;
}

export function CitizenDashboard({ ctx: c, query, clearSearch }: CitizenDashboardProps) {
  const { t, n, date, language } = useLanguage();
  const allServices = getAllServices();

  // Local state for Applications section
  const [appSearch, setAppSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'clarification' | 'approved' | 'rejected'>('all');
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'name'>('recent');

  // Local state for Services Catalogue
  const [serviceSearch, setServiceSearch] = useState(query || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const apps = useMemo(() => c.workspace.applications || [], [c.workspace.applications]);
  const rtsSummary = useMemo(() => getRtsSummary(apps), [apps]);
  const audits = useMemo(() => c.workspace.audit || [], [c.workspace.audit]);
  const user = c.workspace.user;

  // 1. Calculated Summary Counts (from real authorized application records)
  const totalCount = apps.length;
  const inProgressApps = useMemo(() => apps.filter((a) => ['draft', 'submitted', 'eligible'].includes(a.status)), [apps]);
  const clarificationApps = useMemo(() => apps.filter((a) => a.status === 'clarification'), [apps]);
  const completedApps = useMemo(() => apps.filter((a) => ['approved', 'rejected'].includes(a.status)), [apps]);

  // 2. Filtered and Sorted Applications
  const filteredApps = useMemo(() => {
    let result = [...apps];

    // Status filter
    if (statusFilter === 'in_progress') {
      result = result.filter((a) => ['draft', 'submitted', 'eligible'].includes(a.status));
    } else if (statusFilter === 'clarification') {
      result = result.filter((a) => a.status === 'clarification');
    } else if (statusFilter === 'approved') {
      result = result.filter((a) => a.status === 'approved');
    } else if (statusFilter === 'rejected') {
      result = result.filter((a) => a.status === 'rejected');
    }

    // Text search
    const needle = appSearch.trim().toLowerCase();
    if (needle) {
      result = result.filter((a) => {
        const svcName = getServiceName(a.service);
        const searchable = [svcName, t(svcName), a.id, a.citizen_id, a.name, t(a.name)].join(' ').toLowerCase();
        return searchable.includes(needle);
      });
    }

    // Sort
    if (sortOption === 'recent') {
      result.sort((x, y) => {
        const tx = new Date(x.decided_at || x.submitted_at || x.created_at).getTime();
        const ty = new Date(y.decided_at || y.submitted_at || y.created_at).getTime();
        return ty - tx;
      });
    } else if (sortOption === 'oldest') {
      result.sort((x, y) => {
        const tx = new Date(x.created_at).getTime();
        const ty = new Date(y.created_at).getTime();
        return tx - ty;
      });
    } else if (sortOption === 'name') {
      result.sort((x, y) => getServiceName(x.service).localeCompare(getServiceName(y.service)));
    }

    return result;
  }, [apps, statusFilter, appSearch, sortOption, t]);

  // 3. Verified Dates & Upcoming Deadlines
  const deadlineItems = useMemo(() => {
    const list: Array<{
      id: string;
      appId: string;
      service: string;
      type: 'official' | 'application' | 'estimated';
      typeLabel: string;
      label: string;
      dateString: string;
      description: string;
    }> = [];

    apps.forEach((a) => {
      const svcName = getServiceName(a.service);
      const svcDef = services[a.service as Service];

      // A. Consent Expiry (Application-specific date)
      if (a.consent === 1 && ['draft', 'eligible'].includes(a.status) && a.expires_at) {
        list.push({
          id: `${a.id}-consent`,
          appId: a.id,
          service: svcName,
          type: 'application',
          typeLabel: 'Application-specific date',
          label: 'Data access permission expires',
          dateString: a.expires_at,
          description: t('Data access permission valid until {date}. Re-consent required after expiry.', {
            date: date(a.expires_at, true),
          }),
        });
      }

      // B. Estimated SLA Processing Window (Estimated demo duration)
      if (a.status === 'submitted' && svcDef) {
        list.push({
          id: `${a.id}-sla`,
          appId: a.id,
          service: svcName,
          type: 'estimated',
          typeLabel: 'Estimated demo duration',
          label: 'Standard department review SLA window',
          dateString: svcDef.estimatedTime,
          description: t('Estimated processing duration: {time}. Review in progress.', {
            time: svcDef.estimatedTime,
          }),
        });
      }

      // C. Official Decision Date (Official record date)
      if (a.decided_at && ['approved', 'rejected'].includes(a.status)) {
        list.push({
          id: `${a.id}-decided`,
          appId: a.id,
          service: svcName,
          type: 'official',
          typeLabel: 'Official record date',
          label: 'Official decision recorded on',
          dateString: a.decided_at,
          description: t('Official department decision recorded on {date}.', {
            date: date(a.decided_at, true),
          }),
        });
      }
    });

    return list.slice(0, 5);
  }, [apps, t, date]);

  // 4. Recent Activity Items (filtered to this citizen)
  const recentActivities = useMemo(() => {
    return audits.slice(0, 5);
  }, [audits]);

  // 5. Recommended Services (4 core verified services)
  const recommendedServices: Service[] = ['scholarship', 'residence', 'ration-card', 'pension'];

  // 6. Marketplace filtering
  const needleSvc = serviceSearch.trim().toLowerCase();
  const matchedServices = allServices.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!needleSvc) return true;
    const searchable = [s.name, t(s.name), s.description, t(s.description), s.category, t(s.category), s.department, s.keywords]
      .join(' ')
      .toLowerCase();
    return searchable.includes(needleSvc);
  });

  const langNames: Record<string, string> = {
    en: 'English',
    hi: 'हिंदी',
    mr: 'मराठी',
  };

  const handleCardFilter = (filter: 'all' | 'in_progress' | 'clarification' | 'approved' | 'rejected') => {
    setStatusFilter(filter);
    const target = filter === 'clarification' ? document.getElementById('action-required') : document.getElementById('my-applications');
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="citizen-dashboard-root">
      {/* SECTION A: Welcome and Citizen Overview */}
      <section className="panel citizen-overview-card" aria-labelledby="dashboard-overview-heading">
        <div className="citizen-overview-main">
          <div className="citizen-greeting-col">
            <p className="eyebrow">{t('Citizen portal')}</p>
            <h1 id="dashboard-overview-heading">
              {t('Welcome, {name}', { name: user?.name || t('Citizen') })}
            </h1>
            <p className="citizen-overview-desc">
              {t('Unified Citizen Dashboard for connected government services, application tracking, official scheme discovery and verified records.')}
            </p>
          </div>

          <div className="citizen-profile-box">
            <div className="citizen-profile-row">
              <span className="profile-avatar" aria-hidden="true">
                <User size={20} />
              </span>
              <div className="profile-details">
                <strong>{user?.name || t('Citizen')}</strong>
                <span className="profile-meta">
                  {user?.citizenId
                    ? `${user.citizenId} · ${user.mobile || ''}`
                    : user?.mobile
                    ? (user.mobile.startsWith('+91') ? user.mobile : `+91 ${user.mobile}`)
                    : t('Registered Citizen')}
                </span>
              </div>
            </div>

            <div className="citizen-profile-badges">
              <Badge status="eligible">
                {user?.citizenId ? t('Sample Demo Account') : t('Registered Citizen')}
              </Badge>
              <span className="lang-pill" title={t('Current Language')}>
                <Globe size={14} />
                <span>{langNames[language] || 'English'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="demo-notice-bar">
          <div className="demo-notice-content">
            <strong>{t('Simulated Connected Government Services (Demonstration Environment)')}</strong>
            <p>{t('Simulated government integration — fictional demo records only.')}</p>
          </div>
        </div>
      </section>

      {/* SECTION R: Smart Service Recommendation Banner */}
      <section className="recommendation-banner" aria-label={t('Smart Service Recommendations')}>
        <div className="rec-banner-content">
          <div className="rec-banner-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--brand-primary)', fontFamily: 'var(--heading-font)' }}>
              {t('Need guidance finding the right service?')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {t('Answer a few questions to get tailored service and scheme recommendations.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => c.move('recommendations')}
        >
          <Sparkles size={16} style={{ marginRight: '6px' }} />
          {t('Get Recommendations')}
        </button>
      </section>

      {/* SECTION J: Multi-Service Application Journey Banner */}
      <section className="recommendation-banner journey-banner" aria-label={t('Multi-Service Application Journeys')} style={{ marginTop: '-12px', borderLeftColor: 'var(--brand-secondary)' }}>
        <div className="rec-banner-content">
          <div className="rec-banner-icon journey-icon" style={{ background: '#FFF0EA', color: 'var(--brand-secondary)' }}>
            <Route size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--brand-primary)', fontFamily: 'var(--heading-font)' }}>
              {t('Applying for connected government benefits?')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {t('Track connected service prerequisites, see completed documents, and unlock your next step across 5 state journeys.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => c.move('journeys')}
        >
          <Route size={16} style={{ marginRight: '6px' }} />
          {t('Explore Service Journeys')}
        </button>
      </section>

      {/* SECTION RTS: RTS Statutory Deadline Alerts Banner */}
      {(rtsSummary.metrics.overdueCount > 0 || rtsSummary.metrics.approachingCount > 0) && (
        <section
          className="recommendation-banner rts-alert-banner"
          aria-label={t('RTS Deadline Alerts')}
          style={{
            marginTop: '-12px',
            borderLeftColor: rtsSummary.metrics.overdueCount > 0 ? '#ef4444' : '#f59e0b',
            background: rtsSummary.metrics.overdueCount > 0 ? '#fef2f2' : '#fffbeb',
          }}
        >
          <div className="rec-banner-content">
            <div
              className="rec-banner-icon"
              style={{
                background: rtsSummary.metrics.overdueCount > 0 ? '#fee2e2' : '#fef3c7',
                color: rtsSummary.metrics.overdueCount > 0 ? '#dc2626' : '#d97706',
              }}
            >
              <Clock size={24} />
            </div>
            <div>
              <h3
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '1.05rem',
                  color: rtsSummary.metrics.overdueCount > 0 ? '#991b1b' : '#92400e',
                  fontFamily: 'var(--heading-font)',
                }}
              >
                {t('RTS Deadline Alerts')} ({n(rtsSummary.metrics.overdueCount + rtsSummary.metrics.approachingCount)})
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: rtsSummary.metrics.overdueCount > 0 ? '#7f1d1d' : '#78350f',
                  lineHeight: 1.45,
                }}
              >
                {t('You have {count} application(s) requiring attention under Maharashtra RTS timelines.', {
                  count: rtsSummary.metrics.overdueCount + rtsSummary.metrics.approachingCount,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn primary"
            style={{
              background: rtsSummary.metrics.overdueCount > 0 ? '#dc2626' : '#d97706',
              borderColor: rtsSummary.metrics.overdueCount > 0 ? '#dc2626' : '#d97706',
            }}
            onClick={() => c.move('rts')}
          >
            <Clock size={16} style={{ marginRight: '6px' }} />
            {t('View RTS Deadline Assistant')}
          </button>
        </section>
      )}

      {/* SECTION B: Application Summary Cards */}
      <section className="stats dashboard-summary-cards" aria-label={t('Total Applications')}>
        <button
          type="button"
          className="panel stat dashboard-stat-card"
          onClick={() => handleCardFilter('all')}
          aria-label={t('Total Applications')}
        >
          <span>{t('Total Applications')}</span>
          <div className="number">{n(totalCount)}</div>
          <small className="muted">{t('All submitted and draft records')}</small>
        </button>

        <button
          type="button"
          className="panel stat dashboard-stat-card"
          onClick={() => handleCardFilter('in_progress')}
          aria-label={t('In Progress')}
        >
          <span>{t('In Progress')}</span>
          <div className="number">{n(inProgressApps.length)}</div>
          <small className="muted">{t('Under review or verification')}</small>
        </button>

        <button
          type="button"
          className={'panel stat dashboard-stat-card' + (clarificationApps.length > 0 ? ' alert-highlight' : '')}
          onClick={() => handleCardFilter('clarification')}
          aria-label={t('Action Required')}
        >
          <span>{t('Action Required')}</span>
          <div className={'number' + (clarificationApps.length > 0 ? ' text-terracotta' : '')}>
            {n(clarificationApps.length)}
          </div>
          <small className="muted">{t('Awaiting your response')}</small>
        </button>

        <button
          type="button"
          className="panel stat dashboard-stat-card"
          onClick={() => handleCardFilter('approved')}
          aria-label={t('Completed')}
        >
          <span>{t('Completed')}</span>
          <div className="number">{n(completedApps.length)}</div>
          <small className="muted">{t('Decisions recorded')}</small>
        </button>
      </section>

      {/* SECTION D: Action Required */}
      <section className="section-gap" id="action-required" aria-labelledby="action-required-title">
        {clarificationApps.length > 0 ? (
          <div className="panel action-required-panel alert-theme">
            <div className="action-required-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={24} className="text-warning-icon" />
                <div>
                  <h2 id="action-required-title" style={{ fontSize: '1.15rem' }}>
                    {t('Action required on your applications ({count})', { count: clarificationApps.length })}
                  </h2>
                  <p className="subtext">
                    {t('Reviewing officer requested additional information or clarification to proceed with your application.')}
                  </p>
                </div>
              </div>
            </div>

            <div className="action-required-list">
              {clarificationApps.map((a) => (
                <div key={a.id} className="action-required-item">
                  <div className="action-item-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong>{t(getServiceName(a.service))}</strong>
                      <code className="tracking-id">{a.id}</code>
                      <Badge status="clarification">{t('Clarification requested')}</Badge>
                    </div>
                    {a.decision_note && (
                      <p className="action-item-note">
                        <strong>{t('Officer note')}:</strong> “{a.decision_note}”
                      </p>
                    )}
                  </div>
                  <button className="btn primary small" onClick={() => c.openApp(a)}>
                    {t('Respond to clarification')} <ArrowRight size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="panel action-calm-box">
            <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
            <div>
              <strong>{t('No action required')}</strong>
              <p className="subtext">
                {t('All your applications are up to date. You will be notified here if an officer requests clarification.')}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* SECTION G: Quick Actions */}
      <section className="section-gap" aria-labelledby="quick-actions-title">
        <div className="section-heading">
          <h2 id="quick-actions-title">{t('Quick Actions')}</h2>
        </div>
        <div className="quick-actions-grid">
          <button
            type="button"
            className="quick-action-card tone-0"
            onClick={() => {
              document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="quick-action-icon">
              <Layers size={22} />
            </div>
            <div className="quick-action-body">
              <strong>{t('Explore Government Services')}</strong>
              <small>{t('Browse 7 connected citizen services and start an application.')}</small>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>

          <button
            type="button"
            className="quick-action-card tone-1"
            onClick={() => c.move('recommendations')}
          >
            <div className="quick-action-icon">
              <Sparkles size={22} />
            </div>
            <div className="quick-action-body">
              <strong>{t('Smart Service Recommendations')}</strong>
              <small>{t('Find tailored services and schemes for your situation.')}</small>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>

          <button
            type="button"
            className="quick-action-card tone-2"
            onClick={() => {
              document.getElementById('my-applications')?.scrollIntoView({ behavior: 'smooth' });
              const inp = document.getElementById('app-search-input');
              inp?.focus();
            }}
          >
            <div className="quick-action-icon">
              <Search size={22} />
            </div>
            <div className="quick-action-body">
              <strong>{t('Track Application Status')}</strong>
              <small>{t('View step-by-step audit timelines and verification stages.')}</small>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>

          <button
            type="button"
            className="quick-action-card tone-3"
            onClick={() => c.move('consent')}
          >
            <div className="quick-action-icon">
              <ShieldCheck size={22} />
            </div>
            <div className="quick-action-body">
              <strong>{t('Manage Consent & Permissions')}</strong>
              <small>{t('View or revoke department data sharing permissions at any time.')}</small>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>

          <button
            type="button"
            className="quick-action-card tone-4"
            data-action="journeys"
            onClick={() => c.move('journeys')}
          >
            <div className="quick-action-icon">
              <Route size={22} />
            </div>
            <div className="quick-action-body">
              <strong>{t('Multi-Service Journeys')}</strong>
              <small>{t('Track sequential prerequisites and connected service workflows.')}</small>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>

          <button
            type="button"
            className="quick-action-card tone-5"
            data-action="rts"
            onClick={() => c.move('rts')}
          >
            <div className="quick-action-icon" style={{ background: '#ecfdf5', color: '#0f766e' }}>
              <Clock size={22} />
            </div>
            <div className="quick-action-body">
              <strong>{t('RTS Deadlines & Escalation')}</strong>
              <small>{t('Check Maharashtra RTS 2015 statutory timelines and file appeals.')}</small>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>

          <button
            type="button"
            className="quick-action-card tone-6"
            data-action="grievances"
            onClick={() => c.move('grievances')}
          >
            <div className="quick-action-icon" style={{ background: '#fef2f2', color: '#B94220' }}>
              <LifeBuoy size={22} />
            </div>
            <div className="quick-action-body">
              <strong>{t('Unified Grievance Centre')}</strong>
              <small>{t('Track and manage grievances regarding public services.')}</small>
            </div>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>
        </div>
      </section>

      {/* SECTION C: My Applications Hub */}
      <section className="panel section-gap" id="my-applications" aria-labelledby="my-apps-heading">
        <div className="panel-head">
          <div>
            <h2 id="my-apps-heading">
              {t('My Applications')} ({n(filteredApps.length)})
            </h2>
            <p className="subtext">
              {t('Track your applications, monitor department review stages, and access verified receipts.')}
            </p>
          </div>
          <button className="btn small" disabled={c.busy} onClick={() => c.refresh()}>
            <RefreshCw size={14} style={{ marginRight: '4px' }} />
            {t('Refresh')}
          </button>
        </div>

        {/* Toolbar: Search, Status Filter, Sort */}
        <div className="my-apps-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              id="app-search-input"
              aria-label={t('Search applications')}
              placeholder={t('Search by service name or reference number...')}
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
            />
            {appSearch && (
              <button
                className="clear-btn"
                type="button"
                onClick={() => setAppSearch('')}
                aria-label={t('Clear search')}
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-and-sort">
            <select
              aria-label={t('Filter by status')}
              className="status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'in_progress' | 'clarification' | 'approved' | 'rejected')}
            >
              <option value="all">{t('All ({count})', { count: apps.length })}</option>
              <option value="in_progress">{t('In Progress ({count})', { count: inProgressApps.length })}</option>
              <option value="clarification">{t('Action Required ({count})', { count: clarificationApps.length })}</option>
              <option value="approved">{t('Approved ({count})', { count: apps.filter((a) => a.status === 'approved').length })}</option>
              <option value="rejected">{t('Rejected ({count})', { count: apps.filter((a) => a.status === 'rejected').length })}</option>
            </select>

            <select
              aria-label={t('Sort by')}
              className="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as 'recent' | 'oldest' | 'name')}
            >
              <option value="recent">{t('Recently updated')}</option>
              <option value="oldest">{t('Oldest first')}</option>
              <option value="name">{t('Service name A-Z')}</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs (Desktop Pill Row) */}
        <div className="status-tab-pills">
          {[
            { id: 'all', label: 'All ({count})', count: apps.length },
            { id: 'in_progress', label: 'In Progress ({count})', count: inProgressApps.length },
            { id: 'clarification', label: 'Action Required ({count})', count: clarificationApps.length },
            { id: 'approved', label: 'Approved ({count})', count: apps.filter((a) => a.status === 'approved').length },
            { id: 'rejected', label: 'Rejected ({count})', count: apps.filter((a) => a.status === 'rejected').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={'status-pill-btn' + (statusFilter === tab.id ? ' active' : '')}
              onClick={() => setStatusFilter(tab.id as 'all' | 'in_progress' | 'clarification' | 'approved' | 'rejected')}
            >
              {t(tab.label, { count: tab.count })}
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="panel-body my-apps-body">
          {filteredApps.length > 0 ? (
            <div className="app-cards-list">
              {filteredApps.map((a) => {
                const stage = getStageInfo(a);
                const svcName = getServiceName(a.service);
                return (
                  <article key={a.id} className="app-card">
                    <div className="app-card-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h3 className="app-service-name">{t(svcName)}</h3>
                          <Badge status={a.status} />
                        </div>
                        <p className="tracking-id" style={{ marginTop: '0.25rem' }}>
                          {a.id}
                        </p>
                      </div>

                      <div className="app-card-dates">
                        <span>
                          {t('Created')}: {date(a.created_at)}
                        </span>
                        {a.submitted_at && (
                          <span>
                            {t('Submitted')}: {date(a.submitted_at)}
                          </span>
                        )}
                        <span>
                          {t('Last updated')}: {date(a.decided_at || a.submitted_at || a.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Stage Indicator */}
                    <div className="app-stage-box">
                      <div className="app-stage-label-row">
                        <strong>{t(stage.stageLabel)}</strong>
                        <span>{stage.stagePercent}%</span>
                      </div>
                      <div className="stage-progress-bar" role="progressbar" aria-valuenow={stage.stagePercent} aria-valuemin={0} aria-valuemax={100}>
                        <div className={'stage-progress-fill ' + a.status} style={{ width: `${stage.stagePercent}%` }} />
                      </div>
                    </div>

                    {/* Next Action Callout */}
                    <div className="app-next-action-box">
                      <span className="next-action-tag">{t('Next Action')}:</span>
                      <span className="next-action-text">{t(stage.nextAction)}</span>
                    </div>

                    {/* Officer Clarification note if present */}
                    {a.status === 'clarification' && a.decision_note && (
                      <div className="note warn section-gap" style={{ margin: '8px 0 0 0' }}>
                        <strong>{t('Officer note')}:</strong> {a.decision_note}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="app-card-actions">
                      <button className="btn small" disabled={c.busy} onClick={() => c.openApp(a)}>
                        <Clock size={14} style={{ marginRight: '4px' }} />
                        {t('Track timeline')}
                      </button>

                      {a.status === 'clarification' && (
                        <button className="btn primary small" disabled={c.busy} onClick={() => c.openApp(a)}>
                          <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                          {t('Respond now')}
                        </button>
                      )}

                      {a.status === 'approved' && (
                        <button
                          className="btn primary small"
                          disabled={c.busy}
                          onClick={() => {
                            void c.openApp(a, true);
                          }}
                        >
                          <Printer size={14} style={{ marginRight: '4px' }} />
                          {t('View Certificate')}
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn small outline"
                        disabled={c.busy}
                        onClick={() => c.move('journeys')}
                      >
                        <Route size={14} style={{ marginRight: '4px' }} />
                        {t('View in Journey')}
                      </button>

                      <button
                        type="button"
                        className="btn small outline"
                        disabled={c.busy}
                        onClick={() => c.move('rts')}
                        title={t('View RTS Status')}
                      >
                        <Clock size={14} style={{ marginRight: '4px' }} />
                        {t('View RTS Status')}
                      </button>

                      <button
                        type="button"
                        className="btn small outline"
                        disabled={c.busy}
                        onClick={() => c.move('grievances')}
                        title={t('Lodge Grievance')}
                      >
                        <LifeBuoy size={14} style={{ marginRight: '4px' }} />
                        {t('Lodge Grievance')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : apps.length === 0 ? (
            <div className="empty dashboard-empty-state">
              <FileText size={36} className="text-muted" />
              <h3>{t('No applications yet')}</h3>
              <p>{t('You have not started any applications. Explore available services or discover schemes to get started.')}</p>
              <div className="empty-actions">
                <button
                  className="btn primary"
                  onClick={() => {
                    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {t('Explore services')}
                </button>
                <button className="btn" onClick={() => c.move('schemes')}>
                  {t('Find schemes')}
                </button>
                <button type="button" className="btn" onClick={() => c.move('journeys')}>
                  {t('Service Journeys')}
                </button>
              </div>
            </div>
          ) : (
            <div className="empty dashboard-empty-state">
              <Search size={36} className="text-muted" />
              <h3>{t('No matching applications')}</h3>
              <p>{t('No applications match your search or filter criteria.')}</p>
              <button
                className="btn section-gap"
                onClick={() => {
                  setAppSearch('');
                  setStatusFilter('all');
                }}
              >
                {t('Clear filters')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION E: Upcoming Deadlines & Important Dates */}
      <section className="panel section-gap" aria-labelledby="deadlines-heading">
        <div className="panel-head">
          <div>
            <h2 id="deadlines-heading">{t('Upcoming Deadlines & Important Dates')}</h2>
            <p className="subtext">
              {t('Track official deadlines, consent validity windows, and standard department processing timelines.')}
            </p>
          </div>
        </div>

        <div className="panel-body">
          {deadlineItems.length > 0 ? (
            <div className="deadlines-list">
              {deadlineItems.map((item) => (
                <div key={item.id} className="deadline-item">
                  <div className="deadline-item-left">
                    <Calendar size={18} className="deadline-calendar-icon" />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong>{t(item.label)}</strong>
                        <span className={'deadline-type-tag ' + item.type}>
                          {t(item.typeLabel)}
                        </span>
                      </div>
                      <p className="subtext" style={{ marginTop: '0.2rem' }}>
                        {t(item.service)} · <code className="tracking-id">{item.appId}</code>
                      </p>
                      <p className="deadline-description">{item.description}</p>
                    </div>
                  </div>
                  <div className="deadline-date-badge">
                    <strong>{item.dateString.includes('T') ? date(item.dateString) : item.dateString}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-deadlines-box">
              <Clock size={24} style={{ color: 'var(--brand-secondary)' }} />
              <div>
                <strong>{t('No upcoming deadlines scheduled.')}</strong>
                <p className="subtext">
                  {t('Standard processing timelines and consent expiry dates will be displayed here once you submit an application.')}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION F: Recent Activity */}
      <section className="panel section-gap" aria-labelledby="recent-activity-heading">
        <div className="panel-head">
          <div>
            <h2 id="recent-activity-heading">{t('Recent Activity')}</h2>
            <p className="subtext">
              {t('Chronological audit trail of your application lifecycle, department checks, and official updates.')}
            </p>
          </div>
          <button className="text-link" onClick={() => c.move('audit')}>
            {t('View full activity log')} <ArrowRight size={15} />
          </button>
        </div>

        <div className="panel-body">
          {recentActivities.length > 0 ? (
            <div className="activity-feed">
              {recentActivities.map((r: AuditRecord) => {
                let detailText = r.details;
                try {
                  const parsed = JSON.parse(r.details);
                  if (parsed.officer && parsed.note) detailText = `${parsed.officer} — ${parsed.note}`;
                } catch {}

                return (
                  <div key={r.id} className="activity-item">
                    <div className="activity-icon-col">
                      <div className={'activity-dot ' + r.outcome} />
                    </div>
                    <div className="activity-body">
                      <div className="activity-title-row">
                        <strong>{t(r.action)}</strong>
                        <Badge status={r.outcome} />
                        <span className="activity-time">{date(r.created_at, true)}</span>
                      </div>
                      {r.application_id && (
                        <p className="activity-app-ref">
                          <code className="tracking-id">{r.application_id}</code>
                          {apps.some((x) => x.id === r.application_id) && (
                            <button
                              type="button"
                              className="text-link small-link"
                              onClick={() => {
                                const found = apps.find((x) => x.id === r.application_id);
                                if (found) void c.openApp(found);
                              }}
                            >
                              {t('Open')}
                            </button>
                          )}
                        </p>
                      )}
                      <p className="activity-detail-text">{detailText}</p>
                      <span className="simulation-tag">{t('Local demonstration audit record')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty">{t('No recent activity recorded.')}</p>
          )}
        </div>
      </section>

      {/* SECTION H: Recommended Services */}
      <section className="section-gap" aria-labelledby="recommended-heading">
        <div className="section-heading">
          <div>
            <h2 id="recommended-heading">{t('Recommended Services')}</h2>
            <p className="subtext">
              {t('Popular connected public services ready for instant verification and application.')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn small"
              onClick={() => c.move('recommendations')}
            >
              <Sparkles size={14} style={{ marginRight: '4px' }} />
              {t('Smart Service Recommendations')}
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('View all 7 services')} <ArrowRight size={15} />
            </button>
          </div>
        </div>

        <div className="recommended-grid">
          {recommendedServices.map((svcId) => {
            const s = services[svcId];
            if (!s) return null;
            const Icon = iconMap[s.icon] || FileCheck2;
            return (
              <article key={s.id} className="panel recommended-card">
                <div className="service-card-top">
                  <Icon size={22} />
                  <span className="service-category">{t(s.category)}</span>
                </div>
                <h3>{t(s.name)}</h3>
                <p>{t(s.description)}</p>
                <div className="recommended-card-bottom">
                  <span className="subtext">~{s.estimatedTime}</span>
                  <button className="btn primary small" onClick={() => c.reset(s.id)}>
                    {t('Apply now')} <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* COMPLETE SERVICE CATALOGUE (Marketplace from Phase 2 / Phase 3 Day 1) */}
      <section className="service-section section-gap" id="services" aria-labelledby="all-services-heading">
        <div className="section-heading">
          <div>
            <h2 id="all-services-heading">{t(needleSvc ? 'Search results' : 'Available services')}</h2>
            <span className="subtext">{t('{count} services available', { count: matchedServices.length })}</span>
          </div>

          <form
            className="service-search-inline"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search size={18} />
            <input
              aria-label={t('Search services')}
              placeholder={t('Search services, certificates, schemes...')}
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
            />
          </form>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="tab-list">
            <TabsTrigger className="tab-trigger" value="all">
              {t('All services')}
            </TabsTrigger>
            {serviceCategories.map((cat) => (
              <TabsTrigger className="tab-trigger" key={cat} value={cat}>
                {t(cat)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {needleSvc && (
          <div className="search-summary section-gap">
            <p>
              {t('Results for')} <strong>“{serviceSearch}”</strong>
            </p>
            <button
              className="text-link"
              onClick={() => {
                setServiceSearch('');
                clearSearch?.();
              }}
            >
              {t('Clear search')}
            </button>
          </div>
        )}

        {matchedServices.length > 0 ? (
          <div className="service-grid" style={{ marginTop: '16px' }}>
            {matchedServices.map((s) => {
              const Icon = iconMap[s.icon] || FileCheck2;
              return (
                <article className="panel service-card" key={s.id}>
                  <div className="service-card-top">
                    <Icon size={22} />
                    <span className="service-category">{t(s.category)}</span>
                  </div>
                  <h3>{t(s.name)}</h3>
                  <p>{t(s.description)}</p>
                  <div className="service-card-bottom">
                    <span>
                      {t('{count} connected sources', { count: s.requiredSources.length })} · ~{s.estimatedTime}
                    </span>
                    <button className="text-link" onClick={() => c.reset(s.id)}>
                      {t('Start Application')} <ArrowRight size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="panel empty" style={{ marginTop: '16px' }}>
            <h3>{t('No services found')}</h3>
            <p>{t('Try scholarship, residence or certificate.')}</p>
            <button
              className="btn section-gap"
              onClick={() => {
                setServiceSearch('');
                setSelectedCategory('all');
              }}
            >
              {t('Show all services')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
