import User from '../models/User.model';
import Faculty from '../models/Faculty.model';
import { NotificationType } from '../types';

/**
 * Generate unique notification ID
 */
const generateNotificationId = (): string => {
  return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create and save a notification for a user
 * Respects user notification settings
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  message: string,
  link: string
): Promise<void> => {
  try {
    // Try to find user in User collection first
    let user = await User.findById(userId);
    
    // If not found, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId);
    }
    
    if (!user) {
      console.error(`User not found for notification: ${userId}`);
      return;
    }

    // Check user notification settings (only for non-critical notifications)
    // Always create: WELCOME, NEW_ENROLLMENT, GRADE_UPDATE (critical)
    const criticalTypes = ['WELCOME', 'NEW_ENROLLMENT', 'GRADE_UPDATE'];
    
    if (!criticalTypes.includes(type) && user.notificationSettings) {
      const settings = user.notificationSettings;
      
      // Check if user has disabled this type of notification
      if (type === 'COURSE_UPDATE' && !settings.courseUpdates) {
        console.log(`⏭️  Skipping COURSE_UPDATE notification for user ${userId} (disabled in settings)`);
        return;
      }
      if (type === 'NEW_COURSE' && !settings.courseUpdates) {
        console.log(`⏭️  Skipping NEW_COURSE notification for user ${userId} (disabled in settings)`);
        return;
      }
      if (type === 'COLLABORATION_REQUEST' && !settings.collaborationInvites) {
        console.log(`⏭️  Skipping COLLABORATION_REQUEST notification for user ${userId} (disabled in settings)`);
        return;
      }
      if (type === 'DISCUSSION_REPLY' && !settings.projectComments) {
        console.log(`⏭️  Skipping DISCUSSION_REPLY notification for user ${userId} (disabled in settings)`);
        return;
      }
    }

    // Create notification object
    const notification = {
      id: generateNotificationId(),
      type,
      message,
      timestamp: new Date(),
      isRead: false,
      link
    };

    // Add to user's notifications array
    if (!user.notifications) {
      user.notifications = [];
    }
    
    user.notifications.push(notification as any);
    await user.save();

    console.log(`✅ Notification created for user ${userId}: ${type}`);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

/**
 * Create notifications for multiple users (bulk)
 */
export const createBulkNotifications = async (
  userIds: string[],
  type: NotificationType,
  message: string,
  link: string
): Promise<void> => {
  try {
    const promises = userIds.map(userId => 
      createNotification(userId, type, message, link)
    );
    await Promise.all(promises);
    console.log(`✅ Bulk notifications created for ${userIds.length} users`);
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
  }
};
