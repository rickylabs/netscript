# repo:plugin-axes — the plugin manifest and its contribution axes

Baseline: `main` @ `2256a67bf`, worktree `/home/codex/repos/ns-rfc-devtools-contribution`.
Read-only survey. Every claim below carries a `path:line` citation or a command that was run.

## Summary

NetScript has **two disjoint plugin manifests**, not one. (1) A **TypeScript runtime manifest**
(`PluginManifest`, `packages/plugin/src/config/domain/plugin-manifest.ts:7-34`) built by a fluent
builder (`definePlugin`) and carrying a `contributions` record — this is the "contribution axes"
model. (2) A **published JSON installer manifest** (`scaffold.plugin.json`,
`PluginInstallerManifest`, `packages/plugin/src/protocol/manifest.ts:139-164`) that is
`schemaVersion`-gated, zod-`.strict()`-validated, and drives install/scaffold/port/permission
wiring. A third JSON file, `scaffold.runtime.json`, declares generated runtime registries and is
**not** schema-validated at all. The two manifests do not reference each other; the same plugin
declares its service twice, once per model (`plugins/workers/scaffold.plugin.json:49-71` vs
`plugins/workers/src/public/mod.ts:63-68`).

There are **ten named contribution axes** in the enum (`CONTRIBUTION_AXES`,
`packages/plugin/src/domain/constants.ts:16-40`) but **twelve keys** on the actual
`PluginContributions` interface (`cli` and `doctor` exist as keys with no axis name), and the enum
is used only by a boolean validator that nothing in `packages/cli` calls. Most axes are declarative
data that **no host code reads**: of the twelve contribution keys, only `services`,
`runtimeConfigTopics` (as a presence bit), `doctor`, and `cli` are consumed by the CLI's registry
normalizer (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:461-471`). Lifecycle hooks
(`setup`/`beforeGenerate`/`afterGenerate`/`teardown`) are declared, typed, stored on the manifest,
and **never invoked by any host code**.

There is **no versioned-envelope pattern in the repo**. RFC #890's envelope
(`FrontendManifestEnvelope`, `{contract:{family,major}, pluginKind, base, contributions, requires,
budgets}`) exists only as a **planned** design under
`.llm/runs/plan-frontend-contrib--seed/design/canonical/01-contracts.md:62-110`. The shipped
versioning is a single integer literal, `schemaVersion: 1`, on `scaffold.plugin.json` only.

Discovery is config-driven, not filesystem-scanned: `netscript.config.ts` `plugins: string[]` is the
only source (`packages/cli/src/public/features/plugins/host/discover-plugins.ts:20-29`), plus a
second, independent discovery path that reads JSR entrypoints out of `appsettings.json` for runtime
registry generation
(`packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:290-306`).
Registry writes are **not transactional** anywhere: plugin-owned generators `Deno.writeTextFile` per
target (`plugins/workers/src/cli/runtime-registry-generator.ts:88-95`) and the host only checks the
file exists afterwards.

## Findings

### F1 — Two manifests, two shapes, one plugin

`PluginManifest` (TS, runtime/config side) —
`packages/plugin/src/config/domain/plugin-manifest.ts:7-34`: `name`, `version`, optional
`description`/`displayName`/`type`/`author`/`license`/`tags`/`permissions`/`metadata`, **required**
`contributions`, optional `hooks`, optional `dependencies`.

`PluginInstallerManifest` (JSON, `scaffold.plugin.json`) —
`packages/plugin/src/protocol/manifest.ts:139-164`: `schemaVersion` (literal `1`), `name`,
`version`, `displayName`, `description`, `peerDependencies`, `capabilities`, `scaffolder`, optional
`postScripts`, `provider`, `officialSource`, `linking`.

All six first-party plugins ship the second, none ship `linking` or `postScripts` — verified by
reading each `plugins/*/scaffold.plugin.json` key set (`ai auth sagas streams triggers workers`; all
have exactly `capabilities, description, displayName, name, officialSource, peerDependencies,
provider, scaffolder, schemaVersion, version`). So the `linking` axis
(`packages/plugin/src/protocol/manifest.ts:122-136`) is **declared but unexercised in-repo**.

### F2 — Contribution axis enumeration (the real seams)

Enum: `packages/plugin/src/domain/constants.ts:16-40` —
`service`, `background-processor`, `stream-topic`, `database-schema`, `runtime-config-topic`,
`contract-version`, `e2e`, `telemetry`, `migration`, `aspire`.

Actual interface keys: `packages/plugin/src/config/domain/plugin-contributions.ts:11-40` — the ten
above **plus** `cli.doctorChecks` and `doctor`. The enum and the interface are not kept in sync by
any type-level constraint; `isContributionAxis`
(`packages/plugin/src/config/validators/contribution-axis-validator.ts:3-5`) is a plain
`includes()` and has no non-test caller in `packages/cli`.

| Axis (key) | Payload type | Producer | Consumer found | Versioned |
|---|---|---|---|---|
| `services` | `ServiceContribution {name, entrypoint, port?}` (`service-contribution.ts:2-8`) | `.withService()` (`plugins/workers/src/public/mod.ts:63-68`) | `plugin-registry.ts:462-468` — **only `[0]` is read**, extra services silently dropped | no |
| `backgroundProcessors` | `{name, entrypoint, concurrency?}` (`background-processor-contribution.ts:2-9`) | `.withBackgroundProcessor()` (`mod.ts:69-80`) | no non-test consumer found in `packages/cli` | no |
| `streamTopics` | `{name, subject}` (`stream-topic-contribution.ts:2-7`) | `.withStreamTopics()` (`mod.ts:81-98`) | none found outside merge + `verify-plugin` | no |
| `databaseSchemas` | `{path, engine?: postgres\|mysql\|mssql\|sqlite}` (`db-schema-contribution.ts:2-7`) | `.withDbSchemas()` (`mod.ts:99`) | none found | no |
| `runtimeConfigTopics` | `{name, schemaPath?}` (`runtime-config-topic-contribution.ts:2-7`) | `.withRuntimeConfigTopics()` (`mod.ts:101`) | presence-only bit → `runtimeConfig: {schemas: []}` (`plugin-registry.ts:465-467`) | no |
| `contractVersions` | `{version, loader}` (`contract-version-contribution.ts:2-7`) | `.withContractVersions()` (`mod.ts:100`) | none found | payload names a version string; nothing validates it |
| `e2e` | `{name, command}` (`e2e-contribution.ts:2-7`) | `.withE2e()` (`mod.ts:102-105`) | none found | no |
| `telemetry` | `{name, module}` (`telemetry-contribution.ts:2-7`) | no first-party producer found in `plugins/workers` | none found | no |
| `migrations` | `{name, path}` (`migration-contribution.ts:2-7`) | no first-party producer in workers | none found | no |
| `aspire` | bare `string` module path (`plugin-contributions.ts:36`) | `.withAspire('./src/aspire/mod.ts')` (`mod.ts:106`) | `verify-plugin.ts:360` only | no |
| `doctor` | bare `string` module path (`plugin-contributions.ts:38`) | `.withDoctor('./src/adapter/plugin.ts')` (`mod.ts:107`) | `plugin-registry.ts:469` → `doctor-plugin-use-case.ts:280-326` (dynamic `import()`) | no |
| `cli.doctorChecks` | `readonly 'auth-backend'[]` — a **hardcoded literal union** (`plugin-contributions.ts:12-16`) | none in workers | `plugin-registry.ts:470` | no |

`cli.doctorChecks` being typed `'auth-backend'[]` is the sharpest evidence that the current axis set
is not open for third-party extension: adding a check requires editing `@netscript/plugin`.

### F3 — `mergeContributions` silently drops two axes

`packages/plugin/src/config/application/contribution-merger.ts:4-27` explicitly rebuilds nine array
axes plus `aspire` and `doctor` (last-writer-wins), but **never copies `cli`**. Since
`resolvePluginContributions`
(`packages/cli/src/public/features/plugins/host/load-plugin-contributions.ts:5-13`) folds every
plugin through `mergeContributions` starting from `{}`, any `cli.doctorChecks` contribution is
erased in the host loader path. It survives only on the separate `plugin-registry.ts:470` path,
which reads each manifest individually. This is a real divergence between the two host paths, not a
style issue.

Merge semantics for `aspire`/`doctor` are `right ?? left` — i.e. **silent override, no duplicate
detection**, no diagnostic.

### F4 — Lifecycle hooks are declared and never called

`PluginLifecycleHooks` typed at `packages/plugin/src/config/domain/plugin-lifecycle-hooks.ts:8-10`,
enumerated at `packages/plugin/src/domain/constants.ts:43-51`, populated by workers at
`plugins/workers/src/public/mod.ts:108-122`. Grepping both `packages/cli/src` and
`packages/plugin/src` for hook access outside tests yields exactly one hit —
`packages/plugin/src/config/builders/plugin-builder.ts:326` (`hooks: this.#state.hooks`), i.e. the
builder storing them. Command run:
`grep -rn "hooks?\.\|\.hooks\b" packages/cli/src packages/plugin/src --include=*.ts | grep -v _test`.
**No host invokes `setup`, `beforeGenerate`, `afterGenerate`, or `teardown`.**

### F5 — Versioning: `schemaVersion: 1` on the installer manifest only

`PLUGIN_MANIFEST_SCHEMA_VERSION = 1` (`packages/plugin/src/protocol/manifest.ts:4`). `parsePluginManifest`
(`:307-330`) reads `schemaVersion` **before** zod, and returns a structured error
`Unsupported plugin manifest schemaVersion N; expected 1` for any mismatch (`:309-316`). Two gaps:

- A manifest with **no** `schemaVersion` key passes the pre-check (`readSchemaVersion` returns
  `undefined`, `:332-338`) and is then rejected by zod's `z.literal(1)` (`:271`) — so the failure
  mode differs (nice message vs generic issue) but both fail. Verified by reading, not executed.
- The schema is `.strict()` (`:283`), so **any unknown top-level field is a hard reject** — additive
  evolution is impossible without a major bump. This is precisely the failure RFC #890's envelope
  design was written to avoid (see F6).

The TS `PluginManifest` has **no version field of its own** at all: `PluginManifestSchema`
(`packages/plugin/src/config/validators/manifest-schema.ts:5-27`) validates `name`/`version`
(package version, not contract version) and then reduces `contributions` to
`z.record(z.string(), z.unknown())` — i.e. **contribution payloads are entirely unvalidated at the
manifest boundary.** Same for `hooks`.

`scaffold.runtime.json` carries `"schemaVersion": 1` (`plugins/workers/scaffold.runtime.json:2`) but
`readRuntimeManifest`
(`packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:320-359`)
never reads it. **Unknown/incompatible runtime-manifest versions are silently accepted.**

### F6 — RFC #890's versioned envelope is design-only, not code

`gh pr view 890 --json files` (run) shows #890 is a **merged docs/RFC PR** titled
"RFC: Frontend Contribution Layer — plugins that ship UI"; every file it touched is under
`.llm/runs/plan-frontend-contrib--seed/`. The envelope is specified at
`.llm/runs/plan-frontend-contrib--seed/design/canonical/01-contracts.md:62-110`:

```ts
export interface FrontendManifestEnvelope {
  readonly contract: { readonly family: 'app'; readonly major: 1 } | FamilyRef;
  readonly pluginKind: string;
  readonly base?: string;
  readonly contributions: readonly unknown[];   // family payload, validated by family schema
  readonly requires?: FrontendRequires;
  readonly budgets?: FrontendBudgets;           // :100-107
}
export interface FamilyRef { readonly family: string; readonly major: number }
```

Carried: **version** (`major`), **kind** (`family` + per-contribution `pluginKind`), **payload**
(`contributions`, opaque to the envelope), **capabilities/requirements** (`requires`), and
**budgets**. Evolution rules pinned at `01-contracts.md:88-99`: optional field = minor, payloads
`.passthrough()`, new kind/discriminant = new major, hosts declare supported `(family, major)`
windows in a `HostSurfaceDescriptor` and **quarantine** outside the window. Multi-family export is
"one envelope or an array of envelopes" (`:109-113`). Grepping `docs/` for `890`, `versioned
envelope`, `VersionedEnvelope`, or `schemaVersion` returned nothing — the pattern has no doctrine
home and no implementation. `inference`: a DevTools family would be the **second** family under this
envelope and is therefore its first real multi-family test, but that is inferred from the design
text, not from shipped code.

### F7 — Discovery: two independent, non-agreeing mechanisms

**(a) Config-declared specs.** `netscript.config.ts` → `config.plugins: readonly string[]`
(`packages/cli/src/public/features/plugins/host/discover-plugins.ts:20-29`;
`packages/cli/src/kernel/adapters/config/plugin-registry.ts:185-188`). Specs are resolved either by
dynamic `import()` of the module (`plugin-registry.ts:362-374`, `:403-411`: relative/absolute paths
get `mod.ts` appended and `toFileUrl`d; bare specs are imported as-is) or, in the metadata-only
path, by reading the sibling `scaffold.plugin.json` (`:190-206`).

Manifest identification after import is **structural duck-typing**, not a branded type:
`isPluginManifest` (`:393-403`) accepts any object with string `name`, string `version`, and an
object `contributions`. Selection rule (`:376-391`): a `default` export wins; otherwise **exactly
one** matching named export is required, and if there are two or more the manifest resolves to
`undefined` → `Plugin spec "X" does not export a plugin manifest.` (`:369-371`).

**(b) `appsettings.json` JSR entrypoints.** For runtime registry generation, installed packages are
discovered by scanning `NetScript.Plugins.*.Entrypoint` for `jsr:@scope/name@version...`
(`installed-runtime-registry-generator.ts:290-311`). Non-JSR entrypoints are skipped outright
(`:303`). This path never consults `netscript.config.ts`, so **the two discovery sets can disagree**.

Manifest source resolution for (b) is a three-step fallback (`:114-163`): local workspace member →
`.netscript` source-root marker → `https://jsr.io/@scope/name/<version>/scaffold.runtime.json`, with
`404 → skip`, other non-ok → throw.

There is also a generic SDK discovery/emit pipeline (`WalkerPort`/`ExtractorPort`/`EmitterPort`,
composed at `packages/cli/src/public/features/plugins/host/plugin-loader.ts:76-96`) whose emitter
writes `.netscript/generated/<axis>.registry.ts`
(`packages/plugin/src/sdk/discovery/registry-emitter.ts:11-20`). In the `generate plugins` command
the walker/extractor/emitter are held but explicitly described as "retained for plugin item
add/update commands" (`generate-plugin-registries-command.ts:26-33`) — the authoritative generator
is the manifest-driven one.

### F8 — Generated registries: where, by what, and how safe

| Registry | Path | Written by | Command |
|---|---|---|---|
| Per-axis SDK registry | `.netscript/generated/<axis>.registry.ts` (`registry-emitter.ts:17`) | `RegistryEmitter` (returns text; host writes) | header says "regenerated by `netscript generate plugins`" (`:54`) |
| Plugin runtime registry | declared per target, e.g. `.netscript/generated/plugin-workers/job-registry.ts` (`plugins/workers/scaffold.runtime.json:29`) | plugin-owned subprocess generator | `netscript generate plugins` (`generate-plugin-registries-command.ts:48-69`) |
| Runtime config JSON Schemas | `<topic>/runtime/schema.json` or configured path (`generate-runtime-schemas.ts:151-160`) | CLI | `generate runtime-schemas` |

**Not transactional.**
- The host spawns the plugin's own generator as `deno run --allow-read --allow-write <generatorUrl>`
  with `--project-root`, `--manifest`, plugin args, `--official-samples false`
  (`installed-runtime-registry-generator.ts:406-421`). The plugin writes directly:
  `Deno.mkdir(recursive)` then `Deno.writeTextFile` per target, no temp file, no rename
  (`plugins/workers/src/cli/runtime-registry-generator.ts:88-95`). A crash between targets leaves a
  partially-updated registry set.
- After the subprocess exits, the host only asserts **existence** of each declared `registryPath`
  (`installed-runtime-registry-generator.ts:100-109`) — content is never verified.
- The temporary manifest handed to the subprocess (`.netscript/.runtime-manifests/<pkg>.json`) is
  cleaned up in a `finally` (`:430-437`), which is the one place that does have unwind logic.
- `generate runtime-schemas` writes file-by-file in a loop (`generate-runtime-schemas.ts:119-131`);
  a mid-loop failure leaves earlier files written. It does skip unchanged files unless `--force`
  (`:120-126`).

### F9 — Failure behaviors, as actually coded

- **Installer-manifest version mismatch** → structured `{ok:false}` with message
  `Unsupported plugin manifest schemaVersion N; expected 1` (`protocol/manifest.ts:309-316`). Never
  throws.
- **Runtime-manifest version mismatch** → **undefined behavior**: `schemaVersion` is not read
  (`installed-runtime-registry-generator.ts:320-359`).
- **Unknown contribution kind (TS manifest)** → **undefined/silent**: `contributions` is
  `z.record(z.string(), z.unknown())` (`config/validators/manifest-schema.ts:22`); `mergeContributions`
  only copies the twelve keys it knows (`contribution-merger.ts:6-26`), so an unknown key is
  **silently dropped with no diagnostic**. `isContributionAxis` exists but is not called on this path.
- **Unknown field in `scaffold.plugin.json`** → hard reject, `.strict()` (`protocol/manifest.ts:283`).
- **Invalid runtime registry target** (missing `dir`/`registryPath`) → throws
  `Invalid runtime registry target declared by installed plugin "X"` (`:337-339`).
- **Duplicate plugin identity** → `PluginRegistry.register` throws `DuplicatePluginError`
  (`packages/plugin/src/application/plugin-registry.ts:9-14`; `domain/errors.ts:20-26`). But
  `loadRegisteredPlugins` does **not** use `PluginRegistry`: it builds a `Record` keyed by
  `resolvePluginLocalName` (`plugin-registry.ts:150-159`), so **two plugins collapsing to the same
  local name silently overwrite each other**. Local name = last path/package segment with a leading
  `plugin-` stripped (`:67-72`) — e.g. `@a/plugin-ai` and `@b/plugin-ai` collide.
- **Duplicate runtime-config topic across plugins** → throws
  `Runtime config topic "T" is declared by multiple plugins: ...`
  (`generate-runtime-schemas.ts:163-170`), and because planning precedes the write loop
  (`:118-134` vs `:136-174`) this fails **before** any file is written. This is the only
  duplicate-identity guard that is both real and fail-first.
- **Duplicate `aspire`/`doctor` contribution** → last plugin wins silently
  (`contribution-merger.ts:24-25`).
- **Plugin throws at load** — asymmetric:
  - `loadRegisteredPlugins` → `resolvePluginManifest` does a bare `await import(...)`
    (`plugin-registry.ts:365-368`) with no try/catch anywhere up the chain; the import error
    **propagates as an unhandled throw**.
  - `loadRegisteredPluginMetadata` catches and degrades to a `manifestError` string on the plugin
    record (`:169-181`).
  - `checkPluginDoctor` catches and converts to an `error`-status check with remediation text
    (`doctor-plugin-use-case.ts:318-325`).
  - The registry-generator subprocess failing non-zero throws with the captured stderr
    (`installed-runtime-registry-generator.ts:422-429`).
- **Missing manifest for a configured spec** → `ConfigError` exit code `2`
  (`EXIT_CODES.MANIFEST_NOT_FOUND`, `plugin-loader.ts:18-23`;
  `resolve-plugin-manifest.ts:16-24`).
- **Missing declared plugin dependency** → `ConfigError` exit code `76` with
  `Run: ns plugins install X` (`plugin-registry.ts:413-441`). Note the guard only fires when the
  dependency manifest itself has a non-empty contribution (`hasHostContribution`, `:443-447`).
- **Zero registrable items** → `EmptyPluginRegistryError` (`installed-runtime-registry-generator.ts:87`).

### F10 — Trust and permission posture

The installer manifest declares `scaffolder.requiredPermissions {net, read, write}`
(`protocol/manifest.ts:7-14`, `168-172`) and export paths are traversal-checked
(`isSafeExportPath`, `:340-349`: must start `./`, no `\`, no NUL, no `.`/`..` segments). But the
runtime-registry subprocess is spawned with **flat `--allow-read --allow-write` over the whole
project root** (`installed-runtime-registry-generator.ts:409-421`) — the manifest's declared
permission scopes are not translated into the spawn. `inference`: the declared permissions are
advisory metadata today, inferred from the absence of any code mapping them to `Deno.Command` flags
on this path.

## Contracts

- `PluginInstallerManifest` / `PluginInstallerManifestSchema` / `parsePluginManifest` —
  `packages/plugin/src/protocol/manifest.ts:139-164, 270-283, 307-330`. Exported via
  `@netscript/plugin/protocol` (`packages/plugin/deno.json` `exports["./protocol"]`).
- `PluginManifest` + `PluginContributions` + `definePlugin`/`PluginBuilder` + `mergeContributions` +
  `isContributionAxis` + `PluginManifestSchema` — all exported from `@netscript/plugin/config`
  (`packages/plugin/src/config/mod.ts:1-31`).
- `CONTRIBUTION_AXES` / `ContributionAxis` / `LIFECYCLE_HOOK_NAMES` / `PLUGIN_TYPES` /
  `RESERVED_PLUGIN_NAMES` — `packages/plugin/src/domain/constants.ts:16-57`.
- `PluginContext` (what a hook would receive, if hooks ran) —
  `packages/plugin/src/domain/core-types.ts:31-42`: `projectRoot`, `pluginRoot?`, `isDev?`,
  `logger`, `manifest: unknown`.
- `PluginHostState` / `PluginHostLoaderPort` — `packages/cli/src/public/features/plugins/host/plugin-loader.ts:43-58`.
- `GenerateInstalledPluginRegistries` seam + `FetchRuntimeManifest` HTTP seam —
  `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:45-60`.
- `scaffold.runtime.json` shape (unvalidated): `schemaVersion`, `runtimeRegistryGenerator{command,
  args}`, `runtimeRegistries[]{kind, dir, registryPath, fileSuffixes, exclude, registryKey,
  varPrefix, typeImport{name,from}, mapValueType, preamble, pluginDirs[]}`, `backgroundSampleRules[]`
  — `plugins/workers/scaffold.runtime.json:1-60`, target parsing at
  `installed-runtime-registry-generator.ts:335-358`.
- Contribution payload types, one file each, under
  `packages/plugin/src/config/domain/*-contribution.ts` (shapes tabulated in F2).

## Drift candidates

1. **`mergeContributions` drops `cli`** — `contribution-merger.ts:6-26` vs
   `plugin-contributions.ts:12-16`. Host-loader path loses `cli.doctorChecks`; registry path keeps
   it. Significant.
2. **Axis enum vs interface keys disagree** — ten names in `CONTRIBUTION_AXES`
   (`constants.ts:16-40`) vs twelve keys in `PluginContributions` (`plugin-contributions.ts:11-40`);
   `cli` and `doctor` have no axis name. Nothing enforces the correspondence. Significant.
3. **Lifecycle hooks are dead contract surface** — declared, documented, produced by workers
   (`plugins/workers/src/public/mod.ts:108-122`), invoked nowhere (F4). Architectural.
4. **Duplicate-identity guard is unused** — `PluginRegistry`/`DuplicatePluginError`
   (`application/plugin-registry.ts:9-14`) is not on the `loadRegisteredPlugins` path, which
   last-writer-wins on a lossy local name (`kernel/adapters/config/plugin-registry.ts:150-159`,
   `:67-72`). Architectural.
5. **`scaffold.runtime.json` `schemaVersion` is written but never read** —
   `plugins/workers/scaffold.runtime.json:2` vs `installed-runtime-registry-generator.ts:320-359`.
   The file looks versioned and is not. Significant.
6. **`cli.doctorChecks` typed as a closed literal `'auth-backend'`** — `plugin-contributions.ts:14`.
   A third-party plugin cannot contribute a doctor check name without editing the framework package.
   Significant.
7. **Declared scaffolder permissions are not enforced on the generator spawn** —
   `protocol/manifest.ts:7-14` vs `installed-runtime-registry-generator.ts:409-421`. Significant.
8. **Load-failure handling is asymmetric across three call sites** (F9): throw / degrade / capture.
   Minor-to-significant depending on which path a DevTools host would sit on.

## Open questions

1. Which of the two manifests would a DevTools family attach to — the TS `contributions` record, the
   JSON installer manifest, or a third `scaffold.devtools.json`? Nothing in-repo settles this.
2. Is the RFC #890 envelope intended to replace `PluginContributions` wholesale, or to live beside
   it as a frontend-only concern? `01-contracts.md` describes only the frontend layer.
3. Who is meant to call lifecycle hooks — is the absence a gap or a deliberate deprecation? No debt
   entry found under `docs/architecture/doctrine/` (grep for `890`/envelope returned nothing).
4. Is `.netscript/generated/<axis>.registry.ts` (SDK emitter) live anywhere, or fully superseded by
   the manifest-driven generator? `generate-plugin-registries-command.ts:26-33` says "retained".
5. Does any consumer read `contributions.streamTopics`/`databaseSchemas`/`contractVersions`/
   `telemetry`/`migrations`/`e2e` outside `verify-plugin`? None found; unverified whether generated
   projects (as opposed to `packages/`) read them.
6. What should happen on an unknown contribution key — silent drop (today) or diagnostic? Unspecified.

## Sources

All in-repo, at `main` @ `2256a67bf`:

- `packages/plugin/src/protocol/manifest.ts`
- `packages/plugin/src/domain/constants.ts`, `core-types.ts`, `errors.ts`
- `packages/plugin/src/config/mod.ts`, `domain/plugin-manifest.ts`, `domain/plugin-contributions.ts`,
  `domain/*-contribution.ts`, `application/contribution-merger.ts`,
  `validators/manifest-schema.ts`, `validators/contribution-axis-validator.ts`,
  `builders/plugin-builder.ts`
- `packages/plugin/src/application/plugin-registry.ts`, `plugin-loader.ts`
- `packages/plugin/src/sdk/discovery/registry-emitter.ts`
- `packages/plugin/src/diagnostics/verify-plugin.ts`
- `packages/plugin/deno.json`
- `packages/cli/src/kernel/adapters/config/plugin-registry.ts`
- `packages/cli/src/public/features/plugins/host/{plugin-loader,discover-plugins,resolve-plugin-manifest,load-plugin-contributions}.ts`
- `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts`
- `packages/cli/src/public/features/generate/plugins/{installed-runtime-registry-generator,generate-plugin-registries-command}.ts`
- `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas.ts`
- `plugins/{ai,auth,sagas,streams,triggers,workers}/scaffold.plugin.json`
- `plugins/workers/scaffold.runtime.json`, `plugins/workers/src/public/mod.ts`,
  `plugins/workers/src/cli/{generate-runtime-registries,runtime-registry-generator}.ts`
- `.llm/runs/plan-frontend-contrib--seed/design/canonical/01-contracts.md` (RFC #890 design)

Commands run (evidence): `gh pr view 890 --json files`, `gh issue view 890 --json ...` (confirms
#890 is a merged RFC PR, labels include `rfc`, `status:plan`, `area:plugins`);
`grep -rn "hooks?\.\|\.hooks\b" packages/cli/src packages/plugin/src --include=*.ts | grep -v _test`;
`grep -rn "contributions\.aspire\|contributions\.doctor\|contributions\.cli" packages/ plugins/ --include=*.ts | grep -v _test`.
No `deno doc` run was required — every surface above is a source-level declaration already cited by
path and line.
