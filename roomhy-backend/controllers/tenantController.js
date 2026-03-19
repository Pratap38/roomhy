const Tenant = require('../models/Tenant');
const User = require('../models/user');
const Property = require('../models/Property');
const Owner = require('../models/Owner');
const Rent = require('../models/Rent');
const generateTenantId = require('../utils/generateTenantId');
const crypto = require('crypto');
const mailer = require('../utils/mailer');

/**
 * Assign a tenant to a room
 * POST /api/tenants/assign
 * Body: { name, phone, email, propertyId, roomNo, bedNo, moveInDate, agreedRent }
 */
exports.assignTenant = async (req, res) => {
    try {
        const { name, phone, email, propertyId, roomNo, bedNo, moveInDate, agreedRent, ownerLoginId, propertyTitle, locationCode } = req.body;
        let assignedPropertyTitle = String(propertyTitle || '').trim();

        // Validation
        if (!name || !phone || !email || !agreedRent) {
            return res.status(400).json({ success: false, message: 'Missing required fields (name, phone, email, agreedRent)' });
        }

        // Resolve property. If raw propertyId is not a Mongo id, fallback by owner/title.
        let property = null;
        if (propertyId && /^[a-f\d]{24}$/i.test(String(propertyId).trim())) {
            try {
                property = await Property.findById(String(propertyId).trim()).populate('owner');
            } catch (e) {
                // continue to fallback resolution
                property = null;
            }
        }

        if (!property && ownerLoginId) {
            const normalizedOwnerId = String(ownerLoginId).toUpperCase();
            // Prefer exact property title match from assignment payload first.
            if (propertyTitle) {
                property = await Property.findOne({
                    ownerLoginId: normalizedOwnerId,
                    title: { $regex: `^${String(propertyTitle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
                }).populate('owner');
            }
            if (!property) {
                property = await Property.findOne({ ownerLoginId: normalizedOwnerId }).populate('owner');
            }
        }

        if (!assignedPropertyTitle && ownerLoginId) {
            const ownerProfile = await Owner.findOne({ loginId: String(ownerLoginId).toUpperCase() })
                .select('propertyTitle propertyName')
                .lean();
            assignedPropertyTitle = String(
                assignedPropertyTitle ||
                property?.title ||
                ownerProfile?.propertyTitle ||
                ownerProfile?.propertyName ||
                ''
            ).trim();
        }

        if (!property) {
            // Last fallback: create a minimal property so tenant assignment can proceed.
            const normalizedOwnerId = String(ownerLoginId || '').toUpperCase();
            const derivedLocationCode = String(locationCode || normalizedOwnerId.slice(0, 3) || 'GEN').toUpperCase();
            const derivedTitle = assignedPropertyTitle || `Property ${normalizedOwnerId || 'GEN'}`;
            property = await Property.create({
                title: derivedTitle,
                locationCode: derivedLocationCode,
                ownerLoginId: normalizedOwnerId || undefined,
                status: 'active'
            });
            property = await Property.findById(property._id).populate('owner');
        }

        // Get location code from property
        const effectiveLocationCode = property.locationCode || String(locationCode || '').toUpperCase() || 'GEN';
        assignedPropertyTitle = String(assignedPropertyTitle || property.title || '').trim();

        // Generate unique tenant login ID
        const loginId = await generateTenantId();

        // Generate temporary password (8 chars: mix of alphanumeric)
        const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase();

        // Create User record for tenant (role: 'tenant')
        const user = await User.create({
            name,
            email,
            phone,
            password: tempPassword, // Will be hashed by pre-save hook
            role: 'tenant',
            loginId,
            locationCode: effectiveLocationCode,
            status: 'active'
        });

        // Create Tenant record
        const tenant = await Tenant.create({
            name,
            phone,
            email,
            property: property._id,
            roomNo,
            bedNo,
            moveInDate: moveInDate ? new Date(moveInDate) : null,
            agreedRent: parseInt(agreedRent),
            loginId,
            tempPassword, // Store for now; will be displayed once, then forgotten
            user: user._id,
            ownerLoginId: String(ownerLoginId || property.ownerLoginId || '').toUpperCase() || undefined,
            propertyTitle: assignedPropertyTitle || property.title || '',
            assignedBy: req.user ? req.user.id : (property.owner && property.owner._id ? property.owner._id : undefined), // Owner who assigned
            status: 'pending',
            kycStatus: 'pending'
        });

        // Populate for response (include locationCode and owner info)
        await tenant.populate('property', 'title roomType locationCode owner ownerLoginId');

        // Create Rent record for this tenant
        const rentAmount = parseInt(agreedRent);
        const rentPropertyName = assignedPropertyTitle || property.title || 'Property';
        const rent = await Rent.create({
            propertyName: rentPropertyName,
            roomNumber: roomNo,
            area: property.area || '-',
            tenantName: name,
            tenantEmail: email,
            tenantPhone: phone,
            tenantLoginId: loginId,
            rentAmount: rentAmount,
            totalDue: rentAmount,
            paidAmount: 0,
            paymentStatus: 'pending',
            moveInDate: moveInDate ? new Date(moveInDate) : new Date(),
            dueDate: moveInDate ? new Date(moveInDate) : new Date(),
            createdAt: new Date()
        });

        // Log notification for super admin
        console.log(`[TENANT ASSIGNED] ${name} (${loginId}) assigned to ${rentPropertyName}, Room ${roomNo}`);
        console.log(`[RENT RECORD CREATED] Rent ID: ${rent._id}, Amount: ₹${rentAmount}`);

        // Send email to tenant with loginId, tempPassword and digital check-in link (non-blocking)
        const baseWebUrl = process.env.FRONTEND_URL || process.env.WEB_APP_URL || 'https://admin.roomhy.com';
        const tenantCheckinLink = `${baseWebUrl}/digital-checkin/tenantprofile?loginId=${encodeURIComponent(tenant.loginId)}`;
        try {
            if (tenant.email) {
                const subject = 'Your RoomHy Tenant Login Credentials + Digital Check-In Link';
                const html = `
                    <div style="font-family: Arial, Helvetica, sans-serif; color:#111; font-size:14px;">
                        <h3>Tenant Account Created</h3>
                        <p>Your tenant account has been created successfully.</p>
                        <p><strong>Property:</strong> ${assignedPropertyTitle || property.title || '-'}</p>
                        <p><strong>Room Number:</strong> ${roomNo || '-'}</p>
                        <p><strong>Rent:</strong> INR ${parseInt(agreedRent || 0, 10)}</p>
                        <p><strong>Login ID:</strong> ${tenant.loginId}</p>
                        <p><strong>Password:</strong> ${tenant.tempPassword}</p>
                        <p><strong>Digital Check-In Form:</strong><br>
                           <a href="${tenantCheckinLink}">${tenantCheckinLink}</a></p>
                        <p>Please complete profile, KYC, OTP verification, and agreement e-sign.</p>
                    </div>
                `;
                const text = `Tenant account created.\nProperty: ${assignedPropertyTitle || property.title || '-'}\nRoom Number: ${roomNo || '-'}\nRent: INR ${parseInt(agreedRent || 0, 10)}\nLogin ID: ${tenant.loginId}\nPassword: ${tenant.tempPassword}\nDigital Check-In: ${tenantCheckinLink}`;
                mailer.sendMail(tenant.email, subject, text, html);
            }

            // Also send a copy to owner email (if available)
            const ownerEmail =
                (property.owner && property.owner.email) ||
                (property.owner && property.owner.profile && property.owner.profile.email) ||
                '';
            if (ownerEmail) {
                mailer.sendCredentials(ownerEmail, tenant.loginId, tenant.tempPassword, 'Tenant (Owner Copy)');
            }
        } catch (err) {
            console.warn('Failed to queue tenant credential email:', err && err.message);
        }

        // For testing we still return credentials in response

        res.status(201).json({
            success: true,
            message: 'Tenant assigned successfully',
            tenant: {
                id: tenant._id,
                name: tenant.name,
                loginId: tenant.loginId,
                tempPassword: tenant.tempPassword, // Return once for display
                phone: tenant.phone,
                email: tenant.email,
                property: tenant.property,
                propertyTitle: tenant.propertyTitle || assignedPropertyTitle || property.title || '',
                ownerLoginId: tenant.ownerLoginId || '',
                roomNo: tenant.roomNo,
                bedNo: tenant.bedNo,
                moveInDate: tenant.moveInDate,
                agreedRent: tenant.agreedRent
            },
            tenantCheckinLink
        });

    } catch (error) {
        console.error('assignTenant error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * Get all tenants (Super Admin)
 * GET /api/tenants
 */
exports.getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find()
            .populate('property', 'title locationCode')
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, tenants });
    } catch (error) {
        console.error('getAllTenants error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get tenants for owner (owned properties)
 * GET /api/tenants/owner/:ownerId
 */
exports.getTenantsByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;

        // Get all properties owned by this owner
        const properties = await Property.find({ owner: ownerId });
        const propertyIds = properties.map(p => p._id);

        // Get tenants assigned to these properties
        const tenants = await Tenant.find({ property: { $in: propertyIds } })
            .populate('property', 'title roomType locationCode owner ownerLoginId')
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, tenants });
    } catch (error) {
        console.error('getTenantsByOwner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get single tenant details
 * GET /api/tenants/:tenantId
 */
exports.getTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;

        const tenant = await Tenant.findById(tenantId)
            .populate('property', 'title roomType locationCode owner')
            .populate('user', 'name email phone')
            .populate('assignedBy', 'name')
            .populate('verifiedBy', 'name');

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        res.json({ success: true, tenant });
    } catch (error) {
        console.error('getTenant error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Verify tenant (Super Admin action)
 * POST /api/tenants/:tenantId/verify
 * Body: { kycApproved }
 */
exports.verifyTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { kycApproved } = req.body;

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        tenant.status = kycApproved ? 'active' : 'inactive';
        tenant.kycStatus = kycApproved ? 'verified' : 'rejected';
        tenant.verifiedBy = req.user ? req.user.id : null;
        tenant.verifiedAt = new Date();
        await tenant.save();

        res.json({
            success: true,
            message: `Tenant ${kycApproved ? 'verified' : 'rejected'} successfully`,
            tenant
        });
    } catch (error) {
        console.error('verifyTenant error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update tenant KYC
 * POST /api/tenants/:tenantId/kyc
 * Body: { aadhar, idProofFile, addressProofFile }
 */
exports.updateTenantKyc = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { aadhar, idProofFile, addressProofFile } = req.body;

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        if (!tenant.kyc) tenant.kyc = {};

        tenant.kyc.aadhar = aadhar || tenant.kyc.aadhar;
        tenant.kyc.idProofFile = idProofFile || tenant.kyc.idProofFile;
        tenant.kyc.addressProofFile = addressProofFile || tenant.kyc.addressProofFile;
        tenant.kyc.uploadedAt = new Date();
        tenant.kycStatus = 'submitted';

        await tenant.save();

        console.log(`[TENANT KYC UPLOADED] ${tenant.name} (${tenant.loginId})`);

        res.json({
            success: true,
            message: 'KYC updated successfully',
            tenant
        });
    } catch (error) {
        console.error('updateTenantKyc error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
