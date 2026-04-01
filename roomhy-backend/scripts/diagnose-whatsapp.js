#!/usr/bin/env node

/**
 * WhatsApp Full Diagnostic Report
 * Run: node scripts/diagnose-whatsapp.js
 * Generates a detailed report for debugging
 */

require('dotenv').config();
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class WhatsAppDiagnostic {
  constructor() {
    this.report = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(type, title, message = '') {
    const timestamp = new Date().toISOString();
    const entry = { type, title, message, timestamp };
    this.report.push(entry);

    let icon = '  ';
    let color = 'reset';
    if (type === 'pass') {
      icon = '✓ ';
      color = 'green';
      this.passed++;
    } else if (type === 'fail') {
      icon = '✗ ';
      color = 'red';
      this.failed++;
    } else if (type === 'warn') {
      icon = '⚠ ';
      color = 'yellow';
    } else if (type === 'info') {
      icon = 'ℹ ';
      color = 'cyan';
    }

    console.log(`${colors[color]}${icon} ${title}${colors.reset}`);
    if (message) console.log(`${colors.gray}   ${message}${colors.reset}`);
  }

  async run() {
    console.log('\n' + colors.cyan + '╔════════════════════════════════════════════════╗' + colors.reset);
    console.log(colors.cyan + '║  WhatsApp Integration Diagnostic Report         ║' + colors.reset);
    console.log(colors.cyan + '╚════════════════════════════════════════════════╝' + colors.reset + '\n');

    await this.checkEnvironment();
    await this.checkConfiguration();
    await this.checkAPIConnectivity();
    await this.checkWebhookSetup();
    await this.generateReport();
  }

  async checkEnvironment() {
    console.log(colors.blue + '1. Environment Check' + colors.reset);
    
    const requiredVars = [
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_API_VERSION',
      'WHATSAPP_VERIFY_TOKEN'
    ];

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        const masked = value.slice(0, 10) + '***' + value.slice(-5);
        this.log('pass', varName, masked);
      } else {
        this.log('fail', varName, 'NOT SET');
      }
    });

    const optionalVars = [
      'WHATSAPP_DEFAULT_COUNTRY_CODE',
      'WHATSAPP_BOT_ENABLED',
      'WHATSAPP_BUSINESS_ACCOUNT_ID'
    ];

    optionalVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        this.log('pass', `${varName} (optional)`, value);
      }
    });

    console.log('');
  }

  async checkConfiguration() {
    console.log(colors.blue + '2. Configuration Validation' + colors.reset);

    const config = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
      botEnabled: process.env.WHATSAPP_BOT_ENABLED !== 'false'
    };

    // Check token format
    if (config.accessToken.startsWith('EAA')) {
      this.log('pass', 'Access Token Format', 'Valid (User token)');
    } else if (config.accessToken.startsWith('EA')) {
      this.log('warn', 'Access Token Format', 'May be a different token type');
    } else {
      this.log('fail', 'Access Token Format', 'Invalid format');
    }

    // Check phone number ID format (should be numeric)
    if (/^\d+$/.test(config.phoneNumberId)) {
      this.log('pass', 'Phone Number ID Format', 'Valid (numeric)');
    } else {
      this.log('fail', 'Phone Number ID Format', 'Should be numeric');
    }

    // Check API version
    if (config.apiVersion.match(/^v\d+\.\d+$/)) {
      this.log('pass', 'API Version Format', `${config.apiVersion} is valid`);
    } else {
      this.log('warn', 'API Version Format', `${config.apiVersion} - may be incorrect`);
    }

    // Check verify token
    if (config.verifyToken.length > 0) {
      this.log('pass', 'Verify Token', 'Set correctly');
    } else {
      this.log('warn', 'Verify Token', 'Not set - webhook verification will fail');
    }

    this.log('info', 'Bot Status', config.botEnabled ? 'Enabled' : 'Disabled');

    console.log('');
  }

  async checkAPIConnectivity() {
    console.log(colors.blue + '3. API Connectivity Tests' + colors.reset);

    const config = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0'
    };

    if (!config.accessToken || !config.phoneNumberId) {
      this.log('fail', 'Missing Credentials', 'Cannot test connectivity');
      console.log('');
      return;
    }

    try {
      // Test 1: Basic connectivity
      this.log('info', 'Connecting to Graph API...', 'https://graph.facebook.com');
      const response = await fetch(
        `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.log('pass', `Graph API Connection (${response.status})`, 'Successfully authenticated');
        this.log('info', 'Phone Number ID Verified', `${data.id || data.phone_number_id || 'confirmed'}`);
      } else if (response.status === 401) {
        this.log('fail', `Graph API Connection (${response.status})`, 'Token expired or invalid');
      } else if (response.status === 403) {
        this.log('fail', `Graph API Connection (${response.status})`, 'Permission denied - check phone ID');
      } else {
        this.log('fail', `Graph API Connection (${response.status})`, 'Unknown error');
      }
    } catch (error) {
      this.log('fail', 'Network Error', error.message);
    }

    console.log('');
  }

  async checkWebhookSetup() {
    console.log(colors.blue + '4. Webhook Configuration' + colors.reset);

    const backendUrl = process.env.BACKEND_URL || 'https://api.roomhy.com';
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';

    this.log('info', 'Expected Webhook URL', `${backendUrl}/api/whatsapp/webhook`);
    this.log('info', 'Webhook Verify Token', verifyToken ? `${verifyToken.slice(0, 10)}...` : 'NOT SET');

    const webhookPath = '/api/whatsapp/webhook';
    this.log('info', 'Route to Configure', webhookPath);

    console.log('\nTo set up webhook in Meta Business Manager:');
    console.log('  1. Go to App Settings > Webhooks');
    console.log(`  2. Callback URL: ${backendUrl}${webhookPath}`);
    console.log(`  3. Verify Token: ${verifyToken}`);
    console.log('  4. Subscribe to messages, message_template_status_update events\n');
  }

  generateReport() {
    console.log(colors.cyan + '════════════════════════════════════════════════' + colors.reset);
    console.log(colors.green + `✓ Tests Passed: ${this.passed}` + colors.reset);
    if (this.failed > 0) {
      console.log(colors.red + `✗ Tests Failed: ${this.failed}` + colors.reset);
    }
    console.log(colors.cyan + '════════════════════════════════════════════════' + colors.reset);

    // Save report to file
    const reportFile = 'whatsapp-diagnostic-report.json';
    fs.writeFileSync(reportFile, JSON.stringify(this.report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}\n`);

    if (this.failed > 0) {
      console.log(colors.yellow + '⚠️  Fix the issues above before deploying to production' + colors.reset + '\n');
      process.exit(1);
    }
  }
}

const diagnostic = new WhatsAppDiagnostic();
diagnostic.run().catch(error => {
  console.error(colors.red + 'Fatal Error:' + colors.reset, error.message);
  process.exit(1);
});
