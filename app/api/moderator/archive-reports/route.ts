import { NextRequest, NextResponse } from 'next/server';
import { getCitizenReportsCollection, getModeratorReportsCollection, getUsersCollection } from '@/lib/mongodb';
import { getSession } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/moderator/archive-reports
 * Returns all accepted and rejected reports that the moderator has processed
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email: session.email });
    
    if (!user || user.role !== 'moderator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all moderator reports (these contain the accepted/rejected status)
    const moderatorReports = await getModeratorReportsCollection();
    const reports = await moderatorReports
      .find({
        moderatorUserId: new ObjectId(session.sub)
      })
      .sort({ decidedAt: -1 })
      .limit(500)
      .toArray();

    const formattedReports = reports.map((report: any) => ({
      id: report._id.toString(),
      title: report.title || 'Untitled Report',
      type: report.type || 'other',
      status: report.status === 'approved' ? 'accepted' : report.status === 'fixed' ? 'accepted' : 'rejected',
      city: report.city,
      location: report.location,
      reviewedAt: report.decidedAt,
      description: report.description,
      isFixed: report.status === 'fixed' // Add flag to show if it's been marked as fixed
    }));

    return NextResponse.json({ 
      reports: formattedReports,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching archive reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archive reports' },
      { status: 500 }
    );
  }
}
