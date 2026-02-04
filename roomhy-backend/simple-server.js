require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Simple health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', time: new Date() });
});

// Try to connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/roomhy')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('⚠️ MongoDB error:', err.message));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Simple server running on http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
