# Worklog: canary publish channel and publish readiness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-811-release-canary--canary-readiness` |
| Branch | `feat/811-release-canary` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- `deno task release:canary -- <stable-target> [--dry-run]` — derives, prepares, gates, and optionally pushes a canary cut without a PR.
- `deno task publish:readiness` — emits an ordered, structured verdict for the current workspace version.
- `deno task release:publish` — existing command, now fails without a green `release/canary-pair` status for matching content.
- `.github/workflows/release-canary.yml` — authenticated canary publish and exact downstream production-E2E orchestration.

### Domain Vocabulary

- `CanaryVersionPlan` — stable target, derived canary version, and registry/tag evidence used for N.
- `ReleasePreparationResult` — coordinated bump plus ordered gate results shared by stable and canary cuts.
- `PublishReadinessCheck` — one named PASS/FAIL evidence row with details and duration.
- `PublishReadinessReport` — target version, new-package set, ordered checks, and composite verdict.
- `CanaryPairStatus` — GitHub commit status context proving canary publish and its exact E2E run are green.

### Ports

- JSR metadata fetcher — distinguishes package absence (404) from registry failure and supplies version maps.
- Command runner — invokes canonical preflight, provisioning, dry-run, prod-install, and git without shell interpolation.
- GitHub transport — existing `githubRequest` plus `resolveGithubToken`, extended with an in-process hosts-file fallback.
- Filesystem reader — reads manifests/READMEs/docs pointers and permits deterministic temp-fixture tests.

### Constants

- `CANARY_PRERELEASE_LABEL = "canary"`.
- `CANARY_PAIR_STATUS_CONTEXT = "release/canary-pair"`.
- JSR registry/management base URLs remain centralized under `.llm/tools/release/config/endpoints.ts`.
- README/tagline caps and required sections reuse the existing validation sources.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Harness bootstrap and design | separate PLAN-EVAL | run artifacts |
| 2 | Shared preparation + canary cut | cut/canary tests | release command/helper/tests, task, run artifacts |
| 3 | Composed readiness | readiness tests; every check witnessed red | readiness/helpers/tests, run artifacts |
| 4 | Workflow + pair enforcement | YAML sanity; GitHub/token tests | workflows, github-release, agentic lib/tests, run artifacts |
| 5 | Canary-first doctrine | skill sync/check | release skill source/mirror, debt, run artifacts |
| 6 | Final evidence | required gates + separate IMPL-EVAL | run artifacts and PR trail |

### Deferred Scope

- Live canary publish/yank and repository/JSR permission changes are post-merge owner actions.
- PR #810 scanner implementation remains on its own branch.

### Contributor Path

Add or change one readiness rule as a named evidence-producing check with a seeded failure test; keep JSR/GitHub/process IO behind the existing injected dependency records. Change publication only through `run-publish.ts`, and change stable/canary preparation only through the shared preparation helper.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | 1 | research/design | Re-baselined at `a5adb706`; existing release suite 29/29 green; implementation blocked on PLAN-EVAL. |
| 2026-07-17 | 1 | PLAN-EVAL retry | First Qwen evaluator attempted prohibited closed-model delegation and was interrupted; no verdict accepted. Fresh direct-only Qwen retry required. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Shared preparation helper | Stable and canary gates must not drift. | issue #811 + plan D3 |
| Commit-status green pair | API-readable, SHA-bound, and workflow-independent. | issue #811 + GitHub status API |
| Call #810 preflight task | Avoid duplicate scanner ownership. | user directive + plan D6 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Invalid evaluator delegation attempt | moderate | `drift.md` |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| release baseline tests | `deno test --allow-all .llm/tools/release/` | PASS | 29 passed, 0 failed before implementation |
| implementation gates | planned commands in `plan.md` | NOT_RUN | Plan-Gate hard stop |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-5/F-6/F-7/F-9/F-10/F-19 | NOT_RUN | `plan.md` | Awaiting PLAN-EVAL |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| live canary pair | N/A | no registry mutation in this PR | workflow behavior is structurally tested; first live run is owner action |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| stable release operator | NOT_RUN | planned task/docs tests | Awaiting implementation |

## Handoff Notes

- PLAN-EVAL should inspect the content-SHA rule, workflow-dispatch correlation, version precedence, #810 ownership boundary, and whether every deliverable has a negative-proof gate.
