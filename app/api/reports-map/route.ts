import { NextResponse } from 'next/server';
import { getCitizenReportsCollection, getMapPinsCollection, getModeratorReportsCollection } from '@/lib/mongodb';
import { normalizeReportType } from '@/lib/utils';

export const runtime = 'nodejs';

// Unified map data endpoint
// GET /api/reports-map?time=current|past|incoming&types=a,b,c&bbox=minLat,minLng,maxLat,maxLng&viewed=all|accepted|rejected
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const time = (searchParams.get('time') || 'current') as 'current'|'past'|'incoming';
    const typesCsv = searchParams.get('types') || '';
    const types = typesCsv ? typesCsv.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const bbox = searchParams.get('bbox');
    const viewed = searchParams.get('viewed') || 'all'; // all, accepted, rejected

    const bboxFilter: any = {};
    if (bbox) {
      const parts = bbox.split(',').map((n) => parseFloat(n));
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        const [minLat, minLng, maxLat, maxLng] = parts;
        bboxFilter['location.lat'] = { $gte: Math.min(minLat, maxLat), $lte: Math.max(minLat, maxLat) };
        bboxFilter['location.lng'] = { $gte: Math.min(minLng, maxLng), $lte: Math.max(minLng, maxLng) };
      }
    }

    if (time === 'current') {
      const coll = await getMapPinsCollection();
      const query: any = { ...bboxFilter };
      if (types.length) query.typeId = { $in: types };
      const pins = await coll.find(query).sort({ createdAt: -1 }).limit(500).toArray();
      return NextResponse.json({ items: pins.map((p) => ({
        id: p._id?.toString(),
        source: 'current' as const,
        label: p.label,
        typeId: p.typeId,
        description: p.description,
        location: p.location,
        status: p.status,
      })) });
    }

    if (time === 'past') {
      const coll = await getModeratorReportsCollection();
      const query: any = { ...bboxFilter };
      
      // Apply viewed filter
      if (viewed === 'accepted') {
        query.status = { $in: ['approved', 'fixed'] }; // Include both approved and fixed
      } else if (viewed === 'rejected') {
        query.status = 'rejected';
      } else {
        // 'all' - show approved, fixed, and rejected
        query.status = { $in: ['approved', 'rejected', 'fixed'] };
      }
      
      if (types.length) query.type = { $in: types };
      const rows = await coll.find(query).sort({ decidedAt: -1 }).limit(500).toArray();
      return NextResponse.json({ items: rows.map((r: any) => ({
        id: r._id?.toString(),
        source: 'past' as const,
        label: r.title,
        typeId: normalizeReportType(r.type as any),
        description: undefined,
        location: r.location as any,
        status: r.status, // Include status for frontend (approved, rejected, or fixed)
        imageUrl: r.imageUrl || r.image, // Support both imageUrl and base64 image field
      })) });
    }

    // incoming: citizen reports not yet reviewed
    const citizen = await getCitizenReportsCollection();
    // We'll use an aggregation with $lookup to exclude those already in moderatorReports
    const pipeline: any[] = [];

    // Filter: status submitted or missing and has lat/lng
    const baseMatch: any = { $or: [{ status: 'submitted' }, { status: { $exists: false } }] };
    if (types.length) baseMatch.type = { $in: types };
    // require numeric lat/lng
    baseMatch['location.lat'] = { $type: 'number' };
    baseMatch['location.lng'] = { $type: 'number' };

    // bbox filter
    if (bboxFilter['location.lat'] || bboxFilter['location.lng']) {
      if (bboxFilter['location.lat']) baseMatch['location.lat'] = bboxFilter['location.lat'];
      if (bboxFilter['location.lng']) baseMatch['location.lng'] = bboxFilter['location.lng'];
    }
    pipeline.push({ $match: baseMatch });

    pipeline.push({
      $lookup: {
        from: 'moderatorReports',
        localField: '_id',
        foreignField: 'citizenReportId',
        as: 'mod'
      }
    });
    pipeline.push({ $match: { mod: { $size: 0 } } });
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $limit: 500 });

    const rows = await citizen.aggregate(pipeline).toArray();
    return NextResponse.json({ items: rows.map((r: any) => ({
      id: r._id?.toString(),
      source: 'incoming' as const,
      label: r.title,
      typeId: normalizeReportType(r.type),
      description: r.description,
      location: r.location,
      imageUrl: r.imageUrl || r.image, // Support both imageUrl and base64 image field
    })) });
  } catch (e) {
    console.error('reports-map error', e);
    return NextResponse.json({ error: 'Failed to load map data' }, { status: 500 });
  }
}
