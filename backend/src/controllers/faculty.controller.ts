import { Request, Response, NextFunction } from 'express';
import Faculty from '../models/Faculty.model';
import Course from '../models/Course.model';
import User from '../models/User.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { createNotification } from '../services/notification.service';

// @desc    Get all faculty members
// @route   GET /api/faculty
// @access  Public
export const getAllFaculty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, sortBy = 'rating' } = req.query;
    const filter: any = { role: 'faculty' };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const faculty = await Faculty.find(filter)
      .select('-password')
      .sort({ [sortBy as string]: -1 });

    res.status(200).json({
      status: 'success',
      results: faculty.length,
      data: { faculty }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get faculty profile
// @route   GET /api/faculty/:id
// @access  Public
export const getFacultyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const faculty = await Faculty.findById(id).select('-password');
    if (!faculty) {
      throw new AppError('Faculty not found', 404);
    }

    // Get faculty courses
    const courses = await Course.find({ authorId: id });

    res.status(200).json({
      status: 'success',
      data: { faculty, courses }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enrolled students for faculty courses
// @route   GET /api/faculty/:id/students
// @access  Private (Faculty)
export const getEnrolledStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Verify faculty is accessing their own data
    if (req.user?.id !== id) {
      throw new AppError('You can only view your own students', 403);
    }

    // Get all courses by this faculty
    const courses = await Course.find({ authorId: id });
    const courseIds = courses.map(course => course._id);

    // Find all users enrolled in these courses
    const students = await User.find({
      'enrollments.courseId': { $in: courseIds }
    }).select('-password');

    res.status(200).json({
      status: 'success',
      results: students.length,
      data: { students }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Grade student submission
// @route   PUT /api/faculty/grade
// @access  Private (Faculty)
export const gradeSubmission = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, courseId, submissionType, itemId, grade, feedback } = req.body;

    // Verify course ownership
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (course.authorId.toString() !== req.user?.id) {
      throw new AppError('You can only grade submissions for your own courses', 403);
    }

    // Find student
    const student = await User.findById(userId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    // Find enrollment
    const enrollment = student.enrollments?.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrollment) {
      throw new AppError('Student not enrolled in this course', 404);
    }

    // Update grade based on submission type
    if (submissionType === 'assignment') {
      const submission = enrollment.assignmentSubmissions?.find(
        s => s.itemId === itemId
      );
      if (submission) {
        submission.grade = grade;
        submission.feedback = feedback;
      }
    } 
    await student.save();

    // Create grade notification
    const itemType = submissionType === 'quiz' ? 'quiz' : 'assignment';
    createNotification(
      userId,
      'GRADE_UPDATE',
      `Your ${itemType} for "${course.title}" has been graded. Check your grades now!`,
      '/grades'
    ).catch(error => {
      console.error('Failed to create grade notification:', error);
    });

    res.status(200).json({
      status: 'success',
      message: 'Submission graded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get faculty analytics
// @route   GET /api/faculty/:id/analytics
// @access  Private (Faculty)
export const getFacultyAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Verify faculty is accessing their own data
    if (req.user?.id !== id) {
      throw new AppError('You can only view your own analytics', 403);
    }

    // Get all courses by this faculty
    const courses = await Course.find({ authorId: id });
    
    // Calculate analytics
    const totalStudents = courses.reduce((sum, course) => sum + course.students, 0);
    const totalCourses = courses.length;
    const averageRating = totalCourses > 0 
      ? courses.reduce((sum, course) => sum + course.rating, 0) / totalCourses 
      : 0;
    
    // Get top courses by enrollment
    const topCourses = courses
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    res.status(200).json({
      status: 'success',
      data: {
        analytics: {
          totalStudents,
          totalCourses,
          averageRating: parseFloat(averageRating.toFixed(1)),
          topCourses
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
