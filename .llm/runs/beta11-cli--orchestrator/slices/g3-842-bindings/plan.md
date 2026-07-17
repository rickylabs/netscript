# Plan: issue #842 type-safe desktop bindings

## Run Metadata

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g3-842-bindings`                                            |
| Branch         | `feat/desktop-frontend-842-bindings`                                                         |
| Phase          | `plan`                                                                                       |
| Target         | `packages/sdk` `./desktop` transport/client and `packages/fresh` `./desktop` runtime binding |
| Archetype      | `4 — Public DSL / Builder`, with adapter-boundary and runtime subtype gates                  |
| Scope overlays | `frontend` for Fresh's browser/Aspire no-op boundary; visual/route/island gates are N/A      |

## Archetype

Doctrine assigns both `@netscript/sdk` and `@netscript/fresh` to Archetype 4. The new surfaces are
small public composition APIs: SDK adapts an external transport and constructs a typed client; Fresh
binds an existing router to a native window. Archetype 2 adapter-boundary expectations and Archetype
3 lifecycle/runtime checks apply as subtype gates without reclassifying either package.

The Fresh scope overlay applies because this is a Fresh/browser boundary. It requires browser and
Aspire no-op proof, but no route, island, loading, responsive, visual, or accessibility surface is
created; those UI-specific checks are explicitly N/A.

## Current Doctrine Verdict

- `@netscript/sdk`: **Keep — high cohesion already; minor naming review.** Add a focused subpath and
  preserve the package-owned service contract algebra.
- `@netscript/fresh`: **Restructure.** Do not expand its root barrel or existing large runtime
  graphs; add one focused `./desktop` subpath whose dependencies point inward to the SDK seam.

## Axioms in Play

| Axiom | Why it matters                                                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| A1    | Wire vocabulary and public types are fixed before queue or oRPC adapter code.                                                |
| A2    | Consumers use NetScript's existing contract once; no parallel hand-maintained `bindings.d.ts`.                               |
| A6    | The shim is justified by bidirectional semantics, error normalization, isolation, and test seams—not a rename of `win.bind`. |
| A7    | Use shipped oRPC/Deno/Web Platform behavior before inventing serialization or event machinery.                               |
| A8    | Protocol state, SDK composition, and Fresh native-window wiring each have one reason to change.                              |
| A9    | Package archetypes stay stable while effectful adapter/runtime subtypes receive additional gates.                            |
| A10   | Each exported factory is a small composition root over narrow structural ports; no container.                                |
| A11   | The named axes are transport direction, lifecycle state, runtime capability, and per-window ownership.                       |
| A12   | Binding operations, statuses, close reasons, and the default channel are TypeScript constants with derived unions.           |
| A13   | Failures are typed/normalized and observable through rejection, never hidden behind console logging.                         |
| A14   | Full package tests, consumer compile, JSR, quality, and architecture gates preserve the seam.                                |

## Goal

Let a Deno Desktop webview call an existing NetScript/oRPC service contract across its own window's
native bind channel with the same inferred client shape used by HTTP services, while carrying string
and `Uint8Array` frames, preserving errors, isolating windows, and remaining inert under ordinary
browser or Aspire-hosted Fresh execution.

## Scope

- Add `@netscript/sdk/desktop` with a MessagePort-compatible client/server shim over a single Deno
  Desktop binding.
- Add an SDK `RPCLink` factory and typed `ServiceClient<TContract>` factory using the existing
  service-client contract algebra.
- Add `@netscript/fresh/desktop` with `bindDesktopRpcWindow`, which constructs an oRPC `RPCHandler`,
  upgrades the SDK server port, registers the native binding, and returns a lifecycle handle.
- Preserve default oRPC string/binary serialization and first-class `Uint8Array` transport.
- Normalize plain native binding errors and prove procedure-error `{name,message,stack}` mapping
  across the whole adapter.
- Prove two native windows with the same binding name cannot observe one another's frames.
- Prove Fresh performs no registration under browser/Aspire capability shapes.
- Document the 80% caller path and the native security/permission boundary.
- Add explicit dependencies/exports/check entrypoints and complete JSR evidence for both packages.

## Non-Scope

- Hand-authored or generated `bindings.d.ts`, ambient `bindings`/Deno global augmentation, or a
  second service contract definition.
- A general IPC framework, process-global bus, multiplexed named-service registry, or arbitrary
  host-object transfer system.
- WebSocket/HTTP replacement, Aspire service discovery changes, or modifications to existing
  `createServiceClient` behavior.
- Fresh routes, islands, UI components, desktop window creation, navigation, or the update prompt
  owned by #843.
- Native packaged-app E2E beyond the testable bind seam; packaging/runtime deployment is owned by
  #452/#456/#457.
- `experimental_transfer`, structured-clone ownership transfer, `ArrayBuffer`, or typed arrays other
  than `Uint8Array`.
- Release publication, tags, canaries, merges, issue closure, or milestone 13 closure.

## Hidden Scope

- oRPC's structural port observes `close` as well as `message`; the shim must end pending receives
  and dispatch close exactly once so calls do not hang during teardown.
- `postMessage` cannot await the promise-based native invoke. The client needs one managed receive
  pump and deterministic transport-failure shutdown.
- Long-poll `receive` must handle a queued response, one pending waiter, close-before-response, and
  invalid/re-entrant protocol calls without leaking promises.
- Deno bind arguments/results are JSON-like plus `Uint8Array`. Binary is passed as a top-level
  protocol argument/result so it is never accidentally embedded in a lossy JSON envelope.
- Dynamic access to `bindings.<name>` must use structural reflection from `unknown`; no property is
  declared globally and no unchecked call is cached at module load.
- Fresh must check the structural Desktop capability before constructing/attaching the handler and
  must unbind on close when the supplied window supports `unbind`.
- Export-map changes require member check tasks, public self-subpath consumer fixtures, docs,
  publish lists, and full-export doc lint to stay coherent.
- Existing SDK/Fresh doc-lint and Fresh JSR findings must be attributed precisely so unrelated
  baselines neither block honest evidence nor conceal a new regression.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                                                        | Rationale                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Add focused public subpaths `@netscript/sdk/desktop` and `@netscript/fresh/desktop`; root modules document but do not re-export them.                                                                                                                                           | Keeps both Archetype-4 root surfaces bounded and gives runtime-only code an explicit import.                                      |
| D2  | SDK exports `createDesktopBindClientPort`, `createDesktopBindServerPort`, `createDesktopRpcLink`, and `createDesktopServiceClient`; the 80% webview path is `createDesktopServiceClient({ contract })`.                                                                         | Exposes the requested shim and link for composition while making the standard typed-client path concise.                          |
| D3  | Fresh exports `bindDesktopRpcWindow({ window, router, context, bindingName? })` and returns a discriminated lifecycle handle with `status`, optional `reason`, and idempotent `close()`.                                                                                        | Makes native activation and no-op behavior explicit without creating a window or hiding lifecycle.                                |
| D4  | The single binding defaults to `DEFAULT_DESKTOP_RPC_BINDING = '__netscript_rpc__'`; callers may provide a non-empty alternate name to coexist with host bindings.                                                                                                               | One well-known name is sufficient for oRPC; configurability avoids collisions without inventing a registry.                       |
| D5  | The wire protocol is three operations—`send`, `receive`, `close`—owned by `DESKTOP_BIND_OPERATIONS`. The operation is the first binding argument and string/`Uint8Array` payload is the second; `receive` returns a frame or a JSON close sentinel.                             | Converts unary promise calls into independent bidirectional port events while preserving native binary support.                   |
| D6  | Each server-port factory owns one FIFO outbound queue, at most one pending receive waiter, its event target, and its closed state. Each client-port factory owns one receive loop. No global channel or map exists.                                                             | Preserves MessagePort ordering and Deno's per-window isolation by construction.                                                   |
| D7  | The package-owned `DesktopMessagePort` surface is only the structural portion oRPC needs: `postMessage`, message/close listeners, and idempotent close control. It is compile-checked directly against oRPC's shipped `SupportedMessagePort`; no compatibility cast is allowed. | Avoids pretending to implement unrelated DOM MessagePort transfer/start APIs and prevents a type-only shim.                       |
| D8  | `DesktopBindingInvoke` is an injected promise function. The default resolver reflects `globalThis.bindings[bindingName]` at factory call time and validates it from `unknown`; tests and embedders may supply an explicit invoke.                                               | Eliminates ambient declarations, module-load globals, and untestable webview coupling.                                            |
| D9  | Native rejected values matching `{name,message,stack}` become real `Error` instances preserving all three fields. Procedure errors continue through oRPC's serializer and are proven through `ServiceClient<TContract>`.                                                        | Meets Deno's cross-realm error semantics without creating a parallel RPC error protocol.                                          |
| D10 | SDK's `createDesktopServiceClient<TContract>` calls `createORPCClient(createDesktopRpcLink(...))` and returns the existing `ServiceClient<TContract>` type. The source contract is never serialized or duplicated.                                                              | Gives identical call inference across HTTP and Desktop and removes the reason for `bindings.d.ts`.                                |
| D11 | Fresh constructs `RPCHandler` from the supplied existing router and calls `upgrade(server.port, { context })` before registering the server handler on the window. The v1 API does not expose speculative handler plugins/options.                                              | Implements the required runtime adapter with one stable composition path; additional handler policy requires a concrete use case. |
| D12 | Fresh desktop detection is structural and mirrors the POC: absent `Deno.BrowserWindow`, absent window, or absent callable `bind` returns `disabled` without registration. Tests use a narrow capability/invoke seam, never global augmentation.                                 | Keeps browser and Aspire behavior inert and deterministic.                                                                        |
| D13 | Closing a bound Fresh handle closes the SDK server port, resolves the long-poll close sentinel, dispatches port close, and calls native `win.unbind(bindingName)` when available. Repeated close is a no-op.                                                                    | Prevents pending-call leaks and makes cleanup safe across current/native test shapes.                                             |
| D14 | Use oRPC's default string/binary serializer. Do not expose or set `experimental_transfer`; Deno bind cannot accept a transfer list and already supports `Uint8Array`.                                                                                                           | Follows oRPC guidance and avoids a false structured-clone capability.                                                             |
| D15 | Finite wire operations, lifecycle statuses, disabled reasons, and close sentinel discriminants are TypeScript constants with derived types. Published code contains no text/JSON import attributes or runtime asset reads.                                                      | Satisfies the string-constants and JSR incident doctrine.                                                                         |
| D16 | Full package test directories are authoritative after every slice that touches that package. Focused tests may shorten the edit loop but never replace `packages/sdk/tests/` or Fresh's full `src` + `tests` task.                                                              | Encodes the beta.11 lesson directly into the gate plan.                                                                           |

## Open-Decision Sweep

| Decision                                       | Status                | Notes                                                                                                                                       |
| ---------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Alternate binding names                        | resolved now          | Optional non-empty `bindingName`; one default constant; no registry.                                                                        |
| Full-duplex versus unary request/response      | resolved now          | Three-operation send/long-poll receive/close protocol preserves shipped oRPC event semantics and streaming.                                 |
| Multiple simultaneous `receive` calls          | resolved now          | Exactly one client pump; server rejects a second pending receive as a protocol error.                                                       |
| Queue size/backpressure                        | safe to defer         | Desktop oRPC traffic is bounded by active calls; v1 uses FIFO. A measured need can add a limit without changing the public client contract. |
| Fresh handler plugin/interceptor configuration | safe to defer         | No concrete beta.11 consumer requires it; adding an explicit handler injection/option later need not change transport or typed clients.     |
| Per-call dynamic context                       | safe to defer         | Context is fixed per bound window in v1, matching the native per-window ownership model.                                                    |
| Native packaged-app E2E                        | safe to defer to #457 | Unit/integration fixtures prove the adapter boundary; the owning packaging issue proves real binaries.                                      |
| `experimental_transfer`                        | resolved now          | Not supported or exposed because the underlying bind channel has no transfer-list semantics.                                                |
| Fresh historical doc-lint cleanup              | safe to defer         | New subpath must be zero and the combined 40 baseline must not increase; unrelated route/query/streams restructuring stays outside #842.    |

No unresolved decision would force rework inside the approved slices.

## Risk Register

| Risk                                                                     | Mitigation                                                                                                                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A naive unary bridge passes basic tests but breaks streaming/server push | Use independent send/receive operations and test more than one response frame plus close ordering.                                                    |
| Async `postMessage` failure leaves an oRPC call hanging                  | Client port catches invoke/pump failure, normalizes the error, closes once, and exposes deterministic rejection/close evidence.                       |
| Long-poll waiter leaks on close                                          | Server close resolves the pending waiter with the close sentinel; tests use sanitizers and explicit close-before-message cases.                       |
| Binary data is coerced through JSON                                      | Pass `Uint8Array` as a top-level bind argument/result and assert byte equality on both request and response.                                          |
| Frames cross between windows                                             | No static state; two-window fixture sends distinct concurrent values using the same binding name and asserts strict separation.                       |
| Browser/Aspire imports touch Desktop globals                             | Resolve capability only inside the Fresh function, return `disabled` first, and assert zero bind/unbind calls.                                        |
| oRPC's structural port type forces unsafe casts                          | Compile the concrete port against shipped `1.14.6`; any required cast is a Plan-Gate drift/rescope, not an implementation shortcut.                   |
| Public types leak upstream private types or slow inference               | Explicit package-owned return/options types, focused `deno doc --lint`, consumer fixtures, and raw dry-runs.                                          |
| Fresh existing JSR/doc debt masks regression                             | Attribute the new entrypoint independently and enforce unchanged package baseline counts and file paths.                                              |
| Quality tasks do not scan both package roots by default                  | Run the exact named root task plus an explicit focused `--root packages/sdk --root packages/fresh` scan in affected slices.                           |
| Binding grants access to privileged runtime procedures                   | README states the trust boundary and tells applications to validate authorization/input at the router; no capability escalation is added by the shim. |

## Anti-Patterns to Resolve or Avoid

| AP    | Status         | Plan                                                                                                                              |
| ----- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| AP-1  | risk           | Keep domain types/constants, transport state, client composition, and Fresh binding in focused files below review thresholds.     |
| AP-2  | justified seam | The adapter supplies full-duplex semantics, error mapping, lifecycle, isolation, feature detection, and typed-client composition. |
| AP-7  | avoided        | Each public factory accepts one named options object; no positional channel/config ladder.                                        |
| AP-8  | avoided        | Narrow functions/records only; no DI container or service locator.                                                                |
| AP-9  | avoided        | One bind transport and one Fresh composition surface; no speculative bus/codec/registry hierarchy.                                |
| AP-11 | avoided        | No module-load binding/global cache; activation occurs only at explicit factory/bind calls.                                       |
| AP-13 | avoided        | Transport/procedure failures reject or close structurally; published code has no console side effect.                             |
| AP-14 | avoided        | Upstream handler/link/router implementation types are not re-exported as NetScript domain concepts.                               |
| AP-15 | avoided        | Names describe Desktop binding, port, client, and window lifecycle; no `I*`, `Impl`, or generic manager.                          |
| AP-16 | avoided        | Native `bindings` and `Deno.BrowserWindow` are reflected from `unknown`; no ambient declaration or global write.                  |
| AP-19 | addressed      | Module/README docs explain bind permissions, per-window scope, payload limits, and router trust.                                  |
| AP-20 | avoided        | SDK owns transport/client; Fresh owns framework/native-window composition. Neither package reaches into the other's internals.    |
| AP-22 | sanctioned     | Both `mod.ts` files are declared public export-map entrypoints, not convenience barrels.                                          |
| AP-23 | avoided        | No deep import is part of a consumer fixture or published example.                                                                |
| AP-24 | avoided        | No text/JSON assets or import attributes in published source.                                                                     |
| AP-25 | contained      | Globals, native bind/unbind, receive pumping, and oRPC activation are confined to named edge modules.                             |

## Fitness Gates

| Gate         | Required                     | Expected evidence                                                                                                             |
| ------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| F-1..F-12    | yes where applicable         | Focused doctrine report and manual review; clear contributor path, explicit dependencies, bounded files, and permission docs. |
| F-13         | runtime subtype              | Send/receive/close, rejection, pending-waiter cleanup, idempotent teardown, and no-op lifecycle tests.                        |
| F-14..F-19   | yes                          | Focused doctrine report, no console/ambient/text imports, full test tasks, and scoped gate runners.                           |
| Static       | every affected slice         | Scoped check/lint/fmt wrappers plus each touched package's complete test task.                                                |
| Runtime      | yes                          | Typed oRPC round-trip, procedure/native error mapping, `Uint8Array`, multiple frames, close, and isolation.                   |
| Frontend     | browser/Aspire boundary only | Disabled result and zero native calls with absent Desktop capability; route/island/visual/accessibility checks N/A.           |
| Consumer     | yes                          | Public-subpath fixture uses one contract to type both router and `ServiceClient`, without `bindings.d.ts`.                    |
| JSR          | yes                          | New entrypoints independently zero; helper rubric, raw dry-runs, publish lists, module/symbol docs, no text/JSON imports.     |
| Code quality | every implementation slice   | Exact `quality:scan`, focused two-package scan where applicable, focused doctrine, and root `arch:check`.                     |

## Arch-Debt Implications

| Entry                                                          | Action                                                    | Notes                                                                                                                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New SDK/Fresh desktop surfaces                                 | none expected                                             | Must land with no new/deepened doctrine debt or suppression.                                                                                                                    |
| `packages/fresh — AP-1 / doctrine verdict Restructure`         | preserve                                                  | A focused runtime subpath avoids deepening the large builder/root structures.                                                                                                   |
| `packages/fresh — F-7 full package doc-lint residue after 5d1` | propose separate re-baseline, do not silently reopen here | Registry says resolved, but current 40-finding baseline is real. #842 requires an independently clean subpath and unchanged baseline; drift records the documentation mismatch. |
| SDK transitive `plugin-streams-core` private ref               | preserve baseline only                                    | New desktop entrypoint must be zero; do not absorb an unrelated package fix.                                                                                                    |

## Validation Plan

| Order | Gate                    | Command or check                                                                                                                | Expected result                                                                                                                          |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | SDK full tests          | `rtk proxy deno task --cwd packages/sdk test`                                                                                   | Entire `packages/sdk/tests/` directory passes; never replace with a curated list.                                                        |
| 2     | Fresh full tests        | `rtk proxy deno task --cwd packages/fresh test`                                                                                 | Entire `packages/fresh/src` and `packages/fresh/tests` task passes whenever Fresh is touched.                                            |
| 3     | SDK scoped check        | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts --pretty`                          | 0 errors with `--unstable-kv`; includes public consumer fixture.                                                                         |
| 4     | Fresh scoped check      | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx --pretty`                    | 0 errors.                                                                                                                                |
| 5     | Scoped lint             | Run `.llm/tools/run-deno-lint.ts` for each touched package with source extensions                                               | 0 errors.                                                                                                                                |
| 6     | Scoped format           | Run `.llm/tools/run-deno-fmt.ts` for each touched package with source extensions                                                | 0 errors; generated/scratch files excluded by the wrapper.                                                                               |
| 7     | Named quality gate      | `rtk proxy deno task quality:scan`                                                                                              | Exit 0, no new finding or allowance.                                                                                                     |
| 8     | Focused quality gate    | `deno task quality:scan --root packages/sdk --root packages/fresh` (affected roots only per slice)                              | Zero `any`, double casts, blanket ignores, ambient escape hatches, or hardcoded coupling.                                                |
| 9     | Focused doctrine        | Run `deno task arch:check:repo --root packages/sdk` and/or `--root packages/fresh` for each affected package                    | No new package doctrine finding.                                                                                                         |
| 10    | Named architecture gate | `rtk proxy deno task arch:check`                                                                                                | Exit 0; aggregate dependency/architecture gate stays green.                                                                              |
| 11    | Runtime acceptance      | Full package tasks include the bind shim and Fresh integrated oRPC fixtures                                                     | Typed round-trip, `{name,message,stack}`, `Uint8Array`, close, and two-window isolation all pass.                                        |
| 12    | Browser/Aspire parity   | Fresh full task includes structural non-Desktop fixtures                                                                        | Returns `disabled`; zero bind/unbind/handler activation.                                                                                 |
| 13    | Full-export docs        | `deno task doc:lint --root packages/sdk --pretty` and `--root packages/fresh --pretty`, plus focused new entrypoint attribution | Both desktop entrypoints have 0; SDK combined stays at 1 unrelated ref; Fresh combined does not exceed the 40-finding recorded baseline. |
| 14    | JSR rubric              | Run `.llm/tools/fitness/audit-jsr-package.ts` with `--root packages/sdk --text` and `--root packages/fresh --text`              | No new helper finding; known banner and unrelated Fresh module/cardinality baselines attributed.                                         |
| 15    | Raw package dry-runs    | `deno publish --dry-run --allow-dirty` from `packages/sdk` and `packages/fresh`                                                 | Exit 0, intended publish lists, no actual slow-type warning. This is not a publish.                                                      |
| 16    | No text/JSON imports    | Focused `rg` over published source plus non-publishing `deno task release:preflight`                                            | No text or JSON import attribute, imported asset, or runtime file-read constant.                                                         |
| 17    | Public consumer compile | Fixture imports only `@netscript/sdk/desktop`, `@netscript/fresh/desktop`, and the normal oRPC contract/router APIs             | One contract infers client input/output/error types; no ambient declaration.                                                             |

## Commit Slices

| # | Slice                                                                                                                                                                                                        | Required authoritative gates                                                                                                                                                                               | Planned files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | SDK contract and bind-port adapter: constants/types, send/receive/close protocol, structural global resolver, native error normalization, RPCLink and typed service-client composition.                      | Full SDK test task; SDK scoped check/lint/fmt; exact and focused quality scans; focused SDK doctrine; root `arch:check`; SDK new-entrypoint doc lint.                                                      | `packages/sdk/src/desktop/domain/{constants,types}.ts`; `packages/sdk/src/desktop/adapters/bind-channel.ts`; `packages/sdk/src/desktop/application/desktop-rpc-client.ts`; `packages/sdk/src/desktop/mod.ts`; `packages/sdk/tests/desktop/{bind-channel,desktop-rpc-client}_test.ts`; `packages/sdk/tests/type-fixtures/desktop-consumer_type.ts`; `packages/sdk/{deno.json,mod.ts,README.md}`; run artifacts.                                                                                         |
| 2 | Fresh runtime composition and acceptance matrix: Desktop feature detection, `RPCHandler.upgrade`, bind/unbind lifecycle, full typed round-trip, error/bytes, two-window isolation, and browser/Aspire no-op. | Full SDK task (Fresh consumes it) and full Fresh task; both scoped wrapper sets; exact/focused quality; focused two-package doctrine; root `arch:check`; both new-entrypoint doc lints.                    | `packages/fresh/src/runtime/desktop/domain/{constants,types}.ts`; `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts`; `packages/fresh/src/runtime/desktop/mod.ts`; `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`; `packages/fresh/tests/type-fixtures/desktop-consumer_type.ts` if the existing Fresh test layout requires it; `packages/fresh/{deno.json,mod.ts,README.md}`; SDK refinements only if integration exposes a locked-contract defect; run artifacts. |
| 3 | Published consumer/JSR closeout: refine examples/docs only as required, prove both public subpaths, package file lists, slow types, no text/JSON imports, and re-run all acceptance/fitness gates.           | Full SDK and Fresh tasks; both scoped wrapper sets; consumer compile; both doc-lint/audit/dry-run gates; exact/focused quality; focused doctrine; root `arch:check`; release preflight without publishing. | `packages/sdk/README.md`; `packages/fresh/README.md`; both desktop `mod.ts` files; public type fixtures/readme doctest only if needed; run artifacts. No implementation expansion.                                                                                                                                                                                                                                                                                                                     |

All slices are below 30 files, contract-first, and include worklog/context reconciliation. Each
implementation slice is commit → explicit-refspec push → structured PR comment with scope/hash/gate
evidence → hard pause for supervisor-owned Tier-A review. No slice starts before Plan-Gate `PASS`.

## Risks

- Deno Desktop remains young. The plan isolates all volatile globals behind structural ports and
  pins behavior to current official docs and installed oRPC code.
- The protocol adds lifecycle state. The full package tests exercise every state transition, and
  sanitizers must remain enabled; no timeout-based flaky assertion is accepted.
- Fresh already has unrelated doc debt. New-entrypoint attribution and fixed baseline counts keep
  the evidence honest.

## Dependencies

- Integration branch `feat/desktop-frontend` @ `e6e1be08`, including G2 #841.
- Deno Desktop bind semantics documented for Deno 2.9 and local Deno 2.9.3.
- Installed `@orpc/client` / `@orpc/server` MessagePort adapters resolving to `1.14.6`.
- Existing SDK `ContractLike`, `ServiceClient<TContract>`, and `ServiceClientContext` algebra.
- Existing service routers created with normal oRPC contract/router APIs.
- #452/#456/#457 own generated app, packaging, and real native E2E; #843 owns update UI.

## Deferred Scope

- Queue limits/backpressure driven by measured workloads.
- Handler plugin/interceptor injection and dynamic per-call window context.
- Transfer lists or structured clone beyond Deno bind's supported payloads.
- Native packaged-app E2E and generated app adoption.
- UI/route/island work.
- Existing Fresh route/query/streams doc-lint cleanup.
- Any release, merge, issue closure, or milestone closure action.

## Drift Watch

- Deno changes binding argument/error/per-window semantics or adds a native port/transfer API.
- oRPC version/resolution or `SupportedMessagePort` shape changes before implementation.
- Integration base changes SDK/Fresh export maps or service-client types.
- Concrete implementation requires a cast, ambient declaration, global queue, transfer support, or
  handler configuration not locked here; any such fact stops the slice for rescope/Plan-Gate.
- Package doc-lint baseline file paths or counts change before the corresponding implementation
  slice; re-baseline and append to `drift.md` rather than copying stale evidence.
