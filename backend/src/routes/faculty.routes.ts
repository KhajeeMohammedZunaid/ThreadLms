import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as facultyController from '../controllers/faculty.controller';

const router = Router();

// @route   GET /api/faculty
// @desc    Get all faculty members
// @access  Public
router.get('/', facultyController.getAllFaculty);

// @route   GET /api/faculty/:id
// @desc    Get faculty profile
// @access  Public
router.get('/:id', facultyController.getFacultyProfile);

// Protected routes (require authentication and faculty role)
router.use(authenticate);
router.use(authorize('faculty'));

// @route   GET /api/faculty/:id/students
// @desc    Get enrolled students for faculty courses
// @access  Private (Faculty only)
router.get('/:id/students', facultyController.getEnrolledStudents);

// @route   PUT /api/faculty/grade
// @desc    Grade student submission
// @access  Private (Faculty only)
router.put('/grade', facultyController.gradeSubmission);

// @route   GET /api/faculty/:id/analytics
// @desc    Get faculty analytics
// @access  Private (Faculty only)
router.get('/:id/analytics', facultyController.getFacultyAnalytics);

export default router;
