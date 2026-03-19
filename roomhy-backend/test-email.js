const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mailer = require('./utils/mailer');

// Test email send
async function testEmail() {
    try {
        const recipient = (process.argv[2] || process.env.SMTP_USER || process.env.FROM_EMAIL || '').trim();
        if (!recipient) {
            throw new Error('Pass a recipient email: node test-email.js you@example.com');
        }

        const sent = await mailer.sendCredentials(recipient, 'TEST123', 'password123', 'Test');
        if (!sent) {
            throw new Error('Mailer returned false. Check SMTP/Mailjet logs above.');
        }

        console.log('Test email sent successfully to', recipient);
    } catch (err) {
        console.error('Test email failed:', err);
        process.exitCode = 1;
    }
}

testEmail();
