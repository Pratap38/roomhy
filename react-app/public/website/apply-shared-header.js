#!/usr/bin/env node

/**
 * Batch update script to apply shared-header.js to all website pages
 * This adds the shared header, notification system, and removes old header markup
 * 
 * Usage: node apply-shared-header.js
 */

const fs = require('fs');
const path = require('path');

const WEBSITE_DIR = path.join(__dirname);
const PAGES = [
    'mystays',
    'fav',
    'websitechat',
    'property',
    'about',
    'contact',
    'profile',
    'booking',
    'login',
    'signup'
];

const HEADER_SCRIPTS = `    <!-- Shared Header and Notifications -->
    <script src="./js/shared-header.js"></script>
    <script src="./js/notification-system.js"></script>`;

function addScriptsToHead(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // Check if already has shared-header
        if (content.includes('shared-header.js')) {
            console.log(`✅ ${path.basename(filePath)} already has shared header`);
            return true;
        }

        // Add scripts before closing </head>
        const headClosingIndex = content.indexOf('</head>');
        if (headClosingIndex === -1) {
            console.log(`⚠️  ${path.basename(filePath)} - no closing </head> found`);
            return false;
        }

        const newContent = content.slice(0, headClosingIndex) + 
                          '\n' + HEADER_SCRIPTS + '\n' +
                          content.slice(headClosingIndex);

        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ Updated ${path.basename(filePath)}`);
        return true;
    } catch (err) {
        console.error(`❌ Error processing ${path.basename(filePath)}:`, err.message);
        return false;
    }
}

console.log('🚀 Applying shared header to all website pages...\n');

let successCount = 0;
for (const page of PAGES) {
    const filePath = path.join(WEBSITE_DIR, page);
    if (fs.existsSync(filePath)) {
        if (addScriptsToHead(filePath)) {
            successCount++;
        }
    } else {
        console.log(`⏭️  ${page} not found, skipping`);
    }
}

console.log(`\n✅ Successfully updated ${successCount}/${PAGES.length} pages`);
console.log('\n📝 Next steps:');
console.log('1. Remove old <header> markup from each page');
console.log('2. Test navigation between pages');
console.log('3. Test notification system');
console.log('4. Configure SMTP in .env for email notifications');

