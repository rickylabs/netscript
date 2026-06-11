# Research — Sub-wave 5a: `@netscript/service`

Generator session (Fable 5). Scope: RESEARCH + PLAN & DESIGN only. No implementation.
Branch: `feat/package-quality-wave5-apps-5a-service` @ fork from umbrella tip `09f4845`
(see drift.md D-1 — mandate said dfab7a4; 09f4845 is the docs/handover commit atop it).

## 0. MEASURE-FIRST baseline (this worktree, raw deno via `Deno.Command`)

Source: `.llm/temp/measure-5a-service.ts` → `measure-5a.json` (this run dir).
Reconciles exactly with umbrella re-baseline @ dfab7a4.

| Gate | Result |
| --- | --- |
| `deno check --unstable-kv packages/service/mod.ts` | **PASS** (exit 0) |
| `deno doc --lint mod.ts` (single entrypoint == combined == full barrel) | **23 errors**: 14 `private-type-ref`, 8 `missing-return-type`, 1 `missing-jsdoc` |
| `deno publish --dry-run --allow-dirty` (cwd packages/service) | **FAIL**: 8 slow-types + 6 `excluded-module` |
| Tests | **0** (no tests/ dir, no `*_test.ts` anywhere in package) |
| README / docs/ | **none** (README-from-zero confirmed) |

Aspire: N/A for `@netscript/service`. The package uses `Deno.serve` directly and exposes health
handlers/builders; Aspire health probes are service-layer-consumer concerns, not package runtime
integration points.

### 0.1 `excluded-module` root cause (NEW finding vs umbrella baseline)

The 6 `excluded-module` dry-run errors are caused by **root `deno.json`
`"exclude": [".llm/tmp/", "packages/service/", "packages/sdk/", "packages/fresh-ui/", "packages/fresh/"]`**
(Wave-4-tail scoping of root gates). `deno publish` honors root exclude and treats the
package's own modules as excluded. Control: `packages/kv` (not in root exclude, same
relative workspace-import style) passes dry-run exit 0. ⇒ The only config blocker is the
root exclude; the plan must lift `packages/service/` from it at the end of 5a (recorded
in drift.md D-2).

### 0.2 Doc-lint decomposition

**14 private-type-ref**, by leaked type:

| Private type | Count | Where | Class |
| --- | --- | --- | --- |
| `AnyRouter` (`Record<string, any>`, duplicated locally in 4 files) | 6 | builder, handlers, openapi, define-service | package-owned, just unexported |
| `StandardHandlerPlugin` (`@orpc/server/standard`) | 2 | handlers.ts `RPCHandlerConfig.plugins`, `createRPCPlugins` | upstream leak (F-15-adjacent) |
| `Parameters<typeof cors>[0]` (hono/cors) | 1 | builder `withCors` | upstream leak |
| `Database` | 1 | builder `withDatabase` | package-owned, unexported |
| `AnyDbContext` | 1 | builder `withDatabase` | package-owned, unexported |
| `ContextFactory` | 1 | builder `withContext` | package-owned, unexported |
| `MiddlewareHandler` (hono) | 1 | builder `use` | upstream leak |
| `Hono` (class) | 1 | builder `build(): Hono` | upstream leak |

**8 missing-return-type == the 8 slow-types** (same functions):
`createHealthHandler`, `createLivenessHandler`, `createReadinessHandler` (health.ts);
`createNotFoundHandler`, `createErrorHandler` (handlers.ts);
`createOpenAPISpec`, `createScalarDocs`, `createScalarJs` (openapi.ts).
Plus 2 functions with **explicit `any` returns** (`createRPCHandler`,
`createOpenAPIHandler`) — they don't trip doc-lint missing-return-type but violate
"no `any` in public surface".

**1 missing-jsdoc**: `ServiceBuilder` class member (see measure-5a.json raw).

## 1. File inventory (1,643 LOC total ⇒ `src/` layout MANDATORY, >600)

| File | LOC | Cap | Notes |
| --- | --- | --- | --- |
| `mod.ts` | 79 | 200 (barrel) | 3-layer barrel; re-exports `LoggerMiddlewareOptions` from `@netscript/logger/middleware`; @module block far under 30-line standard |
| `builders/service-builder.ts` | 502 | **over 350** | exports `class ServiceBuilder<TRouter>` directly; 4× `console.log` in `serve()`; `Deno.serve({port}, app.fetch)` with no AbortSignal/stop handle |
| `presets/define-service.ts` | 477 | **over 350** | ~280 LOC are DB-connectivity diagnostics (ENGINE_CONFIGS mysql/postgres/mssql, checkTcpPort IPv6 workaround, ASCII-box `console.error` diagnostics, Prisma error unwrapping) |
| `primitives/health.ts` | 225 | ok | interfaces clean; 3 missing return types |
| `primitives/handlers.ts` | 209 | ok | `StandardHandlerPlugin` import **not in package imports map** (subpath of `@orpc/server`); 2× `any` returns; `console.error` in error handler |
| `primitives/openapi.ts` | 151 | ok | module-level shared `openApiGenerator` + `scalarJsCache`; reads vendored `assets/scalar.min.js` (**3.3 MB**) |

`deno.json` gaps vs STANDARDS.md: no `license`, `description`, `tasks`
(check/test/lint/fmt/publish:dry-run), no `publish.include/exclude` block.
Version `0.0.1-alpha.0`, exports `{".": "./mod.ts"}` only.

## 2. Doctrine verdicts

- **Archetype**: A4 (DSL/Builder) primary + A3 (runtime: health/readiness/serve)
  secondary ⇒ gate set = union (F-1..F-18 incl. F-13 + runtime validation).
- **PUBLIC-SURFACE-PATTERNS §2 (Builder)**: export the builder **interface**, keep impl
  class internal; `with…` naming for chained config. Current code violates both:
  class exported, `addHealthCheck`/`addReadinessCheck` naming.
- **STANDARDS.md**: src/ mandatory (>600 LOC); forbidden folders n/a; README 14
  sections ≥150 lines + doctest runner `tests/_fixtures/readme-examples_test.ts`;
  mod.ts barrel-only ≤200 lines with @module ≥30 lines; no `any` / no default exports.
- **F-14/AP-13**: console.* throughout (serve banner, error handler, diagnostics).

## 3. Precedents (how green packages solved the same problems)

- **logger (Wave 2)** — *structural mirror types*: `LoggerMiddlewareContext`,
  `LoggerMiddlewareNext`, `LoggerMiddleware = (ctx, next) => Promise<Response | void>`
  instead of referencing Hono types. F-15 forbids re-exporting upstream types.
- **telemetry `src/orpc/`** — doc-lint-clean while interoperating with oRPC plugins:
  package-owned `_types.ts` (`GenericHandlerOptions`, `AnyInterceptor`); plugin classes
  (`TracingPlugin`, `ErrorHandlingPlugin`) are plain classes **structurally compatible**
  with `StandardHandlerPlugin` — zero upstream type imports in the public surface.
  This is the direct template for fixing `handlers.ts`.

## 4. RFC 14 §5.3 seam (do NOT implement)

Unified mode mounts service **routers** into a single Hono app inside Nitro's server
entry via the oRPC Hono adapter ("Hono throughout"). Obligations on `@netscript/service`:

1. Stay Hono-native internally (already true).
2. Keep routers separable from the builder — the router is an *input* to
   `createService(router, …)`, never trapped inside it (already true).
3. Nothing in the alpha public surface may force per-service `Deno.serve` as the only
   run mode — i.e. `build()` (app without listening) must remain available.

No code change is required *for* RFC 14; the redesign must merely not break these.

## 5. Consumer census (grep, this worktree)

- **`ServiceBuilder.build()` consumers: ZERO.** (All `.build()` grep hits are
  `definePlugin` builders in plugins/*/src/public/mod.ts — unrelated.)
- `createService(router, …).with…().serve()`: `plugins/workers/services/src/main.ts`,
  `plugins/sagas/services/src/main.ts`. Awaited return value **unused**.
- Chained methods used by consumers: `withCors()`, `withLogger()`, `withOpenAPI()`,
  `withDocs()`, `withDatabase(dbClient)`, `withContext(fn)`, `withRPC({traceContext})`,
  `withHealth()`, `withServiceInfo()`, `onStartup(fn)`, `serve()`. All keep their names.
- `addHealthCheck` / `addReadinessCheck` consumers: **ZERO** ⇒ alpha latitude, rename
  without shims.
- `ServiceBuilder` referenced as a *type* by consumers: **ZERO**.
- `defineService(router, options)`: CLI service template
  (`packages/cli/src/kernel/templates/service/*`, asserted in generators_test.ts) and
  test-app root `services/{orders,products,users}` (outside this repo's gates but part
  of e2e). Return value unused (`await defineService(...)` top-level).
- CLI kernel references: `import-resolver.ts`, `constants/jsr-specifiers.ts`,
  `constants/scaffold/scaffold-packages.ts` — specifier-level only, no API surface.
- `packages/cli/src/kernel/templates/plugins/generate-plugin-service.ts:44` emits
  `builder.withDatabase(dbClient)` — name preserved.

## 6. Risk inputs

- Root-exclude lift may surface `packages/service` errors in *root-level* combined
  gates that were previously masked — must re-run `check:packages` + repo lint/fmt
  after lifting.
- `ServiceMiddleware` structural mirror must remain assignable where a real Hono
  `MiddlewareHandler` is passed by consumers (`use()`); needs a compile-time
  assignability test (telemetry pattern proves feasibility).
- 3.3 MB vendored `assets/scalar.min.js`: publish-size vs offline-docs trade-off —
  needs a locked decision (see plan D-9).
- defineService diagnostics output is developer-facing UX; extraction must preserve
  behavior (golden-output snapshot optional).
