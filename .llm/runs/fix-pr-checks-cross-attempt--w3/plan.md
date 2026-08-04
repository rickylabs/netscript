# Plan: cross-attempt PR-check supersession

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-pr-checks-cross-attempt--w3` |
| Branch | `fix/pr-checks-cross-attempt` |
| Phase | `plan` |
| Target | repository tooling (`.llm/tools/agentic/github`) |
| Archetype | N/A — internal harness tooling, no `packages/**` or `plugins/**` |
| Scope overlays | none |

## Goal

Make `agentic:pr-checks` report GitHub Actions truth from the latest workflow-run attempt while
retaining check-run coverage for other check providers and preserving a non-zero result for a
genuinely failing latest attempt.

## Scope

- Add an attempt-aware GitHub Actions jobs read to `pr-checks.ts`.
- Reconcile Actions job results into the check-run set before classification.
- Add RED→GREEN fixtures for failed/cancelled attempt 1 followed by successful attempt 2, plus a
  genuinely red latest-attempt negative case.
- Verify the historical workflow run and the current PR #1181 surface.

## Non-Scope

- GitHub branch-protection/rules-engine behavior; the repo tool can report truth but cannot repair
  GitHub's own stale required-check state.
- CI workflow changes, package/plugin code, or generalized GitHub API clients.

## Hidden Scope

- Pagination for workflow runs and jobs, and non-Actions checks that have no workflow job.
- Stable identity when multiple workflow runs share a job name.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `actions/runs/{id}/jobs?filter=latest`, keyed by Actions job `check_run_url`/check-run id where available. | The issue evidence proves this endpoint returns latest-attempt truth; ID correlation avoids name collisions across workflows. |
| D2 | Preserve unmatched commit check-runs. | External checks and Actions entries outside fetched PR runs remain observable. |
| D3 | Keep exit truth derived only from `current-fail`. | Preserves the existing CLI contract and the issue's negative case. |
| D4 | Implement one commit slice. | Source and tests form one indivisible behavioral correction. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Per-attempt check-suite disambiguation instead of jobs API | safe to defer | Jobs `filter=latest` is the issue's proven resolution basis and is simpler. |
| Repair GitHub rules-engine stale contexts | safe to defer | Outside repo-tool authority and explicitly non-scope. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Name-only replacement conflates workflows | Prefer check-run ID correlation from `check_run_url`; fixture duplicate names. |
| API pagination hides a relevant workflow/job | Paginate both Actions workflow runs and jobs. |
| Latest attempt failure is accidentally hidden | Dedicated negative fixture and command exit assertion. |
| Historical PR head changed after workaround | Verify immutable run `30849924186` directly and separately record current PR output. |

## Arch-Debt Implications

- None. Internal tooling only; no doctrine debt created or resolved.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED fixture | focused cross-attempt test on baseline | fail with stale attempt-1 `current-fail`/`cancelled` |
| 2 | Unit | `deno test --allow-read --allow-run --allow-env --allow-net=api.github.com .llm/tools/agentic/github/pr-checks_test.ts` | all pass, including latest red |
| 3 | Check | scoped `run-deno-check.ts` on `.llm/tools/agentic/github` | pass |
| 4 | Lint | scoped `run-deno-lint.ts` on `.llm/tools/agentic/github` | pass, no new ignores |
| 5 | Format | scoped `run-deno-fmt.ts` on owned TS files | pass |
| 6 | Live historical | query workflow run `30849924186` and run tool against PR #1181 | latest-attempt jobs green; tool exits 0 |

## Drift Watch

- API response shape differs from the issue's recorded `filter=latest` proof.
- PR #1181's current head cannot reproduce the historical stale head; do not claim otherwise.
