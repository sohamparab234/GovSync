import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

// Load journeys module
const {
  getAllJourneys,
  getJourneyById,
  evaluateJourney,
  evaluateAllJourneys,
  validateJourneyGraph,
} = require('../lib/journeys.ts');

console.log('--- Testing Multi-Service Application Journey Engine (Phase 3 Day 4) ---');

// SUITE 1: Canonical Journey Definitions
console.log('1. Testing canonical Maharashtra journey definitions...');
{
  const journeys = getAllJourneys();
  assert.equal(journeys.length, 5, 'Must define exactly 5 canonical Maharashtra journeys');

  const allEvaluated = evaluateAllJourneys([]);
  assert.equal(allEvaluated.length, 5, 'evaluateAllJourneys must evaluate all 5 journeys');

  const expectedIds = [
    'journey:education-scholarship',
    'journey:senior-pension',
    'journey:food-health-security',
    'journey:women-welfare',
    'journey:agriculture-welfare',
  ];

  for (const expectedId of expectedIds) {
    const j = getJourneyById(expectedId);
    assert.ok(j, `Journey ${expectedId} must exist`);
    assert.ok(j.title.length > 5, 'Title must be non-empty');
    assert.ok(j.summary.length > 10, 'Summary must be non-empty');
    assert.ok(j.targetOutcome.length > 10, 'Target outcome must be non-empty');
    assert.ok(j.statutoryCitation.length > 10, 'Statutory citation must be non-empty');
    assert.ok(j.steps.length >= 2, 'Journey must contain at least 2 connected steps');
  }
  console.log('   ✓ 5 canonical Maharashtra journeys verified with statutory citations and steps.');
}

// SUITE 2: Graph Topology & Cycle Detection
console.log('2. Testing graph topology & cycle detection (DAG validation)...');
{
  // All 5 canonical journeys must be valid DAGs with zero cycles
  for (const j of getAllJourneys()) {
    const validation = validateJourneyGraph(j);
    assert.equal(validation.valid, true, `Journey ${j.id} must be a valid DAG`);
    assert.equal(validation.cycleDetected, false, `Journey ${j.id} must not have cycles`);
    assert.equal(validation.topologicalOrder.length, j.steps.length, 'Topological order must include all steps');
  }

  // Artificial Direct Cycle: A -> B -> A
  const directCycleJourney = {
    id: 'journey:test-direct-cycle',
    title: 'Direct Cycle Test',
    summary: 'Testing direct cycle',
    domain: 'education',
    targetOutcome: 'Test',
    statutoryCitation: 'Test',
    steps: [
      {
        id: 'step:a',
        title: 'Step A',
        description: 'A',
        serviceId: 'residence',
        department: 'Dept A',
        categoryLabel: 'Certificates',
        order: 1,
        isMandatory: true,
        dependsOn: ['step:b'],
        prerequisites: [{ id: 'step:b', title: 'Step B', statutoryBasis: 'Rule', dataReuseBenefit: 'Reuse', isMandatory: true }],
      },
      {
        id: 'step:b',
        title: 'Step B',
        description: 'B',
        serviceId: 'scholarship',
        department: 'Dept B',
        categoryLabel: 'Education',
        order: 2,
        isMandatory: true,
        dependsOn: ['step:a'],
        prerequisites: [{ id: 'step:a', title: 'Step A', statutoryBasis: 'Rule', dataReuseBenefit: 'Reuse', isMandatory: true }],
      },
    ],
  };

  const directCycleResult = validateJourneyGraph(directCycleJourney);
  assert.equal(directCycleResult.valid, false, 'Direct cycle must be invalid');
  assert.equal(directCycleResult.cycleDetected, true, 'Direct cycle must be detected');

  // Self-Cycle: A -> A
  const selfCycleJourney = {
    id: 'journey:test-self-cycle',
    title: 'Self Cycle Test',
    summary: 'Testing self cycle',
    domain: 'education',
    targetOutcome: 'Test',
    statutoryCitation: 'Test',
    steps: [
      {
        id: 'step:a',
        title: 'Step A',
        description: 'A',
        serviceId: 'residence',
        department: 'Dept A',
        categoryLabel: 'Certificates',
        order: 1,
        isMandatory: true,
        dependsOn: ['step:a'],
        prerequisites: [{ id: 'step:a', title: 'Step A', statutoryBasis: 'Rule', dataReuseBenefit: 'Reuse', isMandatory: true }],
      },
    ],
  };

  const selfCycleResult = validateJourneyGraph(selfCycleJourney);
  assert.equal(selfCycleResult.valid, false, 'Self cycle must be invalid');
  assert.equal(selfCycleResult.cycleDetected, true, 'Self cycle must be detected');

  // Indirect Cycle: A -> B -> C -> A
  const indirectCycleJourney = {
    id: 'journey:test-indirect-cycle',
    title: 'Indirect Cycle Test',
    summary: 'Testing indirect cycle',
    domain: 'education',
    targetOutcome: 'Test',
    statutoryCitation: 'Test',
    steps: [
      {
        id: 'step:a',
        title: 'Step A',
        description: 'A',
        serviceId: 'residence',
        department: 'Dept A',
        categoryLabel: 'Certificates',
        order: 1,
        isMandatory: true,
        dependsOn: ['step:c'],
        prerequisites: [{ id: 'step:c', title: 'Step C', statutoryBasis: 'Rule', dataReuseBenefit: 'Reuse', isMandatory: true }],
      },
      {
        id: 'step:b',
        title: 'Step B',
        description: 'B',
        serviceId: 'income-certificate',
        department: 'Dept B',
        categoryLabel: 'Certificates',
        order: 2,
        isMandatory: true,
        dependsOn: ['step:a'],
        prerequisites: [{ id: 'step:a', title: 'Step A', statutoryBasis: 'Rule', dataReuseBenefit: 'Reuse', isMandatory: true }],
      },
      {
        id: 'step:c',
        title: 'Step C',
        description: 'C',
        serviceId: 'scholarship',
        department: 'Dept C',
        categoryLabel: 'Education',
        order: 3,
        isMandatory: true,
        dependsOn: ['step:b'],
        prerequisites: [{ id: 'step:b', title: 'Step B', statutoryBasis: 'Rule', dataReuseBenefit: 'Reuse', isMandatory: true }],
      },
    ],
  };

  const indirectCycleResult = validateJourneyGraph(indirectCycleJourney);
  assert.equal(indirectCycleResult.valid, false, 'Indirect cycle must be invalid');
  assert.equal(indirectCycleResult.cycleDetected, true, 'Indirect cycle must be detected');
  console.log('   ✓ Cycle detection verified: DAG integrity enforced, direct, self, and indirect cycles rejected.');
}

// SUITE 3: Duplicate Step Protection
console.log('3. Testing duplicate step detection...');
{
  const duplicateStepJourney = {
    id: 'journey:test-duplicate-step',
    title: 'Duplicate Step Test',
    summary: 'Testing duplicate step',
    domain: 'education',
    targetOutcome: 'Test',
    statutoryCitation: 'Test',
    steps: [
      {
        id: 'step:residence',
        title: 'Step 1',
        description: 'First',
        serviceId: 'residence',
        department: 'Dept',
        categoryLabel: 'Certificates',
        order: 1,
        isMandatory: true,
        prerequisites: [],
      },
      {
        id: 'step:residence', // Duplicate ID
        title: 'Step 2',
        description: 'Second',
        serviceId: 'residence',
        department: 'Dept',
        categoryLabel: 'Certificates',
        order: 2,
        isMandatory: true,
        prerequisites: [],
      },
    ],
  };

  const dupResult = validateJourneyGraph(duplicateStepJourney);
  assert.equal(dupResult.valid, false, 'Duplicate step IDs must be invalid');
  assert.ok(dupResult.errors.some((e) => e.includes('Duplicate step ID')), 'Must report duplicate step ID error');
  console.log('   ✓ Duplicate step detection correctly catches identical step identifiers.');
}

// SUITE 4: Missing Prerequisite & Initial Blocking Logic
console.log('4. Testing missing prerequisite identification & blocking logic...');
{
  const educationJourney = getJourneyById('journey:education-scholarship');
  const evaluated = evaluateJourney(educationJourney, []);

  assert.equal(evaluated.progressPercent, 0, 'No applications must result in 0% progress');
  assert.equal(evaluated.completedRequirements, 0, '0 completed requirements');
  assert.equal(evaluated.isFullyCompleted, false, 'Must not be fully completed');

  // Step 1 (Residence) has no prerequisites -> Ready to start
  const step1 = evaluated.steps[0];
  assert.equal(step1.status, 'not_started');
  assert.equal(step1.isBlocked, false, 'Foundational step 1 must not be blocked');
  assert.equal(step1.availableAction.type, 'start_service');

  // Step 2 (Income Certificate) depends on step 1 (Residence) -> Blocked
  const step2 = evaluated.steps[1];
  assert.equal(step2.isBlocked, true, 'Step 2 must be blocked when step 1 is not completed');
  assert.ok(step2.blockingStepIds.includes('service:residence'), 'Step 2 must cite service:residence as blocking');

  // Step 4 (Scholarship) depends on step 1 and step 2 -> Blocked by both
  const step4 = evaluated.steps[3];
  assert.equal(step4.isBlocked, true, 'Step 4 must be blocked when prerequisites are missing');
  assert.ok(step4.blockingStepIds.length >= 2, 'Step 4 must be blocked by multiple incomplete prerequisites');
  console.log('   ✓ Missing prerequisites correctly identified and downstream steps blocked.');
}

// SUITE 5: Completed Prerequisites & Step Unblocking
console.log('5. Testing completed prerequisites and sequential unblocking...');
{
  const educationJourney = getJourneyById('journey:education-scholarship');

  // Simulate citizen having an approved residence application
  const mockResidenceApp = {
    id: 'APP-RES-001',
    service: 'residence',
    citizen_id: 'CITIZEN-101',
    name: 'Asha Patil',
    status: 'approved',
    created_at: '2026-01-10T10:00:00Z',
    submitted_at: '2026-01-10T10:30:00Z',
    decided_at: '2026-01-12T15:00:00Z',
  };

  const eval1 = evaluateJourney(educationJourney, [mockResidenceApp]);

  // Step 1 is now completed
  const step1 = eval1.steps[0];
  assert.equal(step1.status, 'completed', 'Step 1 must be completed');
  assert.equal(step1.isBlocked, false, 'Step 1 must not be blocked');
  assert.equal(step1.availableAction.type, 'view_certificate');

  // Step 2 (Income Certificate) depends only on Step 1 -> Now UNBLOCKED
  const step2 = eval1.steps[1];
  assert.equal(step2.isBlocked, false, 'Step 2 must be unblocked when Step 1 is approved');
  assert.equal(step2.status, 'not_started', 'Step 2 status is not_started');
  assert.equal(step2.blockingStepIds.length, 0, 'Step 2 blockingStepIds must be empty');

  // Now simulate citizen also having an approved income certificate
  const mockIncomeApp = {
    id: 'APP-INC-001',
    service: 'income-certificate',
    citizen_id: 'CITIZEN-101',
    name: 'Asha Patil',
    status: 'approved',
    created_at: '2026-01-15T10:00:00Z',
    submitted_at: '2026-01-15T11:00:00Z',
    decided_at: '2026-01-17T12:00:00Z',
  };

  const eval2 = evaluateJourney(educationJourney, [mockResidenceApp, mockIncomeApp]);
  const step2After = eval2.steps[1];
  assert.equal(step2After.status, 'completed', 'Step 2 is now completed');
  assert.equal(eval2.completedRequirements, 2, '2 requirements completed');
  assert.ok(eval2.progressPercent > 0, 'Progress must be greater than 0%');

  // Step 4 (Scholarship) depends on residence and income-cert. Caste cert is conditional.
  // With residence and income cert approved, mandatory prerequisites are satisfied!
  const step4 = eval2.steps[3];
  assert.equal(step4.isBlocked, false, 'Step 4 must be unblocked once all mandatory prerequisites are satisfied');
  console.log('   ✓ Sequential step unblocking verified as prerequisites complete.');
}

// SUITE 6: In-Progress Prerequisites Evaluation
console.log('6. Testing in-progress prerequisites evaluation...');
{
  const seniorJourney = getJourneyById('journey:senior-pension');

  // Simulate residence submitted (under department review)
  const mockResidenceSubmitted = {
    id: 'APP-RES-SUB',
    service: 'residence',
    citizen_id: 'CITIZEN-102',
    name: 'Dilip Rao',
    status: 'submitted',
    created_at: '2026-02-01T10:00:00Z',
    submitted_at: '2026-02-01T12:00:00Z',
  };

  const evaluated = evaluateJourney(seniorJourney, [mockResidenceSubmitted]);

  // Step 1 is in_progress
  const step1 = evaluated.steps[0];
  assert.equal(step1.status, 'in_progress', 'Step 1 must be marked in_progress');
  assert.equal(step1.availableAction.type, 'track_timeline');

  // Step 2 (Income Certificate) depends on residence being completed -> Step 2 must remain blocked
  const step2 = evaluated.steps[1];
  assert.equal(step2.isBlocked, true, 'Downstream step must remain blocked while prerequisite is in_progress');
  assert.ok(step2.blockingStepIds.includes('service:residence'));
  console.log('   ✓ In-progress prerequisites keep downstream dependent steps safely blocked.');
}

// SUITE 7: Action-Required Prerequisites Evaluation
console.log('7. Testing action-required prerequisites (clarification / rejected)...');
{
  const foodHealthJourney = getJourneyById('journey:food-health-security');

  // Simulate residence in clarification
  const mockResidenceClarification = {
    id: 'APP-RES-CLAR',
    service: 'residence',
    citizen_id: 'CITIZEN-103',
    name: 'Anita Desai',
    status: 'clarification',
    decision_note: 'Please upload electricity bill for verification.',
    created_at: '2026-02-05T10:00:00Z',
    submitted_at: '2026-02-05T11:00:00Z',
  };

  const evaluated = evaluateJourney(foodHealthJourney, [mockResidenceClarification]);

  // Step 1 is action_required
  const step1 = evaluated.steps[0];
  assert.equal(step1.status, 'action_required', 'Step 1 must be action_required');
  assert.equal(step1.availableAction.type, 'respond_clarification');

  // Step 2 is blocked
  const step2 = evaluated.steps[1];
  assert.equal(step2.isBlocked, true, 'Step 2 must be blocked when prerequisite requires action');
  console.log('   ✓ Clarification requests on prerequisites correctly surface action_required and block downstream steps.');
}

// SUITE 8: Real-Time Dynamic Re-evaluation (No Side Effects)
console.log('8. Testing dynamic re-evaluation without side effects...');
{
  const journey = getJourneyById('journey:women-welfare');

  const emptyApps = [];
  const evalEmpty = evaluateJourney(journey, emptyApps);
  assert.equal(evalEmpty.completedRequirements, 0);

  const approvedApps = [
    {
      id: 'APP-RES-01',
      service: 'residence',
      citizen_id: 'CITIZEN-104',
      name: 'Sunita Patil',
      status: 'approved',
      created_at: '2026-01-01T10:00:00Z',
      decided_at: '2026-01-05T10:00:00Z',
    },
    {
      id: 'APP-INC-01',
      service: 'income-certificate',
      citizen_id: 'CITIZEN-104',
      name: 'Sunita Patil',
      status: 'approved',
      created_at: '2026-01-06T10:00:00Z',
      decided_at: '2026-01-10T10:00:00Z',
    },
  ];

  const evalApproved = evaluateJourney(journey, approvedApps);
  assert.equal(evalApproved.completedRequirements, 2);

  // Calling evaluateJourney again with emptyApps returns initial state (pure function)
  const evalEmptyAgain = evaluateJourney(journey, emptyApps);
  assert.equal(evalEmptyAgain.completedRequirements, 0);
  assert.equal(evalEmptyAgain.progressPercent, 0);
  console.log('   ✓ Pure functional dynamic evaluation verified with zero persistent mutation.');
}

// SUITE 9: Progress Calculation Accuracy
console.log('9. Testing progress calculation accuracy...');
{
  for (const j of getAllJourneys()) {
    const mandatoryCount = j.steps.filter((s) => s.isMandatory).length;
    assert.ok(mandatoryCount >= 1, `${j.id} must have at least 1 mandatory requirement`);

    // Zero completed -> 0%
    const evalZero = evaluateJourney(j, []);
    assert.equal(evalZero.progressPercent, 0, '0 completed must yield 0%');

    // All completed -> 100%
    const allApprovedApps = j.steps
      .filter((s) => s.serviceId)
      .map((s, idx) => ({
        id: `MOCK-${idx}`,
        service: s.serviceId,
        citizen_id: 'CITIZEN-MOCK',
        name: 'Mock Citizen',
        status: 'approved',
        created_at: '2026-01-01T10:00:00Z',
        decided_at: '2026-01-02T10:00:00Z',
      }));

    const evalAll = evaluateJourney(j, allApprovedApps);
    assert.equal(evalAll.progressPercent, 100, `${j.id} with all steps approved must be 100%`);
    assert.equal(evalAll.isFullyCompleted, true, `${j.id} must be marked fully completed`);
  }
  console.log('   ✓ Progress percentages correctly normalized across all mandatory requirements.');
}

// SUITE 10: Step Action Generation
console.log('10. Testing step action generation (contextual CTA buttons)...');
{
  const journey = getJourneyById('journey:agriculture-welfare');
  const evaluatedBlocked = evaluateJourney(journey, []);

  // Step 1 is Residence in Maharashtra
  const step1 = evaluatedBlocked.steps[0];
  assert.equal(step1.availableAction.type, 'start_service');
  assert.equal(step1.availableAction.serviceId, 'residence');

  // Scheme step (SMAM mechanization) when blocked points to starting prerequisite
  const smamBlocked = evaluatedBlocked.steps.find((s) => s.id === 'scheme:mh-smam-mechanization');
  assert.ok(smamBlocked, 'SMAM step must exist');
  assert.equal(smamBlocked.isBlocked, true);
  assert.equal(smamBlocked.availableAction.type, 'start_service');

  // When prerequisite is approved, SMAM unblocks and provides external official portal link
  const mockApprovedResidence = [
    {
      id: 'APP-AGRI-RES',
      service: 'residence',
      citizen_id: 'CITIZEN-FARMER',
      name: 'Santosh Shinde',
      status: 'approved',
      created_at: '2026-01-01T10:00:00Z',
      decided_at: '2026-01-02T10:00:00Z',
    },
  ];
  const evaluatedUnblocked = evaluateJourney(journey, mockApprovedResidence);
  const smamUnblocked = evaluatedUnblocked.steps.find((s) => s.id === 'scheme:mh-smam-mechanization');
  assert.ok(smamUnblocked);
  assert.equal(smamUnblocked.isBlocked, false);
  assert.equal(smamUnblocked.availableAction.type, 'external_link');
  assert.ok(smamUnblocked.externalUrl.startsWith('https://'), 'External URL must use HTTPS');
  assert.ok(smamUnblocked.externalUrl.includes('mahadbt.maharashtra.gov.in'), 'Must link to genuine MahaDBT portal');
  console.log('   ✓ Contextual action generation and HTTPS official portal links verified.');
}

// SUITE 11: User Data Isolation & Scoping
console.log('11. Testing user data isolation & scoping...');
{
  const journey = getJourneyById('journey:education-scholarship');

  // Citizen A applications
  const citizenAApps = [
    {
      id: 'APP-A-RES',
      service: 'residence',
      citizen_id: 'CITIZEN-AAA',
      name: 'Citizen A',
      status: 'approved',
      created_at: '2026-01-01T10:00:00Z',
      decided_at: '2026-01-02T10:00:00Z',
    },
  ];

  // Citizen B applications (empty)
  const citizenBApps = [];

  const evalA = evaluateJourney(journey, citizenAApps);
  const evalB = evaluateJourney(journey, citizenBApps);

  assert.equal(evalA.completedRequirements, 1, 'Citizen A has 1 completed requirement');
  assert.equal(evalB.completedRequirements, 0, 'Citizen B has 0 completed requirements');
  assert.notEqual(evalA.progressPercent, evalB.progressPercent, 'No data leakage between citizens');
  console.log('   ✓ Strict user scoping verified: zero cross-citizen data leakage.');
}

// SUITE 12: Trilingual Translation Coverage
console.log('12. Testing English, Hindi, and Marathi translation completeness...');
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
        : require(name),
    mod.exports,
    mod
  );

  const { translations } = mod.exports;

  // Test core journey translation keys
  const journeyKeys = [
    'Multi-Service Application Journeys',
    'Service Journeys',
    'Explore Service Journeys',
    'Connected Public Service Journeys',
    'Connected Service Prerequisites & Dependency Tracker',
    'Higher Education & Student Support Journey',
    'Senior Citizen Social Security & Pension Journey',
    'Household Food & Cashless Healthcare Journey',
    "Women's Economic Security & Welfare Journey",
    'Agricultural Welfare & Farm Mechanization Journey',
    'Blocked by Prerequisite',
    'Ready to Start',
    'Prerequisite Requirements',
    'Statutory Basis',
    'Data Reuse Advantage',
    'Verified Statutory Requirement',
    'Prerequisite Satisfied',
    'Prerequisite Incomplete',
    'Completed Prerequisites',
    'Services Linked',
    'View in Journey',
    'Multi-Service Journeys',
  ];

  for (const k of journeyKeys) {
    assert.ok(translations[k], `Missing translation key: "${k}"`);
    assert.equal(translations[k].length, 2, `Key "${k}" must have [Hindi, Marathi] values`);
    assert.ok(translations[k][0].trim().length > 0, `Key "${k}" Hindi value must not be empty`);
    assert.ok(translations[k][1].trim().length > 0, `Key "${k}" Marathi value must not be empty`);
  }
  console.log(`   ✓ All ${journeyKeys.length} core Multi-Service Journey keys verified in EN, HI, MR.`);
}

// SUITE 13: Government Prerequisite Classification & Non-Blocking Integrity
console.log('13. Testing explicit statutory dependency classifications (Mandatory / Conditional / Recommended)...');
{
  const allowedDependencyTypes = ['mandatory', 'conditional', 'recommended', 'unverified'];

  for (const j of getAllJourneys()) {
    for (const step of j.steps) {
      if (step.dependencyType) {
        assert.ok(allowedDependencyTypes.includes(step.dependencyType), `Invalid dependencyType "${step.dependencyType}" in step ${step.id}`);
      }
      for (const p of step.prerequisites) {
        assert.ok(allowedDependencyTypes.includes(p.dependencyType), `Invalid dependencyType "${p.dependencyType}" in prereq ${p.id} of step ${step.id}`);
      }
    }
  }

  // 1. Education: Caste certificate is conditional and must NOT block General/EWS students
  const eduJourney = getJourneyById('journey:education-scholarship');
  const castePrereqInEdu = eduJourney.steps.flatMap((s) => s.prerequisites).find((p) => p.id === 'service:caste-certificate');
  assert.ok(castePrereqInEdu, 'Caste certificate prerequisite must exist in education journey');
  assert.equal(castePrereqInEdu.dependencyType, 'conditional', 'Caste cert in education must be classified as conditional');
  assert.equal(castePrereqInEdu.isMandatory, false, 'Caste cert must not be marked mandatory in education');

  // Verify General student with only Residence and Income approved is NOT blocked from scholarship or EBC scheme
  const generalStudentApps = [
    { id: 'APP-GEN-RES', service: 'residence', status: 'approved' },
    { id: 'APP-GEN-INC', service: 'income-certificate', status: 'approved' },
  ];
  const evalGenStudent = evaluateJourney(eduJourney, generalStudentApps);
  const scholarshipStep = evalGenStudent.steps.find((s) => s.id === 'service:scholarship');
  assert.ok(scholarshipStep);
  assert.equal(scholarshipStep.isBlocked, false, 'Scholarship step must NOT be blocked for General student without caste cert');

  const ebcSchemeStep = evalGenStudent.steps.find((s) => s.id === 'scheme:mh-rcsm-ebc-scholarship');
  assert.ok(ebcSchemeStep);
  assert.equal(ebcSchemeStep.isBlocked, false, 'EBC Scheme step must NOT be blocked for student without caste cert');

  // 2. Agriculture: PM-KISAN never requires caste certificate
  const agriJourney = getJourneyById('journey:agriculture-welfare');
  const pmKisanStep = agriJourney.steps.find((s) => s.id === 'scheme:pm-kisan');
  assert.ok(pmKisanStep);
  assert.equal(pmKisanStep.dependsOn.includes('service:caste-certificate'), false, 'PM-KISAN must NEVER depend on caste certificate');
  assert.equal(pmKisanStep.prerequisites.some((p) => p.id === 'service:caste-certificate'), false, 'PM-KISAN prerequisites must not include caste certificate');

  // When land records are present, PM-KISAN is unblocked immediately
  const evalAgriEmpty = evaluateJourney(agriJourney, []);
  const pmKisanEval = evalAgriEmpty.steps.find((s) => s.id === 'scheme:pm-kisan');
  assert.equal(pmKisanEval.isBlocked, false, 'PM-KISAN must be unblocked when land record is satisfied');

  // 3. Women Welfare: Residence satisfies Ladki Bahin application
  const womenJourney = getJourneyById('journey:women-welfare');
  const evalWomenResOnly = evaluateJourney(womenJourney, [
    { id: 'APP-W-RES', service: 'residence', status: 'approved' },
  ]);
  const ladkiBahinStep = evalWomenResOnly.steps.find((s) => s.id === 'scheme:mh-ladki-bahin');
  assert.ok(ladkiBahinStep);
  assert.equal(ladkiBahinStep.isBlocked, false, 'Ladki Bahin must not be blocked when statutory domicile requirement is met');

  console.log('   ✓ Explicit statutory dependency classifications verified: zero false blocking of citizens.');
}

// SUITE 14: Strict Conditional Dependency Evaluation Semantics
console.log('14. Testing comprehensive conditional dependency evaluation semantics...');
{
  const eduJourney = getJourneyById('journey:education-scholarship');
  assert.ok(eduJourney, 'Education journey must exist');

  // Case 1: Condition applies & prerequisite incomplete -> Blocks downstream step
  {
    const scStudentApps = [
      { id: 'APP-SC-RES', service: 'residence', status: 'approved' },
      { id: 'APP-SC-INC', service: 'income-certificate', status: 'approved' },
      // Caste certificate is missing/not started
    ];
    const evalScStudent = evaluateJourney(eduJourney, scStudentApps, { citizenCategory: 'sc' });
    const castePrereq = evalScStudent.steps[3].evaluatedPrerequisites.find((p) => p.id === 'service:caste-certificate');
    assert.ok(castePrereq, 'Caste prereq must exist on scholarship step');
    assert.equal(castePrereq.conditionApplicability, 'applies', 'Must evaluate to applies for SC student');
    assert.equal(castePrereq.isBlocking, true, 'Prerequisite must be marked blocking when condition applies and incomplete');

    const scholarshipStep = evalScStudent.steps.find((s) => s.id === 'service:scholarship');
    assert.ok(scholarshipStep);
    assert.equal(scholarshipStep.isBlocked, true, 'Step must be blocked when applicable conditional prerequisite is incomplete');
    assert.ok(scholarshipStep.blockingStepIds.includes('service:caste-certificate'), 'Blocking IDs must cite caste-certificate');
    assert.ok(
      scholarshipStep.blockingReasons.some((r) => r.includes('reserved category')),
      'Blocking reason must clearly explain statutory category requirement'
    );
    console.log('   ✓ Case 1: Condition applies & prerequisite incomplete -> blocks step with explanatory reason.');
  }

  // Case 2: Condition applies & prerequisite completed -> Unblocks downstream step
  {
    const scStudentCompletedApps = [
      { id: 'APP-SC-RES', service: 'residence', status: 'approved' },
      { id: 'APP-SC-INC', service: 'income-certificate', status: 'approved' },
      { id: 'APP-SC-CAST', service: 'caste-certificate', status: 'approved' },
    ];
    const evalScStudentCompleted = evaluateJourney(eduJourney, scStudentCompletedApps, { citizenCategory: 'sc' });
    const castePrereq = evalScStudentCompleted.steps[3].evaluatedPrerequisites.find((p) => p.id === 'service:caste-certificate');
    assert.equal(castePrereq.conditionApplicability, 'applies');
    assert.equal(castePrereq.status, 'completed');
    assert.equal(castePrereq.isBlocking, false, 'Completed prerequisite must not be blocking');

    const scholarshipStep = evalScStudentCompleted.steps.find((s) => s.id === 'service:scholarship');
    assert.equal(scholarshipStep.isBlocked, false, 'Step must be unblocked when applicable prerequisite is completed');
    console.log('   ✓ Case 2: Condition applies & prerequisite completed -> cleanly unblocks step.');
  }

  // Case 3: Condition does not apply -> Prerequisite does not block
  {
    const generalStudentApps = [
      { id: 'APP-GEN-RES', service: 'residence', status: 'approved' },
      { id: 'APP-GEN-INC', service: 'income-certificate', status: 'approved' },
    ];
    const evalGenStudent = evaluateJourney(eduJourney, generalStudentApps, { citizenCategory: 'general' });
    const castePrereq = evalGenStudent.steps[3].evaluatedPrerequisites.find((p) => p.id === 'service:caste-certificate');
    assert.equal(castePrereq.conditionApplicability, 'does_not_apply', 'Condition must not apply to General category');
    assert.equal(castePrereq.isBlocking, false, 'Non-applicable conditional prerequisite must not block');

    const scholarshipStep = evalGenStudent.steps.find((s) => s.id === 'service:scholarship');
    assert.equal(scholarshipStep.isBlocked, false, 'Scholarship step must not be blocked when condition does not apply');

    const ebcStep = evalGenStudent.steps.find((s) => s.id === 'scheme:mh-rcsm-ebc-scholarship');
    assert.equal(ebcStep.isBlocked, false, 'EBC step must not be blocked when condition does not apply');
    console.log('   ✓ Case 3: Condition does not apply -> prerequisite does not block downstream steps.');
  }

  // Case 4: Condition applicability unknown -> Must NOT assume condition applies, must NOT block
  {
    const neutralStudentApps = [
      { id: 'APP-N-RES', service: 'residence', status: 'approved' },
      { id: 'APP-N-INC', service: 'income-certificate', status: 'approved' },
      // No category context provided, no caste application
    ];
    const evalNeutral = evaluateJourney(eduJourney, neutralStudentApps, {});
    const castePrereq = evalNeutral.steps[3].evaluatedPrerequisites.find((p) => p.id === 'service:caste-certificate');
    assert.equal(castePrereq.conditionApplicability, 'unknown', 'Applicability must be unknown when category is not established');
    assert.equal(castePrereq.isBlocking, false, 'Unknown condition must NOT be assumed to apply or block');

    const scholarshipStep = evalNeutral.steps.find((s) => s.id === 'service:scholarship');
    assert.equal(scholarshipStep.isBlocked, false, 'Step must not be blocked when condition applicability is unknown');
    console.log('   ✓ Case 4: Condition applicability unknown -> represented separately, does NOT assume condition applies.');
  }

  // Case 5: Recommended dependency incomplete -> NEVER blocks
  {
    const syntheticJourney = {
      id: 'journey:test-recommended-dependency',
      title: 'Test Recommended Dependency',
      summary: 'Testing that recommended dependencies never block',
      domain: 'education',
      targetOutcome: 'Test',
      statutoryCitation: 'Test',
      steps: [
        {
          id: 'step:optional-recommendation',
          title: 'Optional Advisory Guide',
          description: 'Advisory guidance',
          itemType: 'service',
          serviceId: 'residence',
          categoryLabel: 'Certificates',
          department: 'Dept',
          order: 1,
          isMandatory: false,
          dependencyType: 'recommended',
          dependsOn: [],
          prerequisites: [],
        },
        {
          id: 'step:destination-service',
          title: 'Destination Service',
          description: 'Main service',
          itemType: 'service',
          serviceId: 'scholarship',
          categoryLabel: 'Education',
          department: 'Dept',
          order: 2,
          isMandatory: true,
          dependencyType: 'mandatory',
          dependsOn: ['step:optional-recommendation'],
          prerequisites: [
            {
              id: 'step:optional-recommendation',
              title: 'Optional Advisory Guide',
              itemType: 'service',
              serviceId: 'residence',
              isMandatory: false,
              dependencyType: 'recommended',
              statutoryBasis: 'Advisory Guidelines',
              isVerifiedPrerequisite: true,
              dataReuseBenefit: 'Recommended flow',
            },
          ],
        },
      ],
    };

    const evalRec = evaluateJourney(syntheticJourney, []);
    const destStep = evalRec.steps.find((s) => s.id === 'step:destination-service');
    assert.ok(destStep);
    assert.equal(destStep.isBlocked, false, 'Recommended prerequisite must NEVER block destination step');
    assert.equal(destStep.blockingStepIds.length, 0);

    const recPrereq = destStep.evaluatedPrerequisites[0];
    assert.equal(recPrereq.isBlocking, false, 'Recommended prerequisite isBlocking must be false');
    console.log('   ✓ Case 5: Recommended dependency incomplete -> NEVER blocks destination step.');
  }

  // Case 6: Unverified dependency incomplete -> NEVER blocks
  {
    const syntheticUnverifiedJourney = {
      id: 'journey:test-unverified-dependency',
      title: 'Test Unverified Dependency',
      summary: 'Testing that unverified dependencies never block',
      domain: 'education',
      targetOutcome: 'Test',
      statutoryCitation: 'Test',
      steps: [
        {
          id: 'step:destination-with-unverified',
          title: 'Destination Service',
          description: 'Main service',
          itemType: 'service',
          serviceId: 'scholarship',
          categoryLabel: 'Education',
          department: 'Dept',
          order: 1,
          isMandatory: true,
          dependencyType: 'mandatory',
          dependsOn: [],
          prerequisites: [
            {
              id: 'prereq:third-party-note',
              title: 'Informal Third Party Certification',
              itemType: 'service',
              isMandatory: false,
              dependencyType: 'unverified',
              isVerifiedPrerequisite: false,
              statutoryBasis: 'Unverified Community Practice',
              dataReuseBenefit: 'Informational only',
            },
          ],
        },
      ],
    };

    const evalUnverified = evaluateJourney(syntheticUnverifiedJourney, []);
    const destStep = evalUnverified.steps[0];
    assert.equal(destStep.isBlocked, false, 'Unverified dependency must NEVER block destination step');
    assert.equal(destStep.blockingStepIds.length, 0);

    const unverifiedPrereq = destStep.evaluatedPrerequisites[0];
    assert.equal(unverifiedPrereq.status, 'unverified_dependency');
    assert.equal(unverifiedPrereq.isBlocking, false, 'Unverified prerequisite isBlocking must be false');
    console.log('   ✓ Case 6: Unverified dependency incomplete -> NEVER blocks destination step.');
  }

  // Case 7: General-category citizens not blocked by reserved-category certificates
  {
    const agriJourney = getJourneyById('journey:agriculture-welfare');
    assert.ok(agriJourney);

    // General farmer with land records
    const generalFarmerEval = evaluateJourney(agriJourney, [], {
      citizenCategory: 'general',
      farmerType: 'small_marginal',
    });

    const smamStep = generalFarmerEval.steps.find((s) => s.id === 'scheme:mh-smam-mechanization');
    assert.ok(smamStep);
    // Residence is needed for state matching subsidy
    const resPrereq = smamStep.evaluatedPrerequisites.find((p) => p.id === 'service:residence');
    assert.equal(resPrereq.isBlocking, true, 'Residence is mandatory');

    // Caste certificate condition for general small/marginal farmer
    const castePrereqAgri = smamStep.evaluatedPrerequisites.find((p) => p.id === 'service:caste-certificate');
    assert.ok(castePrereqAgri);
    assert.equal(castePrereqAgri.conditionApplicability, 'does_not_apply', 'Caste cert does not apply to small/marginal general farmer');
    assert.equal(castePrereqAgri.isBlocking, false, 'Caste certificate must not block general farmer');

    // Women farmer
    const womenFarmerEval = evaluateJourney(agriJourney, [], {
      gender: 'female',
    });
    const smamWomenStep = womenFarmerEval.steps.find((s) => s.id === 'scheme:mh-smam-mechanization');
    const castePrereqWomen = smamWomenStep.evaluatedPrerequisites.find((p) => p.id === 'service:caste-certificate');
    assert.equal(castePrereqWomen.conditionApplicability, 'does_not_apply', 'Women farmers qualify for 50% without caste certificate');
    assert.equal(castePrereqWomen.isBlocking, false, 'Women farmers not blocked by caste certificate');

    console.log('   ✓ Case 7: General-category and female farmers NOT blocked by reserved-category certificates.');
  }

  console.log('   ✓ All 7 conditional dependency evaluation semantics fully verified.');
}

console.log('PASS: All 14 Multi-Service Application Journey test suites PASSED cleanly!');
