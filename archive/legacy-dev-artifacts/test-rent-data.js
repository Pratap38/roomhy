const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './roomhy-backend/.env' });

const rentSchema = new mongoose.Schema({
    tenantLoginId: String,
    ownerLoginId: String,
    ownerName: String,
    tenantId: mongoose.Schema.Types.ObjectId,
    propertyId: mongoose.Schema.Types.ObjectId,
    propertyName: String,
    rentAmount: Number,
    deposit: Number,
    totalDue: Number,
    tenantName: String,
    tenantEmail: String,
    tenantPhone: String,
    roomNumber: String,
    area: String,
    collectionMonth: String,
    paymentStatus: { type: String, default: 'pending' },
    paidAmount: { type: Number, default: 0 },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paymentDate: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Rent = mongoose.model('Rent', rentSchema);

async function addTestData() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://yasmirazrabbi:yasmirazrabbi@roomhydatabase.i4w1pvi.mongodb.net/roomhy', {
            retryWrites: true,
            w: 'majority'
        });
        console.log('✅ MongoDB Connected\n');

        // Clear existing test data
        await Rent.deleteMany({ tenantLoginId: /^TEST/ });
        console.log('🗑️ Cleared existing test data');

        // Add test rental data
        const testData = [
            {
                tenantLoginId: 'TESTTN001',
                ownerLoginId: 'ROOMHY2776',
                ownerName: 'Raj Kumar',
                tenantName: 'John Doe',
                tenantEmail: 'john@example.com',
                tenantPhone: '9876543210',
                propertyName: 'Koramangala Property',
                roomNumber: '101',
                area: 'KO',
                rentAmount: 50000,
                deposit: 10000,
                totalDue: 60000,
                collectionMonth: '2026-02',
                paymentStatus: 'completed',
                paidAmount: 50000,
                razorpayPaymentId: 'pay_test_001',
                paymentDate: new Date('2026-02-04'),
                createdAt: new Date('2026-02-04'),
                updatedAt: new Date('2026-02-04')
            },
            {
                tenantLoginId: 'TESTTN002',
                ownerLoginId: 'ROOMHY2776',
                ownerName: 'Raj Kumar',
                tenantName: 'Jane Smith',
                tenantEmail: 'jane@example.com',
                tenantPhone: '9876543211',
                propertyName: 'Koramangala Property',
                roomNumber: '102',
                area: 'KO',
                rentAmount: 45000,
                deposit: 9000,
                totalDue: 54000,
                collectionMonth: '2026-02',
                paymentStatus: 'completed',
                paidAmount: 45000,
                razorpayPaymentId: 'pay_test_002',
                paymentDate: new Date('2026-02-04'),
                createdAt: new Date('2026-02-04'),
                updatedAt: new Date('2026-02-04')
            },
            {
                tenantLoginId: 'TESTTN003',
                ownerLoginId: 'ROOMHY6261',
                ownerName: 'Priya Singh',
                tenantName: 'Mike Johnson',
                tenantEmail: 'mike@example.com',
                tenantPhone: '9876543212',
                propertyName: 'Indore Property',
                roomNumber: '201',
                area: 'IN',
                rentAmount: 35000,
                deposit: 7000,
                totalDue: 42000,
                collectionMonth: '2026-02',
                paymentStatus: 'completed',
                paidAmount: 35000,
                razorpayPaymentId: 'pay_test_003',
                paymentDate: new Date('2026-02-03'),
                createdAt: new Date('2026-02-03'),
                updatedAt: new Date('2026-02-03')
            },
            {
                tenantLoginId: 'TESTTN004',
                ownerLoginId: 'ROOMHY6261',
                ownerName: 'Priya Singh',
                tenantName: 'Sarah Williams',
                tenantEmail: 'sarah@example.com',
                tenantPhone: '9876543213',
                propertyName: 'Indore Property',
                roomNumber: '202',
                area: 'IN',
                rentAmount: 40000,
                deposit: 8000,
                totalDue: 48000,
                collectionMonth: '2026-02',
                paymentStatus: 'completed',
                paidAmount: 40000,
                razorpayPaymentId: 'pay_test_004',
                paymentDate: new Date('2026-02-04'),
                createdAt: new Date('2026-02-04'),
                updatedAt: new Date('2026-02-04')
            }
        ];

        const insertedRents = await Rent.insertMany(testData);
        console.log(`✅ Added ${insertedRents.length} test rental records\n`);

        // Verify data
        const allRents = await Rent.find({});
        const paidRents = await Rent.find({ paymentStatus: 'completed' });
        console.log(`📊 Database Summary:`);
        console.log(`   Total rents: ${allRents.length}`);
        console.log(`   Completed payments: ${paidRents.length}`);
        console.log(`   Total rent collected: ₹${paidRents.reduce((sum, r) => sum + r.paidAmount, 0)}\n`);

        console.log('📋 Sample Rent Record:');
        console.log(JSON.stringify(insertedRents[0], null, 2));

        await mongoose.connection.close();
        console.log('\n✅ Test data added successfully!');
        console.log('🚀 Now start your server and visit platform.html');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addTestData();
