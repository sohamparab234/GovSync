'use client';
import { useState, useMemo, useEffect, useId } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileQuestion,
  FileText,
  Info,
  LifeBuoy,
  MessageSquare,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  Send,
} from 'lucide-react';
import { useLanguage } from './i18n';
import { api } from './workspace';
import { getServiceName } from './portal';
import {
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUSES,
  getGrievanceSummary,
  validateGrievanceInput,
  validatePiiSafety,
  type GrievanceCategory,
  type GrievanceRecord,
  type GrievanceEventRecord,
  type RtsAdvisory,
} from '@/lib/grievances';
import type { ApplicationRecord, WorkspaceContext } from '@/lib/types';

export interface GrievanceCentreProps {
  ctx?: WorkspaceContext;
  onOpenApp?: (app: ApplicationRecord) => void;
  onOpenRts?: (appId?: string) => void;
  initialAppId?: string;
  mode?: 'citizen' | 'public';
}

export default function GrievanceCentre({
  ctx: c,
  onOpenRts,
  initialAppId,
  mode = 'citizen',
}: GrievanceCentreProps) {
  const { t, n, date } = useLanguage();
  const searchInputId = useId();
  const categorySelectId = useId();
  const appSelectId = useId();
  const subjectInputId = useId();
  const descTextareaId = useId();
  const deptInputId = useId();

  const userApplications = useMemo(() => {
    return c?.workspace?.applications || [];
  }, [c?.workspace?.applications]);

  // Grievance records state
  const [grievances, setGrievances] = useState<GrievanceRecord[]>(() => {
    return c?.workspace?.grievances || [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected filter & search
  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting_review' | 'information_required' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isLodgeModalOpen, setIsLodgeModalOpen] = useState(Boolean(initialAppId));
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceRecord | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<GrievanceEventRecord[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [selectedRtsAdvisory, setSelectedRtsAdvisory] = useState<RtsAdvisory | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Grievance form state
  const [formCategory, setFormCategory] = useState<GrievanceCategory>('application_delay');
  const [formAppId, setFormAppId] = useState<string>(initialAppId || 'none');
  const [formSubject, setFormSubject] = useState(() => {
    if (initialAppId) {
      const matched = (c?.workspace?.applications || []).find((a) => a.id === initialAppId);
      if (matched) return `Inquiry regarding ${getServiceName(matched.service)} (${matched.id})`;
    }
    return '';
  });
  const [formDescription, setFormDescription] = useState('');
  const [formCustomDept, setFormCustomDept] = useState('');
  const [formAcknowledged, setFormAcknowledged] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Clarification form state
  const [clarificationText, setClarificationText] = useState('');
  const [submittingClarification, setSubmittingClarification] = useState(false);
  const [clarificationError, setClarificationError] = useState('');

  // Copy reference status
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (mode !== 'citizen') return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api<{ grievances: GrievanceRecord[] }>('grievances')
      .then((data) => {
        if (active) setGrievances(data.grievances || []);
      })
      .catch((err: unknown) => {
        if (active) setError((err as Error).message || 'Failed to load grievances.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  // Load single grievance detail
  async function openDetail(g: GrievanceRecord) {
    setSelectedGrievance(g);
    setLoadingDetail(true);
    setClarificationError('');
    setClarificationText('');
    try {
      const data = await api<{
        grievance: GrievanceRecord;
        events: GrievanceEventRecord[];
        application: ApplicationRecord | null;
        rtsAdvisory: RtsAdvisory | null;
      }>('grievances/' + g.id);
      setSelectedGrievance(data.grievance);
      setSelectedEvents(data.events || []);
      setSelectedApp(data.application);
      setSelectedRtsAdvisory(data.rtsAdvisory);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to load grievance details.');
    } finally {
      setLoadingDetail(false);
    }
  }

  // Submit new grievance
  async function handleSubmitGrievance(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formAcknowledged) {
      setFormError('Please acknowledge the security and platform disclaimer before submitting.');
      return;
    }

    const linkedApp = formAppId !== 'none' ? userApplications.find((a) => a.id === formAppId) : null;
    const serviceName = linkedApp ? linkedApp.service : null;
    const departmentName = linkedApp ? undefined : formCustomDept.trim() || 'Department not verified';

    const validation = validateGrievanceInput({
      subject: formSubject,
      category: formCategory,
      description: formDescription,
    });

    if (!validation.valid) {
      setFormError(validation.error || 'Please fill in all required fields correctly.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api<{ grievance: GrievanceRecord }>('grievances', {
        subject: formSubject.trim(),
        category: formCategory,
        description: formDescription.trim(),
        applicationId: linkedApp ? linkedApp.id : null,
        service: serviceName,
        department: departmentName,
      });

      // Add to list and close modal
      setGrievances((prev) => [res.grievance, ...prev]);
      setIsLodgeModalOpen(false);
      setFormSubject('');
      setFormDescription('');
      setFormAppId('none');
      setFormCustomDept('');
      setFormAcknowledged(false);
      // Open detail of the newly created grievance
      void openDetail(res.grievance);
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Submission failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  }

  // Submit clarification response
  async function handleClarificationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGrievance) return;
    setClarificationError('');

    if (clarificationText.trim().length < 10) {
      setClarificationError('Response must be at least 10 characters.');
      return;
    }

    const piiCheck = validatePiiSafety(clarificationText);
    if (!piiCheck.safe) {
      setClarificationError(piiCheck.error || 'Invalid clarification text.');
      return;
    }

    setSubmittingClarification(true);
    try {
      const res = await api<{ grievance: GrievanceRecord; events: GrievanceEventRecord[] }>(
        `grievances/${selectedGrievance.id}/respond`,
        { response: clarificationText.trim() }
      );
      setSelectedGrievance(res.grievance);
      setSelectedEvents(res.events);
      setClarificationText('');
      setGrievances((prev) => prev.map((item) => (item.id === res.grievance.id ? res.grievance : item)));
    } catch (err: unknown) {
      const e = err as Error;
      setClarificationError(e.message || 'Failed to submit response.');
    } finally {
      setSubmittingClarification(false);
    }
  }

  // Close grievance
  async function handleCloseGrievance() {
    if (!selectedGrievance) return;
    try {
      const res = await api<{ grievance: GrievanceRecord; events: GrievanceEventRecord[] }>(
        `grievances/${selectedGrievance.id}/close`,
        {}
      );
      setSelectedGrievance(res.grievance);
      setSelectedEvents(res.events);
      setGrievances((prev) => prev.map((item) => (item.id === res.grievance.id ? res.grievance : item)));
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to close grievance.');
    }
  }

  // Summary counts
  const summary = useMemo(() => getGrievanceSummary(grievances), [grievances]);

  // Filter and search
  const filteredGrievances = useMemo(() => {
    let list = grievances;

    if (statusFilter === 'awaiting_review') {
      list = list.filter((g) => ['submitted', 'under_review', 'response_provided'].includes(g.status));
    } else if (statusFilter === 'information_required') {
      list = list.filter((g) => g.status === 'information_required');
    } else if (statusFilter === 'resolved') {
      list = list.filter((g) => ['resolved', 'closed'].includes(g.status));
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((g) => {
        const text = [
          g.reference_number,
          g.subject,
          g.description,
          g.department || '',
          g.service || '',
          g.category,
        ]
          .join(' ')
          .toLowerCase();
        return text.includes(query);
      });
    }

    return list;
  }, [grievances, statusFilter, searchQuery]);

  // Live PII alert for form description
  const formPiiCheck = useMemo(() => {
    if (!formDescription.trim()) return { safe: true };
    return validatePiiSafety(formDescription);
  }, [formDescription]);

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  }

  return (
    <div className="grievance-centre-container">
      {/* 1. Header & Non-Representation Banner */}
      <div className="panel receipt section-gap" style={{ borderLeft: '4px solid var(--brand, #B94220)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <LifeBuoy size={20} style={{ color: 'var(--brand, #B94220)' }} />
              <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand, #B94220)' }}>
                {t('GovSync Coordination Desk')}
              </strong>
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '1.6rem', color: '#102B3A' }}>
              {t('Unified Grievance Centre')}
            </h2>
            <p style={{ margin: 0, color: 'var(--muted, #4b5563)', maxWidth: '780px', fontSize: '0.95rem' }}>
              {t(
                'GovSync is an independent citizen coordination and tracking portal. Lodging a grievance in GovSync is for internal assistance and coordination; it does not automatically register a complaint with government grievance authorities (such as Aaple Sarkar Grievance Redressal or CPGRAMS).'
              )}
            </p>
          </div>
          {mode === 'citizen' && (
            <button
              type="button"
              className="btn primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#B94220', borderColor: '#B94220' }}
              onClick={() => {
                setFormAppId('none');
                setFormSubject('');
                setFormDescription('');
                setFormCustomDept('');
                setFormError('');
                setIsLodgeModalOpen(true);
              }}
            >
              <Plus size={16} aria-hidden="true" />
              {t('Lodge New Grievance')}
            </button>
          )}
        </div>

        {/* Official Grievance Portals Navigation Strip */}
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted, #4b5563)' }}>
            <ExternalLink size={14} />
            <span>{t('Official Government Grievance Authorities')}:</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="https://grievances.maharashtra.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0f766e', textDecoration: 'underline', fontWeight: 600 }}
            >
              {t('Official Aaple Sarkar Grievance Portal')}
            </a>
            <span style={{ color: '#ccc' }}>·</span>
            <a
              href="https://pgportal.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0f766e', textDecoration: 'underline', fontWeight: 600 }}
            >
              {t('Central CPGRAMS Portal')}
            </a>
          </div>
        </div>
      </div>

      {/* 2. Grievance Summary Metrics Cards (Mutually Exclusive) */}
      <div className="stats-grid section-gap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="panel stat-card" style={{ padding: '1rem', borderTop: '3px solid #102B3A' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted, #4b5563)', textTransform: 'uppercase' }}>
              {t('Total Grievances')}
            </span>
            <MessageSquare size={16} style={{ color: '#102B3A' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#102B3A' }}>
            {n(summary.total)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted, #4b5563)' }}>{t('Recorded in GovSync')}</span>
        </div>

        <div className="panel stat-card" style={{ padding: '1rem', borderTop: '3px solid #d97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted, #4b5563)', textTransform: 'uppercase' }}>
              {t('Awaiting Review')}
            </span>
            <Clock size={16} style={{ color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#d97706' }}>
            {n(summary.awaitingReview)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted, #4b5563)' }}>{t('Pending coordination review')}</span>
        </div>

        <div className="panel stat-card" style={{ padding: '1rem', borderTop: '3px solid #ea580c' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted, #4b5563)', textTransform: 'uppercase' }}>
              {t('Information Required')}
            </span>
            <FileQuestion size={16} style={{ color: '#ea580c' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#ea580c' }}>
            {n(summary.informationRequired)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted, #4b5563)' }}>{t('Citizen response requested')}</span>
        </div>

        <div className="panel stat-card" style={{ padding: '1rem', borderTop: '3px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted, #4b5563)', textTransform: 'uppercase' }}>
              {t('Resolved & Closed')}
            </span>
            <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0 0 0', color: '#16a34a' }}>
            {n(summary.resolved)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted, #4b5563)' }}>{t('Concluded tickets')}</span>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      {error && (
        <div className="note error" role="alert" style={{ marginBottom: '1rem' }}>
          {t(error)}
        </div>
      )}
      <div className="panel section-gap" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn small ${statusFilter === 'all' ? 'primary' : ''}`}
              onClick={() => setStatusFilter('all')}
              style={statusFilter === 'all' ? { backgroundColor: '#102B3A', borderColor: '#102B3A' } : {}}
            >
              {t('All Grievances')} ({n(summary.total)})
            </button>
            <button
              type="button"
              className={`btn small ${statusFilter === 'awaiting_review' ? 'primary' : ''}`}
              onClick={() => setStatusFilter('awaiting_review')}
              style={statusFilter === 'awaiting_review' ? { backgroundColor: '#d97706', borderColor: '#d97706' } : {}}
            >
              {t('Awaiting Review')} ({n(summary.awaitingReview)})
            </button>
            <button
              type="button"
              className={`btn small ${statusFilter === 'information_required' ? 'primary' : ''}`}
              onClick={() => setStatusFilter('information_required')}
              style={statusFilter === 'information_required' ? { backgroundColor: '#ea580c', borderColor: '#ea580c' } : {}}
            >
              {t('Information Required')} ({n(summary.informationRequired)})
            </button>
            <button
              type="button"
              className={`btn small ${statusFilter === 'resolved' ? 'primary' : ''}`}
              onClick={() => setStatusFilter('resolved')}
              style={statusFilter === 'resolved' ? { backgroundColor: '#16a34a', borderColor: '#16a34a' } : {}}
            >
              {t('Resolved & Closed')} ({n(summary.resolved)})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px', maxWidth: '400px' }}>
            <label htmlFor={searchInputId} className="sr-only">
              {t('Search grievances by subject, reference, or department')}
            </label>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="search"
              className="field"
              placeholder={t('Search grievances by subject, reference, or department')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.25rem', height: '2.4rem' }}
            />
          </div>
        </div>
      </div>

      {/* 4. Grievances List */}
      <div className="section-gap">
        {loading ? (
          <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto', color: '#102B3A' }} />
            <p>{t('Loading grievances…')}</p>
          </div>
        ) : filteredGrievances.length === 0 ? (
          <div className="panel" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <LifeBuoy size={40} style={{ color: '#9ca3af', margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{t('No grievances found matching the selected filter.')}</h3>
            <p style={{ color: 'var(--muted, #4b5563)', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              {searchQuery
                ? t('Try adjusting your search terms or filter.')
                : t('Submit a grievance when you experience delays, lack of response, or issues with public services.')}
            </p>
            {mode === 'citizen' && (
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setFormAppId('none');
                  setFormSubject('');
                  setFormDescription('');
                  setFormCustomDept('');
                  setIsLodgeModalOpen(true);
                }}
              >
                <Plus size={16} aria-hidden="true" />
                {t('Lodge New Grievance')}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredGrievances.map((g) => {
              const statusMeta = GRIEVANCE_STATUSES[g.status] || GRIEVANCE_STATUSES.submitted;
              const categoryMeta = GRIEVANCE_CATEGORIES.find((c) => c.key === g.category);

              return (
                <div
                  key={g.id}
                  className="panel"
                  style={{
                    padding: '1.25rem',
                    borderLeft: `4px solid ${
                      statusMeta.badgeTone === 'green'
                        ? '#16a34a'
                        : statusMeta.badgeTone === 'orange'
                        ? '#d97706'
                        : '#102B3A'
                    }`,
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#102B3A' }}>
                          {g.reference_number}
                        </strong>
                        <span className={`badge ${statusMeta.badgeTone}`}>{t(statusMeta.label)}</span>
                        <span className="badge neutral">{t(categoryMeta?.label || g.category)}</span>
                        {g.department_verified ? (
                          <span
                            className="badge green"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                          >
                            <ShieldCheck size={12} />
                            {t('Department Verified')}
                          </span>
                        ) : (
                          <span
                            className="badge neutral"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                          >
                            <AlertTriangle size={12} />
                            {t('Department not verified')}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', color: '#102B3A' }}>
                        {g.subject}
                      </h4>

                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--muted, #4b5563)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                        {g.description.length > 160 ? g.description.slice(0, 160) + '…' : g.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#6b7280' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Building2 size={13} />
                          {g.department ? t(g.department) : t('Department not verified')}
                        </span>
                        {g.application_id && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FileText size={13} />
                            {t('Linked App')}: <code>{g.application_id}</code>
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} />
                          {t('Date Submitted')}: {date(g.created_at)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => void openDetail(g)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {t('View Details')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. LODGE NEW GRIEVANCE MODAL */}
      {isLodgeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lodge-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="panel modal-content"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#FFFDFA',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LifeBuoy size={20} style={{ color: '#B94220' }} />
                <h3 id="lodge-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: '#102B3A' }}>
                  {t('Lodge New Grievance')}
                </h3>
              </div>
              <button
                type="button"
                className="btn small"
                aria-label={t('Close')}
                onClick={() => setIsLodgeModalOpen(false)}
                style={{ border: 'none', background: 'transparent' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Non-representation Notice inside form */}
            <div
              className="note warn"
              style={{
                marginBottom: '1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                backgroundColor: '#fffbeb',
                borderColor: '#fde68a',
              }}
            >
              <Info size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '0.15rem' }} />
              <div>
                <strong>{t('GovSync Coordination Notice')}:</strong>{' '}
                {t(
                  'GovSync is an independent citizen coordination and tracking portal. Lodging a grievance in GovSync is for internal assistance and coordination; it does not automatically register a complaint with government grievance authorities (such as Aaple Sarkar Grievance Redressal or CPGRAMS).'
                )}
              </div>
            </div>

            {formError && (
              <div className="note error" role="alert" style={{ marginBottom: '1rem' }}>
                {t(formError)}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmitGrievance(e)}>
              {/* Category */}
              <div className="field-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor={categorySelectId} style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  {t('Grievance Category')} *
                </label>
                <select
                  id={categorySelectId}
                  className="field"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as GrievanceCategory)}
                  style={{ width: '100%', height: '2.5rem' }}
                  required
                >
                  {GRIEVANCE_CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {t(cat.label)} — {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Associated Application */}
              <div className="field-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor={appSelectId} style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  {t('Associated GovSync Application (Optional)')}
                </label>
                <select
                  id={appSelectId}
                  className="field"
                  value={formAppId}
                  onChange={(e) => {
                    const appId = e.target.value;
                    setFormAppId(appId);
                    if (appId !== 'none') {
                      const matched = userApplications.find((a) => a.id === appId);
                      if (matched && !formSubject) {
                        setFormSubject(`Inquiry regarding ${getServiceName(matched.service)} (${matched.id})`);
                      }
                    }
                  }}
                  style={{ width: '100%', height: '2.5rem' }}
                >
                  <option value="none">{t('None / External unintegrated service')}</option>
                  {userApplications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.id} · {getServiceName(app.service)} ({app.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department field if unintegrated */}
              {formAppId === 'none' && (
                <div className="field-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor={deptInputId} style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    {t('Department')} ({t('Optional')})
                  </label>
                  <input
                    id={deptInputId}
                    type="text"
                    className="field"
                    placeholder="e.g. Revenue & Forest Department, Social Welfare, Municipal Corporation"
                    value={formCustomDept}
                    onChange={(e) => setFormCustomDept(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    {t('If left blank, will be catalogued as "Department not verified".')}
                  </span>
                </div>
              )}

              {/* Subject */}
              <div className="field-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor={subjectInputId} style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    {t('Subject / Issue Summary')} *
                  </label>
                  <span style={{ fontSize: '0.78rem', color: formSubject.length > 150 ? 'red' : '#6b7280' }}>
                    {formSubject.length}/150
                  </span>
                </div>
                <input
                  id={subjectInputId}
                  type="text"
                  className="field"
                  placeholder={t('Brief summary of the issue (min 5 characters)')}
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {/* Description */}
              <div className="field-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor={descTextareaId} style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    {t('Detailed Description')} *
                  </label>
                  <span style={{ fontSize: '0.78rem', color: formDescription.length > 2000 ? 'red' : '#6b7280' }}>
                    {formDescription.length}/2000
                  </span>
                </div>
                <textarea
                  id={descTextareaId}
                  className="field"
                  rows={5}
                  placeholder={t(
                    'Describe the service issue in detail (20-2,000 characters). Do not include Aadhaar, bank details, or passwords.'
                  )}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                  required
                />
                {!formPiiCheck.safe && (
                  <div style={{ marginTop: '0.35rem', color: '#b91c1c', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldAlert size={14} />
                    <span>{formPiiCheck.error}</span>
                  </div>
                )}
              </div>

              {/* Acknowledgment Checkbox */}
              <div
                style={{
                  margin: '1.25rem 0',
                  padding: '0.85rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  fontSize: '0.82rem',
                  lineHeight: 1.4,
                }}
              >
                <input
                  id="form-ack"
                  type="checkbox"
                  checked={formAcknowledged}
                  onChange={(e) => setFormAcknowledged(e.target.checked)}
                  style={{ marginTop: '0.15rem' }}
                  required
                />
                <label htmlFor="form-ack" style={{ cursor: 'pointer' }}>
                  {t(
                    'I confirm that I have not included sensitive personal identifiers (such as Aadhaar, bank accounts, or passwords) and understand that GovSync provides coordination assistance and does not replace statutory appeals.'
                  )}
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsLodgeModalOpen(false)}
                  disabled={submitting}
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={submitting || !formPiiCheck.safe || !formAcknowledged}
                  style={{ backgroundColor: '#B94220', borderColor: '#B94220' }}
                >
                  {submitting ? t('Submitting...') : t('Submit Grievance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. GRIEVANCE DETAIL VIEW MODAL / DRAWER */}
      {selectedGrievance && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="panel modal-content"
            style={{
              maxWidth: '750px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              backgroundColor: '#FFFDFA',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <h3 id="detail-modal-title" style={{ margin: 0, fontFamily: 'monospace', fontSize: '1.25rem', color: '#102B3A' }}>
                    {selectedGrievance.reference_number}
                  </h3>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => copyToClipboard(selectedGrievance.reference_number)}
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
                  >
                    {copiedRef ? t('Copied!') : t('Copy')}
                  </button>
                  <span className={`badge ${GRIEVANCE_STATUSES[selectedGrievance.status]?.badgeTone || 'neutral'}`}>
                    {t(GRIEVANCE_STATUSES[selectedGrievance.status]?.label || selectedGrievance.status)}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {t('GovSync Internal Workflow Status')} · {t('Recorded')}: {date(selectedGrievance.created_at)}
                </div>
              </div>
              <button
                type="button"
                className="btn small"
                aria-label={t('Close')}
                onClick={() => setSelectedGrievance(null)}
                style={{ border: 'none', background: 'transparent' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto' }} />
                <p>{t('Loading details…')}</p>
              </div>
            ) : (
              <div>
                {/* RTS Statutory Notice Banner if Overdue */}
                {selectedRtsAdvisory && selectedRtsAdvisory.isOverdue && (
                  <div
                    className="note warn"
                    style={{
                      marginBottom: '1.25rem',
                      padding: '1rem',
                      backgroundColor: '#fef2f2',
                      borderColor: '#fca5a5',
                      borderLeft: '4px solid #b91c1c',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <Scale size={20} style={{ color: '#b91c1c', flexShrink: 0, marginTop: '0.2rem' }} />
                      <div>
                        <strong style={{ color: '#b91c1c', fontSize: '0.95rem' }}>
                          {t('Statutory Service Delivery Overdue under MRTPS Act, 2015')}
                        </strong>
                        <p style={{ margin: '0.35rem 0 0.75rem 0', fontSize: '0.85rem', color: '#374151', lineHeight: 1.45 }}>
                          {t(
                            'Statutory Delivery Notice: This application has reached or exceeded its stipulated timeline under the Maharashtra Right to Public Services Act, 2015. Filing a GovSync grievance is for internal coordination and does NOT constitute a statutory First Appeal under Section 9(1). To enforce statutory delivery deadlines, you may file a formal First Appeal directly on the Aaple Sarkar portal.'
                          )}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn small"
                            style={{ backgroundColor: '#b91c1c', color: '#fff', borderColor: '#b91c1c' }}
                            onClick={() => {
                              setSelectedGrievance(null);
                              if (onOpenRts) onOpenRts(selectedGrievance.application_id || undefined);
                            }}
                          >
                            <Scale size={13} aria-hidden="true" />
                            {t('Open RTS Assistant')}
                          </button>
                          <a
                            href={selectedRtsAdvisory.aapleSarkarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            {t('File Appeal on Aaple Sarkar')}
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grievance Summary Box */}
                <div className="panel" style={{ padding: '1rem', marginBottom: '1.25rem', backgroundColor: '#fafaf9' }}>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
                    {t(GRIEVANCE_CATEGORIES.find((c) => c.key === selectedGrievance.category)?.label || selectedGrievance.category)}
                  </div>
                  <h4 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1.15rem', color: '#102B3A' }}>
                    {selectedGrievance.subject}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#374151' }}>
                    {selectedGrievance.description}
                  </p>

                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>{t('Department')}: </span>
                      <strong>{selectedGrievance.department ? t(selectedGrievance.department) : t('Department not verified')}</strong>
                    </div>
                    {selectedGrievance.application_id && (
                      <div>
                        <span style={{ color: '#6b7280' }}>{t('Linked Application')}: </span>
                        <strong>{selectedGrievance.application_id} {selectedApp ? `(${t(selectedApp.status)})` : ''}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resolution Summary (If present) */}
                {selectedGrievance.resolution_summary && (
                  <div
                    className="panel"
                    style={{
                      padding: '1rem',
                      marginBottom: '1.25rem',
                      backgroundColor: '#f0fdf4',
                      borderColor: '#86efac',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <CheckCircle2 size={16} />
                      <span>{t('Resolution Summary')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#14532d', lineHeight: 1.45 }}>
                      {selectedGrievance.resolution_summary}
                    </p>
                  </div>
                )}

                {/* Information Required / Citizen Response Form */}
                {selectedGrievance.status === 'information_required' && mode === 'citizen' && (
                  <div
                    className="panel"
                    style={{
                      padding: '1rem',
                      marginBottom: '1.25rem',
                      backgroundColor: '#fff7ed',
                      borderColor: '#fed7aa',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c2410c', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <FileQuestion size={16} />
                      <span>{t('Information Requested by Coordination Desk')}</span>
                    </div>
                    <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', color: '#7c2d12' }}>
                      {t('The support team has requested additional clarification or reference documentation.')}
                    </p>

                    {clarificationError && (
                      <div className="note error" role="alert" style={{ marginBottom: '0.75rem' }}>
                        {t(clarificationError)}
                      </div>
                    )}

                    <form onSubmit={(e) => void handleClarificationSubmit(e)}>
                      <textarea
                        className="field"
                        rows={3}
                        placeholder={t('Type your response or clarification here (minimum 10 characters)...')}
                        value={clarificationText}
                        onChange={(e) => setClarificationText(e.target.value)}
                        style={{ width: '100%', marginBottom: '0.5rem', fontFamily: 'inherit' }}
                        required
                      />
                      <button
                        type="submit"
                        className="btn primary small"
                        disabled={submittingClarification}
                        style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                      >
                        <Send size={13} aria-hidden="true" />
                        {submittingClarification ? t('Submitting...') : t('Submit Clarification')}
                      </button>
                    </form>
                  </div>
                )}

                {/* Recorded Citizen Response */}
                {selectedGrievance.citizen_response && (
                  <div
                    className="panel"
                    style={{
                      padding: '1rem',
                      marginBottom: '1.25rem',
                      backgroundColor: '#f8fafc',
                      borderColor: '#e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <MessageSquare size={15} />
                      <span>{t('Citizen Clarification')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                      {selectedGrievance.citizen_response}
                    </p>
                  </div>
                )}

                {/* Chronological Events Timeline */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#102B3A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={15} />
                    {t('Events Timeline')}
                  </h5>

                  <div style={{ borderLeft: '2px solid #e5e7eb', marginLeft: '0.5rem', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedEvents.map((ev, idx) => (
                      <div key={ev.id || idx} style={{ position: 'relative' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: '-1.35rem',
                            top: '0.2rem',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: ev.actor_role === 'admin' ? '#B94220' : '#102B3A',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#102B3A' }}>{t(ev.action)}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{date(ev.created_at)}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0.15rem 0' }}>
                          {t('Actor')}: <strong>{ev.actor}</strong> ({t(ev.actor_role)})
                        </div>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#4b5563', whiteSpace: 'pre-wrap' }}>
                          {ev.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Bar inside detail modal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {selectedGrievance.status !== 'closed' && (
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => void handleCloseGrievance()}
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      {t('Close Grievance')}
                    </button>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => setSelectedGrievance(null)}
                    >
                      {t('Back to Grievances')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
