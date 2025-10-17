/**
 * Project Service
 * Handles all project-related API operations
 */

import api, { getErrorMessage } from './api';
import { API_ENDPOINTS } from '../config/constants';

// Types
export interface Project {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  tags: string[];
  likes: number;
  views: number;
  projectUrl: string;
  branch: 'Computer Science' | 'Electrical' | 'Mechanical' | 'Civil';
  category: string;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl: string;
  branch: string;
  category: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  projectUrl?: string;
  branch?: string;
  category?: string;
}

class ProjectService {
  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      const response = await api.get<{ status: string; data: { projects: Project[] } }>(
        API_ENDPOINTS.PROJECTS.GET_ALL
      );
      return response.data.data.projects;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<Project> {
    try {
      const response = await api.get<{ status: string; data: { project: Project } }>(
        API_ENDPOINTS.PROJECTS.GET_BY_ID(projectId)
      );
      return response.data.data.project;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get projects by user ID
   */
  async getProjectsByUser(userId: string): Promise<Project[]> {
    try {
      const response = await api.get<{ status: string; data: { projects: Project[] } }>(
        `${API_ENDPOINTS.PROJECTS.GET_ALL}?authorId=${userId}`
      );
      return response.data.data.projects;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get projects by branch
   */
  async getProjectsByBranch(branch: string): Promise<Project[]> {
    try {
      const response = await api.get<{ status: string; data: { projects: Project[] } }>(
        `${API_ENDPOINTS.PROJECTS.GET_ALL}?branch=${encodeURIComponent(branch)}`
      );
      return response.data.data.projects;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get projects by category
   */
  async getProjectsByCategory(category: string): Promise<Project[]> {
    try {
      const response = await api.get<{ status: string; data: { projects: Project[] } }>(
        `${API_ENDPOINTS.PROJECTS.GET_ALL}?category=${encodeURIComponent(category)}`
      );
      return response.data.data.projects;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Search projects by query
   */
  async searchProjects(query: string): Promise<Project[]> {
    try {
      const response = await api.get<{ status: string; data: { projects: Project[] } }>(
        `${API_ENDPOINTS.PROJECTS.GET_ALL}?search=${encodeURIComponent(query)}`
      );
      return response.data.data.projects;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData: CreateProjectData): Promise<Project> {
    try {
      const response = await api.post<{ status: string; data: { project: Project } }>(
        API_ENDPOINTS.PROJECTS.CREATE,
        projectData
      );
      return response.data.data.project;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(projectId: string, projectData: UpdateProjectData): Promise<Project> {
    try {
      const response = await api.put<{ status: string; data: { project: Project } }>(
        API_ENDPOINTS.PROJECTS.UPDATE(projectId),
        projectData
      );
      return response.data.data.project;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.PROJECTS.DELETE(projectId));
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Upload project image
   */
  async uploadProjectImage(file: File): Promise<{ imageUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('projectImage', file);

      const response = await api.post<{ status: string; data: { imageUrl: string } }>(
        API_ENDPOINTS.PROJECTS.UPLOAD_IMAGE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Like/Unlike a project
   */
  async toggleLike(projectId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      const response = await api.post<{ 
        status: string; 
        data: { liked: boolean; likes: number } 
      }>(
        API_ENDPOINTS.PROJECTS.LIKE(projectId)
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Increment project view count
   */
  async incrementView(projectId: string): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.PROJECTS.INCREMENT_VIEW(projectId));
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get trending projects (most liked)
   */
  async getTrendingProjects(limit: number = 10): Promise<Project[]> {
    try {
      const response = await api.get<{ status: string; data: { projects: Project[] } }>(
        `${API_ENDPOINTS.PROJECTS.GET_ALL}?sortBy=likes&limit=${limit}`
      );
      return response.data.data.projects;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get recent projects
   */
  async getRecentProjects(limit: number = 10): Promise<Project[]> {
    try {
      const response = await api.get<{ status: string; data: { projects: Project[] } }>(
        `${API_ENDPOINTS.PROJECTS.GET_ALL}?sortBy=recent&limit=${limit}`
      );
      return response.data.data.projects;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export default new ProjectService();
