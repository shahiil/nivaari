const nodemailer = require('nodemailer');
require('dotenv').config();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Test email configuration
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Test the connection
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email configuration error:', error);
      return res.status(500).json({ error: 'Email configuration error', details: error.message });
    } else {
      console.log('✅ Email server is ready to send messages');

      // Send a test email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to yourself for testing
        subject: 'Nivaari Email Test',
        html: `
          <h2>Nivaari Email Test</h2>
          <p>This is a test email to verify that the email configuration is working properly.</p>
          <p>If you received this email, the nodemailer setup is working correctly!</p>
          <p>Time: ${new Date().toISOString()}</p>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log('❌ Test email failed:', err);
          return res.status(500).json({ error: 'Test email failed', details: err.message });
        } else {
          console.log('✅ Test email sent successfully!');
          console.log('Message ID:', info.messageId);
          return res.status(200).json({ success: true, message: 'Test email sent successfully', messageId: info.messageId });
        }
      });
    }
  });
}