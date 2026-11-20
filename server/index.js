import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => res.status(200).json({ success: true, message: 'Learn Hunt API is healthy' }));
app.use('/api/auth', authRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

async function start() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnhunt';
  await mongoose.connect(mongoUri);
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`Learn Hunt API listening on http://localhost:${port}`));
}

if (process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname) {
  start().catch(error => { console.error('API startup failed:', error.message); process.exit(1); });
}

export default app;
