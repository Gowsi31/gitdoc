import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/projects
router.post('/', async (req, res) => {
  const { workspaceId, name, description } = req.body;
  if (!workspaceId || !name) {
    return res.status(400).json({ error: 'workspaceId and name are required' });
  }
  const project = await prisma.project.create({
    data: { workspaceId, name, description },
  });
  res.status(201).json(project);
});

// GET /api/projects?workspaceId=...
router.get('/', async (req, res) => {
  const { workspaceId } = req.query;
  if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: {
      repos: {
        select: { id: true, gitUrl: true, docCount: true, lastSyncedAt: true, syncError: true },
      },
    },
  });
  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      repos: {
        select: { id: true, gitUrl: true, docCount: true, lastSyncedAt: true, syncError: true },
      },
    },
  });
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json(project);
});

export default router;
