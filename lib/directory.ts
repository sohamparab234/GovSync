import { maharashtraDistricts } from './gov-info/schemes.ts';

export type MaharashtraDistrict = (typeof maharashtraDistricts)[number];

export type AdministrativeDivision =
  | 'Konkan'
  | 'Pune'
  | 'Nashik'
  | 'Chhatrapati Sambhajinagar'
  | 'Amravati'
  | 'Nagpur';

export interface DistrictDirectoryInfo {
  name: MaharashtraDistrict;
  division: AdministrativeDivision;
  headquarters: string;
  officialPortal: string;
  sourceUrl: string;
  lastVerified: string;
  talukas: readonly string[];
}

export type DepartmentCategory =
  | 'Revenue & Forest Department'
  | 'Rural Development Department'
  | 'Agriculture Department'
  | 'Social Justice & Special Assistance'
  | 'Women & Child Development'
  | 'Food, Civil Supplies & Consumer Protection'
  | 'School Education & Sports'
  | 'Higher & Technical Education'
  | 'Public Health Department'
  | 'Urban Development / Municipal Administration'
  | 'Transport Department (Home - Transport)'
  | 'General Administration Department'
  | 'Labour Department'
  | 'Tribal Development Department';

export interface DepartmentMeta {
  id: string;
  name: DepartmentCategory;
  shortCode: string;
  description: string;
  icon: string;
  officialPortal: string;
  keyServices: string[];
}

export type OfficeCategory =
  | 'Collectorate'
  | 'Tahsil Office'
  | 'Sub-Divisional Office'
  | 'Zilla Parishad'
  | 'Regional Transport Office'
  | 'Social Welfare Office'
  | 'District Supply Office'
  | 'Agriculture Office'
  | 'Municipal Corporation'
  | 'Secretariat / State Headquarters'
  | 'District Hospital / Health Office';

export interface GovernmentOffice {
  id: string;
  name: string;
  department: DepartmentCategory;
  officeCategory: OfficeCategory;
  district: MaharashtraDistrict | 'Maharashtra (Statewide)';
  taluka: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string;
  servicesHandled: string[];
  sourceUrl: string;
  lastVerified: string;
  verificationStatus: 'verified' | 'partially_verified';
  timings?: string;
  jurisdiction?: string;
}

export interface DirectoryFilterOptions {
  query?: string;
  district?: string;
  taluka?: string;
  department?: string;
  officeCategory?: string;
  service?: string;
}

// ============================================================================
// 1. ALL 36 MAHARASHTRA DISTRICTS (WITH OFFICIAL PORTALS & TALUKAS)
// ============================================================================
export const MAHARASHTRA_DISTRICTS_DIRECTORY: readonly DistrictDirectoryInfo[] = [
  // Konkan Division
  {
    name: 'Mumbai City',
    division: 'Konkan',
    headquarters: 'Mumbai (Old Custom House)',
    officialPortal: 'https://mumbaicity.gov.in',
    sourceUrl: 'https://mumbaicity.gov.in/about-district/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Mumbai City', 'Fort', 'Colaba'],
  },
  {
    name: 'Mumbai Suburban',
    division: 'Konkan',
    headquarters: 'Bandra (East)',
    officialPortal: 'https://mumbaisuburban.gov.in',
    sourceUrl: 'https://mumbaisuburban.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Andheri', 'Borivali', 'Kurla'],
  },
  {
    name: 'Thane',
    division: 'Konkan',
    headquarters: 'Thane',
    officialPortal: 'https://thane.nic.in',
    sourceUrl: 'https://thane.nic.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Thane', 'Kalyan', 'Murbad', 'Bhiwandi', 'Shahapur', 'Ulhasnagar', 'Ambarnath'],
  },
  {
    name: 'Palghar',
    division: 'Konkan',
    headquarters: 'Palghar',
    officialPortal: 'https://palghar.gov.in',
    sourceUrl: 'https://palghar.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Palghar', 'Vada', 'Vikramgad', 'Jawhar', 'Mokhada', 'Dahanu', 'Talasari', 'Vasai'],
  },
  {
    name: 'Raigad',
    division: 'Konkan',
    headquarters: 'Alibag',
    officialPortal: 'https://raigad.gov.in',
    sourceUrl: 'https://raigad.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Alibag', 'Pen', 'Murud', 'Panvel', 'Uran', 'Karjat', 'Khalapur', 'Mangaon', 'Roha', 'Sudhagad', 'Tala', 'Mahad', 'Poladpur', 'Shrivardhan', 'Mhasla'],
  },
  {
    name: 'Ratnagiri',
    division: 'Konkan',
    headquarters: 'Ratnagiri',
    officialPortal: 'https://ratnagiri.gov.in',
    sourceUrl: 'https://ratnagiri.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Ratnagiri', 'Chiplun', 'Khed', 'Guhagar', 'Dapoli', 'Mandangad', 'Sangameshwar', 'Rajapur', 'Lanja'],
  },
  {
    name: 'Sindhudurg',
    division: 'Konkan',
    headquarters: 'Oros (Kudal)',
    officialPortal: 'https://sindhudurg.nic.in',
    sourceUrl: 'https://sindhudurg.nic.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Kudal', 'Vengurla', 'Sawantwadi', 'Malvan', 'Devgad', 'Kankavli', 'Vaibhavwadi', 'Dodamarg'],
  },

  // Pune Division
  {
    name: 'Pune',
    division: 'Pune',
    headquarters: 'Pune',
    officialPortal: 'https://pune.gov.in',
    sourceUrl: 'https://pune.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Pune City', 'Haveli', 'Khed', 'Ambegaon', 'Junnar', 'Shirur', 'Daund', 'Indapur', 'Baramati', 'Purandar', 'Bhor', 'Velhe', 'Maval', 'Mulshi'],
  },
  {
    name: 'Satara',
    division: 'Pune',
    headquarters: 'Satara',
    officialPortal: 'https://satara.gov.in',
    sourceUrl: 'https://satara.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Satara', 'Wai', 'Khandala', 'Koregaon', 'Phaltan', 'Maan', 'Khatav', 'Karad', 'Patan', 'Jaoli', 'Mahabaleshwar'],
  },
  {
    name: 'Sangli',
    division: 'Pune',
    headquarters: 'Sangli',
    officialPortal: 'https://sangli.gov.in',
    sourceUrl: 'https://sangli.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Miraj', 'Tasgaon', 'Kavathe Mahankal', 'Jat', 'Walwa', 'Shirala', 'Khanapur', 'Atpadi', 'Palus', 'Kadegaon'],
  },
  {
    name: 'Solapur',
    division: 'Pune',
    headquarters: 'Solapur',
    officialPortal: 'https://solapur.gov.in',
    sourceUrl: 'https://solapur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Solapur North', 'Solapur South', 'Barshi', 'Mohol', 'Madha', 'Karmala', 'Pandharpur', 'Sangola', 'Malshiras', 'Mangalwedha', 'Akkalkot'],
  },
  {
    name: 'Kolhapur',
    division: 'Pune',
    headquarters: 'Kolhapur',
    officialPortal: 'https://kolhapur.gov.in',
    sourceUrl: 'https://kolhapur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Karvir', 'Panhala', 'Shahuwadi', 'Kagal', 'Hatkanangale', 'Shirol', 'Radhanagari', 'Gaganbawda', 'Bhudargad', 'Ajra', 'Gadhinglaj', 'Chandgad'],
  },

  // Nashik Division
  {
    name: 'Nashik',
    division: 'Nashik',
    headquarters: 'Nashik',
    officialPortal: 'https://nashik.gov.in',
    sourceUrl: 'https://nashik.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Nashik', 'Sinnar', 'Dindori', 'Peth', 'Trimbakeshwar', 'Kalwan', 'Deola', 'Surgana', 'Baglan', 'Malegaon', 'Nandgaon', 'Chandwad', 'Niphad', 'Yeola', 'Igatpuri'],
  },
  {
    name: 'Ahilyanagar',
    division: 'Nashik',
    headquarters: 'Ahilyanagar',
    officialPortal: 'https://ahilyanagar.gov.in',
    sourceUrl: 'https://ahilyanagar.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Nagar', 'Rahuri', 'Sangamner', 'Kopargaon', 'Shrirampur', 'Nevasa', 'Shevgaon', 'Pathardi', 'Jamkhed', 'Karjat', 'Shrigonda', 'Parner', 'Akole', 'Rahata'],
  },
  {
    name: 'Dhule',
    division: 'Nashik',
    headquarters: 'Dhule',
    officialPortal: 'https://dhule.gov.in',
    sourceUrl: 'https://dhule.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Dhule', 'Sakri', 'Shirpur', 'Sindkheda'],
  },
  {
    name: 'Jalgaon',
    division: 'Nashik',
    headquarters: 'Jalgaon',
    officialPortal: 'https://jalgaon.gov.in',
    sourceUrl: 'https://jalgaon.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Jalgaon', 'Bhusawal', 'Yawal', 'Raver', 'Muktainagar', 'Bodwad', 'Jamner', 'Pachora', 'Bhadgaon', 'Chalisgaon', 'Parola', 'Erandol', 'Dharangaon', 'Amalner', 'Chopda'],
  },
  {
    name: 'Nandurbar',
    division: 'Nashik',
    headquarters: 'Nandurbar',
    officialPortal: 'https://nandurbar.gov.in',
    sourceUrl: 'https://nandurbar.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Nandurbar', 'Navapur', 'Shahada', 'Taloda', 'Akkalkuwa', 'Akrani'],
  },

  // Chhatrapati Sambhajinagar Division
  {
    name: 'Chhatrapati Sambhajinagar',
    division: 'Chhatrapati Sambhajinagar',
    headquarters: 'Chhatrapati Sambhajinagar',
    officialPortal: 'https://chhatrapatisambhajinagar.gov.in',
    sourceUrl: 'https://chhatrapatisambhajinagar.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Chhatrapati Sambhajinagar', 'Paithan', 'Gangapur', 'Vaijapur', 'Kannad', 'Khuldabad', 'Sillod', 'Soegaon', 'Phulambri'],
  },
  {
    name: 'Jalna',
    division: 'Chhatrapati Sambhajinagar',
    headquarters: 'Jalna',
    officialPortal: 'https://jalna.gov.in',
    sourceUrl: 'https://jalna.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Jalna', 'Bhokardan', 'Jafrabad', 'Badnapur', 'Ambad', 'Ghansawangi', 'Partur', 'Mantha'],
  },
  {
    name: 'Parbhani',
    division: 'Chhatrapati Sambhajinagar',
    headquarters: 'Parbhani',
    officialPortal: 'https://parbhani.gov.in',
    sourceUrl: 'https://parbhani.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Parbhani', 'Sonpeth', 'Gangakhed', 'Palam', 'Purna', 'Sailu', 'Jintur', 'Manwath', 'Pathri'],
  },
  {
    name: 'Hingoli',
    division: 'Chhatrapati Sambhajinagar',
    headquarters: 'Hingoli',
    officialPortal: 'https://hingoli.nic.in',
    sourceUrl: 'https://hingoli.nic.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Hingoli', 'Sengaon', 'Kalamnuri', 'Basmath', 'Aundha Nagnath'],
  },
  {
    name: 'Nanded',
    division: 'Chhatrapati Sambhajinagar',
    headquarters: 'Nanded',
    officialPortal: 'https://nanded.gov.in',
    sourceUrl: 'https://nanded.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Nanded', 'Ardhapur', 'Mudkhed', 'Bhokar', 'Umri', 'Loha', 'Kandhar', 'Kinwat', 'Himayatnagar', 'Hadgaon', 'Mahur', 'Deglur', 'Mukhed', 'Dharmabad', 'Biloli', 'Naigaon'],
  },
  {
    name: 'Beed',
    division: 'Chhatrapati Sambhajinagar',
    headquarters: 'Beed',
    officialPortal: 'https://beed.gov.in',
    sourceUrl: 'https://beed.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Beed', 'Ashti', 'Patoda', 'Shirur-Kasar', 'Georai', 'Majalgaon', 'Wadwani', 'Kaij', 'Dharur', 'Parli', 'Ambajogai'],
  },
  {
    name: 'Latur',
    division: 'Chhatrapati Sambhajinagar',
    headquarters: 'Latur',
    officialPortal: 'https://latur.gov.in',
    sourceUrl: 'https://latur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Latur', 'Ausa', 'Renapur', 'Nilanga', 'Shirur Anantpal', 'Deoni', 'Udgir', 'Jalkot', 'Chakur', 'Ahmadpur'],
  },
  {
    name: 'Dharashiv',
    division: 'Chhatrapati Sambhajinagar',
    headquarters: 'Dharashiv',
    officialPortal: 'https://dharashiv.gov.in',
    sourceUrl: 'https://dharashiv.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Dharashiv', 'Tuljapur', 'Bhum', 'Paranda', 'Washi', 'Kalamb', 'Omerga', 'Lohara'],
  },

  // Amravati Division
  {
    name: 'Amravati',
    division: 'Amravati',
    headquarters: 'Amravati',
    officialPortal: 'https://amravati.gov.in',
    sourceUrl: 'https://amravati.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Amravati', 'Bhatkuli', 'Nandgaon Khandeshwar', 'Dharni', 'Chikhaldara', 'Achalpur', 'Chandurbazar', 'Morshi', 'Warud', 'Daryapur', 'Anjangaon Surji', 'Chandur Railway', 'Dhamangaon Railway', 'Teosa'],
  },
  {
    name: 'Akola',
    division: 'Amravati',
    headquarters: 'Akola',
    officialPortal: 'https://akola.gov.in',
    sourceUrl: 'https://akola.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Akola', 'Akot', 'Telhara', 'Balapur', 'Patur', 'Barshitakli', 'Murtizapur'],
  },
  {
    name: 'Buldhana',
    division: 'Amravati',
    headquarters: 'Buldhana',
    officialPortal: 'https://buldhana.nic.in',
    sourceUrl: 'https://buldhana.nic.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Buldhana', 'Chikhli', 'Deulgaon Raja', 'Jalgaon Jamod', 'Sangrampur', 'Malkapur', 'Motala', 'Nandura', 'Khamgaon', 'Shegaon', 'Mehkar', 'Sindkhed Raja', 'Lonar'],
  },
  {
    name: 'Washim',
    division: 'Amravati',
    headquarters: 'Washim',
    officialPortal: 'https://washim.gov.in',
    sourceUrl: 'https://washim.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Washim', 'Malegaon', 'Risod', 'Mangrulpir', 'Karanja', 'Manora'],
  },
  {
    name: 'Yavatmal',
    division: 'Amravati',
    headquarters: 'Yavatmal',
    officialPortal: 'https://yavatmal.gov.in',
    sourceUrl: 'https://yavatmal.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Yavatmal', 'Arni', 'Babhulgaon', 'Kalamb', 'Darwha', 'Digras', 'Ner', 'Pusad', 'Umarkhed', 'Mahagaon', 'Wani', 'Maregaon', 'Zari-Jamani', 'Kelapur', 'Ghatanji', 'Ralegaon'],
  },

  // Nagpur Division
  {
    name: 'Nagpur',
    division: 'Nagpur',
    headquarters: 'Nagpur',
    officialPortal: 'https://nagpur.gov.in',
    sourceUrl: 'https://nagpur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Nagpur Urban', 'Nagpur Rural', 'Kamptee', 'Hingna', 'Katol', 'Narkhed', 'Savner', 'Kalameshwar', 'Ramtek', 'Mouda', 'Parseoni', 'Umred', 'Kuhi', 'Bhivapur'],
  },
  {
    name: 'Wardha',
    division: 'Nagpur',
    headquarters: 'Wardha',
    officialPortal: 'https://wardha.gov.in',
    sourceUrl: 'https://wardha.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Wardha', 'Deoli', 'Seloo', 'Arvi', 'Ashti', 'Karanja', 'Hinganghat', 'Samudrapur'],
  },
  {
    name: 'Bhandara',
    division: 'Nagpur',
    headquarters: 'Bhandara',
    officialPortal: 'https://bhandara.gov.in',
    sourceUrl: 'https://bhandara.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Bhandara', 'Tumsar', 'Pauni', 'Mohadi', 'Sakoli', 'Lakhani', 'Lakhandur'],
  },
  {
    name: 'Gondia',
    division: 'Nagpur',
    headquarters: 'Gondia',
    officialPortal: 'https://gondia.gov.in',
    sourceUrl: 'https://gondia.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Gondia', 'Tirora', 'Goregaon', 'Arjuni Morgaon', 'Deori', 'Salekasa', 'Sadak Arjuni', 'Amgaon'],
  },
  {
    name: 'Chandrapur',
    division: 'Nagpur',
    headquarters: 'Chandrapur',
    officialPortal: 'https://chandrapur.gov.in',
    sourceUrl: 'https://chandrapur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Chandrapur', 'Bhadravati', 'Warora', 'Chimur', 'Nagbhid', 'Bramhapuri', 'Sindewahi', 'Mul', 'Saoli', 'Pombhurna', 'Ballarpur', 'Gondpipri', 'Korpurna', 'Rajura', 'Jivati'],
  },
  {
    name: 'Gadchiroli',
    division: 'Nagpur',
    headquarters: 'Gadchiroli',
    officialPortal: 'https://gadchiroli.gov.in',
    sourceUrl: 'https://gadchiroli.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    talukas: ['Gadchiroli', 'Dhanora', 'Chamorshi', 'Armori', 'Kurkheda', 'Korchi', 'Desaiganj Wadsa', 'Aheri', 'Etapalli', 'Bhamragad', 'Sironcha', 'Mulchera'],
  },
];

// ============================================================================
// 2. KEY GOVERNMENT DEPARTMENTS
// ============================================================================
export const GOVERNMENT_DEPARTMENTS: readonly DepartmentMeta[] = [
  {
    id: 'revenue',
    name: 'Revenue & Forest Department',
    shortCode: 'REV',
    description: 'Manages land records (7/12), residence, domicile, income, and caste certificates, along with sub-divisional and tahsil administration.',
    icon: 'Building2',
    officialPortal: 'https://revenue.maharashtra.gov.in',
    keyServices: ['residence', 'income-certificate', 'caste-certificate'],
  },
  {
    id: 'rural-development',
    name: 'Rural Development Department',
    shortCode: 'RDD',
    description: 'Administers Zilla Parishad, Panchayat Samitis, rural drinking water, village roads, Anganwadis, and rural employment.',
    icon: 'TreePine',
    officialPortal: 'https://rdd.maharashtra.gov.in',
    keyServices: ['rural-employment', 'village-development'],
  },
  {
    id: 'agriculture',
    name: 'Agriculture Department',
    shortCode: 'AGRI',
    description: 'Oversees farmer subsidies, PM-KISAN, crop insurance (PMFBY), drip irrigation, and farm mechanization (SMAM).',
    icon: 'Sprout',
    officialPortal: 'https://krishi.maharashtra.gov.in',
    keyServices: ['pm-kisan', 'smam-subsidy', 'crop-insurance'],
  },
  {
    id: 'social-justice',
    name: 'Social Justice & Special Assistance',
    shortCode: 'SJD',
    description: 'Provides educational scholarships (EBC, SC, OBC), disability welfare, Sanjay Gandhi Niradhar pensions, and caste validation.',
    icon: 'HeartHandshake',
    officialPortal: 'https://sjsa.maharashtra.gov.in',
    keyServices: ['scholarship', 'pension', 'caste-certificate'],
  },
  {
    id: 'food-civil-supplies',
    name: 'Food, Civil Supplies & Consumer Protection',
    shortCode: 'FCS',
    description: 'Responsible for digital ration cards (APL, BPL, Antyodaya), fair price shops, and Public Distribution System (PDS).',
    icon: 'ShoppingBag',
    officialPortal: 'https://mahafood.gov.in',
    keyServices: ['ration-card'],
  },
  {
    id: 'higher-education',
    name: 'Higher & Technical Education',
    shortCode: 'HED',
    description: 'Administers higher education colleges, technical polytechnics, state universities, and fee-reimbursement scholarships on MahaDBT.',
    icon: 'GraduationCap',
    officialPortal: 'https://htedu.maharashtra.gov.in',
    keyServices: ['scholarship'],
  },
  {
    id: 'school-education',
    name: 'School Education & Sports',
    shortCode: 'SED',
    description: 'Oversees primary and secondary school education, RTE admissions, teacher administration, and student welfare schemes.',
    icon: 'BookOpen',
    officialPortal: 'https://education.maharashtra.gov.in',
    keyServices: ['rte-admission', 'school-scholarship'],
  },
  {
    id: 'health',
    name: 'Public Health Department',
    shortCode: 'PHD',
    description: 'Manages district civil hospitals, rural health centers, and Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY).',
    icon: 'Activity',
    officialPortal: 'https://arogya.maharashtra.gov.in',
    keyServices: ['health-insurance', 'hospital-care'],
  },
  {
    id: 'transport',
    name: 'Transport Department (Home - Transport)',
    shortCode: 'RTO',
    description: 'Handles driving licenses, learner permits, motor vehicle registration, fitness certificates, and road permits across RTO offices.',
    icon: 'Car',
    officialPortal: 'https://transport.maharashtra.gov.in',
    keyServices: ['driving-license', 'vehicle-registration'],
  },
  {
    id: 'women-child',
    name: 'Women & Child Development',
    shortCode: 'WCD',
    description: 'Implements women empowerment programs including Majhi Ladki Bahin Yojana, child protection, and Anganwadi services.',
    icon: 'Users',
    officialPortal: 'https://womenchild.maharashtra.gov.in',
    keyServices: ['ladki-bahin', 'anganwadi-services'],
  },
  {
    id: 'urban-development',
    name: 'Urban Development / Municipal Administration',
    shortCode: 'UDD',
    description: 'Administers municipal corporations and councils, birth and death registration, property tax, water supply, and urban sanitation.',
    icon: 'Landmark',
    officialPortal: 'https://urban.maharashtra.gov.in',
    keyServices: ['birth-certificate', 'property-tax'],
  },
  {
    id: 'labour',
    name: 'Labour Department',
    shortCode: 'LAB',
    description: 'Oversees building and other construction worker (BOCW) welfare, shop and establishment registrations, and minimum wages.',
    icon: 'Briefcase',
    officialPortal: 'https://labour.maharashtra.gov.in',
    keyServices: ['bocw-registration', 'labour-welfare'],
  },
];

// ============================================================================
// 3. VERIFIED GOVERNMENT OFFICE DIRECTORY RECORDS
// ============================================================================
export const VERIFIED_GOVERNMENT_OFFICES: readonly GovernmentOffice[] = [
  // --- STATE HEADQUARTERS / MANTRALAYA (MUMBAI) ---
  {
    id: 'mh-mantralaya-main',
    name: 'Mantralaya — Maharashtra State Secretariat',
    department: 'General Administration Department',
    officeCategory: 'Secretariat / State Headquarters',
    district: 'Maharashtra (Statewide)',
    taluka: null,
    address: 'Madam Cama Road, Nariman Point, Mumbai, Maharashtra 400032',
    phone: '022-22025151',
    email: 'psec.gad@maharashtra.gov.in',
    website: 'https://maharashtra.gov.in',
    servicesHandled: ['scholarship', 'residence', 'ration-card', 'pension', 'income-certificate', 'caste-certificate'],
    sourceUrl: 'https://maharashtra.gov.in/1125/State-Secretariat',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 09:45 AM - 06:15 PM (Closed on 2nd & 4th Saturdays and Public Holidays)',
    jurisdiction: 'State of Maharashtra',
  },
  {
    id: 'mh-revenue-state-hq',
    name: 'Revenue & Forest Department State Directorate',
    department: 'Revenue & Forest Department',
    officeCategory: 'Secretariat / State Headquarters',
    district: 'Maharashtra (Statewide)',
    taluka: null,
    address: 'Main Building, 1st Floor, Mantralaya, Madam Cama Road, Mumbai 400032',
    phone: '022-22026114',
    email: 'sec.revenue@maharashtra.gov.in',
    website: 'https://maharashtra.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate'],
    sourceUrl: 'https://maharashtra.gov.in/1125/State-Secretariat',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 09:45 AM - 06:15 PM',
    jurisdiction: 'Statewide policy and revenue appeals',
  },
  {
    id: 'mh-fcs-state-hq',
    name: 'Food, Civil Supplies & Consumer Protection Secretariat',
    department: 'Food, Civil Supplies & Consumer Protection',
    officeCategory: 'Secretariat / State Headquarters',
    district: 'Maharashtra (Statewide)',
    taluka: null,
    address: 'Room No. 222, 2nd Floor, Mantralaya Annexe, Nariman Point, Mumbai 400032',
    phone: '022-22024851',
    email: 'psec.fcs@maharashtra.gov.in',
    website: 'https://mahafood.gov.in',
    servicesHandled: ['ration-card'],
    sourceUrl: 'https://maharashtra.gov.in/1125/State-Secretariat',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 09:45 AM - 06:15 PM',
    jurisdiction: 'Statewide PDS oversight',
  },

  // --- PUNE DISTRICT OFFICES ---
  {
    id: 'pune-collectorate',
    name: 'Office of the District Collector & District Magistrate, Pune',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Pune',
    taluka: 'Pune City',
    address: 'District Collectorate, Station Road, Opp. Pune Railway Station, Pune, Maharashtra 411001',
    phone: '020-26123370',
    email: 'collector.pune@maharashtra.gov.in',
    website: 'https://pune.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://pune.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Saturday: 10:00 AM - 05:45 PM (Closed 2nd & 4th Saturday)',
    jurisdiction: 'Entire Pune District (14 Talukas)',
  },
  {
    id: 'pune-tahsil-city',
    name: 'Tahsildar Office, Pune City',
    department: 'Revenue & Forest Department',
    officeCategory: 'Tahsil Office',
    district: 'Pune',
    taluka: 'Pune City',
    address: 'Collector Office Compound, Ground Floor, Pune Station Road, Pune 411001',
    phone: '020-26122485',
    email: 'tahsildar.punecity@maharashtra.gov.in',
    website: 'https://pune.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'pension'],
    sourceUrl: 'https://pune.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Pune City Taluka',
  },
  {
    id: 'pune-tahsil-haveli',
    name: 'Tahsildar Office, Haveli',
    department: 'Revenue & Forest Department',
    officeCategory: 'Tahsil Office',
    district: 'Pune',
    taluka: 'Haveli',
    address: 'Haveli Tehsil Office, Subhashnagar, Shukrawar Peth, Pune 411002',
    phone: '020-24450371',
    email: 'tahsildar.haveli@maharashtra.gov.in',
    website: 'https://pune.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'pension'],
    sourceUrl: 'https://pune.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Haveli Taluka (Rural & Suburban Pune)',
  },
  {
    id: 'pune-zilla-parishad',
    name: 'Zilla Parishad Pune — Head Office',
    department: 'Rural Development Department',
    officeCategory: 'Zilla Parishad',
    district: 'Pune',
    taluka: 'Pune City',
    address: 'Zilla Parishad Bhavan, Yashwantrao Chavan Marg, Camp, Pune 411001',
    phone: '020-26138612',
    email: 'ceopunezp@gmail.com',
    website: 'https://zppune.gov.in',
    servicesHandled: ['scholarship', 'pension'],
    sourceUrl: 'https://zppune.gov.in/contact-us',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Rural Pune District',
  },
  {
    id: 'pune-dso',
    name: 'District Supply Office (DSO), Pune',
    department: 'Food, Civil Supplies & Consumer Protection',
    officeCategory: 'District Supply Office',
    district: 'Pune',
    taluka: 'Pune City',
    address: 'Old ZP Building Compound, Station Road, Pune 411001',
    phone: '020-26123847',
    email: 'dso.pune@maharashtra.gov.in',
    website: 'https://mahafood.gov.in',
    servicesHandled: ['ration-card'],
    sourceUrl: 'https://pune.gov.in/departments/food-and-civil-supplies/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Pune District Fair Price Shops & Ration Card Quotas',
  },
  {
    id: 'pune-social-welfare',
    name: 'Assistant Commissioner Social Welfare Office, Pune',
    department: 'Social Justice & Special Assistance',
    officeCategory: 'Social Welfare Office',
    district: 'Pune',
    taluka: 'Pune City',
    address: 'Dr. Babasaheb Ambedkar Bhavan, Vishrantwadi Road, Yerwada, Pune 411006',
    phone: '020-26697046',
    email: 'acsw.pune@maharashtra.gov.in',
    website: 'https://sjsa.maharashtra.gov.in',
    servicesHandled: ['scholarship', 'pension', 'caste-certificate'],
    sourceUrl: 'https://sjsa.maharashtra.gov.in/en/district-offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Pune District Social Welfare & Post-Matric Scholarships',
  },
  {
    id: 'pune-rto-central',
    name: 'Regional Transport Office (RTO), Pune (MH-12)',
    department: 'Transport Department (Home - Transport)',
    officeCategory: 'Regional Transport Office',
    district: 'Pune',
    taluka: 'Pune City',
    address: 'Near Sangam Bridge, Alandi Road, Shivajinagar, Pune 411001',
    phone: '020-26058080',
    email: 'rto.12-mh@gov.in',
    website: 'https://transport.maharashtra.gov.in',
    servicesHandled: ['driving-license', 'vehicle-registration'],
    sourceUrl: 'https://transport.maharashtra.gov.in/1043/RTO-Offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:00 PM',
    jurisdiction: 'Pune City & Haveli Vehicle Licensing (MH-12)',
  },
  {
    id: 'pune-pmc',
    name: 'Pune Municipal Corporation (PMC) Main Building',
    department: 'Urban Development / Municipal Administration',
    officeCategory: 'Municipal Corporation',
    district: 'Pune',
    taluka: 'Pune City',
    address: 'Shivajinagar, Pune, Maharashtra 411005',
    phone: '020-25501000',
    email: 'info@punecorporation.org',
    website: 'https://pmc.gov.in',
    servicesHandled: ['birth-certificate', 'property-tax'],
    sourceUrl: 'https://pmc.gov.in/en/contact-us',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Saturday: 09:45 AM - 06:15 PM',
    jurisdiction: 'PMC Municipal Limits',
  },

  // --- MUMBAI CITY DISTRICT OFFICES ---
  {
    id: 'mumbai-city-collectorate',
    name: 'Office of the District Collector, Mumbai City',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Mumbai City',
    taluka: 'Mumbai City',
    address: 'Old Custom House, Shahid Bhagat Singh Road, Fort, Mumbai 400001',
    phone: '022-22661231',
    email: 'collector.mumbaicity@maharashtra.gov.in',
    website: 'https://mumbaicity.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://mumbaicity.gov.in/about-district/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Island City of Mumbai (Colaba to Mahim/Sion)',
  },
  {
    id: 'mumbai-rto-tardeo',
    name: 'Regional Transport Office, Mumbai Central / Tardeo (MH-01)',
    department: 'Transport Department (Home - Transport)',
    officeCategory: 'Regional Transport Office',
    district: 'Mumbai City',
    taluka: 'Mumbai City',
    address: 'Old Bodyguard Lane, Tulsiwadi, Tardeo, Mumbai 400034',
    phone: '022-23534600',
    email: 'rto.01-mh@gov.in',
    website: 'https://transport.maharashtra.gov.in',
    servicesHandled: ['driving-license', 'vehicle-registration'],
    sourceUrl: 'https://transport.maharashtra.gov.in/1043/RTO-Offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:00 PM',
    jurisdiction: 'South Mumbai (MH-01)',
  },
  {
    id: 'mumbai-bmc-hq',
    name: 'Brihanmumbai Municipal Corporation (BMC) Headquarters',
    department: 'Urban Development / Municipal Administration',
    officeCategory: 'Municipal Corporation',
    district: 'Mumbai City',
    taluka: 'Fort',
    address: 'Mahapalika Marg, Opp. CSMT Station, Fort, Mumbai 400001',
    phone: '022-22620251',
    email: 'mc@mcgm.gov.in',
    website: 'https://www.mcgm.gov.in',
    servicesHandled: ['birth-certificate', 'property-tax'],
    sourceUrl: 'https://www.mcgm.gov.in/irj/portal/anonymous/contactus',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 09:30 AM - 06:00 PM',
    jurisdiction: 'Greater Mumbai Civic Region',
  },

  // --- MUMBAI SUBURBAN DISTRICT OFFICES ---
  {
    id: 'mumbai-suburban-collectorate',
    name: 'Office of the District Collector, Mumbai Suburban',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Mumbai Suburban',
    taluka: 'Kurla',
    address: '10th Floor, Administrative Building, Near Chetna College, Government Colony, Bandra (East), Mumbai 400051',
    phone: '022-26556805',
    email: 'collector.mumbaisub@maharashtra.gov.in',
    website: 'https://mumbaisuburban.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://mumbaisuburban.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Mumbai Suburban District (Andheri, Borivali, Kurla talukas)',
  },
  {
    id: 'mumbai-tahsil-andheri',
    name: 'Tahsildar Office, Andheri',
    department: 'Revenue & Forest Department',
    officeCategory: 'Tahsil Office',
    district: 'Mumbai Suburban',
    taluka: 'Andheri',
    address: 'Tehsil Office, Old Nagardas Road, Near Andheri Railway Station, Andheri (East), Mumbai 400069',
    phone: '022-28368811',
    email: 'tahsildar.andheri@maharashtra.gov.in',
    website: 'https://mumbaisuburban.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'pension'],
    sourceUrl: 'https://mumbaisuburban.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Andheri Taluka (Western Suburbs)',
  },
  {
    id: 'mumbai-tahsil-kurla',
    name: 'Tahsildar Office, Kurla',
    department: 'Revenue & Forest Department',
    officeCategory: 'Tahsil Office',
    district: 'Mumbai Suburban',
    taluka: 'Kurla',
    address: 'Administrative Building, RC Marg, Chembur, Mumbai 400071',
    phone: '022-25221945',
    email: 'tahsildar.kurla@maharashtra.gov.in',
    website: 'https://mumbaisuburban.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'pension'],
    sourceUrl: 'https://mumbaisuburban.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Kurla Taluka (Eastern Suburbs)',
  },
  {
    id: 'mumbai-rto-andheri',
    name: 'Regional Transport Office, Mumbai West / Andheri (MH-02)',
    department: 'Transport Department (Home - Transport)',
    officeCategory: 'Regional Transport Office',
    district: 'Mumbai Suburban',
    taluka: 'Andheri',
    address: 'D/111, Ambivali Village, Versova Road, Andheri (West), Mumbai 400053',
    phone: '022-26366952',
    email: 'rto.02-mh@gov.in',
    website: 'https://transport.maharashtra.gov.in',
    servicesHandled: ['driving-license', 'vehicle-registration'],
    sourceUrl: 'https://transport.maharashtra.gov.in/1043/RTO-Offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:00 PM',
    jurisdiction: 'Western Suburbs Vehicle Licensing (MH-02)',
  },

  // --- THANE DISTRICT OFFICES ---
  {
    id: 'thane-collectorate',
    name: 'Office of the District Collector, Thane',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Thane',
    taluka: 'Thane',
    address: 'Court Naka, Station Road, Thane (West), Maharashtra 400601',
    phone: '022-25344041',
    email: 'collector.thane@maharashtra.gov.in',
    website: 'https://thane.nic.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://thane.nic.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Thane District',
  },
  {
    id: 'thane-rto',
    name: 'Regional Transport Office, Thane (MH-04)',
    department: 'Transport Department (Home - Transport)',
    officeCategory: 'Regional Transport Office',
    district: 'Thane',
    taluka: 'Thane',
    address: 'Near Central Jail, Khopat, Thane (West) 400601',
    phone: '022-25442555',
    email: 'rto.04-mh@gov.in',
    website: 'https://transport.maharashtra.gov.in',
    servicesHandled: ['driving-license', 'vehicle-registration'],
    sourceUrl: 'https://transport.maharashtra.gov.in/1043/RTO-Offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:00 PM',
    jurisdiction: 'Thane City & District (MH-04)',
  },
  {
    id: 'thane-tmc',
    name: 'Thane Municipal Corporation (TMC) Headquarters',
    department: 'Urban Development / Municipal Administration',
    officeCategory: 'Municipal Corporation',
    district: 'Thane',
    taluka: 'Thane',
    address: 'Mahapalika Bhavan, Chandan Wadi, Pachpakhadi, Thane (West) 400602',
    phone: '022-25371010',
    email: 'mc@thanecity.gov.in',
    website: 'https://thanecity.gov.in',
    servicesHandled: ['birth-certificate', 'property-tax'],
    sourceUrl: 'https://thanecity.gov.in/tmc_portal/contact-us',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 09:45 AM - 06:15 PM',
    jurisdiction: 'Thane Municipal Area',
  },

  // --- NAGPUR DISTRICT OFFICES ---
  {
    id: 'nagpur-collectorate',
    name: 'Office of the District Collector & District Magistrate, Nagpur',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Nagpur',
    taluka: 'Nagpur Urban',
    address: 'Civil Lines, Near High Court, Nagpur, Maharashtra 440001',
    phone: '0712-2562383',
    email: 'collector.nagpur@maharashtra.gov.in',
    website: 'https://nagpur.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://nagpur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Saturday: 10:00 AM - 05:30 PM (Closed 2nd & 4th Saturday)',
    jurisdiction: 'Entire Nagpur District',
  },
  {
    id: 'nagpur-tahsil-urban',
    name: 'Tahsildar Office, Nagpur Urban',
    department: 'Revenue & Forest Department',
    officeCategory: 'Tahsil Office',
    district: 'Nagpur',
    taluka: 'Nagpur Urban',
    address: 'Old Secretariate Building Compound, Civil Lines, Nagpur 440001',
    phone: '0712-2560555',
    email: 'tahsildar.nagpururban@maharashtra.gov.in',
    website: 'https://nagpur.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'pension'],
    sourceUrl: 'https://nagpur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Nagpur Urban Taluka',
  },
  {
    id: 'nagpur-zilla-parishad',
    name: 'Zilla Parishad Nagpur — Head Office',
    department: 'Rural Development Department',
    officeCategory: 'Zilla Parishad',
    district: 'Nagpur',
    taluka: 'Nagpur Urban',
    address: 'Civil Lines, Opposite Reserve Bank of India, Nagpur 440001',
    phone: '0712-2565612',
    email: 'ceonagpurzp@gmail.com',
    website: 'https://zpnagpur.gov.in',
    servicesHandled: ['scholarship', 'pension'],
    sourceUrl: 'https://zpnagpur.gov.in/contact-us',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Rural Nagpur District',
  },
  {
    id: 'nagpur-rto-city',
    name: 'Regional Transport Office, Nagpur City (MH-31)',
    department: 'Transport Department (Home - Transport)',
    officeCategory: 'Regional Transport Office',
    district: 'Nagpur',
    taluka: 'Nagpur Urban',
    address: 'Bhole Petrol Pump Chowk, Amravati Road, Nagpur 440010',
    phone: '0712-2561698',
    email: 'rto.31-mh@gov.in',
    website: 'https://transport.maharashtra.gov.in',
    servicesHandled: ['driving-license', 'vehicle-registration'],
    sourceUrl: 'https://transport.maharashtra.gov.in/1043/RTO-Offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:00 PM',
    jurisdiction: 'Nagpur City (MH-31)',
  },

  // --- NASHIK DISTRICT OFFICES ---
  {
    id: 'nashik-collectorate',
    name: 'Office of the District Collector, Nashik',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Nashik',
    taluka: 'Nashik',
    address: 'Collector Office, Old CBS, Trimbak Naka, Nashik, Maharashtra 422001',
    phone: '0253-2578500',
    email: 'collector.nashik@maharashtra.gov.in',
    website: 'https://nashik.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://nashik.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Nashik District (15 Talukas)',
  },
  {
    id: 'nashik-rto',
    name: 'Regional Transport Office, Nashik (MH-15)',
    department: 'Transport Department (Home - Transport)',
    officeCategory: 'Regional Transport Office',
    district: 'Nashik',
    taluka: 'Nashik',
    address: 'Near Old CBS, Trimbak Road, Nashik 422002',
    phone: '0253-2575225',
    email: 'rto.15-mh@gov.in',
    website: 'https://transport.maharashtra.gov.in',
    servicesHandled: ['driving-license', 'vehicle-registration'],
    sourceUrl: 'https://transport.maharashtra.gov.in/1043/RTO-Offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:00 PM',
    jurisdiction: 'Nashik District (MH-15)',
  },
  {
    id: 'nashik-agriculture',
    name: 'District Superintending Agriculture Officer (SAO), Nashik',
    department: 'Agriculture Department',
    officeCategory: 'Agriculture Office',
    district: 'Nashik',
    taluka: 'Nashik',
    address: 'Krishi Bhavan, Near Old CBS, Trimbak Naka, Nashik 422002',
    phone: '0253-2573216',
    email: 'sao.nashik@maharashtra.gov.in',
    website: 'https://krishi.maharashtra.gov.in',
    servicesHandled: ['pm-kisan', 'smam-subsidy', 'crop-insurance'],
    sourceUrl: 'https://krishi.maharashtra.gov.in/1054/District-Agriculture-Offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Nashik District Agricultural Extension & Subsidies',
  },

  // --- CHHATRAPATI SAMBHAJINAGAR DISTRICT OFFICES ---
  {
    id: 'csn-collectorate',
    name: 'Office of the District Collector, Chhatrapati Sambhajinagar',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Chhatrapati Sambhajinagar',
    taluka: 'Chhatrapati Sambhajinagar',
    address: 'Near Subhedari Guest House, University Road, Chhatrapati Sambhajinagar 431004',
    phone: '0240-2334501',
    email: 'collector.aurangabad@maharashtra.gov.in',
    website: 'https://chhatrapatisambhajinagar.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://chhatrapatisambhajinagar.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Chhatrapati Sambhajinagar District',
  },
  {
    id: 'csn-rto',
    name: 'Regional Transport Office, Chhatrapati Sambhajinagar (MH-20)',
    department: 'Transport Department (Home - Transport)',
    officeCategory: 'Regional Transport Office',
    district: 'Chhatrapati Sambhajinagar',
    taluka: 'Chhatrapati Sambhajinagar',
    address: 'Near Railway Station Road, Chhatrapati Sambhajinagar 431005',
    phone: '0240-2331198',
    email: 'rto.20-mh@gov.in',
    website: 'https://transport.maharashtra.gov.in',
    servicesHandled: ['driving-license', 'vehicle-registration'],
    sourceUrl: 'https://transport.maharashtra.gov.in/1043/RTO-Offices',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:00 PM',
    jurisdiction: 'Chhatrapati Sambhajinagar (MH-20)',
  },

  // --- AMRAVATI DISTRICT OFFICES ---
  {
    id: 'amravati-collectorate',
    name: 'Office of the District Collector & District Magistrate, Amravati',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Amravati',
    taluka: 'Amravati',
    address: 'Camp Road, Near Collector Bungalow, Amravati, Maharashtra 444602',
    phone: '0721-2662502',
    email: 'collector.amravati@maharashtra.gov.in',
    website: 'https://amravati.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://amravati.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Entire Amravati District',
  },

  // --- KOLHAPUR DISTRICT OFFICES ---
  {
    id: 'kolhapur-collectorate',
    name: 'Office of the District Collector, Kolhapur',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Kolhapur',
    taluka: 'Karvir',
    address: 'Near Bhavani Mandap, Kasaba Bavada Road, Kolhapur 416003',
    phone: '0231-2654811',
    email: 'collector.kolhapur@maharashtra.gov.in',
    website: 'https://kolhapur.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://kolhapur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Kolhapur District (12 Talukas)',
  },

  // --- SOLAPUR DISTRICT OFFICES ---
  {
    id: 'solapur-collectorate',
    name: 'Office of the District Collector, Solapur',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Solapur',
    taluka: 'Solapur North',
    address: 'Old Collector Office Compound, Sidheshwar Peth, Solapur 413001',
    phone: '0217-2731001',
    email: 'collector.solapur@maharashtra.gov.in',
    website: 'https://solapur.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://solapur.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Solapur District',
  },

  // --- NANDED DISTRICT OFFICES ---
  {
    id: 'nanded-collectorate',
    name: 'Office of the District Collector, Nanded',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Nanded',
    taluka: 'Nanded',
    address: 'Administrative Building, Station Road, Nanded 431601',
    phone: '02462-234002',
    email: 'collector.nanded@maharashtra.gov.in',
    website: 'https://nanded.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://nanded.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Nanded District (16 Talukas)',
  },

  // --- RAIGAD DISTRICT OFFICES ---
  {
    id: 'raigad-collectorate',
    name: 'Office of the District Collector, Raigad-Alibag',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Raigad',
    taluka: 'Alibag',
    address: 'Collector Office, Court Road, Alibag, Raigad 402201',
    phone: '02141-222001',
    email: 'collector.raigad@maharashtra.gov.in',
    website: 'https://raigad.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://raigad.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Raigad District',
  },

  // --- SATARA DISTRICT OFFICES ---
  {
    id: 'satara-collectorate',
    name: 'Office of the District Collector, Satara',
    department: 'Revenue & Forest Department',
    officeCategory: 'Collectorate',
    district: 'Satara',
    taluka: 'Satara',
    address: 'Collector Office Compound, Sadar Bazar, Satara 415001',
    phone: '02162-233100',
    email: 'collector.satara@maharashtra.gov.in',
    website: 'https://satara.gov.in',
    servicesHandled: ['residence', 'income-certificate', 'caste-certificate', 'ration-card', 'pension'],
    sourceUrl: 'https://satara.gov.in/whos-who/',
    lastVerified: '2026-11-23',
    verificationStatus: 'verified',
    timings: 'Monday to Friday: 10:00 AM - 05:30 PM',
    jurisdiction: 'Satara District',
  },
];

// ============================================================================
// 4. SEARCH & FILTERING ENGINE
// ============================================================================
export function filterGovernmentOffices(
  offices: readonly GovernmentOffice[],
  options: DirectoryFilterOptions
): GovernmentOffice[] {
  const query = options.query?.trim().toLowerCase() || '';
  const districtFilter = options.district?.trim() || '';
  const talukaFilter = options.taluka?.trim() || '';
  const departmentFilter = options.department?.trim() || '';
  const categoryFilter = options.officeCategory?.trim() || '';
  const serviceFilter = options.service?.trim().toLowerCase() || '';

  return offices.filter((office) => {
    // District Filter (Statewide offices are shown for any district unless strictly filtered otherwise, or exact match)
    if (districtFilter && districtFilter !== 'all') {
      const isDistrictMatch =
        office.district === districtFilter || office.district === 'Maharashtra (Statewide)';
      if (!isDistrictMatch) return false;
    }

    // Taluka Filter
    if (talukaFilter && talukaFilter !== 'all') {
      if (office.taluka && office.taluka !== talukaFilter) return false;
    }

    // Department Filter
    if (departmentFilter && departmentFilter !== 'all') {
      if (office.department !== departmentFilter) return false;
    }

    // Office Category Filter
    if (categoryFilter && categoryFilter !== 'all') {
      if (office.officeCategory !== categoryFilter) return false;
    }

    // Service Filter
    if (serviceFilter && serviceFilter !== 'all') {
      const handlesService = office.servicesHandled.some(
        (s) => s.toLowerCase() === serviceFilter || s.toLowerCase().includes(serviceFilter)
      );
      if (!handlesService) return false;
    }

    // Free text query across name, department, category, district, taluka, address, and services
    if (query) {
      const matchName = office.name.toLowerCase().includes(query);
      const matchDept = office.department.toLowerCase().includes(query);
      const matchCat = office.officeCategory.toLowerCase().includes(query);
      const matchDist = office.district.toLowerCase().includes(query);
      const matchTaluka = office.taluka ? office.taluka.toLowerCase().includes(query) : false;
      const matchAddress = office.address ? office.address.toLowerCase().includes(query) : false;
      const matchServices = office.servicesHandled.some((s) => s.toLowerCase().includes(query));

      if (
        !matchName &&
        !matchDept &&
        !matchCat &&
        !matchDist &&
        !matchTaluka &&
        !matchAddress &&
        !matchServices
      ) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// 5. HELPER UTILITIES
// ============================================================================
export function getDistrictInfo(districtName: string): DistrictDirectoryInfo | undefined {
  return MAHARASHTRA_DISTRICTS_DIRECTORY.find((d) => d.name === districtName);
}

export function getOfficesForService(serviceId: string): GovernmentOffice[] {
  return VERIFIED_GOVERNMENT_OFFICES.filter((office) =>
    office.servicesHandled.includes(serviceId)
  );
}

export function getTalukasForDistrict(districtName: string): readonly string[] {
  const district = getDistrictInfo(districtName);
  return district ? district.talukas : [];
}

export const ALL_OFFICE_CATEGORIES: readonly OfficeCategory[] = [
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
  'District Hospital / Health Office',
];
