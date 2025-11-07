import { NextResponse } from 'next/server';
import { getMapPinsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

// DELETE /api/map-pins/[id] - Delete a map pin (moderator only)
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

    const coll = await getMapPinsCollection();
    const result = await coll.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Map pin delete error', e);
    return NextResponse.json({ error: 'Failed to delete pin' }, { status: 500 });
  }
}

// PATCH /api/map-pins/[id] - Update a map pin (e.g., mark as fixed)
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

    const coll = await getMapPinsCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          updatedAt: new Date(),
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Map pin update error', e);
    return NextResponse.json({ error: 'Failed to update pin' }, { status: 500 });
  }
}
