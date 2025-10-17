
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CertificateIcon } from '../components/icons';
import { useAuth } from '../src/hooks/useAuth';
import userService from '../src/services/user.service';
import { handleError } from '../src/utils/errorHandler';

const certificatesData = [
  { id: 1, course: 'Advanced React Patterns', date: 'June 15, 2024', authority: 'LMS Platform' },
  { id: 2, course: 'Full-Stack Development Bootcamp', date: 'March 02, 2024', authority: 'LMS Platform' },
];


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

const CertificateCard: React.FC<typeof certificatesData[0]> = ({ course, date, authority }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
      className="bg-white p-6 rounded-xl border border-border flex items-center"
    >
      <div className="flex-shrink-0 bg-secondary/10 text-secondary p-4 rounded-lg">
        <CertificateIcon />
      </div>
      <div className="ml-5">
          <h2 className="text-lg font-bold text-heading">{course}</h2>
          <p className="text-sm text-content mt-1">
            Awarded on <span className="font-semibold text-slate-600">{date}</span> by <span className="font-semibold text-slate-600">{authority}</span>
          </p>
          <a href="#" className="text-sm font-semibold text-primary hover:underline mt-2 inline-block">
              View Certificate &rarr;
          </a>
      </div>
    </motion.div>
);


const Certificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<typeof certificatesData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch certificates from backend
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) {
        setCertificates(certificatesData); // Fallback to static data
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedCertificates = await userService.getUserCertificates(user._id);
        
        // Map backend certificates to component format
        const mappedCertificates = fetchedCertificates.map((cert, index) => ({
          id: index + 1,
          course: cert.courseName,
          date: new Date(cert.issueDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          authority: 'LMS Platform'
        }));
        
        setCertificates(mappedCertificates.length > 0 ? mappedCertificates : certificatesData);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError(handleError(err));
        setCertificates(certificatesData); // Fallback on error
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <h1 className="text-4xl font-bold text-heading mb-8">My Certificates</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : certificates.length > 0 ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {certificates.map(cert => (
            <CertificateCard key={cert.id} {...cert} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <CertificateIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-heading mb-2">No Certificates Yet</h2>
          <p className="text-content">Complete courses to earn certificates!</p>
        </div>
      )}
    </motion.div>
  );
};

export default Certificates;