use harness

## SKILL
- netscript-harness; netscript-doctrine; netscript-cli; netscript-tools; netscript-deno-toolchain; netscript-pr; rtk; aspire

## Slice: fix #791 — Aspire/CLI generator emission fixes (sub-slice A of #781)

Worktree: `/home/codex/repos/b10-781a` (branch `fix/781a-aspire-generator-emission`, base
feat/beta10-integration @ 0daa575b; merge latest origin base first). Read issues #791 AND #781 in
full via the GitHub API (resolveGithubToken in `.llm/tools/agentic/lib/agentic-lib.ts`), plus the
prior re-baseline in `.llm/runs/fix-781-beta10-stabilization--codex/research.md` on branch
`fix/781-beta10-stabilization` (fetch it) — findings 1–6 + 8 are your scope; finding 9 belongs to
a sibling slice (#792), finding 7 is already fixed.

Fix each at the owning generator/template layer with a regression test; where an existing test
asserts the invalid output, change it deliberately and say so in the PR body. Gates:
`deno task quality:scan` + `deno task arch:check` + scoped wrappers over touched roots, and the
full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (this slice changes
scaffold output — the full runtime verdict is required).

Constraints: no new suppressions; commit by finding-cluster; push explicit refspec
`git push origin HEAD:refs/heads/fix/781a-aspire-generator-emission`; DRAFT PR to
feat/beta10-integration with `Closes #791` (reference #781 WITHOUT a closing keyword), labels
`type:fix, area:cli, area:deploy, priority:p1, status:impl-eval`, milestone 0.0.1-beta.10. Do NOT
dispatch your own PLAN-EVAL/IMPL-EVAL — the supervisor triggers all evaluations. Do not merge.
