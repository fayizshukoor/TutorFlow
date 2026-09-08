import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tutor ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters']
    },
    currentLevel: {
      type: String,
      required: [true, 'Current level is required'],
      trim: true,
      maxlength: [100, 'Current level cannot exceed 100 characters']
    },
    learningGoals: {
      type: [String],
      default: []
    },
    weakAreas: {
      type: [String],
      default: []
    },
    progressSummary: {
      summary: {
        type: String,
        default: ''
      },
      improvingAreas: {
        type: [String],
        default: []
      },
      strugglingAreas: {
        type: [String],
        default: []
      },
      recommendedFocus: {
        type: [String],
        default: []
      }
    },
    progressSummaryGeneratedAt: {
      type: Date,
      default: null
    },
    progressSummaryModel: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const Student = mongoose.model('Student', studentSchema);

export default Student;
