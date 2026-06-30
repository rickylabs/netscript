# Plan v2 — Plugin Adapter Unification (#157, full unification)

> Supersedes plan v1 (thin-scaffold-only). User locked **full unification** on 2026-06-29:
> one core-owned plugin **command contract** (Vite-plugin-style composition, NOT cross-package
> inheritance), shared mandatory-command logic in core, the per-plugin connector supplies **seams**.
> Archetypes: `@netscript/plugin` = ARCHETYPE-2/3 (contract + runtime); `@netscript/cli` =
> ARCHETYPE-6; plugins = ARCHETYPE-5. Lane: Claude sub-agents, **gates are the verification**
> (D-LANE, user-set). See `research.md` §"RE-ARCHITECTURE v2" for grounding + locked decisions.

## The thesis (user, 2026-06-29, verbatim intent)

- **Core is never aware of any specific plugin.** Plugins use core; core never imports a plugin.
- The plugin package is the **"NetScript adapter" / connector**: it plugs plugin-core's
  implementation into the NetScript ecosystem (services, setup, scaffold, commands).
- The adapter gets its command behavior by consuming a **base contract from core + seams** — modeled
  on **Vite's plugin architecture** (core owns the pipeline and calls well-known hooks; a plugin is a
  typed contract object), made **more restrictive** than Vite (single-target → strong defaults).
- **MANDATORY commands** (every plugin has them; logic is similar → lives in core, parameterized by
  plugin-supplied inputs): `install`, `doctor`, `info`, `update`, `remove`.
- **OPTIONAL commands** (per-plugin specifics; core defines the contract/shape like an oRPC contract,
  plugin implements): `add <resource>`, `generate <resource>`, plus any plugin verbs
  (`list`/`run`/`logs`/`inspect`/`enable`/`disable`…).
- **`@netscript/plugin` + `@netscript/cli` own the logic and rule the shapes/output.** Plugins are
  thin connectors.

## What already exists (build on it, do not reinvent)

- `packages/cli/.../dispatch-plugin-verb.ts`: `FRAMEWORK_VERBS =
  ['add','remove','enable','disable','sync','setup','update','doctor','info']`;
  `dispatchPluginVerb` runs `deno x -A jsr:<pkg>/cli <verb> …`. → core already owns a verb taxonomy +
  dispatch. We rename `add→install`, canonicalize the mandatory set, and route resources through it.
- `packages/cli/.../add/add-plugin.ts`: host-side install orchestration — config wiring
  (`updateAppsettings`, `ensureNetScriptConfigPlugin`, `ensureRootImportsForPluginKind`,
  `ensureSharedCache`, `ensureWorkspaceMember`, `regenerateAspireHelpers`, service-context) +
  `copyPluginSchemasToRootDb`. **KEEP** (plugin-agnostic, correct). The `renderPlugin()` full-source
  branch is the disease → **DELETE**.
- `packages/plugin/src/cli/*`: `PluginCli` (has a forbidden orchestrating `run()` — A4 violation to
  fix), `PluginItemScaffolder`, `DoctorReport`/`isDoctorReportPassing`, `PluginRuntimeConfigCli`,
  `mountPluginCli`, `routeVerb`. → the **bones** of the contract; unify + fix.
- `scaffold.plugin.json` provider block already carries static seams (kind, portRangeKey,
  requiresDb/Kv, defaultEntrypoint, permissions…). → the host-readable face of the contract.
- Per-plugin `src/scaffolding/` (workers 7 / sagas 2 / triggers 3 scaffolders; streams/auth none) +
  `src/cli/*-cli-backend.ts` + my branch `src/scaffold/stubs/*`. → THREE forked item-generators to
  collapse into ONE.

## Target shape

### A. Core contract — `@netscript/plugin/adapter` (new export; consolidates `/cli`, `/scaffold`, `/protocol/scaffolder`)

A plugin is a **typed contract object** (Vite-plugin shape), returned by a factory. Core owns every
command's logic; the plugin supplies seams + optional resource handlers. No `plugins/*` class
`extends` anything from core (doctrine 03 L162-175). Strong single-target defaults baked in.

```ts
/** The NetScript plugin adapter contract. Core consumes this; it never imports the plugin. */
export interface NetScriptPlugin {
  readonly name: string;        // "@netscript/plugin-workers"
  readonly kind: string;        // "workers"
  readonly displayName: string;

  /** Seams the MANDATORY commands consume. Core owns the algorithms. */
  readonly install: InstallSpec; // depSpecifier, starterResources[], configParams, prismaContract?, wiringEntry
  readonly doctor?: DoctorSpec;  // healthEndpoint (sensible default), requiredConfigKeys, extraChecks?
  readonly info?: InfoSpec;      // capabilities, versionSource (defaults to manifest)
  // update/remove use install's seams + core defaults; override only if a plugin needs to.
  readonly update?: UpdateSpec;
  readonly remove?: RemoveSpec;

  /** OPTIONAL resource commands. Contract-shaped; plugin implements. */
  readonly resources?: readonly PluginResource[]; // {name:"job", scaffolder, list?, describe?}
  readonly commands?: readonly PluginCommandSpec[]; // extra plugin verbs (run/logs/…)
}
```

Core spine (stub-only, A4-clean) + layer-2 (R-BASE-L2, doctrine-sanctioned for shared bodies) +
factory + runner:

```
packages/plugin/src/adapter/
  contract.ts        # NetScriptPlugin + *Spec seam interfaces + PluginResource + PluginCommandSpec
  item/
    item-scaffolder.ts   # ONE item-generator contract: ItemScaffolder<TInput> { name; emit(input): ScaffoldArtifact[] }
    artifact.ts          # typed file descriptor (path + typed body source)
    substitute.ts        # typed identifier-substitution over a type-checked stub source (named tokens)
  commands/          # core-owned MANDATORY command logic (layer-2 shared bodies + free fns)
    install.ts       # the install algorithm: emits userland glue via item scaffolders + returns ScaffoldResult
    doctor.ts        # health-check algorithm → DoctorReport (uses healthEndpoint default)
    info.ts  update.ts  remove.ts
  runner/
    plugin-cli-runner.ts # routes a verb → mandatory command logic OR plugin resource/command handler
                         #   (replaces PluginCli.run() orchestration; spine stays stub-only)
  factory.ts         # createPluginAdapter(plugin): { toCli(): PluginCliEntrypoint; toScaffold(): PluginScaffoldEntrypoint }
  defaults.ts        # strong single-target defaults (Vite-style conventions, restrictive)
  mod.ts             # @module + @example; public surface barrel
```

Reuse `protocol/{scaffolder,manifest}.ts` + `ports/file-system-port.ts`. Add `"./adapter"` to
`packages/plugin/deno.json` exports. Fix `PluginCli.run()` by moving dispatch to `plugin-cli-runner`.

### B. Core CLI — `@netscript/cli` (owns host-side orchestration + the verb taxonomy)

- Canonical mandatory verbs: `install` (rename of `add`), `doctor`, `info`, `update`, `remove`
  (+ keep `enable`/`disable`/`sync`/`setup` as today). Update `FRAMEWORK_VERBS` + the `netscript
  plugin <verb> <kind>` surface; per-kind resource verbs route as `netscript <kind> <verb>
  <resource>`.
- KEEP all host-side config wiring + `copyPluginSchemasToRootDb`.
- DELETE the `renderPlugin()` full-source branch in `add-plugin.ts`; install always uses the thin
  path (plugin subprocess emits userland glue via the unified item generator).
- Dispatch unchanged in mechanism (`deno x jsr:<pkg>/cli <verb>`); `install` stops being a
  special-cased `./scaffold` and becomes the `install` verb against the same contract.

### C. Per-plugin connector — `plugins/<kind>/` (thin; supplies seams, owns sample/resource source)

```
plugins/<kind>/
  src/adapter/
    plugin.ts        # the NetScriptPlugin object: kind, install/doctor/info seams, resources[]
    resources/<r>/   # ONE scaffolder per resource (job/task/saga/trigger/…):
      <r>.ts         #   ItemScaffolder built on a type-checked stub source-of-truth
      <r>.stub.ts    #   REAL, type-checked sample source (gated by the plugin's own check/lint)
  cli.ts             # export default createPluginAdapter(plugin).toCli()      (~3 LOC)
  scaffold.ts        # export default createPluginAdapter(plugin).toScaffold()  (~3 LOC)
```

DELETE per plugin: `src/scaffolding/` (string `generate()` + `.template` + forked `*ItemScaffolder`
bases), `src/cli/*-cli-backend.ts` glue that re-implements item writing, my branch `src/scaffold/
{spec,scaffolder,stubs,mod}.ts`, `artifacts.ts` source factories, auth `templates/**`. The ONE
scaffolder per resource is reused by BOTH `install` (starter set) and `add <resource>` (user id).
streams/auth (no resources today) declare `resources: []` and only emit a wiring barrel.

### D. The ONE item generator (kills the THREE mechanisms)

`ItemScaffolder<TInput> { readonly name; emit(input): readonly ScaffoldArtifact[] }`. Body =
type-checked stub source-of-truth + typed identifier-substitution (named tokens, not `String.replace`,
not line-array `join`). `install` calls each starter resource's `emit(defaultInput)`; `add
<resource> <id>` calls `emit({id})`. Same code path → zero duplication.

## Slices (one commit each, gated green before the next; no PR re-open until S7)

- **S0 — folded into S1 (forward-only reconcile).** The branch is pushed (PR #172) → **no
  force-push**; reconcile is forward commits only. The v1 deletions (artifacts.ts source factories,
  auth `templates/**`, `renderPlugin()` full-source copy) are correct and STAY deleted. The wrong v1
  replacement (`src/scaffold/{spec,scaffolder,stubs,mod}.ts` + `createPluginScaffold`) is deleted and
  superseded by `src/adapter/*` IN S1 — the reshape is the reconcile. No separate baseline commit.
- **S1 — core contract + item generator.** Build `packages/plugin/src/adapter/*`: `NetScriptPlugin`
  + seam interfaces, the ONE `ItemScaffolder` + artifact + typed substitution, the mandatory command
  logic (`install/doctor/info/update/remove`), `plugin-cli-runner` (fixes `PluginCli.run()` A4
  violation), `createPluginAdapter`, strong `defaults.ts`, `./adapter` export, full JSDoc +
  `@module`/`@example`. Gates: scoped check/lint/fmt `packages/plugin`; `deno task test`; doc-lint
  over the FULL `./adapter` export set; `deno publish --dry-run @netscript/plugin`.
- **S2 — workers connector (reference).** Rewrite to `src/adapter/plugin.ts` + `resources/{job,task}`
  ItemScaffolders on type-checked stubs; `cli.ts`/`scaffold.ts` 3-LOC; delete `scaffolding/` +
  `cli/*-cli-backend.ts` + my `scaffold/*` + `artifacts.ts`. Prove `add job <id>` and the install
  starter set come from the SAME scaffolder. Gates: scoped check/lint/fmt; test; publish dry-run;
  manifest byte-identity.
- **S3 — sagas / triggers / streams / auth connectors.** Same shape; streams/auth = `resources:[]` +
  wiring barrel only. Per-plugin gates as S2.
- **S4 — CLI unification.** Rename `add→install`, canonical mandatory verbs, per-kind resource
  routing, delete `renderPlugin()` full-source branch, keep config wiring + prisma copy, point
  install at the `install` verb/contract. Gates: scoped check/lint/fmt `packages/cli`; test.
- **S5 — gates as gates.** Extend `arch:check` (`check-doctrine.ts`) over `packages/plugin` + all 5
  plugins; wire `jsr-audit`/doc-lint + `plugins:check` into the merge matrix; ADD negative e2e (no
  plugin TS source — `services/`,`contracts/`,`src/runtime/`,`src/aspire/`,`bin/` — in userland) +
  a positive e2e (install starter set + `add <resource>` produce identical-shape source from one
  scaffolder). Gates: `deno task arch:check` green; e2e assertions pass.
- **S6 — doctrine (#158).** Record the plugin-thinness / core-centralization LAW + the
  adapter-contract pattern (Vite-style composition, no cross-package inheritance, strong defaults) as
  an append-only doctrine entry; record any waivers (e.g. plugin-core base-class location) in
  `arch-debt.md`.
- **S7 — verify + sweep + promote.** Full merge-readiness matrix: `arch:check`, `plugins:check`,
  scoped check/lint/fmt over `packages/plugin`+`plugins`+`packages/cli`, `test`, doc-lint,
  `publish:dry-run` ×6, `e2e:cli run scaffold.runtime --cleanup --format pretty`. Dead-code sweep.
  Adversarial Claude review of the built artifact; fix every caveat. Update `context-pack.md` + PR
  #172 body. Then ready-for-merge.

### Maintainer-facing tooling (user, 2026-06-29) — the marketplace AUTHOR side

The same contract that lets core own the shape also lets us give third-party plugin authors a
`create-vite`-grade on-ramp and a `deno publish --dry-run`-grade verifier. Both reinforce "core owns
the shape": the generator emits the conforming shape; the verifier proves conformance. Both are
ARCHETYPE-6 CLI surfaces built on the SAME core machinery (dogfooding — no new third mechanism).

- **`netscript plugin verify [path]` — author-grade plugin doctor (the "exactly what's wrong"
  report).** Distinct from the consumer-facing `doctor` (which health-checks an *installed* plugin in
  a user's project). `verify` is what a plugin AUTHOR runs on their own package. It composes existing
  Deno-native + repo tools into ONE structured pass/fail report — reusing, never re-implementing:
  `deno doc --lint` (slow types / doc coverage, via `.llm/tools/run-deno-doc-lint.ts`),
  `deno publish --dry-run` (tarball + file list, via `.llm/tools/run-publish-dry-run.ts`),
  `parsePluginManifest` + the `scaffold.plugin.json` JSON Schema (manifest integrity),
  `check-doctrine.ts` (archetype-5 fitness), and a NEW **adapter-contract completeness check**
  (every mandatory seam present + well-typed, resources well-formed, no plugin TS source reachable in
  the emit set). Output mirrors `jsr-audit`'s report template + a per-check remediation line, so the
  author "KNOWS EXACTLY WHAT IS WRONG." JSR-ready, `@std`/Deno-native, no bespoke linters.

- **`netscript plugin new <name>` — conforming starter-shape generator (the author on-ramp).** Emits
  a new plugin package skeleton that already satisfies the adapter contract: the `NetScriptPlugin`
  object (`src/adapter/plugin.ts`) with one sample resource + ItemScaffolder on a type-checked stub,
  `cli.ts`/`scaffold.ts` (~3 LOC each), a valid `scaffold.plugin.json`, `deno.json` (exports +
  publish include/exclude + JSR metadata), a `database/*.prisma` stub, README, and `@module` docs —
  i.e. a package that passes `plugin verify` on creation. Built on the SAME core item generator and
  typed-emit machinery as install/`add <resource>` (the framework scaffolds plugins the same typesafe
  way plugins scaffold userland). This is the marketplace author on-ramp under #167/#157.

- **S8 — `plugin verify` author doctor.** Build the composed verifier (core report model in
  `@netscript/plugin/adapter` + `@netscript/cli` presentation command) reusing the Deno-native + repo
  gate tools above + the new contract-completeness check. Gates: scoped check/lint/fmt; test (verify
  a known-good plugin PASSES and a seeded-broken fixture reports each defect); doc-lint; publish
  dry-run. Self-test: run `plugin verify` over all 5 first-party plugins → all green.
- **S9 — `plugin new` generator.** Build the starter-shape generator on the unified item generator;
  emit a conforming skeleton. Gates: scoped check/lint/fmt; test; **e2e: generated skeleton passes
  `plugin verify` + `deno publish --dry-run` with zero edits** (closes the author loop).

Order: S0(folded) → S1 → S2 → S3 → S4 → S5; S6 anytime after S1; S8 after S1+S4; S9 after S1+S8; S7
last (verify includes S8/S9 in the matrix). No `deno.lock` churn committed; no new casts beyond the 2
sanctioned; no `any`; explicit-path staging only; no force-push.

### Re-architecture license (user, 2026-06-29)

The slices are **not** constrained to graft the unified contract onto the existing `packages/plugin`
and `packages/cli` structure. The user explicitly authorizes **rethinking and re-architecting the
internal design of both packages** where a cleaner shape serves the one-contract goal — do not
preserve current folders/classes/dispatch for their own sake:

- `packages/plugin` — its internal layering may be **redesigned** to the proper doctrine layering
  (`domain → ports → application → adapters → presentation`). The current `src/cli/*` bones
  (`PluginCli`, `PluginItemScaffolder`, `mountPluginCli`, `routeVerb`, the forked item bases) are
  raw material to **reshape or replace**, not a structure to keep. `FRAMEWORK_VERBS` is a useful
  discovery, not a mandate to retain its current dispatch implementation.
- `packages/cli` — the plugin command/dispatch surface (`dispatch-plugin-verb.ts`, `add-plugin.ts`,
  the `PluginScaffolder`/`renderPlugin` path) may be **restructured** end-to-end so the unified
  install/`add <resource>` flow is the spine, not a branch bolted beside the old one.

This **widens latitude, not the bar.** All invariants still hold and are non-negotiable: doctrine
layering + axioms (A4 spine stub-only, A5 composition, no cross-package inheritance), JSR-readiness,
no plugin-source leak into userland, host-side config-wiring **behavior** preserved (its
implementation may be restructured), the 2-cast limit, no `any`, no `deno.lock` churn, forward-only.
Bigger structural moves are encouraged where they reduce duplication and sharpen the contract; record
any doctrine waivers in `arch-debt.md`. When a reshape materially exceeds a slice's footprint, split
it and record the rescope in `drift.md`.

### Definition of done (user-owned bar; every slice honors these)

- **Skill-first + harness:** every implementation agent begins `use harness` + activates the matching
  skills (`netscript-harness`, `netscript-doctrine`, `jsr-audit`, `netscript-tools`,
  `netscript-deno-toolchain`, `netscript-cli`, `netscript-pr`).
- **Deno-native first:** reach for `@std/*`, `Deno.*`, Web Platform, and the native toolchain
  (`deno doc`, `deno publish`, `deno check/lint/fmt`) before any local abstraction (Rule #3 wrap,
  don't reinvent). No hand-rolled linters/printers where a Deno-native path exists.
- **JSR-ready:** every produced package/export passes `jsr-audit` — explicit return types (no slow
  types), `@module` + symbol JSDoc with `@example`, clean publish file list, `publish:dry-run` green.
- **Doctrine + fitness as ACTUAL gates:** `arch:check` (extended over `packages/plugin` + 5 plugins)
  and `plugins:check` are merge-blocking, not advisory.
- **Zero dead/duplicate code:** the three old mechanisms + three forked item bases + `.template`
  files + v1 `src/scaffold/*` are deleted, not stranded; a dead-code sweep (S7) proves it.

## Open confirmations folded in (already locked by user 2026-06-29)

- Mandatory set = install/doctor/info/**update/remove** (full lifecycle). ✓
- Full rename + namespacing (`plugin install <kind>`, `<kind> add <resource>`, `<kind> generate
  <resource>`). Breaking CLI surface — acceptable pre-1.0. ✓
- Extension = contract + composition + seams (Vite model), core packages own the logic/rules,
  strong single-target defaults; NO cross-package `extends`. ✓
