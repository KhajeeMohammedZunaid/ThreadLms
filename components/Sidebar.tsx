
import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardIcon, CoursesIcon, IDEIcon, LogoIcon, ChevronLeftIcon, XIcon, ResumeIcon, ProjectIcon, CollaborationIcon, FolderIcon, RoadmapIcon, LogoutIcon, ClipboardCheckIcon, TrophyIcon, LeaderboardIcon, StickyWallIcon, NewsletterIcon, BriefcaseIcon } from './icons';
import { User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profileData: User;
  handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, profileData, handleLogout }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // initial check
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpen]);
  
  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center ${isOpen ? 'justify-start' : 'justify-center'} w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-border hover:text-white'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} h-20 border-b border-dark-border ${isOpen ? 'px-4' : 'px-2'} flex-shrink-0`}>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, width: 0 }} 
              animate={{ opacity: 1, width: 'auto', transition: { delay: 0.1 } }} 
              exit={{ opacity: 0, width: 0 }} 
              className="flex items-center overflow-hidden whitespace-nowrap">
              <LogoIcon className="w-8 h-8 flex-shrink-0" />
              <h1 className="text-xl font-bold ml-3 tracking-wider">LMS Platform</h1>
            </motion.div>
          )}
          {!isOpen && (
            <LogoIcon className="w-8 h-8 flex-shrink-0" />
          )}
        </AnimatePresence>
        <button onClick={() => setIsOpen(!isOpen)} className="hidden lg:block p-1 rounded-full text-gray-300 hover:bg-dark-border hover:text-white" aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          <ChevronLeftIcon className={`w-5 h-5 transition-transform duration-300 ${!isOpen && "rotate-180"}`} />
        </button>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-gray-300" aria-label="Close sidebar">
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      <nav className={`flex-1 ${isOpen ? 'px-4' : 'px-2'} py-6 space-y-2 overflow-y-auto sidebar-nav-scroll`}>
        <NavLink to="/" className={navLinkClasses} title="Dashboard">
          <DashboardIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Dashboard</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/roadmap" className={navLinkClasses} title="Roadmap">
          <RoadmapIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Roadmap</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/courses" className={navLinkClasses} title="Courses">
          <CoursesIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Courses</motion.span>}</AnimatePresence>
        </NavLink>
         <NavLink to="/sticky-wall" className={navLinkClasses} title="Sticky Wall">
          <StickyWallIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Sticky Wall</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/projects" className={navLinkClasses} title="Projects">
          <ProjectIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Projects</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/my-projects" className={navLinkClasses} title="My Projects">
          <FolderIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">My Projects</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/collaborate" className={navLinkClasses} title="Collaborate">
          <CollaborationIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Collaborate</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/resume-builder" className={navLinkClasses} title="Resume Builder">
          <ResumeIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Resume Builder</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/jobs" className={navLinkClasses} title="Jobs">
          <BriefcaseIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Jobs</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/ide" className={navLinkClasses} title="IDE">
          <IDEIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">IDE</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/newsletter" className={navLinkClasses} title="Newsletter">
          <NewsletterIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Newsletter</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/accomplishments" className={navLinkClasses} title="Accomplishments">
          <TrophyIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Accomplishments</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/grades" className={navLinkClasses} title="Grades & Feedback">
          <ClipboardCheckIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Grades & Feedback</motion.span>}</AnimatePresence>
        </NavLink>
        <NavLink to="/leaderboard" className={navLinkClasses} title="Leaderboard">
          <LeaderboardIcon className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>{isOpen && <motion.span initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="ml-3 whitespace-nowrap">Leaderboard</motion.span>}</AnimatePresence>
        </NavLink>
      </nav>
      <div className={`px-4 py-4 border-t border-dark-border`}>
        <button
            onClick={handleLogout}
            title="Logout"
            className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} w-full px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-dark-border hover:text-white`}
        >
            <LogoutIcon className="w-5 h-5 flex-shrink-0" />
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
        <Link to="/profile" className="block group">
            <div className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} rounded-lg p-2 mt-4`}>
                <img src={profileData.profilePicture} alt="User Avatar" className="w-10 h-10 rounded-full ring-2 ring-primary/50 flex-shrink-0" />
                <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0, transition: { delay: 0.1 } }} exit={{opacity: 0, x: -10}} className="ml-3 overflow-hidden">
                        <p className="text-sm font-semibold text-white whitespace-nowrap transition-colors group-hover:text-primary">{profileData.fullName}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap transition-colors group-hover:text-primary">View Profile</span>
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
        className="bg-dark-sidebar text-white flex flex-col flex-shrink-0 relative"
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
            className="bg-dark-sidebar text-white flex flex-col w-64 fixed inset-y-0 left-0 z-40"
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

export default Sidebar;
