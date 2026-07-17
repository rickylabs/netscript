# Closure — RFC single deployment (issue #820) — design-record close per owner wrap-up directive

> **Post-closure amendment (2026-07-17, same day):** the owner re-opened the run for exactly the
> residual revision ("proceed with the revision I'll take care of the final eval myself").
> **plan.md rev 10** folds the surface classifications (residual 1 below) into §I.2/§E.2/§H; the
> cycle-10 eval is **owner-launched** (recipe in `context-pack.md` § "How the owner runs cycle
> 10"). The generator launches no further cycles; the #820 post + `drafts/` remain PASS-gated.
> This document otherwise stands as the cycle-1..9 record.

Run `rfc-single-deployment--orchestrator` · closed 2026-07-17 · generator Fable 5 · high, session
`7f1fada7-805f-46cb-8ac4-5eb201bdc105`. Owner directives: loop continuation authorized after the
cycle-2 escalation; loop bounded at cycle 9 ("one more pass then done").

## Outcome

**9 adversarial PLAN-EVAL cycles (Sol·max, all separate sessions), monotonically converging; the
final verdict is FAIL_PLAN with 6 of 8 plan-gate boxes PASS** — including, for the first time,
**"Decisions locked"**, plus board adjustments, risk register, gate set, deferred scope, and the
research content itself. Per the kickoff's hard gate, the RFC was **NOT posted to #820** and the
`drafts/` were **not written** (both were PASS-gated). **Zero board mutations occurred at any
point** — evaluator-audited in every cycle.

## What stands (evaluator-confirmed sound across the final cycles)

- **PM-first sequencing** (§A): the Tier-4 split keeping the PM-independent single-runtime lane
  (#451/#453/#454/#455 + #452/#456a/#457a) complete in beta.11 while singleton-graph work
  consumes the beta.12 PM engine in beta.13 — repeatedly endorsed as "sound, avoids
  over-blocking".
- **Aspire-stack citizenship** (§B.4): generator-emitted `PackagingModel` → pure manifest
  compiler → the canonical `deploy build` verb + a named TS-AppHost publish pipeline step, all in
  SD-2; PM-20 stays pure extraction.
- **The installer** (§B): `DeployTargetPort` adapters + `MaintenancePort` (no rival axis), the
  §B.1a operation state machines (incl. deterministic four-state purge + §B.1b canonical
  machine-state root), the §B.3 identity/privilege matrix with updater least-privilege grants,
  and the §B.2a install-graph digest rule.
- **The update lifecycle** (§C): one journaled release-snapshot mechanism from beta.11 (real
  Windows apply; `Deno.autoUpdate` never the authority), crash-recoverable journal with migration
  barriers, `maintenance(rollback-failed)` terminal, replay high-water, pinned trust, and the
  §C.3b three-phase ownership that resolves boot-recovery composition.
- **Composition** (§D): both modes kept; typed manifests + the SD-7 cross-mode conformance suite
  as the anti-fork enforcement; transport seam scoped to transport only.
- **The draft board** (§E): 22 bounded, dependency-ordered drafts; G1–G8 exactly-one ownership;
  owner forks OF-A..OF-K.

## Residuals (the cycle-9 items — small)

1. **Public-vs-internal classification for three surfaces** (the only real design residual):
   PM-5's `RuntimeCommandSpec` additions (`clearEnv` + strip list), PM-15's renderer knobs, and
   SD-1's host-side supervisor/broker/proxy/Job-Object types. *Generator recommendation (non-
   normative, unevaluated):* PM-5 additions = public contract extension (rubric at PM-5); PM-15
   knobs = internal render config, classification re-decided at the PM-20 move; SD-1 host types =
   internal (only #451/SD-6 client surfaces are public).
2. **Resume-artifact metadata lag** — reconciled as part of this closure (context-pack,
   supervisor, worklog, drift now agree on the final state).

## Path to done (for a future session, if the owner wants the RFC posted)

One small rev folding residual 1 into §I.2/§E.2 + one PLAN-EVAL cycle would plausibly PASS; then
execute kickoff deliverable 5 (the #820 comment + `drafts/` files) and stage-H ratification of
OF-A..OF-K. Resume via `context-pack.md`; the eval launch recipe is `.llm/tmp/rfc820/
launch-eval.ts` + `plan-eval-brief.md` (route: Sol·max through the agentic app-server client).

## Handoff — beta-11 orchestrator spawned (final act of this run, 2026-07-17 ~23:35 UTC)

Owner directive: beta-11 is a go. Spawned the **beta-11 orchestrator** on the beta-10 pattern:

- **Kickoff:** `.llm/runs/beta11-cli--orchestrator/kickoff.md` — charter = milestone 13
  (`0.0.1-beta.11`, the re-prioritized board: Desktop Frontend epic #840 + #841/#842/#843 +
  re-scoped #452/#456/#457 + #826 + unified seed #824); skills, lane-policy routing, agentic-
  toolchain-only sub-agents, generator≠evaluator + Tier-A review; **hard stop-lines stated in
  the kickoff AND required verbatim in every sub-brief** (beta-8 breach lesson): no main-merge
  without CI-green + eval-PASS + authorization; HARD STOP before any release publish and before
  closing milestone 13 (owner in-turn sign-off only); #824 seed drafts-only. Codex-reset
  addendum included (routes unrestricted; 3 resets remain).
- **Launch:** tmux session `beta11-orch`, cwd `/home/codex/repos/netscript-beta10-cli`,
  `claude --model claude-fable-5 --effort low --permission-mode bypassPermissions
  --session-id 86d308d5-c761-4e5d-a41f-8be959bc46d2` with the verbatim-kickoff prompt; /rc
  enabled via tmux send-keys retry loop (link recorded in the worklog handoff row).
- **Context handed:** this run dir, PR #822 (rfc.md rev 13), #820, epic addenda, verified
  upstream facts.

## Record map

`plan.md` rev 9 (the RFC) · `research.md` (forensics + gaps + re-baseline + debt) ·
`plan-eval-cycle{1..9}.md` (verdict trail) · `escalation.md` (cycle-2 loop-limit stop) ·
`supervisor.md` / `worklog.md` / `context-pack.md` / `drift.md` (6 entries) · `corpus/`
(evidence) · session record `.llm/2026-07-17-rfc-single-deployment-run.md`.
