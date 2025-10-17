import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadIcon, FilterIcon, SearchIcon, ChevronDownIcon, ChevronLeftIcon } from '../components/icons';
import { useAuth } from '../src/hooks/useAuth';
import userService from '../src/services/user.service';
import projectService from '../src/services/project.service';
import { handleError } from '../src/utils/errorHandler';

type RankedUser = { 
    user: { 
        id: string | number; 
        fullName: string; 
        profilePicture: string; 
        role: string; 
        aboutMe?: string;
    }; 
    score: number; 
    coursesCompleted: number; 
    projectsSubmitted: number; 
    designation: string 
};

type Project = {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    authorName: string;
    authorAvatar: string;
    likes: number;
    views: number;
    tags: string[];
    branch: string;
    category: string;
    projectUrl: string;
    likedBy: string[];
};

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

const Sparkline: React.FC = () => (
    <svg width="100" height="30" className="opacity-50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 28C10.3333 23.8333 28.1 -3.1 37 9C45.9 21.1 57.8333 28.1667 65 25C72.1667 21.8333 80.5 2 99 2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const getRankSuffix = (rank: number) => {
    if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
    switch (rank % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const TopPerformerCard: React.FC<{ item: RankedUser; rank: number }> = ({ item, rank }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: rank * 0.1 }}
        className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col items-center text-center"
    >
        <img src={item.user.profilePicture} alt={item.user.fullName} className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100 mb-3" />
        <h3 className="font-bold text-lg text-heading">{item.user.fullName}</h3>
        <p className="text-sm text-content">{item.designation}</p>
        <div className="my-4">
            <Sparkline />
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-heading">{item.score.toFixed(1)}</span>
            <span className="text-lg text-content font-medium">% Avg. Grade</span>
        </div>
        <div className="mt-4 text-2xl font-bold text-slate-400">
            {rank}<sup className="text-lg -top-2">{getRankSuffix(rank)}</sup> <span className="font-medium">Rank</span>
        </div>
    </motion.div>
);

const TopProjectCard: React.FC<{ project: Project; rank: number }> = ({ project, rank }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: rank * 0.1 }}
        className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col items-center text-center"
    >
        <img src={project.imageUrl} alt={project.title} className="w-full h-28 object-cover rounded-lg mb-4" />
        <h3 className="font-bold text-lg text-heading leading-tight">{project.title}</h3>
        <p className="text-sm text-content">by {project.authorName}</p>
        <div className="my-4">
            <Sparkline />
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-heading">{project.likes}</span>
            <span className="text-lg text-content font-medium">Likes</span>
        </div>
        <div className="mt-4 text-2xl font-bold text-slate-400">
            {rank}<sup className="text-lg -top-2">{getRankSuffix(rank)}</sup> <span className="font-medium">Rank</span>
        </div>
    </motion.div>
);

const UserProfilePanel: React.FC<{ user: RankedUser['user'] | null; stats: any }> = ({ user, stats }) => {
    if (!user || !stats) return null;
    return (
        <motion.div
            key={user.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col"
        >
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center">
                <img src={user.profilePicture} alt={user.fullName} className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100 mb-4" />
                <h2 className="text-xl font-bold text-heading">{user.fullName}</h2>
                <p className="text-sm text-content">{stats.designation}</p>
            </div>

            {/* About Me Section */}
            <div className="w-full my-6 py-4 border-y border-slate-200 flex flex-col min-h-0">
                <h3 className="font-bold text-heading text-xs uppercase tracking-wider mb-2">About Me</h3>
                <div className="overflow-y-auto scrollbar-hide -mr-2 pr-2">
                    <p className="text-sm text-content">
                        {user.aboutMe || 'This user has not provided a bio yet.'}
                    </p>
                </div>
            </div>
            
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </motion.div>
    );
};


const ProjectProfilePanel: React.FC<{ project: Project | null }> = ({ project }) => {
    if (!project) return null;
    return (
        <motion.div
            key={project.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-md border border-slate-200 p-6"
        >
            <img src={project.imageUrl} alt={project.title} className="w-full h-36 object-cover rounded-lg mb-4" />
            <h2 className="text-xl font-bold text-heading">{project.title}</h2>
            <p className="text-sm text-content">by {project.authorName}</p>

            <div className="w-full my-6 py-4 border-y border-slate-200 text-center flex justify-around">
                <div>
                    <p className="text-xs text-content uppercase tracking-wider">Likes</p>
                    <p className="text-2xl font-bold text-heading">{project.likes}</p>
                </div>
                <div>
                    <p className="text-xs text-content uppercase tracking-wider">Views</p>
                    <p className="text-2xl font-bold text-heading">{project.views}</p>
                </div>
            </div>

            <div className="w-full space-y-4 text-sm">
                <h3 className="font-bold text-heading uppercase text-xs tracking-wider">Description</h3>
                <p className="text-content">{project.description}</p>
                <h3 className="font-bold text-heading uppercase text-xs tracking-wider pt-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                        <span key={tag} className="text-xs font-semibold text-primary bg-primary/10 py-1 px-3 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Note: Average grade calculation is now done by backend and included in leaderboard data

const Leaderboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'performance' | 'projects'>('performance');
    const { user } = useAuth();
    
    const [selectedUser, setSelectedUser] = useState<RankedUser['user'] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [currentPageProjects, setCurrentPageProjects] = useState(1);
    const [searchTermProjects, setSearchTermProjects] = useState('');

    // Backend state
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [projectsData, setProjectsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const itemsPerPage = 7;

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch leaderboard and projects from backend
                const [leaderboard, projects] = await Promise.all([
                    userService.getLeaderboard(),
                    projectService.getAllProjects()
                ]);

                setLeaderboardData(Array.isArray(leaderboard) ? leaderboard : []);
                setProjectsData(Array.isArray(projects) ? projects : []);
            } catch (error) {
                console.error('❌ Failed to load leaderboard data:', error);
                setError(handleError(error));
                setLeaderboardData([]);
                setProjectsData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Map backend projects to frontend format
    const projectsToDisplay = useMemo(() => {
        return projectsData.map((p: any) => ({
            id: parseInt(p._id.slice(-8), 16),
            title: p.title,
            description: p.description,
            imageUrl: p.imageUrl,
            authorName: p.authorName,
            authorAvatar: p.authorAvatar,
            likes: p.likes,
            views: p.views,
            tags: p.tags,
            branch: p.branch,
            category: p.category,
            projectUrl: p.projectUrl,
            likedBy: p.likedBy || []
        }));
    }, [projectsData]);

    // Map backend leaderboard to frontend format
    const overallRanking = useMemo(() => {
        return leaderboardData.map((item: any) => ({
            user: {
                id: item.userId,
                fullName: item.fullName,
                profilePicture: item.profilePicture,
                role: 'student'
            },
            score: item.averageScore,
            coursesCompleted: item.coursesCompleted,
            projectsSubmitted: projectsToDisplay.filter(p => p.authorName === item.fullName).length,
            designation: 'Student',
        }));
    }, [leaderboardData, projectsToDisplay]);
    
    const projectRanking = useMemo(() => {
        return [...projectsToDisplay].sort((a, b) => b.likes - a.likes);
    }, [projectsToDisplay]);

    useEffect(() => {
        if (activeTab === 'performance' && overallRanking.length > 0) {
            setSelectedUser(overallRanking[0].user);
        } else if (activeTab === 'projects' && projectRanking.length > 0) {
            setSelectedProject(projectRanking[0]);
        }
    }, [activeTab, overallRanking, projectRanking]);
    
    const filteredRanking = useMemo(() => {
        return overallRanking.filter(item =>
            item.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [overallRanking, searchTerm]);
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRanking.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRanking, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredRanking.length / itemsPerPage);

    const filteredProjects = useMemo(() => {
        return projectRanking.filter(project =>
            project.title.toLowerCase().includes(searchTermProjects.toLowerCase()) ||
            project.authorName.toLowerCase().includes(searchTermProjects.toLowerCase())
        );
    }, [projectRanking, searchTermProjects]);
    
    const paginatedProjects = useMemo(() => {
        const startIndex = (currentPageProjects - 1) * itemsPerPage;
        return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProjects, currentPageProjects, itemsPerPage]);

    const totalPagesProjects = Math.ceil(filteredProjects.length / itemsPerPage);


    const selectedUserStats = useMemo(() => {
        if (!selectedUser) return null;
        const ranking = overallRanking.find(r => r.user.id === selectedUser.id);
        
        return {
            coursesCompleted: ranking?.coursesCompleted || 0,
            avgGrade: ranking?.score || 0,
            designation: ranking?.designation || 'Student',
        };
    }, [selectedUser, overallRanking]);

    const monthOptions = useMemo(() => {
        const options = ['Overall'];
        const now = new Date();
        const uniqueMonths = new Set<string>();
        uniqueMonths.add(now.toLocaleString('default', { month: 'long' }));
        for (let i = 1; i < 3; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            uniqueMonths.add(date.toLocaleString('default', { month: 'long' }));
        }
        return ['Overall', ...Array.from(uniqueMonths)];
    }, []);

    return (
        <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-heading">Leaderboard for</h1>
                <div className="relative">
                    <select className="appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-10 text-heading font-semibold focus:ring-2 focus:ring-primary focus:outline-none">
                        {monthOptions.map(month => (
                            <option key={month}>{month}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content pointer-events-none" />
                </div>
            </div>
             <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
                <button onClick={() => setActiveTab('performance')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'performance' ? 'bg-white shadow-sm text-primary' : 'text-slate-600 hover:bg-slate-200'}`}>
                    Overall Performance
                </button>
                <button onClick={() => setActiveTab('projects')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'projects' ? 'bg-white shadow-sm text-primary' : 'text-slate-600 hover:bg-slate-200'}`}>
                    Project Showcase
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'performance' && (
                        <div className="flex gap-8 items-start">
                            <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    {overallRanking.slice(0, 3).map((item, index) => (
                                        <TopPerformerCard key={item.user.id} item={item} rank={index + 1} />
                                    ))}
                                </div>
                                <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                                    <div className="p-4 flex justify-between items-center border-b border-slate-200">
                                        <div className="relative w-full sm:w-auto sm:flex-grow max-w-sm">
                                            <input type="search" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search students..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="text-gray-400" /></div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-slate-50"><tr className="text-left text-xs text-slate-500 uppercase tracking-wider"><th className="p-4 font-medium">Rank</th><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Designation</th><th className="p-4 font-medium text-right">Courses</th><th className="p-4 font-medium text-right">Avg. Grade</th><th className="p-4 font-medium text-right">Projects</th></tr></thead>
                                            <tbody>
                                                {paginatedData.map((item, index) => {
                                                    const rank = (currentPage - 1) * itemsPerPage + index + 1;
                                                    return (<tr key={item.user.id} onClick={() => setSelectedUser(item.user)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"><td className="p-4 font-bold text-slate-500">{rank}</td><td className="p-4 whitespace-nowrap"><div className="flex items-center gap-3"><img src={item.user.profilePicture} alt={item.user.fullName} className="w-9 h-9 rounded-full object-cover" /><span className="font-semibold text-heading">{item.user.fullName}</span></div></td><td className="p-4 text-slate-600 whitespace-nowrap">{item.designation}</td><td className="p-4 font-semibold text-heading text-right">{item.coursesCompleted}</td><td className="p-4 font-semibold text-heading text-right">{item.score.toFixed(1)}%</td><td className="p-4 font-semibold text-heading text-right">{item.projectsSubmitted}</td></tr>);
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 flex justify-between items-center text-sm text-slate-600">
                                        <p>Page {currentPage} of {totalPages}</p>
                                        <div className="flex gap-1"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50"><ChevronLeftIcon /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50"><ChevronLeftIcon className="rotate-180" /></button></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-80 flex-shrink-0"><UserProfilePanel user={selectedUser} stats={selectedUserStats} /></div>
                        </div>
                    )}
                    {activeTab === 'projects' && (
                        <div className="flex gap-8 items-start">
                            <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    {projectRanking.slice(0, 3).map((project, index) => (
                                        <TopProjectCard key={project.id} project={project} rank={index + 1} />
                                    ))}
                                </div>
                                <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                                     <div className="p-4 flex justify-between items-center border-b border-slate-200">
                                        <div className="relative w-full sm:w-auto sm:flex-grow max-w-sm">
                                            <input type="search" value={searchTermProjects} onChange={(e) => { setSearchTermProjects(e.target.value); setCurrentPageProjects(1); }} placeholder="Search projects..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="text-gray-400" /></div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-slate-50"><tr className="text-left text-xs text-slate-500 uppercase tracking-wider"><th className="p-4 font-medium">Rank</th><th className="p-4 font-medium">Project</th><th className="p-4 font-medium">Tags</th><th className="p-4 font-medium text-right">Likes</th><th className="p-4 font-medium text-right">Views</th></tr></thead>
                                            <tbody>
                                                {paginatedProjects.map((item, index) => {
                                                    const rank = (currentPageProjects - 1) * itemsPerPage + index + 1;
                                                    return (<tr key={item.id} onClick={() => setSelectedProject(item)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"><td className="p-4 font-bold text-slate-500">{rank}</td><td className="p-4 whitespace-nowrap"><div className="flex items-center gap-3"><img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-md object-cover" /><div><span className="font-semibold text-heading block">{item.title}</span><span className="text-xs text-slate-500">by {item.authorName}</span></div></div></td><td className="p-4"><div className="flex flex-wrap gap-1">{item.tags.slice(0, 2).map(tag => (<span key={tag} className="text-[10px] font-semibold text-primary bg-primary/10 py-0.5 px-2 rounded-full">{tag}</span>))}</div></td><td className="p-4 font-semibold text-heading text-right">{item.likes}</td><td className="p-4 font-semibold text-heading text-right">{item.views}</td></tr>);
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                     <div className="p-4 flex justify-between items-center text-sm text-slate-600">
                                        <p>Page {currentPageProjects} of {totalPagesProjects}</p>
                                        <div className="flex gap-1"><button onClick={() => setCurrentPageProjects(p => Math.max(1, p - 1))} disabled={currentPageProjects === 1} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50"><ChevronLeftIcon /></button><button onClick={() => setCurrentPageProjects(p => Math.min(totalPagesProjects, p + 1))} disabled={currentPageProjects === totalPagesProjects} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50"><ChevronLeftIcon className="rotate-180" /></button></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-80 flex-shrink-0"><ProjectProfilePanel project={selectedProject} /></div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export default Leaderboard;