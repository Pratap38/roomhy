# WhatsApp Templates Meta Approval - Submission Guide

**For**: RoomHy Team  
**Date**: March 31, 2026  
**Status**: Ready for Submission

---

## QUICK START CHECKLIST

- [ ] Have Meta Business Account access
- [ ] Have WhatsApp Business Account linked
- [ ] Phone Number ID: **982540604952277**
- [ ] Business Account ID: **1463189491991857**
- [ ] Access Token ready (from .env)
- [ ] All 19 templates reviewed

---

## METHOD 1: SUBMIT VIA META BUSINESS MANAGER (RECOMMENDED - USER-FRIENDLY)

### **Step 1: Access Meta Business Manager**
1. Go to: https://business.facebook.com/
2. Login with your Meta Business Account
3. Select your Business (RoomHy)

### **Step 2: Navigate to WhatsApp Templates**
1. Click **"Business Tools"** (top left)
2. Find and click **"WhatsApp Manager"**
3. Select **"Phone Numbers"**
4. Click on your phone number: **+91 98254-0604-952277**
5. Click **"Message Templates"** (in left menu)

### **Step 3: Create First Template (Welcome Menu)**
1. Click **"Create Template"** button (top right)
2. Fill in:
   - **Template Name**: `welcome_main_menu`
   - **Language**: English
   - **Category**: ACCOUNT_UPDATE
   - **Template Type**: Click "Add Button"
   
3. In **Message Body**, paste:
```
Welcome to {{business_name}} WhatsApp Bot.
Choose one option below.
```

4. Click **"Text"** button input area, then select:
   - **Type**: Reply Button
   - **Button 1**: "Signup"
   - **Button 2**: "Login"
   - **Button 3**: "Support"

5. Click **"Submit"**

### **Step 4: Create Text Templates (Repeat for each)**
For templates 2, 3, 4, 5, 6, etc., repeat the process:

1. Click **"Create Template"**
2. Enter Template Name from the list
3. Select Language: **English (en)**
4. Select Category (from template spec)
5. Copy Message Body (with {{variables}})
6. Click **"Submit"**

### **Step 5: Create Interactive Button Templates**
For templates with buttons (7, 12, 19):

1. Click **"Create Template"**
2. Enter Template Name
3. Select Language: **English (en)**
4. Select Category
5. Select **"Button"** as message type
6. Add Message Body
7. Add buttons (max 3):
   - Button 1 title (max 20 chars)
   - Button 2 title (max 20 chars)
   - Button 3 title (max 20 chars)
8. Click **"Submit"**

### **Step 6: Monitor Approval Status**
1. In Message Templates page, view your templates
2. Status column shows:
   - **PENDING**: Waiting for Meta review (24-48 hours)
   - **APPROVED**: Ready to use
   - **REJECTED**: Review rejection reason, fix, and resubmit

---

## METHOD 2: SUBMIT VIA WHATSAPP BUSINESS API (ADVANCED)

### **Step 1: Prepare API Call**

You can submit templates using curl or Node.js:

```bash
# Using curl
curl -X POST \
  https://graph.facebook.com/v21.0/your-phone-number-id/message_templates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "welcome_main_menu",
    "language": "en",
    "category": "ACCOUNT_UPDATE",
    "components": [
      {
        "type": "BODY",
        "text": "Welcome to {{business_name}} WhatsApp Bot.\nChoose one option below."
      },
      {
        "type": "BUTTONS",
        "buttons": [
          {
            "type": "QUICK_REPLY",
            "text": "Signup"
          },
          {
            "type": "QUICK_REPLY",
            "text": "Login"
          },
          {
            "type": "QUICK_REPLY",
            "text": "Support"
          }
        ]
      }
    ]
  }'
```

### **Step 2: Node.js Implementation**

Here's a helper script for your backend:

```javascript
// /roomhy-backend/scripts/submit-whatsapp-templates.js

const https = require('https');

const templates = [
  {
    name: "welcome_main_menu",
    language: "en",
    category: "ACCOUNT_UPDATE",
    components: [
      {
        type: "BODY",
        text: "Welcome to {{business_name}} WhatsApp Bot.\nChoose one option below."
      },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Signup" },
          { type: "QUICK_REPLY", text: "Login" },
          { type: "QUICK_REPLY", text: "Support" }
        ]
      }
    ]
  },
  {
    name: "signup_link",
    language: "en",
    category: "ACCOUNT_UPDATE",
    components: [
      {
        type: "BODY",
        text: "Signup here:\n{{website_url}}/website/signup?mode=signup\n\nAfter signup is complete, reply with \"done\" or \"menu\"."
      }
    ]
  },
  // ... Add more templates here
];

async function submitTemplate(template, accessToken, phoneNumberId) {
  const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/message_templates`;
  
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(template);
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v21.0/${phoneNumberId}/message_templates`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          templateName: template.name,
          status: res.statusCode,
          response: JSON.parse(data)
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function submitAllTemplates() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error('Missing required env variables');
    process.exit(1);
  }

  console.log('🚀 Starting WhatsApp template submission...');
  
  for (const template of templates) {
    try {
      const result = await submitTemplate(template, accessToken, phoneNumberId);
      console.log(`✅ ${result.templateName}: ${result.status}`);
      if (result.response.message_template_id) {
        console.log(`   ID: ${result.response.message_template_id}`);
      }
    } catch (error) {
      console.error(`❌ ${template.name}: ${error.message}`);
    }
  }

  console.log('✅ Submission complete! Check Meta Business Manager for approval status.');
}

submitAllTemplates();
```

**Running the script:**
```bash
cd roomhy-backend
node scripts/submit-whatsapp-templates.js
```

---

## TEMPLATE APPROVAL TRACKING

### **Track Approval Status in Business Manager**

1. **Go to**: Message Templates page
2. **View Status**:
   - PENDING (with clock icon) = Under review
   - APPROVED (with checkmark) = Ready to use
   - REJECTED (with X) = Review rejection reason

3. **If Rejected**:
   - Click template
   - See rejection reason (usually details policy violations)
   - Modify template
   - Resubmit

### **Common Rejection Reasons & Fixes**

| Reason | Fix |
|--------|-----|
| "Contains promotional content" | Remove sales language, keep it informational |
| "Variable placeholders not allowed" | Use only documented {{variables}} |
| "Button text too long" | Keep button titles ≤ 20 characters |
| "Violates naming policy" | Use lowercase with underscores (welcome_main_menu) |
| "Not appropriate for category" | Match category with message type |

---

## INTEGRATION WITH YOUR BACKEND

### **Use Approved Templates in WhatsApp Bot**

Once templates are APPROVED, update your sending code:

**Before (sending raw text):**
```javascript
await sendTextMessage(to, 'Welcome to RoomHy...');
```

**After (using template):**
```javascript
async function sendTemplateMessage(phoneNumber, templateName, variables = {}) {
  const cfg = getConfig();
  
  // Map template names to parameter order
  const templateParams = {
    'welcome_main_menu': [cfg.defaultBrandName],
    'signup_link': [cfg.websiteUrl],
    'property_results': [variables.areaName, variables.cityName, variables.propertyList]
  };

  return sendWhatsAppPayload({
    to: phoneNumber,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'en'
      },
      parameters: {
        body: {
          parameters: templateParams[templateName] || []
        }
      }
    }
  });
}
```

---

## TIMELINE EXPECTATIONS

| Phase | Duration | Action |
|-------|----------|--------|
| **Submission** | 1 hour | Submit all 19 templates |
| **Meta Review** | 24-48 hours | Meta reviews each template |
| **Approval Batch** | 48-72 hours | Most/all templates approved |
| **Integration** | 2-4 hours | Update backend code |
| **Testing** | 2-4 hours | Test with real WhatsApp users |
| **Live** | Immediate | Start using approved templates |

---

## TESTING AFTER APPROVAL

### **Test Template Messages**

1. **Setup Test Phone Number**:
   - Add your personal WhatsApp number to test mode
   - Or use a dedicated test WhatsApp account

2. **Send Test Messages**:
```javascript
// Test welcome template
await sendTemplateMessage(testPhoneNumber, 'welcome_main_menu');

// Test property results template
await sendTemplateMessage(testPhoneNumber, 'property_results', {
  areaName: 'Koramangala',
  cityName: 'Bangalore',
  propertyList: '1. The Hive\n2. Prime Student Living'
});
```

3. **Verify**:
   - ✅ Message received
   - ✅ Variables replaced correctly
   - ✅ Buttons appear correctly
   - ✅ Links are clickable
   - ✅ No formatting issues

---

## SUPPORT & TROUBLESHOOTING

### **Issues & Solutions**

**Q: Template rejected - "Missing required parameter"**  
A: Ensure all {{variables}} in your template are documented in the variables file

**Q: Can't find Message Templates section**  
A: Go to WhatsApp Manager → Phone Numbers → Your Number → Check left sidebar

**Q: How to update a template?**  
A: You cannot edit approved templates. Delete and resubmit (available 24h after delete)

**Q: What if a test message fails?**  
A: Check:
- Template is APPROVED status
- Phone number is valid with country code
- Variable parameters match template requirements
- Access token hasn't expired

---

## REFERENCE DOCUMENTS

**Your prepared files:**
1. `WHATSAPP_TEMPLATES_META_APPROVAL.md` - Full template guide
2. `WHATSAPP_TEMPLATES_META_JSON.json` - JSON format for API
3. `submit-whatsapp-templates.js` - Submission script (above)

**Meta Official Resources:**
- https://developers.facebook.com/docs/whatsapp/message-templates
- https://developers.facebook.com/docs/whatsapp/cloud-api
- Meta Business Manager Help: https://business.facebook.com/help

---

## SUBMISSION CONFIRMATION CHECKLIST

Before submitting, verify:

- [ ] All 19 templates reviewed
- [ ] Variables match actual backend code
- [ ] Button titles are ≤ 20 characters
- [ ] Message bodies are ≤ 3900 characters
- [ ] No PII (personal data) in templates
- [ ] Category is correctly assigned
- [ ] Language is set to "English (en)"
- [ ] Phone Number ID is **982540604952277**
- [ ] Business Account ID is **1463189491991857**
- [ ] Access Token is valid and has proper permissions

---

**READY TO SUBMIT? ✅**  
Use Method 1 (Business Manager) for easiest submission.  
Expected approval: **24-48 hours**

**Questions?** Contact Meta support or visit: https://developers.facebook.com/support
