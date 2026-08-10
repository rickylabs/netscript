# Research — #1443 `plugin-ai` invalid service topology and uncompilable scaffold

Baseline: `2256a67bf612907195ce5e51df1df7326c504f2b` (`origin/main`, 2026-08-10).
Evidence: `evidence/published-0.0.5-repro.log` (script: `evidence/published-0.0.5-repro.sh`).

## 1. Re-baseline

The issue was filed against published `0.0.5`. `git log` over `plugins/ai`,
`packages/cli/src/kernel/adapters/plugin`, and `packages/cli/src/public/features/plugins` shows the
newest functional commit on those paths is `0e78e9c58 chore(release): cut 0.0.5 (#1437)`; every
commit since (`#1440`–`#1442`) is docs/CI. **`main` therefore still carries every defect**; nothing
in the issue is already fixed. #260 (the origin contract) is `CLOSED` and states the ratified
in-process default explicitly: `plugins/ai/mod.ts` built with **no default `service`**, and
"No gateway config, gateway flag, or registry-target code is emitted by any scaffolder in this
slice."

## 2. Reproduction (published 0.0.5, disposable clean consumer)

Executed on Linux/WSL2 with Deno 2.9.5 in a throwaway directory:

```bash
deno run --minimum-dependency-age=0 --node-modules-dir=auto -A jsr:@netscript/cli@0.0.5 \
  init fresh --path . --db sqlite --cache=false --service --service-name users --ci --yes --no-git --force
deno run ... plugin install ai --name ai --project-root fresh --ci --force
deno run ... generate runtime-schemas --project-root fresh --verbose
deno run ... plugin doctor --project-root fresh
```

`init` and `plugin install ai` exit `0`. Everything below is the observed post-install state.

### R-0 (environment, not a product defect)

The bare command from the issue fails before any NetScript logic when the CLI is launched from a
directory with no `deno.json`: `@netscript/config` imports `npm:zod@^4.4.3` and Deno refuses without
a node_modules dir. `--node-modules-dir=auto` clears it. Recorded so the repro is re-runnable; it is
**not** part of #1443's scope.

### R-1 — invalid AppHost service topology (issue defect 1) — CONFIRMED

`fresh/appsettings.json` after install:

```json
"Plugins": { "ai": {
  "Enabled": true, "Runtime": "deno", "Port": 55974, "HostPort": 55974,
  "Entrypoint": "jsr:@netscript/plugin-ai@0.0.5/services", "Workdir": ".",
  "RequiresKv": false, "RequiresDb": false,
  "Permissions": ["--allow-net", "--allow-env", "--allow-read"] } }
```

`plugins/ai/deno.json` `exports` has **no `./services`** key — the entrypoint cannot resolve.

Mechanism (verified in source):

- `plugins/ai/scaffold.plugin.json` declares `provider.category: "plugin"`,
  `provider.defaultServiceEntrypoint: "ai/routes/chat-stream.ts"`, and an `officialSource` block
  with `serviceEntrypoint` / `serviceConfigKey` / `servicePort: 8095` — i.e. the manifest claims a
  service topology the package does not implement.
- `createPluginOwnedPluginResult` (`install-plugin.ts:513`) sets `serviceWorkdir` only when the
  scaffold created `plugins/<name>/<defaultServiceEntrypoint>`. The AI scaffolder emits to
  `ai/routes/chat-stream.ts` (workspace root), never `plugins/ai/ai/routes/chat-stream.ts`, so
  `serviceWorkdir` is `undefined`.
- `resolveServiceEntrypoint` (`appsettings-entry-builders.ts:125`) then falls through to
  `servicePackageEntrypoint`, which synthesizes `jsr:<pkg>@<version>/services` **unconditionally** —
  there is no check that the package exports `/services`, and no notion of "this plugin has no
  service".

Contrast (same project, `plugin install worker`): `jsr:@netscript/plugin-workers@0.0.5/services` is
a **real** export, and workers additionally gets a `BackgroundProcessors.workers` entry. The service
path is correct for genuine service plugins; the bug is that it is the unconditional default.

### R-2 — configured plugin module does not exist (issue defect 2) — CONFIRMED

`fresh/netscript.config.ts` → `plugins: ['./plugins/ai/mod.ts']`.
`find fresh/plugins/ai -type f` → **`fresh/plugins/ai/scaffold.plugin.json` only**.

`generate runtime-schemas --project-root fresh` →
`Error: Module not found ".../fresh/plugins/ai/mod.ts".` (exit 1).

Mechanism: `resolvePluginConfigDirectory` (`install-plugin.ts:560`) picks `<pluginName>/` when the
scaffold created `<pluginName>/mod.ts`, else falls back to `plugins/<pluginName>/`. The AI
`starterResources` list (`plugins/ai/src/adapter/plugin.ts:37`) contains **no `mod.ts` emitter**, so
the fallback wins and `ensureNetScriptConfigPlugin` writes a path that is never created.
`persistPluginMetadata` then writes `scaffold.plugin.json` into that same empty directory, which is
why the directory exists but holds nothing loadable.

Contrast: `plugin install worker` emits `workers/mod.ts` (a barrel re-exporting the app-owned job
and task), so its config entry `'./workers/mod.ts'` resolves. **The correct AI shape is the same
one workers already uses** — a project-local `ai/mod.ts` barrel.

### R-3 — generated AI UI does not compile (issue defect 3) — CONFIRMED

`deno check --unstable-kv ai/**/*.ts ai/**/*.tsx` in the generated project → **27 errors**, exit 1.
Three independent causes, isolated by re-running the check after `generate plugins`:

| # | Error | Cause |
| --- | --- | --- |
| a | `Cannot find module .../.netscript/generated/plugin-ai/{tools,agents}.registry.ts` | Downstream of R-2: the documented `install → generate runtime-schemas` order aborts. Running `generate plugins` emits both registries and clears these two errors, so this is a **sequencing** symptom, not a separate scaffold gap. |
| b | `Import "preact" not a dependency and not in import map` (also `preact/hooks`) | `PLUGIN_KIND_SOURCE_IMPORTS.ai` (`workspace-mutator.ts:134`) maps only `@netscript/ai`, `@netscript/plugin-ai-core`, `@netscript/fresh`. The chat island imports `preact` + `preact/hooks`, which are never added to the root import map. |
| c | `Cannot find module .../fresh/ai/components/ui/markdown.tsx` + 20× `TS7026 JSX.IntrinsicElements` / `TS2874 requires 'React' in scope` | `chat-route.stub.ts:25` imports `../components/ui/markdown.tsx`; no scaffolder emits it. And the generated project's **root** `deno.json` has `compilerOptions: {strict, lib:[dom,deno.ns,deno.unstable]}` — no `jsx: "precompile"` / `jsxImportSource: "preact"` — so no TSX under the workspace root can type-check at all. |

On (c): `markdown` **does** exist as a first-party registry item —
`packages/fresh-ui/registry/components/ui/markdown.tsx.template`, listed in the `ai` collection of
`registry.manifest.ts:1409`. But `netscript ui add ai` copies registry items into
`apps/<app>/components/ui/`, whereas the plugin emits its island to the workspace-root `ai/`
namespace. The island and the component it imports are materialized by two different commands into
two different trees. That placement mismatch — not a missing component — is the real defect.

### R-4 — `plugin doctor` false green (issue defect 4) — CONFIRMED

```text
ai  healthy  Manifest resolved      AI Chat
ai  healthy  Workspace directory    plugins/ai
ai  healthy  Permission metadata    --allow-net --allow-env --allow-read
```

Exit `0`, with R-1/R-2/R-3 all live. "Workspace directory" asserts the *directory* exists — which it
does, holding only `scaffold.plugin.json`. Doctor has no check that (i) each module listed in
`netscript.config.ts` `plugins:` resolves, or (ii) each `NetScript.Plugins[*].Entrypoint` is
resolvable.

### R-5 — canonical E2E cannot catch any of this (issue defect 6) — CONFIRMED

`scaffold.runtime` (`packages/cli/e2e/suites/scaffold/capability-suites.ts:61`) already runs
`scaffold.plugin.ai`, `scaffold.plugin.ai.mcp`, `SCAFFOLD_PLUGIN_AI_LIFECYCLE`,
`SCAFFOLD_UI_ADD_AI`, and `GENERATED_UI_AI_CHECK`. It is nevertheless green because:

- `GENERATED_UI_AI_CHECK` (`ui-ai-gates.ts:56`) type-checks only
  `apps/<app>/islands/ui/McpUiWidget.tsx` and `apps/<app>/lib/ai/render-ui.tsx` — the **app**
  surface. The plugin-generated `ai/**` namespace is never selected by any check gate.
- No gate runs `generate runtime-schemas`; `GENERATED_PLUGINS_CHECK` runs `generate plugins`, which
  succeeds and masks R-2's failing order.
- `BEHAVIOR_PLUGINS_HEALTH` runs doctor, which is false-green per R-4.

## 3. jsr-audit surface scan (current state, plan-relevant)

- `@netscript/plugin-ai@0.0.5` `exports`: `.`, `./adapter-cli`, `./public`, `./plugin`, `./adapter`,
  `./scaffold`, `./contracts`. No `./services`, no `./doctor`. Any host-side rule keyed on "does the
  package export `/services`" must read the published export map, not guess.
- `plugins/ai/deno.json` `publish.include` covers `scaffold.plugin.json`, `src/**/*.ts`,
  `contracts/**/*.ts`. **A new emitted UI asset must be added to `publish.include` or it will not
  ship**, and the defect will survive as "works from local-path, broken from JSR".
- Stub sources are `defineStub`-typed `StubSource` strings; new stubs must stay type-checked by
  `plugins/ai/src/adapter/resources/resources.test.ts` rather than becoming raw template text.
- `deno.lock` must stay untouched: nothing here requires a new dependency **unless** the chosen
  markdown route pulls the unified/remark/rehype stack into the root import map. That is a decision
  the plan must resolve, not discover during implementation.

## 4. Open questions the plan must close

1. **Service-topology rule.** How does the host decide "this plugin has no service"? Candidates:
   (a) manifest-declared capability (e.g. `capabilities.hasService: false` / dropping
   `provider.defaultServiceEntrypoint` + `officialSource.serviceEntrypoint`), (b) verifying the
   resolved package actually exports `/services`, (c) both. Must be plugin-name-agnostic —
   `quality:scan` fails host-side hardcoded plugin names, and #745 is the precedent.
2. **`ai/mod.ts` shape.** A workers-style barrel of app-owned resources, versus renaming the
   existing `ai/ai.ts` composition root. Whatever is chosen must satisfy the loader that
   `generate runtime-schemas` uses.
3. **Markdown surface.** Emit an `ai/`-local component from the plugin (duplicates the registry
   item), have `plugin install ai` drive the existing CLI UI-registry application layer
   (`packages/cli/src/kernel/application/ui/registry.ts`) to materialize `markdown` into the AI
   namespace, or restructure the island so it consumes the app's component where `ui add ai`
   already puts it. This choice determines whether new npm dependencies (and a `deno.lock` change)
   are required.
4. **JSX config for the root workspace.** `ai/**` TSX cannot compile without
   `jsx`/`jsxImportSource` reaching the config that governs that path — root `deno.json`, a new
   `ai/deno.json` workspace member, or relocating the island into the app.
5. **E2E shape.** Which gate proves each invariant: a `generate runtime-schemas` gate, an
   `ai/**` targeted check gate, and a doctor-fails-on-broken-invariant negative gate.

## 5. Conclusion

Every acceptance item in #1443 is reproduced and mechanically explained; none is stale. The work is
**decision-heavy** — it spans plugin manifest metadata, host appsettings derivation, config-module
resolution, UI asset placement across two commands, doctor invariants, and the canonical E2E, and
questions 1–4 above each have more than one defensible answer with different blast radii. Per
`run-loop.md` §4 this run therefore **selects PLAN-EVAL** as a hard stop before any source edit.

---

# Research addendum — #1445, the shared configured-module contract

Added after the owner-authorized rescope (`drift.md` D-6). §1–5 above are #1443/AI-scoped; this
addendum re-baselines the research for the widened scope, per PLAN-EVAL cycle 4 finding 1.

## A-1 — the real loader contract (supersedes the §R-2 workers comparison)

§2's R-2 compared AI against `workers/mod.ts` and read the workers path as correct. It is not. Both
loaders exist and only one matters for `generate runtime-schemas`:

| Loader | Behavior | Used by |
| --- | --- | --- |
| `loadRegisteredPluginMetadata` (`plugin-registry.ts:163-184`) | reads a sibling `scaffold.plugin.json`; never imports the module | metadata-only callers |
| `loadRegisteredPlugins` (`:142-160` → `:123-137` → `:363-377`) | **imports** the module; resolves via `resolveExportedPluginManifest` (`:378-390`) | `generate runtime-schemas` (`public-command-dependencies.ts:329-340`) |

`resolveExportedPluginManifest` accepts a **default export first**, and only otherwise requires a
**sole** named manifest-shaped value. A module with a default plus other named manifests resolves
fine — the "multiple ⇒ ambiguous" reading was wrong and is corrected in D7.

Proven empirically, not read: a probe module exporting a plain object, **with a sibling
`scaffold.plugin.json` present**, is rejected —

```text
plugins: ['./probe/mod.ts']
Error: Plugin spec "./probe/mod.ts" does not export a plugin manifest.
```

## A-2 — six-plugin manifest inventory (D4a feasibility)

Every first-party package already exports a `PluginManifest`-shaped value, so D4a is a re-export in
all six cases and no manifest has to be authored:

| Plugin | Exported manifest | Source |
| --- | --- | --- |
| `ai` | `aiPlugin` | `plugins/ai/mod.ts` |
| `auth` | `authPlugin` | `plugins/auth/mod.ts` |
| `sagas` | `sagasPlugin` | `plugins/sagas/mod.ts` |
| `streams` | `streamsPlugin` | `plugins/streams/mod.ts` |
| `triggers` | `triggersPlugin` | `plugins/triggers/mod.ts` |
| `workers` | `workersPlugin` (`PluginManifest`-annotated at `src/public/mod.ts:149`) | `plugins/workers/mod.ts` |

**Additivity risk:** none of the emitted barrels currently exports a manifest-shaped value, so adding
one yields exactly one. S10 re-asserts this per package rather than assuming it, and prefers the
default-export form where a future collision is possible.

## A-3 — generated-namespace import surfaces

`workers` is a confirmed second instance of the AI import defect: `workers/jobs/health-check.ts:8`
imports `zod`, absent from the generated import map. Observed in the reproduction project:

```text
Error: Import "zod" not a dependency
  hint: If you want to use the npm package, try running `deno add npm:zod`
    at fresh/workers/jobs/health-check.ts:8:19
```

The seam is the per-kind data registry `PLUGIN_KIND_SOURCE_IMPORTS` / `PLUGIN_KIND_ROOT_IMPORTS`
(`workspace-mutator.ts:64-140`), already keyed by kind, with a local-source vs JSR branch at
`:377-428`. Both branches need coverage: kind-source jsr pins are prod/JSR-only, while local-source
projects resolve the same packages as copied workspace members.

## A-4 — maintainer chain (D1 consumer surface)

The service fields flow further than §3 recorded: `official-plugin-source.ts:93-107,219-251` →
`copy-official-plugin.ts:174-176` → `official-plugin-copier.ts:11-25` (unconditional mapping) →
`sync-plugin.ts:32-52` (public result). All four are S1's, and the service-less representation is
locked in D1.

## A-5 — jsr surface for the widened scope

S10/S11 touch five published connectors beyond AI. Each package's `publish.include` must be
re-verified per package rather than generalized from `plugins/ai`; a new emitted artifact outside
`src/`, `deno.json`, or `contracts/` silently fails to ship and reproduces #1443's
"works from local-path, broken from JSR" signature.
