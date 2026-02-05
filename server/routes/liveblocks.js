const express = require('express');
const router = express.Router();
const { Liveblocks } = require('@liveblocks/node');
const authMiddleware = require('../middleware/authMiddleware');

// Initialize Liveblocks
const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

// @route   POST /api/liveblocks-auth
// @desc    Generate Liveblocks session token for authenticated user
// @access  Private
router.post('/liveblocks-auth', authMiddleware, async (req, res) => {
    try {
        const { room } = req.body;

        if (!room) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        // Create a session for the current user
        const session = liveblocks.prepareSession(req.userId, {
            userInfo: {
                name: req.userEmail.split('@')[0], // Use email prefix as name
                email: req.userEmail,
                color: getRandomColor(), // Assign random color for cursor
            },
        });

        // Grant access to the specified room
        session.allow(room, session.FULL_ACCESS);

        // Authorize the session
        const { status, body } = await session.authorize();

        res.status(status).send(body);
    } catch (error) {
        console.error('Liveblocks auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during Liveblocks authentication'
        });
    }
});

// Helper function to generate random colors for cursors
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = router;
