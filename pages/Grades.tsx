import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppCourse } from '../App';
import { Enrollment } from '../types';
import { ChevronDownIcon, ClipboardCheckIcon, DocumentTextIcon, QuizIcon, TrophyIcon, MessageIcon } from '../components/icons';
import { useAuth } from '../src/hooks/useAuth';
import courseService from '../src/services/course.service';
import userService from '../src/services/user.service';
import { handleError } from '../src/utils/errorHandler';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

interface GradesProps {
    courses: AppCourse[];
}

const getGradeColor = (grade: number | null) => {
    if (grade === null) return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
    if (grade >= 90) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (grade >= 70) return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
    if (grade >= 50) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
};

const GradePill: React.FC<{ score: number | null | undefined, maxScore: number }> = ({ score, maxScore }) => {
    if (score === null || score === undefined) {
        return (
             <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                Awaiting Grade
            </div>
        );
    }
    const percentage = (score / maxScore) * 100;
    const { bg, text } = getGradeColor(percentage);
    return (
        <div className={`px-2.5 py-1 rounded-full text-sm font-bold ${bg} ${text} w-16 text-center`}>
            {score}/{maxScore}
        </div>
    );
};

const Accordion: React.FC<{ title: string; icon: React.ReactElement; children: React.ReactNode }> = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-t border-border">
            <motion.header
                initial={false}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
            >
                <h4 className="font-semibold text-heading flex items-center gap-3">
                    {/* FIX: Cast icon to React.ReactElement<any> to allow passing className prop for styling. */}
                    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5 text-content" })}
                    {title}
                </h4>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDownIcon className="w-5 h-5 text-content" />
                </motion.div>
            </motion.header>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.section
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 },
                        }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-slate-50/50">
                            {children}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
};


// Sub-component for displaying one course's grades
const CourseGradesCard: React.FC<{ course: AppCourse; enrollment: Enrollment }> = ({ course, enrollment }) => {
    
    const overallGrade = useMemo(() => {
        const gradedItems: { score: number; maxScore: number }[] = [];
        
        enrollment.quizScores?.forEach(quiz => gradedItems.push({ score: quiz.score, maxScore: 10 }));
        if (typeof enrollment.finalQuizScore === 'number') gradedItems.push({ score: enrollment.finalQuizScore, maxScore: 10 });
        enrollment.assignmentSubmissions?.forEach(sub => { if (typeof sub.grade === 'number') gradedItems.push({ score: sub.grade, maxScore: 10 }) });
        
        if (gradedItems.length === 0) return null;
        
        const totalScore = gradedItems.reduce((acc, item) => acc + item.score, 0);
        const totalMaxScore = gradedItems.reduce((acc, item) => acc + item.maxScore, 0);
        
        return totalMaxScore === 0 ? 0 : Math.round((totalScore / totalMaxScore) * 100);
    }, [enrollment]);

    const gradeColor = getGradeColor(overallGrade);

    const getItem = (itemId: string) => {
        const [sIdx, iIdx] = itemId.split('-').map(Number);
        return course.content[sIdx]?.items[iIdx];
    };

    return (
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <img src={course.imageUrl} alt={course.title} className="w-full sm:w-40 h-24 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-heading">{course.title}</h3>
                    <p className="text-sm text-content">by {course.author.fullName}</p>
                </div>
                <div className={`flex-shrink-0 text-center rounded-lg p-4 w-full sm:w-auto ${gradeColor.bg} border ${gradeColor.border}`}>
                    <p className={`text-sm font-semibold uppercase ${gradeColor.text}`}>Overall Grade</p>
                    {overallGrade !== null ? (
                        <p className={`text-4xl font-bold mt-1 ${gradeColor.text}`}>{overallGrade}<span className="text-2xl">%</span></p>
                    ) : (
                        <p className={`text-lg font-semibold mt-1 ${gradeColor.text}`}>N/A</p>
                    )}
                </div>
            </div>
            
            <Accordion title="Quizzes" icon={<QuizIcon />}>
                <div className="space-y-3">
                    {(!enrollment.quizScores || enrollment.quizScores.length === 0) && typeof enrollment.finalQuizScore !== 'number' ? (
                        <p className="text-sm text-content text-center py-2">No quiz scores recorded.</p>
                    ) : (
                        <>
                            {enrollment.quizScores?.map(quiz => {
                                const item = getItem(quiz.itemId);
                                return (
                                <div key={quiz.itemId} className="flex justify-between items-center text-sm p-3 bg-white rounded-md border">
                                    <div className="flex items-center gap-2">
                                        <p className="text-slate-700">{item?.title || 'Graded Quiz'}</p>
                                        {item?.isGraded && (
                                            <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-300">Graded</span>
                                        )}
                                    </div>
                                    <GradePill score={quiz.score} maxScore={10} />
                                </div>
                            )})}
                            {typeof enrollment.finalQuizScore === 'number' && (
                                <div className="flex justify-between items-center text-sm p-3 bg-white rounded-md border">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-700">{course.finalQuiz?.title || 'Final Quiz'}</p>
                                        <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-300">Graded</span>
                                    </div>
                                    <GradePill score={enrollment.finalQuizScore} maxScore={10} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Accordion>

            <Accordion title="Assignments" icon={<DocumentTextIcon />}>
                <div className="space-y-4">
                     {(!enrollment.assignmentSubmissions || enrollment.assignmentSubmissions.length === 0) ? (
                        <p className="text-sm text-content text-center py-2">No assignments submitted or graded.</p>
                    ) : (
                        enrollment.assignmentSubmissions.map(sub => {
                            const item = getItem(sub.itemId);
                            return (
                            <div key={sub.itemId} className="p-3 bg-white rounded-lg border">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-heading">{item?.title || 'Graded Assignment'}</p>
                                        {item?.isGraded && (
                                            <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-300">Graded</span>
                                        )}
                                    </div>
                                    <GradePill score={sub.grade} maxScore={10} />
                                </div>
                                {sub.feedback && (
                                    <div className="mt-3 p-4 bg-primary/10 rounded-lg text-sm border-l-4 border-primary flex items-start gap-3">
                                        <MessageIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-semibold text-heading">Instructor Feedback</h5>
                                            <p className="text-content mt-1">{sub.feedback}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )})
                    )}
                </div>
            </Accordion>
        </motion.div>
    );
};

// Main component
const Grades: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<AppCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch enrolled courses and grades
    useEffect(() => {
        const fetchGrades = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Get user ID with fallback
                const userId = user._id || user.id;
                if (!userId) {
                    console.error('❌ No user ID available');
                    setError('User ID not found');
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                // Fetch user enrollments with graceful error handling
                let enrollments: any[] = [];
                try {
                    enrollments = await userService.getUserEnrollments(userId);
                } catch (enrollmentError: any) {
                    // Handle case where user has no enrollments (400/404 error)
                    if (enrollmentError.message?.includes('Invalid ID') || 
                        enrollmentError.message?.includes('400') || 
                        enrollmentError.message?.includes('404') ||
                        enrollmentError.message?.includes('No enrollments')) {
                        enrollments = [];
                    } else {
                        throw enrollmentError;
                    }
                }

                // If no enrollments, set empty array and return
                if (!enrollments || enrollments.length === 0) {
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                // Fetch all courses
                const allCourses = await courseService.getAllCourses();
                
                // Map enrolled courses with enrollment data
                const enrolledCourses = allCourses
                    .filter(course => enrollments.some((e: any) => e.courseId === course._id))
                    .map(course => {
                        const enrollment = enrollments.find((e: any) => e.courseId === course._id);
                        
                        // Get author info from authorId
                        const authorInfo = course.authorId || {};
                        
                        return {
                            id: parseInt(course._id.substring(course._id.length - 8), 16),
                            _id: course._id,
                            title: course.title,
                            imageUrl: course.imageUrl || '',
                            author: {
                                fullName: authorInfo.fullName || 'Instructor',
                                profilePicture: authorInfo.profilePicture || 'https://placehold.co/150'
                            },
                            content: course.content || [],
                            finalQuiz: course.finalQuiz,
                           
                            isEnrolled: true,
                            enrollment: enrollment
                        } as any;
                    });

                setCourses(enrolledCourses);
            } catch (err) {
                console.error('❌ Error fetching grades:', err);
                setError(handleError(err));
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, [user]);

    const enrolledCourses = useMemo(() => courses.filter(c => c.isEnrolled), [courses]);
    const [selectedCourseId, setSelectedCourseId] = useState<'all' | number>('all');
    
    const displayedCourses = useMemo(() => {
        if (selectedCourseId === 'all') {
            return enrolledCourses;
        }
        return enrolledCourses.filter(c => c.id === selectedCourseId);
    }, [enrolledCourses, selectedCourseId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                    <p className="font-medium">Error Loading Grades</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                 <div className="flex items-center gap-4">
                    <ClipboardCheckIcon className="w-10 h-10 text-primary hidden sm:block" />
                    <div>
                        <h1 className="text-4xl font-bold text-heading">Grades & Feedback</h1>
                        <p className="text-content mt-1">Review your performance across all your courses.</p>
                    </div>
                 </div>
                <div className="w-full sm:w-64">
                    <label htmlFor="courseFilter" className="sr-only">Filter by course</label>
                    <div className="relative">
                        <select
                            id="courseFilter"
                            value={String(selectedCourseId)}
                            onChange={e => setSelectedCourseId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="appearance-none w-full bg-white border border-border rounded-lg py-2 pl-3 pr-8 text-heading focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                            <option value="all">All Enrolled Courses</option>
                            {enrolledCourses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <ChevronDownIcon className="w-4 h-4 text-content"/>
                        </div>
                    </div>
                </div>
            </div>

            {displayedCourses.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                    {displayedCourses.map(course => (
                        <CourseGradesCard key={course.id} course={course} enrollment={course.enrollment!} />
                    ))}
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 bg-white border-2 border-dashed border-border rounded-xl"
                >
                    <ClipboardCheckIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-heading">No Grades to Display</h2>
                    <p className="text-content mt-2">
                        {enrolledCourses.length === 0 ? "You are not enrolled in any courses yet." : "No courses match the current filter."}
                    </p>
                </motion.div>
            )}

        </motion.div>
    );
};

export default Grades;
