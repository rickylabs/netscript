# Worklog: issue #569 Hono OTel instrumentation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-569-telemetry-hono-otel--impl` |
| Branch | `feat/569-telemetry-hono-otel` |
| Archetype | `2 - Integration` |
| Scope overlays | `service` |

## Design

### Public Surface

- `@netscript/telemetry/hono` — facade for Hono tracing middleware.
- `createHonoTracingMiddleware(options)` — NetScript factory around `@hono/otel`.
- `HonoTracingMiddlewareOptions` / `HonoTracingMiddleware` — explicit public types.

### Domain Vocabulary

- `serviceName` — NetScript service identity forwarded to upstream and recorded as `rpc.service`.
- `attributePrefix` — optional prefix matching the oRPC tracing plugin convention.
- `netscript.http.*` — NetScript-owned request attributes layered onto the active Hono span.

### Ports

- No new package-owned port. `@hono/otel` is the external framework instrumentation adapter and is
  wrapped directly because the variation axis is not open.

### Constants

- Attribute keys remain literal and colocated with the adapter; no finite enum is introduced.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Telemetry Hono facade and thin adapter | `deno check --unstable-kv packages/telemetry/hono.ts` | `packages/telemetry/hono.ts`, `packages/telemetry/src/hono/*`, `packages/telemetry/deno.json`, run artifacts |
| 2 | Dependency pin | `deno task deps:latest --filter @hono/otel`; `git diff deno.lock` review | `packages/telemetry/deno.json`, `deno.lock` |
| 3 | Service builder wiring | `deno check --unstable-kv packages/service/mod.ts` | `packages/service/src/builder/service-builder-impl.ts` |
| 4 | Tests and final gates | telemetry/service tests, scoped wrappers, raw publish dry-runs | `packages/telemetry/tests/hono/*`, `packages/service/tests/*`, run artifacts |

### Deferred Scope

- oRPC child-span creation is not changed because current `origin/main` oRPC telemetry is enrich-only.
- Deno-native transport spans remain enabled and are not suppressed.

### Contributor Path

To add Hono instrumentation options, extend `HonoTracingMiddlewareOptions` in
`packages/telemetry/src/hono/otel-middleware.ts` only when the option is NetScript-specific; otherwise
pass upstream `@hono/otel` config through unchanged.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-08 | 1 | started | Added facade and adapter after `deno doc jsr:@hono/otel` confirmed upstream API. |
| 2026-07-08 | 1 | gate | `deno check --unstable-kv packages/telemetry/hono.ts` exited 0. |
| 2026-07-08 | 2 | gate | `deno task deps:latest --filter @hono/otel` reported `0 behind / 1 total`; telemetry facade check still exits 0. |
| 2026-07-08 | 3 | gate | `deno check --unstable-kv packages/service/mod.ts` exited 0 after constructor-first Hono tracing wiring. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use upstream `httpInstrumentationMiddleware` | Actual public API in `@hono/otel@1.1.2`. | `deno doc jsr:@hono/otel` |
| Do not set a raw URL NetScript attribute | Preserve parameterized route cardinality goal. | issue #569 WDR correction |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Existing PR #570 is an OpenHands plan draft, not the implementation PR branch. | minor | yes |
| Current `origin/main` oRPC tracing remains enrich-only, so tests prove downstream active-span parenting rather than an existing oRPC-created child span. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Slice 1 check | `deno check --unstable-kv packages/telemetry/hono.ts` | PASS | Exit 0 |
| Whitespace | `git diff --check` | PASS | Exit 0 |
| Slice 2 stable dependency | `deno task deps:latest --filter @hono/otel` | PASS | `0 behind / 1 total` |
| Slice 2 check | `deno check --unstable-kv packages/telemetry/hono.ts` | PASS | Exit 0 |
| Slice 3 service check | `deno check --unstable-kv packages/service/mod.ts` | PASS | Exit 0 |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-19 | NOT_RUN | Pending scoped wrappers | Final gate phase |

### Runtime Gates

Pending tests.
