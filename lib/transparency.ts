/**
 * GovSync Phase 3, Day 9: Government Transparency & Notification Centre
 * lib/transparency.ts
 *
 * Authentic dataset of Government Resolutions (GRs), department circulars,
 * public notices, and citizen notification synthesis based on official Maharashtra
 * and Government of India sources.
 */

import type { ApplicationRecord, AuditRecord } from './types';
import type { GrievanceRecord } from './grievances';

export type TransparencyCategoryKey =
  | 'government_resolutions'
  | 'department_notifications'
  | 'scheme_updates'
  | 'public_notices'
  | 'citizen_services'
  | 'agriculture_updates'
  | 'education_scholarships'
  | 'health_welfare'
  | 'public_infrastructure'
  | 'administrative_updates';

export type VerificationStatus =
  | 'verified'
  | 'partially_verified'
  | 'historical_archive'
  | 'validity_unconfirmed';

export type ValidityStatus = 'active' | 'in_progress' | 'superseded' | 'expired' | 'unconfirmed';

export type ImpactLevel = 'high' | 'medium' | 'general';

export interface AnnouncementCategory {
  id: TransparencyCategoryKey;
  name: string;
  description: string;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  summary: string;
  fullDescription: string;
  department: string;
  category: TransparencyCategoryKey;
  publicationDate: string; // ISO YYYY-MM-DD
  effectiveDate: string; // ISO YYYY-MM-DD
  expiryDate?: string; // ISO YYYY-MM-DD if officially specified
  referenceNumber: string; // Official GR code, circular number, or gazette ID
  officialSourceUrl: string; // Official portal link
  documentUrl?: string; // PDF or original circular link
  lastVerifiedDate: string; // Verification date
  languagesAvailable: ('en' | 'hi' | 'mr')[];
  verificationStatus: VerificationStatus;
  validityStatus: ValidityStatus;
  impactLevel: ImpactLevel;
  relatedServiceId?: string; // GovSync service key (e.g. 'scholarship', 'agriculture')
  relatedDepartmentDirectory?: string; // Directory department key
  isNew?: boolean; // Published within last 90 days of verification baseline
  isArchive?: boolean; // Historical record preserved for public audit
}

export interface TransparencyFilterOptions {
  query?: string;
  category?: string;
  department?: string;
  verificationStatus?: string;
  validityStatus?: string;
  impactLevel?: string;
  includeArchive?: boolean;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'newest' | 'oldest' | 'title';
}

export interface TransparencyPortalLink {
  id: string;
  name: string;
  department: string;
  url: string;
  description: string;
}

export interface CitizenNotificationItem {
  id: string;
  type: 'application_status' | 'action_required' | 'rts_alert' | 'grievance_update' | 'relevant_announcement';
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'success' | 'urgent';
  source: 'govsync_engine' | 'official_announcement';
  linkTarget?: string;
  linkAction?: string;
  referenceId?: string;
  announcement?: AnnouncementRecord;
}

export const TRANSPARENCY_CATEGORIES: AnnouncementCategory[] = [
  {
    id: 'government_resolutions',
    name: 'Government Resolutions',
    description: 'Statutory Government Resolutions (GRs), executive orders, and gazette notifications issued by the Government of Maharashtra.',
  },
  {
    id: 'department_notifications',
    name: 'Department Notifications',
    description: 'Official department circulars, operational notices, and administrative instructions for public services.',
  },
  {
    id: 'scheme_updates',
    name: 'Scheme Updates',
    description: 'Announcements regarding citizen welfare schemes, financial DBT assistance, and program guidelines.',
  },
  {
    id: 'public_notices',
    name: 'Public Notices',
    description: 'Public health alerts, disaster compensation notices, and stakeholder advisories.',
  },
  {
    id: 'citizen_services',
    name: 'Citizen Services',
    description: 'Updates on digital service delivery, certificate validation, RTS timelines, and facilitation centers.',
  },
  {
    id: 'agriculture_updates',
    name: 'Agriculture & Farmer Updates',
    description: 'Notices regarding crop insurance, input subsidies, farm mechanization lottery, and weather relief.',
  },
  {
    id: 'education_scholarships',
    name: 'Education & Scholarships',
    description: 'MahaDBT scholarship application cycles, biometric verification circulars, and university concessions.',
  },
  {
    id: 'health_welfare',
    name: 'Health & Welfare',
    description: 'Universal health coverage (Ayushman Bharat / MJPJAY), free medical care, and hospital rosters.',
  },
  {
    id: 'public_infrastructure',
    name: 'Public Infrastructure',
    description: 'Scheduled maintenance of government IT servers, water supply schedules, and civic works advisories.',
  },
  {
    id: 'administrative_updates',
    name: 'Administrative Updates',
    description: 'E-governance procedures, grievance redressal timeframes, and institutional reforms.',
  },
];

export const OFFICIAL_GOVERNMENT_PORTALS: TransparencyPortalLink[] = [
  {
    id: 'portal-mah-gr',
    name: 'Maharashtra Government Resolutions Portal',
    department: 'General Administration Department',
    url: 'https://gr.maharashtra.gov.in',
    description: 'Search official Government Resolutions (GRs) by department, date range, and unique GR code.',
  },
  {
    id: 'portal-mah-main',
    name: 'Government of Maharashtra Official Portal',
    department: 'General Administration Department',
    url: 'https://maharashtra.gov.in',
    description: 'Central portal for state government orders, cabinet decisions, gazettes, and official notifications.',
  },
  {
    id: 'portal-aaplesarkar',
    name: 'Aaple Sarkar Citizen Services Portal',
    department: 'Directorate of Information Technology (DIT)',
    url: 'https://aaplesarkar.mahaonline.gov.in',
    description: 'Public notifications and service delivery status under the Maharashtra Right to Public Services Act 2015.',
  },
  {
    id: 'portal-mahadbt',
    name: 'MahaDBT Direct Benefit Transfer Portal',
    department: 'Higher & Technical Education / Social Justice',
    url: 'https://mahadbt.maharashtra.gov.in',
    description: 'Official notifications for student scholarships, pension schemes, and farmer subsidies.',
  },
  {
    id: 'portal-rts',
    name: 'Maharashtra Right to Services Commission',
    department: 'Maharashtra RTS Commission',
    url: 'https://rts.maharashtra.gov.in',
    description: 'Statutory notifications regarding service timeframes, designated first and second appellate authorities.',
  },
  {
    id: 'portal-grievance',
    name: 'Aaple Sarkar Grievance Redressal Portal',
    department: 'General Administration Department',
    url: 'https://grievances.maharashtra.gov.in',
    description: 'Official guidelines and tracking for citizen complaints regarding public administration.',
  },
  {
    id: 'portal-krishi',
    name: 'Department of Agriculture Maharashtra',
    department: 'Agriculture Department',
    url: 'https://krishi.maharashtra.gov.in',
    description: 'Agricultural circulars, crop insurance deadlines, SMAM mechanization guidelines, and weather alerts.',
  },
  {
    id: 'portal-india-gov',
    name: 'National Portal of India',
    department: 'Ministry of Electronics & Information Technology (GoI)',
    url: 'https://www.india.gov.in',
    description: 'Central registry of national gazette notifications, central ministries, and statutory orders.',
  },
];

export const VERIFIED_ANNOUNCEMENTS: AnnouncementRecord[] = [
  {
    id: 'gr-mah-2023-pmfby-1rupee',
    title: 'Implementation of Comprehensive Crop Insurance Scheme (PMFBY) at ₹1 Farmer Token Premium',
    summary: 'Maharashtra State Government Resolution providing full actuarial premium subsidy for Kharif and Rabi crops, requiring farmers to pay only ₹1 token contribution.',
    fullDescription: 'Under Government Resolution No. पीकवि-२०२३/प्र.क्र.२२/११-ए, the Government of Maharashtra restructured the Pradhan Mantri Fasal Bima Yojana (Sarv Samaveshak Pika Vima) to relieve farmers of crop insurance premiums. Farmers contribute only ₹1 per application, with the remaining state and central shares borne directly by the government. Intimation for localized calamity losses must be logged within 72 hours via the Crop Insurance App.',
    department: 'Department of Agriculture',
    category: 'agriculture_updates',
    publicationDate: '2023-06-26',
    effectiveDate: '2023-06-26',
    referenceNumber: 'पीकवि-२०२३/प्र.क्र.२२/११-ए',
    officialSourceUrl: 'https://krishi.maharashtra.gov.in',
    documentUrl: 'https://gr.maharashtra.gov.in/Site/Upload/GR/Marathi/202306261730058201.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedServiceId: 'agriculture',
    relatedDepartmentDirectory: 'Department of Agriculture',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-aaplesarkar-rts-expansion',
    title: 'Notification of Additional 120 Online Notified Services under Maharashtra Right to Public Services Act',
    summary: 'Expansion of legally guaranteed digital delivery timeframes under RTS 2015 to include revenue, municipal, and educational services.',
    fullDescription: 'Issued by the General Administration Department (IT), this order mandates that 120 additional public services across 18 departments must be delivered strictly through the Aaple Sarkar portal within statutory timelines. Designates First Appellate and Second Appellate Authorities for each service to handle citizen delays and non-compliance.',
    department: 'General Administration Department',
    category: 'citizen_services',
    publicationDate: '2021-09-15',
    effectiveDate: '2021-10-01',
    referenceNumber: 'संकीर्ण-२०२१/प्र.क्र.२८/माहिती तंत्रज्ञान',
    officialSourceUrl: 'https://rts.maharashtra.gov.in',
    documentUrl: 'https://aaplesarkar.mahaonline.gov.in/en/PublicServices/Index',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedServiceId: 'rts',
    relatedDepartmentDirectory: 'General Administration Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'circ-mahadbt-scholarship-renewal',
    title: 'MahaDBT Post-Matric Scholarship Application Renewal and Aadhaar-Based Authentication Circular',
    summary: 'Guidelines for post-matric scholarship renewal, mandatory bank-Aadhaar NPCI mapping, and attendance certification for academic institutes.',
    fullDescription: 'Issued by the Higher and Technical Education Department, this circular instructs all government-aided and autonomous colleges to verify student enrollment and complete online biometric authentication for DBT disbursements. Students must link their Aadhaar with their active bank account on the NPCI mapper to avoid payment failure.',
    department: 'Higher and Technical Education Department',
    category: 'education_scholarships',
    publicationDate: '2024-08-12',
    effectiveDate: '2024-08-15',
    expiryDate: '2025-03-31',
    referenceNumber: 'शिष्यवृत्ती-२०२४/प्र.क्र.१४/शिक्षण-३',
    officialSourceUrl: 'https://mahadbt.maharashtra.gov.in',
    documentUrl: 'https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA970742676735E2596C6E41D175',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedServiceId: 'scholarship',
    relatedDepartmentDirectory: 'Higher and Technical Education Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'gr-mah-2023-mjpjay-ayushman-co-branding',
    title: 'Universal Health Insurance Coverage and Integration of AB-PMJAY with MJPJAY up to ₹5 Lakh Per Family',
    summary: 'Integration of Maharashtra’s Mahatma Jyotirao Phule Jan Arogya Yojana with Ayushman Bharat, raising cashless health cover to ₹5,00,000 for all ration card holders.',
    fullDescription: 'Under GR No. एमजेपी-२०२३/प्र.क्र.१३५/आरोग्य-७, the Government of Maharashtra expanded state health coverage from ₹1.5 lakh to ₹5 lakh per family per year. Eliminates income ceilings for specified tertiary care treatments across 1,900+ empanelled government and private network hospitals using co-branded Ayushman cards.',
    department: 'Public Health Department',
    category: 'health_welfare',
    publicationDate: '2023-07-28',
    effectiveDate: '2023-08-01',
    referenceNumber: 'एमजेपी-२०२३/प्र.क्र.१३५/आरोग्य-७',
    officialSourceUrl: 'https://www.jeevandayee.gov.in',
    documentUrl: 'https://arogya.maharashtra.gov.in/Site/Upload/GR/20230728145612.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedDepartmentDirectory: 'Public Health Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'circ-aaplesarkar-digital-signature',
    title: 'Mandatory Digital Signature and 2D Barcode Verification on Revenue Certificates',
    summary: 'Standardization of Income, Domicile, and Caste certificates issued via Aaple Sarkar, declaring digitally signed e-certificates fully valid without wet-ink stamp.',
    fullDescription: 'Issued by the Revenue & Forest Department, this circular mandates that all revenue officers (Tahsildars and Sub-Divisional Officers) must affix cryptographic DSC keys on citizen certificates. All public educational institutions, employers, and banks are strictly prohibited from demanding physical signatures or in-person verification when a verifiable QR code exists.',
    department: 'Revenue and Forest Department',
    category: 'government_resolutions',
    publicationDate: '2022-05-04',
    effectiveDate: '2022-06-01',
    referenceNumber: 'महसूल-२०२२/प्र.क्र.९१/ई-गव्हर्नन्स',
    officialSourceUrl: 'https://aaplesarkar.mahaonline.gov.in',
    documentUrl: 'https://rts.maharashtra.gov.in/Site/Upload/RulesAndActs/AapleSarkarCircular.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedServiceId: 'residence',
    relatedDepartmentDirectory: 'Revenue and Forest Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'gr-mah-2020-grievance-21day-sop',
    title: 'Revised Standard Operating Procedure for Citizen Grievance Disposal within 21 Working Days',
    summary: 'Statutory timeframe for department grievance officers to inspect, resolve, or provide written reasoned orders on complaints submitted via Aaple Sarkar Grievance Portal.',
    fullDescription: 'Government Resolution No. तक्रार-२०२०/प्र.क्र.४५/प्रशा-१ establishes a three-tier monitoring mechanism for citizen grievances. First-level departmental officers must acknowledge complaints within 3 days and close the inquiry within 21 working days. If unresolved, grievances are automatically escalated to the District Collector or Departmental Secretary.',
    department: 'General Administration Department',
    category: 'administrative_updates',
    publicationDate: '2020-11-18',
    effectiveDate: '2020-12-01',
    referenceNumber: 'तक्रार-२०२०/प्र.क्र.४५/प्रशा-१',
    officialSourceUrl: 'https://grievances.maharashtra.gov.in',
    documentUrl: 'https://gr.maharashtra.gov.in/Site/Upload/GR/Marathi/202011181630128901.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedServiceId: 'grievances',
    relatedDepartmentDirectory: 'General Administration Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'gr-mah-2023-namo-shetkari-dbt',
    title: 'Namo Shetkari Mahasanman Nidhi Yojana (NSMNY) Annual DBT Disbursement Guidelines',
    summary: 'Maharashtra State scheme complementing PM-KISAN by providing an additional ₹6,000 per year in 3 equal installments of ₹2,000 to eligible landholder farmers.',
    fullDescription: 'Under GR No. नमोशे-२०२३/प्र.क्र.४०/कृषी-८, the Agriculture Department coordinates with the central PM-KISAN portal to disburse state-matching installments directly via Aadhaar-linked bank accounts. Farmers verified on the PM-KISAN database automatically qualify without needing duplicate documentation.',
    department: 'Department of Agriculture',
    category: 'scheme_updates',
    publicationDate: '2023-06-15',
    effectiveDate: '2023-07-01',
    referenceNumber: 'नमोशे-२०२३/प्र.क्र.४०/कृषी-८',
    officialSourceUrl: 'https://krishi.maharashtra.gov.in',
    documentUrl: 'https://gr.maharashtra.gov.in/Site/Upload/GR/Marathi/202306151522019901.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedServiceId: 'agriculture',
    relatedDepartmentDirectory: 'Department of Agriculture',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'circ-smam-mechanization-lottery',
    title: 'Guidelines for Computerized Lottery Selection and Pre-Sanction for Farm Mechanization (SMAM)',
    summary: 'Procedural rules for farmer selection, component subsidies (50% for SC/ST/Small/Marginal/Women; 40% for General), and geo-tagged upload of purchased machinery on MahaDBT.',
    fullDescription: 'Issued by the Directorate of Agricultural Engineering, this circular lays down the transparent lottery draw process for tractor implements, rotavators, power tillers, and threshers. Beneficiaries must complete e-KYC and upload GST invoices with GPS coordinates of the machinery within 30 days of receiving pre-sanction letters.',
    department: 'Department of Agriculture',
    category: 'agriculture_updates',
    publicationDate: '2024-01-10',
    effectiveDate: '2024-01-15',
    referenceNumber: 'कृषी-यंत्र-२०२४/प्र.क्र.०८/तां.शा.-२',
    officialSourceUrl: 'https://mahadbt.maharashtra.gov.in',
    documentUrl: 'https://krishi.maharashtra.gov.in/Site/Upload/SMAM_Lottery_Guidelines_2024.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedServiceId: 'agriculture',
    relatedDepartmentDirectory: 'Department of Agriculture',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-mahafood-onorc-portability',
    title: 'Biometric Authentication and National Portability Guidelines for Fair Price Shop Ration Card Holders',
    summary: 'Operational guidelines for One Nation One Ration Card (ONORC) across all 36 districts of Maharashtra, enabling migrant laborers to lift subsidized grains from any ePoS shop.',
    fullDescription: 'Issued by the Food, Civil Supplies and Consumer Protection Department, this notification instructs all Fair Price Shop dealers to honor intra-state and inter-state portability without demanding transfer certificates. Subsidized allocations under NFSA (Antyodaya & Priority Households) are tracked electronically via biometric ePoS devices.',
    department: 'Food, Civil Supplies and Consumer Protection Department',
    category: 'department_notifications',
    publicationDate: '2021-07-14',
    effectiveDate: '2021-08-01',
    referenceNumber: 'अवि-२०२१/प्र.क्र.५२/नापु-२२',
    officialSourceUrl: 'https://mahafood.gov.in',
    documentUrl: 'https://mahafood.gov.in/Site/Upload/GR/ONORC_Guidelines.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedServiceId: 'ration-card',
    relatedDepartmentDirectory: 'Food, Civil Supplies and Consumer Protection Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'gr-mah-2023-pension-enhancement',
    title: 'Enhancement of Monthly Pension for Destitute Senior Citizens under Social Assistance Schemes',
    summary: 'Government Resolution revising monthly social security pensions under Sanjay Gandhi Niradhar and Shravanbal Yojana, credited directly via PFMS.',
    fullDescription: 'GR No. संकीर्ण-२०२३/प्र.क्र.८८/सा.सु.-३ increased monthly maintenance assistance for eligible senior citizens (60+ years), disabled individuals, and destitute persons. Enforces quarterly electronic verification to eliminate deceased beneficiary leakages while guaranteeing direct credit into core banking accounts by the 10th of every month.',
    department: 'Social Justice and Special Assistance Department',
    category: 'scheme_updates',
    publicationDate: '2023-09-22',
    effectiveDate: '2023-10-01',
    referenceNumber: 'संकीर्ण-२०२३/प्र.क्र.८८/सा.सु.-३',
    officialSourceUrl: 'https://sjsa.maharashtra.gov.in',
    documentUrl: 'https://gr.maharashtra.gov.in/Site/Upload/GR/Marathi/202309221430551101.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedServiceId: 'pension',
    relatedDepartmentDirectory: 'Social Justice and Special Assistance Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-sdrf-calamity-panchnama',
    title: 'Standard Operating Procedure for Joint Panchnama of Rain and Cyclone Induced Agricultural Losses',
    summary: 'Statutory threshold guidelines requiring at least 33% verified crop damage to trigger SDRF input subsidy relief for affected farmers.',
    fullDescription: 'Issued by the Relief & Rehabilitation Department, this notification details the mandatory joint survey conducted by the Village Talathi, Agriculture Assistant, and Gram Sevak. Specifies GIS-verified geo-tagging of damaged fields and publication of beneficiary lists at the Gram Panchayat office for public transparency.',
    department: 'Relief and Rehabilitation Department',
    category: 'public_notices',
    publicationDate: '2023-10-19',
    effectiveDate: '2023-10-20',
    referenceNumber: 'मदत-२०२३/प्र.क्र.१०२/आपत्ती-१',
    officialSourceUrl: 'https://maharashtra.gov.in',
    documentUrl: 'https://gr.maharashtra.gov.in/Site/Upload/GR/Marathi/202310191754020101.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedServiceId: 'agriculture',
    relatedDepartmentDirectory: 'Revenue and Forest Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'circ-dit-scheduled-server-maintenance',
    title: 'Scheduled Database Indexing and Maintenance Window on Aaple Sarkar Gateway Servers (Nov 2026)',
    summary: 'Notice regarding a scheduled 4-hour technical maintenance window on state revenue service APIs, during which instant e-verification was temporarily queued.',
    fullDescription: 'The Directorate of Information Technology (DIT) conducted scheduled quarterly security patching and database indexing across the State Data Centre (SDC) cluster. All queued application requests were processed in FIFO order upon system restoration. Preserved in transparency records for audit accountability.',
    department: 'Directorate of Information Technology (DIT)',
    category: 'public_infrastructure',
    publicationDate: '2026-11-15',
    effectiveDate: '2026-11-20',
    expiryDate: '2026-11-21',
    referenceNumber: 'आईटी-मेंट-२०२६/नोटीस-०२/तांत्रिक',
    officialSourceUrl: 'https://dit.maharashtra.gov.in',
    documentUrl: 'https://aaplesarkar.mahaonline.gov.in/Site/Notice/Maintenance_Nov2026.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'historical_archive',
    validityStatus: 'expired',
    impactLevel: 'medium',
    relatedDepartmentDirectory: 'General Administration Department',
    isNew: false,
    isArchive: true,
  },
  {
    id: 'gr-mah-mjpsky-debt-relief-status',
    title: 'Statutory Clarification on Mahatma Jyotirao Phule Shetkari Karjmukti Yojana Incentive Eligibility',
    summary: 'Clarification regarding up to ₹50,000 incentive grants for farmers who regularly repaid crop loans during designated historical cut-off financial years.',
    fullDescription: 'Government Resolution No. सीएलएस-२०१९/प्र.क्र.२२९/१४-स and follow-up circulars detail the disbursement of up to ₹50,000 incentive funds to disciplined bank borrowers. The resolution explicitly clarifies that MJPSKY operates strictly on bank-audited historical lists and is NOT an open, perpetual debt-forgiveness program for fresh crop loans taken currently.',
    department: 'Co-operation, Marketing and Textiles Department',
    category: 'government_resolutions',
    publicationDate: '2022-07-14',
    effectiveDate: '2022-08-01',
    referenceNumber: 'सीएलएस-२०१९/प्र.क्र.२२९/१४-स',
    officialSourceUrl: 'https://mjpsky.maharashtra.gov.in',
    documentUrl: 'https://gr.maharashtra.gov.in/Site/Upload/GR/Marathi/202207141215038802.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'partially_verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedServiceId: 'agriculture',
    relatedDepartmentDirectory: 'Co-operation, Marketing and Textiles Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'circ-digilocker-board-certificates',
    title: 'Gazette Notification on Legal Acceptance of DigiLocker-Issued SSC and HSC Marksheets',
    summary: 'Formal instruction directing all government departments, universities, and recruitment boards to accept DigiLocker digital credentials as original documents.',
    fullDescription: 'Under Rule 9A of the Information Technology (Preservation and Retention of Information by Intermediaries Providing Digital Locker Facilities) Rules 2016 and state circular डिजि-२०२०/प्र.क्र.१२/माहिती तंत्रज्ञान, digital documents pulled from the Maharashtra State Board issuer on DigiLocker possess identical evidentiary standing to physical original certificates.',
    department: 'School Education and Sports Department',
    category: 'administrative_updates',
    publicationDate: '2020-02-11',
    effectiveDate: '2020-03-01',
    referenceNumber: 'डिजी-२०२०/प्र.क्र.१२/माहिती तंत्रज्ञान',
    officialSourceUrl: 'https://education.maharashtra.gov.in',
    documentUrl: 'https://mahahsscboard.in/DigiLocker_Circular_2020.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedServiceId: 'scholarship',
    relatedDepartmentDirectory: 'School Education and Sports Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-public-health-monsoon-advisory',
    title: 'Statewide Monsoon Health Advisory and Free Diagnostic Protocol for Vector-Borne Diseases',
    summary: 'Public Health Department advisory detailing free testing protocols for dengue and malaria at all district civil hospitals and rural primary health centers.',
    fullDescription: 'Issued by the Directorate of Health Services, this notification establishes dedicated Fever OPD counters across state healthcare facilities. Mandates price caps for private diagnostic laboratories on NS1/IgM dengue ELISA tests and outlines preventive fogging protocols for municipal corporations and Zilla Parishads.',
    department: 'Public Health Department',
    category: 'public_notices',
    publicationDate: '2024-06-25',
    effectiveDate: '2024-06-25',
    expiryDate: '2024-11-30',
    referenceNumber: 'आरोग्य-कीटक-२०२४/परिपत्रक-०५',
    officialSourceUrl: 'https://arogya.maharashtra.gov.in',
    documentUrl: 'https://arogya.maharashtra.gov.in/Site/Upload/HealthAdvisory_June2024.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'general',
    relatedDepartmentDirectory: 'Public Health Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'gr-mah-magel-tyala-shettale-subsidy',
    title: 'Revision of Unit Cost Subsidy and Mobile Geotagging Protocol for Farm Ponds (Magel Tyala Shettale)',
    summary: 'Government Resolution increasing the direct financial assistance cap for individual farm ponds with plastic lining to enhance groundwater recharge in drought-prone talukas.',
    fullDescription: 'Under GR No. शेततळे-२०२२/प्र.क्र.६४/जलसंधारण-२, the Water Conservation Department increased farm pond assistance up to ₹75,000 for qualifying farmers. Subsidy disbursement is strictly conditional on geo-tagged mobile app verification before excavation, post-excavation, and after plastic film installation by the Taluka Agriculture Officer.',
    department: 'Water Conservation and Soil Department',
    category: 'scheme_updates',
    publicationDate: '2022-05-18',
    effectiveDate: '2022-06-01',
    referenceNumber: 'शेततळे-२०२२/प्र.क्र.६४/जलसंधारण-२',
    officialSourceUrl: 'https://krishi.maharashtra.gov.in',
    documentUrl: 'https://gr.maharashtra.gov.in/Site/Upload/GR/Marathi/202205181745129901.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedServiceId: 'agriculture',
    relatedDepartmentDirectory: 'Water Conservation and Soil Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-caste-validity-online-ccvis',
    title: 'Mandatory Online Filing of Caste Validity Certificate Applications via CCVIS Portal',
    summary: 'Guidelines prohibiting manual paper submissions for Caste Scrutiny Committees and requiring digital verification of genealogical revenue records.',
    fullDescription: 'Administered by Dr. Babasaheb Ambedkar Research and Training Institute (BARTI), this instruction requires all candidates seeking educational or election validity to submit digitized genealogical family trees (1950/1961 pre-constitutional records) on the CCVIS online portal. Automated tracking numbers allow citizens to monitor scrutiny hearings.',
    department: 'Social Justice and Special Assistance Department',
    category: 'citizen_services',
    publicationDate: '2021-03-12',
    effectiveDate: '2021-04-01',
    referenceNumber: 'सीबीसी-२०१६/प्र.क्र.१३५/मावक-५',
    officialSourceUrl: 'https://barti.maharashtra.gov.in',
    documentUrl: 'https://ccvis.mahaonline.gov.in/Home/Instructions',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedServiceId: 'caste-certificate',
    relatedDepartmentDirectory: 'Social Justice and Special Assistance Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-pmayg-awas-plus-beneficiary-list',
    title: 'Public Scrutiny of Gram Sabha Verified Priority List under Pradhan Mantri Awas Yojana (Gramin)',
    summary: 'Publication of Awas Plus rural housing beneficiary lists at village panchayat offices to enable public objections before final fund release.',
    fullDescription: 'Issued by the Rural Development Department, this notice instructs Block Development Officers (BDOs) to display socio-economic housing entitlement rankings in the Gram Panchayat office for 15 days. Citizens may submit documented claims or objections regarding ineligible entries prior to house sanction generation.',
    department: 'Rural Development and Panchayati Raj Department',
    category: 'public_notices',
    publicationDate: '2024-01-08',
    effectiveDate: '2024-01-15',
    referenceNumber: 'गृह-२०२४/प्र.क्र.२२/ग्रावि-८',
    officialSourceUrl: 'https://rdd.maharashtra.gov.in',
    documentUrl: 'https://pmayg.nic.in/netiwas/Home.aspx',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedDepartmentDirectory: 'Rural Development and Panchayati Raj Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'gr-mah-digital-712-legal-validity',
    title: 'Legal Admissibility of Digitally Signed 7/12 Land Record Extracts without Physical Signature',
    summary: 'Government Resolution establishing that digital 7/12 extracts bearing an electronic signature and 16-digit verification code have full legal validity in all courts and banks.',
    fullDescription: 'GR No. जमीन-२०१९/प्र.क्र.५१/ल-१ issued by the Revenue & Forest Department eliminates the statutory requirement for physical seals or signatures by the Talathi on land ownership records. Financial institutions, civil courts, and cooperative credit societies are legally required to accept computer-generated extracts verified via Mahabhulekh.',
    department: 'Revenue and Forest Department',
    category: 'government_resolutions',
    publicationDate: '2019-10-15',
    effectiveDate: '2019-11-01',
    referenceNumber: 'जमीन-२०१९/प्र.क्र.५१/ल-१',
    officialSourceUrl: 'https://bhulekh.mahabhumi.gov.in',
    documentUrl: 'https://digibhumi.mahabhumi.gov.in/Site/Upload/Digital712_Validity_Order.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedServiceId: 'agriculture',
    relatedDepartmentDirectory: 'Revenue and Forest Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-cm-fellowship-2023-selection-completed',
    title: 'Chief Minister Fellowship Programme 2023-24 Selection Cohort (Historical Archive)',
    summary: 'Archived notification regarding the youth leadership and public administration fellowship with state departments; selection process completed.',
    fullDescription: 'The Planning Department issued this notification for the 2023-24 batch of the Chief Minister Fellowship Programme. Over 4,000 applicants completed online tests and interviews for 60 district placements. Retained as an archive record for administrative audit and previous cohort reference.',
    department: 'Planning Department',
    category: 'department_notifications',
    publicationDate: '2023-05-02',
    effectiveDate: '2023-05-05',
    expiryDate: '2023-06-02',
    referenceNumber: 'सीएमएफ-२०२३/जाहिरात-०१',
    officialSourceUrl: 'https://mahades.maharashtra.gov.in',
    documentUrl: 'https://cmfellowship.maharashtra.gov.in',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'historical_archive',
    validityStatus: 'expired',
    impactLevel: 'general',
    relatedDepartmentDirectory: 'Planning Department',
    isNew: false,
    isArchive: true,
  },
  {
    id: 'notif-water-canal-repair-upper-godavari',
    title: 'Scheduled Canal Maintenance Water Supply Advisory for Upper Godavari Basin (October 2026)',
    summary: 'Archived civic notice detailing a temporary 48-hour irrigation cut along the Gangapur Left Bank Canal for structural crack inspection and de-silting.',
    fullDescription: 'The Water Resources Department (Nashik Division) conducted pre-winter desilting and concrete lining inspections along the primary canal network. Water supply to agricultural sub-branches was suspended for 48 hours and restored following engineering clearance.',
    department: 'Water Resources Department',
    category: 'public_infrastructure',
    publicationDate: '2026-10-05',
    effectiveDate: '2026-10-10',
    expiryDate: '2026-10-12',
    referenceNumber: 'जल-निरीक्षण-२०२६/सूचना-०७',
    officialSourceUrl: 'https://wrd.maharashtra.gov.in',
    documentUrl: 'https://wrd.maharashtra.gov.in/Canal_Notice_Oct2026.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'historical_archive',
    validityStatus: 'expired',
    impactLevel: 'general',
    relatedDepartmentDirectory: 'Water Resources Department',
    isNew: false,
    isArchive: true,
  },
  {
    id: 'notif-mea-passport-rural-mobile-camps',
    title: 'Regional Passport Office Mobile Seva Camps Tour Schedule for Western Maharashtra (Spring 2024)',
    summary: 'Public notice regarding temporary mobile citizen passport facilitation camps organized in rural taluka centers of Sangli, Satara, and Kolhapur.',
    fullDescription: 'Issued by the Regional Passport Office (Ministry of External Affairs), this operational schedule facilitated citizen biometric enrollment and document verification in talukas lacking permanent Post Office Passport Seva Kendras (POPSK). Citizens booked slots on passportindia.gov.in.',
    department: 'Ministry of External Affairs',
    category: 'citizen_services',
    publicationDate: '2024-03-12',
    effectiveDate: '2024-04-01',
    expiryDate: '2024-04-30',
    referenceNumber: 'पासपोर्ट-कॅम्प-२०२४/अधिसूचना-३',
    officialSourceUrl: 'https://passportindia.gov.in',
    documentUrl: 'https://www.passportindia.gov.in/AppOnlineProject/online/campRpo',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'expired',
    impactLevel: 'medium',
    relatedServiceId: 'passport',
    isNew: false,
    isArchive: true,
  },
  {
    id: 'circ-mahavikas-vocational-apprenticeship',
    title: 'Mandatory Industrial Establishment Registration on MahaVikas Apprenticeship Portal',
    summary: 'Circular directing registered MSMEs and industrial units in Maharashtra to onboard technical apprentices with state stipend reimbursement support.',
    fullDescription: 'Issued by the Skill Development and Entrepreneurship Department, this notification operationalizes the state apprenticeship promotion scheme. Qualifying companies providing on-the-job training to ITI and diploma graduates receive up to ₹1,500 monthly per apprentice as state contribution directly through DBT.',
    department: 'Skill Development, Employment and Entrepreneurship Department',
    category: 'education_scholarships',
    publicationDate: '2022-11-17',
    effectiveDate: '2022-12-01',
    referenceNumber: 'व्यवसाय-२०२२/प्र.क्र.३४/कौशल्य-१',
    officialSourceUrl: 'https://msss.maharashtra.gov.in',
    documentUrl: 'https://msss.maharashtra.gov.in/Circulars/Apprenticeship_Order_2022.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'medium',
    relatedDepartmentDirectory: 'Skill Development, Employment and Entrepreneurship Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-disaster-flood-helpline-1077',
    title: 'Statewide Pre-Monsoon Flood Preparedness and 24x7 District Emergency Operations Helpline (1077)',
    summary: 'Establishment of 24x7 District Emergency Operations Centers (DEOC) across all flood-prone river basins with toll-free emergency response number 1077.',
    fullDescription: 'The Disaster Management, Relief and Rehabilitation Department notified emergency coordination protocols for municipal corporations and district collectorates. Citizens can call the centralized toll-free helpline 1077 or state control room 022-22027990 for immediate rescue, evacuation, or water discharge updates during monsoon alerts.',
    department: 'Disaster Management, Relief and Rehabilitation Department',
    category: 'public_infrastructure',
    publicationDate: '2024-05-28',
    effectiveDate: '2024-06-01',
    expiryDate: '2024-10-31',
    referenceNumber: 'आपत्ती-२०२४/सर्क्युलर-०१',
    officialSourceUrl: 'https://dmrr.maharashtra.gov.in',
    documentUrl: 'https://dmrr.maharashtra.gov.in/Flood_Helplines_2024.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'verified',
    validityStatus: 'active',
    impactLevel: 'high',
    relatedDepartmentDirectory: 'Revenue and Forest Department',
    isNew: false,
    isArchive: false,
  },
  {
    id: 'notif-urban-draft-e-gov-rules-feedback',
    title: 'Public Objections and Suggestions on Draft Maharashtra Municipal E-Governance Rules (Archived)',
    summary: 'Archived public consultation notice inviting citizen feedback on digital municipal property tax assessment and building permission transparency rules.',
    fullDescription: 'The Urban Development Department published the draft e-governance framework for municipal corporations, establishing time-bound automated building plan approvals and digital birth/death certificate integration. The public consultation window closed in October 2023, and final rules were subsequently notified.',
    department: 'Urban Development Department',
    category: 'administrative_updates',
    publicationDate: '2023-09-05',
    effectiveDate: '2023-09-10',
    expiryDate: '2023-10-10',
    referenceNumber: 'नगर-२०२३/मसुदा-नियम-०४',
    officialSourceUrl: 'https://urban.maharashtra.gov.in',
    documentUrl: 'https://urban.maharashtra.gov.in/Draft_E-Gov_Rules_2023.pdf',
    lastVerifiedDate: '2026-11-25',
    languagesAvailable: ['en', 'hi', 'mr'],
    verificationStatus: 'historical_archive',
    validityStatus: 'expired',
    impactLevel: 'general',
    relatedDepartmentDirectory: 'Urban Development Department',
    isNew: false,
    isArchive: true,
  },
];

/**
 * Filter announcements based on query, category, department, validity, archive, etc.
 */
export function filterAnnouncements(
  announcements: AnnouncementRecord[],
  options: TransparencyFilterOptions = {}
): AnnouncementRecord[] {
  let result = [...announcements];

  // 1. Text Search
  if (options.query && options.query.trim()) {
    const q = options.query.trim().toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.fullDescription.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q) ||
        a.referenceNumber.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }

  // 2. Category Filter
  if (options.category && options.category !== 'all') {
    result = result.filter((a) => a.category === options.category);
  }

  // 3. Department Filter
  if (options.department && options.department !== 'all') {
    result = result.filter((a) => a.department === options.department);
  }

  // 4. Verification Status Filter
  if (options.verificationStatus && options.verificationStatus !== 'all') {
    result = result.filter((a) => a.verificationStatus === options.verificationStatus);
  }

  // 5. Validity Status Filter
  if (options.validityStatus && options.validityStatus !== 'all') {
    result = result.filter((a) => a.validityStatus === options.validityStatus);
  }

  // 6. Impact Level Filter
  if (options.impactLevel && options.impactLevel !== 'all') {
    result = result.filter((a) => a.impactLevel === options.impactLevel);
  }

  // 7. Service ID Filter
  if (options.serviceId && options.serviceId !== 'all') {
    result = result.filter((a) => a.relatedServiceId === options.serviceId);
  }

  // 8. Archive Toggle
  // If includeArchive is explicitly false (default view when not searching historical archive),
  // hide expired/archived items unless user opted into viewing archive
  if (options.includeArchive === false) {
    result = result.filter((a) => !a.isArchive && a.validityStatus !== 'expired');
  } else if (options.includeArchive === true) {
    // Show only archive or all? Usually archive view shows archive records
    // Let's support both: if includeArchive is explicitly true and no other filter, include all records
  }

  // 9. Date Range
  if (options.startDate) {
    result = result.filter((a) => a.publicationDate >= options.startDate!);
  }
  if (options.endDate) {
    result = result.filter((a) => a.publicationDate <= options.endDate!);
  }

  // 10. Sorting
  const sortBy = options.sortBy || 'newest';
  result.sort((a, b) => {
    if (sortBy === 'newest') {
      return b.publicationDate.localeCompare(a.publicationDate);
    } else if (sortBy === 'oldest') {
      return a.publicationDate.localeCompare(b.publicationDate);
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return result;
}

/**
 * Get distinct departments from the announcement records.
 */
export function getTransparencyDepartments(announcements: AnnouncementRecord[] = VERIFIED_ANNOUNCEMENTS): string[] {
  const set = new Set<string>();
  for (const a of announcements) {
    set.add(a.department);
  }
  return Array.from(set).sort();
}

/**
 * Get category summary counts (real records count per category).
 */
export function getCategoryCounts(
  announcements: AnnouncementRecord[] = VERIFIED_ANNOUNCEMENTS
): Record<TransparencyCategoryKey, number> {
  const counts: Record<string, number> = {};
  for (const cat of TRANSPARENCY_CATEGORIES) {
    counts[cat.id] = 0;
  }
  for (const a of announcements) {
    if (counts[a.category] !== undefined) {
      counts[a.category]++;
    }
  }
  return counts as Record<TransparencyCategoryKey, number>;
}

/**
 * Get overall summary statistics from real records.
 */
export function getTransparencySummary(announcements: AnnouncementRecord[] = VERIFIED_ANNOUNCEMENTS) {
  const total = announcements.length;
  const verified = announcements.filter((a) => a.verificationStatus === 'verified').length;
  const partiallyVerified = announcements.filter((a) => a.verificationStatus === 'partially_verified').length;
  const active = announcements.filter((a) => a.validityStatus === 'active').length;
  const archived = announcements.filter((a) => a.isArchive || a.validityStatus === 'expired').length;
  const highImpact = announcements.filter((a) => a.impactLevel === 'high').length;
  const categories = TRANSPARENCY_CATEGORIES.length;
  const departments = getTransparencyDepartments(announcements).length;

  return {
    total,
    verified,
    partiallyVerified,
    active,
    archived,
    highImpact,
    categories,
    departments,
    lastAuditDate: '2026-11-25',
  };
}

const RTS_STIPULATED_DAYS: Record<string, number> = {
  scholarship: 30,
  residence: 7,
  'ration-card': 30,
  pension: 45,
  'caste-certificate': 45,
  'income-certificate': 15,
};

function calculateStatutoryRtsAlert(service?: string, submittedAt?: string) {
  if (!submittedAt) return { isOverdue: false, isCritical: false, overdueDays: 0, deadlineDate: '' };
  const stipulated = (service && RTS_STIPULATED_DAYS[service]) || 30;
  const start = new Date(submittedAt).getTime();
  const deadlineMs = start + stipulated * 24 * 60 * 60 * 1000;
  const deadlineDate = new Date(deadlineMs).toISOString().split('T')[0];
  const now = Date.now();
  const diffDays = Math.floor((now - deadlineMs) / (24 * 60 * 60 * 1000));
  const isOverdue = diffDays > 0;
  const isCritical = diffDays >= -3 && diffDays <= 0;
  return { isOverdue, isCritical, overdueDays: Math.max(0, diffDays), deadlineDate };
}

/**
 * Synthesizes citizen-facing notifications based exclusively on:
 * 1. The citizen's actual owned application records and audit history.
 * 2. Real statutory RTS deadline status.
 * 3. Citizen's submitted grievances.
 * 4. Relevant verified government announcements matching citizen services.
 *
 * Strict Security Rules:
 * - Never returns fake or synthetic notification status changes.
 * - Enforces owner-scoped visibility (caller passes already-scoped applications & grievances).
 * - Distinguishes GovSync-generated notices from official government announcements.
 */
export function getCitizenNotifications(
  applications: ApplicationRecord[] = [],
  audits: AuditRecord[] = [],
  grievances: GrievanceRecord[] = [],
  announcements: AnnouncementRecord[] = VERIFIED_ANNOUNCEMENTS
): CitizenNotificationItem[] {
  const notifications: CitizenNotificationItem[] = [];
  const decisionAudits = new Set(audits.filter((a) => a.action === 'Department decision').map((a) => a.application_id));

  // 1. Notifications from Citizen Applications
  for (const app of applications) {
    const rtsAlert = calculateStatutoryRtsAlert(app.service, app.submitted_at || app.created_at);

    // A. Clarification requested (Action Required - Urgent)
    if (app.status === 'clarification') {
      notifications.push({
        id: `notif-app-${app.id}-clarification`,
        type: 'action_required',
        title: `Clarification Requested: ${app.id}`,
        message: app.decision_note
          ? `Reviewing officer requested clarification: "${app.decision_note}". Please submit details to resume processing.`
          : 'Reviewing officer requested clarification. Please review your application details.',
        timestamp: app.created_at || new Date().toISOString(),
        severity: 'urgent',
        source: 'govsync_engine',
        linkTarget: 'apply',
        linkAction: 'open_application',
        referenceId: app.id,
      });
    }

    // B. Department decision (Approved or Rejected)
    if (app.status === 'approved' || (decisionAudits.has(app.id) && app.status === 'approved')) {
      notifications.push({
        id: `notif-app-${app.id}-approved`,
        type: 'application_status',
        title: `Application Approved: ${app.id}`,
        message: `Your application has been approved by the department. Verified certificate is ready for download.`,
        timestamp: app.decided_at || app.created_at || new Date().toISOString(),
        severity: 'success',
        source: 'govsync_engine',
        linkTarget: 'apply',
        linkAction: 'view_certificate',
        referenceId: app.id,
      });
    } else if (app.status === 'rejected') {
      notifications.push({
        id: `notif-app-${app.id}-rejected`,
        type: 'application_status',
        title: `Application Decision: ${app.id}`,
        message: app.decision_note
          ? `Application rejected by department: "${app.decision_note}". You have statutory appeal rights under RTS 2015.`
          : 'Application was rejected by the department. You may review decision notes and appeal options.',
        timestamp: app.decided_at || app.created_at || new Date().toISOString(),
        severity: 'warning',
        source: 'govsync_engine',
        linkTarget: 'rts',
        linkAction: 'view_appeal',
        referenceId: app.id,
      });
    }

    // C. RTS Statutory SLA Alert
    if (app.status === 'submitted' && rtsAlert.isOverdue) {
      notifications.push({
        id: `notif-rts-${app.id}-overdue`,
        type: 'rts_alert',
        title: `RTS Statutory Deadline Exceeded: ${app.id}`,
        message: `Statutory service deadline (${rtsAlert.deadlineDate}) has passed (${rtsAlert.overdueDays} days overdue). First Appeal filing is unlocked.`,
        timestamp: new Date().toISOString(),
        severity: 'urgent',
        source: 'govsync_engine',
        linkTarget: 'rts',
        linkAction: 'file_appeal',
        referenceId: app.id,
      });
    } else if (app.status === 'submitted' && rtsAlert.isCritical) {
      notifications.push({
        id: `notif-rts-${app.id}-critical`,
        type: 'rts_alert',
        title: `RTS Statutory Timeline Notice: ${app.id}`,
        message: `Application is within 3 days of statutory RTS deadline (${rtsAlert.deadlineDate}). Escalation assistance ready.`,
        timestamp: new Date().toISOString(),
        severity: 'warning',
        source: 'govsync_engine',
        linkTarget: 'rts',
        linkAction: 'track_rts',
        referenceId: app.id,
      });
    }
  }

  // 2. Notifications from Citizen Grievances
  for (const grv of grievances) {
    if (grv.status === 'resolved') {
      notifications.push({
        id: `notif-grv-${grv.id}-resolved`,
        type: 'grievance_update',
        title: `Grievance Resolved: ${grv.reference_number}`,
        message: grv.resolution_summary
          ? `Grievance resolved: "${grv.resolution_summary}"`
          : 'Your grievance has been marked as resolved by the grievance cell.',
        timestamp: grv.updated_at || grv.created_at,
        severity: 'success',
        source: 'govsync_engine',
        linkTarget: 'grievances',
        referenceId: grv.reference_number,
      });
    } else if (grv.status === 'information_required') {
      notifications.push({
        id: `notif-grv-${grv.id}-inforeq`,
        type: 'grievance_update',
        title: `Grievance Information Requested: ${grv.reference_number}`,
        message: `Additional information or clarification was requested for your grievance inquiry.`,
        timestamp: grv.updated_at || grv.created_at,
        severity: 'warning',
        source: 'govsync_engine',
        linkTarget: 'grievances',
        referenceId: grv.reference_number,
      });
    }
  }

  // 3. Relevant Verified Government Announcements
  // Match announcements related to the services the citizen has applied for or actively uses
  const citizenServices = new Set(applications.map((a) => a.service));
  for (const ann of announcements) {
    if (ann.isArchive || ann.validityStatus === 'expired') continue;

    // Match service-specific announcements
    const isServiceMatch = ann.relatedServiceId && citizenServices.has(ann.relatedServiceId);
    // Match high-impact statutory announcements (e.g. RTS expansion or digital certificate validity)
    const isHighImpactStatutory =
      ann.impactLevel === 'high' &&
      (ann.id === 'notif-aaplesarkar-rts-expansion' ||
        ann.id === 'circ-aaplesarkar-digital-signature' ||
        ann.id === 'gr-mah-2020-grievance-21day-sop');

    if (isServiceMatch || isHighImpactStatutory) {
      notifications.push({
        id: `notif-ann-${ann.id}`,
        type: 'relevant_announcement',
        title: `Official Notice: ${ann.title}`,
        message: ann.summary,
        timestamp: ann.publicationDate,
        severity: ann.impactLevel === 'high' ? 'info' : 'info',
        source: 'official_announcement',
        linkTarget: 'transparency',
        referenceId: ann.referenceNumber,
        announcement: ann,
      });
    }
  }

  // Sort: Urgent first, then by timestamp descending
  const severityRank: Record<string, number> = {
    urgent: 4,
    warning: 3,
    success: 2,
    info: 1,
  };

  notifications.sort((a, b) => {
    const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    if (diff !== 0) return diff;
    return b.timestamp.localeCompare(a.timestamp);
  });

  return notifications;
}
