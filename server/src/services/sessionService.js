import Session from '../models/Session.js';

/**
 * Find overlapping sessions for a tutor to prevent double-booking
 * @param {string|Object} tutorId - Tutor ObjectId
 * @param {Date|string} startTime - Proposed session start date/time
 * @param {number} durationMinutes - Session duration in minutes
 * @param {string|Object} [excludeSessionId] - Optional session ID to exclude (for updates)
 * @returns {Promise<Object|null>} Conflicting session document or null
 */
export async function findConflictingSession(tutorId, startTime, durationMinutes, excludeSessionId = null) {
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
 * Validate session status transitions
 * @param {string} currentStatus - Current lifecycle status
 * @param {string} targetStatus - Requested lifecycle status
 * @returns {{ valid: boolean, message?: string }} Validation outcome
 */
export function validateSessionStatusTransition(currentStatus, targetStatus) {
  if (targetStatus === 'ai_reviewed') {
    return {
      valid: false,
      message: "Status 'ai_reviewed' cannot be set directly. It is reserved for the automated AI review service."
    };
  }

  if (currentStatus === 'completed') {
    return {
      valid: false,
      message: 'Completed sessions are finalized and cannot be modified.'
    };
  }

  if (currentStatus === 'ai_reviewed') {
    return {
      valid: false,
      message: 'AI-reviewed sessions are finalized and cannot be modified.'
    };
  }

  if (currentStatus === 'scheduled') {
    if (targetStatus !== 'in_progress') {
      return {
        valid: false,
        message: `Invalid transition from 'scheduled' to '${targetStatus}'. A scheduled session can only transition to 'in_progress'.`
      };
    }
  }

  if (currentStatus === 'in_progress') {
    if (targetStatus !== 'completed') {
      return {
        valid: false,
        message: `Invalid transition from 'in_progress' to '${targetStatus}'. An active session can only transition to 'completed'.`
      };
    }
  }

  return { valid: true };
}
