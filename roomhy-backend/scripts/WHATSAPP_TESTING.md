# WhatsApp Integration Testing & Diagnostics

Quick reference guide for checking WhatsApp integration on VPS.

## Available Scripts

### 1. **Quick Health Check** (Node.js)
```bash
cd roomhy-backend
node scripts/check-whatsapp.js                    # Just verify config
node scripts/check-whatsapp.js 919876543210       # Send test message
```

**Output:**
- ✅ Verifies environment variables
- ✅ Tests API connectivity
- ✅ Sends test template message (if phone provided)

---

### 2. **Bash Quick Check** (Linux/VPS)
```bash
bash scripts/check-whatsapp.sh                    # Verify config
bash scripts/check-whatsapp.sh 919876543210       # Send test message
```

**Note:** Requires `jq` for JSON parsing
```bash
apt-get install jq    # Ubuntu/Debian
yum install jq        # CentOS/RHEL
```

---

### 3. **Full Diagnostic Report** (Node.js)
```bash
node scripts/diagnose-whatsapp.js
```

**Generates:**
- Environment variable validation
- Configuration format checks
- API connectivity tests  
- Webhook setup instructions
- Saves report to `whatsapp-diagnostic-report.json`

---

## Manual cURL Tests (From VPS)

### Test 1: Verify API Access
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://graph.facebook.com/v21.0/PHONE_NUMBER_ID
```

**Expected Response:**
```json
{
  "id": "962359673330858",
  "phone_number_id": "962359673330858",
  "status": "ACTIVE"
}
```

### Test 2: Send Text Message
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "919876543210",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "Hello from RoomHy API!"
    }
  }' \
  https://graph.facebook.com/v21.0/PHONE_NUMBER_ID/messages
```

### Test 3: Send Template Message
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {
        "code": "en_US"
      }
    }
  }' \
  https://graph.facebook.com/v21.0/PHONE_NUMBER_ID/messages
```

---

## API Endpoint Health Check

```bash
# Check if WhatsApp routes are loaded
curl https://api.roomhy.com/api/whatsapp/health

# Expected response:
{
  "success": true,
  "configured": true,
  "phoneNumberId": "962359673330858",
  "apiVersion": "v21.0"
}
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `configured: false` | Env vars not loaded | Restart server: `pm2 restart roomhy-backend` |
| `HTTP 401` | Invalid/expired token | Regenerate token in Meta Business Manager |
| `HTTP 403` | Wrong phone ID | Verify phone number ID in Meta settings |
| `Invalid recipient` | Number not on WhatsApp | Use a real WhatsApp number for testing |
| `Template not found` | Template name wrong/not approved | Create and approve template in Meta first |
| Webhook not receiving | URL not registered | Set webhook URL in Meta App Settings |

---

## Environment Variables Needed

```bash
# In roomhy-backend/.env
WHATSAPP_ACCESS_TOKEN=YOUR_TOKEN_HERE
WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_ID_HERE
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_API_VERSION=v21.0
WHATSAPP_DEFAULT_COUNTRY_CODE=91
WHATSAPP_BOT_ENABLED=true
```

---

## On Production VPS

```bash
# SSH into VPS
ssh user@api.roomhy.com

# Navigate to backend
cd /home/roomhy/roomhy-backend

# Run diagnostic
node scripts/diagnose-whatsapp.js

# Run quick check with test number
node scripts/check-whatsapp.js 919876543210

# Check application logs
pm2 logs roomhy-backend | grep -i whatsapp

# Restart if needed
pm2 restart roomhy-backend
```

---

## Debugging

Enable detailed logging by adding to server.js:

```javascript
// Add before WhatsApp initialization
process.env.DEBUG = '*whatsapp*';

// Check console for detailed API logs
```

Check logs:
```bash
pm2 logs roomhy-backend --lines 100
tail -f /var/log/roomhy/backend.log
```

---

**Last Updated:** April 2026
