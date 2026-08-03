# Research — fix-1013-saga-send-spawn--1013

## Re-baseline

- Carried-in source: issue #1013, partial correction PR #1042, merged saga-correctness PR #1075,
  and the user-provided warning that #1075 changed the effect path.
- Re-derived against `origin/main` @ `ab0fa13fe5c92129761ebe4dc0246b979733ecaf` on 2026-08-03.
- What changed vs the carried-in issue:
  - PR #1042 already chose the issue's correction branch: `send()` is documented as an internal
    saga-bus message and `spawn()` as unsupported. It left #1013 open because the storefront and
    durable-sagas examples remained false and no test drove the documented trigger/worker path.
  - PR #1075 changed `SagaBusBridge.publish()` from discarding handler-returned ledgers to
    recursively dispatching them. An orphan `send()` now fails as `SAGA_NOT_FOUND` instead of
    evaporating, making the tutorial's unregistered internal messages observably broken.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `send()` is not a workers dispatch. `SagaBusBridge.#dispatchOne` maps every `send` target to `#handleAndDispatch({ type: target.id, ... })`; `target.kind` is not used for routing. | `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts` |
| 2 | #1075 now consumes every handler ledger returned through `SagaBusBridge.publish()`. The same `#handleAndDispatch` path recursively calls `#dispatchOne` for each effect. | `git show 2d58481e4 -- packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts` |
| 3 | The storefront saga emits four internal messages for which it registers no saga handler: `CheckoutPaymentRequested`, `reserve-inventory`, `create-shipment`, and `OrderCancelled`. The first one makes the documented `OrderCreated` command fail immediately on the current runtime. | `docs/site/tutorials/storefront/04-checkout-saga.md`; compare handled `.on(...)` types |
| 4 | The durable-sagas minimal example still labels `{ kind: 'service', id: 'payments' }` as external command dispatch. The bridge ignores `kind` and republishes `payments` as a saga message type. | `docs/site/durable-workflows/sagas.md:90-154`; bridge finding 1 |
| 5 | The supported external boundary already exists: trigger handlers return `enqueueJob(...)`; `createRuntimeTriggerProcessor` turns that into a queue `JobMessage`; workers resolve a registered job by `jobId` and execute it. | `packages/plugin-triggers-core/src/builders/define-webhook.ts`; `plugins/triggers/src/runtime/trigger-runtime-processor.ts`; `plugins/workers/worker/job-dispatcher.ts` |
| 6 | The existing checkout contract test invents saga receivers absent from the tutorial and never exercises `enqueueJob` or a worker job. It therefore cannot satisfy #1013's tutorial-flow criterion. | `packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts` |
| 7 | `spawn()` returns a frozen `CascadedMessage<'spawn'>`; only later dispatch throws `SAGA_NOT_IMPLEMENTED`. A wire-injected spawn is loud, but authored definitions can still produce an accepted unsupported ledger entry. | `packages/plugin-sagas-core/src/public/messages.ts`; `src/adapters/saga-bus-bridge.ts` |
| 8 | The issue's acceptance alternatives are mutually exclusive. #1042 selected correction and explicitly left the implementation alternative out of scope. | #1042 PR body and #1013 issue comment `5153988274` |
| 9 | The canonical local Qwen evaluator cannot launch on this machine because the provider credential is absent. | `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort xhigh --worktree /home/codex/repos/ns004-sagasend` → `auth_required` |

## Contract conclusion

- `send(target, payload)` means one thing: synchronously republish an internal message onto the
  registered saga bus and recursively consume the resulting effect ledger. Unknown message types
  fail loudly; it never crosses into workers.
- Worker work crosses an explicit asynchronous boundary: triggers emit `enqueueJob(...)`, the
  trigger runtime enqueues a `JobMessage`, a worker registry resolves the job, and the job reports
  back through the saga publisher.
- `spawn()` remains unsupported on the correction route. The exported constructor must throw a
  named `SAGA_NOT_IMPLEMENTED` before an unsupported effect enters a returned ledger, and its public
  return type must be `never`. The bus bridge retains its defensive rejection for deserialized or
  structurally injected `spawn` effects.

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all 19 exports from `packages/plugin-sagas-core/deno.json`, plus focused
  `deno doc --filter send|spawn packages/plugin-sagas-core/mod.ts`.
- Planned surface delta: `spawn(...): CascadedMessage<'spawn'>` → `spawn(...): never`; no new
  export or subpath. `send()` remains unchanged.
- Slow-type / surface risks:
  - Root `mod.ts`, domain, workers-integration, publisher, ports, config, streams, testing, and
    transports entrypoints are doc-lint clean.
  - Baseline full-surface doc lint reports 9 combined `private-type-ref` diagnostics in three
    unrelated files and the JSR audit reports the existing sanctioned oRPC slow-type warning.
  - The audit also reports the pre-existing `src/` cardinality warning. This run adds no child to
    `src/` and does not deepen it.
  - `never` is explicit and introduces no inferred/slow public type.

## Open questions

- No architecture decision remains open. Implementation is blocked solely on the required
  PLAN-EVAL route or an explicit owner waiver of that gate.
