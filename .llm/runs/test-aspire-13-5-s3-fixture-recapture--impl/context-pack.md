# Context Pack: Aspire 13.5 S3 fixture re-capture

## Run Metadata

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| Run ID         | `test-aspire-13-5-s3-fixture-recapture--impl` |
| Branch         | `test/aspire-13-5-s3-fixture-recapture`       |
| Current phase  | `handoff — phase B pending`                   |
| Archetype      | `2 - Integration`                             |
| Scope overlays | `none`                                        |

## Current State

Draft PR #1741 contains pushed slices 1–4. Slice 5 has a green Phase-A gate set and records the
lease-backed phase-B handoff. No runtime has started, and the 13.5.3 telemetry envelope remains
absent by design.

## Completed

- Re-baseline, research, plan, Design checkpoint, and justified `PLAN-EVAL: N/A`.
- Slice 1 RED receipt at `receipts/01-parity-red.json`.
- Draft PR #1741 with labels, milestone 0.0.7, and S1 commit-trail comment.
- Slice 2 commit `b8b1c3b6f` pushed with its PR trail comment.
- Slice 3 commit `2e4e3e785` pushed with its PR trail comment; focused tests and doctrine gates
  pass.
- Slice 4 commit `37f0487f1` pushed with its PR trail comment.
- Final scoped check/lint/fmt, 263 tests, `quality:scan`, `arch:check`, and MCP export corpus pass.
- Deferred #413 comment text drafted for use only after phase B lands.

## In Progress

- Slice 5 evidence commit and PR trail update.

## Next Steps

1. Commit and push the slice 5 evidence and handoff artifacts.
2. Leave PR #1741 draft for Fable supervisor review.
3. Resume only after a runtime lease is granted for phase-B dashboard capture.

## Key Decisions

| Decision                   | Source              | Notes                                       |
| -------------------------- | ------------------- | ------------------------------------------- |
| Five-row expectation table | D-13 manifest       | Four required now; telemetry pending lease. |
| No self-certification      | harness lane policy | Fable supervisor owns review/evaluation.    |

## Files Changed

| Path                                                                                       | Status  | Notes                                                 |
| ------------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------- |
| `.llm/tools/validation/check-compat-fixtures_test.ts`                                      | new     | Phase-A parity gate.                                  |
| `.llm/runs/test-aspire-13-5-s3-fixture-recapture--impl/`                                   | new     | Harness state.                                        |
| `.llm/tools/agentic/teardown/__fixtures__/aspire-ps-13.5.3.json`                           | new     | Redacted S2 V5 snapshot.                              |
| `.llm/tools/agentic/teardown/__fixtures__/README.md`                                       | new     | Capture provenance.                                   |
| `.llm/tools/agentic/teardown/probes_test.ts`                                               | changed | Both Aspire versions exercise the same normalization. |
| `packages/mcp/tests/service-endpoint-source-fixtures.ts`                                   | changed | Redacted describe fixtures for both versions.         |
| `packages/mcp/tests/service-endpoint-sources_test.ts`                                      | changed | Both banners exercise the adapter.                    |
| `packages/mcp/tests/fixtures/README.md`                                                    | new     | Describe capture provenance.                          |
| `packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts`                  | changed | Both describe shapes exercise endpoint selection.     |
| `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-evidence_test.ts` | changed | Both banners exercise topology evidence.              |
| `packages/mcp/tests/fixtures/telemetry/README.md`                                          | new     | Lease-backed phase-B capture contract.                |

## Gates

| Gate family | Current status                                   | Evidence                                                       |
| ----------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Static      | S1 expected RED; final Phase-A scoped gates PASS | worklog + `receipts/05-scoped-gates.md`                        |
| Fitness     | PASS                                             | `receipts/05-quality-scan.json`, `receipts/05-arch-check.json` |
| Runtime     | N/A phase A                                      | telemetry README + drift entry                                 |
| Consumer    | PASS                                             | unchanged MCP export corpus in `receipts/05-scoped-gates.md`   |

## Open Questions

- None for phase A.

## Drift and Debt

- Drift: dashboard telemetry unavailable until phase B (minor, expected).
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
