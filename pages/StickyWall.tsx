import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, BookmarkAltIcon } from '../components/icons';
import NoteEditorModal from '../components/NoteEditorModal';
import { AppCourse } from '../App';
import { useAuth } from '../src/hooks/useAuth';
import userService from '../src/services/user.service';
import { handleError } from '../src/utils/errorHandler';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

export type Note = { 
  id: string; 
  title: string; 
  content: string; 
  color: string; 
  dueDate?: string;
  authorName?: string;
  isPublished?: boolean;
  courseId?: number;
  courseTitle?: string;
};

export const noteColors = [
    'bg-yellow-200', 'bg-cyan-200', 'bg-pink-200', 'bg-green-200', 'bg-purple-200', 'bg-orange-200'
];

const NoteContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="text-sm text-gray-700 whitespace-pre-wrap flex-grow overflow-y-auto note-content-scrollbar">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('- [x] ')) {
          return <div key={i} className="flex items-center gap-2 my-1"><div className="w-4 h-4 border-2 border-gray-400 bg-gray-400 rounded-sm flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div><span className="line-through text-gray-500">{line.substring(6)}</span></div>;
        }
        if (line.startsWith('- [ ] ')) {
          return <div key={i} className="flex items-center gap-2 my-1"><div className="w-4 h-4 border-2 border-gray-400 rounded-sm flex-shrink-0"></div><span>{line.substring(6)}</span></div>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-base font-bold my-1 text-gray-800">{line.substring(2)}</h1>
        }
        if (line.startsWith('- ')) {
          return <div key={i} className="flex gap-2"><span className="flex-shrink-0">•</span><span>{line.substring(2)}</span></div>
        }
        
        const parts = line.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*)/g).filter(Boolean);
        if (parts.length === 0 && i < content.split('\n').length -1) {
            return <div key={i} className="h-4"></div>; // represent empty line
        }
        
        return (
          <p key={i}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={j}>{part.slice(1, -1)}</em>;
              }
               if (part.startsWith('__') && part.endsWith('__')) {
                return <u key={j}>{part.slice(2, -2)}</u>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};


const NoteCard: React.FC<{ note: Note; onClick: () => void; userRole: 'student' | 'faculty' }> = ({ note, onClick, userRole }) => (
    <motion.button
        layoutId={`note-card-${note.id}`}
        onClick={onClick}
        whileHover={!note.isPublished ? { y: -5 } : {}}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`rounded-xl p-4 shadow-md h-64 flex flex-col text-left ${note.color} ${note.isPublished ? 'cursor-default' : ''}`}
        disabled={note.isPublished}
    >
        <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">{note.title}</h3>
        <NoteContentRenderer content={note.content} />
        {note.isPublished && (
            <div className="mt-auto pt-2 border-t border-gray-500/30">
                <div className="flex items-center gap-2">
                    <BookmarkAltIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div className="text-xs font-semibold text-gray-600">
                        {userRole === 'faculty' ? (
                            <>Published to: <span className="font-bold">{note.courseTitle}</span></>
                        ) : (
                            <>Instructor Note: <span className="font-bold">{note.authorName}</span></>
                        )}
                    </div>
                </div>
            </div>
        )}
    </motion.button>
);

const AddNoteCard: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
    <motion.button
        layout
        onClick={onAdd}
        whileHover={{ scale: 1.05, borderColor: '#6366f1' }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="rounded-xl shadow-md h-64 flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 hover:border-primary transition-colors"
        aria-label="Add new personal note"
    >
        <PlusIcon className="w-16 h-16 text-slate-400" />
    </motion.button>
);

interface StickyWallProps {
  onPublishNote?: (note: Note, courseId: number) => void;
  courses?: AppCourse[];
  userRole: 'student' | 'faculty';
}

const StickyWall: React.FC<StickyWallProps> = ({ onPublishNote, courses, userRole }) => {
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editorMode, setEditorMode] = useState<'edit' | 'publish'>('edit');
    const { user } = useAuth();
    
    // Backend state - fetch from API
    const [backendNotes, setBackendNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch notes from backend - requires authentication
    useEffect(() => {
        const fetchNotes = async () => {
            if (!user) {
                setIsLoading(false);
                setBackendNotes([]);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                
                const notesData = await userService.getUserNotes();
                setBackendNotes(notesData || []);
            } catch (error) {
                console.error('Failed to load notes:', error);
                setError(handleError(error));
                setBackendNotes([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotes();
    }, [user]);
    
    const handleOpenEditor = (note: Note | null) => {
        setEditorMode('edit');
        if (note) {
            setEditingNote(note);
        } else {
            const newNote: Note = {
                id: `n${Date.now()}`,
                title: 'New Note',
                content: '',
                color: noteColors[0],
                dueDate: new Date().toISOString().split('T')[0],
            };
            setEditingNote(newNote);
        }
    };
    
    const handleOpenPublisher = () => {
        const newNoteToPublish: Note = {
            id: `pub-${Date.now()}`,
            title: 'New Announcement',
            content: '',
            color: noteColors[0],
        };
        setEditingNote(newNoteToPublish);
        setEditorMode('publish');
    };

    const handleSave = async (noteToSave: Note, courseId?: number) => {
        // Validate that note has content
        if (!noteToSave.title.trim() && !noteToSave.content.trim()) {
            setError('Note text is required. Please add a title or content before saving.');
            return;
        }

        if (editorMode === 'publish' && onPublishNote && courseId) {
            // Also validate for published notes
            if (!noteToSave.content.trim()) {
                setError('Note text is required. Please add content before publishing.');
                return;
            }
            onPublishNote(noteToSave, courseId);
            setEditingNote(null);
            return;
        }

        if (!user) {
            console.error('User not authenticated');
            setError('Please log in to save notes');
            setEditingNote(null);
            return;
        }

        console.log('💾 Saving note:', noteToSave);

        try {
            // Save to backend for authenticated users
            console.log('📤 Sending to backend...');
            const savedNotes = await userService.saveNote(noteToSave);
            console.log('✅ Backend response:', savedNotes);
            
            // Update local state with backend response
            setBackendNotes(savedNotes || []);
        } catch (error) {
            console.error('❌ Failed to save note:', error);
            setError(handleError(error));
        }
        
        setEditingNote(null);
    };

    const handleDelete = async (noteId: string) => {
        if (!user) {
            console.error('User not authenticated');
            setError('Please log in to delete notes');
            setEditingNote(null);
            return;
        }

        try {
            // Delete from backend
            await userService.deleteNote(noteId);
            
            // Refresh notes from backend
            const notesData = await userService.getUserNotes();
            setBackendNotes(notesData || []);
        } catch (error) {
            console.error('Failed to delete note:', error);
            setError(handleError(error));
        }
        
        setEditingNote(null);
    };

    return (
        <>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-4xl font-bold text-heading">Sticky Wall</h1>
                    {userRole === 'faculty' && (
                        <motion.button
                            onClick={handleOpenPublisher}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center gap-2 bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg"
                        >
                            <BookmarkAltIcon /> Publish a Note to a Course
                        </motion.button>
                    )}
                </div>

                {/* Error Message Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between"
                    >
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-4 text-red-700 hover:text-red-900 font-bold"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                )}

                {/* Notes Grid */}
                {!isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {backendNotes.map(note => <NoteCard key={note.id} note={note} userRole={userRole} onClick={() => !note.isPublished && handleOpenEditor(note)} />)}
                        <AddNoteCard onAdd={() => handleOpenEditor(null)} />
                    </div>
                )}
            </motion.div>
             <AnimatePresence>
                {editingNote && (
                    <NoteEditorModal
                        note={editingNote}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onClose={() => setEditingNote(null)}
                        mode={editorMode}
                        courses={courses}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default StickyWall;