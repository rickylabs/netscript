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
| 6 | Research the generator-selection gap and re-lock the expanded plan | raw lock proof; mandatory separate PLAN-EVAL | run artifacts only |
| 7 | AI legitimate-exclusion red-before regression | focused structured test fails on S6 product | doctor regression test + run artifacts |
| 8 | AI report-only source-shape selection | AI report/compiler tests | AI manifest/generator/compiler/test + run artifacts |
| 9 | Workers report-only full selection and F4 closure | workers report/selection tests | workers manifest/generator/new test + run artifacts |
| 10 | Sagas/triggers report-only selection | generator/golden tests | sagas/triggers manifests/generators/tests + run artifacts |
| 11 | Host report validation/consumption and doctor evidence wording | focused/related suites green | authorized CLI paths + run artifacts |
| 12 | Expanded gates and evaluator handoff | locked plan gate matrix | run artifacts only |

### Deferred Scope

- Stream topology without a runtime-registry manifest — no generated registry contract exists on
  current main.
- Recursive directory discovery and arbitrary handwritten registry grammars — preserve generator
  manifest semantics.
- #1366, #1574, #1365, and all live-runtime gates.

### Contributor Path

To add a new registry-backed definition kind, declare its candidate paths and registry path in the
plugin's `scaffold.runtime.json`. If the generator applies any selection beyond that path contract,
advertise and implement the source-selection report protocol so doctor consumes the generator's
actual selected set without a CLI plugin-name switch. To extend doctor wording, edit the focused
`runtime-registry-drift.ts` policy and its semantic tests.

### S6 Design Checkpoint — generator-selected evidence

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
manifest-authority assumption incomplete, opening a cross-process report contract, third-party
compatibility policy, four-plugin adoption decision, workers F4 closure, and 24-path ceiling. The old
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
| Close workers F4 | All four first-party generators adopt reporting; workers reports its overlays, conditions, plugin dirs, and dotfile policy. | plan D8R |
| Require PLAN-EVAL | The material contract, compatibility, scope, and sequence decisions need independent approval. | plan D9R; harness plan gate |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Current streams plugin has no runtime registry manifest despite issue's generic stream wording. | minor | yes |
| IMPL-EVAL disproved the six-path plan's manifest-only authority; repair expands to four plugin generators and 24 locked paths. | significant | yes |

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

## S6 PLAN-EVAL Handoff

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
