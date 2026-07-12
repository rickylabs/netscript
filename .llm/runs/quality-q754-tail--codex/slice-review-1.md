# Slice Review 1 — quality-q754-tail--codex

- Reviewer: Claude Opus 4.8 (`claude-opus-4-8`), opposite-family Tier-A slice review (A1 gate)
- Date: 2026-07-12 (correction pass — re-reviews the **final** working-tree diff after the
  implementation moved off public `@orpc/server` interceptor types to package-owned exact structural
  types)
- Baseline (plan-gate): `d52294b8a92f95918271fa25890a792607e7d56b` — current `HEAD`; slice 1 is the
  uncommitted working-tree diff over that commit.
- Scope reviewed: **Slice 1** — telemetry dynamic-module (OTEL SDK) typing + oRPC handler-plugin
  typing, plus three prose-only lexical false-positive comment rewordings (aspire/sdk/bench).
- Files in diff (8, all in slice-1 scope): `packages/telemetry/src/adapters/otel/otel-sdk.ts`,
  `packages/telemetry/src/orpc/_types.ts`, `packages/telemetry/src/orpc/error-plugin.ts`,
  `packages/telemetry/src/orpc/tracing-plugin.ts`, `packages/telemetry/tests/orpc/plugin_test.ts`,
  `packages/aspire/src/application/build-vite-env-var-name.ts`,
  `packages/bench/tasks/t1-storefront-api/reference/netscript/router.ts`,
  `packages/sdk/src/cache/mod.ts`.

## Verdict

`PASS`

## Correction note (what changed since the prior draft)

An earlier draft of this file reviewed an intermediate implementation in which `_types.ts` derived
`GenericHandlerOptions`/`AnyInterceptor` from the public `@orpc/server` / `@orpc/server/standard`
surface (importing `StandardHandlerOptions` etc.). **That is not the final diff.** The final,
current implementation is **package-owned and self-contained**: `_types.ts` declares exact structural
interfaces/type aliases (`RootInterceptorOptions`, `RootInterceptor`, `ClientInterceptorOptions`,
`AnyInterceptor`, `GenericHandlerOptions`) with **no `@orpc/server` import and no new package
dependency**. This review describes and re-verifies that final form. Every claim below was
reproduced against the current working tree this session.

## Evidence (independently reproduced this session)

| Check | Command | Result |
| --- | --- | --- |
| Code-quality scanner (telemetry) | `scan-code-quality.ts --root packages/telemetry` | `{"ok":true,...,"findings":[],"allowCount":0}` — **0 findings, allowCount 0** |
| Scanner — comment sites (aspire/bench/sdk) | `scan-code-quality.ts --root packages/aspire --root packages/bench --root packages/sdk` | 1 finding: `sdk/src/client/http-client-link.ts:68` (`unsafe-cast`) — the named **slice-2** site, out of scope; the three slice-1 comment sites are clean |
| Telemetry check (canonical gate; includes `./orpc.ts`) | `deno task check` (packages/telemetry) | exit 0 |
| Scoped check wrapper | `run-deno-check.ts --root packages/telemetry --ext ts,tsx` | 100 files, `totalOccurrences:0`, 0 failed batches |
| Scoped lint wrapper | `run-deno-lint.ts --root packages/telemetry --ext ts,tsx` | exit 0, `totalOccurrences:0` |
| Telemetry tests | `deno task test` | **51 passed / 0 failed** (4 in `orpc/plugin_test.ts`) |
| Telemetry publish dry-run (F-6/JSR slow types) | `deno publish --dry-run --allow-dirty` | `Success`; **no slow types**; only the pre-existing sanctioned `unanalyzable-dynamic-import` warning (the intentional computed `@opentelemetry/*` loader at `otel-sdk.ts:201`) |
| Doctrine fit | `check-doctrine.ts --root packages/telemetry` | **FAIL=0**, exit 0 (5 WARN/1 INFO all pre-existing: `scheduler.ts`/`worker.ts` line caps, dir-child caps, missing `docs/architecture.md`, and the pre-existing `Deno.exit` A13 in `otel-sdk.ts` — **not** introduced by this slice) |
| Lock hygiene | `git diff -- deno.lock` after all gate runs | **clean, no churn** |
| Format | `deno fmt --check` on all 8 touched files | `Checked 8 files`, exit 0 |

## Substantive correctness / boundary soundness

- **oRPC plugin typing — package-owned structural callback types (L3).** `_types.ts` no longer uses
  `deno-lint-ignore no-explicit-any` + `(...args: any[]) => Promise<any>`. It now declares:
  - `RootInterceptorOptions { next(): Promise<unknown> }` and
    `RootInterceptor = (options: RootInterceptorOptions) => Promise<unknown>`;
  - `ClientInterceptorOptions { readonly input: unknown; readonly path: readonly string[]; next():
    Promise<unknown> }` and `AnyInterceptor = (options: ClientInterceptorOptions) =>
    Promise<unknown>`;
  - `GenericHandlerOptions { rootInterceptors?: RootInterceptor[]; clientInterceptors?:
    AnyInterceptor[] }`.

  These are **compatible with the fields oRPC actually supplies**. oRPC's procedure-client
  interceptor options expose `input: unknown`, `path: readonly string[]`, and a `next()` (the
  `next` element comes from `@orpc/shared`'s `InterceptorOptions`); the root-handler interceptor
  supplies `next()`. The declared shapes are exact structural subsets of those real objects, and an
  interceptor **callback is contravariant in its parameter** — declaring only the fields the plugin
  reads is sound because oRPC passes a superset at the wiring site. `path: readonly string[]` is the
  key correctness point: it matches oRPC's segment array, which is why `options.path.join('.')` is
  statically valid and why the error-path test fixture had to become an array (see below). This is a
  boundary contract owned exactly at the seam that consumes it — no speculative shared abstraction
  (AP-9), no `@orpc/server` value/type dependency added, no lock churn.

- **`tracing-plugin.ts` — helpers replaced by typed field access.** The removed `readNext`/`readPath`
  reflection helpers are correctly replaced by direct `options.next()`, `options.path.join('.')`,
  and `options.input`. Behavior is preserved: the old `readNext` did
  `Promise.resolve(next.call(source))` (binding `this` to the options object); `options.next()` is a
  method call binding `this` to the same options object, and the `await` subsumes the former
  `Promise.resolve` wrapper. The old `readPath` handled both `string` and `string[]`; the
  `string`-branch is now correctly gone because the type is `readonly string[]`, matching oRPC's
  contract. The root interceptor reads only `next`, consistent with `RootInterceptorOptions`. Both
  interceptor callbacks are now written as bare `async (options) => …` with the parameter type
  **inferred** from the array element type — no `: unknown` residue, no cast.

- **`error-plugin.ts` — typed directly.** `init(handlerOptions, _router?: unknown)` drops the
  `_router?: any` + its lint-ignore. The client interceptor is `async (options) => { const
  procedurePath = options.path.join('.'); … }` — the previous defensive
  `Array.isArray(options.path) ? … : String(options.path)` branch is **removed** in the final diff,
  so the code now matches `tracing-plugin.ts` and relies on the `readonly string[]` contract. `.next()`
  is called through the typed option. No `any`, no cast, no suppression.

- **OTEL dynamic-module typing (L2, A6).** `loadSdkModule` now returns `unknown` (the
  `deno-lint-ignore no-explicit-any` + `Record<string, any>` are gone). Six `assert*Module`/handle
  guards (`assertResourceModule`, `assertTraceExporterModule`, `assertTraceSdkModule`,
  `assertMetricExporterModule`, `assertMetricSdkModule`, plus
  `assertTracerProviderHandle`/`assertMeterProviderHandle`) validate exactly the
  constructors/functions consumed at the seam (`Resource`/`resourceFromAttributes`,
  `OTLPTraceExporter`, `BatchSpanProcessor`/`NodeTracerProvider`, `OTLPMetricExporter`,
  `MeterProvider`/`PeriodicExportingMetricReader`, and `register`/`forceFlush`/`shutdown`/`getMeter`)
  via `typeof` predicates and throw `TypeError` on mismatch. The guards use `asserts value is X`
  narrowing — no `as`/`as unknown as`. `resourceFromAttributes` is guarded as optional
  (`undefined` or function), preserving the existing feature-detect `typeof … === 'function'`
  fallback to `new Resource(...)`. Guards live only at the real dynamic/upstream boundary — no
  speculative abstraction (AP-9), no primitive rename (AP-2). Sound.

- **Suppression/cast accounting.** The diff **removes 4** `deno-lint-ignore no-explicit-any`
  directives (otel-sdk loader, `_types.ts` `AnyInterceptor`, error-plugin `_router`, error-plugin
  client push) and the `Record<string, any>` return, and **adds none**. No new `any`, no new
  `as`/`as unknown as`, no new `deno-lint-ignore`. Confirmed by the clean `quality:scan` (0 findings,
  allowCount 0) — the exact gate that let `any`+cast reach `main` in #745.

- **Test update.** `plugin_test.ts` adds a small `invokeInterceptor` reflection shim (test-only, so
  a plain object literal can be handed to the typed interceptor) and changes the error-path fixture
  `path` from the string `'v1.users.get'` to `['v1','users','get']` — **required** by the corrected
  `path: readonly string[]` contract, keeping the error branch exercised. The success-path fixture
  already used `['v1','users','list']`. 4/4 orpc tests and 51/51 package tests pass.

- **Lexical rewordings (faithful, prose-only).** aspire "any → every process env var" (Vite does
  replace all `VITE_*`, accurate); bench `{ '~orpc': any }` → "expose only an opaque `~orpc` marker"
  (preserves the type-erasure point); sdk cache "any server-side code → server-side code" (generic
  quantifier dropped). No behavioral or type change; the scanner lexical hits at these three sites
  are cleared.

## Public-surface coherence / doctrine / hygiene

- `_types.ts` now **exports** three additional symbols (`RootInterceptorOptions`, `RootInterceptor`,
  `ClientInterceptorOptions`). Publish dry-run confirms these introduce **no slow types** and the
  package still simulates a clean publish (`Success`), with only the pre-existing sanctioned
  dynamic-import warning. Because the types are package-owned, this slice adds **no** new
  `@orpc/server` import to the public graph; the pre-existing `@orpc/contract`/`@orpc/otel` usages in
  the orpc plugins are unchanged. `deno.lock` untouched. No file crosses the 500-line cap as a
  result of this slice; no new doctrine FAIL.

## Non-blocking observations (not gate failures)

1. The remaining scanner finding (`sdk/src/client/http-client-link.ts:68`, `unsafe-cast`) is named
   slice-2 work and is correctly untouched here; likewise the slice-3 plugin sites. Flagged only to
   confirm the residual count is out-of-scope, not a slice-1 regression.
2. `RootInterceptorOptions` intentionally models only `next()` because the telemetry root
   interceptor reads nothing else off the root option object. This is deliberate minimalism at the
   boundary, not an omission — if a future root interceptor needs `path`/`input`, the field is added
   to the interface then.

## Slice-gate conclusion

Slice 1 achieves its proving gate on the **final** diff: the telemetry OTEL dynamic boundary and the
oRPC handler-plugin boundary are typed through runtime guards and package-owned exact structural
interceptor types that match the fields oRPC supplies, with **zero allowances, zero new
suppressions/casts, zero new dependency, zero lock churn**, and the three lexical false positives are
removed without semantic drift. Scanner, canonical + scoped check, scoped lint, tests, publish
dry-run (no slow types), doctrine (FAIL=0), and fmt all reproduce green within scope. No FAIL_FIX
finding. Cleared for the supervisor sign-off commit.
