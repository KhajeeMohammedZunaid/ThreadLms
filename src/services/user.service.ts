/**
 * User Service
 * Handles all user-related API operations
 */

import api, { getErrorMessage } from './api';
import { API_ENDPOINTS } from '../config/constants';
import { User } from './auth.service';

// Types
export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  headline?: string;
  registerNumber?: string;
  degree?: string;
  batch?: string;
  college?: string;
  aboutMe?: string;
  bio?: string;
  title?: string; // Professional title for faculty
  profilePicture?: string;
  skills?: string[];
  branch?: string;
  semester?: number;
  department?: string;
  specialization?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}

export interface EnrollmentData {
  courseId: string;
}

export interface ProgressData {
  courseId: string;
  itemId: string;
  completed: boolean;
}

export interface AssignmentSubmissionData {
  courseId: string;
  itemId: string;
  submissionLink: string;
}

export interface NoteData {
  courseId: string;
  itemId: string;
  content: string;
  title: string;
}

class UserService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User> {
    try {
      const response = await api.get<{ status: string; data: { user: User } }>(
        API_ENDPOINTS.USERS.PROFILE(userId)
      );
      return response.data.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: UpdateProfileData): Promise<User> {
    try {
      const response = await api.put<{ status: string; data: { user: User } }>(
        API_ENDPOINTS.USERS.UPDATE_PROFILE(userId),
        data
      );
      return response.data.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get user enrollments
   */
  async getUserEnrollments(userId: string): Promise<any[]> {
    try {
      const response = await api.get<{ status: string; data: { enrollments: any[] } }>(
        API_ENDPOINTS.USERS.ENROLLMENTS(userId)
      );
      return response.data.data.enrollments;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Enroll in a course
   */
  async enrollInCourse(data: EnrollmentData): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.USERS.ENROLL, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update course progress
   */
  async updateCourseProgress(data: ProgressData): Promise<any> {
    try {
      const response = await api.put(API_ENDPOINTS.USERS.UPDATE_PROGRESS, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Submit assignment
   */
  async submitAssignment(data: AssignmentSubmissionData): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.USERS.SUBMIT_ASSIGNMENT, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Submit quiz score
   */
  async submitQuizScore(data: { courseId: string; itemId: string; score: number; answers: number[] }): Promise<any> {
    try {
      const response = await api.post('/users/submit-quiz', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Refresh user data (call after quiz submission to update certificates)
   */
  async refreshUserData(): Promise<void> {
    try {
      // This will be handled by the auth context automatically
      // Just trigger a re-fetch by calling getCurrentUser or similar
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }

  /**
   * Save course note
   */
  async saveCourseNote(data: NoteData): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.USERS.SAVE_NOTE, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get user certificates
   */
  async getUserCertificates(userId: string): Promise<any[]> {
    try {
      const response = await api.get<{ status: string; data: { certificates: any[] } }>(
        API_ENDPOINTS.USERS.CERTIFICATES(userId)
      );
      return response.data.data.certificates;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const response = await api.get<{ status: string; data: { notifications: any[] } }>(
        API_ENDPOINTS.USERS.NOTIFICATIONS(userId)
      );
      return response.data.data.notifications;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(API_ENDPOINTS.USERS.MARK_NOTIFICATION_READ(notificationId));
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get leaderboard with student rankings
   */
  async getLeaderboard(): Promise<any[]> {
    try {
      const response = await api.get<{ status: string; data: { leaderboard: any[] } }>(
        '/users/leaderboard'
      );
      return response.data.data.leaderboard;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get user's sticky notes
   */
  async getUserNotes(): Promise<any[]> {
    try {
      const response = await api.get<{ status: string; data: { notes: any[] } }>(
        '/users/notes'
      );
      return response.data.data.notes;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Save or update a sticky note
   */
  async saveStickyNote(note: any): Promise<any> {
    try {
      const response = await api.post<{ status: string; data: { notes: any[] } }>(
        '/users/notes',
        note
      );
      return response.data.data.notes;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Save or update a sticky note (alias for saveStickyNote)
   */
  async saveNote(note: any): Promise<any> {
    return this.saveStickyNote(note);
  }

  /**
   * Delete a sticky note
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      await api.delete(`/users/notes/${noteId}`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get user notification settings
   */
  async getUserSettings(userId: string): Promise<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    courseUpdates: boolean;
    projectComments: boolean;
    collaborationInvites: boolean;
  }> {
    try {
      const response = await api.get<{ 
        status: string; 
        data: { 
          settings: {
            emailNotifications: boolean;
            pushNotifications: boolean;
            courseUpdates: boolean;
            projectComments: boolean;
            collaborationInvites: boolean;
          }
        } 
      }>(`/users/settings/${userId}`);
      return response.data.data.settings;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update user notification settings
   */
  async updateUserSettings(userId: string, settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    courseUpdates: boolean;
    projectComments: boolean;
    collaborationInvites: boolean;
  }): Promise<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    courseUpdates: boolean;
    projectComments: boolean;
    collaborationInvites: boolean;
  }> {
    try {
      const response = await api.put<{ 
        status: string; 
        message: string;
        data: { 
          settings: {
            emailNotifications: boolean;
            pushNotifications: boolean;
            courseUpdates: boolean;
            projectComments: boolean;
            collaborationInvites: boolean;
          }
        } 
      }>(`/users/settings/${userId}`, settings);
      return response.data.data.settings;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export default new UserService();
