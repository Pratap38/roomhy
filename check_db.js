const mongoose = require('mongoose');
require('dotenv').config();

const bookingRequestSchema = new mongoose.Schema({
    property_id: String,
    property_name: String,
    area: String,
    user_id: String,
    name: String,
    phone: String,
    email: String,
    owner_id: String,
    guardian_name: String,
    guardian_phone: String,
    address_street: String,
    address_city: String,
    address_state: String,
    address_postal_code: String,
    address_country: String,
    payment_id: String,
    payment_amount: Number,
    payment_method: String,
    payment_status: String,
    status: String,
    created_at: Date,
    updated_at: Date
});

const BookingRequest = mongoose.model('BookingRequest', bookingRequestSchema);

async function check() {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/roomhy');
        
        const count = await BookingRequest.countDocuments({});
        const confirmedCount = await BookingRequest.countDocuments({ status: 'confirmed' });
        
        console.log(`Total bookings: ${count}`);
        console.log(`Confirmed bookings: ${confirmedCount}`);
        
        if (confirmedCount > 0) {
            const latest = await BookingRequest.findOne({ status: 'confirmed' }).sort({ created_at: -1 }).lean();
            console.log('\nLatest confirmed booking:');
            console.log(JSON.stringify(latest, null, 2));
            
            console.log('\nFields check:');
            console.log(`- guardian_name: ${latest.guardian_name || 'MISSING'}`);
            console.log(`- guardian_phone: ${latest.guardian_phone || 'MISSING'}`);
            console.log(`- address_street: ${latest.address_street || 'MISSING'}`);
            console.log(`- address_city: ${latest.address_city || 'MISSING'}`);
            console.log(`- payment_amount: ${latest.payment_amount || 'MISSING'}`);
            console.log(`- payment_method: ${latest.payment_method || 'MISSING'}`);
        }
        
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

check();
