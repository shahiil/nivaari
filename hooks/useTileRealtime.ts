'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNivaariStore, type Tile } from '@/lib/nivaariStore';

type TileRealtimePayload = {
  new: {
    id: string;
    x: number;
    z: number;
    type: Tile['type'];
    width?: number | null;
    depth?: number | null;
    creator?: string | null;
    data?: Tile['data'];
  };
};

export function useTileRealtime(onTileSync?: (tileId: string) => void) {
  useEffect(() => {
    useNivaariStore.getState().fetchSector(0, 0);

    if (!supabase) return;

    const handleRealtime = (payload: TileRealtimePayload) => {
      const row = payload.new;
      const tile: Tile = {
        id: row.id,
        x: row.x,
        z: row.z,
        type: row.type,
        width: row.width || undefined,
        depth: row.depth || undefined,
        creator: row.creator || null,
        data: row.data,
      };

      const current = useNivaariStore.getState().grid[tile.id];
      if (!current || JSON.stringify(current) !== JSON.stringify(tile)) {
        useNivaariStore.setState((state) => ({
          grid: { ...state.grid, [tile.id]: tile },
        }));
        onTileSync?.(tile.id);
      }
    };

    const channel = supabase
      .channel('tiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tiles' }, handleRealtime)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tiles' }, handleRealtime)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onTileSync]);
}
