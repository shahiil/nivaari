import { NextResponse } from 'next/server';
import { getModeratorReportsCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const coll = await getModeratorReportsCollection();
    const approved = await coll.find({ status: 'approved' }).sort({ decidedAt: -1 }).limit(200).toArray();
    const rejected = await coll.find({ status: 'rejected' }).sort({ decidedAt: -1 }).limit(200).toArray();
    return NextResponse.json({
      approved: approved.map(r => ({ id: r._id?.toString(), title: r.title, type: r.type, city: r.city, decidedAt: r.decidedAt })),
      rejected: rejected.map(r => ({ id: r._id?.toString(), title: r.title, type: r.type, city: r.city, decidedAt: r.decidedAt })),
    });
  } catch (e) {
    console.error('Moderator summary error', e);
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 });
  }
}
