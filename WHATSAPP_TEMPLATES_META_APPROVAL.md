# RoomHy WhatsApp Message Templates for Meta Approval

**Date**: March 31, 2026  
**Business Name**: RoomHy  
**Use Case**: B2C Property Rental Platform with Interactive ChatBot  
**Business Phone Number**: +91-8764425030  
**Support Email**: support@roomhy.com

---

## 1. APPLICABILITY STATEMENT

RoomHy is a property rental platform that helps tenants and property owners connect. We use WhatsApp to:
- Allow users to search for rental properties
- Enable property owners to list their properties
- Facilitate booking confirmation and post-booking support
- Provide customer support to both tenants and property owners

All templates comply with Meta's WhatsApp Business Message Guidelines and are transactional/informational in nature.

---

## 2. MESSAGE TEMPLATES FOR META APPROVAL

### **CATEGORY A: AUTHENTICATION & ACCOUNT**

#### Template 1: Welcome & Main Menu
```
Template Name: welcome_main_menu
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Welcome to {{business_name}} WhatsApp Bot.
Choose one option below.

[Button 1: Signup]
[Button 2: Login]
[Button 3: Support]

Note: Interactive button message. User selects option via quick reply.
```

#### Template 2: Signup Confirmation
```
Template Name: signup_link
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Signup here:
{{website_url}}/website/signup?mode=signup

After signup is complete, reply with "done" or "menu".
```

#### Template 3: Login Link
```
Template Name: login_link
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Login here:
{{website_url}}/website/signup?mode=login

After login is complete, reply with "done" or "menu".
```

---

### **CATEGORY B: PROPERTY SEARCH & BROWSING**

#### Template 4: City Selection Menu
```
Template Name: city_selection_prompt
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Select a city by replying with the number or city name.

{{city_list}}

Example:
1. Bangalore, Karnataka
2. Kota, Rajasthan
3. Indore, Madhya Pradesh
4. Delhi, Delhi
```

#### Template 5: Area Selection Confirmation
```
Template Name: area_selection_prompt
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Selected city: {{city_name}}
Now reply with the area number or name.

{{area_list}}

Example:
1. Koramangala
2. Whitefield
3. Indiranagar
```

#### Template 6: Property Listings
```
Template Name: property_results
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Properties in {{area_name}}, {{city_name}}:

{{property_list}}

Example:
1. The Hive
   Rent: INR 18,000
   Link: {{website_url}}/website/property?id=123

2. Prime Student Living
   Rent: INR 11,000
   Link: {{website_url}}/website/property?id=456

More in this city: {{website_url}}/website/ourproperty
```

---

### **CATEGORY C: BOOKING & TRANSACTIONS**

#### Template 7: Booking Confirmation Menu
```
Template Name: booking_confirmed_menu
Language: en
Category: TRANSACTION_UPDATE

Message Body:
Booking confirmed for {{property_name}}.
Choose refund or alternative property.

[Button 1: Refund]
[Button 2: Alternative]
[Button 3: Main Menu]

Saved preference: {{area_name}}, {{city_name}}
You can reply "alternative" any time to get matching property links in that area.
```

#### Template 8: Refund Request Link
```
Template Name: refund_request_link
Language: en
Category: TRANSACTION_UPDATE

Message Body:
Refund request link:
{{website_url}}/website/refund-request

If your booking is already visible in My Stays, you can also raise refund from there.

Need help? Contact: {{support_email}}
```

#### Template 9: Alternative Property Suggestion
```
Template Name: alternative_property_flow
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Based on your preference for {{area_name}}, {{city_name}}, here are alternative properties:

{{property_alternatives}}

Browse more properties: {{website_url}}/website/ourproperty

Reply "bidding" to start fast bidding.
```

---

### **CATEGORY D: SERVICE FEATURES**

#### Template 10: Fast Bidding Link
```
Template Name: fast_bidding_link
Language: en
Category: MARKETING

Message Body:
Fast bidding link:
{{website_url}}/website/fast-bidding

Bid on your favorite properties and get instant responses from owners!
```

#### Template 11: Property Listing (For Owners)
```
Template Name: property_listing_link
Language: en
Category: ACCOUNT_UPDATE

Message Body:
List your property here:
{{website_url}}/website/list

Get verified tenants and manage your property all from one place!

For owner support, reply "owner help"
```

---

### **CATEGORY E: SUPPORT & HELP**

#### Template 12: Support Menu
```
Template Name: support_menu
Language: en
Category: CUSTOMER_CARE

Message Body:
{{business_name}} support
Select owner or tenant support.

[Button 1: Owner Help]
[Button 2: Tenant Help]
[Button 3: Main Menu]
```

#### Template 13: Owner Support Information
```
Template Name: owner_support
Language: en
Category: CUSTOMER_CARE

Message Body:
Owner support

Owner panel login: {{app_url}}/propertyowner/ownerlogin
Phone: {{support_phone}}
Email: {{support_email}}

Need help with listings, payments, or tenant management? We're here to help!
```

#### Template 14: Tenant Support Information
```
Template Name: tenant_support
Language: en
Category: CUSTOMER_CARE

Message Body:
Tenant support

Website login/signup: {{website_url}}/website/signup?mode=login
My stays: {{website_url}}/website/mystays
Phone: {{support_phone}}
Email: {{support_email}}

Check your bookings, raise refunds, and chat with property owners from My Stays!
```

#### Template 15: Session Reset Message
```
Template Name: session_cleared
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Session cleared. Type "hi" or "hello" to start fresh.
```

---

### **CATEGORY F: ERROR & INFORMATIONAL**

#### Template 16: Invalid City/Area Response
```
Template Name: invalid_city_area
Language: en
Category: ACCOUNT_UPDATE

Message Body:
Invalid {{entity_type}}. Reply with the {{entity_type}} number or exact name.

Type "menu" to return to main menu.
```

#### Template 17: No Results Message
```
Template Name: no_properties_found
Language: en
Category: ACCOUNT_UPDATE

Message Body:
No properties found right now in {{area_name}}, {{city_name}}.

Browse city listings: {{website_url}}/website/ourproperty

Or type "bidding" to go to fast bidding.
Type "menu" for other options.
```

#### Template 18: No Active Cities Available
```
Template Name: no_cities_available
Language: en
Category: ACCOUNT_UPDATE

Message Body:
No active cities are available right now. Please try again later.

Contact us for assistance: {{support_email}}
```

---

### **CATEGORY G: POST-AUTH MENUS**

#### Template 19: Post-Authentication Menu
```
Template Name: post_auth_menu
Language: en
Category: ACCOUNT_UPDATE

Message Body:
{{business_name}} options
Choose your next step.

[Button 1: Bidding]
[Button 2: View Property]
[Button 3: List Property]
```

---

## 3. TEMPLATE MESSAGE VARIABLE PLACEHOLDERS

All templates use {{variable_name}} placeholders that are replaced with real data at runtime:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{business_name}}` | RoomHy | "RoomHy" |
| `{{website_url}}` | Main website domain | "https://roomhy.com" |
| `{{app_url}}` | Application URL | "https://app.roomhy.com" |
| `{{support_phone}}` | Support phone number | "+91-8764425030" |
| `{{support_email}}` | Support email | "support@roomhy.com" |
| `{{city_name}}` | Property city name | "Bangalore" |
| `{{area_name}}` | Property area name | "Koramangala" |
| `{{property_name}}` | Property name | "The Hive" |
| `{{city_list}}` | Numbered list of cities | "1. Bangalore, Karnataka\n2. Kota, Rajasthan" |
| `{{area_list}}` | Numbered list of areas | "1. Koramangala\n2. Whitefield" |
| `{{property_list}}` | Detailed property list with links | "1. The Hive\nRent: INR 18,000\nLink: ..." |
| `{{property_alternatives}}` | Alternative property suggestions | Property listings |
| `{{entity_type}}` | "city" or "area" | "city" |

---

## 4. MESSAGE TYPES & FEATURES

### **Text Messages**
- Used for informational and transactional content
- Max length: 3,900 characters
- Includes live links to website and app

### **Interactive Button Messages**
- Used for menu selections and user choices
- Max 3 buttons per message
- Button titles: max 20 characters each
- Used templates:
  - Main menu (Signup, Login, Support)
  - Support submenu (Owner, Tenant, Back)
  - Booking options (Refund, Alternative, Menu)
  - Post-auth menu (Bidding, Properties, Listing)

---

## 5. BUSINESS USE CASES SUPPORTED

### **Use Case 1: Tenant Property Search**
- User initiates conversation
- Selects city → area → views properties
- Can request booking or check alternative properties
- Can refund bookings

### **Use Case 2: Property Owner Support**
- Receive tenant inquiries via WhatsApp
- Access owner panel links
- Get support information
- Manage listings

### **Use Case 3: Fast Bidding**
- Users can access fast bidding platform
- Bid on properties
- Receive instant responses

### **Use Case 4: Customer Support**
- Separate support paths for owners and tenants
- Direct contact via phone/email
- Self-service option through website links

---

## 6. COMPLIANCE & POLICY ADHERENCE

✅ **Messaging Policy Compliance**
- All messages are transactional or informational
- No spam or unsolicited marketing messages
- Clear opt-out mechanism (select "menu" or "support")
- Messages provide value and are user-requested
- Maximum frequency: User-initiated conversations only

✅ **Content Guidelines**
- No prohibited content (hate speech, violence, etc.)
- Professional tone
- Relevant to business purpose
- Respects user privacy
- Clear contact information provided

✅ **Bot Behavior**
- Responsive to user inputs
- Provides meaningful options
- Error handling with guidance
- Session management
- Can escalate to human support

---

## 7. TEMPLATE APPROVAL CHECKLIST

- [ ] All templates provided to Meta via Business Manager
- [ ] Template language set to English (en)
- [ ] Categories correctly assigned:
  - ACCOUNT_UPDATE: Authentication, menus, preferences
  - TRANSACTION_UPDATE: Bookings, refunds
  - MARKETING: Fast bidding campaigns (optional)
  - CUSTOMER_CARE: Support templates
- [ ] Variable placeholders documented
- [ ] No personally identifiable information (PII) in templates
- [ ] No promotional or time-sensitive content without approval
- [ ] Button templates follow WhatsApp format
- [ ] All URLs are production-ready

---

## 8. META BUSINESS MANAGER SUBMISSION

### **Step-by-Step Submission:**

1. Go to Meta Business Manager → WhatsApp
2. Navigate to: Accounts → Phone Numbers → Message Templates
3. For each template:
   - Click "Create Template"
   - Enter Template Name (use names provided above)
   - Select Language: English
   - Select Category (as specified)
   - Paste Message Body
   - For interactive templates: Add buttons with titles
   - For templates with variables: Define placeholder names
   - Submit for approval

4. Expected Approval Timeline: 24-48 hours
5. Keep template names consistent for billing/analytics

---

## 9. MONITORING & COMPLIANCE

**Metrics to Track:**
- Template approval/rejection status
- Message delivery rates
- User engagement metrics
- Error/failure rates
- Support escalation rates

**Regular Reviews:**
- Monthly template performance review
- User feedback analysis
- Compliance updates
- Template refresh (if needed)

---

## 10. CONTACT FOR META APPROVAL

**Business Information:**
- **Business Name**: RoomHy
- **Business Email**: support@roomhy.com
- **Support Phone**: +91-8764425030
- **Website**: https://roomhy.com
- **App URL**: https://app.roomhy.com
- **WhatsApp Business Account ID**: 1463189491991857
- **Phone Number ID**: 982540604952277

---

## APPENDIX: API INTEGRATION REFERENCE

### **Backend Implementation:**
- Framework: Node.js + Express
- WhatsApp API Version: v21.0
- Endpoint: `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- Authentication: Bearer token (Business Account Access Token)

### **Key Files:**
- Message sending: `/roomhy-backend/utils/whatsappBot.js`
- Webhook handling: `/roomhy-backend/routes/whatsappWebhookRoutes.js`
- Booking integration: `/roomhy-backend/controllers/bookingController.js`

---

**Document Version**: 1.0  
**Last Updated**: March 31, 2026  
**Status**: Ready for Meta Approval Submission
