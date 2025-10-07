import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCitizenReportsCollection, getModeratorsCollection, getModeratorReportsCollection, getUsersCollection } from '@/lib/mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

function sseHeaders() {
  return { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } as const;
}

type ModeratorListItem = {
  id?: string;
  userId: string;
  name: string;
  email: string;
  status: 'online' | 'offline';
  createdAt?: string;
  approvedCount: number;
  rejectedCount: number;
};

type ModeratorsSnapshot = { moderators: ModeratorListItem[]; backlog: { unviewedCount: number } };

async function loadModeratorsSnapshot(): Promise<ModeratorsSnapshot> {
  const [moderatorsColl, usersColl, modReportsColl, citizenReportsColl] = await Promise.all([
    getModeratorsCollection(),
    getUsersCollection(),
    getModeratorReportsCollection(),
    getCitizenReportsCollection(),
  ]);

  const moderators = await moderatorsColl.find({}).sort({ createdAt: -1 }).limit(500).toArray();
  const userIds = moderators.map((m) => m.userId).filter(Boolean) as ObjectId[];
  const users = userIds.length
    ? await usersColl.find({ _id: { $in: userIds } }, { projection: { name: 1, email: 1, status: 1, createdAt: 1 } }).toArray()
    : [];
  const userById = new Map(users.map((u) => [u._id!.toString(), u]));

  const countsAgg = await modReportsColl
    .aggregate([
      { $group: { _id: { moderatorUserId: '$moderatorUserId', status: '$status' }, count: { $sum: 1 } } },
    ])
    .toArray();
  const countsByModerator = new Map<string, { approved: number; rejected: number }>();
  for (const row of countsAgg) {
    const key = (row._id?.moderatorUserId as ObjectId | undefined)?.toString() || 'unknown';
    const prev = countsByModerator.get(key) || { approved: 0, rejected: 0 };
    if (row._id?.status === 'approved') prev.approved = row.count as number;
    if (row._id?.status === 'rejected') prev.rejected = row.count as number;
    countsByModerator.set(key, prev);
  }

  const backlogArr = await citizenReportsColl
    .aggregate([
      { $lookup: { from: 'moderatorReports', localField: '_id', foreignField: 'citizenReportId', as: 'mr' } },
      { $match: { mr: { $size: 0 } } },
      { $count: 'unviewedCount' },
    ])
    .toArray();
  const unviewedCount = backlogArr[0]?.unviewedCount ?? 0;

  const list: ModeratorListItem[] = moderators.map((m) => {
    const u = userById.get(m.userId.toString()) as { name?: string; email: string; status?: 'online' | 'offline'; createdAt?: Date } | undefined;
    const key = m.userId.toString();
    const c = countsByModerator.get(key) || { approved: 0, rejected: 0 };
    return {
      id: m._id?.toString(),
      userId: m.userId.toString(),
      name: u?.name || m.email?.split('@')[0] || 'Moderator',
      email: u?.email || m.email,
      status: (u?.status || m.status || 'offline') as 'online' | 'offline',
      createdAt: (u?.createdAt || m.createdAt)?.toISOString?.() ?? undefined,
      approvedCount: c.approved,
      rejectedCount: c.rejected,
    };
  });

  return { moderators: list, backlog: { unviewedCount } };
}

export async function GET() {
  const session = await getSession();
  if (!session?.sub || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: ModeratorsSnapshot | { message: string }) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const snap = await loadModeratorsSnapshot();
        send('snapshot', snap);
      } catch (e) { send('error', { message: 'initial snapshot failed' }); }

      const hb = setInterval(() => controller.enqueue(encoder.encode(`:\n\n`)), 20000);

  let cleanup: (() => void) | null = null;
      try {
        const [moderatorsColl, usersColl, modReportsColl, citizenReportsColl] = await Promise.all([
          getModeratorsCollection(),
          getUsersCollection(),
          getModeratorReportsCollection(),
          getCitizenReportsCollection(),
        ]);
        const cs1 = moderatorsColl.watch([], { fullDocument: 'updateLookup' });
        const cs2 = usersColl.watch([], { fullDocument: 'updateLookup' });
        const cs3 = modReportsColl.watch([], { fullDocument: 'updateLookup' });
        const cs4 = citizenReportsColl.watch([], { fullDocument: 'updateLookup' });

        const onChange = async () => {
          const snap = await loadModeratorsSnapshot();
          send('snapshot', snap);
        };
        cs1.on('change', onChange);
        cs2.on('change', onChange);
        cs3.on('change', onChange);
        cs4.on('change', onChange);
        cleanup = () => {
          [cs1, cs2, cs3, cs4].forEach((cs) => {
            cs.removeAllListeners();
            void cs.close();
          });
        };
      } catch {
        const id = setInterval(async () => {
          const snap = await loadModeratorsSnapshot();
          send('snapshot', snap);
        }, 5000);
  cleanup = () => clearInterval(id as ReturnType<typeof setInterval>);
      }

  const signal: AbortSignal | undefined = (global as unknown as { request?: { signal?: AbortSignal } })?.request?.signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          clearInterval(hb);
          cleanup?.();
          controller.close();
        });
      }
    },
  });
  return new Response(stream, { headers: sseHeaders() });
}
