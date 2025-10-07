import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import {
  getCitizenReportsCollection,
  getModeratorsCollection,
  getModeratorReportsCollection,
  getUsersCollection,
  type UserDocument,
} from '@/lib/mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.sub || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [moderatorsColl, usersColl, modReportsColl, citizenReportsColl] = await Promise.all([
      getModeratorsCollection(),
      getUsersCollection(),
      getModeratorReportsCollection(),
      getCitizenReportsCollection(),
    ]);

    const moderators = await moderatorsColl.find({}).sort({ createdAt: -1 }).limit(500).toArray();

    // Map userId -> user document for names/status
    const userIds = moderators.map((m) => m.userId).filter(Boolean) as ObjectId[];
    const users = userIds.length
      ? await usersColl
          .find({ _id: { $in: userIds } }, { projection: { name: 1, email: 1, status: 1, createdAt: 1 } })
          .toArray()
      : [];
    const userById = new Map<string, Pick<UserDocument, 'name' | 'email' | 'status' | 'createdAt'>>(
      users.map((u) => [u._id!.toString(), { name: u.name, email: u.email, status: u.status, createdAt: u.createdAt }])
    );

    // Aggregate counts per moderator
    const countsAgg = await modReportsColl
      .aggregate([
        {
          $group: {
            _id: { moderatorUserId: '$moderatorUserId', status: '$status' },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const countsByModerator = new Map<string, { approved: number; rejected: number }>();
    for (const row of countsAgg) {
      const key = (row._id?.moderatorUserId as ObjectId | undefined)?.toString() || 'unknown';
      const status = row._id?.status as 'approved' | 'rejected' | undefined;
      const prev = countsByModerator.get(key) || { approved: 0, rejected: 0 };
      if (status === 'approved') prev.approved = row.count as number;
      if (status === 'rejected') prev.rejected = row.count as number;
      countsByModerator.set(key, prev);
    }

    // Global backlog: citizenReports without a corresponding moderatorReports
    const backlogCursor = await citizenReportsColl
      .aggregate([
        {
          $lookup: {
            from: 'moderatorReports',
            localField: '_id',
            foreignField: 'citizenReportId',
            as: 'mr',
          },
        },
        { $match: { mr: { $size: 0 } } },
        { $count: 'unviewedCount' },
      ])
      .toArray();
    const unviewedCount = backlogCursor[0]?.unviewedCount ?? 0;

    const payload = moderators.map((m) => {
      const u = userById.get(m.userId.toString());
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

    return NextResponse.json({ moderators: payload, backlog: { unviewedCount } });
  } catch (e) {
    console.error('Admin moderators list error', e);
    return NextResponse.json({ error: 'Failed to load moderators' }, { status: 500 });
  }
}
