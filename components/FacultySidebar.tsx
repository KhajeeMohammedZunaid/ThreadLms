
import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardIcon, CoursesIcon, PlusCircleIcon, LogoIcon, ChevronLeftIcon, XIcon, LogoutIcon, MessageIcon, BeakerIcon, StudentsIcon, StickyWallIcon } from './icons';
import { Faculty } from '../types';

interface FacultySidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profileData: Faculty;
  handleLogout: () => void;
}

const FacultySidebar: React.FC<FacultySidebarProps> = ({ isOpen, setIsOpen, profileData, handleLogout }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setIsOpen(true);
      else setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpen]);
  
  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-faculty-primary text-white' : 'text-gray-300 hover:bg-dark-border hover:text-white'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between h-20 border-b border-dark-border px-4 flex-shrink-0`}>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto', transition: { delay: 0.1 } }} exit={{ opacity: 0, width: 0 }} className="flex items-center overflow-hidden whitespace-nowrap">
              <LogoIcon />
              <h1 className="text-xl font-bold ml-3 tracking-wider">Faculty Portal</h1>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsOpen(!isOpen)} className="hidden lg:block p-1 rounded-full text-gray-300 hover:bg-dark-border hover:text-white" aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          <ChevronLeftIcon className={`transition-transform duration-300 ${!isOpen && "rotate-180"}`} />
        </button>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-gray-300" aria-label="Close sidebar">
          <XIcon />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto sidebar-nav-scroll">
        <NavLink to="/faculty" end className={navLinkClasses} title="Dashboard">
          <DashboardIcon />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Dashboard</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/faculty/courses" className={navLinkClasses} title="My Courses">
          <CoursesIcon />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">My Courses</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/faculty/discussions" className={navLinkClasses} title="Discussions & Q&A">
          <MessageIcon />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Discussions &amp; Q&amp;A</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/faculty/students" className={navLinkClasses} title="Students">
          <StudentsIcon />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Students</motion.span>}</AnimatePresence>
        </NavLink>
         <NavLink to="/faculty/sticky-wall" className={navLinkClasses} title="Sticky Wall">
          <StickyWallIcon />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Sticky Wall</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/faculty/courses/new" className={navLinkClasses} title="Create Course">
          <PlusCircleIcon />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Create Course</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/faculty/quiz-builder" className={navLinkClasses} title="Quiz Builder">
          <BeakerIcon />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Quiz Builder</motion.span>}</AnimatePresence>
        </NavLink>
      </nav>
      <div className={`px-4 py-4 border-t border-dark-border`}>
        <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-dark-border hover:text-white"
        >
            <LogoutIcon />
            <AnimatePresence>
                {isOpen && (
                    <motion.span
                        initial={{ opacity: 0}}
                        animate={{ opacity: 1, transition: { delay: 0.1 } }}
                        exit={{ opacity: 0 }}
                        className="ml-3 whitespace-nowrap"
                    >
                        Logout
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
        <Link to="/faculty/profile" className="block group">
            <div className="flex items-center rounded-lg p-2 mt-4">
                <img src={profileData.profilePicture} alt="User Avatar" className="w-10 h-10 rounded-full ring-2 ring-faculty-primary/50 flex-shrink-0" />
                <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0, transition: { delay: 0.1 } }} exit={{opacity: 0, x: -10}} className="ml-3 overflow-hidden">
                        <p className="text-sm font-semibold text-white whitespace-nowrap transition-colors group-hover:text-faculty-primary">{profileData.fullName}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap transition-colors group-hover:text-faculty-primary">{profileData.title}</span>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </Link>
      </div>
      <style>{`
        .sidebar-nav-scroll {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .sidebar-nav-scroll:hover {
          scrollbar-color: #334155 transparent;
        }
        .sidebar-nav-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 10px;
        }
        .sidebar-nav-scroll:hover::-webkit-scrollbar-thumb {
          background-color: #334155; /* dark-border */
        }
      `}</style>
    </div>
  );
  
  if (isDesktop) {
    return (
      <motion.aside
        className="bg-faculty-sidebar text-white flex flex-col flex-shrink-0 relative"
        animate={{ width: isOpen ? '16rem' : '5rem' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        {sidebarContent}
      </motion.aside>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="bg-faculty-sidebar text-white flex flex-col w-64 fixed inset-y-0 left-0 z-40"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default FacultySidebar;
