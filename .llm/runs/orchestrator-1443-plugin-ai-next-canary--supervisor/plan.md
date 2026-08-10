# Plan v6 — a valid in-process AI topology **and** a working configured-module contract

Baseline `2256a67bf612907195ce5e51df1df7326c504f2b`. Research: `research.md` (R-0…R-5 for #1443,
addendum A-1…A-5 for #1445).
Milestone `0.0.6`. Priority P0 — **Closes #1443 and #1445**; blocks `rickylabs/eis-chat#157`.

**Revision history.**

| Rev | Outcome |
| --- | --- |
| v1 | `FAIL_PLAN` (cycle 1, `plan-eval.md`) — seven findings. |
| v2 | `FAIL_PLAN` (cycle 2, `plan-eval-cycle2.md`) — cycle 2 overturned v2's D4a and was right; the supervisor proved it empirically rather than conceding it. |
| v3 | Corrected D4a, D1's inventory, D6's closure, S2's file scope, the service-less list value, and an always-exits-zero script v2 had wrongly named as a gate. |
| v4 | Applied the owner-authorized rescope (`drift.md` D-6) to the shared configured-module contract; #1445 filed. `FAIL_PLAN` (cycle 3, `plan-eval-cycle3.md`) — **no architecture defects**; cycle 3 explicitly found the rescope is not too large to land as one PR and no paper-over is proposed. All seven findings were internal inconsistencies left by incremental editing across three revisions. |
| v5 | Full rewrite for internal consistency. `FAIL_PLAN` (cycle 4, `plan-eval-cycle4.md`) — four findings, all substantive: research not re-baselined for the widened scope, the maintainer chain stopping two files short, D6's "final" imports being the registry count rather than the output, and D7 check 2 contradicting the runtime resolver with no recoverable execution contract. |
| **v6 (this)** | Answers cycle 4. Research addendum A-1…A-5 re-baselines #1445 and inventories all six plugins; S1 carries the full maintainer chain; D6 states the real output (14 final imports, 3 CSS); D7 check 2 now calls the **shared** resolver in a **subprocess**. |

## Scope

| In scope | Out of scope |
| --- | --- |
| The AI topology/scaffold defect class — #1443 boxes 1–7 | Mounting any plugin's generated routes into the Fresh app |
| The shared configured-module contract for every first-party plugin — #1445 boxes 1–6 | Gateway topology / `--gateway` (deferred by #260) |
| Complete import surfaces for the generated plugin namespaces | The R-0 `--node-modules-dir` consumer friction |

**First-party plugin set (the canonical list used throughout this plan and by the shared tests):**
`ai`, `auth`, `sagas`, `streams`, `triggers`, `workers` — **six** kinds, matching the set
`scaffold.runtime` installs (`capability-suites.ts:61-75`).

## Archetypes, overlays, doctrine verdict

| Surface | Archetype |
| --- | --- |
| `plugins/*` (all six) | `ARCHETYPE-5-plugin.md` |
| `packages/cli` | `ARCHETYPE-6-cli-tooling.md` + `F-CLI-1…31` |
| `packages/plugin` | `ARCHETYPE-4-dsl-builder.md` (per `docs/architecture/doctrine/06-archetypes.md` §"Archetype assignments") |

**`SCOPE-frontend`: N/A, with rationale.** Its gates are route/browser/loading-empty-error/responsive
checks against a *running* app surface. This PR deliberately does not mount any generated route into
the Fresh app, so those gates have no surface to run against; selecting them would force
route-mounting into scope or ship permanently-pending boxes. What #1443 requires of the TSX is that
it **compiles**, covered by S7's targeted check and S13's canonical proof. The overlay is
re-selected by the follow-up issue that mounts the island.

## Root causes

**RC-1 — the manifest protocol cannot express "no service."**
`packages/plugin/src/protocol/manifest.ts:195-230` requires `provider.defaultServiceEntrypoint` and
`officialSource.{serviceEntrypoint,serviceConfigKey,servicePort}` in `.strict()` objects. `plugins/ai`
was forced to declare a service it does not implement, and `resolveServiceEntrypoint`
(`appsettings-entry-builders.ts:125-155`) treats "no scaffold-produced service workdir" as licence to
synthesize `jsr:<pkg>@<v>/services`.

**RC-2 — the configured-module contract is unmet by every first-party plugin.**
`netscript.config.ts` `plugins:` is read by two loaders. `loadRegisteredPluginMetadata`
(`plugin-registry.ts:163-184`) reads a sibling `scaffold.plugin.json` and never imports the module.
`loadRegisteredPlugins` (`:142-160` → `:123-137` → `:363-377`) **imports** the module and throws
unless it exports exactly one `PluginManifest`; there is **no metadata fallback on this path**, and
`generate runtime-schemas` uses it (`public-command-dependencies.ts:329-340`).

Proven empirically in a clean published-0.0.5 consumer — a module exporting a plain object, **with a
sibling `scaffold.plugin.json` present**:

```text
plugins: ['./probe/mod.ts']
Error: Plugin spec "./probe/mod.ts" does not export a plugin manifest.
```

Every first-party plugin writes a `<name>/mod.ts` barrel of app-owned resources, so none satisfies
this contract.

**RC-3 — identity is derived from the wrong place.** `normalizeScaffoldPluginMetadata`
(`plugin-registry.ts:220-256`) derives `workdir` as `join(paths.plugins, canonicalName)` regardless of
where the configured module lives, and `assertPluginNameAvailable` (`plan-plugin-install.ts:120-156`)
uses `plugins/<name>` + appsettings as its only registration sentinels. This already mis-reports for
`workers` today.

**RC-4 — nothing selects the broken surfaces.** `GENERATED_UI_AI_CHECK` (`ui-ai-gates.ts:56-68`)
type-checks only the app's `islands/ui/McpUiWidget.tsx` and `lib/ai/render-ui.tsx`; no suite runs
`generate runtime-schemas`; and no `RUNTIME_WAIT_*` resource covers `ai`, so the unresolvable AI
executable starts and fails silently.

## Architecture decisions — LOCKED

### D1 — the manifest protocol gains an atomic service shape

The four service fields become an all-present-or-all-absent group, expressed as a Zod
refinement/union over the existing objects. Partial triples are rejected with a named error. No new
exported symbol; no slow type.

`provider.defaultServiceEntrypoint`'s `string | undefined` normalizes to `null` at one boundary —
`normalizeManifestProvider` (`install-plugin.ts:590-628`) — because the CLI domain already models the
concept as `PluginKindProvider.defaultServiceEntrypoint: string | null` (`plugin-kind.ts:76`).

**Consumer inventory, all owned by S1** (each is a consumer of the four fields; naming without
scheduling was cycle 3's finding 3):

| Consumer | Location |
| --- | --- |
| provider normalizer | `install-plugin.ts:618` |
| appsettings entry builders | `appsettings-entry-builders.ts:125-155` |
| duplicate-install guard | `plan-plugin-install.ts:143` |
| reference reconciler (legacy `officialSource` guard requires `serviceConfigKey`) | `plugin-reference-reconciler.ts:47-58,146-179` |
| registry metadata normalizer | `plugin-registry.ts:220-256` |
| **maintainer official-source adapter** | `official-plugin-source.ts:93-107,219-251` |
| **official-plugin copy** | `copy-official-plugin.ts:174-176` |
| **maintainer sync result** | `sync-plugin.ts:32-52` |
| **official-plugin copier adapter mapping** (unconditional today) | `official-plugin-copier.ts:11-25` |

The service-less **official-source representation** is locked here: an official plugin with no
service contributes no service entrypoint, port, or config key to `OfficialPluginSource`, and copy
mode omits the service leg rather than emitting empty strings.

**Rejected:** four independent `.optional()` fields (admits partial metadata no consumer handles);
a `capabilities.hasService` boolean (second source of truth that can disagree with the provider block).

### D2 — the host never synthesizes a service entrypoint

`resolveServiceEntrypoint` loses its unconditional `servicePackageEntrypoint` fallback. An appsettings
service entry is written only for a plugin that genuinely has one: a scaffold-produced
`serviceWorkdir`, or a manifest-declared service entrypoint. A `category: 'plugin'` provider with
neither gets **no `NetScript.Plugins[key]` entry** — no port, no executable, no AppHost resource.

Three sites, all owned by S2:

1. `appsettings-entry-builders.ts:125-155` — the fallback itself.
2. `workspace-mutator.ts:319-326` — where the entry is unconditionally inserted.
3. `generate-register-plugins.ts:49` — its own `entry.Entrypoint ?? netscriptJsrSpecifier(...)`
   default. An appsettings entry without an `Entrypoint` is a config error, not a prompt to guess.

Aspire helper generation is otherwise safe: it iterates `Object.entries(plugins)`, so an absent entry
produces no resource (verified, `generate-register-plugins.ts:43-52`). `plugin doctor` and
`plugin list` do not read `appsettings.json` at all (verified by grep) — but D4 is what keeps them
correct.

### D3 — `plugins/ai` declares the truth

`plugins/ai/scaffold.plugin.json` drops `provider.defaultServiceEntrypoint` and the
`officialSource.{serviceEntrypoint,serviceConfigKey,servicePort}` triple as one atomic removal.
`backgroundPort` and the remaining `officialSource` fields stay. The package keeps exporting no
`./services`; S3 asserts it.

### D4 — the configured module exports a real `PluginManifest`, and identity follows it

**D4a — export contract.** Every first-party plugin's scaffolder emits a `<name>/mod.ts` that exports
a valid `PluginManifest` — re-exported from the plugin package, so each package stays the single
source of its own manifest — **in addition to** the app-owned resource re-exports those barrels
already carry. Sibling `scaffold.plugin.json` metadata satisfies `loadRegisteredPluginMetadata`
**only**; it does not satisfy `loadRegisteredPlugins`, which is the path that matters (RC-2). Slices
assert the real loader, never the metadata path.

**Additivity constraint.** `resolveExportedPluginManifest` (`plugin-registry.ts:378-390`) accepts a
default export *or* a **sole** named manifest-shaped value. Adding a manifest export to a barrel that
already exports a manifest-shaped value would make the resolution ambiguous, so S10 verifies per
plugin that exactly one manifest-shaped export results, and prefers the default-export form where a
collision is possible.

For AI specifically, `findGeneratedPluginMod` resolves the config directory to `ai/`, so
`netscript.config.ts` receives `'./ai/mod.ts'` and `persistPluginMetadata` writes
`ai/scaffold.plugin.json` beside it.

**D4b — identity.** Three derivations stop assuming `plugins/<canonicalName>`:

1. `normalizeScaffoldPluginMetadata` (`plugin-registry.ts:220-256`) derives `workdir`/`rootDir` from
   the **directory of the configured module**.
2. `assertPluginNameAvailable` (`plan-plugin-install.ts:120-156`) treats a configured-module specifier
   as a registration sentinel, so a service-less plugin with no appsettings entry and no
   `plugins/<name>` directory is still detected as installed.
3. `reconcilePluginReferences` (`plugin-reference-reconciler.ts:47-58`) sources installed keys from
   configured modules as well as appsettings, and tolerates a service-less declaration.

The service-less `plugin list` service value is locked to `-`; today's fallback would label
`provider.defaultEntrypoint` as a service for a plugin that has none
(`plugin-registry.ts:230-256`, `list-plugins-command.ts:45-61`).

**D4b proof matrix (S5) — all four shapes, not two:** service-less `category: 'plugin'` (`ai`);
service-bearing `category: 'plugin'` (`auth`, `streams`); background-processor with a companion
service (`workers`); and reference-bearing reconciliation (`workers` and `triggers` both depend on
`streams` — `plugins/workers/scaffold.plugin.json:49-70`, `plugins/triggers/scaffold.plugin.json:42-53`).

**D4c — `ensureNetScriptConfigPlugin`** raises `ScaffoldValidationError` rather than registering a
specifier whose file does not exist.

### D5 — the generated `ai/` namespace is a configured workspace member

The AI scaffolder emits `ai/deno.json` declaring what its emitted files need — `preact`,
`preact/hooks`, `jsx: "precompile"`, `jsxImportSource: "preact"` — and `plugin install ai` adds
`./ai` to the generated root `deno.json` `workspace` array via the existing
`ensureWorkspaceMember(projectRoot, extraMembers)` seam. Without JSX options reaching the config that
governs `ai/**`, no TSX under the workspace root type-checks regardless of imports (R-3c).

### D6 — the Markdown surface comes from the first-party registry, with a computed contract

`plugin install ai` drives `installUiRegistryItems` (`registry.ts:81-125`) with
`projectRoot = <root>/ai` and item `markdown`. Feasible and verified: with `registryRoot === undefined`
it reads `FRESH_UI_REGISTRY_CONTENT` inline (no network, no `--registry-root`), `resolveUiAppRoot`
accepts an explicit path, and target prefixes resolve relative to the given `projectRoot`.

`resolveRegistryItems` (`registry.ts:216-258`) closes over the dependency graph **recursively** and
`mergeDenoJsonImports` (`registry-deno-json.ts:17-44`) merges dependencies from every resolved item.
The contract below was **computed** by resolving that closure, not read off one item. **These are the
only numbers in this plan; nothing else states a different count.**

| Aspect | Locked value |
| --- | --- |
| Closure items — **5** | `markdown`, `citation-chip`, `theme-seed`, `cn`, `public-types` |
| Emitted files — **11** | `ai/components/ui/markdown.tsx`, `ai/components/ui/markdown-pipeline.ts`, `ai/assets/ui/markdown.css`, `ai/components/ui/citation-chip.tsx`, `ai/assets/ui/citation-chip.css`, `ai/lib/cn.ts`, `ai/lib/public-types.ts`, `ai/assets/styles.css`, `ai/assets/theme-bridge.css`, `ai/assets/tokens.css`, `ai/assets/tokens.json` |
| Registry-declared npm dependencies — **13** | `unified@^11`, `remark-parse@^11`, `remark-rehype@^11`, `remark-gfm@^4`, `remark-math@^6`, `rehype-react@^8`, `rehype-katex@^7`, `rehype-highlight@^7`, `rehype-sanitize@^6`, `katex@^0.16`, `highlight.js@^11`, `clsx@^2.1.1`, `tailwind-merge@^3.5.0` |
| **Final `ai/deno.json` imports — 14** | the 13 above **plus `preact@^10.27.2`**. `mergeDenoJsonImports` seeds `PREACT_IMPORTS` **unconditionally** (`registry-deno-json.ts:6-8,26`), so `preact` is always added regardless of the item set. Verified at source; v5's "13 final" was the registry count, not the output. |
| CSS imports — **3** | `./ui/citation-chip.css`, `./ui/markdown.css`, and `katex/dist/katex.min.css`, all under the `components` layer, via the styles aggregator (`registry.manifest.ts:451-470,633-678`) |

S6 asserts **all five rows** — resolved items, emitted files, CSS imports, registry-declared
dependencies, and the **final** `ai/deno.json` imports. These land in the *generated project*; the repository `deno.lock` stays
unchanged, and a surviving change is a stop-and-decide with a `drift.md` entry.

**Rejected:** re-implementing `Markdown` inside `plugins/ai` — the registry item carries a
security-relevant `rehype-sanitize` whitelist, and forking it creates a second sanitizer to maintain.

### D7 — `plugin doctor` gains three plugin-agnostic invariant checks

Host-side, so every plugin is covered. Check names are constants, not string literals.

1. **`configured-module-resolves`** — every specifier in `netscript.config.ts` `plugins:` resolves to
   an existing file. Missing → `error`, non-zero exit.
2. **`configured-module-exports-manifest`** — every configured module loads and yields a
   `PluginManifest` **under the runtime resolver's own semantics**.

   **It calls the shared resolver, not a doctor-local predicate.** `resolveExportedPluginManifest`
   (`plugin-registry.ts:378-390`) accepts a **default** export first and only then requires a *sole*
   named manifest — so a module with a default plus other named manifests resolves fine at runtime.
   v5's "more than one → ambiguous" rule contradicted that and would have made doctor disagree with
   the loader it is supposed to police. S8 extracts the resolver into a shared composition point used
   by both `loadRegisteredPlugins` and doctor, and adds **parity tests** asserting the two never
   diverge. Doctor reports what the loader would do: unresolvable → `error`, naming whether the cause
   was zero manifest-shaped exports or multiple named ones with no default.

   **Execution contract — isolated and recoverable.** Doctor must not `import()` a project module
   in-process: a configured module can hang, exit, or blow the CLI's own graph, and doctor's whole
   job is to survive a broken project. The load runs in a **subprocess** with a bounded timeout;
   timeout, non-zero exit, and import failure each map to a distinct `error` message. This is
   #1445 acceptance box 4.
3. **`service-entrypoint-resolves`** — every `NetScript.Plugins[*].Entrypoint` is resolvable:
   workspace-relative entrypoints exist on disk; a `jsr:<pkg>@<version>/<subpath>` entrypoint appears
   in that package's export map. Unresolvable → `error`.

### D8 — the canonical E2E selects the surfaces that were never selected

`scaffold.runtime` gains: a `generate runtime-schemas` gate after the plugin installs (over the full
six-kind install set); a full `ai/**` (`.ts` + `.tsx`) type-check gate, distinct from
`GENERATED_UI_AI_CHECK`; an appsettings assertion that AI install writes no `NetScript.Plugins.ai`
entry and no `/services` specifier for a service-less plugin; and a doctor-negative gate proving
non-zero exit when a configured module is removed.

### D9 — every first-party plugin satisfies the contract, proven by data not fixtures

For all six kinds, the plugin's own scaffolder emits a manifest-exporting `<name>/mod.ts` (D4a) and
the install writes a complete import surface for the generated namespace. `workers` is a confirmed
second instance of the AI import defect: `workers/jobs/health-check.ts:8` imports `zod`, which the
install never adds to the generated import map. The seam is the per-kind data registry
`PLUGIN_KIND_SOURCE_IMPORTS` / `PLUGIN_KIND_ROOT_IMPORTS` (`workspace-mutator.ts:64-140`), which is
already keyed by kind and already branches local-source vs JSR at `:377-428`; both branches are
covered.

**Not a per-plugin special case.** The contract is asserted by **one shared table-driven test** over
the six-kind set plus **one shared E2E gate**. Adding a plugin means adding a table row, never a
conditional. No host-side plugin-name branching is introduced — the per-kind import maps are data
registries, not conditional coupling.

## Open-decision sweep

| Decision | Status |
| --- | --- |
| Atomic service shape, normalization, and the full consumer set incl. maintainer official-source | **resolved now** — D1, S1 |
| Configured-module export contract and the additivity constraint | **resolved now** — D4a, S4/S10 |
| Installed identity, workdir, duplicate detection, service-less list value | **resolved now** — D4b, S5 |
| Doctor's load/export validation rule | **resolved now** — D7 check 2, S8 |
| Exact registry closure — items, files, CSS imports, deno.json imports | **resolved now** — D6, computed and asserted by S6. Nothing about the closure is deferred. |
| `SCOPE-frontend` applicability | **resolved now** — N/A with rationale above |
| Mounting the chat island into the Fresh app | **safe to defer** — changes no interface this PR establishes; follow-up issue + `arch-debt.md` in Close |

No open decision would force rework if deferred.

## Gate set

Universal fitness gates for Archetypes 4/5/6 per `gates/archetype-gate-matrix.md`: F-1…F-19 as
applicable per column, plus `F-CLI-1…31` for `packages/cli`. Each is reported `PASS`,
`PENDING_SCRIPT` with manual evidence, or `DEBT` with an `arch-debt.md` row — never omitted.

| Gate | Command / source |
| --- | --- |
| Type-check / lint / format (scoped) | `.llm/tools/run-deno-{check,lint,fmt}.ts --root <path> --ext ts,tsx` over `packages/plugin`, `packages/cli`, and **all six** `plugins/*` |
| Targeted tests | `deno test` for `packages/plugin`, `packages/cli`, and **all six** `plugins/*` |
| Code-quality | `deno task quality:scan` |
| Doctrine fitness | `deno task arch:check` |
| Doc-lint (full export surface) | `deno task doc:lint` |
| F-6 publishability / jsr-audit | `deno task publish:dry-run` + `jsr-audit` rubric over `packages/plugin`, `packages/cli`, and **all six** `plugins/*` |
| Consumer gate | `evidence/consumer-verify.sh` — parameterized and **assertive**, `exit 1` per surviving defect, run against both local-source and published CLI entrypoints. Created by **S9**. |
| Canonical expensive proof | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` |
| Resource hygiene | `deno task agentic:leak-check` |
| Post-publish (`gates/release-gates.md`) | `e2e-cli-prod` bound to the exact canary carrying this merge — a release-lane obligation, **not** a substitute for `scaffold.runtime` |

`evidence/published-0.0.5-repro.sh` is **observational evidence only** — it hardcodes
`jsr:@netscript/cli@0.0.5` and ends on a bare `echo`, so it always exits `0`. It is never named as a
gate anywhere in this plan.

## jsr-audit — planned public surface

- **`packages/plugin`** (A4): type-level change only; no new export, no slow type. `deno doc --filter
  PluginManifestProvider` currently renders the field as required, so the published *type* changes
  even though the symbol list does not — the PR body states this. Dry-run must stay green **without**
  `--allow-slow-types`.
- **`packages/cli`** (A6): S2/S4–S13 change shipped behavior. Full-export `doc:lint` + publish dry-run
  required. The embedded registry-content path (D6) cannot be proven by a local dry-run alone — it is
  proven by the E2E's JSR-source lane and finally by `e2e-cli-prod` on the canary.
- **All six `plugins/*`** (A5): S10/S11 change five published connectors beyond AI. Each gets scoped
  tests, publish dry-run, and the jsr-audit rubric. New emitted artifacts are `defineStub` sources
  under `src/adapter/resources/**`, covered by each package's `publish.include` `src/**/*.ts`
  (verified for `plugins/ai`; **S10 re-verifies per package**). **Any new file outside `src/`,
  `deno.json`, or `contracts/` must extend that package's `publish.include` in the same slice** —
  otherwise the fix works from `--local-path` and stays broken from JSR, which is exactly what #1443
  reports. `plugins/ai`'s export map stays free of `./services` (S3). F-5's ≤20-export cap is
  unaffected: the added manifest re-export replaces nothing and no barrel approaches the cap.

## Risk register

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | Removing an appsettings entry breaks Aspire helper generation | Verified safe — `generate-register-plugins.ts:43-52` iterates actual entries. Its own `/services` default is removed in S2; the E2E restores and starts Aspire. |
| 2 | The atomic manifest change alters behavior for existing plugins | S1 asserts all six manifests still parse to identical provider objects and produce identical appsettings entries, rejects partial triples, and covers the maintainer official-source + copy consumers. |
| 3 | D4b changes installed identity for every plugin | S5 proves all four shapes in D4b's matrix, not just AI + workers. The pre-existing workers workdir mis-report is fixed, not preserved. |
| 4 | The registry copy emits more than the component | The computed D6 contract (5 items / 11 files / 3 CSS imports / 13 registry deps / **14 final imports incl. `preact`**) is asserted by S6. A divergence is a `drift.md` entry before proceeding. |
| 5 | The repo `deno.lock` changes | Every slice inspects `git status --short`; a lock change is stop-and-decide and must be explained in the PR. |
| 6 | `scaffold.runtime` is expensive and late-failing | Slices land smallest-blast-radius first; `consumer-verify.sh` (S9) runs after each subsequent slice to catch regressions before the expensive gate. |
| 7 | The published-type change reaches consumers ahead of its CLI consumers | S1 lands protocol + normalization + every consumer + type-check as one slice. |
| 8 | **D9 packaging/import-mode risk** — a manifest re-export or import-map entry that works from local source but not from JSR | S10/S11 assert both branches of `workspace-mutator.ts:377-428`, re-verify each package's `publish.include`, and the E2E's JSR-source lane plus post-publish `e2e-cli-prod` are the final authority. |

## Commit slices

Thirteen slices, ordered so each slice's named gate passes at the moment it lands. Every slice:
implement → automated gate → Tier-A supervisor review → sign-off commit → push → PR comment → run
artifacts → reconcile note.

| # | Slice | Proves | Gate | Files |
| --- | --- | --- | --- | --- |
| S1 | Manifest protocol expresses "no service" atomically, and **every** consumer compiles | Complete-or-absent service block; partial triples rejected; all six existing manifests parse identically; `undefined → null` normalization; the service-less shape is carried through the **whole** maintainer chain to the public sync result | `deno test packages/plugin` + `packages/cli` consumer/maintainer-sync tests; scoped wrappers; `quality:scan`; `arch:check`; publish dry-run | `packages/plugin/src/protocol/manifest.ts`, `install-plugin.ts`, `official-plugin-source.ts`, `copy-official-plugin.ts`, `sync-plugin.ts:32-52`, `official-plugin-copier.ts:11-25` + tests |
| S2 | Host stops synthesizing service entrypoints, at all three sites | No appsettings entry and no `/services` specifier for a service-less plugin; service plugins unchanged | `deno test` for `appsettings-entry-builders`, `workspace-mutator`, `generate-register-plugins` | `appsettings-entry-builders.ts`, `workspace-mutator.ts:319-326`, `generate-register-plugins.ts:49` + tests |
| S3 | `plugins/ai` declares its real topology | The AI manifest carries no service block; the package exports no `./services` | `deno test plugins/ai`; publish dry-run; jsr-audit | `plugins/ai/scaffold.plugin.json` + manifest regression test |
| S4 | AI's configured module exists **and loads** | `ai/mod.ts` exports exactly one `PluginManifest`; `loadRegisteredPlugins` succeeds against it; a dangling specifier fails install | `deno test` plugin-ai resources + `install-plugin` + a `loadRegisteredPlugins` integration test | `plugins/ai/src/adapter/resources/**`, `plugins/ai/src/adapter/plugin.ts`, `workspace-mutator.ts` |
| S5 | Installed identity follows the configured module | Workdir/rootDir from the module's own directory; duplicate install detected without appsettings; list/doctor correct across **all four** D4b shapes; service-less list value is `-` | `deno test` `plugin-registry`, `plan-plugin-install`, `plugin-reference-reconciler`, `list`, `doctor` | `plugin-registry.ts`, `plan-plugin-install.ts`, `plugin-reference-reconciler.ts`, `list-plugins-command.ts` + tests |
| S6 | The Markdown surface is real, single-sourced, and exactly as computed | The D6 contract — 5 items, 11 files, 3 CSS imports, 13 registry deps, **14 final `ai/deno.json` imports incl. `preact`** — asserted in full | `deno test` install path with the four-row emitted-set assertion | `install-plugin.ts` (+ UI registry wiring) + tests |
| S7 | The generated AI namespace type-checks end to end | `ai/deno.json` + workspace member + preact/JSX; `deno check ai/**` clean **with markdown present** | AI import-map completeness test; scoped check over the generated namespace | `plugins/ai/src/adapter/resources/**`, `install-plugin.ts` |
| S8 | Doctor detects all three broken invariants, in agreement with the runtime loader | Non-zero exit for a dangling module, for a module the **shared resolver** cannot resolve, and for an unresolvable entrypoint; healthy on a valid install; the subprocess runner maps timeout / non-zero exit / import failure to distinct errors; resolver **parity tests** prove doctor and `loadRegisteredPlugins` never disagree | `deno test` doctor positives + negatives + resolver parity | `packages/cli/src/public/features/plugins/doctor/**`, the extracted shared resolver + its composition point, `plugin-registry.ts:378-390` + tests |
| S9 | The consumer gate can fail | `consumer-verify.sh` is parameterized over the CLI entrypoint and exits non-zero per surviving defect; verified by running it against published 0.0.5 (must fail) and local source | script self-test: red against 0.0.5, green against fixed local source | `evidence/consumer-verify.sh` (new) |
| S10 | **Every** first-party plugin satisfies the configured-module contract | All six emit a manifest-exporting `<name>/mod.ts`; exactly one manifest-shaped export each; `publish.include` re-verified per package | one shared table-driven contract test over the six-kind set + per-plugin resource tests | `plugins/{ai,auth,sagas,streams,triggers,workers}/src/**` + one shared test |
| S11 | **Every** generated plugin namespace has a complete import surface | `deno check` clean per installed plugin namespace; the confirmed `workers`→`zod` gap closed; both local-source and JSR branches covered | generalized import-map completeness test; `consumer-verify.sh` per plugin | `workspace-mutator.ts:64-140,377-428` + tests |
| S12 | The canonical E2E selects the AI and contract surfaces | `runtime-schemas`, full `ai/**` check, appsettings assertion, and doctor-negative gates registered over the six-kind install set | `deno test` e2e suite-registry tests | `e2e/src/domain/cli-surface.ts`, `e2e/src/application/gates/scaffold/*`, `suites/scaffold/capability-suites.ts` |
| S13 | End-to-end proof + run artifacts | `scaffold.runtime` passes with all six kinds installed, `generate runtime-schemas` green, and the AI namespace type-checked; no leaked resources | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; `agentic:leak-check` | run dir artifacts only |

## Acceptance coverage — #1443

| # | Acceptance box | Slice(s) |
| --- | --- | --- |
| 1 | No gateway/service/AppHost resource by default | S1, S2, S3 — asserted by S12, proven by S13 |
| 2 | Every configured plugin path exists and exports a valid manifest | S4 (AI), S10 (all six) |
| 3 | `generate runtime-schemas` succeeds after clean install | S4, S5, S10 — gated by S12, proven by S13 |
| 4 | Generated AI files pass a targeted check, incl. markdown + Preact | S6 then S7 — asserted by S12, proven by S13 |
| 5 | Doctor reports missing modules and invalid entrypoints | S8 for the failure paths, **S5 for correctness on the valid path** |
| 6 | Regression tests: absent `/services`, configured-module existence + manifest load, generated UI imports | S1, S3, S4, S7, S10 |
| 7 | `scaffold.runtime` installs plugin-AI and checks the AI namespace | S12, proven by S13 |

## Acceptance coverage — #1445

| # | Acceptance box | Slice(s) |
| --- | --- | --- |
| 1 | Every first-party plugin emits a configured module exporting a valid `PluginManifest` | S4 (AI), S10 (all six) |
| 2 | `generate runtime-schemas` succeeds after a clean install of each first-party plugin | S10, S11 — gated by S12, proven by S13 |
| 3 | Each generated plugin namespace type-checks with all imports declared | S7 (AI), S11 (all six) |
| 4 | Doctor fails for a configured module that does not resolve or export a manifest | S8 (D7 checks 1 and 2) |
| 5 | Regression tests assert the loader contract per first-party plugin | S10's shared table-driven test |
| 6 | `gate:e2e` — `scaffold.runtime` proves the contract for every plugin it installs | S12, proven by S13 |

## Debt implications

- The generated chat island remains unmounted by the Fresh app → `arch-debt.md` entry + follow-up
  issue in Close.
- Any fitness gate that cannot run gets an explicit `PENDING_SCRIPT` with manual evidence or a `DEBT`
  row — never a silent omission.

## Deferred scope

- Mounting `ai/routes/chat.tsx` and `ai/routes/chat-stream.ts` into the generated Fresh app, and with
  it the `SCOPE-frontend` overlay gates.
- Gateway topology / `--gateway` (deferred by #260).
- The R-0 `--node-modules-dir` consumer friction.
- Broadening doctor beyond the three invariants #1443 and #1445 name.

## Contributor path

A contributor adding a service-less plugin: omit the service block from the manifest, emit a
`<name>/mod.ts` that re-exports the package's `PluginManifest` alongside the app-owned resources, and
add the kind's row to the import-map data registry. The host writes a config entry, derives identity
from that module, emits no AppHost resource, and the shared contract test covers the new plugin
without a new fixture. Slices S1–S5 and S10 read in order are the worked example.
