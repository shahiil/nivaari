import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getMapPinsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

const createPinSchema = z.object({
  label: z.string().min(1),
  typeId: z.string().min(1),
  description: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'moderator' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createPinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const coll = await getMapPinsCollection();
    const now = new Date();
    const doc = {
      ...parsed.data,
      createdByUserId: session?.sub && ObjectId.isValid(session.sub) ? new ObjectId(session.sub) : null,
      createdAt: now,
      updatedAt: now,
    };
    const res = await coll.insertOne(doc);
    return NextResponse.json({ id: res.insertedId.toString() });
  } catch (e) {
    console.error('Map pin create error', e);
    return NextResponse.json({ error: 'Failed to create pin' }, { status: 500 });
  }
}

// GET supports optional bbox filtering: bbox=minLat,minLng,maxLat,maxLng
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bbox = searchParams.get('bbox');

    const coll = await getMapPinsCollection();

    let query: any = {};
    if (bbox) {
      const parts = bbox.split(',').map((n) => parseFloat(n));
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        const [minLat, minLng, maxLat, maxLng] = parts;
        query = {
          'location.lat': { $gte: Math.min(minLat, maxLat), $lte: Math.max(minLat, maxLat) },
          'location.lng': { $gte: Math.min(minLng, maxLng), $lte: Math.max(minLng, maxLng) },
        };
      }
    }

    const pins = await coll.find(query).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ pins: pins.map((p) => ({
      id: p._id?.toString(),
      label: p.label,
      typeId: p.typeId,
      description: p.description,
      location: p.location,
      createdAt: p.createdAt,
    })) });
  } catch (e) {
    console.error('Map pin list error', e);
    return NextResponse.json({ error: 'Failed to load pins' }, { status: 500 });
  }
}
