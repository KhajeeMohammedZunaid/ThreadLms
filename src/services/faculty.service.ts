/**
 * Faculty Service
 * Handles all faculty-related API operations
 */

import api, { getErrorMessage } from './api';
import { API_ENDPOINTS } from '../config/constants';
import { User } from './auth.service';

export interface GradeSubmissionData {
  userId: string;
  courseId: string;
  submissionType: 'assignment' | 'quiz';
  itemId?: string;
  grade: number;
  feedback?: string;
}

class FacultyService {
  /**
   * Get all students enrolled in faculty's courses
   */
  async getEnrolledStudents(facultyId: string): Promise<User[]> {
    try {
      const response = await api.get<{ status: string; results: number; data: { students: User[] } }>(
        API_ENDPOINTS.FACULTY.GET_STUDENTS(facultyId)
      );
      return response.data.data.students;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Grade a student submission
   */
  async gradeSubmission(data: GradeSubmissionData): Promise<any> {
    try {
      const response = await api.put<{ status: string; data: any }>(
        API_ENDPOINTS.FACULTY.GRADE_SUBMISSION,
        data
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get faculty analytics
   */
  async getAnalytics(facultyId: string): Promise<any> {
    try {
      const response = await api.get<{ status: string; data: any }>(
        API_ENDPOINTS.FACULTY.GET_ANALYTICS(facultyId)
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export default new FacultyService();
