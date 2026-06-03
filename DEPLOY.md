# GitDoc Deployment Guide

## Services needed (all free)

| Service | Purpose | Sign up |
|---|---|---|
| Supabase | Database + pgvector | supabase.com |
| OpenAI | Embeddings + Q&A (GPT-4o-mini) | platform.openai.com |
| Vercel | Frontend hosting | vercel.com |
| Render | Backend hosting | render.com |
| UptimeRobot | Keep-alive pings | uptimerobot.com |

---

## Step 1 — Supabase

1. Go to **supabase.com** → New project
2. Save your database password
3. Go to **Project Settings → Database** and copy:
   - **Connection string (Transaction mode)** → `DATABASE_URL`
   - **Connection string (Session mode)** → `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` in both with your actual password
4. Go to **SQL Editor** and run the contents of `supabase-setup.sql`
5. Go to **Project Settings → API** and copy the **service_role** key (for backend migrations)

## Step 2 — OpenAI API key

1. Go to **platform.openai.com/api-keys**
2. Create a new key → copy it as `OPENAI_API_KEY`

## Step 4 — Run Prisma migration (one-time)

Once Supabase is set up, create `backend/.env` from `backend/.env.example` and fill in all values, then run:

```bash
cd backend
npm run db:migrate
```

Then run the `supabase-setup.sql` in Supabase SQL Editor.

## Step 5 — Deploy frontend to Vercel

```bash
cd frontend
vercel --prod
```

Set this environment variable in Vercel dashboard:
- `VITE_API_URL` = your Render backend URL (e.g. `https://gitdoc-backend.onrender.com/api`)

## Step 6 — Deploy backend to Render

1. Go to **render.com** → New Web Service → connect your GitHub repo
2. Set **Root Directory** to `backend`
3. Set **Build Command**: `npm install && npx prisma generate`
4. Set **Start Command**: `node src/index.js`
5. Add all environment variables from the list below

## Environment variables for Render backend

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase transaction connection string |
| `DIRECT_URL` | Supabase session connection string |
| `TOKEN_ENCRYPTION_KEY` | `c7e2781f78a92ca3b3e8f059bb50c9516fe6ce427d9008aa096405664e62a3af` |
| `OPENAI_API_KEY` | Your OpenAI key |
| `FRONTEND_URL` | Your Vercel frontend URL |
| `NODE_ENV` | `production` |

## Step 7 — UptimeRobot (prevent Render sleep)

1. Go to **uptimerobot.com** → Add New Monitor
2. Monitor type: **HTTP(s)**
3. URL: `https://your-render-url.onrender.com/health`
4. Monitoring interval: **10 minutes**

---

## Your encryption key (already generated)

```
TOKEN_ENCRYPTION_KEY=c7e2781f78a92ca3b3e8f059bb50c9516fe6ce427d9008aa096405664e62a3af
```

Keep this secret. It encrypts private repo access tokens in the database.
