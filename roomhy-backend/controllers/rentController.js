const Rent = require('../models/Rent');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const nodemailer = require('nodemailer');

// Configure email transporter (using Gmail SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    }
});

// Create rent record for tenant
exports.createRent = async (req, res) => {
    try {
        const { tenantId, propertyId, rentAmount, deposit, tenantName, tenantEmail, tenantPhone, roomNumber, ownerLoginId, area } = req.body;

        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ error: 'Property not found' });

        const rent = new Rent({
            tenantId,
            propertyId,
            propertyName: property.title,
            rentAmount,
            deposit,
            totalDue: rentAmount + (deposit || 0),
            tenantName,
            tenantEmail,
            tenantPhone,
            roomNumber,
            area,
            ownerLoginId,
            collectionMonth: new Date().toISOString().slice(0, 7)
        });

        await rent.save();
        res.json({ success: true, rent });
    } catch (err) {
        console.error('Create rent error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get all rents for owner with filtering
exports.getRentsByOwner = async (req, res) => {
    try {
        const { ownerLoginId } = req.params;
        const { month, status } = req.query;

        let query = { ownerLoginId };
        if (month) query.collectionMonth = month;
        if (status) query.paymentStatus = status;

        const rents = await Rent.find(query).sort({ updatedAt: -1 }).populate('tenantId', 'name email phone').populate('propertyId', 'title');

        res.json({ success: true, rents });
    } catch (err) {
        console.error('Get rents error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get all rents (superadmin view)
exports.getAllRents = async (req, res) => {
    try {
        const { month, status, ownerLoginId, paymentStatus } = req.query;
        let query = {};

        if (month) query.collectionMonth = month;
        if (status) query.paymentStatus = status;
        if (ownerLoginId) query.ownerLoginId = ownerLoginId;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const rents = await Rent.find(query)
            .sort({ createdAt: -1 })
            .populate('tenantId', 'name email phone')
            .populate('propertyId', 'title');

        res.json({ success: true, rents });
    } catch (err) {
        console.error('Get all rents error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get single rent
exports.getRent = async (req, res) => {
    try {
        const { rentId } = req.params;
        const rent = await Rent.findById(rentId).populate('tenantId').populate('propertyId');
        if (!rent) return res.status(404).json({ error: 'Rent not found' });
        res.json({ success: true, rent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update payment status after successful Razorpay payment
exports.recordPayment = async (req, res) => {
    try {
        const { rentId, razorpayPaymentId, paidAmount, paymentMethod } = req.body;

        const rent = await Rent.findById(rentId);
        if (!rent) return res.status(404).json({ error: 'Rent not found' });

        rent.paidAmount = (rent.paidAmount || 0) + paidAmount;
        rent.razorpayPaymentId = razorpayPaymentId;
        rent.paymentMethod = paymentMethod || 'razorpay';
        rent.paymentDate = new Date();

        if (rent.paidAmount >= rent.totalDue) {
            rent.paymentStatus = 'paid';
        } else if (rent.paidAmount > 0) {
            rent.paymentStatus = 'partially_paid';
        }

        await rent.save();

        // Send payment confirmation email
        await sendPaymentConfirmationEmail(rent);

        res.json({ success: true, rent, message: 'Payment recorded successfully' });
    } catch (err) {
        console.error('Record payment error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Record payment by tenant (for Razorpay callback)
exports.recordPaymentByTenant = async (req, res) => {
    try {
        const { tenantId, razorpayPaymentId, paidAmount, paymentMethod } = req.body;

        console.log(`🔍 [recordPaymentByTenant] Searching for rent - tenantId: ${tenantId}, amount: ${paidAmount}`);

        if (!tenantId || !paidAmount) {
            return res.status(400).json({ error: 'tenantId and paidAmount required' });
        }

        // Find the most recent unpaid or partially paid rent for this tenant
        // Search by tenantLoginId (string field) instead of tenantId (ObjectId)
        let rent = await Rent.findOne({
            $and: [
                {
                    $or: [
                        { tenantLoginId: tenantId }, // Primary search by login ID
                        { tenantEmail: tenantId } // Try email as fallback
                    ]
                },
                {
                    $or: [
                        { paymentStatus: { $in: ['pending', 'partially_paid'] } },
                        { paymentStatus: { $exists: false } }
                    ]
                }
            ]
        }).sort({ dueDate: -1 });

        console.log(`📊 [recordPaymentByTenant] Rent found:`, rent ? 'YES' : 'NO');

        if (!rent) {
            // If not found, try to create a minimal rent record for this first payment
            console.log(`⚠️ [recordPaymentByTenant] No rent found. Attempting to create one...`);
            
            rent = new Rent({
                tenantLoginId: tenantId,
                tenantName: `Tenant ${tenantId}`,
                tenantEmail: 'unknown@email.com',
                rentAmount: paidAmount, // Use paid amount as rent amount
                totalDue: paidAmount,
                paidAmount: paidAmount,
                paymentStatus: paidAmount > 0 ? 'paid' : 'pending',
                paymentMethod: paymentMethod || 'razorpay',
                razorpayPaymentId: razorpayPaymentId,
                paymentDate: new Date(),
                collectionMonth: new Date().toISOString().slice(0, 7)
            });
            
            await rent.save();
            console.log(`✅ [recordPaymentByTenant] Created new rent record: ${rent._id}`);
            
            // Send confirmation
            await sendPaymentConfirmationEmail(rent);
            
            return res.json({ 
                success: true, 
                rent, 
                message: 'Payment recorded and rent record created',
                paymentStatus: rent.paymentStatus,
                isNewRecord: true
            });
        }
        
        console.log(`✅ [recordPaymentByTenant] Found rent: ${rent._id}`);

        rent.paidAmount = (rent.paidAmount || 0) + paidAmount;
        rent.razorpayPaymentId = razorpayPaymentId;
        rent.paymentMethod = paymentMethod || 'razorpay';
        rent.paymentDate = new Date();

        // Update payment status
        if (rent.paidAmount >= rent.totalDue) {
            rent.paymentStatus = 'paid';
            console.log(`💳 [recordPaymentByTenant] Payment complete: ₹${rent.paidAmount} >= ₹${rent.totalDue}`);
        } else if (rent.paidAmount > 0) {
            rent.paymentStatus = 'partially_paid';
            console.log(`💳 [recordPaymentByTenant] Partial payment: ₹${rent.paidAmount} of ₹${rent.totalDue}`);
        }

        await rent.save();

        // Send payment confirmation email
        await sendPaymentConfirmationEmail(rent);

        console.log(`✅ Payment recorded for tenant ${tenantId}: ₹${paidAmount}`);

        res.json({ 
            success: true, 
            rent, 
            message: 'Payment recorded successfully',
            paymentStatus: rent.paymentStatus
        });
    } catch (err) {
        console.error('❌ Record payment by tenant error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to record payment' });
    }
};;

// Send payment confirmation email
async function sendPaymentConfirmationEmail(rent) {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER || 'roomhy@gmail.com',
            to: rent.tenantEmail,
            subject: `Payment Confirmation - ${rent.propertyName}`,
            html: `
                <h2>Payment Confirmation</h2>
                <p>Dear ${rent.tenantName},</p>
                <p>Your rent payment has been recorded successfully.</p>
                <hr>
                <p><strong>Payment Details:</strong></p>
                <ul>
                    <li>Property: ${rent.propertyName}</li>
                    <li>Amount Paid: ₹${rent.paidAmount}</li>
                    <li>Total Due: ₹${rent.totalDue}</li>
                    <li>Payment Status: ${rent.paymentStatus}</li>
                    <li>Payment Date: ${new Date(rent.paymentDate).toLocaleDateString()}</li>
                </ul>
                <p>Thank you for your payment!</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Payment confirmation email sent to', rent.tenantEmail);
    } catch (err) {
        console.error('❌ Failed to send payment email:', err.message);
    }
}

// Send rent reminder (called during collection period: 10-15th)
exports.sendRentReminder = async (req, res) => {
    try {
        const today = new Date().getDate();
        
        if (today < 10 || today > 15) {
            return res.json({ message: 'Not in collection period (10-15th)' });
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        const pendingRents = await Rent.find({
            collectionMonth: currentMonth,
            paymentStatus: { $in: ['pending', 'partially_paid'] }
        });

        let sent = 0;
        for (const rent of pendingRents) {
            const emailSent = await sendRentReminderEmail(rent, 'initial');
            if (emailSent) {
                rent.reminders.push({
                    sentAt: new Date(),
                    type: 'initial',
                    status: 'sent',
                    message: 'Initial rent reminder'
                });
                await rent.save();
                sent++;
            }
        }

        res.json({ success: true, sent, message: `Sent ${sent} rent reminders` });
    } catch (err) {
        console.error('Send reminder error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Send delayed payment reminder (3x daily for overdue rents)
exports.sendDelayedPaymentReminder = async (req, res) => {
    try {
        const today = new Date().getDate();
        
        if (today > 15 && today <= 31) {
            // Collection period ended, find overdue rents
            const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
            
            const overdueRents = await Rent.find({
                collectionMonth: lastMonth,
                paymentStatus: { $in: ['pending', 'partially_paid', 'overdue'] }
            });

            let sent = 0;
            for (const rent of overdueRents) {
                // Limit to 3 reminders per day for each rent
                const todayReminders = rent.reminders.filter(r => {
                    const sentDate = new Date(r.sentAt);
                    return sentDate.toDateString() === new Date().toDateString() && r.type.includes('delayed');
                });

                if (todayReminders.length < 3) {
                    const reminderType = `delayed_${todayReminders.length + 1}`;
                    const emailSent = await sendDelayedReminderEmail(rent, reminderType);
                    
                    if (emailSent) {
                        rent.paymentStatus = 'overdue';
                        if (!rent.overdueStartDate) rent.overdueStartDate = new Date();
                        
                        rent.reminders.push({
                            sentAt: new Date(),
                            type: reminderType,
                            status: 'sent',
                            message: `Delayed payment reminder #${todayReminders.length + 1}`
                        });
                        await rent.save();
                        sent++;
                    }
                }
            }

            res.json({ success: true, sent, message: `Sent ${sent} delayed payment reminders` });
        } else {
            res.json({ message: 'Collection period still active' });
        }
    } catch (err) {
        console.error('Send delayed reminder error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Email function for rent reminder
async function sendRentReminderEmail(rent, type = 'initial') {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER || 'roomhy@gmail.com',
            to: rent.tenantEmail,
            cc: process.env.ADMIN_EMAIL || '',
            subject: `Rent Due Reminder - ${rent.propertyName}`,
            html: `
                <h2>Rent Due Reminder</h2>
                <p>Dear ${rent.tenantName},</p>
                <p>This is a reminder that rent is due between <strong>10th to 15th</strong> of the month.</p>
                <hr>
                <p><strong>Rent Details:</strong></p>
                <ul>
                    <li>Property: ${rent.propertyName}</li>
                    <li>Room: ${rent.roomNumber}</li>
                    <li>Rent Amount: ₹${rent.rentAmount}</li>
                    <li>Collection Period: 10th - 15th of the month</li>
                    <li>Current Month: ${rent.collectionMonth}</li>
                </ul>
                <p style="color: #d32f2f;"><strong>Please complete your payment by 15th to avoid late fees.</strong></p>
                <p>Click the button below to pay online:</p>
                <a href="http://localhost:5001/tenant/tenantsign-in.html" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Rent reminder email sent to', rent.tenantEmail);
        return true;
    } catch (err) {
        console.error('❌ Failed to send rent reminder:', err.message);
        return false;
    }
}

// Email function for delayed payment reminder
async function sendDelayedReminderEmail(rent, reminderType) {
    try {
        const reminderNumber = reminderType.split('_')[1];
        const urgency = ['', 'URGENT', 'VERY URGENT', 'FINAL NOTICE'];
        
        const mailOptions = {
            from: process.env.GMAIL_USER || 'roomhy@gmail.com',
            to: rent.tenantEmail,
            cc: process.env.ADMIN_EMAIL || '',
            subject: `${urgency[reminderNumber]} - Overdue Rent Payment - ${rent.propertyName}`,
            html: `
                <h2 style="color: #d32f2f;">${urgency[reminderNumber]}</h2>
                <p>Dear ${rent.tenantName},</p>
                <p style="color: #d32f2f; font-weight: bold;">Your rent payment is overdue!</p>
                <hr>
                <p><strong>Overdue Details:</strong></p>
                <ul>
                    <li>Property: ${rent.propertyName}</li>
                    <li>Room: ${rent.roomNumber}</li>
                    <li>Amount Due: ₹${rent.totalDue - rent.paidAmount}</li>
                    <li>Due Date: 15th of ${rent.collectionMonth}</li>
                    <li>Days Overdue: ${getDaysOverdue(rent.overdueStartDate)}</li>
                </ul>
                <p style="color: #d32f2f; background-color: #fff3cd; padding: 10px; border-left: 4px solid #d32f2f;">
                    <strong>Reminder #${reminderNumber}:</strong> Please arrange payment immediately to avoid late fees and legal action.
                </p>
                <a href="http://localhost:5001/tenant/tenantsign-in.html" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Delayed payment reminder #${reminderNumber} sent to`, rent.tenantEmail);
        return true;
    } catch (err) {
        console.error('❌ Failed to send delayed reminder:', err.message);
        return false;
    }
}

// Helper function to calculate days overdue
function getDaysOverdue(overdueStartDate) {
    if (!overdueStartDate) return 0;
    const today = new Date();
    const start = new Date(overdueStartDate);
    return Math.floor((today - start) / (1000 * 60 * 60 * 24));
}

// Update rent details (admin)
exports.updateRent = async (req, res) => {
    try {
        const { rentId } = req.params;
        const updateData = req.body;

        const rent = await Rent.findByIdAndUpdate(rentId, { $set: updateData }, { new: true });
        if (!rent) return res.status(404).json({ error: 'Rent not found' });

        res.json({ success: true, rent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete rent record
exports.deleteRent = async (req, res) => {
    try {
        const { rentId } = req.params;
        await Rent.findByIdAndDelete(rentId);
        res.json({ success: true, message: 'Rent deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create Razorpay order for rent payment
exports.createRazorpayOrder = async (req, res) => {
    try {
        const Razorpay = require('razorpay');
        const { amount, tenantId, rentId, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Check if Razorpay credentials are configured
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret || keySecret === 'your_key_secret_here') {
            console.error('⚠️  Razorpay credentials not configured. Add to .env file:');
            console.error('RAZORPAY_KEY_ID=rzp_test_xxxxx');
            console.error('RAZORPAY_KEY_SECRET=your_actual_key_secret');
            return res.status(500).json({ 
                error: 'Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file',
                instructions: 'Get your credentials from https://dashboard.razorpay.com/app/keys'
            });
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });

        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `rent_${rentId || tenantId}_${Date.now()}`,
            notes: {
                tenantId: tenantId || 'unknown',
                rentId: rentId || 'unknown',
                description: description || 'Rent Payment'
            }
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            },
            key: keyId
        });
    } catch (err) {
        console.error('Razorpay order creation error:', err);
        res.status(500).json({ error: err.message || 'Failed to create payment order' });
    }
};
