const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));
app.use('/Areamanager', express.static(path.join(__dirname, 'Areamanager')));
app.use('/propertyowner', express.static(path.join(__dirname, 'propertyowner')));
app.use('/tenant', express.static(path.join(__dirname, 'tenant')));
app.use('/superadmin', express.static(path.join(__dirname, 'superadmin')));
app.use('/website', express.static(path.join(__dirname, 'website')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Frontend server running on port 5000' });
});

const FRONTEND_PORT = process.env.FRONTEND_PORT || 5000;

app.listen(FRONTEND_PORT, '0.0.0.0', () => {
    console.log(`✅ Frontend server running on http://localhost:${FRONTEND_PORT}`);
    console.log(`🔗 Backend API available on http://localhost:5001`);
    console.log(`📝 Update API_URL in your code to: http://localhost:5001`);
});
