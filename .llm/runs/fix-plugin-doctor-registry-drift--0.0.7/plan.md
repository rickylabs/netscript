# Plan: plugin doctor generator-selected registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Phase | `plan-eval` |
| Re-plan baseline | `61b8bf52b50a3cc3e98b67b367d1a1e4a2022807` |
| Target | `packages/cli` plugin doctor plus first-party runtime-registry generators |
| Archetypes | `6 — CLI / Tooling`; `5 — Plugin Package` |
| Scope overlays | generator-selection reporting protocol; JSR/publish surface validation |

## Why the Plan Reopened

IMPL-EVAL cycle 1 found that the original D1 was too coarse. A runtime manifest describes candidate
paths, but a plugin generator may select a strict subset using policy that the manifest cannot
express. The shipped AI generator reads source and accepts only modules that export a ready
`AiToolDefinition`; therefore `ai/tools/skill-loader.ts` is legitimately absent from the generated
registry even though the manifest walk discovers it. Doctor currently reports that correct state as
an error and prescribes a regeneration that cannot change it.

The repair is a material contract and scope change. The old `PLAN-EVAL: N/A` decision is superseded;
a fresh, separate PLAN-EVAL must approve this plan before any S7 test or product edit.

## Doctrine and Architecture

- `packages/cli` remains an Archetype-6 **Keep** surface. Process execution stays behind
  `ProcessPort`, manifest/file access stays behind `FileSystemPort`, and the composition root stays
  declarative.
- `plugins/ai`, `plugins/workers`, `plugins/sagas`, and `plugins/triggers` are Archetype-5 plugin
  packages. Each plugin remains the owner of its selection semantics and reports the result through
  a thin CLI adapter; the host does not acquire a plugin-kind switch.
- A1 is applied at the process boundary: define and validate a versioned JSON report contract before
  changing discovery. A6/A7 keep selection with the existing generator/compiler and use captured
  stdout rather than another filesystem protocol. A10 keeps generator construction in composition.
  A14 requires the AI false-positive regression red-before product edits.
- AP-9 is avoided by reporting the generator's decision instead of reimplementing AI source parsing,
  workers profiles, conditional includes, or dotfile policy in `packages/cli`.
- No public package export is planned. The JSON report is a private executable protocol negotiated by
  the optional manifest capability; package export maps and dependencies remain unchanged.

## Goal

Make doctor compare generated registry entries with the source files the responsible generator would
select now. A source definition selected by the generator but absent from the registry remains an
error under AC2; a discoverable factory or helper that the generator legitimately rejects is not a
definition and must not make doctor unhealthy.

## Direction Analysis

| Direction | Strengths | Failure mode / cost | Decision |
| --- | --- | --- | --- |
| (a) Generator-selected source report | Uses the same source-shape, profile, include, conditional-include, plugin-directory, and dotfile rules that write each registry. General across current and future non-path predicates. | Requires an additive process protocol and report-only support in each first-party generator. Older third-party generators need a compatibility fallback. | **Chosen.** It is the only direction that preserves AC2 while making the expected set evidence-backed. |
| (b) Declare selection in `scaffold.runtime.json` | Static and cheap for simple suffix/exclude policies. | Cannot express AI's source-shape predicate without embedding executable policy in data. Mirroring workers overlays and filesystem-dependent conditions would create a second selector and AP-9 drift. | Rejected as the selection authority. The manifest may advertise report capability only; it does not restate selection rules. |
| (c) Downgrade missing entries to warnings | Fits the old CLI-only ceiling and eliminates this false error. | Directly trades away AC2: a real selected definition omitted from the registry would no longer fail doctor. It hides uncertainty rather than improving evidence. | Rejected. AC2 remains unchanged and no issue edit is proposed. |

## Re-locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1R | The plugin generator's current selected-source report is authoritative when the manifest advertises it. | It is the artifact-producing policy, including source-shape and filesystem-dependent rules. |
| D2R | `runtimeRegistryGenerator` gains an optional `sourceSelectionReport.protocolVersion: 1` declaration. | Capability negotiation prevents the CLI from passing unknown flags to older third-party generators. The declaration identifies the executable protocol, not what to select. |
| D3R | Report-only execution receives the already-resolved manifest through `--manifest-json`, gets read permission but not write permission, writes no registry/project manifest, and emits exactly one versioned JSON document on stdout with one normalized `sourceFiles` set per declared `registryPath`. | Doctor stays read-only, stdout is already captured by `ProcessPort`, and published manifests need no project or temp sidecar. |
| D4R | All four first-party runtime-registry generators adopt the report protocol. A manifest without the capability retains the current suffix/exclude walk for backward compatibility. | First-party evidence becomes generator-owned without breaking already-published third-party commands. The fallback is explicitly identified as manifest-derived evidence. |
| D5R | The host rejects malformed, duplicate, absolute, escaping, missing-target, or extra-target report data as a named inspection failure; it never silently falls back after an advertised reporter fails. | An advertised but unusable report is evidence failure, not permission to make a stronger claim from weaker data. |
| D6R | `GeneratedPluginRegistry` carries source evidence and its authority (`generator` or `manifest`); `registrableItems` is the per-target selected/discovered count. | Doctor wording can name its evidence honestly. This also corrects the prior worklog's shape-only/value-preservation overstatement. |
| D7R | Registry import/binding comparison and AC2 error semantics remain unchanged after replacing the expected set. | The defect is the provenance of expected sources, not the bidirectional comparison itself. |
| D8R | Workers reporting includes main target files and `pluginDirs` after profile overlays, `include`, `includeWhenPresent`, excludes, and dotfile filtering. | This closes evaluator F4 rather than knowingly leaving the same assumption latent. |
| D9R | PLAN-EVAL is required and blocks S7. | The reporting protocol, fallback, expanded ceiling, and cross-archetype sequence are material open-design repairs. |

## Compatibility and Failure Semantics

### Locked wire shape

The additive manifest capability is:

```json
{
  "runtimeRegistryGenerator": {
    "sourceSelectionReport": {
      "protocolVersion": 1
    }
  }
}
```

For a version-1 declaration the host invokes the generator with
`--report-selected-sources --manifest-json <resolved-json>` plus the existing project root/profile
arguments, but with `--allow-read` and no `--allow-write`. The generator emits only this normalized
stdout document and performs no writes:

```json
{
  "schemaVersion": 1,
  "registries": [
    {
      "registryPath": ".netscript/generated/plugin-x/x.registry.ts",
      "sourceFiles": ["x/definition.ts"]
    }
  ]
}
```

Array order is deterministic (`registryPath`, then `sourceFiles` lexical order). Paths are
project-relative `/`-normalized strings. The host matches report entries to the manifest's declared
registry paths and never trusts the generator to introduce a target.

- Normal `netscript generate plugins` invocation and generator stdout remain unchanged when the
  report-only args are absent.
- Maintainer copied-plugin generation ignores the additive manifest member and continues its normal
  invocation.
- Report-only mode must not write, delete, or format registry or manifest files. It may read source
  text where selection requires it. The existing project-side temporary manifest remains confined to
  normal generation and is not used by doctor inspection.
- A generator-capable manifest is all-or-nothing: non-zero exit, non-JSON/mixed stdout, wrong
  protocol version, unsafe paths, duplicate target reports, or target-set mismatch becomes a doctor
  inspection error naming the plugin. There is no manifest fallback in that case.
- An older manifest with no report capability keeps the existing path walk and is labelled
  `manifest` authority. This is compatibility behavior, not a claim that arbitrary undeclared
  source predicates are modeled.
- Empty-selection behavior stays bounded to existing generator semantics; the repair does not invent
  definitions or turn a legitimate helper-only directory into an AC2 failure.

## Scope — Expanded and Locked Product/Test Ceiling

Only the following product/test paths are authorized after PLAN-EVAL approval:

1. `packages/cli/src/public/features/generate/plugins/generate-installed-plugin-registries.ts`
2. `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts`
3. `packages/cli/src/public/features/generate/plugins/runtime-registry-source-report.ts` (new)
4. `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator_test.ts`
5. `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts`
6. `packages/cli/src/public/features/plugins/doctor/runtime-registry-drift.ts`
7. `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts`
8. `packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts`
9. `packages/cli/src/public/features/root/public-command-dependencies.ts`
10. `plugins/ai/scaffold.runtime.json`
11. `plugins/ai/src/cli/generate-runtime-registries.ts`
12. `plugins/ai/src/cli/ai-registry-compiler.ts`
13. `plugins/ai/src/cli/ai-registry-compiler.test.ts`
14. `plugins/workers/scaffold.runtime.json`
15. `plugins/workers/src/cli/generate-runtime-registries.ts`
16. `plugins/workers/src/cli/runtime-registry-generator.ts`
17. `plugins/workers/src/cli/runtime-registry-generator_test.ts` (new)
18. `plugins/sagas/scaffold.runtime.json`
19. `plugins/sagas/src/cli/generate-runtime-registries.ts`
20. `plugins/sagas/src/cli/registry-generator.ts`
21. `plugins/sagas/tests/cli/registry-generator-golden_test.ts`
22. `plugins/triggers/scaffold.runtime.json`
23. `plugins/triggers/src/cli/generate-runtime-registries.ts`
24. `plugins/triggers/src/cli/generate-runtime-registries_test.ts` (new)

Run artifacts under `.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/` remain authorized evidence.
Any product/test path beyond these 24 paths is a significant rescope: stop before editing, append the
need and evidence to `drift.md`, and request supervisor approval. No plugin manifest, generator,
generated asset, docs/export surface, or test outside this list is implicitly authorized.

## Non-Scope

- Issue or acceptance-text mutation; AC2 already distinguishes definitions from factories.
- Streams registry creation, arbitrary handwritten registry grammar, recursive discovery changes,
  and unrelated #1366/#1574/#1365 behavior.
- A new public `@netscript/plugin` API, package export, dependency, lockfile update, generated repo
  asset, or documentation surface.
- `e2e:cli`, Aspire, Docker, browser gates, runtime leases, merge/readiness changes, labels, issue
  edits/closure, acceptance-box mutation, or implementation-author self-certification.

## Required Regression and Slice Discipline

| Slice | Work | Product/test files | Commit/push/comment boundary | Proving evidence |
| --- | --- | --- | --- | --- |
| S6 | Re-derive F1/F3/F4/F5, expand ceiling, and re-lock this plan. No product/test edit. | none; run artifacts only | Commit and explicit-refspec push; structured PLAN comment; stop. | Raw `git diff --exit-code -- deno.lock`; separate PLAN-EVAL required next. |
| S7 | Add one AI case: create a ready tool plus discoverable `skill-loader.ts`, run the real installed AI generator, then assert doctor remains healthy. No product edit. | ceiling path 8 only | Commit the red test alone, push, and post its structured evidence before S8. | Against S6 head the focused structured suite must exit non-zero because current doctor raises `RemoteError` for `skill-loader.ts`; record exact passed/failed counts. |
| S8 | Add the locked report-only protocol to AI while reusing the compiler's exact source-shape selection. | ceiling paths 10–13 only | Commit/push/comment before S9. | AI tests prove deterministic report JSON, `skill-loader.ts` exclusion, zero report-mode writes, and unchanged normal generation. |
| S9 | Add the same protocol to workers and make its existing selector return complete per-target evidence. | ceiling paths 14–17 only | Commit/push/comment before S10. | Workers tests prove profile/include/conditional/dotfile/plugin-dir selection, zero report-mode writes, and unchanged normal generation; F4 is closed. |
| S10 | Add the protocol to sagas and triggers without changing their normal registry output. | ceiling paths 18–24 only | Commit/push/comment before host consumption. | Saga/trigger tests prove exact report paths, zero report-mode writes, and byte/semantic stability of normal registries. |
| S11 | Define the focused host report parser/validator, consume reports in installed dry-run inspection, retain manifest fallback for non-capable plugins, expose authority, and update doctor evidence wording. | ceiling paths 1–9 only | Commit/push/comment before final gates. | S7 regression turns green without weakening/removing its assertion; malformed-report and compatibility tests pass; existing five semantic cases remain green. |
| S12 | Reconcile final evidence, run locked gates, update PR evidence, and hand off. | none unless an authorized leaf-owned format correction is required; run artifacts otherwise | Evidence commit/push/comment; stop for fresh Tier-A and opposite-family IMPL-EVAL. | Gate matrix below at exact final head. |

Every slice must update `worklog.md`/`context-pack.md`, commit, push with the explicit refspec, and
post its structured PR comment before the next slice starts. S7's red commit is never amended into a
product commit.

## Test Invariants

- The S7 case must prove the full defect: the generator legitimately excludes a path the manifest
  walk can see, generation succeeds, and doctor exits healthy. Merely unit-testing AI's predicate is
  insufficient.
- The original S2 case name and its four assertions remain intact; shared-harness refactoring may
  not weaken or remove them.
- AC2 retains a negative case where a generator-selected definition is absent from its registry and
  doctor exits 1 with `netscript generate plugins` remediation.
- Reverse orphan and imported-but-unused cases remain errors.
- Report parsing tests exercise hostile/invalid target and path data, not only the happy JSON shape.
- F4 is closed, not deferred: at least one workers report test distinguishes generator selection
  from the host's old manifest walk using overlay/include/conditional or dotfile behavior.

## Open-Decision Sweep

| Decision | Disposition | Why deferral will not force repair rework |
| --- | --- | --- |
| Legacy/third-party manifest has no report capability | **Safe to defer.** Preserve the existing suffix/exclude walk and mark its authority as `manifest`. | Capability is additive, so any plugin can adopt the same wire contract later without changing host comparison or report parsing. This is explicit compatibility evidence, not a claim that unknown private predicates were executed. |
| Shared public `@netscript/plugin/cli` report helper | **Safe to defer.** Do not add one in this repair. | The executable JSON boundary is small and versioned; adding a public helper would expand exports and cascade without being required for interoperability. A later helper can emit the identical wire shape. |
| Report transport and failure policy | **Resolved now** by D2R–D5R. | Captured stdout, inline resolved manifest JSON, read-only permission, strict validation, and no silent fallback are locked. |
| First-party adoption breadth / workers F4 | **Resolved now** by D4R/D8R. | All four generators adopt; workers selection divergence is tested and closed. |
| Empty selected target | **Resolved now.** Report every manifest target, including an empty `sourceFiles`; preserve existing normal-generator empty behavior and do not invent a definition. | Host target matching remains total and future behavior does not require a schema change. |
| Issue AC2 wording | **Safe to defer / no edit needed.** | AC2 already says definition; generator selection supplies that evidence. Issue mutation is coordinator-owned. |

No unresolved “must resolve now” decision remains for the planning evaluator.

## JSR Audit Surface Scan

- Planned publish packages: `@netscript/cli`, `@netscript/plugin-ai`,
  `@netscript/plugin-workers`, `@netscript/plugin-sagas`, and
  `@netscript/plugin-triggers`.
- Planned public export-map delta: none. The manifest capability and generator executable protocol
  are shipped inputs, but no `deno.json` export key or public `mod.ts` barrel changes.
- Planned dependency/lock delta: none.
- Slow-type risk: generator compiler/result functions that are already exported from internal CLI
  modules may gain options or richer return types. Every exported function, option, and result field
  must keep explicit named types and JSDoc where its publish package requires it; do not infer an
  anonymous cross-module return type under `isolatedDeclarations`.
- Surface-leak risk: host report types stay inside the CLI feature; plugin report DTOs stay inside
  generator entrypoints/implementation modules and are not re-exported.
- Publish-asset risk: four `scaffold.runtime.json` files are shipped and therefore require the
  measured publish-assets check plus package dry runs.
- Verification: touched-package `check`, full-export doc lint, publish dry runs,
  `check:mcp-export-corpus`, and `check:publish-assets`. Any unexpected export, dependency, or
  generated-asset requirement is outside the ceiling and triggers rescope-and-stop.

## Fitness and Validation Gates — Locked Before Repair Implementation

| Order | Gate | Command/check | Required outcome |
| --- | --- | --- | --- |
| 1 | S7 red-before | Structured `run-deno-test.ts` over `doctor-plugin-registry-drift_test.ts` | Non-zero for the new healthy assertion on S6 product; record pass/fail counts and failure name. |
| 2 | Focused doctor green | Same structured command | Exit `0`; all focused cases pass, including legitimate AI exclusion. |
| 3 | CLI generator/doctor related suite | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --pretty -- --allow-all` followed by the focused doctor file, `doctor-plugin-command_test.ts`, `doctor-plugin-invariants_test.ts`, and installed generator unit/integration files | Exit `0`; report protocol, fallback, and comparison remain integrated. |
| 4 | Plugin generator suites | The same structured wrapper over the authorized AI compiler/report, workers runtime-generator/report, sagas generator, and triggers generator/report test files | Exit `0`; report-only selection equals normal generator selection and writes nothing. |
| 5 | Expanded-ceiling check | `run-deno-check.ts` with every ceiling TypeScript file and `--unstable-kv` | Exit `0`, zero diagnostics. |
| 6 | Expanded-ceiling lint | `run-deno-lint.ts` over the same TypeScript ceiling | Exit `0`, zero leaf-owned findings. |
| 7 | Expanded-ceiling format | `run-deno-fmt.ts` over the same TypeScript ceiling | Report every finding with line-level base-vs-head ownership; leaf-owned findings are fixed within the authorized ceiling. |
| 8 | Package checks | `deno task --cwd <package> check` for `packages/cli`, `plugins/ai`, `plugins/workers`, `plugins/sagas`, and `plugins/triggers`, plus explicitly selected non-e2e test files through the structured wrapper | Exit `0`, with exact pass/fail counts. Do not use broad package `test` tasks because recursive discovery can include plugin `tests/e2e` paths. |
| 9 | Quality/doctrine | `deno task quality:gate` through `run-gate.ts` | Exit `0`; exact-head local receipt may be cited as local-only, while the command is the reproducible evidence. |
| 10 | JSR docs/publish | `doc:lint` for every touched publish package plus `deno publish --dry-run --allow-dirty` in CLI and each touched plugin | Exit `0` or transparently record a base-proven warning; no export/dependency/lock drift. |
| 11 | MCP export corpus | `deno task check:mcp-export-corpus` | Measured outcome recorded regardless of expected applicability. |
| 12 | Publish assets | `deno task check:publish-assets` | Measured outcome recorded regardless of expected applicability. |
| 13 | Lock hygiene | Raw `git diff --exit-code -- deno.lock` and final pinned-base comparison | Exit `0`; `deno.lock` byte-unchanged. |

`.llm/tmp/gate-receipts/` is gitignored and local-only. A receipt may support same-worktree
reconciliation, but durable review evidence is the committed command, exact head, exit code, and
pass/fail or diagnostic counts, all reproducible from a fresh checkout.

### Generated Cascade Applicability

- `check:mcp-export-corpus`: measured and recorded because the expanded repair crosses CLI and
  publishable plugin packages, even though no export is planned.
- `check:publish-assets`: measured and recorded because four shipped `scaffold.runtime.json` files
  change.
- `check:assets-barrel`: N/A unless an authorized path unexpectedly proves to be an asset input; if
  so, stop and rescope rather than touching a generated asset.
- `check:agent-docs-prose`: N/A; no docs corpus path is authorized.
- `e2e:cli`, Aspire, Docker, and browser gates: explicitly prohibited.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Breaking older third-party generators | Invoke report-only args only when the manifest advertises the capability; preserve the existing walk otherwise. |
| Generator writes during doctor | Report invocation uses inline manifest JSON and omits `--allow-write`; tests snapshot registry/project paths and assert zero writes. |
| Mixed logs corrupt JSON | Report mode emits exactly one JSON document and suppresses ordinary progress logs; host rejects mixed stdout. |
| Malicious or buggy paths escape the project | Normalize and reject absolute, parent-escaping, duplicate, and undeclared-target paths before comparison. |
| Generator/report selection drift | Both modes call one selector/compiler path; tests compare their selected sets. |
| F4 remains latent | Workers tests cover overlays/includes/conditional includes, plugin dirs, and dotfile exclusion through the same report used by doctor. |
| Public-surface drift | No new export; run full touched-package doc/publish and measured corpus/assets gates anyway. |
| Evidence overstates durability | Treat gitignored receipts as local-only and commit reproducible commands plus exact outcomes. |

## PLAN-EVAL Handoff

The evaluator must decide whether the opt-in report protocol, strict advertised-capability failure,
third-party fallback, all-first-party adoption, 24-path ceiling, F4 closure, S7 red-before case, and
gate set are complete and proportionate. Implementation must not start until a separate session
posts `PLAN-EVAL: APPROVED` or this plan is revised for `CHANGES_REQUESTED`.
