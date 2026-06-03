import { PrismaClient } from '@prisma/client';
import { findMarkdownFiles, parseAndChunk } from './docParser.js';
import { embedTexts } from './embedder.js';
import { withClonedRepo } from './gitClone.js';
import { decryptToken } from './crypto.js';

const prisma = new PrismaClient();

/**
 * Full index: clone repo, parse all .md files, embed, store chunks.
 * Called when a repo is first connected, and on each sync.
 */
export async function indexRepo(repo) {
  const token = repo.encryptedToken ? decryptToken(repo.encryptedToken) : null;

  let docCount = 0;
  let syncError = null;

  try {
    await withClonedRepo(repo.gitUrl, token, async (repoPath) => {
      const files = findMarkdownFiles(repoPath);
      if (files.length === 0) return;

      // Get existing file hashes to skip unchanged files
      const existing = await prisma.docChunk.findMany({
        where: { repoId: repo.id },
        select: { filePath: true, fileHash: true },
        distinct: ['filePath'],
      });
      const hashMap = new Map(existing.map(e => [e.filePath, e.fileHash]));

      for (const { fullPath, relPath } of files) {
        const parsed = parseAndChunk(fullPath);
        if (!parsed) continue;
        const { fileHash, chunks } = parsed;

        // Skip unchanged files
        if (hashMap.get(relPath) === fileHash) {
          docCount++;
          continue;
        }

        // Delete old chunks for this file
        await prisma.docChunk.deleteMany({ where: { repoId: repo.id, filePath: relPath } });

        if (chunks.length === 0) continue;

        // Embed in batches of 100
        const BATCH = 100;
        for (let i = 0; i < chunks.length; i += BATCH) {
          const batch = chunks.slice(i, i + BATCH);
          const embeddings = await embedTexts(batch);

          // Insert via raw SQL to use pgvector
          for (let j = 0; j < batch.length; j++) {
            const vectorStr = `[${embeddings[j].join(',')}]`;
            await prisma.$executeRawUnsafe(
              `INSERT INTO doc_chunks (id, repo_id, file_path, chunk_index, content, file_hash, embedding, created_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::vector, now())`,
              repo.id,
              relPath,
              i + j,
              batch[j],
              fileHash,
              vectorStr
            );
          }
        }
        docCount++;
      }
    });
  } catch (err) {
    syncError = err.message;
    console.error(`Sync failed for repo ${repo.id}:`, err.message);
  }

  await prisma.repo.update({
    where: { id: repo.id },
    data: {
      lastSyncedAt: new Date(),
      docCount,
      syncError,
    },
  });

  return { docCount, syncError };
}
