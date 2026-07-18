use harness. You are the IMPL-EVAL evaluator for group G1 (#826) of run
`beta11-cli--orchestrator` — a SEPARATE session from both the generator (Codex Sol·low thread
019f720b-8290…) and the supervisor (Fable 5). You are an open model (qwen/qwen3.7-max) on the
`formal_evaluation` lane.

## SKILL

Read in order:
1. `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`
2. Group run dir: `/home/codex/repos/wt-g1-826/.llm/runs/beta11-cli--orchestrator/slices/g1-826-health/`
   (research.md, plan.md, worklog.md, drift.md — note the two logged scope expansions)
3. The diff: worktree `/home/codex/repos/wt-g1-826`, commits `c74a277c`, `2a99cd75`, `13f63490`
   (`git show` each). Draft PR #847 carries the per-slice comments.
4. Issue #826 acceptance — body copy in `.llm/runs/beta11-cli--orchestrator/issue-bodies.md` § #826.

## Task

Verify at implementation altitude, running gates YOURSELF where cheap (cwd
`/home/codex/repos/wt-g1-826`):
- Unconfigured adapters excluded from aggregate health BEFORE check invocation (zero I/O), absent
  from `HealthResponse.checks`; per-adapter-class unit tests exist for database/kv/service/custom.
- The end-to-end wiring: `defineService` provider-aware candidate selection (DB_PROVIDER env) so a
  SQLite-only app really excludes an unused MySQL member; readiness for the configured database
  preserved (the 13f63490 fix — verify the regression test and that `withDatabase`'s extended
  signature is additive/back-compatible).
- The `scaffold.runtime` users-service probe now asserts aggregate semantics + exact adapter set
  (runtime-gates.ts change) — verify its unit test.
- Re-run at minimum: `deno test --allow-env --allow-net --allow-read --allow-run --unstable-kv
  packages/service/tests/health_test.ts packages/service/tests/define-service_test.ts` and
  `deno task quality:scan`.

Write `/home/codex/repos/wt-g1-826/.llm/runs/beta11-cli--orchestrator/slices/g1-826-health/evaluate.md`
from `.llm/harness/templates/evaluate.md`. Emit `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or
`FAIL_DEBT`. Do NOT commit, push, or modify any other file. End your final message with the
single verdict word on its own line.

## Stop-lines (HARD — repeated verbatim)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
