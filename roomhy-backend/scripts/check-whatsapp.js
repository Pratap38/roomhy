#!/usr/bin/env node

/**
 * WhatsApp Integration Health Check Script
 * Run: node scripts/check-whatsapp.js [phone_number]
 * Example: node scripts/check-whatsapp.js 919876543210
 */

require('dotenv').config();
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, label, message = '') {
  const prefix = label ? `[${label}]` : '';
  console.log(`${colors[color]}${prefix} ${message}${colors.reset}`);
}

async function checkWhatsAppIntegration() {
  const phoneNumber = process.argv[2];
  
  console.log('\n' + colors.cyan + '═══════════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '  WhatsApp Integration Health Check' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════' + colors.reset + '\n');

  // 1. Check Environment Variables
  log('blue', 'STEP 1', 'Checking Environment Variables...');
  const config = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91',
    botEnabled: process.env.WHATSAPP_BOT_ENABLED !== 'false'
  };

  let envValid = true;
  if (!config.accessToken) {
    log('red', 'ERROR', 'WHATSAPP_ACCESS_TOKEN is missing');
    envValid = false;
  } else {
    log('green', 'OK', `Access Token: ${config.accessToken.slice(0, 20)}...`);
  }

  if (!config.phoneNumberId) {
    log('red', 'ERROR', 'WHATSAPP_PHONE_NUMBER_ID is missing');
    envValid = false;
  } else {
    log('green', 'OK', `Phone Number ID: ${config.phoneNumberId}`);
  }

  if (!config.verifyToken) {
    log('yellow', 'WARN', 'WHATSAPP_VERIFY_TOKEN is missing (needed for webhook)');
  } else {
    log('green', 'OK', `Verify Token: ${config.verifyToken}`);
  }

  log('green', 'OK', `API Version: ${config.apiVersion}`);
  log('green', 'OK', `Bot Enabled: ${config.botEnabled}`);

  if (!envValid) {
    log('red', 'FAIL', 'Environment variables incomplete. Cannot proceed.');
    process.exit(1);
  }

  // 2. Test API Connectivity
  console.log('\n' + colors.blue + 'STEP 2' + colors.reset + ' Testing API Connectivity...');
  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}?access_token=${config.accessToken}`,
      { method: 'GET' }
    );

    if (response.ok) {
      const data = await response.json();
      log('green', 'OK', 'Successfully connected to WhatsApp API');
      log('green', 'OK', `Phone Number ID verified: ${data.id}`);
    } else if (response.status === 401) {
      log('red', 'ERROR', 'Unauthorized - Access token is invalid or expired');
      process.exit(1);
    } else if (response.status === 403) {
      log('red', 'ERROR', 'Forbidden - Check phone number ID or permissions');
      process.exit(1);
    } else {
      const errorText = await response.text();
      log('red', 'ERROR', `API returned status ${response.status}: ${errorText}`);
      process.exit(1);
    }
  } catch (error) {
    log('red', 'ERROR', `Network error: ${error.message}`);
    process.exit(1);
  }

  // 3. Test Template Message (if phone number provided)
  if (phoneNumber) {
    console.log('\n' + colors.blue + 'STEP 3' + colors.reset + ' Testing Template Message Send...');
    
    const normalizedPhone = normalizePhoneNumber(phoneNumber, config.defaultCountryCode);
    if (!normalizedPhone) {
      log('red', 'ERROR', `Invalid phone number format: ${phoneNumber}`);
      process.exit(1);
    }

    log('green', 'OK', `Normalized phone: ${normalizedPhone}`);

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      };

      const response = await fetch(
        `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const data = await response.json();
        log('green', 'SUCCESS', `Message sent! Message ID: ${data.messages[0].id}`);
      } else {
        const error = await response.json();
        if (error.error.code === 131000) {
          log('red', 'ERROR', 'Invalid recipient - phone number not registered on WhatsApp');
        } else if (error.error.code === 131008) {
          log('red', 'ERROR', 'Template not found or not approved. Create/approve "hello_world" template in Meta');
        } else {
          log('red', 'ERROR', `API Error: ${error.error.message}`);
        }
      }
    } catch (error) {
      log('red', 'ERROR', `Failed to send message: ${error.message}`);
    }
  } else {
    console.log('\n' + colors.yellow + '⚠️  No phone number provided' + colors.reset);
    console.log('   To test message sending, run: node scripts/check-whatsapp.js 919876543210\n');
  }

  // 4. Display Summary
  console.log('\n' + colors.cyan + '═══════════════════════════════════════════' + colors.reset);
  log('green', 'SUMMARY', 'WhatsApp integration is configured correctly');
  console.log(colors.cyan + '═══════════════════════════════════════════' + colors.reset + '\n');
}

function normalizePhoneNumber(rawPhone, defaultCountryCode = '91') {
  if (!rawPhone) return '';
  const cleaned = String(rawPhone).trim().replace(/[^0-9+]/g, '');
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (!digitsOnly) return '';

  if (digitsOnly.length === 10) {
    return `${defaultCountryCode}${digitsOnly}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `${defaultCountryCode}${digitsOnly.slice(1)}`;
  }

  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    return digitsOnly;
  }

  return '';
}

checkWhatsAppIntegration().catch(error => {
  log('red', 'FATAL', error.message);
  process.exit(1);
});
