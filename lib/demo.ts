import type { Service } from './services';

export const departments = ['identity', 'education', 'income', 'residence'] as const;
export const allDepartments = [...departments, 'documents'] as const;
export type Department = typeof allDepartments[number];
export type { Service } from './services';

export const serviceDepartments: Record<Service, readonly Department[]> = {
  scholarship: departments,
  residence: ['identity', 'residence', 'documents'],
  'ration-card': ['identity', 'residence', 'income'],
  passport: ['identity', 'residence', 'documents'],
  pension: ['identity', 'income', 'residence'],
  'income-certificate': ['identity', 'income'],
  'caste-certificate': ['identity', 'residence', 'documents'],
};

export const citizens = [
  { id: 'DEMO-1001', name: 'Asha Sharma', description: 'Eligible student applicant (Age 20)', initials: 'AS' },
  { id: 'DEMO-1002', name: 'Rohan Patil', description: 'Income above standard limits (Age 20)', initials: 'RP' },
  { id: 'DEMO-1003', name: 'Meera Joshi', description: 'Conflicting birth dates between sources (Age 20)', initials: 'MJ' },
  { id: 'DEMO-1004', name: 'Devendra Sharma', description: 'Senior citizen pensioner (Age 68)', initials: 'DS' },
  { id: 'DEMO-1005', name: 'Sunita Kamble', description: 'Adult applicant with DigiLocker records (Age 32)', initials: 'SK' },
];

export const mappings: Record<Department, Record<string, string>> = {
  identity: { full_name: 'name', birth_date: 'dateOfBirth', citizen_ref: 'citizenId' },
  education: { student_name: 'name', dob: 'dateOfBirth', percentage: 'marks', institution: 'college', program: 'course' },
  income: { annual_income_inr: 'annualIncome', financial_year: 'financialYear' },
  residence: { current_address: 'address', state_name: 'state', district_name: 'district', postal_code: 'pin', resident_since: 'residenceSince', domicile_verified: 'domicileVerified' },
  documents: { document_ref: 'documentId', document_type: 'documentType', verified: 'documentVerified', citizen_ref: 'citizenId' },
};

export function sampleRecord(department: Department, citizenId: string) {
  const citizen = citizens.find((c) => c.id === citizenId);
  if (!citizen) throw new Error('Unknown demo citizen');

  const birthDates: Record<string, string> = {
    'DEMO-1001': '2006-04-12',
    'DEMO-1002': '2006-04-12',
    'DEMO-1003': '2006-02-18',
    'DEMO-1004': '1958-06-15',
    'DEMO-1005': '1994-08-20',
  };

  const eduDobs: Record<string, string> = {
    'DEMO-1001': '12/04/2006',
    'DEMO-1002': '12/04/2006',
    'DEMO-1003': '19/02/2006',
    'DEMO-1004': '15/06/1958',
    'DEMO-1005': '20/08/1994',
  };

  const incomes: Record<string, number> = {
    'DEMO-1001': 145000,
    'DEMO-1002': 420000,
    'DEMO-1003': 145000,
    'DEMO-1004': 85000,
    'DEMO-1005': 180000,
  };

  const marks: Record<string, number> = {
    'DEMO-1001': 88.5,
    'DEMO-1002': 76,
    'DEMO-1003': 88.5,
    'DEMO-1004': 64,
    'DEMO-1005': 81.2,
  };

  const residentSinceYears: Record<string, number> = {
    'DEMO-1001': 2018,
    'DEMO-1002': 2018,
    'DEMO-1003': 2018,
    'DEMO-1004': 1985,
    'DEMO-1005': 2012,
  };

  const records = {
    identity: {
      citizen_ref: citizenId,
      full_name: citizen.name,
      birth_date: birthDates[citizenId] || '2006-04-12',
      verified: true,
    },
    education: {
      student_name: citizen.name,
      dob: eduDobs[citizenId] || '12/04/2006',
      percentage: marks[citizenId] ?? 80,
      institution: citizenId === 'DEMO-1004' ? 'Maharashtra State Board' : 'Demo Institute of Technology',
      program: citizenId === 'DEMO-1004' ? 'Secondary School Certificate' : 'B.Tech · Computer Science',
      enrollment_status: citizenId === 'DEMO-1004' ? 'completed' : 'active',
    },
    income: {
      annual_income_inr: incomes[citizenId] ?? 145000,
      financial_year: '2026-27',
      certificate_ref: 'SAMPLE-INC-' + citizenId.slice(-4),
    },
    residence: {
      current_address: 'Flat 12, Andheri East',
      state_name: 'Maharashtra',
      district_name: 'Mumbai Suburban',
      postal_code: '400069',
      resident_since: residentSinceYears[citizenId] ?? 2018,
      domicile_verified: true,
    },
    documents: {
      document_ref: 'SAMPLE-ADDR-' + citizenId.slice(-4),
      document_type: citizenId === 'DEMO-1005' ? 'DigiLocker Community & Domicile Record' : 'Verified address proof',
      verified: true,
      citizen_ref: citizenId,
    },
  };
  return records[department];
}

export function normalize(department: Department, raw: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [source, target] of Object.entries(mappings[department])) {
    let value = raw[source];
    if (target === 'dateOfBirth' && typeof value === 'string' && value.includes('/')) {
      value = value.split('/').reverse().join('-');
    }
    result[target] = value;
  }
  return result;
}

export function assess(records: Record<string, Record<string, unknown>>) {
  const identity = records.identity || {};
  const education = records.education || {};
  const income = records.income || {};
  const residence = records.residence || {};
  const educationMarks = Number(education.marks);
  const annualIncome = Number(income.annualIncome);
  const rules = [
    { label: 'Identity matches academic record', passed: identity.dateOfBirth === education.dateOfBirth && identity.name === education.name, detail: 'Name and date of birth must agree across sources.' },
    { label: 'Academic score at least 75%', passed: educationMarks >= 75, detail: `${educationMarks}% verified by Education` },
    { label: 'Annual family income at most ₹2,50,000', passed: annualIncome <= 250000, detail: `₹${Number(annualIncome).toLocaleString('en-IN')} verified by Income` },
    { label: 'Verified Maharashtra domicile', passed: residence.state === 'Maharashtra' && residence.domicileVerified === true, detail: `${String(residence.state || '')} · ${String(residence.district || '')}` },
  ];
  const status = !rules[0].passed ? 'needs_review' : rules.every((r) => r.passed) ? 'eligible' : 'ineligible';
  return { status, rules, profile: { ...identity, ...education, ...income, ...residence, name: identity.name, dateOfBirth: identity.dateOfBirth } };
}
