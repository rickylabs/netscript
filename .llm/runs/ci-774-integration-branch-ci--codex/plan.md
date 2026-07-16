# Plan: honest CI for integration-branch pull requests

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-774-integration-branch-ci--codex` |
| Branch | `ci/774-integration-branch-ci` |
| Phase | `plan` |
| Target | GitHub Actions / repository tooling |
| Archetype | N/A — infrastructure-only workflow change |
| Scope overlays | none |

## Archetype

N/A. No `packages/**` or `plugins/**` framework surface changes, so the doctrine archetype matrix
does not govern this slice.

## Current Doctrine Verdict

N/A for infrastructure-only workflow work.

## Goal

Make real CI run by default for PRs targeting `main`, `feat/**`, or `epic/**`, preserve the scaffold
path/label skip policy, and expose unambiguous ran-versus-skipped lane summaries.

## Scope

- Widen `ci.yml` pull-request base branches to `main`, `feat/**`, and `epic/**`.
- Widen `e2e-cli.yml`'s job-level applicability test to the same base families.
- Add cheap always-on job summaries to core CI and scaffold CI, using `needs` results and classifier
  outputs to distinguish a real run from a policy skip.
- Update workflow comments whose branch-protection/applicability statements become stale.
- Record the read-only `main` ruleset audit and scenario reasoning in the PR body.

## Non-Scope

- Do not change branch protection or rulesets.
- Do not remove or weaken docs/path/label classification, `ci:skip-e2e`, `ci:skip-scaffold`, or
  `ci:full` precedence.
- Do not change package/plugin code, Deno tasks, dependencies, lockfiles, or release workflows.
- Do not make scaffold-runtime a required check or run it locally for this YAML-only slice.

## Hidden Scope

- The e2e workflow's gap is a job `if`, not an event-level branch filter.
- A successful scaffold job may mean “skipped by policy”; visibility must use classifier outputs,
  not only `needs.<job>.result`.
- `quality` and `check-test` are required through a repository ruleset even though the legacy branch
  protection endpoint says the branch is unprotected.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `branches: [main, 'feat/**', 'epic/**']` for `ci.yml` pull requests. | Matches the issue's preferred safe scope while excluding arbitrary branch families. |
| D2 | Keep the existing `push` trigger unchanged. | The defect concerns PR base coverage; broadening push CI would add unrelated cost. |
| D3 | Apply the same base-family rule to `e2e-cli.yml`'s `classify` applicability gate. | Prevents skipped scaffold lanes on stacked waves while retaining classifier gating. |
| D4 | Add one summary job to each affected workflow, with no API calls or third-party dependencies. | Job summaries are explicitly accepted by #774, avoid write permissions, and cannot race across workflows. |
| D5 | Treat `run_static` / `run_runtime` as the authority for scaffold ran-vs-skipped visibility. | Both scaffold jobs intentionally succeed when policy-skipped. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether to post a PR comment instead of a job summary | safe to defer | The issue explicitly accepts a job summary; comments require write permission and update/race logic. |
| Whether to require scaffold checks in the `main` ruleset | safe to defer | Settings changes are expressly out of scope. |
| Whether to broaden CI to all PR bases | safe to defer | `main`, `feat/**`, and `epic/**` cover the repository's integration patterns without uncontrolled cost. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| GitHub glob/expression syntax is invalid. | Parse every workflow as YAML and inspect expressions in the focused diff; use `actionlint` if present. |
| Scaffold-runtime runs on docs-only PRs. | Preserve classifier logic and label precedence unchanged; only widen applicability. |
| A skipped scaffold lane is reported as ran because its job conclusion is success. | Derive visibility from classifier outputs first, then job result. |
| A failed dependency suppresses the summary job. | Use job-level `if: always()` and `needs` all relevant jobs. |
| Stale header claims contradict ruleset reality. | Update `ci.yml` to state that `quality` is required on `main` by the active ruleset. |

## Anti-Patterns to Resolve or Avoid

N/A for package doctrine. Workflow-specific false-green behavior is resolved by explicit base
coverage and lane visibility.

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Workflow YAML parse | yes | All `.github/workflows/*.yml` parse successfully. |
| Focused diff review | yes | Only intended workflow and run-artifact changes. |
| Scenario reasoning | yes | PR body covers main, integration branch, and docs-only + `ci:skip-e2e`. |
| Separate PLAN-EVAL / IMPL-EVAL | yes | Opposite-family verdict artifacts. |
| TypeScript check | no | No TypeScript or Deno task wiring changes. |

## Arch-Debt Implications

None.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | YAML parse | Deno parse using an existing YAML dependency/import | Every workflow parses. |
| 2 | Action syntax | `actionlint` when available | Zero errors, otherwise record unavailable and perform focused diff review. |
| 3 | Trigger audit | focused search for PR base filters and `base.ref` checks | Only the two widened, intentional sites remain. |
| 4 | Git diff | raw git diff against `origin/feat/beta10-integration` | No unrelated changes or lock churn. |
| 5 | IMPL-EVAL | separate local Claude-family session | `PASS`. |

## Dependencies

- GitHub Actions event/filter semantics and the existing classifier outputs.
- GitHub REST rulesets evidence, read-only.

## Drift Watch

- Any need to edit TypeScript, add permissions, weaken classifier behavior, or touch more workflows
  is significant and requires a plan update before proceeding.
