import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tutorflow_dev_secret_key_2026_jwt_auth_milestone2';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate a signed JWT token for a user
 * @param {Object} user - User document
 * @param {string} [expiresIn] - Expiration duration string
 * @returns {string} Signed JWT token
 */
export function generateToken(user, expiresIn = JWT_EXPIRES_IN) {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  return jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    secret,
    { expiresIn }
  );
}

/**
 * Authenticate a user with email and password
 * @param {string} email - Normalized email address
 * @param {string} password - Raw password
 * @returns {Promise<{ user: Object, token: string }>} Sanitized user object and JWT token
 */
export async function authenticateUser(email, password) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tutorId: user.tutorId || null,
      createdAt: user.createdAt
    }
  };
}
