# PLAN-EVAL — feat-811-release-canary--canary-readiness

- Plan evaluator session: OpenRouter Qwen 3.7-max, 2026-07-17 (retry after invalid delegation attempt)
- Run: feat-811-release-canary--canary-readiness
- Surface / archetype: Release tooling / Archetype 6 — CLI / Tooling
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` exists (4.7KB, 2026-07-17), re-baselined against `origin/main` at commit `a5adb706`. Spot-checked: `cut.ts` contains `coordinateVersionBump` (finding 1), `run-publish.ts` calls `publishWorkspace` (finding 2), `preflight-release.ts` maintains exclusion list (finding 3), `resolveGithubToken` exists in `agentic-lib.ts:1009` (finding 8), `github-release.ts` has no canary-pair guard (finding 9). Baseline tests: 29 passed, 0 failed. |
| Decisions locked                        | PASS   | `plan.md` "Locked Decisions" section contains 10 decisions (D1-D10) with rationale: canary version derivation, workspace-wide N calculation, shared bump function, readiness evidence collection, JSR-based package detection, preflight task boundary, real publisher reuse, pair status context, closed gate enforcement, tag retention. Each decision is traceable to issue #811 or PR #810 owner comment. |
| Open-decision sweep                     | PASS   | `plan.md` "Open-Decision Sweep" lists 4 items: automatic trigger (safe to defer), automatic yanking (safe to defer), existing-package README retrofit (safe to defer), #810 merge timing (resolved now by calling task boundary). No open decisions force rework when deferred; all implementation paths are determined. |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md` "Commit Slices" enumerates 6 slices, each names (1) what it proves, (2) the gate that proves it, and (3) files touched. Slice count (6) is well under the 30-slice cap. Ordering is correct: harness bootstrap → shared preparation → composed readiness → workflow enforcement → doctrine update → final evidence. Each slice names its focused test suite (e.g., "cut/canary tests", "readiness tests", "YAML sanity"). |
| Risk register                           | PASS   | `plan.md` "Risk Register" lists 8 risks with mitigations: canary N collision (max across workspace + tag guard), workflow claims green prematurely (capture dispatch run id), pair from older content (SHA-attached status), YAML path drift (shared readiness/preflight), network failures (only 404 means absent), first-publish gate scans internals (compare effective members), #810 changes preflight shape (call task boundary), token leaks (parse in-process, test synthetic text only). Each mitigation is implementable within the slice scope. |
| Gate set selected                       | PASS   | `plan.md` "Fitness Gates" selects required gates from `archetypes/ARCHETYPE-6-cli-tooling.md` and `gates/release-gates.md`: F-5 (public surface), F-6 (JSR publishability), F-7 (doc-score), F-9 (permissions), F-10 (test shape), F-19 (scoped runners), F-CLI-* (manual evidence for task interfaces), release-gate class (design-only; no live publish in this PR). Gate rationale: no package CLI spine changes; workflow structurally proves automatic canary-pinned E2E. |
| Deferred scope explicit                 | PASS   | `plan.md` "Non-Scope" and "Deferred Scope" sections explicitly exclude: live canary publishing, repository/environment changes, JSR version deletion (only yanking), PR #810 scanner reimplementation, published package API changes, automatic yanking. "Hidden Scope" documents workflow-to-workflow correlation, SHA-based pair recording, failed-canary collision handling, branch cleanup, and permission requirements. All deferred items are owner actions or future work, not implementation gaps. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` "jsr-audit surface scan" section covers: every effective `@netscript/*` member returned by `publishWorkspace`, root workspace members for completeness/lockstep checks, new-package risks (missing README sections, over-cap tagline, missing license/exports/docs-site reference, unprovisioned package), publish risks (omitted member, non-lockstep versions, stale specifiers, registry-unsafe imports, dry-run-only confidence), slow-type/public API risk (no published runtime symbol changes; existing atomic publish dry-run remains gate). N/A not applicable; this is a tooling run, not a package wave, but the plan correctly applies jsr-audit principles to the release tooling surface. |

## Open-decision sweep (evaluator-run)

I performed an independent open-decision sweep by inspecting the plan's architecture:

1. **Content-SHA rule for pair verification** — the plan states the verifier accepts "only current SHA or a version-only immediate parent" but does not specify how to detect "version-only" (which files changed, what diff pattern). This is **safe to defer**: the implementation can inspect the parent commit's diff and check that only version-related files changed (e.g., `deno.json`, lock files, version strings). If the heuristic is too narrow, it can be widened later without rework.

2. **Workflow-dispatch run-id correlation** — the plan states "capture dispatch run id, await it with exit status" but GitHub's workflow_dispatch event is fire-and-forget; the dispatch response does not include the run id. The implementation must poll the workflow runs API for the most recent run matching the commit SHA and workflow name. This is an **implementation detail, not an open decision**: the plan names the requirement (exact dispatched E2E run exits green) and the mitigation (capture dispatch run id), and the specific polling mechanism is a slice-4 implementation choice. **Safe to defer**.

3. **#810 merge-order dependency** — the plan states "PR #810 must land before this PR is merge-ready" but does not specify how to enforce it (merge-block via PR review, CI gate, documentation). This is **safe to defer**: the PR body and phase comment can document the dependency, and the reviewer enforces merge order. No rework occurs if #810 lands after this PR's implementation but before merge.

4. **Canary tag retention policy** — the plan states "A successful canary tag remains; its temporary branch is deleted" but does not specify when/if failed canaries are yanked from JSR or which canary tags are retained long-term. This is **safe to defer**: JSR versions are immutable (only yanking is possible), and yanking is explicitly deferred as an owner action. The workflow can retain all canary tags as provenance; the owner decides later which to yank.

**No open decisions force rework when deferred.** All four items are implementation details or owner-policy decisions that can be resolved during or after implementation without changing the plan's architecture.

## Verdict

`PASS`

## Notes

The plan is sound, complete, and ready for implementation. Key strengths:

- **Leverages existing infrastructure**: builds on `cut.ts`, `run-publish.ts`, `publishWorkspace`, and `resolveGithubToken` rather than duplicating logic.
- **Preserves #810 ownership**: calls `release:preflight` task boundary instead of copying the import-attribute scanner; documents the merge-order dependency.
- **Architecturally correct**: shared preparation helper prevents gate drift, paired status context proves both canary and E2E are green, SHA-based verification prevents content drift, workspace-wide N calculation handles partial-publish failures.
- **Risk-mitigated**: every identified risk has a concrete, implementable mitigation within the slice scope.
- **Debt-aware**: closes the stale `release provenance — OIDC publish workflow deferred` entry with concrete workflow evidence; keeps `ISSUE-167-PROD-JSR-SCAFFOLD-E2E` open until a real canary E2E run is green (correctly recognizes that workflow code alone is not closure evidence).

The plan correctly identifies that no package CLI spine or command surface changes are required, so Archetype 6 v2 fitness gates F-CLI-1 through F-CLI-31 are reviewed/N/A with manual evidence for task interfaces. The release-gate class is design-only: no live canary publish occurs in this PR.

Implementation may begin.
