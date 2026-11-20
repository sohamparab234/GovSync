'use client';
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  HandHeart,
  HeartPulse,
  HelpCircle,
  Home,
  Layers,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sprout,
  User,
  Users,
} from 'lucide-react';
import { useLanguage } from './i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getRecommendations,
  hasAnyRecommendationAnswer,
  isValidMaharashtraDistrict,
  type AccomplishGoal,
  type AssistanceNeed,
  type BeneficiaryType,
  type RecommendationAnswers,
  type RecommendationItem,
  type RelevanceConfidence,
} from '@/lib/recommendations';
import { governmentSchemes, maharashtraDistricts } from '@/lib/gov-info/schemes';
import { getAuthority } from '@/lib/gov-info/authorities';
import type { GovernmentScheme } from '@/lib/gov-info/types';
import type { Service } from '@/lib/services';
import type { WorkspaceContext } from '@/lib/types';

export interface ServiceRecommendationsProps {
  ctx?: WorkspaceContext;
  mode?: 'citizen' | 'public';
  onStartService?: (serviceId: Service) => void;
}

const NEED_ICONS: Record<AssistanceNeed, React.ComponentType<{ size?: number; className?: string }>> = {
  agriculture: Sprout,
  education: GraduationCap,
  employment: Briefcase,
  healthcare: HeartPulse,
  business: Building2,
  housing: Home,
  certificates: FileText,
  social_welfare: HandHeart,
  other: HelpCircle,
};

const NEED_LABELS: Record<AssistanceNeed, string> = {
  agriculture: 'Agriculture and farming',
  education: 'Education and scholarships',
  employment: 'Employment and skills',
  healthcare: 'Healthcare and medical support',
  business: 'Business and self-employment',
  housing: 'Housing and shelter',
  certificates: 'Official certificates and documentation',
  social_welfare: 'Social welfare and pensions',
  other: 'Other government support',
};

const BENEFICIARY_OPTIONS: { id: BeneficiaryType; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'myself', label: 'Myself', icon: User },
  { id: 'family_member', label: 'A family member', icon: Users },
  { id: 'business', label: 'My business / enterprise', icon: Building2 },
  { id: 'farm', label: 'My farm / agricultural holding', icon: Sprout },
  { id: 'other', label: 'Other', icon: HelpCircle },
];

const GOAL_OPTIONS: { id: AccomplishGoal; label: string }[] = [
  { id: 'financial_assistance', label: 'Receive financial assistance or direct benefit transfer (DBT)' },
  { id: 'apply_certificate', label: 'Apply for an official certificate' },
  { id: 'access_service', label: 'Access a government citizen service' },
  { id: 'educational_opportunity', label: 'Find an educational or scholarship opportunity' },
  { id: 'agricultural_support', label: 'Access agricultural support or equipment subsidy' },
  { id: 'other', label: 'Explore available options' },
];

function confidenceBadgeClass(confidence: RelevanceConfidence): string {
  if (confidence === 'strong_match') return 'badge green';
  if (confidence === 'possible_match') return 'badge orange';
  return 'badge neutral';
}

function confidenceLabelKey(confidence: RelevanceConfidence): string {
  if (confidence === 'strong_match') return 'Strong match';
  if (confidence === 'possible_match') return 'Possible match';
  return 'Related service';
}

export function ServiceRecommendations({ ctx: c, onStartService }: ServiceRecommendationsProps) {
  const { t, n, date } = useLanguage();

  // Session-only memory state — NEVER stored in DB, localStorage, or cookies
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [answers, setAnswers] = useState<RecommendationAnswers>({
    needs: [],
    district: undefined,
    beneficiary: undefined,
    goal: undefined,
  });
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [selectedSchemeDetail, setSelectedSchemeDetail] = useState<GovernmentScheme | null>(null);

  const hasAnswers = useMemo(() => hasAnyRecommendationAnswer(answers), [answers]);

  const results = useMemo(() => {
    return getRecommendations(answers);
  }, [answers]);

  function toggleNeed(need: AssistanceNeed) {
    setAnswers((prev) => {
      const exists = prev.needs.includes(need);
      const nextNeeds = exists ? prev.needs.filter((n) => n !== need) : [...prev.needs, need];
      return { ...prev, needs: nextNeeds };
    });
  }

  function setDistrict(val: string | undefined) {
    setAnswers((prev) => ({
      ...prev,
      district: val && isValidMaharashtraDistrict(val) ? val : undefined,
    }));
  }

  function setBeneficiary(val: BeneficiaryType) {
    setAnswers((prev) => ({
      ...prev,
      beneficiary: val,
    }));
  }

  function setGoal(val: AccomplishGoal) {
    setAnswers((prev) => ({
      ...prev,
      goal: val,
    }));
  }

  function resetAll() {
    setAnswers({
      needs: [],
      district: undefined,
      beneficiary: undefined,
      goal: undefined,
    });
    setStep(1);
    setShowQuestionnaire(true);
  }

  function handleStartService(serviceId: Service) {
    if (onStartService) {
      onStartService(serviceId);
    } else if (c) {
      c.reset(serviceId);
    }
  }

  function openSchemeModal(schemeId: string) {
    const sc = governmentSchemes.find((s) => s.id === schemeId);
    if (sc) setSelectedSchemeDetail(sc);
  }

  return (
    <div className="recommendations-container citizen-dashboard-root">
      {/* 1. Header & Overview Card */}
      <section className="citizen-overview-card" aria-labelledby="rec-title">
        <div className="citizen-overview-main">
          <div className="citizen-greeting-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="lang-pill" style={{ background: '#FFF8F5', color: 'var(--brand-secondary-strong)', borderColor: '#EAC8BC' }}>
                <Sparkles size={14} style={{ marginRight: '4px' }} />
                {t('Government Service Discovery Assistant')}
              </span>
            </div>
            <h1 id="rec-title">{t('Smart Service Recommendations')}</h1>
            <p className="citizen-overview-desc">
              {t('Discover relevant government services and welfare schemes tailored to your specific situation and needs.')}
            </p>
          </div>

          <div className="citizen-profile-box">
            <div className="citizen-profile-row">
              <div className="profile-avatar">
                <ShieldCheck size={20} />
              </div>
              <div className="profile-details">
                <strong>{t('Privacy Protected')}</strong>
                <span className="profile-meta">{t('Session-only memory')}</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.78125rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {t('Session-only questionnaire: Your answers are evaluated strictly in application memory and are never saved or stored.')}
            </p>
          </div>
        </div>

        <div className="demo-notice-bar">
          <div className="demo-notice-content">
            <strong>{t('Simulated Connected Government Services (Demonstration Environment)')}</strong>
            <p>{t('Relevance indicates how well this matches your stated needs. It does not establish official government eligibility or approval.')}</p>
          </div>
        </div>
      </section>

      {/* 2. Questionnaire Card */}
      {showQuestionnaire && (
        <section className="panel section-gap questionnaire-card" aria-labelledby="step-title">
          <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
            <div>
              <span className="service-category" style={{ fontSize: '0.8125rem' }}>
                {t('Step {current} of {total}', { current: step, total: 4 })}
              </span>
              <h2 id="step-title" style={{ marginTop: '4px', fontSize: '1.25rem' }}>
                {step === 1 && t('What type of assistance or service are you looking for?')}
                {step === 2 && t('Which district are you from in Maharashtra? (Optional)')}
                {step === 3 && t('Who is the service intended for?')}
                {step === 4 && t('What are you trying to accomplish?')}
              </h2>
              <p className="subtext">
                {step === 1 && t('Select all that apply to help us find the best matches.')}
                {step === 2 && t('Select your district to see localized implementation details, or skip this step.')}
                {step === 3 && t('Tell us who will be receiving or using the service.')}
                {step === 4 && t('Choose your primary goal to prioritize relevant services.')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {hasAnswers && (
                <button type="button" className="btn small" onClick={resetAll} aria-label={t('Reset questionnaire')}>
                  <RotateCcw size={14} style={{ marginRight: '4px' }} />
                  {t('Reset questionnaire')}
                </button>
              )}
            </div>
          </div>

          <div className="panel-body" style={{ paddingTop: '20px' }}>
            {/* STEP 1: Assistance Needs (Multi-select) */}
            {step === 1 && (
              <div className="needs-selection-grid">
                {(Object.keys(NEED_LABELS) as AssistanceNeed[]).map((needKey) => {
                  const Icon = NEED_ICONS[needKey] || HelpCircle;
                  const isSelected = answers.needs.includes(needKey);
                  return (
                    <button
                      key={needKey}
                      id={`need-opt-${needKey}`}
                      type="button"
                      className={'need-option-card ' + (isSelected ? 'selected' : '')}
                      onClick={() => toggleNeed(needKey)}
                      aria-pressed={isSelected}
                    >
                      <div className="need-card-header">
                        <div className="need-icon-box">
                          <Icon size={20} />
                        </div>
                        <div className={'checkbox-indicator ' + (isSelected ? 'checked' : '')}>
                          {isSelected && <Check size={14} color="#FFF" />}
                        </div>
                      </div>
                      <span className="need-title">{t(NEED_LABELS[needKey])}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP 2: District (Optional) */}
            {step === 2 && (
              <div className="field-group" style={{ maxWidth: '520px', margin: '10px 0 20px 0' }}>
                <label className="form-label" htmlFor="district-select">
                  {t('Which district are you from in Maharashtra? (Optional)')}
                </label>
                <Select
                  value={answers.district || '__all__'}
                  onValueChange={(val) => setDistrict(val === '__all__' ? undefined : val)}
                >
                  <SelectTrigger id="district-select" className="choice" style={{ height: '46px' }}>
                    <SelectValue placeholder={t('Select district (optional)')} />
                  </SelectTrigger>
                  <SelectContent className="citizen-select-content" style={{ maxHeight: '280px' }}>
                    <SelectItem value="__all__">{t('All Maharashtra / Skip district selection')}</SelectItem>
                    {maharashtraDistricts.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <small className="muted" style={{ display: 'block', marginTop: '6px' }}>
                  {t('Select your district to see localized implementation details, or skip this step.')}
                </small>
              </div>
            )}

            {/* STEP 3: Beneficiary Type */}
            {step === 3 && (
              <div className="beneficiary-options-grid">
                {BENEFICIARY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = answers.beneficiary === opt.id;
                  return (
                    <button
                      key={opt.id}
                      id={`beneficiary-opt-${opt.id}`}
                      type="button"
                      className={'choice-option-card ' + (isSelected ? 'selected' : '')}
                      onClick={() => setBeneficiary(opt.id)}
                      aria-pressed={isSelected}
                    >
                      <div className="choice-icon-box">
                        <Icon size={20} />
                      </div>
                      <span className="choice-label">{t(opt.label)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP 4: Accomplish Goal */}
            {step === 4 && (
              <div className="goal-options-grid">
                {GOAL_OPTIONS.map((opt) => {
                  const isSelected = answers.goal === opt.id;
                  return (
                    <button
                      key={opt.id}
                      id={`goal-opt-${opt.id}`}
                      type="button"
                      className={'choice-option-card goal-card ' + (isSelected ? 'selected' : '')}
                      onClick={() => setGoal(opt.id)}
                      aria-pressed={isSelected}
                    >
                      <div className="choice-icon-box">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="choice-label">{t(opt.label)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Questionnaire Navigation Footer */}
            <div className="step-navigation-footer">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    id="btn-prev-step"
                    className="btn"
                    onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                  >
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} />
                    {t('Previous question')}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {step === 2 && !answers.district && (
                  <button
                    type="button"
                    id="btn-skip-step"
                    className="btn"
                    onClick={() => setStep(3)}
                  >
                    {t('Skip question')}
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    id="btn-next-step"
                    className="btn primary"
                    onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
                  >
                    {t('Next question')}
                    <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-view-recs"
                    className="btn primary"
                    onClick={() => setShowQuestionnaire(false)}
                  >
                    <Sparkles size={16} style={{ marginRight: '6px' }} />
                    {t('View recommendations')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Results Section */}
      <section className="results-section section-gap" aria-label={t('Recommendations')}>
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>
              {t('Recommended for you')} {hasAnswers && results.totalMatches > 0 && `(${n(results.totalMatches)})`}
            </h2>
            <p className="subtext">
              {hasAnswers
                ? t('{count} recommendations found', { count: results.totalMatches })
                : t('Answer a few questions to get tailored service and scheme recommendations.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!showQuestionnaire && (
              <button
                type="button"
                className="btn small"
                onClick={() => setShowQuestionnaire(true)}
              >
                {t('Modify answers')}
              </button>
            )}
            {hasAnswers && (
              <button
                type="button"
                className="btn small"
                onClick={resetAll}
              >
                <RotateCcw size={14} style={{ marginRight: '4px' }} />
                {t('Restart questionnaire')}
              </button>
            )}
            {c && (
              <button
                type="button"
                className="btn small"
                onClick={() => c.move('apply')}
              >
                {t('Explore all services')}
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasAnswers && (
          <div className="active-filters-pill-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '10px 0 16px 0' }}>
            {answers.needs.map((need) => (
              <span key={need} className="lang-pill" style={{ background: '#FFF', color: 'var(--brand-primary)' }}>
                {t(NEED_LABELS[need])}
              </span>
            ))}
            {answers.district && (
              <span className="lang-pill" style={{ background: '#FFF', color: 'var(--brand-primary)' }}>
                <MapPin size={12} style={{ marginRight: '4px' }} />
                {answers.district}
              </span>
            )}
            {answers.beneficiary && answers.beneficiary !== 'other' && (
              <span className="lang-pill" style={{ background: '#FFF', color: 'var(--brand-primary)' }}>
                <User size={12} style={{ marginRight: '4px' }} />
                {t(BENEFICIARY_OPTIONS.find((b) => b.id === answers.beneficiary)?.label || answers.beneficiary)}
              </span>
            )}
            {answers.goal && answers.goal !== 'other' && (
              <span className="lang-pill" style={{ background: '#FFF', color: 'var(--brand-primary)' }}>
                {t(GOAL_OPTIONS.find((g) => g.id === answers.goal)?.label || answers.goal)}
              </span>
            )}
          </div>
        )}

        {/* Content State: Has Matches */}
        {results.totalMatches > 0 ? (
          <div className="recommendations-results-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Recommendations */}
            {results.topRecommendations.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--brand-primary)', marginBottom: '14px' }}>
                  {t('Top recommendations')}
                </h3>
                <div className="recommendations-grid">
                  {results.topRecommendations.map((item) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      onStartService={handleStartService}
                      onOpenScheme={openSchemeModal}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Related Services */}
            {results.relatedServices.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--brand-primary)', marginBottom: '14px', marginTop: '10px' }}>
                  {t('Related services & schemes')}
                </h3>
                <div className="recommendations-grid">
                  {results.relatedServices.map((item) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      onStartService={handleStartService}
                      onOpenScheme={openSchemeModal}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : hasAnswers ? (
          /* Empty Search / No Match State */
          <div className="panel empty" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <HelpCircle size={40} color="var(--brand-secondary)" style={{ margin: '0 auto 12px auto' }} />
            <h3>{t('No matching services found')}</h3>
            <p className="subtext" style={{ maxWidth: '480px', margin: '0 auto 18px auto' }}>
              {t('Try selecting different assistance needs or reset the questionnaire to explore all options.')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setAnswers((prev) => ({ ...prev, needs: ['education', 'certificates'] }));
                  setShowQuestionnaire(false);
                }}
              >
                {t('Education and scholarships')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setAnswers((prev) => ({ ...prev, needs: ['agriculture'] }));
                  setShowQuestionnaire(false);
                }}
              >
                {t('Agriculture and farming')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={resetAll}
              >
                {t('Restart questionnaire')}
              </button>
            </div>
          </div>
        ) : (
          /* Initial State before questionnaire is filled */
          <div className="panel empty" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <Layers size={36} color="var(--brand-primary)" style={{ margin: '0 auto 10px auto' }} />
            <h3>{t('Need guidance finding the right service?')}</h3>
            <p className="subtext" style={{ maxWidth: '480px', margin: '0 auto 16px auto' }}>
              {t('Answer a few questions to get tailored service and scheme recommendations.')}
            </p>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setShowQuestionnaire(true);
                setStep(1);
              }}
            >
              <Sparkles size={16} style={{ marginRight: '6px' }} />
              {t('Get Recommendations')}
            </button>
          </div>
        )}
      </section>

      {/* 4. Scheme Details Modal Dialog */}
      <Dialog open={!!selectedSchemeDetail} onOpenChange={(open) => !open && setSelectedSchemeDetail(null)}>
        <DialogContent className="scheme-dialog-content" id="scheme-details-dialog" style={{ maxWidth: '780px', maxHeight: '85vh', overflowY: 'auto' }}>
          {selectedSchemeDetail && (
            <>
              <DialogHeader>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span className="service-category">{selectedSchemeDetail.category}</span>
                  <span className="badge neutral">{selectedSchemeDetail.level}</span>
                  <span className="badge green">{selectedSchemeDetail.verificationStatus}</span>
                </div>
                <DialogTitle style={{ fontFamily: 'var(--heading-font)', color: 'var(--brand-primary)', fontSize: '1.4rem' }}>
                  {selectedSchemeDetail.name}
                </DialogTitle>
                <DialogDescription style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {selectedSchemeDetail.detailedDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="scheme-detail-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '14px' }}>
                <div className="receipt scheme-detail-meta" style={{ padding: '14px 18px', background: 'var(--surface-muted)', borderRadius: '6px' }}>
                  <p style={{ margin: '3px 0' }}>
                    <strong>{t('Department')}:</strong> {getAuthority(selectedSchemeDetail.departmentId)?.name || selectedSchemeDetail.departmentId}
                  </p>
                  <p style={{ margin: '3px 0' }}>
                    <strong>{t('Application window')}:</strong> {selectedSchemeDetail.deadline.label}
                  </p>
                  <p style={{ margin: '3px 0' }}>
                    <strong>{t('Last verified')}:</strong> {date(selectedSchemeDetail.lastVerifiedDate)}
                  </p>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--brand-primary)', marginBottom: '8px' }}>{t('Benefits')}</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text)' }}>
                    {selectedSchemeDetail.benefits.map((b) => (
                      <li key={b} style={{ marginBottom: '4px' }}>{t(b)}</li>
                    ))}
                  </ul>
                </div>

                {selectedSchemeDetail.requiredDocuments.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--brand-primary)', marginBottom: '8px' }}>
                      <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      {t('Required documents')}
                    </h3>
                    <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text)' }}>
                      {selectedSchemeDetail.requiredDocuments.map((doc) => (
                        <li key={doc} style={{ marginBottom: '4px' }}>{t(doc)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedSchemeDetail.exclusionCriteria.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--brand-primary)', marginBottom: '8px' }}>{t('Exclusions')}</h3>
                    <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {selectedSchemeDetail.exclusionCriteria.map((ex) => (
                        <li key={ex} style={{ marginBottom: '4px' }}>{t(ex)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  {selectedSchemeDetail.applicationPortalUrl && (
                    <a
                      href={selectedSchemeDetail.applicationPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn primary"
                    >
                      {t('Visit Official Portal')}
                      <ExternalLink size={15} style={{ marginLeft: '6px' }} />
                    </a>
                  )}
                  <button type="button" className="btn" id="btn-close-scheme-dialog" onClick={() => setSelectedSchemeDetail(null)}>
                    {t('Close')}
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RecommendationCardProps {
  item: RecommendationItem;
  onStartService: (serviceId: Service) => void;
  onOpenScheme: (schemeId: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function RecommendationCard({ item, onStartService, onOpenScheme, t }: RecommendationCardProps) {
  return (
    <article className={'panel recommendation-item-card ' + item.confidence}>
      <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <span className="service-category">{t(item.categoryLabel)}</span>
        <span className={confidenceBadgeClass(item.confidence)}>
          {t(confidenceLabelKey(item.confidence))}
        </span>
      </div>

      <h3 className="card-item-title" style={{ fontFamily: 'var(--heading-font)', color: 'var(--brand-primary)', fontSize: '1.18rem', margin: '4px 0 6px 0' }}>
        {t(item.title)}
      </h3>

      <p className="card-dept-meta" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
        <strong>{t('Department')}:</strong> {t(item.department)}
      </p>

      <p className="card-desc" style={{ fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
        {t(item.description)}
      </p>

      {/* Why This Was Recommended */}
      <div className="rec-reasons-box" style={{ background: 'var(--page-background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px' }}>
        <strong style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--brand-secondary-strong)', marginBottom: '6px' }}>
          <Sparkles size={13} style={{ display: 'inline', marginRight: '5px' }} />
          {t('Why this was recommended')}:
        </strong>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text)' }}>
          {item.matchReasons.map((reason, idx) => (
            <li key={idx} style={{ marginBottom: '3px' }}>{t(reason)}</li>
          ))}
          {item.districtNote && (
            <li style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
              {item.districtNoteTemplate
                ? t(item.districtNoteTemplate, item.districtNoteParams)
                : t(item.districtNote)}
            </li>
          )}
        </ul>
      </div>

      {/* Card Actions */}
      <div className="card-action-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
        <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
          {item.itemType === 'service'
            ? t('In-app GovSync application with automated document verification.')
            : t('Official government portal application.')}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          {item.itemType === 'service' && item.serviceId && (
            <button
              type="button"
              className="btn primary small"
              onClick={() => onStartService(item.serviceId!)}
            >
              {t('Start Application in GovSync')}
              <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </button>
          )}

          {item.itemType === 'scheme' && item.schemeId && (
            <>
              <button
                type="button"
                className="btn small btn-scheme-details"
                id={`btn-details-${item.schemeId}`}
                onClick={() => onOpenScheme(item.schemeId!)}
              >
                {t('View Scheme Details')}
              </button>
              {item.externalUrl && (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn primary small"
                >
                  {t('Visit Official Portal')}
                  <ExternalLink size={13} style={{ marginLeft: '4px' }} />
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default ServiceRecommendations;
