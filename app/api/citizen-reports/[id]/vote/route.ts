import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

import { findUserById } from '@/lib/auth-service';
import { getCitizenReportsCollection } from '@/lib/mongodb';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

const voteSchema = z.object({
  vote: z.enum(['upvote', 'downvote']),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await findUserById(session.sub);
    if (!user?.socialId) {
      return NextResponse.json({ error: 'Missing social identity' }, { status: 400 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const parsed = voteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid vote input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const coll = await getCitizenReportsCollection();
    const reportId = new ObjectId(id);

    await coll.updateOne(
      { _id: reportId },
      {
        $pull: {
          votes: { socialId: user.socialId },
        },
      }
    );

    const updateResult = await coll.updateOne(
      { _id: reportId },
      {
        $push: {
          votes: {
            socialId: user.socialId,
            vote: parsed.data.vote,
            votedAt: new Date(),
          },
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    if (!updateResult.matchedCount) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Report vote error', error);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}
