import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { getInvitesCollection } from "@/lib/mongodb";

export const runtime = "nodejs";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendRegistrationEmail(toEmail, role, token) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://nivaari.vercel.app";
  const registrationLink = `${appUrl}/admin-register?token=${token}`;

  const subject = `Nivaari ${role === "admin" ? "Admin" : "Moderator"} Invitation`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1F2937;">Nivaari ${role === "admin" ? "Admin" : "Moderator"} Invitation</h2>
        <p>You've been invited to become a ${
          role === "admin" ? "Government Official/Admin" : "Moderator"
        } on Nivaari.</p>
        <p>Click the link below to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${registrationLink}" 
             style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Complete Registration
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">
          This link will expire in 24 hours. If you didn't request this invitation, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">
          Nivaari - Stay Informed. Stay Safe.
        </p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Nivaari" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent,
  };

  return await transporter.sendMail(mailOptions);
}

export async function POST(req) {
  try {
    const { email, role = "admin" } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedRole = ["admin", "supervisor"].includes(role)
      ? role
      : "admin";

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invites = await getInvitesCollection();
    await invites.insertOne({
      token,
      email: email.toLowerCase(),
      role: normalizedRole,
      createdAt: new Date(),
      expiresAt,
      used: false,
    });

    await sendRegistrationEmail(email, normalizedRole, token);

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      {
        error: "Failed to send invitation",
        details: error.message,
      },
      { status: 500 }
    );
  }
}