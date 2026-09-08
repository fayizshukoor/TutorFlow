import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Session from '../models/Session.js';
import { generateSessionReview } from '../services/geminiService.js';
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

async function runMilestone5Tests() {
  console.log('🚀 Starting Milestone 5 Automated Test Suite...\n');
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

    assert(tutorUser && studentUser && studentProfile, 'Tutor, student user, and student profile found in database');

    const tutorToken = createAuthToken(tutorUser);
    const studentToken = createAuthToken(studentUser);

    // 2. Fetch Sessions in different states for this student
    const scheduledSession = await Session.findOne({
      tutorId: tutorUser._id,
      studentId: studentProfile._id,
      status: 'scheduled'
    });
    const completedSession = await Session.findOne({
      tutorId: tutorUser._id,
      studentId: studentProfile._id,
      status: 'completed'
    });
    const aiReviewedSession = await Session.findOne({
      tutorId: tutorUser._id,
      studentId: studentProfile._id,
      status: 'ai_reviewed'
    });

    assert(scheduledSession !== null, 'Scheduled session exists');
    assert(completedSession !== null, 'Completed session exists');
    assert(aiReviewedSession !== null, 'AI-reviewed session exists');

    // 3. Test Student Role Gating (Students CANNOT call POST /api/sessions/:id/ai-review)
    console.log('\n--- Test 1: Role-based Gating for AI Review Endpoint ---');
    const studentAiReviewRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/ai-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    });
    assert(
      studentAiReviewRes.status === 403,
      `Student calling AI-review endpoint is rejected with 403 Forbidden (Actual: ${studentAiReviewRes.status})`
    );

    // 4. Test Lifecycle State Validation (Scheduled session CANNOT be AI-reviewed)
    console.log('\n--- Test 2: Lifecycle Status Validation (Scheduled Sessions) ---');
    const scheduledAiRes = await fetch(`${BASE_URL}/sessions/${scheduledSession._id}/ai-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      }
    });
    const scheduledAiData = await scheduledAiRes.json();
    assert(
      scheduledAiRes.status === 400,
      `AI review on scheduled session returns 400 Bad Request (Actual: ${scheduledAiRes.status})`
    );
    assert(
      scheduledAiData.message?.includes('completed'),
      `Error message explains that only completed sessions can be reviewed: "${scheduledAiData.message}"`
    );

    // 5. Test Live AI Review Generation on Completed Session
    console.log('\n--- Test 3: Live Gemini AI Review Generation ---');
    console.log('Calling Gemini service for completed session...');
    const liveAiRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/ai-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      }
    });
    const liveAiData = await liveAiRes.json();

    assert(
      liveAiRes.status === 200,
      `Tutor generates AI review for completed session with 200 OK (Actual: ${liveAiRes.status})`
    );
    assert(
      liveAiData.session?.status === 'ai_reviewed',
      `Session status transitioned to 'ai_reviewed' (Actual: ${liveAiData.session?.status})`
    );
    assert(
      typeof liveAiData.session?.aiReview?.summary === 'string' && liveAiData.session.aiReview.summary.length > 10,
      `Structured summary populated (${liveAiData.session?.aiReview?.summary?.slice(0, 60)}...)`
    );
    assert(
      Array.isArray(liveAiData.session?.aiReview?.keyTopicsCovered) && liveAiData.session.aiReview.keyTopicsCovered.length > 0,
      `Key topics covered array populated (${liveAiData.session?.aiReview?.keyTopicsCovered?.length} topics)`
    );
    assert(
      Array.isArray(liveAiData.session?.aiReview?.studentStrengths) && liveAiData.session.aiReview.studentStrengths.length > 0,
      `Student strengths array populated (${liveAiData.session?.aiReview?.studentStrengths?.length} items)`
    );
    assert(
      Array.isArray(liveAiData.session?.aiReview?.areasForImprovement) && liveAiData.session.aiReview.areasForImprovement.length > 0,
      `Areas for improvement array populated (${liveAiData.session?.aiReview?.areasForImprovement?.length} items)`
    );
    assert(
      typeof liveAiData.session?.aiReview?.homework?.title === 'string' && Array.isArray(liveAiData.session.aiReview.homework.tasks),
      `Homework assignment structured with title "${liveAiData.session?.aiReview?.homework?.title}" and ${liveAiData.session?.aiReview?.homework?.tasks?.length} tasks`
    );

    // 6. Test Regeneration Guard and Successful Regeneration
    console.log('\n--- Test 4: AI Review Re-generation Guard ---');
    const duplicateAiRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/ai-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      },
      body: JSON.stringify({ regenerate: false })
    });
    assert(
      duplicateAiRes.status === 400,
      `Duplicate generation without regenerate: true is rejected with 400 Bad Request (Actual: ${duplicateAiRes.status})`
    );

    const allowRegenerateRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/ai-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      },
      body: JSON.stringify({ regenerate: true })
    });
    assert(
      allowRegenerateRes.status === 200,
      `Regeneration with regenerate: true succeeds with 200 OK (Actual: ${allowRegenerateRes.status})`
    );

    // 7. Test Student Read-Only Access
    console.log('\n--- Test 5: Student Read Access to AI Review ---');
    const studentGetRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    const studentGetData = await studentGetRes.json();
    assert(
      studentGetRes.status === 200,
      `Student successfully retrieves own AI-reviewed session (Actual: ${studentGetRes.status})`
    );
    assert(
      studentGetData.session?.aiReview?.summary !== undefined,
      'Student response contains finalized aiReview object'
    );
    assert(
      studentGetData.session?.aiReview?.homework?.tasks?.length > 0,
      'Student response contains homework assignment tasks'
    );

    // 8. Test Student Checking Homework Task (Persistent Progress)
    console.log('\n--- Test 6: Student Check & Uncheck Homework Task ---');
    const checkTaskRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ taskIndex: 0, completed: true })
    });
    const checkTaskData = await checkTaskRes.json();
    assert(
      checkTaskRes.status === 200,
      `Student checking taskIndex 0 succeeds with 200 OK (Actual: ${checkTaskRes.status})`
    );
    assert(
      checkTaskData.homeworkProgress?.some((p) => p.taskIndex === 0 && p.completed === true && p.completedAt !== null),
      'TaskIndex 0 marked completed with valid completedAt timestamp'
    );

    // Uncheck task
    const uncheckTaskRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ taskIndex: 0, completed: false })
    });
    const uncheckTaskData = await uncheckTaskRes.json();
    assert(
      uncheckTaskRes.status === 200,
      `Student unchecking taskIndex 0 succeeds with 200 OK (Actual: ${uncheckTaskRes.status})`
    );
    assert(
      uncheckTaskData.homeworkProgress?.some((p) => p.taskIndex === 0 && p.completed === false && p.completedAt === null),
      'TaskIndex 0 marked incomplete with completedAt reset to null'
    );

    // Re-check task 0 and check task 1 for persistence verification
    await fetch(`${BASE_URL}/sessions/${completedSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ taskIndex: 0, completed: true })
    });
    await fetch(`${BASE_URL}/sessions/${completedSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ taskIndex: 1, completed: true })
    });

    // 9. Test Persistence on Fresh GET
    console.log('\n--- Test 7: Persistence on Fresh Session GET ---');
    const freshGetRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    const freshGetData = await freshGetRes.json();
    const completedIndices = freshGetData.session?.homeworkProgress
      ?.filter((p) => p.completed)
      ?.map((p) => p.taskIndex);
    assert(
      freshGetRes.status === 200 && completedIndices.includes(0) && completedIndices.includes(1),
      `Fresh fetch reflects persisted progress (Tasks 0 and 1 completed: [${completedIndices.join(', ')}])`
    );

    // 10. Test Tutor Access & Modification Denial
    console.log('\n--- Test 8: Tutor Read-Only Access & Mutation Block ---');
    const tutorGetRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}`, {
      headers: {
        Authorization: `Bearer ${tutorToken}`
      }
    });
    const tutorGetData = await tutorGetRes.json();
    assert(
      tutorGetRes.status === 200 && tutorGetData.session?.homeworkProgress?.length > 0,
      'Tutor can view student homeworkProgress array'
    );

    const tutorMutateRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      },
      body: JSON.stringify({ taskIndex: 0, completed: false })
    });
    assert(
      tutorMutateRes.status === 403,
      `Tutor attempting to modify student homework is rejected with 403 Forbidden (Actual: ${tutorMutateRes.status})`
    );

    // 11. Test Unauthorized Student Security Block
    console.log('\n--- Test 9: Unauthorized Student Security Guard ---');
    let otherStudentUser = await User.findOne({ email: 'otherstudent_test@tutorflow.com' });
    if (!otherStudentUser) {
      otherStudentUser = await User.create({
        name: 'Other Student Test',
        email: 'otherstudent_test@tutorflow.com',
        passwordHash: 'dummyhash',
        role: 'student'
      });
      await Student.create({
        userId: otherStudentUser._id,
        tutorId: tutorUser._id,
        name: 'Other Student Test',
        email: 'otherstudent_test@tutorflow.com',
        subject: 'Physics C',
        currentLevel: 'Grade 11'
      });
    }
    const otherStudentToken = createAuthToken(otherStudentUser);

    const otherStudentPatchRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherStudentToken}`
      },
      body: JSON.stringify({ taskIndex: 0, completed: true })
    });
    assert(
      otherStudentPatchRes.status === 403,
      `Unlinked student attempting to modify homework is rejected with 403 Forbidden (Actual: ${otherStudentPatchRes.status})`
    );

    const otherStudentGetRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}`, {
      headers: {
        Authorization: `Bearer ${otherStudentToken}`
      }
    });
    assert(
      otherStudentGetRes.status === 403,
      `Unlinked student attempting to view session is rejected with 403 Forbidden (Actual: ${otherStudentGetRes.status})`
    );

    // Clean up temporary other student
    await Student.deleteMany({ userId: otherStudentUser._id });
    await User.deleteMany({ _id: otherStudentUser._id });

    // 12. Test Non-AI-Reviewed Sessions Reject Homework Updates
    console.log('\n--- Test 10: State Machine Gating for Homework Progress ---');
    const scheduledHomeworkRes = await fetch(`${BASE_URL}/sessions/${scheduledSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ taskIndex: 0, completed: true })
    });
    assert(
      scheduledHomeworkRes.status === 400,
      `Scheduled session rejects homework updates with 400 Bad Request (Actual: ${scheduledHomeworkRes.status})`
    );

    // 13. Test Boundary Validation on taskIndex
    console.log('\n--- Test 11: Task Index Boundary Validation ---');
    const outOfBoundsRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ taskIndex: 999, completed: true })
    });
    assert(
      outOfBoundsRes.status === 400,
      `Out-of-bounds taskIndex (999) rejected with 400 Bad Request (Actual: ${outOfBoundsRes.status})`
    );

    const negativeIndexRes = await fetch(`${BASE_URL}/sessions/${completedSession._id}/homework-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ taskIndex: -1, completed: true })
    });
    assert(
      negativeIndexRes.status === 400,
      `Negative taskIndex (-1) rejected with 400 Bad Request (Actual: ${negativeIndexRes.status})`
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

runMilestone5Tests();
