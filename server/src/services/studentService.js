import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { generateStudentProgressSummary } from './geminiService.js';

/**
 * Helper to normalize string array inputs (e.g. from array or newline-separated string)
 * @param {string[]|string} input
 * @returns {string[]}
 */
export function normalizeStringArray(input) {
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
 * Find student profile by linked User ID
 * @param {string|Object} userId
 * @returns {Promise<Object|null>}
 */
export async function findStudentByUserId(userId) {
  return Student.findOne({ userId });
}

/**
 * Find all students belonging to a tutor
 * @param {string|Object} tutorId
 * @returns {Promise<Object[]>}
 */
export async function findStudentsByTutor(tutorId) {
  return Student.find({ tutorId })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email role');
}

/**
 * Find student profile by student ID and owning tutor ID
 * @param {string} studentId
 * @param {string|Object} tutorId
 * @returns {Promise<Object|null>}
 */
export async function findStudentByIdAndTutor(studentId, tutorId) {
  return Student.findOne({
    _id: studentId,
    tutorId
  }).populate('userId', 'name email role');
}

/**
 * Create a new student profile and link or provision user account
 * @param {string|Object} tutorId
 * @param {Object} data - Student payload
 * @returns {Promise<Object>} Created student document
 */
export async function createStudentProfile(tutorId, data) {
  const {
    name,
    email,
    subject,
    currentLevel,
    learningGoals,
    weakAreas
  } = data;

  const normalizedEmail = email.trim().toLowerCase();

  // Resolve or provision student User account
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    if (user.role !== 'student') {
      const error = new Error(
        `The email ${normalizedEmail} is already registered as a tutor account and cannot be enrolled as a student.`
      );
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    }

    // Check if this student user already has an active Student profile
    const existingProfile = await Student.findOne({ userId: user._id });
    if (existingProfile) {
      const error = new Error(`A student profile already exists for ${normalizedEmail}.`);
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    }

    // Link tutorId if not yet associated
    if (!user.tutorId) {
      user.tutorId = tutorId;
      await user.save();
    }
  } else {
    // Auto-provision student User account with temporary password hash
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

  return student;
}

/**
 * Update an existing student profile owned by the tutor
 * @param {string} studentId
 * @param {string|Object} tutorId
 * @param {Object} updates
 * @returns {Promise<Object>} Updated student document
 */
export async function updateStudentProfile(studentId, tutorId, updates) {
  const student = await Student.findOne({
    _id: studentId,
    tutorId
  });

  if (!student) {
    const error = new Error('Student profile not found or access denied.');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const {
    name,
    email,
    subject,
    currentLevel,
    learningGoals,
    weakAreas
  } = updates;

  if (name !== undefined) {
    student.name = name.trim();
  }

  if (email !== undefined) {
    student.email = email.trim().toLowerCase();
  }

  if (subject !== undefined) {
    student.subject = subject.trim();
  }

  if (currentLevel !== undefined) {
    student.currentLevel = currentLevel.trim();
  }

  if (learningGoals !== undefined) {
    student.learningGoals = normalizeStringArray(learningGoals);
  }

  if (weakAreas !== undefined) {
    student.weakAreas = normalizeStringArray(weakAreas);
  }

  await student.save();
  return student;
}

/**
 * Generate and save cumulative AI progress summary for a student
 * @param {string} studentId
 * @param {string|Object} tutorId
 * @returns {Promise<{ student: Object, progressSummary: Object }>}
 */
export async function generateAndSaveStudentProgressSummary(studentId, tutorId) {
  const student = await Student.findOne({
    _id: studentId,
    tutorId
  });

  if (!student) {
    const error = new Error('Student profile not found or access denied.');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Query past completed or ai_reviewed sessions for this student
  const pastSessions = await Session.find({
    studentId: student._id,
    tutorId,
    status: { $in: ['completed', 'ai_reviewed'] }
  }).sort({ scheduledAt: 1 });

  // Filter to sessions that have an AI review
  const aiReviewedSessions = pastSessions.filter(
    (s) =>
      s.aiReview &&
      (s.aiReview.summary ||
        (Array.isArray(s.aiReview.keyTopicsCovered) && s.aiReview.keyTopicsCovered.length > 0))
  );

  if (aiReviewedSessions.length === 0) {
    const error = new Error(
      'At least one AI-reviewed session is required to generate a progress summary. Complete a session and generate an AI review first.'
    );
    error.statusCode = 400;
    error.code = 'BAD_REQUEST';
    throw error;
  }

  // Call Gemini to synthesize cumulative progress summary
  const { progressSummary, modelUsed } = await generateStudentProgressSummary({
    studentName: student.name,
    subject: student.subject,
    currentLevel: student.currentLevel,
    learningGoals: student.learningGoals,
    weakAreas: student.weakAreas,
    pastSessions: aiReviewedSessions
  });

  // Safely persist summary on student document without overwriting profile fields
  student.progressSummary = progressSummary;
  student.progressSummaryGeneratedAt = new Date();
  student.progressSummaryModel = modelUsed;
  await student.save();

  return { student, progressSummary };
}
