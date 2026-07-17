# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f6fd5-eb50-7720-aa56-ba37e473cfd4` / 2026-07-17
- Generator separation: evaluator session above is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Evaluation cycle: 3, owner-authorized after the two-cycle escalation
- Surface / archetype: planning-only seed/RFC; downstream work spans Archetype 2 Integration,
  Archetype 3 Runtime/Behavior, Archetype 4 SDK/DSL, Archetype 5 Plugin, Archetype 6 CLI, and the
  composite Archetype 7 deployment pattern
- Scope overlays: downstream `SCOPE-service`, `SCOPE-frontend`, and `SCOPE-docs`

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | FAIL | `research.md` Part 0 is a real re-baseline against `origin/main` @ `47cc2fa9` and now reconciles the four deployment/runtime debt entries demanded by cycle 2. The run state is not current enough to resume or post, however: `context-pack.md:12-62` still says rev 2 is escalated and the seven cycle-2 decisions are open; `supervisor.md:25-31` records only cycles 1–2 and says there will be no #820 post from this run; `worklog.md:18-37` still presents a “rev 2 state” public-surface description containing the retired `InstallationPort`, with only a supersession note; and `drift.md` has no cycle-3 authorization/route reconciliation. This is the artifact-currentness part of cycle-2 required fix 1, not a cosmetic discrepancy. |
| Decisions locked | FAIL | Several cycle-2 locks are substantive, but the RFC is not a complete canonical design. `plan.md:157-158`, `174-175`, `200-202`, `217-218`, and `222-227` delegate platform, layout, base transaction, rollout, and the entire composition contract to “rev 2”; no rev-2 plan is archived, and rev 3 overwrote it. The missing base state semantics and shared/divergent table cannot be reconstructed from the cycle-2 verdict. In addition, `plan.md:83` incorrectly treats Linux descendant-kill plus orderly teardown as hard-parent-death containment; `plan.md:146-155` does not define a model that actually carries the claimed endpoints/dependency/env graph or bind the compiler to an Aspire publish step; and the per-machine design does not decide how already-running client windows or the updater unit itself are quiesced/versioned during an update. |
| Open-decision sweep | FAIL | The evaluator-run sweep below finds rework-forcing decisions still open or silently assumed: Linux hard-kill containment; the typed Aspire publish-time source model; the publish-step invocation/ownership; per-user multi-login endpoint allocation despite build-time VITE injection; per-machine running-client version skew during stop/swap/migrate; updater-unit self-update/recovery; and the missing beta.11 desktop-shell dependency. `plan.md:322-325` also classifies “installer tech inside OF-D” as safe to defer while simultaneously requiring OF-D before filing. |
| RFC board adjustments (enumerated, scoped, ordered, exact-one G owner) | FAIL | §E.1 does give G1–G8 exactly one top-level owner, and §E.2 has fewer than 30 bounded rows with an explicit `draft → depends on` reading. The dependency graph is still not implementation-ready. `#456a` depends only on `#454` (`plan.md:251`), while the saved #456 contract requires both the #452 shell and #454; the plan simultaneously removes #452's packaged responsibility (`plan.md:60,253`) and moves graph packaging to SD-2, leaving beta.11 packaging without an owner for its shell/publish integration. `PM-36` depends on the non-enumerated “SD-1 skeleton” while being a blocking subordinate of SD-1 (`plan.md:237,260-261`), so land/close order is undefined. G1 also remains only Windows-contained, and the table has no owner/gate for per-user endpoint collisions or per-machine client quiescence. |
| Risk register | FAIL | §G correctly covers the cycle-2 journal, Windows apply, ACL, auth, schema-move, and shim risks. It omits three load-bearing hazards established by the chosen scope: (1) a hard-killed Linux per-user window leaves its process group alive; (2) N per-user installs on one machine share the loopback port namespace while browser discovery is compiled in; and (3) a per-machine update can migrate/switch services while old client windows remain live against the old window bundle. It also does not cover self-update/recovery of the privileged updater unit. Each needs a blocking draft and a fault/e2e gate. |
| Gate set selected | FAIL | §E.2 materially improves archetype selection and fault gates, and §I.1 correctly records this run's gate of record plus `scaffold.runtime`, `e2e-cli-prod`, `quality:scan`, `arch:check`, and F-DEPLOY promotion state. It still does not select the complete downstream gate sets it claims are the single source: Archetype-6 rows do not bind F-CLI-1…31 (including `PENDING_SCRIPT` manual evidence); PM-1 and PM-5 omit the standard wrappers/quality/consumer surface; #543 names `SCOPE-frontend` but not its loading/error/responsive/browser checks; SD-3 names `SCOPE-docs` without source-alignment/link/terminology/drift checks; and no gate proves Linux hard-kill containment, multi-user port isolation, running-client update exclusion, or the actual Aspire publish-step emission. In-scope AP codes requested by cycle 2 are still absent except AP-1. |
| Deferred scope explicit | PASS | §B.3/B.5, §C.5, and §I.3 explicitly defer macOS, rings/channels, MDM/MSIX/stores/fleet, per-user instance brokering, PM-35, and unrelated serverless work. The failures above are not deferred extras; they are required semantics of the selected Win/Linux, per-user/per-machine v1 scope. |
| jsr-audit surface scan (pkg/plugin) | FAIL | §I.2 now contains most of the cycle-2 rubric and correctly treats JSR as applicable. It is not yet complete per planned public entrypoint. It does not say whether the beta.11 CLI-owned `InstallGraphManifest`/release contracts are exported or internal and therefore does not audit that beta.11 surface; it omits the public PM-1 probe-vocabulary addition and the SD-6 SDK client/widget surface; and it does not cover the package-level README/example, provenance, or declared runtime-compatibility score factors from the skill. Each new public surface must be named and receive the full rubric, or be explicitly marked internal/N/A with a reason. |

## Cycle-2 required-fix audit (fresh)

| Cycle-2 sweep item | Result | Fresh verification |
| --- | --- | --- |
| 1. Beta.11 Windows apply + PM-32 placement | CLOSED | L0.7 and §C.1 replace `Deno.autoUpdate()` with the snapshot transaction on every platform and give #457a a Windows apply/rollback proof. §A.1 correctly keeps #543 at beta.12 on the evidence-backed window-only contract. |
| 2. Exclusion, journal durability, confirmation, shim recovery | PARTIAL — rev-3 regression | §C.3/C.4 genuinely lock wait-or-fail launch exclusion, checksummed append-only JSONL, directory durability, sustained-health confirmation, and stable-root shim rollback. But the base per-state semantics were removed and replaced by an unresolvable “as rev 2” reference, and neither running per-machine clients nor updater-unit self-replacement is designed. The hardening is real; the lifecycle is still incomplete. |
| 3. Privilege separation + machine-wide client auth | CLOSED | §B.3 makes the updater identity the sole writer, confines the workload identity to read/execute plus its data root, and supplies per-user read-token minting over an OS-authenticated local channel with admin-only mutation. This directly closes the requested authority/auth split. |
| 4. Installation extension axis + uninstall | CLOSED | §B.1 retires `InstallationPort`, extends `DeployTargetPort`, reuses `OsServicePort`, places installer-artifact adapters behind the target, puts `repair` on the capability surface, and locks retain-by-default / explicit purge plus journaled interruption. |
| 5. PM prerequisite + containment bar | NOT CLOSED | PM-7/8/14 and PM-15/16/18 are now correctly represented, and PM-36 is beta.13-blocking. The closure claim is Windows-only: PM-5 can kill descendants when invoked and PM-8 performs orderly shutdown, but neither kills a POSIX process group automatically when the embedded window/supervisor itself is hard-killed. G1 therefore remains partially open on Linux. |
| 6. Shared manifest ownership | CLOSED | §B.2 names the beta.11 CLI-kernel owner, PM-20 move/re-export, beta.13 additive extensions, schema version, and compatibility rule. The cross-wave authority is no longer implicit. |
| 7. Aspire derivation boundary | NOT CLOSED | §B.4 names two conceptual inputs, but the cited current `AspireResource` surface has only `name`, `kind`, optional `port`, and untyped `metadata`; PM-23 only resolves that surface and does not own a typed endpoint/dependency/env graph. The RFC also no longer says which AppHost/Aspire publish pipeline step invokes the compiler. “Derived from Aspire” therefore remains an assertion at the two critical edges: source-model completeness and publish integration. |

## Open-decision sweep (evaluator-run)

1. **Canonical RFC contents.** Restore the complete rev-2 material inline (not by reference):
   platform boundary, release layout, every transaction state's precondition/effect/recovery action,
   migration/barrier/rollback semantics, downtime policy, and the full shared-versus-divergent
   composition table. A document to be posted as the canonical #820 proposal must stand alone.
2. **Cross-platform parent-death containment.** Choose and own a Linux mechanism for the per-user
   embedded-supervisor mode (for example a suitable cgroup/systemd transient scope, parent-death
   contract, or a different supervisor placement), add a hard-kill fault gate, or owner-ratify a
   Linux limitation and mark G1 partial. Process-group teardown is not parent-death containment.
3. **Aspire source and publish boundary.** Define a named typed source snapshot that actually
   contains resources, endpoints, dependency edges, environment/discovery, and provenance; state
   who emits it; and bind `InstallGraphManifest` compilation to a named Aspire/AppHost publish
   pipeline step or the existing deploy target's `plan/emit` path. Assign the change to a draft and
   prove the emitted artifact, not merely the pure function.
4. **Per-user endpoint ownership.** Decide how simultaneous per-user graph installs avoid
   machine-global loopback collisions without violating the evidence-backed rule that browser VITE
   discovery is build-time. Fixed manifest ports, dynamic allocation, and a stable window/proxy
   endpoint imply different contracts and cannot be left to implementation.
5. **Per-machine update quiescence.** Decide whether the updater refuses while any user window is
   live, coordinates shutdown across sessions, or guarantees an explicit old-client/new-service
   compatibility window. Also define how the pre-installed updater unit updates and rolls itself
   back; the per-user shim handshake does not automatically cover a running service authority.
6. **Beta.11 shell/package ownership.** The original #456 evidence depends on #452 + #454. Either
   keep the shell/package hook in #452 and add the dependency to #456a, move that bounded hook into
   #456a, or revise the beta.11 promise. Moving all packaged responsibility to beta.13 SD-2 while
   claiming beta.11 one-click packaging leaves an implementation hole.
7. **OF-D timing.** Separate the before-filing architectural fork (second-pass adapter versus an
   upstream hook) from the implementation-deferred concrete MSI builder. The same decision cannot
   be both safe to defer and mandatory before filing.

## Evidence-integrity spot-checks

- **Launch-only supervision confirmed.** In
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203,367-388`, `child.status` is
  observed only during readiness. After startup there is no monitor/restart/UI propagation; only
  explicit failure cleanup and an `unload` teardown callback exist.
- **Activation convention and Windows non-atomicity confirmed.** In
  `packages/cli/src/public/adapters/service-activation-port.ts:4-20,130-153`, releases live under
  `releases/<id>` behind `current`; Linux uses temp-symlink + rename, while Windows removes the
  junction before recreating it. Rev 3 uses this evidence correctly.
- **Milestone split and PM-32 placement confirmed.** `corpus/md/board-search.md:85-94` records
  #452–#458 at beta.11 and #543 at beta.12; `corpus/md/board-pm-subissues.md:888-910` describes #543
  as window-only console packaging with soft #456/#451 dependencies. §A.1's corrected placement is
  evidence-backed.
- **Deno Desktop update evidence used correctly.** `corpus/files/resources__deno-desktop__auto_update.md:14-26,148-187`
  says patches apply only to the runtime dylib and Windows stages without applying. L0.7 correctly
  demotes it to an optional future patch transport rather than update authority.
- **The beta.11 packaging dependency is missing.** The saved #456 body in
  `corpus/ns-search-single-runtime.json` explicitly depends on the #452 shell and #454 artifact.
  §E.2 preserves only #454 while excluding packaged scope from #452.
- **The claimed Aspire compiler input is not present in the current surface.**
  `packages/aspire/src/domain/aspire-resource.ts:1-18` on both the checkout and `origin/main`
  exposes only name/kind/optional port/untyped metadata. `corpus/md/board-pm-subissues.md:635-659`
  gives PM-23 a resolver over that shape, not ownership of a typed packaging graph. This is direct
  evidence against treating §B.4's mapping as closed.

## Stop-line audit

- Local evidence shows no board mutation: `corpus/ns-820-comments.json` is empty, there is no
  `drafts/` directory or `FILING-LOG.md`, and every run artifact still gates the #820 comment on a
  successful plan evaluation plus owner ratification.
- Raw Git ground truth shows no tracked source modification from this planning run. The run
  directory and unrelated pre-existing workspace files are untracked; this evaluator did not
  modify or adopt them.
- This evaluator made no GitHub call, implemented nothing, and wrote only this `plan-eval.md`.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **Research/artifact currentness** — reconcile `context-pack.md`, `supervisor.md`, `worklog.md`
   Design + Gate Results, and `drift.md` to rev 3/cycle 3. Record the owner authorization, evaluator
   route/session, current phase, current locked vocabulary, and the fact that posting remains gated.
2. **Decisions locked** — make rev 3 self-contained; replace every “unchanged/as rev 2” reference
   with the actual normative design. Lock Linux parent-death containment, typed Aspire source +
   publish integration, per-user endpoint allocation, per-machine running-client quiescence, and
   updater-unit self-update/recovery.
3. **Open-decision sweep** — resolve items 1–7 above in the design or surface each as a numbered
   owner fork with an explicit recommendation and ship consequence. Only tunable values and a
   concrete implementation backend behind an already-ratified adapter seam are safe to defer.
4. **RFC board adjustments** — repair #456a/#452 ownership and dependency; replace the undefined
   `SD-1 skeleton` edge with enumerated, closable slices (or fold PM-36 into SD-1); add Linux
   containment, endpoint isolation, running-client update exclusion, and updater self-recovery to
   the owning G1/G3/G4 drafts and to SD-8's dependency/gate proof.
5. **Risk register** — add the four omitted hazards named in the checklist and point each to a
   blocking issue plus a concrete hard-kill, multi-login, cross-session update, or authority
   self-recovery test.
6. **Gate set selected** — bind every draft to the complete chosen archetype matrix and overlays,
   including F-CLI manual/PENDING_SCRIPT evidence, F-DEPLOY after PM-20, in-scope AP codes,
   wrappers/consumer gates for PM adjustments, full frontend/docs overlays, and the new platform
   runtime/fault gates. Keep the table's slice-specific proving gate, but state that it augments
   rather than replaces the archetype gate set.
7. **jsr-audit surface scan** — enumerate every planned exported entrypoint (including the beta.11
   CLI manifest/release ownership, PM-1 public probe types, and SD-6 SDK surface) and apply the full
   skill rubric, including package-level README/examples, provenance, and runtime compatibility;
   explicitly mark truly internal surfaces N/A with a reason.

## Notes

The PM-independent/PM-dependent milestone split itself is sound: keeping the single-runtime lane in
beta.11 while moving only the supervised-graph extension behind PM avoids over-blocking. The failure
is not the split; it is the missing beta.11 shell edge and the incomplete contracts around the two
deployment scopes.
