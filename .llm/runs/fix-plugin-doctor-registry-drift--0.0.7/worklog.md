# Worklog: plugin doctor registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Archetypes | `6 — CLI / Tooling`; `5 — Plugin Package` |
| Scope overlays | generator-selection reporting protocol; JSR/publish validation |

## Design

### Public Surface

- User command remains `netscript plugin doctor --project-root <path>`; no option, command name, or
  package export changes.
- `PluginDoctorDependencies` gains an internal read-only installed-registry inspection seam.
- `GeneratedPluginRegistry` gains internal `sourceFiles` evidence for each manifest registry target.

### Domain Vocabulary

- `GeneratedPluginRegistry.sourceFiles` — normalized project-relative definition files discovered
  by the authoritative generator manifest.
- `RuntimeRegistryDriftCheck` — one exact comparison result with `healthy`/`error` status.
- `RuntimeRegistryImport` — a project-relative generated-registry import and its local binding.

### Ports

- Existing `FileSystemPort` — reads registry modules and source-tree existence through the package's
  established seam.
- `inspectRuntimeRegistries(projectRoot)` — injected read-only dry-run of the existing installed
  registry generator; no new external-system port.

### Constants

- Stable check prefix: `runtime-registry`.
- Remediation: `netscript generate plugins`.
- Status vocabulary remains `healthy | warning | error`.

### Archetype-6 Existing Structure (unchanged)

- Spine abstracts: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, and `Registry<TKey, TValue>`; this slice introduces none.
- Layer-2 abstracts: none introduced or changed.
- Vertical features touched: `public/features/plugins/doctor` and
  `public/features/generate/plugins`; command definitions remain in their owners.
- Extension axes: installed runtime manifests map source-directory policies to registry targets;
  the existing generator consumes this axis. No new registry class or key union.
- Composition declarativity: `public/features/root/public-command-dependencies.ts` wires the same
  generator closure into both generate and doctor flows; it contains no check body.
- Existing ports relevant to the feature: filesystem and process. HTTP manifest lookup remains in
  the generator adapter closure.
- Permission impact: none beyond existing doctor/generator read/network permissions.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1–5 | Original plan, red-before, six-path implementation, evidence, and Tier-A correction | accepted historical evidence through `61b8bf52` | original six paths + run artifacts |
| 6 | Research the generator-selection gap, receive the coordinator ruling, and amend/re-lock the plan | raw lock proof; mandatory separate PLAN-EVAL | run artifacts only |
| 7 | Real AI legitimate-exclusion healthy regression, red-before | installed-generator integration test fails on S6 product | flagged existing integration test + run artifacts |
| 8 | Shared pure AI selector and AI inspect protocol | AI compiler/package suites | AI manifest/generator/compiler/test + run artifacts |
| 9 | Host protocol validation/consumption and doctor evidence wording | focused/related suites green; no-write snapshots | authorized CLI paths + flagged integration test + run artifacts |
| 10 | Expanded author gates and supervisor runtime evidence | locked gate matrix, including required leased `scaffold.runtime` | run artifacts only |

### Deferred Scope

- Stream topology without a runtime-registry manifest — no generated registry contract exists on
  current main.
- Recursive directory discovery and arbitrary handwritten registry grammars — preserve generator
  manifest semantics.
- Workers protocol adoption/F4 closure, sagas/triggers adoption, #1366, #1574, and #1365.

### Contributor Path

To add a new registry-backed definition kind, declare its candidate paths and registry path in the
plugin's `scaffold.runtime.json`. If the generator applies any selection beyond that path contract,
advertise and implement the source-selection report protocol so doctor consumes the generator's
actual selected set without a CLI plugin-name switch. To extend doctor wording, edit the focused
`runtime-registry-drift.ts` policy and its semantic tests.

### S6 Design Checkpoint — generator-selected evidence (historical pre-ruling proposal)

#### Contract and vocabulary

- `runtimeRegistryGenerator.sourceSelectionReport.protocolVersion` — optional version marker that
  advertises the executable report contract without putting selection rules in the manifest.
- `RuntimeRegistrySourceSelectionReport` — private process DTO with `schemaVersion: 1` and a complete
  `registries` array of `{ registryPath, sourceFiles }` records.
- `sourceAuthority` — internal result evidence identifying `generator` or compatibility
  `manifest` selection.
- `--report-selected-sources --manifest-json <resolved-json>` — the version-1 report invocation. It
  emits one JSON document, suppresses progress logs, and writes nothing.

#### Public surface

- User commands and normal `netscript generate plugins` behavior remain unchanged.
- No `deno.json` export map, public barrel, dependency, or lockfile changes.
- The report is an executable protocol between the host and shipped plugin generator entrypoints,
  not a new exported `@netscript/plugin` API.

#### Ports and effects

- Existing `ProcessPort.stdout` carries the report. The resolved manifest is passed inline, so no new
  port, project manifest, or sidecar file is introduced.
- Existing `FileSystemPort` resolves manifests and validates project-relative source evidence.
- Report-only modes share each generator's normal selector/compiler, run with read permission and no
  write permission, and bypass registry writes.
- Host validation rejects non-zero execution, mixed/non-JSON stdout, wrong version, duplicate or
  undeclared targets, duplicate sources, absolute paths, and parent escapes. An advertised reporter
  never silently falls back.

#### Archetype structure

- Archetype 6 host: parsing/orchestration remains in `generate/plugins`; doctor comparison policy
  stays in `plugins/doctor`; composition wiring stays unchanged unless the existing seam requires a
  narrow type update.
- Archetype 5 plugins: AI/workers/sagas/triggers entrypoints remain thin. Selection stays in their
  existing compiler/generator path, and report mode serializes that returned selection.
- No plugin-kind switch or selector is added to the host.

#### Compatibility

- A manifest lacking the capability keeps the existing suffix/exclude walk and is marked
  manifest-authoritative; no unknown flag is passed to an older generator.
- All current first-party generators advertise and implement reporting. Workers evidence includes
  profiles, `include`, `includeWhenPresent`, plugin directories, and dotfile rejection, closing F4.
- Normal invocation without report args keeps existing writes and progress output.

#### JSR/publish surface

- The five touched publish packages receive check, doc-lint, and dry-run evidence.
- Any changed exported internal generator function keeps explicit named option/result types and
  JSDoc to satisfy `isolatedDeclarations`; report DTOs are not barrel-exported.
- Four shipped manifests make `check:publish-assets` a measured gate; corpus measurement remains
  required despite no planned export delta.

#### Deferred scope

- A shared public report helper, mandatory migration for old third-party manifests, streams registry
  creation, arbitrary handwritten registry support, and recursive discovery changes.
- Live e2e/Aspire/Docker/browser execution and all coordinator-owned lifecycle mutations.

## PLAN-EVAL

**REQUIRED — awaiting a fresh separate evaluator.** IMPL-EVAL cycle 1 proved the original
manifest-authority assumption incomplete. The coordinator has now ruled the protocol and restricted
adoption to AI, but the cross-process contract, strict validation/failure surface, selector-sharing
proof, no-write proof, and flagged integration-test interpretation remain architectural. The old
`PLAN-EVAL: N/A` statement is superseded. No S7 test or product implementation may start until a
separate session records `APPROVED`; `CHANGES_REQUESTED` returns this run to S6 planning.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-29T23:29Z | 1 | Research/plan | Re-baselined issue #1673 at `origin/main` `13878a80a`; selected A6 and locked six product/test paths. |
| 2026-08-29T23:32Z | 1 | Issue evidence contract | Preserved the five target-contract statements and converted them to `## Acceptance` checkboxes; no labels, milestone, or state changed. |
| 2026-08-29T23:35Z | 2 | Regression authored | Generated a real saga registry with `registered-saga.ts`, then authored `sagas/late-saga.ts` without regeneration and invoked the real doctor command. No product source had changed. |
| 2026-08-29T23:35Z | 2 | Red-before | Structured wrapper exited `1`: `passed=0 failed=1`; sole failure was `AssertionError: Expected function to reject.` Doctor incorrectly exited zero, exactly reproducing #1673. |
| 2026-08-30T08:35Z | 3 | Manifest discovery evidence | Extended the installed-runtime generator's dry-run result with normalized per-target `sourceFiles`. The interface field shape stayed compatible, but `registrableItems` changed from the prior plugin-wide total to a per-target source count; no production consumer reads that value. |
| 2026-08-30T08:36Z | 3 | Bidirectional comparison | Added focused registry import/binding comparison, reverse-orphan detection, imported-but-unused rejection, exact healthy evidence, and the bounded no-target statement. |
| 2026-08-30T08:37Z | 3 | Production wiring | Kept doctor discovery optional for legacy seams and supplied the existing generator closure unconditionally from `public-command-dependencies.ts`. |
| 2026-08-30T08:45Z | 3 | Green regression | Focused structured test exited `0`: `passed=5 failed=0`; exact six-file structured check exited `0`; related structured suite exited `0`: `passed=47 failed=0`. |
| 2026-08-30T08:47Z | 3 | Reconcile | PR #1739 remains draft with `Closes #1673`; issue #1673 remains open and unchanged; no new reviewer/evaluator comment or scope adjustment. S2/S3 body progress and the S3 phase comment will be updated after the explicit-refspec push. |
| 2026-08-30T06:49Z | 4 | Historical fitness evidence | `quality-gate` and package-scoped `doc-lint` commands exited `0` at `e5123a0e4f3d6844dbc173d5b09249a24e637fb8`; their JSON receipts are gitignored/local-only. |
| 2026-08-30T06:50Z | 4 | Publish/cascade evidence | CLI publish dry-run, `check:mcp-export-corpus`, and `check:publish-assets` exited `0`; `check:assets-barrel` is inapplicable because no template or `kernel/assets` path is in the six-file ceiling. |
| 2026-08-30T06:50Z | 4 | Lock hygiene | Raw worktree and pinned-base comparisons both exited `0`: `deno.lock` is byte-unchanged through the final product head. |
| 2026-08-30T08:43Z | 5 | Tier-A evidence repair | Wrapped the S3-added `@std/path` import in authorized product path 2, then re-derived every remaining scoped-format finding from its exact first reported hunk rather than its file. |
| 2026-08-30T08:43Z | 5 | Focused validation | Focused structured test exited `0`: `passed=5 failed=0`; exact six-file structured check and lint both exited `0`; raw `git diff --exit-code -- deno.lock` exited `0`. |
| 2026-08-30T09:31Z | 6 | IMPL-EVAL intake | Read the cycle-1 evaluator artifact first. Accepted F1 as a blocking design gap and F3/F5 as evidence corrections; made no product/test edit. |
| 2026-08-30T09:38Z | 6 | Source re-derivation | Confirmed AI source-shape selection and discarded compiler `files`, workers profile/include/conditional/dotfile divergence, captured process stdout, four rejecting generator arg parsers, and additive manifest parsing. |
| 2026-08-30T09:44Z | 6 | Re-plan | Chose protocol-versioned generator-owned report-only JSON with an inline resolved manifest over manifest selection duplication or AC2 warning downgrade; expanded and locked 24 product/test paths, closed F4 in scope, and required the AI healthy red-before case. |
| 2026-08-30T09:48Z | 6 | Re-baseline/lock proof | Confirmed `origin/main` remains `13878a80a50c55b9662099fed64555f2310ae4a3`; raw `git diff --exit-code -- deno.lock` exited `0`. Only five run artifacts are modified. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Reuse manifest-backed generator discovery | It is the source tree contract that produced the registry. | research D1 / A6 / AP-9 |
| Keep stream registry creation out of scope | No such generated contract exists on current main; doctor must state evidence limits. | research re-baseline |
| Supersede manifest-only authority | AI and workers prove that candidate path discovery can be broader than generator selection. | IMPL-EVAL F1/F4; S6 source re-derivation |
| Choose opt-in generator reporting | Preserves AC2 and backward compatibility without duplicating plugin selectors in CLI/manifest data. | plan D1R–D7R |
| Close workers F4 (superseded) | The first S6 proposal adopted all four generators; the coordinator later deferred F4/workers adoption. | historical plan D8R; current amendment below |
| Require PLAN-EVAL | The material contract, compatibility, scope, and sequence decisions need independent approval. | plan D9R; harness plan gate |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Current streams plugin has no runtime registry manifest despite issue's generic stream wording. | minor | yes |
| IMPL-EVAL disproved the six-path plan's manifest-only authority; the first S6 proposal expanded to four generators/24 paths, then the coordinator replaced that scope with AI-only adoption and the ruled ceiling. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Red-before regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --pretty -- --allow-all packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts` | EXPECTED_FAIL | Exit `1`; `passed=0 failed=1`; `AssertionError: Expected function to reject.` This is the required baseline defect evidence, not a product-gate failure. |
| Focused green regression | same structured wrapper and test path | PASS | S5 rerun exit `0`; `passed=5 failed=0`; covers late source, reverse orphan, imported-but-unused binding, aligned evidence, and no-target wording. |
| Related doctor/generator tests | structured wrapper over the five locked test paths | PASS | Exit `0`; `passed=47 failed=0`. |
| Exact-file type check | `run-deno-check.ts` over all six ceiling paths | PASS | S5 rerun exit `0`; six files selected; zero diagnostics. The JSON receipt is local-only; this command and outcome are reproducible. |
| Exact-file lint | `run-deno-lint.ts` over all six ceiling paths using a scratch copy of the root lint rules without the root's `packages/cli` exclusion | PASS | S5 rerun exit `0`; six selected/processed, zero findings. The JSON receipt is local-only; this command and outcome are reproducible. |
| Exact-file format | `run-deno-fmt.ts` over all six ceiling paths using a scratch copy of the root format rules without the root's `packages/cli` exclusion | FAIL (LINE-ATTRIBUTED) | S5 rerun exit `1`; six selected/processed, four file findings. Three first reported hunks are base-proven on the same source line; the regression-test finding is leaf-owned. Local-only JSON aided reconciliation; exact ownership follows in committed text. |

#### S5 format finding ownership

| Finding path | Head first reported hunk | Base comparison | Ownership / action |
| --- | --- | --- | --- |
| `generate/plugins/installed-runtime-registry-generator.ts` | line 18, `type GenerateInstalledPluginRegistries,` | exact same source line at base line 9 | Base-owned. The different leaf-owned line-2 `@std/path` hunk was fixed in S5 with the formatter's multi-line import form. |
| `plugins/doctor/doctor-plugin-use-case.ts` | line 19, `import {` for `jsr-export-map-loader-port.ts` | exact same source line at base line 19 | Base-owned. |
| `root/public-command-dependencies.ts` | line 1, `import {` from `@netscript/plugin/sdk` | exact same source line at base line 1 | Base-owned. |
| `plugins/doctor/doctor-plugin-registry-drift_test.ts` | line 9, `import {` for `jsr-specifiers.ts` | file absent at base | Leaf-owned. Not fixed because S5 authorizes only product path 2 and forbids test changes. |

The S2 case was refactored in S3 to share `createDoctorHarness` with four added cases; its original
case name and all four assertions remain, with no assertion weakened or removed. Its format finding
is therefore the leaf's own, not inherited evidence.

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code quality + doctrine | PASS at historical S3 head | Reproducible command: `deno task quality:gate` through `run-gate.ts` | Exit `0`, outcome `PASS` at `e5123a0e4...`. The cited JSON receipt is gitignored/local-only, not durable fresh-checkout evidence. |
| JSR doc surface | PASS at historical S3 head | Reproducible command: `deno task doc:lint --root packages/cli --pretty` through `run-gate.ts` | One package, three entrypoints, zero findings at `e5123a0e4...`. The cited JSON receipt is gitignored/local-only. |
| JSR package dry run | PASS | `deno publish --dry-run --allow-dirty` from `packages/cli` | Exit `0`; `Success Dry run complete`. Existing unanalyzable dynamic-import warnings remain warnings. |
| F-CLI-1..31 | PASS at historical S3 head | reproducible quality/doctrine command + focused semantic suites | Command vocabulary/options were unchanged and composition remained declarative. S6 supersedes the manifest-only authority claim. |

### Generated Cascade and Lock Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `check:mcp-export-corpus` | PASS (measured negative) | Exit `0`; corpus SHA-256 `88011e6e459097ba4c74111063dbef13a95823702bd37447f358bc19375cc262`, 35 packages/270 subpaths/7,614 symbols | Required by supervisor despite plan reasoning; no generated corpus drift. |
| `check:publish-assets` | PASS (measured negative) | Exit `0` | Required by supervisor despite plan reasoning; checked publish assets are current. |
| `check:assets-barrel` | N/A | six-file product ceiling | No template or `kernel/assets` path is changed, so the assets-barrel derivative has no input in this leaf. |
| `deno.lock` | PASS | raw `git diff --exit-code -- deno.lock` plus the accepted pinned-base comparison | S5 raw worktree command exited `0`; byte-unchanged. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| e2e/Aspire/Docker/browser | N/A | user boundary | Explicitly unauthorized. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `netscript plugin doctor` focused temp workspace | PASS at historical S5 head | focused `5/5` and related `47/47` structured command outcomes | Missing source registration, reverse orphan, imported-but-unused, aligned, and no-target cases pass; IMPL-EVAL F1 requires the added AI legitimate-exclusion case. |

## Handoff Notes

- Tier-A should inspect the source-file discovery contract, import-binding comparison, and exact
  healthy/error wording first.
- S5 repairs the leaf-owned generator import formatting and the inaccurate S4 evidence statement;
  its commit hash is recorded in the structured PR comment after the explicit-refspec push.
- Scoped format remains transparently red: the generator, doctor use-case, and composition-root
  first hunks are base-proven on the same source lines; the regression-test finding is leaf-owned
  and intentionally untouched because S5 authorizes only product path 2 and forbids test changes.
- Runtime gates remained unauthorized and were not run. No architecture debt entry was created.
- This implementation author does not provide a sign-off or IMPL-EVAL verdict.

## S6 PLAN-EVAL Handoff (superseded by coordinator ruling below)

- Direction (a) dominates through an opt-in, report-only JSON capability; the manifest advertises
  protocol version 1 but does not encode source selection.
- All four first-party generators adopt the protocol, so AI F1 and workers F4 are both in scope.
- The required next test is committed red-before product work: correct AI generation excludes the
  discoverable `skill-loader.ts` factory and doctor is asserted healthy.
- AC2 and the issue remain unchanged. A generator-selected definition missing from its registry is
  still an error.
- The exact expanded ceiling is the 24-path list in `plan.md`; a 25th path is rescope-and-stop.
- Local gate receipts are explicitly local-only. Reproducible commands, exact head, exit code, and
  counts are the review evidence.
- If the historical base-product/head-tests comparison is restated later, it must say `--no-check`;
  default type-checking fails before tests run.
- Stop here for a fresh separate PLAN-EVAL. No implementation, runtime gate, label, issue, readiness,
  or acceptance mutation is authorized.

## Supervisor Tier-A sign-off — `c1e21c1b0823d1bd057d252e59f7bee5fbbdfc89`

Reviewer is the fixes topic supervisor: not the author, not the evaluator. Every check below was
re-derived independently — from the commit's own file list, from a pristine `git archive` of base
`13878a80a`, or by re-running the command — never read out of the author's receipts.

**T-1 and T-2 are both resolved. Tier-A PASSES at this head.** A fresh, separate, opposite-family
IMPL-EVAL is still mandatory before any readiness transition.

### T-1 — resolved, and the attribution independently re-derived at line granularity

The S3-added `@std/path` import is now in the formatter's multi-line form, and the over-width line-2
finding is gone from the head's fmt output. The remaining four findings were re-attributed by running
the same scoped format on a pristine base archive and comparing **source lines**, not file names:

| Finding path | Head first hunk | Base first hunk | Ownership |
| --- | --- | --- | --- |
| `root/public-command-dependencies.ts` | line 1, `import {` from `@netscript/plugin/sdk` | line 1, identical source line | base-owned |
| `plugins/doctor/doctor-plugin-use-case.ts` | line 19, `import {` for `jsr-export-map-loader-port.ts` | line 19, identical source line | base-owned |
| `generate/plugins/installed-runtime-registry-generator.ts` | line 18, `type GenerateInstalledPluginRegistries,` | line 9, identical source line | base-owned |
| `plugins/doctor/doctor-plugin-registry-drift_test.ts` | line 9, `import {` for `jsr-specifiers.ts` | **file absent at base** | leaf-owned |

The generator's 9 → 18 shift is exactly +9 lines, which is precisely the cost of expanding the
one-line import into ten. That arithmetic is an independent consistency check on the attribution,
not a restatement of it.

Leaving the leaf-owned test finding unfixed is correct: S5 authorizes product path 2 only and forbids
test changes, and the author states that reason in one line rather than attributing the finding
elsewhere — which is exactly what T-2 asked for.

### T-2 — resolved; the corrected sentence was verified against the artifact

The worklog now says the S2 case was refactored in S3 to share `createDoctorHarness` with four added
cases, that its name and all four assertions survive with none weakened or removed, and that its
format finding is the leaf's own rather than inherited. Verified against the file itself, not against
the claim: the original case name
`'plugin doctor fails when a saga is authored after generate plugins'` is present **verbatim** at this
head, alongside the four added cases, and `createDoctorHarness` is shared across them.

### Gates re-run at this exact head

| Check | Result |
| --- | --- |
| Head identity | local == `origin` == PR #1739 `headRefOid` == `c1e21c1b`; tree clean |
| Product ceiling | delta `02da4e1c..c1e21c1b` is exactly two files — authorized product path 2 and `worklog.md`; **no seventh path, no test-behaviour change** |
| Focused suite | independently re-run: exit `0`, **5 passed / 0 failed** |
| Scoped type check | six ceiling files, exit `0`, zero diagnostics |
| Scoped lint | six ceiling files under the root rule set, exit `0`, zero findings |
| Scoped format | exit `1`, four findings — three base-owned at line granularity, one leaf-owned and scope-deferred |
| `deno.lock` | byte-unchanged vs `origin/main` (raw `git diff --exit-code`) |
| Run-artifact hygiene | no thread id, rollout path, daemon handle, or observability path in the committed artifacts |
| Review threads | `review-threads PASS threads=0 unanswered=0` |

### Context the evaluator should have: these scoped gates are stricter than the repo's own

The root `deno.json` excludes `packages/cli/` from **both** `fmt` and `lint`. Passing the six ceiling
files to `deno fmt --check` under the root config returns `No target files found`. The author's scoped
runs therefore used a scratch config with that exclusion removed — disclosed in the gate table, not
concealed — and are a **stricter** bar than CI applies.

The practical consequence, stated so it is not mistaken for a hidden risk: the residual leaf-owned
format finding in the regression test **cannot fail CI**, because the repo's configured formatter
never sees `packages/cli/`. It was worth correcting anyway, since T-1 was about the honesty of the
attribution rather than about a merge blocker.

### Not done here, by design

No readiness flip, relabel, issue edit, acceptance-box tick, or merge. Those are coordinator-owned.
No `e2e:cli`, Aspire, Docker, or browser gate ran, and no host runtime lease was requested or held —
this leaf's six-path CLI ceiling touches none of that surface.

## S6 Coordinator-Ruled Plan Amendment

This section supersedes the earlier S6 design/handoff statements about four-plugin adoption, a
24-path ceiling, F4 closure, report naming, and runtime-gate prohibition. Those statements remain
above only as chronological evidence of the proposal at commit `349d5915`.

### Locked contract

- Capability name: `runtimeRegistryGenerator.inspectionProtocol: 1`.
- only a present `inspectionProtocol` key activates inspection; version `1` uses
  `--inspect --inspection-protocol 1 --manifest-json <json>`, omits both `--manifest` and
  `--allow-write`, and accepts one strict JSON document on stdout. Invalid advertised declarations,
  process failures, and invalid reports all remain generator-inspection errors — none can enter the
  legacy manifest-walk path.
- Absent property retains the legacy manifest walk and performs no dry-run child invocation.
- Inspect and compile call one pure selector in `ai-registry-compiler.ts`; neither the host nor the
  manifest models AI source shape.
- The response is strict protocol v1 with an exact declared registry target set, canonical
  project-relative registry/source paths, duplicate rejection, and regular-file source validation.
- Failure detail starts `Generator inspection protocol 1 failed for <plugin>:` and appears under the
  neutral doctor title `Runtime registry inspection`; no advertised failure silently falls back or
  receives a false regeneration remedy. The prefix, rather than the wrapper shared with legacy
  dry-run failures, identifies the protocol failure.

### No-write and regression proof

Omitting `--allow-write` is reinforced by state evidence: the AI selector's in-memory write map, the
installed generator's complete memory filesystem, and the real AI project's complete file-byte
snapshot must each remain unchanged across their inspect path. The S7 red-before case first performs
real AI generation with a ready tool and discoverable `skill-loader.ts`, confirms the factory is
legitimately excluded, and then asserts doctor remains healthy. S7 is committed alone before product
work.

### Scope correction

- The coordinator-authorized ceiling is eleven paths: the seven retained CLI paths and four AI paths
  enumerated in `plan.md`.
- The unauthorized proposed `runtime-registry-source-report.ts` is removed; private parsing and
  validation stay in `installed-runtime-registry-generator.ts`.
- `installed-runtime-registry-integration_test.ts` is retained under the supervisor's explicitly
  flagged reading of the coordinator's existing-test allowance. `drift.md` exposes this for
  PLAN-EVAL/coordinator correction before S7.
- No workers, sagas, or triggers path may change. F4/workers adoption is knowingly deferred; a later
  workers manifest can advertise the generic v1 contract and reuse its own selector without host or
  protocol redesign.

### Evidence corrections

- F3: S3 preserved the non-dry result field shape, but changed `registrableItems` from the base
  plugin-wide sum to a per-target count. No production consumer reads it.
- F5: `.llm/tmp/gate-receipts/` is gitignored/local-only. Reproducible commands, exact evaluated SHA,
  exit codes/counts, and the runtime runner report are the review evidence.
- Any later `0/5` base-product/head-tests statement must name `--no-check`; default type-checking runs
  zero tests because the head test does not compile against base.

### Required runtime gate and corrected host baseline

`scaffold.runtime` is now **REQUIRED** because AI MCP is enabled by the plugin-suite builder and the
doctor behavior gate requires a healthy baseline. The author must not run it. The supervisor obtains
the cluster-wide singleton lease and runs:

```text
deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report <owned-report-path>
```

`e2e:cli` is absent from the gate catalog, so the runner's `--report` JSON is the durable receipt.
Cleanup is `agentic:leak-check` first, then `agentic:teardown --apply` only for proven resources, with
`--owned-root` for work started outside the worktree, and an Aspire/Docker-zero terminal state.

Current supplied baseline: recreated DinD `10.4.12.19`, project
`DOCKER_HOST=tcp://netscript-dind:2375`, Docker client/server 28.5.2, empty Docker/Aspire sandbox, and
`fs.inotify.max_user_instances=1024`. The earlier below-28 and expected inotify-collision statements
are withdrawn. Any runtime failure, including exit 134/inotify, is a real finding to investigate.

### Progress and handoff

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30T09:30Z | 6 | Coordinator ruling intake | Accepted the fixed optional protocol, AI-only adoption, eleven-path ceiling, F4 deferral, and mandatory separate PLAN-EVAL; no product/test edit. |
| 2026-08-30T09:30Z | 6 | Plan mechanics | Locked activation, exact args, strict schema/validation, shared selector, three-layer no-write proof, fail-closed user surface, and real AI red-before. |
| 2026-08-30T09:30Z | 6 | Environment correction | Removed the obsolete Docker-version warning and inotify pre-excuse; made leased `scaffold.runtime` required with runner-report evidence and owned cleanup. |

Stop after committing/pushing this amendment, updating PR evidence, and posting the structured plan
correction. Fresh PLAN-EVAL is next. Do not start S7, run the leased runtime gate, mutate lifecycle or
issue state, or self-certify.

## PLAN-EVAL Cycle 1 — PASS

Separate opposite-family PLAN-EVAL evaluated plan commit `13402d3f` and returned harness `PASS` / PR
`APPROVED` (verdict commit `7db40ca0` on `eval/plan-eval-1673-cycle-1`). Implementation is authorized
from S7. Binding amendments are incorporated without an S6 re-lock:

- PE-5 overturns the integration-test interpretation. The real AI health case and complete
  file-byte snapshot live in authorized path 6; the existing integration test is untouched.
- PE-2 requires S8's plain inspect report builder and per-target, same-fixture deep equality between
  inspect `sourceFiles` and `compileAiRegistry(...).files`, including order.
- PE-9 records the expected path-2 F-1 file-size `WARN`: the file is already 478 lines, the
  coordinator forbids the split parser file, and `arch:check` fails only on `fail` totals. This is
  known drift, not a hidden gate failure or a new debt entry.
- PE-10 uses the neutral `Runtime registry inspection` wrapper title in S9; the protocol error prefix
  provides disambiguation.
- Sweep-1 preserves `EmptyPluginRegistryError` when generator-authoritative selected sources total
  zero across all targets.
- PE-8 records `check:mcp-export-corpus` as a reproducible raw task in S10 because it is not in the
  gate catalog.

## S7 — Real AI Healthy Regression, Red Before Product Work

### Scope

- Changed only authorized test path 6 plus run artifacts.
- Added a local AI project helper using workspace `./plugins/*`, a copied repository AI plugin,
  `plugin-ai` appsettings, one ready tool, the discoverable `skill-loader.ts` factory, and one agent.
- Normal generation is real (`DenoFileSystem` + `DenoProcess`) and proves the generated tools
  registry excludes `skill-loader.ts` before doctor runs.
- The test snapshots every regular project file as exact bytes after generation, expects doctor to
  stay healthy, then asserts the complete snapshot is unchanged.
- `installed-runtime-registry-integration_test.ts` remains untouched.

### Red-before evidence

| Gate | Command | Result |
| --- | --- | --- |
| Focused structured doctor suite | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --pretty -- --allow-all packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts` | exit `1`; `passed=5 failed=1`; sole failure `plugin doctor stays healthy when AI generation excludes the skill-loader factory`, raising `RemoteError` at the healthy assertion. |

The failure occurs with no S8/S9 product change and reproduces F1 exactly: generation correctly
excludes a discoverable factory, then legacy dry-run evidence expects it and makes doctor unhealthy.
No assertion is weakened or bypassed. S8 must not amend this test to manufacture green.

### Reconcile

The PR remains draft with `Closes #1673`; no issue, acceptance box, label, readiness state, or runtime
resource was mutated. PLAN-EVAL findings are incorporated into the current plan/worklog/context and
the next allowed slice is S8 only.

## S8 — Shared AI Selector and Inspection Document

### Scope

- `plugins/ai/scaffold.runtime.json` advertises exactly `inspectionProtocol: 1`.
- `ai-registry-compiler.ts` owns `selectAiRegistrySources`, used by normal compilation and the plain
  `inspectAiRegistries(files, targets)` report builder.
- `generate-runtime-registries.ts` accepts the locked inspect args, reads the inline manifest JSON,
  and only serializes the returned v1 report in inspect mode. Normal compile logging/writes remain on
  the existing path.
- No CLI host consumption, doctor change, or test-path change landed in S8.

### PE-2 and no-write evidence

The compiler test uses one source fixture with both manifest targets, including a ready tool,
excluded `skill-loader.ts` factory, and agent. For each target it deep-compares the plain inspect
report's `sourceFiles` to `compileAiRegistry(...).files`; membership and order are identical. The
inspect `MemoryProjectFiles.written` map equals its pre-call snapshot.

| Gate | Result |
| --- | --- |
| Focused structured AI compiler test | exit `0`; `passed=9 failed=0`. |
| Full structured AI plugin suite | exit `0`; `passed=32 failed=0`. |
| Structured check over S8 TypeScript paths | exit `0`; 3 selected, zero diagnostics. |
| Structured format over S8 TypeScript paths | exit `0`; 3 selected/processed, zero findings. |

### Reconcile

S7 remains the unmodified red contract until host consumption lands in S9. The PR remains draft;
no runtime lease, issue/acceptance mutation, label/readiness change, dependency, export, or lockfile
change was made. S9 is the next allowed slice.

## S9 — Fail-Closed Host Consumption and Focused Green

### Scope and contract

- A present `inspectionProtocol` key is distinguished from absence. Absence retains the legacy
  manifest walk and starts no inspect process; any advertised value other than integer `1` fails
  closed.
- Protocol v1 invokes the installed plugin's existing external generator through injected
  `ProcessPort` with the locked inspect suffix and inline manifest JSON. It includes neither
  `--allow-write` nor `--manifest`.
- The host accepts one strict JSON document, requires exactly version `1` and the declared registry
  target set, rejects extra fields, unsafe/non-canonical paths, duplicate targets or sources, omitted
  or unknown targets, and source paths that are not regular project files. Process errors and every
  validation error retain the `Generator inspection protocol 1 failed for <plugin>:` prefix; none
  falls back to the legacy walk.
- Dry-run results mark their source authority as `generator` or `manifest`, and doctor evidence says
  `generator-selected` only for inspected targets. The wrapper title is the neutral `Runtime registry
  inspection`; its protocol prefix supplies disambiguation per PE-10.
- A valid report selecting zero sources across every target still raises
  `EmptyPluginRegistryError` under generator authority, preserving Sweep-1.

### Proof

| Gate | Result |
| --- | --- |
| Installed-generator + focused doctor structured suites | exit `0`; `passed=15 failed=0`. The six doctor cases include the real AI healthy regression. |
| Real AI no-write proof | PASS; the generated registry legitimately excludes `skill-loader.ts`, doctor is healthy, the output names `generator-selected source file`, and the complete before/after project byte maps are equal. |
| Advertised protocol host no-write proof | PASS; injected filesystem state is byte-for-byte unchanged and the exact process args contain neither `--allow-write` nor `--manifest`. |
| Exact S9 TypeScript check | exit `0`; 6 selected; zero diagnostics. |
| Exact S9 TypeScript lint | exit `0`; 6 selected/processed; zero findings. |
| Exact S9 TypeScript format | exit `0`; 6 selected/processed; zero findings. |
| Repository `quality:gate` | exit `0`. |
| Raw `git diff --exit-code -- deno.lock` | exit `0`; lockfile byte-unchanged. |

PE-9 is expected and disclosed: path 2 is now 673 lines, so `arch:check` reports an F-1 `WARN`
against the 500-line cap while the CLI package remains `FAIL=0`. The coordinator prohibited the new
parser file that would split this concern, and the check fails only on `FAIL`; this is known scope
pressure, not concealed drift or a new debt entry.

### Reconcile

The S7 regression is green because the CLI consumes the generator's exact selected set, not because
the test changed its behavioral expectation. The integration test remains untouched. No path outside
the exact eleven-path ceiling, dependency, export surface, generated asset, lockfile, issue, label,
readiness state, runtime lease, or external resource was changed. S10 is the next allowed slice;
`scaffold.runtime` remains required and supervisor-coordinated and was not run by the author.

## S10 — Final Author-Owned Evidence

All commands below ran at product head `4e1fed64f8241b6dc718e4f590feaa530e46140c` unless stated
otherwise. Gate-runner JSON under `.llm/tmp/gate-receipts/` is local-only; the reproducible commands,
head, exit codes, counts, and hashes below are the review evidence.

| Gate | Result |
| --- | --- |
| Focused doctor structured suite | exit `0`; `6 passed / 0 failed`; includes real AI healthy + complete project-byte equality. |
| Installed-generator structured unit suite | exit `0`; `9 passed / 0 failed`; covers absence, exact argv/no-write state, fail-closed process/schema/path/duplicate failures, and all-empty behavior. |
| AI compiler structured suite | exit `0`; `9 passed / 0 failed`; inspect report equals compile selection per target in membership and order. |
| Full AI package test | exit `0`; `32 passed / 0 failed`. |
| AI package check | exit `0`. |
| CLI package check | exit `0`. |
| Exact-ceiling structured check | exit `0`; 10 TypeScript files selected; zero diagnostics. |
| Exact-ceiling structured lint | exit `0`; 10 selected/processed; zero findings. |
| AI manifest format | exit `0`; one JSON file checked. |
| Exact-ceiling structured format | exit `1`; 10 selected/processed; one finding, in `public-command-dependencies.ts`. Its first hunk is the exact base line-1 `import {` already independently re-derived and accepted at S5; all leaf-owned authorized formatting is clean. |
| `quality:gate` through `run-gate.ts` | exit `0`; receipt outcome `PASS` at exact product head. The expected path-2 673-line F-1 warning remains non-failing (`FAIL=0`). |
| CLI doc-lint through `run-gate.ts` | exit `0`; 1 package, 3 entrypoints, zero findings. |
| AI doc-lint through `run-gate.ts` | exit `1`; 17 findings (16 private-type references + 1 other). Pinned base `13878a80a` reproduces the identical command, counts, entrypoint totals, and four owning paths. None is changed by this leaf; recorded in `drift.md` rather than called green. |
| CLI publish dry-run | exit `0`; `Success Dry run complete`; existing unanalyzable dynamic-import/import-meta warnings only. |
| AI publish dry-run | exit `0`; `Success Dry run complete`. |
| Raw `deno task check:mcp-export-corpus` | exit `0`; SHA-256 `88011e6e459097ba4c74111063dbef13a95823702bd37447f358bc19375cc262`; 35 packages, 270 subpaths, 7,614 symbols. Per PE-8 this is raw reproducible evidence, not a catalog receipt. |
| `check:publish-assets` through `run-gate.ts` | exit `0`; receipt outcome `PASS`. |
| Lock hygiene | raw worktree and pinned-base `git diff --exit-code ... -- deno.lock` both exit `0`; byte-unchanged. |
| Review threads | exit `0`; `threads=0 unanswered=0`. |
| `scaffold.runtime` | **REQUIRED / PENDING SUPERVISOR**. Author did not obtain the singleton lease and did not run e2e/Aspire/Docker/browser work. Supervisor must attach the runner `--report` JSON and zero-state cleanup evidence before IMPL-EVAL. |

### Reconcile

The branch delta contains exactly the eleven authorized product/test paths plus run artifacts;
`installed-runtime-registry-integration_test.ts` is byte-unchanged. The PR remains draft and issue,
acceptance boxes, labels, milestone, and readiness state remain coordinator-owned and untouched. S10
may land as author evidence now so the supervisor can sequence the required runtime gate; no author
IMPL-EVAL or self-certification follows.

## Supervisor Tier-A sign-off — `a073e0b1` (post-F1 repair)

Reviewer is the fixes topic supervisor: not the author, not either evaluator. Every check was
re-derived independently — by re-running the command, from the commit's own file list, or from a
pristine base worktree — never read out of the author's receipts.

**Tier-A PASSES at this head.** The mandatory fresh opposite-family IMPL-EVAL (cycle 2 of 2) and the
supervisor-coordinated `scaffold.runtime` report remain outstanding before readiness.

### The green is product-caused, proven across three real committed heads

| Head | State | Focused suite |
| --- | --- | --- |
| `e24e7ce1` | regression only, no product change | exit 1 · 5 passed / **1 failed** |
| `8dcb578f` | AI side reports its selection; **host unchanged** | exit 1 · 5 passed / **1 failed** |
| `4e1fed64` | host consumes the inspect report | exit 0 · **6 passed / 0 failed** |

Publishing the report changed nothing. The green appears only when the host consumes it. This is a
stronger demonstration than the base-archive hybrid used earlier in this leaf, because all three
points are real heads rather than a constructed tree.

### Exact-head gates re-run at `a073e0b1`

| Gate | Result |
| --- | --- |
| Head identity | local == `origin` == PR #1739 `headRefOid`; tree clean |
| Product ceiling | no path outside the authorized **eleven** |
| `deno.lock` | byte-unchanged vs `origin/main` |
| Focused regression suite | exit 0 · **6 passed / 0 failed** |
| Related doctor/generator suites | exit 0 · 54 passed / 0 failed |
| AI plugin CLI suites | exit 0 · 12 passed / 0 failed |
| Scoped type check (10 ceiling `.ts`) | exit 0 |
| Scoped lint (root rules, `packages/cli` exclusion removed) | exit 0 · 10 files · 0 findings |
| `check:mcp-export-corpus` / `check:publish-assets` | exit 0, both measured negatives |
| `deno publish --dry-run` (cli) | Success |
| `doc:lint` (cli) | 0 errors across three entrypoints |
| `quality:gate` | exit 0 |

### Contract verified in the source, not from the slice comments

- **Fail-closed is structural.** `inspectionProtocolDeclared` is
  `Object.hasOwn(generator, 'inspectionProtocol')` — *presence*-based. A manifest declaring
  `inspectionProtocol: 2` or `"1"` therefore still takes the inspect path and **fails validation**
  rather than quietly reverting to the manifest walk. `fail()` is a `never`-returning throw, and both
  `catch` blocks route into it — a non-JSON stdout, and an unreadable reported source, the latter with
  an explicit comment that this preserves fail-closed instead of leaking a filesystem-shaped error
  through the doctor surface.
- **Legacy behaviour is genuinely untouched** when no protocol is advertised.
- **Claims stay bounded.** Dry-run entries carry `sourceAuthority: 'generator' | 'manifest'`, so
  healthy output states which authority produced the evidence rather than implying one.
- **PE-2** — plain `inspectAiRegistries` builder, with per-target deep equality of the report's
  `sourceFiles` against `compileAiRegistry(...).files` (membership *and* order), plus a layer-1
  no-writes snapshot. The divergence PE-2 warned about is closed by construction.
- **PE-5** — the regression lives in path 6; `installed-runtime-registry-integration_test.ts` is
  untouched by this leaf.
- **PE-8** — `check:mcp-export-corpus` recorded as raw reproducible evidence, explicitly not a catalog
  receipt.
- **PE-10** — neutral title `'Runtime registry inspection'`.
- **Sweep-1** — `EmptyPluginRegistryError` retained, now guarding both paths.

### Two reds this leaf declines to fix — both re-derived, both genuinely baseline

1. **Scoped fmt on `public-command-dependencies.ts`.** This could **not** be dismissed on file
   identity, because the leaf did modify that file. Attributed at line granularity: the head finding
   is at **line 1** (an `import {` `deno fmt` wants collapsed); a pristine `origin/main` archive
   produces the **identical finding at the identical line 1**; and the leaf's only change to the file
   is at **line 317**. Base-owned, compared at the granularity of the claim.
2. **`doc:lint --root plugins/ai` exits 1 with 17 findings** (16 private-type refs, 1 other). Verified
   by running the same command in a **pristine detached worktree at base `13878a80a`**: exit 1, 17
   errors, 16 private-type refs, 1 other — identical totals. The leaf touches no AI public entrypoint
   (`.`, `./adapter-cli`, `./public`, `./plugin`, `./adapter`, `./scaffold`, `./contracts` are all
   unchanged). Baseline fitness debt, correctly recorded as such rather than presented as a passing
   leaf verdict.

### PE-9's WARN arrived exactly as predicted

`WARN A8/AP-1/F-1: file is 673 lines (cap 500) … installed-runtime-registry-generator.ts`. Path 2 grew
478 → 673 because the coordinator forbade splitting the parser into its own file. It is a `WARN`,
`arch:check` fails only on `fail` totals, `quality:gate` exited 0, and the expectation was written
into the plan *before* it happened. A predicted, recorded consequence — not unrecorded drift.

### Not done here, by design

No readiness flip, no merge, no relabel beyond phase truth, no issue edit, no acceptance-box tick, and
no runtime gate. `scaffold.runtime` is supervisor-coordinated and is sequenced separately under the
serialized singleton lease, with the sandbox returned to Aspire/Docker zero afterwards.

## Supervisor Tier-A — exact-head sign-off at `8dce918ba` (2026-08-30)

Artifact-only commit. Every row re-derived independently at this head on a clean tree.

### Head identity

Main converged: `24f6642f` → `9710a2898` (S8 cleanup epoch) → `2a1248d33` (#1740, S5). Merge
`4bf62c18d`, corpus regen + bounded receipt `8dce918ba`. **Patch-identity proven**: all 11 owned files
byte-identical before/after the merge (`git diff --quiet` clean on each). True intersection with the
`9710a2898..2a1248d33` main delta: zero (`comm` on the authoritative 11-path list, not a polluted
base..head diff).

### Bounded, no-runtime evidence for the owned acceptance line

`behavior.package-backed-plugin-doctor` run standalone (no scaffold/plugin-install/DB/AppHost/Docker/
browser/relay): **exit 0, 2/2 passed**, captured stdout shows `PACKAGE_BACKED_PLUGIN_DOCTOR_PASS` with
concrete registry/permission evidence, not a silent skip. Receipt:
`receipts/package-backed-doctor-9900007f7.json`. **This proves the leaf's owned criterion. It does
NOT satisfy plan row 16's literal "Full runtime smoke... REQUIRED" wording**, which names the complete
`scaffold.runtime` suite — that remains genuinely unproven, blocked by the unrelated
`behavior.app-reference` browser gate sitting earlier in `RUNTIME_GATES` (see #1764's identical finding
this session). Not conflating the two.

### Gate table results at `8dce918ba`

| Row | Gate | Result |
| --- | --- | --- |
| 2 | Focused doctor regression | PASS — exit 0, **34/0** over `packages/cli/src/public/features/plugins/doctor` |
| 3 | Installed generator unit | PASS — exit 0, **9/0** |
| 4 | AI compiler suite | PASS — exit 0, **9/0** |
| 5 | AI package suite | PASS — `test` **32/0**; `check` clean |
| 6 | CLI package check | PASS — clean |
| 7 | Exact-ceiling check | PASS — exit 0, 10 files selected, 0 diagnostics |
| 8 | Exact-ceiling lint | PASS — scratch config (root `packages/cli/` exclusion removed, disclosed not concealed), exit 0, 10/10 processed, 0 findings |
| 9 | Exact-ceiling format | 1 finding, `public-command-dependencies.ts` — **pre-existing**, confirmed by patch-identity: this exact file is byte-identical across the main merge, so the finding predates this convergence. Cannot fail CI (root config still excludes `packages/cli/` from real `fmt`). Previously recorded as leaf-owned/scope-deferred; unchanged status. |
| 10 | Doctrine/quality | PASS — `quality:gate` exit 0, only pre-existing F-5/F-6 `export default` warnings outside the ceiling |
| 11 | JSR doc surface | `packages/cli` exit 0. `plugins/ai` exit 1 — **verified pre-existing**: diffed head vs a detached checkout of main `2a1248d33`, output identical except for path prefixes and one npm build-script warning; same finding count and content at base. |
| 12 | Package publish dry runs | PASS — both `packages/cli` and `plugins/ai` succeed |
| 13 | MCP export corpus | Regenerated (only carrier that moved), now exit 0 |
| 14 | Publish assets | PASS — exit 0 |
| 15 | Lock hygiene | PASS — byte-unchanged vs `13878a80a` |
| 16 | Full runtime smoke | **NOT proven.** Bounded evidence above covers the owned criterion only. |

### Verdict

**Tier-A PASS at `8dce918ba`**, with row 16 explicitly open pending the singleton runtime lease (queued
behind #1764 per standing order). Cleared for a fresh, opposite-family IMPL-EVAL on the criteria this
head can actually support — evaluator must judge the bounded evidence as bounded, not as full-suite
proof.

## Post-eval review amendment — supervisor Tier-A re-verification at `2b0c05356`

Owner ruling: existing DeepSeek IMPL-EVAL (`54c72a970`, `PASS_IMPL`) remains valid and is **not**
rerun. Two Augment review threads on the close-gate run were valid findings within the authorized
ceiling (paths 2/3), fixed as a bounded S10 amendment.

Threads, both on `installed-runtime-registry-generator.ts`: line 373 (medium) —
`readRuntimeManifest` dropped `inspectionProtocolDeclared` whenever `command` was missing/malformed,
so a manifest that declared the protocol but malformed `command` fell through to silent
`continue`-skip instead of failing closed; line 471 (low) — a throw from `process.exec` bypassed
`fail()`'s stable `Generator inspection protocol 1 failed for <plugin>:` prefix.

Both fixed with a shared stable-prefix error path. Two focused regressions added, each proven red
against a temporarily-reverted product file before the fix, green after: file-local 11/11 (was 9/11
pre-fix-tests baseline, +2 new); doctor/generate areas 56/0. `deno check` clean on both changed files.
Ceiling unchanged (both files already in the locked 11); `deno.lock` byte-unchanged.

Both review threads answered with commit `2b0c05356` and evidence, then resolved.
`agentic:review-threads` now reports `PASS`, `unanswered=0`.

Tier-A re-verified at `2b0c05356`: AI compiler suite 9/0, AI package test 32/0, CLI package check
clean, `check:mcp-export-corpus`/`check:publish-assets`/`check:agent-docs-prose`/`arch:check` all
exit 0, lock unchanged. **No new IMPL-EVAL required per owner ruling** — this is a supervisor-verified
bounded amendment on top of the already-valid evaluator verdict, not a new implementation cycle.
