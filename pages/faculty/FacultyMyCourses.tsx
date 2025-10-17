



import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AppCourse } from '../../App';
// FIX: Import 'Course' from the correct file where it is defined.
import { Course } from '../../types';
// FIX: Import 'CoursesIcon' to fix usage error.
import { PlusCircleIcon, StarIcon, StudentsIcon, LessonsIcon, PencilAltIcon, CoursesIcon } from '../../components/icons';
import { useAuth } from '../../src/hooks/useAuth';
import courseService from '../../src/services/course.service';
import { handleError } from '../../src/utils/errorHandler';const pageVariants = {
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

const CourseCard: React.FC<{ course: AppCourse }> = ({ course }) => {
    return (
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-full">
            <img src={course.imageUrl} alt={course.title} className="w-full h-44 object-cover" />
            <div className="p-5 flex flex-col flex-grow">
                <div>
                    <h3 className="font-bold text-lg text-heading mb-2 h-14 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-content mb-4 h-20 line-clamp-3">{course.description}</p>
                    <div className="flex justify-between items-center text-sm text-content border-t border-b border-border py-3 my-3">
                        <div className="flex items-center gap-1.5" title="Students Enrolled"><StudentsIcon className="w-4 h-4" /><span>{course.students.toLocaleString()}</span></div>
                        <div className="flex items-center gap-1.5" title="Total Lessons"><LessonsIcon className="w-4 h-4" /><span>{course.lessons}</span></div>
                        <div className="flex items-center gap-1.5" title="Category"><CoursesIcon className="w-4 h-4" /><span>{course.category}</span></div>
                    </div>
                </div>
                <div className="flex-grow"></div>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <Link to={`/faculty/courses/${course.id}/edit`}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-4 rounded-lg text-sm">
                            <PencilAltIcon /> Edit
                        </motion.button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};


const FacultyMyCourses: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<AppCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch faculty courses from backend
    useEffect(() => {
        const fetchFacultyCourses = async () => {
            if (!user || user.role !== 'faculty') {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                console.log('👨‍🏫 Fetching faculty courses...');
                const fetchedCourses = await courseService.getCoursesByFaculty(user._id);
                console.log('✅ Faculty courses fetched:', fetchedCourses);
                
                // Map to AppCourse format
                const mappedCourses = fetchedCourses.map(course => ({
                    id: course._id, // Keep as string (MongoDB ObjectId)
                    _id: course._id, // Also store _id for backend operations
                    title: course.title,
                    description: course.description,
                    imageUrl: course.imageUrl || '',
                    students: course.students || course.totalStudents || 0,
                    rating: course.rating || 0,
                    lessons: course.lessons || course.content?.reduce((acc, section) => acc + (section.items?.length || 0), 0) || 0,
                    category: course.category,
                    authorId: user._id
                } as unknown as AppCourse));
                
                setCourses(mappedCourses);
            } catch (err) {
                console.error('❌ Error fetching faculty courses:', err);
                setError(handleError(err));
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFacultyCourses();
    }, [user]);

    const facultyCourses = courses;

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-faculty-primary"></div>
            </div>
        );
    }

    return (
        <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div className="w-full sm:w-auto sm:flex-grow">
                    <h1 className="text-4xl font-bold text-heading mb-1">My Courses</h1>
                    <p className="text-content">Manage your existing courses or create a new one.</p>
                </div>
                <Link to="/faculty/courses/new">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center gap-2 bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg">
                        <PlusCircleIcon /> Create New Course
                    </motion.button>
                </Link>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-faculty-primary"></div>
                </div>
            ) : facultyCourses.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {facultyCourses.map(course => <CourseCard key={course.id} course={course} />)}
                </motion.div>
            ) : (
                <div className="text-center py-16 bg-white border-2 border-dashed border-border rounded-xl">
                    <CoursesIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-heading">You haven't created any courses yet.</h2>
                    <p className="text-content mt-2 mb-6">Let's get started by creating your first course!</p>
                    <Link to="/faculty/courses/new">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg">
                            Create a Course
                        </motion.button>
                    </Link>
                </div>
            )}
        </motion.div>
    );
};

export default FacultyMyCourses;