import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient';
import { track } from '@/utils/analytics';

// --- data types -------------------------------------------------------------
export interface NivaariData {
  category: string;
  zone: string;
  confidence: number; // percentage 0-100
  upvotes: number;
  downvotes: number;
  hasEmergency?: boolean;
  emergencyType?: string;
}

export type TileType = 'empty' | 'road' | 'building' | 'hospital' | 'nature' | 'police' | 'industrial';

export interface Tile {
  id: string; // "x,z"
  x: number;
  z: number;
  width?: number; // number of tiles wide (defaults to 1)
  depth?: number; // number of tiles deep (defaults to 1)
  type: TileType;
  creator?: string | null;
  isVerified?: boolean;
  disaster?: { category: 'manmade' | 'natural'; type?: string };
  data?: NivaariData;
}

interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  text: string;
}

interface UserIdentity {
  socialId: string | null;
  recoveryKey: string | null;
  isAuthenticated: boolean;
  reputation: number;
}

export interface SectorStats {
  avgConfidence: number;         // "mood" of residential
  infrastructureHealth: number;  // percentage w/o emergencies
  totalCoverage: number;         // number of tiles
  publicCount: number;
  privateCount: number;
  emergencies: { id: string; type: string; x: number; z: number }[];
}

interface NivaariState {
  grid: Record<string, Tile>;
  activeTool: 'inspect' | 'road' | 'building' | 'hospital' | 'nature' | 'police' | 'industrial';
  activeFilter: 'default' | 'confidence' | 'zone';
  dragStart: [number, number] | null;
  dragCurrent: [number, number] | null;
  selectedTile: Tile | null;
  chatHistory: ChatMessage[];
  user: UserIdentity;
  hasCompletedTutorial: boolean;
  completeTutorial: () => void;
  addReputation: (amount: number) => void;
  syncReputation: () => Promise<void>;
  bumpOtherReputation: (userId: string, amount: number) => Promise<void>;
  isTravelModeActive: boolean;
  travelType: 'walk' | 'car' | 'train' | null;
  lastGpsPosition: { lat: number; lon: number } | null;

  // macro navigation state (world/region/city)
  viewMode: 'world' | 'region' | 'city';
  currentCountry: string | null;
  currentState: string | null;
  currentSector: [number, number];
  isLoadingSector: boolean;
  setSector: (x: number, z: number) => void;
  fetchSector: (x: number, z: number) => Promise<void>;

  placeTile: (x: number, z: number) => void;
  selectTile: (x: number, z: number) => void;
  voteTile: (id: string, type: 'upvote' | 'downvote') => void;
  sendMessage: (text: string) => void;
  generateIdentity: () => void;
  login: (socialId: string, recoveryKey: string) => boolean;
  setActiveFilter: (filter: 'default' | 'confidence' | 'zone') => void;
  setDragStart: (x: number, z: number) => void;
  setDragCurrent: (x: number, z: number) => void;
  commitDrag: () => void;
  reportEmergency: (id: string, type: string) => void;
  reportMajorDisaster: (id: string, category: 'manmade' | 'natural') => void;
  activateTravelMode: (type: 'walk' | 'car' | 'train') => void;
  deactivateTravelMode: () => void;
  syncGpsToGrid: (lat: number, lon: number) => void;
  loadGrid: (tiles: Record<string, Tile>) => void;
  updateTileShape: (oldId: string, newPositions: string[]) => void;
  calculateSectorStats: () => SectorStats;
}

// define base initializer separately for readability
const baseInitializer: (set: any, get: any) => NivaariState = (set, get) => ({
  grid: {},
  activeTool: 'inspect',
  selectedTile: null,
  dragStart: null,
  dragCurrent: null,
  chatHistory: [],
  user: { socialId: null, recoveryKey: null, isAuthenticated: false, reputation: 0 },
  hasCompletedTutorial: false,
  completeTutorial: () => {
    set({ hasCompletedTutorial: true });
    // give bonus reputation and track event
    get().addReputation(50);
    try { track('Tutorial Completed'); } catch {}
  },
  activeFilter: 'default',
  isTravelModeActive: false,
  viewMode: 'city',
  currentCountry: null,
  currentState: null,
  currentSector: [0, 0],
  isLoadingSector: false,
  travelType: null,
  lastGpsPosition: null,
  placeTile: (x, z) => {
    const { activeTool, grid, user } = get();
    if (activeTool === 'inspect') return;
    const id = `${x},${z}`;
    const existing = grid[id];
    if (existing && existing.isVerified && user.reputation <= 500) {
      return; // cannot overwrite verified tile
    }
    const categoryMap: Record<TileType, string> = {
      road: 'infrastructure',
      building: 'residential',
      hospital: 'health',
      nature: 'nature',
      police: 'safety',
      industrial: 'industrial',
      empty: '',
    };
    const tile: Tile = {
      id,
      x,
      z,
      type: activeTool as TileType,
      creator: user.socialId || null,
      data: {
        category: categoryMap[activeTool as TileType] || '',
        zone: '',
        confidence: 100,
        upvotes: 0,
        downvotes: 0,
      },
    };
    set({ grid: { ...grid, [id]: tile } });
    get().addReputation(5);
    // tutorial check
    if (!get().hasCompletedTutorial) {
      // signal externally via event; component will listen
      window.dispatchEvent(new CustomEvent('tutorial-place'));
    }
    // analytics
    try { track('Tile Placed', { type: tile.type, isComposite: !!(tile.width && tile.depth && (tile.width>1||tile.depth>1)) }); } catch {}
    // optimistic cloud sync
    (async () => {
      if (!supabase) return;
      const { error } = await supabase.from('tiles').upsert(tile);
      if (error) console.error(error);
    })();
  },

  selectTile: (x, z) => {
    const { grid } = get();
    const id = `${x},${z}`;
    const tile = grid[id] ?? null;
    set({ selectedTile: tile });
  },

  voteTile: (id, type) => {
    const { grid, user } = get();
    const tile = grid[id];
    if (!tile || !tile.data) return;

    if (type === 'upvote') {
      tile.data.upvotes += 1;
      if (tile.creator && tile.creator !== user.socialId) {
        get().bumpOtherReputation(tile.creator, 2);
      }
    } else {
      tile.data.downvotes += 1;
    }
    const total = tile.data.upvotes + tile.data.downvotes;
    tile.data.confidence = total > 0 ? Math.round((tile.data.upvotes / total) * 100) : 0;
    // check verification threshold
    const diff = tile.data.upvotes - tile.data.downvotes;
    if (diff >= 10 && !tile.isVerified) {
      tile.isVerified = true;
    }

    set({ grid: { ...grid, [id]: { ...tile } }, selectedTile: { ...tile } });
    (async () => {
      if (!supabase) return;
      const { error } = await supabase.from('tiles').upsert(tile);
      if (error) console.error(error);
    })();
  },

  sendMessage: async (text) => {
    try { track('AI Chat Used', { messageLength: text.length }); } catch {}
    set((state) => ({ chatHistory: [...state.chatHistory, { role: 'user', text }] }));
    try {
      const resp = await fetch('/api/nivaari-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: get().chatHistory.concat({ role: 'user', text }) }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'AI error');
      const { category, type, confidence } = data;
      if (type) {
        const x = 0;
        const z = 0;
        const id = `${x},${z}`;
        const tile: Tile = {
          id,
          x,
          z,
          type: type as TileType,
          data: {
            category: category || '',
            zone: 'public',
            confidence: confidence || 50,
            upvotes: 0,
            downvotes: 0,
          },
        };
        set((state) => ({ grid: { ...state.grid, [id]: tile } }));
        set((state) => ({ chatHistory: [...state.chatHistory, { role: 'system', text: JSON.stringify(data, null, 2) }] }));
      } else {
        set((state) => ({ chatHistory: [...state.chatHistory, { role: 'ai', text: "I couldn't interpret that." }] }));
      }
    } catch (err) {
      console.error('AI call failed', err);
      set((state) => ({ chatHistory: [...state.chatHistory, { role: 'ai', text: 'AI service unavailable.' }] }));
    }
  },

  generateIdentity: () => {
    const socialId = `NIV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const recoveryKey = uuidv4();
    set({ user: { socialId, recoveryKey, isAuthenticated: true, reputation: 0 } });
    try { track('User Created'); } catch {}
    // create profile in cloud
    (async () => {
      if (!supabase) return;
      await supabase.from('profiles').upsert({ id: socialId, reputation: 0 });
    })();
  },

  login: (socialId, recoveryKey) => {
    const { user } = get();
    if (user.socialId === socialId && user.recoveryKey === recoveryKey) {
      set({ user: { ...user, isAuthenticated: true } });
      try { track('User Logged In'); } catch {}
      get().syncReputation();
      return true;
    }
    return false;
  },
  setActiveFilter: (filter) => {
    set({ activeFilter: filter });
  },
  setDragStart: (x, z) => {
    set({ dragStart: [x, z], dragCurrent: [x, z] });
  },
  setDragCurrent: (x, z) => {
    const { dragStart } = get();
    if (!dragStart) return;
    set({ dragCurrent: [x, z] });
  },
  commitDrag: () => {
    const { dragStart, dragCurrent, grid, activeTool, user } = get();
    if (!dragStart || !dragCurrent) return;
    const [sx, sz] = dragStart;
    const [cx, cz] = dragCurrent;
    const minX = Math.min(sx, cx);
    const minZ = Math.min(sz, cz);
    const maxX = Math.max(sx, cx);
    const maxZ = Math.max(sz, cz);
    const width = maxX - minX + 1;
    const depth = maxZ - minZ + 1;
    // check occupancy
    for (let xi = minX; xi <= maxX; xi++) {
      for (let zi = minZ; zi <= maxZ; zi++) {
        if (grid[`${xi},${zi}`]) {
          set({ dragStart: null, dragCurrent: null });
          return;
        }
      }
    }
    const id = `${minX},${minZ}`;
    const tile: Tile = {
      id,
      x: minX,
      z: minZ,
      width,
      depth,
      type: activeTool as TileType,
      data: {
        category: '',
        zone: '',
        confidence: 100,
        upvotes: 0,
        downvotes: 0,
      },
    };
    const newGrid = { ...grid };
    for (let xi = minX; xi <= maxX; xi++) {
      for (let zi = minZ; zi <= maxZ; zi++) {
        newGrid[`${xi},${zi}`] = tile;
      }
    }
    set({ grid: newGrid, dragStart: null, dragCurrent: null });
    (async () => {
      if (!supabase) return;
      const { error } = await supabase.from('tiles').upsert(tile);
      if (error) console.error(error);
    })();
  },
  updateTileShape: (oldId: string, newPositions: string[]) => {
    const { grid, user } = get();
    const oldTile = grid[oldId];
    if (!oldTile) return;
    if (oldTile.isVerified && user.reputation <= 500) return;
    const xs = newPositions.map((p) => parseInt(p.split(',')[0]));
    const zs = newPositions.map((p) => parseInt(p.split(',')[1]));
    const minX = Math.min(...xs);
    const minZ = Math.min(...zs);
    const width = Math.max(...xs) - minX + 1;
    const depth = Math.max(...zs) - minZ + 1;
    const tile: Tile = {
      ...oldTile,
      id: `${minX},${minZ}`,
      x: minX,
      z: minZ,
      width,
      depth,
    };
    const newGrid = { ...grid };
    for (const key in newGrid) {
      if (newGrid[key] === oldTile) delete newGrid[key];
    }
    newPositions.forEach((p) => {
      newGrid[p] = tile;
    });
    set({ grid: newGrid, selectedTile: tile });
    (async () => {
      if (!supabase) return;
      const { error } = await supabase.from('tiles').upsert(tile);
      if (error) console.error(error);
    })();
  },
  reportEmergency: (id, type) => {
    try { track('Emergency Reported', { disasterType: type }); } catch {}
    const { grid, user } = get();
    const tile = grid[id];
    if (!tile) return;
    tile.data = { ...tile.data, hasEmergency: true, emergencyType: type };
    set({ grid: { ...grid, [id]: { ...tile } } });
    get().addReputation(10);
    (async () => {
      if (!supabase) return;
      const { error } = await supabase.from('tiles').upsert(tile);
      if (error) console.error(error);
    })();
  },
  reportMajorDisaster: (id, category) => {
    try { track('Emergency Reported', { disasterType: category + '-major' }); } catch {}
    const { grid } = get();
    const tile = grid[id];
    if (!tile) return;
    tile.disaster = { category };
    set({ grid: { ...grid, [id]: tile } });
    (async () => {
      if (!supabase) return;
      const { error } = await supabase.from('tiles').upsert(tile);
      if (error) console.error(error);
      const webhookUrl = process.env.NEXT_PUBLIC_DISASTER_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch('/api/webhook/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tile }),
        });
      }
    })();
  },
  activateTravelMode: (type) => {
    set({ isTravelModeActive: true, travelType: type });
  },
  deactivateTravelMode: () => {
    set({ isTravelModeActive: false, travelType: null });
  },
  addReputation: (amount) => {
    set((state) => ({ user: { ...state.user, reputation: state.user.reputation + amount } }));
    const id = get().user.socialId;
    if (!supabase || !id) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('reputation').eq('id', id).single();
      const newRep = (data?.reputation || 0) + amount;
      await supabase.from('profiles').upsert({ id, reputation: newRep });
    })();
  },
  bumpOtherReputation: async (userId, amount) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('reputation').eq('id', userId).single();
    const newRep = (data?.reputation || 0) + amount;
    await supabase.from('profiles').upsert({ id: userId, reputation: newRep });
  },
  syncReputation: async () => {
    const id = get().user.socialId;
    if (!supabase || !id) return;
    const { data } = await supabase.from('profiles').select('reputation').eq('id', id).single();
    if (data) set({ user: { ...get().user, reputation: data.reputation || 0 } });
  },
  syncGpsToGrid: (lat, lon) => {
    const { lastGpsPosition } = get();
    if (!lastGpsPosition) {
      set({ lastGpsPosition: { lat, lon } });
      return;
    }
    // simple approximation using difference
    const dLat = lat - lastGpsPosition.lat;
    const dLon = lon - lastGpsPosition.lon;
    const metersPerDeg = 111320; // rough
    const dx = dLon * metersPerDeg * Math.cos(lat * (Math.PI/180));
    const dz = dLat * metersPerDeg;

    const threshold = 10; // meters
    if (Math.abs(dx) > threshold || Math.abs(dz) > threshold) {
      // decide direction grid move
      const moveX = Math.abs(dx) > Math.abs(dz);
      const stepX = moveX ? Math.sign(dx) : 0;
      const stepZ = moveX ? 0 : Math.sign(dz);
      // place road at 0,0 + offset
      const x = stepX;
      const z = stepZ;
      // use existing placeTile but ensure activeTool is road
      useNivaariStore.setState({ activeTool: 'road' });
      get().placeTile(x, z);
      set({ lastGpsPosition: { lat, lon } });
    }
  },
  setSector: (x, z) => {
    set({ currentSector: [x, z] });
  },
  // macro nav actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setLocationHierarchy: (country, state, sector) => set({ currentCountry: country, currentState: state }),
  fetchSector: async (sx, sz) => {
    set({ isLoadingSector: true, currentSector: [sx, sz] });
    if (!supabase) { set({ isLoadingSector: false }); return; }
    const x0 = sx * 50;
    const x1 = x0 + 49;
    const z0 = sz * 50;
    const z1 = z0 + 49;
    const { data, error } = await supabase
      .from('tiles')
      .select('*')
      .gte('x', x0)
      .lte('x', x1)
      .gte('z', z0)
      .lte('z', z1);
    if (!error && data) {
      const newGrid = { ...get().grid };
      data.forEach((r: any) => {
        newGrid[r.id] = {
          id: r.id,
          x: r.x,
          z: r.z,
          type: r.type as TileType,
          width: r.width || undefined,
          depth: r.depth || undefined,
          creator: r.creator || null,
          data: r.data,
        };
      });
      set({ grid: newGrid });
    }
    set({ isLoadingSector: false });
  },
  loadGrid: (tiles: Record<string, Tile>) => {
    set({ grid: tiles });
  },
  calculateSectorStats: () => {
    const { grid } = get() as { grid: Record<string, Tile> };
    const tiles: Tile[] = Object.values(grid);
    const totalCoverage = tiles.length;
    let confSum = 0;
    let confCount = 0;
    let emergencyCount = 0;
    let publicCount = 0;
    let privateCount = 0;
    const emergencies: { id: string; type: string; x: number; z: number }[] = [];

    tiles.forEach((t) => {
      if (t.data) {
        // residential mood
        if (t.data.category === 'residential') {
          confSum += t.data.confidence;
          confCount += 1;
        }
        // zone counts
        if (t.data.zone === 'public') publicCount += 1;
        else if (t.data.zone === 'private') privateCount += 1;
        // emergencies
        if (t.data.hasEmergency) {
          emergencyCount += 1;
          emergencies.push({ id: t.id, type: t.data.emergencyType || 'unknown', x: t.x, z: t.z });
        }
      }
    });

    const avgConfidence = confCount > 0 ? confSum / confCount : 0;
    const infrastructureHealth = totalCoverage > 0 ? ((totalCoverage - emergencyCount) / totalCoverage) * 100 : 100;

    return {
      avgConfidence,
      infrastructureHealth,
      totalCoverage,
      publicCount,
      privateCount,
      emergencies,
    };
  },
});

export const useNivaariStore = create<NivaariState>(
  (persist(baseInitializer, {
    name: 'nivaari-storage',
    partialize: (state) => ({ grid: state.grid, chatHistory: state.chatHistory, user: state.user }),
  }) as unknown as StateCreator<NivaariState>)
);
