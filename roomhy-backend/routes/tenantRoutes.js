const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantController = require('../controllers/tenantController');
const { auditTrail } = require('../middleware/auditTrail');

// 0. Assign tenant to room - POST must come before GET
// Owner panel currently uses owner session (no JWT), so keep this endpoint open.
router.post('/assign', auditTrail('tenants'), tenantController.assignTenant);

// 1. Get all tenants
router.get('/', async (req, res) => {
    try {
        const tenants = await Tenant.find()
            .populate('property', 'title roomType locationCode owner ownerLoginId')
            .populate('room', 'number type rent')
            .lean();
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 1b. Get tenants by owner loginId
router.get('/owner/:ownerId', async (req, res) => {
    try {
        const ownerId = String(req.params.ownerId || '').trim().toUpperCase();
        const properties = await Property.find({ ownerLoginId: ownerId }).select('_id');
        const propertyIds = properties.map((property) => property._id);
        const tenants = await Tenant.find({ property: { $in: propertyIds } })
            .populate('property', 'title roomType locationCode owner ownerLoginId')
            .populate('room', 'number type rent')
            .lean();
        res.json({ tenants });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Get tenant by ID
router.get('/:id', async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id)
            .populate('property', 'title roomType locationCode owner ownerLoginId')
            .populate('room', 'number type rent');
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        res.json(tenant);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Create tenant
router.post('/', protect, authorize('superadmin', 'areamanager', 'owner'), auditTrail('tenants'), async (req, res) => {
    try {
        const tenant = new Tenant(req.body);
        await tenant.save();
        res.status(201).json(tenant);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 4. Update tenant
router.patch('/:id', protect, authorize('superadmin', 'areamanager', 'owner'), auditTrail('tenants'), async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        res.json(tenant);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 5. Delete tenant
router.delete('/:id', protect, authorize('superadmin', 'areamanager', 'owner'), auditTrail('tenants'), async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndDelete(req.params.id);
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        res.json({ message: 'Tenant deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 6. Get tenants by property
router.get('/property/:propertyId', async (req, res) => {
    try {
        const tenants = await Tenant.find({ property: req.params.propertyId })
            .populate('property', 'title roomType locationCode owner ownerLoginId')
            .populate('room', 'number type rent');
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Get tenants by room
router.get('/room/:roomId', async (req, res) => {
    try {
        const tenants = await Tenant.find({ room: req.params.roomId })
            .populate('property', 'title roomType locationCode owner ownerLoginId')
            .populate('room', 'number type rent');
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
