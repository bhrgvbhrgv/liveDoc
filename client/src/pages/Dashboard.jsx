import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DocumentList from '../components/DocumentList';
import api from '../lib/api';

export default function Dashboard() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinUrl, setJoinUrl] = useState('');
    const [joinError, setJoinError] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents');
            if (response.data.success) {
                setDocuments(response.data.documents);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDocument = async () => {
        setCreating(true);
        try {
            const response = await api.post('/documents', {
                title: 'Untitled Document'
            });

            if (response.data.success) {
                navigate(`/editor/${response.data.document._id}`);
            }
        } catch (error) {
            console.error('Error creating document:', error);
            alert('Failed to create document');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteDocument = async (id) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            const response = await api.delete(`/documents/${id}`);
            if (response.data.success) {
                setDocuments(documents.filter(doc => doc._id !== id));
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document');
        }
    };

    const handleJoinDocument = () => {
        setJoinError('');

        if (!joinUrl.trim()) {
            setJoinError('Please enter a document URL');
            return;
        }

        try {
            // Extract document ID from URL
            // Supports formats like:
            // - http://localhost:3000/editor/123abc
            // - /editor/123abc
            // - 123abc
            let documentId = '';

            if (joinUrl.includes('/editor/')) {
                documentId = joinUrl.split('/editor/')[1].split(/[?#]/)[0];
            } else if (joinUrl.includes('/document/')) {
                documentId = joinUrl.split('/document/')[1].split(/[?#]/)[0];
            } else {
                // Assume it's just the ID
                documentId = joinUrl.trim();
            }

            if (!documentId) {
                setJoinError('Invalid document URL format');
                return;
            }

            // Navigate to the document
            setShowJoinModal(false);
            setJoinUrl('');
            navigate(`/editor/${documentId}`);
        } catch (error) {
            setJoinError('Invalid URL format');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">My Documents</h2>
                        <p className="text-gray-600 mt-1">Create and manage your collaborative documents</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="bg-white text-primary-600 border-2 border-primary-600 px-6 py-3 rounded-md font-medium hover:bg-primary-50 transition flex items-center gap-2"
                        >
                            <span className="text-xl">🔗</span>
                            Join Document
                        </button>

                        <button
                            onClick={handleCreateDocument}
                            disabled={creating}
                            className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <span className="text-xl">+</span>
                            {creating ? 'Creating...' : 'New Document'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-gray-600">Loading documents...</p>
                    </div>
                ) : (
                    <DocumentList documents={documents} onDelete={handleDeleteDocument} />
                )}
            </div>

            {/* Join Document Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Join Document</h3>
                        <p className="text-gray-600 mb-4">
                            Enter the document URL or ID to join and collaborate
                        </p>

                        <input
                            type="text"
                            value={joinUrl}
                            onChange={(e) => {
                                setJoinUrl(e.target.value);
                                setJoinError('');
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleJoinDocument()}
                            placeholder="http://localhost:3000/editor/abc123 or abc123"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                            autoFocus
                        />

                        {joinError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm mb-4">
                                {joinError}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowJoinModal(false);
                                    setJoinUrl('');
                                    setJoinError('');
                                }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleJoinDocument}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                            >
                                Join Document
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
