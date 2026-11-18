import type {
  CriterionEvaluation,
  EligibilityCriterion,
  GovernmentScheme,
  IncomeBracketId,
  MatchStatus,
  QuestionnaireAnswers,
  SchemeMatchResult,
} from './types.ts';
import { getOfficialSources } from './sources.ts';

export const INCOME_BRACKET_RANGES: Record<
  IncomeBracketId,
  { min: number; max: number; label: string }
> = {
  up_to_21000: { min: 0, max: 21000, label: 'Up to ₹21,000' },
  '21001_to_50000': { min: 21001, max: 50000, label: '₹21,001 – ₹50,000' },
  '50001_to_180000': { min: 50001, max: 180000, label: '₹50,001 – ₹1,80,000' },
  '180001_to_250000': { min: 180001, max: 250000, label: '₹1,80,001 – ₹2,50,000' },
  '250001_to_800000': { min: 250001, max: 800000, label: '₹2,50,001 – ₹8,00,000' },
  above_800000: { min: 800001, max: Number.POSITIVE_INFINITY, label: 'Above ₹8,00,000' },
};

export function hasAnyQuestionnaireAnswer(answers: QuestionnaireAnswers): boolean {
  return Object.values(answers).some(
    (v) => v !== undefined && v !== '' && v !== null && !(typeof v === 'number' && !Number.isFinite(v))
  );
}

function isValidFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

function evaluateSingleCondition(
  operator: EligibilityCriterion['operator'],
  actual: unknown,
  expected: EligibilityCriterion['expectedValue']
): 'matched' | 'failed' | 'missing' {
  if (actual === undefined || actual === null || actual === '') {
    return 'missing';
  }

  switch (operator) {
    case 'eq':
      return actual === expected ? 'matched' : 'failed';
    case 'neq':
      return actual !== expected ? 'matched' : 'failed';
    case 'bool':
      if (typeof actual !== 'boolean') return 'missing';
      return actual === Boolean(expected) ? 'matched' : 'failed';
    case 'gt': {
      if (!isValidFiniteNumber(actual) || actual < 0) return 'missing';
      return actual > Number(expected) ? 'matched' : 'failed';
    }
    case 'gte': {
      if (!isValidFiniteNumber(actual) || actual < 0) return 'missing';
      return actual >= Number(expected) ? 'matched' : 'failed';
    }
    case 'lt': {
      if (!isValidFiniteNumber(actual) || actual < 0) return 'missing';
      return actual < Number(expected) ? 'matched' : 'failed';
    }
    case 'lte': {
      if (!isValidFiniteNumber(actual) || actual < 0) return 'missing';
      return actual <= Number(expected) ? 'matched' : 'failed';
    }
    case 'in': {
      if (!Array.isArray(expected)) return 'missing';
      return expected.includes(actual as string | number | boolean) ? 'matched' : 'failed';
    }
    case 'income_lte': {
      if (
        typeof actual !== 'string' ||
        !Object.prototype.hasOwnProperty.call(INCOME_BRACKET_RANGES, actual)
      ) {
        return 'missing';
      }
      const range = INCOME_BRACKET_RANGES[actual as IncomeBracketId];
      const limit = Number(expected);
      // Matched only if the entire selected bracket is <= the official ceiling.
      if (range.max <= limit) return 'matched';
      // Failed only if the entire selected bracket is strictly above the ceiling.
      if (range.min > limit) return 'failed';
      // If bracket straddles the ceiling, never convert uncertainty into a positive match.
      return 'missing';
    }
    case 'manual':
    default:
      return 'missing';
  }
}

export function evaluateCriterion(
  criterion: EligibilityCriterion,
  answers: QuestionnaireAnswers
): CriterionEvaluation {
  if (!criterion.autoEvaluated || criterion.operator === 'manual' || !criterion.field) {
    return {
      criterion,
      outcome: 'manual_verification',
      reason: criterion.explanation,
    };
  }

  // Handle conditional income ceiling overrides (e.g., PwD ₹50,000 limit under Sanjay Gandhi Yojana)
  let effectiveExpected = criterion.expectedValue;
  let forcePrimaryMissing = false;

  if (
    criterion.operator === 'income_lte' &&
    criterion.conditionalIncomeOverride
  ) {
    const override = criterion.conditionalIncomeOverride;
    const triggerVal = answers[override.whenField];
    if (triggerVal === override.whenEquals) {
      effectiveExpected = override.maxIncome;
    } else if (triggerVal === undefined) {
      // If the applicant's bracket is between base ceiling and override ceiling,
      // and disability status is unanswered, keep primary outcome as missing
      // (while still allowing an OR condition like BPL card to satisfy the criterion!).
      const bracket = answers[criterion.field];
      const range =
        typeof bracket === 'string' &&
        Object.prototype.hasOwnProperty.call(INCOME_BRACKET_RANGES, bracket)
          ? INCOME_BRACKET_RANGES[bracket as IncomeBracketId]
          : undefined;
      if (range && range.min > Number(criterion.expectedValue) && range.max <= override.maxIncome) {
        forcePrimaryMissing = true;
      }
    }
  }

  const primaryActual = answers[criterion.field];
  const primaryOutcome: 'matched' | 'failed' | 'missing' = forcePrimaryMissing
    ? 'missing'
    : evaluateSingleCondition(criterion.operator, primaryActual, effectiveExpected);

  // Support OR alternative condition (e.g., income <= ₹21,000 OR BPL cardholder)
  if (criterion.orField && criterion.orOperator) {
    const orActual = answers[criterion.orField];
    const orOutcome = evaluateSingleCondition(
      criterion.orOperator,
      orActual,
      criterion.orExpectedValue
    );

    if (primaryOutcome === 'matched' || orOutcome === 'matched') {
      return {
        criterion,
        outcome: 'matched',
        reason: criterion.explanation,
      };
    }
    if (primaryOutcome === 'failed' && orOutcome === 'failed') {
      return {
        criterion,
        outcome: 'failed',
        reason: criterion.explanation,
      };
    }
    return {
      criterion,
      outcome: 'missing',
      reason: criterion.explanation,
    };
  }

  return {
    criterion,
    outcome: primaryOutcome,
    reason: criterion.explanation,
  };
}

export function evaluateScheme(
  scheme: GovernmentScheme,
  answers: QuestionnaireAnswers
): SchemeMatchResult {
  const sources = getOfficialSources(scheme.sourceIds);
  const evaluations = scheme.eligibilityCriteria.map((criterion) =>
    evaluateCriterion(criterion, answers)
  );

  const matchedCriteria = evaluations.filter((e) => e.outcome === 'matched');
  const failedCriteria = evaluations.filter((e) => e.outcome === 'failed');
  const missingAnswers = evaluations.filter((e) => e.outcome === 'missing');
  const manualVerificationCriteria = evaluations.filter(
    (e) => e.outcome === 'manual_verification'
  );

  if (!hasAnyQuestionnaireAnswer(answers)) {
    return {
      scheme,
      status: 'not_evaluated',
      matchedCriteria: [],
      failedCriteria: [],
      missingAnswers,
      manualVerificationCriteria,
      explanation: 'Answer the eligibility questionnaire to check how your details align with official conditions.',
      sources,
    };
  }

  const strictFailure = failedCriteria.some((e) => e.criterion.strict);
  let status: MatchStatus;
  let explanation: string;

  if (strictFailure) {
    status = 'not_eligible';
    explanation = 'One or more required official conditions do not match your current answers.';
  } else if (missingAnswers.length > 0 || matchedCriteria.length === 0) {
    status = 'needs_info';
    explanation = 'No conflicts found so far, but more details are needed to evaluate remaining conditions.';
  } else if (failedCriteria.length > 0) {
    // Non-strict condition did not match -> require user verification rather than claiming likely_eligible
    status = 'needs_info';
    explanation = 'Core conditions align, but an additional condition requires checking on the official portal.';
  } else {
    status = 'likely_eligible';
    explanation =
      manualVerificationCriteria.length > 0
        ? 'Your answers match all checked conditions. Confirm the remaining official criteria on the government portal.'
        : 'Your answers match all checked eligibility conditions. Final approval is determined by the official authority.';
  }

  return {
    scheme,
    status,
    matchedCriteria,
    failedCriteria,
    missingAnswers,
    manualVerificationCriteria,
    explanation,
    sources,
  };
}

const STATUS_SORT_ORDER: Record<MatchStatus, number> = {
  likely_eligible: 0,
  needs_info: 1,
  not_eligible: 2,
  not_evaluated: 3,
};

export function evaluateAllSchemes(
  schemes: readonly GovernmentScheme[],
  answers: QuestionnaireAnswers
): SchemeMatchResult[] {
  const results = schemes.map((scheme) => evaluateScheme(scheme, answers));
  if (!hasAnyQuestionnaireAnswer(answers)) {
    return results;
  }

  return [...results].sort((a, b) => {
    const orderDiff = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
    if (orderDiff !== 0) return orderDiff;
    // Within the same status bucket, rank schemes with more matched criteria first
    return b.matchedCriteria.length - a.matchedCriteria.length;
  });
}
