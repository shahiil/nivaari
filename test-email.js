require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (hidden)' : 'Missing');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('🔧 Verifying transporter...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully!');

    console.log('📧 Sending test email...');
    const result = await transporter.sendMail({
      from: `Nivaari Test <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Nivaari Email Test',
      html: `
        <h2>Email Test Success!</h2>
        <p>This email confirms that your Nivaari email configuration is working.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.command) console.error('SMTP command:', error.command);
  }
}

testEmail();