use harness. You are the G5 implementation agent (Codex · GPT-5.6 Sol · medium,
`normal_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-tools`,
`jsr-audit`, `deno-fresh`, `fresh-ui-horizontal` (L0/theme/README authority chain). Read
`.llm/harness/workflow/run-loop.md`. Nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g5-843-ui/` (create from templates). Full nested
run-loop: research.md + plan.md + Design checkpoint FIRST, then STOP for the group Plan-Gate
(PR comment `Plan & Design — READY FOR REVIEW`). No implementation before PASS.

## Task — issue #843: fresh-ui desktop components — tray, menus, dialogs, notifications, window chrome

Branch `feat/desktop-frontend-843-ui` off integration `feat/desktop-frontend` (this worktree is
on it — the base contains #841's `@netscript/sdk/auto-update` seam and #842's
`@netscript/fresh/desktop` + `@netscript/sdk/desktop`; consume them). Draft sub-PR targets
`feat/desktop-frontend`; the issue's gate box references "desktop smoke via #457" → use
**`Refs #843`** (NO closing keyword; wave PR closes after #457), labels
`type:feat,area:fresh-ui,wave:v1,priority:p2,status:plan`, milestone `0.0.1-beta.11`. Read live
issue #843 + epic #840.

Scope (issue): dedicated `@netscript/fresh-ui` desktop components productizing the POC
`desktop-chrome.ts` pattern — feature-detect desktop globals via local structural types (no
`any`, no ambient augmentation, lint-clean in web builds): tray + menu components (declarative,
event-wired), native dialogs, notifications, window-chrome controls, desktop-gated islands
no-oping under browser/Aspire; update-UX building blocks consuming #841 ("update ready — restart
to apply" / Windows manual prompt via the discriminated ready event); docs page "building a
desktop frontend the NetScript way".

Gates: components render + no-op cleanly in web mode (tests); fresh-ui L2 conventions (the
fresh-ui authority chain — record any divergence in your drift.md, never improvise); jsr rubric
on the new fresh-ui surface; `quality:scan` + `arch:check` per slice; FULL test dirs; no
text/JSON import attributes. Desktop smoke stays #457's box — no false claim.

## Method

Per-slice: commit → push (`git push origin HEAD:refs/heads/feat/desktop-frontend-843-ui`) → PR
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
