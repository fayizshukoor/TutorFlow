import express from 'express';
import { authenticate, requireTutor } from '../middleware/auth.js';
import {
  getStudentProfileMe,
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  generateProgressSummary
} from '../controllers/studentController.js';

const router = express.Router();

/**
 * GET /api/students/profile/me
 * Student Self Profile Lookup (Uses req.user._id)
 * Accessible by authenticated students to view their own profile
 */
router.get('/profile/me', authenticate, getStudentProfileMe);

/**
 * GET /api/students
 * Tutor Only: List all students enrolled under the authenticated tutor
 */
router.get('/', authenticate, requireTutor, getStudents);

/**
 * POST /api/students
 * Tutor Only: Create a new student profile linked to the authenticated tutor
 */
router.post('/', authenticate, requireTutor, createStudent);

/**
 * GET /api/students/:id
 * Tutor Only: Get a specific student profile owned by the authenticated tutor
 */
router.get('/:id', authenticate, requireTutor, getStudentById);

/**
 * PUT /api/students/:id
 * Tutor Only: Update an existing student profile owned by the authenticated tutor
 */
router.put('/:id', authenticate, requireTutor, updateStudent);

/**
 * POST /api/students/:id/progress-summary
 * Tutor Only: Generate a cumulative AI Progress Summary synthesizing all past AI reviews
 */
router.post('/:id/progress-summary', authenticate, requireTutor, generateProgressSummary);

export default router;
