/**
 * Course Service
 * Handles all course-related API operations
 */

import api, { getErrorMessage } from './api';
import { API_ENDPOINTS } from '../config/constants';

// Types
export interface Course {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  branch?: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  totalLength?: string;
  imageUrl?: string;
  previewUrl?: string;
  previewVideoUrl?: string;
  rating?: number;
  reviews?: number;
  students?: number;
  totalStudents?: number;
  lessons?: number;
  bestseller?: boolean;
  authorId?: any;
  updated?: Date;
  learnings?: string[];
  requirements?: string[];
  includes?: string[];
  tags?: string[];
  // Course content structure
  content: Array<{
    sectionTitle: string;
    items: Array<{
      type: 'lecture' | 'quiz' | 'assignment';
      title: string;
      duration: string;
      description?: string;
      videoUrl?: string;
      videoType?: 'youtube' | 'upload';
      questions?: Array<{
        questionText: string;
        answerOptions: Array<{
          answerText: string;
          isCorrect: boolean;
        }>;
      }>;
      timeLimit?: number;
      isGraded?: boolean;
    }>;
    resources?: Array<{
      name: string;
      url: string;
    }>;
  }>;
  discussion?: any[];
  finalQuiz?: {
    title: string;
    isEnabled: boolean;
    questions: any[];
    timeLimit?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  courseId: string;
  completedItems: string[];
  overallProgress: number;
  lastAccessed: string;
}

export interface Quiz {
  _id: string;
  courseId: string;
  title: string;
  questions: Array<{
    _id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  duration: number;
  passingScore: number;
}

export interface QuizSubmission {
  quizId: string;
  answers: number[];
  completedAt: string;
}

export interface Certificate {
  _id: string;
  userId: string;
  courseId: string;
  course: {
    title: string;
    faculty: string;
  };
  issuedAt: string;
  certificateUrl: string;
}

class CourseService {
  /**
   * Get all courses
   */
  async getAllCourses(): Promise<Course[]> {
    try {
      const response = await api.get<{ status: string; data: { courses: Course[] } }>(
        API_ENDPOINTS.COURSES.GET_ALL
      );
      return response.data.data.courses;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string): Promise<Course> {
    try {
      const response = await api.get<{ status: string; data: { course: Course } }>(
        API_ENDPOINTS.COURSES.GET_BY_ID(courseId)
      );
      return response.data.data.course;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get courses by faculty ID
   */
  async getCoursesByFaculty(facultyId: string): Promise<Course[]> {
    try {
      const response = await api.get<{ status: string; data: { courses: Course[] } }>(
        `${API_ENDPOINTS.COURSES.GET_ALL}?facultyId=${facultyId}`
      );
      return response.data.data.courses;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get courses by category
   */
  async getCoursesByCategory(category: string): Promise<Course[]> {
    try {
      const response = await api.get<{ status: string; data: { courses: Course[] } }>(
        `${API_ENDPOINTS.COURSES.GET_ALL}?category=${encodeURIComponent(category)}`
      );
      return response.data.data.courses;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Search courses
   */
  async searchCourses(query: string): Promise<Course[]> {
    try {
      const response = await api.get<{ status: string; data: { courses: Course[] } }>(
        `${API_ENDPOINTS.COURSES.GET_ALL}?search=${encodeURIComponent(query)}`
      );
      return response.data.data.courses;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get course progress for a user
   */
  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    try {
      const response = await api.get<{ status: string; data: { progress: CourseProgress } }>(
        `${API_ENDPOINTS.COURSES.GET_BY_ID(courseId)}/progress`
      );
      return response.data.data.progress;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get quiz by ID
   */
  async getQuiz(courseId: string, quizId: string): Promise<Quiz> {
    try {
      const response = await api.get<{ status: string; data: { quiz: Quiz } }>(
        `${API_ENDPOINTS.COURSES.GET_BY_ID(courseId)}/quiz/${quizId}`
      );
      return response.data.data.quiz;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Submit quiz answers
   */
  async submitQuiz(courseId: string, quizId: string, answers: number[]): Promise<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  }> {
    try {
      const response = await api.post<{
        status: string;
        data: {
          score: number;
          passed: boolean;
          correctAnswers: number;
          totalQuestions: number;
        };
      }>(`${API_ENDPOINTS.COURSES.GET_BY_ID(courseId)}/quiz/${quizId}/submit`, { answers });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create course (Faculty only)
   */
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    try {
      const response = await api.post<{ status: string; data: { course: Course } }>(
        API_ENDPOINTS.COURSES.CREATE,
        courseData
      );
      return response.data.data.course;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update course (Faculty only)
   */
  async updateCourse(courseId: string, courseData: Partial<Course>): Promise<Course> {
    try {
      const response = await api.put<{ status: string; data: { course: Course } }>(
        API_ENDPOINTS.COURSES.UPDATE(courseId),
        courseData
      );
      return response.data.data.course;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete course (Faculty only)
   */
  async deleteCourse(courseId: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.COURSES.DELETE(courseId));
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Add discussion post to a course
   */
  async addDiscussionPost(courseId: string, data: { title: string; content: string }): Promise<any> {
    try {
      const response = await api.post<{ status: string; message: string; data: { thread: any } }>(
        API_ENDPOINTS.COURSES.ADD_DISCUSSION(courseId),
        data
      );
      return response.data.data.thread;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Add reply to a discussion thread
   */
  async addDiscussionReply(courseId: string, threadId: string, data: { content: string }): Promise<any> {
    try {
      const response = await api.post<{ status: string; message: string; data: { reply: any } }>(
        API_ENDPOINTS.COURSES.ADD_REPLY(courseId, threadId),
        data
      );
      return response.data.data.reply;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Upvote a discussion thread
   */
  async upvoteDiscussion(courseId: string, threadId: string): Promise<{ upvotes: number }> {
    try {
      const response = await api.put<{ status: string; message: string; data: { upvotes: number } }>(
        API_ENDPOINTS.COURSES.UPVOTE(courseId, threadId)
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export default new CourseService();
