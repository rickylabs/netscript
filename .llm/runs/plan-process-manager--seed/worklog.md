# Worklog — plan-process-manager--seed

Seed run (planning-only). Stage contracts per `.llm/harness/workflow/seed-run.md`.

## Stage A — Bootstrap (2026-07-06)

- Worktree `.llm/tmp/wt-process-manager` created off `origin/main` @ `317e4b50` (the beta.5 cut).
- `supervisor.md` written first; `charter.md` captures the owner ask.
- Draft PR: **#504** (https://github.com/rickylabs/netscript/pull/504), opened draft, charter
  read-back comment posted. Push route = bundle → WSL clone `~/repos/netscript-harness-v3`
  (Windows git has no GitHub creds).
- Board snapshot: #327 OPEN (beta.5); #337–#344 CLOSED; open deploy scope #345/#346/#348 +
  WATCH #349/#350 + desktop #451–#458.

## Stage B — Discovery corpus (2026-07-06)

- Tier-C dynamic Workflow `wf_8ef59eb5-cd6` (Sonnet-5 high ×8, script committed FIRST at
  `workflows/stage-b-discovery-workflow.js`, commit `102907e5`): **8/8 topics returned, 0 errors**
  (~972k sub-agent tokens, 319 tool calls, ~13 min wall).
- Corpus: `research/r1..r4` (repo seams: plugin architecture, deploy bare-metal, runtime/process,
  docs/scaffold/desktop) + `research/m1..m4` (market: pup, pm2, Servy/systemd-native, 2026
  landscape + Deno 2.9 desktop). Sizes 22–38 KB each; every claim cited.
- Aggregates: 25 drift candidates + 36 open questions → `research/stage-b-ledger.md`.
- Corpus index + headlines → `research.md`.
- Load-bearing findings for Stage C: Archetype 7 anticipates this plugin as its missing bare-metal
  core; zero NetScript-owned supervision logic exists anywhere; registered
  windows-service/linux-service deploy targets are CLI-unreachable; pm2 god-daemon = documented
  anti-pattern; Deno-native PM niche uncontested in 2026; Windows gaps (no unix sockets #10244,
  restricted signals #28081, no OTEL subprocess coverage #32752) constrain the control-plane
  design.

## Stage C — Synthesis (2026-07-06)

- Tier-A supervisor read the FULL corpus (r1–r4, m1–m4) + the stage-b ledger verbatim; synthesis
  appended to `research.md` (§C1–C7).
- Highest-leverage fork resolved: **mode-split hybrid** — supervision engine as a library
  (foreground-attached in `--no-aspire` dev), OS supervisor of record in production
  (generator-to-native units, Quadlet precedent), and the pm's resident prod component is a
  control-plane service that is itself one more OS-supervised sibling unit (never a parent of the
  workload) → structurally eliminates the pm2 god-daemon failure mode.
- 13 supervisor-resolved decisions (S1–S13): workers-analog single fat core, zero new contribution
  axes, KV-backed registry port (not tursodb), oRPC-over-loopback as the one control transport,
  `netscript.process` telemetry domain + user-space subprocess spans, concrete-argv process specs
  with descendant-tree kill, pm2 restart-strategy floor + pup block/unblock, composable start
  policies, typed dependency-ordered process graph extending `deployTargetBaseShape`, conventions
  lift-as-is, designed-for Windows asymmetry, binding anti-feature list, docs scope incl.
  cli-reference staleness fix.
- 7 numbered owner-forks posed (OF-1..7): CLI group, console delivery, #345 re-scope, dead-target
  wiring precursor, clustering deferral, launchd out-of-scope, naming.
- Ledger triage complete: 25/25 drift candidates verdicted (§C4; new drift.md entry 4), 36/36 open
  questions routed (§C5: resolved / owner-fork / Stage-D pack).
- 5 Stage-D deep-dive packs named with scope + inputs (§C6): D1 supervision engine + core, D2
  control plane + contract, D3 deploy-lane integration + OS adapters, D4 CLI + admin console
  surfaces, D5 config contract + scaffold + docs.
- Scope guards recorded (§C7): not a prod restart-mechanics reimplementation, not a deploy system,
  not a monitoring product, not a prod LB, not a milestone-1 cluster orchestrator.
