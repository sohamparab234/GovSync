'use client';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  HandHeart,
  HeartPulse,
  HelpCircle,
  Home,
  Info,
  Landmark,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from './i18n';
import { getAuthority } from '@/lib/gov-info/authorities';
import {
  governmentSchemes,
  maharashtraDistricts,
  schemeCategoryMeta,
} from '@/lib/gov-info/schemes';
import {
  INCOME_BRACKET_RANGES,
  evaluateAllSchemes,
  hasAnyQuestionnaireAnswer,
} from '@/lib/gov-info/scheme-matcher';
import { isTrustedOfficialUrl } from '@/lib/gov-info/sources';
import type {
  AreaTypeOption,
  EducationLevelOption,
  GenderOption,
  GovernmentLevel,
  HousingStatusOption,
  IncomeBracketId,
  MatchStatus,
  OccupationOption,
  QuestionnaireAnswers,
  RationCardOption,
  SchemeCategory,
  SchemeMatchResult,
  SocialCategoryOption,
  VerificationStatus,
} from '@/lib/gov-info/types';

const categoryIcons: Record<
  SchemeCategory,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  education: GraduationCap,
  agriculture: Sprout,
  employment: Briefcase,
  women_child: Users,
  social_welfare: HandHeart,
  pension: Landmark,
  health: HeartPulse,
  housing: Home,
};

const levelLabels: Record<GovernmentLevel, string> = {
  state: 'Maharashtra State',
  central: 'Central Government',
  joint: 'Joint (Central + State)',
};

const verificationLabels: Record<VerificationStatus, string> = {
  verified: 'Verified',
  partially_verified: 'Partially verified',
  verification_required: 'Verification required',
  outdated: 'Outdated',
};

const matchStatusLabels: Record<MatchStatus, string> = {
  likely_eligible: 'Likely eligible',
  needs_info: 'Needs more information',
  not_eligible: 'Not eligible',
  not_evaluated: 'Not evaluated',
};

function verificationTone(status: VerificationStatus): string {
  if (status === 'verified') return 'green';
  if (status === 'partially_verified') return 'orange';
  if (status === 'outdated') return 'red';
  return 'neutral';
}

function matchTone(status: MatchStatus): string {
  if (status === 'likely_eligible') return 'green';
  if (status === 'needs_info') return 'orange';
  if (status === 'not_eligible') return 'red';
  return 'neutral';
}

export interface SchemeFinderProps {
  mode?: 'public' | 'citizen';
}

export default function SchemeFinder({ mode = 'public' }: SchemeFinderProps) {
  const { language, t, n, date } = useLanguage();

  // Strictly ephemeral session-only component state — never persisted anywhere.
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Search and filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SchemeCategory>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | GovernmentLevel>('all');
  const [selectedVerification, setSelectedVerification] = useState<'all' | VerificationStatus>('all');
  const [selectedMatchFilter, setSelectedMatchFilter] = useState<'all' | MatchStatus>('all');

  // Active scheme for detail modal
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);

  const hasAnswers = hasAnyQuestionnaireAnswer(answers);

  const evaluatedResults = useMemo(
    () => evaluateAllSchemes(governmentSchemes, answers),
    [answers]
  );

  const summaryCounts = useMemo(() => {
    let likely = 0;
    let needsInfo = 0;
    let notEligible = 0;
    for (const r of evaluatedResults) {
      if (r.status === 'likely_eligible') likely += 1;
      else if (r.status === 'needs_info') needsInfo += 1;
      else if (r.status === 'not_eligible') notEligible += 1;
    }
    return { likely, needsInfo, notEligible };
  }, [evaluatedResults]);

  const filteredResults = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return evaluatedResults.filter(({ scheme, status }) => {
      if (selectedCategory !== 'all' && scheme.category !== selectedCategory) return false;
      if (selectedLevel !== 'all' && scheme.level !== selectedLevel) return false;
      if (selectedVerification !== 'all' && scheme.verificationStatus !== selectedVerification) {
        return false;
      }
      if (hasAnswers && selectedMatchFilter !== 'all' && status !== selectedMatchFilter) {
        return false;
      }
      if (!needle) return true;
      const dept = getAuthority(scheme.departmentId);
      const searchable = [
        scheme.name,
        t(scheme.name),
        scheme.localizedName?.hi || '',
        scheme.localizedName?.mr || '',
        scheme.shortDescription,
        t(scheme.shortDescription),
        scheme.detailedDescription,
        dept?.name || '',
        dept ? t(dept.name) : '',
        dept?.shortName || '',
        schemeCategoryMeta[scheme.category].label,
        t(schemeCategoryMeta[scheme.category].label),
        ...scheme.keywords,
      ]
        .join(' ')
        .toLocaleLowerCase();
      return searchable.includes(needle);
    });
  }, [
    evaluatedResults,
    search,
    selectedCategory,
    selectedLevel,
    selectedVerification,
    selectedMatchFilter,
    hasAnswers,
    t,
  ]);

  const activeDetail: SchemeMatchResult | null = useMemo(() => {
    if (!selectedSchemeId) return null;
    return evaluatedResults.find((r) => r.scheme.id === selectedSchemeId) || null;
  }, [evaluatedResults, selectedSchemeId]);

  function getDisplaySchemeName(scheme: SchemeMatchResult['scheme']): string {
    if (language === 'hi' && scheme.localizedName?.hi) return scheme.localizedName.hi;
    if (language === 'mr' && scheme.localizedName?.mr) return scheme.localizedName.mr;
    return t(scheme.name);
  }

  function updateAnswer<K extends keyof QuestionnaireAnswers>(
    field: K,
    val: QuestionnaireAnswers[K] | undefined
  ) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (val === undefined) {
        delete next[field];
      } else {
        next[field] = val;
      }
      if (field === 'stateOfResidence' && val !== 'maharashtra') {
        delete next.district;
      }
      if (field === 'occupation' && val !== 'farmer') {
        delete next.isFarmerWithLand;
      }
      if (field === 'occupation' && val !== 'student') {
        delete next.educationLevel;
      }
      return next;
    });
  }

  function clearAnswers() {
    setAnswers({});
    setStep(1);
    setSelectedMatchFilter('all');
  }

  function resetAllFilters() {
    setSearch('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedVerification('all');
    setSelectedMatchFilter('all');
  }

  function openQuestionnaire() {
    setQuestionnaireOpen(true);
    setTimeout(() => {
      document.getElementById('scheme-questionnaire')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  function scrollToCatalogue() {
    document.getElementById('scheme-catalogue')?.scrollIntoView({ behavior: 'smooth' });
  }

  const answeredCount = Object.values(answers).filter(
    (v) => v !== undefined && v !== '' && v !== null
  ).length;

  return (
    <div className="scheme-finder-root">
      {/* A. HERO SECTION */}
      <section className="dashboard-hero scheme-hero" aria-labelledby="scheme-finder-title">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">
            {t(
              mode === 'public'
                ? 'Maharashtra & Central Government Information'
                : 'Public utility scheme discovery'
            )}
          </p>
          <h1 id="scheme-finder-title">{t('Government Scheme Finder')}</h1>
          <p>
            {t(
              'Discover verified Maharashtra State and Central Government welfare schemes, review benefits and required documents, and check indicative eligibility without signing in.'
            )}
          </p>
          <form
            className="dashboard-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              scrollToCatalogue();
            }}
          >
            <Search size={20} aria-hidden="true" />
            <input
              aria-label={t('Search government schemes')}
              placeholder={t('Search by scheme name, department, or keyword...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn primary" type="submit">
              {t('Search')}
            </button>
          </form>
          <div className="hero-actions">
            <button
              type="button"
              className="btn primary"
              onClick={openQuestionnaire}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              {t(hasAnswers ? 'Edit Eligibility Answers' : 'Check My Eligibility')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={scrollToCatalogue}
            >
              {t('Explore Schemes')}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="note warn section-gap" role="note">
            <Info size={18} aria-hidden="true" />
            <div>
              <strong>{t('Indicative eligibility guidance only')}</strong>
              <p className="subtext">
                {t(
                  'Results help you discover schemes and check stated criteria. GovSync does not submit government scheme applications or grant official approval. Always verify final rules on the official portal.'
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="dashboard-art" aria-hidden="true" />
      </section>

      {/* B. MULTI-STEP SESSION-ONLY ELIGIBILITY QUESTIONNAIRE */}
      {questionnaireOpen && (
        <section
          id="scheme-questionnaire"
          className="panel section-gap"
          aria-labelledby="questionnaire-title"
        >
          <div className="panel-head">
            <div>
              <p className="panel-kicker">{t('Session-only eligibility check')}</p>
              <h2 id="questionnaire-title">{t('Answer a few questions to match schemes')}</h2>
              <p className="subtext">
                {t('Step {step} of {total}', { step, total: 3 })}
                {answeredCount > 0
                  ? ' · ' + t('{count} answered', { count: answeredCount })
                  : ''}
              </p>
            </div>
            <div className="scheme-head-actions">
              {hasAnswers && (
                <button
                  type="button"
                  className="btn small"
                  onClick={clearAnswers}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  {t('Clear answers')}
                </button>
              )}
              <button
                type="button"
                className="btn small"
                onClick={() => setQuestionnaireOpen(false)}
              >
                {t('Hide questionnaire')}
              </button>
            </div>
          </div>

          <div className="panel-body">
            {/* Privacy Guarantee Banner */}
            <div className="note" role="status">
              <ShieldCheck size={19} aria-hidden="true" />
              <div>
                <strong>{t('Privacy guarantee — nothing is stored')}</strong>
                <p className="subtext">
                  {t(
                    'Your answers are processed temporarily in your browser memory only. They are never saved to a database, browser storage, cookies, URL, or server, and no account is required.'
                  )}
                </p>
              </div>
            </div>

            <Progress
              aria-label={t('Questionnaire progress')}
              value={(step / 3) * 100}
            />

            {/* Step switcher buttons for easy back-and-edit */}
            <div className="steps scheme-steps" role="tablist" aria-label={t('Questionnaire steps')}>
              {([
                [1, 'Residence & Profile'],
                [2, 'Occupation & Category'],
                [3, 'Income & Household'],
              ] as const).map(([num, label]) => (
                <button
                  key={num}
                  type="button"
                  role="tab"
                  aria-selected={step === num}
                  className={
                    'step scheme-step-btn ' +
                    (step === num ? 'active' : step > num ? 'done' : '')
                  }
                  onClick={() => setStep(num)}
                >
                  <span className="step-num">{n(num)}</span>
                  <span>{t(label)}</span>
                </button>
              ))}
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <div className="fields section-gap">
                <div className="field">
                  <label className="form-label" htmlFor="q-state">
                    {t('State of residence')}
                  </label>
                  <Select
                    value={answers.stateOfResidence ?? '__unset__'}
                    onValueChange={(v) =>
                      updateAnswer(
                        'stateOfResidence',
                        v === '__unset__' ? undefined : (v as 'maharashtra' | 'other')
                      )
                    }
                  >
                    <SelectTrigger id="q-state" className="choice">
                      <SelectValue placeholder={t('Select state')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Skip / Not selected')}</SelectItem>
                      <SelectItem value="maharashtra">{t('Maharashtra')}</SelectItem>
                      <SelectItem value="other">{t('Other Indian State / UT')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {answers.stateOfResidence === 'maharashtra' && (
                  <div className="field">
                    <label className="form-label" htmlFor="q-district">
                      {t('District in Maharashtra (optional)')}
                    </label>
                    <Select
                      value={answers.district ?? '__unset__'}
                      onValueChange={(v) =>
                        updateAnswer('district', v === '__unset__' ? undefined : v)
                      }
                    >
                      <SelectTrigger id="q-district" className="choice">
                        <SelectValue placeholder={t('Select district')} />
                      </SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        <SelectItem value="__unset__">{t('Skip / Not selected')}</SelectItem>
                        {maharashtraDistricts.map((d) => (
                          <SelectItem key={d} value={d}>
                            {t(d)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="field">
                  <label className="form-label" htmlFor="q-age">
                    {t('Age (completed years, optional)')}
                  </label>
                  <input
                    id="q-age"
                    type="number"
                    min={0}
                    max={120}
                    inputMode="numeric"
                    aria-describedby="q-age-help"
                    placeholder={t('e.g. 24')}
                    value={answers.age === undefined ? '' : String(answers.age)}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw) {
                        updateAnswer('age', undefined);
                        return;
                      }
                      const parsed = Number(raw);
                      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 120) {
                        updateAnswer('age', Math.floor(parsed));
                      }
                    }}
                  />
                  <small id="q-age-help">{t('Used only to check scheme age thresholds (such as 18+, 21–65, or 65+).')}</small>
                </div>

                <div className="field">
                  <label className="form-label" htmlFor="q-gender">
                    {t('Gender (optional)')}
                  </label>
                  <Select
                    value={answers.gender ?? '__unset__'}
                    onValueChange={(v) =>
                      updateAnswer(
                        'gender',
                        v === '__unset__' ? undefined : (v as GenderOption)
                      )
                    }
                  >
                    <SelectTrigger id="q-gender" className="choice">
                      <SelectValue placeholder={t('Select option')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Prefer not to say')}</SelectItem>
                      <SelectItem value="female">{t('Female')}</SelectItem>
                      <SelectItem value="male">{t('Male')}</SelectItem>
                      <SelectItem value="transgender_other">{t('Transgender / Other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="field">
                  <label className="form-label" htmlFor="q-area">
                    {t('Area of residence (Rural / Urban)')}
                  </label>
                  <Select
                    value={answers.areaType ?? '__unset__'}
                    onValueChange={(v) =>
                      updateAnswer(
                        'areaType',
                        v === '__unset__' ? undefined : (v as AreaTypeOption)
                      )
                    }
                  >
                    <SelectTrigger id="q-area" className="choice">
                      <SelectValue placeholder={t('Select area')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Skip / Not selected')}</SelectItem>
                      <SelectItem value="rural">{t('Rural (Gram Panchayat)')}</SelectItem>
                      <SelectItem value="urban">{t('Urban (Municipal Council / Corporation)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="fields section-gap">
                <div className="field">
                  <label className="form-label" htmlFor="q-occupation">
                    {t('Primary occupation / status')}
                  </label>
                  <Select
                    value={answers.occupation ?? '__unset__'}
                    onValueChange={(v) =>
                      updateAnswer(
                        'occupation',
                        v === '__unset__' ? undefined : (v as OccupationOption)
                      )
                    }
                  >
                    <SelectTrigger id="q-occupation" className="choice">
                      <SelectValue placeholder={t('Select occupation')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Skip / Not selected')}</SelectItem>
                      <SelectItem value="student">{t('Student')}</SelectItem>
                      <SelectItem value="farmer">{t('Farmer / Cultivator')}</SelectItem>
                      <SelectItem value="entrepreneur">{t('Aspiring Entrepreneur / Self-Employed')}</SelectItem>
                      <SelectItem value="salaried_other">{t('Salaried / Worker / Other')}</SelectItem>
                      <SelectItem value="homemaker_unemployed">{t('Homemaker / Unemployed / Seeking Support')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {answers.occupation === 'student' && (
                  <div className="field">
                    <label className="form-label" htmlFor="q-education">
                      {t('Current education level')}
                    </label>
                    <Select
                      value={answers.educationLevel ?? '__unset__'}
                      onValueChange={(v) =>
                        updateAnswer(
                          'educationLevel',
                          v === '__unset__' ? undefined : (v as EducationLevelOption)
                        )
                      }
                    >
                      <SelectTrigger id="q-education" className="choice">
                        <SelectValue placeholder={t('Select education level')} />
                      </SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        <SelectItem value="__unset__">{t('Skip / Not selected')}</SelectItem>
                        <SelectItem value="post_matric">{t('Post-Matric (Class 11–12 / Diploma / UG / PG)')}</SelectItem>
                        <SelectItem value="class_8_to_10">{t('Class 8 to Class 10')}</SelectItem>
                        <SelectItem value="below_class_8">{t('Below Class 8')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(answers.occupation === 'farmer' || answers.isFarmerWithLand !== undefined) && (
                  <div className="field">
                    <label className="form-label" htmlFor="q-farmer-land">
                      {t('Does your family own cultivable agricultural land (7/12 record)?')}
                    </label>
                    <Select
                      value={
                        answers.isFarmerWithLand === undefined
                          ? '__unset__'
                          : answers.isFarmerWithLand
                          ? 'yes'
                          : 'no'
                      }
                      onValueChange={(v) =>
                        updateAnswer(
                          'isFarmerWithLand',
                          v === '__unset__' ? undefined : v === 'yes'
                        )
                      }
                    >
                      <SelectTrigger id="q-farmer-land" className="choice">
                        <SelectValue placeholder={t('Select option')} />
                      </SelectTrigger>
                      <SelectContent className="citizen-select-content">
                        <SelectItem value="__unset__">{t('Not sure / Skip')}</SelectItem>
                        <SelectItem value="yes">{t('Yes')}</SelectItem>
                        <SelectItem value="no">{t('No')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="field">
                  <label className="form-label" htmlFor="q-category">
                    {t('Social category (only where legally relevant for scholarships/subsidies)')}
                  </label>
                  <Select
                    value={answers.socialCategory ?? '__unset__'}
                    onValueChange={(v) =>
                      updateAnswer(
                        'socialCategory',
                        v === '__unset__' ? undefined : (v as SocialCategoryOption)
                      )
                    }
                  >
                    <SelectTrigger id="q-category" className="choice">
                      <SelectValue placeholder={t('Select category')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Prefer not to say')}</SelectItem>
                      <SelectItem value="general_ews">{t('General / EWS')}</SelectItem>
                      <SelectItem value="sc">{t('Scheduled Caste (SC) / Navbouddha')}</SelectItem>
                      <SelectItem value="st">{t('Scheduled Tribe (ST)')}</SelectItem>
                      <SelectItem value="obc_vjnt_sbc">{t('OBC / VJNT / SBC')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="field">
                  <label className="form-label" htmlFor="q-disability">
                    {t('Person with Disability (UDID / 40%+ certified)?')}
                  </label>
                  <Select
                    value={
                      answers.hasDisability === undefined
                        ? '__unset__'
                        : answers.hasDisability
                        ? 'yes'
                        : 'no'
                    }
                    onValueChange={(v) =>
                      updateAnswer(
                        'hasDisability',
                        v === '__unset__' ? undefined : v === 'yes'
                      )
                    }
                  >
                    <SelectTrigger id="q-disability" className="choice">
                      <SelectValue placeholder={t('Select option')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Prefer not to say')}</SelectItem>
                      <SelectItem value="yes">{t('Yes')}</SelectItem>
                      <SelectItem value="no">{t('No')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="fields section-gap">
                <div className="field">
                  <label className="form-label" htmlFor="q-income">
                    {t('Broad annual family income range')}
                  </label>
                  <Select
                    value={answers.incomeBracket ?? '__unset__'}
                    onValueChange={(v) =>
                      updateAnswer(
                        'incomeBracket',
                        v === '__unset__' ? undefined : (v as IncomeBracketId)
                      )
                    }
                  >
                    <SelectTrigger id="q-income" className="choice">
                      <SelectValue placeholder={t('Select income range')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Prefer not to say')}</SelectItem>
                      {(Object.keys(INCOME_BRACKET_RANGES) as IncomeBracketId[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(INCOME_BRACKET_RANGES[key].label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="field">
                  <label className="form-label" htmlFor="q-ration">
                    {t('Ration Card / BPL status')}
                  </label>
                  <Select
                    value={answers.rationCardType ?? '__unset__'}
                    onValueChange={(v) =>
                      updateAnswer(
                        'rationCardType',
                        v === '__unset__' ? undefined : (v as RationCardOption)
                      )
                    }
                  >
                    <SelectTrigger id="q-ration" className="choice">
                      <SelectValue placeholder={t('Select ration card type')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Prefer not to say')}</SelectItem>
                      <SelectItem value="yellow_aay_bpl">{t('Yellow / Antyodaya (AAY) / BPL')}</SelectItem>
                      <SelectItem value="orange">{t('Orange Ration Card')}</SelectItem>
                      <SelectItem value="white">{t('White Ration Card')}</SelectItem>
                      <SelectItem value="none">{t('None / Not sure')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="field">
                  <label className="form-label" htmlFor="q-tax">
                    {t('Does anyone in your household pay Income Tax?')}
                  </label>
                  <Select
                    value={
                      answers.isIncomeTaxPayer === undefined
                        ? '__unset__'
                        : answers.isIncomeTaxPayer
                        ? 'yes'
                        : 'no'
                    }
                    onValueChange={(v) =>
                      updateAnswer(
                        'isIncomeTaxPayer',
                        v === '__unset__' ? undefined : v === 'yes'
                      )
                    }
                  >
                    <SelectTrigger id="q-tax" className="choice">
                      <SelectValue placeholder={t('Select option')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Not sure / Skip')}</SelectItem>
                      <SelectItem value="no">{t('No')}</SelectItem>
                      <SelectItem value="yes">{t('Yes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="field">
                  <label className="form-label" htmlFor="q-housing">
                    {t('Current household housing status')}
                  </label>
                  <Select
                    value={answers.housingStatus ?? '__unset__'}
                    onValueChange={(v) =>
                      updateAnswer(
                        'housingStatus',
                        v === '__unset__' ? undefined : (v as HousingStatusOption)
                      )
                    }
                  >
                    <SelectTrigger id="q-housing" className="choice">
                      <SelectValue placeholder={t('Select housing status')} />
                    </SelectTrigger>
                    <SelectContent className="citizen-select-content">
                      <SelectItem value="__unset__">{t('Prefer not to say')}</SelectItem>
                      <SelectItem value="houseless_or_kutcha">{t('Houseless or Kutcha house (0–2 rooms)')}</SelectItem>
                      <SelectItem value="pucca">{t('Pucca (permanent) house')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="actions">
              <div className="scheme-step-nav">
                {step > 1 && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    {t('Previous')}
                  </button>
                )}
                {hasAnswers && (
                  <button type="button" className="btn" onClick={clearAnswers}>
                    <RotateCcw size={16} aria-hidden="true" />
                    {t('Reset questionnaire')}
                  </button>
                )}
              </div>

              {step < 3 ? (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))}
                >
                  {t('Next')}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn primary"
                  onClick={scrollToCatalogue}
                >
                  {t('View Matching Schemes')}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* C. RESULTS SUMMARY BANNER WHEN QUESTIONNAIRE IS ACTIVE */}
      {hasAnswers && (
        <section className="section-gap" aria-label={t('Eligibility match summary')}>
          <div className="section-heading">
            <div>
              <h2>{t('Your indicative eligibility summary')}</h2>
              <p className="subtext">
                {t('Schemes are ordered by Likely eligible, Needs more information, then Not eligible.')}
              </p>
            </div>
            <div className="scheme-head-actions">
              <button
                type="button"
                className="btn small"
                onClick={openQuestionnaire}
              >
                {t('Edit answers')}
              </button>
              <button
                type="button"
                className="btn small"
                onClick={clearAnswers}
              >
                <RotateCcw size={15} aria-hidden="true" />
                {t('Clear answers')}
              </button>
            </div>
          </div>
          <div className="stats scheme-summary-stats">
            <button
              type="button"
              className={
                'panel stat scheme-stat-btn ' +
                (selectedMatchFilter === 'likely_eligible' ? 'active' : '')
              }
              onClick={() =>
                setSelectedMatchFilter((cur) =>
                  cur === 'likely_eligible' ? 'all' : 'likely_eligible'
                )
              }
            >
              <span>{t('Likely eligible')}</span>
              <div className="number">{n(summaryCounts.likely)}</div>
            </button>
            <button
              type="button"
              className={
                'panel stat scheme-stat-btn ' +
                (selectedMatchFilter === 'needs_info' ? 'active' : '')
              }
              onClick={() =>
                setSelectedMatchFilter((cur) =>
                  cur === 'needs_info' ? 'all' : 'needs_info'
                )
              }
            >
              <span>{t('Needs more information')}</span>
              <div className="number">{n(summaryCounts.needsInfo)}</div>
            </button>
            <button
              type="button"
              className={
                'panel stat scheme-stat-btn ' +
                (selectedMatchFilter === 'not_eligible' ? 'active' : '')
              }
              onClick={() =>
                setSelectedMatchFilter((cur) =>
                  cur === 'not_eligible' ? 'all' : 'not_eligible'
                )
              }
            >
              <span>{t('Not eligible')}</span>
              <div className="number">{n(summaryCounts.notEligible)}</div>
            </button>
          </div>
        </section>
      )}

      {/* D. CATEGORY BROWSING + FILTERS + CATALOGUE */}
      <section
        id="scheme-catalogue"
        className="service-section"
        aria-labelledby="catalogue-heading"
      >
        <div className="section-heading">
          <div>
            <h2 id="catalogue-heading">
              {t(hasAnswers ? 'Matched government schemes' : 'Explore government schemes')}
            </h2>
            <p className="subtext">
              {t('Curated Maharashtra State and Central Government schemes verified against official portals.')}
            </p>
          </div>
          <span aria-live="polite" role="status">
            {t('{count} schemes shown', { count: filteredResults.length })}
          </span>
        </div>

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onValueChange={(v) => setSelectedCategory(v as 'all' | SchemeCategory)}
        >
          <TabsList className="tab-list">
            <TabsTrigger className="tab-trigger" value="all">
              {t('All categories')}
            </TabsTrigger>
            {(Object.keys(schemeCategoryMeta) as SchemeCategory[]).map((cat) => (
              <TabsTrigger className="tab-trigger" key={cat} value={cat}>
                {t(schemeCategoryMeta[cat].label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Secondary Filter Toolbar */}
        <div className="panel scheme-filter-bar">
          <div className="review-toolbar">
            <input
              aria-label={t('Filter schemes by keyword')}
              placeholder={t('Filter by name, department, or keyword...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label={t('Filter by government level')}
              value={selectedLevel}
              onChange={(e) =>
                setSelectedLevel(e.target.value as 'all' | GovernmentLevel)
              }
            >
              <option value="all">{t('All government levels')}</option>
              <option value="state">{t('Maharashtra State')}</option>
              <option value="central">{t('Central Government')}</option>
              <option value="joint">{t('Joint (Central + State)')}</option>
            </select>
            <select
              aria-label={t('Filter by verification status')}
              value={selectedVerification}
              onChange={(e) =>
                setSelectedVerification(
                  e.target.value as 'all' | VerificationStatus
                )
              }
            >
              <option value="all">{t('All verification statuses')}</option>
              <option value="verified">{t('Verified')}</option>
              <option value="partially_verified">{t('Partially verified')}</option>
              <option value="verification_required">{t('Verification required')}</option>
            </select>
            {hasAnswers && (
              <select
                aria-label={t('Filter by eligibility result')}
                value={selectedMatchFilter}
                onChange={(e) =>
                  setSelectedMatchFilter(e.target.value as 'all' | MatchStatus)
                }
              >
                <option value="all">{t('All match results')}</option>
                <option value="likely_eligible">{t('Likely eligible')}</option>
                <option value="needs_info">{t('Needs more information')}</option>
                <option value="not_eligible">{t('Not eligible')}</option>
              </select>
            )}
            {(search ||
              selectedCategory !== 'all' ||
              selectedLevel !== 'all' ||
              selectedVerification !== 'all' ||
              selectedMatchFilter !== 'all') && (
              <button
                type="button"
                className="btn small"
                onClick={resetAllFilters}
              >
                {t('Reset filters')}
              </button>
            )}
          </div>
        </div>

        {/* Scheme Cards Grid */}
        {filteredResults.length > 0 ? (
          <div className="service-grid section-gap">
            {filteredResults.map((result) => {
              const { scheme, status } = result;
              const Icon = categoryIcons[scheme.category] || Landmark;
              const dept = getAuthority(scheme.departmentId);
              const safePortal =
                scheme.applicationPortalUrl &&
                isTrustedOfficialUrl(scheme.applicationPortalUrl)
                  ? scheme.applicationPortalUrl
                  : null;

              return (
                <article className="panel service-card scheme-card" key={scheme.id}>
                  <div className="scheme-card-header">
                    <div className="service-card-top">
                      <Icon size={22} aria-hidden="true" />
                      <span className="service-category">
                        {t(schemeCategoryMeta[scheme.category].label)}
                      </span>
                    </div>
                    <div className="scheme-badges">
                      <span className="badge neutral">{t(levelLabels[scheme.level])}</span>
                      <span className={'badge ' + verificationTone(scheme.verificationStatus)}>
                        {t(verificationLabels[scheme.verificationStatus])}
                      </span>
                    </div>
                  </div>

                  <h3>{getDisplaySchemeName(scheme)}</h3>
                  <p className="scheme-dept-line">
                    <Building2 size={14} aria-hidden="true" />
                    <span>{dept ? t(dept.shortName) : scheme.departmentId}</span>
                  </p>
                  <p>{t(scheme.shortDescription)}</p>

                  <div className="scheme-benefit-box">
                    <strong>{t('Key benefit')}:</strong>{' '}
                    <span>{t(scheme.benefitSummary)}</span>
                  </div>

                  {scheme.verificationStatus !== 'verified' && (
                    <div className="scheme-partial-warn" role="note">
                      <AlertTriangle size={14} aria-hidden="true" />
                      <span>
                        {t(
                          scheme.caveats[0] ||
                            'Some scheme rules or enrollment dates require direct confirmation on the official portal.'
                        )}
                      </span>
                    </div>
                  )}

                  {/* Transparent Match Status Breakdown when questionnaire is active */}
                  {hasAnswers && (
                    <div className="scheme-match-summary">
                      <div className="scheme-match-top">
                        <span className={'badge ' + matchTone(status)}>
                          {t(matchStatusLabels[status])}
                        </span>
                        <small>{t(result.explanation)}</small>
                      </div>
                      <div className="scheme-match-counts">
                        {result.matchedCriteria.length > 0 && (
                          <span className="match-pill good">
                            <CheckCircle2 size={14} aria-hidden="true" />
                            {t('{count} matched', { count: result.matchedCriteria.length })}
                          </span>
                        )}
                        {result.failedCriteria.length > 0 && (
                          <span className="match-pill bad">
                            <XCircle size={14} aria-hidden="true" />
                            {t('{count} not matched', { count: result.failedCriteria.length })}
                          </span>
                        )}
                        {result.missingAnswers.length > 0 && (
                          <span className="match-pill warn">
                            <HelpCircle size={14} aria-hidden="true" />
                            {t('{count} missing details', { count: result.missingAnswers.length })}
                          </span>
                        )}
                        {result.manualVerificationCriteria.length > 0 && (
                          <span className="match-pill neutral">
                            <AlertTriangle size={14} aria-hidden="true" />
                            {t('{count} manual check', {
                              count: result.manualVerificationCriteria.length,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="scheme-meta-strip">
                    <span>
                      <Calendar size={13} aria-hidden="true" />{' '}
                      {t('Last verified')}: {date(scheme.lastVerifiedDate)}
                    </span>
                  </div>

                  <div className="service-card-bottom">
                    <button
                      type="button"
                      className="btn small primary"
                      onClick={() => setSelectedSchemeId(scheme.id)}
                    >
                      <ClipboardList size={15} aria-hidden="true" />
                      {t('View Details')}
                    </button>
                    {safePortal ? (
                      <a
                        className="text-link"
                        href={safePortal}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('Official Portal')}
                        <span className="sr-only"> ({t('opens in a new tab')})</span>
                        <ExternalLink size={15} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="subtext">{t('Official portal link unavailable')}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="panel empty section-gap">
            <h3>{t('No matching government schemes found')}</h3>
            <p>
              {t(
                'Try clearing your search keyword or adjusting category, government level, or verification filters.'
              )}
            </p>
            <button
              type="button"
              className="btn section-gap"
              onClick={resetAllFilters}
            >
              {t('Show all schemes')}
            </button>
          </div>
        )}
      </section>

      {/* E. ACCESSIBLE SCHEME DETAIL DIALOG */}
      <Dialog
        open={Boolean(activeDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedSchemeId(null);
        }}
      >
        <DialogContent className="scheme-dialog-content">
          {activeDetail && (() => {
            const { scheme, status } = activeDetail;
            const dept = getAuthority(scheme.departmentId);
            const agency = scheme.implementingAgencyId
              ? getAuthority(scheme.implementingAgencyId)
              : null;
            const safePortal =
              scheme.applicationPortalUrl &&
              isTrustedOfficialUrl(scheme.applicationPortalUrl)
                ? scheme.applicationPortalUrl
                : null;

            return (
              <>
                <DialogHeader>
                  <div className="scheme-badges">
                    <span className="service-category">
                      {t(schemeCategoryMeta[scheme.category].label)}
                    </span>
                    <span className="badge neutral">{t(levelLabels[scheme.level])}</span>
                    <span className={'badge ' + verificationTone(scheme.verificationStatus)}>
                      {t(verificationLabels[scheme.verificationStatus])}
                    </span>
                    {hasAnswers && (
                      <span className={'badge ' + matchTone(status)}>
                        {t(matchStatusLabels[status])}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="scheme-dialog-title">
                    {getDisplaySchemeName(scheme)}
                  </DialogTitle>
                  <DialogDescription className="scheme-dialog-desc">
                    {t(scheme.detailedDescription)}
                  </DialogDescription>
                </DialogHeader>

                <div className="scheme-detail-body">
                  {/* Department & Verification Metadata */}
                  <div className="receipt scheme-detail-meta">
                    <p>
                      <strong>{t('Responsible department')}:</strong>{' '}
                      {dept ? t(dept.name) : scheme.departmentId}
                    </p>
                    {agency && (
                      <p>
                        <strong>{t('Implementing agency')}:</strong> {t(agency.name)}
                      </p>
                    )}
                    <p>
                      <strong>{t('Jurisdiction')}:</strong> {t(scheme.jurisdiction)}
                    </p>
                    <p>
                      <strong>{t('Application window')}:</strong> {t(scheme.deadline.label)}
                    </p>
                    <p>
                      <strong>{t('Last verified')}:</strong> {date(scheme.lastVerifiedDate)} ·{' '}
                      <strong>{t('Verification status')}:</strong>{' '}
                      {t(verificationLabels[scheme.verificationStatus])}
                    </p>
                  </div>

                  {/* Eligibility Breakdown */}
                  <div className="scheme-detail-section">
                    <h3>{t('Eligibility criteria')}</h3>
                    {hasAnswers && (
                      <p className="subtext">{t(activeDetail.explanation)}</p>
                    )}
                    <div className="rules">
                      {[
                        ...activeDetail.matchedCriteria,
                        ...activeDetail.failedCriteria,
                        ...activeDetail.missingAnswers,
                        ...activeDetail.manualVerificationCriteria,
                      ].map((ev) => (
                        <div className="rule-row" key={ev.criterion.id}>
                          {ev.outcome === 'matched' ? (
                            <CheckCircle2 size={18} color="var(--success)" aria-hidden="true" />
                          ) : ev.outcome === 'failed' ? (
                            <XCircle size={18} color="var(--danger)" aria-hidden="true" />
                          ) : ev.outcome === 'missing' ? (
                            <HelpCircle size={18} color="var(--warning)" aria-hidden="true" />
                          ) : (
                            <AlertTriangle size={18} color="var(--warning)" aria-hidden="true" />
                          )}
                          <div>
                            <span>{t(ev.criterion.label)}</span>
                            <small>
                              <strong>
                                {t(
                                  ev.outcome === 'matched'
                                    ? 'Matched'
                                    : ev.outcome === 'failed'
                                    ? 'Does not match'
                                    : ev.outcome === 'missing'
                                    ? 'Needs your answer'
                                    : 'Manual verification required'
                                )}
                                :
                              </strong>{' '}
                              {t(ev.reason)}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="scheme-detail-section">
                    <h3>{t('Benefits')}</h3>
                    <ul className="scheme-detail-list">
                      {scheme.benefits.map((b) => (
                        <li key={b}>{t(b)}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Exclusions */}
                  {scheme.exclusionCriteria.length > 0 && (
                    <div className="scheme-detail-section">
                      <h3>{t('Exclusions (who is not eligible)')}</h3>
                      <ul className="scheme-detail-list">
                        {scheme.exclusionCriteria.map((ex) => (
                          <li key={ex}>{t(ex)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Required Documents */}
                  <div className="scheme-detail-section">
                    <h3>
                      <FileText size={16} aria-hidden="true" /> {t('Required documents')}
                    </h3>
                    <ul className="scheme-detail-list">
                      {scheme.requiredDocuments.map((doc) => (
                        <li key={doc}>{t(doc)}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Application Process */}
                  <div className="scheme-detail-section">
                    <h3>{t('How to apply officially')}</h3>
                    <ol className="help-steps">
                      {scheme.applicationProcess.map((stepText) => (
                        <li key={stepText}>{t(stepText)}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Caveats */}
                  {scheme.caveats.length > 0 && (
                    <div className="note warn">
                      <AlertTriangle size={18} aria-hidden="true" />
                      <div>
                        <strong>{t('Important caveats')}</strong>
                        <ul className="scheme-detail-list">
                          {scheme.caveats.map((cav) => (
                            <li key={cav}>{t(cav)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Official Sources & Portal CTA */}
                  <div className="scheme-detail-section">
                    <h3>{t('Official government sources')}</h3>
                    <ul className="scheme-source-list">
                      {activeDetail.sources
                        .filter((src) => isTrustedOfficialUrl(src.url))
                        .map((src) => (
                          <li key={src.id}>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-link"
                            >
                              {t(src.title)}
                              <span className="sr-only"> ({t('opens in a new tab')})</span>
                              <ExternalLink size={14} aria-hidden="true" />
                            </a>
                            <small>
                              {t(src.publisher)} · {t('Checked')}: {date(src.lastCheckedDate)}
                            </small>
                            {src.notes && <small>{t(src.notes)}</small>}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="actions scheme-detail-actions">
                    {safePortal ? (
                      <a
                        className="btn primary"
                        href={safePortal}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t(scheme.applicationPortalLabel)}
                        <span className="sr-only"> ({t('opens in a new tab')})</span>
                        <ExternalLink size={16} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="note warn">
                        {t(
                          'Official online application link could not be verified. Check with your local government office.'
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setSelectedSchemeId(null)}
                    >
                      {t('Close')}
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
