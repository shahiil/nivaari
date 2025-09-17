const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Nodemailer transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendRegistrationEmail(toEmail, role, token) {
  const appUrl = process.env.APP_URL || 'https://nivaari.netlify.app';
  const registrationLink = `${appUrl}/admin-register?token=${token}`;
  
  const subject = `Nivaari ${role === 'admin' ? 'Admin' : 'Moderator'} Invitation`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1F2937;">Nivaari ${role === 'admin' ? 'Admin' : 'Moderator'} Invitation</h2>
        <p>You've been invited to become a ${role === 'admin' ? 'Government Official/Admin' : 'Moderator'} on Nivaari.</p>
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

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email, role = 'admin' } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    // Generate secure token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in Firestore
    await setDoc(doc(db, 'adminInvites', token), {
      email,
      role,
      createdAt: serverTimestamp(),
      expiresAt,
      used: false,
    });

    // Send email
    await sendRegistrationEmail(email, role, token);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        token // For debugging - remove in production
      }),
    };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to send invitation' }),
    };
  }
};
