const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../roomhy-backend/.env') });

const app = express();

// Middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// MongoDB Connection with error handling
const mongoOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 5,
    minPoolSize: 1
};

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    
    try {
        await mongoose.connect(process.env.MONGO_URI, mongoOptions);
        isConnected = true;
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        isConnected = false;
        throw err;
    }
};

// Routes
try {
    app.use('/api/auth', require('../roomhy-backend/routes/authRoutes'));
    app.use('/api/properties', require('../roomhy-backend/routes/propertyRoutes'));
    app.use('/api/admin', require('../roomhy-backend/routes/adminRoutes'));
    app.use('/api/tenants', require('../roomhy-backend/routes/tenantRoutes'));
    app.use('/api/visits', require('../roomhy-backend/routes/visitDataRoutes'));
    app.use('/api/rooms', require('../roomhy-backend/routes/roomRoutes'));
    app.use('/api/notifications', require('../roomhy-backend/routes/notificationRoutes'));
    app.use('/api/owners', require('../roomhy-backend/routes/ownerRoutes'));
    app.use('/api/employees', require('../roomhy-backend/routes/employeeRoutes'));
    app.use('/api/complaints', require('../roomhy-backend/routes/complaintRoutes'));
    app.use('/api/booking', require('../roomhy-backend/routes/bookingRoutes'));
    app.use('/api/bookings', require('../roomhy-backend/routes/bookingRoutes'));
    app.use('/api/favorites', require('../roomhy-backend/routes/favoritesRoutes'));
    app.use('/api/bids', require('../roomhy-backend/routes/bidsRoutes'));
    app.use('/api/kyc', require('../roomhy-backend/routes/kycRoutes'));
    app.use('/api/signups', require('../roomhy-backend/routes/kycRoutes'));
    app.use('/api/cities', require('../roomhy-backend/routes/citiesRoutes'));
    app.use('/api/locations', require('../roomhy-backend/routes/locationRoutes'));
    app.use('/api/website-enquiry', require('../roomhy-backend/routes/websiteEnquiryRoutes'));
    app.use('/api/website-enquiries', require('../roomhy-backend/routes/websiteEnquiryRoutes'));
    app.use('/api/approved-properties', require('../roomhy-backend/routes/approvedPropertiesRoutes'));
    app.use('/api/approvals', require('../roomhy-backend/routes/approvedPropertiesRoutes'));
    app.use('/api/website-property-data', require('../roomhy-backend/routes/websitePropertyDataRoutes'));
    
    try { 
        app.use('/api/website-properties', require('../roomhy-backend/routes/websitePropertyRoutes'));
    } catch(e) { 
        console.log('⚠️  websitePropertyRoutes not loaded:', e.message); 
    }
    
    app.use('/api/chat', require('../roomhy-backend/routes/chatRoutes'));
    app.use('/api/email', require('../roomhy-backend/routes/emailRoutes'));
    app.use('/api/rents', require('../roomhy-backend/routes/rentRoutes'));
    app.use('/api', require('../roomhy-backend/routes/uploadRoutes'));
    
    console.log('✅ All routes loaded');
} catch (err) {
    console.error('❌ Error loading routes:', err.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Express Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.status(404).send('Not Found');
});

// Export for Vercel
module.exports = async (req, res) => {
    // Connect to MongoDB on first request
    if (!isConnected) {
        try {
            await connectDB();
        } catch (err) {
            return res.status(503).json({
                success: false,
                message: 'Database connection failed',
                error: err.message
            });
        }
    }
    
    // Route the request
    return app(req, res);
};
