You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=800 use harness

Run **IMPL-EVAL** (final post-implementation evaluator pass) for the `chore/prod-readiness` run (run id `chore-prod-readiness--cleanup`). You are a SEPARATE evaluator session from the implementer â€” do NOT implement or fix; evaluate and write the verdict.

Read first: `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`, then `.llm/tmp/run/chore-prod-readiness--cleanup/plan.md`, `worklog.md` (incl. `## Design`, `## Gate Results`, and `## Handoff Notes`), `context-pack.md`, `drift.md`, `commits.md`, and the gate docs the plan references.

Evaluate slices G1-0â€¦G1-6 (G1-3 = G1-3a/b/c) against the LOCKED plan. Verdict-critical checks:
1. **PR-7 deprecate-before-remove** honored on every PUBLIC surface â€” G1-3c is a *refactor* (`trustedConnection` â†’ `authentication.type='ntlm'`), NOT a hard delete; G1-4 removed deprecated Fresh option aliases while the canonical option remains; G1-5 removed the workers recurring-job `.schedule(...)` API AND migrated the scaffolder/template/fixture in the same slice. Confirm no public symbol was deleted without the deprecate step or a recorded debt deferral.
2. **OFF-LIMITS untouched** â€” `git diff release/jsr-readiness...chore/prod-readiness` must show NO edits to `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, `packages/aspire/src/public/mod.ts`, version pins, the catalog block / `catalog:` refs, or any `deno.lock`.
3. **F3 functional preservation** â€” the runtime-functional `ConnectionStrings__{provider}db` env wiring read by `packages/database/.../database-connectivity.ts` (~lines 48/71/94) must NOT have been removed as "dead config". Verify those reads still resolve.
4. **Subtractive-only with proof** â€” each removal has a zero-consumer scan; G1-6 correctly deleted NOTHING because no bounded candidate met the zero-reference threshold (surviving `schedule`/`buildConnectionString` hits are functional plumbing). Confirm no over-deletion.
5. **Heavy gate** â€” `deno task e2e:cli run scaffold.runtime --cleanup` was green on G1-5 (generated-workspace typecheck after scaffolder migration); `publish:dry-run` green. Re-run `publish:dry-run` to confirm no regression.
6. **Debt validity** â€” `D-G1-1`, `D-G1-2`, `D-G1-3a`, `D-G1-5` are recorded in `arch-debt.md` and accurately describe deferred work (not a dodge for in-scope deletions).

Write the verdict to `.llm/tmp/run/chore-prod-readiness--cleanup/evaluate.md` (`PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`). Write your summary to `OPENHANDS_SUMMARY_PATH`; do NOT post your own PR comment (the workflow owns the status comment). Do not de-catalog, edit pins, delete lock/cache files, or upgrade dependencies.


Issue/PR title: chore/prod-readiness — repo cleanup (Group 1 of release/jsr-readiness)

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
- Write /home/runner/work/_temp/openhands/27761272236-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27761272236-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-54/run-27761272236-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 54
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27761272236
