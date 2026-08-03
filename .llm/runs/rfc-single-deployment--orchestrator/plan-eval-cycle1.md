# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f6fa1-b09a-7542-a582-8cd60055eaca` / 2026-07-17
- Generator separation: evaluator session above is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Surface / archetype: planning-only seed/RFC; proposed downstream work spans Archetype 7
  (Archetype 2 core + Archetype 6 router), Archetype 5 plugins, and the Archetype 4 SDK surface
- Scope overlays: run records `none`; the described downstream work requires docs, service, and
  frontend overlays
- Evaluation cycle: failure 1 of 2

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | FAIL | `research.md` exists and its POC/board claims are well cited, but it explicitly baselines the repo at `f391190f`. The checkout's `origin/main` is `47cc2fa`, 12 commits ahead, and the intervening changes include the directly relevant Vite discovery and Aspire registration generators (`packages/aspire/src/application/build-vite-env-var-name.ts` and four `generate-register-*.ts` files). This is not a current-main re-baseline. |
| Decisions locked | FAIL | Several load-bearing choices are internally contradictory or do not yet define a viable contract: §A.1 delays all of #456 and #457 despite their PM-independent single-runtime work; §A.2 adds process-adoption semantics to PM-6 and transport/client semantics to the contract-only PM-9; §B.2 and §B.3 assign two different supervisors to Linux per-user installs and never choose the per-machine data/service identity; §C labels a remove-then-create Windows junction operation atomic and does not identify a durable apply/recovery authority; §D says the transport seam enforces contracts it cannot observe. |
| Open-decision sweep | FAIL | §H says no rework-forcing decision is silently deferred, but the evaluator sweep below finds unresolved topology, identity, transaction-recovery, migration, and conformance decisions not represented by OF-A..E. |
| Commit slices (&lt; 30, gate + files each) | FAIL | In the RFC adaptation, §E's board adjustments are enumerated and broadly scoped, but are not dependency-ordered and contain no exact-one G1–G8 ownership map. G1 appears split between SD-1 and PM-36; G3 appears split between SD-4 and the re-scoped #456. §E also claims full texts exist in `drafts/`, while that directory is absent and `context-pack.md` says drafts are post-gate work. |
| Risk register | FAIL | §G has a useful initial register, but its Windows-junction mitigation is invalid under process crash, power loss, reboot, or a concurrent launcher: stopping the graph removes active readers, not the missing-`current` interval. It also omits the per-machine identity/ACL, privileged maintenance, self-update authority, and interrupted-migration recovery risks. |
| Gate set selected | FAIL | §I correctly names this evaluation as the run gate and names broad downstream archetypes, but does not assign gates per draft issue. It omits the SDK Archetype 4 surface, docs/service/frontend overlays, required `scaffold.runtime` coverage for Aspire/helper/plugin generation, the post-publish `e2e-cli-prod` target for published shapes, and platform/fault-injection gates for installer and update transactions. Moving all of #457 to beta.13 also leaves the beta.11 single-runtime lane without its own deploy E2E owner. |
| Deferred scope explicit | PASS | §B.3, §C.2, and §I explicitly defer macOS installation/notarization, rings, fleet/MDM, multi-host or multi-instance concerns, and unrelated serverless work. |
| jsr-audit surface scan (pkg/plugin) | FAIL | §I merely says downstream deploy-core inherits `jsr-audit`; it neither marks the present RFC N/A with a reason nor applies the rubric to the planned public `InstallationPort`/manifest surface and new plugin service entrypoints. Because the RFC plans published package/plugin surfaces, a planned-surface scan is applicable. |

## Open-decision sweep (evaluator-run)

1. **Single-runtime release train.** #456 currently owns the PM-independent single-artifact
   packaging/release server and #457 owns its deploy E2E. Moving both wholesale to beta.13 means
   #451/#453/#454/#455 can land in beta.11 but cannot complete the RFC's “one artifact, one install,
   one update” promise or its target gate. OF-C surfaces only #456 and recommends the blocking
   option; #457 is not included in that fork.
2. **PM adoption ownership.** “Adopt-and-reconcile” needs durable process identity, PID/command
   validation, stale-registry behavior, ownership of adopted members, restart authority, and
   teardown semantics. PM-3's KV registry existence does not decide these. This is not a small
   PM-6 acceptance note. Separately, an in-process client transport is outside PM-9's locked
   18-route contract and belongs with PM-11/#451/SD-7.
3. **Per-machine identity and data ownership.** The RFC does not choose whether a per-machine graph
   is one machine-wide tenant, one graph per interactive user, or a privileged broker for user
   instances. Consequently the service account, ACLs, secrets location, per-user data root,
   first-run actor, and multi-user behavior are undefined.
4. **Per-user Linux supervision.** §B.2 says the window embeds the PM engine and registers no OS
   service; §B.3 says per-user Linux uses `systemd --user`. Those imply different owners, lifetime,
   restart behavior, uninstall behavior, and UI-health paths.
5. **Update transaction authority and crash recovery.** The per-user “supervisor host” cannot be
   assumed to replace/relaunch/health-confirm itself. The RFC must choose a stable launcher/updater
   authority, define an exclusive transaction lock and durable journal, and specify recovery from
   every crash boundary. On Windows, `DirSwapActivationPort` removes `current` before recreating it;
   a stopped graph does not make that pointer update atomic.
6. **Migration barrier semantics.** §C both refuses automatic rollback across an irreversible
   barrier and promises snapshot restore on rollback. It does not define who restores, which data
   stores are snapshotted, what happens after new-version health failure, when the confirmation
   window closes, or which release remains active while manual recovery is required.
7. **Composition enforcement.** `ServiceClientTransport` can enforce HTTP versus in-process RPC
   selection only. It cannot enforce the shared discovery/Vite contract, data layout, install
   manifest, release manifest, first-run phase, or telemetry identity. A shared typed manifest and
   cross-mode conformance suite (or equivalent enforcement point per shared contract) is still an
   architectural decision.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **Research present and current** — re-baseline `research.md`, `plan.md`, and relevant drift
   against current `origin/main` (at least `47cc2fa` in this checkout). Re-check the changed Aspire
   resource/Vite discovery generators and current deployment debt, then state what did or did not
   change. Do not retain `f391190f` as “current main.”
2. **Decisions locked** — repair the five unsound design areas:
   - split #456/#457 into a beta.11 PM-independent single-artifact substrate + gate and a beta.13
     singleton-graph extension, or explicitly justify and owner-fork the loss of beta.11
     install/update completion;
   - keep PM adjustments acceptance-sized: either specify the full adoption state/ownership
     contract in a separately owned issue or remove it from PM-6, and move the PM-9 transport
     requirement to its actual transport/composition owner;
   - define one supervisor and one provisioning/elevation model per platform/scope, including the
     per-machine service account, data/secrets/ACL model, repair/uninstall authority, and first-run
     actor;
   - define a crash-recoverable update state machine owned by a stable authority, including lock,
     journal, Windows pointer recovery, health confirmation, rollback window, and migration-barrier
     outcomes;
   - replace the “one transport seam enforces everything” claim with enforceable shared contracts
     and cross-mode conformance gates.
3. **Open-decision sweep** — add the evaluator decisions above as numbered owner forks marked
   “must resolve before filing,” or lock each one with evidence and rationale. Seed-run owner choice
   may remain at ratification, but it may not remain invisible in §H.
4. **RFC board adjustments** — add an explicit dependency DAG/order for every adjustment and a
   table mapping each G1–G8 to exactly one owning draft ID; label other issues as dependencies or
   subordinate slices rather than co-owners. Reconcile §E's nonexistent `drafts/` claim with the
   post-gate sequence in `context-pack.md`.
5. **Risk register** — replace the “no reader exists” Windows mitigation with a power-loss-safe
   recovery design and add mitigations for service identity/ACLs, privileged maintenance,
   updater self-replacement/concurrency, and interrupted or barriered migrations.
6. **Gate set selected** — give each proposed issue its archetype, overlay, and proving gates.
   Include the SDK surface, docs/service/frontend overlays, `scaffold.runtime` wherever generated
   Aspire/plugin output changes, `e2e-cli-prod` as the published-shape authority, mode-specific
   desktop deploy E2E, real Windows/Linux install/repair/uninstall tests, and update fault-injection
   tests (including crash-mid-junction and migration rollback/barrier cases).
7. **jsr-audit surface scan** — apply the rubric now to the planned deploy-core exports and plugin
   service subpaths: export-map placement, explicit/slow types, JSDoc/module docs, publish file list,
   permissions, generated-asset portability, and consumer imports. If the run instead claims N/A,
   §I must say so with a defensible reason; “planning-only” alone is insufficient when published
   surfaces are being designed.

## Notes

### Evidence integrity spot-checks

- **Launch-only supervision confirmed.** In
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203,367-389`, `child.status` is
  observed only during startup readiness; after the sequential spawn loop there is no monitor or
  restart loop, only reverse-order signal teardown. The RFC's motivating finding is sound.
- **Shipped activation convention confirmed, with a material caveat.** In
  `packages/cli/src/public/adapters/service-activation-port.ts:1-20,130-153`, releases live under
  `releases/<id>` and Linux uses temp-symlink + rename, while Windows explicitly removes and
  recreates the junction because replacement is non-atomic. §C correctly reuses the convention but
  overstates the Windows apply guarantee.
- **Board milestones confirmed.** `corpus/md/board-search.md:85-94` records #452–#458 at
  `0.0.1-beta.11`; the PM corpus records #512–#544, including #543, at beta.12. The sequencing defect
  is real.
- **Deno Desktop evidence used correctly.** `corpus/files/resources__deno-desktop__auto_update.md`
  states that bsdiff applies only to the runtime dylib and that Windows downloads/stages but does
  not apply. The failure is in the RFC's generalized transaction design, not its reading of this
  source.
- **Aspire-stack placement is directionally sound.** §B.1 derives a typed manifest from the Aspire
  model, emits installer artifacts as a publish step, and reuses `OsServicePort`; this satisfies the
  “inside the Aspire stack” intent. The unresolved scope/identity contracts prevent it from being
  implementation-ready.

### Stop-line audit

- No local evidence of issue filing, comments, labels, milestones, or other board mutation was
  found; run artifacts consistently record the #820 comment as post-gate work.
- This evaluator made no GitHub calls and modified only this file.

