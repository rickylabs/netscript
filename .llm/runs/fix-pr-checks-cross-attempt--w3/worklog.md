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

## Gate Results

Pending implementation.

## Handoff Notes

- Review correlation by check-run ID and ensure the latest-attempt negative case remains exit-relevant.
