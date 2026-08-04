# Plan: preserve StreamDB collection types through the NetScript wrapper

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-streamdb-wrapper-type-erasure--w5-v2` |
| Branch | `fix/streamdb-wrapper-type-erasure` |
| Phase | `plan-eval (composed)` |
| Target | `packages/fresh` — `@netscript/fresh/streams` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

`@netscript/fresh` is assigned Archetype 4 by doctrine. This slice changes one public factory
boundary used by the package's frontend stream DSL; it does not introduce another port, adapter,
builder, or runtime. `SCOPE-frontend` applies for consumer contract checking, while browser/route
gates are N/A because runtime and rendered behavior do not change.

## Current Doctrine Verdict

`@netscript/fresh`: **Restructure**. The historical builder-file and doc-lint debt entries are
resolved. This slice neither widens nor claims to close the package-wide verdict.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The published generic contract and compile fixture precede the implementation. |
| A2 | The documented wrapper remains the simple typed boundary; users need not drop to upstream. |
| A6 | No new helper abstraction is introduced. |
| A10 | The existing `createNetScriptStreamDB` composition root remains the only wiring point. |
| A14 | RED-first type evidence, consumer checking, doc lint, JSR audit, and publish dry-run enforce the contract. |

## Goal

Make the documented `createNetScriptStreamDB` query compile with the same full collection value
types inferred by direct `createStreamDB`, without changing runtime behavior.

## Scope

- Add one compile-time fixture containing the wrapper reproduction and direct-upstream control.
- Flow the supplied durable state schema generic through wrapper options, factory input, factory
  output, and returned collection types.
- Update the existing runtime test only as needed to use the now-sound factory contract.
- Compile-check the documentation's `query.from({ alias: db.collections.x })` shape.

## Non-Scope

- Multi-`from`, `unionAll`, row flattening, or other query result typing; the verifier refuted that
  allegation and issue #1235 excludes it.
- Runtime stream behavior, URL/auth resolution, event handling, lifecycle semantics, or dependency
  versions.
- Fresh routes, islands, rendering, browser behavior, or documentation prose changes.

## Hidden Scope

- `isolatedDeclarations` / no-slow-types safety at the published subpath.
- Existing alternate-factory test seam must agree with the same collection generic as upstream.
- The compile fixture must be part of the package check task while remaining excluded from publish.
- The foreign `deno.lock` entry must never be staged.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Reuse upstream exported `StreamStateDefinition`, `StateSchema`, and `StreamDB` types. | Wrap-don't-reinvent; the control already infers correctly. |
| D2 | Infer from the concrete state schema supplied to the wrapper and carry that same type through every wrapper layer. | Direct passthrough preserves the collection value conditional used upstream. |
| D3 | Preserve the wrapper's existing narrow runtime surface; only its `collections` member becomes upstream-typed. | Issue scope is wrapper generics only, with no runtime/API-behavior expansion. |
| D4 | One fixture contains both the documented wrapper call and direct `createStreamDB` control, plus value-type equality assertions. | A single compiler verdict proves isolation and parity. |
| D5 | Do not touch multi-source query typing. | Binding issue scope and verified refutation. |
| D6 | Record PLAN-EVAL and IMPL-EVAL as composed per `milestone-run.md` under orchestrator waiver D6; do not launch duplicate local formal evaluators. | Owner directive and milestone evaluator protocol. |
| D7 | Keep URL/auth/runtime schema validation byte-for-byte unless a compiler-required annotation is unavoidable. | No runtime behavior change. |
| D8 | Use explicit-path staging and explicit-refspec pushes; exclude the pre-existing `deno.lock` change. | Binding lock-hygiene and PR instructions. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Generic source | resolved now | Concrete supplied state schema, matching upstream. |
| Wrapper runtime surface | resolved now | Narrow surface retained; collection property indexes upstream `StreamDB`. |
| Test location | resolved now | `packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts`. |
| Multi-`from` behavior | safe to defer | Explicitly out of scope and not a defect. |
| Docs prose changes | safe to defer | Existing prose is correct once the fixture passes; no factual rewrite needed. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Reverse/mapped generic inference still collapses to `unknown`. | Infer directly from the concrete supplied state schema and assert exact value types. |
| Sound return type makes the factory mock invalid. | Have the runtime test's injected factory return the real upstream control while capturing input. |
| Public upstream type references trigger slow types/private refs. | Explicit aliases, full export-map doc lint, JSR audit, and package publish dry-run. |
| Fix accidentally changes runtime wiring. | Focused runtime test plus source diff review. |
| Unrelated lock state enters a commit. | Explicit-path staging and raw git verification after every slice. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | risk | Do not introduce a parallel collection type abstraction; index upstream types. |
| AP-14 | risk | Reference upstream types only for the wrapper contract; do not broadly re-export the upstream package. |
| AP-20 | clear | Existing `deno.unstable` lib remains untouched. |
| AP-25 | clear | No new effects; runtime composition remains unchanged. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| PLAN-EVAL | composed | `COMPOSED PER MILESTONE-RUN.MD (ORCHESTRATOR WAIVER D6)` in `plan-eval.md`; plan locked, implement same run |
| F-1–F-12, F-14–F-19 | yes | `quality:gate`, scoped wrappers, doc lint, JSR audit, and manual diff review per Archetype 4 matrix |
| F-13 | no | No saga/runtime behavior change. |
| Frontend contract check | yes | compile fixture containing documented wrapper query and direct control |
| Route/browser/state/responsive | no | no route, render, workflow, or visual change |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/fresh` package verdict | none | Existing verdict not widened or closed. |
| New debt | none expected | Any new slow type or doctrine violation blocks the slice. |

## Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S0 | Activate and lock the harness run | composed plan-gate checklist | `.llm/runs/fix-streamdb-wrapper-type-erasure--w5-v2/*` |
| S1 | Prove RED, then restore upstream collection inference through the wrapper | expected RED compile, then focused fixture + runtime test PASS | `packages/fresh/src/runtime/streams/create-stream-db.ts`; `packages/fresh/src/runtime/streams/create-stream-db_test.ts`; `packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts`; `packages/fresh/deno.json`; run artifacts |
| S2 | Prove published-package and doctrine readiness | scoped check/lint/fmt, `quality:gate`, doc lint, JSR audit, publish dry-run, diff/lock hygiene | run artifacts only unless a gate exposes a scoped fix |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED-first | focused `deno check --unstable-kv` of the new fixture before source fix | non-zero on wrapper query/type assertion; direct control has no diagnostic |
| 2 | Focused type | same focused check after source fix | exit 0 |
| 3 | Runtime | focused `deno test` for `create-stream-db_test.ts` | PASS |
| 4 | Package static | scoped check/lint/fmt wrappers over `packages/fresh` | zero diagnostics/findings |
| 5 | Doctrine | `deno task quality:gate` | exit 0; no new ignore/cast |
| 6 | Docs | `deno task doc:lint --root packages/fresh --pretty` | zero diagnostics over full export map |
| 7 | JSR | package JSR audit script | PASS; no new slow-type finding |
| 8 | Publish | package `deno publish --dry-run --allow-dirty` | PASS; fixture excluded |
| 9 | Hygiene | raw git diff/status and commit-range scans | only owned files committed; no `deno.lock` churn |

## Dependencies

- Existing `@durable-streams/state@^0.3.1` and TanStack DB types only; no dependency changes.

## Drift Watch

- Any need to alter runtime code, dependency versions, lifecycle behavior, docs prose, or query
  result typing beyond the wrapper generic is significant drift and requires a stop/rescope.
