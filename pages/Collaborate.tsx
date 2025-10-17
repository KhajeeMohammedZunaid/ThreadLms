
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { CollaborationPost } from '../types';
import { SearchIcon, PlusIcon, ChevronDownIcon, CollaborationIcon, StudentsIcon, SparklesIcon } from '../components/icons';
import { Skeleton } from '../components/Skeleton';
import GenerateIdeasModal from '../components/GenerateIdeasModal';
import { useAuth } from '../src/hooks/useAuth';
import collaborationService, { Collaboration } from '../src/services/collaboration.service';
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

const PostCardSkeleton: React.FC = () => (
    <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
            <Skeleton className="w-3/4 h-7" />
            <Skeleton className="w-24 h-5 rounded-full" />
        </div>
        <div className="space-y-2 mb-4">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton className="w-16 h-5 rounded-full" />
            <Skeleton className="w-20 h-5 rounded-full" />
            <Skeleton className="w-24 h-5 rounded-full" />
        </div>
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-24 h-5" />
            </div>
            <Skeleton className="w-32 h-9 rounded-lg" />
        </div>
    </motion.div>
);

const PostCard: React.FC<{ post: CollaborationPost; onJoin: (post: CollaborationPost) => void; }> = ({ post, onJoin }) => {
    const slotsFilled = post.members.length;
    const slotsAvailable = post.teamSize - slotsFilled;
    const isTeamFull = slotsAvailable <= 0;
    const isDisabled = isTeamFull || post.isRequested;

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
            className="bg-white rounded-xl border border-border p-6 flex flex-col h-full"
        >
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-heading pr-4">{post.title}</h3>
                <span className={`text-xs font-semibold py-1 px-3 rounded-full whitespace-nowrap ${post.branch === 'Interdisciplinary' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                    {post.branch}
                </span>
            </div>
            <p className="text-sm text-content flex-grow mb-4">{post.description}</p>
            <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                    {post.requiredSkills.map(skill => (
                        <span key={skill} className="text-xs font-medium text-slate-600 bg-slate-200 py-1 px-2.5 rounded-md">{skill}</span>
                    ))}
                </div>
            </div>
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} alt={post.authorName} className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="text-sm font-semibold text-heading">{post.authorName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-content">
                            <StudentsIcon className="w-3.5 h-3.5" /> 
                            <span>{slotsFilled} / {post.teamSize} members</span>
                        </div>
                    </div>
                </div>
                <motion.button 
                    whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                    whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                    className={`font-bold py-2 px-4 rounded-lg text-sm transition-colors ${
                        post.isRequested 
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                            : 'bg-primary hover:bg-primary-dark text-white disabled:bg-slate-300 disabled:cursor-not-allowed'
                    }`}
                    disabled={isDisabled}
                    onClick={() => onJoin(post)}
                >
                    {post.isRequested ? 'Requested' : isTeamFull ? 'Team Full' : 'Request to Join'}
                </motion.button>
            </div>
        </motion.div>
    );
};

const Collaborate: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeBranch, setActiveBranch] = useState('All');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Backend state
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());

    // Fetch collaborations from backend
    useEffect(() => {
        const fetchCollaborations = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const collaborations = await collaborationService.getAllCollaborations();
                setCollaborations(collaborations);
            } catch (error) {
                console.error('❌ Failed to load collaborations:', error);
                setError(handleError(error));
                setCollaborations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborations();
    }, [user]);

    // Convert backend collaborations to CollaborationPost format
    const posts: CollaborationPost[] = collaborations.map(collab => ({
        id: collab._id, // Keep as string (MongoDB ObjectId)
        _id: collab._id,
        title: collab.title,
        description: collab.description,
        branch: collab.branch,
        requiredSkills: collab.requiredSkills,
        teamSize: collab.teamSize,
        authorId: collab.authorId,
        authorName: collab.authorName,
        authorAvatar: collab.authorAvatar,
        members: collab.members.map(m => ({
            id: m.userId,
            name: m.userName,
            avatar: m.userAvatar
        })),
        isRequested: user ? collab.requests.some(r => r.userId === user.id) : false
    }));

    const branches = ['All', 'Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Interdisciplinary'];

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  post.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesBranch = activeBranch === 'All' || post.branch === activeBranch;
            return matchesSearch && matchesBranch;
        });
    }, [posts, searchTerm, activeBranch]);

    const handleJoinRequest = async (post: CollaborationPost) => {
        if (!user) {
            alert('Please log in to request to join');
            return;
        }

        // Find the backend collaboration ID
        const backendCollab = collaborations.find(c => c.title === post.title);
        if (!backendCollab) {
            console.error('Collaboration not found in backend');
            return;
        }

        try {
            setRequestingIds(prev => new Set(prev).add(backendCollab._id));
            setError(null);

            await collaborationService.requestToJoin(backendCollab._id);

            // Update local state
            setCollaborations(prev =>
                prev.map(c =>
                    c._id === backendCollab._id
                        ? { ...c, requests: [...c.requests, { userId: user.id, requestedAt: new Date().toISOString() }] }
                        : c
                )
            );

            alert('Join request sent successfully!');
        } catch (error) {
            console.error('Failed to request join:', error);
            setError(handleError(error));
        } finally {
            setRequestingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(backendCollab._id);
                return newSet;
            });
        }
    };

    const handleUseIdea = (idea: { title: string; description: string; requiredSkills: string[] }) => {
        setIsAiModalOpen(false);
        navigate('/collaborate/post', { state: { idea } });
    };

    // Error state
    if (error && !loading) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p className="font-bold">Error loading collaborations</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <div className="text-center mb-10">
                    <CollaborationIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                    <h1 className="text-4xl font-bold text-heading">Find Teammates</h1>
                    <p className="text-lg text-content mt-2 max-w-2xl mx-auto">Discover project ideas and connect with other students to build something amazing together.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto md:flex-grow">
                        <div className="relative w-full sm:w-auto md:flex-grow max-w-md">
                            <input
                                type="search"
                                placeholder="Search by title, skill..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-800"
                                aria-label="Search project ideas"
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
                                <ChevronDownIcon className="w-4 h-4 text-content" />
                            </div>
                        </div>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <motion.button
                            onClick={() => setIsAiModalOpen(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200"
                        >
                            <SparklesIcon /> Generate Ideas
                        </motion.button>
                        <Link to="/collaborate/post" className="w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200"
                            >
                                <PlusIcon /> Post a Project Idea
                            </motion.button>
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {Array.from({ length: 4 }).map((_, index) => <PostCardSkeleton key={index} />)}
                    </motion.div>
                ) : filteredPosts.length > 0 ? (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {filteredPosts.map(post => <PostCard key={post.id} post={post} onJoin={handleJoinRequest} />)}
                    </motion.div>
                ) : (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-bold text-heading">No Project Ideas Found</h2>
                        <p className="text-content mt-2">Try adjusting your search or be the first to post an idea!</p>
                    </div>
                )}
            </motion.div>
            <GenerateIdeasModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onUseIdea={handleUseIdea}
            />
        </>
    );
};

export default Collaborate;
