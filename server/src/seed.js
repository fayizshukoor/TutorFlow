import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User from './models/User.js';

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
    console.log(`✅ Tutor seeded: ${tutor.name} (${tutor.email}) [ID: ${tutor._id}]`);

    // 3. Upsert Student User (linking to the tutor)
    let student = await User.findOneAndUpdate(
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
    console.log(`✅ Student seeded: ${student.name} (${student.email}) [Assigned Tutor ID: ${student.tutorId}]`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('====================================================');
    console.log('Test Accounts Summary:');
    console.log(`👨‍🏫 Tutor:   ${SEED_CREDENTIALS.tutor.email}   / ${SEED_CREDENTIALS.tutor.password}`);
    console.log(`👨‍🎓 Student: ${SEED_CREDENTIALS.student.email} / ${SEED_CREDENTIALS.student.password}`);
    console.log('====================================================\n');

    return { tutor, student };
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
