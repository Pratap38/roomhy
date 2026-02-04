const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Import BookingRequest model
const BookingRequest = require('./roomhy-backend/models/BookingRequest');

async function testQuery() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roomhy');
        console.log('✅ Connected to MongoDB');

        // Query for bids with owner_id ROOMHY2776
        const owner_id = 'ROOMHY2776';
        console.log(`\n🔍 Querying for owner_id: ${owner_id}`);
        
        const query = {
            $or: [
                { owner_id: owner_id },
                { owner_ids: { $in: [owner_id] }, is_bulk_request: true }
            ]
        };
        
        const allRequests = await BookingRequest.find(query).lean();
        console.log(`📊 Found ${allRequests.length} total bookings`);
        
        if (allRequests.length > 0) {
            console.log('\n📋 First booking structure:');
            console.log(JSON.stringify(allRequests[0], null, 2));
            
            console.log('\n📋 All request_type values:');
            const types = allRequests.map(r => r.request_type);
            console.log(types);
            
            const bids = allRequests.filter(r => r.request_type === 'bid');
            console.log(`\n✅ Found ${bids.length} bids`);
            console.log('Bid properties:', bids.map(b => ({_id: b._id, property_name: b.property_name, request_type: b.request_type, bid_min: b.bid_min, bid_max: b.bid_max})));
        }
        
        // Also check raw MongoDB query
        console.log('\n🔍 Checking raw MongoDB data:');
        const rawData = await BookingRequest.collection.findOne({owner_id: owner_id});
        console.log('Raw first document:', JSON.stringify(rawData, null, 2));

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testQuery();
