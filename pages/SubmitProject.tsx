import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types';
import { ArrowLeftIcon, XIcon } from '../components/icons';
import { useAuth } from '../src/hooks/useAuth';
import projectService from '../src/services/project.service';
import { handleError } from '../src/utils/errorHandler';

type NewProjectData = Omit<Project, 'id' | 'authorName' | 'authorAvatar' | 'likes' | 'views' | 'isLiked'>;

const STEPS = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Media & Links' },
  { id: 3, name: 'Tags & Details' },
  { id: 4, name: 'Review & Submit' },
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
        <textarea {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]" />
    </div>
);

const SubmitProject: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const isEditMode = projectId !== undefined;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<NewProjectData>({
    title: '',
    description: '',
    imageUrl: '',
    projectUrl: '',
    tags: [],
    branch: 'Computer Science',
    category: 'Web Dev',
  });
  const [tagInput, setTagInput] = useState('');
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [projectBackendId, setProjectBackendId] = useState<string | null>(null);


  useEffect(() => {
    const loadProject = async () => {
      if (isEditMode && projectId && user) {
        try {
          const backendProject = await projectService.getProjectById(projectId);
          
          setFormData({
            title: backendProject.title,
            description: backendProject.description,
            imageUrl: backendProject.imageUrl,
            projectUrl: backendProject.projectUrl,
            tags: backendProject.tags,
            branch: backendProject.branch,
            category: backendProject.category,
          });
          setProjectBackendId(backendProject._id);
          
          if (backendProject.imageUrl.startsWith('data:image')) {
            setImageSource('upload');
          }
          
        } catch (err) {
          console.error('❌ Error loading project from backend:', err);
          setError(handleError(err));
        }
      }
    };

    loadProject();
  }, [isEditMode, projectId, user]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File is too large. Please select an image under 2MB.');
        return;
    }

    // If user is authenticated, upload to backend
    if (user) {
      try {
        setUploadingImage(true);
        setError(null);
        
        const result = await projectService.uploadProjectImage(file);
        setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
      } catch (err) {
        console.error('Error uploading image:', err);
        setError(handleError(err));
        
        // Fallback to base64 encoding
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      } finally {
        setUploadingImage(false);
      }
    } else {
      // Fallback to base64 encoding if not authenticated
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
        e.preventDefault();
        if (!formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({...prev, tags: [...prev.tags, tagInput.trim()]}));
        }
        setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({...prev, tags: prev.tags.filter(tag => tag !== tagToRemove)}));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to submit a project.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const finalData: NewProjectData = {
        ...formData,
        category: formData.category || 'Web Dev'
      };

      // Prepare backend payload
      const projectPayload = {
        title: finalData.title,
        description: finalData.description,
        imageUrl: finalData.imageUrl,
        projectUrl: finalData.projectUrl,
        tags: finalData.tags,
        branch: finalData.branch,
        category: finalData.category
      };

      if (isEditMode && projectBackendId) {
        // Update existing project
        await projectService.updateProject(projectBackendId, projectPayload);
      } else {
        // Create new project
        const newProject = await projectService.createProject(projectPayload);
      }

      // Navigate to my projects page
      navigate('/my-projects');
    } catch (err) {
      console.error('❌ Error submitting project:', err);
      setError(handleError(err));
      setSubmitting(false);
    }
  };
  
  const isStepValid = () => {
    switch (currentStep) {
        case 1: return formData.title.trim() !== '' && formData.description.trim() !== '';
        case 2: return formData.imageUrl.trim() !== '' && formData.projectUrl.trim() !== '';
        case 3: return formData.tags.length > 0;
        default: return true;
    }
  };
  
  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
        <div className="max-w-3xl mx-auto">
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            <button onClick={() => navigate(isEditMode ? '/my-projects' : '/projects')} className="flex items-center gap-2 font-semibold text-content hover:text-heading mb-6">
                <ArrowLeftIcon /> {isEditMode ? 'Back to My Projects' : 'Back to Showcase'}
            </button>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-heading">{isEditMode ? 'Edit Project' : 'Submit Your Project'}</h1>
                <p className="text-lg text-content mt-2">{isEditMode ? 'Update the details of your project.' : 'Share your creation with the community!'}</p>
            </div>

            <div className="w-full max-w-2xl mx-auto mb-8 px-4">
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
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-border max-w-2xl mx-auto min-h-[350px]">
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial="initial" animate="animate" exit="exit" variants={stepVariants} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                        {currentStep === 1 && <div className="space-y-4">
                            <h3 className="font-bold text-lg text-heading">Project Basics</h3>
                            <InputField name="title" label="Project Title" value={formData.title} onChange={handleChange} placeholder="e.g., Personal Portfolio Website" />
                            <TextareaField name="description" label="Project Description" value={formData.description} onChange={handleChange} placeholder="Describe your project in a few sentences." />
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Branch</label>
                                    <select name="branch" value={formData.branch} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                                        <option>Computer Science</option><option>Electrical</option><option>Mechanical</option><option>Civil</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                                    <InputField name="category" label="" value={formData.category} onChange={handleChange} placeholder="e.g., Web Dev" />
                                </div>
                            </div>
                        </div>}
                        {currentStep === 2 && <div className="space-y-4">
                            <h3 className="font-bold text-lg text-heading">Media & Links</h3>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Project Image</label>
                                <div className="flex items-center gap-4 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="imageSource" value="url" checked={imageSource === 'url'} onChange={() => setImageSource('url')} className="h-4 w-4 text-primary focus:ring-primary" />
                                        <span className="text-sm font-medium text-slate-700">From URL</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="imageSource" value="upload" checked={imageSource === 'upload'} onChange={() => setImageSource('upload')} className="h-4 w-4 text-primary focus:ring-primary" />
                                        <span className="text-sm font-medium text-slate-700">Upload File</span>
                                    </label>
                                </div>
                                
                                {imageSource === 'url' ? (
                                    <InputField name="imageUrl" label="" value={formData.imageUrl.startsWith('data:image') ? '' : formData.imageUrl} onChange={handleChange} placeholder="https://images.unsplash.com/..." />
                                ) : (
                                    <div>
                                    <input 
                                        type="file"
                                        accept="image/png, image/jpeg, image/gif"
                                        onChange={handleImageFileChange}
                                        disabled={uploadingImage}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        {uploadingImage ? 'Uploading image...' : 'Maximum file size: 2MB.'}
                                    </p>
                                    </div>
                                )}

                                {formData.imageUrl && (
                                    <div className="mt-4">
                                    <p className="text-sm font-medium text-slate-600 mb-1">Image Preview:</p>
                                    <img src={formData.imageUrl} alt="Project Preview" className="rounded-lg w-full h-48 object-cover border border-slate-200" />
                                    </div>
                                )}
                            </div>
                            <InputField name="projectUrl" label="Project URL" value={formData.projectUrl} onChange={handleChange} placeholder="https://github.com/user/repo" />
                        </div>}
                        {currentStep === 3 && <div>
                            <h3 className="font-bold text-lg text-heading">Technologies & Tags</h3>
                            <p className="text-sm text-content mb-4">Add tags that describe your project. Press Enter to add a tag.</p>
                            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
                                {formData.tags.map(tag => (
                                    <div key={tag} className="flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded">
                                        {tag}
                                        <button onClick={() => removeTag(tag)}><XIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <input 
                                    type="text" 
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="e.g., React"
                                    className="flex-1 bg-transparent outline-none p-1 text-slate-800"
                                />
                            </div>
                        </div>}
                        {currentStep === 4 && <div>
                             <h3 className="font-bold text-lg text-heading mb-4">Review Your Submission</h3>
                             <div className="space-y-2 text-sm">
                                <p><strong>Title:</strong> {formData.title}</p>
                                <p><strong>Branch:</strong> {formData.branch}</p>
                                <p><strong>Category:</strong> {formData.category}</p>
                                <p><strong>Description:</strong> {formData.description}</p>
                                <p><strong>Image URL:</strong> <a href={formData.imageUrl} className="text-primary underline truncate block" target="_blank" rel="noopener noreferrer">{formData.imageUrl}</a></p>
                                <p><strong>Project URL:</strong> <a href={formData.projectUrl} className="text-primary underline truncate block" target="_blank" rel="noopener noreferrer">{formData.projectUrl}</a></p>
                                <p><strong>Tags:</strong> {formData.tags.join(', ')}</p>
                            </div>
                        </div>}
                    </motion.div>
                </AnimatePresence>
                
                <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                    <motion.button onClick={prevStep} disabled={currentStep === 1} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        Back
                    </motion.button>
                    {currentStep < STEPS.length ? (
                        <motion.button onClick={nextStep} disabled={!isStepValid()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed">
                            Next
                        </motion.button>
                    ) : (
                        <motion.button 
                            onClick={handleSubmit} 
                            disabled={submitting}
                            whileHover={{ scale: submitting ? 1 : 1.05 }} 
                            whileTap={{ scale: submitting ? 1 : 0.95 }} 
                            className="bg-secondary hover:bg-secondary/80 text-white font-bold py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : (isEditMode ? 'Save Changes' : 'Submit Project')}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    </motion.div>
  )
};

export default SubmitProject;