use harness

## SKILL
- netscript-harness; netscript-tools; netscript-deno-toolchain; netscript-pr; rtk

## Slice: reconcile origin/main into feat/beta10-integration (form the beta.10 release union BEFORE the wave PR)

Worktree `/home/codex/repos/b10-mainrec`, branch `chore/reconcile-main-into-beta10` (= integration head d962502f + your work). PR base: feat/beta10-integration.

Why: main carries 3 commits the integration branch lacks — `10162bfd` (agentic combo: packages/mcp + skills + agent CLI), `f391190f` (#784 Fable-5 restoration in routing), `6a710bd5` (OpenCode lane). The wave→main PR would form this union blind; form it here so CI + docs run against the real shipped tree.

Task: `git fetch origin main` then `git merge origin/main`. Conflict-resolution rules (owner-ratified doctrine):
- `.llm/tools/agentic/runtime/routing-policy.ts` + `.llm/harness/workflow/lane-policy.md`: keep the integration side's #794 review-pairing ladder (review_codex* lanes: Fable in-plan/auto-selectable, Opus/Sonnet fallbacks, light/fast lanes) AND take main's #784 state for the NON-review lanes (orchestrator/deep-analysis etc.: Fable restored, temporary substitution retired). The merged file must contain NO `temporary_while_fable_outside_subscription` condition anywhere. Update any test asserting the old gating.
- Everything else: standard union; where both sides touched a file, prefer semantic union, never drop either feature.
Validation: `deno test --no-lock -A .llm/tools/agentic/runtime/ .llm/tools/agentic/config/`; `deno task check`; focused packages/mcp smoke test if the merge touches it; `deno task quality:scan` changed-file mode.

Push explicit refspec `git push origin HEAD:refs/heads/chore/reconcile-main-into-beta10`; open DRAFT PR to feat/beta10-integration titled "chore: reconcile main into beta.10 integration (agentic combo + Fable restoration + OpenCode lane)", body describing each conflict resolution, labels `type:chore, area:tooling, priority:p0, status:impl-eval`, milestone 0.0.1-beta.10, NO closing keywords. Do NOT dispatch evals; do not merge.
