const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Middleware (JSON parsing & Security)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Serve Static Files (HTML, CSS, JS, Images)
// Priority: React build > Legacy HTML > Images/Resources
app.use(express.static('react-app/dist')); // Serve React build if it exists
app.use(express.static('.')); // Serve all files from root directory
app.use('/Areamanager', express.static('./Areamanager'));
app.use('/propertyowner', express.static('./propertyowner'));
app.use('/tenant', express.static('./tenant'));
app.use('/superadmin', express.static('./superadmin'));
app.use('/images', express.static('./images'));
app.use('/js', express.static('./js'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Run seeder (creates a default superadmin) - best effort, non-blocking
try {
    const seed = require('./roomhy-backend/seeder');
    seed().catch(err => console.error('Seeder error:', err));
} catch (err) {
    console.warn('Seeder not available or failed to load:', err.message);
}

// Routes (Endpoints)
// Routes live under the `roomhy-backend/routes` folder
app.use('/api/auth', require('./roomhy-backend/routes/authRoutes'));
app.use('/api/properties', require('./roomhy-backend/routes/propertyRoutes'));
app.use('/api/admin', require('./roomhy-backend/routes/adminRoutes'));
app.use('/api/tenants', require('./roomhy-backend/routes/tenantRoutes'));
app.use('/api/visits', require('./roomhy-backend/routes/visitDataRoutes'));
app.use('/api/rooms', require('./roomhy-backend/routes/roomRoutes'));
app.use('/api/notifications', require('./roomhy-backend/routes/notificationRoutes'));
app.use('/api/owners', require('./roomhy-backend/routes/ownerRoutes'));
app.use('/api/booking', require('./roomhy-backend/routes/bookingRoutes'));
app.use('/api/area-managers', require('./roomhy-backend/routes/areaManagerRoutes'));
app.use('/api/employees', require('./roomhy-backend/routes/employeeRoutes'));
app.use('/api/complaints', require('./roomhy-backend/routes/complaintRoutes'));
app.use('/api/favorites', require('./roomhy-backend/routes/favoritesRoutes'));
app.use('/api/bids', require('./roomhy-backend/routes/bidsRoutes'));
app.use('/api/kyc', require('./roomhy-backend/routes/kycRoutes'));
app.use('/api/cities', require('./roomhy-backend/routes/citiesRoutes'));
app.use('/api/approved-properties', require('./roomhy-backend/routes/approvedPropertyRoutes'));
app.use('/api/approvals', require('./roomhy-backend/routes/approvedPropertyRoutes'));
app.use('/api', require('./roomhy-backend/routes/uploadRoutes'));
app.use('/api/email', require('./roomhy-backend/routes/emailRoutes'));

// NEW: Website Enquiry Routes (for property enquiries from website form)
app.use('/api/website-enquiry', require('./roomhy-backend/routes/websiteEnquiryRoutes'));

// NEW: Website Property Data Routes
app.use('/api/website-property-data', require('./roomhy-backend/routes/websitePropertyDataRoutes'));

// NEW: Data Sync Routes (for MongoDB Atlas integration)
app.use('/api/data', require('./roomhy-backend/routes/dataSync'));

// Chat API Routes
app.use('/api/chat', require('./roomhy-backend/routes/chatRoutes'));

// Debug checkin route
app.use((req, res, next) => {
    if (req.path.includes('/checkin')) {
        console.log(`📋 CHECKIN REQUEST: ${req.method} ${req.path}`);
    }
    next();
});

try {
    const checkinRoutes = require('./roomhy-backend/routes/checkinRoutes');
    console.log('✅ checkinRoutes loaded successfully');
    app.use('/api/checkin', checkinRoutes);
} catch (err) {
    console.error('❌ Error loading checkinRoutes:', err.message);
    console.error(err.stack);
}

// Test endpoint: seed a test owner for development
app.post('/api/test/seed-owner', async (req, res) => {
    try {
        const Owner = require('./roomhy-backend/models/Owner');
        const testOwner = await Owner.create({
            loginId: 'TESTOWNER2024',
            name: 'Test Property Owner',
            phone: '9999999999',
            address: '123 Test Street, Test City',
            locationCode: 'LOC001',
            credentials: { password: 'test@123' },
            kyc: { status: 'verified' }
        });
        res.status(201).json({ message: 'Test owner created', owner: testOwner });
    } catch (err) {
        if (err.code === 11000) {
            res.status(200).json({ message: 'Test owner already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Import Chat Models
const ChatRoom = require('./roomhy-backend/models/ChatRoom');
const ChatMessage = require('./roomhy-backend/models/ChatMessage');
const BookingRequest = require('./roomhy-backend/models/BookingRequest');

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('🔌 User Connected:', socket.id);

    // Join Room
    socket.on('join_room', async (data) => {
        const { room_id, user_id, user_role, booking_id } = data;
        socket.join(room_id);
        console.log(`👤 ${user_id} (${user_role}) joined room: ${room_id}`);

        try {
            // Add or update participant in room
            await ChatRoom.findOneAndUpdate(
                { room_id },
                {
                    $addToSet: { 
                        participants: { loginId: user_id, role: user_role, joined_at: new Date() }
                    },
                    updated_at: new Date()
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error updating room participants:', error);
        }
    });

    // Send Message
    socket.on('send_message', async (data) => {
        const { room_id, sender_id, sender_login_id, sender_role, sender_name, message, booking_id } = data;

        try {
            // Save message to database
            const newMessage = await ChatMessage.create({
                room_id,
                sender_id: sender_login_id || sender_id,
                sender_login_id: sender_login_id || sender_id,
                sender_name: sender_name || sender_id,
                sender_role,
                message,
                booking_id: booking_id || null,
                message_type: 'text',
                is_read: false,
                created_at: new Date(),
                updated_at: new Date()
            });

            // Update room last message
            await ChatRoom.findOneAndUpdate(
                { room_id },
                {
                    last_message_at: new Date(),
                    updated_at: new Date()
                }
            );

            // Emit to room
            io.to(room_id).emit('receive_message', newMessage);

            // If owner sends, also emit to website user's room
            if (sender_role === 'property_owner' && booking_id) {
                const booking = await BookingRequest.findById(booking_id);
                if (booking && booking.user_id) {
                    io.to(booking.user_id).emit('receive_message', newMessage);
                }
            }

            // If website user sends, also emit to owner's room
            if (sender_role === 'website_user' && booking_id) {
                const booking = await BookingRequest.findById(booking_id);
                if (booking && booking.owner_id) {
                    io.to(booking.owner_id).emit('receive_message', newMessage);
                }
            }

            console.log(`📤 Message sent in room ${room_id} by ${sender_role}`);
        } catch (error) {
            console.error('❌ Send Message Error:', error);
            socket.emit('message_error', { error: error.message });
        }
    });

    // Accept Booking (Owner)
    socket.on('owner_accept_booking', async (data) => {
        try {
            const { booking_id, owner_id } = data;
            const BookingRequest = require('./roomhy-backend/models/BookingRequest');

            const booking = await BookingRequest.findByIdAndUpdate(
                booking_id,
                { status: 'confirmed', updated_at: new Date() },
                { new: true }
            );

            if (booking) {
                // Create or get chat room
                const ownerRoomId = owner_id; 
                const websiteUserRoomId = booking.user_id;

                let chatRoom = await ChatRoom.findOne({ room_id: ownerRoomId });
                if (!chatRoom) {
                    chatRoom = await ChatRoom.create({
                        room_id: ownerRoomId,
                        booking_id: booking_id,
                        owner_id: owner_id,
                        website_user_id: booking.user_id,
                        website_user_name: booking.name,
                        property_name: booking.property_name,
                        participants: [
                            { loginId: owner_id, role: 'property_owner' },
                            { loginId: booking.user_id, role: 'website_user' }
                        ],
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }

                // Notify both users
                io.to(ownerRoomId).emit('booking_accepted', {
                    booking_id,
                    owner_id,
                    website_user_id: booking.user_id,
                    property_name: booking.property_name
                });

                io.to(websiteUserRoomId).emit('booking_accepted', {
                    booking_id,
                    owner_id,
                    website_user_id: booking.user_id,
                    property_name: booking.property_name
                });

                console.log(`✅ Booking ${booking_id} accepted, chat room created`);
            }
        } catch (error) {
            console.error('Error accepting booking:', error);
            socket.emit('booking_error', { error: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 User Disconnected');
    });
});

const PORT = process.env.PORT || 5001;

// Fallback middleware: serve index.html for any unmatched route (SPA fallback)
// Must come AFTER all other routes and static middleware
const path = require('path');
const fs = require('fs');

// React app fallback - try React build first
app.use((req, res, next) => {
    // Only respond to requests for non-API, non-static routes
    if (req.path.startsWith('/api/')) {
        return next(); // Pass API requests to 404 handler
    }
    
    // Try React build index.html first
    const reactIndexPath = path.join(__dirname, 'react-app/dist/index.html');
    if (fs.existsSync(reactIndexPath)) {
        return res.sendFile(reactIndexPath);
    }
    
    // Fallback to legacy index.html
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    
    return res.status(404).send('Not Found');
});

server.listen(PORT, '0.0.0.0', () => console.log(`\n✅ API Server running on http://localhost:${PORT}\n`));
