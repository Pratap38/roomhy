const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/authMiddleware');
const { auditTrail } = require('../middleware/auditTrail');
const { formLimiter } = require('../middleware/security');

// Get All Properties
// Made public for dashboard pages that don't send auth token consistently.
router.get('/', propertyController.getAllProperties);

// Superadmin publishes property
router.post('/:id/publish', protect, authorize('superadmin'), propertyController.publishProperty);

// Submit property enquiry (from list.html)
router.post('/property-enquiry/submit', formLimiter, auditTrail('properties'), propertyController.submitEnquiry);

// Ensure owner has a property and return it.
// This route is intentionally public because owner panel may not always send auth token.
router.post('/ensure-owner', formLimiter, auditTrail('properties'), async (req, res) => {
    try {
        const ownerLoginId = String(req.body.ownerLoginId || req.body.loginId || '').trim().toUpperCase();
        const title = String(req.body.title || req.body.propertyTitle || 'Owner Property').trim();
        const address = String(req.body.address || '').trim();
        const locationCode = String(
            req.body.locationCode ||
            req.body.area ||
            req.body.city ||
            ownerLoginId.slice(0, 3) ||
            'GEN'
        ).trim().toUpperCase();

        if (!ownerLoginId) {
            return res.status(400).json({ success: false, message: 'ownerLoginId is required' });
        }

        let property = await Property.findOne({ ownerLoginId }).sort({ createdAt: 1 });
        if (!property) {
            property = await Property.create({
                title: title || 'Owner Property',
                address,
                locationCode,
                ownerLoginId,
                status: 'active',
                isPublished: true
            });
        }

        return res.status(200).json({ success: true, property });
    } catch (err) {
        console.error('ensure-owner property error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
