/**
 * Authentication Service
 * Handles login, register, logout, and token management
 */

import api, { getErrorMessage } from './api';
import { API_ENDPOINTS } from '../config/constants';
import { STORAGE_KEYS } from '../config/api.config';

// Types
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'faculty';
  branch?: string;
  semester?: number;
  department?: string;
  specialization?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'student' | 'faculty';
  profilePicture?: string;
  branch?: string;
  semester?: number;
  department?: string;
  specialization?: string;
  bio?: string;
  skills?: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  // Student-specific fields
  enrollments?: Array<{
    courseId: string;
    completedItems: string[];
    enrollmentDate: string;
    progress?: number;
    quizScores?: Array<{
      itemId: string;
      score: number;
    }>;
  }>;
  certificates?: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    completionDate: string;
  }>;
  notes?: any[];
}

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
      
      // Store token and user data
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.data.user);
      } else {
        console.error('❌ No token in response!');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
      
      // Store token and user data
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.data.user);
      } else {
        console.error('❌ No token in response!');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<{ status: string; data: { user: User } }>(
        API_ENDPOINTS.AUTH.ME
      );
      
      // Update stored user data
      this.setUser(response.data.data.user);
      
      return response.data.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    // Don't redirect here - let the component handle navigation
  }

  /**
   * Store JWT token
   */
  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return token;
  }

  /**
   * Store user data
   */
  setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if user is faculty
   */
  isFaculty(): boolean {
    const user = this.getUser();
    return user?.role === 'faculty';
  }

  /**
   * Check if user is student
   */
  isStudent(): boolean {
    const user = this.getUser();
    return user?.role === 'student';
  }
}

export default new AuthService();
