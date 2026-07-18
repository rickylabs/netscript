use harness. You are the G4 implementation agent (Codex · GPT-5.6 Sol · medium,
`normal_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-tools`,
`netscript-cli`, `jsr-audit`. Read `.llm/harness/workflow/run-loop.md`. Nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g4-452-generator/` (create from templates). Full
nested run-loop: research.md + plan.md + Design checkpoint FIRST, then STOP and signal the
supervisor (PR comment `Plan & Design — READY FOR REVIEW`); no implementation slice before the
group Plan-Gate PASS.

## Task — issue #452: first-party `deno desktop` app type in the Aspire generator (folds #375)

Branch `feat/desktop-frontend-452-generator` off integration branch `feat/desktop-frontend`.
Draft sub-PR targets `feat/desktop-frontend`, body carries `Closes #452` AND `Closes #375` (the
fold), labels `type:feat,area:cli,area:aspire,wave:v1,priority:p2,status:plan`, milestone
`0.0.1-beta.11`. Read live issue #452 including BOTH amendment sections (RFC #820 + Option-A).

Scope: 4th `desktop` branch in
`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` beside
`app`/`tauri`/`task` (extend the in-tree `buildTauriBlock` pattern); extend the PUBLIC
`@netscript/aspire` `./types` surface (`AppType`/`AppEntry` gain `"desktop"`); PLUS the
single-artifact packaging hook consumed by #456 (native-format pipeline).

Acceptance (each maps to a #375-evidenced POC finding — every one is a gate):
1. Build-order gate baked in — desktop registration `waitFor`/`predev` the Fresh build so
   `_fresh/` exists before packaging (no hand-edit).
2. `--backend cef` emitted (WebView2 default broken on Windows bare-metal; `desktop.backend`
   config silently ignored upstream). CEF, not config.
3. Service-discovery injection (`services__<name>__http__0`) like `app`, but NO
   `withHttpEndpoint` (window binds its own internal `Deno.serve` port).
4. Opt-in gating (`Enabled:false` default); random internal `127.0.0.1` port.
5. Generator unit tests mirroring `generators-*_test.ts`; `scaffold.plugins`/`scaffold.runtime`
   unaffected for non-desktop configs.
Public-surface change → full jsr rubric + consumer-compile gate + `quality:scan` + `arch:check`
per slice. No `any`, no new lint-ignores.

## Method

Per-slice: commit → push (`git push origin HEAD:refs/heads/feat/desktop-frontend-452-generator`)
→ PR comment with scope, hash, gate evidence → update slice worklog. Do NOT dispatch
evaluators/reviews yourself. Do NOT merge anything.

## Stop-lines (HARD — read twice)

1. NO merge to `main` for any PR without BOTH CI green AND an opposite-family eval PASS recorded
   on the PR, and merge authorization per the harness flow.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
