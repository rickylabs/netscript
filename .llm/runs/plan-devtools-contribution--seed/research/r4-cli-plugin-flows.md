# repo:cli-flows — CLI plugin lifecycle and generators (`packages/cli`)

Baseline: `main` @ `2256a67bf`, worktree `/home/codex/repos/ns-rfc-devtools-contribution`.
All paths below are repo-relative. Read-only pass; no source or GitHub mutation.

## Summary

The public CLI is a Cliffy command tree assembled declaratively: a `CliCommandRegistry`
(`packages/cli/src/public/composition/cli-command-registry.ts:29-73`) materializes top-level groups
listed in `packages/cli/src/public/features/root/public-command-tree.ts:53-102` (`agent`, `config`,
`deploy`, `init`, `db`, `generate`, `marketplace`, `plugin`, `service`, `ui add`, `ui init`). The
plugin lifecycle lives entirely under the `plugin` group
(`packages/cli/src/public/features/plugins/plugins-group.ts:29-146`): `list`, `new`, `scaffold`,
`install`, `ai`, `sync`, `info`, `update`, `remove`, `doctor`, `item-add`, `auth`, plus
auto-generated pass-through commands for the remaining framework verbs (`enable`, `disable`,
`setup`) that simply `deno x`/`deno run` the plugin's own published CLI.

Installation is **plugin-owned**: the host CLI resolves a JSR package (or a `--local-path`
directory), validates its `scaffold.plugin.json` manifest, registers the manifest-declared kind
provider into the in-memory `PluginKindRegistry`, then dispatches the plugin's own scaffolder as a
subprocess; if no package resolves and no process runner exists, install hard-fails
(`install-plugin.ts:145-153`). The only kind provider compiled into the CLI is `api`
(`packages/cli/src/kernel/application/registries/plugin-kind-registry.ts:12-17`); everything else
(`worker`, `saga`, `trigger`, `stream`, `ai`, `auth`) is a **bare alias to a `@netscript/plugin-*`
JSR package** (`install/plugin-package-resolver.ts:2-13`).

There are **two distinct registry generators**, and they are not the same code path.
`netscript generate plugins` (and `plugin sync`, which delegates to it) runs the *manifest-driven
installed-runtime generator*, which reads each installed package's `scaffold.runtime.json`, and
shells out to the plugin's declared generator command, then asserts the declared `registryPath`
files exist (`generate/plugins/installed-runtime-registry-generator.ts:64-116`). Meanwhile
`plugin update` and `plugin item-add` use the *SDK walker pipeline* (`FilesystemWalker` →
`AstExtractor` → `RegistryEmitter`), which regex-scans exported `defineJob` / `defineSaga` /
`defineWebhook` call sites and emits `.netscript/generated/<axis>.registry.ts`
(`packages/plugin/src/sdk/discovery/ast-extractor.ts:4-8`,
`packages/plugin/src/sdk/discovery/registry-emitter.ts:6-19`).

`netscript generate runtime-schemas` is a separate flow: it collects `runtimeConfig.schemas` from
registered plugin metadata and writes JSON Schema files to paths declared in
`config.runtimeConfig.paths` (`features/root/public-command-dependencies.ts:330-343`,
`generate/runtime-schemas/generate-runtime-schemas.ts:105-120`).

There is **no `plugin dev` / watch loop anywhere in the CLI**. The only "watch" in the plugin
surface is the `--watch` / `--watch-hmr` flag string a kind provider contributes to generated Aspire
registration (`domain/plugin-kind.ts:71`, `install/install-plugin.ts:597-642`). Regeneration is
always explicit and command-triggered.

## Findings

### F1 — Plugin command surface (observed)

`packages/cli/src/public/features/plugins/plugins-group.ts:29-146` builds:

| Command | Args | Real flags | Source |
| --- | --- | --- | --- |
| `plugin list` | — | `--project-root`, plus output flags in file | `list/list-plugins-command.ts:82-90` |
| `plugin new <name>` | `<name>` | `--project-root`, `--feature`, `--force`, `--register` (default true) | `new/new-plugin-command.ts:50-66` |
| `plugin scaffold <name>` | `<name>` | `--target`, `--project-root`, `--force` | `scaffold/scaffold-plugin-command.ts:46-51` |
| `plugin install <kind>` | `<kind>` | `--name`, `--port`, `--service-refs`, `--plugin-refs`, `--db`, `--no-db`, `--saga-store-backend`, `--samples`/`--no-samples`, `--mcp`, `--skip-confirmation`, `--ci`, `--dry-run`, `--jsr-url`, `--local-path`, `--no-copy-source`, `--project-root`, `--force` | `install/install-plugin-command.ts:29-55` |
| `plugin ai <verb> …` | raw args | `useRawArgs()`; `--project-root` extracted manually | `ai/ai-plugin-command.ts:45-58` |
| `plugin sync` | — | `--project-root` | `host/host-plugin-command.ts:34-46` |
| `plugin info <pkg> [...args]` | pkg + passthrough | `--project-root` | `info/info-plugin-command.ts:21-28` + `dispatch/plugin-verb-command.ts:44-63` |
| `plugin update <name>` | `<name>` | `--project-root` | `update/update-plugin-command.ts:33-37` |
| `plugin remove <name>` | `<name>` | `--pkg`, `--project-root`, `--skip-dispatch` | `remove/remove-plugin-command.ts:44-53` |
| `plugin doctor` | — | `--project-root`, `--resource` (default `project`) | `doctor/doctor-plugin-command.ts:52-62` |
| `plugin item-add <name> <item> [...args]` | 2 + passthrough | `--project-root` | `item/add-plugin-item-command.ts:20-35` |
| `plugin auth …` | — | see `auth/auth-plugin-command.ts` | `plugins-group.ts:118-125` |
| `plugin enable\|disable\|setup <pkg> [...args]` | pkg + passthrough | `--project-root` | generated from `FRAMEWORK_VERBS` minus `CONCRETE_VERBS`, `plugins-group.ts:20-27,127-145` |

`FRAMEWORK_VERBS = install, remove, enable, disable, sync, setup, update, doctor, info`
(`dispatch/dispatch-plugin-verb.ts:14-24`). Six of these are implemented host-side (`CONCRETE_VERBS`,
`plugins-group.ts:20-27`); the other three are pure subprocess pass-throughs.

Adjacent group: `netscript marketplace search|publish`
(`packages/cli/src/public/features/marketplace/marketplace-group.ts:8-17`).

### F2 — `plugin doctor` check inventory (observed)

Aggregation and rendering: `doctor/doctor-plugin-command.ts:66-113`; checks in
`doctor/doctor-plugin-use-case.ts:82-300`. Enumerated checks:

1. **Config load** — if `netscript.config.ts` fails to load, emits one `config:<i>:<path>` error per
   Zod issue, or a single `config-load` error (`doctor-plugin-use-case.ts:412-447`).
2. **AppHost inspection** (only when an `AppHostInspector` is wired; production wires
   `AspireAppHostDoctorInspector`, `public-command-dependencies.ts:308-314`):
   `apphost:inspection-unavailable` (warning), `apphost:not-running` (warning), and per configured
   resource `apphost:missing:<name>` (error) / `apphost:resource:<name>`. A resource is `healthy`
   only when state=running AND healthStatus=healthy AND non-empty `healthReports`; healthy-but-no-
   readiness-evidence downgrades to warning (`doctor-plugin-use-case.ts:112-176`). Resource set =
   services ∪ apps ∪ database names (`:178-188`).
3. **`manifest-resolution`** — plugin manifests could not be resolved at all (`:100-104`).
4. **`manifest`** — per-plugin manifest resolved; `plugin.manifestError` yields an error check whose
   remediation string is literally `Run: netscript plugin sync` (`:190-205`).
5. **`workdir`** — configured workdir exists on disk; missing ⇒ warning, not error (`:244-257`).
6. **`permissions`** — plugin declares ≥1 permission; none ⇒ warning (`:259-267`).
7. **`auth-backend`** — only when the plugin's manifest `cli.doctorChecks` includes `auth-backend`;
   reports the active auth backend (`:216-242`).
8. **Plugin-contributed checks** — if the plugin metadata carries a `doctor` entrypoint, the module
   is dynamically imported, a matching `NetScriptPlugin` export located, and every
   `adapter.doctor.extraChecks[].run(ctx)` executed with a read-only, `dryRun: true`
   `PluginCommandContext`; results map to `plugin:<i>:<name>` healthy/error. Import failure ⇒
   `plugin-doctor-import` error (`:278-330`).

Side effect: doctor always writes a diagnostic receipt via
`FilesystemDiagnosticEvidence(projectRoot)` from `@netscript/mcp`, and exits 1 with a summary when
any report is `error` (`doctor-plugin-command.ts:66-91`). Aggregate: any error ⇒ error, any warning
⇒ warning (`doctor-plugin-use-case.ts:269-273`).

### F3 — `generate plugins` is manifest-driven, not walker-driven (observed)

`generate/generate-group.ts:14-31` registers `generate aspire|runtime-schemas|plugins`. The
`plugins` command (`generate/plugins/generate-plugin-registries-command.ts:47-70`) takes
`--dry-run`, `--project-root`, `--verbose` and delegates to `dependencies.generate`, bound in
`features/root/public-command-dependencies.ts:209,350` to
`createInstalledRuntimeRegistryGenerator`. That generator
(`generate/plugins/installed-runtime-registry-generator.ts:64-116`):

- discovers installed runtime packages in the project;
- resolves `scaffold.runtime.json` in precedence order: workspace member root → `SOURCE_ROOT_MARKER`
  local-source root → published JSR package file URL (404 ⇒ skip) (`:118-163`);
- reads `runtimeRegistryGenerator` (`{command, args}`) and `runtimeRegistries[]`
  (`{dir, registryPath, exclude?, fileSuffixes?, pluginDirs?}`) (`:13-33`);
- counts registrable items and throws `EmptyPluginRegistryError` if zero (`:82-84`,
  `generate-installed-plugin-registries.ts:20-25`);
- runs the plugin's generator subprocess, then **verifies each declared `registryPath` exists on
  disk** and errors otherwise (`:106-114`).

So output paths are declared by the *plugin*, not by the CLI.

The walker/emitter path is separate and hardcodes its output: `.netscript/generated/<axis>.registry.ts`
with axes `jobs`, `sagas`, `triggers` derived from `defineJob`/`defineSaga`/`defineWebhook`
(`packages/plugin/src/sdk/discovery/ast-extractor.ts:4-8`,
`packages/plugin/src/sdk/discovery/registry-emitter.ts:14-19`). The walker skips `.data`, `.git`,
`.netscript`, `node_modules`, `dist`, `build`, `coverage` and only `.ts/.tsx/.js/.jsx/.mts/.mjs`
(`packages/plugin/src/sdk/discovery/filesystem-walker.ts:3-12,49-58`). Extraction is regex over
comment/string-stripped text, matching `export const X = defineJob(` and `export default defineJob(`
(`ast-extractor.ts:36-62`) — the class is named `AstExtractor` but is not an AST parse.

### F4 — `generate runtime-schemas` (observed)

Flags: `--verbose`, `--dry-run`, `--force`, `--project-root`
(`generate/runtime-schemas/generate-runtime-schemas-command.ts:41-46`). Its request is built in
`public-command-dependencies.ts:332-343`: load config, `loadRegisteredPlugins`, map each plugin to
`{pluginName, schemas: plugin.runtimeConfig?.schemas ?? []}`, and take output paths from
`config.runtimeConfig?.paths` (a `Record<topic, {schemaPath}>`,
`generate-runtime-schemas.ts:28-46`). Writes are skipped when content is unchanged unless `--force`
(`:105-125`).

### F5 — `plugin sync` is an alias, not a loader (observed)

Despite the file living under `host/` and the class id `plugin.host`, `sync` only calls
`generate({dryRun:false, projectRoot})` and prints `Synchronized N registry file(s) via
\`netscript generate plugins\`` (`host/host-plugin-command.ts:34-47`). The other host modules
(`discover-plugins.ts:22-30` reading `config.plugins`, `load-plugin-contributions.ts:5-12` merging
manifests, `plugin-loader.ts`) are library code not reachable from `sync`.

### F6 — No `plugin dev` loop (observed / negative)

`rtk grep -rn "\"dev\"|'dev'" packages/cli/src --include=*.ts` (excluding tests) returns zero
matches, and no `--watch` file-watching exists in `packages/cli/src/public` other than the
`--watch`/`--watch-hmr` string a kind provider emits into Aspire registration
(`packages/cli/src/kernel/domain/plugin-kind.ts:71`,
`install/install-plugin.ts:597,616,638-643`). Regeneration is only triggered by `generate plugins`,
`plugin sync`, `plugin update`, `plugin item-add`, and `plugin remove` (helper regeneration).

### F7 — local-path vs JSR resolution branch (observed)

Single branch point: `resolvePluginDescriptorBeforePlanning`
(`install/install-plugin.ts:326-356`).

- `--local-path` ⇒ `resolveLocalPluginDescriptor(localPath, registry, fs)`: reads
  `<path>/scaffold.plugin.json`, `parsePluginManifest`, registers the manifest's provider into the
  kind registry, synthesizes a descriptor, `source = {kind:'local-path', path}`
  (`:366-411`).
- otherwise the spec is `--jsr-url ?? <kind>`; a bare alias in `BARE_PLUGIN_PACKAGE_ALIASES`
  (`ai, auth, saga(s), stream(s), trigger(s), worker(s)` → `@netscript/plugin-*`,
  `install/plugin-package-resolver.ts:2-13`) or a leading `@` / `jsr:` makes it package-resolvable;
  anything else returns `undefined` (and install then fails at `:145-153`). The JSR path runs the
  `JsrPluginValidatorPort`, registers the manifest provider, and pins
  `source = {kind:'jsr', specifier: jsr:<pkg>@<version>}` (`:337-356`).

Downstream the same `source.kind` discriminator picks: doctor entrypoint form (file URL vs
`<jsr spec>/doctor`, `:260-270`), JSR schema-fragment fetching for DB plugins (`:186-196`), and the
scaffold dispatch target (`dispatch/dispatch-plugin-verb.ts:82-93`). Verb dispatch pins
`@netscript/*` CLIs to `NETSCRIPT_RELEASE_VERSION` and appends `/cli`
(`dispatch-plugin-verb.ts:72-79`), using a lockstep local URL when available, else `deno x -A`
(`:96-118`).

### F8 — Install writes `scaffold.plugin.json` with a reversal snapshot (observed)

`persistPluginMetadata` writes the resolved manifest plus a `netscriptInstall` block containing
`rootDenoJsonBefore/After` and `managedFilesBefore/After` for
`plugins/deno.json`, `plugins/mod.ts`, `services/_shared/plugin-service-context.ts`
(`install/install-plugin.ts:240-320`). This file is the identity source removal later reads.

### F9 — Update path (observed)

`plugin update <name>` is *not* a version-aware upgrade: it re-runs `installPlugin` with
`kind = pluginName`, `overwrite: true`, `ci: true`, `skipConfirmation: true`, `includeSamples:false`,
then runs the **walker** pipeline and writes every emission under the project root, printing the
resolved version or `local` (`update/update-plugin-command.ts:38-71`). Because `kind` is the
installed local name, resolution depends on that name hitting a bare alias or being `@scope/pkg`
(F7) — an installed plugin named e.g. `billing` resolves nothing.

### F10 — Remove path and artifact cleanup (observed)

`removePlugin` (`remove/remove-plugin.ts:66-127`) plans first
(`remove/plugin-removal-plan.ts:29-66`), snapshots every touched path, optionally dispatches the
`remove` verb to the plugin CLI (`--skip-dispatch` opts out), then:
appsettings entries removed → `netscript.config.ts` plugin declaration removed →
`.netscript/generated/<name>` and `.netscript/generated/plugin-<name>` removed →
`database/<engine>/schema/plugins/<name>` dirs removed (`plugin-removal-plan.ts:41-47,115-129`) →
plugin dir (`<root>/<name>` or `<root>/plugins/<name>`) removed → managed root `deno.json` reversed
from the install snapshot → managed install files reversed only when no plugins remain →
plugin references reconciled → Aspire helpers regenerated → empty generated parents pruned. Any
failure restores all snapshots and raises `IoError` (`remove-plugin.ts:111-127`).

Note: the axis registries emitted by the walker (`.netscript/generated/jobs.registry.ts` etc.) are
**not** per-plugin directories, so they are not covered by the `generatedDirs` cleanup and are not
regenerated by remove.

### F11 — Where a new kind is known to the CLI (observed)

Two layers:

- **Plugin kind (install/scaffold archetype)** — `PluginKindProvider` shape in
  `packages/cli/src/kernel/domain/plugin-kind.ts:52-138`; compiled defaults in
  `packages/cli/src/kernel/application/registries/plugin-kind-registry.ts:12-17` (today only
  `['api', apiKindProvider]`, provider at
  `packages/cli/src/kernel/adapters/plugin/kinds/api.kind.ts:10-34`, barrel
  `.../kinds/plugin-kind-providers.ts:7`). At runtime a kind can instead arrive from the installed
  manifest's `provider` and be registered dynamically (`install/install-plugin.ts:346-349,393-396`),
  and unknown kinds throw `Unknown plugin kind "<kind>"` with `supportedKinds`
  (`plugin-kind-registry.ts:42-50`, consumed by `install/plan-plugin-install.ts:94`).
- **Contribution axis (registry generation)** — the walker path hardcodes the axis table in
  `packages/plugin/src/sdk/discovery/ast-extractor.ts:4-8`; `plugin list` hardcodes a second
  plugin→axis map `{workers: jobs, sagas: sagas, triggers: triggers}`
  (`list/list-plugins-command.ts:24-28`). The manifest-driven path needs no CLI edit — the plugin
  declares `runtimeRegistries`/`runtimeRegistryGenerator` in its `scaffold.runtime.json`
  (`installed-runtime-registry-generator.ts:13-33`).

Files a contributor would edit for a *first-party* new kind, minimum set:
`packages/cli/src/kernel/adapters/plugin/kinds/<kind>.kind.ts` (new),
`.../kinds/plugin-kind-providers.ts`,
`packages/cli/src/kernel/application/registries/plugin-kind-registry.ts`,
`packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts` (bare alias),
`packages/plugin/src/sdk/discovery/ast-extractor.ts` (if a new contribution axis),
`packages/cli/src/public/features/plugins/list/list-plugins-command.ts` (axis display).

### F12 — `plugin item-add` executes project-local plugin CLI code (observed)

`item/add-plugin-item-command.ts:34-77`: requires `<root>/plugins/<name>/cli.ts`, dynamically
imports it, calls its default `PluginCliEntrypoint` with `{command:'add', values:[item, ...args]}`,
exits 69 if absent/not a function, then runs the walker pipeline and writes emissions. This is the
only contribution-item scaffolding entry point in the host CLI.

### F13 — `plugin new` vs `plugin scaffold` (observed)

`plugin new <name>` generates a "dual-tier" plugin with kind `feature` (with `--feature`) or `proxy`,
and registers it in `netscript.config.ts` unless `--register` is disabled
(`new/new-plugin-command.ts:50-80`). `plugin scaffold <name>` writes a plugin *package* to `--target`
(`scaffold/scaffold-plugin-command.ts:46-51`). Neither goes through the JSR install path.

## Contracts

- `PluginKindProvider` — `packages/cli/src/kernel/domain/plugin-kind.ts:52-138`.
- `PluginKindRegistry` (`register/get/entries/getAll/has/kinds`) —
  `packages/cli/src/kernel/application/registries/plugin-kind-registry.ts:20-70`.
- `CliCommandFactory<TContext>` / `CliCommandRegistry.program()` —
  `packages/cli/src/public/composition/cli-command-registry.ts:8-73`.
- `GenerateInstalledPluginRegistries` + `GeneratedPluginRegistry` + `EmptyPluginRegistryError` —
  `packages/cli/src/public/features/generate/plugins/generate-installed-plugin-registries.ts:1-25`.
- `RuntimeRegistryTarget` / `RuntimeRegistryGeneratorDeclaration` (`scaffold.runtime.json` shape) —
  `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:13-33`.
- `PluginDoctorCheck` / `PluginDoctorReport` / `PluginDoctorDependencies` / `AppHostInspector` —
  `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts:17-79`.
- `FRAMEWORK_VERBS` / `PluginScaffoldDispatchSource` —
  `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:14-45`.
- `ResolvedPluginPackageSpec` / `BARE_PLUGIN_PACKAGE_ALIASES` —
  `packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts:2-36`.
- `ExtractorPort.ExtractedContribution{file,symbol,axis}` / `EmitterPort.RegistryEmission{path,text}` —
  `packages/plugin/src/sdk/discovery/ports/extractor-port.ts:9-13`,
  `packages/plugin/src/sdk/discovery/ports/emitter-port.ts:13-15`.
- `RemovePluginResult` / `PluginRemovalPlan` / `PluginInstallState` —
  `packages/cli/src/public/features/plugins/remove/remove-plugin.ts:30-46`,
  `remove/plugin-removal-plan.ts:8-27`.

## Drift candidates

1. **Docs claim kind-named installs; code resolves packages.**
   `.agents/skills/netscript-cli/commands.md` documents `plugin install` "supported local
   contributor kinds" `worker|saga|trigger|stream`, and omits `--jsr-url`, `--local-path`,
   `--no-copy-source`, `--mcp`, `--dry-run`, `--ci`, `--skip-confirmation`,
   `--saga-store-backend`. In code those kinds are only JSR aliases
   (`install/plugin-package-resolver.ts:2-13`) and install fails without a resolvable package
   (`install/install-plugin.ts:145-153`). Severity: significant.
2. **Docs omit half the plugin group.** `commands.md` lists install/list/info/update/remove/doctor
   only; the tree also exposes `new`, `scaffold`, `sync`, `ai`, `auth`, `item-add`, `enable`,
   `disable`, `setup` (`plugins-group.ts:36-145`). Severity: minor.
3. **`plugin sync` name vs behavior.** Described as host-side plugin loader (module lives in
   `host/`, id `plugin.host`), but is a thin alias for `generate plugins`
   (`host/host-plugin-command.ts:34-47`); `host/plugin-loader.ts` and
   `host/load-plugin-contributions.ts` are unreachable from it. Severity: significant.
4. **Two divergent registry generators.** `generate plugins` uses manifest-declared
   `registryPath`s; `plugin update` and `plugin item-add` use the walker emitting
   `.netscript/generated/<axis>.registry.ts` (`update/update-plugin-command.ts:56-66`,
   `item/add-plugin-item-command.ts:63-73` vs
   `installed-runtime-registry-generator.ts:64-116`). A plugin can therefore have its registry
   written by two mechanisms with different paths. Severity: architectural.
5. **`AstExtractor` is regex-based**, not AST-based, and only recognizes three hardcoded builders
   (`packages/plugin/src/sdk/discovery/ast-extractor.ts:4-8,36-62`). Severity: significant for any
   RFC that adds contribution kinds.
6. **`plugin update` is a forced reinstall keyed on the installed local name**
   (`update/update-plugin-command.ts:42-55`), so a custom-named plugin cannot be updated through the
   alias/scoped-name resolver (F7). Severity: significant.
7. **Only `api` is a compiled-in kind** (`plugin-kind-registry.ts:12-17`) while docs and the E2E
   flow speak in terms of worker/saga/trigger/stream kinds. Severity: minor (by design — kinds are
   manifest-supplied — but undocumented as such).

## Open questions

1. Which generator is authoritative when a plugin declares `runtimeRegistries` *and* exports
   `defineJob`-style contributions? Both can write, to different paths.
2. Is `.netscript/generated/<axis>.registry.ts` cleaned on `plugin remove`? Removal only deletes
   `.netscript/generated/<name>` and `plugin-<name>` (`plugin-removal-plan.ts:41-45`).
3. What discovers "installed runtime packages" (`discoverInstalledRuntimePackages`) — not read in
   this pass; determines which packages the manifest generator considers.
4. Does any manifest schema constrain `provider` (the dynamic `PluginKindProvider`) shape at
   validation time, or only structurally at `normalizeManifestProvider`?
5. Is `plugin auth` a special-cased contribution kind or a plugin-owned pass-through with host
   privileges (it takes `fs`, `sessions`, and an Aspire regenerator directly,
   `plugins-group.ts:118-125`)?
6. `marketplace search|publish` — what backing index? Relevant to how a third-party contribution
   kind becomes discoverable.

## Sources

All repo-local, at `main` @ `2256a67bf`:

- `packages/cli/src/public/features/plugins/plugins-group.ts`
- `packages/cli/src/public/features/plugins/{install,doctor,remove,update,host,info,list,new,scaffold,item,ai,dispatch}/*`
- `packages/cli/src/public/features/generate/{generate-group.ts,plugins/*,runtime-schemas/*}`
- `packages/cli/src/public/features/root/public-command-{tree,dependencies}.ts`
- `packages/cli/src/public/composition/{cli-command-registry.ts,create-public-cli.ts}`
- `packages/cli/src/kernel/domain/plugin-kind.ts`
- `packages/cli/src/kernel/application/registries/plugin-kind-registry.ts`
- `packages/cli/src/kernel/adapters/plugin/kinds/{api.kind.ts,plugin-kind-providers.ts}`
- `packages/plugin/src/sdk/discovery/{ast-extractor.ts,registry-emitter.ts,filesystem-walker.ts,ports/*}`
- `.agents/skills/netscript-cli/commands.md` (documented surface, used only for drift comparison)

Commands run (evidence): `rtk grep -rn "\"dev\"|'dev'" packages/cli/src --include=*.ts` (0 matches
outside tests); `rtk grep -rn "watch" packages/cli/src/public --include=*.ts` (only
`install-plugin.ts` watch-flag parsing).
