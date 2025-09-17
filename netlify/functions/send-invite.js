const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
}

// MongoDB connection helper
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB Atlas');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Admin Invite Schema
const AdminInviteSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'supervisor'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// EmailLog Schema
const EmailLogSchema = new mongoose.Schema(
  {
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    emailType: {
      type: String,
      enum: ['invitation', 'registration_confirmation', 'password_reset', 'notification'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const AdminInvite = mongoose.models.AdminInvite || mongoose.model('AdminInvite', AdminInviteSchema);
const EmailLog = mongoose.models.EmailLog || mongoose.model('EmailLog', EmailLogSchema);

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
  
  const subject = `Nivaari ${role === 'admin' ? 'Admin' : 'Supervisor'} Invitation`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1F2937;">Nivaari ${role === 'admin' ? 'Admin' : 'Supervisor'} Invitation</h2>
        <p>Hello,</p>
        <p>You have been invited to join Nivaari as a${role === 'admin' ? 'n admin' : ' supervisor'}.</p>
        <p>Please click the link below to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${registrationLink}" 
             style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Registration
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3B82F6;">${registrationLink}</p>
        <p><strong>Note:</strong> This invitation link will expire in 24 hours.</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 14px; color: #666;">
          If you did not expect this invitation, please ignore this email.
        </p>
        <p style="font-size: 14px; color: #666;">
          Best regards,<br>
          The Nivaari Team
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

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
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

    // Connect to MongoDB
    await connectToDatabase();

    // Generate secure token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create email log entry
    const emailLog = new EmailLog({
      recipientEmail: email,
      emailType: 'invitation',
      subject: `Nivaari ${role === 'admin' ? 'Admin' : 'Supervisor'} Invitation`,
      status: 'pending',
      metadata: { token, role },
    });

    try {
      // Store token in MongoDB
      const adminInvite = new AdminInvite({
        token,
        email,
        role,
        expiresAt,
      });
      
      await adminInvite.save();
      
      // Send email
      await sendRegistrationEmail(email, role, token);
      
      // Update email log as sent
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      await emailLog.save();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Invitation sent successfully',
        }),
      };
    } catch (error) {
      console.error('Error sending invitation:', error);
      
      // Update email log as failed
      emailLog.status = 'failed';
      emailLog.errorMessage = error.message;
      await emailLog.save();
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to send invitation' }),
      };
    }
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};