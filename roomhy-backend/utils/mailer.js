const nodemailer = require('nodemailer');

// Read SMTP config from environment variables
const SMTP_HOST = process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : '');
const SMTP_PORT = process.env.SMTP_PORT || (process.env.GMAIL_USER ? '587' : '');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || (SMTP_USER || 'no-reply@roomhy.com');

let transporter = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: SMTP_SECURE,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    console.log('Mailer configured with SMTP:', SMTP_HOST, SMTP_PORT, SMTP_SECURE ? 'secure' : 'insecure');
} else {
    console.warn('Mailer not configured: missing SMTP env vars');
}

async function sendMail(to, subject, text, html) {
    if (!transporter) {
        console.warn('sendMail skipped because transporter is not configured');
        return false;
    }
    try {
        await transporter.sendMail({ from: FROM_EMAIL, to, subject, text, html });
        console.log('Email sent to', to, 'subject:', subject);
        return true;
    } catch (err) {
        console.error('Failed sending email to', to, err && err.message);
        return false;
    }
}

function credentialsHtml(loginId, password, role = 'Account') {
    return `<div style="font-family: Arial, Helvetica, sans-serif; font-size:14px; color:#111">
        <h3>${role} Credentials</h3>
        <p>Your account has been created. Use the credentials below to login:</p>
        <p><strong>Login ID:</strong> ${loginId}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p style="font-size:12px;color:#666">You can change your password after first login. If you did not request this, ignore.</p>
    </div>`;
}

async function sendCredentials(toEmail, loginId, password, role = 'Account') {
    if (!toEmail) return;
    const subject = `${role} credentials for RoomHy`;
    const html = credentialsHtml(loginId, password, role);
    const text = `Your ${role} credentials\nLogin ID: ${loginId}\nPassword: ${password}`;
    // Non-blocking caller can await if desired
    return sendMail(toEmail, subject, text, html);
}

module.exports = { sendCredentials, sendMail };
