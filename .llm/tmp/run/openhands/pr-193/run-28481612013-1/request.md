You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=500 run IMPL-EVAL on this PR.

## TASK
This is PR #193 — Plugin RE-ARCHITECTURE v2 (#184): conform all 5 connectors (workers, sagas, triggers, streams, auth) + greenfield `netscript plugin new` onto the core-owned `@netscript/plugin` contract base, deleting per-connector manifest duplication. Run the harness IMPL-EVAL protocol as a SEPARATE evaluator session (you are NOT the generator; do not self-certify the generator's claims — re-derive them).

## SKILL (activate before evaluating)
- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, verdict definitions, evaluator separation. Read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`.
- `.agents/skills/netscript-doctrine` — package/plugin archetype (ARCHETYPE-5 plugin), axioms, anti-patterns, layering, debt registry `.llm/harness/debt/arch-debt.md`.
- `.agents/skills/jsr-audit` — publish-surface / slow-types bar for the touched packages.
- `.agents/skills/netscript-deno-toolchain` — `deno doc`, scoped check/lint/fmt wrappers, publish dry-run, arch:check.
- `.agents/skills/netscript-tools` — scoped `.llm/tools/run-deno-*.ts` wrappers as the package-quality evidence source.

## INPUTS TO READ
- Run artifacts under `.llm/tmp/run/chore-plugin-rearch-v2--184/`: `plan.md`, `worklog.md`, `commits.md`, `context-pack.md`, `drift.md`.
- The locked plan decisions: Resolution B cast budget (NO-NEW-CAST; in-core casts grandfathered; NO new `any`); Decision A/B/C per connector; #181 triggers reconciled FORWARD-MERGE (commit 38d1cef0, no rebase/force-push), 11 v1 routes verified by `deno doc`.

## VERIFY (re-run, do not trust)
1. Grep gates = 0: `rg "WorkersPluginManifest|SagasPluginManifest|TriggersPluginManifest|StreamsPluginManifest|AuthPluginManifest|inspectWorkers|inspectSagas|inspectTriggers|inspectAuth" plugins packages -n` (allow only test/doc references the worklog justifies).
2. NO net-new `as`/`as unknown as` casts and NO new `any` outside the 2 grandfathered allowances.
3. `deno task arch:check` → FAIL=0.
4. Scoped check/lint/fmt over each touched plugin + `packages/plugin-triggers-core` + `packages/plugin` via the `.llm/tools/run-deno-*.ts` wrappers (`--ext ts,tsx`).
5. `deno task publish:dry-run` per touched package (no NEW slow-types).
6. Triggers: `deno doc plugins/triggers/contracts/v1/mod.ts` exposes all 11 routes incl. the 6 #181-backed ones.
7. Full local runtime smoke from a NATIVE worktree (never /mnt/c): `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — generator reported passed=48 failed=0; confirm or refute.

## OUTPUT
Write the verdict as a PR comment: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, with per-gate evidence and any new debt the generator should have recorded. Preserve lock hygiene: do not commit deno.lock churn or source edits unless a reviewed fix is required; if so, isolate it and explain.


Issue/PR title: Plugin RE-ARCHITECTURE v2 — unified thin surface + greenfield-first (#184, issue #191)

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
- Write /home/runner/work/_temp/openhands/28481612013-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28481612013-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-193/run-28481612013-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 193
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28481612013
