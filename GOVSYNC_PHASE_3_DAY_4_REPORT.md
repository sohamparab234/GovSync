# GOVSYNC PHASE 3 — DAY 4 IMPLEMENTATION REPORT
## Multi-Service Application Journey Engine & Sequential Prerequisite Tracking

- **Date:** November 21, 2026
- **Repository:** `sohamparab234/GovSync`
- **Local Path:** `D:\My Projects\GovSync`
- **Branch:** `main`
- **Base Commit:** `4012ced9c537b5c7fd2a4d3d7fb14e8de34d49ae` (`feat(govsync): add smart service recommendation engine`)
- **Reference Repo Status:** `D:\My Projects\Demo` untouched (Clean, Branch `main`)
- **Status:** READY FOR AUTHORIZATION TO COMMIT AND PUSH (Final correction pass complete; no unapproved push or commit)

---

## 1. Executive Summary

Phase 3, Day 4 of GovSync implements the **Multi-Service Application Journey Engine**. Public welfare schemes and benefits in Maharashtra rarely operate in isolation; citizens seeking college fee reimbursements, senior pensions, food security, or agricultural machinery subsidies must satisfy an ordered chain of prerequisite certificates across disparate revenue, social justice, food, and agriculture departments.

Day 4 addresses this structural challenge through:
1. **5 Canonical Maharashtra Journeys** grounded in verified Government Resolutions (GRs) and statutory rules.
2. **Explicit 4-Level Statutory Prerequisite Classification (`mandatory`, `conditional`, `recommended`, `unverified`)** with precise blocking semantics:
   - `mandatory`: blocks downstream step when incomplete (`status !== 'completed'`).
   - `conditional`: blocks ONLY when its applicable condition is positively established (`conditionApplicability === 'applies'`) AND the requirement is incomplete.
   - `recommended`: NEVER blocks downstream steps.
   - `unverified`: NEVER blocks downstream steps.
   - Unknown applicability (`'unknown'`) is represented separately and does NOT assume the condition applies.
3. **Evidence Metadata on Every Prerequisite:** All 5 journeys include `sourceTitle`, `officialUrl`, `requirementSupported`, `classification`, `appliesWhen`, `verificationStatus`, and `relevantClause`.
4. **Accurate Statutory Agricultural Representation (SMAM & PM-KISAN):**
   - Correctly reflects Central SMAM 2024 Guidelines (`https://agrimachinery.nic.in/Files/Guidelines/Guidelines_SMAM2024.pdf` Annexure-II): 50% capital subsidy applies to Small & Marginal farmers (<= 2 ha), Women farmers, SC/ST farmers, and NE/Himalayan regions. General farmers receive 40%. A caste certificate is required strictly for SC/ST specific funds, NOT as the sole way to qualify for 50%.
   - Universal nature of PM-KISAN (`https://pmkisan.gov.in/Documents_New/Revised_Operational_Guidelines_09112020.pdf` Clause 4.1 & Clause 8.1): Caste certificate is NEVER required.
   - Maharashtra MahaDBT implementation documented separately (`https://mahadbt.maharashtra.gov.in/farmer/`).
5. **Topological Graph Validation (`validateJourneyGraph`)** employing Kahn's algorithm for DAG validation, duplicate step detection, and cycle rejection.
6. **Dynamic Pure In-Memory Prerequisite Evaluation (`evaluateJourney`)** without persistent schema mutations or cross-citizen data leakage.
7. **Standalone Public Route (`/journeys`)** accessible without login, with government masthead, text resize controls, skip-links, and domain filtering.
8. **Seamless Citizen Workspace Integration** with dashboard journey banner, 5th Quick Action card, and application card links.
9. **Full Trilingual Localization** in English, Hindi, and Marathi across 1,455 translation pairs.

---

## 2. Canonical Maharashtra Journey Definitions & Evidence Metadata

### Journey 1: Higher Education & Student Support Journey (`journey:education-scholarship`)
- **Domain:** Higher & Technical Education / Social Welfare
- **Target Outcome:** Full college fee reimbursement, academic merit verification, and monthly student DBT disbursement.
- **Statutory Citations:** Maharashtra Higher & Technical Education GR No. EBC-2016/C.R.221/Edu-1; Maharashtra Act No. XXIII of 2001; MahaDBT Post-Matric Scholarship Rules.
- **Sequential Stepper Flow & Dependency Types:**
  1. `service:residence` — Certificate of Residence / Domicile (`mandatory`, isMandatory: true)
     * *Evidence:* Maharashtra Scheduled Castes & Revenue Rules (`https://sjsa.maharashtra.gov.in`, verified official).
  2. `service:income-certificate` — Annual Family Income Certificate (`mandatory`, isMandatory: true, dependsOn: Residence)
     * *Evidence:* GR No. EBC-2016/C.R.221/Edu-1 Clause 2.4 (`https://mahadbt.maharashtra.gov.in`).
  3. `service:caste-certificate` — Caste / Community Certificate (`conditional`, isMandatory: false, dependsOn: Residence)
     * *Evidence:* Maharashtra Act No. XXIII of 2001 Section 3 & 4 (`https://sjsa.maharashtra.gov.in`).
     * *Condition Note:* Required ONLY for SC, ST, OBC, VJNT, and SBC category students seeking reserved quota scholarships. General and EWS students do NOT require a caste certificate.
  4. `service:scholarship` — Post-Matric Scholarship Application (`mandatory`, isMandatory: true, dependsOn: Residence, Income, Caste [conditional])
     * *Semantics:* When applicant is SC/ST/OBC/VJNT/SBC, caste certificate is required and blocks if missing. When applicant is General/EWS, caste certificate condition evaluates to `does_not_apply` and never blocks.
  5. `scheme:mh-rcsm-ebc-scholarship` — Rajarshi Chhatrapati Shahu Maharaj EBC Scholarship (`recommended`, isMandatory: false, dependsOn: Residence, Income)
     * *Semantics:* Strictly for Economically Backward Class (General/Open). Never requires or depends on a caste certificate.

### Journey 2: Senior Citizen Social Security & Pension Journey (`journey:senior-pension`)
- **Domain:** Social Justice & Special Assistance
- **Target Outcome:** Monthly direct benefit transfer of ₹1,500 state social security pension for eligible senior citizens.
- **Statutory Citations:** Social Justice & Special Assistance Department State Pension Rules 2019 & Shravanbal Seva Guidelines (GR PEN-2019/C.R.44).
- **Sequential Stepper Flow & Dependency Types:**
  1. `service:residence` — Certificate of Residence / Domicile (`mandatory`, isMandatory: true, 15-year state residence verification)
  2. `service:income-certificate` — Income Certificate (`mandatory`, isMandatory: true, annual family income < ₹21,000)
  3. `service:pension` — Old Age Social Security Pension (`mandatory`, isMandatory: true, dependsOn: Residence + Income)
  4. `scheme:mh-shravanbal-pension` — Shravanbal Seva State Pension Scheme (`recommended`, isMandatory: false, dependsOn: Residence + Income)

### Journey 3: Household Food & Cashless Healthcare Journey (`journey:food-health-security`)
- **Domain:** Food, Civil Supplies & Public Health
- **Target Outcome:** Subsidized household food grains under NFSA and ₹5 Lakh annual cashless healthcare coverage under MJPJAY.
- **Statutory Citations:** National Food Security Act (NFSA 2013) & State Health Assurance Society (SHAS) Resolution 2023 for MJPJAY.
- **Sequential Stepper Flow & Dependency Types:**
  1. `service:residence` — Certificate of Residence / Domicile (`mandatory`, isMandatory: true)
  2. `service:income-certificate` — Income Certificate (`mandatory`, isMandatory: true, determines Yellow/Orange ration card slab)
  3. `service:ration-card` — Subsidized Digital Ration Card (`mandatory`, isMandatory: true, dependsOn: Residence + Income)
  4. `scheme:mh-mjpjay-pmjay` — Ayushman Bharat - MJPJAY Cashless Health Insurance (`recommended`, isMandatory: false, dependsOn: Ration Card)

### Journey 4: Women's Economic Security & Welfare Journey (`journey:women-welfare`)
- **Domain:** Women & Child Development
- **Target Outcome:** Monthly financial assistance of ₹1,500 under Mukhyamantri Majhi Ladki Bahin Yojana.
- **Statutory Citations:** Women and Child Development Department GR No. MKB-2024/C.R.108/WCD-2 dated 28 June 2024 & amended 03 July 2024.
- **Sequential Stepper Flow & Dependency Types:**
  1. `service:residence` — Certificate of Residence / Domicile (`mandatory`, isMandatory: true, Rule 3(b) permanent state domicile mandate)
  2. `service:income-certificate` — Income Certificate (`conditional`, isMandatory: true, dependsOn: Residence)
     * *Condition Note & Exemption:* Under GR MKB-2024/C.R.108/WCD-2 Clause 3(e), families holding a valid Yellow or Orange Ration Card are completely EXEMPT from providing an income certificate.
  3. `scheme:mh-ladki-bahin` — Mukhyamantri Majhi Ladki Bahin Yojana (`recommended`, isMandatory: false, dependsOn: Residence, Income [conditional])
     * *Semantics:* When family holds Yellow/Orange card, income certificate condition evaluates to `does_not_apply` and does not block. When family has white card / no card, income certificate is required and blocks until satisfied. When unknown, does not assume condition applies.

### Journey 5: Agricultural Welfare & Farm Mechanization Journey (`journey:agriculture-welfare`)
- **Domain:** Agriculture & Farmers Welfare
- **Target Outcome:** Annual direct benefit of ₹6,000 cash subsidy and up to 50% capital subsidy on farm implements and tractors.
- **Statutory Citations:** Sub-Mission on Agricultural Mechanization (SMAM) Operational Guidelines (Revised 2024, GoI); Maharashtra State Agriculture Dept MahaDBT Implementation; PM-KISAN Operational Guidelines.
- **Sequential Stepper Flow & Dependency Types:**
  1. `service:residence` — Certificate of Residence / Domicile (`mandatory`, isMandatory: true, required for state matching grants)
  2. `external_document:land_records` — Agricultural Land Records: 7/12 & 8A Extract (`mandatory`, isMandatory: false as in-app form, auto-verified in Land Registry)
  3. `service:caste-certificate` — Caste / Community Certificate (`conditional`, isMandatory: false, dependsOn: Residence)
     * *Official Evidence:* SMAM Guidelines 2024 Annexure-II (`https://agrimachinery.nic.in/Files/Guidelines/Guidelines_SMAM2024.pdf`).
     * *Condition Note:* Relevant ONLY for SC/ST category farmers seeking fund allocation under SC/ST specific quotas. Under SMAM 2024 Guidelines, the 50% assistance slab applies to: 1) Small & Marginal farmers (<= 2 ha landholding), 2) Women farmers, 3) SC/ST farmers, and 4) Beneficiaries in NE/Himalayan states. Small/marginal farmers qualify based on 7/12 land records and women farmers qualify based on gender/identity without a caste certificate. Other eligible farmers receive 40% assistance. A caste certificate is NEVER required for PM-KISAN.
  4. `scheme:pm-kisan` — PM-KISAN Samman Nidhi (`recommended`, isMandatory: false, dependsOn: Land Records)
     * *Official Evidence:* PM-KISAN Guidelines Clause 4.1 & Clause 8.1 (`https://pmkisan.gov.in/Documents_New/Revised_Operational_Guidelines_09112020.pdf`). Universal for all landholding farmers; caste certificate is NEVER required.
  5. `scheme:mh-smam-mechanization` — Sub-Mission on Agricultural Mechanization (`recommended`, isMandatory: false, dependsOn: Residence, Land Records, Caste [conditional])
     * *Semantics:* For General, Small/Marginal, and Women farmers, caste certificate evaluates to `does_not_apply` and never blocks. For SC/ST farmers, caste certificate evaluates to `applies` for the SC/ST specific fund allocation.

---

## 3. Strict 4-Level Conditional Dependency Evaluation Semantics

Implemented in `lib/journeys.ts` via `evaluateConditionApplicability` and `evaluateJourney`:

```typescript
// Dependency classification blocking rules:
// - mandatory: blocks when incomplete (status !== 'completed').
// - conditional: blocks ONLY when condition positively applies AND incomplete.
// - recommended / unverified: NEVER blocks.
// - unknown condition: does NOT assume condition applies, does NOT block.
```

### Comprehensive Unit Test Matrix (Suite 14 in `scripts/test-journeys.mjs`):
1. **Condition applies & prereq incomplete:** SC student without caste certificate -> Step is blocked with explanatory reason citing reserved category fee concession requirements under Maharashtra Act XXIII of 2001 (`PASS`).
2. **Condition applies & prereq completed:** SC student with approved caste certificate -> Step cleanly unblocked (`PASS`).
3. **Condition does not apply:** General student without caste certificate -> Condition evaluates to `does_not_apply` (Exempt); Scholarship and EBC Scheme steps are NOT blocked (`PASS`).
4. **Condition applicability unknown:** Citizen with unestablished category -> Condition evaluates to `unknown`; system does NOT assume condition applies, step is NOT blocked (`PASS`).
5. **Recommended dependency incomplete:** Step depending on recommended advisory guide -> Destination step is NEVER blocked (`PASS`).
6. **Unverified dependency incomplete:** Step with unverified community note -> Step is NEVER blocked (`PASS`).
7. **General-category & female farmers not blocked:** Small/marginal general farmers and women farmers evaluating SMAM -> Caste certificate condition evaluates to `does_not_apply`; farmers qualify for 50% subsidy without caste certificate (`PASS`).

---

## 4. Full Quality & Regression Verification Results

| Test Suite | Description | Result | Details |
|---|---|---|---|
| `scripts/test-journeys.mjs` | Multi-Service Journey Engine & Semantics | **PASS** | 14 test suites, 0 errors. DAG validation, cycle detection, sequential unblocking, and all 7 conditional semantics verified. |
| `scripts/test-browser-journeys.mjs` | Headless Chrome Browser Verification | **PASS** | Public route `/journeys`, domain filtering (Women Welfare), 4 responsive viewports (1280px, 768px, 375px, 320px with 0px overflow), trilingual switching (EN, HI, MR), and citizen dashboard integration. 0 console errors. |
| `scripts/test-recommendations.mjs` | Smart Service Recommendation Engine | **PASS** | 14 test suites. Strong/partial matches, deterministic scoring, transparency invariants, and i18n coverage. |
| `scripts/test-schemes.mjs` | Smart Government Scheme Finder | **PASS** | 978 assertions verified. 10 schemes across 8 categories, boundary rules, and HTTPS URL hygiene. |
| `scripts/test-i18n.mjs` | Trilingual Dictionary & AST Validation | **PASS** | 1,455 translation pairs. 100% Devanagari coverage across English, Hindi, and Marathi. |
| `scripts/test-dashboard.mjs` | Unified Citizen Dashboard Unit & Auth | **PASS** | Stage calculations, taxonomy integrity, sorting, and database-level bidirectional security isolation. |
| `scripts/test-residence.mjs` | Residence Service Integration | **PASS** | 57 HTTP assertions covering review, clarification, approval, and certificate reuse. |
| `scripts/test-auth-flow.mjs` | Authentication & Security Invariants | **PASS** | 60 HTTP checks covering roles, CSRF, forged-header rejection, and cookie security. |
| `scripts/test-api.mjs` | API Contracts & Eligibility Rules | **PASS** | 39 HTTP assertions covering consent, tampering, and submission lifecycles. |
| `scripts/test-services-integration.mjs` | End-to-End Service Catalogue | **PASS** | 76 HTTP assertions across all 7 services. |
| `scripts/test-browser-dashboard.mjs` | Citizen Dashboard Browser Quality | **PASS** | Desktop, tablet, mobile viewports, timeline navigation, trilingual switching, and 0 console errors. |
| `tsc --noEmit` | TypeScript Type Checker | **PASS** | 0 type errors. |
| `eslint .` | ESLint Code Quality | **PASS** | 0 errors. Only 2 pre-existing next/image template warnings. |
| `vinext build` | Production Build Verification | **PASS** | All routes compiled and bundled successfully. |
| `git diff --check` | Git Whitespace & Syntax Invariants | **PASS** | 0 whitespace or formatting errors. |

---

## 5. Repository & Working Tree State

- **Branch:** `main`
- **HEAD Commit:** `4012ced9c537b5c7fd2a4d3d7fb14e8de34d49ae`
- **Remote:** Synchronized with `origin/main`
- **Reference Repo:** `D:\My Projects\Demo` clean, untouched, on `main`
- **Working Tree:** All Day 4 changes are unstaged. No unapproved commits or pushes have been executed.
