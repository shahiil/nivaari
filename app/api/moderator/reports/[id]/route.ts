import { NextResponse } from 'next/server';
import { getModeratorReportsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

// DELETE /api/moderator/reports/[id] - Delete a moderator report (moderator only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'moderator' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const coll = await getModeratorReportsCollection();
    const result = await coll.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Moderator report delete error', e);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}

// PATCH /api/moderator/reports/[id] - Update a moderator report (e.g., mark as fixed)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'moderator' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['approved', 'rejected', 'fixed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const coll = await getModeratorReportsCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: status as 'approved' | 'rejected' | 'fixed',
          updatedAt: new Date(),
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Moderator report update error', e);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
