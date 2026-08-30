# Research — fix-saga-span-emission-and-correlation--0.0.7

## Re-baseline

- Carried-in source: issue #1368 and the owner briefing for branch
  `fix/saga-span-emission-and-correlation`.
- Re-derived against the owner-locked `origin/main` commit
  `f8b4f804cc5fe77054d4f220974eae66becf090c` on 2026-08-30.
- The worktree began clean and `HEAD` equals the locked commit. During S1, the local remote-tracking
  ref `origin/main` advanced to `952cc106aafea61570d24247695ac23f5d810026`; this leaf remains
  intentionally based on `f8b4f804` and was not rebased.
- What changed versus the carried-in defect statement:
  - The five cascade factory definitions still have zero callers; the statement is current.
  - The bus bridge already accepts an instrumentation dependency but never calls it.
  - The default compensator is not constructed in core: the thin `plugins/sagas` composition root
    constructs it, so one plugin wiring file is hidden scope.
  - Direct parentage cannot rely on ambient context because `saga.handle` ends before the bridge
    dispatches returned cascades. Explicit W3C context handoff is required.

## Doctrine Reading

### Archetypes and verdict

- Primary: Archetype 3, Runtime/Behavior, for `packages/plugin-sagas-core`. The package owns saga
  state-machine execution, dispatch seams, typed ports, and observability behavior. The doctrine
  verdict is **Keep**: preserve the runtime's domain ownership and make failure/telemetry semantics
  explicit rather than adding a parallel coordinator.
- Secondary: Archetype 5, Plugin Package, only for
  `plugins/sagas/src/runtime/create-durable-saga-runtime.ts`. Its thinness law permits composition
  wiring but forbids redefining the saga telemetry convention in the plugin.
- Public surface: modified exported types/constants flow through existing `./runtime` and
  `./telemetry` subpaths. No new subpath or export-map key is planned.
- Layering: semantic attribute names and span construction stay in core telemetry; runtime seams
  select domain values and invoke the factories; the plugin passes the same core instrumentation
  instance to the default core compensator.

### Axioms, anti-patterns, and fitness functions

- A1/A2/A5: one core convention, explicit injected dependencies, and explicit composition.
- A7/A8/A9: observable failures and deterministic state transitions; unsupported spawn attempts must
  not masquerade as success.
- A10/A11/A12/A13/A14: preserve public contracts, lifecycle symmetry, consumer proof, and
  independently testable ports.
- Avoid AP-1/AP-3/AP-8/AP-9/AP-10/AP-11/AP-14/AP-20/AP-23/AP-24/AP-25. In particular, do not add raw
  telemetry strings in runtime code, do not duplicate core conventions in the plugin, and do not add
  a second dispatch switch.
- Applicable gates: F-1 exports, F-3 dependency direction, F-5 folder/cardinality baseline, F-6
  public docs, F-7 JSR/package surface, F-8 deterministic tests, F-9 error preservation, F-10 no
  hidden side effects, F-11 resource lifecycle, F-12 runtime boundary tests, F-13 saga runtime
  invariants, F-14/F-15 dependency and composition integrity, and F-16 through F-19 consumer and
  generated-derivative freshness.

## Findings

| #  | Finding                                                                                                                                                                                                                                                   | How to verify                                                                                                                          |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Six span factories exist; only `startHandleSpan` has a production caller.                                                                                                                                                                                 | `rg -n "start(Handle\|Cascade).*Span" packages/plugin-sagas-core` and inspect `src/runtime/saga-engine.ts`                             |
| 2  | `SagaBusBridge` stores optional instrumentation but never uses it; its switch is the real send/schedule/complete/spawn dispatch seam.                                                                                                                     | `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts`                                                                           |
| 3  | `SagaCompensatorOptions` has only `id` and `clock`; missing handlers return `compensated: false`, and nested compensation throws before an observable span exists.                                                                                        | `packages/plugin-sagas-core/src/runtime/saga-compensator.ts`                                                                           |
| 4  | `saga.handle` is finished inside the engine before results reach the bridge. Ambient active context therefore cannot guarantee `handle -> cascade`.                                                                                                       | `packages/plugin-sagas-core/src/runtime/saga-engine.ts`                                                                                |
| 5  | Streams already expose a structural `spanContext()` and serialize it with `formatTraceparent`; this is the local precedent for explicit W3C handoff without importing OTel types into runtime domain code.                                                | `packages/plugin-streams-core/src/telemetry/instrumentation.ts`                                                                        |
| 6  | The default durable compensator is constructed by the thin plugin and currently receives only the clock, even though runner/supervisor composition already creates and supplies saga telemetry.                                                           | `plugins/sagas/src/runtime/create-durable-saga-runtime.ts`, `saga-runner.ts`, `saga-supervisor.ts`                                     |
| 7  | `createSagaRuntime` can give `engineOptions.instrumentation` to the engine while giving `undefined` to the bridge; the composition root must resolve one instrumentation value once.                                                                      | `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts`                                                                        |
| 8  | `spawn()` deliberately throws before creating an effect, but deserialized/structural `kind: 'spawn'` reaches the bridge's defensive rejection. That attempted dispatch is a real error seam, not dead vocabulary.                                         | `packages/plugin-sagas-core/src/public/messages.ts`, `src/adapters/saga-bus-bridge.ts`, `tests/runtime/checkout-saga-contract_test.ts` |
| 9  | The existing Flow-B validator asserts shared `netscript.correlation.id` across trigger/worker/RPC/stream spans but has no saga leg. The fixture callback is an active span and can publish a generated saga with `getTraceContext()`.                     | `packages/cli/e2e/src/application/gates/scaffold/{prepare-flow-b-fixture,validate-flow-b-traces}.ts`                                   |
| 10 | `netscript.correlation.id` and `netscript.saga.correlation_key` are distinct semantic fields. The inbound service currently maps correlation ID into the saga message correlation key, so they can have the same value while retaining distinct meanings. | `plugins/sagas/services/src/routers/v1-handlers.ts`, saga domain/runtime types                                                         |

## Factory Liveness Decision

All five cascade span names stay and must be emitted.

- `send`, `scheduled`, and `complete` are successful bridge dispatch/bookkeeping seams.
- `compensate` belongs around compensation execution in `SagaCompensator`, including missing-handler
  `skipped` and nested-defer/error outcomes. Emitting it only in the bridge would miss direct
  compensator calls and would place ownership outside the operation being measured.
- `spawn` is not a successful capability today, but the bridge accepts a structurally valid `spawn`
  effect and rejects it. Its span must therefore be emitted and completed with `error`. Deleting the
  factory loses a genuine attempted-operation diagnostic; finishing it successfully would falsely
  claim child-saga dispatch occurred.

Deleting the unused surface would keep today's tests green only because there are no call-site or
contract tests. It conflicts with the issue's observable runtime contract and removes named
diagnostics at real dispatch/error seams.

## Correlation Ownership Decision

The convention is split deliberately across three layers:

1. `SagaAttributes.CORRELATION_ID` owns the canonical `netscript.correlation.id` vocabulary in the
   telemetry attribute set.
2. Runtime seams resolve and propagate the value. For current messages, the resolved saga
   correlation key is the cross-plane ID fallback, so both attributes carry the same value without
   becoming aliases semantically.
3. Span factories assemble both attributes. Runtime code passes typed inputs and does not call
   `setAttribute()` with a raw string.

Putting the key only in factories without a typed runtime value would hide value selection; putting
the raw key in runtime would violate the core telemetry boundary; putting it only in the runtime
message/domain model would not guarantee every span emits it.

## Published Surface and Generated Derivatives

The change is additive but published: `SagaAttributesMap`, saga cascade input types,
`SagaTelemetrySpan`, `SagaEngineHandleResult`, `SagaCompensationRequest`/`Result`, and
`SagaCompensatorOptions` are exported through existing package subpaths. No export-map key changes.

The derivative cascade was derived from the writer implementations rather than recalled:

- `.llm/tools/docs/build-agent-docs-bundle.ts` deliberately excludes API docs and writes only
  `.llm/assets/agent-docs/prose.json.gz` plus provenance from prose inputs. API/type changes should
  not rewrite it, but `check:agent-docs-prose` remains a mandatory freshness negative.
- `.llm/tools/generate-publish-assets.ts` writes saga `package-metadata.generated.ts` from package
  release identity and writes shared embedded assets. No version changes are planned, but
  `check:publish-assets` remains mandatory.
- `.llm/tools/generate-cli-assets-barrel.ts` reads package names and `deno.json` export-map subpath
  keys through `readPackageExportMap()`, not exported symbols. No subpath changes are planned, but
  its `--check` mode (the non-mutating equivalent underlying `check:assets-barrel`) remains
  mandatory.

If any freshness check reports a shared generated asset stale, this run stops and reports it; it
does not regenerate assets while the coordinated corpus/doc-asset landing is in flight.

## jsr-audit Surface Scan

- Surface scanned: all 19 `packages/plugin-sagas-core/deno.json` exports plus publish dry-run.
- `deno task --cwd packages/plugin-sagas-core publish:dry-run`: exit `0`, 111 publish files, no
  slow-type failure.
- `deno task doc:lint --root packages/plugin-sagas-core --pretty`: exit `1`, nine unique existing
  private-type-reference findings (six in `otel-saga-telemetry.ts`, two in `sagas.contract.ts`, one
  in `prisma-saga-store.ts`), zero missing-JSDoc findings.
- `audit-jsr-package.ts --root packages/plugin-sagas-core --text`: exit `0`; warnings are the
  existing F-DOCT-5 root cardinality (`19 > 12`) and F-JSR-7's broad slow-type signal even though
  publish dry-run succeeds. The package is oRPC-bound and covered by the doctrine's sanctioned
  exception. The implementation must add no finding and must keep publish dry-run green.

## Open Questions

- None remain for the implementation plan. PLAN-EVAL must challenge the explicit context handoff,
  unsupported-spawn outcome, compensator ownership, and Flow-B fixture scope before S2 begins.
