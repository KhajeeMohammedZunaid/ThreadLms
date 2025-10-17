import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BadgeInfo } from '../data/badges';
import { CheckCircleIcon, CertificateIcon } from './icons';
import { Enrollment } from '../types';

const confettiColors = ['#6366f1', '#818cf8', '#a5b4fc', '#14b8a6', '#5eead4'];
const ConfettiPiece: React.FC<{ initialX: number; rotation: number; color: string; delay: number }> = ({ initialX, rotation, color, delay }) => {
    const duration = Math.random() * 2 + 3;
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
            transition={{ duration, delay, ease: 'linear', opacity: { duration, times: [0, 0.9, 1] } }}
        />
    );
};
const confettiPieces = Array.from({ length: 150 }).map((_, i) => ({
    id: i,
    initialX: Math.random() * 100,
    rotation: Math.random() * 360,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    delay: Math.random() * 1.5,
}));

interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  badge: BadgeInfo | undefined;
  enrollment: Enrollment | undefined;
}

const CourseCompletionModal: React.FC<CourseCompletionModalProps> = ({ isOpen, onClose, courseTitle, badge, enrollment }) => {
  const needsGrading = false; // Final project removed, no need to check for grading

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {confettiPieces.map(p => <ConfettiPiece key={p.id} {...p} />)}
          </div>
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md text-center relative z-10"
          >
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-heading mb-2">
              {needsGrading ? "Submission Received!" : "Course Complete!"}
            </h1>
            <p className="text-content mb-6">
                Congratulations on completing <strong>"{courseTitle}"</strong>!
                {needsGrading && " Your final project has been submitted and is now awaiting a grade."}
            </p>

            <div className="space-y-4 mb-6">
              {!needsGrading && (
                  <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-secondary/5 border border-secondary/20 rounded-lg p-4"
                  >
                      <div className="flex items-center gap-4">
                          <div className="bg-secondary/10 p-3 rounded-lg flex-shrink-0">
                              <CertificateIcon className="w-6 h-6 text-secondary" />
                          </div>
                          <div>
                              <h2 className="font-bold text-heading text-left">Certificate Awarded</h2>
                              <p className="text-sm text-content text-left">
                                  View and download it on your <Link to="/accomplishments" onClick={onClose} className="font-semibold underline hover:text-secondary">Accomplishments</Link> page.
                              </p>
                          </div>
                      </div>
                  </motion.div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/courses" className="flex-1">
                    <motion.button 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-6 rounded-lg transition-colors duration-200"
                    >
                       Explore More Courses
                    </motion.button>
                </Link>
                 <motion.button 
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg transition-colors duration-200"
                >
                    Continue
                </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CourseCompletionModal;
