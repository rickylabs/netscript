use harness. You are the G7 implementation agent (Codex · GPT-5.6 Sol · medium,
`normal_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-cli`, `netscript-tools`, `netscript-pr`,
`codex-wsl-remote` (native-path law for e2e). Read `.llm/harness/workflow/run-loop.md`. Nested
run dir: `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/` (create from templates). Full
nested run-loop: research.md + plan.md + Design checkpoint FIRST, then STOP for the group
Plan-Gate. No implementation before PASS.

## Task — issue #457 (Option-A re-scope): native-first thin-client deploy-e2e

Branch `feat/desktop-frontend-457-e2e` off integration `feat/desktop-frontend` (this worktree is
on it — base contains #452 generator, #841 SDK seam, #842 bindings, #456 packaging+release
server; consume them all). Draft sub-PR targets `feat/desktop-frontend`; **`Refs #457`** until
the gates actually run green (false-closed-checkbox discipline — the `gate:e2e` box is checked
ONLY when the gate ran green), labels `type:test,area:cli,gate:e2e,wave:v1,priority:p2,status:plan`,
milestone `0.0.1-beta.11`. Read live issue #457 (both amendment sections; Option-A operative)
and #393/#394 (the deploy-e2e harness pattern this extends).

Scope (Option A): extend the deploy-e2e harness with the native-first thin-client target:
install from native formats (Linux pkg in CI; Win MSI on the OWNER's Windows host — you build
the suite + document the invocation, you do NOT claim the Windows run; macOS best-effort) →
auto-update apply + failed-launch rollback proof on Linux via native `Deno.autoUpdate` against
the #456 release server → Windows staged-detection + manual-update path proof (suite code +
fixture; execution owner-hosted) → remote-services discovery smoke (window against
remote-configured `services__*` URLs).

CRITICAL honesty rules: platform legs you cannot execute in this environment are delivered as
runnable suite code + documented invocation + `NOT_RUN` status — never a green claim. The Linux
leg SHOULD run here (native WSL) — run it for real. Gates: suite runs green where executable;
`quality:scan` + `arch:check`; FULL test dirs of touched roots.

## Method

Per-slice: commit → push (`git push origin HEAD:refs/heads/feat/desktop-frontend-457-e2e`) → PR
comment with gate evidence → pause for Tier-A review between slices. Do NOT dispatch
evaluators/reviews yourself. Do NOT merge anything.

## Stop-lines (HARD — read twice)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
