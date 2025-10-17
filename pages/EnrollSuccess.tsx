
import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppCourse } from '../App';
import { CheckCircleIcon, StarIcon } from '../components/icons';
import courseService from '../src/services/course.service';
import { handleError } from '../src/utils/errorHandler';

const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  in: { opacity: 1, scale: 1 },
  out: { opacity: 0, scale: 0.95 },
};

// FIX: Add 'as const' to correctly type the transition for framer-motion.
const pageTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
} as const;

const ConfettiPiece: React.FC<{ initialX: number; rotation: number; color: string; delay: number }> = ({ initialX, rotation, color, delay }) => {
    const duration = Math.random() * 2 + 3; // 3 to 5 seconds
    const xDrift = (Math.random() - 0.5) * 200;

    return (
        <motion.div
            className="absolute w-2 h-4"
            style={{ left: `${initialX}%`, top: '-5%', backgroundColor: color }}
            initial={{ y: 0, x: 0, rotate: rotation, opacity: 1 }}
            animate={{
                y: window.innerHeight + 50,
                x: xDrift,
                rotate: rotation + (Math.random() > 0.5 ? 1 : -1) * 720,
                opacity: [1, 1, 0]
            }}
            transition={{
                duration,
                delay,
                ease: 'linear',
                opacity: {
                    duration,
                    times: [0, 0.9, 1]
                }
            }}
        />
    );
};

const confettiColors = ['#6366f1', '#818cf8', '#a5b4fc', '#14b8a6', '#5eead4'];
const confettiPieces = Array.from({ length: 150 }).map((_, i) => ({
    id: i,
    initialX: Math.random() * 100,
    rotation: Math.random() * 360,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    delay: Math.random() * 1.5,
}));


const SuggestedCourseCard: React.FC<{ course: AppCourse }> = ({ course }) => (
    <Link to={`/courses/${course.id}`} className="block">
        <motion.div
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
            className="bg-white p-4 rounded-lg border border-border flex items-center gap-4 h-full"
        >
            <img src={course.imageUrl} alt={course.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
            <div className="flex-1">
                <h3 className="font-bold text-heading text-sm leading-tight">{course.title}</h3>
                {/* FIX: Property 'name' does not exist on type 'Faculty'. Changed to 'fullName'. */}
                <p className="text-xs text-content mt-1">by {course.author.fullName}</p>
                 <div className="flex items-center gap-1 text-xs text-content mt-2">
                    <StarIcon className="w-3 h-3 text-yellow-400" />
                    <span>{course.rating}</span>
                </div>
            </div>
        </motion.div>
    </Link>
)

const EnrollSuccess: React.FC = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState<AppCourse | null>(null);
    const [suggestedCourses, setSuggestedCourses] = useState<AppCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            if (!courseId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch the enrolled course
                const enrolledCourse = await courseService.getCourseById(courseId);
                
                // Fetch all courses for suggestions
                const allCourses = await courseService.getAllCourses();
                
                // Map enrolled course to AppCourse format
                const backendCourse = enrolledCourse as any;
                const mappedCourse = {
                    id: courseId,
                    _id: backendCourse._id,
                    title: backendCourse.title,
                    subtitle: backendCourse.subtitle || '',
                    description: backendCourse.description || '',
                    imageUrl: backendCourse.imageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Course+Image',
                    previewUrl: backendCourse.previewUrl || 'https://placehold.co/800x450/e2e8f0/64748b?text=Course+Preview',
                    rating: backendCourse.rating || 0,
                    reviews: backendCourse.reviews || 0,
                    students: backendCourse.students || 0,
                    duration: backendCourse.duration || '0h',
                    lessons: backendCourse.lessons || 0,
                    category: backendCourse.category || 'Computer Science',
                    branch: backendCourse.branch || 'Computer Science',
                    difficulty: backendCourse.difficulty || 'Intermediate',
                    bestseller: backendCourse.bestseller || false,
                    author: {
                        id: backendCourse.authorId?._id || backendCourse.authorId || '',
                        fullName: backendCourse.authorId?.fullName || 'Instructor',
                        profilePicture: backendCourse.authorId?.profilePicture || 'https://placehold.co/150/e2e8f0/64748b?text=User',
                        title: backendCourse.authorId?.title || 'Instructor',
                        bio: backendCourse.authorId?.bio || '',
                        rating: backendCourse.authorId?.rating || 0
                    },
                    isEnrolled: true
                } as any;
                
                setCourse(mappedCourse);
                
                // Map suggested courses with author information
                const suggested = (allCourses as any[])
                    .filter(c => c._id !== enrolledCourse._id)
                    .slice(0, 2)
                    .map((c: any) => ({
                        id: c._id,
                        _id: c._id,
                        title: c.title,
                        subtitle: c.subtitle || '',
                        imageUrl: c.imageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Course+Image',
                        rating: c.rating || 0,
                        reviews: c.reviews || 0,
                        students: c.students || 0,
                        author: {
                            id: c.authorId?._id || c.authorId || '',
                            fullName: c.authorId?.fullName || 'Instructor',
                            profilePicture: c.authorId?.profilePicture || 'https://placehold.co/150/e2e8f0/64748b?text=User',
                            title: c.authorId?.title || 'Instructor',
                            bio: c.authorId?.bio || '',
                            rating: c.authorId?.rating || 0
                        }
                    }));
                
                setSuggestedCourses(suggested);
            } catch (err) {
                console.error('❌ Error fetching course details:', err);
                setError(handleError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [courseId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !course) {
        return <Navigate to="/courses" replace />;
    }

    return (
        <div className="relative min-h-full flex items-center justify-center py-10 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                {confettiPieces.map(p => <ConfettiPiece key={p.id} {...p} />)}
            </div>
            <motion.div 
                initial="initial" 
                animate="in" 
                exit="out" 
                variants={pageVariants} 
                transition={pageTransition}
                className="relative z-10 flex flex-col items-center justify-center text-center"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                    className="bg-white/80 backdrop-blur-sm p-8 sm:p-10 rounded-2xl shadow-2xl border border-border max-w-2xl w-full"
                >
                    <CheckCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-heading mb-3">You're In!</h1>
                    <p className="text-content mb-8 max-w-md mx-auto">
                        You have successfully enrolled in <strong>"{course.title}"</strong>. Happy learning!
                    </p>

                    <div className="bg-slate-50 border border-border rounded-lg p-4 mb-8">
                         <h2 className="font-bold text-heading mb-4">What's Next?</h2>
                         <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to={`/courses/${course.id}`} className="flex-1">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg transition-colors duration-200"
                                >
                                    Start Learning Now
                                </motion.button>
                            </Link>
                            <Link to="/courses" className="flex-1">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-6 rounded-lg transition-colors duration-200"
                                >
                                   Explore Other Courses
                                </motion.button>
                            </Link>
                        </div>
                    </div>

                    {suggestedCourses.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-heading mb-4">You might also like...</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                {suggestedCourses.map(sc => <SuggestedCourseCard key={sc.id} course={sc} />)}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default EnrollSuccess;