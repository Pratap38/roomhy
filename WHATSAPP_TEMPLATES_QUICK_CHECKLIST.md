# RoomHy WhatsApp Templates - Quick Reference Checklist

**Phone Number ID**: 982540604952277  
**Business Account ID**: 1463189491991857  
**Submission Date**: March 31, 2026

---

## TEMPLATE SUBMISSION CHECKLIST

### **CATEGORY A: AUTHENTICATION & ACCOUNT (Templates 1-3)**

- [ ] **Template 1: welcome_main_menu**
  - Type: Interactive Button
  - Category: ACCOUNT_UPDATE
  - Buttons: Signup, Login, Support
  - Status: ___________

- [ ] **Template 2: signup_link**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variable: {{website_url}}
  - Status: ___________

- [ ] **Template 3: login_link**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variable: {{website_url}}
  - Status: ___________

---

### **CATEGORY B: PROPERTY SEARCH (Templates 4-6)**

- [ ] **Template 4: city_selection_prompt**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variable: {{city_list}}
  - Status: ___________

- [ ] **Template 5: area_selection_prompt**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variables: {{city_name}}, {{area_list}}
  - Status: ___________

- [ ] **Template 6: property_results**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variables: {{area_name}}, {{city_name}}, {{property_list}}, {{website_url}}
  - Status: ___________

---

### **CATEGORY C: BOOKING & TRANSACTIONS (Templates 7-9)**

- [ ] **Template 7: booking_confirmed_menu**
  - Type: Interactive Button
  - Category: TRANSACTION_UPDATE
  - Buttons: Refund, Alternative, Main Menu
  - Variables: {{property_name}}, {{area_name}}, {{city_name}}
  - Status: ___________

- [ ] **Template 8: refund_request_link**
  - Type: Text
  - Category: TRANSACTION_UPDATE
  - Variables: {{website_url}}, {{support_email}}
  - Status: ___________

- [ ] **Template 9: alternative_property_flow**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variables: {{area_name}}, {{city_name}}, {{property_alternatives}}, {{website_url}}
  - Status: ___________

---

### **CATEGORY D: SERVICE FEATURES (Templates 10-11)**

- [ ] **Template 10: fast_bidding_link**
  - Type: Text
  - Category: MARKETING
  - Variable: {{website_url}}
  - Status: ___________

- [ ] **Template 11: property_listing_link**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variable: {{website_url}}
  - Status: ___________

---

### **CATEGORY E: SUPPORT & HELP (Templates 12-15)**

- [ ] **Template 12: support_menu**
  - Type: Interactive Button
  - Category: CUSTOMER_CARE
  - Buttons: Owner Help, Tenant Help, Main Menu
  - Variable: {{business_name}}
  - Status: ___________

- [ ] **Template 13: owner_support**
  - Type: Text
  - Category: CUSTOMER_CARE
  - Variables: {{app_url}}, {{support_phone}}, {{support_email}}
  - Status: ___________

- [ ] **Template 14: tenant_support**
  - Type: Text
  - Category: CUSTOMER_CARE
  - Variables: {{website_url}}, {{support_phone}}, {{support_email}}
  - Status: ___________

- [ ] **Template 15: session_cleared**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variables: None
  - Status: ___________

---

### **CATEGORY F: ERROR & INFORMATIONAL (Templates 16-18)**

- [ ] **Template 16: invalid_city_area**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variable: {{entity_type}}
  - Status: ___________

- [ ] **Template 17: no_properties_found**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variables: {{area_name}}, {{city_name}}, {{website_url}}
  - Status: ___________

- [ ] **Template 18: no_cities_available**
  - Type: Text
  - Category: ACCOUNT_UPDATE
  - Variable: {{support_email}}
  - Status: ___________

---

### **CATEGORY G: POST-AUTH (Template 19)**

- [ ] **Template 19: post_auth_menu**
  - Type: Interactive Button
  - Category: ACCOUNT_UPDATE
  - Buttons: Bidding, View Property, List Property
  - Variable: {{business_name}}
  - Status: ___________

---

## PRE-SUBMISSION CHECKLIST

**Preparation:**
- [ ] Logged into Meta Business Manager
- [ ] Selected correct Business Account (RoomHy)
- [ ] Navigated to WhatsApp Message Templates
- [ ] Phone Number ID verified: 982540604952277
- [ ] All templates saved locally for reference

**Quality Check:**
- [ ] No {{variables}} that aren't documented
- [ ] Button titles are ≤ 20 characters
- [ ] Text bodies are ≤ 3,900 characters
- [ ] No PII (personal data) in templates
- [ ] No promotional language in non-MARKETING templates
- [ ] Professional tone maintained
- [ ] Links are valid and working
- [ ] All {{variables}} use correct syntax

**Template Names:**
- [ ] No spaces in template names (use underscores)
- [ ] All lowercase
- [ ] Descriptive and unique
- [ ] Match provided template names exactly

---

## SUBMISSION PROCESS (Step-by-Step)

1. **Start**: Click "Create Template" button
2. **Name**: Copy template name (e.g., `welcome_main_menu`)
3. **Language**: Select "English"
4. **Category**: Select category from checklist above
5. **Type**: 
   - For text templates: Copy body text
   - For button templates: Copy body, then add buttons
6. **Variables**: Leave as {{variable_name}} (Meta will recognize)
7. **Submit**: Click Submit button
8. **Record**: Write approval status in checklist

---

## PER-TEMPLATE SUBMISSION TIME

- Interactive Button Template: ~3 minutes
- Text Template: ~2 minutes
- **Total for 19 templates**: ~40-50 minutes

---

## POST-SUBMISSION

**Tracking:**
- [ ] All 19 templates show in Message Templates list
- [ ] Check daily for approval status
- [ ] Expected: 24-48 hours for all to be APPROVED

**If Rejected:**
- [ ] Click rejected template
- [ ] Read rejection reason
- [ ] Modify template accordingly
- [ ] Resubmit

**After All Approved:**
- [ ] Update backend code to use templates
- [ ] Test with live WhatsApp numbers
- [ ] Monitor delivery and user experience

---

## QUICK VARIABLE REFERENCE

| Variable | Value |
|----------|-------|
| {{business_name}} | RoomHy |
| {{website_url}} | https://roomhy.com |
| {{app_url}} | https://app.roomhy.com |
| {{support_phone}} | +91-8764425030 |
| {{support_email}} | support@roomhy.com |
| {{city_name}} | [User selected city] |
| {{area_name}} | [User selected area] |
| {{property_name}} | [Property name] |
| {{city_list}} | [Auto-generated list] |
| {{area_list}} | [Auto-generated list] |
| {{property_list}} | [Auto-generated list] |
| {{entity_type}} | city or area |

---

## BUTTON REFERENCE

**Size Limits:**
- Button text: Max 20 characters
- Per message: Max 3 buttons
- For interactive cards: Max 10 rows, 2 buttons for actions

**Approved Button Types:**
- Quick Reply (text buttons)
- Phone Call (call button)
- URL (link button)

---

## TROUBLESHOOTING QUICK FIXES

| Problem | Solution |
|---------|----------|
| Can't find templates section | Menu → WhatsApp Manager → Phone Numbers → Your Number → Message Templates |
| Button text showing as wrong | Check it's ≤ 20 chars, no special characters |
| Template rejected immediately | Review rejection reason in template details |
| Variable not being replaced | Use exact syntax: {{variable_name}} with double braces |
| Waiting >48 hours for approval | Contact Meta Support (Business Manager → Help) |

---

## FINAL CHECKLIST BEFORE GOING LIVE

- [ ] All 19 templates APPROVED
- [ ] Tested with real WhatsApp numbers
- [ ] Variables replacing correctly
- [ ] Buttons working as expected
- [ ] Links are clickable and correct
- [ ] Backend code updated to use templates
- [ ] No errors in server logs
- [ ] User feedback positive
- [ ] Ready to scale up

---

**NOTES DURING SUBMISSION:**

```

Template 1 - Submitted: _________ Approved: _________
Template 2 - Submitted: _________ Approved: _________
Template 3 - Submitted: _________ Approved: _________
Template 4 - Submitted: _________ Approved: _________
Template 5 - Submitted: _________ Approved: _________
Template 6 - Submitted: _________ Approved: _________
Template 7 - Submitted: _________ Approved: _________
Template 8 - Submitted: _________ Approved: _________
Template 9 - Submitted: _________ Approved: _________
Template 10 - Submitted: _________ Approved: _________
Template 11 - Submitted: _________ Approved: _________
Template 12 - Submitted: _________ Approved: _________
Template 13 - Submitted: _________ Approved: _________
Template 14 - Submitted: _________ Approved: _________
Template 15 - Submitted: _________ Approved: _________
Template 16 - Submitted: _________ Approved: _________
Template 17 - Submitted: _________ Approved: _________
Template 18 - Submitted: _________ Approved: _________
Template 19 - Submitted: _________ Approved: _________

Overall Status: _____________________________
```

---

**Questions During Submission?**  
Reference: [WHATSAPP_TEMPLATES_META_APPROVAL.md](WHATSAPP_TEMPLATES_META_APPROVAL.md)  
Submission Help: [WHATSAPP_TEMPLATES_SUBMISSION_GUIDE.md](WHATSAPP_TEMPLATES_SUBMISSION_GUIDE.md)
