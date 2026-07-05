# External resources matrix — Topic C (tutorials rewrite)

All resources actually consulted for this topic, what they're useful for, and where the distillation
lives. "Consulted" means fetched/read in this run, not just named in the spec.

| Resource | Type | Why useful for Topic C | Distilled in |
|---|---|---|---|
| `docs.medusajs.com/learn` (Introduction) | Primary docs, live fetch | Confirms Medusa's "Learn" build-along exists as a distinct top-level tutorial lane, separate from Reference/Guides | `research/C-tutorials/medusa-teardown.md` |
| `docs.medusajs.com/learn/installation` | Primary docs, live fetch | Concrete step-granularity + checkpoint-pattern evidence (command-before-explanation, "Successful Installation Result" heading) | `research/C-tutorials/medusa-teardown.md` |
| `docs.medusajs.com/learn/fundamentals/modules` | Primary docs, live fetch | Concrete numbered-step + "Test the Module" checkpoint pattern; prose-first-concept-then-code sequencing | `research/C-tutorials/medusa-teardown.md` |
| `docs/site/_plan/research/competitors/medusa.md` | In-repo prior art | Existing NetScript-authored Medusa teardown (IA, hero design, signature components, strengths/weaknesses) — the owner-named starting point per topic spec §6 | `research/C-tutorials/medusa-teardown.md` (merged) |
| `docs/site/_plan/research/doc-architecture-patterns.md` | In-repo prior art | Cross-cutting synthesis already done across Astro/Laravel/TanStack/Medusa/NestJS/Encore/Hono/Temporal — directly reusable, do not re-derive | `research/C-tutorials/other-tutorial-ecosystems.md` (cited, not duplicated) |
| `docs/site/_plan/research/competitors/astro.md` | In-repo prior art | Astro's own "Build your first Blog" sequential tutorial + Diátaxis usage already torn down | `research/C-tutorials/other-tutorial-ecosystems.md` |
| `guides.rubyonrails.org/getting_started.html` | Primary docs, live fetch | Canonical "build one real app across the whole guide" exercise-first pattern; 23-chapter numbered structure; explicit checkpoint prose ("Refresh … and you'll see …") | `research/C-tutorials/other-tutorial-ecosystems.md` |
| `svelte.dev/tutorial/kit/introducing-sveltekit` | Primary docs, live fetch | In-browser runnable-exercise checkpoint pattern; narrow-lesson chunking | `research/C-tutorials/other-tutorial-ecosystems.md` |
| `docs/site/_plan/02-information-architecture.md` | In-repo prior art | Records the **original "4-tutorial track" decision** (Q10: workspace → service → jobs → workflow; webhook = wave-2) and the nav-ladder design that wires tutorial chapters into 8 capability hubs | `analysis/C-tutorials/01-current-tutorial-inventory-and-gaps.md`, `context/C-tutorials/drift-candidates.md` |
| `docs/site/_plan/08-decisions-locked.md` | In-repo prior art | Locked tone/voice decisions (warm "we", no hype adjectives, no body emoji, "Alpha" maturity framing) that any rewritten tutorial prose must obey alongside `specs/01`'s locked positioning | `analysis/C-tutorials/03-docs-cut-logistics.md` |
| `docs/site/_data.ts` | In-repo prior art | The literal nav wiring: which tutorial chapter URL each of the 8 capability hubs links to as its "Quickstart" anchor — load-bearing for any URL/slug change during rewrite | `analysis/C-tutorials/03-docs-cut-logistics.md` |
| GitHub issue #232 (`rickylabs/netscript`) | Live `gh api` fetch | Current umbrella content — reveals #232 today is an **accuracy/coverage debt umbrella** (Run-2 grounding, DataGrid/Dropzone reference depth, telemetry doc gaps), not yet scoped for a ground-up rewrite | `analysis/C-tutorials/03-docs-cut-logistics.md` |
| `eis-chat` repo export (`docs/PRODUCT.md`, `ARCHITECTURE.md`, `PHASE-1..7-*.md`, `BUILD-PLAN.md`, `HANDOVER.md`, `docs/assets/*.png`) | Working reference, read-only | The real project backing the rewrite per D3; build order, seam map, writing-style reference | `analysis/C-tutorials/02-eis-chat-build-arc.md` |

## Resources named in the topic spec but not separately fetched (rationale)

- Individual competitor teardowns for NestJS/Encore/Hono/Laravel/Temporal/tRPC/Lume/TanStack already
  exist in-repo under `docs/site/_plan/research/competitors/` and are synthesized once in
  `doc-architecture-patterns.md` — re-fetching them live would duplicate work the repo already paid
  for. They are cited, not re-derived.
