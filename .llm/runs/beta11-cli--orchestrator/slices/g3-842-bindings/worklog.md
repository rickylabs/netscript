# Worklog: G3 #842 type-safe desktop bindings

## Run Metadata

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Run ID         | `beta11-cli--orchestrator/slices/g3-842-bindings`                  |
| Branch         | `feat/desktop-frontend-842-bindings`                               |
| Archetype      | `4 — Public DSL / Builder` plus adapter/runtime subtype gates      |
| Scope overlays | `frontend` for browser/Aspire no-op; route/island/visual gates N/A |

## Design

This Design checkpoint was completed before any product implementation file was created.

### Public Surface

- `@netscript/sdk/desktop`
  - `createDesktopBindClientPort(options)` — adapts an injected or reflected webview binding invoke
    into the client half of a structural MessagePort.
  - `createDesktopBindServerPort()` — creates one isolated server port plus the native bind handler
    and close control that Fresh registers on a window.
  - `createDesktopRpcLink(options)` — constructs oRPC `RPCLink` over the client port with default
    string/binary serialization.
  - `createDesktopServiceClient<TContract>(options)` — returns the existing
    `ServiceClient<TContract>` shape from the same contract used by the runtime router.
  - `DEFAULT_DESKTOP_RPC_BINDING`, lifecycle/operation constants, and the explicitly documented
    structural option/result types.
- `@netscript/fresh/desktop`
  - `bindDesktopRpcWindow({ window, router, context, bindingName? })` — desktop-gated
    `RPCHandler.upgrade` plus native bind/unbind lifecycle.
  - `DesktopRpcWindowBinding` — discriminated `bound` / `disabled` result with idempotent `close`.

Locked 80% caller shape:

```ts
// Deno runtime / Fresh composition root
import { bindDesktopRpcWindow } from '@netscript/fresh/desktop';

const desktopRpc = bindDesktopRpcWindow({
  window: desktopWindow,
  router: ordersRouter,
  context: {},
});

// Webview
import { createDesktopServiceClient } from '@netscript/sdk/desktop';

const orders = createDesktopServiceClient({ contract: ordersContract });
const order = await orders.get({ id: 'order-42' });
```

There is no `bindings.d.ts`, ambient declaration, duplicate per-procedure API, or consumer-visible
wire envelope.

### Domain Vocabulary

- `DesktopRpcFrame` — the only oRPC payload accepted by the bind shim: `string | Uint8Array`.
- `DesktopBindingInvoke` — promise function for one dynamic native binding, injected or reflected
  from the webview proxy.
- `DesktopMessagePort` — package-owned structural message/close listener plus `postMessage` surface
  accepted directly by shipped oRPC.
- `DesktopBindClient` — client port and idempotent close/error lifecycle owned by one webview.
- `DesktopBindServer` — server port, native bind handler, and idempotent close lifecycle owned by
  one native window.
- `DesktopBindingErrorShape` — structural `{name,message,stack}` rejected by native bindings and
  normalized at the SDK boundary.
- `DesktopRpcWindowBinding` — Fresh's `bound` or `disabled` activation result.
- `DesktopRpcDisabledReason` — `not-desktop` or `missing-window` explanation for a no-op.

### Ports

- `DesktopBindingInvoke` — separates dynamic `globalThis.bindings[name]` resolution from the
  transport state machine and gives tests a faithful promise-based native seam.
- `DesktopBindableWindow` — minimal structural `bind` plus optional `unbind`; Fresh never imports or
  augments unstable Deno Desktop declarations.
- `DesktopMessagePort` — the exact oRPC adapter boundary. Concrete SDK ports must be assignable to
  the installed adapter without a cast.
- `DesktopRuntimeCapability` (internal) — structural POC-style check for `Deno.BrowserWindow`,
  replaceable only through a narrow test seam.

No general event bus, channel registry, codec port, queue abstraction, or dependency container is
introduced.

### Protocol State

```text
webview RPCLink                 SDK server port / Fresh RPCHandler
      postMessage(request) ---> bind("send", request) ---> "message" event
      receive pump ----------- bind("receive") ---------> response queue/waiter
      "message" event <------ string | Uint8Array <------ postMessage(response)
      close ------------------> bind("close") ----------> close event + cleanup
```

- One client pump issues at most one `receive` at a time.
- One server owns a FIFO response queue and at most one pending waiter.
- `close` resolves a pending waiter with the close sentinel and dispatches close once.
- Invalid operations, invalid frames, or a second pending receive reject with a named protocol
  error. Native `{name,message,stack}` rejections are rehydrated before shutdown.
- Every server instance is created inside one Fresh bind call, so two windows sharing a binding name
  share no state.

### Constants

- `DEFAULT_DESKTOP_RPC_BINDING` — `__netscript_rpc__`.
- `DESKTOP_BIND_OPERATIONS` — `send`, `receive`, `close`.
- `DESKTOP_PORT_EVENT_TYPES` — `message`, `close`.
- `DESKTOP_BINDING_STATUSES` — `bound`, `disabled`.
- `DESKTOP_RPC_DISABLED_REASONS` — `not-desktop`, `missing-window`.
- `DESKTOP_BIND_SENTINELS` (internal) — the JSON close discriminator returned from a pending
  `receive`.

All literal unions derive from these TypeScript constants. No published source loads a text/JSON
asset.

### Commit Slices

| # | Slice                                                                                                                                                                                            | Gate                                                                                                                                                        | Files                                                                                                                                                                                                              |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | Complete SDK `./desktop`: protocol contract, client/server port state, dynamic invoke resolver, native error normalization, `RPCLink`, typed service client, and fixtures.                       | Full SDK test directory; SDK check/lint/fmt; exact + focused quality; focused doctrine + root `arch:check`; focused entrypoint doc lint.                    | `packages/sdk/src/desktop/**`; `packages/sdk/tests/desktop/**`; SDK desktop type fixture; `packages/sdk/{deno.json,mod.ts,README.md}`; run artifacts.                                                              |
| 2 | Complete Fresh `./desktop`: POC-style feature detection, `RPCHandler.upgrade`, native bind/unbind lifecycle, and full acceptance matrix including two-window isolation and browser/Aspire no-op. | Full SDK and Fresh package test tasks; both wrapper sets; exact + focused quality; focused doctrine + root `arch:check`; both desktop entrypoint doc lints. | `packages/fresh/src/runtime/desktop/**`; Fresh public type fixture if required; `packages/fresh/{deno.json,mod.ts,README.md}`; locked-contract SDK refinement only if integration reveals a defect; run artifacts. |
| 3 | Consumer/JSR closeout for both published surfaces; refine examples only, inspect publish lists, and rerun every acceptance and fitness gate.                                                     | Full SDK/Fresh tasks; consumer compile; both doc-lint/helper/raw dry-runs; no-text/JSON preflight; exact/focused quality and architecture.                  | Desktop module docs, SDK/Fresh READMEs and type/readme fixtures only as needed; run artifacts. No new capability.                                                                                                  |

All implementation slices are below 30 files. Focused tests may run while editing, but the full
package test directories are the authoritative slice gates.

### Deferred Scope

- Native packaged-app E2E — #457 and the deployment/package lanes own it.
- Window creation/navigation and any Fresh route/island/UI — outside #842; #843 owns update UX.
- Handler plugins/interceptors and dynamic per-call context — no beta.11 consumer requirement.
- Backpressure/queue limits — add only from measured need.
- Structured-clone transfer / `experimental_transfer` — unsupported by the native bind channel.
- Existing Fresh doc-lint cleanup — unrelated restructuring; preserve the recorded baseline.
- Release, merge, issue closure, or milestone closure — explicitly prohibited in this run phase.

### Contributor Path

Start at `packages/sdk/src/desktop/mod.ts` for the consumer contract. Follow the application client
factory to see how the existing `ServiceClient<TContract>` is composed, then the single bind-channel
adapter for protocol/lifecycle behavior. Fresh contributors start at
`packages/fresh/src/runtime/desktop/mod.ts` and follow `bind-desktop-rpc-window.ts`; it is the only
native-window composition point. To add a future capability, change the smallest owning constant or
port and extend the full acceptance matrix—never add a second binding declaration or global queue.

## Progress Log

| Time                  | Slice | Step                                | Notes                                                                                                                                                                        |
| --------------------- | ----- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-18 00:05 CEST | plan  | nested run activated                | Required skills, run-loop, lane policy, Plan-Gate protocol, archetypes, doctrine, scope overlay, gate matrix, and templates read.                                            |
| 2026-07-18 00:20 CEST | plan  | live-source and dependency research | Re-baselined #842/#840, PR #822 RFC/rev 10, official Deno/oRPC docs, installed oRPC 1.14.6, package public surfaces, and G2 pattern. `deno doc` preceded broad source reads. |
| 2026-07-18 00:31 CEST | plan  | integration sync                    | Clean feature branch fast-forwarded from `b2248058` to integration `e6e1be08`, which now includes G2. No product/run file existed before the sync.                           |
| 2026-07-18 00:46 CEST | plan  | package re-baseline                 | SDK/Fresh doc-lint, JSR helper, and raw dry-run evidence captured on the final plan baseline; worktree remained clean.                                                       |
| 2026-07-18 00:50 CEST | plan  | Design checkpoint                   | Public API, wire state, ports, constants, three commit slices, risk mitigations, and complete gates locked. No implementation created.                                       |
| 2026-07-18 00:57 CEST | plan  | draft PR handoff                    | Planning commit `2bdd882` pushed; draft PR #853 opened against `feat/desktop-frontend`, configured with `Closes #842`, requested labels, and milestone 13.                   |

## Decisions

| Decision                                      | Reason                                                                                               | Source                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Dedicated SDK/Fresh desktop subpaths          | Preserve focused Archetype-4 surfaces and isolate runtime-only dependencies.                         | issue #842, doctrine A1/A8, package export maps |
| Send/long-poll receive/close protocol         | Promise-based bind is unary; shipped oRPC expects independent message events and non-awaiting posts. | Deno bindings docs; oRPC 1.14.6 implementation  |
| Existing `ServiceClient<TContract>` result    | One contract must type both HTTP and Desktop clients; no `bindings.d.ts`.                            | issue #842; SDK contract algebra                |
| One server state instance per Fresh bind call | Mirrors Deno's native per-window binding ownership and prevents cross-window state.                  | Deno per-window docs                            |
| Default string/binary only                    | Native bind supports `Uint8Array` but no transfer list; oRPC recommends transfer only when needed.   | oRPC MessagePort docs; Deno payload semantics   |
| Explicit disabled lifecycle in Fresh          | Browser/Aspire must be no-op and testable, matching the POC detection pattern.                       | issue #842; PR #822 POC                         |
| Full package test tasks per slice             | Acceptance explicitly prohibits curated test lists as the package verdict.                           | user brief; harness static gate                 |

## Drift

| Drift                                                                           | Severity    | Logged in drift.md                  |
| ------------------------------------------------------------------------------- | ----------- | ----------------------------------- |
| G2 landed on integration after this local run began                             | minor       | yes; resolved by clean fast-forward |
| Local Deno is 2.9.3, not the skill prose's 2.9.0                                | minor       | yes                                 |
| Fresh current doc-lint has 40 findings despite a resolved historical debt entry | significant | yes                                 |
| JSR helper counts the normal slow-type progress banner as a warning             | minor       | yes                                 |

## Gate Results

### Static Gates

| Gate                       | Command or check                                           | Result  | Notes                                                          |
| -------------------------- | ---------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| Baseline SDK raw dry-run   | `deno publish --dry-run --allow-dirty` in `packages/sdk`   | PASS    | Exit 0; intended G2 file list; no actual slow-type diagnostic. |
| Baseline Fresh raw dry-run | `deno publish --dry-run --allow-dirty` in `packages/fresh` | PASS    | Exit 0; no actual slow-type diagnostic.                        |
| Implementation wrappers    | planned per slice                                          | NOT_RUN | Hard stop pending supervisor Plan-Gate PASS.                   |
| Full package test tasks    | planned per affected slice                                 | NOT_RUN | No implementation exists.                                      |

### Fitness Gates

| Gate                                    | Result             | Evidence                                            | Notes                                                                                                                           |
| --------------------------------------- | ------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| SDK full-export doc baseline            | PASS_WITH_BASELINE | `deno task doc:lint --root packages/sdk --pretty`   | One unrelated transitive private ref; auto-update and root are clean.                                                           |
| Fresh full-export doc baseline          | PASS_WITH_BASELINE | `deno task doc:lint --root packages/fresh --pretty` | Existing 40: 23 private refs + 17 missing JSDoc in untouched graphs.                                                            |
| SDK JSR helper                          | PASS_WITH_BASELINE | audit helper with `--allow-run`                     | Only known progress-banner warning.                                                                                             |
| Fresh JSR helper                        | FAIL_BASELINE      | audit helper with `--allow-run`                     | Existing missing module tags on `./ai`/`./vite`, AI cardinality warning, and banner warning. New desktop surface must add none. |
| F-1..F-19 applicable implementation set | NOT_RUN            | `plan.md`                                           | No product file before Plan-Gate.                                                                                               |

### Runtime Gates

| Gate                               | Result  | Evidence                          | Notes                                                                        |
| ---------------------------------- | ------- | --------------------------------- | ---------------------------------------------------------------------------- |
| Shipped adapter surface inspection | PASS    | `deno doc` and cached 1.14.6 code | Port requires post/message/close semantics; default serializer confirmed.    |
| Deno bind capability model         | PASS    | official 2.9 docs                 | Promise, JSON/bytes, error shape, unbind, and per-window behavior confirmed. |
| Shim/oRPC/native-window behavior   | NOT_RUN | slices 1–2                        | Awaiting Plan-Gate.                                                          |

### Consumer Gates

| Consumer                           | Result  | Evidence                | Notes                                                                     |
| ---------------------------------- | ------- | ----------------------- | ------------------------------------------------------------------------- |
| `@netscript/sdk/desktop` webview   | NOT_RUN | slice 1/3 fixture       | Must infer existing service client contract without ambient declarations. |
| `@netscript/fresh/desktop` runtime | NOT_RUN | slice 2/3 fixture       | Must bind router/context only under Desktop capability.                   |
| Browser/Aspire                     | NOT_RUN | slice 2 full Fresh task | Must be disabled with zero side effects.                                  |

## Handoff Notes

- PLAN-EVAL should inspect D5–D7 first: the full-duplex state machine and cast-free oRPC
  assignability are the most load-bearing design choices.
- Then inspect D9–D14: error mapping, reuse of `ServiceClient<TContract>`, Fresh ownership,
  browser/Aspire feature detection, cleanup, and no-transfer policy.
- Confirm the evaluator accepts Archetype 4 with adapter/runtime subtype gates and the frontend
  no-op overlay, rather than requiring route/visual gates for a runtime-only Fresh subpath.
- Confirm every touched-package slice runs the full package test task and that focused tests are
  never presented as the final verdict.
- Draft PR #853 is the canonical review thread. Its next phase comment is this implementation
  session's stop signal, not an evaluator dispatch.
- No product implementation exists and no slice may begin until the supervisor records Plan-Gate
  `PASS` in `plan-eval.md` and on the draft PR.
