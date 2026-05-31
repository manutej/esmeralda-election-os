# Data Ingestion and X Research Layer

**Precise, high-signal analysis of the signal acquisition + first-mile ontology construction pipeline.**

This layer sits between raw X firehose fragments and the structured Palantir-style election ontology. It is deliberately heavy on the front end (multi-query breadth) and delegates depth to the Grok Better-Search Protocol.

Primary files analyzed:
- `lib/x.ts`
- `lib/spanish-research.ts`
- `app/api/ingest/route.ts`
- `lib/grok.ts` (the consumer of the signals)

---

## 1. The Multi-Query Heavy Research Strategy

`fetchColombiaElectionSignals` does **not** perform "search recent tweets."

It executes a family of overlapping, high-precision queries in parallel, deduplicates by tweet ID, applies a lightweight region heuristic, and caps the union.

When `lang === 'es'` (the default):

```ts
const queries = lang === 'es' 
  ? getSpanishResearchQueries('all')
  : [ /* English fallbacks */ ];
```

`getSpanishResearchQueries('all')` expands to 9 queries (national ×3 + turnout ×2 + department-specific).

Each query uses `lang:es`, `since:2026-05-31`, and selective `min_faves` filters on the most discrepancy-prone signals.

**Why this many queries?**

Election discourse is adversarial and geographically fragmented. A single broad query is dominated by high-follower accounts and media. The partitioned set surfaces:

- Candidate-specific framing
- Turnout and integrity signals ("preconteo", "testigos electorales", "mesas")
- Department hotspots that national aggregates erase

Deduplication + recency sort + hard cap at 42 posts keeps the payload for Grok tractable while preserving diversity.

Individual query failures are swallowed so one bad pattern or rate limit does not kill the ingest.

**Important distinction**: The famous "6" in the system is **not** the number of X calls. It is the number of *mental variants* the Grok protocol is forced to simulate internally (exact claim / negation / grassroots / official vs eyewitness / regional / international).

Real X breadth feeds simulated depth.

**Lesson**: Breadth at retrieval is cheap relative to its effect on downstream reasoning quality.

---

## 2. Spanish Optimization Centralized

Spanish support was extracted into a single source of truth: `lib/spanish-research.ts`.

It contains:
- `SPANISH_ELECTION_QUERIES` (national, turnout, departments)
- `getSpanishResearchQueries(focus)`
- `WEB_SEARCH_EXAMPLES_ES` (for future non-X augmentation)

Propagation is total:

- Ingest route reads `lang` and passes it to both X fetcher and `runBetterSearch`
- `lib/x.ts` selects the Spanish query family
- `lib/grok.ts` chooses Spanish prompt + system message
- Frontend `lang` state (default `'es'`) drives every boundary

The heavy seed itself ships with bilingual primary signals (`text_es` / `text_en`) and records its Spanish synthesis provenance.

**Why this matters**: Real primary sources on election day are overwhelmingly Spanish. English queries lose "larga fila", "mesa no cuadra", regional valence, and the precise emotional register of "El Tigre."

Language must be a first-class propagated dimension, not a presentation concern.

---

## 3. Raw X Signals → Ontology

Two-stage transform:

**Stage 1 — Acquisition** (`lib/x.ts`):
- Raw `XPost` objects (`id`, `text`, `author`, `created_at`, `likes`, `region_hint`)
- No summarization, no scoring, minimal filtering

**Stage 2 — Synthesis** (`app/api/ingest/route.ts`):
- Feeds the batch to `runBetterSearch`
- Receives the strict `BetterSearchResultSchema`
- Materializes the **ontology snapshot**:
  - `metrics`
  - `hotspots`
  - `enriched_posts` (raw posts + light annotation from the synthesis)
  - Full `discrepancies`, `verified_claims`, and `lineage`

This snapshot is what gets written to KV and what the heavy seed mirrors.

The VERIFY endpoint does the same protocol on a micro-batch around a single claim.

The ontology is therefore **primary signals + structured, lineage-tagged, discrepancy-aware claims** — not "tweets plus summary."

---

## 4. Tradeoffs Table (from the analysis)

| Dimension            | Many real X queries (current)          | Naive single query + summarize      |
|----------------------|----------------------------------------|-------------------------------------|
| Signal coverage      | High (geo + narrative partitions)      | Low (loud accounts dominate)        |
| Discrepancy power    | Excellent                              | Poor                                |
| Spanish fidelity     | Native per partition                   | Usually lossy                       |
| Cost per ingest      | Moderate X + 1 Grok call               | Cheapest, worst quality             |
| Rate limit resilience| Good (failures tolerated)              | Single point of failure             |

The decisive lever is the **mental simulation** inside the Grok prompt (the 6 variants). Real breadth is cheap; forcing disciplined internal reasoning is almost free in tokens relative to the gain.

---

## 5. Key Lessons

1. **Retrieval breadth is a reasoning multiplier.** Partitioned, language-native queries create the orthogonal evidence the protocol needs.

2. **Centralize the language-specific research contract.** `spanish-research.ts` is the single place to evolve queries.

3. **The ontology is the asset; tweets are raw material.** The transform to structured claims with trust and lineage is what makes the system auditable and composable.

4. **Mental simulation inside the model is often cheaper and more powerful than N real tool calls.**

5. **Heavy synthesis once + explicit opt-in live is the only sustainable pattern** at frontier model prices.

6. **Language is not a presentation concern.** It must flow through acquisition → reasoning → storage → serving.

7. **Lineage and audit are non-negotiable** for anything you might actually brief a real stakeholder with.

---

This layer is what separates "cool election Twitter dashboard" from "something you would actually trust on election night."

*Training-grade artifact.*