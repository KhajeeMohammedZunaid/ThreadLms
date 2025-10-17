import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppCourse } from '../../App';
import { DiscussionThread } from '../../types';
import { User } from '../../types';
import { MessageIcon, ChevronDownIcon } from '../../components/icons';
import { useAuth } from '../../src/hooks/useAuth';
import courseService from '../../src/services/course.service';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

type FacultyDiscussionThread = DiscussionThread & {
    courseId: string; // Changed to string to match MongoDB ObjectId
    courseTitle: string;
};

const FacultyDiscussions: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<AppCourse[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [newReply, setNewReply] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'upvoted'>('recent');
    const [filterUnanswered, setFilterUnanswered] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string | 'all'>('all');
    const [filterType, setFilterType] = useState<'all' | 'discussion' | 'qna'>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch faculty courses
    useEffect(() => {
        const fetchCourses = async () => {
            if (!user || user.role !== 'faculty') return;
            try {
                const fetchedCourses = await courseService.getCoursesByFaculty(user._id);
                setCourses(fetchedCourses as any);
            } catch (err) {
                console.error('Error fetching courses:', err);
            }
        };
        fetchCourses();
    }, [user]);

    const facultyCourses = courses;

    const allFacultyDiscussions = useMemo((): FacultyDiscussionThread[] => {
        return facultyCourses.flatMap(course => 
            course.discussion?.map(thread => ({
                ...thread,
                courseId: course._id || String(course.id), // Use _id (MongoDB) or fallback to id
                courseTitle: course.title,
            })) || []
        );
    }, [facultyCourses]);
    
    const sortedAndFilteredDiscussions = useMemo(() => {
        let tempDiscussions = [...allFacultyDiscussions];

        if (selectedCourseId !== 'all') {
            tempDiscussions = tempDiscussions.filter(thread => thread.courseId === selectedCourseId);
        }

        if (filterType === 'qna') {
            tempDiscussions = tempDiscussions.filter(thread => thread.title.toLowerCase().startsWith('q&a:'));
        } else if (filterType === 'discussion') {
            tempDiscussions = tempDiscussions.filter(thread => !thread.title.toLowerCase().startsWith('q&a:'));
        }

        if (filterUnanswered) {
            tempDiscussions = tempDiscussions.filter(thread => thread.replies.length === 0);
        }
        
        if (sortBy === 'upvoted') {
            tempDiscussions.sort((a, b) => b.upvotes - a.upvotes);
        } else {
             // Basic recent sort, assuming data is somewhat ordered
            tempDiscussions.sort((a, b) => (b.id > a.id) ? 1 : -1);
        }
        
        return tempDiscussions;
    }, [allFacultyDiscussions, sortBy, filterUnanswered, selectedCourseId, filterType]);

    useEffect(() => {
        const isSelectionValid = sortedAndFilteredDiscussions.some(t => t.id === selectedThreadId);

        if (!isSelectionValid && sortedAndFilteredDiscussions.length > 0) {
            setSelectedThreadId(sortedAndFilteredDiscussions[0].id);
        } else if (sortedAndFilteredDiscussions.length === 0) {
            setSelectedThreadId(null);
        }
    }, [sortedAndFilteredDiscussions, selectedThreadId]);


    const selectedThread = useMemo(() => allFacultyDiscussions.find(t => t.id === selectedThreadId), [selectedThreadId, allFacultyDiscussions]);

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReply.trim() || !selectedThread || !user) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Find the course that contains this thread
            const course = courses.find(c => c.id === selectedThread.courseId);
            if (!course) {
                console.error('Course not found for thread');
                return;
            }

            // Call backend API to add reply
            const reply = await courseService.addDiscussionReply(
                course._id || course.id.toString(),
                selectedThread.id,
                { content: newReply }
            );

            // Refresh courses to get updated discussion data
            const fetchedCourses = await courseService.getCoursesByFaculty(user._id);
            setCourses(fetchedCourses as any);
            
            setNewReply('');
            console.log('✅ Reply posted successfully');
        } catch (error) {
            console.error('❌ Error posting reply:', error);
            // Optionally show error toast/notification
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeButtonClasses = (isActive: boolean) => 
        `flex-1 text-center px-2 py-1.5 text-sm rounded-md transition-all duration-200 ${
            isActive ? 'bg-white shadow-sm font-semibold text-faculty-primary' : 'bg-transparent text-content hover:bg-white/60'
        }`;

    const sortButtonClasses = (isActive: boolean) => 
        `px-3 py-1 text-sm rounded-md transition-colors ${
            isActive ? 'bg-faculty-primary text-white font-semibold' : 'bg-transparent text-content hover:bg-slate-200'
        }`;

    return (
        <>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <h1 className="text-4xl font-bold text-heading mb-2">Discussions &amp; Q&amp;A</h1>
                <p className="text-lg text-content mb-8">Review and respond to questions from all your courses.</p>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Thread List & Filters */}
                    <div className="lg:col-span-4 xl:col-span-3">
                         <div className="lg:sticky lg:top-10">
                            <div className="bg-slate-50 rounded-lg border border-border p-4 mb-4 space-y-4">
                                <div>
                                    <label htmlFor="courseFilter" className="block text-sm font-medium text-heading mb-1">Filter by Course</label>
                                    <div className="relative">
                                        <select
                                            value={selectedCourseId}
                                            onChange={e => setSelectedCourseId(e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-heading focus:ring-2 focus:ring-faculty-primary focus:outline-none"
                                        >
                                            <option value="all">All Courses</option>
                                            {facultyCourses.map(course => (
                                                <option key={course._id || course.id} value={course._id || String(course.id)}>{course.title}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-heading mb-1">Filter by Type</label>
                                    <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg">
                                        <button onClick={() => setFilterType('all')} className={typeButtonClasses(filterType === 'all')}>All</button>
                                        <button onClick={() => setFilterType('discussion')} className={typeButtonClasses(filterType === 'discussion')}>Discussions</button>
                                        <button onClick={() => setFilterType('qna')} className={typeButtonClasses(filterType === 'qna')}>Q&A</button>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-sm text-heading">Sort by:</span>
                                            <button onClick={() => setSortBy('recent')} className={sortButtonClasses(sortBy === 'recent')}>Recent</button>
                                            <button onClick={() => setSortBy('upvoted')} className={sortButtonClasses(sortBy === 'upvoted')}>Upvoted</button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="filterUnanswered" checked={filterUnanswered} onChange={e => setFilterUnanswered(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-faculty-primary focus:ring-faculty-primary" />
                                            <label htmlFor="filterUnanswered" className="text-sm font-medium text-content select-none">Unanswered</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-[calc(100vh-430px)] overflow-y-auto scrollbar-hide">
                                {sortedAndFilteredDiscussions.map(thread => (
                                     <button key={thread.id} onClick={() => setSelectedThreadId(thread.id)} className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${selectedThreadId === thread.id ? 'bg-faculty-primary/10 border-faculty-primary' : 'bg-white border-border hover:border-slate-300'}`}>
                                        <p className="font-bold text-heading text-sm">{thread.title}</p>
                                        <p className="text-xs text-content mt-1">From: <span className="font-semibold">{thread.courseTitle}</span></p>
                                        <div className="flex items-center justify-between text-xs text-content mt-2">
                                             <span>By {thread.author}</span>
                                             <div className="flex items-center gap-1"><MessageIcon className="w-3 h-3" /> {thread.replies.length}</div>
                                        </div>
                                     </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Selected Thread View */}
                    <div className="lg:col-span-8 xl:col-span-9">
                        <AnimatePresence mode="wait">
                            {selectedThread ? (
                                 <motion.div key={selectedThread.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white p-6 rounded-xl border border-border">
                                     <div>
                                        <p className="text-sm font-semibold text-faculty-primary mb-1">{selectedThread.courseTitle}</p>
                                        <h2 className="text-2xl font-bold text-heading mb-2">{selectedThread.title}</h2>
                                        <div className="flex items-center gap-2 text-sm text-content mb-4 pb-4 border-b border-border">
                                            <img src={selectedThread.avatar} alt={selectedThread.author} className="w-6 h-6 rounded-full" />
                                            <strong>{selectedThread.author}</strong> • <span>{selectedThread.timestamp}</span>
                                        </div>
                                        <p className="text-content whitespace-pre-wrap mb-6">{selectedThread.content}</p>
                                        <h3 className="text-lg font-bold text-heading mb-4">{selectedThread.replies.length} Replies</h3>
                                     </div>

                                     <div className="space-y-4">
                                        {selectedThread.replies.map(reply => (
                                            <div key={reply.id} className="flex items-start gap-4">
                                                <img src={reply.avatar} alt={reply.author} className="w-9 h-9 rounded-full mt-1 flex-shrink-0" />
                                                <div className={`flex-1 p-4 rounded-lg border ${reply.authorRole === 'faculty' ? 'bg-faculty-primary/5 border-faculty-primary/20' : 'bg-slate-50 border-border'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm"><strong>{reply.author}</strong> {reply.authorRole === 'faculty' && <span className="text-xs font-bold text-faculty-primary bg-faculty-primary/10 px-2 py-0.5 rounded-full ml-1">INSTRUCTOR</span>} • <span className="text-content">{reply.timestamp}</span></p>
                                                    </div>
                                                    <p className="text-content mt-2 whitespace-pre-wrap">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                     </div>

                                     <form onSubmit={handleReplySubmit} className="mt-6 pt-6 border-t border-border flex items-start gap-4">
                                        <img src={user?.profilePicture || '/default-avatar.png'} alt="Your avatar" className="w-9 h-9 rounded-full mt-1 flex-shrink-0" />
                                        <div className="flex-1">
                                            <textarea value={newReply} onChange={e => setNewReply(e.target.value)} rows={3} placeholder="Add your reply..." className="w-full bg-slate-50 border border-border rounded-lg p-3 focus:ring-2 focus:ring-faculty-primary focus:outline-none" disabled={isSubmitting}></textarea>
                                            <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: isSubmitting ? 1 : 1.05 }} whileTap={{ scale: isSubmitting ? 1 : 0.95 }} className="mt-2 bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                                {isSubmitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                                {isSubmitting ? 'Posting...' : 'Post Reply'}
                                            </motion.button>
                                        </div>
                                    </form>

                                 </motion.div>
                            ) : (
                                 <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center bg-white rounded-xl border-2 border-dashed border-border text-center p-8">
                                    <MessageIcon className="w-16 h-16 text-slate-300 mb-4" />
                                    <h2 className="text-xl font-bold text-heading">Select a Discussion</h2>
                                    <p className="text-content mt-1">Choose a thread from the left to view the conversation and reply.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
             <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
};

export default FacultyDiscussions;