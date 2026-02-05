const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Document title is required'],
        trim: true,
        default: 'Untitled Document'
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    content: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster queries
documentSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
