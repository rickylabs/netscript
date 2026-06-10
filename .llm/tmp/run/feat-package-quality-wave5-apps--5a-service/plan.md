# Plan — Sub-wave 5a: `@netscript/service` (calibration unit)

Status: **PROPOSED — awaiting PLAN-EVAL** (generator does not lock; separate session).
Evidence base: `research.md` + `measure-5a.json` in this run dir.

## 1. Archetype + doctrine verdict

- **A4 (DSL/Builder) primary, A3 (runtime) secondary.** `createService`/`ServiceBuilder`
  is a chained-config DSL over Hono; `serve()`, health/readiness handlers are runtime
  concerns. PUBLIC-SURFACE-PATTERNS archetype map agrees: service = "Builder + DSL +
  registry".
- **Gate set = A4 ∪ A3**: F-1..F-12, F-14..F-18 (A4) + F-13 + runtime/Aspire-style
  validation (A3): serve on a real port, hit `/health`, clean stop.

## 2. Decisions (proposed for lock)

**D-1 — `src/` restructure (mandatory, 1,643 LOC > 600).** Target shape:

```
packages/service/
  mod.ts                      # barrel only, ≤200L, @module ≥30L
  deno.json                   # standardized (D-10)
  src/
    types.ts                  # package-owned public types (D-3, D-4, D-6)
    builder/service-builder.ts   # interface + internal impl (D-2)
    presets/define-service.ts    # ≤350L after D-7 extraction
    primitives/{health,handlers,openapi}.ts
    diagnostics/             # internal, NOT exported via barrel (D-7)
  assets/scalar.min.js       # vendored (D-9)
  tests/  docs/  README.md
```

**D-2 — Builder pattern compliance.** Export `ServiceBuilder<TRouter>` as an
**interface**; internal `class ServiceBuilderImpl` (unexported). `createService()` is
the only constructor path. Zero consumers reference `ServiceBuilder` as a type ⇒ no
shim. Methods return the interface (no accumulator generics ⇒ no slow types).

**D-3 — Structural mirror types (logger/telemetry precedent) for all 14 ptr leaks:**

| Leak | Replacement (package-owned, in `src/types.ts`) |
| --- | --- |
| `AnyRouter` ×6 (4 local dupes) | single exported `ServiceRouter` type with jsdoc; generic constraint `T extends ServiceRouter` |
| `StandardHandlerPlugin` ×2 | `ServiceHandlerPlugin` structural type (telemetry `GenericHandlerOptions`-style: `init?(options)` shape); upstream import removed (also fixes the un-mapped `@orpc/server/standard` subpath import) |
| `Parameters<typeof cors>[0]` | `CorsOptions` mirror of the option fields actually supported |
| `Database`, `AnyDbContext`, `ContextFactory` | already package-owned — export + document them |
| `MiddlewareHandler` (hono) | `ServiceMiddleware` mirror (logger `LoggerMiddleware` pattern); compile-time assignability test against a real Hono middleware |
| `Hono` (`build()`) | `ServiceApp` — see D-4 |

**D-4 — `build(): ServiceApp`, `serve(): Promise<RunningService>`.**
`ServiceApp` = package-owned structural interface, minimally
`{ fetch(req: Request): Response | Promise<Response>; request(...): Promise<Response> }`
(exact members fixed at implementation; must cover test ergonomics + mounting). The
runtime object remains the real Hono instance (documented escape hatch in README).
`serve(options?: { signal?: AbortSignal })` returns `RunningService`
`{ app: ServiceApp; addr; stop(): Promise<void> }` wrapping `Deno.serve`'s handle —
this is the A3 concept-of-done (stop semantics; currently none). Zero consumers use
either return value ⇒ no shims. RFC 14 seam preserved: `build()` (no listen) stays.

**D-5 — Naming: `addHealthCheck`→`withHealthCheck`, `addReadinessCheck`→`withReadinessCheck`.**
Zero consumers (grep) ⇒ rename without shims (alpha latitude).

**D-6 — Kill `any` returns.** `createRPCHandler`/`createOpenAPIHandler` return a
package-owned structural `FetchHandler` interface
(`handle(request, options) => Promise<{ matched: boolean; response: Response }>`)
mirroring the oRPC fetch handler contract. The 8 missing-return-type functions get
explicit types (`(c) => Promise<Response>` handler aliases, e.g. `ServiceHandler`).
This clears all 8 slow-types.

**D-7 — Extract diagnostics from define-service.ts → `src/diagnostics/` (internal).**
~280 LOC (ENGINE_CONFIGS, checkTcpPort, ASCII-box printers, Prisma error unwrapping)
move out; define-service drops under the 350 cap. NOT exported via barrel at alpha
(no consumer imports it). Behavior parity required (manual smoke vs a stopped DB, or
golden snapshot if cheap).

**D-8 — console.* → `@netscript/logger`** (already a dependency) for serve banner and
`createErrorHandler`. Diagnostics ASCII output is deliberate developer UX: route
through logger's error channel but preserve formatting; if logger cannot render
multi-line blocks faithfully, record an F-14 debt entry rather than degrading the UX.

**D-9 — Keep `assets/scalar.min.js` vendored AND included in publish.** Offline/no-CDN
docs is a stated feature (`createScalarJs`); excluding it from publish would break
JSR-installed consumers at runtime. 3.3 MB is acceptable for alpha; record a debt
entry to revisit (lazy npm specifier or optional peer) before beta.

**D-10 — deno.json standardization.** Add `description` (use [[netscript-jsr-positioning]]
vocabulary), `license: MIT`, tasks `{check, test, lint, fmt, publish:dry-run}`
(mirror packages/logger), `publish.include/exclude` (include mod.ts, src/, assets/,
README.md, docs/; exclude tests/). Keep version `0.0.1-alpha.0`.

**D-11 — Lift `packages/service/` from root `deno.json` exclude** as the final slice,
then re-run root-level gates (`check:packages`, lint, fmt) — the lift is the real
"package is green" switch and un-breaks dry-run (`excluded-module` ×6).

**D-12 — README (14 mandatory sections, ≥150L) + doctest runner**
`tests/_fixtures/readme-examples_test.ts` + `docs/` scaffold
(architecture/concepts/getting-started, logger as template).

**D-13 — `defineService` returns `Promise<RunningService>`** (was `Promise<void>`).
All consumers `await` it top-level and ignore the value ⇒ safe; gives preset users the
same stop semantics (A3).

## 3. Open-decision sweep

| Question | Verdict |
| --- | --- |
| Exact `ServiceApp` member list | must resolve at impl start (slice 3); bounded by D-4 |
| Diagnostics as future public surface / separate package | safe to defer (debt note) |
| Scalar asset slimming | safe to defer (debt entry, D-9) |
| `LoggerMiddlewareOptions` re-export in mod.ts (cross-package type re-export vs F-15) | must resolve now → **keep**: it is a `@netscript/*` sibling type (F-15 targets third-party upstream), and logger owns it publicly; document in barrel |
| Unified mode (RFC 14) | out of scope by mandate — seams only (research §4) |
| Multi-entrypoint exports (e.g. `./primitives`) | safe to defer — single `.` entrypoint stays at alpha |

## 4. Commit slices (15 — well under 30)

1. `chore(service): standardize deno.json` (D-10)
2. `refactor(service): move sources under src/ (transient rename slice)` (D-1; rename-only, no logic)
3. `feat(service): add package-owned public types module` (D-3/D-4/D-6 types)
4. `refactor(service): primitives/handlers — drop StandardHandlerPlugin, typed returns` (D-6)
5. `refactor(service): primitives/openapi — explicit returns, factor module-level state`
6. `refactor(service): primitives/health — explicit return types`
7. `refactor(service): builder as interface + internal impl, with… renames, mirror types` (D-2/D-3/D-5)
8. `feat(service): serve() stop semantics (RunningService, AbortSignal); logger banner` (D-4/D-8)
9. `refactor(service): extract DB diagnostics to src/diagnostics/` (D-7)
10. `feat(service): defineService returns RunningService` (D-13)
11. `docs(service): rewrite mod.ts barrel with ≥30-line @module`
12. `docs(service): README (14 sections) + docs/ scaffold` (D-12)
13. `test(service): readme doctest runner + unit tests (builder chain, health, handlers, types assignability)`
14. `test(service): integration — serve on ephemeral port, /health round-trip, stop()`
15. `chore(repo): lift packages/service from root exclude; full gate sweep` (D-11)

Each slice ends `deno check --unstable-kv packages/service/mod.ts` green
(via `.llm/tools/run-deno-check.ts`).

## 5. Gates (exit criteria)

- `deno publish --dry-run` exit 0 (slow-types 0, excluded-module 0 after slice 15)
- `deno doc --lint` combined over all entrypoints **+ full-barrel mod.ts run**: 0 errors
- `deno check --unstable-kv` mod.ts + `deno task check:packages`: PASS
- lint + fmt clean; tests green incl. doctest runner
- A3 runtime validation: integration test boots `serve({ signal })` on an ephemeral
  port, fetches `/health` (200), aborts, asserts clean stop
- Consumer gates: `deno task check:plugins` (workers/sagas main.ts compile against new
  surface) — attribute any failure to the causing slice (consumer-gate attribution
  lesson)
- jsr-audit rubric applied to final surface (description, license, docs, exports,
  no slow types, no `any`)

## 6. Risk register

| Risk | L×I | Mitigation |
| --- | --- | --- |
| Root-exclude lift surfaces masked root-gate errors | M×M | slice 15 runs full sweep; fixes stay inside 5a scope or become drift entries |
| `ServiceMiddleware` mirror not assignable from real Hono middleware | M×H | compile-time assignability test in slice 13; telemetry precedent shows feasibility; fallback = widen ctx members |
| Diagnostics extraction changes dev-facing output | L×M | parity smoke vs stopped DB; formatting preserved per D-8 |
| `RunningService` change breaks plugin services at runtime | L×H | check:plugins + boot one plugin service manually if cheap |
| 3.3 MB publish size flagged by JSR | L×L | D-9 debt entry; under JSR limits |

## 7. Debt implications

- **New**: scalar.min.js vendored 3.3 MB in publish (revisit before beta);
  possible F-14 partial (diagnostics formatting through logger) if rendering degrades.
- **Cleared**: 8 slow-types, 14 ptr, 1 jsdoc, 2 `any` returns, 2 over-cap files,
  README/tests/docs-from-zero, deno.json gaps, root-exclude entry, naming violations,
  no-stop-semantics on serve.

## 8. Deferred scope

RFC 14 unified mode (seams documented only); `@netscript/ui-primitives` (forbidden);
diagnostics as standalone package; multi-entrypoint exports; scalar asset slimming;
defineService options schema validation.
