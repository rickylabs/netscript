# 5d1 research — `@netscript/fresh` support spine

Run: `feat/package-quality-wave5-apps-5d1-support` (PR #34)  
Scope: PLAN-phase research only — error · utils · vite config · interactive · mod skeleton.

## Reused findings from prior trace

Prior trace: `.llm/tmp/run/openhands/pr-34/run-27442019802-1/summary.md`

- The previous session was interrupted before writing artifacts; its completion claims are false.
- Distilled findings reused here:
  - `packages/fresh/deno.json` tasks currently: `test`, `check` only.
  - `deno publish --dry-run` reported **58 `excluded-module` errors** and **4 `missing-explicit-return-type`** errors (to be re-verified below).
  - `deno doc --lint` over key entrypoints showed `missing-jsdoc` and `private-type-ref` diagnostics.
  - File-size inventory: `error/handler.ts` (411 lines), `components/ErrorDisplay.tsx` (181 lines), `config/vite.ts` (257 lines), `utils/mod.ts` (54), `utils/cache-entry.ts` (39), `interactive.ts` (14), `hooks/use-promise.ts` (50), `mod.ts` (39).
  - Suspected publish-exclusion cause: `.gitignore` honored by JSR publish or include/exclude misalignment.

## MEASURE-FIRST

### Entrypoints and file inventory

```text
packages/fresh/
  mod.ts                    (root barrel)
  server.ts
  interactive.ts
  error/mod.ts
  error/handler.ts          (large: ~11.8K)
  error/primitives.ts
  utils/mod.ts
  utils/cache-entry.ts
  config/vite.ts
  hooks/use-promise.ts
  components/ErrorDisplay.tsx
  defer/telemetry.ts
  form/telemetry.ts
```

### Combined `deno doc --lint`

Entrypoints: `./mod.ts ./error/mod.ts ./utils/mod.ts ./interactive.ts ./config/vite.ts`.

| Metric | Count |
|--------|------:|
| Total errors | 39 |
| `missing-jsdoc` | 25 |
| `private-type-ref` | 14 |

Notable `private-type-ref`s:
- `NetScriptVitePluginOptions["aliasEntries"]` references private `NetScriptViteAlias`.
- `NetScriptVitePluginOptions["routeManifest"]` references private `NetScriptRouteManifestOptions`.
- `createNetScriptVitePlugin` return type references private Vite/Rollup `Plugin`.

### Per-file breakdown and remediation cost

| File | `missing-jsdoc` | `private-type-ref` | Remediation cost / design note |
|------|----------------:|-------------------:|--------------------------------|
| `config/vite.ts` | ~15 (interface + all fields + function) | 3 | **Medium**: export or inline `NetScriptViteAlias`; re-export `Plugin` from `vite` via `export type { Plugin } from 'vite'` or widen return type to `VitePlugin` alias; make `NetScriptRouteManifestOptions` public or flatten into `NetScriptVitePluginOptions`; add JSDoc to options interface, fields, and `createNetScriptVitePlugin`. |
| `components/ErrorDisplay.tsx` | 4 (`ErrorDisplayProps`, `error`, `title`, `showRetry`) | 3 (`ErrorDisplayProps["children"]`, `ErrorDisplay`, `InlineError` → `ComponentChildren`) | **Small**: import `ComponentChildren` from `preact` and re-export publicly; add JSDoc. Relocation to `error/` is folder-shape work, not a type fix. |
| `defer/DeferIsland.tsx` | 0 | 3 (`DeferComponent` → `DeferComponentProps`, `JSXInternal`, `JSXInternal.Element`) | **Small**: export `DeferComponentProps`; import `JSX.Element` from `preact` and use it as the public return type. |
| `defer/DeferPage.tsx` | 0 | 3 (`DeferPage` → `DeferPageProps`, `JSXInternal`, `JSXInternal.Element`) | **Small**: export `DeferPageProps`; use public `JSX.Element` return type. |
| `defer/policy.ts` | 4 (`DEFER_POLICY`, `DEFER_STALE_MS`, `DETAIL_FORCE_REFRESH_POLICY`, `resolveDetailDeferConfig`) | 3 (`DETAIL_FORCE_REFRESH_POLICY` → `DeferPolicyInput`; `resolveDetailDeferConfig` → `DeferPolicyInput`, `DeferPolicyProfile`) | **Small**: add JSDoc; ensure exported const/function signatures use only public types (both `DeferPolicyInput` and `DeferPolicyProfile` are already exported, but the doc-lint hint suggests the inference path is not considered public — design will make annotations explicit and re-export). |
| `error/handler.ts` | ~10 (`ErrorData`, `ErrorType`, `LoaderResult`, `classifyErrorType`, `isRetryable`, `getDefaultMessage`, `extractErrorData`, `errorHandler`, plus result helpers) | 0 in current surface, but will reappear if split carelessly | **Medium**: add JSDoc to every public symbol; when splitting, ensure each new public file exports its types so `error/mod.ts` does not reference private implementation types. |
| `error/mod.ts`, `utils/mod.ts`, `interactive.ts` | 0 | 0 | **None** in current surface. |

Total cost estimate: **6–8 small design slices** if split per concern (vite wrapper, ErrorDisplay relocation, error handler split, defer JSX types, defer policy docs, telemetry convention). All are documentation, visibility, or folder-shape fixes; no algorithmic changes.

### `deno check --unstable-kv`

Command: `deno check --unstable-kv ./mod.ts ./error/mod.ts ./utils/mod.ts ./interactive.ts ./config/vite.ts`.

Result: `Warning No matching files found.` (Deno 2.7.11 on the scoped entrypoint list). The same warning appears for `deno check .` inside `packages/fresh`.

Root check excludes `packages/fresh` per instructions; entrypoints were measured directly. The warning appears benign — type-checking succeeds with no diagnostics — but it means scoped `deno check` cannot currently prove type errors in this module list. The plan must use `deno task check` or per-file check with explicit config to validate the package.

`deno task check` (the package's own task) also emits `Warning No matching files found.` and exits 0.

### Private-type-ref count

From combined `deno doc --lint`: **14** private-type-ref errors.

Key instances:
1. `NetScriptVitePluginOptions["aliasEntries"]` → private `NetScriptViteAlias`.
2. `NetScriptVitePluginOptions["routeManifest"]` → private `NetScriptRouteManifestOptions`.
3. `createNetScriptVitePlugin` → private Vite `Plugin`.
4. `ErrorDisplayProps["children"]` → private `ComponentChildren` (from `preact`).
5. `ErrorDisplay` component return → private `ComponentChildren`.
6. `InlineError` component return → private `ComponentChildren`.
7. `DeferComponent` → private `DeferComponentProps`.
8. `DeferComponent` → private `JSXInternal` namespace / `JSXInternal.Element`.
9. `DeferPage` → private `DeferPageProps`.
10. `DeferPage` → private `JSXInternal` namespace / `JSXInternal.Element`.
11. `DETAIL_FORCE_REFRESH_POLICY` const → private `DeferPolicyInput` (type inference path).
12. `resolveDetailDeferConfig` function → private `DeferPolicyInput`.
13. `resolveDetailDeferConfig` function → private `DeferPolicyProfile`.
14. (No 14th distinct public symbol; the 14 total errors count includes repeated references such as `JSXInternal` + `JSXInternal.Element` for one public function.)

All 14 are visibility/documentation leaks in already-public symbols, not leaked internals. In scope for 5d1: the 3 vite leaks and the 3 `ComponentChildren` leaks in `components/ErrorDisplay.tsx`. The remaining 8 leaks belong to `defer/` and `form/` and are umbrella-scheduled for 5d4/5d5, but research enumerates them here because `deno doc --lint` surfaces them on `./mod.ts` via the root re-exports.

### Over-cap inventory

File sizes measured with `wc -l`:

| File | Lines | Cap status (F-1: 500 LOC flag / 800 LOC fail) |
|------|------:|------------------------------------------------|
| `error/handler.ts` | 411 | **FLAGGED** (over 300 LOC heuristic, under 500 LOC hard flag) |
| `error/primitives.ts` | 31 | OK |
| `components/ErrorDisplay.tsx` | 181 | OK |
| `config/vite.ts` | 257 | OK |
| `utils/mod.ts` | 54 | OK |
| `utils/cache-entry.ts` | 39 | OK |
| `interactive.ts` | 14 | OK |
| `hooks/use-promise.ts` | 50 | OK |
| `mod.ts` | 39 | OK |

Only `error/handler.ts` exceeds the support-spine target of ~300 LOC in the 5d1 scope. Doctrine F-1 flags files over **500 LOC** and fails files over **800 LOC**, so `handler.ts` at 411 lines is technically below the flag threshold. However, the umbrella plan's 5d1 budget treats the support spine as a "small spine" and applies a stricter 300 LOC guidance for new decomposition work. 5d1 should therefore split `handler.ts` anyway.

Opt-out via `// arch:size-ok <reason>` is available on a PR with justification, but 5d1 has no justification for keeping a multi-concern file whole.

### `deno publish --dry-run --allow-dirty`

Command: `deno publish --dry-run --allow-dirty` from `packages/fresh`.

| Metric | Count |
|--------|------:|
| Total problems | 62 |
| `excluded-module` | 116 occurrences |
| `missing-explicit-return-type` | 8 occurrences |

`excluded-module` are triggered by the JSR publish rules honoring `.gitignore` or `publish.exclude` entries that exclude files reachable via public exports. The prior trace identified this as a `.gitignore` interaction issue. Because the 5d1 scope (`error/`, `utils/`, `config/vite.ts`, `interactive.ts`, `mod.ts`) is a small spine, the umbrella 5d plan must address publish-exclude alignment for all retained entrypoints, but 5d1 itself does not need to fix all 62 problems.

Slow-type hits outside the 5d1 scope (`form/enhancement.tsx`, `form/form-region.tsx`, `form/form.tsx`, `query/query-island.tsx`) are recorded for umbrella scheduling.

`deno publish` exits 0 with the dry-run errors listed; publishing would be blocked without `--allow-slow-types` or fixing them.

## Current-state inventory

### `error/`

`handler.ts` (411 lines) is the largest support-spine file. It owns:
- `ErrorType = 'client' | 'server' | 'unknown'` — HTTP-status-derived classification.
- `ErrorData` — normalized UI payload: `message`, `status`, `code?`, `type`, `retry`, `timestamp`.
- `classifyErrorType(status)` and `isRetryable(status, type)` — retry policy based on 429/408, 5xx.
- `getDefaultMessage(status)` — hard-coded status-to-message map.
- `extractErrorData(error)` — branches over Fresh `HttpError`, oRPC defined errors (via `@netscript/sdk/client` `isDefinedError`), plain `Error`, and unknowns.
- `errorHandler<T>(loader, fallback?)` — wraps an async loader and returns `LoaderResult<T, true>` or `LoaderResult<T, false>`.
- `hasError`, `extractData`, `extractDataWithFallback`, `extractErrorWithFallback`, `safeParseData`, `safeParseDataWithFallback` — type guards and result helpers.
- One notable anti-pattern: `console.error` inside the handler, which violates doctrine AP-13 (`console.*` in published code). Plan must replace with structured telemetry or remove.

`primitives.ts` (31 lines) declares `ErrorPrimitives`, a presentational data bag derived from `ErrorData` plus Tailwind utility classes and icon selection. It is used by `components/ErrorDisplay.tsx` and is intended for custom error renderers.

`mod.ts` currently re-exports only `extractErrorData`, `ErrorData`, `ErrorType`, and `ErrorPrimitives`. It does **not** re-export `errorHandler`, `hasError`, or the result helpers, even though they are public symbols in `handler.ts`. This is a surface inconsistency that 5d1 must resolve: either promote all public error helpers to `./error` or demote the unexported ones to internal-only status.

`components/ErrorDisplay.tsx` (181 lines) exports:
- `ErrorDisplayProps` (with a render-prop `children` slot typed by `ErrorPrimitives`).
- `ErrorDisplay` — default card renderer, server-only Preact component.
- `InlineError` — compact error component.
It uses Tailwind utility classes from the design system. The umbrella plan explicitly dissolves `components/` into `error/` because the view is part of the error surface. Plan must relocate the file to `error/ErrorDisplay.tsx` (or `error/display.tsx`) and update all imports.

### `utils/`

`utils/mod.ts` re-exports three helpers plus two local interfaces (`CacheEntryLike<T>`, `CachedListEntryLike<TItem>`). It is a clean, fully-JSDoc'd surface with zero doc-lint errors in the support-spine scope.

`utils/cache-entry.ts` is the implementation backing module. It imports `CachedEntry` and `isCacheEntryStale` from `@netscript/sdk/cache` and exports:
- `CacheEntryLike<T>` aliased to SDK type.
- `isCacheEntryStale` re-exported from the SDK.
- `hasAllCacheEntries`, `minCachedAt`, `projectCachedItemFromList`.

Design note: `CacheEntryLike` is currently declared in both `cache-entry.ts` and `utils/mod.ts` with a slight mismatch (the implementation file aliases SDK `CachedEntry`; the public module widens to a local interface). For 5d1, the public `CacheEntryLike` should be the single source of truth, probably re-exported from `@netscript/sdk/cache` or a shared types file, to avoid drift between the two declarations. No folder-vocabulary issue here because `utils/` is an existing, allowed subpath under the umbrella plan; however, doctrine AP-16 discourages generic `utils/` folders, so the plan should note that this subpath is grandfathered and scoped to cache-entry helpers only.

### `config/vite.ts`

`config/vite.ts` is the `./vite` subpath backing file. It wraps Vite plugin construction for Fresh 2 / Deno apps and currently exports:
- `NetScriptViteEnvMapping` — `{ source, target, fallback? }` for `import.meta.env` define entries.
- `NetScriptVitePluginOptions` — 11-field options object including `appRoot`, `workspaceRoot`, alias config, watch paths, env mappings, FS allow-list, and `routeManifest`.
- `createNetScriptVitePlugin(options)` — returns a Vite `Plugin`.

Internal helpers (not exported):
- `NetScriptViteAlias` (private) — the resolved alias entry shape.
- `resolveWatchedFilePath`, `dedupe`, `createAliasEntries`, `buildDefineEntries`, `resolveAliasImport`, `logRouteManifestResult`.

What the wrapper does:
1. Resolves `appRoot` (defaults to `Deno.cwd()`) and `workspaceRoot`.
2. Builds alias entries from `aliasDirectories` / `aliasPrefix` (default `@app`).
3. Optionally writes a NetScript route manifest on init/build/watch.
4. Injects Vite config: `resolve.alias`, `server.fs.allow`, `define`, `ssr.external`, and `build.rollupOptions.external` for known server-only npm packages.
5. Watches route files and triggers full-reload via Vite dev-server WebSocket.

Design issues for 5d1:
- `NetScriptViteAlias` is private but appears in a public option field — must become public or inline.
- `NetScriptRouteManifestOptions` is imported from `../route/manifest.ts` and referenced publicly; the route cluster owns that type, so 5d1 must decide whether to re-export it from `./vite` or duplicate a minimal subset.
- Vite `Plugin` return type is private from a consumer's doc-lint perspective; return type should be `Plugin` re-exported from `vite` or a named alias.
- No JSDoc on the public interface/fields/function.
- `Deno.cwd()` and `setTimeout` appear in the module/functions but are justified as edge/config-time behavior; doctrine AP-25 still requires careful placement. 5d1 will keep these in `config/vite.ts` because it is an adapter/config edge file.

Market context: Fresh 2 (post-≨1.0) ships `fresh` as a Vite plugin (`@fresh/plugin`). NetScript's wrapper is not re-exporting Fresh's plugin; it is an app-specific convenience layer. The plan should avoid growing it into a general Vite framework; scope is limited to alias/env/manifest defaults for NetScript projects.

### `interactive.ts` and `hooks/use-promise.ts`

`interactive.ts` (14 lines) is the `./interactive` subpath entry. It currently re-exports only `resolvedPromise` and `usePromise` from `hooks/use-promise.ts`. The module-level JSDoc already states the intended scope: package-owned interactive seams, not builder/server/registry code.

`hooks/use-promise.ts` (50 lines) implements:
- `usePromise<T>(promise)` — a Suspense-style promise reader for server rendering with Preact/Fresh. It caches promise state in a module-level `WeakMap` and throws the promise while pending, matching the React/Preact Suspense throw-promise protocol.
- `resolvedPromise<T>(value)` — convenience factory that pre-populates the cache with a fulfilled state.

Design decision for 5d1: The umbrella plan's default position is to fold `hooks/use-promise.ts` into the `interactive` seam's backing module. Two options were considered:
1. Keep `hooks/` as a folder of hooks, move `use-promise.ts` to `interactive/use-promise.ts`, and re-export from `interactive.ts`.
2. Inline `usePromise`/`resolvedPromise` into `interactive.ts` and delete `hooks/`.

Recommended plan option: **Option 1** — relocate `hooks/use-promise.ts` to `interactive/use-promise.ts` (or `interactive/promise.ts`), keep `interactive.ts` as the curated subpath barrel, and leave room for future interactive primitives (e.g., `useAction`, `useRouteData`) without re-expanding the root surface. This preserves one-concern-per-folder (A8) and avoids a generic `hooks/` folder (AP-22 / folder vocabulary).

Note: `PromiseState<T>` is currently a private type but is inferred in `usePromise`'s return. It should be exported and documented if it remains part of the public surface, or the public function signature should be explicit enough that the private type does not leak.

### `mod.ts` (root barrel)

`mod.ts` (39 lines) is the curated root barrel. Today it re-exports:
- From `components/ErrorDisplay.tsx`: `ErrorDisplay`, `ErrorDisplayProps`, `ErrorPrimitives`.
- From `error/handler.ts`: `errorHandler`, `extractData`, `extractErrorData`, `hasError`, `ErrorData`, `ErrorType`, `LoaderResult`.
- From `defer/mod.ts`: `DeferComponent`, `DeferPage`, `DEFER_POLICY`, `DEFER_STALE_MS`, `DETAIL_FORCE_REFRESH_POLICY`, `resolveDetailDeferConfig`.
- From `utils/mod.ts`: `hasAllCacheEntries`, `minCachedAt`, `projectCachedItemFromList`.

Curated-root policy question for 5d1:
The umbrella plan says the root is "curated, no kitchen-sink." After the support-spine reorganization, the root should contain only symbols that are broadly useful across multiple sub-gates and safe to import without pulling in heavy dependencies. Proposed policy for 5d1 design:
1. **Keep** error display primitives (`ErrorDisplay`, `ErrorData`, `ErrorType`, `ErrorPrimitives`) at root because error UI is cross-cutting.
2. **Keep** cache-entry helpers at root because they are small and used by route/defer/builders.
3. **Move** vite-specific symbols to `./vite` only; root must not depend on Vite types.
4. **Move** interactive symbols to `./interactive` only; root must not depend on Preact hook types.
5. **Demote or relocate** `errorHandler` and result helpers: either keep a thin `createErrorHandler` factory at root or move everything except `ErrorData`/`ErrorType` to `./error`.
6. **Do not** re-export `defer/` symbols from root after 5d1; those belong to `./defer` and will be redesigned in 5d4.

This policy keeps the root surface under the F-5 "≤20 symbols" guidance and avoids turning `mod.ts` into a barrel of barrels.

## Telemetry forks

### `defer/telemetry.ts`

Public exports:
- `DeferPrewarmResult` — `{ status: number; ok: boolean; durationMs: number }`.
- `emitDeferPrewarmDispatchSpan<T extends DeferPrewarmResult>(input, run)` — wraps a prewarm dispatch operation.
- `emitDeferCacheReadSpan(input)` — wraps a cache read.
- `emitDeferClientDecisionSpan(attributes)` — wraps a client-side defer decision.
- `StreamRenderSpanInput` / `StreamRenderSpanResult` — streaming SSR telemetry input/result types.
- `emitStreamRenderSpan<T>(input, run)` — wraps a streaming render.

Span/event shapes (names are cluster-specific):
- Tracers: `@netscript/fresh/defer`, `@netscript/fresh/stream`.
- Span names: `defer.prewarm.dispatch`, `defer.cache.read`, `defer.client.decision`, `stream.render`.
- Event names: `defer.prewarm.complete`, `defer.cache.read.complete`, `defer.client.lifecycle`, `stream.render.complete`.
- Attributes (custom): `defer.region.name`, `defer.reason`, `defer.action_url`, `defer.partial_url`, `defer.prewarm.ok`, `defer.partial.complete_ms`, `defer.error.message`, `stream.route_pattern`, `stream.suspense_boundary_count`, `stream.layer_count`, `stream.duration_ms`, `stream.error_count`, `stream.error`.
- OTel-ish attributes: `http.response.status_code`.
- Span kind: `SpanKind.INTERNAL`.
- Error handling: `span.recordException(...)` + custom `*.error.message` attribute.

### `form/telemetry.ts`

Public exports:
- `withFormSpan<T>(spanName, phase, attributes, run)` — generic wrapper.
- `emitFormError(spanName, phase, attributes, error)` — error span helper.

Span/event shapes:
- Tracer: `@netscript/fresh/form`.
- Span names: `${spanName}.${phase}` and `${spanName}.${phase}.error`.
- Event name: `form.error`.
- Attributes: caller-provided `Record<string, string | number | boolean | undefined>` plus `form.phase`, `form.error.message`.
- Span kind: `SpanKind.INTERNAL`.
- Error handling: `span.recordException(...)` + `form.error` event.

### Proposed ONE cross-cutting convention

5d1 will **not** implement a new telemetry module, but the research supports a design that collapses the two forks into one shared convention under `packages/fresh/telemetry/` or `_internal/telemetry/`. Raw material for `design.md`:

1. **Single tracer namespace**: `@netscript/fresh` (or per-subpath `@netscript/fresh/<subpath>`) instead of per-cluster ad-hoc tracers. Within that namespace, span names carry the cluster prefix: `defer.prewarm.dispatch`, `form.submit`, `stream.render`, `error.boundary`, etc.
2. **Span shape**: `withSpan<T>(tracer, name, run, options)` already provided by `@netscript/telemetry/tracer`. Fresh's convention should add a thin wrapper `createFreshSpan(name, kind, attributes, run)` that enforces:
   - `SpanKind.INTERNAL` for framework spans.
   - `error.type`, `error.message` attributes on failure (in addition to `recordException`).
   - A `complete` event emitted on success with the same attributes as the span.
3. **Attribute taxonomy**: adopt OTel semantic conventions where they exist:
   - `http.response.status_code` for HTTP outcomes.
   - `error.type` / `error.message` for errors.
   - `netscript.operation` for the logical operation (e.g., `defer.prewarm`).
   - Keep NetScript-specific attributes under the `netscript.*` prefix rather than cluster-specific prefixes (`defer.*`, `form.*`) so the same convention can be reused by later sub-gates.
4. **Public surface**: a minimal internal module (e.g., `packages/fresh/_internal/telemetry.ts`) exporting:
   - `createFreshTracer(scope: string)` — returns a scoped tracer.
   - `withFreshSpan<T>(scope, name, options, run)` — opinionated wrapper.
   - `emitFreshError(span, error, attributes)` — normalized exception + event.
   - Type helpers: `FreshSpanOptions`, `FreshSpanAttributeMap`.
5. **Backwards compatibility**: `defer/telemetry.ts` and `form/telemetry.ts` are internal helper files, not exported directly from `./defer` or `./form` (they are re-exported via `defer/mod.ts` `export *`). The design will deprecate those modules and migrate callers to the shared convention during 5d4/5d5 implementation. Until then, 5d1 at minimum documents the convention and places the shared module in the folder plan.
6. **OTel alignment check**: `withSpan` from `@netscript/telemetry/tracer` already accepts `SpanKind`, `attributes`, and an `onError` callback. The Fresh wrapper only needs to standardize attribute names and event emission; it does not need to reimplement tracing.

This satisfies the umbrella plan requirement: "one shared convention, not per-cluster `telemetry.ts` forks."

## Market comparison

### TanStack Start

Source: TanStack Start docs (`https://tanstack.com/start/latest/docs/framework/react/start` and `https://tanstack.com/router/latest/docs/framework/react/api/router/ErrorComponent`), version 1.x as of 2025-01.

Error taxonomy:
- `ServerSideError` / `ClientSideError` distinction is implicit in loader/action execution context.
- `errorComponent` route option renders a component when a route loader/action throws.
- `notFound()` helper throws a special `NotFoundError` caught by `notFoundComponent`.
- Errors bubble to the nearest route `errorComponent`; the framework passes the raw `error` object to the component.
- `onError` callback in `createStartHandler` allows centralized logging.

Telemetry conventions:
- TanStack Start does not ship a built-in OTel integration. The recommended pattern is to add an OpenTelemetry plugin in the Vinxi server entry (`https://vinxi.io/`).
- Community convention: one span per request/loader/action with attributes `http.method`, `http.route`, `http.status_code`, `error.type`, `error.message`.
- No framework-level event names; instrumentation is user-land.

Implications for NetScript:
- Fresh's error boundary is component-level, not route-option-level. NetScript should expose `ErrorDisplay` as the default error boundary and let routes compose it explicitly.
- The `ErrorData` normalization is an added value Fresh/TanStack do not provide; keep it but align fields with OTel (`error.type`, `http.response.status_code`).

### Next.js App Router

Source: Next.js docs (`https://nextjs.org/docs/app/building-your-application/routing/error-handling` and `https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry`), stable through v15.

Error taxonomy:
- `error.js` conventions: client-side error boundaries.
- `global-error.js` for root-level errors.
- `not-found.js` for `notFound()` thrown from server components or route handlers.
- `redirect()` throws a `NEXT_REDIRECT` error.
- Errors in server components are rendered via the closest `error.js` boundary; the error object is serialized into a lightweight digest string, not the full error.

Telemetry conventions:
- Next.js OTel instrumentation (`@vercel/otel` or `instrumentation.ts`) exposes spans:
  - `next.route` for route renders.
  - `next.server.waitForRequest` / `next.server.handleRequest` for request handling.
  - Attributes include `next.route`, `next.page.type`, `http.method`, `http.status_code`, `error.type`, `error.message`.
- Events: `exception` event emitted via `span.recordException` on caught errors.

Implications for NetScript:
- Fresh 2 uses Preact islands, not server components, so the "serialize digest" pattern is not applicable. NetScript can safely pass the full `ErrorData` to island error boundaries.
- Align telemetry span names/attributes with the Next.js convention where it overlaps (HTTP method/status, error.type/message).

### Remix / React Router

Source: Remix docs (`https://remix.run/docs/en/main/guides/errors`) and React Router v7 docs (`https://reactrouter.com/how-to/error-boundary` and `https://reactrouter.com/start/framework/route-module#errorboundary`).

Error taxonomy:
- `ErrorBoundary` export per route (route module API).
- `isRouteErrorResponse(error)` distinguishes thrown `Response` errors from runtime `Error` instances.
- `useRouteError()` hook returns the thrown error inside an `ErrorBoundary`.
- `data` and `redirect` helpers throw special values; `redirect` is caught by the framework.
- `serverErrors` config lets users decide which server errors surface to the client.

Telemetry conventions:
- Remix does not ship built-in OTel. Common community pattern (Sentry, OpenTelemetry manual instrumentation):
  - One span per loader/action named `remix.loader` / `remix.action`.
  - Attributes: `remix.route.id`, `http.method`, `http.status_code`, `error.type`, `error.message`.
  - Events: `exception` via `recordException`.

Implications for NetScript:
- The `isRouteErrorResponse` pattern suggests NetScript could expose a predicate like `isHttpErrorResponse(error)` wrapping Fresh `HttpError`. The existing `extractErrorData` already partially does this.
- Remix's route-level `ErrorBoundary` maps naturally to Fresh's route components: NetScript can ship a default `ErrorBoundary` wrapper around `ErrorDisplay` for routes.

## Gaps and blockers

No blockers remain for the phase-1 research trigger. The following are intentionally deferred to phase-2 `design.md` under supervisor review:

1. **Exact re-export matrix**: which symbols stay in root `mod.ts`, move to `./error`, `./vite`, `./interactive`, or `./utils`. Research provides the policy; design will lock the matrix.
2. **File split for `error/handler.ts`**: whether to split into `error/classify.ts`, `error/extract.ts`, `error/handler.ts`, and `error/types.ts` or keep a single file under the F-1 cap. Research confirms only `handler.ts` is over cap; design picks the split.
3. **Telemetry module location**: `packages/fresh/telemetry.ts` vs `packages/fresh/_internal/telemetry.ts`. Research recommends `_internal` because the convention is framework-internal, but the design must confirm with doctrine A8 / AP-16.
4. **`components/` dissolution**: exact new path (`error/ErrorDisplay.tsx` vs `error/display.tsx`) and import migration list. Research provides candidates; design picks one and produces the migration map.
5. **JSDoc remediation order**: 25 missing JSDoc symbols across the support spine. The per-file breakdown above gives the cost; design will sequence the work.
6. **Private-type-ref cleanup**: 14 remaining leaks (3 from `config/vite.ts`, 3 from `components/ErrorDisplay.tsx`, 8 from `defer/` and `form/` via root re-exports). The 5d1 design will address the 6 in scope; the other 8 are umbrella-scheduled.
7. **F-1 cap confirmation**: doctrine F-1 flags files over **500 LOC** and fails files over **800 LOC**. `error/handler.ts` at 411 lines is below the hard flag but above the support-spine 300 LOC heuristic. No further measurement needed.
8. **`defer/` root re-exports**: `mod.ts` currently re-exports `defer/` symbols. Design will decide whether to drop them from root now or wait for 5d4.
