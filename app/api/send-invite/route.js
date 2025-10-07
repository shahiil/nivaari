const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

// Firebase v9+ uses ES modules, but Netlify Functions use CommonJS
// We'll use the Firebase Admin SDK instead for server-side
const admin = require("firebase-admin");

let firebaseInitialized = false;

function getFirestore() {
  if (firebaseInitialized) {
    return admin.firestore();
  }

  if (process.env.NODE_ENV !== "production") {
    // Skip initialization during build or local dev when not strictly required
    return null;
  }

  try {
    if (!admin.apps.length) {
      let credential;
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccountKey) {
        try {
          const parsedKey = JSON.parse(serviceAccountKey);
          credential = admin.credential.cert(parsedKey);
        } catch (parseError) {
          console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", parseError);
        }
      }

      if (!credential) {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY missing or invalid. Firestore writes will be skipped.");
      }

      admin.initializeApp({
        credential,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      });
    }

    firebaseInitialized = true;
    return admin.firestore();
  } catch (error) {
    console.error("Failed to initialize Firebase Admin", error);
    return null;
  }
}

// Nodemailer transporter
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
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate secure token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in Firestore (skip in development)
    if (process.env.NODE_ENV === "production") {
      const db = getFirestore();
      if (db) {
        await db
          .collection("adminInvites")
          .doc(token)
          .set({
            email,
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
            used: false,
          });
      }
    }

    // Send email
    await sendRegistrationEmail(email, role, token);

    return Response.json({
      success: true,
      message: "Invitation sent successfully",
      token, // For debugging - remove in production
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      env: {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS,
        hasProjectId: !!process.env.VITE_FIREBASE_PROJECT_ID,
        hasAppUrl: !!process.env.APP_URL,
      },
    });
    return Response.json({
      error: "Failed to send invitation",
      details: error.message,
    }, { status: 500 });
  }
}