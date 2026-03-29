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

const allowedOriginsFromEnv = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const defaultDevOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

const allowedOrigins = allowedOriginsFromEnv.length > 0
    ? allowedOriginsFromEnv
    : (process.env.NODE_ENV === 'production' ? [] : defaultDevOrigins);

const corsOptions = {
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin not allowed by CORS'));
    }
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
    if (err && err.message === 'Origin not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS origin denied'
        });
    }

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
    const server = app.listen(PORT, () => {
        console.log('Server running on port ' + PORT);
        console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Stop the existing process or set a different PORT.`);
            process.exit(1);
        }

        console.error('Server startup error:', error);
        process.exit(1);
    });
}
