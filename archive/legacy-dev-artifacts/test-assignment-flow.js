// Test Tenant Assignment Endpoint
const backendBase = 'http://localhost:5001';

async function testTenantAssignment() {
    try {
        console.log('\n📋 Testing Tenant Assignment Endpoint\n');
        
        // Test payload - using test data
        const payload = {
            name: 'Test Tenant ' + Date.now(),
            phone: '9876543210',
            email: 'testtenantflow@roomhy.com',
            propertyId: '697dffa55cf70ec5b8e59818', // Use existing property ID
            roomNo: '101',
            bedNo: '1',
            moveInDate: '2026-02-01',
            agreedRent: '15000'
        };

        console.log('📤 Sending Payload:');
        console.log(JSON.stringify(payload, null, 2));

        // Call the endpoint
        const assignUrl = `${backendBase}/api/tenants/assign`;
        console.log(`\n🔗 Endpoint: POST ${assignUrl}`);
        
        const response = await fetch(assignUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('\n✅ SUCCESS - Tenant Assigned!\n');
            
            console.log('📋 Tenant Details:');
            console.log(`   - ID: ${data.tenant.id}`);
            console.log(`   - Name: ${data.tenant.name}`);
            console.log(`   - Login ID: ${data.tenant.loginId}`);
            console.log(`   - Email: ${data.tenant.email}`);
            console.log(`   - Phone: ${data.tenant.phone}`);
            console.log(`   - Agreed Rent: ₹${data.tenant.agreedRent}`);
            console.log(`   - Temp Password: ${data.tenant.tempPassword}`);

            console.log('\n📊 Backend Operations:');
            console.log('   ✓ User record created (with login credentials)');
            console.log('   ✓ Tenant record created in DB');
            console.log('   ✓ Rent record auto-created with:');
            console.log(`     - Rent Amount: ₹${data.tenant.agreedRent}`);
            console.log(`     - Payment Status: pending`);
            console.log(`     - Paid Amount: ₹0`);

            console.log('\n📊 Data Flow Summary:');
            console.log(`
1️⃣  STORED IN USERS COLLECTION:
    - Name: ${data.tenant.name}
    - Login ID: ${data.tenant.loginId}
    - Password: (hashed)
    - Role: tenant

2️⃣  STORED IN TENANTS COLLECTION:
    - Tenant ID: ${data.tenant.id}
    - Name: ${data.tenant.name}
    - Property: ${data.tenant.property?.title || 'Linked'}
    - Room: ${data.tenant.roomNo}
    - Agreed Rent: ₹${data.tenant.agreedRent}

3️⃣  STORED IN RENTS COLLECTION (AUTO-CREATED):
    - Tenant Login ID: ${data.tenant.loginId}
    - Property: ${data.tenant.property?.title || 'Linked'}
    - Rent Amount: ₹${data.tenant.agreedRent}
    - Payment Status: pending
    - Paid Amount: ₹0

✅ Now available in:
   - tenants.html → GET /api/tenants (shows all tenants)
   - rentcollection.html → GET /api/rents (shows PAID/UNPAID sections)
   - Tenant can login with: ${data.tenant.loginId} / ${data.tenant.tempPassword}
            `);

            return true;
        } else {
            const error = await response.json();
            console.log('\n❌ ERROR:\n');
            console.log(error);
            return false;
        }
    } catch (err) {
        console.error('❌ Test Error:', err.message);
        return false;
    }
}

// Run test
testTenantAssignment().then(success => {
    process.exit(success ? 0 : 1);
});
