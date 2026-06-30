# #184 Plugin RE-ARCHITECTURE v2 — plan.md

Run-id: `chore-plugin-rearch-v2--184`. Base: `alpha.16` (`fc911ba1`). Issue: **#191**. Source of
findings: research.md (Workflow `wf_4d8ee812-f88` synthesis, supervisor base-corrected). PLAN-EVAL
(OpenHands minimax-M3, separate session) is a HARD gate before any implementation slice. Implementation
lane = WSL Codex daemon-attached (Q7 locked). This plan is generator output; it does not self-certify.

> Read research.md first for the BASE-TRUTH correction. In short: on the live alpha.16 base,
> `@netscript/plugin` ALREADY exports `./contract-base` (`BASE_PLUGIN_CONTRACT_ROUTES`), `./service`
> (`createPluginService`), `./adapter` (`createPluginAdapter`), `./protocol` (runtime-launch). The
> ONLY genuinely net-new subpath is `./scaffold`. Conformance is therefore mostly DELETION of
> connector duplication + repointing at existing seams, not net-new seam construction.

## ONE Unified Plugin Architecture

### Three tiers (canonical responsibilities)
1. **`@netscript/plugin` (core / convention home)** — owns EVERY convention-bearing or
   by-design-repeating primitive. Plugins consume; never restate.
2. **`@netscript/plugin-<name>-core` (the engine)** — domain engine for one capability:
   `domain → ports → application → adapters → presentation` + `contracts/v1` extending base. README:
   "the engine lives here."
3. **`plugins/<name>` (the connector)** — implements the `-core` seams into NetScript ONLY: one
   manifest, one thin contract re-export, one composition root handing a route→handler map to the core
   service factory, genuinely-specific adapter/scaffold templates, the Aspire contribution, the Prisma
   schema. README: "thin connector."

### THE CENTRALIZATION SET (canonical home in `@netscript/plugin`)
Each is convention-bearing or repeats across ≥2 plugins. **Most already exist (see research.md table)
— work = consume them + delete connector duplicates.**

- **`./contract-base`** *(EXISTS)* — `BASE_PLUGIN_CONTRACT_ROUTES` (meta fragment: typed
  `describe`/capabilities route + shared error set `NOT_FOUND/VALIDATION_ERROR/INTERNAL` =
  `BASE_PLUGIN_ERRORS`) + `BasePluginContract` TYPE. Each `-core` contract spreads the fragment and
  `satisfies BasePluginContract` (missing coverage = compile error). (D1) Canonical name is
  `BASE_PLUGIN_CONTRACT_ROUTES` — do not reintroduce `BASE_PLUGIN_ROUTES`.
- **`./service` — `createPluginService()`** *(EXISTS)* — composition factory (A5, not inheritance)
  baking infra in the one valid order `withContext → withRPC → withHealth → withServiceInfo`. **NEW
  work here:** make it ALSO own **router assembly** (version-prefix + contract-implementer mounting)
  with an **explicitly-annotated return type** so per-connector `AnyRouter` casts disappear; add a
  **contract-handler binder** `bindPluginContract(contractV1).handlers({...})` encapsulating
  `contract.$context<Ctx>()` + the `Handlers<K>` `--isolatedDeclarations` mapped-type dance (kills the
  per-connector `router-context.ts`/`v1-types.ts`/`v1-handlers.ts`/`v1-helpers.ts` split). It already
  bakes the direct-start bootstrap loader, the raw-ingress/null-object "unavailable context"/
  failure→HTTP-status proxy helper, the error-map→handler-error factory, appsettings-casing-tolerant
  context helper, and request-context AsyncLocalStorage — confirm and consume, don't re-add.
- **`./cli`** *(EXISTS — `PluginCli`)* — ADD a base-meta command group (`status/health/info`) so
  connectors ship zero not-implemented stubs; ADD generic argv `normalize/parse` helpers; ADD the
  generated-project-registry loader (`findProjectRoot` + generated-path resolution + `isDefinition`
  guard), generic over definition kind. Connector contributes only declarative command descriptors +
  its concrete backend impl.
- **`./scaffold`** *(NET-NEW — the one genuinely missing subpath, D2)* — typesafe codegen: the
  `ItemScaffolder` framework + `defineStub` + the registry/runtime-registry GENERATORS, importing the
  installed plugin + core and emitting ONLY userland glue via AST/typed factory — NEVER string
  templates. Retires `packages/plugin/src/templates/skeleton/*.template` (Q5). Default `kind:'proxy'`
  archetype = ZERO `starterResources` (a proxy connector physically cannot fabricate a feature
  scaffolder).
- **`./adapter` — `createPluginAdapter(plugin).toCli()/.toScaffold()`** *(EXISTS)* — `NetScriptPlugin`
  descriptor framework (install/doctor/info/update/remove + resource runner).
- **Manifest types + `definePlugin().build()` return** *(types EXIST; `inspectPlugin` EXISTS)* — the
  remaining work is **tightening `definePlugin().build()` to return `PluginManifest`** so every
  connector deletes its hand-authored `*PluginManifest`/`*Contribution` interfaces, local `inspect*`,
  AND its `as unknown as *PluginManifest` cast (removes the third, unsanctioned cast across
  workers/sagas/triggers/auth).
- **`verifyPlugin` + `runPluginVerificationCli`** *(EXISTS)* — connector keeps `verify-plugin.ts` as a
  one-line `verifyPlugin(plugin, { expectations })` wrapper with an INDEPENDENT expectations literal
  (NOT manifest-self-derived — that is tautological).
- **`@netscript/aspire` — `AspireNSPluginContribution` base + builder/resource/spec types** *(EXISTS)*
  — connectors' `aspire.ts` EXTENDS that base + supplies only literals. Do NOT invent a
  `@netscript/plugin` aspire-contract; do NOT duplicate the surface.
- **`@netscript/kv` — `WatchableKv` guard/assertion** — kills the per-connector `isWatchableKv`
  duck-type.
- **`./templates` — core-owned README template (both tiers)** *(EXISTS)* — both role READMEs derive
  from it; byte-deterministic (D3 guard).

### What stays in `-core` (the engine), with enforced layering
`domain/` (pure entities/value types) → `ports/` (seams) → **`application/`** (rename target for the
orchestration currently in `runtime/`: engines, schedulers, composition roots, runtime-launch
bindings) → `adapters/` (concrete infra: stores, executors, transports, telemetry recorders, durable-
stream server producer) → `presentation/` (middleware; the per-plugin runtime-launch binding to
`@netscript/plugin/protocol`). Plus `contracts/v1/` (authoritative oRPC contract extending base) and
`testing/`. **`-core` public surface TRIMS to role-named subpaths only**:
`. ./contracts/v1 ./domain ./ports ./builders ./adapters ./testing` (+ `./runtime`/`./config`/
`./telemetry`/`./transports` only where a real external consumer needs them). STOP exporting
`executor/registry/state/workflow/shutdown/abstracts/stores/presets/streams/middleware` as public JSR
subpaths — implementation behind `.`. Both tiers move in lockstep.

### Canonical files (one reason each)
**Connector `plugins/<name>/`:** `mod.ts` (built manifest value, inferred `PluginManifest` type +
`<NAME>_*` constants only — no local types/cast/pass-throughs); `contracts/v1.ts` (ONE line:
`export * from "@netscript/plugin-<name>-core/contracts/v1"`); `services/src/main.ts` (composition
root: `createPluginService(bindPluginContract(contractV1).handlers(handlers), { rawRoutes? }).serve()`
— no `@orpc/server`/`os`, no `router.ts`, no `AnyRouter`, no bootstrap loader); `services/src/
handlers.ts` (feature-route bodies + describe doc + domain mappers); `services/src/context.ts`
(plugin-specific context fields only); `adapter.ts` (`NetScriptPlugin` descriptor); `scaffolding/`
(specific userland-glue `ItemScaffolder`(s) + `.stub` typed sources); `aspire.ts` (class extends
`AspireNSPluginContribution` + literals); `cli.ts`/`scaffold.ts` (one-line `createPluginAdapter`
entrypoints — keep only loader/marketplace-required slots); `database/<name>.prisma`,
`scaffold.plugin.json`, `scaffold.runtime.json`, `deno.json`, `package.json`, `README.md`,
`verify-plugin.ts` (one-line wrapper).
**Core `packages/plugin-<name>-core/`:** `mod.ts` (curated thin root, re-export REAL builder types
directly; no hand-mirrored interfaces, no `as unknown as`); `src/{domain,ports,application,adapters,
presentation}/`; `src/contracts/v1/<name>.contract.ts` (+`mod.ts`) extends `BasePluginContract`,
spreads base fragment, merged error map, single sanctioned centralized-contract cast; `src/testing/`;
`README.md` ("the engine lives here", documents optional `--with-adapter` 3-tier, never pre-scaffolds).

## GREENFIELD `netscript plugin new <name>` output contract (built FIRST, the reference)

Emits BOTH tiers as ONE compiling/green/publishable vertical slice via `@netscript/plugin/scaffold`
typesafe codegen (replaces the `.template` skeleton). It is the LIVING reference — every existing
plugin must equal its output.

**TIER 1 `packages/plugin-<name>-core/`:** `deno.json` (`exports: {".","./contracts/v1","./domain",
"./ports","./testing"}`, version lockstep); `mod.ts` (re-export `define<Name>` builder + key domain
types, REAL types no casts); `README.md` (core template + `--with-adapter` doc); `src/domain/mod.ts`
(one sample entity + shared-error vocabulary import); `src/ports/mod.ts` (one port = the seam);
`src/application/mod.ts` (one use-case composing the port + runtime-launch binding);
`src/contracts/v1/<name>.contract.ts` (extends `BasePluginContract`, spreads
`BASE_PLUGIN_CONTRACT_ROUTES`, shared errors + ONE typed describe + ONE sample feature route) + `mod.ts`;
`src/testing/mod.ts` (in-memory port double); `tests/contracts/<name>-contract-soundness_test.ts`.

**TIER 2 `plugins/<name>/`:** `deno.json` (`exports: {".","./contracts","./services","./aspire",
"./cli","./scaffold"}`, version lockstep); `mod.ts` (`export { <name>Plugin }` built manifest +
`<NAME>_*` only); `README.md` (connector template); `contracts/v1.ts` (one-line re-export);
`scaffold.plugin.json` (`capabilities.hasRoutes:true` feature / `false` proxy); `scaffold.runtime.json`;
`database/<name>.prisma`; `cli.ts`/`scaffold.ts` (`createPluginAdapter(...).toCli()/.toScaffold()`);
`verify-plugin.ts` (one-line wrapper); `adapter.ts` (`NetScriptPlugin` descriptor); `aspire.ts`
(extends `AspireNSPluginContribution` + literals); `scaffolding/<name>-scaffolder.ts`+`<name>.stub.ts`
(ONE typesafe userland-glue scaffolder); `services/src/{main.ts,handlers.ts,context.ts}`.

**README template (both tiers, from `@netscript/plugin/templates`):** connector README = "thin
connector — implements `<name>-core` seams", install cmd, contributions table, public subpaths, link
to core; core README = "the engine lives here", `domain/ports/application` map, `contracts/v1` surface,
optional `--with-adapter` topology (documented not scaffolded), doctest-safe builder examples. Both are
JSR landing pages; regeneration is byte-identical (D3 guard).

**Workspace/lockstep:** adds both tiers to root workspace member list + import map; versions identical,
stamped from the release channel (not a literal); both `satisfies` the base contract/service seam at
compile time.

**Generator's own merge gate (a fresh `<name>` passes with NO hand edits):** (1) `deno task
arch:check`; (2) scoped `run-deno-check`/`run-deno-lint`/`run-deno-fmt --ext ts,tsx` over both roots
(green, 2-cast budget, no `any`); (3) `deno task publish:dry-run` both tiers; (4) `deno task e2e:cli
run scaffold.runtime --cleanup` (scaffolds, registers, type-checks generated userland, boots under
Aspire — proves D2 emits compiling userland glue, no plugin-source leak); (5) byte-identical-output
guard (re-run yields identical tree).

## Per-plugin conformance — see research.md for the confirmed-smell detail

Cross-cutting deltas applied to ALL 5 (state once): (a) `definePlugin().build()` returns
`PluginManifest` → delete every local `*PluginManifest`/`*Contribution`/`inspect*` + the
`as unknown as` cast; (b) `aspire.ts` EXTENDS `@netscript/aspire` `AspireNSPluginContribution`;
(c) `verify-plugin.ts` → one-line `verifyPlugin(...,{expectations})`; (d) READMEs from the core
template; (e) connector `contracts/v1` → ONE thin re-export; (f) service composition via
`createPluginService` + `bindPluginContract` (no `router.ts`/`router-context.ts`/`AnyRouter`);
(g) `-core` public subpaths trim to role-named; rename `-core/src/runtime/` orchestration →
`application/`.

- **workers** (Decision C; biggest lift): engine `worker/` → `-core/application/`; `service-runtime.ts`
  → `-core/application`; `bin/*` orchestration → `-core/presentation` bound to `./protocol` (bin/ = 4
  one-line shims); CLI codegen → `./scaffold`, command shells → `./cli`; drop `./worker` subpath;
  re-point install `wiringEntry` to the `-core` engine; replace hand-mirrored builder types in
  `src/public/root.ts` with direct re-export (removes 6 casts); trim 17 subpaths → `. ./contracts/v1
  ./runtime ./testing`. Seam is already right — failure is THINNESS.
- **sagas** (Decision C+B): RECONCILE BASE FIRST (6 "missing" files exist; no store inversion). Then
  kill `runtime/mod.ts` barrel; durable runtime/runner/supervisor → `-core/application/durable`;
  `HttpSagaPublisher` → `-core/adapters/publisher`; CLI/codemod/registry-generator → centralize;
  delete `saga-registry.ts` KV side-store. KEEP connector `streams/{producer,factory}.ts`.
- **triggers** (Decision C + one raw HMAC route): manifest types/downcast → `PluginManifest`; kill
  `runtime/mod.ts` barrel; CLI codegen → core; remove embedded-streams' 2 casts; Aspire base; keep ONE
  `rawRoutes` HMAC route. **CONTRACT: do NOT remove the 6 deferred routes — #181 backs them first
  (see Coordination). Move orphan scaffold samples into the core scaffolder (do not plain-delete —
  `scaffold.runtime.json` references them).**
- **streams** (Decision A — proxy, NO served contract): DELETE fabricated scaffolder + dead stream-api
  + CLI + type pass-throughs + local manifest types. Do NOT add `contracts/v1`; base-meta is
  factory-supplied to the `serveRpc:false` proxy. KEEP `main.ts` (CORS/upstream/proxy specific). Fix
  `capabilities.hasRoutes:false`; single-source port 4437. Match workers' STRUCTURE, not its route
  count.
- **auth** (Decision C — reference, thinnest engine): DELETE bespoke health router; fold
  router/v1/types/helpers into the binder; doctor `/auth/health`→`/health` in lockstep; thin
  `backend-registry.ts` to `resolveActiveBackendName` (per-backend env construction → siblings via
  Q4-deferred sub-wave); remove manifest types/`inspectAuth`/precision-downgrade annotation; re-export
  core stream schema. KEEP `./adapter-cli` (marketplace #167). Contract is EXEMPLARY — preserve; `-core`
  root barrel trim is OPTIONAL.

## Slice ordering (greenfield FIRST, then conform) — folds Unified #164/#166/#167-task/#168

1. **S-core-1** — confirm/extend the centralization set in `@netscript/plugin`: `./service` annotated
   router assembly + `bindPluginContract` binder; tighten `definePlugin().build()` return; `./cli`
   base-meta + argv + registry-loader; **build `./scaffold` typesafe codegen (net-new)**; confirm
   `./adapter`, `./contract-base`, README template; `@netscript/aspire` base consumption; `@netscript/kv`
   `WatchableKv` guard. (Per-symbol verification on the live base is part of this slice.)
2. **S9 — GREENFIELD `netscript plugin new <name>` FIRST** — emits the dual-tier vertical slice from
   S-core-1 primitives; must pass ALL 5 generator gates with zero hand edits. Executable reference +
   E2E proof before any conformance churn. Retires the `.template` skeleton (Q5). (Unified #168.)
3. **S-conform-workers** (reference; biggest lift).
4. **S-conform-sagas** (reconcile base first).
5. **S-conform-triggers** (AFTER #181 lands; do NOT remove the backed routes).
6. **S-conform-streams** (proxy; deletions; no contracts/v1).
7. **S-conform-auth** (+ the Q4-deferred sibling-widening sub-wave, separately gated).
8. **S-verify/finalize** (Unified #164/#166/#167-task): full `arch:check` + dead-code sweep + dual
   READMEs regenerated byte-identically + `netscript plugin verify` author-grade doctor + `e2e-cli-prod`.

## Locked decisions (defaults; PLAN-EVAL may challenge)
- **D-base** — implementation base = alpha.16 `plugin-rearch-v2`; nearly all seams exist; conformance
  is mostly deletion + repointing + building `./scaffold`. The synthesizer's alpha.5 alarm is void.
- **Q4 = DEFER** auth sibling-widening to a separately-gated breaking sub-wave (debt
  `AUTH-BACKEND-ENV-CENTRALIZATION`).
- **Q5 = YES** `plugin new` supersedes + deletes the `.template` skeleton.
- **Q6 = connector-private** stream client; schema single-sourced in `-core`.
- **Q7 = WSL Codex** implements; OpenHands evaluates (PLAN-EVAL minimax-M3 / IMPL-EVAL qwen3.7-max).
- **#181 sequencing** — #181 lands first; #184 triggers-conform does not touch the backed routes.

## Gates (each slice + the whole)
`deno task arch:check` (layering + thinness over `@netscript/plugin` + 5 plugins) · scoped
`run-deno-check`/`run-deno-lint`/`run-deno-fmt --ext ts,tsx` (2-cast budget; NO `any`; no new
`as unknown as` beyond the sanctioned centralized-contract cast — the `AnyRouter` boundary should
VANISH once `createPluginService` owns annotated assembly) · `deno task publish:dry-run` per package ·
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` · **`e2e-cli-prod` (HARD)**
JSR-installed `scaffold.runtime --source jsr` green (never accept red as drift — user mandate) ·
byte-identical generated-output guard at every scaffold-touching step.

## New debt to record
- `AUTH-BACKEND-ENV-CENTRALIZATION` — deferred breaking sibling-widening sub-wave (Q4).
- (debt-clearing) `.template`-skeleton retirement = the D2 typesafe-codegen slice (Q5).

## Acceptance (issue #191)
`plugin new` emits a conforming both-tier + dual-README plugin that builds/type-checks/runs E2E with
zero legacy constraints; all 5 plugins conform (no convenience barrels, no workaround adapters,
discoverable conventions, role-named files); `arch:check` green across `@netscript/plugin` + 5 plugins;
scoped check/lint/test green; `publish --dry-run` Success; `scaffold.runtime` E2E green AND
`e2e-cli-prod` green.
