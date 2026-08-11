# PLAN-EVAL — docs-rfc-runtime-versioned-automation--supervisor

- Plan evaluator session: fresh Codex GPT-5.6 Sol · xhigh evaluator / 2026-08-11 (owner override
  D-2)
- Run: `docs-rfc-runtime-versioned-automation--supervisor`
- Surface / archetype: docs RFC describing future ARCHETYPE-1/2/3/5/6 package, runtime, plugin, and
  CLI waves
- Scope overlays: `SCOPE-docs`; adversarial RFC architecture review; no implementation evaluation

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md:6-13` records the current baseline; `evidence/current-state-matrix.md:22-26` proves the package/plugin paths were unchanged from the named `origin/main`. I independently re-ran focused reachability searches and inspected the public `RuntimeTask`, `TaskDefinition`, and executor surfaces with `deno doc`.                                                  |
| Decisions locked                        | FAIL   | `plan.md:3-4` still calls the plan provisional; the load-bearing O2+O4 ownership choice is only a recommendation with a fallback (`rfc-0001-runtime-versioned-automation.md:416-423`) and is still an owner question (`:519-526`). The consistency and runtime-security contracts in findings 4-6 are also not decided strongly enough to slice.                              |
| Open-decision sweep                     | FAIL   | The plan contains no sweep classifying each open decision as safe to defer or must resolve now, despite the explicit owner-question list (`rfc-0001-runtime-versioned-automation.md:519-526`). The evaluator sweep below finds six decisions that would force rework.                                                                                                         |
| Commit slices (< 30, gate + files each) | FAIL   | The five docs-only bullets name neither files nor proving gates (`plan.md:66-74`), and `worklog.md:1-84` has no mandatory `## Design` section. The implementation roadmap is nine epic-sized waves with dependency columns but no per-slice files or gates (`rfc-0001-runtime-versioned-automation.md:457-474`). This fails `plan-protocol.md:34-40` and `run-loop.md:56-73`. |
| Risk register                           | FAIL   | A table exists (`plan.md:56-65`), but it omits the plan's load-bearing risks: cross-family partial activation, out-of-order feed/poll races, schema-skew split fleets, KV/Postgres semantic divergence, non-Deno T1 escape, unauthenticated snapshot integrity, secret output leakage, and unresolved cron ownership. Those omissions leave no mitigating slices or gates.    |
| Gate set selected                       | PASS   | For the present docs-only surface, `plan.md:6-13` selects docs-source gates, CI docs skips, and final PLAN-EVAL. Future package/plugin proving gates are still required as part of the corrected implementation slices in finding 9.                                                                                                                                          |
| Deferred scope explicit                 | PASS   | P-1 through P-4 have rationale and entry criteria (`rfc-0001-runtime-versioned-automation.md:448-455`); the single-replica limitation before P-1 is explicit (`:287-290`). This does not make the additional unclassified decisions below safe to defer.                                                                                                                      |
| jsr-audit surface scan (pkg/plugin)     | N/A    | This run changes documentation only (`plan.md:6-13`). The future public-package A0 wave names jsr-audit (`rfc-0001-runtime-versioned-automation.md:463-466`), but its corrected slice must apply the full rubric before implementation.                                                                                                                                       |

## Open-decision sweep (evaluator-run)

Must resolve before implementation because deferral changes package boundaries, persisted contracts,
or security behavior:

1. **Control-plane ownership and package archetypes:** decide O2+O4 versus the fallback, then assign
   lifecycle behavior, store ports/adapters, service composition, and UI wiring to doctrine-valid
   packages.
2. **Activation-set consistency:** decide the transaction boundary and monotonic ordering protocol
   across `task@1`, `trigger@1`, and future families, including rollback and stale-feed rejection.
3. **Replica compatibility:** decide activation admission and rollback behavior when deployed
   replicas understand different schema majors; indefinite last-known-good divergence is not
   convergence.
4. **Store semantics:** decide one behavioral contract that both Postgres and development KV can
   satisfy, or explicitly narrow the KV adapter's supported operations.
5. **T1 trust contract:** decide what is actually enforced for
   Python/.NET/shell/PowerShell/cmd/executable tasks and what requires T2. A working directory and
   cleared environment are not filesystem/network isolation.
6. **Scheduled-work ownership:** resolve `CRON-SUBSYSTEM-DUP` before adding both `task@1.schedule`
   and scheduled `trigger@1`; otherwise the RFC deepens the recorded duplicate subsystem.

Safe to defer only with the RFC's stated entry criteria: P-1 through P-4
(`rfc-0001-runtime-versioned-automation.md:448-455`). The exact package spelling, two-person
default, and retention defaults may be deferred only to a named pre-publication/persistence slice
with explicit entry criteria; the current owner-question list does not classify them (`:519-526`).

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **[BLOCKER] Restore the mandatory Design checkpoint, resumability artifact, and current review
   surface.** `worklog.md:1-84` has dated progress entries but no `## Design`, although the harness
   requires the public surface, domain vocabulary, ports, constants, file-and-gate commit slices,
   deferred scope, and contributor path before Plan-Gate
   (`.llm/harness/workflow/run-loop.md:56-73`). The run directory also has no `context-pack.md`,
   despite that being a mandatory artifact (`.llm/harness/workflow/activation.md:48-63`). Add both
   artifacts and make every future implementation file trace to the Design checkpoint. Then update
   draft PR #1446's body: as inspected on 2026-08-11, its S3/S4 checkboxes are stale even though the
   comments say those slices landed, and it does not contain the current locked decisions, risk
   register, slices, and selected gates required by `run-loop.md:75-80`.

2. **[BLOCKER] Resolve O2+O4 rather than presenting the central ownership decision as both accepted
   and open.** The RFC recommends a connector, immediately records a no-connector fallback, and
   leaves the choice to the owner (`rfc-0001-runtime-versioned-automation.md:416-423`, `:519-526`).
   The comparison does not model the fallback at the same fidelity as O4: it does not name its
   deployment unit, service composition, storage/migration owner, client dependency direction, or
   how reuse avoids O5-style reinvention. Record one decision with those concrete boundaries and
   rationale before ratification; if owner input is required, mark the run blocked at that choice
   rather than beginning A0.

3. **[BLOCKER] Correct the package archetypes and plugin-thinness violation in the chosen ownership
   model.** `@netscript/automation-core` is labeled ARCHETYPE-1 while owning a lifecycle state
   machine plus store, boundary, and reload ports, and the ARCHETYPE-5 connector is assigned the
   management service and Postgres/KV adapters (`rfc-0001-runtime-versioned-automation.md:187-189`,
   `:416-420`). Doctrine limits ARCHETYPE-1 to types and small invariants with almost no runtime
   (`docs/architecture/doctrine/06-archetypes.md:13-39`), while connector plugins wire core-owned
   conventions rather than own them (`:157-174`,
   `.llm/harness/archetypes/ARCHETYPE-5-plugin.md:29-43`). The open adapter-relocation debt
   specifically places port-to-backend runtime stores/adapters in sibling core packages, not
   `plugins/*` (`.llm/harness/debt/arch-debt.md:1832-1880`). Re-archetype or split the
   design—typically contracts (A1), lifecycle/runtime behavior (A3), and persistence
   integration/adapters (A2 or a justified runtime core)—then leave the connector with composition,
   declared resources, and re-exports. Name the exact core primitive and file group each connector
   axis wires.

4. **[BLOCKER] Replace per-family snapshots with an ordered, fleet-safe activation-set protocol and
   prove adapter parity.** Grouped activation can span an “explicit atomic set,” but propagation
   emits and swaps one snapshot per family (`rfc-0001-runtime-versioned-automation.md:244-253`,
   `:265-285`). A trigger revision can therefore become visible before the task revision it
   references. A delayed SSE fetch can also overwrite a newer polled state because a content hash
   has identity but no monotonic order. Schema mismatch deliberately leaves replicas on different
   last-good states with no admission, acknowledgement, deadline, or rollback policy (`:271-278`).
   Define a transactionally published activation-set manifest/epoch across all referenced families,
   referential validation, compare-and-reject rules for stale/out-of-order feed and polling
   responses, compatibility admission for the deployed fleet, partial-fetch/swap failure behavior,
   and convergence/rollback SLOs. Separately specify transaction scope, idempotency, audit ordering,
   and snapshot-consistency semantics shared by Postgres and KV (`:236-258`), backed by one
   adapter-conformance suite; otherwise narrow the KV adapter instead of claiming uniform behavior.

5. **[BLOCKER] Make T1 security claims match the technologies for every advertised runtime.** J2
   promises capability grants and a sandboxed dry-run for Python/.NET/shell tasks
   (`rfc-0001-runtime-versioned-automation.md:58-64`), but T1 maps filesystem/network permissions
   only for Deno while calling `cwd` “jailed” and relying on `clearEnv`, kill-tree, and cgroups for
   every runtime (`:292-314`). Those controls do not stop a native child from reading arbitrary host
   files, opening the network, or spawning processes. This is already recorded debt: all non-Deno
   runtimes inherit host OS privilege absent an external sandbox
   (`.llm/harness/debt/arch-debt.md:1409-1421`). Deno's official permissions documentation also
   states spawned subprocesses run independently of the parent's permission sandbox:
   https://docs.deno.com/runtime/reference/permissions/#subprocesses. Either limit non-Deno T1 to
   explicitly trusted workloads with non-enforceable grants modeled honestly, or move capability
   enforcement for them to an OS/container boundary. Replace “cwd jail” with entrypoint-root
   confinement unless a real jail exists, revise TM1/TM2/J2, and add per-runtime negative tests
   rather than the single ambiguous network test at
   `rfc-0001-runtime-versioned-automation.md:489-492`.

6. **[BLOCKER] Honor C8 and narrow or strengthen the remaining security guarantees.** C8 requires
   the RFC threat model to cover the control-plane child loader's `--allow-read --allow-net`,
   lockfile pinning, `--cached-only`, and a future capability prompt (`1444-impact.md:76-80`). The
   RFC only names #1444's loader in the schema command
   (`rfc-0001-runtime-versioned-automation.md:380-382`); TM7 covers task dependencies, not
   consumer-controlled code executing with network access during manifest loading (`:347`). Add that
   control-plane threat, trust boundary, and acceptance gate. Also, content hashes do not
   authenticate snapshots or defeat a malicious store/MITM, same-transaction audit is not
   tamper-evident against the direct-DB attacker TM8 names, and resolving secrets into child env
   cannot guarantee secret material “never” enters captured history when the child can print it
   (`:323-327`, `:339-348`, `:360-364`). State trusted DB/transport/admin assumptions or add
   authenticated snapshots and an independently protected audit sink; describe output redaction as
   bounded/best-effort with residual leakage, not an absolute guarantee.

7. **[HIGH] Correct evidence claims to the strength and time range the reports establish.** “No
   released version has ever” and “no executable service ever imported”
   (`rfc-0001-runtime-versioned-automation.md:15-25`) overreach a static audit at one legacy commit
   that expressly cannot exclude computed imports or external wrappers
   (`evidence/legacy-capability-map.md:227-240`). “There was never a control plane”
   (`rfc-0001-runtime-versioned-automation.md:94-96`) also erases real KV task CRUD and the current
   KV-backed trigger enable/disable behavior (`evidence/current-state-matrix.md:74-90`); the
   supported conclusion is that there was no coherent operator-managed, revisioned definition
   control plane. Line 107 calls PR #1444's loading fix a fact even though #1444 is still a draft
   and the current report expressly did not re-evaluate it
   (`evidence/current-state-matrix.md:30-36`); phrase it as a pending/branch dependency. Finally,
   Appendix A marks all seven current runtime adapters end-to-end green via P5
   (`rfc-0001-runtime-versioned-automation.md:539-545`), while the report says only Deno and shell
   ran and five adapters remain implemented-unproven (`evidence/current-state-matrix.md:140-146`,
   `:249-255`). Scope the claims to inspected commits/tags and correct that status.

8. **[BLOCKER] Complete the D-5 cleanup inventory and settle the competing live surfaces.** Section
   10 promises that no competing surface survives but its table
   (`rfc-0001-runtime-versioned-automation.md:425-446`) omits or underspecifies: saga
   sample/current/schema emissions (`evidence/current-state-matrix.md:94-101`); the workers local
   project-file discovery/direct-execution path (`:74-82`); static generated trigger-registry
   publication (`:84-90`); current KV trigger enabled state; Windows
   `NETSCRIPT_RUNTIME_CONFIG_DIR`/`NETSCRIPT_TASKS_DIR` emission (`:103-108`); and the boundary
   between retained T0 job CRUD/scheduling and new `task@1` lifecycle. It also adds task schedules
   while retaining scheduled triggers without resolving the existing live `CRON-SUBSYSTEM-DUP`
   decision (`.llm/harness/debt/arch-debt.md:1507-1539`). Expand the inventory to exact files,
   commands, generated artifacts, schemas, environment keys, tests, and docs; give each a
   keep/fold/delete disposition and owning roadmap slice. Choose the canonical cron path before
   either surface is removed or duplicated. This is replacement bookkeeping, not a compatibility
   layer.

9. **[BLOCKER] Re-slice §12 into landable PRs with files, proving gates, and correct dependency
   edges.** A1 combines two persistence adapters, audit, snapshot construction, and race tests; A2
   combines plugin scaffolding, API/service, lifecycle validation, change feed, and CLI; A3 and A5
   likewise span several independently risky seams
   (`rfc-0001-runtime-versioned-automation.md:457-473`). None names files or per-slice gates,
   contrary to `plan-protocol.md:34-40`. The graph is also wrong: A4's management fire/test path
   depends on A2, not only A3; A5's management dry-run and secrets policy depend on A2; A7's
   run/history/trigger journeys require A3/A4/A5, not only A2 plus the frontend cut. Split contracts
   first, then store-port conformance/adapters, lifecycle transactions, ordered snapshot
   client/feed, engine-specific reload paths, security tiers, management/CLI, cleanup, and UI. For
   each PR-sized slice list touched files and applicable static, fitness, runtime/Aspire, consumer,
   publish, and release gates from `.llm/harness/gates/archetype-gate-matrix.md:18-76`. Preserve the
   correctly modeled cockpit minimum cut at `rfc-0001-runtime-versioned-automation.md:393-400`.

## Notes

- The evaluator worktree branch and commit were verified as `eval/rfc-runtime-versioned-automation`
  at `1e97152f3460728416ef763d3a4b548dccd2b1c9`, separate from the Claude authoring worktree.
- The RFC correctly preserves D-10 and rejects static-config collapse
  (`rfc-0001-runtime-versioned-automation.md:40-45`, `:501-515`), accepts the clean
  redesign/no-compat direction (`:112-120`), avoids hardcoded plugin-family dispatch in the proposed
  contribution model (`:180-200`), and models the #922/#934 frontend dependency cut accurately
  (`:384-400`). These strengths do not cure the unchecked Plan-Gate boxes.
- Draft PR #1446 body and both phase comments were inspected. The comments record research/evidence
  and RFC landing, but the body has not been reconciled to that state or to the required Plan &
  Design review shape. PR #1444 was also inspected as an open draft; its impact memo is therefore a
  constraint/dependency, not landed-main evidence.
- No RFC/source edits, commits, pushes, issue mutations, labels, or PR comments were performed by
  this evaluator.

PLAN-EVAL: FAIL_PLAN

## Cycle 2

- Plan evaluator session: same dedicated Codex GPT-5.6 Sol · xhigh evaluator session / 2026-08-11
  (owner override D-2), fresh judgment at Cycle-2 commit
- Evaluator worktree: `/home/codex/repos/ns-rfc-plan-eval`, branch
  `eval/rfc-runtime-versioned-automation`, clean at `382795e4a87891c21a602d7874e24db3db10ded9`
- Author worktree: `/home/codex/repos/ns-rfc-runtime-versioned-automation`, clean at the same commit
  before this verdict append
- Surface / archetype: docs RFC planning future ARCHETYPE-1/2/3/5/6 package, runtime, plugin, and
  CLI waves
- Scope overlays: `SCOPE-docs`; adversarial RFC architecture review; no implementation evaluation

### Cycle-1 finding resolution audit

| Cycle-1 finding                                          | Cycle-2 result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 — Design checkpoint, context pack, PR reconciliation  | PARTIAL        | `worklog.md:86-108` now has `## Design`, and `context-pack.md:1-25` exists. The live PR body is updated, but it and the Cycle-1 comment assert decisions/fixes that the RFC does not contain; the PR still carries `status:research` while its body says Plan & Design is ready and Cycle 2 is running.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| F2 — lock O2+O4 ownership                                | FAIL           | §9 still calls O2+O4 a recommendation and explicitly keeps the no-connector fallback available to this evaluator (`rfc-0001-runtime-versioned-automation.md:460-467`), contradicting §15's claim that ownership is locked (`:594-597`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| F3 — doctrine-valid archetypes / thin connector          | FAIL           | ARCHETYPE-1 still owns the lifecycle state machine and store/boundary/reload ports (`:193-195`, `:460-464`), contrary to the no-DI/no-adapter, types-and-small-invariants boundary (`docs/architecture/doctrine/06-archetypes.md:13-39`). §9 also still assigns Postgres/KV adapters to the connector (`rfc-0001-runtime-versioned-automation.md:452-464`), contradicting §5.2 and A1a/A1b, which put them in `automation-runtime` (`:252-255`, `:513-515`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| F4 — activation-set/fleet consistency and adapter parity | FAIL           | Monotonic epochs and adapter narrowing were added (`:264-290`, `:294-318`), but the manifest is described as only the entries/families an activation “touches,” while a snapshot contains only “every entry” in that manifest (`:264-272`, `:294-304`). It is not specified as the complete desired state, so a one-definition activation either drops untouched definitions on swap or requires an unspecified merge. More importantly, replicas apply asynchronously: a trigger replica at N+1 can enqueue `taskId` while a worker at N resolves that ID from its current snapshot (`:309-322`), so cross-family visibility is not fleet-atomic.                                                                                                                                                                                                                                                                                      |
| F5 — honest T1 contract                                  | PARTIAL        | J2, §5.4, and E2E-5 now correctly say non-Deno T1 grants are not enforced (`:61-66`, `:329-351`, `:549-552`). The threat table regresses to “T1 env/cwd jail” and “entrypoint resolution jailed” (`:378-380`) even though §5.4 expressly says entrypoint-root resolution is not an OS jail (`:342`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| F6 — C8 and security guarantee narrowing                 | FAIL           | DB/transport/redaction trust assumptions were added (`:387-396`), but §6 has TM1–TM8 only (`:372-385`). It never models #1444's control-plane child loader executing consumer code with `--allow-read --allow-net`, never states the promised lockfile/`--cached-only` loader policy, and has no capability-prompt deferral or acceptance gate required by `1444-impact.md:76-80`. `plan.md:72`, `worklog.md:125-126`, and `context-pack.md:18` falsely claim TM9 exists.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| F7 — evidence claim strength                             | PASS           | The abstract is scoped to the two inspected commits (`rfc-0001-runtime-versioned-automation.md:15-28`), partial KV/operator surfaces and #1444's draft state are acknowledged (`:96-113`), and Appendix A now distinguishes Deno/shell proof from five implemented-unproven adapters (`:610-619`). Focused `rtk grep` and `deno doc` spot-checks reconfirmed the disconnected runtime-config surface and the `RuntimeTask`/`TaskDefinition` mismatch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| F8 — complete clean-break inventory / cron ownership     | FAIL           | `task@1` no longer owns scheduling, so the new operator cron path is resolved without deleting the live T0 `.schedule()` surface (`:241-248`). The §10 inventory remains incomplete: it does not disposition the current `runtime-config-topic` contribution axis/builder (`packages/plugin/src/domain/constants.ts:15-40`, `packages/plugin/src/config/domain/plugin-contributions.ts:11-37`, `packages/plugin/src/config/builders/plugin-builder.ts:204-216`), workers project-file discovery/direct execution (`plugins/workers/src/cli/local-runtime-backend.ts:276-319`), or generated trigger-registry loader/fallback (`plugins/triggers/src/runtime/project-trigger-registry.ts:6-39`, `:69-95`). Saga emissions, trigger enabled-state retirement, and Windows env-key cleanup appear only as broad roadmap phrases, not as the promised exact §10 inventory (`rfc-0001-runtime-versioned-automation.md:469-490`, `:520-525`). |
| F9 — PR-sized roadmap, gates, dependencies               | FAIL           | The table is improved, but A2b still combines lifecycle, two propagation modes, and fleet admission across package/plugin roots; A6 is a repository-wide package/CLI/scaffold/Windows/docs/test purge; neither is credibly PR-sized (`:517-525`). The gate mapping is incomplete: A1b/A1c omit required fitness, publishability, and consumer gates; A2b omits fitness/publishability; A6 changes scaffold output but selects only `scaffold-static`, not the mandatory release-gate class (`:503-528`; `archetype-gate-matrix.md:20-40`, `:60-76`). A0 also does not name the oRPC management contract later “hosted” by A2a (`rfc-0001-runtime-versioned-automation.md:418-420`, `:512-517`).                                                                                                                                                                                                                                         |

### Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                             |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md:6-13` and `evidence/current-state-matrix.md:22-26` name and rebaseline the current source baseline. I repeated focused tree searches and `deno doc` checks. Live #922 children #923–#934 and draft PR #1446 were re-inspected on 2026-08-11.                                       |
| Decisions locked                        | FAIL   | Ownership is simultaneously “locked,” a recommendation, and subject to a fallback (`plan.md:3-6`; RFC `:460-467`, `:594-597`). The activation-set state model and fleet-atomic behavior are also not decided sufficiently to implement.                                                         |
| Open-decision sweep                     | FAIL   | `plan.md:77-84` declares no must-resolve decision open, but the evaluator sweep below finds decisions that change package boundaries and persisted/dispatch contracts.                                                                                                                          |
| Commit slices (< 30, gate + files each) | FAIL   | The current docs-only S1–S5 list is adequate (`plan.md:86-99`), but the RFC's implementation roadmap—the plan being ratified—is not independently landable at A2b/A6 and omits a contract-owning slice (`rfc-0001-runtime-versioned-automation.md:510-528`).                                    |
| Risk register                           | FAIL   | It names the relevant categories, but its child-loader mitigation cites nonexistent TM9/gates (`plan.md:72`), and its partial-activation mitigation does not cover asynchronous cross-engine replicas or complete-snapshot semantics (`:65-68`).                                                |
| Gate set selected                       | FAIL   | §12's abbreviations are defined, but multiple package/plugin slices omit matrix-required fitness, consumer, and publishability gates; scaffold-changing A6 omits the release-gate class (`rfc-0001-runtime-versioned-automation.md:503-528`; `archetype-gate-matrix.md:20-40`, `:60-76`).       |
| Deferred scope explicit                 | PASS   | P-1–P-4 have rationale and entry criteria (`rfc-0001-runtime-versioned-automation.md:492-499`), and §15 classifies naming, two-person default, and retention (`:579-597`).                                                                                                                      |
| jsr-audit surface scan (pkg/plugin)     | FAIL   | Naming `P`/`jsr-audit` as a future gate is not the required pre-slice application of the rubric to the planned public surfaces. No slow-type/export/import-permission risk scan is recorded, and several public package/plugin slices omit `P` entirely (`plan-gate.md:32-34`; RFC `:503-528`). |

### Open-decision sweep (evaluator-run)

The following remain **must resolve now** because deferral changes package boundaries or runtime
correctness:

1. Decide whether O2+O4 is binding or whether the fallback remains live. If binding, put
   lifecycle/runtime ports and adapters in a doctrine-valid runtime/integration core and make every
   §9/PR statement agree that the connector composes them only.
2. Define an epoch snapshot as the complete active desired state, including carry-forward and
   disable/delete semantics, or explicitly define a deterministic merge protocol. Then close the
   cross-replica task/trigger race with revision/epoch-pinned dispatch or a rollout barrier;
   per-replica monotonic application is not fleet atomicity.
3. Define how fleet admission treats temporarily absent/stale registrations and schema
   downgrade/rollback. “Registered live replica” admission has a time-of-check gap when an old
   replica rejoins after activation.
4. Decide and slice the management oRPC contract owner before A2a, rather than having a plugin host
   a contract no preceding slice creates.

The package spelling, two-person default, retention defaults, and P-1–P-4 remain safe to defer under
the RFC's stated entry criteria once the above are resolved.

### Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **[BLOCKER] Make ownership genuinely singular and doctrine-valid.** Remove the live fallback or
   fully choose it; move store/boundary/reload ports out of the ARCHETYPE-1 contract package, keep
   store adapters and lifecycle behavior in an ARCHETYPE-2/3 core, and remove every statement
   assigning those adapters to `plugins/automation`. Reconcile §5.1, §5.2, §9, §12, §15, the
   plan/worklog/context pack, and PR body/comment.
2. **[BLOCKER] Close the remaining activation races.** Specify that each epoch snapshot materializes
   the complete active set; define carry-forward, disable/delete, idempotent reactivation, and
   rollback semantics. Add a protocol that prevents a trigger at epoch N+1 from dispatching by bare
   ID to a worker at N (for example revision/content-hash-pinned messages with immutable lookup, or
   a proven activation barrier). Add absent/rejoining replica admission semantics and correct
   E2E-2's stale `expectedActiveRevision` to the RFC's `expectedEpoch` contract
   (`rfc-0001-runtime-versioned-automation.md:264-290`, `:294-322`, `:541-543`).
3. **[BLOCKER] Actually honor C8 and remove the T1 jail overclaim.** Add a control-plane loader
   threat covering consumer-controlled module execution with read/network access, lockfile and
   cached-only behavior, cold-cache failure/allow policy, capability-prompt staging, and a proving
   gate. Replace “env/cwd jail”/“resolution jailed” in TM1/TM2 with the actual controls. Cite
   durable primary evidence; the RFC's `.llm/tmp/docs/sandbox-isolation-survey-2026-08.md` reference
   (`:346`) is absent from the evaluator worktree and is not a reviewable committed/run artifact.
   Official Deno documentation confirms subprocesses run independently of the parent permission
   sandbox and that `--cached-only` only requires dependencies to be cached.
4. **[BLOCKER] Finish §10 as a file-level replacement inventory.** Include the plugin runtime-config
   contribution axis/builder/public exports, generated trigger registry/fallback and its generation
   path, workers project-file discovery/direct execution, saga sample/schema emissions, trigger KV
   enabled-state port/store, all Windows/environment emitters, tests, generated docs/assets, and the
   exact retained T0 job surface. Give each keep/fold/delete/rewrite disposition and one owning
   slice.
5. **[BLOCKER] Re-slice and select every required gate.** Split A2b and A6 into reviewable PRs; add
   the management contract to A0 or a preceding explicit slice; apply all archetype-required
   fitness/publish/consumer/runtime gates to every touched public package/plugin; and assign the
   full release-gate class to scaffold/DB/Aspire/published-CLI changing slices. Record the jsr-audit
   rubric findings, including slow-type and public-export risks, before those slices are authorized.
6. **[HIGH] Reconcile the live review surface.** The PR body and Cycle-1 comment must not say “all
   findings addressed,” “ownership locked,” “connector composition only,” or “TM1–TM9” until the RFC
   says those things. Add the canonical checkable Definition of Done and Drift/Debt sections
   required by `netscript-pr`, use structured phase tokens, and advance the sole `status:` label
   from stale `status:research` to the actual phase when the supervisor posts the next phase
   comment. Keep the PR draft and do not claim ready-for-review contrary to `plan.md:55`.

### Notes

- The revised RFC still correctly preserves D-10, the clean-break/no-compat direction, the frontend
  dependency cut (#923–#932 plus #934, with #933 as the adjacent dogfood surface), the narrowed
  development-KV posture, and the honest core statement that non-Deno T1 grants are unenforced.
- The live GitHub PR body, all three comments, labels, draft state, and #922 child issue states were
  re-inspected. No GitHub mutation was performed.
- No RFC, plan, worklog, context-pack, source, or other file was edited. No commit or push was made.
  This append is the only Cycle-2 filesystem mutation.
- This is the second `FAIL_PLAN`; per `plan-protocol.md:52-55` the unresolved blockers now escalate
  to the owner rather than entering an automatic third fix cycle.

PLAN-EVAL: FAIL_PLAN

## Cycle 3

- Plan evaluator session: same dedicated Codex GPT-5.6 Sol · xhigh evaluator session / 2026-08-11
  (owner override D-2), Cycle 3 explicitly authorized by the owner after the two-FAIL protocol stop
- Evaluator worktree: `/home/codex/repos/ns-rfc-plan-eval`, branch
  `eval/rfc-runtime-versioned-automation`, clean at `811373a8741554b096a488d15c64e5fb21864392`
- Author worktree: `/home/codex/repos/ns-rfc-runtime-versioned-automation`, same source commit
  before this verdict append
- Surface / archetype: docs RFC planning future ARCHETYPE-1/2/3/5/6 package, runtime, plugin, CLI,
  scaffold, DB, Aspire, and frontend waves
- Scope overlays: `SCOPE-docs`; adversarial RFC architecture review; owner-directed
  competitive-study review; no implementation evaluation

### Cycle-1 and Cycle-2 finding resolution audit

| Prior finding                                                                          | Cycle-3 result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cycle-1 F1 — Design checkpoint, context pack, PR review surface                        | PARTIAL        | The required artifacts exist (`worklog.md:86-108`; `context-pack.md:1-26`) and the live PR is draft with `status:plan-eval`, DoD, and Drift/Debt. They are not current: `plan.md:3-6,83,96-97` still says Cycle 2 is pending and P-1..P-4; `context-pack.md:3,19-23` says post-Cycle-1/two-FAIL escalation pending; the Design checkpoint omits P-5/S6 (`worklog.md:95-105`); the PR body omits S6/D-8/P-5/BG-1..BG-5 and still presents the owner escalation as current. |
| Cycle-1 F2 — binding ownership decision                                                | PASS           | §9 now says O2+O4 is binding with no live fallback and evaluates the withdrawn fallback at equal fidelity (`rfc-0001-runtime-versioned-automation.md:474-521`).                                                                                                                                                                                                                                                                                                           |
| Cycle-1 F3 — doctrine-valid ownership / plugin thinness                                | PASS           | Contracts contain no ports/adapters (`:193-197`, `:491-494`); runtime behavior, ports, and adapters are core-owned (`:495-500`); the connector is composition-only and names each wired axis (`:501-507`).                                                                                                                                                                                                                                                                |
| Cycle-1 F4 / Cycle-2 F2 — complete activation state, pinned dispatch, rejoin admission | PARTIAL        | Complete desired-state epochs, carry-forward/tombstones, monotonic application, revision-pinned dispatch, and leased rejoin validation are now real text (`:267-280`, `:302-343`). The corrected protocol introduces an unresolved control-plane-outage failure described in finding 1 below.                                                                                                                                                                             |
| Cycle-1 F5 — honest T1 contract                                                        | PASS           | J2, the tier table, the blunt perimeter statement, TM1/TM2, and E2E-5 consistently state that non-Deno T1 grants are not enforced and T1 is not a tenancy boundary (`:61-66`, `:350-378`, `:403-406`, `:640-643`).                                                                                                                                                                                                                                                        |
| Cycle-1 F6 / Cycle-2 F3 — C8/TM9 and bounded security guarantees                       | PARTIAL        | TM9 now covers the #1444 loader, warm-cache `--cached-only`, explicit cold-cache network use, loud failure, capability-prompt staging, and A2a's offline gate (`:413`, `:594`). Trust assumptions correctly narrow hashes, audit, and redaction (`:415-424`), but §5.5 retains an absolute secret-history claim contradicted by that residual-risk text (finding 2).                                                                                                      |
| Cycle-1 F7 — evidence claim strength                                                   | PASS           | Claims remain scoped to the inspected commits; partial control-plane surfaces and #1444's draft state are explicit; Appendix A still limits direct adapter proof to Deno+shell (`:15-28`, `:96-113`, `:759-776`). Focused `rtk grep` and `deno doc` checks reconfirmed the disconnected loader and the `RuntimeTask`/executor-contract mismatch.                                                                                                                          |
| Cycle-1 F8 / Cycle-2 F4 — file-level clean-break inventory                             | PARTIAL        | §10 now has a useful file-level table and resolves most named surfaces (`:542-564`), but it is not the complete file-level inventory it claims; concrete survivors are omitted (finding 3).                                                                                                                                                                                                                                                                               |
| Cycle-1 F9 / Cycle-2 F5 — PR-sized roadmap, dependencies, gates, JSR scan              | PARTIAL        | A0 owns the contract; A2d and A6a-c are split; corrected dependency edges and a real JSR pre-scan exist (`:588-623`). Required fitness/publish/release gates are still omitted from multiple rows despite the RFC's opposite assertion (finding 4).                                                                                                                                                                                                                       |
| Cycle-2 F6 — live PR reconciliation                                                    | PARTIAL        | The PR is draft, its sole status label is `status:plan-eval`, and DoD/Drift/Debt exist. The body was reconciled to `af4f20f1e` but not to the Cycle-3 head/study, and its S5 state is stale (finding 6).                                                                                                                                                                                                                                                                  |

### Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                         |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | FAIL   | The repository archaeology is present, scoped, and re-baselined (`research.md:6-13`; current matrix `:22-26`). The newly required competitive research is materially incomplete against its claimed 12 owner-named dimensions and contains unsupported/exhaustive claims (finding 5; competitive study `:123-141,145-200`). |
| Decisions locked                        | FAIL   | Ownership, cron, T1, store parity, epoch totals, and schema admission are locked. Control-plane outage behavior is not: lease expiry drains serving replicas while pinned-revision fetch failure immediately dead-letters work (`rfc-0001-runtime-versioned-automation.md:331-343`), with no availability/retry decision.   |
| Open-decision sweep                     | FAIL   | `plan.md:77-84` and RFC §15 do not identify the outage/lease/pinned-lookup decision, although choosing fail-closed fleet drain versus last-good availability changes core runtime behavior and tests.                                                                                                                       |
| Commit slices (< 30, gate + files each) | FAIL   | There are fewer than 30 ordered implementation slices with file groups, but several lack their required proving gate classes and the docs-run slice inventory omits S6/Cycle 3 (`rfc-0001-runtime-versioned-automation.md:588-608`; `plan.md:86-99`).                                                                       |
| Risk register                           | FAIL   | The register covers prior race/security categories but not management/feed outage causing lease-expiry fleet drain or transient immutable-revision lookup causing DLQ (`plan.md:58-75`; RFC `:331-343`).                                                                                                                    |
| Gate set selected                       | FAIL   | Rows touching public packages/plugins omit `F` and/or `P`, and rows changing DB/Aspire/published CLI shape omit the orthogonal release class (`rfc-0001-runtime-versioned-automation.md:591-608`; `archetype-gate-matrix.md:20-40,60-76`).                                                                                  |
| Deferred scope explicit                 | PASS   | P-1..P-5 have rationale and entry criteria (`rfc-0001-runtime-versioned-automation.md:569-577`), and the remaining naming/policy/default questions are classified with entry criteria (`:728-746`).                                                                                                                         |
| jsr-audit surface scan (pkg/plugin)     | PASS   | The pre-scan names Zod/isolated-declaration slow types, explicit oRPC route types, driver-type leakage, and connector re-export risks and assigns them to A0/A1a/connector work (`rfc-0001-runtime-versioned-automation.md:611-619`). This does not cure the missing `P` gates in the slice table.                          |

### Open-decision sweep (evaluator-run)

One must-resolve-now decision remains: define the execution-plane availability contract when the
management service/store is unreachable. The present combination self-drains replicas after a
registration lease lapses and immediately dead-letters a revision-pinned dispatch when its immutable
lookup cannot be fetched (`rfc-0001-runtime-versioned-automation.md:331-343`). The plan must choose
and specify bounded last-good serving versus fail-closed drain, lease-renewal grace/fencing
behavior, and retryable-unavailable versus terminal-not-found/hash-mismatch lookup outcomes. This
changes the runtime state machine, queue semantics, SLOs, and tests, so it is not safe to defer
implicitly.

All owner questions explicitly listed in §15 remain safe to defer under their entry criteria. P-1
through P-5 remain staged scope, not hidden implementation decisions.

### Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **[BLOCKER] Decide the control-plane-outage and pinned-lookup failure protocol.** A
   management/feed outage eventually expires every lease, after which replicas “must re-register ...
   before serving”; independently, any inability to fetch a pinned revision is sent directly to DLQ
   (`rfc-0001-runtime-versioned-automation.md:331-343`). Distinguish transient unavailable/timeouts
   from terminal absent/hash/schema failures, define queue retry/backoff and immutable-revision
   caching, and decide whether a replica with a valid last-good snapshot may serve during a bounded
   control-plane outage or must self-drain. Add the risk, SLO, and failure tests to A1c/A2d/A3a/A8.

2. **[BLOCKER] Remove the remaining absolute secret-history guarantee.** §5.5 says secret material
   “never enters ... history records” (`rfc-0001-runtime-versioned-automation.md:387-397`), while
   the threat-model trust statement correctly admits a child can transform and print a secret past
   best-effort redaction (`:415-421`). Make §5.5 use the same bounded guarantee: secrets are not
   deliberately persisted as definition/audit fields, captured output is best-effort redacted, and
   residual disclosure remains possible.

3. **[BLOCKER] Complete the cleanup table against the actual tree.** The generic enabled-state row
   (`rfc-0001-runtime-versioned-automation.md:557-558`) does not disposition the
   port/store/testing/public exports and service/runtime consumers under
   `packages/plugin-triggers-core/src/{ports,stores,testing,public}/**` and
   `plugins/triggers/{services,src/runtime}/**`. The Windows/environment row (`:559-560`) omits
   `packages/cli/src/kernel/adapters/windows/environment/env-file-content.ts`, `env-file-values.ts`,
   `kernel/assets/windows/env.template`, the generated embedded asset, and the live
   `NETSCRIPT_TASKS_DIR` readers in
   `packages/plugin-workers-core/src/executor/adapters/path-resolution.ts` and
   `plugins/workers/worker/job-execution.ts`. Name each file group with keep/fold/delete/rewrite and
   an owning slice; otherwise D-5 still allows competing runtime-config behavior to survive.

4. **[BLOCKER] Apply the gate matrix to every roadmap row, not only in prose.** The RFC asserts
   every package/plugin slice carries `P` (`rfc-0001-runtime-versioned-automation.md:611-619`), but
   A2d, A2c, A3a/b, A4a/b, and A5a/b omit it; A2d and several later core/plugin rows also omit
   required `F` (`:596-603`). A1a changes DB wiring, A2a declares Aspire resources/migrations, and
   A2c changes the published CLI, yet none names the orthogonal release-gate class required by
   `archetype-gate-matrix.md:67-76`. Add `S/F/R/C/P` as applicable to every row and the release
   class wherever DB/Aspire/scaffold/published CLI/plugin shape changes; then make the prose and
   table agree.

5. **[BLOCKER] Make the competitive study satisfy the owner-directed dimensions and evidence
   standard.** The study says it compares twelve named dimensions
   (`competitive-architecture-study.md:9-12,123-141`), but its matrix replaces the required
   isolation, control/data-plane, and cockpit-UX rows with four separate versioning rows; several
   per-system profiles likewise do not cover the missing dimensions. It also uses a Hacker News post
   and n8n community guidance despite describing the study as primary-source-based
   (`:3-7,67-74,109-121,218-226`), and elevates unproven exhaustive negatives such as “none of the
   nine uses watched files” and “uniform across all nine” (`:155-160`; RFC `:698-700`). Add the
   three missing comparison dimensions, cite official product docs/repositories for load-bearing
   cells (or mark unknown), and narrow exhaustive conclusions to what the sources establish. Finally
   remove or gate the RFC's remaining empirical technology assertion “sub-ms start”
   (`rfc-0001-runtime-versioned-automation.md:365`), which contradicts “performance enters this RFC
   only as gates” (`:652-657`) and the no-empirical-claims statement (`:721-723`).

6. **[HIGH] Reconcile all resumability/review artifacts to Cycle 3.** Update `plan.md:3-15,77-99`,
   `worklog.md:95-105`, and `context-pack.md:3,19-24` so they name P-5, S6, the owner-authorized
   Cycle 3, the current archetypes, and the current slice/gate state. Reconcile the live PR body
   likewise: add S6/D-8 and the benchmark/P-5 scope, replace the stale “owner escalation” S5 text
   with Cycle-3 state, and mark completed DoD boxes accurately. Keep the PR draft and the sole
   `status:plan-eval` label.

### Notes

- The corrected `af4f20f1e` changes are present in the actual file; this evaluation does not rely on
  the Cycle-2 fix narrative. Ownership/thinness, complete desired-state epochs, revision-pinned
  dispatch, leased rejoin validation, TM9/C8, `expectedEpoch`, honest T1 wording, A0 contract
  ownership, and A6 splitting were all verified directly.
- The D-10 differentiator, D-4 clean-sheet authority, D-5 no-compat direction, and D-3 frontend
  dependency cut remain intact. No hardcoded plugin names were introduced in the proposed
  contribution model.
- Primary-source spot checks confirmed the Temporal pinning, Restate immutable-deployment, Hatchet
  Postgres, Trigger.dev atomic-deploy, Durable Functions versioning, AWS Step Functions
  weighted-alias, Kestra revision/plugin-version, Windmill draft/deploy, and Inngest self-host
  claims. The problem is the study's missing dimensions and claims stronger than those sources, not
  that every cited comparison is wrong.
- The live PR body, all five comments, labels, milestone assignment, draft state, and head SHA were
  re-inspected. No GitHub mutation was performed.
- No RFC, plan, worklog, context-pack, source, issue, comment, label, commit, or branch was changed.
  This Cycle-3 append is the only filesystem mutation.

PLAN-EVAL: FAIL_PLAN

## Cycle 4

- Plan evaluator session: same dedicated Codex GPT-5.6 Sol · xhigh evaluator session / 2026-08-11
  (owner override D-2), Cycle 4 explicitly authorized by the owner
- Evaluator worktree: `/home/codex/repos/ns-rfc-plan-eval`, branch
  `eval/rfc-runtime-versioned-automation`, clean at `774f3ee194a854b24576b3e47a304ff979d64ae9`
- Author worktree: `/home/codex/repos/ns-rfc-runtime-versioned-automation`, same source commit
  before this verdict append
- Surface / archetype: docs RFC planning future ARCHETYPE-1/2/3/5/6 package, runtime, plugin, CLI,
  scaffold, DB, Aspire, and frontend waves
- Scope overlays: `SCOPE-docs`; adversarial RFC architecture and competitive-evidence review; no
  implementation evaluation

### Prior-finding resolution audit

| Prior finding                                                                     | Cycle-4 result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cycle-1 F1 / Cycle-3 F6 — Design checkpoint and current review artifacts          | PARTIAL        | The artifacts and live PR exist, and PR #1446 is draft at the evaluated head with one `status:plan-eval` label, a milestone, DoD, and Drift/Debt. They are not current: the plan profile still names the superseded existing-package archetypes rather than the selected automation-core/runtime/connector archetypes (`plan.md:15-20`); the context pack says P-1..P-4 and that Cycle 4 was not ordered (`context-pack.md:14-29`); the phase registry says G6 is done after three cycles (`phase-registry.md:13`); and the live PR checks S5 complete while describing Cycle 4 only as a future request. |
| Cycle-1 F2/F3 — binding ownership and doctrine-valid thinness                     | PASS           | O2+O4 is expressly binding with no live fallback; ARCHETYPE-1 is contracts/data only, ARCHETYPE-2/3 owns behavior/ports/adapters, and the ARCHETYPE-5 connector owns composition only (`rfc-0001-runtime-versioned-automation.md:508-541`).                                                                                                                                                                                                                                                                                                                                                               |
| Cycle-1 F4 / Cycle-2 F2 / Cycle-3 F1 — activation consistency and outage protocol | PARTIAL        | Complete desired-state epochs, carry-forward/tombstones, monotonic swaps, revision-pinned dispatch, cache behavior, transient/terminal failure classes, and leased rejoin validation are present (`:267-280`, `:302-348`). The outage contract is still internally inconsistent and its promised end-to-end proof is absent (finding 1).                                                                                                                                                                                                                                                                  |
| Cycle-1 F5 — honest T1 contract                                                   | PASS           | The runtime table, blunt perimeter statement, TM1/TM2, and acceptance test consistently say native-runtime grants are not enforced at T1 and T1 is not a tenancy boundary (`:373-395`, `:423-444`, `:663-666`).                                                                                                                                                                                                                                                                                                                                                                                           |
| Cycle-1 F6 / Cycle-2 F3 / Cycle-3 F2 — C8/TM9 and bounded security claims         | PASS           | §5.5 now distinguishes deliberate persistence from best-effort captured-output redaction (`:404-417`), matching the threat-model residual-risk statement (`:435-444`). TM9 still pins warm-cache offline loading and loud cold-cache behavior to A2a (`:433`).                                                                                                                                                                                                                                                                                                                                            |
| Cycle-1 F7 — evidence claim strength                                              | PASS           | Repository claims remain scoped to inspected commits and status tags; Appendix A still limits execution proof to Deno+shell. Focused tree searches reconfirmed the loader/discovery and cleanup surfaces rather than relying on the fix narrative.                                                                                                                                                                                                                                                                                                                                                        |
| Cycle-1 F8 / Cycle-2 F4 / Cycle-3 F3 — complete clean-break inventory             | PARTIAL        | The requested trigger-enabled, Windows-environment, and `NETSCRIPT_TASKS_DIR` groups are now named (`:562-586`), but additional live runtime-config CLI/deploy plumbing remains undispositioned (finding 2).                                                                                                                                                                                                                                                                                                                                                                                              |
| Cycle-1 F9 / Cycle-2 F5 / Cycle-3 F4 — roadmap gates and sizing                   | PARTIAL        | A2d/A6a-c, file groups, release classes, dependency edges, and the JSR pre-scan are present (`:602-646`), but the table still omits matrix-required gate families for several package/plugin slices (finding 3).                                                                                                                                                                                                                                                                                                                                                                                          |
| Cycle-3 F5 — competitive study integrity                                          | PARTIAL        | The missing isolation/control-plane/cockpit rows were added, exhaustive negatives were narrowed, the lighter-source rule is stated, and the T3 empirical number is gone. The expanded study now contradicts its own dimension count and primary-source/citation guarantee, and one new isolation cell is materially weaker than official documentation (finding 4).                                                                                                                                                                                                                                       |

### Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | FAIL   | Repository research is present and exactly re-baselined to current `origin/main` (`research.md:6-13`; verified base and merge-base `2256a67bf`). The competitive research overstates its citation coverage and mislabels a 15-row matrix as 12 dimensions (`competitive-architecture-study.md:3-7,123-144`; finding 4).               |
| Decisions locked                        | FAIL   | Ownership, store parity, activation totals, cron, and T1 are locked. “Bounded last-good serving” and “never self-drain” specify different stale-serving contracts, and the text supplies no bound or expiry action (`rfc-0001-runtime-versioned-automation.md:349-360`; finding 1).                                                   |
| Open-decision sweep                     | FAIL   | The plan declares the outage question resolved as bounded serving (`plan.md:83-93`), while the RFC specifies indefinite serving with alerts. Choosing a stale-serving bound versus no bound changes runtime state, SLOs, and tests and is therefore not safe to leave contradictory.                                                  |
| Commit slices (< 30, gate + files each) | FAIL   | The slice count and ordering are acceptable, but required consumer/publish proof is missing from implementation rows (finding 3), the promised outage E2E is absent (finding 1), and the docs S6 fmt gate claimed at `plan.md:109-111` is not green: focused `deno fmt --check` exits 1 for the study plus plan/worklog/context pack. |
| Risk register                           | FAIL   | The outage row exists (`plan.md:81`) but repeats the contradictory contract and assigns A8 outage tests that neither A8 nor §13 names (`rfc-0001-runtime-versioned-automation.md:631,648-673`).                                                                                                                                       |
| Gate set selected                       | FAIL   | Consumer validation is required for ARCHETYPE-2/3/5 and publish validation for touched public packages/plugins (`archetype-gate-matrix.md:60-76`), yet §12 omits `C` from A1a/A1b/A1c/A3a/A4a/A5a and omits `P` from the package/plugin/scaffold-changing A6b (`rfc-0001-runtime-versioned-automation.md:614-628`).                   |
| Deferred scope explicit                 | PASS   | P-1..P-5 have rationales and entry criteria (`:592-600`); naming, two-person policy, and retention defaults have explicit safe-deferral criteria (`:752-770`).                                                                                                                                                                        |
| jsr-audit surface scan (pkg/plugin)     | PASS   | The pre-scan names Zod slow types, isolated declarations, explicit oRPC route types, driver-type leakage, and connector re-export risks with owning slices (`:634-642`).                                                                                                                                                              |

### Open-decision sweep (evaluator-run)

One implementation-shaping decision remains contradictory: whether a previously admitted replica
serves last-good indefinitely during a control-plane outage or stops serving after a defined bound.
The RFC says both “bounded” and “never self-drain,” then describes only indefinite serving plus a
staleness alert (`rfc-0001-runtime-versioned-automation.md:349-360`). The operator-configured bound,
expiry behavior, and cold-start/no-valid-registration behavior must be explicit if serving is truly
bounded; otherwise the plan and RFC must consistently call the chosen contract unbounded last-good
availability. The chosen behavior needs the promised failure test in A8/§13.

The §15 owner questions and P-1..P-5 remain safe to defer under their stated entry criteria.

### Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **[BLOCKER] Make the outage availability contract singular and prove it end to end.** §5.3 calls
   serving “bounded” while requiring replicas never to self-drain and defining no maximum or expiry
   transition (`rfc-0001-runtime-versioned-automation.md:349-360`). Choose an actual bound and its
   post-bound behavior, or explicitly choose indefinite last-good serving and remove every “bounded”
   claim from the RFC, plan, risk row, and PR. Specify cold-start/no-current-registration behavior.
   Add the promised management/feed/store-outage scenario—cached revision succeeds, unseen revision
   retries then exhausts, reconnect validates/converges—to §13 and A8; today §13 has no outage case
   and A8 merely references §13/BG-1 (`:648-673`, `:631`).

2. **[BLOCKER] Finish the file-level D-5 cleanup inventory, including live CLI and deploy
   consumers.** The table removes the store/override directory and Windows writer but omits the
   dependency composition that imports/constructs/exports `runtimeConfigStore`
   (`packages/cli/src/public/features/root/public-command-dependencies.ts:14-15,87-88,198,260`) and
   the public deploy flags/options `--force-runtime-config`, `--fail-on-drift`, `--keep-runtime`,
   `forceRuntimeConfig`, plus the runtime-path merge loop
   (`packages/cli/src/public/features/deploy/build/build-deploy-command.ts:39-47,61`,
   `build-windows-options.ts:1-15`, `build-deploy.ts:23-24`, `build-windows-runtime.ts:82-116`). Add
   explicit delete/rewrite dispositions and owning A6 slices for that complete option/DI/merge
   surface; otherwise legacy runtime-config controls and compile dependencies survive the claimed
   clean break (`rfc-0001-runtime-versioned-automation.md:568-586`).

3. **[BLOCKER] Apply the selected gate matrix to the table rather than declaring it complete in
   prose.** Add required consumer gates to the public ARCHETYPE-2/3/5 slices
   A1a/A1b/A1c/A3a/A4a/A5a, and publishability to A6b because it rewrites published CLI/plugin
   composition and scaffold output (`rfc-0001-runtime-versioned-automation.md:614-628`;
   `archetype-gate-matrix.md:60-76`). Recheck every row by its actual touched archetype and keep
   release-class overlays orthogonal. This is the same Cycle-3 gate finding, not genuinely resolved.

4. **[BLOCKER] Repair the competitive study's evidence contract.** The heading still says “12
   dimensions” although the matrix contains 15 dimension rows after adding isolation,
   control/data-plane, and cockpit UX (`competitive-architecture-study.md:123-144`); RFC §14.1 and
   the live PR repeat twelve. More importantly, the study promises that every load-bearing cell is
   vendor-cited or marked partial/unknown (`:3-7`), but the three added rows contain uncited
   absolute cells. For example, Windmill is reduced to “deployment-level isolation” (`:142`) even
   though its official security documentation describes configurable per-job PID-namespace and
   NSJAIL isolation, with important default/host distinctions
   (https://www.windmill.dev/docs/advanced/security_isolation). Cite official sources for every new
   load-bearing cell and encode configuration/default nuance or mark the cell unknown/partial. Then
   correct the dimension count everywhere. The narrowed negative claims and no-empirical-performance
   rule may remain.

5. **[HIGH] Reconcile and format the complete review surface after the authorized Cycle 4.** Update
   the selected archetypes and evaluation state in `plan.md:3-20,95-113`, P-5/Cycle-4 state in
   `context-pack.md:3,14-29`, G6 in `phase-registry.md:13`, the stale hold text in
   `worklog.md:177-198`, and PR #1446's checked S5/current-state wording. The PR's head SHA, draft
   state, labels, milestone, DoD, and Drift/Debt structure are otherwise correct. Run the claimed
   focused fmt gate: `docs:links` passes, but `deno fmt --check` currently fails on `plan.md`,
   `worklog.md`, `context-pack.md`, and `competitive-architecture-study.md`, contradicting
   `plan.md:109-111` and `worklog.md:175,198`.

### Notes

- The actual `3c918a64e` text—not its close-out narrative—was evaluated. Secret wording, TM9/C8,
  complete activation snapshots, pinned dispatch classifications, leased rejoin validation,
  requested trigger/Windows/task-dir inventory additions, release-class additions, and the three new
  study dimensions were all verified directly.
- D-10 runtime-versioned differentiation, D-4 clean-sheet authority, D-5 no-compat direction, D-3
  frontend dependency cut, contract-first ownership, plugin thinness, and the prohibition on
  hardcoded plugin names remain intact.
- `docs:links` passed with zero broken links/anchors/orphans. Focused formatting failed as reported;
  no formatter was run in write mode. The evaluator worktree remained clean.
- Live PR #1446 was re-inspected read-only at head `774f3ee19`: open, mergeable, draft, sole
  `status:plan-eval`, milestone assigned, six comments, and no GitHub mutation performed.
- No RFC, plan, worklog, context pack, source, issue, comment, label, commit, or branch was changed.
  This Cycle-4 append is the only filesystem mutation.

PLAN-EVAL: FAIL_PLAN

## Cycle 5

- Plan evaluator session: same dedicated Codex GPT-5.6 Sol · xhigh evaluator session / 2026-08-11
  (owner override D-2), Cycle 5 explicitly ordered by the owner as the deciding pass
- Evaluator worktree: `/home/codex/repos/ns-rfc-plan-eval`, branch
  `eval/rfc-runtime-versioned-automation`, clean at `cd3fd1e583fdb8d7755897ef878608e2185a676b`
- Author worktree: `/home/codex/repos/ns-rfc-runtime-versioned-automation`, same source commit
  before this verdict append
- Surface / archetype: docs RFC planning future ARCHETYPE-1/2/3/5/6 package, runtime, plugin, CLI,
  scaffold, DB, Aspire, and frontend waves
- Scope overlays: `SCOPE-docs`; adversarial RFC architecture and competitive-evidence review; no
  implementation evaluation

### Cycle-4 finding resolution audit

| Cycle-4 finding                                       | Cycle-5 result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1 — singular outage availability contract + A8 proof | PARTIAL        | §5.3 step 8 now clearly chooses indefinite last-good serving, says the staleness SLO bounds silence rather than serving, defines idle-and-loud empty cold start, and §13 test 8 exercises outage/retry/rejoin (`rfc-0001-runtime-versioned-automation.md:349-365,678-683`). The preceding leased-registration rule still mandates the opposite serving transition on lease lapse (`:344-348`), so the state machine is not singular (finding 1). |
| F2 — complete CLI/deploy clean-break inventory        | PASS           | §10 now dispositions the CLI DI construction/export and the public deploy flags/options/runtime-path merge loop with owning A6a/A6b slices (`:571-593`). Focused tree searches reconfirmed those are the live composition and deploy surfaces.                                                                                                                                                                                                   |
| F3 — full gate families                               | PASS           | Required `C` is present on A1a/A1b/A1c/A3a/A4a/A5a and `P` is present on A6b; public package/plugin rows now carry the selected S/F/R/C/P families as applicable, with orthogonal release classes on DB/Aspire/published-CLI/scaffold surfaces (`:609-639`; `archetype-gate-matrix.md:60-76`).                                                                                                                                                   |
| F4 — competitive-study count and evidence contract    | PASS           | The study explains twelve owner dimensions rendered as fifteen rows, strengthens the legend, gives Windmill's official isolation source and caveats, and marks unassessed dedicated-security/UX cells partial (`competitive-architecture-study.md:124-150`). RFC §14.1 uses the same count model (`rfc-0001-runtime-versioned-automation.md:719-727`). No empirical performance number was reintroduced.                                         |
| F5 — current review surface + formatting              | PARTIAL        | The plan profile, risk, phase registry, and current worklog entry reflect Cycle 5 (`plan.md:3-23,66-96`; `phase-registry.md:13`; `worklog.md:196-214`), and focused fmt plus `docs:links` are green. The context pack and live PR remain materially stale (finding 2).                                                                                                                                                                           |

### Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md:6-13` re-baselines exactly to `origin/main`; HEAD's merge-base and current `origin/main` are both `2256a67bf`. Focused `rtk grep` and `deno doc packages/runtime-config/mod.ts` reconfirmed that loader/watcher exports exist without a production consumer and that the distinct runtime task model remains in the current tree. The corrected competitive study is bounded and sourced (`competitive-architecture-study.md:3-12,124-150,231-239`). |
| Decisions locked                        | FAIL   | Ownership, activation totals, store parity, T1, cron, and outage duration are stated with rationale. Lease lapse still has two incompatible serving transitions: step 7 requires re-registration/current-snapshot validation before serving, while step 8 says an expired lease never removes the right to serve and even permits persisted last-good cold start during control-plane outage (`rfc-0001-runtime-versioned-automation.md:344-360`).                |
| Open-decision sweep                     | FAIL   | `plan.md:86-96` calls the outage contract resolved, but it does not resolve which rule wins for (a) a continuously running replica whose lease expires or (b) a restarted replica with persisted last-good state while the control plane is unavailable. That choice changes admission/serving state and tests, so it is not safe to leave implicit.                                                                                                              |
| Commit slices (< 30, gate + files each) | FAIL   | The implementation roadmap is ordered, below 30, PR-sized, and names file groups and proving gates (`rfc-0001-runtime-versioned-automation.md:609-639`). The docs-run S4 gate includes PR-body reconciliation and is marked done (`plan.md:107-108`), but the live body is still at Cycle 3/future-Cycle-4 state; the Design checkpoint also says S1-S5 while the plan has S1-S6 (`worklog.md:103-105`; finding 2).                                               |
| Risk register                           | FAIL   | Risks and mitigations are comprehensive, but the outage mitigation calls the contract singular without addressing step 7's contradictory lease-lapse serving transition (`plan.md:66-84`; RFC `:344-360`).                                                                                                                                                                                                                                                        |
| Gate set selected                       | PASS   | §12 defines S/F/R/C/P, applies the archetype matrix to every future package/plugin slice, preserves the frontend overlay, and adds the required release classes (`rfc-0001-runtime-versioned-automation.md:609-639`).                                                                                                                                                                                                                                             |
| Deferred scope explicit                 | PASS   | P-1..P-5 have rationales and entry criteria (`:599-607`); naming, two-person policy, and retention defaults remain explicitly classified with entry criteria (`:766-784`).                                                                                                                                                                                                                                                                                        |
| jsr-audit surface scan (pkg/plugin)     | PASS   | The pre-scan names Zod slow types, isolated declarations, explicit oRPC route types, driver-type leakage, and connector re-export risks and assigns them to slices before implementation (`:641-649`).                                                                                                                                                                                                                                                            |

### Open-decision sweep (evaluator-run)

One must-resolve-now state transition remains. Section 5.3 step 7 says any replica whose lease
lapsed must re-register and validate the current snapshot **before serving** and otherwise stays
drained (`rfc-0001-runtime-versioned-automation.md:344-348`). Step 8 says lease expiry governs only
new-epoch admission, never the right to serve, and allows a persisted last-good cold start to serve
during a control-plane outage (`:349-360`). The RFC must distinguish continuously serving,
restarting/rejoining, and empty cold-start cases and state whether “validation” during an outage is
local hash/schema validation or control-plane-currentness validation. This changes the runtime state
machine and cannot be delegated to implementation.

All §15 owner questions and P-1..P-5 remain safe to defer under their recorded entry criteria.

### Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **[BLOCKER] Reconcile §5.3 step 7 with the selected indefinite-serving contract.** The actual
   text still says a lapsed-lease replica must re-register and validate the current snapshot before
   serving and stays drained on failure (`rfc-0001-runtime-versioned-automation.md:344-348`),
   directly contradicting step 8's “expired lease forbids only accepting new epochs” and
   never-self-drain rule (`:349-360`). Define separately: (a) an already-serving replica whose lease
   expires, (b) a restarted/rejoining replica with persisted last-good state, and (c) a cold replica
   with no snapshot. State whether persisted-state validation is local hash/schema validation or
   requires control-plane currentness. Make step 7, step 8, the risk/open-decision text, and §13
   test 8 use that one transition model; explicitly test lease expiry while serving and restart with
   persisted last-good state.

2. **[HIGH] Finish the claimed Cycle-5 review-surface reconciliation.** The context pack still opens
   “post PLAN-EVAL cycle 1 fix” and says the deliverable has only P-1..P-4
   (`context-pack.md:3,14-19`), while its later paragraph says Cycle 5. The Design checkpoint still
   says constants/commit slices S1-S5 (`worklog.md:103-105`) despite plan S6. More importantly, live
   PR #1446 at head `cd3fd1e58` still checks S5 complete at Cycle 3, says Cycle 4 is only a future
   request, and its DoD references only Cycles 1-3/ordering Cycle 4. Update those current-state
   fields through Cycle 5 and accurately check completed DoD items. Keep the PR draft and sole
   `status:plan-eval`; no label/state change is requested here.

### Notes

- The actual `cd3fd1e58` files—not the fix summary—were evaluated. Cleanup rows, gate letters,
  competitive-study qualifications, selected archetypes, outage acceptance test, and formatting
  fixes were all verified directly.
- D-10 runtime-versioned differentiation, D-4 clean-sheet authority, D-5 no-compat direction, D-3
  frontend dependency cut, contract-first ownership, plugin thinness, honest T1 boundaries, bounded
  secret claims, and TM9/C8 remain intact.
- `docs:links` passed with zero broken links/anchors/orphans; `deno fmt --check` passed on the RFC,
  plan, worklog, context pack, phase registry, and competitive study; `git diff --check` passed.
- Live PR #1446 was re-inspected read-only at head `cd3fd1e58`: open, mergeable, draft, sole
  `status:plan-eval`, milestone assigned, six comments. Its state/body discrepancy is finding 2.
- No RFC, plan, worklog, context pack, source, issue, comment, label, commit, or branch was changed.
  This Cycle-5 append is the only filesystem mutation.

PLAN-EVAL: FAIL_PLAN

## Cycle 6

- Plan evaluator session: same dedicated Codex GPT-5.6 Sol · xhigh evaluator session / 2026-08-11
  (owner override D-2), Cycle 6 explicitly ordered by the owner as the deciding pass on the
  D-9-amended head
- Evaluator worktree: `/home/codex/repos/ns-rfc-plan-eval`, branch
  `eval/rfc-runtime-versioned-automation`, clean at `2518791f3fa65de4bbcfe440998cf9b68c48544a`
- Author worktree: `/home/codex/repos/ns-rfc-runtime-versioned-automation`, same source commit
  before this verdict append
- Surface / archetype: docs RFC planning future ARCHETYPE-1/2/3/5/6 package, runtime, plugin, CLI,
  scaffold, DB, Aspire, production-console, and staged DevTools work
- Scope overlays: `SCOPE-docs`; full adversarial plan gate, Cycle-5 resolution audit, and D-9
  amendment review; no implementation evaluation

### Cycle-5 finding resolution audit

| Cycle-5 finding                         | Cycle-6 result | Evidence                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 — one lease/serving transition model | PASS           | §5.3 now makes local hash/schema-major validation the sole serving precondition and control-plane currentness only a convergence precondition. It explicitly covers lease expiry while serving, persisted-last-good restart without control-plane contact, and empty/corrupt cold start; §13 test 8 exercises all three (`rfc-0001-runtime-versioned-automation.md:344-373,700-718`). |
| F2 — current review surfaces            | PARTIAL        | The context pack and live PR body now carry Cycle 5/D-9 and the PR is at the evaluated head. The Design checkpoint still says P-1..P-5 and S1-S5 while naming S1-S6 elsewhere, the locked plan sweep still stops at P-5, and the phase registry still calls Cycle 5 the deciding future pass (`worklog.md:95-107`; `plan.md:3-12,89-99,112-118`; `phase-registry.md:13`; finding 1).  |

### D-9 amendment audit

| Required relationship                                                      | Result | Evidence                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two operator surfaces, with #890/#922 sufficient only for production/admin | PASS   | §8.2 distinguishes the userland-app production/admin console from a separate DevTools family/host and narrows the #922 minimum cut to surface 1 (`rfc-0001-runtime-versioned-automation.md:489-523`).                                                                         |
| DevTools staged rather than silently designed here                         | PASS   | P-6 requires a dedicated DevTools RFC, treats #400/#685/#780/#506 as evidence rather than ratified architecture, names consumed stable contracts, and has an implementation-dependent entry criterion (`:514-523,629-638`).                                                   |
| Roadmap consistency                                                        | PASS   | A7 contains list/detail/run/history and lifecycle flows only, explicitly excludes diagnostics/journey views, and carries the #922/#934 dependency cut; P-1..P-6 is a separate staged row (`:649-670`). Backend slices A0-A6 remain frontend-independent (`:525-527,640-670`). |
| General frontend contribution mechanisms not pre-empted                    | PASS   | §8.2 enumerates the five candidate surfaces, says this RFC designs none of their general mechanisms, consumes only the ratified app family, and stages DevTools (`:496-501`).                                                                                                 |
| Cross-artifact lock record                                                 | FAIL   | The hard constraint is updated for D-9, but the formal plan sweep and Design checkpoint omit P-6 and the phase registry is stale (`plan.md:59-65,89-99`; `worklog.md:95-107`; `phase-registry.md:13`).                                                                        |

### Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md:6-13` still re-baselines to `origin/main`; HEAD's merge-base and current `origin/main` both resolve to `2256a67bf`. Fresh `deno doc packages/runtime-config/mod.ts` plus focused production-use searches reconfirmed the exported loader/watcher, fail-empty behavior, distinct `RuntimeTask` model, and lack of a production consumer. Competitive claims remain qualified and primary-source bounded. |
| Decisions locked                        | PASS   | Ownership, complete activation epochs, revision-pinned dispatch, lease/serving transitions, store parity, T1 limits, cron ownership, and the two-frontend boundary are now unambiguous in the RFC (`rfc-0001-runtime-versioned-automation.md:196-378,489-565`).                                                                                                                                                      |
| Open-decision sweep                     | FAIL   | The locked plan explicitly says only P-1..P-5 are deferred, despite new P-6 being a staged decision. P-6 is substantively classified in RFC §11, but it is absent from the artifact the plan-gate designates as the complete sweep (`plan.md:89-99`; RFC `:629-638`).                                                                                                                                                |
| Commit slices (< 30, gate + files each) | FAIL   | The RFC's A0-A8 roadmap remains PR-sized, ordered, file-scoped, and gated (`rfc-0001-runtime-versioned-automation.md:640-670`). The docs-run Design checkpoint still says “Commit slices — S1-S5” while the locked plan and constants contain S1-S6, so its claimed reconciliation is false (`worklog.md:103-107`; `plan.md:101-118`).                                                                               |
| Risk register                           | PASS   | The expanded register covers evidence drift, partial activation, feed/poll ordering, schema skew, store divergence, T1, integrity, secrets, loader policy, cron duplication, outage serving, and frontend dependency sequencing with owners/mitigations (`plan.md:69-87`). D-9's DevTools boundary is also a hard constraint (`:59-65`).                                                                             |
| Gate set selected                       | PASS   | §12 defines and applies S/F/R/C/P, frontend dependency, and release classes to the future package/plugin slices (`rfc-0001-runtime-versioned-automation.md:640-670`).                                                                                                                                                                                                                                                |
| Deferred scope explicit                 | PASS   | P-1..P-6 each have rationale and entry criteria in §11; §15 separately classifies the only spelling/policy/default questions (`:629-638,802-822`).                                                                                                                                                                                                                                                                   |
| jsr-audit surface scan (pkg/plugin)     | PASS   | The pre-scan continues to cover Zod slow types, isolated declarations, explicit oRPC route types, driver leakage, connector thinness, and publish gates before implementation (`:672-680`).                                                                                                                                                                                                                          |

### Open-decision sweep (evaluator-run)

No unresolved runtime architecture decision remains. The Cycle-5 serving-state blocker is genuinely
closed, and D-9 makes the production-console/DevTools ownership boundary a decided split. P-6 is a
safe staged prerequisite because its rationale, consumed contracts, and entry criterion are explicit
in RFC §11. The failure is record integrity: the locked plan's mandatory sweep still claims the
staged set is P-1..P-5, so it is not a complete sweep of the amended plan.

### Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **[BLOCKER] Reconcile the formal plan record with D-9/P-6 and the actual slice set.** Change the
   locked plan's open-decision sweep from P-1..P-5 to P-1..P-6 and record P-6's safe-deferral
   rationale/entry criterion; bring the plan status and G6 phase-registry state through Cycle 6;
   change the Design checkpoint's domain vocabulary to P-1..P-6 and “Commit slices — S1-S6.” These
   are not optional progress prose: the open-decision sweep and Design checkpoint are plan-gate
   inputs, and their current statements contradict RFC §11 and the plan's own S6 row
   (`plan.md:3-12,89-99,101-118`; `worklog.md:95-107`; `phase-registry.md:13`).

2. **[MEDIUM] Finish D-9 terminology reconciliation in the live PR body.** The new locked-decision
   item correctly describes two surfaces, but the summary still says a singular “management
   cockpit,” old item 9 still says the cockpit as a whole is downstream of #890/#922, and items 12
   and 11 are out of order. Rename those old references to the production/admin console and order
   the decision list so the public review surface cannot be read as granting #890/#922 authority
   over DevTools. Keep the PR draft and retain `status:plan-eval`.

### Notes

- The actual `2518791f3` files—not the fix summary—were evaluated. The lease/serving model, test 8,
  D-9 split, A7 narrowing, P-6 staging, backend independence, evidence qualifications, cleanup
  inventory, gate letters, security bounds, and competitive-study integration were verified directly
  and introduced no architecture regression.
- `docs:links` passed with zero broken links/anchors/orphans; focused `deno fmt --check` passed on
  the RFC, plan, worklog, context pack, phase registry, and competitive study;
  `git diff --check
  cd3fd1e58..HEAD` passed. The evaluator worktree remained clean.
- Live PR #1446 was re-inspected read-only at head `2518791f3`: open, mergeable, draft, sole
  `status:plan-eval`, milestone assigned, six comments. No GitHub mutation was performed.
- No RFC, plan, worklog, context pack, phase registry, source, issue, comment, label, commit, or
  branch was changed. This Cycle-6 append is the only filesystem mutation.

PLAN-EVAL: FAIL_PLAN

## Cycle 7

- Plan evaluator session: same dedicated Codex GPT-5.6 Sol · xhigh evaluator session / 2026-08-11
  (owner override D-2), Cycle 7 explicitly ordered by the owner as the final pass
- Evaluator worktree: `/home/codex/repos/ns-rfc-plan-eval`, branch
  `eval/rfc-runtime-versioned-automation`, clean at `ed978eb689c69fe98dfd4a72cf642dab209844a8`
- Author worktree: `/home/codex/repos/ns-rfc-runtime-versioned-automation`, same source commit
  before this verdict append
- Surface / archetype: docs RFC planning future ARCHETYPE-1/2/3/5/6 package, runtime, plugin, CLI,
  scaffold, DB, Aspire, production-console, and staged DevTools work
- Scope overlays: `SCOPE-docs`; full adversarial plan gate and Cycle-6 resolution audit; no
  implementation evaluation

### Cycle-6 finding resolution audit

| Cycle-6 finding                                                   | Cycle-7 result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 — formal plan/design/phase record reconciliation               | PARTIAL        | The plan sweep now classifies P-1..P-6 with P-6's consumed contracts and entry criterion, commit slices now say S1–S6, and G6 is current through Cycle 6 (`plan.md:90-104`; `worklog.md:103-107`; `phase-registry.md:13`). The same Design checkpoint still defines the staged vocabulary as P-1..P-5, its fix note falsely claims P-1..P-6, and the plan/context status narratives still call Cycle 5 the deciding pass (`worklog.md:95-100,236-245`; `plan.md:3-13`; `context-pack.md:3,21-32`; finding 1). |
| F2 — D-9 terminology and decision-list reconciliation in PR #1446 | PASS           | The live summary names a production/admin operator console plus separately staged DevTools; locked decision 9 now contains the complete two-surface decision, scopes #890/#922 sufficiency to surface 1, stages DevTools behind P-6, and the list is ordered 1–11 without the old duplicate. The PR remains draft at head `ed978eb68`.                                                                                                                                                                        |

### Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md:6-13` still re-baselines to `origin/main`; HEAD's merge-base and current `origin/main` are both `2256a67bf`. Fresh `deno doc packages/runtime-config/mod.ts` and focused production-use search reconfirmed the exported loader/watcher and absence of a production consumer. No RFC or evidence file changed after Cycle 6. |
| Decisions locked                        | PASS   | The RFC continues to lock ownership, activation totals/CAS, revision pinning, leased admission versus serving, store parity, T1 limits, cron ownership, and the two-frontend boundary with rationale. Cycle 6 already found no unresolved runtime architecture decision, and `2518791f3..ed978eb68` contains no RFC change.              |
| Open-decision sweep                     | PASS   | The plan now covers P-1..P-6, states why P-6 is safe to defer, names the stable contracts it consumes and its entry criterion, and confirms no runtime slice depends on its outcome (`plan.md:90-104`; RFC §11 `rfc-0001-runtime-versioned-automation.md:629-638`). The evaluator sweep found no must-resolve decision.                  |
| Commit slices (< 30, gate + files each) | PASS   | S1–S6 are ordered and name files plus proving gates (`plan.md:106-125`); the RFC's future A0–A8 slices remain below 30, file-scoped, dependency-ordered, and fully gated (`rfc-0001-runtime-versioned-automation.md:640-670`). The Design checkpoint now agrees on S1–S6 (`worklog.md:103-105`).                                         |
| Risk register                           | PASS   | The register continues to cover evidence drift, partial activation, feed/poll ordering, schema skew, adapter divergence, T1, integrity, secrets, loader policy, cron duplication, outage behavior, and frontend sequencing with mitigations/owners (`plan.md:69-88`).                                                                    |
| Gate set selected                       | PASS   | The docs-source gates and CI skips are explicit, while §12 defines S/F/R/C/P, frontend edges, and release classes for future package/plugin slices (`plan.md:15-23`; RFC `:640-670`).                                                                                                                                                    |
| Deferred scope explicit                 | FAIL   | The Design checkpoint contradicts itself: domain vocabulary says prerequisite/staged items P-1..P-5, while its deferred-scope row and the locked plan say P-1..P-6 (`worklog.md:95-107`; `plan.md:90-104`). Because P-6 is the owner-directed D-9 boundary, the plan package does not yet state one unambiguous deferred set.            |
| jsr-audit surface scan (pkg/plugin)     | PASS   | The pre-scan still names Zod/isolated-declaration, explicit oRPC-route, driver-type leakage, connector-thinness, and publish risks and assigns them to future slices (`rfc-0001-runtime-versioned-automation.md:672-680`).                                                                                                               |

### Open-decision sweep (evaluator-run)

None. P-6 is safe to defer: the RFC defines its purpose, consumes already-scoped management,
history, convergence, and OTel contracts, and prevents this RFC from pre-empting the DevTools host.
The only failure is that the Design checkpoint still omits P-6 from its own domain-vocabulary list
while claiming that omission was fixed.

### Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **[BLOCKER] Complete the Cycle-6 record reconciliation against the actual text.** Change the
   Design checkpoint's domain-vocabulary range from P-1..P-5 to P-1..P-6 so it agrees with its own
   deferred-scope row, the locked plan, RFC §11, and the Cycle-6 fix note
   (`worklog.md:95-107,236-245`). Remove the remaining stale evaluation narratives: the locked plan
   still calls Cycle 5 the deciding pass and describes S5 only through earlier cycles
   (`plan.md:10-13,117-120`), while the context pack still opens post-Cycle-5 and ends at Cycle 5
   (`context-pack.md:3,21-32`). Bring those through Cycle 7 without changing any architecture.

2. **[HIGH] Reconcile the live PR's evaluation-progress fields after this verdict.** The D-9 wording
   fix itself passes, but S5 and Definition of Done still say Cycle 6 is the deciding future pass,
   even though Cycle 6 returned FAIL_PLAN and Cycle 7 is now complete. Update only those progress
   fields; preserve the corrected two-surface decision, draft state, and sole `status:plan-eval`.

### Notes

- The actual `ed978eb68` files—not the fix summary—were evaluated. The plan open-decision sweep,
  S1–S6 list, phase registry, and live PR D-9 wording were verified directly. The RFC did not change
  after Cycle 6, so its clean architecture judgment stands.
- `docs:links` passed with zero broken links/anchors/orphans; focused `deno fmt --check` passed on
  the RFC, plan, worklog, context pack, phase registry, and competitive study;
  `git diff --check
  2518791f3..HEAD` passed. The evaluator worktree remained clean.
- Live PR #1446 was re-inspected read-only at head `ed978eb68`: open, mergeable, draft, sole
  `status:plan-eval`, milestone assigned, six comments. No GitHub mutation was performed.
- No RFC, plan, worklog, context pack, phase registry, source, issue, comment, label, commit, or
  branch was changed. This Cycle-7 append is the only filesystem mutation.

PLAN-EVAL: FAIL_PLAN
