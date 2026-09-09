import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start Server after verifying MongoDB connection
async function startServer() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`🚀 TutorFlow server running on http://localhost:${PORT}`);
    });
    return server;
  } catch (err) {
    console.error('❌ Fatal error: Server startup aborted because MongoDB connection failed.');
    console.error(`   Details: ${err.message}`);
    process.exit(1);
  }
}

startServer();

export { startServer };
export default app;
