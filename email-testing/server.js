const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Email configuration for local testing (MailHog)
const localTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'mailhog',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: false, // MailHog doesn't require auth
});

// Email configuration for Migadu
const migaduTransporter = nodemailer.createTransporter({
  host: process.env.MIGADU_SMTP_HOST || 'smtp.migadu.com',
  port: parseInt(process.env.MIGADU_SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MIGADU_SMTP_USER,
    pass: process.env.MIGADU_SMTP_PASS,
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      mailhog: `http://localhost:8025`,
      smtp_local: `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`,
      smtp_migadu: `${process.env.MIGADU_SMTP_HOST}:${process.env.MIGADU_SMTP_PORT}`
    }
  });
});

// Test local email (MailHog)
app.post('/test/local', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'test@toolstac.com',
      to: to || 'test@example.com',
      subject: subject || 'Local Email Test',
      text: text || 'This is a test email sent through MailHog',
      html: html || '<p>This is a <strong>test email</strong> sent through MailHog</p>',
    };

    const info = await localTransporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
      mailhogUrl: 'http://localhost:8025',
      message: 'Email sent successfully via MailHog'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send email via MailHog'
    });
  }
});

// Test Migadu email
app.post('/test/migadu', async (req, res) => {
  try {
    if (!process.env.MIGADU_SMTP_USER || !process.env.MIGADU_SMTP_PASS) {
      return res.status(400).json({
        success: false,
        error: 'Migadu credentials not configured',
        message: 'Please set MIGADU_SMTP_USER and MIGADU_SMTP_PASS environment variables'
      });
    }

    const { to, subject, text, html } = req.body;
    
    const mailOptions = {
      from: process.env.MIGADU_SMTP_USER,
      to: to || 'test@example.com',
      subject: subject || 'Migadu Email Test',
      text: text || 'This is a test email sent through Migadu',
      html: html || '<p>This is a <strong>test email</strong> sent through Migadu</p>',
    };

    const info = await migaduTransporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
      message: 'Email sent successfully via Migadu'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send email via Migadu'
    });
  }
});

// Verify email configurations
app.get('/verify', async (req, res) => {
  const results = {
    local: { configured: false, verified: false },
    migadu: { configured: false, verified: false }
  };

  // Test local connection
  try {
    await localTransporter.verify();
    results.local.configured = true;
    results.local.verified = true;
  } catch (error) {
    results.local.error = error.message;
  }

  // Test Migadu connection
  try {
    if (process.env.MIGADU_SMTP_USER && process.env.MIGADU_SMTP_PASS) {
      results.migadu.configured = true;
      await migaduTransporter.verify();
      results.migadu.verified = true;
    } else {
      results.migadu.error = 'Credentials not configured';
    }
  } catch (error) {
    results.migadu.error = error.message;
  }

  res.json(results);
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    title: 'Email Testing Framework',
    description: 'Portable email testing for Migadu integration',
    endpoints: {
      'GET /health': 'Health check and service status',
      'GET /verify': 'Verify email service connections',
      'POST /test/local': 'Send test email via MailHog (local)',
      'POST /test/migadu': 'Send test email via Migadu (production)',
    },
    services: {
      mailhog_ui: 'http://localhost:8025',
      api: `http://localhost:${PORT}`
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Email Testing Framework running on port ${PORT}`);
  console.log(`📧 MailHog UI: http://localhost:8025`);
  console.log(`🌐 API: http://localhost:${PORT}`);
});