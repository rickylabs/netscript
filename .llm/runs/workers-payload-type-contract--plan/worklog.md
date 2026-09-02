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
- Native evaluator launch session `ece26f81-5475-4026-9d25-34b5826028e0` observed model
  `fable-5` but failed before evaluation with `unrecognized_model`; it produced no artifact or
  plan work.
- Before the fallback launched, the owner explicitly accepted plan commit `f655c3405` and directed
  implementation to proceed without PLAN-EVAL. No evaluator produced a verdict or changed files.
- Owner-set next step: commit the defect-specific consumer-site RED proof, push it immediately, then
  implement the smallest complete id-to-payload binding increment within the one-hour SLO.

### 2026-09-02 — RED consumer proof

- Added `packages/plugin-triggers-core/src/builders/enqueue-job-payload-contract_test.ts` with two
  jobs whose handler parameter types independently establish `EmbedDocumentPayload` and
  `TranscribeImagePayload` using APIs that compile on the baseline.
- The positive `embedDocument` enqueue compiles. The negative call selects `transcribeImage` and
  passes the already-valid `embedPayload` value; its directive is attached only to that payload
  property.
- RED command: `deno check --unstable-kv
  packages/plugin-triggers-core/src/builders/enqueue-job-payload-contract_test.ts`.
- RED result: exit 1 with exactly `TS2578 Unused '@ts-expect-error' directive` at the wrong-job
  payload property. There is no arity, import, job-construction, or unrelated type failure.
- Why this proves #1455: baseline `build()` erases each handler payload and `enqueueJob` infers its
  independent payload generic from `options`, so the wrong payload is accepted. GREEN must make the
  selected definition the only inference source, consuming this same directive.
- First implementation / RED commit: `8e7cf697c`.
- Draft PR: https://github.com/rickylabs/netscript/pull/1938

## Commit receipts

| Slice | SHA | Evidence |
| --- | --- | --- |
| Contract plan | `f655c3405` | `plan.md` committed alone, before source/type edits |
| RED consumer proof | `8e7cf697c` | Targeted check fails only because `@ts-expect-error` is unused |
| GREEN implementation | pending | Same directive must be consumed by the job-id payload mismatch |

## Gate receipts

No implementation gates have run yet. The plan artifact passed `git diff --check` before commit.

## Blockers

None. The owner explicitly waived PLAN-EVAL and accepted `f655c3405` as authoritative.
