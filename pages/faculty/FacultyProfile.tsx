import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePictureUploader from '../../components/ProfilePictureUploader';
import { StudentsIcon, StarIcon, CoursesIcon } from '../../components/icons';
import { useAuth } from '../../src/hooks/useAuth';
import userService from '../../src/services/user.service';
import { handleError } from '../../src/utils/errorHandler';

// Types
interface FacultyProfileData {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture: string;
    bio?: string;
    title?: string;
    role: 'faculty' | 'student';
}

interface FacultyStats {
    totalStudents: number;
    averageRating: number;
    totalCourses: number;
}

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

const tabContentVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 },
};

const InputField: React.FC<{ label: string } & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <input id={props.name} {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-faculty-primary focus:outline-none" />
    </div>
);

const TextareaField: React.FC<{ label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <textarea id={props.name} {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-faculty-primary focus:outline-none min-h-[120px]" />
    </div>
);

const FacultyProfile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState<FacultyProfileData | null>(null);
    const [initialFormData, setInitialFormData] = useState<FacultyProfileData | null>(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<FacultyStats>({ totalStudents: 0, averageRating: 0, totalCourses: 0 });
    
    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                setError(null);
                
                // Get user ID with fallback
                const userId = user._id || user.id;
                if (!userId) {
                    console.error('❌ No user ID available');
                    setError('User ID not found');
                    setFormData(null);
                    setLoading(false);
                    return;
                }
                
                console.log('👤 Fetching faculty profile...', userId);
                const profile = await userService.getUserProfile(userId);
                console.log('✅ Profile fetched:', profile);
                setFormData(profile);
                
                // TODO: Fetch faculty stats from backend once available
                // For now using placeholder values
                setStats({
                    totalStudents: 0,
                    averageRating: 0,
                    totalCourses: 0,
                });
            } catch (err) {
                console.error('❌ Failed to fetch profile:', err);
                setError(handleError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    // Set initial form data once profile is loaded
    useEffect(() => {
        if (formData && !initialFormData) {
            setInitialFormData(JSON.parse(JSON.stringify(formData)));
        }
    }, [formData, initialFormData]);

    const hasChanges = useMemo(() => {
        if (!formData || !initialFormData) return false;
        return JSON.stringify(formData) !== JSON.stringify(initialFormData);
    }, [formData, initialFormData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleImageChange = (newImage: string) => {
        setFormData(prev => prev ? ({...prev, profilePicture: newImage}) : null);
        // Also update auth context immediately
        if (user) {
            updateUser({ ...user, profilePicture: newImage });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasChanges || !formData || !user) return;

        try {
            setSaving(true);
            setError(null);
            setSaveSuccess(false);
            
            // Get user ID with fallback
            const userId = user._id || user.id;
            if (!userId) {
                setError('User ID not found');
                setSaving(false);
                return;
            }
            
            const updatedProfile = await userService.updateUserProfile(userId, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                bio: formData.bio,
                title: formData.title,
                profilePicture: formData.profilePicture,
            });

            // Update auth context
            updateUser(updatedProfile);
            
            // Update formData and initialFormData to reflect saved state (this will reset hasChanges)
            setFormData(updatedProfile);
            setInitialFormData(JSON.parse(JSON.stringify(updatedProfile)));
            
            // Show success message immediately (unsaved changes modal will disappear due to hasChanges = false)
            setSaving(false); // Stop saving state first
            setSaveSuccess(true);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);
        } catch (err) {
            console.error('Failed to save profile:', err);
            setError(handleError(err));
            setSaving(false);
        }
    };
    
    const TABS = [
        { id: 'personal', label: 'Personal & Professional Details' },
        { id: 'account', label: 'Account Settings' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-faculty-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!formData || !user) {
        return (
            <div className="text-center text-red-500 py-8">
                {error || 'Failed to load profile'}
            </div>
        );
    }

    const fullName = `${formData.firstName} ${formData.lastName}`;

    return (
        <>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <h1 className="text-4xl font-bold text-heading mb-8">My Profile</h1>
                
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                <form id="profile-form" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-4 xl:col-span-3">
                            <div className="bg-white p-6 rounded-xl border border-border text-center sticky top-10">
                                <ProfilePictureUploader initialImage={formData.profilePicture} onImageChange={handleImageChange} />
                                <h2 className="text-2xl font-bold text-heading mt-4">{fullName}</h2>
                                <p className="text-faculty-primary font-semibold">{formData.title || 'Faculty Member'}</p>

                                <div className="mt-6 pt-6 border-t border-border space-y-4">
                                    <div className="flex items-center text-left gap-3">
                                        <div className="bg-faculty-primary/10 p-2 rounded-lg"><StudentsIcon className="w-5 h-5 text-faculty-primary"/></div>
                                        <div>
                                            <p className="font-bold text-lg text-heading">{stats.totalStudents.toLocaleString()}</p>
                                            <p className="text-xs text-content">Total Students</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-left gap-3">
                                        <div className="bg-faculty-primary/10 p-2 rounded-lg"><StarIcon className="w-5 h-5 text-faculty-primary"/></div>
                                        <div>
                                            <p className="font-bold text-lg text-heading">{stats.averageRating.toFixed(1)}</p>
                                            <p className="text-xs text-content">Average Rating</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-left gap-3">
                                        <div className="bg-faculty-primary/10 p-2 rounded-lg"><CoursesIcon className="w-5 h-5 text-faculty-primary"/></div>
                                        <div>
                                            <p className="font-bold text-lg text-heading">{stats.totalCourses}</p>
                                            <p className="text-xs text-content">Courses</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-8 xl:col-span-9">
                            <div className="bg-white p-6 rounded-xl border border-border">
                                <div className="border-b border-border mb-6">
                                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                        {TABS.map(tab => (
                                            <button
                                                type="button"
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`${
                                                    activeTab === tab.id
                                                        ? 'border-faculty-primary text-faculty-primary'
                                                        : 'border-transparent text-content hover:text-heading hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        variants={tabContentVariants}
                                        initial="initial"
                                        animate="in"
                                        exit="out"
                                        transition={{ duration: 0.3 }}
                                    >
                                        {activeTab === 'personal' && (
                                            <div className="space-y-6">
                                                <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                                                <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                                                <InputField label="Professional Title" name="title" value={formData.title || ''} onChange={handleChange} placeholder="e.g., Professor of Computer Science" />
                                                <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} disabled />
                                                <TextareaField label="Biography" name="bio" value={formData.bio || ''} onChange={handleChange} />
                                            </div>
                                        )}
                                        {activeTab === 'account' && (
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-lg font-bold text-heading">Change Password</h3>
                                                    <p className="text-sm text-content mt-1">Password change functionality coming soon</p>
                                                    <div className="mt-4 space-y-4 opacity-50 pointer-events-none">
                                                        <InputField label="Current Password" name="currentPassword" type="password" />
                                                        <InputField label="New Password" name="newPassword" type="password" />
                                                        <InputField label="Confirm New Password" name="confirmPassword" type="password" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>
            
            <AnimatePresence>
                {hasChanges && !saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ ease: 'easeInOut' }}
                        className="fixed bottom-4 inset-x-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-40"
                    >
                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-border flex sm:justify-between items-center gap-4">
                            <p className="hidden sm:block text-sm font-semibold text-heading flex-shrink-0">You have unsaved changes.</p>
                            <motion.button
                                type="submit"
                                form="profile-form"
                                disabled={saving}
                                whileHover={{ scale: saving ? 1 : 1.05 }}
                                whileTap={{ scale: saving ? 1 : 0.95 }}
                                className="bg-faculty-primary hover:bg-faculty-primary-dark text-white font-bold py-2 px-5 rounded-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ ease: 'easeInOut' }}
                        className="fixed bottom-4 inset-x-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-40"
                    >
                        <div className="bg-green-500/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-green-600 flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm font-semibold text-white">Changes saved successfully!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FacultyProfile;
