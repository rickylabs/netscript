# Worklog: emitted fail-fast for declared background references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-declared-reference-fail-fast--1371` |
| Branch | `fix/aspire-declared-reference-fail-fast` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Design

### Public Surface

- No exported API changes. `generateRegisterBackground()` preserves its signature and emits a stricter startup contract.

### Domain Vocabulary

- Declared background reference — required `ServiceReferences` or `PluginReferences` entry.
- Resolvable reference — map resource whose `http` endpoint returns a truthy Aspire endpoint expression.
- Background processor configuration error — deterministic pre-registration failure for an unresolvable declared reference.

### Ports

- `_services` / `_plugins` maps and each resource's `getEndpoint('http')` are the existing emitted resolution seams; no new port.

### Constants

- Raw discovery key shape: `services__<reference>__http__0`.
- Locked error shape: `Background processor configuration error: '<processor>' could not resolve <kind> reference '<reference>' HTTP endpoint.`

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove the admitted contract is RED with emitted-module service/plugin positive and negative cases plus raw-key parity. | Focused structured test wrapper must fail for the expected missing throws/preflight. | New background test + run artifacts |
| 2 | Emit pre-registration fail-fast and produce all final-head static/publish/audit receipts. | Focused wrappers plus complete owner-specified gate set. | Generator + test/run-artifact updates |

### Deferred Scope

- Apps/plugins registration, SDK/browser normalization, #1365, runtime leases, Aspire/Docker/E2E — explicitly outside issue #1371 correction.

### Contributor Path

Add a background reference category in `generate-register-background.ts`, extend the same emitted-module test matrix, and keep endpoint preflight before `addExecutable` with successful binding before `backgroundProcessors.set`.

## PLAN-EVAL

`N/A` — owner-designated bounded correction with an admitted contract, exact scope, required RED cases, deterministic requirements, and a locked static gate set. No material architecture or trade-off decision remains.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-29 | bootstrap | activated | Clean branch verified at exact supplied base; requested skills/doctrine/harness documents loaded. |
| 2026-08-29 | 1 | RED | Structured focused wrapper exited 1: 3 passed, 6 failed. Four negative cases failed with `Expected function to reject`; the emitted preflight-order assertion also failed (plus the suite aggregate). This is the expected pre-fix failure. |
| 2026-08-29 | 1 | Tier-A review | Fresh internals review required exact error-message equality instead of substring matching and reduced the static order assertion to a stable emitted error fragment; both changes applied before the RED commit. Reviewer otherwise confirmed complete scope/coverage and one-file feasibility. |
| 2026-08-29 | 1 | Neighbor-suite audit | Read `generators-background-app_test.ts` and `service-environment-runtime_test.ts` in full. They cover generator shape and service environment precedence respectively; neither asserts silent background reference behavior. The new emitted-background suite complements them and no existing expectation needs updating. |
| 2026-08-29 | 1 | Tier-A re-review | Fresh reviewer reproduced exit 1 with 3 passed / 6 failed and found no remaining issues after the exact-message and stable-order corrections. RED slice disposition: acceptable to commit. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Resolve before resource creation | Prevent any misconfigured processor from reaching registration/running state. | Issue #1371 admitted design; A13 |
| Preserve raw hyphenated key | Verified producer/consumer contract. | Issue #1371 verification; SDK `createServerServiceEnvKey` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Requested implementation gate file is absent at current/base tree. | minor | yes |

## Gate Results

### RED Evidence

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| Focused emitted-module test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-background_test.ts` | EXPECTED FAIL (exit 1) | Wrapper summary: `passed: 3`, `failed: 6`, `totalResults: 9`, `uniqueFailures: 3`; four cases reported `AssertionError: Expected function to reject`, and preflight ordering failed. |

Final-head gate tables will be filled with exact receipts after slice 2.

## Handoff Notes

- Inspect emitted preflight ordering first, then the runtime-style missing/present/unresolved service/plugin matrix and raw-key parity.
