import express from 'express';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import Student from '../models/Student.js';
import { authenticate, requireTutor, requireStudent } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper: Find overlapping sessions for a tutor
 */
async function findConflictingSession(tutorId, startTime, durationMinutes, excludeSessionId = null) {
  const newStart = new Date(startTime);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

  const query = {
    tutorId,
    status: { $in: ['scheduled', 'in_progress'] },
    $expr: {
      $and: [
        { $lt: ['$scheduledAt', newEnd] },
        {
          $gt: [
            { $add: ['$scheduledAt', { $multiply: ['$durationMinutes', 60000] }] },
            newStart
          ]
        }
      ]
    }
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  return Session.findOne(query).populate('studentId', 'name');
}

/**
 * @route   POST /api/sessions
 * @desc    Schedule a new 1-on-1 tutoring session
 * @access  Private (Tutor Only)
 */
router.post('/', authenticate, requireTutor, async (req, res) => {
  try {
    const { studentId, scheduledAt, durationMinutes, topic, notes } = req.body;

    // 1. Required field validation
    if (!studentId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'studentId is required.'
      });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid studentId format.'
      });
    }
    if (!scheduledAt) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'scheduledAt date and time is required.'
      });
    }
    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid scheduledAt date format. Please provide a valid ISO date string.'
      });
    }

    // Disallow past dates (allowing 2 minutes grace period for network latency / clock variance)
    const now = new Date();
    if (parsedDate.getTime() < now.getTime() - 2 * 60 * 1000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot schedule a session in the past. Please select a future date and time.'
      });
    }
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Session topic or learning focus is required.'
      });
    }

    const duration = Number(durationMinutes) || 60;
    if (duration < 15 || duration > 240) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Duration must be between 15 and 240 minutes.'
      });
    }

    // 2. Server-side Student Ownership Verification
    const student = await Student.findOne({
      _id: studentId,
      tutorId: req.user._id
    });

    if (!student) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student profile not found or does not belong to your tutor account.'
      });
    }

    // 3. Double-Booking Conflict Detection
    const conflict = await findConflictingSession(req.user._id, parsedDate, duration);
    if (conflict) {
      const conflictStart = new Date(conflict.scheduledAt).toISOString();
      const conflictEnd = new Date(new Date(conflict.scheduledAt).getTime() + conflict.durationMinutes * 60000).toISOString();
      return res.status(400).json({
        error: 'Conflict',
        message: `Scheduling conflict: You already have a session ('${conflict.topic}') scheduled from ${conflictStart} to ${conflictEnd}.`,
        conflict: {
          sessionId: conflict._id,
          topic: conflict.topic,
          scheduledAt: conflict.scheduledAt,
          durationMinutes: conflict.durationMinutes,
          studentName: conflict.studentId?.name || 'Student'
        }
      });
    }

    // 4. Create Session
    const session = new Session({
      tutorId: req.user._id,
      studentId: student._id,
      scheduledAt: parsedDate,
      durationMinutes: duration,
      topic: topic.trim(),
      status: 'scheduled',
      notes: typeof notes === 'string' ? notes.trim() : ''
    });

    await session.save();
    await session.populate('studentId', 'name email subject currentLevel');

    return res.status(201).json({
      success: true,
      message: 'Session scheduled successfully.',
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to schedule session.'
    });
  }
});

/**
 * @route   GET /api/sessions
 * @desc    Get all sessions owned by the authenticated tutor
 * @access  Private (Tutor Only)
 */
router.get('/', authenticate, requireTutor, async (req, res) => {
  try {
    const { status, studentId } = req.query;
    const filter = { tutorId: req.user._id };

    if (status && ['scheduled', 'in_progress', 'completed', 'ai_reviewed'].includes(status)) {
      filter.status = status;
    }

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      filter.studentId = studentId;
    }

    const sessions = await Session.find(filter)
      .populate('studentId', 'name email subject currentLevel')
      .sort({ scheduledAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error('Get tutor sessions error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve sessions.'
    });
  }
});

/**
 * @route   GET /api/sessions/my-sessions
 * @desc    Get all sessions for the authenticated student
 * @access  Private (Student Only)
 * @note    Defined BEFORE /:id to prevent routing collision
 */
router.get('/my-sessions', authenticate, requireStudent, async (req, res) => {
  try {
    // Derive student record from authenticated user account
    const studentProfile = await Student.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No student profile is linked to your user account.'
      });
    }

    const sessions = await Session.find({ studentId: studentProfile._id })
      .populate('tutorId', 'name email')
      .sort({ scheduledAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error('Get student sessions error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve your sessions.'
    });
  }
});

/**
 * @route   GET /api/sessions/:id
 * @desc    Get single session details (accessible by owning tutor or student)
 * @access  Private (Tutor or Student involved)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid session ID format.'
      });
    }

    const session = await Session.findById(id)
      .populate('studentId', 'name email subject currentLevel userId')
      .populate('tutorId', 'name email');

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found.'
      });
    }

    // Access control verification
    if (req.user.role === 'tutor') {
      if (!session.tutorId._id.equals(req.user._id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied. You do not own this session.'
        });
      }
    } else if (req.user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: req.user._id });
      if (!studentProfile || !session.studentId._id.equals(studentProfile._id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied. This session does not belong to you.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get session by ID error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve session.'
    });
  }
});

/**
 * @route   PATCH /api/sessions/:id/status
 * @desc    Update session lifecycle status
 * @access  Private (Tutor Only)
 * @allowed scheduled -> in_progress, in_progress -> completed
 */
router.patch('/:id/status', authenticate, requireTutor, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid session ID format.'
      });
    }

    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Target status is required.'
      });
    }

    const session = await Session.findOne({
      _id: id,
      tutorId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found or does not belong to your tutor account.'
      });
    }

    const currentStatus = session.status;

    // Strict state transition validations
    if (status === 'ai_reviewed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Status 'ai_reviewed' cannot be set directly. It is reserved for the automated AI review service."
      });
    }

    if (currentStatus === 'completed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Completed sessions are finalized and cannot be modified."
      });
    }

    if (currentStatus === 'ai_reviewed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: "AI-reviewed sessions are finalized and cannot be modified."
      });
    }

    // Valid transitions from 'scheduled'
    if (currentStatus === 'scheduled') {
      if (status !== 'in_progress') {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Invalid transition from 'scheduled' to '${status}'. A scheduled session can only transition to 'in_progress'.`
        });
      }
    }

    // Valid transitions from 'in_progress'
    if (currentStatus === 'in_progress') {
      if (status !== 'completed') {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Invalid transition from 'in_progress' to '${status}'. An active session can only transition to 'completed'.`
        });
      }
    }

    session.status = status;
    await session.save();
    await session.populate('studentId', 'name email subject currentLevel');

    return res.status(200).json({
      success: true,
      message: `Session lifecycle status transitioned from '${currentStatus}' to '${status}'.`,
      session
    });
  } catch (error) {
    console.error('Update session status error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update session status.'
    });
  }
});

/**
 * @route   PATCH /api/sessions/:id/notes
 * @desc    Update session notes (Allowed ONLY while in_progress)
 * @access  Private (Tutor Only)
 */
router.patch('/:id/notes', authenticate, requireTutor, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid session ID format.'
      });
    }

    if (notes === undefined || typeof notes !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Notes content string is required.'
      });
    }

    const session = await Session.findOne({
      _id: id,
      tutorId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found or does not belong to your tutor account.'
      });
    }

    // Enforce notes editing policy: ONLY allowed while in_progress
    if (session.status !== 'in_progress') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Notes can only be edited while a session is 'in_progress'. Current status is '${session.status}'.`
      });
    }

    session.notes = notes;
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Session notes saved successfully.',
      session: {
        id: session._id,
        notes: session.notes,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Update session notes error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to save notes.'
    });
  }
});

export default router;
