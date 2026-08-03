# Worklog: Merge-aware canary payload derivation (#1166)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-canary-payload-merge-commits--1166` |
| Branch | `fix/canary-payload-merge-commits` |
| Archetype | N/A — internal release tooling |
| Scope overlays | none |

## Design

### Public Surface

- `deriveCanaryPayload(previous, head, dependencies)` — internal exported test seam returning the
  payload plus explicit derivation evidence.
- `renderCanaryReleaseNote(...)` — existing note renderer, updated only to describe merge-aware
  history and genuine-empty evidence accurately.
- `release:canary-label` check output — existing named check record; suspicious empty becomes
  `merge-history-payload FAIL`, genuine empty becomes an explicit `PASS` detail.

### Domain Vocabulary

- `CanaryPayloadOutcome` — finite successful outcomes: `populated` or `genuine-empty`.
- `CanaryPayload.commitCount` — number of commits inspected in the merge-aware range.
- `rangeCommits` — port returning every commit in the Git set difference `previous..head`.
- `suspicious empty` — non-empty commit range with no associated PR; a derivation failure, not a
  payload value.

### Ports

- `rangeCommits(previous, head)` — git traversal seam; synthetic repo test exercises the concrete
  range command through the exported derivation path or a focused helper.
- Existing `associatedPullRequests`, `closingIssues`, and `pullRequestTitle` ports remain unchanged.

### Constants

- No new runtime constant group is required; `CanaryPayloadOutcome` is a two-value union whose
  values appear at their construction sites and exhaustive output branch.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Activate harness, lock design, and open the draft review surface. | Separate PLAN-EVAL PASS | run artifacts only |
| 1 | Prove merge-buried PR inclusion and fail-closed empty classification with a synthetic git DAG; preserve note/label/drift behavior. | RED capture then focused/adjacent tests + scoped check/lint/fmt | `.llm/tools/release/canary-label.ts`, `.llm/tools/release/canary-label_test.ts`, run artifacts |

### Deferred Scope

- Live canary.1 cut and #1149 re-verification — require this PR merged and remain orchestrator-owned.
- Workflow and publish mechanics — explicitly owned elsewhere and untouched.

### Contributor Path

Start at `deriveCanaryPayload` in `.llm/tools/release/canary-label.ts`: the range port defines what
commits are inspected, the returned evidence explains a successful payload, and adjacent tests build
the merge topology that guards the contract. GitHub mutation and drift code below should not need
changes for future traversal corrections.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-03 | 0 | bootstrap/research | Read #1166, required skills/cadence, current implementation/tests, and re-baselined cleanly at `fb75cf6f`. |
| 2026-08-03 | 0 | design | Locked full-range traversal, explicit successful-empty evidence, and fail-closed suspicious-empty policy. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Full range, not first-parent | Includes second-parent PR commits while range subtraction excludes previously reachable work. | #1166 + git semantics |
| Zero commits is the only genuine empty | Directly distinguishes observed false-green signature. | #1166 acceptance 3 |
| `Refs #1166` | Live canary boxes cannot exist before merge. | User PR contract + issue acceptance |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner-opened Codex supervisor differs from canonical Fable primary | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | separate local open-model evaluator | NOT_RUN | Hard stop before slice 1. |
| Focused tests | `deno test --allow-all .llm/tools/release/canary-label_test.ts` | NOT_RUN | RED→GREEN evidence pending. |
| Scoped check/lint/fmt | repo wrappers over `.llm/tools/release` | NOT_RUN | Pending implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Merge-aware payload | NOT_RUN | synthetic fixture pending | Must show old traversal omission. |
| Empty/failure distinction | NOT_RUN | focused tests pending | Genuine and suspicious cases required. |
| Regression contract | NOT_RUN | adjacent tests pending | No behavior removal allowed. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Live canary.1 | N/A | post-merge orchestrator | Explicitly outside this PR. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| GitHub label/note/drift surface | NOT_RUN | regression tests pending | Derivation-only change. |

## Handoff Notes

- PLAN-EVAL should challenge L1 (range semantics), L4 (suspicious-empty policy), and whether the
  synthetic fixture proves old RED rather than merely asserting the new implementation.
