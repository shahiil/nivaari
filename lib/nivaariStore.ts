import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  type ActiveFilter,
  type ActiveTool,
  type ChatMessage,
  type DisasterCategory,
  type SectorStats,
  type Tile,
  type TravelType,
  type UserIdentity,
  type ViewMode,
  DEFAULT_USER_IDENTITY,
} from '@/lib/nivaari/domain';
import { calculateSectorStatsFromGrid, createTileFromTool, applyVoteToTile, isAreaOccupied, reshapeTile } from '@/lib/nivaari/tile-logic';
import { createProfile, fetchSectorTiles, notifyDisasterWebhook, requestAiTileSuggestion, safeTrack, syncProfileReputation, upsertTile } from '@/lib/nivaari/services';

export type {
  ActiveFilter,
  ActiveTool,
  ChatMessage,
  SectorStats,
  Tile,
  TravelType,
  UserIdentity,
  ViewMode,
} from '@/lib/nivaari/domain';

interface NivaariState {
  grid: Record<string, Tile>;
  activeTool: ActiveTool;
  activeFilter: ActiveFilter;
  dragStart: [number, number] | null;
  dragCurrent: [number, number] | null;
  selectedTile: Tile | null;
  chatHistory: ChatMessage[];
  user: UserIdentity;
  hasCompletedTutorial: boolean;
  isTravelModeActive: boolean;
  travelType: TravelType | null;
  lastGpsPosition: { lat: number; lon: number } | null;
  viewMode: ViewMode;
  currentCountry: string | null;
  currentState: string | null;
  currentSector: [number, number];
  isLoadingSector: boolean;

  completeTutorial: () => void;
  addReputation: (amount: number) => void;
  syncReputation: () => Promise<void>;
  bumpOtherReputation: (userId: string, amount: number) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setLocationHierarchy: (country: string | null, state: string | null, sector?: [number, number]) => void;
  setSector: (x: number, z: number) => void;
  fetchSector: (x: number, z: number) => Promise<void>;
  placeTile: (x: number, z: number) => void;
  selectTile: (x: number, z: number) => void;
  voteTile: (id: string, type: 'upvote' | 'downvote') => void;
  sendMessage: (text: string) => void;
  generateIdentity: () => void;
  login: (socialId: string, recoveryKey: string) => boolean;
  setActiveFilter: (filter: ActiveFilter) => void;
  setDragStart: (x: number, z: number) => void;
  setDragCurrent: (x: number, z: number) => void;
  commitDrag: () => void;
  reportEmergency: (id: string, type: string) => void;
  reportMajorDisaster: (id: string, category: DisasterCategory) => void;
  activateTravelMode: (type: TravelType) => void;
  deactivateTravelMode: () => void;
  syncGpsToGrid: (lat: number, lon: number) => void;
  loadGrid: (tiles: Record<string, Tile>) => void;
  updateTileShape: (oldId: string, newPositions: string[]) => void;
  calculateSectorStats: () => SectorStats;
}

const EMPTY_CHAT_REPLY: ChatMessage = {
  role: 'ai',
  text: 'AI service unavailable.',
};

const baseInitializer: StateCreator<NivaariState> = (set, get) => ({
  grid: {},
  activeTool: 'inspect',
  activeFilter: 'default',
  dragStart: null,
  dragCurrent: null,
  selectedTile: null,
  chatHistory: [],
  user: DEFAULT_USER_IDENTITY,
  hasCompletedTutorial: false,
  isTravelModeActive: false,
  travelType: null,
  lastGpsPosition: null,
  viewMode: 'city',
  currentCountry: null,
  currentState: null,
  currentSector: [0, 0],
  isLoadingSector: false,

  completeTutorial: () => {
    set({ hasCompletedTutorial: true });
    get().addReputation(50);
    safeTrack('Tutorial Completed');
  },

  addReputation: (amount) => {
    set((state) => ({ user: { ...state.user, reputation: state.user.reputation + amount } }));
    const id = get().user.socialId;
    if (!id) return;
    void syncProfileReputation(id, amount);
  },

  syncReputation: async () => {
    const id = get().user.socialId;
    if (!id) return;
    const reputation = await syncProfileReputation(id);
    set((state) => ({ user: { ...state.user, reputation } }));
  },

  bumpOtherReputation: async (userId, amount) => {
    await syncProfileReputation(userId, amount);
  },

  setViewMode: (mode) => set({ viewMode: mode, selectedTile: null }),
  setLocationHierarchy: (country, state, sector) =>
    set({
      currentCountry: country,
      currentState: state,
      ...(sector ? { currentSector: sector } : {}),
    }),
  setSector: (x, z) => set({ currentSector: [x, z] }),

  fetchSector: async (sx, sz) => {
    set({ isLoadingSector: true, currentSector: [sx, sz] });
    try {
      const data = await fetchSectorTiles(sx, sz);
      if (data.length === 0) {
        set({ isLoadingSector: false });
        return;
      }

      const nextGrid = { ...get().grid };
      data.forEach((row) => {
        nextGrid[row.id] = {
          id: row.id,
          x: row.x,
          z: row.z,
          type: row.type,
          width: row.width || undefined,
          depth: row.depth || undefined,
          creator: row.creator || null,
          data: row.data,
        };
      });
      set({ grid: nextGrid });
    } catch (error) {
      console.error('Failed to fetch sector', error);
    } finally {
      set({ isLoadingSector: false });
    }
  },

  placeTile: (x, z) => {
    const { activeTool, grid, user, hasCompletedTutorial } = get();
    if (activeTool === 'inspect') return;

    const existing = grid[`${x},${z}`];
    if (existing && existing.isVerified && user.reputation <= 500) {
      return;
    }

    const tile = createTileFromTool({ x, z, tool: activeTool, creator: user.socialId });
    set({ grid: { ...grid, [tile.id]: tile } });
    get().addReputation(5);

    if (!hasCompletedTutorial && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tutorial-place'));
    }

    safeTrack('Tile Placed', { type: tile.type, isComposite: false });
    void upsertTile(tile);
  },

  selectTile: (x, z) => {
    const id = `${x},${z}`;
    set({ selectedTile: get().grid[id] ?? null });
  },

  voteTile: (id, type) => {
    const { grid, selectedTile, user } = get();
    const currentTile = grid[id];
    if (!currentTile?.data) return;

    const nextTile = applyVoteToTile(currentTile, type);
    set({
      grid: { ...grid, [id]: nextTile },
      selectedTile: selectedTile?.id === id ? nextTile : selectedTile,
    });

    if (type === 'upvote' && nextTile.creator && nextTile.creator !== user.socialId) {
      void get().bumpOtherReputation(nextTile.creator, 2);
    }

    void upsertTile(nextTile);
  },

  sendMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const nextHistory = get().chatHistory.concat({ role: 'user', text: trimmed });
    safeTrack('AI Chat Used', { messageLength: trimmed.length });
    set({ chatHistory: nextHistory });

    try {
      const suggestion = await requestAiTileSuggestion(nextHistory);
      if (suggestion.type === 'empty') {
        set((state) => ({
          chatHistory: state.chatHistory.concat({
            role: 'ai',
            text: "I couldn't interpret that.",
          }),
        }));
        return;
      }

      const tile = {
        ...createTileFromTool({
          x: 0,
          z: 0,
          tool: suggestion.type,
          creator: get().user.socialId,
        }),
        data: {
          category: suggestion.category,
          zone: 'public' as const,
          confidence: suggestion.confidence,
          upvotes: 0,
          downvotes: 0,
        },
      };

      set((state) => ({
        grid: { ...state.grid, [tile.id]: tile },
        chatHistory: state.chatHistory.concat({
          role: 'system',
          text: JSON.stringify(suggestion, null, 2),
        }),
      }));
      void upsertTile(tile);
    } catch (error) {
      console.error('AI call failed', error);
      set((state) => ({ chatHistory: state.chatHistory.concat(EMPTY_CHAT_REPLY) }));
    }
  },

  generateIdentity: () => {
    const socialId = `NIV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const recoveryKey = uuidv4();
    set({ user: { socialId, recoveryKey, isAuthenticated: true, reputation: 0 } });
    safeTrack('User Created');
    void createProfile(socialId);
  },

  login: (socialId, recoveryKey) => {
    const { user } = get();
    if (user.socialId !== socialId || user.recoveryKey !== recoveryKey) {
      return false;
    }

    set({ user: { ...user, isAuthenticated: true } });
    safeTrack('User Logged In');
    void get().syncReputation();
    return true;
  },

  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setDragStart: (x, z) => set({ dragStart: [x, z], dragCurrent: [x, z] }),
  setDragCurrent: (x, z) => {
    if (!get().dragStart) return;
    set({ dragCurrent: [x, z] });
  },

  commitDrag: () => {
    const { dragStart, dragCurrent, grid, activeTool, user } = get();
    if (!dragStart || !dragCurrent || activeTool === 'inspect') return;

    const minX = Math.min(dragStart[0], dragCurrent[0]);
    const minZ = Math.min(dragStart[1], dragCurrent[1]);
    const maxX = Math.max(dragStart[0], dragCurrent[0]);
    const maxZ = Math.max(dragStart[1], dragCurrent[1]);
    if (isAreaOccupied(grid, minX, minZ, maxX, maxZ)) {
      set({ dragStart: null, dragCurrent: null });
      return;
    }

    const tile = createTileFromTool({
      x: minX,
      z: minZ,
      tool: activeTool,
      creator: user.socialId,
      width: maxX - minX + 1,
      depth: maxZ - minZ + 1,
    });

    const nextGrid = { ...grid };
    for (let xi = minX; xi <= maxX; xi += 1) {
      for (let zi = minZ; zi <= maxZ; zi += 1) {
        nextGrid[`${xi},${zi}`] = tile;
      }
    }

    set({ grid: nextGrid, dragStart: null, dragCurrent: null });
    safeTrack('Tile Placed', { type: tile.type, isComposite: true });
    void upsertTile(tile);
  },

  reportEmergency: (id, type) => {
    const tile = get().grid[id];
    if (!tile) return;

    const nextTile: Tile = {
      ...tile,
      data: {
        category: tile.data?.category || '',
        zone: tile.data?.zone || '',
        confidence: tile.data?.confidence ?? 100,
        upvotes: tile.data?.upvotes ?? 0,
        downvotes: tile.data?.downvotes ?? 0,
        hasEmergency: true,
        emergencyType: type,
      },
    };

    set((state) => ({ grid: { ...state.grid, [id]: nextTile }, selectedTile: nextTile }));
    get().addReputation(10);
    safeTrack('Emergency Reported', { disasterType: type });
    void upsertTile(nextTile);
  },

  reportMajorDisaster: (id, category) => {
    const tile = get().grid[id];
    if (!tile) return;

    const nextTile: Tile = {
      ...tile,
      disaster: { category },
    };
    set((state) => ({ grid: { ...state.grid, [id]: nextTile }, selectedTile: nextTile }));
    safeTrack('Emergency Reported', { disasterType: `${category}-major` });
    void upsertTile(nextTile);
    void notifyDisasterWebhook(nextTile);
  },

  activateTravelMode: (type) => set({ isTravelModeActive: true, travelType: type }),
  deactivateTravelMode: () => set({ isTravelModeActive: false, travelType: null }),

  syncGpsToGrid: (lat, lon) => {
    const { lastGpsPosition } = get();
    if (!lastGpsPosition) {
      set({ lastGpsPosition: { lat, lon } });
      return;
    }

    const dLat = lat - lastGpsPosition.lat;
    const dLon = lon - lastGpsPosition.lon;
    const metersPerDeg = 111320;
    const dx = dLon * metersPerDeg * Math.cos(lat * (Math.PI / 180));
    const dz = dLat * metersPerDeg;
    const threshold = 10;

    if (Math.abs(dx) <= threshold && Math.abs(dz) <= threshold) return;

    const moveX = Math.abs(dx) > Math.abs(dz);
    const x = moveX ? Math.sign(dx) : 0;
    const z = moveX ? 0 : Math.sign(dz);
    useNivaariStore.setState({ activeTool: 'road' });
    get().placeTile(x, z);
    set({ lastGpsPosition: { lat, lon } });
  },

  loadGrid: (tiles) => set({ grid: tiles }),

  updateTileShape: (oldId, newPositions) => {
    const { grid, user } = get();
    const oldTile = grid[oldId];
    if (!oldTile) return;
    if (oldTile.isVerified && user.reputation <= 500) return;

    const nextTile = reshapeTile(oldTile, newPositions);
    const nextGrid = { ...grid };
    Object.entries(nextGrid).forEach(([key, value]) => {
      if (value === oldTile) {
        delete nextGrid[key];
      }
    });
    newPositions.forEach((position) => {
      nextGrid[position] = nextTile;
    });

    set({ grid: nextGrid, selectedTile: nextTile });
    void upsertTile(nextTile);
  },

  calculateSectorStats: (() => {
    let lastGrid: Record<string, Tile> | null = null;
    let lastResult: SectorStats | null = null;

    return () => {
      const grid = get().grid;
      if (grid === lastGrid && lastResult) {
        return lastResult;
      }
      lastGrid = grid;
      lastResult = calculateSectorStatsFromGrid(grid);
      return lastResult;
    };
  })(),
});

export const useNivaariStore = create<NivaariState>()(
  persist(baseInitializer, {
    name: 'nivaari-storage',
    partialize: (state) => ({
      grid: state.grid,
      chatHistory: state.chatHistory,
      user: state.user,
      hasCompletedTutorial: state.hasCompletedTutorial,
    }),
  })
);
