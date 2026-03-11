export const TILE_TYPES = ['empty', 'road', 'building', 'hospital', 'nature', 'police', 'industrial'] as const;
export type TileType = (typeof TILE_TYPES)[number];

export const ACTIVE_TOOLS = ['inspect', 'road', 'building', 'hospital', 'nature', 'police', 'industrial'] as const;
export type ActiveTool = (typeof ACTIVE_TOOLS)[number];

export const ACTIVE_FILTERS = ['default', 'confidence', 'zone'] as const;
export type ActiveFilter = (typeof ACTIVE_FILTERS)[number];

export const TRAVEL_TYPES = ['walk', 'car', 'train'] as const;
export type TravelType = (typeof TRAVEL_TYPES)[number];

export const VIEW_MODES = ['world', 'country', 'state', 'city'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const DISASTER_CATEGORIES = ['manmade', 'natural'] as const;
export type DisasterCategory = (typeof DISASTER_CATEGORIES)[number];

export const CHAT_ROLES = ['user', 'ai', 'system'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export type TileZone = '' | 'public' | 'private';

export interface NivaariData {
  category: string;
  zone: TileZone;
  confidence: number;
  upvotes: number;
  downvotes: number;
  hasEmergency?: boolean;
  emergencyType?: string;
}

export interface Tile {
  id: string;
  x: number;
  z: number;
  width?: number;
  depth?: number;
  type: TileType;
  creator?: string | null;
  isVerified?: boolean;
  disaster?: {
    category: DisasterCategory;
    type?: string;
  };
  data?: NivaariData;
}

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export interface UserIdentity {
  socialId: string | null;
  recoveryKey: string | null;
  isAuthenticated: boolean;
  reputation: number;
}

export interface SectorStats {
  avgConfidence: number;
  infrastructureHealth: number;
  totalCoverage: number;
  publicCount: number;
  privateCount: number;
  emergencies: { id: string; type: string; x: number; z: number }[];
}

export interface TileRecord {
  id: string;
  x: number;
  z: number;
  type: TileType;
  width?: number | null;
  depth?: number | null;
  creator?: string | null;
  data?: NivaariData;
}

export interface AiTileSuggestion {
  category: string;
  type: TileType;
  confidence: number;
  attributes?: Record<string, unknown>;
}

export const DEFAULT_USER_IDENTITY: UserIdentity = {
  socialId: null,
  recoveryKey: null,
  isAuthenticated: false,
  reputation: 0,
};

export const TILE_CATEGORY_MAP: Record<TileType, string> = {
  empty: '',
  road: 'infrastructure',
  building: 'residential',
  hospital: 'health',
  nature: 'nature',
  police: 'safety',
  industrial: 'industrial',
};
