const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Document = require('../models/Document');

// @route   POST /api/documents
// @desc    Create a new document
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title } = req.body;

        const document = new Document({
            title: title || 'Untitled Document',
            ownerId: req.userId,
            collaborators: [req.userId]
        });

        await document.save();

        res.status(201).json({
            success: true,
            message: 'Document created successfully',
            document
        });
    } catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating document'
        });
    }
});

// @route   GET /api/documents
// @desc    Get all documents for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documents = await Document.find({
            $or: [
                { ownerId: req.userId },
                { collaborators: req.userId }
            ]
        })
            .sort({ updatedAt: -1 })
            .populate('ownerId', 'name email avatar');

        res.json({
            success: true,
            documents
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching documents'
        });
    }
});

// @route   GET /api/documents/:id
// @desc    Get a single document by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('ownerId', 'name email avatar')
            .populate('collaborators', 'name email avatar');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check if user has access
        const hasAccess = document.ownerId._id.toString() === req.userId ||
            document.collaborators.some(c => c._id.toString() === req.userId);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            document
        });
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching document'
        });
    }
});

// @route   PUT /api/documents/:id
// @desc    Update a document
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check if user has access
        const hasAccess = document.ownerId.toString() === req.userId ||
            document.collaborators.some(c => c.toString() === req.userId);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update fields
        if (title !== undefined) document.title = title;
        if (content !== undefined) document.content = content;

        await document.save();

        res.json({
            success: true,
            message: 'Document updated successfully',
            document
        });
    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating document'
        });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Only owner can delete
        if (document.ownerId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the owner can delete this document'
            });
        }

        await Document.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting document'
        });
    }
});

module.exports = router;
