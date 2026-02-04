const mongoose = require('mongoose');
const Tenant = require('./roomhy-backend/models/Tenant');
const Rent = require('./roomhy-backend/models/Rent');
const User = require('./roomhy-backend/models/user');
const Property = require('./roomhy-backend/models/Property');

// Connect to MongoDB
mongoose.connect('mongodb+srv://roomhydb:roomhydbkota41@cluster0.cj1yqn9.mongodb.net/?appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected for test');
    testFlow();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

async function testFlow() {
    try {
        console.log('\n📋 Testing Tenant Assignment → Rent Creation Data Flow\n');

        // Test 1: Get total counts before
        console.log('📊 Before Assignment:');
        const tenantsBefore = await Tenant.countDocuments();
        const rentsBefore = await Rent.countDocuments();
        console.log(`   - Total Tenants: ${tenantsBefore}`);
        console.log(`   - Total Rents: ${rentsBefore}`);

        // Test 2: Check recent tenant
        console.log('\n👤 Most Recent Tenant:');
        const latestTenant = await Tenant.findOne().sort({ createdAt: -1 }).populate('property');
        if (latestTenant) {
            console.log(`   - Name: ${latestTenant.name}`);
            console.log(`   - Email: ${latestTenant.email}`);
            console.log(`   - Login ID: ${latestTenant.loginId}`);
            console.log(`   - Agreed Rent: ₹${latestTenant.agreedRent}`);
            console.log(`   - Property: ${latestTenant.property?.title || 'N/A'}`);
            console.log(`   - Room No: ${latestTenant.roomNo}`);
        }

        // Test 3: Check corresponding rent record
        console.log('\n💰 Most Recent Rent Record:');
        const latestRent = await Rent.findOne().sort({ createdAt: -1 });
        if (latestRent) {
            console.log(`   - Tenant Name: ${latestRent.tenantName}`);
            console.log(`   - Tenant Email: ${latestRent.tenantEmail}`);
            console.log(`   - Tenant Login ID: ${latestRent.tenantLoginId}`);
            console.log(`   - Property: ${latestRent.propertyName}`);
            console.log(`   - Room Number: ${latestRent.roomNumber}`);
            console.log(`   - Rent Amount: ₹${latestRent.rentAmount}`);
            console.log(`   - Total Due: ₹${latestRent.totalDue}`);
            console.log(`   - Paid Amount: ₹${latestRent.paidAmount}`);
            console.log(`   - Payment Status: ${latestRent.paymentStatus}`);
        }

        // Test 4: Verify data matching
        console.log('\n✔️ Data Integrity Check:');
        if (latestTenant && latestRent) {
            const checks = [
                ['Name Match', latestTenant.name === latestRent.tenantName],
                ['Email Match', latestTenant.email === latestRent.tenantEmail],
                ['Login ID Match', latestTenant.loginId === latestRent.tenantLoginId],
                ['Rent Amount Match', latestTenant.agreedRent === latestRent.rentAmount],
                ['Room Number Match', latestTenant.roomNo === latestRent.roomNumber]
            ];
            
            checks.forEach(([check, result]) => {
                console.log(`   ${result ? '✅' : '❌'} ${check}`);
            });
        }

        // Test 5: Show data flow diagram
        console.log('\n📊 Data Flow Summary:');
        console.log(`
        ┌─────────────────────────────────────────────────────────┐
        │        Tenant Assignment Data Flow - Complete            │
        └─────────────────────────────────────────────────────────┘

        1️⃣  ROOMS.HTML (Owner assigns tenant)
            ↓
            POST /api/tenants/assign
            Payload: {
              name, phone, email, propertyId, roomNo, 
              bedNo, moveInDate, agreedRent
            }

        2️⃣  TENANT CONTROLLER (Backend)
            ↓
            ✓ Creates User record (for login)
            ✓ Creates Tenant record (db)
            ✓ Creates Rent record (db) ← AUTO-CREATED HERE
            ↓
            Returns: tenant with credentials

        3️⃣  DATA STORED IN MONGODB
            ├─ Users Collection
            │  └─ loginId, password, role='tenant'
            │
            ├─ Tenants Collection
            │  └─ name, email, phone, property, roomNo,
            │     agreedRent, loginId, status
            │
            └─ Rents Collection
               └─ tenantName, email, phone, loginId, 
                  rentAmount, totalDue, paymentStatus='pending'

        4️⃣  TENANTS.HTML (Super Admin view)
            ↓
            GET /api/tenants
            Displays: All assigned tenants

        5️⃣  RENTCOLLECTION.HTML (Super Admin view)
            ↓
            GET /api/rents
            Displays: PAID and UNPAID sections
            Shows: Total collection amounts

        6️⃣  TENANT PAYMENT FLOW
            ├─ Tenant logs in with credentials
            ├─ Tenant Dashboard → Make Payment
            ├─ POST /api/rents/create-order (Razorpay)
            ├─ Payment completed
            ├─ POST /api/rents/record-payment
            ├─ Rent status → 'paid'
            └─ Appears in PAID section in rentcollection.html
        `);

        console.log('\n✅ Flow Test Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test Error:', error);
        process.exit(1);
    }
}
