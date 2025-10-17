
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { PlusIcon, FolderIcon, EyeIcon, HeartIcon, PencilIcon, TrashIcon } from '../components/icons';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../src/hooks/useAuth';
import projectService from '../src/services/project.service';
import { handleError } from '../src/utils/errorHandler';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ProjectCardSkeleton: React.FC = () => (
    <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-full">
        <Skeleton className="w-full h-48" />
        <div className="p-5 flex flex-col flex-grow">
            <Skeleton className="w-3/4 h-6 mb-2" />
            <Skeleton className="w-full h-4 mb-4" />
            <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-20 h-5 rounded-full" />
            </div>
            <div className="mt-auto flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-5" />
                    <Skeleton className="w-10 h-5" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
            </div>
        </div>
    </motion.div>
);

const ManagementProjectCard: React.FC<{ project: Project; onDelete: () => void; }> = ({ project, onDelete }) => {
    return (
        <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-full group"
        >
            <div className="overflow-hidden relative">
                <img src={project.imageUrl} alt={project.title} className="w-full h-48 object-cover" />
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-heading mb-2">{project.title}</h3>
                <p className="text-sm text-content flex-grow mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map(tag => (
                        <span key={tag} className="text-xs font-semibold text-primary bg-primary/10 py-1 px-3 rounded-full">{tag}</span>
                    ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-content">
                        <div className="flex items-center gap-1.5">
                            <HeartIcon className="w-4 h-4 text-red-400" /> <span>{project.likes}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <EyeIcon className="w-4 h-4" /> <span>{project.views}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to={`/projects/edit/${(project as any)._id}`}>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" aria-label="Edit project">
                                <PencilIcon className="w-4 h-4" />
                            </motion.button>
                        </Link>
                        <motion.button onClick={onDelete} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Delete project">
                            <TrashIcon className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const MyProjects: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Fetch user's projects from backend
    useEffect(() => {
        const fetchUserProjects = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                const fetchedProjects = await projectService.getProjectsByUser(user._id);
                
                // Map backend projects to frontend format
                const mappedProjects: Project[] = fetchedProjects.map(project => ({
                    id: parseInt(project._id.substring(project._id.length - 8), 16),
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
                    isLiked: false,
                    _id: project._id // Store backend ID for delete operations
                } as any));
                
                setProjects(mappedProjects);
            } catch (err) {
                console.error('❌ Error fetching user projects:', err);
                setError(handleError(err));
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProjects();
    }, [user]);

    // Handle delete with backend integration
    const handleDeleteProject = async (project: Project) => {
        const projectBackendId = (project as any)._id;
        
        if (!projectBackendId || !user) {
            return;
        }

        // Prevent multiple simultaneous deletes
        if (deletingId === projectBackendId) {
            return;
        }

        // Confirm deletion
        if (!window.confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setDeletingId(projectBackendId);
            
            // Call backend API
            await projectService.deleteProject(projectBackendId);
            
            // Remove from local state after successful deletion
            setProjects(prevProjects =>
                prevProjects.filter(p => (p as any)._id !== projectBackendId)
            );
            
        } catch (err) {
            console.error('❌ Error deleting project:', err);
            setError(handleError(err));
        } finally {
            setDeletingId(null);
        }
    };
    return (
        <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-heading">My Projects</h1>
                    <p className="text-content mt-1">Manage, edit, and update your submitted projects.</p>
                </div>
                <Link to="/projects/submit">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg"
                    >
                        <PlusIcon /> Add New Project
                    </motion.button>
                </Link>
            </div>

            {loading ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, index) => <ProjectCardSkeleton key={index} />)}
                </motion.div>
            ) : projects.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map(project => (
                        <ManagementProjectCard 
                            key={project.id} 
                            project={project} 
                            onDelete={() => handleDeleteProject(project)} 
                        />
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-16 bg-white border-2 border-dashed border-border rounded-xl">
                    <FolderIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-heading">You haven't submitted any projects yet.</h2>
                    <p className="text-content mt-2 mb-6">Click the button below to share your first creation!</p>
                    <Link to="/projects/submit">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200"
                        >
                            Submit a Project
                        </motion.button>
                    </Link>
                </div>
            )}
        </motion.div>
    );
};

export default MyProjects;