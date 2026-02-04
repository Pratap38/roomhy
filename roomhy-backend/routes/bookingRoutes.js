const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// ================== BOOKING REQUEST ROUTES ==================

// Create booking request or bid (new unified endpoint)
router.post('/create', bookingController.createBookingRequest);

// Create bulk booking request (for filtered properties)
router.post('/bulk-create', bookingController.createBulkBookingRequest);

// Create booking request or bid (legacy)
router.post('/requests', bookingController.createBookingRequest);

// Get all booking requests (filtered by area, request_type, status)
router.get('/requests', bookingController.getBookingRequests);

// Get user bookings (tenant's mystays page) - MUST BE BEFORE /requests/:id route
router.get('/user/:userId', bookingController.getUserBookings);

// Confirm booking from booking form (save all tenant data) - MUST BE BEFORE /:id route
router.post('/confirm', bookingController.confirmBooking);

// ================== REFUND REQUEST ROUTES (BEFORE generic /:id route) ==================

// Create refund request (user submits refund/alternative property request)
router.post('/refund-request', bookingController.createRefundRequest);

// Get all refund requests (for superadmin dashboard) - MUST BE BEFORE /refund-request/:id
router.get('/refund-requests', bookingController.getAllRefundRequests);

// Get refund request by ID
router.get('/refund-request/:id', bookingController.getRefundRequestById);

// Create Razorpay order for refund
router.post('/refund-request/:id/create-order', bookingController.createRefundOrder);

// Process refund (admin approves and refunds money)
router.post('/refund-request/:id/process', bookingController.processRefund);

// Process refund with Razorpay payment
router.post('/refund-request/:id/process-payment', bookingController.processRefundPayment);

// Update refund request status
router.put('/refund-request/:id/status', bookingController.updateRefundRequestStatus);

// ================== PROPERTY HOLD ROUTES ==================

// Check if property is on hold
router.get('/hold/:property_id', bookingController.checkPropertyHold);

// Release property hold
router.put('/hold/:property_id/release', bookingController.releasePropertyHold);

// Get booking request by ID (supports both /bookings/:id and /booking/requests/:id paths) - MUST BE LAST
router.get('/:id', bookingController.getBookingRequestById);
router.get('/requests/:id', bookingController.getBookingRequestById);

// Update booking status (approve, reject, or schedule visit)
router.put('/requests/:id/status', bookingController.updateBookingStatus);

// Approve booking
router.put('/requests/:id/approve', bookingController.approveBooking);

// Reject booking
router.put('/requests/:id/reject', bookingController.rejectBooking);

// Schedule visit
router.post('/requests/:id/schedule-visit', bookingController.scheduleVisit);

// Delete booking
router.delete('/requests/:id', bookingController.deleteBooking);

// Update chat decision (like/reject)
router.put('/requests/:id/decision', bookingController.updateChatDecision);

module.exports = router;
