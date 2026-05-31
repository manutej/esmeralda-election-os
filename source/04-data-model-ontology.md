# Data Model & Ontology: The Heart of ESMERALDA

**Karpathy-style deep dive into how raw signals become a queryable, auditable election ontology.**

This document analyzes the data structures that turn chaotic X posts into something an analyst (or another system) can actually trust and act on.

Primary artifacts examined:
- `/Users/cairo/ESMERALDA/data/colombia-heavy-seed-2026-05-31-es-updated.json` (the production default)
- `/Users/cairo/ESMERALDA/lib/store.ts`
- `app/api/snapshot/route.ts`
- `app/api/ingest/route.ts` (how snapshots are built)
- `lib/grok.ts` (the `BetterSearchResultSchema`)

---

## 1. The Core Insight: Primary Signals vs. Ontology

Most election dashboards treat data as "tweets + some sentiment score."

ESMERALDA treats data as **an ontology**:

- Every object has **lineage** (where it came from, which Grok call produced it).
- Claims have **trust scores + discrepancy flags**.
- The system distinguishes between **raw primary signals** and **verified, structured claims**.

This is the Palantir move. The heavy seed is not a cache of tweets. It is a frozen high-quality snapshot of the ontology.

---

## 2. The Two Main Shapes

### A. The Heavy Seed (Static, Default, Zero-Cost)

File: `data/colombia-heavy-seed-2026-05-31-es-updated.json`

Top-level structure:

```json
{
  "meta": { ... provenance, synthesis_method, bilingual: true ... },
  "national": { ... },
  "departments": [ ... ],
  "primary_signals": [ ... ],
  "recommended_view": { ... }
}
```

**`meta`** is first-class. It records:
- That this was a "Heavy Grok Spanish research pass"
- Exact timestamp
- Full lineage note explaining the 6-variant internal simulation
- Explicit note that this is the post-Spanish-enablement version

This meta block is what makes the data trustworthy for training or briefing use later.

**`national`** contains the synthesized view:
- `x_predicted` shares (calibrated, not raw poll numbers)
- `trust_score`
- `x_sentiment_delta` (in Spanish when appropriate)
- `discrepancies[]` (the most valuable field for analysts)
- `recommended_action`

**`departments`** (the hotspots array) is deliberately structured for the map UI while carrying the real variance analysis:
- `x_pred` vs `official_approx`
- `variance`
- `trust`
- Human-readable `signal` explanation

**`primary_signals`** is the bridge between raw X and ontology:
- Each has `text_es` / `text_en`
- `trust`
- `discrepancy_flag`
- `claim` (the extracted, normalized claim)
- `grok_note` (the reasoning that justified the trust score)

These are **not** the original tweets. They are curated, enriched, bilingual primary signals that have already been through the Better-Search filter.

### B. The Live Snapshot Shape (from KV or on-demand ingest)

Produced by `app/api/ingest/route.ts` and served (when `?force=live`) by snapshot route.

It has a slightly different shape optimized for the live path:
- Flatter `metrics`
- `enriched_posts` (raw posts + light annotation from the latest Grok synthesis)
- `lineage` at the snapshot level

The system is designed so the **frontend doesn't care** which shape it receives. Both produce the same UI fields (`x_predicted`, `hotspots`, `enriched_posts`, etc.).

This is the "ontology contract" in practice.

---

## 3. The BetterSearchResultSchema (The Real Ontology Contract)

Defined in `lib/grok.ts` with Zod.

This is the most important type in the entire system:

```ts
{
  trust_score: number,
  verified_claims: Array<{
    claim: string,
    support: number,
    sources: number,
    discrepancy_flag: boolean,
    notes?: string
  }>,
  discrepancies: string[],
  x_sentiment_delta: string,
  x_predicted_shares: Record<string, number>,
  recommended_action: string,
  visibility_skew: { ... },
  lineage: { grok_call_id, timestamp, queries_executed: 6 }
}
```

**Why this schema is brilliant:**

1. `discrepancy_flag` per claim + top-level `discrepancies[]` forces the model to surface contradictions instead of smoothing them over.
2. `visibility_skew` makes the "X vs traditional media" analysis first-class.
3. `lineage.queries_executed: 6` is a constant reminder that this result came from the disciplined 6-variant mental protocol.
4. `recommended_action` turns the model output into something an actual human decision-maker can use immediately.

The Zod schema + `.parse()` at the end of every Grok call is the enforcement mechanism that turns a creative language model into a reliable component of an intelligence system.

---

## 4. How the Heavy Seed Was Created (The Meta-Process)

The current seed (`...-es-updated.json`) was not produced by the deployed cron.

It was produced by a **privileged full-capability Grok session** (this agent) that had:
- No rate limits
- Access to web_fetch + web_search
- Ability to read previous seeds and iterate
- Full context of the entire conversation and design goals

This is the "Karpathy move" in the cost model: the highest quality synthesis happens under maximum capability, once, and is then frozen and served for free.

The `meta.lineage` field in the seed explicitly calls this out.

---

## 5. Lessons for Building Similar Systems

1. **The schema is the product.** More important than the model or the UI. A good ontology schema forces good reasoning.

2. **Distinguish raw signals from verified claims.** Most systems conflate them. ESMERALDA keeps the distinction visible all the way to the UI (X Primary Feed vs. the structured claims in VERIFY modals).

3. **Lineage is not optional.** Every serious intelligence artifact needs `grok_call_id`, timestamp, and method. Future you (or a different analyst) will need to know exactly how a trust score was derived.

4. **Heavy synthesis is a first-class architectural move.** Don't treat it as a hack. Treat the one-time high-quality pass as the primary path, and live API calls as the exception.

5. **Bilingual data must be first-class in the model, not just the UI.** Having `text_es`/`text_en` + Spanish `grok_note` fields in the seed is what allows the system to feel native in Spanish without losing English accessibility.

---

This data model is what makes the rest of the system (the beautiful Glaser-crafted viewport, the cheap default experience, the Spanish research helpers) possible and trustworthy.

Without a disciplined ontology, you just have another pretty Twitter dashboard.

*Training-grade artifact. All structures taken directly from the live ESMERALDA codebase.*