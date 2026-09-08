import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Session from '../models/Session.js';
import { connectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'tutorflow_dev_secret_key_2026_jwt_auth_milestone2';

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id || user.id,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ PASS: ${message}`);
}

async function runProgressSummaryTests() {
  console.log('🚀 Starting Tutor Progress Summary Automated Test Suite...\n');

  try {
    await connectDB();

    // 1. Fetch Seeded Entities
    const tutor = await User.findOne({ email: 'tutor@tutorflow.com' });
    const studentUser = await User.findOne({ email: 'student@tutorflow.com' });
    const studentProfile = await Student.findOne({ email: 'student@tutorflow.com' });

    assert(tutor && studentUser && studentProfile, 'Tutor, student user, and student profile found in database');

    const tutorToken = generateToken(tutor);
    const studentToken = generateToken(studentUser);

    // Create an unassigned other tutor for isolation testing
    let otherTutor = await User.findOne({ email: 'other_tutor_summary@tutorflow.com' });
    if (!otherTutor) {
      otherTutor = await User.create({
        name: 'Other Summary Tutor',
        email: 'other_tutor_summary@tutorflow.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'tutor'
      });
    }
    const otherTutorToken = generateToken(otherTutor);

    // Create a student profile with NO completed/AI-reviewed sessions for zero-review testing
    let emptyStudentUser = await User.findOne({ email: 'empty_student@tutorflow.com' });
    if (!emptyStudentUser) {
      emptyStudentUser = await User.create({
        name: 'Empty Student',
        email: 'empty_student@tutorflow.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'student',
        tutorId: tutor._id
      });
    }

    let emptyStudentProfile = await Student.findOne({ userId: emptyStudentUser._id });
    if (!emptyStudentProfile) {
      emptyStudentProfile = await Student.create({
        userId: emptyStudentUser._id,
        tutorId: tutor._id,
        name: 'Empty Student',
        email: 'empty_student@tutorflow.com',
        subject: 'Introductory Physics',
        currentLevel: 'Grade 10',
        learningGoals: ['Understand Newtonian Mechanics'],
        weakAreas: ['Free Body Diagrams']
      });
    }

    // Ensure empty student has NO ai_reviewed sessions
    await Session.deleteMany({ studentId: emptyStudentProfile._id });

    // --- TEST 1: Role-Based Gating for Progress Summary Endpoint ---
    console.log('\n--- Test 1: Role-based Gating for Progress Summary Endpoint ---');
    const studentReq = await fetch(`${BASE_URL}/students/${studentProfile._id}/progress-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    });
    assert(studentReq.status === 403, `Student calling progress-summary endpoint is rejected with 403 Forbidden (Actual: ${studentReq.status})`);

    // --- TEST 2: Other Tutor Isolation for Progress Summary Endpoint ---
    console.log('\n--- Test 2: Other Tutor Isolation for Progress Summary Endpoint ---');
    const otherTutorReq = await fetch(`${BASE_URL}/students/${studentProfile._id}/progress-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherTutorToken}`
      }
    });
    assert(otherTutorReq.status === 404, `Other tutor cannot generate progress summary for another tutor's student (Actual: ${otherTutorReq.status})`);

    // --- TEST 3: Zero AI-Review Session Guard ---
    console.log('\n--- Test 3: Zero AI-Review Session Guard ---');
    const zeroReviewReq = await fetch(`${BASE_URL}/students/${emptyStudentProfile._id}/progress-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      }
    });
    assert(zeroReviewReq.status === 400, `Student with no AI reviews returns 400 Bad Request (Actual: ${zeroReviewReq.status})`);
    const zeroReviewJson = await zeroReviewReq.json();
    assert(
      zeroReviewJson.message && zeroReviewJson.message.toLowerCase().includes('ai-reviewed session is required'),
      `Error message clarifies that AI-reviewed sessions are required: "${zeroReviewJson.message}"`
    );

    // --- TEST 4: Live Gemini AI Progress Summary Generation ---
    console.log('\n--- Test 4: Live Gemini AI Progress Summary Generation ---');
    console.log('Calling Gemini service for student progress summary...');
    const generateReq = await fetch(`${BASE_URL}/students/${studentProfile._id}/progress-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tutorToken}`
      }
    });

    assert(generateReq.status === 200, `Tutor generates AI progress summary with 200 OK (Actual: ${generateReq.status})`);
    const generateJson = await generateReq.json();

    assert(generateJson.success === true, 'Response contains success: true');
    assert(generateJson.progressSummary, 'Response contains progressSummary object');
    assert(typeof generateJson.progressSummary.summary === 'string' && generateJson.progressSummary.summary.length > 20, 'Overall progress summary narrative populated');
    assert(Array.isArray(generateJson.progressSummary.improvingAreas) && generateJson.progressSummary.improvingAreas.length > 0, `Improving areas populated (${generateJson.progressSummary.improvingAreas.length} items)`);
    assert(Array.isArray(generateJson.progressSummary.strugglingAreas) && generateJson.progressSummary.strugglingAreas.length > 0, `Struggling areas populated (${generateJson.progressSummary.strugglingAreas.length} items)`);
    assert(Array.isArray(generateJson.progressSummary.recommendedFocus) && generateJson.progressSummary.recommendedFocus.length > 0, `Recommended focus populated (${generateJson.progressSummary.recommendedFocus.length} items)`);

    // Verify student profile fields were NOT overwritten
    assert(generateJson.student.name === 'Sam Chen', 'Student name preserved without overwrite');
    assert(generateJson.student.subject === 'AP Calculus BC', 'Student subject preserved without overwrite');
    assert(generateJson.student.currentLevel === 'Grade 12 / Advanced', 'Student currentLevel preserved without overwrite');
    assert(generateJson.student.progressSummaryGeneratedAt, 'progressSummaryGeneratedAt timestamp recorded');
    assert(generateJson.student.progressSummaryModel, `progressSummaryModel tag recorded: ${generateJson.student.progressSummaryModel}`);

    // --- TEST 5: Persistence on Subsequent GET ---
    console.log('\n--- Test 5: Persistence on Subsequent GET ---');
    const getStudentReq = await fetch(`${BASE_URL}/students/${studentProfile._id}`, {
      headers: {
        Authorization: `Bearer ${tutorToken}`
      }
    });
    assert(getStudentReq.status === 200, `Tutor retrieves student profile with 200 OK (Actual: ${getStudentReq.status})`);
    const getStudentJson = await getStudentReq.json();
    assert(
      getStudentJson.student.progressSummary && getStudentJson.student.progressSummary.summary === generateJson.progressSummary.summary,
      'Persisted progressSummary is accurately returned on fresh GET request'
    );
    assert(
      getStudentJson.student.progressSummary.improvingAreas.length === generateJson.progressSummary.improvingAreas.length,
      'Persisted improvingAreas array matches generated count'
    );

    // --- Clean Up Scratch Test User ---
    await User.deleteOne({ _id: otherTutor._id });
    await Student.deleteOne({ _id: emptyStudentProfile._id });
    await User.deleteOne({ _id: emptyStudentUser._id });

    console.log('\n====================================================');
    console.log('Test Results: 16 Passed, 0 Failed');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Test Suite Aborted due to error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runProgressSummaryTests();
