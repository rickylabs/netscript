# Plan v2 — #1443 `plugin-ai` in-process topology and compilable scaffold

Baseline `2256a67bf612907195ce5e51df1df7326c504f2b`. Research: `research.md` (findings R-0…R-5).
Milestone `0.0.6`. Priority P0 — blocks `rickylabs/eis-chat#157`.

**Revision history.** v1 returned `FAIL_PLAN` from PLAN-EVAL (`plan-eval.md`, thread
`019fec5f-4805-7bc1-8e58-bcb6e048646f`). This version answers findings 1–7. The supervisor
independently verified every finding against source before accepting it; where the evaluator's
mechanism was wrong, that is recorded in §"Evaluator findings — disposition" rather than silently
adopted.

## Archetypes, overlays, doctrine verdict

| Surface                                            | Archetype                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `plugins/ai`                                       | `ARCHETYPE-5-plugin.md`                                          |
| `packages/cli` (install, registry, doctor, e2e)    | `ARCHETYPE-6-cli-tooling.md` (+ `F-CLI-1…31`)                    |
| `packages/plugin` (manifest protocol)              | **`ARCHETYPE-4-dsl-builder.md`** — per `docs/architecture/doctrine/06-archetypes.md` §"Archetype assignments", which lists `plugin` under 4 — DSL/Builder. v1's ARCHETYPE-1 was wrong. |

**`SCOPE-frontend` overlay: N/A, with rationale.** v1 selected it. The overlay's gates are
route/browser/loading-empty-error/responsive checks against a *running* app surface. This PR
deliberately does not mount the chat island into the Fresh app (deferred scope), so those gates have
no surface to run against and selecting them would either force route-mounting into scope or ship as
permanently-pending boxes. What #1443 actually requires from the TSX surface is that it **compiles**,
which is covered by the targeted `ai/**` check gate (S7) and the canonical E2E (S9). The overlay is
re-selected by the follow-up issue that mounts the island.

Doctrine verdict in `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` is read before
slicing; plugin-thinness law (#260) governs — `plugins/ai` stays manifest + connector + scaffolder.

## Root cause, stated once

`packages/plugin/src/protocol/manifest.ts` has **no way to express "this plugin has no service"**:
`provider.defaultServiceEntrypoint` and `officialSource.{serviceEntrypoint,serviceConfigKey,servicePort}`
are non-optional in a `.strict()` Zod schema. `plugins/ai` was therefore forced to declare a service
it does not implement, and `resolveServiceEntrypoint` treats "no scaffold-produced service workdir"
as licence to synthesize `jsr:<pkg>@<v>/services`. Every other #1443 symptom is downstream of that
gap, or of the AI scaffolder emitting a namespace that no config, workspace member, or type-check
ever selects.

A second, **pre-existing** defect surfaced by PLAN-EVAL and confirmed against source: installed-plugin
identity and workdir are derived from `plugins/<canonicalName>` regardless of where the configured
module actually lives (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:220-256`;
`plan-plugin-install.ts:129-151`). This already mis-reports today — the reproduction shows
`plugin install worker` writing `./workers/mod.ts` into config while the registry derives workdir
`plugins/workers`, a directory that does not exist. It must be fixed here, because acceptance box 5
requires doctor to be *correct on the valid path*, not merely to fail on broken ones.

## Architecture decisions — LOCKED (v2)

### D1 — the manifest protocol gains an **atomic** service shape

The four service fields become an all-present-or-all-absent group, not four independent
`.optional()` fields. A manifest either declares a complete service (`defaultServiceEntrypoint` in
`provider`, and `serviceEntrypoint` + `serviceConfigKey` + `servicePort` in `officialSource`) or
declares none. Partial triples are rejected by the schema with a named error. Implementation is a
Zod refinement/union over the existing objects — no new exported symbol, no change to the export
list.

**Type normalization is part of this decision, not an implementation detail.** The CLI domain
already models the concept as `PluginKindProvider.defaultServiceEntrypoint: string | null`
(`packages/cli/src/kernel/domain/plugin-kind.ts:76`), so the protocol's `string | undefined`
normalizes to `null` at the single boundary in `normalizeManifestProvider`
(`install-plugin.ts:590-628`). Slice 1 carries that normalization **and** a consumer type-check, so
the protocol change never lands without its consumers.

Consumer inventory that slice 1 must sweep and prove: `install-plugin.ts:618`,
`plugin-reference-reconciler.ts:47-58,146-179` (its legacy `officialSource` guard requires
`serviceConfigKey`), `plan-plugin-install.ts:143`, `appsettings-entry-builders.ts:125-155`, and
`plugin-registry.ts:220-256`.

**Rejected:** four independent `.optional()` fields (v1's shape) — admits partial service metadata
that no consumer handles. **Rejected:** a `capabilities.hasService` boolean — duplicates information
the provider block already carries, and creates two sources of truth that can disagree.

### D2 — the host never synthesizes a service entrypoint

`resolveServiceEntrypoint` loses its unconditional `servicePackageEntrypoint` fallback. An
appsettings service entry is written only when the plugin genuinely has a service: a
scaffold-produced `serviceWorkdir`, or a manifest-declared service entrypoint. A `category: 'plugin'`
provider with neither gets **no `NetScript.Plugins[key]` entry at all** — no port, no executable, no
AppHost resource.

**Second synthesis site (supervisor-added, not in v1).** `generate-register-plugins.ts:49` carries
its own `entry.Entrypoint ?? netscriptJsrSpecifier('plugin-<name>', '/services')` default. Slice 2
removes that fallback too; an appsettings entry without an `Entrypoint` is a config error, not a
prompt to guess. Aspire helper generation is otherwise safe: it iterates
`Object.entries(plugins)`, so an absent entry simply produces no resource (verified,
`generate-register-plugins.ts:43-52`).

`plugin doctor` and `plugin list` do not read `appsettings.json` at all (verified by grep over
`features/plugins/doctor` and `features/plugins/list`), so removing the entry does not blind them —
but see D4b, which is what actually keeps them correct.

### D3 — `plugins/ai` declares the truth

`plugins/ai/scaffold.plugin.json` drops `provider.defaultServiceEntrypoint` and the
`officialSource.{serviceEntrypoint,serviceConfigKey,servicePort}` triple as one atomic removal, per
D1. `backgroundPort` and the remaining `officialSource` fields stay. The package keeps exporting no
`/services`; a regression test asserts that.

### D4a — the AI scaffolder emits `ai/mod.ts`

The AI starter resources gain a `mod.ts` emitter producing `ai/mod.ts`, a barrel re-exporting the
app-owned AI surface. `findGeneratedPluginMod` then resolves the plugin config directory to `ai/`,
so `netscript.config.ts` receives `'./ai/mod.ts'` and `persistPluginMetadata` writes
`ai/scaffold.plugin.json` **beside it**.

That sibling metadata file is what satisfies the configured-module contract:
`resolveScaffoldPluginMetadata` (`plugin-registry.ts:191-207`) reads `scaffold.plugin.json` from the
configured module's own directory and returns before `resolvePluginManifest` is ever reached. This
is exactly how `workers/mod.ts` — a plain job/task barrel with no manifest export — loads today. See
§"Evaluator findings — disposition" F1.

Host-side companion invariant: `ensureNetScriptConfigPlugin` raises `ScaffoldValidationError` rather
than registering a specifier whose file does not exist.

### D4b — installed identity derives from the configured module, not from `plugins/<name>`

New, and load-bearing. Three host-side derivations stop assuming `plugins/<canonicalName>`:

1. `normalizeScaffoldPluginMetadata` (`plugin-registry.ts:220-256`) derives `workdir`/`rootDir` from
   the **directory of the configured module** whose `scaffold.plugin.json` it just read, instead of
   `join(paths.plugins, canonicalName)`.
2. `assertPluginNameAvailable` (`plan-plugin-install.ts:120-156`) treats a configured module
   specifier in `netscript.config.ts` as a registration sentinel, so a service-less plugin with no
   appsettings entry and no `plugins/<name>` directory is still detected as installed.
3. `reconcilePluginReferences` (`plugin-reference-reconciler.ts:47-58`) sources its installed-key set
   from configured modules as well as appsettings, and its `officialSource` guard tolerates a
   service-less declaration.

This is a **pre-existing** bug (it mis-reports for `workers` today) that D2+D4a would otherwise turn
from cosmetic into a broken doctor row. Fixing it is what lets acceptance box 5 be true on the valid
path, not only on the failure paths.

### D5 — the generated `ai/` namespace becomes a configured workspace member

The AI scaffolder emits `ai/deno.json` declaring what its own emitted files need — `preact`,
`preact/hooks`, `jsx: "precompile"`, `jsxImportSource: "preact"` — and `plugin install ai` adds
`./ai` to the generated root `deno.json` `workspace` array through the existing
`ensureWorkspaceMember(projectRoot, extraMembers)` seam. Without the JSX compiler options reaching
the config that governs `ai/**`, no TSX under the workspace root can type-check regardless of
imports (R-3c).

### D6 — the Markdown surface is copied from the first-party registry, with a **locked** emitted contract

`plugin install ai` drives `installUiRegistryItems`
(`packages/cli/src/kernel/application/ui/registry.ts:81-125`) with `projectRoot = <root>/ai` and
item `markdown`. Verified feasible: with `registryRoot === undefined` the function reads
`FRESH_UI_REGISTRY_CONTENT` inline (no network, no `--registry-root`), `resolveUiAppRoot` accepts an
explicit path, and target prefixes are resolved relative to the given `projectRoot`.

The exact emitted contract, locked here and asserted by slice 6 rather than discovered during
implementation (`packages/fresh-ui/registry.manifest.ts:633-678`):

| Aspect | Locked value |
| --- | --- |
| Item files | `ai/components/ui/markdown.tsx`, `ai/components/ui/markdown-pipeline.ts`, `ai/assets/ui/markdown.css` |
| Transitive registry deps | `theme-seed`, `citation-chip` (their files land too) |
| Styles aggregator | `installUiRegistryItems` always writes `ai/assets/styles.css` |
| npm dependencies merged into `ai/deno.json` | `unified@^11`, `remark-parse@^11`, `remark-rehype@^11`, `remark-gfm@^4`, `remark-math@^6`, `rehype-react@^8`, `rehype-katex@^7`, `rehype-highlight@^7`, `rehype-sanitize@^6`, `katex@^0.16`, `highlight.js@^11` (11 total) |

These land in the **generated project's** `ai/deno.json`. The repository `deno.lock` must remain
unchanged; if implementation observes otherwise, that is a stop-and-decide with a `drift.md` entry,
not a silent lock commit.

**Rejected:** re-implementing a `Markdown` stub inside `plugins/ai`. The registry item carries a
security-relevant `rehype-sanitize` whitelist (`markdown-pipeline.ts`); forking it creates a second
sanitizer to keep correct.

### D7 — `plugin doctor` gains two plugin-agnostic invariant checks

Host-side, so every plugin is covered:

1. **`configured-module`** — every specifier in `netscript.config.ts` `plugins:` resolves to an
   existing file. Missing → `error`, non-zero exit.
2. **`service-entrypoint`** — every `NetScript.Plugins[*].Entrypoint` is resolvable: workspace-relative
   entrypoints must exist on disk; a `jsr:<pkg>@<version>/<subpath>` entrypoint must appear in that
   package's export map. Unresolvable → `error`, non-zero exit.

Check names are constants, not string literals.

### D8 — the canonical E2E selects the surfaces that were never selected

`scaffold.runtime` gains: a `generate runtime-schemas` gate after the plugin installs; a full
`ai/**` (`.ts` + `.tsx`) type-check gate, distinct from `GENERATED_UI_AI_CHECK` which only covers the
app's two files; an appsettings assertion that AI install writes no `NetScript.Plugins.ai` entry and
no `/services` specifier for a service-less plugin; and a doctor-negative gate proving non-zero exit
when a configured module is removed.

## Evaluator findings — disposition

| # | Finding | Disposition |
| --- | --- | --- |
| 1 | "Generated `ai/mod.ts` does not meet the configured-module contract — `resolvePluginManifest` requires exactly one exported `PluginManifest`." | **Mechanism corrected; concern adopted.** `plugin-registry.ts:191-207` tries `resolveScaffoldPluginMetadata` **first** and returns on success, so a sibling `scaffold.plugin.json` satisfies the loader without any manifest export — which is why `workers/mod.ts` (a job/task barrel) loads today. The barrel *is* a valid reference. What the finding correctly exposed is the **workdir** derivation bug behind it → now D4b, and slice 4 asserts the loader path explicitly rather than assuming it. |
| 2 | D1 is not source-backward-compatible and admits partial service metadata. | **Adopted in full** → D1 is now atomic, carries the `undefined → null` normalization, names the consumer inventory, and slice 1 includes the consumer type-check. |
| 3 | D2/D4 break installed identity, list, doctor, and reinstall detection. | **Adopted in full** → D4b, and its own slice (S5). Verified: `plan-plugin-install.ts:129-151` checks only `plugins/<name>` + appsettings. |
| 4 | Slice ordering violates the per-slice proof invariant (S5 checked `ai/**` before S6 emitted markdown). | **Adopted** → markdown materialization now lands *before* the full-namespace check (S6 → S7). |
| 5 | Archetype and gate matrix incomplete. | **Adopted** → `packages/plugin` corrected to ARCHETYPE-4; `F-CLI-1…31` selected; `SCOPE-frontend` resolved as N/A with written rationale; post-publish `e2e-cli-prod` obligation recorded. |
| 6 | jsr-audit surface omits `packages/cli`. | **Adopted** → `packages/cli` full-export doc-lint + publish dry-run added; canary bound to `e2e-cli-prod` after publish. |
| 7 | D6 feasible but its emitted surface understated. | **Adopted in full** → the exact file/dependency contract is locked in D6 and asserted by slice 6. |

## Open-decision sweep (v2)

| Decision | Status | Note |
| --- | --- | --- |
| Atomic service shape + CLI normalization (evaluator sweep 1) | **resolved now** | D1. |
| Configured-module export contract (evaluator sweep 2) | **resolved now** | D4a — sibling `scaffold.plugin.json`, verified against `plugin-registry.ts:191-207`; slice 4 asserts it. |
| Installed identity / workdir / reinstall semantics (evaluator sweep 3) | **resolved now** | D4b, slice 5. |
| `SCOPE-frontend` applicability (evaluator sweep 4) | **resolved now** | N/A with written rationale above; targeted compile gates retained. |
| Mounting the chat island into the Fresh app | **safe to defer** | Changes no interface this PR establishes; mounting later adds an app route and touches neither `ai/mod.ts`, the manifest, nor the appsettings rule. Follow-up issue + `arch-debt.md` entry in Close. |
| Exact `theme-seed` / `citation-chip` file lists | **safe to defer** | Transitive registry closure, asserted by slice 6's emitted-set test rather than enumerated here; affects the generated project only. |

No open decision would force rework if deferred.

## Gate set

Universal fitness gates for Archetypes 4/5/6 per `gates/archetype-gate-matrix.md`: F-1, F-3, F-5,
F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-14, F-15, F-16, F-17, F-18, F-19 (plus F-2/F-4 for
Archetypes 4 and 6). ARCHETYPE-6 adds `F-CLI-1…31`. Each is reported `PASS`, `PENDING_SCRIPT` with
manual evidence, or `DEBT` with an `arch-debt.md` row — never omitted.

| Gate | Command / source |
| --- | --- |
| Type-check / lint / format (scoped) | `.llm/tools/run-deno-{check,lint,fmt}.ts --root <path> --ext ts,tsx` |
| Targeted tests | `deno test` for `packages/plugin`, `packages/cli`, `plugins/ai` |
| Code-quality (required for `packages/**`, `plugins/**`) | `deno task quality:scan` |
| Doctrine fitness | `deno task arch:check` |
| Doc-lint (full export surface) | `deno task doc:lint` |
| F-6 publishability / jsr-audit | `deno task publish:dry-run` + `jsr-audit` rubric on **`packages/plugin`, `packages/cli`, `plugins/ai`** |
| Canonical expensive proof | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` |
| Consumer proof | `evidence/published-0.0.5-repro.sh` against local-source CLI; all four defects gone |
| Resource hygiene | `deno task agentic:leak-check` |
| **Post-publish** (`gates/release-gates.md`) | `e2e-cli-prod` bound to the exact canary that carries this merge — a release-lane obligation recorded here, **not** a substitute for `scaffold.runtime` |

Scoped wrappers are necessary but not sufficient; `quality:scan` + `arch:check` run per slice on
every slice touching `packages/**` or `plugins/**`.

## jsr-audit — planned public surface

- **`packages/plugin`** (ARCHETYPE-4): type-level change only; the atomic refinement adds no export
  and introduces no slow type. `deno doc --filter PluginManifestProvider packages/plugin/mod.ts`
  currently renders the field as required — the published *type* changes even though the symbol list
  does not, so the PR body states it. `deno publish --dry-run` must stay green **without**
  `--allow-slow-types`.
- **`packages/cli`** (ARCHETYPE-6, added in v2): S2/S4–S8 change behavior shipped by
  `@netscript/cli`. Full-export `doc:lint` + publish dry-run are required, and the embedded
  registry-content path (D6) cannot be proven from a local dry-run alone — it is proven by the
  E2E's JSR-source lane and finally by `e2e-cli-prod` on the canary.
- **`plugins/ai`** (ARCHETYPE-5): new emitted artifacts are `defineStub` sources under
  `src/adapter/resources/**`, already covered by `publish.include`'s `src/**/*.ts`. **Any new file
  outside `src/`, `deno.json`, or `contracts/` must extend `publish.include` in the same slice** —
  otherwise the fix works from `--local-path` and stays broken from JSR, which is exactly what #1443
  reports. The export map stays free of `./services`; slice 3 asserts it. F-5's ≤20-export cap is
  unaffected.

## Risk register (v2)

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | Removing the AI appsettings entry breaks an Aspire helper generator | Verified safe: `generate-register-plugins.ts:43-52` iterates actual entries. Its own `/services` default is removed in S2; the E2E restores and starts Aspire. |
| 2 | The atomic manifest change silently alters behavior for existing plugins | S1 asserts workers/auth/triggers/streams manifests still parse to identical provider objects and produce identical appsettings entries, and rejects partial triples. |
| 3 | **(new)** D4b changes installed identity for *every* plugin, not just AI | S5 is its own slice with list/doctor/reinstall tests for a service plugin (workers) and a service-less plugin (ai). The workers workdir mis-report is fixed, not preserved. |
| 4 | **(new)** `installUiRegistryItems` into `ai/` emits more than the component (styles aggregator, `theme-seed`, `citation-chip`, 11 npm deps) | The exact contract is locked in D6 and asserted by S6's emitted-set test. If the observed set differs, that is a `drift.md` entry before proceeding. |
| 5 | The repo `deno.lock` changes | Every slice inspects `git status --short`; a lock change is stop-and-decide and must be explained in the PR. |
| 6 | `scaffold.runtime` is expensive and late-failing | Slices land smallest-blast-radius first; the cheap consumer repro re-runs after S2–S7 to catch regressions before the expensive gate. |
| 7 | **(new)** The published-type change in `packages/plugin` reaches consumers before its CLI consumers | S1 lands protocol + normalization + consumer type-check as one slice; the protocol never merges alone. |

## Commit slices (v2)

Ten slices, ordered so each slice's named gate passes at the moment it lands.

| # | Slice | Proves | Gate | Files |
| --- | --- | --- | --- | --- |
| 1 | Manifest protocol expresses "no service" atomically, and its CLI consumers compile | A manifest declares a complete service or none; partial triples are rejected; existing manifests parse identically; `undefined → null` normalization holds | `deno test packages/plugin` + CLI consumer type-check; scoped wrappers; `quality:scan`; `arch:check`; publish dry-run | `packages/plugin/src/protocol/manifest.ts`, `packages/cli/.../install-plugin.ts` (normalizer) + tests |
| 2 | Host stops synthesizing service entrypoints, at **both** sites | No appsettings entry and no `/services` specifier for a service-less plugin; service plugins unchanged | `deno test` for `appsettings-entry-builders`, `workspace-mutator`, `generate-register-plugins` | `appsettings-entry-builders.ts`, `generate-register-plugins.ts` + tests |
| 3 | `plugins/ai` declares its real topology | The AI manifest carries no service block; the package exports no `/services` | `deno test plugins/ai`; publish dry-run; jsr-audit | `plugins/ai/scaffold.plugin.json` + manifest regression test |
| 4 | The configured module exists and loads | `ai/mod.ts` + sibling `ai/scaffold.plugin.json` are emitted; config points at them; the registry loads the plugin through the metadata path; a dangling specifier fails install | `deno test` plugin-ai resources + `install-plugin` + `plugin-registry` loader test | `plugins/ai/src/adapter/resources/**`, `plugins/ai/src/adapter/plugin.ts`, `workspace-mutator.ts` |
| 5 | Installed identity follows the configured module | Workdir/rootDir derive from the module's own directory; duplicate install is detected without appsettings; list and doctor are correct for a service-less plugin **and** for workers | `deno test` `plugin-registry`, `plan-plugin-install`, `plugin-reference-reconciler`, `list`, `doctor` | `plugin-registry.ts`, `plan-plugin-install.ts`, `plugin-reference-reconciler.ts` + tests |
| 6 | The Markdown surface is real, single-sourced, and exactly as locked | The D6 file set + 11 npm deps land in `ai/`; no plugin-local fork | `deno test` install path with the emitted-set assertion; consumer repro script | `install-plugin.ts` (+ UI registry wiring) |
| 7 | The generated AI namespace type-checks end to end | `ai/deno.json` + workspace member + preact/JSX; `deno check ai/**` clean **with markdown present** | AI import-map completeness test; consumer repro script | `plugins/ai/src/adapter/resources/**`, `install-plugin.ts` |
| 8 | Doctor detects both broken invariants | Non-zero exit on a dangling configured module and on an unresolvable entrypoint; healthy on a valid install | `deno test` doctor positive + negative | `packages/cli/src/public/features/plugins/doctor/**` |
| 9 | The canonical E2E selects the AI surfaces | `runtime-schemas`, full `ai/**` check, appsettings assertion, doctor-negative gates registered | `deno test` e2e suite-registry tests | `e2e/src/domain/cli-surface.ts`, `e2e/src/application/gates/scaffold/*`, `suites/scaffold/capability-suites.ts` |
| 10 | End-to-end proof + run artifacts | The expensive gate passes with AI installed and its namespace type-checked; no leaked resources | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; `agentic:leak-check` | run dir artifacts only |

## Acceptance coverage — #1443

| # | Acceptance box | Slice(s) |
| --- | --- | --- |
| 1 | No gateway/service/AppHost resource by default | S1, S2, S3 — asserted by S9 |
| 2 | Every configured plugin path exists and exports a valid manifest | S4 (emitted module + sibling metadata + loader test), S5 (identity) |
| 3 | `generate runtime-schemas` succeeds after clean install | S4 + S5, gated by S9's `runtime-schemas` gate |
| 4 | Generated AI files pass a targeted check, incl. markdown + Preact | S6 then S7 (order corrected), asserted by S9 |
| 5 | Doctor reports missing modules and invalid entrypoints | S8 for the failure paths, **S5 for correctness on the valid path** |
| 6 | Regression tests: absent `/services`, configured-module existence + manifest load, generated UI imports | S1, S3, S4, S7 |
| 7 | `scaffold.runtime` installs plugin-AI and checks the AI namespace | S9, proven by S10 |

## Debt implications

- The generated chat island remains unmounted by the Fresh app → `arch-debt.md` entry + follow-up
  issue in Close.
- Any fitness gate that cannot run gets an explicit `PENDING_SCRIPT` with manual evidence or a
  `DEBT` row — never a silent omission.

## Deferred scope

- Mounting `ai/routes/chat.tsx` and `ai/routes/chat-stream.ts` into the generated Fresh app (and,
  with it, the `SCOPE-frontend` overlay gates).
- Any gateway topology or `--gateway` flag (out of scope per #260).
- The R-0 `--node-modules-dir` consumer friction.
- Broadening doctor beyond the two invariants #1443 names.

## Contributor path

A contributor adding a service-less plugin: omit the service block from the manifest, emit a
`<name>/mod.ts` barrel plus its sibling `scaffold.plugin.json` from the plugin's starter resources,
and the host writes a config entry, derives identity from that module, and emits no AppHost
resource. Slices 1–5 read in order are the worked example.
