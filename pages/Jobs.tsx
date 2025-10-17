import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, BriefcaseIcon, LocationMarkerIcon, BuildingIcon, ClockIcon } from '../components/icons';
import { Skeleton } from '../components/Skeleton';
import jobsService, { Job } from '../src/services/jobs.service';

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

const JobCardSkeleton: React.FC = () => (
  <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border p-6">
    <div className="flex items-start gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="w-3/4 h-6 mb-2" />
        <Skeleton className="w-1/2 h-4 mb-1" />
        <Skeleton className="w-2/3 h-4" />
      </div>
    </div>
    <div className="flex gap-2 mb-4">
      <Skeleton className="w-20 h-6 rounded-full" />
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
    <Skeleton className="w-full h-4 mb-2" />
    <Skeleton className="w-full h-4 mb-4" />
    <Skeleton className="w-32 h-10 rounded-lg" />
  </motion.div>
);

const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.1), 0 4px 6px -2px rgba(99, 102, 241, 0.08)" }}
      className="bg-white rounded-xl border border-border p-6 flex flex-col h-full"
    >
      <div className="flex items-start gap-4 mb-4">
        <img 
          src={job.companyLogo} 
          alt={job.company} 
          className="w-12 h-12 rounded-lg object-contain bg-slate-50 p-1"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/48?text=Co';
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-heading mb-1 line-clamp-2">{job.title}</h3>
          <div className="flex items-center gap-2 text-sm text-content mb-1">
            <BuildingIcon className="w-4 h-4" />
            <span className="truncate">{job.company}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-content">
            <LocationMarkerIcon className="w-4 h-4" />
            <span className="truncate">{job.location}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-semibold text-primary bg-primary/10 py-1 px-3 rounded-full">
          {job.employmentType}
        </span>
        {job.isRemote && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 py-1 px-3 rounded-full">
            Remote
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-content mb-4">
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          <span>{getTimeAgo(job.postedDate)}</span>
        </div>
        <span className="font-semibold text-heading">{job.salary}</span>
      </div>

      <a
        href={job.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-center"
      >
        Apply Now →
      </a>
    </motion.div>
  );
};

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a job title or keyword');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const results = await jobsService.searchJobs({
        query: searchQuery,
        location: location,
        page: 1
      });
      setJobs(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      {/* Search Section */}
      <div className="bg-white rounded-xl border border-border p-6 mb-8">
        <h2 className="text-2xl font-bold text-heading mb-6">Find Your Dream Job</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-heading mb-2">Job Title or Keywords</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. React Developer, Designer, Marketing"
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-heading mb-2">Location</label>
            <div className="relative">
              <LocationMarkerIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Mumbai, Remote"
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Jobs'}
        </button>
      </div>

      {/* Results Section */}
      {error && (
        <div className="text-center py-10">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm max-w-md mx-auto">
            {error}
          </div>
          <button 
            onClick={handleSearch}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}

      {loading && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)}
        </motion.div>
      )}

      {!loading && !error && !hasSearched && (
        <motion.div 
          variants={itemVariants} 
          initial="hidden" 
          animate="visible" 
          className="text-center bg-white p-16 rounded-xl border border-border"
        >
          <BriefcaseIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-heading mb-2">Start Your Job Search</h3>
          <p className="text-content">Enter a job title or keyword above to find opportunities</p>
        </motion.div>
      )}

      {!loading && !error && hasSearched && jobs.length === 0 && (
        <motion.div 
          variants={itemVariants} 
          initial="hidden" 
          animate="visible" 
          className="text-center bg-white p-16 rounded-xl border border-border"
        >
          <BriefcaseIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-heading mb-2">No jobs found</h3>
          <p className="text-content">Try adjusting your search criteria</p>
        </motion.div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-heading">
              Found {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </h2>
          </div>
          
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default Jobs;
