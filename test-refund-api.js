// Test script for refund API
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5001';

async function testRefundAPI() {
    console.log('🧪 Testing Refund API...\n');

    // Test data
    const testRefund = {
        booking_id: '65a1234567890abcdef12345',
        user_id: 'roomhyweb000011',
        payment_id: 'pay_12345678901234',
        user_name: 'Test User',
        user_phone: '9876543210',
        user_email: 'test@example.com',
        refund_amount: 15000,
        request_type: 'refund',
        refund_method: 'upi',
        upi_id: 'testuser@upi'
    };

    console.log('📤 Request payload:');
    console.log(JSON.stringify(testRefund, null, 2));
    console.log('\n');

    try {
        const response = await fetch(`${API_URL}/api/booking/refund-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testRefund)
        });

        console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

        const data = await response.json();
        console.log('📥 Response Data:');
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ SUCCESS: Refund request created!');
        } else {
            console.log('\n❌ FAILED: Check error message above');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testRefundAPI();
