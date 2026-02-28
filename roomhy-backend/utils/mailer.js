const https = require('https');
const nodemailer = require('nodemailer');

function getMailerConfig() {
    return {
        mailjetApiKey: process.env.MAILJET_API_KEY || process.env.MJ_APIKEY_PUBLIC || '',
        mailjetSecretKey: process.env.MAILJET_SECRET_KEY || process.env.MJ_APIKEY_PRIVATE || '',
        mailjetEndpoint: process.env.MAILJET_ENDPOINT || 'https://api.mailjet.com/v3.1/send',
        fromEmail: process.env.MAILJET_FROM_EMAIL || process.env.FROM_EMAIL || 'no-reply@roomhy.com',
        fromName: process.env.MAILJET_FROM_NAME || process.env.FROM_NAME || 'RoomHy',
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: Number(process.env.SMTP_PORT || 587),
        smtpSecure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS || ''
    };
}

function isMailjetConfigured(cfg) {
    return Boolean(cfg.mailjetApiKey && cfg.mailjetSecretKey);
}

function isSmtpConfigured(cfg) {
    return Boolean(cfg.smtpHost && cfg.smtpUser && cfg.smtpPass);
}

function normalizeRecipients(to) {
    if (!to) return [];
    if (Array.isArray(to)) {
        return to
            .map((x) => (x || '').toString().trim())
            .filter(Boolean)
            .map((email) => ({ Email: email }));
    }
    return to
        .toString()
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((email) => ({ Email: email }));
}

function postJson(urlString, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const payload = JSON.stringify(body);
        const req = https.request(
            {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port || 443,
                path: `${url.pathname}${url.search}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    ...headers
                }
            },
            (res) => {
                const chunks = [];
                res.on('data', (d) => chunks.push(d));
                res.on('end', () => {
                    resolve({
                        status: res.statusCode || 500,
                        body: Buffer.concat(chunks).toString('utf8')
                    });
                });
            }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function sendMail(to, subject, text, html) {
    const cfg = getMailerConfig();
    const recipients = normalizeRecipients(to);
    if (!recipients.length) {
        console.warn('sendMail skipped: no valid recipients');
        return false;
    }

    // Prefer SMTP when configured (stable for your current setup), then fallback to Mailjet.
    if (isSmtpConfigured(cfg)) {
        try {
            const transporter = nodemailer.createTransport({
                host: cfg.smtpHost,
                port: cfg.smtpPort,
                secure: cfg.smtpSecure,
                auth: {
                    user: cfg.smtpUser,
                    pass: cfg.smtpPass
                }
            });

            await transporter.sendMail({
                from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
                to: recipients.map((x) => x.Email).join(', '),
                subject: subject || 'RoomHy Notification',
                text: text || '',
                html: html || ''
            });

            console.log('Email sent via SMTP to', recipients.map((x) => x.Email).join(', '), 'subject:', subject);
            return true;
        } catch (err) {
            console.error('Failed sending email via SMTP:', err && err.message);
        }
    }

    if (isMailjetConfigured(cfg)) {
        try {
            const auth = Buffer.from(`${cfg.mailjetApiKey}:${cfg.mailjetSecretKey}`).toString('base64');
            const payload = {
                Messages: [
                    {
                        From: { Email: cfg.fromEmail, Name: cfg.fromName },
                        To: recipients,
                        Subject: subject || 'RoomHy Notification',
                        TextPart: text || '',
                        HTMLPart: html || ''
                    }
                ]
            };

            const response = await postJson(cfg.mailjetEndpoint, payload, {
                Authorization: `Basic ${auth}`
            });

            if (response.status >= 200 && response.status < 300) {
                console.log('Email sent via Mailjet to', recipients.map((x) => x.Email).join(', '), 'subject:', subject);
                return true;
            }

            console.error('Mailjet send failed:', response.status, response.body);
        } catch (err) {
            console.error('Failed sending email via Mailjet:', err && err.message);
        }
    }

    console.warn('sendMail skipped: no mail provider configured (set Mailjet or SMTP env values)');
    return false;
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
