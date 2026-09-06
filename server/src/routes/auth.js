import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate, requireRole, requireTutor, requireStudent } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'tutorflow_dev_secret_key_2026_jwt_auth_milestone2';
const JWT_EXPIRES_IN = '7d';

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.'
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password must be valid strings.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Please provide a valid email address.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return token and sanitized user object
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tutorId: user.tutorId || null,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during login.'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    return res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        tutorId: req.user.tutorId || null,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile.'
    });
  }
});

/**
 * @route   GET /api/auth/test
 * @desc    Protected test endpoint returning authenticated user role
 * @access  Private (Authenticated)
 */
router.get('/test', authenticate, (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: `Authentication verified. You are logged in as a ${req.user.role}.`,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/auth/tutor-test
 * @desc    Protected tutor-only test endpoint
 * @access  Private (Tutor Only)
 */
router.get('/tutor-test', authenticate, requireTutor, (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Tutor access granted. You have permission to access tutor-only resources.',
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    }
  });
});

/**
 * @route   GET /api/auth/student-test
 * @desc    Protected student-only test endpoint
 * @access  Private (Student Only)
 */
router.get('/student-test', authenticate, requireStudent, (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Student access granted. You have permission to access student-only resources.',
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    }
  });
});

export default router;
