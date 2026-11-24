/**
 * GovSync Phase 3, Day 8: Agriculture & Farmer Service Hub
 * Authoritative catalogue and filtering engine for Maharashtra agricultural schemes,
 * farmer welfare services, machinery subsidies, crop insurance, and official portals.
 *
 * All records strictly cited to official Government of Maharashtra and Government of India sources.
 */

export type AgricultureCategoryKey =
  | 'schemes'
  | 'subsidies'
  | 'machinery'
  | 'irrigation'
  | 'insurance'
  | 'soil_health'
  | 'farmer_registry'
  | 'marketing'
  | 'training_advisory'
  | 'disaster_relief';

export type AgricultureItemType = 'scheme' | 'service';
export type VerificationStatus = 'verified' | 'partially_verified' | 'information_not_verified';
export type AdministrativeLevel = 'central' | 'state' | 'joint';

export interface AgricultureCategoryInfo {
  id: AgricultureCategoryKey;
  label: string;
  marathiLabel: string;
  hindiLabel: string;
  description: string;
  iconName: string;
}

export interface ImportantPortal {
  id: string;
  name: string;
  marathiName: string;
  hindiName: string;
  url: string;
  description: string;
  authority: string;
  badge: string;
}

export interface HowToUseStep {
  step: number;
  title: string;
  marathiTitle: string;
  hindiTitle: string;
  description: string;
  marathiDescription: string;
  hindiDescription: string;
}

export interface AgricultureItem {
  id: string;
  name: string;
  marathiName: string;
  hindiName: string;
  category: AgricultureCategoryKey;
  itemType: AgricultureItemType;
  department: string;
  level: AdministrativeLevel;
  shortDescription: string;
  detailedDescription: string;
  intendedBeneficiaries: string;
  eligibilityRequirements: readonly string[];
  benefits: readonly string[];
  requiredDocuments: readonly string[];
  applicationProcess: readonly string[];
  officialApplicationUrl: string;
  officialApplicationLabel: string;
  sourceUrl: string;
  sourceTitle: string;
  lastVerified: string;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  relatedOffices?: readonly string[];
  keywords: readonly string[];
}

export interface AgricultureFilterOptions {
  query?: string;
  category?: string;
  department?: string;
  itemType?: string;
  verificationStatus?: string;
}

// ============================================================================
// 1. TEN CANONICAL AGRICULTURAL CATEGORIES
// ============================================================================
export const AGRICULTURE_CATEGORIES: readonly AgricultureCategoryInfo[] = [
  {
    id: 'schemes',
    label: 'Government Schemes',
    marathiLabel: 'शासकीय योजना',
    hindiLabel: 'सरकारी योजनाएं',
    description: 'Central and state government income support and broad farmer welfare programmes.',
    iconName: 'Sprout',
  },
  {
    id: 'subsidies',
    label: 'Financial Assistance & Subsidies',
    marathiLabel: 'आर्थिक सहाय्य व अनुदाने',
    hindiLabel: 'वित्तीय सहायता और सब्सिडी',
    description: 'Targeted subsidies for farm equipment, wells, pumps, and specialized category support.',
    iconName: 'Coins',
  },
  {
    id: 'machinery',
    label: 'Agricultural Machinery',
    marathiLabel: 'कृषी यांत्रिकीकरण',
    hindiLabel: 'कृषि यंत्रीकरण',
    description: 'Subsidies and custom hiring access for tractors, power tillers, rotavators, and implements.',
    iconName: 'Tractor',
  },
  {
    id: 'irrigation',
    label: 'Irrigation & Water Management',
    marathiLabel: 'सिंचन व जलव्यवस्थापन',
    hindiLabel: 'सिंचाई और जल प्रबंधन',
    description: 'Drip and sprinkler micro-irrigation subsidies, farm ponds on demand, and solar water pumps.',
    iconName: 'Droplet',
  },
  {
    id: 'insurance',
    label: 'Crop Insurance',
    marathiLabel: 'पीक विमा',
    hindiLabel: 'फसल बीमा',
    description: 'Pradhan Mantri Fasal Bima Yojana (PMFBY ₹1 farmer token) and weather-based fruit crop insurance.',
    iconName: 'ShieldCheck',
  },
  {
    id: 'soil_health',
    label: 'Soil Health & Testing',
    marathiLabel: 'मृदा आरोग्य व तपासणी',
    hindiLabel: 'मृदा स्वास्थ्य और परीक्षण',
    description: 'Soil Health Card soil testing laboratory network, nutrient analysis, and organic farming schemes.',
    iconName: 'FlaskConical',
  },
  {
    id: 'farmer_registry',
    label: 'Farmer Registration & Documents',
    marathiLabel: 'शेतकरी नोंदणी व कागदपत्रे',
    hindiLabel: 'किसान पंजीकरण और दस्तावेज',
    description: 'MahaDBT Farmer Registration, digital 7/12 & 8-A land records, and E-Pik Pahani digital crop survey.',
    iconName: 'FileCheck2',
  },
  {
    id: 'marketing',
    label: 'Agricultural Marketing',
    marathiLabel: 'कृषी विपणन व बाजारपेठ',
    hindiLabel: 'कृषि विपणन और बाजार',
    description: 'e-NAM electronic trading, Maharashtra Panan Mandal market access, and MSP procurement centers.',
    iconName: 'Store',
  },
  {
    id: 'training_advisory',
    label: 'Training & Advisory',
    marathiLabel: 'प्रशिक्षण व सल्लागार सेवा',
    hindiLabel: 'प्रशिक्षण और सलाह',
    description: 'Krishi Vigyan Kendra (KVK) guidance, Kisan Call Centre toll-free advice, and CROPSAP pest alerts.',
    iconName: 'GraduationCap',
  },
  {
    id: 'disaster_relief',
    label: 'Disaster & Crop-Loss Assistance',
    marathiLabel: 'आपत्ती व पीक नुकसान भरपाई',
    hindiLabel: 'आपदा और फसल क्षति सहायता',
    description: 'SDRF input subsidy for natural calamities (unseasonal rain, drought) and farmer accident assistance.',
    iconName: 'AlertTriangle',
  },
];

// ============================================================================
// 2. IMPORTANT OFFICIAL GOVERNMENT PORTALS
// ============================================================================
export const IMPORTANT_AGRICULTURE_PORTALS: readonly ImportantPortal[] = [
  {
    id: 'portal-mahadbt-farmer',
    name: 'MahaDBT Farmer Portal',
    marathiName: 'महाडीबीटी शेतकरी पोर्टल',
    hindiName: 'महाडीबीटी किसान पोर्टल',
    url: 'https://mahadbt.maharashtra.gov.in/farmer',
    description: 'Official single-window portal of Government of Maharashtra for all state agriculture subsidies and machinery lotteries.',
    authority: 'Department of Agriculture, Government of Maharashtra',
    badge: 'State Single Window',
  },
  {
    id: 'portal-krishi-mh',
    name: 'Maharashtra Department of Agriculture',
    marathiName: 'महाराष्ट्र कृषी विभाग संकेतस्थळ',
    hindiName: 'महाराष्ट्र कृषि विभाग वेबसाइट',
    url: 'https://krishi.maharashtra.gov.in',
    description: 'Official department website providing government resolutions, administrative guidelines, extension schedules, and district offices.',
    authority: 'Government of Maharashtra',
    badge: 'Department Portal',
  },
  {
    id: 'portal-pm-kisan',
    name: 'PM-KISAN National Portal',
    marathiName: 'पीएम-किसान राष्ट्रीय पोर्टल',
    hindiName: 'पीएम-किसान राष्ट्रीय पोर्टल',
    url: 'https://pmkisan.gov.in',
    description: 'Central portal for annual ₹6,000 income support installment tracking, beneficiary status, e-KYC, and land mapping.',
    authority: 'Ministry of Agriculture & Farmers Welfare, GoI',
    badge: 'National Direct Benefit',
  },
  {
    id: 'portal-pmfby',
    name: 'PMFBY Crop Insurance Portal',
    marathiName: 'प्रधानमंत्री पीक विमा पोर्टल',
    hindiName: 'प्रधानमंत्री फसल बीमा पोर्टल',
    url: 'https://pmfby.gov.in',
    description: 'National crop insurance portal for policy application, premium calculator, crop loss intimation, and claim tracking.',
    authority: 'Ministry of Agriculture & Farmers Welfare, GoI',
    badge: 'National Insurance',
  },
  {
    id: 'portal-agrimachinery',
    name: 'Farmech / SMAM National Portal',
    marathiName: 'कृषी यांत्रिकीकरण राष्ट्रीय पोर्टल (SMAM)',
    hindiName: 'कृषि यंत्रीकरण राष्ट्रीय पोर्टल',
    url: 'https://agrimachinery.nic.in',
    description: 'National portal for Sub-Mission on Agricultural Mechanization guidelines, manufacturer testing reports, and component subsidy standards.',
    authority: 'Mechanization Division, Ministry of Agriculture, GoI',
    badge: 'Machinery Standards',
  },
  {
    id: 'portal-soilhealth',
    name: 'Soil Health Card Portal',
    marathiName: 'मृदा आरोग्य पत्रिका पोर्टल',
    hindiName: 'मृदा स्वास्थ्य कार्ड पोर्टल',
    url: 'https://soilhealth.dac.gov.in',
    description: 'Government portal for soil test results, laboratory locator, nutrient recommendations, and fertilizer dosage calculators.',
    authority: 'Department of Agriculture & Farmers Welfare, GoI',
    badge: 'Soil Testing',
  },
  {
    id: 'portal-enam',
    name: 'e-NAM (National Agriculture Market)',
    marathiName: 'ई-नाम राष्ट्रीय कृषी बाजार',
    hindiName: 'ई-नाम राष्ट्रीय कृषि बाजार',
    url: 'https://enam.gov.in',
    description: 'Pan-India electronic trading portal networking existing APMC mandis to create a unified national market for agricultural commodities.',
    authority: 'Small Farmers Agri-Business Consortium (SFAC)',
    badge: 'Commodity Trading',
  },
  {
    id: 'portal-mahabhulekh',
    name: 'Mahabhulekh Land Records Portal',
    marathiName: 'महाभूलेख डिजिटल 7/12 व 8-अ',
    hindiName: 'महाभूलेख भूमि रिकॉर्ड पोर्टल',
    url: 'https://bhulekh.mahabhumi.gov.in',
    description: 'Official digital land records portal of Maharashtra Revenue Department for accessing uncertified 7/12, 8-A, and property card extracts.',
    authority: 'Revenue & Forest Department, Government of Maharashtra',
    badge: 'Land Records',
  },
  {
    id: 'portal-msamb',
    name: 'MSAMB (Maharashtra Marketing Board)',
    marathiName: 'महाराष्ट्र राज्य कृषी पणन मंडळ',
    hindiName: 'महाराष्ट्र राज्य कृषि विपणन बोर्ड',
    url: 'https://www.msamb.com',
    description: 'State agricultural marketing board coordinating APMCs, farmer export facilities, pre-cooling centers, and weekly farmer markets.',
    authority: 'Maharashtra State Agricultural Marketing Board',
    badge: 'State Marketing',
  },
];

// ============================================================================
// 3. STEP-BY-STEP HELP & GUIDANCE FOR CITIZENS
// ============================================================================
export const HOW_TO_USE_STEPS: readonly HowToUseStep[] = [
  {
    step: 1,
    title: 'Find Your Required Programme',
    marathiTitle: 'आवश्यक योजना किंवा सेवा शोधा',
    hindiTitle: 'अपनी आवश्यकता के अनुसार योजना या सेवा खोजें',
    description: 'Browse the 10 categories above or use the search box to locate financial subsidies, machinery access, or soil testing services.',
    marathiDescription: 'वरील १० श्रेणींमध्ये पाहा किंवा थेट शोधपेटी वापरून वित्तीय अनुदान, कृषी अवजारे अथवा मृदा चाचणी सेवा शोधा.',
    hindiDescription: 'ऊपर दी गई 10 श्रेणियों में देखें या सीधे सर्च बॉक्स का उपयोग करके वित्तीय सब्सिडी, कृषि उपकरण या मृदा परीक्षण सेवाएं खोजें.',
  },
  {
    step: 2,
    title: 'Review Verified Rules & Documents',
    marathiTitle: 'पात्रता निकष व कागदपत्रे तपासा',
    hindiTitle: 'पात्रता शर्तें और आवश्यक दस्तावेज जांचें',
    description: 'Click on any scheme or service card to read verified eligibility criteria, required land documents (7/12 & 8-A), and statutory benefits.',
    marathiDescription: 'तपशील पाहण्यासाठी कार्डवर क्लिक करा आणि अधिकृत पात्रता अटी, आवश्यक ७/१२ व ८-अ उतारे आणि अनुदानाचे नियम काळजीपूर्वक वाचा.',
    hindiDescription: 'विवरण देखने के लिए कार्ड पर क्लिक करें और आधिकारिक पात्रता शर्तें, आवश्यक 7/12 व 8-A रिकॉर्ड और सब्सिडी नियमों को ध्यान से पढ़ें.',
  },
  {
    step: 3,
    title: 'Inspect Official Source References',
    marathiTitle: 'अधिकृत सरकारी संदर्भ तपासा',
    hindiTitle: 'आधिकारिक सरकारी स्रोत सत्यापित करें',
    description: 'Check the government department, official notification citation, and last verification date before proceeding.',
    marathiDescription: 'अर्ज करण्यापूर्वी संबंधित प्रशासकीय विभाग, शासकीय परिपत्रक क्रमांक आणि पडताळणी तारीख तपासून खात्री करा.',
    hindiDescription: 'आवेदन करने से पहले संबंधित विभाग, सरकारी परिपत्रक और सत्यापन तिथि की पुष्टि करें.',
  },
  {
    step: 4,
    title: 'Apply on Official Government Portals',
    marathiTitle: 'अधिकृत शासकीय पोर्टलवर अर्ज करा',
    hindiTitle: 'आधिकारिक सरकारी पोर्टल पर आवेदन करें',
    description: 'Use the verified external portal link (such as MahaDBT Farmer or PM-KISAN) to complete your application safely through government channels.',
    marathiDescription: 'महाडीबीटी शेतकरी किंवा पीएम-किसान यांसारख्या अधिकृत शासकीय पोर्टलवर सुरक्षितपणे जावून आपला अर्ज पूर्ण करा.',
    hindiDescription: 'महाडीबीटी किसान या पीएम-किसान जैसे आधिकारिक सरकारी पोर्टल्स पर जाकर अपना आवेदन सुरक्षित रूप से पूरा करें.',
  },
];

// ============================================================================
// 4. VERIFIED AGRICULTURAL SCHEMES & FARMER SERVICES DATASET
// ============================================================================
export const VERIFIED_AGRICULTURE_ITEMS: readonly AgricultureItem[] = [
  // --- CATEGORY 1: GOVERNMENT SCHEMES ---
  {
    id: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    marathiName: 'प्रधानमंत्री किसान सन्मान निधी (पीएम-किसान)',
    hindiName: 'प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)',
    category: 'schemes',
    itemType: 'scheme',
    department: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    level: 'central',
    shortDescription: 'Annual income support of ₹6,000 in three equal installments for eligible landholding farmer families.',
    detailedDescription: 'Central Sector scheme providing ₹6,000 per year directly to bank accounts of landholding farmer families in three installments of ₹2,000 every 4 months via Aadhaar-linked Direct Benefit Transfer (DBT). Universal across all cultivable landholders subject to statutory exclusions.',
    intendedBeneficiaries: 'Landholding farmer families with cultivable land in their names across rural and urban areas.',
    eligibilityRequirements: [
      'Farmer family (husband, wife, and minor children) must own cultivable agricultural land as per state revenue land records (7/12 extract).',
      'Bank account must be active and linked with Aadhaar for DBT payments.',
      'Mandatory e-KYC verification completed on PM-KISAN portal or CSC.',
      'Statutory Exclusion: Institutional landholders, serving or retired government officers (except Group D / MTS), income tax payers in the last assessment year, and constitutional post holders are ineligible.',
    ],
    benefits: [
      '₹6,000 financial support per year, credited directly to the beneficiary account.',
      'Disbursed in three equal 4-monthly installments of ₹2,000 each.',
      'Eligible Maharashtra farmers automatically qualify for state top-up under Namo Shetkari Mahasanman Nidhi.',
    ],
    requiredDocuments: [
      'Aadhaar Card of the landholder',
      'Agricultural Land Record Extract (7/12 & 8-A / Khatauni)',
      'Aadhaar-seeded Bank Account passbook or statement',
      'Active mobile number linked with Aadhaar for OTP verification',
    ],
    applicationProcess: [
      'Visit the official PM-KISAN portal (pmkisan.gov.in) and click "New Farmer Registration".',
      'Enter Aadhaar number, state (Maharashtra), and mobile number to receive authentication OTP.',
      'Enter landholding details (District, Taluka, Village, Survey / Group number, Sub-division, and Area).',
      'Upload digitized 7/12 land extract and submit. The record is verified by local Revenue (Patwari/Tahsildar) and Agriculture officers.',
    ],
    officialApplicationUrl: 'https://pmkisan.gov.in',
    officialApplicationLabel: 'Apply on PM-KISAN Portal',
    sourceUrl: 'https://pmkisan.gov.in',
    sourceTitle: 'Operational Guidelines of Pradhan Mantri Kisan Samman Nidhi, Department of Agriculture & Farmers Welfare, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['pune-collectorate', 'pune-tahsil-city', 'nashik-collectorate'],
    keywords: ['pm-kisan', 'income support', 'kisan', 'dbt', 'central scheme', '6000', 'farmer family'],
  },
  {
    id: 'namo-shetkari-yojana',
    name: 'Namo Shetkari Mahasanman Nidhi Yojana',
    marathiName: 'नमो शेतकरी महासन्मान निधी योजना',
    hindiName: 'नमो शेतकरी महासम्मान निधि योजना',
    category: 'schemes',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Maharashtra state matching assistance providing ₹6,000 annually to PM-KISAN approved farmers, totaling ₹12,000/year.',
    detailedDescription: 'Government of Maharashtra flagship scheme launched in 2023 providing an additional ₹6,000 per year from state funds to all Maharashtra farmers who are verified beneficiaries of PM-KISAN, combining central and state benefits to provide ₹12,000 per year.',
    intendedBeneficiaries: 'Cultivable landholding farmers in Maharashtra approved and actively receiving PM-KISAN benefits.',
    eligibilityRequirements: [
      'Must be a permanent resident farmer of Maharashtra.',
      'Must be an approved and active beneficiary of PM-KISAN scheme with completed e-KYC and land-seeding.',
      'Aadhaar-seeded bank account with active DBT mandate.',
      'Subject to the same economic and tax-payer exclusion criteria as PM-KISAN.',
    ],
    benefits: [
      '₹6,000 additional annual financial assistance from Maharashtra State Government.',
      'Disbursed in three installments of ₹2,000 each in coordination with central PM-KISAN release dates.',
      'Total combined annual income support of ₹12,000 (Central ₹6,000 + State ₹6,000).',
    ],
    requiredDocuments: [
      'PM-KISAN Registration / Beneficiary ID',
      'Aadhaar Card',
      'Maharashtra Land Records (7/12 extract with land seeding confirmed)',
      'Aadhaar-seeded bank account details',
    ],
    applicationProcess: [
      'No separate physical application is needed if the farmer is already an approved PM-KISAN beneficiary in Maharashtra.',
      'Ensure land seeding status shows "Yes" and e-KYC is completed on the PM-KISAN portal.',
      'State Agriculture Department maps eligible state beneficiaries through MahaDBT data exchange.',
    ],
    officialApplicationUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
    officialApplicationLabel: 'Check Status on MahaDBT Farmer',
    sourceUrl: 'https://krishi.maharashtra.gov.in',
    sourceTitle: 'Government Resolution No. संकीर्ण-२०२३/प्र.क्र.४०/२-ए, Department of Agriculture, Government of Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['pune-collectorate', 'nashik-agriculture'],
    keywords: ['namo shetkari', 'mahasanman', 'state top-up', '12000', 'mahadbt', 'maharashtra farmer'],
  },

  // --- CATEGORY 2: FINANCIAL ASSISTANCE & SUBSIDIES ---
  {
    id: 'dr-ambedkar-krushi-swavalamban',
    name: 'Dr. Babasaheb Ambedkar Krushi Swavalamban Yojana',
    marathiName: 'डॉ. बाबासाहेब आंबेडकर कृषी स्वावलंबन योजना',
    hindiName: 'डॉ. बाबासाहेब आंबेडकर कृषि स्वावलंबन योजना',
    category: 'subsidies',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Financial assistance for new wells, in-well boring, pump sets, and micro-irrigation for Scheduled Caste farmers.',
    detailedDescription: 'Special assistance scheme implemented by Maharashtra Agriculture Department to create permanent irrigation assets for Scheduled Caste and Navabuddha farmers. Subsidizes new well construction (up to ₹2.5 lakh), solar or electric pumps, and micro-irrigation.',
    intendedBeneficiaries: 'Scheduled Caste and Navabuddha landholding farmers in Maharashtra.',
    eligibilityRequirements: [
      'Applicant must belong to Scheduled Caste (SC) or Navabuddha community, verified by valid caste certificate.',
      'Annual family income must not exceed ₹1,50,000.',
      'Must hold minimum 0.20 hectare (0.5 acre) cultivable land up to maximum 6 hectares.',
      'For new well construction, there must not already be an existing well on the 7/12 parcel, and minimum 500-meter distance from existing drinking water source.',
    ],
    benefits: [
      'New well construction: subsidy up to ₹2,50,000.',
      'In-well boring assistance: up to ₹20,000.',
      'Electric pump set / solar pump connection assistance: up to ₹25,000.',
      'Drip irrigation unit: up to ₹50,000; Sprinkler unit: up to ₹25,000.',
      'Underground pipeline: up to ₹30,000.',
    ],
    requiredDocuments: [
      'Valid Caste Certificate issued by competent authority in Maharashtra',
      'Income Certificate issued by Tahsildar / Revenue Authority (<= ₹1.5 Lakh)',
      'Digital 7/12 and 8-A land extracts',
      'Certificate from Talathi confirming no existing well on the land',
      'Aadhaar Card and Bank Passbook copy',
    ],
    applicationProcess: [
      'Register on MahaDBT Farmer Portal (mahadbt.maharashtra.gov.in/farmer).',
      'Select "Special Component Plan (SCP) - Dr. Babasaheb Ambedkar Krushi Swavalamban Yojana".',
      'Upload caste certificate, income certificate, and land records.',
      'Applications undergo computerized lottery selection followed by spot inspection by Agriculture Officer before work order.',
    ],
    officialApplicationUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
    officialApplicationLabel: 'Apply on MahaDBT Farmer Portal',
    sourceUrl: 'https://krishi.maharashtra.gov.in',
    sourceTitle: 'Government of Maharashtra Agriculture Department Circular on Special Assistance Schemes for SC Farmers',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['pune-social-welfare', 'nashik-agriculture'],
    keywords: ['ambedkar', 'well subsidy', 'sc farmer', 'irrigation well', 'pump set', 'special component plan'],
  },
  {
    id: 'birsa-munda-krishi-kranti',
    name: 'Birsa Munda Krishi Kranti Yojana',
    marathiName: 'बिरसा मुंडा कृषी क्रांती योजना',
    hindiName: 'बिरसा मुंडा कृषि क्रांति योजना',
    category: 'subsidies',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Dedicated financial assistance for new wells, pump sets, and farm ponds for Scheduled Tribe (ST) farmers.',
    detailedDescription: 'Flagship Tribal Sub-Plan programme implemented by the Department of Agriculture, Government of Maharashtra, supporting Adivasi (Scheduled Tribe) farmers to secure sustainable water infrastructure and increase agricultural income.',
    intendedBeneficiaries: 'Scheduled Tribe (ST) landholding farmers across Maharashtra tribal and non-tribal talukas.',
    eligibilityRequirements: [
      'Applicant must belong to a recognized Scheduled Tribe (ST) of Maharashtra, certified by valid caste certificate.',
      'Annual family income must not exceed ₹1,50,000.',
      'Must hold minimum 0.20 hectare agricultural land.',
      'Must not have previously received full subsidy for the same water asset on the specified parcel.',
    ],
    benefits: [
      'New well construction: subsidy assistance up to ₹2,50,000.',
      'Farm pond with plastic lining assistance: up to ₹1,00,000.',
      'Electric pump or solar pump subsidy: up to ₹25,000.',
      'Drip irrigation unit subsidy up to ₹50,000; Sprinkler subsidy up to ₹25,000.',
    ],
    requiredDocuments: [
      'Scheduled Tribe (ST) Caste Certificate',
      'Annual Income Certificate issued by Tahsildar (<= ₹1.5 Lakh)',
      'Digital 7/12 and 8-A landholding extracts',
      'No-well certificate from local Talathi (for new well component)',
      'Aadhaar card and bank account details',
    ],
    applicationProcess: [
      'Apply online via MahaDBT Farmer Portal (mahadbt.maharashtra.gov.in/farmer).',
      'Choose "Tribal Sub-Plan (TSP) - Birsa Munda Krishi Kranti Yojana".',
      'Upload verified ST certificate and revenue land papers.',
      'Selected applications undergo technical sanction by the District Superintending Agriculture Officer (SAO).',
    ],
    officialApplicationUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
    officialApplicationLabel: 'Apply on MahaDBT Farmer Portal',
    sourceUrl: 'https://krishi.maharashtra.gov.in',
    sourceTitle: 'Government Resolution on Tribal Sub-Plan Agricultural Assistance, Agriculture Department, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    relatedOffices: ['nashik-agriculture'],
    keywords: ['birsa munda', 'st farmer', 'tribal sub-plan', 'well subsidy', 'adivasi', 'irrigation'],
  },
  {
    id: 'mahatma-phule-karjmukti',
    name: 'Mahatma Jyotirao Phule Shetkari Karjmukti Yojana',
    marathiName: 'महात्मा जोतीराव फुले शेतकरी कर्जमुक्ती योजना',
    hindiName: 'महात्मा ज्योतिराव फुले शेतकरी कर्जमुक्ति योजना',
    category: 'subsidies',
    itemType: 'scheme',
    department: 'Co-operation, Marketing and Textiles Department, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Crop loan waiver up to ₹2 lakh and incentive subsidy up to ₹50,000 for regular loan-repaying farmers (subject to scheme cut-off dates).',
    detailedDescription: 'Comprehensive debt relief and repayment incentive initiative by the Government of Maharashtra providing crop loan waiver up to ₹2,00,000 for overdue agricultural loans, alongside an incentive grant up to ₹50,000 for farmers who repay seasonal crop loans on time. Operates under specified Government Resolution cut-off years with bank-submitted beneficiary lists.',
    intendedBeneficiaries: 'Maharashtra farmers holding short-term crop loans from cooperative banks, regional rural banks, or commercial banks covered under notified cut-off years.',
    eligibilityRequirements: [
      'Resident farmer of Maharashtra with crop loan taken from recognized financial institutions under scheme-notified financial years.',
      'Incentive component: Farmer must have repaid crop loans regularly for specified financial years as verified by participating banks.',
      'Scheme Status Note: This is a targeted debt relief and repayment incentive scheme governed by specific Government Resolution cut-off dates, not an open perpetual loan waiver for newly disbursed loans.',
      'Exclusions: Serving/retired government employees (above Class IV), legislators, cooperative institution directors, and taxpayers are excluded as per scheme notifications.',
    ],
    benefits: [
      'Crop loan principal and interest relief up to ₹2,00,000 for qualifying non-performing/overdue loans.',
      'Incentive subsidy of up to ₹50,000 directly deposited to bank accounts for disciplined, regular loan repayers.',
    ],
    requiredDocuments: [
      'Aadhaar Card with biometric / OTP authentication',
      'Loan account number and bank passbook',
      'Landholding 7/12 extract linked to loan record',
    ],
    applicationProcess: [
      'Participating banks submit loan master data directly to the official MJPSKY portal (mjpsky.maharashtra.gov.in).',
      'Farmer visits local Aaple Sarkar Seva Kendra or bank branch with Aadhaar.',
      'Authenticate biometric / OTP to verify loan details on the portal.',
      'Upon verification, benefit amount is credited directly to the loan or savings account via DBT.',
    ],
    officialApplicationUrl: 'https://mjpsky.maharashtra.gov.in',
    officialApplicationLabel: 'Visit MJPSKY Official Portal',
    sourceUrl: 'https://mjpsky.maharashtra.gov.in',
    sourceTitle: 'Government Resolution No. सीएलएस-२०१९/प्र.क्र.२२९/१४-स, Co-operation & Marketing Dept, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    keywords: ['karjmukti', 'crop loan waiver', 'loan relief', 'incentive subsidy', '50000', 'phule karjmukti'],
  },

  // --- CATEGORY 3: AGRICULTURAL MACHINERY ---
  {
    id: 'smam-mechanization',
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    marathiName: 'कृषी यांत्रिकीकरण उप-अभियान (एसएमएएम)',
    hindiName: 'कृषि यंत्रीकरण उप-मिशन (एसएमएएम)',
    category: 'machinery',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra (Central + State)',
    level: 'joint',
    shortDescription: 'Financial assistance of up to 40%–50% on approved agricultural machinery, tractors, power tillers, and implements.',
    detailedDescription: 'Joint Central-State initiative providing capital subsidies to modernize farming practices and reduce labor costs. Under the 2024 SMAM Guidelines, eligible small/marginal farmers (<= 2 ha), women farmers, and SC/ST farmers receive 50% subsidy (up to scheme ceilings); other eligible farmers receive 40%.',
    intendedBeneficiaries: 'Maharashtra landholding farmers purchasing new approved agricultural implements or establishing custom hiring centers.',
    eligibilityRequirements: [
      'Resident farmer of Maharashtra holding cultivable land in their own name (7/12 & 8-A extracts).',
      '50% subsidy slab: Small & marginal farmers holding <= 2 hectares (verified by land record), women farmers, and SC/ST farmers.',
      '40% subsidy slab: Other eligible landholding farmers.',
      'Only one major machine (e.g. tractor) per family within a 10-year lock-in period; other implements subject to 3–5 year lock-in.',
      'Equipment must be purchased only from government-empanelled manufacturers following official pre-sanction lottery selection.',
    ],
    benefits: [
      'Tractor subsidy up to ₹1,00,000–₹1,25,000 depending on category and horsepower.',
      'Power tillers, rotavators, multi-crop threshers, and seed drills subsidized at 40%–50% within component caps.',
      'Custom Hiring Centre (CHC) establishment assistance up to 40% of project cost (max ₹10–₹24 Lakh).',
    ],
    requiredDocuments: [
      'Aadhaar Card and active mobile number',
      'Digital 7/12 extract and 8-A holding sheet (Aaple Abhilekh / Mahabhulekh)',
      'Caste Certificate (Optional: Relevant ONLY for SC/ST farmers seeking allocation under SC/ST specific funds; women and small/marginal farmers do not require caste certification)',
      'Cancelled cheque or Bank Passbook copy with IFSC',
      'Quotation from registered, empaneled equipment dealer',
    ],
    applicationProcess: [
      'Log into MahaDBT Farmer Portal (mahadbt.maharashtra.gov.in/farmer) with Aadhaar.',
      'Select "Agriculture Mechanization" component and choose desired equipment.',
      'Pay portal processing fee and participate in computerized lottery rounds.',
      'If selected, obtain pre-sanction letter, purchase approved machine within stipulated deadline, upload GST tax invoice and GPS-tagged photo for physical verification.',
      'Subsidy reimbursed directly into farmer Aadhaar-linked bank account via DBT.',
    ],
    officialApplicationUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
    officialApplicationLabel: 'Apply on MahaDBT Farmer Portal',
    sourceUrl: 'https://agrimachinery.nic.in/Files/Guidelines/Guidelines_SMAM2024.pdf',
    sourceTitle: 'Operational Guidelines - Sub-Mission on Agricultural Mechanization (SMAM) (Revised 2024), Ministry of Agriculture, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['nashik-agriculture', 'pune-collectorate'],
    keywords: ['smam', 'tractor subsidy', 'farm machinery', 'mechanization', 'rotavator', 'power tiller', 'chc'],
  },
  {
    id: 'custom-hiring-centers',
    name: 'Custom Hiring Centers (CHC) for Farm Implements',
    marathiName: 'कृषी अवजारे भाडेतत्त्वावर देणे केंद्र (कस्टम हायरिंग सेंटर)',
    hindiName: 'कृषि उपकरण कस्टम हायरिंग सेंटर',
    category: 'machinery',
    itemType: 'service',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Rental access to modern farm machinery at village and taluka levels for small and marginal farmers.',
    detailedDescription: 'Government-supported machinery bank network operated by Farmer Producer Organizations (FPOs), primary agricultural cooperative societies, and rural entrepreneurs, enabling farmers who cannot afford purchasing costly tractors or harvesters to hire them on hourly or acre-based rates.',
    intendedBeneficiaries: 'Small and marginal farmers needing mechanized equipment without high capital expenditure.',
    eligibilityRequirements: [
      'Hiring service: Open to all farmers in the operational area of the Custom Hiring Center.',
      'Establishing a CHC: Rural youth, FPOs, Women Self-Help Groups, or cooperative societies registered in Maharashtra.',
    ],
    benefits: [
      'Affordable rental access to heavy machinery: laser land levelers, combine harvesters, automated seeders.',
      'Reduces input cost for marginal landholders.',
      'Subsidized loan assistance of 40% for eligible groups establishing new CHCs.',
    ],
    requiredDocuments: [
      'Identity Proof (Aadhaar Card) of farmer',
      'Landholding 7/12 extract for service booking',
    ],
    applicationProcess: [
      'Farmers contact local Gram Panchayat, Primary Agricultural Cooperative Society (PACS), or FPO operating the CHC.',
      'Book machinery slots online via Farmech portal or in-person at the local center.',
    ],
    officialApplicationUrl: 'https://agrimachinery.nic.in',
    officialApplicationLabel: 'Locate CHCs on Farmech Portal',
    sourceUrl: 'https://agrimachinery.nic.in',
    sourceTitle: 'National Mechanization Guidelines for Custom Hiring Service Centers, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['custom hiring', 'chc', 'farm machinery rent', 'fpo machinery', 'harvester rental'],
  },

  // --- CATEGORY 4: IRRIGATION & WATER MANAGEMENT ---
  {
    id: 'pmksy-micro-irrigation',
    name: 'PMKSY — Per Drop More Crop (Micro-Irrigation Drip & Sprinkler)',
    marathiName: 'प्रधानमंत्री कृषी सिंचन योजना — प्रति थेंब अधिक पीक (ठिबक व तुषार सिंचन)',
    hindiName: 'प्रधानमंत्री कृषि सिंचाई योजना — प्रति बूंद अधिक फसल',
    category: 'irrigation',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'joint',
    shortDescription: 'Subsidies up to 55% for general farmers and up to 80% (with state top-up) for small & marginal farmers on drip and sprinkler systems.',
    detailedDescription: 'Joint Central-State micro-irrigation programme designed to enhance water efficiency and crop yields. In Maharashtra, small and marginal farmers receive up to 55% central subsidy plus additional state supplementary assistance (reaching up to 75%–80% in specified drought-prone talukas).',
    intendedBeneficiaries: 'Landholding farmers cultivating horticulture, sugarcane, cotton, pulses, and vegetables.',
    eligibilityRequirements: [
      'Farmer must own agricultural land with an assured water source (well, borewell, farm pond, or canal).',
      'Electricity or solar pump connection installed at the water source.',
      'Land must have 7/12 extract reflecting water source registration.',
      'Minimum area 0.20 ha, maximum subsidy limit up to 5 hectares per beneficiary.',
    ],
    benefits: [
      'Small and marginal farmers: 55% subsidy under central guidelines + up to 25% state top-up subsidy.',
      'Other farmers: 45% subsidy under central guidelines + up to 15% state top-up subsidy.',
      'Drastically saves water (30%–50%) and increases fertilizer efficiency through fertigation.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      '7/12 and 8-A land extracts (with water source registered)',
      'Water and electricity availability certificate / electricity bill',
      'Quotation and lateral layout map from registered micro-irrigation manufacturer',
    ],
    applicationProcess: [
      'Apply online on MahaDBT Farmer Portal under "Micro Irrigation / PMKSY".',
      'Select component (Drip or Sprinkler) and empaneled brand.',
      'After pre-sanction, install the approved system and notify the local Agriculture Assistant.',
      'Officer conducts geo-tagged inspection, followed by direct subsidy credit into the farmer bank account.',
    ],
    officialApplicationUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
    officialApplicationLabel: 'Apply for Micro-Irrigation on MahaDBT',
    sourceUrl: 'https://pmksy.gov.in',
    sourceTitle: 'Operational Guidelines - Per Drop More Crop (PDMC), Ministry of Agriculture & Farmers Welfare, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['nashik-agriculture', 'pune-collectorate'],
    keywords: ['drip irrigation', 'sprinkler', 'pmksy', 'per drop more crop', 'thibak sinchan', 'water subsidy'],
  },
  {
    id: 'magel-tyala-shettale',
    name: 'Magel Tyala Shettale (Farm Pond on Demand)',
    marathiName: 'मागेल त्याला शेततळे योजना',
    hindiName: 'मागेल त्याला शेततले (मांगने पर खेत तालाब योजना)',
    category: 'irrigation',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'state',
    shortDescription: 'State grant of up to ₹50,000 for standard farm pond excavation and up to ₹75,000 for plastic film lining.',
    detailedDescription: 'Maharashtra government initiative to ensure rainwater harvesting and protective irrigation during drought periods. Farmers owning cultivable land can apply for individualized farm ponds sized from 15x15 meters to 30x30 meters.',
    intendedBeneficiaries: 'Individual farmers and groups in drought-affected and water-stressed talukas of Maharashtra.',
    eligibilityRequirements: [
      'Farmer must own at least 0.60 hectare (1.5 acres) of land.',
      'Site must be technically suitable for rainwater harvesting as certified by agricultural technical survey.',
      'Farmer must not have previously received full subsidy for a farm pond on the same parcel.',
    ],
    benefits: [
      'Direct subsidy of up to ₹50,000 for farm pond excavation work.',
      'Separate supplementary grant of up to ₹75,000 for UV-resistant 500-micron plastic lining.',
      'Provides protective irrigation for standing crops during prolonged dry spells.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      '7/12 and 8-A landholding extracts',
      'Bank passbook copy linked to Aadhaar',
      'Technical site inspection certificate from Agriculture Assistant',
    ],
    applicationProcess: [
      'Submit application on MahaDBT Farmer Portal under "Soil & Water Conservation - Farm Ponds".',
      'Receive technical sanction and GPS boundary coordinates from the Agriculture Officer.',
      'Complete excavation within prescribed deadline and notify department for digital measurement and verification.',
    ],
    officialApplicationUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
    officialApplicationLabel: 'Apply on MahaDBT Farmer Portal',
    sourceUrl: 'https://krishi.maharashtra.gov.in',
    sourceTitle: 'Government Resolution on Magel Tyala Shettale, Agriculture & Soil Conservation Department, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    keywords: ['shettale', 'farm pond', 'rainwater harvesting', 'water storage', 'magel tyala', 'plastic lining'],
  },
  {
    id: 'mukhyamantri-saur-krushi-pump',
    name: 'Mukhyamantri Saur Krushi Pump Yojana (PM-KUSUM Component B)',
    marathiName: 'मुख्यमंत्री सौर कृषी पंप योजना / कुसुम योजना',
    hindiName: 'मुख्यमंत्री सौर कृषि पंप योजना / पीएम-कुसुम',
    category: 'irrigation',
    itemType: 'scheme',
    department: 'Energy Department / MSEDCL & MEDA (Joint with Agriculture)',
    level: 'joint',
    shortDescription: 'Off-grid solar agricultural water pumps with 90%–95% subsidy for farmers without conventional electric connections.',
    detailedDescription: 'Flagship programme offering 3 HP, 5 HP, and 7.5 HP standalone DC solar agriculture pumps. General category farmers pay only 10% of the benchmark cost, while SC/ST farmers pay only 5%, with 90%–95% covered by Central (PM-KUSUM) and State Government subsidies.',
    intendedBeneficiaries: 'Farmers holding agricultural land with assured water source but lacking conventional electricity grid connection.',
    eligibilityRequirements: [
      'Applicant must own agricultural land with verified water source (well, borewell, or farm pond).',
      'No pre-existing conventional electricity grid connection for agricultural pump on the land.',
      'Landholding criteria: Up to 2.5 acres -> 3 HP pump; 2.5 to 5 acres -> 5 HP pump; Above 5 acres -> 7.5 HP pump.',
    ],
    benefits: [
      'General category farmers receive 90% subsidy (pay only 10% beneficiary share).',
      'SC and ST farmers receive 95% subsidy (pay only 5% beneficiary share).',
      'Uninterrupted daytime solar power for farm irrigation, eliminating dependency on night electricity schedules.',
    ],
    requiredDocuments: [
      '7/12 and 8-A land record extract (not older than 3 months)',
      'Aadhaar Card',
      'Caste Certificate (for SC/ST farmers claiming 95% subsidy rate)',
      'Water source certificate / photo of well/borewell',
      'No-dues / No-electric connection declaration from MSEDCL',
    ],
    applicationProcess: [
      'Apply online on the official MSEDCL Solar Agriculture Pump portal (kusum.mahadiscom.in).',
      'Enter consumer/farmer details, upload 7/12 extract, and submit required documents.',
      'After preliminary scrutiny, pay the beneficiary share online.',
      'Authorized solar vendor executes site installation and commissioning within 90 days.',
    ],
    officialApplicationUrl: 'https://kusum.mahadiscom.in',
    officialApplicationLabel: 'Apply on Mahadiscom Solar Portal',
    sourceUrl: 'https://www.mahadiscom.in/solar_mskpy/index.html',
    sourceTitle: 'Guidelines for Mukhyamantri Saur Krushi Pump Yojana & PM-KUSUM, MSEDCL & Ministry of New and Renewable Energy, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    keywords: ['solar pump', 'kusum', 'saur krushi pump', 'msedcl', 'irrigation pump', 'solar subsidy'],
  },

  // --- CATEGORY 5: CROP INSURANCE ---
  {
    id: 'pmfby-crop-insurance',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY — ₹1 Token Scheme in Maharashtra)',
    marathiName: 'प्रधानमंत्री पीक विमा योजना (सर्वसमावेशक ₹१ शेतकरी हिस्सा योजना)',
    hindiName: 'प्रधानमंत्री फसल बीमा योजना (महाराष्ट्र ₹1 योजना)',
    category: 'insurance',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra (Central + State)',
    level: 'joint',
    shortDescription: 'Comprehensive crop insurance where Maharashtra farmers pay only ₹1 token premium, with state paying remaining premium.',
    detailedDescription: 'Under the Sarv Samaveshak Pika Vima Yojana in Maharashtra, farmers pay only ₹1 per application to insure their notified crops for Kharif and Rabi seasons. The entire remaining actuarial premium share is paid by the Government of Maharashtra and Government of India.',
    intendedBeneficiaries: 'All loanee and non-loanee farmers cultivating notified food crops, oilseeds, and commercial crops.',
    eligibilityRequirements: [
      'Farmer must have sown notified crops in notified insurance units (revenue circles/villages) for the respective season.',
      'Landholding 7/12 extract with crop recorded via E-Pik Pahani digital crop survey.',
      'Application must be submitted before seasonal notification deadlines (typically July 31 for Kharif season).',
    ],
    benefits: [
      'Farmer pays only ₹1 token premium per application.',
      'Covers non-preventable risks: prevented sowing, localized calamities (hailstorm, landslide, inundation), mid-season adversity, and post-harvest losses.',
      'Claims assessed transparently via Crop Cutting Experiments (CCEs) and satellite/weather index data.',
    ],
    requiredDocuments: [
      '7/12 land extract and 8-A holding certificate',
      'Crop Sowing Certificate (Self-declaration or E-Pik Pahani record)',
      'Aadhaar Card',
      'Bank passbook copy with IFSC code',
    ],
    applicationProcess: [
      'Apply online via PMFBY national portal (pmfby.gov.in) or nearest Common Service Centre (CSC) / Aaple Sarkar Kendra.',
      'Pay ₹1 token fee online.',
      'Receive official insurance receipt with Policy / Application number.',
      'In case of localized damage (e.g. cloudburst, hailstorm), intimate within 72 hours via the Crop Insurance App or toll-free helpline.',
    ],
    officialApplicationUrl: 'https://pmfby.gov.in',
    officialApplicationLabel: 'Apply on PMFBY Official Portal',
    sourceUrl: 'https://pmfby.gov.in',
    sourceTitle: 'Government Resolution on Sarv Samaveshak Pika Vima Yojana, Agriculture Dept, Govt of Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['nashik-agriculture', 'pune-collectorate'],
    keywords: ['pmfby', 'crop insurance', '1 rupee insurance', 'pika vima', 'kharif', 'rabi', 'crop loss'],
  },
  {
    id: 'wbcis-fruit-insurance',
    name: 'Weather-Based Crop Insurance Scheme (WBCIS — Fruit Crops)',
    marathiName: 'पुनर्रचित हवामान आधारित फळपीक विमा योजना',
    hindiName: 'पुनर्गठित मौसम आधारित फल फसल बीमा योजना',
    category: 'insurance',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'joint',
    shortDescription: 'Weather index insurance protecting orchards against unseasonal rain, frost, high winds, and temperature extremes.',
    detailedDescription: 'Specialized weather index insurance protecting commercial fruit crops (grapes, pomegranate, banana, orange, mango, sweet lime, guava) against localized climatic perils recorded by automated reference weather stations across Maharashtra.',
    intendedBeneficiaries: 'Fruit orchard growers holding cultivable land with bearing fruit trees in notified talukas.',
    eligibilityRequirements: [
      'Must cultivate notified fruit crop in notified revenue circles with established reference weather stations.',
      'Fruit trees must have reached notified minimum productive age.',
      '7/12 extract must record fruit crop area.',
    ],
    benefits: [
      'Objective compensation triggered automatically when automated weather stations record temperature, rain, or humidity exceeding trigger thresholds.',
      'No individual field crop-cutting experiments needed for weather-triggered payouts.',
    ],
    requiredDocuments: [
      '7/12 land extract and 8-A holding sheet',
      'Orchard area certificate / E-Pik Pahani entry',
      'Aadhaar card and bank passbook',
    ],
    applicationProcess: [
      'Apply online on PMFBY portal (pmfby.gov.in) choosing "Restructured Weather Based Crop Insurance (RWBCIS)".',
      'Submit prescribed farmer premium share before seasonal cut-off date.',
    ],
    officialApplicationUrl: 'https://pmfby.gov.in',
    officialApplicationLabel: 'Apply on PMFBY Portal',
    sourceUrl: 'https://krishi.maharashtra.gov.in',
    sourceTitle: 'Operational Guidelines for Weather Based Fruit Crop Insurance Scheme, Govt of Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['fruit insurance', 'wbcis', 'orchard insurance', 'weather index', 'grapes', 'pomegranate', 'mango'],
  },

  // --- CATEGORY 6: SOIL HEALTH & TESTING ---
  {
    id: 'soil-health-card',
    name: 'Soil Health Card Scheme & Soil Testing Laboratories',
    marathiName: 'मृदा आरोग्य पत्रिका योजना व माती परीक्षण प्रयोगशाळा',
    hindiName: 'मृदा स्वास्थ्य कार्ड योजना और मिट्टी परीक्षण',
    category: 'soil_health',
    itemType: 'service',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'joint',
    shortDescription: 'Free or nominal-cost scientific soil testing determining 12 nutrient parameters and customized fertilizer advisories.',
    detailedDescription: 'National soil health service analyzing agricultural soil samples for 12 essential parameters: Primary nutrients (N, P, K), Secondary nutrients (S), Micronutrients (Zn, Fe, Cu, Mn, Bo), and Physical parameters (pH, EC, Organic Carbon). Farmers receive personalized dosage advice to prevent over-fertilization.',
    intendedBeneficiaries: 'All agricultural landholders in Maharashtra.',
    eligibilityRequirements: [
      'Open to all farmers owning or cultivating agricultural land in Maharashtra.',
      'Soil sample must be collected according to scientific grid protocols (after crop harvest and before new fertilization).',
    ],
    benefits: [
      'Scientific assessment of soil fertility and nutrient deficiencies.',
      'Customized crop-wise fertilizer dosage recommendations saving input costs.',
      'Soil Health Card issued every 3 years with online access on national database.',
    ],
    requiredDocuments: [
      'Farmer Name and Contact details',
      'Survey / Group number of the land parcel (7/12 extract copy)',
    ],
    applicationProcess: [
      'Collect soil sample from 4–5 zigzag spots in the field (15 cm depth for field crops) and mix thoroughly.',
      'Submit 500g labeled sample to nearest government/cooperative Soil Testing Laboratory or Agriculture Assistant.',
      'Track testing status and download Soil Health Card from soilhealth.dac.gov.in.',
    ],
    officialApplicationUrl: 'https://soilhealth.dac.gov.in',
    officialApplicationLabel: 'Access Soil Health Card Portal',
    sourceUrl: 'https://soilhealth.dac.gov.in',
    sourceTitle: 'National Guidelines for Soil Health Card Scheme, Department of Agriculture & Farmers Welfare, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['nashik-agriculture'],
    keywords: ['soil health card', 'soil testing', 'fertilizer recommendation', 'soil lab', 'mati parikshan'],
  },
  {
    id: 'paramparagat-krishi-vikas',
    name: 'Paramparagat Krishi Vikas Yojana (PKVY — Organic Farming)',
    marathiName: 'परंपरागत कृषी विकास योजना (सेंद्रिय शेती अभियान)',
    hindiName: 'परंपरागत कृषि विकास योजना (जैविक खेती)',
    category: 'soil_health',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra (Central + State)',
    level: 'joint',
    shortDescription: 'Financial assistance of ₹50,000 per hectare for cluster-based organic farming adoption, certification, and packaging.',
    detailedDescription: 'Comprehensive organic farming promotion initiative supporting farmers in clusters of 20 or more. Funds cover organic inputs, bio-fertilizers, vermicompost units, Participatory Guarantee System (PGS-India) certification, and direct marketing linkages.',
    intendedBeneficiaries: 'Farmer groups and individual landholders forming organic clusters in Maharashtra.',
    eligibilityRequirements: [
      'Farmer must be willing to commit land to chemical-free organic farming for minimum 3 conversion years.',
      'Cluster formation: Minimum 20 farmers or 20–50 hectares continuous land area.',
    ],
    benefits: [
      '₹50,000 per hectare financial assistance over 3 years (₹31,000 for on-farm organic inputs via DBT).',
      'Free Participatory Guarantee System (PGS-India) organic certification.',
      'Support for organic produce packaging, branding, and farmer market stalls.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      '7/12 and 8-A landholding extracts',
      'Cluster formation resolution / Self-declaration form',
      'Bank passbook details',
    ],
    applicationProcess: [
      'Form or join a local Organic Farming Group (FPG) coordinated by the Taluka Agriculture Officer (TAO).',
      'Register cluster on the PGS-India portal (pgsindia-ncof.gov.in).',
      'Receive approved organic inputs and annual DBT assistance installments.',
    ],
    officialApplicationUrl: 'https://pgsindia-ncof.gov.in',
    officialApplicationLabel: 'Visit PGS-India Organic Portal',
    sourceUrl: 'https://krishi.maharashtra.gov.in',
    sourceTitle: 'Guidelines for Paramparagat Krishi Vikas Yojana (PKVY), Ministry of Agriculture & Farmers Welfare, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['organic farming', 'pkvy', 'sendriya sheti', 'vermicompost', 'bio-fertilizer', 'pgs india'],
  },

  // --- CATEGORY 7: FARMER REGISTRATION & DOCUMENTS ---
  {
    id: 'mahadbt-farmer-registration',
    name: 'MahaDBT Farmer Profile & Unified Registration',
    marathiName: 'महाडीबीटी शेतकरी प्रोफाइल नोंदणी',
    hindiName: 'महाडीबीटी किसान प्रोफाइल पंजीकरण',
    category: 'farmer_registry',
    itemType: 'service',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Mandatory digital registration profile on Maharashtra government portal to access all state agriculture subsidies.',
    detailedDescription: 'The core digital identity platform for farmers in Maharashtra. Registering a verified farmer profile on MahaDBT with Aadhaar authentication and 7/12 land mapping enables single-window application for all state and central agricultural schemes without paper submissions.',
    intendedBeneficiaries: 'All farmers residing in Maharashtra seeking agricultural subsidies and assistance.',
    eligibilityRequirements: [
      'Resident farmer of Maharashtra.',
      'Possesses valid Aadhaar card with active mobile number for biometric / OTP authentication.',
    ],
    benefits: [
      'Single unified login across all agricultural departments: agriculture, horticulture, animal husbandry, and agricultural engineering.',
      'Paperless DBT processing with direct subsidy transfer into Aadhaar-seeded accounts.',
      'Transparent computerized selection tracking and SMS alerts.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Digital 7/12 extract and 8-A holding sheet',
      'Bank passbook details',
      'Caste certificate (if applying under SC/ST reserved subsidy quotas)',
    ],
    applicationProcess: [
      'Visit mahadbt.maharashtra.gov.in/farmer and click "New Farmer Registration".',
      'Complete Aadhaar authentication (OTP or Biometric at CSC).',
      'Fill profile details: Personal info, Address, Landholding (District, Taluka, Village, Survey No).',
      'Upload required documents once to maintain permanent profile for all scheme lotteries.',
    ],
    officialApplicationUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
    officialApplicationLabel: 'Register on MahaDBT Farmer Portal',
    sourceUrl: 'https://mahadbt.maharashtra.gov.in/farmer',
    sourceTitle: 'MahaDBT Farmer Registration User Manual, Govt of Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['pune-collectorate', 'nashik-agriculture'],
    keywords: ['mahadbt', 'farmer registration', 'farmer id', 'profile registration', 'agri login', 'e-kyc'],
  },
  {
    id: 'digital-7-12-records',
    name: 'Digital 7/12 & 8-A Land Record Service (Mahabhulekh)',
    marathiName: 'डिजिटल ७/१२ व ८-अ भूलेख सेवा',
    hindiName: 'डिजिटल 7/12 और 8-A भूमि रिकॉर्ड सेवा',
    category: 'farmer_registry',
    itemType: 'service',
    department: 'Revenue & Forest Department, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Instant online viewing and digitally signed download of 7/12 ownership extracts and 8-A holding sheets.',
    detailedDescription: 'Official electronic land records platform providing access to Village Form VII (rights & ownership) and Form XII (crop records), together with Form 8-A (tax assessment and total holding). Digitally signed extracts with QR codes are legally valid for all government schemes, subsidies, and bank crop loans.',
    intendedBeneficiaries: 'All agricultural landholders and cultivators in Maharashtra.',
    eligibilityRequirements: [
      'Open to any citizen or farmer knowing the District, Taluka, Village, and Survey / Group Number.',
    ],
    benefits: [
      'Instant viewing of uncertified 7/12 and 8-A records at zero cost on Mahabhulekh.',
      'Legally valid digitally signed extracts with QR code verifiable by financial institutions on digital satbara portal.',
      'Eliminates the need to physically visit Talathi offices for routine scheme submissions.',
    ],
    requiredDocuments: [
      'District, Taluka, and Village name',
      'Survey Number, Group Number, or Landholder Name',
    ],
    applicationProcess: [
      'For viewing: Visit bhulekh.mahabhumi.gov.in, select division, district, taluka, village, and survey number.',
      'For digitally signed copy: Visit digitalsatbara.mahabhumi.gov.in, log in, pay nominal fee (₹15), and download authenticated PDF with QR code.',
    ],
    officialApplicationUrl: 'https://bhulekh.mahabhumi.gov.in',
    officialApplicationLabel: 'View on Mahabhulekh Portal',
    sourceUrl: 'https://bhulekh.mahabhumi.gov.in',
    sourceTitle: 'e-Mahabhumi Land Records Modernization Guidelines, Revenue Dept, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    relatedOffices: ['pune-tahsil-city', 'mumbai-city-collectorate'],
    keywords: ['7/12', 'satbara', '8-a', 'mahabhulekh', 'land records', 'revenue extract', 'digital 7/12'],
  },
  {
    id: 'e-pik-pahani',
    name: 'E-Pik Pahani (Digital Mobile Crop Survey)',
    marathiName: 'ई-पीक पाहणी (मोबाईल पीक नोंदणी ॲप)',
    hindiName: 'ई-पीक पाहणी (डिजिटल फसल सर्वेक्षण)',
    category: 'farmer_registry',
    itemType: 'service',
    department: 'Revenue & Forest Department & Agriculture Department, Maharashtra',
    level: 'state',
    shortDescription: 'Mobile app enabling farmers to self-register their sown crops directly onto their official 7/12 land records.',
    detailedDescription: 'Collaborative initiative between Revenue and Agriculture departments enabling farmers to report their standing crops via GPS-tagged photos on Android smartphones. The recorded data feeds directly into the official Form 12 of land records and is mandatory for crop insurance claims and MSP sales.',
    intendedBeneficiaries: 'Cultivators and landholding farmers sowing seasonal crops across Maharashtra.',
    eligibilityRequirements: [
      'Farmer must hold land registered on 7/12 extract.',
      'Survey must be recorded within the field boundary using the official GPS-enabled mobile app during the notified seasonal window.',
    ],
    benefits: [
      'Direct recording of crop names in 7/12 extract Form 12 without intermediary delays.',
      'Mandatory prerequisite for seamless PMFBY crop insurance claim settlements.',
      'Essential for selling produce at Minimum Support Price (MSP) government procurement centers.',
    ],
    requiredDocuments: [
      '7/12 extract details (District, Taluka, Village, Survey No)',
      'Aadhaar-linked mobile phone with GPS location enabled',
    ],
    applicationProcess: [
      'Download the official "E-Pik Pahani" app from Google Play Store.',
      'Register with mobile number and select district, taluka, village, and survey number.',
      'Stand inside the cultivated crop plot, take a GPS-tagged photograph of the crop, and upload.',
      'Record is verified and synchronized with the digital 7/12 database within 48–72 hours.',
    ],
    officialApplicationUrl: 'https://krishi.maharashtra.gov.in',
    officialApplicationLabel: 'Learn More on Agriculture Portal',
    sourceUrl: 'https://krishi.maharashtra.gov.in',
    sourceTitle: 'Joint Resolution on Implementation of E-Pik Pahani, Revenue & Agriculture Departments, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['e-pik pahani', 'crop survey', 'form 12', 'pika chi nond', 'crop photography', 'crop record'],
  },

  // --- CATEGORY 8: AGRICULTURAL MARKETING ---
  {
    id: 'enam-national-market',
    name: 'e-NAM (National Agriculture Market)',
    marathiName: 'ई-नाम राष्ट्रीय कृषी बाजार',
    hindiName: 'ई-नाम राष्ट्रीय कृषि बाजार',
    category: 'marketing',
    itemType: 'service',
    department: 'Ministry of Agriculture & Farmers Welfare, GoI (with MSAMB Maharashtra)',
    level: 'joint',
    shortDescription: 'Pan-India electronic trading portal connecting APMC mandis for transparent price discovery and online bidding.',
    detailedDescription: 'National online platform networking regulated Agricultural Produce Market Committee (APMC) mandis across India. In Maharashtra, over 130 major APMCs are integrated on e-NAM, enabling farmers to access buyers nationwide, view real-time market prices, and receive electronic payments.',
    intendedBeneficiaries: 'Farmers selling grains, pulses, oilseeds, fruits, and vegetables through regulated mandis.',
    eligibilityRequirements: [
      'Farmer with agricultural produce brought to an e-NAM integrated APMC market yard.',
      'Possesses valid bank account for direct payment settlement.',
    ],
    benefits: [
      'Transparent electronic bidding eliminates cartelization and ensures fair price discovery.',
      'Real-time access to commodity prices across mandis on smartphone app.',
      'Direct online payment into farmer bank accounts within 24 hours of auction acceptance.',
      'Quality assaying facilities available at integrated mandi gates.',
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Bank account passbook copy',
      '7/12 extract or farmer registration slip',
    ],
    applicationProcess: [
      'Bring agricultural produce to the gate of an e-NAM integrated APMC.',
      'Gate entry is recorded and lot number generated with quality assaying.',
      'Traders submit bids electronically on the e-NAM portal.',
      'Farmer reviews highest bid on mobile app or display board and accepts or rejects the auction.',
    ],
    officialApplicationUrl: 'https://enam.gov.in',
    officialApplicationLabel: 'Visit e-NAM National Portal',
    sourceUrl: 'https://enam.gov.in',
    sourceTitle: 'e-NAM Operational Guidelines, Small Farmers Agribusiness Consortium (SFAC), GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    keywords: ['enam', 'apmc market', 'agricultural marketing', 'mandi price', 'bidding', 'commodity sales'],
  },
  {
    id: 'msamb-marketing-board',
    name: 'Maharashtra State Agricultural Marketing Board (MSAMB / Panan Mandal)',
    marathiName: 'महाराष्ट्र राज्य कृषी पणन मंडळ (पणन मंडळ सेवा)',
    hindiName: 'महाराष्ट्र राज्य कृषि विपणन बोर्ड (पणन बोर्ड)',
    category: 'marketing',
    itemType: 'service',
    department: 'Co-operation, Marketing and Textiles Department, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Post-harvest infrastructure, export pre-cooling facilities, cold storage, and direct farmer-to-consumer weekly markets.',
    detailedDescription: 'Apex state marketing organization facilitating export development for Alphonso mangoes, grapes, pomegranate, and onions; providing cold storage subsidy, modern packaging infrastructure, and organizing Shetkari Athavade Bazar (weekly farmer markets) across urban centers.',
    intendedBeneficiaries: 'Farmer Producer Companies (FPCs), horticulture cultivators, and individual farmers in Maharashtra.',
    eligibilityRequirements: [
      'Individual farmers, cooperatives, or registered Farmer Producer Organizations in Maharashtra.',
    ],
    benefits: [
      'Subsidized access to irradiation, vapor heat treatment, and pre-cooling facilities for agricultural exports.',
      'Market intelligence, daily mandi rates, and grain storage pledge finance schemes (74% advance on stored grains).',
      'Direct retail stalls at urban weekly farmer markets eliminating middleman margins.',
    ],
    requiredDocuments: [
      'Farmer / FPC Registration details',
      '7/12 extract confirming farm production',
      'Aadhaar card and bank account',
    ],
    applicationProcess: [
      'Explore marketing facilities, training programmes, and daily market rates on msamb.com.',
      'Contact nearest MSAMB division office (Pune, Nashik, Vashi, Nagpur, Chhatrapati Sambhajinagar) for export facility bookings.',
    ],
    officialApplicationUrl: 'https://www.msamb.com',
    officialApplicationLabel: 'Visit MSAMB Official Portal',
    sourceUrl: 'https://www.msamb.com',
    sourceTitle: 'Annual Administrative Report & Export Directives, Maharashtra State Agricultural Marketing Board',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['msamb', 'panan mandal', 'farmer market', 'cold storage', 'export pre-cooling', 'athavade bazar'],
  },
  {
    id: 'msp-procurement-centers',
    name: 'Minimum Support Price (MSP) Procurement Centers',
    marathiName: 'किमान आधारभूत किंमत (हमीभाव) खरेदी केंद्रे',
    hindiName: 'न्यूनतम समर्थन मूल्य (एमएसपी) खरीद केंद्र',
    category: 'marketing',
    itemType: 'service',
    department: 'Food, Civil Supplies & Consumer Protection & Agriculture Departments, Maharashtra',
    level: 'joint',
    shortDescription: 'Government-guaranteed price procurement centers for soybean, cotton, paddy, pulses, and coarse grains.',
    detailedDescription: 'Seasonal procurement system established by Government of Maharashtra through state marketing federations and NAFED ensuring farmers receive at least the declared Minimum Support Price for eligible agricultural commodities when market prices drop below MSP.',
    intendedBeneficiaries: 'Maharashtra farmers cultivating notified Kharif and Rabi crops seeking government procurement.',
    eligibilityRequirements: [
      'Farmer must have recorded the specific crop in their 7/12 extract via E-Pik Pahani.',
      'Produce must satisfy Fair Average Quality (FAQ) moisture and foreign matter specifications.',
      'Mandatory pre-registration on the state procurement portal before seasonal deadlines.',
    ],
    benefits: [
      'Guaranteed purchase price preventing distress sales during harvest glut periods.',
      'Payment transferred directly to farmer Aadhaar-linked bank accounts via DBT.',
    ],
    requiredDocuments: [
      '7/12 extract with crop recorded via E-Pik Pahani',
      'Aadhaar Card',
      'Bank passbook copy showing IFSC and account details',
    ],
    applicationProcess: [
      'Register online at designated APMC / PACS procurement center with 7/12 extract.',
      'Receive SMS notification indicating assigned date and slot to deliver produce.',
      'Bring produce to center for quality testing (moisture meter inspection) and obtain weighing receipt.',
    ],
    officialApplicationUrl: 'https://mahafood.gov.in',
    officialApplicationLabel: 'View Procurement Schedules on Mahafood',
    sourceUrl: 'https://mahafood.gov.in',
    sourceTitle: 'MSP Procurement Directives for Kharif/Rabi Seasons, Food & Civil Supplies Dept, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['msp', 'minimum support price', 'hamibhav', 'paddy procurement', 'soybean msp', 'cotton msp'],
  },

  // --- CATEGORY 9: TRAINING & ADVISORY ---
  {
    id: 'krishi-vigyan-kendra',
    name: 'Krishi Vigyan Kendra (KVK) Extension & Training Network',
    marathiName: 'कृषी विज्ञान केंद्र (केव्हीके) प्रशिक्षण व विस्तार नेटवर्क',
    hindiName: 'कृषि विज्ञान केंद्र (केवीके) प्रशिक्षण नेटवर्क',
    category: 'training_advisory',
    itemType: 'service',
    department: 'Indian Council of Agricultural Research (ICAR) & State Agricultural Universities',
    level: 'joint',
    shortDescription: 'District-level agricultural science centers providing vocational farmer training, on-farm trials, and certified seeds.',
    detailedDescription: 'Network of over 50 Krishi Vigyan Kendras across Maharashtra districts operating under agricultural universities (MPKV Rahuri, VNMKV Parbhani, PDKV Akola, DBSKKV Dapoli). They conduct hands-on training in pest control, organic farming, livestock rearing, and supply certified seeds.',
    intendedBeneficiaries: 'Farmers, farm women, and rural youth seeking agricultural skill enhancement.',
    eligibilityRequirements: [
      'Open to all farmers and rural entrepreneurs in the respective district.',
    ],
    benefits: [
      'Free or highly subsidized vocational training courses in nursery management, beekeeping, dairy, and crop management.',
      'On-farm demonstrations of new high-yielding, drought-resilient seed varieties.',
      'Access to certified foundation seeds, bio-pesticides, and mineral mixtures produced at KVK farms.',
    ],
    requiredDocuments: [
      'Identity Proof (Aadhaar Card)',
      'Basic contact details',
    ],
    applicationProcess: [
      'Locate your district KVK on kvk.icar.gov.in or contact the District Superintending Agriculture Officer.',
      'Enroll in scheduled seasonal training workshops or request field guidance directly from KVK scientists.',
    ],
    officialApplicationUrl: 'https://kvk.icar.gov.in',
    officialApplicationLabel: 'Locate Your District KVK',
    sourceUrl: 'https://kvk.icar.gov.in',
    sourceTitle: 'Agricultural Technology Application Research Institute (ATARI) KVK Directory, ICAR, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['kvk', 'krishi vigyan kendra', 'farmer training', 'certified seeds', 'icar', 'extension service'],
  },
  {
    id: 'kisan-call-centre',
    name: 'Kisan Call Centre (Toll-Free 1800-180-1551)',
    marathiName: 'किसान कॉल सेंटर (टोल-फ्री १८००-१८०-१५५१)',
    hindiName: 'किसान कॉल सेंटर (टोल-फ्री 1800-180-1551)',
    category: 'training_advisory',
    itemType: 'service',
    department: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    level: 'central',
    shortDescription: 'Free toll-free telephone advisory answering farmer queries on crops, pests, fertilizers, and weather in Marathi.',
    detailedDescription: 'National toll-free telephone service operating 365 days a year from 6:00 AM to 10:00 PM. Calls are answered by agricultural graduates in Marathi, providing instant solutions for pest infestation, crop disease, fertilizer calculation, and mandi prices.',
    intendedBeneficiaries: 'Any farmer across Maharashtra with access to a landline or mobile phone.',
    eligibilityRequirements: [
      'Free service available to all farmers without any application or paperwork.',
    ],
    benefits: [
      'Immediate expert advice in Marathi from qualified agricultural specialists.',
      'Call escalated to university subject-matter specialists if query is complex.',
      'Follow-up SMS summary sent directly to caller phone for reference.',
    ],
    requiredDocuments: [
      'No documents required (toll-free public telephone helpline for all farmers).',
    ],
    applicationProcess: [
      'Dial toll-free number 1800-180-1551 from any mobile or landline phone.',
      'Select Marathi language option.',
      'Explain your crop situation or question to the Agriculture Graduate.',
    ],
    officialApplicationUrl: 'https://dackkms.gov.in',
    officialApplicationLabel: 'Visit Kisan Call Centre Portal',
    sourceUrl: 'https://dackkms.gov.in',
    sourceTitle: 'Kisan Knowledge Management System, Department of Agriculture & Farmers Welfare, GoI',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['kisan call centre', 'toll free helpline', '1800-180-1551', 'marathi advisory', 'pest help'],
  },
  {
    id: 'cropsap-advisory',
    name: 'CROPSAP — Crop Pest & Disease Surveillance & Advisory',
    marathiName: 'क्रॉपसॅप — कीड व रोग सर्वेक्षण व सल्ला प्रकल्प',
    hindiName: 'क्रॉपसॅप — कीट एवं रोग निगरानी प्रणाली',
    category: 'training_advisory',
    itemType: 'service',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Statewide digital surveillance issuing real-time pest alerts and integrated pest management advisories.',
    detailedDescription: 'Maharashtra government monitoring system tracking key pests and diseases across soybean, cotton, pigeonpea, chickpea, and rice. Field scouts upload real-time pest count data, triggering automatic village-level advisories and control measures when Economic Threshold Levels (ETL) are breached.',
    intendedBeneficiaries: 'Farmers cultivating major field crops in Maharashtra vulnerable to seasonal pest outbreaks.',
    eligibilityRequirements: [
      'Advisory information is publicly available to all farmers in Maharashtra.',
    ],
    benefits: [
      'Early warning notifications preventing severe pest attacks (e.g. pink bollworm, fall armyworm).',
      'Scientific Integrated Pest Management (IPM) advisories reducing unnecessary chemical pesticide expenses.',
    ],
    requiredDocuments: [
      'No documents required (public open-access pest surveillance advisories and bulletins).',
    ],
    applicationProcess: [
      'Check weekly pest advisories published on cropsap.maharashtra.gov.in and local Agriculture Assistant notice boards.',
      'Subscribe to SMS pest alerts through MahaDBT or local Taluka Agriculture Office.',
    ],
    officialApplicationUrl: 'https://cropsap.maharashtra.gov.in',
    officialApplicationLabel: 'View Real-time Pest Alerts on CROPSAP',
    sourceUrl: 'https://cropsap.maharashtra.gov.in',
    sourceTitle: 'CROPSAP Operational Framework, Commissionerate of Agriculture, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['cropsap', 'pest advisory', 'disease alert', 'pink bollworm', 'ipm', 'crop protection'],
  },

  // --- CATEGORY 10: DISASTER & CROP-LOSS ASSISTANCE ---
  {
    id: 'sdrf-calamity-relief',
    name: 'SDRF / NDRF Natural Calamity Crop-Loss Input Subsidy',
    marathiName: 'नैसर्गिक आपत्ती पीक नुकसान भरपाई (एसडीआरएफ / एनडीआरएफ अनुदान)',
    hindiName: 'प्राकृतिक आपदा फसल क्षति इनपुट सब्सिडी (एसडीआरएफ)',
    category: 'disaster_relief',
    itemType: 'scheme',
    department: 'Revenue & Forest Department & Agriculture Department, Maharashtra',
    level: 'joint',
    shortDescription: 'Direct financial assistance for farmers suffering over 33% crop damage due to unseasonal rain, floods, or drought.',
    detailedDescription: 'Government disaster relief assistance providing per-hectare cash compensation for farmers whose crops suffer 33% or more damage from declared natural calamities (unseasonal rains, hailstorms, flash floods, or severe drought). Assessed through joint field inspections (Panchnama) by Revenue and Agriculture officers.',
    intendedBeneficiaries: 'Landholding farmers in declared calamity-hit revenue circles whose crops suffer verified 33%+ losses.',
    eligibilityRequirements: [
      'Land parcel must be located in a notified calamity-affected revenue circle.',
      'Crop loss must exceed statutory threshold of 33% as verified by official joint Panchnama.',
      'Compensation assistance capped at maximum 2 to 3 hectares per farmer as per applicable Government Resolution.',
    ],
    benefits: [
      'Per-hectare input subsidy based on crop category (Rainfed / Bagayat / Perennial Fruit Orchards).',
      'Assistance credited directly into farmer Aadhaar-linked bank account without application fees.',
      'Separate and additional to any PMFBY crop insurance claim payments.',
    ],
    requiredDocuments: [
      'Joint Panchnama record prepared by Talathi, Agriculture Assistant, and Gram Sevak',
      '7/12 land extract and 8-A holding sheet',
      'Aadhaar Card and bank account passbook copy',
    ],
    applicationProcess: [
      'When natural calamity occurs, the local administration conducts on-site joint Panchnama across affected plots.',
      'Beneficiary list with bank account details is displayed at Gram Panchayat and Taluka Tahsil office.',
      'Eligible farmers verify their Aadhaar bank linkage, and assistance is deposited directly via DBT.',
    ],
    officialApplicationUrl: 'https://revenue.maharashtra.gov.in',
    officialApplicationLabel: 'View Disaster Circulars on Revenue Portal',
    sourceUrl: 'https://revenue.maharashtra.gov.in',
    sourceTitle: 'Disaster Management & SDRF Input Subsidy Operational Norms, Revenue & Forest Dept, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: true,
    relatedOffices: ['pune-collectorate', 'pune-tahsil-city'],
    keywords: ['sdrf', 'calamity relief', 'panchnama', 'crop damage', 'unseasonal rain', 'drought assistance'],
  },
  {
    id: 'gopinath-munde-apghat-vima',
    name: 'Gopinath Munde Shetkari Apghat Suraksha Sanugrah Anudan Yojana',
    marathiName: 'गोपीनाथ मुंडे शेतकरी अपघात सुरक्षा सानुग्रह अनुदान योजना',
    hindiName: 'गोपीनाथ मुंडे किसान दुर्घटना सुरक्षा अनुदान योजना',
    category: 'disaster_relief',
    itemType: 'scheme',
    department: 'Department of Agriculture, Government of Maharashtra',
    level: 'state',
    shortDescription: 'Ex-gratia financial grant of up to ₹2,00,000 to family of a registered farmer in the event of accidental death or permanent disability.',
    detailedDescription: 'Maharashtra state social security scheme providing ex-gratia compensation of ₹2,00,000 to legal heirs of landholding farmers aged 10 to 75 years who lose their lives in farm-related or accidental incidents (electric shock, tractor accident, snake bite, drowning in well, road accident).',
    intendedBeneficiaries: 'Nominees and legal heirs of registered landholding farmers (aged 10–75 years) registered on 7/12 in Maharashtra.',
    eligibilityRequirements: [
      'Deceased or disabled individual must be a registered landholder on a 7/12 extract in Maharashtra, or an active family member.',
      'Age between 10 and 75 years at the time of the incident.',
      'Accident must be non-intentional (road accident, electric shock, snake bite, drowning, farm machinery accident).',
      'Claim must be submitted within 30 days of the incident to the Taluka Agriculture Officer.',
    ],
    benefits: [
      'Ex-gratia grant of ₹2,00,000 in case of accidental death.',
      'Grant of ₹2,00,000 for permanent total disability (loss of both limbs or both eyes).',
      'Grant of ₹1,00,000 for partial permanent disability (loss of one limb or one eye).',
    ],
    requiredDocuments: [
      'Certified copy of 7/12 extract showing deceased/injured farmer or parent name',
      'Police FIR / First Information Report or Inquest Panchnama',
      'Post Mortem Report and Death Certificate (in death cases)',
      'Civil Surgeon Disability Certificate (in disability cases)',
      'Legal Heir Certificate and Bank Account details of nominee',
    ],
    applicationProcess: [
      'Submit physical application to the Taluka Agriculture Officer (TAO) within 30 days of the accident.',
      'TAO compiles documentation and submits to the Sub-Divisional Agriculture Officer (SDAO) committee.',
      'Committee approves and sanctions grant amount directly into the nominee bank account via DBT.',
    ],
    officialApplicationUrl: 'https://krishi.maharashtra.gov.in',
    officialApplicationLabel: 'Download Forms on Agriculture Portal',
    sourceUrl: 'https://krishi.maharashtra.gov.in',
    sourceTitle: 'Government Resolution on Gopinath Munde Shetkari Apghat Suraksha Yojana, Agriculture Dept, Maharashtra',
    lastVerified: '2026-11-24',
    verificationStatus: 'verified',
    isFeatured: false,
    keywords: ['gopinath munde', 'farmer accident', 'apghat vima', 'ex gratia', '2 lakh assistance', 'suraksha anudan'],
  },
];

// ============================================================================
// 5. SEARCH & FILTERING UTILITY
// ============================================================================
export function filterAgricultureItems(
  items: readonly AgricultureItem[],
  options: AgricultureFilterOptions = {}
): AgricultureItem[] {
  const query = options.query?.trim().toLowerCase() || '';
  const categoryFilter = options.category?.trim() || '';
  const departmentFilter = options.department?.trim() || '';
  const itemTypeFilter = options.itemType?.trim() || '';
  const verificationFilter = options.verificationStatus?.trim() || '';

  return items.filter((item) => {
    // Category Filter
    if (categoryFilter && categoryFilter !== 'all') {
      if (item.category !== categoryFilter) return false;
    }

    // Department Filter
    if (departmentFilter && departmentFilter !== 'all') {
      if (!item.department.toLowerCase().includes(departmentFilter.toLowerCase())) {
        return false;
      }
    }

    // Item Type Filter (scheme vs service)
    if (itemTypeFilter && itemTypeFilter !== 'all') {
      if (item.itemType !== itemTypeFilter) return false;
    }

    // Verification Status Filter
    if (verificationFilter && verificationFilter !== 'all') {
      if (item.verificationStatus !== verificationFilter) return false;
    }

    // Free text query across name, marathi/hindi names, description, department, beneficiaries, keywords
    if (query) {
      const matchName = item.name.toLowerCase().includes(query);
      const matchMrName = item.marathiName.toLowerCase().includes(query);
      const matchHiName = item.hindiName.toLowerCase().includes(query);
      const matchShortDesc = item.shortDescription.toLowerCase().includes(query);
      const matchDetailedDesc = item.detailedDescription.toLowerCase().includes(query);
      const matchDept = item.department.toLowerCase().includes(query);
      const matchBeneficiaries = item.intendedBeneficiaries.toLowerCase().includes(query);
      const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(query));

      if (
        !matchName &&
        !matchMrName &&
        !matchHiName &&
        !matchShortDesc &&
        !matchDetailedDesc &&
        !matchDept &&
        !matchBeneficiaries &&
        !matchKeywords
      ) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// 6. HELPER GETTERS
// ============================================================================
export function getAgricultureItemById(id: string): AgricultureItem | undefined {
  return VERIFIED_AGRICULTURE_ITEMS.find((item) => item.id === id);
}

export function getFeaturedAgricultureSchemes(): AgricultureItem[] {
  return VERIFIED_AGRICULTURE_ITEMS.filter((item) => item.isFeatured);
}

export function getItemsByCategory(category: AgricultureCategoryKey): AgricultureItem[] {
  return VERIFIED_AGRICULTURE_ITEMS.filter((item) => item.category === category);
}

export function getNonFinancialServices(): AgricultureItem[] {
  return VERIFIED_AGRICULTURE_ITEMS.filter((item) => item.itemType === 'service');
}

export function getAgricultureCategories(): readonly AgricultureCategoryInfo[] {
  return AGRICULTURE_CATEGORIES;
}

export function getAgricultureDepartments(): string[] {
  return Array.from(new Set(VERIFIED_AGRICULTURE_ITEMS.map((item) => item.department))).sort();
}
