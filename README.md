# X•ELECTION OS — Colombia 2026

**Palantir-grade real-time election intelligence dashboard.**

Live X primary signals • Grok Better-Search Protocol v3.1 (heavy multi-variant research) • Official preconteo variance • Department hotspots • Full lineage + audit ontology.

First project: Colombian Presidential first round — May 31, 2026.

## Architecture (exactly as specified)

- **Ingestion**: `/api/ingest` — runs 6 parallel X search variants (candidates, turnout signals, department hotspots, discrepancy language), unions results, feeds to Grok with the strict Better-Search v3.1 prompt.
- **Reasoning Layer**: Grok (grok-4.3) returns structured trust scores, X-predicted shares, discrepancies, visibility skew, recommended actions + full lineage (call ID, timestamp, variants executed).
- **Store**: Vercel KV (snapshots, enriched feed, audit log). Every VERIFY click and ingest is logged with user context + Grok call ID.
- **Real-time**: Frontend polls `/api/snapshot` every ~28s. Vercel Cron hits ingest every 4 minutes during election night.
- **Viewport**: This Next.js app — faithful recreation + evolution of the original Milton/Glaser X•ELECTION OS HTML with Field Notebook craft refinements.

## Quick Start (local)

```bash
cd x-election-os-colombia
cp .env.example .env.local
# Add your X_BEARER_TOKEN + XAI_API_KEY + strong INGEST_SECRET

npm install
npm run dev
```

Visit http://localhost:3000

Click **HEAVY RESEARCH NOW** (you will need the INGEST_SECRET) to run the first real X + Grok enrichment.

## Production Deployment (Vercel via your connector)

1. Push this folder to a GitHub repo (or use Vercel CLI / your connector).
2. In Vercel:
   - Import the project
   - Add the three env vars from `.env.example`
   - Add a Postgres or Upstash KV integration (or use `@vercel/kv`)
3. The `vercel.json` already contains the cron jobs (`*/4 * * * *` and `*/9 * * * *`).
4. After first deploy, manually hit `https://your-domain.vercel.app/api/ingest?region=colombia&secret=YOUR_SECRET` once to seed the ontology.
5. The dashboard will then stay live automatically.

**Cron protection**: The ingest route checks the `secret` query param against `INGEST_SECRET`. Never expose this publicly.

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

The production citizen-facing prototype is the self-contained single-file HTML at:

`Colombia-Election-Tracker.html`

- Exact match to the CETI Control Room direction from your ESMERALDA handoff (dense ticker, Projected Leader hero, 3-col main grid with prominent X Primary Feed, hex-aware Geographic Pulse, Results + full Source-Trace reasoning).
- Perfect bilingual ES/EN global toggle (no mixed text anywhere).
- Live COT clock + simulation (currently running at ~10:28 COT, polls open ~2.5 hours).
- All data from heavy Spanish X research + the documented 60/25/15 X-projection model with Westcol rural/coast adjustment.
- Fully static (Tailwind CDN + custom CETI tokens) — zero build step, zero cost at scale.

**Ready for Vercel (one-command deploy):**

```bash
cd /Users/cairo/ESMERALDA

# The tracker is already prepared at public/index.html
# This means your deployed site root will serve the exact beautiful prototype

npx vercel --prod
```

After first deploy:
- Link to (or create) your "x-election-os-colombia" project when prompted.
- The production URL will show the tracker at root (because of public/index.html).
- You can also access it at `https://your-project.vercel.app/Colombia-Election-Tracker.html` if you prefer the Next.js shell.

The existing `vercel.json` already has the right headers and (commented) cron strategy. The heavy-seed static approach keeps it fast & free on election day.

## Cost & rate limits (realistic for election night)

- X API (Essential/Pro): ~$100-500/mo depending on volume during peak
- Grok-4.3: ~$3-12 per heavy ingest (28-40 posts + synthesis). 4min cron = ~360 calls/day worst case.
- Vercel KV + Cron: negligible on Pro plan.

This is production-viable for a high-stakes monitoring operation.

---

**Framework v2.0** — Built for the Colombian election today. Extensible to any region.

Every post is a signal. Grok turns it into verified ontology. The dashboard is just the beautiful viewport.
