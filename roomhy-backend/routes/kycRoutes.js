const express = require('express');
const router = express.Router();
const KYCVerification = require('../models/KYCVerification');

// Get all signups from MongoDB
router.get('/', async (req, res) => {
    try {
        const signups = await KYCVerification.find().select('-password');
        console.log(`✓ Retrieved ${signups.length} signups from MongoDB`);
        res.json(signups);
    } catch (error) {
        console.error('Error fetching signups:', error);
        res.status(500).json({ message: 'Error fetching signups', error: error.message });
    }
});

// Submit new signup
router.post('/submit', async (req, res) => {
    try {
        const signupData = req.body;

        // Check if email already exists
        const existing = await KYCVerification.findOne({ email: signupData.email });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create new signup in MongoDB
        const newSignup = new KYCVerification({
            id: signupData.id,
            loginId: signupData.loginId,
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            email: signupData.email,
            phone: signupData.phone,
            password: signupData.password,
            role: signupData.role || 'tenant',
            kycStatus: signupData.kycStatus || 'pending',
            status: signupData.status || 'active',
            createdAt: new Date()
        });

        await newSignup.save();
        console.log(`✓ New signup saved to MongoDB: ${signupData.email}`);

        // Send email notification to superadmin
        try {
            const mailer = require('../utils/mailer');
            const superadminEmail = process.env.SMTP_USER || 'roomhy01@gmail.com';
            const subject = 'New User Signup - Account Created';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">New User Account Created</h2>
                    <p>A new user has created an account and is pending verification.</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Name:</strong> ${signupData.firstName} ${signupData.lastName || ''}</p>
                        <p><strong>Email:</strong> ${signupData.email}</p>
                        <p><strong>Phone:</strong> ${signupData.phone || 'Not provided'}</p>
                        <p><strong>User ID:</strong> ${signupData.id}</p>
                        <p><strong>Status:</strong> ${signupData.status}</p>
                        <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <p>Please review and verify this user in the superadmin new signups panel.</p>
                </div>
            `;
            await mailer.sendMail(superadminEmail, subject, '', html);
            console.log('✓ Signup notification email sent successfully');
        } catch (emailError) {
            console.error('Failed to send signup notification email:', emailError);
        }

        res.status(201).json({ message: 'Signup submitted successfully', data: newSignup });
    } catch (error) {
        console.error('Error submitting signup:', error);
        res.status(500).json({ message: 'Error submitting signup', error: error.message });
    }
});

// Get signup by ID
router.get('/:id', async (req, res) => {
    try {
        const signup = await KYCVerification.findById(req.params.id).select('-password');
        if (!signup) {
            return res.status(404).json({ message: 'Signup not found' });
        }
        res.json(signup);
    } catch (error) {
        console.error('Error fetching signup:', error);
        res.status(500).json({ message: 'Error fetching signup', error: error.message });
    }
});

// Update signup status
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, kycStatus } = req.body;

        const signup = await KYCVerification.findByIdAndUpdate(
            id,
            {
                status: status || undefined,
                kycStatus: kycStatus || undefined,
                verifiedAt: (kycStatus === 'verified') ? new Date() : undefined
            },
            { new: true }
        ).select('-password');

        if (!signup) {
            return res.status(404).json({ message: 'Signup not found' });
        }

        console.log(`✓ Signup updated: ${signup.email}`);
        res.json({ message: 'Signup updated successfully', data: signup });
    } catch (error) {
        console.error('Error updating signup:', error);
        res.status(500).json({ message: 'Error updating signup', error: error.message });
    }
});

// Delete signup (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        const signup = await KYCVerification.findByIdAndDelete(req.params.id);
        if (!signup) {
            return res.status(404).json({ message: 'Signup not found' });
        }
        console.log(`✓ Signup deleted: ${signup.email}`);
        res.json({ message: 'Signup deleted successfully' });
    } catch (error) {
        console.error('Error deleting signup:', error);
        res.status(500).json({ message: 'Error deleting signup', error: error.message });
    }
});

module.exports = router;
