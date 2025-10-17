import React from 'react';
import { Skeleton } from './Skeleton';
import { motion } from 'framer-motion';

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

const CourseCardSkeleton: React.FC = () => (
    <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-full"
    >
        <Skeleton className="w-full h-40" />
        <div className="p-5 flex flex-col flex-grow space-y-3">
            <div className="flex justify-between items-center">
                <Skeleton className="w-24 h-5" />
                <Skeleton className="w-16 h-4" />
            </div>
            <div className="space-y-2">
                <Skeleton className="w-3/4 h-6" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-1/2 h-4" />
            </div>
            <div className="flex-grow"></div>
            <div className="mt-auto pt-2 space-y-2">
                <Skeleton className="w-full h-2" />
                <Skeleton className="w-1/4 h-3 ml-auto" />
            </div>
        </div>
    </motion.div>
);

export default CourseCardSkeleton;
