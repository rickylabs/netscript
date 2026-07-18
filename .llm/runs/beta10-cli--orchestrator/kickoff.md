# Kickoff — beta.10 CLI + stabilization orchestrator (your first turn)

use harness

## SKILL

- netscript-harness
- netscript-cli
- netscript-tools
- netscript-deno-toolchain
- netscript-pr

You are the **beta.10 orchestrator** for NetScript milestone 12. Fable 5 is restored as the default
orchestrator (PR #784, merged). You are `planning_decisions` = **Claude · Fable 5 · low**. You
**coordinate; you do not implement** — framework source is WSL Codex, driven through the agentic
suite; evaluation is a separate opposite-family session.

Read, in order, before acting:

1. `AGENTS.md` + `CLAUDE.md`
2. `.agents/skills/netscript-harness/SKILL.md`, then `.llm/harness/workflow/activation.md` +
   `run-loop.md`
3. `.llm/harness/workflow/lane-policy.md` — the routing you enforce (Fable 5 restored 2026-07-16)
4. `.llm/runs/beta10-cli--orchestrator/supervisor.md` — your identity, routing, and scope

## Mission

Land **beta.10 = complete CLI coverage + bugfixes/stabilization**. The **Dev Dashboard is PAUSED**
and moved to `0.0.1-beta.13` — do not touch dashboard issues (#400/#410–#557/#734) or the parked
dashboard PRs (#780/#778/#775).

Scope, priority order:

1. **#769 (p0 release-blocker)** — `netscript agent init` writes an unversioned `jsr:@netscript/cli`
   MCP config that cannot resolve. Fix is on **PR #770**. Verify it, run the CLI E2E gate, drive to
   merge-ready, and surface the go/no-go to the owner.
2. **Stabilization** — #763 (prod scaffold AI lifecycle fail), #762 (repo-wide ts-ignore sweep →
   CI-blocking, PR #772), #774 (integration-branch CI gap), #773 (`render_ui` recursion hole), #781
   (beta.9 Aspire generator regressions), #782 (Preact Windows dedupe), #783 (fresh-ui markdown
   render).
3. **Epic #721 agentic-combo CLI** — S1–S9 = #725–#733 (packages/mcp skeleton → docs tools →
   telemetry/trace tools → doctor aggregation → CLI trigger tools → `netscript agent mcp`/`init` →
   public skills → docs/JSR audit). Umbrella PR #715.

## How you operate (mandatory)

- Everything runs on the **epic #574 agentic runtime**. Drive Codex/OpenHands/PR lifecycle **only**
  through `deno task agentic:*` — `agentic:launch-codex-slice`, `agentic:codex-resume/status/watch`,
  `agentic:gh-pr`, `agentic:gh-watch`, `agentic:dispatch-openhands`, `agentic:runtime`. **Never**
  ad-hoc `wsl.exe`/PowerShell.
- **Route every lane from `lane-policy.md`.** You = Fable 5 low. Implementation = Codex Sol
  medium/high via `launch-codex-slice`. Adversarial review of Codex work = Fable, opposite-family,
  effort-paired. Record requested-vs-observed identity in `worklog.md`.
- Every slice brief you write starts with `use harness` and a `## SKILL` section.
- **Gate law**: any `packages/**`/`plugins/**` slice runs `deno task quality:gate`; merge-readiness
  runs `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Use `.llm/tools/harness/watch-run.ts <run-dir>` (background) for token-free supervisor wake; do not
  poll.
- **Owner ratifies promotion.** Run autonomously through implementation → PR → evaluation → green CI,
  but **hold merge / publish / release / issue-close for explicit owner sign-off** over Remote
  Control.

## First actions

1. Bootstrap: read the files above; write the live fields in `supervisor.md` (your session id) and a
   `## Design` section in `worklog.md`; run `deno task agentic:runtime doctor` to confirm the Codex
   remote is healthy. Record route identity.
2. **p0 first**: pull **PR #770**, verify the #769 fix, run `deno task e2e:cli run scaffold.runtime
   --cleanup`, and report merge-readiness + your go/no-go recommendation to the owner.
3. Stand up **agentic-combo S1 (#725, packages/mcp skeleton)** as a Codex slice via
   `agentic:launch-codex-slice`, and dispatch its opposite-family evaluation.

Report status to the owner (me) over Remote Control and pause for sign-off before any
merge/publish/release.
