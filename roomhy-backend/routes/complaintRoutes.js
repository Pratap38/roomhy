const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');

// Get all complaints for a specific tenant
router.get('/tenant/:tenantId', complaintController.getTenantComplaints);

// Create a new complaint
router.post('/', complaintController.createComplaint);

// Update complaint status
router.put('/:id/status', complaintController.updateComplaintStatus);

// Get all complaints
router.get('/', complaintController.getAllComplaints);

// Delete a complaint
router.delete('/:id', complaintController.deleteComplaint);

//response router by pratap
router.put('/:id/response', complaintController.updateOwnerResponse);

module.exports = router;