import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppCourse } from '../../App';
// FIX: Import `calculateProgress` to fix incorrect access to `enrollment.progress`.
import { User, calculateProgress } from '../../types';
import { StudentsIcon, SearchIcon, ChevronDownIcon, CoursesIcon } from '../../components/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../src/hooks/useAuth';
import courseService from '../../src/services/course.service';
import facultyService from '../../src/services/faculty.service';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

type EnrollmentInfo = {
    student: User;
    course: AppCourse;
    progress: number;
    enrollmentDate: string;
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement }> = ({ title, value, icon }) => (
  <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-border">
    <div className="flex items-start justify-between">
        <div className="bg-faculty-primary/10 p-3 rounded-lg">{icon}</div>
        <p className="text-3xl font-bold text-heading">{value}</p>
    </div>
    <p className="text-md font-semibold text-heading mt-4">{title}</p>
  </motion.div>
);

const FacultyStudents: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string | 'all'>('all');
    const [courses, setCourses] = useState<AppCourse[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch faculty courses and students
    useEffect(() => {
        const fetchData = async () => {
            if (!user || user.role !== 'faculty') {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                
                const userId = user._id || user.id;
                console.log('📚 Fetching faculty courses and students for:', userId);
                
                // Fetch faculty courses
                const fetchedCourses = await courseService.getCoursesByFaculty(userId);
                console.log('✅ Fetched courses:', fetchedCourses);
                setCourses(fetchedCourses as any);
                
                // Fetch students enrolled in faculty courses
                const enrolledStudents = await facultyService.getEnrolledStudents(userId);
                console.log('✅ Fetched enrolled students:', enrolledStudents);
                setAllUsers(enrolledStudents as any);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                // Set empty arrays on error to prevent crash
                setCourses([]);
                setAllUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const facultyCourses = courses;
    const studentUsers = useMemo(() => allUsers.filter(u => u.role === 'student'), [allUsers]);

    const enrollmentList = useMemo((): EnrollmentInfo[] => {
        const list: EnrollmentInfo[] = [];
        // Handle both _id and id fields from backend
        const facultyCourseIds = new Set(facultyCourses.map(c => c._id || c.id));

        studentUsers.forEach(student => {
            student.enrollments?.forEach(enrollment => {
                const enrollmentCourseId = typeof enrollment.courseId === 'string' 
                    ? enrollment.courseId 
                    : (enrollment.courseId as any)?._id || (enrollment.courseId as any)?.toString();
                
                if (facultyCourseIds.has(enrollmentCourseId)) {
                    const course = facultyCourses.find(c => 
                        (c._id || c.id) === enrollmentCourseId
                    );
                    if (course) {
                        list.push({
                            student,
                            course,
                            // FIX: The `progress` property does not exist on type 'Enrollment'. Use `calculateProgress` instead.
                            progress: calculateProgress(course, enrollment),
                            enrollmentDate: enrollment.enrollmentDate,
                        });
                    }
                }
            });
        });
        console.log('📊 Enrollment list created:', list.length, 'enrollments');
        return list;
    }, [facultyCourses, studentUsers]);

    const uniqueStudentList = useMemo(() => {
        const studentMap = new Map<string, { student: User, courseCount: number }>();
        
        let listToProcess = enrollmentList;

        if (selectedCourseId !== 'all') {
            listToProcess = enrollmentList.filter(e => 
                (e.course._id || e.course.id) === selectedCourseId
            );
        }

        listToProcess.forEach(e => {
            const studentId = (e.student._id || e.student.id || '').toString();
            if (studentMap.has(studentId)) {
                studentMap.get(studentId)!.courseCount++;
            } else {
                studentMap.set(studentId, { student: e.student, courseCount: 1 });
            }
        });
        return Array.from(studentMap.values());
    }, [enrollmentList, selectedCourseId]);
    
    const filteredStudents = useMemo(() => {
        return uniqueStudentList.filter(({ student }) => {
            return searchTerm.trim() === '' || 
                   student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   student.email.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [uniqueStudentList, searchTerm]);

    const totalEnrollments = enrollmentList.length;

    return (
        <>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <h1 className="text-4xl font-bold text-heading mb-2">My Students</h1>
                <p className="text-lg text-content mb-8">View progress for students enrolled in your courses.</p>
                
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Unique Students" value={uniqueStudentList.length} icon={<StudentsIcon className="w-6 h-6 text-faculty-primary" />} />
                    <StatCard title="Total Enrollments" value={totalEnrollments} icon={<StudentsIcon className="w-6 h-6 text-faculty-primary" />} />
                    <StatCard title="Courses Taught" value={facultyCourses.length} icon={<CoursesIcon className="w-6 h-6 text-faculty-primary" />} />
                </motion.div>

                <div className="bg-white p-6 rounded-xl border border-border">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-heading">Student Roster</h2>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:max-w-xs">
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-faculty-primary focus:outline-none"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="text-gray-400" /></div>
                            </div>
                            <div className="relative w-full sm:w-48">
                                <select 
                                    value={selectedCourseId} 
                                    onChange={e => setSelectedCourseId(e.target.value)}
                                    className="appearance-none w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm text-heading focus:ring-2 focus:ring-faculty-primary focus:outline-none"
                                >
                                    <option key="all" value="all">All Courses</option>
                                    {facultyCourses.map(course => {
                                        const courseId = course._id || course.id;
                                        return <option key={courseId} value={courseId}>{course.title}</option>;
                                    })}
                                </select>
                                 <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <ChevronDownIcon className="w-4 h-4 text-content"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-4 text-left text-xs font-medium text-content uppercase tracking-wider">Student</th>
                                    <th className="p-4 text-left text-xs font-medium text-content uppercase tracking-wider">Email</th>
                                    <th className="p-4 text-left text-xs font-medium text-content uppercase tracking-wider">Enrolled Courses</th>
                                    <th className="p-4 text-right text-xs font-medium text-content uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <motion.tbody variants={containerVariants} initial="hidden" animate="visible" className="bg-white divide-y divide-border">
                                {filteredStudents.map(({ student, courseCount }) => (
                                    <motion.tr key={student.id} variants={itemVariants}>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img className="h-10 w-10 rounded-full object-cover" src={student.profilePicture} alt={student.fullName} />
                                                <div className="ml-4 font-medium text-heading text-sm">{student.fullName}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-sm text-content">
                                            <a href={`mailto:${student.email}`} className="hover:text-faculty-primary">{student.email}</a>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-sm text-content font-medium text-center">{courseCount}</td>
                                        <td className="p-4 whitespace-nowrap text-right text-sm">
                                            <Link to={`/faculty/students/${student._id || student.id}`} className="font-semibold text-faculty-primary hover:underline">
                                                Manage Student
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>

                    {filteredStudents.length === 0 && (
                        <div className="text-center py-12">
                            <h3 className="font-bold text-heading">No Students Found</h3>
                            <p className="text-content mt-1">Try adjusting your search or course filter.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
};

export default FacultyStudents;