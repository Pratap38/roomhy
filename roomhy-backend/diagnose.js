const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Checking environment...');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✓ Set' : '✗ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 5001);

// Try to load required packages
const packages = ['express', 'mongoose', 'cors', 'dotenv'];
packages.forEach(pkg => {
    try {
        require(pkg);
        console.log(`✓ ${pkg} loaded`);
    } catch (e) {
        console.log(`✗ ${pkg} FAILED:`, e.message);
    }
});

// Try to load routes
const routes = [
    './routes/authRoutes',
    './routes/bookingRoutes',
    './routes/propertyRoutes'
];

routes.forEach(route => {
    try {
        require(route);
        console.log(`✓ ${route} loaded`);
    } catch (e) {
        console.log(`✗ ${route} FAILED:`, e.message);
    }
});

console.log('\n✅ Diagnostics complete');
