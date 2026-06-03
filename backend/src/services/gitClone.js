import simpleGit from 'simple-git';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Clones a repo into /tmp, runs the callback with the local path, then deletes.
 * Nothing is persisted to disk after the callback resolves.
 */
export async function withClonedRepo(gitUrl, token, callback) {
  const tmpDir = mkdtempSync(join(tmpdir(), 'gitdoc-'));
  try {
    const cloneUrl = token ? injectToken(gitUrl, token) : gitUrl;
    await simpleGit().clone(cloneUrl, tmpDir, ['--depth', '1']);
    return await callback(tmpDir);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Pulls the latest changes into an already-cloned dir (used by sync scheduler
 * which re-clones into /tmp each time, so this is a convenience wrapper).
 */
export async function pullRepo(localPath) {
  await simpleGit(localPath).pull();
}

function injectToken(gitUrl, token) {
  // Works for https://github.com/... and https://gitlab.com/...
  return gitUrl.replace('https://', `https://oauth2:${token}@`);
}
