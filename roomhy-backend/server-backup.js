const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware (JSON parsing & Security)
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// Database Connection
const mongoOptions = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2
};

mongoose.connect(process.env.MONGO_URI, mongoOptions)
    .then(() => {
        console.log('✅ MongoDB Connected');
        startServer();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.warn('Starting server anyway; API calls may fail until DB reconnects');
        startServer();
    });

mongoose.connection.on('connected', () => console.log('✅ Mongoose connected'));
mongoose.connection.on('error', (err) => console.error('❌ Mongoose error', err && err.message));
mongoose.connection.on('disconnected', () => console.warn('⚠️ Mongoose disconnected'));
mongoose.connection.on('reconnected', () => console.log('✅ Mongoose reconnected'));

// Routes (API Endpoints)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/visits', require('./routes/visitDataRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/owners', require('./routes/ownerRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes')); // Alias for booking-form.html compatibility
app.use('/api/favorites', require('./routes/favoritesRoutes'));
app.use('/api/bids', require('./routes/bidsRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/signups', require('./routes/kycRoutes'));
app.use('/api/cities', require('./routes/citiesRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/website-enquiry', require('./routes/websiteEnquiryRoutes'));
app.use('/api/website-enquiries', require('./routes/websiteEnquiryRoutes')); // Alias for compatibility
app.use('/api/approved-properties', require('./routes/approvedPropertiesRoutes'));
app.use('/api/approvals', require('./routes/approvedPropertiesRoutes')); // Alias for frontend compatibility
app.use('/api/website-property-data', require('./routes/websitePropertyDataRoutes'));
try { app.use('/api/website-properties', require('./routes/websitePropertyRoutes')); } catch(e) { console.log('websitePropertyRoutes not loaded'); }
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));
app.use('/api', require('./routes/uploadRoutes'));

// Static File Serving (MUST come AFTER API routes)
app.use(express.static('.')); // Serve all files from root directory
app.use('/Areamanager', express.static('../Areamanager'));
app.use('/propertyowner', express.static('../propertyowner'));
app.use('/tenant', express.static('../tenant'));
app.use('/superadmin', express.static('../superadmin'));
app.use('/website', express.static('../website'));
app.use('/images', express.static('../images'));
app.use('/js', express.static('../js'));
app.use(express.static('../')); // Fallback to parent directory

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use((err, req, res, next) => {
    console.error('Express Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// 404 handler for unmatched routes
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 5001;

function startServer() {
    if (server.listening) return;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Backend API running on http://localhost:${PORT}`);
    });
}