import { useState, useEffect, useRef } from 'react';
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
import { RoomProvider, useOthers } from '../lib/liveblocks';
import Navbar from '../components/Navbar';
import EditorToolbar from '../components/EditorToolbar';
import api from '../lib/api';

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
                            style={{ backgroundColor: other.presence?.color || '#666' }}
                            title={other.presence?.name || 'Anonymous'}
                        >
                            {(other.presence?.name || 'A').charAt(0).toUpperCase()}
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
                                    style={{ backgroundColor: other.presence?.color || '#666' }}
                                >
                                    {(other.presence?.name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                        {other.presence?.name || 'Anonymous'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {other.presence?.email || 'Viewing document'}
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
    const [document, setDocument] = useState(null);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const saveTimeoutRef = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
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
        content: '',
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
                setDocument(doc);
                setTitle(doc.title);

                // Set initial content
                if (editor && doc.content) {
                    editor.commands.setContent(doc.content);
                }
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

    // Get user info and generate a random color for presence
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const userColor = `hsl(${Math.random() * 360}, 70%, 50%)`;

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
