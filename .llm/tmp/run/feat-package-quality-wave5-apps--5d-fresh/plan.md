# Wave 5d umbrella plan — `@netscript/fresh` final target architecture

Status: SUPERVISOR TARGET (binding on all sub-plans). Author: Wave 5 supervisor
session (Fable 5), 2026-06-12. Every 5d sub-plan (5d1..5d6) derives from this
document; divergence is a drift entry escalated to the umbrella, never a silent
rescope. Final cut confirmed at each sub-gate's Plan Gate via MEASURE-FIRST.

## Mission

`@netscript/fresh` is the piece that ties NetScript together: one DSL and API
set usable on the server side and the client side, E2E typesafe and E2E
telemetry-instrumented, borrowing best-in-class features from the market
(TanStack Start, Next.js App Router, Remix/React Router data APIs, SolidStart)
and offering the absolute best DX possible. Benchmark for every design
decision: "would a create-next-app / TanStack Start user feel a downgrade?"

## Archetype

Primary: **Archetype 3 — Runtime/Behavior** with the **SCOPE-frontend**
overlay. Cluster nuances:

- 5d1 (support spine) behaves like Archetype 4 utilities but inherits the
  package-level A3 gate matrix.
- 5d2 (builders) and 5d5 (form) add the A4-Browser obligation: validation on
  real routes in `apps/playground` (and/or a fixture app), not just unit tests.
- 5d3/5d4/5d6 are A3 proper: runtime/Aspire validation, consumer-import test,
  abort/cleanup tests.

## Final public surface (F-16 lock)

The 12 existing subpaths are RETAINED; the only sanctioned surface growth is
`./testing` (→ 13 entrypoints):

`.` (curated root, no kitchen-sink) · `./server` · `./builders` · `./route` ·
`./defer` · `./form` · `./error` · `./utils` · `./streams` · `./query` ·
`./interactive` · `./vite` · **`./testing` (new, 5d1 scaffolds, all units
extend)**.

Changing an export specifier, renaming a public type, or adding a dependency
requires an umbrella drift entry + supervisor review BEFORE implementation.

## Final folder shape (target)

```
packages/fresh/
  deno.json            # single config; tasks: check/test/doc-lint/fmt/lint/dry-run
  mod.ts server.ts interactive.ts testing.ts
  builders/            # define-page decomposed under F-1 caps:
    define-page/       #   builder/runtime/navigation/types split further;
    define-partial.tsx #   no file > layer cap; _internal/ for non-public helpers
  route/               # contract.ts + manifest.ts + mod.ts decomposed
  defer/               # DeferPage/DeferIsland/Deferred + policy
  streams/             # over plugin-streams(-core); co-designed with defer
  form/                # RFC 15; consumes fresh-ui form seams (form-field, control-props)
  query/               # RFC 17 island bridge over sdk query factories
  error/               # taxonomy + handler + ErrorDisplay (absorbs components/)
  utils/
  config/              # vite.ts (./vite)
  telemetry (cross-cutting): one shared convention, not per-cluster telemetry.ts forks
  docs/                # README.md mirror, getting-started.md, architecture.md (ADRs),
                       # concepts.md, recipes/, reference/ — in publish include
  tests/               # consolidated + _fixtures/docs-examples_test.ts (doctests)
```

Dissolutions decided at 5d1 Plan Gate (default position stated):
- `components/ErrorDisplay.tsx` → into `error/` (it is the error surface's view).
- `hooks/use-promise.ts` → into the `interactive` seam's backing module.
- per-cluster `telemetry.ts` (defer, form) → one shared telemetry convention
  (utils or a `_internal/telemetry.ts`), names aligned with the rest of
  NetScript's E2E telemetry story.

## Quality bar (final output, all units summed)

- doc-lint **0** over ALL exports combined (baseline 276 at `dfab7a4`; root
  barrel undercounts — always measure combined).
- **0** over-cap files (baseline 13; F-1 per-layer caps).
- **0** private-type-refs; `deno publish --dry-run` PASS incl. slow types.
- README ≥150 lines, doctested via `tests/_fixtures/docs-examples_test.ts`;
  docs scaffold complete per `.llm/harness/lessons/package-quality-archetype.md`
  items 6–7.
- Every stream/SSE/defer surface has abort + cleanup tests (AbortSignal
  propagation provable).
- RFC 14 (unified mode) seams audited and protected — NOT implemented.
- Package lifted into root quality gates at 5d6 close (today `fresh` is the
  last `packages/` exclusion besides `cli`).

## Accepted drift tolerance

- ±2 slices per sub-plan vs the proposal at its Plan Gate (re-measured
  MEASURE-FIRST numbers win).
- Folder moves INSIDE the package are free while export specifiers and public
  type names are unchanged.
- 5d2 may split into two locked plans (it is the heaviest cluster) without
  umbrella escalation.
- Anything else touching the public surface, deps, or cross-cluster contracts:
  umbrella drift entry first.

## Sequencing & branch model

```
feat/package-quality-wave5-apps                       (Wave 5 umbrella, PR #17)
  └─ feat/package-quality-wave5-apps-5d-fresh         (5d umbrella, this run dir)
       ├─ …-5d1-support    PR #34   (PLAN may run in parallel)
       ├─ …-5d2-builders   PR #35
       ├─ …-5d3-route      PR #36
       ├─ …-5d4-streaming  PR #37
       ├─ …-5d5-form       PR #38
       └─ …-5d6-query      PR #39
```

All six fork from the same head (`c64cb16`, post-5c reconcile). PLAN phases
run in parallel; IMPLEMENTATION is a chain 5d1→…→5d6 — each implementation
merges the prior sub-gate's landing into its branch before starting. 5d1's
conventions (error taxonomy, telemetry, docs scaffold, `./testing`, task
layout) are binding on 5d2–5d6.

## Evaluation protocol

Per sub-gate: PLAN (generator session) → plan review by Fable 5 on the sub-PR
→ PLAN-EVAL (separate session) → IMPLEMENTATION (generator session) →
IMPL-EVAL (separate session) → merge `--no-ff` into the 5d umbrella by the
supervisor/user. The 5d umbrella merges into the Wave 5 umbrella once, at 5d
completeness.
