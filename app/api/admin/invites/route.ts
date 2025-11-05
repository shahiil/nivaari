import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { getInviteTokensCollection } from '@/lib/mongodb';

const createSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(['email', 'sms']),
  assignedLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export async function POST(req: Request) {
  try {
    // Debug: Check environment variables
    console.log('📧 Email config check:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'Using default: smtp.gmail.com');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 'Using default: 465');
    
    const body = await req.json();
    console.log('📥 Request body:', body);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

    const token = randomBytes(24).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    const coll = await getInviteTokensCollection();
    const inviteDoc = {
      token,
      type: parsed.data.type,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: 'moderator' as const,
      assignedLocation: parsed.data.assignedLocation,
      createdAt: now,
      expiresAt,
      used: false,
    };
    
    console.log('💌 Creating invite with location:', {
      email: parsed.data.email,
      hasLocation: !!parsed.data.assignedLocation,
      location: parsed.data.assignedLocation
    });
    
    const insertResult = await coll.insertOne(inviteDoc);
    console.log('✅ Invite saved to database with ID:', insertResult.insertedId);
    console.log('📍 Saved location data:', inviteDoc.assignedLocation);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
    const link = `${appUrl}/moderator/register?token=${token}`;

  // Send via email if requested and configured
    if (parsed.data.type === 'email' && parsed.data.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('📧 Attempting to send email to:', parsed.data.email);
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          auth: { 
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS 
          },
        });
        
        // Verify transporter configuration
        console.log('🔧 Verifying email transporter...');
        await transporter.verify();
        console.log('✅ Email transporter verified successfully');
        
        const html = `
          <h2>Nivaari Moderator Invitation</h2>
          <p>You have been invited to register as a moderator.</p>
          <p>This link will expire at ${expiresAt.toLocaleString()}.</p>
          <p><a href="${link}">Complete Registration</a></p>
        `;
        
        console.log('📨 Sending email...');
        const mailResult = await transporter.sendMail({
          from: `Nivaari <${process.env.EMAIL_USER}>`,
          to: parsed.data.email,
          subject: 'Moderator Invitation',
          html,
        });
        
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', mailResult.messageId);
        console.log('📧 Response:', mailResult.response);
        
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        return NextResponse.json({ 
          error: 'Failed to send email', 
          details: emailError.message,
          emailConfig: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || '465',
            user: process.env.EMAIL_USER ? 'Set' : 'Missing',
            pass: process.env.EMAIL_PASS ? 'Set' : 'Missing'
          }
        }, { status: 500 });
      }
    } else {
      console.log('❌ Email sending skipped. Reasons:');
      console.log('- Type is email:', parsed.data.type === 'email');
      console.log('- Email provided:', !!parsed.data.email);
      console.log('- EMAIL_USER set:', !!process.env.EMAIL_USER);
      console.log('- EMAIL_PASS set:', !!process.env.EMAIL_PASS);
    }

    // Send via SMS if requested and configured
    if (parsed.data.type === 'sms' && parsed.data.phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const text = `Nivaari moderator invite. Complete registration: ${link}. Expires in 15 minutes.`;
      await client.messages.create({ to: parsed.data.phone, from: process.env.TWILIO_FROM_NUMBER, body: text });
    }

    return NextResponse.json({ token, link, expiresAt });
  } catch (e) {
    console.error('Invite create error', e);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
