

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePictureUploader from '../components/ProfilePictureUploader';
import { CoursesIcon, CertificateIcon, BadgeIcon } from '../components/icons';
import { User } from '../types';
import { useAuth } from '../src/hooks/useAuth';
import userService from '../src/services/user.service';
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

const tabContentVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 },
};

const InputField = ({ label, ...props }: {label: string} & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <input id={props.name} {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none" />
    </div>
);

const TextareaField = ({ label, ...props }: {label: string} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <textarea id={props.name} {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none min-h-[120px]" />
    </div>
);

const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({ courses: 0, certificates: 0, badges: 0 });
    
    // Fetch profile data from backend
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
                    setFormData(user as any);
                    setLoading(false);
                    return;
                }
                
                const profileData = await userService.getUserProfile(userId);
                setFormData(profileData as any);
            } catch (err) {
                console.error('❌ Error fetching profile:', err);
                setError(handleError(err));
                // Fallback to user from context
                setFormData(user as any);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    // Fetch real stats from backend
    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            
            try {
                // Get user ID with fallback
                const userId = user._id || user.id;
                if (!userId) return;
                
                const enrollments = await userService.getUserEnrollments(userId);
                
                // Try to get certificates, handle gracefully if none exist
                let certificates = [];
                try {
                    certificates = await userService.getUserCertificates(userId);
                } catch (certErr: any) {
                    if (certErr.message?.includes('Invalid ID') || certErr.message?.includes('400')) {
                        certificates = [];
                    }
                }
                
                setStats({ 
                    courses: enrollments.length || 0, 
                    certificates: certificates.length || 0, 
                    badges: 0 // TODO: Add badges API
                });
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };
        fetchStats();
    }, [user]);

    const [initialFormData, setInitialFormData] = useState<User | null>(null);

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
        setFormData(prev => prev ? ({ ...prev, [name]: value } as any) : null);
    };

    const handleImageChange = (newImage: string) => {
        setFormData(prev => prev ? ({...prev, profilePicture: newImage} as any) : null);
        // Also update auth context immediately
        if (user) {
            updateUser({ ...user, profilePicture: newImage });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasChanges || !user || !formData) return;
        
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
            
            // Update via API - Include ALL editable fields
            const updatedProfile = await userService.updateUserProfile(userId, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                headline: formData.headline,
                registerNumber: formData.registerNumber,
                degree: formData.degree,
                batch: formData.batch,
                college: formData.college,
                aboutMe: (formData as any).aboutMe,
                profilePicture: formData.profilePicture,
            });
            
            // Update auth context
            updateUser(updatedProfile);
            
            // Update initial form data to reflect saved state (this will make hasChanges = false)
            setInitialFormData(JSON.parse(JSON.stringify(formData)));
            
            // Show success message immediately (unsaved changes modal will disappear due to hasChanges = false)
            setSaving(false); // Stop saving state first
            setSaveSuccess(true);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);
        } catch (err) {
            console.error('❌ Failed to save profile:', err);
            setError(handleError(err));
            setSaving(false);
        }
    };
    
    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p className="font-bold">Error loading profile</p>
                    <p>Could not load profile data</p>
                </div>
            </div>
        );
    }
    
    const TABS = [
        { id: 'personal', label: 'Personal Details' },
        { id: 'account', label: 'Account Settings' },
    ];

    return (
        <>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                <h1 className="text-4xl font-bold text-heading mb-8">My Profile</h1>
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}
                <form id="profile-form" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-4 xl:col-span-3">
                            <div className="bg-white p-6 rounded-xl border border-border text-center sticky top-10">
                                <ProfilePictureUploader initialImage={formData.profilePicture} onImageChange={handleImageChange} />
                                <h2 className="text-2xl font-bold text-heading mt-4">{formData.firstName} {formData.lastName}</h2>
                                <p className="text-content">{formData.headline}</p>

                                <div className="mt-6 pt-6 border-t border-border flex justify-around">
                                    <div className="text-center">
                                        <CoursesIcon className="mx-auto text-content w-6 h-6"/>
                                        <p className="font-bold text-lg text-heading">{stats.courses}</p>
                                        <p className="text-xs text-content">Courses</p>
                                    </div>
                                    <div className="text-center">
                                        <CertificateIcon className="mx-auto text-content w-6 h-6"/>
                                        <p className="font-bold text-lg text-heading">{stats.certificates}</p>
                                        <p className="text-xs text-content">Certificates</p>
                                    </div>
                                    <div className="text-center">
                                        <BadgeIcon className="mx-auto text-content w-6 h-6"/>
                                        <p className="font-bold text-lg text-heading">{stats.badges}</p>
                                        <p className="text-xs text-content">Badges</p>
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
                                                        ? 'border-primary text-primary'
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                                                    <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                                                </div>
                                                <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                                                <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                                                <InputField label="Headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g., Student at LMS Platform" />
                                                
                                                <div className="pt-6 border-t border-border">
                                                    <h3 className="text-lg font-bold text-heading mb-4">Academic Information</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <InputField label="Register Number" name="registerNumber" value={formData.registerNumber} onChange={handleChange} />
                                                        <InputField label="Degree" name="degree" value={formData.degree} onChange={handleChange} />
                                                        <InputField label="Batch" name="batch" value={formData.batch} onChange={handleChange} />
                                                        <InputField label="College" name="college" value={formData.college} onChange={handleChange} />
                                                    </div>
                                                </div>

                                                <TextareaField label="About Me" name="aboutMe" value={formData.aboutMe} onChange={handleChange} />
                                            </div>
                                        )}
                                        {activeTab === 'account' && (
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-lg font-bold text-heading">Change Password</h3>
                                                    <div className="mt-4 space-y-4">
                                                        <InputField label="Current Password" name="currentPassword" type="password" />
                                                        <InputField label="New Password" name="newPassword" type="password" />
                                                        <InputField label="Confirm New Password" name="confirmPassword" type="password" />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg">
                                                        Update Password
                                                    </motion.button>
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
                                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

export default Profile;
