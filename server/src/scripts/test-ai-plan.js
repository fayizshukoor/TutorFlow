import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Session from '../models/Session.js';
import { SEED_CREDENTIALS } from './seed.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'tutorflow_dev_secret_key_2026_jwt_auth_milestone2';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

function createAuthToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runAiPlanTests() {
  console.log('🚀 Starting AI Session Plan Automated Test Suite...\n');
  await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Fetch Seeded Accounts
    const tutorUser = await User.findOne({ email: SEED_CREDENTIALS.tutor.email });
    const studentUser = await User.findOne({ email: SEED_CREDENTIALS.student.email });
    const studentProfile = await Student.findOne({ userId: studentUser._id });

    assert(tutorUser && studentUser && studentProfile, 'Tutor, student user, and student profile found');

    const tutorToken = createAuthToken(tutorUser);
    const studentToken = createAuthToken(studentUser);

    // 2. Fetch Sessions in different states
    const scheduledSession = await Session.findOne({
      tutorId: tutorUser._id,
      studentId: studentProfile._id,
      status: 'scheduled'
    });
    const completedSession = await Session.findOne({
      tutorId: tutorUser._id,
      studentId: studentProfile._id,
      status: { $in: ['completed', 'ai_reviewed'] }
    });

    assert(scheduledSession !== null, 'Scheduled session exists');
    assert(completedSession !== null, 'Completed session exists');

    // 3. Test Student Role Gating (Students CANNOT call POST /api/sessions/:id/ai-plan)
    console.log('\n--- Test 1: Role-based Gating for AI Plan Endpoint ---');
    const studentPlanRes = await fetch(`${BASE_URL}/sessions/${scheduledSession._id}/ai-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    });
    assert(
      studentPlanRes.status === 403,
      `Student calling AI-plan endpoint is rejected with 403 Forbidden (Actual: ${studentPlanRes.status})`
    );

    // 4. Test Other Tutor Cross-Session Access Block
    console.log('\n--- Test 2: Other Tutor Isolation for AI Plan Endpoint ---');
    let otherTutorUser = await User.findOne({ email: 'othertutor_test@tutorflow.com' });
    if (!otherTutorUser) {
      otherTutorUser = await User.create({
        name: 'Other Tutor Test',
        email: 'othertutor_test@tutorflow.com',
        passwordHash: 'dummyhash',
        role: 'tutor'
      });
    }
    const otherTutorToken = createAuthToken(otherTutorUser);

    const otherTutorPlanRes = await fetch(`${BASE_URL}/sessions/${scheduledSession._id}/ai-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherTutorToken}`
      }
    });
    assert(
      otherTutorPlanRes.status === 404 || otherTutorPlanRes.status === 403,
      `Other tutor cannot generate AI plan for another tutor's session (Actual: ${otherTutorPlanRes.status})`
    );

    await User.deleteMany({ _id: otherTutorUser._id });

    // 5. Test Lifecycle Status Gating (Completed / AI-Reviewed sessions CANNOT be planned)
    console.log('\n--- Test 3: Lifecycle Status Gating (Completed Sessions) ---');
    const completedPlanRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/ai-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      }
    });
    const completedPlanData = await completedPlanRes.json();
    assert(
      completedPlanRes.status === 400,
      `AI Plan on completed/reviewed session returns 400 Bad Request (Actual: ${completedPlanRes.status})`
    );
    assert(
      completedPlanData.message?.includes('before a session is completed'),
      `Error message clarifies plans can only be generated before session completion: "${completedPlanData.message}"`
    );

    // 6. Test Live AI Plan Generation for Scheduled Session
    console.log('\n--- Test 4: Live Gemini AI Plan Generation ---');
    console.log('Calling Gemini service for scheduled session...');
    const livePlanRes = await fetch(`${BASE_URL}/sessions/${scheduledSession._id}/ai-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      }
    });
    const livePlanData = await livePlanRes.json();

    assert(
      livePlanRes.status === 200,
      `Tutor generates AI plan for scheduled session with 200 OK (Actual: ${livePlanRes.status})`
    );
    assert(
      livePlanData.session?.status === 'scheduled',
      `Session status remains 'scheduled' (Lifecycle invariant preserved: ${livePlanData.session?.status})`
    );
    assert(
      Array.isArray(livePlanData.session?.aiPlan?.learningObjectives) && livePlanData.session.aiPlan.learningObjectives.length > 0,
      `Learning objectives populated (${livePlanData.session?.aiPlan?.learningObjectives?.length} items)`
    );
    assert(
      Array.isArray(livePlanData.session?.aiPlan?.lessonOutline) && livePlanData.session.aiPlan.lessonOutline.length === 4,
      `Lesson outline has EXACTLY 4 structured items (Actual: ${livePlanData.session?.aiPlan?.lessonOutline?.length})`
    );
    assert(
      Array.isArray(livePlanData.session?.aiPlan?.practiceQuestions) && livePlanData.session.aiPlan.practiceQuestions.length === 3,
      `Practice questions has EXACTLY 3 targeted items (Actual: ${livePlanData.session?.aiPlan?.practiceQuestions?.length})`
    );
    assert(
      typeof livePlanData.session?.aiPlan?.modelUsed === 'string' && livePlanData.session.aiPlan.generatedAt !== null,
      `Plan metadata contains modelUsed (${livePlanData.session?.aiPlan?.modelUsed}) and timestamp`
    );

    // 7. Test Student Read-Only Access to AI Plan
    console.log('\n--- Test 5: Student Read Access to AI Plan ---');
    const studentGetRes = await fetch(`${BASE_URL}/sessions/${scheduledSession._id}`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    const studentGetData = await studentGetRes.json();
    assert(
      studentGetRes.status === 200,
      `Student successfully retrieves session with AI Plan (Actual: ${studentGetRes.status})`
    );
    assert(
      studentGetData.session?.aiPlan?.lessonOutline?.length === 4,
      'Student response contains complete 4-point AI Lesson Outline'
    );
    assert(
      studentGetData.session?.aiPlan?.practiceQuestions?.length === 3,
      'Student response contains complete 3 AI Practice Questions'
    );

    console.log('\n====================================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAiPlanTests();
