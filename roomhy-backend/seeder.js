const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/user');

async function seedAdmin() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is missing in environment. Seeder aborted.');
        }

        const hasActiveConnection = mongoose.connection && mongoose.connection.readyState === 1;
        if (!hasActiveConnection) {
            await mongoose.connect(mongoUri);
            console.log('Seeder: Mongo connected');
        } else {
            console.log('Seeder: Reusing existing mongoose connection');
        }

        const adminEmail = process.env.SEED_ADMIN_EMAIL || 'roomhyadmin@gmail.com';
        const adminPhone = process.env.SEED_ADMIN_PHONE || '9999999999';
        const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin@123';

        const existing = await User.findOne({ $or: [{ email: adminEmail }, { role: 'superadmin' }] });
        if (existing) {
            console.log('Seeder: superadmin already exists, skipping creation');
            return;
        }

        const admin = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            phone: adminPhone,
            password: adminPassword,
            role: 'superadmin'
        });
        console.log('Seeder: created superadmin:', adminEmail, 'password:', adminPassword);
    } catch (err) {
        console.error('Seeder error', err);
    }
}

if (require.main === module) {
    seedAdmin()
        .finally(async () => {
            try {
                if (mongoose.connection.readyState === 1) {
                    await mongoose.disconnect();
                }
            } catch (e) {
                // best effort disconnect for standalone seeder execution
            }
        });
}

module.exports = seedAdmin;
