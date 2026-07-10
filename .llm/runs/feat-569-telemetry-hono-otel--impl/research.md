# Research — feat-569-telemetry-hono-otel--impl

## Re-baseline

- Carried-in source: issue #569 plan comment `issuecomment-4913551695`, PLAN-EVAL PASS
  `issuecomment-4913616168`, and WDR owner correction `issuecomment-4914633545`.
- Re-derived against `main` @ `4c4f6b453b54edb416425324048231952e9f2f47` on 2026-07-08.
- What changed vs the carried-in version:
  - WDR correction says Deno-native `OTEL_DENO=true` transport spans stay enabled and the Hono span
    nests under them, not as the absolute root.
  - Current `origin/main` still has oRPC tracing as enrich-only active-span logic, not a
    first-party `@orpc/otel` child-span implementation. The Hono middleware must therefore preserve
    downstream active context so oRPC enrichment and any child spans run under the Hono span.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `@netscript/telemetry` has `./orpc` but no `./hono` export before this run. | `packages/telemetry/deno.json`; `packages/telemetry/orpc.ts` |
| 2 | Hono first-party OTel package resolves stable `@hono/otel@1.1.2` and exports `httpInstrumentationMiddleware(userConfig: HttpInstrumentationConfig): MiddlewareHandler`. | `deno doc jsr:@hono/otel`; `deno doc --filter httpInstrumentationMiddleware jsr:@hono/otel` |
| 3 | Upstream `@hono/otel` starts a SERVER span, extracts W3C context, and updates span name / `http.route` with Hono's parameterized route after routing. | Deno cache for `jsr:@hono/otel@1.1.2/src/index.ts` |
| 4 | `packages/service/src/builder/service-builder-impl.ts` builds `new Hono()` and currently registers caller middleware, auth, health, docs, and RPC without a global Hono OTel middleware. | `packages/service/src/builder/service-builder-impl.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/telemetry/deno.json` export map and `packages/service/deno.json`.
- Slow-type / surface risks: the new `./hono` export must expose explicit function and option types;
  service currently has a sanctioned slow-type task but issue #569 requires raw package dry-runs
  without `--allow-slow-types` as evidence.

## Open questions

- None blocking implementation. The upstream package's public function name is
  `httpInstrumentationMiddleware`, not `otel`; the wrapper uses the actual documented stable API.
