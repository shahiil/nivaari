import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getCitizenReportsCollection, getModeratorReportsCollection, getUsersCollection } from '@/lib/mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

// List unreviewed citizen reports (all submitted that do not have a moderator decision yet)
export async function GET() {
  try {
    const citizen = await getCitizenReportsCollection();
    const moderator = await getModeratorReportsCollection();
    const reviewedIds = await moderator.find({}, { projection: { citizenReportId: 1 } }).toArray();
    const reviewedSet = new Set(reviewedIds.map(r => r.citizenReportId.toString()));

    const unreviewed = await citizen
      .find({ $or: [{ status: 'submitted' }, { status: { $exists: false } }] })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    const filtered = unreviewed.filter(r => !reviewedSet.has(r._id?.toString() || ''));

    // Enrich with reporter name if available
    const usersColl = await getUsersCollection();
    const reports = await Promise.all(filtered.map(async (r) => {
      let reporterName: string | null = null;
      try {
        if (r.createdByUserId) {
          const u = await usersColl.findOne({ _id: r.createdByUserId as any });
          reporterName = u?.name || u?.email || null;
        }
      } catch {
        reporterName = null;
      }
      return {
        id: r._id?.toString(),
        title: r.title,
        type: r.type,
        description: r.description,
        city: r.city,
        location: r.location,
        imageUrl: r.imageUrl || null,
        createdAt: r.createdAt,
        reporterName,
      };
    }));

    return NextResponse.json({ reports });
  } catch (e) {
    console.error('List unreviewed error', e);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}

const decisionSchema = z.object({
  reportId: z.string().min(1),
  decision: z.enum(['approved', 'rejected'])
});

// Approve/Reject a report
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

    const citizenId = new ObjectId(parsed.data.reportId);
    const citizen = await getCitizenReportsCollection();
    const base = await citizen.findOne({ _id: citizenId });
    if (!base) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    const moderator = await getModeratorReportsCollection();
    await moderator.updateOne(
      { citizenReportId: citizenId },
      {
        $set: {
          citizenReportId: citizenId,
          status: parsed.data.decision,
          moderatorUserId: new ObjectId(session.sub),
          decidedAt: new Date(),
          title: base.title,
          type: base.type,
          city: base.city,
          location: base.location,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Decision error', e);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
