import type {
  GovernmentScheme,
  OfficialAuthority,
  OfficialSource,
  SchemeCategory,
  GovernmentLevel,
  VerificationStatus,
  DeadlineType,
} from './types.ts';
import { isTrustedOfficialUrl } from './sources.ts';

export const VALID_CATEGORIES: readonly SchemeCategory[] = [
  'education',
  'agriculture',
  'employment',
  'women_child',
  'social_welfare',
  'pension',
  'health',
  'housing',
] as const;

export const VALID_GOVERNMENT_LEVELS: readonly GovernmentLevel[] = [
  'central',
  'state',
  'joint',
] as const;

export const VALID_VERIFICATION_STATUSES: readonly VerificationStatus[] = [
  'verified',
  'partially_verified',
  'verification_required',
  'outdated',
] as const;

export const VALID_DEADLINE_TYPES: readonly DeadlineType[] = [
  'no_fixed_deadline',
  'rolling',
  'annual_cycle',
  'fixed_date',
  'deadline_not_verified',
] as const;

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().startsWith(value);
}

export interface ValidationReport {
  valid: boolean;
  errors: string[];
}

export function validateSchemeCatalogue(
  schemes: readonly GovernmentScheme[],
  sources: Record<string, OfficialSource>,
  authorities: Record<string, OfficialAuthority>
): ValidationReport {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const [sourceKey, src] of Object.entries(sources)) {
    if (src.id !== sourceKey) errors.push(`Source key mismatch: ${sourceKey} vs ${src.id}`);
    if (!isTrustedOfficialUrl(src.url)) errors.push(`Untrusted or non-HTTPS source URL for ${src.id}: ${src.url}`);
    if (!isValidIsoDate(src.lastCheckedDate)) errors.push(`Invalid lastCheckedDate for source ${src.id}: ${src.lastCheckedDate}`);
    if (!src.title.trim() || !src.publisher.trim()) errors.push(`Source ${src.id} missing title or publisher`);
  }

  for (const [authKey, auth] of Object.entries(authorities)) {
    if (auth.id !== authKey) errors.push(`Authority key mismatch: ${authKey} vs ${auth.id}`);
    if (!isTrustedOfficialUrl(auth.officialWebsite)) {
      errors.push(`Untrusted officialWebsite for authority ${auth.id}: ${auth.officialWebsite}`);
    }
  }

  for (const scheme of schemes) {
    if (!scheme.id.trim()) {
      errors.push('Scheme missing id');
      continue;
    }
    if (seenIds.has(scheme.id)) errors.push(`Duplicate scheme id: ${scheme.id}`);
    seenIds.add(scheme.id);

    if (!scheme.name.trim()) errors.push(`${scheme.id}: missing name`);
    if (!VALID_CATEGORIES.includes(scheme.category)) errors.push(`${scheme.id}: invalid category ${scheme.category}`);
    if (!VALID_GOVERNMENT_LEVELS.includes(scheme.level)) errors.push(`${scheme.id}: invalid level ${scheme.level}`);
    if (!VALID_VERIFICATION_STATUSES.includes(scheme.verificationStatus)) {
      errors.push(`${scheme.id}: invalid verificationStatus ${scheme.verificationStatus}`);
    }
    if (!isValidIsoDate(scheme.lastVerifiedDate)) {
      errors.push(`${scheme.id}: invalid lastVerifiedDate ${scheme.lastVerifiedDate}`);
    }
    if (!authorities[scheme.departmentId]) {
      errors.push(`${scheme.id}: unknown departmentId ${scheme.departmentId}`);
    }
    if (scheme.implementingAgencyId && !authorities[scheme.implementingAgencyId]) {
      errors.push(`${scheme.id}: unknown implementingAgencyId ${scheme.implementingAgencyId}`);
    }
    if (!scheme.shortDescription.trim() || !scheme.detailedDescription.trim()) {
      errors.push(`${scheme.id}: empty description`);
    }
    if (!scheme.benefitSummary.trim() || scheme.benefits.length === 0 || scheme.benefits.some((b) => !b.trim())) {
      errors.push(`${scheme.id}: invalid or empty benefits`);
    }
    if (scheme.requiredDocuments.length === 0 || scheme.requiredDocuments.some((d) => !d.trim())) {
      errors.push(`${scheme.id}: invalid or empty requiredDocuments`);
    }
    if (scheme.applicationProcess.length === 0 || scheme.applicationProcess.some((s) => !s.trim())) {
      errors.push(`${scheme.id}: invalid or empty applicationProcess`);
    }
    if (!VALID_DEADLINE_TYPES.includes(scheme.deadline.type) || !scheme.deadline.label.trim()) {
      errors.push(`${scheme.id}: invalid deadline`);
    }
    if (scheme.deadline.type === 'fixed_date' && (!scheme.deadline.date || !isValidIsoDate(scheme.deadline.date))) {
      errors.push(`${scheme.id}: fixed_date deadline missing valid date`);
    }
    if (scheme.applicationPortalUrl !== null && !isTrustedOfficialUrl(scheme.applicationPortalUrl)) {
      errors.push(`${scheme.id}: untrusted applicationPortalUrl ${scheme.applicationPortalUrl}`);
    }
    if (scheme.sourceIds.length === 0) {
      errors.push(`${scheme.id}: must reference at least one official source`);
    }
    for (const srcId of scheme.sourceIds) {
      if (!sources[srcId]) errors.push(`${scheme.id}: unknown sourceId ${srcId}`);
    }
    if (scheme.verificationStatus === 'verified') {
      const hasSpecificPage = scheme.sourceIds.some((srcId) => {
        const src = sources[srcId];
        if (!src) return false;
        try {
          const parsed = new URL(src.url);
          return parsed.pathname !== '/' && parsed.pathname.length > 1;
        } catch {
          return false;
        }
      });
      if (!hasSpecificPage) {
        errors.push(
          `${scheme.id}: verified scheme must have at least one specific non-root official source URL`
        );
      }
    }
    if (scheme.eligibilityCriteria.length === 0) {
      errors.push(`${scheme.id}: must define eligibilityCriteria`);
    }
    const seenCriteriaIds = new Set<string>();
    for (const c of scheme.eligibilityCriteria) {
      if (seenCriteriaIds.has(c.id)) errors.push(`${scheme.id}: duplicate criterion id ${c.id}`);
      seenCriteriaIds.add(c.id);
      if (!c.label.trim() || !c.explanation.trim()) errors.push(`${scheme.id}/${c.id}: empty label or explanation`);
      if (!sources[c.sourceId]) errors.push(`${scheme.id}/${c.id}: unknown sourceId ${c.sourceId}`);
      if (c.autoEvaluated && c.operator !== 'manual' && !c.field) {
        errors.push(`${scheme.id}/${c.id}: autoEvaluated criterion missing field`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
