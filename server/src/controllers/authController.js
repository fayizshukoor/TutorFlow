import { authenticateUser } from '../services/authService.js';

/**
 * Handle user login
 * POST /api/auth/login
 */
export async function login(req, res) {
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

    // Delegate credential verification to authService
    const { token, user } = await authenticateUser(normalizedEmail, password);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.statusCode === 401) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error.message
      });
    }
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during login.'
    });
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res) {
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
}

/**
 * Protected test endpoint returning authenticated user role
 * GET /api/auth/test
 */
export function testAuth(req, res) {
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
}

/**
 * Protected tutor-only test endpoint
 * GET /api/auth/tutor-test
 */
export function tutorTest(req, res) {
  return res.status(200).json({
    status: 'ok',
    message: 'Tutor access granted. You have permission to access tutor-only resources.',
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    }
  });
}

/**
 * Protected student-only test endpoint
 * GET /api/auth/student-test
 */
export function studentTest(req, res) {
  return res.status(200).json({
    status: 'ok',
    message: 'Student access granted. You have permission to access student-only resources.',
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    }
  });
}
