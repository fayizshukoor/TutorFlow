import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// MongoDB connection will be established before server listens

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin === CLIENT_URL
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health Check Endpoint (Milestone 1 requirement preserved)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Root welcome message
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'TutorFlow API',
    version: '1.0.0',
    status: 'running',
    healthCheck: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      test: 'GET /api/auth/test'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} does not exist.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

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
