# ESMERALDA (X•ELECTION OS — Colombia 2026): Architecture Overview

**A Palantir-grade real-time election intelligence dashboard built for the Colombian Presidential first round (May 31, 2026), executed in the style of Milton Glaser craft and extreme cost discipline.**

This document provides a dense, training-ready analysis of the system's philosophy, architecture, bilingual mechanics, and the decisive low-cost innovation that makes high-signal election monitoring viable on Vercel-scale budgets.

---

## High-Level Philosophy

ESMERALDA fuses three traditions into one coherent artifact:

1. **Palantir ontology & reasoning discipline**: Every output is structured data with explicit lineage (grok_call_id, timestamp, queries_executed, posts_analyzed), trust scores, discrepancy flags, visibility skew quantification, and an immutable audit log. The system does not "show tweets"; it maintains a living, queryable election ontology.

2. **Milton Glaser visual craft**: The interface is not a generic dashboard. It uses a warm paper substrate (#FAF7F2), deep ink typography, subtle inset shadows, hand-authored SVG maps (not Mapbox), custom micro-animations (pulse-dots, election bars with spring easing), and a precise color system (election red #C41E3A for urgency, trust blue #0A66C2, verified green #166534). "Glaser-card" and "milton-paper" classes encode physical paper + print craft translated to digital. The Colombia map is stylized, not literal—designed for instant geopolitical legibility.

3. **Ruthless cost optimization via one-time heavy synthesis**: The dominant expense in LLM + social API systems is repeated live calls. ESMERALDA inverts the model.

The result is a system that *feels* continuously researched from the first paint while remaining mostly static and free at the margin.

---

## The Creative Low-Cost Model (Heavy Seed by Grok Agent vs. Live Expensive Calls)

### Core Problem
Naive design: Vercel Cron every 4 minutes → 6 parallel X searches → Grok-4.3 Better-Search → KV write. At election-night volume this is ~$3–12 per heavy ingest × 360 calls/day worst case, plus X rate limits and unpredictable latency. The UX also feels "slow" because every interaction waits on APIs.

### The Solution Implemented
**Heavy synthesis performed once, by a privileged Grok agent (this session), then served as high-fidelity static seed.**

From the README and data files:

- A single high-quality Palantir-grade research pass was executed using full tool access, X buzz patterns, official Registraduría context, and Colombian media.
- The resulting ontology (national metrics + 6 departments + 5+ primary signals with trust/discrepancies/lineage) is committed as `data/colombia-heavy-seed-2026-05-31-es-updated.json`.
- The seed explicitly records its own provenance: "Heavy Grok Spanish research pass + web sources... 6 variantes internas del Protocolo Better-Search ejecutadas en español."

**Runtime behavior** (see `app/api/snapshot/route.ts`):

```ts
if (!forceLive) {
  const seed = heavySeed as any;
  return NextResponse.json({
    ...seed.national,
    source: 'heavy-grok-spanish-synthesis',
    synthesized_at: seed.meta.timestamp,
    is_heavy_seed: true,
    spanish_enabled: true,
    enriched_posts: seed.primary_signals.map(s => ({
      ...,
      text: s.text_es,   // Spanish-first for Colombia
    })),
  });
}
```

- Default load (`/api/snapshot?region=colombia`): **instant, beautiful, zero ongoing API cost**.
- Only explicit opt-in (`?force=live` or the red "DEEP GROK RE-ANALYSIS" button, which prompts for `INGEST_SECRET`) triggers real X + xAI calls.
- Vercel crons are **commented out by default** in `vercel.json` with explicit cost warnings.

**Why this matters**: The expensive intelligence work happened *once*, under maximum capability (full context, no rate-limit pressure, Spanish-optimized queries). Every subsequent viewer receives a richer, more coherent picture than most live polling systems can deliver cheaply. Freshness remains available on demand for analysts who consciously accept the cost.

This is the decisive architectural move that makes the entire project production-viable.

---

## Overall System Architecture

Four clean layers:

### 1. Frontend Viewport (`app/page.tsx`)
- Pure client React 19 + framer-motion + lucide-react.
- Single source of truth: `snapshot` state + `lang` ('es' | 'en', default 'es').
- Polling loop: every 28s (when visible + live mode) hits `/api/snapshot`.
- Interactive hand-crafted SVG Colombia map with clickable department hotspots (Antioquia, Cundinamarca/Bogotá, etc.).
- Bilingual `STRINGS` object + live toggle that propagates `lang` to every API call.
- Core UI primitives: Live X-Metrics card, Geopolitical Pulse Map + Reasoning Engine, X Primary Feed (with per-post VERIFY), Live Results Checker table (X-Predicted vs Official Preconteo + variance + trust).
- Verify modal: the "soul of the system" — triggers `/api/verify` and displays structured Grok output with lineage.
- Heavy Research button explicitly warns: expensive, Spanish-aware when `lang=es`.

The viewport is deliberately monolithic (no components/ directory in use) for prototype velocity and perfect visual control.

### 2. Intelligence / Reasoning Layer (`lib/grok.ts`)
The heart. "Better-Search Protocol v3.1".

```ts
export const BetterSearchResultSchema = z.object({
  trust_score: z.number().min(0).max(100),
  verified_claims: z.array(z.object({ claim, support, sources, discrepancy_flag, notes? })),
  discrepancies: z.array(z.string()),
  x_sentiment_delta: z.string(),
  x_predicted_shares: z.record(z.string(), z.number()),
  recommended_action: z.string(),
  visibility_skew: { x_primary, traditional, skew_note },
  lineage: { grok_call_id, timestamp, queries_executed },
});
```

- Two parallel prompt families: `BETTER_SEARCH_PROMPT_EN` and `BETTER_SEARCH_PROMPT_ES`.
- ES version instructs the model in Spanish to execute the 6 variants mentally, quantify X vs traditional media skew, cross-reference specific Colombian candidates and departments, and output Spanish sentiment deltas.
- `getBetterSearchPrompt(lang, ...)` + `getSystemMessage(lang)` select at call time.
- Real call uses `grok-4.3` + `response_format: { type: 'json_object' }` + temperature 0.2.
- Sophisticated fallback mock that still produces Colombia-2026-plausible numbers and bilingual-feeling structure.

The protocol forces the model to behave like a skeptical senior analyst rather than a summarizer.

### 3. Ingestion Layer (`app/api/ingest/route.ts` + `lib/x.ts` + `lib/spanish-research.ts`)
- Protected by shared `INGEST_SECRET`.
- `fetchColombiaElectionSignals(limit, lang)`:
  - When `lang === 'es'`: calls `getSpanishResearchQueries('all')` → 6+ highly tuned queries using "preconteo", "testigos electorales", "larga fila", "mesas", department-specific Spanish terms, `lang:es`, `min_faves` filters.
  - Deduplicates by tweet ID.
  - `inferRegionFromText` for lightweight geo.
- Passes posts + lang to `runBetterSearch`.
- Builds full ontology snapshot (metrics, hotspots with variance, enriched_posts, discrepancies, lineage) and persists via store.
- `maxDuration = 60` to accommodate heavy X + Grok roundtrip.

`spanish-research.ts` centralizes the signal patterns so both X ingestion and future web augmentation stay coherent.

### 4. Storage & Audit Layer (`lib/store.ts` + `@vercel/kv`)
- `saveSnapshot` (6h TTL) + short history ring buffer (last 48 entries).
- `saveEnrichedFeed` (3h TTL).
- `logAudit` for every VERIFY, INGEST, etc. (last 200 entries kept). Records `grok_call_id`, user context where available, full payload.
- Snapshots are the ontology; audit is the immutable provenance chain.

This is classic Palantir-style: the dashboard is merely a beautiful viewport over a queryable, auditable knowledge graph.

---

## Bilingual (Spanish-First) System at the Architecture Level

Bilingualism is not a UI skin—it is wired through every layer:

- **Default language**: `'es'` in `page.tsx` state and metadata.
- **Propagation**: `lang` state is threaded to:
  - `loadSnapshot` (no direct effect, but consistent)
  - `triggerIngest` → `?lang=${lang}` on ingest
  - `verifyClaim` → body `lang` to `/api/verify`
- **X ingestion** (`lib/x.ts`): selects `getSpanishResearchQueries('all')` or English fallbacks. Queries are written for Colombian election-day Spanish.
- **Grok reasoning** (`lib/grok.ts`): 
  - Prompt selector returns full Spanish protocol instructions when `lang === 'es'`.
  - System message: "Eres un analista de inteligencia electoral preciso y escéptico."
  - Output fields (e.g. `x_sentiment_delta`) are requested in Spanish.
- **Data seed**: Primary signals carry both `text_es` and `text_en`. Snapshot route serves `text_es` by default for Colombian authenticity.
- **UI strings**: Complete `STRINGS.es` / `STRINGS.en` with election-specific phrasing ("Fuentes primarias en X • Protocolo Better-Search Grok v3.1 • Sin sesgo").

**Why Spanish-first matters architecturally**:
- Real X primary signals on election day are overwhelmingly in Spanish. `lang:es` + native Spanish queries capture higher signal density and cultural nuance ("chimbo", "testigo electoral", regional slang) that English queries miss.
- Grok performs better reasoning when the prompt and expected output language match the source material.
- The heavy seed itself was produced in Spanish ("Síntesis en español usando patrones de investigación optimizados para Colombia"), making the default experience higher fidelity than any English-centric system.

Toggle exists for international observers without breaking the primary ontology.

---

## Key Design Decisions and Tradeoffs

**1. Static heavy seed as default path vs. always-live**
- Tradeoff: Slight staleness (seed timestamped ~19:05 COT) vs. instant load + near-zero cost + consistent high-quality narrative.
- Why this matters: Most viewers (and especially non-technical stakeholders) get a better product. Analysts who need freshness pay the cost explicitly.
- Mitigation: Clear "HEAVY GROK SYNTHESIS (ES) • fast, zero ongoing cost" badge + one-click live refresh.

**2. Client-side 28s polling of snapshot API vs. WebSockets / Server-Sent Events**
- Tradeoff: Simpler Vercel deployment, no persistent connections, works on free/pro plans vs. slightly higher latency and battery cost.
- Why this works: Because the expensive work is front-loaded into the seed, the polling is mostly serving cheap JSON. The "live" feeling comes from the seed's richness + subtle animations, not from constant new data.

**3. Monolithic `page.tsx` + hand-crafted SVG + CSS craft classes vs. component library + maps**
- Tradeoff: Maximum visual and interaction control, zero bundle bloat vs. harder long-term maintenance.
- Decision justified for a high-craft election-night artifact meant to be *looked at* intensely.

**4. Shared secret protection on ingest + explicit opt-in for live calls**
- Tradeoff: Minor UX friction (prompt) vs. hard protection against cost explosions and abuse.
- Critical for any system where a single misconfigured cron or public endpoint can generate real bills.

**5. Structured output contract (zod) + lineage in every response vs. free-form text**
- Tradeoff: Slightly more brittle prompt engineering vs. machine-readable, auditable, composable intelligence.
- This is the Palantir move: the dashboard is a viewport; the real asset is the ontology that can later feed analysts, PDFs, escalation workflows.

**6. Sophisticated mock fallback in `runBetterSearch`**
- Tradeoff: Development velocity + resilience when keys missing or rate-limited vs. risk of stale mock data in production.
- In practice, the seed already provides the high-fidelity baseline, so mocks are mostly for local dev.

---

## Why This Approach Is Superior to Naive Polling + API Calls

A naive system would:

- Hit X search every 60–120s from the browser or a cron.
- Send every batch (or worse, every post) to Grok.
- Render whatever the latest call returns.
- Result: high token burn, rate-limit thrashing, jittery UX, no memory/audit, English-centric signal loss on Spanish events, and surprising bills on election night.

ESMERALDA's model wins on every axis that matters for high-stakes monitoring:

- **Cost**: One heavy synthesis (or zero after deploy) vs. hundreds. The seed *is* the research.
- **Signal quality**: Spanish-optimized multi-variant queries + Grok instructed to run 6 internal simulations + explicit discrepancy and skew quantification. Naive systems mostly do "summarize these tweets."
- **UX consistency**: Always-on beautiful, coherent ontology from first load. The variance table (X-predicted vs. official preconteo) surfaces *the actual intelligence question* immediately.
- **Trust & auditability**: Every number has a `grok_call_id` and audit entry. VERIFY clicks are first-class logged actions.
- **Resilience**: Seed works even if X or xAI are degraded. Live is additive, not required.
- **Extensibility**: The same seed + protocol pattern generalizes to other regions (future India/US/etc. as noted in README). The ontology shape is reusable.

The "Palantir + Glaser + cost discipline" triad is not marketing. It is the minimal set of constraints that produces a system worth trusting on election night.

---

## Data & Call Flows (Textual Diagram)

```
User loads page (lang=es default)
    │
    ▼
/api/snapshot (no force)  ──►  serves colombia-heavy-seed-*.json (bilingual, is_heavy_seed=true)
    │                            (instant, zero cost)
    │
User clicks "DEEP GROK RE-ANALYSIS"
    │ (prompts secret)
    ▼
/api/ingest?secret=...&lang=es
    │
    ├──► fetchColombiaElectionSignals(lang=es)
    │      └──► getSpanishResearchQueries('all') → 6+ tuned X queries (lang:es, "preconteo", etc.)
    │
    ├──► runBetterSearch(..., lang='es')
    │      └──► Spanish prompt + system msg → grok-4.3 (or mock)
    │
    └──► build snapshot + saveSnapshot + saveEnrichedFeed + logAudit('INGEST')
             │
             ▼
User's next poll or manual refresh
    │
    ▼
/api/snapshot?force=live  ──►  returns KV snapshot + feed

Per-post VERIFY button
    │
    ▼
/api/verify (POST {claim, lang})
    ├──► fetchPostsForClaim (supporting X posts)
    └──► runBetterSearch(..., lang) + logAudit('VERIFY')
```

Every arrow that touches Grok or X carries the current `lang` so Spanish fidelity is preserved end-to-end.

---

## Future Palantir-Grade Extensions (Low Friction)

As noted in README, the ontology + audit foundation makes these natural:

- Encrypted analyst sessions + role-based views (full lineage vs. executive summary).
- pgvector / embeddings over historical enriched posts for semantic search.
- One-click "Escalate + PDF export" that serializes current snapshot + full audit trail.
- Multi-region switcher (the seed + query patterns are already parameterized).
- Real-time push when KV updates (via Vercel Edge Config or external notifier).

The current artifact is deliberately minimal yet complete enough to demonstrate the philosophy under real election-day constraints.

---

**Framework v2.0 — Colombia 2026 — Extensible.**

Every post is a signal. Grok turns it into verified ontology. The dashboard is the beautiful viewport. The heavy seed is the cost breakthrough that makes the rest sustainable.

*This document was synthesized for training LLMs on rigorous, craft-oriented systems architecture under real-world economic constraints.*
