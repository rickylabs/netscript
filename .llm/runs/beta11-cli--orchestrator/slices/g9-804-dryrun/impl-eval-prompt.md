use harness. You are the IMPL-EVAL evaluator for group G9 (#804) of run
`beta11-cli--orchestrator` — a SEPARATE session from the generator (Codex Sol·low thread
019f722b-8119…) and the supervisor (Fable 5). You are an open model (qwen/qwen3.7-max) on the
`formal_evaluation` lane.

## SKILL

Read: `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`, the
group run dir `/home/codex/repos/wt-g9-804/.llm/runs/beta11-cli--orchestrator/slices/g9-804-dryrun/`,
commit `5e95d54e` in worktree `/home/codex/repos/wt-g9-804`, draft PR #852, and issue #804's body
(copy in `.llm/runs/beta11-cli--orchestrator/issue-bodies.md`).

## Task

Verify, running gates YOURSELF (cwd `/home/codex/repos/wt-g9-804`):
- `--dry-run` performs ZERO filesystem writes across ALL plugin add verbs — re-run the temp-dir
  regression tests; adversarially probe at least one verb yourself (run the in-tree CLI with
  --dry-run in a scratch dir under /tmp and diff the tree before/after).
- Printed plan matches what a real run writes (plan/real parity assertions).
- Sibling audit complete: workers, sagas, triggers, streams all covered.
- The new PUBLIC export `applyScaffoldPlan` on `@netscript/plugin/cli`: JSDoc'd, no slow types —
  run `deno task doc:lint --root packages/plugin --pretty` and confirm the new symbol is clean.
- Re-run: full test dirs of the five touched roots + `deno task quality:scan`.

Write `/home/codex/repos/wt-g9-804/.llm/runs/beta11-cli--orchestrator/slices/g9-804-dryrun/evaluate.md`
from `.llm/harness/templates/evaluate.md`. Emit `PASS`/`FAIL_FIX`/`FAIL_RESCOPE`/`FAIL_DEBT`.
Do NOT commit, push, or modify any other file. End with the single verdict word on its own line.

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
