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
| 2026-08-03 | 0 | PLAN-EVAL launch blocked | Canonical local Qwen route returned `auth_required`: `OPENROUTER_API_KEY` is absent, so no evaluator process, tools, reasoning, or verdict ran. Cloud OpenHands was not dispatched because `openhands-handoff` prohibits substituting a cloud evaluator for a local-machine run. |
| 2026-08-03 | 0 | orchestrator steer | `release-0.0.5--orchestration` approved the locked plan and waived the per-PR local PLAN-EVAL under `milestone-run.md`'s composed evaluator protocol. Implementation authorized; pre-merge composed evaluation remains orchestrator-owned. |
| 2026-08-03 | 1 | launch isolation | Sender guard found the supervisor's active thread in the PR worktree and refused a rival launch. S1 moved to dedicated native worktree `/home/codex/repos/ns005-canary-payload-s1` on transient branch `fix/canary-payload-merge-commits-s1`; final supervisor commit will push explicitly to the PR branch. |
| 2026-08-03 | 1 | RED | Added a real `Deno.makeTempDir` git DAG with local identity, explicit `main`/`release`/PR branches, a main PR merge, and a release update merge. `deno test --allow-all .llm/tools/release/canary-label_test.ts` exited 1: the fixture proved baseline `git rev-list --first-parent --reverse previous..head` omitted the PR merge SHA, then payload assertion failed with actual `[]` versus expected `[1166]` (12 passed, 1 failed). |
| 2026-08-03 | 1 | implementation | Replaced `firstParentCommits` with `rangeCommits` using `git rev-list --topo-order --reverse previous..head`; added `commitCount` plus `populated`/`genuine-empty`; made a non-empty/no-PR result throw before label, note, or drift mutation. |
| 2026-08-03 | 1 | GREEN | Focused test exited 0 with 15 passed; adjacent release suite exited 0 with 87 passed. Genuine empty, suspicious empty, unpublished refusal, note behavior, and drift semantics are covered. |
| 2026-08-03 | 1 | scoped gates | Check and lint passed. Initial format check found two owned-file formatting differences; scoped `deno fmt` touched only `canary-label.ts` and its test, then focused/adjacent/check/lint/fmt all reran green. |
| 2026-08-03 | 1 | reconcile | Diff stayed within the two locked release-tool files plus run evidence; no issue/PR metadata was mutated, `Refs #1166` remains supervisor-owned, and no plan/drift rescope was required. |
| 2026-08-03 | 1 | opposite-family review | Separate Claude Opus 4.8 high-effort review returned PASS after independently rebuilding the DAG and reproducing focused, adjacent, check, lint, format, lock, and forbidden-construct gates. No blocking findings. |
| 2026-08-03 | 1 | supervisor sign-off | Accepted S1 for commit and explicit-refspec push. Two informational residuals remain documented in `review-s1.md`: cadence wording lags the merge-aware mechanism, and the concrete one-line git adapter is verified by inspection/manual reproduction rather than invoked directly by the injected-port test. |

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
| PLAN-EVAL | milestone-run composed evaluator protocol + written orchestrator waiver | COMPOSED / WAIVED | Per `milestone-run.md`: per-PR local formal evaluator is not spawned; draft→ready augment review, label-triggered OpenHands, and orchestrator pre-merge gate preserve separation. Locked plan approved as written. |
| Focused tests | `deno test --allow-all .llm/tools/release/canary-label_test.ts` | PASS | RED exit 1 (12 pass/1 fail), then GREEN 15/15. |
| Adjacent tests | `deno test --allow-all .llm/tools/release/*_test.ts` | PASS | 87/87. |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts` | PASS | 34 files, 0 diagnostics. |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/release --ext ts` | PASS | 34 files, 0 findings. |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/release --ext ts` | PASS | Final rerun: 34 files, 0 findings. |
| Forbidden constructs | added-line diff scan for `deno-lint-ignore`, `as unknown as`, `@ts-ignore` | PASS | No matches outside or inside run artifacts. |
| Lock hygiene | `git diff origin/main -- deno.lock` | PASS | Empty. |
| Opposite-family review | Claude Opus 4.8, high effort, separate session | PASS | Independent DAG reproduction and all named gates green; see `review-s1.md`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Merge-aware payload | PASS | real synthetic git DAG | Baseline first-parent omitted buried PR SHA; merge-aware derivation included mapped PR #1166. |
| Empty/failure distinction | PASS | focused tests | Zero commits returns `genuine-empty`; one unassociated commit rejects before downstream mutation. |
| Regression contract | PASS | focused + 87-test adjacent suite | Unpublished refusal, note/idempotence client path, association filtering, and drift behavior retained. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Live canary.1 | N/A | post-merge orchestrator | Explicitly outside this PR. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| GitHub label/note/drift surface | PASS | focused + adjacent regression tests | Derivation-only change; no publish mechanics changed. |

## Handoff Notes

- Slice passed the required opposite-family substantive review and supervisor sign-off and is ready
  for the supervisor-owned commit, explicit-refspec push, and draft PR evidence update.
- The failed provider canary remains a did-not-run record, not a verdict. The milestone orchestrator's
  written steer separately waives the per-PR hard stop and binds this slice to composed evaluation.
- Live canary.1 evidence and #1149 re-verification remain acceptance boxes 2–4 and are deliberately
  deferred to the orchestrator after merge; the PR must retain `Refs #1166`, never `Closes #1166`.
