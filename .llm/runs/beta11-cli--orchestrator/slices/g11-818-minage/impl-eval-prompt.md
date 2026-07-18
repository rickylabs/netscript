use harness. You are the IMPL-EVAL evaluator for group G11 (#818) of run
`beta11-cli--orchestrator` — a SEPARATE session from the generator (Codex Sol·medium thread
019f7282-f535…) and the supervisor (Fable 5). You are an open model (qwen/qwen3.7-max) on the
`formal_evaluation` lane.

## SKILL

Read: `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`; group run dir
`/home/codex/repos/wt-g11-818/.llm/runs/beta11-cli--orchestrator/slices/g11-818-minage/`
(research findings 1–10 are load-bearing — spot-check finding 1's config-key claim yourself);
commits `af9e0181`, `5ad34dee`, `12d2c120` in worktree `/home/codex/repos/wt-g11-818`; the
draft PR (branch fix/818-min-dep-age-lockstep, `Closes #818`); issue #818 body (copy in
`.llm/runs/beta11-cli--orchestrator/issue-bodies.md`).

## Task

Verify at implementation altitude, running gates YOURSELF (cwd `/home/codex/repos/wt-g11-818`):
- The supply-chain protection is NEVER blanket-disabled: grep the diff for
  `--minimum-dependency-age` and `minimumDependencyAge` — every occurrence must be either the
  scoped object form with exact-version `@netscript` excludes, or e2e-harness-internal
  (pre-existing). Third-party dispatch must remain byte-for-byte `deno x`.
- Scaffold emission is JSR-mode-only (local-source scaffolds carry no policy) — run the
  generator tests.
- Lockstep-only scoping: explicitly-versioned first-party and third-party packages stay
  protected — run the dispatch tests and verify the specifier-case matrix.
- The AI direct target and agent-init MCP argv changes match the #817-proven path.
- Re-run: FULL test dirs of touched features + `deno task quality:scan` + a live config parse
  probe of the emitted minimumDependencyAge object on this Deno version.

Write `/home/codex/repos/wt-g11-818/.llm/runs/beta11-cli--orchestrator/slices/g11-818-minage/evaluate.md`
from the template. Emit `PASS`/`FAIL_FIX`/`FAIL_RESCOPE`/`FAIL_DEBT`. Do NOT commit/push/modify
other files. End with the single verdict word on its own line.

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
