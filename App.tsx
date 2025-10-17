

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import IDE from './pages/IDE';
import Accomplishments from './pages/Accomplishments';
import Grades from './pages/Grades';
import CourseDetail from './pages/CourseDetail';
import EnrollSuccess from './pages/EnrollSuccess';
import Quiz from './pages/Quiz';
import ResumeBuilder from './pages/ResumeBuilder';
import Projects from './pages/Projects';
import MyProjects from './pages/MyProjects';
import SubmitProject from './pages/SubmitProject';
import Profile from './pages/Profile';
import Collaborate from './pages/Collaborate';
import PostCollaboration from './pages/PostCollaboration';
import Roadmap from './pages/Roadmap';
import StickyWall, { Note } from './pages/StickyWall';
import Newsletter from './pages/Newsletter';
import Login from './pages/Login';
import Register from './pages/Register';
import FinalTest from './pages/FinalTest';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyMyCourses from './pages/faculty/FacultyMyCourses';
import CourseEditor from './pages/faculty/CourseEditor';
import FacultySidebar from './components/FacultySidebar';
import FacultyDiscussions from './pages/faculty/FacultyDiscussions';
import FacultyProfile from './pages/faculty/FacultyProfile';
import QuizBuilder from './pages/faculty/QuizBuilder';
import FacultyStudents from './pages/faculty/FacultyStudents';
import FacultyStudentDetail from './pages/faculty/FacultyStudentDetail';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import FacultyNotifications from './pages/faculty/FacultyNotifications';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Jobs from './pages/Jobs';
import { MenuIcon, BellIcon, SettingsIcon, HelpIcon } from './components/icons';
// Import ONLY type definitions from data files (no mock data)
import { Course, DiscussionReply } from './types';
import { Project } from './types';
import { CollaborationPost } from './types';
import { User, Faculty, Enrollment, calculateProgress, Certificate, Notification } from './types';
import CourseCompletionModal from './components/CourseCompletionModal';
import { getBadgeForBranch } from './data/badges';
import { ResumeData } from './data/resume';
import AtsScoreModal from './components/AtsScoreModal';
import { GoogleGenAI, Type } from '@google/genai';
import { FullPageLoader } from './components/Loading';


export type AppCourse = Course & { 
  completedItems: string[];
  author: Faculty; // Author is now the full faculty object
  enrollment?: Enrollment;
};

// Layout Components moved outside 'App' to prevent re-renders on state change
const StudentLayout: React.FC<{
  profileData: User;
  handleLogout: () => void;
  triggerAtsAnalysis: (resumeText: string, jobTitle: string) => void;
}> = ({ profileData, handleLogout, triggerAtsAnalysis }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadCount = useMemo(() => profileData.notifications?.filter(n => !n.isRead).length || 0, [profileData.notifications]);

    const getPageTitle = (pathname: string): string => {
        const pathSegments = pathname.split('/').filter(Boolean);
        const mainPath = pathSegments[0];
        
        if (pathSegments.length === 0) return 'Dashboard';
        if (mainPath === 'courses' && pathSegments.length > 1) return courseIdToTitleMap[pathSegments[1]] || 'Course Details';
        if (mainPath === 'my-projects') return 'My Projects';
        if (mainPath === 'resume-builder') return 'Resume Builder';
        if (mainPath === 'sticky-wall') return 'Sticky Wall';
        if (mainPath === 'enroll-success') return 'Enrollment Successful';
        
        const title = mainPath.replace(/-/g, ' ');
        return title.charAt(0).toUpperCase() + title.slice(1);
    };

    const courseIdToTitleMap = useMemo(() => {
        const map: { [key: string]: string } = {};
        // You would fetch or have access to your courses data here
        // For now, let's assume it's available or we just return a generic title
        return map;
    }, []);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen bg-light-bg text-slate-600">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} profileData={profileData} handleLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* NEW HEADER - Hidden on IDE page */}
        {location.pathname !== '/ide' && (
          <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-border flex items-center justify-between h-20 px-6 lg:px-10">
              <div className="flex items-center gap-4">
                   <button
                      aria-label="Open sidebar"
                      className="lg:hidden text-slate-800 -ml-2"
                      onClick={() => setSidebarOpen(true)}
                  > <MenuIcon /> </button>
                  <AnimatePresence mode="wait">
                      <motion.h1 
                          key={pageTitle}
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ duration: 0.3 }} 
                          className="text-2xl font-bold text-heading hidden sm:block"
                      >
                          {pageTitle}
                      </motion.h1>
                  </AnimatePresence>
              </div>
              <div className="flex items-center gap-4">
                   <button 
                      onClick={() => navigate('/help')} 
                      className="text-slate-500 hover:text-primary transition-colors"
                      aria-label="Help"
                   >
                      <HelpIcon className="w-6 h-6" />
                  </button>
                   <button 
                      onClick={() => navigate('/settings')} 
                      className="text-slate-500 hover:text-primary transition-colors"
                      aria-label="Settings"
                   >
                      <SettingsIcon className="w-6 h-6" />
                  </button>
                   <button 
                      onClick={() => navigate('/notifications')} 
                      className="relative text-slate-500 hover:text-primary transition-colors"
                      aria-label={`View notifications (${unreadCount} unread)`}
                   >
                      <BellIcon className="w-6 h-6" />
                      {unreadCount > 0 && (
                          <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white"
                          >
                              {unreadCount}
                          </motion.span>
                      )}
                  </button>
                  <Link to="/profile" className="block group">
                      <img src={profileData.profilePicture} alt="User Avatar" className="w-9 h-9 rounded-full ring-2 ring-transparent group-hover:ring-primary transition-all" />
                  </Link>
              </div>
          </header>
        )}

        <main className={`flex-1 overflow-y-auto ${location.pathname === '/ide' ? '' : 'p-6 lg:p-10'}`}>
          <AnimatePresence mode="wait">
            <Outlet context={{ triggerAtsAnalysis, profileData }} />
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
};

const FacultyLayout: React.FC<{
  facultyProfile: Faculty;
  handleLogout: () => void;
}> = ({ facultyProfile, handleLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadCount = useMemo(() => facultyProfile.notifications?.filter(n => !n.isRead).length || 0, [facultyProfile.notifications]);

  const getPageTitle = (pathname: string): string => {
    const pathSegments = pathname.split('/').filter(p => p !== 'faculty' && p !== '');
    const mainPath = pathSegments[0] || 'dashboard';
    
    if (mainPath === 'dashboard') return 'Dashboard';
    if (mainPath === 'courses' && pathSegments.length > 1) return 'Course Editor';
    if (mainPath === 'courses' && pathSegments.length === 1) return 'My Courses';
    
    const title = mainPath.replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  };
  
  const pageTitle = getPageTitle(location.pathname);

  return (
     <div className="flex h-screen bg-light-bg text-slate-600">
      <FacultySidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} profileData={facultyProfile} handleLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-border flex items-center justify-between h-20 px-6 lg:px-10">
            <div className="flex items-center gap-4">
                 <button
                    aria-label="Open sidebar"
                    className="lg:hidden text-slate-800 -ml-2"
                    onClick={() => setSidebarOpen(true)}
                > <MenuIcon /> </button>
                <AnimatePresence mode="wait">
                    <motion.h1 
                        key={pageTitle}
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.3 }} 
                        className="text-2xl font-bold text-heading hidden sm:block"
                    >
                        {pageTitle}
                    </motion.h1>
                </AnimatePresence>
            </div>
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => navigate('/faculty/help')} 
                    className="text-slate-500 hover:text-faculty-primary transition-colors"
                    aria-label="Help"
                 >
                    <HelpIcon className="w-6 h-6" />
                </button>
                 <button 
                    onClick={() => navigate('/faculty/settings')} 
                    className="text-slate-500 hover:text-faculty-primary transition-colors"
                    aria-label="Settings"
                 >
                    <SettingsIcon className="w-6 h-6" />
                </button>
                 <button 
                    onClick={() => navigate('/faculty/notifications')} 
                    className="relative text-slate-500 hover:text-faculty-primary transition-colors"
                    aria-label={`View notifications (${unreadCount} unread)`}
                 >
                    <BellIcon className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </button>
                <Link to="/faculty/profile" className="block group">
                    <img src={facultyProfile.profilePicture} alt="User Avatar" className="w-9 h-9 rounded-full ring-2 ring-transparent group-hover:ring-faculty-primary transition-all" />
                </Link>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <Outlet context={{ facultyProfile }} />
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

const ProtectedRoute: React.FC<{ 
  role: 'student' | 'faculty';
  currentUser: User | null;
  loading: boolean;
  handleLogout: () => void;
  profileData?: User | null;
  facultyUsers?: Faculty[];
  triggerAtsAnalysis?: (resumeText: string, jobTitle: string) => void;
}> = ({ role, currentUser, loading, handleLogout, profileData, facultyUsers, triggerAtsAnalysis }) => {
  // Show nothing while checking auth status (prevents redirect flash)
  if (loading) return null;
  
  // User not authenticated, redirect to login
  if (!currentUser) return <Navigate to="/login" replace />;
  
  // User authenticated but wrong role, redirect to correct dashboard
  if (currentUser.role !== role) return <Navigate to={currentUser.role === 'faculty' ? '/faculty' : '/'} replace />;

  if (role === 'student') {
      if (!triggerAtsAnalysis) return null; // Should not happen
      // Use currentUser directly if profileData not available (e.g., fresh login from backend)
      const userProfile = profileData || currentUser;
      return <StudentLayout profileData={userProfile} handleLogout={handleLogout} triggerAtsAnalysis={triggerAtsAnalysis} />;
  }
  
  // role is 'faculty'
  // For faculty, use currentUser directly if not found in facultyUsers array
  const facultyProfile = (facultyUsers?.find(f => f.id === currentUser?.id) || currentUser) as Faculty;
  return <FacultyLayout facultyProfile={facultyProfile} handleLogout={handleLogout} />;
};


const App: React.FC = () => {
  const { user: authUser, loading: authLoading, updateUser, logout: authLogout } = useAuth();
  // All data fetched from MongoDB - no mock data
  const [usersData, setUsersData] = useState<User[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborationPosts, setCollaborationPosts] = useState<CollaborationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [justCompletedCourseId, setJustCompletedCourseId] = useState<number | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [collaborationToJoin, setCollaborationToJoin] = useState<CollaborationPost | null>(null);
  
  const [profileToSave, setProfileToSave] = useState<User | null>(null);
  
  const [facultyUsers, setFacultyUsers] = useState<Faculty[]>([]);
  const [facultyProfileToSave, setFacultyProfileToSave] = useState<Faculty | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Use authUser from AuthContext
  const currentUser = authUser;

  const [atsAnalysisData, setAtsAnalysisData] = useState<{
    isLoading: boolean;
    result: { score: number; tips: string[] } | null;
    error: string | null;
    isModalOpen: boolean;
    analysisPayload: { resumeText: string; jobTitle: string } | null;
  }>({
    isLoading: false,
    result: null,
    error: null,
    isModalOpen: false,
    analysisPayload: null,
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch initial data from backend - no mock data
    setTimeout(() => {
        // Projects and collaborations will be fetched from backend services
        // For now, keep empty until backend endpoints are ready
        setProjects([]);
        setCollaborationPosts([]);
        setLoading(false);
    }, 1500);
  }, []);

  // Real-time user activity tracking
  useEffect(() => {
    const activityTracker = setInterval(() => {
        if (currentUser?.role === 'student') {
            // Use 'sv-SE' locale to get YYYY-MM-DD format, with IST timezone
            const todayIST = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
            
            try {
                const activityData = JSON.parse(localStorage.getItem('userActivityData') || '{}');
                const todaySeconds = activityData[todayIST] || 0;
                activityData[todayIST] = todaySeconds + 5; // Add 5 seconds for each interval
                localStorage.setItem('userActivityData', JSON.stringify(activityData));
                setLastUpdateTime(new Date()); // Trigger re-render for components that need it
            } catch (error) {
                console.error("Failed to update user activity data", error);
            }
        }
    }, 5000); // Run every 5 seconds

    return () => clearInterval(activityTracker);
  }, [currentUser]);

  // Check for unacknowledged course completions on user change or navigation
  useEffect(() => {
    if (currentUser?.role === 'student') {
        const student = usersData.find(u => u.id === currentUser.id);
        const unacknowledged = student?.enrollments?.find(e => {
            const course = allCourses.find(c => c.id === e.courseId);
            if (!course) return false;
            return calculateCourseProgress(course, e) === 100 && !e.completionAcknowledged;
        });
        if (unacknowledged) {
            setJustCompletedCourseId(unacknowledged.courseId);
        }
    }
  }, [currentUser, usersData, location, allCourses]);
  
  const handleRegister = (details: { fullName: string; email: string; password: string }): { success: boolean, message?: string } => {
    const { fullName, email, password } = details;

    const userExists = usersData.some(user => user.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
        return { success: false, message: 'An account with this email already exists.' };
    }

    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const newUser: User = {
        id: Date.now(),
        email,
        password,
        fullName,
        firstName: firstName || '',
        lastName: lastName || '',
        profilePicture: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzkyOTQ5NiI+PHBhdGggZD0iTTEyIDJDNi45MSAyIDIgNi45MSAyIDEyczQuOTEgMTAgMTAgMTAgMTAtNC45MSAxMC0xMFMxNy4wOSAyIDEyIDJ6bTAgNWMxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTRjLTIuNjcgMC01LTEuMjgtNi45LTMuMjkuMDQtMy4xMyA0LjM4LTUuMDIgNi45LTUuMDIgMi4xMiAwIDYuNDYgMS44OSA2LjUgNS4wMi0xLjUgMi4wMS0zLjgzIDMuMjgtNi41IDMuMjgiLz48L3N2Zz4=',
        role: 'student',
        enrollments: [],
        notes: [],
        notifications: [
            {
                id: `notif-${Date.now()}`,
                type: 'WELCOME',
                message: 'Welcome to ThreadLms! Explore courses and start your learning journey.',
                timestamp: new Date().toISOString(),
                isRead: false,
                link: '/courses',
            }
        ],
        aboutMe: 'I am a new student on the LMS Platform, excited to start learning!',
        phone: '',
        headline: 'New Student',
        registerNumber: '',
        degree: '',
        batch: '',
        college: '',
    };
    
    setUsersData(prev => [...prev, newUser]);
    handleLogin(newUser);

    return { success: true };
};

  const handleLogin = (user: User) => {
    updateUser(user);
    if (user.role === 'faculty') {
      navigate('/faculty');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  // Helper function to calculate course progress including final quiz
  const calculateCourseProgress = (course: Course, enrollment: Enrollment): number => {
    if (!enrollment || !course) return 0;
    
    // Count total content items
    const contentItems = course.content.reduce((total: number, section: any) => {
      return total + (section.items?.length || 0);
    }, 0);
    
    // Add final quiz if enabled
    const finalQuizCount = course.finalQuiz?.isEnabled ? 1 : 0;
    const totalItems = contentItems + finalQuizCount;
    
    if (totalItems === 0) return 0;
    
    const completedCount = enrollment.completedItems?.length || 0;
    return Math.min(100, Math.round((completedCount / totalItems) * 100));
  };

  const enrichedCourses: AppCourse[] = useMemo(() => {
    const baseCourses = allCourses.map(course => {
        const author = facultyUsers.find(f => f.id === course.authorId) || facultyUsers[0];
        return { ...course, author };
    });

    if (currentUser?.role === 'student') {
        const student = usersData.find(u => u.id === currentUser.id);
        if (!student) return baseCourses.map(c => ({ ...c, isEnrolled: false, progress: 0, completedItems: [], enrollment: undefined }));

        return baseCourses.map(course => {
            const enrollment = student.enrollments?.find(e => e.courseId === course.id);
            return {
                ...course,
                isEnrolled: !!enrollment,
                progress: enrollment ? calculateCourseProgress(course, enrollment) : 0,
                completedItems: enrollment?.completedItems || [],
                enrollment: enrollment,
            };
        });
    }

    return baseCourses.map(c => ({ ...c, progress: 0, completedItems: [], enrollment: undefined }));
  }, [currentUser, usersData, facultyUsers, allCourses]);


  const justCompletedCourse = useMemo(() => {
    if (justCompletedCourseId) {
        return enrichedCourses.find(c => c.id === justCompletedCourseId);
    }
    return null;
  }, [justCompletedCourseId, enrichedCourses]);

  const awardedBadge = useMemo(() => {
    if (justCompletedCourse?.progress === 100) {
        return getBadgeForBranch(justCompletedCourse.branch);
    }
    return undefined;
  }, [justCompletedCourse]);


  const handleRequestSaveProfile = (newProfileData: User) => {
    setProfileToSave(newProfileData);
  };

  const handleConfirmSaveProfile = () => {
    if (profileToSave) {
        setUsersData(prevUsers =>
            prevUsers.map(u =>
                u.id === profileToSave.id ? profileToSave : u
            )
        );
        if (currentUser?.id === profileToSave.id) {
            updateUser(profileToSave);
        }
    }
    setProfileToSave(null);
  };

  const handleRequestSaveFacultyProfile = (newProfileData: Faculty) => {
    setFacultyProfileToSave(newProfileData);
  };
  
  const handleConfirmSaveFacultyProfile = () => {
    if (facultyProfileToSave) {
        setFacultyUsers(prevFaculty =>
            prevFaculty.map(f =>
                f.id === facultyProfileToSave.id ? facultyProfileToSave : f
            )
        );
        if (currentUser?.id === facultyProfileToSave.id) {
            updateUser(facultyProfileToSave as User);
        }
    }
    setFacultyProfileToSave(null);
  };

  const handleEnroll = (courseId: number) => {
    if (!currentUser) return;
    setUsersData(prevUsers => {
      return prevUsers.map(user => {
        if (user.id === currentUser.id) {
          const newEnrollment: Omit<Enrollment, 'progress'> = {
            courseId,
            completedItems: [],
            enrollmentDate: new Date().toISOString().split('T')[0],
          };
          const enrollments = user.enrollments ? [...user.enrollments, newEnrollment] : [newEnrollment];
          return { ...user, enrollments };
        }
        return user;
      });
    });
  };

  const toggleCourseItemCompletion = (courseId: number, itemId: string) => {
    if (!currentUser) return;
    setUsersData(prevUsers => {
      return prevUsers.map(user => {
        if (user.id === currentUser.id) {
          const enrollments = user.enrollments?.map(e => {
            if (e.courseId === courseId) {
              const completedItems = e.completedItems.includes(itemId)
                ? e.completedItems.filter(id => id !== itemId)
                : [...e.completedItems, itemId];
              
              return { ...e, completedItems };
            }
            return e;
          });
          return { ...user, enrollments };
        }
        return user;
      });
    });
  };

  const handleSaveCourseNote = (courseId: number, itemId: string, noteContent: string) => {
      if (!currentUser) return;
      setUsersData(prevUsers => prevUsers.map(user => {
          if (user.id !== currentUser.id) return user;
          const enrollments = user.enrollments?.map(e => {
              if (e.courseId === courseId) {
                  const courseNotes = { ...(e.courseNotes || {}) };
                  if (noteContent.trim()) {
                      courseNotes[itemId] = noteContent;
                  } else {
                      delete courseNotes[itemId];
                  }
                  return { ...e, courseNotes };
              }
              return e;
          });
          return { ...user, enrollments };
      }));
  };
  
  const handleAssignmentSubmission = (courseId: number, itemId: string, submissionLink: string) => {
      if (!currentUser) return;
      setUsersData(prevUsers => prevUsers.map(user => {
          if (user.id !== currentUser.id) return user;
          const enrollments = user.enrollments?.map(e => {
              if (e.courseId === courseId) {
                  const newSubmission = { 
                      itemId, 
                      submissionLink, 
                      submissionDate: new Date().toLocaleDateString('en-GB')
                  };
                  const assignmentSubmissions = [...(e.assignmentSubmissions || []).filter(s => s.itemId !== itemId), newSubmission];
                  return { ...e, assignmentSubmissions };
              }
              return e;
          });
          return { ...user, enrollments };
      }));
      toggleCourseItemCompletion(courseId, itemId);
  };
  
  const handleQuizCompletion = (courseId: number, itemId: string, score: number) => {
      if (!currentUser) return;
      setUsersData(prevUsers => prevUsers.map(user => {
          if (user.id !== currentUser.id) return user;
          const enrollments = user.enrollments?.map(e => {
              if (e.courseId === courseId) {
                  const newScore = { itemId, score };
                  const quizScores = [...(e.quizScores || []).filter(s => s.itemId !== itemId), newScore];
                  return { ...e, quizScores };
              }
              return e;
          });
          return { ...user, enrollments };
      }));
      toggleCourseItemCompletion(courseId, itemId);
  };
  
  const handleFinalQuizCompletion = (courseId: number, score: number) => {
      if (!currentUser) return;
      setUsersData(prevUsers => prevUsers.map(user => {
          if (user.id !== currentUser.id) return user;
          const enrollments = user.enrollments?.map(e => {
              if (e.courseId === courseId) {
                  return { ...e, finalQuizScore: score };
              }
              return e;
          });
          return { ...user, enrollments };
      }));
  };

  const handleSaveQuizProgress = (courseId: number, itemId: string, answers: (string | number)[], statuses: string[]) => {
      if (!currentUser) return;
      setUsersData(prevUsers => prevUsers.map(user => {
          if (user.id !== currentUser.id) return user;
          const enrollments = user.enrollments?.map(e => {
              if (e.courseId === courseId) {
                  const inProgressQuizAnswers = { ...(e.inProgressQuizAnswers || {}) };
                  if (answers.length > 0) {
                      inProgressQuizAnswers[itemId] = { answers: answers as number[], statuses };
                  } else {
                      delete inProgressQuizAnswers[itemId];
                  }
                  return { ...e, inProgressQuizAnswers };
              }
              return e;
          });
          return { ...user, enrollments };
      }));
  };

  const handleLikeProject = (id: number) => {
      setProjects(prevProjects => prevProjects.map(p => 
          p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
      ));
  };
  
  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };
  
  const handleConfirmDeleteProject = () => {
    if (projectToDelete) {
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    }
    setProjectToDelete(null);
  };
  
  const myProjects = useMemo(() => {
    if (!currentUser) return [];
    return projects.filter(p => p.authorName === currentUser.fullName);
  }, [projects, currentUser]);
  
  const handleAddProject = (project: Omit<Project, 'id' | 'authorName' | 'authorAvatar' | 'likes' | 'views' | 'isLiked'>) => {
      if (!currentUser) return;
      const newProject: Project = {
          ...project,
          id: Date.now(),
          authorName: currentUser.fullName,
          authorAvatar: currentUser.profilePicture,
          likes: 0,
          views: 0,
          isLiked: false,
      };
      setProjects(prev => [newProject, ...prev]);
  };
  
  const handleEditProject = (id: number, projectData: Omit<Project, 'id' | 'authorName' | 'authorAvatar' | 'likes' | 'views' | 'isLiked'>) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...projectData } : p));
  };
  
  const handleJoinCollaboration = (post: CollaborationPost) => {
    setCollaborationToJoin(post);
  };

  const handleConfirmJoinCollaboration = () => {
    if (collaborationToJoin && currentUser) {
      setCollaborationPosts(prev => prev.map(p => {
        if (p.id === collaborationToJoin.id) {
          return { ...p, isRequested: true };
        }
        return p;
      }));

      // Find the author of the post and send a notification
      const authorName = collaborationToJoin.authorName;
      setUsersData(prevUsers => prevUsers.map(user => {
          if (user.fullName === authorName) {
              const newNotification: Notification = {
                  id: `notif-collab-${Date.now()}`,
                  type: 'COLLABORATION_REQUEST',
                  message: `${currentUser.fullName} requested to join your project "${collaborationToJoin.title}".`,
                  timestamp: new Date().toISOString(),
                  isRead: false,
                  link: '/collaborate',
              };
              return { ...user, notifications: [...(user.notifications || []), newNotification] };
          }
          return user;
      }));
    }
    setCollaborationToJoin(null);
  };

  const handleAddCollaborationPost = (post: Omit<CollaborationPost, 'id' | 'authorName' | 'authorAvatar' | 'members' | 'isRequested'>) => {
      if (!currentUser) return;
      const newPost: CollaborationPost = {
          ...post,
          id: Date.now(),
          authorName: currentUser.fullName,
          authorAvatar: currentUser.profilePicture,
          members: [{ name: currentUser.fullName, avatar: currentUser.profilePicture }],
      };
      setCollaborationPosts(prev => [newPost, ...prev]);
  };

  const handleReply = (courseId: number, threadId: string, replyContent: string) => {
    if (!currentUser) return;

    let originalThreadAuthorName: string | null = null;
    let studentToNotify: User | null = null;
    let courseTitle: string | null = null;

    setAllCourses(prevCourses => {
        const newCourses = [...prevCourses];
        const courseIndex = newCourses.findIndex(c => c.id === courseId);
        if (courseIndex === -1 || !newCourses[courseIndex].discussion) return prevCourses;

        const course = newCourses[courseIndex];
        courseTitle = course.title;
        const threadIndex = course.discussion!.findIndex(t => t.id === threadId);
        if (threadIndex === -1) return prevCourses;
        
        originalThreadAuthorName = course.discussion![threadIndex].author;

        const newReply: DiscussionReply = {
            id: `r${Date.now()}`,
            author: currentUser.fullName,
            avatar: currentUser.profilePicture,
            timestamp: 'Just now',
            content: replyContent,
            upvotes: 0,
            authorRole: currentUser.role,
        };

        course.discussion![threadIndex].replies.push(newReply);
        return newCourses;
    });

    if (currentUser.role === 'faculty' && originalThreadAuthorName) {
        studentToNotify = usersData.find(u => u.fullName === originalThreadAuthorName && u.role === 'student') || null;

        if (studentToNotify && courseTitle) {
            const newNotification: Notification = {
                id: `notif-${Date.now()}`,
                type: 'DISCUSSION_REPLY',
                message: `${currentUser.fullName} replied to your discussion post in "${courseTitle}".`,
                timestamp: new Date().toISOString(),
                isRead: false,
                link: `/courses/${courseId}`,
            };
            
            setUsersData(prevUsers => prevUsers.map(user => {
                if (user.id === studentToNotify!.id) {
                    return { ...user, notifications: [...(user.notifications || []), newNotification] };
                }
                return user;
            }));
        }
    }
};

  const handleGradeSubmission = (studentId: number, courseId: number, itemId: string, grade: number, feedback: string) => {
    setUsersData(prevUsers => {
        return prevUsers.map(user => {
            if (user.id !== studentId) return user;

            let submissionTitle: string | null = null;
            let courseTitle: string | null = null;
            let notificationAdded = false;

            const enrollments = user.enrollments?.map(e => {
                if (e.courseId === courseId) {
                    const course = allCourses.find(c => c.id === courseId);
                    if (course) courseTitle = course.title;

                    const [sIdx, iIdx] = itemId.split('-').map(Number);
                    submissionTitle = course?.content[sIdx]?.items[iIdx]?.title || 'an assignment';
                    notificationAdded = true;
                    const assignmentSubmissions = (e.assignmentSubmissions || []).map(sub =>
                        sub.itemId === itemId ? { ...sub, grade, feedback } : sub
                    );
                    return { ...e, assignmentSubmissions };
                }
                return e;
            });

            const updatedUser = { ...user, enrollments };

            if (notificationAdded && submissionTitle && courseTitle) {
                const newNotification: Notification = {
                    id: `notif-grade-${Date.now()}`,
                    type: 'GRADE_UPDATE',
                    message: `Your submission for "${submissionTitle}" in "${courseTitle}" has been graded.`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    link: '/grades',
                };
                updatedUser.notifications = [...(user.notifications || []), newNotification];
            }

            return updatedUser;
        });
    });
  };
  
  const handleAcknowledgeCompletion = () => {
    if (!currentUser || !justCompletedCourseId) return;

    const course = allCourses.find(c => c.id === justCompletedCourseId);
    if (!course) return;

    setUsersData(prevUsers => prevUsers.map(user => {
        if (user.id === currentUser.id) {
            // 1. Acknowledge completion in enrollment
            const enrollments = user.enrollments?.map(e => 
                e.courseId === justCompletedCourseId ? { ...e, completionAcknowledged: true } : e
            );

            // 2. Generate certificate if it doesn't exist
            const hasCertificate = user.certificates?.some(cert => cert.courseId === justCompletedCourseId);
            let updatedCertificates = user.certificates || [];
            if (!hasCertificate) {
                const newCertificate: Certificate = {
                    id: `cert-${justCompletedCourseId}-${Date.now()}`,
                    courseId: justCompletedCourseId,
                    courseTitle: course.title,
                    completionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                };
                updatedCertificates = [...updatedCertificates, newCertificate];
            }

            return { ...user, enrollments, certificates: updatedCertificates };
        }
        return user;
    }));
    setJustCompletedCourseId(null);
  };
  
    const handleSaveNote = (noteToSave: Note) => {
        if (!currentUser) return;
        
        if (currentUser.role === 'student') {
            setUsersData(prevUsers => prevUsers.map(user => {
                if (user.id === currentUser.id) {
                    const existingNotes = user.notes || [];
                    const noteExists = existingNotes.some(n => n.id === noteToSave.id);
                    const updatedNotes = noteExists
                        ? existingNotes.map(n => n.id === noteToSave.id ? noteToSave : n)
                        : [...existingNotes, noteToSave];
                    return { ...user, notes: updatedNotes };
                }
                return user;
            }));
        } else if (currentUser.role === 'faculty') {
            setFacultyUsers(prevFaculty => prevFaculty.map(faculty => {
                if (faculty.id === currentUser.id) {
                    const existingNotes = faculty.notes || [];
                    const noteExists = existingNotes.some(n => n.id === noteToSave.id);
                    const updatedNotes = noteExists
                        ? existingNotes.map(n => n.id === noteToSave.id ? noteToSave : n)
                        : [...existingNotes, noteToSave];
                    return { ...faculty, notes: updatedNotes };
                }
                return faculty;
            }));
        }
    };

    const handleDeleteNote = (noteId: string) => {
        if (!currentUser) return;

        if (currentUser.role === 'student') {
            setUsersData(prevUsers => prevUsers.map(user => {
                if (user.id === currentUser.id) {
                    const updatedNotes = (user.notes || []).filter(n => n.id !== noteId);
                    return { ...user, notes: updatedNotes };
                }
                return user;
            }));
        } else if (currentUser.role === 'faculty') {
            setFacultyUsers(prevFaculty => prevFaculty.map(faculty => {
                if (faculty.id === currentUser.id) {
                    const updatedNotes = (faculty.notes || []).filter(n => n.id !== noteId);
                    return { ...faculty, notes: updatedNotes };
                }
                return faculty;
            }));
        }
    };

    const handlePublishNote = (noteToPublish: Note, courseId: number) => {
        if (!currentUser || currentUser.role !== 'faculty') return;

        const courseTitle = allCourses.find(c => c.id === courseId)?.title || 'Unknown Course';

        const newPublishedNote: Note = {
            ...noteToPublish,
            id: `pub-${Date.now()}`,
            authorName: currentUser.fullName,
            isPublished: true,
            courseId: courseId,
            courseTitle: courseTitle,
        };

        // Add to students' notes
        setUsersData(prevUsers => prevUsers.map(user => {
            if (user.role === 'student' && user.enrollments?.some(e => e.courseId === courseId)) {
                const updatedNotes = [...(user.notes || []), newPublishedNote];
                return { ...user, notes: updatedNotes };
            }
            return user;
        }));

        // Add to faculty's own notes as well
        setFacultyUsers(prevFaculty => prevFaculty.map(faculty => {
            if (faculty.id === currentUser.id) {
                const updatedNotes = [...(faculty.notes || []), newPublishedNote];
                return { ...faculty, notes: updatedNotes };
            }
            return faculty;
        }));
    };

    const handleAtsAnalysis = async (resumeText: string, jobTitle: string) => {
        const prompt = `
            Act as a strict and experienced professional resume reviewer specializing in optimizing resumes for modern Applicant Tracking Systems (ATS).
            Your task is to analyze the following resume content and provide a critical evaluation.
            
            The final "atsScore" (0-100) should be calculated based on a rigorous assessment of these key factors:
            1.  **Keyword Relevance:** How well does the resume use strong action verbs, quantifiable achievements (e.g., "increased sales by 20%"), and industry-specific keywords for the role of a "${jobTitle}"? Penalize heavily for generic descriptions.
            2.  **Formatting & Parsability:** Assess clarity of sections, use of standard resume structure, and avoidance of complex elements that can confuse parsers. Standard date formats (e.g., "Jan 2021 - Present") are crucial. The content provided is plain text, assume standard formatting but analyze the structure of the text provided.
            3.  **Content Structure:** Evaluate the conciseness and impact of the summary and bullet points in the experience section. Is the information easy for a machine to extract? Is it impactful?
            
            Provide a list of 3-5 highly specific and actionable "enhancementTips" for immediate improvement. The tips should directly address weaknesses found during the analysis. Be critical and direct in your feedback.
            
            Resume Content for Analysis:
            ---
            ${resumeText}
            ---
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            atsScore: { type: Type.NUMBER, description: 'A score from 0 to 100.' },
                            enhancementTips: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'A list of 3-5 concise, actionable enhancement tips.'
                            }
                        },
                        required: ["atsScore", "enhancementTips"]
                    },
                },
            });

            const jsonStr = response.text.trim();
            const result = JSON.parse(jsonStr);
            setAtsAnalysisData(prev => ({ ...prev, result: { score: result.atsScore, tips: result.enhancementTips }, isLoading: false }));
        } catch (e) {
            console.error(e);
            setAtsAnalysisData(prev => ({ ...prev, error: 'Sorry, the AI analysis failed. Please try again later.', isLoading: false }));
        }
    };

    const triggerAtsAnalysis = (resumeText: string, jobTitle: string) => {
        setAtsAnalysisData({
            isLoading: true,
            result: null,
            error: null,
            isModalOpen: true,
            analysisPayload: { resumeText, jobTitle },
        });
        handleAtsAnalysis(resumeText, jobTitle);
    };

    const closeAtsModal = () => {
        setAtsAnalysisData({
            isLoading: false,
            result: null,
            error: null,
            isModalOpen: false,
            analysisPayload: null,
        });
    };

    const studentUser = useMemo(() => {
        if (currentUser?.role !== 'student') return null;
        return usersData.find(u => u.id === currentUser.id);
    }, [currentUser, usersData]);

    const handleMarkNotificationAsRead = (notificationId: string) => {
        if (!currentUser) return;
        const updatedUsers = usersData.map(user => {
            if (user.id === currentUser.id) {
                const notifications = (user.notifications || []).map(n => 
                    n.id === notificationId ? { ...n, isRead: true } : n
                );
                const updatedUser = { ...user, notifications };
                if(currentUser.id === updatedUser.id) {
                    updateUser(updatedUser);
                }
                return updatedUser;
            }
            return user;
        });
        setUsersData(updatedUsers);
    };

    const handleMarkAllNotificationsAsRead = () => {
        if (!currentUser) return;
        const updatedUsers = usersData.map(user => {
            if (user.id === currentUser.id) {
                const notifications = (user.notifications || []).map(n => ({ ...n, isRead: true }));
                const updatedUser = { ...user, notifications };
                 if(currentUser.id === updatedUser.id) {
                    updateUser(updatedUser);
                }
                return updatedUser;
            }
            return user;
        });
        setUsersData(updatedUsers);
    };

    const handleMarkFacultyNotificationAsRead = (notificationId: string) => {
        if (!currentUser || currentUser.role !== 'faculty') return;
        const updatedFaculty = facultyUsers.map(faculty => {
            if (faculty.id === currentUser.id) {
                const notifications = (faculty.notifications || []).map(n => 
                    n.id === notificationId ? { ...n, isRead: true } : n
                );
                const updatedFacultyUser = { ...faculty, notifications };
                if (currentUser.id === updatedFacultyUser.id) {
                    const userToUpdate = { ...currentUser, notifications };
                    updateUser(userToUpdate as User);
                }
                return updatedFacultyUser;
            }
            return faculty;
        });
        setFacultyUsers(updatedFaculty);
    };

    const handleMarkAllFacultyNotificationsAsRead = () => {
        if (!currentUser || currentUser.role !== 'faculty') return;
        const updatedFaculty = facultyUsers.map(faculty => {
            if (faculty.id === currentUser.id) {
                const notifications = (faculty.notifications || []).map(n => ({ ...n, isRead: true }));
                const updatedFacultyUser = { ...faculty, notifications };
                 if(currentUser.id === updatedFacultyUser.id) {
                    const userToUpdate = { ...currentUser, notifications };
                    updateUser(userToUpdate as User);
                }
                return updatedFacultyUser;
            }
            return faculty;
        });
        setFacultyUsers(updatedFaculty);
    };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Routes */}
        <Route 
          element={
            <ProtectedRoute 
              role="student" 
              currentUser={currentUser}
              loading={authLoading}
              handleLogout={handleLogout} 
              profileData={studentUser}
              triggerAtsAnalysis={triggerAtsAnalysis}
            />
          }
        >
            <Route index element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/quiz/:sectionIndex/:itemIndex" element={<Quiz />} />
            <Route path="/courses/:courseId/final-quiz" element={<FinalTest />} />
            
            <Route path="/ide" element={<IDE />} />
            <Route path="/accomplishments" element={<Accomplishments />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/enroll-success/:courseId" element={<EnrollSuccess />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/projects/submit" element={<SubmitProject />} />
            <Route path="/projects/edit/:projectId" element={<SubmitProject />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/collaborate" element={<Collaborate />} />
            <Route path="/collaborate/post" element={<PostCollaboration handleAddPost={handleAddCollaborationPost} />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/sticky-wall" element={<StickyWall userRole='student' />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/notifications" element={currentUser && <Notifications currentUser={currentUser} onMarkAsRead={handleMarkNotificationAsRead} onMarkAllAsRead={handleMarkAllNotificationsAsRead} />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        
        {/* Faculty Routes */}
        <Route 
          path="/faculty"
          element={
            <ProtectedRoute 
              role="faculty" 
              currentUser={currentUser}
              loading={authLoading}
              handleLogout={handleLogout}
              facultyUsers={facultyUsers}
            />
          }
        >
          <Route index element={<FacultyDashboard />} />
          <Route path="courses" element={<FacultyMyCourses />} />
          <Route path="courses/new" element={<CourseEditor />} />
          <Route path="courses/:courseId/edit" element={<CourseEditor />} />
          <Route path="discussions" element={<FacultyDiscussions />} />
          <Route path="profile" element={<FacultyProfile />} />
          <Route path="quiz-builder" element={<QuizBuilder />} />
          <Route path="students" element={<FacultyStudents />} />
          <Route path="students/:studentId" element={<FacultyStudentDetail />} />
          <Route path="sticky-wall" element={<StickyWall userRole='faculty' courses={enrichedCourses} onPublishNote={handlePublishNote} />} />
          <Route path="notifications" element={<FacultyNotifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="*" element={<Navigate to="/faculty" replace />} />
        </Route>
      </Routes>

      <CourseCompletionModal 
        isOpen={!!justCompletedCourseId}
        onClose={handleAcknowledgeCompletion}
        courseTitle={justCompletedCourse?.title || ''}
        badge={awardedBadge}
        enrollment={justCompletedCourse?.enrollment}
      />

      <AnimatePresence>
        {projectToDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setProjectToDelete(null)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
                    <h2 className="text-lg font-bold text-heading">Delete Project?</h2>
                    <p className="text-sm text-content my-2">Are you sure you want to delete "{projectToDelete.title}"? This cannot be undone.</p>
                    <div className="flex justify-center gap-2 mt-4">
                        <button onClick={() => setProjectToDelete(null)} className="flex-1 bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleConfirmDeleteProject} className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded-lg">Delete</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
         {collaborationToJoin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCollaborationToJoin(null)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md text-center">
                    <h2 className="text-lg font-bold text-heading">Join Project?</h2>
                    <p className="text-sm text-content my-2">Send a request to join "{collaborationToJoin.title}"? The project owner will be notified.</p>
                    <div className="flex justify-center gap-2 mt-4">
                        <button onClick={() => setCollaborationToJoin(null)} className="flex-1 bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleConfirmJoinCollaboration} className="flex-1 bg-primary text-white font-bold py-2 px-4 rounded-lg">Send Request</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
         {profileToSave && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setProfileToSave(null)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
                    <h2 className="text-lg font-bold text-heading">Confirm Changes</h2>
                    <p className="text-sm text-content my-2">Are you sure you want to save the changes to your profile?</p>
                    <div className="flex justify-center gap-2 mt-4">
                        <button onClick={() => setProfileToSave(null)} className="flex-1 bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleConfirmSaveProfile} className="flex-1 bg-primary text-white font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
         {facultyProfileToSave && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFacultyProfileToSave(null)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
                    <h2 className="text-lg font-bold text-heading">Confirm Changes</h2>
                    <p className="text-sm text-content my-2">Are you sure you want to save the changes to your faculty profile?</p>
                    <div className="flex justify-center gap-2 mt-4">
                        <button onClick={() => setFacultyProfileToSave(null)} className="flex-1 bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleConfirmSaveFacultyProfile} className="flex-1 bg-faculty-primary text-white font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <AtsScoreModal
        isOpen={atsAnalysisData.isModalOpen}
        onClose={closeAtsModal}
        isLoading={atsAnalysisData.isLoading}
        result={atsAnalysisData.result}
        error={atsAnalysisData.error}
        onRetry={() => {
            if (atsAnalysisData.analysisPayload) {
                triggerAtsAnalysis(atsAnalysisData.analysisPayload.resumeText, atsAnalysisData.analysisPayload.jobTitle);
            }
        }}
      />
    </>
  );
};

// Wrap App with AuthProvider
const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWithAuth;
