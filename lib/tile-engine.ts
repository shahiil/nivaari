export type TileCategory =
  | 'infrastructure'
  | 'services'
  | 'environment'
  | 'emergency'
  | 'social'
  | 'health'
  | 'transportation'
  | 'disaster'
  | 'civic'
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'agriculture'
  | 'forest'
  | 'water-body';

export type TileZone =
  | 'commercial'
  | 'residential'
  | 'semi-residential'
  | 'industrial'
  | 'agriculture'
  | 'forest'
  | 'harbour';

export type TransportType = 'land' | 'rail' | 'sea' | 'air';

export interface TileStatistics {
  mood: number;
  satisfaction: number;
  serviceLevel: number;
  infrastructureHealth: number;
  disasterRisk: number;
  crowdLevel: 'low' | 'moderate' | 'high';
}

export interface NivaariTile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category: TileCategory;
  zone: TileZone;
  name: string;
  description: string;
  services: string[];
  environmentalIndicators: string[];
  infrastructureType: string;
  transportTypes: TransportType[];
  disasters: string[];
  votes: {
    upvotes: number;
    downvotes: number;
  };
  statistics: TileStatistics;
  hierarchyLevel: 'world' | 'country' | 'state' | 'city' | 'zone' | 'building' | 'citizen';
  color?: string;
}

const CATEGORY_CYCLE: TileCategory[] = [
  'residential',
  'commercial',
  'environment',
  'health',
  'transportation',
  'infrastructure',
  'services',
  'water-body',
  'emergency',
  'social',
  'disaster',
  'forest',
];

const ZONE_BY_CATEGORY: Record<TileCategory, TileZone> = {
  infrastructure: 'industrial',
  services: 'commercial',
  environment: 'forest',
  emergency: 'commercial',
  social: 'semi-residential',
  health: 'commercial',
  transportation: 'commercial',
  disaster: 'industrial',
  civic: 'commercial',
  residential: 'residential',
  commercial: 'commercial',
  industrial: 'industrial',
  agriculture: 'agriculture',
  forest: 'forest',
  'water-body': 'harbour',
};

const SERVICES_BY_CATEGORY: Record<TileCategory, string[]> = {
  infrastructure: ['power grid', 'water supply', 'waste management'],
  services: ['food', 'internet services', 'finance'],
  environment: ['pollution watch', 'tree cover', 'air quality'],
  emergency: ['ambulance', 'fire brigade', 'police'],
  social: ['community feedback', 'citizen sentiment'],
  health: ['hospital', 'dental', 'mental health'],
  transportation: ['bus', 'train', 'walking'],
  disaster: ['flood alerts', 'fire hazards'],
  civic: ['government office', 'public registry'],
  residential: ['housing', 'water', 'security'],
  commercial: ['retail', 'banking', 'logistics'],
  industrial: ['manufacturing', 'energy', 'waste'],
  agriculture: ['farmland', 'water', 'storage'],
  forest: ['parks', 'tree cover', 'biodiversity'],
  'water-body': ['water quality', 'harbour access'],
};

const ENVIRONMENT_BY_CATEGORY: Record<TileCategory, string[]> = {
  infrastructure: ['dust: moderate', 'noise: elevated'],
  services: ['footfall: steady', 'waste load: moderate'],
  environment: ['air: fair', 'noise: low'],
  emergency: ['response readiness: high', 'crowd pressure: moderate'],
  social: ['sentiment: mixed', 'activity: rising'],
  health: ['air: fair', 'sanitation: high'],
  transportation: ['noise: elevated', 'congestion: moderate'],
  disaster: ['risk pattern: unstable', 'visibility: fair'],
  civic: ['accessibility: good', 'crowd pressure: low'],
  residential: ['air: fair', 'noise: moderate'],
  commercial: ['air: moderate', 'noise: elevated'],
  industrial: ['air: poor', 'noise: high'],
  agriculture: ['soil moisture: stable', 'water stress: low'],
  forest: ['air: high quality', 'biodiversity: healthy'],
  'water-body': ['water quality: variable', 'flood watch: active'],
};

const INFRASTRUCTURE_BY_CATEGORY: Record<TileCategory, string> = {
  infrastructure: 'utility corridor',
  services: 'service cluster',
  environment: 'green belt',
  emergency: 'response hub',
  social: 'community node',
  health: 'care facility',
  transportation: 'mobility corridor',
  disaster: 'risk cluster',
  civic: 'public institution',
  residential: 'housing block',
  commercial: 'market block',
  industrial: 'industrial estate',
  agriculture: 'agri parcel',
  forest: 'forest patch',
  'water-body': 'water body',
};

const DISASTERS_BY_CATEGORY: Record<TileCategory, string[]> = {
  infrastructure: ['technical failure'],
  services: ['social unrest'],
  environment: ['deforestation'],
  emergency: ['epidemic'],
  social: ['riots'],
  health: ['epidemic'],
  transportation: ['flooding'],
  disaster: ['flooding', 'fire'],
  civic: ['social unrest'],
  residential: ['flooding'],
  commercial: ['fire'],
  industrial: ['technical failure', 'fire'],
  agriculture: ['pest infestations'],
  forest: ['wildfire'],
  'water-body': ['flooding'],
};

const TRANSPORT_BY_CATEGORY: Record<TileCategory, TransportType[]> = {
  infrastructure: ['land'],
  services: ['land'],
  environment: ['land'],
  emergency: ['land'],
  social: ['land'],
  health: ['land'],
  transportation: ['land', 'rail'],
  disaster: ['land'],
  civic: ['land'],
  residential: ['land'],
  commercial: ['land'],
  industrial: ['land', 'rail'],
  agriculture: ['land'],
  forest: ['land'],
  'water-body': ['sea'],
};

// Curated tile positions: [x, y, category, width?, height?]
const CURATED_TILE_SPECS: [number, number, TileCategory, number?, number?][] = [
  // Residential cluster (top-left)
  [0, 0, 'residential', 2, 2],
  [3, 1, 'residential'],
  [5, 0, 'residential'],
  [1, 4, 'residential'],
  [7, 3, 'residential'],

  // Commercial strip (center-ish)
  [4, 4, 'commercial', 2, 1],
  [8, 1, 'commercial'],
  [10, 4, 'commercial'],
  [2, 7, 'commercial'],
  [9, 7, 'commercial'],

  // Environment / green spaces
  [6, 2, 'environment', 2, 2],
  [0, 6, 'environment'],
  [12, 2, 'environment'],
  [5, 9, 'environment'],
  [11, 9, 'environment'],

  // Health facilities
  [3, 5, 'health'],
  [9, 3, 'health'],
  [7, 8, 'health'],
  [1, 10, 'health'],

  // Transportation corridors
  [4, 2, 'transportation', 1, 3],
  [8, 5, 'transportation', 3, 1],
  [6, 9, 'transportation'],
  [0, 3, 'transportation'],
  [13, 5, 'transportation'],

  // Emergency / civic nodes
  [2, 2, 'emergency'],
  [10, 1, 'emergency'],
  [5, 6, 'emergency'],
  [12, 7, 'emergency'],
  [3, 9, 'emergency'],

  // Infrastructure
  [7, 0, 'infrastructure'],
  [11, 5, 'infrastructure'],
  [0, 8, 'infrastructure'],
  [9, 10, 'infrastructure'],

  // Services
  [4, 8, 'services'],
  [13, 2, 'services'],
  [6, 5, 'services'],
  [1, 2, 'services'],

  // Water body
  [11, 0, 'water-body', 2, 2],
  [13, 8, 'water-body'],
];

export const generateCuratedTiles = (): NivaariTile[] => {
  return CURATED_TILE_SPECS.map(([x, y, category, width = 1, height = 1]) => {
    const serviceLevel = 52 + ((x * 9 + y * 7 + 1000) % 38);
    const infrastructureHealth = 44 + ((x * 11 - y * 5 + 1000) % 47);
    const disasterRisk = 18 + ((x * 13 + y * 3 + 1000) % 68);
    const mood = 40 + ((x * 5 + y * 9 + 1000) % 52);
    const satisfaction = 45 + ((x * 3 + y * 11 + 1000) % 48);
    const crowdScale = (x + y + 300) % 3;

    return {
      id: `tile-${x}-${y}`,
      x,
      y,
      width,
      height,
      category,
      zone: ZONE_BY_CATEGORY[category],
      name: buildTileName(category, x, y),
      description: buildTileDescription(category, x, y),
      services: SERVICES_BY_CATEGORY[category],
      environmentalIndicators: ENVIRONMENT_BY_CATEGORY[category],
      infrastructureType: INFRASTRUCTURE_BY_CATEGORY[category],
      transportTypes: TRANSPORT_BY_CATEGORY[category],
      disasters: DISASTERS_BY_CATEGORY[category],
      votes: {
        upvotes: 15 + ((x * 7 + y * 13 + 1000) % 140),
        downvotes: 1 + ((x * 3 + y * 5 + 1000) % 18),
      },
      statistics: {
        mood,
        satisfaction,
        serviceLevel,
        infrastructureHealth,
        disasterRisk,
        crowdLevel: crowdScale === 0 ? 'low' : crowdScale === 1 ? 'moderate' : 'high',
      },
      hierarchyLevel: width > 1 || height > 1 ? 'building' : 'zone',
      color: getColorForCategory(category),
    };
  });
};

export const generateDummyTiles = (centerX: number, centerY: number, radius: number): NivaariTile[] => {
  const tiles: NivaariTile[] = [];

  for (let x = centerX - radius; x <= centerX + radius; x += 1) {
    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      const seed = Math.abs((x * 31 + y * 17) % CATEGORY_CYCLE.length);
      const category = CATEGORY_CYCLE[seed];
      const width = x % 7 === 0 && y % 5 === 0 ? 2 : 1;
      const height = x % 7 === 0 && y % 5 === 0 ? 2 : 1;
      const serviceLevel = 52 + ((x * 9 + y * 7 + 1000) % 38);
      const infrastructureHealth = 44 + ((x * 11 - y * 5 + 1000) % 47);
      const disasterRisk = 18 + ((x * 13 + y * 3 + 1000) % 68);
      const mood = 40 + ((x * 5 + y * 9 + 1000) % 52);
      const satisfaction = 45 + ((x * 3 + y * 11 + 1000) % 48);
      const crowdScale = (x + y + 300) % 3;

      tiles.push({
        id: `tile-${x}-${y}`,
        x,
        y,
        width,
        height,
        category,
        zone: ZONE_BY_CATEGORY[category],
        name: buildTileName(category, x, y),
        description: buildTileDescription(category, x, y),
        services: SERVICES_BY_CATEGORY[category],
        environmentalIndicators: ENVIRONMENT_BY_CATEGORY[category],
        infrastructureType: INFRASTRUCTURE_BY_CATEGORY[category],
        transportTypes: TRANSPORT_BY_CATEGORY[category],
        disasters: DISASTERS_BY_CATEGORY[category],
        votes: {
          upvotes: 15 + ((x * 7 + y * 13 + 1000) % 140),
          downvotes: 1 + ((x * 3 + y * 5 + 1000) % 18),
        },
        statistics: {
          mood,
          satisfaction,
          serviceLevel,
          infrastructureHealth,
          disasterRisk,
          crowdLevel: crowdScale === 0 ? 'low' : crowdScale === 1 ? 'moderate' : 'high',
        },
        hierarchyLevel: width > 1 ? 'building' : 'zone',
        color: getColorForCategory(category),
      });
    }
  }

  return tiles;
};

function buildTileName(category: TileCategory, x: number, y: number) {
  const label = category.replace('-', ' ');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${Math.abs(x)}:${Math.abs(y)}`;
}

function buildTileDescription(category: TileCategory, x: number, y: number) {
  return `Tile ${x},${y} tracks ${category.replace('-', ' ')} signals, services, and verification activity for nearby citizens.`;
}

export const getColorForCategory = (category: TileCategory): string => {
  switch (category) {
    case 'residential':
      return '#c08a2b';
    case 'commercial':
      return '#1976d2';
    case 'environment':
    case 'forest':
      return '#237a52';
    case 'health':
      return '#cb4f4f';
    case 'transportation':
      return '#5c7cfa';
    case 'infrastructure':
      return '#f97316';
    case 'services':
      return '#8b5cf6';
    case 'water-body':
      return '#0f8fbf';
    case 'emergency':
      return '#ef4444';
    case 'social':
      return '#ec4899';
    case 'disaster':
      return '#7c2d12';
    case 'industrial':
      return '#6b7280';
    case 'agriculture':
      return '#65a30d';
    case 'civic':
      return '#14b8a6';
    default:
      return '#334155';
  }
};
