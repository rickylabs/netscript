use harness

## SKILL

- netscript-harness — Tier-D implementation slice in a harness run
- netscript-doctrine — required before touching packages/** or plugins/**
- netscript-cli — CLI/scaffold/E2E command surface
- netscript-tools — scoped wrappers, gate evidence, rtk
- netscript-deno-toolchain — deno doc/why before broad reads
- netscript-pr — PR/labels/milestone conventions
- rtk — prefix read-heavy git/grep
- deno-fresh — if the issue touches Fresh/fresh-ui surfaces

## Slice: fix #783 — fresh-ui markdown render

Branch: `fix/783-beta10-stabilization` (worktree `/home/codex/repos/b10-783`, base `feat/beta10-integration` @ 0daa575b). PR base: `feat/beta10-integration`.

FIRST: read issue #783 in full via the GitHub API (token via resolveGithubToken in
`.llm/tools/agentic/lib/agentic-lib.ts`); it is the authoritative scope. Reproduce before fixing;
fix at the owning framework layer, not the test; add a regression test at the failing layer; state
the root cause explicitly in the PR body.

Gates: if the diff touches packages/** or plugins/** run `deno task quality:scan` +
`deno task arch:check` + scoped check/lint/fmt wrappers over the touched roots; run the smallest
runtime validation that proves the fix, and the full
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` ONLY if scaffold output or
runtime wiring changed.

Constraints:
- Do NOT dispatch your own PLAN-EVAL/IMPL-EVAL or spawn evaluator sessions — the supervisor
  triggers all evaluations. Do a normal plan.md + worklog.md in your run dir; that is enough.
- No new suppressions (any / as unknown as / deno-lint-ignore / @ts-*). No lock/cache deletion.
- Commit by slice; push explicit refspec `git push origin HEAD:refs/heads/fix/783-beta10-stabilization`; open a DRAFT PR to
  `feat/beta10-integration` with `Closes #783`, labels `type:fix, priority:p1, status:impl-eval`
  plus the correct `area:*`, milestone `0.0.1-beta.10`. You do not self-certify or merge.
- If the issue turns out to be already fixed, stale, or materially larger than a slice, STOP and
  record that in your worklog + a PR-less summary commit instead of improvising scope.
