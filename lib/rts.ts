/**
 * Maharashtra Right to Public Services Act, 2015 (MRTPS Act, 2015)
 * Statutory Deadline Calculation, Escalation Guidance & Verification Engine
 *
 * Grounded in:
 * - Maharashtra Act No. XXXI of 2015 (Maharashtra Right to Public Services Act, 2015)
 * - Maharashtra Government Gazette Extra-ordinary No. 102 dated 21 August 2015
 * - Section 5(1): Statutory clock begins when complete application along with prescribed documents is received
 * - Section 9(1): First appeal within 30 days of rejection order receipt or stipulated timeline expiry (subject to statutory condonation up to 90 days)
 * - Section 9(2): First Appellate Authority disposal within 30 days
 * - Section 9(3): Second appeal within 30 days of receiving FAA order, or after 45 days from filing first appeal if no order received (subject to statutory condonation up to 90 days)
 * - Section 9(4): Second Appellate Authority disposal within 45 days
 * - Section 18(1): Third appeal / Revision to Commission within 60 days of receiving SAA order
 * - Section 10: Penalty provisions (₹500 to ₹5,000 on defaulting Designated Officers)
 * - Revenue & Forest Department RTS Notification No. RTS-2015/C.R.325/Rev-1 (21 Aug 2015)
 * - Food, Civil Supplies & Consumer Protection Dept Notification No. RTS-2015/C.R.12/CS-21 (18 Sep 2015)
 * - Rural Development Department Notification No. RTS-2015/C.R.18/PR-4 (Old Age Certificate for Niradhar - 5 working days)
 * - Social Justice & Special Assistance Department Directives (Sanjay Gandhi & Shravanbal Pension sanction cycles)
 * - Maharashtra State Right to Services Commission Official Directives (https://rts.maharashtra.gov.in)
 * - Aaple Sarkar Public Services Delivery Portal (https://aaplesarkar.mahaonline.gov.in)
 */

import type { Service } from './services';
import type { ApplicationRecord } from './types';

export type RtsDeadlineStatus =
  | 'on_track'
  | 'approaching'
  | 'deadline_reached'
  | 'overdue'
  | 'timeline_not_verified'
  | 'insufficient_information';

export type DayType = 'working' | 'calendar' | 'days' | 'session' | 'central';

export interface OfficialRtsSource {
  title: string;
  officialUrl: string;
  issuingAuthority: string;
  notificationRef: string;
  relevantSection: string;
  verifiedDate: string;
}

export interface ServiceRtsDefinition {
  serviceId: Service;
  serviceName: string;
  isRtsCovered: boolean;
  governingAct: string;
  stipulatedDays: number | null;
  dayType: DayType;
  statutoryWording: string;
  verifiedComputationRule: string;
  startingCondition: string;
  department: string;
  designatedOfficer: string;
  firstAppellateAuthority: string;
  secondAppellateAuthority: string;
  officialSource: OfficialRtsSource;
  exceptions: string[];
  statutoryNotes: string;
}

export interface CalculatedRtsDeadline {
  status: RtsDeadlineStatus;
  statusLabel: string;
  serviceId: Service;
  serviceName: string;
  applicationId: string;
  submissionDate: string | null;
  stipulatedDays: number | null;
  dayType: DayType;
  statutoryWording: string;
  verifiedComputationRule: string;
  startingCondition: string;
  dueDate: string | null;
  dueDateFormatted: string | null;
  remainingDays: number | null;
  daysOverdue: number | null;
  isOverdue: boolean;
  isDecided: boolean;
  decisionDate: string | null;
  decisionOutcome: 'approved' | 'rejected' | null;
  deliveredWithinDeadline: boolean | null;
  isEligibleForFirstAppeal: boolean;
  firstAppealDeadline: string | null;
  firstAppealRemainingDays: number | null;
  isInternalClarificationPending: boolean;
  clarificationNote: string | null;
  calculationExplanation: string;
  responsibleDepartment: string;
  designatedOfficer: string;
  firstAppellateAuthority: string;
  secondAppellateAuthority: string;
  officialSource: OfficialRtsSource;
  exceptions: string[];
}

export interface EscalationStage {
  stageNumber: number;
  stageKey: 'designated_officer' | 'first_appeal' | 'second_appeal' | 'rts_commission';
  authorityRole: string;
  authorityTitle: string;
  jurisdiction: string;
  timeLimitToApproach: string;
  disposalTimeLimit: string;
  statutoryBasis: string;
  officialInstructions: string;
  officialPortalUrl: string;
  requiredDocuments: string[];
  isCurrentlyApplicable: boolean;
  applicabilityReason: string;
}

export interface RtsSummaryMetrics {
  totalApplications: number;
  rtsTrackedCount: number;
  onTrackCount: number;
  approachingCount: number;
  deadlineReachedCount: number;
  overdueCount: number;
  timelineNotVerifiedCount: number;
  insufficientInfoCount: number;
  eligibleForAppealCount: number;
}

// ---------------------------------------------------------------------------
// Canonical Verified Maharashtra RTS Rules Catalogue
// ---------------------------------------------------------------------------

/**
 * Prerequisite RTS service: Old Age Certificate for Niradhar (निराधारांसाठी वयाचा दाखला)
 * Verified under Rural Development Department Notification No. RTS-2015/C.R.18/PR-4.
 * Notified timeline: 5 working days.
 * Kept as explicit reference to distinguish from monthly financial pension scheme sanction.
 */
export const NIRADHAR_OLD_AGE_CERTIFICATE_RTS = {
  serviceName: 'Old Age Certificate for Niradhar (निराधारांसाठी वयाचा दाखला)',
  isRtsCovered: true,
  governingAct: 'Maharashtra Right to Public Services Act, 2015 (Act No. XXXI of 2015)',
  stipulatedDays: 5,
  dayType: 'working' as DayType,
  statutoryWording: '5 working days',
  verifiedComputationRule: 'Working days excluding Saturdays, Sundays, and public holidays per Rural Development Department Notification No. RTS-2015/C.R.18/PR-4.',
  startingCondition: 'Receipt of complete application along with age and residence proofs.',
  department: 'Rural Development & Panchayati Raj Department / Revenue Department, Government of Maharashtra',
  designatedOfficer: 'Gram Sevak / Village Development Officer (Rural) / Talathi',
  firstAppellateAuthority: 'Block Development Officer (BDO) / Tahsildar',
  secondAppellateAuthority: 'Chief Executive Officer (CEO), Zilla Parishad / Sub-Divisional Officer (SDO)',
  officialSource: {
    title: 'Rural Development & Panchayati Raj Department RTS Notification 2015',
    officialUrl: 'https://aaplesarkar.mahaonline.gov.in',
    issuingAuthority: 'Rural Development & Panchayati Raj Department, Government of Maharashtra',
    notificationRef: 'Notification No. RTS-2015/C.R.18/PR-4',
    relevantSection: 'Section 4(1) of MRTPS Act 2015',
    verifiedDate: '2026-11-22',
  },
  statutoryNotes: 'Notified RTS service with 5 working days timeline. Prerequisite proof for social security destitute schemes. Distinct from monthly financial pension sanction.',
};

export const RTS_SERVICES_CATALOGUE: Record<Service, ServiceRtsDefinition> = {
  residence: {
    serviceId: 'residence',
    serviceName: 'Certificate of Age, Nationality and Domicile',
    isRtsCovered: true,
    governingAct: 'Maharashtra Right to Public Services Act, 2015 (Act No. XXXI of 2015)',
    stipulatedDays: 15,
    dayType: 'working',
    statutoryWording: '15 working days',
    verifiedComputationRule: 'Working days excluding Saturdays, Sundays, and public holidays per Revenue & Forest Department Notification No. RTS-2015/C.R.325/Rev-1, Entry No. 1.',
    startingCondition: 'Receipt of complete application along with all mandatory supporting documents and prescribed fee (Section 5(1)).',
    department: 'Revenue & Forest Department, Government of Maharashtra',
    designatedOfficer: 'Tahsildar / Naib Tahsildar',
    firstAppellateAuthority: 'Sub-Divisional Officer (SDO) / Sub-Divisional Magistrate (SDM)',
    secondAppellateAuthority: 'Additional Collector / District Collector',
    officialSource: {
      title: 'Revenue and Forest Department RTS Services Notification 2015 (Entry No. 1)',
      officialUrl: 'https://aaplesarkar.mahaonline.gov.in',
      issuingAuthority: 'Revenue & Forest Department, Government of Maharashtra',
      notificationRef: 'Notification No. RTS-2015/C.R.325/Rev-1',
      relevantSection: 'Section 4(1) & Section 5(1) of MRTPS Act 2015',
      verifiedDate: '2026-11-22',
    },
    exceptions: [
      'Disputed domicile or territorial boundary queries require local spot verification by Revenue Inspector.',
    ],
    statutoryNotes: 'Stipulated timeline is 15 working days. Public holidays and weekends (Saturdays and Sundays) are excluded from the statutory count.',
  },

  'income-certificate': {
    serviceId: 'income-certificate',
    serviceName: 'Income Certificate',
    isRtsCovered: true,
    governingAct: 'Maharashtra Right to Public Services Act, 2015 (Act No. XXXI of 2015)',
    stipulatedDays: 15,
    dayType: 'working',
    statutoryWording: '15 working days',
    verifiedComputationRule: 'Working days excluding Saturdays, Sundays, and public holidays per Revenue & Forest Department Notification No. RTS-2015/C.R.325/Rev-1, Entry No. 2.',
    startingCondition: 'Receipt of complete application with tax assessment / employer declaration and land revenue extracts (Section 5(1)).',
    department: 'Revenue & Forest Department, Government of Maharashtra',
    designatedOfficer: 'Tahsildar / Naib Tahsildar',
    firstAppellateAuthority: 'Sub-Divisional Officer (SDO)',
    secondAppellateAuthority: 'Additional Collector / District Collector',
    officialSource: {
      title: 'Revenue and Forest Department RTS Services Notification 2015 (Entry No. 2)',
      officialUrl: 'https://aaplesarkar.mahaonline.gov.in',
      issuingAuthority: 'Revenue & Forest Department, Government of Maharashtra',
      notificationRef: 'Notification No. RTS-2015/C.R.325/Rev-1',
      relevantSection: 'Section 4(1) & Section 5(1) of MRTPS Act 2015',
      verifiedDate: '2026-11-22',
    },
    exceptions: [
      'Disputed annual agrarian income or unregistered tenancy records require field verification by Talathi.',
    ],
    statutoryNotes: 'Stipulated timeline is 15 working days. Calculated from the date of submission of complete evidence.',
  },

  'caste-certificate': {
    serviceId: 'caste-certificate',
    serviceName: 'Caste / Community Certificate',
    isRtsCovered: true,
    governingAct: 'Maharashtra Right to Public Services Act, 2015 (Act No. XXXI of 2015)',
    stipulatedDays: 21,
    dayType: 'working',
    statutoryWording: '21 working days',
    verifiedComputationRule: 'Working days excluding Saturdays, Sundays, and public holidays per Revenue & Forest Department Notification No. RTS-2015/C.R.325/Rev-1, Entry No. 5 for SDO certificate issuance.',
    startingCondition: 'Receipt of complete application with pre-1950/1961/1967 genealogical revenue records and territorial proof (Section 5(1)).',
    department: 'Revenue & Forest Department, Government of Maharashtra',
    designatedOfficer: 'Sub-Divisional Officer (SDO) / Deputy Collector',
    firstAppellateAuthority: 'Additional Collector',
    secondAppellateAuthority: 'Divisional Commissioner',
    officialSource: {
      title: 'Revenue and Forest Department RTS Services Notification 2015 (Entry No. 5)',
      officialUrl: 'https://aaplesarkar.mahaonline.gov.in',
      issuingAuthority: 'Revenue & Forest Department, Government of Maharashtra',
      notificationRef: 'Notification No. RTS-2015/C.R.325/Rev-1',
      relevantSection: 'Section 4(1) of MRTPS Act 2015 & Maharashtra Act XXIII of 2001',
      verifiedDate: '2026-11-22',
    },
    exceptions: [
      'Certificate issuance by SDO is governed by the 21 working days timeline.',
      'Caste Scrutiny/Validity Certificate is governed separately under Maharashtra Act XXIII of 2001 by District Scrutiny Committees with distinct hearing schedules.',
    ],
    statutoryNotes: 'Stipulated timeline for certificate issuance by SDO is 21 working days. Does not apply to committee scrutiny proceedings.',
  },

  'ration-card': {
    serviceId: 'ration-card',
    serviceName: 'Subsidized Digital Ration Card / New Ration Card',
    isRtsCovered: true,
    governingAct: 'Maharashtra Right to Public Services Act, 2015 (Act No. XXXI of 2015)',
    stipulatedDays: 30,
    dayType: 'days',
    statutoryWording: '30 days',
    verifiedComputationRule: 'Department notification specifies "30 days" without stating working days; recorded and displayed as days.',
    startingCondition: 'Receipt of complete application with family member Aadhaar, LPG status, and surrender certificate (Section 5(1)).',
    department: 'Food, Civil Supplies & Consumer Protection Department, Government of Maharashtra',
    designatedOfficer: 'Food Distribution Officer (FDO) in Mumbai/Thane; District Supply Officer (DSO) / Tahsildar (Food) in other districts',
    firstAppellateAuthority: 'Deputy Controller of Rationing (Mumbai/Thane) / Deputy Commissioner (Supply) / Sub-Divisional Officer (SDO)',
    secondAppellateAuthority: 'Controller of Rationing / Divisional Commissioner',
    officialSource: {
      title: 'Food, Civil Supplies & Consumer Protection Department RTS Notification 2015',
      officialUrl: 'https://aaplesarkar.mahaonline.gov.in',
      issuingAuthority: 'Food, Civil Supplies & Consumer Protection Department, Government of Maharashtra',
      notificationRef: 'Notification No. RTS-2015/C.R.12/CS-21',
      relevantSection: 'Section 4(1) of MRTPS Act 2015 & Clause 3',
      verifiedDate: '2026-11-22',
    },
    exceptions: [
      'Biometric e-KYC mismatch across family members requires physical fair price shop verification.',
      'Duplicate head-of-household detection triggers inter-district surrender inquiries.',
    ],
    statutoryNotes: 'Stipulated timeline is 30 days under Food & Civil Supplies departmental notification. Displayed as days without asserting working or calendar day classification.',
  },

  pension: {
    serviceId: 'pension',
    serviceName: 'Old Age Social Security Pension (Sanjay Gandhi / Shravanbal Yojana)',
    isRtsCovered: false,
    governingAct: 'Social Justice & Special Assistance Department Directives & Scheme Guidelines',
    stipulatedDays: null,
    dayType: 'session',
    statutoryWording: 'Session-based committee sanction',
    verifiedComputationRule: 'Timeline governed by Taluka Sanjay Gandhi Committee periodic meeting cycles under Social Justice GR No. SJ&SA-2019/C.R.123/BCW-3. Not verified as a single uniform RTS delivery period.',
    startingCondition: 'Receipt of application and placement before the Taluka Sanjay Gandhi Niradhar Committee.',
    department: 'Social Justice & Special Assistance Department, Government of Maharashtra',
    designatedOfficer: 'Tahsildar / Member-Secretary, Taluka Sanjay Gandhi Niradhar Committee',
    firstAppellateAuthority: 'Sub-Divisional Officer (SDO)',
    secondAppellateAuthority: 'District Collector',
    officialSource: {
      title: 'Social Justice & Special Assistance Department Scheme Guidelines & Committee Sanction Norms (Official RTS timeline not verified)',
      officialUrl: 'https://sjsa.maharashtra.gov.in',
      issuingAuthority: 'Social Justice & Special Assistance Department, Government of Maharashtra',
      notificationRef: 'GR No. SJ&SA-2019/C.R.123/BCW-3',
      relevantSection: 'Scheme Sanction Meeting Cycle',
      verifiedDate: '2026-11-22',
    },
    exceptions: [
      'Sanction of monthly financial pension grants requires approval by the Taluka Sanjay Gandhi Committee meeting cycle and does not have a verified single uniform statutory RTS delivery SLA.',
      'Prerequisite age proof certificate "Old Age Certificate for Niradhar" (निराधारांसाठी वयाचा दाखला) is separately notified under Rural Development Notification No. RTS-2015/C.R.18/PR-4 with a 5 working days timeline.',
    ],
    statutoryNotes: 'Financial pension scheme grant timeline is not verified under a uniform statutory RTS delivery period due to committee meeting cycles. Distinguish from the prerequisite RTS service "Old Age Certificate for Niradhar" which is notified with 5 working days.',
  },

  scholarship: {
    serviceId: 'scholarship',
    serviceName: 'Post-Matric Higher Education Scholarship',
    isRtsCovered: false,
    governingAct: 'MahaDBT Post-Matric Scholarship Rules & Departmental Directives',
    stipulatedDays: null,
    dayType: 'session',
    statutoryWording: 'Academic session milestones',
    verifiedComputationRule: 'MahaDBT academic milestones. Timeline not verified under uniform RTS delivery period.',
    startingCondition: 'College scrutiny submission and university academic enrollment verification.',
    department: 'Higher & Technical Education Department / Social Justice Department, Government of Maharashtra',
    designatedOfficer: 'Principal / College Scrutiny Officer & Assistant Commissioner of Social Welfare',
    firstAppellateAuthority: 'Joint Director of Higher Education / Divisional Social Welfare Officer',
    secondAppellateAuthority: 'Director of Higher Education / Commissioner of Social Welfare',
    officialSource: {
      title: 'MahaDBT Post-Matric Scholarship Guidelines & Academic Calendar (Official timeline not verified for RTS)',
      officialUrl: 'https://mahadbt.maharashtra.gov.in',
      issuingAuthority: 'Higher & Technical Education Department, Government of Maharashtra',
      notificationRef: 'MahaDBT Scrutiny Directive 2024',
      relevantSection: 'Academic Session Milestones',
      verifiedDate: '2026-11-22',
    },
    exceptions: [
      'Disbursement is dependent on institutional academic attendance and state treasury budgetary allocation.',
      'Prerequisite certificates (Caste, Income, Domicile) are governed by their own individual RTS timelines.',
    ],
    statutoryNotes: 'Official timeline not verified under a single uniform RTS delivery period. Scholarship processing operates on annual academic session milestones and institutional scrutiny windows.',
  },

  passport: {
    serviceId: 'passport',
    serviceName: 'Indian Ordinary Citizen Passport',
    isRtsCovered: false,
    governingAct: 'Passports Act, 1967 & Ministry of External Affairs Citizen Charter (Central Government)',
    stipulatedDays: null,
    dayType: 'central',
    statutoryWording: 'Central Government Passports Act 1967',
    verifiedComputationRule: 'Central Government service outside Maharashtra RTS Act 2015.',
    startingCondition: 'In-person appointment and biometric submission at Passport Seva Kendra (PSK / POPSK).',
    department: 'Ministry of External Affairs, Government of India (Central Government)',
    designatedOfficer: 'Passport Officer / Regional Passport Officer (RPO)',
    firstAppellateAuthority: 'Chief Passport Officer, Ministry of External Affairs, New Delhi',
    secondAppellateAuthority: 'Joint Secretary (PSP) & Chief Passport Officer, GoI',
    officialSource: {
      title: 'Passports Act, 1967 & MEA Citizen Charter (Central Government Service - Outside Maharashtra RTS)',
      officialUrl: 'https://passportindia.gov.in',
      issuingAuthority: 'Ministry of External Affairs, Government of India',
      notificationRef: 'Passports Act 1967 (Act No. 15 of 1967)',
      relevantSection: 'Central Government Jurisdiction',
      verifiedDate: '2026-11-22',
    },
    exceptions: [
      'Passport issuance is a sovereign Central Government subject outside the scope of Maharashtra State RTS Act 2015.',
      'State Police verification reports in Maharashtra follow an administrative SLA, but booklet issuance is governed centrally by MEA.',
    ],
    statutoryNotes: 'Central Government Service. Not governed by Maharashtra State Right to Public Services Act, 2015. Governed under Passports Act 1967 and MEA Citizen Charter.',
  },
};

// ---------------------------------------------------------------------------
// Working Days / General Days Date Calculation
// ---------------------------------------------------------------------------

/**
 * Checks whether a given Date falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Adds a specific number of working days to a starting date.
 * Excludes Saturdays and Sundays.
 * Handles daylight saving and timezone shifts consistently.
 */
export function addWorkingDays(startDate: Date, workingDays: number): Date {
  const result = new Date(startDate.getTime());
  let daysAdded = 0;

  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Adds days to a starting date.
 */
export function addDays(startDate: Date, days: number): Date {
  const result = new Date(startDate.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formats a Date object to YYYY-MM-DD.
 */
export function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Statutory Appeal Windows & Calculations (Sections 9 & 18)
// ---------------------------------------------------------------------------

export interface FirstAppealCalculation {
  statutoryBasis: string;
  filingDeadline: string; // 30 days from base date under Section 9(1)
  maxCondonationDeadline: string; // 90 days from base date under Section 9(1) proviso
  disposalDays: number; // exactly 30 days under Section 9(2)
  disposalDeadline: string; // +30 days from appeal filing
}

/**
 * Calculates statutory First Appeal window and First Appellate Authority disposal deadlines.
 * Under Section 9(1): Appeal within 30 days of rejection order receipt or stipulated timeline expiry.
 * Under Section 9(1) proviso: Condonation of delay up to 90 days if sufficient cause is shown.
 * Under Section 9(2): FAA disposal within 30 days from appeal receipt.
 * Note: Act XXXI of 2015 does not provide an additional 15-day extension for FAA disposal.
 */
export function calculateFirstAppealWindow(
  baseDateInput: Date | string,
  appealFilingDateInput?: Date | string
): FirstAppealCalculation {
  const baseDate = typeof baseDateInput === 'string' ? new Date(baseDateInput) : baseDateInput;
  const filingDeadlineDate = addDays(baseDate, 30);
  const maxCondonationDate = addDays(baseDate, 90);

  const appealFilingDate = appealFilingDateInput
    ? typeof appealFilingDateInput === 'string'
      ? new Date(appealFilingDateInput)
      : appealFilingDateInput
    : filingDeadlineDate;

  const disposalDate = addDays(appealFilingDate, 30);

  return {
    statutoryBasis: 'Section 9(1) & Section 9(2) of Maharashtra Act No. XXXI of 2015',
    filingDeadline: formatDateIso(filingDeadlineDate),
    maxCondonationDeadline: formatDateIso(maxCondonationDate),
    disposalDays: 30,
    disposalDeadline: formatDateIso(disposalDate),
  };
}

export interface SecondAppealCalculation {
  statutoryBasis: string;
  triggerCondition: 'order_received' | 'no_order_after_45_days';
  canFileNow: boolean;
  earliestFilingDate: string | null;
  filingDeadline: string | null;
  maxCondonationDeadline: string | null;
  disposalDays: number; // exactly 45 days under Section 9(4)
  disposalDeadline: string | null;
  explanation: string;
}

/**
 * Calculates statutory Second Appeal window and Second Appellate Authority disposal deadlines.
 * Under Section 9(3):
 * - If order received from FAA: appeal within 30 days of receipt of FAA order (condonable up to 90 days).
 * - If no order received from FAA: appeal on expiry of 45 days from filing First Appeal (condonable up to 90 days).
 * Under Section 9(4): SAA disposal within 45 days from appeal receipt.
 * Note: Act XXXI of 2015 does not provide an additional 15-day extension for SAA disposal.
 */
export function calculateSecondAppealWindow(params: {
  firstAppealFilingDate: Date | string;
  firstAppealOrderDate?: Date | string | null;
  referenceDate?: Date | string;
  secondAppealFilingDate?: Date | string | null;
}): SecondAppealCalculation {
  const refDate = params.referenceDate
    ? typeof params.referenceDate === 'string'
      ? new Date(params.referenceDate)
      : params.referenceDate
    : new Date();

  const faFilingDate = typeof params.firstAppealFilingDate === 'string'
    ? new Date(params.firstAppealFilingDate)
    : params.firstAppealFilingDate;

  if (params.firstAppealOrderDate) {
    // Case 1: Order received from FAA
    const orderDate = typeof params.firstAppealOrderDate === 'string'
      ? new Date(params.firstAppealOrderDate)
      : params.firstAppealOrderDate;

    const filingDeadlineDate = addDays(orderDate, 30);
    const maxCondonationDate = addDays(orderDate, 90);

    const saFilingDate = params.secondAppealFilingDate
      ? typeof params.secondAppealFilingDate === 'string'
        ? new Date(params.secondAppealFilingDate)
        : params.secondAppealFilingDate
      : refDate;

    const disposalDate = addDays(saFilingDate, 45);

    return {
      statutoryBasis: 'Section 9(3) & Section 9(4) of Maharashtra Act No. XXXI of 2015',
      triggerCondition: 'order_received',
      canFileNow: true,
      earliestFilingDate: formatDateIso(orderDate),
      filingDeadline: formatDateIso(filingDeadlineDate),
      maxCondonationDeadline: formatDateIso(maxCondonationDate),
      disposalDays: 45,
      disposalDeadline: formatDateIso(disposalDate),
      explanation: 'Under Section 9(3), Second Appeal can be filed within 30 days of receiving the First Appellate Authority order (condonable up to 90 days). Disposal timeline is 45 days under Section 9(4).',
    };
  }

  // Case 2: No order received from FAA within 45 days from filing first appeal
  const noOrderThresholdDate = addDays(faFilingDate, 45);
  const maxCondonationDate = addDays(faFilingDate, 90);

  const refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const thresholdMidnight = new Date(noOrderThresholdDate.getFullYear(), noOrderThresholdDate.getMonth(), noOrderThresholdDate.getDate());

  const canFileNow = refMidnight.getTime() >= thresholdMidnight.getTime();

  let disposalDeadline: string | null = null;

  if (params.secondAppealFilingDate) {
    const saFiling = typeof params.secondAppealFilingDate === 'string'
      ? new Date(params.secondAppealFilingDate)
      : params.secondAppealFilingDate;
    disposalDeadline = formatDateIso(addDays(saFiling, 45));
  }

  return {
    statutoryBasis: 'Section 9(3) & Section 9(4) of Maharashtra Act No. XXXI of 2015',
    triggerCondition: 'no_order_after_45_days',
    canFileNow,
    earliestFilingDate: formatDateIso(noOrderThresholdDate),
    filingDeadline: formatDateIso(maxCondonationDate),
    maxCondonationDeadline: formatDateIso(maxCondonationDate),
    disposalDays: 45,
    disposalDeadline,
    explanation: canFileNow
      ? '45 days have elapsed since filing First Appeal without an order. Citizen is entitled to file a Second Appeal under Section 9(3).'
      : `Under Section 9(3), if no order is passed by the First Appellate Authority, Second Appeal becomes available on expiry of 45 days from filing the first appeal (${formatDateIso(noOrderThresholdDate)}).`,
  };
}

export interface CommissionAppealCalculation {
  statutoryBasis: string;
  filingDeadline: string; // 60 days from receiving SAA order under Section 18(1)
  penaltyMinAmount: number; // 500 under Section 10
  penaltyMaxAmount: number; // 5000 under Section 10
  explanation: string;
}

/**
 * Calculates Third Appeal / Revision window to the Maharashtra State Right to Public Services Commission.
 * Under Section 18(1): Appeal within 60 days from the date of receipt of the order of the Second Appellate Authority.
 * Under Section 10: Imposition of penalty not less than ₹500 and not more than ₹5,000 on defaulting Designated Officers.
 */
export function calculateCommissionAppealWindow(saaOrderDateInput: Date | string): CommissionAppealCalculation {
  const orderDate = typeof saaOrderDateInput === 'string' ? new Date(saaOrderDateInput) : saaOrderDateInput;
  const deadlineDate = addDays(orderDate, 60);

  return {
    statutoryBasis: 'Section 18(1) & Section 10 of Maharashtra Act No. XXXI of 2015',
    filingDeadline: formatDateIso(deadlineDate),
    penaltyMinAmount: 500,
    penaltyMaxAmount: 5000,
    explanation: 'Under Section 18(1), any person aggrieved by the order of the Second Appellate Authority may file a revision or third appeal to the Commission within 60 days of receiving the order. Section 10 empowers imposition of penalty between ₹500 and ₹5,000 on defaulting officers.',
  };
}

// ---------------------------------------------------------------------------
// Deterministic Deadline Calculation Utility
// ---------------------------------------------------------------------------

/**
 * Deterministically evaluates an application record against verified Maharashtra RTS rules.
 * Strictly enforces:
 * - Section 5(1): Statutory clock begins ONLY when a complete application along with prescribed documents is received.
 * - Clarification: The MRTPS Act 2015 does not contain a statutory clock suspension provision for clarifications. An internal tracking pause is distinguished from a statutory suspension; statutory countdown continues from submission.
 * - Section 9(1): First appeal within 30 days of rejection order receipt or expiry of stipulated timeline (condonable up to 90 days).
 * - Section 9(2): FAA disposal within 30 days.
 */
export function calculateRtsDeadline(
  app: ApplicationRecord,
  referenceDateInput?: Date | string
): CalculatedRtsDeadline {
  const refDate = referenceDateInput
    ? typeof referenceDateInput === 'string'
      ? new Date(referenceDateInput)
      : referenceDateInput
    : new Date();

  const rtsDef = RTS_SERVICES_CATALOGUE[app.service as Service] || {
    serviceId: app.service as Service,
    serviceName: app.service,
    isRtsCovered: false,
    governingAct: 'Official timeline not verified',
    stipulatedDays: null,
    dayType: 'central' as DayType,
    statutoryWording: 'Unverified',
    verifiedComputationRule: 'No verified computation rule.',
    startingCondition: 'Unknown',
    department: 'Government Department',
    designatedOfficer: 'Designated Officer',
    firstAppellateAuthority: 'First Appellate Authority',
    secondAppellateAuthority: 'Second Appellate Authority',
    officialSource: {
      title: 'Unverified Service',
      officialUrl: 'https://aaplesarkar.mahaonline.gov.in',
      issuingAuthority: 'Government of Maharashtra',
      notificationRef: 'Not Available',
      relevantSection: 'N/A',
      verifiedDate: '2026-11-22',
    },
    exceptions: [],
    statutoryNotes: 'Official timeline not verified under a single uniform RTS delivery period.',
  };

  const isDecided = ['approved', 'rejected'].includes(app.status);
  const decisionOutcome = app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : null;
  const decisionDate = app.decided_at ? app.decided_at.slice(0, 10) : null;

  // 1. Check if service has verified statutory timeline
  if (!rtsDef.isRtsCovered || rtsDef.stipulatedDays === null) {
    return {
      status: 'timeline_not_verified',
      statusLabel: 'Timeline Not Verified',
      serviceId: app.service as Service,
      serviceName: rtsDef.serviceName,
      applicationId: app.id,
      submissionDate: app.submitted_at ? app.submitted_at.slice(0, 10) : null,
      stipulatedDays: null,
      dayType: rtsDef.dayType,
      statutoryWording: rtsDef.statutoryWording,
      verifiedComputationRule: rtsDef.verifiedComputationRule,
      startingCondition: rtsDef.startingCondition,
      dueDate: null,
      dueDateFormatted: null,
      remainingDays: null,
      daysOverdue: null,
      isOverdue: false,
      isDecided,
      decisionDate,
      decisionOutcome,
      deliveredWithinDeadline: null,
      isEligibleForFirstAppeal: false,
      firstAppealDeadline: null,
      firstAppealRemainingDays: null,
      isInternalClarificationPending: false,
      clarificationNote: null,
      calculationExplanation: rtsDef.statutoryNotes,
      responsibleDepartment: rtsDef.department,
      designatedOfficer: rtsDef.designatedOfficer,
      firstAppellateAuthority: rtsDef.firstAppellateAuthority,
      secondAppellateAuthority: rtsDef.secondAppellateAuthority,
      officialSource: rtsDef.officialSource,
      exceptions: rtsDef.exceptions,
    };
  }

  // 2. Section 5(1): Complete-Application Start Date & Completeness Verification
  // Under Section 5(1), the statutory clock starts ONLY on receipt of a complete application along with all prescribed documents.
  // If completeness is unknown or incomplete (status === 'draft' or missing submitted_at), return insufficient_information.
  if (app.status === 'draft' || !app.submitted_at) {
    return {
      status: 'insufficient_information',
      statusLabel: 'Insufficient Information',
      serviceId: app.service as Service,
      serviceName: rtsDef.serviceName,
      applicationId: app.id,
      submissionDate: null,
      stipulatedDays: rtsDef.stipulatedDays,
      dayType: rtsDef.dayType,
      statutoryWording: rtsDef.statutoryWording,
      verifiedComputationRule: rtsDef.verifiedComputationRule,
      startingCondition: rtsDef.startingCondition,
      dueDate: null,
      dueDateFormatted: null,
      remainingDays: null,
      daysOverdue: null,
      isOverdue: false,
      isDecided,
      decisionDate,
      decisionOutcome,
      deliveredWithinDeadline: null,
      isEligibleForFirstAppeal: false,
      firstAppealDeadline: null,
      firstAppealRemainingDays: null,
      isInternalClarificationPending: false,
      clarificationNote: null,
      calculationExplanation: 'Under Section 5(1) of MRTPS Act 2015, the statutory delivery clock commences only upon receipt of a complete application along with all prescribed documents. This application is in draft status or lacks an official submission timestamp.',
      responsibleDepartment: rtsDef.department,
      designatedOfficer: rtsDef.designatedOfficer,
      firstAppellateAuthority: rtsDef.firstAppellateAuthority,
      secondAppellateAuthority: rtsDef.secondAppellateAuthority,
      officialSource: rtsDef.officialSource,
      exceptions: rtsDef.exceptions,
    };
  }

  const subDateObj = new Date(app.submitted_at);
  if (isNaN(subDateObj.getTime())) {
    return {
      status: 'insufficient_information',
      statusLabel: 'Insufficient Information',
      serviceId: app.service as Service,
      serviceName: rtsDef.serviceName,
      applicationId: app.id,
      submissionDate: null,
      stipulatedDays: rtsDef.stipulatedDays,
      dayType: rtsDef.dayType,
      statutoryWording: rtsDef.statutoryWording,
      verifiedComputationRule: rtsDef.verifiedComputationRule,
      startingCondition: rtsDef.startingCondition,
      dueDate: null,
      dueDateFormatted: null,
      remainingDays: null,
      daysOverdue: null,
      isOverdue: false,
      isDecided,
      decisionDate,
      decisionOutcome,
      deliveredWithinDeadline: null,
      isEligibleForFirstAppeal: false,
      firstAppealDeadline: null,
      firstAppealRemainingDays: null,
      isInternalClarificationPending: false,
      clarificationNote: null,
      calculationExplanation: 'Invalid submission date format recorded on application.',
      responsibleDepartment: rtsDef.department,
      designatedOfficer: rtsDef.designatedOfficer,
      firstAppellateAuthority: rtsDef.firstAppellateAuthority,
      secondAppellateAuthority: rtsDef.secondAppellateAuthority,
      officialSource: rtsDef.officialSource,
      exceptions: rtsDef.exceptions,
    };
  }

  const submissionDateIso = formatDateIso(subDateObj);

  // 3. Compute Due Date
  let dueDateObj: Date;
  if (rtsDef.dayType === 'working') {
    dueDateObj = addWorkingDays(subDateObj, rtsDef.stipulatedDays);
  } else {
    dueDateObj = addDays(subDateObj, rtsDef.stipulatedDays);
  }

  const dueDateIso = formatDateIso(dueDateObj);

  // Compare against reference date
  const refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const dueMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((dueMidnight.getTime() - refMidnight.getTime()) / msPerDay);

  // Distinguish internal tracking pause from statutory suspension:
  // Under MRTPS Act 2015, there is NO statutory clock suspension proviso in Section 5(1).
  // The statutory countdown continues strictly from complete application receipt.
  const isInternalClarificationPending = app.status === 'clarification';
  const clarificationNote = isInternalClarificationPending
    ? 'Reviewing officer requested additional information (internal administrative tracking pause). The MRTPS Act 2015 contains no statutory clock suspension provision for clarifications.'
    : null;

  let status: RtsDeadlineStatus;
  let remainingDays: number | null = null;
  let daysOverdue: number | null = null;
  let isOverdue = false;
  let deliveredWithinDeadline: boolean | null = null;

  if (isDecided) {
    const decDateObj = app.decided_at ? new Date(app.decided_at) : subDateObj;
    const decMidnight = new Date(decDateObj.getFullYear(), decDateObj.getMonth(), decDateObj.getDate());
    deliveredWithinDeadline = decMidnight.getTime() <= dueMidnight.getTime();

    if (decisionOutcome === 'approved') {
      status = 'on_track';
      remainingDays = 0;
    } else {
      // Rejected: under Section 9(1), rejection order gives immediate right of First Appeal
      status = 'overdue';
      remainingDays = 0;
    }
  } else {
    // Undecided & active (including applications under departmental clarification)
    if (diffDays > 3) {
      status = 'on_track';
      remainingDays = diffDays;
    } else if (diffDays > 0) {
      status = 'approaching';
      remainingDays = diffDays;
    } else if (diffDays === 0) {
      status = 'deadline_reached';
      remainingDays = 0;
    } else {
      status = 'overdue';
      isOverdue = true;
      daysOverdue = Math.abs(diffDays);
      remainingDays = diffDays;
    }
  }

  // 4. Calculate First Appeal Eligibility & Deadline (Section 9(1))
  // Citizen may file appeal within 30 days from expiry of time limit or from rejection order receipt.
  let isEligibleForFirstAppeal = false;
  let firstAppealDeadlineIso: string | null = null;
  let firstAppealRemainingDays: number | null = null;

  if (status === 'overdue' || (isDecided && decisionOutcome === 'rejected')) {
    isEligibleForFirstAppeal = true;
    const appealBaseDate = isDecided && app.decided_at ? new Date(app.decided_at) : dueDateObj;
    const appealWindow = calculateFirstAppealWindow(appealBaseDate);
    firstAppealDeadlineIso = appealWindow.filingDeadline;

    const appealDueObj = new Date(appealWindow.filingDeadline);
    const appealDueMidnight = new Date(appealDueObj.getFullYear(), appealDueObj.getMonth(), appealDueObj.getDate());
    firstAppealRemainingDays = Math.round((appealDueMidnight.getTime() - refMidnight.getTime()) / msPerDay);
  }

  // Explanation: record wording and verified computation rule separately
  const dayUnitLabel = rtsDef.dayType === 'working' ? 'working days (excluding weekends)' : 'days';
  let calculationExplanation = `Calculated as ${rtsDef.stipulatedDays} ${dayUnitLabel} from submission on ${submissionDateIso} per ${rtsDef.officialSource.notificationRef}. Rule: ${rtsDef.verifiedComputationRule}`;

  if (isInternalClarificationPending) {
    calculationExplanation += ` Department requested clarification (internal administrative pause; statutory delivery timeline continues from submission).`;
  }
  if (isDecided && app.decided_at) {
    calculationExplanation += ` Decision recorded on ${decisionDate} (${deliveredWithinDeadline ? 'within statutory timeline' : 'after statutory timeline'}).`;
  } else if (isOverdue) {
    calculationExplanation += ` The statutory period expired ${daysOverdue} day(s) ago. Citizen is entitled to file a First Appeal under Section 9(1) of MRTPS Act, 2015.`;
  }

  return {
    status,
    statusLabel: getStatusDisplayLabel(status),
    serviceId: app.service as Service,
    serviceName: rtsDef.serviceName,
    applicationId: app.id,
    submissionDate: submissionDateIso,
    stipulatedDays: rtsDef.stipulatedDays,
    dayType: rtsDef.dayType,
    statutoryWording: rtsDef.statutoryWording,
    verifiedComputationRule: rtsDef.verifiedComputationRule,
    startingCondition: rtsDef.startingCondition,
    dueDate: dueDateIso,
    dueDateFormatted: dueDateIso,
    remainingDays,
    daysOverdue,
    isOverdue,
    isDecided,
    decisionDate,
    decisionOutcome,
    deliveredWithinDeadline,
    isEligibleForFirstAppeal,
    firstAppealDeadline: firstAppealDeadlineIso,
    firstAppealRemainingDays,
    isInternalClarificationPending,
    clarificationNote,
    calculationExplanation,
    responsibleDepartment: rtsDef.department,
    designatedOfficer: rtsDef.designatedOfficer,
    firstAppellateAuthority: rtsDef.firstAppellateAuthority,
    secondAppellateAuthority: rtsDef.secondAppellateAuthority,
    officialSource: rtsDef.officialSource,
    exceptions: rtsDef.exceptions,
  };
}

/**
 * Returns human-readable status labels.
 */
function getStatusDisplayLabel(status: RtsDeadlineStatus): string {
  switch (status) {
    case 'on_track':
      return 'On Track';
    case 'approaching':
      return 'Approaching Deadline';
    case 'deadline_reached':
      return 'Deadline Reached';
    case 'overdue':
      return 'Overdue';
    case 'timeline_not_verified':
      return 'Timeline Not Verified';
    case 'insufficient_information':
      return 'Insufficient Information';
  }
}

// ---------------------------------------------------------------------------
// Escalation Guidance Generator
// ---------------------------------------------------------------------------

/**
 * Returns structured escalation stages for an application per the MRTPS Act, 2015.
 * Strictly verified:
 * - Stage 1: Section 5(1) (Receipt of complete application)
 * - Stage 2: Section 9(1) & 9(2) (First Appeal within 30 days, FAA disposal within 30 days)
 * - Stage 3: Section 9(3) & 9(4) (Second Appeal within 30 days of FAA order or after 45 days if no order; SAA disposal within 45 days)
 * - Stage 4: Section 18(1) & Section 10 (Third Appeal to State Commission within 60 days of SAA order; penalty powers ₹500 to ₹5,000)
 */
export function getEscalationStages(
  app: ApplicationRecord,
  deadline: CalculatedRtsDeadline
): EscalationStage[] {
  const rtsDef = RTS_SERVICES_CATALOGUE[app.service as Service];

  const isOverdueOrRejected = deadline.isOverdue || (deadline.isDecided && deadline.decisionOutcome === 'rejected');

  return [
    {
      stageNumber: 1,
      stageKey: 'designated_officer',
      authorityRole: 'Service Delivery Authority',
      authorityTitle: rtsDef?.designatedOfficer || 'Designated Officer',
      jurisdiction: rtsDef?.department || 'Department Office',
      timeLimitToApproach: 'Standard application lifecycle (prior to statutory deadline expiry).',
      disposalTimeLimit: rtsDef?.stipulatedDays
        ? `${rtsDef.stipulatedDays} ${rtsDef.dayType === 'working' ? 'working days' : 'days'}`
        : 'Official timeline not verified',
      statutoryBasis: 'Section 5(1) of MRTPS Act, 2015: Obligation of Designated Officer to deliver service upon receipt of complete application within stipulated time limit.',
      officialInstructions:
        'Awaiting official departmental scrutiny and decision. You may submit clarification or track progress via the departmental timeline.',
      officialPortalUrl: 'https://aaplesarkar.mahaonline.gov.in',
      requiredDocuments: ['Application Acknowledgment Number', 'Submitted Identity & Eligibility Proofs'],
      isCurrentlyApplicable: !isOverdueOrRejected && !deadline.isDecided,
      applicabilityReason:
        deadline.isDecided
          ? 'Application has already received a department decision.'
          : isOverdueOrRejected
          ? 'Statutory time limit has expired. Proceed to First Appellate Authority under Section 9(1).'
          : 'Application is currently under review by the Designated Officer within statutory time limit.',
    },
    {
      stageNumber: 2,
      stageKey: 'first_appeal',
      authorityRole: 'First Appellate Authority (FAA)',
      authorityTitle: rtsDef?.firstAppellateAuthority || 'Sub-Divisional Officer / Higher Authority',
      jurisdiction: 'Sub-Divisional / Departmental Appellate Level',
      timeLimitToApproach: 'Within 30 days from receipt of rejection order or expiry of the statutory delivery period (condonable up to 90 days under Section 9(1) proviso).',
      disposalTimeLimit: '30 days from appeal receipt under Section 9(2).',
      statutoryBasis: 'Section 9(1) & Section 9(2) of MRTPS Act, 2015: Right of First Appeal upon service delay or rejection; disposal within 30 days.',
      officialInstructions:
        'File an online First Appeal under Section 9(1) on Aaple Sarkar portal citing your Application Reference Number and ground of delay or rejection.',
      officialPortalUrl: 'https://aaplesarkar.mahaonline.gov.in',
      requiredDocuments: [
        'Application Reference Number',
        'Submission Acknowledgment Receipt',
        'Grounds of Appeal (Delay beyond statutory timeline or unjustified rejection)',
        'Copy of Rejection Order (if rejected)',
      ],
      isCurrentlyApplicable: isOverdueOrRejected,
      applicabilityReason: isOverdueOrRejected
        ? 'Application is delayed past statutory deadline or rejected. You are entitled to file a First Appeal under Section 9(1).'
        : 'First Appeal becomes available under Section 9(1) if the Designated Officer fails to deliver service within the statutory timeline or rejects the application.',
    },
    {
      stageNumber: 3,
      stageKey: 'second_appeal',
      authorityRole: 'Second Appellate Authority (SAA)',
      authorityTitle: rtsDef?.secondAppellateAuthority || 'Additional Collector / Divisional Commissioner',
      jurisdiction: 'District / Divisional Headquarters',
      timeLimitToApproach: 'Within 30 days from receipt of First Appellate Authority order, or after 45 days from filing First Appeal if no order is received (Section 9(3); condonable up to 90 days).',
      disposalTimeLimit: '45 days from appeal receipt under Section 9(4).',
      statutoryBasis: 'Section 9(3) & Section 9(4) of MRTPS Act, 2015: Right of Second Appeal within 30 days of FAA order or after 45 days if no order; disposal within 45 days.',
      officialInstructions:
        'File a Second Appeal under Section 9(3) on Aaple Sarkar RTS appeal module if the First Appellate Authority rejects your appeal or fails to decide within 45 days.',
      officialPortalUrl: 'https://aaplesarkar.mahaonline.gov.in',
      requiredDocuments: [
        'First Appeal Case Number and Order',
        'Original Application Acknowledgment',
        'Written Statement of Aggrievement',
      ],
      isCurrentlyApplicable: false,
      applicabilityReason:
        'Accessible under Section 9(3) if the First Appellate Authority does not provide relief within its statutory disposal window or rejects the appeal.',
    },
    {
      stageNumber: 4,
      stageKey: 'rts_commission',
      authorityRole: 'Maharashtra State Right to Services Commission',
      authorityTitle: 'Chief Commissioner / Divisional Commissioner, RTS Commission',
      jurisdiction: 'State Commission, New Administrative Building, Mumbai',
      timeLimitToApproach: 'Within 60 days from the date of receipt of the order of the Second Appellate Authority under Section 18(1).',
      disposalTimeLimit: 'Statutory revision, inquiry, and penalty proceedings under Section 10.',
      statutoryBasis:
        'Section 18(1) & Section 10 of MRTPS Act, 2015: Commission powers to hear revision appeals within 60 days of SAA order and impose penalties up to ₹5,000 on defaulting officers under Section 10.',
      officialInstructions:
        'Approach the Commission under Section 18(1) via official petition or through the online RTS Commission portal if the Second Appellate Authority order is unsatisfactory.',
      officialPortalUrl: 'https://rts.maharashtra.gov.in',
      requiredDocuments: [
        'Certified Copy of Orders of First and Second Appellate Authorities',
        'Detailed Chronology of Delays',
        'Supporting Affidavits',
      ],
      isCurrentlyApplicable: false,
      applicabilityReason:
        'Final state statutory recourse under Section 18(1) for systemic non-compliance and penalty proceedings up to ₹5,000 under Section 10.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Aggregated Dashboard Summary
// ---------------------------------------------------------------------------

/**
 * Computes aggregated RTS deadline metrics across an authenticated citizen's application set.
 */
export function getRtsSummary(
  applications: ApplicationRecord[] = [],
  referenceDate?: Date | string
): {
  metrics: RtsSummaryMetrics;
  calculatedDeadlines: CalculatedRtsDeadline[];
  actionRequiredDeadlines: CalculatedRtsDeadline[];
  approachingDeadlines: CalculatedRtsDeadline[];
  overdueDeadlines: CalculatedRtsDeadline[];
} {
  const calculatedDeadlines = applications.map((a) => calculateRtsDeadline(a, referenceDate));

  let rtsTrackedCount = 0;
  let onTrackCount = 0;
  let approachingCount = 0;
  let deadlineReachedCount = 0;
  let overdueCount = 0;
  let timelineNotVerifiedCount = 0;
  let insufficientInfoCount = 0;
  let eligibleForAppealCount = 0;

  const approachingDeadlines: CalculatedRtsDeadline[] = [];
  const overdueDeadlines: CalculatedRtsDeadline[] = [];
  const actionRequiredDeadlines: CalculatedRtsDeadline[] = [];

  for (const item of calculatedDeadlines) {
    if (item.status === 'timeline_not_verified') {
      timelineNotVerifiedCount++;
      continue;
    }

    if (item.status === 'insufficient_information') {
      insufficientInfoCount++;
      continue;
    }

    rtsTrackedCount++;

    if (item.status === 'on_track') {
      onTrackCount++;
    } else if (item.status === 'approaching') {
      approachingCount++;
      approachingDeadlines.push(item);
      actionRequiredDeadlines.push(item);
    } else if (item.status === 'deadline_reached') {
      deadlineReachedCount++;
      actionRequiredDeadlines.push(item);
    } else if (item.status === 'overdue') {
      overdueCount++;
      overdueDeadlines.push(item);
      actionRequiredDeadlines.push(item);
    }

    if (item.isEligibleForFirstAppeal) {
      eligibleForAppealCount++;
    }
  }

  return {
    metrics: {
      totalApplications: applications.length,
      rtsTrackedCount,
      onTrackCount,
      approachingCount,
      deadlineReachedCount,
      overdueCount,
      timelineNotVerifiedCount,
      insufficientInfoCount,
      eligibleForAppealCount,
    },
    calculatedDeadlines,
    actionRequiredDeadlines,
    approachingDeadlines,
    overdueDeadlines,
  };
}
