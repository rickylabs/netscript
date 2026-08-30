# Context Pack: Aspire 13.5 S3 fixture re-capture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-aspire-13-5-s3-fixture-recapture--impl` |
| Branch | `test/aspire-13-5-s3-fixture-recapture` |
| Current phase | `implement` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

Draft PR #1741 contains pushed slices 1–2. Slice 3 now adds S2-derived 13.5.3 banner/describe cases
beside retained 13.4.6 cases across MCP and CLI E2E. No runtime has started, and dashboard telemetry
remains absent by design.

## Completed

- Re-baseline, research, plan, Design checkpoint, and justified `PLAN-EVAL: N/A`.
- Slice 1 RED receipt at `receipts/01-parity-red.json`.
- Draft PR #1741 with labels, milestone 0.0.7, and S1 commit-trail comment.
- Slice 2 commit `b8b1c3b6f` pushed with its PR trail comment.

## In Progress

- Slice 3 commit/push and PR trail comment; scoped tests and doctrine gates pass.

## Next Steps

1. Commit, push, and comment slice 3.
2. Record the executable phase-B telemetry deferral.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Five-row expectation table | D-13 manifest | Four required now; telemetry pending lease. |
| No self-certification | harness lane policy | Fable supervisor owns review/evaluation. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/validation/check-compat-fixtures_test.ts` | new | Phase-A parity gate. |
| `.llm/runs/test-aspire-13-5-s3-fixture-recapture--impl/` | new | Harness state. |
| `.llm/tools/agentic/teardown/__fixtures__/aspire-ps-13.5.3.json` | new | Redacted S2 V5 snapshot. |
| `.llm/tools/agentic/teardown/__fixtures__/README.md` | new | Capture provenance. |
| `.llm/tools/agentic/teardown/probes_test.ts` | changed | Both Aspire versions exercise the same normalization. |
| `packages/mcp/tests/service-endpoint-source-fixtures.ts` | changed | Redacted describe fixtures for both versions. |
| `packages/mcp/tests/service-endpoint-sources_test.ts` | changed | Both banners exercise the adapter. |
| `packages/mcp/tests/fixtures/README.md` | new | Describe capture provenance. |
| `packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts` | changed | Both describe shapes exercise endpoint selection. |
| `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-evidence_test.ts` | changed | Both banners exercise topology evidence. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | S1 expected RED; S2/S3 scoped gates PASS | worklog gate table |
| Fitness | slice 3 quality/architecture PASS | `quality:scan`, `arch:check` |
| Runtime | N/A phase A | lease boundary |
| Consumer | pending | export corpus gate |

## Open Questions

- None for phase A.

## Drift and Debt

- Drift: dashboard telemetry unavailable until phase B (minor, expected).
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
