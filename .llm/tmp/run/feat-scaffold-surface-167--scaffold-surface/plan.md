# Plan — Scaffold Surface Re-Architecture (#157)

Archetype: `@netscript/plugin` = ARCHETYPE-2/3 (the `./scaffold` export is library/runtime); plugins
= ARCHETYPE-5; CLI = ARCHETYPE-6. Overlays: none (framework source). Lane: Claude sub-agents, gated.
See `research.md` for grounding + locked decisions (D-*).

## Target shape

`@netscript/plugin/scaffold` (new export, composition — NO abstract base):

```
packages/plugin/src/scaffold/
  artifact.ts          # ScaffoldArtifact value type (typed file descriptor)
  code-model.ts        # typed code IR (imports/exports/decls) + deterministic printer
  manifest-spec.ts     # PluginScaffoldManifestSpec + buildScaffoldPluginJson(spec, version)
  schema-url.ts        # scaffoldSchemaUrl(version)
  options.ts           # readScaffoldPluginName(context|options) — centralized name parse/validate
  scaffold.ts          # createPluginScaffold(spec): composition factory (holds FileSystemPort,
                       #   builds artifacts via injected buildArtifacts, writes via the port)
  cli.ts               # runScaffoldCli + parseScaffolderContextArgs (--context-json contract)
  mod.ts               # @module + @example barrel; re-exports the public surface
```
Reuse `protocol/{scaffolder,manifest}.ts` + `ports/file-system-port.ts` as-is. The new surface owns
NO casing module (import `@std/text` directly — Rule #3). Add `"./scaffold"` to
`packages/plugin/deno.json` exports.

Each plugin (`plugins/<kind>/src/scaffold/`):
```
  spec.ts              # data only (kind, displayName, ports, sample-stub manifest, dep specifier)
  stubs/*.ts           # REAL type-checked user-owned sample sources (job/task/saga/trigger)
  scaffolder.ts        # buildArtifacts(ctx): returns ONLY userland artifacts:
                       #   1) wiring entrypoint/barrel importing jsr:@netscript/plugin-<kind> + core
                       #   2) the sample stubs (typed identifier-substitution, not String.replace)
  mod.ts               # ~5-10 LOC: createPluginScaffold(spec) -> toEntrypoint + runScaffoldCli
```
DELETE: `artifacts.ts` `generate{ServiceMain,Router,Contracts,ServiceInit,CombinedEntrypoint,
DatabaseSchema,Mod,...}` + `files.ts`/`writePlannedFiles` + auth `templates/**` + local
`ScaffolderContext`/`ScaffoldResult` re-declarations (import from `@netscript/plugin/protocol`).

CLI (`packages/cli`): KEEP all config wiring (appsettings, netscript.config, deno.json imports,
register-plugins, service-context) + `copyPluginSchemasToRootDb`. REMOVE the `renderPlugin()`
full-source branch so first-party uses the same thin path as JSR. `dispatchPluginScaffold` invokes
the thinned plugin scaffolder unchanged (same `--context-json` contract).

## Userland surface emitted by `plugin add <kind>` (the corrected, complete list)

1. **CLI config edits** (unchanged, correct): appsettings.json entry; `netscript.config.ts`
   `plugins[]` specifier; `deno.json` imports (`jsr:@netscript/plugin-<kind>`) + workspace; Aspire
   `register-plugins.mts`; `services/_shared/plugin-service-context.ts`; shared cache if required.
2. **Plugin prisma** (unchanged, correct): copied from the dep tarball into
   `database/<engine>/schema/plugins/<kind>/`.
3. **Thin plugin-owned glue** (NEW, typesafe): a wiring entrypoint/barrel at the userland `<kind>/`
   root importing the dep + core, plus 1–3 user-owned sample stubs. NO plugin TS source.

NEVER emitted any more: `plugins/<name>/{mod.ts,deno.json,services/**,contracts/**,src/runtime/**,
src/aspire/**,bin/**,streams/**}` — all resolved from `jsr:@netscript/plugin-<kind>`.

## Slices (one commit each; gate + push are per-slice but no PR until S5 — fresh branch)

- **S1 core surface** — build `packages/plugin/src/scaffold/*` per Target shape. Typed code model +
  factory + cli runner + typed manifest builder + name helper + barrel + `./scaffold` export. Every
  public symbol JSDoc'd; `@module`+`@example` on barrel.
  Gates: `run-deno-{check,lint,fmt}.ts --root packages/plugin --ext ts,tsx`; `deno task test`;
  `run-deno-doc-lint.ts` over the FULL `./scaffold` export set; `deno publish --dry-run`
  `@netscript/plugin`.
- **S2 thin plugins (×5: workers, streams, sagas, triggers, auth)** — rewrite each `scaffolder.ts`/
  `mod.ts`/`spec.ts`, add `stubs/*.ts`, delete all DEP-INTERNAL generators + auth templates. Prove
  `scaffold.plugin.json` byte-identity (typed `buildScaffoldPluginJson` equality test per plugin).
  Gates per plugin: scoped check/lint/fmt `--ext ts,tsx`; test; `deno publish --dry-run`;
  `deno task plugins:check` (manifests byte-unchanged).
- **S3 CLI no-copy** — delete `renderPlugin()` full-source branch + any now-dead CLI plugin
  source-copy templates (`kernel/templates/plugins/generate-plugin-*`, `kernel/assets/.../
  generate-plugin-*.ts.template`, maintainer `official-plugin-source.ts` copier where it copies TS
  source); confirm config wiring + prisma copy intact. Drop `plugins/*` workspace-member add iff no
  source lands there.
  Gates: scoped check/lint/fmt on `packages/cli`; test.
- **S4 gates-as-gates** — extend `arch:check` to run `check-doctrine.ts` over `packages/plugin` +
  all 5 plugins; add a negative e2e assertion (scaffolded userland contains NO plugin TS source:
  `services/`, `contracts/`, `src/runtime/`, `src/aspire/`, `bin/`); ensure doc-lint + plugins:check
  are in the merge matrix.
  Gates: `deno task arch:check` green; targeted e2e assertion compiles/passes.
- **S5 verify + sweep** — full merge-readiness matrix: `arch:check`, `plugins:check`, scoped
  check/lint/fmt on `packages/plugin`+`plugins`+`packages/cli`, `test`, doc-lint over `./scaffold`,
  `publish:dry-run` for `@netscript/plugin` + 5 plugins, `e2e:cli run scaffold.runtime --cleanup
  --format pretty`. Dead-code sweep (orphaned scaffold files/exports/imports). Record root-schema
  typed-builder as arch-debt (deferred, justified). Update `context-pack.md`.

Order: S1 → S2 → S3; S4 after S2; S5 last. No `deno.lock` churn committed; no new casts beyond the 2
sanctioned; no `any`; stage explicit paths only; no force-push.

## Open item the implementing agent confirms before S2 (cheap read, not a blocker)

Exact userland location + barrel shape for sample stubs in the no-copy model — confirm against the
live CLI render path (`add-plugin.ts`, `render-plugin.ts`, `dispatch-plugin-verb.ts`) + Agent A's
root-barrel finding (`workers/mod.ts` etc. at root). Default per D-EMIT: root `<kind>/` userland dir
+ root barrel. Record the confirmed layout in `worklog.md`.
