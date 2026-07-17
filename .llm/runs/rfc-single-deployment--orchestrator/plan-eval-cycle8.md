# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f7052-f1f5-7261-8fec-10bd224a8488` / 2026-07-17
- Evaluator route: Codex · GPT-5.6 Sol · max
- Generator separation: this evaluator session is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Evaluation cycle: 8 on `plan.md` rev 8, owner-authorized after the cycle-2 escalation
- Surface / archetype: planning-only seed/RFC; downstream drafts span Archetype 2 Integration,
  Archetype 3 Runtime/Behavior, Archetype 4 DSL/SDK, Archetype 5 Plugin, Archetype 6 CLI, and the
  composite Archetype 7 Deployment Target Adapter pattern
- Scope overlays: downstream `SCOPE-service`, `SCOPE-frontend`, and `SCOPE-docs`
- RFC Plan-Gate interpretation: `plan.md` §E is the commit-slice substitute. It must be
  enumerated, bounded, dependency-ordered, and assign each research gap G1–G8 exactly one owner.
  This separate-session evaluation is the run's gate of record. No implementation gate was run.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` exists and Part 0 explicitly re-baselines the POC, board, deploy spine, and debt against `origin/main` `47cc2fa9`; raw Git still resolves checkout `f391190f` and that exact `origin/main`. The evidence checks below independently confirm the launch-only supervisor, shipped release activation, milestone split, Deno Desktop update limits, Aspire publish model, and current public Aspire app contract. |
| Decisions locked | FAIL | Rev 8 closes the early-install compensation omission and chooses concrete platform primitives, but two lifecycle protocols remain internally contradictory. In §B.1a, a purge journal can simultaneously be “after the install root is gone” (resume deletion) and “before the barrier” (remove the journal without purging). In §C.3a/§C.4, the boot preamble is required to complete or revert a transaction before workloads run, while `starting` and `rolling-back` require those same workloads to start and become healthy. The Linux ordering deadlocks that work behind its own oneshot; the Windows in-service wrapper has no non-reentrant owner for graph start, health confirmation, or rollback. |
| Open-decision sweep | FAIL | The purge pre-barrier recovery outcome, canonical machine-state path, and boot recovery/start-confirm handoff would force journal layout, unit topology, lock ownership, and fault-gate rework, so they are must-resolve decisions. Artifact reconciliation is also falsely closed: `plan.md` §H says worklog/context carry OF-A..OF-K, but `worklog.md` Design and two `context-pack.md` resume sections still say OF-A..OF-H. |
| RFC board adjustments (< 30, bounded, ordered, exact-one G owner) | PASS | §E.2 contains 22 scoped drafts, stays below 30, and is dependency-ordered. The cycle-7 missing edges are now explicit: `NS-P1 ← PM-B`, `SD-1 ← PM-B`, and `SD-3 ← SD-1`; SD-8 remains after SD-7. §E.1 assigns G1–G8 exactly once. PM-1/PM-5/PM-15 are acceptance-sized adjustments, while PM-A/PM-B remain separate drafts. |
| Risk register | FAIL | §G adds the three requested hazard themes, but its mitigations assume the unsound protocols are already locked. It does not register the overlapping “root gone, barrier absent” purge state or the recovery actor's cyclic/reentrant transition through `starting`/`rolling-back`; the Linux-state-root inconsistency is likewise absent. |
| Gate set selected | FAIL | §I.1 correctly binds the full archetype matrices, F-CLI evidence, all overlays, scoped wrappers, `quality:scan`, `arch:check`, `scaffold.runtime`, and `e2e-cli-prod`. PM-15 now has emitted-semantics render tests and SD-3 has early-effect compensation. The selected fault set still lacks the exact purge overlap and boot handoff cases: reboot from `starting` and `rolling-back`, proof of no cyclic activation/reentrancy, one confirmer, and explicit lock handoff on real systemd and Windows SCM. |
| Deferred scope explicit | PASS | §B.5 and §I.3 explicitly defer macOS, MDM/GPO/fleet/MSIX/stores, rings, per-user instance brokering, PM-35, serverless, and the Linux OS-enforced backstop. OF-H states the beta.13 Linux residual precisely. |
| jsr-audit surface scan (pkg/plugin) | FAIL | §I.2 is not an enumeration of every planned entrypoint as claimed. #452 explicitly extends public `@netscript/aspire/types` `AppEntry` with `Type: "desktop"`; the repo exports `./types` and currently exposes `AppType`/`AppEntry`. Neither §I.2 nor the #452 row applies the JSR rubric to that public change; generator golden tests and `scaffold.runtime` are not publishability evidence. |

## Cycle-7 sweep audit (real closure, not reference)

| Cycle-7 sweep item | Result | Fresh verification on rev 8 |
| --- | --- | --- |
| 1. Installer terminal/journal lifetime | PARTIAL | The install half is closed: §B.1a makes `failed` reachable from every state at or after `claiming`, journals durable effects, and reverse-compensates them. The separate purge journal also survives install-root deletion. Its recovery table is not deterministic, however: because the journal is created before uninstall `removing` and the barrier is written only after uninstall completes, a crash can leave the root gone and the barrier absent. “Resume deletion” and “purge not started; remove journal” both govern that state. The same row places mutable state beside `ports.json` in `/var/lib/netscript/`, while §B.3a places `ports.json` in `/etc/netscript/ports.json`. |
| 2. Per-platform reboot barrier | PARTIAL | Renderer ownership and the prior platform-mechanism gap are closed: PM-15 owns `Requires=`, `Type=oneshot`, and `RemainAfterExit`; Windows no longer relies on SCM dependency semantics; both realizations enter the graph digest. The transaction handoff is not closed. A Linux recovery oneshot cannot synchronously resume §C.4 `starting` or `rolling-back` while every service it must start is `After=` that unfinished oneshot. On Windows, the first service's preamble is itself inside the SCM start being reconciled; the plan neither defines a non-reentrant start owner nor a post-start owner for readiness, the 60-second confirmation window, and rollback. |
| 3. Fork set, retired containment wording, and dependency edges | PARTIAL | `plan.md` §F/§H now names OF-A..OF-K, the historical Servy-tree-kill wording is explicitly retired, and all three missing dependency edges are present in §E.2. Resume artifacts remain contradictory: `worklog.md` Design says “§F forks OF-A..OF-H”; `context-pack.md` says OF-A..OF-K “everywhere” but its Key Decisions and Open Questions still say OF-A..OF-H. |

## Open-decision sweep (evaluator-run)

1. **Purge preparation/barrier recovery — must resolve now.** Give purge explicit durable states
   such as `prepared`, `barriered`, `purging`, and `complete`, then define one recovery action
   for every crash boundary. In particular, lock what happens when the install root is absent but
   the purge journal has no barrier. An explicit purge request cannot be silently forgotten by
   deleting the only target inventory. Choose one canonical mutable machine-state root and use it
   consistently for the journal, `ports.json`, `ports.lock`, ownership, and ACLs.
2. **Boot recovery versus graph start — must resolve now.** Split pre-start reconciliation from
   graph start/health confirmation, or define an equivalent resident outer bootstrap. The plan
   must identify who owns the transaction lock, when it is handed off, who starts each graph
   without recursively starting itself, who observes sustained health, and who performs rollback.
   Define recovery from at least `switching`, `starting`, and `rolling-back` on both platforms.
   This changes unit commands/topology and therefore the install-graph digest.
3. **Owner-fork resume state — must resolve now.** Reconcile `worklog.md` Design and every
   `context-pack.md` resume section to OF-A..OF-K. The top-level assertion that the range is fixed
   is not enough while the stage-H decision map and Open Questions can still omit OF-I/OF-J/OF-K.

The concrete builder behind OF-D, tunable timeouts/ports, token-broker IPC primitive, manifest field
spelling, and rollout rings remain safe to defer.

## Evidence-integrity spot-checks

- **Launch-only supervision is confirmed.**
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203-204,367-388` waits on
  child status only during readiness and retains startup-failure cleanup plus unload teardown. It
  has no post-start monitor, restart policy, or UI failure propagation. Research §1.1/§1.7 and
  L0.2 use that evidence correctly.
- **Release activation and Windows non-atomicity are confirmed.**
  `packages/cli/src/public/adapters/service-activation-port.ts:4-20,85-88,136-152` resolves
  `releases/<id>` behind `current`; POSIX uses temp-link+rename, while Windows removes then
  recreates the junction. Rev 8 correctly makes the journal and direct release path—not pointer
  atomicity—the recovery authority.
- **The Tier-4 split is evidence-backed and well sequenced.**
  `corpus/md/board-search.md:85-94` records #452–#458 at beta.11 and #543 at beta.12; the saved
  #456 body depends on #452 and #454. §A.1 therefore preserves a complete PM-independent
  single-runtime lane in beta.11 while moving graph-mode desktop work behind the PM foundation to
  beta.13.
- **Deno Desktop update evidence is used correctly.**
  `corpus/files/resources__deno-desktop__auto_update.md:14-25,148-187` limits patching to the
  runtime dylib, says Windows stages without applying, and uses an update-ok launch sentinel. Rev 8
  does not treat that single-file path as authority; its combined-artifact journal, migration
  barrier, rollback terminal, and sustained-health confirmation are the correct direction.
- **Aspire-stack citizenship and PM-20 scope are grounded.**
  `corpus/md/board-core.md:218-223` establishes the TypeScript AppHost publish/deploy step graph;
  `corpus/md/board-pm-subissues.md:548-571` leaves PM-20 as pure extraction. §B.4 correctly puts a
  generator-derived `PackagingModel`, reusable build verb, named `pipeline.addStep(...)`
  publish integration, and emitted-artifact proof in SD-2 rather than expanding PM-20.
- **The missed JSR surface is concrete.** The saved #452 body in
  `corpus/ns-search-single-runtime.json` says to extend `AppEntry` in
  `@netscript/aspire/types`. `packages/aspire/deno.json:5-8` publishes `./types`, and
  `packages/aspire/config.ts:73,140-159` exposes `AppType` and `AppEntry`. This is a public
  union/interface change, not generator-only internals.
- **The platform primitives are representable; their composition is the defect.**
  `packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:19-67,91-137` currently lacks
  the new fields, but PM-15 now owns them and §E.2 tests their rendering. The official
  [systemd unit ordering contract](https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html)
  says an ordered unit's start is delayed until the prerequisite's start job finishes; therefore
  `RemainAfterExit` does not let the recovery `ExecStart` wait synchronously on workloads that
  are `After=` it. Windows wrapping correctly avoids the prior
  [SCM dependency constraint](https://learn.microsoft.com/en-us/dotnet/api/system.serviceprocess.serviceinstaller.servicesdependedon?view=netframework-4.8.1);
  the remaining problem is the wrapper's undefined transaction/start handoff.

## Sequencing, installer, update, and composition findings

- §A.1 respects the PM-first mandate without over-blocking. The beta.11 single-runtime package is
  complete without PM, while graph-mode supervision waits for PM. PM-1/PM-5/PM-15 remain small
  acceptance additions; PM-A/PM-B are separately scoped rather than silently entering the
  ratified PM epic.
- §B is genuinely inside Aspire: the model-derived packaging snapshot feeds one manifest compiler,
  SD-2 owns both the canonical deploy build verb and a named Aspire publish step, installer
  builders remain subordinate adapters, and service registration reuses `OsServicePort`.
  Per-user authority is the interactive user; per-machine elevation is confined to
  install/repair/uninstall and OS units supervise under scoped identities. The unresolved boot
  handoff does not negate those sound boundaries.
- §C's journal-first, direct-release design closes the Windows missing-junction interval,
  cross-artifact partial switch, replay/high-water, bootstrap compatibility, migration barrier,
  rollback-failure loop, and snapshot lifetime hazards. The update transaction becomes unsound
  only when the reboot actor is composed with the `starting`/`rolling-back` states; purge has
  the separate ambiguity described above.
- §D's shared/divergent split is coherent. The transport seam enforces transport only; the shared
  manifest/compiler/update pipeline plus SD-7's seven-row two-mode conformance suite is the real
  anti-fork enforcement point.
- §F surfaces OF-A..OF-K, so no new owner fork is being silently decided in the plan itself. The
  defect is the stale resumable decision map, which could cause stage-H to ratify only eight.

## Stop-line audit

- Saved `corpus/ns-820-comments.json` contains zero comments; `drafts/` and `FILING-LOG.md`
  are absent. No local artifact indicates a #820 comment or board filing. This evaluator made no
  GitHub call and does not claim a fresher live-board read than the saved corpus.
- Raw Git ground truth before this write resolved checkout `f391190f`, `origin/main`
  `47cc2fa9`, and no tracked source diff. The run directory was already untracked.
- This evaluator implemented nothing and modified only this required `plan-eval.md`.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Decisions locked + open-decision sweep — purge protocol.** Add explicit purge states and one
   crash action per state, including the overlapping root-gone/no-barrier boundary. Preserve the
   target inventory until a durable terminal outcome, and reconcile `/var/lib/netscript` versus
   `/etc/netscript` into one canonical mutable state root with explicit ACL ownership.
2. **Decisions locked + open-decision sweep — boot transaction handoff.** Replace the synchronous
   “complete/revert before workloads run” cycle with a realizable two-phase or resident-bootstrap
   protocol. Name pre-start recovery, start ownership, lock handoff, readiness/60-second confirmer,
   and rollback ownership on Linux and Windows, including recovery from `switching`,
   `starting`, and `rolling-back`.
3. **Open-decision/artifact reconciliation.** Update `worklog.md` Design and
   `context-pack.md` Key Decisions/Open Questions to OF-A..OF-K, then remove the false
   “everywhere” claim unless every resumable occurrence agrees. Retain the corrected Job-Object
   wording and the three repaired dependency edges.
4. **Risk register.** Add blocking risks for root-gone/no-purge-barrier recovery, mutable-state-root
   disagreement, and recovery/start self-deadlock or reentrancy. Point each to the revised owner
   drafts and the exact gates below rather than to the currently contradictory text.
5. **Gate set.** Extend SD-3 with a crash at root-gone-before-purge-barrier plus deterministic
   recovery and state-root/ACL assertions. Extend SD-8 on real systemd and Windows SCM to reboot
   from `switching`, `starting`, and `rolling-back`, proving no cyclic activation, exactly one
   confirmer, explicit lock handoff, sustained-health confirmation, and rollback. Keep PM-15's
   emitted-dependency tests.
6. **jsr-audit surface scan.** Add the #452 `@netscript/aspire` `AppType`/`AppEntry` change
   to §I.2 and its §E.2 row with the full rubric: named fast types, symbol/module docs and desktop
   example, export-map `deno doc --lint`, exact publish list, dry-run, and a consumer compile.
   Explicitly classify any other PM-5/PM-15/SD-1 types that become exported rather than relying on
   “where surface grows.”

## Notes

Rev 8 genuinely closes early install compensation, renderer ownership, Windows's prior
SCM-dependency mistake, the three board edges, the in-plan OF-A..OF-K range, and retired Servy
wording. The sequencing, Aspire integration, core update direction, and composition contract remain
sound. The remaining blockers are narrow but architectural: purge state determinism, a realizable
boot-to-health transaction handoff, resumable artifact consistency, and one definite public JSR
surface.
