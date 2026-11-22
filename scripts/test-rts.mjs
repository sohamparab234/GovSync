import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  RTS_SERVICES_CATALOGUE,
  NIRADHAR_OLD_AGE_CERTIFICATE_RTS,
  addWorkingDays,
  addDays,
  calculateFirstAppealWindow,
  calculateSecondAppealWindow,
  calculateCommissionAppealWindow,
  calculateRtsDeadline,
  getEscalationStages,
  getRtsSummary,
} = require('../lib/rts.ts');

console.log('--- Testing RTS Deadline & Escalation Engine (Phase 3 Day 5 Final Statutory Audit) ---');

let assertions = 0;
const testAssert = (cond, msg) => {
  assert.ok(cond, msg);
  assertions++;
};

// ============================================================================
// 1. STATUTORY CATALOGUE & DAY-COUNT CLASSIFICATION AUDIT
// ============================================================================
console.log('1. Auditing RTS Services Catalogue, Day-Count Classifications & Notifications...');

const catalogueKeys = Object.keys(RTS_SERVICES_CATALOGUE);
testAssert(catalogueKeys.length === 7, 'All 7 GovSync services must be catalogued');

// 1a. Residence Certificate (वय, अधिवास व राष्ट्रीयत्व प्रमाणपत्र)
const res = RTS_SERVICES_CATALOGUE['residence'];
testAssert(res.isRtsCovered === true, 'Residence must be RTS covered');
testAssert(res.stipulatedDays === 15, 'Residence timeline must be 15 working days');
testAssert(res.dayType === 'working', 'Residence dayType must be working');
testAssert(res.statutoryWording === '15 working days', 'Residence statutory wording recorded');
testAssert(res.verifiedComputationRule.includes('Revenue & Forest Department'), 'Residence verified computation rule');
testAssert(res.officialSource.notificationRef.includes('RTS-2015/C.R.325/Rev-1'), 'Residence citation must be verified');
testAssert(res.designatedOfficer.includes('Tahsildar'), 'Residence designated officer must be Tahsildar');
testAssert(res.firstAppellateAuthority.includes('SDO'), 'Residence FAA must be SDO');
testAssert(res.secondAppellateAuthority.includes('Additional Collector'), 'Residence SAA must be Additional Collector');

// 1b. Income Certificate (उत्पन्नाचा दाखला)
const inc = RTS_SERVICES_CATALOGUE['income-certificate'];
testAssert(inc.isRtsCovered === true, 'Income Certificate must be RTS covered');
testAssert(inc.stipulatedDays === 15, 'Income Certificate timeline must be 15 working days');
testAssert(inc.dayType === 'working', 'Income Certificate dayType must be working');
testAssert(inc.statutoryWording === '15 working days', 'Income statutory wording recorded');
testAssert(inc.officialSource.notificationRef.includes('RTS-2015/C.R.325/Rev-1'), 'Income citation must be verified');

// 1c. Caste Certificate (जात प्रमाणपत्र)
const caste = RTS_SERVICES_CATALOGUE['caste-certificate'];
testAssert(caste.isRtsCovered === true, 'Caste Certificate must be RTS covered');
testAssert(caste.stipulatedDays === 21, 'Caste Certificate issuance must be 21 working days');
testAssert(caste.dayType === 'working', 'Caste Certificate dayType must be working');
testAssert(caste.statutoryWording === '21 working days', 'Caste statutory wording recorded');
testAssert(caste.designatedOfficer.includes('SDO'), 'Caste designated officer must be SDO');
testAssert(caste.firstAppellateAuthority.includes('Additional Collector'), 'Caste FAA must be Additional Collector');
testAssert(caste.secondAppellateAuthority.includes('Divisional Commissioner'), 'Caste SAA must be Divisional Commissioner');
testAssert(caste.exceptions.some(e => e.includes('Scrutiny')), 'Caste exceptions must distinguish Act XXIII of 2001 scrutiny');

// 1d. Ration Card (नवीन शिधापत्रिका देणे) - Generic "days" in notification
const ration = RTS_SERVICES_CATALOGUE['ration-card'];
testAssert(ration.isRtsCovered === true, 'Ration Card must be RTS covered');
testAssert(ration.stipulatedDays === 30, 'Ration Card timeline must be 30 days');
testAssert(ration.dayType === 'days', 'Ration Card dayType must be days (not asserted as calendar or working days)');
testAssert(ration.statutoryWording === '30 days', 'Statutory wording is "30 days"');
testAssert(ration.officialSource.notificationRef.includes('RTS-2015/C.R.12/CS-21'), 'Ration Card citation must be verified');
testAssert(ration.designatedOfficer.includes('Food Distribution Officer') || ration.designatedOfficer.includes('Tahsildar'), 'Ration Card DO');

// 1e. Old Age Pension vs Old Age Certificate for Niradhar Audit
const pension = RTS_SERVICES_CATALOGUE['pension'];
testAssert(pension.isRtsCovered === false, 'Financial Pension scheme sanction is NOT uniform single RTS SLA');
testAssert(pension.stipulatedDays === null, 'Pension financial sanction has null stipulatedDays');
testAssert(pension.dayType === 'session', 'Pension dayType is session (committee meeting cycles)');
testAssert(pension.statutoryNotes.includes('Old Age Certificate for Niradhar'), 'Pension notes must cross-reference Old Age Certificate for Niradhar');

// Prerequisite RTS service: Old Age Certificate for Niradhar (निराधारांसाठी वयाचा दाखला)
testAssert(NIRADHAR_OLD_AGE_CERTIFICATE_RTS.isRtsCovered === true, 'Old Age Certificate for Niradhar is RTS covered');
testAssert(NIRADHAR_OLD_AGE_CERTIFICATE_RTS.stipulatedDays === 5, 'Old Age Certificate for Niradhar timeline is 5 working days');
testAssert(NIRADHAR_OLD_AGE_CERTIFICATE_RTS.dayType === 'working', 'Old Age Certificate for Niradhar dayType is working');
testAssert(NIRADHAR_OLD_AGE_CERTIFICATE_RTS.statutoryWording === '5 working days', 'Niradhar statutory wording is 5 working days');
testAssert(NIRADHAR_OLD_AGE_CERTIFICATE_RTS.officialSource.notificationRef.includes('RTS-2015/C.R.18/PR-4'), 'Rural Development Notification verified');

// 1f. Central Exemption: Passport
const passport = RTS_SERVICES_CATALOGUE['passport'];
testAssert(passport.isRtsCovered === false, 'Passport must NOT be covered by Maharashtra RTS');
testAssert(passport.stipulatedDays === null, 'Passport must have null stipulatedDays under Maharashtra RTS');
testAssert(passport.governingAct.includes('Passports Act'), 'Passport must cite Central Passports Act 1967');

// 1g. Academic Exemption: Scholarship
const scholarship = RTS_SERVICES_CATALOGUE['scholarship'];
testAssert(scholarship.isRtsCovered === false, 'Scholarship must NOT have uniform statutory RTS SLA');
testAssert(scholarship.stipulatedDays === null, 'Scholarship must have null stipulatedDays');
testAssert(scholarship.dayType === 'session', 'Scholarship dayType is session');

console.log('✓ Catalogue metadata, citations, day-count classifications, and Pension vs Niradhar audited.');

// ============================================================================
// 2. WORKING DAYS VS DAYS ARITHMETIC
// ============================================================================
console.log('2. Testing Working vs General day arithmetic...');

const mon = new Date('2026-11-02T10:00:00Z');
const tue = addWorkingDays(mon, 1);
testAssert(tue.toISOString().startsWith('2026-11-03'), '1 working day from Mon must be Tue');

const fri = new Date('2026-11-06T10:00:00Z');
const nextMon = addWorkingDays(fri, 1);
testAssert(nextMon.toISOString().startsWith('2026-11-09'), '1 working day from Fri must be Mon (skipping weekend)');

const plus15Working = addWorkingDays(mon, 15);
testAssert(plus15Working.toISOString().startsWith('2026-11-23'), '15 working days from Mon Nov 2 must be Mon Nov 23');

const plus15Days = addDays(mon, 15);
testAssert(plus15Days.toISOString().startsWith('2026-11-17'), '15 days from Mon Nov 2 must be Tue Nov 17');

const plus30Days = addDays(mon, 30);
testAssert(plus30Days.toISOString().startsWith('2026-12-02'), '30 days from Mon Nov 2 must be Wed Dec 02');

console.log('✓ Working day and elapsed day calculations verified.');

// ============================================================================
// 3. SECTION 5: COMPLETE-APPLICATION START DATE & CLARIFICATION HANDLING
// ============================================================================
console.log('3. Testing Section 5 Complete-Application Start Date & Clarification Tracking...');

const refDate = new Date('2026-11-18T10:00:00Z');

// 3a. Draft application (incomplete application under Section 5(1)) -> insufficient_information
const draftApp = {
  id: 'APP-DRAFT-01',
  service: 'residence',
  citizen_id: 'DEMO-1001',
  status: 'draft',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
};
const draftDeadline = calculateRtsDeadline(draftApp, refDate);
testAssert(draftDeadline.status === 'insufficient_information', 'Draft status returns insufficient_information under Section 5(1)');
testAssert(draftDeadline.calculationExplanation.includes('Section 5(1)'), 'Explanation must cite Section 5(1)');
testAssert(draftDeadline.isEligibleForFirstAppeal === false, 'Draft incomplete application is not eligible for First Appeal');

// 3b. Missing submitted_at timestamp -> insufficient_information
const missingSubApp = {
  id: 'APP-MISSING-SUB',
  service: 'residence',
  citizen_id: 'DEMO-1001',
  status: 'submitted',
  submitted_at: null,
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
};
const missingSubDeadline = calculateRtsDeadline(missingSubApp, refDate);
testAssert(missingSubDeadline.status === 'insufficient_information', 'Missing submitted_at returns insufficient_information under Section 5(1)');

// 3c. Clarification status:
// NO automatic statutory clock suspension claimed under Section 5(1).
// Statutory countdown continues from complete application submission.
// Distinguishes internal administrative tracking pause from statutory suspension.
const clarAppActive = {
  id: 'APP-CLAR-ACTIVE',
  service: 'residence',
  citizen_id: 'DEMO-1001',
  status: 'clarification',
  submitted_at: '2026-11-12T10:00:00Z', // Submitted Nov 12 -> Due Dec 03
  created_at: '2026-11-12T10:00:00Z',
  updated_at: '2026-11-15T10:00:00Z',
};
const clarDeadlineActive = calculateRtsDeadline(clarAppActive, refDate);
testAssert(clarDeadlineActive.isInternalClarificationPending === true, 'Internal clarification pending flag is true');
testAssert(clarDeadlineActive.clarificationNote !== null && clarDeadlineActive.clarificationNote.includes('internal administrative tracking pause'), 'Distinguishes internal tracking pause from statutory suspension');
testAssert(!clarDeadlineActive.calculationExplanation.includes('proviso'), 'Must NOT claim Section 5(1) has a clarification-suspension proviso');
testAssert(clarDeadlineActive.status === 'on_track', 'Active clarification within timeline remains on_track');

// 3d. Clarification status past statutory deadline:
// Since there is no statutory suspension, an application in clarification past statutory time limit is OVERDUE under Section 9(1)!
const clarAppOverdue = {
  id: 'APP-CLAR-OVERDUE',
  service: 'residence',
  citizen_id: 'DEMO-1001',
  status: 'clarification',
  submitted_at: '2026-10-01T10:00:00Z', // Due Oct 22, ref is Nov 18
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-15T10:00:00Z',
};
const clarDeadlineOverdue = calculateRtsDeadline(clarAppOverdue, refDate);
testAssert(clarDeadlineOverdue.status === 'overdue', 'Clarification past statutory deadline is correctly overdue (no automatic statutory suspension)');
testAssert(clarDeadlineOverdue.isEligibleForFirstAppeal === true, 'Citizen can appeal under Section 9(1) for delay despite clarification status');

console.log('✓ Section 5 complete-application start date verified and spurious proviso claims removed.');

// ============================================================================
// 4. SECTION 9(1) & 9(2): FIRST APPEAL & FAA DISPOSAL CALCULATIONS
// ============================================================================
console.log('4. Testing Section 9(1) & 9(2) First Appeal Windows and 30-Day FAA Disposal...');

const firstAppealWindow = calculateFirstAppealWindow('2026-11-01');

// 4a. Section 9(1): First appeal within 30 days of rejection or deadline expiry
testAssert(firstAppealWindow.filingDeadline === '2026-12-01', 'First appeal filing deadline is 30 days from base date');

// 4b. Section 9(1) proviso: Statutory condonation of delay up to 90 days
testAssert(firstAppealWindow.maxCondonationDeadline === '2027-01-30', 'Max condonation deadline is 90 days under Section 9(1) proviso');

// 4c. Section 9(2): First Appellate Authority disposal within 30 days (NO 15-day extension)
testAssert(firstAppealWindow.disposalDays === 30, 'FAA disposal period is strictly 30 days under Section 9(2)');
testAssert(firstAppealWindow.disposalDeadline === '2026-12-31', 'FAA disposal deadline is exactly +30 days from filing');
testAssert(!('exceptionalExtensionDays' in firstAppealWindow), 'Claimed 15-day extension removed from Section 9(2)');
testAssert(!('maxDisposalDays' in firstAppealWindow), 'maxDisposalDays removed from Section 9(2)');

// 4d. First Appeal eligibility on overdue application under Section 9(1)
const overdueApp = {
  id: 'APP-RES-OVERDUE',
  service: 'residence',
  citizen_id: 'DEMO-1001',
  name: 'Asha Patil',
  status: 'submitted',
  submitted_at: '2026-10-01T10:00:00Z', // Due Oct 22
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
};
const overdueDeadline = calculateRtsDeadline(overdueApp, refDate);
testAssert(overdueDeadline.status === 'overdue', 'Overdue app has overdue status');
testAssert(overdueDeadline.isEligibleForFirstAppeal === true, 'Overdue app is eligible for First Appeal under Section 9(1)');
testAssert(overdueDeadline.firstAppealDeadline !== null, 'Overdue app has firstAppealDeadline');
testAssert(overdueDeadline.calculationExplanation.includes('Section 9(1)'), 'Explanation cites Section 9(1)');

// 4e. First Appeal eligibility on rejected application under Section 9(1)
const rejectedApp = {
  id: 'APP-RES-REJECTED',
  service: 'residence',
  citizen_id: 'DEMO-1001',
  name: 'Asha Patil',
  status: 'rejected',
  submitted_at: '2026-11-02T10:00:00Z',
  decided_at: '2026-11-10T10:00:00Z',
  created_at: '2026-11-02T10:00:00Z',
  updated_at: '2026-11-10T10:00:00Z',
};
const rejectedDeadline = calculateRtsDeadline(rejectedApp, refDate);
testAssert(rejectedDeadline.isEligibleForFirstAppeal === true, 'Rejected app is eligible for First Appeal under Section 9(1)');
testAssert(rejectedDeadline.firstAppealDeadline === '2026-12-10', 'First appeal deadline is 30 days from rejection date (Nov 10 + 30 days = Dec 10)');

console.log('✓ Section 9(1) 30-day appeal, 90-day condonation, and Section 9(2) strictly 30-day FAA disposal verified.');

// ============================================================================
// 5. SECTION 9(3) & 9(4): SECOND APPEAL & SAA DISPOSAL CALCULATIONS
// ============================================================================
console.log('5. Testing Section 9(3) & 9(4) Second Appeal Windows and 45-Day SAA Disposal...');

// Scenario 1: First Appellate Authority passed an order on 2026-11-10
const saWithOrder = calculateSecondAppealWindow({
  firstAppealFilingDate: '2026-10-15',
  firstAppealOrderDate: '2026-11-10',
  referenceDate: '2026-11-18',
});

// 5a. Section 9(3): 30-day second appeal window after an FAA order
testAssert(saWithOrder.triggerCondition === 'order_received', 'Trigger condition is order_received');
testAssert(saWithOrder.canFileNow === true, 'Can file second appeal after order received');
testAssert(saWithOrder.filingDeadline === '2026-12-10', 'Second appeal deadline is 30 days from order date (Nov 10 + 30 days = Dec 10)');

// 5b. Section 9(3) proviso: Statutory condonation of delay up to 90 days preserved
testAssert(saWithOrder.maxCondonationDeadline === '2027-02-08', 'Max condonation deadline is 90 days from order date');

// 5c. Section 9(4): SAA disposal within 45 days (NO 15-day extension)
testAssert(saWithOrder.disposalDays === 45, 'SAA disposal period is strictly 45 days under Section 9(4)');
testAssert(!('exceptionalExtensionDays' in saWithOrder), 'Claimed 15-day extension removed from Section 9(4)');
testAssert(!('maxDisposalDays' in saWithOrder), 'maxDisposalDays removed from Section 9(4)');

// Scenario 2: First appeal filed on 2026-10-01, NO order received
// 5d. Section 9(3): Cannot file second appeal before 45 days elapse from first appeal filing
const saNoOrderPremature = calculateSecondAppealWindow({
  firstAppealFilingDate: '2026-10-01',
  firstAppealOrderDate: null,
  referenceDate: '2026-11-10', // 40 days
});
testAssert(saNoOrderPremature.triggerCondition === 'no_order_after_45_days', 'Condition is no_order_after_45_days');
testAssert(saNoOrderPremature.canFileNow === false, 'Cannot file second appeal before 45 days have elapsed');
testAssert(saNoOrderPremature.earliestFilingDate === '2026-11-15', 'Earliest filing date is exactly 45 days after first appeal');

// 5e. Section 9(3): Second appeal becomes available on or after 45 days from first appeal filing
const saNoOrderMatured = calculateSecondAppealWindow({
  firstAppealFilingDate: '2026-10-01',
  firstAppealOrderDate: null,
  referenceDate: '2026-11-18', // 48 days
});
testAssert(saNoOrderMatured.canFileNow === true, 'Can file second appeal after 45 days without FAA order');
testAssert(saNoOrderMatured.earliestFilingDate === '2026-11-15', 'Earliest filing date was 2026-11-15');

console.log('✓ Section 9(3) 30-day order / 45-day no-order rules and Section 9(4) strictly 45-day SAA disposal verified.');

// ============================================================================
// 6. SECTION 18 & SECTION 10: STATE RTS COMMISSION & PENALTIES
// ============================================================================
console.log('6. Testing Section 18 Third Appeal to Commission and Section 10 Penalties...');

const commAppeal = calculateCommissionAppealWindow('2026-11-15');
// 6a. Section 18(1): Third appeal to Commission within 60 days of receiving SAA order
testAssert(commAppeal.filingDeadline === '2027-01-14', 'Commission appeal deadline is 60 days from receiving SAA order');
testAssert(commAppeal.statutoryBasis.includes('Section 18(1)'), 'Must cite Section 18(1)');

// 6b. Section 10 Penalty bounds: ₹500 to ₹5,000 on defaulting Designated Officers
testAssert(commAppeal.penaltyMinAmount === 500, 'Minimum statutory penalty is ₹500 under Section 10');
testAssert(commAppeal.penaltyMaxAmount === 5000, 'Maximum statutory penalty is ₹5,000 under Section 10');

console.log('✓ Section 18 Commission appeal window and Section 10 penalty bounds verified.');

// ============================================================================
// 7. STATUTORY ESCALATION HIERARCHY STAGES (STAGES 1 TO 4)
// ============================================================================
console.log('7. Testing Statutory Escalation Hierarchy Stages Structure...');

const stagesOverdue = getEscalationStages(overdueApp, overdueDeadline);
testAssert(stagesOverdue.length === 4, 'Must return 4 escalation tiers');

// Stage 1: Designated Officer (Section 5(1))
testAssert(stagesOverdue[0].stageNumber === 1, 'Stage 1 number');
testAssert(stagesOverdue[0].stageKey === 'designated_officer', 'Stage 1 key');
testAssert(stagesOverdue[0].statutoryBasis.includes('Section 5(1)'), 'Stage 1 must cite Section 5(1)');

// Stage 2: First Appellate Authority (Section 9(1) & 9(2))
testAssert(stagesOverdue[1].stageNumber === 2, 'Stage 2 number');
testAssert(stagesOverdue[1].stageKey === 'first_appeal', 'Stage 2 key');
testAssert(stagesOverdue[1].statutoryBasis.includes('Section 9(1)'), 'Stage 2 must cite Section 9(1)');
testAssert(stagesOverdue[1].statutoryBasis.includes('Section 9(2)'), 'Stage 2 must cite Section 9(2)');
testAssert(stagesOverdue[1].timeLimitToApproach.includes('30 days') && stagesOverdue[1].timeLimitToApproach.includes('90 days'), 'Approach window mentions 30 days and 90-day condonation');
testAssert(stagesOverdue[1].disposalTimeLimit === '30 days from appeal receipt under Section 9(2).', 'Disposal window is strictly 30 days');
testAssert(stagesOverdue[1].isCurrentlyApplicable === true, 'Stage 2 FAA is currently applicable for overdue app');

// Stage 3: Second Appellate Authority (Section 9(3) & 9(4))
testAssert(stagesOverdue[2].stageNumber === 3, 'Stage 3 number');
testAssert(stagesOverdue[2].stageKey === 'second_appeal', 'Stage 3 key');
testAssert(stagesOverdue[2].statutoryBasis.includes('Section 9(3)'), 'Stage 3 must cite Section 9(3)');
testAssert(stagesOverdue[2].statutoryBasis.includes('Section 9(4)'), 'Stage 3 must cite Section 9(4)');
testAssert(stagesOverdue[2].timeLimitToApproach.includes('30 days') && stagesOverdue[2].timeLimitToApproach.includes('45 days'), 'Approach mentions 30 days from order or 45 days if no order');
testAssert(stagesOverdue[2].disposalTimeLimit === '45 days from appeal receipt under Section 9(4).', 'Disposal window is strictly 45 days');

// Stage 4: Maharashtra State RTS Commission (Section 18(1) & Section 10)
testAssert(stagesOverdue[3].stageNumber === 4, 'Stage 4 number');
testAssert(stagesOverdue[3].stageKey === 'rts_commission', 'Stage 4 key');
testAssert(stagesOverdue[3].statutoryBasis.includes('Section 18(1)'), 'Stage 4 must cite Section 18(1)');
testAssert(stagesOverdue[3].statutoryBasis.includes('Section 10'), 'Stage 4 must cite Section 10');
testAssert(stagesOverdue[3].timeLimitToApproach.includes('60 days'), 'Commission approach time limit is 60 days');
testAssert(stagesOverdue[3].officialPortalUrl.includes('rts.maharashtra.gov.in'), 'Commission official portal URL');

console.log('✓ 4-tier statutory escalation stages correctly grounded in Sections 5, 9, 10, and 18 without extraneous extensions.');

// ============================================================================
// 8. SUMMARY METRICS AGGREGATION & ROBUSTNESS
// ============================================================================
console.log('8. Testing RTS Summary Metrics Aggregation & Robustness...');

const appOnTrack = {
  id: 'APP-RES-ONTRACK',
  service: 'residence',
  citizen_id: 'DEMO-1001',
  name: 'Asha Patil',
  status: 'submitted',
  submitted_at: '2026-11-12T10:00:00Z',
  created_at: '2026-11-12T10:00:00Z',
  updated_at: '2026-11-12T10:00:00Z',
};

const appApproved = {
  id: 'APP-RES-APPROVED-ONTIME',
  service: 'residence',
  citizen_id: 'DEMO-1001',
  name: 'Asha Patil',
  status: 'approved',
  submitted_at: '2026-11-02T10:00:00Z',
  decided_at: '2026-11-16T10:00:00Z',
  created_at: '2026-11-02T10:00:00Z',
  updated_at: '2026-11-16T10:00:00Z',
};

const appPassport = {
  id: 'APP-PASS-001',
  service: 'passport',
  citizen_id: 'DEMO-1001',
  status: 'submitted',
  submitted_at: '2026-11-01T10:00:00Z',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
};

const appPension = {
  id: 'APP-PEN-001',
  service: 'pension',
  citizen_id: 'DEMO-1004',
  status: 'submitted',
  submitted_at: '2026-11-01T10:00:00Z',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
};

const appUnknown = {
  id: 'APP-UNK-001',
  service: 'custom-non-rts-service',
  citizen_id: 'DEMO-1001',
  status: 'submitted',
  submitted_at: '2026-11-01T10:00:00Z',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
};

// Batch of 10 applications:
// 1. appOnTrack (on_track)
// 2. appApproved (on_track)
// 3. overdueApp (overdue, eligible for appeal)
// 4. rejectedApp (overdue, eligible for appeal)
// 5. clarAppActive (on_track)
// 6. clarAppOverdue (overdue, eligible for appeal)
// 7. draftApp (insufficient_information)
// 8. appPassport (timeline_not_verified)
// 9. appPension (timeline_not_verified)
// 10. appUnknown (timeline_not_verified)
const appBatch = [appOnTrack, appApproved, overdueApp, rejectedApp, clarAppActive, clarAppOverdue, draftApp, appPassport, appPension, appUnknown];
const summary = getRtsSummary(appBatch, refDate);

testAssert(summary.metrics.totalApplications === 10, 'Total applications must match 10');
testAssert(summary.metrics.timelineNotVerifiedCount === 3, '3 unverified/central services (Passport, Pension, Unknown)');
testAssert(summary.metrics.insufficientInfoCount === 1, '1 draft application (draftApp)');
testAssert(summary.metrics.rtsTrackedCount === 6, '6 RTS tracked applications');
testAssert(summary.metrics.onTrackCount === 3, '3 on_track applications (appOnTrack, appApproved, clarAppActive)');
testAssert(summary.metrics.overdueCount === 3, '3 overdue applications (overdueApp, rejectedApp, clarAppOverdue)');
testAssert(summary.metrics.eligibleForAppealCount === 3, '3 applications eligible for appeal (overdueApp, rejectedApp, clarAppOverdue)');

console.log('✓ Summary metrics, unverified day-type handling, and exemptions verified.');

console.log(`\nPASS: All ${assertions} legal assertions passed in test-rts.mjs.`);
