import mongoose from 'mongoose';
import {
  findStudentByUserId,
  findStudentsByTutor,
  findStudentByIdAndTutor,
  createStudentProfile,
  updateStudentProfile,
  generateAndSaveStudentProgressSummary
} from '../services/studentService.js';

/**
 * GET /api/students/profile/me
 * Student Self Profile Lookup (Uses req.user._id)
 */
export async function getStudentProfileMe(req, res) {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This endpoint is for students to view their own profile.'
      });
    }

    const student = await findStudentByUserId(req.user._id);
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
}

/**
 * GET /api/students
 * Tutor Only: List all students enrolled under the authenticated tutor
 */
export async function getStudents(req, res) {
  try {
    const students = await findStudentsByTutor(req.user._id);

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
}

/**
 * POST /api/students
 * Tutor Only: Create a new student profile linked to the authenticated tutor
 */
export async function createStudent(req, res) {
  try {
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

    const student = await createStudentProfile(req.user._id, {
      name,
      email: normalizedEmail,
      subject,
      currentLevel,
      learningGoals,
      weakAreas
    });

    return res.status(201).json({
      success: true,
      message: 'Student profile created successfully.',
      student
    });
  } catch (error) {
    console.error('Error creating student profile:', error);
    if (error.statusCode === 400) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
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
}

/**
 * GET /api/students/:id
 * Tutor Only: Get a specific student profile owned by the authenticated tutor
 */
export async function getStudentById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid student ID format.'
      });
    }

    const student = await findStudentByIdAndTutor(id, req.user._id);

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
}

/**
 * PUT /api/students/:id
 * Tutor Only: Update an existing student profile owned by the authenticated tutor
 */
export async function updateStudent(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid student ID format.'
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

    // Validate update fields if provided
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Student name cannot be empty.'
      });
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
    }

    if (subject !== undefined && (typeof subject !== 'string' || !subject.trim())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Subject cannot be empty.'
      });
    }

    if (currentLevel !== undefined && (typeof currentLevel !== 'string' || !currentLevel.trim())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current level cannot be empty.'
      });
    }

    const student = await updateStudentProfile(id, req.user._id, {
      name,
      email,
      subject,
      currentLevel,
      learningGoals,
      weakAreas
    });

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully.',
      student
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
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
      message: 'Failed to update student profile.'
    });
  }
}

/**
 * POST /api/students/:id/progress-summary
 * Tutor Only: Generate a cumulative AI Progress Summary synthesizing all past AI reviews
 */
export async function generateProgressSummary(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid student ID format.'
      });
    }

    const { student, progressSummary } = await generateAndSaveStudentProgressSummary(
      id,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: 'Student progress summary generated successfully.',
      progressSummary,
      student
    });
  } catch (error) {
    console.error('Error generating student progress summary:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    const status = error.statusCode || error.status || 500;
    return res.status(status).json({
      error: error.code || 'AI_GENERATION_FAILED',
      message: error.message || 'Failed to generate student progress summary.'
    });
  }
}
