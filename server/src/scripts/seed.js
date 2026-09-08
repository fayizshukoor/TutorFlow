import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Session from '../models/Session.js';

dotenv.config();

const SALT_ROUNDS = 10;

export const SEED_CREDENTIALS = {
  tutor: {
    name: 'Alex Rivera (Tutor)',
    email: 'tutor@tutorflow.com',
    password: 'TutorPass123!',
    role: 'tutor'
  },
  student: {
    name: 'Sam Chen (Student)',
    email: 'student@tutorflow.com',
    password: 'StudentPass123!',
    role: 'student'
  }
};

export const SEED_STUDENT_PROFILE = {
  name: 'Sam Chen',
  email: 'student@tutorflow.com',
  subject: 'AP Calculus BC',
  currentLevel: 'Grade 12 / Advanced',
  learningGoals: [
    'Master Taylor & Maclaurin Series convergence tests',
    'Achieve a 5 on the AP Calculus BC Exam',
    'Improve speed and accuracy on Free Response Questions (FRQ)'
  ],
  weakAreas: [
    'Integration by parts with trigonometric substitution',
    'Parametric equations & polar area calculus'
  ]
};

export async function seedUsers() {
  console.log('🌱 Starting database seeding...');
  
  try {
    await connectDB();

    // 1. Hash passwords
    const tutorPasswordHash = await bcrypt.hash(SEED_CREDENTIALS.tutor.password, SALT_ROUNDS);
    const studentPasswordHash = await bcrypt.hash(SEED_CREDENTIALS.student.password, SALT_ROUNDS);

    // 2. Upsert Tutor User
    let tutor = await User.findOneAndUpdate(
      { email: SEED_CREDENTIALS.tutor.email },
      {
        name: SEED_CREDENTIALS.tutor.name,
        email: SEED_CREDENTIALS.tutor.email,
        passwordHash: tutorPasswordHash,
        role: 'tutor',
        tutorId: null
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✅ Tutor user seeded: ${tutor.name} (${tutor.email}) [ID: ${tutor._id}]`);

    // 3. Upsert Student User (linking to the tutor)
    let studentUser = await User.findOneAndUpdate(
      { email: SEED_CREDENTIALS.student.email },
      {
        name: SEED_CREDENTIALS.student.name,
        email: SEED_CREDENTIALS.student.email,
        passwordHash: studentPasswordHash,
        role: 'student',
        tutorId: tutor._id
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✅ Student user seeded: ${studentUser.name} (${studentUser.email}) [User ID: ${studentUser._id}, Assigned Tutor: ${studentUser.tutorId}]`);

    // 4. Upsert Student Profile (linking userId to studentUser._id and tutorId to tutor._id)
    let studentProfile = await Student.findOneAndUpdate(
      { userId: studentUser._id },
      {
        userId: studentUser._id,
        tutorId: tutor._id,
        name: SEED_STUDENT_PROFILE.name,
        email: SEED_STUDENT_PROFILE.email,
        subject: SEED_STUDENT_PROFILE.subject,
        currentLevel: SEED_STUDENT_PROFILE.currentLevel,
        learningGoals: SEED_STUDENT_PROFILE.learningGoals,
        weakAreas: SEED_STUDENT_PROFILE.weakAreas
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✅ Student profile seeded: ${studentProfile.name} (${studentProfile.subject} - ${studentProfile.currentLevel}) [Profile ID: ${studentProfile._id}]`);

    // 5. Seed Dynamic Sessions (Relative timestamps for realism)
    const now = Date.now();
    const upcomingScheduledAt = new Date(now + 24 * 60 * 60 * 1000); // Tomorrow (+24h)
    const completedScheduledAt = new Date(now - 24 * 60 * 60 * 1000); // Yesterday (-24h)

    // Seed/Upsert Upcoming Session
    let upcomingSession = await Session.findOneAndUpdate(
      {
        tutorId: tutor._id,
        studentId: studentProfile._id,
        topic: 'Taylor & Maclaurin Series - Power Series Convergence'
      },
      {
        tutorId: tutor._id,
        studentId: studentProfile._id,
        topic: 'Taylor & Maclaurin Series - Power Series Convergence',
        scheduledAt: upcomingScheduledAt,
        durationMinutes: 60,
        status: 'scheduled',
        notes: ''
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✅ Upcoming session seeded: ${upcomingSession.topic} (${upcomingSession.status}) on ${upcomingSession.scheduledAt.toISOString()}`);

    // Seed/Upsert Completed Session
    let completedSession = await Session.findOneAndUpdate(
      {
        tutorId: tutor._id,
        studentId: studentProfile._id,
        topic: 'Integration Techniques & Trigonometric Substitution Drill'
      },
      {
        tutorId: tutor._id,
        studentId: studentProfile._id,
        topic: 'Integration Techniques & Trigonometric Substitution Drill',
        scheduledAt: completedScheduledAt,
        durationMinutes: 60,
        status: 'completed',
        notes: 'Reviewed standard integral substitutions (sin/tan/sec). Sam solved 4 out of 5 AP FRQ-style problems correctly. Focus area for next drill: integrating sec^3(x) and applying integration by parts twice.'
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✅ Completed session seeded: ${completedSession.topic} (${completedSession.status}) with finalized notes`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('====================================================');
    console.log('Test Accounts Summary:');
    console.log(`👨‍🏫 Tutor:   ${SEED_CREDENTIALS.tutor.email}   / ${SEED_CREDENTIALS.tutor.password}`);
    console.log(`👨‍🎓 Student: ${SEED_CREDENTIALS.student.email} / ${SEED_CREDENTIALS.student.password}`);
    console.log('Linked Student Profile:');
    console.log(`📚 Subject: ${studentProfile.subject} | Level: ${studentProfile.currentLevel}`);
    console.log(`🎯 Goals:   ${studentProfile.learningGoals.join(', ')}`);
    console.log(`⚠️ Weak:    ${studentProfile.weakAreas.join(', ')}`);
    console.log('Seeded Sessions:');
    console.log(`📅 Upcoming:  ${upcomingSession.topic} (${upcomingSession.scheduledAt.toLocaleString()})`);
    console.log(`🏁 Completed: ${completedSession.topic} (Notes finalized)`);
    console.log('====================================================\n');

    return { tutor, studentUser, studentProfile, upcomingSession, completedSession };
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    throw error;
  }
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedUsers()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
