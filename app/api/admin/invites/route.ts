import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { getInviteTokensCollection } from '@/lib/mongodb';

const createSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(['email', 'sms']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

    const token = randomBytes(24).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    const coll = await getInviteTokensCollection();
    await coll.insertOne({
      token,
      type: parsed.data.type,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: 'moderator',
      createdAt: now,
      expiresAt,
      used: false,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
    const link = `${appUrl}/moderator/register?token=${token}`;

    return NextResponse.json({ token, link, expiresAt });
  } catch (e) {
    console.error('Invite create error', e);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
