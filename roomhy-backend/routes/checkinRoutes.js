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

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://roomhy.com';
const ADMIN_URL = process.env.ADMIN_URL || process.env.FRONTEND_URL || 'https://admin.roomhy.com';
const APP_URL = process.env.APP_URL || process.env.APP_BASE_URL || process.env.WEB_APP_URL || 'https://app.roomhy.com';
const DIGITAL_CHECKIN_URL = process.env.DIGITAL_CHECKIN_URL || ADMIN_URL;

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
        if (aadhaarDocument) {
            record.ownerKyc.digilockerDocument = aadhaarDocument;
        }
        await record.save();

        const owner = await Owner.findOneAndUpdate(
            { loginId: normalizedLoginId },
            { $set: { 'kyc.status': 'submitted', 'kyc.provider': 'digilocker', 'kyc.submittedAt': new Date() } },
            { new: true }
        );

        return res.json({
            success: true,
            message: 'DigiLocker verification completed successfully',
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

        record.ownerFinalVerified = true;
        record.ownerSubmittedAt = new Date();
        await record.save();

        // Send owner dashboard link email after final submit
        const owner = ownerDoc || await Owner.findOne({ loginId: normalizedLoginId }).lean();
        const targetEmail = (owner && owner.email) || (record.ownerProfile && record.ownerProfile.email) || '';
        const baseUrl = APP_URL;
        const dashboardUrl = `${baseUrl}/propertyowner/index`;
        let loginEmailSent = false;

        if (targetEmail) {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background: #1d4ed8; color: white; padding: 18px 20px;">
                        <h2 style="margin: 0; font-size: 20px;">RoomHy Owner Check-in Completed</h2>
                    </div>
                    <div style="padding: 18px 20px; color: #111827; line-height: 1.55;">
                        <p style="margin-top: 0;">Your owner digital check-in is now fully submitted.</p>
                        <p style="margin: 14px 0 18px;">
                            <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:700;">Open Login Page</a>
                        </p>
                        <p style="font-size: 12px; color: #6b7280;">If button does not work, copy this link: ${dashboardUrl}</p>
                    </div>
                </div>
            `;
            try {
                await sendMail(targetEmail, 'RoomHy Owner Login Link', '', emailHtml);
                loginEmailSent = true;
            } catch (emailErr) {
                console.error('[CHECKIN FINAL SUBMIT] Email send error:', emailErr.message);
            }
        }

        return res.json({ success: true, message: 'Owner digital check-in submitted', record, dashboardUrl, loginEmailSent });
    } catch (err) {
        console.error('owner/final-submit error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

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
        const record = await upsertRecord(normalizedLoginId, 'tenant', {
            tenantAgreement: { eSignName, acceptedAt: new Date() }
        });

        const tenant = await Tenant.findOne({ loginId: normalizedLoginId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found for this login ID' });
        }

        tenant.agreementSigned = true;
        tenant.agreementSignedAt = acceptedAt;
        tenant.agreementESignName = eSignName;
        tenant.digitalCheckin = tenant.digitalCheckin || {};
        tenant.digitalCheckin.agreement = {
            ...(tenant.digitalCheckin.agreement || {}),
            eSignName,
            acceptedAt
        };
        tenant.updatedAt = new Date();
        await tenant.save();

        return res.json({ success: true, record, tenant });
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

        record.tenantSubmittedAt = new Date();
        await record.save();

        const tenant = tenantModel || await Tenant.findOne({ loginId: normalizedLoginId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found for this login ID' });
        }

        tenant.digitalCheckin = tenant.digitalCheckin || {};
        tenant.digitalCheckin.submittedAt = new Date();
        tenant.status = 'active';
        tenant.kycStatus = tenant.kycStatus || 'submitted';
        tenant.updatedAt = new Date();
        await tenant.save();

        const targetEmail = tenant.email || record?.tenantProfile?.email || '';
        const baseUrl = APP_URL;
        const tenantLoginUrl = `${baseUrl}/tenant/tenantlogin`;
        const dashboardUrl = `${baseUrl}/tenant/tenantdashboard`;
        let loginEmailSent = false;

        if (targetEmail) {
            const html = `
                <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    <div style="background:#16a34a;color:#fff;padding:16px 20px;">
                        <h2 style="margin:0;font-size:20px;">RoomHy Tenant Check-in Completed</h2>
                    </div>
                    <div style="padding:18px 20px;color:#111827;line-height:1.55;">
                        <p style="margin-top:0;">Your tenant digital check-in is fully submitted.</p>
                        <p style="margin:14px 0 18px;">
                            <a href="${dashboardUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:700;">Open Login Page</a>
                        </p>
                        <p style="font-size:12px;color:#6b7280;">If button does not work, copy this link: ${dashboardUrl}</p>
                    </div>
                </div>
            `;
            try {
                await sendMail(targetEmail, 'RoomHy Tenant Login Link', '', html);
                loginEmailSent = true;
            } catch (emailErr) {
                console.error('[TENANT CHECKIN FINAL] Email send error:', emailErr.message);
            }
        }

        return res.json({
            success: true,
            message: 'Tenant digital check-in submitted',
            record,
            tenant,
            dashboardUrl,
            tenantLoginUrl,
            loginEmailSent
        });
    } catch (err) {
        console.error('tenant/final-submit error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

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
