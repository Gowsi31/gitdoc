import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { indexRepo } from './indexer.js';

const prisma = new PrismaClient();

export function startSyncScheduler() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[sync] Starting scheduled sync for all repos');
    const repos = await prisma.repo.findMany();
    for (const repo of repos) {
      console.log(`[sync] Syncing repo ${repo.id}: ${repo.gitUrl}`);
      await indexRepo(repo);
    }
    console.log('[sync] Scheduled sync complete');
  });

  console.log('[sync] Scheduler started — repos sync every 30 minutes');
}
