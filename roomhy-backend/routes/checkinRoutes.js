const express = require('express');
const router = express.Router();
const CheckinRecord = require('../models/CheckinRecord');
const Owner = require('../models/Owner');
const Tenant = require('../models/Tenant');
const { sendMail } = require('../utils/mailer');
const { otpLimiter } = require('../middleware/security');
const { requestAadhaarOtp, verifyAadhaarOtp } = require('../services/cashfreeKycService');
const {
    verifyDigilockerAccount,
    createDigilockerUrl,
    getDigilockerVerificationStatus,
    getDigilockerDocument
} = require('../services/cashfreeDigilockerService');
const {
    createOwnerAgreementRequest,
    createTenantAgreementRequest
} = require('../services/zohoSignService');

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://roomhy.com';
const ADMIN_URL = process.env.ADMIN_URL || process.env.FRONTEND_URL || 'https://admin.roomhy.com';
const APP_URL = process.env.APP_URL || process.env.APP_BASE_URL || process.env.WEB_APP_URL || 'https://app.roomhy.com';
const DIGITAL_CHECKIN_URL = process.env.DIGITAL_CHECKIN_URL || ADMIN_URL;
const BACKEND_URL = process.env.BACKEND_URL || process.env.API_BASE_URL || 'https://api.roomhy.com';

const otpStore = new Map();

function keyFor(role, loginId, aadhaarNumber) {
    return `${role}:${String(loginId || '').toUpperCase()}:${String(aadhaarNumber || '')}`;
}

function ensureRole(role) {
    return role === 'owner' || role === 'tenant';
}

async function upsertRecord(loginId, role, update) {
    return CheckinRecord.findOneAndUpdate(
        { loginId: String(loginId || '').toUpperCase(), role },
        { $set: update, $setOnInsert: { loginId: String(loginId || '').toUpperCase(), role } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
}

function createDigilockerRef(loginId) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `DL-${String(loginId || '').toUpperCase()}-${Date.now()}-${suffix}`;
}

function isOwnerKycVerified(record) {
    return Boolean(record?.ownerKyc?.otpVerified || record?.ownerKyc?.digilockerVerified);
}

function isTenantKycVerified(record) {
    return Boolean(record?.tenantKyc?.otpVerified || record?.tenantKyc?.digilockerVerified);
}

function extractAadhaarNumber(value) {
    if (!value) return '';
    if (typeof value === 'string') {
        const digits = value.replace(/\D/g, '');
        return digits.length === 12 ? digits : '';
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const extracted = extractAadhaarNumber(item);
            if (extracted) return extracted;
        }
        return '';
    }
    if (typeof value === 'object') {
        const keys = [
            'aadhaar_number',
            'aadhaarNumber',
            'aadhar_number',
            'aadharNumber',
            'document_number',
            'documentNumber',
            'id_number',
            'idNumber',
            'uid',
            'number',
            'value'
        ];
        for (const key of keys) {
            const extracted = extractAadhaarNumber(value[key]);
            if (extracted) return extracted;
        }
        for (const nested of Object.values(value)) {
            const extracted = extractAadhaarNumber(nested);
            if (extracted) return extracted;
        }
    }
    return '';
}

function buildOwnerLoginEmail(owner, dashboardUrl) {
    return `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <div style="background:#1d4ed8;color:#fff;padding:18px 20px;">
                <h2 style="margin:0;font-size:20px;">RoomHy Owner Login Ready</h2>
            </div>
            <div style="padding:18px 20px;color:#111827;line-height:1.55;">
                <p style="margin-top:0;">Your owner profile, DigiLocker Aadhaar verification, and agreement signing are complete.</p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin:14px 0;">
                    <p style="margin:0 0 8px;"><strong>Login ID:</strong> ${owner.loginId || '-'}</p>
                    <p style="margin:0 0 8px;"><strong>Password:</strong> ${owner.checkinPassword || owner.credentials?.password || '-'}</p>
                    <p style="margin:0;"><strong>Email:</strong> ${owner.email || '-'}</p>
                </div>
                <p style="margin:14px 0 18px;">
                    <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:700;">Open Owner Login</a>
                </p>
                <p style="font-size:12px;color:#6b7280;">If button does not work, copy this link: ${dashboardUrl}</p>
            </div>
        </div>
    `;
}

function buildTenantLoginEmail(tenant, dashboardUrl) {
    return `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <div style="background:#16a34a;color:#fff;padding:16px 20px;">
                <h2 style="margin:0;font-size:20px;">RoomHy Tenant Check-in Completed</h2>
            </div>
            <div style="padding:18px 20px;color:#111827;line-height:1.55;">
                <p style="margin-top:0;">Your tenant digital check-in and rental agreement signing are complete.</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin:14px 0;">
                    <p style="margin:0 0 8px;"><strong>Login ID:</strong> ${tenant.loginId || '-'}</p>
                    <p style="margin:0 0 8px;"><strong>Email:</strong> ${tenant.email || '-'}</p>
                    <p style="margin:0;"><strong>Property:</strong> ${tenant.propertyTitle || '-'}</p>
                </div>
                <p style="margin:14px 0 18px;">
                    <a href="${dashboardUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:700;">Open Tenant Login</a>
                </p>
                <p style="font-size:12px;color:#6b7280;">If button does not work, copy this link: ${dashboardUrl}</p>
            </div>
        </div>
    `;
}

async function completeOwnerCheckinAndNotify(loginId) {
    const normalizedLoginId = String(loginId || '').toUpperCase();
    const record = await CheckinRecord.findOne({ loginId: normalizedLoginId, role: 'owner' });
    if (!record) throw new Error('Owner check-in record not found');

    const owner = await Owner.findOne({ loginId: normalizedLoginId });
    if (!owner) throw new Error('Owner not found');

    record.ownerFinalVerified = true;
    record.ownerSubmittedAt = new Date();
    record.ownerAgreement = {
        ...(record.ownerAgreement || {}),
        provider: record.ownerAgreement?.provider || 'owner-terms',
        status: record.ownerAgreement?.status || 'accepted_terms',
        completedAt: record.ownerAgreement?.completedAt || new Date()
    };
    await record.save();

    owner.agreementStatus = owner.agreementStatus || 'accepted_terms';
    owner.isActive = true;
    owner.kyc = owner.kyc || {};
    owner.kyc.status = owner.kyc.status || 'submitted';
    await owner.save();

    const dashboardUrl = `${APP_URL}/propertyowner/index`;
    let loginEmailSent = false;
    if (owner.email) {
        try {
            await sendMail(owner.email, 'RoomHy Owner Login Link', '', buildOwnerLoginEmail(owner, dashboardUrl));
            loginEmailSent = true;
        } catch (emailErr) {
            console.error('[OWNER CHECKIN COMPLETE] Email send error:', emailErr.message);
        }
    }

    return { record, owner, dashboardUrl, loginEmailSent };
}

async function completeOwnerAgreementAndNotify(loginId, { requestId = '', provider = '', callbackPayload = null } = {}) {
    const normalizedLoginId = String(loginId || '').toUpperCase();
    const record = await CheckinRecord.findOne({ loginId: normalizedLoginId, role: 'owner' });
    if (!record) throw new Error('Owner check-in record not found');

    const owner = await Owner.findOne({ loginId: normalizedLoginId });
    if (!owner) throw new Error('Owner not found');

    record.ownerAgreement = {
        ...(record.ownerAgreement || {}),
        provider: provider || record.ownerAgreement?.provider || 'zoho-sign',
        requestId: requestId || record.ownerAgreement?.requestId || '',
        status: 'signed',
        signedAt: new Date(),
        completedAt: new Date(),
        callbackPayload: callbackPayload || record.ownerAgreement?.callbackPayload || null
    };
    record.ownerFinalVerified = true;
    record.ownerSubmittedAt = new Date();
    await record.save();

    owner.agreementRequestId = requestId || owner.agreementRequestId || '';
    owner.agreementStatus = 'signed';
    owner.agreementSignedAt = new Date();
    owner.isActive = true;
    owner.kyc = owner.kyc || {};
    owner.kyc.status = owner.kyc.status || 'submitted';
    await owner.save();

    const dashboardUrl = `${APP_URL}/propertyowner/index`;
    let loginEmailSent = false;
    if (owner.email) {
        try {
            await sendMail(owner.email, 'RoomHy Owner Login Link', '', buildOwnerLoginEmail(owner, dashboardUrl));
            loginEmailSent = true;
        } catch (emailErr) {
            console.error('[OWNER AGREEMENT COMPLETE] Email send error:', emailErr.message);
        }
    }

    return { record, owner, dashboardUrl, loginEmailSent };
}

async function completeTenantAgreementAndNotify(loginId, { requestId = '', provider = '', callbackPayload = null } = {}) {
    const normalizedLoginId = String(loginId || '').toUpperCase();
    const record = await CheckinRecord.findOne({ loginId: normalizedLoginId, role: 'tenant' });
    if (!record) throw new Error('Tenant check-in record not found');

    const tenant = await Tenant.findOne({ loginId: normalizedLoginId });
    if (!tenant) throw new Error('Tenant not found');

    record.tenantAgreement = {
        ...(record.tenantAgreement || {}),
        provider: provider || record.tenantAgreement?.provider || 'zoho-sign',
        requestId: requestId || record.tenantAgreement?.requestId || '',
        status: 'signed',
        signedAt: new Date(),
        completedAt: new Date(),
        callbackPayload: callbackPayload || record.tenantAgreement?.callbackPayload || null
    };
    record.tenantSubmittedAt = new Date();
    await record.save();

    tenant.agreementSigned = true;
    tenant.agreementSignedAt = new Date();
    tenant.agreementRequestId = requestId || tenant.agreementRequestId || '';
    tenant.agreementStatus = 'signed';
    tenant.digitalCheckin = tenant.digitalCheckin || {};
    tenant.digitalCheckin.agreement = {
        ...(tenant.digitalCheckin.agreement || {}),
        acceptedAt: tenant.digitalCheckin.agreement?.acceptedAt || record.tenantAgreement?.acceptedAt || new Date(),
        eSignName: tenant.agreementESignName || record.tenantAgreement?.eSignName || tenant.name || ''
    };
    tenant.digitalCheckin.submittedAt = new Date();
    tenant.status = 'active';
    tenant.kycStatus = tenant.kycStatus || 'submitted';
    tenant.updatedAt = new Date();
    await tenant.save();

    const dashboardUrl = `${APP_URL}/tenant/tenantdashboard`;
    const tenantLoginUrl = `${APP_URL}/tenant/tenantlogin`;
    let loginEmailSent = false;
    if (tenant.email) {
        try {
            await sendMail(tenant.email, 'RoomHy Tenant Login Link', '', buildTenantLoginEmail(tenant, dashboardUrl));
            loginEmailSent = true;
        } catch (emailErr) {
            console.error('[TENANT AGREEMENT COMPLETE] Email send error:', emailErr.message);
        }
    }

    return { record, tenant, dashboardUrl, tenantLoginUrl, loginEmailSent };
}

router.post('/owner/profile', async (req, res) => {
    try {
        const { loginId, name, dob, email, phone, address, area, password, payment = {} } = req.body || {};
        if (!loginId || !name || !dob || !email || !phone || !address || !area || !payment.bankAccountNumber || !payment.ifscCode || !payment.accountHolderName) {
            return res.status(400).json({ success: false, message: 'Missing required owner profile fields' });
        }
        const record = await upsertRecord(loginId, 'owner', {
            ownerProfile: { name, dob, email, phone, address, area, password, payment }
        });

        // Mirror to Owner collection so superadmin owner list can show this data
        const existingOwner = await Owner.findOne({ loginId: String(loginId).toUpperCase() }).lean();
        const existingProfile = existingOwner?.profile || {};
        
        const updatedOwner = await Owner.findOneAndUpdate(
            { loginId: String(loginId).toUpperCase() },
            {
                $set: {
                    loginId: String(loginId).toUpperCase(),
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    locationCode: area,
                    profileFilled: true,
                    // Store with "checkin" prefix for frontend display
                    checkinDob: dob,
                    checkinPhone: phone,
                    checkinAddress: address,
                    checkinArea: area,
                    checkinPassword: password || '',
                    checkinAccountHolderName: payment.accountHolderName || '',
                    checkinBankAccountNumber: payment.bankAccountNumber || '',
                    checkinIfscCode: payment.ifscCode || '',
                    checkinBankName: payment.bankName || '',
                    checkinBranchName: payment.branchName || '',
                    checkinUpiId: payment.upiId || '',
                    checkinCancelledCheque: payment.cancelledCheque || {},
                    // Also set top-level fields for backward compatibility
                    accountNumber: payment.bankAccountNumber || '',
                    ifscCode: payment.ifscCode || '',
                    bankName: payment.bankName || '',
                    branchName: payment.branchName || '',
                    profile: {
                        ...existingProfile,
                        name,
                        email,
                        phone,
                        address,
                        locationCode: area,
                        accountNumber: payment.bankAccountNumber || '',
                        ifscCode: payment.ifscCode || '',
                        bankName: payment.bankName || '',
                        branchName: payment.branchName || '',
                        accountHolderName: payment.accountHolderName || '',
                        upiId: payment.upiId || ''
                    },
                    credentials: {
                        password: password || (existingOwner?.credentials && existingOwner.credentials.password) || '',
                        firstTime: true
                    }
                },
                $setOnInsert: {
                    kyc: { status: 'pending' }
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.json({ success: true, record, owner: updatedOwner });
    } catch (err) {
        console.error('owner/profile error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/owner/kyc/send-otp', otpLimiter, async (req, res) => {
    try {
        const { loginId, aadhaarLinkedPhone, aadhaarNumber, email } = req.body || {};
        console.log('[CHECKIN KYC] Received send-otp request:', { loginId, aadhaarLinkedPhone, aadhaarNumber, email });
        
        if (!loginId || !aadhaarLinkedPhone || !aadhaarNumber) {
            console.log('[CHECKIN KYC] Missing fields - loginId:', !!loginId, 'phone:', !!aadhaarLinkedPhone, 'aadhaar:', !!aadhaarNumber);
            return res.status(400).json({ success: false, message: 'Missing KYC fields' });
        }
        
        // Validate Aadhaar format (12 digits)
        if (!/^\d{12}$/.test(aadhaarNumber)) {
            console.log('[CHECKIN KYC] Invalid aadhaar format:', aadhaarNumber, 'length:', aadhaarNumber.length);
            return res.status(400).json({ success: false, message: 'Aadhaar must be 12 digits' });
        }

        await upsertRecord(loginId, 'owner', {
            ownerKyc: { aadhaarLinkedPhone, aadhaarNumber, otpVerified: false }
        });

        // Get owner details including email
        let owner = await Owner.findOne({ loginId: String(loginId).toUpperCase() }).lean();

        // Fallback: if email is missing in DB but provided by frontend, backfill it.
        if ((!owner || !owner.email) && email) {
            owner = await Owner.findOneAndUpdate(
                { loginId: String(loginId).toUpperCase() },
                { $set: { email: String(email).trim() } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).lean();
        }

        if (!owner || !owner.email) {
            return res.status(400).json({ success: false, message: 'Owner email not found. Complete profile first.' });
        }

        // Update Owner model with Aadhaar info and checkin fields
        await Owner.findOneAndUpdate(
            { loginId: String(loginId).toUpperCase() },
            {
                $set: {
                    loginId: String(loginId).toUpperCase(),
                    // Store with "checkin" prefix for frontend display
                    checkinAadhaarLinkedPhone: aadhaarLinkedPhone,
                    checkinAadhaarNumber: aadhaarNumber,
                    kyc: {
                        aadharNumber: aadhaarNumber,
                        aadhaarLinkedPhone: aadhaarLinkedPhone,
                        status: 'pending'
                    }
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const { referenceId, raw } = await requestAadhaarOtp(aadhaarNumber);
        const k = keyFor('owner', loginId, aadhaarNumber);
        otpStore.set(k, { referenceId, expiresAt: Date.now() + 10 * 60 * 1000 });

        return res.json({
            success: true,
            message: 'OTP sent to Aadhaar linked mobile number',
            provider: 'cashfree',
            mockOtp: raw?.mockOtp || undefined
        });
    } catch (err) {
        console.error('owner/kyc/send-otp error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/owner/kyc/verify-otp', otpLimiter, async (req, res) => {
    try {
        const { loginId, aadhaarNumber, otp } = req.body || {};
        const k = keyFor('owner', loginId, aadhaarNumber);
        const entry = otpStore.get(k);
        if (!entry || Date.now() > entry.expiresAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        await verifyAadhaarOtp(entry.referenceId, otp);
        otpStore.delete(k);
        
        const record = await upsertRecord(loginId, 'owner', { 'ownerKyc.otpVerified': true });
        
        // Get owner details
        const owner = await Owner.findOne({ loginId: String(loginId).toUpperCase() }).lean();
        
        const updatedOwner = await Owner.findOneAndUpdate(
            { loginId: String(loginId).toUpperCase() },
            { $set: { 'kyc.status': 'submitted', 'kyc.submittedAt': new Date() } },
            { new: true }
        );

        return res.json({
            success: true,
            record,
            owner: updatedOwner,
            message: owner?.email
                ? 'OTP verified successfully. Continue to owner terms acceptance.'
                : 'OTP verified successfully.'
        });

        // Send login credentials email
        if (owner && owner.email) {
            const baseUrl = APP_URL;
            const ownerPassword = owner.checkinPassword || owner.credentials?.password || 'default';
            const fullLoginUrl = `${baseUrl}/propertyowner/index`;
            
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                        .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .header h1 { margin: 0; font-size: 28px; }
                        .content { padding: 30px; background: #f8fafc; }
                        .credentials { background: white; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
                        .credentials p { margin: 8px 0; }
                        .label { font-weight: bold; color: #333; }
                        .value { font-family: monospace; color: #2563eb; }
                        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 15px; font-weight: bold; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                        .success { color: #4caf50; font-weight: bold; font-size: 18px; margin-bottom: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✓ KYC Verified Successfully!</h1>
                        </div>
                        <div class="content">
                            <p>Hi <strong>${owner.name || 'Owner'}</strong>,</p>
                            
                            <div class="success">🎉 Your Aadhaar verification is complete!</div>
                            
                            <p>Your RoomHy owner account has been activated. You can now log in to manage your properties and respond to tenant inquiries.</p>
                            
                            <div class="credentials">
                                <p><span class="label">Login ID:</span> <span class="value">${owner.loginId}</span></p>
                                <p><span class="label">Password:</span> <span class="value">${owner.checkinPassword || owner.credentials?.password || '[Set during registration]'}</span></p>
                                <p><span class="label">Email:</span> <span class="value">${owner.email}</span></p>
                                <p><span class="label">Area:</span> <span class="value">${owner.checkinArea || '-'}</span></p>
                            </div>

                            <p style="color: #d32f2f; font-weight: bold;">⚠️ Important:</p>
                            <ul>
                                <li>Keep your login credentials secure</li>
                                <li>You can change your password after first login</li>
                                <li>For security, sign out from shared devices</li>
                            </ul>

                            <p style="margin-top: 20px;">
                                <a href="${fullLoginUrl}" class="button">🔓 Go to Owner Dashboard</a>
                            </p>

                            <p style="margin-top: 20px; font-size: 12px;">
                                Or copy and paste this link in your browser:<br>
                                <span class="value">${fullLoginUrl}</span>
                            </p>

                            <p>What's next?</p>
                            <ol>
                                <li>Log in to your owner dashboard</li>
                                <li>Add your property details</li>
                                <li>Complete bank account verification</li>
                                <li>Start receiving tenant inquiries!</li>
                            </ol>

                            <p>If you have any questions or need support, contact us at <strong>support@roomhy.com</strong></p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 RoomHy Owner Platform. All rights reserved.</p>
                            <p>Made with ❤️ for property owners in India</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            try {
                await sendMail(owner.email, '✓ Welcome to RoomHy Owner Platform - Your login details', '', emailHtml);
                console.log('[CHECKIN KYC] Sent login email to:', owner.email);
            } catch (emailErr) {
                console.error('[CHECKIN KYC] Email send error:', emailErr.message);
            }
        }

        return res.json({ success: true, record, owner: updatedOwner, message: 'OTP verified. Check your email for login details.' });
    } catch (err) {
        console.error('owner/kyc/verify-otp error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/owner/kyc/digilocker/start', otpLimiter, async (req, res) => {
    try {
        const { loginId, aadhaarLinkedPhone, aadhaarNumber, email, redirectUrl: clientRedirectUrl } = req.body || {};
        if (!loginId || !aadhaarNumber) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (!/^\d{12}$/.test(String(aadhaarNumber))) {
            return res.status(400).json({ success: false, message: 'Aadhaar must be 12 digits' });
        }

        const ref = createDigilockerRef(loginId);
        const redirectUrl = clientRedirectUrl || process.env.DIGILOCKER_REDIRECT_URL || `${DIGITAL_CHECKIN_URL}/digital-checkin/ownerkyc`;

        const accountCheck = await verifyDigilockerAccount({
            verificationId: ref,
            mobileNumber: aadhaarLinkedPhone,
            aadhaarNumber
        });
        const userFlow = accountCheck?.account_exists ? 'signin' : 'signup';
        const digilockerInit = await createDigilockerUrl({
            verificationId: ref,
            redirectUrl,
            userFlow,
            documents: ['AADHAAR']
        });

        const cashfreeVerificationId = digilockerInit?.verification_id || ref;
        const cashfreeReferenceId = digilockerInit?.reference_id || digilockerInit?.ref_id || '';
        const verifyUrl = digilockerInit?.url || digilockerInit?.verification_url || digilockerInit?.link || '';

        await upsertRecord(loginId, 'owner', {
            ownerKyc: {
                aadhaarLinkedPhone: aadhaarLinkedPhone || '',
                aadhaarNumber: String(aadhaarNumber),
                otpVerified: false,
                digilockerVerified: false,
                digilockerStatus: 'pending',
                digilockerRef: ref,
                digilockerVerificationId: cashfreeVerificationId,
                digilockerReferenceId: cashfreeReferenceId,
                digilockerUrl: verifyUrl,
                digilockerStartedAt: new Date()
            }
        });

        await Owner.findOneAndUpdate(
            { loginId: String(loginId).toUpperCase() },
            {
                $set: {
                    loginId: String(loginId).toUpperCase(),
                    email: email || undefined,
                    checkinAadhaarLinkedPhone: aadhaarLinkedPhone || '',
                    checkinAadhaarNumber: String(aadhaarNumber),
                    'kyc.status': 'pending',
                    'kyc.provider': 'digilocker'
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({
            success: true,
            provider: 'digilocker',
            referenceId: cashfreeReferenceId || ref,
            verificationId: cashfreeVerificationId,
            verifyUrl,
            userFlow,
            message: 'DigiLocker verification initiated. Complete DigiLocker auth and return to this page.'
        });
    } catch (err) {
        console.error('owner/kyc/digilocker/start error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/owner/kyc/digilocker/complete', otpLimiter, async (req, res) => {
    try {
        const { loginId, aadhaarNumber, referenceId, verificationId } = req.body || {};
        if (!loginId || !aadhaarNumber || (!referenceId && !verificationId)) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const normalizedLoginId = String(loginId).toUpperCase();
        const record = await CheckinRecord.findOne({ loginId: normalizedLoginId, role: 'owner' });
        if (!record || !record.ownerKyc) {
            return res.status(404).json({ success: false, message: 'Owner KYC record not found' });
        }
        if (String(record.ownerKyc.aadhaarNumber || '') !== String(aadhaarNumber)) {
            return res.status(400).json({ success: false, message: 'Aadhaar mismatch' });
        }
        const storedVerificationId = record.ownerKyc.digilockerVerificationId || record.ownerKyc.digilockerRef;
        const storedReferenceId = record.ownerKyc.digilockerReferenceId || record.ownerKyc.digilockerRef;
        const checkVerificationId = verificationId || storedVerificationId;
        const checkReferenceId = referenceId || storedReferenceId;
        if (!checkVerificationId && !checkReferenceId) {
            return res.status(400).json({ success: false, message: 'Missing DigiLocker verification context' });
        }

        const statusResp = await getDigilockerVerificationStatus({
            verificationId: checkVerificationId,
            referenceId: checkReferenceId
        });
        const verificationStatus = String(
            statusResp?.status ||
            statusResp?.verification_status ||
            statusResp?.data?.status ||
            ''
        ).toUpperCase();
        const validStatuses = ['AUTHENTICATED', 'SUCCESS', 'COMPLETED', 'VERIFIED'];
        if (!validStatuses.includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: `DigiLocker verification not completed yet (status: ${verificationStatus || 'PENDING'})`
            });
        }

        let aadhaarDocument = null;
        try {
            aadhaarDocument = await getDigilockerDocument({
                documentType: 'AADHAAR',
                verificationId: checkVerificationId,
                referenceId: checkReferenceId
            });
        } catch (docErr) {
            console.warn('owner digilocker document fetch warning:', docErr.message);
        }

        record.ownerKyc.digilockerVerified = true;
        record.ownerKyc.digilockerStatus = 'verified';
        record.ownerKyc.digilockerVerifiedAt = new Date();
        record.ownerKyc.digilockerVerificationId = checkVerificationId || '';
        record.ownerKyc.digilockerReferenceId = checkReferenceId || '';
        const fetchedAadhaarNumber = extractAadhaarNumber(aadhaarDocument) || String(aadhaarNumber);
        record.ownerKyc.aadhaarNumber = fetchedAadhaarNumber;
        if (aadhaarDocument) {
            record.ownerKyc.digilockerDocument = aadhaarDocument;
        }
        await record.save();

        const owner = await Owner.findOneAndUpdate(
            { loginId: normalizedLoginId },
            {
                $set: {
                    checkinAadhaarNumber: fetchedAadhaarNumber,
                    'kyc.status': 'submitted',
                    'kyc.provider': 'digilocker',
                    'kyc.submittedAt': new Date(),
                    'kyc.aadharNumber': fetchedAadhaarNumber
                }
            },
            { new: true }
        );

        return res.json({
            success: true,
            message: 'DigiLocker verification completed successfully',
            aadhaarNumber: fetchedAadhaarNumber,
            verificationStatus,
            record,
            owner
        });
    } catch (err) {
        console.error('owner/kyc/digilocker/complete error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/owner/terms-accept', async (req, res) => {
    try {
        const { loginId, accepted } = req.body || {};
        if (!loginId || accepted !== true) {
            return res.status(400).json({ success: false, message: 'Terms must be accepted' });
        }
        const record = await upsertRecord(loginId, 'owner', { ownerTermsAcceptedAt: new Date() });
        return res.json({ success: true, record });
    } catch (err) {
        console.error('owner/terms-accept error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/owner/final-submit', async (req, res) => {
    try {
        const { loginId, finalVerified } = req.body || {};
        if (!loginId || finalVerified !== true) {
            return res.status(400).json({ success: false, message: 'Final verification required' });
        }
        const normalizedLoginId = String(loginId).toUpperCase();
        const record = await upsertRecord(normalizedLoginId, 'owner', {});
        const ownerDoc = await Owner.findOne({ loginId: normalizedLoginId }).lean();
        const ownerModelVerified = ownerDoc?.kyc?.status === 'submitted';
        if (!record.ownerKyc || (!isOwnerKycVerified(record) && !ownerModelVerified)) {
            return res.status(400).json({ success: false, message: 'Complete KYC verification first (OTP or DigiLocker)' });
        }
        if (ownerModelVerified && !isOwnerKycVerified(record)) {
            record.ownerKyc = record.ownerKyc || {};
            record.ownerKyc.digilockerVerified = true;
            record.ownerKyc.digilockerStatus = 'verified';
            record.ownerKyc.digilockerVerifiedAt = new Date();
        }
        if (!record.ownerTermsAcceptedAt) {
            return res.status(400).json({ success: false, message: 'Accept terms and conditions first' });
        }
        if (record.ownerFinalVerified) {
            const dashboardUrl = `${APP_URL}/propertyowner/index`;
            return res.json({
                success: true,
                message: 'Owner check-in already completed',
                record,
                dashboardUrl,
                agreementStatus: record.ownerAgreement?.status || 'accepted_terms'
            });
        }

        const result = await completeOwnerCheckinAndNotify(normalizedLoginId);

        return res.json({
            success: true,
            message: 'Owner terms accepted and check-in completed.',
            ...result,
            agreementStatus: result.record?.ownerAgreement?.status || 'accepted_terms'
        });
    } catch (err) {
        console.error('owner/final-submit error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/owner/agreement/complete', async (req, res) => {
    try {
        const { loginId, requestId, provider, callbackPayload } = req.body || {};
        if (!loginId) {
            return res.status(400).json({ success: false, message: 'Missing loginId' });
        }
        const result = await completeOwnerAgreementAndNotify(loginId, {
            requestId,
            provider,
            callbackPayload
        });
        return res.json({
            success: true,
            message: 'Owner agreement completed',
            ...result
        });
    } catch (err) {
        console.error('owner/agreement/complete error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

async function handleOwnerAgreementCallback(req, res) {
    try {
        const payload = {
            ...(req.query || {}),
            ...(req.body || {})
        };
        const loginId = payload.loginId || payload.loginid || payload.ownerLoginId || payload.owner_login_id || '';
        const requestId = payload.requestId || payload.request_id || payload.document_id || payload.documentId || '';
        const status = String(payload.status || payload.action_status || payload.request_status || 'completed').toLowerCase();

        console.log('[ZOHO CALLBACK] owner agreement callback received', {
            method: req.method,
            loginId,
            requestId,
            status
        });

        if (!loginId) {
            return res.status(400).send('Missing loginId');
        }

        if (!['completed', 'complete', 'signed', 'success'].includes(status)) {
            return res.redirect(`${DIGITAL_CHECKIN_URL}/digital-checkin/owner-success?loginId=${encodeURIComponent(String(loginId).toUpperCase())}&agreementPending=1`);
        }

        await completeOwnerAgreementAndNotify(loginId, {
            requestId,
            provider: 'zoho-sign',
            callbackPayload: payload
        });

        return res.redirect(`${DIGITAL_CHECKIN_URL}/digital-checkin/owner-success?loginId=${encodeURIComponent(String(loginId).toUpperCase())}&agreementSigned=1`);
    } catch (err) {
        console.error('owner/agreement/callback error:', err);
        return res.status(500).send(err.message);
    }
}

router.get('/owner/agreement/callback', handleOwnerAgreementCallback);
router.post('/owner/agreement/callback', handleOwnerAgreementCallback);

router.post('/tenant/profile', async (req, res) => {
    try {
        const { loginId, name, dob, guardianNumber, moveInDate, email, propertyName, roomNo, agreedRent } = req.body || {};
        if (!loginId || !name || !dob || !guardianNumber || !moveInDate) {
            return res.status(400).json({ success: false, message: 'Missing required tenant profile fields' });
        }
        const normalizedLoginId = String(loginId).toUpperCase();
        const record = await upsertRecord(normalizedLoginId, 'tenant', {
            tenantProfile: { name, dob, guardianNumber, moveInDate, email: email || '', propertyName: propertyName || '', roomNo: roomNo || '', agreedRent: agreedRent || null }
        });

        const tenant = await Tenant.findOne({ loginId: normalizedLoginId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found for this login ID' });
        }

        tenant.name = name || tenant.name;
        if (email) tenant.email = email;
        tenant.dob = dob || tenant.dob;
        tenant.guardianNumber = guardianNumber || tenant.guardianNumber;
        if (propertyName) tenant.propertyTitle = propertyName;
        if (roomNo) tenant.roomNo = roomNo;
        if (agreedRent !== undefined && agreedRent !== null && agreedRent !== '') tenant.agreedRent = Number(agreedRent);
        if (moveInDate) tenant.moveInDate = new Date(moveInDate);
        tenant.digitalCheckin = tenant.digitalCheckin || {};
        tenant.digitalCheckin.profile = {
            ...(tenant.digitalCheckin.profile || {}),
            name,
            dob,
            guardianNumber,
            moveInDate,
            email: email || tenant.email || '',
            propertyName: propertyName || tenant.propertyTitle || '',
            roomNo: roomNo || tenant.roomNo || '',
            agreedRent: Number(agreedRent || tenant.agreedRent || 0),
            submittedAt: new Date()
        };
        tenant.updatedAt = new Date();
        await tenant.save();

        return res.json({ success: true, record, tenant });
    } catch (err) {
        console.error('tenant/profile error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/tenant/kyc/send-otp', otpLimiter, async (req, res) => {
    try {
        const { loginId, aadhaarLinkedPhone, aadhaarNumber, aadhaarFront, aadhaarBack } = req.body || {};
        if (!loginId || !aadhaarLinkedPhone || !aadhaarNumber) {
            return res.status(400).json({ success: false, message: 'Missing tenant KYC fields' });
        }
        const normalizedLoginId = String(loginId).toUpperCase();
        await upsertRecord(normalizedLoginId, 'tenant', {
            tenantKyc: { aadhaarLinkedPhone, aadhaarNumber, aadhaarFront, aadhaarBack, otpVerified: false }
        });

        const tenant = await Tenant.findOne({ loginId: normalizedLoginId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found for this login ID' });
        }

        tenant.kyc = tenant.kyc || {};
        tenant.kyc.aadhaarNumber = aadhaarNumber;
        tenant.kyc.aadhar = aadhaarNumber;
        tenant.kyc.aadhaarLinkedPhone = aadhaarLinkedPhone;
        tenant.kyc.aadhaarFront = aadhaarFront || tenant.kyc.aadhaarFront || null;
        tenant.kyc.aadhaarBack = aadhaarBack || tenant.kyc.aadhaarBack || null;
        tenant.kyc.otpVerified = false;
        tenant.kyc.uploadedAt = new Date();
        tenant.kycStatus = 'submitted';

        tenant.digitalCheckin = tenant.digitalCheckin || {};
        tenant.digitalCheckin.kyc = {
            ...(tenant.digitalCheckin.kyc || {}),
            aadhaarLinkedPhone,
            aadhaarNumber,
            aadhaarFront: aadhaarFront || tenant.digitalCheckin?.kyc?.aadhaarFront || null,
            aadhaarBack: aadhaarBack || tenant.digitalCheckin?.kyc?.aadhaarBack || null,
            otpVerified: false
        };
        tenant.updatedAt = new Date();
        await tenant.save();

        const { referenceId, raw } = await requestAadhaarOtp(aadhaarNumber);
        const k = keyFor('tenant', normalizedLoginId, aadhaarNumber);
        otpStore.set(k, { referenceId, expiresAt: Date.now() + 10 * 60 * 1000 });
        console.log('[CHECKIN OTP] tenant', normalizedLoginId, aadhaarNumber, 'Cashfree OTP requested');
        return res.json({
            success: true,
            message: 'OTP sent to Aadhaar linked mobile number',
            provider: 'cashfree',
            mockOtp: raw?.mockOtp || undefined
        });
    } catch (err) {
        console.error('tenant/kyc/send-otp error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/tenant/kyc/verify-otp', otpLimiter, async (req, res) => {
    try {
        const { loginId, aadhaarNumber, otp } = req.body || {};
        const normalizedLoginId = String(loginId || '').toUpperCase();
        const k = keyFor('tenant', normalizedLoginId, aadhaarNumber);
        const entry = otpStore.get(k);
        if (!entry || Date.now() > entry.expiresAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        await verifyAadhaarOtp(entry.referenceId, otp);
        otpStore.delete(k);
        const record = await upsertRecord(normalizedLoginId, 'tenant', { 'tenantKyc.otpVerified': true });

        const tenant = await Tenant.findOne({ loginId: normalizedLoginId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found for this login ID' });
        }

        tenant.kyc = tenant.kyc || {};
        tenant.kyc.otpVerified = true;
        tenant.kyc.otpVerifiedAt = new Date();
        tenant.kycStatus = 'verified';

        tenant.digitalCheckin = tenant.digitalCheckin || {};
        tenant.digitalCheckin.kyc = {
            ...(tenant.digitalCheckin.kyc || {}),
            otpVerified: true,
            otpVerifiedAt: new Date()
        };
        tenant.updatedAt = new Date();
        await tenant.save();

        return res.json({ success: true, record, tenant });
    } catch (err) {
        console.error('tenant/kyc/verify-otp error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/tenant/kyc/digilocker/start', otpLimiter, async (req, res) => {
    try {
        const { loginId, aadhaarLinkedPhone, aadhaarNumber, aadhaarFront, aadhaarBack, redirectUrl: clientRedirectUrl } = req.body || {};
        if (!loginId || !aadhaarNumber) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (!/^\d{12}$/.test(String(aadhaarNumber))) {
            return res.status(400).json({ success: false, message: 'Aadhaar must be 12 digits' });
        }
        const normalizedLoginId = String(loginId).toUpperCase();
        const ref = createDigilockerRef(normalizedLoginId);
        const redirectUrl = clientRedirectUrl || process.env.DIGILOCKER_REDIRECT_URL || `${DIGITAL_CHECKIN_URL}/digital-checkin/tenantkyc`;

        const accountCheck = await verifyDigilockerAccount({
            verificationId: ref,
            mobileNumber: aadhaarLinkedPhone,
            aadhaarNumber
        });
        const userFlow = accountCheck?.account_exists ? 'signin' : 'signup';
        const digilockerInit = await createDigilockerUrl({
            verificationId: ref,
            redirectUrl,
            userFlow,
            documents: ['AADHAAR']
        });

        const cashfreeVerificationId = digilockerInit?.verification_id || ref;
        const cashfreeReferenceId = digilockerInit?.reference_id || digilockerInit?.ref_id || '';
        const verifyUrl = digilockerInit?.url || digilockerInit?.verification_url || digilockerInit?.link || '';

        await upsertRecord(normalizedLoginId, 'tenant', {
            tenantKyc: {
                aadhaarLinkedPhone: aadhaarLinkedPhone || '',
                aadhaarNumber: String(aadhaarNumber),
                aadhaarFront: aadhaarFront || null,
                aadhaarBack: aadhaarBack || null,
                otpVerified: false,
                digilockerVerified: false,
                digilockerStatus: 'pending',
                digilockerRef: ref,
                digilockerVerificationId: cashfreeVerificationId,
                digilockerReferenceId: cashfreeReferenceId,
                digilockerUrl: verifyUrl,
                digilockerStartedAt: new Date()
            }
        });

        const tenant = await Tenant.findOne({ loginId: normalizedLoginId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found for this login ID' });
        }

        tenant.kyc = tenant.kyc || {};
        tenant.kyc.aadhaarNumber = String(aadhaarNumber);
        tenant.kyc.aadhar = String(aadhaarNumber);
        tenant.kyc.aadhaarLinkedPhone = aadhaarLinkedPhone || '';
        tenant.kyc.aadhaarFront = aadhaarFront || tenant.kyc.aadhaarFront || null;
        tenant.kyc.aadhaarBack = aadhaarBack || tenant.kyc.aadhaarBack || null;
        tenant.kyc.otpVerified = false;
        tenant.kyc.digilockerVerified = false;
        tenant.kycStatus = 'submitted';
        tenant.digitalCheckin = tenant.digitalCheckin || {};
        tenant.digitalCheckin.kyc = {
            ...(tenant.digitalCheckin.kyc || {}),
            aadhaarLinkedPhone: aadhaarLinkedPhone || '',
            aadhaarNumber: String(aadhaarNumber),
            aadhaarFront: aadhaarFront || tenant.digitalCheckin?.kyc?.aadhaarFront || null,
            aadhaarBack: aadhaarBack || tenant.digitalCheckin?.kyc?.aadhaarBack || null,
            digilockerRef: ref,
            digilockerVerificationId: cashfreeVerificationId,
            digilockerReferenceId: cashfreeReferenceId,
            digilockerUrl: verifyUrl,
            digilockerStatus: 'pending',
            digilockerVerified: false
        };
        await tenant.save();

        return res.json({
            success: true,
            provider: 'digilocker',
            referenceId: cashfreeReferenceId || ref,
            verificationId: cashfreeVerificationId,
            verifyUrl,
            userFlow,
            message: 'DigiLocker verification initiated. Complete DigiLocker auth and return to this page.'
        });
    } catch (err) {
        console.error('tenant/kyc/digilocker/start error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/tenant/kyc/digilocker/complete', otpLimiter, async (req, res) => {
    try {
        const { loginId, aadhaarNumber, referenceId, verificationId } = req.body || {};
        if (!loginId || !aadhaarNumber || (!referenceId && !verificationId)) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const normalizedLoginId = String(loginId).toUpperCase();
        const record = await CheckinRecord.findOne({ loginId: normalizedLoginId, role: 'tenant' });
        if (!record || !record.tenantKyc) {
            return res.status(404).json({ success: false, message: 'Tenant KYC record not found' });
        }
        if (String(record.tenantKyc.aadhaarNumber || '') !== String(aadhaarNumber)) {
            return res.status(400).json({ success: false, message: 'Aadhaar mismatch' });
        }
        const storedVerificationId = record.tenantKyc.digilockerVerificationId || record.tenantKyc.digilockerRef;
        const storedReferenceId = record.tenantKyc.digilockerReferenceId || record.tenantKyc.digilockerRef;
        const checkVerificationId = verificationId || storedVerificationId;
        const checkReferenceId = referenceId || storedReferenceId;
        if (!checkVerificationId && !checkReferenceId) {
            return res.status(400).json({ success: false, message: 'Missing DigiLocker verification context' });
        }

        const statusResp = await getDigilockerVerificationStatus({
            verificationId: checkVerificationId,
            referenceId: checkReferenceId
        });
        const verificationStatus = String(
            statusResp?.status ||
            statusResp?.verification_status ||
            statusResp?.data?.status ||
            ''
        ).toUpperCase();
        const validStatuses = ['AUTHENTICATED', 'SUCCESS', 'COMPLETED', 'VERIFIED'];
        if (!validStatuses.includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: `DigiLocker verification not completed yet (status: ${verificationStatus || 'PENDING'})`
            });
        }

        let aadhaarDocument = null;
        try {
            aadhaarDocument = await getDigilockerDocument({
                documentType: 'AADHAAR',
                verificationId: checkVerificationId,
                referenceId: checkReferenceId
            });
        } catch (docErr) {
            console.warn('tenant digilocker document fetch warning:', docErr.message);
        }

        record.tenantKyc.digilockerVerified = true;
        record.tenantKyc.digilockerStatus = 'verified';
        record.tenantKyc.digilockerVerifiedAt = new Date();
        record.tenantKyc.digilockerVerificationId = checkVerificationId || '';
        record.tenantKyc.digilockerReferenceId = checkReferenceId || '';
        if (aadhaarDocument) {
            record.tenantKyc.digilockerDocument = aadhaarDocument;
        }
        await record.save();

        const tenant = await Tenant.findOne({ loginId: normalizedLoginId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found for this login ID' });
        }
        tenant.kyc = tenant.kyc || {};
        tenant.kyc.digilockerVerified = true;
        tenant.kyc.digilockerVerifiedAt = new Date();
        tenant.kyc.otpVerified = Boolean(tenant.kyc.otpVerified);
        tenant.kycStatus = 'verified';
        tenant.digitalCheckin = tenant.digitalCheckin || {};
        tenant.digitalCheckin.kyc = {
            ...(tenant.digitalCheckin.kyc || {}),
            digilockerVerified: true,
            digilockerVerifiedAt: new Date(),
            digilockerStatus: 'verified',
            digilockerVerificationId: checkVerificationId || '',
            digilockerReferenceId: checkReferenceId || ''
        };
        await tenant.save();

        return res.json({ success: true, message: 'DigiLocker verification completed successfully', verificationStatus, record, tenant });
    } catch (err) {
        console.error('tenant/kyc/digilocker/complete error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/tenant/agreement', async (req, res) => {
    try {
        const { loginId, eSignName, accepted } = req.body || {};
        if (!loginId || !eSignName || accepted !== true) {
            return res.status(400).json({ success: false, message: 'Agreement acceptance and e-sign are required' });
        }
        const normalizedLoginId = String(loginId).toUpperCase();
        const acceptedAt = new Date();
        const existingRecord = await CheckinRecord.findOne({ loginId: normalizedLoginId, role: 'tenant' }).lean();
        const record = await upsertRecord(normalizedLoginId, 'tenant', {
            tenantAgreement: {
                ...((existingRecord && existingRecord.tenantAgreement) || {}),
                eSignName,
                acceptedAt
            }
        });

        const tenant = await Tenant.findOne({ loginId: normalizedLoginId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found for this login ID' });
        }
        const kycVerified = Boolean(
            record?.tenantKyc?.otpVerified ||
            record?.tenantKyc?.digilockerVerified ||
            tenant?.kyc?.otpVerified ||
            tenant?.kyc?.digilockerVerified ||
            tenant?.kycStatus === 'verified'
        );
        if (!kycVerified) {
            return res.status(400).json({ success: false, message: 'Complete tenant KYC verification first' });
        }

        tenant.agreementESignName = eSignName;
        tenant.digitalCheckin = tenant.digitalCheckin || {};
        tenant.digitalCheckin.agreement = {
            ...(tenant.digitalCheckin.agreement || {}),
            eSignName,
            acceptedAt
        };
        tenant.updatedAt = new Date();
        await tenant.save();

        if (record.tenantAgreement?.status === 'signed' || tenant.agreementSigned) {
            const dashboardUrl = `${APP_URL}/tenant/tenantdashboard`;
            return res.json({
                success: true,
                message: 'Tenant rental agreement already signed',
                record,
                tenant,
                dashboardUrl,
                agreementStatus: 'signed'
            });
        }

        const callbackBase = process.env.ZOHO_SIGN_CALLBACK_URL || `${BACKEND_URL}/api/checkin/tenant/agreement/callback`;
        const normalizedCallbackBase = callbackBase.includes('/owner/agreement/callback')
            ? callbackBase.replace('/owner/agreement/callback', '/tenant/agreement/callback')
            : callbackBase;
        const callbackUrl = `${normalizedCallbackBase}${normalizedCallbackBase.includes('?') ? '&' : '?'}loginId=${encodeURIComponent(normalizedLoginId)}`;
        const agreementRequest = await createTenantAgreementRequest({
            tenant,
            loginId: normalizedLoginId,
            eSignName,
            callbackUrl
        });

        record.tenantAgreement = {
            ...(record.tenantAgreement || {}),
            eSignName,
            acceptedAt,
            provider: agreementRequest.provider,
            requestId: agreementRequest.requestId,
            signUrl: agreementRequest.signUrl,
            status: 'pending_signature',
            initiatedAt: new Date()
        };
        await record.save();

        tenant.agreementRequestId = agreementRequest.requestId;
        tenant.agreementStatus = 'pending_signature';
        await tenant.save();

        return res.json({
            success: true,
            message: 'Tenant rental agreement created. Continue to signing.',
            record,
            tenant,
            agreementStatus: 'pending_signature',
            provider: agreementRequest.provider,
            requestId: agreementRequest.requestId,
            signUrl: agreementRequest.signUrl
        });
    } catch (err) {
        console.error('tenant/agreement error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/tenant/final-submit', async (req, res) => {
    try {
        const { loginId } = req.body || {};
        if (!loginId) return res.status(400).json({ success: false, message: 'Missing loginId' });
        const normalizedLoginId = String(loginId).toUpperCase();
        const record = await CheckinRecord.findOne({ loginId: normalizedLoginId, role: 'tenant' });
        if (!record) return res.status(404).json({ success: false, message: 'Tenant check-in record not found' });
        const tenantModel = await Tenant.findOne({ loginId: normalizedLoginId });
        if (!record.tenantAgreement || !record.tenantAgreement.acceptedAt) {
            return res.status(400).json({ success: false, message: 'Accept rental agreement first' });
        }
        if (record.tenantAgreement?.status !== 'signed' && !(tenantModel && tenantModel.agreementSigned)) {
            return res.status(400).json({ success: false, message: 'Tenant rental agreement signature is still pending' });
        }

        const result = await completeTenantAgreementAndNotify(normalizedLoginId, {
            requestId: record.tenantAgreement?.requestId || tenantModel?.agreementRequestId || '',
            provider: record.tenantAgreement?.provider || tenantModel?.agreementStatus || 'zoho-sign',
            callbackPayload: { source: 'tenant-final-submit' }
        });

        return res.json({
            success: true,
            message: 'Tenant digital check-in submitted',
            ...result
        });
    } catch (err) {
        console.error('tenant/final-submit error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/tenant/agreement/complete', async (req, res) => {
    try {
        const { loginId, requestId, provider, callbackPayload } = req.body || {};
        if (!loginId) {
            return res.status(400).json({ success: false, message: 'Missing loginId' });
        }
        const result = await completeTenantAgreementAndNotify(loginId, {
            requestId,
            provider,
            callbackPayload
        });
        return res.json({
            success: true,
            message: 'Tenant agreement completed',
            ...result
        });
    } catch (err) {
        console.error('tenant/agreement/complete error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

async function handleTenantAgreementCallback(req, res) {
    try {
        const payload = {
            ...(req.query || {}),
            ...(req.body || {})
        };
        const loginId = payload.loginId || payload.loginid || payload.tenantLoginId || payload.tenant_login_id || '';
        const requestId = payload.requestId || payload.request_id || payload.document_id || payload.documentId || '';
        const status = String(payload.status || payload.action_status || payload.request_status || 'completed').toLowerCase();

        console.log('[ZOHO CALLBACK] tenant agreement callback received', {
            method: req.method,
            loginId,
            requestId,
            status
        });

        if (!loginId) {
            return res.status(400).send('Missing loginId');
        }

        if (!['completed', 'complete', 'signed', 'success'].includes(status)) {
            return res.redirect(`${DIGITAL_CHECKIN_URL}/digital-checkin/tenant-confirmation?loginId=${encodeURIComponent(String(loginId).toUpperCase())}&agreementPending=1`);
        }

        await completeTenantAgreementAndNotify(loginId, {
            requestId,
            provider: 'zoho-sign',
            callbackPayload: payload
        });

        return res.redirect(`${DIGITAL_CHECKIN_URL}/digital-checkin/tenant-confirmation?loginId=${encodeURIComponent(String(loginId).toUpperCase())}&agreementSigned=1`);
    } catch (err) {
        console.error('tenant/agreement/callback error:', err);
        return res.status(500).send(err.message);
    }
}

router.get('/tenant/agreement/callback', handleTenantAgreementCallback);
router.post('/tenant/agreement/callback', handleTenantAgreementCallback);

router.get('/:role/:loginId', async (req, res) => {
    try {
        const { role, loginId } = req.params;
        if (!ensureRole(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
        const record = await CheckinRecord.findOne({ loginId: String(loginId).toUpperCase(), role }).lean();
        return res.json({ success: true, record: record || null });
    } catch (err) {
        console.error('checkin get error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
