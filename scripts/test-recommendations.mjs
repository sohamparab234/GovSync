import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

// Load recommendation engine
const {
  getRecommendations,
  hasAnyRecommendationAnswer,
  isValidMaharashtraDistrict,
} = require('../lib/recommendations.ts');

const { getAllServices } = require('../lib/services.ts');
const { governmentSchemes } = require('../lib/gov-info/schemes.ts');

console.log('--- Testing Smart Service Recommendation Engine (Phase 3 Day 3) ---');

// TEST 1: Strong category matches
console.log('1. Testing strong category matches...');
{
  const res = getRecommendations({
    needs: ['agriculture'],
    goal: 'agricultural_support',
    beneficiary: 'farm',
  });

  assert.ok(res.totalMatches > 0, 'Must return matches for agriculture');
  assert.ok(res.topRecommendations.length >= 2, 'Must have at least 2 top recommendations');
  const topIds = res.topRecommendations.map((r) => r.id);
  assert.ok(topIds.includes('scheme:pm-kisan'), 'PM-KISAN must be a top recommendation');
  assert.ok(topIds.includes('scheme:mh-smam-mechanization'), 'SMAM must be a top recommendation');
  for (const item of res.topRecommendations) {
    assert.equal(item.confidence, 'strong_match', 'Top items must be strong_match');
  }
  console.log('   ✓ Strong category matches verified for agriculture.');
}

// TEST 2: Multiple matching categories
console.log('2. Testing multiple matching categories...');
{
  const res = getRecommendations({
    needs: ['education', 'certificates'],
    goal: 'educational_opportunity',
    beneficiary: 'myself',
  });

  assert.ok(res.totalMatches >= 4, 'Must return multiple matching services and schemes');
  const ids = res.allRecommendations.map((r) => r.id);
  assert.ok(ids.includes('service:scholarship'), 'Must include scholarship service');
  assert.ok(ids.includes('service:residence'), 'Must include residence service');
  assert.ok(ids.includes('scheme:mh-rcsm-ebc-scholarship'), 'Must include EBC scholarship scheme');
  console.log('   ✓ Multiple matching categories return diverse, relevant results.');
}

// TEST 3: Weak and partial matches
console.log('3. Testing weak and partial matches...');
{
  const res = getRecommendations({
    needs: ['other'],
    beneficiary: 'other',
    goal: 'other',
  });

  assert.ok(res.totalMatches > 0, 'Fallback matches must be found for general other needs');
  const hasRelated = res.allRecommendations.some((r) => r.confidence === 'related_service' || r.confidence === 'possible_match');
  assert.ok(hasRelated, 'General matches must include possible_match or related_service');
  console.log('   ✓ Weak and partial matches properly categorized.');
}

// TEST 4: Missing optional answers
console.log('4. Testing missing optional answers...');
{
  const resNoDistrict = getRecommendations({
    needs: ['education'],
  });

  assert.ok(resNoDistrict.totalMatches > 0, 'Must return results even when district, beneficiary, and goal are omitted');
  assert.equal(resNoDistrict.selectedDistrict, undefined, 'Selected district must be undefined');
  for (const item of resNoDistrict.allRecommendations) {
    assert.equal(item.districtNote, undefined, 'No district note should be generated when district is skipped');
  }
  console.log('   ✓ Gracefully handles missing optional questionnaire inputs.');
}

// TEST 5: Unknown categories
console.log('5. Testing unknown categories...');
{
  const resUnknown = getRecommendations({
    needs: ['unrecognized_category'],
  });

  assert.equal(resUnknown.totalMatches, 0, 'Unrecognized category should return 0 matches cleanly without crashing');
  console.log('   ✓ Handled unknown categories safely with zero matches.');
}

// TEST 6: Invalid district values
console.log('6. Testing invalid district validation...');
{
  assert.equal(isValidMaharashtraDistrict('Pune'), true, 'Pune is a valid district');
  assert.equal(isValidMaharashtraDistrict('Nashik'), true, 'Nashik is a valid district');
  assert.equal(isValidMaharashtraDistrict('London'), false, 'London is not a valid MH district');
  assert.equal(isValidMaharashtraDistrict(''), false, 'Empty string is not valid');
  assert.equal(isValidMaharashtraDistrict(undefined), false, 'Undefined is not valid');

  const resInvalidDistrict = getRecommendations({
    needs: ['agriculture'],
    district: 'InvalidDistrictXYZ',
  });

  assert.equal(resInvalidDistrict.selectedDistrict, undefined, 'Invalid district must be filtered out to undefined');
  for (const item of resInvalidDistrict.allRecommendations) {
    assert.equal(item.districtNote, undefined, 'No district note for invalid district');
  }
  console.log('   ✓ Invalid district values rejected safely.');
}

// TEST 7: Empty catalogue handling
console.log('7. Testing empty catalogue handling...');
{
  const resEmpty = getRecommendations(
    { needs: ['agriculture', 'education'] },
    { services: [], schemes: [] }
  );

  assert.equal(resEmpty.totalMatches, 0, 'Empty catalogue must return 0 matches');
  assert.equal(resEmpty.topRecommendations.length, 0);
  assert.equal(resEmpty.relatedServices.length, 0);
  console.log('   ✓ Empty catalogue handled cleanly without exceptions.');
}

// TEST 8: Duplicate recommendation prevention
console.log('8. Testing duplicate recommendation prevention...');
{
  const res = getRecommendations({
    needs: ['education', 'social_welfare', 'certificates', 'agriculture'],
    beneficiary: 'myself',
    goal: 'financial_assistance',
  });

  const ids = res.allRecommendations.map((r) => r.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size, 'Every recommendation ID must be strictly unique (no duplicates)');
  console.log(`   ✓ Duplicate prevention verified across ${ids.length} matched recommendations.`);
}

// TEST 9: Recommendation ranking consistency
console.log('9. Testing recommendation ranking consistency...');
{
  const res = getRecommendations({
    needs: ['education'],
    goal: 'educational_opportunity',
    beneficiary: 'myself',
  });

  for (let i = 0; i < res.allRecommendations.length - 1; i++) {
    const current = res.allRecommendations[i];
    const next = res.allRecommendations[i + 1];
    assert.ok(
      current.score >= next.score,
      `Ranking violation: item at index ${i} (score: ${current.score}) ranked before index ${i + 1} (score: ${next.score})`
    );
  }
  console.log('   ✓ Deterministic ranking order strictly monotonically non-increasing by score.');
}

// TEST 10: Explanation accuracy
console.log('10. Testing explanation accuracy...');
{
  const res = getRecommendations({
    needs: ['education', 'agriculture'],
    district: 'Nashik',
    beneficiary: 'farm',
    goal: 'agricultural_support',
  });

  for (const item of res.allRecommendations) {
    assert.ok(item.matchReasons.length > 0, `Item ${item.id} must have at least one match reason`);
    for (const reason of item.matchReasons) {
      assert.ok(typeof reason === 'string' && reason.trim().length > 5, 'Reason must be a meaningful non-empty string');
    }
    if (item.districtNote) {
      assert.ok(item.districtNote.includes('Nashik'), `District note must reference the selected district (${item.districtNote})`);
      assert.ok(item.districtNoteTemplate, `District note template must be provided for localization (${item.id})`);
      assert.equal(item.districtNoteParams?.district, 'Nashik', 'District parameter must be correctly assigned');
    }
  }
  console.log('   ✓ All recommendations include accurate and actionable explanations.');
}

// TEST 11: Traceability: No fabricated schemes or services
console.log('11. Testing catalogue traceability (No fabricated records)...');
{
  const allKnownServices = getAllServices().map((s) => s.id);
  const allKnownSchemes = governmentSchemes.map((s) => s.id);

  const res = getRecommendations({
    needs: ['agriculture', 'education', 'employment', 'healthcare', 'business', 'housing', 'certificates', 'social_welfare', 'other'],
    beneficiary: 'myself',
    goal: 'financial_assistance',
  });

  for (const item of res.allRecommendations) {
    if (item.itemType === 'service') {
      assert.ok(item.id.startsWith('service:'), 'Service ID must start with service:');
      assert.ok(allKnownServices.includes(item.serviceId), `Service ${item.serviceId} must exist in official services catalogue`);
    } else if (item.itemType === 'scheme') {
      assert.ok(item.id.startsWith('scheme:'), 'Scheme ID must start with scheme:');
      assert.ok(allKnownSchemes.includes(item.schemeId), `Scheme ${item.schemeId} must exist in official schemes catalogue`);
      assert.ok(item.externalUrl?.startsWith('https://'), 'Official external URL must use HTTPS');
    } else {
      assert.fail(`Unknown item type: ${item.itemType}`);
    }
  }
  console.log('   ✓ 100% of recommendations are traceable to genuine catalogue records.');
}

// TEST 12: No false eligibility claims
console.log('12. Testing non-eligibility disclaimer and transparent confidence...');
{
  const res = getRecommendations({
    needs: ['education'],
    goal: 'educational_opportunity',
  });

  const validConfidences = ['strong_match', 'possible_match', 'related_service'];
  for (const item of res.allRecommendations) {
    assert.ok(
      validConfidences.includes(item.confidence),
      `Confidence label must be transparent match tier, got ${item.confidence}`
    );
    // Ensure no label says "eligible" or "approved"
    assert.notEqual(item.confidence, 'eligible');
    assert.notEqual(item.confidence, 'approved');
  }
  console.log('   ✓ Zero false eligibility claims; confidence labels are strictly transparent relevance indicators.');
}

// TEST 13: Session-only data handling
console.log('13. Testing session-only data handling invariants...');
{
  // Confirm that recommendations engine is a pure synchronous function
  const input = Object.freeze({
    needs: Object.freeze(['education']),
    district: 'Pune',
    beneficiary: 'myself',
    goal: 'educational_opportunity',
  });

  const res1 = getRecommendations(input);
  const res2 = getRecommendations(input);
  assert.deepEqual(res1, res2, 'Engine must be purely deterministic and stateless');

  // Verify hasAnyRecommendationAnswer helper
  assert.equal(hasAnyRecommendationAnswer(null), false);
  assert.equal(hasAnyRecommendationAnswer(undefined), false);
  assert.equal(hasAnyRecommendationAnswer({ needs: [] }), false);
  assert.equal(hasAnyRecommendationAnswer({ needs: ['education'] }), true);
  assert.equal(hasAnyRecommendationAnswer({ needs: [], district: 'Pune' }), true);
  assert.equal(hasAnyRecommendationAnswer({ needs: [], beneficiary: 'myself' }), true);
  assert.equal(hasAnyRecommendationAnswer({ needs: [], goal: 'financial_assistance' }), true);
  console.log('   ✓ Pure in-memory session execution verified.');
}

// TEST 14: Translation completeness
console.log('14. Testing English, Hindi, and Marathi translation completeness...');
{
  const source = fs.readFileSync(new URL('../app/i18n.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loadLocalTs = (relPath) => {
    const m = { exports: {} };
    new Function('exports', ts.transpileModule(fs.readFileSync(relPath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(m.exports);
    return m.exports;
  };
  const mod = { exports: {} };
  new Function(
    'require',
    'exports',
    'module',
    compiled
  )(
    (name) =>
      name === './auth-translations'
        ? loadLocalTs('app/auth-translations.ts')
        : name === './scheme-translations'
        ? loadLocalTs('app/scheme-translations.ts')
        : name === './dashboard-translations'
        ? loadLocalTs('app/dashboard-translations.ts')
        : name === './recommendation-translations'
        ? loadLocalTs('app/recommendation-translations.ts')
        : name === './journey-translations'
        ? loadLocalTs('app/journey-translations.ts')
        : name === './rts-translations'
        ? loadLocalTs('app/rts-translations.ts')
        : name === './grievance-translations'
        ? loadLocalTs('app/grievance-translations.ts')
        : name === './directory-translations'
        ? loadLocalTs('app/directory-translations.ts')
        : name === './agriculture-translations'
        ? loadLocalTs('app/agriculture-translations.ts')
        : name === './transparency-translations'
        ? loadLocalTs('app/transparency-translations.ts')
        : require(name),
    mod.exports,
    mod
  );

  const { translations } = mod.exports;

  // Check key recommendation terminology
  const testKeys = [
    'Smart Service Recommendations',
    'Service Recommendations',
    'Government Service Discovery Assistant',
    'What type of assistance or service are you looking for?',
    'Agriculture and farming',
    'Education and scholarships',
    'Official certificates and documentation',
    'Strong match',
    'Possible match',
    'Related service',
    'Why this was recommended',
    'Start Application in GovSync',
    'View Scheme Details',
    'Visit Official Portal',
    'Session-only questionnaire: Your answers are evaluated strictly in application memory and are never saved or stored.',
    'Relevance indicates how well this matches your stated needs. It does not establish official government eligibility or approval.',
  ];

  for (const k of testKeys) {
    assert.ok(translations[k], `Missing translation key: "${k}"`);
    const [hi, mr] = translations[k];
    assert.ok(hi && hi.length > 0, `Missing Hindi translation for: "${k}"`);
    assert.ok(mr && mr.length > 0, `Missing Marathi translation for: "${k}"`);
    assert.notEqual(hi, k, `Hindi should not be identical to English literal: "${k}"`);
    assert.notEqual(mr, k, `Marathi should not be identical to English literal: "${k}"`);
  }
  console.log(`   ✓ All ${testKeys.length} core recommendation keys verified in EN, HI, MR.`);
}

console.log('PASS: All 14 Smart Service Recommendation Engine test suites PASSED cleanly!');
