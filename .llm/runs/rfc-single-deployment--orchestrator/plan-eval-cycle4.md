# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f6feb-5c94-7181-a30c-e2bc9a9a39a3` / 2026-07-17
- Generator separation: this Codex evaluator session is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Evaluation cycle: 4, owner-authorized after the two-cycle escalation
- Surface / archetype: planning-only seed/RFC; downstream work spans Archetype 2 Integration,
  Archetype 3 Runtime/Behavior, Archetype 4 SDK/DSL, Archetype 5 Plugin, Archetype 6 CLI, and the
  composite Archetype 7 Deployment Target Adapter pattern
- Scope overlays: downstream `SCOPE-service`, `SCOPE-frontend`, and `SCOPE-docs`
- RFC Plan-Gate interpretation: `plan.md` §E is the commit-slice substitute; every G1–G8 gap must
  have one owner, and the draft board must be bounded and dependency-ordered. This PLAN-EVAL is the
  run's gate of record. No implementation gate was run.

## Checklist results

| Plan-Gate item                                                         | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current                                           | FAIL   | `research.md` exists and Part 0 is a genuine re-baseline from checkout `f391190f` to `origin/main` `47cc2fa9`; raw refs and the unchanged deploy-spine diff were rechecked. The cycle-3 artifact-currentness fix is not complete, however: `context-pack.md:12` still says cycle 4 is pending despite `worklog.md:77,101` recording thread `019f6feb…`; `supervisor.md:28-30` stops at cycle 3; `worklog.md:78` puts a stale rev-3 write after the rev-4/cycle-4 events; `worklog.md:86-90` says no drift despite the five entries in `drift.md`; and `worklog.md:10` says no overlays while the active plan binds three. The run is not resume-consistent enough to post a canonical RFC.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Decisions locked                                                       | FAIL   | Rev 4 is self-contained and locks several useful decisions, but five load-bearing locks are unsound or incomplete. (1) §A.3's cooperative pipe-EOF watcher is owned by the NetScript service-entrypoint harness, while §D expressly admits non-cooperative external tool processes; it therefore cannot justify the claim that every Linux sidecar is contained. (2) §C.3 locates the per-machine updater executable behind `current`, but §C.4 permits a Windows crash after deleting that junction; the next updater cannot start through a path that does not exist. (3) the running per-user shim renames/replaces its own stable executable without a Windows-safe non-running bootstrap sequence, contradicting §C.1's loaded-artifact avoidance. (4) §C.4 writes migration snapshots into `releases/<from>` even though §C.2 defines releases as immutable, signed/hash-verifiable code snapshots and §B.3 gives install-root read access different semantics from the data root. (5) §B.4 defers the Aspire publish step-graph edge to TRACK even though #820 and #327 require the installation layer to live inside the Aspire publish/deploy stack. Additional unresolved maintenance and trust decisions are listed below. |
| Open-decision sweep                                                    | FAIL   | The evaluator found rework-forcing decisions that §H's “Nothing else is open” statement omits: universal containment for raw/external executables; a stable cold-boot recovery authority when `current` is absent; a Windows-safe shim replacement protocol; the mutable/ACL-protected snapshot location and cleanup policy; the installed update-signing trust anchor and key-rotation posture; `PackagingModel` package/export ownership plus a named Aspire publish step; routing of `repair`/`upgrade`/`recover` without fattening `DeployTargetPort`; crash-safe install/uninstall/purge states (the update-only §C journal does not define them); and authorization of the new `/_svc` proxy against another local user/process. These are architectural contracts, not implementation tunables.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| RFC board adjustments (enumerated, scoped, ordered, exact-one G owner) | FAIL   | §E.1 does give G1–G8 exactly one top-level owner, and §E.2 has fewer than 30 bounded rows with slice-specific gates. The DAG is not executable as written. `SD-7` claims to run both modes and assert release/update plus provisioning, but depends only on #451 + SD-2; it lacks the graph host and lifecycle slices that make those assertions possible. `SD-8` then omits SD-7, so the anti-fork conformance gate is not on the final path. §B.2 silently expands PM-20 into moving and publishing new install/release schemas, while corpus issue #531 says PM-20 is pure extraction with “New deploy features” explicitly out of scope; no PM-20 adjustment appears in §A.2 or §E.2. The `#543 (scope unchanged)` row also conflicts with the saved #543 contract, whose Windows stages-not-applies caveat must change under L0.7. Finally, SD-1/SD-4/#456a do not own gates for raw-executable containment, cold-boot recovery with missing `current`, or actual Windows shim replacement.                                                                                                                                                                                                                                      |
| Risk register                                                          | FAIL   | §G covers junction interruption, torn journals, launch exclusion, client quiescence, ACLs, and barriered migrations, but its mitigations assume the broken locks above. Missing risks include a non-NetScript executable surviving Linux parent death; the updater unit being unlaunchable after the Windows missing-junction interval; replacement of the running Windows shim; mutable/user-data snapshots inside an immutable/readable release tree; bootstrap trust-key substitution/rotation; proxy access by another local user/process; and interrupted install/uninstall/purge despite no corresponding journal states. Each needs a blocking owner and fault/security gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Gate set selected                                                      | FAIL   | §I.1 correctly says the §E.2 gates augment the full archetype matrices, binds F-CLI as `PENDING_SCRIPT` with manual evidence, binds the full overlays, and names this PLAN-EVAL as the gate of record. The selected proving set is still incomplete for the chosen design: it lacks an `aspire publish` step-graph emission proof; a cold-reboot fault at the exact Windows unlink/recreate interval; a real Windows shim self-update/restore test; a hard-kill test containing a deliberately non-cooperative raw executable; immutable-release plus snapshot-ACL assertions; manifest wrong-key/tamper/rotation tests; negative cross-user proxy access; and the SD-7→SD-8 dependency that makes cross-mode conformance blocking.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Deferred scope explicit                                                | PASS   | §B.5 and §I.3 explicitly defer macOS, fleet/MDM/MSIX/stores, rings, per-user instance brokering, PM-35, serverless, and the Linux OS backstop (with OF-H). This check does not validate the incorrect assertion that cooperative pipe EOF covers external tools; that defect is recorded under decisions, risks, and the owner-fork sweep.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| jsr-audit surface scan (pkg/plugin)                                    | FAIL   | §I.2 applies the full rubric and correctly marks the beta.11 CLI-kernel schemas internal/N/A with a reason. It does not enumerate all planned public or cross-package surfaces: `deploy.targets.<member>.package` in `@netscript/config`; the cross-package `PackagingModel`/compiler input (or an explicit internal placement); PM-A's adoption/reconcile contract (or an internal declaration); and any public capability/operation types introduced for `repair`/`recover`/`upgrade`. Its PM-20 row also assumes a public `./install` + `./release` expansion that the saved PM-20 issue explicitly excludes. Each surface must be named, assigned an export/internal status, and audited at the slice that actually publishes it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Cycle-3 required-fix audit (real closure, not reference)

| Cycle-3 sweep item                                        | Result                                    | Fresh verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Canonical self-contained RFC + artifact reconciliation | PARTIAL                                   | The RFC itself is now self-contained: §B.5, §C.2/C.4/C.5, and §D are inline, and no normative “as rev N” dependency remains. The run-artifact reconciliation is not closed; the `context-pack.md`, `supervisor.md`, and `worklog.md` contradictions are listed in the first checklist row.                                                                                                                                                                                                                                             |
| 2. Cross-platform parent-death containment                | NOT CLOSED                                | §A.3 cleanly distinguishes orderly teardown from parent-death containment and adds Windows Job Objects plus an honest Linux-backstop fork. But the cooperative layer is implemented by NS-P1's NetScript entrypoint harness; the RFC's own graph mode includes Garnet-class and other external tool processes (§D:309-314; research §1.4/§1.8). Those processes do not watch the NetScript pipe contract, so OF-H does not disclose the actual beta.13 Linux consequence and G1 is not closed.                                         |
| 3. Aspire source + publish boundary                       | PARTIAL                                   | The typed generator-emitted `PackagingModel` is a real improvement and current generator inputs do carry apps/services/plugins/tools, ports, and references. The `build→plan/emit` invocation is also concrete. However, §B.4:182-186 explicitly defers the Aspire step-graph integration, while corpus issue #327 defines Aspire `publish`/`deploy` and its step graph as the deployment foundation. The model's package/export ownership is also unstated, so this is not yet an installation layer inside the Aspire publish stack. |
| 4. Per-user endpoint ownership                            | CLOSED for the cycle-3 collision question | §B.3a's dynamic sidecar ports + port-free same-origin `/_svc` paths reconcile runtime allocation with build-time VITE replacement, and SD-8 names a two-user simultaneous graph gate. The separate local-user/process authorization question is a fresh security sweep item, not a reopening of the collision decision.                                                                                                                                                                                                                |
| 5. Per-machine quiescence + updater self-update           | PARTIAL                                   | §C.5 genuinely closes client-window quiescence: refuse-by-default, `--force` notice/grace, and version-handshake refuse/relaunch are explicit. Updater self-update is not closed: when Windows crashes during remove-then-recreate, an updater whose executable path itself resolves through missing `current` cannot run the claimed recovery preamble. The per-user shim sequence also lacks a Windows-safe non-running replacement step.                                                                                            |
| 6. Beta.11 shell/package ownership                        | CLOSED                                    | §A.1 and §E.2 retain the packaging hook in #452 and give #456a dependencies on both #452 and #454, matching the saved #456 body.                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7. OF-D timing                                            | CLOSED                                    | §F separates the pre-filing architectural seam choice from the implementation-deferred concrete installer builder.                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Open-decision sweep (evaluator-run)

1. **Containment for every manifest resource.** Decide how a raw executable that cannot implement
   the NetScript service-entrypoint pipe contract is contained after a hard-killed Linux window. A
   generic EOF guardian/wrapper, a beta.13 cgroup/PDEATHSIG backstop, or an explicit exclusion of
   external tools are materially different contracts. Update OF-H with the real ship consequence and
   prove hard-kill containment using a deliberately non-cooperative executable.
2. **Cold-boot update authority.** Put a recovery bootstrap at a stable path independent of
   `current`, or pin the updater unit to a concrete retained release and define when/how its unit
   target advances. Prove a reboot after the Windows junction is removed but before it is recreated.
3. **Windows shim replacement.** Define a sequence in which no running/locked shim is renamed or
   overwritten (for example a stable bootstrap plus versioned/dual-slot workers), including which
   handshake process exits before commit. Prove it on Windows; a mock rename test is insufficient.
4. **Snapshot and trust roots.** Move migration snapshots to a journal-owned, mutable, ACL-protected
   transaction/data area outside immutable signed releases; lock retention, cleanup, and repair/hash
   behavior. Separately pin the Ed25519 trust key/key-id at install time outside the downloaded
   manifest and decide whether v1 supports signed key rotation or explicitly pins one key.
5. **Aspire publish ownership.** Name the package and export status of `PackagingModel`, name the
   generator output/pipeline step that emits it, and bind the existing build verb into #327's Aspire
   publish step graph in SD-2. The proving gate must invoke that boundary and inspect the emitted
   manifest/staged tree, not only call the compiler from a scaffold fixture.
6. **Maintenance operation contract.** §B.1 names `repair` and `upgrade`; §C.4 adds `recover`; §I.0
   simultaneously says not to fatten `DeployTargetPort`. Decide whether these are application use
   cases composed from the canonical ops or a separate narrow maintenance contract, and define the
   router/registry/capability mapping. Also define operation-tagged install/uninstall/purge journal
   states; the update state table cannot by itself make interrupted uninstall recoverable.
7. **PM-20 boundary.** The saved #531 body says pure extraction and excludes new deploy features.
   Either move/publish the beta.11 schemas in SD-2 after PM-20 creates the package, or enumerate an
   explicit PM-20 re-scope/dependency in §A.2/§E.2 for owner ratification. Do not call the new
   public `./install`/`./release` surface “ratified acceptance.”
8. **Composition gate ordering.** Make SD-7 depend on the concrete single-runtime and graph slices
   needed to assert all seven shared rows (including provisioning and update), then make SD-8 depend
   on SD-7, or fold the conformance suite into SD-8. Reconcile #543's saved Windows-update caveat
   with L0.7 so it cannot reintroduce `Deno.autoUpdate()` as a second authority.
9. **Per-user proxy authorization.** Dynamic ports solve collision, not local-user isolation. Lock
   how the native window authenticates to `/_svc`, how the proxy rejects another local user/process,
   and whether application service auth is preserved rather than bypassed. Add a negative
   cross-login test alongside the simultaneous-graph test.

## Evidence-integrity spot-checks

- **Launch-only supervision confirmed.** In
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203,367-388`, child status is
  consulted only while waiting for readiness; after launch there is no monitor/restart/UI state
  propagation, only failure cleanup and unload teardown. Research §1.1/§1.7 and L0.2 use this
  evidence correctly.
- **Activation layout and Windows non-atomicity confirmed.** In
  `packages/cli/src/public/adapters/service-activation-port.ts:4-20,85-88,136-152`, releases sit
  behind `current`; Linux creates a temporary symlink then renames it, while Windows removes the
  junction before creating the replacement. Rev 4 correctly rejects pointer atomicity, but this same
  evidence invalidates recovery by an updater whose own executable is reachable only through
  `current`.
- **Tier-4 milestone split confirmed.** `corpus/md/board-search.md:85-94` records #452–#458 at
  beta.11 and #543 at beta.12. The PM-independent/PM-dependent split is evidence-backed and avoids
  blocking the single-runtime lane on PM. The saved #456 body in
  `corpus/ns-search-single-runtime.json` requires both the #452 shell and #454 artifact; rev 4 now
  preserves both edges.
- **Deno Desktop update evidence is used correctly, then contradicted by the shim sequence.**
  `corpus/files/resources__deno-desktop__auto_update.md:14-25,148-187` limits patching to the
  runtime dylib and says Windows stages but does not apply because a loaded artifact cannot be
  replaced. L0.7 correctly demotes it to optional future transport, and the directory-level release
  swap is the right combined-artifact direction. §C.3 still needs a Windows-safe way to replace the
  stable launcher itself.
- **Aspire source evidence is real but publish integration is absent.** The current generator input
  in `packages/cli/src/kernel/templates/aspire/helpers/types.ts:39-47,63-93` carries the typed
  app/service/plugin/tool slices needed to emit a packaging snapshot; runtime
  `packages/aspire/src/domain/aspire-resource.ts:9-18` is indeed too weak. Conversely, corpus issue
  #327 makes the `aspire publish`/`aspire deploy` step graph foundational, while §B.4 defers that
  edge to TRACK.
- **PM-20 scope conflict confirmed.** `corpus/md/board-pm-subissues.md:548-571` scopes #531 to a
  pure deploy-core extraction, says new deploy features are non-scope, and lists the concrete
  existing OS-service/convention/registry surface. Rev 4's new public install/release schema move is
  therefore a proposed re-scope, not ratified PM-20 acceptance.

## Stop-line audit

- `corpus/ns-820-comments.json` remains an empty array; `drafts/` and `FILING-LOG.md` are absent.
  The artifacts still gate the #820 comment and all filing on an earned verdict plus owner
  ratification.
- Raw Git ground truth showed no tracked source diff. The run directory and unrelated workspace
  artifacts were already untracked; this evaluator did not modify or adopt them.
- This evaluator made no GitHub call, implemented nothing, and wrote only this `plan-eval.md`.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Research/artifact currentness** — reconcile `context-pack.md`, `supervisor.md`, and
   `worklog.md` to cycle 4: evaluator thread/route, event order, five drift entries, active
   overlays, and the post-verdict state. Preserve the distinction between loop authorization and
   design/filing ratification.
2. **Decisions locked + open sweep** — resolve open-decision items 1–6 and 9 above in normative
   §§A–D. In particular, make containment cover raw executables, give both update authorities a
   Windows-safe stable bootstrap, keep mutable snapshots out of immutable releases, pin the update
   trust root, lock maintenance routing/journal semantics, and authorize the per-user proxy.
3. **Aspire/PM sequencing** — bind SD-2 to a named Aspire publish step while retaining the build
   verb as the reusable contract; name `PackagingModel` ownership/export status; and move the schema
   extraction to SD-2 or explicitly surface the PM-20 re-scope as an owner-ratified board change.
4. **RFC board adjustments** — repair §E.2 so SD-7 depends on the slices required to exercise both
   modes and SD-8 blocks on SD-7; reconcile #543's saved update acceptance; and add the concrete
   owners/scopes/dependencies for cold-boot recovery, raw-executable containment, Windows shim
   replacement, trust-root handling, proxy authorization, and operation-tagged uninstall recovery.
5. **Risk register** — add every missing hazard named in the risk checklist row, with one blocking
   draft and a specific fault/security test for each.
6. **Gate set** — retain §I.1's full archetype/overlay binding, and add end-to-end evidence for the
   Aspire publish boundary, missing-`current` cold reboot, real Windows shim replacement,
   non-cooperative child containment, immutable-release/snapshot ACLs, manifest trust failures,
   cross-user proxy denial, and blocking SD-7 conformance.
7. **jsr-audit** — enumerate `@netscript/config` package config, `PackagingModel`, PM-A, and all
   public maintenance operation/capability types (or mark each internal with a reason); align the
   deploy-core `./install`/`./release` audit with the slice that actually publishes those surfaces.

## Notes

The core milestone judgment is sound: keeping the genuinely PM-independent single-runtime lane in
beta.11 while moving singleton-graph supervision behind the beta.12 PM bar avoids over-blocking. The
per-machine client-quiescence decision and the prose-level shared/divergent composition table are
also materially improved. The blockers are the recovery/containment bootstrap holes and the fact
that the draft board does not yet force the RFC's strongest contracts to land in dependency order.
