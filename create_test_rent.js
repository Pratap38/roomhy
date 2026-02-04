const mongoose = require('mongoose');
require('dotenv').config({ path: './roomhy-backend/.env' });
const Rent = require('./roomhy-backend/models/Rent');

async function createTestRent() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { 
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 30000
        });
        console.log('✅ Connected to MongoDB');

        // Create a test rent record for tenant TNTKO8435
        const testRent = new Rent({
            tenantLoginId: 'TNTKO8435',
            tenantEmail: 'tenant@example.com',
            tenantName: 'Test Tenant',
            tenantPhone: '9876543210',
            propertyId: new mongoose.Types.ObjectId(),
            propertyName: 'Test Property',
            roomNumber: '101',
            rentAmount: 1500,
            deposit: 0,
            totalDue: 1500,
            paidAmount: 0,
            paymentStatus: 'pending',
            collectionMonth: new Date().toISOString().slice(0, 7),
            ownerLoginId: 'owner123'
        });

        await testRent.save();
        console.log('✅ Test rent created:', testRent);
        
        // Verify it was saved
        const saved = await Rent.findOne({ tenantLoginId: 'TNTKO8435' });
        console.log('✅ Verified in database:', saved);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

createTestRent();
