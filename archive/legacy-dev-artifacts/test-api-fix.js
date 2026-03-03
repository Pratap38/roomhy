// Test script to verify the API fix for owner_id parameter
const fetch = require('node-fetch');

async function testAPI() {
    const API_URL = 'http://localhost:3000'; // Adjust if your server runs on different port

    console.log('Testing API endpoint: GET /api/website-enquiry?owner_id=ROOMHY9603');

    try {
        const response = await fetch(`${API_URL}/api/website-enquiry?owner_id=ROOMHY9603`);
        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ API fix successful! Enquiries retrieved:', data.count);
        } else {
            console.log('❌ API returned error:', data.message);
        }
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        console.log('Make sure your server is running on port 3000');
    }
}

testAPI();
