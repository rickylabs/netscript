# Research — fix-1087-harness-hardening--release-blockers

## Re-baseline

- Carried-in source: issue bodies #1087, #1084, #1080, and #1083.
- Re-derived against `origin/main` / branch baseline
  `4833a1676f672aa3e4cf970d05afbcf17a57629b` on 2026-08-03.
- The worktree is clean, is on `fix/1087-harness-hardening`, and exactly matches the requested
  baseline. No remote branch existed at bootstrap.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `resolveCanonicalFormalEvaluatorRoute()` validates only the launched route. `claude-print.ts` gives the evaluator the default Claude tool set, and no later request boundary validates child model ids. | `.llm/tools/agentic/runtime/routing-policy.ts`; `.llm/tools/agentic/claude/claude-print.ts`; `claude --help` shows `Agent`/tool configuration surfaces. |
| 2 | The isolated OpenRouter environment fixes `ANTHROPIC_BASE_URL` and late-binds the credential, so a loopback HTTP guard inserted between Claude Code and that upstream can inspect every inference request without logging a credential. | `runtime/provider-profiles.ts`; `runtime/adapters/claude-adapter.ts`; `runtime/adapters/child-process-environment-adapter.ts`. |
| 3 | The safe abort boundary is the `claude-print.ts` parent: it can generate/retain a session id, start the loopback guard, kill the evaluator process on a prohibited request, and exit non-zero. | `claude-print.ts`; local `claude --help` supports `--session-id` and stream JSON. |
| 4 | `agentic:gh-pr create` reads any caller-supplied `--body-file` immediately before publication. It has no ownership record, session id, unique staging directory, or fingerprint check. | `.llm/tools/agentic/github/gh-pr.ts`. |
| 5 | No active harness template mandates a shared `pr-body.md`, but the generic guidance does not require a per-run/per-session publication path. The gh-pr example accepts an arbitrary path. | `rg -n "pr-body\\.md|body-file" .llm/harness .llm/tools/agentic/README.md`. |
| 6 | The `check-test` CI job has no services and no `NETSCRIPT_TEST_REDIS_URL`; both real-Redis regression files therefore skip. | `.github/workflows/ci.yml`; the two test files' `ignore` expressions. |
| 7 | Removing the 17-line #1075 `atomicTail` serialization is an exact negative control: the current tests expect one winner while the pre-fix adapter admits all concurrent writers. | `git diff 4634afe56d 2d58481e4e -- packages/kv/adapters/redis.adapter.ts`; PR #1075 evidence. |
| 8 | There is no live 0.0.4 intro file yet. The release tool requires a hand-authored `--notes-file`; earlier releases kept the intro in their harness run directory. | `netscript-release` skill; `release-notes-beta7-intro.md` and `release-notes-beta10-intro.md`. |
| 9 | No live docs/generated surface references `assertResolvable`; matches occur only in historical run evidence/logs. | `rg -n "assertResolvable" . --hidden --glob '!.git/**' --glob '!deno.lock'`. |

## jsr-audit surface scan

- N/A. This slice changes internal harness tooling, CI orchestration, tests-as-CI-consumers, and
  release prose. It does not change a package export map, JSDoc surface, or publishable API.

## Open questions

- None that force rework. The implementation mechanisms and their failure semantics are locked in
  `plan.md`.
