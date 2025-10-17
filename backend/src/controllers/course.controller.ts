import { Request, Response, NextFunction } from 'express';
import Course from '../models/Course.model';
import User from '../models/User.model';
import Faculty from '../models/Faculty.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import cloudinary from '../config/cloudinary';
import { createNotification } from '../services/notification.service';
import { checkAndGenerateCertificate } from '../utils/certificateHelper';

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getAllCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branch, category, search } = req.query;
    const filter: any = {};

    if (branch) filter.branch = branch;
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search as string };
    }

    const courses = await Course.find(filter)
      .populate('authorId', 'fullName profilePicture title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: { courses }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const course = await Course.findById(id).populate('authorId', 'fullName profilePicture title bio rating');
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Faculty)
export const createCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courseData = {
      ...req.body,
      authorId: req.user?.id
    };

    const course = await Course.create(courseData);

    // Notify all students in the same branch about new course
    const students = await User.find({ role: 'student' }).select('_id');
    if (students.length > 0) {
      const studentIds = students.map(s => (s._id as any).toString());
      const { createBulkNotifications } = require('../services/notification.service');
      createBulkNotifications(
        studentIds,
        'NEW_COURSE',
        `New course available: "${course.title}". Enroll now and start learning!`,
        `/courses/${course._id}`
      ).catch((error: any) => {
        console.error('Failed to create new course notifications:', error);
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Faculty)
export const updateCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const course = await Course.findById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Verify ownership
    if (course.authorId.toString() !== req.user?.id) {
      throw new AppError('You can only update your own courses', 403);
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Notify all enrolled students about course update
    const enrolledStudents = await User.find({ 'enrollments.courseId': id }).select('_id');
    if (enrolledStudents.length > 0) {
      const studentIds = enrolledStudents.map(s => (s._id as any).toString());
      const { createBulkNotifications } = require('../services/notification.service');
      createBulkNotifications(
        studentIds,
        'COURSE_UPDATE',
        `"${course.title}" has been updated with new content. Check it out!`,
        `/courses/${id}`
      ).catch((error: any) => {
        console.error('Failed to create course update notifications:', error);
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Course updated successfully',
      data: { course: updatedCourse }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Faculty)
export const deleteCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const course = await Course.findById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Verify ownership
    if (course.authorId.toString() !== req.user?.id) {
      throw new AppError('You can only delete your own courses', 403);
    }

    await Course.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add discussion post
// @route   POST /api/courses/:id/discussion
// @access  Private
export const addDiscussionPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const course = await Course.findById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Fetch user/faculty data to get profile picture and full name
    let userData: any;
    if (req.user?.role === 'faculty') {
      userData = await Faculty.findById(req.user.id).select('firstName lastName profilePicture');
    } else {
      userData = await User.findById(req.user?.id).select('firstName lastName profilePicture');
    }

    const authorName = userData 
      ? `${userData.firstName} ${userData.lastName}` 
      : req.user?.email || 'Anonymous';
    const authorAvatar = userData?.profilePicture || 'https://i.pravatar.cc/150?u=default';

    const newThread = {
      id: `disc-${Date.now()}`,
      author: authorName,
      avatar: authorAvatar,
      timestamp: new Date(),
      title,
      content,
      upvotes: 0,
      authorRole: req.user?.role || 'student',
      replies: []
    };

    course.discussion = course.discussion || [];
    course.discussion.push(newThread as any);
    await course.save();

    res.status(201).json({
      status: 'success',
      message: 'Discussion post added',
      data: { thread: newThread }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add reply to discussion
// @route   POST /api/courses/:id/discussion/:threadId/reply
// @access  Private
export const addDiscussionReply = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, threadId } = req.params;
    const { content } = req.body;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const course = await Course.findById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const thread = course.discussion?.find(t => t.id === threadId);
    if (!thread) {
      throw new AppError('Discussion thread not found', 404);
    }

    // Fetch user/faculty data to get profile picture and full name
    let userData: any;
    if (req.user?.role === 'faculty') {
      userData = await Faculty.findById(req.user.id).select('firstName lastName profilePicture');
    } else {
      userData = await User.findById(req.user?.id).select('firstName lastName profilePicture');
    }

    const authorName = userData 
      ? `${userData.firstName} ${userData.lastName}` 
      : req.user?.email || 'Anonymous';
    const authorAvatar = userData?.profilePicture || 'https://i.pravatar.cc/150?u=default';

    const newReply = {
      id: `reply-${Date.now()}`,
      author: authorName,
      avatar: authorAvatar,
      timestamp: new Date(),
      content,
      upvotes: 0,
      authorRole: req.user?.role || 'student'
    };

    thread.replies.push(newReply as any);
    await course.save();

    // Create notification for thread author (if not replying to self)
    const threadAuthorData = thread.author;
    // Try to find thread author by name to get their ID
    const threadAuthorUser = await User.findOne({ 
      $or: [
        { fullName: threadAuthorData },
        { email: threadAuthorData }
      ]
    }).select('_id');
    
    const threadAuthorFaculty = threadAuthorUser ? null : await Faculty.findOne({ 
      $or: [
        { fullName: threadAuthorData },
        { email: threadAuthorData }
      ]
    }).select('_id');

    const threadAuthorId = threadAuthorUser?._id || threadAuthorFaculty?._id;
    
    if (threadAuthorId && threadAuthorId.toString() !== req.user?.id) {
      createNotification(
        threadAuthorId.toString(),
        'DISCUSSION_REPLY',
        `${authorName} replied to your discussion: "${thread.title.substring(0, 50)}..."`,
        `/courses/${id}`
      ).catch(error => {
        console.error('Failed to create discussion reply notification:', error);
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Reply added',
      data: { reply: newReply }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote discussion
// @route   PUT /api/courses/:id/discussion/:threadId/upvote
// @access  Private
export const upvoteDiscussion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, threadId } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }
    
    const course = await Course.findById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const thread = course.discussion?.find(t => t.id === threadId);
    if (!thread) {
      throw new AppError('Discussion thread not found', 404);
    }

    thread.upvotes += 1;
    await course.save();

    res.status(200).json({
      status: 'success',
      message: 'Upvoted successfully',
      data: { upvotes: thread.upvotes }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload course thumbnail image
// @route   POST /api/courses/upload-image
// @access  Private (Faculty only)
export const uploadCourseImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image file', 400);
    }

    const cloudinaryFile = req.file as Express.MulterCloudinaryFile;

    res.status(200).json({
      status: 'success',
      message: 'Course image uploaded successfully',
      data: {
        imageUrl: cloudinaryFile.path
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload course preview image
// @route   POST /api/courses/upload-preview
// @access  Private (Faculty only)
export const uploadCoursePreview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image file', 400);
    }

    const cloudinaryFile = req.file as Express.MulterCloudinaryFile;

    res.status(200).json({
      status: 'success',
      message: 'Course preview image uploaded successfully',
      data: {
        previewUrl: cloudinaryFile.path
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload lecture video
// @route   POST /api/courses/upload-lecture-video
// @access  Private (Faculty only)
export const uploadLectureVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a video file', 400);
    }

    const cloudinaryFile = req.file as Express.MulterCloudinaryFile;

    res.status(200).json({
      status: 'success',
      message: 'Lecture video uploaded successfully',
      data: {
        videoUrl: cloudinaryFile.path,
        videoType: 'upload' as const
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

