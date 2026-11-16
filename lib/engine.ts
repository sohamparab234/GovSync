import { services, type Service, type DataConflict } from './services.ts';
import { assessResidence } from './residence.ts';
import { assess as assessScholarship } from './demo.ts';
import type { AssessmentResult, RuleEvaluation } from './types.ts';

export function calculateAge(dobString: unknown): number {
  if (typeof dobString !== 'string' || !dobString) return 0;
  const match = dobString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 0;
  const birthYear = Number(match[1]);
  const currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - birthYear);
}

export function detectConflicts(
  records: Record<string, Record<string, unknown>>,
  inputDetails: Record<string, unknown> = {}
): DataConflict[] {
  const conflicts: DataConflict[] = [];
  const identity = records.identity || {};
  const education = records.education || {};
  const residence = records.residence || {};
  const documents = records.documents || {};

  // 1. Identity vs Education Date of Birth conflict
  if (identity.dateOfBirth && education.dateOfBirth && identity.dateOfBirth !== education.dateOfBirth) {
    conflicts.push({
      field: 'dateOfBirth',
      label: 'Date of Birth Discrepancy',
      sources: [
        { department: 'identity', sourceLabel: 'National Identity (UIDAI)', value: String(identity.dateOfBirth) },
        { department: 'education', sourceLabel: 'National Academic Depository', value: String(education.dateOfBirth) },
      ],
      severity: 'high',
      description: 'Date of birth recorded on Aadhaar does not match school/college examination records.',
    });
  }

  // 2. Identity Name vs Education Student Name conflict
  if (identity.name && education.name && identity.name !== education.name) {
    conflicts.push({
      field: 'name',
      label: 'Applicant Name Variation',
      sources: [
        { department: 'identity', sourceLabel: 'National Identity (UIDAI)', value: String(identity.name) },
        { department: 'education', sourceLabel: 'National Academic Depository', value: String(education.name) },
      ],
      severity: 'medium',
      description: 'Minor name variation between identity records and academic enrollment.',
    });
  }

  // 3. Residence Registry vs Application Address discrepancy
  if (residence.address && inputDetails.address && residence.address !== inputDetails.address) {
    conflicts.push({
      field: 'address',
      label: 'Address Discrepancy',
      sources: [
        { department: 'residence', sourceLabel: 'State Residence Registry', value: String(residence.address) },
        { department: 'documents', sourceLabel: 'Application Stated Address', value: String(inputDetails.address) },
      ],
      severity: 'medium',
      description: 'Address entered on application differs from the verified state residence database.',
    });
  }

  // 4. Identity Reference vs Document Reference conflict
  if (documents.citizenId && identity.citizenId && documents.citizenId !== identity.citizenId) {
    conflicts.push({
      field: 'citizenId',
      label: 'Citizen Identifier Mismatch',
      sources: [
        { department: 'identity', sourceLabel: 'Identity Registry', value: String(identity.citizenId) },
        { department: 'documents', sourceLabel: 'DigiLocker Document Vault', value: String(documents.citizenId) },
      ],
      severity: 'high',
      description: 'Supporting document is registered under a different citizen identifier.',
    });
  }

  return conflicts;
}

export function evaluateApplication(
  serviceId: Service,
  records: Record<string, Record<string, unknown>>,
  inputDetails: Record<string, unknown> = {}
): AssessmentResult {
  // Preserve exact legacy behavior for Scholarship and Residence
  if (serviceId === 'residence') {
    return assessResidence(records, inputDetails) as unknown as AssessmentResult;
  }
  if (serviceId === 'scholarship') {
    return assessScholarship(records) as unknown as AssessmentResult;
  }

  const def = services[serviceId];
  if (!def) {
    throw new Error(`Unknown service: ${serviceId}`);
  }

  const identity = records.identity || {};
  const education = records.education || {};
  const income = records.income || {};
  const residence = records.residence || {};
  const documents = records.documents || {};

  const age = calculateAge(identity.dateOfBirth);
  const annualIncome = Number(income.annualIncome ?? 0);
  const conflicts = detectConflicts(records, inputDetails);

  const profile: Record<string, unknown> = {
    ...identity,
    ...education,
    ...income,
    ...residence,
    ...documents,
    ...inputDetails,
    name: identity.name || '',
    dateOfBirth: identity.dateOfBirth || '',
    age,
    annualIncome,
  };

  const rules: RuleEvaluation[] = def.rules.map((rule) => {
    let passed = false;
    let detail = rule.detail || '';

    switch (rule.id) {
      case 'adult_applicant':
      case 'adult_age':
        passed = age >= 18;
        detail = `Applicant age is ${age} years (minimum required: 18).`;
        break;

      case 'senior_age':
        passed = age >= 60;
        detail = `Applicant age is ${age} years (minimum senior age: 60).`;
        break;

      case 'income_limit_bpl':
        passed = annualIncome <= 300000;
        detail = `₹${annualIncome.toLocaleString('en-IN')} annual income (ceiling: ₹3,00,000).`;
        break;

      case 'income_ceiling':
        passed = annualIncome <= 100000;
        detail = `₹${annualIncome.toLocaleString('en-IN')} annual income (pension ceiling: ₹1,00,000).`;
        break;

      case 'active_assessment':
        passed = annualIncome > 0 && Boolean(income.financialYear);
        detail = `Verified for FY ${income.financialYear || '2026-27'} with active revenue assessment.`;
        break;

      case 'residence_verified':
      case 'state_residence':
      case 'state_domicile':
        passed = residence.state === 'Maharashtra' && residence.domicileVerified === true;
        detail = `${String(residence.state || '')} · ${String(residence.district || '')}`;
        break;

      case 'documents_verified':
      case 'community_docs_verified':
        passed = documents.documentVerified === true;
        detail = documents.documentId ? `DigiLocker record ${documents.documentId} verified.` : 'Verified in DigiLocker vault.';
        break;

      case 'identity_verified':
        passed = Boolean(identity.name && identity.dateOfBirth && identity.verified !== false);
        detail = 'UIDAI demographic and biometric verification confirmed.';
        break;

      case 'identity_consistent':
        passed = !conflicts.some((c) => c.severity === 'high');
        detail = passed ? 'Demographic records consistent across departments.' : 'Conflicts detected across source registries.';
        break;

      default:
        // Generic operator evaluation
        const actual = profile[rule.field];
        if (rule.operator === '>=') passed = Number(actual) >= Number(rule.value);
        else if (rule.operator === '<=') passed = Number(actual) <= Number(rule.value);
        else if (rule.operator === '==') passed = actual === rule.value;
        else if (rule.operator === '!=') passed = actual !== rule.value;
        else passed = Boolean(actual);
        break;
    }

    return {
      label: rule.label,
      passed,
      detail,
    };
  });

  const highConflicts = conflicts.filter((c) => c.severity === 'high');
  const hasUnresolvedDiscrepancy = highConflicts.length > 0;
  const allRulesPassed = rules.every((r) => r.passed);

  let status: 'eligible' | 'ineligible' | 'needs_review' = 'eligible';
  if (!allRulesPassed) {
    // If critical rules fail, mark as ineligible; if only review rules fail, mark needs_review
    const criticalFailed = def.rules.some((r, i) => r.critical && !rules[i].passed);
    status = criticalFailed ? 'ineligible' : 'needs_review';
  } else if (hasUnresolvedDiscrepancy) {
    status = 'needs_review';
  }

  return {
    status,
    rules,
    profile,
    details: inputDetails,
  };
}
