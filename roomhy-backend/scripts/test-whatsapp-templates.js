// test-whatsapp-templates.js
// WhatsApp Template Testing & Verification Script
// Run after all templates are APPROVED

const fs = require('fs');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Template test configurations
const templateTests = [
  {
    id: 1,
    name: 'welcome_main_menu',
    type: 'button',
    body: 'Welcome to {{business_name}} WhatsApp Bot.\nChoose one option below.',
    buttons: ['Signup', 'Login', 'Support'],
    variables: { business_name: 'RoomHy' },
    description: 'Main menu with authentication and support options'
  },
  {
    id: 2,
    name: 'signup_link',
    type: 'text',
    body: 'Signup here:\n{{website_url}}/website/signup?mode=signup\n\nAfter signup is complete, reply with "done" or "menu".',
    variables: { website_url: 'https://roomhy.com' },
    description: 'Send signup link to new users'
  },
  {
    id: 3,
    name: 'login_link',
    type: 'text',
    body: 'Login here:\n{{website_url}}/website/signup?mode=login\n\nAfter login is complete, reply with "done" or "menu".',
    variables: { website_url: 'https://roomhy.com' },
    description: 'Send login link to existing users'
  },
  {
    id: 4,
    name: 'city_selection_prompt',
    type: 'text',
    body: 'Select a city by replying with the number or city name.\n\n{{city_list}}',
    variables: { 
      city_list: '1. Bangalore, Karnataka\n2. Kota, Rajasthan\n3. Indore, Madhya Pradesh\n4. Delhi, Delhi'
    },
    description: 'Prompt user to select city for property search'
  },
  {
    id: 5,
    name: 'area_selection_prompt',
    type: 'text',
    body: 'Selected city: {{city_name}}\nNow reply with the area number or name.\n\n{{area_list}}',
    variables: {
      city_name: 'Bangalore',
      area_list: '1. Koramangala\n2. Whitefield\n3. Indiranagar'
    },
    description: 'Prompt user to select area after city selection'
  },
  {
    id: 6,
    name: 'property_results',
    type: 'text',
    body: 'Properties in {{area_name}}, {{city_name}}:\n\n{{property_list}}\n\nMore in this city: {{website_url}}/website/ourproperty',
    variables: {
      area_name: 'Koramangala',
      city_name: 'Bangalore',
      property_list: '1. The Hive\nRent: INR 18,000\nhttps://roomhy.com/website/property?id=123\n\n2. Prime Properties\nRent: INR 15,000\nhttps://roomhy.com/website/property?id=456',
      website_url: 'https://roomhy.com'
    },
    description: 'Display properties for selected area'
  },
  {
    id: 7,
    name: 'booking_confirmed_menu',
    type: 'button',
    body: 'Booking confirmed for {{property_name}}.\nChoose refund or alternative property.\n\nSaved preference: {{area_name}}, {{city_name}}\nYou can reply "alternative" any time to get matching property links in that area.',
    buttons: ['Refund', 'Alternative', 'Main Menu'],
    variables: {
      property_name: 'The Hive',
      area_name: 'Koramangala',
      city_name: 'Bangalore'
    },
    description: 'Post-booking options menu'
  },
  {
    id: 8,
    name: 'refund_request_link',
    type: 'text',
    body: 'Refund request link:\n{{website_url}}/website/refund-request\n\nIf your booking is already visible in My Stays, you can also raise refund from there.\n\nNeed help? Contact: {{support_email}}',
    variables: {
      website_url: 'https://roomhy.com',
      support_email: 'support@roomhy.com'
    },
    description: 'Send refund request form link'
  },
  {
    id: 12,
    name: 'support_menu',
    type: 'button',
    body: 'RoomHy support\nSelect owner or tenant support.',
    buttons: ['Owner Help', 'Tenant Help', 'Main Menu'],
    variables: {},
    description: 'Support submenu for role-based help'
  },
  {
    id: 13,
    name: 'owner_support',
    type: 'text',
    body: 'Owner support\n\nOwner panel login: {{app_url}}/propertyowner/ownerlogin\nPhone: {{support_phone}}\nEmail: {{support_email}}\n\nNeed help with listings, payments, or tenant management? We\'re here to help!',
    variables: {
      app_url: 'https://app.roomhy.com',
      support_phone: '+91-7413040868',
      support_email: 'support@roomhy.com'
    },
    description: 'Owner-specific support information'
  },
  {
    id: 14,
    name: 'tenant_support',
    type: 'text',
    body: 'Tenant support\n\nWebsite login/signup: {{website_url}}/website/signup?mode=login\nMy stays: {{website_url}}/website/mystays\nPhone: {{support_phone}}\nEmail: {{support_email}}\n\nCheck your bookings, raise refunds, and chat with property owners from My Stays!',
    variables: {
      website_url: 'https://roomhy.com',
      support_phone: '+91-7413040868',
      support_email: 'support@roomhy.com'
    },
    description: 'Tenant-specific support information'
  }
];

// Verification functions
function validateTemplateStructure(template) {
  const issues = [];
  
  // Check required fields
  if (!template.name) issues.push('Missing template name');
  if (!template.body) issues.push('Missing body text');
  if (!['text', 'button', 'image', 'document'].includes(template.type)) {
    issues.push(`Invalid type: ${template.type}`);
  }
  
  // Check for variables syntax
  const variablePattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  const foundVariables = [];
  let match;
  while ((match = variablePattern.exec(template.body)) !== null) {
    foundVariables.push(match[1]);
  }
  
  // Check button templates
  if (template.type === 'button') {
    if (!template.buttons || template.buttons.length === 0) {
      issues.push('Button template must have buttons');
    }
    if (template.buttons && template.buttons.some(b => b.length > 20)) {
      issues.push('Button text exceeds 20 characters');
    }
  }
  
  // Check variables are provided
  if (foundVariables.length > 0) {
    const providedVars = Object.keys(template.variables || {});
    const missingVars = foundVariables.filter(v => !providedVars.includes(v));
    if (missingVars.length > 0) {
      issues.push(`Missing variable values: ${missingVars.join(', ')}`);
    }
  }
  
  // Check body length
  if (template.body.length > 3900) {
    issues.push(`Body exceeds 3900 characters (actual: ${template.body.length})`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    variables: foundVariables
  };
}

function renderTemplate(template) {
  let rendered = template.body;
  
  for (const [key, value] of Object.entries(template.variables || {})) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  }
  
  return rendered;
}

function formatOutput(text, width = 80) {
  const lines = text.split('\n');
  return lines.map(line => {
    if (line.length <= width) return line;
    const chunks = [];
    for (let i = 0; i < line.length; i += width) {
      chunks.push(line.substring(i, i + width));
    }
    return chunks.join('\n');
  }).join('\n');
}

// Main test runner
function runTests() {
  log('blue', '\n╔════════════════════════════════════════════════════════════════════╗');
  log('blue', '║     WhatsApp Template Testing & Verification Suite                   ║');
  log('blue', '╚════════════════════════════════════════════════════════════════════╝\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const results = [];
  
  for (const template of templateTests) {
    totalTests++;
    log('cyan', `\n[${template.id}] ${template.name}`);
    log('yellow', `Type: ${template.type}`);
    log('yellow', `Description: ${template.description}`);
    
    // Validate structure
    const validation = validateTemplateStructure(template);
    
    if (validation.valid) {
      log('green', '✓ Structure validation: PASSED');
      passedTests++;
      results.push({ id: template.id, name: template.name, status: 'PASSED' });
    } else {
      log('red', '✗ Structure validation: FAILED');
      validation.issues.forEach(issue => {
        log('red', `  - ${issue}`);
      });
      failedTests++;
      results.push({ 
        id: template.id, 
        name: template.name, 
        status: 'FAILED',
        errors: validation.issues 
      });
      continue;
    }
    
    // Show variables found
    if (validation.variables.length > 0) {
      log('yellow', `  Variables: ${validation.variables.join(', ')}`);
    }
    
    // Render and display
    log('cyan', '\nRendered Output:');
    const rendered = renderTemplate(template);
    const formatted = formatOutput(rendered);
    console.log('─'.repeat(80));
    console.log(formatted);
    console.log('─'.repeat(80));
    
    // Button template specific checks
    if (template.type === 'button') {
      log('cyan', '\nButtons:');
      template.buttons.forEach((btn, idx) => {
        log('yellow', `  ${idx + 1}. "${btn}" (${btn.length} chars)`);
      });
    }
  }
  
  // Final report
  log('blue', '\n╔════════════════════════════════════════════════════════════════════╗');
  log('blue', '║                         Test Results Summary                         ║');
  log('blue', '╚════════════════════════════════════════════════════════════════════╝\n');
  
  log('yellow', `Total Templates: ${totalTests}`);
  log('green', `Passed: ${passedTests}`);
  log(failedTests > 0 ? 'red' : 'green', `Failed: ${failedTests}`);
  
  if (failedTests > 0) {
    log('red', '\n⚠️  Failed Templates:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
      log('red', `  [${r.id}] ${r.name}`);
      if (r.errors) {
        r.errors.forEach(e => log('red', `    - ${e}`));
      }
    });
  } else {
    log('green', '\n✅ All templates passed validation!');
  }
  
  // Export results
  const reportPath = 'template-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    totalTests,
    passedTests,
    failedTests,
    results
  }, null, 2));
  
  log('blue', `\n📄 Test report saved to: ${reportPath}`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = {
  validateTemplateStructure,
  renderTemplate,
  formatOutput,
  templateTests
};
