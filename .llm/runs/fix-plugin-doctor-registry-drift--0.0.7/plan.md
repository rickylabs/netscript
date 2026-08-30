# Plan: plugin doctor generator-selected registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Phase | `plan-eval` |
| Re-plan baseline | `61b8bf52b50a3cc3e98b67b367d1a1e4a2022807` |
| Plan amendment baseline | `349d5915062566c331f6d703e74be3099251a363` |
| Target | `packages/cli` plugin doctor and the AI runtime-registry generator |
| Archetypes | `6 — CLI / Tooling`; `5 — Plugin Package` |
| Scope overlay | optional manifest-advertised generator inspection protocol v1 |

## Why the Plan Reopened

IMPL-EVAL cycle 1 found that the original D1 was too coarse. A runtime manifest describes candidate
paths, but a plugin generator may select a strict subset using policy that the manifest cannot
express. The shipped AI generator reads source and accepts only modules that export a ready
`AiToolDefinition`; therefore `ai/tools/skill-loader.ts` is legitimately absent from the generated
registry even though the manifest walk discovers it. Doctor currently reports that correct state as
an error and prescribes a regeneration that cannot change it.

The repair introduces an architectural process contract. The old `PLAN-EVAL: N/A` decision is
superseded; a fresh, separate PLAN-EVAL must approve this plan before any S7 test or product edit.

## Coordinator-Ruled Design

The direction and ceiling are no longer open choices. The authorized repair is a narrow, generic,
optional, manifest-advertised generator inspection protocol:

- `runtimeRegistryGenerator.inspectionProtocol: 1` advertises support. Advertising is optional.
- only a present `inspectionProtocol` key activates inspection; version `1` uses
  `--inspect --inspection-protocol 1 --manifest-json <json>`, omits both `--manifest` and
  `--allow-write`, and accepts one strict JSON document on stdout. Invalid advertised declarations,
  process failures, and invalid reports all remain generator-inspection errors — none can enter the
  legacy manifest-walk path.
- The CLI invokes the same external generator through the already-injected `ProcessPort`.
- Inspect and compile use one shared pure AI selector. The CLI never learns what a ready AI tool
  definition is.
- A manifest with no `inspectionProtocol` property retains the current manifest walk unchanged.
- AI adopts protocol v1 in this leaf. Workers, sagas, and triggers do not.

AC2 is unchanged. A definition selected by the generator but absent from the registry remains a
failure. `skill-loader.ts` is a factory, not a definition, so excluding it is healthy and requires no
issue edit.

## Doctrine and Architecture

- `packages/cli` remains an Archetype-6 **Keep** surface. Process execution stays behind
  `ProcessPort`; manifest and source validation stay behind `FileSystemPort`; composition stays
  declarative.
- `plugins/ai` remains an Archetype-5 plugin package and owns its selection semantics. The host
  consumes a versioned evidence report and never gains a plugin-kind switch or source-shape parser.
- A1 applies at the process boundary: the v1 JSON request/response contract is defined and validated
  before consumption. A6/A7 keep selection in the existing compiler and use captured stdout instead
  of a second filesystem protocol. A14 requires the real AI regression to be committed red-before.
- AP-9 is avoided: neither the runtime manifest nor `packages/cli` copies AI source-selection logic.
- No public package export, new dependency, lockfile update, or architecture-debt entry is planned.

## Locked Contract

### Capability declaration and invocation

The AI manifest changes only the existing generator declaration:

```json
{
  "runtimeRegistryGenerator": {
    "command": "src/cli/generate-runtime-registries.ts",
    "args": ["--profile", "scaffold"],
    "inspectionProtocol": 1
  }
}
```

Presence is tested separately from value:

- Property absent: do not invoke a child process during dry-run; use the legacy manifest walk.
- Property present and exactly numeric integer `1`: invoke protocol v1.
- Property present with any other value, including a string, `null`, fraction, or unknown version:
  fail closed as an invalid advertised generator-inspection contract. Do not fall back.

The v1 process arguments, in contract order after the generator URL, are:

```text
--project-root <absolute-project-root>
<runtimeRegistryGenerator.args>
--official-samples false
--inspect
--inspection-protocol 1
--manifest-json <JSON.stringify(resolved-runtime-manifest)>
```

The parent command is `deno run --config <projectRoot>/deno.json --allow-read <generatorUrl> ...`.
Inspect mode does not receive `--allow-write`, does not receive `--manifest`, and does not materialize
or remove `.netscript/.runtime-manifests/<plugin>.json`. Normal compile invocation remains unchanged.

### Response schema

The generator emits exactly one JSON document on stdout and no progress text in inspect mode:

```json
{
  "inspectionProtocol": 1,
  "registries": [
    {
      "registryPath": ".netscript/generated/plugin-ai/tools.registry.ts",
      "sourceFiles": ["ai/tools/e2e-tool.ts"]
    }
  ]
}
```

Protocol v1 is strict:

- The top-level value is a plain object with exactly `inspectionProtocol` and `registries`.
- `inspectionProtocol` is exactly numeric integer `1`.
- `registries` is an array of plain objects with exactly `registryPath` and `sourceFiles`.
- Each `registryPath` is a non-empty canonical project-relative slash path: no URL, absolute path,
  backslash, empty/`.`/`..` segment, query, or fragment.
- The manifest's declared `runtimeRegistries[].registryPath` values must themselves be valid and
  unique before invocation. The response registry set must match that declared set exactly: every
  declared path once, with no duplicate, omission, or extra target. An empty `sourceFiles` array is
  valid and must still be reported for its target.
- Each `sourceFiles` element is a non-empty canonical project-relative slash path under the project
  root with the same escape/URL checks. It must exist at inspection time and be a regular file.
  Validation deliberately does not require membership in the legacy manifest walk; doing so would
  reintroduce the host as selection authority and prevent later workers/profile adoption.
- A source path may appear at most once within a registry. The same source may appear in two distinct
  declared registries because target overlap can be legitimate. Accepted source sets are sorted by
  the host before comparison; the AI reporter also emits deterministic sorted arrays.
- Empty stdout, multiple/log-prefixed JSON documents, malformed JSON, wrong types, and unknown fields
  are invalid protocol responses.

The schema/parser/validator remains private in
`installed-runtime-registry-generator.ts`, which already owns the `ProcessPort` call. The previously
proposed new `runtime-registry-source-report.ts` is removed because it is not authorized.

### Shared pure AI selector

`plugins/ai/src/cli/ai-registry-compiler.ts` owns one pure selection function over `ProjectFiles` and
an `AiRegistryTarget`. It returns the deterministic selected relative paths and performs no write.

- `compileAiRegistry` calls that selector, then alone renders/writes the registry.
- AI inspect mode calls that same selector for every declared AI target, then serializes the v1
  report. It never calls `compileAiRegistry`.
- There is no second source-shape predicate, report-only approximation, or host-side AI rule.
- Compiler tests assert normal compile's returned `files` exactly equal the shared selector result.

### No-write proof

Omitting `--allow-write` is a permission boundary, but it is not the whole proof. The implementation
must establish all of the following:

1. AI compiler unit evidence snapshots the in-memory `ProjectFiles` write map before and after pure
   selection and asserts byte-for-byte equality.
2. Installed-generator unit evidence snapshots the complete `MemoryFileSystem` before and after an
   advertised dry-run, asserts equality, and asserts the `ProcessPort` invocation contains no
   `--allow-write` or `--manifest` while returning a valid fixture report.
3. The real AI integration regression snapshots all regular project files and their bytes after
   normal generation, runs doctor/inspection, then asserts the full snapshot is unchanged. This
   proves inspect mode did not rewrite the registries, create a sidecar, or mutate another project
   file.

Any write attempt that escapes a test double is independently denied by the child Deno permission
set. Normal compile write behavior remains covered by existing AI and installed-generator tests.

### Fail-closed user surface

All advertised-protocol failures throw with this stable prefix and make doctor unhealthy:

```text
Generator inspection protocol 1 failed for <plugin>: <reason>
```

The reason is precise:

| Validation/process failure | Reported reason |
| --- | --- |
| Invalid advertised value | `manifest inspectionProtocol must be the integer 1` |
| Child non-zero | `generator exited <code>: <trimmed stderr, or stdout when stderr is empty>` |
| Empty/malformed/multiple output | `stdout is not one protocol 1 JSON document` |
| Wrong version or shape/unknown field | `invalid protocol 1 response: <field-specific reason>` |
| Duplicate manifest registry path | `manifest declares duplicate registry path: <path>` |
| Missing response target | `response omitted declared registry path: <path>` |
| Extra response target | `response declared unknown registry path: <path>` |
| Duplicate response target | `response duplicated registry path: <path>` |
| Invalid source path | `response source path is invalid for <registry>: <path>` |
| Missing/non-file source | `response source is not a regular project file for <registry>: <path>` |
| Duplicate source in one target | `response duplicated source for <registry>: <path>` |

The doctor workspace report keeps id `runtime-registry:inspection`, changes its title to
`Generator runtime registry inspection`, and preserves the thrown detail. It offers no false
`netscript generate plugins` remediation for a protocol failure. This wording cannot be mistaken for
the legacy path: absent-protocol inspection never invokes a generator and retains existing
manifest-derived evidence wording.

`GeneratedPluginRegistry` carries `sourceAuthority: 'generator' | 'manifest'` beside `sourceFiles` so
healthy and drift reports name the evidence used. Its field shape remains internal. As corrected for
F3, S3 already changed `registrableItems` from the base plugin-wide sum to a per-target count; only
the result shape was preserved, no production consumer reads the value, and this repair will use the
selected per-target count for generator-authoritative results.

## Locked Scope

### Eleven coordinator-authorized product/test paths

Only these eleven coordinator-enumerated paths are authorized:

1. `packages/cli/src/public/features/generate/plugins/generate-installed-plugin-registries.ts`
2. `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts`
3. `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator_test.ts`
4. `packages/cli/src/public/features/plugins/doctor/runtime-registry-drift.ts`
5. `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts`
6. `packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts`
7. `packages/cli/src/public/features/root/public-command-dependencies.ts`
8. `plugins/ai/scaffold.runtime.json`
9. `plugins/ai/src/cli/generate-runtime-registries.ts`
10. `plugins/ai/src/cli/ai-registry-compiler.ts`
11. `plugins/ai/src/cli/ai-registry-compiler.test.ts`

### Flagged existing-test interpretation

`packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts`
is retained as the natural home for the already-existing real AI `skill-loader` generation case and
the required byte-snapshot/no-write assertion. This rests on the supervisor's reading of the
coordinator's statement that existing adapter/evidence/doctor/test paths may be amended; it is not
one of the five enumerated added paths. The interpretation is recorded in `drift.md` so PLAN-EVAL or
the coordinator can overturn it before S7 at low cost.

Run artifacts under `.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/` remain authorized evidence.
Any product/test path beyond the eleven listed paths and the one flagged existing integration test is
a rescope-and-stop: do not edit it, append the evidence and need to `drift.md`, and request approval.

### Explicitly removed/deferred paths

- No `runtime-registry-source-report.ts` is created; parsing and validation stay in path 2.
- No `plugins/workers/*`, `plugins/sagas/*`, or `plugins/triggers/*` path is amended.
- F4/workers profile, `include`, `includeWhenPresent`, plugin-directory, and dotfile adoption is
  knowingly deferred to follow-up scope. The protocol needs no redesign for that work: a workers
  manifest can later advertise `inspectionProtocol: 1`, and its existing selector can feed the same
  target/path/source report without the host learning workers policy.

## Non-Scope

- Issue or acceptance-text mutation; AC2 already distinguishes definitions from factories.
- Workers adoption/F4 closure, streams registry creation, arbitrary handwritten registry grammar,
  recursive discovery changes, and unrelated #1366/#1574/#1365 behavior.
- New public exports, dependencies, lockfile changes, generated repository assets, docs, plugin
  manifests other than AI's authorized manifest, or any seventh/new product family.
- Merge/readiness changes, labels, issue edits/closure, acceptance-box mutation, or
  implementation-author self-certification.
- Author-run `scaffold.runtime`, Aspire, Docker, or browser work. The required runtime gate is
  supervisor-coordinated under the cluster-wide singleton lease.

## Required Regression and Slice Discipline

| Slice | Work | Product/test paths | Commit/push/comment boundary | Required evidence |
| --- | --- | --- | --- | --- |
| S6 | Amend and re-lock the ruled design/ceiling/gates. No product or test edit. | run artifacts only | Commit, explicit-refspec push, structured correction PLAN comment, PR body update, then stop. | Raw `git diff --exit-code -- deno.lock`; separate PLAN-EVAL next. |
| PLAN-EVAL | Separate evaluator reviews the contract, exact scope, red-before design, failure surface, no-write proof, F4 deferral, and gate sufficiency. | evaluator artifact only | `APPROVED` permits S7; `CHANGES_REQUESTED` returns to S6. | No implementation before approval. |
| S7 | Extend the existing real AI integration case: normal generation includes a real ready tool, legitimately excludes discoverable `ai/tools/skill-loader.ts`, then doctor is asserted healthy. Capture the pre-inspection byte snapshot for the later no-write assertion. No product edit. | flagged integration test only | Commit the red test alone, explicit push, structured TEST/IMPL comment, stop before S8. | Against the current product the new healthy assertion must fail because doctor expects `skill-loader.ts`; record exact exit and counts. Existing case name/assertions stay intact. |
| S8 | Extract/use the shared pure AI selector, add inspect CLI mode, advertise v1 in the AI manifest, and prove selector purity/normal compile stability. | paths 8–11 | Commit/push/comment before host work. | AI compiler test and AI package suite: shared selector equality, deterministic report, no selector writes, normal generation unchanged. |
| S9 | Parse/validate the advertised contract through `ProcessPort`, consume generator-selected evidence, retain absent-protocol legacy behavior, fail closed, update evidence wording, and turn S7 green. | paths 1–7 plus flagged integration test | Commit/push/comment before final gates. | Unit validation matrix; real AI `skill-loader` healthy; full project byte snapshot unchanged by inspect; original five doctor cases green. |
| S10 | Reconcile all required gates and evidence. | run artifacts only unless an authorized path needs a proven correction | Commit/push/comment and update PR body. | All author-owned gates green; supervisor-owned `scaffold.runtime` report attached before IMPL-EVAL. |

Every slice commits only its named scope, pushes with
`git push origin fix/plugin-doctor-registry-drift:fix/plugin-doctor-registry-drift`, posts the
structured PR comment required by `netscript-pr`, updates the PR Validation/evidence block, and checks
review threads before the next slice. A discovered need outside the locked scope stops the slice.

## Required Gate Set

Structured wrappers are the verdict source for focused Deno check/test/lint/fmt. Any JSON receipt in
`.llm/tmp/gate-receipts/` is local-only and gitignored; committed evidence must give a reproducible
command, evaluated SHA, exit code, and test counts. No claim relies on a receipt unavailable from a
fresh checkout.

| # | Gate | Command/scope | Required outcome / owner |
| --- | --- | --- | --- |
| 1 | S7 red-before | `run-deno-test.ts` over `installed-runtime-registry-integration_test.ts` | Non-zero at the S6 product head for the new AI healthy assertion; exact pass/fail counts recorded. Author. |
| 2 | Focused doctor regression | `run-deno-test.ts` over `doctor-plugin-registry-drift_test.ts` | Exit 0 after implementation; all original five cases plus any authorized protocol cases pass. Author. |
| 3 | Installed generator unit/integration | Structured test wrapper over `installed-runtime-registry-generator_test.ts` and the flagged integration test | Exit 0; protocol validation, legacy absence, fail-closed failures, real AI health, and byte-identical inspect proven. Author. |
| 4 | AI compiler suite | Structured wrapper over `plugins/ai/src/cli/ai-registry-compiler.test.ts` | Exit 0; shared selector used by inspect/compile, zero selector writes, normal generation stable. Author. |
| 5 | AI package suite | `deno task --cwd plugins/ai test` and `deno task --cwd plugins/ai check` through `rtk proxy` when available | Exit 0 with exact test counts; this is the plugin-owning suite implicated by the expanded ceiling. Author. |
| 6 | CLI package check | `deno task --cwd packages/cli check` through `rtk proxy` when available | Exit 0. Author. |
| 7 | Exact-ceiling check | `run-deno-check.ts --unstable-kv` over every authorized TypeScript path actually changed | Exit 0, zero diagnostics. Author. |
| 8 | Exact-ceiling lint | `run-deno-lint.ts` over the same TypeScript paths using the disclosed root-rule scratch config if the root exclusion selects none | Exit 0, zero leaf-owned findings. Author. |
| 9 | Exact-ceiling format | `run-deno-fmt.ts` over the same TypeScript paths using the disclosed root-rule scratch config | Every finding line-attributed base-vs-head; all leaf-owned findings in authorized paths fixed. Author. |
| 10 | Doctrine/quality | `deno task quality:gate` through the repo gate wrapper | Exit 0. Author. |
| 11 | JSR doc surface | `deno task doc:lint --root packages/cli --pretty` and `--root plugins/ai --pretty` through repo gates where catalogued | Exit 0. Author. |
| 12 | Package publish dry runs | `deno publish --dry-run --allow-dirty --no-check=remote` in `packages/cli`; `deno task --cwd plugins/ai publish:dry-run` | Exit 0; exact warnings recorded, no mutation. Author. |
| 13 | MCP export corpus | `deno task check:mcp-export-corpus` through repo gate | Measured outcome recorded even if unchanged. Author. |
| 14 | Publish assets | `deno task check:publish-assets` through repo gate | Measured outcome recorded because AI's shipped manifest changes. Author. |
| 15 | Lock hygiene | raw `git diff --exit-code -- deno.lock`, plus pinned-base comparison at handoff | Exit 0; byte-unchanged. Author. |
| 16 | Full runtime smoke | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report <owned-report-path>` | **REQUIRED**, exit 0. Supervisor coordinates the cluster-wide singleton runtime lease and run; author must not run it. Durable evidence is the runner's `--report` JSON because `e2e:cli` is not in `.llm/tools/gates/catalog.ts`. |

The runtime smoke is the end-to-end proof for F1 because the plugin-suite builder defaults
`aiMcp = true` and `behavior.plugin-doctor-missing-module` requires doctor to be healthy before its
mutation. Before and after the leased run, the supervisor uses `agentic:leak-check`; cleanup then uses
`agentic:teardown --apply` only for positively proven owned resources, adding `--owned-root` for
anything started outside the worktree. The required terminal state is Aspire/Docker zero.

Current host facts are recorded only as gate prerequisites, not excuses: the recreated
`netscript-dind` resolves at `10.4.12.19`; the project `mise` environment supplies
`DOCKER_HOST=tcp://netscript-dind:2375`; Docker client/server are 28.5.2; the sandbox was observed at
zero; and `fs.inotify.max_user_instances` is 1024. No below-28 warning or expected inotify collision
is recognized. Any runtime abort, including exit 134/inotify errors, is a real finding to investigate
and cannot be pre-classified away.

## Risk Register

| Risk | Mitigation / stop condition |
| --- | --- |
| Inspect and compile selectors diverge | One pure selector in `ai-registry-compiler.ts`; equality test proves both paths consume its output. A second predicate is forbidden. |
| Inspect mutates the project | Permission omission plus three-layer before/after state proof; any byte drift is a failing test. |
| Advertised protocol silently degrades | Presence/value handled separately; every invalid declaration, child failure, or invalid report uses the generator-inspection error surface and exits unhealthy. |
| Malicious or corrupt response escapes project/targets | Strict DTO, exact declared target set, canonical relative paths, duplicate rejection, and regular-file validation. |
| Legacy third-party behavior changes | Property absence performs no process call and preserves the current manifest walk and wording. |
| F4 remains latent | Knowingly deferred by coordinator. The generic v1 contract supports later workers adoption without a host or schema redesign. |
| Integration-test permission is narrower than supervisor reading | `drift.md` flags the interpretation; PLAN-EVAL/coordinator may remove or relocate it before S7. |
| Runtime lease collision or leaked resources | Only supervisor runs `scaffold.runtime`; serialize lease, use owned report, leak-check, proven teardown, and require Aspire/Docker zero. |
| Runtime failure is prematurely excused | No environment failure is pre-excused. Docker 28.5.2 and inotify 1024 are the baseline; any failure is investigated. |
| Evidence overstates durability or values | Treat gitignored receipts as local-only; record reproducible commands/outcomes. State F3 as shape-preserved/value-changed. |

## PLAN-EVAL Handoff

**REQUIRED — awaiting a fresh separate evaluator.** Review must confirm:

- exact `inspectionProtocol: 1` activation, invocation, response schema, and fail-closed surface;
- one shared pure selector used by AI inspect and compile;
- the three-layer no-write proof;
- the real AI `skill-loader` healthy regression committed red-before in S7;
- the eleven coordinator-authorized paths, the flagged integration-test interpretation, and the
  absence of the unauthorized new parser file;
- F4/workers adoption knowingly deferred without protocol redesign;
- required AI/CLI/static/publish gates and the supervisor-coordinated leased `scaffold.runtime`
  report with no pre-excused environment failure;
- F3 and F5 evidence corrections.

No S7 test or product implementation begins until a separate session records
`PLAN-EVAL: APPROVED`. `CHANGES_REQUESTED` returns the run to S6. The implementation author does not
self-certify, flip draft state, mutate issue/acceptance state, relabel, merge, or run the leased
runtime gate.
