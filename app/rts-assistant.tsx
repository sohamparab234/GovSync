'use client';
import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  HeartHandshake,
  Info,
  MapPin,
  Plane,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
  ShoppingBasket,
  X,
} from 'lucide-react';
import { useLanguage } from './i18n';
import {
  getEscalationStages,
  getRtsSummary,
  type CalculatedRtsDeadline,
  type EscalationStage,
  type RtsDeadlineStatus,
} from '@/lib/rts';
import type { ApplicationRecord, WorkspaceContext } from '@/lib/types';

export interface RtsAssistantProps {
  ctx?: WorkspaceContext;
  mode?: 'citizen' | 'public';
  onOpenApp?: (app: ApplicationRecord, showCert?: boolean) => void;
  initialAppId?: string;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  scholarship: GraduationCap,
  residence: MapPin,
  'income-certificate': FileText,
  'caste-certificate': ScrollText,
  'ration-card': ShoppingBasket,
  passport: Plane,
  pension: HeartHandshake,
};

function statusBadgeClass(status: RtsDeadlineStatus): string {
  switch (status) {
    case 'on_track':
      return 'badge green';
    case 'approaching':
      return 'badge orange';
    case 'deadline_reached':
      return 'badge orange';
    case 'overdue':
      return 'badge red';
    case 'timeline_not_verified':
    case 'insufficient_information':
    default:
      return 'badge neutral';
  }
}

export function RtsAssistant({
  ctx: c,
  onOpenApp,
  initialAppId,
}: RtsAssistantProps) {
  const { t, n, date } = useLanguage();

  const applications = useMemo(() => {
    return c?.workspace?.applications || [];
  }, [c?.workspace?.applications]);

  const { metrics, calculatedDeadlines, actionRequiredDeadlines } = useMemo(() => {
    return getRtsSummary(applications);
  }, [applications]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<RtsDeadlineStatus | 'all'>('all');
  const [selectedEscalationItem, setSelectedEscalationItem] = useState<CalculatedRtsDeadline | null>(() => {
    if (initialAppId) {
      return calculatedDeadlines.find((d) => d.applicationId === initialAppId) || null;
    }
    return null;
  });

  const filteredDeadlines = useMemo(() => {
    let list = calculatedDeadlines;

    if (selectedFilter !== 'all') {
      list = list.filter((item) => item.status === selectedFilter);
    }

    const needle = searchQuery.trim().toLowerCase();
    if (needle) {
      list = list.filter((item) => {
        const text = [
          item.applicationId,
          item.serviceName,
          t(item.serviceName),
          item.responsibleDepartment,
          t(item.responsibleDepartment),
          item.designatedOfficer,
          t(item.designatedOfficer),
        ]
          .join(' ')
          .toLowerCase();
        return text.includes(needle);
      });
    }

    return list;
  }, [calculatedDeadlines, selectedFilter, searchQuery, t]);

  const escalationStages: EscalationStage[] = useMemo(() => {
    if (!selectedEscalationItem) return [];
    const matchingApp = applications.find((a) => a.id === selectedEscalationItem.applicationId);
    if (!matchingApp) return [];
    return getEscalationStages(matchingApp, selectedEscalationItem);
  }, [selectedEscalationItem, applications]);

  function handleApplicationClick(item: CalculatedRtsDeadline) {
    const matchingApp = applications.find((a) => a.id === item.applicationId);
    if (matchingApp && onOpenApp) {
      onOpenApp(matchingApp, false);
    } else if (matchingApp && c) {
      void c.openApp(matchingApp, false);
    }
  }

  return (
    <div className="recommendations-container citizen-dashboard-root">
      {/* 1. Header Overview Card */}
      <section className="citizen-overview-card" aria-labelledby="rts-title">
        <div className="citizen-overview-main">
          <div className="citizen-greeting-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                className="lang-pill"
                style={{ background: '#FFF8F5', color: 'var(--brand-secondary-strong)', borderColor: '#EAC8BC' }}
              >
                <Scale size={14} style={{ marginRight: '4px' }} />
                {t('Official Maharashtra RTS Guarantees')}
              </span>
              <span className="badge neutral" style={{ fontSize: '0.72rem' }}>
                {t('Act No. XXXI of 2015')}
              </span>
            </div>
            <h1 id="rts-title">{t('RTS Deadline & Escalation Assistant')}</h1>
            <p className="citizen-overview-desc">
              {t(
                'Track Statutory Delivery Deadlines & Official Appeal Stages under Maharashtra Right to Public Services Act, 2015.'
              )}
            </p>
          </div>

          <div className="citizen-profile-box">
            <div className="citizen-profile-row">
              <div className="profile-avatar">
                <ShieldCheck size={20} />
              </div>
              <div className="profile-details">
                <strong>{t('Statutory RTS Act 2015 Tracking')}</strong>
                <span className="profile-meta">{t('Aaple Sarkar Public Delivery Schedule')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informational Assistant Notice Banner */}
        <div
          className="note neutral rts-disclaimer-callout"
          style={{
            margin: '16px 0 0 0',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            borderLeft: '3px solid var(--brand-secondary)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={16} color="var(--brand-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>{t('Informational Assistant Notice')}:</strong>{' '}
              {t(
                'GovSync is an independent informational and deadline tracking assistant. It does not automatically file appeals or submit legal complaints on your behalf. Official appeals must be lodged directly by the citizen on the Aaple Sarkar portal under the Maharashtra Right to Public Services Act, 2015.'
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Action Required / Overdue Alert Banner if active */}
      {actionRequiredDeadlines.length > 0 && (
        <section
          className="note warn"
          style={{
            margin: '18px 0',
            padding: '14px 18px',
            background: '#FFF9F6',
            borderColor: '#EAC8BC',
            borderRadius: 'var(--radius)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
          aria-label={t('RTS Deadline Alerts')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="var(--brand-secondary)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.94rem', color: 'var(--brand-primary)' }}>
                {t('RTS Deadline Alerts')}
              </strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--brand-secondary-strong)' }}>
                {t(
                  'You have {count} application(s) requiring attention under Maharashtra RTS timelines.',
                  { count: actionRequiredDeadlines.length }
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn small"
            style={{ fontSize: '0.78125rem' }}
            onClick={() => setSelectedFilter('overdue')}
          >
            {t('View Overdue Applications')}
          </button>
        </section>
      )}

      {/* 3. Aggregated Summary Metrics Cards */}
      <section className="dashboard-summary-cards section-gap" aria-label={t('Statutory Delivery Deadlines')}>
        <button
          type="button"
          className={'dashboard-stat-card ' + (selectedFilter === 'all' ? 'active-filter' : '')}
          onClick={() => setSelectedFilter('all')}
          style={{ textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="stat-card-title">{t('RTS Tracked Services')}</span>
          <span className="number">{n(metrics.totalApplications)}</span>
          <small className="muted" style={{ fontSize: '0.72rem' }}>
            {n(metrics.rtsTrackedCount)} {t('Statutory RTS Act 2015 Tracking')}
          </small>
        </button>

        <button
          type="button"
          className={'dashboard-stat-card ' + (selectedFilter === 'on_track' ? 'active-filter' : '')}
          onClick={() => setSelectedFilter('on_track')}
          style={{ textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="stat-card-title">{t('On Track')}</span>
          <span className="number" style={{ color: 'var(--success)' }}>
            {n(metrics.onTrackCount)}
          </span>
          <small className="muted" style={{ fontSize: '0.72rem' }}>
            {t('Within Time Limit')}
          </small>
        </button>

        <button
          type="button"
          className={'dashboard-stat-card ' + (selectedFilter === 'approaching' ? 'active-filter' : '')}
          onClick={() => setSelectedFilter('approaching')}
          style={{ textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="stat-card-title">{t('Approaching Deadline')}</span>
          <span className="number" style={{ color: 'var(--warning)' }}>
            {n(metrics.approachingCount + metrics.deadlineReachedCount)}
          </span>
          <small className="muted" style={{ fontSize: '0.72rem' }}>
            {t('Approaching Expiry')}
          </small>
        </button>

        <button
          type="button"
          className={'dashboard-stat-card ' + (selectedFilter === 'overdue' ? 'active-filter' : '')}
          onClick={() => setSelectedFilter('overdue')}
          style={{ textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="stat-card-title">{t('Overdue')}</span>
          <span className="number" style={{ color: 'var(--destructive)' }}>
            {n(metrics.overdueCount)}
          </span>
          <small className="muted" style={{ fontSize: '0.72rem' }}>
            {n(metrics.eligibleForAppealCount)} {t('Eligible for Appeal')}
          </small>
        </button>

        <button
          type="button"
          className={'dashboard-stat-card ' + (selectedFilter === 'timeline_not_verified' ? 'active-filter' : '')}
          onClick={() => setSelectedFilter('timeline_not_verified')}
          style={{ textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="stat-card-title">{t('Timeline Not Verified')}</span>
          <span className="number" style={{ color: 'var(--text-muted)' }}>
            {n(metrics.timelineNotVerifiedCount)}
          </span>
          <small className="muted" style={{ fontSize: '0.72rem' }}>
            {t('Academic / Central Services')}
          </small>
        </button>
      </section>

      {/* 4. Filter & Search Controls */}
      <section className="section-gap" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Status Tabs */}
          <div className="filter-pill-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              id="rts-filter-all"
              type="button"
              className={'btn small ' + (selectedFilter === 'all' ? 'primary' : '')}
              onClick={() => setSelectedFilter('all')}
            >
              {t('All Applications')} ({n(metrics.totalApplications)})
            </button>
            <button
              id="rts-filter-on_track"
              type="button"
              className={'btn small ' + (selectedFilter === 'on_track' ? 'primary' : '')}
              onClick={() => setSelectedFilter('on_track')}
            >
              {t('On Track')} ({n(metrics.onTrackCount)})
            </button>
            <button
              id="rts-filter-approaching"
              type="button"
              className={'btn small ' + (selectedFilter === 'approaching' ? 'primary' : '')}
              onClick={() => setSelectedFilter('approaching')}
            >
              {t('Approaching Deadline')} ({n(metrics.approachingCount + metrics.deadlineReachedCount)})
            </button>
            <button
              id="rts-filter-overdue"
              type="button"
              className={'btn small ' + (selectedFilter === 'overdue' ? 'primary' : '')}
              onClick={() => setSelectedFilter('overdue')}
            >
              {t('Overdue')} ({n(metrics.overdueCount)})
            </button>
            <button
              id="rts-filter-unverified"
              type="button"
              className={'btn small ' + (selectedFilter === 'timeline_not_verified' ? 'primary' : '')}
              onClick={() => setSelectedFilter('timeline_not_verified')}
            >
              {t('Timeline Not Verified')} ({n(metrics.timelineNotVerifiedCount)})
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', paddingLeft: '32px', fontSize: '0.8125rem', height: '34px' }}
              placeholder={t('Search by service name, application ID, or citizen...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 5. Application Deadline Overview Cards Grid */}
      <section className="section-gap" aria-label={t('Track Application Deadlines')}>
        {filteredDeadlines.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--surface)' }}>
            <Clock size={32} color="var(--brand-secondary)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-primary)', marginBottom: '6px' }}>
              {t('No applications found matching the selected RTS filter.')}
            </h3>
            <p className="muted" style={{ fontSize: '0.84rem', margin: 0 }}>
              {t('All your applications are currently being processed within official timelines.')}
            </p>
            {selectedFilter !== 'all' && (
              <button
                type="button"
                className="btn small"
                style={{ marginTop: '14px' }}
                onClick={() => {
                  setSelectedFilter('all');
                  setSearchQuery('');
                }}
              >
                {t('Reset text size')}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredDeadlines.map((item) => {
              const Icon = iconMap[item.serviceId] || FileText;
              const isOverdue = item.status === 'overdue';
              const isApproaching = item.status === 'approaching' || item.status === 'deadline_reached';
              const isSelected = selectedEscalationItem?.applicationId === item.applicationId;

              return (
                <article
                  key={item.applicationId}
                  className="rts-deadline-card panel"
                  style={{
                    padding: '18px 20px',
                    background: isOverdue ? '#FFF9F6' : isSelected ? '#FFF8F4' : 'var(--surface)',
                    border: isOverdue
                      ? '1px solid #EAC8BC'
                      : isSelected
                      ? '2px solid var(--brand-secondary)'
                      : '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Top Row: Service Category & Deadline Status */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: isOverdue ? '#FFEFEA' : 'var(--page-background)',
                          color: isOverdue ? 'var(--brand-secondary-strong)' : 'var(--brand-primary)',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--brand-primary)', fontFamily: 'var(--heading-font)' }}>
                          {t(item.serviceName)}
                        </h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                          {t('Application ID')}: <strong>{item.applicationId}</strong>
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={statusBadgeClass(item.status)}>
                        {t(item.statusLabel)}
                      </span>
                    </div>
                  </div>

                  {/* Middle Grid: Key Statutory Information */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      background: 'var(--page-background)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <small className="muted" style={{ display: 'block', fontSize: '0.72rem' }}>
                        {t('Submission Date')}
                      </small>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--brand-primary)' }}>
                        {item.submissionDate ? date(item.submissionDate, false) : t('Information unavailable')}
                      </strong>
                    </div>

                    <div>
                      <small className="muted" style={{ display: 'block', fontSize: '0.72rem' }}>
                        {t('Stipulated Time Limit')}
                      </small>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--brand-primary)' }}>
                        {item.stipulatedDays
                          ? `${item.stipulatedDays} ${t(item.dayType === 'working' ? 'working days (excluding weekends)' : 'days')}`
                          : t('Timeline Not Verified')}
                      </strong>
                    </div>

                    <div>
                      <small className="muted" style={{ display: 'block', fontSize: '0.72rem' }}>
                        {t('Expected Decision Date')}
                      </small>
                      <strong style={{ fontSize: '0.84rem', color: isOverdue ? 'var(--destructive)' : 'var(--brand-primary)' }}>
                        {item.dueDateFormatted ? date(item.dueDateFormatted, false) : t('Timeline Not Verified')}
                      </strong>
                    </div>

                    <div>
                      <small className="muted" style={{ display: 'block', fontSize: '0.72rem' }}>
                        {isOverdue ? t('Days Overdue') : t('Days Remaining')}
                      </small>
                      <strong
                        style={{
                          fontSize: '0.84rem',
                          color: isOverdue ? 'var(--destructive)' : isApproaching ? 'var(--warning)' : 'var(--success)',
                        }}
                      >
                        {isOverdue
                          ? t('{count} days overdue', { count: item.daysOverdue || 0 })
                          : item.remainingDays !== null && item.remainingDays >= 0
                          ? item.dayType === 'working'
                            ? t('{count} working days remaining', { count: item.remainingDays })
                            : t('{count} days remaining', { count: item.remainingDays })
                          : t('Timeline Not Verified')}
                      </strong>
                    </div>
                  </div>

                  {/* Calculation Basis & Authority Note */}
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.5, marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 4px 0' }}>
                      <strong>{t('Calculation Basis')}:</strong> {t(item.calculationExplanation)}
                    </p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                      <strong>{t('Responsible Authority')}:</strong> {t(item.designatedOfficer)} · {t(item.responsibleDepartment)}
                    </p>
                    {item.officialSource && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <strong>{t('Official Citation')}:</strong> {t(item.officialSource.title)}{' '}
                        {item.officialSource.officialUrl && (
                          <a
                            href={item.officialSource.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'underline', color: 'var(--brand-primary)', marginLeft: '4px' }}
                          >
                            {t('View Official Notification')}
                          </a>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Action CTA Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn small"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setSelectedEscalationItem(isSelected ? null : item)}
                      >
                        <Scale size={14} style={{ marginRight: '4px' }} />
                        {isSelected ? t('Hide Escalation Stages') : t('Open Escalation Guide')}
                      </button>

                      <button
                        type="button"
                        className="btn small"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleApplicationClick(item)}
                      >
                        {t('Track Timeline')}
                      </button>
                    </div>

                    {item.isEligibleForFirstAppeal && (
                      <a
                        href="https://aaplesarkar.mahaonline.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn primary small"
                        style={{ fontSize: '0.75rem', background: 'var(--brand-secondary)', borderColor: 'var(--brand-secondary)' }}
                      >
                        {t('File First Appeal on Aaple Sarkar')}
                        <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                      </a>
                    )}
                  </div>

                  {/* Expanded Escalation Guidance Drawer */}
                  {isSelected && (
                    <div
                      style={{
                        marginTop: '16px',
                        background: '#FFFDFC',
                        border: '1px solid #EAC8BC',
                        borderRadius: '6px',
                        padding: '16px 18px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.94rem', color: 'var(--brand-primary)' }}>
                            {t('Maharashtra RTS Statutory Escalation Hierarchy')}
                          </strong>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                            {t('Four-tier redressal framework established under Maharashtra Act No. XXXI of 2015.')}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn small"
                          style={{ padding: '2px 6px' }}
                          onClick={() => setSelectedEscalationItem(null)}
                          aria-label={t('Close')}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {escalationStages.map((stage) => {
                          const isStageActive = stage.isCurrentlyApplicable;
                          return (
                            <div
                              key={stage.stageKey}
                              style={{
                                background: isStageActive ? '#FFF9F6' : 'var(--surface)',
                                border: isStageActive ? '1px solid var(--brand-secondary)' : '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '12px 14px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                  marginBottom: '6px',
                                }}
                              >
                                <div>
                                  <span
                                    className="badge neutral"
                                    style={{
                                      fontSize: '0.7rem',
                                      marginRight: '6px',
                                      background: isStageActive ? '#FFF0EA' : undefined,
                                      color: isStageActive ? 'var(--brand-secondary-strong)' : undefined,
                                    }}
                                  >
                                    {t(
                                      stage.stageKey === 'designated_officer'
                                        ? 'Stage 1: Designated Officer (DO)'
                                        : stage.stageKey === 'first_appeal'
                                        ? 'Stage 2: First Appellate Authority (FAA)'
                                        : stage.stageKey === 'second_appeal'
                                        ? 'Stage 3: Second Appellate Authority (SAA)'
                                        : 'Stage 4: Maharashtra State RTS Commission'
                                    )}
                                  </span>
                                  <strong style={{ fontSize: '0.9rem', color: 'var(--brand-primary)' }}>
                                    {t(stage.authorityTitle)}
                                  </strong>
                                </div>
                                <span className={isStageActive ? 'badge orange' : 'badge neutral'} style={{ fontSize: '0.68rem' }}>
                                  {isStageActive ? t('Currently Applicable') : t('Subsequent Stage')}
                                </span>
                              </div>

                              <p style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.4 }}>
                                {t(stage.officialInstructions)}
                              </p>

                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                <div>
                                  <strong>{t('Time Limit to Approach')}:</strong> {t(stage.timeLimitToApproach)}
                                </div>
                                <div>
                                  <strong>{t('Statutory Disposal Window')}:</strong> {t(stage.disposalTimeLimit)}
                                </div>
                                <div>
                                  <strong>{t('Legal Authority & Section')}:</strong> {t(stage.statutoryBasis)}
                                </div>
                              </div>

                              {stage.requiredDocuments && stage.requiredDocuments.length > 0 && (
                                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  <strong>{t('Required Information / Documents')}:</strong>{' '}
                                  {stage.requiredDocuments.map((doc) => t(doc)).join(' · ')}
                                </div>
                              )}

                              {stage.officialPortalUrl && (
                                <div style={{ marginTop: '8px' }}>
                                  <a
                                    href={stage.officialPortalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.75rem', textDecoration: 'underline', color: 'var(--brand-primary)' }}
                                  >
                                    {t('Open Official Portal')} ({stage.officialPortalUrl})
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Maharashtra RTS Statutory Escalation Hierarchy (Reference & Guidance) */}
      <section className="panel section-gap rts-escalation-section" aria-labelledby="rts-escalation-heading">
        <div className="panel-head">
          <div>
            <h2 id="rts-escalation-heading" style={{ fontSize: '1.15rem', color: 'var(--brand-primary)', margin: 0 }}>
              {t('Maharashtra RTS Statutory Escalation Hierarchy')}
            </h2>
            <p className="subtext" style={{ margin: '4px 0 0 0' }}>
              {t('Four-tier redressal framework established under Maharashtra Act No. XXXI of 2015.')}
            </p>
          </div>
        </div>

        <div className="panel-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                number: 1,
                role: 'Stage 1: Designated Officer (DO)',
                title: 'Tahsildar / Sub-Divisional Officer / Competent Authority',
                disposal: '15-30 days upon complete application',
                basis: 'Section 5(1) of MRTPS Act, 2015',
                portal: 'https://aaplesarkar.mahaonline.gov.in',
              },
              {
                number: 2,
                role: 'Stage 2: First Appellate Authority (FAA)',
                title: 'Sub-Divisional Officer (SDO) / Additional Collector',
                disposal: '30 days',
                basis: 'Section 9(1) & Section 9(2) of MRTPS Act, 2015',
                portal: 'https://aaplesarkar.mahaonline.gov.in',
              },
              {
                number: 3,
                role: 'Stage 3: Second Appellate Authority (SAA)',
                title: 'District Collector / Divisional Commissioner',
                disposal: '45 days',
                basis: 'Section 9(3) & Section 9(4) of MRTPS Act, 2015',
                portal: 'https://aaplesarkar.mahaonline.gov.in',
              },
              {
                number: 4,
                role: 'Stage 4: Maharashtra State RTS Commission',
                title: 'Chief Commissioner / Divisional Commissioner, RTS Commission',
                disposal: 'Revision within 60 days of SAA order; penalty inquiry up to ₹5,000',
                basis: 'Section 18(1) & Section 10 of MRTPS Act, 2015',
                portal: 'https://rts.maharashtra.gov.in',
              },
            ].map((stg) => (
              <div
                key={stg.number}
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                  <span className="badge neutral" style={{ fontSize: '0.72rem' }}>
                    {t(stg.role)}
                  </span>
                  <a
                    href={stg.portal}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', textDecoration: 'underline' }}
                  >
                    {t('Open Official Portal')}
                  </a>
                </div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--brand-primary)' }}>
                  {t(stg.title)}
                </strong>
                <p className="subtext" style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                  <strong>{t('Legal Authority & Section')}:</strong> {stg.basis} · <strong>{t('Statutory Disposal Window')}:</strong> {stg.disposal}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default RtsAssistant;
