# Plan: exactly one durable chat upstream subscription

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1583-duplicate-sse-subscriptions--1583` |
| Branch | `fix/1583-duplicate-sse-subscriptions` |
| Phase | `plan` |
| Target | `packages/fresh` — `@netscript/fresh/ai` |
| Archetype | `4 - Public DSL / Builder`, with runtime gates |
| Scope overlays | `frontend` |

## Archetype

Doctrine classifies the whole `@netscript/fresh` package as Archetype 4. This slice changes its optional runtime plane, so the Archetype-4 rule requiring runtime gates when the DSL exposes runtime behavior applies; cancellation and single-upstream concurrency are tested explicitly. The package is not split into a second archetype for one subpath.

## Current Doctrine Verdict

`@netscript/fresh`: **Restructure**, historically for the builder monolith. The corresponding AP-1 debt is resolved. This slice does not touch builders, defer, or define-page and creates no new debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | Keep the published connection contract simple; do not add a caller-facing dedupe API. |
| A7 | Use `AbortController`/`AbortSignal` for ownership and cancellation. |
| A13 | Normal cancellation must terminate the live path without becoming an application error. |
| A14 | Concurrent-subscribe and physical-abort tests are the behavior fitness functions. |

## Goal

One `NetScriptChatConnection` owns at most one physical live upstream subscription, shares it across repeated consumers, aborts it on teardown, and can open a new upstream after all prior consumers explicitly stop.

## Scope

- Add internal multicast ownership to `createNetScriptChatConnection`.
- Add RED-first tests for one-upstream concurrency, physical abort, and legitimate re-subscribe.
- Preserve seed/live offset, SR2 retry, message projection, send, and public types.

## Non-Scope

- No changes under `application/defer/**` or `define-page/**`.
- No `isPartial` behavior.
- No message/data fidelity expansion from the issue's separate adoption gap.
- No dependency, export, replay-offset, or upstream-package changes.
- No `e2e:cli`, release, canary, merge, or ready-for-review transition.

## Hidden Scope

- A subscriber joining an active handle must receive future chunks without opening another upstream request.
- Caller abort removes only that consumer; connection teardown aborts the shared physical request.
- The last consumer leaving aborts the shared request, and a later consumer waits for retirement before reopening.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | The connection handle owns dedupe via one internal multicast pump. | Structural guarantee at the package boundary; independent of consumer effect dependencies. |
| D2 | Do not grow `NetScriptChatConnection`. | Existing `subscribe`/`stop`/`dispose` verbs are sufficient. |
| D3 | Preserve the `subscribeWithRetry` algorithm as the sole upstream seed/live subscription path, colocated with the internal ownership hub. | Protects SR2 retry and replay semantics while reducing the already-oversized published module. |
| D4 | A caller signal detaches that subscriber; the last detach aborts the shared pump. | Prevents leaks while allowing multiple logical consumers. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Buffering for consumers at different speeds | safe to defer | Per-subscriber in-memory queues preserve order; bounded/backpressure policy is outside this focused bug. |
| Full `UIMessage` fidelity | safe to defer | Explicitly separate adoption gap in issue #1583; no API growth in this slice. |
| Consumer app construction expression | safe to defer | External EIS source is unavailable; pinned hook behavior and package defect are independently established. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Multicast changes chunk ordering | Single pump broadcasts each chunk synchronously into ordered per-subscriber queues; integration suite remains green. |
| Re-subscribe races an aborting request | Keep the active pump registered until its completion promise settles; acquisition waits before reopening. |
| Stop reports success without aborting IO | Test a deliberately in-flight upstream iterable and assert its abort observation plus iterator completion. |
| Lockfile churn | No dependency command mutates imports; stop immediately if `deno.lock` changes. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | risk | Keep ownership local to this real repeated-subscription failure; do not create a generic stream helper. |
| AP-11 | risk | State remains per connection factory invocation, never module-global. |
| AP-25 | existing edge | Existing upstream/fetch adapter seam remains the only network edge. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5/F-6/F-7 | yes | unchanged export map, JSR audit rubric, full `doc:lint` pass |
| F-10 | yes | focused lifecycle/concurrency tests plus full package tests |
| F-13 runtime behavior | yes | single upstream, physical abort, re-subscribe tests |
| F-19 | yes | scoped check/lint/fmt wrappers |
| Target quality scan | yes | explicit scanner over `packages/fresh/src` because `arch:check` omits Fresh |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No new or deepened violation; known Fresh entries are unrelated. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | `deno task --cwd packages/fresh test` with tests only | New tests fail against baseline behavior; existing tests remain green. |
| 2 | Focused GREEN | `deno task --cwd packages/fresh test` | All lifecycle/integration tests pass. |
| 3 | Static | user-specified scoped check/lint/fmt wrappers | PASS |
| 4 | Docs/JSR | `deno task doc:lint --root packages/fresh --pretty` | changed `./ai` entrypoint stays at zero; report any unrelated package residue verbatim |
| 5 | Package quality | explicit Fresh source scan, then `deno task quality:gate` | PASS; note `arch:check` package-coverage limitation |

## PLAN-EVAL

`PLAN-EVAL: N/A` — this is one focused internal lifecycle fix with a complete issue contract, fixed public surface, locked ownership layer, explicit RED tests, and prescribed gates. No unresolved decision would force implementation rework.
