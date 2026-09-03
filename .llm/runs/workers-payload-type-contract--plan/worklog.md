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

### 2026-09-02 — bounded GREEN payload carrier

- Added `TPayload`/`TResult` defaults to the root workers `JobDefinition` and preserved them through
  `JobBuilder.build()`.
- Added optional package-owned `JobPayloadSchema<TPayload>` to make the payload generic a structural
  carrier without invalidating legacy definition values.
- Bound trigger-core `EnqueueJobAction.job` to its payload generic and made `enqueueJob` infer the
  payload from the selected definition while checking options through `NoInfer`.
- No runtime expression or returned enqueue action field changed.
- GREEN command: `deno check --unstable-kv
  packages/plugin-triggers-core/src/builders/enqueue-job-payload-contract_test.ts`.
- GREEN result: exit 0; the same negative directive is now consumed by the wrong-job payload error.
- GREEN commit: `4903a6afc` (`feat(workers): bind enqueue payload to job definition`).
- Final product head for this bounded implementation: `4903a6afc`; the following commit is
  evidence-only run/plan documentation.

### 2026-09-02 — PLAN-EVAL advisories and bounded gates

- The Fixes-lane supervisor reported a separate-session `PASS_PLAN` for plan commit `f655c3405`
  using `qwen/qwen3.8-flash`.
- Advisory 1 confirmed: the existing post-handler-set `this` guard on `payload()` remains present;
  the bounded GREEN did not alter that method.
- Advisory 2 decided in `plan.md` §1: typed `triggerJob` requires a known non-undefined payload;
  `EnqueueJobOptions.payload` stays optional for the existing no-payload enqueue state, but any
  supplied value is bound to the selected definition.
- Advisory 3 applied: the contract-factory rationale now says emitted payloads are constrained to
  the route's record domain rather than claiming the narrowing is “proven safe.”
- Exact gated head: `4903a6afcc44cb050cdbbd51f066845ed99feb23`.
- Scoped check: exit 0; 373 TypeScript/TSX files selected across
  `packages/plugin-workers-core`, `packages/plugin-triggers-core`, `plugins/workers`, and
  `plugins/triggers`; 4/4 batches passed with `--unstable-kv`, 0 diagnostics.
- Focused test wrapper: exit 0; `enqueue-job-payload-contract_test.ts` passed 1/1 with 0 failures.
- Scoped lint: exit 0; 373/373 files processed, 0 findings.
- Scoped format check: exit 0; 373/373 files processed, 0 findings.

### 2026-09-02 — hosted MCP export-corpus freshness repair

- Hosted `Code quality › MCP export corpus freshness` job `100334821218` reported the generated
  export corpus stale after the workers public-surface change.
- Ran only the canonical writer: `deno task gen:mcp-export-corpus`.
- The generator changed only
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` (5 additions,
  5 deletions); the file was not hand-edited.
- Generated provenance: SHA-256
  `c48a1a3e0a8024ed491605f28c7b0ebcc4eb2d03d90d0977ef2e563eecccd5bf`, 35 packages, 272
  subpaths, 7,803 symbols, 2,185,965 uncompressed bytes, 316,598 compressed bytes.
- Freshness verification: `deno task check:mcp-export-corpus` exited 0 at pre-commit head
  `6e546515c34f66f7deafbb684a6d0e4808a059b9`.

## Commit receipts

| Slice | SHA | Evidence |
| --- | --- | --- |
| Contract plan | `f655c3405` | `plan.md` committed alone, before source/type edits |
| RED consumer proof | `8e7cf697c` | Targeted check fails only because `@ts-expect-error` is unused |
| GREEN implementation | `4903a6afc` | Same directive is consumed by the job-id payload mismatch; focused check and test pass |

## Gate receipts

| Gate | Head | Result |
| --- | --- | --- |
| Scoped `run-deno-check.ts` (4 roots, `ts,tsx`, unstable KV) | `4903a6afc` | PASS — 373 files, 0 diagnostics |
| Focused `run-deno-test.ts` | `4903a6afc` | PASS — 1/1 |
| Scoped `run-deno-lint.ts` (4 roots, `ts,tsx`) | `4903a6afc` | PASS — 373 files, 0 findings |
| Scoped `run-deno-fmt.ts` (4 roots, `ts,tsx`) | `4903a6afc` | PASS — 373 files, 0 findings |
| `deno task check:mcp-export-corpus` | `6e546515c` + regenerated carrier | PASS — 35 packages, 272 subpaths, 7,803 symbols |

No pre-existing or introduced failures appeared in this bounded gate set.

## Blockers

None. The owner explicitly waived PLAN-EVAL and accepted `f655c3405` as authoritative.

## IMPL-EVAL (separate session) — PASS_IMPL

`z-ai/glm-5.3-flash` (xhigh, OpenRouter) returned **PASS_IMPL at `6e546515c`**, noting the
post-brief advance to `28401b6c3` is generator output only (corpus regeneration + this worklog).
Evaluator flagged that `plan-eval.md` was absent from the run dir; the recorded PASS_PLAN verdict for
`f655c3405` is now committed as `plan-eval.md`. Remaining #1455 slices stay unclaimed (`Refs #1455`).
