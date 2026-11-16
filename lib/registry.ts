import type { Department } from './demo.ts';
import { mappings } from './demo.ts';

export interface FieldContract {
  sourceField: string;
  targetField: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  description: string;
  required: boolean;
}

export type InstitutionalCategory =
  | 'Data Provider'
  | 'Document Platform'
  | 'State Issuing Authority'
  | 'Central Depository';

export interface DepartmentApiMetadata {
  id: Department;
  name: string;
  code: string;
  authority: string;
  role: string;
  institutionalType: InstitutionalCategory;
  sandboxUrl: string;
  jurisdiction: string;
  description: string;
  authType: string;
  slaTargetMs: number;
  isSimulated: boolean;
  simulationNotice: string;
  contracts: readonly FieldContract[];
}

export const departmentRegistry: Record<Department, DepartmentApiMetadata> = {
  identity: {
    id: 'identity',
    name: 'Unique Identification Authority of India (UIDAI)',
    code: 'UIDAI',
    authority: 'Ministry of Electronics & Information Technology (MeitY), Govt. of India',
    role: 'Central Identity Authenticator & Demographic Data Provider',
    institutionalType: 'Data Provider',
    sandboxUrl: 'https://sandbox.uidai.gov.in/v2/demographics',
    jurisdiction: 'National (All India)',
    description: 'Authoritative national identity and demographic verification authority. Validates Aadhaar-seeded legal identity, full name, and birth date. Does not issue citizenship or state residence certificates.',
    authType: 'Aadhaar e-KYC Consent Token',
    slaTargetMs: 250,
    isSimulated: true,
    simulationNotice: 'Simulated local demonstration endpoint. Uses fictional test profiles; this mock integration does not represent a publicly available live government API.',
    contracts: [
      {
        sourceField: 'citizen_ref',
        targetField: mappings.identity.citizen_ref,
        type: 'string',
        description: 'Masked citizen demo reference number.',
        required: true,
      },
      {
        sourceField: 'full_name',
        targetField: mappings.identity.full_name,
        type: 'string',
        description: 'Official legal name as registered on National Identity.',
        required: true,
      },
      {
        sourceField: 'birth_date',
        targetField: mappings.identity.birth_date,
        type: 'date',
        description: 'Verified birth date in ISO format (YYYY-MM-DD).',
        required: true,
      },
    ],
  },

  education: {
    id: 'education',
    name: 'National Academic Depository (NAD)',
    code: 'NAD-EDU',
    authority: 'Ministry of Education & University Grants Commission (UGC), Govt. of India',
    role: 'National Academic Credential Depository (Operated on DigiLocker framework)',
    institutionalType: 'Central Depository',
    sandboxUrl: 'https://api.nad.gov.in/v2/academic-records',
    jurisdiction: 'National (All India)',
    description: 'Centralized national digital repository for verifying academic awards, board examination scores, and university degrees deposited by accredited institutions.',
    authType: 'OAuth 2.0 Academic Token',
    slaTargetMs: 320,
    isSimulated: true,
    simulationNotice: 'Simulated local demonstration endpoint. Fictional institutional records for demonstration; does not connect to live academic servers.',
    contracts: [
      {
        sourceField: 'student_name',
        targetField: mappings.education.student_name,
        type: 'string',
        description: 'Student name recorded on examination certificate.',
        required: true,
      },
      {
        sourceField: 'dob',
        targetField: mappings.education.dob,
        type: 'date',
        description: 'Date of birth on secondary school record (DD/MM/YYYY).',
        required: true,
      },
      {
        sourceField: 'percentage',
        targetField: mappings.education.percentage,
        type: 'number',
        description: 'Academic score / aggregate percentage in qualifying degree.',
        required: true,
      },
      {
        sourceField: 'institution',
        targetField: mappings.education.institution,
        type: 'string',
        description: 'Accredited university, college, or examination board name.',
        required: true,
      },
      {
        sourceField: 'program',
        targetField: mappings.education.program,
        type: 'string',
        description: 'Enrolled degree course or qualifying program title.',
        required: true,
      },
    ],
  },

  income: {
    id: 'income',
    name: 'Central Board of Direct Taxes (CBDT)',
    code: 'CBDT-AIS',
    authority: 'Department of Revenue, Ministry of Finance, Govt. of India',
    role: 'Central Tax Assessment Data Provider (Annual Information Statement / ITR)',
    institutionalType: 'Data Provider',
    sandboxUrl: 'https://api.incometax.gov.in/ais/v1/income-summary',
    jurisdiction: 'National (All India)',
    description: 'Authoritative central tax database providing annual gross income assessment and ITR tax verification data. Note: State Income Certificates are issued by the State Revenue Department (Tehsildar), using CBDT data for economic validation.',
    authType: 'HMAC-SHA256 Signed Gateway Request',
    slaTargetMs: 380,
    isSimulated: true,
    simulationNotice: 'Simulated local demonstration endpoint. Fictional tax assessment figures for demonstration; does not connect to live tax servers.',
    contracts: [
      {
        sourceField: 'annual_income_inr',
        targetField: mappings.income.annual_income_inr,
        type: 'number',
        description: 'Gross annual income verified for the designated financial assessment cycle.',
        required: true,
      },
      {
        sourceField: 'financial_year',
        targetField: mappings.income.financial_year,
        type: 'string',
        description: 'Designated assessment financial year (e.g. 2026-27).',
        required: true,
      },
    ],
  },

  residence: {
    id: 'residence',
    name: 'Department of Revenue & Forest, Govt. of Maharashtra',
    code: 'REV-MH',
    authority: 'Revenue & Forest Department, Government of Maharashtra',
    role: 'State Statutory Issuing Authority & Land/Address Registry',
    institutionalType: 'State Issuing Authority',
    sandboxUrl: 'https://mahabhulekh.gov.in/domicile/api/v1/verify',
    jurisdiction: 'State of Maharashtra',
    description: 'State statutory revenue authority responsible for issuing Domicile & Residence Certificates and maintaining municipal land and address registries under the Maharashtra Right to Public Services Act.',
    authType: 'State Single Sign-On / Gateway Token',
    slaTargetMs: 290,
    isSimulated: true,
    simulationNotice: 'Simulated local demonstration endpoint. Fictional address registry records; does not represent a live state portal connection.',
    contracts: [
      {
        sourceField: 'current_address',
        targetField: mappings.residence.current_address,
        type: 'string',
        description: 'Physical residential street address registered with the local authority.',
        required: true,
      },
      {
        sourceField: 'state_name',
        targetField: mappings.residence.state_name,
        type: 'string',
        description: 'State jurisdiction (e.g. Maharashtra).',
        required: true,
      },
      {
        sourceField: 'district_name',
        targetField: mappings.residence.district_name,
        type: 'string',
        description: 'Administrative revenue district name.',
        required: true,
      },
      {
        sourceField: 'postal_code',
        targetField: mappings.residence.postal_code,
        type: 'string',
        description: '6-digit Indian Postal PIN code.',
        required: true,
      },
      {
        sourceField: 'resident_since',
        targetField: mappings.residence.resident_since,
        type: 'number',
        description: 'Four-digit starting year of continuous residence in the state.',
        required: true,
      },
      {
        sourceField: 'domicile_verified',
        targetField: mappings.residence.domicile_verified,
        type: 'boolean',
        description: 'Whether formal state domicile status has been legally confirmed.',
        required: true,
      },
    ],
  },

  documents: {
    id: 'documents',
    name: 'DigiLocker National Document Exchange Platform',
    code: 'DL-VAULT',
    authority: 'Digital India Corporation (DIC), Ministry of Electronics & IT, Govt. of India',
    role: 'Digital Document Platform & Tamper-Evident Credential Exchange',
    institutionalType: 'Document Platform',
    sandboxUrl: 'https://api.digilocker.gov.in/public/v1/vault-records',
    jurisdiction: 'National (All India)',
    description: 'National digital document platform enabling instant, consent-based verification of issued certificates (caste, domicile, educational proofs). DigiLocker acts as the verification exchange; certificates are issued by their respective competent state and central authorities.',
    authType: 'DigiLocker Consent Gateway OAuth 2.0',
    slaTargetMs: 310,
    isSimulated: true,
    simulationNotice: 'Simulated local demonstration endpoint. Fictional document identifiers and proofs; does not connect to the live national document gateway.',
    contracts: [
      {
        sourceField: 'document_ref',
        targetField: mappings.documents.document_ref,
        type: 'string',
        description: 'Unique cryptographic document repository tracking identifier.',
        required: true,
      },
      {
        sourceField: 'document_type',
        targetField: mappings.documents.document_type,
        type: 'string',
        description: 'Certified category of the deposited legal record or credential.',
        required: true,
      },
      {
        sourceField: 'verified',
        targetField: mappings.documents.verified,
        type: 'boolean',
        description: 'Cryptographic hash authenticity status verified against the issuing authority.',
        required: true,
      },
      {
        sourceField: 'citizen_ref',
        targetField: mappings.documents.citizen_ref,
        type: 'string',
        description: 'Citizen identifier bound to the stored digital credential.',
        required: true,
      },
    ],
  },
};

export function getAllDepartments(): DepartmentApiMetadata[] {
  return Object.values(departmentRegistry);
}

export function getDepartmentMetadata(dept: Department): DepartmentApiMetadata {
  return departmentRegistry[dept];
}

