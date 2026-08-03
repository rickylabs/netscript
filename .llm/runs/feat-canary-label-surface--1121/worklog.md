# Worklog: Canary label surface (#1121)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-canary-label-surface--1121` |
| Branch | `feat/canary-label-surface` |
| Archetype | N/A — internal release tooling |
| Scope overlays | none |

## Design

### Public Surface

- `release:canary --output <path>` — machine-readable resolved canary identity.
- `release:canary-label apply --repo ... --published-version ... --source-sha ...` — apply the
  content-derived GitHub label surface and run drift verification.
- Pure helpers exported from `canary-label.ts` for version validation, label identity, content-point
  selection, payload construction, and bidirectional drift comparison.

### Domain Vocabulary

- `CanaryResult` — resolved `version`, `tag`, and ephemeral `branch` emitted by the cut command.
- `CanaryPoint` — immutable version plus source/content SHA used as a merge-history boundary.
- `CanaryPayload` — ordered merged PR numbers plus the issues GitHub says those PRs close.
- `CanaryDrift` — `labelsWithoutVersions` and `versionsWithoutLabels` for one stable target.
- `GateResult` — named `PASS`/`FAIL` evidence row; the command never treats empty output as green.

### Ports

- `GitRunner` — focused git history/tag/ref seam exercised by unit tests.
- `GitHubCanaryClient` — label listing/creation/application, commit-associated PR, and closing-issue
  relations.
- `RegistryVersionReader` — existing JSR metadata reader injected for deterministic tests.

### Constants

- `CANARY_LABEL_PREFIX` — `canary:`.
- `CANARY_LABEL_COLOR` / description template — dynamic-label presentation only.
- `GATE_NAMES` — finite identity, payload, application, and drift gate vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove downstream identity comes from the resolver's JSON result, not `deno.json`. | Focused `canary_test.ts` + workflow test; scoped check/lint/fmt | `.llm/tools/release/canary.ts`, `canary_test.ts`, `.github/workflows/release-canary.yml`, workflow test, `deno.json`, run artifacts |
| 2 | Prove merge-derived label application and bidirectional drift failure, then wire it after publish. | Focused canary-label tests including mismatch negative; workflow test; required user gates | new `canary-label.ts`/test, workflow, `deno.json`, run artifacts |

### Deferred Scope

- Publish mechanics, cadence, orchestration skill/profile, and live cut authority — owned by later
  slices or `netscript-release`.
- Historical 0.0.1–0.0.3 label backfill — not required to exercise 0.0.4 and would widen scope.
- Live `.1`/`.2` evidence — orchestrator-owned after landing.

### Contributor Path

Start in `.llm/tools/release/canary-label.ts`: domain helpers are above the GitHub/JSR adapters, the
single command composes them, and the adjacent test uses injected ports. Workflow wiring is one
post-publish step in `.github/workflows/release-canary.yml`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-03 | plan | research | Read #1121/#1120 and the observed 0.0.4 trace; re-baselined clean branch at `0b05217cc`. |
| 2026-08-03 | plan | design | Locked two thin implementation slices and explicit external live-cut dependency. |
| 2026-08-03 | plan-eval | launch blocked | Canonical Qwen route resolved, but approved child credential injection returned `auth_required`; no evaluator/model turn ran. |
| 2026-08-03 | plan-eval | owner waiver | Owner waived the blocked gate on-record under #1087's evaluator-helper safety finding and directed implementation now. |
| 2026-08-03 | slice 1 | implementation | Added resolver-owned JSON identity and replaced workflow manifest inference with artifact consumption. |
| 2026-08-03 | slice 1 | gates | Focused tests 15/15 PASS; release-tool check/lint/fmt wrappers selected 32 files with zero diagnostics/findings. |
| 2026-08-03 | slice 1 | opposite-family review | Native Claude Opus 5 requested changes: stale run evidence and non-failing inline `jq` substitutions; both fixed before sign-off. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Target-scoped drift | Historical canaries predate the label surface. | research finding 3 |
| CLI registry as publish marker | Avoid labeling partial workspace uploads. | existing coordinated publisher graph |
| GitHub relations, not subject parsing | Squash subjects contain closed issue numbers. | trace + git log |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Requested trace absent from this worktree but present in sibling checkout | minor | yes |
| User-opened Codex supervisor differs from canonical Fable supervisor route | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | separate local open-model evaluator | NOT_RUN / WAIVED | Launch blocked before model start. Owner explicitly waived the gate under #1087; no PASS is claimed. |
| Slice 1 focused tests | focused canary + workflow tests | PASS | 15 passed, 0 failed. |
| Release-tool check | scoped check wrapper over `.llm/tools/release` | PASS | 32 files selected; 0 failed batches/diagnostics. |
| Release-tool lint | scoped lint wrapper over `.llm/tools/release` | PASS | 32 files selected; exit 0; 0 diagnostics. |
| Release-tool format | scoped fmt wrapper over `.llm/tools/release` | PASS | 32 files selected; 0 failed batches/findings after scoped formatting. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Slice 1 identity proof | PASS | focused test + workflow cut-step assertion | JSON reports `0.0.4-canary.1`; cut step contains no `deno.json` reference. |
| Payload/drift proof | NOT_RUN | slice 2 | Not implemented yet. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Live 0.0.4 canaries | NOT_RUN | orchestrator-owned | Must remain unticked until real runs. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `release-canary.yml` identity | PASS | workflow test | Consumes JSON result; assignment-form `jq -e` plus null/non-empty guards fail closed. |

## Handoff Notes

- PLAN-EVAL should inspect L3/L4/L5 closely: coordinated publish marker, target drift scope, and
  content-point selection are the load-bearing decisions.
- Implementation began only after the owner's recorded Plan-Gate waiver.
- The first canonical evaluator launch was blocked before a session existed; do not treat route
  validation or provider-canary output as a verdict.
- Implementation is authorized by the owner's written waiver, not by evaluator evidence.
- Slice 1 reviewer session `e10ff8f5-dfb4-4036-9b2d-62b51e1b06ce` resolved native `opus` to
  Claude Opus 5 and wrote `review-s1.md`; configured literal `opus-4.8` was unavailable.
