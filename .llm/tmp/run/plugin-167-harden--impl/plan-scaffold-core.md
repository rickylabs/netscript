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

## The law (user, 2026-06-28) — what this plan enforces

A unit belongs in **core** (`packages/cli`, `packages/plugin`, the JSON Schema, or a per-family
plugin-core) if EITHER (a) it carries a NetScript **convention/standard** required for consistency,
security, stability, extensibility, or core-integration, OR (b) it is a **pattern that by design
repeats in every plugin**. A plugin **must never invent** convention/standard; it holds ONLY its own
specific logic, and even that is pushed down into a plugin-core where it makes sense (auth-core +
adapter packages is the reference). Goal: each plugin is a **thin, predictable surface** — the thinner
and more uniform, the better the #167 marketplace scales.

This makes the slice a **completeness** task, not just a fix of the 7 known dups: sweep every
`plugins/*/src/scaffold/` unit and classify it convention/repeat (→ core) vs genuinely-specific
content (→ stays). Anything in column (a)/(b) still in a plugin at the end is a defect.

## Evidence — confirmed duplication across `plugins/{workers,sagas,streams,triggers,auth}/src/scaffold/`

| Duplicated unit | Where today | Verdict |
| --- | --- | --- |
| `interface *ScaffoldArtifact { path; content }` | inline in each `artifacts.ts` | PRIMITIVE → core type |
| `toPascalCase/toCamelCase/toKebabCase/toSnakeCase` | copy-pasted in each `artifacts.ts` (workers L580-603) | **DELETE → `@std/text`** (doctrine Rule #3: wrap, do not reinvent). Byte-identical to hand-rolled for the 5 first-party names (verified); differs only on internal letter→digit boundaries (`payment-gateway-v2`→`v-2`/`v_2`), an accepted std convention for future user names. NOT relocated into a core file — re-exporting std would itself be reinvention. |
| `NETSCRIPT_VERSION = packageConfig.version` (deno.json json-import) | each `artifacts.ts` L1/L12/L29 | PRIMITIVE → core helper (plugin still supplies its own `deno.json`) |
| `SCAFFOLD_SCHEMA_URL = https://jsr.io/@netscript/plugin/${v}/schema/…` | each `artifacts.ts` (5×) | PRIMITIVE → `scaffoldSchemaUrl(version)` |
| `generateScaffoldPluginJson()` `$schema`+`schemaVersion`+`peerDependencies`+`scaffolder` envelope | each `artifacts.ts` | BASE FEATURE → `buildScaffoldPluginJson(spec, version)`; only `provider`/`capabilities`/`officialSource` stay per-plugin |
| `mod.ts` `--context-json` CLI harness: `runScaffoldCli`/`readContextArgument`/`parseContext`/`CliScaffolderContext`; `ScaffoldResult` assembly + `databaseMigrationsAdded` detection | each `mod.ts` (88–120 LOC, near-identical) | BASE → core runner / `defineScaffold()` |
| `files.ts` `writePlannedFiles` | **byte-identical**: sagas==triggers (md5 `395537b5`), streams==auth (md5 `58bac14e`) | PRIMITIVE → core |

Casing is NOT a NetScript primitive at all — `@std/text` ships `toPascalCase/toCamelCase/toKebabCase/
toSnakeCase`. Per doctrine Rule #3 the per-plugin copies are **deleted** and replaced by a direct
`@std/text` import; nothing casing-related goes into core. The `packages/cli` template-adapter
(`packages/cli/src/kernel/adapters/scaffold/template-adapter.ts`, `pascalCase`/`kebabCase`/…) is a
6th hand-rolled copy with the same defect; migrating it to `@std/text` is recorded as debt
`SCAFFOLD-CASING-CLI-DUP` (out of scope here only to avoid a cli behavior change in this slice).
**Parity is verified**: for the 5 first-party plugin names (`workers`/`sagas`/`streams`/`triggers`/
`auth`) `@std/text` output is byte-identical to the hand-rolled converters across all four cases, so
no committed manifest churns. The sole divergence is on internal letter→digit boundaries (e.g.
`payment-gateway-v2` → std `payment_gateway_v_2` vs hand `payment_gateway_v2`), which affects only
future user plugin names and adopts the canonical std convention — no existing-name back-compat
burden. Guard: a parity unit test pinned to the 5 first-party names asserts std==committed.

`@std/text` must be present in the import map; if absent, C1 adds it (root `deno.json` imports /
catalog) — the only new dependency, a first-party `@std` lib.

Existing core scaffold surface to reuse / extend (not duplicate): `protocol/scaffolder.ts`,
`ports/{scaffolder,template}-port.ts`, `adapters/filesystem-scaffolder.ts`,
`adapters/string-template-adapter.ts`, `cli/base/plugin-item-scaffolder.ts`.

## Design principles (doctrine + jsr-audit skills — SOTA bar)

The new surface **extends the package's existing hexagon** (`ports/` + `adapters/` incl.
`memory-file-system-adapter` + `abstracts/` + the abstract `PluginItemScaffolder` base), it does NOT
introduce a parallel flat module. Apply `.agents/skills/netscript-doctrine` (ARCHETYPE-2/3 public
surface + layering law: domain/value → ports → adapters → application; no inward dependency
violations) and `.agents/skills/jsr-audit` (every public symbol JSDoc'd; `deno doc --lint` clean over
the **full** export map per [[jsr-doc-lint-full-export-set]]; abstract, minimal, render-clean public
surface). Mirror the existing house style exactly: port interfaces + per-member JSDoc, abstract base
classes with JSDoc'd abstract members, constructor-injected ports (default real adapter, inject memory
adapter for dry-run/tests).

## Target core surface — new `packages/plugin/src/scaffold/` → export `@netscript/plugin/scaffold`

Layered (port → adapter → abstract base → application/CLI → documented barrel); casing is NOT here
(comes from `@std/text` in each consumer):

- **Port (reuse, do not duplicate).** File writing rides the existing `FileSystemPort`
  (`readText`/`writeText`/`exists`). Real run = the filesystem adapter; dry-run/test = the existing
  `memory-file-system-adapter`. This **deletes** `files.ts`/`writePlannedFiles` outright (replaced by
  the port), rather than hoisting it — the port already is the seam.
- **Value types & pure builders (no I/O, fully unit-testable).**
  - `artifact.ts` — `export interface ScaffoldArtifact { readonly path: string; readonly content: string }` (JSDoc'd).
  - `schema-url.ts` — `scaffoldSchemaUrl(version: string): string` → the JSR raw-asset URL
    (`https://jsr.io/@netscript/plugin/${version}/schema/scaffold.plugin.schema.json`). Single home.
  - `manifest-spec.ts` — `PluginScaffoldManifestSpec` (per-plugin data: `name`, `displayName`,
    `description`, `capabilities`, `scaffolder` permission defaults, `provider`, `officialSource`) +
    `buildScaffoldPluginJson(spec, version): string` assembling the canonical manifest with the central
    `$schema`/`schemaVersion`/`peerDependencies` envelope. **Hard constraint: byte-identical output** to
    the 5 committed `plugins/*/scaffold.plugin.json`; proven by a core unit test diffing builder output
    against each committed JSON.
- **Abstract base (the centralized base feature — template-method).** `PluginScaffolder` abstract class
  (sibling to `PluginItemScaffolder`), constructor-injected `FileSystemPort` (defaults to the filesystem
  adapter). Abstract members each plugin implements: `readonly pluginName: string`, `readonly
  manifestSpec: PluginScaffoldManifestSpec`, `protected abstract buildArtifacts(context: ScaffolderContext):
  ScaffoldArtifact[] | Promise<ScaffoldArtifact[]>`. Concrete, JSDoc'd template method
  `scaffold(context): Promise<ScaffoldResult>` owns the whole `ScaffolderContext`→(write via port | plan
  if `dryRun`)→`ScaffoldResult` flow: `status` (`applied`/`planned`/`skipped`/`failed`), created/modified
  files, and `databaseMigrationsAdded` detection. Plus `toEntrypoint(ctor): PluginScaffoldEntrypoint` so a
  plugin exposes the protocol entrypoint in one line.
- **Application / CLI harness.** `runScaffoldCli(entrypoint)` + `parseScaffolderContextArgs()` — the
  `--context-json` argv contract (centralized from the 5 near-identical `mod.ts`). Reuses
  `StringTemplateAdapter` for `{{var}}` rendering where plugins need it.
- **Documented public barrel.** `mod.ts` re-exports the abstract base, `toEntrypoint`, `runScaffoldCli`,
  `ScaffoldArtifact`, `PluginScaffoldManifestSpec`, `buildScaffoldPluginJson`, `scaffoldSchemaUrl`, and
  re-exports `ScaffolderContext`/`ScaffoldResult`/`PluginScaffoldEntrypoint` from `protocol`. `@module`
  header with `@example`; add `"./scaffold": "./src/scaffold/mod.ts"` to `packages/plugin/deno.json`
  `exports` (publish.include already covers `src/**/*.ts`). **`deno doc --lint` must be clean over the
  full export map.**

## Target per-plugin shape (specifics only — thin)

- `src/scaffold/spec.ts` — the plugin's `PluginScaffoldManifestSpec` literal. Pure data.
- `src/scaffold/scaffolder.ts` — `export class WorkersScaffolder extends PluginScaffolder` declaring
  `pluginName`, `manifestSpec = workersScaffoldSpec`, and implementing only `buildArtifacts(ctx)` — the
  genuinely-specific template generators (workers' `generateServiceMain/Router/Contracts/DatabaseSchema/…`;
  auth's `templates/` dir), using `@std/text` casing + `StringTemplateAdapter`. No primitive, no
  envelope, no CLI harness, no file-writing.
- `src/scaffold/mod.ts` — thin: `export const scaffold = toEntrypoint(WorkersScaffolder)` +
  `if (import.meta.main) await runScaffoldCli(scaffold)`. ~5–10 LOC.
- `src/scaffold/files.ts` — **deleted** (replaced by the core `FileSystemPort`). `files_test.ts`
  (workers) → retarget at the core base/port.
- **Delete local `ScaffolderContext`/`ScaffoldResult` re-declarations** (PLAN-EVAL watcher-note 1):
  auth/sagas/streams/triggers `mod.ts` currently re-declare these protocol types locally — a leaked
  primitive. Force-import them from `@netscript/plugin/protocol`; zero local copies remain.

Acceptance for "meets standard": each `plugins/*/src/scaffold/` contains ONLY (a) spec data, (b)
genuinely-specific file-template/content bodies, (c) thin wiring to `@netscript/plugin/scaffold`. Zero
duplicated casing/version/schema-url/manifest-envelope/CLI-harness/writePlannedFiles, AND a completeness
sweep confirms no other convention-bearing or by-design-repeating unit remains in any plugin. The
common-by-design skeleton (the standard artifact set, `mod.ts` shape, and the `deno.json` envelope) is
extracted to core **wherever byte-stable** — pushing each plugin as thin as the byte-identical invariant
allows; only genuinely-varying content stays per-plugin.

## Slices (one commit each; commit→push→PR-comment→append commits.md)

- **C1 — value types + casing migration.** `artifact.ts`, `schema-url.ts`, documented `mod.ts` barrel
  skeleton, `./scaffold` export. Add `@std/text` to the import map if absent. Every public symbol
  JSDoc'd. Unit tests: schema-url form + a **casing-parity test pinned to the 5 first-party names**
  asserting `@std/text` == committed output. `deno doc --lint` clean over the new export; `deno publish
  --dry-run` `@netscript/plugin` clean. No plugin change yet.
- **C2 — manifest builder.** `manifest-spec.ts` + `buildScaffoldPluginJson` (JSDoc + `@example`).
  **Byte-equality test** vs all 5 committed `scaffold.plugin.json`. No plugin change yet.
- **C3 — abstract base + CLI harness (over the existing port).** `PluginScaffolder` abstract base
  (constructor-injected `FileSystemPort`, template-method `scaffold()`, `toEntrypoint`) + `runScaffoldCli`
  / `parseScaffolderContextArgs`. Reuse filesystem + `memory-file-system-adapter`; **delete the
  `writePlannedFiles` pattern** in favor of the port. Unit tests (memory adapter): dry-run→`planned`,
  write→`applied`, empty→`skipped`, `databaseMigrationsAdded` on `.prisma`. `deno doc --lint` clean.
- **C4 — migrate workers + streams.** Add `spec.ts` + a `XScaffolder extends PluginScaffolder`
  subclass, slim `mod.ts` to `toEntrypoint`, delete `files.ts`/`artifacts.ts` primitives. Scoped
  check/lint/fmt + `deno task test`.
- **C5 — migrate sagas + triggers + auth** (auth keeps `templates/` dir). Same gates.
- **C5b — common-skeleton extraction (thin-plugin law).** Completeness sweep; extract the
  by-design-repeating skeleton (`buildPluginDenoJson(spec, version)` envelope, standard artifact set)
  into core **only where byte-stable**; record any field that cannot be centralized without churn in
  `drift.md`.
- **C6 — full verification.** `deno task plugins:check` (committed manifests byte-unchanged),
  `arch:check` (layering conformance — no port/adapter/domain boundary violation), scoped
  check/lint/fmt `--ext ts,tsx` on packages/plugin + plugins, `deno task test`, **`deno doc --lint`
  clean over the FULL `@netscript/plugin/scaffold` export map** (jsr-audit A1, [[jsr-doc-lint-full-export-set]]),
  **`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`** (mandatory — scaffold
  machinery changed), 5-plugin + `@netscript/plugin` publish dry-runs. Update `drift.md`.

## Gates / acceptance (bound in-slice, none deferred)

- Committed `plugins/*/scaffold.plugin.json` **byte-unchanged**; `plugins:check` green.
- Scoped `deno check`/`lint`/`fmt --ext ts,tsx` green on `packages/plugin` + `plugins`.
- `deno task test` green (incl. new core scaffold unit tests + manifest byte-equality test).
- **`deno doc --lint` clean over the full `@netscript/plugin/scaffold` export map** (every public
  symbol documented; jsr-audit A1 publish bar). Public surface is abstract + minimal (base + value
  types + builder + runner), no generic-DSL creep.
- `arch:check` layering conformance: ports↔adapters↔abstract-base↔application boundaries respected;
  no plugin→`packages/cli` edge; `@netscript/plugin/scaffold` is a legal additive export, no cycle.
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
3. **Abstract base + port + adapter shape (locked, user-directed: "base class, adapter, port,
   abstract public surface").** `PluginScaffolder` abstract base (template-method `scaffold()`,
   abstract `buildArtifacts`), constructor-injected `FileSystemPort`, real/`memory` adapters,
   `toEntrypoint` for the protocol export. Extends the package's existing hexagon (parity with
   `PluginItemScaffolder`); no `defineScaffold` flat-factory, no parallel module. SOTA bar: every
   public symbol JSDoc'd, `deno doc --lint` clean over the full export map (jsr-audit), maximal
   readability.
4. **Byte-identical generated output** is the safety invariant — manifests and scaffolded files must
   be unchanged vs current; the e2e + byte-equality test prove it.
5. **Casing = `@std/text`, not a core file.** Per doctrine Rule #3 the hand-rolled converters are
   deleted and consumers import `@std/text` directly; core ships NO casing module (re-exporting std is
   itself reinvention). Verified byte-identical for the 5 first-party names; std convention adopted for
   future user names (letter→digit boundary delta). The `packages/cli` template-adapter is the 6th copy
   — migrate it to `@std/text` too, recorded as arch-debt `SCAFFOLD-CASING-CLI-DUP` (out of scope here
   to avoid a cli behavior change in this slice).

## In scope — skeleton extraction (per the law: thin plugins)

- **C5b — common-skeleton extraction.** After migration, run the completeness sweep and extract the
  by-design-repeating skeleton into core **only where byte-stable**: the standard artifact set, the
  `mod.ts` shape (already core via `defineScaffold`/runner), and a `buildPluginDenoJson(spec, version)`
  envelope for the common `deno.json` fields. The `deno.json` emitters vary per-plugin (deps differ),
  so extract the shared envelope and let each plugin supply only its specific dep/field deltas — the
  byte-identical invariant is the hard guard; if any field cannot be centralized without churn, leave
  that field per-plugin and record precisely which field and why in `drift.md`. The goal is "as thin
  as byte-stability allows," not forced uniformity at the cost of churn.

## Out of scope / debt

- `packages/cli` template-adapter casing → migrate to `@std/text` (debt `SCAFFOLD-CASING-CLI-DUP`,
  deferred only to avoid a cli behavior change in this slice).

## Risks

- **Byte drift** in generated manifests/files → caught by C2 byte-equality test + C6 e2e; if drift is
  unavoidable, regenerate committed manifests in the same slice and justify in `drift.md`.
- **JSON import under `jsr:@netscript/<plugin>/scaffold`** — already proven tarball-safe in #170
  IMPL-EVAL (all 5 dry-runs clean, no parent-escape).
- **Over-abstraction** — keep core API minimal (the 6 files above); do not introduce a generic plugin
  template DSL.
