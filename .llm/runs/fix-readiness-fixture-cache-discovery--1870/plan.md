# Plan: readiness fixture cache discovery

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-readiness-fixture-cache-discovery--1870` |
| Branch | `fix/readiness-fixture-cache-discovery` |
| Phase | `plan` |
| Target | `packages/cli/e2e` repository tooling |
| Archetype | N/A — E2E consumer tooling, not package/plugin framework source |
| Scope overlays | none |

## Goal

Make D-101 discover the generated RESP cache binding, health-check key, and Aspire resource name,
while preserving its closed ownership contract for synthetic checks.

## Scope

- Add a generator-backed RED regression for the default Redis cache.
- Discover one internally consistent RESP attachment from `register-infrastructure.mts`.
- Thread the discovery through injection, expectations, and ownership validation.
- Cover real Redis and Garnet generator output plus zero/multiple-attachment refusal.
- Capture the actual same-flags E2E scaffold cache block and record the anomaly honestly.

## Non-Scope

- `packages/cli/src/**`, scaffold defaults, and generator behavior.
- `runtime-gates.ts`, `runtimeResources()`, `verify-listener-readiness.ts`, or `runtime.wait.garnet`.
- Full runtime E2E execution or runtime-lease acquisition.
- PR #1858's timeout adjustment and PR #1865's Flow-B fixture.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Parse the generated helper already read by the fixture. | It is the runtime artifact and avoids configuration coupling. |
| D2 | Require exactly one `*_resp` attachment and one matching `caches.set(name, binding)`. | Zero, ambiguity, or inconsistent triples must fail closed. |
| D3 | Pass the typed discovery into listener expectations and ownership checks. | Resource, real key, and injection binding stay coherent. |
| D4 | Keep the test-only keys and synthetic controller listener names unchanged. | They are fixture-owned contract values, not backend assumptions. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Cause of run `33425281612` using Garnet | safe to defer | Capture current same-flags E2E scaffold evidence; do not invent historical attribution. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A broad health-check match weakens ownership. | Match only `*_resp`, enforce uniqueness, and verify key/name/binding consistency. |
| Fixing injection alone moves the failure later. | Thread the same discovery through expectations and ownership assertion. |
| Generator fixture drifts from production. | Generate test inputs with `generateRegisterInfrastructure` and `buildCacheBlock`. |
| Lock or unrelated file churn enters commits. | Inspect raw git state and `deno.lock` before each commit. |

## Validation Plan

| Order | Gate | Expected result |
| --- | --- | --- |
| 1 | Focused RED test | One failed test with the historical Garnet-marker error. |
| 2 | Gates test wrapper | Exit 0. |
| 3 | E2E check wrapper | Exit 0. |
| 4 | E2E lint wrapper | Exit 0. |
| 5 | E2E format wrapper | Exit 0. |

## Deferred Scope

- Hosted `scaffold.runtime` execution is coordinator/CI-owned because this slice has no host lease.
- The separate `runtime.wait.garnet` naming concern remains outside #1870.

## Drift Watch

- Any need to edit generator source or the prohibited runtime files stops the slice.
- Any `deno.lock` movement stops the slice.
- Any current same-flags scaffold result other than Redis must be recorded without inferred cause.
