# Context Pack: issue #569 Hono OTel instrumentation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-569-telemetry-hono-otel--impl` |
| Branch | `feat/569-telemetry-hono-otel` |
| Current phase | `implement` |
| Archetype | `2 - Integration` |
| Scope overlays | `service` |

## Current State

Implementation started from issue #569 PLAN-EVAL PASS. `@hono/otel@^1.1.2` was added through
`deno add` in `packages/telemetry`. The first source slice adds `@netscript/telemetry/hono` and a
thin active-span enrichment wrapper around upstream `httpInstrumentationMiddleware`; its narrow
`deno check` passed.

## Completed

- Read harness, doctrine, Deno toolchain, JSR audit, tools, PR, CLI, WSL, and RTK skills.
- Re-baselined branch against `origin/main` at `4c4f6b453b54edb416425324048231952e9f2f47`.
- Confirmed issue #569 PLAN-EVAL PASS and WDR correction.

## In Progress

- Slice 1 telemetry seam/adapter is ready to commit and push.

## Next Steps

1. Run slice check for telemetry facade.
2. Commit/push slice 1 with explicit refspec.
3. Open the proper draft implementation PR from `feat/569-telemetry-hono-otel` if it does not exist.
4. Continue dependency, service wiring, and tests slices.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Keep `OTEL_DENO` transport spans enabled. | issue #569 WDR correction | Hono span nests under Deno transport span. |
| Use `httpInstrumentationMiddleware`. | `deno doc jsr:@hono/otel` | Actual upstream exported function. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/telemetry/hono.ts` | new | Public facade. |
| `packages/telemetry/src/hono/mod.ts` | new | Subpath module. |
| `packages/telemetry/src/hono/otel-middleware.ts` | new | Thin adapter. |
| `packages/telemetry/deno.json` | changed | Adds `./hono`, check target, and `@hono/otel` import. |
| `deno.lock` | changed | Resolver-owned lock update; pre-existing unrelated lock churn remains present. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | partial PASS | `deno check --unstable-kv packages/telemetry/hono.ts` exit 0; `git diff --check` exit 0. |
| Fitness | pending | Final wrapper gates not run yet. |
| Runtime | pending | Tests not added yet. |
| Consumer | pending | Service wiring not complete yet. |

## Open Questions

- None blocking. Existing oRPC child-span wording is stale relative to current `origin/main`.

## Drift and Debt

- Drift: OpenHands plan PR #570 exists on `openhands/569-1`; implementation will use the required
  feature branch PR.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
