import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
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

    // Send via email if requested and configured
    if (parsed.data.type === 'email' && parsed.data.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      const html = `
        <h2>Nivaari Moderator Invitation</h2>
        <p>You have been invited to register as a moderator.</p>
        <p>This link will expire at ${expiresAt.toLocaleString()}.</p>
        <p><a href="${link}">Complete Registration</a></p>
      `;
      await transporter.sendMail({
        from: `Nivaari <${process.env.EMAIL_USER}>`,
        to: parsed.data.email,
        subject: 'Moderator Invitation',
        html,
      });
    }

    return NextResponse.json({ token, link, expiresAt });
  } catch (e) {
    console.error('Invite create error', e);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
