export default function EditorToolbar({ editor }) {
    if (!editor) {
        return null;
    }

    const ToolbarButton = ({ onClick, isActive, children, title }) => (
        <button
            onClick={onClick}
            className={`p-2 rounded hover:bg-gray-200 transition ${isActive ? 'bg-gray-300 text-primary-600' : 'text-gray-700'
                }`}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div className="border-b bg-white px-4 py-2 flex flex-wrap gap-1 sticky top-0 z-10">
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
            >
                <strong>B</strong>
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
            >
                <em>I</em>
            </ToolbarButton>

            <div className="w-px bg-gray-300 mx-1"></div>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
            >
                H1
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
            >
                H2
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
            >
                H3
            </ToolbarButton>

            <div className="w-px bg-gray-300 mx-1"></div>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
            >
                • List
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Numbered List"
            >
                1. List
            </ToolbarButton>

            <div className="w-px bg-gray-300 mx-1"></div>

            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                isActive={false}
                title="Undo"
            >
                ↶
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                isActive={false}
                title="Redo"
            >
                ↷
            </ToolbarButton>
        </div>
    );
}
