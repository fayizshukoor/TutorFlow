import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { authenticate, requireTutor } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper to normalize string array inputs (e.g. from array or comma-separated string)
 */
function normalizeStringArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof input === 'string') {
    return input
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

/**
 * GET /api/students/profile/me
 * Student Self Profile Lookup (Uses req.user._id)
 * Accessible by authenticated students to view their own profile
 */
router.get('/profile/me', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This endpoint is for students to view their own profile.'
      });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No student profile linked to your user account.'
      });
    }

    return res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Error fetching student profile for me:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch student profile.'
    });
  }
});

/**
 * GET /api/students
 * Tutor Only: List all students enrolled under the authenticated tutor
 */
router.get('/', authenticate, requireTutor, async (req, res) => {
  try {
    const tutorId = req.user._id;
    const students = await Student.find({ tutorId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role');

    return res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Error listing students:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve students roster.'
    });
  }
});

/**
 * POST /api/students
 * Tutor Only: Create a new student profile linked to the authenticated tutor
 */
router.post('/', authenticate, requireTutor, async (req, res) => {
  try {
    const tutorId = req.user._id;
    const {
      name,
      email,
      subject,
      currentLevel,
      learningGoals,
      weakAreas
    } = req.body;

    // Field validations
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Student name is required.'
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Student email is required.'
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Please provide a valid email address.'
      });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Subject is required.'
      });
    }

    if (!currentLevel || typeof currentLevel !== 'string' || !currentLevel.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current level is required.'
      });
    }

    // Resolve or provision a student User account for userId relation
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.role !== 'student') {
        return res.status(400).json({
          error: 'Bad Request',
          message: `The email ${normalizedEmail} is already registered as a tutor account and cannot be enrolled as a student.`
        });
      }

      // Check if this student user already has an active Student profile
      const existingProfile = await Student.findOne({ userId: user._id });
      if (existingProfile) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `A student profile already exists for ${normalizedEmail}.`
        });
      }

      // Update user's tutorId if not yet linked
      if (!user.tutorId) {
        user.tutorId = tutorId;
        await user.save();
      }
    } else {
      // Auto-provision student User account with secure random temporary password hash
      const tempPassword = `StudentPass_${crypto.randomBytes(6).toString('hex')}!`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'student',
        tutorId
      });
    }

    const formattedGoals = normalizeStringArray(learningGoals);
    const formattedWeakAreas = normalizeStringArray(weakAreas);

    const student = await Student.create({
      userId: user._id,
      tutorId,
      name: name.trim(),
      email: normalizedEmail,
      subject: subject.trim(),
      currentLevel: currentLevel.trim(),
      learningGoals: formattedGoals,
      weakAreas: formattedWeakAreas
    });

    return res.status(201).json({
      success: true,
      message: 'Student profile created successfully.',
      student
    });
  } catch (error) {
    console.error('Error creating student profile:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A student profile with this user account already exists.'
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: messages.join(', ')
      });
    }
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create student profile.'
    });
  }
});

/**
 * GET /api/students/:id
 * Tutor Only: Get a specific student profile owned by the authenticated tutor
 */
router.get('/:id', authenticate, requireTutor, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid student ID format.'
      });
    }

    const student = await Student.findOne({
      _id: id,
      tutorId: req.user._id
    }).populate('userId', 'name email role');

    if (!student) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student profile not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Error retrieving student:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve student profile.'
    });
  }
});

/**
 * PUT /api/students/:id
 * Tutor Only: Update an existing student profile owned by the authenticated tutor
 * Whitelist updateable fields: name, email, subject, currentLevel, learningGoals, weakAreas
 * Immutable: userId, tutorId, _id
 */
router.put('/:id', authenticate, requireTutor, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid student ID format.'
      });
    }

    const student = await Student.findOne({
      _id: id,
      tutorId: req.user._id
    });

    if (!student) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student profile not found or access denied.'
      });
    }

    const {
      name,
      email,
      subject,
      currentLevel,
      learningGoals,
      weakAreas
    } = req.body;

    // Apply whitelisted updates only
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Student name cannot be empty.'
        });
      }
      student.name = name.trim();
    }

    if (email !== undefined) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      const normalizedEmail = email.trim().toLowerCase();
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Please provide a valid email address.'
        });
      }
      student.email = normalizedEmail;
    }

    if (subject !== undefined) {
      if (typeof subject !== 'string' || !subject.trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Subject cannot be empty.'
        });
      }
      student.subject = subject.trim();
    }

    if (currentLevel !== undefined) {
      if (typeof currentLevel !== 'string' || !currentLevel.trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Current level cannot be empty.'
        });
      }
      student.currentLevel = currentLevel.trim();
    }

    if (learningGoals !== undefined) {
      student.learningGoals = normalizeStringArray(learningGoals);
    }

    if (weakAreas !== undefined) {
      student.weakAreas = normalizeStringArray(weakAreas);
    }

    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully.',
      student
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: messages.join(', ')
      });
    }
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update student profile.'
    });
  }
});

export default router;
