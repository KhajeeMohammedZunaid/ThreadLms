import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../components/Skeleton';
import { CheckCircleIcon, ChevronDownIcon } from '../components/icons';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
} as const;

const CourseDetailSkeleton: React.FC = () => {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="max-w-7xl mx-auto"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <div className="lg:col-span-2 space-y-8">
                    {/* Header section */}
                    <div>
                        <Skeleton className="w-1/4 h-5 mb-4" />
                        <Skeleton className="w-full h-10 mb-3" />
                        <Skeleton className="w-3/4 h-10 mb-4" />
                        <Skeleton className="w-5/6 h-7 mb-4" />
                        <div className="flex items-center gap-x-4">
                            <Skeleton className="w-32 h-6" />
                            <Skeleton className="w-48 h-6" />
                        </div>
                    </div>

                    {/* What you'll learn */}
                    <div className="p-6 border border-border rounded-lg">
                        <Skeleton className="w-1/3 h-8 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex items-start">
                                    <CheckCircleIcon className="w-5 h-5 text-slate-200 mr-3 mt-0.5 flex-shrink-0" />
                                    <Skeleton className="w-full h-5" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Course content */}
                    <div>
                        <Skeleton className="w-1/2 h-8 mb-4" />
                        <div className="border border-border rounded-md">
                           {Array.from({ length: 4 }).map((_, index) => (
                               <div key={index} className="border-b border-border last:border-b-0 p-4">
                                   <div className="w-full flex justify-between items-center">
                                       <Skeleton className="w-3/4 h-6" />
                                       <ChevronDownIcon className="text-slate-200" />
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>

                {/* Sticky sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-border shadow-lg overflow-hidden sticky top-10">
                        <Skeleton className="w-full h-48" />
                        <div className="p-6 space-y-4">
                            <Skeleton className="w-full h-12 rounded-lg" />
                            <div className="mt-6 space-y-2.5">
                               <Skeleton className="w-1/2 h-6 mb-3" />
                               {Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <Skeleton className="w-5 h-5 rounded-full" />
                                        <Skeleton className="w-3/4 h-5" />
                                    </div>
                                ))}
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default CourseDetailSkeleton;
