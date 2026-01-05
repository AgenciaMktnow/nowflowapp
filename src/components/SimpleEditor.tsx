
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import CodeBlock from '@tiptap/extension-code-block';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from './editor/extensions/FontSize';
import { useEffect, useCallback, useState } from 'react';

interface SimpleEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onImageUpload?: (file: File) => Promise<string>;
}

const SimpleEditor = ({ value, onChange, placeholder, onImageUpload }: SimpleEditorProps) => {
    // Force re-render on editor updates to ensure toolbar active states are immediate
    const [, forceUpdate] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                // Disable built-in extensions that we're configuring separately
                codeBlock: false,
            }),
            Underline,
            ImageExtension,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            CodeBlock,
            FontFamily,
            FontSize,
            Placeholder.configure({
                placeholder: placeholder || 'Digite aqui...',
                emptyEditorClass: 'is-editor-empty relative before:content-[attr(data-placeholder)] before:text-gray-500 before:absolute before:left-0 before:top-0 before:pointer-events-none',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onTransaction: () => {
            forceUpdate((n) => n + 1);
        },
        onSelectionUpdate: () => {
            forceUpdate((n) => n + 1);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none h-full text-text-main p-4 leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:marker:text-gray-400',
            },
        },
    });

    // Drag and Drop Handler
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);

        if (files && files.length > 0 && editor) {
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    if (onImageUpload) {
                        try {
                            // Show loading state if needed (placeholder)
                            const url = await onImageUpload(file);
                            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
                        } catch (error) {
                            console.error('Upload failed', error);
                            alert('Falha ao fazer upload da imagem.');
                        }
                    } else {
                        // Fallback to local preview
                        const url = URL.createObjectURL(file);
                        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
                    }
                } else {
                    // For non-image files, insert a "card" simulation
                    const content = `
                        <div class="max-w-xs rounded-lg overflow-hidden border border-gray-700 shadow-md my-2 select-none flex items-center p-3 gap-3 bg-surface-dark/50">
                             <span class="material-symbols-outlined text-primary">description</span>
                             <div class="flex flex-col overflow-hidden">
                                <span class="text-sm font-bold text-white truncate">${file.name}</span>
                                <span class="text-xs text-gray-400">${(file.size / 1024).toFixed(1)}kb</span>
                             </div>
                        </div>
                    `;
                    editor.chain().focus().insertContent(content).run();
                }
            }
        }
    }, [editor, onImageUpload]);

    // Cleanup object URLs to avoid leaks (simplified for this context)
    // In a real app we'd track these.

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            if (editor.isEmpty && value === '<p></p>') return;
            if (editor.getHTML() !== value) {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    // Handle Escape key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt('URL da imagem:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL do link:', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };


    return (
        <div
            className={`
                w-full h-full bg-input-bg border border-input-border rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary transition-all flex flex-col shadow-sm
                ${isFullscreen ? 'fixed inset-0 z-50 rounded-none m-0 h-screen border-none bg-input-bg' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <div className={`flex flex-wrap items-center gap-1 w-full p-2 transition-all ${isFullscreen ? 'max-w-7xl mx-auto justify-center' : 'px-4'}`}>

                {/* Font Family Selector */}
                <select
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'default') {
                            editor.chain().focus().unsetFontFamily().run();
                        } else {
                            editor.chain().focus().setFontFamily(value).run();
                        }
                    }}
                    value={editor.getAttributes('textStyle').fontFamily || 'default'}
                    className="h-8 bg-transparent text-text-muted hover:text-text-main text-xs font-bold border border-transparent hover:bg-surface-highlight rounded px-2 outline-none cursor-pointer appearance-none transition-colors"
                    style={{ maxWidth: '100px' }}
                >
                    <option value="default">Fonte</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Mono</option>
                    <option value="Comic Sans MS, Comic Sans">Comic Sans</option>
                </select>

                {/* Font Size Selector */}
                <select
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'default') {
                            editor.chain().focus().unsetFontSize().run();
                        } else {
                            editor.chain().focus().setFontSize(value).run();
                        }
                    }}
                    value={editor.getAttributes('textStyle').fontSize || 'default'}
                    className="h-8 bg-transparent text-text-muted hover:text-text-main text-xs font-bold border border-transparent hover:bg-surface-highlight rounded px-2 outline-none cursor-pointer appearance-none transition-colors"
                >
                    <option value="default">Size</option>
                    <option value="12px">12</option>
                    <option value="14px">14</option>
                    <option value="16px">16</option>
                    <option value="18px">18</option>
                    <option value="20px">20</option>
                    <option value="24px">24</option>
                    <option value="30px">30</option>
                    <option value="36px">36</option>
                </select>

                <div className="h-5 w-px bg-border-main mx-2"></div>

                {/* Headings Selector */}
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={`px-2 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${editor.isActive('paragraph') ? 'bg-surface-highlight text-text-main' : 'text-text-muted hover:text-text-main hover:bg-surface-highlight'}`}
                >
                    Normal
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Título 1"
                >
                    <span className="font-bold text-sm">H1</span>
                </button>


                <div className="h-5 w-px bg-border-main mx-2"></div>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('bold') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Negrito"
                >
                    <span className="material-symbols-outlined text-[20px]">format_bold</span>
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('italic') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Itálico"
                >
                    <span className="material-symbols-outlined text-[20px]">format_italic</span>
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('underline') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Sublinhado"
                >
                    <span className="material-symbols-outlined text-[20px]">format_underlined</span>
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('strike') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Tachado"
                >
                    <span className="material-symbols-outlined text-[20px]">strikethrough_s</span>
                </button>
                <label className="size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors cursor-pointer hover:bg-surface-highlight" title="Cor de Destaque">
                    <input
                        type="color"
                        onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        className="sr-only"
                    />
                    <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ color: editor.getAttributes('textStyle').color }}
                    >
                        format_color_text
                    </span>
                </label>


                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={setLink}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('link') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Link"
                >
                    <span className="material-symbols-outlined text-[20px]">link</span>
                </button>

                <div className="h-5 w-px bg-border-main mx-2"></div>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('orderedList') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Lista Numerada"
                >
                    <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('bulletList') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Lista com marcadores"
                >
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Alinhar Esquerda"
                >
                    <span className="material-symbols-outlined text-[20px]">format_align_left</span>
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('taskList') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Checklist"
                >
                    <span className="material-symbols-outlined text-[20px]">check_box</span>
                </button>

                <div className="h-5 w-px bg-border-main mx-2"></div>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('blockquote') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Citação"
                >
                    <span className="material-symbols-outlined text-[20px]">format_quote</span>
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`size-8 flex items-center justify-center rounded text-text-muted hover:text-text-main transition-colors ${editor.isActive('codeBlock') ? 'bg-primary/10 text-primary' : 'hover:bg-surface-highlight'}`}
                    title="Código"
                >
                    <span className="material-symbols-outlined text-[20px]">code</span>
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={addImage}
                    className="size-8 flex items-center justify-center rounded hover:bg-surface-highlight text-text-muted hover:text-text-main transition-colors"
                    title="Inserir Imagem"
                >
                    <span className="material-symbols-outlined text-[20px]">image</span>
                </button>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => alert('Arraste um arquivo para o editor para anexar.')}
                    className="size-8 flex items-center justify-center rounded hover:bg-surface-highlight text-text-muted hover:text-text-main transition-colors"
                    title="Arquivo"
                >
                    <span className="material-symbols-outlined text-[20px]">description</span>
                </button>

                <div className="flex-1"></div>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`size-8 flex items-center justify-center rounded hover:bg-surface-highlight text-text-main transition-colors ${isFullscreen ? 'bg-primary/20 text-primary' : ''}`}
                    title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                >
                    <span className="material-symbols-outlined text-[20px]">{isFullscreen ? 'close_fullscreen' : 'open_in_full'}</span>
                </button>
            </div>

            {/* Editor Content */}
            <div className={`flex-1 overflow-y-auto ${isFullscreen ? 'p-8 max-w-7xl mx-auto w-full' : ''}`}>
                <EditorContent editor={editor} className="h-full" />
            </div>

            <style>{`
                /* Custom styles for TipTap components to match the layout */
                ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }
                ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                ul[data-type="taskList"] li input[type="checkbox"] {
                    margin-top: 0.25rem;
                    accent-color: #13ec5b;
                    scale: 1.2;
                    cursor: pointer;
                }
                ul[data-type="taskList"] li div {
                    flex: 1;
                }
                .prose blockquote {
                    border-left-color: #13ec5b;
                    background: var(--color-surface-highlight);
                    padding: 0.5rem 1rem;
                    border-radius: 0 0.5rem 0.5rem 0;
                }
                .prose code {
                    background: rgba(0,0,0,0.3);
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.25rem;
                    font-size: 0.85em;
                    color: #13ec5b;
                }
                 .prose pre {
                    background: var(--color-surface-card);
                    padding: 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid var(--color-border-main);
                }
                /* Editor full height fix for flex layout */
                .ProseMirror {
                    min-height: 100%;
                    height: 100%;
                    outline: none;
                    display: flex;
                    flex-direction: column;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #9ca3af;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </div >
    );
};

export default SimpleEditor;
