/**
 * Collaboration Service
 * Handles all collaboration-related API calls
 */

import api, { getErrorMessage } from './api';
import { API_ENDPOINTS } from '../config/constants';

interface CollaborationMember {
  userId: string;
  userName: string;
  userAvatar: string;
  joinedAt: string;
}

interface CollaborationRequest {
  userId: string;
  requestedAt: string;
}

export interface Collaboration {
  _id: string;
  title: string;
  description: string;
  branch: string;
  requiredSkills: string[];
  teamSize: number;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  members: CollaborationMember[];
  requests: CollaborationRequest[];
  createdAt: string;
  updatedAt: string;
}

class CollaborationService {
  /**
   * Get all collaborations
   */
  async getAllCollaborations(): Promise<Collaboration[]> {
    try {
      const response = await api.get<{ status: string; data: { collaborations: Collaboration[] } }>(
        API_ENDPOINTS.COLLABORATIONS.GET_ALL
      );
      return response.data.data.collaborations;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get collaboration by ID
   */
  async getCollaborationById(collaborationId: string): Promise<Collaboration> {
    try {
      const response = await api.get<{ status: string; data: { collaboration: Collaboration } }>(
        API_ENDPOINTS.COLLABORATIONS.GET_BY_ID(collaborationId)
      );
      return response.data.data.collaboration;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create new collaboration
   */
  async createCollaboration(collaborationData: {
    title: string;
    description: string;
    branch: string;
    requiredSkills: string[];
    teamSize: number;
  }): Promise<Collaboration> {
    try {
      const response = await api.post<{ status: string; data: { collaboration: Collaboration } }>(
        API_ENDPOINTS.COLLABORATIONS.CREATE,
        collaborationData
      );
      return response.data.data.collaboration;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update collaboration
   */
  async updateCollaboration(
    collaborationId: string,
    collaborationData: Partial<Collaboration>
  ): Promise<Collaboration> {
    try {
      const response = await api.put<{ status: string; data: { collaboration: Collaboration } }>(
        API_ENDPOINTS.COLLABORATIONS.UPDATE(collaborationId),
        collaborationData
      );
      return response.data.data.collaboration;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete collaboration
   */
  async deleteCollaboration(collaborationId: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.COLLABORATIONS.DELETE(collaborationId));
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Request to join a collaboration
   */
  async requestToJoin(collaborationId: string): Promise<Collaboration> {
    try {
      const response = await api.post<{ status: string; data: { collaboration: Collaboration } }>(
        API_ENDPOINTS.COLLABORATIONS.REQUEST_JOIN(collaborationId)
      );
      return response.data.data.collaboration;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Approve a member request (Author only)
   */
  async approveMember(collaborationId: string, userId: string): Promise<Collaboration> {
    try {
      const response = await api.post<{ status: string; data: { collaboration: Collaboration } }>(
        API_ENDPOINTS.COLLABORATIONS.APPROVE_MEMBER(collaborationId, userId)
      );
      return response.data.data.collaboration;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Remove a member from collaboration (Author only)
   */
  async removeMember(collaborationId: string, userId: string): Promise<Collaboration> {
    try {
      const response = await api.delete<{ status: string; data: { collaboration: Collaboration } }>(
        API_ENDPOINTS.COLLABORATIONS.REMOVE_MEMBER(collaborationId, userId)
      );
      return response.data.data.collaboration;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export default new CollaborationService();
