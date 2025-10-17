import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { CertificateIcon } from '../components/icons';
import { badges } from '../data/badges';
import { Certificate } from '../types';
import { AppCourse } from '../App';
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
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1 },
};

// Certificate Card
const CertificateCard: React.FC<{ certificate: Certificate, onView: () => void }> = ({ certificate, onView }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
      className="bg-white p-6 rounded-xl border border-border flex items-center"
    >
      <div className="flex-shrink-0 bg-secondary/10 text-secondary p-4 rounded-lg">
        <CertificateIcon />
      </div>
      <div className="ml-5">
          <h2 className="text-lg font-bold text-heading">{certificate.courseTitle}</h2>
          <p className="text-sm text-content mt-1">
            Awarded on <span className="font-semibold text-slate-600">{certificate.completionDate}</span> by <span className="font-semibold text-slate-600">LMS Platform</span>
          </p>
          <button onClick={onView} className="text-sm font-semibold text-primary hover:underline mt-2 inline-block">
              View Certificate &rarr;
          </button>
      </div>
    </motion.div>
);

// Badge Card
const BadgeCard: React.FC<{ name: string; description: string, icon: React.ReactElement }> = ({ name, description, icon }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
        className="bg-white p-6 rounded-xl shadow-sm border border-border flex flex-col items-center text-center"
    >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
           {React.cloneElement(icon as React.ReactElement<any>, { className: "w-10 h-10 text-primary" })}
        </div>
        <h3 className="font-bold text-lg text-heading mt-4">{name}</h3>
        <p className="text-sm text-content mt-1 h-10">{description}</p>
    </motion.div>
);

const Accomplishments: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'certificates' | 'badges'>('certificates');
    const { user } = useAuth();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [courses, setCourses] = useState<AppCourse[]>([]);
    const [userBadges, setUserBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch certificates from backend
    useEffect(() => {
        const fetchAccomplishments = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Try to fetch user certificates - handle gracefully if user has none
                let userCertificates = [];
                try {
                    // Use user.id instead of user._id for consistency
                    const userId = user._id || user.id;
                    userCertificates = await userService.getUserCertificates(userId);
                } catch (certError: any) {
                    // If 400/404 error, user simply has no certificates yet
                    if (certError.message?.includes('Invalid ID') || 
                        certError.message?.includes('400') || 
                        certError.message?.includes('404')) {
                        userCertificates = [];
                    } else {
                        throw certError; // Re-throw unexpected errors
                    }
                }

                // Fetch all courses to get course details
                const allCourses = await courseService.getAllCourses();

                // Map certificates with course data (handle empty array)
                const mappedCertificates = userCertificates.map((cert: any) => {
                    // Find the course details
                    const courseDetails = allCourses.find(c => c._id === cert.courseId);
                    
                    return {
                        id: cert.id || cert._id || `${cert.courseId}-${cert.issuedAt}`, // Add unique id
                        courseId: cert.courseId, // Keep as string (MongoDB ObjectId)
                        courseTitle: courseDetails?.title || cert.course?.title || 'Unknown Course',
                        completionDate: new Date(cert.issuedAt).toLocaleDateString(),
                        certificateUrl: cert.certificateUrl || `/certificates/${user._id || user.id}/${cert.courseId}`
                    };
                });

                setCertificates(mappedCertificates);
                setCourses(allCourses as any);

                // Fetch user badges (for now using static data, but filter based on user achievements)
                // In production, this should come from backend: userService.getUserBadges(userId)
                // For now, show badges based on certificates count
                const earnedBadges = mappedCertificates.length > 0 ? badges.slice(0, Math.min(badges.length, mappedCertificates.length)) : [];
                setUserBadges(earnedBadges);
            } catch (err) {
                console.error('❌ Error fetching accomplishments:', err);
                // Don't show error for empty certificates - just show empty state
                setError(null);
                setCertificates([]);
                setUserBadges([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAccomplishments();
    }, [user]);

    // In production, fetch certificates and badges from backend
    // For now, using fetched data

    const handleViewCertificate = (certificate: Certificate) => {
        const course = courses.find(c => c.id === certificate.courseId);
        const facultyAdvisor = course?.author?.fullName || 'LMS Faculty';

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Create and add the gradient background
        const canvas = document.createElement('canvas');
        const scale = 2; // Render at higher resolution for better quality
        canvas.width = pageWidth * scale;
        canvas.height = pageHeight * scale;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // First fill with white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Then apply the radial gradient as requested
            // CSS: radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)
            const cx = canvas.width * 0.5;
            const cy = canvas.height * 0.9;
            const radius = Math.max(canvas.width, canvas.height) * 1.25;

            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0.4, 'rgba(255, 255, 255, 1)'); // White starts at 40%
            gradient.addColorStop(1, '#f59e0b'); // Amber at the end

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const gradientDataUrl = canvas.toDataURL('image/png');
        doc.addImage(gradientDataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        
        // Define colors for a professional look
        const darkBlue = '#0d3d56';
        const darkGray = '#333333';
        const lightGray = '#555555';
        const gold = '#d4af37';

        // 2. Add content (No margins, no seal)
        
        // Top Title: ThreadLms
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(18);
        doc.setTextColor(darkGray);
        doc.text('ThreadLms', pageWidth / 2, 30, { align: 'center' });

        // Main Heading
        doc.setFont('times', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(lightGray);
        doc.text('This certificate is awarded to', pageWidth / 2, 50, { align: 'center' });

        // Student Name
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(48);
        doc.setTextColor(darkBlue);
        doc.text(user?.fullName || 'Student Name', pageWidth / 2, 75, { align: 'center' });
        
        // Completion Statement
        doc.setFont('times', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(lightGray);
        doc.text('for the successful completion of the course', pageWidth / 2, 90, { align: 'center' });

        // Course Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(darkGray);
        doc.text(certificate.courseTitle, pageWidth / 2, 105, { align: 'center' });

        // Completion Date
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(lightGray);
        doc.text(`Awarded on ${certificate.completionDate}`, pageWidth / 2, 120, { align: 'center' });
        
        // Elegant Divider line
        doc.setDrawColor(gold);
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 - 50, 150, pageWidth / 2 + 50, 150);

        // Signatures
        const signatureY = 170;
        const signatureLineWidth = 60;
        const signatureBlockWidth = 100;
        const leftBlockX = pageWidth / 2 - signatureBlockWidth - 15;
        const rightBlockX = pageWidth / 2 + 15;
        
        doc.setFontSize(12);
        doc.setTextColor(darkGray);
        
        // Faculty Advisor
        doc.text(facultyAdvisor, leftBlockX + signatureBlockWidth / 2, signatureY, { align: 'center' });
        doc.setDrawColor(darkGray);
        doc.setLineWidth(0.2);
        doc.line(leftBlockX, signatureY + 2, leftBlockX + signatureBlockWidth, signatureY + 2);
        doc.setFontSize(10);
        doc.setTextColor(lightGray);
        doc.text('Faculty Advisor', leftBlockX + signatureBlockWidth / 2, signatureY + 7, { align: 'center' });

        // Training Director
        doc.setFontSize(12);
        doc.setTextColor(darkGray);
        doc.text('Training Director', rightBlockX + signatureBlockWidth / 2, signatureY, { align: 'center' });
        doc.line(rightBlockX, signatureY + 2, rightBlockX + signatureBlockWidth, signatureY + 2);
        doc.setFontSize(10);
        doc.setTextColor(lightGray);
        doc.text('ThreadLms', rightBlockX + signatureBlockWidth / 2, signatureY + 7, { align: 'center' });

        const sanitizedUserName = (user?.fullName || 'student').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const sanitizedCourseTitle = certificate.courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${sanitizedUserName}_${sanitizedCourseTitle}_certificate.pdf`);
    };

    const tabButtonClasses = (isActive: boolean) => 
        `px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-300 focus:outline-none ${
            isActive ? 'bg-white text-primary shadow-md' : 'bg-transparent text-slate-500 hover:text-slate-800'
        }`;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error loading accomplishments</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      <h1 className="text-4xl font-bold text-heading mb-4">My Accomplishments</h1>
      <p className="text-content mb-8">A collection of all the certificates and badges you've earned.</p>

      <div className="flex justify-center mb-10">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setActiveTab('certificates')} className={tabButtonClasses(activeTab === 'certificates')}>
                Certificates
            </button>
            <button onClick={() => setActiveTab('badges')} className={tabButtonClasses(activeTab === 'badges')}>
                Badges
            </button>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
        >
            {activeTab === 'certificates' ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {certificates && certificates.length > 0 ? (
                      certificates.map(cert => (
                          <CertificateCard key={cert.id} certificate={cert} onView={() => handleViewCertificate(cert)} />
                      ))
                    ) : (
                      <p className="text-content text-center col-span-full py-10">You have not earned any certificates yet. Complete a course to get started!</p>
                    )}
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userBadges && userBadges.length > 0 ? (
                        userBadges.map(badge => (
                            <BadgeCard key={badge.id} name={badge.name} description={badge.description} icon={badge.icon} />
                        ))
                    ) : (
                        <p className="text-content text-center col-span-full py-10">You have not earned any badges yet. Keep learning and completing courses!</p>
                    )}
                </motion.div>
            )}
        </motion.div>
      </AnimatePresence>

    </motion.div>
  );
};

export default Accomplishments;