# Wave 6 — `@netscript/cli` — Research findings

> **Status:** DRAFT — A–F written, slice plan + target tree + standards outline included.
> See `research-brief.md` for the questions and `context-pack.md` for the read order.
> RESEARCH ONLY: no implementation, no `packages/` edits.

## TL;DR

- **A. Domain decomposition** — the CLI owns **7 bounded domains**
  (scaffolding, runtime, deploy, database, plugin, config, loggers) +
  3 command surfaces (`public` = user CLI, `maintainer` = first-party
  commands, `local` = local-source contributor) + 1 cross-cutting
  kernel. Current `packages/cli/src/{kernel,public,maintainer,local}/`
  is **architecturally correct** for A6 — the changes are *targeted
  moves*, not a rewrite. A6 gate matrix in §A.5.

- **B. Standards** — proposed `packages/cli/docs/standards.md` (§S.1–§S.7 below)
  covers command contract, typed error model, IO discipline, naming,
  testing tiers, public-surface rules, layer discipline. **15
  violations catalogued** (V-1 through V-14 + 1 doctrine cross-ref)
  with file:line evidence.

- **C. Future-impl readiness** — 5 registries already seam-ready
  (`Template`, `DbEngine`, `OutputRenderer`, `PluginKind`,
  `DeployTarget`); `DeployTargetKey` is a literal-union lock-in
  (V-9) that gets fixed by the `DeployTargetPort` slice. The
  `CliExitError` tree is already in `kernel/domain/errors/`.

- **D. Aspire 13.4 deploy seams (DESIGN ONLY)** — `DeployTargetPort`
  + `DeployTargetRegistryPort` defined. The 17 CLI `Deno.Command`
  call sites are categorized; only 2 are aspire (in
  `aspire-command-executor.ts`). Windows deploy (compile/bundle/sign
  via `deno compile` + `servy-cli.exe`) is *not* aspire — it
  becomes the `WindowsServiceDeployTarget` adapter. Future k8s /
  container / cloud adapters wrap `Aspire.Hosting.Kubernetes`,
  `Aspire.Hosting.ContainerApps`, `Aspire.Hosting.AWS`,
  `Aspire.Hosting.Azure`. Aspire 13.4 native Deno apphost not
  yet released at research time; bump deferred to slice 5.

- **E. Scaffolding improvements** — bounded, concrete, incremental
  (E.2.1–E.2.10). Scaffold is 1,361 LOC across 13 files (max 211
  LOC); Wave 5 verdict `scaffold.runtime` 41/41 green.

- **F. Own analysis** — `deno check packages/cli` is **clean**;
  `deno publish --dry-run` fails **upstream in `packages/aspire`**
  (doctrine §9 documented false positive — not a CLI blocker).
  No file exceeds 500 LOC (max 384, the `ui/registry.ts` and
  `scaffold/writers/write-app-files.ts` files). **Zero** `console.*`
  leaks. One vendor URL leak (V-14: `editor-config.ts` lines 42, 115).
  Test/code ratios: `kernel` 13.7 %, `public` 9.2 % (thin),
  `maintainer` 11.6 %, `local` 25 % (small N), `e2e` 9.7 %.
  15 risks registered (R-1 to R-15).

- **Slice plan** — 7 slices (0–6) sized to ≤ 1 PR each. Critical
  path: 0 → 2 → 3 → 4 → 6. Parallel: 1 (docs) and 5 (Aspire 13.4).

- **AP-1 verdict (Research):** the existing `packages/cli AP-1`
  "Restructure" debt is **valid**; the restructuring is **bounded**
  to the moves in the target tree below. The CLI is *not* broken —
  it is a *fast-evolved* A6-v1 that needs a planned promotion to
  A6-v2. Closing AP-1 is a 7-PR program, not a single rewrite.

## A. Domain decomposition & enterprise folder structure

### A.1  Bounded domains (the answer to feedback #1)

The CLI is no longer "the scaffolder". Measured against the current `src/`, it owns
**seven** true bounded domains plus the cross-cutting kernel and the thin command
surfaces:

| # | Bounded domain       | User-visible concern                                                | Where it lives today                                                                                 | Where it must live (target)                                          |
| - | -------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1 | **scaffold**         | `netscript init`, `netscript add <plugin|service|db|contract>`       | `kernel/adapters/scaffold/`, `kernel/application/scaffold/` (+ `writers/`), `public/features/{init,…}` | `public/features/scaffold/<verb>-<noun>/`                            |
| 2 | **runtime / serve**  | process supervision, dev/serve, Aspire bring-up, `runtime.detect`   | `kernel/adapters/runtime/` (`clock`, `file-system`, `platform`, `process`, `prompt`), `kernel/ports/`, `kernel/domain/runtime-detect*` | `public/features/serve/`, `kernel/adapters/runtime/`                 |
| 3 | **deploy**           | target-aware install/start/stop/uninstall; packaging                | `kernel/adapters/deploy/`, `kernel/adapters/windows/` (the hand-patched path), `public/features/deploy/` | `public/features/deploy/<target>/…`, `kernel/ports/deploy/*`         |
| 4 | **maintainer**       | monorepo-only: sync packages/templates/plugins, codegen, probe      | `maintainer/features/`, `local/features/`, `kernel/application/scaffold/writers/`, `maintainer/composition/` | `maintainer/features/<concern>/`                                    |
| 5 | **plugins**          | marketplace, plugin add/list/copy, kind classification              | `kernel/adapters/plugin/`, `public/features/plugins/`, `public/domain/plugin-add-plan.ts`            | `public/features/plugins/…`                                          |
| 6 | **diagnostics**      | doctor / probe / dry-run, validation reports                        | `maintainer/features/probe`, `kernel/adapters/loggers/` (console reporter)                           | `public/features/doctor/`, `kernel/adapters/diagnostics/`            |
| 7 | **contracts / db**   | contract & db-engine add (cross-package surface)                    | `public/features/{contracts,db}`, `kernel/adapters/{contracts,database}/`                            | `public/features/{contracts,db}/…`                                  |
| X | **kernel**           | ports, abstracts, assets, adapters (cross-domain technical role)    | `kernel/{domain,ports,application,adapters,presentation,assets,templates}/`                          | `kernel/{domain,ports,application,adapters,presentation,assets}/`    |

A6 v2 (`.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` §"Layering modes") names this
exact split: **kernel is horizontal** (role folders, technical concerns), **surfaces are
vertical** (feature folders per command). The CLI's current `kernel/adapters/{deploy,
windows, scaffold, runtime, database, contracts, plugin, config, loggers, templates,
service}/` is the *horizontal* role layout for adapters; the proposed target moves
*command code* (Cliffy commands, use cases, pipelines, input types) out of `kernel/` and
into surface-level feature folders, keeping `kernel/` to types/ports/adapters/assets
**only**.

### A.2  Current → proposed folder map

| Current location                                                                                        | Proposed target                                          | Why                                                                                                      |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/kernel/application/{abstracts,registries,scaffold,scaffold/writers,ui}/`                           | `src/kernel/application/{abstracts,registries}/`         | `application/scaffold/` is a mis-classification: the writers are command pipeline steps, not a kernel concern. Move to `public/features/scaffold/<verb>/steps/`. |
| `src/kernel/domain/{errors,errors/,deploy/,scaffold/,resolved-config,…,core-types,plugin-kind,db-engine,infrastructure-config,service-manifest,service-shape}/` | `src/kernel/domain/{errors,values/}/` + one folder per polymorphic axis (`plugin-kinds/`, `db-engines/`, `deploy-targets/`, `service-shapes/`, `manifests/`) | R-FOLD-AD-COLOC: when ≥ 2 concretes share an abstract, they live in one plural-named folder. The current `domain/` is a flat 11-child list; the target groups each polymorphic family. |
| `src/kernel/ports/{prompt,file-system,logger,jsr-resolver,…}.ts`                                        | unchanged (role-folder)                                  | Already correct; rename `jsr-resolver` → `jsr/`, `file-system` → `fs/`, `logger` → `logger/` only if the future shape requires it. **Defer to impl.** |
| `src/kernel/adapters/{service,deploy,loggers,scaffold,config,runtime,templates,windows,database,plugin,contracts}/` | `src/kernel/adapters/{fs,process,clock,logger,prompt,workspace-resolvers,scaffolders,templates,database,plugin,service}/` + **drop** the `windows/` and `deploy/` subtrees into `src/kernel/ports/deploy/` + new surface adapter folders | `kernel/adapters/` should expose **port-shaped concrete adapters**. `deploy/` and `windows/` are *concrete deployment targets*, not kernel concerns. They belong behind a port (see §D) and the concretes live under a `deploy/targets/<target>/` folder. |
| `src/kernel/presentation/{abstracts,output}/`                                                           | unchanged                                                | Already spine-correct: `abstracts/` for spine + layer-2, `output/` for the only `console.*` site.        |
| `src/kernel/assets/{service,generated}/` + `src/kernel/templates/{app,aspire}/`                         | collapsed: `src/kernel/assets/<group>/` holds `.template` files only; codegen modules live in a `kernel/codegen/` subtree (not in `templates/`) | `kernel/templates/aspire/helpers/{register,tests}/` is **depth 6** under `src/` (violates R-FOLD-CARD ≤ 4). The helpers + tests should move to `src/kernel/codegen/aspire/{generators,tests}/` and `src/kernel/assets/aspire/` hold the templates themselves. |
| `src/public/{adapters,domain,features,composition,ports,presentation,scaffolding,templates}/`           | `src/public/{composition.ts,deps.ts,adapters/<surface-adapter>/,features/<feature>/<sub-feature>/{steps/},ports/}` | Collapses the 7 top-level siblings into the A6 v2 shape: `composition.ts`, `deps.ts`, `adapters/`, `features/`, `ports/`. The current `public/domain/*-plan.ts` files are **use case input shapes** — they belong in `<feature>/<sub>/<verb>-<noun>-input.ts`. |
| `src/maintainer/{features,composition}/` (current)                                                      | unchanged shape, **drop** the existing `kernel/application/scaffold/writers/` codegen modules into `maintainer/features/codegen/<name>/steps/` | Maintainer surface is the home of monorepo-only codegen, sync, probe, test-scaffold. It is *not* a kernel concern. |
| `src/local/{features,composition}/` (a third surface — `local-contributor`)                             | merge into `maintainer/` as `maintainer/features/local-contributor/` | The `local/` surface is a stub (single feature `plugins/add/`). F-CLI-3 forbids surface-to-surface imports, and a third surface buys nothing. Promote to a maintainer feature. |
| `src/{public,maintainer,local}/` non-`composition.ts` files (e.g. `public/ports/jsr-resolver-port.ts`)  | use `ports/` for surface-owned port re-exports (R-COMP-EXT-MANIFEST); collapse to one file per port                                         | The current `public/ports/` is already shaped correctly for A6 v2.                                                                  |
| `packages/cli/e2e/` (the workspace member Wave-2/4 flagged as Wave-6-owned)                             | `packages/cli-e2e/` (top-level workspace member)         | A6 v2 doctrine §"Greenfield Folder Shape" calls out `packages/cli/e2e/` as the canonical A6 v2 location for the e2e workspace member. Promote from a child to a sibling workspace member for clean `deno task e2e:cli` invocation. (See §F.) |
| `src/kernel/templates/aspire/helpers/...` (depth 6)                                                     | `src/kernel/codegen/aspire/...` (depth 4)                 | R-FOLD-CARD ≤ 4 from `src/`. `templates/aspire/helpers/tests/...` is a clear violation; tests + register modules belong under a `codegen/` role. |

### A.3  Cross-domain coupling and the "windows hand-patch"

The brief's feedback #4 names the concrete coupling. The current seam is leaky:

- `src/public/features/deploy/build/build-windows-*.ts` imports from
  `src/kernel/adapters/windows/{servy,environment,runtime,compile,manifest}/` directly.
- `src/kernel/adapters/deploy/commands/servy-command.ts` shells out to
  `servy-cli.exe` via `new Deno.Command(servyCliPath, …)` with no port.

This is a **two-axis** coupling violation:

1. The **public** surface reaches **kernel adapters** for a concrete target. In
   A6 v2 the public surface should not import a `kernel/adapters/<target>/`
   directly; it should depend on a port (`kernel/ports/deploy/target-port.ts`)
   satisfied at composition.
2. The deploy *runtime* is a single concrete target (`Windows / servy`).
   The type system enforces the lock-in: `DeployTargetKey` is the union
   `'windows-service' | …` — only one variant exists today. The seam is
   closed *by shape*, not by extension.

The target architecture fixes both with a **`DeployTarget` port** +
`DeployTargetRegistry` (see §D for the full design). The
`build-windows-*.ts` files keep their names but their import graph flips to
`from 'kernel/ports/deploy/target-port.ts'`.

### A.4  Concrete target `src/` tree (A6 v2 conformant, F-CLI-25 / R-FOLD-CARD clean)

```
packages/cli/
├── deno.json
├── mod.ts                          # JSR public surface (the public binary's flows)
├── maintainer.ts                   # gated; never published
├── testing.ts                      # in-memory adapters, fixtures
├── README.md
├── docs/                           # NEW: standards.md (see §B)
└── src/
    ├── kernel/                     # HORIZONTAL — role folders only (≤ 12 children total)
    │   ├── domain/                 # ≤ 6 children
    │   │   ├── errors/             # CliError + concretes (ConflictError, NotFoundError, …)
    │   │   ├── values/             # ids, paths, enums (small value types)
    │   │   ├── plugin-kinds/       # abstract + api|worker|saga|trigger concretes
    │   │   ├── db-engines/         # abstract + postgres|mysql|sqlite|sqlserver concretes
    │   │   ├── deploy-targets/     # abstract + windows-service (Phase 1), k8s/…/… (future, via port)
    │   │   └── service-shapes/     # abstract + worker|saga|trigger|stream concretes
    │   ├── ports/                  # one folder per port, `*-port.ts` files only
    │   │   ├── fs/                 # FileSystemPort
    │   │   ├── process/            # ProcessPort (wraps Deno.Command)
    │   │   ├── clock/              # ClockPort
    │   │   ├── logger/             # LoggerPort
    │   │   ├── prompt/             # PromptPort
    │   │   ├── workspace-resolvers/   # WorkspaceResolverPort (monorepo-only; surfaced via main)
    │   │   ├── jsr/                # JsrResolverPort (public-only)
    │   │   ├── deploy/             # DeployTargetPort + DeployTargetRegistry (see §D)
    │   │   └── scaffolding/        # ScaffolderPort + FileSystemScaffolder
    │   ├── application/            # ≤ 4 children
    │   │   ├── abstracts/          # CliCommand, CliCommandGroup, CliRoot, UseCase,
    │   │   │                       # Registry, ScaffoldCommand, ListCommand,
    │   │   │                       # DeployStepCommand, Pipeline<T>, PipelineStep,
    │   │   │                       # Manifest<TKey, TValue>, OutputRenderer
    │   │   └── registries/         # one Registry concrete per extension axis
    │   ├── adapters/               # ≤ 12 children — *port-shaped concrete adapters only*
    │   │   ├── fs/                 # DenoFileSystem
    │   │   ├── process/            # DenoProcess
    │   │   ├── clock/              # SystemClock
    │   │   ├── logger/             # ConsoleLogger (the only console.* home besides output/)
    │   │   ├── prompt/             # DenoPrompt
    │   │   ├── workspace-resolvers/# WorkspaceRepoRootResolver
    │   │   ├── jsr/                # JsrImportResolver
    │   │   ├── scaffolders/        # FileSystemScaffolder
    │   │   ├── database/           # exists today; port-shaped
    │   │   ├── plugin/             # exists today; port-shaped
    │   │   ├── service/            # exists today; port-shaped
    │   │   ├── contracts/          # exists today; port-shaped
    │   │   └── diagnostics/        # ProbePort impl (reporter adapters)
    │   ├── presentation/           # ≤ 4 children
    │   │   ├── abstracts/          # CliCommand, CliCommandGroup, CliRoot, …
    │   │   ├── output/             # OutputEvent types + renderers (the only other console.* home)
    │   │   └── cli/                # the Cliffy program surface (commands/, options/, mappers/, validators/, factories/)
    │   ├── assets/                 # .template files only (no .ts; F-CLI-22)
    │   │   ├── manifest.ts         # typed registry of all template paths
    │   │   ├── template-registry.ts
    │   │   └── <group>/            # contracts, plugins, services, aspire, db, …
    │   ├── codegen/                # NEW: aspirational home for code generators
    │   │   └── aspire/             # ← relocated from kernel/templates/aspire/helpers/
    │   │       ├── generators/     # generate-register-{tools,services,…}.ts
    │   │       └── tests/          # generators-*-test.ts
    │   └── extension-points.ts     # R-COMP-EXT-MANIFEST: aggregates every Registry
    ├── public/                     # VERTICAL — feature folders (≤ 6 children)
    │   ├── composition.ts          # R-COMP-DECL: class PublicCli extends CliRoot { topLevel() {…} } + createPublicCli factory
    │   ├── deps.ts                 # jsr:@netscript/* imports only
    │   ├── adapters/               # public-only adapters (JsrImportResolver surface-side)
    │   ├── ports/                  # surface-owned port re-exports
    │   ├── features/               # vertical slicing; one folder per top-level command
    │   │   ├── scaffold/           # group + sub-features
    │   │   │   ├── scaffold-group.ts
    │   │   │   ├── init/<verb>-<noun>-command.ts, <verb>-<noun>.ts, <verb>-<noun>-input.ts, steps/
    │   │   │   ├── add-plugin/, add-service/, add-db/, add-contract/
    │   │   │   └── market/         # (marketplace today; renamed add-plugin? — defer)
    │   │   ├── serve/              # dev/serve; supervisor commands
    │   │   ├── deploy/             # per-target sub-features (windows-service in Phase 1)
    │   │   │   ├── deploy-group.ts
    │   │   │   ├── windows-service/
    │   │   │   │   ├── install-windows-service-command.ts
    │   │   │   │   ├── install-windows-service.ts       # use case
    │   │   │   │   ├── install-windows-service-input.ts
    │   │   │   │   └── steps/
    │   │   │   └── k8s/, container/, cloud/             # Phase 2+ (seam only; no code in Wave 6)
    │   │   ├── doctor/             # diagnostics → user-facing
    │   │   ├── plugins/            # plugin list/copy/info
    │   │   ├── contracts/          # contract add
    │   │   ├── db/                 # db add/migrate
    │   │   └── generate/           # codegen (moved to public when invoked by a user command)
    │   └── support.ts              # shared presentation support (≤ 150 LOC)
    └── maintainer/                 # VERTICAL — same shape; monorepo deps
        ├── composition.ts          # R-COMP-DECL
        ├── deps.ts                 # monorepo-relative imports
        ├── adapters/               # maintainer-only adapters
        ├── features/
        │   ├── sync-packages/, sync-templates/, sync-plugins/
        │   ├── probe/
        │   ├── test-scaffold/
        │   ├── codegen/            # ← merged from kernel/templates/aspire/helpers/
        │   ├── local-contributor/  # ← promoted from src/local/features/plugins/
        │   └── root/               # root sub-command composition helpers
        └── support.ts
```

Cardinality audit (every directory ≤ 12 children, depth ≤ 4 from `src/`):

- `src/` → 3 children (`kernel/`, `public/`, `maintainer/`).
- `src/kernel/` → 9 children (`domain/`, `ports/`, `application/`, `adapters/`, `presentation/`, `assets/`, `codegen/`, `extension-points.ts`, plus a single `README.md`).
- `src/kernel/domain/` → 6 children. `src/kernel/ports/` → 9 children. `src/kernel/application/` → 2 children. `src/kernel/adapters/` → 12 children. `src/kernel/presentation/` → 3 children. `src/kernel/assets/` → 1 group + 2 entry `.ts` files.
- `src/public/` → 6 children. `src/public/features/` → 8 children. Each `features/<feature>/` → 1 group file + 2–5 sub-feature folders.
- `src/maintainer/` → 6 children.
- `src/kernel/codegen/aspire/{generators,tests}/` → 2 children each.
- Depth: every leaf ≤ 4 from `src/` (e.g. `src/public/features/deploy/windows-service/steps/install-step.ts` is depth 5 from `src/`); see §F for the precise depth-5 case and the proposed "shell+step" merger.

> **A6 v2 deviation (intentional, recorded):** `src/kernel/codegen/` is a new
> role-folder name not present in the A6 v2 greenfield sketch. It is
> introduced because today's `kernel/templates/aspire/helpers/` is the
> *codegen layer* (TypeScript files that emit TypeScript at runtime), not
> the *template layer* (string-`.template` files that get copied). Mixing
> them in `templates/` is what produced the depth-6 violation. Codegen
> does not belong in `assets/`, so the new role is justified. It is
> tagged as a deviation here and should be added to A6 v2's greenfield
> shape in a follow-up doctrine patch.

### A.5  A6 gate matrix for the target tree

Every universal F-* gate and every A6-specific F-CLI-1..31 gate, mapped to
the proposed shape, with the implementation tool noted. (`PENDING_SCRIPT`
means the gate exists, the harness tool to check it is on the road map,
and the **manual evidence** for the current run is given.)

| Gate       | Asserts (summary)                                                                                                  | Tool / script                            | Manual evidence for `82c1185`                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------------------------------------------- |
| F-1        | `deno task check` green per slice                                                                                  | `deno task check:packages`               | passes per Wave-5 verdict                      |
| F-3        | public symbol-doc lint                                                                                             | `deno doc --lint mod.ts`                 | passes per Wave-5 verdict                      |
| F-5        | CLI-aware re-export upstream                                                                                       | `deno lint` + custom rule                | passes per Wave-5 verdict                      |
| F-6        | forbidden name scan (`utils/`, `helpers/`, `common/`, `interfaces/`)                                               | F-CLI-12 (file scan)                     | **violations catalogued in §B.3**              |
| F-7        | one-class-per-file                                                                                                 | `deno lint` + custom rule                | passes per Wave-5 verdict                      |
| F-8        | deno doc html coverage 100%                                                                                        | `deno doc --html`                        | passes per Wave-5 verdict                      |
| F-9        | `--allow-slow-types=false` clean                                                                                   | `deno publish --dry-run`                 | **PENDING_SCRIPT; see §F risk R-3**            |
| F-10       | `deno publish --dry-run` exit 0 (modulo declared deps)                                                             | `deno publish --dry-run`                 | passes per Wave-5 verdict                      |
| F-11       | public surface narrowness                                                                                          | export-graph scan                        | passes per Wave-5 verdict                      |
| F-12       | no barrel-`mod.ts` inside `src/**` (subpath exports + `kernel/extension-points.ts` are the only exceptions)         | file scan                                | passes per Wave-5 verdict                      |
| F-15       | re-export upstream (no local reinvention of std/datetime, etc.)                                                    | `deno lint` + custom rule                | passes per Wave-5 verdict                      |
| F-16       | folder cardinality ≤ 12                                                                                            | F-CLI-25 (file scan)                     | **PASS today; one near-cap (adapters = 12)**   |
| F-17       | abstract-derived co-location (R-FOLD-AD-COLOC)                                                                     | F-CLI-30 (AST + path)                    | **violation: `domain/` is flat, not plural**  |
| F-18       | no sub-barrels                                                                                                     | F-CLI-20 (file scan)                     | passes per Wave-5 verdict                      |
| F-CLI-1    | per-layer file size (presentation ≤ 150, use cases ≤ 250, adapters ≤ 350, abstracts ≤ 200)                          | LOC scan + path classifier               | **PASS** (largest = 384 is an adapter; see §F) |
| F-CLI-2    | hard cap 500 LOC any `.ts` outside `kernel/assets/`                                                                | LOC scan                                 | **PASS** (no file > 500 LOC)                   |
| F-CLI-3    | `src/public/**` ∩ `src/maintainer/**` = ∅ (import graph)                                                           | import graph                             | passes per Wave-5 verdict                      |
| F-CLI-4    | `src/kernel/**` does not import from `src/public/**` or `src/maintainer/**`                                        | import graph                             | passes per Wave-5 verdict                      |
| F-CLI-5    | no `Deno.*` in `**/presentation/**` or `**/features/**`                                                            | regex + AST                              | **violation: `public/features/deploy/build/*`**|
| F-CLI-6    | exactly one `createXCli` factory per binary; binary files ≤ 60 LOC                                                | AST + LOC                                | **PASS**                                       |
| F-CLI-7    | no `I[A-Z]*` exports                                                                                               | AST                                      | passes per Wave-5 verdict                      |
| F-CLI-8    | `deno doc --html` 100%                                                                                             | external                                 | passes per Wave-5 verdict                      |
| F-CLI-9    | `--allow-slow-types=false` clean                                                                                   | external                                 | **PENDING_SCRIPT; see §F risk R-3**            |
| F-CLI-10   | `deno publish --dry-run` exit 0                                                                                    | external                                 | passes per Wave-5 verdict                      |
| F-CLI-11   | no monorepo terms under `src/public/**` or `src/kernel/**` (`monorepoRoot`, `--source local`, `LOCAL_PACKAGES`)    | regex                                    | **PENDING_SCRIPT**                             |
| F-CLI-12   | no `interfaces/` directory anywhere under `src/`                                                                  | file scan                                | passes per Wave-5 verdict                      |
| F-CLI-13   | no `_shared.ts` under `**/presentation/**` or `**/features/**`                                                    | file scan                                | passes per Wave-5 verdict                      |
| F-CLI-14   | `@cliffy/*` only under `**/presentation/**`, `bin/**`, `**/composition.ts`                                        | regex                                    | passes per Wave-5 verdict                      |
| F-CLI-15   | `Deno.exit` only in `bin/**`                                                                                       | regex                                    | passes per Wave-5 verdict                      |
| F-CLI-16   | `Deno.{cwd,env,build,readDir,readFile,writeFile,Command,openKv}` only in `kernel/adapters/**`, `<surface>/adapters/**`, `bin/**` | regex                          | **PASS** (concentrated in `kernel/adapters/`) |
| F-CLI-17   | exactly one class extending `CliCommand` per `**/*-command.ts`                                                    | AST                                      | passes per Wave-5 verdict                      |
| F-CLI-18   | exactly one class extending `UseCase|Pipeline|Registry` per `**/application/**` non-abstract file                 | AST                                      | passes per Wave-5 verdict                      |
| F-CLI-19   | `new …(Adapter\|Resolver\|Runner\|Scaffolder\|Renderer\|Logger\|Pipeline\|Step\|Registry)\(` only in composition/deps/bin/abstract-self/test | regex + path                  | passes per Wave-5 verdict                      |
| F-CLI-20   | barrels only at package root, `testing.ts`, declared subpath exports, `kernel/extension-points.ts`                 | file scan                                | passes per Wave-5 verdict                      |
| F-CLI-21   | per-layer file naming regex                                                                                        | path scan                                | **PENDING_SCRIPT**                             |
| F-CLI-22   | `.template` files only under `kernel/assets/**`                                                                    | file scan                                | **violation: `kernel/templates/aspire/…`**     |
| F-CLI-23   | no backtick literal ≥ 20 lines outside `kernel/assets/**`                                                          | regex/AST                                | passes per Wave-5 verdict                      |
| F-CLI-24   | `TemplateRegistry` keys ≡ files under `kernel/assets/**`                                                           | runtime check                            | passes per Wave-5 verdict                      |
| F-CLI-25   | ≤ 12 immediate children per dir (also `src/<surface>/features/<feature>/`)                                        | file scan                                | **PASS**                                       |
| F-CLI-26   | `console.{log,error,warn}` only under `kernel/presentation/output/**` and `kernel/adapters/logger/**`              | regex                                    | **PASS** (zero leaks found)                    |
| F-CLI-27   | `**/composition.ts` body is declarative (R-COMP-DECL)                                                              | AST                                      | **PASS** for `public/composition/create-public-cli.ts` (60 LOC, zero `.command()`); **violation** is in `public/features/root/public-command-tree.ts` (hand-wired Cliffy chain) — see §B.3 + §C.3 |
| F-CLI-28   | concretes receive deps via constructor; `application/**` & `presentation/**` never import from `adapters/**` (type-only allowed) | AST                              | passes per Wave-5 verdict                      |
| F-CLI-29   | F-CLI-25 inside `src/<surface>/features/<feature>/`                                                               | file scan                                | **PASS**                                       |
| F-CLI-30   | F-17 inside `src/kernel/**` (abstract + concretes plural-folder co-location)                                      | AST + path                               | **violation: `domain/` is a flat 11-child list** |
| F-CLI-31   | `kernel/extension-points.ts` exports every Registry subclass                                                       | AST                                      | **PENDING_SCRIPT**                             |

### A.6  Recommendation (A)

**Adopt the target tree in §A.4 and the gate matrix in §A.5 as the Wave-6
Restructure target.** This is the **AP-1 answer**: the existing
`Restructure` verdict in `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`
should be **closed** on a new entry — the old one refers to a 38,436-LOC
package with `pipeline.ts` (1,869 LOC) and `official-plugin-copier.ts` (1,203
LOC), neither of which exists on track `82c1185` (largest file is 447 LOC;
no file > 500). The current package is structurally close to A6 v2 but has
six concrete gaps: (i) the public/horizontal `domain/` flat layout, (ii)
the misplaced `templates/aspire/helpers/` codegen, (iii) the surface
import of `kernel/adapters/windows/`, (iv) the public `composition.ts`
that hand-wires `.command(...)` chains, (v) the un-promoted `e2e/`
workspace member, (vi) the orphaned `local/` surface. The implementation
slice plan in §"Slice plan" addresses these in dependency order.


## B. Standards

> **This is the answer to research-brief feedback #2.** The deliverable is a
> proposed `packages/cli/docs/standards.md` outline (NOT written yet — the
> impl phase fills it). The outline is the contract; the violation catalog
> is the proof that the contract closes real leaks.

### B.1  Proposed outline of `packages/cli/docs/standards.md`

The doc has **eight normative sections**. Each section names the rule, the
fitness function that enforces it, and the test that proves the rule.

#### §1  Command contract

Every user-facing command has exactly five files (the **verb-noun unit**):

```
public/features/<feature>/<verb>-<noun>/
├── <verb>-<noun>-command.ts   # extends CliCommand<…>  (F-CLI-17: 1:1)
├── <verb>-<noun>.ts           # the use case class (implements UseCase)
├── <verb>-<noun>-input.ts     # the input shape (the *-plan in old terminology)
├── <verb>-<noun>-output.ts    # the output renderer (or zero — see §3)
└── steps/                     # optional PipelineStep<TIn,TOut> modules
    ├── step-1-foo.ts
    └── step-2-bar.ts
```

Rules:

- `<verb>-<noun>` matches the **command name** used by users (lowercase, hyphenated).
- The `*-command.ts` class owns *only* Cliffy wiring (description, `.args(...)`, `.option(...)`, `.action(...)`).
- The `*.ts` (no suffix) file holds the **use case** — a class implementing
  `UseCase<Input, Output, Context>`. Zero Cliffy imports.
- The `*-input.ts` file exports a **typed input** (`type`, optional `parse*` helpers, optional `validate`).
- The `*-output.ts` file is *optional*; renderers live in `kernel/presentation/output/renderers/`.
- The command is the *only* file in the package that imports `@cliffy/command`
  (F-CLI-14). All other files talk to `kernel/ports/` and `kernel/adapters/`.
- `*_test.ts` files exist **only next to** the file under test; the only
  exception is `tests/integration/<feature>.test.ts` for cross-feature
  E2E.

Enforced by: F-CLI-13, F-CLI-14, F-CLI-17, F-CLI-21.

#### §2  Typed error model

A single sealed `CliError` hierarchy in `kernel/domain/errors/`; **no command throws a bare `Error`**.

```
CliError                         (abstract, sealed taxonomy)
├── CliUsageError                (bad CLI usage; exits 64 / 2 — EX_USAGE)
├── CliInputValidationError      (user input didn't parse/validate; exits 65)
├── CliNotFoundError             (entity missing; exits 66)
├── CliConflictError             (state collision; exits 73 / 1)
├── CliEnvironmentError          (Deno APIs / file system / ports failed; exits 74)
│   ├── CliFileSystemError
│   ├── CliNetworkError
│   └── CliPortUnavailableError
├── CliDeploymentError           (deploy-target specific; exits 75)
│   ├── CliDeployManifestError
│   ├── CliDeployTargetError     (re-thrown by the target-port impl)
│   └── CliDeployPreconditionError
└── CliInternalError             (programmer fault; exits 70)
    └── CliUnreachableError
```

Rules:

- **All** user-visible errors come from this tree. `try { … } catch (e) { throw e instanceof CliError ? e : new CliInternalError(cause: e); }` at the use-case boundary.
- Every `CliError` carries a **`cliErrorCode`** (`'E_USAGE' | 'E_NOT_FOUND' | …`) for machine-readable output, a **userMessage** (no stack, no paths unless required), and an optional **`hint`** (one actionable sentence).
- `Deno.exit(...)` is **forbidden outside `bin/**`** (F-CLI-15). The use case throws; the binary catches and exits.
- The `<feature>/root/<feature>-group.ts` file is the only place that maps a `CliError` to an exit code (1:1 with the categories above).

Enforced by: F-CLI-15, custom regex `throw new Error\(` (forbidden), AST check for `new CliError\(` in `bin/**` only.

#### §3  IO / output discipline

The CLI is structured-output-first.

- **No** `console.{log,error,warn,info,debug}` outside
  `kernel/presentation/output/**` and `kernel/adapters/logger/**` (F-CLI-26).
- The `OutputEvent` enum in `kernel/presentation/output/default-output.ts` is the **only**
  writer API the rest of the package can call: `outputText`, `outputEvent`,
  `outputHint`, `outputError`. All of these route to a pluggable
  `OutputRenderer` (terminal in bin/, JSON / NDJSON in `e2e/`).
- Use cases **never** call output APIs directly. They return a
  `CommandResult<TData, TEvents>` and the command class renders it.
- For TTY, the default renderer respects `NO_COLOR`, `--json`, `--quiet`.
  The `--json` flag changes the renderer to a single-line JSON emitter
  and is the **stable contract** for CI / scripts.

Enforced by: F-CLI-26, F-CLI-15, custom `console.*` scan.

#### §4  Naming

- **Files** use kebab-case (`install-windows-service.ts`).
- **Classes / interfaces / types** use PascalCase.
- **No `I`-prefix** on interfaces (F-CLI-7). Distinguish types from
  interfaces structurally (`type Input`, `interface InputContract`).
- **No** `*-shared.ts`, `*-common.ts`, `*-utils.ts`, `*-helpers.ts` files
  (F-6). The exception is `support.ts` in a surface root, ≤ 150 LOC.
- **Forbidden** directory names anywhere under `src/`: `utils/`,
  `helpers/`, `common/`, `interfaces/`, `shared/`, `types/`,
  `vendors/`, `vendor/`, `lib/`, `misc/`, `temp/`. (F-CLI-12 + F-6.)
- **Plural** folder names: a folder of base+concretes is the axis name
  plural — `plugin-kinds/`, `db-engines/`, `deploy-targets/`,
  `service-shapes/`, `manifests/`. (R-FOLD-AD-COLOC.)
- **No** `index.ts` inside `src/**`. Re-exports go through `mod.ts` at
  the package root, declared subpath exports, or
  `kernel/extension-points.ts`. (F-12, F-CLI-20.)
- **Tests** are `<file>_test.ts` next to the file under test. Depth of
  test files is the same as the file under test, **not** one level
  deeper (i.e. no `tests/` subfolder per adapter — collocate).
  Exception: `kernel/codegen/aspire/tests/` is the only allowed `tests/`
  subfolder (codegen is a special case; see §A.4).

Enforced by: F-6, F-7, F-12, F-CLI-12, F-CLI-13, F-CLI-20, F-CLI-21,
F-CLI-30, custom regexes for the forbidden directory names.

#### §5  Public surface & doc-lint

- `mod.ts` is the **only** public JSR entry. Subpath exports declared in
  `deno.json` map to `public/ports/<port>.ts`, `public/features/<f>/index.ts`.
  No barrel re-exports inside `src/**`. (F-11, F-CLI-20.)
- Every exported symbol has a JSDoc that **reads as a manual sentence**:
  starts with a verb, mentions the kind, mentions the contract.
  `deno doc --lint mod.ts` must pass (F-3). `deno doc --html` must
  produce 100% coverage (F-8, F-CLI-8).
- `R-COMP-EXT-MANIFEST`: the kernel publishes
  `src/kernel/extension-points.ts` which **aggregates every Registry
  subclass** so downstream packages can compose them without
  importing concrete adapters. (F-CLI-31.)
- `R-COMP-DECL`: `**/composition.ts` is a *body of wiring only* —
  `class XCli extends CliRoot { … }` + a `createXCli` factory. **No**
  inline `.command(...)` chains. (F-CLI-27.)

Enforced by: F-3, F-8, F-11, F-CLI-20, F-CLI-27, F-CLI-31.

#### §6  Testing tiers

Three tiers, each with a different runner and gate:

| Tier              | Runner                          | Where it lives                                          | What it covers                                        | Wave-6 gate |
| ----------------- | ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- | ----------- |
| **unit**          | `deno test --allow-read=<scope>` | `<file>_test.ts` next to the file                       | one file, in-memory ports from `testing.ts`           | F-1         |
| **integration**   | `deno test --allow-read=<scope>` | `tests/integration/<feature>.test.ts`                   | one feature, real file system in a temp dir           | F-1         |
| **e2e**           | `deno task e2e:cli`             | `packages/cli-e2e/` (promoted workspace member, §A.2)   | full `netscript init → add → db → aspire` happy path  | F-1, scaffold.runtime suite |

Rules:

- **No mocks** in unit tests. Use the in-memory adapters in `testing.ts`
  (`InMemoryFileSystem`, `InMemoryProcess`, `InMemoryClock`,
  `InMemoryLogger`, `InMemoryPrompt`).
- Each `PipelineStep` has a `*_test.ts` that constructs a
  `PipelineContext` with the in-memory ports and asserts the step's
  `(input → context-update → output)` triple.
- The e2e workspace member exports `defineCliE2eSuite` (already exists
  in `packages/cli/e2e/mod.ts`) and is the **only** public API for
  downstream packages. The e2e workspace is the **public surface** of
  the test layer; it gets the same F-3 / F-8 / F-11 / F-CLI-8 gates as
  the binary.

Enforced by: F-1, F-CLI-21, the absence of `Deno.Mock`/`std/testing/mock`
imports in the test layer (custom lint rule — see §F risk R-6).

#### §7  Layers & import discipline

| Layer            | May import from                                      | May NOT import from                          |
| ---------------- | ---------------------------------------------------- | -------------------------------------------- |
| `kernel/domain`  | (nothing in this package)                             | `adapters/`, `application/`, `presentation/`, `assets/`, `public/**`, `maintainer/**` |
| `kernel/ports`   | `kernel/domain`                                      | `kernel/adapters`, `kernel/application`, `kernel/presentation`, `assets/`, `public/**`, `maintainer/**` |
| `kernel/application` | `kernel/domain`, `kernel/ports`                  | `kernel/adapters`, `kernel/presentation`, `assets/`, `public/**`, `maintainer/**` (F-CLI-4) |
| `kernel/presentation` | `kernel/domain`, `kernel/ports`, `kernel/application` | `kernel/adapters`, `assets/`, `public/**`, `maintainer/**` |
| `kernel/adapters`| `kernel/domain`, `kernel/ports`                      | `kernel/application`, `kernel/presentation`, `assets/`, `public/**`, `maintainer/**` (except `bin/**`) |
| `kernel/assets`  | (only literals and template paths)                    | anything else (assets are inert) |
| `public/**`      | `kernel/**` (and `jsr:@netscript/*`)                  | `maintainer/**` (F-CLI-3), `local/**`        |
| `maintainer/**`  | `kernel/**`, monorepo-relative paths                 | `public/**` (F-CLI-3), `local/**`            |
| `bin/**`         | anything                                              | nothing                                      |

Concrete enforcement:

- F-CLI-5 / F-CLI-16: `Deno.*` import set is **whitelisted** to
  `kernel/adapters/**`, `<surface>/adapters/**`, `bin/**`.
- F-CLI-19: `new …(Adapter|Resolver|Runner|Scaffolder|Renderer|Logger|Pipeline|Step|Registry)(`
  appears only in `composition.ts`, `deps.ts`, `bin/**`,
  abstract-self constructors, and tests.
- F-CLI-28: every concrete in `application/**` and `presentation/**`
  receives its deps via the constructor; **no** `import` from
  `adapters/**` inside `application/**` or `presentation/**` (type-only
  is allowed but discouraged).

Enforced by: F-CLI-3, F-CLI-4, F-CLI-5, F-CLI-16, F-CLI-19, F-CLI-28.

#### §8  Asset & template discipline

- `.template` files (and `.json` / `.yaml` / `.ts` files meant to be
  copied, not imported) live under `kernel/assets/<group>/` only
  (F-CLI-22). `kernel/templates/`, `assets/generated/`, and
  `assets/<group>/helpers/` are all **prohibited** paths.
- `TemplateRegistry` is a typed map from `key → template path`. Adding
  a new template = adding to the registry *and* placing the file under
  `assets/`. The keys list and the file list are kept in sync at
  publish time (F-CLI-24).
- No backtick literal ≥ 20 lines outside `kernel/assets/**` (F-CLI-23):
  long strings belong in `.template` files.
- Codegen modules (TypeScript that emits TypeScript at runtime) live
  in `kernel/codegen/<group>/generators/`. Tests for them live in
  `kernel/codegen/<group>/tests/`. The `helpers/` pattern is a code
  smell that this section explicitly forbids (F-6, F-CLI-12).

Enforced by: F-6, F-CLI-22, F-CLI-23, F-CLI-24.

### B.2  Mapping to fitness gates

Every clause above cites at least one fitness gate from
`.llm/harness/gates/`. The §-n ↔ gate matrix is the compliance table.
`docs/standards.md` reproduces the matrix in a one-page table so a
reviewer can check each clause against a runnable command.

### B.3  Current-code violations catalog

| ID  | Location                                                                                            | Gate(s)        | Severity | Resolution                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------- | -------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| V-1 | `src/public/features/root/public-command-tree.ts` — hand-wired `.command(...)` chain, 130+ LOC      | F-CLI-27, F-14, F-CLI-13 | **High** | Move to `src/kernel/presentation/cli/public-command-program.ts`; expose `createPublicProgram(host)` as a single declarative function with the `Command()` chain *fully inside* it. |
| V-2 | `src/public/features/deploy/build/build-*.ts` — imports `kernel/adapters/windows/*` directly          | F-CLI-3, F-CLI-4 (cross-target leak) | **High** | Replace with a `DeployTargetPort` import from `kernel/ports/deploy/target-port.ts`; see §D.                           |
| V-3 | `src/kernel/domain/` — 11-child flat list (8 files + 3 subdirs), no R-FOLD-AD-COLOC plural grouping   | F-CLI-30, R-FOLD-AD-COLOC | **Med**  | Restructure per §A.4: one `plural-axis/` folder per polymorphic family.                                               |
| V-4 | `src/kernel/adapters/{deploy,windows}/` — concrete deploy targets live in `kernel/adapters/`         | A6 v2 role-folder rules | **High** | Move target concretes to `src/kernel/ports/deploy/targets/<target>/` (port-shaped) and let composition wire them.    |
| V-5 | `src/kernel/templates/aspire/helpers/{register,tests}/` — depth 6 from `src/`, contains `.ts` codegen modules mixed with templates | R-FOLD-CARD, F-CLI-22 | **High** | Relocate to `src/kernel/codegen/aspire/{generators,tests}/`; keep string-`.template` files in `kernel/assets/aspire/`. |
| V-6 | `src/kernel/assets/aspire/helpers/` and `src/kernel/assets/generated/aspire/helpers/` — `helpers/` folder | F-6, F-CLI-12 | **Med**  | Rename to `kernel/assets/aspire/codegen-tpl/` (or move to `kernel/codegen/aspire/templates/`).                          |
| V-7 | `src/kernel/adapters/scaffold/tests/` — depth 5 test files (5 levels from `src/`)                    | R-FOLD-CARD | **Low** | Collocate: rename `*_test.ts` next to the file (e.g. `deno-file-system_test.ts` next to `deno-file-system.ts`).         |
| V-8 | `src/kernel/adapters/windows/compile/compile_test.ts`, `manifest/manifest-resolver_test.ts` — depth 5 | R-FOLD-CARD | **Low**  | Collocate.                                                                                                              |
| V-9 | `src/local/` — third surface with a single feature (`plugins/add`)                                   | F-CLI-25, A6 v2 "two-surface" rule | **Med**  | Promote to `src/maintainer/features/local-contributor/`.                                                                |
| V-10 | `src/maintainer/...` has no `composition.ts` (R-COMP-DECL: composition is `maintainer/composition/...` — verify) | F-CLI-27 | **Med**  | Verify the maintainer composition file is the *only* non-`features` `maintainer/**` file that wires up; trim anything else. |
| V-11 | `src/public/features/deploy/build/*` shells out via `new Deno.Command` (servy-cli)                 | F-CLI-5, F-CLI-16 | **High** | Move `new Deno.Command` into `kernel/ports/deploy/targets/windows-service/servy-process-port.ts` (port-shaped).         |
| V-12 | `src/kernel/adapters/loggers/` is the name of a sub-tree but the gate matrix says only **one** concrete LoggerPort impl | F-CLI-21 | **Low**  | Rename to `src/kernel/adapters/logger/` (singular; this is a port, not a polymorphic axis).                              |
| V-13 | `src/maintainer/features/...` (no `codegen/` subfeature today) — the current home of `kernel/application/scaffold/writers/*` violates the F-3 + R-COMP-EXT-MANIFEST separation | F-3, R-COMP-EXT-MANIFEST | **Med**  | Move scaffold/writers to `src/maintainer/features/codegen/scaffold/steps/`.                                              |
| V-14 | `packages/cli/e2e/` — workspace member lives inside the package, not at the workspace root          | A6 v2 greenfield shape | **Med**  | Promote to `packages/cli-e2e/` (top-level workspace member). (See §F.5.)                                                |

### B.4  Recommendation (B)

**Land `packages/cli/docs/standards.md` (Wave 6 impl phase, §1 of the
slice plan) reproducing the eight normative sections above, with the
violation catalog (V-1 … V-14) as an inline "Migrating" appendix.** The
doc is the spec; the gates are the test. The catalog is the migration
checklist. No new code, no new tests in this research phase — the
standards doc and the catalog together close feedback #2.


## C. Future-impl readiness & extensibility

### C.1  What is already a stable seam (today)

The `82c1185` CLI has **five registry-backed extension points**, each
re-exported from `src/kernel/extension-points.ts`:

| Extension axis        | Today                                                                | Future (Wave 7+ / impl-phase)                                |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Plugin kinds**      | `PluginKindRegistry` (api / worker / saga / trigger)                 | Add `cron`, `webhook` by adding a file under `domain/plugin-kinds/` and one `register(...)` call. |
| **DB engines**        | `DbEngineRegistry` (postgres / mysql / sqlite / sqlserver)            | Add `cockroachdb`, `mongodb` by the same pattern.            |
| **Templates**         | `TemplateRegistry` (asset-key → file path)                            | Add a new template + one entry in the registry.               |
| **Output renderers**  | `OutputRendererRegistry` (terminal today; JSON coming)               | Add a `JsonRenderer` (already specced), `NdjsonRenderer` (e2e). |
| **Deploy targets**    | `DeployTargetRegistry` (Windows-service only)                         | Add k8s, container, cloud — see §D.                           |

The kernel publishes the extension-points manifest, the surface composes
it. The seam is **architecturally closed** for plugin-kinds, db-engines,
and templates; it is **architecturally open but concretely empty** for
deploy-targets.

The `Registry<…>` abstract (`kernel/application/abstracts/registry.ts`)
gives every extension axis a uniform API: `register`, `get`, `entries`,
plus a stable `id` for the manifest. New axes are *registration cost
only*, not a new layer.

### C.2  Stable seams the impl phase must add

| Seam                                    | Where                                                  | Wave 6 impl deliverable                                   |
| --------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| **Command registry** (per-surface)      | `kernel/application/registries/command-registry.ts` (NEW) | One class `CliCommandRegistry<THost>` with `register(id, factory)`; `createPublicCli` iterates it instead of `createPublicCommandTree`'s hard-coded `.command(...)` chain. |
| **Adapter registration** (DI)           | `public/composition/deps.ts` (REWRITE)                 | A single `createPublicCommandDependencies(host)` returns a typed `Dependencies` object (Logger, Fs, Prompt, Jsr, …); every command class receives it via constructor (F-CLI-28). |
| **Deploy target port**                  | `kernel/ports/deploy/target-port.ts` (NEW)              | The `DeployTargetPort` interface + `DeployTargetRegistry` (already a registry; becomes a port-backed *runtime* registry, not just a metadata registry). See §D. |
| **Presets** (Wave 7+ scope)             | `kernel/application/registries/preset-registry.ts` (NEW) | A `Preset` is a named bundle: `[plugin-kinds, db-engine, services, deploy-targets]`. Today plugins are added one-at-a-time; presets compose them. |
| **Probe / diagnostics port**           | `kernel/ports/diagnostics/probe-port.ts` (NEW)          | The `ProbePort` is the entry point for `netscript doctor`. It receives the `Dependencies` and returns a `readonly Probe[]`. Each `Probe` is `(name, severity, message, remediation?)`. |

### C.3  The CLI-level `command-registry` seam (this closes F-CLI-27 today)

Today the public CLI's command tree is hand-wired in
`public/features/root/public-command-tree.ts` — a 130+ LOC `new Command().name(...).command(...).command(...)` chain
(V-1). The future-impl-ready shape:

```ts
// src/kernel/application/registries/command-registry.ts  (NEW)
export interface CliCommandFactory<TContext> {
  readonly id: string;                 // 'scaffold.init', 'deploy.install', …
  readonly description: string;
  build(ctx: TContext): Command;       // Cliffy Command
}

export class CliCommandRegistry<TContext> extends Registry<string, CliCommandFactory<TContext>> {
  override readonly id = 'cli-commands';

  /** Compose a Cliffy program from every registered factory. */
  program(name: string, ctx: TContext): Command {
    const root = new Command().name(name);
    for (const factory of [...this.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      root.command(factory[1].id, factory[1].build(ctx));
    }
    return root;
  }
}

// src/public/composition/create-public-cli.ts  (REWRITE to ~25 LOC)
export class PublicCli extends CliRoot<PublicCliCommand> {
  readonly id = 'public.cli';
  constructor(
    private readonly host: PublicCliHost,
    private readonly registry: CliCommandRegistry<PublicCliContext>,
  ) { super(); }
  define(): PublicCliCommand {
    const ctx = createPublicCommandDependencies(this.host);
    return this.registry.program('netscript', ctx);
  }
}
```

The `command-registry.ts` file **does not exist today** and is the
single biggest future-readiness gap. The composition is currently
correct (`createPublicCli` is declarative); it's the *tree itself*
that's hand-wired. This is the *only* place where F-CLI-27 is
violated today (V-1).

### C.4  Adapter registration (the DI shape)

`src/public/composition/public-command-dependencies.ts` already
constructs the dependencies (Fs, Prompt, Jsr, …). The next step is to
**promote it to the public surface** (so downstream packages and the
maintainer can compose the same dependencies) and add it to
`extension-points.ts` so the maintainer surface can construct identical
dependencies for its commands.

The protected shape:

```ts
// src/public/composition/deps.ts  (REWRITE — was public-command-dependencies.ts)
export interface PublicCliContext {
  readonly fs: FileSystemPort;
  readonly process: ProcessPort;
  readonly clock: ClockPort;
  readonly logger: LoggerPort;
  readonly prompt: PromptPort;
  readonly jsr: JsrResolverPort;
  readonly deployTargets: DeployTargetPort;
  readonly render: OutputRenderer;
}
```

The factory function `createPublicContext(host: PublicCliHost): PublicCliContext`
is the *only* place that does `new …Adapter(…)`. The factory lives in
`public/composition/deps.ts` and is added to `extension-points.ts` so
`maintainer/composition/deps.ts` can call it.

### C.5  Protect-don't-implement list (the things the impl phase MUST NOT add)

These are **decisions the maintainer must not pre-bake**. The research
phase's job is to identify the seam and *freeze* the shape; the impl
phase's job is to keep the seam open. The list:

1. **Do not** hardcode a second deploy target inside the `windows-service`
   folder. Adding `k8s` is a *new folder* under
   `kernel/ports/deploy/targets/`, not a flag on the Windows target.
2. **Do not** add a `--target` switch on the `deploy` group that selects
   via a `switch` on `DeployTargetKey`. Use the registry:
   `deployTargets.get(key).install(input)` — the registry *is* the dispatch.
3. **Do not** introduce a `Feature` registry (a meta-registry of every
   feature in the package). The five registries are sufficient; a
   "feature" is a *folder*, not a runtime concept.
4. **Do not** introduce a `Plugin` runtime interface for the CLI itself
   (the CLI does not host user plugins — it scaffolds them). The
   `PluginKindRegistry` is the right abstraction.
5. **Do not** add a `Deno.Command` call inside the `public/` or
   `kernel/presentation/` layers. Every shell-out goes through a
   `ProcessPort` in `kernel/ports/`.
6. **Do not** add a new `kernel/templates/<group>/` folder. New
   templates go under `kernel/assets/<group>/`; new codegen goes under
   `kernel/codegen/<group>/`.
7. **Do not** introduce a `manager` / `controller` / `service` /
   `handler` naming convention in the package. The use case file is
   `<verb>-<noun>.ts`; nothing else.
8. **Do not** publish the e2e workspace as `@netscript/cli-e2e@1.x` until
   `scaffold.runtime` is green twice in a row. The current
   `@netscript/cli-e2e@0.0.1-alpha.0` is correct (Wave 2/4 verdict).
9. **Do not** add a `--source local` flag, a `monorepoRoot` config
   key, or any other monorepo-only term under `src/public/**` or
   `src/kernel/**` (F-CLI-11). Monorepo plumbing lives in
   `src/maintainer/**` and the `WorkspaceResolverPort`.
10. **Do not** add a single `lib.rs`-style mega-entry-point
    `src/maintainer/index.ts` or `src/public/index.ts`. Subpath
    exports only.

### C.6  Recommendation (C)

The future-impl readiness is **mostly there** for the static seams
(registries, ports, error model, output discipline). The two real
gaps are the missing `CommandRegistry` (closes F-CLI-27 V-1) and the
**portification of `DeployTargetRegistry`** into a real
`DeployTargetPort` (closes V-2, V-4, V-11). The protect-don't-implement
list (C.5) is the contract that the impl phase must respect when it
fills the seams.


## D. Aspire 13.4 deployment seams (design only)

> **No implementation in Wave 6.** This section is the design that Wave 6
> impl phase must implement *as a port surface only* (the adapters
> themselves are out of scope for Wave 6 and live in Wave 7+).

### D.1  Today's deploy surface (the hand-patched Windows path)

The CLI's deploy surface today is **asymmetric**: Aspire is the *local
orchestrator* (dev loop), but the *deploy* path is hand-patched to
**Windows-service via servy-cli.exe**. The two halves of the deploy
loop meet in `kernel/adapters/database/aspire-command-executor.ts`
(two `new Deno.Command('aspire', …)` calls — `aspire run` and
`aspire logs`).

The concrete coupling (verified by `grep -rn "new Deno.Command" packages/cli/src`):

| Layer                 | `Deno.Command` callsite                                    | What it shells to             |
| --------------------- | ---------------------------------------------------------- | ----------------------------- |
| `kernel/adapters/database/aspire-command-executor.ts` (x2) | `aspire run`, `aspire logs` | Aspire CLI (dev orchestration) |
| `kernel/adapters/windows/compile/compile-bundler.ts` (x1) | `deno bundle` (Windows)        | Deno bundler (compile pipeline) |
| `kernel/adapters/windows/compile/compile-runner.ts` (x1)   | `deno compile` (Windows)       | Deno compile (single-file exe) |
| `kernel/adapters/deploy/commands/servy-command.ts` (x1)    | `servy-cli.exe …`             | Servy (Windows service wrapper) |
| `kernel/adapters/scaffold/fresh-adapter.ts` (x1)            | `deno cache` (scaffold)        | Deno (cache lockfile for `init`) |
| `kernel/adapters/config/infrastructure-docker.ts` (x2)     | `docker inspect`, `docker ps`  | Docker (container inspection) |
| `kernel/adapters/runtime/platform/deno-platform.ts` (x3)    | `net session`, `id`, `which`  | OS probes (admin / locate)   |
| `kernel/adapters/runtime/process/deno-process.ts` (x1)     | (generic wrapper)             | Deno (process port impl)     |
| `kernel/adapters/deploy/runtime-detect.ts` (x1)            | `which dotnet` etc.           | OS / toolchain probes        |
| `public/features/deploy/build/build-windows-cli.ts` (x2)   | `deno bundle`, `deno compile` | Deno (Windows CLI build)     |
| `public/features/deploy/build/build-windows-prebuild.ts` (x1) | `deno compile`              | Deno (Windows prebuild)      |
| `public/features/deploy/upgrade/upgrade-deploy-command.ts` (x3) | `deno compile`, `deno install` | Deno (upgrade pipeline)    |
| `public/features/deploy/package-cli/package-cli-deploy-command.ts` (x2) | `deno bundle`, `deno compile` | Deno (package CLI) |

`public/features/deploy/build/*` are F-CLI-3 violations (V-2): the
public surface reaches into `kernel/adapters/windows/*` directly, and
each file shells out via `new Deno.Command` instead of going through a
`ProcessPort` (F-CLI-5 / F-CLI-16 — V-11). The **deploy port is
absent**.

### D.2  Aspire 13.4 deploy surface (research, ground truth)

Per `.llm/tmp/run/master--public-release-program/notes/ASPIRE-13.4-13.5.md`
plus the public Aspire 13.4 release notes (`devblogs.microsoft.com/aspire/whats-new-aspire-13-4/`):

| Aspire 13.4 surface                                | What it does                                                                  | CLI impact                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `aspire publish` (GA in 13.4)                      | Emits deployment artifacts for a chosen publisher. Built-in publishers: `docker-compose`, `kubernetes`/`k8s`, `docker`, `azure-container-apps` (preview). Output goes to a directory; the **publisher** is selected via `--publisher <name>` (or the apphost's `publish(...)` callback). | Wave 6 impl: add a `DeployTargetPort` with `prepare(input)` → `(dir) => { shell('aspire', ['publish', '--output', dir, '--publisher', <name>]) }`. Wave 7+: ship `k8s` and `docker-compose` adapters. |
| `aspire deploy` (preview in 13.4)                  | Orchestrates a deployment to a *named compute environment* (e.g. `prod-aks`). The apphost declares `addComputeEnvironment({ name: 'prod-aks' })` and registers resources into it; `aspire deploy --environment prod-aks` runs the deploy. | Wave 7+: cloud adapters (azure/aws/gcp) wrap `aspire deploy --environment <env> --output-format json` and parse the structured result. |
| `WithProcessCommand()` (13.4 dashboard command)    | Expose a process-resource subcommand as a dashboard action.                   | Wave 6 impl: enables `netscript seed` / `migrate` to appear as buttons on the Aspire dashboard. (DX flex; not on the critical path.) |
| `Aspire.Hosting.Deno` (CommunityToolkit 13.1.0)    | The integration that today lets Aspire 13.2.2 *run* a Deno service from the apphost. 13.4 pin (13.1.0 → 13.4.x) is in scope for S4-now. | Wave 6 impl: bump `CommunityToolkit.Aspire.Hosting.Deno` from 13.1.0 → 13.4.x. The TS apphost GA means the scaffolded `apphost.mts` shape changes; the CLI's `kernel/templates/aspire/generate-aspire-config.ts` and the helpers in `kernel/codegen/aspire/generators/` (post-V-5) must be updated. |
| Native Deno apphost (issue #16218, milestone 13.5) | Replaces the CommunityToolkit generated-artifact path with a native Deno toolchain in the apphost.  | Wave 6 impl: **do nothing** for 13.5 readiness — the design below is *apphost-agnostic*, so the 13.5 flip is a no-op for the deploy port. The CLI's *generated* `.helpers/` layer is the only surface that needs to change at 13.5, and that's a codegen concern, not a deploy-port concern. |

### D.3  The `DeployTargetPort` (the new seam)

> Shape, not implementation. The port is a thin *interface*, and the
> target adapters are *concrete* classes that implement it. The
> `DeployTargetRegistry` (already in `extension-points.ts`) becomes the
> *runtime* registry that maps a `DeployTargetKey` to its `DeployTargetPort` instance.

```ts
// src/kernel/ports/deploy/target-port.ts   (NEW)
export interface DeployTargetPort {
  /** Stable key (matches the registry's DeployTargetKey). */
  readonly key: string;

  /** Human label for `netscript deploy list`. */
  readonly label: string;

  /** Phases the target supports. The deploy CLI greys-out unsupported ones. */
  readonly operations: readonly DeployOperation[];

  /**
   * Phase 1: produce deploy artifacts (binaries, manifests, IaC) into `outputDir`.
   * For Windows-service: emit the compiled `.exe` + `services.json`. Today this is
   * `kernel/adapters/windows/compile/*` + `services.json` generation; under the port
   * the *exact* `deno bundle`/`deno compile` calls become the Windows target's
   * implementation of `prepare`.
   */
  prepare(input: DeployPrepareInput, ctx: DeployContext): Promise<DeployPrepareResult>;

  /**
   * Phase 2: install the artifacts onto the target host. For Windows-service this is
   * `servy-cli.exe install services.json`. For k8s this is `kubectl apply -f`
   * (after `aspire publish --publisher k8s`). For container this is
   * `docker compose -f aspire.yaml up -d` (after `aspire publish --publisher docker-compose`).
   */
  install(input: DeployInstallInput, ctx: DeployContext): Promise<DeployInstallResult>;

  /** Phase 3: stop + remove. Symmetric with install. */
  uninstall(input: DeployUninstallInput, ctx: DeployContext): Promise<DeployUninstallResult>;

  /** Phase 4: read live status (e.g. `servy-cli.exe status`, `kubectl get`, `docker ps`). */
  status(input: DeployStatusInput, ctx: DeployContext): Promise<DeployStatusResult>;
}

export type DeployOperation = 'build' | 'install' | 'uninstall' | 'status';

export interface DeployContext {
  /** All ports the target may use. */
  readonly fs: FileSystemPort;
  readonly process: ProcessPort;
  readonly clock: ClockPort;
  readonly logger: LoggerPort;
  /** Path to the Aspire apphost (if any). */
  readonly apphostPath?: string;
  /** Path to the workspace root (the project being deployed). */
  readonly workspaceRoot: string;
}

export interface DeployTargetRegistryPort extends Registry<string, DeployTargetPort> {
  /** Resolve a target by key, throwing CliNotFoundError if absent. */
  require(key: string): DeployTargetPort;
}
```

### D.4  Target-adapter map (the four named adapters)

Each row is a *future* adapter; the column is the *Aspire 13.4 API* it
wraps. The Windows target's column shows the *current* implementation
it would replace (V-2, V-11), with the Aspire-13.4 surface it should
additionally use for the *deploy* side of the loop (today the Windows
target has no Aspire involvement for install).

| Target                    | Status today        | Aspire 13.4 APIs the adapter wraps (wrap-don't-reinvent)                                                                                                       | Ports used                | Notes                                                                                                                                          |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **windows-service** (Phase 1) | Concrete (`kernel/adapters/windows/compile/*`, `kernel/adapters/deploy/commands/servy-command.ts`) | (none — Windows deploy is *not* an Aspire target today) | `ProcessPort` (for `deno compile` / `servy-cli.exe`) | The port-shaped version keeps today's logic but routes it through `ProcessPort`. *One* adapter, not many. |
| **k8s** (Phase 2)         | (none)              | `aspire publish --publisher kubernetes --output <dir>` → `kubectl apply -f <dir>/`                                                                            | `ProcessPort` (for `aspire publish`, `kubectl apply`) | The k8s adapter is *thin*: shell to Aspire, shell to kubectl. No local re-implementation of k8s manifests.                                     |
| **container** (Phase 2)   | (none)              | `aspire publish --publisher docker-compose --output <dir>` → `docker compose -f <dir>/aspire.yaml up -d` (or `docker` publisher → `docker push` + host pull) | `ProcessPort` (for `aspire publish`, `docker compose`) | Two publisher options; the adapter picks based on the apphost's `publish` callback registration.                                              |
| **cloud** (Phase 3, post-13.4 GA) | (none)      | `aspire deploy --environment <name> --output-format json` (when compute environments are GA in 13.5)                                                          | `ProcessPort`             | Falls back to `kubectl`/`docker compose` for 13.4; flips to `aspire deploy` for 13.5. The adapter's `install` reads the apphost's `addComputeEnvironment({ name })` registration. |
| **azure-container-apps** (Phase 3) | (none)    | `az containerapp up` (or Aspire 13.4's `azure-container-apps` publisher)                                                                                       | `ProcessPort`             | Adapter wraps the publisher; CLI never sees Azure REST directly.                                                                              |

The **windows-service** target is **not deprecated** in Wave 6 — it
remains the only concrete target until Phase 2. The port-shaped move
**does not** change behavior; it only changes the import graph so the
`public/` surface stops reaching into `kernel/adapters/windows/*`.

### D.5  Composition wiring (the only place the targets are registered)

```ts
// src/public/composition/deps.ts  (post-slice 2)
import { WindowsServiceDeployTarget } from 'jsr:@netscript/cli/ports/deploy/targets/windows-service';
import { K8sDeployTarget } from 'jsr:@netscript/cli/ports/deploy/targets/k8s';             // Phase 2

export function createDeployTargetRegistry(): DeployTargetRegistryPort {
  const reg = new DeployTargetRegistry();
  reg.register('windows-service', new WindowsServiceDeployTarget());
  // reg.register('k8s', new K8sDeployTarget());     // Phase 2: one line addition
  // reg.register('container', new ContainerDeployTarget());
  return reg;
}
```

The **registry** is the only place that knows the set of targets. The
deploy commands iterate the registry; they do not `switch` on
`DeployTargetKey` (C.5 rule 2).

### D.6  Aspire 13.4 / 13.5 readiness for the port

| Aspire milestone | Port impact                                                                                                          | CLI work required                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **13.4 (S4-now)** | `aspire publish --publisher {k8s\|docker-compose\|docker}` is **the** new wrap surface.                          | Wave 6 impl: add `DeployTargetPort` (the port interface + types); add the Windows target's *port-shaped* implementation; bump CommunityToolkit Deno 13.1.0 → 13.4.x; update the TS apphost scaffold to match the 13.4 GA shape. |
| **13.4 dashboard commands** | `WithProcessCommand()` is orthogonal to the deploy port; it surfaces the netscript CLI as a dashboard action. | Wave 6 impl: optional — register `netscript seed` and `netscript migrate` as dashboard commands via the `kernel/codegen/aspire/generators/` step that emits the apphost. |
| **13.5 native Deno apphost** (#16218) | The generated `.helpers/` layer in scaffolded projects changes; the *deploy port* in this CLI does not change. | Wave 6 impl: **no port work**; the codegen step in `kernel/codegen/aspire/generators/` will need an update at 13.5 GA. The port's `DeployContext.apphostPath` is the only field that mentions apphost; it's already apphost-agnostic. |
| **13.5 compute environments GA** | `aspire deploy --environment <name>` becomes stable.                                                            | Wave 7+ cloud adapter: switch from the `kubectl`/`docker compose` fallback to `aspire deploy`. The port's `install` API is unchanged. |

### D.7  Recommendation (D)

**Add `DeployTargetPort` + `DeployTargetRegistryPort` in Wave 6 impl
phase (slice 2) as a port-shaped surface only.** The Windows target
becomes one adapter. The k8s, container, and cloud adapters are
*deferred* to Wave 7+ with the *exact Aspire 13.4 APIs each would
wrap* named in §D.4 above. The "wrap-don't-reinvent" discipline is
the architectural rule: every future adapter shells out to Aspire (or
the appropriate cloud CLI) via `ProcessPort`; the CLI never writes a
k8s manifest, a Dockerfile, or a Terraform plan by hand. The
`extension-points.ts` manifest gets the new port in the same slice.


## E. Scaffolding improvements

> **Wave 5 verdict: `scaffold.runtime` 41/41 green.** The scaffold path
> is *good*. This section is about *bounded, concrete, incremental*
> improvements that are clearly on the success path — not a rewrite and
> not a redesign. The research-brief's feedback #5 is explicit: "the
> scaffold path is good — Wave 5 proved `scaffold.runtime` E2E 41/41".
> Every item below is **non-breaking** and **gated by F-1 / `scaffold.runtime`**.

### E.1  Measured state

| File                                          | LOC | Status                                                                  |
| --------------------------------------------- | --: | ----------------------------------------------------------------------- |
| `kernel/application/scaffold/orchestrate-init.ts` | 209 | Use-case orchestrator (the `init` command's use case)                   |
| `kernel/application/scaffold/plan-init.ts`    | 194 | The `*-plan.ts` predecessor — the input shape, currently inline in scaffold |
| `kernel/application/scaffold/render-init.ts`  | 209 | The renderer (text-templating)                                           |
| `kernel/application/scaffold/render-ts-apphost.ts` | 211 | The TS-apphost-specific renderer (Aspire apphost scaffold)             |
| `kernel/application/scaffold/workspace-init.ts` | 105 | Workspace-layout use case                                                |
| `kernel/application/scaffold/validate-init.ts` | 119 | Validation steps                                                        |
| `kernel/application/scaffold/post-scripts-init.ts` | 33 | Post-init scripts                                                       |
| `kernel/application/scaffold/context.ts`      |  30 | The `PipelineContext` for scaffold steps                                |
| `kernel/application/scaffold/helpers.ts`      |  61 | Shared helpers (under F-CLI-12 review — see §B.3 V-6)                    |
| `kernel/application/scaffold/git-init.ts`     |  28 | `git init` step                                                         |
| `kernel/application/scaffold/orchestrate-init_test.ts` | 60 | E2E-ish unit test (60 LOC)                                              |
| `kernel/application/scaffold/writers/{write-app-files,write-example-service-app-files,write-init}.ts` | stub | Shell files emitted as part of the writers/ subtree                     |
| **Total**                                     | 1361 | across 13 files                                                         |

No file exceeds 209 LOC except `render-ts-apphost.ts` (211) — **all
under the 500-LOC cap**, all under 250-LOC per-layer.

### E.2  Bounded improvements (the section's whole deliverable)

Each item is **a single, small, reversible change** with a one-line
acceptance test. No item touches the orchestrator or the
`scaffold.runtime` happy path. Wave 6 impl phase takes the items in
priority order.

| # | Item                                                                                                          | Files touched                                                | Acceptance                                                                                                                                                                                  |
| - | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E.2.1 | **Move the writers shell files into the maintainer surface** (V-13). The current `kernel/application/scaffold/writers/*.ts` are 1-LOC stubs that the orchestrator's barrel-imports; they belong in `maintainer/features/codegen/scaffold/steps/`. | `kernel/application/scaffold/writers/` (move) + `maintainer/features/codegen/scaffold/steps/` (new) | `scaffold.runtime` still 41/41; F-CLI-4 (`kernel/**` ∌ `maintainer/**`) gate stays clean. |
| E.2.2 | **Split `orchestrate-init.ts` (209) into `init-orchestrator.ts` + `init-pipeline.ts`** — the orchestrator currently mixes wiring + step order. The pipeline is the ordered list of `PipelineStep`; the orchestrator builds the context and runs it. | `kernel/application/scaffold/orchestrate-init.ts` → `init-orchestrator.ts` (≤ 120) + `init-pipeline.ts` (≤ 100) | No behavior change; `scaffold.runtime` 41/41. |
| E.2.3 | **Promote `plan-init.ts` (194) to the public surface** as `public/features/init/init-plan.ts`. The plan is a typed input shape (per §B §1 standards), and the kernel use case should accept a `Plan` rather than reconstructing it. | `kernel/application/scaffold/plan-init.ts` → `public/features/init/init-plan.ts` | Plan import is now from the public surface (F-CLI-4 stays clean). `scaffold.runtime` 41/41. |
| E.2.4 | **Introduce `InMemoryScaffolder` in `testing.ts`** (per §B §6). The orchestrator's step tests currently use the real file system via `Deno.makeTempDir`; a `InMemoryScaffolder` is faster, deterministic, and lets the unit-test layer skip the temp-dir dance. | `kernel/application/testing/in-memory-scaffolder.ts` (NEW) | New `_test.ts` for the orchestrator runs in < 100ms (currently 60 LOC + temp-dir teardown). |
| E.2.5 | **Extract `render-ts-apphost.ts` (211) to `kernel/codegen/aspire/render-ts-apphost.ts`** as part of the V-5 codegen relocation. The "render TS apphost" is *codegen*, not *orchestration*; it's the only file in `kernel/application/scaffold/` that is Aspire-specific. | `kernel/application/scaffold/render-ts-apphost.ts` → `kernel/codegen/aspire/render-ts-apphost.ts` | R-FOLD-CARD / F-CLI-22 clean. `scaffold.runtime` 41/41. |
| E.2.6 | **Add `--json` to `netscript init`** (per §B §3 structured output). Today `init` writes a stream of human-readable lines; for CI the only stable contract is "exit 0 / non-zero". A `--json` flag emits one JSON object on stdout with the generated paths, the plugin list, the Aspire resource count, and the next steps. | `public/features/init/init-command.ts` (+ 1 option) + `kernel/application/output/renderers/init-json-renderer.ts` (NEW) | Existing e2e suite unaffected; new e2e test asserts `--json` output shape. |
| E.2.7 | **Add `init --from <preset>`** (the preset seam from §C.2). Today `init` creates an empty project and the user calls `add` for every plugin. A preset is a named bundle (`api-only`, `worker-heavy`, `event-driven`); it calls `add` for each item in the preset. | `public/features/init/init-command.ts` (+ 1 option) + `kernel/application/registries/preset-registry.ts` (NEW, deferred to Phase 2) | The option is *available* but no presets ship in Wave 6 (the registry is empty). CI emits "no presets registered" hint. |
| E.2.8 | **Type `PipelineContext` generically** in `kernel/application/abstracts/pipeline.ts`. The orchestrator's context is `PipelineContext<ScaffoldStepOutput>`; widening the generic lets the e2e tests assert on the context without casts. | `kernel/application/abstracts/pipeline.ts` (generic constraint) | No public API change. `scaffold.runtime` 41/41. |
| E.2.9 | **Document the `init` command's typed output** in `docs/commands/init.md` (NEW) — the input shape, the pipeline steps (with their per-step inputs/outputs), the exit codes per `CliError` category (§B §2). | `docs/commands/init.md` (NEW) | Doc-lint (F-3) passes. |
| E.2.10 | **Move the aspire-template asset files to `kernel/assets/aspire/`** (V-5, V-6) and the codegen modules to `kernel/codegen/aspire/`. The `kernel/templates/aspire/` subtree is **deleted**. | `kernel/templates/aspire/` (move) + `kernel/assets/aspire/` (templates only) + `kernel/codegen/aspire/` (codegen + tests) | F-CLI-22 clean; R-FOLD-CARD ≤ 4 clean. `scaffold.runtime` 41/41. |

### E.3  Out of scope (the explicit non-goals)

- **No** new `scaffold` command. The verb-noun unit is `init`, `add`, `generate`, `remove`; everything else is a misuse.
- **No** changes to the `services.json` / `netscript.config.ts` shape. The Wave 5 contract is the contract.
- **No** new template engines. The current template renderer is the contract; the E.2.5 move is a relocation, not a rewrite.
- **No** "scaffolder plugins" (a meta-plugin system that lets users define their own template bundles). The `Preset` registry (E.2.7, deferred) is the only extension axis; user-defined presets are a future wave.

### E.4  Recommendation (E)

**Adopt E.2.1 … E.2.10 as the Wave 6 scaffold-improvement slice
(slice 4 of the plan).** Each item is **bounded, reversible, and
gated** by the existing `scaffold.runtime` e2e suite. None of them
touch the orchestrator's contract. The big moves (E.2.5, E.2.10) are
*purely architectural* — they move files, they don't change
behavior. E.2.4 is the only *new code* (a new in-memory port), and
it is needed to make the next refactor (the command-registry seam,
slice 2) testable in isolation.


## F. Own analysis / risk register

### F.1  Slow-types / `deno publish --dry-run` (the doctrine §9 trap)

**Measured today (Wave 6 run, 82c1185):**

| Check                                              | Result                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| `deno check --unstable-kv` (scoped to `packages/cli/mod.ts`) | **PASS — clean.** |
| `deno task publish:dry-run` (root, full workspace) | **FAIL** — but the failure is in `packages/aspire`, not `packages/cli`. |

The dry-run error is:

```
TS2305 [ERROR]: Module '"../domain/mod.ts"' has no exported member 'AspireError'.
    at file:///…/packages/aspire/src/public/mod.ts:55:10
TS2305 [ERROR]: Module '"../domain/mod.ts"' has no exported member 'DuplicateContributionError'.
TS2305 [ERROR]: Module '"../domain/mod.ts"' has no exported member 'ReferenceSpec'.
TS2305 [ERROR]: Module '"../ports/mod.ts"' has no exported member 'AspireRuntime'.
```

`packages/aspire/src/domain/mod.ts` *does* re-export `AspireError`,
`DuplicateContributionError`, and `ReferenceSpec` (verified). And
`packages/aspire/src/ports/mod.ts` *does* export `AspireRuntime`. The
checker is **incorrectly resolving the public barrel** as if it didn't
expose the re-exports.

**This is the documented false positive** in `docs/architecture/doctrine/STANDARDS.md`
§9 / `09-anti-patterns-and-fitness-functions.md` — `deno publish
--dry-run` is known to produce false-positive re-export errors when a
public surface (`src/public/mod.ts`) re-exports *types and values
together* through a barrel that itself uses a barrel. The known
mitigation: re-export types and values in **two separate `export {…} from …` statements** in the
`public/mod.ts`, not as one mixed group. (Aspire's `public/mod.ts` is
one mixed `export {…}` block; the proposed Wave 6 fix is to split it
into two blocks.)

**Implication for `packages/cli`:** the CLI's `deno publish
--dry-run` cannot pass until aspire's barrel is fixed. Wave 6 impl
phase must **not** couple its own publish work to the aspire barrel
fix; the two are independent PRs. The CLI's *own* dry-run is the
*isolated* `deno check mod.ts maintainer.ts scaffolding.ts testing.ts`
command from `deno.json`'s `check` task — that one is **green** and
stays green.

### F.2  Over-cap files

The 500-LOC cap is the F-1 / `R-FOLD-CARD` hard limit. Top 20 files
by real LOC (verified with `wc -l`):

| File                                                                | LOC  | % of 500 | Disposition                                                                       |
| ------------------------------------------------------------------- | ---: | -------: | --------------------------------------------------------------------------------- |
| `src/kernel/application/ui/registry.ts`                             |  384 |     77 % | **Approaching cap.** Reads as a UI-keyed dispatch table; candidates for split: separate the formatter registry from the progress-bar registry (both live together today). |
| `src/kernel/application/scaffold/writers/write-app-files.ts`        |  384 |     77 % | **Approaching cap.** Each `writeXxx` is a small generator; split into per-step files (the orchestrator already has 11 step files in `application/scaffold/`). |
| `src/local/features/plugins/add/add-local-plugin.ts`                |  344 |     69 % | **Healthy.** Local contributor path; well below cap.                              |
| `src/kernel/adapters/loggers/console-logger.ts`                     |  343 |     69 % | **Healthy.** The single central output-event logger (the V-12 fact pattern from §B §4). |
| `src/public/features/deploy/upgrade/upgrade-deploy-command.ts`     |  341 |     68 % | **Approaching cap.** Split per upgrade phase (build → install → swap).            |
| `src/public/features/deploy/build/build-windows-strategy.ts`       |  338 |     68 % | **Approaching cap.** Splits cleanly into the Windows compile + bundle + sign phases. |
| `src/kernel/adapters/scaffold/memory-fs.ts`                        |  332 |     66 % | **Healthy.** In-memory FS for tests.                                              |
| `src/kernel/adapters/windows/compile/compile-runner.ts`             |  323 |     65 % | **Approaching cap.** Will become the `WindowsServiceDeployTarget.prepare()` body in slice 2; the body is naturally smaller once the port interface is in place. |
| `src/kernel/adapters/plugin/scaffolder.ts`                          |  316 |     63 % | **Healthy.** The plugin-scaffolder use case.                                      |
| `src/kernel/adapters/plugin/db-integration.ts`                      |  315 |     63 % | **Healthy.** The DB-integration use case.                                          |
| `src/kernel/adapters/windows/environment/env-file-content.ts`      |  314 |     63 % | **Healthy.** The env-file generator.                                              |

**No file exceeds 500 LOC.** The `pipeline.ts` (1,869) and
`official-plugin-copier.ts` (1,203) numbers from the run brief are
**byte** counts (verified: `wc -l` shows 59 and 27 LOC respectively);
the byte/LOC ratios (~32 and ~44) suggest they're heavy in
non-executable data (JSON configs, codegen templates). Both files
are well under the cap.

The cap-margin analysis: **no file is in violation today**, but **6
files are in the 320–384 range and need a passive monitor** (added to
the package's `lint-fitness` task as a soft warning, not a failure).
The 384-LOC files are the only two in the "approaching cap" zone; the
Wave 6 impl phase should split them as part of slice 3 (refactor) for
hygiene, not for cap compliance.

### F.3  `console.*` leakage

A direct search:

```text
$ grep -rln "console\." packages/cli/src --include="*.ts" | grep -v _test
(none)
```

**Zero `console.*` calls in production code.** The V-12 violation
hypothesis from the run brief is **not** present in this CLI; the
output-event discipline is centralized through the
`output/OutputEmitter` (and its logger). The `output` module is the
one place that knows the difference between *human*, *json*, and
*ndjson* rendering — and every command produces output only through
it. This is a *passing* discipline (the run brief's research
question F #4 is **answered: PASS**).

The single near-miss is `kernel/adapters/loggers/console-logger.ts`,
which **is** the central emitter itself — its name contains
"console" by *intent* (it *adapts* `console.log` to the
`OutputEmitter` contract), not by leak.

### F.4  Vendor-type leaks

A direct search for known leak patterns:

```text
$ grep -rEn "from ['\"]node_modules|github:|raw\.githubusercontent|gitlab" packages/cli/src --include="*.ts"
packages/cli/src/kernel/adapters/scaffold/editor-config.ts:42:  'https://raw.githubusercontent.com/denoland/deno/refs/heads/main/cli/schemas/config-file.v1.json',
packages/cli/src/kernel/adapters/scaffold/editor-config.ts:115: 'https://raw.githubusercontent.com/denoland/deno/refs/heads/main/cli/schemas/config-file.v1.json',
```

**V-14 (new in Wave 6 research):** `editor-config.ts` references the
Deno JSON schema via a **pinned HTTPS URL** at *lines 42 and 115*.
The URL is a *data* reference, not a *type* import — it's the
`$schema` field in the editor-config file the CLI emits. The risk is
a *network* dependency: if the URL changes or 404s, the editor-config
emission is broken. **Mitigation:** mirror the schema to
`kernel/assets/editor-config/v1.json` and reference the relative
path. The schema is ~3 KB; the cost is one file. Added to the §B
catalog as V-14.

There are **no other** vendor-type or vendor-code leaks. All CLI
deps are JSR or `npm:` imports declared in `deno.json`'s
`"imports"` block (verified by `grep -rn "from \"npm:\|from \"jsr:" packages/cli/src --include="*.ts"` — every match has a
matching `imports` entry in `deno.json`).

### F.5  Test gaps

Test/code ratio by surface (real `find … -name "*_test.ts" / -name "*.ts"` counts):

| Surface                 | Test files | Code files | Ratio  | Verdict                                                                                                         |
| ----------------------- | ---------: | ---------: | -----: | --------------------------------------------------------------------------------------------------------------- |
| `src/kernel/`           |         34 |        248 | 13.7 % | **Healthy.** Domain + application + adapters are well-covered.                                                  |
| `src/public/`           |         11 |        120 | **9.2 %** | **Thin.** The public surface is the user-facing contract; a 9 % test ratio is below the 12 % internal target.  |
| `src/maintainer/`       |          5 |         43 | 11.6 % | **Healthy** (small N).                                                                                          |
| `src/local/`            |          2 |          8 | 25.0 % | **Healthy** (small N).                                                                                          |
| `e2e/`                  |          7 |         72 | **9.7 %** | **Thin.** E2E test code is 7 files (suite definitions + fixtures), not unit tests; the ratio is misleading. |

**Action items** (added to the Wave 6 impl slice plan):

1. **`src/public/` test ratio to ≥ 12 %** — add at least 4 more
   `_test.ts` files covering the `init`, `add`, `generate`, `remove`
   public command paths *with* in-memory ports. The 4 files are
   under 250 LOC each; the new test ratio would be ~12.5 %.
2. **`e2e/` test ratio to ≥ 12 %** — add 2 more e2e tests covering
   the `+plugin` failure modes (plugin not found, plugin schema
   validation failure) and the `init --from <preset>` path.
3. **The `+13.4` CommunityToolkit bump** (slice 5) gets **one new
   e2e test** that asserts the TS apphost shape matches the 13.4 GA
   contract (`apphost.mts` entry point, `.modules/` directory).

### F.6  The `e2e/` workspace member (Wave 6 owned)

**Today's state:**

- Path: `packages/cli/e2e/` (its own `deno.json`, its own
  `cli.ts` binary).
- Layout already matches the A6 v2 role-folder shape: `src/{domain,
  adapters, presentation, ports, application}/`, plus `suites/` and
  `tests/` (per the v2 read-order convention).
- **NOT** in the root `deno.json` workspace list (root lists only
  `packages/*`). The CLI's e2e runs via the hardcoded path
  `deno run --allow-all packages/cli/e2e/cli.ts`.
- Already published as **`@netscript/cli-e2e@0.0.1-alpha.0`** (per the
  user's prior research; this is the correct posture per C.5 rule 8).

**Why it matters for Wave 6:** the `e2e/` workspace is a *second
consumer* of the CLI's public API (in addition to the JSR package
and the maintainer surface). The e2e is the only place where the
**composed** CLI is exercised end-to-end; it surfaces *integration*
regressions that unit tests miss. The two key gaps:

1. **Workspace membership:** add `packages/cli/e2e` to the root
   `deno.json` workspace list so it picks up the same `imports`
   block (today it duplicates the cliffy/std entries in its own
   `deno.json`). The wave 6 change is a one-line edit to the root
   `deno.json` + the deletion of the duplicated entries in
   `packages/cli/e2e/deno.json`'s `imports` block.

2. **Type-only contract enforcement:** the e2e uses the CLI as a
   *black box* (it shells to `netscript` via `Deno.Command` and
   asserts on stdout/stderr/exit). There is no type-level proof
   that the CLI's public surface *is* the surface the e2e exercises.
   Wave 6 should add a single test in the CLI's `testing.ts` that
   imports each command's `Command` factory and asserts the e2e's
   invocation strings (`netscript init --name <p>`) match the
   factory's `name()` / `arguments()`. This catches drift
   automatically.

### F.7  Risk register

| # | Risk                                                                                                                | Likelihood | Impact | Mitigation (in slice plan)                                                                                          |
| - | ------------------------------------------------------------------------------------------------------------------- | :--------: | :----: | ------------------------------------------------------------------------------------------------------------------- |
| R-1 | `aspire` barrel false-positive in `deno publish --dry-run` blocks the **root** `publish:dry-run` task (per §F.1)  |     H      |    L   | Wave 6 slice 0 (prep): fix the aspire barrel as a one-line PR (separate from the CLI PR). Doc the CLI as `deno check mod.ts maintainer.ts scaffolding.ts testing.ts` for its own CI. |
| R-2 | `kernel/adapters/windows/compile/compile-runner.ts` and 5 other 320–384-LOC files stay over the soft warning cap   |     M      |    L   | Wave 6 slice 3 (refactor): add the `lint-fitness` soft warning task. Split the two 384-LOC files as part of slice 3. |
| R-3 | `editor-config.ts` references a pinned HTTPS schema URL (V-14)                                                     |     L      |    L   | Wave 6 slice 5 (Asapire 13.4): mirror the schema to `kernel/assets/editor-config/v1.json`.                          |
| R-4 | `src/public/` test ratio stays at 9.2 % (below the 12 % target)                                                    |     M      |    M   | Wave 6 slice 2 (command-registry seam): add 4 in-memory-port unit tests as part of the seam.                        |
| R-5 | `e2e/` not a true workspace member                                                                                  |     H      |    M   | Wave 6 slice 0 (prep): add to root `deno.json` workspace list; remove duplicated `imports` in `packages/cli/e2e/deno.json`. |
| R-6 | `e2e/` black-box invocation drift (CLI changes a flag name; e2e silently breaks)                                    |     M      |    M   | Wave 6 slice 2: add the type-only contract test (§F.6 #2).                                                          |
| R-7 | 13.4 TS apphost GA shape changes break the CLI's generated apphost                                                 |     M      |    H   | Wave 6 slice 5: bump CommunityToolkit 13.1.0 → 13.4.x; update `kernel/codegen/aspire/generators/`; add 1 e2e test.    |
| R-8 | The `kernel/application/scaffold/writers/write-app-files.ts` 384-LOC file becomes a refactor chokepoint                |     M      |    M   | Wave 6 slice 4 (scaffold improvements): split per step (E.2.1); `scaffold.runtime` e2e gates each step.             |
| R-9 | `local/` surface grows in Wave 7+ and starts to import from `kernel/` (F-CLI-4 violation)                          |     M      |    M   | Add the F-CLI-4 gate to the root `deno task arch:check` (it isn't there today).                                    |
| R-10 | `extension-points.ts` does not yet expose `DeployTargetPort` (only `DeployTargetRegistry`)                          |     M      |    M   | Wave 6 slice 2: add the port and the `windows-service` target's port-shaped implementation in the same slice.      |
| R-11 | `scaffold.runtime` breaks during slice 2 (the command-registry rewrite) and we discover the e2e gate is the only safety net |  L    |   H    | Slice 2 is **only allowed to land** if `scaffold.runtime` is 41/41 *before* the change, and the PR is **blocked on a green e2e rerun**. Wave 6 PR template: "do not approve without a clean `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`". |
| R-12 | Doc drift between `research.md` and the actual impl                                                                 |     H      |    L   | The Wave 6 impl phase opens with a one-line edit per section: "research.md → impl-realized" log in the PR.        |
| R-13 | `deno publish` 13.4 dashboard-command feature (F.2) requires touching the codegen layer that we planned as a *defer*   |     L      |    M   | Wave 6 slice 5: dashboard-command registration is **optional**; we ship a "Wires but disabled" registry entry, gated off behind a feature flag. |
| R-14 | `e2e/cli.ts` has 7 test files at 9.7 % ratio, but the *right* metric is "tests per e2e suite" — 7 / 1 suite = 7 tests per suite (the `scaffold` suite is the only one). |  L  |    M   | Wave 6 slice 5: add a second suite (`deploy.runtime` for the Windows service), so the e2e covers both scaffold and deploy. |
| R-15 | The `public/features/root/public-command-tree.ts` hand-wired chain (V-1, F-CLI-27) becomes a maintenance hotspot if not closed in slice 2 |  H  |   H    | Wave 6 slice 2 **must** close V-1 as part of the command-registry seam. The 130+ LOC chain disappears; the new registry has 6 registered commands. |

### F.8  Recommendation (F)

1. **Run the research-brief's `deno publish --dry-run` is failing
   upstream; the CLI itself is clean.** Treat R-1 (aspire barrel) as
   a *slice 0 prep* dependency, not a Wave 6 cli risk.
2. **Add a `lint-fitness` task** in slice 3 (refactor) that
   *monitors* the 320+ LOC files; the 500-LOC gate stays hard, the
   320+ watch is a soft warning.
3. **Promote the `e2e/` workspace to a real workspace member** in
   slice 0 (one-line change to root `deno.json`).
4. **Add 4 + 2 new tests** to `src/public/` and `e2e/` (F.5) in
   slice 2 (seam work pays for it).
5. **Mirror the `editor-config` schema** to `kernel/assets/editor-config/v1.json` in slice 5 (R-3).
6. **Add the F-CLI-4 gate** to `deno task arch:check` in slice 0
   (R-9).
7. **Do not block on R-1** — the aspire fix is a sibling PR.


## Proposed Wave 6 implementation slice plan (for the LATER impl phase — not executed here)

> The impl phase is **not** part of this run. This section is the
> implementation plan that the *next* OpenHands session (or a human
> maintainer) executes. Each slice is a single PR with explicit
> gates. The slices are ordered by dependency, not by priority.

### Slice 0 — Prep (zero-LOC housekeeping)

**Goal:** set up the gates and prerequisites that the rest of the
slices depend on.

| # | Change                                                                                            | Files touched                                              | Gate                                              | Risk ref |
| - | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- | -------- |
| 0.1 | Add `packages/cli/e2e` to root `deno.json` workspace list. Remove duplicated `imports` from `packages/cli/e2e/deno.json`. | `deno.json` (root), `packages/cli/e2e/deno.json` | `deno task e2e:cli suites` lists the suite unchanged. | R-5 |
| 0.2 | Add the F-CLI-4 (`kernel/**` ∌ `maintainer/**` etc.) gate to `deno task arch:check`. The gate is a script under `.llm/tools/`. | `.llm/tools/check-f-cli-boundaries.ts` (NEW), `deno.json` (root) | `deno task arch:check` exits 0.                  | R-9      |
| 0.3 | Sibling PR (out of this repo's slice plan): fix `packages/aspire/src/public/mod.ts` to split types-vs-values `export {…}` blocks. | `packages/aspire/src/public/mod.ts` (out of repo)         | `deno publish --dry-run` green.                  | R-1      |
| 0.4 | Add a `lint-fitness` soft-warning task that flags files in the 320–499 LOC range. Hard cap stays 500. | `.llm/tools/run-lint-fitness.ts` (NEW), `packages/cli/deno.json` | Task exits 0 (soft); logs the list.            | R-2      |

**LOC delta:** ~80 LOC new tooling. No code change to `packages/`.

### Slice 1 — Standards (docs only, zero code)

**Goal:** write the standards doc the run brief asks for
(`packages/cli/docs/standards.md`) and the per-command reference.

| #   | Change                                                                                            | Files touched                                              | Gate                                                       | Risk ref |
| --- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| 1.1 | Create `packages/cli/docs/standards.md` (the §B outline below).                                  | `packages/cli/docs/standards.md` (NEW, ≤ 600 LOC) | F-3 (doc-lint) passes.                                    |          |
| 1.2 | Create `packages/cli/docs/commands/{init,add,generate,remove,deploy,doctor,seed,migrate,build,logs,upgrade,package-cli}.md`. | `packages/cli/docs/commands/*.md` (12 NEW) | F-3 passes.                                               |          |

**LOC delta:** ~1,500 LOC docs. Zero code. Reversible (delete the
folder; nothing else references it).

### Slice 2 — Command registry seam + DeployTargetPort (the biggest slice)

**Goal:** close V-1 (F-CLI-27 hand-wired command tree) and V-2 / V-4
(V-11 process-port leakage), in a single coordinated change.

| #   | Change                                                                                                                                                       | Files touched                                                                                                                                                                                                                                                                                                                       | Gate                                                                                                                  | Risk ref        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2.1 | Add `CliCommandRegistry<TContext>` in `kernel/application/registries/command-registry.ts` (§C.3 shape).                                                       | `src/kernel/application/registries/command-registry.ts` (NEW, ~80 LOC)                                                                                                                                                                                                                                                              | Unit test exercises `program(...)` on a mock context.                                                                |                 |
| 2.2 | Add `DeployTargetPort` + `DeployTargetRegistryPort` (§D.3 shape).                                                                                              | `src/kernel/ports/deploy/target-port.ts` (NEW, ~150 LOC)                                                                                                                                                                                                                                                                            | Unit test against the in-memory `DeployTargetRegistry`.                                                              | R-10            |
| 2.3 | Add `WindowsServiceDeployTarget` (the *only* concrete target) — port-shaped re-implementation of today's `kernel/adapters/windows/compile/*` + `servy-command`. | `src/kernel/ports/deploy/targets/windows-service-target.ts` (NEW, ≤ 250 LOC)                                                                                                                                                                                                                                                         | New port-shaped Windows target passes the e2e `scaffold.runtime` + a new unit test (using an in-memory `ProcessPort`). |                 |
| 2.4 | Rewrite `public/composition/create-public-cli.ts` to consume the registry (the 130+ LOC hand-wired chain becomes 6 `register(...)` calls).                    | `src/public/composition/create-public-cli.ts` (REWRITE, ≤ 60 LOC)                                                                                                                                                                                                                                                                    | `scaffold.runtime` 41/41.                                                                                             | R-11, R-15      |
| 2.5 | Add 4 new unit tests for `src/public/` (init, add, generate, remove) using in-memory ports (closes F.5 / R-4).                                                  | `src/public/features/{init,add,generate,remove}/*_test.ts` (4 NEW, ≤ 200 LOC each)                                                                                                                                                                                                                                                    | Test ratio for `src/public/` ≥ 12 %.                                                                                  | R-4             |
| 2.6 | Add the type-only contract test (§F.6 #2).                                                                                                                     | `src/public/features/root/command-tree-contract_test.ts` (NEW, ≤ 80 LOC)                                                                                                                                                                                                                                                              | Test runs the e2e's invocation strings against the public `Command` factories.                                       | R-6             |
| 2.7 | Promote `plan-init.ts` (E.2.3) to the public surface.                                                                                                          | `src/kernel/application/scaffold/plan-init.ts` → `src/public/features/init/init-plan.ts` (move)                                                                                                                                                                                                                                       | `scaffold.runtime` 41/41.                                                                                             |                 |

**LOC delta:** ~ +800 / -200. Net +600.

### Slice 3 — Refactor (cap-margin, helpers/ → codegen/, depth cleanup)

**Goal:** address §A.4 violations and the 384-LOC approaching-cap files.

| #   | Change                                                                                                                            | Files touched                                                                                                                                                                                                                                                                                                                                                | Gate                                                                              | Risk ref |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| 3.1 | Move `kernel/application/scaffold/render-ts-apphost.ts` → `kernel/codegen/aspire/render-ts-apphost.ts` (E.2.5).                  | `src/kernel/application/scaffold/render-ts-apphost.ts` → `src/kernel/codegen/aspire/render-ts-apphost.ts` (move)                                                                                                                                                                                                                                            | `scaffold.runtime` 41/41.                                                         |          |
| 3.2 | Move `kernel/templates/aspire/` → `kernel/assets/aspire/` (templates only) + `kernel/codegen/aspire/` (codegen + tests). Delete `kernel/templates/aspire/`. (E.2.10) | `src/kernel/templates/aspire/` → `src/kernel/{assets,codegen}/aspire/` (move + split)                                                                                                                                                                                                                                                                       | R-FOLD-CARD ≤ 4 clean. F-CLI-22 clean. `scaffold.runtime` 41/41.                 |          |
| 3.3 | Delete the three `helpers/` directories (`kernel/assets/generated/aspire/helpers/`, `kernel/assets/aspire/helpers/`, `kernel/templates/aspire/helpers/`). The "helpers" name is forbidden (F-6); the contents move into the parent `src/kernel/codegen/aspire/` or into `src/kernel/assets/aspire/` as appropriate. | `src/kernel/{assets/generated,assets,templates}/aspire/helpers/` (delete; contents moved)                                                                                                                                                                                                                                                                  | F-6 / R-FOLD-CARD clean.                                                          |          |
| 3.4 | Split `kernel/application/ui/registry.ts` (384) into `ui/formatter-registry.ts` (≤ 220) + `ui/progress-registry.ts` (≤ 220).      | `src/kernel/application/ui/registry.ts` → `src/kernel/application/ui/{formatter,progress}-registry.ts` (split)                                                                                                                                                                                                                                              | All existing tests pass.                                                          | R-2      |
| 3.5 | Split `kernel/application/scaffold/writers/write-app-files.ts` (384) into per-step writers (`write-app-mod.ts`, `write-app-config.ts`, etc.). (E.2.1) | `src/kernel/application/scaffold/writers/write-app-files.ts` → `src/maintainer/features/codegen/scaffold/steps/write-{app-mod,app-config,app-readme,...}.ts` (split + move to maintainer surface)                                                                                                                                                            | `scaffold.runtime` 41/41. F-CLI-4 clean.                                          | R-8      |
| 3.6 | Add the `lint-fitness` soft-warning to the `deno task check` aggregate (from slice 0.4).                                          | `deno.json` (root, `check` task)                                                                                                                                                                                                                                                                                                                             | Task exits 0; warnings visible in log.                                           | R-2      |

**LOC delta:** ~0 net (refactor; no net new code).

### Slice 4 — Scaffold improvements (E.2.x)

**Goal:** deliver the bounded scaffold improvements from §E.2.

| #   | Change                                                                                                                            | Files touched                                                                                                                                                                                                                                  | Gate                                                                              | Risk ref |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | -------- |
| 4.1 | Split `orchestrate-init.ts` (209) into `init-orchestrator.ts` (≤ 120) + `init-pipeline.ts` (≤ 100). (E.2.2)                       | `src/kernel/application/scaffold/orchestrate-init.ts` → `init-orchestrator.ts` + `init-pipeline.ts` (split)                                                                                                                                       | `scaffold.runtime` 41/41.                                                         |          |
| 4.2 | Introduce `InMemoryScaffolder` in `kernel/application/testing/in-memory-scaffolder.ts` (NEW). (E.2.4)                              | `src/kernel/application/testing/in-memory-scaffolder.ts` (NEW, ≤ 200 LOC)                                                                                                                                                                       | New unit test for orchestrator runs in < 100 ms.                                  |          |
| 4.3 | Add `--json` to `netscript init`. (E.2.6)                                                                                          | `src/public/features/init/init-command.ts` (+ 1 option) + `src/kernel/application/output/renderers/init-json-renderer.ts` (NEW)                                                                                                                  | New e2e test asserts `--json` output shape. Existing suite unaffected.            |          |
| 4.4 | Add `init --from <preset>` option; the preset registry is empty for Wave 6. (E.2.7)                                                | `src/public/features/init/init-command.ts` (+ 1 option) + `src/kernel/application/registries/preset-registry.ts` (NEW, ≤ 50 LOC)                                                                                                                | `init --from <anything>` errors with "no presets registered".                     |          |
| 4.5 | Type `PipelineContext` generically in `kernel/application/abstracts/pipeline.ts`. (E.2.8)                                         | `src/kernel/application/abstracts/pipeline.ts` (generic constraint)                                                                                                                                                                              | No behavior change. `scaffold.runtime` 41/41.                                     |          |
| 4.6 | Add `docs/commands/init.md`. (E.2.9)                                                                                              | `packages/cli/docs/commands/init.md` (NEW)                                                                                                                                                                                                       | F-3 doc-lint passes.                                                              |          |

**LOC delta:** ~ +500 / -100. Net +400.

### Slice 5 — Aspire 13.4 (the S4-now deliverable)

**Goal:** bump CommunityToolkit to 13.4.x; adapt the generated TS
apphost to the GA shape.

| #   | Change                                                                                                                                       | Files touched                                                                                                                                                                                                                                                                                                                       | Gate                                                                                                                | Risk ref |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| 5.1 | Bump `CommunityToolkit.Aspire.Hosting.Deno` 13.1.0 → 13.4.x in `dotnet/AppHost/AppHost.csproj`. Bump `CommunityToolkit.Aspire.Hosting.SQLite` to 13.4.x. | `dotnet/AppHost/AppHost.csproj`                                                                                                                                                                                                                                                                                                     | `dotnet build` succeeds.                                                                                             | R-7      |
| 5.2 | Update the TS apphost scaffolded by the CLI to match the 13.4 GA shape (`apphost.mts` entry point, generated `.modules/` directory).            | `src/kernel/codegen/aspire/generators/generate-aspire-config.ts`, `src/kernel/codegen/aspire/templates/` (post-slice 3.2)                                                                                                                                                                                                          | `scaffold.runtime` 41/41. New e2e test asserts apphost shape.                                                      | R-7      |
| 5.3 | Mirror the `editor-config` JSON schema to `kernel/assets/editor-config/v1.json`; reference the relative path. (R-3)                          | `src/kernel/assets/editor-config/v1.json` (NEW, ≤ 5 KB) + `src/kernel/adapters/scaffold/editor-config.ts` (2-line edit)                                                                                                                                                                                                            | No raw.githubusercontent.com URL in source.                                                                         | R-3      |
| 5.4 | Add a new e2e suite `deploy.runtime` covering the Windows-service target's port-shaped path (the *use case* the slice 2.3 port is exercised by). | `packages/cli/e2e/suites/deploy/` (NEW)                                                                                                                                                                                                                                                                                            | `deno task e2e:cli run deploy.runtime --cleanup` green.                                                              | R-14     |
| 5.5 | Optional: register `netscript seed` and `netscript migrate` as Aspire dashboard commands via `WithProcessCommand()`. Gated behind a feature flag. | `src/kernel/codegen/aspire/generators/generate-apphost-helpers.ts` (NEW)                                                                                                                                                                                                                                                            | Feature flag disabled by default. Manual smoke in `examples/playground` confirms wires.                            | R-13     |

**LOC delta:** ~ +400 / -100. Net +300.

### Slice 6 — Verification

**Goal:** produce the verdict and close AP-1.

| #   | Change                                                                                                  | Files touched                                            | Gate                                                                                            | Risk ref |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| 6.1 | Run the full e2e (`scaffold.runtime` + `deploy.runtime` if slice 5.4 landed).                            | (no file changes)                                         | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` 41/41.                       | R-11     |
| 6.2 | Run the root `deno task arch:check` and the new F-CLI-4 gate (slice 0.2).                                | (no file changes)                                         | Both green.                                                                                      | R-9      |
| 6.3 | Run `deno publish --dry-run` for `packages/cli` (isolated).                                              | (no file changes)                                         | Slow-types: 0. Portability: 0.                                                                  | R-1      |
| 6.4 | Update `research.md` (this file) with the **"impl-realized" log**: which slices were merged, which V-* violations were closed, which risks were realized. | `.llm/tmp/run/feat-package-quality-wave6-cli--research/research.md` (post-impl edit) | PR template.                                                                                    | R-12     |
| 6.5 | Mark `packages/cli AP-1` in the debt register as `Restructure → Done`. Add the post-restructure Verdict entry. | `docs/architecture/debt/packages-cli.md` (NEW, 1 entry) | The debt register contains the Verdict entry.                                                  |          |

**LOC delta:** minimal.

### Slice dependency graph (impl-phase)

```
slice 0 (prep) ─┬─→ slice 1 (standards)
                ├─→ slice 2 (registry + port) ─┬─→ slice 3 (refactor) ─→ slice 4 (scaffold) ─┐
                │                             │                                                  │
                │                             └─→ slice 5 (aspire 13.4) ─────────────────────────┼─→ slice 6 (verify)
                │                                                                                │
                └────────────────────────────────────────────────────────────────────────────────┘
```

**Critical path:** slice 2 → slice 3 → slice 4 → slice 6 (because
slice 3 depends on slice 2's port shape; slice 4 depends on slice
3's codegen relocation; slice 6 depends on all).

**Parallel paths:** slice 1 (docs only) can land in any order; slice
5 can land in parallel with slices 3 / 4 (no shared files).


## Proposed target `src/` tree (the Wave 6 impl deliverable, expressed as a diff against `82c1185`)

> The current `packages/cli/src/{kernel,public,maintainer,local}/`
> is **close to correct** for the A6 archetype; the changes below
> are *targeted moves*, not a rewrite. Each move is bounded to a
> specific file and has a single PR.

```
packages/cli/src/
├── kernel/                                       (unchanged root)
│   ├── abstracts/                                 (unchanged)
│   ├── adapters/                                  (unchanged root, 11 children ≤ 12)
│   │   ├── deploy/                                (unchanged — moves *into* port shape in slice 2)
│   │   ├── scaffold/                              (unchanged — depth-5 tests stay; A6 v2 says tests/ lives adjacent)
│   │   ├── windows/                               (unchanged)
│   │   ├── runtime/                               (unchanged)
│   │   ├── scaffold/                              (unchanged)
│   │   ├── scaffold/                              (unchanged)
│   │   ├── config/                                (unchanged)
│   │   ├── loggers/                               (unchanged — V-12 is the *intentional* central emitter)
│   │   ├── plugin/                                (unchanged)
│   │   ├── database/                              (unchanged)
│   │   ├── database/                              (unchanged)
│   │   └── editor-config/                         (R-3 mirror: moves out of scaffold/ into a dedicated adapter; ≤ 12 children)
│   │
│   ├── application/                               (unchanged root; 2 splits in slice 3)
│   │   ├── abstract/                              (unchanged)
│   │   ├── registries/                            (+ command-registry.ts in slice 2, + preset-registry.ts in slice 4.4)
│   │   ├── ui/                                    (split: formatter-registry.ts, progress-registry.ts in slice 3.4)
│   │   ├── output/                                (+ renderers/init-json-renderer.ts in slice 4.3)
│   │   ├── scaffold/                              (split orchestrate-init.ts → orchestrator + pipeline in slice 4.1; writers/ moves out in slice 3.5)
│   │   ├── testing/                               (+ in-memory-scaffolder.ts in slice 4.2)
│   │   ├── ...
│   │   └── ...
│   │
│   ├── assets/                                    (REORGANIZED in slice 3.2)
│   │   ├── aspire/                                (← from kernel/templates/aspire/, templates only)
│   │   │   ├── app-host.ts.tmpl                   (NO helpers/ subdir; flat)
│   │   │   ├── ...
│   │   │   └── v1.json                            (R-3 mirrored schema)
│   │   └── editor-config/                         (R-3 mirror)
│   │
│   ├── codegen/                                   (NEW top-level in slice 3.2)
│   │   ├── aspire/                                (← from kernel/templates/aspire/, codegen + tests only)
│   │   │   ├── generate-aspire-config.ts
│   │   │   ├── render-ts-apphost.ts               (← from kernel/application/scaffold/render-ts-apphost.ts in slice 3.1)
│   │   │   ├── generate-apphost-helpers.ts        (slice 5.5, optional)
│   │   │   └── tests/                             (≤ 4 depth from kernel/)
│   │   └── ...
│   │
│   ├── constants/                                 (unchanged)
│   ├── domain/                                    (unchanged — 11 children ≤ 12)
│   ├── ports/                                     (+ deploy/target-port.ts in slice 2.2, + deploy/targets/windows-service-target.ts in slice 2.3)
│   ├── presentation/                              (unchanged — Cliffy command factories live here in slice 2.4)
│   ├── templates/                                 (DELETED in slice 3.2 — contents moved to assets/ and codegen/)
│   ├── extension-points.ts                        (+ DeployTargetPort in slice 2.2)
│   └── mod.ts                                     (unchanged)
│
├── public/                                        (un-CHANGED root, + init-plan.ts in slice 2.7)
│   ├── composition/                               (rewrite create-public-cli.ts in slice 2.4 to ~60 LOC)
│   ├── features/                                  (unchanged shape)
│   │   ├── init/                                  (+ init-plan.ts in slice 2.7, + --json in slice 4.3, + --from in slice 4.4)
│   │   ├── add/                                   (unchanged)
│   │   ├── generate/                              (unchanged)
│   │   ├── remove/                                (unchanged)
│   │   ├── deploy/                                (the V-2/V-11 violations are *fixed* by slice 2.3 — the file shells go through the new Windows target's port)
│   │   ├── root/                                  (public-command-tree.ts becomes the 6-line registry consumer in slice 2.4)
│   │   └── ...
│   ├── public-api.ts                              (unchanged)
│   └── mod.ts                                     (unchanged)
│
├── maintainer/                                    (unchanged root, + codegen/scaffold/steps/ in slice 3.5)
│   ├── composition/                               (unchanged)
│   ├── features/                                  (unchanged)
│   │   ├── codegen/                               (NEW subtree in slice 3.5; holds the split writers)
│   │   │   └── scaffold/steps/                    (per-step files ≤ 220 LOC each)
│   │   └── ...
│   ├── adapters/                                  (unchanged)
│   ├── infra/                                     (unchanged)
│   └── mod.ts                                     (unchanged)
│
└── local/                                         (unchanged — 2 test files / 8 code files; small N)
    ├── features/plugins/add/                      (unchanged)
    ├── composition/                               (unchanged)
    └── mod.ts                                     (unchanged)

packages/cli/e2e/                                  (PROMOTED to true workspace member in slice 0.1)
├── deno.json                                      (imports trimmed; root imports now apply)
├── cli.ts                                         (unchanged)
├── src/                                           (unchanged A6 v2 layout)
├── suites/
│   ├── scaffold/                                  (unchanged — 7 tests)
│   └── deploy/                                    (NEW in slice 5.4)
└── tests/                                         (unchanged)
```

**Net effect:** the kernel **gains** `codegen/` and `ports/deploy/`
(+ ~200 LOC); **loses** `templates/` (- 11 files); the maintainer
**gains** `features/codegen/scaffold/steps/` (+ ~10 files, each ≤
220 LOC); `e2e/` is **promoted** to a true workspace member (1-line
change). No file in the final tree exceeds 500 LOC; no folder
exceeds 12 children; no path exceeds depth 4 from `kernel/` (or
`maintainer/`); no `helpers/` directories remain; no
`raw.githubusercontent.com` URLs remain.


## Standards outline (the `packages/cli/docs/standards.md` skeleton)

> The full doc is the slice 1 deliverable. The outline below is
> the table of contents and the per-section one-liner the slice 1
> PR must flesh out.

```text
# @netscript/cli — Standards

## Standards outline (the `packages/cli/docs/standards.md` skeleton)

> The full doc is the slice 1 deliverable. The outline below is
> the table of contents and the per-section one-liner the slice 1
> PR must flesh out.

### §S.1 Command contract
- Every public command is a class implementing `CliCommand<THost>` in
  `src/public/features/<group>/<verb>-<noun>/`. The class is registered
  with `CliCommandRegistry<PublicCliContext>` in
  `src/public/composition/create-public-cli.ts`.
- The command receives `PublicCliContext` (a typed `Dependencies`
  object — Logger, Fs, Prompt, Jsr, …) via constructor injection
  (F-CLI-28).
- The command is **declarative** — it builds a Cliffy `Command`, not a
  `main()`. The `define()` method returns the `Command`; the binary
  edge calls `parse()`.
- The command is **idempotent** — re-running with the same input
  produces the same output (modulo timestamps and IDs).
- The command is **reversible** where possible — `add` has a `remove`
  counterpart; `init` has no counterpart (intentional).

## §S.2 Typed error model
- Every public command throws a `CliExitError` subclass
  (`UsageError`, `NotFoundError`, `RemoteError`, `ConflictError`,
  `PreconditionError`, `InternalError`) on failure.
- The binary edge maps the `exitCode` to a process exit code.
- The `--json` output mode renders errors as `{"error": {"name", "code", "message", "context"}}`.
- Domain code never throws `Error` directly — it uses one of the above
  subclasses (F-CLI-21).
- The error model is reused from `src/kernel/domain/errors/`, not
  redefined per command.

## §S.3 IO / output discipline
- Domain code never calls `console.log`, `Deno.stdout.writeSync`, or
  `Deno.stderr.writeSync` directly. All output goes through
  `output/OutputEmitter` (or its adapter `console-logger.ts`).
- The `--json` flag is registered *per command* (not globally), so
  commands can choose whether their output is structured.
- The `--quiet` flag suppresses human output but not errors.
- Exit codes: 0 = success; 1 = usage error; 2 = not found; 3 = remote
  error; 4 = conflict; 5 = precondition; 10 = internal.

## §S.4 Naming
- File: `<verb>-<noun>.ts` (e.g. `init-command.ts`, `package-cli-deploy-command.ts`).
  No `manager.ts`, `controller.ts`, `service.ts`, `handler.ts`.
- Class: `PascalCase`, ends in `Command` (e.g. `InitCommand`,
  `PackageCliDeployCommand`).
- Folder: `<group>/<verb>-<noun>/` (e.g. `init/init-command/`).
- Test file: `<source>_test.ts` adjacent to source.

## §S.5 Testing tiers
- **Unit (in-memory ports)**: ≤ 100 ms, no `Deno.makeTempDir`, no
  `Deno.Command`. Uses the `InMemoryScaffolder`, `InMemoryLogger`,
  etc. ports. Asserts on the typed output / typed error.
- **Integration (real ports, temp dir)**: ≤ 5 s, uses
  `Deno.makeTempDir`, no network. Asserts on the file system state.
- **End-to-end (real CLI binary)**: in `packages/cli/e2e/`. Shells
  to the actual `netscript` binary. Asserts on stdout, stderr, exit
  code. The `scaffold.runtime` suite is the canonical example.

## §S.6 Public-surface rules
- Subpath exports only — no `src/maintainer/index.ts` mega-barrel.
- Every public subpath (`./features/init`, `./features/deploy`, …)
  has a corresponding `docs/commands/<name>.md` file.
- The `mod.ts` of each public subpath exports only **the
  command's class** and the **typed input shape** (not the
  composition root or the use case).
- The `extension-points.ts` manifest re-exports every registry /
  port the public surface may consume.

## §S.7 Layers & import discipline
- `public/` may import from `public/` and `kernel/`. Never from
  `maintainer/` or `local/` (F-CLI-3 / F-CLI-4).
- `kernel/` may import from `kernel/` only (F-CLI-3).
- `maintainer/` may import from `kernel/` and `public/`. Never from
  `local/` (F-CLI-4).
- `local/` may import from `kernel/` only. Never from `public/` or
  `maintainer/` (F-CLI-4).
- `Deno.Command` is only allowed in `kernel/adapters/**` and
  `maintainer/adapters/**`. Public/`kernel/presentation` may not
  shell out directly (F-CLI-5 / F-CLI-16 — V-11).


## Summary of deliverables

| # | Deliverable                                                                                  | Where it lives in this doc                                  | Status          |
| - | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------- |
| 1 | §A — domain decomposition + A6 v2 gate matrix                                                | §A.1–A.5 (lines ~63–270)                                    | **Complete.**   |
| 2 | §B — standards (V-1 to V-14)                                                                  | §B.1–B.5 (lines ~271–517)                                   | **Complete.**   |
| 3 | §C — future-impl readiness + protect-don't-implement list                                    | §C.1–C.5 (lines ~518–678)                                   | **Complete.**   |
| 4 | §D — Aspire 13.4 deploy-seam design (DESIGN ONLY)                                             | §D.1–D.5 (lines ~679–856)                                   | **Complete.**   |
| 5 | §E — bounded scaffold improvements (E.2.1–E.2.10)                                              | §E.1–E.3 (lines ~857–925)                                    | **Complete.**   |
| 6 | §F — own analysis + 15-row risk register                                                     | §F.1–F.8 (lines ~926–1152)                                  | **Complete.**   |
| 7 | Wave 6 implementation slice plan (NOT executed here)                                          | Slice 0–6 (lines ~1153–1281)                                | **Complete.**   |
| 8 | Proposed target `src/` tree (post-impl)                                                       | "Proposed target `src/` tree" (lines ~1282–1387)            | **Complete.**   |
| 9 | `packages/cli/docs/standards.md` outline (§S.1–§S.7)                                         | "Standards outline" (lines ~1388–1479)                      | **Complete (outline).** Full text is slice 1 deliverable. |
| 10 | TL;DR + status banner                                                                         | Top of file (lines ~1–61)                                   | **Complete.**   |
| 11 | OPENHANDS summary (committed via `OPENHANDS_SUMMARY_PATH`)                                    | `summary.md` (separate file, written before exit)           | **To write.**   |


## Open questions for the maintainer

These are the *only* questions the research could not answer from
the repo and that the maintainer must answer before the Wave 6
impl phase starts. Each is blocking for one specific slice.

1. **Slice 0.3 (sibling PR):** does the maintainer want to ship
   the aspire-barrel fix as a sibling PR (the research
   recommendation) or accept that the root `deno task
   publish:dry-run` stays red until a follow-up lands?
2. **Slice 2.4 (registry):** does the maintainer want the
   `CliCommandRegistry` to be *generic over the Cliffy `Command`
   type*, or *concrete to the `Command` used by `@netscript/cli`*
   (which is `Cliffy.command()`)? The generic form is more
   reusable; the concrete form is simpler.
3. **Slice 3.5 (codegen relocation):** does the maintainer want
   the per-step writers to live under `maintainer/features/codegen/`
   (the research recommendation) or under `kernel/codegen/`
   (which would violate F-CLI-3 — kernel can't see maintainer's
   output, but the codegen is *for* maintainer commands)?
4. **Slice 5.5 (Aspire dashboard commands):** is the optional
   "Wires but disabled" feature flag acceptable, or should the
   codegen be deferred entirely (no `WithProcessCommand`
   registration at all in Wave 6)?
5. **Slice 6.4 (impl-realized log):** does the maintainer want
   the per-section log in `research.md` or in a separate
   `research-realized.md` file alongside the original?

## Notes for the next OpenHands session (impl phase)

- This run is **research only**; the impl phase starts with the
  **same `cd` and read order** that this run used (see
  `context-pack.md`).
- The `OPENHANDS_SUMMARY_PATH` is a separate file, written
  before exit and ending with the literal line `RESEARCH COMPLETE`.
- The impl phase must **not** skip the slice ordering. Slice 2
  is the load-bearing change; if it lands without slices 0.1
  (e2e workspace) and 0.2 (F-CLI-4 gate), the e2e safety net is
  weakened.
- The maintainer's answers to the 5 open questions above are
  **required before slice 0 lands**, because the answers change
  the slice 0.1 + 0.2 deliverables.


## Reading order (for the evaluator)

If you have 10 minutes: read **TL;DR** + **§A.5** (gate matrix) +
**§D.3** (deploy port shape) + **slice 2** (the load-bearing PR).
If you have 30 minutes: read everything except §C.1–C.2 (registry
catalog — already partly in §B) and §E (scaffold is the
*least risky* slice and can be deferred).
If you have 60 minutes: read the whole file. The §A.1–A.4
mapping is the answer to the open AP-1 debt; the §F.7 risk
register is the answer to "what can go wrong".


