#!/usr/bin/env node

/**
 * Local Email Testing Script using MailHog
 * Tests email functionality without external dependencies
 */

const nodemailer = require('nodemailer');

async function testLocalEmail() {
  console.log('🧪 Testing Local Email Infrastructure (MailHog)...\n');

  // Create MailHog transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: false,
    auth: false, // MailHog doesn't require authentication
  });

  try {
    // Step 1: Verify connection
    console.log('🔍 Step 1: Verifying MailHog SMTP connection...');
    await transporter.verify();
    console.log('✅ MailHog SMTP connection verified successfully!\n');

    // Step 2: Send multiple test emails
    console.log('📧 Step 2: Sending test emails via MailHog...');
    
    const testEmails = [
      {
        to: 'user@toolstac.com',
        subject: 'Welcome Email Test',
        type: 'welcome'
      },
      {
        to: 'admin@toolstac.com', 
        subject: 'Password Reset Test',
        type: 'password-reset'
      },
      {
        to: 'notifications@toolstac.com',
        subject: 'System Alert Test',
        type: 'alert'
      }
    ];

    for (const email of testEmails) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'test@toolstac.com',
        to: email.to,
        subject: `${email.subject} - ${new Date().toISOString()}`,
        text: `This is a ${email.type} test email sent through MailHog for local testing.`,
        html: `
          <h2>📧 ${email.subject}</h2>
          <p>This is a <strong>${email.type}</strong> test email sent through MailHog for local testing.</p>
          <ul>
            <li>Sent at: ${new Date().toISOString()}</li>
            <li>To: ${email.to}</li>
            <li>Type: ${email.type}</li>
            <li>SMTP Host: ${process.env.SMTP_HOST || 'localhost'}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT || '1025'}</li>
          </ul>
          <p>Check the MailHog UI at <a href="http://localhost:8025">http://localhost:8025</a> to view this email! 📬</p>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Sent ${email.type} email to ${email.to}`);
      console.log(`   Message ID: ${info.messageId}`);
    }

    console.log('\n🎉 Local email test completed successfully!');
    console.log('View all test emails at: http://localhost:8025');
    
  } catch (error) {
    console.error('❌ Local email test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Please check:');
      console.error('   - MailHog container is running (docker-compose up mailhog)');
      console.error('   - Port 1025 is available');
      console.error('   - Docker network is properly configured');
    }
    
    process.exit(1);
  } finally {
    transporter.close();
  }
}

// Run the test
if (require.main === module) {
  testLocalEmail().catch(console.error);
}

module.exports = { testLocalEmail };