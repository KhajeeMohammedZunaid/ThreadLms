import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppCourse } from '../../App';
import { User, calculateProgress } from '../../types';
import { ArrowLeftIcon, CoursesIcon, CheckCircleIcon, DocumentTextIcon, CalendarIcon, EnvelopeIcon, ChevronDownIcon, XIcon, TrophyIcon } from '../../components/icons';
import { useAuth } from '../../src/hooks/useAuth';
import courseService from '../../src/services/course.service';
import userService from '../../src/services/user.service';
import facultyService from '../../src/services/faculty.service';
import { handleError } from '../../src/utils/errorHandler';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

const calculateSectionProgress = (course: AppCourse, completedItems: string[]): number => {
    const totalItems = course.content.reduce((acc, section) => acc + section.items.length, 0);
    if (totalItems === 0) return completedItems.length > 0 ? 100 : 0;
    
    return totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 0;
};

type GradingItem = {
    type: 'assignment' | 'project';
    studentId: number;
    course: AppCourse;
    itemId?: string; // for assignments
    submission: any;
};


const FacultyStudentDetail: React.FC = () => {
    const { studentId } = useParams();
    const { user } = useAuth();
    const [student, setStudent] = useState<User | null>(null);
    const [courses, setCourses] = useState<AppCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradingItem, setGradingItem] = useState<GradingItem | null>(null);
    
    // Fetch student and course data
    useEffect(() => {
        const fetchData = async () => {
            if (!user || user.role !== 'faculty' || !studentId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                
                const userId = user._id || user.id;
                console.log('📚 Fetching student details:', { studentId, facultyId: userId });
                
                // Fetch faculty courses
                const fetchedCourses = await courseService.getCoursesByFaculty(userId);
                console.log('✅ Fetched courses:', fetchedCourses);
                setCourses(fetchedCourses as any);
                
                // Fetch student details
                const studentData = await userService.getUserProfile(studentId);
                console.log('✅ Fetched student:', studentData);
                setStudent(studentData as any);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setStudent(null);
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, studentId]);

    const studentEnrollments = useMemo(() => {
        if (!student || !user) return [];
        
        const facultyCourseIds = new Set(courses.map(c => c._id || c.id));
        
        return (student.enrollments || [])
            .filter(enrollment => {
                const enrollmentCourseId = typeof enrollment.courseId === 'string' 
                    ? enrollment.courseId 
                    : (enrollment.courseId as any)?._id || (enrollment.courseId as any)?.toString();
                return facultyCourseIds.has(enrollmentCourseId);
            })
            .map(enrollment => {
                const enrollmentCourseId = typeof enrollment.courseId === 'string' 
                    ? enrollment.courseId 
                    : (enrollment.courseId as any)?._id || (enrollment.courseId as any)?.toString();
                const course = courses.find(c => (c._id || c.id) === enrollmentCourseId);
                if (!course) return null;
                
                // Calculate total items in course (lectures + assignments + quizzes)
                const totalItems = course.content?.reduce((sum, section) => sum + section.items.length, 0) || 0;
                const finalQuizEnabled = course.finalQuiz?.isEnabled ? 1 : 0;
                const totalCourseItems = totalItems + finalQuizEnabled;
                
                // Calculate progress using completedItems array
                const progress = calculateProgress(enrollment.completedItems || [], totalCourseItems);
                
                return {
                    course,
                    progress,
                    enrollmentDate: enrollment.enrollmentDate,
                    submissions: enrollment.assignmentSubmissions || [],
                };
            })
            .filter((e): e is NonNullable<typeof e> => e !== null);
    }, [student, courses, user]);

    const completedCoursesCount = useMemo(() => studentEnrollments.filter(e => e.progress === 100).length, [studentEnrollments]);
    const totalAssignmentsSubmitted = useMemo(() => studentEnrollments.reduce((sum, e) => sum + e.submissions.length, 0), [studentEnrollments]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-faculty-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!student) {
        return <Navigate to="/faculty/students" replace />;
    }

    return (
        <>
        <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-heading">Student Details</h1>
                <Link to="/faculty/students" className="flex items-center gap-2 font-semibold text-content hover:text-heading transition-colors">
                    <ArrowLeftIcon /> Back to Roster
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Sticky Column */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="lg:sticky top-10 space-y-6">
                         <motion.div 
                            className="bg-white p-6 rounded-xl border border-border"
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.1 }}
                         >
                            <img src={student.profilePicture} alt={student.fullName} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-slate-100 shadow-sm" />
                            <div className="text-center mt-4">
                                <h2 className="text-xl font-bold text-heading">{student.fullName}</h2>
                                <a href={`mailto:${student.email}`} className="text-content hover:text-faculty-primary flex items-center justify-center gap-2 mt-1 text-sm">
                                    <EnvelopeIcon className="w-4 h-4" />
                                    {student.email}
                                </a>
                            </div>
                         </motion.div>
                         <motion.div 
                            className="bg-white p-6 rounded-xl border border-border"
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.2 }}
                         >
                            <h3 className="font-bold text-heading mb-4">Statistics</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-faculty-primary/10 p-3 rounded-lg"><CoursesIcon className="w-6 h-6 text-faculty-primary"/></div>
                                    <div>
                                        <p className="font-bold text-2xl text-heading">{studentEnrollments.length}</p>
                                        <p className="text-sm text-content">Enrolled Courses</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-faculty-primary/10 p-3 rounded-lg"><CheckCircleIcon className="w-6 h-6 text-faculty-primary"/></div>
                                    <div>
                                        <p className="font-bold text-2xl text-heading">{completedCoursesCount}</p>
                                        <p className="text-sm text-content">Courses Completed</p>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-4">
                                    <div className="bg-faculty-primary/10 p-3 rounded-lg"><DocumentTextIcon className="w-6 h-6 text-faculty-primary"/></div>
                                    <div>
                                        <p className="font-bold text-2xl text-heading">{totalAssignmentsSubmitted}</p>
                                        <p className="text-sm text-content">Items Submitted</p>
                                    </div>
                                </div>
                            </div>
                         </motion.div>
                    </div>
                </div>

                {/* Right Content Column */}
                <div className="lg:col-span-8 xl:col-span-9">
                    <h2 className="text-2xl font-bold text-heading mb-4">Course Enrollments</h2>
                     <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {studentEnrollments.length > 0 ? studentEnrollments.map(enrollment => (
                            <motion.div key={enrollment.course.id} variants={itemVariants} className="bg-white rounded-xl border border-border overflow-hidden">
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row gap-5">
                                        <img src={enrollment.course.imageUrl} alt={enrollment.course.title} className="w-full sm:w-32 h-20 object-cover rounded-lg flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-lg text-heading leading-tight">{enrollment.course.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-content mt-1">
                                                <CalendarIcon className="w-3 h-3"/>
                                                <span>Enrolled: {enrollment.enrollmentDate}</span>
                                            </div>
                                            <div className="mt-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-semibold text-heading">Course Progress</span>
                                                    <span className="text-sm font-bold text-faculty-primary">{enrollment.progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2"><motion.div className="bg-faculty-primary h-2 rounded-full" initial={{width:0}} animate={{width: `${enrollment.progress}%`}} transition={{duration: 1, ease:'easeOut'}}></motion.div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <details className="group">
                                    <summary className="list-none flex items-center justify-between p-3 bg-slate-50 border-t border-border cursor-pointer hover:bg-slate-100">
                                        <h4 className="font-semibold text-heading text-sm">Graded Items</h4>
                                        <ChevronDownIcon className="w-5 h-5 text-content transition-transform duration-200 group-open:rotate-180" />
                                    </summary>
                                    <div className="p-4 border-t border-border">
                                        <div className="space-y-3">
                                            {enrollment.submissions.map(sub => {
                                                const [sIdx, iIdx] = sub.itemId.split('-').map(Number);
                                                const assignmentTitle = enrollment.course.content[sIdx]?.items[iIdx]?.title || "Assignment";
                                                return (
                                                    <div key={sub.itemId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-100 p-3 rounded-lg border text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <DocumentTextIcon className="w-5 h-5 text-content flex-shrink-0" />
                                                            <div>
                                                                <p className="font-medium text-heading">{assignmentTitle}</p>
                                                                <p className="text-xs text-content">Submitted on {sub.submissionDate}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center">
                                                             {sub.grade !== undefined && <span className="font-bold text-lg">{sub.grade}/10</span>}
                                                            <button onClick={() => setGradingItem({type: 'assignment', studentId: student.id, course: enrollment.course, itemId: sub.itemId, submission: sub})} className="font-semibold text-faculty-primary hover:underline text-sm bg-faculty-primary/10 px-3 py-1.5 rounded-md">
                                                                {sub.grade !== undefined ? 'Edit Grade' : 'Grade'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {enrollment.submissions.length === 0 && (
                                                <p className="text-sm text-content text-center py-4">No assignments submitted for this course.</p>
                                            )}
                                        </div>
                                    </div>
                                </details>
                            </motion.div>
                        )) : (
                            <motion.div variants={itemVariants} className="text-center py-16 bg-white border-2 border-dashed border-border rounded-xl">
                                <CoursesIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-heading">No Enrollments Found</h2>
                                <p className="text-content mt-2">This student is not enrolled in any of your courses.</p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.div>
        <AnimatePresence>
            {gradingItem && (
                <GradeAssignmentModal
                    item={gradingItem}
                    studentIdFromUrl={studentId!}
                    onClose={() => setGradingItem(null)}
                    onSave={async (studentUserId, courseId, itemId, grade, feedback) => {
                        try {
                            console.log('🎓 Submitting grade:', {
                                userId: studentUserId,
                                courseId,
                                submissionType: 'assignment',
                                itemId,
                                grade,
                                feedback
                            });

                            // Submit grade to backend
                            await facultyService.gradeSubmission({
                                userId: studentUserId,
                                courseId: courseId,
                                submissionType: 'assignment',
                                itemId: itemId,
                                grade,
                                feedback
                            });

                            console.log('✅ Grade submitted successfully');

                            // Refresh student data to show updated grade
                            const updatedProfile = await userService.getUserProfile(studentUserId);
                            setStudent(updatedProfile);

                            setGradingItem(null);
                        } catch (err) {
                            const errorMessage = handleError(err);
                            console.error('❌ Failed to submit grade:', errorMessage, err);
                            alert(`Failed to submit grade: ${errorMessage}`);
                        }
                    }}
                />
            )}
        </AnimatePresence>
        </>
    );
};

const GradeAssignmentModal: React.FC<{
    item: GradingItem,
    studentIdFromUrl: string,
    onClose: () => void,
    onSave: (studentUserId: string, courseId: string, itemId: string, grade: number, feedback: string) => void,
}> = ({ item, studentIdFromUrl, onClose, onSave }) => {
    const [grade, setGrade] = useState<number | ''>(item.submission.grade ?? '');
    const [feedback, setFeedback] = useState(item.submission.feedback ?? '');

    const handleSubmit = () => {
        if (grade === '' || grade < 0 || grade > 10) return;
        const itemId = item.itemId!;
        
        // Use studentIdFromUrl directly (it's already a string from URL params)
        const studentUserId = studentIdFromUrl;
        
        // Get course ID - handle both _id (string) and id (number)
        const courseIdStr = (item.course._id || item.course.id)?.toString() || '';
        
        console.log('📝 Preparing grade submission:', {
            studentUserId,
            courseIdStr,
            itemId,
            grade: Number(grade)
        });
        
        onSave(studentUserId, courseIdStr, itemId, Number(grade), feedback);
    };

    const title = useMemo(() => {
        if (item.type === 'assignment' && item.itemId) {
            const [sIdx, iIdx] = item.itemId.split('-').map(Number);
            return item.course.content[sIdx]?.items[iIdx]?.title;
        }
        return 'Assignment';
    }, [item]);

    return (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-heading">Grade Submission</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon /></button>
                </div>
                
                <div className="bg-slate-50 border border-border p-4 rounded-lg mb-4">
                    <p className="font-semibold text-heading">{title}</p>
                    {item.type === 'project' ? (
                        <div className="space-y-2 mt-2 text-sm">
                            <p className="text-content whitespace-pre-line">{item.submission.projectDescription}</p>
                            <p><strong>GitHub:</strong> <a href={item.submission.githubUrl} target="_blank" rel="noopener noreferrer" className="text-faculty-primary hover:underline break-all">{item.submission.githubUrl}</a></p>
                            {item.submission.liveUrl && <p><strong>Live URL:</strong> <a href={item.submission.liveUrl} target="_blank" rel="noopener noreferrer" className="text-faculty-primary hover:underline break-all">{item.submission.liveUrl}</a></p>}
                        </div>
                    ) : (
                        <a href={item.submission.submissionLink} target="_blank" rel="noopener noreferrer" className="text-sm text-faculty-primary hover:underline break-all">
                            View Submission Link
                        </a>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Grade (0-10)</label>
                        <input
                            type="number"
                            value={grade}
                            onChange={e => setGrade(e.target.value === '' ? '' : Math.max(0, Math.min(10, parseInt(e.target.value, 10))))}
                            min="0"
                            max="10"
                            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md focus:ring-2 focus:ring-faculty-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Feedback</label>
                        <textarea
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            rows={4}
                            placeholder="Provide constructive feedback for the student..."
                            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md focus:ring-2 focus:ring-faculty-primary focus:outline-none"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} className="bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg">Save Grade</button>
                </div>
            </motion.div>
        </motion.div>
    );
};


export default FacultyStudentDetail;