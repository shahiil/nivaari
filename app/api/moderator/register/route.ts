import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getInviteTokensCollection, getModeratorsCollection, type UserDocument, type UserRole } from '@/lib/mongodb';
import { createUser, findUserByEmail, mapUser } from '@/lib/auth-service';
import { setSessionCookie } from '@/lib/session';

export const runtime = 'nodejs';

const registerSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server misconfigured: JWT_SECRET is not set' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

    const tokens = await getInviteTokensCollection();
    const tokenDoc = await tokens.findOne({ token: parsed.data.token, used: false });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // If user exists, upgrade to moderator; otherwise create as moderator
    let user = await findUserByEmail(parsed.data.email);
    if (!user) {
      const created = await createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: 'supervisor', // using 'supervisor' as moderator role per current roles
        status: 'online',
      });
      user = { _id: new ObjectId(created.id), email: created.email, passwordHash: '', role: created.role, name: created.name, createdAt: new Date() } as unknown as {
        _id: ObjectId; email: string; role: 'citizen' | 'admin' | 'supervisor'; name?: string; passwordHash: string; createdAt: Date;
      };
    }

    // Create moderator record
    const moderators = await getModeratorsCollection();
    await moderators.updateOne(
      { userId: user._id },
      {
        $set: {
          userId: user._id,
          email: user.email,
          mobile: parsed.data.mobile,
          status: 'online',
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Mark token used
    await tokens.updateOne({ _id: tokenDoc._id }, { $set: { used: true, usedAt: new Date() } });

    // Set session cookie
    await setSessionCookie({ sub: user._id.toString(), email: user.email, role: 'supervisor', name: user.name });

    // Construct a minimal user doc compatible with mapUser
    const mapped = mapUser({
      _id: user._id,
      email: user.email,
      passwordHash: '',
      role: 'supervisor' as UserRole,
      name: user.name,
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserDocument);

    return NextResponse.json({ user: mapped });
  } catch (e) {
    console.error('Moderator register error', e);
    return NextResponse.json({ error: 'Failed to register moderator' }, { status: 500 });
  }
}
