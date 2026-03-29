import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const [accessRequests, setAccessRequests] = useState([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const previousCountRef = useRef(0);

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/');
    };

    useEffect(() => {
        let isMounted = true;

        const fetchAccessRequests = async () => {
            try {
                const response = await api.get('/documents/access-requests/owned');
                const requests = response?.data?.requests || [];

                if (!isMounted) {
                    return;
                }

                if (previousCountRef.current === 0 && requests.length > 0) {
                    setShowRequestModal(true);
                }

                previousCountRef.current = requests.length;
                setAccessRequests(requests);
            } catch (error) {
                if (isMounted) {
                    setAccessRequests([]);
                }
            }
        };

        fetchAccessRequests();
        const intervalId = setInterval(fetchAccessRequests, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const handleAccessDecision = async (documentId, requesterId, action) => {
        if (!requesterId) {
            return;
        }

        try {
            await api.post(`/documents/${documentId}/access-requests/${requesterId}/${action}`);
            const response = await api.get('/documents/access-requests/owned');
            const requests = response?.data?.requests || [];
            previousCountRef.current = requests.length;
            setAccessRequests(requests);
            if (requests.length === 0) {
                setShowRequestModal(false);
            }
        } catch (error) {
            alert(`Failed to ${action} access request`);
        }
    };

    return (
        <>
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                                <img src="/logo.png" alt="LiveDoc Logo" className="h-8 w-8" />
                                <h1 className="text-2xl font-bold text-primary-600">LiveDoc</h1>
                            </div>
                        </div>

                        {user.name && (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setShowRequestModal(true)}
                                    className="relative px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition"
                                >
                                    Requests
                                    {accessRequests.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                                            {accessRequests.length}
                                        </span>
                                    )}
                                </button>
                                <div className="h-6 w-px bg-gray-300"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Access Requests</h3>
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Close
                            </button>
                        </div>

                        {accessRequests.length === 0 ? (
                            <p className="text-gray-600">No pending requests.</p>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {accessRequests.map((request) => (
                                    <div key={`${request.documentId}-${request.requester?.id || request.requestedAt}`} className="border rounded-md p-3">
                                        <p className="text-sm text-gray-900 font-medium">{request.requester?.name || 'Unknown user'}</p>
                                        <p className="text-xs text-gray-500">{request.requester?.email || 'No email'}</p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            wants access to <span className="font-semibold">{request.documentTitle}</span>
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => handleAccessDecision(request.documentId, request.requester?.id, 'approve')}
                                                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition"
                                            >
                                                Allow
                                            </button>
                                            <button
                                                onClick={() => handleAccessDecision(request.documentId, request.requester?.id, 'reject')}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
