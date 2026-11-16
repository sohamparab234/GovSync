'use client';
import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
  Building2,
  Download,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from './i18n';
import { Badge, download } from './workspace';
import { deptInfo, Profile, getServiceFields } from './apply';
import { getServiceName } from './portal';
import type { Department } from '@/lib/demo';
import type { ApplicationRecord, AuditRecord, ServiceDefinition, WorkspaceContext, RuleEvaluation } from '@/lib/types';

interface TimelineProps {
  app: ApplicationRecord;
  events: AuditRecord[];
  serviceDef: ServiceDefinition;
  ctx: WorkspaceContext;
  activeConsent: boolean;
  onClarify?: (note: string) => Promise<void>;
}

export function ApplicationTimeline({ app, events, serviceDef, ctx: c, activeConsent, onClarify }: TimelineProps) {
  const { t, date } = useLanguage();
  const [clarificationText, setClarificationText] = useState('');
  const [submittingClarification, setSubmittingClarification] = useState(false);

  // Group events into structured stages
  const consentEvent = events.find((e) => e.action === 'Consent granted');
  const checkEvents = events.filter((e) => e.action === 'Department request');
  const evaluationEvent = events.filter((e) => e.action === 'Validation checked').slice(-1)[0];
  const submissionEvent = events.find((e) => e.action === 'Application submitted');
  const decisionEvent = events.filter((e) => e.action === 'Department decision').slice(-1)[0];

  let decisionData: { officer?: string; note?: string } = {};
  if (decisionEvent) {
    try {
      decisionData = JSON.parse(decisionEvent.details);
    } catch {
      decisionData = { note: decisionEvent.details };
    }
  }

  const handleClarifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationText.trim() || !onClarify) return;
    setSubmittingClarification(true);
    try {
      await onClarify(clarificationText.trim());
      setClarificationText('');
    } finally {
      setSubmittingClarification(false);
    }
  };

  return (
    <div className="application-timeline-container section-gap">
      {/* Overview Header */}
      <div className="panel receipt section-gap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Building2 size={18} style={{ color: 'var(--brand, #0f766e)' }} />
              <strong>{t(serviceDef.department)}</strong>
            </div>
            <h3 style={{ margin: '0 0 0.25rem 0' }}>{t(getServiceName(app.service))}</h3>
            <p className="tracking-id" style={{ margin: 0 }}>
              {app.id} · {t('Citizen')}: {t(app.name)} ({app.citizen_id})
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge status={app.status} />
            <p className="subtext" style={{ marginTop: '0.25rem' }}>
              {t('Created')}: {date(app.created_at, true)}
            </p>
          </div>
        </div>
      </div>

      {/* Officer Clarification Banner if active */}
      {app.status === 'clarification' && (
        <div className="note warn section-gap" style={{ borderColor: '#d97706', background: '#fffbeb' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={24} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '1rem', color: '#92400e' }}>{t('Clarification requested by department')}</strong>
              <p style={{ margin: '0.25rem 0 0.75rem 0', color: '#78350f' }}>
                {app.decision_note || decisionData.note || t('Please review your application details and submit clarification.')}
              </p>
              <form onSubmit={handleClarifySubmit}>
                <label className="form-label" htmlFor="clarification-timeline-input">
                  {t('Your response to reviewing officer')}
                </label>
                <textarea
                  id="clarification-timeline-input"
                  style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem' }}
                  value={clarificationText}
                  minLength={10}
                  maxLength={1000}
                  required
                  placeholder={t('Write a clear explanation for the officer (minimum 10 characters)...')}
                  onChange={(e) => setClarificationText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn primary small"
                  disabled={submittingClarification || !activeConsent || clarificationText.trim().length < 10}
                >
                  {submittingClarification ? t('Submitting…') : t('Send clarification')}
                </button>
                {!activeConsent && (
                  <p className="subtext" style={{ color: '#b91c1c', marginTop: '0.25rem' }}>
                    {t('Consent expired or was revoked. Start a new application.')}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Timeline Steps */}
      <div className="timeline-flow" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Step 1: Consent */}
        <div className="panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #0f766e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} style={{ color: '#0f766e' }} />
              <strong>{t('1. Citizen authorization & consent')}</strong>
            </div>
            <span className="subtext">{consentEvent ? date(consentEvent.created_at, true) : date(app.created_at, true)}</span>
          </div>
          <p className="subtext" style={{ margin: 0 }}>
            {t('Scopes authorized')}:{' '}
            {(JSON.parse(app.scopes || '[]') as Department[])
              .map((d) => t(deptInfo[d]?.title || d))
              .join(' · ')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Badge status="success">{t('Consent active')}</Badge>
            <span className="subtext">
              {t('Expires')}: {date(app.expires_at, true)}
            </span>
          </div>
        </div>

        {/* Step 2: Department Verification */}
        <div
          className="panel"
          style={{
            padding: '1rem 1.25rem',
            borderLeft: `4px solid ${checkEvents.length ? '#0f766e' : '#cbd5e1'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} style={{ color: checkEvents.length ? '#0f766e' : '#94a3b8' }} />
              <strong>{t('2. Department record verification')}</strong>
            </div>
            {checkEvents.length > 0 && <span className="subtext">{date(checkEvents[checkEvents.length - 1].created_at, true)}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
            {(JSON.parse(app.scopes || '[]') as Department[]).map((d) => {
              const evt = checkEvents.find((e) => e.department === d);
              const isChecked = Boolean(evt && evt.outcome === 'success');
              return (
                <div
                  key={d}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: isChecked ? '#f0fdf4' : '#f8fafc',
                    borderRadius: '6px',
                    border: `1px solid ${isChecked ? '#bbf7d0' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.875rem' }}>{t(deptInfo[d]?.title || d)}</span>
                  {isChecked ? (
                    <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                      ✓ {evt?.duration_ms ? `${evt.duration_ms}ms` : t('Verified')}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('Pending')}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Eligibility & Rules Evaluation */}
        <div
          className="panel"
          style={{
            padding: '1rem 1.25rem',
            borderLeft: `4px solid ${
              app.status === 'ineligible' ? '#ef4444' : app.status === 'draft' ? '#cbd5e1' : '#0f766e'
            }`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {app.status === 'ineligible' ? (
                <XCircle size={20} style={{ color: '#ef4444' }} />
              ) : (
                <CheckCircle2 size={20} style={{ color: app.result ? '#0f766e' : '#94a3b8' }} />
              )}
              <strong>{t('3. Automated eligibility assessment')}</strong>
            </div>
            {evaluationEvent && <span className="subtext">{date(evaluationEvent.created_at, true)}</span>}
          </div>
          {app.result ? (
            (() => {
              const res = JSON.parse(app.result);
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Badge status={res.status === 'eligible' ? 'success' : res.status === 'needs_review' ? 'review' : 'rejected'}>
                      {t(res.status === 'eligible' ? 'Eligible' : res.status === 'needs_review' ? 'Review Required' : 'Ineligible')}
                    </Badge>
                    <span className="subtext">
                      {res.rules ? `${res.rules.filter((r: RuleEvaluation) => r.passed).length} / ${res.rules.length} ${t('rules passed')}` : ''}
                    </span>
                  </div>
                  {res.rules && (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                      {res.rules.map((r: RuleEvaluation, idx: number) => (
                        <li key={idx} style={{ color: r.passed ? '#166534' : '#991b1b', marginBottom: '0.25rem' }}>
                          {r.passed ? '✓ ' : '✕ '}
                          {t(r.label)} {r.detail ? `— ${r.detail}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()
          ) : (
            <p className="subtext" style={{ margin: 0 }}>
              {t('Awaiting verification to evaluate eligibility.')}
            </p>
          )}
        </div>

        {/* Step 4: Submission & Department Routing */}
        <div
          className="panel"
          style={{
            padding: '1rem 1.25rem',
            borderLeft: `4px solid ${app.submitted_at ? '#0f766e' : '#cbd5e1'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: app.submitted_at ? '#0f766e' : '#94a3b8' }} />
              <strong>{t('4. Application submission')}</strong>
            </div>
            {(submissionEvent || app.submitted_at) && (
              <span className="subtext">{date(submissionEvent?.created_at || app.submitted_at || '', true)}</span>
            )}
          </div>
          {app.submitted_at ? (
            <div>
              <p className="subtext" style={{ margin: '0 0 0.25rem 0' }}>
                {t('Routed to')}: <strong>{t(serviceDef.department)}</strong>
              </p>
              {app.statement && (
                <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '4px', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  “{app.statement}”
                </div>
              )}
            </div>
          ) : (
            <p className="subtext" style={{ margin: 0 }}>
              {t('Application has not been submitted yet.')}
            </p>
          )}
        </div>

        {/* Step 5: Department Review & Final Decision */}
        <div
          className="panel"
          style={{
            padding: '1rem 1.25rem',
            borderLeft: `4px solid ${
              app.status === 'approved'
                ? '#16a34a'
                : app.status === 'rejected'
                ? '#dc2626'
                : app.status === 'clarification'
                ? '#d97706'
                : app.status === 'submitted'
                ? '#2563eb'
                : '#cbd5e1'
            }`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {app.status === 'approved' ? (
                <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
              ) : app.status === 'rejected' ? (
                <XCircle size={20} style={{ color: '#dc2626' }} />
              ) : app.status === 'clarification' ? (
                <AlertTriangle size={20} style={{ color: '#d97706' }} />
              ) : (
                <Clock size={20} style={{ color: app.status === 'submitted' ? '#2563eb' : '#94a3b8' }} />
              )}
              <strong>{t('5. Department officer review')}</strong>
            </div>
            {app.decided_at && <span className="subtext">{date(app.decided_at, true)}</span>}
          </div>

          {app.status === 'submitted' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Badge status="submitted">{t('Under review')}</Badge>
              <span className="subtext">{t('Assigned to department officer queue. Decision pending.')}</span>
            </div>
          )}

          {app.status === 'approved' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Badge status="approved">{t('Approved')}</Badge>
                {decisionData.officer && (
                  <span className="subtext">
                    {t('Reviewed by')} <strong>{decisionData.officer}</strong>
                  </span>
                )}
              </div>
              {app.decision_note && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                  {t('Officer note')}: {app.decision_note}
                </p>
              )}
            </div>
          )}

          {app.status === 'rejected' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Badge status="rejected">{t('Rejected')}</Badge>
                {decisionData.officer && (
                  <span className="subtext">
                    {t('Reviewed by')} <strong>{decisionData.officer}</strong>
                  </span>
                )}
              </div>
              {app.decision_note && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#b91c1c' }}>
                  {t('Reason')}: {app.decision_note}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Step 6: Certificate Issuance if supported */}
        {serviceDef.supportsCertificate && (
          <div
            className="panel"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: `4px solid ${app.status === 'approved' ? '#0f766e' : '#cbd5e1'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} style={{ color: app.status === 'approved' ? '#0f766e' : '#94a3b8' }} />
                <strong>{t('6. Certificate generation & issuance')}</strong>
              </div>
              {app.decided_at && app.status === 'approved' && <span className="subtext">{date(app.decided_at, true)}</span>}
            </div>
            {app.status === 'approved' ? (
              <div>
                <p className="subtext" style={{ margin: '0 0 0.5rem 0' }}>
                  {t(serviceDef.certificateTitle || serviceDef.name)} {t('has been digitally generated.')}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn primary small" onClick={c.showCertificate}>
                    <Printer size={15} style={{ marginRight: '4px' }} /> {t('View Certificate')}
                  </button>
                  <button
                    className="btn small"
                    onClick={() => download('GovSync-' + app.id + '.json', { application: app, notice: 'DEMONSTRATION ONLY' })}
                  >
                    <Download size={15} style={{ marginRight: '4px' }} /> {t('Download receipt')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="subtext" style={{ margin: 0 }}>
                {t('Certificate is available only after department approval.')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="actions section-gap">
        <button
          className="btn"
          onClick={() => download('GovSync-' + app.id + '-audit.json', { application: app, timeline: events, notice: 'DEMONSTRATION ONLY' })}
        >
          <Download size={15} style={{ marginRight: '4px' }} /> {t('Export audit trail')}
        </button>
        <button className="btn" onClick={() => c.move('applications')}>
          {t('View all applications')} <ChevronRight size={15} />
        </button>
      </div>

      {/* Certificate Modal / View if active */}
      {c.certificate && (
        <section className="certificate section-gap" aria-label={t('View Certificate')}>
          <div className="demo-watermark">{t('DEMONSTRATION ONLY — not a government certificate')}</div>
          <h2>{t(c.certificate.notice ? c.certificate.notice : serviceDef.certificateTitle || serviceDef.name)}</h2>
          <p className="tracking-id">{c.certificate.reference}</p>
          <Profile profile={c.certificate.profile} fields={getServiceFields(app.service)} />
          <p className="section-gap">
            {t('Issued')}: {date(c.certificate.issuedAt || '')}
          </p>
          <div className="actions no-print">
            <button className="btn" onClick={() => c.setCertificate(null)}>
              {t('Close certificate')}
            </button>
            <button className="btn primary" onClick={() => window.print()}>
              {t('Print certificate')}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
