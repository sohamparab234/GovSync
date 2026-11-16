import type { Department } from './demo';

export type Service =
  | 'scholarship'
  | 'residence'
  | 'ration-card'
  | 'passport'
  | 'pension'
  | 'income-certificate'
  | 'caste-certificate';

export type ServiceCategory =
  | 'Education'
  | 'Certificates'
  | 'Public Distribution'
  | 'Identity & Travel'
  | 'Social Welfare'
  | 'Documentation';

export interface EligibilityRuleConfig {
  id: string;
  label: string;
  field: string;
  operator: '<=' | '>=' | '==' | '!=' | '<' | '>' | 'in' | 'custom';
  value: number | boolean | string | string[];
  critical?: boolean;
  detail?: string;
  department?: Department;
}

export interface ServiceFieldDefinition {
  label: string;
  key: string;
  source: string;
}

export interface ServiceDetailField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: readonly string[];
  required: boolean;
  placeholder?: string;
  defaultValue?: string | number;
}

export interface ServiceDefinition {
  id: Service;
  name: string;
  category: ServiceCategory;
  department: string;
  departmentCode: string;
  description: string;
  icon: string; // Lucide icon identifier
  estimatedTime: string;
  requiredSources: readonly Department[];
  referencePrefix: string;
  isSimulated: boolean;
  simulationNotice: string;
  keywords: string;
  fields: readonly ServiceFieldDefinition[];
  rules: readonly EligibilityRuleConfig[];
  supportsCertificate?: boolean;
  certificateTitle?: string;
  detailFields?: readonly ServiceDetailField[];
}

export interface DataConflict {
  field: string;
  label: string;
  sources: { department: Department; sourceLabel: string; value: string }[];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export const serviceCategories: readonly ServiceCategory[] = [
  'Education',
  'Certificates',
  'Public Distribution',
  'Identity & Travel',
  'Social Welfare',
  'Documentation',
] as const;

export const services: Record<Service, ServiceDefinition> = {
  scholarship: {
    id: 'scholarship',
    name: 'Scholarship Application',
    category: 'Education',
    department: 'Ministry of Education',
    departmentCode: 'EDU',
    description: 'Identity, education, income and residence verification.',
    icon: 'GraduationCap',
    estimatedTime: '8-12 min',
    requiredSources: ['identity', 'education', 'income', 'residence'],
    referencePrefix: 'SS-',
    isSimulated: true,
    simulationNotice: 'Simulated Ministry of Education NAD and CBDT Income verification for demonstration.',
    keywords: 'scholarship scholarships education scheme schemes student merit college tuition',
    fields: [
      { label: 'Full name', key: 'name', source: 'Identity' },
      { label: 'Date of birth', key: 'dateOfBirth', source: 'Identity' },
      { label: 'College', key: 'college', source: 'Education' },
      { label: 'Course', key: 'course', source: 'Education' },
      { label: 'Academic score (%)', key: 'marks', source: 'Education' },
      { label: 'Annual family income', key: 'annualIncome', source: 'Income' },
      { label: 'Address', key: 'address', source: 'Residence' },
      { label: 'District', key: 'district', source: 'Residence' },
      { label: 'State', key: 'state', source: 'Residence' },
    ],
    rules: [
      {
        id: 'identity_academic_match',
        label: 'Identity matches academic record',
        field: 'identity_academic_consistency',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Name and date of birth must agree across sources.',
      },
      {
        id: 'academic_score',
        label: 'Academic score at least 75%',
        field: 'marks',
        operator: '>=',
        value: 75,
        critical: false,
        detail: '75% or higher in qualifying academic examination.',
      },
      {
        id: 'income_limit',
        label: 'Annual family income at most ₹2,50,000',
        field: 'annualIncome',
        operator: '<=',
        value: 250000,
        critical: true,
        detail: 'Income threshold verified by Income Tax Department.',
      },
      {
        id: 'maharashtra_domicile',
        label: 'Verified Maharashtra domicile',
        field: 'domicileVerified',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Maharashtra domicile and state residence verification.',
      },
    ],
    detailFields: [
      { name: 'email', label: 'Contact email for the demo record', type: 'text', required: true, placeholder: 'name@example.test' },
      { name: 'statement', label: 'Brief application statement', type: 'textarea', required: true, placeholder: 'State reason for scholarship application...' },
    ],
  },

  residence: {
    id: 'residence',
    name: 'Residence / Domicile Certificate',
    category: 'Certificates',
    department: 'Revenue & Forest Department',
    departmentCode: 'REV',
    description: 'Apply using your verified identity and residence information.',
    icon: 'MapPin',
    estimatedTime: '5-8 min',
    requiredSources: ['identity', 'residence', 'documents'],
    referencePrefix: 'RES-',
    isSimulated: true,
    simulationNotice: 'Simulated Revenue Department address registry and DigiLocker document verification.',
    keywords: 'residence domicile certificate certificates address proof revenue state',
    supportsCertificate: true,
    certificateTitle: 'Residence / Domicile Certificate',
    fields: [
      { label: 'Full name', key: 'name', source: 'Identity' },
      { label: 'Date of birth', key: 'dateOfBirth', source: 'Identity' },
      { label: 'Address', key: 'address', source: 'Residence' },
      { label: 'District', key: 'district', source: 'Residence' },
      { label: 'State', key: 'state', source: 'Residence' },
      { label: 'PIN Code', key: 'pin', source: 'Residence' },
    ],
    rules: [
      {
        id: 'name_identity_match',
        label: 'Name matches identity record',
        field: 'name_identity_match',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Identity details match supporting records.',
      },
      {
        id: 'address_matches_registry',
        label: 'Address matches residence registry',
        field: 'address_matches_registry',
        operator: 'custom',
        value: true,
        critical: false,
        detail: 'Address aligns with state residence registry.',
      },
      {
        id: 'address_format_valid',
        label: 'Address format valid',
        field: 'address_format_valid',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Standard street address length between 10 and 250 characters.',
      },
      {
        id: 'district_matches_pin',
        label: 'District matches PIN',
        field: 'district_matches_pin',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'District and postal index code correspond.',
      },
      {
        id: 'verified_maharashtra_domicile',
        label: 'Verified Maharashtra domicile',
        field: 'domicileVerified',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Maharashtra domicile and state residence verification.',
      },
      {
        id: 'verified_supporting_document',
        label: 'Verified supporting document',
        field: 'verified_supporting_document',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'DigiLocker verified address proof.',
      },
      {
        id: 'residence_history_matches',
        label: 'Residence history matches registry',
        field: 'residence_history_matches',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Continuous residence since stated year.',
      },
      {
        id: 'required_fields_complete',
        label: 'Required fields complete',
        field: 'required_fields_complete',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Purpose, address, and document reference provided.',
      },
    ],
    detailFields: [
      {
        name: 'purpose',
        label: 'Purpose',
        type: 'select',
        options: ['Education', 'Employment', 'Government service'] as const,
        required: true,
        defaultValue: 'Education',
      },
      {
        name: 'residenceSince',
        label: 'Residence Since',
        type: 'number',
        required: true,
        defaultValue: 2018,
      },
      {
        name: 'documentId',
        label: 'Supporting Document',
        type: 'text',
        required: true,
      },
    ],
  },

  'ration-card': {
    id: 'ration-card',
    name: 'Ration Card (PDS Security)',
    category: 'Public Distribution',
    department: 'Department of Food & Public Distribution',
    departmentCode: 'PDS',
    description: 'Apply for a new subsidized digital ration card for household food grain access under NFSA / PDS.',
    icon: 'ShoppingBasket',
    estimatedTime: '10-15 min',
    requiredSources: ['identity', 'residence', 'income'],
    referencePrefix: 'RC-',
    isSimulated: true,
    simulationNotice: 'Simulated PDS department database, municipal address check, and CBDT income data.',
    keywords: 'ration card food grain pds bpl subsidized grain distribution food security',
    fields: [
      { label: 'Full name', key: 'name', source: 'Identity' },
      { label: 'Date of birth', key: 'dateOfBirth', source: 'Identity' },
      { label: 'Age', key: 'age', source: 'Identity' },
      { label: 'Annual family income', key: 'annualIncome', source: 'Income' },
      { label: 'Address', key: 'address', source: 'Residence' },
      { label: 'District', key: 'district', source: 'Residence' },
      { label: 'State', key: 'state', source: 'Residence' },
    ],
    rules: [
      {
        id: 'adult_applicant',
        label: 'Applicant age at least 18 years',
        field: 'age',
        operator: '>=',
        value: 18,
        critical: true,
        detail: 'Primary ration card holder must be an adult.',
      },
      {
        id: 'income_limit_bpl',
        label: 'Annual family income at most ₹3,00,000 for subsidized card',
        field: 'annualIncome',
        operator: '<=',
        value: 300000,
        critical: true,
        detail: 'Income ceiling for targeted subsidized food grain entitlement.',
      },
      {
        id: 'residence_verified',
        label: 'Verified state residence and PIN',
        field: 'residenceVerified',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Active residence verified by municipal records.',
      },
      {
        id: 'identity_verified',
        label: 'Identity record verified',
        field: 'identityVerified',
        operator: '==',
        value: true,
        critical: true,
        detail: 'Aadhaar / UIDAI identity confirmation.',
      },
    ],
    detailFields: [
      {
        name: 'cardType',
        label: 'Ration Card Category',
        type: 'select',
        options: ['Priority Household (PHH)', 'Antyodaya Anna Yojana (AAY)', 'Non-NFSA Subsidized'] as const,
        required: true,
        defaultValue: 'Priority Household (PHH)',
      },
      {
        name: 'familyMembersCount',
        label: 'Total Family Members Count',
        type: 'number',
        required: true,
        defaultValue: 4,
      },
    ],
  },

  passport: {
    id: 'passport',
    name: 'Passport Application',
    category: 'Identity & Travel',
    department: 'Ministry of External Affairs',
    departmentCode: 'MEA',
    description: 'Apply for an Indian Ordinary Citizen Passport with automated identity, address, and DigiLocker verification.',
    icon: 'Plane',
    estimatedTime: '15-20 min',
    requiredSources: ['identity', 'residence', 'documents'],
    referencePrefix: 'PSP-',
    isSimulated: true,
    simulationNotice: 'Simulated Consular, Passport & Visa division checks and DigiLocker document vault.',
    keywords: 'passport travel international visa mea external affairs ordinary tatkal',
    fields: [
      { label: 'Full name', key: 'name', source: 'Identity' },
      { label: 'Date of birth', key: 'dateOfBirth', source: 'Identity' },
      { label: 'Age', key: 'age', source: 'Identity' },
      { label: 'Current Address', key: 'address', source: 'Residence' },
      { label: 'District', key: 'district', source: 'Residence' },
      { label: 'State', key: 'state', source: 'Residence' },
      { label: 'Supporting document', key: 'documentId', source: 'Documents' },
    ],
    rules: [
      {
        id: 'adult_age',
        label: 'Applicant age at least 18 years for adult passport',
        field: 'age',
        operator: '>=',
        value: 18,
        critical: true,
        detail: 'Standard adult passport valid for 10 years.',
      },
      {
        id: 'residence_verified',
        label: 'Current address verified by local jurisdiction',
        field: 'residenceVerified',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Address verified for local police jurisdiction matching.',
      },
      {
        id: 'documents_verified',
        label: 'Identity documents verified in DigiLocker',
        field: 'documentsVerified',
        operator: '==',
        value: true,
        critical: true,
        detail: 'Supporting identity and address document vault verification.',
      },
      {
        id: 'identity_consistent',
        label: 'Identity and address record consistency',
        field: 'identity_consistent',
        operator: 'custom',
        value: true,
        critical: false,
        detail: 'Demographic consistency across identity and address proofs.',
      },
    ],
    detailFields: [
      {
        name: 'bookletType',
        label: 'Passport Booklet Type',
        type: 'select',
        options: ['36 Pages (Standard)', '60 Pages (Jumbo)'] as const,
        required: true,
        defaultValue: '36 Pages (Standard)',
      },
      {
        name: 'validityRequired',
        label: 'Validity Duration',
        type: 'select',
        options: ['10 Years (Adult)', '5 Years'] as const,
        required: true,
        defaultValue: '10 Years (Adult)',
      },
    ],
  },

  pension: {
    id: 'pension',
    name: 'Old Age Pension',
    category: 'Social Welfare',
    department: 'Ministry of Social Justice & Empowerment',
    departmentCode: 'MSJE',
    description: 'Monthly social security pension for senior citizens (60+ years) from economically weaker households.',
    icon: 'HeartHandshake',
    estimatedTime: '5-10 min',
    requiredSources: ['identity', 'income', 'residence'],
    referencePrefix: 'PEN-',
    isSimulated: true,
    simulationNotice: 'Simulated Social Welfare Department records, NSAP rules, and CBDT income verification.',
    keywords: 'pension senior citizen old age retirement social welfare ignoaps monthly pension',
    fields: [
      { label: 'Full name', key: 'name', source: 'Identity' },
      { label: 'Date of birth', key: 'dateOfBirth', source: 'Identity' },
      { label: 'Age', key: 'age', source: 'Identity' },
      { label: 'Annual family income', key: 'annualIncome', source: 'Income' },
      { label: 'Address', key: 'address', source: 'Residence' },
      { label: 'District', key: 'district', source: 'Residence' },
      { label: 'State', key: 'state', source: 'Residence' },
    ],
    rules: [
      {
        id: 'senior_age',
        label: 'Applicant age at least 60 years',
        field: 'age',
        operator: '>=',
        value: 60,
        critical: true,
        detail: 'NSAP guideline requirement for Old Age Pension eligibility.',
      },
      {
        id: 'income_ceiling',
        label: 'Annual income at most ₹1,00,000 for pension scheme',
        field: 'annualIncome',
        operator: '<=',
        value: 100000,
        critical: true,
        detail: 'Economic assistance targeted at destitute senior citizens.',
      },
      {
        id: 'state_residence',
        label: 'Verified state residence',
        field: 'domicileVerified',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Permanent resident of Maharashtra.',
      },
      {
        id: 'identity_verified',
        label: 'Identity record verified',
        field: 'identityVerified',
        operator: '==',
        value: true,
        critical: true,
        detail: 'UIDAI biometric / demographic identity confirmation.',
      },
    ],
    detailFields: [
      {
        name: 'bankAccountRef',
        label: 'Direct Benefit Transfer (DBT) Bank Account Reference',
        type: 'text',
        required: true,
        placeholder: 'e.g. SBIN0001234-9876543210',
        defaultValue: 'DBT-VERIFIED-ACCOUNT',
      },
    ],
  },

  'income-certificate': {
    id: 'income-certificate',
    name: 'Income Certificate',
    category: 'Documentation',
    department: 'Revenue & Land Reforms Department',
    departmentCode: 'REV',
    description: 'Official government income certificate based on verified tax assessment records and employer statements.',
    icon: 'FileText',
    estimatedTime: '5-8 min',
    requiredSources: ['identity', 'income'],
    referencePrefix: 'INC-',
    isSimulated: true,
    simulationNotice: 'Simulated Revenue Department income certificate issuing workflow and CBDT tax records.',
    keywords: 'income certificate financial revenue tax pan proof assessment salary',
    supportsCertificate: true,
    certificateTitle: 'Income Verification Certificate',
    fields: [
      { label: 'Full name', key: 'name', source: 'Identity' },
      { label: 'Date of birth', key: 'dateOfBirth', source: 'Identity' },
      { label: 'Annual family income', key: 'annualIncome', source: 'Income' },
      { label: 'Financial Year', key: 'financialYear', source: 'Income' },
      { label: 'Tax Assessment Reference', key: 'certificateRef', source: 'Income' },
    ],
    rules: [
      {
        id: 'adult_applicant',
        label: 'Applicant age at least 18 years',
        field: 'age',
        operator: '>=',
        value: 18,
        critical: true,
        detail: 'Income certificate applicant must be at least 18 years old.',
      },
      {
        id: 'active_assessment',
        label: 'Tax and revenue assessment record active',
        field: 'active_assessment',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Current financial year assessment record on file.',
      },
      {
        id: 'identity_verified',
        label: 'Identity record verified',
        field: 'identityVerified',
        operator: '==',
        value: true,
        critical: true,
        detail: 'PAN / Aadhaar linked identity confirmation.',
      },
    ],
    detailFields: [
      {
        name: 'purpose',
        label: 'Purpose of Income Certificate',
        type: 'select',
        options: ['Educational Scholarship', 'Fee Concession', 'Government Subsidy', 'Legal / Court Purpose'] as const,
        required: true,
        defaultValue: 'Educational Scholarship',
      },
    ],
  },

  'caste-certificate': {
    id: 'caste-certificate',
    name: 'Caste / Community Certificate',
    category: 'Documentation',
    department: 'Social Justice & Special Assistance Department',
    departmentCode: 'SJSA',
    description: 'Official community and caste verification certificate for affirmative action schemes, admissions, and scholarships.',
    icon: 'ScrollText',
    estimatedTime: '8-12 min',
    requiredSources: ['identity', 'residence', 'documents'],
    referencePrefix: 'CST-',
    isSimulated: true,
    simulationNotice: 'Simulated Social Justice Department registry and DigiLocker community records.',
    keywords: 'caste certificate community verification sc st obc ews reservation affirmative action',
    supportsCertificate: true,
    certificateTitle: 'Caste / Community Certificate',
    fields: [
      { label: 'Full name', key: 'name', source: 'Identity' },
      { label: 'Date of birth', key: 'dateOfBirth', source: 'Identity' },
      { label: 'Address', key: 'address', source: 'Residence' },
      { label: 'District', key: 'district', source: 'Residence' },
      { label: 'State', key: 'state', source: 'Residence' },
      { label: 'Community document', key: 'documentId', source: 'Documents' },
    ],
    rules: [
      {
        id: 'adult_applicant',
        label: 'Applicant age at least 18 years',
        field: 'age',
        operator: '>=',
        value: 18,
        critical: true,
        detail: 'Primary certificate applicant must be 18 or older.',
      },
      {
        id: 'state_domicile',
        label: 'Verified state domicile',
        field: 'domicileVerified',
        operator: 'custom',
        value: true,
        critical: true,
        detail: 'Community certificate jurisdiction requires verified state domicile.',
      },
      {
        id: 'community_docs_verified',
        label: 'Supporting community document verified in DigiLocker',
        field: 'documentsVerified',
        operator: '==',
        value: true,
        critical: true,
        detail: 'Pedigree and historic lineage records in digital vault.',
      },
      {
        id: 'identity_verified',
        label: 'Identity record verified',
        field: 'identityVerified',
        operator: '==',
        value: true,
        critical: true,
        detail: 'Aadhaar / UIDAI biometric identity confirmation.',
      },
    ],
    detailFields: [
      {
        name: 'communityCategory',
        label: 'Community / Caste Category',
        type: 'select',
        options: ['Scheduled Caste (SC)', 'Scheduled Tribe (ST)', 'Other Backward Class (OBC)', 'Special Backward Category (SBC)', 'Economically Weaker Section (EWS)'] as const,
        required: true,
        defaultValue: 'Other Backward Class (OBC)',
      },
      {
        name: 'subCaste',
        label: 'Sub-Caste / Sub-Tribe (as per revenue record)',
        type: 'text',
        required: false,
        placeholder: 'e.g. Kunbi Maratha, Mahar, Vani, etc.',
      },
    ],
  },
};

export function getService(id: string): ServiceDefinition | undefined {
  return services[id as Service];
}

export function getAllServices(): ServiceDefinition[] {
  return Object.values(services);
}

export function getServicesByCategory(category: ServiceCategory): ServiceDefinition[] {
  return Object.values(services).filter((s) => s.category === category);
}
