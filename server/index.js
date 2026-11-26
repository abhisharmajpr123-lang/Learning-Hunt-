import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import subjectRoutes from './routes/subjects.js';
import { courseRouter, subjectCourseRouter } from './routes/courses.js';
import { courseEnrollmentRouter, enrollmentRouter } from './routes/enrollments.js';
import { getJwtSecret } from './utils/token.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  return res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected
      ? 'Learn Hunt API is healthy'
      : 'Learn Hunt API is running but the database is unavailable',
    database: databaseConnected ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime())
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/subjects/:subjectId/courses', subjectCourseRouter);
app.use('/api/subjects', subjectRoutes);
app.use('/api/courses', courseEnrollmentRouter);
app.use('/api/courses', courseRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` })
);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

async function start() {
  getJwtSecret();
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnhunt';
  await mongoose.connect(mongoUri);
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`Learn Hunt API listening on http://localhost:${port}`));
}

if (process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname) {
  start().catch(error => { console.error('API startup failed:', error.message); process.exit(1); });
}

export default app;
