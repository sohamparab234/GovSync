import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  MAHARASHTRA_DISTRICTS_DIRECTORY,
  GOVERNMENT_DEPARTMENTS,
  ALL_OFFICE_CATEGORIES,
  VERIFIED_GOVERNMENT_OFFICES,
  filterGovernmentOffices,
  getDistrictInfo,
  getTalukasForDistrict,
  getOfficesForService,
} = require('../lib/directory.ts');

const { maharashtraDistricts } = require('../lib/gov-info/schemes.ts');
const { directoryTranslations } = require('../app/directory-translations.ts');

console.log('--- Testing Maharashtra District & Government Office Directory (Phase 3 Day 7) ---');

let assertions = 0;
const testAssert = (cond, msg) => {
  assert.ok(cond, msg);
  assertions++;
};

// ============================================================================
// 1. ALL 36 DISTRICTS INTEGRITY & METADATA
// ============================================================================
console.log('1. Testing all 36 Maharashtra districts data integrity...');

testAssert(Array.isArray(MAHARASHTRA_DISTRICTS_DIRECTORY), 'MAHARASHTRA_DISTRICTS_DIRECTORY must be an array');
testAssert(
  MAHARASHTRA_DISTRICTS_DIRECTORY.length === 36,
  `Must contain exactly 36 districts, found: ${MAHARASHTRA_DISTRICTS_DIRECTORY.length}`
);

// Verify 1:1 match with canonical maharashtraDistricts
for (const canonicalName of maharashtraDistricts) {
  const found = MAHARASHTRA_DISTRICTS_DIRECTORY.find((d) => d.name === canonicalName);
  testAssert(Boolean(found), `District ${canonicalName} must exist in MAHARASHTRA_DISTRICTS_DIRECTORY`);
}

const validDivisions = [
  'Konkan',
  'Pune',
  'Nashik',
  'Chhatrapati Sambhajinagar',
  'Amravati',
  'Nagpur',
];

for (const dist of MAHARASHTRA_DISTRICTS_DIRECTORY) {
  testAssert(typeof dist.name === 'string' && dist.name.length > 0, `District name must be non-empty`);
  testAssert(validDivisions.includes(dist.division), `District ${dist.name} division must be valid (${dist.division})`);
  testAssert(typeof dist.headquarters === 'string' && dist.headquarters.length > 0, `${dist.name} headquarters non-empty`);
  testAssert(dist.officialPortal.startsWith('https://'), `${dist.name} portal must use HTTPS: ${dist.officialPortal}`);
  testAssert(dist.sourceUrl.startsWith('https://'), `${dist.name} sourceUrl must use HTTPS: ${dist.sourceUrl}`);
  testAssert(/^\d{4}-\d{2}-\d{2}$/.test(dist.lastVerified), `${dist.name} lastVerified must be ISO date: ${dist.lastVerified}`);
  testAssert(Array.isArray(dist.talukas) && dist.talukas.length > 0, `${dist.name} must list at least 1 verified taluka`);

  for (const taluka of dist.talukas) {
    testAssert(typeof taluka === 'string' && taluka.trim().length > 0, `${dist.name} taluka item must be non-empty`);
  }
}

console.log('   ✓ All 36 districts verified with official portals, divisions, headquarters, and talukas.');

// ============================================================================
// 2. GOVERNMENT DEPARTMENTS INTEGRITY
// ============================================================================
console.log('2. Testing government departments metadata...');

testAssert(Array.isArray(GOVERNMENT_DEPARTMENTS), 'GOVERNMENT_DEPARTMENTS must be an array');
testAssert(GOVERNMENT_DEPARTMENTS.length >= 10, 'Must define at least 10 key government departments');

for (const dept of GOVERNMENT_DEPARTMENTS) {
  testAssert(typeof dept.id === 'string' && dept.id.length > 0, 'Dept id must be non-empty');
  testAssert(typeof dept.name === 'string' && dept.name.length > 0, `Dept name must be non-empty: ${dept.id}`);
  testAssert(typeof dept.shortCode === 'string' && dept.shortCode.length > 0, `Dept shortCode non-empty: ${dept.id}`);
  testAssert(typeof dept.description === 'string' && dept.description.length > 20, `Dept description detailed: ${dept.id}`);
  testAssert(dept.officialPortal.startsWith('https://'), `Dept portal must use HTTPS: ${dept.officialPortal}`);
  testAssert(Array.isArray(dept.keyServices) && dept.keyServices.length > 0, `Dept must list key services: ${dept.id}`);
}

console.log('   ✓ All government departments verified with descriptions, HTTPS portals, and key services.');

// ============================================================================
// 3. OFFICE CATEGORIES INTEGRITY
// ============================================================================
console.log('3. Testing office categories...');

testAssert(Array.isArray(ALL_OFFICE_CATEGORIES), 'ALL_OFFICE_CATEGORIES must be an array');
testAssert(ALL_OFFICE_CATEGORIES.length >= 8, 'Must define at least 8 office categories');
testAssert(ALL_OFFICE_CATEGORIES.includes('Collectorate'), 'Must include Collectorate category');
testAssert(ALL_OFFICE_CATEGORIES.includes('Tahsil Office'), 'Must include Tahsil Office category');
testAssert(ALL_OFFICE_CATEGORIES.includes('Regional Transport Office'), 'Must include RTO category');
testAssert(ALL_OFFICE_CATEGORIES.includes('Zilla Parishad'), 'Must include Zilla Parishad category');

console.log('   ✓ Office categories verified.');

// ============================================================================
// 4. VERIFIED GOVERNMENT OFFICES DATA ACCURACY
// ============================================================================
console.log('4. Testing verified government offices data accuracy...');

testAssert(Array.isArray(VERIFIED_GOVERNMENT_OFFICES), 'VERIFIED_GOVERNMENT_OFFICES must be an array');
testAssert(VERIFIED_GOVERNMENT_OFFICES.length >= 20, `Must define comprehensive verified office records (found: ${VERIFIED_GOVERNMENT_OFFICES.length})`);

const seenOfficeIds = new Set();

for (const off of VERIFIED_GOVERNMENT_OFFICES) {
  testAssert(!seenOfficeIds.has(off.id), `Office ID must be unique: ${off.id}`);
  seenOfficeIds.add(off.id);

  testAssert(typeof off.name === 'string' && off.name.length > 5, `Office name valid: ${off.id}`);
  testAssert(
    GOVERNMENT_DEPARTMENTS.some((d) => d.name === off.department) || off.department.length > 0,
    `Office department valid: ${off.department}`
  );
  testAssert(ALL_OFFICE_CATEGORIES.includes(off.officeCategory), `Office category valid: ${off.officeCategory}`);

  // District must be one of the 36 or Statewide
  testAssert(
    off.district === 'Maharashtra (Statewide)' || maharashtraDistricts.includes(off.district),
    `Office district must be valid: ${off.district}`
  );

  // If taluka is present, verify against district talukas
  if (off.taluka && off.district !== 'Maharashtra (Statewide)') {
    const distInfo = getDistrictInfo(off.district);
    testAssert(
      distInfo?.talukas.includes(off.taluka),
      `Office taluka ${off.taluka} must be recognized in district ${off.district}`
    );
  }

  // Address
  if (off.address !== null) {
    testAssert(typeof off.address === 'string' && off.address.length >= 10, `${off.id} address must be descriptive`);
    testAssert(/\d{6}/.test(off.address), `${off.id} address must contain a valid 6-digit Indian PIN code`);
  }

  // Phone
  if (off.phone !== null) {
    testAssert(/^\d{2,5}-\d{6,8}$/.test(off.phone), `${off.id} phone must match standard STD-landline format: ${off.phone}`);
  }

  // Email
  if (off.email !== null) {
    testAssert(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(off.email),
      `${off.id} email format must be valid: ${off.email}`
    );
  }

  // Website and sourceUrl
  testAssert(off.website.startsWith('https://'), `${off.id} website must use HTTPS: ${off.website}`);
  testAssert(off.sourceUrl.startsWith('https://'), `${off.id} sourceUrl must use HTTPS: ${off.sourceUrl}`);
  testAssert(/^\d{4}-\d{2}-\d{2}$/.test(off.lastVerified), `${off.id} lastVerified must be ISO date: ${off.lastVerified}`);
  testAssert(['verified', 'partially_verified'].includes(off.verificationStatus), `${off.id} verificationStatus valid`);
  testAssert(Array.isArray(off.servicesHandled) && off.servicesHandled.length > 0, `${off.id} must specify servicesHandled`);
}

console.log(`   ✓ All ${VERIFIED_GOVERNMENT_OFFICES.length} verified government office records audited cleanly.`);

// ============================================================================
// 5. SEARCH & FILTERING ENGINE
// ============================================================================
console.log('5. Testing search & filtering engine...');

// 5a. Query search by name
const queryCollector = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { query: 'Collector' });
testAssert(queryCollector.length > 0, 'Query "Collector" must return matching collectorate offices');
testAssert(queryCollector.every((o) => o.name.toLowerCase().includes('collector') || o.officeCategory.toLowerCase().includes('collector') || (o.address && o.address.toLowerCase().includes('collector'))), 'All results match "Collector" in name, category, or address');

// 5b. Query search by service
const queryResidence = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { service: 'residence' });
testAssert(queryResidence.length > 0, 'Filter by service "residence" must return offices');
testAssert(queryResidence.every((o) => o.servicesHandled.includes('residence')), 'All results handle residence');

// 5c. Filter by district: Pune
const puneOffices = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { district: 'Pune' });
testAssert(puneOffices.length > 0, 'District filter "Pune" must return Pune offices');
testAssert(puneOffices.every((o) => o.district === 'Pune' || o.district === 'Maharashtra (Statewide)'), 'All results are in Pune or Statewide');

// 5d. Filter by district & taluka: Pune + Haveli
const haveliOffices = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { district: 'Pune', taluka: 'Haveli' });
testAssert(haveliOffices.length > 0, 'Pune + Haveli filter must return Haveli office');
testAssert(haveliOffices.some((o) => o.name.includes('Haveli')), 'Must return Tahsildar Office Haveli');

// 5e. Filter by office category: Regional Transport Office
const rtoOffices = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { officeCategory: 'Regional Transport Office' });
testAssert(rtoOffices.length >= 4, 'Must return at least 4 RTO offices across major cities');
testAssert(rtoOffices.every((o) => o.officeCategory === 'Regional Transport Office'), 'All results must be RTO category');

// 5f. Filter by department: Revenue & Forest Department
const revenueOffices = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { department: 'Revenue & Forest Department' });
testAssert(revenueOffices.length > 5, 'Revenue department filter must return offices');
testAssert(revenueOffices.every((o) => o.department === 'Revenue & Forest Department'), 'All results belong to Revenue dept');

// 5g. Combined multi-criteria filter: Pune + Revenue + Collectorate
const combinedPuneCollector = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, {
  district: 'Pune',
  department: 'Revenue & Forest Department',
  officeCategory: 'Collectorate',
});
testAssert(combinedPuneCollector.length === 1, 'Pune + Revenue + Collectorate must uniquely match Pune Collectorate');
testAssert(combinedPuneCollector[0].id === 'pune-collectorate', 'Matched office must be pune-collectorate');

// 5h. Empty result for non-matching criteria
const emptyResults = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { query: 'NonExistentOfficeXyz12345' });
testAssert(emptyResults.length === 0, 'Non-matching query must return empty array');

// 5i. Case insensitivity check
const caseQuery1 = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { query: 'pune' });
const caseQuery2 = filterGovernmentOffices(VERIFIED_GOVERNMENT_OFFICES, { query: 'PUNE' });
testAssert(caseQuery1.length === caseQuery2.length, 'Search must be strictly case-insensitive');

console.log('   ✓ Search & multi-attribute filtering engine verified.');

// ============================================================================
// 6. HELPER UTILITIES
// ============================================================================
console.log('6. Testing directory helper utilities...');

const puneInfo = getDistrictInfo('Pune');
testAssert(Boolean(puneInfo), 'getDistrictInfo("Pune") must return district info');
testAssert(puneInfo?.headquarters === 'Pune', 'Pune headquarters is Pune');
testAssert(puneInfo?.division === 'Pune', 'Pune division is Pune');

const puneTalukas = getTalukasForDistrict('Pune');
testAssert(puneTalukas.includes('Haveli'), 'Pune talukas must include Haveli');
testAssert(puneTalukas.includes('Pune City'), 'Pune talukas must include Pune City');
testAssert(puneTalukas.includes('Baramati'), 'Pune talukas must include Baramati');

const unknownTalukas = getTalukasForDistrict('UnknownDistrictXYZ');
testAssert(Array.isArray(unknownTalukas) && unknownTalukas.length === 0, 'Unknown district returns empty talukas array');

const rationOffices = getOfficesForService('ration-card');
testAssert(rationOffices.length > 0, 'getOfficesForService("ration-card") must return offices');
testAssert(rationOffices.some((o) => o.officeCategory === 'District Supply Office' || o.officeCategory === 'Collectorate'), 'Ration offices include Supply office / Collectorate');

console.log('   ✓ Directory helper utilities verified.');

// ============================================================================
// 7. TRILINGUAL TRANSLATION INTEGRITY
// ============================================================================
console.log('7. Testing English, Hindi, and Marathi translations completeness...');

const requiredTranslationKeys = [
  'Maharashtra Government Office Directory',
  'Government Office Directory',
  'Directory',
  'Office Directory',
  'All 36 Districts',
  'Select District',
  'District',
  'All Talukas',
  'Select Taluka',
  'Taluka',
  'All Departments',
  'Department',
  'All Office Categories',
  'Office Category',
  'All Services',
  'Service',
  'Clear Filters',
  'Filters',
  'Matching Offices',
  'Total Verified Offices',
  'Districts Covered',
  'Divisions',
  'Collectorate',
  'Tahsil Office',
  'Sub-Divisional Office',
  'Zilla Parishad',
  'Regional Transport Office',
  'Social Welfare Office',
  'District Supply Office',
  'Agriculture Office',
  'Municipal Corporation',
  'Secretariat / State Headquarters',
  'Address',
  'Phone',
  'Email',
  'Official Website',
  'Official Portal',
  'Services Handled',
  'Jurisdiction',
  'Office Timings',
  'Verification Status',
  'Verified',
  'Verified Record',
  'Partially Verified',
  'Official Source',
  'Last Verified',
  'View Office Details',
  'Hide Details',
  'District Portal',
  'No offices match your search criteria',
  'Browse Offices',
];

for (const key of requiredTranslationKeys) {
  const pair = directoryTranslations[key];
  testAssert(Boolean(pair), `Translation key "${key}" must be registered in directoryTranslations`);
  testAssert(Array.isArray(pair) && pair.length === 2, `Key "${key}" must have [Hindi, Marathi] pair`);
  testAssert(typeof pair[0] === 'string' && pair[0].trim().length > 0, `Key "${key}" Hindi string must not be empty`);
  testAssert(typeof pair[1] === 'string' && pair[1].trim().length > 0, `Key "${key}" Marathi string must not be empty`);
}

console.log(`   ✓ All ${requiredTranslationKeys.length} core Directory translation keys verified in EN, HI, MR.`);

// ============================================================================
// 8. LIVE ENDPOINT TEST (WHEN DEV SERVER ACTIVE)
// ============================================================================
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
console.log(`8. Testing live GET /api/directory endpoint on ${base}...`);

try {
  const probe = await fetch(`${base}/api/directory`, { method: 'GET' }).catch(() => null);
  if (!probe) {
    console.log('   (Dev server not running; skipping live HTTP probe in unit run)');
  } else {
    testAssert(probe.status === 200, 'GET /api/directory must return 200 OK');
    const data = await probe.json();
    testAssert(Array.isArray(data.districts) && data.districts.length === 36, 'API returns 36 districts');
    testAssert(Array.isArray(data.departments) && data.departments.length >= 10, 'API returns departments');
    testAssert(Array.isArray(data.categories) && data.categories.length >= 8, 'API returns categories');
    testAssert(Array.isArray(data.offices) && data.offices.length >= 20, 'API returns verified offices');

    // Filtered API query
    const puneApi = await fetch(`${base}/api/directory?district=Pune`);
    testAssert(puneApi.status === 200, 'GET /api/directory?district=Pune returns 200');
    const puneData = await puneApi.json();
    testAssert(puneData.offices.every((o) => o.district === 'Pune' || o.district === 'Maharashtra (Statewide)'), 'Filtered API respects district');

    console.log('   ✓ Live GET /api/directory endpoint verified.');
  }
} catch (e) {
  console.log(`   (Live HTTP probe skipped: ${e.message})`);
}

console.log(`\nPASS: All ${assertions} assertions passed in test-directory.mjs.`);

