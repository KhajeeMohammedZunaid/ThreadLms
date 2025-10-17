import { Response, NextFunction } from 'express';
import User from '../models/User.model';
import Faculty from '../models/Faculty.model';
import Course from '../models/Course.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import cloudinary from '../config/cloudinary';
import { createNotification } from '../services/notification.service';
import { checkAndGenerateCertificate } from '../utils/certificateHelper';

// @desc    Get user profile
// @route   GET /api/users/profile/:id
// @access  Private
export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Try to find in User collection first
    let user = await User.findById(id).select('-password');
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(id).select('-password');
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile/:id
// @access  Private
export const updateUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Verify user owns this profile
    if (req.user?.id !== id) {
      throw new AppError('You can only update your own profile', 403);
    }

    // Try to update in User collection first
    let user = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).select('-password');
    }

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user enrollments
// @route   GET /api/users/enrollments/:userId
// @access  Private
export const getUserEnrollments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Try to find in User collection first
    let user = await User.findById(userId).select('enrollments');
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId).select('enrollments');
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { enrollments: user.enrollments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in a course
// @route   POST /api/users/enroll
// @access  Private
export const enrollInCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if already enrolled
    const alreadyEnrolled = user.enrollments?.some(
      enrollment => enrollment.courseId.toString() === courseId
    );

    if (alreadyEnrolled) {
      throw new AppError('Already enrolled in this course', 400);
    }

    // Add enrollment
    user.enrollments?.push({
      courseId,
      completedItems: [],
      enrollmentDate: new Date()
    } as any);

    // Increment course students count
    course.students += 1;

    await Promise.all([user.save(), course.save()]);

    // Create enrollment notification
    createNotification(
      userId,
      'NEW_ENROLLMENT',
      `You've successfully enrolled in "${course.title}". Start learning now!`,
      `/courses/${courseId}`
    ).catch(error => {
      console.error('Failed to create enrollment notification:', error);
    });

    res.status(200).json({
      status: 'success',
      message: 'Enrolled successfully',
      data: { enrollment: user.enrollments?.[user.enrollments.length - 1] }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course progress
// @route   PUT /api/users/progress
// @access  Private
export const updateCourseProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, completedItems, itemId, completed } = req.body;
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const enrollment = user.enrollments?.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 404);
    }

    // Handle both formats:
    // 1. completedItems array (full update)
    // 2. itemId + completed (toggle single item)
    if (completedItems !== undefined && Array.isArray(completedItems)) {
      // Full update with array of completed items
      enrollment.completedItems = completedItems;
    } else if (itemId !== undefined) {
      // Toggle single item
      const itemIndex = enrollment.completedItems.indexOf(itemId);
      if (completed && itemIndex === -1) {
        // Mark as completed
        enrollment.completedItems.push(itemId);
      } else if (!completed && itemIndex !== -1) {
        // Mark as not completed
        enrollment.completedItems.splice(itemIndex, 1);
      }
    } else {
      throw new AppError('Invalid request: provide either completedItems array or itemId + completed', 400);
    }
    
    // Check and generate certificate if course is complete
    const certificateGenerated = await checkAndGenerateCertificate(user, enrollment, courseId);
    
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Progress updated',
      data: { 
        enrollment,
        certificateGenerated
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit assignment
// @route   POST /api/users/submit-assignment
// @access  Private
export const submitAssignment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, itemId, submissionLink } = req.body;
    const userId = req.user?.id;

    if (!courseId || !itemId || !submissionLink) {
      throw new AppError('courseId, itemId, and submissionLink are required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const enrollment = user.enrollments?.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 404);
    }

    // Initialize assignmentSubmissions array if it doesn't exist
    if (!enrollment.assignmentSubmissions) {
      enrollment.assignmentSubmissions = [];
    }

    // Check if submission already exists for this item
    const existingSubmissionIndex = enrollment.assignmentSubmissions.findIndex(
      s => s.itemId === itemId
    );

    const submission = {
      itemId,
      submissionLink,
      submissionDate: new Date()
    };

    if (existingSubmissionIndex !== -1) {
      // Update existing submission
      enrollment.assignmentSubmissions[existingSubmissionIndex] = {
        ...enrollment.assignmentSubmissions[existingSubmissionIndex],
        ...submission
      };
    } else {
      // Add new submission
      enrollment.assignmentSubmissions.push(submission);
    }

    // Also mark item as completed
    if (!enrollment.completedItems.includes(itemId)) {
      enrollment.completedItems.push(itemId);
    }

    // Check and generate certificate if course is complete
    const certificateGenerated = await checkAndGenerateCertificate(user, enrollment, courseId);

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Assignment submitted successfully',
      data: { 
        submission,
        certificateGenerated
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz and save score
// @route   POST /api/users/submit-quiz
// @access  Private
export const submitQuiz = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, itemId, score, answers } = req.body;
    const userId = req.user?.id;

    if (!courseId || !itemId || score === undefined) {
      throw new AppError('courseId, itemId, and score are required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const enrollment = user.enrollments?.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 404);
    }

    // Check if this is the final quiz
    if (itemId === 'finalQuiz') {
      // Save final quiz score to dedicated field
      enrollment.finalQuizScore = score;
      
      // Mark final quiz as completed
      if (!enrollment.completedItems.includes(itemId)) {
        enrollment.completedItems.push(itemId);
      }
    } else {
      // Regular quiz handling
      // Initialize quizScores array if it doesn't exist
      if (!enrollment.quizScores) {
        enrollment.quizScores = [];
      }

      // Check if quiz score already exists for this item
      const existingScoreIndex = enrollment.quizScores.findIndex(
        q => q.itemId === itemId
      );

      const quizScore = {
        itemId,
        score
      };

      if (existingScoreIndex !== -1) {
        // Update existing score (keep the higher score)
        const existingScore = enrollment.quizScores[existingScoreIndex].score || 0;
        enrollment.quizScores[existingScoreIndex].score = Math.max(existingScore, score);
      } else {
        // Add new quiz score
        enrollment.quizScores.push(quizScore);
      }

      // Also mark item as completed
      if (!enrollment.completedItems.includes(itemId)) {
        enrollment.completedItems.push(itemId);
      }
    }

    // Clear the in-progress quiz answers for this item
    if (enrollment.inProgressQuizAnswers) {
      enrollment.inProgressQuizAnswers.delete(itemId);
    }

    // Check and generate certificate if course is complete
    const certificateGenerated = await checkAndGenerateCertificate(user, enrollment, courseId);

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Quiz submitted successfully',
      data: { 
        score: itemId === 'finalQuiz' ? enrollment.finalQuizScore : score,
        certificateGenerated,
        completedItems: enrollment.completedItems.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save course note
// @route   POST /api/users/save-note
// @access  Private
export const saveCourseNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, itemId, content, title } = req.body;
    const userId = req.user?.id;

    if (!courseId || !itemId || !content) {
      throw new AppError('courseId, itemId, and content are required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const enrollment = user.enrollments?.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 404);
    }

    // Initialize courseNotes if it doesn't exist
    if (!enrollment.courseNotes) {
      enrollment.courseNotes = new Map();
    }

    // Save note for this item
    enrollment.courseNotes.set(itemId, content);

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Note saved successfully',
      data: { itemId, content }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user certificates
// @route   GET /api/users/certificates/:userId
// @access  Private
export const getUserCertificates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Try to find in User collection first
    let user = await User.findById(userId).select('certificates');
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId).select('certificates');
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { certificates: user.certificates }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications/:userId
// @access  Private
export const getUserNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Try to find in User collection first
    let user = await User.findById(userId).select('notifications');
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId).select('notifications');
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { notifications: user.notifications }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:notificationId/read
// @access  Private
export const markNotificationAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    // Try to find in User collection first
    let user = await User.findById(userId);
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId);
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const notification = user.notifications?.find(n => n.id === notificationId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    notification.isRead = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/upload-profile-picture
// @access  Private
export const uploadProfilePicture = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an image file', 400);
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Try to find in User collection first
    let user = await User.findById(userId);
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId);
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete old profile picture from Cloudinary if it exists and is not the default
    if (user.profilePicture && !user.profilePicture.includes('pravatar.cc')) {
      try {
        const publicId = user.profilePicture.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error('Error deleting old profile picture:', deleteError);
        // Continue even if deletion fails
      }
    }

    // Update user with new Cloudinary URL
    const cloudinaryFile = req.file as Express.MulterCloudinaryFile;
    user.profilePicture = cloudinaryFile.path;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get leaderboard (top performing students)
 * @route   GET /api/users/leaderboard
 * @access  Public
 */
export const getLeaderboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get all students with their enrollments
    const students = await User.find({ role: 'student' })
      .select('fullName profilePicture enrollments')
      .lean();

    // Calculate scores for each student
    const leaderboard = students.map(student => {
      let totalScore = 0;
      let totalGradedItems = 0;
      let coursesCompleted = 0;

      student.enrollments?.forEach(enrollment => {
        // Count completed courses (100% completion)
        if (enrollment.completionDate) {
          coursesCompleted++;
        }

        // Calculate average from quiz scores
        enrollment.quizScores?.forEach(quiz => {
          totalScore += quiz.score;
          totalGradedItems++;
        });

        // Add final quiz score
        if (enrollment.finalQuizScore !== undefined) {
          totalScore += enrollment.finalQuizScore;
          totalGradedItems++;
        }

        // Add assignment grades
        enrollment.assignmentSubmissions?.forEach(assignment => {
          if (assignment.grade !== undefined) {
            totalScore += assignment.grade;
            totalGradedItems++;
          }
        });
      });

      const averageScore = totalGradedItems > 0 ? (totalScore / totalGradedItems) * 10 : 0;

      return {
        userId: student._id,
        fullName: student.fullName,
        profilePicture: student.profilePicture,
        averageScore: Math.round(averageScore * 10) / 10,
        coursesCompleted,
        totalEnrollments: student.enrollments?.length || 0
      };
    });

    // Sort by average score (descending)
    leaderboard.sort((a, b) => b.averageScore - a.averageScore);

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's notes
 * @route   GET /api/users/notes
 * @access  Private
 */
export const getUserNotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    console.log('📖 Get Notes Request:', { userId });
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Try to find in User collection first
    let user = await User.findById(userId).select('notes');
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId).select('notes');
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    console.log('✅ Notes retrieved:', user.notes.length, 'notes for user:', userId);

    res.status(200).json({
      status: 'success',
      data: {
        notes: user.notes || []
      }
    });
  } catch (error) {
    console.error('❌ Error getting notes:', error);
    next(error);
  }
};

/**
 * @desc    Save or update a note
 * @route   POST /api/users/notes
 * @access  Private
 */
export const saveNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    console.log('📝 Save Note Request:', { userId, body: req.body });
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id, title, content, color, dueDate, isPublished, courseId, courseTitle, authorName } = req.body;

    // Validate that note has either title or content
    if (!title?.trim() && !content?.trim()) {
      throw new AppError('Note text is required. Please add a title or content.', 400);
    }

    // Try to find in User collection first
    let user = await User.findById(userId);
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId);
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    console.log('👤 User found:', user.email, 'Current notes count:', user.notes.length);

    // Check if note exists
    const existingNoteIndex = user.notes.findIndex(n => n.id === id);

    if (existingNoteIndex >= 0) {
      // Update existing note
      console.log('✏️ Updating existing note at index:', existingNoteIndex);
      user.notes[existingNoteIndex] = {
        id,
        title: title || '',
        content: content || '',
        color,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isPublished,
        courseId,
        courseTitle,
        authorName
      };
    } else {
      // Add new note
      console.log('➕ Adding new note');
      user.notes.push({
        id,
        title: title || '',
        content: content || '',
        color,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isPublished,
        courseId,
        courseTitle,
        authorName
      });
    }

    await user.save();
    console.log('✅ Note saved successfully! Total notes:', user.notes.length);

    res.status(200).json({
      status: 'success',
      message: 'Note saved successfully',
      data: {
        notes: user.notes
      }
    });
  } catch (error) {
    console.error('❌ Error saving note:', error);
    next(error);
  }
};

/**
 * @desc    Delete a note
 * @route   DELETE /api/users/notes/:noteId
 * @access  Private
 */
export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { noteId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Try to find in User collection first
    let user = await User.findById(userId);
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId);
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.notes = user.notes.filter(n => n.id !== noteId);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Note deleted successfully',
      data: {
        notes: user.notes
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user notification settings
// @route   GET /api/users/settings/:userId
// @access  Private
export const getUserSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    // Verify user owns these settings
    if (req.user?.id !== userId) {
      throw new AppError('You can only view your own settings', 403);
    }

    // Try to find in User collection first
    let user = await User.findById(userId).select('notificationSettings');
    
    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findById(userId).select('notificationSettings');
    }
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Return default settings if not set
    const settings = user.notificationSettings || {
      emailNotifications: true,
      pushNotifications: true,
      courseUpdates: true,
      projectComments: true,
      collaborationInvites: true
    };

    res.status(200).json({
      status: 'success',
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user notification settings
// @route   PUT /api/users/settings/:userId
// @access  Private
export const updateUserSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { emailNotifications, pushNotifications, courseUpdates, projectComments, collaborationInvites } = req.body;

    // Verify user owns these settings
    if (req.user?.id !== userId) {
      throw new AppError('You can only update your own settings', 403);
    }

    const settingsData = {
      emailNotifications: emailNotifications ?? true,
      pushNotifications: pushNotifications ?? true,
      courseUpdates: courseUpdates ?? true,
      projectComments: projectComments ?? true,
      collaborationInvites: collaborationInvites ?? true
    };

    // Try to update in User collection first
    let user = await User.findByIdAndUpdate(
      userId,
      { $set: { notificationSettings: settingsData } },
      { new: true }
    ).select('notificationSettings');

    // If not found in User, try Faculty collection
    if (!user) {
      user = await Faculty.findByIdAndUpdate(
        userId,
        { $set: { notificationSettings: settingsData } },
        { new: true }
      ).select('notificationSettings');
    }

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Settings updated successfully',
      data: { settings: user.notificationSettings }
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

