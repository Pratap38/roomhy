/**
 * BOOKING SYSTEM API ENDPOINTS
 * These endpoints need to be implemented in the backend (Node.js/Express)
 * Database: MongoDB Atlas
 */

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');

// ============================================
// 1. GET BOOKING DETAILS
// ============================================
// GET /api/booking/requests/{bookingId}
router.get('/api/booking/requests/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Find booking in booking_request collection
        const booking = await db.collection('booking_request').findOne({
            _id: new ObjectId(bookingId)
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 2. CONFIRM BOOKING (After Payment)
// ============================================
// POST /api/booking/confirm
router.post('/api/booking/confirm', async (req, res) => {
    try {
        const {
            bookingId,
            userId,
            paymentId,
            fullName,
            phone,
            guardianName,
            guardianPhone,
            address,
            rentAmount,
            propertyId,
            propertyName,
            createdAt
        } = req.body;

        // Verify payment with Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Verify payment exists
        const payment = await razorpay.payments.fetch(paymentId);
        if (!payment || payment.status !== 'captured') {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Generate credentials (same format as rooms.html)
        const credentialUserId = `roomhyweb${Math.floor(Math.random() * 900000) + 100000}`;
        const credentialPassword = generatePassword();

        // Create booking confirmation record
        const bookingConfirmation = {
            bookingId,
            userId,
            paymentId,
            razorpayId: payment.id,
            fullName,
            phone,
            guardianName,
            guardianPhone,
            address,
            documentProof: {
                fileName: 'address_proof', // Handle file upload separately
                fileType: 'pdf/image',
                uploadedAt: new Date()
            },
            rentAmount,
            propertyId,
            propertyName,
            status: 'confirmed',
            credentials: {
                userId: credentialUserId,
                password: credentialPassword
            },
            createdAt: new Date(createdAt),
            updatedAt: new Date()
        };

        // Insert into booking_confirmations collection
        const result = await db.collection('booking_confirmations').insertOne(bookingConfirmation);

        // Update booking_request to mark as confirmed
        await db.collection('booking_request').updateOne(
            { _id: new ObjectId(bookingId) },
            {
                $set: {
                    status: 'confirmed',
                    paymentId: paymentId,
                    confirmationId: result.insertedId,
                    confirmedAt: new Date()
                }
            }
        );

        // Send credentials email
        await sendCredentialsEmail(fullName, phone, credentialUserId, credentialPassword, propertyName);

        res.json({
            success: true,
            message: 'Booking confirmed successfully',
            data: {
                bookingId,
                confirmationId: result.insertedId,
                credentials: {
                    userId: credentialUserId,
                    password: credentialPassword
                }
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 3. SUBMIT REFUND REQUEST
// ============================================
// POST /api/booking/refund-request
router.post('/api/booking/refund-request', async (req, res) => {
    try {
        const {
            bookingId,
            userId,
            paymentId,
            refundType, // 'refund' or 'alternative'
            reason,
            createdAt
        } = req.body;

        // Create refund request record
        const refundRequest = {
            bookingId,
            userId,
            paymentId,
            refundType,
            reason: refundType === 'refund' ? reason : null,
            status: 'pending', // pending, approved, rejected
            createdAt: new Date(createdAt),
            updatedAt: new Date(),
            approvedBy: null
        };

        // Insert into refund_requests collection
        const result = await db.collection('refund_requests').insertOne(refundRequest);

        // Update booking_confirmations status
        await db.collection('booking_confirmations').updateOne(
            { bookingId },
            {
                $set: {
                    status: refundType === 'refund' ? 'refund_pending' : 'alternative_pending',
                    refundRequestId: result.insertedId,
                    updatedAt: new Date()
                }
            }
        );

        // Update booking_request status
        await db.collection('booking_request').updateOne(
            { _id: new ObjectId(bookingId) },
            {
                $set: {
                    status: refundType === 'refund' ? 'refund_requested' : 'alternative_requested',
                    updatedAt: new Date()
                }
            }
        );

        // Notify superadmin
        await notifySuperadmin(bookingId, refundType, reason);

        res.json({
            success: true,
            message: `${refundType === 'refund' ? 'Refund' : 'Alternative property'} request submitted`,
            data: {
                refundRequestId: result.insertedId,
                status: 'pending'
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 4. SEND CREDENTIALS EMAIL
// ============================================
// POST /api/notifications/send-credentials
router.post('/api/notifications/send-credentials', async (req, res) => {
    try {
        const { email, name, userId, password, bookingId } = req.body;

        const emailContent = `
            <h2>Welcome to RoomHy! 🎉</h2>
            <p>Hi ${name},</p>
            <p>Your booking has been confirmed successfully!</p>
            
            <h3>Your Login Credentials:</h3>
            <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>User ID:</strong> ${userId}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL}/website/login.html">Click here</a></p>
            </div>
            
            <h3>Your Booking Details:</h3>
            <p>Booking ID: ${bookingId}</p>
            
            <p>Please keep these credentials safe. You can use them to:</p>
            <ul>
                <li>View your bookings</li>
                <li>Chat with the property owner</li>
                <li>Request refunds or alternative properties</li>
                <li>Access your profile and documents</li>
            </ul>
            
            <p>If you have any issues, please contact our support team.</p>
            
            <p>Best regards,<br/>RoomHy Team</p>
        `;

        await sendEmail(email, 'Your RoomHy Booking Confirmation', emailContent);

        res.json({
            success: true,
            message: 'Credentials email sent successfully'
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 5. GET BOOKING CONFIRMATIONS (For Superadmin)
// ============================================
// GET /api/booking/confirmations?owner_id={ownerId}
router.get('/api/booking/confirmations', async (req, res) => {
    try {
        const { owner_id, status } = req.query;

        let query = {};
        if (owner_id) {
            // Get bookings for this owner
            const ownerBookings = await db.collection('booking_request').find({
                owner_id: owner_id
            }).toArray();
            
            const bookingIds = ownerBookings.map(b => b._id.toString());
            query.bookingId = { $in: bookingIds };
        }

        if (status) {
            query.status = status;
        }

        const confirmations = await db.collection('booking_confirmations')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        // Combine with original booking data
        const combined = await Promise.all(
            confirmations.map(async (conf) => {
                const booking = await db.collection('booking_request').findOne({
                    _id: new ObjectId(conf.bookingId)
                });
                return { ...booking, ...conf };
            })
        );

        res.json({
            success: true,
            data: combined
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 6. GET REFUND REQUESTS (For Superadmin)
// ============================================
// GET /api/booking/refund-requests
router.get('/api/booking/refund-requests', async (req, res) => {
    try {
        const { owner_id, status } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        let refundRequests = await db.collection('refund_requests')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        // Get booking details for each refund
        refundRequests = await Promise.all(
            refundRequests.map(async (req) => {
                const booking = await db.collection('booking_request').findOne({
                    _id: new ObjectId(req.bookingId)
                });
                const confirmation = await db.collection('booking_confirmations').findOne({
                    bookingId: req.bookingId
                });
                return { ...req, booking, confirmation };
            })
        );

        // Filter by owner if provided
        if (owner_id) {
            refundRequests = refundRequests.filter(r => r.booking?.owner_id === owner_id);
        }

        res.json({
            success: true,
            data: refundRequests
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 7. APPROVE REFUND REQUEST
// ============================================
// PUT /api/booking/refund-requests/{refundId}/approve
router.put('/api/booking/refund-requests/:refundId/approve', async (req, res) => {
    try {
        const { refundId } = req.params;
        const { adminId, approvalNotes } = req.body;

        // Get refund request
        const refundRequest = await db.collection('refund_requests').findOne({
            _id: new ObjectId(refundId)
        });

        if (!refundRequest) {
            return res.status(404).json({ success: false, message: 'Refund request not found' });
        }

        // Process refund via Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Create refund
        const refund = await razorpay.payments.refund(refundRequest.paymentId, {
            amount: null, // Full refund
            notes: { refundRequestId: refundId }
        });

        // Update refund request status
        await db.collection('refund_requests').updateOne(
            { _id: new ObjectId(refundId) },
            {
                $set: {
                    status: 'approved',
                    approvedBy: adminId,
                    approvalNotes,
                    razorpayRefundId: refund.id,
                    approvedAt: new Date()
                }
            }
        );

        // Update booking confirmation
        await db.collection('booking_confirmations').updateOne(
            { bookingId: refundRequest.bookingId },
            {
                $set: {
                    status: 'refunded',
                    refundId: refund.id,
                    updatedAt: new Date()
                }
            }
        );

        // Send email to user
        const confirmation = await db.collection('booking_confirmations').findOne({
            bookingId: refundRequest.bookingId
        });

        await sendEmail(
            confirmation.phone, // or email if available
            'Your Refund Has Been Approved',
            `Dear ${confirmation.fullName},\n\nYour refund of ₹${confirmation.rentAmount} has been approved and will be processed within 5-7 business days.\n\nRefund ID: ${refund.id}\n\nThank you for using RoomHy!`
        );

        res.json({
            success: true,
            message: 'Refund approved and processed',
            data: { razorpayRefundId: refund.id }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 8. REJECT REFUND REQUEST
// ============================================
// PUT /api/booking/refund-requests/{refundId}/reject
router.put('/api/booking/refund-requests/:refundId/reject', async (req, res) => {
    try {
        const { refundId } = req.params;
        const { adminId, rejectionReason } = req.body;

        // Update refund request status
        await db.collection('refund_requests').updateOne(
            { _id: new ObjectId(refundId) },
            {
                $set: {
                    status: 'rejected',
                    approvedBy: adminId,
                    rejectionReason,
                    rejectedAt: new Date()
                }
            }
        );

        // Get booking confirmation for email
        const refund = await db.collection('refund_requests').findOne({
            _id: new ObjectId(refundId)
        });

        const confirmation = await db.collection('booking_confirmations').findOne({
            bookingId: refund.bookingId
        });

        // Send rejection email
        await sendEmail(
            confirmation.phone,
            'Update on Your Refund Request',
            `Dear ${confirmation.fullName},\n\nWe have reviewed your refund request.\n\nReason for rejection: ${rejectionReason}\n\nPlease contact our support team if you have any questions.\n\nBest regards,\nRoomHy Team`
        );

        res.json({
            success: true,
            message: 'Refund request rejected'
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generatePassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function sendEmail(to, subject, content) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: content
    };

    return transporter.sendMail(mailOptions);
}

async function sendCredentialsEmail(fullName, phone, userId, password, propertyName) {
    // Send email via sendEmail function
    const subject = 'Your RoomHy Booking Confirmation & Login Credentials';
    const content = `
        <h2>Welcome to RoomHy! 🎉</h2>
        <p>Hi ${fullName},</p>
        <p>Your booking for ${propertyName} has been confirmed successfully!</p>
        
        <h3>Your Login Credentials:</h3>
        <div style="background: #f0f4ff; padding: 20px; border-radius: 8px;">
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Password:</strong> ${password}</p>
        </div>
        
        <p>Login at: ${process.env.FRONTEND_URL}/website/login.html</p>
        <p>Please keep these credentials safe.</p>
    `;
    
    return sendEmail(phone, subject, content);
}

async function notifySuperadmin(bookingId, refundType, reason) {
    const subject = `New ${refundType === 'refund' ? 'Refund' : 'Alternative Property'} Request - Booking ${bookingId}`;
    const content = `
        <p>A new ${refundType} request has been submitted.</p>
        <p>Booking ID: ${bookingId}</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ''}
        <p>Please review in the superadmin panel.</p>
    `;
    
    return sendEmail(process.env.ADMIN_EMAIL, subject, content);
}

module.exports = router;
