use harness. You are the IMPL-EVAL evaluator for group G7 (#457) of run
`beta11-cli--orchestrator` — a SEPARATE session from the generator (Codex Sol·medium thread
019f7289-dbc1…) and the supervisor (Fable 5). You are an open model (qwen/qwen3.7-max) on the
`formal_evaluation` lane.

CONTEXT: the real Linux leg produced an HONEST FAIL — upstream Deno 2.9.3 deletes
`op_desktop_verify_ed25519` at bootstrap (verdict in
`/home/codex/repos/wt-g6-456/.llm/runs/beta11-cli--orchestrator/slices/g6-456-packaging/op-verify-investigation.md`).
You are evaluating the SUITE's correctness and honesty, not requiring a green product gate.

## SKILL

Read: `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`; group run dir
`/home/codex/repos/wt-g7-457/.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/` (plan
D1–D19); commits `4ccfac47`, `097327b1`, `bd3ba218` in worktree `/home/codex/repos/wt-g7-457`;
the draft sub-PR (branch feat/desktop-frontend-457-e2e, `Refs #457`); issue #457 body (copy in
`.llm/runs/beta11-cli--orchestrator/issue-bodies.md`).

## Task

Verify, running what YOU can (cwd `/home/codex/repos/wt-g7-457`):
- The truthfulness machinery: platform-gated NOT_RUN evidence shape (run the gate-runner/
  suite-runner tests), the EXPECTED_FAIL preflight behavior, and that NOTHING upgrades the
  portable fixture result into a native-window claim.
- The Linux FAIL is structured and evidence-backed (inspect the recorded evidence shape in the
  suite source; the actual run's evidence.json lives in .llm/tmp — verify the suite writes it).
- Fixture purity: only #841's seam and #842's public RPC surfaces; exact discovery key;
  production #456 signing path; no direct Deno.autoUpdate.
- Owner-runnable Windows/macOS invocations are documented; the gate:e2e box on #457 is NOT
  checked anywhere (false-closed-checkbox discipline).
- Re-run: FULL e2e package test dir + `deno task quality:scan`. Do NOT run the native suite
  itself (the recorded FAIL stands as the true outcome).

Write `/home/codex/repos/wt-g7-457/.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/evaluate.md`
from the template. Emit `PASS`/`FAIL_FIX`/`FAIL_RESCOPE`/`FAIL_DEBT` — judging the slice (the
suite + honesty), with the product gap recorded as exactly that. Do NOT commit/push/modify other
files. End with the single verdict word on its own line.

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
