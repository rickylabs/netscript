**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**

# PLAN-EVAL cycle 2 — orchestrator-1443-plugin-ai-next-canary--supervisor

- Plan evaluator session: `019fec5f-4805-7bc1-8e58-bcb6e048646f` (resumed cycle-1 evaluator) / 2026-08-10
- Generator session: Claude Opus 5 `session_01Xh7NCnRBhsGn4kKpurkDY1`; generator ≠ evaluator
- Run: `orchestrator-1443-plugin-ai-next-canary--supervisor`
- Evaluated head: `42606724f69d57ca7731b775ef03c104b7f4a226`
- Surface / archetype: `plugins/ai` / ARCHETYPE-5; `packages/cli` / ARCHETYPE-6 + F-CLI-1…31; `packages/plugin` / ARCHETYPE-4
- Scope overlays: `SCOPE-frontend` N/A for this unmounted generated surface; targeted TS/TSX consumer checks retained

## A. Cycle-1 findings disposition

| # | Cycle-1 finding | Disposition | v2 answer and independent source verification |
| --- | --- | --- | --- |
| 1 | Generated `ai/mod.ts` must export a `PluginManifest`. | **NOT ANSWERED — cycle 1 was right; v2 is wrong.** | V2 D4a and its disposition table (`plan.md:102-117,191-196`) claim `resolveScaffoldPluginMetadata` returns before `resolvePluginManifest`. That control flow belongs only to `loadRegisteredPluginMetadata` (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:163-184`). `loadRegisteredPlugins` instead calls `resolvePluginConfigSnapshot`, which imports every configured module through `resolvePluginManifest` (`plugin-registry.ts:123-148,363-403`). Runtime-schema generation calls `loadRegisteredPlugins` (`packages/cli/src/public/features/root/public-command-dependencies.ts:329-340`). A workers-style barrel with no manifest export is therefore rejected. |
| 2 | D1 was source-incompatible and admitted partial service metadata. | **PARTIALLY ANSWERED.** | V2 makes the four fields atomic, specifies `undefined -> null`, and puts the normalizer in S1 (`plan.md:51-74,275`). A refinement of the existing strict object is expressible at the annotated `PluginInstallerManifestSchema` boundary (`packages/plugin/src/protocol/manifest.ts:195-230,269-283`) without a new export or inferred slow type. The inventory is incomplete: `packages/cli/src/maintainer/adapters/official-plugin-source.ts:87-107,212-251` independently models and consumes all three `officialSource` service fields as required. Removing them from AI produces undefined `OfficialPluginSource` values in local official-source discovery/copy unless this consumer is changed and tested. |
| 3 | D2/D4 broke identity, list, doctor, reconciliation, and duplicate-install detection. | **PARTIALLY ANSWERED.** | D4b names configured-module-derived workdir, a config registration sentinel, and config-derived reconciliation keys (`plan.md:118-134`), and S5 names list/doctor/reinstall tests (`:279`). The basic direction matches `plugin-registry.ts:220-268`, `plan-plugin-install.ts:120-156`, and `plugin-reference-reconciler.ts:47-58,104-180`. The blast test covers only workers and AI. It does not cover a service-bearing `category: plugin` manifest (auth/streams) or dependency/reference-bearing reconciliation (workers/triggers depend on streams; `plugins/workers/scaffold.plugin.json:49-70`, `plugins/triggers/scaffold.plugin.json:42-53`). V2 also never locks the service-less list value even though the current fallback labels `provider.defaultEntrypoint` as a service (`plugin-registry.ts:230-256`; `list-plugins-command.ts:45-61`). |
| 4 | Full `ai/**` check ran before Markdown existed. | **ANSWERED.** | S6 installs Markdown before S7 performs the full namespace check (`plan.md:280-281`). The original ordering defect is removed. Separate S6 gate defects are recorded below. |
| 5 | Archetype/gate matrix was incomplete. | **ANSWERED.** | V2 selects ARCHETYPE-5, ARCHETYPE-6 + F-CLI-1…31, and ARCHETYPE-4 (`plan.md:12-26`), matching doctrine assignments (`docs/architecture/doctrine/06-archetypes.md:368-380`). `plan.md:216-237` selects universal/static/consumer/quality gates and records `scaffold.runtime` plus post-publish `e2e-cli-prod`, matching `.llm/harness/gates/archetype-gate-matrix.md:20-46,60-76` and `release-gates.md:31-40`. The `SCOPE-frontend` N/A rationale is sound: #1443 changes placement/configuration of an unmounted generated TSX surface, not a route or browser workflow; the targeted contract/type-check gate covers the acceptance requirement. |
| 6 | jsr-audit omitted `packages/cli`. | **ANSWERED.** | `plan.md:239-255` now scans `packages/plugin`, `packages/cli`, and `plugins/ai`; selects full-export doc-lint, dry-run, publish include, and the exact-canary `e2e-cli-prod` authority. |
| 7 | D6 understated the registry-emitted surface. | **PARTIALLY ANSWERED.** | V2 correctly records Markdown's three direct files, direct registry dependencies, styles aggregator, and eleven Markdown npm dependencies (`plan.md:145-169`). It still calls this contract exact while deferring dependency file lists (`:212`) and misses recursive closure: `theme-seed` depends on `cn` and `public-types` (`packages/fresh-ui/registry.manifest.ts:142-164`); `cn` contributes `clsx` and `tailwind-merge` (`:15-35`); `citation-chip` contributes two files (`:451-470`). `resolveRegistryItems` recursively includes all of them (`packages/cli/src/kernel/application/ui/registry.ts:216-258`) and `mergeDenoJsonImports` merges dependencies from every resolved item (`registry-deno-json.ts:17-44`). The planned eleven-dependency assertion is wrong. |

## Cycle-1 failed Plan-Gate boxes disposition

Cycle 1's artifact records **six** failed boxes, not five: Decisions, Open-decision sweep, Commit slices, Risk register, Gate set, and jsr-audit (`plan-eval.md:15-21`).

| Cycle-1 failed box | Disposition in v2 | Evidence |
| --- | --- | --- |
| Decisions locked | **PARTIALLY ANSWERED** | D1/D2/D4b/D5 are more specific, but D4a is based on the wrong loader and D6's locked closure is false (`plan.md:49-189`; source above). |
| Open-decision sweep | **NOT ANSWERED** | `plan.md:203-214` declares no rework-sensitive decision open while manifest-export, maintainer service-less source-copy behavior, service-less list shape, and recursive registry closure remain unresolved. |
| Commit slices | **PARTIALLY ANSWERED** | Ordering of Markdown/full check is fixed, but S2 omits the required `workspace-mutator.ts` change, S4 cannot pass its loader test, and S6's expected set/gate is invalid (`plan.md:269-284`). |
| Risk register | **PARTIALLY ANSWERED** | V2 adds public-type, D4b, and registry risks, but its mitigations inherit the incomplete D1 inventory, insufficient D4b matrix, and incorrect D6 dependency count (`plan.md:257-267`). |
| Gate set selected | **ANSWERED** | `plan.md:216-237`; archetype and release-gate sources cited above. |
| jsr-audit | **ANSWERED** | `plan.md:239-255`; all three published surfaces and the post-publish authority are named. |

## B. Checklist results — Plan v2 on its own merits

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | Pre-flight: branch `orchestrator/1443-plugin-ai-next-canary`, head `42606724f`, baseline `2256a67bf`. `research.md:3-15` re-baselines published 0.0.5 and #260; `research.md:71-88` reproduces the missing module. Live `rtk gh issue view 1443 --repo rickylabs/netscript --json ...` returned OPEN, seven acceptance boxes, P0 labels, milestone `0.0.6`. The load-bearing loader finding was re-read directly and overturns v2, not the evidence currency. |
| Decisions locked | FAIL | D4a is not implementable as written because it confuses `loadRegisteredPluginMetadata` with `loadRegisteredPlugins` (`plugin-registry.ts:123-184,363-403`). D1 omits the maintainer official-source consumer (`official-plugin-source.ts:87-107,212-251`). D6's exact closure omits `cn`, `public-types`, two npm dependencies, and their emitted files (`registry.manifest.ts:15-35,142-164,451-470,633-678`). |
| Open-decision sweep | FAIL | Rework-sensitive decisions remain: what valid manifest `ai/mod.ts` exports; how local official-source discovery represents a service-less first-party plugin; the exact service-less `plugin list` value; and the complete registry closure/assertion. `plan.md:203-214` marks these resolved or safe-to-defer. |
| Commit slices (< 30, gate + files each) | FAIL | Ten slices are ordered and under 30, but their proofs/files are not valid. S2 promises no appsettings entry while its file list omits `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts`, where the unconditional insertion occurs at `:319-326`. S4's loader test must fail. S6 asserts the wrong dependency set. Its consumer script is not a verdict source: `evidence/published-0.0.5-repro.sh:6` hardcodes JSR 0.0.5, and `:45-46` ends with a successful `echo`, so it cannot prove the claimed local-source result or fail on a defect. |
| Risk register | FAIL | Risk 2 does not cover the maintainer source-copy consumer; risk 3's workers+AI test matrix misses service-bearing plugin-category and dependency-reference shapes; risk 4 locks a source-disprovable eleven-dependency contract (`plan.md:257-267`). |
| Gate set selected | PASS | Correct archetypes and universal/F-CLI gates are selected at `plan.md:216-237`; scoped wrappers, `quality:scan`, `arch:check`, full-export doc-lint, publish dry-run, canonical one-pass `scaffold.runtime`, and exact-canary `e2e-cli-prod` are present. `SCOPE-frontend` N/A is supported by `SCOPE-frontend.md:20-28`: its route/browser/state/responsive gates require a mounted workflow, which this issue explicitly defers; the contract/type-check requirement remains selected. |
| Deferred scope explicit | PASS | `plan.md:298-311` explicitly defers route mounting, gateway topology, R-0 node-modules friction, and broader doctor checks. None is required by #1443's seven boxes. |
| jsr-audit surface scan (pkg/plugin) | PASS | `plan.md:239-255` covers `packages/plugin`, `packages/cli`, and `plugins/ai`, identifies the public type change, no-slow-type bar, full export-map doc-lint, `publish.include`, embedded registry content, and post-publish exact-canary verification. The implementation-plan defects above do not erase that the rubric itself is selected. |

## Open-decision sweep (evaluator-run)

1. **Must resolve now:** the actual manifest export from `ai/mod.ts`. Sibling installer metadata is not read by `loadRegisteredPlugins`; deferring the export changes S4 and every runtime-schema/E2E proof.
2. **Must resolve now:** service-less behavior in `packages/cli/src/maintainer/adapters/official-plugin-source.ts`. Its required local interfaces and copy results consume the removed fields; deferring changes S1's consumer set and official copy-mode validation.
3. **Must resolve now:** service-less metadata/list semantics. Remove `defaultEntrypoint` as a service fallback and lock the list value (normally `-`) so S5 has an exact assertion.
4. **Must resolve now:** the full `markdown` registry closure. It is `cn`, `public-types`, `theme-seed`, `citation-chip`, `markdown`; final target files include those items' files, and registry-declared npm dependencies are the eleven Markdown packages plus `clsx` and `tailwind-merge` (with `preact` also always considered by `mergeDenoJsonImports`).
5. **Must resolve now:** a trustworthy local-source consumer repro command. The preserved 0.0.5 evidence script is observational and always exits zero; it cannot serve as S6/S7's named gate without parameterization and assertions.

## Acceptance coverage — issue #1443

| # | Acceptance box | Planned slice(s) | Cycle-2 coverage verdict |
| --- | --- | --- | --- |
| 1 | Default AI installation emits no gateway/service/AppHost resource. | S1-S3, S9-S10 | PARTIAL — D1/D2 describe the outcome, but S2 omits the `workspace-mutator.ts:319-326` branch that actually writes `NetScript.Plugins[key]`. |
| 2 | Every configured plugin path exists and exports a valid manifest. | S4-S5 | **NOT COVERED** — `ai/mod.ts` is planned as a plain barrel; `loadRegisteredPlugins` requires a manifest export. Sibling `scaffold.plugin.json` does not satisfy this loader or the box's explicit export requirement. |
| 3 | `generate runtime-schemas` succeeds immediately after clean AI installation. | S4-S5, S9 | **NOT COVERED** — runtime schemas call `loadRegisteredPlugins`; S4 fails before schema generation. |
| 4 | Generated AI files pass targeted Deno check, including Markdown and Preact. | S6-S7, S9 | PARTIAL — order is corrected and non-app-root writing is valid (`registry.ts:81-125,261-283`; `registry-styles.ts:7-38`), but S6's asserted registry/dependency closure is wrong. |
| 5 | Doctor reports missing modules and invalid executable entrypoints. | S5, S8-S9 | PARTIAL — the two negative invariants are planned. D4b's cross-plugin valid-path matrix and service-less list/service normalization are not fully specified or covered. |
| 6 | Regression tests cover absent `/services`, configured modules, and generated UI imports. | S1-S9 | **NOT COVERED AS PLANNED** — the configured-module loader test has the wrong expected behavior and the UI emitted-set assertion omits recursive registry dependencies. |
| 7 | Canonical `scaffold.runtime` installs plugin-AI and checks the AI namespace. | S9-S10 | COVERED structurally — the gate registrations and canonical one-pass command are selected. It cannot pass until boxes 1-6 are repaired. |

Acceptance boxes with no valid closing slice: **#2 and #3**. Box #6's planned assertions are also invalid.

## Findings

1. **D4a uses the wrong loader path.** `loadRegisteredPlugins` never consults sibling scaffold metadata; it imports the configured module and requires exactly one `PluginManifest` (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:123-148,363-403`). The metadata-first path at `:163-184` is a different API used by list/doctor. Runtime schemas use `loadRegisteredPlugins` (`public-command-dependencies.ts:329-340`). **Required fix:** make generated `ai/mod.ts` export a valid manifest, lock which manifest it exports, add the real `loadRegisteredPlugins` test, and remap acceptance boxes 2, 3, and 6. Cycle 1 finding 1 stands.
2. **D1's consumer inventory is incomplete.** `packages/cli/src/maintainer/adapters/official-plugin-source.ts:87-107,212-251` models the three `officialSource` service fields as required and copies them into required source descriptors. Removing them from `plugins/ai/scaffold.plugin.json` leaves this official local-source path with undefined service data. **Required fix:** include this adapter and its copy/sync tests in S1 or a following slice; define a service-less official-source result instead of relying on casts or empty strings. Inventory any other direct field consumers with a source grep before freezing S1.
3. **D6's locked emitted contract is false.** `markdown -> theme-seed -> cn + public-types`, and `markdown -> citation-chip`; `cn` adds `clsx` and `tailwind-merge`. The resolved closure is five registry items, eleven final target files, and thirteen registry-declared npm packages, before the registry's unconditional `preact` candidate (`registry.manifest.ts:15-35,142-164,451-470,633-678`; `registry.ts:216-258`; `registry-deno-json.ts:17-44`). **Required fix:** replace the eleven-dependency table and safe-to-defer row with the full closure, then make S6 assert resolved item names, final target paths, final `ai/deno.json` imports, and CSS imports. Writing to `<project>/ai`, including `ai/assets/styles.css`, violates no root invariant.
4. **D4b's blast-radius proof is too narrow and its service-less list shape is unspecified.** All official scaffolders emit top-level module directories (`auth/mod.ts`, `workers/mod.ts`, `triggers/mod.ts`, `streams/mod.ts`), so module-derived workdir is the right generic rule. But the affected shapes differ: auth/streams are service-bearing `category: plugin`; workers/triggers carry background/dependency/reference behavior; AI is service-less. S5 names only workers and AI, while reconciliation mutates/prunes references from its installed-key set (`plugin-reference-reconciler.ts:47-100`). `normalizeScaffoldPluginMetadata` also falls back to `provider.defaultEntrypoint` as a service (`plugin-registry.ts:230-256`). **Required fix:** cover representative service-bearing plugin-category, dependency-bearing background, and service-less shapes; lock exact list workdir/service output, doctor result, duplicate-install behavior, and reference preservation. Production logic remains plugin-name-agnostic.
5. **The slice table does not name all files or trustworthy gates needed for its own claims.** S2 omits `workspace-mutator.ts`, which unconditionally writes the plugin entry (`:319-326`). S6/S7 cite `published-0.0.5-repro.sh`, but it hardcodes JSR 0.0.5 and always exits zero (`:6,33-46`). **Required fix:** add `workspace-mutator.ts` and its return/no-entry contract to S2; parameterize or replace the repro with a local-source assertion gate that fails on any acceptance invariant; assign the gate script change to a slice.
6. **The authoritative run/PR surfaces still describe v1.** Live `gh pr view 1444 --json body,labels,...` shows ARCHETYPE-1, `SCOPE-frontend`, nine slices, and a jsr-audit list omitting `packages/cli`. `context-pack.md:17-20,43-52` and `phase-registry.md:8-15` also retain nine slices and old slice/group numbers. Commit `42606724f` changed `plan.md` and `worklog.md` but not those two resume artifacts. **Required fix:** synchronize the PR body, ten-slice checklist, gate surfaces, context pack, and phase registry before implementation. The v2 PLAN comment (`issuecomment-5242821607`) does not replace the PR body's authoritative anchors.

## Paper-over sweep

- D4a is a paper-over: it substitutes sibling installer metadata for the issue's explicit exported-manifest contract, and the runtime loader does not take that path.
- D6's "stop and record drift if the set differs" cannot defer a difference already visible in the checked-in manifest and resolver.
- No v2 decision explicitly proposes `any`, casts, lint suppressions, deleted/skipped tests, or host-side plugin-name branching. The required fixes must preserve that constraint; fixture names in generic regression tests are not authorization for production special cases.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. Correct D4a and S4 to emit/test a real `PluginManifest`; remap acceptance boxes 2, 3, and 6.
2. Complete D1's service-field consumer inventory and handle the maintainer official-source/copy path.
3. Correct D6 to the full recursive registry closure and update S6 assertions.
4. Expand D4b's representative cross-plugin proof and lock service-less list semantics.
5. Repair S2's file scope and replace the observational 0.0.5 script as a local-source verdict gate.
6. Synchronize the PR body, context pack, phase registry, risk/open-decision sections, and `[PHASE: PLAN]` surface.
7. Per `plan-protocol.md:52-55`, this second `FAIL_PLAN` exhausts the two-cycle loop and requires owner escalation before implementation.

## Notes

- Live PR #1444 remains draft with `Closes #1443`, milestone `0.0.6`, `type:fix`, area/priority/gate labels, and exactly one `status:plan` label. The closing keyword, milestone, and single-status convention are present; the PR body is stale.
- Pre-existing dirty/untracked supervisor files were left untouched. This evaluator wrote only this artifact and the requested PR comment.

VERDICT: FAIL_PLAN
