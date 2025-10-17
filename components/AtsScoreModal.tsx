import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SparklesIcon, SpinnerIcon } from './icons';

interface AtsResult {
    score: number;
    tips: string[];
}

interface AtsScoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: AtsResult | null;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
}

const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    let color = '#6366f1'; // primary
    if (score < 50) color = '#ef4444'; // red-500
    else if (score < 80) color = '#f97316'; // orange-500

    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 140 140">
                <circle
                    className="text-slate-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                />
                <motion.circle
                    className="transition-colors duration-500"
                    strokeWidth="10"
                    stroke={color}
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    strokeDasharray={`${circumference} ${circumference}`}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                    className="text-4xl font-bold"
                    style={{ color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    {score}
                    <motion.span 
                        className="text-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >%
                    </motion.span>
                </motion.span>
            </div>
        </div>
    );
};


const AtsScoreModal: React.FC<AtsScoreModalProps> = ({ isOpen, onClose, result, isLoading, error, onRetry }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ ease: 'easeInOut', duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <SparklesIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-heading">ATS Friendliness Score</h2>
                                    <p className="text-sm text-content">An AI-powered analysis of your resume.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon className="w-6 h-6 text-slate-500" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto -mx-2 px-2 py-4">
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                                    <SpinnerIcon className="w-12 h-12 text-primary mb-4" />
                                    <h3 className="text-lg font-bold text-heading">Analyzing your resume...</h3>
                                    <p className="text-content mt-1">This can take a few moments.</p>
                                </div>
                            )}
                            {error && (
                                <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                                    <XIcon className="w-12 h-12 text-red-500 mb-4" />
                                    <h3 className="text-lg font-bold text-heading">Analysis Failed</h3>
                                    <p className="text-content mt-1 mb-4 max-w-md">{error}</p>
                                    <motion.button onClick={onRetry} whileHover={{ scale: 1.05 }} className="bg-primary text-white font-semibold py-2 px-5 rounded-lg">Try Again</motion.button>
                                </div>
                            )}
                            {result && (
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                    <div className="flex-shrink-0 flex flex-col items-center">
                                        <CircularProgress score={result.score} />
                                        <p className="font-bold text-heading mt-2">Your ATS Score</p>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-heading mb-3">Enhancement Tips</h3>
                                        <ul className="space-y-3 list-disc list-inside text-content text-sm">
                                            {result.tips.map((tip, index) => (
                                                <motion.li
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.5 + index * 0.1 }}
                                                >
                                                    {tip}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                             <motion.button onClick={onClose} whileHover={{ scale: 1.05 }} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg">Close</motion.button>
                        </div>
                        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AtsScoreModal;