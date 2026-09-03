# Context Pack: root README Quickstart clean-runner walk

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881` |
| Branch | `test/aspire-1881-readme-quickstart` |
| Current phase | `implement` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | docs |

## Current State

Coordinator-authorized issue #1881 is re-baselined at exact remote main `79adb103b`. Design is
locked and PLAN-EVAL is N/A because the issue contract resolves all material decisions. S1/S2 are
implemented together so the coordinator's `gates readme.quickstart` pre-push requirement can pass;
one pre-existing lint-wrapper coverage refusal is recorded.

## Completed

- Loaded all requested skills and relevant doctrine/harness profiles.
- Verified the existing README/suite/workflow/cleanup shapes and Aspire 13.5.3 wait syntax.
- Recorded design, slices, risks, gates, and the missing parent research artifact.
- Added the pure marker parser/substitution/argv/port rules and their tests.
- Added eleven ordered no-retry receipt gates plus unchanged ownership-aware cleanup.
- Addressed the first independent A1 review's isolated-root, AppHost, explicit-port, evidence, and
  test-strength findings.

## In Progress

- S1/S2 independent reviewer recheck.

## Next Steps

1. Re-run the exact pre-push gates, obtain reviewer PASS, commit, push, and comment on S1/S2.
2. Implement and review the isolated workflow slice.
3. Obtain separate-session final IMPL-EVAL without running local runtime gates.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One gate per exact parsed line, no retries | coordinator brief | Failures name the one-based README line. |
| Readiness is printed and executable | Aspire 13.5.3 help | `aspire wait postgres --status healthy --timeout 60`. |
| Runtime proof remains hosted | coordinator brief | Do not run runtime suites locally. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881/` | new | Harness activation artifacts. |
| `README.md` | changed | Marker block and executable Aspire readiness line. |
| `packages/cli/e2e/src/domain/readme-quickstart.ts` | new | Pure line-aware parser and expected command contract. |
| `packages/cli/e2e/tests/domain/readme-quickstart_test.ts` | new | Parser unit coverage. |
| `packages/cli/e2e/tests/presentation/readme-quickstart-drift_test.ts` | new | Root README drift pin. |
| `packages/cli/e2e/src/application/gates/quickstart/readme-command.ts` | new | IO-edge one-command runner and child receipts. |
| `packages/cli/e2e/suites/quickstart/readme-quickstart-suite.ts` | new | Published-CLI suite and cleanup composition. |
| `packages/cli/e2e/src/domain/cli-surface.ts` | changed | Stable suite/gate identifiers. |
| `packages/cli/e2e/src/presentation/cli/suites/registry.ts` | changed | Built-in suite registration. |
| `packages/cli/e2e/README.md` | changed | Suite table. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | check/test/fmt PASS; lint baseline refusal | 229 checked/formatted; 314 tests; lint has zero findings but cannot process seven existing standalone fixture files. |
| Fitness | PASS | `quality:gate` reports zero failures. |
| Runtime | NOT_RUN | Hosted next canary; no local lease. |
| Consumer | PASS | Suite listing includes `readme.quickstart`; gate listing prints 11 commands plus cleanup without starting resources. |

## Open Questions

- None.

## Drift and Debt

- Drift: parent research file absent; exact wait syntax verified locally instead. Exact lint wrapper
  refuses the baseline standalone desktop fixture's unresolved `catalog:` entry. README fidelity
  intentionally exposes dependency-recency and non-TTY behavior to the hosted verdict. RTK is not
  installed in the environment.
- Debt: no new or deepened debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
