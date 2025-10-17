
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AppCourse } from '../App';
import { SearchIcon, ChevronDownIcon, StarIcon, StudentsIcon, LessonsIcon, ClockIcon } from '../components/icons';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import { useAuth } from '../src/hooks/useAuth';
import courseService from '../src/services/course.service';
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

const CourseCard: React.FC<{ course: AppCourse }> = ({ course }) => {
  const { id, title, subtitle, category, duration, progress, imageUrl, isEnrolled, branch, lessons, students, rating, author } = course;
  return (
    <Link to={`/courses/${id}`} className="block group h-full">
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.08)" }}
        className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-full transition-shadow duration-300"
      >
        <div className="relative">
          <img src={imageUrl} alt={title} className="w-full h-44 object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute bottom-4 left-4">
              <span className="text-xs font-semibold text-white bg-primary py-1 px-3 rounded-full">{category}</span>
          </div>
          <div className="absolute top-3 right-3 text-xs font-semibold bg-white/90 text-heading py-1 px-2 rounded-full backdrop-blur-sm">{branch}</div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <div>
            <h3 className="font-bold text-lg text-heading mb-2 group-hover:text-primary transition-colors h-14 line-clamp-2">{title}</h3>
            <p className="text-sm text-content mb-4 line-clamp-2 h-10">{subtitle}</p>
            <div className="flex items-center gap-2 text-sm text-content">
                <img src={author.profilePicture} alt={author.fullName} className="w-6 h-6 rounded-full" />
                <span>by {author.fullName}</span>
            </div>
          </div>
          
          <div className="flex-grow"></div>
          
          <div className="mt-4">
              <div className="flex justify-between items-center text-sm text-content mb-4 border-t border-border pt-4">
                  <div className="flex items-center gap-1.5" title="Students Enrolled">
                      <StudentsIcon className="w-4 h-4"/>
                      <span>{students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Total Lessons">
                      <LessonsIcon className="w-4 h-4"/>
                      <span>{lessons}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Duration">
                      <ClockIcon className="w-4 h-4"/>
                      <span>{duration}</span>
                  </div>
              </div>
              
              {isEnrolled ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-heading">Progress</span>
                      <span className="text-sm font-bold text-primary">{Math.min(100, progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                          className="bg-primary h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, progress)}%` }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      />
                  </div>
                </div>
              ) : (
                 <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-content">
                          <ClockIcon className="w-4 h-4" />
                          <span>{duration}</span>
                      </div>
                      <span className="font-semibold text-sm text-primary/80 group-hover:text-primary transition-colors">
                          View Details &rarr;
                      </span>
                 </div>
              )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
};

const Courses: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBranch, setActiveBranch] = useState('All');
  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const branches = ['All', 'Computer Science', 'Electrical', 'Mechanical', 'Civil'];

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedCourses = await courseService.getAllCourses();
        
        if (!Array.isArray(fetchedCourses)) {
          console.error('Courses is not an array:', fetchedCourses);
          setCourses([]);
          return;
        }
        
        // Map backend courses to AppCourse format with all required fields
        const mappedCourses = fetchedCourses.map(course => {
          // Check if user is enrolled in this course
          const enrollment = user?.enrollments?.find((e: any) => {
            const enrollmentCourseId = typeof e.courseId === 'string' ? e.courseId : e.courseId?._id;
            return enrollmentCourseId === course._id;
          });
          
          const isEnrolled = !!enrollment;
          
          // Calculate progress if enrolled
          let progress = 0;
          if (isEnrolled && enrollment) {
            const totalItems = course.content?.reduce((acc: number, section: any) => 
              acc + (section.items?.length || 0), 0) || 0;
            const completedItems = enrollment.completedItems?.length || 0;
            progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
          }
          
          // Get author info - could be in authorId or faculty field
          const author = (course as any).authorId || (course as any).faculty;
          const authorName = author?.fullName || 
            `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || 
            'Unknown Instructor';
          
          return {
            id: course._id, // Keep as string (MongoDB ObjectId)
            _id: course._id, // Store original _id
            title: course.title,
            subtitle: course.subtitle || course.description?.substring(0, 100) || '',
            description: course.description || '',
            instructor: authorName,
            duration: course.duration || '0h',
            totalLength: course.totalLength || course.duration || '0h',
            students: course.students || course.totalStudents || 0,
            rating: course.rating || 0,
            imageUrl: course.imageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Course+Image',
            lessons: course.lessons || course.content?.reduce((acc: number, section: any) => acc + (section.items?.length || 0), 0) || 0,
            branch: course.branch || course.category || 'Computer Science',
            category: course.category || 'Computer Science',
            progress: progress,
            isEnrolled: isEnrolled,
            bestseller: course.bestseller || false,
            reviews: course.reviews || 0,
            authorId: author?._id || author || '',
            updated: course.updated || course.updatedAt,
            learnings: course.learnings || [],
            previewUrl: course.previewUrl || course.previewVideoUrl || '',
            requirements: course.requirements || [],
            includes: course.includes || [],
            content: course.content || [],
            completedItems: enrollment?.completedItems || [],
            author: {
              id: author?._id || '',
              firstName: author?.firstName || '',
              lastName: author?.lastName || '',
              name: authorName,
              email: author?.email || '',
              expertise: course.category || 'Unknown',
              courses: 0,
              students: 0,
              rating: course.rating || 0,
              avatarUrl: author?.profilePicture || '',
              bio: author?.bio || '',
              title: author?.title || 'Instructor',
              fullName: authorName,
              profilePicture: author?.profilePicture || 'https://placehold.co/150/e2e8f0/64748b?text=User'
            }
          } as unknown as AppCourse;
        });
        
        setCourses(mappedCourses);
      } catch (err) {
        console.error('❌ Error fetching courses:', err);
        setError(handleError(err));
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user?.enrollments]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch = activeBranch === 'All' || course.branch === activeBranch;
        return matchesSearch && matchesBranch;
    });
  }, [courses, searchTerm, activeBranch]);

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="w-full sm:w-auto sm:flex-grow">
            <h1 className="text-4xl font-bold text-heading mb-1">Courses</h1>
            <p className="text-content">Expand your knowledge with our curated courses.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
            <input
                type="search"
                placeholder="Search for courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-800"
                aria-label="Search for courses"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="text-gray-400" />
            </div>
            </div>
             <div className="relative w-full sm:w-48">
                <select 
                    value={activeBranch} 
                    onChange={e => setActiveBranch(e.target.value)}
                    className="appearance-none w-full bg-white border border-border rounded-lg py-2 pl-3 pr-8 text-heading focus:ring-2 focus:ring-primary focus:outline-none"
                    aria-label="Select course branch"
                >
                    {branches.map((branch) => (
                        <option key={branch} value={branch}>{branch}</option>
                    ))}
                </select>
                 <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDownIcon className="w-4 h-4 text-content"/>
                </div>
            </div>
        </div>
      </div>
      
      {loading ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </motion.div>
      ) : filteredCourses.length > 0 ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-heading">No Courses Found</h2>
            <p className="text-content mt-2">Try adjusting your search or filter.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Courses;