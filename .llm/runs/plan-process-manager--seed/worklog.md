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

## Stage D — Deep-dive design packs (2026-07-06)

- Tier B: 5 Opus 4.8 general-purpose sub-agents launched in parallel, one per §C6 pack, each with a
  binding brief (S1–S13/C7 verbatim, OF recommendations, read order, single-output-file constraint,
  no git/gh/board mutation). All 5 returned (~520k sub-agent tokens). Packs landed in
  `research/design/`: d1 (653 lines), d2 (599), d3 (534), d4 (483), d5 (604) — Σ2873 lines, every
  non-obvious claim cited to file:line / corpus § / URL.
- **Slice review gate (A1): Tier-A supervisor read all five packs in full.** Verdict: high quality,
  evidence-backed, S/C7-compliant across the board. Highlights per pack:
  - **D1** — lean `Deno.Command`-native runner (rejects dax shell-templating as re-importing pup#33)
    while reusing `RuntimeCommandSpec`/argv builders/`buildEnvironment()` trace injection/
    `ShutdownManager`; cron via standalone `@netscript/cron` `createScheduler()` (workers
    `SchedulerPort` is a job-enqueue contract, not a cron evaluator — triggers-core precedent);
    capability category verdict: reuse `background-processor` (CLI enum has no `infrastructure`
    category) + `infrastructureRequires: ['kv']`; Process/Instance split reserved for OF-5; pure
    `nextDelay()` restart-controller; OS-compile-vs-engine-enforce table. 11 slices.
  - **D2** — contract modeled on the workers seam (spread `BASE_PLUGIN_CONTRACT_ROUTES`,
    `satisfies`, no erasure cast); async `accepted`-style lifecycle actions; KV-watch =
    server-internal optimization, client contract invariant (`eventIterator` streams);
    opaque zero-dep bearer tokens (lean) over JWT; secrets via 0o600 secrets-convention;
    pm2-OTEL re-check verdict SAFE with citations (only proprietary paid @pm2/io; Prometheus =
    third-party) — differentiator claim may be asserted unhedged; control-plane OWN RSS as
    anti-god-daemon NFR gauge; refines S5: do NOT mint `netscript.service.instance` (TC-5 reuses
    OTEL semconv verbatim). 7 slices.
  - **D3** — no new target key: pm = the wired implementation behind reserved
    `linux-service`/`windows-service`; independently shippable OF-4 precursor slice (D3-S1) fully
    specified with acceptance/tests; NEW finding: `resolveTargetConfig` registry-key vs
    config-member mismatch → **drift entry 5**; renderer differentiator = typed opt-in knobs on the
    existing `renderSystemdUnit` (Type=notify/WatchdogSec/HARDENING_BASELINE/DynamicUser/cgroups);
    pure-Deno sd_notify with '@' abstract-namespace as explicit spike (D3-S3a); `OsServicePort`
    stays 2-method + optional capability-descriptor sibling; `--user`+linger deferred; F-DEPLOY
    promotion conditional on real core-package extraction; #345 re-scope draft for Stage H. 7 slices.
  - **D4** — `netscript pm` = cliffy Archetype-6 router mirroring deploy-group; 19-verb parity map
    with CP-down degraded execution per verb; dropped pm2-isms recorded (deploy/link/save/scale;
    startup→enable-service); `pm dev` = plain foreground multiplexer (rich view = `pm monitor`);
    console = ONE Fresh app, browser-served ships FIRST, desktop CEF-forced via #E6 soft dep,
    embedded panel third; DDX-17 host-agnosticism verdict UNVERIFIED → spec'd CR-DDX-HOSTAGNOSTIC
    change request to #400 (standalone path never blocks on it); CommandInvokePort = bidirectional
    first-definer edge, default dashboard-defines-first; landscape tails verified (deno-desktop
    comparison page CITE; dokku DROP; pmc/oxmgr CITE-with-caveat — Deno-native niche uncontested).
    8 slices.
  - **D5** — two-layer schema (portable ProcessGraphShape/ProcessSpecShape + deploy-facing schema
    spreading `deployTargetBaseShape`); `instances` placeholder hard-errors >1 (no fake cluster);
    four-tier `--no-aspire` resolver precedence with concrete field map (workers
    `dependencies:["streams"]` proves the ordered graph resolves from shipped metadata);
    `plugin add` emits typesafe `pm.config.ts` glue only, pre-seeded by running resolvers once
    (#157 law); 7-page docs wave incl. cli-reference staleness fix same-wave; RFC epic skeleton +
    normalized ISSUE-DRAFT template (netscript-pr conformant). 6 slices.
- **Cross-pack reconciliation items for Stage E** (recorded here so plan lock owns them):
  1. **Target-key conflict (REAL, must resolve):** D3 §D3.1.1 = no new key, implement behind
     `linux-service`/`windows-service`; D5 §1.4 assumes a NEW `process-manager` key. D3 owns the
     target-key taxonomy per §C5 routing → Stage E resolves per D3; D5-2 acceptance updates
     accordingly (D5 itself flags this in its residual q2).
  2. **State-vocabulary divergence:** D1's instance FSM
     (idle/starting/running/crashed/backoff-wait/blocked/unhealthy/stopped) vs D2's `ProcessState`
     (pending/starting/running/degraded/restarting/blocked/stopped/exited/crash-looped). One
     vocabulary must be locked at Stage E; D1 owns the FSM, D2's wire enum maps onto it.
  3. **Restart-policy default numbers:** S7 binding = pm2 floor (double-to-cap-**15000**,
     reset-after-**30s** stable); D1 encodes that; D5's sketch says maxMs 30000 /
     resetAfterStableMs 10000 / initialMs 1000. Stage E locks the S7 numbers; D5 schema defaults
     follow D1.
  4. **Route naming:** D4's verb map references a generic `invokeCommand{...}` route; D2's contract
     has explicit `start`/`stop`/`restart`/… routes. Stage E unifies: D2's explicit routes are the
     contract; the shared `CommandInvokePort` (D4 §5.3) is the port-level adapter both epics bind.
  5. **Renderer-extension boundary:** D1-S11 (thin systemd/servy compile adapters in the core) vs
     D3-S2 (renderer knob extension in `packages/cli` kernel). Complementary, but Stage E draws the
     package boundary explicitly (who imports whom) alongside D3's residual q2
     (core-package extraction scope).
  6. **Telemetry refinement accepted:** D2's "no `netscript.service.instance` domain" refines S5's
     parenthetical — accepted at review; carried as D2 residual q7 (confirm with telemetry T2 owner).
  7. **Cross-epic items to carry into plan.md:** CR-DDX-HOSTAGNOSTIC (change request to #400);
     CommandInvokePort bidirectional first-definer edge; #E6/#E1 soft deps; fresh-ui L3-blocks
     sequencing; #327 body absent from `context/adjacent-issues.jsonl` → Stage E fetches the live
     epic body/milestone before the train is locked.
- Residual open questions carried to Stage E: D1×6, D2×8, D3×7, D4×7, D5×6 (34 total; several
  overlap and will collapse in plan.md).
- Slice inventory available to Stage E: 11 (D1) + 7 (D2) + 7 (D3) + 8 (D4) + 6 (D5) = **39
  candidate slices** to consolidate into the plan DAG.
