const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const Document = require('../models/Document');

function userCanAccessDocument(document, userId) {
    const ownerId = typeof document.ownerId === 'object' && document.ownerId._id
        ? document.ownerId._id.toString()
        : document.ownerId.toString();
    const isOwner = ownerId === userId;
    const isCollaborator = document.collaborators.some((collaborator) => {
        if (typeof collaborator === 'object' && collaborator._id) {
            return collaborator._id.toString() === userId;
        }
        return collaborator.toString() === userId;
    });

    return isOwner || isCollaborator;
}

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

// @route   POST /api/documents/:id/access-request
// @desc    Request access to a document
// @access  Private
router.post('/:id/access-request', authMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid document ID'
            });
        }

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (userCanAccessDocument(document, req.userId)) {
            return res.json({
                success: true,
                message: 'You already have access to this document'
            });
        }

        const existingRequest = document.accessRequests.some(
            (request) => request.userId.toString() === req.userId
        );

        if (existingRequest) {
            return res.json({
                success: true,
                message: 'Access request already sent'
            });
        }

        document.accessRequests.push({ userId: req.userId });
        await document.save();

        res.status(201).json({
            success: true,
            message: 'Access request sent to the document owner'
        });
    } catch (error) {
        console.error('Access request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error requesting access'
        });
    }
});

// @route   GET /api/documents/access-requests/owned
// @desc    Get access requests for documents owned by current user
// @access  Private
router.get('/access-requests/owned', authMiddleware, async (req, res) => {
    try {
        const documents = await Document.find({
            ownerId: req.userId,
            'accessRequests.0': { $exists: true }
        })
            .select('title accessRequests')
            .populate('accessRequests.userId', 'name email avatar')
            .sort({ updatedAt: -1 });

        const requests = [];
        documents.forEach((document) => {
            document.accessRequests.forEach((request) => {
                requests.push({
                    documentId: document._id,
                    documentTitle: document.title,
                    requester: request.userId
                        ? {
                            id: request.userId._id,
                            name: request.userId.name,
                            email: request.userId.email,
                            avatar: request.userId.avatar
                        }
                        : null,
                    requestedAt: request.requestedAt
                });
            });
        });

        requests.sort((a, b) => new Date(a.requestedAt) - new Date(b.requestedAt));

        res.json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Fetch access requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching access requests'
        });
    }
});

// @route   POST /api/documents/:id/access-requests/:requesterId/approve
// @desc    Approve an access request
// @access  Private (owner only)
router.post('/:id/access-requests/:requesterId/approve', authMiddleware, async (req, res) => {
    try {
        const { id, requesterId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requesterId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (document.ownerId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the owner can approve access requests'
            });
        }

        const hadRequest = document.accessRequests.some((request) => request.userId.toString() === requesterId);
        if (!hadRequest) {
            return res.status(404).json({
                success: false,
                message: 'Access request not found'
            });
        }

        await Document.findByIdAndUpdate(id, {
            $addToSet: { collaborators: requesterId },
            $pull: { accessRequests: { userId: requesterId } }
        });

        res.json({
            success: true,
            message: 'Access request approved'
        });
    } catch (error) {
        console.error('Approve access request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error approving access request'
        });
    }
});

// @route   POST /api/documents/:id/access-requests/:requesterId/reject
// @desc    Reject an access request
// @access  Private (owner only)
router.post('/:id/access-requests/:requesterId/reject', authMiddleware, async (req, res) => {
    try {
        const { id, requesterId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requesterId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (document.ownerId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the owner can reject access requests'
            });
        }

        await Document.findByIdAndUpdate(id, {
            $pull: { accessRequests: { userId: requesterId } }
        });

        res.json({
            success: true,
            message: 'Access request rejected'
        });
    } catch (error) {
        console.error('Reject access request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error rejecting access request'
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

        if (!userCanAccessDocument(document, req.userId)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this document'
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

        if (!userCanAccessDocument(document, req.userId)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this document'
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
