import { getAllServices, type Service, type ServiceDefinition } from './services.ts';
import { governmentSchemes, maharashtraDistricts } from './gov-info/schemes.ts';
import { getAuthority } from './gov-info/authorities.ts';
import type { GovernmentScheme } from './gov-info/types.ts';

export type AssistanceNeed =
  | 'agriculture'
  | 'education'
  | 'employment'
  | 'healthcare'
  | 'business'
  | 'housing'
  | 'certificates'
  | 'social_welfare'
  | 'other';

export type BeneficiaryType =
  | 'myself'
  | 'family_member'
  | 'business'
  | 'farm'
  | 'other';

export type AccomplishGoal =
  | 'financial_assistance'
  | 'apply_certificate'
  | 'access_service'
  | 'educational_opportunity'
  | 'agricultural_support'
  | 'other';

export interface RecommendationAnswers {
  needs: AssistanceNeed[];
  district?: string;
  beneficiary?: BeneficiaryType;
  goal?: AccomplishGoal;
}

export type RelevanceConfidence = 'strong_match' | 'possible_match' | 'related_service';

export interface RecommendationItem {
  id: string; // unique identifier: "service:<id>" or "scheme:<id>"
  itemType: 'service' | 'scheme';
  title: string;
  department: string;
  categoryLabel: string;
  description: string;
  benefits?: string;
  applicationRoute: 'in_app' | 'external_portal';
  serviceId?: Service;
  schemeId?: string;
  externalUrl?: string;
  confidence: RelevanceConfidence;
  score: number;
  matchReasons: string[];
  matchedNeeds: AssistanceNeed[];
  districtNote?: string;
  districtNoteTemplate?: string;
  districtNoteParams?: Record<string, string>;
}

export interface RecommendationResult {
  totalMatches: number;
  topRecommendations: RecommendationItem[];
  relatedServices: RecommendationItem[];
  allRecommendations: RecommendationItem[];
  hasAnswers: boolean;
  evaluatedNeeds: AssistanceNeed[];
  selectedDistrict?: string;
}

// Category mapping helper between AssistanceNeed and service/scheme categories
export const NEED_SERVICE_CATEGORY_MAP: Record<AssistanceNeed, string[]> = {
  education: ['Education'],
  certificates: ['Certificates', 'Documentation'],
  social_welfare: ['Social Welfare', 'Public Distribution'],
  healthcare: ['Healthcare', 'Social Welfare'],
  agriculture: ['Agriculture'],
  employment: ['Employment', 'Skills'],
  business: ['Business', 'Commerce'],
  housing: ['Housing'],
  other: ['Identity & Travel', 'Documentation', 'Public Distribution'],
};

export const NEED_SCHEME_CATEGORY_MAP: Record<AssistanceNeed, string[]> = {
  education: ['education'],
  certificates: ['education', 'social_welfare'],
  social_welfare: ['social_welfare', 'women_child', 'pension'],
  healthcare: ['health'],
  agriculture: ['agriculture'],
  employment: ['employment'],
  business: ['employment'],
  housing: ['housing'],
  other: ['social_welfare', 'employment'],
};

export const SCHEME_CATEGORY_DISPLAY_LABELS: Record<string, string> = {
  agriculture: 'Agriculture',
  education: 'Education',
  employment: 'Employment',
  health: 'Healthcare',
  housing: 'Housing',
  pension: 'Pension',
  social_welfare: 'Social Welfare',
  women_child: 'Women & Child Development',
};

// Goal mapping to preferred services and schemes
const GOAL_SERVICE_AFFINITY: Record<AccomplishGoal, Service[]> = {
  apply_certificate: ['residence', 'income-certificate', 'caste-certificate', 'passport'],
  educational_opportunity: ['scholarship'],
  financial_assistance: ['scholarship', 'pension', 'ration-card'],
  access_service: ['ration-card', 'passport', 'residence'],
  agricultural_support: [],
  other: ['residence', 'ration-card', 'passport', 'scholarship', 'pension', 'income-certificate', 'caste-certificate'],
};

const GOAL_SCHEME_AFFINITY: Record<AccomplishGoal, string[]> = {
  apply_certificate: [],
  educational_opportunity: ['mh-rcsm-ebc-scholarship', 'goi-post-matric-sc-mh'],
  financial_assistance: [
    'pm-kisan',
    'mh-smam-mechanization',
    'pmegp',
    'mh-ladki-bahin',
    'mh-sanjay-gandhi-niradhar',
    'mh-shravanbal-pension',
    'pmay-gramin',
  ],
  access_service: ['mh-mjpjay-pmjay', 'pmay-gramin'],
  agricultural_support: ['pm-kisan', 'mh-smam-mechanization'],
  other: ['mh-mjpjay-pmjay', 'pm-kisan', 'mh-rcsm-ebc-scholarship', 'pmegp'],
};

// Beneficiary mapping
const BENEFICIARY_SERVICE_AFFINITY: Record<BeneficiaryType, Service[]> = {
  myself: ['scholarship', 'residence', 'passport', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
  family_member: ['pension', 'ration-card', 'scholarship', 'residence', 'caste-certificate'],
  business: ['income-certificate', 'residence'],
  farm: ['residence', 'income-certificate'],
  other: ['residence', 'ration-card', 'passport'],
};

const BENEFICIARY_SCHEME_AFFINITY: Record<BeneficiaryType, string[]> = {
  myself: ['mh-rcsm-ebc-scholarship', 'goi-post-matric-sc-mh', 'pmegp', 'mh-ladki-bahin', 'mh-mjpjay-pmjay'],
  family_member: ['mh-shravanbal-pension', 'mh-sanjay-gandhi-niradhar', 'mh-ladki-bahin', 'mh-mjpjay-pmjay', 'goi-post-matric-sc-mh'],
  business: ['pmegp'],
  farm: ['pm-kisan', 'mh-smam-mechanization'],
  other: ['mh-mjpjay-pmjay', 'pmay-gramin'],
};

export function isValidMaharashtraDistrict(district: string | undefined): boolean {
  if (!district) return false;
  return maharashtraDistricts.includes(district as (typeof maharashtraDistricts)[number]);
}

export function hasAnyRecommendationAnswer(answers: RecommendationAnswers | null | undefined): boolean {
  if (!answers) return false;
  if (answers.needs && answers.needs.length > 0) return true;
  if (answers.district && answers.district.trim() !== '') return true;
  if (answers.beneficiary && answers.beneficiary !== 'other') return true;
  if (answers.goal && answers.goal !== 'other') return true;
  return false;
}

/**
 * Deterministically evaluates catalogue services and schemes against questionnaire answers.
 * Returns ranked recommendations with transparent confidence levels and explanation rationales.
 */
export function getRecommendations(
  answers: RecommendationAnswers,
  catalogueOverrides?: {
    services?: ServiceDefinition[];
    schemes?: GovernmentScheme[];
  }
): RecommendationResult {
  const activeServices = catalogueOverrides?.services ?? getAllServices();
  const activeSchemes = catalogueOverrides?.schemes ?? governmentSchemes;

  const validDistrict = isValidMaharashtraDistrict(answers.district) ? answers.district : undefined;
  const selectedNeeds = answers.needs || [];
  const selectedGoal = answers.goal;
  const selectedBeneficiary = answers.beneficiary;

  const hasAnswers = selectedNeeds.length > 0 || !!validDistrict || !!selectedBeneficiary || !!selectedGoal;

  if (!hasAnswers) {
    return {
      totalMatches: 0,
      topRecommendations: [],
      relatedServices: [],
      allRecommendations: [],
      hasAnswers: false,
      evaluatedNeeds: [],
      selectedDistrict: undefined,
    };
  }

  const items: RecommendationItem[] = [];

  // 1. Evaluate Core Services (In-app GovSync applications)
  for (const s of activeServices) {
    let score = 0;
    const matchReasons: string[] = [];
    const matchedNeeds: AssistanceNeed[] = [];

    // Match Assistance Needs
    for (const need of selectedNeeds) {
      const mappedCats = NEED_SERVICE_CATEGORY_MAP[need] || [];
      if (mappedCats.includes(s.category)) {
        score += 45;
        matchedNeeds.push(need);
        if (need === 'education') {
          matchReasons.push('Matches your requirement for education and student support.');
        } else if (need === 'certificates') {
          matchReasons.push('Directly provides official certificate issuance in Maharashtra.');
        } else if (need === 'social_welfare') {
          matchReasons.push('Provides essential household social security and welfare support.');
        } else if (need === 'agriculture') {
          matchReasons.push('Directly targeted for agricultural and farming welfare.');
        } else if (need === 'healthcare') {
          matchReasons.push('Provides essential public health and healthcare documentation.');
        } else if (need === 'employment' || need === 'business') {
          matchReasons.push('Supports self-employment, credit subsidies, and enterprise generation.');
        } else if (need === 'housing') {
          matchReasons.push('Assists with pucca house construction and rural housing grants.');
        } else {
          matchReasons.push('Aligns with your selected assistance needs.');
        }
      } else if (s.keywords.toLowerCase().includes(need.toLowerCase())) {
        score += 20;
        if (!matchedNeeds.includes(need)) matchedNeeds.push(need);
        matchReasons.push('Relevant to your assistance needs based on service keywords.');
      }
    }

    // Match Accomplish Goal
    if (selectedGoal) {
      const preferredForGoal = GOAL_SERVICE_AFFINITY[selectedGoal] || [];
      if (preferredForGoal.includes(s.id)) {
        score += 35;
        if (selectedGoal === 'apply_certificate') {
          matchReasons.push('Supports end-to-end digital application for verified certificates.');
        } else if (selectedGoal === 'educational_opportunity') {
          matchReasons.push('Enables direct scholarship submission with academic merit verification.');
        } else if (selectedGoal === 'financial_assistance') {
          matchReasons.push('Facilitates direct benefit disbursement and economic assistance.');
        } else if (selectedGoal === 'access_service') {
          matchReasons.push('Provides direct access to this essential government citizen service.');
        } else {
          matchReasons.push('Directly addresses your primary stated goal.');
        }
      }
    }

    // Match Beneficiary Type
    if (selectedBeneficiary) {
      const preferredForBeneficiary = BENEFICIARY_SERVICE_AFFINITY[selectedBeneficiary] || [];
      if (preferredForBeneficiary.includes(s.id)) {
        score += 20;
        if (selectedBeneficiary === 'myself') {
          matchReasons.push('Available for direct application by individual citizens.');
        } else if (selectedBeneficiary === 'family_member') {
          matchReasons.push('Can be applied on behalf of eligible family members.');
        } else if (selectedBeneficiary === 'farm' || selectedBeneficiary === 'business') {
          matchReasons.push('Supports domicile and identity credentials required for enterprise or farm operations.');
        }
      }
    }

    // District Context
    let districtNote: string | undefined;
    let districtNoteTemplate: string | undefined;
    let districtNoteParams: Record<string, string> | undefined;
    if (validDistrict) {
      if (s.id === 'residence' || s.id === 'income-certificate' || s.id === 'caste-certificate') {
        score += 5;
        districtNoteTemplate = 'Processed through the Revenue and District Collector administration for {district}.';
        districtNoteParams = { district: validDistrict };
        districtNote = `Processed through the Revenue and District Collector administration for ${validDistrict}.`;
      } else if (s.id === 'scholarship') {
        districtNoteTemplate = 'Recognized across universities and colleges in {district} and statewide.';
        districtNoteParams = { district: validDistrict };
        districtNote = `Recognized across universities and colleges in ${validDistrict} and statewide.`;
      }
    }

    // Assign Confidence Label
    if (score >= 15) {
      let confidence: RelevanceConfidence = 'related_service';
      if (score >= 60) {
        confidence = 'strong_match';
      } else if (score >= 35) {
        confidence = 'possible_match';
      }

      items.push({
        id: `service:${s.id}`,
        itemType: 'service',
        title: s.name,
        department: s.department,
        categoryLabel: s.category,
        description: s.description,
        benefits: s.simulationNotice,
        applicationRoute: 'in_app',
        serviceId: s.id,
        confidence,
        score,
        matchReasons: Array.from(new Set(matchReasons)),
        matchedNeeds,
        districtNote,
        districtNoteTemplate,
        districtNoteParams,
      });
    }
  }

  // 2. Evaluate Government Schemes (External verified portals & details)
  for (const sc of activeSchemes) {
    let score = 0;
    const matchReasons: string[] = [];
    const matchedNeeds: AssistanceNeed[] = [];

    // Match Assistance Needs
    for (const need of selectedNeeds) {
      const mappedCats = NEED_SCHEME_CATEGORY_MAP[need] || [];
      if (mappedCats.includes(sc.category)) {
        score += 45;
        matchedNeeds.push(need);
        if (need === 'agriculture') {
          matchReasons.push('Directly targeted for agricultural and farming welfare.');
        } else if (need === 'education') {
          matchReasons.push('Provides student educational funding and fee reimbursement.');
        } else if (need === 'employment' || need === 'business') {
          matchReasons.push('Supports self-employment, credit subsidies, and enterprise generation.');
        } else if (need === 'healthcare') {
          matchReasons.push('Provides comprehensive cashless healthcare and medical insurance.');
        } else if (need === 'housing') {
          matchReasons.push('Assists with pucca house construction and rural housing grants.');
        } else if (need === 'social_welfare') {
          matchReasons.push('Offers monthly social security pension and welfare allowances.');
        } else {
          matchReasons.push('Aligns with your selected assistance needs.');
        }
      }
    }

    // Match Accomplish Goal
    if (selectedGoal) {
      const preferredForGoal = GOAL_SCHEME_AFFINITY[selectedGoal] || [];
      if (preferredForGoal.includes(sc.id)) {
        score += 35;
        if (selectedGoal === 'agricultural_support') {
          matchReasons.push('Provides direct equipment subsidies and agricultural cash support.');
        } else if (selectedGoal === 'financial_assistance') {
          matchReasons.push('Transfers direct financial assistance into beneficiary bank accounts (DBT).');
        } else if (selectedGoal === 'educational_opportunity') {
          matchReasons.push('Assists students with full or partial higher education costs.');
        } else if (selectedGoal === 'access_service') {
          matchReasons.push('Connects to active state-wide government healthcare or welfare delivery.');
        } else {
          matchReasons.push('Aligns with your stated primary outcome.');
        }
      }
    }

    // Match Beneficiary Type
    if (selectedBeneficiary) {
      const preferredForBeneficiary = BENEFICIARY_SCHEME_AFFINITY[selectedBeneficiary] || [];
      if (preferredForBeneficiary.includes(sc.id)) {
        score += 20;
        if (selectedBeneficiary === 'farm') {
          matchReasons.push('Specifically designed for agricultural landholders and farming families.');
        } else if (selectedBeneficiary === 'business') {
          matchReasons.push('Tailored for entrepreneurs launching new manufacturing or service units.');
        } else if (selectedBeneficiary === 'family_member') {
          matchReasons.push('Offers targeted security for elderly, women, or student family members.');
        } else if (selectedBeneficiary === 'myself') {
          matchReasons.push('Directly open for individual citizen applications.');
        }
      }
    }

    // District Context
    let districtNote: string | undefined;
    let districtNoteTemplate: string | undefined;
    let districtNoteParams: Record<string, string> | undefined;
    if (validDistrict) {
      if (sc.id === 'pmegp') {
        score += 5;
        districtNoteTemplate = 'Administered in {district} through the District Industries Centre (DIC) and KVIB.';
        districtNoteParams = { district: validDistrict };
        districtNote = `Administered in ${validDistrict} through the District Industries Centre (DIC) and KVIB.`;
      } else if (sc.id === 'mh-smam-mechanization') {
        score += 5;
        districtNoteTemplate = 'Agricultural implement quotas and lottery allocations are managed per district in {district}.';
        districtNoteParams = { district: validDistrict };
        districtNote = `Agricultural implement quotas and lottery allocations are managed per district in ${validDistrict}.`;
      } else if (sc.id === 'mh-sanjay-gandhi-niradhar' || sc.id === 'mh-shravanbal-pension') {
        score += 5;
        districtNoteTemplate = 'Local beneficiary sanctions are managed by the Tehsildar office in {district}.';
        districtNoteParams = { district: validDistrict };
        districtNote = `Local beneficiary sanctions are managed by the Tehsildar office in ${validDistrict}.`;
      } else {
        districtNoteTemplate = 'Accessible across all districts in Maharashtra including {district}.';
        districtNoteParams = { district: validDistrict };
        districtNote = `Accessible across all districts in Maharashtra including ${validDistrict}.`;
      }
    }

    // Assign Confidence Label
    if (score >= 15) {
      let confidence: RelevanceConfidence = 'related_service';
      if (score >= 60) {
        confidence = 'strong_match';
      } else if (score >= 35) {
        confidence = 'possible_match';
      }

      items.push({
        id: `scheme:${sc.id}`,
        itemType: 'scheme',
        title: sc.name,
        department: getAuthority(sc.departmentId)?.name || sc.departmentId,
        categoryLabel: SCHEME_CATEGORY_DISPLAY_LABELS[sc.category] || sc.category.replace('_', ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()),
        description: sc.shortDescription,
        benefits: sc.benefitSummary,
        applicationRoute: 'external_portal',
        schemeId: sc.id,
        externalUrl: sc.applicationPortalUrl || undefined,
        confidence,
        score,
        matchReasons: Array.from(new Set(matchReasons)),
        matchedNeeds,
        districtNote,
        districtNoteTemplate,
        districtNoteParams,
      });
    }
  }

  // Deterministic Ranking:
  // 1. Highest score first
  // 2. Highest confidence rank (strong > possible > related)
  // 3. Alphabetical by title for deterministic stability
  const confidenceRank: Record<RelevanceConfidence, number> = {
    strong_match: 3,
    possible_match: 2,
    related_service: 1,
  };

  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (confidenceRank[b.confidence] !== confidenceRank[a.confidence]) {
      return confidenceRank[b.confidence] - confidenceRank[a.confidence];
    }
    return a.title.localeCompare(b.title);
  });

  const topRecommendations = items.filter((i) => i.confidence === 'strong_match');
  const relatedServices = items.filter((i) => i.confidence !== 'strong_match');

  // Fallback: If no strong matches, promote top 2 possible matches to topRecommendations
  let finalTop = topRecommendations;
  let finalRelated = relatedServices;

  if (finalTop.length === 0 && finalRelated.length > 0) {
    finalTop = finalRelated.slice(0, 3);
    finalRelated = finalRelated.slice(3);
  }

  return {
    totalMatches: items.length,
    topRecommendations: finalTop,
    relatedServices: finalRelated,
    allRecommendations: items,
    hasAnswers,
    evaluatedNeeds: selectedNeeds,
    selectedDistrict: validDistrict,
  };
}
