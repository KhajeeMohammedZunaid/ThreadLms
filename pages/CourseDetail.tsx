import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CourseContentItem, CourseSection, DiscussionThread, DiscussionReply } from '../types';
import { AppCourse } from '../App';
import { StarIcon, CheckCircleIcon, PlayIcon, DocumentTextIcon, DownloadIcon, DeviceMobileIcon, CertificateIcon, IDEIcon, ChevronDownIcon, StudentsIcon, QuizIcon, AssignmentIcon, UserCircleIcon, ArrowUpIcon, MessageIcon, ArrowLeftIcon, ClockIcon, LessonsIcon, AnimatedCheckmark, LockClosedIcon, TrophyIcon, SpinnerIcon, CheckIcon as SolidCheckIcon, PencilAltIcon as PencilIcon, EyeIcon, BoldIcon, ItalicIcon, UnderlineIcon, HeadingIcon, ListIcon, ListCheckIcon } from '../components/icons';
import CourseDetailSkeleton from './CourseDetailSkeleton';
import { getBadgeForBranch } from '../data/badges';
import { User } from '../types';
import AiStudyBuddy from '../components/AiStudyBuddy';
import { useAuth } from '../src/hooks/useAuth';
import courseService from '../src/services/course.service';
import userService from '../src/services/user.service';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
} as const;

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; 'aria-label': string; }> = ({ onClick, children, 'aria-label': ariaLabel }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="p-2 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800">
        {children}
    </button>
);

    const CourseDetail: React.FC = () => {
    const { courseId } = useParams();
    const { user, updateUser, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [course, setCourse] = useState<AppCourse | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch course details from backend
    useEffect(() => {
        const fetchCourseDetails = async () => {
            if (!user || !courseId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                const fetchedCourse = await courseService.getCourseById(courseId);
                
                // Map to AppCourse format - cast to bypass type restrictions
                const backendCourse = fetchedCourse as any;
                
                // Check if user is already enrolled using local user data
                const enrollment = user.enrollments?.find((e: any) => {
                    // Handle both string and object courseId formats
                    const enrollmentCourseId = typeof e.courseId === 'string' ? e.courseId : e.courseId?._id;
                    return enrollmentCourseId === courseId;
                });
                
                const isEnrolled = !!enrollment;
                
                // Calculate progress correctly from completedItems
                let calculatedProgress = 0;
                if (enrollment && isEnrolled) {
                    const contentItems = (backendCourse.content || []).reduce((total: number, section: any) => {
                        return total + (section.items?.length || 0);
                    }, 0);
                    const finalQuizCount = backendCourse.finalQuiz?.isEnabled ? 1 : 0;
                    const totalItems = contentItems + finalQuizCount;
                    const completedCount = enrollment?.completedItems?.length || 0;
                    calculatedProgress = totalItems > 0 ? Math.min(100, Math.round((completedCount / totalItems) * 100)) : 0;
                }
                
                // Map course data with all required fields
                const mappedCourse = {
                    id: courseId, // Keep as string (MongoDB ObjectId)
                    _id: backendCourse._id,
                    title: backendCourse.title,
                    subtitle: backendCourse.subtitle || '',
                    description: backendCourse.description || '',
                    imageUrl: backendCourse.imageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Course+Image',
                    previewUrl: backendCourse.previewUrl || 'https://placehold.co/800x450/e2e8f0/64748b?text=Course+Preview',
                    rating: backendCourse.rating || 0,
                    reviews: backendCourse.reviews || 0,
                    students: backendCourse.students || 0,
                    totalStudents: backendCourse.totalStudents || 0,
                    duration: backendCourse.duration || '0h',
                    totalLength: backendCourse.totalLength || '0h',
                    lessons: backendCourse.lessons || 0,
                    category: backendCourse.category || 'Computer Science',
                    branch: backendCourse.branch || 'Computer Science',
                    difficulty: backendCourse.difficulty || 'Intermediate',
                    bestseller: backendCourse.bestseller || false,
                    learnings: backendCourse.learnings || [],
                    requirements: backendCourse.requirements || [],
                    includes: backendCourse.includes || [],
                    content: backendCourse.content || [],
                    discussion: backendCourse.discussion || [],
                    completedItems: enrollment?.completedItems || [],
                    progress: calculatedProgress, // Use calculated progress, not backend value
                    // Final assessments
                    finalQuiz: backendCourse.finalQuiz || { isEnabled: false, title: 'Final Quiz', questions: [], timeLimit: 60 },
                    // Enrollment data
                    enrollment: enrollment ? {
                        courseId: enrollment.courseId,
                        completedItems: enrollment.completedItems || [],
                        enrollmentDate: enrollment.enrollmentDate,
                        finalQuizScore: enrollment.finalQuizScore,
                        quizScores: enrollment.quizScores || [],
                        assignmentSubmissions: enrollment.assignmentSubmissions || [],
                        inProgressQuizAnswers: enrollment.inProgressQuizAnswers,
                        courseNotes: enrollment.courseNotes
                    } : undefined,
                    // Author/Faculty information
                    author: {
                        id: backendCourse.authorId?._id || backendCourse.authorId || '',
                        fullName: backendCourse.authorId?.fullName || 'Instructor',
                        profilePicture: backendCourse.authorId?.profilePicture || 'https://placehold.co/150/e2e8f0/64748b?text=User',
                        title: backendCourse.authorId?.title || 'Instructor',
                        bio: backendCourse.authorId?.bio || '',
                        rating: backendCourse.authorId?.rating || 0
                    },
                    isEnrolled: isEnrolled // Set enrollment status
                } as any;
                
                setCourse(mappedCourse);
            } catch (err) {
                console.error('❌ Error fetching course details:', err);
                setCourse(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [user, courseId]);

    // Re-fetch course when user enrollments change
    useEffect(() => {
        if (user && courseId && course) {
            const enrollment = user.enrollments?.find((e: any) => {
                const enrollmentCourseId = typeof e.courseId === 'string' ? e.courseId : e.courseId?._id;
                return enrollmentCourseId === courseId;
            });
            
            const isEnrolled = !!enrollment;
            const completedCount = enrollment?.completedItems?.length || 0;
            
            // Update course enrollment status or completedItems if changed
            if (course.isEnrolled !== isEnrolled || course.completedItems?.length !== completedCount) {
                
                // Calculate progress from completedItems including final assessments
                const contentItems = course.content?.reduce((total: number, section: any) => {
                    return total + (section.items?.length || 0);
                }, 0) || 0;
                
                const finalQuizCount = course.finalQuiz?.isEnabled ? 1 : 0;
                const totalItems = contentItems + finalQuizCount;
                
                const calculatedProgress = totalItems > 0 ? Math.min(100, Math.round((completedCount / totalItems) * 100)) : 0;
                
                setCourse(prev => prev ? {
                    ...prev,
                    isEnrolled: isEnrolled,
                    completedItems: enrollment?.completedItems || [],
                    progress: calculatedProgress,
                    enrollment: enrollment ? {
                        courseId: enrollment.courseId,
                        completedItems: enrollment.completedItems || [],
                        enrollmentDate: enrollment.enrollmentDate,
                        finalQuizScore: enrollment.finalQuizScore,
                        quizScores: enrollment.quizScores || [],
                        assignmentSubmissions: enrollment.assignmentSubmissions || [],
                        inProgressQuizAnswers: enrollment.inProgressQuizAnswers,
                        courseNotes: enrollment.courseNotes
                    } : undefined
                } : null);
            }
        }
    }, [user?.enrollments, courseId, course?.isEnrolled, course?.completedItems?.length, course?.content]);

    if (loading) {
        return <CourseDetailSkeleton />;
    }

    if (!course) {
        return <Navigate to="/courses" replace />;
    }

    // Handler functions for course interactions
    const handleEnroll = async (courseId: string) => {
        if (!user) return;
        
        try {
            
            // Refresh user data from backend to get updated enrollments
            await refreshUser();
        } catch (err) {
            console.error('❌ Error refreshing user data:', err);
            throw err;
        }
    };

    const toggleCourseItemCompletion = async (courseId: string, itemId: string) => {
        if (!user) return;
        
        try {
            
            // Update progress on backend
            await userService.updateCourseProgress({
                courseId: courseId,
                itemId,
                completed: true
            });
            
            // Refresh user data to get updated completedItems and progress
            await refreshUser();
            
        } catch (err) {
            console.error('❌ Error toggling item completion:', err);
            alert('Failed to update progress. Please try again.');
        }
    };

    const handleAssignmentSubmission = async (courseId: string, itemId: string, submissionLink: string) => {
        if (!user) return;
        
        try {
            
            // Submit assignment via backend API
            await userService.submitAssignment({
                courseId: courseId,
                itemId,
                submissionLink
            });
            
            // Refresh user data to get updated submission
            await refreshUser();
            
            alert('Assignment submitted successfully!');
        } catch (err) {
            console.error('❌ Error submitting assignment:', err);
            alert('Failed to submit assignment. Please try again.');
        }
    };

    const handleSaveCourseNote = async (courseId: string, itemId: string, noteContent: string) => {
        if (!user) return;
        
        // Don't try to save empty notes (prevents error on refresh)
        if (!noteContent || noteContent.trim() === '') {
            return;
        }
        
        try {
            await userService.saveCourseNote({
                courseId: courseId, // Already receiving the correct _id from caller
                itemId,
                content: noteContent,
                title: `Note for ${itemId}`
            });
        } catch (err) {
            console.error('❌ Error saving note:', err);
            // Only show alert for non-empty content errors
            if (noteContent.trim()) {
                alert('Failed to save note. Please try again.');
            }
        }
    };

    return (
      <motion.div
        key={course.isEnrolled ? 'learning-view' : 'sales-view'}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {course.isEnrolled ? (
          <CourseLearningView 
            course={course} 
            toggleCourseItemCompletion={toggleCourseItemCompletion}
            currentUser={user}
            handleAssignmentSubmission={handleAssignmentSubmission}
            handleSaveCourseNote={handleSaveCourseNote}
           />
        ) : (
          <CourseSalesView course={course} handleEnroll={handleEnroll} />
        )}
      </motion.div>
    );
};

const CourseSalesView: React.FC<{ course: AppCourse, handleEnroll: (id: string) => void }> = ({ course, handleEnroll }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [openSections, setOpenSections] = useState<number[]>([]);
    const [isConfirming, setIsConfirming] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    
    const handleEnrollClick = () => {
        setIsConfirming(true);
    };

    const handleConfirmEnroll = async () => {
        setEnrolling(true);
        
        try {
            // Enroll via backend
            if (user && (course as any)._id) {
                await userService.enrollInCourse({ courseId: (course as any)._id });
                
                // Call parent handler to refresh user data
                await handleEnroll(course.id);
            }
            
            setEnrolling(false);
            
            // Navigate to enrollment success page
            navigate(`/enroll-success/${course.id}`);
        } catch (err: any) {
            console.error('❌ Error enrolling in course:', err);
            setEnrolling(false);
            
            // Show user-friendly error message
            if (err.message?.includes('Already enrolled')) {
                alert('You are already enrolled in this course!');
                // Refresh the page to show enrolled state
                window.location.reload();
            } else {
                alert('Failed to enroll in course. Please try again.');
            }
        }
    };

    const toggleSection = (index: number) => {
        setOpenSections(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const totalLectures = (course.content || []).reduce((sum, section) => sum + (section.items?.length || 0), 0);
    
    const includesIcons: { [key: string]: React.ReactElement } = {
        'video': <PlayIcon className="text-content"/>, 'coding': <IDEIcon className="text-content"/>,
        'articles': <DocumentTextIcon className="text-content"/>, 'downloadable': <DownloadIcon className="text-content"/>,
        'mobile': <DeviceMobileIcon className="text-content"/>, 'certificate': <CertificateIcon className="text-content"/>
    };

    const getIconForItem = (item: string) => {
        const lowerItem = item.toLowerCase();
        for (const key in includesIcons) { if (lowerItem.includes(key)) return includesIcons[key]; }
        return <CheckCircleIcon className="w-5 h-5 text-content"/>;
    };

    return (
        <div className="max-w-7xl mx-auto">
             <AnimatePresence>
                {isConfirming && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsConfirming(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ ease: 'easeInOut', duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl"
                        >
                            <h1 className="text-2xl font-bold text-heading text-center mb-2">Confirm Your Enrollment</h1>
                            <p className="text-center text-content mb-6">You're about to enroll in this course. Please review the details below.</p>
                            
                            <div className="bg-slate-50 border border-border rounded-lg p-5 mb-5 flex flex-col sm:flex-row items-start gap-5">
                                <img src={course.imageUrl} alt={course.title} className="w-full sm:w-32 h-auto sm:h-20 object-cover rounded-md flex-shrink-0" />
                                <div>
                                    <h2 className="text-lg font-bold text-heading">{course.title}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-content">
                                        <div className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4" /><span>{course.duration}</span></div>
                                        <div className="flex items-center gap-1.5"><LessonsIcon className="w-4 h-4" /><span>{course.lessons} lessons</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <motion.button 
                                    onClick={handleConfirmEnroll}
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    className="w-full sm:w-auto flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg"
                                >
                                    Confirm Enrollment
                                </motion.button>
                                <motion.button 
                                    onClick={() => setIsConfirming(false)}
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    className="w-full sm:w-auto flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-6 rounded-lg"
                                >
                                   Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
             <div className="text-sm text-content mb-4">
                <Link to="/courses" className="hover:text-primary">Courses</Link> &gt; <span className="font-medium text-heading">{course.category}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        {course.bestseller && <span className="bg-yellow-400 text-yellow-900 font-bold text-sm py-1.5 px-3 rounded-md mb-4 inline-block">Bestseller</span>}
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-heading mb-3 leading-tight tracking-tight">{course.title}</h1>
                        <p className="text-lg lg:text-xl text-content mb-6">{course.subtitle}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-base text-content">
                             <div className="flex items-center gap-2">
                                <img src={course.author.profilePicture} alt={course.author.fullName} className="w-8 h-8 rounded-full" />
                                <div>
                                    <span className="text-sm">Created by</span>
                                    <a href="#" className="font-bold text-heading block leading-tight hover:text-primary">{course.author.fullName}</a>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <StudentsIcon className="text-content w-5 h-5"/>
                                <span className="font-bold text-heading">{course.students.toLocaleString()}</span>
                                <span className="text-sm">students</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <ClockIcon className="text-content w-5 h-5"/>
                                <span className="font-bold text-heading">{course.duration}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border border-border rounded-lg">
                        <h2 className="text-2xl font-bold text-heading mb-4">What you'll learn</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            {course.learnings.map((learning, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-content">{learning}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-heading mb-2">Course content</h2>
                        <div className="flex justify-between items-center text-sm text-content mb-2">
                           <p>{course.content.length} sections • {totalLectures} lectures • {course.totalLength} total length</p>
                           <button onClick={() => setOpenSections(openSections.length ? [] : course.content.map((_, i) => i))} className="font-semibold text-primary hover:underline">
                                {openSections.length ? 'Collapse all' : 'Expand all'}
                           </button>
                        </div>
                        <div className="border border-border rounded-md">
                           {course.content.map((section, index) => (
                               <div key={index} className="border-b border-border last:border-b-0">
                                   <button onClick={() => toggleSection(index)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100">
                                       <span className="font-bold text-heading text-left">{section.sectionTitle}</span>
                                       <div className="flex items-center gap-4">
                                           <span className="text-sm text-content hidden sm:block">{section.items.length} lectures</span>
                                           <ChevronDownIcon className={`transition-transform duration-200 ${openSections.includes(index) ? 'rotate-180' : ''}`} />
                                       </div>
                                   </button>
                                   <AnimatePresence>
                                   {openSections.includes(index) && (
                                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                          <ul className="p-4 space-y-3">
                                               {section.items.map((lecture, lIndex) => (
                                                  <li key={lIndex} className="flex justify-between items-center text-content text-sm">
                                                       <div className="flex items-center gap-2"> <PlayIcon className="w-4 h-4"/> <span>{lecture.title}</span> </div>
                                                       <span>{lecture.duration}</span>
                                                  </li> 
                                               ))}
                                          </ul>
                                       </motion.div>
                                   )}
                                   </AnimatePresence>
                               </div>
                           ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-heading mb-4">Description</h2>
                        <p className="text-content whitespace-pre-line">{course.description}</p>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-border shadow-lg overflow-hidden sticky top-10">
                        <img src={course.previewUrl} alt={course.title} className="w-full h-48 object-cover" />
                        <div className="p-6">
                            {course.isEnrolled ? (
                                <div className="text-center">
                                    <p className="text-green-600 font-semibold mb-3">✓ Already Enrolled</p>
                                    <motion.button onClick={() => window.location.reload()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg text-base">
                                        Go to Course Content
                                    </motion.button>
                                </div>
                            ) : (
                                <motion.button onClick={handleEnrollClick} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg text-base">
                                    Enroll Now for Free
                                </motion.button>
                            )}
                            <div className="mt-6">
                               <h3 className="font-bold text-heading mb-3">This course includes:</h3>
                               <ul className="space-y-2.5 text-sm">
                                   {course.includes.map((item, index) => (
                                       <li key={index} className="flex items-center gap-3"> {getIconForItem(item)} <span>{item}</span> </li>
                                   ))}
                               </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


const OverviewContent = ({ activeContent }: { activeContent: CourseContentItem }) => (
    <>
        <h2 className="text-xl font-bold text-heading mb-2">About this {activeContent.type}</h2>
        <p className="text-content">This is a placeholder description for the current content. In a real application, this would contain details, transcripts, or notes related to "{activeContent.title}".</p>
    </>
);

// FIX: Inlined `NoteContentRenderer` component from `StickyWall.tsx` to resolve a circular dependency issue that was causing an import error.
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

const NotesContent: React.FC<{
    activeContent: CourseContentItem;
    note: string;
    onNoteChange: (newNote: string) => void;
    saveStatus: 'idle' | 'saving' | 'saved';
}> = ({ activeContent, note, onNoteChange, saveStatus }) => {
    const [isEditing, setIsEditing] = useState(false);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    // On initial load of a lecture's notes, decide the mode.
    // If there is no note, start in editing mode. Otherwise, view mode.
    useEffect(() => {
        setIsEditing(!note.trim());
    }, [activeContent]);

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
        onNoteChange(updatedValue);
        
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

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-heading">My Notes</h2>
                    <p className="text-content text-sm">Notes for "{activeContent.title}"</p>
                </div>
                <div className="flex items-center gap-4">
                    <AnimatePresence>
                        {saveStatus === 'saved' && !isEditing && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="text-sm font-semibold flex items-center gap-2 text-green-500"
                            >
                                <SolidCheckIcon className="w-4 h-4" />
                                <span>Saved</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                    >
                        {isEditing ? (
                            <><EyeIcon className="w-4 h-4" /> View Note</>
                        ) : (
                            <><PencilIcon className="w-4 h-4" /> Edit Note</>
                        )}
                    </button>
                </div>
            </div>
            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div key="editor" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                        <div className="bg-slate-50 border border-border rounded-lg">
                             <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-100 rounded-t-lg">
                                <ToolbarButton onClick={() => applyFormatting('h1')} aria-label="Heading"><HeadingIcon /></ToolbarButton>
                                <ToolbarButton onClick={() => applyFormatting('bold')} aria-label="Bold"><BoldIcon /></ToolbarButton>
                                <ToolbarButton onClick={() => applyFormatting('italic')} aria-label="Italic"><ItalicIcon /></ToolbarButton>
                                <ToolbarButton onClick={() => applyFormatting('underline')} aria-label="Underline"><UnderlineIcon /></ToolbarButton>
                                <div className="w-px h-6 bg-slate-300 mx-1"></div>
                                <ToolbarButton onClick={() => applyFormatting('list')} aria-label="Bulleted List"><ListIcon /></ToolbarButton>
                                <ToolbarButton onClick={() => applyFormatting('task')} aria-label="Task List"><ListCheckIcon /></ToolbarButton>
                            </div>
                            <textarea
                                ref={contentRef}
                                value={note}
                                onChange={(e) => onNoteChange(e.target.value)}
                                rows={10}
                                className="w-full bg-slate-50 rounded-b-lg p-4 focus:outline-none resize-y"
                                placeholder="Start typing your notes... They'll be saved automatically."
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="viewer" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                        className="w-full bg-slate-50 border border-border rounded-lg p-4 min-h-[300px] flex flex-col"
                    >
                        {note.trim() ? (
                            <NoteContentRenderer content={note} />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center text-content h-full m-auto">
                                <DocumentTextIcon className="w-12 h-12 text-slate-300 mb-2" />
                                <p className="font-semibold">No notes for this lecture yet.</p>
                                <p>Click "Edit Note" to get started.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ResourcesContent = ({ activeSection }: { activeSection: CourseSection | undefined }) => {
    // Determine if there are resources to display.
    // The 'resources' property is optional on the CourseSection type.
    const hasResources = activeSection?.resources?.length > 0;

    return (
        <div>
            <h2 className="text-xl font-bold text-heading mb-4">Resources for this section</h2>
            {!hasResources ? (
                 <p className="text-content">No downloadable resources are available for this section.</p>
            ) : (
                <ul className="space-y-3">
                    {activeSection.resources!.map((resource, index) => (
                        <li key={index} className="flex items-center justify-between bg-slate-50 border border-border p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                <DocumentTextIcon className="w-5 h-5 text-content" />
                                <span className="font-medium text-heading">{resource.name}</span>
                            </div>
                            <a href={resource.url} download className="p-1.5 rounded-full hover:bg-slate-200" aria-label={`Download ${resource.name}`}>
                                <DownloadIcon className="w-5 h-5 text-content" />
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const ForumContent: React.FC<{
    type: 'discussion' | 'qna';
    course: AppCourse;
    threads: DiscussionThread[];
    setAllThreads: React.Dispatch<React.SetStateAction<DiscussionThread[]>>;
    currentUser: User;
}> = ({ type, course, threads, setAllThreads, currentUser }) => {

    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [showNewPostForm, setShowNewPostForm] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [newReply, setNewReply] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'upvoted'>('recent');
    const [filterUnanswered, setFilterUnanswered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpvote = async (threadId: string, replyId?: string) => {
        // Note: Backend currently only supports upvoting threads, not individual replies
        if (replyId) {
            // Optimistic update for replies (local only for now)
            setAllThreads(prev => prev.map(thread => {
                if (thread.id !== threadId) return thread;
                return {
                    ...thread,
                    replies: thread.replies.map(reply => 
                        reply.id === replyId ? { ...reply, upvotes: reply.upvotes + 1 } : reply
                    )
                };
            }));
            return;
        }

        try {
            // Call backend API for thread upvote
            const result = await courseService.upvoteDiscussion(course._id || course.id.toString(), threadId);
            
            // Update local state with server response
            setAllThreads(prev => prev.map(thread => 
                thread.id === threadId ? { ...thread, upvotes: result.upvotes } : thread
            ));
        } catch (error) {
            console.error('Error upvoting discussion:', error);
            // Optionally show error toast/notification
        }
    };

    const handleAddPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.title.trim() || !newPost.content.trim()) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const title = type === 'qna' ? `Q&A: ${newPost.title}` : newPost.title;
            
            // Call backend API to add discussion post
            const newThread = await courseService.addDiscussionPost(
                course._id || course.id.toString(),
                { title, content: newPost.content }
            );

            // Add the new thread to local state with backend-generated data
            setAllThreads(prev => [newThread, ...prev]);
            setNewPost({ title: '', content: '' });
            setShowNewPostForm(false);
        } catch (error) {
            console.error('Error adding discussion post:', error);
            // Optionally show error toast/notification
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddReply = async (e: React.FormEvent, threadId: string) => {
        e.preventDefault();
        if (!newReply.trim()) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Call backend API to add reply
            const reply = await courseService.addDiscussionReply(
                course._id || course.id.toString(),
                threadId,
                { content: newReply }
            );

            // Add the reply to local state with backend-generated data
            setAllThreads(prev => prev.map(thread => 
                thread.id === threadId ? { ...thread, replies: [...thread.replies, reply] } : thread
            ));
            setNewReply('');
        } catch (error) {
            console.error('Error adding reply:', error);
            // Optionally show error toast/notification
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedThread = useMemo(() => threads.find(t => t.id === selectedThreadId), [selectedThreadId, threads]);

    const sortedAndFilteredDiscussions = useMemo(() => {
        let tempDiscussions = [...threads];
        if (filterUnanswered) {
            tempDiscussions = tempDiscussions.filter(thread => thread.replies.length === 0);
        }
        if (sortBy === 'upvoted') {
            tempDiscussions.sort((a, b) => b.upvotes - a.upvotes);
        }
        return tempDiscussions;
    }, [threads, sortBy, filterUnanswered]);

    const sortButtonClasses = (isActive: boolean) => 
        `px-3 py-1.5 text-sm rounded-md transition-colors ${
            isActive ? 'bg-primary text-white font-semibold' : 'bg-transparent text-content hover:bg-slate-200'
        }`;

    return (
        <AnimatePresence mode="wait">
            {selectedThread ? (
                <motion.div key="thread-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <button onClick={() => setSelectedThreadId(null)} className="flex items-center gap-2 font-semibold text-primary mb-4 hover:underline">
                        <ArrowLeftIcon /> Back to all {type === 'qna' ? 'questions' : 'discussions'}
                    </button>
                    <div className="bg-white p-5 rounded-lg border border-border">
                        <h2 className="text-xl font-bold text-heading mb-2">{selectedThread.title.replace(/^Q&A:\s*/i, '')}</h2>
                        <div className="flex items-center gap-2 text-sm text-content mb-4">
                            <img src={selectedThread.avatar} alt={selectedThread.author} className="w-6 h-6 rounded-full" />
                            <strong>{selectedThread.author}</strong> • <span>{selectedThread.timestamp}</span>
                        </div>
                        <p className="text-content whitespace-pre-wrap">{selectedThread.content}</p>
                    </div>
                    <h3 className="text-lg font-bold text-heading my-6">{selectedThread.replies.length} Replies</h3>
                    <div className="space-y-4">
                        {selectedThread.replies.map(reply => (
                            <div key={reply.id} className="flex items-start gap-4">
                                <img src={reply.avatar} alt={reply.author} className="w-9 h-9 rounded-full mt-1" />
                                <div className={`flex-1 p-4 rounded-lg border ${reply.authorRole === 'faculty' ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-border'}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm"><strong>{reply.author}</strong> {reply.authorRole === 'faculty' && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1">INSTRUCTOR</span>} • <span className="text-content">{reply.timestamp}</span></p>
                                        <button onClick={() => handleUpvote(selectedThread.id, reply.id)} className="flex items-center gap-1.5 text-content hover:text-primary transition-colors text-sm px-2 py-1 rounded-md border border-transparent hover:border-slate-300 hover:bg-white">
                                            <ArrowUpIcon className="w-4 h-4" /> {reply.upvotes}
                                        </button>
                                    </div>
                                    <p className="text-content mt-2 whitespace-pre-wrap">{reply.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={(e) => handleAddReply(e, selectedThread.id)} className="mt-8 flex items-start gap-4">
                        <img src={currentUser.profilePicture} alt="Your avatar" className="w-9 h-9 rounded-full mt-1" />
                        <div className="flex-1">
                            <textarea value={newReply} onChange={e => setNewReply(e.target.value)} rows={3} placeholder="Add your reply..." className="w-full bg-white border border-border rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none" disabled={isSubmitting}></textarea>
                            <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: isSubmitting ? 1 : 1.05 }} whileTap={{ scale: isSubmitting ? 1 : 0.95 }} className="mt-2 bg-primary text-white font-bold py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isSubmitting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? 'Posting...' : 'Post Reply'}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            ) : (
                <motion.div key="thread-list" initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-heading">{type === 'qna' ? 'Questions & Answers' : 'Discussions'}</h2>
                        <motion.button onClick={() => setShowNewPostForm(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-primary text-white font-bold py-2 px-5 rounded-lg">
                            {type === 'qna' ? 'Ask a New Question' : 'Start a Discussion'}
                        </motion.button>
                    </div>

                     <div className="flex flex-col sm:flex-row justify-start items-center mb-6 gap-4 p-3 bg-slate-50 rounded-lg border border-border">
                        <span className="font-semibold text-sm text-heading mr-2">Sort by:</span>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setSortBy('recent')} className={sortButtonClasses(sortBy === 'recent')}>Most Recent</button>
                             <button onClick={() => setSortBy('upvoted')} className={sortButtonClasses(sortBy === 'upvoted')}>Most Upvoted</button>
                        </div>
                        <div className="sm:ml-auto flex items-center gap-2">
                            <input type="checkbox" id="filterUnanswered" checked={filterUnanswered} onChange={e => setFilterUnanswered(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="filterUnanswered" className="text-sm font-medium text-content select-none">Show Unanswered</label>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showNewPostForm && (
                            <motion.form onSubmit={handleAddPost} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50 p-4 rounded-lg border border-border mb-4 overflow-hidden">
                                <h3 className="font-bold text-heading mb-3">{type === 'qna' ? 'Ask a New Question' : 'Create New Post'}</h3>
                                <input type="text" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} placeholder="Title..." className="w-full bg-white border border-border rounded-lg p-2 mb-2 focus:ring-2 focus:ring-primary focus:outline-none" disabled={isSubmitting} />
                                <textarea value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} rows={4} placeholder="What's on your mind?" className="w-full bg-white border border-border rounded-lg p-2 mb-3 focus:ring-2 focus:ring-primary focus:outline-none" disabled={isSubmitting}></textarea>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowNewPostForm(false)} className="text-content font-semibold py-2 px-4 rounded-lg" disabled={isSubmitting}>Cancel</button>
                                    <button type="submit" className="bg-primary text-white font-bold py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" disabled={isSubmitting}>
                                        {isSubmitting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                        {isSubmitting ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="space-y-3">
                        {sortedAndFilteredDiscussions.map(thread => (
                            <div key={thread.id} className="bg-white p-4 rounded-lg border border-border flex items-start gap-4">
                                <button onClick={() => handleUpvote(thread.id)} className="flex flex-col items-center p-2 rounded-md border hover:bg-slate-100 transition-colors">
                                    <ArrowUpIcon className="w-4 h-4 text-content" />
                                    <span className="text-sm font-bold text-heading">{thread.upvotes}</span>
                                </button>
                                <div className="flex-1">
                                    <button onClick={() => setSelectedThreadId(thread.id)} className="text-left w-full">
                                        <h3 className="font-bold text-heading hover:text-primary transition-colors">{thread.title.replace(/^Q&A:\s*/i, '')}</h3>
                                    </button>
                                    <div className="flex items-center gap-4 text-xs text-content mt-1">
                                        <span>Posted by <strong>{thread.author}</strong> • {thread.timestamp}</span>
                                        <div className="flex items-center gap-1">
                                            <MessageIcon className="w-3.5 h-3.5" />
                                            <span>{thread.replies.length} replies</span>
                                        </div>
                                    </div>
                                </div>
                                <img src={thread.avatar} alt={thread.author} className="w-9 h-9 rounded-full" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const CourseLearningView: React.FC<{ course: AppCourse, toggleCourseItemCompletion: (courseId: string, itemId: string) => void, currentUser: User, handleAssignmentSubmission: (courseId: string, itemId: string, submissionLink: string) => void, handleSaveCourseNote: (courseId: string, itemId: string, noteContent: string) => void }> = ({ course, toggleCourseItemCompletion, currentUser, handleAssignmentSubmission, handleSaveCourseNote }) => {
    const [activeTab, setActiveTab] = useState('overview');
    
    const [activeContent, setActiveContent] = useState<CourseContentItem | undefined>(() => {
        for (let sIndex = 0; sIndex < course.content.length; sIndex++) {
            const section = course.content[sIndex];
            for (let iIndex = 0; iIndex < section.items.length; iIndex++) {
                const item = section.items[iIndex];
                const itemId = `${sIndex}-${iIndex}`;
                if (!course.completedItems.includes(itemId)) {
                    return item;
                }
            }
        }
        return course.content[0]?.items[0];
    });

    const [openSections, setOpenSections] = useState<number[]>(() => {
        if (!activeContent) return [0];
        for (let sIndex = 0; sIndex < course.content.length; sIndex++) {
            if (course.content[sIndex].items.includes(activeContent)) {
                return [sIndex];
            }
        }
        return [0];
    });

    const [discussions, setDiscussions] = useState<DiscussionThread[]>(course.discussion || []);
    const [justCompletedSection, setJustCompletedSection] = useState<number | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const debouncedNoteContent = useDebounce(noteContent, 1000);
    
    const prevCompletedItemsRef = useRef<string[]>([]);
    const itemRefs = useRef<Map<string, HTMLLIElement | null>>(new Map());
    
    const qnaThreads = useMemo(() => discussions.filter(t => t.title.toLowerCase().startsWith('q&a:')), [discussions]);
    const discussionThreads = useMemo(() => discussions.filter(t => !t.title.toLowerCase().startsWith('q&a:')), [discussions]);

    const { currentSectionIndex, currentItemIndex } = useMemo(() => {
        if (!activeContent) return { currentSectionIndex: -1, currentItemIndex: -1 };
        for (let sIndex = 0; sIndex < course.content.length; sIndex++) {
            const iIndex = course.content[sIndex].items.findIndex(item => item.title === activeContent.title && item.duration === activeContent.duration);
            if (iIndex !== -1) {
                return { currentSectionIndex: sIndex, currentItemIndex: iIndex };
            }
        }
        return { currentSectionIndex: -1, currentItemIndex: -1 };
    }, [activeContent, course.content]);
    
    const itemId = `${currentSectionIndex}-${currentItemIndex}`;

    // Load note when active content changes
    useEffect(() => {
        if (currentSectionIndex !== -1 && currentItemIndex !== -1) {
            const loadedNote = course.enrollment?.courseNotes?.[itemId] || '';
            setNoteContent(loadedNote);
            setSaveStatus('idle'); // Reset save status on content change
        }
    }, [activeContent, currentSectionIndex, currentItemIndex, course.enrollment]);

    // Auto-save note when debounced content changes
    useEffect(() => {
        const previousNote = course.enrollment?.courseNotes?.[itemId] || '';
        const hasChanged = debouncedNoteContent !== previousNote;
        const hasContent = debouncedNoteContent && debouncedNoteContent.trim() !== '';
        
        // Only save if content has changed AND has actual content (not empty)
        if (currentSectionIndex !== -1 && currentItemIndex !== -1 && hasChanged && hasContent) {
            setSaveStatus('saving');
            handleSaveCourseNote(course._id || course.id, itemId, debouncedNoteContent);
            // Simulate save time
            setTimeout(() => setSaveStatus('saved'), 500);
        }
    }, [debouncedNoteContent, currentSectionIndex, currentItemIndex, course._id, course.id, itemId, handleSaveCourseNote, course.enrollment]);

    useEffect(() => {
        const prevCompleted = prevCompletedItemsRef.current;
        course.content.forEach((section, sIndex) => {
            const allItems = section.items.map((_, iIndex) => `${sIndex}-${iIndex}`);
            if (allItems.length === 0) return;
            
            const isNowComplete = allItems.every(id => course.completedItems.includes(id));
            const wasPreviouslyComplete = allItems.every(id => prevCompleted.includes(id));

            if (isNowComplete && !wasPreviouslyComplete) {
                setJustCompletedSection(sIndex);
                const timer = setTimeout(() => setJustCompletedSection(null), 4000);
                return () => clearTimeout(timer);
            }
        });
        prevCompletedItemsRef.current = course.completedItems;
    }, [course.completedItems, course.content]);

    useEffect(() => {
        if (currentSectionIndex !== -1 && currentItemIndex !== -1) {
            const element = itemRefs.current.get(itemId);
            
            setTimeout(() => {
                 if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                    });
                }
            }, 100);
        }
    }, [activeContent, currentSectionIndex, currentItemIndex]);

    // Calculate progress based on completed items
    const progress = useMemo(() => {
        if (!course.content || course.content.length === 0) return 0;
        
        // Count total items across all sections
        const totalItems = course.content.reduce((total, section) => {
            return total + (section.items?.length || 0);
        }, 0);
        
        if (totalItems === 0) return 0;
        
        // Count completed items
        const completedCount = course.completedItems?.length || 0;
        
        // Calculate percentage
        const progressPercent = Math.round((completedCount / totalItems) * 100);
        
        return progressPercent;
    }, [course.content, course.completedItems]);
    
    const activeSection = useMemo(() => {
        if(currentSectionIndex > -1) {
            return course.content[currentSectionIndex];
        }
        return undefined;
    }, [currentSectionIndex, course.content]);

    const isLastItem = useMemo(() => {
        const lastSectionIndex = course.content.length - 1;
        if (lastSectionIndex < 0) return true;
        const lastItemIndex = course.content[lastSectionIndex].items.length - 1;
        return currentSectionIndex === lastSectionIndex && currentItemIndex === lastItemIndex;
    }, [currentSectionIndex, currentItemIndex, course.content]);
    
    const allRegularItems = useMemo(() => course.content.flatMap((section, sIndex) => 
        section.items.map((_, iIndex) => `${sIndex}-${iIndex}`)
    ), [course.content]);
    
    const isRegularContentComplete = useMemo(() => 
        allRegularItems.length > 0 ? allRegularItems.every(id => course.completedItems.includes(id)) : true
    , [allRegularItems, course.completedItems]);

    const handleNextLesson = () => {
        if (isLastItem || currentSectionIndex === -1) return;

        const currentSection = course.content[currentSectionIndex];
        if (currentItemIndex < currentSection.items.length - 1) {
            setActiveContent(currentSection.items[currentItemIndex + 1]);
        } else if (currentSectionIndex < course.content.length - 1) {
            const nextSectionIndex = currentSectionIndex + 1;
            const nextSection = course.content[nextSectionIndex];
            if (nextSection.items.length > 0) {
                setActiveContent(nextSection.items[0]);
                if (!openSections.includes(nextSectionIndex)) {
                    setOpenSections(prev => [...new Set([...prev, nextSectionIndex])]);
                }
            }
        }
    };

    const toggleSection = (index: number) => {
        setOpenSections(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    };

    const handleItemClick = (item: CourseContentItem, sectionIndex: number, itemIndex: number) => {
        setActiveContent(item);
        
        if (!openSections.includes(sectionIndex)) {
            setOpenSections(prev => [...prev, sectionIndex]);
        }
    };
    
    const getItemIcon = (type: string) => {
        switch (type) {
            case 'quiz': return <QuizIcon className="w-4 h-4 text-content" />;
            case 'assignment': return <AssignmentIcon className="w-4 h-4 text-content" />;
            default: return <PlayIcon className="w-4 h-4 text-content" />;
        }
    }

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'qna', label: 'Q&A' },
        { id: 'notes', label: 'Notes' },
        { id: 'resources', label: 'Resources' },
        { id: 'discussion', label: 'Discussion' },
    ];

    const isCurrentItemCompleted = course.completedItems.includes(itemId);
    const isCompletableLecture = activeContent?.type === 'lecture';

    const handleMainActionClick = () => {
        if (!activeContent || currentSectionIndex === -1) return;
        
        if (isCompletableLecture && !isCurrentItemCompleted) {
            toggleCourseItemCompletion(course._id || course.id, itemId);
        }
        
        if (!isLastItem) {
            handleNextLesson();
        }
    };

    const buttonText = isCompletableLecture && !isCurrentItemCompleted
        ? (isLastItem ? 'Complete Course' : 'Complete & Continue')
        : (isLastItem ? 'End of Course' : 'Next Lesson');

    const isButtonDisabled = isLastItem && (!isCompletableLecture || isCurrentItemCompleted);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 xl:col-span-9">
                    
                    {!activeContent ? (
                         <div className="bg-white rounded-lg p-8 text-center border border-border">
                            <h1 className="text-2xl font-bold text-heading">Course content is not available.</h1>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${currentSectionIndex}-${currentItemIndex}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-dark-bg rounded-lg overflow-hidden aspect-video flex items-center justify-center mb-6">
                                    {activeContent.videoUrl && activeContent.videoUrl.trim() !== '' ? (
                                        activeContent.videoType === 'youtube' ? (
                                            <iframe
                                                className="w-full h-full"
                                                src={activeContent.videoUrl}
                                                title={activeContent.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            // For uploaded videos, check if it's a valid URL (not blob)
                                            activeContent.videoUrl.startsWith('blob:') ? (
                                                <div className="text-center text-slate-400">
                                                    <PlayIcon className="w-20 h-20 text-white/30 mx-auto"/>
                                                    <p className="mt-2 font-semibold">Video upload in progress</p>
                                                    <p className="text-sm mt-1">This video is being uploaded to cloud storage</p>
                                                </div>
                                            ) : (
                                                <video
                                                    src={activeContent.videoUrl}
                                                    controls
                                                    className="w-full h-full bg-black"
                                                    onError={(e) => {
                                                        console.error('❌ Video loading error:', {
                                                            url: activeContent.videoUrl,
                                                            error: e
                                                        });
                                                    }}
                                                />
                                            )
                                        )
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <PlayIcon className="w-20 h-20 text-white/30 mx-auto"/>
                                            <p className="mt-2 font-semibold">No video for this {activeContent.type}</p>
                                            <p className="text-sm mt-1">
                                                {activeContent.type === 'lecture' ? 'This lecture has no video content' :
                                                 activeContent.type === 'quiz' ? 'Complete the quiz below' :
                                                 'Submit your assignment below'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                {activeContent.type === 'assignment' ? (
                                    <AssignmentSubmissionView
                                        course={course}
                                        assignmentItem={activeContent}
                                        itemId={itemId}
                                        currentUser={currentUser}
                                        handleAssignmentSubmission={handleAssignmentSubmission}
                                    />
                                ) : (
                                    <div className="bg-white rounded-lg border border-border">
                                        <div className="border-b border-border px-6">
                                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                                {TABS.map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setActiveTab(tab.id)}
                                                        className={`${
                                                            activeTab === tab.id
                                                                ? 'border-primary text-primary'
                                                                : 'border-transparent text-content hover:text-heading hover:border-gray-300'
                                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none`}
                                                        aria-current={activeTab === tab.id ? 'page' : undefined}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </nav>
                                        </div>
                                        <div className="p-6">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={`${activeContent.title}-${activeTab}`}
                                                    initial={{ y: 10, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: -10, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {activeTab === 'overview' && <OverviewContent activeContent={activeContent} />}
                                                    {activeTab === 'qna' && <ForumContent type="qna" course={course} threads={qnaThreads} setAllThreads={setDiscussions} currentUser={currentUser} />}
                                                    {activeTab === 'notes' && <NotesContent activeContent={activeContent} note={noteContent} onNoteChange={setNoteContent} saveStatus={saveStatus} />}
                                                    {activeTab === 'resources' && <ResourcesContent activeSection={activeSection} />}
                                                    {activeTab === 'discussion' && <ForumContent type="discussion" course={course} threads={discussionThreads} setAllThreads={setDiscussions} currentUser={currentUser} />}
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4 pt-6 flex justify-end">
                                    <motion.button
                                        onClick={handleMainActionClick}
                                        disabled={isButtonDisabled}
                                        whileHover={{ scale: !isButtonDisabled ? 1.05 : 1 }}
                                        whileTap={{ scale: !isButtonDisabled ? 0.95 : 1 }}
                                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed"
                                        aria-label={buttonText}
                                    >
                                        <span>{buttonText}</span>
                                        {!isLastItem && <ArrowLeftIcon className="transform rotate-180 w-4 h-4" />}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="bg-white rounded-lg border border-border p-4 h-full">
                        <h2 className="font-bold text-heading mb-1">{course.title}</h2>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{width: `${Math.min(100, progress)}%`}}></div></div>
                            <span className="text-xs text-content whitespace-nowrap">{Math.min(100, Math.round(progress))}%</span>
                        </div>

                        <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
                            {course.content.map((section, sIndex) => (
                                <div key={sIndex} className="py-1">
                                    <AnimatePresence>
                                        {justCompletedSection === sIndex && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginBottom: '0.5rem' }}
                                                exit={{ height: 0, opacity: 0, marginBottom: 0, transition: { duration: 0.4 } }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-secondary text-white text-sm font-bold px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                    Section Complete!
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <button onClick={() => toggleSection(sIndex)} className="w-full flex justify-between items-center py-2">
                                        <span className="font-bold text-heading text-sm text-left">{section.sectionTitle}</span>
                                        <ChevronDownIcon className={`transition-transform duration-200 ${openSections.includes(sIndex) ? 'rotate-180' : ''} w-4 h-4`} />
                                    </button>
                                    <AnimatePresence>
                                    {openSections.includes(sIndex) && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }} 
                                            className="overflow-hidden"
                                            style={{ willChange: 'height, opacity' }}>
                                            <ul className="py-1 space-y-1">
                                                {section.items.map((item, iIndex) => {
                                                    const itemId = `${sIndex}-${iIndex}`;
                                                    const isCompleted = course.completedItems.includes(itemId);
                                                    const isActive = activeContent?.title === item.title && activeContent?.duration === item.duration;
                                                    
                                                    const content = (
                                                    <>
                                                        <AnimatedCheckmark completed={isCompleted} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className={`font-medium ${isActive && item.type !== 'quiz' ? 'font-bold' : ''}`}>{item.title}</p>
                                                                {(item.type === 'quiz' || item.type === 'assignment') && item.isGraded && (
                                                                    <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-300">Graded</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-content mt-0.5">
                                                                {getItemIcon(item.type)}
                                                                <span>{item.duration}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                    );

                                                    return (
                                                        <li key={iIndex} ref={el => { itemRefs.current.set(itemId, el); }}>
                                                            {item.type === 'quiz' ? (
                                                                <Link to={`/courses/${course.id}/quiz/${sIndex}/${iIndex}`} className={`w-full flex items-start gap-3 text-left p-2 rounded-md text-sm hover:bg-slate-100`}>
                                                                    {content}
                                                                </Link>
                                                            ) : (
                                                                <button onClick={() => handleItemClick(item, sIndex, iIndex)} className={`w-full flex items-start gap-3 text-left p-2 rounded-md text-sm ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100'}`}>
                                                                    {content}
                                                                </button>
                                                            )}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        {course.finalQuiz?.isEnabled && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <h3 className="font-bold text-heading text-sm mb-2">Final Assessments</h3>
                                <div className={`p-3 rounded-lg border-2 ${!isRegularContentComplete ? 'bg-slate-100 border-dashed' : 'bg-white border-solid'}`}>
                                    { !isRegularContentComplete && (
                                        <div className="flex items-center gap-2 text-sm text-content p-2">
                                            <LockClosedIcon className="w-4 h-4 flex-shrink-0" />
                                            <span>Complete all course content to unlock.</span>
                                        </div>
                                    )}
                                    <div className={`space-y-1 ${!isRegularContentComplete ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <Link to={`/courses/${course.id}/final-quiz`} className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-100">
                                            <AnimatedCheckmark completed={course.enrollment?.finalQuizScore !== undefined} />
                                            <div className="flex items-center gap-2">
                                                <QuizIcon className="w-5 h-5 text-content" />
                                                <span className="font-medium text-sm">Final Quiz</span>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
            <AiStudyBuddy course={course} />
        </>
    );
}

const AssignmentSubmissionView: React.FC<{
    course: AppCourse,
    assignmentItem: CourseContentItem,
    itemId: string,
    currentUser: User,
    handleAssignmentSubmission: (courseId: string, itemId: string, submissionLink: string) => void
}> = ({ course, assignmentItem, itemId, currentUser, handleAssignmentSubmission }) => {
    
    const [submissionLink, setSubmissionLink] = useState('');

    const submission = useMemo(() => {
        const enrollment = currentUser.enrollments?.find(e => {
            const enrollmentCourseId = typeof e.courseId === 'string' ? e.courseId : e.courseId?._id || e.courseId?.toString();
            return enrollmentCourseId === (course._id || course.id);
        });
        return enrollment?.assignmentSubmissions?.find(s => s.itemId === itemId);
    }, [currentUser, course._id, course.id, itemId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (submissionLink.trim()) {
            handleAssignmentSubmission(course._id || course.id, itemId, submissionLink);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-border p-6">
            <h1 className="text-3xl font-bold text-heading mb-2">{assignmentItem.title}</h1>
            <p className="text-content mb-6">{assignmentItem.description}</p>
            
            <div className="bg-slate-50 border border-border rounded-lg p-6">
                {submission ? (
                    <div>
                        <h2 className="text-xl font-bold text-heading mb-4">Your Submission</h2>
                        <div className="flex items-center gap-3 bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg">
                            <CheckCircleIcon className="w-6 h-6"/>
                            <p>You submitted this assignment on <strong>{submission.submissionDate}</strong>.</p>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Submitted Link</label>
                            <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{submission.submissionLink}</a>
                        </div>
                        
                        {assignmentItem.isGraded && (
                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <h3 className="font-semibold text-heading mb-2">Grading Status</h3>
                                {submission.grade !== undefined ? (
                                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                                        <p className="text-sm font-semibold text-primary uppercase">Your Grade</p>
                                        <p className="text-4xl font-bold text-primary mt-1">{submission.grade} / 10</p>
                                        {submission.feedback && (
                                            <div className="mt-3">
                                                <h4 className="font-semibold text-heading">Instructor Feedback:</h4>
                                                <p className="text-content mt-1 p-2 bg-slate-100 rounded-md border">{submission.feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm font-medium">
                                        Awaiting grading from the instructor.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold text-heading mb-4">Submit Your Work</h2>
                        <p className="text-sm text-content mb-4">Paste the shareable link to your assignment file (e.g., Google Drive, Dropbox, GitHub).</p>
                        <div>
                             <label htmlFor="submissionLink" className="block text-sm font-medium text-slate-600 mb-1">Submission Link</label>
                             <input 
                                id="submissionLink"
                                type="url"
                                value={submissionLink}
                                onChange={e => setSubmissionLink(e.target.value)}
                                placeholder="https://..."
                                required
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                             />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <motion.button type="submit" whileHover={{scale: 1.05}} whileTap={{scale: 0.95}} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg">
                                Submit Assignment
                            </motion.button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};


export default CourseDetail;