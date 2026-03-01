const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Owner = require('../models/Owner');

async function seedOwner() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is missing in environment. Seeder aborted.');
        }
        await mongoose.connect(mongoUri);
        console.log('Seeder: Mongo connected');

        const loginId = process.argv[2] || 'ROOMHY2652';
        const name = process.argv[3] || 'Demo Owner';
        const email = process.argv[4] || 'owner@roomhy.local';
        const phone = process.argv[5] || '9000000000';

        let owner = await Owner.findOne({ loginId });
        if (owner) {
            console.log('Owner already exists:', loginId);
        } else {
            owner = await Owner.create({
                loginId,
                name,
                email,
                phone,
                kyc: { status: 'verified' },
                isActive: true
            });
            console.log('Created owner:', loginId);
        }
        process.exit(0);
    } catch (err) {
        console.error('Seeder error', err);
        process.exit(1);
    }
}

if (require.main === module) {
    seedOwner();
}

module.exports = seedOwner;
