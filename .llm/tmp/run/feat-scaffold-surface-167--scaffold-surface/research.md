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
