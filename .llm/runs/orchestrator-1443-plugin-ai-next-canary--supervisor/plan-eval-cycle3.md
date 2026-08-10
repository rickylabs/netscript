**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**

# PLAN-EVAL cycle 3 — orchestrator-1443-plugin-ai-next-canary--supervisor

- Plan evaluator session: `019fec5f-4805-7bc1-8e58-bcb6e048646f` (resumed cycle-1/cycle-2 evaluator) / 2026-08-10
- Generator session: Claude Opus 5 `session_01Xh7NCnRBhsGn4kKpurkDY1`; generator != evaluator
- Run: `orchestrator-1443-plugin-ai-next-canary--supervisor`
- Evaluated head: `a6febcdc614d585d2628f170106adcb96a4ffca1`
- Surface / archetype: `plugins/*` / ARCHETYPE-5; `packages/cli` / ARCHETYPE-6 + F-CLI-1...31; `packages/plugin` / ARCHETYPE-4
- Scope overlays: `SCOPE-frontend` N/A for the deliberately unmounted generated surface; targeted TS/TSX consumer checks retained
- Rescope authority: `drift.md:70-88` records the owner decision to include all six first-party plugins and #1445; the PLAN-EVAL loop is reset for v4.

## A. Cycle-2 findings disposition

Cycle 2 contains six numbered implementation findings plus a seventh required action (owner escalation after the exhausted loop). All seven are dispositioned here.

| # | Cycle-2 finding / required action | Disposition | v4 answer and independent source verification |
| --- | --- | --- | --- |
| 1 | `ai/mod.ts` must export a real `PluginManifest`; sibling metadata is not enough. | **PARTIALLY ANSWERED** | D4a is corrected at `plan.md:123-160`: it names the two loaders, the empirical rejection, the `@netscript/plugin-ai` re-export, and a real `loadRegisteredPlugins` assertion. Source confirms `loadRegisteredPlugins` calls `resolvePluginManifest` (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:123-160,363-390`) while metadata-only loading is separate (`:163-184`). However, v4 contradicts itself: the disposition and open sweep restore the disproven sibling-metadata mechanism (`plan.md:268-285`), and S4 again says the registry loads through the metadata path (`:355`). |
| 2 | D1 omitted the maintainer official-source consumer. | **PARTIALLY ANSWERED** | D1 now inventories `packages/cli/src/maintainer/adapters/official-plugin-source.ts:87-107,212-251` (`plan.md:84-91`). Source confirms those interfaces and copy results require the three service fields (`official-plugin-source.ts:93-107,219-251`). S1's file list still names only `manifest.ts`, `install-plugin.ts`, and tests (`plan.md:352`); it does not assign `official-plugin-source.ts`, `copy-official-plugin.ts:174-176`, their required result types, or copy/sync tests to a slice. |
| 3 | D6 understated the recursive registry closure. | **PARTIALLY ANSWERED** | D6's table now correctly locks five items, eleven files, and thirteen registry npm packages (`plan.md:218-242`). Source confirms `markdown -> theme-seed + citation-chip`, `theme-seed -> cn + public-types`, and `cn -> clsx + tailwind-merge` (`packages/fresh-ui/registry.manifest.ts:15-35,142-164,451-470,633-678`); recursion and dependency merging are at `registry.ts:216-258` and `registry-deno-json.ts:17-44`. But the open sweep says the exact transitive file lists are safe to defer (`plan.md:288-289`), S6 still proves eleven npm dependencies (`:357`), and risk 4 still states eleven (`:341`). |
| 4 | D4b needed representative cross-plugin coverage and a locked service-less list value. | **PARTIALLY ANSWERED** | D4b locks the list value to `-` and names service-bearing auth/streams plus reference-bearing workers/triggers (`plan.md:183-207`). Source confirms auth/streams are `category: plugin` and workers/triggers carry dependencies/references in their checked-in manifests. S5 nevertheless limits its stated proof to service-less AI and workers (`plan.md:356`), so the slice table does not carry D4b's required auth/streams/triggers matrix. |
| 5 | S2 omitted `workspace-mutator.ts`; the observational 0.0.5 script was not a verdict gate. | **PARTIALLY ANSWERED** | S2 now includes `workspace-mutator.ts:319-326` (`plan.md:353`). The gate set replaces the old script with parameterized, assertive `evidence/consumer-verify.sh` and accurately labels the old script observational (`plan.md:309`). But no slice's Files column owns creation of `evidence/consumer-verify.sh`; S6/S7 call only an unnamed "consumer repro script" (`:357-358`) and S11 calls the new script without assigning its file (`:362`). |
| 6 | PR/run authoritative surfaces were stale. | **PARTIALLY ANSWERED** | Live PR body now names both closing keywords, twelve slices, the three archetypes, the N/A overlay rationale, and the assertive consumer gate (`gh pr view 1444 --json body,...`, head `a6febcdc6`). `worklog.md:49-53` still says ten slices, `phase-registry.md:3-15` still says one issue and nine slices, and `gh pr view 1444 --json comments --jq '[.comments[] | select(.body | contains("[PHASE: PLAN] [REVISION: v4]"))] | length'` returned `0`. |
| 7 | Escalate after cycle 2 before implementation. | **ANSWERED** | `escalations/E-1-configured-module-contract.md:1-69` records the question and evidence; `drift.md:70-88` records the owner's shared-contract decision and loop reset; live issue #1445 exists with six acceptance boxes and PR #1444 contains `Closes #1443` and `Closes #1445`. No implementation commit is present after the plan head. |

### Cycle-2 failed Plan-Gate boxes disposition

| Cycle-2 failed box | Cycle-3 disposition | Evidence |
| --- | --- | --- |
| Decisions locked | **PARTIALLY ANSWERED** | D4a and D6 are corrected in their decision sections, but contradicted by `plan.md:268-289,355,357`; D7 does not define the #1445 case where a module exists but exports no manifest (`plan.md:248-258`). |
| Open-decision sweep | **NOT ANSWERED** | It marks the disproven sibling-metadata rule resolved and exact registry files safe to defer (`plan.md:280-291`), while the doctor export-validation mechanism and expanded JSR surface are absent. Each changes slice code/tests if deferred. |
| Commit slices | **PARTIALLY ANSWERED** | S2 is repaired and twelve slices remain under 30, but S4/S6 contradict locked decisions, S8 omits the no-manifest doctor case, the new script has no owning slice, and the Design checkpoint still points to ten slices (`worklog.md:49-53`). |
| Risk register | **PARTIALLY ANSWERED** | Existing D1/D4b/D6 risks remain, but risk 4 retains eleven dependencies (`plan.md:341`) and v4 adds no risks/mitigations for five additional published plugin scaffold surfaces, connector-alias resolution across local/JSR modes, or sole-manifest ambiguity. |

## B. Checklist results — Plan v4 on its wider scope

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | **FAIL** | Pre-flight returned branch `orchestrator/1443-plugin-ai-next-canary`, head `a6febcdc6`, baseline `2256a67bf...`. `research.md:3-15` re-baselines #1443 and 0.0.5, but it predates the rescope: it calls workers' barrel the correct AI shape (`research.md:86-88`), inventories no other connector barrel/import surface, and concludes only #1443 (`:170-176`). D9/#1445 facts live only in the escalation/plan; `research.md` is not current for the new scope. |
| Decisions locked | **FAIL** | D4a correctly requires a manifest (`plan.md:123-160`) but `plan.md:272,285,355` says sibling metadata is sufficient. D6 locks 13 dependencies (`:234-238`) but S6/risk 4 say 11 (`:341,357`). D7 checks existence only (`:248-258`) although #1445 box 4 also requires failure when an existing module exports no manifest. |
| Open-decision sweep | **FAIL** | `plan.md:280-291` declares no rework-sensitive decisions open while relying on the rejected loader mechanism, deferring already-known D6 files, and omitting how doctor validates an existing non-manifest module. The expanded five-plugin JSR/publish gate ownership is also undecided. |
| Commit slices (<30, gate + files each) | **FAIL** | Twelve slices are under 30 (`plan.md:346-363`), but S4's named metadata-path proof conflicts with D4a/source; S6's eleven-dependency proof conflicts with D6; S8 has no existing-file/no-manifest case; no slice owns `consumer-verify.sh`; S5 omits its locked representative matrix; `worklog.md:49-53` still defines ten slices. |
| Risk register | **FAIL** | `plan.md:334-344` has no D9 risks for additive barrel exports, local-source versus published connector alias resolution, or JSR packaging of five newly changed plugins, and its D6 mitigation is numerically wrong at line 341. |
| Gate set selected | **FAIL** | Archetypes and universal/F-CLI gates are correctly selected (`plan.md:293-314`; doctrine assignment at `docs/architecture/doctrine/06-archetypes.md:368-380`; matrix at `.llm/harness/gates/archetype-gate-matrix.md:20-76`). `SCOPE-frontend` N/A is supported by `.llm/harness/archetypes/SCOPE-frontend.md:20-28` because no mounted workflow changes. The wider D9 gate set is incomplete: targeted tests and JSR audit name only `packages/plugin`, `packages/cli`, and `plugins/ai` (`plan.md:303,307,316-332`), omitting the five published connectors changed by S10. |
| Deferred scope explicit | **PASS** | `plan.md:395-401` explicitly defers route mounting, gateway topology, R-0 node-modules friction, and broader doctor work. None removes either issue's acceptance contract; the no-manifest doctor case is not "broader doctor" because #1445 explicitly requires it. |
| jsr-audit surface scan (pkg/plugin) | **FAIL** | `deno doc --filter PluginManifestProvider packages/plugin/mod.ts` confirms the currently required published field, and `plan.md:316-332` covers the planned type change, CLI, and AI publish include. S10 changes published scaffold behavior in `plugins/{workers,sagas,triggers,streams,auth}/src/**`, but these five packages are absent from the rubric and gate set. Their manifests do include `src/**/*.ts` (`jq '.publish' plugins/<name>/deno.json`), so packaging is feasible; it is not planned or proven. |

## Open-decision sweep (evaluator-run)

1. **Must resolve now:** make every v4 surface use the real configured-module contract: `loadRegisteredPlugins` imports the module and requires a default or sole named manifest. Remove the stale sibling-metadata disposition/open-sweep/S4 text.
2. **Must resolve now:** define S8's behavior and test when the configured path exists but exports zero or multiple manifest-shaped values. File existence alone does not close #1445 box 4.
3. **Must resolve now:** make D6, risk 4, S6, and its assertions agree on five items, eleven files, and thirteen registry-declared npm packages (plus the resolver's unconditional `preact` candidate).
4. **Must resolve now:** assign all maintainer official-source/copy changes required by D1 to S1 or another explicit slice.
5. **Must resolve now:** assign `evidence/consumer-verify.sh` to a slice and lock the invocations/defect assertions used by S6, S7, and S11.
6. **Must resolve now:** apply jsr-audit and package gates to the five additional published connector packages changed by D9.

## D9 source verification

| Plugin | Existing package manifest value | Generated barrel evidence | Additive result |
| --- | --- | --- | --- |
| AI | `aiPlugin` (`plugins/ai/src/public/mod.ts:33-75`; root re-export `plugins/ai/mod.ts:7-15`) | Existing composition is `ai/ai.ts`; no generated `ai/mod.ts` yet (`plugins/ai/src/adapter/resources/barrel/barrel.ts:26-39`). | A new `ai/mod.ts` can re-export `aiPlugin`; no current manifest-shaped export conflicts. |
| Workers | `workersPlugin` (`plugins/workers/src/public/mod.ts:149`; root `mod.ts:7`) | Sample/empty barrels emit app resources or `export {}` (`plugins/workers/src/adapter/resources/barrel/barrel.ts:37-59`). | Sole manifest re-export is additive. |
| Sagas | `sagasPlugin` (`plugins/sagas/src/public/mod.ts:91`; root `mod.ts:7-13`) | Sample/empty barrels emit app resources or `export {}` (`plugins/sagas/src/adapter/resources/barrel/barrel.ts:33-57`). | Sole manifest re-export is additive. |
| Triggers | `triggersPlugin` (`plugins/triggers/src/public/mod.ts:90`; root `mod.ts:7-18`) | Sample/empty barrels emit app resources or `export {}` (`plugins/triggers/src/adapter/resources/barrel/barrel.ts:50-75`). | Sole manifest re-export is additive. |
| Streams | `streamsPlugin` (`plugins/streams/src/public/mod.ts:38`; root `mod.ts:14-44`) | Sample/empty barrels emit app resources or `export {}` (`plugins/streams/src/adapter/resources/barrel/barrel.ts:33-57`). | Sole manifest re-export is additive. |
| Auth | `authPlugin` (`plugins/auth/src/public/mod.ts:68`; root `mod.ts:7-13`) | Barrel re-exports auth-core contracts only (`plugins/auth/src/adapter/resources/barrel/barrel.stub.ts:28-41`). | Sole manifest re-export is additive. |

`resolveExportedPluginManifest` accepts a manifest-shaped default first, otherwise exactly one manifest-shaped value (`plugin-registry.ts:378-390`). None of the existing generated exports has the `name` + `version` + `contributions` shape tested at `:393-402`; adding the connector manifest does not create ambiguity. A shared table-driven test is implementable by enumerating plugin kind, expected connector specifier, emitted module, and expected manifest name; it does not require production conditionals or six fixture-only code paths.

`PLUGIN_KIND_SOURCE_IMPORTS` / `PLUGIN_KIND_ROOT_IMPORTS` is the correct host seam (`workspace-mutator.ts:64-140,377-428`). Published projects need connector-package aliases for the new re-exports. Local-source projects deliberately suppress kind-source JSR pins (`:387-392`) and resolve copied connector packages as workspace members (`packages/cli/src/kernel/constants/scaffold/scaffold-workspace-packages.ts:36-44` plus the root `plugins/*` member). The branch changes expected mappings, not the chosen seam.

## Acceptance coverage — issue #1443

| # | Acceptance box | Planned slice(s) | Cycle-3 coverage verdict |
| --- | --- | --- | --- |
| 1 | Default AI install emits no gateway/service/AppHost resource. | S1-S3, S9, S12 | **COVERED** — S2 now owns both synthesis sites and `workspace-mutator.ts`. |
| 2 | Every configured plugin path exists and exports a valid manifest. | S4, S5 | **PARTIAL** — D4a has the right export, but S4 still names the wrong metadata-path proof. |
| 3 | `generate runtime-schemas` succeeds immediately after clean AI install. | S4, S5, S9, S12 | **PARTIAL** — the E2E gate is selected, but S4's contradictory loader contract must be fixed first. |
| 4 | Generated AI files pass targeted Deno check, including Markdown and Preact. | S6, S7, S9, S12 | **PARTIAL** — ordering is correct and non-app-root registry writing is valid, but S6 still asserts 11 rather than 13 registry npm dependencies. |
| 5 | Doctor reports missing modules and invalid executable entrypoints. | S5, S8, S9 | **COVERED** for #1443's missing-path and invalid-entrypoint cases; service-less list value is locked to `-`. |
| 6 | Regression tests cover absent `/services`, configured modules, and generated UI imports. | S1-S4, S6-S7 | **PARTIAL** — configured-module and UI assertions inherit the S4/S6 contradictions. |
| 7 | Canonical `scaffold.runtime` installs plugin-AI and checks `ai/**`. | S9, S12 | **COVERED structurally** — `capability-suites.ts:61-87` already installs all six plugin kinds; S9 registers the missing gates and S12 runs the canonical command. `plan.md:386` incorrectly says proven by S10 and must be remapped to S12. |

## Acceptance coverage — issue #1445

| # | Acceptance box | Planned slice(s) | Cycle-3 coverage verdict |
| --- | --- | --- | --- |
| 1 | Every first-party plugin emits a configured module exporting a valid `PluginManifest`. | S4, S10 | **PARTIAL** — every connector owns a usable manifest and additive emission is feasible, but S4 retains the wrong loader wording. |
| 2 | `generate runtime-schemas` succeeds after clean install of each first-party plugin. | S9-S12 | **COVERED structurally** once S4 is corrected; the canonical suite installs worker, saga, trigger, stream, auth, and AI (`capability-suites.ts:61-71`). |
| 3 | Each generated plugin namespace type-checks with all imports declared. | S11, S12 | **COVERED structurally** — the per-kind import registry is the correct seam for both source modes. |
| 4 | Doctor fails for a module that does not resolve or does not export a manifest. | S8 | **NOT COVERED** — D7/S8 test only a missing configured file and an unresolvable service entrypoint (`plan.md:248-258,359`); no existing-file/zero-manifest or ambiguous-manifest check is planned. |
| 5 | Regression tests assert the loader contract per first-party plugin. | S10 | **COVERED structurally** — one table-driven real-loader test is achievable and avoids production special cases. |
| 6 | `scaffold.runtime` proves the contract for every plugin it installs. | S9, S12 | **COVERED structurally** — the suite installs all six kinds; replace the ambiguous "all five plugins" wording at `plan.md:363` with the exact six-kind set. |

Acceptance box with no closing slice: **#1445 box 4**.

## Findings

1. **The configured-module decision is internally contradictory.** D4a correctly requires a real manifest, while `plan.md:272,285,355` restores the empirically disproven sibling-metadata/metadata-path rule. **Required fix:** delete the stale mechanism, make S4 explicitly call `loadRegisteredPlugins`, and update #1443 boxes 2/3/6 mappings to the real loader.
2. **#1445's doctor export-validation acceptance box has no implementation slice.** D7/S8 checks a missing file but not an existing module with zero or multiple manifest-shaped exports (`plan.md:248-258,359`; issue #1445 box 4). **Required fix:** lock a plugin-agnostic load/export validation rule, add positive and zero/multiple-manifest negative tests, and assign its files/gate to S8.
3. **D1 names the maintainer consumer but does not schedule its change.** Required service fields remain in `official-plugin-source.ts:93-107,219-251` and flow through `copy-official-plugin.ts:174-176`, while S1 omits those files (`plan.md:352`). **Required fix:** add the adapter/result/copy consumers and tests to S1 (or a new ordered slice) and lock the service-less official-source representation.
4. **D6 remains split between two contracts.** The locked decision says 13 dependencies, but the open sweep defers known files and S6/risk 4 say 11 (`plan.md:234-238,288-289,341,357`). **Required fix:** use the five-item/eleven-file/thirteen-package contract everywhere and assert resolved items, files, CSS imports, and final `ai/deno.json` imports.
5. **The Design and phase surfaces do not describe v4.** `worklog.md:49-53` says ten slices; `phase-registry.md:3-15` says one issue/nine slices; no `[PHASE: PLAN] [REVISION: v4]` comment exists; `consumer-verify.sh` has no owning slice. **Required fix:** synchronize Design, phase registry, v4 PLAN comment, slice groups/dependencies, and assign the new script file before implementation.
6. **The wider published-plugin surface is absent from jsr-audit and the risk/gate set.** S10 changes five published connectors, but `plan.md:303,307,316-332` audits only plugin/CLI/AI and `:334-344` has no D9 packaging/import-mode risk. **Required fix:** add workers/sagas/triggers/streams/auth to scoped tests, publish dry-run/jsr-audit evidence, and risk mitigations; retain the verified `src/**/*.ts` publish coverage and both local-source/JSR consumer branches.
7. **Acceptance/slice references retain pre-rescope numbering.** `plan.md:370` routes the full-install runtime-schema proof through S9 rather than final S12, `:386` says S10 proves #1443 E2E, and S12 says "all five" although the canonical suite installs six kinds. **Required fix:** map all end-to-end proof to S12 and name the exact installed set.

## Paper-over and rescope sweep

- No v4 decision proposes `any`, casts, lint suppressions, deleted/skipped tests, or host-side plugin-name conditionals. The per-kind import maps are data registries, not conditional coupling.
- A shared table-driven test is achievable because every connector already exports one manifest value and every scaffolder has an emitted-module surface; no fixture-only production exception is required.
- The rescope is not too large for one PR: the shared loader/import contract is one defect class, the canonical suite already installs all six kinds, and twelve ordered slices remain below the harness limit. No split boundary is required.

## Verdict

`FAIL_PLAN`

### Required fixes

1. Resolve the D4a/S4/open-sweep contradiction and use the real loader everywhere.
2. Add the missing existing-module/no-manifest doctor contract for #1445 box 4.
3. Schedule D1's maintainer official-source/copy consumers and tests.
4. Make D6/S6/risk/open-sweep consistently assert 5 items, 11 files, and 13 registry npm dependencies.
5. Synchronize research, Design, phase registry, v4 PLAN comment, slice mappings, and consumer-script ownership.
6. Extend jsr-audit, package gates, and risks to all five additional published connectors.

VERDICT: FAIL_PLAN
