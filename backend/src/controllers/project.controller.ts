import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import cloudinary from '../config/cloudinary';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getAllProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branch, category, search, sortBy = 'createdAt' } = req.query;
    const filter: any = {};

    if (branch) filter.branch = branch;
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search as string };
    }

    const projects = await Project.find(filter)
      .populate('authorId', 'fullName profilePicture')
      .sort({ [sortBy as string]: -1 });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const project = await Project.findById(id).populate('authorId', 'fullName profilePicture');
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const projectData = {
      ...req.body,
      authorId: userId,
      authorName: (user as any).fullName || (user as any).name || 'Unknown User',
      authorAvatar: (user as any).profilePicture || 'https://placehold.co/150'
    };

    const project = await Project.create(projectData);

    res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const project = await Project.findById(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Verify ownership
    if (project.authorId.toString() !== req.user?.id) {
      throw new AppError('You can only update your own projects', 403);
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const project = await Project.findById(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Verify ownership
    if (project.authorId.toString() !== req.user?.id) {
      throw new AppError('You can only delete your own projects', 403);
    }

    await Project.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/unlike project
// @route   POST /api/projects/:id/like
// @access  Private
export const toggleLikeProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }

    const project = await Project.findById(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const likedIndex = project.likedBy.findIndex(likeUserId => likeUserId.toString() === userId);

    if (likedIndex > -1) {
      // Unlike
      project.likedBy.splice(likedIndex, 1);
      project.likes -= 1;
    } else {
      // Like
      project.likedBy.push(userId as any);
      project.likes += 1;
    }

    await project.save();

    res.status(200).json({
      status: 'success',
      message: likedIndex > -1 ? 'Project unliked' : 'Project liked',
      data: { likes: project.likes, isLiked: likedIndex === -1 }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment project views
// @route   POST /api/projects/:id/view
// @access  Private
export const incrementViews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { views: project.views }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload project image
// @route   POST /api/projects/upload-image
// @access  Private
export const uploadProjectImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image file', 400);
    }

    const cloudinaryFile = req.file as Express.MulterCloudinaryFile;

    res.status(200).json({
      status: 'success',
      message: 'Project image uploaded successfully',
      data: {
        imageUrl: cloudinaryFile.path
      }
    });
  } catch (error) {
    next(error);
  }
};

// Extend Express.Multer.File type for Cloudinary
declare global {
  namespace Express {
    interface MulterCloudinaryFile extends Multer.File {
      path: string;
    }
  }
}

