import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getModeratorsCollection } from '@/lib/mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

const updateLocationSchema = z.object({
  moderatorId: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session?.sub || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateLocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const moderators = await getModeratorsCollection();
    const result = await moderators.updateOne(
      { userId: new ObjectId(parsed.data.moderatorId) },
      {
        $set: {
          assignedLocation: parsed.data.location,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Moderator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Update moderator location error', e);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}