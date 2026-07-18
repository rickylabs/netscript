use harness

## SKILL
- netscript-harness; netscript-doctrine; netscript-cli; netscript-tools; netscript-pr; rtk

## Slice: fix #792 — plugin-workers unconditional sample queue trigger (sub-slice B of #781)

Worktree: `/home/codex/repos/b10-781b` (branch `fix/781b-workers-sample-trigger`, base
feat/beta10-integration @ 0daa575b; merge latest origin base first). Read issues #792 AND #781
via the GitHub API (resolveGithubToken in `.llm/tools/agentic/lib/agentic-lib.ts`). Scope is ONLY
finding 9: `plugins/workers/worker/worker-options.ts:237` sample trigger + `worker.ts:106`
unconditional prepend. Make it opt-in (or scaffold-provided) without degrading the scaffolded
default experience; regression test at the worker-options layer.

Gates: `deno task quality:scan` + `deno task arch:check` + scoped wrappers over plugins/workers,
plus the full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` if the scaffolded
default behavior changes (it likely does).

Constraints: no new suppressions; push explicit refspec
`git push origin HEAD:refs/heads/fix/781b-workers-sample-trigger`; DRAFT PR to
feat/beta10-integration with `Closes #792` (reference #781 without closing keyword), labels
`type:fix, area:plugins, priority:p1, status:impl-eval`, milestone 0.0.1-beta.10. Do NOT dispatch
your own PLAN-EVAL/IMPL-EVAL — the supervisor triggers all evaluations. Do not merge.
