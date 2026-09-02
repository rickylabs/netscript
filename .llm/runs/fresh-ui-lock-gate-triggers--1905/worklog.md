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

## Gate Results

| Gate | Real exit code | Result | Evidence |
| --- | ---: | --- | --- |
| RED classifier test in committed throwaway worktree | NOT_RUN | pending | Slice 1 |
| classifier unit test | NOT_RUN | pending | Required command |
| Fresh UI validation test wrapper | NOT_RUN | pending | Required command |
| scoped `.github` check wrapper | NOT_RUN | pending | Required command |
| scoped `.github` format wrapper | NOT_RUN | pending | Required command |
| parsed workflow YAML readback | NOT_RUN | pending | Structural test reads both `paths` arrays |
| stale-lock draft PR | NOT_RUN | pending | Run id, failing step, and `::error::` line to be captured |

## Reconcile Notes

- Slice 0: issue #1905 remains owned by milestone `0.0.7`; this leaf will open a draft PR with
  `Closes #1905`, the specified taxonomy, and `status:impl`. No status transition to ready or merge
  is authorized.

