const mongoose = require('mongoose');
require('dotenv').config({ path: './roomhy-backend/.env' });

const ownerSchema = new mongoose.Schema({
    loginId: { type: String, unique: true },
    name: String,
    email: String,
    phone: String,
    address: String,
    locationCode: String,
    profile: {
        name: String,
        email: String,
        phone: String,
        address: String,
        locationCode: String,
        bankAccount: String,
        updatedAt: Date
    },
    credentials: {
        password: String,
        firstTime: Boolean
    },
    kyc: {
        status: String,
        aadharNumber: String,
        documentImage: String,
        verifiedAt: Date,
        submittedAt: Date
    },
    isActive: Boolean,
    createdAt: Date
}, { collection: 'owners' });

const Owner = mongoose.model('Owner', ownerSchema);

async function populateOwnerData() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/roomhy';
        console.log('Connecting to MongoDB:', mongoUri);
        
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        // Test data to add to owners
        const testDataUpdates = [
            {
                loginId: 'ROOMHY2776',
                profile: {
                    name: 'Rajesh Kumar',
                    email: 'rajesh.kumar@example.com',
                    phone: '9876543210',
                    address: '123 MG Road, Bangalore',
                    locationCode: 'KO',
                    bankAccount: '1234567890123456',
                    updatedAt: new Date()
                },
                name: 'Rajesh Kumar',
                email: 'rajesh.kumar@example.com',
                phone: '9876543210',
                address: '123 MG Road, Bangalore',
                locationCode: 'KO'
            },
            {
                loginId: 'ROOMHY6261',
                profile: {
                    name: 'Priya Singh',
                    email: 'priya.singh@example.com',
                    phone: '9876543211',
                    address: '456 Indiranagar, Bangalore',
                    locationCode: 'IN',
                    bankAccount: '2234567890123456',
                    updatedAt: new Date()
                },
                name: 'Priya Singh',
                email: 'priya.singh@example.com',
                phone: '9876543211',
                address: '456 Indiranagar, Bangalore',
                locationCode: 'IN'
            },
            {
                loginId: 'ROOMHY1310',
                profile: {
                    name: 'Arjun Patel',
                    email: 'arjun.patel@example.com',
                    phone: '9876543212',
                    address: '789 Whitefield, Bangalore',
                    locationCode: 'WH',
                    bankAccount: '3234567890123456',
                    updatedAt: new Date()
                },
                name: 'Arjun Patel',
                email: 'arjun.patel@example.com',
                phone: '9876543212',
                address: '789 Whitefield, Bangalore',
                locationCode: 'WH'
            },
            {
                loginId: 'ROOMHY6461',
                profile: {
                    name: 'Meera Desai',
                    email: 'meera.desai@example.com',
                    phone: '9876543213',
                    address: '321 JP Nagar, Bangalore',
                    locationCode: 'JP',
                    bankAccount: '4234567890123456',
                    updatedAt: new Date()
                },
                name: 'Meera Desai',
                email: 'meera.desai@example.com',
                phone: '9876543213',
                address: '321 JP Nagar, Bangalore',
                locationCode: 'JP'
            }
        ];

        for (const data of testDataUpdates) {
            const updated = await Owner.findOneAndUpdate(
                { loginId: data.loginId },
                { $set: data },
                { new: true, upsert: true }
            );
            console.log(`✅ Updated ${data.loginId}: ${updated.profile.name}`);
        }

        // Verify
        const all = await Owner.find({});
        console.log(`\n📊 Total owners in DB: ${all.length}`);
        console.log('\n📋 Owners:', all.map(o => ({
            loginId: o.loginId,
            name: o.profile?.name || o.name || 'Unknown',
            email: o.profile?.email || o.email || '-',
            phone: o.profile?.phone || o.phone || '-',
            address: o.profile?.address || o.address || '-',
            bankAccount: o.profile?.bankAccount || '-'
        })));

        await mongoose.disconnect();
        console.log('\n✅ Done! Closing connection...');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

populateOwnerData();
