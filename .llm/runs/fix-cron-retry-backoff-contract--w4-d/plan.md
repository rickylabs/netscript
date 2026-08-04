# Plan: cron retry/backoff contract

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cron-retry-backoff-contract--w4-d` |
| Branch | `fix/cron-retry-backoff-contract` |
| Phase | `plan` (locked) |
| Target | `packages/cron` + `docs/site/data-persistence/kv-queues-cron.md` |
| Archetype | `2 — Integration` |
| Scope overlays | `docs` |

## Archetype

Archetype 2 is authoritative: `@netscript/cron` owns a scheduler port and two technology adapters
(memory and native `Deno.cron`). Although retry is runtime behavior, the package does not own the
stateful supervised runtime shape required for Archetype 3. Retry policy folds into the existing
shared adapter execution seam.

## Current Doctrine Verdict

`Refactor` — the recorded `interfaces/`→`ports/` and adapter naming debt is already closed. This PR
does not reopen structural work; it adds policy and deterministic tests within the existing adapter
shape.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | The already-published option and attempt semantics are locked before implementation. |
| A6/A7 | Shared retry policy is justified NetScript policy; abortable waits use `@std/async`. |
| A8/A9 | Policy stays in the shared adapter boundary appropriate to Archetype 2. |
| A13 | Handler failures, retry exhaustion, and cancellation remain explicit terminal outcomes. |
| A14 | RED-first, fake-time, provider-parity, consumer, JSR, and fitness gates preserve the contract. |

## Goal

Make the stable cron retry/backoff options truthful across memory and native Deno providers, expose
zero-based attempt numbers to handlers, preserve shutdown cancellation during waits, and document
exact retry/event semantics.

## Scope

- Lock `maxRetries` as retries after the initial attempt (`total attempts = maxRetries + 1`).
- Apply fixed, exponential, and linear waits with optional caps.
- Pass `attempt = 0…maxRetries` to contextual handlers.
- Preserve one terminal listener event and one `runCount` increment per scheduled invocation.
- Use abortable waits and stop retrying immediately when the job signal is aborted.
- Add deterministic fake-time coverage for both existing adapters.
- Correct the manual and public JSDoc; reconcile the stale issue provider wording before close-gate.

## Non-Scope

- Queue and worker task-runtime retry policies.
- A new Deno KV cron adapter; none exists today and adding one is a separate integration feature.
- Cron expression/next-fire calculations, concurrency serialization, or overlapping-run policy.
- Structural Archetype 2 refactoring already tracked/closed elsewhere.

## Hidden Scope

- The `packages/plugin-triggers-core` consumer copies cron attempts into trigger events and needs a
  compile/targeted-test consumer gate.
- Event cardinality is compatibility-sensitive; per-attempt listener events would silently multiply
  telemetry/error notifications.
- The pre-existing `deno.lock` edit is foreign and must never enter a commit.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Implement, do not remove/deprecate, the stable retry contract. | Real consumers read `attempt`; the manual and public types already promise recovery policy. Removal is breaking and unnecessary. |
| D2 | `maxRetries` counts retries after attempt 0. Default is 0. | Matches the option name, queue precedent, and the issue's requested meaning; total calls are `maxRetries + 1`. |
| D3 | Fixed = `initialDelay`; exponential = `initialDelay * (multiplier ?? 2)^(retryNumber-1)`; linear = `initialDelay * retryNumber`; `maxDelay` caps every policy. | Makes all published fields deterministic and gives each documented policy a conventional meaning. |
| D4 | Listener/history semantics are aggregate: one terminal `jobRun` or `jobError` per scheduled invocation; `result.attempt` is the terminal handler attempt; `runCount` counts invocations. | Preserves existing event cardinality and avoids duplicate consumer telemetry while still exposing every attempt to the handler. |
| D5 | Backoff waits are `@std/async` delays bound to the registration `AbortSignal`; abort ends the invocation without another handler call. | Preserves stop/unschedule behavior and makes fake-time cancellation deterministic. |
| D6 | Provider parity means the two existing providers: memory and native `Deno.cron`. | Source has no Deno KV cron provider. Inventing one would materially rescope the issue. |
| D7 | No new public export. Existing type JSDoc and the manual carry the clarified contract. | Avoids an unnecessary clock/policy abstraction on the published surface; `FakeTime` provides the deterministic seam. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Implement vs remove | resolved now | Locked by D1. |
| Per-attempt vs aggregate events | resolved now | Locked by D4 from compatibility evidence. |
| Deno KV wording mismatch | resolved now | Correct to the native Deno provider; no new adapter. |
| Validation of malformed numeric policy values | safe to defer | Do not broaden contract beyond the issue; deterministic semantics cover valid published shapes. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Retry loop emits duplicate events or increments invocation history per attempt. | Aggregate terminal assertions for success and exhaustion on both providers. |
| `stop()` leaves a backoff timer or triggers another attempt. | Abort-bound delay plus fake-time cancellation test asserting no second call. |
| Deno provider tests accidentally register real cron work. | Stub `Deno.cron` and invoke the captured callback under `FakeTime`. |
| Policy math is off by one. | Table-driven fixed/exponential/linear timestamp assertions with zero-based handler attempts. |
| Existing consumers interpret `attempt` differently. | Preserve zero-based JSDoc and compile/test plugin-triggers-core mapping. |
| Foreign lock edit contaminates commits. | Explicit path staging, raw `git status`/diff checks before every commit, never stage `deno.lock`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Use `@std/async` abortable delay; local code only computes NetScript policy. |
| AP-9 | risk | One shared policy applier, no provider flags or divergent retry loops. |
| AP-10 | risk | Catch only at the scheduler crash boundary; never swallow terminal failure silently. |
| AP-12/AP-25 | risk | Production waits use the adapter edge; deterministic tests use `FakeTime`; no new non-edge clock effects. |
| AP-17 | closed baseline debt | Do not disturb the existing `ports/` remediation. |

## Fitness Gates — Archetype 2 full column

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1 file size | yes | `quality:gate` / manual changed-file review |
| F-2 helper reinvention | yes | `quality:gate`; `@std/async` used for waits |
| F-3 layering | yes | `quality:gate` / `arch:check` |
| F-4 inheritance | yes | `quality:gate` / no inheritance diff |
| F-5 public surface | yes | `deno doc` + full export-map doc-lint |
| F-6 JSR publishability | yes | package publish dry-run |
| F-7 doc score | yes | full export-map doc-lint + JSR audit |
| F-8 workspace lib | yes | `quality:gate` / existing `deno.unstable` retained |
| F-9 permissions | yes | manual README/implementation audit; no new permission |
| F-10 test shape | yes | `quality:gate` + changed test LOC review |
| F-11 forbidden folders | yes | `quality:gate` / `arch:check` |
| F-12 naming | yes | `quality:gate` / lint |
| F-14 console | yes | `quality:gate`; no console added |
| F-15 upstream re-export | yes | `quality:gate`; no export added |
| F-16 folder cardinality | yes | `arch:check` |
| F-17 abstract co-location | yes | `arch:check` / N/A by no abstract changes |
| F-18 sub-barrels | yes | `arch:check` / no barrel changes |
| F-19 scoped runners | yes | scoped check/lint/fmt wrappers over `packages/cron` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/cron — AP-17` | none | Already closed; no new/deepened doctrine debt expected. |

## Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S0 | Lock research/design and activate the draft review surface. | Plan-gate checklist composed per milestone-run.md (orchestrator waiver). | run-dir artifacts |
| S1 | Prove the dead contract RED against configured retry on memory and captured native Deno callbacks. | Focused test exits non-zero because only attempt 0 runs. | new/updated `packages/cron/tests/*retry*`; worklog/context |
| S2 | Make shared retry/backoff, attempt propagation, aggregation, and abort cancellation green across both adapters. | Focused cron tests, provider matrix, cancellation, cap. | `_shared.ts`, both adapters, types/tests, worklog/context |
| S3 | Lock caller-facing semantics and consumer compatibility. | docs source alignment, doc-lint, plugin-triggers consumer check/test. | `ports/types.ts`, manual, optional README, run artifacts |
| S4 | Prove the full A2 column and prepare milestone evaluation handoff. | scoped wrappers, `quality:gate`, JSR audit, publish dry-run, lock/diff audit. | run artifacts and PR evidence only |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | focused retry test | FAIL showing one call/attempt 0 before implementation |
| 2 | Focused runtime | `deno test --unstable-cron packages/cron/tests/` | PASS, no wall-clock sleeps |
| 3 | Scoped check | `run-deno-check.ts --root packages/cron --ext ts,tsx --pretty` | PASS (`--unstable-kv` is wrapper default) |
| 4 | Scoped lint/fmt | scoped lint and fmt wrappers | PASS, no ignores |
| 5 | Doctrine | `deno task quality:gate` | PASS |
| 6 | Docs/JSR | `doc:lint`, audit-jsr-package, package publish dry-run | PASS; baseline slow-type warning not deepened |
| 7 | Consumer | check/test cron trigger adapter mapping | PASS |
| 8 | Hygiene | raw diff/status and `deno.lock` comparison | only intended files staged; foreign lock diff excluded |

## Dependencies

- `@std/async` already belongs to `packages/cron`; no dependency change is planned.
- `@std/testing` is available workspace-wide for deterministic `FakeTime` and `Deno.cron` stubbing.

## Drift Watch

- Any need for a new public clock/policy type, a new provider, per-attempt event cardinality, or
  queue/task retry changes is significant rescope and must stop the slice.
