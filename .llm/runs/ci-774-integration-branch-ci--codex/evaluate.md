# Evaluation: honest CI for integration-branch pull requests (#774 / PR #787)

Fill this template during evaluation. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `ci-774-integration-branch-ci--codex` |
| Target         | `.github/workflows/ci.yml` + `.github/workflows/e2e-cli.yml` (GitHub Actions) |
| Archetype      | `N/A` — infrastructure-only workflow change (no `packages/**` / `plugins/**` surface) |
| Scope overlays | `none` |
| Evaluator      | Claude (Opus 4.8) IMPL-EVAL session `319e284e-b456-401d-a75a-c972bd6631e3` — new session, separate from the Codex generator (`019f6c7a`), PLAN-EVAL (`aa9cc799`), and slice-review (`c8f83551`) — 2026-07-16 |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | `PASS` | `plan-eval.md` verdict `PASS` (session `aa9cc799`), committed in `c596ad0e` (plan-gate clear) which **precedes** the implementation commit `e5924b48`. PLAN-EVAL PR comment `20:00:29Z` precedes the IMPL comment `20:10:43Z`. |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design` present with Public Surface, Domain Vocabulary, Ports, Constants, Commit Slices, Deferred Scope, Contributor Path. |
| Commit slices match design plan        | `PASS` | Design lists 3 slices (0/1/2 < 30). Actual commits: S0 bootstrap (`81efb9eb`+`c596ad0e`), S1 impl (`e5924b48`); S2 = this IMPL-EVAL. Order and content match. |
| Each slice has a passing gate          | `PASS` | S0 Plan-Gate `PASS`; S1 YAML parse + classifier tests + focused audit + separate-session slice review `PASS`. All independently reproduced below. |
| No speculative seams (unused files)    | `PASS` | Only 2 workflow jobs added (`lane-visibility` in each file); both execute on every PR — confirmed live (check-runs on `e5924b48` show `core CI lane visibility` and `scaffold CI lane visibility` = success). No dead files. |
| Constants used for finite vocabularies | `N/A`  | Infrastructure YAML: branch families must be literals in `on:`/`if:`; lane names passed via `env:`. Design "Constants" names the finite sets. No TypeScript domain vocabulary in scope. |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Workflow YAML parse | `deno eval --no-lock` + `jsr:@std/yaml` over `.github/workflows/*` | `PASS` | 10/10 workflows parse; `ci.yml` jobs `[close-gate,check-test,quality,deps-report,lane-visibility]`, `e2e-cli.yml` jobs `[classify,scaffold-static,scaffold-runtime,lane-visibility]`. | Re-run independently. |
| Structural assertions | Field extraction via `@std/yaml` | `PASS` | `ci.yml` PR `branches:["main","feat/**","epic/**"]`; push unchanged `["main","feat/package-quality"]`; core `lane-visibility.needs`=all 4 core lanes, `if: always() && pull_request`; `e2e` classify `if` adds `startsWith(base.ref,'feat/')`/`'epic/'` while keeping `main`/label/dispatch; `e2e` `lane-visibility.needs`=`[classify,scaffold-static,scaffold-runtime]`; classify outputs include `run_static`/`run_runtime`. | Matches locked D1–D5. |
| Classifier behavior (frozen) | `deno test --no-lock --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts` | `PASS` | **30 passed, 0 failed.** `ci:skip-e2e`, `ci:skip-scaffold`, both-skip, `ci:full` overrides docs-only + overrides skip labels, docs-only precedence all present. Classifier + test are untouched by the diff. | No lock churn (`--no-lock`). |
| Focused trigger audit | grep `base.ref` / `branches:` across `.github/workflows/` | `PASS` | Only `ci.yml` (event-level PR base) and `e2e-cli.yml` (job-level `classify` `if`) restricted PR CI by base; both widened. `code-quality.yml` base filter is under `push:` (its `pull_request:` is `paths:`-only); `surface-diff.yml` `paths:`-only; `pages.yml`/`publish.yml`/`e2e-cli-prod*`/`jsr-settings.yml` are not PR-base-gated CI lanes; `openhands-agent.yml` is a label/comment automation trigger. No third widening site missed. |
| Action syntax (`actionlint`) | `command -v actionlint` | `NOT_RUN` | `actionlint` is **absent** on this host (independently confirmed). Compensated by YAML parse + structural assertions + focused diff review + **live CI evidence**. | Matches worklog claim. |
| Lock hygiene | Raw `git status --short` before/after all validations | `PASS` | `deno.lock` never appears; all validation used `--no-lock`. Working tree carries only the generator's pre-staged `worklog.md`/`context-pack.md` and the untracked `impl-eval-prompt.md` (this session's brief) — no workflow or lock churn from evaluation. |
| Publish dry-run / doc-lint | — | `N/A` | No package/plugin/public-TS surface. |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| ---- | -------- | ------ | -------- | ---------- |
| F-1..F-19 | Doctrine/package fitness (`quality:scan`, `arch:check`, jsr-audit, layering, surface, etc.) | `N/A` | Infrastructure-only: no `packages/**` / `plugins/**` / public-TS / Deno-task / dependency surface. `research.md` + `slice-review.md` record the N/A basis; the diff touches only 2 YAML files + run artifacts. | none |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Live CI on the fix's own PR | Read-only GitHub `check-runs` for head `e5924b48` (token via `agentic-lib.resolveGithubToken`) | `PASS` | On this integration-branch PR (base `feat/beta10-integration`), the widened trigger caused the core lanes to run and pass: `check-test`=success, `quality`=success, `close-gate`=success, `deps-report`=success. `classify`/`scaffold-static`/`scaffold-runtime`=success. Both new summary jobs `core CI lane visibility` and `scaffold CI lane visibility`=success. The fix is self-demonstrating: the PR is now honestly, fully green — the inverse of the near-empty green #774 reported. |
| Scaffold three-state summary logic | Manual trace of `describe_scaffold_lane` against `scaffold-*` job semantics (`if: !cancelled() && classify.result != 'skipped'`, `RUN = classify.result != 'success' || run_*=='true'`) | `PASS` | classify success + `run_*=false` → job short-circuits success → "skipped by policy" (the "success==ran" trap); classify `skipped` → job skipped → "not scheduled"; classify success + `run_*=true`, or classify `failure` (fail-closed RUN=true) → "ran (result)". Authority taken from classifier outputs before job conclusion (D5). |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| PR → `main` | Trigger/filter reasoning | `PASS` | `main` remains in both filters; core + classifier policy unchanged. |
| PR → `feat/beta10-integration` (this PR) | `feat/**` event glob + `startsWith(base.ref,'feat/')` | `PASS` | Empirically green (live check-runs above). `feat/**` matches `feat/beta10-integration`. |
| Docs-only + `ci:skip-e2e` | Classifier tests + summary logic | `PASS` | Core lanes still run (no path skip in `ci.yml`); scaffold jobs short-circuit and the summary reports "skipped by policy". Selection policy untouched (30/30 tests). |

## Anti-Pattern Check

Only mark `CLEAR` when the run scope touched or could affect the pattern. Use `N/A` for patterns
outside scope.

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1..AP-25 | `N/A` | Package/plugin doctrine anti-patterns do not apply to a GitHub Actions YAML + run-artifact change. | No framework source in scope. |

Workflow-specific hazards were checked directly instead: no new `write` permission scopes, no
third-party actions, no untrusted interpolation (all `needs`/classifier values pass through `env:`
and print via `printf`), classifier/label skip policy preserved (30/30). `CLEAR`.

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No doctrine violation introduced. |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | — |
| Unrecorded violations | 0     | Infrastructure-only; `arch-debt.md` delta is nil. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| `low` (non-blocking) | `slice-signoff-prompt.md` has no `## SKILL` chapter. | Grep of the four prompt artifacts. | None required for PASS. It is a mechanical stage/commit/push steering note to the already-briefed Tier-A supervisor, not an implementation/evaluation/side-fix agent brief; the three substantive briefs (plan-eval, slice-review, impl-eval) each carry a `## SKILL` chapter. Add one if reused as a template. |
| `low` (non-blocking) | Core `lane-visibility` prints `ran (%s)` unconditionally; a concurrency-cancel would read `ran (cancelled)`, and the scaffold summary's "skipped by policy" branch would win over a cancel on a policy-skipped lane. | `ci.yml:172-175`; `e2e-cli.yml:264-270`. | None. The raw result token is always shown; harmless cosmetic edge already noted in `slice-review.md`. |
| `info` | PR body's read-only ruleset audit claim is accurate. | Ruleset `18459345` (`main-branch-protection`, active, target `~DEFAULT_BRANCH`) `required_status_checks = ["quality","check-test","deps-report"]` — verified read-only, matches the PR body verbatim. | None. |

## Close-Gate / PR Hygiene (netscript-pr)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Closing keyword | `PASS` | `Closes #774` in the PR `## Scope` (#774 is a discrete issue, not an epic/umbrella). |
| Referenced-issue acceptance boxes | `PASS` | Issue #774 has **no** acceptance/`gate:` checkboxes (its "Suggested fix" is a numbered list) — nothing close-gated to satisfy. |
| Labels | `PASS` | `type:fix`, `status:impl-eval` (exactly one `status:`), `area:tooling`, `priority:p1`, `gate:ci`. |
| Milestone | `PASS` | `0.0.1-beta.10` on both PR and issue. |
| Merge state | `PASS` | PR is **draft**, `status:impl-eval`, not `ready-merge`; the close-gate is not yet active and is not violated. DoD's last box ("Separate-session PLAN-EVAL and IMPL-EVAL pass") is honestly unchecked — this IMPL-EVAL PASS supplies it. |
| Commit trail | `PASS` | 3 commits on PR match the branch; RESEARCH / PLAN / PLAN-EVAL(APPROVED) / IMPL phase comments present. |
| Release-gate class | `N/A` | Not a release cut/gating run; `scaffold.runtime` is additive (not required), and no `e2e-cli-prod` is implicated. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| A CI-trigger fix on an integration branch can self-verify — inspect the PR's own live `check-runs`, since the widened trigger runs the very lanes it adds. | Infra runtime evidence via live check-runs | workflow/CI runs | `medium` |
| Event-level `branches:` supports globs (`feat/**`); a job-level `if` does not and needs `startsWith(base.ref,'feat/')`. Widening base coverage must handle both surfaces. | GitHub Actions filter asymmetry | CI workflow edits | `high` |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved scope is complete and matches the locked plan (D1–D5): `ci.yml` PR bases widened to `main`/`feat/**`/`epic/**` (push unchanged), `e2e-cli.yml` `classify` applicability widened via `startsWith` with all prior opt-ins preserved, and two dependency-free `$GITHUB_STEP_SUMMARY` lane-visibility jobs distinguish ran-vs-policy-skipped using classifier outputs. All applicable gates pass and were independently reproduced: 10/10 YAML parse + structural assertions, 30/30 frozen classifier tests, focused base-filter audit (no missed site), and — decisively — the fix is empirically green on its own PR, where core `check-test`/`quality`/`close-gate`/`deps-report` and both new summary jobs now run and succeed on an integration-branch base. No package/plugin/JSR/doctrine surface (fitness gates N/A), no `arch-debt` delta, no lock churn. Process invariants hold: Plan-Gate PASS preceded implementation, the Design checkpoint was followed, and the generator, PLAN-EVAL, slice-review, and this IMPL-EVAL are four separate sessions. The two `low` findings are non-blocking cosmetic/brief-hygiene notes. Closing keyword, labels, milestone, and commit trail are correct; the draft PR is not yet at `ready-merge`, so the close-gate is not violated. |
