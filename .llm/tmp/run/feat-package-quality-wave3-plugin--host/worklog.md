# Worklog — feat-package-quality-wave3-plugin--host

Branch: `feat/package-quality-wave3-plugin-host`
Base: umbrella `feat/package-quality-wave3-plugin` @ `89071df`

## Phase log

| Date | Phase | Session | Notes |
|------|-------|---------|-------|
| 2026-06-08 | Bootstrap | supervisor | Worktree `.worktrees/wave3-plugin-host` + branch forked off umbrella `89071df`. Seed run docs authored (context-pack.md, worklog.md, drift.md, commits.md). Draft PR opened into the umbrella. |
| 2026-06-08 | Research | generator | MEASURE-FIRST complete. Real numbers: dry-run 0 slow types (SUCCESS), doc-lint 93 errors (84 missing-jsdoc + 9 private-type-ref), README 138 LOC, tests 4 files/13 passing. All OQ-A..OQ-F resolved with evidence. |
| 2026-06-08 | Plan & Design | generator | Locked plan.md (24 slices), Design checkpoint in worklog.md. Ready for PLAN-EVAL. |
| | PLAN-EVAL | evaluator | (pending) Separate session. Hard stop before implementation. |
| | Implement | generator | (pending) Sliced, one commit + paired doc-record per slice. |
| | Gate | generator | (pending) A4 gates + consumer-import + e2e:cli once. |
| | IMPL-EVAL | evaluator | (pending) Separate session. |
| | Close | supervisor | (pending) |

## Readiness note

(append at each phase boundary)

## Design Checkpoint

### 1. Public surface

**8 exports entrypoints** (from `deno.json`):

| Entrypoint | Purpose | Key exports |
|-----------|---------|-------------|
| `.` | Authoring API + diagnostics | `definePlugin`, `inspectPlugin`, `PluginError`, `PluginContribution`, manifest types |
| `./abstracts` | Contribution base classes | `PluginContribution`, `PluginServiceContribution`, `PluginStreamTopicContribution`, etc. |
| `./config` | Builder + validators + domain | `PluginBuilder`, `definePlugin`, `PluginManifestSchema`, contribution types |
| `./cli` | CLI contracts + composition | `PluginCli`, `mountPluginCli`, `runMountedCommand`, `formatPluginHelp` |
| `./loader` | Host-side logger | `createPluginLogger`, `PluginLogger` |
| `./sdk` | Discovery ports + runtime stubs | `FilesystemWalker`, `AstExtractor`, `RegistryEmitter`, `ModuleManifestResolver`, `runWalkerPipeline` |
| `./testing` | Test fixtures + memory adapters | `createPluginManifestFixture`, `MemoryManifestResolver`, `MemoryWalker`, `MemoryEmitter`, `runPluginCliContract` |
| `./templates` | Skeleton template registry | `PLUGIN_SKELETON_TEMPLATES` |

**Root barrel (`mod.ts`)** is curated — only authoring API, errors, `PluginContribution`, and `inspectPlugin`. No implementation leakage.

### 2. Domain vocabulary

**Core types (finite domains as constants with derived unions):**

```ts
const PLUGIN_TYPES = ['background-processor', 'api', 'frontend', 'utility'] as const;
type PluginType = typeof PLUGIN_TYPES[number];

const CONTRIBUTION_AXES = [
  'services', 'backgroundProcessors', 'streamTopics', 'databaseSchemas',
  'runtimeConfigTopics', 'contractVersions', 'e2e', 'telemetry', 'migrations', 'aspire',
] as const;
type ContributionAxis = typeof CONTRIBUTION_AXES[number];

const LIFECYCLE_HOOK_NAMES = ['beforeInstall', 'afterInstall', 'beforeUninstall', 'afterUninstall'] as const;
type LifecycleHookName = typeof LIFECYCLE_HOOK_NAMES[number];
```

**Builder state:**

```ts
interface PluginBuilderState<TDependencies extends PluginDependencies> {
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly displayName?: string;
  readonly type?: PluginType;
  readonly author?: string;
  readonly license?: string;
  readonly tags?: readonly string[];
  readonly permissions?: readonly string[];
  readonly metadata?: PluginMetadata;
  readonly contributions: PluginContributions;
  readonly hooks?: PluginLifecycleHooks;
  readonly dependencies?: TDependencies;
}
```

**Definition object:** `PluginManifest` — immutable, frozen, Zod-validated at `build()` time.

### 3. Ports

| Port | File | Consumers |
|------|------|-----------|
| `FileSystemPort` | `src/ports/file-system-port.ts` | `FilesystemScaffolder`, `MemoryFileSystemAdapter` |
| `ScaffolderPort` | `src/ports/scaffolder-port.ts` | CLI composition |
| `TemplatePort` | `src/ports/template-port.ts` | `StringTemplateAdapter` |
| `WalkerPort` | `src/sdk/discovery/ports/walker-port.ts` | `FilesystemWalker`, `MemoryWalker` |
| `ExtractorPort` | `src/sdk/discovery/ports/extractor-port.ts` | `AstExtractor` |
| `EmitterPort` | `src/sdk/discovery/ports/emitter-port.ts` | `RegistryEmitter` |
| `ManifestResolverPort` | `src/sdk/discovery/ports/manifest-resolver-port.ts` | `ModuleManifestResolver`, `MemoryManifestResolver` |

### 4. Constants

| Name | Value | Location |
|------|-------|----------|
| `PLUGIN_ALPHA_VERSION` | `'0.0.1-alpha.0'` | `src/domain/constants.ts` |
| `PLUGIN_MANIFEST_FILES` | `['netscript.plugin.json', 'plugin.json']` | `src/domain/constants.ts` |
| `RESERVED_PLUGIN_NAMES` | `['netscript', 'plugin', 'core']` | `src/domain/constants.ts` |

### 5. Commit slices (24, ordered)

See `plan.md` § "Slice List" for the full table. Summary:

- **Phase A (1–8):** Fix 93 doc-lint errors — private-type-ref exports, then JSDoc sweeps by folder group, then verification.
- **Phase B (9–11):** README expansion + doctest + `./sdk` module doc caveat.
- **Phase C (12–18):** Task hygiene (`lint`/`fmt`/`check` all entrypoints) + new tests (domain, adapter, watcher, loader).
- **Phase D (19–24):** Debt update + manual gate evidence + consumer-import validation + final dry-run + merge-readiness `e2e:cli`.

### 6. Deferred scope

- `plugin-builder.ts` split to <300 LOC — pre-beta refactor (debt)
- AST extractor precision — PLG-WALKER-AST debt
- `e2e:cli` triggers-health fix — Wave 4
- Runtime lifecycle implementation beyond stubs — later wave

### 7. Contributor path

To add a new contribution axis:

1. Add the axis string to `CONTRIBUTION_AXES` in `src/config/domain/contribution-axes.ts`
2. Add the contribution type in `src/config/domain/<axis>-contribution.ts`
3. Add the abstract base in `src/abstracts/plugin-<axis>-contribution.ts`
4. Add `with<Noun>()` method to `PluginBuilder` in `src/config/builders/plugin-builder.ts`
5. Update `src/config/domain/plugin-contributions.ts` to include the axis
6. Add JSDoc to the new abstract base properties
7. Export from `src/abstracts/mod.ts` and `src/config/mod.ts`
8. Add a test in `tests/sdk/walker-ports_test.ts` if the axis affects discovery

To add a new builder method:

1. Define the method in `PluginBuilder` using `#withArrayContribution` or `#withArrayContributions`
2. Add JSDoc with `@param` and `@returns`
3. Verify `deno doc --lint` passes
4. Add a doctest or unit test

### 8. Gate evidence summary (pre-implementation)

| Gate | Pre-implementation status |
|------|--------------------------|
| F-1 | DEBT_ACCEPTED (`plugin-builder.ts` 343 LOC) |
| F-2 | Manual pass (`safeStringifyMetadata` justified) |
| F-3 | Manual pass (layering verified) |
| F-4 | Manual pass (abstracts co-located) |
| F-5 | Manual pass (8 entrypoints, curated root) |
| F-6 | PASS (dry-run SUCCESS, 0 slow types) |
| F-7 | FAIL (93 doc-lint errors — target of Phase A) |
| F-8 | PASS (`deno check` all 8 entrypoints) |
| F-9 | PASS (permissions declared in walker tests) |
| F-10 | PASS (13 tests, all green) |
| F-11 | PASS (no forbidden folders) |
| F-12 | Manual pass (naming conventions verified) |
| F-14 | Manual pass (console use justified in logger) |
| F-15 | Manual pass (no upstream re-exports at root) |
| F-16 | Manual pass (cardinality verified) |
| F-17 | Manual pass (abstracts co-located) |
| F-18 | Manual pass (no nested sub-barrels) |
