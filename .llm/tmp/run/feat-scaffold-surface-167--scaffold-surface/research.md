# Research — Scaffold Surface Re-Architecture (#157 / reframes #167)

Branch: `feat/scaffold-surface-167` (off origin/main @ 7b9982bb). Supersedes
`chore/plugin-167-harden` / PR #170 (27 commits that centralized the WRONG model). Lane: **Claude
sub-agents** (user override of the WSL-Codex default for this task). Harness skills + doctrine +
gates remain the bar; gates (not eval ping-pong) are the verification.

## The mandate (user, 2026-06-28, verbatim intent)

A plugin is a **dependency**, not a starter/generator. `plugin add <kind>` must emit ONLY the
**userland surface** — a wiring entrypoint that IMPORTS the installed dep + core, config-file
edits, a few USER-OWNED sample stubs, and a SENSIBLE Prisma schema. It must NEVER stringify the
plugin's own type-safe TypeScript source (`services/`, `router`, `contracts`, `src/runtime`,
`src/aspire`, `bin/`) into userland. The emit mechanism must be a **typesafe factory / typed code
model**, never string concatenation. The Prisma schema IS allowed in userland ("only what makes
sense") — it is user-owned declarative DB surface Prisma needs on disk; it is NOT the disease.

## Grounding (4 read-only Explore agents over the build worktree, 2026-06-28)

### A — Scaffold hexagon + emit map (agent a4ba97dc)

Existing core hexagon to build on (`packages/plugin/src/`):
- `protocol/scaffolder.ts`: `ScaffolderContext { workspaceRoot, options, dryRun, logger }`,
  `ScaffoldResult { status, createdFiles, modifiedFiles, databaseMigrationsAdded }`,
  `PluginScaffoldEntrypoint = (ctx) => Promise<ScaffoldResult>`.
- `protocol/manifest.ts`: `PLUGIN_MANIFEST_SCHEMA_VERSION = 1`, `parsePluginManifest`, provider/
  capabilities/scaffolder manifest types.
- `ports/{file-system-port,scaffolder-port,template-port}.ts`,
  `adapters/{filesystem-scaffolder,string-template-adapter,memory-file-system-adapter}.ts`.

Per-plugin emit classification (the disease vs the legit surface):
- **DEP-INTERNAL (string-copied → DELETE; comes from the dep):** `mod.ts` (definePlugin builder),
  `services/src/main.ts`, `services/src/router.ts`, `services/src/init.ts`, `contracts/v1/mod.ts`,
  `bin/combined.ts`, `src/runtime/*`, `src/aspire/mod.ts`, `streams/*`, auth `src/public|plugin/*`,
  auth's 25 `src/scaffold/templates/**`.
- **LEGIT userland (keep, but emit typesafely / source correctly):** sample stubs
  (`jobs/health-check.ts`, `tasks/validate-payload.ts`, `sagas/*`, `triggers/*`), root barrels
  (`workers/mod.ts`, `sagas/mod.ts`, `triggers/mod.ts`), Prisma schema, `scaffold.plugin.json`.

Generators to delete live in `plugins/*/src/scaffold/artifacts.ts`
(`generateServiceMain` workers L227, `generateRouter` L381, `generateContracts` L409,
`generateDatabaseSchema` L424, `generateCombinedEntrypoint` L439; analogous in sagas/streams/
triggers; auth = `AUTH_ARTIFACT_SOURCES` 26-entry template map).

### B — `plugin add` mutation map + runtime boot (agent aad89259) — **decisive**

`addPlugin` (`packages/cli/src/public/features/plugins/add/add-plugin.ts:99-188`) already does ALL
config wiring **correctly and centrally**:
- `updateAppsettings()` (L151) → appsettings.json plugin entry (port/runtime/entrypoint/workdir/
  requiresDb/requiresKv/permissions) — the runtime source of truth.
- `ensureNetScriptConfigPlugin()` (L161) → appends plugin specifier to `config.plugins[]`.
- `ensureRootImportsForPluginKind()` (L165) + `ensureWorkspaceMember()` (L170) → deno.json imports
  + workspace.
- `ensureSharedCache()` (L167), `copyPluginSchemasToRootDb()` (L144),
  `regenerateAspireHelpers()` (L173 → `register-plugins.mts`), `ensurePluginServiceContext()`
  (services/_shared/plugin-service-context.ts).

Runtime boot is **specifier-agnostic**: Aspire runs `deno run <Workdir>/<Entrypoint>`; the plugin
host loads `netscript.config.ts` and resolves each `config.plugins[]` specifier via Deno — a JSR
specifier (`@netscript/plugin-<kind>`) resolves from cache exactly like a local path. **The string
format is irrelevant to runtime.**

THE DISEASE: only `runPluginOwnedScaffold()` → `dispatchPluginScaffold()` (L125-127) copies plugin
source into `plugins/<name>/`, and the `renderPlugin()` full-source branch (L131-136) for
first-party (the JSR branch `renderPluginSupport({importMode:'jsr'})` already writes thin stubs).

E2E reality (`packages/cli/e2e/.../scaffold/*`): NO gate asserts `plugins/<name>/` file existence;
gates run CLI commands (`plugin doctor`, `generate plugins`) + health probes that pass on manifest
resolution, not file presence. → Flipping to no-copy is **transparent**; we ADD a negative
assertion that plugin TS source is NOT written to userland.

### C — Prisma / DB schema (agent ab626a1a)

Already correct & byte-stable. Plugin ships `database/**/*.prisma` in its tarball
(`publish.include`); `copyPluginSchemasToRootDb` (`packages/cli/src/kernel/adapters/plugin/
db-integration.ts:176-234`) copies it to `database/<engine>/schema/plugins/<plugin>/`; Prisma v7
directory-scan (`prisma.config.ts` `schema:'schema'`) aggregates all `.prisma` files. Root user
schema emitted from `schema.prisma.template` (string template — **fragile but byte-stable; convert
to a typed builder is a SEPARATE lower-priority hardening, recordable as debt, NOT a blocker**). The
plugin `generateDatabaseSchema()` string factory that writes `plugins/<name>/database/schema.prisma`
is part of the disease → DELETE (schema comes from the dep tarball, not re-stringified).

### D — Doctrine + gates (agent abce561)

- **A4/A5 verdict: an abstract `PluginScaffolder` base class is FORBIDDEN.** A4 = base classes are
  stub-only contracts; A5 = composition over inheritance (Bloch 18); AP-4 = cross-package
  implementation inheritance forbidden. → REQUIRED shape: a **factory** + injected ports/modules
  (forwarding-class / composition), NOT inheritance. This vindicates the earlier adversarial
  Finding 1 (interface+factory over abstract base) that the prior brief over-ruled.
- Layering: `domain → ports → application → adapters → presentation`; dependency-direction
  CLI→plugin (never plugin→CLI); `@netscript/plugin/scaffold` must not import `@netscript/cli`.
- Real gate tooling (verified present in `.llm/tools/`): `run-deno-{check,lint,fmt}.ts`,
  `run-deno-doc-lint.ts`, `run-publish-dry-run.ts`, `fitness/check-doctrine.ts`,
  `fitness/check-architecture-gates.ts`, `fitness/check-manifest-integrity.ts`,
  `scaffold-e2e-test.ts`, `check-scaffold-versions.ts`. Root tasks: `check`, `test`, `lint`,
  `fmt`/`fmt:check`, `arch:check`, `plugins:check`(implied), `publish:dry-run`, `e2e:cli`.
- **arch:check gap:** the task currently runs `check-doctrine.ts` only over the 5 auth packages —
  it does NOT cover `packages/plugin` or the 5 plugins. Extending it to gate the scaffold surface is
  part of "make fitness functions actual gates."

## Locked decisions

- **D-LANE:** implement via Claude sub-agents (Agent tool), gated; no WSL Codex; no OpenHands eval
  ping-pong — gates are the verification.
- **D-SHAPE:** core = typesafe **factory** `createPluginScaffold(...)` + injected `FileSystemPort` +
  a **typed code-emit model** (typed import/export/file descriptors → deterministic printer). NO
  abstract base, NO `string-template-adapter` string factories.
- **D-EMIT:** user-owned sample stubs ship as REAL, type-checked `.ts` source inside each plugin
  package (`src/scaffold/stubs/`), gated by the plugin's own check/lint; the scaffolder emits them
  via typed artifact descriptors with a typed identifier-substitution pass (named tokens, not raw
  `String.replace`). Structural files (wiring entrypoint/barrel) emit from the typed code model.
- **D-PRISMA:** plugin Prisma schema travels in the dep tarball → CLI `copyPluginSchemasToRootDb`
  (already correct). Scaffolder does NOT re-emit plugin prisma. Root-schema typed-builder = debt.
- **D-NOCOPY:** `plugins/<name>/` plugin SOURCE is never emitted; it is the JSR dep. Delete
  `renderPlugin()` full-source branch + all `generate*()` source factories + auth `templates/**`.
- **D-CONFIG-KEEP:** the CLI config wiring (appsettings/netscript.config/deno.json/register-plugins/
  service-context) is correct — KEEP. Finding 4 (centralize plugin `deno.json` envelope) is MOOT
  (no `plugins/<name>/deno.json` is emitted anymore).
- **D-BYTE:** 5 committed `plugins/*/scaffold.plugin.json` stay byte-identical (typed
  `buildScaffoldPluginJson` + equality test).

See `plan.md` for the slice decomposition + gates.

## RE-ARCHITECTURE v2 — full unification (user-locked 2026-06-29)

v1 (above) fixed only the no-copy emit. The user escalated to **full unification**: the v1 thin
scaffold is correct but is still only ONE of THREE overlapping mechanisms. Unify the entire
`netscript plugin <verb> <kind>` surface around ONE core-owned command contract.

### The duplication to kill (mapped via 3 read-only Explore agents + doctrine reads)

1. CLI-owned `PluginScaffolder` → `kernel/templates/plugins/generate-plugin-*` → `renderPlugin()`
   emits FULL plugin source for first-party (the disease).
2. v1's `src/scaffold/buildArtifacts` + hand-written `stubs/` (the wrong third copy I added).
3. `src/scaffolding/` + `<kind> add-job` verb → real item generator on STRING concatenation
   (`[...].join('\n')`) + dead `.template` files (e.g. `job-handler.ts.template` mustache parallel
   to `generate()`).

Plus THREE forked, base-less item-scaffolder contracts: core `PluginItemScaffolder<TInput>`,
`WorkersItemScaffolder` (in plugin-workers-core), inline `SagasItemScaffolder`, bare
`TriggerDefinitionScaffolder` interface. → collapse to ONE `ItemScaffolder<TInput>`.

### Decisive existing surface (the bones to unify, not replace)

- `packages/cli/.../dispatch-plugin-verb.ts`: `FRAMEWORK_VERBS =
  ['add','remove','enable','disable','sync','setup','update','doctor','info']` ALREADY exists —
  core already owns a mandatory-verb taxonomy + `deno x -A jsr:<pkg>/cli <verb>` dispatch. The
  unification renames `add→install`, canonicalizes the mandatory set, and routes resource verbs
  through the same contract.
- `add-plugin.ts` host-side config wiring + `copyPluginSchemasToRootDb` are correct → KEEP; only the
  `renderPlugin()` full-source branch is deleted.

### Vite grounding (user's anchor — WebFetch confirmed)

Vite plugin = a plain typed **contract object** (NOT inheritance), authored as a **factory** that
returns the object (`name` required + `enforce`/`apply` + hooks). Core owns the pipeline and calls
hooks sequentially (pull-based); plugins never invoke each other or extend a base class.
Conventions = strong defaults. NetScript adopts this and adds MORE restriction (single-target →
stronger defaults). This is exactly the doctrine-sanctioned shape (contract + composition + typed
seams), and it sidesteps the doctrine-03 cross-package-inheritance ban (L162-175).

### Doctrine reconciliation (decisive)

- Doctrine 03 L162-175: **cross-package implementation inheritance FORBIDDEN** (Bloch 18) — a
  `plugins/*` adapter literally `extends`-ing a base from `@netscript/plugin` is doctrine-ILLEGAL.
  Extension across packages = interfaces + registration, not inheritance. → the user's "extend a
  base class" intent is realized as **contract + composition + seams** (the user confirmed: "option
  1 but in the spirit of option 2", anchored on Vite).
- Doctrine 03 ALSO ENABLES the shared mandatory-command logic: layer-2 abstracts (R-BASE-L2) MAY
  carry concrete shared bodies when ≥2 concretes exist and they don't orchestrate the lifecycle
  (doctrine's own `ScaffoldCommand extends CliCommand` example) — but this lives WITHIN
  `@netscript/plugin`, consumed by the plugin via composition, not subclassed across the package
  boundary.
- A4: the existing `PluginCli.run()` orchestration VIOLATES "spine stub-only" → move dispatch to a
  `plugin-cli-runner`.

### Locked decisions v2 (supersede D-SHAPE / D-EMIT framing; D-LANE / D-NOCOPY / D-CONFIG-KEEP /
### D-PRISMA / D-BYTE still hold)

- **D-UNIFY:** ONE core-owned command contract `@netscript/plugin/adapter` (consolidates `/cli`,
  `/scaffold`, `/protocol/scaffolder`); plugins supply a typed `NetScriptPlugin` object via
  `createPluginAdapter`. No `plugins/*` cross-package `extends`.
- **D-MANDATORY:** core owns `install` (rename of `add`) / `doctor` / `info` / `update` / `remove`
  with shared logic parameterized by plugin-supplied typed seams (Vite-style strong defaults).
- **D-OPTIONAL:** `add <resource>` / `generate <resource>` + extra plugin verbs are contract-shaped
  optionals the plugin implements (oRPC-contract analogy).
- **D-ONE-ITEM:** ONE `ItemScaffolder<TInput>` drives BOTH install's starter set AND `add
  <resource>`; type-checked stub source + typed identifier substitution; no string concat, no
  `.template`.
- **D-RENAME:** full CLI rename + namespace (`plugin install <kind>`, `<kind> add <resource>`,
  `<kind> generate <resource>`) — breaking, acceptable pre-1.0.
- **D-OWN:** `@netscript/plugin` + `@netscript/cli` own the command logic + shapes; plugins are thin
  connectors.
