import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as collaborationController from '../controllers/collaboration.controller';

const router = Router();

// @route   GET /api/collaborations
// @desc    Get all collaboration posts (with filters)
// @access  Public
router.get('/', collaborationController.getAllCollaborations);

// @route   GET /api/collaborations/:id
// @desc    Get single collaboration post
// @access  Public
router.get('/:id', collaborationController.getCollaborationById);

// Protected routes (require authentication)
router.use(authenticate);

// @route   POST /api/collaborations
// @desc    Create new collaboration post
// @access  Private
router.post('/', collaborationController.createCollaboration);

// @route   PUT /api/collaborations/:id
// @desc    Update collaboration post
// @access  Private
router.put('/:id', collaborationController.updateCollaboration);

// @route   DELETE /api/collaborations/:id
// @desc    Delete collaboration post
// @access  Private
router.delete('/:id', collaborationController.deleteCollaboration);

// @route   POST /api/collaborations/:id/request
// @desc    Request to join collaboration
// @access  Private
router.post('/:id/request', collaborationController.requestToJoin);

// @route   POST /api/collaborations/:id/approve/:userId
// @desc    Approve member request
// @access  Private
router.post('/:id/approve/:userId', collaborationController.approveMember);

// @route   DELETE /api/collaborations/:id/remove/:userId
// @desc    Remove member from collaboration
// @access  Private
router.delete('/:id/remove/:userId', collaborationController.removeMember);

export default router;
