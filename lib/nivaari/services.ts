import { supabase } from '@/lib/supabaseClient';
import { aiResponseSchema } from '@/lib/nivaari/schemas';
import { track } from '@/utils/analytics';
import type { AiTileSuggestion, ChatMessage, Tile, TileRecord } from '@/lib/nivaari/domain';

export function safeTrack(event: string, props?: Record<string, unknown>) {
  try {
    track(event, props);
  } catch (error) {
    console.warn(`Failed to track analytics event "${event}"`, error);
  }
}

export async function upsertTile(tile: Tile) {
  if (!supabase) return;
  const { error } = await supabase.from('tiles').upsert(tile);
  if (error) {
    console.error('Failed to persist tile', error);
    throw error;
  }
}

export async function fetchSectorTiles(sx: number, sz: number): Promise<TileRecord[]> {
  if (!supabase) return [];
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

  if (error) {
    console.error('Failed to fetch sector tiles', error);
    throw error;
  }

  return (data || []) as TileRecord[];
}

export async function createProfile(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').upsert({ id, reputation: 0 });
  if (error) {
    console.error('Failed to create profile', error);
  }
}

export async function syncProfileReputation(id: string, amount?: number) {
  if (!supabase) return 0;
  const { data, error } = await supabase.from('profiles').select('reputation').eq('id', id).single();
  if (error) {
    console.error('Failed to load profile reputation', error);
    return 0;
  }

  const current = data?.reputation || 0;
  const next = typeof amount === 'number' ? current + amount : current;

  if (typeof amount === 'number') {
    const { error: upsertError } = await supabase.from('profiles').upsert({ id, reputation: next });
    if (upsertError) {
      console.error('Failed to update profile reputation', upsertError);
    }
  }

  return next;
}

export async function notifyDisasterWebhook(tile: Tile) {
  const webhookUrl = process.env.NEXT_PUBLIC_DISASTER_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch('/api/webhook/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tile }),
  });
}

export async function requestAiTileSuggestion(history: ChatMessage[]): Promise<AiTileSuggestion> {
  const response = await fetch('/api/nivaari-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history }),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'AI error');
  }

  return aiResponseSchema.parse(json);
}
