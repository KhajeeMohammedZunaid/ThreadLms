import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as courseController from '../controllers/course.controller';
import { uploadCourseImage, uploadCoursePreview, uploadLectureVideo, handleMulterError } from '../middleware/upload';

const router = Router();

// @route   GET /api/courses
// @desc    Get all courses (with filters)
// @access  Public
router.get('/', courseController.getAllCourses);

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Public
router.get('/:id', courseController.getCourseById);

// Protected routes (require authentication)
router.use(authenticate);

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Faculty only)
router.post('/', authorize('faculty'), courseController.createCourse);

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Faculty only)
router.put('/:id', authorize('faculty'), courseController.updateCourse);

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Faculty only)
router.delete('/:id', authorize('faculty'), courseController.deleteCourse);

// @route   POST /api/courses/upload-image
// @desc    Upload course thumbnail image
// @access  Private (Faculty only)
router.post(
  '/upload-image',
  authorize('faculty'),
  uploadCourseImage.single('courseImage'),
  handleMulterError,
  courseController.uploadCourseImage
);

// @route   POST /api/courses/upload-preview
// @desc    Upload course preview image
// @access  Private (Faculty only)
router.post(
  '/upload-preview',
  authorize('faculty'),
  uploadCoursePreview.single('previewImage'),
  handleMulterError,
  courseController.uploadCoursePreview
);

// @route   POST /api/courses/upload-lecture-video
// @desc    Upload lecture video
// @access  Private (Faculty only)
router.post(
  '/upload-lecture-video',
  authorize('faculty'),
  uploadLectureVideo.single('lectureVideo'),
  handleMulterError,
  courseController.uploadLectureVideo
);

// @route   POST /api/courses/:id/discussion
// @desc    Add discussion post
// @access  Private
router.post('/:id/discussion', courseController.addDiscussionPost);

// @route   POST /api/courses/:id/discussion/:threadId/reply
// @desc    Add reply to discussion
// @access  Private
router.post('/:id/discussion/:threadId/reply', courseController.addDiscussionReply);

// @route   PUT /api/courses/:id/discussion/:threadId/upvote
// @desc    Upvote discussion thread
// @access  Private
router.put('/:id/discussion/:threadId/upvote', courseController.upvoteDiscussion);

export default router;

