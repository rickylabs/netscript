# Worklog: StreamDB wrapper type preservation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-streamdb-wrapper-type-erasure--w5-v2` |
| Branch | `fix/streamdb-wrapper-type-erasure` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `createNetScriptStreamDB(options)` remains the single framework factory.
- `NetScriptStreamDBOptions<TState>` carries the exact supplied durable state schema.
- `NetScriptStreamDB<TState>.collections` indexes the corresponding upstream `StreamDB<TState>`
  collection map while retaining the existing optional lifecycle hooks.
- No builder chain, method order, route API, or runtime entrypoint changes in this slice.

### Domain Vocabulary

- `TState extends StreamStateDefinition` — concrete schema object supplied by the caller.
- `NetScriptStateSchema<TDef>` — public alias for upstream `StateSchema<TDef>`.
- `NetScriptStreamDB<TState>` — narrow wrapper handle with upstream-typed collections.
- `NetScriptStreamDBFactory<TState>` — existing test/adapter port whose input and output share
  the same state generic.

### Ports

- `NetScriptStreamDBFactory<TState>` — existing injected factory seam retained to capture resolved
  transport input and permit alternate compatible adapters; no new port.

### Constants

- None. The slice introduces no finite domain vocabulary or new runtime values.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S0 | Activate and lock the harness run | composed plan-gate checklist | run directory |
| S1 | RED fixture + wrapper generic parity | focused compile and runtime test | wrapper, test, type fixture, package check task, run evidence |
| S2 | Published-package and doctrine evidence | scoped wrappers, quality, doc lint, JSR audit, dry-run, hygiene | run evidence |

### Deferred Scope

- Multi-source query/row typing — verifier-refuted and explicitly excluded by issue #1235.
- Runtime/lifecycle redesign — no runtime behavior change is authorized.
- Visual/browser validation — no rendered surface changes.

### Contributor Path

Future stream wrapper type changes start at
`packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts`, keep the direct upstream control in
the same fixture, then update only `src/runtime/streams/create-stream-db.ts` and run the package's
full published-surface gates.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 15:59 CEST | S0 | bootstrap | Read live issue first, re-baselined at exact `origin/main`, selected A4 + frontend overlay, and locked D1–D8. |
| 2026-08-04 16:08 CEST | S1 | RED | Consumer-config compile exited 1 with two wrapper-only diagnostics: the documented `query.from` collection value and `.get()` result were `unknown`; the direct `createStreamDB` control compiled in the same fixture. |
| 2026-08-04 16:14 CEST | S1 | GREEN | Indexed the wrapper collection map from upstream `StreamDB<StateSchema<TDef>>`; the same fixture exited 0 and the focused runtime wiring test passed 1/1. |
| 2026-08-04 18:15 CEST | S2 | static/publish | Package check, scoped TypeScript check/lint/fmt, quality gate, 207 package tests, and publish dry-run passed. Full doc/JSR scans retained package baseline debt and added four upstream npm private-type references. |
| 2026-08-04 18:24 CEST | S2 | CI diagnosis | CI's merge ref recompiled the consumer fixture under an older root TanStack graph and failed both wrapper and upstream control. During diagnosis `origin/main` advanced to aligned React DB/DB versions; the attempted `.mts` isolation was superseded and discarded. A new head commit triggers a clean merge-ref run without dependency churn in this PR. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Upstream type indexing, not a local collection map | Restores proven inference and obeys wrap-don't-reinvent. | plan D1–D3; upstream source |
| One fixture for wrapper and control | Makes the isolation claim mechanically reviewable. | issue acceptance; plan D4 |
| Formal evaluation composed | Avoid duplicate local evaluators inside the milestone run. | milestone-run evaluator protocol; owner D6 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Foreign queue entry already present in `deno.lock` | minor | yes |
| Local formal evaluator replaced by milestone composition | minor/process | yes |
| Consumer fixture isolates one TanStack DB package identity | minor/process | yes |
| Full package doc/JSR baselines are non-zero | minor/process | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED-first fixture | `deno check --no-lock --config packages/fresh/tests/type-fixtures/streamdb-consumer-deno.json --unstable-kv packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts` | PASS | RED exit 1 with two wrapper-only diagnostics; GREEN exit 0 |
| Scoped check/lint/fmt | repo wrapper family over `packages/fresh` TS/TSX plus dedicated consumer fixture | PASS | zero findings |
| Doc lint | `deno task doc:lint --root packages/fresh --pretty` | BASELINE_FAIL | 40 existing package errors plus four upstream npm private-type refs; no missing JSDoc added |
| Publish dry-run | `deno publish --dry-run --allow-dirty` from `packages/fresh` | PASS | slow-types phase and package simulation completed; fixtures excluded |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1–F-12, F-14–F-19 | PASS_WITH_BASELINE | scoped static gates, `quality:gate`, JSR audit, dry-run | JSR audit retains two unrelated module-tag failures; no new ignore or local type fork |
| F-13 | N/A | no runtime behavior change | runtime invariants unaffected |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Focused wrapper wiring test | `deno test --config packages/fresh/deno.json --unstable-kv --allow-env packages/fresh/src/runtime/streams/create-stream-db_test.ts` | PASS | 1 passed; URL/auth/schema/lifecycle seam retained |
| Browser/route/render gates | N/A | source boundary | no rendered workflow change |
| Full package tests | PASS | `deno task test` | 207 passed, 0 failed |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Documented StreamDB query | PASS | S1 compile fixture | exact `query.from({ person: wrapped.collections.people })` shape |
| Direct upstream control | PASS | S1 compile fixture | compiled in the same RED and GREEN fixture |

## Handoff Notes

- Review the compile fixture first: it must contain both the failing wrapper call and the passing
  direct upstream control, with no multi-`from` code.
