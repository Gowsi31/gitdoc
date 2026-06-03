import { readdirSync, readFileSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { join, extname, relative } from 'path';

const CHUNK_TOKENS = 500;
// Rough chars-per-token estimate for markdown
const CHARS_PER_TOKEN = 4;
const CHUNK_SIZE = CHUNK_TOKENS * CHARS_PER_TOKEN;

const MD_GLOB_PATTERNS = [
  /^readme\.md$/i,
  /^docs\//i,
  /^specs?\//i,
  /^adr\//i,
  /^changelog(s)?\//i,
  /^\.?docs\//i,
  /^doc\//i,
];

export function findMarkdownFiles(repoPath) {
  const results = [];
  walk(repoPath, repoPath, results);
  return results;
}

function walk(root, dir, results) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const full = join(dir, name);
    const rel = relative(root, full);
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(root, full, results);
      } else if (extname(name).toLowerCase() === '.md' && shouldInclude(rel)) {
        results.push({ fullPath: full, relPath: rel });
      }
    } catch {
      // skip unreadable entries
    }
  }
}

function shouldInclude(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  // Always include root-level README
  if (/^readme\.md$/i.test(norm)) return true;
  // Include anything inside docs-like dirs
  return MD_GLOB_PATTERNS.some(p => p.test(norm));
}

export function parseAndChunk(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  if (!raw.trim()) return null;

  const fileHash = createHash('sha256').update(raw).digest('hex');
  // Strip YAML/TOML frontmatter
  const content = raw.replace(/^---[\s\S]*?---\n?/, '').replace(/^\+\+\+[\s\S]*?\+\+\+\n?/, '');
  const chunks = splitIntoChunks(content);
  return { fileHash, chunks };
}

function splitIntoChunks(text) {
  const chunks = [];
  // Try to split on heading boundaries first
  const sections = text.split(/(?=^#{1,3} )/m);
  let buffer = '';
  for (const section of sections) {
    if ((buffer + section).length > CHUNK_SIZE && buffer.length > 0) {
      chunks.push(buffer.trim());
      buffer = section;
    } else {
      buffer += section;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());

  // If any chunk is still too large, hard-split it
  const result = [];
  for (const chunk of chunks) {
    if (chunk.length <= CHUNK_SIZE) {
      result.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += CHUNK_SIZE) {
        result.push(chunk.slice(i, i + CHUNK_SIZE));
      }
    }
  }
  return result;
}
