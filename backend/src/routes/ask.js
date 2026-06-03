import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { embedQuery } from '../services/embedder.js';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ask
router.post('/', async (req, res) => {
  const { projectId, userId, question } = req.body;

  if (!projectId || !question) {
    return res.status(400).json({ error: 'projectId and question are required' });
  }

  // 1. Embed the question
  const queryEmbedding = await embedQuery(question);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // 2. Vector similarity search — top 5 chunks across all repos in this project
  const chunks = await prisma.$queryRawUnsafe(
    `SELECT dc.id, dc.file_path, dc.content, dc.repo_id,
            1 - (dc.embedding <=> $1::vector) AS similarity
     FROM doc_chunks dc
     JOIN repos r ON r.id = dc.repo_id
     WHERE r.project_id = $2
     ORDER BY dc.embedding <=> $1::vector
     LIMIT 5`,
    vectorStr,
    projectId
  );

  // 3. Keyword fallback if vector search found nothing useful
  let context = chunks;
  if (chunks.length === 0 || chunks[0].similarity < 0.3) {
    const fallback = await prisma.$queryRawUnsafe(
      `SELECT dc.id, dc.file_path, dc.content, dc.repo_id, 0.5 AS similarity
       FROM doc_chunks dc
       JOIN repos r ON r.id = dc.repo_id
       WHERE r.project_id = $1
         AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', $2)
       LIMIT 5`,
      projectId,
      question
    );
    if (fallback.length > 0) context = fallback;
  }

  if (context.length === 0) {
    return res.json({
      answer: "I couldn't find relevant documentation to answer that question. Make sure the repos are indexed and your docs cover this topic.",
      sources: [],
    });
  }

  // 4. Build RAG prompt
  const docContext = context
    .map((c, i) => `[${i + 1}] ${c.file_path}\n${c.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are a helpful documentation assistant. Answer questions using ONLY the provided documentation excerpts.
Be concise and specific. Always cite which file your answer comes from using [1], [2], etc. notation.
If the documentation doesn't contain enough information to fully answer, say so clearly.`;

  // 5. Stream response via OpenAI
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullAnswer = '';

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Documentation excerpts:\n\n${docContext}\n\n---\n\nQuestion: ${question}` },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) {
      fullAnswer += text;
      res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
    }
  }

  const sources = context.map(c => ({ filePath: c.file_path, repoId: c.repo_id }));

  // 6. Persist Q&A
  if (userId) {
    await prisma.qaHistory.create({
      data: { projectId, userId, question, answer: fullAnswer, sources },
    });
  }

  res.write(`data: ${JSON.stringify({ type: 'done', sources })}\n\n`);
  res.end();
});

// GET /api/ask/history?projectId=...
router.get('/history', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });

  const history = await prisma.qaHistory.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      userId: true,
      question: true,
      answer: true,
      sources: true,
      createdAt: true,
    },
  });
  res.json(history);
});

export default router;
