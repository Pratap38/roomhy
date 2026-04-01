#!/bin/bash

# WhatsApp Integration Quick Check (curl-based)
# Use on VPS: bash scripts/check-whatsapp.sh OR source .env && bash scripts/check-whatsapp.sh

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  WhatsApp Integration Quick Check         ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if variables are set
if [ -z "$WHATSAPP_ACCESS_TOKEN" ]; then
    echo "❌ ERROR: WHATSAPP_ACCESS_TOKEN not set"
    exit 1
fi

if [ -z "$WHATSAPP_PHONE_NUMBER_ID" ]; then
    echo "❌ ERROR: WHATSAPP_PHONE_NUMBER_ID not set"
    exit 1
fi

API_VERSION="${WHATSAPP_API_VERSION:-v21.0}"

echo "✓ Configuration loaded"
echo "  - Token: ${WHATSAPP_ACCESS_TOKEN:0:20}..."
echo "  - Phone ID: $WHATSAPP_PHONE_NUMBER_ID"
echo "  - API Version: $API_VERSION"
echo ""

# Test 1: Verify Token with API
echo "📡 Test 1: Verifying API Access..."
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/whatsapp_response.json \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  "https://graph.facebook.com/$API_VERSION/$WHATSAPP_PHONE_NUMBER_ID")

HTTP_CODE="${RESPONSE: -3}"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ API connection successful (HTTP 200)"
    echo "  Response: $(cat /tmp/whatsapp_response.json | head -c 100)..."
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Unauthorized (HTTP 401) - Invalid or expired token"
    exit 1
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ Forbidden (HTTP 403) - Check phone number ID or permissions"
    exit 1
else
    echo "⚠️  HTTP $HTTP_CODE"
    cat /tmp/whatsapp_response.json
fi

echo ""

# Test 2: Send test text message (if phone number provided)
if [ -n "$1" ]; then
    PHONE="$1"
    echo "📱 Test 2: Sending test message to $PHONE..."
    
    curl -s -X POST \
      -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": "'$PHONE'",
        "type": "text",
        "text": {
          "preview_url": false,
          "body": "WhatsApp Integration Test Message from RoomHy"
        }
      }' \
      "https://graph.facebook.com/$API_VERSION/$WHATSAPP_PHONE_NUMBER_ID/messages" \
      | jq '.'
else
    echo "💡 To test sending a message, run:"
    echo "   bash scripts/check-whatsapp.sh 919876543210"
fi

echo ""
echo "✅ WhatsApp integration check complete"
echo ""
