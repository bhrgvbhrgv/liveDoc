import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import LiveblocksProvider from '@liveblocks/yjs';
import { RoomProvider, useOthers, useRoom } from '../lib/liveblocks';
import Navbar from '../components/Navbar';
import EditorToolbar from '../components/EditorToolbar';
import api from '../lib/api';

const YJS_FIELD = 'default';

// Presence component to show online users
function Presence() {
    const others = useOthers();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Get current user from sessionStorage
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const totalUsers = others.length + 1; // +1 for current user

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded-md transition"
                onClick={() => setShowDropdown(!showDropdown)}
                title="Click to see who's online"
            >
                <span className="text-sm text-gray-600">
                    {others.length === 0 ? 'Only you' : `${totalUsers} online`}
                </span>
                <div className="flex -space-x-2">
                    {others.slice(0, 3).map((other) => (
                        <div
                            key={other.connectionId}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                            style={{ backgroundColor: other.info?.color || other.presence?.color || '#666' }}
                            title={other.info?.name || other.presence?.name || 'Anonymous'}
                        >
                            {(other.info?.name || other.presence?.name || 'A').charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {others.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                            +{others.length - 3}
                        </div>
                    )}
                </div>
            </div>

            {/* Dropdown showing all online users */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Online Users ({totalUsers})
                        </h3>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {/* Current User */}
                        <div className="px-4 py-2 hover:bg-gray-50 flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                style={{ backgroundColor: '#3b82f6' }}
                            >
                                {(currentUser.name || 'You').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                    {currentUser.name || 'You'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {currentUser.email || ''}
                                </div>
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                You
                            </span>
                        </div>

                        {/* Other Users */}
                        {others.map((other) => (
                            <div
                                key={other.connectionId}
                                className="px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                    style={{ backgroundColor: other.info?.color || other.presence?.color || '#666' }}
                                >
                                    {(other.info?.name || other.presence?.name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                        {other.info?.name || other.presence?.name || 'Anonymous'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {other.info?.email || other.presence?.email || 'Viewing document'}
                                    </div>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
                            </div>
                        ))}

                        {others.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                No other users online
                                <div className="text-xs mt-1">Share this document to collaborate!</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Editor component (inside RoomProvider)
function CollaborativeEditor({ documentId }) {
    const navigate = useNavigate();
    const room = useRoom();
    const [documentData, setDocumentData] = useState(null);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isProviderSynced, setIsProviderSynced] = useState(false);
    const saveTimeoutRef = useRef(null);
    const hasSeededEditorRef = useRef(false);
    const currentUser = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
    const ydoc = useMemo(() => new Y.Doc(), []);
    const provider = useMemo(() => new LiveblocksProvider(room, ydoc), [room, ydoc]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ history: false }),
            Collaboration.configure({ document: ydoc, field: YJS_FIELD }),
            CollaborationCursor.configure({
                provider,
                user: {
                    name: currentUser.name || 'Anonymous',
                    color: currentUser.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableCell,
            TableHeader,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Subscript,
            Superscript,
        ],
        onUpdate: ({ editor }) => {
            // Auto-save after 2 seconds of inactivity
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                handleAutoSave(editor.getHTML());
            }, 2000);
        },
    });

    useEffect(() => {
        const handleSync = (synced) => {
            setIsProviderSynced(Boolean(synced));
        };

        provider.on('synced', handleSync);
        provider.on('sync', handleSync);

        return () => {
            provider.off('synced', handleSync);
            provider.off('sync', handleSync);
        };
    }, [provider]);

    useEffect(() => {
        if (!isProviderSynced || !editor || !documentData || hasSeededEditorRef.current) {
            return;
        }

        const hasDatabaseContent = typeof documentData.content === 'string' && documentData.content.trim().length > 0;
        const editorIsEmpty = editor.isEmpty || editor.getText().trim().length === 0;

        // Seed from DB only when the collaborative doc is effectively empty.
        // This avoids race conditions and prevents overwriting remote content.
        if (hasDatabaseContent && editorIsEmpty) {
            editor.commands.setContent(documentData.content);
        }

        hasSeededEditorRef.current = true;
    }, [isProviderSynced, editor, documentData]);

    useEffect(() => {
        hasSeededEditorRef.current = false;
        setIsProviderSynced(false);
    }, [documentId]);

    useEffect(() => {
        return () => {
            provider.destroy();
            ydoc.destroy();
        };
    }, [provider, ydoc]);

    useEffect(() => {
        fetchDocument();

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [documentId]);

    const fetchDocument = async () => {
        try {
            const response = await api.get(`/documents/${documentId}`);
            if (response.data.success) {
                const doc = response.data.document;
                setDocumentData(doc);
                setTitle(doc.title);
            }
        } catch (error) {
            console.error('Error fetching document:', error);
            alert('Failed to load document');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoSave = async (content) => {
        setSaving(true);
        try {
            await api.put(`/documents/${documentId}`, {
                title,
                content
            });
        } catch (error) {
            console.error('Auto-save error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleTitleChange = async (newTitle) => {
        setTitle(newTitle);

        try {
            await api.put(`/documents/${documentId}`, {
                title: newTitle
            });
        } catch (error) {
            console.error('Error updating title:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-600">Loading document...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm">
                    {/* Document Header */}
                    <div className="border-b px-6 py-4 flex items-center justify-between">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="text-2xl font-semibold text-gray-900 border-none outline-none focus:ring-0 flex-1"
                            placeholder="Untitled Document"
                        />

                        <div className="flex items-center gap-4">
                            {saving && (
                                <span className="text-sm text-gray-500">Saving...</span>
                            )}
                            <Presence />
                        </div>
                    </div>

                    {/* Editor Toolbar */}
                    <EditorToolbar editor={editor} />

                    {/* Editor Content */}
                    <div className="p-6">
                        <EditorContent editor={editor} className="prose max-w-none" />
                    </div>
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                    💡 Tip: Open this document in another tab or share with others to see real-time collaboration!
                </div>
            </div>
        </div>
    );
}

// Main Editor page with RoomProvider
export default function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [accessState, setAccessState] = useState('checking');
    const [accessRequestStatus, setAccessRequestStatus] = useState('idle');

    useEffect(() => {
        let isMounted = true;

        const ensureDocumentAccess = async () => {
            try {
                await api.get(`/documents/${id}`);
                if (isMounted) {
                    setAccessState('ready');
                }
                return;
            } catch (error) {
                const status = error?.response?.status;

                if (status === 403) {
                    if (isMounted) {
                        setAccessState('forbidden');
                    }
                    return;
                }

                if (isMounted) {
                    setAccessState(status === 404 ? 'not_found' : 'error');
                }
            }
        };

        ensureDocumentAccess();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (accessRequestStatus !== 'requested') {
            return undefined;
        }

        const intervalId = setInterval(async () => {
            try {
                await api.get(`/documents/${id}`);
                setAccessState('ready');
            } catch (error) {
                // Keep polling until owner approves or user navigates away.
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [accessRequestStatus, id]);

    const handleRequestAccess = async () => {
        setAccessRequestStatus('sending');
        try {
            await api.post(`/documents/${id}/access-request`);
            setAccessRequestStatus('requested');
        } catch (error) {
            setAccessRequestStatus('failed');
        }
    };

    // Get user info and generate a stable color for this session
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const colorStorageKey = `presence-color-${user.id || 'anonymous'}`;
    let userColor = sessionStorage.getItem(colorStorageKey);
    if (!userColor) {
        userColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
        sessionStorage.setItem(colorStorageKey, userColor);
    }

    if (accessState === 'checking') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-600">Joining document...</p>
                </div>
            </div>
        );
    }

    if (accessState !== 'ready') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white shadow-sm rounded-lg p-6 max-w-md w-full text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot open this document</h2>
                    <p className="text-gray-600 mb-4">
                        {accessState === 'not_found'
                            ? 'This document does not exist.'
                            : accessState === 'forbidden'
                                ? 'You do not have permission to join this document.'
                                : 'Something went wrong while opening this document.'}
                    </p>
                    {accessState === 'forbidden' && (
                        <>
                            <button
                                onClick={handleRequestAccess}
                                disabled={accessRequestStatus === 'sending' || accessRequestStatus === 'requested'}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {accessRequestStatus === 'sending'
                                    ? 'Sending Request...'
                                    : accessRequestStatus === 'requested'
                                        ? 'Request Sent'
                                        : 'Request Access'}
                            </button>
                            {accessRequestStatus === 'requested' && (
                                <p className="text-sm text-gray-500 mt-3">
                                    Request sent to the owner. This page will open automatically after approval.
                                </p>
                            )}
                            {accessRequestStatus === 'failed' && (
                                <p className="text-sm text-red-600 mt-3">
                                    Failed to send request. Please try again.
                                </p>
                            )}
                        </>
                    )}
                    <div className="mt-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <RoomProvider
            id={`document-${id}`}
            initialPresence={{
                name: user.name || 'Anonymous',
                email: user.email || '',
                color: userColor
            }}
        >
            <CollaborativeEditor documentId={id} />
        </RoomProvider>
    );
}
