import type { OfficialSource } from './types.ts';

/**
 * Allowlisted official government domain suffixes for curated external URLs.
 * Requires a valid subdomain under .gov.in or .nic.in (rejects bare root suffixes,
 * HTTP, embedded credentials, third-party domains, and spoofed subdomains).
 */
export const TRUSTED_OFFICIAL_HOST_SUFFIXES = ['.gov.in', '.nic.in'] as const;

export function isTrustedOfficialUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    return TRUSTED_OFFICIAL_HOST_SUFFIXES.some(
      (suffix) => host.endsWith(suffix) && host.length > suffix.length
    );
  } catch {
    return false;
  }
}

export const officialSources: Record<string, OfficialSource> = {
  src_mahadbt_ebc: {
    id: 'src_mahadbt_ebc',
    title: 'MahaDBT — Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavritti Scheme',
    publisher: 'Directorate of Higher & Technical Education, Government of Maharashtra',
    url: 'https://mahadbt.maharashtra.gov.in',
    lastCheckedDate: '2026-11-18',
    notes: 'MahaDBT uses session-bound ASP.NET scheme pages without permanent per-scheme URLs; navigate via Post-Matric Scholarship schemes on the portal.',
  },
  src_dhe_pune: {
    id: 'src_dhe_pune',
    title: 'Directorate of Higher Education, Maharashtra — Scholarship Portal',
    publisher: 'Directorate of Higher Education, Government of Maharashtra',
    url: 'https://dhepune.gov.in',
    lastCheckedDate: '2026-11-18',
    notes: 'Publishes annual DHE scholarship circulars and Government Resolutions; exact scheme circular URLs change per academic year.',
  },
  src_mahadbt_sc: {
    id: 'src_mahadbt_sc',
    title: 'MahaDBT — Government of India Post-Matric Scholarship for SC Students',
    publisher: 'Social Justice & Special Assistance Department, Government of Maharashtra',
    url: 'https://mahadbt.maharashtra.gov.in',
    lastCheckedDate: '2026-11-18',
    notes: 'MahaDBT does not expose a permanent deep link for individual scholarship pages; select Social Justice & Special Assistance Dept inside MahaDBT.',
  },
  src_sjsa_edu: {
    id: 'src_sjsa_edu',
    title: 'Social Justice & Special Assistance Dept — Education & Training Schemes',
    publisher: 'Social Justice & Special Assistance Department, Government of Maharashtra',
    url: 'https://sjsa.maharashtra.gov.in/en/scheme-category/education-and-training',
    lastCheckedDate: '2026-11-18',
    notes: 'Official Maharashtra SJSA department category page listing SC Post-Matric Scholarship and educational welfare schemes.',
  },
  src_pmkisan_portal: {
    id: 'src_pmkisan_portal',
    title: 'PM-KISAN Samman Nidhi Official Portal & Operational Guidelines',
    publisher: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    url: 'https://pmkisan.gov.in',
    lastCheckedDate: '2026-11-18',
    notes: 'Official national farmer registration, e-KYC, and beneficiary status portal.',
  },
  src_myscheme_pmkisan: {
    id: 'src_myscheme_pmkisan',
    title: 'myScheme — Pradhan Mantri Kisan Samman Nidhi',
    publisher: 'National e-Governance Division (NeGD), Government of India',
    url: 'https://www.myscheme.gov.in/schemes/pm-kisan',
    lastCheckedDate: '2026-11-18',
  },
  src_mahadbt_smam: {
    id: 'src_mahadbt_smam',
    title: 'MahaDBT Farmer — Sub-Mission on Agricultural Mechanization (SMAM)',
    publisher: 'Department of Agriculture, Government of Maharashtra',
    url: 'https://mahadbt.maharashtra.gov.in',
    lastCheckedDate: '2026-11-18',
    notes: 'MahaDBT Farmer uses session-bound login routes without a permanent public scheme URL; exact implement rupee ceilings vary by annual budget circular.',
  },
  src_pmegp_kvic: {
    id: 'src_pmegp_kvic',
    title: 'PMEGP Official e-Portal & Operational Guidelines',
    publisher: 'Khadi and Village Industries Commission (KVIC) / Ministry of MSME, GoI',
    url: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    lastCheckedDate: '2026-11-18',
  },
  src_myscheme_pmegp: {
    id: 'src_myscheme_pmegp',
    title: 'myScheme — Prime Minister Employment Generation Programme (PMEGP)',
    publisher: 'National e-Governance Division (NeGD), Government of India',
    url: 'https://www.myscheme.gov.in/schemes/pmegp',
    lastCheckedDate: '2026-11-18',
  },
  src_ladki_bahin_portal: {
    id: 'src_ladki_bahin_portal',
    title: 'Mukhyamantri — Majhi Ladki Bahin Yojana Official Portal',
    publisher: 'Women & Child Development Department, Government of Maharashtra',
    url: 'https://ladakibahin.maharashtra.gov.in',
    lastCheckedDate: '2026-11-18',
    notes: 'Official state scheme portal; check active notices for enrollment windows and e-KYC deadlines.',
  },
  src_myscheme_ladki_bahin: {
    id: 'src_myscheme_ladki_bahin',
    title: 'myScheme — Mukhyamantri Majhi Ladki Bahin Yojana',
    publisher: 'National e-Governance Division (NeGD), Government of India',
    url: 'https://www.myscheme.gov.in/schemes/mukhyamantri-majhi-ladki-bahin-yojana',
    lastCheckedDate: '2026-11-18',
  },
  src_sjsa_special_assistance: {
    id: 'src_sjsa_special_assistance',
    title: 'Social Justice & Special Assistance Dept — Special Assistance Schemes (Maharashtra)',
    publisher: 'Social Justice & Special Assistance Department, Government of Maharashtra',
    url: 'https://sjsa.maharashtra.gov.in/en/service/special-assistance-schemes/',
    lastCheckedDate: '2026-11-18',
    notes: 'Official Maharashtra SJSA page documenting Sanjay Gandhi Niradhar Anudan Yojana and Shravanbal Seva State Pension Scheme.',
  },
  src_myscheme_sgngs: {
    id: 'src_myscheme_sgngs',
    title: 'myScheme — Sanjay Gandhi Niradhar Grant Scheme',
    publisher: 'National e-Governance Division (NeGD), Government of India',
    url: 'https://www.myscheme.gov.in/schemes/sgngs',
    lastCheckedDate: '2026-11-18',
  },
  src_myscheme_sbssps: {
    id: 'src_myscheme_sbssps',
    title: 'myScheme — Shravanbal Seva State Pension Scheme',
    publisher: 'National e-Governance Division (NeGD), Government of India',
    url: 'https://www.myscheme.gov.in/schemes/sbssps',
    lastCheckedDate: '2026-11-18',
  },
  src_aaplesarkar_portal: {
    id: 'src_aaplesarkar_portal',
    title: 'Aaple Sarkar — Maharashtra Right to Public Services Portal',
    publisher: 'Government of Maharashtra',
    url: 'https://aaplesarkar.mahaonline.gov.in/en',
    lastCheckedDate: '2026-11-18',
    notes: 'Official Maharashtra online services portal used for filing special assistance applications and obtaining revenue certificates.',
  },
  src_jeevandayee_mjpjay: {
    id: 'src_jeevandayee_mjpjay',
    title: 'State Health Assurance Society — Integrated MJPJAY & Ayushman Bharat PM-JAY',
    publisher: 'Public Health Department, Government of Maharashtra',
    url: 'https://www.jeevandayee.gov.in',
    lastCheckedDate: '2026-11-18',
    notes: 'Expanded universal/White-card coverage rules and empanelled hospital packages are updated periodically via state GRs.',
  },
  src_myscheme_mjpjay: {
    id: 'src_myscheme_mjpjay',
    title: 'myScheme — Mahatma Jyotirao Phule Jan Arogya Yojana',
    publisher: 'National e-Governance Division (NeGD), Government of India',
    url: 'https://www.myscheme.gov.in/schemes/mjpjay',
    lastCheckedDate: '2026-11-18',
  },
  src_pmayg_portal: {
    id: 'src_pmayg_portal',
    title: 'Pradhan Mantri Awaas Yojana — Gramin (PMAY-G) Official Portal',
    publisher: 'Ministry of Rural Development, Government of India',
    url: 'https://pmayg.dord.gov.in/netiayHome/Home.aspx',
    lastCheckedDate: '2026-11-18',
  },
  src_myscheme_pmayg: {
    id: 'src_myscheme_pmayg',
    title: 'myScheme — Pradhan Mantri Awaas Yojana Gramin',
    publisher: 'National e-Governance Division (NeGD), Government of India',
    url: 'https://www.myscheme.gov.in/schemes/pmay-g',
    lastCheckedDate: '2026-11-18',
  },
};

export function getOfficialSource(id: string): OfficialSource | undefined {
  return officialSources[id];
}

export function getOfficialSources(ids: readonly string[]): OfficialSource[] {
  return ids
    .map((id) => officialSources[id])
    .filter((s): s is OfficialSource => Boolean(s));
}
