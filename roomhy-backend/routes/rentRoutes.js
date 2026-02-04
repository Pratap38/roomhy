const express = require('express');
const router = express.Router();
const rentController = require('../controllers/rentController');

// Create new rent record
router.post('/', rentController.createRent);

// Get all rents (superadmin view)
router.get('/', rentController.getAllRents);

// Get rents for specific owner
router.get('/owner/:ownerLoginId', rentController.getRentsByOwner);

// Send rent reminders (normal 10-15th period) - BEFORE parameterized routes
router.post('/reminders/send', rentController.sendRentReminder);

// Send delayed payment reminders (3x daily after 15th) - BEFORE parameterized routes
router.post('/reminders/delayed', rentController.sendDelayedPaymentReminder);

// Create Razorpay order for rent payment - BEFORE parameterized routes
router.post('/create-order', rentController.createRazorpayOrder);

// Record payment by tenant (for Razorpay callback) - BEFORE parameterized routes
router.post('/record-payment', rentController.recordPaymentByTenant);
router.post('/record-payment-by-tenant', rentController.recordPaymentByTenant);

// Get single rent
router.get('/:rentId', rentController.getRent);

// Record payment after Razorpay success
router.post('/:rentId/payment', rentController.recordPayment);

// Update rent details
router.patch('/:rentId', rentController.updateRent);

// Delete rent record
router.delete('/:rentId', rentController.deleteRent);

module.exports = router;
