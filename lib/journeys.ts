import type { Service } from './services.ts';
import type { ApplicationRecord } from './types.ts';

export type JourneyId =
  | 'journey:education-scholarship'
  | 'journey:senior-pension'
  | 'journey:food-health-security'
  | 'journey:women-welfare'
  | 'journey:agriculture-welfare';

export type JourneyDomain = 'education' | 'social_welfare' | 'health_pds' | 'women' | 'agriculture';

export type PrerequisiteStatus =
  | 'completed'
  | 'in_progress'
  | 'action_required'
  | 'not_started'
  | 'not_applicable'
  | 'unverified_dependency';

export type DependencyType = 'mandatory' | 'conditional' | 'recommended' | 'unverified';

export type ConditionApplicability = 'applies' | 'does_not_apply' | 'unknown';

export interface PrerequisiteEvidence {
  sourceTitle: string;
  officialUrl: string;
  requirementSupported: string;
  classification: DependencyType;
  appliesWhen: string;
  verificationStatus: 'verified_official' | 'unverified';
  relevantClause?: string;
}

export interface EvaluationContext {
  applications?: ApplicationRecord[];
  citizenCategory?: 'general' | 'ews' | 'sc' | 'st' | 'obc' | 'vjnt' | 'sbc';
  hasRationCard?: boolean;
  rationCardCategory?: 'yellow' | 'orange' | 'white' | 'none';
  farmerType?: 'small_marginal' | 'large' | 'medium';
  gender?: 'female' | 'male' | 'other';
  selectedSchemeId?: string;
  customConditions?: Record<string, ConditionApplicability>;
}

export interface PrerequisiteDefinition {
  id: string; // canonical ID, e.g. "service:residence" or "external_document:land_records"
  title: string;
  itemType: 'service' | 'scheme' | 'external_document';
  serviceId?: Service;
  schemeId?: string;
  isMandatory: boolean;
  dependencyType: DependencyType;
  conditionId?: string;
  conditionNote?: string;
  evidence: PrerequisiteEvidence;
  sourceDepartment: string;
  statutoryBasis: string;
  isVerifiedPrerequisite: boolean;
  dataReuseBenefit: string;
}

export interface JourneyStepDefinition {
  id: string; // e.g. "service:residence", "service:scholarship", "scheme:mh-rcsm-ebc-scholarship"
  title: string;
  itemType: 'service' | 'scheme' | 'external_document';
  serviceId?: Service;
  schemeId?: string;
  categoryLabel: string;
  department: string;
  order: number;
  isMandatory: boolean;
  dependencyType?: DependencyType;
  conditionId?: string;
  conditionNote?: string;
  evidence?: PrerequisiteEvidence;
  dependsOn: string[]; // step IDs that must be completed before this step
  prerequisites: PrerequisiteDefinition[];
  description: string;
  externalUrl?: string;
}

export interface MultiServiceJourneyDefinition {
  id: JourneyId;
  title: string;
  domain: JourneyDomain;
  targetOutcome: string;
  summary: string;
  statutoryCitation: string;
  steps: JourneyStepDefinition[];
}

export interface EvaluatedPrerequisite extends PrerequisiteDefinition {
  status: PrerequisiteStatus;
  statusLabel: string;
  applicationId?: string;
  applicationStatus?: string;
  conditionApplicability: ConditionApplicability;
  conditionApplicabilityReason: string;
  isBlocking: boolean;
  actionType: 'start_service' | 'view_certificate' | 'track_timeline' | 'respond_clarification' | 'external_link' | 'none';
}

export interface EvaluatedJourneyStep extends JourneyStepDefinition {
  status: PrerequisiteStatus;
  statusLabel: string;
  application?: ApplicationRecord;
  evaluatedPrerequisites: EvaluatedPrerequisite[];
  isBlocked: boolean;
  blockingStepIds: string[];
  blockingStepTitles: string[];
  blockingReasons: string[];
  availableAction: {
    type: 'start_service' | 'view_certificate' | 'track_timeline' | 'respond_clarification' | 'external_link' | 'none';
    label: string;
    serviceId?: Service;
    schemeId?: string;
    applicationId?: string;
    externalUrl?: string;
  };
}

export interface EvaluatedJourney {
  definition: MultiServiceJourneyDefinition;
  steps: EvaluatedJourneyStep[];
  totalRequirements: number;
  completedRequirements: number;
  inProgressRequirements: number;
  actionRequiredRequirements: number;
  remainingPrerequisites: number;
  progressPercent: number; // integer 0-100
  isFullyCompleted: boolean;
  hasBlockingPrerequisites: boolean;
  associatedApplicationIds: string[];
}

// ---------------------------------------------------------------------------
// Canonical Verified Journeys Catalogue
// Grounded strictly in existing Maharashtra and Central Government frameworks
// ---------------------------------------------------------------------------

export const JOURNEYS_CATALOGUE: readonly MultiServiceJourneyDefinition[] = [
  {
    id: 'journey:education-scholarship',
    title: 'Higher Education & Student Support Journey',
    domain: 'education',
    targetOutcome: 'Full college fee reimbursement, academic merit verification, and monthly student DBT disbursement.',
    summary:
      'Connects the foundational revenue certificates required under Maharashtra Higher & Technical Education rules to unlock Post-Matric Scholarships and Rajarshi Shahu Maharaj fee concessions.',
    statutoryCitation: 'Government of Maharashtra GR No. EBC-2016/C.R.221/Edu-1 and MahaDBT Guidelines 2024.',
    steps: [
      {
        id: 'service:residence',
        title: 'Certificate of Residence / Domicile',
        itemType: 'service',
        serviceId: 'residence',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 1,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: [],
        prerequisites: [],
        description: 'Statutory proof of minimum 15 years domicile in Maharashtra. Required for all state quota educational benefits.',
        evidence: {
          sourceTitle: 'Government of Maharashtra Revenue & Forest Department Domicile Protocol 1976 & MahaDBT Norms',
          officialUrl: 'https://mahadbt.maharashtra.gov.in',
          requirementSupported: 'Statutory proof of 15 years domicile in Maharashtra required for state quota scholarship disbursements.',
          classification: 'mandatory',
          appliesWhen: 'Universally required for all state quota scholarships and fee concession schemes.',
          verificationStatus: 'verified_official',
          relevantClause: 'MahaDBT Scrutiny Norms 2024, Clause 1.2',
        },
      },
      {
        id: 'service:income-certificate',
        title: 'Income Certificate',
        itemType: 'service',
        serviceId: 'income-certificate',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 2,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: ['service:residence'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Maharashtra Revenue Sub-Division Circular 1976',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Domicile verification confirms revenue jurisdiction for income assessment.',
            evidence: {
              sourceTitle: 'Maharashtra Revenue Sub-Division Circular 1976',
              officialUrl: 'https://mahabhumi.gov.in',
              requirementSupported: 'Local tehsil jurisdiction establishment.',
              classification: 'mandatory',
              appliesWhen: 'Required for revenue assessment jurisdiction.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Certifies annual family income (up to ₹8 Lakh for EBC, ₹2.5 Lakh for SC/ST) issued by the competent Tehsildar.',
        evidence: {
          sourceTitle: 'Higher & Technical Education Department GR No. EBC-2016/C.R.221/Edu-1',
          officialUrl: 'https://mahadbt.maharashtra.gov.in',
          requirementSupported: 'Annual family income verification to determine eligibility for fee reimbursement and post-matric scholarship.',
          classification: 'mandatory',
          appliesWhen: 'Required for all need-based fee reimbursement and social welfare scholarships.',
          verificationStatus: 'verified_official',
          relevantClause: 'GR EBC-2016/C.R.221/Edu-1 Clause 2.4',
        },
      },
      {
        id: 'service:caste-certificate',
        title: 'Caste / Community Certificate',
        itemType: 'service',
        serviceId: 'caste-certificate',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 3,
        isMandatory: false,
        dependencyType: 'conditional',
        conditionId: 'education:reserved_category',
        conditionNote: 'Required only for SC, ST, OBC, VJNT, and SBC category students seeking reserved quota scholarships. General and EWS category students do not require a caste certificate.',
        dependsOn: ['service:residence'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Maharashtra Scheduled Castes Regulation of Issuance Act 2000',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Domicile proof satisfies jurisdictional inquiry for caste scrutiny.',
            evidence: {
              sourceTitle: 'Maharashtra Scheduled Castes Regulation of Issuance Act 2000 (Act XXIII of 2001)',
              officialUrl: 'https://sjsa.maharashtra.gov.in',
              requirementSupported: 'Territorial jurisdiction for caste scrutiny committee.',
              classification: 'mandatory',
              appliesWhen: 'Required for revenue caste verification.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Required for SC, ST, OBC, VJNT, and SBC category students seeking reserved quota scholarships. General and EWS students do not require a caste certificate.',
        evidence: {
          sourceTitle: 'Maharashtra Act No. XXIII of 2001 (Caste Certificate & Scrutiny Act)',
          officialUrl: 'https://sjsa.maharashtra.gov.in',
          requirementSupported: 'Official community certificate for reserved quota post-matric benefits.',
          classification: 'conditional',
          appliesWhen: 'Required only for SC/ST/OBC/VJNT/SBC category scholarship schemes; not required for EBC scheme or General/EWS students.',
          verificationStatus: 'verified_official',
          relevantClause: 'Section 3 & 4',
        },
      },
      {
        id: 'service:scholarship',
        title: 'Post-Matric Scholarship Application',
        itemType: 'service',
        serviceId: 'scholarship',
        categoryLabel: 'Education',
        department: 'Higher & Technical Education Department, Government of Maharashtra',
        order: 4,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: ['service:residence', 'service:income-certificate', 'service:caste-certificate'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'MahaDBT Mandatory Scrutiny Norms',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Approved domicile data automatically populates the residency section without re-submission.',
            evidence: {
              sourceTitle: 'MahaDBT Scrutiny Norms 2024',
              officialUrl: 'https://mahadbt.maharashtra.gov.in',
              requirementSupported: 'State resident status verification.',
              classification: 'mandatory',
              appliesWhen: 'All scholarship applicants.',
              verificationStatus: 'verified_official',
            },
          },
          {
            id: 'service:income-certificate',
            title: 'Income Certificate',
            itemType: 'service',
            serviceId: 'income-certificate',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'MahaDBT Annual Income Verification Protocol',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Verified annual family income record validates fee reimbursement slab automatically.',
            evidence: {
              sourceTitle: 'MahaDBT Income Protocol',
              officialUrl: 'https://mahadbt.maharashtra.gov.in',
              requirementSupported: 'Income limit verification.',
              classification: 'mandatory',
              appliesWhen: 'Need-based scholarships.',
              verificationStatus: 'verified_official',
            },
          },
          {
            id: 'service:caste-certificate',
            title: 'Caste / Community Certificate',
            itemType: 'service',
            serviceId: 'caste-certificate',
            isMandatory: false,
            dependencyType: 'conditional',
            conditionId: 'education:reserved_category',
            conditionNote: 'Required only for SC, ST, OBC, VJNT, and SBC category students seeking reserved quota scholarships. General and EWS category students do not require a caste certificate.',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Social Justice & Special Assistance Department GR 2018',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Caste validity number is attached to qualifying category records.',
            evidence: {
              sourceTitle: 'Social Justice & Special Assistance Department GR 2018',
              officialUrl: 'https://sjsa.maharashtra.gov.in',
              requirementSupported: 'Reserved quota fee waiver.',
              classification: 'conditional',
              appliesWhen: 'Only for reserved category applicants.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Complete digital scholarship intake in GovSync with automated cross-departmental academic and income validation.',
        evidence: {
          sourceTitle: 'MahaDBT Post-Matric Scholarship Guidelines',
          officialUrl: 'https://mahadbt.maharashtra.gov.in',
          requirementSupported: 'Post-matric scholarship processing.',
          classification: 'mandatory',
          appliesWhen: 'All enrolled higher education students in approved colleges.',
          verificationStatus: 'verified_official',
        },
      },
      {
        id: 'scheme:mh-rcsm-ebc-scholarship',
        title: 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavritti Scheme (EBC)',
        itemType: 'scheme',
        schemeId: 'mh-rcsm-ebc-scholarship',
        categoryLabel: 'Education',
        department: 'Higher & Technical Education Department (MahaDBT)',
        order: 5,
        isMandatory: false,
        dependencyType: 'recommended',
        dependsOn: ['service:residence', 'service:income-certificate'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'MahaDBT EBC Guideline Clause 2.1',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Requires certified domicile in Maharashtra or approved border villages.',
            evidence: {
              sourceTitle: 'MahaDBT EBC Guideline Clause 2.1',
              officialUrl: 'https://mahadbt.maharashtra.gov.in',
              requirementSupported: 'State domicile for EBC benefit.',
              classification: 'mandatory',
              appliesWhen: 'All EBC applicants.',
              verificationStatus: 'verified_official',
            },
          },
          {
            id: 'service:income-certificate',
            title: 'Annual Family Income Certificate',
            itemType: 'service',
            serviceId: 'income-certificate',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'MahaDBT EBC Guideline Clause 2.4',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Validates income threshold below ₹8,00,000 ceiling.',
            evidence: {
              sourceTitle: 'MahaDBT EBC Guideline Clause 2.4',
              officialUrl: 'https://mahadbt.maharashtra.gov.in',
              requirementSupported: 'Family income <= ₹8 Lakh.',
              classification: 'mandatory',
              appliesWhen: 'All EBC applicants.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: '50% to 100% tuition and exam fee reimbursement for General/EWS students admitted to approved degree courses. Requires Domicile and Income; Caste Certificate is NOT required.',
        externalUrl: 'https://mahadbt.maharashtra.gov.in',
        evidence: {
          sourceTitle: 'Higher & Technical Education Department GR No. EBC-2016/C.R.221/Edu-1',
          officialUrl: 'https://mahadbt.maharashtra.gov.in',
          requirementSupported: 'Tuition and exam fee reimbursement for General and EWS students.',
          classification: 'recommended',
          appliesWhen: 'Open to General and EWS students. Caste certificate is NOT required.',
          verificationStatus: 'verified_official',
          relevantClause: 'GR No. EBC-2016/C.R.221/Edu-1, Clause 1 & 2',
        },
      },
    ],
  },
  {
    id: 'journey:senior-pension',
    title: 'Senior Citizen Social Security & Pension Journey',
    domain: 'social_welfare',
    targetOutcome: 'Monthly direct benefit transfer of ₹1,500 state social security pension for eligible senior citizens.',
    summary:
      'Guides senior citizens through the prerequisite revenue certificates needed to access the Maharashtra Shravanbal Seva and Sanjay Gandhi Niradhar social welfare pensions.',
    statutoryCitation: 'Social Justice & Special Assistance Department, Maharashtra State Pension Rules 2019.',
    steps: [
      {
        id: 'service:residence',
        title: 'Certificate of Residence / Domicile',
        itemType: 'service',
        serviceId: 'residence',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 1,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: [],
        prerequisites: [],
        description: 'Statutory proof of 15 years continuous residence in Maharashtra required for state pension eligibility.',
        evidence: {
          sourceTitle: 'Social Justice & Special Assistance Department GR No. PEN-2019/C.R.44',
          officialUrl: 'https://sjsa.maharashtra.gov.in',
          requirementSupported: 'Proof of minimum 15 years continuous residence in Maharashtra state.',
          classification: 'mandatory',
          appliesWhen: 'Mandatory for all state social security pensions.',
          verificationStatus: 'verified_official',
          relevantClause: 'GR PEN-2019/C.R.44, Rule 3.1',
        },
      },
      {
        id: 'service:income-certificate',
        title: 'Income Certificate',
        itemType: 'service',
        serviceId: 'income-certificate',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 2,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: ['service:residence'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Tehsildar Revenue Jurisdiction Protocol',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Establishes local tehsil jurisdiction for economic means testing.',
            evidence: {
              sourceTitle: 'Tehsildar Revenue Jurisdiction Protocol',
              officialUrl: 'https://mahabhumi.gov.in',
              requirementSupported: 'Tehsil economic means testing jurisdiction.',
              classification: 'mandatory',
              appliesWhen: 'All income applicants.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Certified income certificate verifying annual family income is within BPL or ₹21,000 threshold.',
        evidence: {
          sourceTitle: 'Social Justice & Special Assistance Department Means Testing Protocol',
          officialUrl: 'https://sjsa.maharashtra.gov.in',
          requirementSupported: 'Verified family income below ₹21,000 per annum for Category B non-BPL applicants.',
          classification: 'mandatory',
          appliesWhen: 'Mandatory to establish economic eligibility unless already enrolled in national BPL list.',
          verificationStatus: 'verified_official',
          relevantClause: 'GR PEN-2019/C.R.44, Rule 3.3',
        },
      },
      {
        id: 'service:pension',
        title: 'Old Age Pension Application',
        itemType: 'service',
        serviceId: 'pension',
        categoryLabel: 'Social Welfare',
        department: 'Social Justice & Special Assistance Department, Government of Maharashtra',
        order: 3,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: ['service:residence', 'service:income-certificate'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Social Justice Dept GR No. PEN-2019/C.R.44',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Validates 15-year residency requirement for state pension approval.',
            evidence: {
              sourceTitle: 'Social Justice Dept GR No. PEN-2019/C.R.44',
              officialUrl: 'https://sjsa.maharashtra.gov.in',
              requirementSupported: '15-year state residence check.',
              classification: 'mandatory',
              appliesWhen: 'Pension applicants.',
              verificationStatus: 'verified_official',
            },
          },
          {
            id: 'service:income-certificate',
            title: 'Income Certificate',
            itemType: 'service',
            serviceId: 'income-certificate',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Social Justice Dept Means Test Rules',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Ensures economic destitution or BPL criterion is verified without document resubmission.',
            evidence: {
              sourceTitle: 'Social Justice Dept Means Test Rules',
              officialUrl: 'https://sjsa.maharashtra.gov.in',
              requirementSupported: 'Economic destitution verification.',
              classification: 'mandatory',
              appliesWhen: 'Pension applicants.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Direct GovSync digital pension application with automated revenue and identity record checking.',
        evidence: {
          sourceTitle: 'Maharashtra Social Security Pension Scheme Direct Intake Norms',
          officialUrl: 'https://sjsa.maharashtra.gov.in',
          requirementSupported: 'Direct digital application processing for state social assistance pension.',
          classification: 'mandatory',
          appliesWhen: 'Required in-app service step.',
          verificationStatus: 'verified_official',
        },
      },
      {
        id: 'scheme:mh-shravanbal-pension',
        title: 'Shravanbal Seva State Pension Scheme',
        itemType: 'scheme',
        schemeId: 'mh-shravanbal-pension',
        categoryLabel: 'Pension',
        department: 'Social Justice & Special Assistance Department, Government of Maharashtra',
        order: 4,
        isMandatory: false,
        dependencyType: 'recommended',
        dependsOn: ['service:residence', 'service:income-certificate'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Shravanbal Scheme Guidelines Clause 3.1',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Mandatory 15 years domicile in Maharashtra.',
            evidence: {
              sourceTitle: 'Shravanbal Scheme Guidelines Clause 3.1',
              officialUrl: 'https://sjsa.maharashtra.gov.in',
              requirementSupported: '15-year domicile.',
              classification: 'mandatory',
              appliesWhen: 'All Shravanbal applicants.',
              verificationStatus: 'verified_official',
            },
          },
          {
            id: 'service:income-certificate',
            title: 'Annual Family Income Certificate',
            itemType: 'service',
            serviceId: 'income-certificate',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Shravanbal Scheme Guidelines Clause 3.3',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Proves family income within ₹21,000 per annum for Category B applicants.',
            evidence: {
              sourceTitle: 'Shravanbal Scheme Guidelines Clause 3.3',
              officialUrl: 'https://sjsa.maharashtra.gov.in',
              requirementSupported: 'Income within ₹21,000 ceiling.',
              classification: 'mandatory',
              appliesWhen: 'Non-BPL Category B applicants.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'State financial assistance of ₹1,500 per month deposited directly into Aadhaar-linked bank accounts of seniors aged 65+.',
        externalUrl: 'https://sjsa.maharashtra.gov.in',
        evidence: {
          sourceTitle: 'Shravanbal Seva State Pension Scheme Guidelines',
          officialUrl: 'https://sjsa.maharashtra.gov.in',
          requirementSupported: 'Monthly direct benefit transfer of ₹1,500 for destitute senior citizens aged 65 and above.',
          classification: 'recommended',
          appliesWhen: 'Destination pension scheme.',
          verificationStatus: 'verified_official',
          relevantClause: 'Social Justice Dept Pension Resolution 2019',
        },
      },
    ],
  },
  {
    id: 'journey:food-health-security',
    title: 'Household Food & Cashless Healthcare Journey',
    domain: 'health_pds',
    targetOutcome: 'Subsidized household food grains under NFSA and ₹5 Lakh annual cashless healthcare coverage under MJPJAY.',
    summary:
      'Coordinates the issuance of a verified digital ration card and connects it directly to Maharashtra Ayushman Bharat - MJPJAY cashless medical hospital benefits.',
    statutoryCitation: 'National Food Security Act 2013 and State Health Assurance Society (SHAS) Resolution 2023.',
    steps: [
      {
        id: 'service:residence',
        title: 'Certificate of Residence / Domicile',
        itemType: 'service',
        serviceId: 'residence',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 1,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: [],
        prerequisites: [],
        description: 'Establishes official household residence and fair price shop allocation territory.',
        evidence: {
          sourceTitle: 'National Food Security Act (NFSA) 2013 & Maharashtra PDS Order',
          officialUrl: 'https://mahafood.gov.in',
          requirementSupported: 'Establishes domestic residence and fair price shop allocation zone.',
          classification: 'mandatory',
          appliesWhen: 'Mandatory for new household ration card issuance.',
          verificationStatus: 'verified_official',
          relevantClause: 'NFSA 2013 Section 10',
        },
      },
      {
        id: 'service:income-certificate',
        title: 'Income Certificate',
        itemType: 'service',
        serviceId: 'income-certificate',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 2,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: ['service:residence'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'PDS Household Assessment Protocol',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Confirms local revenue address for card category determination.',
            evidence: {
              sourceTitle: 'PDS Household Assessment Protocol',
              officialUrl: 'https://mahafood.gov.in',
              requirementSupported: 'Local fair price shop allocation.',
              classification: 'mandatory',
              appliesWhen: 'All PDS applicants.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Determines whether the household qualifies for Antyodaya (AAY) or Priority Household (PHH) food grain subsidies.',
        evidence: {
          sourceTitle: 'Targeted Public Distribution System Order 2015 & Maharashtra Food Dept Norms',
          officialUrl: 'https://mahafood.gov.in',
          requirementSupported: 'Determines household economic classification for Yellow (BPL) or Orange (AAY/PHH) ration card.',
          classification: 'mandatory',
          appliesWhen: 'Mandatory for subsidized food grain card assignment.',
          verificationStatus: 'verified_official',
          relevantClause: 'TPDS Order 2015 Clause 3',
        },
      },
      {
        id: 'service:ration-card',
        title: 'Ration Card (PDS Security) Application',
        itemType: 'service',
        serviceId: 'ration-card',
        categoryLabel: 'Public Distribution',
        department: 'Food, Civil Supplies and Consumer Protection Department, Government of Maharashtra',
        order: 3,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: ['service:residence', 'service:income-certificate'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'NFSA Beneficiary Selection Rules',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Verified address links fair price shop allocation without physical inspection delays.',
            evidence: {
              sourceTitle: 'NFSA Beneficiary Selection Rules',
              officialUrl: 'https://mahafood.gov.in',
              requirementSupported: 'Fair price shop linkage.',
              classification: 'mandatory',
              appliesWhen: 'All ration card applicants.',
              verificationStatus: 'verified_official',
            },
          },
          {
            id: 'service:income-certificate',
            title: 'Income Certificate',
            itemType: 'service',
            serviceId: 'income-certificate',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Targeted Public Distribution System Order 2015',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Sets card color category (Yellow/Orange) accurately.',
            evidence: {
              sourceTitle: 'TPDS Order 2015 Card Classification',
              officialUrl: 'https://mahafood.gov.in',
              requirementSupported: 'Card color categorization.',
              classification: 'mandatory',
              appliesWhen: 'Subsidized grain quota applicants.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Official digitized household ration card enabling subsidized grain quotas and serving as universal family welfare ID.',
        evidence: {
          sourceTitle: 'Food, Civil Supplies and Consumer Protection Department Digital Ration Card Protocol',
          officialUrl: 'https://mahafood.gov.in',
          requirementSupported: 'Digitized household ration card establishing food entitlement and family membership.',
          classification: 'mandatory',
          appliesWhen: 'Mandatory foundational document for household healthcare entitlement.',
          verificationStatus: 'verified_official',
        },
      },
      {
        id: 'scheme:mh-mjpjay-pmjay',
        title: 'Mahatma Jyotirao Phule Jan Arogya Yojana & AB-PMJAY',
        itemType: 'scheme',
        schemeId: 'mh-mjpjay-pmjay',
        categoryLabel: 'Healthcare',
        department: 'Public Health Department, Government of Maharashtra',
        order: 4,
        isMandatory: false,
        dependencyType: 'recommended',
        dependsOn: ['service:ration-card'],
        prerequisites: [
          {
            id: 'service:ration-card',
            title: 'Valid Maharashtra Ration Card',
            itemType: 'service',
            serviceId: 'ration-card',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Food, Civil Supplies Department',
            statutoryBasis: 'SHAS Health Assurance Identification Norms',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Ration card number functions as primary entitlement identifier at empanelled network hospitals.',
            evidence: {
              sourceTitle: 'SHAS Health Assurance Identification Norms',
              officialUrl: 'https://jeevandayee.gov.in',
              requirementSupported: 'Hospital cashless admission identification.',
              classification: 'mandatory',
              appliesWhen: 'Cashless hospital admission.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Universal cashless medical coverage up to ₹5,00,000 per family per year across 1,356 secondary and tertiary procedures.',
        externalUrl: 'https://jeevandayee.gov.in',
        evidence: {
          sourceTitle: 'State Health Assurance Society (SHAS) Resolution 2023 for Universal Healthcare Coverage',
          officialUrl: 'https://jeevandayee.gov.in',
          requirementSupported: 'Annual cashless secondary and tertiary hospital coverage up to ₹5,00,000 per family.',
          classification: 'recommended',
          appliesWhen: 'Destination health assurance scheme for valid ration card holders.',
          verificationStatus: 'verified_official',
          relevantClause: 'SHAS Resolution July 2023, Clause 2',
        },
      },
    ],
  },
  {
    id: 'journey:women-welfare',
    title: "Women's Economic Security & Welfare Journey",
    domain: 'women',
    targetOutcome: 'Monthly financial assistance of ₹1,500 under Mukhyamantri Majhi Ladki Bahin Yojana.',
    summary:
      'Streamlines the verification of domicile and income/ration credentials required for women applicants across Maharashtra to receive direct DBT transfers.',
    statutoryCitation: 'Women and Child Development Department GR No. MKB-2024/C.R.108/WCD-2.',
    steps: [
      {
        id: 'service:residence',
        title: 'Certificate of Residence / Domicile',
        itemType: 'service',
        serviceId: 'residence',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 1,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: [],
        prerequisites: [],
        description: 'Proof of permanent domicile in Maharashtra. Mandatory statutory condition for Majhi Ladki Bahin under Rule 3(b).',
        evidence: {
          sourceTitle: 'Government of Maharashtra Women and Child Development Department GR No. MKB-2024/C.R.108/WCD-2',
          officialUrl: 'https://ladakibahin.maharashtra.gov.in',
          requirementSupported: 'Statutory proof of permanent domicile/residence in Maharashtra state.',
          classification: 'mandatory',
          appliesWhen: 'Mandatory statutory eligibility condition for all applicants.',
          verificationStatus: 'verified_official',
          relevantClause: 'GR MKB-2024/C.R.108/WCD-2 Clause 3(b) / Condition 3.2',
        },
      },
      {
        id: 'service:income-certificate',
        title: 'Income Certificate (Exempt if Yellow/Orange Ration Card held)',
        itemType: 'service',
        serviceId: 'income-certificate',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 2,
        isMandatory: true,
        dependencyType: 'conditional',
        conditionId: 'women:income_means_test',
        conditionNote: 'Required unless the applicant family possesses a valid Yellow or Orange Ration Card under GR MKB-2024/C.R.108/WCD-2 Clause 3(e).',
        dependsOn: ['service:residence'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Revenue Means Verification Protocol',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Validates tehsil jurisdiction for applicant family income.',
            evidence: {
              sourceTitle: 'Revenue Means Verification Protocol',
              officialUrl: 'https://mahabhumi.gov.in',
              requirementSupported: 'Tehsil income verification jurisdiction.',
              classification: 'mandatory',
              appliesWhen: 'Income assessment.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Certifies annual family income does not exceed ₹2,50,000. Under GR No. MKB-2024/C.R.108/WCD-2 Clause 3(e), families holding a valid Yellow or Orange Ration Card are completely EXEMPT from providing an income certificate.',
        evidence: {
          sourceTitle: 'Government of Maharashtra Women and Child Development Department GR No. MKB-2024/C.R.108/WCD-2',
          officialUrl: 'https://ladakibahin.maharashtra.gov.in',
          requirementSupported: 'Verification of family income ceiling of ₹2.50 Lakh per annum.',
          classification: 'conditional',
          appliesWhen: 'Mandatory UNLESS the applicant family possesses a valid Yellow or Orange Ration Card (Clause 3(e)).',
          verificationStatus: 'verified_official',
          relevantClause: 'GR No. MKB-2024/C.R.108/WCD-2, Clause 3(e) / Eligibility Condition 3.5',
        },
      },
      {
        id: 'scheme:mh-ladki-bahin',
        title: 'Mukhyamantri Majhi Ladki Bahin Yojana',
        itemType: 'scheme',
        schemeId: 'mh-ladki-bahin',
        categoryLabel: 'Women & Child Development',
        department: 'Women and Child Development Department, Government of Maharashtra',
        order: 3,
        isMandatory: false,
        dependencyType: 'recommended',
        dependsOn: ['service:residence', 'service:income-certificate'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Ladki Bahin Rules Clause 3(b)',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Domicile verification satisfies the state resident requirement.',
            evidence: {
              sourceTitle: 'GR No. MKB-2024/C.R.108/WCD-2',
              officialUrl: 'https://ladakibahin.maharashtra.gov.in',
              requirementSupported: 'State resident domicile requirement.',
              classification: 'mandatory',
              appliesWhen: 'All applicants.',
              verificationStatus: 'verified_official',
              relevantClause: 'Clause 3(b)',
            },
          },
          {
            id: 'service:income-certificate',
            title: 'Income Certificate (or Yellow/Orange Ration Card)',
            itemType: 'service',
            serviceId: 'income-certificate',
            isMandatory: false,
            dependencyType: 'conditional',
            conditionId: 'women:income_means_test',
            conditionNote: 'Required only if family does not hold a Yellow or Orange Ration Card (GR MKB-2024/C.R.108/WCD-2 Clause 3(e)).',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Ladki Bahin Rules Clause 3(e)',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Verifies family income under ₹2.5 Lakh per annum.',
            evidence: {
              sourceTitle: 'GR No. MKB-2024/C.R.108/WCD-2',
              officialUrl: 'https://ladakibahin.maharashtra.gov.in',
              requirementSupported: 'Income means test or ration card waiver.',
              classification: 'conditional',
              appliesWhen: 'Required unless Yellow/Orange ration card is held.',
              verificationStatus: 'verified_official',
              relevantClause: 'Clause 3(e)',
            },
          },
        ],
        description: 'Direct financial transfer of ₹1,500 every month into the Aadhaar-linked bank account of eligible women aged 21-65.',
        externalUrl: 'https://ladakibahin.maharashtra.gov.in',
        evidence: {
          sourceTitle: 'Mukhyamantri Majhi Ladki Bahin Yojana Operational Directives 2024',
          officialUrl: 'https://ladakibahin.maharashtra.gov.in',
          requirementSupported: 'Direct benefit transfer of ₹1,500 per month into Aadhaar-seeded bank account for eligible women aged 21-65.',
          classification: 'recommended',
          appliesWhen: 'Destination welfare scheme.',
          verificationStatus: 'verified_official',
          relevantClause: 'GR No. MKB-2024/C.R.108/WCD-2 Clause 1',
        },
      },
    ],
  },
  {
    id: 'journey:agriculture-welfare',
    title: 'Agricultural Welfare & Farm Mechanization Journey',
    domain: 'agriculture',
    targetOutcome: 'Annual direct benefit of ₹6,000 cash subsidy and up to 50% capital subsidy on farm implements and tractors.',
    summary:
      'Coordinates agricultural land records, caste category certificates, and direct benefit registrations under PM-KISAN and MahaDBT SMAM Mechanization.',
    statutoryCitation: 'Department of Agriculture, GoI PM-KISAN Operational Guidelines and MahaDBT SMAM Norms 2024.',
    steps: [
      {
        id: 'service:residence',
        title: 'Certificate of Residence / Domicile',
        itemType: 'service',
        serviceId: 'residence',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 1,
        isMandatory: true,
        dependencyType: 'mandatory',
        dependsOn: [],
        prerequisites: [],
        description: 'Permanent domicile in Maharashtra required for state top-up agricultural matching subsidies and MahaDBT registration.',
        evidence: {
          sourceTitle: 'Government of Maharashtra Agriculture Department Directives for State Agricultural Subsidies',
          officialUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
          requirementSupported: 'State resident farmer proof required for state matching component under MahaDBT.',
          classification: 'mandatory',
          appliesWhen: 'Mandatory for state government top-up subsidy disbursements.',
          verificationStatus: 'verified_official',
          relevantClause: 'Maharashtra State Agriculture Schemes Operational Framework 2024',
        },
      },
      {
        id: 'external_document:land_records',
        title: 'Agricultural Land Records (7/12 & 8A Extract)',
        itemType: 'external_document',
        categoryLabel: 'Land Records',
        department: 'Revenue Department (Mahabhumi / MahaDBT)',
        order: 2,
        isMandatory: false,
        dependencyType: 'mandatory',
        dependsOn: [],
        prerequisites: [],
        description: 'Statutory RoR (Record of Rights: 7/12 & 8A Extract) proving cultivable landholding in Maharashtra.',
        evidence: {
          sourceTitle: 'Operational Guidelines of Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) & Mahabhumi Land Records',
          officialUrl: 'https://pmkisan.gov.in/Documents_New/Revised_Operational_Guidelines_09112020.pdf',
          requirementSupported: 'Statutory Record of Rights (RoR) proving cultivable landholding.',
          classification: 'mandatory',
          appliesWhen: 'Mandatory for all landholding farmers under PM-KISAN Clause 4 & SMAM.',
          verificationStatus: 'verified_official',
          relevantClause: 'PM-KISAN Guidelines Clause 4.1 & Clause 8.1; Mahabhumi RoR System',
        },
      },
      {
        id: 'service:caste-certificate',
        title: 'Caste / Community Certificate (for SC/ST Allocation)',
        itemType: 'service',
        serviceId: 'caste-certificate',
        categoryLabel: 'Certificates',
        department: 'Revenue & Forest Department, Government of Maharashtra',
        order: 3,
        isMandatory: false,
        dependencyType: 'conditional',
        conditionId: 'agriculture:sc_st_category',
        conditionNote: 'Relevant only for SC/ST category farmers seeking fund allocation under the Special Component Plan / Tribal Sub-Plan of SMAM. Under SMAM 2024 Guidelines, the 50% assistance rate applies to Small & Marginal farmers (<= 2 ha), Women farmers, SC/ST farmers, and beneficiaries in NE/Himalayan states. Small/marginal farmers qualify based on 7/12 land records and women farmers qualify based on gender/identity without a caste certificate. Other eligible farmers receive 40% assistance. A caste certificate is NEVER required for PM-KISAN.',
        dependsOn: ['service:residence'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'Revenue Verification Rules',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Validates caste authority territory.',
            evidence: {
              sourceTitle: 'Revenue Verification Rules',
              officialUrl: 'https://mahabhumi.gov.in',
              requirementSupported: 'Territorial authority validation.',
              classification: 'mandatory',
              appliesWhen: 'Certificate issuance.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Relevant for SC/ST farmers seeking allocation under SC/ST specific components. Small/marginal farmers and women farmers qualify for 50% subsidy without caste certification under SMAM 2024 Guidelines.',
        evidence: {
          sourceTitle: 'Operational Guidelines - Sub-Mission on Agricultural Mechanization (SMAM) (Revised 2024), Ministry of Agriculture & Farmers Welfare, GoI',
          officialUrl: 'https://agrimachinery.nic.in/Files/Guidelines/Guidelines_SMAM2024.pdf',
          requirementSupported: 'Category documentation for SC/ST Special Component allocation under SMAM.',
          classification: 'conditional',
          appliesWhen: 'Relevant ONLY for SC/ST farmers seeking allocation under SC/ST specific funds. Under SMAM 2024 Guidelines, the 50% assistance slab applies to Small & Marginal farmers (<= 2 ha landholding), Women farmers, SC/ST farmers, and beneficiaries in NE/Himalayan states. Small/marginal farmers qualify based on 7/12 land records and women farmers qualify based on gender/identity without a caste certificate. Other eligible farmers receive 40% assistance. A caste certificate is NEVER required for PM-KISAN.',
          verificationStatus: 'verified_official',
          relevantClause: 'SMAM Guidelines 2024, Annexure-II (Pattern of Financial Assistance)',
        },
      },
      {
        id: 'scheme:pm-kisan',
        title: 'PM-KISAN Samman Nidhi',
        itemType: 'scheme',
        schemeId: 'pm-kisan',
        categoryLabel: 'Agriculture',
        department: 'Ministry of Agriculture and Farmers Welfare, Government of India',
        order: 4,
        isMandatory: false,
        dependencyType: 'recommended',
        dependsOn: ['external_document:land_records'],
        prerequisites: [
          {
            id: 'external_document:land_records',
            title: '7/12 Extract Landholding Record',
            itemType: 'external_document',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue Department',
            statutoryBasis: 'PM-KISAN Scheme Guidelines Clause 4.1',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Proves land ownership in institutional revenue registers.',
            evidence: {
              sourceTitle: 'PM-KISAN Guidelines Clause 4.1',
              officialUrl: 'https://pmkisan.gov.in/Documents_New/Revised_Operational_Guidelines_09112020.pdf',
              requirementSupported: 'Land ownership record.',
              classification: 'mandatory',
              appliesWhen: 'All PM-KISAN applicants.',
              verificationStatus: 'verified_official',
            },
          },
        ],
        description: 'Income support of ₹6,000 per year in three installments of ₹2,000 into Aadhaar-seeded accounts. Open to all cultivable landholding farmer families. Category information is recorded for statistical reporting only; a caste certificate is NEVER required.',
        externalUrl: 'https://pmkisan.gov.in',
        evidence: {
          sourceTitle: 'Operational Guidelines of Pradhan Mantri Kisan Samman Nidhi (PM-KISAN), Department of Agriculture & Farmers Welfare, GoI',
          officialUrl: 'https://pmkisan.gov.in/Documents_New/Revised_Operational_Guidelines_09112020.pdf',
          requirementSupported: 'Direct income support of ₹6,000 annually to landholding farmer families.',
          classification: 'recommended',
          appliesWhen: 'Universal for all landholding farmers. Caste certificate is NEVER required.',
          verificationStatus: 'verified_official',
          relevantClause: 'Clause 4 (Beneficiary Definition) & Clause 8 (Documents Required)',
        },
      },
      {
        id: 'scheme:mh-smam-mechanization',
        title: 'Sub-Mission on Agricultural Mechanization (SMAM)',
        itemType: 'scheme',
        schemeId: 'mh-smam-mechanization',
        categoryLabel: 'Agriculture',
        department: 'Department of Agriculture, Government of Maharashtra',
        order: 5,
        isMandatory: false,
        dependencyType: 'recommended',
        dependsOn: ['service:residence', 'external_document:land_records', 'service:caste-certificate'],
        prerequisites: [
          {
            id: 'service:residence',
            title: 'Certificate of Residence / Domicile',
            itemType: 'service',
            serviceId: 'residence',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'SMAM Maharashtra Administrative Sanction 2024',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Ensures state matching grant allocation to state domicile holder.',
            evidence: {
              sourceTitle: 'SMAM Maharashtra Administrative Sanction 2024',
              officialUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
              requirementSupported: 'State domicile for subsidy matching.',
              classification: 'mandatory',
              appliesWhen: 'All SMAM state quota applicants.',
              verificationStatus: 'verified_official',
            },
          },
          {
            id: 'external_document:land_records',
            title: '7/12 and 8A Land Records',
            itemType: 'external_document',
            isMandatory: true,
            dependencyType: 'mandatory',
            sourceDepartment: 'Revenue Department',
            statutoryBasis: 'SMAM Maharashtra Administrative Sanction 2024',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Validates land acreage for machinery eligibility calculation.',
            evidence: {
              sourceTitle: 'SMAM Guidelines 2024',
              officialUrl: 'https://agrimachinery.nic.in/Files/Guidelines/Guidelines_SMAM2024.pdf',
              requirementSupported: 'Land acreage validation for machine matching and small/marginal 50% rate qualification.',
              classification: 'mandatory',
              appliesWhen: 'All agricultural machinery applicants.',
              verificationStatus: 'verified_official',
            },
          },
          {
            id: 'service:caste-certificate',
            title: 'Caste / Community Certificate (for SC/ST Allocation)',
            itemType: 'service',
            serviceId: 'caste-certificate',
            isMandatory: false,
            dependencyType: 'conditional',
            conditionId: 'agriculture:sc_st_category',
            conditionNote: 'Optional: Relevant only for SC/ST farmers seeking fund allocation under SC/ST quotas. Small/marginal farmers (<= 2 ha) and women farmers qualify for 50% subsidy without a caste certificate; other farmers receive 40%.',
            sourceDepartment: 'Revenue & Forest Department',
            statutoryBasis: 'SMAM Special Component Guidelines',
            isVerifiedPrerequisite: true,
            dataReuseBenefit: 'Attaches verified caste certificate for category quota lottery.',
            evidence: {
              sourceTitle: 'Operational Guidelines - Sub-Mission on Agricultural Mechanization (SMAM) (Revised 2024)',
              officialUrl: 'https://agrimachinery.nic.in/Files/Guidelines/Guidelines_SMAM2024.pdf',
              requirementSupported: 'SC/ST quota allocation validation.',
              classification: 'conditional',
              appliesWhen: 'Relevant only for SC/ST category allocation.',
              verificationStatus: 'verified_official',
              relevantClause: 'Annexure-II',
            },
          },
        ],
        description: 'Financial assistance up to 50% for small & marginal farmers, women farmers, and SC/ST farmers (and 40% for other eligible farmers) on agricultural machinery, tractors, and implements via MahaDBT lottery.',
        externalUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
        evidence: {
          sourceTitle: 'SMAM Operational Guidelines 2024 (GoI) & Maharashtra State Agriculture Dept MahaDBT Implementation',
          officialUrl: 'https://agrimachinery.nic.in/Files/Guidelines/Guidelines_SMAM2024.pdf',
          requirementSupported: 'Farm machinery capital subsidy via transparent online application and lottery allocation.',
          classification: 'recommended',
          appliesWhen: 'Destination farm mechanization scheme for all landholding farmers.',
          verificationStatus: 'verified_official',
          relevantClause: 'Central SMAM 2024 Guidelines Annexure-II; MahaDBT Agricultural Mechanization Guidelines',
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Engine Evaluation Logic
// Evaluates prerequisite statuses and journey progression purely in-memory
// ---------------------------------------------------------------------------

/**
 * Returns all defined multi-service journeys.
 */
export function getAllJourneys(): MultiServiceJourneyDefinition[] {
  return [...JOURNEYS_CATALOGUE];
}

/**
 * Returns a specific journey by ID.
 */
export function getJourneyById(id: string): MultiServiceJourneyDefinition | undefined {
  return JOURNEYS_CATALOGUE.find((j) => j.id === id);
}

/**
 * Validates a journey graph for circular dependencies, duplicate steps, and missing targets.
 * Implements Kahn's algorithm for complete topological sorting and cycle detection.
 */
export function validateJourneyGraph(journey: MultiServiceJourneyDefinition): {
  isValid: boolean;
  valid: boolean;
  hasCycles: boolean;
  cycleDetected: boolean;
  duplicates: string[];
  missingDependencies: string[];
  errors: string[];
  topologicalOrder: string[];
} {
  const stepIds = new Set<string>();
  const duplicates: string[] = [];
  const missingDependencies: string[] = [];
  const errors: string[] = [];

  for (const step of journey.steps) {
    if (stepIds.has(step.id)) {
      duplicates.push(step.id);
      errors.push(`Duplicate step ID detected: "${step.id}" in journey "${journey.id}"`);
    }
    stepIds.add(step.id);
  }

  // Check missing dependencies
  for (const step of journey.steps) {
    const deps = step.dependsOn || [];
    for (const depId of deps) {
      if (!stepIds.has(depId)) {
        missingDependencies.push(`${step.id} -> ${depId}`);
        errors.push(`Missing dependency: Step "${step.id}" depends on non-existent step "${depId}"`);
      }
    }
  }

  // Kahn's Algorithm for Topological Sort & Cycle Detection
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const step of journey.steps) {
    inDegree.set(step.id, 0);
    adjacency.set(step.id, []);
  }

  for (const step of journey.steps) {
    const deps = step.dependsOn || [];
    for (const depId of deps) {
      if (stepIds.has(depId)) {
        // depId -> step.id
        adjacency.get(depId)!.push(step.id);
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [stepId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(stepId);
    }
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      const updatedDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, updatedDegree);
      if (updatedDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  const cycleDetected = topologicalOrder.length !== journey.steps.length || duplicates.length > 0;
  if (cycleDetected && duplicates.length === 0) {
    errors.push(`Cycle detected in journey graph dependencies for journey "${journey.id}"`);
  }

  const isValid = duplicates.length === 0 && missingDependencies.length === 0 && !cycleDetected;

  return {
    isValid,
    valid: isValid,
    hasCycles: cycleDetected,
    cycleDetected,
    duplicates,
    missingDependencies,
    errors,
    topologicalOrder: cycleDetected ? [] : topologicalOrder,
  };
}

/**
 * Evaluates condition applicability for a conditional dependency.
 *
 * Ground rules:
 * - 'mandatory': always applies.
 * - 'conditional': applies ONLY when its condition is positively established.
 * - 'recommended' / 'unverified': never blocks.
 * - If applicability cannot be positively established, returns 'unknown' (never assumes it applies).
 */
export function evaluateConditionApplicability(
  id: string,
  conditionId: string | undefined,
  context: EvaluationContext = {},
  applications: ApplicationRecord[] = []
): { applicability: ConditionApplicability; reason: string } {
  // 1. Explicit override via context.customConditions
  if (context.customConditions && id in context.customConditions) {
    const val = context.customConditions[id];
    return {
      applicability: val,
      reason:
        val === 'applies'
          ? 'Applicable condition explicitly established.'
          : val === 'does_not_apply'
          ? 'Condition explicitly does not apply to this profile.'
          : 'Condition applicability is unknown.',
    };
  }
  if (conditionId && context.customConditions && conditionId in context.customConditions) {
    const val = context.customConditions[conditionId];
    return {
      applicability: val,
      reason:
        val === 'applies'
          ? 'Applicable condition explicitly established.'
          : val === 'does_not_apply'
          ? 'Condition explicitly does not apply to this profile.'
          : 'Condition applicability is unknown.',
    };
  }

  // 2. Education Caste Certificate condition
  if (id === 'service:caste-certificate' && (conditionId === 'education:reserved_category' || !conditionId)) {
    if (context.citizenCategory === 'general' || context.citizenCategory === 'ews') {
      return {
        applicability: 'does_not_apply',
        reason: 'Exempt: Caste certificate is not required for General or EWS category applicants under Maharashtra Act XXIII of 2001.',
      };
    }
    if (context.citizenCategory && ['sc', 'st', 'obc', 'vjnt', 'sbc'].includes(context.citizenCategory)) {
      return {
        applicability: 'applies',
        reason: 'Required: Positively established for reserved category fee concessions under Maharashtra Act XXIII of 2001.',
      };
    }
    const hasCasteApp = applications.some((a) => a.service === 'caste-certificate');
    if (hasCasteApp) {
      return {
        applicability: 'applies',
        reason: 'Required: Citizen has applied for caste verification for category benefits.',
      };
    }
    return {
      applicability: 'unknown',
      reason: 'Unknown category: System does not assume reserved-category certificate applies unless positively established.',
    };
  }

  // 3. Agriculture SMAM Caste Certificate condition
  if (id === 'service:caste-certificate' && conditionId === 'agriculture:sc_st_category') {
    if (context.citizenCategory === 'sc' || context.citizenCategory === 'st') {
      return {
        applicability: 'applies',
        reason: 'Required: Positively established for SC/ST Special Component fund allocation under SMAM 2024 Guidelines.',
      };
    }
    if (context.citizenCategory === 'general' || context.farmerType === 'small_marginal' || context.gender === 'female') {
      return {
        applicability: 'does_not_apply',
        reason: 'Exempt: Small & marginal farmers (<= 2 ha) and women farmers qualify for 50% subsidy without a caste certificate under SMAM 2024 Guidelines (Annexure-II); other farmers receive 40%.',
      };
    }
    return {
      applicability: 'unknown',
      reason: 'Category unknown: Under SMAM 2024 Guidelines, 50% assistance applies to small/marginal and women farmers without caste certification.',
    };
  }

  // 4. Women's Welfare Income Certificate condition (Ration Card Exemption)
  if (id === 'service:income-certificate' && conditionId === 'women:income_means_test') {
    const hasApprovedRationCard =
      applications.some((a) => a.service === 'ration-card' && a.status === 'approved') ||
      context.hasRationCard === true ||
      (context.rationCardCategory && ['yellow', 'orange'].includes(context.rationCardCategory));

    if (hasApprovedRationCard) {
      return {
        applicability: 'does_not_apply',
        reason: 'Exempt: Applicant family possesses a valid Yellow or Orange Ration Card under GR No. MKB-2024/C.R.108/WCD-2 Clause 3(e).',
      };
    }

    if (context.hasRationCard === false || context.rationCardCategory === 'white') {
      return {
        applicability: 'applies',
        reason: 'Required: Applicant family does not possess a Yellow or Orange Ration Card; income certificate under ₹2.50 Lakh is required per GR No. MKB-2024/C.R.108/WCD-2 Clause 3(e).',
      };
    }

    return {
      applicability: 'unknown',
      reason: 'Ration card status unknown: System does not assume income certificate is required if family holds a Yellow/Orange card.',
    };
  }

  return {
    applicability: 'unknown',
    reason: 'Condition applicability is unknown.',
  };
}

/**
 * Evaluates the status of an application for a specific service.
 */
function evaluateServiceApplicationStatus(
  serviceId: Service,
  applications: ApplicationRecord[]
): {
  status: PrerequisiteStatus;
  statusLabel: string;
  application?: ApplicationRecord;
} {
  const matchingApps = applications.filter((a) => a.service === serviceId);

  if (matchingApps.length === 0) {
    return {
      status: 'not_started',
      statusLabel: 'Not started',
    };
  }

  // Check for approved application (satisfied prerequisite)
  const approved = matchingApps.find((a) => a.status === 'approved');
  if (approved) {
    return {
      status: 'completed',
      statusLabel: 'Completed',
      application: approved,
    };
  }

  // Check for clarification requested (action required)
  const clarification = matchingApps.find((a) => a.status === 'clarification');
  if (clarification) {
    return {
      status: 'action_required',
      statusLabel: 'Clarification required',
      application: clarification,
    };
  }

  // Check for in-progress applications
  const inProgress = matchingApps.find((a) => ['submitted', 'review', 'eligible', 'draft'].includes(a.status));
  if (inProgress) {
    return {
      status: 'in_progress',
      statusLabel: inProgress.status === 'submitted' ? 'Department Review in progress' : 'Verification in progress',
      application: inProgress,
    };
  }

  // Check for rejected or ineligible applications
  const rejected = matchingApps.find((a) => ['rejected', 'ineligible'].includes(a.status));
  if (rejected) {
    return {
      status: 'action_required',
      statusLabel: 'Application rejected / Action required',
      application: rejected,
    };
  }

  return {
    status: 'not_started',
    statusLabel: 'Not started',
  };
}

/**
 * Evaluates a single journey dynamically against the citizen's existing application records and optional evaluation context.
 * Returns fully evaluated steps, prerequisite states, blocking alerts, and progress metrics.
 *
 * Strict Dependency Evaluation Semantics:
 * - mandatory: blocks when incomplete.
 * - conditional: blocks ONLY when its condition is positively established ('applies') and the requirement is incomplete.
 * - recommended: never blocks.
 * - unverified: never blocks.
 * - If applicability is unknown, does NOT assume condition applies.
 */
export function evaluateJourney(
  journey: MultiServiceJourneyDefinition,
  applications: ApplicationRecord[] = [],
  context: EvaluationContext = {}
): EvaluatedJourney {
  // Map of step statuses for fast dependency lookups
  const completedStepIds = new Set<string>();
  const stepStatusMap = new Map<string, PrerequisiteStatus>();
  const associatedApplicationIds: string[] = [];

  // 1. Initial Pass: Evaluate application status for each service step
  for (const step of journey.steps) {
    if (step.serviceId) {
      const evalResult = evaluateServiceApplicationStatus(step.serviceId, applications);
      stepStatusMap.set(step.id, evalResult.status);
      if (evalResult.status === 'completed') {
        completedStepIds.add(step.id);
      }
      if (evalResult.application) {
        associatedApplicationIds.push(evalResult.application.id);
      }
    } else if (step.itemType === 'external_document') {
      // External documents (e.g. land records): in simulated environment, mark as completed
      stepStatusMap.set(step.id, 'completed');
      completedStepIds.add(step.id);
    } else {
      // Schemes without direct in-app submission
      stepStatusMap.set(step.id, 'not_started');
    }
  }

  // 2. Second Pass: Evaluate prerequisites and blocking states
  const evaluatedSteps: EvaluatedJourneyStep[] = [];
  let completedCount = 0;
  let inProgressCount = 0;
  let actionRequiredCount = 0;
  let remainingPrerequisitesCount = 0;
  let hasBlocking = false;

  for (const step of journey.steps) {
    const blockingStepIds: string[] = [];
    const blockingStepTitles: string[] = [];
    const blockingReasons: string[] = [];

    // Check declared dependencies in dependsOn
    for (const depId of step.dependsOn) {
      const depStep = journey.steps.find((s) => s.id === depId);
      const isDepCompleted = completedStepIds.has(depId);

      // Determine dependency classification
      const matchingPrereq = step.prerequisites.find((p) => p.id === depId);
      const depType: DependencyType = matchingPrereq
        ? matchingPrereq.dependencyType
        : (depStep?.dependencyType || (depStep?.isMandatory ? 'mandatory' : 'recommended'));

      let shouldBlock = false;
      let blockReason = '';

      if (!isDepCompleted) {
        if (depType === 'mandatory') {
          shouldBlock = true;
          blockReason = `${depStep?.title || depId} is a mandatory statutory prerequisite.`;
        } else if (depType === 'conditional') {
          const evalCond = evaluateConditionApplicability(depId, matchingPrereq?.conditionId, context, applications);
          if (evalCond.applicability === 'applies') {
            shouldBlock = true;
            blockReason = evalCond.reason;
          }
          // If 'does_not_apply' or 'unknown', shouldBlock remains FALSE!
        }
        // If 'recommended' or 'unverified', shouldBlock remains FALSE!
      }

      if (shouldBlock) {
        blockingStepIds.push(depId);
        blockingStepTitles.push(depStep?.title || depId);
        blockingReasons.push(blockReason);
      }
    }

    const isBlocked = blockingStepIds.length > 0;
    if (isBlocked) hasBlocking = true;

    // Evaluate individual prerequisites
    const evaluatedPrerequisites: EvaluatedPrerequisite[] = step.prerequisites.map((prereq) => {
      let status: PrerequisiteStatus = 'not_started';
      let statusLabel = 'Not started';
      let appId: string | undefined;
      let appStatus: string | undefined;

      if (prereq.serviceId) {
        const pEval = evaluateServiceApplicationStatus(prereq.serviceId, applications);
        status = pEval.status;
        statusLabel = pEval.statusLabel;
        appId = pEval.application?.id;
        appStatus = pEval.application?.status;
      } else if (prereq.itemType === 'external_document') {
        status = 'completed';
        statusLabel = 'Available in Registry';
      } else if (prereq.dependencyType === 'unverified' || !prereq.isVerifiedPrerequisite) {
        status = 'unverified_dependency';
        statusLabel = 'Information unavailable';
      }

      // Evaluate condition applicability for prerequisite
      let condApplicability: ConditionApplicability = 'unknown';
      let condReason = prereq.conditionNote || '';

      if (prereq.dependencyType === 'conditional') {
        const evalCond = evaluateConditionApplicability(prereq.id, prereq.conditionId, context, applications);
        condApplicability = evalCond.applicability;
        condReason = evalCond.reason;
      } else if (prereq.dependencyType === 'mandatory') {
        condApplicability = 'applies';
        condReason = 'Mandatory statutory prerequisite for all applicants.';
      } else if (prereq.dependencyType === 'recommended') {
        condApplicability = 'does_not_apply';
        condReason = 'Recommended service sequence for data reuse; non-blocking.';
      } else if (prereq.dependencyType === 'unverified') {
        condApplicability = 'unknown';
        condReason = 'Unverified dependency; non-blocking.';
      }

      // Blocking logic for prerequisite:
      // - Mandatory: blocks when incomplete
      // - Conditional: blocks ONLY when condition positively applies AND incomplete
      // - Recommended/Unverified: never blocks
      let isBlocking = false;
      if (status !== 'completed') {
        if (prereq.dependencyType === 'mandatory') {
          isBlocking = true;
        } else if (prereq.dependencyType === 'conditional' && condApplicability === 'applies') {
          isBlocking = true;
        }
      }

      if (isBlocking) remainingPrerequisitesCount++;

      let actionType: EvaluatedPrerequisite['actionType'] = 'none';
      if (status === 'completed') actionType = 'view_certificate';
      else if (status === 'in_progress') actionType = 'track_timeline';
      else if (status === 'action_required') actionType = 'respond_clarification';
      else if (status === 'not_started' && prereq.serviceId) actionType = 'start_service';

      return {
        ...prereq,
        status,
        statusLabel,
        applicationId: appId,
        applicationStatus: appStatus,
        conditionApplicability: condApplicability,
        conditionApplicabilityReason: condReason,
        isBlocking,
        actionType,
      };
    });

    // Derive step status and labels
    let stepStatus = stepStatusMap.get(step.id) || 'not_started';
    let stepStatusLabel = 'Not started';
    let matchingApp: ApplicationRecord | undefined;

    if (step.serviceId) {
      const pEval = evaluateServiceApplicationStatus(step.serviceId, applications);
      stepStatus = pEval.status;
      stepStatusLabel = pEval.statusLabel;
      matchingApp = pEval.application;
    } else if (step.itemType === 'external_document') {
      stepStatus = 'completed';
      stepStatusLabel = 'Verified in Land Registry';
    } else if (step.itemType === 'scheme') {
      if (isBlocked) {
        stepStatus = 'not_started';
        stepStatusLabel = 'Prerequisites required';
      } else {
        stepStatus = 'not_started';
        stepStatusLabel = 'Ready to apply on Official Portal';
      }
    }

    // Determine available next action for step
    let availableAction: EvaluatedJourneyStep['availableAction'] = {
      type: 'none',
      label: 'No action',
    };

    if (step.itemType === 'service' && step.serviceId) {
      if (stepStatus === 'completed') {
        availableAction = {
          type: 'view_certificate',
          label: 'View Certificate',
          serviceId: step.serviceId,
          applicationId: matchingApp?.id,
        };
      } else if (stepStatus === 'in_progress') {
        availableAction = {
          type: 'track_timeline',
          label: 'Track Timeline',
          serviceId: step.serviceId,
          applicationId: matchingApp?.id,
        };
      } else if (stepStatus === 'action_required') {
        availableAction = {
          type: 'respond_clarification',
          label: 'Respond to Clarification',
          serviceId: step.serviceId,
          applicationId: matchingApp?.id,
        };
      } else {
        // Not started
        if (isBlocked) {
          const firstBlockingStep = journey.steps.find((s) => s.id === blockingStepIds[0]);
          availableAction = {
            type: 'start_service',
            label: `Complete ${firstBlockingStep?.title || 'Prerequisite'} First`,
            serviceId: firstBlockingStep?.serviceId || step.serviceId,
          };
        } else {
          availableAction = {
            type: 'start_service',
            label: 'Start Application in GovSync',
            serviceId: step.serviceId,
          };
        }
      }
    } else if (step.itemType === 'scheme') {
      if (isBlocked) {
        const firstBlockingStep = journey.steps.find((s) => s.id === blockingStepIds[0]);
        availableAction = {
          type: 'start_service',
          label: `Complete ${firstBlockingStep?.title || 'Prerequisite'} First`,
          serviceId: firstBlockingStep?.serviceId,
          schemeId: step.schemeId,
        };
      } else {
        availableAction = {
          type: 'external_link',
          label: 'Apply on Official Portal',
          schemeId: step.schemeId,
          externalUrl: step.externalUrl,
        };
      }
    }

    if (step.isMandatory) {
      if (stepStatus === 'completed') completedCount++;
      else if (stepStatus === 'in_progress') inProgressCount++;
      else if (stepStatus === 'action_required') actionRequiredCount++;
    }

    evaluatedSteps.push({
      ...step,
      status: stepStatus,
      statusLabel: stepStatusLabel,
      application: matchingApp,
      evaluatedPrerequisites,
      isBlocked,
      blockingStepIds,
      blockingStepTitles,
      blockingReasons,
      availableAction,
    });
  }

  const mandatorySteps = journey.steps.filter((s) => s.isMandatory);
  const totalMandatory = mandatorySteps.length;
  const progressPercent = totalMandatory > 0 ? Math.round((completedCount / totalMandatory) * 100) : 0;
  const isFullyCompleted = totalMandatory > 0 && completedCount === totalMandatory;

  return {
    definition: journey,
    steps: evaluatedSteps,
    totalRequirements: totalMandatory,
    completedRequirements: completedCount,
    inProgressRequirements: inProgressCount,
    actionRequiredRequirements: actionRequiredCount,
    remainingPrerequisites: remainingPrerequisitesCount,
    progressPercent,
    isFullyCompleted,
    hasBlockingPrerequisites: hasBlocking,
    associatedApplicationIds: Array.from(new Set(associatedApplicationIds)),
  };
}

/**
 * Evaluates all multi-service journeys for an authenticated citizen.
 */
export function evaluateAllJourneys(
  applications: ApplicationRecord[] = [],
  context: EvaluationContext = {}
): EvaluatedJourney[] {
  return JOURNEYS_CATALOGUE.map((j) => evaluateJourney(j, applications, context));
}

/**
 * Returns all journeys that contain a specific application's service.
 */
export function getJourneysForApplication(
  app: ApplicationRecord,
  allJourneys?: MultiServiceJourneyDefinition[]
): MultiServiceJourneyDefinition[] {
  const journeys = allJourneys || JOURNEYS_CATALOGUE;
  return journeys.filter((j) => j.steps.some((s) => s.serviceId === app.service));
}
