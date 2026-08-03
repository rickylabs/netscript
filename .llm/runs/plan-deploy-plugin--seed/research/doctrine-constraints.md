# Doctrine + harness constraints for the deploy plugin family

Source: Opus 4.8 research sub-agent of this run, 2026-07-18, over `docs/architecture/doctrine/`
(01–11 + ref-migration-map), `.llm/harness/archetypes/`, `.llm/harness/gates/`,
`.llm/harness/debt/arch-debt.md`, and `packages/plugin` (via `deno doc` + source). Citations are
repo paths (line numbers per baseline `290e68ef`… = `290c68ef` origin/main).

**Scope note / naming mapping.** Doctrine does not model deploy as a *plugin* family — it models
it as **Archetype 7 (Deployment Target Adapter)**, a composite folding **Archetype 2** (port/
adapter core) + **Archetype 6** (thin CLI router) (`06-archetypes.md:257-283`,
`ARCHETYPE-7-deploy-target-adapter.md:1-8`). The owner's shape maps onto the existing reference
split (`auth-core` + thin adapters + thin `plugins/auth`, `11-plugin-thinness-and-base-seams.md:49-64`):

- `plugins/deploy` (delivery shell) → **Archetype 5** (thin plugin).
- `deploy-core` → **Archetype 2** integration core owning the port, registry, and every
  convention-bearing primitive.
- `deploy-aws` / `deploy-cloudflare` / `deploy-vercel` → **Archetype 2** thin adapter packages,
  one file-group per technology behind the core's port (mirrors auth-better-auth/auth-kv-oauth/
  auth-workos).
- The 7-op uniform adapter contract and `DeployTargetBaseSchema`-spread config rule bind adapters
  regardless of delivery (`ARCHETYPE-7-…:51-73`). AWS/Cloudflare/Vercel are **new target-axis
  variants** — absent from the current config target map (`packages/config/.../deploy-schema.ts:288-316`
  lists windows/docker/compose/linux/deno-deploy/kubernetes/azure-*/cloud-run only).

Central tension for the plan: doctrine's deploy pattern is A7 (A2 core + A6 router); a plugin
delivery adds A5 on top. Both the A5 thinness law and the A7 core-centralization law converge:
convention lives in `-core`, the delivery shell stays thin.

## 1. Binding axioms (citation → implication for deploy)

1. **A1 public types first; `mod.ts` before classes** (`01-thesis-and-axioms.md:20-24`,
   `02-public-surface.md:31-42`) → author deploy-core's port, 7-op contract type, and base-schema
   config types first, in a README quick-start, before any adapter.
2. **A2/A3 simple over easy; 80% in one chained call** (`01:26-36`) → one entry verb per package
   (`createDeployRuntime`/`registerDeployTarget`); advanced opts via `withX`.
3. **A4 base classes stub-only; no cross-package implementation inheritance** (`01:38-43`,
   `03-base-and-derived-classes.md:28-73`) → adapters never `extends` a core base; flow/port bases
   abstract-only (`03:52-79,209-227`).
4. **A5 composition over inheritance** (`01:46-49`) → **R-DEPLOY-4**: each target config member
   *spreads* `DeployTargetBaseSchema`; no per-target config base-class hierarchy
   (`ARCHETYPE-7:71`, `06:311-314`; shipped pattern `deploy-schema.ts:163-173,185-197,227-241,253-260,272-279`).
5. **A7 wrap upstream, don't reinvent** (`01:59-63`) → **R-DEPLOY-1**: Aspire adapters delegate to
   `aspire publish`/`aspire deploy`; deno-deploy wraps `deno deploy`; AWS/CF/Vercel adapters wrap
   vendor CLI/SDK (`ARCHETYPE-7:68`, `06:305-309`).
6. **A10 composition root over container; constructor injection** (`01:79-82`, `07:14-42`) →
   deploy-core wires via one `createX()` factory with `?? default` collaborators; the plugin's
   service is a composition root handing a declarative description to `createPluginService`
   (`11:246-249`).
7. **A11 name the extension axis; no premature port** (`01:84-88`, `07:83-113`) → **R-DEPLOY-5**:
   port justified because ≥2 adapters foreseeable; "deploy target" is the named axis (`07:96`).
8. **A13 explicit crash boundaries** (`01:96-100`, `08`) → bare-metal activation health-gated,
   paired with `rollback`; cloud `rollback` maps to platform-native mechanism, never a silent
   no-op (`06:319-321`).
9. **A9 one structure per archetype; fold smaller into larger** (`01:73-76`, `06:348-366`).
10. **A14 tests are fitness functions; publish gate = doctrine gate** (`01:102-106`) →
    `deno publish --dry-run`, `deno doc`, `deno task arch:check` per package.
11. **A6/A7 helpers justified; `@std/*` first** (`01:52-63`).
12. **Public-surface budget** (`02:136-138`, F-5): ≤20 exports per `mod.ts` or split subpaths;
    JSDoc + `@example` per export (`02:141-171`). oRPC-bound `-core`/service packages may use
    `--allow-slow-types` (sanctioned exception `02:217-242`).

## 2. Archetype fit

### (a) `plugins/deploy` → ARCHETYPE-5 (plugin)

- Thin userland glue that wires/composes core-owned primitives and re-exports sibling contracts;
  owning a contribution axis is a smell (`ARCHETYPE-5-plugin.md:1-10`, `06:157-214`).
- Folder shape: top-level `mod.ts`, `README.md`, `deno.json`, `verify-plugin.ts`, contribution
  folders (`contracts/`, `services/`, `database/`, `jobs/|sagas/|triggers/`, `streams/`) as
  siblings of `src/` (`06:181-198`; reconciled per `ARCHETYPE-5:46-50`, debt
  `doctrine-06-archetype-5-folder-shape` `arch-debt.md:2118-2135`).
- Design Checkpoint (`ARCHETYPE-5:121-137`): per wired axis, name which core/sibling primitive is
  composed and re-exported (never redefined); slices = reuse-core-contracts → service/runtime
  wiring → verification → host integration.
- Concept of Done (`ARCHETYPE-5:138-147` + parity checklist `11:126-133`): `verify-plugin.ts`
  passes; runtime declarations validated against host loader; DB schema folder correct; contracts
  imported-not-redefined; golden test per scaffold emitter; `plugin doctor` coverage; registered
  `scaffold.runtime` e2e case; contract exercised in-repo with a soundness test. "Thin ≠ thin
  quality budget" (R-PLUGIN-PARITY `11:97-138`).
- Gates (matrix `archetype-gate-matrix.md:20-40`, Arch 5): F-1, F-3, F-5–F-12, F-13-subtype,
  F-14–F-19. Runtime/Aspire validation required; consumer-import validation required (`:63-65`).

### (b) `deploy-core` → ARCHETYPE-2 (integration)

- Wraps external systems behind a package-owned port with ≥1 adapter; port belongs to the package;
  `createX(options)` factory; tech adapters get their own subpath; `./testing` exposes in-memory
  adapters (`ARCHETYPE-2-integration.md:17-22`, `06:41-77`).
- Design Checkpoint (`ARCHETYPE-2:80-93`): name external system, port shape, adapter set,
  composition root, permissions, consumer import impact; slices = port+contract → adapters →
  consumer wiring. Concept of Done (`:94-101`).
- Gates: full universal F-1…F-19 (F-2, F-4 apply, unlike A5). Runtime/Aspire optional (required
  when exercised against a real backend); consumer-import required.
- Home of the 7-op uniform contract, closed-on-key `deploy-target-registry`, centralized
  health-gate/OTEL/secrets/rollback conventions (`ARCHETYPE-7:38-44,70-72`, `06:288-321`);
  R-DEPLOY-3: shared across all targets, never re-implemented per target.

### (c) Per-cloud adapters → ARCHETYPE-2 thin adapters

- "Thin backend adapters — one file group per technology behind the core's backend port"
  (`11:56-58`). Implement the uniform op set; a target implements the subset it supports
  (`ARCHETYPE-7:51-62`). R-DEPLOY-1 + R-DEPLOY-4 bind. AP-11 watch: no premature target-specific
  base class (`ARCHETYPE-7:106-108`).

### Composite ARCHETYPE-7 conformance

- Arch-7 gate column = union of A2 (core) + A6 (router) gates, plus **F-DEPLOY-1** (each
  registered adapter implements the uniform 7-op contract or a declared subset — AST + registry
  scan) and **F-DEPLOY-2** (no target-specific business logic in the command surface; conventions
  in core — import graph + AST) (`archetype-gate-matrix.md:13-16,51-57`, `ARCHETYPE-7:75-86`).
- **F-DEPLOY-* are seeded `reviewed`, not `gated`, until the deployment packages exist**
  (`ARCHETYPE-7:9-16`, `arch-debt.md:2058-2063`).

### CLI router (ARCHETYPE-6) rules if a router surface is added

- R-A6-N5/F-CLI-27 declarative `class XCli extends CliRoot` + single factory; R-A6-N7 `console.*`
  only under `kernel/presentation/output/**`; R-A6-N10 `kernel/extension-points.ts` aggregates
  every Registry; R-A6-N13/F-CLI-1 per-layer LOC caps (`ARCHETYPE-6-cli-tooling.md:136-155`).
  R-DEPLOY-2/F-DEPLOY-2: the deploy router only parses and routes.

## 3. Plugin host contribution kinds (`@netscript/plugin`)

**Closed contribution-axis vocabulary today** (`packages/plugin/src/domain/constants.ts:16-40`,
`CONTRIBUTION_AXES`): `service` · `background-processor` · `stream-topic` · `database-schema` ·
`runtime-config-topic` · `contract-version` · `e2e` · `telemetry` · `migration` · `aspire`.

`PluginContributions` manifest groups (`src/config/domain/plugin-contributions.ts`):
`cli.doctorChecks` (**hard-coded literal union — only `'auth-backend'`**, `:14-18`; a deploy
doctor check requires widening this union in core), `services` (`{name, entrypoint, port?}`),
`backgroundProcessors`, `streamTopics` (`{name, subject}`), `databaseSchemas` (plain `*.prisma`),
`runtimeConfigTopics`, `contractVersions`, `e2e`, `telemetry`, `migrations`, `aspire` (string
module ref).

Builder verbs (`src/config/builders/plugin-builder.ts:74-282`): `withName/withVersion/…` + one
`with*` per axis → `build(): PluginManifest`. Contribution abstracts: stub-only
`PluginContribution` base + per-axis subclasses (`src/abstracts/`).

Plugin categories (`PluginType`, `constants.ts:5-13`): `'background-processor' | 'api' |
'frontend' | 'utility'`. Deploy plugin likely `'utility'` (or `'api'` if it exposes a service).

Installer/protocol manifest (`scaffold.plugin.json`, `src/protocol/manifest.ts`):
`PluginInstallerManifest` (schemaVersion 1, name, version, peerDependencies, capabilities,
scaffolder, optional postScripts/provider/officialSource). `PluginManifestCapabilities` =
`{ hasDatabaseMigrations, hasRoutes, hasBackgroundWorkers, supportsMcpScaffold? }` (`:16-26`) —
**fixed set, no deploy capability flag**. `PluginManifestScaffolder` =
`{ export, requiredPermissions: {net,read,write} }` (`:28-34`). `parsePluginManifest` validates
statically without executing plugin code (`:240-263`).

Host lifecycle surface (subpaths, `packages/plugin/deno.json:5-19`): `./config`, `./abstracts`,
`./contract-base`, `./service`, `./protocol`, `./sdk` (walker/AST/manifest-resolver/
registry-emitter/bootstrap), `./cli` (mount/doctor/registry-emit, `applyScaffoldPlan`,
`runDoctorReport`), `./scaffold`, `./adapter`, `./loader`, `./templates`, `./testing`.
`LIFECYCLE_HOOK_NAMES` = `setup | beforeGenerate | afterGenerate | teardown` (`constants.ts:42-51`).

**Frontend contribution seam — MISSING/PLANNED.** `'frontend'` exists only as a plugin *category*,
not a contribution axis; no frontend abstract or manifest group. Net-new core work would need:
new `ContributionAxis` literal, `FrontendContribution` type, `PluginFrontendContribution`
abstract, `withFrontend` builder verb, a capability flag. (`07:101` names "frontend framework:
fresh (today), future expansion" as an anticipated axis. A parallel seed run `plan/frontend-contrib`
exists on this topic.)

## 4. Plugin thinness doctrine (11) — seam rules

**Law 1 — R-PLUGIN-THIN / core-centralization** (`11:14-64`): every convention-bearing or
by-design-repeating primitive lives in a core `@netscript/*` package; the plugin carries only its
own specifics and re-exports contract types from its `-core` sibling. Promotion test
(`11:255-271`): a primitive stays local only while exactly one plugin consumes it; second consumer
→ promote to core; prefer a subpath/injected port on an existing core over a new top-level
package (`11:265-271`).

What belongs where for deploy:

- `@netscript/plugin` (base): base contract (`/contract-base`) + base service (`/service`) seams;
  a new mandatory route/error/builder step is a `@netscript/plugin` change (`11:273-277`).
- `deploy-core`: the port(s), closed-on-key target registry, 7-op contract, health gating, OTEL,
  secrets, rollback (R-DEPLOY-3). Contract authored here so dependencies run
  `@netscript/plugin` → `deploy-core` → adapters → thin plugin, never cycling (`11:164-169,251-252`).
- Adapters: one file-group per technology; target-specific fields only.
- `plugins/deploy`: declares contributions, wires composition root, ships schema/starter
  resources, selects the active adapter/target, re-exports contract types; `mod.ts` a few lines.

**Law 2 — R-PLUGIN-SEAM** (`11:153-232`): (1) contract spreads `BASE_PLUGIN_CONTRACT_ROUTES`
(mandatory `describe` route wired to `BASE_PLUGIN_ERRORS` + `PluginCapabilitiesSchema`), declared
`satisfies BasePluginContract` (`contract-base/mod.ts:24-35`, `11:193-202`) — a genuine compile
guard; (2) connector service produced through `createPluginService(...)` (fixed builder chain
cors→logger→openapi→docs→database→middleware→context→withRPC→withHealth→withServiceInfo) handed a
data-only description (`service/mod.ts:18-33`, `11:204-211`). Realized structurally
(satisfies/extends + spread), not by a runtime class lattice; no cross-package implementation
inheritance (`11:176-179`).

Anti-patterns (`ARCHETYPE-5:81-102`, `11:66-79`): fat plugin owning conventions (push down);
re-implementing core conventions; engine-coupling counter-example (binding a store to concrete
`Deno.Kv` instead of the shared port — deploy analog: welding an adapter to a vendor SDK instead
of routing shared secrets/state/health through the core port); AP-11 load side effects; AP-14
redefining sibling contracts; AP-22 sub-barrels; AP-23 inline bodies in wiring; AP-24
switch-over-kind; AP-25 `Deno.*`/`console.*`/`fetch` in non-edge plugin files.

Parity checklist = plugin acceptance gate (`11:126-151`); the only accepted casts are the
`as unknown as` contract bridge + the top-router `any`. Closing an issue with unchecked gate
items is a process violation (`11:148-151`).

## 5. Relevant existing debt (`arch-debt.md`) — absorb/retire, don't re-open

- **`DEPLOY-ARCHETYPE-7-CORE-SEED`** (`:2011-2063`) — the anchor. A7 names the law but the core
  package does not exist; deploy lives in `packages/cli/src/public/features/deploy/`, conventions
  in `packages/cli/src/kernel/domain/deploy/` (pure target-agnostic modules with injected ports:
  `secrets-convention.ts`, `rollback-convention.ts`, `health-gate.ts`, `activation-convention.ts`,
  `observability-convention.ts`). Closes when a standalone deploy core owns those + the registry,
  every adapter is 7-op, and F-DEPLOY-1/2 promote `reviewed`→`gated`. **The new `deploy-core` IS
  this extraction.**
- **`DEPLOY-SECRETS-ROLLBACK-CORE`** (`:1804-1837`) — shared secrets/rollback primitives landed in
  the CLI kernel; residual = adapters delegating to them. New adapters delegate, not fork.
- **`DEPLOY-BAREMETAL-PUBLIC-WIRING`** (`:2065-2094`) — 7-op adapter proven with injected fakes
  but not composed onto the public deploy path (registry descriptors constructed with no ports →
  only 6-op subset advertised at runtime). Missing production composition root.
- **`cli-deploy-artifacts-missing`** (`:1344-1374`) — `netscript deploy` first-class for
  bare-metal + deno-deploy; Dockerfile/Compose/K8s generation tracked by the Aspire-compose
  adapter (#343).
- **`DEPLOY-S7-APPHOST-COMPOSE-GEN`** (`:1763-1802`) — Aspire compose-publishing generation
  deferred as a shared cross-slice primitive (Deno resources register as `addExecutable`, not
  containers).
- **`cli-deploy-linux-integration-untested`** (`:1403-1413`, open) — Linux systemd lane not
  integration-exercised against live `systemctl`.
- **`packages/cli` AP-1 / verdict Restructure** (`:756`, Wave 6 "command registry/deploy target
  seams") — A7 core extraction is its downstream continuation; do not duplicate
  (`ARCHETYPE-7:100-102`, `arch-debt.md:2027-2030`).
- **`config-plugin-specific-schema-debt`** (`:915-934`) — `@netscript/config` still owns
  plugin-specific schemas (incl. deploy/runtime surfaces); target = move to
  `@netscript/plugin-*-core/config` subpaths. Bears directly on where deploy config lives.
- Plugin-host debt: `ISSUE-167-STANDALONE-PLUGIN-PROTOCOL` (`:235`), `PLUGIN-USERLAND-SOURCE-COPY`
  (`:29`), `PLUGIN-LIST-MANIFEST-REGISTRATION-BLOCKER` (`:1929`),
  `PLUGIN-RUNTIME-DEPENDENCY-ENTRYPOINT-EXPORTS` (`:1953`), `PLUGIN-RUNTIME-ADAPTER-RELOCATION`
  (`:1868`).

**Shipped config contract** (`deploy-schema.ts`): `DeployTargetBaseSchema` is a plain Zod raw
shape spread by every member (`:21-156`), already carrying R-DEPLOY-3 conventions as sub-blocks —
`activation` (retain + symlink/dir-swap + healthGate), `secrets` (`envFile`, `mode`), `otel`,
`health`, `docker`. AWS/Cloudflare/Vercel absent from the target map (`:288-316`) — new members
spread `deployTargetBaseShape` + vendor fields (follow `DenoDeployTargetSchema:227-241`,
`CloudRunDeployTargetSchema:272-279`).

## 6. Plan-gate essence (PLAN-EVAL pass bar)

Separate session; hard stop; every box checked or `FAIL_PLAN` (`plan-gate.md:1-40`):
research present + re-baselined; decisions locked with rationale; open-decision sweep (any
deferred decision that would force rework → FAIL_PLAN — e.g. the **verb-vocabulary lock**
`build/install/uninstall` vs `up/down` deferred at `06:340-346` must be resolved or proven
rework-safe); commit slices enumerated, ordered, <30, each naming proof + gate + files; risk
register; gate set selected from the matrix; deferred scope explicit; **jsr-audit applied to the
planned public surface** (oRPC-bound contract → sanctioned `--allow-slow-types`, name it).
Plus archetype-selection statement (`archetypes/README.md:39-46`): archetype + justification,
overlays, doctrine verdict, gates, known debt, in-scope AP codes. Two FAIL_PLAN cycles → escalate.

## 7. Fitness functions / anti-patterns most in play

- **AP-24** switch-over-tagged-union instead of registry (`09:166-183`) → typed closed-on-key
  `deploy-target-registry` populated at composition (`07:114-142`, `06:296-298`).
- **AP-4** cross-package implementation inheritance (`09:54-57`).
- **AP-9** premature abstraction / one configurable helper hiding aws/cf/vercel differences —
  prefer clearly-named sibling adapters (`09:79-83`, `ARCHETYPE-2:103-105`).
- **AP-3** god interface — the uniform contract is a closed 7-op set with declared subsets, not an
  accreting optional-method bag (`09:46-52`, `ARCHETYPE-7:51-62`).
- **AP-11/AP-25** module-load side effects / `Deno.*`/`fetch`/`Deno.Command` outside adapter
  edges (`09:90-93,186-195`).
- **AP-13/F-14** `console.log` in published code — status/logs via telemetry port or
  `OutputEvent`, except CLI presentation (`09:99-103,291-293`).
- **AP-1/F-1** monolithic files (CLI `pipeline.ts` at 1,869 LOC is the cautionary example).
- **AP-16/F-11** forbidden generic folders; allowed vocabulary: `application/ adapters/ domain/
  ports/ runtime/ state/ middleware/ presets/ registry/ diagnostics/ presentation/ testing/
  internal/` (`09:113-116,271-274`).
- **AP-14/F-15** no re-export of vendor SDKs (`09:105-107,294-298`).
- **AP-19/F-9** permissions declared per README, matching actual `Deno.*` calls (`09:130-134`).
- **F-DEPLOY-1/2** seeded `reviewed` → flip to `gated` on extraction (`ARCHETYPE-7:75-86`).
- **F-4** inheritance audit; **F-5** surface budget; **F-6/F-7** JSR publishability + doc-score
  (slow types sanctioned only for oRPC-bound `-core`/service); **F-16** folder cardinality ≤12 /
  depth ≤4; **F-3** layering `domain→ports→application→adapters`; **F-17** abstract-derived
  co-location; **F-19** scoped gate runners.
- **R-COMP-DECL** (`07:220-252`) + **R-COMP-EXT-MANIFEST** (`07:254-289`): ≥2 extension axes →
  documented `extension-points.ts` aggregating every Registry.
- Debt discipline (`09:378-395`): unfixable violations need named, owned, time-bounded
  `arch-debt.md` entries.
