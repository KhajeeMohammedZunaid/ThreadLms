import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import Faculty from '../models/Faculty.model';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { sendWelcomeEmail } from '../services/welcomeEmail.service';
import { createNotification } from '../services/notification.service';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user based on role
    let user;
    if (role === 'faculty') {
      user = await Faculty.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        role
      });
    } else {
      user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        role: 'student'
      });
    }

    // Generate token
    const token = generateToken({
      id: (user._id as any).toString(),
      role: user.role,
      email: user.email
    });

    console.log('🔑 Registration successful - Token generated:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      tokenPreview: token.substring(0, 20) + '...'
    });

    // Send welcome email asynchronously (don't wait for it)
    sendWelcomeEmail({
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }).catch(error => {
      console.error('Failed to send welcome email, but registration succeeded:', error);
    });

    // Create welcome notification
    createNotification(
      (user._id as any).toString(),
      'WELCOME',
      `Welcome to ThreadLMS, ${user.firstName}! Start exploring courses and building your skills.`,
      '/dashboard'
    ).catch(error => {
      console.error('Failed to create welcome notification, but registration succeeded:', error);
    });

    res.status(201).json({
      status: 'success',
      token, // Token at root level
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Find user (check both User and Faculty collections)
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      user = await Faculty.findOne({ email }).select('+password');
    }

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken({
      id: (user._id as any).toString(),
      role: user.role,
      email: user.email
    });

    console.log('🔑 Login successful - Token generated:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      tokenPreview: token.substring(0, 20) + '...'
    });

    res.status(200).json({
      status: 'success',
      token, // Token at root level
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          role: user.role,
          // Include enrollments for students
          ...(user.role === 'student' && {
            enrollments: (user as any).enrollments || [],
            certificates: (user as any).certificates || [],
            notes: (user as any).notes || []
          }),
          // Faculty-specific fields
          ...(user.role === 'faculty' && {
            title: (user as any).title,
            bio: (user as any).bio,
            rating: (user as any).rating
          })
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // req.user is set by the authenticate middleware
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new AppError('User not found in request', 401);
    }

    // Find user in both collections
    let user = await User.findById(userId).select('-password');
    if (!user) {
      user = await Faculty.findById(userId).select('-password');
    }

    if (!user) {
      throw new AppError('User not found', 404);
    }

    console.log('✅ getCurrentUser success:', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          role: user.role,
          phone: (user as any).phone,
          headline: (user as any).headline,
          registerNumber: (user as any).registerNumber,
          degree: (user as any).degree,
          batch: (user as any).batch,
          college: (user as any).college,
          aboutMe: (user as any).aboutMe,
          // Include enrollments for students
          ...(user.role === 'student' && {
            enrollments: (user as any).enrollments || [],
            certificates: (user as any).certificates || [],
            notes: (user as any).notes || []
          }),
          // Faculty-specific fields
          ...(user.role === 'faculty' && {
            title: (user as any).title,
            bio: (user as any).bio,
            rating: (user as any).rating,
            reviews: (user as any).reviews,
            students: (user as any).students,
            courses: (user as any).courses
          })
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
