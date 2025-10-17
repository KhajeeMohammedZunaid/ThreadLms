import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DownloadIcon, BellIcon, UserCircleIcon } from '../components/icons';
import { useAuth } from '../src/hooks/useAuth';
import userService from '../src/services/user.service';
import { handleError } from '../src/utils/errorHandler';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 } as const;

interface SettingsData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  courseUpdates: boolean;
  projectComments: boolean;
  collaborationInvites: boolean;
  profileVisibility: string;
  showEmail: boolean;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy'>('notifications');
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    pushNotifications: false,
    courseUpdates: true,
    projectComments: true,
    collaborationInvites: true,
    profileVisibility: 'public',
    showEmail: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      const userId = user?._id || user?.id;
      if (!userId) return;

      try {
        setIsLoading(true);
        const userSettings = await userService.getUserSettings(userId);
        
        setSettings(prev => ({
          ...prev,
          emailNotifications: userSettings.emailNotifications,
          pushNotifications: userSettings.pushNotifications,
          courseUpdates: userSettings.courseUpdates,
          projectComments: userSettings.projectComments,
          collaborationInvites: userSettings.collaborationInvites,
        }));
      } catch (error) {
        console.error('Failed to load settings:', error);
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleToggle = (key: keyof SettingsData) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (key: keyof SettingsData, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Save notification settings to backend
      await userService.updateUserSettings(userId, {
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        courseUpdates: settings.courseUpdates,
        projectComments: settings.projectComments,
        collaborationInvites: settings.collaborationInvites,
      });

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings. Please try again.');
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'notifications' as const, label: 'Notifications', icon: BellIcon },
    { id: 'privacy' as const, label: 'Privacy', icon: UserCircleIcon },
  ];

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-heading">Settings</h1>
        <p className="text-content mt-2">Manage your account preferences and settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-content hover:text-heading'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-heading mb-4">Notification Settings</h2>
                  <p className="text-content text-sm mb-6">Choose how you want to be notified about updates</p>
                </div>

                <div className="space-y-4">
                  <SettingToggle
                    label="Email Notifications"
                    description="Receive notifications via email"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                  <SettingToggle
                    label="Push Notifications"
                    description="Receive push notifications in browser"
                    checked={settings.pushNotifications}
                    onChange={() => handleToggle('pushNotifications')}
                  />
                  <SettingToggle
                    label="Course Updates"
                    description="Get notified about new content in enrolled courses"
                    checked={settings.courseUpdates}
                    onChange={() => handleToggle('courseUpdates')}
                  />
                  <SettingToggle
                    label="Project Comments"
                    description="Notifications when someone comments on your projects"
                    checked={settings.projectComments}
                    onChange={() => handleToggle('projectComments')}
                  />
                  <SettingToggle
                    label="Collaboration Invites"
                    description="Get notified about collaboration opportunities"
                    checked={settings.collaborationInvites}
                    onChange={() => handleToggle('collaborationInvites')}
                  />
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-heading mb-4">Privacy Settings</h2>
                  <p className="text-content text-sm mb-6">Control your profile visibility and data sharing</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Profile Visibility</label>
                    <select
                      value={settings.profileVisibility}
                      onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="public">Public - Anyone can see your profile</option>
                      <option value="students">Students Only - Only enrolled students</option>
                      <option value="private">Private - Only you can see your profile</option>
                    </select>
                  </div>

                  <SettingToggle
                    label="Show Email Address"
                    description="Display your email on your public profile"
                    checked={settings.showEmail}
                    onChange={() => handleToggle('showEmail')}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          {saveMessage && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}
            >
              {saveMessage}
            </motion.p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <DownloadIcon className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
};

// Toggle Component
const SettingToggle: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
    <div>
      <h3 className="font-medium text-heading">{label}</h3>
      <p className="text-sm text-content">{description}</p>
    </div>
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-slate-300'
      }`}
      aria-label={`Toggle ${label}`}
    >
      <motion.div
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
      />
    </button>
  </div>
);

export default Settings;
