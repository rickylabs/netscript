# Worklog: Fresh UI private-lock gate triggers

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fresh-ui-lock-gate-triggers--1905` |
| Branch | `ci/fresh-ui-lock-gate-triggers` |
| Baseline | `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` (`origin/main`) |
| Role | implementation author (leaf) |
| Supervisor | `topic-internals-0.0.7` |
| Archetype | N/A — repository CI/tooling only; no package or plugin source changes |
| Scope overlays | none |

## Plan Gate

`PLAN-EVAL: N/A`. This is a small mechanical fix whose authorized files, two-layer contract,
acceptance limitations, test-first order, and exact gates are locked in the implementation brief.
There is no unresolved architecture, sequencing, scope, or trade-off decision that would benefit
from a separate planning evaluator. IMPL-EVAL remains the supervisor's separate-session obligation.

## Design

### Public Surface

- GitHub Actions `pull_request.paths` and `push.paths` for `fresh-ui-quality`.
- The classifier's existing `needs_fresh_ui` output.

### Domain Vocabulary

- **Private-lock input** — a workspace member manifest or root lockfile whose change can stale
  `packages/fresh-ui/deno.lock`.
- **Trigger layer** — the workflow event `paths` filter that decides whether the workflow starts.
- **Decision layer** — `classifyPath()` and `needs_fresh_ui`, which decide whether the heavy job
  runs after the workflow starts.

### Ports

- GitHub workflow YAML is parsed by the structural validation test; no new runtime port or
  dependency is introduced.

### Constants

- Required trigger paths: `packages/*/deno.json`, `packages/cli/e2e/deno.json`,
  `plugins/*/deno.json`, and `deno.lock`.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Bootstrap the leaf evidence trail | clean status and base identity | this run directory |
| 1 | Prove the classifier misses private-lock inputs (RED) | classifier test fails from the committed RED tree in a throwaway worktree | `.github/scripts/ci-classify-changes.test.ts`, run artifacts |
| 2 | Make both trigger and decision layers cover private-lock inputs | all four required local gates and parsed-YAML proof pass | classifier source/test, workflow, structural validation test, run artifacts |
| 3 | Prove the frozen gate has teeth and finalize handoff | draft canary PR run fails at the frozen-lock step with captured `::error::`; canary PR closed and branch deleted | run artifacts |

### Deferred Scope

- Post-merge trigger-isolation proof for acceptance box 1 — impossible on the implementation PR
  because the workflow file itself is an already-triggering changed path.
- `examples/*` and `apps/*` globs — absent from the private lock and from the base-head filesystem;
  they are not current private-lock inputs.
- Any dependency or lockfile regeneration — explicitly out of scope.

### Contributor Path

When the private lock begins mirroring another workspace-member class, add its manifest glob to
both workflow `paths` arrays, extend the parsed-YAML assertion, and add a classifier contribution
test before changing `classifyPath()`.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 10:07 | 0 | research | Re-derived the lockfile, member, workflow-trigger, classifier, and docs-site facts at the required base. |
| 2026-09-02 10:07 | 0 | design | Recorded `PLAN-EVAL: N/A`, locked slices, validation, and acceptance boundaries before implementation. |
| 2026-09-02 10:28 | 1 | test-first | Added only the private-lock classifier expectations; implementation remains unchanged for the committed RED proof. |
| 2026-09-02 10:29 | 1 | RED | Detached throwaway worktree at `8bdb7f0afdf51e0d63bfbdd021658d5ff81f5a27`: 61 passed, 1 failed; real exit code 1. |
| 2026-09-02 10:32 | 2 | implementation | Extended the nested-config contribution without narrowing the existing Fresh UI prefix; synchronized both workflow path lists. |
| 2026-09-02 10:33 | 2 | GREEN | All required local commands and the dedicated YAML parse returned real exit code 0; no lockfile changed. |
| 2026-09-02 10:39 | 3 | live teeth proof | Disposable PR #1919 produced failing run `33620426788` at `Frozen package type-check`; captured annotation, closed PR unmerged, and deleted branch/worktree. |

## Gate Results

| Gate | Real exit code | Result | Evidence |
| --- | ---: | --- | --- |
| RED classifier test in committed throwaway worktree | 1 | expected FAIL | New test failed on `packages/sdk/deno.json`: actual `freshUi=false`, expected `true`; 61 other tests passed. |
| classifier unit test | 0 | PASS | 62 passed, 0 failed. |
| Fresh UI validation test wrapper | 0 | PASS | Structured runner: 2 passed, 0 failed. |
| scoped `.github` check wrapper | 0 | PASS | 11 files, 1 batch, 0 failed batches/findings. |
| scoped `.github` format wrapper | 0 | PASS | 11 files processed, 0 failed batches/findings/refusals. |
| parsed workflow YAML readback | 0 | PASS | Parsed document: both event arrays equal, all four required inputs present, negations ordered after the positive path. |
| targeted validation-file format wrapper | 0 | PASS | 1 file processed, 0 findings/refusals. |
| stale-lock live gate | 1 | expected FAIL | Run `33620426788`, job `100216039828`, step `Frozen package type-check`; private-lock stale annotation emitted. |

## Reconcile Notes

- Slice 0: issue #1905 remains owned by milestone `0.0.7`; this leaf will open a draft PR with
  `Closes #1905`, the specified taxonomy, and `status:impl`. No status transition to ready or merge
  is authorized.
- Slice 1 (pre-RED): draft PR #1917 is open with the required taxonomy and milestone. The RED test
  covers package, CLI E2E, plugin, and root-lock inputs plus the existing root-config contribution.
- Slice 1 (post-RED): the committed test was checked out detached in a disposable worktree. The only
  failure was the intended private-lock classifier gap; the existing root-config behavior remained
  green. No implementation file was present to rescue the test.
- Slice 2: issue and PR remain at `status:impl`; no new reviewer comments altered scope. The diff
  remains limited to the authorized classifier, classifier test, workflow, structural test, and
  leaf run artifacts. Both repository lockfiles remain unchanged.
- Slice 3: disposable PR #1919 was opened draft; its first run skipped under the workflow's draft
  guard, so the supported `ready_for_review` event started the live run. After the expected failure,
  the PR was closed unmerged and its branch/worktree deleted. This proves teeth only, not isolated
  member-manifest triggering. Main PR #1917 remains draft at `status:impl`.

## Handoff

- Implementation PR: #1917 (draft), head to be reported after this evidence commit.
- Honest acceptance: boxes 2 and 3 are provable now; box 1 remains post-merge because this PR's
  workflow-file diff is independently triggering.
- Supervisor obligation: separate-session IMPL-EVAL and the one-shot post-merge isolation PR
  described in `evidence.md`. Do not infer trigger isolation from disposable PR #1919.
