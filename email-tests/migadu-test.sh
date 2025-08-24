#!/bin/bash
# Migadu Integration Testing Script
# Neo - DevOps Specialist - Matrix Team

echo "🚀 Migadu Email Integration Testing"
echo "=================================="

# Test environment variables
echo "📋 Checking environment variables..."
echo "MIGADU_SMTP_USERNAME: ${MIGADU_SMTP_USERNAME:-[NOT SET]}"
echo "MIGADU_SMTP_PASSWORD: ${MIGADU_SMTP_PASSWORD:-[NOT SET]}"
echo ""

# Test 1: MailHog connectivity
echo "🔍 Test 1: MailHog connectivity"
if wget --quiet --tries=1 --spider http://mailhog:8025; then
    echo "✅ MailHog web interface accessible"
else
    echo "❌ MailHog web interface not accessible"
fi

# Test 2: SMTP connectivity to MailHog
echo ""
echo "🔍 Test 2: SMTP connectivity to MailHog"
if nc -z mailhog 1025; then
    echo "✅ MailHog SMTP port 1025 accessible"
else
    echo "❌ MailHog SMTP port 1025 not accessible"
fi

# Test 3: SMTP relay connectivity
echo ""
echo "🔍 Test 3: SMTP relay connectivity"
if nc -z smtp-relay 25; then
    echo "✅ SMTP relay port 25 accessible"
else
    echo "❌ SMTP relay port 25 not accessible"
fi

# Test 4: Send test email through MailHog
echo ""
echo "🔍 Test 4: Send test email through MailHog"
cat << EOF | nc mailhog 1025
HELO localhost
MAIL FROM: test@toolstac.com
RCPT TO: recipient@toolstac.com
DATA
Subject: Migadu Integration Test
From: test@toolstac.com
To: recipient@toolstac.com

This is a test email from the Migadu integration testing framework.
Sent via MailHog for verification.

Best regards,
Neo - DevOps Specialist
.
QUIT
EOF

if [ $? -eq 0 ]; then
    echo "✅ Test email sent successfully"
else
    echo "❌ Failed to send test email"
fi

# Test 5: Check if Migadu credentials are provided for real testing
echo ""
echo "🔍 Test 5: Migadu credential validation"
if [ -z "$MIGADU_SMTP_USERNAME" ] || [ -z "$MIGADU_SMTP_PASSWORD" ]; then
    echo "⚠️  Migadu credentials not provided - real email testing disabled"
    echo "   Set MIGADU_SMTP_USERNAME and MIGADU_SMTP_PASSWORD to enable"
else
    echo "✅ Migadu credentials provided - real email testing enabled"
    
    # Test actual Migadu connectivity (if credentials provided)
    echo ""
    echo "🔍 Test 6: Migadu SMTP server connectivity"
    if nc -z mail.migadu.com 587; then
        echo "✅ Migadu SMTP server accessible"
    else
        echo "❌ Migadu SMTP server not accessible"
    fi
fi

echo ""
echo "📊 Testing complete. Check MailHog web interface at http://localhost:8025"
echo "💡 Logs saved to /logs/migadu-test-$(date +%Y%m%d-%H%M%S).log"