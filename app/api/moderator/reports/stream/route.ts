import { NextResponse } from 'next/server';
import { getCitizenReportsCollection, getModeratorReportsCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  } as const;
}

type BasicReport = { id?: string; title: string; type: string; city?: string; description?: string; location?: unknown; createdAt?: Date };
type DecisionReport = { id?: string; title: string; type: string; city?: string; decidedAt?: Date };
type Snapshot = {
  unreviewed: BasicReport[];
  approved: DecisionReport[];
  rejected: DecisionReport[];
};

async function loadSnapshot(): Promise<Snapshot> {
  const citizen = await getCitizenReportsCollection();
  const moderator = await getModeratorReportsCollection();

  const [modAll, citizenAll] = await Promise.all([
    moderator.find({}).project({ citizenReportId: 1, status: 1, title: 1, type: 1, city: 1, decidedAt: 1 }).toArray(),
    citizen
      .find({ $or: [{ status: 'submitted' }, { status: { $exists: false } }] })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray(),
  ]);

  const decidedIds = new Set(modAll.map((m) => m.citizenReportId?.toString()));
  const unreviewed = citizenAll
    .filter((r) => !decidedIds.has(r._id?.toString() || ''))
    .map((r) => ({ id: r._id?.toString(), title: r.title, type: r.type, city: r.city, description: r.description, location: r.location, createdAt: r.createdAt }));

  const approved = modAll
    .filter((m) => m.status === 'approved')
    .sort((a, b) => (b.decidedAt?.getTime?.() || 0) - (a.decidedAt?.getTime?.() || 0))
    .slice(0, 200)
    .map((m) => ({ id: m._id?.toString(), title: m.title, type: m.type, city: m.city, decidedAt: m.decidedAt }));

  const rejected = modAll
    .filter((m) => m.status === 'rejected')
    .sort((a, b) => (b.decidedAt?.getTime?.() || 0) - (a.decidedAt?.getTime?.() || 0))
    .slice(0, 200)
    .map((m) => ({ id: m._id?.toString(), title: m.title, type: m.type, city: m.city, decidedAt: m.decidedAt }));

  return { unreviewed, approved, rejected };
}

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: Snapshot | { message: string }) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial snapshot
      try {
        const snap = await loadSnapshot();
        send('snapshot', snap);
      } catch (e) {
        send('error', { message: 'initial snapshot failed' });
      }

      // Heartbeat
      const hb = setInterval(() => controller.enqueue(encoder.encode(`:\n\n`)), 20000);

      // Try change streams; if unsupported, fall back to periodic refresh
      let closed = false;
      let cleanup: (() => void) | null = null;

      try {
        const citizen = await getCitizenReportsCollection();
        const moderator = await getModeratorReportsCollection();
        const cs1 = citizen.watch([], { fullDocument: 'updateLookup' });
        const cs2 = moderator.watch([], { fullDocument: 'updateLookup' });

        const onChange = async () => {
          const snap = await loadSnapshot();
          send('snapshot', snap);
        };

        cs1.on('change', onChange);
        cs2.on('change', onChange);

        cleanup = () => {
          cs1.removeAllListeners();
          cs2.removeAllListeners();
          void cs1.close();
          void cs2.close();
        };
      } catch {
        // Periodic refresh fallback
        const id: ReturnType<typeof setInterval> = setInterval(async () => {
          const snap = await loadSnapshot();
          send('snapshot', snap);
        }, 5000);
        cleanup = () => clearInterval(id);
      }

      // Close handling
  const signal: AbortSignal | undefined = (global as unknown as { request?: { signal?: AbortSignal } })?.request?.signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          if (closed) return;
          closed = true;
          clearInterval(hb);
          cleanup?.();
          controller.close();
        });
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
