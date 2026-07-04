# Research — Agentic Workflow Doctrine V3

Status: IN PROGRESS (Opus research lanes launched 2026-07-04; findings land here).

## Bootstrap findings

- F1: `.gitignore` excludes `.llm/tmp/` entirely → v2 run dirs are invisible on GitHub. V3 must
  relocate run dirs to a tracked path (`.llm/runs/`) for mobile review + committed `workflow.js`.
- F2: Doctrine proposal = issue **#306** ([S5] Harness + skills revamp): lane-policy.md (surface +
  model bindings, generator≠evaluator-session as the invariant), hard gates (e2e-cli-prod,
  scaffold.runtime, release-gate class), delete `.llm/harness/profiles/sagas|triggers/**` (12 stale
  files), rewrite ARCHETYPE-5 to thin-plugin model, scrub Copilot/Augment residue, fold JSR/OpenHands
  gotchas into skills, tooling.md + agentic task aliases, arch-debt reconcile, frontmatter fixes.
- F3: #387 (open, `status:triage`): gate issue closure on verified acceptance — V3's stage-label +
  DoD + closing-keyword mechanics are the enforcement surface.
- F4: gh CLI is WSL-only here (`wsl -u codex bash -lc`, neutral cwd); Windows PATH has no gh.
  Repo slug is `rickylabs/netscript`.

## Lanes

- R1 (Opus): repo inventory — skills, `.llm/tools/**`, `.llm/harness/**`, commits.md references,
  stale/duplicate candidates, hardcoded `.llm/tmp/run` paths.
- R2 (Opus): GitHub-state — #306/#305/#387 full threads, labels.yml status taxonomy fit, recent-PR
  label usage, open issues V3 should absorb.
