#!/usr/bin/env node

/**
 * Migadu Email Integration Test Script
 * Tests direct connection to Migadu SMTP servers
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testMigaduConnection() {
  console.log('🧪 Testing Migadu Email Integration...\n');
  
  // Check environment variables
  const requiredVars = ['MIGADU_SMTP_USER', 'MIGADU_SMTP_PASS'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease copy .env.example to .env and configure your Migadu credentials.');
    process.exit(1);
  }

  // Create Migadu transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.MIGADU_SMTP_HOST || 'smtp.migadu.com',
    port: parseInt(process.env.MIGADU_SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MIGADU_SMTP_USER,
      pass: process.env.MIGADU_SMTP_PASS,
    },
    debug: true, // Enable debug output
  });

  try {
    // Step 1: Verify connection
    console.log('🔍 Step 1: Verifying Migadu SMTP connection...');
    await transporter.verify();
    console.log('✅ Migadu SMTP connection verified successfully!\n');

    // Step 2: Send test email
    console.log('📧 Step 2: Sending test email via Migadu...');
    const mailOptions = {
      from: process.env.MIGADU_SMTP_USER,
      to: process.env.MIGADU_SMTP_USER, // Send to self for testing
      subject: `Migadu Test Email - ${new Date().toISOString()}`,
      text: 'This is a test email sent through Migadu SMTP to verify the integration is working correctly.',
      html: `
        <h2>🎉 Migadu Integration Test</h2>
        <p>This is a test email sent through <strong>Migadu SMTP</strong> to verify the integration is working correctly.</p>
        <ul>
          <li>Sent at: ${new Date().toISOString()}</li>
          <li>From: ${process.env.MIGADU_SMTP_USER}</li>
          <li>SMTP Host: ${process.env.MIGADU_SMTP_HOST || 'smtp.migadu.com'}</li>
          <li>SMTP Port: ${process.env.MIGADU_SMTP_PORT || '587'}</li>
        </ul>
        <p>If you received this email, the Migadu integration is working! 🚀</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}\n`);

    console.log('🎉 Migadu integration test completed successfully!');
    console.log('Check your email inbox to confirm delivery.');
    
  } catch (error) {
    console.error('❌ Migadu test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Please check:');
      console.error('   - MIGADU_SMTP_USER is correct');
      console.error('   - MIGADU_SMTP_PASS is correct');
      console.error('   - Account has SMTP access enabled');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Connection failed. Please check:');
      console.error('   - Internet connection is working');
      console.error('   - MIGADU_SMTP_HOST is correct');
      console.error('   - Firewall allows outbound SMTP connections');
    }
    
    process.exit(1);
  } finally {
    transporter.close();
  }
}

// Run the test
if (require.main === module) {
  testMigaduConnection().catch(console.error);
}

module.exports = { testMigaduConnection };