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

async function addKYCData() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/roomhy';
        console.log('Connecting to MongoDB...');
        
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        // Add KYC data to test owners
        const testKYC = [
            {
                loginId: 'ROOMHY2776',
                kyc: {
                    status: 'submitted',
                    aadharNumber: '123456789012',
                    documentImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                    submittedAt: new Date()
                }
            },
            {
                loginId: 'ROOMHY6261',
                kyc: {
                    status: 'verified',
                    aadharNumber: '234567890123',
                    documentImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                    submittedAt: new Date(Date.now() - 86400000),
                    verifiedAt: new Date()
                }
            }
        ];

        for (const data of testKYC) {
            const updated = await Owner.findOneAndUpdate(
                { loginId: data.loginId },
                { $set: data },
                { new: true }
            );
            console.log(`✅ Added KYC to ${data.loginId}: ${updated.kyc.status}`);
        }

        await mongoose.disconnect();
        console.log('\n✅ KYC data added successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

addKYCData();
