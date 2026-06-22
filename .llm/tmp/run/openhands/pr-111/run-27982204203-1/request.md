You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=300 use harness

# IMPL-EVAL — JSR-readiness additive valid set (PR-A, separate-session final gate)

You are the **IMPL-EVAL evaluator** for PR-A of the JSR-readiness umbrella promotion, running in a
**separate session** from the generator. **You evaluate the IMPLEMENTATION and emit one verdict. You
do NOT implement, fix, merge, or re-plan.** PLAN-EVAL already PASSED (run 27978098382).

## Context
The long-parked `release/jsr-readiness` umbrella was never promoted to `main`. Per a locked user
decision it is being re-landed as a FRESH branch off current `main`, dragging ONLY the valid set,
**split** into this non-breaking PR-A and a breaking PR-B (prod-readiness API removals, follows
later after a main-consumer check). Docs-v4 already landed on main separately (#110); the umbrella's
old Lume docs site is dropped as superseded.

Branch `chore/jsr-readiness-additive` (tip `188f27c1`). Implemented slices (all committed + pushed,
each with a per-slice PR comment):
- S1 `0c57c93b` — deps-hygiene tools (`.llm/tools/deps/**` + 2 root doc/readme checkers).
- S2 `f68c5c23` — deno.json deps task block + `ci:quality += deps:check`; arch:check reconcile
  (prepend `deps:check &&` without clobbering main's per-auth-package multi-root form / `arch:check:repo`).
- S3 `9c964585` — 21+2 byte-clean READMEs (US-9 template).
- S4 `e0f606b1` — 6 drifted READMEs re-applied BY HAND over main's current content.
- S5 `fa17d2ed` — fresh-ui doc-lint fixes (~15 files) + `packages/fresh/deno.json`.
- S6 `c105c90e`/`c50d30a1` — doctrine/skill docs + regenerated `.claude/skills/` mirrors.
- S7 `c105c90e` + record `188f27c1` — **user-directed scope addition**: removed the stale
  `impeccable` skill (its SKILL.md referenced missing `reference/*.md` and was the sole cause of a
  pre-existing `docs:links` baseline failure). Recorded in `drift.md` as minor user-directed scope.

## What to read (on this branch)
- `.llm/tmp/run/jsr-readiness-additive/plan.md` — the PASSed plan (scope, slices, gate set, jsr-audit).
- `.llm/tmp/run/jsr-readiness-additive/plan-eval.md` — PLAN-EVAL verdict + §G per-slice gate map + 3 notes.
- `.llm/tmp/run/jsr-readiness-additive/worklog.md` — implementation evidence + gate results table.
- `.llm/tmp/run/jsr-readiness-additive/commits.md`, `drift.md`, `context-pack.md`.

## Protocol
Read and apply: `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`,
`.llm/harness/gates/archetype-gate-matrix.md`, `.llm/harness/archetypes/SCOPE-docs.md`,
`.agents/skills/jsr-audit/SKILL.md`.

## Hard criteria
1. **Non-breaking integrity.** Confirm PR-A removes/renames NO public API surface. Spot-check the diff
   (`git diff origin/main...HEAD`) for any deletion of compat shims, MSSQL aliases, Fresh deprecated
   options, or workers `schedule()` — all of those belong to PR-B. Any breaking removal is blocking.
2. **No clobbered main content.** The 6 hand-reconciled READMEs (S4) and the arch:check reconcile (S2)
   must PRESERVE main's substantive auth/sagas/idempotency content and main's multi-root `arch:check` +
   `arch:check:repo`. Verify nothing from main was overwritten by a stale umbrella version.
3. **Gates actually green on the branch.** Re-run / verify from the branch: `deno task check`
   (+`--unstable-kv`), `deno task lint`, scoped `fmt:check` (`--ext ts,tsx` via run-deno-fmt.ts),
   `deno task deps:check`, `deno task arch:check`, README doc-lint (`check-readme-standard.ts`), and
   `deno task docs:links`. The worklog claims all green after S7 cleared the docs:links baseline —
   confirm, don't take on faith. Report any red.
4. **Lock hygiene.** Confirm root `deno.lock` was NOT churned (the new `.llm/tools/deps/*` imports must
   not have forced a lock re-resolution). A churned lock is at least FAIL_DEBT.
5. **Zero-cast + jsr-audit.** Confirm the S5 fresh-ui fixes removed `any`/private-type-ref WITHOUT
   adding casts (only the 2 accepted casts repo-wide), and that PR-A introduces no new slow-type /
   `any` publish-surface risk (jsr-audit-neutral-to-positive).
6. **S7 scope-addition acceptability.** Confirm the impeccable removal is safe (nothing references it)
   and properly recorded as user-directed scope in `drift.md` — not silent scope creep.

## Deliverable
Write `.llm/tmp/run/jsr-readiness-additive/evaluate.md` (verdict + criterion-by-criterion + any FAIL
items with the required fix), and post the verdict + summary as a **PR comment** (this run is
`output=pr-comment`). Emit exactly one verdict per `verdict-definitions.md`: **PASS**, **FAIL_FIX**,
**FAIL_RESCOPE**, or **FAIL_DEBT**. Do NOT modify code or merge. Do NOT churn `deno.lock`.

## SKILL
Activate and follow these repo skills before and during evaluation (read `.agents/skills/<name>/SKILL.md`
directly if no `.claude/skills/<name>/` mirror exists). Be generous:
- `netscript-harness` — IMPL-EVAL protocol, verdict definitions, gate matrix, evaluator separation, run artifacts.
- `jsr-audit` — publishability rubric applied to the implemented surface; slow-type / export-surface risks.
- `netscript-doctrine` — package/plugin public-surface rules (fresh-ui exports, README scope, doctrine 01/04).
- `netscript-deno-toolchain` — `deno task`, `deno doc`/`deno why`, the `.llm/tools/deps/` wrappers and gotchas.
- `netscript-tools` — scoped check/lint/fmt wrappers, raw git verification of the diff, lock-hygiene decisions.
- `rtk` — prefix read-heavy `git`/`grep`/`ls` to cut output tokens.

If a named skill does not exist, note it and proceed — do not block.


Issue/PR title: JSR-readiness — additive valid set (non-breaking, PR-A of 2)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27982204203-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27982204203-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-111/run-27982204203-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 111
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27982204203
