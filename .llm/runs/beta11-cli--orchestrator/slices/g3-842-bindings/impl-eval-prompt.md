use harness. You are the IMPL-EVAL evaluator for group G3 (#842) of run
`beta11-cli--orchestrator` — a SEPARATE session from the generator (Codex Sol·high thread
019f7235-e4ac…) and the supervisor (Fable 5). You are an open model (qwen/qwen3.7-max) on the
`formal_evaluation` lane.

## SKILL

Read: `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`; group run dir
`/home/codex/repos/wt-g3-842/.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/`
(plan D1–D16); commits `a77b210c`, `71efb789`, `007f2be2` in worktree
`/home/codex/repos/wt-g3-842`; the draft sub-PR (branch feat/desktop-frontend-842-bindings)
comments; issue #842 body (copy in `.llm/runs/beta11-cli--orchestrator/issue-bodies.md`).

## Task

Verify at implementation altitude, running gates YOURSELF (cwd `/home/codex/repos/wt-g3-842`):
- D7 no-cast bar: the port is structurally assigned to oRPC's `SupportedMessagePort` with zero
  compatibility casts — grep the desktop surfaces for `as unknown as` / `as any` /
  `deno-lint-ignore` yourself.
- Issue #842 acceptance box 1: typed round-trip incl. `{name,message,stack}` error mapping +
  Uint8Array payloads + per-window isolation — confirm each has a real test.
- Box 2: browser/Aspire no-op parity (zero side effects) + jsr rubric on BOTH new surfaces
  (`@netscript/sdk/desktop`, `@netscript/fresh/desktop`).
- The Closes-#842 claim: verify both live boxes are genuinely covered IN THIS PR (the #457
  deploy-e2e is explicitly out — confirm no false claim).
- Re-run: full `packages/sdk/tests/`, the full Fresh test task, `deno task quality:scan`,
  `deno task doc:lint --root packages/sdk --pretty` and `--root packages/fresh` (new
  entrypoints zero-diagnostic), and spot `deno doc` both subpaths. No text/JSON import
  attributes anywhere in the new surfaces.

Write `/home/codex/repos/wt-g3-842/.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/evaluate.md`
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
