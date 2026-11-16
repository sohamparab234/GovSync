import assert from 'node:assert/strict';
import {sampleRecord,normalize,assess} from '../lib/demo.ts';
import {assessResidence} from '../lib/residence.ts';
import {evaluateApplication,calculateAge,detectConflicts} from '../lib/engine.ts';
import {getAllServices} from '../lib/services.ts';

// 1. Existing baseline tests (scholarship and residence)
const records=Object.fromEntries(['identity','education','income','residence','documents'].map(d=>[d,normalize(d,sampleRecord(d,'DEMO-1001'))]));
assert.equal(assess(records).status,'eligible');
assert.equal(assessResidence(records).status,'eligible');
assert.equal(assessResidence(records,{address:'Flat No. 12, Andheri'}).status,'needs_review');
assert.equal(assessResidence(records,{residenceSince:2099}).status,'needs_review');
assert.equal(assessResidence(records,{documentId:'forged'}).status,'needs_review');
assert.equal(assessResidence(records,{purpose:'Invalid'}).status,'needs_review');
for(const [citizen,status] of [['DEMO-1002','ineligible'],['DEMO-1003','needs_review']]){
 const r=Object.fromEntries(['identity','education','income','residence'].map(d=>[d,normalize(d,sampleRecord(d,citizen))]));
 assert.equal(assess(r).status,status);
}

// 2. Engine age calculation tests
assert.equal(calculateAge('2006-04-12'), new Date().getFullYear() - 2006);
assert.equal(calculateAge('1958-06-15'), new Date().getFullYear() - 1958);
assert.equal(calculateAge(''), 0);
assert.equal(calculateAge(null), 0);

// 3. Declarative 7-Service catalog validation
const allSvc = getAllServices();
assert.equal(allSvc.length, 7);
for (const s of allSvc) {
  assert.ok(s.id);
  assert.ok(s.name);
  assert.ok(s.category);
  assert.ok(s.department);
  assert.ok(s.requiredSources.length >= 2);
  assert.ok(s.rules.length >= 1);
  assert.ok(s.referencePrefix);
}

// 4. Test evaluateApplication across all 7 services
// 4a. Scholarship
assert.equal(evaluateApplication('scholarship', records).status, 'eligible');

// 4b. Residence
assert.equal(evaluateApplication('residence', records).status, 'eligible');
assert.equal(evaluateApplication('residence', records, {address: 'Flat No. 12, Andheri'}).status, 'needs_review');

// 4c. Ration Card (PDS)
// DEMO-1001: income 145000 <= 300000 -> eligible
assert.equal(evaluateApplication('ration-card', records).status, 'eligible');
// DEMO-1002: income 420000 > 300000 -> ineligible
const rec1002 = Object.fromEntries(['identity','education','income','residence','documents'].map(d=>[d,normalize(d,sampleRecord(d,'DEMO-1002'))]));
assert.equal(evaluateApplication('ration-card', rec1002).status, 'ineligible');

// 4d. Passport
assert.equal(evaluateApplication('passport', records).status, 'eligible');
// DEMO-1003 has DOB discrepancy between identity and education
const rec1003 = Object.fromEntries(['identity','education','income','residence','documents'].map(d=>[d,normalize(d,sampleRecord(d,'DEMO-1003'))]));
assert.equal(evaluateApplication('passport', rec1003).status, 'needs_review');

// 4e. Old Age Pension
// DEMO-1004: Senior citizen (age 68 >= 60, income 85000 <= 100000) -> eligible
const rec1004 = Object.fromEntries(['identity','education','income','residence','documents'].map(d=>[d,normalize(d,sampleRecord(d,'DEMO-1004'))]));
assert.equal(evaluateApplication('pension', rec1004).status, 'eligible');
// DEMO-1001: age 20 < 60 -> ineligible
assert.equal(evaluateApplication('pension', records).status, 'ineligible');

// 4f. Income Certificate
assert.equal(evaluateApplication('income-certificate', records).status, 'eligible');
assert.equal(evaluateApplication('income-certificate', rec1004).status, 'eligible');

// 4g. Caste / Community Certificate
// DEMO-1005: Sunita Kamble, adult with verified community document
const rec1005 = Object.fromEntries(['identity','education','income','residence','documents'].map(d=>[d,normalize(d,sampleRecord(d,'DEMO-1005'))]));
assert.equal(evaluateApplication('caste-certificate', rec1005).status, 'eligible');

// 5. Conflict detection validation
const conflicts1003 = detectConflicts(rec1003);
assert.ok(conflicts1003.some(c => c.field === 'dateOfBirth' && c.severity === 'high'));

console.log('PASS: scholarship regression, residence mismatch, and generalized 7-service eligibility, conflict detection, and age validation.');
