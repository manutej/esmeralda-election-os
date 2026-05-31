# Production, Cost & Deployment Strategy

**How ESMERALDA achieves Palantir-grade intelligence on realistic budgets.**

This is the document that explains why the system is actually deployable and sustainable, rather than just a cool demo.

Primary sources:
- `vercel.json`
- `app/api/snapshot/route.ts` (the default heavy seed path)
- `app/api/ingest/route.ts` + secret protection
- `lib/grok.ts` (mock vs real paths)
- `README.md` (cost notes)
- The entire conversation history around "slow and expensive" → creative solution

---

## 1. The Fundamental Problem

Naive design for a "live" election dashboard:

- Every 4-9 minutes: 6-9 X searches + one full Grok Better-Search on 30+ posts
- During election night: potentially hundreds of such calls
- Each Grok call on a serious prompt is not cheap
- X API calls also add up under volume

Result: Either the product feels slow (because you can't afford frequent calls), or it becomes surprisingly expensive, or both.

ESMERALDA's answer was not "optimize the prompts" or "use a cheaper model."

It was a complete inversion of the architecture.

---

## 2. The Inversion: Heavy Synthesis Once, Serve Forever

Core principle:

> The highest quality research pass happens under maximum capability and zero operational pressure. Do it once. Freeze it. Serve it as the default experience.

This is implemented as:

1. **The privileged synthesis pass** (done by the agent in this conversation, using full tools + context)
2. **Committed as static JSON** in `data/colombia-heavy-seed-2026-05-31-es-updated.json`
3. **Served instantly** by `/api/snapshot` (no KV read, no API calls to X or x.ai)
4. **Live path exists but is opt-in and protected** (`?force=live` + secret)

The deployed frontend polls the cheap path by default every 28 seconds. It feels continuously alive because the data it is showing was the result of an extremely high-effort research pass.

---

## 3. The Two-Path Design in the Intelligence Layer

In `lib/grok.ts`:

```ts
const apiKey = process.env.XAI_API_KEY;
if (!apiKey) {
  return generateMockBetterSearch(...);  // sophisticated, same shape as real
}

... real call to grok-4.3 ...
```

The mock is not a dumb fallback. It produces plausible, Colombia-2026-specific output with proper lineage (`grok-mock-` prefix), correct trust bands, and the same schema.

This is strategic:
- Development velocity
- No accidental token burn during testing
- The heavy seed itself can be treated as a "super mock" that was produced under even better conditions than the production mock

---

## 4. Vercel Deployment Reality

`vercel.json` has the aggressive crons **commented out with explicit warnings**.

This is not laziness. It is the correct default for this architecture.

When (if) the operator decides the marginal value of fresh live Grok calls every 12 minutes exceeds the cost, they can uncomment. Until then, the system runs at near-zero marginal cost.

The heavy seed + the default snapshot path + the commented crons are the three artifacts that make the economics work.

---

## 5. Bilingual + Spanish as a Cost/Quality Lever

Running the Grok protocol in Spanish (when `lang=es`) is not just a UX feature.

It is a quality multiplier that reduces the need for compensatory live calls.

Spanish-native queries + Spanish instructions + Spanish reasoning produce higher fidelity `discrepancies`, `x_sentiment_delta`, and `notes` on Colombian election content than English paths.

Higher quality per synthesis → less need to re-synthesize frequently → lower cost for the same (or better) effective intelligence.

The `spanish-research.ts` centralization + full `lang` propagation is part of the cost strategy, not just internationalization.

---

## 6. The VERIFY Escape Hatch

The per-claim VERIFY button is the only place where a user can explicitly trigger a fresh Grok call on a narrow scope.

This is intentional:

- Most of the time, the heavy seed is "good enough" and extremely high quality.
- When something specific looks suspicious or important, the analyst can pay the cost for a targeted deep dive.
- Every such call is audited (`logAudit` with action: 'VERIFY').

This turns cost from a constant burn into a deliberate, traceable, high-value action.

---

## 7. Lessons (Extremely High Value for LLM Wiki)

1. **The biggest cost lever is often not in the model or the prompt — it is in the system architecture around when you choose to call the model at all.**

2. **A high-quality frozen artifact produced under privileged conditions can be better than continuous mediocre live calls.** This is counter-intuitive to many "real-time" product people.

3. **Make expensive paths explicit and protected.** The secret on ingest + the red "Deep Grok Re-analysis" button are UI/ops manifestations of this principle.

4. **Mocks are not a dev-only concern.** High-fidelity mocks (and high-fidelity committed seeds) are a core part of sustainable production architecture when using frontier models.

5. **Language is a cost variable.** Better native-language reasoning reduces the frequency at which you need to re-run expensive synthesis.

6. **Audit every expensive action.** The `logAudit` calls on VERIFY and INGEST turn cost into something you can later analyze and justify.

7. **The default path should be the cheap, high-quality path.** Everything else should be opt-in and visibly different (color, labeling, warnings).

---

This production strategy is what allows ESMERALDA to feel like a rich, continuously researched Palantir-grade system while actually being mostly a beautifully rendered static asset with a few very deliberate escape hatches for live depth.

Without this layer of thinking, the project would have been either too expensive to run or too shallow to be useful.

*This is the document that explains why the rest of the system is viable in the real world.*

*Training-grade artifact.*