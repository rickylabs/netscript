# Plan: issue #569 Hono OTel instrumentation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-569-telemetry-hono-otel--impl` |
| Branch | `feat/569-telemetry-hono-otel` |
| Phase | `impl` |
| Target | `packages/telemetry`, `packages/service` |
| Archetype | `2 - Integration` for `@netscript/telemetry`; `4 - Public DSL/Builder` consumer for `@netscript/service` |
| Scope overlays | `service` |

## Archetype

`@netscript/telemetry` is an integration package: it wraps OTel and framework instrumentation behind
NetScript-owned surfaces. `@netscript/service` consumes that package through its Hono builder seam.

## Current Doctrine Verdict

`@netscript/telemetry`: Refactor — confirm port + adapter split; OTEL adapter as subpath export.
`@netscript/service`: Refactor — `presets/` named, `assets/` clarified. This slice must not deepen
either verdict.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The new `./hono` public subpath is the contract. |
| A6/A7 | Wrap first-party `@hono/otel`; do not hand-roll HTTP span lifecycle. |
| A8/A9 | Keep the Hono adapter in a named `src/hono/` surface matching the existing `src/orpc/` seam. |
| A14 | Publish dry-runs, check/lint/fmt, and span hierarchy tests prove the slice. |

## Goal

Expose first-party Hono OTel middleware through `@netscript/telemetry/hono` and wire it into
`@netscript/service` as the first builder-owned Hono middleware so routed requests get a
parameterized Hono application span that preserves downstream active context.

## Scope

- Add `packages/telemetry/hono.ts` and `packages/telemetry/src/hono/*`.
- Add `@hono/otel@^1.1.2` through `deno add` and keep `deno.lock` resolver-owned.
- Register the middleware in `ServiceBuilderImpl`.
- Add tests proving the Hono span route name/attributes and downstream child parenting.

## Non-Scope

- Do not disable Deno-native `OTEL_DENO` or suppress transport spans.
- Do not rework oRPC tracing semantics in this issue.
- Do not touch dashboard files.

## Hidden Scope

- Existing PR #570 is a plan-eval draft on `openhands/569-1`; the implementation PR must target
  `main` from `feat/569-telemetry-hono-otel`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `@hono/otel@^1.1.2` via `deno add`. | Stable JSR package; lockfile stays resolver-owned. |
| D2 | Export `./hono` as a facade mirroring `./orpc`. | Additive public surface. |
| D3 | Delegate span lifecycle and propagation to upstream. | Wrap-don't-reinvent. |
| D4 | Add only active-span NetScript attributes. | Thin adapter law; preserves upstream route naming. |
| D5 | Service registers Hono tracing before cors/logger/auth/RPC. | Downstream middleware and handlers run under the Hono span. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Upstream function name | resolved | `httpInstrumentationMiddleware`, not `otel`, per `deno doc`. |
| Raw URL attributes | resolved | Avoid NetScript raw URL attribute to preserve cardinality fix. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Duplicate or hand-rolled HTTP spans | Wrapper delegates to `@hono/otel`; no `startSpan` or `.end()` in NetScript adapter. |
| Route cardinality regression | Test asserts parameterized route span name / `http.route`. |
| Service middleware order regression | Builder wiring test asserts custom downstream route sees active Hono span. |
| Publish slow types | Raw `deno publish --dry-run` for telemetry and service. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Do not wrap platform/OTel primitives except to add NetScript policy attributes. |
| AP-11 | risk | No provider globals or env reads in the new adapter. |
| AP-14 | risk | Do not re-export upstream package wholesale; expose a NetScript factory. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5/F-6/F-7 | yes | Export map and raw publish dry-runs. |
| F-19 | yes | Scoped check/lint/fmt wrappers for telemetry and service. |
| Runtime/service | yes | Unit tests for Hono span route/parenting and service wiring. |

## Arch-Debt Implications

No new debt expected.
