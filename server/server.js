require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const liveblocksRoutes = require('./routes/liveblocks');

const app = express();

// Connect to MongoDB
connectDB();

// Manual CORS implementation to fix Vercel issues
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests immediately
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api', liveblocksRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'LiveDoc API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

// Export app for Vercel
module.exports = app;

// Only listen if running directly (not in serverless environment)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('🚀 Server running on port ' + PORT);
        console.log('🔄 Server Restarted with Email Fix');
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}
