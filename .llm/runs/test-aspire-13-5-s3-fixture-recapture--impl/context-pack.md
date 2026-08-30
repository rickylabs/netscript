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

Draft PR #1741 is open from slice 1. Slice 2 now contains the redacted S2-derived 13.5.3 `aspire ps`
fixture and dual-version teardown probe cases. No runtime has started.

## Completed

- Re-baseline, research, plan, Design checkpoint, and justified `PLAN-EVAL: N/A`.
- Slice 1 RED receipt at `receipts/01-parity-red.json`.
- Draft PR #1741 with labels, milestone 0.0.7, and S1 commit-trail comment.

## In Progress

- Slice 2 commit/push and PR trail comment; all proving gates pass, while supervisor review remains pending.

## Next Steps

1. Commit, push, and comment slice 2.
2. Implement S2-derived describe/banner cases.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | S1 expected RED; S2 check/test/fmt and raw excluded lint PASS | worklog gate table |
| Fitness | pending | slice 5 |
| Runtime | N/A phase A | lease boundary |
| Consumer | pending | export corpus gate |

## Open Questions

- None for phase A.

## Drift and Debt

- Drift: dashboard telemetry unavailable until phase B (minor, expected).
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
