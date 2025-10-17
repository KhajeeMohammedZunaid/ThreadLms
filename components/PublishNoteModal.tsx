import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon, BookmarkAltIcon, ChevronDownIcon } from './icons';
import { Note, noteColors } from '../pages/StickyWall';
import { AppCourse } from '../App';

interface PublishNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (note: Note, courseId: number) => void;
  courses: AppCourse[];
}

const PublishNoteModal: React.FC<PublishNoteModalProps> = ({ isOpen, onClose, onPublish, courses }) => {
  const [noteData, setNoteData] = useState<Omit<Note, 'id'>>({
    title: '',
    content: '',
    color: noteColors[0],
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | ''>(courses[0]?._id || courses[0]?.id?.toString() || '');

  const handlePublish = () => {
    if (!noteData.title.trim() || !noteData.content.trim() || !selectedCourseId) {
        // Basic validation
        alert('Please fill in all fields and select a course.');
        return;
    }
    const noteToPublish: Note = {
        id: '', // ID will be assigned by the handler
        ...noteData
    };
    // Convert to number if needed for backward compatibility
    const courseIdToPublish = typeof selectedCourseId === 'string' && selectedCourseId.length === 24 
      ? parseInt(selectedCourseId.substring(selectedCourseId.length - 8), 16) 
      : parseInt(selectedCourseId);
    onPublish(noteToPublish, courseIdToPublish);
  };

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
            className="w-full max-w-lg rounded-2xl shadow-2xl bg-white overflow-hidden flex flex-col"
        >
            <header className="p-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <BookmarkAltIcon className="w-6 h-6 text-faculty-primary" />
                    <h2 className="text-lg font-bold text-heading">Publish Note to Course</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100"><XIcon /></button>
            </header>

            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Course to Publish To</label>
                    <div className="relative">
                        <select 
                            value={selectedCourseId} 
                            onChange={e => setSelectedCourseId(e.target.value)}
                            className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none"
                        >
                            {courses.map(course => (
                                <option key={course._id || course.id} value={course._id || course.id}>{course.title}</option>
                            ))}
                        </select>
                         <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Note Title</label>
                    <input type="text" value={noteData.title} onChange={e => setNoteData({...noteData, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Content</label>
                    <textarea value={noteData.content} onChange={e => setNoteData({...noteData, content: e.target.value})} rows={5} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Color</label>
                    <div className="flex items-center gap-2 flex-wrap">
                        {noteColors.map(color => (
                            <button key={color} onClick={() => setNoteData({...noteData, color})} className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110`}>
                                {noteData.color === color && <div className="w-full h-full rounded-full ring-2 ring-offset-2 ring-faculty-primary"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 flex-shrink-0">
                 <button onClick={onClose} className="text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 px-5 py-2 rounded-lg">Cancel</button>
                 <button onClick={handlePublish} className="text-sm font-semibold text-white bg-faculty-primary hover:bg-faculty-primary-dark px-5 py-2 rounded-lg">Publish Note</button>
            </footer>
        </motion.div>
    </motion.div>
  );
};

export default PublishNoteModal;
