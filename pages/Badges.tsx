
import React from 'react';
import { motion } from 'framer-motion';
import { badges } from '../data/badges';
import { useAuth } from '../src/hooks/useAuth';

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
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};

const Badge: React.FC<{ name: string; description: string, icon: React.ReactElement }> = ({ name, description, icon }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
        className="bg-white p-6 rounded-xl shadow-sm border border-border flex flex-col items-center text-center"
    >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
           {/* FIX: Cast icon to React.ReactElement<any> to allow passing className prop for styling. */}
           {React.cloneElement(icon as React.ReactElement<any>, { className: "w-10 h-10 text-primary" })}
        </div>
        <h3 className="font-bold text-lg text-heading mt-4">{name}</h3>
        <p className="text-sm text-content mt-1 h-10">{description}</p>
    </motion.div>
);

const Badges: React.FC = () => {
  const { user } = useAuth();
  
  // In a production app, you would fetch user's earned badges from backend
  // For now, displaying all available badges
  
  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      <h1 className="text-4xl font-bold text-heading mb-8">My Badges</h1>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {badges.map(badge => (
          <Badge key={badge.id} name={badge.name} description={badge.description} icon={badge.icon} />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Badges;