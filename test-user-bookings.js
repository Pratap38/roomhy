#!/usr/bin/env node

/**
 * Test User Bookings API Endpoint
 * Tests the new GET /api/bookings/user/:userId endpoint
 */

const http = require('http');

// Replace this with a real userId from your database
const TEST_USER_ID = 'test_user_123';

function testGetUserBookings() {
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: `/api/bookings/user/${TEST_USER_ID}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    console.log(`\n📨 Testing API Endpoint:`);
    console.log(`   Method: GET`);
    console.log(`   URL: http://localhost:5001/api/bookings/user/${TEST_USER_ID}`);
    console.log(`   ─────────────────────────────────────────────────────────\n`);

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`✅ Response Status: ${res.statusCode}`);
            console.log(`✅ Response Headers:`, res.headers);
            console.log(`\n📊 Response Body:\n`);
            
            try {
                const json = JSON.parse(data);
                console.log(JSON.stringify(json, null, 2));

                // Analyze response
                if (json.success && json.data && Array.isArray(json.data)) {
                    console.log(`\n✅ API Response Valid`);
                    console.log(`   Found: ${json.data.length} bookings`);
                    
                    if (json.data.length > 0) {
                        const booking = json.data[0];
                        console.log(`\n📋 First Booking Fields:`);
                        console.log(`   ✓ Booking ID: ${booking._id || 'MISSING'}`);
                        console.log(`   ✓ Property Name: ${booking.property_name || 'MISSING'}`);
                        console.log(`   ✓ Total Amount: ${booking.total_amount || booking.totalAmount || 'MISSING'}`);
                        console.log(`   ✓ Booking Status: ${booking.booking_status || booking.bookingStatus || 'MISSING'}`);
                        console.log(`   ✓ Check-in Date: ${booking.check_in_date || booking.checkInDate || 'MISSING'}`);
                        console.log(`   ✓ Check-out Date: ${booking.check_out_date || booking.checkOutDate || 'MISSING'}`);
                        console.log(`   ✓ Property Image: ${booking.propertyImage || booking.property_image ? 'YES' : 'MISSING'}`);
                        console.log(`   ✓ Property Photos: ${booking.propertyPhotos && booking.propertyPhotos.length > 0 ? booking.propertyPhotos.length + ' photos' : 'MISSING'}`);
                    } else {
                        console.log(`   ℹ️  No bookings found for user ${TEST_USER_ID}`);
                        console.log(`   ℹ️  This is normal if user has no confirmed bookings`);
                    }
                } else {
                    console.log(`\n❌ Invalid API Response - Missing success or data field`);
                }
            } catch (e) {
                console.log(data);
                console.log(`\n❌ Error parsing JSON:`, e.message);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`\n❌ Request Error:`, e.message);
        console.error(`   Make sure the backend server is running on localhost:5001`);
    });

    req.end();
}

// Run test
testGetUserBookings();

// Also test with invalid userId
setTimeout(() => {
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`Testing with invalid user ID:\n`);
    
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: `/api/bookings/user/`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            try {
                console.log(JSON.stringify(JSON.parse(data), null, 2));
            } catch (e) {
                console.log(data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Request Error:`, e.message);
    });

    req.end();
}, 2000);
