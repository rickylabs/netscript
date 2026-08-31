# Plan: restore CLI/E2E compiler-lib parity

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cli-e2e-unstable-parity--1827` |
| Branch | `fix/cli-e2e-unstable-parity` |
| Phase | `implementation` |
| Target | `packages/cli/e2e` workspace member |
| Archetype | `6 — CLI / Tooling` (parent CLI surface) |
| Scope overlays | none |

## Archetype and Doctrine

Archetype 6 is the smallest fit because the member is the E2E harness for the shipped CLI. The
current doctrine verdict for `packages/cli` is **Keep**: preserve its Archetype-6 kernel/surface
split. This config-only leaf changes no layering or public surface. A14 (tests and gates preserve
doctrine) applies directly. AP-20/F-8 is the defect and closing fitness rule.

## Goal and Scope

- Add a focused test that derives the expected compiler-lib list from production
  `packages/cli/deno.json`.
- Commit and capture that test failing before the config fix.
- Make the member `compilerOptions.lib` exactly match production order.
- Run every owner-specified gate without changing `deno.lock`.

## Non-Scope

- No `health.ts`, Features #1762-owned files, or `.llm/tools/run-deno-check.ts` changes.
- No dependency/version/public API changes and no release or scaffold behavior work.
- No top-level `unstable` duplication; this slice concerns `compilerOptions.lib` parity.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Compare member `compilerOptions.lib` with `packages/cli/deno.json` programmatically and exactly. | The production CLI config—not repository root—is the canonical oracle; exact comparison detects missing values and order drift without a duplicate hardcoded list. |
| D2 | Place the test in `packages/cli/e2e/tests/config-lib-parity_test.ts`. | Keeps the focused invariant with the member that owns it. |
| D3 | Use two commits: failing test, then config fix plus final evidence. | Preserves auditable RED→GREEN history required by the owner. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Any implementation choice requiring rework | none open | Contract and file scope are fully specified. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A hardcoded test list drifts with production. | Read `packages/cli/deno.json` at test runtime. |
| A repository-root oracle imposes the wrong order. | Resolve `../../deno.json` empirically from the E2E test directory and record the correction in drift. |
| Warm cache masks compiler-lib failure. | Run full `deno task check` with a fresh isolated `DENO_DIR`. |
| Lock/source scope churn. | Capture `git diff --exit-code -- deno.lock` and inspect changed paths before commits. |
| Crossing into #1762. | Stop if any file beyond the parity test, member config, and run artifacts is required. |

## Fitness Gates and Validation

| Order | Gate | Expected result |
| --- | --- | --- |
| 1 | Focused parity test before config fix | nonzero for exact array mismatch |
| 2 | Focused parity test after config fix | exit 0, 1 passed / 0 failed |
| 3 | Existing `.llm/tools/run-deno-check_test.ts` | exit 0 |
| 4 | Scoped check/lint/fmt wrappers plus relevant E2E tests | exit 0 with recorded counts |
| 5 | `deno task quality:gate` | exit 0; package-path harness requirement |
| 6 | Full `deno task check` under fresh isolated `DENO_DIR` | exit 0 |
| 7 | `git diff --exit-code -- deno.lock` and forbidden-path inspection | exit 0 / no forbidden paths |

## Arch-Debt and Drift

No new or deepened architecture debt is expected. RTK absence on this host is a tooling fallback,
not product drift, and is recorded in `drift.md`.
