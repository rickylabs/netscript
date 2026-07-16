# Slice Review (Amendment A1) — ci-774-integration-branch-ci--codex

- Reviewer: Claude (Opus 4.8), Tier-A supervisor slice-review gate, session
  `c8f83551-98cf-4b6c-a89b-72ef2d6450f8` — separate from the Codex generator — 2026-07-16
- Run: `ci-774-integration-branch-ci--codex`
- Branch / worktree: `ci/774-integration-branch-ci` @ `/home/codex/repos/b10-774-ci`
- Slice under review: **Slice 1** (uncommitted) — supported-base widening + core/scaffold lane
  visibility summaries
- Surface: GitHub Actions workflow YAML + tracked harness run artifacts. Archetype **N/A**
  (infrastructure-only; no `packages/**` / `plugins/**` surface — so `quality:scan` / `arch:check` /
  jsr-audit do not apply).

## Verdict

`PASS`

## Scope of the reviewed diff (ground-truth)

Raw `git status --short` (spawned directly, not RTK):

```
 M .github/workflows/ci.yml
 M .github/workflows/e2e-cli.yml
 M .llm/runs/ci-774-integration-branch-ci--codex/context-pack.md
 M .llm/runs/ci-774-integration-branch-ci--codex/pr-body.md
 M .llm/runs/ci-774-integration-branch-ci--codex/worklog.md
?? .llm/runs/ci-774-integration-branch-ci--codex/slice-review-prompt.md
```

Two workflow files + three tracked run artifacts, plus the (untracked) review prompt. **No
`deno.lock`, no `packages/`/`plugins/`/`apps/` churn, no `deno.json` / Deno-task edits.** Lock
hygiene clean.

## Findings

### Correctness — verified

1. **`ci.yml` PR-base widening (D1).** `pull_request.branches: [main, "feat/**", "epic/**"]` is valid
   event-level filter glob syntax (`**` spans slashes). It supersets the prior
   `feat/package-quality` and matches the actual PR base `feat/beta10-integration`, so the fix is
   self-applying to this very PR. `push:` left unchanged (D2). ✔
2. **`e2e-cli.yml` classify applicability widening (D3).** Correctly implemented as a job-level `if`
   with `startsWith(base.ref, 'feat/')` / `startsWith(base.ref, 'epic/')` — the right choice because
   a job `if` does **not** support globs. `workflow_dispatch`, `base.ref == 'main'`, and the
   `e2e-cli-gate` label opt-in are all preserved; only the two integration families were added.
   Expression functions are valid; `startsWith` on the null `base.ref` for `workflow_dispatch`
   coerces to empty-string false without error. ✔
3. **Scaffold lane-visibility summary logic (D5) — the load-bearing part.** `describe_scaffold_lane`
   resolves the three real states correctly against the actual scaffold job semantics
   (`if: !cancelled() && needs.classify.result != 'skipped'`, `RUN = classify.result != 'success' ||
   run_*=='true'`):
   - classify `success` + `run_*=false` → job succeeds as a policy short-circuit → **"skipped by
     policy"** (the "success == ran" trap the plan calls out). ✔
   - classify `skipped` (unsupported base, no opt-in) → job `skipped` → **"not scheduled"**, and the
     `classify` row prints "not scheduled (unsupported base and no opt-in label)". ✔
   - classify `success` + `run_*=true`, or classify `failure` (fail-closed → RUN=true) → **"ran
     (result)"**. ✔
   Authority is taken from classifier outputs (`run_static`/`run_runtime`) before job conclusion,
   exactly as D5 requires. ✔
4. **Core lane-visibility summary.** Core lanes (`close-gate`/`check-test`/`quality`/`deps-report`)
   have no policy-skip mechanism and always run on a PR, so the unconditional `ran (%s)` string is
   truthful — not a false claim. `if: always() && github.event_name == 'pull_request'` is the right
   guard (summaries are PR-only; `close-gate` itself is PR-gated). ✔
5. **No shell-injection / no new permissions.** Both summary jobs pass all `needs`/classifier values
   through `env:` and print via `printf` (no untrusted interpolation into shell source — same
   discipline the existing `SKIP_REASON` steps use). They only write `$GITHUB_STEP_SUMMARY`, request
   no `write` scopes, and add no third-party actions or API calls (D4). ✔

### Classifier / label gating preserved — verified by execution

- `.github/scripts/ci-classify-changes.ts` and its test are **untouched** (`git diff --name-only
  .github/` = only the two workflow files).
- Re-ran `deno test .github/scripts/ci-classify-changes.test.ts` → **30 passed, 0 failed**,
  including `ci:skip-e2e` (runtime-only skip), `ci:skip-scaffold` (static-only skip), both-skip,
  `ci:full` overrides docs-only, `ci:full` overrides skip labels, and docs-only precedence. The
  skip/label policy is intact; the slice only widened *applicability*, never weakened selection. ✔

### Focused-audit claim — independently confirmed

The worklog's "only `ci.yml` event filter and `e2e-cli.yml` applicability gate required widening;
other PR workflows are unrestricted by base" is accurate: `code-quality.yml`'s `branches: [main]`
sits under **`push:`** (its `pull_request:` is `paths:`-filtered, base-unrestricted), and
`surface-diff.yml` is `paths:`-filtered with no base filter. `openhands-agent.yml`'s branch filter
is an on-demand automation trigger, not a CI lane. No third widening site was missed. ✔

### Coherence with the approved plan — verified

Matches locked decisions D1–D5 and honors every Non-Scope item (no branch-protection/ruleset
mutation, no classifier weakening, no package/plugin/lockfile/Deno-task edits, scaffold-runtime not
promoted to required). Stale-comment updates are in scope: the `ci.yml` `quality` header now states
it is required by ruleset `main-branch-protection`, corroborated by the PLAN-EVAL read-only ruleset
audit (`18459345`) and mirrored in `pr-body.md`. No overreach. ✔

### PR evidence / lifecycle (netscript-pr) — verified

`pr-body.md` carries `Closes #774` in `## Scope` (correct closing keyword; #774 is a discrete issue,
not an epic/umbrella). Definition-of-Done honestly leaves "Separate-session PLAN-EVAL and IMPL-EVAL
pass" **unchecked**, and Validation pastes real results with `actionlint` marked unavailable. Run
artifacts (worklog/context-pack) were updated as part of the slice, satisfying the per-slice
trackability rule. ✔

## Non-blocking observations (fix at commit time; not defects in slice logic)

1. `pr-body.md` `## Harness` still reads `Phase: plan-eval` while `context-pack.md` advanced to
   `gate`. Cosmetic staleness in the PR body; refresh when flipping to `status:impl-eval`.
2. Slice S1's `pr-body.md`/worklog rows say "pending commit hash" — expected for an uncommitted
   slice, but the real hash MUST be filled in at the sign-off commit + draft-PR comment.
3. Core lane-visibility prints `ran (%s)` unconditionally; in a rare concurrency-cancel it would read
   `ran (cancelled)`. Harmless (the raw result token is shown), but a future refinement could
   special-case non-`success` results. Not required for this slice.

## Gate

Substantive Tier-A review performed on the uncommitted diff; the sign-off commit remains the
supervisor's, not the implementer's. No self-certification: PLAN-EVAL and this review are separate
sessions from the Codex generator. No workflows or other artifacts were edited by this review; no
commit, push, GitHub-metadata change, or scaffold fleet was run.
