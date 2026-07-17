# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f7034-bb62-7e61-82c5-4816ced88e95` / 2026-07-17
- Evaluator route: Codex · GPT-5.6 Sol · max
- Generator separation: this evaluator session is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Evaluation cycle: 7, owner-authorized after the cycle-2 escalation
- Surface / archetype: planning-only seed/RFC; downstream drafts span Archetype 2 Integration,
  Archetype 3 Runtime/Behavior, Archetype 4 DSL/SDK, Archetype 5 Plugin, Archetype 6 CLI, and the
  composite Archetype 7 Deployment Target Adapter pattern
- Scope overlays: downstream `SCOPE-service`, `SCOPE-frontend`, and `SCOPE-docs`
- RFC Plan-Gate interpretation: `plan.md` §E is the commit-slice substitute. It must be enumerated,
  bounded, dependency-ordered, and assign each research gap G1–G8 exactly one owner. This
  separate-session evaluation is the run's gate of record. No implementation gate was run.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` exists and Part 0 explicitly re-baselines the POC, board, deploy spine, and debt against `origin/main` `47cc2fa9`; raw Git still resolves checkout `f391190f` and that exact `origin/main`. The evidence spot-checks below confirm the launch-only supervisor, release activation, milestone split, Deno Desktop update limits, Aspire publish model, and current renderer capabilities. |
| Decisions locked | FAIL | Rev 7 locks the five cycle-6 architectural directions, but two executable lifecycle contracts remain contradictory or unrealizable. First, §B.1a declares uninstall complete only after deleting the install-root journal, then requires purge to write its irreversible barrier after uninstall `removing` is done even though §C.2 locates the journal in that deleted install root. The `failed` row is also reachable only from `starting`; failures after a port claim, provisioning, grant/account creation, or partial unit registration have no locked transition into compensation. Second, §C.3a's Linux realization requires an unowned `Requires=` renderer capability, and its Windows realization makes a short-lived recovery unit a service dependency even though an SCM dependency must be running before its dependent can run. |
| Open-decision sweep | FAIL | The purge-journal lifetime/failure transition and the per-platform boot barrier would force journal layout, unit topology, installer effects, and fault-gate rework, so they are “must resolve now.” Separately, §F adds OF-I/OF-J/OF-K, but the normative sweep at the end of §H still says only OF-A..OF-H must resolve and “Nothing else is open.” `worklog.md` Design and `context-pack.md` repeat the truncated fork set, and `plan.md`'s retained cycle-5 disposition plus the Design checkpoint still assert the retired Servy tree-kill assumption. |
| RFC board adjustments (< 30, bounded, ordered, exact-one G owner) | FAIL | §E.1 still assigns G1–G8 exactly once and §E.2 has 22 bounded rows. The dependency graph is not implementation-ready: PM-B is explicitly consumed by NS-P1 and the SD-1 guardian but neither row depends on PM-B; SD-3 wires the Job-Object primitive owned by SD-1 but does not depend on SD-1; and no draft explicitly owns/renders the Linux `Requires=` boot edge or a viable Windows recovery barrier. §E.1 itself says SD-1 depends on PM-B, contradicting §E.2, which is labeled the single source. |
| Risk register | FAIL | §G carries all five cycle-6 hazard themes and assigns blocking gates. It does not register (a) loss of the purge recovery record when the install root/journal is deleted, (b) failure during claiming/provisioning/registering before `starting`, or (c) boot-order failure when the current systemd renderer cannot emit the promised dependency or the short-lived Windows dependency exits. |
| Gate set selected | FAIL | §I.1 correctly binds the full archetype matrices, F-CLI manual evidence, all overlays, scoped wrappers, `quality:scan`, `arch:check`, `scaffold.runtime`, and `e2e-cli-prod`; NS-H1 is corrected to Archetype 4. The new tests are not yet sufficient to prove the unresolved contracts: SD-3 needs transition/effect-boundary compensation cases before `starting` and a purge crash after install-root removal; PM-15/SD-3 need emitted systemd dependency semantics; and SD-8 must prove the chosen recovery barrier on both real systemd and Windows SCM/Servy, not merely name an unattended reboot case. |
| Deferred scope explicit | PASS | §B.5 and §I.3 explicitly defer macOS, MDM/GPO/fleet/MSIX/stores, rings, per-user instance brokering, PM-35, serverless, and the Linux OS-enforced backstop. OF-H states the beta.13 Linux residual precisely. |
| jsr-audit surface scan (pkg/plugin) | PASS | §I.2 gives reasoned INTERNAL/N/A treatment to the beta.11 CLI-kernel schemas and `PackagingModel`, enumerates the public deploy-core/config/maintenance/PM/plugin/SDK surfaces, names slow-type/permission/publish-list risks, and binds full-export-map doc lint, dry-run, examples, consumer imports, and post-publish evidence. Rev 7's new public PM-B helper is explicitly included. |

## Cycle-6 required-fix audit (real closure, not reference)

| Cycle-6 required fix | Result | Fresh verification on rev 7 |
| --- | --- | --- |
| 1. Decisions/open sweep — installer-owned durable resources | PARTIAL | §B.1a now journals the port claim before registry mutation, serializes it with `ports.lock`, journals grants/accounts/units/shortcuts individually, reverse-compensates them, releases them on uninstall, and assigns stale-claim repair. That closes the specifically requested resource inventory. The containing state machine is still incomplete: early install failures cannot reach `failed`, and the purge barrier has no durable journal after uninstall deletes it. |
| 2. Decisions/open sweep — per-machine update compatibility + reboot recovery | PARTIAL | §B.2a's installed-graph digest match-or-refuse rule is closed and preserves the updater's least privilege. §C.3a names a recovery actor and intended order, but the Linux renderer lacks `Requires=` and the Windows short-lived dependency is not a valid locked SCM barrier. |
| 3. Decisions/open sweep — replay semantics | CLOSED | §B.2 separates active sequence from the ever-accepted high-water; `recover --to` never lowers it; re-pin preserves the namespace; reset is explicit, authorized, and journaled under OF-J. §E.2 and §G carry the corresponding tests and risk. |
| 4. Decisions/open sweep — containment/core ownership | PARTIAL | The live §A.3 decision is evidence-honest: PM-15 owns `KillMode=control-group`, PM-B owns the child helper, SD-1 owns the Job-Object primitive, and SD-3 wires it per-machine under OF-K. The retained cycle-5 disposition and Design checkpoint still say Servy tree-kill, and the PM-B/SD-1 dependency propagation is incomplete. |
| 5. RFC board adjustments | NOT CLOSED | New PM-B and PM-15 rows exist and SD-3/SD-4/SD-8 scopes grew, but the missing `NS-P1 ← PM-B`, `SD-1 ← PM-B`, and `SD-3 ← SD-1` edges violate the dependency-order contract. Recovery renderer/barrier ownership is still implicit. |
| 6. Risk register | PARTIAL | The requested port-claim, graph-boundary, reboot-actor, high-water, and per-machine containment rows exist. The fresh installer-journal and platform boot-barrier hazards above are absent. |
| 7. Gate set | PARTIAL | Concurrent claim/reconcile, graph digest accept/refuse, high-water/re-pin, unattended reboot, per-platform containment, and NS-H1 Archetype-4 corrections exist. The gates do not yet prove early-effect compensation, purge recovery after journal removal, or the actual systemd/SCM boot-order realizations. |

## Open-decision sweep (evaluator-run)

1. **Installer terminal/journal lifetime — must resolve now.** Decide whether `--purge-data` is one
   continuation of uninstall whose journal survives until all data deletion finishes, or a separate
   purge operation with a durable journal outside the install root. Define the exact completion
   record/location and crash recovery after the install root is gone. Also define which failures in
   `claiming`, `provisioning`, and `registering` transition to `failed` and invoke reverse
   compensation rather than retaining claims/grants indefinitely.
2. **Per-platform reboot barrier — must resolve now.** On Linux, assign the `Requires=` (and any
   oneshot/ordering) renderer surface to a named draft and bind it to SD-3. On Windows, choose a
   viable SCM/Servy realization: for example, a recovery dependency that remains running as the
   barrier, or a pre-launch/bootstrap mechanism on every app service. A plain short-lived service
   dependency is not enough: Microsoft documents that a dependency must be running before the
   dependent can run. This choice changes unit topology, installer registration, the install-graph
   digest, and gates, so it cannot be deferred.
3. **Owner-fork and artifact reconciliation — must resolve now.** The ratification brief must cover
   OF-A..OF-K, not OF-A..OF-H. Remove or explicitly supersede every retained Servy-tree-kill claim in
   `plan.md` §H and `worklog.md` Design, and update `context-pack.md` so a resumed stage-H session
   cannot silently skip OF-I/OF-J/OF-K.

The concrete builder behind OF-D, tunable timeouts/ports, token-broker IPC primitive, manifest field
spelling, and rollout rings remain safe to defer.

## Evidence-integrity spot-checks

- **Launch-only supervision is confirmed.**
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203-204,367-388` observes child
  exit only during readiness and retains only startup-failure cleanup plus unload teardown. No
  post-start monitor, restart loop, or UI propagation exists. Research §1.1/§1.7 and L0.2 use this
  evidence correctly.
- **Release activation and Windows non-atomicity are confirmed.**
  `packages/cli/src/public/adapters/service-activation-port.ts:4-20,85-88,136-152` resolves
  `releases/<id>` behind `current`; POSIX uses temp-link+rename and Windows removes then recreates
  the junction. Rev 7 correctly makes the journal/direct release path—not pointer atomicity—the
  recovery authority.
- **The Tier-4 milestone split is evidence-backed.**
  `corpus/md/board-search.md:85-94` records #452–#458 at beta.11 and #543 at beta.12. The saved #456
  body depends on #452 and #454. Keeping the PM-independent single-runtime lane in beta.11 while
  moving singleton-graph work behind the beta.12 PM engine is sound and avoids over-blocking.
- **Deno Desktop update evidence is used correctly.**
  `corpus/files/resources__deno-desktop__auto_update.md:14-25,148-187` limits patching to the runtime
  dylib, says Windows stages without applying, and uses an update-ok launch sentinel. Rev 7 does
  not copy that single-file mechanism; it uses a combined-artifact journal and sustained-health
  confirmation.
- **Aspire citizenship and PM-20 ownership are grounded.**
  `corpus/md/board-core.md:218-223` makes the TypeScript AppHost publish/deploy step graph
  foundational, while `corpus/md/board-pm-subissues.md:548-571` leaves PM-20 as pure extraction.
  §B.2/§B.4 correctly put the generated packaging snapshot, direct build verb, named publish step,
  and schema publication in SD-2 rather than expanding PM-20.
- **The new containment evidence is honest, but the reboot evidence is incomplete.**
  `packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:19-67,91-137` exposes `after` and
  `wants`, not `requires` or the RFC's complete recovery dependency. The Servy model can emit
  `ServiceDependencies` (`kernel/domain/deploy/servy-config.ts:68-69` and
  `kernel/adapters/windows/servy/servy-xml.ts:48-49,102-104`), but that only establishes a normal
  service dependency. The
  [Microsoft service-dependency contract](https://learn.microsoft.com/en-us/dotnet/api/system.serviceprocess.serviceinstaller.servicesdependedon?view=netframework-4.8.1)
  requires dependencies to be running before dependents run; it does not validate §C.3a's
  short-lived recovery-unit assumption.

## Sequencing, installer, update, and composition findings

- §A.1 remains sound: beta.11 keeps a complete PM-independent single-runtime path, while graph-mode
  desktop work lands after PM in beta.13. PM-1/PM-5/PM-15 are acceptance-sized changes; PM-A and
  PM-B are separately enumerated drafts rather than silent expansion of ratified PM issues.
- §B.4 is genuinely inside the Aspire stack: a generator-derived typed snapshot feeds one compiler,
  the direct deploy build verb is reusable, and SD-2 owns a named `pipeline.addStep(...)` publish
  integration with emitted-artifact evidence. The failure is installer/recovery state completeness,
  not Aspire citizenship.
- §C's journal-first direct-release design closes the Windows missing-junction interval, combined
  artifact partial switch, migration barrier, rollback-failure loop, replay high-water, and
  single-file `Deno.autoUpdate` mismatch. The purge journal and boot trigger realizations remain
  incomplete.
- §D's shared/divergent split is coherent. The transport seam enforces transport only; the shared
  manifest/pipeline implementation plus SD-7's seven-row two-mode conformance suite is the actual
  anti-fork enforcement point.
- OF-I/OF-J/OF-K are surfaced in §F, so their design choices are not silent there. The defect is that
  the normative open sweep and resumable artifacts still omit them, which can silently skip their
  ratification at the next phase.

## Stop-line audit

- Saved `corpus/ns-820-comments.json` contains zero comments; `drafts/` and `FILING-LOG.md` are
  absent. No local artifact indicates a #820 comment or board filing. This evaluator made no GitHub
  call and does not claim a fresher live-board read than the saved corpus.
- Raw Git ground truth before this write resolved checkout `f391190f`, `origin/main` `47cc2fa9`, no
  tracked source diff, and the run directory already untracked.
- This evaluator implemented nothing and modified only this required `plan-eval.md`.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Decisions locked + open-decision sweep — installer lifecycle.** Make uninstall/purge use a
   durable journal that survives until purge is terminal, with an unambiguous completion record and
   crash recovery after install-root deletion. Define failure transitions and compensation for
   `claiming`, `provisioning`, and every individually journaled `registering` effect—not only a
   failed first start.
2. **Decisions locked + open-decision sweep — reboot recovery.** Lock executable Linux and Windows
   boot-barrier designs. Assign/render the systemd dependency fields and oneshot semantics; replace
   or complete the short-lived Windows service-dependency design with a mechanism SCM/Servy can
   actually enforce before every workload/control-plane service starts.
3. **RFC board adjustments.** Add the explicit `NS-P1 ← PM-B`, `SD-1 ← PM-B`, and `SD-3 ← SD-1`
   edges (or move ownership so the graph is truthful), and assign the recovery renderer/barrier
   changes to bounded drafts. Preserve the exact-one G1–G8 owner map and SD-7→SD-8 ordering.
4. **Open-decision/artifact reconciliation.** Change the normative filing sweep to OF-A..OF-K and
   reconcile the retained cycle disposition, `worklog.md` Design, and `context-pack.md` with the
   Job-Object—not Servy tree-kill—contract. Do not let historical text remain normative in this
   self-contained rev.
5. **Risk register.** Add blocking rows for purge-journal loss/early install-effect failure and for
   failure of the actual systemd/Windows boot barrier, each naming its owning draft and gate.
6. **Gate set.** Add effect-boundary failure/compensation tests through claiming, provisioning, and
   registration; a purge crash/reboot after install-root removal; emitted systemd ordering tests;
   and unattended reboot proofs on both a real systemd host and Windows SCM/Servy for the chosen
   recovery realization. Retain every existing cycle-6 security/fault gate and NS-H1's corrected
   Archetype-4 binding.

## Notes

Rev 7 closes the cycle-6 graph-compatibility and replay contracts and chooses an evidence-honest
containment direction. The PM-first split, Aspire publish integration, journal-first combined update,
JSR scan, and cross-mode composition contract remain sound. The remaining blockers are precise:
installer terminal-state durability, an enforceable per-platform reboot barrier, dependency
propagation, and ratification-artifact consistency.
