# Evaluation: G3 #842 type-safe desktop bindings

Independent opposite-family evaluator session: `qwen/qwen3.7-max` on Claude Code + OpenRouter
(`formal_evaluation` lane). Separate from the Codex Sol·high generator (thread `019f7235`) and the
Fable 5 supervisor. Worktree `/home/codex/repos/wt-g3-842` (branch
`feat/desktop-frontend-842-bindings`), commits `a77b210c` / `71efb789` / `007f2be2` against the
integration baseline `feat/desktop-frontend` @ `e6e1be08`.

## Metadata

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g3-842-bindings`                            |
| Target         | `@netscript/sdk/desktop` + `@netscript/fresh/desktop` type-safe RPC bindings |
| Archetype      | `4 — Public DSL / Builder` plus adapter/runtime subtype gates                |
| Scope overlays | `frontend` (browser/Aspire no-op boundary; UI/route/island/visual N/A)       |
| Evaluator      | `qwen/qwen3.7-max` on `formal_evaluation` lane · 2026-07-18                  |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                          |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = `PASS` issued by Fable 5 supervisor; D1–D16 locked; Tier-A review PASS recorded in `worklog.md` after each slice.                |
| Design section exists in worklog       | PASS   | `worklog.md` § Design — public surface, domain vocabulary, ports, protocol state, constants, slices, deferred scope, contributor path all present. |
| Commit slices match design plan        | PASS   | 3 slices in planned order; git log: `feat(sdk)`, `feat(fresh)`, `test(desktop) consumer`; every slice under 30 files.                            |
| Each slice has a passing gate          | PASS   | `worklog.md` § Gate Results: SDK 36/36, Fresh 206/206, wrapper sets, quality, architecture, doc-lint, JSR, and raw dry-runs all recorded as PASS.  |
| No speculative seams (unused files)    | PASS   | Every desktop source file is referenced by implementation or test; consumer fixtures use only public subpaths; no dead module in changed set.     |
| Constants used for finite vocabularies | PASS   | `domain/constants.ts` (SDK) and `constants.ts` (Fresh) define all operations/statuses/reasons with derived literal unions in both `types.ts`.    |

## Static Gates

| Gate                         | Result | Evidence                                                                                                   | Notes                                                                  |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| SDK full tests               | PASS   | `deno task --cwd packages/sdk test` → `36 passed, 0 failed (2s)`. Full `packages/sdk/tests/` authoritative. | Not a curated list; ran live.                                          |
| Fresh full tests             | PASS   | `deno task --cwd packages/fresh test` → `206 passed, 0 failed (4s)`. Full `src` + `tests` task.            | Desktop fixtures included.                                             |
| SDK scoped check             | PASS   | `run-deno-check.ts --root packages/sdk --ext ts --pretty` → `uniqueOccurrences: 0`.                        |                                                                        |
| Fresh scoped check           | PASS   | `run-deno-check.ts --root packages/fresh --ext ts,tsx --pretty` → 170 files including consumer fixture.     |                                                                        |
| Root quality:scan            | PASS   | `deno task quality:scan` → `ok:true, findings:[], allowCount:7` (pre-existing unrelated allowances).       | No new finding attributable to desktop source.                           |
| Root arch:check              | PASS   | `deno task arch:check` → only pre-existing baseline WARNs (CLI/plugins). No new finding.                   |                                                                        |
| SDK doc:lint baseline        | PASS   | `deno task doc:lint --root packages/sdk --pretty` → `combinedTotal: 1` (transitive `plugin-streams-core`).  | Baseline preserved; desktop contributes 0.                             |
| Fresh doc:lint baseline      | PASS   | `deno task doc:lint --root packages/fresh --pretty` → `combinedTotal: 40` (23 private + 17 missing JSDoc).  | Route/query/streams graphs only; desktop contributes 0.                |
| SDK desktop entrypoint lint  | PASS   | `deno doc --lint src/desktop/mod.ts` (in `packages/sdk`) → `Checked 1 file`, zero diagnostics.             | Independently clean.                                                   |
| Fresh desktop entrypoint lint | PASS  | `deno doc --lint src/runtime/desktop/mod.ts` (in `packages/fresh`) → `Checked 1 file`, zero diagnostics.   | Independently clean.                                                   |
| No text/JSON imports (SDK)   | PASS   | `rg` over `packages/sdk/src/desktop/` → none of `with {type:`, `assert {type:`, or text/JSON file refs.    | Pure TypeScript sources.                                               |
| No text/JSON imports (Fresh) | PASS   | `rg` over `packages/fresh/src/runtime/desktop/` → zero import-attribute or runtime file-read constants.    | Pure TypeScript sources.                                               |
| Export-map reachability      | PASS   | Both `deno.json` files expose `./desktop` mapping to the new `mod.ts`; root READMEs document but do not re-export. | Per D1.                                                       |

## Fitness Gates

| Gate                                       | Result             | Evidence                                                                                                          | Violations |
| ------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| F-1 file-size lint                         | PASS               | Every desktop source file is under 300 lines (largest, `bind-channel.ts`, 292).                                   | 0          |
| F-2 helper-reinvention scan                | PASS               | SDK uses real `MessageChannel`, oRPC `RPCLink`, `RPCHandler.upgrade`. No bespoke event bus, queue, or serializer. | 0          |
| F-3 layering check                         | PASS               | Fresh desktop imports SDK desktop subpath; SDK desktop imports only oRPC and its own `ports/service-client.ts`.   | 0          |
| F-4 inheritance audit                      | PASS               | `DesktopBindingUnavailableError`/`DesktopBindingProtocolError` extend `Error` only. No class hierarchies.         | 0          |
| F-5 public surface audit                   | PASS               | `./desktop` modules explicitly re-export named symbols; no `export *`; root barrels documented but do not re-exp. | 0          |
| F-6 JSR publishability — new entrypoint    | PASS               | Both `deno publish --dry-run --allow-dirty` exit 0; intended file lists only; no actual slow-type diagnostic.    | 0          |
| F-7 doc-score gate                         | PASS_WITH_BASELINE | SDK baseline 1 (unrelated), Fresh baseline 40 (unrelated); new desktop entrypoints 0 each.                        | 0          |
| F-8 workspace `lib` override               | PASS               | No `deno.json` `lib` override introduced.                                                                         | 0          |
| F-9 permission declaration                 | PASS               | Desktop source has no `Deno.env`, `Deno.readFile`, `fetch`, or ambient global mutation.                           | 0          |
| F-10 test-shape audit                      | PASS               | Real `Deno.test` with structural fixtures; no snapshot-driven assertion.                                         | 0          |
| F-11 forbidden-folder lint                 | PASS               | No forbidden folder inside the new trees.                                                                         | 0          |
| F-12 naming-convention lint                | PASS               | kebab-case files, PascalCase classes/types, SCREAMING_SNAKE constants.                                            | 0          |
| F-13 runtime subtype (adapter)             | PASS               | send/receive/close FIFO, close-before-responder, single pending waiter, exact-once close, isolation all tested.   | 0          |
| F-14 console-log lint                      | PASS               | No `console.*` in production desktop source of either package.                                                    | 0          |
| F-15 re-export-of-upstream lint            | PASS               | oRPC types consumed internally; no upstream private type re-exported.                                             | 0          |
| F-16 folder-cardinality lint               | PASS               | `packages/sdk/src/desktop/{domain,adapters,application}` and `packages/fresh/src/runtime/desktop` ≤ doctrine cap. | 0          |
| F-17 abstract-derived co-location          | N/A                | No abstract-derived pattern in scope.                                                                             | 0          |
| F-18 sub-barrel lint                       | PASS               | No nested `mod.ts` re-barreling inside the desktop trees.                                                         | 0          |
| F-19 scoped source gate runners            | PASS               | Exact + focused `quality:scan`, both `arch:check:repo` runs pass.                                                 | 0          |

## Runtime Gates

| Gate                                              | Result | Evidence                                                                                                                                        |
| ------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Cast-free structural `SupportedMessagePort` (D7)  | PASS   | `packages/sdk/tests/desktop/bind-channel_test.ts:35` assigns `const supported: SupportedMessagePort = client.port;` using shipped oRPC 1.14.6 — zero cast. Live `rg` for `as unknown as` / `as any` / `@ts-ignore` / `deno-lint-ignore` over production surfaces and tests returns none in production; only one legitimate `@ts-expect-error` in SDK negative compile fixture (line 42, `id: 42` input rejected by contract). |
| Typed oRPC round-trip (string)                    | PASS   | `packages/sdk/tests/desktop/desktop-rpc-client_test.ts` line 13: real `RPCHandler` + `createDesktopServiceClient` round-trips `echo` with typed `{ echoed: 'desktop' }`. |
| `Uint8Array` payload across the window seam       | PASS   | `bind-channel_test.ts` line 49: top-level native payload asserted `instanceof Uint8Array` at the `invoke` seam; `desktop-rpc-client_test.ts` line 37: `client.bytes(undefined)` round-trip asserts byte equality. |
| `{name,message,stack}` error mapping              | PASS   | `bind-channel_test.ts` line 118: `normalizeDesktopBindingError` rehydrates a plain `{name,message,stack}` rejection into a real `Error` preserving all three fields. `bind-desktop-rpc-window_test.ts` line 168 proves an oRPC procedure error crosses with `instanceof ORPCError`, message + stack intact. |
| Per-window isolation                              | PASS   | `bind-channel_test.ts` line 74 — two concurrent windows sharing the same protocol receive prefixed responses; `bind-desktop-rpc-window_test.ts` line 133 — two Fresh windows with distinct routers receive distinct outputs through same-named bindings. |
| Idempotent close & single pending waiter          | PASS   | `bind-channel_test.ts` line 98 — double close emits exactly one close event, rejects a second pending receive, resolves close sentinel, and client observes terminal `CLOSED` result. |
| Browser/Aspire no-op parity (Fresh)               | PASS   | `bind-desktop-rpc-window_test.ts` line 44 — `runtime: null` (browser) and `runtime: {}` (Aspire) both return `disabled/not-desktop` with 0 `bind` calls and 0 native invocations. Line 75 — missing window returns `missing-window` inert lifecycle. |
| Fresh idempotent unbind                           | PASS   | `bind-desktop-rpc-window_test.ts` line 128 — `Promise.all([binding.close(), binding.close()])` resolves with exactly 1 bind + 1 unbind call.   |
| oRPC serializer parity (string/binary)            | PASS   | `orpc-serialization.ts` defines symmetric `DESKTOP_UINT8_ARRAY_SERIALIZER`; used by both `RPCLink` and `RPCHandler` via `DESKTOP_RPC_JSON_SERIALIZERS`. |

## Consumer Gates

| Consumer                                     | Result | Evidence                                                                                                                                              |
| -------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/sdk/desktop` webview consumer    | PASS   | `packages/sdk/tests/type-fixtures/desktop-consumer_type.ts` imports only the published surface, declares an existing contract, infers `ServiceClient<typeof ordersContract>`, calls typed procedure, and the `@ts-expect-error` on line 42 proves wrong input is rejected. No `bindings.d.ts`, no ambient declaration. |
| `@netscript/fresh/desktop` runtime consumer  | PASS   | `packages/fresh/tests/type-fixtures/desktop-consumer_type.ts` imports only `@netscript/fresh/desktop`, declares a `DesktopBindableWindow`, constructs a `contextOs.router`, binds it with a concrete context, and observes `DesktopRpcWindowBinding` + discriminated statuses. |
| Fresh cross-package compile                  | PASS   | `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts` imports `createDesktopBindServerPort`, `DEFAULT_DESKTOP_RPC_BINDING`, `DESKTOP_RPC_JSON_SERIALIZERS` from `@netscript/sdk/desktop` — the only declared dependency on the SDK subpath. `deno task --cwd packages/fresh test` passes 206/206 with this cross-package link. |

## Anti-Pattern Check

| AP    | Status         | Evidence                                                                                                 | Notes                                                                  |
| ----- | -------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| AP-1  | CLEAR          | Largest desktop file is 292 lines; constants, types, adapters, application, and Fresh composition split. | Under review thresholds.                                               |
| AP-2  | CLEAR          | Adapter justified by bidirectional semantics, error normalization, isolation, and typed composition.     | Not a rename; documented seam.                                         |
| AP-3  | N/A            |                                                                                                          |                                                                        |
| AP-4  | N/A            |                                                                                                          |                                                                        |
| AP-5  | N/A            |                                                                                                          |                                                                        |
| AP-6  | N/A            |                                                                                                          |                                                                        |
| AP-7  | CLEAR          | Each public factory accepts one named options object (`CreateDesktop*Options`, `BindDesktop*Options`).   | No positional ladder.                                                  |
| AP-8  | CLEAR          | Narrow factories; no container or service locator.                                                       |                                                                        |
| AP-9  | CLEAR          | One bind transport; one Fresh composition root; no bus/registry hierarchy.                               |                                                                        |
| AP-10 | N/A            |                                                                                                          |                                                                        |
| AP-11 | CLEAR          | No module-load binding/global cache; activation is at factory/bind call only.                            |                                                                        |
| AP-12 | N/A            |                                                                                                          |                                                                        |
| AP-13 | CLEAR          | Failures reject/close structurally; no `console.*` in production desktop source.                         |                                                                        |
| AP-14 | CLEAR          | oRPC upstream types consumed via package-owned structural ports; no re-export of `AnyRouter`/`RPCLink`.  | `AnyRouter` imported in Fresh is used only as an internal guard guard. |
| AP-15 | CLEAR          | `bindDesktopRpcWindow`, `DesktopBindableWindow`, `DesktopRpcWindowBinding`, etc. narrow names.           | No `I*`, `Impl`, `Manager`.                                            |
| AP-16 | CLEAR          | `globalThis.bindings` resolved via `Reflect.get` from `unknown`; `Deno.BrowserWindow` from `unknown`.    | No ambient `declare` in published source.                              |
| AP-17 | N/A            |                                                                                                          |                                                                        |
| AP-18 | N/A            |                                                                                                          |                                                                        |
| AP-19 | CLEAR          | SDK and Fresh desktop `mod.ts` files carry `@module` docs describing permission/trust boundary.          | READMEs include the 80% caller path.                                   |
| AP-20 | CLEAR          | Fresh imports SDK desktop exports; neither reaches into the other's internals.                           |                                                                        |
| AP-21 | N/A            |                                                                                                          |                                                                        |
| AP-22 | CLEAR          | Both `./desktop` are declared export-map subpaths, not convenience barrels.                              |                                                                        |
| AP-23 | CLEAR          | Consumer fixtures use only published subpaths (`@netscript/sdk/desktop`, `@netscript/fresh/desktop`).    | No deep import in any example.                                         |
| AP-24 | CLEAR          | `rg` reports zero `with {type:` / `assert {type:` / text-JSON asset import in new surfaces.             |                                                                        |
| AP-25 | CLEAR          | Native `bindings`, `Deno.BrowserWindow`, and oRPC activation are confined to named edge modules.         |                                                                        |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                                   |
| --------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| New entries           | 0     | None in `debt/arch-debt.md`.                                                                               |
| Resolved entries      | 0     | None in scope.                                                                                             |
| Deepened violations   | 0     | Fresh's pre-existing 40-finding doc graph unchanged; new desktop entrypoint contributes 0.                  |
| Unrecorded violations | 0     | No new ambient, no new cast, no new suppressed lint, no new console side effect attributed to the change.  |

## Issue #842 Acceptance Verification

### Box 1 — Typed round-trip plus error/bytes/isolation

| Required capability                 | Real test                                                                                                                     | Verdict |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| Typed `ServiceClient<TContract>`    | `desktop-rpc-client_test.ts` line 13 + `sdk/tests/type-fixtures/desktop-consumer_type.ts` prove identical HTTP/Desktop typing. | PASS    |
| `{name,message,stack}` error mapping | `bind-channel_test.ts` line 118 rehydrates a cross-realm native error preserving all three fields.                            | PASS    |
| Procedure error round-trip          | `bind-desktop-rpc-window_test.ts` line 168 throws `ORPCError` and asserts typed name/message/stack on the client side.       | PASS    |
| `Uint8Array` payload preservation   | `bind-channel_test.ts` line 49 asserts native payload is an `Uint8Array` instance; line 37 of `desktop-rpc-client_test.ts` asserts round-trip byte equality. | PASS    |
| Per-window isolation                | `bind-channel_test.ts` line 74 and `bind-desktop-rpc-window_test.ts` line 133 prove two same-named bindings share no state.   | PASS    |

### Box 2 — Browser/Aspire no-op parity + JSR rubric

| Required capability                 | Real test                                                                                                                     | Verdict |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| Browser no-op                       | `bind-desktop-rpc-window_test.ts` line 44 — `runtime: null` → `disabled/not-desktop`, 0 bind calls.                          | PASS    |
| Aspire no-op                        | `bind-desktop-rpc-window_test.ts` line 60 — `runtime: {}` → `disabled/not-desktop`, 0 bind calls.                            | PASS    |
| Missing-window no-op                | `bind-desktop-rpc-window_test.ts` line 75 — `runtime: DESKTOP_RUNTIME` without window → `missing-window` inert lifecycle.    | PASS    |
| JSR rubric `@netscript/sdk/desktop` | Entrypoint doc-lint 0; full SDK doc baseline unchanged at 1; raw dry-run zero slow-type; production file list intended only. | PASS    |
| JSR rubric `@netscript/fresh/desktop` | Entrypoint doc-lint 0; full Fresh doc baseline unchanged at 40; raw dry-run zero slow-type; file list intended.            | PASS    |

### `Closes #842` claim

- `plan.md` § Scope covers both live boxes of issue #842 (bind-channel port shim, typed client, binary/error/isolation tests, SDK/Fresh split, browser/Aspire no-op).
- `plan.md` § Non-Scope and `worklog.md` § Deferred Scope explicitly exclude native packaged-app E2E (owned by #457/#452/#456), desktop window creation/UI (#843), Aspire service-discovery changes, and `experimental_transfer`. These are documented as outside #842; the implementation does not silently claim them.
- No false-claim observed: every #842 acceptance point proven above is genuinely covered by this PR.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| (none)   | —       | —        | —               |

No blocking or non-blocking finding. The negative-fixture `@ts-expect-error` in
`packages/sdk/tests/type-fixtures/desktop-consumer_type.ts:42` is documented with a
`quality-allow` comment and serves to exercise that `id: 42` is rejected by the typed contract;
it is not a compatibility cast. The `AnyRouter` import in
`packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts:2` is used only as an internal
structural guard (`isOrpcRouter`) and is not re-exported.

## Lessons for Promotion

| Lesson                                           | Pattern                                                                                              | Applies to    | Confidence |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------- | ---------- |
| Structural assignability replaces compatibility casts | Declare the package-owned port narrowly, derive its public interface from shipped oRPC types, and prove direct assignment in a real test. | Archetype 4   | high       |
| Full package test tasks are the authoritative gate | Focused edit-loop tests accelerate iteration but are not the slice verdict; the full package task proves the claim. | Archetype 2–4 | high       |
| Negative compile fixtures serve D7              | A `@ts-expect-error` in a type fixture is a legitimate way to prove rejection of wrong input types without ambient declarations. | Archetype 4   | high       |
| Symmetric serializer ownership                   | When a JSON serializer is required on both link and handler, co-own it in the transport package and share via the published subpath. | Archetype 2/4 | medium     |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Rationale | Plan-Gate PASS preceded implementation. Three slices match the plan; Tier-A PASS followed each; all locked decisions (D1–D16) are realized in production code. The D7 cast-free bar holds: production surfaces contain no `as unknown as`, `as any`, `@ts-ignore`, or `deno-lint-ignore`; a structural `SupportedMessagePort` assignment is proven against shipped oRPC 1.14.6. SDK full tests pass (36/36) and Fresh full tests pass (206/206) — authoritative package verdicts, not curated lists. Both issue-#842 acceptance boxes are genuinely covered with real tests for typed round-trip, `Uint8Array`, `{name,message,stack}` error mapping, per-window isolation, and browser/Aspire zero-side-effect no-op parity. JSR rubric is independently zero on both new `./desktop` entrypoints; full SDK (1) and Fresh (40) doc baselines are unchanged. Export maps, READMEs, and consumer fixtures prove both public self-subpaths. Quality, architecture, lint, fmt, and check gates clean. Arch-debt delta is zero. `Closes #842` is honest; #457 packaged-app E2E is correctly documented as out of scope. Evaluator ran every gate live and did not rely on the worklog's self-reported results. |

PASS
