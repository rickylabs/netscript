# PLAN-EVAL — rfc-single-deployment--orchestrator

- Plan evaluator session: `019f6fb5-8bf9-7ed0-9f8c-0568827a799a` / 2026-07-17
- Generator separation: evaluator session above is distinct from Fable 5 generator session
  `7f1fada7-805f-46cb-8ac4-5eb201bdc105`
- Run: `rfc-single-deployment--orchestrator`
- Evaluation cycle: 2 of 2 (final cycle before owner escalation)
- Surface / archetype: planning-only seed/RFC; downstream work actually spans Archetype 3
  Runtime/Behavior, Archetype 4 SDK/DSL, Archetype 5 plugins, Archetype 6 CLI, and the composite
  Archetype 7 deployment pattern (Archetype 2 core + Archetype 6 router)
- Scope overlays: downstream `SCOPE-service`, `SCOPE-frontend`, and `SCOPE-docs`; the run metadata
  still records `none`, which is stale

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | FAIL | `research.md` Part 0 genuinely re-baselines the code and board facts against `origin/main` @ `47cc2fa9`, and the VITE/deploy spot-checks are correct. It is not a complete current-state re-baseline, however: `research.md:44-46` presents `ISSUE-167-PLUGIN-REMOVE-UNINSTALL` as the current deployment debt while omitting the directly load-bearing open entries `DEPLOY-ARCHETYPE-7-CORE-SEED`, `DEPLOY-BAREMETAL-PUBLIC-WIRING`, `cli-deploy-linux-integration-untested`, and `runtime-app-wide-shutdown-orchestrator`. `worklog.md:20-31` and `context-pack.md:16-20,42-66` also still encode rev-1 decisions, including an “atomic” Windows switch, transport-as-global-enforcement, SD-1..7, and OF-A..E. |
| Decisions locked | FAIL | Rev 2 materially improves topology, migration barriers, and composition enforcement, but remains unsound in load-bearing areas. `plan.md:60,140-145` claims a complete beta.11 update story while retaining native `Deno.autoUpdate()` for the single-artifact substrate even though the cited source says Windows stages but never applies. `plan.md:63` moves PM-32 #543 behind graph packaging, although its corpus scope is a window-only console with #456/#451 as soft dependencies. `plan.md:119-123,164-171` gives the workload service identity write authority over releases and lets a launcher run against `current` during an exclusive update. `plan.md:97-101` adds an `InstallationPort` and duplicate CLI verbs without reconciling the shipped `DeployTargetPort` aliases or `OsServicePort`. `plan.md:175-211` does not make journal replacement tear-safe, and confirmation ends at first health rather than a sustained grace period. `worklog.md` and `context-pack.md` contradict the locked plan. |
| Open-decision sweep | FAIL | The evaluator-run sweep below finds rework-forcing decisions not represented by OF-A..OF-G: Windows beta.11 apply semantics; updater/workload privilege separation; machine-wide client authorization; installer-vs-deploy operation ownership and uninstall data policy; PM lifecycle/telemetry/containment prerequisites; shared manifest ownership across beta.11→beta.13; and the exact Aspire-model/config input boundary. |
| RFC board adjustments (enumerated, scoped, ordered, exact-one G owner) | FAIL | §E now has an owner map and milestone list, but it is not yet an implementation-ready draft board. SD-5 and PM-36 have no scoped issue contract; the arrows in §E.2 mean “precedes” in `#451 → #453` but appear to mean “depends on” in `SD-2 (→ NS-P1, PM-1)`, so dependency direction is ambiguous. G1 is nominally owned by SD-1 while containment is left to stable PM-36 after beta.13; G2 includes first-run provisioning but SD-5 is a separate, unmapped owner. SD-8 omits explicit SD-5/SD-6 dependencies. Full issue-body drafts may remain post-gate, but the plan-level contracts cannot. |
| Risk register | FAIL | §G adds the requested categories, but several mitigations are invalid or incomplete: a launcher that “degrades” to `current` can race the updater through the missing-junction interval; fsync of an in-place JSON journal does not prevent a torn/unparseable replacement; retaining an old shim inside a release does not recover a stable launcher path if the new shim cannot execute; and granting the workload identity write access to release directories defeats signed-artifact integrity. The register also omits cross-user control-plane authorization, the unsupported Windows beta.11 update promise, and beta.13-vs-stable containment drift. |
| Gate set selected | FAIL | §I.1 is a useful per-draft start and correctly names this run's gate of record, `scaffold.runtime`, `e2e-cli-prod`, platform install tests, and update fault injection. It selects the wrong/insufficient runtime profiles, however: SD-1 and PM-A own supervision/adoption lifecycle but are labeled Archetype 2; SD-4 owns a durable crash-recovery state machine but carries no Archetype 3 state/time/cancellation/failure gates; NS-H1 has no package archetype. The table omits PM-1/PM-5 additions, #452, #543, and PM-36; does not record current doctrine verdict/AP codes or the `F-DEPLOY-*` reviewed→gated state/debt; and lacks full frontend overlay checks for SD-6 plus JSR/doc/consumer gates for later deploy-core public additions. |
| Deferred scope explicit | PASS | §B.3, §C.5, and §I.3 explicitly defer macOS, rings/channels, fleet/MDM, multi-host, per-user instance brokering, clustering, and unrelated serverless work. |
| jsr-audit surface scan (pkg/plugin) | FAIL | JSR is correctly treated as applicable, not N/A. The scan is incomplete. `plan.md:362-365` requires only JSDoc one-liners for deploy-core ports, while the rubric requires module docs and examples on every entrypoint/public symbol. NS-P1 (`plan.md:366-370`) and SDK #451 (`plan.md:371-373`) do not name module docs/examples, complete export-map lint, publish include/exclude verification, or consumer-import gates. §I.1 also does not apply the audit to SD-3/SD-4/SD-5 when those slices add public deploy-core surfaces. This leaves cycle-1 fix 7 only partially addressed. |

## Cycle-1 required-fix audit

| Cycle-1 required fix | Cycle-2 disposition | Fresh verification |
| --- | --- | --- |
| 1. Re-baseline current main and deployment debt | PARTIAL | The `47cc2fa9` code re-baseline is real: the full VITE identifier normalization and `buildTauriBlock` exist on `origin/main`, and the deploy spine is unchanged. Relevant open deployment/runtime debt is not reconciled, and resume artifacts still carry the old baseline/design. |
| 2. Lock the five unsound design areas | PARTIAL | PM-A is correctly separated from PM-6, PM-9 stays contract-only, per-user Linux now has one supervisor, migration barriers have an honest maintenance state, and the transport seam is correctly narrowed. The beta.11 Windows updater, PM-32 sequencing, privilege/auth model, transaction lock/journal/confirm protocol, and cross-wave schema ownership remain unsound. |
| 3. Surface every rework-forcing decision | PARTIAL | OF-F/OF-G surface tenancy and adoption placement, but the evaluator sweep below finds seven additional decisions. |
| 4. Add a G1–G8 owner map and dependency-ordered board | PARTIAL | The tables exist; semantic ownership and dependency direction do not yet match their labels, and SD-5/PM-36 are not scoped. |
| 5. Repair the risk register | PARTIAL | The requested rows were added, but four mitigations rely on unsafe authority/locking/recovery assumptions and several new risks are absent. |
| 6. Select per-issue gates | PARTIAL | The major named gates were added, but archetype selection and issue coverage are incomplete. |
| 7. Apply the planned-surface JSR rubric | PARTIAL | Slow types, export placement, file lists, permissions, and portability are discussed; module docs/examples and full-entrypoint/consumer coverage are still missing. |

## Open-decision sweep (evaluator-run)

1. **Beta.11 Windows update and PM-32 placement.** #456a promises “one update” but §C.1 deliberately
   keeps the mechanism that cannot apply on Windows. The original #456 scope explicitly carried a
   Windows manual-apply fallback. Decide whether the stable launcher/updater substrate moves into
   #456a, Windows is excluded by an owner fork, or another tested apply mechanism owns it. Separately,
   #543's source contract is a window-only PM console (`corpus/md/board-pm-subissues.md:892-910`),
   not a singleton graph; keep it at beta.12 on #456a or surface evidence and an owner fork for the
   beta.13 move.
2. **Update exclusion, journal durability, confirmation, and shim recovery.** A launcher must wait
   or fail while an update journal is nonterminal; it cannot launch read-only through a moving
   `current`. Lock stale-owner semantics, atomic/append-only journal writes (including directory
   durability), a sustained-health confirmation/grace rule, and a bootstrap/rollback mechanism
   that works when the newly installed shim cannot start.
3. **Per-machine privilege and client authorization.** The workload account must be read/execute on
   release code and write only its data; a distinct updater capability/account must own release and
   `current` mutation. “No interactive UAC after install” can be achieved by a pre-installed updater
   unit, but that is still a privileged authority and must be named. Also decide how every
   interactive user's window authenticates/authorizes to the machine-wide PM control plane when
   PM-12 stores its bearer material for one 0o600-class service identity.
4. **Installation extension axis and uninstall semantics.** The shipped `DeployTargetPort` already
   maps `install`→`up` and `uninstall`→`down`, while `OsServicePort` owns OS-unit registration. Lock
   whether `InstallationPort` is a subordinate artifact adapter, an extension of the target port,
   or a distinct named axis; define router delegation and where `repair` lives. Lock uninstall's
   service/account/data/secrets retention or purge policy and its interrupted-operation recovery.
5. **PM prerequisite and containment bar.** Research maps log rotation, ordered teardown, and
   subprocess telemetry to PM-7/PM-8/PM-14, but §A declares only PM-1..6 and PM-9..13 prerequisite.
   Decide which of those lifecycle guarantees blocks SD-1 and which named SD issue owns an
   alternative without forking PM. PM-36 cannot both be “under SD-1's acceptance” and land at stable
   after beta.13; either make it a beta.13 blocking subordinate slice or explicitly owner-ratify a
   containment limitation and stop claiming G1 closed.
6. **Shared manifest authority across milestones.** #456a lands in beta.11, deploy-core is extracted
   by PM-20 in beta.12, and SD-2/SD-4 generalize the packaging/update schemas in beta.13. Name the
   beta.11 schema's stable owner, compatibility/versioning rules, and extraction path now so the
   single-runtime implementation is not retrofitted to the cross-mode contract after shipping.
7. **Aspire-model derivation boundary.** The Aspire resource graph can supply resources, endpoints,
   and dependencies, but scope, identity, signing, migration barriers, snapshot targets, and
   provisioning policy require typed NetScript deployment metadata. Lock the config/model extension
   and the compiler mapping into `InstallGraphManifest`; otherwise “derived from Aspire” is an
   assertion and the second-pass installer can become a parallel hand-maintained manifest.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Research present and current** — reconcile the directly relevant open debt entries named in
   the checklist with the proposed PM-20/SD work; correct the lingering “atomic” wording in
   `research.md` §2.2; and update `worklog.md` Design, gate state, `context-pack.md`, and evaluator
   route metadata to rev 2/cycle 2. The Design checkpoint must no longer preserve decisions that
   cycle 1 rejected.
2. **Decisions locked** — revise the RFC to: (a) give #456a a tested Windows apply/rollback path or
   explicitly narrow/fork the platform promise; (b) return #543 to its evidence-backed window-only
   sequence or owner-fork a changed scope; (c) reconcile `InstallationPort` with
   `DeployTargetPort`/`OsServicePort` and define manifest compiler inputs plus uninstall policy;
   (d) split updater privilege from workload privilege and define machine-wide client auth; (e)
   make lock/journal/confirm/shim recovery genuinely crash-safe; and (f) lock the PM containment
   bar and shared-schema ownership timeline.
3. **Open-decision sweep** — add each evaluator decision above as a numbered owner fork or lock it
   in the design with evidence. Anything affecting platform support, privilege, wire/schema
   compatibility, data deletion, or the beta.13 ship bar resolves before filing; only tunable
   defaults may remain implementation-deferred.
4. **RFC board adjustments** — replace §E.2 with an unambiguous `draft → depends on` table and give
   every new/re-scoped draft a title, bounded scope, milestone, dependencies, owning gap, and
   proving gate. Scope SD-5 and PM-36 explicitly; make SD-5 subordinate to G2's owner or remap G2;
   reconcile PM-36 with G1/SD-1's milestone; and include SD-5/SD-6 wherever SD-8 proves their
   acceptance. Keep the full prose issue drafts post-gate as the kickoff requires.
5. **Risk register** — add and validly mitigate: Windows beta.11 apply absence; launcher/update
   exclusion and torn-journal recovery; workload write access to executable releases; machine-wide
   local-client authorization; failed shim bootstrap; shared-manifest migration; and beta.13
   containment exposure. Risk mitigations must point to a blocking draft/gate, not merely “tested.”
6. **Gate set selected** — reselect/fold Archetype 3 for SD-1, PM-A, and the SD-4 durable runtime
   behavior; name NS-H1's real package archetype; record the current doctrine verdict, in-scope AP
   codes, relevant debt, and F-DEPLOY promotion state. Add rows for every proposed adjustment,
   including PM-1/PM-5, #452, #543, and PM-36. Apply runtime failure/cancellation/fake-clock gates,
   full frontend loading/error/responsive/browser checks, platform-specific #457a Windows update
   proof, consumer gates, doc-lint/publish gates, and the required service/docs overlays.
7. **jsr-audit surface scan** — apply the complete rubric to every planned published entrypoint:
   metadata/description, explicit export maps, `@module` docs, symbol docs with params/returns and
   runnable examples, explicit/fast types, ESM-only/relative self-imports, portable embedded assets,
   permissions, exact publish include/exclude list, full-export-map `deno doc --lint`, publish
   dry-run, and consumer imports. Cover deploy-core `./install`/`./release` across SD-2..SD-5,
   every NS-P1 `./services` entrypoint, and SDK #451. This RFC is not N/A for JSR because it designs
   public package/plugin surfaces.

## Notes

### Evidence-integrity spot-checks

- **Launch-only supervision is confirmed.**
  `corpus/files/apps__dashboard__lib__windows-singleton.ts:154-175,203,367-388` observes
  `child.status` only during startup readiness; after spawn there is teardown but no monitor,
  restart loop, or UI-state propagation.
- **The activation convention and Windows caveat are confirmed.**
  `packages/cli/src/public/adapters/service-activation-port.ts:4-20,130-153` uses
  `releases/<id>` + `current`; Linux temp-symlink rename is atomic, while Windows removes and then
  recreates the junction.
- **The milestone sequencing fact is confirmed.** `corpus/md/board-search.md:85-94` records
  #452–#458 at beta.11 and #543 at beta.12; the PM corpus records PM-1..PM-33 at beta.12.
- **The Deno Desktop evidence is used correctly but contradicts #456a's promise.**
  `corpus/files/resources__deno-desktop__auto_update.md:14-26,158-187` limits patching to the runtime
  dylib and says Windows stages without applying. Rev 2 correctly rejects it for graph mode but
  incorrectly calls it a complete Windows-capable single-artifact update substrate.
- **The current-main VITE re-baseline is confirmed.** `origin/main` @ `47cc2fa9` normalizes
  `workers-api` to `workers_api` in the full VITE identifier, and its generated app registration
  uses `buildViteEnvVarName`; the branch checkout at `f391190f` is older, exactly as Part 0 states.
- **PM-32 is not graph packaging in the evidence.**
  `corpus/md/board-pm-subissues.md:892-910` describes a packaged console with loopback or optional
  in-process client and soft #456/#451 dependencies. Nothing there requires SD-2/SD-4's adjacent
  graph.
- **Aspire-stack direction is sound.** §B.1 derives an install manifest from the app model, emits
  through an Aspire-publish step, and reuses `OsServicePort`. The blocking finding is the missing
  compiler-input/port-delegation contract, not a bolt-on-host design.
- **The cycle-1 PM and composition corrections are substantive.** PM-1/PM-5 additions are
  acceptance-sized, PM-A owns the larger adoption contract, PM-9 remains closed, and §D now limits
  the transport seam to transport while assigning other contracts typed schemas/conformance. Those
  improvements do not cure the new cross-wave ownership and release-gate gaps.

### Stop-line audit

- No local evidence of an issue, comment, label, milestone, or other board mutation exists. There is
  no `drafts/` or `FILING-LOG.md`; all run artifacts describe the #820 comment and board drafts as
  post-gate work.
- Raw Git ground truth showed no tracked source modification; this planning run is untracked as a
  run directory. The evaluator made no GitHub calls, implemented nothing, and wrote only this
  `plan-eval.md` file.
- This is the second failing evaluation cycle. Per the harness loop limit, the unresolved items now
  escalate to the owner; the RFC must not be posted to #820 from this run.
