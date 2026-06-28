# Plan — Scaffolding-primitives centralization into core (`@netscript/plugin/scaffold`)

Run: `plugin-167-harden--impl` (continuation on branch `chore/plugin-167-harden`, PR #170 — held
open, not merged). Archetype: **ARCHETYPE-2/3** (`@netscript/plugin` core surface) + **ARCHETYPE-5**
(the 5 plugins). Scope overlay: none.

## Why (user blocker, 2026-06-28)

> "the scaffolding primitives, base class, adapters, … should be in core package (package/plugin and
> package/cli, …); in plugins lives only the per-plugin specifics … this is a real blocker before
> release as for me this does not reach the netscript standards."

The #167/#168 design correctly makes each plugin **own its `./scaffold` entrypoint** (per
`packages/plugin/src/protocol/scaffolder.ts` — the `ScaffolderContext`→`ScaffoldResult` contract,
already centralized). But the **machinery** was reinvented per-plugin instead of consumed from core.
PR #170 (PLAN-EVAL+IMPL-EVAL **PASS**, all gates green) delivers the schema/CI/dead-code infra and is
sound; it also *added* two more duplicated constants per plugin. This plan hoists every duplicated
primitive into core so plugins retain only specifics. It does **not** undo #167 (plugins still export
`./scaffold` + own their file templates + manifest data).

## Evidence — confirmed duplication across `plugins/{workers,sagas,streams,triggers,auth}/src/scaffold/`

| Duplicated unit | Where today | Verdict |
| --- | --- | --- |
| `interface *ScaffoldArtifact { path; content }` | inline in each `artifacts.ts` | PRIMITIVE → core type |
| `toPascalCase/toCamelCase/toKebabCase/toSnakeCase` | copy-pasted in each `artifacts.ts` (workers L580-603) | PRIMITIVE → core |
| `NETSCRIPT_VERSION = packageConfig.version` (deno.json json-import) | each `artifacts.ts` L1/L12/L29 | PRIMITIVE → core helper (plugin still supplies its own `deno.json`) |
| `SCAFFOLD_SCHEMA_URL = https://jsr.io/@netscript/plugin/${v}/schema/…` | each `artifacts.ts` (5×) | PRIMITIVE → `scaffoldSchemaUrl(version)` |
| `generateScaffoldPluginJson()` `$schema`+`schemaVersion`+`peerDependencies`+`scaffolder` envelope | each `artifacts.ts` | BASE FEATURE → `buildScaffoldPluginJson(spec, version)`; only `provider`/`capabilities`/`officialSource` stay per-plugin |
| `mod.ts` `--context-json` CLI harness: `runScaffoldCli`/`readContextArgument`/`parseContext`/`CliScaffolderContext`; `ScaffoldResult` assembly + `databaseMigrationsAdded` detection | each `mod.ts` (88–120 LOC, near-identical) | BASE → core runner / `defineScaffold()` |
| `files.ts` `writePlannedFiles` | **byte-identical**: sagas==triggers (md5 `395537b5`), streams==auth (md5 `58bac14e`) | PRIMITIVE → core |

Core already has, but in the wrong package for plugin consumption: casing pipes live in
`packages/cli/src/kernel/adapters/scaffold/template-adapter.ts` (`pascalCase`/`kebabCase`/…). Plugins
**cannot** depend on `packages/cli` (dependency direction is CLI→plugin-protocol, never the reverse),
so the plugin-consumable home must be **`packages/plugin`** (already every plugin's peer dep). Do NOT
add a 6th copy; the new core home is the single source. (Optionally later refactor the cli
template-adapter to re-use it — recorded as debt, out of scope here to avoid a cli behavior change.)

Existing core scaffold surface to reuse / extend (not duplicate): `protocol/scaffolder.ts`,
`ports/{scaffolder,template}-port.ts`, `adapters/filesystem-scaffolder.ts`,
`adapters/string-template-adapter.ts`, `cli/base/plugin-item-scaffolder.ts`.

## Target core surface — new `packages/plugin/src/scaffold/` → export `@netscript/plugin/scaffold`

- `artifact.ts` — `export interface ScaffoldArtifact { readonly path: string; readonly content: string }`.
- `naming.ts` — `toPascalCase/toCamelCase/toKebabCase/toSnakeCase` (the single home; identical behavior
  to the current per-plugin copies — port verbatim so generated output is byte-identical).
- `schema-url.ts` — `scaffoldSchemaUrl(version: string): string` → the JSR raw-asset URL
  (`https://jsr.io/@netscript/plugin/${version}/schema/scaffold.plugin.schema.json`). Single home.
- `manifest-spec.ts` — `PluginScaffoldManifestSpec` (the per-plugin data: `name`, `displayName`,
  `description`, `capabilities`, `scaffolder` permission defaults, `provider`, `officialSource`) +
  `buildScaffoldPluginJson(spec, version): string` assembling the canonical manifest with the central
  `$schema`/`schemaVersion`/`peerDependencies` envelope. **Hard constraint: byte-identical output** to
  the 5 currently-committed `plugins/*/scaffold.plugin.json` (so `plugins:check` byte-stability stays
  green and no committed manifest churns). Proven by a core unit test that drives each plugin's spec
  through the builder and diffs against the committed JSON.
- `runner.ts` — the base/harness:
  - `writePlannedFiles(workspaceRoot, artifacts, dryRun)` (hoist the byte-identical `files.ts`).
  - `runScaffoldCli(scaffold)` + `readScaffolderContextFromArgs()` + `parseScaffolderContext()` — the
    `--context-json` argv contract (verbatim from the current `mod.ts`).
  - `defineScaffold({ itemName?, validatePluginName, buildArtifacts }): PluginScaffoldEntrypoint` (or a
    `PluginScaffolder` base class — **evaluator/user-directed shape: base class + adapters preferred**)
    that owns the `ScaffolderContext`→write→`ScaffoldResult` flow incl. `status` + `databaseMigrationsAdded`.
- `mod.ts` — barrel re-exporting the above. Add `"./scaffold": "./src/scaffold/mod.ts"` to
  `packages/plugin/deno.json` `exports` (publish.include already covers `src/**/*.ts`).

## Target per-plugin shape (specifics only)

- `src/scaffold/spec.ts` — the plugin's `PluginScaffoldManifestSpec` literal (provider/capabilities/
  officialSource/name/displayName/description). Pure data.
- `src/scaffold/artifacts.ts` — imports core `ScaffoldArtifact`, `buildScaffoldPluginJson`, naming
  helpers, its `spec`, its own `deno.json` (for version), and its file-template bodies; returns
  `ScaffoldArtifact[]`. **Keeps** the genuinely-specific template generators (workers'
  `generateServiceMain/Router/Contracts/DatabaseSchema/...`; auth's `templates/` dir). Drops every
  primitive.
- `src/scaffold/mod.ts` — thin: `export const scaffold = defineScaffold({ validatePluginName,
  buildArtifacts })` + `if (import.meta.main) await runScaffoldCli(scaffold)`. ~10–15 LOC.
- `src/scaffold/files.ts` — **deleted** (hoisted). `files_test.ts` (workers) → retarget at core or the
  plugin wiring.

Acceptance for "meets standard": each `plugins/*/src/scaffold/` contains ONLY (a) spec data, (b)
file-template bodies, (c) thin wiring to `@netscript/plugin/scaffold`. Zero duplicated
casing/version/schema-url/manifest-envelope/CLI-harness/writePlannedFiles.

## Slices (one commit each; commit→push→PR-comment→append commits.md)

- **C1 — core primitives.** `artifact.ts`, `naming.ts`, `schema-url.ts`, `mod.ts` barrel, `./scaffold`
  export. Unit tests (naming parity vs current behavior; schema-url form). `deno publish --dry-run`
  `@netscript/plugin` clean. No plugin change.
- **C2 — core manifest builder.** `manifest-spec.ts` + `buildScaffoldPluginJson`. **Byte-equality test**
  vs all 5 committed `scaffold.plugin.json`. No plugin change yet.
- **C3 — core runner/base.** Hoist `writePlannedFiles` + `--context-json` harness + `defineScaffold`/
  `PluginScaffolder`. Unit tests: dry-run `planned`, write `applied`, empty `skipped`,
  `databaseMigrationsAdded` on `.prisma`.
- **C4 — migrate workers + streams.** Add `spec.ts`, slim `artifacts.ts`/`mod.ts`, delete `files.ts`.
  Scoped check/lint/fmt + `deno task test`.
- **C5 — migrate sagas + triggers + auth** (auth keeps `templates/` dir). Same gates.
- **C6 — full verification.** `deno task plugins:check` (committed manifests byte-unchanged),
  `arch:check`, scoped check/lint/fmt `--ext ts,tsx` on packages/plugin + plugins, `deno task test`,
  **`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`** (mandatory — this changes the
  scaffold machinery), 5-plugin + `@netscript/plugin` publish dry-runs. Update `drift.md`.

## Gates / acceptance (bound in-slice, none deferred)

- Committed `plugins/*/scaffold.plugin.json` **byte-unchanged**; `plugins:check` green.
- Scoped `deno check`/`lint`/`fmt --ext ts,tsx` green on `packages/plugin` + `plugins`.
- `deno task test` green (incl. new core scaffold unit tests + manifest byte-equality test).
- Full `scaffold.runtime` e2e green (native WSL worktree only).
- `deno publish --dry-run` clean for `@netscript/plugin` + all 5 plugins (json-import tarball-safe —
  already proven in #170 IMPL-EVAL).
- No new type casts (only the 2 sanctioned repo-wide); no `any`; no `deno.lock` churn; explicit-path
  staging.

## Decisions (locked)

1. **Fold, don't split.** Continue on `chore/plugin-167-harden`; #170 stays open; the flagged
   duplication never lands on `main`. Final adversarial-review + IMPL-EVAL cover the whole branch
   before merge; alpha.13 cut follows the single merge.
2. **Core home = `packages/plugin`** (not `packages/cli`) — plugins already depend on it; CLI cannot be
   a plugin dependency.
3. **Base-class + adapters shape** (user-directed wording: "base class, adapters"). `defineScaffold`
   factory acceptable if it composes the base; expose a `PluginScaffolder` base for parity with
   `PluginItemScaffolder`.
4. **Byte-identical generated output** is the safety invariant — manifests and scaffolded files must
   be unchanged vs current; the e2e + byte-equality test prove it.
5. The `packages/cli` template-adapter casing duplication is **out of scope** (cli behavior change);
   record as arch-debt `SCAFFOLD-CASING-CLI-DUP` to dedupe later by importing the new core `naming.ts`.

## Out of scope / debt

- `packages/cli` casing dedupe (debt above).
- `buildPluginDenoJson` common-envelope extraction — *optional*; include only if byte-stable, else
  defer as debt `SCAFFOLD-DENOJSON-ENVELOPE` (the `deno.json` emitters vary more per-plugin; do not
  force it at the cost of churn).

## Risks

- **Byte drift** in generated manifests/files → caught by C2 byte-equality test + C6 e2e; if drift is
  unavoidable, regenerate committed manifests in the same slice and justify in `drift.md`.
- **JSON import under `jsr:@netscript/<plugin>/scaffold`** — already proven tarball-safe in #170
  IMPL-EVAL (all 5 dry-runs clean, no parent-escape).
- **Over-abstraction** — keep core API minimal (the 6 files above); do not introduce a generic plugin
  template DSL.
