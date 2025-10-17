import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    XIcon, TrashIcon, CalendarIcon, 
    BoldIcon, ItalicIcon, UnderlineIcon, HeadingIcon, ListIcon, ListCheckIcon, ChevronDownIcon, BookmarkAltIcon
} from './icons';
import { Note, noteColors } from '../pages/StickyWall';
import { AppCourse } from '../App';

interface NoteEditorModalProps {
  note: Note;
  onSave: (note: Note, courseId?: number) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  mode: 'edit' | 'publish';
  courses?: AppCourse[];
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; 'aria-label': string; }> = ({ onClick, children, 'aria-label': ariaLabel }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="p-2 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800">
        {children}
    </button>
);

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ note, onSave, onDelete, onClose, mode, courses }) => {
  const [editedNote, setEditedNote] = useState<Note>(note);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>(courses?.[0]?.id || '');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedNote(prev => ({...prev, content: e.target.value}));
  };

  const applyFormatting = (type: 'bold' | 'italic' | 'underline' | 'h1' | 'task' | 'list') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let newText = '';
    
    switch (type) {
        case 'bold': newText = `**${selectedText}**`; break;
        case 'italic': newText = `*${selectedText}*`; break;
        case 'underline': newText = `__${selectedText}__`; break;
        case 'h1': newText = `# ${selectedText}`; break;
        case 'task': newText = `- [ ] ${selectedText}`; break;
        case 'list': newText = `- ${selectedText}`; break;
    }

    const updatedValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    setEditedNote(prev => ({ ...prev, content: updatedValue }));
    
    // Focus back on textarea and adjust selection
    setTimeout(() => {
        textarea.focus();
        if (selectedText) {
            textarea.setSelectionRange(start, start + newText.length);
        } else {
            const cursorPosition = start + (newText.length / 2);
            textarea.setSelectionRange(cursorPosition, cursorPosition);
        }
    }, 0);
  };

  const handleSave = () => {
    if (mode === 'publish') {
        if (!selectedCourseId) {
            alert("Please select a course to publish to.");
            return;
        }
        onSave(editedNote, selectedCourseId);
    } else {
        onSave(editedNote);
    }
  };
  const handleDelete = () => onDelete(editedNote.id);

  const headerTitle = mode === 'publish' ? 'Publish Note to Course' : 'Edit Note';
  const saveButtonText = mode === 'publish' ? 'Publish Note' : 'Save';

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl bg-white overflow-hidden flex flex-col border-t-8 ${mode === 'publish' ? 'border-faculty-primary' : editedNote.color.replace('bg-', 'border-')}`}
      >
        <header className="p-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
            <div>
                <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                    {mode === 'publish' && <BookmarkAltIcon className="w-5 h-5 text-faculty-primary" />}
                    {headerTitle}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Tip: Use `- [ ]` for tasks, `-` for bullets, and `#` for headings.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 -mt-1 -mr-1"><XIcon /></button>
        </header>

        <div className="flex flex-col md:flex-row flex-grow min-h-0">
            {/* Left/Main Editor */}
            <div className="flex-grow p-4 md:w-2/3 flex flex-col">
                <div className="bg-slate-100 rounded-t-lg">
                    <div className="flex items-center gap-1 p-2 border-b border-slate-200">
                        <ToolbarButton onClick={() => applyFormatting('h1')} aria-label="Heading"><HeadingIcon /></ToolbarButton>
                        <ToolbarButton onClick={() => applyFormatting('bold')} aria-label="Bold"><BoldIcon /></ToolbarButton>
                        <ToolbarButton onClick={() => applyFormatting('italic')} aria-label="Italic"><ItalicIcon /></ToolbarButton>
                        <ToolbarButton onClick={() => applyFormatting('underline')} aria-label="Underline"><UnderlineIcon /></ToolbarButton>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <ToolbarButton onClick={() => applyFormatting('list')} aria-label="Bulleted List"><ListIcon /></ToolbarButton>
                        <ToolbarButton onClick={() => applyFormatting('task')} aria-label="Task List"><ListCheckIcon /></ToolbarButton>
                    </div>
                </div>
                <textarea
                    ref={contentRef}
                    value={editedNote.content}
                    onChange={handleContentChange}
                    placeholder="Start writing your note..."
                    className="w-full flex-grow p-4 bg-slate-50 rounded-b-lg resize-none focus:outline-none text-slate-800 text-base leading-relaxed"
                />
            </div>

            {/* Right Sidebar */}
            <div className="md:w-1/3 p-4 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50 flex-shrink-0">
                <div className="space-y-4">
                    {mode === 'publish' && courses && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Publish To</label>
                            <div className="relative">
                                <select 
                                    value={selectedCourseId} 
                                    onChange={e => setSelectedCourseId(Number(e.target.value))}
                                    className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none"
                                >
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Title</label>
                        <input type="text" value={editedNote.title} onChange={e => setEditedNote({...editedNote, title: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                    {mode === 'edit' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
                            <div className="relative">
                                <input type="date" value={editedNote.dueDate || ''} onChange={e => setEditedNote({...editedNote, dueDate: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    )}
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Color</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {noteColors.map(color => (
                                <button key={color} onClick={() => setEditedNote({...editedNote, color})} className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110`}>
                                    {editedNote.color === color && <div className="w-full h-full rounded-full ring-2 ring-offset-2 ring-primary"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <footer className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            {mode === 'edit' ? (
                <button onClick={handleDelete} className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50">
                    <TrashIcon /> Delete Note
                </button>
            ) : <div></div> /* Placeholder to keep justify-between working */}
            <div className="flex items-center gap-2">
                 <button onClick={onClose} className="text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 px-5 py-2 rounded-lg">Cancel</button>
                 <button onClick={handleSave} className={`text-sm font-semibold text-white px-5 py-2 rounded-lg ${mode === 'publish' ? 'bg-faculty-primary hover:bg-faculty-primary-dark' : 'bg-primary hover:bg-primary-dark'}`}>
                    {saveButtonText}
                 </button>
            </div>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default NoteEditorModal;