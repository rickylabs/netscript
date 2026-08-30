# Context Pack: Aspire 13.5 S3 fixture re-capture

## Run Metadata

| Field          | Value                                                     |
| -------------- | --------------------------------------------------------- |
| Run ID         | `test-aspire-13-5-s3-fixture-recapture--impl`             |
| Branch         | `test/aspire-13-5-s3-fixture-recapture`                   |
| Current phase  | `phase B attempt 3 complete — capture and teardown green` |
| Archetype      | `2 - Integration`                                         |
| Scope overlays | `none`                                                    |

## Current State

Attempt 3 captured real Aspire Dashboard 13.5.3 resources and spans envelopes after the scaffolded
`health-check` trigger. The retained 13.4.6 and new 13.5.3 MCP consumer cases pass, and telemetry
parity is now `required`. All Phase-A scoped gates pass. Exact owned teardown is complete: leak
survivors `[]`, Aspire `[]`, volumes zero, and only the three foreign supervisor relay containers
remain; the scratch tree is removed.

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
- Slice 5 commit `a964a2120` pushed with its PR trail comment.
- IMPL-EVAL cycle 1 findings H-1, M-1, L-1, and L-2 fixed in slice 6.
- Configured lint (2,043 files), scoped check/lint/fmt, fallback coverage, 263 tests,
  `quality:scan`, `arch:check`, and MCP export corpus pass after the fixes.

## In Progress

- Commit/push the final attempt-3 run artifacts and post the structured IMPL phase comment without
  changing draft/readiness/labels.

## Next Steps

1. Supervisor reviews the three phase-B commits and receipt.
2. A separate evaluator session owns any subsequent IMPL-EVAL; this implementation thread does not
   write evaluator artifacts.

## Key Decisions

| Decision                   | Source              | Notes                                    |
| -------------------------- | ------------------- | ---------------------------------------- |
| Five-row expectation table | D-13 manifest       | All five rows are now required.          |
| No self-certification      | harness lane policy | Fable supervisor owns review/evaluation. |

## Files Changed

| Path                                                                                       | Status  | Notes                                                                 |
| ------------------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------- |
| `.llm/tools/validation/check-compat-fixtures_test.ts`                                      | new     | Phase-A parity gate.                                                  |
| `.llm/runs/test-aspire-13-5-s3-fixture-recapture--impl/`                                   | new     | Harness state.                                                        |
| `.llm/tools/agentic/teardown/__fixtures__/aspire-ps-13.5.3.json`                           | new     | Redacted S2 V5 snapshot.                                              |
| `.llm/tools/agentic/teardown/__fixtures__/README.md`                                       | new     | Capture provenance.                                                   |
| `.llm/tools/agentic/teardown/probes_test.ts`                                               | changed | Both Aspire versions exercise the same normalization.                 |
| `packages/mcp/tests/service-endpoint-source-fixtures.ts`                                   | changed | Verbatim 13.4.6 plus independent bannerless S2-derived 13.5.3.        |
| `packages/mcp/tests/service-endpoint-sources_test.ts`                                      | changed | Preserves fallback assertions and exercises the 13.5.3 receipt shape. |
| `packages/mcp/tests/fixtures/README.md`                                                    | new     | Describe capture provenance.                                          |
| `packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts`                  | changed | Both describe shapes exercise endpoint selection.                     |
| `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-evidence_test.ts` | changed | Retained 13.4.6 case plus bannerless 13.5.3 topology evidence.        |
| `packages/mcp/tests/fixtures/telemetry/README.md`                                          | new     | Lease-backed phase-B capture contract.                                |

## Gates

| Gate family | Current status                                    | Evidence                                                       |
| ----------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Static      | S1 expected RED; slice-6 evaluator-fix gates PASS | worklog + `receipts/06-scoped-gates.md`                        |
| Fitness     | PASS                                              | `receipts/06-quality-scan.json`, `receipts/06-arch-check.json` |
| Runtime     | PASS phase B                                      | `receipts/09-phase-b-attempt-3-capture.md`; teardown complete  |
| Consumer    | PASS                                              | unchanged MCP export corpus in `receipts/06-scoped-gates.md`   |

## Open Questions

- Consumer-run gap: a future 13.5.3 fixture captured from a streams-enabled topology can add direct
  consumer/`job.execute`, listed-run, and found last-job evidence; until then, completed-run
  coverage lives in the retained 13.4.6 fixture and hosted `scaffold.runtime` suite.
- Web-health gap: a future full-topology fixture with `database.codegen` can replace the 12 scoped
  scratch `/health` 500 responses; those responses are not treated as Aspire 13.5.3 behavior.

## Drift and Debt

- Drift: attempt 3 used the supervisor-owned loopback relay to close the previously recorded
  remote-DinD endpoint gap; relay resources remained foreign and untouched. The brief-scoped scratch
  omitted database.codegen and streams, so its degraded capture semantics are documented and
  completed-run coverage is routed to 13.4.6 plus hosted `scaffold.runtime`.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
