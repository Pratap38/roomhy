/**
 * Bidding System - Backend Routes Template
 * File: routes/bidding.js
 * 
 * This template provides the backend API endpoints for the bidding workflow.
 * Replace this with actual MongoDB queries and payment gateway integration.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your auth middleware
const Bid = require('../models/Bid');
const Payment = require('../models/Payment');
const Visit = require('../models/Visit');
const Chat = require('../models/Chat');
const User = require('../models/User');

// ============================================
// 1. CREATE BID
// ============================================
router.post('/bids/create', auth, async (req, res) => {
  try {
    const {
      propertyId,
      propertyTitle,
      bidType,
      activationFee,
      visitSecurity,
      totalAmount,
      paymentId
    } = req.body;

    const studentId = req.user._id; // From auth middleware

    // Validate student is logged in
    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Validate bid data
    if (!propertyId || !propertyTitle || !bidType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if student already has pending bid on this property
    const existingBid = await Bid.findOne({
      propertyId,
      studentId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingBid) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already have an active bid on this property' 
      });
    }

    // Create new bid
    const newBid = new Bid({
      propertyId,
      propertyTitle,
      bidType,
      studentId,
      activationFee,
      visitSecurity,
      totalAmount,
      paymentId,
      status: 'pending',
      expiryAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      visitsScheduled: 0,
      visitsAllowed: 2,
      chatOpen: false,
      paymentStatus: 'pending'
    });

    await newBid.save();

    // Create payment record
    const payment = new Payment({
      paymentId,
      bidId: newBid._id,
      studentId,
      amount: totalAmount,
      type: 'bid',
      status: 'pending'
    });

    await payment.save();

    // Process payment with payment gateway (Razorpay/Stripe)
    // TODO: Integrate Razorpay or Stripe API
    const paymentProcessed = await processPaymentWithGateway(paymentId, totalAmount);

    if (paymentProcessed.success) {
      newBid.paymentStatus = 'success';
      payment.status = 'success';
      payment.transactionId = paymentProcessed.transactionId;
      await newBid.save();
      await payment.save();
    } else {
      newBid.paymentStatus = 'failed';
      payment.status = 'failed';
      await newBid.save();
      await payment.save();
      return res.status(400).json({ 
        success: false, 
        error: 'Payment processing failed: ' + paymentProcessed.message 
      });
    }

    // Send notifications
    // TODO: Email to student
    // TODO: Push notification to property owners
    // TODO: SMS confirmation

    // If "Bid to All", send to all matching properties
    if (bidType === 'Bid to All') {
      await notifyAllMatchingProperties(propertyId, newBid);
    } else {
      // If "Bid Now", send to single property owner
      await notifyPropertyOwner(propertyId, newBid);
    }

    res.json({
      success: true,
      bidId: newBid._id,
      message: 'Bid created successfully',
      data: {
        _id: newBid._id,
        propertyId: newBid.propertyId,
        studentId: newBid.studentId,
        status: newBid.status,
        createdAt: newBid.createdAt,
        expiryAt: newBid.expiryAt
      }
    });

  } catch (error) {
    console.error('Bid creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 2. GET STUDENT BIDS
// ============================================
router.get('/bids/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, limit = 20, skip = 0 } = req.query;

    // Verify user can only see their own bids
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const query = { studentId };
    if (status) query.status = status;

    const bids = await Bid.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 })
      .select('-paymentId'); // Hide sensitive data

    const total = await Bid.countDocuments(query);

    res.json({
      success: true,
      bids,
      total,
      page: Math.floor(parseInt(skip) / parseInt(limit)) + 1
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 3. ACCEPT/REJECT BID (Owner)
// ============================================
router.patch('/bids/:bidId/respond', auth, async (req, res) => {
  try {
    const { bidId } = req.params;
    const { action, message } = req.body;
    const propertyOwnerId = req.user._id;

    // Validate action
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    // Verify owner owns this property
    // TODO: Check ownership in database
    // const property = await Property.findById(bid.propertyId);
    // if (property.ownerId.toString() !== propertyOwnerId.toString()) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }

    if (action === 'accept') {
      bid.status = 'accepted';
      bid.propertyOwnerId = propertyOwnerId;
      bid.acceptedAt = new Date();

      // Open chat
      const chat = new Chat({
        bidId: bid._id,
        studentId: bid.studentId,
        propertyOwnerId: propertyOwnerId,
        status: 'active',
        expiresAt: bid.expiryAt
      });
      await chat.save();

      bid.chatId = chat._id;
      bid.chatOpen = true;
      bid.chatOpenedAt = new Date();

      // Send notifications
      await sendNotification({
        userId: bid.studentId,
        type: 'bid_accepted',
        title: '🎉 Owner Accepted Your Bid!',
        message: `Owner accepted your bid for ${bid.propertyTitle}. Chat is now open.`,
        bidId: bid._id
      });

    } else if (action === 'reject') {
      bid.status = 'rejected';
      bid.rejectedAt = new Date();

      // Refund activation fee to student
      await refundPayment({
        bidId: bid._id,
        amount: bid.activationFee,
        reason: 'bid_rejected'
      });

      // Send notifications
      await sendNotification({
        userId: bid.studentId,
        type: 'bid_rejected',
        title: '📋 Bid Not Accepted',
        message: `Your bid for ${bid.propertyTitle} was not accepted. Your activation fee has been refunded.`,
        bidId: bid._id
      });
    }

    await bid.save();

    res.json({
      success: true,
      bidId: bid._id,
      status: bid.status,
      chatEnabled: action === 'accept',
      message: `Bid ${action}ed successfully`
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 4. SCHEDULE VISIT
// ============================================
router.post('/bids/:bidId/visits', auth, async (req, res) => {
  try {
    const { bidId } = req.params;
    const { studentId, visitDate, visitTime, notes } = req.body;

    // Verify auth
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    // Validate bid is accepted
    if (bid.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Visit can only be scheduled after owner accepts' 
      });
    }

    // Validate visit count
    if (bid.visitsScheduled >= bid.visitsAllowed) {
      return res.status(400).json({ 
        success: false, 
        error: `Maximum ${bid.visitsAllowed} visits allowed` 
      });
    }

    // Validate visit date (minimum 24 hours in future)
    const visitDateTime = new Date(`${visitDate}T${visitTime}`);
    if (visitDateTime < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Visit must be scheduled at least 24 hours in advance' 
      });
    }

    // Create visit
    const visit = new Visit({
      bidId: bid._id,
      studentId: bid.studentId,
      propertyId: bid.propertyId,
      propertyOwnerId: bid.propertyOwnerId,
      visitDate: visitDateTime,
      visitTime,
      notes,
      status: 'scheduled',
      securityStatus: 'held',
      securityAmount: bid.visitSecurity
    });

    await visit.save();

    bid.visitsScheduled += 1;
    await bid.save();

    // Send notifications
    await sendNotification({
      userId: bid.propertyOwnerId,
      type: 'visit_scheduled',
      title: '📅 New Visit Request',
      message: `Student scheduled a visit for ${visitDate} at ${visitTime}`,
      bidId: bid._id,
      visitId: visit._id
    });

    res.json({
      success: true,
      visitId: visit._id,
      bidId: bid._id,
      status: 'scheduled',
      visitNumber: `${bid.visitsScheduled} of ${bid.visitsAllowed}`,
      securityStatus: 'held',
      securityAmount: bid.visitSecurity
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 5. UPDATE VISIT STATUS
// ============================================
router.patch('/visits/:visitId/status', auth, async (req, res) => {
  try {
    const { visitId } = req.params;
    const { status, notes } = req.body;

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    // Verify owner
    if (req.user._id.toString() !== visit.propertyOwnerId.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const validStatuses = ['scheduled', 'completed', 'no-show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    visit.status = status;
    if (notes) visit.notes = notes;

    if (status === 'no-show') {
      visit.securityStatus = 'forfeited';
    } else if (status === 'cancelled') {
      visit.securityStatus = 'refunded';
      // Refund security
      await refundPayment({
        bidId: visit.bidId,
        amount: visit.securityAmount,
        reason: 'visit_cancelled'
      });
    } else if (status === 'completed') {
      visit.securityStatus = 'held'; // Still held until booking
    }

    await visit.save();

    res.json({
      success: true,
      visitId: visit._id,
      status: visit.status,
      securityStatus: visit.securityStatus
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 6. OPEN CHAT (After Acceptance)
// ============================================
router.post('/chats/init', auth, async (req, res) => {
  try {
    const { bidId, studentId, propertyOwnerId } = req.body;

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    // Verify bid is accepted
    if (bid.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Chat can only be opened after owner accepts' 
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({ bidId });
    
    if (!chat) {
      chat = new Chat({
        bidId,
        studentId,
        propertyOwnerId,
        status: 'active',
        expiresAt: bid.expiryAt
      });
      await chat.save();
    }

    res.json({
      success: true,
      chatId: chat._id,
      participants: [
        { userId: studentId, role: 'student', name: 'Student' },
        { userId: propertyOwnerId, role: 'owner', name: 'Owner' }
      ],
      status: 'active',
      expiresAt: chat.expiresAt
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 7. SEND CHAT MESSAGE
// ============================================
router.post('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, message } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    // Verify sender is part of chat
    if (req.user._id.toString() !== senderId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Block direct phone/WhatsApp sharing
    if (isPhoneOrWhatsAppNumber(message)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sharing phone numbers or WhatsApp details is not allowed. Contact will be provided after booking.' 
      });
    }

    const msg = {
      _id: new mongoose.Types.ObjectId(),
      senderId,
      message,
      timestamp: new Date(),
      status: 'delivered'
    };

    chat.messages.push(msg);
    await chat.save();

    // Send push notification to recipient
    const recipientId = senderId === chat.studentId ? chat.propertyOwnerId : chat.studentId;
    await sendNotification({
      userId: recipientId,
      type: 'chat_message',
      title: 'New message in chat',
      message: message.substring(0, 50) + '...',
      chatId: chat._id
    });

    res.json({
      success: true,
      messageId: msg._id,
      status: 'delivered'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 8. PROCESS PAYMENT
// ============================================
router.post('/payments/process', auth, async (req, res) => {
  try {
    const {
      bidId,
      studentId,
      amount,
      activationFee,
      visitSecurity,
      paymentMethod,
      upiId,
      orderId
    } = req.body;

    // Verify student
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // TODO: Integrate Razorpay/Stripe
    const paymentResult = await processPaymentWithGateway({
      orderId,
      amount: amount * 100, // Convert to paise for Razorpay
      method: paymentMethod,
      upiId
    });

    if (!paymentResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment failed: ' + paymentResult.message 
      });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { paymentId: orderId },
      {
        status: 'success',
        transactionId: paymentResult.transactionId,
        completedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      paymentId: payment.paymentId,
      transactionId: paymentResult.transactionId,
      amount,
      status: 'success',
      details: {
        activationFeeCharged: activationFee,
        visitSecurityHeld: visitSecurity
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 9. REFUND SECURITY
// ============================================
router.post('/payments/refund-security', auth, async (req, res) => {
  try {
    const { visitId, bidId, studentId, reason, refundAmount } = req.body;

    // Verify student or owner
    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    // TODO: Process refund with payment gateway
    const refundResult = await refundWithGateway({
      originalTransactionId: bid.paymentId,
      amount: refundAmount * 100 // Convert to paise
    });

    if (!refundResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Refund failed: ' + refundResult.message 
      });
    }

    // Create refund record
    const refund = new Payment({
      bidId,
      studentId,
      amount: refundAmount,
      type: 'refund',
      status: 'success',
      reason,
      transactionId: refundResult.refundId,
      completedAt: new Date()
    });

    await refund.save();

    // Send notification
    await sendNotification({
      userId: studentId,
      type: 'refund_processed',
      title: '💰 Refund Processed',
      message: `₹${refundAmount} has been refunded to your account. It will reflect in 2-3 business days.`
    });

    res.json({
      success: true,
      refundId: refund._id,
      amount: refundAmount,
      status: 'processed',
      estimatedCredit: '2-3 business days'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 10. AUTO-EXPIRE BIDS (Scheduled Job)
// ============================================
router.post('/bids/auto-expire', async (req, res) => {
  try {
    // This should be called by a scheduled job (node-cron)
    const now = new Date();
    
    const expiredBids = await Bid.find({
      status: 'pending',
      expiryAt: { $lt: now }
    });

    let refundCount = 0;
    let totalRefunded = 0;

    for (const bid of expiredBids) {
      bid.status = 'expired';
      await bid.save();

      // Refund activation fee
      await refundPayment({
        bidId: bid._id,
        amount: bid.activationFee,
        reason: 'bid_expired'
      });

      // Refund visit security if held
      if (bid.visitSecurity > 0) {
        await refundPayment({
          bidId: bid._id,
          amount: bid.visitSecurity,
          reason: 'bid_expired'
        });
      }

      totalRefunded += bid.activationFee + bid.visitSecurity;
      refundCount++;

      // Close chat if open
      if (bid.chatOpen) {
        await Chat.findByIdAndUpdate(bid.chatId, { status: 'closed', closedAt: new Date() });
      }

      // Send notification
      await sendNotification({
        userId: bid.studentId,
        type: 'bid_expired',
        title: '📅 Bid Expired',
        message: `Your bid for ${bid.propertyTitle} has expired. Your refund has been processed.`
      });
    }

    res.json({
      success: true,
      message: 'Auto-expiry processed',
      expired: refundCount,
      refunded: refundCount,
      totalRefunded
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Helper Functions
// ============================================

async function processPaymentWithGateway(paymentData) {
  // TODO: Implement Razorpay/Stripe integration
  // This is a placeholder
  return {
    success: true,
    transactionId: 'txn_' + Date.now(),
    amount: paymentData.amount || 0
  };
}

async function refundPayment(refundData) {
  // TODO: Implement refund logic
  console.log('Refunding:', refundData);
  return { success: true };
}

async function refundWithGateway(refundData) {
  // TODO: Implement payment gateway refund
  return {
    success: true,
    refundId: 'rfnd_' + Date.now()
  };
}

async function notifyAllMatchingProperties(propertyId, bid) {
  // TODO: Find all matching properties and send notifications
  console.log('Notifying matching properties for bid:', bid._id);
}

async function notifyPropertyOwner(propertyId, bid) {
  // TODO: Send notification to specific property owner
  console.log('Notifying property owner for bid:', bid._id);
}

async function sendNotification(notifData) {
  // TODO: Implement email/SMS/push notification
  console.log('Sending notification:', notifData);
}

function isPhoneOrWhatsAppNumber(message) {
  // Regex to detect phone numbers
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  return phoneRegex.test(message);
}

module.exports = router;
