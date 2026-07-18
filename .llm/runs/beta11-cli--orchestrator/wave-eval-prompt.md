use harness. You are the WAVE-SCOPE evaluator for PR #860 (feat/desktop-frontend → main) of run
`beta11-cli--orchestrator` — a SEPARATE session from every generator and the supervisor. You are
an open model (qwen/qwen3.7-max) on the `formal_evaluation` lane. Each of the six groups already
has an individual IMPL-EVAL PASS; your job is the INTEGRATION-scope verdict the merge bar
records on #860.

## SKILL

Read `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`. Checkout:
`/home/codex/repos/wt-integration` (= the wave head). Context:
`.llm/runs/beta11-cli--orchestrator/phase-registry.md`, `plan.md` §Gate matrix,
`upstream-op-verify-decision.md` (+ the Option-A rescope), PR #860's body and the six sub-PR
trails.

## Task — integration altitude only (do not re-litigate group-scope verdicts)

Running gates YOURSELF (cwd `/home/codex/repos/wt-integration`):
- Cross-group coherence: `deno task quality:scan` and `deno task arch:check` on the merged tree
  (exit 0, no NEW findings vs the recorded baselines); uniform exact-pin @netscript ranges
  (grep for `@\^0.0.1-beta` — zero hits).
- Cross-surface seams: run the SDK, Fresh, fresh-ui, and aspire FULL test dirs on the merged
  tree (group tests passed on branches; you prove they still pass TOGETHER).
- The #841→#456 URL-parity test and the #842 consumer fixtures on the merged tree.
- Scoped check wrappers over packages/{sdk,fresh,fresh-ui,aspire} and the CLI e2e root.
- Honesty spot-check: the wave PR's limitation paragraph matches reality (the e2e workflow's
  non-blocking step + #859 + denoland/deno#36150 all exist as claimed).
- Do NOT run scaffold.runtime yourself (CI's scaffold-runtime lane on #860 is the runtime
  verdict; note it as CI-owned).

Write `.llm/runs/beta11-cli--orchestrator/wave-evaluate.md` (this checkout) from the evaluate
template. Emit `PASS`/`FAIL_FIX`/`FAIL_RESCOPE`/`FAIL_DEBT`. Do NOT commit/push/modify other
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
