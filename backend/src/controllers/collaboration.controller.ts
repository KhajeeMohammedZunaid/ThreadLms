import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Collaboration from '../models/Collaboration.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

// @desc    Get all collaborations
// @route   GET /api/collaborations
// @access  Public
export const getAllCollaborations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branch, search } = req.query;
    const filter: any = {};

    if (branch) filter.branch = branch;
    if (search) {
      filter.$text = { $search: search as string };
    }

    const collaborations = await Collaboration.find(filter)
      .populate('authorId', 'fullName profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: collaborations.length,
      data: { collaborations }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single collaboration
// @route   GET /api/collaborations/:id
// @access  Public
export const getCollaborationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const collaboration = await Collaboration.findById(id)
      .populate('authorId', 'fullName profilePicture')
      .populate('members.userId', 'fullName profilePicture');
    
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { collaboration }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new collaboration
// @route   POST /api/collaborations
// @access  Private
export const createCollaboration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Fetch user data to get name and avatar
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const collaborationData = {
      ...req.body,
      authorId: userId,
      authorName: (user as any).fullName || (user as any).name || 'Unknown User',
      authorAvatar: (user as any).profilePicture || 'https://placehold.co/150'
    };

    const collaboration = await Collaboration.create(collaborationData);

    res.status(201).json({
      status: 'success',
      message: 'Collaboration created successfully',
      data: { collaboration }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update collaboration
// @route   PUT /api/collaborations/:id
// @access  Private
export const updateCollaboration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    // Verify ownership
    if (collaboration.authorId.toString() !== req.user?.id) {
      throw new AppError('You can only update your own collaboration posts', 403);
    }

    const updatedCollaboration = await Collaboration.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Collaboration updated successfully',
      data: { collaboration: updatedCollaboration }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete collaboration
// @route   DELETE /api/collaborations/:id
// @access  Private
export const deleteCollaboration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    // Verify ownership
    if (collaboration.authorId.toString() !== req.user?.id) {
      throw new AppError('You can only delete your own collaboration posts', 403);
    }

    await Collaboration.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Collaboration deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request to join collaboration
// @route   POST /api/collaborations/:id/request
// @access  Private
export const requestToJoin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    // Check if team is full
    if (collaboration.members.length >= collaboration.teamSize) {
      throw new AppError('Team is already full', 400);
    }

    // Check if already requested
    const alreadyRequested = collaboration.requests.some(
      req => req.userId.toString() === userId
    );
    if (alreadyRequested) {
      throw new AppError('Already requested to join', 400);
    }

    // Check if already a member
    const alreadyMember = collaboration.members.some(
      member => member.userId.toString() === userId
    );
    if (alreadyMember) {
      throw new AppError('Already a member', 400);
    }

    collaboration.requests.push({
      userId: userId as any,
      requestedAt: new Date()
    });

    await collaboration.save();

    res.status(200).json({
      status: 'success',
      message: 'Join request sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve member request
// @route   POST /api/collaborations/:id/approve/:userId
// @access  Private
export const approveMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, userId } = req.params;
    
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    // Verify ownership
    if (collaboration.authorId.toString() !== req.user?.id) {
      throw new AppError('Only the author can approve members', 403);
    }

    // Find and remove the request
    const requestIndex = collaboration.requests.findIndex(
      req => req.userId.toString() === userId
    );

    if (requestIndex === -1) {
      throw new AppError('Join request not found', 404);
    }

    collaboration.requests.splice(requestIndex, 1);

    // Add to members (you'd typically fetch user data here)
    collaboration.members.push({
      userId: userId as any,
      userName: 'User Name', // Fetch from User model
      userAvatar: 'https://i.pravatar.cc/150', // Fetch from User model
      joinedAt: new Date()
    });

    await collaboration.save();

    res.status(200).json({
      status: 'success',
      message: 'Member approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from collaboration
// @route   DELETE /api/collaborations/:id/remove/:userId
// @access  Private
export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, userId } = req.params;
    
    const collaboration = await Collaboration.findById(id);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    // Verify ownership
    if (collaboration.authorId.toString() !== req.user?.id) {
      throw new AppError('Only the author can remove members', 403);
    }

    const memberIndex = collaboration.members.findIndex(
      member => member.userId.toString() === userId
    );

    if (memberIndex === -1) {
      throw new AppError('Member not found', 404);
    }

    collaboration.members.splice(memberIndex, 1);
    await collaboration.save();

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
