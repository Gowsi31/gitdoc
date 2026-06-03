import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import reposRouter from './routes/repos.js';
import askRouter from './routes/ask.js';
import projectsRouter from './routes/projects.js';
import workspacesRouter from './routes/workspaces.js';
import { startSyncScheduler } from './services/syncScheduler.js';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/repos', reposRouter);
app.use('/api/ask', askRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/workspaces', workspacesRouter);

app.listen(PORT, () => {
  console.log(`GitDoc backend running on port ${PORT}`);
  startSyncScheduler();
});
