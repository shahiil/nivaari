import { NextResponse } from 'next/server';
import { getCitizenReportsCollection, getModeratorReportsCollection } from '@/lib/mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.sub || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [citizen, mod] = await Promise.all([
      getCitizenReportsCollection(),
      getModeratorReportsCollection(),
    ]);

    const [totalCitizen, totalApproved, totalRejected, unviewedArr] = await Promise.all([
      citizen.countDocuments({}),
      mod.countDocuments({ status: 'approved' }),
      mod.countDocuments({ status: 'rejected' }),
      citizen
        .aggregate([
          { $lookup: { from: 'moderatorReports', localField: '_id', foreignField: 'citizenReportId', as: 'mr' } },
          { $match: { mr: { $size: 0 } } },
          { $count: 'unviewed' },
        ])
        .toArray(),
    ]);

    const unviewed = unviewedArr[0]?.unviewed ?? 0;

    return NextResponse.json({ totalCitizen, totalApproved, totalRejected, unviewed });
  } catch (e) {
    console.error('Admin summary error', e);
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 });
  }
}
