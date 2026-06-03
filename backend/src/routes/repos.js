import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { encryptToken } from '../services/crypto.js';
import { indexRepo } from '../services/indexer.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/repos — connect a new git repo to a project
router.post('/', async (req, res) => {
  const { projectId, gitUrl, isPrivate, accessToken } = req.body;

  if (!projectId || !gitUrl) {
    return res.status(400).json({ error: 'projectId and gitUrl are required' });
  }

  // Basic URL validation — must start with http/https or git@
  if (!/^(https?:\/\/|git@)/.test(gitUrl)) {
    return res.status(400).json({ error: 'Invalid git URL' });
  }

  let encryptedToken = null;
  if (isPrivate && accessToken) {
    encryptedToken = encryptToken(accessToken);
  }

  const repo = await prisma.repo.create({
    data: {
      projectId,
      gitUrl,
      isPrivate: Boolean(isPrivate),
      encryptedToken,
    },
  });

  // Kick off initial indexing in the background
  indexRepo(repo).catch(err => console.error('Initial index error:', err));

  res.status(201).json({
    id: repo.id,
    gitUrl: repo.gitUrl,
    isPrivate: repo.isPrivate,
    docCount: repo.docCount,
    lastSyncedAt: repo.lastSyncedAt,
    message: 'Repo connected — indexing in progress',
  });
});

// GET /api/repos/:id — repo status
router.get('/:id', async (req, res) => {
  const repo = await prisma.repo.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      gitUrl: true,
      isPrivate: true,
      docCount: true,
      lastSyncedAt: true,
      syncError: true,
    },
  });
  if (!repo) return res.status(404).json({ error: 'Not found' });
  res.json(repo);
});

// POST /api/repos/:id/sync — manual re-sync trigger
router.post('/:id/sync', async (req, res) => {
  const repo = await prisma.repo.findUnique({ where: { id: req.params.id } });
  if (!repo) return res.status(404).json({ error: 'Not found' });

  res.json({ message: 'Sync started' });
  indexRepo(repo).catch(err => console.error('Manual sync error:', err));
});

// GET /api/repos — list repos for a project
router.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });

  const repos = await prisma.repo.findMany({
    where: { projectId },
    select: {
      id: true,
      gitUrl: true,
      isPrivate: true,
      docCount: true,
      lastSyncedAt: true,
      syncError: true,
    },
  });
  res.json(repos);
});

export default router;
