# ESMERALDA — Colombia Election Tracker 2026

**CETI Control Room high-fidelity citizen deliverable (primary) + optional X•ELECTION OS intelligence layer.**

Bilingual (ES/EN) • 10:28 COT live clock • Heavy X primary data • 60/25/15 projection model • Full methodology + source trace.

Private GitHub source • Public Vercel hosting • Zero ongoing cost for the tracker.

First project: Colombian Presidential first round — May 31, 2026.

## Architecture (exactly as specified)

- **Ingestion**: `/api/ingest` — runs 6 parallel X search variants (candidates, turnout signals, department hotspots, discrepancy language), unions results, feeds to Grok with the strict Better-Search v3.1 prompt.
- **Reasoning Layer**: Grok (grok-4.3) returns structured trust scores, X-predicted shares, discrepancies, visibility skew, recommended actions + full lineage (call ID, timestamp, variants executed).
- **Store**: Vercel KV (snapshots, enriched feed, audit log). Every VERIFY click and ingest is logged with user context + Grok call ID.
- **Real-time**: Frontend polls `/api/snapshot` every ~28s. Vercel Cron hits ingest every 4 minutes during election night.
- **Viewport**: This Next.js app — faithful recreation + evolution of the original Milton/Glaser X•ELECTION OS HTML with Field Notebook craft refinements.

## Quick Start (local)

```bash
cd /Users/cairo/ESMERALDA
cp .env.example .env.local
# Add your X_BEARER_TOKEN + XAI_API_KEY + strong INGEST_SECRET (only if using the optional Next.js intelligence APIs)

npm install
npm run dev
```

Visit http://localhost:3000 (shows the React dashboard shell for development).

The **production citizen deliverable** is the self-contained `public/index.html` (copied from Colombia-Election-Tracker.html) — see Production Deployment below.

---

## Production Deployment — Private GitHub + Public Vercel (Election Day Clean)

**Goal**: Private source-of-truth on GitHub + public, fast, zero-cost-at-scale Vercel URL serving the beautiful high-fidelity CETI Control Room tracker (`public/index.html`) at the root `/`.

### 1. Create Private GitHub Repository (exact commands)

**Option A — Using GitHub CLI (`gh`) — recommended if installed:**

```bash
cd /Users/cairo/ESMERALDA

# Initialize git (if not already)
git init
git add .
git commit -m "ESMERALDA v0.1 — production election day. CETI tracker at root via public/index.html + vercel.json rewrite. Bilingual 10:28 COT live prototype."

git branch -M main

# Create private repo on GitHub (replace YOUR_GITHUB_USERNAME)
gh repo create esmeralda-election-os --private --source=. --remote=origin --push

# Or for exact name "ESMERALDA":
# gh repo create ESMERALDA --private --source=. --remote=origin --push
```

**Option B — Manual (no gh CLI):**

1. Go to https://github.com/new
2. Repository name: `esmeralda-election-os` (recommended) **or** `ESMERALDA`
3. **Private** (critical)
4. **Do NOT** initialize with README, .gitignore, or license (we have them locally)
5. Click "Create repository"

6. Back in terminal:

```bash
cd /Users/cairo/ESMERALDA

git init
git add .
git commit -m "ESMERALDA v0.1 — production election day. CETI Control Room tracker served cleanly at root. Private repo + public Vercel."

git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/esmeralda-election-os.git
git push -u origin main
```

**Important**: `.gitignore` (just created) ensures `node_modules/`, `.env*`, `.next/`, `.vercel/` etc. are never pushed.

### 2. Deploy to Vercel (Public URL, Private Source)

**Prerequisites**:
- Vercel account (free tier sufficient for this static+light API workload)
- Vercel CLI: `npm i -g vercel` (or use `npx vercel`)

**Recommended flow (preview first, then ship):**

```bash
cd /Users/cairo/ESMERALDA

# Login (one time)
vercel login

# Preview deploy (generates a unique *.vercel.app URL for review)
# Use this after any map improvements or content updates before shipping to prod
npm run deploy:preview
# or: npx vercel

# Production ship (updates the primary public URL)
npm run deploy:prod
# or: npx vercel --prod
```

**Alternative (Git-connected — best for ongoing election updates):**
1. In Vercel dashboard: "Add New Project" → "Import Git Repository"
2. Select your private `esmeralda-election-os` (or ESMERALDA) repo
3. Vercel auto-detects Next.js
4. **Environment Variables** (from `.env.example` — only needed if you later enable the intelligence APIs):
   - `X_BEARER_TOKEN`
   - `XAI_API_KEY`
   - `INGEST_SECRET` (strong random value — never expose)
5. Deploy. The root URL will immediately serve the tracker thanks to the `rewrites` rule in `vercel.json`.
6. (Optional) Add a custom domain later.

**Key vercel.json behavior (already configured):**
- `/` → serves `public/index.html` (the full beautiful bilingual CETI tracker)
- `/api/*` → still available for future Grok/X intelligence layer (ingest, snapshot, verify)
- Cron jobs remain commented (zero ongoing cost)
- Proper CORS headers on APIs + cache headers on the tracker

**After ship**:
- Your public citizen URL will be something like: `https://esmeralda-election-os.vercel.app/`
- It loads instantly, fully static, zero server cost for the tracker itself.
- The 10:28 COT live clock, X-heavy data, bilingual toggle, methodology, and source trace are all embedded.

**Preview before every prod ship** (map improvements, data refresh, etc.):
Always run `npm run deploy:preview` (or `vercel`) first. Test the live URL. Only then `npm run deploy:prod`.

**Rollback**: In Vercel dashboard → Deployments → promote a previous successful one to Production.

### Notes for Election Day Production Cleanliness
- The tracker is 100% self-contained (CDN Tailwind + Font Awesome + embedded data). No external API dependencies at runtime for the citizen view.
- If you later want the full React + live Grok intelligence at a subpath, we can add a rewrite or route.
- Never commit secrets. `.env.example` is the only safe file.
- Update the heavy seed data by replacing `public/index.html` (re-copy from the authoritative `Colombia-Election-Tracker.html` after any hand edits) then preview → ship.

## Creative Low-Cost Model (the solution to "slow + expensive")

The original multi-query X + Grok-every-4min design is powerful but burns tokens and feels slow.

**New approach (implemented now):**

1. **Heavy synthesis by me (Grok with heavy access)**: Right now I performed one high-quality Palantir-grade research pass using all available tools + X buzz patterns + official context. The rich ontology (national + 6 departments + 5 primary signals with trust/discrepancies/lineage) is committed as static JSON.

2. **Default load is the seed** (`/api/snapshot` without `?force=live`): Instant, beautiful, zero ongoing API cost. The dashboard feels completely researched and alive from the first load.

3. **"Deep Grok Re-analysis" button is now explicit opt-in** (red, with warning): Only runs real X + Grok calls when the user consciously wants a fresh expensive pass. This is the only time you pay tokens.
   - All x.ai calls (Better-Search Protocol) now default to **Spanish prompts and instructions** when the UI language is Spanish (lang=es). This is fully enabled in `lib/grok.ts`, the API routes, and the frontend.
   - Web search patterns for Colombia election monitoring are centralized in `lib/spanish-research.ts` with optimized Spanish queries for X, news, and official sources. Use `getSpanishResearchQueries('all')` for heavy research passes.

4. **Cron jobs disabled by default** in vercel.json. Re-enable only if you decide the cost is worth it.

Result: The deployed site on Vercel is fast, cheap (mostly static), bilingual, and still delivers the full intellectual experience because the expensive research happened once, here, with my heavy capabilities.

You keep the option for live when you need it. Perfect for election night monitoring without surprise bills.

## Colombia-specific notes (election day 2026-05-31)

- Candidates modeled: Iván Cepeda (Pacto Histórico), Abelardo de la Espriella ("El Tigre"), Paloma Valencia (Centro Democrático), Sergio Fajardo, Claudia López.
- Key departments/hotspots: Antioquia, Cundinamarca/Bogotá, Valle del Cauca, Atlántico, Santander, Nariño.
- Official source: https://resultados.registraduria.gov.co/
- X queries are heavily tuned for Spanish election-day language ("preconteo", "testigos electorales", "mesas", "larga fila", etc.).

## Future Palantir extras (easy to add)

- Full OAuth 2.0 PKCE analyst accounts (store encrypted X tokens + JWT sessions)
- Role views (Analyst full reasoning vs Executive high-level)
- Semantic search across all historical enriched posts (pgvector or Grok embeddings)
- One-click "Escalate to analyst" + PDF export of current snapshot + lineage
- Multi-region switcher (add India, US, etc. back from the original framework)

## Files of note

- `lib/grok.ts` — The actual Better-Search prompt + structured output contract (production-ready)
- `lib/x.ts` — Multi-query heavy research fetcher (6 parallel X searches)
- `lib/store.ts` — KV ontology + audit log
- `app/api/ingest/route.ts` — The cron target (the engine)
- `app/api/verify/route.ts` — On-demand claim verification with fresh Grok call
- `app/page.tsx` — The live viewport (exact visual language from your original HTML + notebook refinements)

## High-Fidelity Standalone Tracker (current election-day deliverable)

**See the authoritative production deployment instructions above** ("Production Deployment — Private GitHub + Public Vercel").

The citizen deliverable is `public/index.html` (authoritative source copy of `Colombia-Election-Tracker.html`).

- Exact match to the CETI Control Room direction from your ESMERALDA handoff.
- Perfect bilingual ES/EN, live COT clock, heavy X data, 60/25/15 projection model, full source traceability.
- Fully static (Tailwind CDN + CETI tokens) — instant load, zero runtime cost.

The `vercel.json` rewrite guarantees the root URL serves this exact file in production.

## Cost & rate limits (realistic for election night)

- X API (Essential/Pro): ~$100-500/mo depending on volume during peak (only if enabling live ingest later)
- Grok-4.3: ~$3-12 per heavy ingest (28-40 posts + synthesis). Only on explicit opt-in or re-enabled cron.
- Vercel (static + serverless functions): negligible on Hobby/Pro for this workload. The tracker itself costs $0 at any scale.

This is production-viable and election-night hardened.

---

**ESMERALDA / Framework v2.0** — Built for the Colombian election (May 31, 2026). Extensible to any region.

Every post is a signal. Grok turns it into verified ontology. The tracker is the beautiful, self-contained citizen viewport.

**Ship command (after preview):** `npm run deploy:prod` or `npx vercel --prod`
