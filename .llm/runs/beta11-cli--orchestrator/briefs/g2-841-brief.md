use harness. You are the G2 implementation agent (Codex · GPT-5.6 Sol · high,
`complex_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-tools`,
`jsr-audit`, `netscript-deno-toolchain`. Read `.llm/harness/workflow/run-loop.md`. Nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g2-841-autoupdate/` (create from templates). This is a
NEW-FEATURE group: full nested run-loop — research.md + plan.md + Design checkpoint FIRST, then
STOP and signal the supervisor (PR comment `Plan & Design — READY FOR REVIEW`); the supervisor
runs your group Plan-Gate before you implement. No implementation slice before that PASS.

## Task — issue #841: SDK auto-update — typed wrapper over Deno.autoUpdate + release client

Branch `feat/desktop-frontend-841-autoupdate` off the integration branch `feat/desktop-frontend`.
Draft sub-PR targets `feat/desktop-frontend` (NOT main), body carries `Closes #841`, labels
`type:feat,area:sdk,wave:v1,priority:p1,status:plan`, milestone `0.0.1-beta.11`. Read the live
issue body #841 and epic #840 for the owner-ratified Option-A framing; design source is PR #822
(rfc.md) + `.llm/runs/rfc-single-deployment--orchestrator/plan.md` (rev 10).

Core requirements (from the issue):
- Typed options/callbacks (`onUpdateReady`/`onRollback`), per-arch URL wiring
  (`Deno.build.os + arch`), check-on-launch + interval policies, release-channel config, Ed25519
  `publicKey` pinning from app config.
- The wrapper is a SEAM isolating upstream churn (`Deno.desktop` namespace, denoland/deno#35939):
  apps consume our API, never the moving global. Feature-detect via local structural types — no
  `any`, no ambient augmentation; no-op under plain `deno run` (`Deno.desktopVersion === null`).
- Windows honesty: detect staged-but-not-applied (denoland/deno#35269) and surface a
  manual-update UX path; structure so the wrapper flips to full auto when upstream ships apply.
- `onRollback` reported through NetScript telemetry.
- Locked decision: #841 is the ONLY consumer-facing update seam in the framework.

Gates (issue acceptance): wrapper unit tests incl. `deno run` no-op and staged-Windows path; jsr
rubric on the new SDK surface (publishable, no slow types, NO text imports — string constants
doctrine); consumer-compile; `quality:scan` + `arch:check` per slice. The e2e apply/rollback proof
belongs to #457 — reference it, do not build it here.

## Method

Per-slice: commit → push (`git push origin HEAD:refs/heads/feat/desktop-frontend-841-autoupdate`)
→ PR comment with scope, hash, gate evidence → update your slice worklog. Scoped wrappers only
for check/lint/fmt evidence. Do NOT dispatch evaluators/reviews yourself (supervisor triggers
all). Do NOT merge anything. `deno doc` before broad source reads.

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
