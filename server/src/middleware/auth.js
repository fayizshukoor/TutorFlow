import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to authenticate requests using JWT
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Token is malformed.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'tutorflow_dev_secret_key_2026_jwt_auth_milestone2';
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token.'
      });
    }

    // Fetch user from DB to verify user still exists & get latest role
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User associated with this token no longer exists.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate request.'
    });
  }
}

/**
 * Middleware to restrict route to specific roles
 * @param  {...string} allowedRoles - e.g. 'tutor', 'student'
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before checking permissions.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. This resource requires role: [${allowedRoles.join(', ')}]. Your current role is: '${req.user.role}'.`
      });
    }

    next();
  };
}

export const requireTutor = requireRole('tutor');
export const requireStudent = requireRole('student');
