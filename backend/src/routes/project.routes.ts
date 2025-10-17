import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as projectController from '../controllers/project.controller';
import { uploadProjectImage, handleMulterError } from '../middleware/upload';

const router = Router();

// @route   GET /api/projects
// @desc    Get all projects (with filters)
// @access  Public
router.get('/', projectController.getAllProjects);

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Public
router.get('/:id', projectController.getProjectById);

// Protected routes (require authentication)
router.use(authenticate);

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', projectController.createProject);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', projectController.updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', projectController.deleteProject);

// @route   POST /api/projects/upload-image
// @desc    Upload project image
// @access  Private
router.post(
  '/upload-image',
  uploadProjectImage.single('projectImage'),
  handleMulterError,
  projectController.uploadProjectImage
);

// @route   POST /api/projects/:id/like
// @desc    Like/unlike project
// @access  Private
router.post('/:id/like', projectController.toggleLikeProject);

// @route   POST /api/projects/:id/view
// @desc    Increment project views
// @access  Private
router.post('/:id/view', projectController.incrementViews);

export default router;

