const { spawn } = require('child_process');
const http = require('http');

// Start the server
const server = spawn('node', ['roomhy-backend/server.js'], {
    cwd: 'c:\\Users\\yasmi\\OneDrive\\Desktop\\roomhy final',
    stdio: 'inherit'
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

// Wait for server to start
setTimeout(() => {
    // Test the API
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/website-properties/all',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log('Response:', data);
            server.kill();
            process.exit(0);
        });
    });

    req.on('error', (err) => {
        console.error('Request failed:', err.message);
        console.error('Full error:', err);
        server.kill();
        process.exit(1);
    });

    req.end();
}, 5000);