import type { ViewMode } from '@/lib/nivaari/domain';

export type AtlasBlock = {
  id: string;
  x: number;
  z: number;
  color: string;
  hasCity?: boolean;
};

const PALETTE = ['#2563eb', '#16a34a', '#b45309', '#7c3aed', '#dc2626', '#0891b2', '#ca8a04', '#15803d'];

function buildGridBlocks(
  names: string[],
  {
    columns,
    spacingX = 16,
    spacingZ = 16,
    startX,
    startZ,
    hasCity = false,
  }: {
    columns: number;
    spacingX?: number;
    spacingZ?: number;
    startX?: number;
    startZ?: number;
    hasCity?: boolean;
  }
): AtlasBlock[] {
  const rows = Math.ceil(names.length / columns);
  const offsetX = startX ?? -((columns - 1) * spacingX) / 2;
  const offsetZ = startZ ?? -((rows - 1) * spacingZ) / 2;

  return names.map((name, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    return {
      id: name,
      x: offsetX + col * spacingX,
      z: offsetZ + row * spacingZ,
      color: PALETTE[index % PALETTE.length],
      hasCity,
    };
  });
}

const WORLD_COUNTRIES = [
  'India', 'United States', 'Brazil', 'Japan', 'Germany', 'Canada',
  'United Kingdom', 'France', 'Italy', 'Spain', 'Mexico', 'Australia',
  'Indonesia', 'China', 'South Korea', 'South Africa', 'Nigeria', 'Egypt',
  'Saudi Arabia', 'Turkey', 'Argentina', 'Chile', 'Colombia', 'Peru',
  'Thailand', 'Vietnam', 'Philippines', 'Pakistan', 'Bangladesh', 'Nepal',
  'Sri Lanka', 'UAE', 'Kenya', 'Ethiopia', 'Russia', 'Ukraine',
];

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

const USA_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
  'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

const BRAZIL_STATES = [
  'Acre', 'Alagoas', 'Amapa', 'Amazonas', 'Bahia', 'Ceara', 'Distrito Federal', 'Espirito Santo',
  'Goias', 'Maranhao', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Para', 'Paraiba',
  'Parana', 'Pernambuco', 'Piaui', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul',
  'Rondonia', 'Roraima', 'Santa Catarina', 'Sao Paulo', 'Sergipe', 'Tocantins',
];

const GERMANY_STATES = [
  'Baden-Wurttemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony',
  'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony',
  'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
];

const JAPAN_PREFECTURES = [
  'Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima', 'Ibaraki', 'Tochigi', 'Gunma',
  'Saitama', 'Chiba', 'Tokyo', 'Kanagawa', 'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano',
  'Gifu', 'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara', 'Wakayama',
  'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi', 'Tokushima', 'Kagawa', 'Ehime', 'Kochi',
  'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa',
];

const COUNTRY_TO_SUBDIVISIONS: Record<string, string[]> = {
  India: INDIA_STATES,
  'United States': USA_STATES,
  Brazil: BRAZIL_STATES,
  Germany: GERMANY_STATES,
  Japan: JAPAN_PREFECTURES,
};

const STATE_TO_CITIES: Record<string, string[]> = {
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Shivamogga'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar'],
  Delhi: ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli'],
  California: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno'],
  Texas: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers'],
  Florida: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee', 'St. Petersburg'],
  Bavaria: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Wurzburg', 'Ingolstadt'],
  Berlin: ['Mitte', 'Kreuzberg', 'Neukolln', 'Charlottenburg', 'Spandau', 'Pankow'],
  Tokyo: ['Shinjuku', 'Shibuya', 'Minato', 'Chiyoda', 'Setagaya', 'Taito'],
  Osaka: ['Kita', 'Naniwa', 'Tennoji', 'Sakai', 'Hirakata', 'Suita'],
  'Sao Paulo': ['Sao Paulo', 'Campinas', 'Santos', 'Sorocaba', 'Ribeirao Preto', 'Sao Jose dos Campos'],
  'Rio de Janeiro': ['Rio de Janeiro', 'Niteroi', 'Petropolis', 'Volta Redonda', 'Nova Iguacu', 'Campos'],
};

function buildStateFallback(state: string) {
  return buildGridBlocks(
    Array.from({ length: 9 }, (_, index) => `${state} Region ${index + 1}`),
    { columns: 3, spacingX: 18, spacingZ: 18, hasCity: true }
  );
}

export function getAtlasBlocks(viewMode: ViewMode, country: string | null, state: string | null): AtlasBlock[] {
  if (viewMode === 'world') {
    return buildGridBlocks(WORLD_COUNTRIES, { columns: 6, spacingX: 18, spacingZ: 18 });
  }

  if (viewMode === 'country') {
    const names = COUNTRY_TO_SUBDIVISIONS[country || ''];
    return names ? buildGridBlocks(names, { columns: 6, spacingX: 16, spacingZ: 14 }) : [];
  }

  if (viewMode === 'state') {
    const names = STATE_TO_CITIES[state || ''];
    return names ? buildGridBlocks(names, { columns: 3, spacingX: 20, spacingZ: 18, hasCity: true }) : buildStateFallback(state || 'City');
  }

  return [];
}
