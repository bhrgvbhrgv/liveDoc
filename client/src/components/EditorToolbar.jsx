import { useState, useRef } from 'react';

export default function EditorToolbar({ editor }) {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showTableInput, setShowTableInput] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const fileInputRef = useRef(null);

    if (!editor) {
        return null;
    }

    // Theme colors - main colors
    const themeColors = [
        '#FFFFFF', // White
        '#000000', // Black
        '#44546A', // Dark Blue
        '#4472C4', // Blue
        '#ED7D31', // Orange
        '#A5A5A5', // Gray
        '#FFC000', // Gold
        '#5B9BD5', // Light Blue
        '#70AD47', // Green
    ];

    // Generate shades for each theme color (5 shades: lighter to darker)
    const generateShades = (baseColor) => {
        if (baseColor === '#FFFFFF') {
            return ['#FFFFFF', '#F2F2F2', '#D9D9D9', '#BFBFBF', '#A6A6A6'];
        }
        if (baseColor === '#000000') {
            return ['#000000', '#7F7F7F', '#595959', '#3F3F3F', '#262626'];
        }
        // For other colors, generate tints and shades
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const shades = [];
        const steps = [0.8, 0.6, 0.4, -0.25, -0.5]; // lighter to darker

        steps.forEach(step => {
            let nr, ng, nb;
            if (step > 0) {
                // Tint (lighter)
                nr = Math.round(r + (255 - r) * step);
                ng = Math.round(g + (255 - g) * step);
                nb = Math.round(b + (255 - b) * step);
            } else {
                // Shade (darker)
                nr = Math.round(r * (1 + step));
                ng = Math.round(g * (1 + step));
                nb = Math.round(b * (1 + step));
            }
            shades.push(`#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1).toUpperCase()}`);
        });

        return shades;
    };

    // Standard colors
    const standardColors = [
        '#C00000', // Dark Red
        '#FF0000', // Red
        '#FFC000', // Orange
        '#FFFF00', // Yellow
        '#92D050', // Light Green
        '#00B050', // Green
        '#00B0F0', // Light Blue
        '#0070C0', // Blue
        '#002060', // Dark Blue
        '#7030A0', // Purple
    ];

    const ToolbarButton = ({ onClick, isActive, children, title, disabled }) => (
        <button
            onClick={onClick}
            onMouseDown={(e) => e.preventDefault()}
            disabled={disabled}
            className={`p-2 rounded hover:bg-gray-200 transition ${isActive ? 'bg-gray-300 text-primary-600' : 'text-gray-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={title}
        >
            {children}
        </button>
    );

    const Divider = () => <div className="w-px bg-gray-300 mx-1"></div>;

    const setLink = () => {
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
            setLinkUrl('');
            setShowLinkInput(false);
        }
    };

    const addImage = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result;
                if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
        setShowTableInput(false);
        setTableRows(3);
        setTableCols(3);
    };

    return (
        <div className="border-b bg-white px-4 py-2 flex flex-wrap gap-1 sticky top-0 z-10">
            {/* Text Formatting Group */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold (Ctrl+B)"
            >
                <strong>B</strong>
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic (Ctrl+I)"
            >
                <em>I</em>
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="Underline (Ctrl+U)"
            >
                <u>U</u>
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
            >
                <s>S</s>
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                title="Inline Code"
            >
                {'</>'}
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                isActive={editor.isActive('subscript')}
                title="Subscript"
            >
                X<sub>2</sub>
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                isActive={editor.isActive('superscript')}
                title="Superscript"
            >
                X<sup>2</sup>
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().unsetAllMarks().run()}
                isActive={false}
                title="Clear Formatting"
            >
                ✕
            </ToolbarButton>

            <Divider />

            {/* Text Color */}
            <div className="relative">
                <ToolbarButton
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    isActive={showColorPicker}
                    title="Text Color"
                >
                    <span style={{ borderBottom: `3px solid ${editor.getAttributes('textStyle').color || '#000'}` }}>
                        A
                    </span>
                </ToolbarButton>
                {showColorPicker && (
                    <div className="absolute top-full mt-1 bg-white border rounded shadow-lg p-3 z-20" style={{ width: '240px' }}>
                        {/* Automatic */}
                        <div className="mb-3">
                            <button
                                onClick={() => {
                                    editor.chain().focus().unsetColor().run();
                                    setShowColorPicker(false);
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                            >
                                <div className="w-4 h-4 border border-gray-300 bg-black"></div>
                                <span>Automatic</span>
                            </button>
                        </div>

                        {/* Theme Colors */}
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Theme Colors</div>
                            {/* Main theme colors */}
                            <div className="grid grid-cols-9 gap-1 mb-1">
                                {themeColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            editor.chain().focus().setColor(color).run();
                                            setShowColorPicker(false);
                                        }}
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            {/* Shades for each theme color */}
                            {[0, 1, 2, 3, 4].map((shadeIndex) => (
                                <div key={shadeIndex} className="grid grid-cols-9 gap-1 mb-1">
                                    {themeColors.map((color) => {
                                        const shades = generateShades(color);
                                        const shadeColor = shades[shadeIndex];
                                        return (
                                            <button
                                                key={`${color}-${shadeIndex}`}
                                                onClick={() => {
                                                    editor.chain().focus().setColor(shadeColor).run();
                                                    setShowColorPicker(false);
                                                }}
                                                onMouseDown={(e) => e.preventDefault()}
                                                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                                                style={{ backgroundColor: shadeColor }}
                                                title={shadeColor}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Standard Colors */}
                        <div>
                            <div className="text-xs font-semibold text-gray-700 mb-2">Standard Colors</div>
                            <div className="grid grid-cols-10 gap-1">
                                {standardColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            editor.chain().focus().setColor(color).run();
                                            setShowColorPicker(false);
                                        }}
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Highlight Color */}
            <div className="relative">
                <ToolbarButton
                    onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                    isActive={showHighlightPicker || editor.isActive('highlight')}
                    title="Highlight Color"
                >
                    <span style={{ backgroundColor: editor.getAttributes('highlight').color || '#ffff00', padding: '0 2px' }}>
                        H
                    </span>
                </ToolbarButton>
                {showHighlightPicker && (
                    <div className="absolute top-full mt-1 bg-white border rounded shadow-lg p-3 z-20" style={{ width: '240px' }}>
                        {/* No Highlight */}
                        <div className="mb-3">
                            <button
                                onClick={() => {
                                    editor.chain().focus().unsetHighlight().run();
                                    setShowHighlightPicker(false);
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                            >
                                <div className="w-4 h-4 border border-gray-300 bg-white"></div>
                                <span>No Highlight</span>
                            </button>
                        </div>

                        {/* Theme Colors */}
                        <div className="mb-2">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Theme Colors</div>
                            {/* Main theme colors */}
                            <div className="grid grid-cols-9 gap-1 mb-1">
                                {themeColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            editor.chain().focus().setHighlight({ color }).run();
                                            setShowHighlightPicker(false);
                                        }}
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            {/* Shades for each theme color */}
                            {[0, 1, 2, 3, 4].map((shadeIndex) => (
                                <div key={shadeIndex} className="grid grid-cols-9 gap-1 mb-1">
                                    {themeColors.map((color) => {
                                        const shades = generateShades(color);
                                        const shadeColor = shades[shadeIndex];
                                        return (
                                            <button
                                                key={`${color}-${shadeIndex}`}
                                                onClick={() => {
                                                    editor.chain().focus().setHighlight({ color: shadeColor }).run();
                                                    setShowHighlightPicker(false);
                                                }}
                                                onMouseDown={(e) => e.preventDefault()}
                                                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                                                style={{ backgroundColor: shadeColor }}
                                                title={shadeColor}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Standard Colors */}
                        <div>
                            <div className="text-xs font-semibold text-gray-700 mb-2">Standard Colors</div>
                            <div className="grid grid-cols-10 gap-1">
                                {standardColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            editor.chain().focus().setHighlight({ color }).run();
                                            setShowHighlightPicker(false);
                                        }}
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Divider />

            {/* Headings */}
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

            <Divider />

            {/* Text Alignment */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Align Left"
            >
                ⬅
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Align Center"
            >
                ↔
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Align Right"
            >
                ➡
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title="Justify"
            >
                ⬌
            </ToolbarButton>

            <Divider />

            {/* Lists */}
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

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                isActive={editor.isActive('taskList')}
                title="Task List"
            >
                ☑ Task
            </ToolbarButton>

            <Divider />

            {/* Blocks */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Blockquote"
            >
                " Quote
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                title="Code Block"
            >
                {'{ }'}
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                isActive={false}
                title="Horizontal Rule"
            >
                ―
            </ToolbarButton>

            <Divider />

            {/* Link */}
            <div className="relative">
                <ToolbarButton
                    onClick={() => {
                        if (editor.isActive('link')) {
                            editor.chain().focus().unsetLink().run();
                        } else {
                            setShowLinkInput(!showLinkInput);
                        }
                    }}
                    isActive={editor.isActive('link') || showLinkInput}
                    title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
                >
                    🔗
                </ToolbarButton>
                {showLinkInput && (
                    <div className="absolute top-full mt-1 bg-white border rounded shadow-lg p-2 z-20 flex gap-2">
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setLink();
                                } else if (e.key === 'Escape') {
                                    setShowLinkInput(false);
                                    setLinkUrl('');
                                }
                            }}
                            placeholder="Enter URL"
                            className="border rounded px-2 py-1 text-sm w-64"
                            autoFocus
                        />
                        <button
                            onClick={setLink}
                            onMouseDown={(e) => e.preventDefault()}
                            className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                        >
                            Add
                        </button>
                    </div>
                )}
            </div>

            {/* Image */}
            <ToolbarButton
                onClick={addImage}
                isActive={false}
                title="Insert Image"
            >
                🖼
            </ToolbarButton>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />

            {/* Table */}
            <div className="relative">
                <ToolbarButton
                    onClick={() => setShowTableInput(!showTableInput)}
                    isActive={editor.isActive('table') || showTableInput}
                    title="Insert Table"
                >
                    ⊞
                </ToolbarButton>
                {showTableInput && (
                    <div className="absolute top-full right-0 mt-1 bg-white border rounded shadow-lg p-3 z-20 flex flex-col gap-3 w-48">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-600">Rows</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={tableRows}
                                onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                                className="border rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-600">Columns</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={tableCols}
                                onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                                className="border rounded px-2 py-1 text-sm"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowTableInput(false)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={insertTable}
                                className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                            >
                                Insert
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Divider />

            {/* History */}
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                isActive={false}
                disabled={!editor.can().undo()}
                title="Undo"
            >
                ↶
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                isActive={false}
                disabled={!editor.can().redo()}
                title="Redo"
            >
                ↷
            </ToolbarButton>
        </div>
    );
}
