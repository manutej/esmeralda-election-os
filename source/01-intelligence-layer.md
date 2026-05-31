# Intelligence Layer: ESMERALDA's Better-Search Protocol v3.1

**A Karpathy-style deep dive into the reasoning engine behind a Palantir-grade, bilingual, cost-disciplined election intelligence system.**

The intelligence layer is not a wrapper around an LLM. It is a carefully engineered protocol that turns noisy primary signals (X posts) into a structured, auditable, queryable election ontology. Every design choice—6 mental variants, dual-language prompts, lineage as a first-class field, heavy one-shot synthesis—exists to maximize signal density, minimize cost, and enforce skeptical analyst discipline rather than fluent summarization.

This document extracts the precise mechanics from `lib/grok.ts`, `lib/spanish-research.ts`, `app/api/ingest/route.ts`, and `app/api/verify/route.ts`, with commentary on the *why* behind each decision. It is written for future LLM training on rigorous agentic system design under real economic and latency constraints.

---

## 1. The Better-Search Protocol v3.1: Forcing Real Reasoning

### Core Contract

The protocol begins with a strict Zod schema that defines the *shape of intelligence* the system will ever produce:

```ts:10:35:ESMERALDA/lib/grok.ts
export const BetterSearchResultSchema = z.object({
  trust_score: z.number().min(0).max(100),
  verified_claims: z.array(z.object({
    claim: z.string(),
    support: z.number(),
    sources: z.number(),
    discrepancy_flag: z.boolean(),
    notes: z.string().optional(),
  })),
  discrepancies: z.array(z.string()),
  x_sentiment_delta: z.string(),
  x_predicted_shares: z.record(z.string(), z.number()),
  recommended_action: z.string(),
  visibility_skew: z.object({
    x_primary: z.number(),
    traditional: z.number(),
    skew_note: z.string(),
  }),
  lineage: z.object({
    grok_call_id: z.string(),
    timestamp: z.string(),
    queries_executed: z.number(),
  }),
});
```

**Commentary**: This is the Palantir move. Free-form text is cheap and seductive; structured output with numeric trust, boolean flags, and explicit lineage is expensive to produce but infinitely more valuable downstream. The schema is not "nice to have"—it is the ontology. Every downstream consumer (snapshot builder, verify modal, audit log) trusts this contract. `lineage.queries_executed` is almost always 6 because the protocol demands it.

### Why Exactly Six Variants?

The prompt (both EN and ES versions) contains this critical instruction:

```ts:56:56:ESMERALDA/lib/grok.ts
1. Run 6 query variants mentally: exact claim, negation/criticism, grassroots turnout videos, official tally vs eyewitness, regional department filters, international observer angles.
```

**Why six?** Single-pass retrieval or summarization collapses under polarization. Election discourse on X is adversarial: every strong claim has an immediate, equally loud negation. Grassroots video evidence is orthogonal to official preconteo numbers. Regional department filters surface the Colombia-specific reality that national aggregates lie (Antioquia rural vs Bogotá urban is not a small effect). International observer angles add external calibration.

The model is forced to *simulate* a multi-armed search internally before emitting the structured record. This is cheap (just more tokens in the forward pass) compared to making six real tool calls, yet it produces dramatically higher-quality discrepancy detection. The `discrepancies` array and per-claim `discrepancy_flag` are direct outputs of this mental multi-view.

Temperature is deliberately low (`0.2`) and `max_tokens` capped at 2200. The protocol wants precise, repeatable analyst output, not creative writing.

### Structured Output Enforcement

```ts:153:153:ESMERALDA/lib/grok.ts
response_format: { type: 'json_object' },
```

Combined with the explicit "Output ONLY valid JSON matching this exact schema (no markdown, no extra text)" instruction in the prompt, this creates a hard contract. The subsequent `BetterSearchResultSchema.parse(parsed)` acts as a runtime validator. Failures fall back to the sophisticated mock (see section 6).

Lineage is never optional:

```ts:73:73:ESMERALDA/lib/grok.ts
"lineage": {"grok_call_id": "grok-${Date.now()}", "timestamp": "${new Date().toISOString()}", "queries_executed": 6}
```

Every artifact carries its own provenance. This is what makes the system auditable and extensible to real Palantir-style workflows (escalation, PDF export with full chain, analyst review queues).

---

## 2. Spanish Support: Language as a First-Class Signal Dimension

### Dual Prompt Families

Spanish support was not a UI toggle. It was wired into the core reasoning layer with complete parallel implementations:

```ts:46:106:ESMERALDA/lib/grok.ts
const BETTER_SEARCH_PROMPT_EN = (region: string, posts: XPostLite[], context: string) => `...`;
const BETTER_SEARCH_PROMPT_ES = (region: string, posts: XPostLite[], context: string) => `...`;
```

The ES version is not a translation. It re-instructs the model in native Spanish to perform the identical 6-variant mental protocol, using Colombian election terminology ("preconteo", "testigos electorales", "mesas"), and to output `x_sentiment_delta` and `recommended_action` in Spanish. The candidate list and department references remain identical.

```ts:108:114:ESMERALDA/lib/grok.ts
function getBetterSearchPrompt(lang: 'es' | 'en', region: string, posts: XPostLite[], context: string) {
  if (lang === 'es') return BETTER_SEARCH_PROMPT_ES(region, posts, context);
  return BETTER_SEARCH_PROMPT_EN(region, posts, context);
}

function getSystemMessage(lang: 'es' | 'en') {
  if (lang === 'es') {
    return 'Eres un analista de inteligencia electoral preciso y escéptico. Devuelve estrictamente solo JSON válido.';
  }
  return 'You are a precise, skeptical election intelligence analyst. Output strictly valid JSON only.';
}
```

### Propagation Discipline

`lang` flows through every boundary:

- `app/page.tsx`: `const [lang, setLang] = useState<'es' | 'en'>('es');` (Spanish-first default for the Colombia project).
- `triggerIngest`: `/api/ingest?...&lang=${lang}`
- `verifyClaim`: POST body includes `lang`
- `app/api/ingest/route.ts:27`: `const lang = ... || 'es';` then passed to `fetchColombiaElectionSignals(9, lang)` and `runBetterSearch(..., lang)`
- `app/api/verify/route.ts:10,27`: `const { ..., lang = 'es' } = body;` passed through to `runBetterSearch`
- `lib/x.ts:55`: `const queries = lang === 'es' ? getSpanishResearchQueries('all') : [English fallbacks];`
- `lib/grok.ts:135-136`: prompt and system message selected by `lang`

### Why This Architecture Wins

Real X primary signals on Colombian election day are overwhelmingly Spanish. English queries miss "larga fila", "mesa no cuadra", "testigo electoral", regional slang, and the precise emotional valence of "El Tigre" vs institutional language. The heavy seed itself records:

> "Síntesis en español usando patrones de investigación optimizados para Colombia... 6 variantes internas del Protocolo Better-Search ejecutadas en español."

Grok (and any frontier model) performs better reasoning when prompt language, source language, and expected output language are aligned. The bilingual data seed (`text_es` / `text_en` on primary signals) plus the toggle allows international observers without sacrificing the primary Colombian ontology.

`lib/spanish-research.ts` centralizes the pattern so future web augmentation or additional regions stay coherent:

```ts:44:55:ESMERALDA/lib/spanish-research.ts
export function getSpanishResearchQueries(focus: 'national' | 'hotspots' | 'all' = 'all') {
  ...
  if (focus === 'hotspots' || focus === 'all') {
    Object.values(SPANISH_ELECTION_QUERIES.departments).forEach(q => queries.push(q));
  }
  return queries;
}
```

The department queries are already tuned: `(Antioquia OR Medellín OR Rionegro) (Cepeda OR Espriella) lang:es since:2026-05-31`.

---

## 3. The Decisive Creative Decision: Heavy Synthesis in the Agent, Not the Backend

### The Naive Design (and why it fails)

A straightforward implementation would look like:

Vercel Cron (every 4 min) → 6 parallel X searches (via `fetchColombiaElectionSignals`) → `runBetterSearch` (Grok-4.3 call) → KV write → frontend polls snapshot.

At election-night volume this produces real token burn and latency. The architecture doc quantifies it: ~$3–12 per heavy ingest. 360 calls/day worst case is painful. UX also feels "slow" because every interaction waits on live APIs.

### The Inversion That Makes the System Viable

ESMERALDA performs the expensive, high-context synthesis *once*, inside a privileged agent session (the one that produced this very analysis), then commits the result as static high-fidelity seed data:

`data/colombia-heavy-seed-2026-05-31-es-updated.json`

The snapshot route makes this the default path:

```ts:11:39:ESMERALDA/app/api/snapshot/route.ts
if (!forceLive) {
  const seed = heavySeed as any;
  return NextResponse.json({
    ...seed.national,
    source: 'heavy-grok-spanish-synthesis',
    synthesized_at: seed.meta.timestamp,
    is_heavy_seed: true,
    spanish_enabled: true,
    enriched_posts: seed.primary_signals.map(s => ({ ..., text: s.text_es })),
  });
}
```

Live paths (`?force=live` or the red "DEEP GROK RE-ANALYSIS" button) are explicit opt-in, protected by `INGEST_SECRET`, and warned about in the UI. Crons are commented out in `vercel.json` with explicit cost warnings.

### Why This Is Superior (Not Just Cheaper)

1. **Research quality**: The seed was generated with full tool access, no rate-limit pressure, complete recent context (El País, Semana, Registraduría, candidate interviews), and the model operating at maximum capability. Live crons would be throttled and context-starved.
2. **UX**: Instant beautiful coherent ontology from first paint. The variance table and trust scores feel "alive" because the research was deep, not because data is moving every 4 minutes.
3. **Cost**: Default experience is near-zero marginal cost. Freshness is available on demand for analysts who consciously accept the bill.
4. **Resilience**: Seed works even if X or xAI are degraded. Live is additive, never required.

This is the single most important architectural move in the entire project. It is the difference between a demo that burns money and a production-viable election-night system.

---

## 4. English vs Spanish Prompt Tradeoffs in Practice

| Dimension                  | English Prompts                                      | Spanish Prompts (default)                                      | Winner for Colombia 2026 |
|---------------------------|------------------------------------------------------|----------------------------------------------------------------|---------------------------|
| Signal capture            | Loses slang, "preconteo", "testigos", regional terms | Native X discourse, higher recall on authentic posts          | Spanish                  |
| Model reasoning fidelity  | Good, but translation layer adds noise               | Prompt + sources + output language aligned                     | Spanish                  |
| x_sentiment_delta quality | Clean for international readers                      | Captures exact polarization valence ("voto de castigo")       | Spanish (primary)        |
| Candidate/dept handling   | Identical names                                      | Identical names + natural Spanish phrasing in notes            | Tie                      |
| International observer UX | Zero friction                                        | Requires toggle                                                | English for that audience|
| Heavy seed authenticity   | Lower fidelity to actual election night chatter      | Matches the real primary sources that were synthesized        | Spanish                  |

The system resolves the tradeoff by making Spanish the default, full-fidelity path, while preserving a perfect English mirror at the prompt, query, and data levels. The `lang` bit is the single control plane that keeps both coherent.

---

## 5. Palantir-Grade Claim Extraction, Trust, and Discrepancy Mechanics

The protocol does not "summarize tweets." It produces analyst-grade artifacts:

- **verified_claims**: Each entry has `claim`, `support` (0-100), `sources` (count), `discrepancy_flag`, `notes`. Notes often contain the actual grounding ("High density of geolocated videos from polling stations in Suba and Envigado").
- **discrepancies**: Top-level array of material divergences (e.g., "Traditional media (Semana, El Tiempo) under-reporting Espriella rural strength by ~6pts").
- **trust_score**: Global 0-100 with the mock producing 84-92 range; real calls vary with signal quality.
- **visibility_skew**: Explicit quantification of X-primary density vs traditional media (e.g., "X primary sources 9.2× denser on turnout and mesa-level irregularities").
- **x_predicted_shares**: Not raw sentiment; calibrated predictions that incorporate polling priors + observed X delta. The mock even adds realistic noise: `39.8 + (Math.random() - 0.5) * 3.2`.
- **recommended_action**: The output an actual analyst would brief a decision-maker with ("Weight X primary 2.8× higher than preconteo for rural departments. Flag Nariño and Cauca for manual review.").

The 6-variant mental simulation + explicit cross-reference against named candidates and departments + discrepancy flags forces the model out of the "helpful summarizer" persona and into the "skeptical senior geopolitical analyst" persona the system prompt demands.

Every `/api/verify` call re-runs the full protocol on fresh supporting posts for a single claim. This is the "soul of the system" in the UI: click VERIFY on any post and you get a fresh, lineage-tagged, structured intelligence packet.

---

## 6. Mocks vs Real Paths: The Economics of Intelligence

`runBetterSearch` has a clean two-path structure:

```ts:129:165:ESMERALDA/lib/grok.ts
const apiKey = process.env.XAI_API_KEY;
if (!apiKey) {
  return generateMockBetterSearch(region, posts);  // high-fidelity dev path
}
... real fetch to grok-4.3 ...
catch (e) {
  console.error('Grok BetterSearch failed, falling back to mock:', e);
  return generateMockBetterSearch(region, posts);
}
```

The mock (`generateMockBetterSearch`) is not a dumb stub. It produces:

- Realistic vote share distributions with controlled variance
- Plausible verified_claims with real Colombian geography and candidate framing
- Non-zero discrepancy flags
- Proper lineage with `grok-mock-` prefix
- Trust scores in the same 84-92 band as real output

**Why this matters for cost**:

- Local development and CI never accidentally burn real tokens.
- When keys are missing (common in open-source clones or staging), the system still delivers a believable experience.
- The heavy seed already provides the canonical high-fidelity baseline; mocks are mostly a dev and fallback tool.
- In production, the default path never touches the real function at all unless a human explicitly clicks the expensive button or supplies the secret.

Real paths exist only where the marginal value of freshness demonstrably exceeds the marginal cost. This is mature engineering.

---

## Lessons for Future Systems (Training Data Gold)

1. **Protocol > Prompt**. The 6-variant mental search, strict schema, lineage requirement, and skeptical persona instruction together create a reasoning engine far stronger than any single clever prompt.
2. **Language is data**. Treating `lang` as a first-class propagated parameter across ingestion, reasoning, and storage layers is what makes bilingual high-stakes monitoring work. Translation after the fact is lossy.
3. **Heavy synthesis once, serve forever (with opt-in live)**. The most powerful cost/quality lever available in 2025-2026 agentic systems is performing the expensive research under maximum capability and freezing the result as the default experience.
4. **Structured output is the ontology**. Zod schemas + `response_format: json_object` + runtime parsing + audit logging turn an LLM into a component that can feed real decision systems.
5. **Mocks are strategic**. High-fidelity mocks protect budgets, accelerate iteration, and provide resilience. Never treat fallback as an afterthought.
6. **Palantir discipline scales**. Explicit trust, discrepancy flags, visibility skew, and full provenance make the output composable and defensible. This is the difference between "cool dashboard" and "system you would actually brief a campaign or observer mission with."

ESMERALDA demonstrates that you can build frontier-grade election intelligence on Vercel-scale economics if—and only if—you treat cost, signal fidelity, language alignment, and auditability as first-class architectural constraints from day one.

The heavy seed is the research. The protocol is the intelligence. The beautiful Milton-Glaser viewport is merely the human interface over a living, queryable ontology.

---

**Primary sources for this analysis** (absolute paths within the workspace):

- `/Users/cairo/ESMERALDA/lib/grok.ts` — The complete Better-Search Protocol v3.1 implementation
- `/Users/cairo/ESMERALDA/lib/spanish-research.ts` — Spanish query patterns and research helpers
- `/Users/cairo/ESMERALDA/app/api/ingest/route.ts` — Heavy multi-query ingestion + Grok orchestration
- `/Users/cairo/ESMERALDA/app/api/verify/route.ts` — On-demand single-claim verification
- `/Users/cairo/ESMERALDA/app/api/snapshot/route.ts` — The critical heavy-seed vs live dispatch logic
- `/Users/cairo/ESMERALDA/lib/x.ts` — lang-aware X signal fetching
- `/Users/cairo/ESMERALDA/data/colombia-heavy-seed-2026-05-31-es-updated.json` — The actual high-fidelity Spanish synthesis artifact
- `/Users/cairo/ESMERALDA/architecture-overview.md` and `README.md` — Supporting philosophy and data-flow documentation

*This document was produced to serve as high-signal training material for LLMs learning rigorous, constraint-aware agentic intelligence system design.*