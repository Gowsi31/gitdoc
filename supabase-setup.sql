-- Run this in your Supabase SQL Editor AFTER running prisma migrate

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add the embedding column to doc_chunks
ALTER TABLE doc_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create an IVFFlat index for fast similarity search
--    (run AFTER you have at least a few thousand rows — skip for now)
-- CREATE INDEX ON doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Row Level Security policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_history ENABLE ROW LEVEL SECURITY;

-- Workspace members can see their own workspace
CREATE POLICY "members see own workspace"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()::text
    )
  );

-- Service role bypasses RLS (backend uses service role key)
-- Prisma connects with service role, so it always has full access.
