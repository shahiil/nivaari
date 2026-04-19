import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCitizenReportsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/session';
import { findUserById } from '@/lib/auth-service';
import { normalizeReportType } from '@/lib/utils';

export const runtime = 'nodejs';

const summarizeVotes = (
  votes: Array<{ socialId: string; vote: 'upvote' | 'downvote' }> | undefined,
  socialId?: string,
) => {
  const list = votes ?? [];
  const upvotes = list.filter((entry) => entry.vote === 'upvote').length;
  const downvotes = list.filter((entry) => entry.vote === 'downvote').length;
  const myVote = socialId ? list.find((entry) => entry.socialId === socialId)?.vote : undefined;
  return { upvotes, downvotes, myVote };
};

const reportSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  category: z.string().optional(),
  description: z.string().min(1),
  city: z.string().optional(),
  impactRadiusKm: z.number().min(0).max(50).optional(),
  aiSummary: z.string().optional(),
  verificationQuestions: z.array(z.string()).optional(),
  chatHistory: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string() })).optional(),
  location: z
    .object({ lat: z.number().optional(), lng: z.number().optional(), address: z.string().optional() })
    .optional(),
  imageUrl: z.string().url().optional(),
  image: z.string().optional(), // Base64 encoded image
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const creatorUser = await findUserById(session.sub);
    if (!creatorUser) {
      return NextResponse.json({ error: 'Session user not found' }, { status: 401 });
    }

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
      image: parsed.data.image, // Store base64 image
      votes: [],
      status: 'submitted' as const,
      createdByUserId: ObjectId.isValid(session.sub) ? new ObjectId(session.sub) : null,
      createdBySocialId: creatorUser.socialId ?? null,
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

// List citizen reports (recent submissions)
export async function GET() {
  try {
    const session = await getSession();
    const sessionUser = session?.sub ? await findUserById(session.sub) : null;
    const sessionSocialId = sessionUser?.socialId;

    const coll = await getCitizenReportsCollection();
    const rows = await coll
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return NextResponse.json({ reports: rows.map(r => ({
      ...(summarizeVotes(r.votes, sessionSocialId) ?? {}),
      id: r._id?.toString(),
      title: r.title,
      type: r.type,
      category: r.category,
      description: r.description,
      city: r.city,
      location: r.location,
      impactRadiusKm: r.impactRadiusKm,
      aiSummary: r.aiSummary,
      verificationQuestions: r.verificationQuestions,
      createdBySocialId: r.createdBySocialId,
      createdAt: r.createdAt,
    })) });
  } catch (e) {
    console.error('Citizen reports list error', e);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}
