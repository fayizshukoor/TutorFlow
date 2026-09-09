import express from 'express';
import { authenticate, requireTutor, requireStudent } from '../middleware/auth.js';
import {
  login,
  getMe,
  testAuth,
  tutorTest,
  studentTest
} from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, getMe);

/**
 * @route   GET /api/auth/test
 * @desc    Protected test endpoint returning authenticated user role
 * @access  Private (Authenticated)
 */
router.get('/test', authenticate, testAuth);

/**
 * @route   GET /api/auth/tutor-test
 * @desc    Protected tutor-only test endpoint
 * @access  Private (Tutor Only)
 */
router.get('/tutor-test', authenticate, requireTutor, tutorTest);

/**
 * @route   GET /api/auth/student-test
 * @desc    Protected student-only test endpoint
 * @access  Private (Student Only)
 */
router.get('/student-test', authenticate, requireStudent, studentTest);

export default router;
