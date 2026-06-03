import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { name, ownerId } = req.body;
  if (!name || !ownerId) return res.status(400).json({ error: 'name and ownerId are required' });
  const workspace = await prisma.workspace.create({ data: { name, ownerId } });
  res.status(201).json(workspace);
});

router.get('/:id', async (req, res) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });
  if (!workspace) return res.status(404).json({ error: 'Not found' });
  res.json(workspace);
});

export default router;
