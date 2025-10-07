const nodemailer = require('nodemailer');
require('dotenv').config();

export async function GET(req) {
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
  try {
    await transporter.verify();
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

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    return Response.json({ success: true, message: 'Test email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.log('❌ Email configuration error:', error);
    return Response.json({ error: 'Email configuration error', details: error.message }, { status: 500 });
  }
}