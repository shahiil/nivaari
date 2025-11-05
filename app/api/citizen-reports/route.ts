import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCitizenReportsCollection, getModeratorReportsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/session';
import { normalizeReportType } from '@/lib/utils';

export const runtime = 'nodejs';

const reportSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  category: z.string().optional(),
  description: z.string().min(1),
  city: z.string().optional(),
  location: z
    .object({ lat: z.number().optional(), lng: z.number().optional(), address: z.string().optional() })
    .optional(),
  imageUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const coll = await getCitizenReportsCollection();
    const now = new Date();

    // Normalize/derive location
    const locIn = parsed.data.location || {};
    let lat = typeof locIn.lat === 'number' ? locIn.lat : undefined;
    let lng = typeof locIn.lng === 'number' ? locIn.lng : undefined;
    const address = locIn.address;
    if ((lat === undefined || lng === undefined) && typeof address === 'string') {
      // Try to parse patterns like "12.34, 56.78" from address string
      const m = address.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
      if (m) {
        const pLat = parseFloat(m[1]);
        const pLng = parseFloat(m[2]);
        if (Number.isFinite(pLat) && Number.isFinite(pLng)) {
          lat = pLat; lng = pLng;
        }
      }
    }

    const doc = {
      ...parsed.data,
      // normalize type for consistency across dashboards
      type: normalizeReportType(parsed.data.type),
      // preserve original as category for reference
      category: parsed.data.category ?? parsed.data.type,
      location: { lat, lng, address },
      status: 'submitted' as const,
      createdByUserId: session?.sub && ObjectId.isValid(session.sub) ? new ObjectId(session.sub) : null,
      createdAt: now,
      updatedAt: now,
    };
    const res = await coll.insertOne(doc);
    return NextResponse.json({ id: res.insertedId.toString() });
  } catch (e) {
    console.error('Citizen report create error', e);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

// List approved reports for citizen view (from moderatorReports)
export async function GET() {
  try {
    const coll = await getModeratorReportsCollection();
    const approved = await coll
      .find({ status: 'approved' })
      .sort({ decidedAt: -1 })
      .limit(100)
      .toArray();
    return NextResponse.json({ reports: approved.map(r => ({
      id: r._id?.toString(),
      title: r.title,
      type: r.type,
      city: r.city,
      location: r.location,
      decidedAt: r.decidedAt,
    })) });
  } catch (e) {
    console.error('Citizen reports list error', e);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}
