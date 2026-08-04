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

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED-first fixture | focused compiler | NOT_RUN | S1 |
| Scoped check/lint/fmt | repo wrapper family | NOT_RUN | S2 |
| Doc lint | full `packages/fresh` export map | NOT_RUN | S2 |
| Publish dry-run | package task/raw package command | NOT_RUN | S2 |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1–F-12, F-14–F-19 | NOT_RUN | S2 | A4 required set |
| F-13 | N/A | no runtime behavior change | runtime invariants unaffected |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Focused wrapper wiring test | NOT_RUN | S1 | URL/auth/schema behavior must remain unchanged |
| Browser/route/render gates | N/A | source boundary | no rendered workflow change |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Documented StreamDB query | NOT_RUN | S1 fixture | exact `query.from` shape |
| Direct upstream control | NOT_RUN | S1 fixture | must compile in same fixture |

## Handoff Notes

- Review the compile fixture first: it must contain both the failing wrapper call and the passing
  direct upstream control, with no multi-`from` code.
