#\!/bin/bash

# Migadu Email Testing Script
# Test email functionality with Mailhog and SMTP relay

echo "=== Migadu Email Infrastructure Test ==="
echo "Time: $(date)"

# Configuration
MAILHOG_URL="http://localhost:8025"
SMTP_HOST="localhost"
SMTP_PORT="1025"
TEST_EMAIL="test@example.com"

echo "1. Testing Mailhog availability..."
if curl -s ${MAILHOG_URL}/api/v2/messages > /dev/null; then
    echo "✅ Mailhog is running and accessible at ${MAILHOG_URL}"
else
    echo "❌ Mailhog not accessible. Check if containers are running."
    exit 1
fi

echo "2. Testing SMTP connection..."
if nc -z ${SMTP_HOST} ${SMTP_PORT}; then
    echo "✅ SMTP server is listening on ${SMTP_HOST}:${SMTP_PORT}"
else
    echo "❌ SMTP server not accessible"
    exit 1
fi

echo "3. Sending test email..."
cat << EMAILEOF  < /dev/null |  nc ${SMTP_HOST} ${SMTP_PORT}
HELO localhost
MAIL FROM: <${TEST_EMAIL}>
RCPT TO: <test-recipient@example.com>
DATA
From: ${TEST_EMAIL}
To: test-recipient@example.com
Subject: Migadu Test Email

This is a test email for Migadu integration testing.
Timestamp: $(date)
.
QUIT
EMAILEOF

echo "4. Checking email in Mailhog..."
sleep 2
if command -v jq > /dev/null; then
    MESSAGE_COUNT=$(curl -s ${MAILHOG_URL}/api/v2/messages | jq '.total // 0')
else
    MESSAGE_COUNT="unknown"
fi

if [ "${MESSAGE_COUNT}" \!= "0" ] && [ "${MESSAGE_COUNT}" \!= "unknown" ]; then
    echo "✅ Email captured\! ${MESSAGE_COUNT} message(s) in Mailhog"
else
    echo "📧 Check emails manually at: ${MAILHOG_URL}"
fi

echo "=== Test Complete ==="
echo "Next steps:"
echo "1. Configure Migadu credentials in .env file"
echo "2. Test SMTP relay with real Migadu server"
echo "3. Validate email delivery and reception"
