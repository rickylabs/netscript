**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**

# PLAN-EVAL cycle 4 — orchestrator-1443-plugin-ai-next-canary--supervisor

- Plan evaluator session: `019fec5f-4805-7bc1-8e58-bcb6e048646f` (resumed cycle-1–3 evaluator) / 2026-08-10
- Generator: native Claude Opus 5 session; generator != evaluator
- Run: `orchestrator-1443-plugin-ai-next-canary--supervisor`
- Evaluated head: `fd3476a9d`
- Surface / archetype: `plugins/*` / ARCHETYPE-5; `packages/cli` / ARCHETYPE-6 + F-CLI-1…31; `packages/plugin` / ARCHETYPE-4
- Scope overlays: `SCOPE-frontend` N/A for the deliberately unmounted generated route; targeted generated-namespace checks remain in scope
- Pre-flight: `rtk git status --short --branch` returned `orchestrator/1443-plugin-ai-next-canary` with only the two pre-existing untracked brief files; `rtk git log --oneline -3` returned `fd3476a9d`, `a6febcdc6`, `e4bd9958a`.

## A. Cycle-3 findings disposition

| # | Cycle-3 finding | Disposition | v5 answer and independent source verification |
| --- | --- | --- | --- |
| 1 | Stale sibling-metadata/configured-module mechanism survived v4. | **ANSWERED** | D4a now distinguishes metadata-only loading from the real loader and requires the latter (`plan.md:139-152`); S4 explicitly asserts `loadRegisteredPlugins` (`:330`). Source confirms metadata loading never imports the module (`plugin-registry.ts:163-184`) while `resolvePluginManifest` dynamically imports it and rejects no-manifest modules (`:363-375`). No v5 decision or slice treats sibling metadata as satisfying the real loader. |
| 2 | #1445 box 4 had no owning doctor slice. | **PARTIALLY ANSWERED** | D7 check 2 and S8 now cover zero, multiple, and import-throwing modules (`plan.md:214-226,334,360`). The locked rule is not yet compatible with the runtime resolver: `resolveExportedPluginManifest` returns a manifest-shaped default immediately and does not reject an additional named manifest (`plugin-registry.ts:378-390`). S8 is restricted to `doctor/**`, but sharing/changing that private resolver or injecting an isolated import runner reaches outside that file set. |
| 3 | D1 named maintainer consumers without scheduling them. | **PARTIALLY ANSWERED** | S1 now lists `official-plugin-source.ts` and `copy-official-plugin.ts` and locks omission of the service leg (`plan.md:93-108,327`). Source confirms those files require and copy the three service fields (`official-plugin-source.ts:12-20,40-65,93-107,219-251`; `copy-official-plugin.ts:159-181`). The result then flows through two additional required-field consumers omitted from D1/S1: `SyncPluginCopyResult.serviceConfigKey/servicePort` (`sync-plugin.ts:32-52`) and `createOfficialPluginCopier`'s unconditional mapping (`official-plugin-copier.ts:11-25`). |
| 4 | D6 had inconsistent closure counts. | **PARTIALLY ANSWERED** | V5 consistently writes 5 items / 11 files / 13 registry dependencies (`plan.md:188-209,313,332`), and an evaluator `deno eval` over `resolveRegistryItems(freshUiRegistryManifest, ['markdown'])` confirmed those three counts. The same command found three CSS contributions, including `citation-chip.css`, and 14 final npm imports once `registry-deno-json.ts:6-8,26` adds unconditional `preact`; v5 lists only two CSS imports and calls the final `ai/deno.json` set 13. |
| 5 | Design/phase/PR surfaces and consumer-script ownership were stale. | **ANSWERED** | Design names v5's thirteen slices and S9 ownership (`worklog.md:49-53`); the phase registry names two issues, thirteen slices, and S8/S9 (`phase-registry.md:3-19`); the live PR body has both closing keywords and S1–S13; the live v5 phase comment exists (`gh pr view ... --jq ...` returned `1`). |
| 6 | JSR, tests, gates, and risks omitted five published plugin packages. | **ANSWERED** | V5 selects scoped tests and JSR audit for all six plugins (`plan.md:265-304`), and risk 8 covers local-source versus JSR packaging (`:317`). `jq -c '.publish' plugins/{ai,auth,sagas,streams,triggers,workers}/deno.json` confirms every package includes `src/**/*.ts`, which covers the planned generated stub sources. |
| 7 | Slice numbering and installed-set references were stale. | **ANSWERED** | Both issue coverage tables route full proof to S13 (`plan.md:341-362`); S12/S13 name the six-kind set (`:338-339`). No v5 occurrence says “all five,” ten slices, or twelve slices. |

### Cycle-3 failed Plan-Gate boxes disposition

| Cycle-3 failed box | Cycle-4 disposition | Evidence |
| --- | --- | --- |
| Research present and current | **NOT ANSWERED** | `research.md:1,134-176` remains #1443-only, calls the workers resource barrel the correct shape at `:86-88`, inventories no #1445 six-plugin manifest/import surface, and concludes only #1443. |
| Decisions locked | **PARTIALLY ANSWERED** | The prior textual contradictions are gone, but D1 omits two downstream maintainer result consumers; D6's final import/CSS contract is wrong; D7 conflicts with the runtime default-export resolver and leaves recovery/isolation undecided. |
| Open-decision sweep | **PARTIALLY ANSWERED** | `plan.md:251-263` identifies the decision classes, but marks the three unresolved items above resolved. |
| Commit slices | **PARTIALLY ANSWERED** | Thirteen ordered slices remain below 30 and each has a gate/files row, but S1 omits downstream result consumers, S6's exact gate cannot match registry output, and S8's file scope cannot implement a shared/recoverable resolver contract as written. |
| Risk register | **PARTIALLY ANSWERED** | V5 adds the D9 package/import-mode risk, but risk 4 repeats the incomplete D6 output and no risk covers executing configured modules inside the doctor process. |
| Gate set selected | **ANSWERED** | V5 applies the A4/A5/A6 matrix, F-CLI gates, all-six package gates, consumer validation, canonical E2E, and release proof (`plan.md:265-286`). |
| jsr-audit planned surface | **ANSWERED** | The planned published type, CLI behavior, AI output, and all six plugin packages are covered (`plan.md:288-304`), with publish includes verified above. |

## B. Checklist results — Plan v5

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | **FAIL** | `research.md:3-15` re-baselines #1443 against `2256a67bf`, but it predates owner rescope D-6: its configured-module conclusion says a workers-style resource barrel is correct (`:71-88`), its JSR scan covers AI only (`:134-146`), and its conclusion covers only #1443 (`:170-176`). No current research inventory supports #1445's six-plugin surface. |
| Decisions locked | **FAIL** | D1's “all owned” inventory (`plan.md:93-108`) stops before required `SyncPluginCopyResult` and copier-adapter fields (`sync-plugin.ts:32-52`; `official-plugin-copier.ts:11-25`). D6 lists 13 final npm imports and two CSS imports (`plan.md:200-208`), while the executable closure yields 13 registry deps + unconditional `preact` and also `citation-chip.css`. D7 declares multiple exports ambiguous (`:220-223`), but the runtime resolver accepts a manifest default without counting named values (`plugin-registry.ts:378-390`). |
| Open-decision sweep | **FAIL** | `plan.md:251-263` marks D1, D6, and D7 resolved. Implementation still must decide whether the doctor exactly reuses runtime semantics or changes the shared resolver, and how import execution is isolated/recovered; direct in-process `import()` cannot recover from termination or a hung/side-effecting configured module. Those choices change production files and tests. |
| Commit slices (<30, gate + files each) | **FAIL** | There are 13 ordered slices with named proof/gates/files (`plan.md:319-339`). S1's file column omits `sync-plugin.ts` and `official-plugin-copier.ts`; S6 names an exact final-output assertion contradicted by `registry-deno-json.ts:6-8,26`; S8 names only `doctor/**` although reuse/change of the private runtime resolver or a recoverable process boundary requires additional files. These slice gates cannot all pass as written. |
| Risk register | **FAIL** | Eight risks have mitigations (`plan.md:306-317`), including all-six JSR modes. Risk 4 repeats the incomplete D6 contract, and no row mitigates executing a configured plugin module inside `plugin doctor`, despite the existing metadata loader's explicit purpose of avoiding imports into the CLI process (`plugin-registry.ts:163-164`). |
| Gate set selected | **PASS** | Doctrine assigns `plugins/*` to A5, `plugin` to A4, and `cli` to A6 (`docs/architecture/doctrine/06-archetypes.md:348-380`). V5 selects universal F-1…19 as applicable, F-CLI-1…31, scoped tests/wrappers over all touched packages, consumer validation, `scaffold.runtime`, and post-publish proof (`plan.md:265-286`). `SCOPE-frontend` N/A is supported because the overlay's route/browser/state gates apply to mounted workflows (`SCOPE-frontend.md:20-28`), while route mounting is explicitly deferred and generated TSX compile coverage remains. |
| Deferred scope explicit | **PASS** | `plan.md:371-377` explicitly defers Fresh route mounting, gateway topology, R-0 node-modules friction, and doctor behavior beyond the three issue invariants; none removes an acceptance box. |
| jsr-audit surface scan (pkg/plugin) | **PASS** | `deno doc --filter PluginManifestProvider packages/plugin/mod.ts` renders the currently required public field, matching the planned published type change. `plan.md:288-304` names slow-type/doc/publish risks for plugin, CLI, AI, and all six plugin packages. Every affected plugin's `publish.include` contains `src/**/*.ts`; no new export is planned and AI remains without `./services`. |

## New-material verification

### D7 check 2

- Ordinary import rejection is catchable: `doctorPlugin` wraps an injected loader in `try/catch` (`doctor-plugin-use-case.ts:99-106`). Production composition does not inject that loader (`public-command-dependencies.ts:308-314`), so it currently uses metadata-only loading.
- The current runtime resolver is private and implements “default, otherwise sole named,” not “exactly one across all exports” (`plugin-registry.ts:378-390`). A doctor-only count duplicates and conflicts with it; changing or exporting the resolver extends S8 beyond `doctor/**`.
- Loading the configured module in the CLI process is not recoverable for every untrusted-module behavior. The source itself documents the metadata loader as avoiding plugin imports into the CLI process (`plugin-registry.ts:163-164`). V5 names `ProcessPort` in Design (`worklog.md:34-38`) but does not lock an isolated subprocess/worker protocol, timeout, result shape, or owning composition files.

### D4a additivity

| Plugin | Existing package manifest | Existing emitted barrel | Result after one re-export |
| --- | --- | --- | --- |
| AI | `aiPlugin` (`plugins/ai/src/public/mod.ts:33-75`) | `ai/ai.ts` exports runtime composition, not a manifest (`plugins/ai/src/adapter/resources/barrel/barrel.ts:26-39`) | Exactly one manifest-shaped export is achievable. |
| Auth | `authPlugin` (`plugins/auth/src/public/mod.ts:23-68`) | Auth-core contracts only (`plugins/auth/src/adapter/resources/barrel/barrel.stub.ts:28-41`) | Exactly one is achievable. |
| Sagas | `sagasPlugin` (`plugins/sagas/src/public/mod.ts:31-91`) | App saga/config or `export {}` | Exactly one is achievable. |
| Streams | `streamsPlugin` (`plugins/streams/src/public/mod.ts:38`) | App producer/schema or `export {}` | Exactly one is achievable. |
| Triggers | `triggersPlugin` (`plugins/triggers/src/public/mod.ts:28-90`) | App trigger exports or `export {}` | Exactly one is achievable. |
| Workers | `workersPlugin` (`plugins/workers/src/public/mod.ts:149`) | App job/task or `export {}` | Exactly one is achievable. |

No package lacks a manifest value and no current generated resource export has the `name` + `version` + `contributions` shape tested at `plugin-registry.ts:393-402`. One shared table-driven test is implementable without fixture-only production cases.

### S9 consumer-gate self-test

The red/green contract is sound. V5 requires a parameterized CLI entrypoint and defect-specific non-zero behavior (`plan.md:279,335`), labels `published-0.0.5-repro.sh` observational only (`:284-286`), and assigns the assertive script to S9. The self-test must verify the expected #1443/#1445 assertions caused the published run to fail, rather than accept an unrelated setup failure; that is implementation detail within S9's locked “per surviving defect” contract, not an open architecture decision.

### D1 service-less maintainer copy

Omitting the service leg is representable in `OfficialPluginSource`/`OfficialPluginCopyResult` only after their required fields are widened or shaped atomically (`official-plugin-source.ts:12-20,40-65`). `copyOfficialPlugin` currently returns all three unconditionally (`copy-official-plugin.ts:159-181`). It also breaks the downstream adapter contract unless S1 changes `SyncPluginCopyResult.serviceConfigKey/servicePort` (`sync-plugin.ts:32-52`) and the unconditional mapping (`official-plugin-copier.ts:11-25`). Existing fixtures encode service-bearing sources; S1 must add a service-less maintainer case while preserving those tests.

### Paper-over and rescope sweep

- V5 proposes no docs-only fix, skip, hardcoded host-side plugin branch, `any`, cast, lint suppression, deleted test, or fixture-only production exception. `rtk grep` found only the intentional statement that the observational script is never a gate.
- D9 remains one data-registry/shared-loader defect class. Thirteen slices are below the harness limit and no split boundary is required.

## Acceptance coverage — issue #1443

| # | Acceptance box | Planned slice(s) | Cycle-4 coverage verdict |
| --- | --- | --- | --- |
| 1 | Default AI installation emits no gateway/service/AppHost resource. | S1-S3; asserted S12; proven S13 | **COVERED** for the normal install path. The maintainer-copy omission defect is a D1 slice defect, not this box's default-install mechanism. |
| 2 | Every configured plugin path exists and exports a valid manifest. | S4, S10 | **COVERED** — all six package manifests exist and additive barrels are achievable. |
| 3 | `generate runtime-schemas` succeeds immediately after clean AI install. | S4, S5, S10; S12/S13 | **COVERED** structurally. |
| 4 | Generated AI files pass targeted Deno check, including Markdown and Preact. | S6, S7; S12/S13 | **PARTIAL** — the selected implementation path is viable, but S6's exact dependency/CSS assertion does not match resolver output. |
| 5 | Doctor reports missing modules and invalid executable entrypoints. | S5, S8, S9 | **PARTIAL** — cases are assigned, but the module-load semantics/recovery boundary is not locked consistently with the runtime resolver. |
| 6 | Regression tests cover absent `/services`, configured modules, and generated UI imports. | S1, S3, S4, S7, S10 | **PARTIAL** — module/UI tests inherit the D6/D7 contract defects. |
| 7 | Canonical `scaffold.runtime` installs AI and checks `ai/**`. | S12, S13 | **COVERED**. |

## Acceptance coverage — issue #1445

| # | Acceptance box | Planned slice(s) | Cycle-4 coverage verdict |
| --- | --- | --- | --- |
| 1 | Every first-party plugin emits a configured module exporting a valid `PluginManifest`. | S4, S10 | **COVERED** — each package already owns one manifest value and no barrel collision exists. |
| 2 | `generate runtime-schemas` succeeds after a clean install of each first-party plugin. | S10, S11; S12/S13 | **COVERED** structurally. |
| 3 | Each generated plugin namespace type-checks with all imports declared. | S7, S11 | **COVERED** structurally; both local-source and JSR branches are selected. |
| 4 | Doctor fails for a module that does not resolve or export a manifest. | S8 | **PARTIAL** — all negative cases are named, but exact runtime semantics and recoverable execution remain unresolved. |
| 5 | Regression tests assert the loader contract per first-party plugin. | S10 | **COVERED** — the table-driven form is achievable. |
| 6 | `scaffold.runtime` proves the contract for every installed plugin. | S12, S13 | **COVERED** — the six-kind set is named. |

## Open-decision sweep (evaluator-run)

1. **Must resolve now:** define D7 check 2 against the real runtime contract: either reuse a shared resolver with “default, otherwise sole named” semantics or deliberately change the shared loader and its tests. Lock a recoverable execution boundary for import throw/termination/hang and assign every composition/resolver file to S8.
2. **Must resolve now:** extend D1/S1 through `SyncPluginCopyResult` and `createOfficialPluginCopier`, with a service-less maintainer sync/copy test and unchanged service-bearing fixtures.
3. **Must resolve now:** correct D6/S6 to distinguish 13 registry-declared dependencies from 14 final npm imports including `preact`, and include `citation-chip.css` in the CSS assertion.
4. **Must resolve now:** update `research.md` for the owner-authorized #1445/all-six rescope so the Plan-Gate has current research rather than plan-only conclusions.

## Findings

1. **Research is not current for the owner-authorized scope.** `research.md:1,134-176` remains #1443/AI-only and its line 86-88 workers comparison predates the proven loader contract. **Required fix:** re-baseline research for #1445, inventory all six manifest/barrel/import/publish surfaces, and record the verified real-loader and local/JSR facts before implementation.
2. **The service-less maintainer representation stops mid-chain.** D1/S1 includes the source adapter and copy use case (`plan.md:93-108,327`) but omits required downstream fields at `sync-plugin.ts:32-52` and their unconditional adapter mapping at `official-plugin-copier.ts:11-25`. **Required fix:** add both files and their tests to S1 and lock the optional/absent result shape through the public maintainer result.
3. **D6's “computed contract” is not the actual final output.** `plan.md:200-208` names 13 final imports and omits `citation-chip.css`; `resolveRegistryItems` plus `mergeDenoJsonImports` yields 13 registry dependencies, unconditional `preact` (14 final), and CSS for citation-chip, markdown, and KaTeX (`registry.manifest.ts:451-470,633-678`; `registry-deno-json.ts:6-8,26`). **Required fix:** correct D6, risk 4, and S6's exact assertions to the full final set.
4. **D7 check 2 conflicts with the runtime resolver and lacks a recoverable execution contract.** V5 treats any multiple manifest-shaped exports as ambiguous (`plan.md:220-223`), while `resolveExportedPluginManifest` accepts a default before counting named values (`plugin-registry.ts:378-390`). A doctor-local predicate duplicates runtime truth, and in-process import cannot recover from termination/hang. **Required fix:** lock shared resolver semantics, choose and specify an isolated/recoverable runner with timeout/error mapping, and add the resolver/composition files and parity tests to S8.

## Verdict

`FAIL_PLAN`

### Required fixes

1. Re-baseline `research.md` for #1445 and all six published plugin surfaces.
2. Carry D1/S1 through the maintainer sync result and copier adapter.
3. Correct D6/S6 to 13 registry dependencies, 14 final imports including `preact`, and all three CSS contributions.
4. Make D7 share runtime manifest-resolution semantics and define recoverable module execution with complete S8 file ownership.

VERDICT: FAIL_PLAN
