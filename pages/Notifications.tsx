import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Notification } from '../types';
import { BellIcon, CoursesIcon, MessageIcon, ClipboardCheckIcon, CollaborationIcon, PencilAltIcon } from '../components/icons';
import { useAuth } from '../src/hooks/useAuth';
import userService from '../src/services/user.service';
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `Just now`;
};

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'NEW_COURSE':
            return <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center"><CoursesIcon className="w-5 h-5 text-secondary" /></div>;
        case 'COURSE_UPDATE':
            return <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><PencilAltIcon className="w-5 h-5 text-orange-500" /></div>;
        case 'DISCUSSION_REPLY':
            return <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><MessageIcon className="w-5 h-5 text-blue-500" /></div>;
        case 'WELCOME':
            return <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><BellIcon className="w-5 h-5 text-primary" /></div>;
        case 'GRADE_UPDATE':
            return <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><ClipboardCheckIcon className="w-5 h-5 text-green-600" /></div>;
        case 'COLLABORATION_REQUEST':
            return <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"><CollaborationIcon className="w-5 h-5 text-purple-600" /></div>;
        default:
            return <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><BellIcon className="w-5 h-5 text-slate-500" /></div>;
    }
};

const NotificationTag: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    const tagInfo = {
        'NEW_COURSE': { text: 'New Course', color: 'bg-secondary/10 text-secondary' },
        'COURSE_UPDATE': { text: 'Update', color: 'bg-orange-100 text-orange-600' },
        'DISCUSSION_REPLY': { text: 'Discussion', color: 'bg-blue-100 text-blue-600' },
        'GRADE_UPDATE': { text: 'Grade', color: 'bg-green-100 text-green-600' },
        'COLLABORATION_REQUEST': { text: 'Project', color: 'bg-purple-100 text-purple-600' },
        'WELCOME': { text: 'System', color: 'bg-primary/10 text-primary' },
    }[type];

    if (!tagInfo) return null;

    return (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tagInfo.color}`}>
            {tagInfo.text}
        </span>
    );
};

interface NotificationsProps {
    currentUser: User;
    onMarkAsRead: (notificationId: string) => void;
    onMarkAllAsRead: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ currentUser, onMarkAsRead, onMarkAllAsRead }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch notifications from backend
    useEffect(() => {
        const fetchNotifications = async () => {
            const userId = user?._id || user?.id;
            
            if (!userId) {
                // Fallback to currentUser prop if no auth user
                setNotifications([...(currentUser.notifications || [])].sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                ));
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                setError(null);
                const backendNotifications = await userService.getUserNotifications(userId);
                setNotifications(backendNotifications.sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                ));
            } catch (err) {
                console.error('❌ Failed to fetch notifications:', err);
                setError(handleError(err));
                // Fallback to prop data on error
                setNotifications([...(currentUser.notifications || [])].sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                ));
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [user?._id, user?.id, currentUser]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            const userId = user?._id || user?.id;
            // Mark as read in backend if using API
            if (userId) {
                try {
                    await userService.markNotificationAsRead(notification.id);
                    setNotifications(prev => prev.map(n => 
                        n.id === notification.id ? { ...n, isRead: true } : n
                    ));
                } catch (err) {
                    console.error('Failed to mark notification as read:', err);
                }
            }
            // Also call prop handler for compatibility
            onMarkAsRead(notification.id);
        }
        navigate(notification.link);
    };

    const handleMarkAllAsReadClick = async () => {
        // Call prop handler
        onMarkAllAsRead();
        
        // If using backend, mark all unread notifications
        if (user?._id) {
            try {
                const unreadNotifications = notifications.filter(n => !n.isRead);
                await Promise.all(
                    unreadNotifications.map(n => userService.markNotificationAsRead(n.id))
                );
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (err) {
                console.error('Failed to mark all as read:', err);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                {/* This title is now handled by the new Header component */}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {notifications.length > 0 ? (
                <div className="bg-white rounded-xl border border-border">
                    <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-heading">Notifications</h2>
                            {unreadCount > 0 && <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{unreadCount}</span>}
                         </div>
                         <button
                            onClick={handleMarkAllAsReadClick}
                            disabled={unreadCount === 0}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Mark all as read
                        </button>
                    </div>
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="divide-y divide-border">
                        {notifications.map(notification => (
                            <motion.button
                                key={notification.id}
                                variants={itemVariants}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full text-left p-4 sm:p-5 transition-colors ${
                                    !notification.isRead ? 'bg-primary/5' : 'bg-white'
                                } hover:bg-slate-50`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 pt-1">
                                        <NotificationIcon type={notification.type} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <NotificationTag type={notification.type} />
                                            <p className="text-xs text-slate-500 flex-shrink-0 ml-2 whitespace-nowrap">{formatTimeAgo(notification.timestamp)}</p>
                                        </div>
                                        <p className={`text-sm mt-2 ${!notification.isRead ? 'font-semibold text-heading' : 'text-content'}`}>{notification.message}</p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2 flex-shrink-0" title="Unread"></div>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            ) : (
                <div className="text-center py-20 bg-white border-2 border-dashed border-border rounded-xl">
                    <div className="relative inline-block">
                        <BellIcon className="w-16 h-16 text-slate-300" />
                        <motion.div 
                            className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1], transition: { delay: 0.5, type: 'spring' } }}
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-heading mt-6">You're all caught up!</h2>
                    <p className="text-content mt-2 max-w-sm mx-auto">You have no new notifications. We'll let you know when there's something new for you.</p>
                </div>
            )}
        </motion.div>
    );
};

export default Notifications;