// Create test data for rentcollection.html display
const mongoose = require('mongoose');

// Connection string from .env
const MONGO_URI = 'mongodb+srv://roomhydb:roomhydbkota41@cluster0.cj1yqn9.mongodb.net/?appName=Cluster0';

// Models
const tenantSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    roomNo: String,
    bedNo: String,
    moveInDate: Date,
    agreedRent: Number,
    loginId: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: String,
    kycStatus: String,
    area: String,
    createdAt: { type: Date, default: Date.now }
});

const rentSchema = new mongoose.Schema({
    propertyName: String,
    roomNumber: String,
    area: String,
    tenantName: String,
    tenantEmail: String,
    tenantPhone: String,
    tenantLoginId: String,
    rentAmount: Number,
    totalDue: Number,
    paidAmount: Number,
    paymentStatus: String,
    moveInDate: Date,
    dueDate: Date,
    createdAt: { type: Date, default: Date.now }
});

const Tenant = mongoose.model('Tenant', tenantSchema);
const Rent = mongoose.model('Rent', rentSchema);

async function createTestData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check existing data
        const tenantCount = await Tenant.countDocuments();
        const rentCount = await Rent.countDocuments();
        
        console.log(`Current data - Tenants: ${tenantCount}, Rents: ${rentCount}`);

        if (tenantCount === 0 && rentCount === 0) {
            console.log('📝 Creating test data...');
            
            // Create test tenants
            const tenant1 = await Tenant.create({
                name: 'John Doe',
                email: 'john@example.com',
                phone: '9876543210',
                property: new mongoose.Types.ObjectId(),
                roomNo: '101',
                bedNo: '1',
                moveInDate: new Date('2026-01-15'),
                agreedRent: 15000,
                loginId: 'TEN001',
                status: 'active',
                kycStatus: 'pending',
                area: 'Area A'
            });

            const tenant2 = await Tenant.create({
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '9876543211',
                property: new mongoose.Types.ObjectId(),
                roomNo: '102',
                bedNo: '1',
                moveInDate: new Date('2026-01-20'),
                agreedRent: 12000,
                loginId: 'TEN002',
                status: 'active',
                kycStatus: 'pending',
                area: 'Area B'
            });

            const tenant3 = await Tenant.create({
                name: 'Bob Wilson',
                email: 'bob@example.com',
                phone: '9876543212',
                property: new mongoose.Types.ObjectId(),
                roomNo: '103',
                bedNo: '1',
                moveInDate: new Date('2026-01-25'),
                agreedRent: 18000,
                loginId: 'TEN003',
                status: 'active',
                kycStatus: 'pending',
                area: 'Area C'
            });

            // Create rents - one paid, two unpaid
            await Rent.create({
                propertyName: 'Apartment Complex A',
                roomNumber: '101',
                area: 'Area A',
                tenantName: 'John Doe',
                tenantEmail: 'john@example.com',
                tenantPhone: '9876543210',
                tenantLoginId: 'TEN001',
                rentAmount: 15000,
                totalDue: 15000,
                paidAmount: 15000,
                paymentStatus: 'paid',
                moveInDate: new Date('2026-01-15'),
                dueDate: new Date('2026-02-01')
            });

            await Rent.create({
                propertyName: 'Apartment Complex A',
                roomNumber: '102',
                area: 'Area B',
                tenantName: 'Jane Smith',
                tenantEmail: 'jane@example.com',
                tenantPhone: '9876543211',
                tenantLoginId: 'TEN002',
                rentAmount: 12000,
                totalDue: 12000,
                paidAmount: 0,
                paymentStatus: 'pending',
                moveInDate: new Date('2026-01-20'),
                dueDate: new Date('2026-02-01')
            });

            await Rent.create({
                propertyName: 'Apartment Complex B',
                roomNumber: '103',
                area: 'Area C',
                tenantName: 'Bob Wilson',
                tenantEmail: 'bob@example.com',
                tenantPhone: '9876543212',
                tenantLoginId: 'TEN003',
                rentAmount: 18000,
                totalDue: 18000,
                paidAmount: 5000,
                paymentStatus: 'partially_paid',
                moveInDate: new Date('2026-01-25'),
                dueDate: new Date('2026-02-01')
            });

            console.log('✅ Test data created successfully!');
            console.log('   - 3 tenants created');
            console.log('   - 1 PAID rent (John Doe - 15000)');
            console.log('   - 1 UNPAID rent (Jane Smith - 12000)');
            console.log('   - 1 PARTIAL rent (Bob Wilson - 18000, paid 5000)');
        } else {
            console.log('📊 Data already exists. Showing summary:');
            const tenants = await Tenant.find().limit(5);
            const rents = await Rent.find().limit(5);
            
            console.log('\nTenants:');
            tenants.forEach(t => console.log(`  - ${t.name} (${t.loginId}): ₹${t.agreedRent}`));
            
            console.log('\nRents:');
            rents.forEach(r => console.log(`  - ${r.tenantName} (${r.paymentStatus}): Paid ₹${r.paidAmount} of ₹${r.totalDue}`));
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createTestData();
