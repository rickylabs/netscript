use harness. You are the IMPL-EVAL evaluator for group G10 (#802) of run
`beta11-cli--orchestrator` — a SEPARATE session from the generator (Codex Sol·low thread
019f722c-9a35…) and the supervisor (Fable 5). You are an open model (qwen/qwen3.7-max) on the
`formal_evaluation` lane.

## SKILL

Read: `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`,
group run dir `/home/codex/repos/wt-g10-802/.llm/runs/beta11-cli--orchestrator/slices/g10-802-help/`
(note the locked option-(b) decision + rationale), commit `bffeeae5` in worktree
`/home/codex/repos/wt-g10-802`, draft PR #851, issue #802 body (copy in
`.llm/runs/beta11-cli--orchestrator/issue-bodies.md`).

## Task

Verify, running gates YOURSELF (cwd `/home/codex/repos/wt-g10-802`):
- No phantom `ns-<plugin>` usage remains in any plugin CLI source: run your own
  `grep -rn "ns-workers\|ns-sagas\|ns-triggers\|ns-streams" plugins/*/src` and judge hits.
- The emitted `deno x -A jsr:@netscript/plugin-<x>@<version>/cli <verb>` form is actually the
  working invocation shape (cross-check against each plugin's deno.json exports — `/cli` must be
  a real export of each package).
- Streams was audited and legitimately needed no change (verify its usage strings yourself).
- Re-run: full test dirs for workers/sagas/triggers + `deno task quality:scan`.
- Help-output regression tests cover every touched command definition.

Write `/home/codex/repos/wt-g10-802/.llm/runs/beta11-cli--orchestrator/slices/g10-802-help/evaluate.md`
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
