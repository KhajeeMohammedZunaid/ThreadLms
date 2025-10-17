
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectIcon, IDEIcon, PlusIcon, XIcon, CoursesIcon, SparklesIcon, SpinnerIcon } from './icons';

// FIX: Add 'as const' to correctly type the transition for framer-motion variants.
const contentVariants = {
  collapsed: { 
    opacity: 0, 
    height: 0, 
    marginTop: 0, 
    marginBottom: 0,
    transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }
  },
  expanded: { 
    opacity: 1, 
    height: 'auto',
    marginTop: '1rem',
    marginBottom: '1rem',
    transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] } 
  },
} as const;

const contentContainerVariants = {
    expanded: { transition: { staggerChildren: 0.07 } },
    collapsed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
};

// FIX: Add 'as const' to correctly type the transition for framer-motion variants.
const itemVariants = {
    collapsed: { opacity: 0, x: -20, transition: { duration: 0.2, ease: [0.43, 0.13, 0.23, 0.96] } },
    expanded: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] } },
} as const;

// Skeleton for when a node is being refined by AI
const RoadmapNodeContentSkeleton = () => (
    <div className="pt-4 border-t border-border space-y-5">
        <div className="space-y-2">
            <div className="bg-slate-200 animate-pulse rounded-md w-1/3 h-5 mb-2" />
            <div className="bg-slate-200 animate-pulse rounded-md w-full h-4" />
        </div>
        <div className="space-y-2">
            <div className="bg-slate-200 animate-pulse rounded-md w-1/4 h-5 mb-2" />
            <div className="bg-slate-200 animate-pulse rounded-md w-5/6 h-4" />
            <div className="bg-slate-200 animate-pulse rounded-md w-4/6 h-4" />
        </div>
        <div className="space-y-2">
            <div className="bg-slate-200 animate-pulse rounded-md w-1/3 h-5 mb-2" />
            <div className="flex flex-wrap gap-2">
                <div className="bg-slate-200 animate-pulse rounded-full w-20 h-7" />
                <div className="bg-slate-200 animate-pulse rounded-full w-24 h-7" />
                <div className="bg-slate-200 animate-pulse rounded-full w-16 h-7" />
            </div>
        </div>
        <div className="space-y-2">
            <div className="bg-slate-200 animate-pulse rounded-md w-1/4 h-5 mb-2" />
            <div className="bg-slate-200 animate-pulse rounded-md w-5/6 h-4" />
        </div>
    </div>
);


const RoadmapNode = ({ data }) => {
    const { milestoneTitle, keyTopics, skills, projectIdeas, reasoning, milestoneNumber, isExpanded, onToggle, isRefining, onRefine } = data;
    const [isRefineFormOpen, setRefineFormOpen] = useState(false);
    const [refinePrompt, setRefinePrompt] = useState('');

    const handleRefineSubmit = () => {
        if (refinePrompt.trim()) {
            onRefine(milestoneNumber - 1, refinePrompt);
        }
    };

    const isFirst = milestoneNumber === 1;

    return (
        <motion.div
            className="bg-white rounded-xl border-2 border-primary/20 shadow-lg w-[640px] font-sans overflow-hidden"
        >
            {!isFirst && <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />}
            
            <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onToggle}>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">{milestoneNumber}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-heading leading-tight">{milestoneTitle}</h3>
                </div>
                <motion.div
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"
                    whileHover={{ scale: 1.1 }}
                >
                     <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={isExpanded ? 'minus' : 'plus'}
                            initial={{ rotate: -45, opacity: 0, scale: 0.5 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 45, opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isExpanded ? <XIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="content"
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="px-5"
                    >
                         <AnimatePresence mode="wait">
                            <motion.div
                                key={isRefining ? `skeleton-${milestoneNumber}` : `content-${milestoneNumber}-${milestoneTitle}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isRefining ? (
                                    <RoadmapNodeContentSkeleton />
                                ) : (
                                    <motion.div
                                        className="pt-4 border-t border-border space-y-5"
                                        variants={contentContainerVariants}
                                        initial="collapsed"
                                        animate="expanded"
                                    >
                                        <motion.div variants={itemVariants} className="bg-primary/5 border-l-4 border-primary/50 p-3 rounded-r-lg">
                                            <h4 className="font-semibold text-heading mb-1 flex items-center gap-2 text-sm"><SparklesIcon className="w-4 h-4 text-primary"/>Personalized For You</h4>
                                            <p className="text-content text-sm">{reasoning}</p>
                                        </motion.div>
                                        
                                        <motion.div variants={itemVariants}>
                                            <h4 className="font-semibold text-heading mb-2 flex items-center gap-2 text-sm"><CoursesIcon className="w-4 h-4 text-secondary"/>Key Topics</h4>
                                            <ul className="list-disc list-inside text-content text-sm space-y-1 pl-1">
                                                {keyTopics.map((topic, i) => <li key={i}>{topic}</li>)}
                                            </ul>
                                        </motion.div>
                                        
                                        <motion.div variants={itemVariants}>
                                            <h4 className="font-semibold text-heading mb-2 flex items-center gap-2 text-sm"><IDEIcon className="w-4 h-4 text-secondary"/>Skills to Acquire</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {skills.map((skill, i) => <span key={i} className="text-xs font-semibold text-primary bg-primary/10 py-1 px-2.5 rounded-full">{skill}</span>)}
                                            </div>
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <h4 className="font-semibold text-heading mb-2 flex items-center gap-2 text-sm"><ProjectIcon className="w-4 h-4 text-secondary"/>Project Ideas</h4>
                                            <ul className="list-disc list-inside text-content text-sm space-y-1 pl-1">
                                                {projectIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                                            </ul>
                                        </motion.div>

                                        <motion.div variants={itemVariants} className="mt-4 pt-4 border-t border-dashed border-slate-200">
                                            {isRefineFormOpen ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    <h5 className="font-semibold text-heading mb-2">Refine this milestone</h5>
                                                    <p className="text-xs text-content mb-2">Tell the AI what you'd like to change. For example, "Focus more on backend skills".</p>
                                                    <textarea
                                                        value={refinePrompt}
                                                        onChange={e => setRefinePrompt(e.target.value)}
                                                        rows={3}
                                                        placeholder="Your instructions..."
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        disabled={isRefining}
                                                    />
                                                    <div className="flex items-center justify-end gap-2 mt-2">
                                                        <button
                                                            onClick={() => { setRefineFormOpen(false); setRefinePrompt(''); }}
                                                            disabled={isRefining}
                                                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleRefineSubmit}
                                                            disabled={isRefining || !refinePrompt.trim()}
                                                            className="bg-secondary hover:bg-secondary/80 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 disabled:bg-slate-300"
                                                        >
                                                            {isRefining ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                                            {isRefining ? 'Generating...' : 'Refine'}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.button
                                                    onClick={() => setRefineFormOpen(true)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex items-center gap-2 font-semibold text-secondary hover:text-secondary/80"
                                                >
                                                    <SparklesIcon className="w-5 h-5" />
                                                    Refine with AI
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </motion.div>
                         </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
        </motion.div>
    );
};

export default RoadmapNode;