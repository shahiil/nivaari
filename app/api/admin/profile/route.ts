import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUsersCollection } from '@/lib/mongodb';
import { getSession } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

const verifyPasswordSchema = z.object({
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  password: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  profilePhoto: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.sub || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = await req.json();

    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(session.sub) });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'verify-password': {
        const parsed = verifyPasswordSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        return NextResponse.json({ valid: isValid });
      }

      case 'update-profile': {
        const parsed = updateProfileSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Verify current password before updating profile
        const isPasswordValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
        }

        const updateData: any = {
          name: parsed.data.name,
          updatedAt: new Date(),
        };
        
        if (parsed.data.phone !== undefined) {
          updateData.phone = parsed.data.phone;
        }
        
        if (parsed.data.profilePhoto !== undefined) {
          updateData.profilePhoto = parsed.data.profilePhoto;
        }

        console.log('Updating user profile with data:', updateData);
        
        const result = await users.updateOne(
          { _id: new ObjectId(session.sub) },
          { $set: updateData }
        );
        
        console.log('Update result:', result);

        return NextResponse.json({ success: true });
      }

      case 'change-password': {
        const parsed = changePasswordSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const isCurrentValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
        if (!isCurrentValid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        const hashedNewPassword = await bcrypt.hash(parsed.data.newPassword, 12);
        await users.updateOne(
          { _id: new ObjectId(session.sub) },
          {
            $set: {
              passwordHash: hashedNewPassword,
              updatedAt: new Date(),
            },
          }
        );

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e) {
    console.error('Profile update error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}