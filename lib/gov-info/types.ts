export type GovernmentLevel = 'central' | 'state' | 'joint';

export type VerificationStatus =
  | 'verified'
  | 'partially_verified'
  | 'verification_required'
  | 'outdated';

export type AuthorityRole =
  | 'scheme_department'
  | 'implementing_agency'
  | 'certificate_issuer'
  | 'identity_authenticator'
  | 'data_provider'
  | 'document_platform';

export interface OfficialAuthority {
  id: string;
  name: string;
  shortName: string;
  level: GovernmentLevel;
  jurisdiction: string;
  role: AuthorityRole;
  officialWebsite: string;
  notes?: string;
}

export interface OfficialSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedOrUpdatedDate?: string;
  lastCheckedDate: string; // YYYY-MM-DD
  notes?: string;
}

export type SchemeCategory =
  | 'education'
  | 'agriculture'
  | 'employment'
  | 'women_child'
  | 'social_welfare'
  | 'pension'
  | 'health'
  | 'housing';

export type DeadlineType =
  | 'no_fixed_deadline'
  | 'rolling'
  | 'annual_cycle'
  | 'fixed_date'
  | 'deadline_not_verified';

export interface SchemeDeadline {
  type: DeadlineType;
  label: string;
  date?: string; // YYYY-MM-DD when fixed_date
}

export type CriterionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'bool'
  | 'income_lte'
  | 'manual';

export type IncomeBracketId =
  | 'up_to_21000'
  | '21001_to_50000'
  | '50001_to_180000'
  | '180001_to_250000'
  | '250001_to_800000'
  | 'above_800000';

export type GenderOption = 'female' | 'male' | 'transgender_other';

export type SocialCategoryOption = 'general_ews' | 'sc' | 'st' | 'obc_vjnt_sbc';

export type OccupationOption =
  | 'student'
  | 'farmer'
  | 'entrepreneur'
  | 'salaried_other'
  | 'homemaker_unemployed';

export type EducationLevelOption =
  | 'post_matric'
  | 'class_8_to_10'
  | 'below_class_8';

export type AreaTypeOption = 'rural' | 'urban';

export type RationCardOption = 'yellow_aay_bpl' | 'orange' | 'white' | 'none';

export type HousingStatusOption = 'houseless_or_kutcha' | 'pucca';

export type QuestionnaireField =
  | 'stateOfResidence'
  | 'district'
  | 'age'
  | 'gender'
  | 'areaType'
  | 'occupation'
  | 'isFarmerWithLand'
  | 'educationLevel'
  | 'socialCategory'
  | 'hasDisability'
  | 'incomeBracket'
  | 'rationCardType'
  | 'isIncomeTaxPayer'
  | 'housingStatus';

export interface QuestionnaireAnswers {
  stateOfResidence?: 'maharashtra' | 'other';
  district?: string;
  age?: number;
  gender?: GenderOption;
  areaType?: AreaTypeOption;
  occupation?: OccupationOption;
  isFarmerWithLand?: boolean;
  educationLevel?: EducationLevelOption;
  socialCategory?: SocialCategoryOption;
  hasDisability?: boolean;
  incomeBracket?: IncomeBracketId;
  rationCardType?: RationCardOption;
  isIncomeTaxPayer?: boolean;
  housingStatus?: HousingStatusOption;
}

export interface EligibilityCriterion {
  id: string;
  label: string;
  field?: QuestionnaireField;
  operator: CriterionOperator;
  expectedValue?: string | number | boolean | readonly (string | number | boolean)[];
  /**
   * Optional alternative condition where meeting EITHER the primary condition OR
   * this alternate condition satisfies the criterion (e.g., income <= ₹21,000 OR BPL card).
   */
  orField?: QuestionnaireField;
  orOperator?: Exclude<CriterionOperator, 'manual'>;
  orExpectedValue?: string | number | boolean | readonly (string | number | boolean)[];
  /**
   * Optional threshold override when a specific condition applies
   * (e.g., PwD income ceiling ₹50,000 under Sanjay Gandhi Niradhar Yojana).
   */
  conditionalIncomeOverride?: {
    whenField: QuestionnaireField;
    whenEquals: string | number | boolean;
    maxIncome: number;
  };
  strict: boolean;
  autoEvaluated: boolean;
  explanation: string;
  sourceId: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  localizedName?: {
    hi?: string;
    mr?: string;
  };
  category: SchemeCategory;
  level: GovernmentLevel;
  jurisdiction: string;
  departmentId: string;
  implementingAgencyId?: string;
  shortDescription: string;
  detailedDescription: string;
  benefits: readonly string[];
  benefitSummary: string;
  eligibilityCriteria: readonly EligibilityCriterion[];
  exclusionCriteria: readonly string[];
  requiredDocuments: readonly string[];
  applicationProcess: readonly string[];
  applicationPortalUrl: string | null;
  applicationPortalLabel: string;
  sourceIds: readonly string[];
  sourcePublicationDate?: string;
  lastVerifiedDate: string; // YYYY-MM-DD
  verificationStatus: VerificationStatus;
  caveats: readonly string[];
  deadline: SchemeDeadline;
  keywords: readonly string[];
}

export type MatchStatus =
  | 'likely_eligible'
  | 'needs_info'
  | 'not_eligible'
  | 'not_evaluated';

export type CriterionOutcome =
  | 'matched'
  | 'failed'
  | 'missing'
  | 'manual_verification';

export interface CriterionEvaluation {
  criterion: EligibilityCriterion;
  outcome: CriterionOutcome;
  reason: string;
}

export interface SchemeMatchResult {
  scheme: GovernmentScheme;
  status: MatchStatus;
  matchedCriteria: CriterionEvaluation[];
  failedCriteria: CriterionEvaluation[];
  missingAnswers: CriterionEvaluation[];
  manualVerificationCriteria: CriterionEvaluation[];
  explanation: string;
  sources: OfficialSource[];
}
