import mongoose from 'mongoose';

/**
 * Session Schema for TutorFlow
 * Represents 1-on-1 scheduled tutoring sessions with state machine lifecycle.
 */
const sessionSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tutor ID is required.'],
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required.'],
      index: true
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Session scheduled date and time is required.'],
      index: true
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required.'],
      min: [15, 'Session duration must be at least 15 minutes.'],
      max: [240, 'Session duration cannot exceed 240 minutes.'],
      default: 60
    },
    topic: {
      type: String,
      required: [true, 'Session topic or learning focus is required.'],
      trim: true,
      maxlength: [200, 'Topic description cannot exceed 200 characters.']
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'in_progress', 'completed', 'ai_reviewed'],
        message: 'Status must be one of: scheduled, in_progress, completed, ai_reviewed'
      },
      default: 'scheduled',
      index: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    aiSummary: {
      type: String,
      default: null,
      trim: true
    },
    aiReview: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    homeworkProgress: [
      {
        taskIndex: {
          type: Number,
          required: true
        },
        completed: {
          type: Boolean,
          default: false
        },
        completedAt: {
          type: Date,
          default: null
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Format output object cleanly
sessionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

sessionSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
