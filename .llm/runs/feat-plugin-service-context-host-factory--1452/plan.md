# Plan — #1452 Slice 1: publish `createLazyKv()` and adopt it in the scaffold

**PLAN-EVAL: N/A for Slice 1.** No design decision remains: the returned shape is fully dictated by
the existing `WatchableKv` interface, the implementation is a mechanical extraction of an existing
69-line class, and it introduces no new dependency edge. **Slice 2 is explicitly NOT covered by this
N/A** — see "Deferred" below; it carries genuine architectural questions and should get a PLAN-EVAL
or an owner ruling before anyone implements it.

## Harness profile and doctrine state

- `packages/kv`: Archetype 2 — Integration. `createLazyKv()` is the composition helper for the
  package-owned `WatchableKv` port and existing shared `getKv()` resolver.
- `packages/cli`: Archetype 6 — CLI/Tooling. This slice changes one exempt asset template and its
  generated carrier; it introduces no command, spine, layer-2 abstract, registry, port, adapter, or
  composition-surface change.
- Scope overlays: none.
- Current doctrine verdicts: `packages/kv` is **Refactor** for the pre-existing 1,039-line
  `bridge_test.ts`; `packages/cli` is **Keep**. The new focused `lazy-kv_test.ts` does not deepen the
  KV debt, and no debt entry is created or closed.
- Anti-patterns in scope: AP-1 (keep implementation/test focused), AP-2/AP-9 (the helper is justified
  by removing an identical package-contract wrapper from every generated consumer), AP-11 (no
  module-load-time KV resolution), AP-18 (semantic scaffold assertion, not a giant snapshot), and
  AP-22 (the existing application barrel is a package sub-surface already used by the root barrel).

## Open-decision sweep

- **Safe to defer:** whether `@netscript/plugin` may depend on `@netscript/kv`; the database-client
  resolver injection shape; the absent `appsettings` contract; and the Slice 2 generated-consumer
  boot proof. None changes the Slice 1 `WatchableKv` forwarding contract.
- **Must resolve now:** none. Any need to edit `packages/plugin/` or introduce another public
  parameter/export is a rescope and stops this slice.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Eager resolution regresses generated-service startup | Observe that resolution count is zero after `createLazyKv()` and one after the first operation. |
| Multiple operations resolve more than once | Use a recording resolver/adapter fixture and assert one resolution across two operations. |
| A forwarding member or async generator changes semantics | Exercise every required `WatchableKv` member and compare arguments/results, including async disposal delegating to `close()`. |
| Template extraction changes unrelated host composition | Diff the template and require only the import/class/construction substitution. |
| Embedded asset carrier goes stale | Regenerate with `deno task gen:assets-barrel` and run `check:assets-barrel`. |
| New public export drifts from docs/JSR requirements | Add an explicit return type and public JSDoc; run KV doc lint, JSR audit, `docs:exports-drift`, and `mcp-export-corpus`. |
| Validation mutates the lock | Hash `deno.lock` before and after; do not accept lock churn. |

## Gate set

- Scoped structured check/lint/fmt for `packages/kv` and `packages/cli`, with non-empty stdout
  verified when a receipt is used.
- `packages/kv` tests and the focused CLI plugin-service template/scaffold test suite.
- `check:assets-barrel`, `docs:exports-drift`, and `mcp-export-corpus`.
- Package-wave fitness: KV doc lint/JSR audit plus `quality:scan` and `arch:check`.
- `deno.lock` SHA-256 equality against the re-baselined starting hash.
- Runtime/Aspire/Docker/browser and `e2e:cli` gates are explicitly forbidden for this lane.

## Planned JSR surface scan

`createLazyKv(config?: SharedKvConfig): WatchableKv` adds one stable root export without changing
`deno.json`, subpaths, dependencies, permissions, or publish filters. The implementation must carry
an explicit return type and complete JSDoc. The main risks are a missing public example/doc entry and
an unintended second export from the internal module; full-export doc lint and the export drift
gates cover both.

## Locked decisions (Slice 1)

- **LD-1.** Publish `createLazyKv(config?: SharedKvConfig): WatchableKv` from `@netscript/kv`. It
  defers `getKv(config)` until the first operation, then delegates every `WatchableKv` member to the
  resolved instance, memoizing the resolution promise (never calling `getKv` twice).
- **LD-2.** Implementation lives in its own single-reason module under `packages/kv/application/`
  (do not append it to `shared.ts`), exported through `packages/kv/application/mod.ts` and re-exported
  from `packages/kv/mod.ts` alongside `getKv`.
- **LD-3.** Behaviour must match the existing `LazyPluginKv` exactly, including `supportsWatch = true`,
  the async-generator delegation for `list`/`watch`/`watchPrefix`, and `[Symbol.asyncDispose]`
  delegating to `close()`. Read the template's class as the reference implementation.
- **LD-4.** The scaffold template
  (`packages/cli/src/kernel/assets/plugins/service-context.ts.template`) deletes its local
  `LazyPluginKv` class and imports `createLazyKv` from `@netscript/kv` instead. Everything else in the
  template — `getDatabaseClient`, the `createPluginServiceContext` factory, contracts/logger/env
  composition — is **unchanged**.
- **LD-5.** Regenerate `packages/cli/src/kernel/assets/embedded.generated.ts` via
  `deno task gen:assets-barrel` and commit it (standing generated-carrier exemption).

## Ceiling

- `packages/kv/application/lazy-kv.ts` (new)
- `packages/kv/application/mod.ts`
- `packages/kv/mod.ts`
- `packages/kv/tests/lazy-kv_test.ts` (new)
- `packages/cli/src/kernel/assets/plugins/service-context.ts.template`
- `packages/cli/src/kernel/assets/embedded.generated.ts` (regenerated carrier)
- `packages/cli/src/kernel/templates/plugins/generate-plugin-service_test.ts` **only if** it asserts
  on the removed class's presence (checked: it does not reference `LazyPluginKv` today — touch only
  if a scaffold-output assertion actually breaks)

Anything else is a rescope: stop, append `drift.md`, report.

## Required test coverage

- **Laziness proven, not assumed:** `getKv` must NOT be invoked at `createLazyKv()` call time, and
  must be invoked on the first operation. Prove it by observation (e.g. construct, assert no
  resolution has occurred, then perform one operation and assert it has) rather than asserting only
  the happy-path result.
- **Memoization:** two operations resolve the underlying KV exactly once.
- **Delegation:** each `WatchableKv` member forwards to the resolved instance, including the three
  async-generator members (`list`/`watch`/`watchPrefix`) and `[Symbol.asyncDispose]` → `close()`.
- Follow `packages/kv`'s own existing test conventions (`packages/kv/tests/`, and the in-memory
  adapter/testing helpers under `packages/kv/src/testing/` — read these first rather than inventing a
  new fixture).

## Tier-A stop

Scoped `check`/`lint`/`fmt` (`packages/kv` and `packages/cli`); `packages/kv` test suite; the CLI
template/scaffold test suite; `check:assets-barrel`; `docs:exports-drift` (a new public symbol is
exported from `@netscript/kv`); `mcp-export-corpus`; `deno.lock` hash check.

**Known tooling gap (D-1, filed on `#1591`'s leaf):** `run-gate.ts`'s `check`/`lint`/`fmt-check`
gates can return `PASS`/`exitCode 0` with **zero-byte stdout** and a `(cached, inputs unchanged)`
stderr marker. Check `stdout.bytes` before trusting any such receipt; re-run via direct `deno run` of
the wrapper script if the cache marker is present.

## Deferred to Slice 2 — needs a decision, not an implementer

Not in this slice, and **not to be attempted opportunistically**:

1. Whether `@netscript/plugin` may take a `@netscript/kv` dependency in order to publish the full
   `createPluginServiceContext()` from `@netscript/plugin/sdk` (where the contract already lives).
   The base plugin package deliberately does not depend on kv today; every `plugin-*-core` package
   does. This is an architecture call.
2. The injection shape for the project-relative db-client resolver (`../../database/mod.ts`), which
   no published package can resolve on a consumer's behalf.
3. The undefined `appsettings` scope named in the issue's acceptance but absent from the codebase.
4. The issue's "generated-consumer test proving workers/auth/sagas services boot with the public
   factory" — meaningful only once (1) and (2) are settled.

## Acceptance (Slice 1 only)

- [ ] `createLazyKv()` published from `@netscript/kv`, behaviour-identical to the template's class.
- [ ] Laziness and memoization proven by observation, not assumed.
- [ ] Scaffold template imports it; its local `LazyPluginKv` class is gone; nothing else in the
      template changes.
- [ ] `embedded.generated.ts` regenerated and committed; `check:assets-barrel` green.
- [ ] Ceiling respected; `deno.lock` byte-identical.
- [ ] PR carries `Refs #1452` — **partial, no closing keyword** — and states plainly what Slice 2
      leaves open.
