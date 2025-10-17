import { Router } from 'express';
import { searchJobs } from '../controllers/jobs.controller';

const router = Router();

// Public route - no auth required
router.get('/search', searchJobs);

export default router;
