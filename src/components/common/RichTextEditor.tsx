import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Undo, Redo } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex gap-1 flex-wrap bg-gray-50 dark:bg-slate-800 rounded-t-xl">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-slate-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-slate-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                title="Italic"
            >
                <Italic size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${editor.isActive('underline') ? 'bg-gray-200 dark:bg-slate-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                title="Underline"
            >
                <UnderlineIcon size={18} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-slate-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                title="Align Left"
            >
                <AlignLeft size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-slate-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                title="Align Center"
            >
                <AlignCenter size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-slate-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                title="Align Right"
            >
                <AlignRight size={18} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-slate-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                title="Bullet List"
            >
                <List size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-slate-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                title="Ordered List"
            >
                <ListOrdered size={18} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                title="Undo"
            >
                <Undo size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                title="Redo"
            >
                <Redo size={18} />
            </button>
        </div>
    );
};

export default function RichTextEditor({ value, onChange, className = '' }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown.configure({
                html: true,
                transformCopiedText: true,
                transformPastedText: true,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            // Chú thích: Lấy HTML content (tiptap-markdown hỗ trợ parse/serialize markdown nhưng storage API khác)
            const html = editor.getHTML();
            onChange(html);
        },
    });

    // Update content if value changes externally (e.g. loading history)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div className={`border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex flex-col ${className}`}>
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
