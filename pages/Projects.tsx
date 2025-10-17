
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { SearchIcon, HeartIcon, EyeIcon, PlusIcon, ChevronLeftIcon, ChevronDownIcon } from '../components/icons';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../src/hooks/useAuth';
import projectService from '../src/services/project.service';
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
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ProjectCardSkeleton: React.FC = () => (
    <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-full"
    >
        <Skeleton className="w-full h-48" />
        <div className="p-5 flex flex-col flex-grow">
            <Skeleton className="w-3/4 h-6 mb-2" />
            <Skeleton className="w-full h-4 mb-1" />
            <Skeleton className="w-1/2 h-4 mb-4" />
            <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-20 h-5 rounded-full" />
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
                 <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-24 h-5" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-5" />
                    <Skeleton className="w-10 h-5" />
                </div>
            </div>
        </div>
    </motion.div>
);


const ProjectCard: React.FC<Project & { handleLikeProject: (id: number) => void; }> = (props) => {
  const { id, title, description, imageUrl, authorName, authorAvatar, tags, likes, views, projectUrl, isLiked, branch, handleLikeProject } = props;
  
  return (
  <motion.a
    href={projectUrl}
    target="_blank"
    rel="noopener noreferrer"
    variants={itemVariants}
    whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
    className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-full group"
  >
    <div className="overflow-hidden relative">
      <img src={imageUrl} alt={title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      <span className="absolute top-2 right-2 text-xs font-semibold bg-black/50 text-white py-1 px-2 rounded-full">{branch}</span>
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <h3 className="font-bold text-lg text-heading mb-2">{title}</h3>
      <p className="text-sm text-content flex-grow mb-4">{description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
              <span key={tag} className="text-xs font-semibold text-primary bg-primary/10 py-1 px-3 rounded-full">{tag}</span>
          ))}
      </div>
      <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-semibold text-heading">{authorName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLikeProject(id);
                        }}
                        className={`flex items-center gap-1.5 transition-colors duration-200 ${isLiked ? 'text-red-500' : 'text-content hover:text-red-500'}`}
                        aria-label="Like this project"
                    >
                        <HeartIcon className="w-4 h-4" filled={isLiked} />
                        <span>{likes}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-content">
                        <EyeIcon className="w-4 h-4" />
                        <span>{views}</span>
                    </div>
                </div>
          </div>
      </div>
    </div>
  </motion.a>
  );
};


const Pagination: React.FC<{ projectsPerPage: number, totalProjects: number, paginate: (pageNumber: number) => void, currentPage: number }> = ({ projectsPerPage, totalProjects, paginate, currentPage }) => {
    const pageNumbers = [];
    const totalPages = Math.ceil(totalProjects / projectsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    if (totalPages <= 1) return null;

    return (
        <nav>
            <ul className="flex justify-center items-center gap-2">
                <li>
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 leading-tight text-content bg-white border border-border rounded-lg hover:bg-slate-100 hover:text-heading disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeftIcon />
                    </button>
                </li>
                {pageNumbers.map(number => (
                    <li key={number}>
                        <button
                            onClick={() => paginate(number)}
                            className={`px-4 py-2 leading-tight border rounded-lg ${currentPage === number ? 'bg-primary text-white border-primary' : 'bg-white text-content border-border hover:bg-slate-100 hover:text-heading'}`}
                        >
                            {number}
                        </button>
                    </li>
                ))}
                <li>
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 leading-tight text-content bg-white border border-border rounded-lg hover:bg-slate-100 hover:text-heading disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         <ChevronLeftIcon className="transform rotate-180" />
                    </button>
                </li>
            </ul>
        </nav>
    );
};


const Projects: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBranch, setActiveBranch] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;
  
  // Backend state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeInProgress, setLikeInProgress] = useState<Record<string, boolean>>({});

  const branches = ['All', 'Computer Science', 'Electrical', 'Mechanical', 'Civil'];

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedProjects = await projectService.getAllProjects();
        
        // Map backend projects to frontend Project format
        const mappedProjects: Project[] = fetchedProjects.map(project => ({
          id: parseInt(project._id.substring(project._id.length - 8), 16), // Convert MongoDB ID to number
          title: project.title,
          description: project.description,
          imageUrl: project.imageUrl,
          authorName: project.authorName,
          authorAvatar: project.authorAvatar,
          tags: project.tags,
          likes: project.likes,
          views: project.views,
          projectUrl: project.projectUrl,
          branch: project.branch,
          category: project.category,
          isLiked: user ? project.likedBy.includes(user._id) : false,
          _id: project._id // Store backend ID for API calls
        } as any));
        
        setProjects(mappedProjects);
      } catch (err) {
        console.error('❌ Error fetching projects:', err);
        setError(handleError(err));
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  // Handle like with backend integration
  const handleLikeProject = async (id: number) => {
    const project = projects.find(p => p.id === id);
    if (!project || !(project as any)._id || !user) {
      return;
    }

    const projectBackendId = (project as any)._id;
    
    // Prevent multiple simultaneous likes on same project
    if (likeInProgress[projectBackendId]) {
      return;
    }

    try {
      setLikeInProgress(prev => ({ ...prev, [projectBackendId]: true }));
      
      // Optimistic UI update
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === id
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked ? p.likes - 1 : p.likes + 1
              }
            : p
        )
      );

      // Call backend API
      const result = await projectService.toggleLike(projectBackendId);
      
      // Update with actual backend response
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === id
            ? {
                ...p,
                isLiked: result.liked,
                likes: result.likes
              }
            : p
        )
      );
    } catch (err) {
      console.error('❌ Error liking project:', err);
      
      // Revert optimistic update on error
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === id
            ? {
                ...p,
                isLiked: project.isLiked,
                likes: project.likes
              }
            : p
        )
      );
    } finally {
      setLikeInProgress(prev => ({ ...prev, [projectBackendId]: false }));
    }
  };

  const filteredProjects = useMemo(() => {
    const results = projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesBranch = activeBranch === 'All' || project.branch === activeBranch;
      return matchesSearch && matchesBranch;
    });
    setCurrentPage(1); // Reset to first page on filter change
    return results;
  }, [projects, searchTerm, activeBranch]);
  
  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);


  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-heading">Project Showcase</h1>
            <p className="text-lg text-content mt-2 max-w-2xl mx-auto">Get inspired by the amazing projects built by our community of learners.</p>
        </div>
      
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto md:flex-grow">
                <div className="relative w-full sm:w-auto md:flex-grow max-w-md">
                    <input
                        type="search"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-800"
                        aria-label="Search projects"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-gray-400" />
                    </div>
                </div>
                <div className="relative w-full sm:w-48">
                    <select 
                        value={activeBranch} 
                        onChange={e => setActiveBranch(e.target.value)}
                        className="appearance-none w-full bg-white border border-border rounded-lg py-2 pl-3 pr-8 text-heading focus:ring-2 focus:ring-primary focus:outline-none"
                        aria-label="Select project branch"
                    >
                        {branches.map((branch) => (
                            <option key={branch} value={branch}>{branch}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronDownIcon className="w-4 h-4 text-content"/>
                    </div>
                </div>
            </div>
            <Link to="/projects/submit" className="w-full md:w-auto">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200"
                >
                    <PlusIcon /> Submit Project
                </motion.button>
            </Link>
        </div>
      
      {loading ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
                <ProjectCardSkeleton key={index} />
            ))}
        </motion.div>
      ) : filteredProjects.length > 0 ? (
        <>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentProjects.map(project => (
                <ProjectCard key={project.id} {...project} handleLikeProject={handleLikeProject} />
            ))}
            </motion.div>
            <div className="mt-12">
                <Pagination 
                    projectsPerPage={projectsPerPage}
                    totalProjects={filteredProjects.length}
                    paginate={paginate}
                    currentPage={currentPage}
                />
            </div>
        </>
      ) : (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-heading">No Projects Found</h2>
            <p className="text-content mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Projects;
