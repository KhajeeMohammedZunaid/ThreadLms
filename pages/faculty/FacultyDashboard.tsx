
import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AppCourse } from '../../App';
import { StudentsIcon, StarIcon, CoursesIcon } from '../../components/icons';
import { useAuth } from '../../src/hooks/useAuth';
import courseService from '../../src/services/course.service';
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

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement; note?: string }> = ({ title, value, icon, note }) => (
  <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-border">
    <div className="flex items-start justify-between">
        <div className="bg-faculty-primary/10 p-3 rounded-lg">{icon}</div>
        <p className="text-3xl font-bold text-heading">{value}</p>
    </div>
    <p className="text-md font-semibold text-heading mt-4">{title}</p>
    {note && <p className="text-sm text-content mt-1">{note}</p>}
  </motion.div>
);

const CourseRow: React.FC<{ course: AppCourse }> = ({ course }) => (
    <motion.tr variants={itemVariants}>
        <td className="p-4 whitespace-nowrap">
            <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                    <img className="h-10 w-10 rounded-md object-cover" src={course.imageUrl} alt={course.title} />
                </div>
                <div className="ml-4">
                    <div className="text-sm font-medium text-heading">{course.title}</div>
                    <div className="text-sm text-content">{course.category}</div>
                </div>
            </div>
        </td>
        <td className="p-4 whitespace-nowrap text-sm text-content">{course.students.toLocaleString()}</td>
        <td className="p-4 whitespace-nowrap text-right text-sm font-medium">
            <Link to={`/faculty/courses/${course.id}/edit`} className="text-faculty-primary hover:text-faculty-primary-dark">Manage</Link>
        </td>
    </motion.tr>
);

const FacultyDashboard: React.FC = () => {
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
                    _id: course._id, // Store original _id
                    title: course.title,
                    subtitle: course.description.substring(0, 100),
                    description: course.description,
                    imageUrl: course.imageUrl || '',
                    students: course.totalStudents || 0,
                    rating: course.rating || 0,
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
    
    const totalStudents = useMemo(() => facultyCourses.reduce((sum, course) => sum + course.students, 0), [facultyCourses]);
    const popularCourses = useMemo(() => [...facultyCourses].sort((a, b) => b.students - a.students).slice(0, 5), [facultyCourses]);

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
      
      <h1 className="text-4xl font-bold text-heading mb-2">Faculty Dashboard</h1>
      <p className="text-lg text-content mb-10">Here's a summary of your teaching activity.</p>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-faculty-primary"></div>
        </div>
      ) : (
        <>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <StatCard title="Total Courses" value={String(facultyCourses.length)} icon={<CoursesIcon className="w-6 h-6 text-faculty-primary" />} />
            <StatCard title="Total Students" value={totalStudents.toLocaleString()} icon={<StudentsIcon className="w-6 h-6 text-faculty-primary" />} note="Enrolled across all courses" />
          </motion.div>      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <h2 className="text-2xl font-bold text-heading mb-6">Popular Courses</h2>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="p-4 text-left text-xs font-medium text-content uppercase tracking-wider">Course</th>
                            <th scope="col" className="p-4 text-left text-xs font-medium text-content uppercase tracking-wider">Students</th>
                            <th scope="col" className="relative p-4"><span className="sr-only">Manage</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                        {popularCourses.map(course => <CourseRow key={course.id} course={course} />)}
                    </tbody>
                </table>
            </div>
        </div>
      </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default FacultyDashboard;