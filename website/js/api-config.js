// API Configuration for RoomHy
// Smart endpoint selection: Use localhost for development, Render for production
const getAPIURL = () => {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Frontend on 5000, Backend API on 5001
    return isDevelopment ? 'http://localhost:5001' : 'https://roomhy-backend-wqwo.onrender.com';
};

const API_URL = getAPIURL();

// Log configuration for debugging
console.log('🔗 [API Config] Environment:', window.location.hostname === 'localhost' ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('🔗 [API Config] API_URL:', API_URL);

// Test API connectivity (use a public endpoint that doesn't require auth)
(async () => {
    try {
        const testResponse = await fetch(`${API_URL}/api/locations/cities`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (testResponse.ok) {
            console.log('✅ [API Config] Backend is accessible');
        } else {
            console.warn('⚠️ [API Config] Backend returned status:', testResponse.status);
        }
    } catch (error) {
        console.warn('⚠️ [API Config] Backend not accessible:', error.message);
        console.warn('⚠️ Data will be stored locally in browser storage');
    }
})();

// Export for use in other scripts
window.API_URL = API_URL;
