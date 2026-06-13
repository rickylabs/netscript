# Design — 5d1 support spine (`@netscript/fresh`)

Run: `feat/package-quality-wave5-apps-5d1-support` (PR #34)  
Phase: PLAN (Phase 2 of 2) — design decisions for error taxonomy, telemetry convention, utils normalization, vite wrapper, interactive seam, root barrel, docs scaffold, and `./testing`.

## Authority basis

- Umbrella BINDING: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`
- Phase-1 research: `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/research.md`
- Archetype: **Archetype 3 — Runtime/Behavior** with **SCOPE-frontend** overlay; 5d1 additionally behaves like Archetype-4 utilities.
- Doctrine: `docs/architecture/doctrine/01-thesis-and-axioms.md` (A1 public-types-first, A8 one-concern-per-folder, A13 crash-boundaries-explicit), `05-folder-structure.md`, `09-anti-patterns-and-fitness-functions.md` (F-1, F-5, F-6, F-7, F-8).
- Lessons: `.llm/harness/lessons/package-quality-archetype.md` items 6–7 (doctests + docs scaffold are required deliverables of this plan).

## MEASURE-FIRST baseline (reused, not re-derived)

Numbers are taken from the committed Phase-1 `research.md` and its measurement artifacts. No new `deno doc --lint` / `deno check` / dry-run was executed for this design.

| Metric | Baseline |
|--------|----------|
| `deno doc --lint` combined over 5d1 entrypoints (`./mod.ts ./error/mod.ts ./utils/mod.ts ./interactive.ts ./config/vite.ts`) | **39 errors** |
| `missing-jsdoc` | **25** |
| `private-type-ref` | **14** |
| In-scope private-type-ref leaks (5d1) | **6** (`config/vite.ts` × 3, `components/ErrorDisplay.tsx` × 3) |
| Out-of-scope private-type-ref leaks (5d4/5d5) | **8** (`defer/` × 6, `form/` × 2 inferred via root re-exports) |
| Files over 500 LOC / 800 LOC | **0 / 0** (`error/handler.ts` 411 LOC — below F-1 flag, above support-spine 300 LOC heuristic) |
| `deno publish --dry-run` | 58 `excluded-module` errors (root workspace excludes `packages/fresh`) + 4 `missing-explicit-return-type` historical (to be re-verified at implementation time) |

## Design decisions

### 1. Error taxonomy and `error/` shape

**Decision**: Keep a single public error model surfaced through `./error`.

- `error/primitives.ts` already defines `ErrorPrimitives`. Keep it.
- `error/handler.ts` at 411 LOC is below the doctrine F-1 hard flag (500 LOC). For support-spine hygiene we **split** it into:
  - `error/types.ts` — `ErrorType`, `ErrorData`.
  - `error/classify.ts` — `classifyErrorType`, `isRetryable`, `getDefaultMessage`.
  - `error/extract.ts` — `extractErrorData`, `extractData`, `hasError`.
  - `error/handler.ts` — `errorHandler` orchestrator only (~150 LOC after move).
- `error/mod.ts` becomes the curated barrel exporting the public model and helpers from the split files.
- **Public surface change**: none — existing symbol names and export locations are preserved. Internal file paths change; that is free under umbrella drift tolerance.

**Error model alignment with market**: 
- `ErrorType` (`client | server | unknown`) maps to HTTP status families, matching Next.js `error.js` / TanStack Start `errorComponent` conventions.
- `ErrorData` carries `status`, `code`, `type`, `retry`, `message`, `timestamp`, aligned with OTel `error.type` and `http.response.status_code`.
- `isRetryable(status, type)` is the NetScript-specific predicate, equivalent in spirit to Remix `isRouteErrorResponse` but normalization-first.

**Gate evidence**: F-1 (split keeps every file under 300 LOC), F-5 (same public symbols), F-7 (JSDoc on every exported symbol).

### 2. `components/ErrorDisplay.tsx` dissolution

**Decision**: Move into `error/ErrorDisplay.tsx` and dissolve the `components/` folder.

- New path: `packages/fresh/error/ErrorDisplay.tsx`.
- `error/mod.ts` exports `ErrorDisplay` and `ErrorDisplayProps`.
- Root `mod.ts` updates its import from `./components/ErrorDisplay.tsx` to `./error/mod.ts` (re-export remains for backwards compatibility during alpha).
- Import migration map:
  - `components/ErrorDisplay.tsx` → `error/ErrorDisplay.tsx`
  - `mod.ts` internal import → `./error/mod.ts`
  - External consumers: no change; they already import via `@netscript/fresh` root or `@netscript/fresh/error`.

**Private-type-ref fix** (3 leaks in ErrorDisplay):
- Re-export `ComponentChildren` from `preact` through the public barrel, OR use `preact.JSX.Element` / `VNode` as the component return type.
- Design choice: **re-export `ComponentChildren` from `error/mod.ts`** because it is the natural public type of `ErrorDisplayProps.children`. Add `export type { ComponentChildren } from 'preact';` in `error/mod.ts` (or `preact` direct re-export). This clears `private-type-ref` without widening unrelated surfaces.

**Gate evidence**: F-7 (JSDoc + private-type-ref fix), F-16 (dissolve singleton `components/` folder).

### 3. Telemetry convention — unifying `defer/telemetry.ts` and `form/telemetry.ts`

**Decision**: Introduce one cross-cutting Fresh telemetry convention in `packages/fresh/_internal/telemetry.ts`.

Rationale:
- The convention is framework-internal composition, not a public consumer API. Doctrine A8 (one concern per folder) and AP-16 on internal vocabulary support `_internal/` for genuinely private composition.
- Public entrypoints (`./defer`, `./form`, `./streams`) will continue to expose domain-specific helpers (e.g., `emitDeferPrewarmDispatchSpan`) but those helpers will be thin wrappers over the shared module.
- 5d1 scaffolds the shared module and migrates `defer/telemetry.ts` to consume it; `form/telemetry.ts` remains a compatibility shim until 5d5 implements its cutover.

**Module shape** (`_internal/telemetry.ts`):

```ts
import { type Attributes, getTracer, SpanKind, withSpan } from '@netscript/telemetry/tracer';

export interface FreshSpanOptions {
  scope: string;
  name: string;
  kind?: SpanKind;
  attributes?: Attributes;
}

export type FreshSpanAttributeMap = Attributes;

export interface FreshErrorAttributes {
  'error.type'?: string;
  'error.message'?: string;
  'http.response.status_code'?: number;
  'netscript.operation'?: string;
}

export function createFreshTracer(scope: string) { return getTracer(`@netscript/fresh/${scope}`); }

export function withFreshSpan<T>(
  scope: string,
  name: string,
  run: (span: Span) => T,
  options?: { kind?: SpanKind; attributes?: Attributes },
): Promise<T> { /* wraps withSpan */ }

export function emitFreshError(
  span: Span,
  error: unknown,
  attributes?: FreshErrorAttributes,
): void { /* recordException + error.* attrs */ }
```

**Attribute/naming convention**:
- Span names: `<domain>.<operation>` (e.g., `defer.prewarm.dispatch`, `form.submission.validate`).
- OTel semantic attributes where available: `http.response.status_code`, `error.type`, `error.message`.
- NetScript-specific logical operation: `netscript.operation` (e.g., `defer.prewarm`, `form.submit`, `stream.render`).
- **No cluster-specific prefixes** (`defer.*`, `form.*`) for cross-cutting concepts. Domain scoping belongs in the span name/tracer scope only.

**Backwards compatibility**: `defer/telemetry.ts` functions keep the same signatures but delegate attribute emission to `_internal/telemetry.ts`. `form/telemetry.ts` is left untouched in 5d1 (debt entry), cut over in 5d5.

**Gate evidence**: F-5 (surface controlled), F-7 (documented convention), F-15 (no upstream re-export reinvention — we wrap `@netscript/telemetry/tracer`), plus umbrella telemetry-alignment requirement.

### 4. `./vite` wrapper surface

**Decision**: Keep `config/vite.ts` as the `./vite` entrypoint. Do not create a separate `vite/` folder because the package already has `config/` and F-16 says avoid singleton folders. The `exports["./vite"]: "./config/vite.ts"` mapping is retained.

**Public API**:
- `NetScriptVitePluginOptions` — documented interface.
- `NetScriptViteAlias` — currently private. **Make public** (export from `config/vite.ts`) because it appears in the public options interface.
- `NetScriptViteEnvMapping` — already public; add JSDoc.
- `NetScriptRouteManifestOptions` — currently private, but defined in `route/manifest.ts` and already exported from `./route`. **Re-export it from `./config/vite.ts`** as `export type { NetScriptRouteManifestOptions } from '../route/manifest.ts';` so the public options interface references only public types.
- `createNetScriptVitePlugin` return type — currently inferred as Vite `Plugin`. **Annotate return type as `Plugin`** and re-export `Plugin` from `vite` as `export type { Plugin } from 'vite';` in the same file. This clears the private-type-ref and slow-type risk.

**Private-type-ref fix** (3 leaks): resolved by the three bullets above.

**Gate evidence**: F-6 (JSR publishability — explicit return type, public referenced types), F-7 (JSDoc), F-5 (public surface audit).

### 5. `./interactive` and `hooks/` dissolution

**Decision**: Relocate `hooks/use-promise.ts` to `interactive/use-promise.ts` and dissolve `hooks/`.

- `interactive.ts` remains the curated subpath barrel.
- It re-exports `resolvedPromise` and `usePromise` from `./interactive/use-promise.ts`.
- No public surface change.

**Gate evidence**: F-16 (dissolve singleton `hooks/` folder), F-5 (same exports).

### 6. `./utils` normalization

**Decision**: Reconcile `CacheEntryLike<T>` in `utils/mod.ts` with the SDK `CachedEntry<T>` shape.

- Research found `utils/mod.ts` and `utils/cache-entry.ts` declare similar but not identical cached-entry shapes.
- 5d1 makes `utils/mod.ts` the public barrel and re-exports a single, SDK-aligned `CacheEntryLike<T>` from `utils/cache-entry.ts`.
- If the SDK shape is usable, import `CachedEntry<T>` from `@netscript/sdk` and re-export as `CacheEntryLike<T>` alias; otherwise align fields and add JSDoc.

**Gate evidence**: F-2 (helper-reinvention scan — stop duplicating cache-entry shapes), F-7 (JSDoc).

### 7. Root `mod.ts` curated-export policy

**Decision**: Tighten the root barrel to package-owned support-spine symbols only.

Current root re-exports include defer symbols (`DeferComponent`, `DeferPage`, `DEFER_POLICY`, etc.). The umbrella final shape says the root is curated and `./defer` is a separate subpath.

**Public surface change**: Remove defer symbols from root `mod.ts`. Consumers must import from `@netscript/fresh/defer`. This is a breaking change in alpha; the umbrella accepts zero-external-consumer alpha latitude per `package-quality-archetype.md`.

**Migration map**:
- `DeferComponent`, `DeferPage`, `DEFER_POLICY`, `DEFER_STALE_MS`, `DETAIL_FORCE_REFRESH_POLICY`, `resolveDetailDeferConfig` → `@netscript/fresh/defer`

**Gate evidence**: F-5 (public surface audit), F-18 (sub-barrel lint — root should not duplicate subpath exports).

### 8. Doctrine spine — `deno.json`, `./testing`, docs

**Decision**: Extend `packages/fresh/deno.json` tasks to the package-quality standard set:

```json
{
  "tasks": {
    "test": "deno test --allow-all ./builders ./config ./defer ./form ./interactive ./route ./server ./utils ./error",
    "check": "deno check --unstable-kv ./mod.ts ./interactive.ts ./server.ts ./builders/mod.ts ./route/mod.ts ./defer/mod.ts ./form/mod.ts ./error/mod.ts ./utils/mod.ts ./streams/mod.ts ./config/vite.ts ./testing.ts",
    "doc-lint": "deno doc --lint ./mod.ts ./interactive.ts ./server.ts ./builders/mod.ts ./route/mod.ts ./defer/mod.ts ./form/mod.ts ./error/mod.ts ./utils/mod.ts ./streams/mod.ts ./config/vite.ts ./testing.ts",
    "fmt": "deno fmt --ext ts,tsx ./mod.ts ./interactive.ts ./server.ts ./builders ./route ./defer ./form ./error ./utils ./streams ./config ./interactive ./testing.ts",
    "lint": "deno lint --ext ts,tsx ./mod.ts ./interactive.ts ./server.ts ./builders ./route ./defer ./form ./error ./utils ./streams ./config ./interactive ./testing.ts",
    "dry-run": "deno publish --dry-run --allow-dirty"
  }
}
```

(Exact paths to be finalized after `./testing.ts` is scaffolded.)

**`./testing` entrypoint**: Create `testing.ts` exporting minimal test harness seams for consumers of builders/route/form:
- `createMockRouteContext()` — for route-contract tests.
- `createMockDeferPolicy()` — for defer-region tests.
- Re-export useful in-memory adapters from other NetScript packages where already available.
- Keep it intentionally thin; later sub-gates extend it.

**Docs scaffold** (per `package-quality-archetype.md` items 6–7):
- `docs/README.md` — mirror/summary of root README.
- `docs/getting-started.md` — installation + first route.
- `docs/architecture.md` — ADR-lite: error taxonomy, telemetry convention, folder shape.
- `docs/concepts.md` — defer, partials, forms, streams at concept level.
- `docs/recipes/` — placeholder for later sub-gates.
- `docs/reference/` — generated from `deno doc` later; stub now.
- Add `docs/` to `publish.include`.

**Doctest fixture**: `tests/_fixtures/docs-examples_test.ts` executes the exact README quick-start snippet.

**Gate evidence**: F-6 (task hygiene + JSR dry-run), F-7 (docs + JSDoc), F-8 (workspace lib check via `check` task enumerating every export), F-10 (test-shape audit), F-11 (forbidden-folder lint).

### 9. JSDoc remediation order

Order by dependency (types before consumers):

1. `error/types.ts` — `ErrorType`, `ErrorData`.
2. `error/classify.ts` — `classifyErrorType`, `isRetryable`, `getDefaultMessage`.
3. `error/extract.ts` — `extractErrorData`, `extractData`, `hasError`.
4. `error/handler.ts` — `errorHandler`.
5. `error/ErrorDisplay.tsx` — `ErrorDisplayProps`, `ErrorDisplay`, `InlineError`, `ComponentChildren` re-export.
6. `error/primitives.ts` — already documented; verify.
7. `config/vite.ts` — `NetScriptVitePluginOptions`, fields, `NetScriptViteAlias`, `NetScriptViteEnvMapping`, `createNetScriptVitePlugin`.
8. `utils/mod.ts` / `utils/cache-entry.ts` — `CacheEntryLike`, helpers.
9. `interactive/use-promise.ts` — `usePromise`, `resolvedPromise`.
10. `interactive.ts` — `@module` already present.
11. `_internal/telemetry.ts` — every public helper.
12. `mod.ts` — `@module` and re-exports.
13. `testing.ts` — `@module` and every helper.

This retires all 25 missing-JSDoc symbols that belong to the 5d1-owned surface. The remaining missing-JSDoc errors in `defer/`/`form/`/`builders/`/`route/` are inherited and deferred to 5d2–5d6.

### 10. Private-type-ref remediation (in-scope 6)

| # | Symbol | Leak | Fix |
|---|--------|------|-----|
| 1 | `NetScriptVitePluginOptions["aliasEntries"]` | private `NetScriptViteAlias` | Export `NetScriptViteAlias` from `config/vite.ts` |
| 2 | `NetScriptVitePluginOptions["routeManifest"]` | private `NetScriptRouteManifestOptions` | Re-export `NetScriptRouteManifestOptions` from `route/manifest.ts` in `config/vite.ts` |
| 3 | `createNetScriptVitePlugin` | private Vite `Plugin` | Annotate return type `Plugin` and `export type { Plugin } from 'vite'` |
| 4 | `ErrorDisplayProps["children"]` | private `ComponentChildren` | Re-export `ComponentChildren` from `preact` through `error/mod.ts` |
| 5 | `ErrorDisplay` component return | private `ComponentChildren` | Same as #4 |
| 6 | `InlineError` component return | private `ComponentChildren` | Same as #4 |

Out-of-scope 8 leaks (`defer/` × 6, `form/` × 2) remain scheduled for 5d4/5d5 with umbrella drift entry D-5d1-009.

## Deferred decisions

| Decision | Resolution | Rationale |
|----------|------------|-----------|
| Drop `defer/` root re-exports from `mod.ts` | **Now** in 5d1 | Root barrel should be curated per umbrella final shape; defer symbols have their own subpath. Surface change requires umbrella drift entry. |
| Full `deno doc --lint` 0 across all entrypoints | **Deferred to 5d6** | 33 of 39 errors live in `defer/`/`form/`/`builders/`/`route/`; 5d1 cannot own them. |
| `form/telemetry.ts` cutover to shared convention | **Deferred to 5d5** | 5d1 scaffolds the convention; 5d5 owns form implementation. |
| Runtime/Aspire/browser validation of error boundaries | **Deferred to 5d2/5d5** | Needs real routes in `apps/playground`; support spine has no route surfaces of its own. |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Moving `ErrorDisplay` to `error/` breaks an internal import outside `packages/fresh` | Low | Medium | Search-and-replace migration map; alpha latitude allows clean break. |
| Re-exporting `Plugin` from `vite` collides with a local name | Low | Low | Use `export type { Plugin as VitePlugin } from 'vite'` if needed; design prefers direct `Plugin` to match upstream. |
| Removing defer symbols from root `mod.ts` breaks an app import | Low | Medium | Drift entry + consumer-import gate in plan; 0 external consumers assumed in alpha. |
| `utils/mod.ts` / SDK `CachedEntry<T>` mismatch forces a type change | Medium | Low | Align fields inside `utils/` without changing SDK; add tests. |
| `_internal/telemetry.ts` grows into a public API by accident | Medium | High | Keep it out of `exports`; only domain helpers in `./defer`/`./form` are public. |

## Open questions for supervisor

1. Does the umbrella accept dropping defer symbols from root `mod.ts` in 5d1, or should that wait until 5d4? (Design default: do it now.)
2. Should `error/handler.ts` be split even though it is below the 500 LOC F-1 flag? (Design default: split for spine hygiene.)
3. Should `./testing` re-export a memory adapter from `@netscript/sdk` or `@netscript/telemetry`, or stay purely Fresh-local fixtures? (Design default: Fresh-local only, extend per sub-gate.)
4. Is the root workspace exclusion of `packages/fresh` removable as soon as 5d1 passes its own `doc-lint`/`dry-run`, or must it wait for 5d6? (Design drift entry proposes controlled early un-exclusion.)
