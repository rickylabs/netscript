# Wave 5 — Sub-Wave Split Strategy

Umbrella: `feat/package-quality-wave5-apps` → track `feat/package-quality` (merges **once**, at
full Wave 5 completeness). Sub-branches fork off the prior sub-wave's merge into the umbrella.

> **UNBLOCKED @ `dfab7a4`** (2026-06-10): Wave 4 merged to track (`f0e1441`), reconciled into this
> umbrella, re-baseline confirmed (`research.md` §0.5 — 328 doc-lint / 138 ptr unchanged; all 4
> `deno check` PASS). 5a (service) is ready to open. The `fresh` 5d cut below is still a proposal —
> the generator re-measures per-cluster doc-lint at MEASURE-FIRST and the Plan Gate confirms it.

> Authority: this is the SUPERVISOR proposal. The **locked** slice authority is each sub-wave
> `plan.md` once written + PLAN-EVAL'd. The `fresh` internal split is decided at its Plan Gate
> from the generator's MEASURE-FIRST doc-lint budget, not here.

## Why split (the <30-slice Plan-Gate cap)

171 src files, ~23.4k LOC, 328 doc-lint errors, 20 slow-type fixes, 20 over-cap decompositions,
2 net-new test suites, 4 docs scaffolds, 4 `./testing` entrypoints. `fresh` alone (276 doc-lint,
13 over-cap, multi-archetype, 13.2k LOC) blows the cap several times over. One plan = impossible.

## Dependency order

```
service (foundational, standalone)
   │
   ▼
sdk (consumed by fresh/query, fresh/streams; depends on kv/config from W2/W1)
   │
   ├─────────────► fresh-ui (mostly standalone UI; form seams consumed by fresh/form)
   │                   │
   ▼                   ▼
fresh (consumes sdk + fresh-ui form seams; the long pole — splits internally)
```

`service` first (smallest, isolates the Hono builder, no intra-wave deps). `sdk` before `fresh`
(fresh/query + fresh/streams consume it). `fresh-ui` before `fresh` (fresh/form consumes its form
seams). `fresh` last and split.

## Proposed sub-waves

| Sub-wave | Branch suffix | Units | Archetype | Why grouped | Rough load |
|----------|---------------|-------|-----------|-------------|-----------|
| **5a** | `wave5-apps-5a-service` | `@netscript/service` | A4 (+A3 health) | Smallest; greenfield metadata + 8 slow-types + 2 over-cap + README-from-zero + tests-from-zero. Good calibration unit. | S–M |
| **5b** | `wave5-apps-5b-sdk` | `@netscript/sdk` | A3 (+A4) | Transport/cache/query core; 12 subpaths (F-16/F-18); RFC 14 transport seam; RFC 17 query-client/collections; 0 tests. | M–L |
| **5c** | `wave5-apps-5c-fresh-ui` | `@netscript/fresh-ui` | A4 Browser | Independent of fresh; 6 slow-types in `.tsx` return types; registry/manifest (CLI dep); Browser validation. | M |
| **5d** | `wave5-apps-5d-fresh-*` | `@netscript/fresh` | A4+A3 Browser | The long pole — **splits internally** (below). | XL (multi) |

### 5d — `fresh` internal split (decide exact cut at Plan Gate)

`fresh` cannot be one sub-wave. Proposed per-entrypoint-cluster sub-sub-waves, dependency-ordered
(support → builder → runtime → app):

| Cut | Entrypoints | Archetype | Notes |
|-----|-------------|-----------|-------|
| **5d-1** | `error` `utils` `config/vite` `interactive` + `mod.ts` skeleton | A4/support | Smallest cluster; establishes the package's doctrine spine (docs/, ./testing, tasks) the rest inherit. |
| **5d-2** | `builders` (`definePage`) | A4 Browser | The 1111+1098+712+667+575 over-cap cluster — heaviest decomposition. May itself need 2 plans. |
| **5d-3** | `route` | A3 | 756+601+464 over-cap; route manifest/contract runtime. |
| **5d-4** | `defer` + `streams` | A3 streaming | RFC 13 PSR + RFC 16 e2e; **gated on Wave 4 streams surface** (§8 research). |
| **5d-5** | `form` | A4 | RFC 15; 577+519+475 over-cap; consumes fresh-ui form seams (5c done). |
| **5d-6** | `query` + `server.ts` + final root barrel | A3 | RFC 17 island bridge; consumes sdk/query-client (5b done); final `defineFreshApp` surface + unified-mode seam audit. |

**5d split is a recommendation.** The generator re-measures doc-lint per cluster at MEASURE-FIRST
and the Plan Gate confirms whether clusters merge or split further (e.g. 5d-2 splitting). Each
cut stays under the <30-slice cap and lands a coherent, independently-gateable entrypoint set.

## PLAN-EVAL convention

Option A (one PLAN-EVAL over the combined sub-wave plan), per the Wave 2/4 cadence. For 5d, each
sub-sub-wave gets its own PLAN-EVAL + IMPL-EVAL (separate sessions). Evaluator ≠ generator.

## Branch / PR model

```
feat/package-quality                      (track)
└── feat/package-quality-wave5-apps        (umbrella; Draft PR → track, BLOCKED on Wave 4)
    ├── …-5a-service        → PR → umbrella
    ├── …-5b-sdk            → PR → umbrella (forks off 5a merge)
    ├── …-5c-fresh-ui       → PR → umbrella (forks off 5b merge)
    └── …-5d-fresh-{1..6}   → PRs → umbrella (chain, fork off prior merge)
```

Each sub-branch: own worktree + own nested run dir (`feat-package-quality-wave5-apps--<suffix>`)
+ own Draft PR → umbrella, merged `--no-ff`. Umbrella → track once, at full Wave 5 completeness.

## Gate sets (from `gates/archetype-gate-matrix.md`)

- **All units:** F-1 (per-layer caps), F-5 surface, **F-6 publishability (currently RED on all 4 —
  fix slow types first)**, F-7 doc-score, F-11 forbidden-folder, F-16 cardinality, F-17 abstract
  co-location, F-18 sub-barrel; full-export doc-lint; docs/ scaffold; doctested README ≥150;
  `./testing` entrypoint; task hygiene.
- **A3** (sdk, fresh route/defer/streams/query): **F-13 + Runtime/Aspire validation required**;
  consumer-import required; defensive abort/cleanup tests.
- **A4** (service core, fresh builders/form): F-13 n/a or subtype.
- **A4 Browser** (fresh-ui, fresh builders/interactive): **Browser/real-route validation
  required** (validate against `apps/playground` routes).
- **F-16/F-18 special attention:** the 12-subpath sdk + fresh — every subpath justified or folded.
