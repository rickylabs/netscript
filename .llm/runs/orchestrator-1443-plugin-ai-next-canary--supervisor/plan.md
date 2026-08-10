# Plan — #1443 `plugin-ai` in-process topology and compilable scaffold

Baseline `2256a67bf612907195ce5e51df1df7326c504f2b`. Research: `research.md` (findings R-0…R-5).
Milestone `0.0.6`. Priority P0 — blocks `rickylabs/eis-chat#157`.

## Archetypes, overlays, doctrine verdict

| Surface                                             | Archetype                                        |
| --------------------------------------------------- | ------------------------------------------------- |
| `plugins/ai`                                        | `ARCHETYPE-5-plugin.md` (primary)                 |
| `packages/cli` (install, doctor, UI registry, e2e)  | `ARCHETYPE-6-cli-tooling.md`                      |
| `packages/plugin` (manifest protocol)               | `ARCHETYPE-1-small-contract.md`                   |

Scope overlay: `SCOPE-frontend.md` (the generated chat island is Preact/TSX).
Doctrine verdict read from `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` before
slicing; plugin-thinness law (#260) governs: `plugins/ai` stays manifest + connector + scaffolder.

## Root cause, stated once

The manifest protocol in `packages/plugin/src/protocol/manifest.ts` has **no way to express "this
plugin has no service"**: `provider.defaultServiceEntrypoint` and
`officialSource.{serviceEntrypoint,serviceConfigKey,servicePort}` are non-optional in a `.strict()`
Zod schema. `plugins/ai` therefore had to declare a service it does not implement, and the CLI's
`resolveServiceEntrypoint` treats "no scaffold-produced service workdir" as "synthesize
`jsr:<pkg>@<v>/services`" rather than "there is no service". Every other symptom in #1443 is
downstream of that gap or of the AI scaffolder emitting a namespace that no config, workspace
member, or type-check ever selects.

## Architecture decisions — LOCKED

### D1 — the manifest protocol gains an explicit no-service shape

`provider.defaultServiceEntrypoint`, `officialSource.serviceEntrypoint`,
`officialSource.serviceConfigKey`, and `officialSource.servicePort` become **optional** in
`PluginManifest*` types and their Zod schemas. Existing manifests are unaffected (adding
`.optional()` widens, never narrows). Rationale: the alternative discriminators — a new
`capabilities.hasService` boolean, or host-side inference from the package export map — either
duplicate information the provider block already carries or make the host perform a network
lookup during install. Absence is the honest encoding of absence.

**Rejected:** keying anything on plugin name or kind (`kind === 'ai'`). `deno task quality:scan`
fails host-side hardcoded plugin names, and #745 is the precedent for why.

### D2 — the host never synthesizes a service entrypoint

`resolveServiceEntrypoint` (`packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts`)
loses its unconditional `servicePackageEntrypoint` fallback. An appsettings service entry is written
only when the plugin has a service: a scaffold-produced `serviceWorkdir`, or a manifest-declared
service entrypoint. When a `category: 'plugin'` provider declares no service and the scaffold
produced no service workdir, `updateAppsettings` writes **no `NetScript.Plugins[key]` entry at all**
— no port, no executable, no AppHost resource. This is #260's ratified in-process default and
#1443's first acceptance item. `plugin list` / `plugin doctor` already source their truth from
`netscript.config.ts` and the installed `scaffold.plugin.json`, not from appsettings (verified in
R-4), so removing the entry does not blind them.

### D3 — `plugins/ai` declares the truth

`plugins/ai/scaffold.plugin.json` drops `provider.defaultServiceEntrypoint` and the
`officialSource.{serviceEntrypoint,serviceConfigKey,servicePort}` triple. `backgroundPort` and the
remaining `officialSource` fields stay. The package continues to export no `/services`.

### D4 — the AI scaffolder emits `ai/mod.ts`

The AI starter resources gain a `mod.ts` emitter producing `ai/mod.ts`, a barrel re-exporting the
app-owned AI surface — mirroring the shape `plugin install worker` already produces
(`workers/mod.ts` re-exporting the emitted job and task; verified in R-2). `findGeneratedPluginMod`
then resolves the plugin config directory to `ai/`, so `netscript.config.ts` receives
`'./ai/mod.ts'` (a path that exists) and `persistPluginMetadata` writes `ai/scaffold.plugin.json`
beside it, exactly like `workers/`.

Host-side companion invariant: `ensureNetScriptConfigPlugin` must not write a specifier for a file
that does not exist — it raises `ScaffoldValidationError` instead of silently registering a dangling
module. A plugin that cannot produce a loadable module fails its install loudly.

### D5 — the generated `ai/` namespace becomes self-contained and compilable

The AI scaffolder emits `ai/deno.json` declaring the imports and compiler options its own emitted
files need (`preact`, `preact/hooks`, `jsx: "precompile"`, `jsxImportSource: "preact"`), and
`plugin install ai` adds `./ai` to the root `deno.json` `workspace` array via the existing
`ensureWorkspaceMember(projectRoot, extraMembers)` seam. This is what makes `ai/**` type-checkable
at all: R-3 showed the generated project's root `deno.json` carries no JSX configuration, so no TSX
under the workspace root can compile regardless of imports.

The `Markdown` surface is materialized from the **existing first-party registry**, not duplicated:
`plugin install ai` drives `installUiRegistryItems`
(`packages/cli/src/kernel/application/ui/registry.ts`) with `projectRoot = <root>/ai` to copy the
`markdown` registry item and its declared dependencies into `ai/components/ui/`, merging the npm
imports that item declares into `ai/deno.json`. That code path already bundles registry content
inline (`FRESH_UI_REGISTRY_CONTENT`, used whenever `registryRoot` is `undefined`), so it works for
published JSR consumers with no `--registry-root` and no network fetch.

**Rejected:** re-implementing a `Markdown` stub inside `plugins/ai`. The registry item carries a
security-relevant `rehype-sanitize` whitelist (`markdown-pipeline.ts`); forking it into a plugin
stub would create a second sanitizer to keep correct.

**Consequence to verify during implementation, not assume:** the copied item's npm dependencies land
in the *generated project's* `ai/deno.json`, not in this repository. The repository `deno.lock` must
remain unchanged; if implementation finds otherwise, that is a `drift.md` entry and a supervisor
decision, not a silent lock commit.

### D6 — `plugin doctor` gains two plugin-agnostic invariant checks

Host-side (in the CLI doctor, not a plugin's `extraChecks`, so every plugin is covered):

1. **configured-module** — every specifier in `netscript.config.ts` `plugins:` resolves to an
   existing file. Missing → `error`, non-zero exit.
2. **service-entrypoint** — every `NetScript.Plugins[*].Entrypoint` is resolvable: a workspace-
   relative entrypoint must exist on disk; a `jsr:<pkg>@<version>/<subpath>` entrypoint must appear
   in that package's export map. Unresolvable → `error`, non-zero exit.

Both are the checks whose absence produced R-4's false green.

### D7 — the canonical E2E selects the surfaces that were never selected

`scaffold.runtime` gains, in the existing gate vocabulary:

- a `generate runtime-schemas` gate after the plugin installs (the exact command that failed in R-2,
  which no suite runs today);
- a generated-AI-namespace type-check gate covering **all** of `ai/**` (`.ts` and `.tsx`) — distinct
  from `GENERATED_UI_AI_CHECK`, which only covers the app's `islands/ui/McpUiWidget.tsx` and
  `lib/ai/render-ui.tsx`;
- an appsettings assertion that installing AI writes no `NetScript.Plugins.ai` entry and that no
  `/services` specifier appears for a service-less plugin;
- a doctor negative gate: with a configured module removed, `plugin doctor` exits non-zero.

## Open-decision sweep

| Decision | Status | Note |
| --- | --- | --- |
| Whether the chat island should be mounted by the Fresh app (it is unreachable today — nothing under `apps/`, `aspire/`, or `services/` references `ai/routes/**`) | **safe to defer** | #1443 requires the generated files to compile and the topology to be valid, not that the island be routed. Deferring changes no interface this PR establishes: mounting later adds a route in the app and does not alter `ai/mod.ts`, the manifest, or the appsettings rule. Filed as a follow-up issue in the Close phase and recorded in `arch-debt.md`. |
| Whether `@netscript/plugin`'s manifest change warrants a version/compat note in the publish surface | **must resolve now** | Resolved inside slice 1: widening required fields to optional is backward compatible for every existing manifest; the slice records this in the PR body and runs the jsr-audit gate on `packages/plugin`. |
| Whether the removed AI appsettings entry breaks any runtime gate | **must resolve now** | Resolved in research: `BEHAVIOR_AI_CHAT_ROUTE` is a `deno eval` module import, not an HTTP probe, and no `RUNTIME_WAIT_*` resource covers `ai`. The AI executable currently starts and fails silently. Slice 6 asserts the entry's absence rather than assuming it. |
| Exact npm dependency set the `markdown` registry item pulls into `ai/deno.json` | **safe to defer** | Determined by the registry manifest at implementation time; it changes the generated project only. The repo-lock invariant above is the guard. |

No open decision would force rework if deferred.

## Gate set

Per `gates/archetype-gate-matrix.md` for Archetypes 1/5/6 plus `SCOPE-frontend`:

| Gate | Command / source |
| --- | --- |
| Type-check (scoped) | `.llm/tools/run-deno-check.ts --root <path> --ext ts,tsx` |
| Lint (scoped) | `.llm/tools/run-deno-lint.ts --root <path> --ext ts,tsx` |
| Format (scoped) | `.llm/tools/run-deno-fmt.ts --root <path> --ext ts,tsx` |
| Targeted tests | `deno test` for `plugins/ai`, `packages/plugin`, `packages/cli` touched areas |
| Code-quality (required, `packages/**` + `plugins/**`) | `deno task quality:scan` |
| Doctrine fitness (required) | `deno task arch:check` |
| F-6 publishability / jsr-audit | `deno task publish:dry-run` + `jsr-audit` rubric on `packages/plugin`, `plugins/ai` |
| Canonical expensive proof | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` |
| Consumer proof | re-run `evidence/published-0.0.5-repro.sh` against local-source CLI; all four defects gone |
| Resource hygiene | `deno task agentic:leak-check` after the E2E |

The scoped wrappers are necessary but not sufficient; `quality:scan` + `arch:check` run per slice on
every slice touching `packages/**` or `plugins/**`.

## jsr-audit — planned public surface

- `packages/plugin`: the change is type-level only (four fields required → optional). No new export,
  no slow type introduced; `PluginManifestProvider` / `PluginManifestOfficialSource` stay explicitly
  annotated. `deno publish --dry-run` must stay green **without** `--allow-slow-types`.
- `plugins/ai`: new emitted artifacts (`mod.ts` stub, `deno.json` stub) are `defineStub` sources
  under `src/adapter/resources/**`, already covered by `publish.include`'s `src/**/*.ts`. **If any
  new file lands outside `src/`, `deno.json`, or `contracts/`, `publish.include` must be extended in
  the same slice** — otherwise the fix works from `--local-path` and stays broken from JSR, which is
  precisely the failure mode #1443 reports.
- `plugins/ai` export map stays free of `./services`; slice 1's regression test asserts it.
- Public-surface cap (F-5, ≤20 exports) unchanged: no new exports from `plugins/ai/mod.ts`.

## Risk register

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | Removing the AI appsettings entry breaks an Aspire helper generator that assumes every installed plugin has a resource | Slice 2 runs the Aspire helper regeneration path in unit tests and the E2E restores/starts Aspire; `generate-register-plugins.ts` is read before editing. |
| 2 | Making manifest fields optional silently changes `normalizeManifestProvider` behavior for existing plugins | Slice 1 adds regression tests asserting workers/auth/triggers/streams manifests still produce identical provider objects and identical appsettings entries. |
| 3 | `installUiRegistryItems` targeted at a non-app root writes app-shaped artifacts (styles, assets) into `ai/` | Slice 4 asserts the exact emitted file set and keeps it minimal; if the registry layer cannot target a non-app root cleanly, escalate to the supervisor rather than forking the component (recorded as a decision point, not a silent workaround). |
| 4 | The repo `deno.lock` changes because a new dependency reaches the workspace | Every slice inspects `git status --short`; a lock change is a stop-and-decide, and the PR must explain any change that survives. |
| 5 | `scaffold.runtime` is expensive and late-failing | Slices land smallest-blast-radius first (protocol → host rule → manifest → scaffolder → doctor → e2e); the cheap consumer repro script is re-run after slices 2–5 to catch regressions before the expensive gate. |
| 6 | The new `ai/` workspace member changes root `deno task check` scope in generated projects | Slice 5's E2E check gate covers the generated workspace; the repo's own gates are unaffected (the member exists only in generated projects). |

## Commit slices

Ordered; each names what it proves, its gate, and the files it touches. Nine slices, well under 30.

| # | Slice | Proves | Gate | Files |
| --- | --- | --- | --- | --- |
| 1 | Manifest protocol expresses "no service" | A manifest may omit the service quadruple and still parse; existing manifests unchanged | `deno test packages/plugin`; scoped check/lint/fmt; `quality:scan`; `arch:check`; publish dry-run | `packages/plugin/src/protocol/manifest.ts` + tests |
| 2 | Host stops synthesizing service entrypoints | No appsettings entry and no `/services` specifier for a service-less plugin; service plugins unchanged | `deno test` for `appsettings-entry-builders`, `workspace-mutator`, `install-plugin`; `quality:scan`; `arch:check` | `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts`, `workspace-mutator.ts` + tests |
| 3 | `plugins/ai` declares its real topology | The AI manifest carries no service entrypoint; the package exports no `/services` | `deno test plugins/ai`; publish dry-run; jsr-audit | `plugins/ai/scaffold.plugin.json` + manifest regression test |
| 4 | Configured module always exists | `ai/mod.ts` is emitted; config points at it; a dangling specifier fails install | `deno test plugins/ai` + `install-plugin` tests; consumer repro script | `plugins/ai/src/adapter/resources/mod-barrel/*`, `plugins/ai/src/adapter/plugin.ts`, `packages/cli/.../workspace-mutator.ts` |
| 5 | The generated AI namespace type-checks | `ai/deno.json` + workspace member + `preact` surface; `deno check ai/**` is clean | AI import-map completeness test; consumer repro script | `plugins/ai/src/adapter/resources/deno-json/*`, `packages/cli/.../install-plugin.ts` |
| 6 | The Markdown surface is real and single-sourced | `ai/components/ui/markdown.tsx` exists from the registry; island imports resolve | `deno test` for the install path; consumer repro script | `packages/cli/src/public/features/plugins/install/install-plugin.ts` (+ UI registry wiring) |
| 7 | Doctor detects both broken invariants | Doctor exits non-zero on a dangling configured module and on an unresolvable entrypoint | `deno test` doctor tests (positive + negative) | `packages/cli/src/public/features/plugins/doctor/**` |
| 8 | The canonical E2E selects the AI surfaces | `runtime-schemas`, `ai/**` check, appsettings assertion, doctor-negative gates registered | `deno test` e2e suite-registry tests | `packages/cli/e2e/src/domain/cli-surface.ts`, `.../gates/scaffold/*`, `suites/scaffold/capability-suites.ts` |
| 9 | End-to-end proof + run artifacts | The expensive gate passes with AI installed and its namespace type-checked | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; leak-check | run dir artifacts only |

## Debt implications

- The generated chat island remains unmounted by the Fresh app. Recorded in
  `.llm/harness/debt/arch-debt.md` in the Close phase with a follow-up issue; it is a coherence gap,
  not a doctrine violation.
- If the UI registry layer proves unable to target a non-app root (risk 3), the resulting compromise
  is a debt entry with an explicit owner decision, never a forked component.

## Deferred scope

- Mounting `ai/routes/chat.tsx` and `ai/routes/chat-stream.ts` into the generated Fresh app.
- Any gateway topology or `--gateway` flag (out of scope per #260).
- The `R-0` `--node-modules-dir` consumer friction (documented in research; separate concern).
- Broadening the doctor checks beyond the two invariants #1443 names.

## Contributor path

A contributor adding a new service-less plugin: declare the provider block without
`defaultServiceEntrypoint`, emit a `<name>/mod.ts` barrel from the plugin's starter resources, and
the host writes a config entry and no AppHost resource. Slices 1–4 are the readable example.
