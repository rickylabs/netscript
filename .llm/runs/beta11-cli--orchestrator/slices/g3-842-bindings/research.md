# Research — G3 #842 type-safe desktop bindings

## Re-baseline

- Carried-in sources:
  - Live [issue #842](https://github.com/rickylabs/netscript/issues/842) and parent
    [epic #840](https://github.com/rickylabs/netscript/issues/840).
  - PR #822 `rfc.md`, especially F5, on `plan/rfc-single-deployment`.
  - `.llm/runs/rfc-single-deployment--orchestrator/plan.md` rev 10 from PR #822.
  - G2's reviewed `packages/sdk/src/auto-update/` seam now present on the integration branch.
- Re-derived against `feat/desktop-frontend` @ `e6e1be087722746b83b1835e29f265adc40db991` and
  compared with `origin/main` @ `56cf84b57a64cea3e09b2ea1468c83a387bc5038` on 2026-07-18.
- What changed versus the carried-in sources:
  - Rev 10 predates the ratified Deno Desktop frontend slice. Its SDK client-link work is HTTP and
    discovery oriented; PR #822 F5 plus live #842 are the authority for the bind-channel transport.
  - The G2 sibling was absent from the local baseline at run start, then landed on
    `feat/desktop-frontend` while research was active. This branch was cleanly fast-forwarded before
    any run artifact or implementation file was created.
  - The repository resolves oRPC `1.14.6`; the shipped v1 adapter surface, rather than the oRPC v2
    beta banner on the docs site, is the implementation authority for this slice.

## Findings

| #  | Finding                                                                                                                                                                                                                                                             | How to verify                                                                                                                                                                 |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Live #842 requires a bind-channel port shim, oRPC `RPCHandler.upgrade(port)` and `RPCLink`, typed service contracts without `bindings.d.ts`, SDK/Fresh split, binary/error/isolation tests, and browser/Aspire no-op parity.                                        | [Issue #842](https://github.com/rickylabs/netscript/issues/842)                                                                                                               |
| 2  | Owner-ratified Option A assigns the type-safe desktop bridge to beta.11 and keeps it a child of the single-deployment epic.                                                                                                                                         | [Epic #840](https://github.com/rickylabs/netscript/issues/840), PR #822 `rfc.md` F5                                                                                           |
| 3  | Deno Desktop `win.bind(name, handler)` becomes promise-returning `bindings.<name>(...)` in the webview. Arguments and results use JSON semantics with first-class `Uint8Array`; other typed arrays and `ArrayBuffer` are not preserved.                             | [Deno Desktop bindings](https://docs.deno.com/runtime/desktop/bindings/) §§ webview proxy, argument and return semantics                                                      |
| 4  | Native binding failures cross as plain `{ name, message, stack }`, bindings can be removed with `win.unbind(name)`, and registrations are isolated per window.                                                                                                      | [Deno Desktop bindings](https://docs.deno.com/runtime/desktop/bindings/) §§ errors, unbinding, per-window bindings                                                            |
| 5  | Deno explicitly provides no built-in type bridge and recommends a hand-written declaration file. #842 intentionally replaces that declaration coupling with the existing oRPC contract algebra.                                                                     | [Deno Desktop bindings](https://docs.deno.com/runtime/desktop/bindings/) § type safety; issue #842                                                                            |
| 6  | The installed oRPC `RPCLink` and `RPCHandler` accept a structural port with `addEventListener` and `postMessage`; both listen for `message`, and the client also observes `close`. `RPCHandler.upgrade(port)` is the server activation point.                       | `deno doc --filter RPCLink npm:@orpc/client@1.14.6/message-port`; `deno doc --filter RPCHandler npm:@orpc/server@1.14.6/message-port`; cached `1.14.6` adapter implementation |
| 7  | oRPC defaults to string/binary serialization. `experimental_transfer` switches to structured clone and is explicitly recommended only when required. Deno bind has no transfer-list capability, so enabling it would be misleading.                                 | [oRPC MessagePort adapter](https://orpc.dev/docs/adapters/message-port) § Transfer; shipped `1.14.6` adapter code                                                             |
| 8  | A unary bind call is not itself a MessagePort: `postMessage` is non-awaiting and inbound messages may arrive independently. A tiny `send` / long-poll `receive` / `close` protocol is required to preserve the adapter's event model and streaming compatibility.   | Shipped `LinkMessagePortClient` and `MessagePortHandler` behavior; Deno's promise-only bind semantics                                                                         |
| 9  | Per-window isolation follows naturally when each `bindDesktopRpcWindow` call owns its own server port queue and installs the same default binding name on a distinct native window. No process-global queue or client registry is permitted.                        | Deno per-window docs; planned isolation fixture with two independent fake windows                                                                                             |
| 10 | The existing SDK has package-owned `ServiceClient<TContract>` and `ServiceClientContext` algebra plus a structural internal link port. The desktop entrypoint can return the same typed client shape while constructing oRPC's `RPCLink` internally.                | `deno doc packages/sdk/mod.ts`; `packages/sdk/src/ports/service-client.ts`; `packages/sdk/src/client/service-client.ts`                                                       |
| 11 | `@netscript/sdk` and `@netscript/fresh` are doctrine Archetype 4 packages. SDK verdict is **Keep**; Fresh verdict is **Restructure**, so the new Fresh surface must remain a focused subpath and must not deepen its legacy barrel/runtime debts.                   | doctrine `04-archetypes.md`, `10-codebase-verdict-and-handoff.md`; package export maps                                                                                        |
| 12 | The POC uses structural feature detection for `Deno.BrowserWindow` and returns early outside Desktop. Fresh must preserve that shape so regular browser rendering and Aspire-hosted Fresh remain inert.                                                             | PR #822 `apps__dashboard__lib__desktop-chrome.ts`                                                                                                                             |
| 13 | G2's auto-update adapter is a focused SDK subpath with explicit domain constants, structural Deno probing, injection seams, complete JSDoc, and no global augmentation. The desktop bridge should copy those package conventions, not its unrelated updater domain. | `packages/sdk/src/auto-update/`; G2 plan/evaluate artifacts                                                                                                                   |
| 14 | The integration baseline uses Deno 2.9.3 and oRPC `^1.14.6` resolving to `1.14.6`. Exact dependency inspection caused no retained lock change.                                                                                                                      | `deno --version`; `deno doc`; `deno.lock`; clean `git status`                                                                                                                 |
| 15 | String-constants doctrine applies: the finite binding name, wire operations, lifecycle statuses, and disabled reasons belong in TypeScript constants with derived literal types. Published code must not use text/JSON import attributes.                           | doctrine A12 / F-15 and user acceptance gate                                                                                                                                  |

## jsr-audit surface scan (package wave)

- Surfaces scanned:
  - Current eleven-entrypoint `@netscript/sdk` export map, including G2's `./auto-update`, plus the
    proposed `./desktop` entrypoint.
  - Current fourteen-entrypoint `@netscript/fresh` export map plus the proposed `./desktop`
    entrypoint.
- Baseline evidence at integration commit `e6e1be08`:
  - Raw `deno publish --dry-run --allow-dirty` passes in both packages and reports no actual
    slow-type diagnostics.
  - `deno task doc:lint --root packages/sdk --pretty` reports one unrelated transitive
    `private-type-ref` through `plugin-streams-core`; zero missing JSDoc. The existing auto-update
    entrypoint is independently clean.
  - `deno task doc:lint --root packages/fresh --pretty` reports an existing combined baseline of 40
    findings: 23 private-type references and 17 missing JSDoc findings in route, query, and streams
    entrypoint graphs. The new desktop entrypoint must be independently zero and must not increase
    the combined baseline.
  - The JSR helper passes SDK apart from its known false positive on the literal dry-run banner
    `Checking for slow types`. Fresh additionally reports existing missing `@module` tags on `./ai`
    and `./vite` and an existing `src/runtime/ai` cardinality warning.
- Planned-surface controls:
  - Both new entrypoints receive `@module` docs, complete symbol JSDoc, explicit declaration types,
    and copy-pasteable examples.
  - Public types are package-owned structural contracts; no ambient `bindings` declaration, no
    `any`, no double cast, and no exported private helper type.
  - SDK production source depends on `@orpc/client/message-port`; Fresh production source depends on
    `@orpc/server/message-port` and the public SDK desktop subpath. Imports are declared in each
    member `deno.json` and verified with `deno why` / `deno info` if resolution changes.
  - Raw package dry-runs, focused entrypoint `deno doc --lint`, the helper rubric, publish file
    lists, and a no-text/JSON-import scan are repeated after the implementation surface lands.

## Open questions resolved by the plan

- **How can a promise-only bind call act like a full-duplex port?** The SDK owns a minimal protocol:
  webview `send` calls deliver an oRPC string/binary frame to the server port, `receive` calls
  long-poll the server-to-webview queue, and `close` tears down pending work. The client port owns
  exactly one receive pump.
- **Which side owns oRPC?** SDK constructs the webview `RPCLink` and typed client. Fresh constructs
  `RPCHandler`, upgrades the SDK server port, and registers its bind handler on a supplied native
  window.
- **What is public versus internal?** Consumers see the typed client factory, structural port
  contract, bind invoke/window seams needed for composition and tests, and a discriminated Fresh
  binding handle. Wire envelopes, queues, event dispatch, and operation parsing stay internal.
- **How is no-op truth represented?** Fresh returns a discriminated `bound` or `disabled` handle;
  the disabled variant states `not-desktop` or `missing-window` and performs no bind/global write.
- **How are errors mapped?** Native `{name,message,stack}` rejections are normalized to an `Error`
  at the SDK boundary. Procedure errors are left to oRPC's protocol and proven end-to-end so name,
  message, and stack survive the window round-trip.
- **Should `experimental_transfer` be exposed?** No. Deno bind cannot honor transfer ownership, and
  the default serializer already carries strings and `Uint8Array`. A later capability-gated API can
  be proposed without changing the v1 contract.
