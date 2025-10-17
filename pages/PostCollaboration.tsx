import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CollaborationPost } from '../types';
import { ArrowLeftIcon, XIcon, PlusIcon } from '../components/icons';
import { useAuth } from '../src/hooks/useAuth';
import collaborationService from '../src/services/collaboration.service';
import { handleError } from '../src/utils/errorHandler';

type NewPostData = Omit<CollaborationPost, 'id' | 'authorName' | 'authorAvatar' | 'members'>;

const STEPS = [
  { id: 1, name: 'Project Idea' },
  { id: 2, name: 'Team Details' },
  { id: 3, name: 'Review & Post' },
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;
const stepVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const InputField: React.FC<{ label: string } & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none" />
    </div>
);
const TextareaField: React.FC<{ label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <textarea {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none min-h-[120px]" />
    </div>
);

const PostCollaboration: React.FC<{ handleAddPost: (post: NewPostData) => void }> = ({ handleAddPost }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<NewPostData>({
    title: '',
    description: '',
    requiredSkills: [],
    branch: 'Computer Science',
    teamSize: 2,
  });
  const [skillInput, setSkillInput] = useState('');
  
  // Backend state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.idea) {
        const { idea } = location.state;
        setFormData(prev => ({
            ...prev,
            title: idea.title || '',
            description: idea.description || '',
            requiredSkills: idea.requiredSkills || [],
        }));
    }
  }, [location.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTeamSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(2, Math.min(10, parseInt(e.target.value, 10) || 2));
    setFormData(prev => ({...prev, teamSize: value}));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim() !== '') {
        e.preventDefault();
        if (!formData.requiredSkills.includes(skillInput.trim())) {
            setFormData(prev => ({...prev, requiredSkills: [...prev.requiredSkills, skillInput.trim()]}));
        }
        setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({...prev, requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)}));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to post a collaboration');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Submit to backend
      await collaborationService.createCollaboration({
        title: formData.title,
        description: formData.description,
        branch: formData.branch,
        requiredSkills: formData.requiredSkills,
        teamSize: formData.teamSize
      });
      
      // Also call prop handler for backward compatibility
      handleAddPost(formData);
      
      navigate('/collaborate');
    } catch (error) {
      console.error('Failed to create collaboration:', error);
      setError(handleError(error));
    } finally {
      setSubmitting(false);
    }
  };
  
  const isStepValid = () => {
    switch (currentStep) {
        case 1: return formData.title.trim() !== '' && formData.description.trim() !== '';
        case 2: return formData.requiredSkills.length > 0 && formData.teamSize >= 2;
        default: return true;
    }
  };
  
  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
        <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/collaborate')} className="flex items-center gap-2 font-semibold text-content hover:text-heading mb-6">
                <ArrowLeftIcon /> Back to Collaboration Hub
            </button>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-heading">Post a Project Idea</h1>
                <p className="text-lg text-content mt-2">Find the perfect team to bring your vision to life.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="w-full max-w-lg mx-auto mb-8 px-4">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= step.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {step.id}
                                </div>
                                <p className={`mt-2 text-xs text-center ${currentStep >= step.id ? 'text-heading font-semibold' : 'text-content'}`}>{step.name}</p>
                            </div>
                            {index < STEPS.length - 1 && <div className={`flex-1 h-1 mx-2 ${currentStep > index + 1 ? 'bg-primary' : 'bg-slate-200'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-border max-w-2xl mx-auto min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial="initial" animate="animate" exit="exit" variants={stepVariants} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                        {currentStep === 1 && <div className="space-y-4">
                            <h3 className="font-bold text-lg text-heading">1. Describe Your Idea</h3>
                            <InputField name="title" label="Project Title" value={formData.title} onChange={handleChange} placeholder="e.g., AI-Powered Learning Assistant" />
                            <TextareaField name="description" label="Detailed Description" value={formData.description} onChange={handleChange} placeholder="Explain your project idea, its goals, and what you hope to achieve." />
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Branch</label>
                                <select name="branch" value={formData.branch} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                                    <option>Computer Science</option><option>Electrical</option><option>Mechanical</option><option>Civil</option><option>Interdisciplinary</option>
                                </select>
                            </div>
                        </div>}
                        {currentStep === 2 && <div className="space-y-4">
                            <h3 className="font-bold text-lg text-heading">2. Build Your Team</h3>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">What skills are you looking for?</label>
                                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
                                    {formData.requiredSkills.map(skill => (
                                        <div key={skill} className="flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded">
                                            {skill}
                                            <button onClick={() => removeSkill(skill)}><XIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <input 
                                        type="text" 
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={handleSkillKeyDown}
                                        placeholder="Add a skill and press Enter"
                                        className="flex-1 bg-transparent outline-none p-1 text-slate-800"
                                    />
                                </div>
                            </div>
                            <InputField type="number" name="teamSize" label="Ideal Team Size (including you)" value={formData.teamSize} onChange={handleTeamSizeChange} min="2" max="10" />
                        </div>}
                        {currentStep === 3 && <div>
                             <h3 className="font-bold text-lg text-heading mb-4">3. Review & Post</h3>
                             <div className="space-y-3 text-sm bg-slate-50 p-4 rounded-lg border border-border">
                                <p><strong>Title:</strong> {formData.title}</p>
                                <p><strong>Branch:</strong> {formData.branch}</p>
                                <p><strong>Description:</strong> {formData.description}</p>
                                <p><strong>Team Size:</strong> {formData.teamSize} members</p>
                                <p><strong>Required Skills:</strong> {formData.requiredSkills.join(', ')}</p>
                            </div>
                            <p className="text-xs text-content mt-4">By posting this project idea, you agree to collaborate respectfully with other students and adhere to the community guidelines.</p>
                        </div>}
                    </motion.div>
                </AnimatePresence>
                
                <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                    <motion.button 
                        onClick={prevStep} 
                        disabled={currentStep === 1} 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }} 
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </motion.button>
                    {currentStep < STEPS.length ? (
                        <motion.button 
                            onClick={nextStep} 
                            disabled={!isStepValid()} 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }} 
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            Next
                        </motion.button>
                    ) : (
                        <motion.button 
                            onClick={handleSubmit} 
                            disabled={submitting}
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }} 
                            className="bg-secondary hover:bg-secondary/80 text-white font-bold py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {submitting ? 'Posting...' : 'Post Idea'}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    </motion.div>
  )
};

export default PostCollaboration;