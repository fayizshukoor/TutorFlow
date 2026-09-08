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
        weakAreas: SEED_STUDENT_PROFILE.weakAreas,
        progressSummary: {
          summary: 'Sam has made steady progress in AP Calculus BC, transitioning smoothly through parametric slope derivations and arc length computations. Performance shows rapid growth on algebraic manipulation with continued reinforcement needed on polar area integration limits.',
          improvingAreas: [
            'Parametric first and second derivative computations (dy/dx and d²y/dx²)',
            'Conversion between rectangular coordinates and polar curves',
            'Applying standard power series formulas and nth-term tests'
          ],
          strugglingAreas: [
            'Setting up correct theta integration bounds for overlapping polar curves and multi-petal areas',
            'Applying integration by parts iteratively with trigonometric substitution'
          ],
          recommendedFocus: [
            'Targeted drill on polar curve intersection points and area integrals (1/2 ∫ r² dθ)',
            'Integration by parts involving tabular method and trigonometric reduction formulas'
          ]
        },
        progressSummaryGeneratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        progressSummaryModel: 'gemini-3.6-flash'
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
        notes: '',
        aiPlan: {
          learningObjectives: [
            'Master the Ratio Test to determine the radius and interval of convergence for power series.',
            'Construct Taylor series centered at x = a and Maclaurin series for standard elementary functions (e^x, sin(x), cos(x), 1/(1-x)).'
          ],
          lessonOutline: [
            '1. Warm-Up & Diagnostic (10m): Review geometric series convergence conditions and nth-term divergence test.',
            '2. Core Concept Walkthrough (20m): Derive general Taylor formula f^(n)(a)/n!*(x-a)^n and solve radius of convergence.',
            '3. Scaffolded Practice (20m): Work through 3 AP FRQ-style convergence interval problems checking endpoint convergence.',
            '4. Synthesis & Wrap-Up (10m): Exit check problem on Maclaurin expansion of e^(-x^2) and preview of homework.'
          ],
          practiceQuestions: [
            'Find the radius and interval of convergence for the power series summation n=1 to infinity of ((-1)^n * (x - 2)^n) / (n * 3^n).',
            'Write the first four non-zero terms of the Taylor series for f(x) = ln(x) centered at x = 1.',
            'Use the known Maclaurin series for cos(x) to write the series for cos(x^2), and find the sixth derivative f^(6)(0).'
          ],
          generatedAt: new Date(now - 12 * 60 * 60 * 1000),
          modelUsed: 'gemini-3.6-flash'
        }
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✅ Upcoming session seeded: ${upcomingSession.topic} (${upcomingSession.status}) with AI Plan on ${upcomingSession.scheduledAt.toISOString()}`);

    // Seed/Upsert Completed Session (Ready for live AI generation)
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

    // Seed/Upsert Static AI-Reviewed Session (Milestone 5 demonstration)
    const reviewedScheduledAt = new Date(now - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    let aiReviewedSession = await Session.findOneAndUpdate(
      {
        tutorId: tutor._id,
        studentId: studentProfile._id,
        topic: 'Calculus BC: Parametric Equations & Polar Coordinates'
      },
      {
        tutorId: tutor._id,
        studentId: studentProfile._id,
        topic: 'Calculus BC: Parametric Equations & Polar Coordinates',
        scheduledAt: reviewedScheduledAt,
        durationMinutes: 60,
        status: 'ai_reviewed',
        notes: 'Worked through parametric tangent slopes and arc length formulas. Sam converted Cartesian to polar curves smoothly, but had difficulty setting up area integrals inside polar petals.',
        aiReview: {
          summary: 'Sam demonstrated strong algebraic foundations with parametric dy/dx differentiation and arc length formulas. Target practice is needed on finding intersection angles and setting up polar petal area integrals.',
          keyTopicsCovered: [
            'Parametric first and second derivatives',
            'Arc length of parametric curves',
            'Polar coordinate conversion and petal area setup'
          ],
          studentStrengths: [
            'Quick computation of parametric first derivatives dy/dt and dx/dt',
            'High accuracy when converting polar equations into rectangular form'
          ],
          areasForImprovement: [
            'Determining correct theta integration limits for overlapping polar curves',
            'Careful handling of trigonometric identities inside polar area integrals (1/2 integral r^2 dtheta)'
          ],
          recommendedNextSteps: [
            'Complete assigned 4-question polar area drill before next lesson',
            'Review double-angle formulas for sin^2(theta) and cos^2(theta) antiderivatives'
          ],
          homework: {
            title: 'AP Calculus BC: Polar Area & Arc Length Drill',
            description: '4 targeted problems focusing on polar petal boundaries and parametric velocity vectors (~40 mins)',
            tasks: [
              'Sketch and calculate the area enclosed by one petal of r = 3*cos(2*theta)',
              'Find the points of horizontal and vertical tangency for x(t) = t^2 - 4, y(t) = t^3 - 3t',
              'Set up and evaluate the arc length integral for x = cos^3(t), y = sin^3(t) on [0, pi/2]',
              'Self-check solutions against the AP scoring rubric and note any integration difficulties'
            ]
          },
          generatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
          modelUsed: 'gemini-3.6-flash'
        },
        aiSummary: 'Sam demonstrated strong algebraic foundations with parametric differentiation. Target practice is needed on polar petal area integrals.',
        homeworkProgress: [
          {
            taskIndex: 0,
            completed: true,
            completedAt: new Date(now - 2 * 24 * 60 * 60 * 1000)
          },
          {
            taskIndex: 1,
            completed: true,
            completedAt: new Date(now - 1 * 24 * 60 * 60 * 1000)
          },
          {
            taskIndex: 2,
            completed: false,
            completedAt: null
          },
          {
            taskIndex: 3,
            completed: false,
            completedAt: null
          }
        ]
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✅ Static AI-Reviewed session seeded: ${aiReviewedSession.topic} (${aiReviewedSession.status})`);

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
    console.log(`📅 Upcoming:     ${upcomingSession.topic} (${upcomingSession.scheduledAt.toLocaleString()})`);
    console.log(`🏁 Completed:    ${completedSession.topic} (Ready for AI generation)`);
    console.log(`✨ AI-Reviewed:  ${aiReviewedSession.topic} (Static Gemini Review)`);
    console.log('====================================================\n');

    return { tutor, studentUser, studentProfile, upcomingSession, completedSession, aiReviewedSession };
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
