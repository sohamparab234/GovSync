import { calculateRtsDeadline } from './rts.ts';
import type { ApplicationRecord } from './types.ts';

export type GrievanceCategory =
  | 'application_delay'
  | 'rejection'
  | 'incorrect_information'
  | 'service_delivery_issue'
  | 'department_communication'
  | 'portal_technical_issue'
  | 'other';

export type GrievanceStatus =
  | 'submitted'
  | 'under_review'
  | 'information_required'
  | 'response_provided'
  | 'resolved'
  | 'closed';

export interface GrievanceCategoryMeta {
  key: GrievanceCategory;
  label: string;
  description: string;
}

export const GRIEVANCE_CATEGORIES: GrievanceCategoryMeta[] = [
  {
    key: 'application_delay',
    label: 'Application delay',
    description: 'Service delivery time has exceeded the normal or expected timeframe.',
  },
  {
    key: 'rejection',
    label: 'Rejection or adverse decision',
    description: 'Application was rejected without clear grounds or due procedure.',
  },
  {
    key: 'incorrect_information',
    label: 'Incorrect application information',
    description: 'Department records, certificates, or notices contain erroneous citizen details.',
  },
  {
    key: 'service_delivery_issue',
    label: 'Service delivery issue',
    description: 'Physical or digital certificate/benefit was not delivered or is inaccessible.',
  },
  {
    key: 'department_communication',
    label: 'Department communication',
    description: 'Lack of clarification or failure of departmental officials to respond.',
  },
  {
    key: 'portal_technical_issue',
    label: 'Technical issue with government portal',
    description: 'Portal error, payment failure, document upload glitch, or session timeout.',
  },
  {
    key: 'other',
    label: 'Other service-related complaint',
    description: 'Any other grievance regarding public service handling or processing.',
  },
];

export interface GrievanceStatusMeta {
  key: GrievanceStatus;
  label: string;
  badgeTone: 'neutral' | 'orange' | 'green' | 'red';
  description: string;
}

export const GRIEVANCE_STATUSES: Record<GrievanceStatus, GrievanceStatusMeta> = {
  submitted: {
    key: 'submitted',
    label: 'Submitted',
    badgeTone: 'neutral',
    description: 'Grievance recorded in GovSync; awaiting review by the coordination desk.',
  },
  under_review: {
    key: 'under_review',
    label: 'Under Review',
    badgeTone: 'orange',
    description: 'Under active assessment by GovSync assistance staff.',
  },
  information_required: {
    key: 'information_required',
    label: 'Information Required',
    badgeTone: 'orange',
    description: 'Additional documentation or clarification requested from the citizen.',
  },
  response_provided: {
    key: 'response_provided',
    label: 'Response Provided',
    badgeTone: 'neutral',
    description: 'Citizen submitted requested clarification; awaiting resumed review.',
  },
  resolved: {
    key: 'resolved',
    label: 'Resolved',
    badgeTone: 'green',
    description: 'Assistance provided or official advisory/escalation guidance issued.',
  },
  closed: {
    key: 'closed',
    label: 'Closed',
    badgeTone: 'neutral',
    description: 'Grievance ticket concluded or withdrawn by the citizen.',
  },
};

export interface GrievanceRecord {
  id: string;
  reference_number: string;
  owner: string;
  citizen_id: string;
  category: GrievanceCategory;
  subject: string;
  description: string;
  application_id: string | null;
  service: string | null;
  department: string | null;
  department_verified: number; // 1 = verified, 0 = not verified
  status: GrievanceStatus;
  citizen_response: string | null;
  admin_note: string | null;
  resolution_summary: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface GrievanceEventRecord {
  id: string;
  grievance_id: string;
  action: string;
  actor: string;
  actor_role: 'citizen' | 'admin' | 'system';
  details: string;
  created_at: string;
}

export interface GrievanceSummaryMetrics {
  total: number;
  awaitingReview: number;
  informationRequired: number;
  resolved: number;
}

export interface RtsAdvisory {
  isOverdue: boolean;
  serviceName: string;
  stipulatedDays: number | null;
  statutoryWording: string;
  advisoryText: string;
  aapleSarkarUrl: string;
}

/**
 * Sensitive PII and security protection:
 * Disallows Aadhaar numbers, bank account numbers, IFSC codes, credit card numbers, passwords.
 */
export function validatePiiSafety(text: string): { safe: boolean; error?: string } {
  // 12-digit Aadhaar number with optional spaces/hyphens
  const aadhaarRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/;
  if (aadhaarRegex.test(text)) {
    return {
      safe: false,
      error: 'For your security, do not enter 12-digit Aadhaar numbers or national identity IDs in grievance text.',
    };
  }

  // 11-character Indian Financial System Code (IFSC)
  const ifscRegex = /\b[A-Z]{4}0[A-Z0-9]{6}\b/i;
  if (ifscRegex.test(text)) {
    return {
      safe: false,
      error: 'Do not enter bank account numbers or IFSC codes. GovSync does not process monetary transfers.',
    };
  }

  // Common credit card patterns (13 to 16 digits)
  const cardRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13})\b/;
  if (cardRegex.test(text)) {
    return {
      safe: false,
      error: 'Do not enter payment card details or CVV numbers in grievance text.',
    };
  }

  // Password / OTP markers
  const credentialRegex = /\b(password|passcode|otp|one[ -]time[ -]password|pin)\s*[:=]\s*\S+/i;
  if (credentialRegex.test(text)) {
    return {
      safe: false,
      error: 'Never submit account passwords, OTPs, or secret PINs.',
    };
  }

  return { safe: true };
}

/**
 * Validates new grievance submission inputs.
 */
export function validateGrievanceInput(data: {
  subject?: unknown;
  category?: unknown;
  description?: unknown;
  applicationId?: unknown;
  service?: unknown;
  department?: unknown;
}): { valid: boolean; error?: string } {
  if (typeof data.subject !== 'string' || data.subject.trim().length < 5 || data.subject.trim().length > 150) {
    return {
      valid: false,
      error: 'Subject must be between 5 and 150 characters.',
    };
  }

  const validCategories = GRIEVANCE_CATEGORIES.map((c) => c.key);
  if (typeof data.category !== 'string' || !validCategories.includes(data.category as GrievanceCategory)) {
    return {
      valid: false,
      error: 'Select a valid grievance category.',
    };
  }

  if (
    typeof data.description !== 'string' ||
    data.description.trim().length < 20 ||
    data.description.trim().length > 2000
  ) {
    return {
      valid: false,
      error: 'Description must be between 20 and 2,000 characters.',
    };
  }

  // PII checks on subject and description
  const subjectPii = validatePiiSafety(data.subject);
  if (!subjectPii.safe) return { valid: false, error: subjectPii.error };

  const descPii = validatePiiSafety(data.description);
  if (!descPii.safe) return { valid: false, error: descPii.error };

  return { valid: true };
}

/**
 * Generates a standard GovSync grievance reference number.
 * Format: GRV-YYYY-XXXXXXXX (e.g. GRV-2026-A1B2C3D4)
 */
export function generateGrievanceReference(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GRV-${year}-${rand}`;
}

/**
 * Calculates mutually exclusive grievance summary metrics for a list of records.
 * Total = awaitingReview + informationRequired + resolved
 */
export function getGrievanceSummary(records: GrievanceRecord[]): GrievanceSummaryMetrics {
  let awaitingReview = 0;
  let informationRequired = 0;
  let resolved = 0;

  for (const r of records) {
    if (r.status === 'information_required') {
      informationRequired++;
    } else if (r.status === 'resolved' || r.status === 'closed') {
      resolved++;
    } else if (['submitted', 'under_review', 'response_provided'].includes(r.status)) {
      awaitingReview++;
    } else {
      awaitingReview++;
    }
  }

  return {
    total: records.length,
    awaitingReview,
    informationRequired,
    resolved,
  };
}

/**
 * Inspects an associated application to determine whether an RTS Statutory Overdue
 * warning banner must be shown, and returns explicit legal boundary notices.
 */
export function getRtsAdvisoryForGrievance(app: ApplicationRecord | null): RtsAdvisory | null {
  if (!app) return null;
  const deadline = calculateRtsDeadline(app);
  if (deadline.status === 'timeline_not_verified' || deadline.stipulatedDays === null) return null;

  const isOverdue = deadline.isOverdue || deadline.status === 'overdue' || deadline.status === 'deadline_reached';

  return {
    isOverdue,
    serviceName: deadline.serviceName,
    stipulatedDays: deadline.stipulatedDays,
    statutoryWording: deadline.statutoryWording,
    advisoryText: isOverdue
      ? 'Statutory Delivery Notice: This application has reached or exceeded its stipulated timeline under the Maharashtra Right to Public Services Act, 2015. Filing a GovSync grievance is for internal coordination and does NOT constitute a statutory First Appeal under Section 9(1). To enforce statutory delivery deadlines, you may file a formal First Appeal directly on the Aaple Sarkar portal.'
      : 'Statutory Delivery Notice: This service is notified under the Maharashtra Right to Public Services Act, 2015. Lodging a GovSync grievance does not pause, alter, or reset the statutory delivery countdown.',
    aapleSarkarUrl: 'https://aaplesarkar.mahaonline.gov.in/',
  };
}
