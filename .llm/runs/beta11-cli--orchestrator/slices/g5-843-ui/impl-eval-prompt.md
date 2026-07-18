use harness. You are the IMPL-EVAL evaluator for group G5 (#843) of run
`beta11-cli--orchestrator` — a SEPARATE session from the generator (Codex Sol·medium thread
019f7282-c03b…) and the supervisor (Fable 5). You are an open model (qwen/qwen3.7-max) on the
`formal_evaluation` lane.

## SKILL

Read: `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`; group run dir
`/home/codex/repos/wt-g5-843/.llm/runs/beta11-cli--orchestrator/slices/g5-843-ui/` (plan
D1–D9); commits `bde4fe50`, `cb56bf02`, `bdc96da1`, `a5093652` in worktree
`/home/codex/repos/wt-g5-843`; the draft sub-PR (branch feat/desktop-frontend-843-ui,
`Refs #843` — verify NO closing keyword, the desktop-smoke box is #457's); issue #843 body
(copy in `.llm/runs/beta11-cli--orchestrator/issue-bodies.md`).

## Task

Verify at implementation altitude, running gates YOURSELF (cwd `/home/codex/repos/wt-g5-843`):
- POC gating pattern: local structural types only — grep the new fresh-ui desktop surfaces for
  `any`, ambient augmentation (`declare global`), casts, lint-ignores (all must be absent).
- D6: the update prompt consumes #841's discriminated ready event exhaustively (automatic +
  manual arms, manual renders `manualUpdateUrl`).
- Web-mode inertness: components render + no-op cleanly in browser/Aspire/SSR (run the tests).
- L2 authority chain: token-only styling, generated-copy parity (run the registry test dirs).
- jsr rubric on the new fresh-ui surface (`deno task doc:lint --root packages/fresh-ui --pretty`
  + publish dry-run); no text/JSON import attributes.
- Re-run: FULL `packages/fresh-ui/tests`, registry test dirs, `deno task quality:scan`. Do NOT
  re-run the expensive scaffold.runtime suite (its 60/60 evidence stands; note it as
  generator-evidenced).

Write `/home/codex/repos/wt-g5-843/.llm/runs/beta11-cli--orchestrator/slices/g5-843-ui/evaluate.md`
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
