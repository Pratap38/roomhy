const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
// Enquiry API: create, list for owner, update status
router.post('/:ownerLoginId/enquiries', enquiryController.createEnquiry); // create
router.get('/:ownerLoginId/enquiries', enquiryController.listEnquiries); // list for owner
router.patch('/enquiries/:id', enquiryController.updateEnquiry); // update status
const Owner = require('../models/Owner');
const Message = require('../models/Message');
const Property = require('../models/Property');
const Room = require('../models/Room');
const Enquiry = require('../models/Enquiry');
const CheckinRecord = require('../models/CheckinRecord');
const ApprovedProperty = require('../models/ApprovedProperty');
const { protect, authorize } = require('../middleware/authMiddleware');
const ownerController = require('../controllers/ownercontroller');
const { auditTrail } = require('../middleware/auditTrail');
const { normalizeRoomInventory, syncOwnerPropertyOccupancy } = require('../utils/ownerOccupancy');

// 1. Create new owner (Preserved from original - used by enquiry approval/import)
router.post('/', auditTrail('owners'), async (req, res) => {
    try {
        console.log('📝 Owner POST request:', req.body);
        const owner = new Owner(req.body);
        await owner.save();
        console.log('✅ Owner created:', owner.loginId);
        res.status(201).json(owner);
    } catch (err) {
        console.error('❌ Owner POST error:', err.message);
        if (err.code === 11000) {
            // Duplicate key error - return existing owner to make POST idempotent
            try {
                const existing = await Owner.findOne({ loginId: req.body.loginId }).lean();
                if (existing) {
                    console.log('ℹ️ Owner POST duplicate detected; returning existing owner for', req.body.loginId);
                    return res.status(200).json(existing);
                }
            } catch (e) {
                console.error('❌ Error retrieving existing owner after duplicate:', e && e.message);
            }
            return res.status(409).json({ error: 'Owner ID already exists', code: 'DUPLICATE' });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

// 2. List all owners (Updated for Dashboard & Area Manager Filtering)
// Supports: ?locationCode=KO (prefix match), ?kycStatus=verified, ?search=...
router.get('/', ownerController.getAllOwners);

// 3. Get owner by loginId (Preserved)
router.get('/:loginId', ownerController.getOwnerById);

// 3b. Delete owner by loginId
router.delete('/:loginId', auditTrail('owners'), async (req, res) => {
    try {
        const loginId = String(req.params.loginId || '').toUpperCase();
        if (!loginId) {
            return res.status(400).json({ success: false, message: 'Invalid owner loginId' });
        }

        const deletedOwner = await Owner.findOneAndDelete({ loginId });
        await CheckinRecord.deleteOne({ loginId, role: 'owner' });

        if (!deletedOwner) {
            return res.status(404).json({ success: false, message: `Owner ${loginId} not found` });
        }

        return res.json({ success: true, message: `Owner ${loginId} deleted successfully` });
    } catch (err) {
        console.error('❌ Owner DELETE error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Update Owner KYC Status (NEW - Super Admin Only)
// Relaxed auth for development/testing
router.patch('/:id/kyc', protect, authorize('superadmin', 'areamanager'), auditTrail('owners'), ownerController.updateOwnerKyc);

// 5. Update owner by loginId (Preserved - Used for Password Updates)
router.patch('/:loginId', auditTrail('owners'), async (req, res) => {
    try {
        console.log('✏️ Owner PATCH request for:', req.params.loginId);

        // Prepare update payload
        let updatePayload = { ...req.body };
        updatePayload.loginId = req.params.loginId;

        // If password is being updated, ensure flags are set correctly
        if (updatePayload.credentials && updatePayload.credentials.password) {
            updatePayload.credentials.firstTime = false;
            updatePayload.passwordSet = true;
        }

        // Use findOneAndUpdate with upsert so missing owners (from legacy local storage) are created
        const owner = await Owner.findOneAndUpdate(
            { loginId: req.params.loginId },
            { $set: updatePayload, $setOnInsert: { createdAt: new Date() } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        res.json(owner);
    } catch (err) {
        console.error('❌ Owner PATCH error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 6. Get rooms for owner by loginId (Preserved - Used by Dashboard)
router.get('/:loginId/rooms', async (req, res) => {
    try {
        const loginId = String(req.params.loginId || '').trim().toUpperCase();
        // Find properties owned by this owner
        const properties = await Property.find({ ownerLoginId: loginId }).select('_id title');
        const propertyIds = properties.map(p => p._id);

        // Find rooms that belong to those properties
        const rooms = await Room.find({ property: { $in: propertyIds } }).populate('property', 'title ownerLoginId');

        return res.json({ properties, rooms });
    } catch (err) {
        console.error('❌ Error fetching owner rooms:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// 7. Get properties for owner by loginId
router.get('/:loginId/properties', async (req, res) => {
    try {
        const loginId = String(req.params.loginId || '').trim().toUpperCase();
        const properties = await Property.find({ ownerLoginId: loginId });
        return res.json({ properties });
    } catch (err) {
        console.error('❌ Error fetching owner properties:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

router.put('/:loginId/room-inventory', auditTrail('owners'), async (req, res) => {
    try {
        const loginId = String(req.params.loginId || '').trim().toUpperCase();
        const {
            rooms = [],
            propertyId = '',
            propertyTitle = '',
            propertyLocationCode = ''
        } = req.body || {};

        const normalizedRooms = normalizeRoomInventory(rooms, { propertyId, propertyTitle });
        const synced = await syncOwnerPropertyOccupancy({
            loginId,
            roomInventory: normalizedRooms,
            propertyId,
            propertyTitle,
            propertyLocationCode
        });

        return res.json({
            success: true,
            rooms: synced.roomInventory,
            summary: synced.summary,
            liveOnWebsite: synced.liveOnWebsite,
            owner: synced.owner
        });
    } catch (err) {
        console.error('❌ Error saving room inventory:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/:loginId/reupload-request', auditTrail('owners'), async (req, res) => {
    try {
        const loginId = String(req.params.loginId || '').trim().toUpperCase();
        const {
            approvedVisitId = '',
            roomId = '',
            roomNo = '',
            bedNo = 0,
            securityDepositSettled = false,
            wantsReupload = false,
            propertyInfo = {}
        } = req.body || {};

        const approvedProperty = approvedVisitId
            ? await ApprovedProperty.findOne({ visitId: approvedVisitId })
            : await ApprovedProperty.findOne({ 'generatedCredentials.loginId': loginId }).sort({ approvedAt: -1 });

        if (!approvedProperty) {
            return res.status(404).json({ success: false, message: 'Approved property not found for this owner' });
        }

        const requestId = `REUP-${Date.now()}`;
        const nextRequest = {
            requestId,
            ownerLoginId: loginId,
            roomId,
            roomNo,
            bedNo: Number(bedNo || 0),
            securityDepositSettled: Boolean(securityDepositSettled),
            wantsReupload: Boolean(wantsReupload),
            status: 'pending',
            requestedAt: new Date(),
            propertyInfo: {
                ...(approvedProperty.propertyInfo || {}),
                ...(propertyInfo || {})
            }
        };

        approvedProperty.reuploadRequests = Array.isArray(approvedProperty.reuploadRequests)
            ? approvedProperty.reuploadRequests
            : [];
        approvedProperty.reuploadRequests.unshift(nextRequest);
        await approvedProperty.save();

        return res.status(201).json({ success: true, request: nextRequest, visitId: approvedProperty.visitId });
    } catch (err) {
        console.error('❌ Error creating reupload request:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 7b. Create property for owner by loginId (used by owner panel rooms/properties sync)
router.post('/:loginId/properties', auditTrail('owners'), async (req, res) => {
    try {
        const loginId = String(req.params.loginId || '').toUpperCase();
        const {
            title,
            address,
            locationCode,
            city,
            area,
            description,
            propertyType,
            monthlyRent,
            roomCount,
            bedCount,
            vacantRooms,
            vacantBeds,
            occupiedRooms,
            occupiedBeds,
            ownerName,
            ownerEmail,
            ownerPhone
        } = req.body || {};

        if (!title || !String(title).trim()) {
            return res.status(400).json({ success: false, message: 'Property title is required' });
        }

        const normalizedTitle = String(title).trim();
        const normalizedLocationCode = String(locationCode || area || city || loginId.slice(0, 3) || 'GEN').toUpperCase();

        let property = await Property.findOne({
            ownerLoginId: loginId,
            title: { $regex: `^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });

        if (!property) {
            property = await Property.create({
                title: normalizedTitle,
                address: address || '',
                city: city || '',
                area: area || '',
                locationCode: normalizedLocationCode,
                ownerLoginId: loginId,
                description: description || '',
                propertyType: propertyType || '',
                monthlyRent: Number(monthlyRent || 0),
                roomCount: Number(roomCount || 0),
                bedCount: Number(bedCount || 0),
                vacantRooms: Number(vacantRooms || 0),
                vacantBeds: Number(vacantBeds || 0),
                occupiedRooms: Number(occupiedRooms || 0),
                occupiedBeds: Number(occupiedBeds || 0),
                ownerName: ownerName || '',
                ownerEmail: ownerEmail || '',
                ownerPhone: ownerPhone || '',
                status: 'active',
                isPublished: true
            });
        } else {
            property.address = address || property.address || '';
            property.city = city || property.city || '';
            property.area = area || property.area || '';
            property.locationCode = normalizedLocationCode || property.locationCode;
            property.description = description || property.description || '';
            property.propertyType = propertyType || property.propertyType || '';
            property.monthlyRent = Number(monthlyRent || property.monthlyRent || 0);
            property.roomCount = Number(roomCount ?? property.roomCount ?? 0);
            property.bedCount = Number(bedCount ?? property.bedCount ?? 0);
            property.vacantRooms = Number(vacantRooms ?? property.vacantRooms ?? 0);
            property.vacantBeds = Number(vacantBeds ?? property.vacantBeds ?? 0);
            property.occupiedRooms = Number(occupiedRooms ?? property.occupiedRooms ?? 0);
            property.occupiedBeds = Number(occupiedBeds ?? property.occupiedBeds ?? 0);
            property.ownerName = ownerName || property.ownerName || '';
            property.ownerEmail = ownerEmail || property.ownerEmail || '';
            property.ownerPhone = ownerPhone || property.ownerPhone || '';
            property.status = 'active';
            property.isPublished = true;
            await property.save();
        }

        return res.status(201).json({ success: true, property });
    } catch (err) {
        console.error('❌ Error creating owner property:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 8. Get rent collected for owner by loginId
router.get('/:loginId/rent', async (req, res) => {
    try {
        const loginId = String(req.params.loginId || '').trim().toUpperCase();
        // Find properties owned by this owner
        const properties = await Property.find({ ownerLoginId: loginId }).select('_id');
        const propertyIds = properties.map(p => p._id);

        // Find enquiries for these properties that are accepted/approved
        const enquiries = await Enquiry.find({
            propertyId: { $in: propertyIds },
            status: { $in: ['accepted', 'approved'] }
        }).select('paidAmount');

        const totalRent = enquiries.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
        return res.json({ totalRent });
    } catch (err) {
        console.error('❌ Error fetching owner rent:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

router.get('/:loginId/tenants', async (req, res) => {
    try {
        const loginId = String(req.params.loginId || '').trim().toUpperCase();
        const properties = await Property.find({ ownerLoginId: loginId }).select('_id');
        const propertyIds = properties.map((p) => p._id);
        const tenants = await require('../models/Tenant').find({ property: { $in: propertyIds } });
        return res.json({ tenants });
    } catch (err) {
        console.error('âŒ Error fetching owner tenants:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// POST /owners/:loginId/request-head
// Called by an authenticated owner to request escalation to Super Admin (head).
router.post('/:loginId/request-head', protect, auditTrail('owners'), async (req, res) => {
    try {
        const loginId = req.params.loginId;
        // only owner role should be allowed here
        if (!req.user || req.user.role !== 'owner' || req.user.loginId !== loginId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const text = req.body.text || 'Owner requests to chat with Super Admin.';
        const time = req.body.time || new Date().toISOString();

        let convo = await Message.findOne({ participant: `owner:${loginId}` });
        if (!convo) {
            convo = new Message({ participant: `owner:${loginId}`, messages: [] });
        }

        // mark conversation as headOnly so only superadmin can reply
        convo.headOnly = true;
        convo.messages.push({ from: `owner:${loginId}`, text, time, createdAt: new Date() });
        convo.updatedAt = new Date();
        await convo.save();

        return res.json({ participant: convo.participant, messages: convo.messages });
    } catch (err) {
        console.error('Error in request-head:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
