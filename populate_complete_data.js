#!/usr/bin/env node

/**
 * Complete Test Data Population Script
 * Creates:
 * 1. Owner accounts with full profiles (name, phone, address, banking details)
 * 2. Visit records with matching owner names and financial details
 * 3. localStorage data structure compatible with owner.html
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './roomhy-backend/.env' });

// Import models
const Owner = require('./roomhy-backend/models/Owner');

async function populateTestData() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { 
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 30000
        });
        console.log('✅ Connected to MongoDB\n');

        // Test owners with complete data
        const testOwners = [
            {
                loginId: 'ROOMHY2776',
                name: 'Raj Kumar',
                email: 'raj.kumar@example.com',
                phone: '9876543210',
                address: '123 Main Street, Bangalore',
                locationCode: 'KO',
                password: 'password123',
                profile: {
                    name: 'Raj Kumar',
                    bankName: 'HDFC Bank',
                    accountNumber: '1234567890123456',
                    ifscCode: 'HDFC0001234',
                    branchName: 'Bangalore Main'
                },
                kycStatus: 'Verified'
            },
            {
                loginId: 'ROOMHY6261',
                name: 'Priya Singh',
                email: 'priya.singh@example.com',
                phone: '9876543211',
                address: '456 Park Avenue, Bangalore',
                locationCode: 'KO',
                password: 'password123',
                profile: {
                    name: 'Priya Singh',
                    bankName: 'ICICI Bank',
                    accountNumber: '9876543210987654',
                    ifscCode: 'ICIC0000123',
                    branchName: 'Bangalore South'
                },
                kycStatus: 'Verified'
            },
            {
                loginId: 'ROOMHY1310',
                name: 'Amit Patel',
                email: 'amit.patel@example.com',
                phone: '9876543212',
                address: '789 Tech Park, Bangalore',
                locationCode: 'KO',
                password: 'password123',
                profile: {
                    name: 'Amit Patel',
                    bankName: 'SBI Bank',
                    accountNumber: '5678901234567890',
                    ifscCode: 'SBIN0001234',
                    branchName: 'Bangalore North'
                },
                kycStatus: 'Verified'
            },
            {
                loginId: 'ROOMHY6461',
                name: 'Deepak Sharma',
                email: 'deepak.sharma@example.com',
                phone: '9876543213',
                address: '321 Commercial Street, Bangalore',
                locationCode: 'KO',
                password: 'password123',
                profile: {
                    name: 'Deepak Sharma',
                    bankName: 'Axis Bank',
                    accountNumber: '1112223334445556',
                    ifscCode: 'AXISBANK123',
                    branchName: 'Bangalore East'
                },
                kycStatus: 'Pending'
            }
        ];

        console.log('🔄 Clearing existing owner test data...');
        const testLoginIds = testOwners.map(o => o.loginId);
        await Owner.deleteMany({ loginId: { $in: testLoginIds } });
        console.log('✅ Cleared existing data\n');

        console.log('📝 Creating owners in MongoDB...');
        const createdOwners = await Owner.insertMany(testOwners);
        console.log(`✅ Created ${createdOwners.length} owners\n`);

        // Create localStorage data structure
        let localStorageOwnersDb = {};
        testOwners.forEach(owner => {
            localStorageOwnersDb[owner.loginId] = {
                name: owner.name,
                email: owner.email,
                phone: owner.phone,
                address: owner.address,
                locationCode: owner.locationCode,
                password: owner.password,
                profile: owner.profile,
                kycStatus: owner.kycStatus
            };
        });

        // Create visit data with matching owner names
        const visitData = [
            {
                propertyInfo: {
                    ownerName: 'Raj Kumar',              // MUST match owner name
                    contactPhone: '9876543210',
                    area: 'KO',
                    propertyType: 'Apartment',
                    bedrooms: 2,
                    furnished: 'Semi-Furnished'
                },
                monthlyRent: 15000,
                deposit: 30000,
                amenities: ['WiFi', 'AC', 'Parking'],
                visitDate: new Date().toISOString(),
                notes: 'Good property, verified details'
            },
            {
                propertyInfo: {
                    ownerName: 'Priya Singh',            // MUST match owner name
                    contactPhone: '9876543211',
                    area: 'KO',
                    propertyType: 'Apartment',
                    bedrooms: 3,
                    furnished: 'Furnished'
                },
                monthlyRent: 20000,
                deposit: 40000,
                amenities: ['WiFi', 'AC', 'Gym', 'Parking'],
                visitDate: new Date().toISOString(),
                notes: 'Premium property'
            },
            {
                propertyInfo: {
                    ownerName: 'Amit Patel',             // MUST match owner name
                    contactPhone: '9876543212',
                    area: 'KO',
                    propertyType: 'Flat',
                    bedrooms: 1,
                    furnished: 'Unfurnished'
                },
                monthlyRent: 12000,
                deposit: 25000,
                amenities: ['WiFi', 'Parking'],
                visitDate: new Date().toISOString(),
                notes: 'Affordable option'
            },
            {
                propertyInfo: {
                    ownerName: 'Deepak Sharma',          // MUST match owner name
                    contactPhone: '9876543213',
                    area: 'KO',
                    propertyType: 'Villa',
                    bedrooms: 4,
                    furnished: 'Furnished'
                },
                monthlyRent: 25000,
                deposit: 50000,
                amenities: ['WiFi', 'AC', 'Garden', 'Parking', 'Security'],
                visitDate: new Date().toISOString(),
                notes: 'Luxury property'
            }
        ];

        console.log('\n📋 Test Data Summary:\n');
        console.log('OWNERS CREATED:');
        testOwners.forEach((owner, i) => {
            console.log(`${i + 1}. ${owner.loginId} - ${owner.name}`);
            console.log(`   Email: ${owner.email}`);
            console.log(`   Phone: ${owner.phone}`);
            console.log(`   Bank: ${owner.profile.bankName} - ${owner.profile.accountNumber}`);
        });

        console.log('\n\nVISIT DATA CREATED:');
        visitData.forEach((visit, i) => {
            console.log(`${i + 1}. Owner: ${visit.propertyInfo.ownerName}`);
            console.log(`   Monthly Rent: ₹${visit.monthlyRent}`);
            console.log(`   Security Deposit: ₹${visit.deposit}`);
        });

        console.log('\n\n🖥️  Instructions to use this data in browser:\n');
        console.log('1. Open DevTools Console (F12)');
        console.log('2. Copy and paste this command:');
        console.log('');
        console.log(`localStorage.setItem('roomhy_owners_db', ${JSON.stringify(JSON.stringify(localStorageOwnersDb))});`);
        console.log('');
        console.log('3. Copy and paste this command:');
        console.log('');
        console.log(`localStorage.setItem('roomhy_visits', ${JSON.stringify(JSON.stringify(visitData))});`);
        console.log('');
        console.log('4. Reload owner.html page');
        console.log('5. All columns should now be filled with data\n');

        // Also save to a file for easy copying
        const dataExportFile = `
// Copy-paste these in browser DevTools console to populate localStorage

// Step 1: Set owners database
localStorage.setItem('roomhy_owners_db', ${JSON.stringify(JSON.stringify(localStorageOwnersDb))});

// Step 2: Set visit data
localStorage.setItem('roomhy_visits', ${JSON.stringify(JSON.stringify(visitData))});

// Step 3: Verify data was set
console.log('✅ Owners loaded:', Object.keys(JSON.parse(localStorage.getItem('roomhy_owners_db'))).length);
console.log('✅ Visits loaded:', JSON.parse(localStorage.getItem('roomhy_visits')).length);

// Step 4: Refresh the page
location.reload();
`;

        const fs = require('fs');
        fs.writeFileSync('localStorage_commands.js', dataExportFile);
        console.log('💾 Saved commands to: localStorage_commands.js\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

populateTestData();
