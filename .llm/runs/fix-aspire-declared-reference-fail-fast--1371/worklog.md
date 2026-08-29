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
| 2026-08-29 | 2 | implementation | Moved service/plugin endpoint resolution before `builder.addExecutable`, emitted the locked deterministic error for falsey endpoints, and bound successful endpoints afterward with the raw key unchanged. |
| 2026-08-29 | 2 | focused GREEN | New emitted-module suite passed 9/9; combined neighboring suites passed 69/69; focused check/lint/fmt selected both changed files with zero findings. |
| 2026-08-29 | 2 | preliminary gates | Full static, quality, doctrine, assets, publish, and CLI JSR audit gates exited 0. These results are recorded for the sign-off commit; every required receipt will be rerun at the resulting final head before push. |
| 2026-08-29 | 2 | Tier-A review | Fresh internals review found no substantive issues and accepted the slice for commit. It confirmed both-kind preflight before `addExecutable`, deterministic exact errors, kind/index collision safety, raw-key preservation, empty registrations on failure, unchanged neighboring expectations, and unchanged generated assets. |

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

### Static Gates — preliminary sign-off pass

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused emitted-module test | PASS | 9 passed, 0 failed. |
| Focused neighborhood test | PASS | New suite + `generators-background-app_test.ts` + `service-environment-runtime_test.ts`: 69 passed, 0 failed. |
| Focused check | PASS | 2 files selected, 1 batch, 0 findings. |
| Focused lint | PASS | 2 files selected/processed, 0 findings; explicit temporary config bypasses the intentional root CLI exclusion while retaining repo lint rules. |
| Focused fmt | PASS | 2 files selected/processed, 0 findings; explicit temporary config bypasses the intentional root CLI exclusion. |
| Root check | PASS | 2,926 files, 25 batches, 0 failed batches/findings. |
| Root test | PASS | 4,242 passed, 19 ignored, 0 failed (4,261 total). |
| Root lint | PASS | 2,041 files processed, 0 findings. |
| Root fmt | PASS | 2,041 files processed, 0 findings. |

### Fitness / Publish Gates — preliminary sign-off pass

| Gate | Result | Evidence / baseline disclosure |
| --- | --- | --- |
| `quality:scan` | PASS | `ok: true`, no findings, `allowCount: 7`, no allowance failures. |
| `arch:check` | PASS | Exit 0. Existing dependency/doctrine WARN output remains baseline; no new fail or debt. |
| `check:assets-barrel` | PASS | Canonical regeneration produced no generated-file diff; slotted template/assets unchanged. |
| CLI publish dry run | PASS with existing WARN baseline | `Success Dry run complete`; existing unanalyzable dynamic-import/import-meta-resolve warnings remain. |
| Per-member CLI JSR audit | PASS with existing WARN baseline | Exit 0; 19 findings, all WARN; `slowTypeWarnings=1` banner baseline; no new finding attributed to this change. |

### Runtime / Consumer Gates

| Gate | Result | Evidence / rationale |
| --- | --- | --- |
| Aspire / Docker / browser / Playwright / `scaffold.runtime` / `e2e:cli` | N/A | Explicitly unavailable: no runtime lease. None attempted. |
| Raw key consumer parity | PASS | Both emitted kinds equal SDK `createServerServiceEnvKey('workers-api')` → `services__workers-api__http__0`; underscore form absent. |

The complete required set will be rerun without tracked changes at the final committed head; those exact-SHA receipts will be posted on the draft PR and included in handoff.

## Handoff Notes

- Inspect emitted preflight ordering first, then the runtime-style missing/present/unresolved service/plugin matrix and raw-key parity.
