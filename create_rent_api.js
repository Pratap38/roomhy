const http = require('http');

const data = JSON.stringify({
    tenantId: new (require('mongoose')).Types.ObjectId().toString(),
    propertyId: new (require('mongoose')).Types.ObjectId().toString(),
    rentAmount: 1500,
    deposit: 0,
    tenantName: 'Test Tenant',
    tenantEmail: 'tenant@example.com',
    tenantPhone: '9876543210',
    roomNumber: '101',
    ownerLoginId: 'owner123'
});

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/rents',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', JSON.parse(body));
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
});

console.log('Creating test rent via API...');
req.write(data);
req.end();
