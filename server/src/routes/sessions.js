import express from 'express';
import { authenticate, requireTutor, requireStudent } from '../middleware/auth.js';
import {
  createSession,
  getTutorSessions,
  getStudentSessions,
  getSessionById,
  updateSessionStatus,
  updateSessionNotes,
  generateAiReview,
  generateAiPlan,
  updateHomeworkProgress
} from '../controllers/sessionController.js';

const router = express.Router();

/**
 * @route   POST /api/sessions
 * @desc    Schedule a new 1-on-1 tutoring session
 * @access  Private (Tutor Only)
 */
router.post('/', authenticate, requireTutor, createSession);

/**
 * @route   GET /api/sessions
 * @desc    Get all sessions owned by the authenticated tutor
 * @access  Private (Tutor Only)
 */
router.get('/', authenticate, requireTutor, getTutorSessions);

/**
 * @route   GET /api/sessions/my-sessions
 * @desc    Get all sessions for the authenticated student
 * @access  Private (Student Only)
 * @note    Defined BEFORE /:id to prevent routing collision
 */
router.get('/my-sessions', authenticate, requireStudent, getStudentSessions);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get single session details (accessible by owning tutor or student)
 * @access  Private (Tutor or Student involved)
 */
router.get('/:id', authenticate, getSessionById);

/**
 * @route   PATCH /api/sessions/:id/status
 * @desc    Update session lifecycle status
 * @access  Private (Tutor Only)
 * @allowed scheduled -> in_progress, in_progress -> completed
 */
router.patch('/:id/status', authenticate, requireTutor, updateSessionStatus);

/**
 * @route   PATCH /api/sessions/:id/notes
 * @desc    Update session notes (Allowed ONLY while in_progress)
 * @access  Private (Tutor Only)
 */
router.patch('/:id/notes', authenticate, requireTutor, updateSessionNotes);

/**
 * @route   POST /api/sessions/:id/ai-review
 * @desc    Generate Gemini-powered lesson summary and homework assignment
 * @access  Private (Tutor Only)
 * @allowed Only sessions with status 'completed' (or 'ai_reviewed' with regenerate flag)
 */
router.post('/:id/ai-review', authenticate, requireTutor, generateAiReview);

/**
 * @route   POST /api/sessions/:id/ai-plan
 * @desc    Generate Gemini-powered pre-session lesson plan and practice questions
 * @access  Private (Tutor Only)
 * @allowed Only sessions with status 'scheduled' or 'in_progress' (before completion)
 */
router.post('/:id/ai-plan', authenticate, requireTutor, generateAiPlan);

/**
 * @route   PATCH /api/sessions/:id/homework-progress
 * @desc    Update homework task completion tracking (Assigned Student Only)
 * @access  Private (Student Only)
 * @allowed Only for 'ai_reviewed' sessions belonging to the authenticated student
 */
router.patch('/:id/homework-progress', authenticate, requireStudent, updateHomeworkProgress);

export default router;
