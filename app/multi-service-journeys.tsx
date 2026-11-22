'use client';
import { useState, useMemo } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  Info,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Sprout,
  Users,
} from 'lucide-react';
import { useLanguage } from './i18n';
import {
  evaluateAllJourneys,
  type JourneyId,
  type JourneyDomain,
  type EvaluatedJourneyStep,
  type EvaluatedPrerequisite,
} from '@/lib/journeys';
import type { ApplicationRecord, Service, WorkspaceContext } from '@/lib/types';

export interface MultiServiceJourneysProps {
  ctx?: WorkspaceContext;
  mode?: 'citizen' | 'public';
  initialJourneyId?: JourneyId;
  onStartService?: (serviceId: Service) => void;
  onOpenApp?: (app: ApplicationRecord, showCert?: boolean) => void;
}

const DOMAIN_ICONS: Record<JourneyDomain, React.ComponentType<{ size?: number }>> = {
  education: GraduationCap,
  social_welfare: Users,
  health_pds: HeartPulse,
  women: Award,
  agriculture: Sprout,
};

function statusBadgeClass(status: string, isBlocked: boolean): string {
  if (isBlocked) return 'badge neutral';
  if (status === 'completed') return 'badge green';
  if (status === 'in_progress') return 'badge orange';
  if (status === 'action_required') return 'badge red';
  return 'badge neutral';
}

export function MultiServiceJourneys({
  ctx: c,
  initialJourneyId,
  onStartService,
  onOpenApp,
}: MultiServiceJourneysProps) {
  const { t, n } = useLanguage();

  const applications = useMemo(() => {
    return c?.workspace?.applications || [];
  }, [c?.workspace?.applications]);

  const allJourneys = useMemo(() => {
    return evaluateAllJourneys(applications);
  }, [applications]);

  const [selectedDomain, setSelectedDomain] = useState<JourneyDomain | 'all'>('all');
  const [selectedJourneyId, setSelectedJourneyId] = useState<JourneyId | null>(
    initialJourneyId || 'journey:education-scholarship'
  );

  const filteredJourneys = useMemo(() => {
    if (selectedDomain === 'all') return allJourneys;
    return allJourneys.filter((j) => j.definition.domain === selectedDomain);
  }, [allJourneys, selectedDomain]);

  const activeJourney = useMemo(() => {
    if (!selectedJourneyId) return null;
    return allJourneys.find((j) => j.definition.id === selectedJourneyId) || allJourneys[0];
  }, [allJourneys, selectedJourneyId]);

  function handleActionClick(step: EvaluatedJourneyStep) {
    const action = step.availableAction;
    if (action.type === 'start_service' && action.serviceId) {
      if (onStartService) {
        onStartService(action.serviceId);
      } else if (c) {
        c.reset(action.serviceId);
      }
    } else if (action.type === 'view_certificate' && step.application) {
      if (onOpenApp) {
        onOpenApp(step.application, true);
      } else if (c) {
        void c.openApp(step.application, true);
      }
    } else if (action.type === 'track_timeline' && step.application) {
      if (onOpenApp) {
        onOpenApp(step.application, false);
      } else if (c) {
        void c.openApp(step.application, false);
      }
    } else if (action.type === 'respond_clarification' && step.application) {
      if (onOpenApp) {
        onOpenApp(step.application, false);
      } else if (c) {
        void c.openApp(step.application, false);
      }
    }
  }

  function handlePrereqClick(prereq: EvaluatedPrerequisite) {
    if (prereq.serviceId) {
      const matchingApp = applications.find((a) => a.service === prereq.serviceId);
      if (matchingApp && prereq.status === 'completed') {
        if (onOpenApp) onOpenApp(matchingApp, true);
        else if (c) void c.openApp(matchingApp, true);
      } else if (matchingApp && prereq.status === 'in_progress') {
        if (onOpenApp) onOpenApp(matchingApp, false);
        else if (c) void c.openApp(matchingApp, false);
      } else if (prereq.status === 'not_started') {
        if (onStartService) onStartService(prereq.serviceId);
        else if (c) c.reset(prereq.serviceId);
      }
    }
  }

  return (
    <div className="recommendations-container citizen-dashboard-root">
      {/* 1. Header Overview Card */}
      <section className="citizen-overview-card" aria-labelledby="journeys-title">
        <div className="citizen-overview-main">
          <div className="citizen-greeting-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                className="lang-pill"
                style={{ background: '#FFF8F5', color: 'var(--brand-secondary-strong)', borderColor: '#EAC8BC' }}
              >
                <Layers size={14} style={{ marginRight: '4px' }} />
                {t('Connected Public Service Journeys')}
              </span>
            </div>
            <h1 id="journeys-title">{t('Multi-Service Application Journeys')}</h1>
            <p className="citizen-overview-desc">
              {t('Understand dependencies, satisfy prerequisites, and track connected government applications together.')}
            </p>
          </div>

          <div className="citizen-profile-box">
            <div className="citizen-profile-row">
              <div className="profile-avatar">
                <ShieldCheck size={20} />
              </div>
              <div className="profile-details">
                <strong>{t('Verified Dependency Tracking')}</strong>
                <span className="profile-meta">{t('Official Maharashtra Rules')}</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.78125rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {t('Prerequisites and sequence are verified from official Maharashtra Government notifications and rules. Completing prerequisites supports application readiness but does not constitute automatic government approval.')}
            </p>
          </div>
        </div>

        <div className="demo-notice-bar">
          <div className="demo-notice-content">
            <strong>{t('Connected Service Prerequisites & Dependency Tracker')}</strong>
            <p>{t('Progress represents completed verified requirements and submitted applications within this journey. It does not reflect final administrative decision on pending files.')}</p>
          </div>
        </div>
      </section>

      {/* 2. Domain Filter Pills */}
      <div className="journey-domain-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '4px 0 16px 0' }}>
        <button
          id="domain-filter-all"
          type="button"
          className={'btn small ' + (selectedDomain === 'all' ? 'primary' : '')}
          onClick={() => setSelectedDomain('all')}
        >
          {t('All Domains')} ({n(allJourneys.length)})
        </button>
        <button
          id="domain-filter-education"
          type="button"
          className={'btn small ' + (selectedDomain === 'education' ? 'primary' : '')}
          onClick={() => setSelectedDomain('education')}
        >
          <GraduationCap size={14} style={{ marginRight: '4px' }} />
          {t('Education')}
        </button>
        <button
          id="domain-filter-social_welfare"
          type="button"
          className={'btn small ' + (selectedDomain === 'social_welfare' ? 'primary' : '')}
          onClick={() => setSelectedDomain('social_welfare')}
        >
          <Users size={14} style={{ marginRight: '4px' }} />
          {t('Social Welfare')}
        </button>
        <button
          id="domain-filter-health_pds"
          type="button"
          className={'btn small ' + (selectedDomain === 'health_pds' ? 'primary' : '')}
          onClick={() => setSelectedDomain('health_pds')}
        >
          <HeartPulse size={14} style={{ marginRight: '4px' }} />
          {t('Healthcare & PDS')}
        </button>
        <button
          id="domain-filter-women"
          type="button"
          className={'btn small ' + (selectedDomain === 'women' ? 'primary' : '')}
          onClick={() => setSelectedDomain('women')}
        >
          <Award size={14} style={{ marginRight: '4px' }} />
          {t('Women Welfare')}
        </button>
        <button
          id="domain-filter-agriculture"
          type="button"
          className={'btn small ' + (selectedDomain === 'agriculture' ? 'primary' : '')}
          onClick={() => setSelectedDomain('agriculture')}
        >
          <Sprout size={14} style={{ marginRight: '4px' }} />
          {t('Agriculture')}
        </button>
      </div>

      {/* 3. Journey Selector Cards Bar */}
      <section className="journeys-grid section-gap" aria-label={t('Select a Journey to Track')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {filteredJourneys.map((j) => {
            const isSelected = activeJourney?.definition.id === j.definition.id;
            const Icon = DOMAIN_ICONS[j.definition.domain] || Layers;
            return (
              <button
                key={j.definition.id}
                type="button"
                className={'journey-select-card ' + (isSelected ? 'selected' : '')}
                onClick={() => setSelectedJourneyId(j.definition.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px 18px',
                  background: isSelected ? '#FFF9F6' : 'var(--surface)',
                  border: isSelected ? '2px solid var(--brand-secondary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: isSelected ? 'var(--brand-secondary)' : 'var(--page-background)',
                      color: isSelected ? '#FFF' : 'var(--brand-primary)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span className={j.isFullyCompleted ? 'badge green' : j.progressPercent > 0 ? 'badge orange' : 'badge neutral'}>
                    {n(j.progressPercent)}%
                  </span>
                </div>

                <strong style={{ fontSize: '0.98rem', color: 'var(--brand-primary)', marginBottom: '4px', fontFamily: 'var(--heading-font)' }}>
                  {t(j.definition.title)}
                </strong>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.78125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {t(j.definition.summary)}
                </p>

                {/* Micro Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginTop: 'auto' }}>
                  <div
                    style={{
                      width: `${j.progressPercent}%`,
                      height: '100%',
                      background: j.isFullyCompleted ? 'var(--success)' : 'var(--brand-secondary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <small className="muted" style={{ display: 'block', marginTop: '6px', fontSize: '0.75rem' }}>
                  {t('{completed} of {total} requirements completed ({percent}%)', {
                    completed: j.completedRequirements,
                    total: j.totalRequirements,
                    percent: j.progressPercent,
                  })}
                </small>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Active Selected Journey Detail & Dependency Flow */}
      {activeJourney && (
        <section className="active-journey-container section-gap" aria-label={t(activeJourney.definition.title)}>
          {/* Journey Header Card */}
          <div className="panel" style={{ padding: '24px', marginBottom: '20px', borderLeft: '5px solid var(--brand-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div>
                <span className="service-category">{t(activeJourney.definition.domain)}</span>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--brand-primary)', margin: '4px 0 8px 0', fontFamily: 'var(--heading-font)' }}>
                  {t(activeJourney.definition.title)}
                </h2>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text)', maxWidth: '680px', lineHeight: 1.5 }}>
                  {t(activeJourney.definition.summary)}
                </p>
              </div>

              {/* Progress Box */}
              <div
                style={{
                  minWidth: '220px',
                  background: 'var(--page-background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t('Journey Progress')}
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: activeJourney.isFullyCompleted ? 'var(--success)' : 'var(--brand-secondary)' }}>
                    {n(activeJourney.progressPercent)}%
                  </strong>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${activeJourney.progressPercent}%`,
                      height: '100%',
                      background: activeJourney.isFullyCompleted ? 'var(--success)' : 'var(--brand-secondary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  {t('{completed} of {total} requirements completed ({percent}%)', {
                    completed: activeJourney.completedRequirements,
                    total: activeJourney.totalRequirements,
                    percent: activeJourney.progressPercent,
                  })}
                </span>
              </div>
            </div>

            {/* Target Outcome & Statutory Citation Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '12px',
                background: 'var(--surface-muted)',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '0.78125rem', color: 'var(--brand-primary)', marginBottom: '2px' }}>
                  {t('Target Outcome')}:
                </strong>
                <span style={{ fontSize: '0.84rem', color: 'var(--text)' }}>
                  {t(activeJourney.definition.targetOutcome)}
                </span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.78125rem', color: 'var(--brand-primary)', marginBottom: '2px' }}>
                  {t('Legal Authority & Citation')}:
                </strong>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {t(activeJourney.definition.statutoryCitation)}
                </span>
              </div>
            </div>

            {/* Summary Statistics Pills Bar */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <span className="lang-pill" style={{ background: '#FFF' }}>
                <strong>{n(activeJourney.steps.length)}</strong> {t('Services Linked')}
              </span>
              <span className="lang-pill" style={{ background: '#FFF', color: 'var(--success)' }}>
                <strong>{n(activeJourney.completedRequirements)}</strong> {t('Completed Prerequisites')}
              </span>
              <span className="lang-pill" style={{ background: '#FFF', color: 'var(--warning)' }}>
                <strong>{n(activeJourney.inProgressRequirements)}</strong> {t('Verification in progress')}
              </span>
              {activeJourney.actionRequiredRequirements > 0 && (
                <span className="lang-pill" style={{ background: '#FFF', color: 'var(--error)' }}>
                  <strong>{n(activeJourney.actionRequiredRequirements)}</strong> {t('Action Required')}
                </span>
              )}
              {activeJourney.hasBlockingPrerequisites && (
                <span className="lang-pill" style={{ background: '#FFF9F6', color: 'var(--brand-secondary-strong)', borderColor: '#EAC8BC' }}>
                  <Lock size={12} style={{ marginRight: '4px' }} />
                  {t('Blocked by Prerequisite')}
                </span>
              )}
            </div>
          </div>

          {/* Stepper Flow: Linked Services in Sequence */}
          <div className="journey-flow-list" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--brand-primary)', fontFamily: 'var(--heading-font)', margin: '6px 0 2px 0' }}>
              {t('Journey Sequence')}
            </h3>

            {activeJourney.steps.map((step, idx) => {
              const isBlocked = step.isBlocked;
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              const isActionRequired = step.status === 'action_required';

              return (
                <article
                  key={step.id}
                  className={'panel journey-step-card ' + (isCompleted ? 'step-completed' : isBlocked ? 'step-blocked' : '')}
                  style={{
                    padding: '20px 24px',
                    borderLeft: isCompleted
                      ? '5px solid var(--success)'
                      : isBlocked
                        ? '5px solid var(--border)'
                        : isInProgress
                          ? '5px solid var(--warning)'
                          : isActionRequired
                            ? '5px solid var(--error)'
                            : '5px solid var(--brand-secondary)',
                    background: isBlocked ? 'var(--page-background)' : 'var(--surface)',
                  }}
                >
                  {/* Step Top Meta Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isCompleted ? 'var(--success)' : isBlocked ? 'var(--border)' : 'var(--brand-secondary)',
                          color: '#FFF',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        {isCompleted ? <Check size={16} /> : n(idx + 1)}
                      </span>
                      <span className="service-category">{t(step.categoryLabel)}</span>
                      {step.isMandatory ? (
                        <span className="badge neutral" style={{ fontSize: '0.72rem' }}>
                          {t('Mandatory Requirement')}
                        </span>
                      ) : (
                        <span className="badge neutral" style={{ fontSize: '0.72rem' }}>
                          {t('Optional / Conditional')}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isBlocked && (
                        <span className="badge neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} />
                          {t('Blocked by Prerequisite')}
                        </span>
                      )}
                      <span className={statusBadgeClass(step.status, isBlocked)}>
                        {t(step.statusLabel)}
                      </span>
                    </div>
                  </div>

                  {/* Step Title & Department */}
                  <h4 style={{ fontSize: '1.18rem', color: 'var(--brand-primary)', margin: '4px 0 4px 0', fontFamily: 'var(--heading-font)' }}>
                    {t(step.title)}
                  </h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <strong>{t('Issuing Department')}:</strong> {t(step.department)}
                  </p>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5 }}>
                    {t(step.description)}
                  </p>

                  {/* Blocking Alert Notice if Blocked */}
                  {isBlocked && (
                    <div
                      className="note warn"
                      style={{
                        margin: '10px 0 16px 0',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#FFF9F6',
                        borderColor: '#EAC8BC',
                      }}
                    >
                      <Lock size={16} color="var(--brand-secondary)" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '0.84rem', color: 'var(--brand-primary)' }}>
                        <div>
                          <strong>{t('Blocked by: {prereq}', { prereq: step.blockingStepTitles.join(', ') })}.</strong>{' '}
                          {t('Complete {service} first to unlock this step.', { service: step.blockingStepTitles[0] })}
                        </div>
                        {step.blockingReasons?.map((reason, rIdx) => (
                          <div key={rIdx} style={{ fontSize: '0.78rem', color: 'var(--brand-secondary-strong)', marginTop: '3px' }}>
                            {t(reason)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prerequisite Detail Drawer Box */}
                  {step.prerequisites.length > 0 && (
                    <div
                      style={{
                        background: 'var(--page-background)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '14px 16px',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-secondary-strong)' }}>
                          <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
                          {t('Prerequisite Requirements')}:
                        </strong>
                        <small className="muted" style={{ fontSize: '0.72rem' }}>
                          {t('Notice: Recommended prerequisites do not block service application.')}
                        </small>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {step.evaluatedPrerequisites.map((prereq) => {
                          const isPrereqSatisfied = prereq.status === 'completed';
                          let depTypeBadge = t('Mandatory Requirement');
                          if (prereq.dependencyType === 'conditional') {
                            if (prereq.conditionApplicability === 'applies') {
                              depTypeBadge = t('Conditional: Applies to your category');
                            } else if (prereq.conditionApplicability === 'does_not_apply') {
                              depTypeBadge = t('Conditional: Not Required / Exempt');
                            } else {
                              depTypeBadge = t('Conditional Requirement');
                            }
                          } else if (prereq.dependencyType === 'recommended') {
                            depTypeBadge = t('Recommended Sequence');
                          } else if (prereq.dependencyType === 'unverified') {
                            depTypeBadge = t('Unverified Dependency');
                          }

                          return (
                            <div
                              key={prereq.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '8px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                padding: '8px 12px',
                              }}
                            >
                              <div style={{ maxWidth: '650px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  {isPrereqSatisfied ? (
                                    <CheckCircle2 size={15} color="var(--success)" />
                                  ) : (
                                    <Clock size={15} color="var(--warning)" />
                                  )}
                                  <strong style={{ fontSize: '0.84rem', color: 'var(--brand-primary)' }}>
                                    {t(prereq.title)}
                                  </strong>
                                  <span
                                    className="badge neutral"
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '1px 6px',
                                      background:
                                        prereq.dependencyType === 'mandatory'
                                          ? 'var(--surface-muted)'
                                          : prereq.dependencyType === 'conditional'
                                            ? prereq.conditionApplicability === 'applies'
                                              ? '#FFF4EE'
                                              : '#F4FFF4'
                                            : '#F4F7FF',
                                      borderColor:
                                        prereq.dependencyType === 'mandatory'
                                          ? 'var(--border)'
                                          : prereq.dependencyType === 'conditional'
                                            ? prereq.conditionApplicability === 'applies'
                                              ? 'var(--brand-secondary)'
                                              : 'var(--success)'
                                            : '#C8D8FF',
                                      color:
                                        prereq.dependencyType === 'mandatory'
                                          ? 'var(--text-muted)'
                                          : prereq.dependencyType === 'conditional'
                                            ? prereq.conditionApplicability === 'applies'
                                              ? 'var(--brand-secondary-strong)'
                                              : 'var(--success)'
                                            : 'var(--brand-primary)',
                                    }}
                                  >
                                    {depTypeBadge}
                                  </span>
                                </div>
                                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                                  {t('Statutory Basis')}: {t(prereq.statutoryBasis)} · {t(prereq.dataReuseBenefit)}
                                </small>
                                {prereq.conditionApplicabilityReason && (
                                  <small style={{ display: 'block', color: 'var(--brand-secondary-strong)', fontSize: '0.75rem', marginTop: '2px' }}>
                                    <strong>{prereq.conditionApplicability === 'applies' ? t('Condition Established:') : prereq.conditionApplicability === 'does_not_apply' ? t('Exemption:') : t('Condition:')}</strong> {t(prereq.conditionApplicabilityReason)}
                                  </small>
                                )}
                                {prereq.evidence && (
                                  <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '3px' }}>
                                    <strong>{t('Official Source:')}</strong> {t(prereq.evidence.sourceTitle)}
                                    {prereq.evidence.relevantClause && ` (${t(prereq.evidence.relevantClause)})`}
                                    {' · '}
                                    <a href={prereq.evidence.officialUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--brand-primary)' }}>
                                      {t('View Official Source')}
                                    </a>
                                  </small>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={isPrereqSatisfied ? 'badge green' : 'badge neutral'} style={{ fontSize: '0.7rem' }}>
                                  {isPrereqSatisfied ? t('Prerequisite Satisfied') : t('Prerequisite Incomplete')}
                                </span>
                                {prereq.actionType !== 'none' && !isPrereqSatisfied && (
                                  <button
                                    type="button"
                                    className="btn small"
                                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                    onClick={() => handlePrereqClick(prereq)}
                                  >
                                    {t('Start')}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step Action Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {step.application && (
                        <span>
                          {t('Application ID')}: <strong>{step.application.id}</strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {step.availableAction.type === 'start_service' && (
                        <button
                          type="button"
                          className={'btn small ' + (isBlocked ? '' : 'primary')}
                          onClick={() => handleActionClick(step)}
                        >
                          {isBlocked ? <Lock size={14} style={{ marginRight: '6px' }} /> : <Sparkles size={14} style={{ marginRight: '6px' }} />}
                          {t(step.availableAction.label)}
                        </button>
                      )}

                      {step.availableAction.type === 'view_certificate' && (
                        <button
                          type="button"
                          className="btn primary small"
                          onClick={() => handleActionClick(step)}
                        >
                          <FileCheck2 size={14} style={{ marginRight: '6px' }} />
                          {t('View Certificate')}
                        </button>
                      )}

                      {step.availableAction.type === 'track_timeline' && (
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => handleActionClick(step)}
                        >
                          <Clock size={14} style={{ marginRight: '6px' }} />
                          {t('Track Timeline')}
                        </button>
                      )}

                      {step.availableAction.type === 'respond_clarification' && (
                        <button
                          type="button"
                          className="btn primary small"
                          onClick={() => handleActionClick(step)}
                        >
                          {t('Respond to Clarification')}
                        </button>
                      )}

                      {step.availableAction.type === 'external_link' && step.externalUrl && (
                        <a
                          href={step.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn primary small"
                        >
                          {t('Apply on Official Portal')}
                          <ExternalLink size={13} style={{ marginLeft: '6px' }} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default MultiServiceJourneys;
