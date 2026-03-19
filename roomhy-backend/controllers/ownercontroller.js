// Get properties for an owner
exports.getOwnerProperties = async (req, res) => {
    try {
        const ownerLoginId = req.params.loginId;
        const properties = await Property.find({ ownerLoginId });
        res.json({ properties });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get rooms for an owner
exports.getOwnerRooms = async (req, res) => {
    try {
        const ownerLoginId = req.params.loginId;
        const properties = await Property.find({ ownerLoginId });
        const propertyIds = properties.map(p => p._id);
        const rooms = await require('../models/Room').find({ property: { $in: propertyIds } });
        res.json({ rooms });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get tenants for an owner
exports.getOwnerTenants = async (req, res) => {
    try {
        const ownerLoginId = req.params.loginId;
        const properties = await Property.find({ ownerLoginId });
        const propertyIds = properties.map(p => p._id);
        const tenants = await require('../models/Tenant').find({ property: { $in: propertyIds } });
        res.json({ tenants });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get rent collected for an owner
exports.getOwnerRent = async (req, res) => {
    try {
        const ownerLoginId = req.params.loginId;
        const enquiries = await require('../models/Enquiry').find({ ownerLoginId, status: { $in: ['accepted', 'approved'] } });
        const totalRent = enquiries.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
        res.json({ totalRent });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const Owner = require('../models/Owner');
const Notification = require('../models/Notification');
const Property = require('../models/Property');
const CheckinRecord = require('../models/CheckinRecord');

// List Owners with Filtering (Area, KYC Status)
exports.getAllOwners = async (req, res) => {
    try {
        const { locationCode, kycStatus, search } = req.query;
        let query = {};

        // Area Based Filtering
        if (locationCode) {
            query.$or = [
                { locationCode: { $regex: `^${locationCode}`, $options: 'i' } },
                { 'profile.locationCode': { $regex: `^${locationCode}`, $options: 'i' } }
            ];
        }

        // Status Filtering
        if (kycStatus) {
            query['kyc.status'] = kycStatus;
        }

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { loginId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { 'profile.name': { $regex: search, $options: 'i' } }
            ];
        }

        const owners = await Owner.find(query).sort({ createdAt: -1 }).lean();

        // Attach property counts per owner for frontend display
        const ownerLoginIds = owners.map(o => o.loginId).filter(Boolean);
        const primaryPropertyMap = {};
        if (ownerLoginIds.length > 0) {
            const counts = await Property.aggregate([
                { $match: { ownerLoginId: { $in: ownerLoginIds } } },
                { $group: { _id: '$ownerLoginId', count: { $sum: 1 } } }
            ]);
            const countMap = {};
            counts.forEach(c => { countMap[c._id] = c.count; });
            owners.forEach(o => { o.propertyCount = countMap[o.loginId] || 0; });

            const firstProperties = await Property.find({ ownerLoginId: { $in: ownerLoginIds } })
                .sort({ createdAt: 1 })
                .select('ownerLoginId title locationCode')
                .lean();
            firstProperties.forEach((property) => {
                if (property?.ownerLoginId && !primaryPropertyMap[property.ownerLoginId]) {
                    primaryPropertyMap[property.ownerLoginId] = property;
                }
            });
        } else {
            owners.forEach(o => { o.propertyCount = 0; });
        }

        // ✅ NEW: Ensure all owners have merged profile data at top level for easy frontend access
        const checkins = ownerLoginIds.length > 0
            ? await CheckinRecord.find({ role: 'owner', loginId: { $in: ownerLoginIds } }).lean()
            : [];
        const checkinMap = {};
        checkins.forEach(c => { checkinMap[c.loginId] = c; });

        const enrichedOwners = owners.map(o => ({
            ...o,
            propertyTitle: primaryPropertyMap[o.loginId]?.title || '',
            propertyName: primaryPropertyMap[o.loginId]?.title || '',
            propertyLocationCode: primaryPropertyMap[o.loginId]?.locationCode || '',
            checkinDob: o.checkinDob || checkinMap[o.loginId]?.ownerProfile?.dob || '',
            checkinEmail: o.checkinEmail || checkinMap[o.loginId]?.ownerProfile?.email || o.email || '',
            checkinPhone: o.checkinPhone || checkinMap[o.loginId]?.ownerProfile?.phone || o.phone || '',
            checkinAddress: o.checkinAddress || checkinMap[o.loginId]?.ownerProfile?.address || o.address || '',
            checkinArea: o.checkinArea || checkinMap[o.loginId]?.ownerProfile?.area || o.locationCode || o.profile?.locationCode || '',
            checkinPassword: o.checkinPassword || o.credentials?.password || '',
            checkinAccountHolderName: o.checkinAccountHolderName || checkinMap[o.loginId]?.ownerProfile?.payment?.accountHolderName || o.profile?.accountHolderName || '',
            checkinBankAccountNumber: o.checkinBankAccountNumber || checkinMap[o.loginId]?.ownerProfile?.payment?.bankAccountNumber || o.accountNumber || o.profile?.accountNumber || '',
            checkinIfscCode: o.checkinIfscCode || checkinMap[o.loginId]?.ownerProfile?.payment?.ifscCode || o.ifscCode || o.profile?.ifscCode || '',
            checkinBankName: o.checkinBankName || checkinMap[o.loginId]?.ownerProfile?.payment?.bankName || o.bankName || o.profile?.bankName || '',
            checkinBranchName: o.checkinBranchName || checkinMap[o.loginId]?.ownerProfile?.payment?.branchName || o.branchName || o.profile?.branchName || '',
            checkinUpiId: o.checkinUpiId || checkinMap[o.loginId]?.ownerProfile?.payment?.upiId || o.profile?.upiId || '',
            checkinAadhaarLinkedPhone: o.checkinAadhaarLinkedPhone || checkinMap[o.loginId]?.ownerKyc?.aadhaarLinkedPhone || o.kyc?.aadhaarLinkedPhone || '',
            checkinAadhaarNumber: o.checkinAadhaarNumber || checkinMap[o.loginId]?.ownerKyc?.aadhaarNumber || o.kyc?.aadharNumber || o.kyc?.aadhaarNumber || '',
            checkinOtpVerified: !!checkinMap[o.loginId]?.ownerKyc?.otpVerified,
            checkinSubmittedAt: checkinMap[o.loginId]?.ownerSubmittedAt || null,
            // Merge profile data to top level (profile takes priority, then top-level field)
            name: o.profile?.name || o.name || 'Unknown',
            email: o.profile?.email || o.email || o.checkinEmail || (checkinMap[o.loginId]?.ownerProfile?.email || ''),
            phone: o.profile?.phone || o.phone || o.checkinPhone || (checkinMap[o.loginId]?.ownerProfile?.phone || ''),
            address: o.profile?.address || o.address || o.checkinAddress || (checkinMap[o.loginId]?.ownerProfile?.address || ''),
            locationCode: o.profile?.locationCode || o.locationCode || o.checkinArea || (checkinMap[o.loginId]?.ownerProfile?.area || ''),
            bankName: o.profile?.bankName || o.checkinBankName || '',
            accountNumber: o.profile?.accountNumber || o.accountNumber || o.checkinBankAccountNumber || (checkinMap[o.loginId]?.ownerProfile?.payment?.bankAccountNumber || ''),
            ifscCode: o.profile?.ifscCode || o.ifscCode || o.checkinIfscCode || (checkinMap[o.loginId]?.ownerProfile?.payment?.ifscCode || ''),
            branchName: o.profile?.branchName || o.branchName || o.checkinBranchName || '',
            aadharNumber: o.kyc?.aadharNumber || o.kyc?.aadhaarNumber || o.checkinAadhaarNumber || '',
            kycStatus: o.kyc?.status || 'pending',
            documentImage: o.kyc?.documentImage || '',
            profileFilled: !!o.profileFilled,
            password: o.credentials?.password || o.checkinPassword || ''
        }));

        res.json({ success: true, owners: enrichedOwners });
    } catch (err) {
        console.error('Get Owners Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update Owner KYC Status (Super Admin Action)
exports.updateOwnerKyc = async (req, res) => {
    try {
        const { id } = req.params; // Can be _id or loginId
        const { status, rejectionReason } = req.body; // 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const owner = await Owner.findOne({ $or: [{ _id: id }, { loginId: id }] });
        if (!owner) return res.status(404).json({ message: 'Owner not found' });

        owner.kyc = owner.kyc || {};
        owner.kyc.status = status;
        if (status === 'verified') {
            owner.kyc.verifiedAt = new Date();
            owner.isActive = true; // Activate owner on verification
        } else {
            owner.kyc.rejectionReason = rejectionReason || '';
            owner.isActive = false;
        }

        await owner.save();

        // Send Notification to Owner (assuming Notification model exists)
        // Note: recipient needs to be the User _id associated if decoupled, 
        // but often Owner model implies a User. Adjust recipient as needed.
        // For now, we assume a notification system integration:
        // await Notification.create({
        //    recipient: owner.userId, // field linking to User model
        //    type: 'kyc_update',
        //    message: `Your KYC has been ${status}.`
        // });

        res.json({ success: true, message: `Owner KYC ${status}`, owner });
    } catch (err) {
        console.error('KYC Update Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Single Owner
exports.getOwnerById = async (req, res) => {
    try {
        const normalizedLoginId = String(req.params.loginId || '').trim().toUpperCase();
        const owner = await Owner.findOne({ loginId: normalizedLoginId }).lean();
        if (!owner) return res.status(404).json({ message: 'Owner not found' });
        const checkin = await CheckinRecord.findOne({ role: 'owner', loginId: normalizedLoginId }).lean();
        const primaryProperty = await Property.findOne({ ownerLoginId: normalizedLoginId })
            .sort({ createdAt: 1 })
            .select('title locationCode')
            .lean();
        res.json({
            ...owner,
            propertyTitle: primaryProperty?.title || '',
            propertyName: primaryProperty?.title || '',
            propertyLocationCode: primaryProperty?.locationCode || '',
            name: owner.profile?.name || owner.name || 'Unknown',
            email: owner.profile?.email || owner.email || owner.checkinEmail || (checkin?.ownerProfile?.email || ''),
            phone: owner.profile?.phone || owner.phone || owner.checkinPhone || (checkin?.ownerProfile?.phone || ''),
            address: owner.profile?.address || owner.address || owner.checkinAddress || (checkin?.ownerProfile?.address || ''),
            locationCode: owner.profile?.locationCode || owner.locationCode || owner.checkinArea || (checkin?.ownerProfile?.area || ''),
            bankName: owner.profile?.bankName || owner.checkinBankName || '',
            accountNumber: owner.profile?.accountNumber || owner.accountNumber || owner.checkinBankAccountNumber || (checkin?.ownerProfile?.payment?.bankAccountNumber || ''),
            ifscCode: owner.profile?.ifscCode || owner.ifscCode || owner.checkinIfscCode || (checkin?.ownerProfile?.payment?.ifscCode || ''),
            branchName: owner.profile?.branchName || owner.branchName || owner.checkinBranchName || '',
            aadharNumber: owner.kyc?.aadharNumber || owner.kyc?.aadhaarNumber || owner.checkinAadhaarNumber || '',
            kycStatus: owner.kyc?.status || 'pending',
            documentImage: owner.kyc?.documentImage || '',
            profileFilled: !!owner.profileFilled,
            password: owner.credentials?.password || owner.checkinPassword || '',
            checkinDob: owner.checkinDob || checkin?.ownerProfile?.dob || '',
            checkinEmail: owner.checkinEmail || checkin?.ownerProfile?.email || owner.email || '',
            checkinPhone: owner.checkinPhone || checkin?.ownerProfile?.phone || owner.phone || '',
            checkinAddress: owner.checkinAddress || checkin?.ownerProfile?.address || owner.address || '',
            checkinArea: owner.checkinArea || checkin?.ownerProfile?.area || owner.locationCode || '',
            checkinAccountHolderName: owner.checkinAccountHolderName || checkin?.ownerProfile?.payment?.accountHolderName || '',
            checkinBankAccountNumber: owner.checkinBankAccountNumber || checkin?.ownerProfile?.payment?.bankAccountNumber || '',
            checkinIfscCode: owner.checkinIfscCode || checkin?.ownerProfile?.payment?.ifscCode || '',
            checkinBankName: owner.checkinBankName || checkin?.ownerProfile?.payment?.bankName || owner.bankName || '',
            checkinBranchName: owner.checkinBranchName || checkin?.ownerProfile?.payment?.branchName || owner.branchName || '',
            checkinUpiId: owner.checkinUpiId || checkin?.ownerProfile?.payment?.upiId || '',
            checkinAadhaarLinkedPhone: owner.checkinAadhaarLinkedPhone || checkin?.ownerKyc?.aadhaarLinkedPhone || owner.kyc?.aadhaarLinkedPhone || '',
            checkinAadhaarNumber: owner.checkinAadhaarNumber || checkin?.ownerKyc?.aadhaarNumber || owner.kyc?.aadharNumber || owner.kyc?.aadhaarNumber || '',
            checkinOtpVerified: !!checkin?.ownerKyc?.otpVerified,
            checkinSubmittedAt: checkin?.ownerSubmittedAt || null
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
