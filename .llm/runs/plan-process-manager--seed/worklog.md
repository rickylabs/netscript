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

## Stage E — Plan lock (2026-07-06)

- Tier A supervisor authored `plan.md` directly (no delegation — plan lock is a supervisor
  deliverable per seed-run).
- **Live-board fetch (WSL gh, this session)** — the §C6 caveat (#327 body absent from
  `context/adjacent-issues.jsonl`) is resolved: #327 = OPEN, milestone **0.0.1-stable** (not
  beta.5; drift entry 1 confirmed and closed), full body captured incl. the TIER-4 desktop section
  and D1–D6 product decisions. Adjacents: #400 = beta.6 (41 open) · #451/#456 = beta.8 ·
  #345/#346/#348/#458 = stable · #349/#350 = Backlog/Triage · beta.7 currently 28 open.
  Consequences: dashboard-defines-first `CommandInvokePort` default HOLDS (beta.6 < M1 beta.7);
  #E6/#E1 soft-dep timing works for a beta.8 M2; #345 re-scope timing is safe (stable).
- **All 7 cross-pack reconciliation items resolved** as plan.md §2 decisions E1–E16:
  target-key per D3 (E1), state vocabulary (E2), restart defaults S7-locked (E3), route naming +
  `CommandInvokePort` (E4), renderer/package boundary = core extraction with CLI re-exports (E5,
  the largest structural call — Stage F directed to attack it), telemetry refinement (E15),
  cross-epic carries (plan.md §8).
- **34 residual questions → 4 remain open** (plan.md §9); the rest resolved by E1–E16 or absorbed
  into slice acceptance criteria.
- **39 candidate slices → 31 milestone-1 slices + 4 deferred** (PM-0..PM-35, plan.md §4) after 4
  merges (D1-S1+D5-1; D1-S10+D2-S1; D1-S4+D1-S5; D5-6+PMS-8) and extraction of the 3 board drafts
  to Stage-H items. `v1-min` wave marks the cuttable floor (19 slices).
- Milestone train (plan.md §5): PM-0 → beta.6-eligible; M1 → beta.7 (owner fork OF-9 may slide —
  beta.7 already carries 28 open); M2 (desktop + panel) → beta.8; M3 → stable converging with
  re-scoped #345.
- Owner-fork sweep now OF-1..9 (OF-8 CR-DDX-HOSTAGNOSTIC submission, OF-9 milestone loading added).
- Risk register R1–R10 (ledger constraints 21–25 + sd_notify spike + milestone load + cross-epic
  slips + E5 extraction risk + memory-poll latency), gate matrix (7 gates × archetype overlays),
  Stage-H one-shot filing plan recorded in plan.md §6/§7/§10.
- Next: Stage F adversarial review (unoriented, distinct model) attacks plan.md + packs; then
  Stage G PLAN-EVAL (OpenHands minimax-M3, separate session) — hard stop.

## Stage F — Adversarial review (2026-07-06)

- **Tier-D launch attempt (recorded, blocked):** brief validated (`use harness` + `## SKILL`),
  worktree `/home/codex/worktrees/pm-stage-f` @ `59b8e93d` (branch `review/pm-stage-f`, NO
  upstream), managed daemon 0.142.5, thread `019f36de-ef6d-7f33-80dc-bc3823cfe1af` — turn failed
  in 3.5s: **`usageLimitExceeded`** (ChatGPT credits; resets 2026-07-07 03:52; unblock needs
  USER). Drift entry 6; lane override recorded in `supervisor.md`.
- **Fallback reviewer dispatched:** OpenHands **qwen-3.7-max** (separate session, distinct from
  authoring lanes A/B/C and from Stage-G minimax-M3), PR-comment trigger on #504 (checks out the
  PR branch @ `59b8e93d`), iterations=600, verdict contract PASS / FAIL_FIX / FAIL_RESCOPE.
  Trigger comment: #issuecomment-4891518785. Unoriented brief = artifacts + attack surfaces, no
  supervisor framing; findings-only deliverable in the PR summary comment.
- Verdict watcher armed (`watch-openhands-verdict.ts`, 1h re-armable heartbeat).
- **Verdict landed** (Action run 28783668102 success; concurrency-cancelled sibling 28783678449
  expected): PR comment #issuecomment-4891678877, 2026-07-06T10:21:43Z —
  **`OPENHANDS_VERDICT: PASS`, 18 findings: 0 blockers, 4 major, 14 minor.**
- **Supervisor triage complete** — full per-finding disposition table in
  `stage-f-adversarial.md`. Score: 13 accepted (fixes applied to plan.md), 2 rejected-with-
  rationale (F-1 stale read — PM-0 already carried the drift-5 fix; F-13 no-change), 3 notes.
  Substantive outcomes:
  - **F-3 (major, accepted):** E5 extraction re-homed from `plugin-process-manager-core` to
    **`packages/deploy-core`** — the ARCHETYPE-7-anticipated package — killing the ownership
    inversion (future deploy wave inherits, never imports from, pm). PM-20 + R9 + §1 amended;
    F-DEPLOY `reviewed`→`gated` promotion explicitly in PM-20 acceptance (folds F-14).
  - **F-2 (major, accepted):** E4 now enumerates the normative 18-route D2 §1.3 table and the
    CLI-verb→route/OS-op mapping (the reviewer's own 10-route list had conflated the two).
  - **F-4 (major, accepted):** PM-1 gains the workers-core `mod.ts` re-export precursor for
    `WorkerTaskPermissions` (doctrine 02/09 compliant).
  - **F-7 (minor, accepted — real arithmetic error):** milestone-1 = **32** slices (not 31),
    `v1-min` floor = **21** (not 19), total 36; §4/§5/§10 corrected.
  - F-5/F-8/F-9/F-10/F-11/F-12/F-15/F-16/F-17 minor clarifications applied (PM-11 loopback
    reachability, PM-31 JSR-only dry-run, PM-25 degraded reads defined, PM-4 pollIntervalMs=5000,
    R1 Job-Objects note, R9 split escape hatch, PM-0 hard beta.6, E1 "superseded", OF-9 hard fork).
- Stage F closed: verdict PASS + all majors resolved at triage → proceed to Stage G PLAN-EVAL
  (OpenHands minimax-M3, separate session) against the amended plan.md. Optional: owner may re-run
  Tier-D Codex adversarial after credit reset (2026-07-07 03:52) — not gating.
- Stage-F proof comment: #issuecomment-4891964722. Commit `0836d821` pushed (bundle→WSL route).

## Stage G — PLAN-EVAL (2026-07-06)

- Dispatched OpenHands **minimax-M3** (separate session, Tier E per lane policy), PR-comment
  trigger on #504 @ `0836d821` (post-Stage-F amended plan.md). Trigger comment:
  #issuecomment-4891984663. Brief: PLAN-EVAL protocol + plan-gate walk + open-decision sweep +
  citation spot-check; seed-run adaptation stated (slices = issue candidates; owner forks OF-1..9
  are profile design, not open decisions). Verdict contract: PASS | FAIL_PLAN.
- Verdict watcher armed (1h re-armable heartbeat). **Hard stop: no Stage H before PASS.**
- **Verdict landed** (elapsed ~18 min): PR comment #issuecomment-4892134973 —
  **`OPENHANDS_VERDICT: PASS`**. All 8 Plan-Gate boxes checked with evidence; evaluator's own
  open-decision sweep found **no unflagged open decisions** (OF-1..9 correctly classed as profile
  design; 4 residuals bounded); both citation spot-checks confirmed against the checkout (drift-5
  registry/config mismatch; ARCHETYPE-7 "extracted in a later wave" clause under E5/PM-20); all 8
  accepted Stage-F fixes verified landed, and the F-1 rejection was independently confirmed as a
  stale-read correction.
- Evaluator commit-back **verified clean** before accepting: `2062a536` = exactly 1 file
  (`plan-eval.md`, +143), no `deno.lock` churn, no source drift. Local branch fast-forwarded.
- One evaluator note (no action required): PM-1's workers-core `mod.ts` re-export precursor
  bundles a 1-line cross-package change into the pm contract PR — bounded, self-evident.
- Stage G closed: **PASS on first cycle** (0 FAIL_PLAN loops). Run proceeds to Stage H — owner
  ratification of the decision brief (OF-1..9), zero board mutation until in-turn approval.

## Stage H — Owner ratification + one-shot filing (2026-07-06)

- **Ratified in-session** (owner, verbatim): "OF - 1 YES / OF - 2 yes / OF - 3 YES / OF - 4 YES /
  OF - 5 Yes ship that later (backlog) / OF - 6 YES / OF - 7 yes / OF - 8 yes / OF - 9 yes".
  Interpretation (stated, unobjected): OF-1..8 = recommendation (a); **OF-5 → PM-35 to
  `Backlog / Triage`** (delta vs plan §5's stable sketch); **OF-9 → M1 = `0.0.1-beta.8`**.
- **One-shot filing executed** (manifest + WSL bash, 37 records, zero failures, one pass):
  - Label `epic:process-manager` created (5319e7) + mirrored in `.github/labels.yml`.
  - **Epic #510** (D5 §8 body, ratified-forks section, real sub-issue checklist) — sub-issue of
    #327.
  - **36 children #511–#546** (PM-0..PM-35): D5 §9 template, full taxonomy + `status:plan`,
    milestones per ratified train (PM-0→beta.6; PM-1..33→beta.8; PM-34→stable; PM-35→Backlog),
    deps as live links (sequential `{{PM-k}}` substitution), all sub-issue-linked under #510.
  - **#345 re-scoped** per D3 §D3.7 (cross-host HA/secrets/signing; per-host → #546; dep edge).
  - **2 comments on #400**: CR-DDX-HOSTAGNOSTIC (#issuecomment-4892799802) + `CommandInvokePort`
    first-definer ack (#issuecomment-4892800265).
  - **PR #504 body** rewritten with the filed map + completed stage trail.
- `FILING-LOG.md` written (map, ratified picks, 3 deltas, mechanics); **authority banner** added
  to plan.md — **GitHub is now the single source of truth**.
- Stage H closed. Run proceeds to Stage I (implementation handoff briefs).

## Stage I — Implementation handoff briefs (2026-07-06)

- `stage-i-handoff.md` written: paste-ready `use harness` + `## SKILL` preamble, lane routing
  (framework source → WSL Codex Tier D; docs #541 → Claude workflow exception; per-PR IMPL-EVAL =
  qwen-3.7-max single loop), wave order W0–W5 with parallelism notes, design-pack→issue map,
  standing laws, first actionable batch (#511 → #512 + #513).
- Owner note landed post-filing: cron-primitive lineage + upstream watch comment on **#517**
  (#issuecomment-4892882327) — `@netscript/cron` behind a port (lineage: netscript-start#93
  TriggerSchedulerPort anti-fragmentation law); track denoland/deno#33965 `Deno.cron.persistent`
  (OS-scheduler-backed cron) as a future adapter, not a re-architecture.
- Stage I closed. **Seed run A–I complete.** The run dir is frozen; the board (#510 + #511–#546)
  is live.
