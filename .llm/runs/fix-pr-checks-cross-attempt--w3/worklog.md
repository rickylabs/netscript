# Worklog: cross-attempt PR-check supersession

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-pr-checks-cross-attempt--w3` |
| Branch | `fix/pr-checks-cross-attempt` |
| Archetype | N/A — repository tooling |
| Scope overlays | none |

## Design

### Public Surface

- `agentic:pr-checks -- --repo <owner/name> --pr <n> [--pretty|--json]` retains its CLI and report
  contract.
- Pure reconciliation/classification helpers remain exported for deterministic fixtures.

### Domain Vocabulary

- `CheckRun` — a commit check-run candidate.
- `WorkflowRun` — a GitHub Actions run for the PR head, including its attempt number.
- `WorkflowJob` — the latest-attempt job and its correlated check-run identity.
- `ClassifiedCheckRun` — effective latest truth labelled for reporting.

### Ports

- GitHub REST through the existing `gh api` command seam — pull request, commit check-runs,
  workflow runs, and latest jobs.

### Constants

- Existing `CHECK_*` classification constants remain the finite report vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Attempt-aware Actions job reconciliation, fixtures, and evidence | focused test + scoped wrappers + historical/live verification | `.llm/tools/agentic/github/pr-checks.ts`, `pr-checks_test.ts`, this run dir |

### Deferred Scope

- GitHub rules-engine remediation — unavailable through this read-only tool.

### Contributor Path

Start in `pr-checks.ts` at the GitHub fetch/reconciliation helpers; add a pure fixture beside the
existing classifier cases in `pr-checks_test.ts`, then run the three scoped wrappers.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04T09:24+02:00 | bootstrap | re-baseline | Fast-forwarded clean branch to `origin/main` at `f7558aa1c`. |
| 2026-08-04T09:24+02:00 | research | issue/live read | Historical evidence recorded; current fresh-head PR #1181 exits 0 with 14 checks and 0 current failures. |
| 2026-08-04T09:28+02:00 | S1 | RED | Added the cross-attempt fixtures before implementation; type check failed because `mergeLatestWorkflowJobs` and `WorkflowJob` did not exist. |
| 2026-08-04T09:29+02:00 | S1 | implementation | Added latest-attempt workflow jobs, check-run URL correlation, explicit attempt precedence, queued-job fallback, and exit-code seam. |
| 2026-08-04T09:33+02:00 | S1 | slice review | Opus opposite-family review found 2 high, 2 medium, and 2 low issues; all were addressed. Re-review session `833cdc49-8d3f-42ea-a8a9-0f9416d5aef2` returned PASS. |
| 2026-08-04T09:39+02:00 | S1 | CI reconcile | Repo volatile-value guard found the GitHub API base hardcoded in the new test fixture. Replaced it with `GITHUB_API_BASE_URL` from canonical config; source behavior and DoD claims remain unchanged. |
| 2026-08-04T09:42+02:00 | close | composed verdict | Owner/milestone reviewer confirmed all other gates independently green and identified the guard as the sole blocker. After `b3e5c7132`, exact guard 4/4 PASS; composed IMPL-EVAL recorded PASS. |

## RED→GREEN Evidence

Baseline fixture result (exit 1):

```text
TS2305: Module './pr-checks.ts' has no exported member 'mergeLatestWorkflowJobs'.
TS2305: Module './pr-checks.ts' has no exported member 'WorkflowJob'.
Found 2 errors. Type checking failed.
```

Corrected fixture result (exit 0):

```text
running 12 tests from pr-checks_test.ts
latest workflow attempt supersedes a stale failed check-run ... ok
latest successful workflow attempt supersedes a stale cancellation ... ok
genuinely failed latest workflow attempt remains exit-relevant ... ok
job id cannot overwrite an unrelated check-run id ... ok
latest-attempt identity wins a timestamp tie ... ok
queued latest-attempt job is pending instead of exposing stale failure ... ok
ok | 12 passed | 0 failed
```

The first two cases produce `['superseded', 'current-pass']`. The negative case produces
`['superseded', 'current-fail']`, `ok: false`, and CLI exit code `1`.

## Historical and Live Evidence

- The default check-runs listing for historical head `c7248eb0026869ae9dd7de7421207140a30c5ec4`
  still returns `close-gate` `91809338954` failure and `check-test` `91809408954` cancellation.
- The issue's named run `30849924186` currently returns latest attempt 3 success for both named
  jobs, but its API head is `7442d2e6cd170da7227adc1756605a5918101235`; the failing check IDs
  resolve to different run `30850545671` and the `c7248eb…` head. This provenance mismatch is
  recorded in `drift.md`; implementation relies on API identity, not the prose association.
- Live PR #1181 after its fresh-SHA workaround: tool exit `0`, head
  `003b82d07b8f04b49e493a91b85ecb42c0f8c05a`, 14 checks, 0 current failures.

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused unit | PASS | 12 passed, 0 failed; exit 0 |
| Scoped check | PASS | 9 selected files, 1 batch, 0 failed batches/findings |
| Scoped lint | PASS | 9 selected files, 0 findings; no new ignores |
| Scoped format | PASS | 9 selected files, 0 failed batches/findings |
| Live PR #1181 | PASS | exit 0; 0 current failures on fresh head |
| Opposite-family slice review | PASS after fixes | initial 6 findings addressed; re-review session recorded above |
| Volatile config guard | PASS after fix | test fixture sources `GITHUB_API_BASE_URL` from `config/endpoints.ts` |

## Handoff Notes

- Composed evaluator should verify the four acceptance mappings and the immutable-evidence
  provenance note before merge handoff.
