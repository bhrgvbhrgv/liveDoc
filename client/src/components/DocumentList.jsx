import { useNavigate } from 'react-router-dom';

export default function DocumentList({ documents, onDelete }) {
    const navigate = useNavigate();

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (documents.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new document.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
                <div
                    key={doc._id}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer group"
                >
                    <div onClick={() => navigate(`/editor/${doc._id}`)}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                            {doc.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                            Updated {formatDate(doc.updatedAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                            Owner: {doc.ownerId?.name || 'Unknown'}
                        </p>
                    </div>

                    <div className="mt-3 pt-3 border-t flex justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(doc._id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
