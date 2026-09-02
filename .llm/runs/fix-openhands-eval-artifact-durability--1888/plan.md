# Plan: durable formal OpenHands evaluator artifacts

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-openhands-eval-artifact-durability--1888` |
| Branch | `fix/openhands-eval-artifact-durability` |
| Phase | `plan` |
| Target | GitHub Actions infrastructure |
| Archetype | N/A — no package/plugin surface |
| Scope overlays | none |

## Archetype and Doctrine

No doctrine archetype or package fitness matrix applies. The change is confined to
`.github/workflows/**`, its focused workflow tests, and this run directory. Architecture Doctrine,
JSR, runtime/Aspire, consumer-import, and release gates are N/A.

## Goal

Keep formal evaluators read-only with respect to the evaluated PR head while durably preserving the
exact verdict file, failing closed on invalid verdict cardinality, and publishing identical local
and remote provenance.

## Scope

- Extend the existing verdict state vocabulary with `ambiguous` for more than one valid token.
- Require exactly one summary verdict for formal evaluation; zero, malformed, or multiple tokens
  yield `NONE` and cannot advance harness status.
- Commit the exact changed evaluator verdict file to a unique evidence ref that is not the evaluated
  PR branch.
- Record an exact immutable blob URI and matching provenance in trace metadata and the workflow-owned
  status marker/comment.
- Add a focused regression test for formal read-only evaluation with `output=pr-comment`.

## Non-Scope

- Removing the formal-evaluator guard from PR-branch commit-back.
- Reopening or carrying the product verdict for #1865.
- Changes to packages, plugins, manifests, `deno.lock`, status reader implementations, or evaluator
  dispatch/model policy.
- Running PLAN-EVAL or IMPL-EVAL in this implementation session.

## Hidden Scope

- A truthful failure comment must suppress the raw agent summary when preservation fails, because
  that untrusted summary may itself name an uncommitted tracked path.
- The durable record needs two commits: the verdict commit provides the immutable blob SHA; a child
  trace commit can then record that SHA/URI without a self-referential hash.
- Formal status transition must depend on both valid summary cardinality and successful evidence-ref
  publication.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Preserve formal verdicts on `refs/heads/openhands-eval-artifacts/pr-<n>/run-<id>-<attempt>`. | A unique ref is durable Git history, concurrency-safe, and cannot move the evaluated PR head. |
| D2 | Build commits with a temporary Git index and `commit-tree`, rooted at the supplied immutable evaluated head. | Stages only sanctioned paths and is independent of any agent-created commit/worktree leftovers. |
| D3 | Put only the exact verdict in the first commit, then add trace metadata in a child commit. | The first commit SHA gives the status comment an exact immutable blob URI; the second records that URI locally. |
| D4 | A formal summary must contain exactly one valid token; comments cannot rescue an absent, malformed, or ambiguous formal summary. | Acceptance is defined on the final summary, and fallback would recreate a false green. Generic non-formal comment fallback remains compatible. |
| D5 | Preserve fence stripping, `<...>` template exclusion, and accepted Markdown wrappers. | These guards prevent examples/templates from becoming verdicts and retain known evaluator output compatibility. |
| D6 | If evidence publication fails, publish `NONE`, withhold the raw summary from the PR comment, and do not transition status. | The status surface must never claim an unprovable tracked artifact. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Separate Git ref versus expiring Actions artifact | resolved now | D1 chooses durable Git evidence with an exact blob URI. |
| One shared artifact branch versus unique per-run refs | resolved now | Unique refs eliminate update races and make each run independently auditable. |
| Reader implementation changes | safe to defer | Existing local reader exposes metadata and existing remote reader exposes marker data; the workflow makes those records agree. |
| Evidence-ref retention policy | safe to defer | Owner-controlled cleanup can be designed separately; this defect requires durable preservation, so this slice does not delete refs. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Evaluator accidentally changes/commits other files | Temporary index starts from `EVAL_HEAD` and stages only one exact verdict plus compact trace. |
| Multiple verdict artifacts make the claimed path ambiguous | Require exactly one changed phase-appropriate verdict path; otherwise preservation fails closed. |
| Multiple valid summary tokens select an early PASS | Count all eligible matches in both parsers and return `ambiguous`. |
| Artifact push fails but status advances | Formal verdict is forced to `NONE` unless preservation reports a pushed ref and exact URI. |
| Raw summary repeats a nonexistent tracked path | Withhold raw summary on formal preservation failure. |
| Local/remote provenance diverges | Write the same phase, evaluated head, formal verdict, source, path, commit, and URI to trace metadata and remote marker. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Focused workflow regression | structured Deno test wrapper over `phase-eval-workflow_test.ts` | PASS, including read-only evaluator + `pr-comment` and multi-token cases |
| 2 | YAML/static workflow validation | repository workflow validation task if available; otherwise focused parser/static tests | PASS |
| 3 | Formatting | structured Deno format wrapper scoped to changed TypeScript | PASS |
| 4 | Lock hygiene | `git diff --exit-code 302409f0c -- deno.lock` | exit 0, no bytes changed |
| 5 | Scope review | authoritative Git status/diff | only workflow, focused tests, and run dir |

## PLAN-EVAL Assessment

`PLAN-EVAL: N/A`. This is a single bounded workflow fix with defect locations, immutable reproducer,
contract, boundaries, acceptance criteria, and gates supplied by the owner. Research resolved the
only design fork before implementation; no material architecture, sequencing, or scope decision
remains open that would benefit from a separate planning evaluator.

## Arch-Debt Implications

None. No doctrine debt is created or closed.

## Drift Watch

- Any need to mutate the evaluated PR branch, touch reader implementation, change model routing, or
  edit outside the allowed workflow/test/run-dir boundary is significant drift and requires owner
  direction.
