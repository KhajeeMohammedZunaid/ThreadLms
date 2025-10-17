import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import * as userController from '../controllers/user.controller';
import { uploadProfilePicture, handleMulterError } from '../middleware/upload';

const router = Router();

// PUBLIC ROUTES (No authentication required)
// @route   GET /api/users/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get('/leaderboard', userController.getLeaderboard);

// PROTECTED ROUTES (Authentication required)
// @route   GET /api/users/profile/:id
// @desc    Get user profile
// @access  Private
router.get('/profile/:id', authenticate, userController.getUserProfile);

// @route   PUT /api/users/profile/:id
// @desc    Update user profile
// @access  Private
router.put('/profile/:id', authenticate, userController.updateUserProfile);

// @route   POST /api/users/upload-profile-picture
// @desc    Upload profile picture
// @access  Private
router.post(
  '/upload-profile-picture',
  authenticate,
  uploadProfilePicture.single('profilePicture'),
  handleMulterError,
  userController.uploadProfilePicture
);

// @route   GET /api/users/enrollments/:userId
// @desc    Get user enrollments
// @access  Private
router.get('/enrollments/:userId', authenticate, userController.getUserEnrollments);

// @route   POST /api/users/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/enroll', authenticate, userController.enrollInCourse);

// @route   PUT /api/users/progress
// @desc    Update course progress
// @access  Private
router.put('/progress', authenticate, userController.updateCourseProgress);

// @route   POST /api/users/submit-assignment
// @desc    Submit assignment
// @access  Private
router.post('/submit-assignment', authenticate, userController.submitAssignment);

// @route   POST /api/users/submit-quiz
// @desc    Submit quiz and save score
// @access  Private
router.post('/submit-quiz', authenticate, userController.submitQuiz);

// @route   POST /api/users/save-note
// @desc    Save course note  
// @access  Private
router.post('/save-note', authenticate, userController.saveCourseNote);

// @route   GET /api/users/certificates/:userId
// @desc    Get user certificates
// @access  Private
router.get('/certificates/:userId', authenticate, userController.getUserCertificates);

// @route   GET /api/users/notifications/:userId
// @desc    Get user notifications
// @access  Private
router.get('/notifications/:userId', authenticate, userController.getUserNotifications);

// @route   PUT /api/users/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:notificationId/read', authenticate, userController.markNotificationAsRead);

// @route   GET /api/users/notes
// @desc    Get user's notes
// @access  Private
router.get('/notes', authenticate, userController.getUserNotes);

// @route   POST /api/users/notes
// @desc    Save or update a note
// @access  Private
router.post('/notes', authenticate, userController.saveNote);

// @route   DELETE /api/users/notes/:noteId
// @desc    Delete a note
// @access  Private
router.delete('/notes/:noteId', authenticate, userController.deleteNote);

// @route   GET /api/users/settings/:userId
// @desc    Get user notification settings
// @access  Private
router.get('/settings/:userId', authenticate, userController.getUserSettings);

// @route   PUT /api/users/settings/:userId
// @desc    Update user notification settings
// @access  Private
router.put('/settings/:userId', authenticate, userController.updateUserSettings);

export default router;


