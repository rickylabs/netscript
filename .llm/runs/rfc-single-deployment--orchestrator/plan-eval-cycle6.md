# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f701c-c73d-7671-bb67-75b37e747f34` / 2026-07-17
- Generator separation: this Codex evaluator session is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Evaluation cycle: 6, owner-authorized after the cycle-2 escalation
- Surface / archetype: planning-only seed/RFC; downstream drafts span Archetype 2 Integration,
  Archetype 3 Runtime/Behavior, Archetype 4 DSL/SDK, Archetype 5 Plugin, Archetype 6 CLI, and the
  composite Archetype 7 Deployment Target Adapter pattern
- Scope overlays: downstream `SCOPE-service`, `SCOPE-frontend`, and `SCOPE-docs`
- RFC Plan-Gate interpretation: `plan.md` §E is the commit-slice substitute; it must be enumerated,
  bounded, dependency-ordered, and give every G1–G8 research gap exactly one owner. This
  separate-session evaluation is the run's gate of record. No implementation gate was run.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` exists and Part 0 explicitly re-baselines the carried POC/board material. Raw Git still resolves checkout `f391190f` and `origin/main` `47cc2fa9`. `plan.md` is rev 6, and `worklog.md` Design, `context-pack.md`, `supervisor.md`, and `drift.md` now agree on cycle 6, the five drift entries, and the distinction between loop authorization and filing ratification. The evidence spot-checks below confirm the principal POC, activation, milestone, PM-20, and Deno Desktop claims. |
| Decisions locked | FAIL | Rev 6 genuinely locks the cycle-5 items: installer/update journals, barrier-before-irreversible migration, rollback-failed maintenance, scoped updater grants, per-machine port policy, replay/version checks, stable bootstraps, and mode-specific containment. Four cross-section contracts remain incomplete. (1) The installer state table does not journal the machine-wide port claim or the other durable installer-created authorities as lifecycle effects, so failed install/uninstall/repair has no locked claim/grant/account cleanup or retention policy and concurrent installers can race `ports.json`. (2) A release may change `services[]`, fixed ports, unit definitions, or identity, but the per-machine updater is deliberately authorized only to start/stop existing units and write the app data root; the RFC neither forbids install-graph changes during automatic update nor gives an elevated reconfiguration path. (3) the on-demand per-machine updater has no boot trigger/order that guarantees journal recovery before enabled workload units start after a crash with `current` absent. (4) the automatic-update sequence rule does not say whether an authorized `recover --to` or trust-key re-pin lowers/resets the replay high-water mark. |
| Open-decision sweep | FAIL | §H says “Nothing else is open,” but the four decisions above change journal/schema fields, authority boundaries, installer compensation, OS-unit topology, and security gates. Containment also has an unclosed ownership decision: §A.3 relies on systemd `KillMode=control-group` and “Servy process-tree kill,” while the current renderer does not emit `KillMode`, the repo/corpus does not establish a Servy descendant guarantee, and no implementation draft owns a fallback if SD-8 disproves the assumption. Separately, the generic child-side parent-liveness/descendant-cleanup primitive is assigned to NS-P1 plugin entrypoints rather than a named core owner, contrary to the Archetype-5 thinness law. These are all “must resolve now,” not safe implementation tunables. |
| RFC board adjustments (< 30, bounded, ordered, exact-one G owner) | FAIL | §E.1 does assign G1–G8 exactly once, §E.2 has 20 rows, the cycle-5 edges `SD-2 ← #456a` and `SD-4 ← SD-1` are present, and SD-7 blocks SD-8. The board is not implementation-ready for the unresolved contracts: SD-3 does not own transactional port-claim/grant/account lifecycle or an automatic recovery unit; SD-4 does not own/refuse install-graph mutations; no slice owns a proven per-machine Servy containment realization/fallback; and NS-P1 owns a convention-bearing watcher without a prior core slice. Those omissions make the scopes and dependency order incomplete even though the original G-map remains exact-one. |
| Risk register | FAIL | §G carries every cycle-5 named hazard with a blocking gate. It omits the hazards exposed by rev 6 itself: concurrent/stale/leaked machine-wide port reservations; automatic update crossing an installer-owned topology/identity/port boundary; reboot with no actor ordered to reconcile a non-terminal journal before workload startup; replay high-water behavior after authorized downgrade or key re-pin; and an unverified per-machine Servy descendant-containment assumption. |
| Gate set selected | FAIL | §I.1 correctly binds full archetype sets, F-CLI manual evidence, all three overlays, scoped wrappers, `quality:scan`, `arch:check`, this evaluation, `scaffold.runtime`, and `e2e-cli-prod`; all cycle-5-requested fault/security cases now appear. Missing are: concurrent reservation + crash/release/reconcile tests; unchanged-versus-changed install-graph update tests; an unattended reboot recovery gate that requires no working control plane/manual upgrade command; recover/re-pin sequence high-water tests; and evidence/fallback gates for both systemd and Servy per-machine descendant containment. The NS-H1 row also selects Archetype 3 for `packages/service`, while doctrine assigns `@netscript/service` Archetype 4; it must bind the Archetype-4 profile plus runtime/consumer gates rather than fragmenting one package across archetypes. |
| Deferred scope explicit | PASS | §B.5 and §I.3 explicitly defer macOS, MDM/GPO/fleet/MSIX/stores, rings, per-user instance brokering, PM-35, serverless, and the Linux OS-enforced backstop. OF-H states the beta.13 Linux residual. |
| jsr-audit surface scan (pkg/plugin) | PASS | §I.2 applies the planned-surface rubric to every identified public entrypoint: deploy-core `./install`/`./release`, `@netscript/config`, maintenance/capability types, PM-1/PM-A contracts, plugin `./services`, and SDK/widget surfaces. The beta.11 CLI-kernel schemas and `PackagingModel` are INTERNAL/N/A with concrete non-export reasons. The scan names metadata/docs/examples, explicit export maps and types, slow-type risks, permissions, publish file filters, full-export-map doc lint, dry-run, consumer import, and post-publish evidence. |

## Cycle-5 required-fix audit (real closure, not reference)

| Cycle-5 required fix | Result | Fresh verification |
| --- | --- | --- |
| 1. Research/artifact currentness | CLOSED | Design and context artifacts now describe rev 6/cycle 6 and no longer carry the retired shim, updater-through-`current`, or PM-20 schema-publication claims. |
| 2. Decisions locked + installer semantics | NOT CLOSED | §B.1a adds the requested install/repair/uninstall/purge table, registration/health-confirm split, install-failure compensation, purge barrier, and journal-last rule. It does not include the new global port reservation, updater grants, broker group/account, and related durable install effects in the state machine; their crash compensation/retention and repair/uninstall reconciliation remain undefined. The single “repair (all states)” row also presupposes per-step journaling without enumerating those resource effects. |
| 3. Update lifecycle and authority | PARTIAL | Per-step migration records, barrier timing, rollback-failed maintenance, snapshot retention, scoped service/data grants, port-conflict policy, sequence checks, re-pin provenance, and bootstrap compatibility are present. Install-graph mutation authority, cold-boot invocation/ordering, and replay high-water behavior across authorized recovery/re-pin remain open. |
| 4. RFC board ordering | CLOSED for the named cycle-5 edges | SD-2 now depends on #456a and SD-4 on SD-1; SD-7→SD-8 remains correct. Fresh scopes/owners required by items 2–3 are absent. |
| 5. Risk register | CLOSED for the named cycle-5 hazards | Every hazard listed by cycle 5 has a §G row. The fresh rev-6 hazards listed in the checklist are not registered. |
| 6. Gate set | CLOSED for the named cycle-5 cases | Transition-complete install/purge faults, barrier before/during/after, failed rollback, least-privilege negatives, two-app port policy, replay/re-pin/bootstrap cases, and per-machine descendant assertion are all named. The fresh concurrency/topology/boot/high-water/containment-realization gates are absent. |

## Cycle-4 required-fix audit (retained rev-6 text)

| Cycle-4 required fix | Result | Fresh verification |
| --- | --- | --- |
| 1. Research/artifact currentness | CLOSED | All resumable artifacts reach rev 6/cycle 6 and preserve the authorization-versus-ratification boundary. |
| 2. Decisions locked + cycle-4 open sweep | CLOSED for cycle-4 scope | Guardian containment, stable journal-first bootstraps, no running-binary replacement, data-root snapshots, pinned trust, maintenance routing, and proxy authorization remain normative. Later completeness findings are tracked under the cycle-5/fresh sweep above. |
| 3. Aspire/PM sequencing | CLOSED | §B.4 binds both the reusable build verb and a named TS-AppHost publish step; `PackagingModel` is CLI-internal. §B.2 leaves PM-20 pure extraction and makes SD-2 the move-and-publish slice. |
| 4. RFC board adjustments | CLOSED for cycle-4 scope | SD-7 has the two-mode lifecycle dependencies, SD-8 blocks on SD-7, and #543's stale Windows caveat is explicitly superseded. |
| 5. Risk register | CLOSED for cycle-4 scope | All nine cycle-4 hazards remain represented in §G. |
| 6. Gate set | CLOSED for cycle-4 scope | Aspire publish, missing-`current` reboot, real bootstrap replacement, raw-child containment, snapshot ACL, trust failures, proxy denial, and blocking conformance evidence remain named. |
| 7. jsr-audit | CLOSED | The four formerly omitted surfaces have explicit public/internal status and the public deploy-core audit is owned by SD-2. |

## Open-decision sweep (evaluator-run)

1. **Installer-owned durable resources and the global port registry — must resolve now.** Define a
   lock/transaction protocol for `ports.json`, the exact reservation point, app/install identity,
   cleanup or intentional retention after install failure, release on uninstall, stale-claim repair,
   and behavior under two concurrent installers. Put port claims, updater grants, broker
   group/account creation, service registration, and their compensations into §B.1a's journaled
   effects rather than leaving them outside the state machine.
2. **Per-machine install-graph compatibility — must resolve now.** Decide whether automatic update
   may add/remove services, change fixed ports, unit definitions, workload identity, or grants. The
   recommended least-privilege shape is to bind each release to an installed-graph
   digest/version, permit the updater only when it matches, and refuse with “installer/repair
   required” otherwise. The alternative is to grant narrowly scoped unit-definition/registry
   mutation authority and prove it; either choice changes manifests, privileges, SD-3/SD-4 scope,
   and fault gates.
3. **Per-machine reboot recovery actor — must resolve now.** An on-demand updater that can parse a
   journal is not automatically invoked after power loss. Lock an installer-created recovery unit
   or equivalent boot ordering that runs before every workload/control-plane unit whenever the
   journal is non-terminal or `current` is missing. The reboot gate must prove unattended
   reconciliation, not manually start the updater after boot.
4. **Replay high-water across recovery and trust re-pin — must resolve now.** Keep an
   ever-accepted sequence high-water distinct from the active release sequence so authorized
   downgrade does not make old signed manifests eligible again. Define whether re-pin preserves
   that sequence namespace or performs an explicitly authorized epoch reset sourced from the
   installer/operator, then gate both paths.
5. **Containment ownership and proof — must resolve now.** Cite/prove the effective systemd and
   Servy descendant behavior, make the required unit configuration explicit, and assign an
   implementation owner/fallback if the current wrapper does not contain descendants. Put the
   child-side pipe-EOF plus descendant-cleanup convention in a named core surface; NS-P1 plugin
   entrypoints should thinly consume it, not originate/reimplement it across plugins.

The concrete installer builder behind the ratified OF-D seam, tunable timeouts/ports, token-broker
IPC primitive, manifest field spelling, and rollout rings remain safe to defer as §H says.

## Evidence-integrity spot-checks

- **Launch-only supervision is confirmed.**
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203-204,367-388` observes
  child exit only during readiness and retains only startup-failure cleanup plus unload teardown;
  there is no post-start monitor/restart/UI propagation. Research §1.1/§1.7 and L0.2 use it
  correctly.
- **Release activation and Windows non-atomicity are confirmed.**
  `packages/cli/src/public/adapters/service-activation-port.ts:4-20,85-88,136-152` resolves
  `releases/<id>` behind `current`; POSIX uses temp-link+rename and Windows removes then recreates
  the junction. Rev 6 correctly makes the journal/direct release path—not pointer atomicity—the
  recovery authority.
- **The Tier-4 milestone split is evidence-backed.**
  `corpus/md/board-search.md:85-94` records #452–#458 at beta.11 and #543 at beta.12; the saved
  #456 body in `corpus/ns-search-single-runtime.json` depends on #452 and #454. Keeping the
  PM-independent single-runtime lane in beta.11 while moving graph mode behind PM is sound and
  avoids over-blocking.
- **Deno Desktop update evidence is used correctly.**
  `corpus/files/resources__deno-desktop__auto_update.md:14-25,148-187` limits patching to the
  runtime dylib, says Windows stages without applying, and uses an update-ok file as its launch
  sentinel. Rev 6 does not copy that single-file mechanism: its fsynced `confirmed` journal record
  after sustained health is the combined-artifact sentinel equivalent.
- **Aspire derivation and PM-20 ownership are grounded.**
  `corpus/md/board-core.md:218-227` makes the TS AppHost publish step graph foundational, while
  `corpus/md/board-pm-subissues.md:548-571` makes PM-20 a pure extraction with new deploy features
  excluded. §B.2/§B.4 correctly put the generated packaging snapshot plus publish-step binding and
  schema publication in SD-2 rather than silently expanding PM-20.
- **The per-machine containment assertion is not yet evidence-backed.**
  `packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:103-137` does not emit
  `KillMode`, and `packages/cli/src/public/adapters/servy-os-service.ts:31-61` merely delegates
  to Servy; the checked-in Servy XML renderer has no descendant-containment setting. This does not
  prove upstream Servy lacks the behavior, but it means §A.3's load-bearing “Servy process-tree
  kill” claim has no corpus/tree trace. A later assertion-only e2e gate is not an implementation
  owner or fallback.

## Sequencing, installer, update, and composition findings

- §A.1's split is sound: the genuinely PM-independent single-runtime lane stays beta.11, while the
  singleton-graph lane consumes the beta.12 PM engine in beta.13. §A.2's PM-1/PM-5 additions are
  acceptance-sized, and PM-A is a separately enumerated draft/owner fork rather than silent PM
  scope creep.
- §B.4 is genuinely inside the Aspire stack: one generator-derived typed snapshot feeds the
  compiler, the direct deploy build verb is reusable, and SD-2 also owns the named
  `pipeline.addStep(...)` publish integration with emitted-artifact evidence. The failure is in
  installer resource lifecycle and per-machine reconfiguration, not in Aspire citizenship.
- §C's journal/direct-path design closes the junction partial-switch hazard, migration ambiguity,
  rollback-failure loop, and single-file `Deno.autoUpdate` mismatch. It does not yet close who
  wakes recovery after a per-machine reboot or whether an update may cross the installer-owned
  graph boundary.
- §D's shared/divergent split is coherent. The transport seam enforces only transport; the shared
  manifest/pipeline family plus SD-7's seven-row two-mode suite is the actual anti-fork enforcement
  point.
- OF-A..OF-H are surfaced, but the install-graph update policy, sequence epoch/high-water policy,
  and containment fallback/core placement are additional owner/rework forks that §H currently
  takes silently.

## Stop-line audit

- The saved `corpus/ns-820-comments.json` is an empty array; `drafts/` and `FILING-LOG.md` are
  absent. No local artifact indicates a #820 comment or board filing. This evaluator did not make a
  GitHub call, so it does not claim a fresher live-board read than the saved corpus.
- Raw Git ground truth before this write showed checkout `f391190f`, `origin/main`
  `47cc2fa9`, no tracked source diff, and the run directory already untracked.
- This evaluator implemented nothing and modified only this required `plan-eval.md`.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Decisions locked + open-decision sweep — installer lifecycle.** Extend §B.1a with the durable
   side effects the installer actually creates: globally locked port reservation, updater grants,
   broker group/account, units/shortcuts/registration, and their journaled compensation,
   retention, repair, uninstall, and stale-claim rules. Define concurrent-install and crash
   behavior explicitly.
2. **Decisions locked + open-decision sweep — per-machine updates.** Lock the install-graph
   compatibility rule for service/port/unit/identity/grant changes and the authority that handles
   an incompatible release. Add an installer-created, least-privilege recovery unit/ordering that
   reconciles a non-terminal journal or missing `current` before workload startup after reboot.
3. **Decisions locked + open-decision sweep — replay semantics.** Separate active sequence from an
   ever-accepted high-water mark, state what `recover --to` does to each, and define re-pin
   sequence-epoch continuity or an explicitly authorized reset. Old valid signatures must remain
   ineligible after a recovery unless the installer-authorized policy says otherwise.
4. **Decisions locked + open-decision sweep — containment/core ownership.** Replace the unsupported
   per-machine containment assertion with an evidence-backed, explicitly rendered/configured
   systemd + Servy contract and a named implementation fallback/owner. Move the generic child-side
   liveness and descendant-cleanup primitive to core; keep NS-P1 as thin plugin entrypoint wiring.
5. **RFC board adjustments.** Propagate fixes 1–4 into bounded SD/PM/NS draft scopes and explicit
   dependencies (or add drafts where one row becomes too broad), without disturbing exact-one
   G1–G8 ownership or SD-7→SD-8. Surface any product choice as a numbered owner fork instead of
   silently selecting it.
6. **Risk register.** Add one blocking owner, mitigation, and concrete fault/security gate for:
   concurrent/stale/leaked port claims; install-graph-incompatible updates; unattended reboot
   recovery; recover/re-pin sequence rollback; and per-machine descendant containment failure.
7. **Gate set.** Add the corresponding concurrent installer/crash-reconcile, graph-change
   accept/refuse, no-manual-intervention reboot, sequence-high-water/re-pin, and real
   systemd/Servy containment/fallback gates. Correct NS-H1 to the `@netscript/service`
   Archetype-4 profile plus runtime and consumer gates. Retain every already-added cycle-5 gate and
   the full archetype/overlay matrices.

## Notes

Rev 6 closes the five specifically enumerated cycle-5 mechanics far enough to expose the remaining
cross-boundary defects. The PM-first milestone split, Aspire-model publish integration,
combined-artifact journal direction, JSR scan, and two-mode composition strategy are sound. The
blockers are now installer-owned resource lifecycle, least-privilege per-machine reconfiguration
and boot recovery, replay high-water semantics, and evidence-backed containment ownership.
