# Worklog: RFC single deployment (issue #820)

## Run Metadata

| Field          | Value                                    |
| -------------- | ---------------------------------------- |
| Run ID         | `rfc-single-deployment--orchestrator`    |
| Branch         | `feat/beta10-cli-integration` (baseline `f391190f`) |
| Archetype      | N/A — seed/RFC run (planning-only); downstream drafts span Archetypes 2/3/4/5/6/7 |
| Scope overlays | none bound by this run itself; the plan binds downstream SCOPE-service, SCOPE-frontend, SCOPE-docs per §E.2 |

## Design

Seed/RFC run — no implementation files. The "design" deliverable is `plan.md` (the RFC itself).
Phase order per kickoff: research.md (POC forensics) → gap analysis (in research.md) → plan.md
(RFC design) → Sol·max PLAN-EVAL → on PASS: comment on #820 + draft board adjustments as files.

### Public surface (of the RFC, not code) — rev 10 (current; self-contained; final eval OWNER-RUN)

Rev-10 delta (cycle-9 sweep): §I.2 gains explicit classifications — PM-5's
`clearEnv`/strip-list = PUBLIC additive `RuntimeCommandSpec` extension (rubric + consumer gate in
PM-5); PM-15 renderer knobs = INTERNAL @ beta.12 (public knob surface = `deploy.targets` config;
re-decided at PM-20); SD-1 host-side surface = INTERNAL w/ non-export lint (public = #451/SD-6).
§E.2 rows bound; §H cycle-9 dispositions added. No further generator-launched eval cycles.

Rev-9 delta (cycle-8 sweep): §B.1a purge gets four explicit durable states with one deterministic
recovery action per boundary (`prepared` always proceeds — root-gone-no-barrier unambiguous);
§B.1b single canonical machine-state root (`%ProgramData%\NetScript\` / `/var/lib/netscript/`);
§C.3b three-phase transaction ownership (pointer-level boot reconcile → OS-owned start → single
confirm-watcher under the updater identity; `activated-pending-confirm` state + journaled lock
hand-off; reboot deterministic from `switching`/`starting`/`rolling-back`); #452's public
`@netscript/aspire` `./types` extension enumerated in §I.2 with full rubric + consumer gate;
§G +3 hazard rows; SD-3/SD-8 gates extended.

Rev-8 delta (cycle-7 sweep): §B.1a purge is a separate op on a durable **state-dir journal**
(recovery survives install-root deletion) and install `failed` is reachable from any state ≥
`claiming` with reverse compensation; §C.3a reboot barrier locked per platform — Linux
`Type=oneshot`+`RemainAfterExit` recovery unit with `Requires=`/`After=` (PM-15-owned renderer
knobs), Windows `--preamble-then-exec` bootstrap wrapping (no SCM-dependency reliance); board
edges NS-P1←PM-B, SD-1←PM-B, SD-3←SD-1 added; must-resolve fork set = **OF-A..OF-K**; §G +3
hazard rows; SD-8 proves the barrier on both platforms.

Rev-7 delta (cycle-6 sweep): §B.1a `claiming` state (`ports.lock` transaction,
journal-before-registry) + journaled grant/account/unit effects with reverse-replay compensation;
§B.2a install-graph digest match-or-refuse (OF-I); §B.2 ever-accepted high-water + explicit epoch
reset (OF-J); §A.3 evidence-honest per-machine containment — explicit PM-15 `KillMode` knob +
Windows Job-Object wrapper (OF-K); the earlier "Servy tree-kill" assumption is **RETIRED**
(untraced in repo/corpus); child-side watcher primitive = pm-core draft PM-B; NS-H1 corrected to
Archetype 4.

- §0 theses L0.1–L0.7 (L0.7: one journaled snapshot mechanism; `Deno.autoUpdate` never the
  authority)
- §A sequencing: Tier-4 split (#456a deps #452+#454; #457a; #543 stays beta.12 w/ acceptance
  touch-up); PM-1/PM-5 acceptance additions; PM-A draft (OF-G); §A.3 PM bar (PM-1..14;
  +15/16/18 per-machine) + **containment scoped per install mode**: per-user = universal
  pipe-EOF (entrypoint harness + guardian wrapper for raw executables, over the PM-B core
  helper) + the core Job-Object primitive in SD-1; per-machine = explicit PM-15
  `KillMode=control-group` render on systemd + the Windows Job-Object wrapper (OF-K) — the
  rev-6-era "Servy tree kill" wording is retired; Linux OS backstop SD-H @ stable (OF-H precise
  residual)
- §B installer: no new port axis (`DeployTargetPort` + maintenance use-cases over a narrow
  `MaintenancePort`, PM-18 seam, `OsServicePort`); **§B.1a full install/repair/uninstall/purge
  state machines** (purge-barrier roll-forward; journal-deleted-last uninstall); §B.2 schema
  ownership (CLI-kernel internal through beta.12 → **SD-2 moves + publishes**; PM-20 untouched)
  + pinned single trust key + monotonic `sequence` replay/downgrade rule + `journalVersion`/
  `minBootstrapVersion` compatibility; §B.3 identity/privilege matrix incl. **updater
  least-privilege grants**; §B.3a per-user dynamic ports + `/_svc` proxy w/ per-launch token +
  **per-machine port-reservation registry**; §B.4 `PackagingModel` (CLI-internal) + build verb +
  named Aspire publish step
- §C update: §C.1 beta.11 incl. Windows apply; §C.2 layout; §C.3 **stable installer-managed
  bootstraps + release-resident workers, journal-first cold-boot resolution** (no running-binary
  self-replacement anywhere); §C.4 per-state table incl. per-step migration records,
  barrier-before-irreversible, `maintenance(rollback-failed)` terminal, data-root snapshot area;
  §C.5 quiescence (refuse/`--force`+grace + version handshake) + rollout
- §D full composition table (7 shared rows + enforcement; divergences; mode rule)
- §E.1 G-map (PM-36 folded into SD-1; SD-5 subordinate to SD-3; SD-H stable) · §E.2
  single-source draft table (SD-2 deps incl. #456a; SD-4 deps incl. SD-1; SD-8 blocks on SD-7)
- §F forks OF-A..OF-K · §G risk register (all cycle-3/4/5 hazards with blocking gates) · §H
  cycle-5 + cycle-4 dispositions · §I.0 doctrine verdicts + AP codes + F-DEPLOY timeline · §I.1
  gates-augment-not-replace · §I.2 per-entrypoint jsr table (internal marks with reasons)

### Vocabulary (current)

single-runtime · singleton-graph · single deployment · release · update authority ·
PackagingModel · rollback barrier · sustained-health confirm · pipe-EOF containment ·
same-origin `/_svc` proxy (defined in plan.md header + §§A–C).

### Domain vocabulary

single-runtime · singleton-graph · single deployment · install-graph manifest · release manifest ·
rollback barrier · adopt-and-reconcile start · confirm sentinel (defined in plan.md §0/§B/§C).

### Commit slices

N/A — planning-only run; no commits requested by kickoff (see drift.md entry 2).

### Deferred scope

See plan.md §I.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | bootstrap | Harness activated; workflow docs + seed-run.md + lane-policy read | Session `7f1fada7-805f-46cb-8ac4-5eb201bdc105` |
| 2026-07-17 | bootstrap | supervisor.md written with session id + routes + overrides | kickoff effort raises recorded |
| 2026-07-17 | research | Corpus fetched via authenticated GitHub API (local clone sandbox-blocked → drift entry 3) | `corpus/*.json` + `corpus/md/*` digests + `corpus/files/*` raw POC files @ aeaf2df |
| 2026-07-17 | research | POC forensics + gap analysis written | `research.md` Parts 1–2; 8 gaps G1–G8; repo verification of shipped deploy verbs + #341 activation convention |
| 2026-07-17 | plan | RFC design written | `plan.md` §0 theses, §A–§D design, §E drafts summary, OF-A..E forks, risks |
| 2026-07-17 | plan-eval | PLAN-EVAL launched — separate Codex session via agentic app-server client | thread `019f6fa1-b09a-7542-a582-8cd60055eaca` · gpt-5.6-sol · max · rollout `sessions/2026/07/17/rollout-2026-07-17T12-31-35-…jsonl` · brief `plan-eval-brief.md` · launch-path drift recorded (drift.md entry 4) |
| 2026-07-17 | plan-eval | **Cycle 1 verdict: FAIL_PLAN** (archived `plan-eval-cycle1.md`) | 7 required fixes: stale baseline; 5 unsound design areas; missing forks; no G-map/DAG; junction-atomicity risk; per-issue gates; planned-surface jsr-audit |
| 2026-07-17 | plan | Rev-2 fixes applied | research.md Part 0 re-baseline @ `47cc2fa9` (VITE naming shipped+changed in beta.10; `buildTauriBlock` precedent; deploy spine unchanged; ISSUE-167 debt cited) · plan.md rev 2: #456/#457 splits (#456a/#457a beta.11 + SD-4/SD-8), PM-A adoption contract (OF-G), §B.2 scope×platform supervisor/identity matrix (OF-F tenancy), §C.3/C.4 journaled update transaction + authorities + barrier `maintenance` state, §D manifest+conformance enforcement (SD-7), §E.1 G-map + §E.2 DAG, forks OF-A..G, §G risk additions, §I per-issue gates + planned-surface jsr-audit |
| 2026-07-17 | plan-eval | **Cycle 2 launched** (final cycle before owner escalation) | thread `019f6fb5-8bf9-7ed0-9f8c-0568827a799a` · gpt-5.6-sol · max · rollout `…T12-53-16-….jsonl` · brief updated with cycle-2 note |
| 2026-07-17 | plan-eval | **Cycle 2 verdict: FAIL_PLAN** (archived `plan-eval-cycle2.md`) | 7-item evaluator sweep (Windows beta.11 apply, exclusion/journal/shim hardening, privilege+client auth, port taxonomy+uninstall, PM prerequisite/containment bar, schema ownership, Aspire-derivation boundary) + mechanical fixes (debt reconcile, DAG direction, Archetype 3, full jsr rubric) |
| 2026-07-17 | escalate | **Loop limit reached — escalated to owner** | `escalation.md` written; #820 comment + drafts NOT executed (stop-lines held, evaluator-audited); stale rev-1 wording fixed in research §2.2 + worklog Design |
| 2026-07-17 | authorize | **Owner authorized loop continuation in-session** ("authorized proceed it's a complex topic") | authorization = revision + eval cycles, NOT design ratification/filing (stage-H unchanged); drift entry 5 |
| 2026-07-17 | plan | Rev 3 written | research Part 0 + debt reconciliation (ARCHETYPE-7-CORE-SEED, BAREMETAL-PUBLIC-WIRING, linux-integration, shutdown-orchestrator) · L0.7 one-mechanism lock · #543 move withdrawn · no-new-axis port taxonomy · schema ownership timeline · privilege split + OS-auth broker · PM bar + PM-36 · journal hardening + handshake shim (later retired in rev 5) · consolidated §E.2 · §I.0 doctrine state · full jsr rubric |
| 2026-07-17 | plan-eval | **Cycle 3 launched** | thread `019f6fd5-eb50-7720-aa56-ba37e473cfd4` · gpt-5.6-sol · max · brief updated with cycle-3 note |
| 2026-07-17 | plan-eval | **Cycle 3 verdict: FAIL_PLAN** (archived `plan-eval-cycle3.md`) | audit: cycle-2 items 1/3/4/6 CLOSED, 2 partial, 5/7 not closed; new sweep: self-containment regression, Linux parent-death, PackagingModel evidence gap, per-user ports, client quiescence, #456a↔#452 edge, OF-D timing |
| 2026-07-17 | plan | **Rev 4 written (self-contained)** + artifact reconciliation | §C.4 full state table inline; §A.3 two-layer containment + SD-H + OF-H; §B.3a `/_svc` proxy; §B.4 PackagingModel + build-verb binding; §C.3 updater-through-`current`; §C.5 quiescence; §E.2 rebuilt (PM-36 folded, SD-H added, #456a deps #452+#454); §I.0 AP codes; §I.2 per-entrypoint table w/ INTERNAL marks; supervisor/context-pack/drift/worklog reconciled |
| 2026-07-17 | plan-eval | **Cycle 4 launched** | thread `019f6feb-5c94-7181-a30c-e2bc9a9a39a3` · gpt-5.6-sol · max · brief updated with cycle-4 note |
| 2026-07-17 | plan-eval | **Cycle 4 verdict: FAIL_PLAN** (archived `plan-eval-cycle4.md`) | audit: cycle-3 items 4/6/7 CLOSED, 1/3/5 partial, 2 not closed; 9-item sweep: raw-executable containment, cold-boot authority, Windows shim replacement, snapshot/trust roots, publish-step ownership, maintenance routing + op-tagged journal, PM-20 boundary, SD-7/SD-8 ordering + #543 caveat, proxy authorization |
| 2026-07-17 | plan | **Rev 5 written** | §A.3 universal containment (guardian wrapper for raw executables; OF-H precise residual); §C.3 converged authorities: stable installer-managed bootstraps + release-resident workers + journal-first cold-boot resolution (self-replacement machinery retired); §C.4 snapshots → data-root transaction area; §B.1 `MaintenancePort` + op-tagged journal (install/uninstall crash-safe); §B.2 PM-20 untouched — SD-2 is the move-and-publish slice + pinned trust key; §B.3a proxy per-launch token + negative test; §B.4 PackagingModel internal + named Aspire publish step in SD-2; §E.2 SD-7 deps expanded + SD-8 blocks on SD-7 + #543 acceptance touch-up; §G nine risk rows reworked; §H cycle-4 dispositions; §I.2 config/PackagingModel/PM-A/MaintenancePort rows |
| 2026-07-17 | plan-eval | **Cycle 5 launched** | thread `019f7006-462d-7f32-b04d-67aec3f336e8` · gpt-5.6-sol · max · on rev 5 |
| 2026-07-17 | plan-eval | **Cycle 5 verdict: FAIL_PLAN** (archived `plan-eval-cycle5.md`) | 2 checklist boxes PASS (deferred scope, jsr); Aspire/PM + jsr fixes CLOSED; remaining: installer state machines, migration/barrier/rollback-failed records, machine-scope least privilege + containment scoping, per-machine ports, replay/downgrade + re-pin + bootstrap compat, SD-2/SD-4 dep edges, artifact currentness |
| 2026-07-17 | plan | **Rev 6 written** | §B.1a installer state machines; §C.4 per-step migration + barrier-before-irreversible + `maintenance(rollback-failed)` + snapshot retention; §B.3 least-privilege grants row; §A.3 containment-per-mode matrix; §B.3a port-reservation registry; §B.2 sequence/replay/downgrade + re-pin provenance + journalVersion/minBootstrapVersion; SD-2←#456a + SD-4←SD-1 edges; §G +8 hazard rows; §H cycle-5 dispositions; worklog Design + context-pack reconciled to rev 6 |
| 2026-07-17 | plan-eval | **Cycle 6 launched** | thread `019f701c-c73d-7671-bb67-75b37e747f34` · gpt-5.6-sol · max · on rev 6 |
| 2026-07-17 | plan-eval | **Cycle 6 verdict: FAIL_PLAN** (archived `plan-eval-cycle6.md`) | Research-currentness box now PASS (3 boxes green); cycle-5 fixes largely closed; 5 fresh sweep items: installer durable-resource lifecycle + ports.lock, install-graph compatibility, reboot recovery actor, replay high-water/epoch, containment evidence + core ownership (renderer emits no KillMode; Servy tree-kill untraced); NS-H1 archetype correction |
| 2026-07-17 | plan | **Rev 7 written** | §B.1a `claiming` + journaled effects w/ reverse-replay compensation + stale-claim repair; §B.2a graph-digest match-or-refuse (OF-I); §C.3a reboot recovery unit; §B.2 high-water + epoch reset (OF-J); §A.3 evidence-honest containment (PM-15 KillMode knob, Job-Object wrapper OF-K, PM-B core watcher draft); NS-H1 → Archetype 4; forks OF-I/J/K; §G +6 rows; §H cycle-6 dispositions; §E.2 PM-B/PM-15 rows + SD-3/SD-4/SD-8 scope+gate extensions |
| 2026-07-17 | plan-eval | **Cycle 7 launched** | thread `019f7034-bb62-7e61-82c5-4816ced88e95` · gpt-5.6-sol · max · on rev 7 |
| 2026-07-17 | plan-eval | **Cycle 7 verdict: FAIL_PLAN** (archived `plan-eval-cycle7.md`) | 3 boxes PASS held; replay semantics CLOSED; 3 narrow items: purge-journal lifetime contradiction, per-platform reboot-barrier realizability (renderer lacks `Requires=`; SCM deps must be running), fork-set/artifact reconciliation (OF-I..K missing from must-resolve; retained Servy claims) + board edges NS-P1/SD-1←PM-B, SD-3←SD-1 |
| 2026-07-17 | plan | **Rev 8 written** | §B.1a purge = separate op on state-dir journal + `failed` reachable from any state ≥ claiming; §C.3a per-platform barrier (oneshot+RemainAfterExit+Requires via PM-15 knobs; Windows preamble-then-exec wrapping); fork set OF-A..OF-K in §H must-resolve; Servy wording retired in retained rows + Design; board edges added; §G +3 rows; SD-3/SD-8 gates extended |
| 2026-07-17 | plan-eval | **Cycle 8 launched** | thread `019f7052-f1f5-7261-8fec-10bd224a8488` · gpt-5.6-sol · max · on rev 8 |
| 2026-07-17 | authorize | **Owner wrap-up directive** ("one more pass then done") | cycle 8 in flight stands; if FAIL, at most ONE final revision + cycle 9; then the run CLOSES regardless of outcome — #820 comment only on PASS; a non-PASS close = design-record closure with residuals documented for the owner |
| 2026-07-17 | plan-eval | **Cycle 8 verdict: FAIL_PLAN** (archived `plan-eval-cycle8.md`) | Board-adjustments box flipped to PASS (4 boxes green); 3 items: purge recovery-table ambiguity + state-root path inconsistency, boot-recovery/graph-start composition (oneshot self-wait deadlock; reentrant wrapper; no single confirmer), resume fork-set lines; + jsr regression: #452's public `./types` change unenumerated |
| 2026-07-17 | plan | **Rev 9 written (FINAL revision per wrap-up directive)** | §B.1a four purge states w/ deterministic recovery; §B.1b canonical state root; §C.3b phase ownership (`activated-pending-confirm`, lock hand-off, single confirm watcher); §I.2 aspire `./types` row + #452 jsr gate; §G +3 rows; §H cycle-8 dispositions; fork lines fixed in worklog/context-pack |
| 2026-07-17 | plan-eval | **Cycle 9 launched (FINAL)** | thread `019f7078-cb51-7a03-af49-ee88858c5301` · gpt-5.6-sol · max · on rev 9; on PASS → #820 comment + drafts; on FAIL → design-record closure with residuals |
| 2026-07-17 | plan-eval | **Cycle 9 verdict: FAIL_PLAN with 6/8 boxes PASS** (archived `plan-eval-cycle9.md`) | "Decisions locked" PASS for the first time; cycle-8 items all CLOSED; residuals: (a) resume-artifact rev/cycle metadata lag, (b) public-vs-internal classification for PM-5 `RuntimeCommandSpec` additions, PM-15 renderer knobs, SD-1 host-side types |
| 2026-07-17 | close | **RUN CLOSED per owner wrap-up directive** | design-record closure: `closure.md` written; artifacts reconciled to final state; NO #820 comment (gated on PASS, not earned), NO drafts filed, ZERO board mutations across the whole run (evaluator-audited every cycle); session record `.llm/2026-07-17-rfc-single-deployment-run.md` |
| 2026-07-17 | authorize | **Owner re-opened for the residual revision; final eval OWNER-RUN** ("proceed with the revision I'll take care of the final eval myself") | generator applies rev 10 (surface classifications) and stages the cycle-10 brief; generator launches NO further eval cycles |
| 2026-07-17 | plan | **Rev 10 written (classification residual folded)** | §I.2 +3 rows: PM-5 additions PUBLIC (rubric + consumer gate in PM-5); PM-15 knobs INTERNAL @ beta.12, re-decided at PM-20; SD-1 host surface INTERNAL (non-export lint; public = #451/SD-6) · §E.2 rows bound · §H cycle-9 dispositions · brief updated with the owner-launch cycle-10 note |
| 2026-07-17 | commit | Run record first committed as `9be5c7a5` on the session's checkout branch (`feat/beta10-cli-integration`, stale base) → pushed → **draft PR #821 — a branch-choice MISTAKE the owner flagged** | corrective loop below; #821 closed with an explanatory comment |
| 2026-07-17 | rfc | **PR #822 body rewritten as the formal enterprise RFC** (owner feedback: run artifacts are evaluator-facing, "no formal RFC generated") | reader-facing RFC document: abstract, motivation from POC failure modes, goals/non-goals, the two composition modes, five foundations (F1 supervision · F2 packaging · F3 installation · F4 update lifecycle · F5 runtime surface), milestone shipping table, acme-notes e2e flows with 4 mermaid diagrams (ship pipeline, install+first-run sequence, update transaction sequence, journal state machine), security summary, board impact, OF-A..K table; provenance demoted to a footnote; durable copy committed as run-dir `rfc.md`; PR retitled "RFC: NetScript Single Deployment — process-managed apps, single & multi runtime (#820)" |
| 2026-07-17 | commit | **Corrected (owner-authorized): fresh branch from current `main`** | `plan/rfc-single-deployment` cut from `origin/main` @ `ca72db14`; `9be5c7a5` cherry-picked → `11729a16`; pushed (explicit refspec — the branch had inherited `origin/main` as upstream, the documented seed-run landmine); accidental remote `feat/beta10-cli-integration` DELETED (it had not existed on origin before the mistaken push); local beta10 branch pointer reset to `f391190f`; **draft PR #822** opened with the rev-10 revision summary; labels type:docs · area:deploy · priority:p1 · status:research · ci:skip-e2e · ci:skip-scaffold; Refs #820, no closing keyword |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Run without dedicated seed branch/draft PR | Kickoff scopes deliverables to run-dir artifacts + #820 comment; supervision via run dir + session resume | kickoff.md |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Kickoff effort raises over lane-policy defaults | minor | yes (entry 1) |
| No dedicated seed branch/draft PR (kickoff-scoped run) | minor | yes (entry 2) |
| Local eis-chat clone sandbox-blocked → public-API corpus | minor | yes (entry 3) |
| PLAN-EVAL via the wrapper's inner agentic client | minor | yes (entry 4) |
| Owner-authorized loop continuation past two-failure escalation | minor | yes (entry 5) |
| Owner wrap-up directive bounding the loop at cycle 9 | minor | yes (entry 6) |
| Owner re-open for rev 10; final eval owner-launched | minor | yes (entry 7) |

## Gate Results

Seed/RFC run — the gate of record is PLAN-EVAL (Sol·max, separate session). No code gates apply.

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL cycle 1 | agentic app-server client · Sol·max · thread `019f6fa1…` | **FAIL_PLAN** | `plan-eval-cycle1.md` |
| PLAN-EVAL cycle 2 | agentic app-server client · Sol·max · thread `019f6fb5…` | **FAIL_PLAN** | `plan-eval-cycle2.md` — loop limit → `escalation.md` → owner authorized continuation (drift entry 5) |
| PLAN-EVAL cycle 3 | agentic app-server client · Sol·max · thread `019f6fd5…` | **FAIL_PLAN** | `plan-eval-cycle3.md` — 4/7 cycle-2 items CLOSED; rev 4 addresses the rest |
| PLAN-EVAL cycle 4 | agentic app-server client · Sol·max · thread `019f6feb…` | **FAIL_PLAN** | `plan-eval-cycle4.md` — cycle-3 items 4/6/7 CLOSED; 9-item sweep → rev 5 |
| PLAN-EVAL cycle 5 | agentic app-server client · Sol·max · thread `019f7006…` | **FAIL_PLAN** | `plan-eval-cycle5.md` — 2 boxes PASS; blockers = completeness, not architecture |
| PLAN-EVAL cycle 6 | agentic app-server client · Sol·max · thread `019f701c…` | **FAIL_PLAN** | `plan-eval-cycle6.md` — research-currentness PASS; 5 fresh cross-boundary items → rev 7 |
| PLAN-EVAL cycle 7 | agentic app-server client · Sol·max · thread `019f7034…` | **FAIL_PLAN** | `plan-eval-cycle7.md` — 3 narrow items → rev 8 |
| PLAN-EVAL cycle 8 | agentic app-server client · Sol·max · thread `019f7052…` | **FAIL_PLAN** | `plan-eval-cycle8.md` — board box PASS; 3 items + jsr regression → rev 9 |
| PLAN-EVAL cycle 9 | agentic app-server client · Sol·max · thread `019f7078…` | **FAIL_PLAN — 6/8 boxes PASS** (Decisions locked, board, risks, gates, deferred scope; failing: artifact currentness bookkeeping + PM-5/PM-15/SD-1 export classification) | `plan-eval-cycle9.md` |
| PLAN-EVAL cycle 10 (final) | **OWNER-LAUNCHED** — recipe: `deno run --no-lock --allow-read --allow-run --allow-env .llm/tmp/rfc820/launch-eval.ts` (sends `plan-eval-brief.md` to a fresh Sol·max thread) | PENDING (owner) | on rev 10; verdict lands in `plan-eval.md` (cycles 1–9 archived) |

## Turn 2 — Owner review, direction ratification, board filing (2026-07-17 evening)

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | review | Owner read the RFC; raised 2 caveats + the sequencing question | (1) MSI needs the .NET layer as a first-class Aspire citizen (eis-chat open PR uses .NET AOT); (2) single-runtime = its own epic (Nitro v3, netscript-start "unified" RFC), NOT desktop-tied; what ships first: desktop-no-PM vs unified vs PM? |
| 2026-07-17 | ground | Evidence checks | Aspire docs "multi-language-integrations": C# hosting-integration NuGet + ATS `[AspireExport]` → generated TS SDK (JSON-RPC) — the exact first-class pattern; Nitro v3 docs LIVE with full adapter surface (owner screenshot) — the #327 D1 WATCH verdict (2026-07-03) is stale; deno desktop MSI = window-bundle-only (no Deno-native combined path) |
| 2026-07-17 | recommend | Sequencing recommendation delivered | reject desktop-without-PM (ships the POC's failure); PM ships first (implementation-ready, foundational, beta.12); unified seeded NOW in parallel, ships as marquee (beta.13); desktop splits — single-runtime window rides unified, supervised graph last (beta.14); substrate starts beta.11 |
| 2026-07-17 | ratify | **Owner ratified the direction + instructed execution** ("rewrite the RFC in that direction… update milestones… adjust existing issues, create the missing ones") + granted full authorization for the filing | stage-H executed by owner instruction — the drafts-only stop-line lifted for exactly this scope |
| 2026-07-17 | file | **One-shot board filing executed** (`.llm/tmp/rfc820/file-board.ts`) | milestone `0.0.1-beta.14` (#16) · label `epic:unified-runtime` (+labels.yml parity) · 17 new issues #823–#839 · 14 adjustments (#456/#457/#452 re-scopes; #451/#453/#454/#455 re-homed; #512/#516/#526/#543 amendments; #458→stable; **#349 closed**; #510/#327 epic updates) · zero failures · `FILING-LOG.md` + `filing-log.json` |
| 2026-07-17 | rfc | **RFC rev 11** — rewritten in the ratified direction | Unified epic separated from desktop (§Abstract/§3); §4-F3 installer = `NetScript.Aspire.Packaging` #825 (ATS-exported NuGet — OF-D resolved); §5 ratified sequencing + live-numbered shipping table (beta.11 substrate+seed → beta.12 PM first → beta.13 unified → beta.14 desktop graph → stable); §8 = filed board state; §9 = decision log (OF-A..K all ratified/superseded); authority banner: GitHub + rfc.md win over plan.md rev-10 sequencing framing. PR #822 body + run-dir `rfc.md` updated |

| 2026-07-17 | reconcile | #456 keep-open ruling + correction (owner-confirmed) | Owner asked duplicate-vs-not-planned → neither: #456 is the re-scoped beta.11 substrate that #831/#834/#837/#543 build on. Correction appended: hard #454 dep dropped (window-only artifact suffices); **beta.11 product story named: thin-client desktop** — window shipped to consumer machines + vendor-cloud services via remote `services__*` discovery (POC option-(b) topology); #456+#457+#825 cover it without PM |

| 2026-07-17 | ratify | **Option A ratified + Desktop Frontend expansion** | Owner: native-first for thin-client (deno desktop formats + native autoUpdate), .NET #825 only for full-stack single output; freed room → wrap desktop features the NetScript way. Grounding: current auto_update docs re-verified (Windows apply STILL unsupported; tracker denoland/deno#35269; `Deno.desktop` namespace churn PR #35939); bindings docs (type-safety = manual d.ts — no built-in bridge); oRPC MessagePort adapter (RPCHandler.upgrade/RPCLink over port-likes) |
| 2026-07-17 | file | **Option-A board pass executed** (`file-desktop-frontend.ts`) | epic **#840** Desktop Frontend (beta.11) + **#841** SDK auto-update wrapper + **#842** type-safe bindings (oRPC MessagePort over a bind-channel shim) + **#843** fresh-ui desktop components; #452/#456/#457 re-scoped native-first + labeled in; **#825 → beta.14** w/ comment; #327 addendum; label `epic:desktop-frontend` + labels.yml parity; FILING-LOG Option-A section |
| 2026-07-17 | rfc | **RFC rev 12** | F4 rewritten as TIERED update (native autoUpdate for window-only w/ honest Windows posture; snapshot transaction for combined; one server/manifest lineage); F5 gains type-safe-bindings pillar; §5 beta.11 row = Desktop Frontend wave; §8 Option-A board state; §9 decision row OF-L; PR #822 body updated |

## Handoff Notes

- Evaluator: read kickoff.md, research.md, plan.md. Verdict scope = the RFC design (PLAN-EVAL on
  the RFC before posting to #820), per kickoff.
