# ESMERALDA — Source Documents for Karpathy-Style LLM Wiki

This folder contains a set of high-density, training-grade markdown documents produced by systematic analysis (using subagents) of the ESMERALDA codebase.

These documents are written in the precise, high-signal style of Andrej Karpathy — suitable for use as high-quality training data, a technical wiki, or internal reference material for building similar agentic intelligence systems.

## Document Index

| File | Focus | Why It Matters |
|------|-------|----------------|
| `00-architecture-overview.md` | High-level philosophy, system architecture, Palantir + craft influences, cost inversion model | The "why" and "how it all fits together" document |
| `01-intelligence-layer.md` | Grok Better-Search Protocol v3.1, Spanish prompt support, agent vs backend synthesis | The reasoning engine and language-as-first-class-dimension |
| `02-data-ingestion-layer.md` | X multi-query strategy, `spanish-research.ts`, signal → ontology pipeline | How raw primary sources are acquired without destroying signal |
| `03-frontend-viewport.md` | The React dashboard, heavy seed rendering, VERIFY interactions, bilingual UI, Milton/Glaser aesthetic | How the ontology is made beautiful, usable, and alive at low marginal cost |
| `04-data-model-ontology.md` | The heavy seed JSON structure, `BetterSearchResultSchema`, lineage, claims vs signals | The actual data contracts that make everything else reliable and auditable |
| `05-production-cost-strategy.md` | The economic inversion, two-path design, mocks, opt-in expensive actions, Vercel realities | Why this system is actually sustainable on real budgets |

## How These Documents Were Created

- Multiple specialized subagents were spawned with read-only access to the full codebase.
- Each subagent was explicitly instructed to write in dense, educational, Karpathy-style prose.
- Emphasis was placed on: explicit tradeoffs, "why this and not the obvious alternative", code excerpts with commentary, numbered lessons, and provenance back to specific files/lines.
- The goal was not marketing copy or high-level overviews, but material that would be genuinely useful for training future models or for a serious practitioner building something similar.

## Future Use (Karpathy-Style LLM Wiki)

These files are designed to be ingested into a larger structured wiki (similar to Karpathy's personal notes or the nanoGPT/makemore teaching materials).

Suggested next steps when building the wiki:
- Add cross-links between documents
- Create a "Bitter Lessons" or "Design Principles" synthesis document
- Extract code patterns into a separate "Recipes" section
- Add visual diagrams (architecture, data flow, prompt selector)
- Version the documents alongside major changes to the codebase

All documents are self-contained enough to be useful individually while forming a coherent whole when read together.

---

**Project**: ESMERALDA (X•ELECTION OS — Colombia 2026)  
**Location**: `/Users/cairo/ESMERALDA/`  
**Generated**: 2026-05-31

*These are the source materials. The wiki comes later.*