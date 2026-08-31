# Plan: typed plugin CLI contribution RFC

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `docs-rfc-plugin-cli-contribution--1502`                             |
| Branch         | `docs/rfc-plugin-cli-contribution`                                   |
| Phase          | `impl` — S1 public-contract authoring                                |
| Target         | `rfcs/0000-plugin-cli-contribution.md` plus tracked harness evidence |
| Archetype      | 4 — public DSL/builder (described future surface)                    |
| Scope overlays | `SCOPE-docs`                                                         |

## Archetype

The approved contract is Archetype 4: a public, literal-preserving plugin CLI definition DSL and
builder with named extension axes. The docs overlay governs this leaf because it authors an RFC and
run evidence only. Later implementation children separately activate Archetype 4 for
`@netscript/plugin/cli`, Archetype 6 for the existing CLI host, and Archetype 5 for thin plugin
consumers; the RFC must not blur those owners.

## Contract Resolution

The binding coordinator record is
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`,
contract key `rfc-plugin-cli-contribution`. It records `executionKind: implementation`, names
`packages/cli/`, `packages/plugin/`, `rfcs/`, RFC 0003, and RFC 0005 under `fileSurfaces`, requires
`check`, `test`, `publish-dry-run`, `arch-check`, `docs-source-format`, and `docs-accuracy`, and
sets `jsrAudit.applicable: true`.

The durable coordinator brief at
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/briefs/topic-features/implement.md:24`
(commit `8775be7b3`) decides how those fields apply: #1502 delivers the RFC document and proposes a
separate later implementation epic; package/plugin and accepted-RFC paths are inspection/audit
surfaces, not mutation authority. The six proving gates and JSR audit remain immutable and apply to
the inspected CLI/plugin baseline and the actual docs diff. This significant tension and resolution
are recorded in `drift.md`.

The coordinator did not edit `leaf-contracts.json`; key `rfc-plugin-cli-contribution` retains its
implementation-shaped fields. The checked-in brief is an explicit dispatch-level narrowing, not a
silent contract-file rewrite.

No source-scope expansion is inferred from `executionKind` or `fileSurfaces`. If accurate RFC
authoring requires a package/plugin edit, the leaf stops until the coordinator amends contract key
`rfc-plugin-cli-contribution`; any amendment requires a new locked plan and separate PLAN-EVAL.

## Current Doctrine Verdict

- `packages/plugin`: **Keep** — preserve manifest, discovery, validation, and host contracts while
  adding a named, deterministic extension axis.
- `packages/cli`: **Keep** — preserve the kernel/surface split and keep Cliffy, filesystem,
  subprocess, and transaction adapters private.
- This leaf: docs-only; it changes neither verdict and creates no architecture-debt entry.

## Axioms in Play

| Axiom   | Why it matters                                                                                                   |
| ------- | ---------------------------------------------------------------------------------------------------------------- |
| A1–A3   | The RFC defines contract, contributor guide, and reference semantics before code.                                |
| A6–A7   | Wrap Cliffy/Deno/path primitives behind host adapters; do not invent or expose replacements.                     |
| A9–A11  | Public surface, one composition root, explicit contribution axis, and package ownership are fixed.               |
| A12–A13 | Async bootstrap, cancellation, partial failure, staging, and rollback are product semantics.                     |
| A14     | Collision, isolation, capability, publishability, and consumer conformance are implementation fitness functions. |

## Goal

Author a house-shaped RFC for one typed plugin CLI command contribution and generation seam that
deploy, DevTools, frontend generators, SDK/runtime management commands, and future plugins can
consume without importing one another or exposing CLI host internals.

## Scope

- Add `rfcs/0000-plugin-cli-contribution.md` only after separate PLAN-EVAL passes.
- Decide public descriptors/builders, mount/router/help/completion/errors, discovery/bootstrap,
  isolation/collisions/order/absent UX, generator planning and transaction semantics, capability
  checks, doctor integration, manifest/pointer ownership, compatibility, migration, and security.
- Propose a later implementation epic with PR-sized children and an explicit duplicate-file audit.
- Inspect and audit `packages/cli/`, `packages/plugin/`, RFC 0003, and RFC 0005 without mutating
  them; preserve measured public-export, dependency-pin, publish, asset, and architecture evidence.
- Satisfy the contract's six proving gates during plan repair and rerun the final applicable set
  after RFC authoring.
- Maintain tracked run artifacts, a draft direct-to-`main` PR, phase comments, labels, milestone,
  acceptance mapping, and gate evidence.

## Non-Scope

- No `packages/**`, `plugins/**`, `apps/**`, generated-workspace, CI, lockfile, cache, or release
  changes in this leaf.
- No implementation of the CLI seam, no local publication, no `scaffold.runtime`, no release-wide
  expensive gate, and no `quality:gate` for the docs-only diff.
- No issue/epic/child filing or mutation of #904–#908, #1474, #1477, #1348, #1502 acceptance boxes,
  milestones, or the central 0.0.7 cluster.
- No merge, ready-for-review transition, publication, or self-issued PLAN-EVAL/IMPL-EVAL verdict.
- No change to RFC 0003, RFC 0005, or frontend/SDK/runtime/DevTools payload contracts; those files
  are compatibility evidence only.

## Hidden Scope

- Reconcile two plugin manifests: runtime `definePlugin()` contributions and installer
  `scaffold.plugin.json` pointers, with doctor-enforced identity equality rather than duplicated
  payloads.
- Provide a compatibility/deprecation path for the already-published inheritance-based
  `@netscript/plugin/cli` helpers and hardcoded `plugin auth`/`plugin ai` host groups.
- Treat manifest `.strict()` evolution and the existing #1474 work item as a duplicate-audit input,
  not an invisible prerequisite.
- Separate command output rendering from workspace mutation transactions; preview must prove both no
  writes and no post-action side effects.
- State plugin-absent UX for a host-declared mount even when its contributing plugin is not
  installed, without importing the absent package.
- Apply JSR audit bars to `@netscript/plugin/cli`, protocol/config, `@netscript/cli`, and every
  first-party consumer plugin subpath proposed by the later epic.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                                                                                                        | Rationale                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| D0  | The draft path is `rfcs/0000-plugin-cli-contribution.md`; status and number remain Draft/0000 until maintainer acceptance.                                                                                                                                                                                                      | `rfcs/README.md` and live index.                                                              |
| D1  | The public contract owner is the existing `@netscript/plugin/cli` subpath; `@netscript/cli` owns the private host/Cliffy adapter and mutation transaction.                                                                                                                                                                      | Preserves A4/A6 direction and avoids a new package or host-internal leak.                     |
| D2  | Primary authoring is a compositional `definePluginCliContribution(...)` / builder returning an immutable definition. The existing `PluginCli` abstract/flat helpers enter an explicit compatibility/deprecation child; inheritance is not expanded.                                                                             | Doctrine registration-over-inheritance; measured live surface.                                |
| D3  | A v1 contribution attaches nested command children to exactly one host-declared, explicitly extensible top-level mount. Plugins cannot add arbitrary top-level commands, shadow a built-in, or extend a closed mount.                                                                                                           | Meets deploy's `deploy` child requirement and prevents global namespace capture.              |
| D4  | The static descriptor owns route segments, arguments/options, help text, examples, aliases, output modes, capability declarations, stable command/error IDs, and lazy module/export references. It contains no Cliffy objects, host ports, filesystem handles, or executable closures.                                          | Help/discovery can be safe, deterministic data.                                               |
| D5  | Nested route composition validates the complete tree before argument parsing. Duplicate canonical paths, aliases, option names, command IDs, or reserved segments fail with structured diagnostics naming both owners. Successful order is plugin-load independent and sorted by mount, route, plugin identity, and command ID. | No last-wins semantics; RFC 0001 and doctrine determinism.                                    |
| D6  | Help and shell-completion scripts derive only from static descriptors. Dynamic completion providers are out of v1; help/completion never bootstrap plugin handlers or perform plugin I/O.                                                                                                                                       | Predictable startup, isolation, and least privilege.                                          |
| D7  | Discovery is explicit from configured/installed plugin manifests. Install/update/remove/sync generates a static CLI registry from validated pointers; no `node_modules` scan and no semantic dependency on `Promise.all` completion order.                                                                                      | Accepted frontend/SDK discovery law.                                                          |
| D8  | Only the selected command's handler factory is imported and bootstrapped asynchronously. Bootstrap receives cancellation/deadline and narrowed capabilities; sibling failures are isolated and attributed. Descriptor or handler load failures never crash unrelated built-ins/plugins.                                         | Startup budget and fault containment from #905.                                               |
| D9  | Host mounts may declare an absent-owner hint. An explicit invocation of a missing optional mount/child returns a stable `plugin-absent` usage diagnostic with an install/remediation command; normal help lists only available children plus intentional host stubs.                                                            | Useful absent UX without importing missing code.                                              |
| D10 | Plugins own domain-specific error codes/details; `@netscript/plugin/cli` owns the bounded serializable error/result vocabulary; the host owns redaction, rendering, JSON/text selection, and exit-code mapping. Unknown thrown values are normalized to a redacted plugin failure.                                              | Stable public contract and safe edge presentation.                                            |
| D11 | Command handlers receive a narrow invocation context. Workspace-changing commands request a named generator planner; plugin code returns a typed, workspace-relative mutation plan and never receives raw CLI internals or an unrestricted filesystem/process port.                                                             | One seam for commands and generators; thin plugin boundary.                                   |
| D12 | The host owns generation: validate declared capabilities and path containment, compute deterministic plan, render preview, stage out of place, run focused validation, atomically swap/commit, or roll back. `--preview`/`--dry-run` performs zero writes, post-scripts, network calls, or handler side effects.                | Transactional output and honest no-write semantics.                                           |
| D13 | Generation results distinguish planned/created/modified/deleted/skipped files and diagnostics. Output is buffered and rendered after planning/commit so JSON and text remain coherent; byte-identical output is skipped.                                                                                                        | Idempotence and automation-friendly output.                                                   |
| D14 | Installer metadata carries a parse-only CLI pointer plus static capabilities; runtime `PluginContributions.cli` carries the matching pointer/identity. No descriptor payload is duplicated. Doctor verifies equality, export-map presence, stale generated output, family/major support, capability drift, and load failures.   | Static auditability plus runtime registration cross-check.                                    |
| D15 | Any new top-level installer pointer is sequenced after the already-accepted `.passthrough()` schema-evolution law, while its block is validated strictly by the CLI generator/doctor. The implementation epic duplicate-audits #1474 before filing.                                                                             | Live `.strict()` otherwise rejects forward-compatible blocks; retain typo validation locally. |
| D16 | CLI contribution compatibility uses `{ family: 'plugin-cli', major: 1 }` and explicit supported windows. Additive optional descriptor fields are minor; grammar/meaning changes require a new major.                                                                                                                            | Matches accepted contribution contracts without importing their payload types.                |
| D17 | Deploy and DevTools depend only on the shared public contract. Deploy keeps target-specific routes; DevTools keeps its generated-host architecture. Neither imports the other's types, loaders, templates, or commands.                                                                                                         | Acceptance box 3 and thin-plugin law.                                                         |
| D18 | RFC 0001 SDK contributions, RFC 0002 runtime automation, and RFC 0003 business commands remain handler-level consumers. The CLI seam does not become a client generator, runtime definition store, or transaction engine.                                                                                                       | Preserves accepted owners and semantics.                                                      |
| D19 | Frontend/RFC 0005 registry generation supplies lifecycle precedent only. CLI descriptors do not reuse frontend/DevTools envelopes or packages; shared family/pointer laws are cited rather than copied.                                                                                                                         | Compatibility without cross-domain coupling.                                                  |
| D20 | The later implementation epic begins with a duplicate-file audit covering at least #904–#908, #1474, #1477, #946, #1354, closed #424, and searches for equivalent command/manifest/generator work. Existing issues are amended/folded before any new child is filed.                                                            | Prevents duplicate board scope.                                                               |
| D21 | This RFC leaf has no global expensive gate. Implementation children use focused generated-fixture and package gates; release-level `scaffold.runtime` remains centrally owned and is not consumed here.                                                                                                                         | Preserves the release's single expensive-gate slot.                                           |
| D22 | Contract key `rfc-plugin-cli-contribution` is applied as an RFC-only mutation boundary with package/plugin inspection, all six proving gates, and `jsrAudit.applicable: true`. Package/plugin source work requires a coordinator amendment, new plan, and new PLAN-EVAL.                                                        | Implements the authoritative cycle-1 scope resolution without waiving coordinator evidence.   |
| D23 | PR #1651 retains `Closes #1502`: this RFC leaf is the dispatched completion of #1502. The later implementation epic is a separate proposal, is not #1502, and is neither filed nor milestone-assigned here.                                                                                                                     | Prevents the closing keyword from being mistaken for closure of future implementation work.   |

## Proposed Public Vocabulary for the RFC

The RFC will define exact TypeScript shapes after PLAN-EVAL around these names; names may receive
editorial correction without changing ownership or semantics:

- `PluginCliContributionDefinition` — immutable family/version/plugin/mount descriptor.
- `PluginCliCommandDefinition` — recursive static route/argument/option/help/capability definition.
- `PluginCliHandlerRef` — safe package-relative `{ module, export }` pointer loaded only on
  dispatch.
- `PluginCliGeneratorDefinition` / `PluginCliGenerationPlan` — static planner pointer and
  host-neutral planned file operations.
- `PluginCliCapability` / `PluginCliCapabilityGrant` — declared versus host-granted operations.
- `PluginCliInvocation` / `PluginCliInvocationResult` / `PluginCliFailure` — serializable boundary
  values. The already-published incompatible `PluginCliResult` name is preserved for legacy
  compatibility and is never reassigned within major 1.
- `PluginCliDiagnosticCode` — finite collision/load/capability/absent/plan/commit failure
  vocabulary.
- `PluginCliManifestPointer` — parse-only pointer cross-checked with runtime registration.

The RFC must include literal-preserving builder examples, but no product code is authored in this
leaf.

## Lifecycle and Failure Matrix to Encode

| Phase                      | Inputs loaded                                 | Failure behavior                                                                                               |
| -------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Manifest parse             | installer data only                           | Unknown future block passes after prerequisite; malformed CLI pointer reported without executing plugin code.  |
| Registry generation        | static descriptor exports only                | Per-plugin validation failures are attributed; collisions prevent new registry commit; prior registry remains. |
| Help/completion            | generated static registry                     | No handler import; deterministic output; broken plugin is diagnosed without crashing unrelated help.           |
| Dispatch                   | selected handler factory only                 | Deadline/cancellation/capability refusal before execution; thrown values normalized/redacted.                  |
| Preview                    | descriptor + selected planner                 | Complete deterministic plan/output, zero writes and external effects.                                          |
| Apply                      | validated plan in host stage                  | Focused check then atomic swap; rollback on validation/commit error; post-commit output is coherent.           |
| Install/update/remove/sync | all configured pointers                       | Full replace-set including empty emissions; stale entries disappear only on successful commit.                 |
| Doctor                     | manifests, registry, export maps, diagnostics | Stable state taxonomy and remediation; does not repair implicitly.                                             |

## Open-Decision Sweep

| Decision                                                                                      | Status                                                                                          | Notes                                                                                                                            |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Exact public type/function spelling                                                           | resolved for the published collision; other names may receive non-breaking editorial refinement | S1 introduces `PluginCliInvocationResult`; live `PluginCliResult` retains its old shape until an explicit major-version removal. |
| Whether absent host stubs appear in default help or only on explicit invocation               | safe FCP/product-copy choice                                                                    | D9 fixes behavior and install hint; visibility policy is host metadata.                                                          |
| Exact finite exit-code mapping                                                                | safe FCP                                                                                        | D10 fixes error ownership and serialization; host may map categories to documented codes.                                        |
| Maximum descriptor/tree size and bootstrap deadline defaults                                  | safe FCP/operations policy                                                                      | Bounds must exist and be configurable; values do not alter architecture.                                                         |
| Whether existing `PluginCli` helpers are deprecated for one release or replaced at next minor | safe rollout decision                                                                           | D2 requires an explicit compatibility child and migration guide either way.                                                      |
| Exact issue number/title/milestone for the separate later implementation epic                 | safe board-maintainer decision                                                                  | D23 fixes that it is not #1502; this leaf proposes shape only and files nothing.                                                 |
| Manifest schema prerequisite ownership versus #1474                                           | must be audited before child filing, not before RFC                                             | D15 fixes semantic outcome; duplicate audit chooses board owner.                                                                 |

No open item may change the public owner, mount model, discovery/bootstrap, mutation transaction, or
compatibility boundary. A PLAN-EVAL finding that does is a plan failure, not an FCP item.

The scope/contract question raised as FP-3 is no longer open: the cycle-1 dispatch resolves this as
an RFC-only mutation leaf with package/plugin audit surfaces. `Closes #1502` closes only that RFC
tracking work; it does not close or pre-create the future implementation epic.

## Risk Register

| Risk                                                           | Mitigation                                                                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A static descriptor accidentally executes plugin code          | Require serializable definitions, generated registry, import-safety tests, and help/completion negative fixtures.                                                                     |
| Host-declared mounts are too restrictive for future plugins    | Version the mount registry; new mounts are explicit host additions, not plugin namespace capture.                                                                                     |
| Runtime and installer pointers drift                           | Store one pointer value per manifest and doctor/generator cross-check owner, family, major, module, and export.                                                                       |
| `.passthrough()` hides pointer typos                           | Validate the known CLI block strictly at generation/doctor time and test malformed variants.                                                                                          |
| Plugin generator writes outside workspace or partially applies | No raw FS; workspace-relative plan, containment/capability validation, stage/check/swap/rollback.                                                                                     |
| Async bootstrap harms startup or one plugin crashes the CLI    | Lazy selected-handler import, deadline/cancellation, per-plugin isolation, plugin-less startup budget gate.                                                                           |
| Cliffy types leak into public packages                         | Public-surface audit and doc lint; adapter remains internal to `@netscript/cli`.                                                                                                      |
| Recursive builder creates JSR slow types                       | Explicit annotations, isolated-declaration probe, full export-map doc lint, publish dry-run, consumer import fixture.                                                                 |
| Published code reads assets through `import.meta` / file URLs  | Reject runtime asset reads, import attributes, and unguarded file-URL conversion; use generated TypeScript constants, publish-asset freshness, release preflight, and consumer proof. |
| Existing helpers/hardcoded commands break                      | Compatibility adapter and migration child, snapshot/behavior tests, no silent semantic replacement.                                                                                   |
| Proposed epic duplicates live board work                       | Duplicate-file audit and amend/fold-first rule before any filing.                                                                                                                     |
| Docs imply consumer RFCs are implemented                       | Current/future tables and `deno doc` evidence; cite accepted law separately from shipped state.                                                                                       |
| Contract file surfaces are mistaken for mutation authority     | D22 plus significant drift entry; source expansion requires coordinator amendment, new plan, and PLAN-EVAL.                                                                           |

## Anti-Patterns to Resolve or Avoid

| AP                                  | Status                          | Plan                                                                                |
| ----------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| AP-1 god package                    | risk                            | Keep public definitions in plugin package and behavior in CLI host; no new package. |
| AP-2 local platform clone           | risk                            | Adapt Cliffy/Deno/path primitives privately.                                        |
| AP-7 hidden globals                 | risk                            | Explicit generated registry and invocation context.                                 |
| AP-8 load-time I/O                  | existing risk                   | Static descriptor/import-safety tests; lazy handler only.                           |
| AP-9 underspecified public types    | existing in current CLI helpers | Exact descriptor/result/error/capability contracts and examples.                    |
| AP-11 stringly registries           | existing                        | Finite constants, family/major, literal-preserving builder, structured diagnostics. |
| AP-13 ordering dependence           | existing risk                   | Canonical sorting and collision preflight.                                          |
| AP-14 leaky ports                   | risk                            | Narrow invocation/generation context; no raw host internals.                        |
| AP-15 inheritance-first extension   | existing                        | Compositional builder primary; compatibility/deprecation for abstract base.         |
| AP-16 generic infrastructure errors | existing                        | Stable plugin CLI failure union and host mapping.                                   |
| AP-19 silent overwrite              | existing merge risk             | Duplicate rejection with both owners.                                               |
| AP-20 hidden side effects           | existing post-script risk       | Preview no effects; host transaction; explicit output lifecycle.                    |
| AP-22 speculative abstractions      | risk                            | Prove with deploy and DevTools concrete consumers.                                  |
| AP-23 thin-plugin violation         | risk                            | Shared routing/generation in framework; plugins declare behavior only.              |
| AP-24 duplicated generators         | existing board risk             | One planner/two callers and duplicate audit.                                        |
| AP-25 unbounded public surface      | risk                            | Existing `./cli` subpath, private host adapter, explicit export audit.              |

## Fitness Gates

Archetype 4 requires the following complete set from
`.llm/harness/archetypes/ARCHETYPE-4-dsl-builder.md`; the RFC roadmap must preserve every row when
the later epic is sliced.

| Gate | Name                              | RFC evidence now / later implementation evidence                                                       |
| ---- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| F-1  | File-size lint                    | Name split-by-concern builder/definition/validation files; later size scan.                            |
| F-2  | Helper-reinvention scan           | Require Web Platform/`@std/*`-first host adapters; later helper scan.                                  |
| F-3  | Layering check                    | RFC ownership/dependency table now; later `arch:check` and focused import graph.                       |
| F-4  | Inheritance audit                 | D2 stops expansion of `PluginCli` inheritance; later inheritance scan and migration proof.             |
| F-5  | Public-surface audit              | `deno doc`/export-map baseline now; later surface diff, docs, examples, and symbol cap.                |
| F-6  | JSR publishability                | JSON audits and per-member dry-runs now; later clean file list, slow-type, and consumer-install proof. |
| F-7  | Doc-score gate                    | RFC docs gates now; later module/symbol docs and accepted JSR score policy.                            |
| F-8  | Workspace `lib` override check    | CLI override inventory now; later verify `deno.unstable` remains present.                              |
| F-9  | Permission declaration check      | Capability model in RFC; later README permission blocks matched to actual `Deno.*` use.                |
| F-10 | Test-shape audit                  | Contract/conformance matrix now; later size-bounded tests and focused consumer fixtures.               |
| F-11 | Forbidden-folder lint             | Canonical concern names in roadmap; later forbidden-folder scan.                                       |
| F-12 | Naming-convention lint            | Public vocabulary and literal unions now; later naming scan.                                           |
| F-14 | Console-log lint                  | Host-owned output boundary in RFC; later console scan outside presentation/examples.                   |
| F-15 | Re-export-of-upstream lint        | No Cliffy/upstream public re-export; later public export scan.                                         |
| F-16 | Folder-cardinality lint           | Split-by-concern roadmap plus measured baseline warnings; later cardinality/depth scan.                |
| F-17 | Abstract-derived co-location lint | Compatibility child owns existing abstract hierarchy; later co-location scan.                          |
| F-18 | Sub-barrel lint                   | Export map stays explicit; later sub-barrel scan and justified exceptions only.                        |
| F-19 | Scoped source gate runners        | Structured wrappers and durable receipts now and in every package/plugin child.                        |

## Arch-Debt Implications

| Entry                              | Action                                    | Notes                                                                                            |
| ---------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Existing plugin/CLI verdicts       | none                                      | RFC follows Keep guidance.                                                                       |
| Existing `./cli` doc-lint baseline | record, do not create debt from docs leaf | Implementation must repair or avoid deepening the touched subpath.                               |
| New debt                           | none                                      | If implementation needs a doctrine/file-boundary exception, stop and ask the topic orchestrator. |

## Reviewable Commit Slices

| #   | Slice                                                                                                                                              | Files                                                                             | Proving gate                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S0  | Bootstrap, live research, locked plan, Design checkpoint, placeholders, and handoff metadata                                                       | `.llm/runs/docs-rfc-plugin-cli-contribution--1502/**` only                        | structured scoped Markdown format; durable docs accuracy; docs links; diff/lock/branch checks                                                               |
| S0R | PLAN-EVAL cycle-1 repair: contract resolution, JSR audit, full A4 roadmap gates, closing boundary, and durable evidence                            | run directory only                                                                | structured `check`/`test`; per-member `publish-dry-run`; `arch-check`; `docs-source-format`; `docs-accuracy`; JSR JSON/specifier/asset/import-meta receipts |
| S1  | RFC house shape and public contract: current state, goals/non-goals, ownership, descriptor/builder/router/help/completion/errors                   | `rfcs/0000-plugin-cli-contribution.md` + refreshed `worklog.md`/`context-pack.md` | docs source format/accuracy/terminology/links; structured check; exact local API sampling via `deno doc`                                                    |
| S2  | RFC lifecycle/security/generation: discovery/bootstrap/isolation/order/absent UX, capabilities, preview/transaction/doctor/manifest pointer        | same RFC + refreshed run artifacts                                                | docs source format/accuracy; structured focused test; `arch-check`; decision-table and live-manifest/help cross-check                                       |
| S3  | RFC compatibility/migration/roadmap: RFCs 0001/0002/0003/0005/frontend, #904–#908 supersession, later epic/PR children, duplicate audit, JSR/gates | same RFC + refreshed run artifacts                                                | docs source format/accuracy; per-member publish dry-run and JSR audit; issue/RFC reference audit; no package/plugin diff                                    |
| S4  | Final six-gate reconciliation and separate IMPL-EVAL handoff                                                                                       | run artifacts and PR body/comments only                                           | final `check`, `test`, `publish-dry-run`, `arch-check`, `docs-source-format`, `docs-accuracy`; raw Git/lock/review-thread checks; no self-verdict           |

Each slice updates `worklog.md` and `context-pack.md`, commits once, pushes using the explicit
refspec, and posts one phase/slice PR comment before moving on.

## Later Implementation Epic Shape (proposal only)

The RFC will propose these PR-sized dependency-ordered children without filing them:

1. Board duplicate audit and acceptance manifest (#904–#908, #1474, #1477, #946, #1354, #424,
   equivalent searches).
2. Generic installer-manifest forward-compatibility prerequisite and focused pointer validation.
3. `@netscript/plugin/cli` v1 immutable descriptor/builder/error/capability contracts plus JSR bar.
4. Runtime manifest axis, owner-aware merger/verifier, reserved/extensible mount registry, and
   collision conformance.
5. `@netscript/cli` generated static registry and install/update/remove/sync/doctor lifecycle.
6. Lazy async handler bootstrap, isolation, cancellation, plugin-absent UX, help/completion, and
   plugin-less startup budget.
7. Host-owned generation-plan transaction, preview/no-write, path/capability validation, focused
   staged checks, rollback, and deterministic output.
8. Compatibility migration for current `PluginCli` helpers and hardcoded `plugin ai`/`plugin auth`.
9. Deploy conformance consumer by amending/folding #904–#908; deploy behavior remains in #907/#908.
10. DevTools conformance consumer by amending #1477; generated host remains RFC 0005-owned.
11. Documentation, testing kit, JSR consumer install, and focused cross-consumer conformance.

The later epic's acceptance manifest must carry the complete applicable Archetype-4 fitness set: F-1
file size, F-2 helper reinvention, F-3 layering, F-4 inheritance, F-5 public surface, F-6 JSR
publishability, F-7 doc score, F-8 workspace `lib` override, F-9 permissions, F-10 test shape, F-11
forbidden folders, F-12 naming, F-14 console use, F-15 upstream re-exports, F-16 folder cardinality,
F-17 abstract/derived co-location, F-18 sub-barrels, and F-19 scoped runners. Children 2–4 prove the
public contract and package shape; children 5–8 prove host/lifecycle behavior without public
leakage; children 9–11 prove thin consumers, docs, and cross-consumer conformance. A child may mark
a gate inapplicable only with a path-based reason in its own locked plan; it may not omit the gate
from the acceptance manifest.

No child is assigned a milestone or filed by this RFC leaf.

## Validation Plan

### This docs-only leaf

The coordinator's six proving gates are immutable. Cycle-1 evidence is intentionally the smallest
trustworthy measurement of the contracted CLI/plugin audit surfaces; every row is rerun after the
RFC content exists so final evidence binds to the final author head.

| Order | Contract gate        | Cycle-1 command/evidence                                                                                                                                                          | Final rerun after RFC authoring                                                                                                                          |
| ----- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `check`              | Durable `run-gate` receipt invokes the structured root task with `--include '^packages/(cli                                                                                       | plugin)/'`; PASS, 1,033 files, 9 batches, 0 failed.                                                                                                      |
| 2     | `test`               | Durable `run-gate` receipt invokes `run-deno-test.ts` through the root task for 16 focused CLI/plugin route, manifest, generation, doctor, host, and dispatch files; PASS, 88/88. | Repeat the focused contract baseline, adding only tests needed to substantiate RFC examples/claims; retain a final-head receipt.                         |
| 3     | `publish-dry-run`    | Canonical repo wrapper through durable `run-gate`, once for `packages/cli` and once for `packages/plugin`; both PASS.                                                             | Run the canonical workspace `publish-dry-run` gate at final head, preserve its receipt, and classify any baseline failure separately from the docs diff. |
| 4     | `arch-check`         | Durable root `arch:check`; PASS with existing warnings and 0 failures.                                                                                                            | Repeat at final head; no new failure or warning attributable to the RFC/run diff.                                                                        |
| 5     | `docs-source-format` | Durable catalog gate from `docs/site` plus structured `run-deno-fmt.ts` JSON for owned run Markdown.                                                                              | Repeat both with `rfcs/0000-plugin-cli-contribution.md` included; zero findings.                                                                         |
| 6     | `docs-accuracy`      | Durable root docs-accuracy receipt after repaired artifacts are written.                                                                                                          | Repeat at final head; PASS with claims sampled against live code, help, issues, and accepted RFCs.                                                       |

Additional mandatory evidence:

- **JSR audit:** retain JSON audits and full export-map doc-lint reports for CLI/plugin; exact
  internal-pin, publish-asset, and runtime asset/`import.meta` preflight evidence; distinguish
  measured baseline failures from introduced failures. The current plugin baseline is four missing
  module tags plus 15 private-type references; the docs leaf introduces none.
- **Docs terminology (live glossary):** compare every new `PluginCli*`, capability, lifecycle,
  error, pointer, and transaction term with `docs/site/glossary.md` and doctrine vocabulary. The
  nonexistent `.claude/09-glossary.md` path in `SCOPE-docs` is not used.
- **Internal links and source alignment:** run `deno task docs:links`; cross-check every
  prescriptive claim against exact doctrine/RFC/code sources and use `deno doc` before source
  implementation reads.
- **House shape and decision completeness:** check `rfcs/README.md`, every required #1502 decision,
  all five acceptance-evidence mappings, and the later-epic duplicate audit.
- **Scope/lock/branch truth:** raw `git diff --check`, changed-path, `deno.lock`, status,
  branch/upstream/base, and explicit-refspec remote checks.

`quality:gate` is N/A because the actual leaf diff does not touch `packages/**` or `plugins/**`.
`scaffold.runtime` is forbidden for this leaf and is never run. Neither status waives any of the six
contracted proving gates above.

### Future implementation children where applicable

- Structured `run-deno-check.ts`, `run-deno-test.ts`, `run-deno-lint.ts`, and `run-deno-fmt.ts`
  evidence scoped to each touched package/plugin.
- Full export-map `deno task doc:lint --root <unit>`, `deno task publish:dry-run`/repo publish
  wrapper, and JSR consumer install/import proof for every publishable unit.
- `deno task arch:check` and focused doctrine checks for package layering.
- Focused contract/conformance fixtures for collisions, order permutations, no-load help/completion,
  bootstrap isolation, capability denial, cancellation, preview no-write, path escape, rollback,
  byte-identical skip, install/update/remove empty replace-set, doctor states, and absent UX.
- `quality:gate` only in future children whose actual diff touches `packages/**` or `plugins/**`.
- No child in this RFC consumes the release's global expensive-gate slot; any later release-level
  `scaffold.runtime` decision remains with the central release coordinator.

## Dependencies

- Separate PLAN-EVAL cycle-2 `PASS` from native Claude Opus 5 medium session
  `28cc8106-967b-4fb7-90f3-dd95054ae953` before S1; satisfied by verdict commit
  `3e0c8858b4a2552926d2965b62cbcc97a15c2935`.
- Coordinator contract
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`,
  key `rfc-plugin-cli-contribution`, as resolved by the authoritative cycle-1 RFC-only dispatch.
- Accepted contracts: RFCs 0001, 0002, 0003, 0005, and frontend PR #890 design laws.
- Live consumers: #904–#908 and #1477; adjacent generators #946/#1354.
- Manifest schema-evolution result accepted in RFC 0005 and represented by #1474, subject to the
  later duplicate audit.
- Tier-A substantive topic-orchestrator review and fresh IMPL-EVAL after S4.

## Drift Watch

- `origin/main` or issue #1502/comments/PR landscape changes before RFC authoring.
- Another PR/issue starts a general plugin CLI contribution seam.
- #904–#908, #1474, or #1477 closes/rescopes or changes milestone/dependency semantics.
- `@netscript/plugin/cli`, installer schema, runtime contribution axis, CLI help, or generator list
  changes on main.
- The RFC needs a package/plugin source edit or a different public package boundary.
- Any requested evaluator is not a fresh opposite-family session.

Any such fact is appended to `drift.md`; a file-boundary or architecture change stops the leaf for
topic-orchestrator direction.
