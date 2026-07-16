# Worklog: honest integration-branch CI

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-774-integration-branch-ci--codex` |
| Branch | `ci/774-integration-branch-ci` |
| Archetype | N/A — infrastructure-only |
| Scope overlays | none |

## Design

### Public Surface

- GitHub Actions PR trigger contract for `.github/workflows/ci.yml`.
- GitHub Actions applicability contract for `.github/workflows/e2e-cli.yml`.
- Core and scaffold lane-visibility job summaries.

### Domain Vocabulary

- **Supported base** — `main`, any `feat/**` branch, or any `epic/**` branch.
- **Ran** — a lane whose substantive commands were selected and whose job has a terminal result.
- **Skipped by policy** — a scaffold job that started but short-circuited because classifier output
  was explicitly false.
- **Not scheduled** — a job skipped because the workflow/applicability gate did not apply.

### Ports

- GitHub Actions `needs` context — supplies terminal job results to summary jobs.
- Existing `classify` outputs — supplies authoritative scaffold selection decisions.
- `$GITHUB_STEP_SUMMARY` — dependency-free visibility surface.

### Constants

- Supported branch families: `main`, `feat/**`, `epic/**`.
- Core lane names: `close-gate`, `check-test`, `quality`, `deps-report`.
- Scaffold lane names: `classify`, `scaffold-static`, `scaffold-runtime`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Bootstrap research, locked plan, and design for external PLAN-EVAL | Plan-Gate checklist | `.llm/runs/ci-774-integration-branch-ci--codex/**` |
| 1 | Prove supported-base PRs schedule honest core/scaffold CI and show ran/skipped lanes | YAML parse, actionlint if available, focused trigger audit, scenario reasoning | `.github/workflows/ci.yml`, `.github/workflows/e2e-cli.yml`, run artifacts |
| 2 | Record opposite-family IMPL-EVAL and final handoff evidence | Evaluator protocol | `evaluate.md`, `worklog.md`, `context-pack.md`, `drift.md` |

### Deferred Scope

- PR-comment bot — job summaries satisfy #774 without new write permissions.
- Branch-protection mutation — audit-only by owner constraint.
- Required scaffold checks — rollout policy remains unchanged.

### Contributor Path

Start at each workflow's trigger/applicability block, then read its final lane-visibility job. Add a
lane by adding it to `needs` and to the corresponding summary table; scaffold selection continues to
come from `classify` outputs.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-16 | 0 | Research | Read issue #774, audited workflow filters, PR #770 checks, and `main` ruleset. |
| 2026-07-16 | 0 | Tier-D proof | Matched managed remote-control app-server, rollout thread, and worktree. |
| 2026-07-16 | 0 | PLAN-EVAL | Separate Claude Opus session `aa9cc799-5ffe-4c0d-bd5c-06d6f9f19cfc` returned `PASS`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use two job summaries | Avoid cross-workflow comment races and new write permissions. | plan D4 |
| Keep push branches unchanged | Scope is PR base coverage. | plan D2 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Runtime desired-state controller had no persisted identity for this worktree; direct daemon/rollout proof exists. | minor | yes |

## Gate Results

PLAN-EVAL: `PASS`. Implementation gates remain `NOT_RUN` until slice 1 lands.

## Handoff Notes

- PLAN-EVAL should first verify the distinction between e2e event triggering and the job-level
  `base.ref` applicability gate.
- The branch-protection conclusion must cite ruleset `18459345`, not the legacy 404 alone.
