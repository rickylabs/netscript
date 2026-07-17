# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f7078-cb51-7a03-af49-ee88858c5301` / 2026-07-17
- Evaluator route: Codex · GPT-5.6 Sol · max
- Generator separation: this evaluator session is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Evaluation cycle: 9 on `plan.md` rev 9; final cycle under the owner's wrap-up directive
- Surface / archetype: planning-only seed/RFC; downstream drafts span Archetype 2 Integration,
  Archetype 3 Runtime/Behavior, Archetype 4 DSL/SDK, Archetype 5 Plugin, Archetype 6 CLI, and the
  composite Archetype 7 Deployment Target Adapter pattern
- Scope overlays: downstream `SCOPE-service`, `SCOPE-frontend`, and `SCOPE-docs`
- RFC Plan-Gate interpretation: `plan.md` §E is the commit-slice substitute. It must remain below
  30 entries, be bounded and dependency-ordered, and assign G1–G8 exactly one owner. This
  separate-session evaluation is the run's gate of record; no implementation gate was run.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | FAIL | `research.md` exists and Part 0 genuinely re-baselines the POC, board, deploy spine, and debt against `origin/main` `47cc2fa9`; raw refs still resolve checkout `f391190f` and that exact `origin/main`. The resumable record is not current, however: `context-pack.md:9-16,37,42,73-74` still declares rev 8 / cycle 8 current; `supervisor.md:29` still says cycle 8 is running; while `worklog.md:129-131,162-163` records cycle 8's result, rev 9, and cycle 9. `drift.md` has six entries (including the wrap-up directive at line 84), but `worklog.md:139-147` and `context-pack.md:80-83` still report only five. A resumed session can follow the wrong candidate and gate. |
| Decisions locked | PASS | Rev 9 locks the PM split (§A), Aspire-derived installer boundary (§B.1/§B.4), per-scope supervision and privilege model (§B.3), one journaled update mechanism (§C), and cross-mode enforcement (§D). The cycle-8 lifecycle defects are materially closed: purge has four durable states plus one canonical state root (§B.1a–b), and boot recovery, OS start, and confirmation/rollback have distinct owners with journaled hand-off (§C.3b). |
| Open-decision sweep | FAIL | The owner forks OF-A..OF-K are complete, but §H's “Nothing else is open” claim is too strong. The plan still does not decide whether the PM-5 `RuntimeCommandSpec` additions, PM-15 systemd renderer/config additions, and SD-1 supervisor/broker/proxy/Job-Object types are public exports or internal implementation. Deferring those classifications changes export maps, package ownership, documentation, consumer gates, and potentially the PM-20 move, so they are not safe implementation tunables. |
| RFC board adjustments (< 30, gate + files/surface each) | PASS | §E.2 contains 22 bounded entries in dependency order. The repaired edges `NS-P1 ← PM-B`, `SD-1 ← PM-B`, and `SD-3 ← SD-1` are present; SD-8 remains downstream of SD-7. §E.1 assigns each G1–G8 exactly once. PM-1/PM-5/PM-15 are acceptance-sized amendments, while PM-A/PM-B remain separate drafts. |
| Risk register | PASS | §G carries the non-atomic junction, root-gone/no-barrier purge, canonical-state-root, boot re-entry/deadlock, single-confirmer, trust/replay, privilege, migration, rollback, and containment hazards. Each names a blocking draft and a proving gate. |
| Gate set selected | PASS | §I.1 binds the complete archetype matrices, F-CLI and F-DEPLOY treatment, all three overlays, scoped wrappers, `quality:scan`, `arch:check`, `scaffold.runtime`, consumer/runtime gates, and `e2e-cli-prod`. Rev 9 adds the exact SD-3 root-gone purge case and SD-8 real-systemd/Windows-SCM reboot cases from `switching`, `starting`, and `rolling-back`, including no-cyclic-activation and single-confirmer assertions. Public-surface enumeration remains the separate JSR failure below. |
| Deferred scope explicit | PASS | §B.5 and §I.3 explicitly defer macOS, MDM/GPO/fleet/MSIX/stores, rollout rings, per-user instance brokering, PM-35, serverless, and the Linux OS-enforced containment backstop. OF-H states the beta.13 Linux residual precisely. |
| jsr-audit surface scan (pkg/plugin) | FAIL | Rev 9 correctly adds #452's public `@netscript/aspire` `./types` change to §E.2 and §I.2 with the full rubric and a consumer compile. The table nevertheless still claims to enumerate “every planned entrypoint” while omitting explicit public/internal classifications for PM-5, PM-15, and SD-1. The cycle-8 required-fix tail asked for those classifications specifically; generic full-matrix language and “where surface grows” do not satisfy the planned-surface scan. |

## Cycle-8 residual audit (real closure, not reference)

| Cycle-8 item | Result | Fresh verification on rev 9 |
| --- | --- | --- |
| Purge preparation/barrier recovery and canonical state root | CLOSED | §B.1a defines `prepared → barriered → purging → complete`; `prepared` always continues from its durable inventory whether the install root exists or not, while later states only roll forward. §B.1b uses `%ProgramData%\NetScript\` / `/var/lib/netscript/` consistently for cross-install state and supplies the per-user equivalents. SD-3 owns root-gone-before-barrier, ACL, concurrent-claim, and crash-replay gates. |
| Boot recovery versus graph start/confirmation | CLOSED | §C.3b removes the self-wait/re-entry cycle: the boot actor performs pre-start reconciliation only, the OS (or explicit upgrade worker) owns graph start, and one updater-identity confirm watcher owns the grace window and rollback initiation. `activated-pending-confirm` plus `lock-handoff` makes reboot recovery named; SD-8 proves all three reboot origins on real systemd and Windows SCM. |
| Owner-fork resume map | CLOSED AS SCOPED | `plan.md` §F/§H, `worklog.md` Design, and `context-pack.md` Key Decisions/Open Questions all carry OF-A..OF-K; no OF-A..OF-H occurrence remains. The broader rev/cycle metadata remains stale and is a fresh artifact-currentness failure, not a recurrence of the fork omission. |
| #452 JSR regression | CLOSED; BROADER SWEEP PARTIAL | `packages/aspire/deno.json:6-15` publishes `./types`; `packages/aspire/config.ts:72-73,139-159` defines `AppType`/`AppEntry`; and `packages/aspire/types.ts:20-39,49-54,88-89` exposes them. Rev 9 now enumerates and gates that change. PM-5/PM-15/SD-1 remain unclassified despite the same cycle-8 required-fix instruction. |

## Open-decision sweep (evaluator-run)

1. **PM-5 public-surface ownership — must resolve now.** The saved PM-5 contract names
   `RuntimeCommandSpec`; §A.2 adds `clearEnv` and the inherited-state strip policy. Lock whether
   those additions extend the published `plugin-process-manager-core` contract. If public, name
   the entrypoint, fast types, docs/examples, permissions, consumer compile, doc-lint, and publish
   gates. If internal, state the non-export invariant and why callers do not configure it.
2. **PM-15 renderer/config ownership — must resolve now.** Lock whether the new `KillMode`,
   `Requires`, `Type=oneshot`, and `RemainAfterExit` knobs remain CLI/deploy-core internals or are
   published when PM-20 moves the renderer. Bind the classification to the PM-20 move and the
   appropriate consumer/JSR gate.
3. **SD-1 surface ownership — must resolve now.** Enumerate any exported desktop-supervisor,
   token-broker/proxy, containment, or Job-Object capability types, or explicitly mark the entire
   SD-1 implementation surface internal with a reason. The transport/client surface already
   assigned to #451/SD-6 does not classify these host-side contracts by itself.

The concrete installer builder behind OF-D, tunable grace/prune/timeouts/ports, token-broker IPC
primitive, manifest field spelling, and rollout-ring design remain safe to defer. OF-A..OF-K are
properly surfaced for stage-H owner ratification.

## Evidence-integrity spot-checks

- **Launch-only supervision is confirmed.**
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203-204,367-388` consults child
  status only during readiness, then retains startup-failure cleanup and unload teardown. It has
  no post-start monitor, restart policy, or UI failure propagation. Research §1.1/§1.7 and L0.2
  use this evidence correctly.
- **Shipped release activation and Windows non-atomicity are confirmed.**
  `packages/cli/src/public/adapters/service-activation-port.ts:4-20,85-104,130-153` resolves
  `releases/<id>` through `current`; POSIX uses temp-link plus rename, while Windows removes then
  recreates the junction. Rev 9 correctly makes the journal and direct release path—not pointer
  atomicity—the recovery authority.
- **The Tier-4 milestone split is evidence-backed.**
  `corpus/md/board-search.md:85-94` records #452–#458 at beta.11 and #543 at beta.12; the saved #456
  body depends on #452 and #454. §A.1 preserves a complete PM-independent single-runtime lane in
  beta.11 while moving PM-consuming graph mode to beta.13. That respects PM-first without blocking
  the lane that has no process graph.
- **Deno Desktop update evidence is used correctly.**
  `corpus/files/resources__deno-desktop__auto_update.md:14-26,148-187` limits patching to the runtime
  dylib, says Windows stages without applying, and describes a launch confirmation sentinel. Rev 9
  does not make this path an authority; it uses a combined-release journal, migration barriers,
  sustained-health confirmation, and rollback.
- **Aspire-stack citizenship and PM-20 scope are grounded.**
  `corpus/md/board-core.md:218-223` establishes the TypeScript AppHost publish/deploy step graph;
  `corpus/md/board-pm-subissues.md:548-571` makes PM-20 a pure extraction/re-export slice. §B.4
  correctly assigns SD-2 both the canonical build verb and a named `pipeline.addStep(...)` publish
  integration rather than expanding PM-20.
- **The #452 surface is genuinely public.** The saved #452 body requires `AppEntry` in
  `@netscript/aspire/types`; the repo export and type paths above confirm that rev 9's new JSR row
  is necessary and correctly scoped.

## Adversarial design findings

- **Sequencing:** §A.1 is sound. Single-runtime has no PM graph to supervise and remains beta.11;
  singleton-graph work waits for PM and SD-1 in beta.13. PM-1/PM-5/PM-15 are small acceptance
  additions, with new conceptual work isolated as PM-A/PM-B instead of silently growing #510.
- **Installer design:** §B is inside the Aspire/deploy stack rather than a bolt-on: generator-owned
  app facts produce `PackagingModel`, one compiler emits the install manifest, SD-2 binds both the
  deploy build verb and Aspire publish step, installer builders are subordinate adapters, and OS
  unit registration reuses `OsServicePort`. Per-user supervision stays with the window; per-machine
  supervision stays with OS units. Installer/repair/uninstall own elevation, while update uses a
  narrowly ACL/SDDL/polkit-authorized updater identity.
- **Update lifecycle:** Rev 9 closes the cycle-8 boot/start composition defect. The journal-first
  bootstrap covers the Windows missing-junction interval; per-step migration records and the
  pre-effect barrier cover partial migration; sustained-health confirmation, rollback-failed
  maintenance, snapshot retention, replay high-water, and install-graph digest refusal cover the
  remaining cross-artifact hazards.
- **Composition:** §D does not overclaim the transport seam. It enforces only transport selection;
  the shared manifest/compiler/update pipeline and SD-7's seven-row, two-mode conformance suite are
  the anti-fork enforcement points. Divergences are explicit.
- **Owner forks:** OF-A..OF-K surface all identified product forks, including the Linux residual,
  graph-compatibility authority, sequence epoch, and Windows containment realization. No additional
  product fork was silently selected in rev 9; the remaining omissions are public-surface
  classifications required by the Plan-Gate.

## Stop-line audit

- Saved `corpus/ns-820-comments.json` contains zero comments; `drafts/` and `FILING-LOG.md` are
  absent. No local run artifact indicates a #820 comment or board filing. This evaluator made no
  GitHub call and does not claim a fresher live-board read than the saved corpus.
- Raw Git ground truth before this write resolved checkout `f391190f`, `origin/main` `47cc2fa9`,
  and no tracked source diff; the listed run/workspace directories were already untracked.
- This evaluator implemented nothing and modified only the required `plan-eval.md`.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Research present/current — reconcile resumable artifacts.** Update `context-pack.md` from rev
   8/cycle 8 to rev 9/cycle 9, including Current State, Completed, Next Steps, Key Decisions, Gates,
   and the final-cycle close path. Update `supervisor.md` with cycle 8's result and cycle 9's route.
   Reconcile the drift summaries to all six `drift.md` entries, including the wrap-up directive.
2. **Open-decision sweep — lock PM-5/PM-15/SD-1 surface ownership.** For each, decide public versus
   internal now and bind the decision to the package/entrypoint and PM-20 move where applicable;
   do not leave export ownership to implementation.
3. **jsr-audit surface scan — make §I.2 exhaustive.** Add a row for each of PM-5, PM-15, and SD-1.
   Public rows receive the full rubric plus consumer compile and exact export-map/publish-list
   checks; internal rows receive an explicit N/A reason and a no-export invariant. Mirror any
   resulting gates in the corresponding §E.2 row.

## Notes

The final-cycle bound changes only what happens after this verdict; it does not lower the Plan-Gate
bar. Rev 9 genuinely closes the purge, state-root, boot-handoff, #452, board-ordering, sequencing,
Aspire-integration, update-direction, and composition defects. The residuals are narrow: resume
integrity and three unclassified planned type surfaces.
