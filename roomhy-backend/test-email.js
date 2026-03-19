const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mailer = require('./utils/mailer');

// Test email send
async function testEmail() {
    try {
        await mailer.sendCredentials('test@example.com', 'TEST123', 'password123', 'Test');
        console.log('Test email sent successfully');
    } catch (err) {
        console.error('Test email failed:', err);
    }
}

testEmail();