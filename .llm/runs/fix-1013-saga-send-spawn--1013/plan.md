# Plan: finish saga send/spawn contract correction (#1013)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1013-saga-send-spawn--1013` |
| Branch | `fix/1013-saga-send-spawn` |
| Phase | `plan` |
| Target | `packages/plugin-sagas-core`, saga/triggers/workers integration tests, saga docs |
| Archetype | `5 - Plugin Package` (with the sibling Archetype 3 saga runtime folded into the larger affected surface) |
| Scope overlays | `docs` |

## Archetype

Archetype 5 governs because the correction must be proven across first-party saga, trigger, and
worker plugin wiring. The convention-bearing `send`/`spawn` contract remains in
`@netscript/plugin-sagas-core`; the first-party plugins stay thin and only compose existing core
primitives. Stateful-runtime rules (A12/A13 and F-13) apply to the sibling saga engine behavior.

## Current Doctrine Verdict

- `plugins/sagas`: **Keep** — doctrine-aligned thin connector; do not move new convention-bearing
  behavior into it.
- `@netscript/plugin-sagas-core` (successor of the doctrine's former `packages/sagas`): prior AP-1
  transport debt is closed. Current JSR/cardinality warnings are baseline and outside this focused
  contract fix.
- `plugins/workers`: **Refactor** baseline, but this run only consumes its existing registered-job
  boundary in an integration test and does not restructure it.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| `A1` | Lock `send()` and `spawn()` caller-visible contracts before implementation. |
| `A2` | One helper must not pretend to provide two transports. |
| `A10` | Trigger, queue, worker registry, and saga publisher remain explicit composition seams. |
| `A12` | The tutorial must resume one correlated saga instance across worker result messages. |
| `A13` | Unsupported spawn construction and unknown messages fail with named errors. |
| `A14` | Pre-fix-red runtime and docs-alignment tests protect the corrected central path. |

## Goal

Complete the correction route already selected by #1042: make every public/tutorial claim match
the internal saga-message contract, reject authored `spawn()` effects before ledger acceptance, and
prove the storefront's explicit trigger → queue → registered worker → saga-publisher round trip.

## Scope

- Change `spawn()` to throw `SAGA_NOT_IMPLEMENTED` at effect construction and return `never` in the
  public signature; keep defensive bridge rejection for wire-injected spawn records.
- Replace the existing dispatch-time spawn test with a construction-time contract test.
- Rewrite the storefront saga so it emits no orphan worker-id `send()` effects and stops honestly at
  the documented `paid` checkpoint; keep compensation routed through the default durable runtime.
- Rewrite the durable-sagas minimal example so no `send()` target is described as a service or
  worker command.
- Extend docs accuracy checks to reject the known false saga-to-worker claim patterns.
- Add a cross-plugin integration test that follows the documented happy path: `OrderCreated`,
  webhook `enqueueJob`, queued `process-payment`, registered in-process worker execution,
  `PaymentCompleted` publish, and correlated saga state at `paid`.
- Prove each changed/new regression test red on baseline `ab0fa13fe` in an isolated temporary
  worktree before accepting its green result.

## Non-Scope

- Implementing saga-to-worker overloading in `send()`; explicit trigger/worker boundaries remain
  canonical.
- Implementing child-saga lifecycle semantics; no initial-message, parent/child identity,
  supervision, or completion contract is currently defined.
- Inventory/shipping job implementation, scaffold changes, plugin registry generation, or
  `scaffold.runtime` E2E.
- Existing plugin-sagas-core doc-lint private-type references, source-root cardinality, Prisma
  idempotency parity, or runtime-adapter relocation debt.
- Editing the append-only Architecture Doctrine; its state-machine sketch is target-state doctrine,
  not the storefront's runnable current-state contract.

## Hidden Scope

- #1075 means removing all orphan sends is required even when their prose already calls them
  “internal”; internal delivery is synchronous and unknown message types now fail.
- The tutorial proof must exercise a worker definition resolved from a registry, not merely assert
  that an `enqueueJob` action object was constructed.
- The test must inject a local saga publish port into the job so the worker result resumes the same
  correlation key without HTTP/Aspire resources.
- Close-gate evidence must preserve the issue's mutually exclusive route honestly: the implementing
  condition is not claimed, while the correcting condition and tutorial test receive linked proof.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| `D1` | Finish the correction branch selected by #1042; do not overload `send()`. | The existing public contract, bridge behavior, and explicit trigger-worker boundary agree; overloading would reopen a stable contract and still leave `spawn` semantics undefined. |
| `D2` | `send()` targets registered saga message types only. | #1075 recursively consumes ledgers; treating an unregistered target as success would restore a silent-drop path. |
| `D3` | Unsupported `spawn()` throws from the constructor and has return type `never`; bridge rejection remains defense in depth. | This prevents authored handlers from returning an accepted unsupported effect while keeping malformed/wire data loud. |
| `D4` | The storefront chapter ends the implemented forward path at `paid`; inventory/shipping are explicitly future trigger/job extensions. | The chapter only authors `process-payment`; claiming completion through unauthored jobs is false. |
| `D5` | The integration proof uses in-memory injected ports, not Aspire or live queues. | It exercises the exact logical boundaries deterministically without competing with live wave-four resources. |
| `D6` | Red proof is obtained by applying each finished test change to a temporary worktree at `ab0fa13fe` and recording the observed failure. | It tests pre-fix behavior without rewriting branch history or disturbing shared worktrees. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Add saga-to-worker routing to `send()` | safe to defer | Explicitly rejected by correction route; would require a new public dispatch contract. |
| Define child-saga lifecycle and implement `spawn()` | safe to defer | Requires a separate contract-first feature slice; this issue allows the correction route. |
| How the integration test reaches workers | resolved now | Trigger processor → recording queue → registry lookup → in-process runtime worker. |
| How the job reports back | resolved now | Injected saga publisher port calls the local durable runtime with explicit correlation. |
| Whether to run `scaffold.runtime` | resolved now | N/A: no scaffold, DB wiring, Aspire helper, or published CLI shape changes. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Returning `never` is a public type change. | Keep symbol and parameters stable, document the correction, run full export/doc/publish gates and consumer checks. |
| A “tutorial test” becomes another invented flow. | Bind it to source-accuracy markers and exercise every documented boundary through real runtime ports, including registry resolution and the saga result publish. |
| Removing sends hides intended future steps. | State the current stopping point (`paid`) and name inventory/shipping as future trigger/job extensions without claiming they run. |
| Cross-plugin test duplicates internal fakes. | Prefer published testing/runtime primitives; create only narrow recording ports local to the test. |
| Baseline doc-lint/JSR warnings obscure regressions. | Record exact baseline counts and require no new diagnostics/findings in changed surfaces. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| `AP-9` | risk | Do not invent a generic effect router to unify saga and worker transports. |
| `AP-10` | risk | Do not swallow `SAGA_NOT_FOUND` or unsupported spawn failures. |
| `AP-14` | clear target | Reuse worker/trigger core contracts; no upstream redefinition. |
| `AP-18` | risk | Assert runtime outcomes and focused docs markers, not giant Markdown snapshots. |
| `AP-23` | risk | Keep runtime composition in test setup and handlers in named definitions. |
| `AP-24` | baseline | Do not add a new switch-over-target-kind worker router. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| `F-1/F-3/F-8..F-19` | yes for affected package/plugin roots | `deno task arch:check`, scoped wrappers, and manual delta review |
| `F-5` | yes | focused `deno doc --filter send|spawn` plus full export doc lint delta |
| `F-6/F-7` | yes | package JSR audit and publish dry-run with baseline warning attribution |
| `F-10` | yes | integration test remains below size threshold and asserts semantics |
| `F-13` | yes | saga runtime and cross-plugin tutorial-flow tests |
| Docs overlay | yes | `docs:links`, `docs:accuracy`, source-alignment sweep |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `plugins/sagas/src/runtime` cardinality | none | Runtime folder untouched. |
| Prisma idempotency parity | none | Persistence backend scope untouched. |
| `PLUGIN-RUNTIME-ADAPTER-RELOCATION` | none | No store/adapter relocation. |
| New debt | none expected | Any new violation is a blocking drift, not accepted by default. |

## Commit Slices

| # | Slice | Proving gate | Files |
| --- | --- | --- | --- |
| 1 | Contract-first unsupported spawn: construction fails before ledger acceptance and the public type is `never`. | Pre-fix-red focused test; saga-core runtime test; focused `deno doc`; scoped check/lint/fmt; quality/arch delta | `packages/plugin-sagas-core/src/public/messages.ts`, `packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts`, run artifacts |
| 2 | Storefront central path: corrected docs plus trigger → queue → registered worker → saga round-trip proof. | Pre-fix-red integration test; affected sagas/triggers/workers tests; `docs:accuracy`; `docs:links`; scoped check/lint/fmt | `docs/site/tutorials/storefront/04-checkout-saga.md`, `docs/site/durable-workflows/sagas.md`, `.llm/tools/docs/check-accuracy-and-discoverability.ts`, `plugins/sagas/tests/runtime/storefront-checkout-flow_test.ts`, run artifacts |
| 3 | Merge-readiness evidence and acceptance mapping. | Required aggregate tests; `deno task check`; `quality:scan`; `arch:check`; JSR/doc/publish gates; IMPL-EVAL | Run artifacts, PR body/comments, issue acceptance boxes only after evidence |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Pre-fix red | Isolated worktree at `ab0fa13fe`, apply only each test diff, run focused test | Non-zero with observed behavioral/docs-contract mismatch recorded |
| 2 | Focused runtime | `deno test --allow-all` over saga-core runtime test and new storefront integration test | All pass; job handler runs and saga reaches `paid` |
| 3 | Affected tests | Package/plugin tests for `packages/plugin-sagas-core`, `plugins/sagas`, `packages/plugin-triggers-core`, `plugins/triggers`, `packages/plugin-workers-core`, and worker bridge | All pass |
| 4 | Static wrappers | `.llm/tools/run-deno-{check,lint,fmt}.ts` with explicit affected roots and `--ext ts,tsx` | Zero findings |
| 5 | Docs | `deno task docs:accuracy`; `deno task docs:links` | PASS |
| 6 | Public/JSR | `deno task doc:lint --root packages/plugin-sagas-core --pretty`; JSR audit; package publish dry-run | No new diagnostics/findings; explicit `spawn(): never` visible |
| 7 | Quality | `deno task quality:scan`; `deno task arch:check` | No new quality findings; all roots `FAIL=0` or attributed baseline debt |
| 8 | Root check | `deno task check` | PASS; artifact inspected, not exit code alone |
| 9 | Final evaluation | Separate local open-model IMPL-EVAL | `PASS` before `status:ready-merge` |

## Dependencies

- Existing `enqueueJob`, `createRuntimeTriggerProcessor`, worker registry/runtime, and saga
  publisher port surfaces; no dependency changes.

## Deferred Scope

- Child-saga semantics and implementation.
- Inventory/shipping trigger/job chapters.
- Live Aspire/scaffold runtime proof.
- Baseline package-wide JSR/cardinality cleanup.

## Drift Watch

- If the supported trigger path cannot reach a registry-resolved job without private test-only
  coupling, rescope before adding a new port.
- If `spawn(): never` creates a consumer break broader than an unsupported API correction, record
  significant drift and return to PLAN-EVAL.
- If current docs contain another public saga `send()` claim that addresses a worker/service, add it
  to slice 2 or record why it is target-state/non-public.
