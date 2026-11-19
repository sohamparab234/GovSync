import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { governmentSchemes, maharashtraDistricts, schemeCategoryMeta } from '../lib/gov-info/schemes.ts';
import { officialAuthorities } from '../lib/gov-info/authorities.ts';
import { officialSources, isTrustedOfficialUrl } from '../lib/gov-info/sources.ts';
import {
  VALID_CATEGORIES,
  isValidIsoDate,
  validateSchemeCatalogue,
} from '../lib/gov-info/validation.ts';
import {
  INCOME_BRACKET_RANGES,
  evaluateAllSchemes,
  evaluateScheme,
  hasAnyQuestionnaireAnswer,
} from '../lib/gov-info/scheme-matcher.ts';

let assertions = 0;
function check(cond, msg) {
  assert.ok(cond, msg);
  assertions++;
}
function eq(a, b, msg) {
  assert.equal(a, b, msg);
  assertions++;
}

// =========================================================================
// 1. CATALOGUE INTEGRITY & OFFICIAL SOURCE VALIDATION
// =========================================================================
const report = validateSchemeCatalogue(
  governmentSchemes,
  officialSources,
  officialAuthorities
);
eq(report.valid, true, 'Catalogue validation failed: ' + report.errors.join('; '));
check(governmentSchemes.length >= 10, 'Expected at least 10 curated schemes');

// Verify all 8 required categories are represented
const coveredCategories = new Set(governmentSchemes.map((s) => s.category));
for (const cat of VALID_CATEGORIES) {
  check(coveredCategories.has(cat), `Missing scheme coverage for category: ${cat}`);
}

// Verify strict URL security helper
check(isTrustedOfficialUrl('https://mahadbt.maharashtra.gov.in'), 'Valid MH gov URL');
check(isTrustedOfficialUrl('https://pmkisan.gov.in/Default.aspx'), 'Valid central gov URL');
check(isTrustedOfficialUrl('https://pmayg.dord.gov.in'), 'Valid dord gov URL');
check(!isTrustedOfficialUrl('http://pmkisan.gov.in'), 'HTTP must be rejected');
check(!isTrustedOfficialUrl('javascript:alert(1)'), 'javascript: must be rejected');
check(!isTrustedOfficialUrl('https://evil-schemes.example.com'), 'Third-party domain must be rejected');
check(!isTrustedOfficialUrl('https://maharashtra.gov.in.evil.com'), 'Spoofed subdomain must be rejected');
check(!isTrustedOfficialUrl('https://user:pass@pmkisan.gov.in'), 'Embedded credentials must be rejected');
check(!isTrustedOfficialUrl('https://gov.in'), 'Bare .gov.in suffix without subdomain must be rejected');
check(isValidIsoDate('2026-11-18'), 'Valid ISO date');
check(!isValidIsoDate('2026-02-31'), 'Invalid calendar date must fail');
check(!isValidIsoDate('18-11-2026'), 'Non-ISO date format must fail');

// Verify institutional role distinctions
eq(officialAuthorities.goi_uidai.role, 'identity_authenticator', 'UIDAI must be identity_authenticator');
eq(officialAuthorities.goi_digilocker.role, 'document_platform', 'DigiLocker must be document_platform');
eq(officialAuthorities.mh_revenue_issuer.role, 'certificate_issuer', 'MH Revenue must be certificate_issuer');

// Verify every scheme has valid sources and verified/partially_verified distinction
const hasPartiallyVerified = governmentSchemes.some((s) => s.verificationStatus === 'partially_verified');
check(hasPartiallyVerified, 'Catalogue should transparently distinguish partially_verified entries where applicable');

// =========================================================================
// 2. ELIGIBILITY MATCHING ENGINE (DETERMINISM, BOUNDARIES, EXCLUSIONS)
// =========================================================================
const byId = (id) => governmentSchemes.find((s) => s.id === id);

// 2a. Empty questionnaire -> not_evaluated, never false positive
eq(hasAnyQuestionnaireAnswer({}), false, 'Empty answers should return false');
const emptyResults = evaluateAllSchemes(governmentSchemes, {});
for (const r of emptyResults) {
  eq(r.status, 'not_evaluated', `${r.scheme.id} should be not_evaluated when answers are empty`);
  eq(r.matchedCriteria.length, 0, `${r.scheme.id} must have 0 matchedCriteria when empty`);
}

// 2b. Ladki Bahin exact match + age boundary tests (21..65) + tax exclusion
const ladki = byId('mh-ladki-bahin');
const lbEligible = evaluateScheme(ladki, {
  stateOfResidence: 'maharashtra',
  gender: 'female',
  age: 28,
  incomeBracket: '180001_to_250000',
  isIncomeTaxPayer: false,
});
eq(lbEligible.status, 'likely_eligible', 'Valid Ladki Bahin profile should be likely_eligible');
check(lbEligible.manualVerificationCriteria.length >= 1, 'Ladki Bahin must retain manual asset/govt-job verification');

// Boundary age 20 (fail) and 21 (pass) and 65 (pass) and 66 (fail)
eq(
  evaluateScheme(ladki, { stateOfResidence: 'maharashtra', gender: 'female', age: 20, incomeBracket: 'up_to_21000', isIncomeTaxPayer: false }).status,
  'not_eligible',
  'Ladki Bahin age 20 must fail'
);
eq(
  evaluateScheme(ladki, { stateOfResidence: 'maharashtra', gender: 'female', age: 21, incomeBracket: 'up_to_21000', isIncomeTaxPayer: false }).status,
  'likely_eligible',
  'Ladki Bahin age 21 boundary must pass'
);
eq(
  evaluateScheme(ladki, { stateOfResidence: 'maharashtra', gender: 'female', age: 65, incomeBracket: 'up_to_21000', isIncomeTaxPayer: false }).status,
  'likely_eligible',
  'Ladki Bahin age 65 boundary must pass'
);
eq(
  evaluateScheme(ladki, { stateOfResidence: 'maharashtra', gender: 'female', age: 66, incomeBracket: 'up_to_21000', isIncomeTaxPayer: false }).status,
  'not_eligible',
  'Ladki Bahin age 66 must fail'
);
// Tax exclusion
eq(
  evaluateScheme(ladki, { stateOfResidence: 'maharashtra', gender: 'female', age: 30, incomeBracket: '180001_to_250000', isIncomeTaxPayer: true }).status,
  'not_eligible',
  'Ladki Bahin income tax payer must be not_eligible'
);
// Missing income -> needs_info (never false positive!)
eq(
  evaluateScheme(ladki, { stateOfResidence: 'maharashtra', gender: 'female', age: 30, isIncomeTaxPayer: false }).status,
  'needs_info',
  'Ladki Bahin with missing income must be needs_info'
);

// 2c. Education scholarships (EBC vs SC Post-Matric)
const ebc = byId('mh-rcsm-ebc-scholarship');
const scPm = byId('goi-post-matric-sc-mh');
const ewsStudent = {
  stateOfResidence: 'maharashtra',
  occupation: 'student',
  educationLevel: 'post_matric',
  socialCategory: 'general_ews',
  incomeBracket: '250001_to_800000',
};
eq(evaluateScheme(ebc, ewsStudent).status, 'likely_eligible', 'EWS student <= 8L should match EBC');
eq(evaluateScheme(scPm, ewsStudent).status, 'not_eligible', 'EWS student > 2.5L should not match SC Post-Matric');

const scStudent = {
  stateOfResidence: 'maharashtra',
  occupation: 'student',
  educationLevel: 'post_matric',
  socialCategory: 'sc',
  incomeBracket: '180001_to_250000',
};
eq(evaluateScheme(scPm, scStudent).status, 'likely_eligible', 'SC student <= 2.5L should match SC Post-Matric');
eq(evaluateScheme(ebc, scStudent).status, 'not_eligible', 'SC student should not match General/EWS EBC');

// 2d. Agriculture (PM-KISAN & SMAM)
const pmkisan = byId('pm-kisan');
const smam = byId('mh-smam-mechanization');
const mhFarmer = {
  stateOfResidence: 'maharashtra',
  occupation: 'farmer',
  isFarmerWithLand: true,
  isIncomeTaxPayer: false,
};
eq(evaluateScheme(pmkisan, mhFarmer).status, 'likely_eligible', 'Landholding non-tax farmer matches PM-KISAN');
eq(evaluateScheme(smam, mhFarmer).status, 'likely_eligible', 'MH landholding farmer matches SMAM');
eq(
  evaluateScheme(pmkisan, { ...mhFarmer, isIncomeTaxPayer: true }).status,
  'not_eligible',
  'Income tax payer excluded from PM-KISAN'
);
eq(
  evaluateScheme(smam, { ...mhFarmer, stateOfResidence: 'other' }).status,
  'not_eligible',
  'Non-Maharashtra resident excluded from MH SMAM'
);

// 2e. Sanjay Gandhi Niradhar (PwD conditional income ceiling ₹50,000 + OR BPL condition)
const sgny = byId('mh-sanjay-gandhi-niradhar');
eq(
  evaluateScheme(sgny, {
    stateOfResidence: 'maharashtra',
    age: 40,
    hasDisability: true,
    incomeBracket: '21001_to_50000',
    rationCardType: 'none',
  }).status,
  'likely_eligible',
  'PwD with income up to ₹50,000 should match Sanjay Gandhi Niradhar'
);
eq(
  evaluateScheme(sgny, {
    stateOfResidence: 'maharashtra',
    age: 40,
    hasDisability: false,
    incomeBracket: '21001_to_50000',
    rationCardType: 'none',
  }).status,
  'not_eligible',
  'Non-PwD non-BPL with income > ₹21,000 must not match Sanjay Gandhi Niradhar'
);
eq(
  evaluateScheme(sgny, {
    stateOfResidence: 'maharashtra',
    age: 40,
    incomeBracket: '21001_to_50000',
    rationCardType: 'none',
  }).status,
  'needs_info',
  'Unanswered disability status in 21k-50k bracket must return needs_info (no false failure or positive)'
);
eq(
  evaluateScheme(sgny, {
    stateOfResidence: 'maharashtra',
    age: 40,
    hasDisability: false,
    incomeBracket: '50001_to_180000',
    rationCardType: 'yellow_aay_bpl',
  }).status,
  'likely_eligible',
  'BPL cardholder satisfies OR condition for Sanjay Gandhi Niradhar'
);
// Audit fix: BPL cardholder with 21k-50k income and UNANSWERED disability must STILL pass via OR condition!
eq(
  evaluateScheme(sgny, {
    stateOfResidence: 'maharashtra',
    age: 40,
    incomeBracket: '21001_to_50000',
    rationCardType: 'yellow_aay_bpl',
  }).status,
  'likely_eligible',
  'BPL cardholder in 21k-50k bracket with unanswered disability must pass via OR condition'
);
// Audit fix: Sanjay Gandhi Niradhar strictly < 65 (no overlap with Shravanbal 65+)
eq(
  evaluateScheme(sgny, { stateOfResidence: 'maharashtra', age: 64, incomeBracket: 'up_to_21000' }).status,
  'likely_eligible',
  'Age 64 passes Sanjay Gandhi Niradhar (< 65)'
);
eq(
  evaluateScheme(sgny, { stateOfResidence: 'maharashtra', age: 65, incomeBracket: 'up_to_21000' }).status,
  'not_eligible',
  'Age 65 fails Sanjay Gandhi Niradhar (covered under Shravanbal 65+)'
);

// Audit fix: MJPJAY Yellow/Orange vs White Ration Card (no false positive for White card)
const mjpjay = byId('mh-mjpjay-pmjay');
eq(
  evaluateScheme(mjpjay, { stateOfResidence: 'maharashtra', rationCardType: 'yellow_aay_bpl' }).status,
  'likely_eligible',
  'MH Yellow ration card matches MJPJAY'
);
eq(
  evaluateScheme(mjpjay, { stateOfResidence: 'maharashtra', rationCardType: 'white' }).status,
  'needs_info',
  'MH White ration card must return needs_info (verify distressed district / expanded GR)'
);

// Audit fix: Malformed / coercible inputs never yield false positive
eq(
  evaluateScheme(sgny, { stateOfResidence: 'maharashtra', age: '   ', incomeBracket: 'up_to_21000' }).status,
  'needs_info',
  'Whitespace age string must never coerce to 0'
);
eq(
  evaluateScheme(byId('pmegp'), { age: Number.NaN }).status,
  'not_evaluated',
  'NaN-only answers must return not_evaluated'
);
eq(
  evaluateScheme(byId('pmegp'), { age: Number.POSITIVE_INFINITY, stateOfResidence: 'maharashtra' }).status,
  'needs_info',
  'Infinity age must return missing/needs_info, not matched'
);
eq(
  evaluateScheme(ladki, {
    stateOfResidence: 'maharashtra',
    gender: 'female',
    age: 30,
    incomeBracket: 'constructor',
    isIncomeTaxPayer: false,
  }).status,
  'needs_info',
  'Prototype key in incomeBracket must safely return missing/needs_info'
);

// 2f. Shravanbal Pension boundary (age 64 vs 65)
const shravanbal = byId('mh-shravanbal-pension');
eq(
  evaluateScheme(shravanbal, { stateOfResidence: 'maharashtra', age: 65, incomeBracket: 'up_to_21000' }).status,
  'likely_eligible',
  'Age 65 boundary passes Shravanbal'
);
eq(
  evaluateScheme(shravanbal, { stateOfResidence: 'maharashtra', age: 64, incomeBracket: 'up_to_21000' }).status,
  'not_eligible',
  'Age 64 fails Shravanbal'
);

// 2g. PMEGP age boundary (17 vs 18)
const pmegp = byId('pmegp');
eq(evaluateScheme(pmegp, { age: 18 }).status, 'likely_eligible', 'Age 18 passes PMEGP');
eq(evaluateScheme(pmegp, { age: 17 }).status, 'not_eligible', 'Age 17 fails PMEGP');

// 2h. PMAY-G rural housing & exclusions
const pmayg = byId('pmay-gramin');
eq(
  evaluateScheme(pmayg, {
    areaType: 'rural',
    housingStatus: 'houseless_or_kutcha',
    incomeBracket: '50001_to_180000',
    isIncomeTaxPayer: false,
  }).status,
  'likely_eligible',
  'Rural houseless <= 1.8L non-taxpayer passes PMAY-G'
);
eq(
  evaluateScheme(pmayg, {
    areaType: 'urban',
    housingStatus: 'houseless_or_kutcha',
    incomeBracket: '50001_to_180000',
    isIncomeTaxPayer: false,
  }).status,
  'not_eligible',
  'Urban resident fails PMAY-G'
);
eq(
  evaluateScheme(pmayg, {
    areaType: 'rural',
    housingStatus: 'pucca',
    incomeBracket: '50001_to_180000',
    isIncomeTaxPayer: false,
  }).status,
  'not_eligible',
  'Pucca house owner fails PMAY-G'
);

// 2i. Deterministic result ordering: likely_eligible -> needs_info -> not_eligible
const orderedAnswers = Object.freeze({
  stateOfResidence: 'maharashtra',
  gender: 'female',
  age: 28,
  occupation: 'student',
  educationLevel: 'post_matric',
  socialCategory: 'general_ews',
  incomeBracket: '180001_to_250000',
  isIncomeTaxPayer: false,
});
const ranked = evaluateAllSchemes(governmentSchemes, orderedAnswers);
const rankMap = { likely_eligible: 0, needs_info: 1, not_eligible: 2, not_evaluated: 3 };
for (let i = 1; i < ranked.length; i++) {
  check(
    rankMap[ranked[i - 1].status] <= rankMap[ranked[i].status],
    `Ordering violation at index ${i}: ${ranked[i - 1].status} followed by ${ranked[i].status}`
  );
}

// =========================================================================
// 3. PRIVACY STATIC INVARIANTS (ZERO STORAGE / ZERO NETWORK / ZERO LOGS)
// =========================================================================
const privacyFiles = [
  'app/scheme-finder.tsx',
  'app/schemes/public-shell.tsx',
  'lib/gov-info/scheme-matcher.ts',
  'lib/gov-info/schemes.ts',
];
const forbiddenPatterns = [
  /localStorage/g,
  /sessionStorage/g,
  /document\.cookie/g,
  /history\.(pushState|replaceState)/g,
  /\bfetch\s*\(/g,
  /console\.(log|info|debug|warn|error)/g,
  /\/api\//g,
];
for (const filePath of privacyFiles) {
  const src = fs.readFileSync(new URL('../' + filePath, import.meta.url), 'utf8');
  for (const pat of forbiddenPatterns) {
    check(!pat.test(src), `Privacy violation: ${filePath} matched forbidden pattern ${pat}`);
  }
}

// =========================================================================
// 4. COMPLETE ENGLISH / HINDI / MARATHI COVERAGE FOR CATALOGUE & MATCHER
// =========================================================================
const require = createRequire(import.meta.url);
const ts = require('typescript');
const loadLocalTs = (relPath) => {
  const m = { exports: {} };
  new Function(
    'exports',
    ts.transpileModule(fs.readFileSync(relPath, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText
  )(m.exports);
  return m.exports;
};
const i18nSrc = fs.readFileSync(new URL('../app/i18n.tsx', import.meta.url), 'utf8');
const i18nMod = { exports: {} };
new Function(
  'require',
  'exports',
  'module',
  ts.transpileModule(i18nSrc, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
)(
  (name) =>
    name === './auth-translations'
      ? loadLocalTs('app/auth-translations.ts')
      : name === './scheme-translations'
      ? loadLocalTs('app/scheme-translations.ts')
      : name === './dashboard-translations'
      ? loadLocalTs('app/dashboard-translations.ts')
      : require(name),
  i18nMod.exports,
  i18nMod
);
const translations = i18nMod.exports.translations;

const dynamicKeys = new Set();
for (const c of Object.values(schemeCategoryMeta)) dynamicKeys.add(c.label);
for (const r of Object.values(INCOME_BRACKET_RANGES)) dynamicKeys.add(r.label);
for (const a of Object.values(officialAuthorities)) {
  dynamicKeys.add(a.name);
  dynamicKeys.add(a.shortName);
}
for (const s of Object.values(officialSources)) {
  dynamicKeys.add(s.title);
  dynamicKeys.add(s.publisher);
  if (s.notes) dynamicKeys.add(s.notes);
}
for (const d of maharashtraDistricts) dynamicKeys.add(d);
for (const s of governmentSchemes) {
  dynamicKeys.add(s.name);
  dynamicKeys.add(s.jurisdiction);
  dynamicKeys.add(s.shortDescription);
  dynamicKeys.add(s.detailedDescription);
  dynamicKeys.add(s.benefitSummary);
  dynamicKeys.add(s.applicationPortalLabel);
  dynamicKeys.add(s.deadline.label);
  for (const x of s.benefits) dynamicKeys.add(x);
  for (const x of s.exclusionCriteria) dynamicKeys.add(x);
  for (const x of s.requiredDocuments) dynamicKeys.add(x);
  for (const x of s.applicationProcess) dynamicKeys.add(x);
  for (const x of s.caveats) dynamicKeys.add(x);
  for (const c of s.eligibilityCriteria) {
    dynamicKeys.add(c.label);
    dynamicKeys.add(c.explanation);
  }
}
for (const k of dynamicKeys) {
  const pair = translations[k];
  check(Array.isArray(pair) && pair.length === 2, `Missing translation pair for: ${k}`);
  check(pair[0].trim().length > 0 && pair[1].trim().length > 0, `Empty HI/MR translation for: ${k}`);
}

console.log(
  `PASS: ${assertions} scheme finder assertions verified (10 schemes across 8 categories, official HTTPS URL hygiene, deterministic matcher & boundary rules, strict privacy invariants, and ${dynamicKeys.size} EN/HI/MR catalogue translations).`
);
