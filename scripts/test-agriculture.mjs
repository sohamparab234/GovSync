import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  AGRICULTURE_CATEGORIES,
  IMPORTANT_AGRICULTURE_PORTALS,
  HOW_TO_USE_STEPS,
  VERIFIED_AGRICULTURE_ITEMS,
  filterAgricultureItems,
  getAgricultureItemById,
  getAgricultureCategories,
  getAgricultureDepartments,
  getFeaturedAgricultureSchemes,
  getItemsByCategory,
  getNonFinancialServices,
} = require('../lib/agriculture.ts');

const { agricultureTranslations } = require('../app/agriculture-translations.ts');

console.log('--- Testing Agriculture & Farmer Service Hub (Phase 3 Day 8) ---');

let assertions = 0;
const testAssert = (cond, msg) => {
  assert.ok(cond, msg);
  assertions++;
};

// ============================================================================
// 1. ALL 10 CANONICAL CATEGORIES INTEGRITY
// ============================================================================
console.log('1. Testing 10 canonical agricultural categories...');

testAssert(Array.isArray(AGRICULTURE_CATEGORIES), 'AGRICULTURE_CATEGORIES must be an array');
testAssert(
  AGRICULTURE_CATEGORIES.length === 10,
  `Must contain exactly 10 canonical categories, found: ${AGRICULTURE_CATEGORIES.length}`
);

const expectedCategories = [
  'schemes',
  'subsidies',
  'machinery',
  'irrigation',
  'insurance',
  'soil_health',
  'farmer_registry',
  'marketing',
  'training_advisory',
  'disaster_relief',
];

for (const expectedKey of expectedCategories) {
  const found = AGRICULTURE_CATEGORIES.find((c) => c.id === expectedKey);
  testAssert(Boolean(found), `Category "${expectedKey}" must exist in AGRICULTURE_CATEGORIES`);
  testAssert(typeof found.label === 'string' && found.label.length > 0, `${expectedKey} label must be non-empty`);
  testAssert(typeof found.marathiLabel === 'string' && found.marathiLabel.length > 0, `${expectedKey} marathiLabel must be non-empty`);
  testAssert(typeof found.hindiLabel === 'string' && found.hindiLabel.length > 0, `${expectedKey} hindiLabel must be non-empty`);
  testAssert(typeof found.description === 'string' && found.description.length > 10, `${expectedKey} description must be detailed`);
  testAssert(typeof found.iconName === 'string' && found.iconName.length > 0, `${expectedKey} iconName must be non-empty`);
}

// Every category must have at least one verified item
for (const catKey of expectedCategories) {
  const itemsInCat = VERIFIED_AGRICULTURE_ITEMS.filter((item) => item.category === catKey);
  testAssert(itemsInCat.length >= 1, `Category "${catKey}" must have at least 1 verified scheme/service, found: ${itemsInCat.length}`);
}

console.log('   ✓ All 10 canonical categories verified with metadata and scheme coverage.');

// ============================================================================
// 2. VERIFIED SCHEMES & SERVICES DATA INTEGRITY
// ============================================================================
console.log('2. Testing verified agricultural schemes & services dataset...');

testAssert(Array.isArray(VERIFIED_AGRICULTURE_ITEMS), 'VERIFIED_AGRICULTURE_ITEMS must be an array');
testAssert(
  VERIFIED_AGRICULTURE_ITEMS.length >= 18,
  `Must contain at least 18 verified records, found: ${VERIFIED_AGRICULTURE_ITEMS.length}`
);

const seenIds = new Set();
const validTypes = ['scheme', 'service'];

for (const item of VERIFIED_AGRICULTURE_ITEMS) {
  // Unique ID
  testAssert(!seenIds.has(item.id), `Duplicate scheme/service ID detected: ${item.id}`);
  seenIds.add(item.id);

  // String fields
  testAssert(typeof item.name === 'string' && item.name.trim().length > 0, `${item.id}: name must be non-empty`);
  testAssert(typeof item.marathiName === 'string' && item.marathiName.trim().length > 0, `${item.id}: marathiName must be non-empty`);
  testAssert(typeof item.hindiName === 'string' && item.hindiName.trim().length > 0, `${item.id}: hindiName must be non-empty`);
  testAssert(typeof item.department === 'string' && item.department.trim().length > 0, `${item.id}: department must be non-empty`);
  testAssert(typeof item.shortDescription === 'string' && item.shortDescription.trim().length > 20, `${item.id}: shortDescription must be detailed`);
  testAssert(typeof item.detailedDescription === 'string' && item.detailedDescription.trim().length > 40, `${item.id}: detailedDescription must be detailed`);
  testAssert(expectedCategories.includes(item.category), `${item.id}: invalid category "${item.category}"`);
  testAssert(validTypes.includes(item.itemType), `${item.id}: invalid itemType "${item.itemType}"`);
  testAssert(item.verificationStatus === 'verified', `${item.id}: verificationStatus must be verified`);
  testAssert(typeof item.sourceTitle === 'string' && item.sourceTitle.length > 0, `${item.id}: sourceTitle must be non-empty`);
  testAssert(/^\d{4}-\d{2}-\d{2}$/.test(item.lastVerified), `${item.id}: lastVerified must be ISO date: ${item.lastVerified}`);

  // Statutory benefits & criteria
  testAssert(Array.isArray(item.benefits) && item.benefits.length > 0, `${item.id}: benefits must not be empty`);
  for (const b of item.benefits) {
    testAssert(typeof b === 'string' && b.trim().length > 0, `${item.id}: benefit item non-empty`);
  }

  testAssert(Array.isArray(item.eligibilityRequirements) && item.eligibilityRequirements.length > 0, `${item.id}: eligibilityRequirements must not be empty`);
  for (const crit of item.eligibilityRequirements) {
    testAssert(typeof crit === 'string' && crit.trim().length > 0, `${item.id}: criteria item non-empty`);
  }

  // Documents checklist
  testAssert(Array.isArray(item.requiredDocuments) && item.requiredDocuments.length > 0, `${item.id}: requiredDocuments must not be empty`);
  for (const doc of item.requiredDocuments) {
    testAssert(typeof doc === 'string' && doc.trim().length > 0, `${item.id}: document item non-empty`);
  }

  // Application process steps
  testAssert(Array.isArray(item.applicationProcess) && item.applicationProcess.length >= 2, `${item.id}: applicationProcess must have >= 2 steps`);
  for (const step of item.applicationProcess) {
    testAssert(typeof step === 'string' && step.trim().length > 0, `${item.id}: process step non-empty`);
  }

  const isGovDomain = (u) =>
    u.includes('.gov.in') ||
    u.includes('.nic.in') ||
    u.includes('mahadiscom.in') ||
    u.includes('msamb.com');

  testAssert(item.officialApplicationUrl.startsWith('https://'), `${item.id}: officialApplicationUrl must use HTTPS: ${item.officialApplicationUrl}`);
  testAssert(item.sourceUrl.startsWith('https://'), `${item.id}: sourceUrl must use HTTPS: ${item.sourceUrl}`);
  testAssert(
    isGovDomain(item.officialApplicationUrl),
    `${item.id}: officialApplicationUrl must point to official government domain: ${item.officialApplicationUrl}`
  );
  testAssert(
    isGovDomain(item.sourceUrl),
    `${item.id}: sourceUrl must point to official government domain: ${item.sourceUrl}`
  );

  // Keywords
  testAssert(Array.isArray(item.keywords) && item.keywords.length > 0, `${item.id}: keywords must not be empty`);
}

console.log(`   ✓ All ${VERIFIED_AGRICULTURE_ITEMS.length} agricultural records validated with complete specifications and official government URLs.`);

// ============================================================================
// 3. IMPORTANT OFFICIAL PORTALS DIRECTORY
// ============================================================================
console.log('3. Testing official government agriculture portals directory...');

testAssert(Array.isArray(IMPORTANT_AGRICULTURE_PORTALS), 'IMPORTANT_AGRICULTURE_PORTALS must be an array');
testAssert(IMPORTANT_AGRICULTURE_PORTALS.length >= 8, `Must list >= 8 portals, found: ${IMPORTANT_AGRICULTURE_PORTALS.length}`);

const portalIds = new Set();
for (const portal of IMPORTANT_AGRICULTURE_PORTALS) {
  testAssert(!portalIds.has(portal.id), `Duplicate portal ID: ${portal.id}`);
  portalIds.add(portal.id);

  testAssert(typeof portal.name === 'string' && portal.name.length > 0, `Portal name non-empty: ${portal.id}`);
  testAssert(typeof portal.authority === 'string' && portal.authority.length > 0, `Portal authority non-empty: ${portal.id}`);
  testAssert(portal.url.startsWith('https://'), `Portal URL must use HTTPS: ${portal.url}`);
  testAssert(
    portal.url.includes('.gov.in') || portal.url.includes('.nic.in') || portal.url.includes('msamb.com'),
    `Portal URL must point to official government portal: ${portal.url}`
  );
  testAssert(typeof portal.description === 'string' && portal.description.length > 15, `Portal description detailed: ${portal.id}`);
  testAssert(typeof portal.badge === 'string' && portal.badge.length > 0, `Portal badge non-empty: ${portal.id}`);
}

console.log(`   ✓ All ${IMPORTANT_AGRICULTURE_PORTALS.length} official portals verified with HTTPS government URLs and descriptions.`);

// ============================================================================
// 4. STEP-BY-STEP HELP & GUIDANCE
// ============================================================================
console.log('4. Testing plain-language help steps...');

testAssert(Array.isArray(HOW_TO_USE_STEPS), 'HOW_TO_USE_STEPS must be an array');
testAssert(HOW_TO_USE_STEPS.length === 4, `Must define exactly 4 steps, found: ${HOW_TO_USE_STEPS.length}`);

HOW_TO_USE_STEPS.forEach((step, idx) => {
  testAssert(step.step === idx + 1, `Step number must be ${idx + 1}, found: ${step.step}`);
  testAssert(typeof step.title === 'string' && step.title.length > 0, `Step ${idx + 1} title non-empty`);
  testAssert(typeof step.description === 'string' && step.description.length > 20, `Step ${idx + 1} description detailed`);
});

console.log('   ✓ 4-step plain-language farmer guidance verified.');

// ============================================================================
// 5. SEARCH & FILTERING ENGINE
// ============================================================================
console.log('5. Testing search and multi-attribute filtering engine...');

// Test 5.1: Unfiltered returns all items
const allItems = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS);
testAssert(allItems.length === VERIFIED_AGRICULTURE_ITEMS.length, 'Unfiltered query must return all items');

// Test 5.2: Query search by keyword
const tractorMatches = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, { query: 'tractor' });
testAssert(tractorMatches.length >= 1, 'Search for "tractor" must return at least 1 match');
testAssert(
  tractorMatches.some((m) => m.id === 'smam-mechanization'),
  'Search for "tractor" must include SMAM machinery scheme'
);

const kisanMatches = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, { query: 'PM-KISAN' });
testAssert(kisanMatches.length >= 1, 'Search for "PM-KISAN" must return matches');
testAssert(kisanMatches[0].id === 'pm-kisan', 'Search for "PM-KISAN" must return pm-kisan');

const dripMatches = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, { query: 'drip' });
testAssert(dripMatches.length >= 1, 'Search for "drip" must return irrigation scheme');
testAssert(dripMatches.some((m) => m.category === 'irrigation'), 'Drip match must be in irrigation category');

// Test 5.3: Category filter
for (const catKey of expectedCategories) {
  const catFiltered = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, { category: catKey });
  testAssert(catFiltered.length >= 1, `Filter by category "${catKey}" must return >= 1 item`);
  testAssert(
    catFiltered.every((i) => i.category === catKey),
    `Every item in catFiltered must have category "${catKey}"`
  );
}

// Test 5.4: Department filter
const depts = getAgricultureDepartments();
testAssert(depts.length >= 2, `Must have >= 2 distinct departments, found: ${depts.length}`);
for (const dept of depts) {
  const deptFiltered = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, { department: dept });
  testAssert(deptFiltered.length >= 1, `Filter by department "${dept}" must return items`);
  testAssert(
    deptFiltered.every((i) => i.department.toLowerCase().includes(dept.toLowerCase())),
    `Department filter items must match "${dept}"`
  );
}

// Test 5.5: Service Type filter
for (const t of validTypes) {
  const typeFiltered = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, { itemType: t });
  testAssert(typeFiltered.length >= 1, `Filter by itemType "${t}" must return items`);
  testAssert(typeFiltered.every((i) => i.itemType === t), `Type filter items must match "${t}"`);
}

// Test 5.6: Verification Status filter
const verifiedFiltered = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, { verificationStatus: 'verified' });
testAssert(
  verifiedFiltered.length === VERIFIED_AGRICULTURE_ITEMS.length,
  'All current records are verified'
);

// Test 5.7: Combined multi-attribute filter
const combined = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, {
  query: 'subsidy',
  category: 'irrigation',
});
testAssert(combined.length >= 1, 'Combined filter (subsidy + irrigation) must return matches');
testAssert(
  combined.every((i) => i.category === 'irrigation'),
  'Combined matches must belong to irrigation category'
);

// Test 5.8: No matches query
const noMatch = filterAgricultureItems(VERIFIED_AGRICULTURE_ITEMS, { query: 'nonexistent-crop-xyz-12345' });
testAssert(Array.isArray(noMatch) && noMatch.length === 0, 'Nonexistent query must return empty array');

console.log('   ✓ Filtering engine verified across keyword search, category, department, type, and combined conditions.');

// ============================================================================
// 6. HELPER UTILITIES
// ============================================================================
console.log('6. Testing helper utilities...');

// getAgricultureItemById
const testItem = VERIFIED_AGRICULTURE_ITEMS[0];
const fetched = getAgricultureItemById(testItem.id);
testAssert(fetched !== undefined && fetched.id === testItem.id, 'getAgricultureItemById must return matching item');
testAssert(getAgricultureItemById('invalid-id-999') === undefined, 'getAgricultureItemById must return undefined for invalid id');

// getAgricultureCategories
const cats = getAgricultureCategories();
testAssert(cats.length === 10, 'getAgricultureCategories must return 10 categories');

// getAgricultureDepartments
const allDepts = getAgricultureDepartments();
testAssert(Array.isArray(allDepts) && allDepts.length > 0, 'getAgricultureDepartments must return departments');

// getFeaturedAgricultureSchemes
const featured = getFeaturedAgricultureSchemes();
testAssert(featured.length >= 4, 'getFeaturedAgricultureSchemes must return at least 4 featured items');

// getNonFinancialServices
const nonFin = getNonFinancialServices();
testAssert(nonFin.length >= 3, 'getNonFinancialServices must return at least 3 services');

// getItemsByCategory
const catItems = getItemsByCategory('irrigation');
testAssert(catItems.length >= 1, 'getItemsByCategory must return irrigation items');

console.log('   ✓ Helper utilities verified.');

// ============================================================================
// 7. TRILINGUAL TRANSLATION COVERAGE
// ============================================================================
console.log('7. Testing trilingual translation dictionary...');

testAssert(typeof agricultureTranslations === 'object' && agricultureTranslations !== null, 'agricultureTranslations must be object');

const requiredTranslationKeys = [
  'Agriculture & Farmer Service Hub',
  'Agriculture',
  'Government Schemes',
  'Financial Assistance & Subsidies',
  'Agricultural Machinery',
  'Irrigation & Water Management',
  'Crop Insurance',
  'Soil Health & Testing',
  'Farmer Registration & Documents',
  'Agricultural Marketing',
  'Training & Advisory',
  'Disaster & Crop-Loss Assistance',
  'All Categories',
  'All Departments',
  'All Service Types',
  'Verified Services Only',
  'Clear Filters',
  'Eligibility Criteria',
  'Statutory Benefits & Financial Assistance',
  'Required Documents Checklist',
  'Step-by-Step Application Process',
  'Important Conditions & Caveats',
  'Source Authority & Official Portal',
  'View Details & Criteria',
  'Apply on Official Portal',
  'Visit Portal',
  'Close',
];

for (const key of requiredTranslationKeys) {
  const transPair = agricultureTranslations[key];
  testAssert(Boolean(transPair), `Key "${key}" must exist in agricultureTranslations`);
  testAssert(Array.isArray(transPair) && transPair.length === 2, `Key "${key}" must have [hindi, marathi] tuple`);
  testAssert(transPair[0].trim().length > 0, `Key "${key}" Hindi translation must not be empty`);
  testAssert(transPair[1].trim().length > 0, `Key "${key}" Marathi translation must not be empty`);
}

console.log(`   ✓ All ${requiredTranslationKeys.length} core agriculture translation keys verified in EN, HI, MR.`);

console.log(`\nALL ${assertions} AGRICULTURE TEST ASSERTIONS PASSED SUCCESSFULLY!`);
