const mongoose = require('mongoose');
require('dotenv').config({ path: './roomhy-backend/.env' });

const bookingRequestSchema = new mongoose.Schema({
    property_id: { type: String, required: true, index: true },
    property_name: { type: String, required: true },
    area: { type: String, required: true, index: true },
    property_type: { type: String },
    rent_amount: { type: Number },

    user_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: null, sparse: true },
    email: { type: String, required: true },

    owner_id: { type: String, required: true, index: true },
    owner_name: { type: String },
    area_manager_id: { type: String, index: true },

    request_type: { 
        type: String, 
        enum: ['request', 'bid'], 
        required: true 
    },
    bid_amount: { type: Number, default: 0 },
    message: { type: String },

    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'rejected', 'booked'], 
        default: 'pending' 
    },

    visit_type: { 
        type: String, 
        enum: ['physical', 'virtual', null], 
        default: null 
    },
    visit_date: { type: Date },
    visit_time_slot: { type: String },
    visit_status: { 
        type: String, 
        enum: ['not_scheduled', 'scheduled', 'completed'], 
        default: 'not_scheduled' 
    },

    // Personal information
    guardian_name: { type: String },
    guardian_phone: { type: String },

    // Address information
    address_street: { type: String },
    address_city: { type: String },
    address_state: { type: String },
    address_postal_code: { type: String },
    address_country: { type: String },

    // Payment information
    payment_id: { type: String, sparse: true },
    payment_amount: { type: Number },
    payment_status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    payment_method: { type: String },
    payment_details: { type: String },

    // Chat decision fields
    owner_liked: { type: Boolean, default: false },
    user_liked: { type: Boolean, default: false },
    owner_rejected: { type: Boolean, default: false },
    user_rejected: { type: Boolean, default: false },

    whatsapp_enabled: { type: Boolean, default: true },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const BookingRequest = mongoose.model('BookingRequest', bookingRequestSchema);

async function checkBookings() {
    try {
        const url = process.env.DB_URL || 'mongodb://localhost:27017/roomhy';
        console.log('Connecting to:', url);
        
        await mongoose.connect(url);
        console.log('✅ Connected to MongoDB');

        const count = await BookingRequest.countDocuments({});
        console.log(`\nTotal bookings: ${count}`);

        const confirmedCount = await BookingRequest.countDocuments({ status: 'confirmed' });
        console.log(`Confirmed bookings: ${confirmedCount}`);

        if (confirmedCount > 0) {
            console.log('\n📋 Sample confirmed booking:');
            const booking = await BookingRequest.findOne({ status: 'confirmed' }).lean();
            console.log(JSON.stringify(booking, null, 2));
            
            console.log('\n📊 Fields present in sample booking:');
            Object.keys(booking).forEach(key => {
                console.log(`  ${key}: ${typeof booking[key]}`);
            });
        } else {
            console.log('\n⚠️  No confirmed bookings found');
            console.log('\nAll bookings:');
            const allBookings = await BookingRequest.find({}).lean().limit(1);
            if (allBookings.length > 0) {
                console.log(JSON.stringify(allBookings[0], null, 2));
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkBookings();
