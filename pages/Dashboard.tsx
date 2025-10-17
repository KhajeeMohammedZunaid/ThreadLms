

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CoursesIcon, CheckCircleIcon, CertificateIcon, PlayIcon } from '../components/icons';
import { useAuth } from '../src/hooks/useAuth';
import courseService from '../src/services/course.service';
import userService from '../src/services/user.service';
import { handleError } from '../src/utils/errorHandler';
import ContributionGraph from '../components/ContributionGraph';

// Types
interface Course {
  _id?: string;
  id?: string;
  title: string;
  imageUrl: string;
  progress: number;
  isEnrolled: boolean;
  completedItems?: string[];
  content: Array<{
    items: Array<{
      title: string;
      duration: string;
    }>;
  }>;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

// FIX: Add 'as const' to correctly type the transition for framer-motion.
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

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement }> = ({ title, value, icon }) => (
  <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-border flex items-center">
    <div className="bg-primary/10 p-3 rounded-lg">
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-sm text-content">{title}</p>
      <p className="text-2xl font-bold text-heading">{value}</p>
    </div>
  </motion.div>
);

const ContinueLearningCard: React.FC<{ course: Course & { completedItems: string[] } }> = ({ course }) => {
    const findNextLesson = (c: Course & { completedItems: string[] }) => {
        const completed = c.completedItems || [];
        for (let sIndex = 0; sIndex < c.content.length; sIndex++) {
            const section = c.content[sIndex];
            for (let iIndex = 0; iIndex < section.items.length; iIndex++) {
                const item = section.items[iIndex];
                const itemId = `${sIndex}-${iIndex}`;
                if (!completed.includes(itemId)) {
                    return { title: item.title, duration: item.duration };
                }
            }
        }
        return null;
    }
    const nextLesson = findNextLesson(course);
    
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.1), 0 4px 6px -2px rgba(99, 102, 241, 0.08)" }}
            className="bg-white rounded-xl border border-border overflow-hidden flex flex-col sm:flex-row h-full group transition-shadow duration-300"
        >
            <img src={course.imageUrl} alt={course.title} className="w-full sm:w-48 h-32 sm:h-full object-cover"/>
            <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider">Continue Learning</p>
                    <h3 className="font-bold text-heading mt-1 text-lg leading-tight group-hover:text-primary transition-colors">{course.title}</h3>
                    {nextLesson && (
                        <div className="text-sm text-content mt-2 flex items-center gap-2">
                            <PlayIcon className="w-4 h-4 text-slate-400" />
                            <div>
                                <span className="font-semibold text-heading">Next up:</span> {nextLesson.title} ({nextLesson.duration})
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-heading">Progress</span>
                        <span className="text-sm font-bold text-primary">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                        className="bg-primary h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface DashboardProps {
  courses?: Course[];  // Optional for backward compatibility
  profileData?: any;  // Optional
  lastUpdateTime?: Date;  // Optional
}


const Dashboard: React.FC<DashboardProps> = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [profileData, setProfileData] = useState<any>(null);
    const [certificatesCount, setCertificatesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastUpdateTime = new Date();

    // Get time-based background image based on IST
    const getTimeBasedBackground = () => {
        // Get current time in IST (UTC + 5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const istTime = new Date(now.getTime() + istOffset);
        const hour = istTime.getUTCHours();

        // Determine time period based on IST hour
        // Morning: 5 AM - 12 PM (5-11)
        // Afternoon: 12 PM - 5 PM (12-16)
        // Evening: 5 PM - 8 PM (17-19)
        // Night: 8 PM - 5 AM (20-4)
        
        if (hour >= 5 && hour < 12) {
            return '/morningrey.svg';
        } else if (hour >= 12 && hour < 17) {
            return '/afternoon.jpg';
        } else if (hour >= 17 && hour < 20) {
            return '/evening.jpg';
        } else {
            return '/night.jpg';
        }
    };

    const backgroundImage = getTimeBasedBackground();

    // Log when component mounts
    useEffect(() => {
        return () => {};
    }, []);

    // Fetch courses and profile data from backend
    useEffect(() => {
        const userId = user?._id || user?.id;
        
        const fetchDashboardData = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                // Fetch all courses
                const allCourses = await courseService.getAllCourses();
                
                // Get enrollments from user context (already loaded)
                const enrollments = user.enrollments || [];
                
                // Count actual certificates from USER level (not enrollment level)
                const userCertificates = user.certificates || [];
                const totalCertificates = userCertificates.length;
                setCertificatesCount(totalCertificates);
                
                // Fetch user profile for additional info
                let profile = null;
                try {
                    profile = await userService.getUserProfile(userId);
                    setProfileData(profile);
                } catch (profileErr) {
                    console.error('Failed to fetch profile:', profileErr);
                    // Will use fallback user data
                }
                
                // Ensure allCourses is an array
                if (!Array.isArray(allCourses)) {
                    setCourses([]);
                    return;
                }
                
                // Enrich courses with enrollment data from user context
                const enrichedCourses = allCourses.map((course: any) => {
                    const enrollment = enrollments.find((e: any) => {
                        const enrollmentCourseId = typeof e.courseId === 'string' 
                            ? e.courseId 
                            : e.courseId?._id;
                        const courseIdToMatch = course._id || course.id;
                        return enrollmentCourseId === courseIdToMatch;
                    });
                    
                    if (enrollment) {
                        const completedItems = enrollment.completedItems || [];
                        const totalItems = course.content?.reduce((sum: number, section: any) => 
                            sum + (section.items?.length || 0), 0
                        ) || 0;
                        const progress = totalItems > 0 
                            ? Math.round((completedItems.length / totalItems) * 100) 
                            : 0;
                        
                        return {
                            ...course,
                            id: course._id || course.id,
                            isEnrolled: true,
                            progress,
                            completedItems
                        };
                    }
                    
                    return {
                        ...course,
                        id: course._id || course.id,
                        isEnrolled: false,
                        progress: 0,
                        completedItems: []
                    };
                });
                
                setCourses(enrichedCourses);
            } catch (err) {
                console.error('❌ Failed to fetch dashboard data:', err);
                setError(handleError(err));
                // Set empty courses on error to prevent crash
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?._id, user?.id, user?.enrollments, user?.certificates]);

    const coursesInProgress = courses.filter(c => c.isEnrolled && c.progress > 0 && c.progress < 100);
    const completedCourses = courses.filter(c => c.progress === 100);
    const enrolledCoursesCount = courses.filter(c => c.isEnrolled).length;
    
    const formattedDate = lastUpdateTime.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedTime = lastUpdateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return null; // User will be redirected by auth logic
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm max-w-md mx-auto">
                    {error}
                </div>
                <button 
                    onClick={() => window.location.reload()} 
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Use user data as fallback if profileData is not loaded yet
    const displayData = profileData || user;

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-4xl font-bold text-heading mb-2">Welcome back, {displayData.firstName}!</h1>
          <p className="text-lg text-content mb-10">Ready to jump back in and learn something new?</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-border text-sm text-content shadow-sm whitespace-nowrap">
            Last Updated on <span className="font-semibold text-heading">{formattedDate}</span> | <span className="font-semibold text-heading">{formattedTime}</span>
        </div>
      </div>


      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Enrolled Courses" value={enrolledCoursesCount.toString()} icon={<CoursesIcon className="w-6 h-6 text-primary" />} />
        <StatCard title="Completed Courses" value={completedCourses.length.toString()} icon={<CheckCircleIcon className="w-6 h-6 text-primary" />} />
        <StatCard title="Certificates Earned" value={certificatesCount.toString()} icon={<CertificateIcon className="w-6 h-6 text-primary" />} />
      </motion.div>
      
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl border border-border mb-10 shadow-sm overflow-hidden"
      >
          <div 
            className="relative h-36 rounded-t-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
          </div>
          <div className="relative px-8 pb-8">
              <div className="absolute -top-16 left-8">
                  <div className="w-32 h-32 rounded-full bg-slate-100 border-8 border-white shadow-lg flex items-center justify-center overflow-hidden">
                       <img src={displayData.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  </div>
              </div>
              <div className="pt-24">
                  <h2 className="text-3xl font-bold text-heading">{displayData.fullName}</h2>
                  <p className="text-content mt-1">{displayData.email}</p>
                  <div className="mt-4 pt-4 border-t border-border text-sm text-content flex flex-wrap items-center gap-x-8 gap-y-2">
                      <span>Register Number: <strong className="text-heading font-semibold">{displayData.registerNumber || 'N/A'}</strong></span>
                      <span>Degree: <strong className="text-heading font-semibold">{displayData.degree || 'N/A'}</strong></span>
                      <span>Batch: <strong className="text-heading font-semibold">{displayData.batch || 'N/A'}</strong></span>
                      <span>College: <strong className="text-heading font-semibold">{displayData.college || 'N/A'}</strong></span>
                  </div>
              </div>
          </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-heading mb-6">Continue Where You Left Off</h2>
       {coursesInProgress.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {coursesInProgress.map(course => (
                    <Link to={`/courses/${course.id}`} key={course.id} className="block h-full">
                          <ContinueLearningCard course={course} />
                    </Link>
                ))}
            </motion.div>
        ) : (
            <motion.div 
                variants={itemVariants} 
                initial="hidden" 
                animate="visible" 
                className="text-center bg-white p-10 rounded-xl border border-border"
            >
                <h3 className="text-xl font-bold text-heading">Your learning journey awaits!</h3>
                <p className="text-content mt-2 mb-6 max-w-md mx-auto">You haven't enrolled in any courses yet. Once you enroll, you'll see your progress right here.</p>
                <Link to="/courses">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200"
                    >
                        Explore Courses
                    </motion.button>
                </Link>
            </motion.div>
        )}
        <ContributionGraph lastUpdateTime={lastUpdateTime} />
    </motion.div>
  );
};

export default Dashboard;
