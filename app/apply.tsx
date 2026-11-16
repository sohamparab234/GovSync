'use client';
import { useState, useId } from 'react';
import {
  Check,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  GraduationCap,
  ShoppingBasket,
  Plane,
  HeartHandshake,
  FileText,
  ScrollText,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { citizens, serviceDepartments, type Department, type Service } from '@/lib/demo';
import { getAllServices, getService, services } from '@/lib/services';
import { detectConflicts } from '@/lib/engine';
import { purposes } from '@/lib/residence';
import { Badge } from './workspace';
import { useLanguage } from './i18n';
import { ApplicationTimeline } from './timeline';
import type { WorkspaceContext, ApplicationRecord, AuditRecord, RuleEvaluation, DataConflict } from '@/lib/types';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  GraduationCap,
  MapPin,
  ShoppingBasket,
  Plane,
  HeartHandshake,
  FileText,
  ScrollText,
};

export const deptInfo: Record<Department, { title: string; desc: string; purpose: string }> = {
  identity: { title: 'Identity', desc: 'Name and date of birth', purpose: 'Applicant verification' },
  education: { title: 'Education', desc: 'College, course and academic score', purpose: 'Eligibility' },
  income: { title: 'Income', desc: 'Annual family income', purpose: 'Eligibility' },
  residence: { title: 'Residence', desc: 'Address, district, state, PIN and domicile', purpose: 'Residence verification' },
  documents: { title: 'Documents', desc: 'Existing verified address proof', purpose: 'Supporting evidence' },
};

export const residenceFields = [
  ['Full name', 'name', 'Identity'],
  ['Date of birth', 'dateOfBirth', 'Identity'],
  ['Address', 'address', 'Residence'],
  ['District', 'district', 'Residence'],
  ['State', 'state', 'Residence'],
  ['PIN Code', 'pin', 'Residence'],
];

export const scholarshipFields = [
  ['Full name', 'name', 'Identity'],
  ['Date of birth', 'dateOfBirth', 'Identity'],
  ['College', 'college', 'Education'],
  ['Course', 'course', 'Education'],
  ['Academic score (%)', 'marks', 'Education'],
  ['Annual family income', 'annualIncome', 'Income'],
  ['Address', 'address', 'Residence'],
  ['District', 'district', 'Residence'],
  ['State', 'state', 'Residence'],
];

export function getServiceFields(serviceId?: string): string[][] {
  const def = services[serviceId as Service];
  if (!def || !def.fields) {
    return serviceId === 'residence' ? residenceFields : scholarshipFields;
  }
  return def.fields.map((f) => [f.label, f.key, f.source]);
}

export function Profile({ profile, fields = residenceFields }: { profile: Record<string, unknown>; fields?: string[][] }) {
  const { t, value } = useLanguage(), id = useId();
  return (
    <div className="fields">
      {fields.map(([label, key, source]) => (
        <div className="field" key={key}>
          <label className="form-label" htmlFor={id + '-' + key}>{t(label)}</label>
          <input id={id + '-' + key} value={value(key, profile[key])} readOnly />
          <small>{t('Source')} · {t(source)}</small>
        </div>
      ))}
    </div>
  );
}

export default function Apply({ ctx: c }: { ctx: WorkspaceContext }) {
  const { t, n } = useLanguage(), [editing, setEditing] = useState(false);
  const [editingClarification, setEditingClarification] = useState(false);

  const activeServiceDef = getService(c.service || '') || services.scholarship;
  const sources = serviceDepartments[c.service as Service] || activeServiceDef.requiredSources || [];
  const result = c.app?.result ? JSON.parse(c.app.result) : null;
  const activeConsent = Boolean(c.app?.consent && c.app.expires_at > new Date().toISOString());
  const dirty = c.service === 'residence' && result && JSON.stringify(c.details) !== JSON.stringify(result.details);
  const title = activeServiceDef.name;
  const approvedResidence = c.workspace.applications.find(
    (a: ApplicationRecord) => a.service === 'residence' && a.status === 'approved' && a.citizen_id === c.citizen && a.consent && a.expires_at > new Date().toISOString()
  );

  const choices = ['Consent', 'Verify records', 'Application', 'Review', 'Track'];

  // Conflict detection for the current application
  const normalizedRecords: Record<string, Record<string, unknown>> = c.records
    ? Object.fromEntries(
        Object.entries(c.records).map(([k, v]) => [k, (v as { normalized?: Record<string, unknown> })?.normalized || (v as unknown as Record<string, unknown>)])
      )
    : {};
  const conflicts: DataConflict[] = c.records ? detectConflicts(normalizedRecords, c.details) : [];

  if (!c.service) {
    return (
      <div className="service-grid">
        {getAllServices().map((s) => {
          const Icon = iconMap[s.icon] || GraduationCap;
          return (
            <section className="panel service-card" key={s.id}>
              <Icon size={28} />
              <h2>{t(s.name)}</h2>
              <p>{t(s.description)}</p>
              <button className="btn primary" onClick={() => c.reset(s.id)}>
                {t('Start Application')}
              </button>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="two-col">
      <section className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-kicker">{t('Application')}</div>
            <h2>{t(title)}</h2>
          </div>
          <Badge status={c.app?.status}>{c.app ? undefined : t('New application')}</Badge>
        </div>

        <div className="steps">
          {choices.map((s, i) => (
            <div key={s} className={'step ' + (c.stage === i ? 'active' : c.stage > i ? 'done' : '')} aria-current={c.stage === i ? 'step' : undefined}>
              <span className="step-num">{c.stage > i ? <Check size={13} /> : n(i + 1)}</span>
              {t(s)}
            </div>
          ))}
        </div>

        <div className="panel-body">
          {/* STAGE 0: CONSENT */}
          {c.stage === 0 && (
            <>
              <h3>{t('Choose a sample applicant')}</h3>
              <label className="form-label" htmlFor="citizen">{t('Demo citizen')}</label>
              <Select value={c.citizen} disabled={c.busy || Boolean(c.workspace.user?.citizenId)} onValueChange={(v) => { c.setCitizen(v); c.setReuse(''); }}>
                <SelectTrigger id="citizen" className="choice"><SelectValue /></SelectTrigger>
                <SelectContent className="citizen-select-content">
                  {citizens.map((x) => (
                    <SelectItem value={x.id} key={x.id}>{t(x.name)} · {x.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {c.workspace.user?.citizenId && <small className="demo-locked">{t('You are signed in as this sample citizen.')}</small>}

              <h3 className="section-gap">{t('Information required for this application')}</h3>
              <p className="subtext">{t('Permission expires after {hours} hours and can be revoked.', { hours: 24 })}</p>

              <div className="consent-list">
                {sources.map((d) => (
                  <div className="consent-row" key={d}>
                    <Checkbox
                      id={'consent-' + d}
                      checked={c.scopes.includes(d)}
                      disabled={c.busy}
                      onCheckedChange={(v) => c.setScopes((s: string[]) => v ? [...s, d] : s.filter((x) => x !== d))}
                    />
                    <label htmlFor={'consent-' + d}>
                      {t(deptInfo[d].title)}
                      <small>{t(deptInfo[d].desc)} · {t(deptInfo[d].purpose)}</small>
                    </label>
                  </div>
                ))}
              </div>

              {c.service !== 'residence' && approvedResidence && (
                <div className="note">
                  <div>
                    <strong>{t('Verified residence information available')}</strong>
                    <div className="consent-row">
                      <Checkbox id="reuse" checked={c.reuse === approvedResidence.id} onCheckedChange={(v) => c.setReuse(v ? approvedResidence.id : '')} />
                      <label htmlFor="reuse">{t('Use verified information')} · {approvedResidence.id}</label>
                    </div>
                  </div>
                </div>
              )}

              <div className="consent-row">
                <Checkbox id="accepted" checked={c.accepted} onCheckedChange={(v) => c.setAccepted(Boolean(v))} disabled={c.busy} />
                <label htmlFor="accepted">{t('I consent to retrieving the selected information from connected systems.')}</label>
              </div>

              {c.service === 'residence' && (
                <div className="consent-row">
                  <Checkbox id="mismatch" checked={c.mismatch} onCheckedChange={(v) => c.setMismatch(Boolean(v))} />
                  <label htmlFor="mismatch">{t('Demonstrate an address mismatch')}</label>
                </div>
              )}

              <div className="consent-row">
                <Checkbox id="outage" checked={c.outage} onCheckedChange={(v) => c.setOutage(Boolean(v))} />
                <label htmlFor="outage">{t('Simulate a department outage')}</label>
              </div>

              <div className="actions">
                <span className="subtext">{t('{count} of {total} sources selected', { count: c.scopes.length, total: sources.length })}</span>
                <button
                  className="btn primary"
                  onClick={c.begin}
                  disabled={c.busy || c.auth || c.scopes.length !== sources.length || !c.accepted}
                >
                  {t('Grant Consent')}
                </button>
              </div>
            </>
          )}

          {/* STAGE 1: VERIFY RECORDS */}
          {c.stage === 1 && (
            <div aria-live="polite">
              <h3>{t('Retrieving verified information…')}</h3>
              <Progress aria-label={t('Verify records')} value={(sources.filter((d) => c.checks[d] === 'success').length / sources.length) * 100} />
              {sources.map((d) => (
                <div className="flow-line" key={d}>
                  <p>{t(deptInfo[d].title)}</p>
                  <span className="status">
                    {c.checks[d] === 'loading' ? (
                      <LoaderCircle className="spin" size={20} />
                    ) : (
                      <Badge status={c.checks[d]}>{t(c.checks[d] === 'success' ? 'Verified' : c.checks[d] === 'failed' ? 'Unavailable' : 'Waiting')}</Badge>
                    )}
                  </span>
                </div>
              ))}
              <p className="subtext">{t('Preparing application')}</p>
              <button className="btn primary section-gap" onClick={c.retry} disabled={c.busy || !activeConsent}>
                {t('Retry verification')}
              </button>
            </div>
          )}

          {/* STAGE 2: APPLICATION FORM & CONFLICT RESOLUTION */}
          {c.stage === 2 && result && (
            <>
              <h3>{t(title)}</h3>
              <p className="subtext">{t('{count} fields populated from connected records', { count: activeServiceDef.fields.length })}</p>

              {/* CONFLICT RESOLUTION WORKFLOW */}
              {conflicts.length > 0 && (
                <div className="note warn section-gap">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} />
                      <strong>{t('Discrepancy detected between government registries')}</strong>
                    </div>
                    {conflicts.map((conf) => (
                      <div key={conf.field} style={{ marginTop: '8px' }}>
                        <p>{conf.description}</p>
                        {conf.sources.map((s) => (
                          <p key={s.department} style={{ fontSize: '0.8125rem' }}>
                            <strong>{s.sourceLabel}:</strong> {s.value}
                          </p>
                        ))}
                      </div>
                    ))}
                    <div className="actions" style={{ marginTop: '12px' }}>
                      <button
                        className="btn primary"
                        disabled={c.busy}
                        onClick={() => {
                          setEditing(false);
                          setEditingClarification(false);
                          const authoritativeAddress = c.records.residence?.normalized.address;
                          void c.validate({ ...c.details, address: authoritativeAddress, discrepancyNote: '' });
                        }}
                      >
                        {t('Accept authoritative government record')}
                      </button>
                      <button className="btn" onClick={() => setEditingClarification(!editingClarification)}>
                        {t('Attach explanation for officer review')}
                      </button>
                    </div>
                    {editingClarification && (
                      <div className="field section-gap">
                        <label className="form-label" htmlFor="discrepancy-note">
                          {t('Explanation Note')}
                        </label>
                        <textarea
                          id="discrepancy-note"
                          maxLength={500}
                          placeholder="e.g. Relocated recently, official address update in progress with Revenue Dept."
                          value={String(c.details.discrepancyNote || '')}
                          onChange={(e) => c.setDetails({ ...c.details, discrepancyNote: e.target.value })}
                        />
                        <button
                          className="btn small"
                          style={{ marginTop: '6px' }}
                          onClick={() => {
                            setEditingClarification(false);
                            void c.validate({ ...c.details });
                          }}
                        >
                          {t('Discrepancy acknowledged by citizen')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service-specific address mismatch banner for Residence */}
              {c.service === 'residence' && Boolean(c.details.address) && Boolean(c.records.residence?.normalized.address) && c.details.address !== c.records.residence?.normalized.address && conflicts.length === 0 && (
                <div className="note warn section-gap">
                  <div>
                    <strong>{t('Address mismatch detected')}</strong>
                    <p>{t('Minor formatting difference detected. Accept the registry address or edit and validate again.')}</p>
                    <p>{t('Residence Registry')}: {t(String(c.records.residence?.normalized.address || ''))}</p>
                    <p>{t('Application')}: {t(String(c.details.address || ''))}</p>
                    <div className="actions">
                      <button className="btn primary" disabled={c.busy} onClick={() => { setEditing(false); void c.validate({ ...c.details, address: c.records.residence?.normalized.address }); }}>
                        {t('Accept verified address')}
                      </button>
                      <button className="btn" onClick={() => setEditing(true)}>
                        {t('Edit information')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="section-gap">
                <Profile profile={result.profile} fields={getServiceFields(c.service)} />
              </div>

              {/* SERVICE SPECIFIC FORM INPUTS */}
              {c.service === 'residence' && (
                <div className="fields section-gap">
                  {editing && (
                    <div className="field wide">
                      <label className="form-label" htmlFor="edit-address">{t('Address')}</label>
                      <input id="edit-address" maxLength={250} value={String(c.details.address || '')} onChange={(e) => c.setDetails({ ...c.details, address: e.target.value })} />
                    </div>
                  )}
                  <div className="field">
                    <label className="form-label" htmlFor="residence-since">{t('Residence Since')}</label>
                    <input
                      id="residence-since"
                      inputMode="numeric"
                      value={n(Number(c.details.residenceSince || 0), { useGrouping: false })}
                      onChange={(e) => {
                        const latin = e.target.value.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d))).replace(/,/g, '');
                        c.setDetails({ ...c.details, residenceSince: Number(latin) });
                      }}
                    />
                  </div>
                  <div className="field">
                    <label className="form-label" htmlFor="purpose">{t('Purpose')}</label>
                    <Select value={String(c.details.purpose || '')} onValueChange={(v) => c.setDetails({ ...c.details, purpose: v })}>
                      <SelectTrigger id="purpose" className="choice"><SelectValue /></SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        {purposes.map((p) => <SelectItem key={p} value={p}>{t(p)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="field wide">
                    <label className="form-label" htmlFor="document">{t('Supporting Document')}</label>
                    <Select value={String(c.details.documentId || '')} onValueChange={(v) => c.setDetails({ ...c.details, documentId: v })}>
                      <SelectTrigger id="document" className="choice"><SelectValue /></SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        <SelectItem value={String(c.records.documents?.normalized.documentId || '')}>
                          {t('Verified address proof')} · {String(c.records.documents?.normalized.documentId || '')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {c.service === 'ration-card' && (
                <div className="fields section-gap">
                  <div className="field">
                    <label className="form-label" htmlFor="card-type">{t('Ration Card Category')}</label>
                    <Select value={String(c.details.cardType || 'Priority Household (PHH)')} onValueChange={(v) => c.setDetails({ ...c.details, cardType: v })}>
                      <SelectTrigger id="card-type" className="choice"><SelectValue /></SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        {['Priority Household (PHH)', 'Antyodaya Anna Yojana (AAY)', 'Non-NFSA Subsidized'].map((p) => (
                          <SelectItem key={p} value={p}>{t(p)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="field">
                    <label className="form-label" htmlFor="family-count">{t('Total Family Members Count')}</label>
                    <input
                      id="family-count"
                      type="number"
                      min={1}
                      max={15}
                      value={Number(c.details.familyMembersCount || 4)}
                      onChange={(e) => c.setDetails({ ...c.details, familyMembersCount: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {c.service === 'passport' && (
                <div className="fields section-gap">
                  <div className="field">
                    <label className="form-label" htmlFor="booklet-type">{t('Passport Booklet Type')}</label>
                    <Select value={String(c.details.bookletType || '36 Pages (Standard)')} onValueChange={(v) => c.setDetails({ ...c.details, bookletType: v })}>
                      <SelectTrigger id="booklet-type" className="choice"><SelectValue /></SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        {['36 Pages (Standard)', '60 Pages (Jumbo)'].map((p) => (
                          <SelectItem key={p} value={p}>{t(p)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="field">
                    <label className="form-label" htmlFor="validity-req">{t('Validity Duration')}</label>
                    <Select value={String(c.details.validityRequired || '10 Years (Adult)')} onValueChange={(v) => c.setDetails({ ...c.details, validityRequired: v })}>
                      <SelectTrigger id="validity-req" className="choice"><SelectValue /></SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        {['10 Years (Adult)', '5 Years'].map((p) => (
                          <SelectItem key={p} value={p}>{t(p)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {c.service === 'pension' && (
                <div className="fields section-gap">
                  <div className="field wide">
                    <label className="form-label" htmlFor="dbt-account">{t('Direct Benefit Transfer (DBT) Bank Account Reference')}</label>
                    <input
                      id="dbt-account"
                      maxLength={40}
                      value={String(c.details.bankAccountRef || 'DBT-VERIFIED-ACCOUNT')}
                      onChange={(e) => c.setDetails({ ...c.details, bankAccountRef: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {c.service === 'income-certificate' && (
                <div className="fields section-gap">
                  <div className="field wide">
                    <label className="form-label" htmlFor="inc-purpose">{t('Purpose of Income Certificate')}</label>
                    <Select value={String(c.details.purpose || 'Educational Scholarship')} onValueChange={(v) => c.setDetails({ ...c.details, purpose: v })}>
                      <SelectTrigger id="inc-purpose" className="choice"><SelectValue /></SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        {['Educational Scholarship', 'Fee Concession', 'Government Subsidy', 'Legal / Court Purpose'].map((p) => (
                          <SelectItem key={p} value={p}>{t(p)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {c.service === 'caste-certificate' && (
                <div className="fields section-gap">
                  <div className="field">
                    <label className="form-label" htmlFor="caste-cat">{t('Community / Caste Category')}</label>
                    <Select value={String(c.details.communityCategory || 'Other Backward Class (OBC)')} onValueChange={(v) => c.setDetails({ ...c.details, communityCategory: v })}>
                      <SelectTrigger id="caste-cat" className="choice"><SelectValue /></SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        {['Scheduled Caste (SC)', 'Scheduled Tribe (ST)', 'Other Backward Class (OBC)', 'Special Backward Category (SBC)', 'Economically Weaker Section (EWS)'].map((p) => (
                          <SelectItem key={p} value={p}>{t(p)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="field">
                    <label className="form-label" htmlFor="sub-caste">{t('Sub-Caste / Sub-Tribe (as per revenue record)')}</label>
                    <input
                      id="sub-caste"
                      maxLength={60}
                      placeholder="e.g. Kunbi Maratha"
                      value={String(c.details.subCaste || '')}
                      onChange={(e) => c.setDetails({ ...c.details, subCaste: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {c.service === 'residence' && (
                <button className="btn section-gap" disabled={c.busy || !activeConsent} onClick={() => c.validate()}>
                  {t('Validate information')}
                </button>
              )}

              <div className="rules">
                <h3>{t('Verification Check')}</h3>
                {result.rules.map((r: RuleEvaluation) => (
                  <div className="rule-row" key={r.label}>
                    {r.passed ? <CheckCircle2 size={18} color="#315c52" /> : <XCircle size={18} color="#9b592e" />}
                    <span>{t(r.label)}</span>
                  </div>
                ))}
              </div>

              {result.status === 'eligible' && !dirty ? (
                <div className="note">
                  <CheckCircle2 size={18} />
                  {t(c.service === 'residence' ? 'Data normalized successfully' : 'Ready for submission')}
                </div>
              ) : (
                <div className="note warn">{t('Resolve the failed checks before submission.')}</div>
              )}

              {!activeConsent && <p className="note warn">{t('Consent expired or was revoked. Start a new application.')}</p>}

              <div className="actions">
                <button className="btn" onClick={() => c.move('mapping')}>{t('Data mappings')}</button>
                <button
                  className="btn primary"
                  disabled={c.busy || result.status !== 'eligible' || dirty || !activeConsent}
                  onClick={() => {
                    c.setConfirmed(false);
                    c.setStage(3);
                  }}
                >
                  {t('Continue to review')}
                </button>
              </div>
            </>
          )}

          {/* STAGE 3: REVIEW & SUBMIT */}
          {c.stage === 3 && result && (
            <form onSubmit={(e) => { e.preventDefault(); void c.submit(); }}>
              <h3>{t('Review before submission')}</h3>
              <div className="section-gap">
                <Profile profile={result.profile} fields={getServiceFields(c.service)} />
              </div>

              {c.service === 'scholarship' ? (
                <div className="fields section-gap">
                  <div className="field wide">
                    <label className="form-label" htmlFor="email">{t('Contact email for the demo record')}</label>
                    <input type="email" id="email" required maxLength={200} value={c.email} onChange={(e) => c.setEmail(e.target.value)} />
                  </div>
                  <div className="field wide">
                    <label className="form-label" htmlFor="statement">{t('Brief application statement')}</label>
                    <textarea id="statement" required minLength={20} maxLength={1000} value={c.statement} onChange={(e) => c.setStatement(e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="receipt">
                  {Boolean(c.details.purpose) && <p>{t('Purpose')}: {t(String(c.details.purpose))}</p>}
                  {Boolean(c.details.residenceSince) && <p>{t('Residence Since')}: {n(Number(c.details.residenceSince), { useGrouping: false })}</p>}
                  {Boolean(c.details.cardType) && <p>{t('Ration Card Category')}: {t(String(c.details.cardType))}</p>}
                  {Boolean(c.details.bookletType) && <p>{t('Passport Booklet Type')}: {t(String(c.details.bookletType))}</p>}
                  {Boolean(c.details.communityCategory) && <p>{t('Community / Caste Category')}: {t(String(c.details.communityCategory))}</p>}
                  {Boolean(c.details.discrepancyNote) && <p>{t('Explanation Note')}: {String(c.details.discrepancyNote)}</p>}
                  <Badge status="success">{t('Validation passed')}</Badge>
                </div>
              )}

              <div className="consent-row">
                <Checkbox id="confirm" checked={c.confirmed} onCheckedChange={(v) => c.setConfirmed(Boolean(v))} />
                <label htmlFor="confirm">{t('I confirm that the information shown is correct.')}</label>
              </div>

              <div className="actions">
                <button className="btn" type="button" onClick={() => c.setStage(2)}>{t('Back to application')}</button>
                <button className="btn primary" type="submit" disabled={c.busy || !c.confirmed || !activeConsent}>
                  {c.busy && <LoaderCircle className="spin" size={16} />} {t('Submit application')}
                </button>
              </div>
            </form>
          )}

          {/* STAGE 4: TRACKING */}
          {c.stage === 4 && c.app && (
            <>
              <h2>
                {t(
                  c.app.status === 'approved'
                    ? activeServiceDef.supportsCertificate
                      ? 'Your certificate is ready.'
                      : 'Your application is approved.'
                    : 'Application received.'
                )}
              </h2>

              <ApplicationTimeline
                app={c.app}
                events={c.workspace.audit.filter((x: AuditRecord) => x.application_id === c.app?.id)}
                serviceDef={activeServiceDef}
                ctx={c}
                activeConsent={activeConsent}
                onClarify={c.clarify}
              />
            </>
          )}
        </div>
      </section>

      {/* ASIDE INFO */}
      <aside className="stack aside-info">
        <div className="scheme">
          <h3>{t(title)}</h3>
          <p>{t(activeServiceDef.description)}</p>
          <div className="rule">{t('Consent → Verified data → Validation → Department review → Tracking')}</div>
          {activeServiceDef.rules && (
            <div className="rule">
              {activeServiceDef.rules.slice(0, 3).map((r) => (
                <p key={r.id}>{t(r.label)}</p>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>{t('Connected sources')}</h3>
            <Badge>{n(sources.length)}</Badge>
          </div>
          <div className="info-list">
            {sources.map((d) => (
              <div className="info-item" key={d}>
                <div>
                  <p>{t(deptInfo[d].title)}</p>
                  <small>{t(deptInfo[d].desc)}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="btn" onClick={() => c.move('consent')}>{t('Manage your consent')}</button>
        <button className="btn" disabled={c.busy} onClick={() => c.reset()}>{t('Change service')}</button>
      </aside>
    </div>
  );
}
