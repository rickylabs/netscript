# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f7006-462d-7f32-b04d-67aec3f336e8` / 2026-07-17
- Generator separation: this Codex evaluator session is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Evaluation cycle: 5, owner-authorized after the cycle-2 escalation
- Surface / archetype: planning-only seed/RFC; downstream drafts span Archetype 2 Integration,
  Archetype 3 Runtime/Behavior, Archetype 4 SDK/DSL, Archetype 5 Plugin, Archetype 6 CLI, and the
  composite Archetype 7 Deployment Target Adapter pattern
- Scope overlays: downstream `SCOPE-service`, `SCOPE-frontend`, and `SCOPE-docs`
- RFC Plan-Gate interpretation: `plan.md` §E is the commit-slice substitute; its draft board must
  be enumerated, bounded, dependency-ordered, and give each G1–G8 gap exactly one owner. This
  separate-session PLAN-EVAL is the run's gate of record. No implementation gate was run.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | FAIL | `research.md` exists and Part 0 is genuinely re-baselined: raw Git still resolves checkout `f391190f` and `origin/main` `47cc2fa9`, and the load-bearing corpus/tree claims below check out. Resume artifacts are not reconciled to rev 5, however. `worklog.md:18-37` calls rev 4 current and normatively describes the retired self-updating shim, updater-through-`current`, PM-20 schema move, and cycle-3 dispositions. `context-pack.md:31-37` says only revs 1–4 and cycle archives 1–3 are completed. Those stale summaries contradict `plan.md` rev 5 and the same files' cycle-5 status. A canonical #820 post cannot safely be generated from the run as resumed. |
| Decisions locked | FAIL | Rev 5 really locks the cycle-4 headline mechanics: guardian wrappers (§A.3), stable installer-managed bootstraps and journal-first direct release resolution (§C.3), snapshots outside immutable releases (§C.4), install-time pinned Ed25519 trust (§B.2), an Aspire publish step (§B.4), and proxy authorization (§B.3a). Four load-bearing contracts remain incomplete. (1) §B.1 merely names install/uninstall state sequences; it supplies no per-state effect/recovery policy, and `staged → provisioning → registering → confirmed` has no registered/start/health-confirm phase even though §B.2 puts health-gated first start in `provisioning[]`. (2) §C.4 journals one record per coarse transition but does not durably record which migration step/barrier has started; it also has no terminal/recovery branch if starting the previous release fails during `rolling-back`. (3) §B.3 gives the updater identity install-root ACLs but never grants or brokers the OS-service control and live data-root migration/restore authority its transaction requires. (4) §A.3 says every manifest resource gets an inherited pipe, while §B.3 says per-machine resources are OS-supervised sibling units; the containment contract is not scoped coherently by install mode. |
| Open-decision sweep | FAIL | The evaluator found rework-forcing decisions omitted by §H's “Nothing else is open”: crash policy and ordering for install/repair/uninstall/purge; before/during/after-barrier journal semantics; rollback-failure terminal state and snapshot cleanup after rollback; least-privilege service-control/data-migration grants for the per-machine updater; the per-machine fixed-port collision policy; signed-manifest freshness/downgrade policy and the trusted source for an out-of-band key re-pin; and compatibility between a never-self-updated bootstrap and newer journal preambles/workers. These change schemas, authorities, adapters, and fault gates, so they are not safe implementation tunables. |
| RFC board adjustments (enumerated, scoped, ordered, exact-one G owner) | FAIL | §E.1 gives every G1–G8 gap exactly one top-level owner, §E.2 has 20 bounded draft rows, and the repaired SD-7→SD-8 conformance ordering is real. The DAG still omits required edges. SD-2 moves and publishes schemas that §B.2 says are born in #456a, but SD-2 does not depend on #456a. SD-4 implements graph stop/start, attached-client quiescence, and the cross-session handshake, but does not depend on SD-1, which owns the desktop graph host/control-plane client mode. Milestone ordering is not a substitute for explicit `Depends on` edges in the table declared to be the single source. |
| Risk register | FAIL | §G now covers all nine cycle-4 hazards, but its install/uninstall/purge row points only to an interrupted-uninstall test and therefore does not mitigate interrupted install or irreversible partial purge. It also omits: crash ambiguity at a migration barrier; failure of the previous release during rollback; insufficient per-machine service/data privileges; collision between two per-machine NetScript installs using fixed ports; replay/downgrade of an older valid signed manifest; untrusted repair-time key re-pin; and stable-bootstrap/journal-version skew. Each needs an owner and a concrete mitigation/gate. |
| Gate set selected | FAIL | §I.1 correctly binds the full archetype matrices, F-CLI manual evidence, all three overlays, scoped wrappers plus `quality:scan`/`arch:check`, this evaluator gate, `scaffold.runtime`, and `e2e-cli-prod` where applicable. The proving set still lacks transition-by-transition install **and purge** crash injection; crash cases immediately before/during/after a rollback barrier; a previous-release-start failure case; real Win/Linux evidence that the unelevated updater can control only its units and migrate/restore only its app data; a two-per-machine-install port-conflict case; valid-signature replay/downgrade rejection; trusted re-pin and bootstrap-version incompatibility cases; and an explicit per-machine OS-unit descendant-containment assertion. |
| Deferred scope explicit | PASS | §B.5 and §I.3 explicitly defer macOS, MDM/GPO/fleet/MSIX/stores, rings, per-user instance brokering, PM-35, serverless, and the Linux OS-enforced backstop. OF-H states the beta.13 Linux residual. |
| jsr-audit surface scan (pkg/plugin) | PASS | §I.2 applies the required rubric to every planned public entrypoint identified by this RFC: deploy-core `./install`/`./release`, `@netscript/config`, maintenance/capability types, PM-1/PM-A contracts, plugin `./services`, and SDK/widget surfaces. `PackagingModel` and the beta.11 CLI-kernel manifest/release/journal schemas are marked INTERNAL/N/A with concrete non-export reasons, and the public deploy-core audit is correctly assigned to SD-2 rather than PM-20. The scan names slow-type, export-map, docs, permissions, publish-file, consumer-import, and post-publish risks. |

## Cycle-4 required-fix audit (real closure, not reference)

| Cycle-4 required fix | Result | Fresh verification |
| --- | --- | --- |
| 1. Research/artifact currentness | NOT CLOSED | `supervisor.md` and the progress/gate tables reach cycle 5, but `worklog.md`'s Design section still presents rev-4 mechanics as current and `context-pack.md`'s Completed section stops at rev 4/cycle 3. The process-authorization-versus-ratification distinction is preserved. |
| 2. Decisions locked + open sweep | PARTIAL | Guardian containment for raw executables, stable cold-boot bootstraps, no running-binary replacement, data-root snapshots, pinned single-key v1 trust, publish ownership, maintenance routing, and proxy auth are normative. The operation-tagged installer journal is only a state-name assertion: it lacks effects/recovery, a health-confirmed install path, and install/purge fault coverage. Fresh update/authority decisions are listed below. |
| 3. Aspire/PM sequencing | CLOSED | §B.4 makes `PackagingModel` CLI-internal, binds both the direct build verb and a named TS-AppHost `pipeline.addStep(...)`, and gates both emitted boundaries. §B.2 leaves PM-20 as pure extraction and assigns schema move/publication to SD-2, matching corpus issue #531. |
| 4. RFC board adjustments | PARTIAL | SD-7 now depends on the concrete two-mode lifecycle slices, SD-8 blocks on SD-7, #543's Windows caveat is explicitly superseded, and prior hazards have named owners. The board is still not dependency-complete because SD-2 omits #456a and SD-4 omits SD-1. |
| 5. Risk register | PARTIAL | The cycle-4 hazards now have rows, but “interrupted install/uninstall/purge” is not mitigated by an uninstall-only replay gate. Migration-barrier, rollback-failure, per-machine authority/port, signed-replay, re-pin, and bootstrap-version hazards remain absent. |
| 6. Gate set | PARTIAL | Aspire publish, missing-`current` cold reboot, real Windows bootstrap replacement, non-cooperative containment, snapshot ACLs, wrong-key/tamper, proxy denial, and blocking conformance gates are present. Installer/purge recovery and the fresh state/authority/security cases in the checklist are not. |
| 7. jsr-audit | CLOSED | All four previously omitted surfaces (`@netscript/config`, `PackagingModel`, PM-A, maintenance types) now have explicit public/internal status and an audit owner. Deploy-core publication is aligned to SD-2. |

## Open-decision sweep (evaluator-run)

1. **Installer operation state machines.** Define install, repair, uninstall, and purge with the
   same precondition/effect/recovery rigor as §C.4. Split pre-registration provisioning from unit
   registration and health-gated first start; decide resume versus compensation at every crash
   point. State explicitly that purge is irreversible and roll-forward-only once its barrier is
   journaled. Naming `provisioning/registering/removing` does not make those effects recoverable.
2. **Migration barrier and failed rollback.** Journal each migration step and write the barrier
   record before executing an irreversible step, so recovery distinguishes crash-before,
   crash-during, and crash-after barrier. Add a terminal `rollback-failed`/`maintenance` outcome
   when the previous release or snapshot restore fails, and define when snapshots from a
   `rolled-back` transaction are deleted.
3. **Per-machine authority and containment.** Lock how the installer grants the unelevated updater
   narrowly scoped permission to stop/start only this app's systemd/Servy units and to migrate and
   restore only this app's data. Clarify that pipe/guardian containment is the embedded per-user
   realization, while per-machine descendants are contained by explicit OS-unit policies; do not
   set the pipe-EOF supervised-mode flag on an OS unit whose stdin is immediately closed.
4. **Per-machine endpoint ownership.** Dynamic ports solve N per-user installs, not two distinct
   per-machine NetScript apps. Choose install-time port reservation/conflict refusal with actionable
   diagnostics, or a dynamic discovery contract for machine scope, and prove coexistence or clean
   refusal.
5. **Update eligibility and durable trust.** A valid signature authenticates bytes but not
   freshness. Lock a monotonic sequence/from-version rule so automatic update cannot replay or
   downgrade; reserve intentional downgrade for an explicit authorized recovery transaction. An
   installer/repair re-pin must obtain the new key from an independently trusted installer/input,
   never the downloaded manifest. Also freeze/version the bootstrap journal preamble or add a
   `minBootstrapVersion` refusal/installer-upgrade path so a stable old bootstrap can recover a
   journal written by a newer worker.

## Evidence-integrity spot-checks

- **Launch-only supervision is confirmed.**
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203-204,367-388` observes child
  exit only during readiness, then retains only failure cleanup and unload teardown. There is no
  post-start monitor/restart/UI propagation. Research §1.1/§1.7 and plan L0.2 use this correctly.
- **Release activation and Windows non-atomicity are confirmed.**
  `packages/cli/src/public/adapters/service-activation-port.ts:4-20,85-88,136-152` resolves
  `releases/<id>` behind `current`; POSIX uses temp-link+rename, while Windows removes then recreates
  the junction. Rev 5 correctly makes the journal—not pointer atomicity—the recovery authority.
- **The milestone split is evidence-backed.** `corpus/md/board-search.md:85-94` records #452–#458
  at beta.11 and #543 at beta.12. The saved #456 body in `corpus/ns-search-single-runtime.json`
  depends on #452 and #454. Keeping the PM-independent single-runtime lane in beta.11 while moving
  graph mode behind PM avoids over-blocking; OF-C properly surfaces the re-scope for ratification.
- **Deno Desktop update evidence is used correctly.**
  `corpus/files/resources__deno-desktop__auto_update.md:14-25,148-187` says only the runtime dylib
  is patched and Windows stages without applying. L0.7 correctly excludes `Deno.autoUpdate()` as an
  authority and uses it only as possible future patch transport.
- **Aspire derivation and PM-20 ownership are grounded.**
  `packages/cli/src/kernel/templates/aspire/helpers/types.ts:39-47,63-93` carries the generator's
  typed app/service/plugin/tool inputs, whereas
  `packages/aspire/src/domain/aspire-resource.ts:9-18` is too weak as a packaging source. Corpus
  issue #327 makes the TS AppHost step graph foundational, and
  `corpus/md/board-pm-subissues.md:548-571` makes PM-20 pure extraction with new deploy features out
  of scope. Rev 5's §B.2/§B.4 ownership split matches both sources.

## Sequencing and scope findings

- §A.1's core judgment is sound: #451/#453/#454/#455 and the single-artifact #452/#456a/#457a lane
  remain beta.11, while PM-consuming singleton-graph work moves behind the beta.12 PM bar to
  beta.13. The plan does not over-block the PM-independent lane.
- §A.2's PM-1 and PM-5 additions are acceptance-sized and evidence-backed. PM-A is larger, but it
  is a separately enumerated draft with OF-G, not a silent expansion of the ratified epic.
- §E.1's G1–G8 ownership is exact-one and SD-5/SD-H are explicitly subordinate/hardening work, not
  hidden co-owners.
- The shared/divergent table in §D is coherent: the transport seam enforces only transport, while
  one schema/pipeline family plus SD-7's seven-row conformance suite is the actual anti-fork
  enforcement point.

## Stop-line audit

- The saved `corpus/ns-820-comments.json` is an empty array; `drafts/` and `FILING-LOG.md` are
  absent. No local artifact indicates a #820 comment or board filing.
- Raw Git ground truth before this write showed checkout `f391190f`, `origin/main` `47cc2fa9`, and
  no tracked source diff. The run directory and unrelated workspace directories were already
  untracked.
- This evaluator made no GitHub call, implemented nothing, and modified only this `plan-eval.md`.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Research/artifact currentness** — reconcile `worklog.md`'s Design section and
   `context-pack.md`'s Completed section to rev 5/cycle 5. Remove the retired shim,
   updater-through-`current`, PM-20 schema-move, and old cycle-disposition claims while preserving
   that loop continuation is process authorization, not design/filing ratification.
2. **Decisions locked + installer semantics** — replace §B.1's state-name-only installer sequence
   with journaled preconditions, effects, and recovery for install/repair/uninstall/purge, including
   registration, first start, sustained health confirmation, compensation/resume, and irreversible
   purge policy. Reconcile §A.3/§B.3 into an explicit per-user versus per-machine supervision and
   containment matrix.
3. **Update lifecycle and authority** — add durable per-step migration/barrier records, a
   rollback-failure terminal and rolled-back snapshot cleanup policy, least-privilege
   service-control/data-migration grants for the updater, per-machine endpoint-conflict policy,
   signed replay/downgrade rules, trusted repair-time re-pin provenance, and stable-bootstrap
   journal compatibility/refusal rules.
4. **RFC board ordering** — add `#456a` to SD-2's dependencies and `SD-1` to SD-4's dependencies;
   propagate any new owner/slice required by fixes 2–3. Keep the repaired SD-7→SD-8 ordering and
   exact-one G1–G8 ownership.
5. **Risk register** — add every unresolved hazard named in the failed risk row, each with one
   blocking draft, mitigation, and concrete fault/security gate. Do not claim install/purge safety
   from an uninstall-only test.
6. **Gate set** — add transition-complete installer/purge fault injection; migration
   before/during/after-barrier and failed-rollback cases; real least-privilege Win/Linux updater
   service/data tests; machine-scope port coexistence/refusal; signed replay/downgrade, trusted
   re-pin, and bootstrap-version cases; and per-machine OS-unit descendant containment. Retain all
   already-added rev-5 gates and the full archetype/overlay sets.

## Notes

Rev 5 materially closes the cycle-4 headline defects and the RFC's core direction is coherent. The
remaining blockers are state-machine completeness, least-privilege machine-scope authority, and an
executable dependency/gate path—not the PM-first milestone split, Aspire-model derivation, or the
two-mode composition strategy.
