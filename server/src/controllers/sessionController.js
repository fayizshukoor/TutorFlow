import mongoose from 'mongoose';
import Session from '../models/Session.js';
import Student from '../models/Student.js';
import {
  findConflictingSession,
  validateSessionStatusTransition
} from '../services/sessionService.js';
import {
  generateSessionReview,
  generateSessionPlan
} from '../services/geminiService.js';

/**
 * Schedule a new 1-on-1 tutoring session
 * POST /api/sessions
 */
export async function createSession(req, res) {
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
}

/**
 * Get all sessions owned by the authenticated tutor
 * GET /api/sessions
 */
export async function getTutorSessions(req, res) {
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
}

/**
 * Get all sessions for the authenticated student
 * GET /api/sessions/my-sessions
 */
export async function getStudentSessions(req, res) {
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
}

/**
 * Get single session details (accessible by owning tutor or assigned student)
 * GET /api/sessions/:id
 */
export async function getSessionById(req, res) {
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
}

/**
 * Update session lifecycle status
 * PATCH /api/sessions/:id/status
 */
export async function updateSessionStatus(req, res) {
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
    const transition = validateSessionStatusTransition(currentStatus, status);

    if (!transition.valid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: transition.message
      });
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
}

/**
 * Update session notes (Allowed ONLY while in_progress)
 * PATCH /api/sessions/:id/notes
 */
export async function updateSessionNotes(req, res) {
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
}

/**
 * Generate Gemini-powered lesson summary and homework assignment
 * POST /api/sessions/:id/ai-review
 */
export async function generateAiReview(req, res) {
  try {
    const { id } = req.params;
    const { regenerate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid session ID format.'
      });
    }

    // Find session belonging to the authenticated tutor
    const session = await Session.findOne({
      _id: id,
      tutorId: req.user._id
    }).populate('studentId', 'name email subject currentLevel learningGoals weakAreas');

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found or does not belong to your tutor account.'
      });
    }

    // Status validation rules
    if (session.status === 'scheduled' || session.status === 'in_progress') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `AI Review can only be generated for completed sessions. Current session status is '${session.status}'.`
      });
    }

    if (session.status === 'ai_reviewed' && !regenerate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This session has already been reviewed by AI. Provide { regenerate: true } to regenerate.'
      });
    }

    const student = session.studentId || {};

    // Call Gemini AI service
    const { aiReview, aiSummaryText, modelUsed } = await generateSessionReview({
      topic: session.topic,
      notes: session.notes,
      studentName: student.name || 'Student',
      subject: student.subject || 'Tutoring Subject',
      currentLevel: student.currentLevel || 'General',
      learningGoals: student.learningGoals || [],
      weakAreas: student.weakAreas || [],
      durationMinutes: session.durationMinutes || 60
    });

    // Update session state
    session.aiReview = aiReview;
    session.aiSummary = aiSummaryText;
    session.status = 'ai_reviewed';

    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Gemini AI review generated successfully.',
      modelUsed,
      session
    });
  } catch (error) {
    console.error('Generate AI review error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.code || 'AI Service Error',
      message: error.message || 'Failed to generate AI review. Please check server Gemini configuration.'
    });
  }
}

/**
 * Generate Gemini-powered pre-session lesson plan and practice questions
 * POST /api/sessions/:id/ai-plan
 */
export async function generateAiPlan(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid session ID format.'
      });
    }

    // Find session belonging to the authenticated tutor
    const session = await Session.findOne({
      _id: id,
      tutorId: req.user._id
    }).populate('studentId', 'name email subject currentLevel learningGoals weakAreas');

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found or does not belong to your tutor account.'
      });
    }

    // Status validation: AI Plan can ONLY be generated BEFORE session is completed
    if (session.status === 'completed' || session.status === 'ai_reviewed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `AI session plans can only be generated before a session is completed. Current session status is '${session.status}'.`
      });
    }

    const student = session.studentId || {};

    // Load past completed/ai_reviewed sessions for context
    const pastSessions = await Session.find({
      studentId: student._id,
      status: { $in: ['completed', 'ai_reviewed'] }
    })
      .sort({ scheduledAt: -1 })
      .limit(3);

    let pastSessionsSummary = '';
    if (pastSessions.length > 0) {
      pastSessionsSummary = pastSessions
        .map((s, idx) => {
          const rev = s.aiReview?.summary || s.notes || 'Completed session.';
          const weak = s.aiReview?.areasForImprovement?.join(', ') || '';
          return `Past Lesson #${idx + 1} (${s.topic}): ${rev}${weak ? ` [Flagged practice areas: ${weak}]` : ''}`;
        })
        .join('\n');
    }

    // Call Gemini AI Plan generator
    const { aiPlan, modelUsed } = await generateSessionPlan({
      topic: session.topic,
      studentName: student.name || 'Student',
      subject: student.subject || 'Tutoring Subject',
      currentLevel: student.currentLevel || 'General',
      learningGoals: student.learningGoals || [],
      weakAreas: student.weakAreas || [],
      durationMinutes: session.durationMinutes || 60,
      pastSessionsSummary
    });

    // Save AI plan without modifying session lifecycle status
    session.aiPlan = aiPlan;
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'AI session plan generated successfully.',
      modelUsed,
      aiPlan: session.aiPlan,
      session
    });
  } catch (error) {
    console.error('Generate AI session plan error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.code || 'AI Service Error',
      message: error.message || 'Failed to generate AI session plan. Please check server Gemini configuration.'
    });
  }
}

/**
 * Update homework task completion tracking (Assigned Student Only)
 * PATCH /api/sessions/:id/homework-progress
 */
export async function updateHomeworkProgress(req, res) {
  try {
    const { id } = req.params;
    const { taskIndex, completed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid session ID format.'
      });
    }

    if (typeof taskIndex !== 'number' || !Number.isInteger(taskIndex) || typeof completed !== 'boolean') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'taskIndex (integer) and completed (boolean) are required.'
      });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found.'
      });
    }

    // Verify student ownership
    const studentProfile = await Student.findOne({ userId: req.user._id });
    if (!studentProfile || !session.studentId.equals(studentProfile._id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. You are not assigned to this session.'
      });
    }

    // Status verification: only ai_reviewed sessions have assigned homework
    if (session.status !== 'ai_reviewed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Homework progress can only be updated for AI-reviewed sessions. Current status is '${session.status}'.`
      });
    }

    // Validate taskIndex boundary against session.aiReview.homework.tasks
    const tasks = session.aiReview?.homework?.tasks;
    if (!Array.isArray(tasks) || taskIndex < 0 || taskIndex >= tasks.length) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid taskIndex (${taskIndex}). Must be between 0 and ${(tasks?.length || 1) - 1}.`
      });
    }

    if (!Array.isArray(session.homeworkProgress)) {
      session.homeworkProgress = [];
    }

    const existingIdx = session.homeworkProgress.findIndex((item) => item.taskIndex === taskIndex);
    if (existingIdx !== -1) {
      session.homeworkProgress[existingIdx].completed = completed;
      session.homeworkProgress[existingIdx].completedAt = completed ? new Date() : null;
    } else {
      session.homeworkProgress.push({
        taskIndex,
        completed,
        completedAt: completed ? new Date() : null
      });
    }

    await session.save();
    await session.populate('studentId', 'name email subject currentLevel');
    await session.populate('tutorId', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Homework progress updated successfully.',
      homeworkProgress: session.homeworkProgress,
      session
    });
  } catch (error) {
    console.error('Update homework progress error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update homework progress.'
    });
  }
}
