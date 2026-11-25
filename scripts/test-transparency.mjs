import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  TRANSPARENCY_CATEGORIES,
  OFFICIAL_GOVERNMENT_PORTALS,
  VERIFIED_ANNOUNCEMENTS,
  filterAnnouncements,
  getTransparencyDepartments,
  getCategoryCounts,
  getTransparencySummary,
  getCitizenNotifications,
} = require('../lib/transparency.ts');

const { transparencyTranslations } = require('../app/transparency-translations.ts');

console.log('--- Testing Government Transparency & Notification Centre (Phase 3 Day 9) ---');

let assertions = 0;
const testAssert = (cond, msg) => {
  assert.ok(cond, msg);
  assertions++;
};

// ============================================================================
// 1. ALL 10 STATUTORY CATEGORIES INTEGRITY
// ============================================================================
console.log('1. Testing 10 statutory announcement categories...');

testAssert(Array.isArray(TRANSPARENCY_CATEGORIES), 'TRANSPARENCY_CATEGORIES must be an array');
testAssert(
  TRANSPARENCY_CATEGORIES.length === 10,
  `Must contain exactly 10 canonical categories, found: ${TRANSPARENCY_CATEGORIES.length}`
);

const expectedCategories = [
  'government_resolutions',
  'department_notifications',
  'scheme_updates',
  'public_notices',
  'citizen_services',
  'agriculture_updates',
  'education_scholarships',
  'health_welfare',
  'public_infrastructure',
  'administrative_updates',
];

for (const expectedId of expectedCategories) {
  const found = TRANSPARENCY_CATEGORIES.find((c) => c.id === expectedId);
  testAssert(Boolean(found), `Category "${expectedId}" must exist in TRANSPARENCY_CATEGORIES`);
  testAssert(typeof found.name === 'string' && found.name.length > 0, `${expectedId} name must be non-empty`);
  testAssert(
    typeof found.description === 'string' && found.description.length > 15,
    `${expectedId} description must be detailed`
  );
}

// Ensure all categories have real records
const counts = getCategoryCounts(VERIFIED_ANNOUNCEMENTS);
for (const expectedId of expectedCategories) {
  testAssert(
    counts[expectedId] > 0,
    `Category "${expectedId}" must have at least 1 real announcement record (found ${counts[expectedId]})`
  );
}

// ============================================================================
// 2. OFFICIAL GOVERNMENT PORTALS DIRECTORY
// ============================================================================
console.log('2. Testing official government portals directory...');

testAssert(Array.isArray(OFFICIAL_GOVERNMENT_PORTALS), 'OFFICIAL_GOVERNMENT_PORTALS must be an array');
testAssert(OFFICIAL_GOVERNMENT_PORTALS.length >= 8, 'Must list at least 8 official government portals');

for (const portal of OFFICIAL_GOVERNMENT_PORTALS) {
  testAssert(typeof portal.id === 'string' && portal.id.length > 0, 'Portal id must be non-empty');
  testAssert(typeof portal.name === 'string' && portal.name.length > 0, 'Portal name must be non-empty');
  testAssert(typeof portal.department === 'string' && portal.department.length > 0, 'Portal department must be non-empty');
  testAssert(typeof portal.url === 'string' && portal.url.startsWith('https://'), `Portal ${portal.id} must be HTTPS`);
  testAssert(
    portal.url.includes('.gov.in') || portal.url.includes('.nic.in') || portal.url.includes('mahaonline.gov.in'),
    `Portal ${portal.id} must belong to an official government domain`
  );
  testAssert(typeof portal.description === 'string' && portal.description.length > 10, 'Portal description must be detailed');
}

// ============================================================================
// 3. ANNOUNCEMENT RECORDS DATA INTEGRITY & AUDIT
// ============================================================================
console.log('3. Testing announcement records verification & data integrity...');

testAssert(Array.isArray(VERIFIED_ANNOUNCEMENTS), 'VERIFIED_ANNOUNCEMENTS must be an array');
testAssert(VERIFIED_ANNOUNCEMENTS.length === 25, `Expected 25 announcements, found: ${VERIFIED_ANNOUNCEMENTS.length}`);

const seenIds = new Set();
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

for (const ann of VERIFIED_ANNOUNCEMENTS) {
  // Unique ID
  testAssert(!seenIds.has(ann.id), `Duplicate announcement ID detected: ${ann.id}`);
  seenIds.add(ann.id);

  // Text fields
  testAssert(typeof ann.title === 'string' && ann.title.length > 10, `Announcement ${ann.id} title must be descriptive`);
  testAssert(typeof ann.summary === 'string' && ann.summary.length > 20, `Announcement ${ann.id} summary must be descriptive`);
  testAssert(
    typeof ann.fullDescription === 'string' && ann.fullDescription.length > 50,
    `Announcement ${ann.id} fullDescription must provide thorough detail`
  );
  testAssert(typeof ann.department === 'string' && ann.department.length > 0, `Announcement ${ann.id} department missing`);

  // Category
  testAssert(
    expectedCategories.includes(ann.category),
    `Announcement ${ann.id} category "${ann.category}" must be one of the 10 statutory categories`
  );

  // Dates
  testAssert(dateRegex.test(ann.publicationDate), `Announcement ${ann.id} publicationDate must be YYYY-MM-DD`);
  testAssert(dateRegex.test(ann.effectiveDate), `Announcement ${ann.id} effectiveDate must be YYYY-MM-DD`);
  testAssert(dateRegex.test(ann.lastVerifiedDate), `Announcement ${ann.id} lastVerifiedDate must be YYYY-MM-DD`);
  if (ann.expiryDate) {
    testAssert(dateRegex.test(ann.expiryDate), `Announcement ${ann.id} expiryDate must be YYYY-MM-DD`);
  }

  // Official Reference Code / GR code
  testAssert(
    typeof ann.referenceNumber === 'string' && ann.referenceNumber.length > 3,
    `Announcement ${ann.id} referenceNumber must contain authentic official order/circular code`
  );

  // URLs
  testAssert(
    typeof ann.officialSourceUrl === 'string' && ann.officialSourceUrl.startsWith('https://'),
    `Announcement ${ann.id} officialSourceUrl must be HTTPS`
  );
  if (ann.documentUrl) {
    testAssert(ann.documentUrl.startsWith('https://'), `Announcement ${ann.id} documentUrl must be HTTPS`);
  }

  // Verification & Validity Status
  testAssert(
    ['verified', 'partially_verified', 'historical_archive', 'validity_unconfirmed'].includes(ann.verificationStatus),
    `Announcement ${ann.id} invalid verificationStatus: ${ann.verificationStatus}`
  );
  testAssert(
    ['active', 'in_progress', 'superseded', 'expired', 'unconfirmed'].includes(ann.validityStatus),
    `Announcement ${ann.id} invalid validityStatus: ${ann.validityStatus}`
  );
  testAssert(
    ['high', 'medium', 'general'].includes(ann.impactLevel),
    `Announcement ${ann.id} invalid impactLevel: ${ann.impactLevel}`
  );

  // Languages Available
  testAssert(
    Array.isArray(ann.languagesAvailable) && ann.languagesAvailable.includes('en') && ann.languagesAvailable.includes('mr'),
    `Announcement ${ann.id} must support at least en and mr`
  );

  // Historical archive logic
  if (ann.isArchive) {
    testAssert(
      ann.verificationStatus === 'historical_archive' || ann.validityStatus === 'expired',
      `Announcement ${ann.id} isArchive must correspond to historical_archive or expired status`
    );
  }
}

// ============================================================================
// 4. STATUTORY FOCUS AREAS VERIFICATION
// ============================================================================
console.log('4. Testing statutory focus areas...');

// A. PMFBY ₹1 Crop Insurance Resolution
const pmfby = VERIFIED_ANNOUNCEMENTS.find((a) => a.id === 'gr-mah-2023-pmfby-1rupee');
testAssert(Boolean(pmfby), 'PMFBY resolution must exist');
testAssert(pmfby.referenceNumber === 'पीकवि-२०२३/प्र.क्र.२२/११-ए', 'PMFBY GR number must match official gazette');
testAssert(pmfby.publicationDate === '2023-06-26', 'PMFBY publication date must be 2023-06-26');
testAssert(pmfby.category === 'agriculture_updates', 'PMFBY category must be agriculture_updates');
testAssert(pmfby.verificationStatus === 'verified', 'PMFBY must be verified');

// B. RTS 120 Online Services Expansion
const rtsAnn = VERIFIED_ANNOUNCEMENTS.find((a) => a.id === 'notif-aaplesarkar-rts-expansion');
testAssert(Boolean(rtsAnn), 'RTS expansion circular must exist');
testAssert(rtsAnn.referenceNumber === 'संकीर्ण-२०२१/प्र.क्र.२८/माहिती तंत्रज्ञान', 'RTS circular code must match');
testAssert(rtsAnn.effectiveDate === '2021-10-01', 'RTS effective date must match');

// C. Mahatma Jyotirao Phule Karjmukti Yojana (MJPSKY) Caveat
const mjpsky = VERIFIED_ANNOUNCEMENTS.find((a) => a.id === 'gr-mah-mjpsky-debt-relief-status');
testAssert(Boolean(mjpsky), 'MJPSKY announcement must exist');
testAssert(
  mjpsky.verificationStatus === 'partially_verified',
  'MJPSKY must be classified as partially_verified due to historical cut-off eligibility'
);
testAssert(
  mjpsky.fullDescription.includes('NOT an open, perpetual debt-forgiveness program'),
  'MJPSKY must contain explicit disclaimer that it is not perpetual debt forgiveness'
);

// D. Grievance Redressal 21-Day SOP
const grvAnn = VERIFIED_ANNOUNCEMENTS.find((a) => a.id === 'gr-mah-2020-grievance-21day-sop');
testAssert(Boolean(grvAnn), 'Grievance 21-day SOP must exist');
testAssert(grvAnn.referenceNumber === 'तक्रार-२०२०/प्र.क्र.४५/प्रशा-१', 'Grievance GR number must match');

// ============================================================================
// 5. SEARCH AND FILTER FUNCTIONALITY
// ============================================================================
console.log('5. Testing search and filter logic...');

// Search by title
const titleSearch = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { query: 'Crop Insurance' });
testAssert(titleSearch.length >= 1, 'Search for "Crop Insurance" should return at least 1 record');
testAssert(titleSearch.some((a) => a.id === 'gr-mah-2023-pmfby-1rupee'), 'Should find PMFBY');

// Search by reference code
const refSearch = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { query: 'पीकवि-२०२३' });
testAssert(refSearch.length >= 1, 'Search by Marathi reference number should return record');

// Search by department
const deptSearch = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { query: 'Public Health' });
testAssert(deptSearch.length >= 2, 'Search by department should return at least 2 records');

// Filter by category
const agrFilter = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { category: 'agriculture_updates' });
testAssert(agrFilter.length === 2, `Expected 2 agriculture_updates, found ${agrFilter.length}`);
testAssert(agrFilter.every((a) => a.category === 'agriculture_updates'), 'All records must match category');

// Filter by department dropdown
const ditFilter = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, {
  department: 'Directorate of Information Technology (DIT)',
  includeArchive: true,
});
testAssert(ditFilter.length === 1, 'Should find DIT server maintenance notice');

// Filter by verificationStatus
const verifiedOnly = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { verificationStatus: 'verified' });
testAssert(verifiedOnly.length >= 18, `Expected at least 18 fully verified, found: ${verifiedOnly.length}`);
testAssert(verifiedOnly.every((a) => a.verificationStatus === 'verified'), 'All must be verified');

// Filter by validityStatus
const activeOnly = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { validityStatus: 'active' });
testAssert(activeOnly.length >= 18, `Expected at least 18 active, found: ${activeOnly.length}`);

// Archive exclusion / inclusion
const defaultView = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { includeArchive: false });
testAssert(
  defaultView.every((a) => !a.isArchive && a.validityStatus !== 'expired'),
  'Default view without archive must hide historical/expired notices'
);

const archiveIncluded = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { includeArchive: true });
testAssert(
  archiveIncluded.length === VERIFIED_ANNOUNCEMENTS.length,
  'Include archive should include all records'
);

// Sorting
const sortedNewest = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { sortBy: 'newest' });
for (let i = 0; i < sortedNewest.length - 1; i++) {
  testAssert(
    sortedNewest[i].publicationDate >= sortedNewest[i + 1].publicationDate,
    'Sorted newest must be descending by publicationDate'
  );
}

const sortedOldest = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { sortBy: 'oldest' });
for (let i = 0; i < sortedOldest.length - 1; i++) {
  testAssert(
    sortedOldest[i].publicationDate <= sortedOldest[i + 1].publicationDate,
    'Sorted oldest must be ascending by publicationDate'
  );
}

// Empty state check
const noMatch = filterAnnouncements(VERIFIED_ANNOUNCEMENTS, { query: 'NONEXISTENT_QUERY_XYZ_123' });
testAssert(Array.isArray(noMatch) && noMatch.length === 0, 'No match search should return empty array');

// ============================================================================
// 6. SUMMARY STATISTICS INTEGRITY
// ============================================================================
console.log('6. Testing summary statistics computation...');

const depts = getTransparencyDepartments(VERIFIED_ANNOUNCEMENTS);
testAssert(Array.isArray(depts) && depts.length >= 8, 'getTransparencyDepartments must return list of departments');

const stats = getTransparencySummary(VERIFIED_ANNOUNCEMENTS);
testAssert(stats.total === 25, `Total should be 25, found: ${stats.total}`);
testAssert(stats.categories === 10, `Categories count should be 10, found: ${stats.categories}`);
testAssert(stats.departments >= 8, `Departments count should be at least 8, found: ${stats.departments}`);
testAssert(stats.verified >= 18, `Verified count should be >= 18, found: ${stats.verified}`);
testAssert(stats.partiallyVerified >= 1, `Partially verified count should be >= 1, found: ${stats.partiallyVerified}`);
testAssert(stats.archived >= 4, `Archived count should be >= 4, found: ${stats.archived}`);

// ============================================================================
// 7. CITIZEN NOTIFICATION CENTRE SYNTHESIS
// ============================================================================
console.log('7. Testing citizen notification centre synthesis...');

const mockApplications = [
  {
    id: 'APP-SCH-001',
    service: 'scholarship',
    owner: 'user-1',
    status: 'clarification',
    decision_note: 'Income certificate is unreadable, please re-upload.',
    created_at: '2026-11-20T10:00:00Z',
  },
  {
    id: 'APP-RES-002',
    service: 'residence',
    owner: 'user-1',
    status: 'approved',
    decided_at: '2026-11-22T14:30:00Z',
    created_at: '2026-11-15T09:00:00Z',
  },
  {
    id: 'APP-RATION-003',
    service: 'ration-card',
    owner: 'user-1',
    status: 'submitted',
    submitted_at: '2026-10-01T08:00:00Z', // Old submitted date to test RTS SLA alert
    created_at: '2026-10-01T08:00:00Z',
  },
];

const mockGrievances = [
  {
    id: 'GRV-001',
    reference_number: 'GRV-2026-MH-001',
    service_id: 'scholarship',
    owner: 'user-1',
    status: 'resolved',
    resolution_summary: 'Discrepancy verified and corrected by nodal officer.',
    created_at: '2026-11-21T11:00:00Z',
  },
];

const notifs = getCitizenNotifications(mockApplications, [], mockGrievances, VERIFIED_ANNOUNCEMENTS);

testAssert(Array.isArray(notifs), 'getCitizenNotifications must return an array');
testAssert(notifs.length >= 4, `Expected at least 4 notifications, found: ${notifs.length}`);

// Action Required Notification
const actionReq = notifs.find((n) => n.type === 'action_required');
testAssert(Boolean(actionReq), 'Must generate action_required notification for clarification app');
testAssert(actionReq.severity === 'urgent', 'Clarification notification must be urgent');
testAssert(actionReq.referenceId === 'APP-SCH-001', 'Reference ID must match application');

// Approved Notification
const approvedNotif = notifs.find((n) => n.type === 'application_status' && n.severity === 'success');
testAssert(Boolean(approvedNotif), 'Must generate success notification for approved app');
testAssert(approvedNotif.referenceId === 'APP-RES-002', 'Approved app ID must match');

// RTS SLA Alert
const rtsAlert = notifs.find((n) => n.type === 'rts_alert');
testAssert(Boolean(rtsAlert), 'Must generate RTS alert for overdue application');

// Grievance Update
const grvNotif = notifs.find((n) => n.type === 'grievance_update');
testAssert(Boolean(grvNotif), 'Must generate grievance update notification');
testAssert(grvNotif.referenceId === 'GRV-2026-MH-001', 'Grievance reference must match');

// Relevant Announcement Matching
const relevantAnn = notifs.find((n) => n.type === 'relevant_announcement');
testAssert(Boolean(relevantAnn), 'Must include relevant official announcement matching citizen service');
testAssert(relevantAnn.source === 'official_announcement', 'Must clearly identify official announcement source');

// Empty notifications for user with no applications or grievances
const emptyNotifs = getCitizenNotifications([], [], [], VERIFIED_ANNOUNCEMENTS);
// It might still include high-impact statutory notices, but 0 application updates
testAssert(
  emptyNotifs.every((n) => n.type === 'relevant_announcement'),
  'User with no applications should receive zero application/rts/grievance notifications'
);

// ============================================================================
// 8. TRILINGUAL TRANSLATION COVERAGE
// ============================================================================
console.log('8. Testing trilingual translation coverage for transparency...');

testAssert(typeof transparencyTranslations === 'object', 'transparencyTranslations must be an object');

// Check every category name has translation
for (const cat of TRANSPARENCY_CATEGORIES) {
  testAssert(Boolean(transparencyTranslations[cat.name]), `Missing translation for category name: ${cat.name}`);
  const pair = transparencyTranslations[cat.name];
  testAssert(pair && pair.length === 2, `Translation pair must have 2 elements for ${cat.name}`);
  testAssert(pair[0].trim().length > 0, `Hindi translation missing for ${cat.name}`);
  testAssert(pair[1].trim().length > 0, `Marathi translation missing for ${cat.name}`);
}

// Check every announcement title has translation
for (const ann of VERIFIED_ANNOUNCEMENTS) {
  testAssert(Boolean(transparencyTranslations[ann.title]), `Missing translation for announcement title: ${ann.title}`);
  const pair = transparencyTranslations[ann.title];
  testAssert(pair && pair.length === 2, `Translation pair must have 2 elements for ${ann.title}`);
  testAssert(pair[0].trim().length > 0, `Hindi translation missing for ${ann.title}`);
  testAssert(pair[1].trim().length > 0, `Marathi translation missing for ${ann.title}`);
}

console.log(`\nPASS: ${assertions} assertions passed cleanly in test-transparency.mjs!`);
