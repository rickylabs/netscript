# Workers payload type contract — worklog

## Design

- Run profile: `complex_implementation`.
- Doctrine archetypes: workers-core and triggers-core are Archetype 3; workers plugin is Archetype 5.
- Contract authority: `plan.md` at commit `f655c3405`.
- Design invariant: a single application-owned Standard Schema must carry each literal job id's
  payload type through definition, generated registry, producer APIs, and consumer validation.
- Runtime boundary: validation occurs immediately before application handler invocation; enqueue,
  persistence, scheduling, retry, correlation, and result semantics stay unchanged.
- Explicit breaks: schema-less `.payload<T>()`, one-argument `defineJobHandler(handler)`, unsafe
  invocation from an uncorrelated heterogeneous registry, and mismatched producer payload calls.
- Explicit non-goals: #1451 operational-metadata redesign, a consumer compatibility shim, and task
  or workflow payload parity.

## Progress

### 2026-09-02 — contract plan

- Confirmed baseline `ec848e6b0334ec8fcd2bc66ba009305d35367b01` and branch
  `feat/workers-payload-type-contract`.
- Preserved the earlier `deno doc` investigation and wrote the exact published-surface contract to
  `plan.md` before changing any TypeScript.
- Plan commit: `f655c3405` (`docs(workers): lock payload type contract plan`).
- Pushed the explicit refspec and opened draft PR #1938.
- PR phase is `status:plan`; milestone is `0.0.7`; requested type/area/priority/orchestrator labels
  are applied.
- Prepared the supervisor identity, research record, context pack, and drift log for evaluator
  handoff.
- Selected the canonical fresh evaluator route: Anthropic Fable 5, medium effort
  (`formal_plan_evaluation`).
- Next: obtain independent PLAN-EVAL PASS before the RED test commit.

## Commit receipts

| Slice | SHA | Evidence |
| --- | --- | --- |
| Contract plan | `f655c3405` | `plan.md` committed alone, before source/type edits |
| RED consumer proof | pending | Must fail only because `@ts-expect-error` is unused |
| GREEN implementation | pending | Same directive must be consumed by the job-id payload mismatch |

## Gate receipts

No implementation gates have run yet. The plan artifact passed `git diff --check` before commit.

## Blockers

None. Implementation is intentionally held at the PLAN-EVAL gate.
