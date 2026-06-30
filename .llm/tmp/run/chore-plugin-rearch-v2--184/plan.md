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
`PluginManifest` → delete every local `*PluginManifest`/`*Contribution` interface + the
`as unknown as`/`as *PluginManifest` cast, and delete per-connector `inspect*` — replaced by core
`inspectPlugin(<name>Plugin)`; README + `tests/public/manifest_test.ts` call sites repoint to it
(see **Cast mechanism — Resolution B (LOCKED)**); (b) `aspire.ts` EXTENDS `@netscript/aspire`
`AspireNSPluginContribution`; (c) `verify-plugin.ts` → one-line `verifyPlugin(...,{expectations})`;
(d) READMEs from the core template; (e) connector `contracts/v1` → ONE thin re-export; (f) service
composition via `createPluginService` + `bindPluginContract` (no `router.ts`/`router-context.ts`/
`AnyRouter`); (g) `-core` public subpaths trim to role-named; rename the INTERNAL orchestration
folder `-core/src/runtime/` → `-core/src/application/` (see **Open-decision 3 resolution** for why
this does NOT collide with the retained public `./runtime` subpath).

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
  count. **Explicit delete-set + consumer repoint (verified on the live base):**
  (i) `src/public/mod.ts:67-76` — the `StreamsPluginManifest` interface (extends `PluginManifest`,
  adds `defineTopic`/`defineProducer`/`defineConsumer` pass-throughs) is DELETED; `streamsPlugin`
  (`src/public/mod.ts:137-142`) collapses to the frozen `build()` output typed `PluginManifest` — drop
  the `defineTopic/Producer/Consumer` attachment and the `as StreamsPluginManifest` cast; the three
  `defineStream*` factories STAY as the existing standalone named exports (`src/public/mod.ts:144-147`).
  (ii) Connector `plugins/streams/mod.ts` — DELETE the `StreamsPluginManifest` type re-export.
  (iii) Live consumers repoint to the standalone factories (NOT off the manifest), and dead stream-api
  references are removed: `e2e/probes/probe-context.ts:2` and `tests/public/stream-api_test.ts:3-5`
  must import `defineStreamTopic/Producer/Consumer` from `@netscript/plugin-streams` directly. After
  the deletions, grep `StreamsPluginManifest` MUST return zero hits — that is the slice's no-dangling
  gate.
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
5. **S-conform-triggers** — **BLOCKED until #181 lands on `main`.** Hard gate before this slice
   starts: (1) confirm PR #192 (#181) is MERGED to `main`; (2) `git fetch origin main` then rebase the
   `plugin-rearch-v2` worktree onto post-#181 `main`; (3) re-run `deno doc` on
   `@netscript/plugin-triggers-core` + `plugins/triggers/contracts/v1` and diff the route set against
   this plan — the 6 previously-deferred routes MUST now be present and backed; (4) only then conform.
   Do NOT remove the now-backed routes (the synthesis "A11-remove 6 routes" instruction is VOID).
   The 4 hot shared files (`-core` contract, ingress port, processor, connector `v1`) are owned by
   #181 until merge — touching them pre-merge would collide; this slice reads them as fixed inputs.
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
- **#181 sequencing** — HARD BLOCK: #184 `S-conform-triggers` does not start until PR #192 (#181)
  is merged to `main`; the worktree rebases onto post-#181 `main` and re-verifies the backed route
  set via `deno doc` before conforming (see Slice 5 gate). #184 triggers-conform never touches the
  6 now-backed routes. All OTHER #184 slices (S-core-1, S9, S-conform-{workers,sagas,streams,auth},
  S-verify) are independent of #181 and may proceed; only the triggers-conform slice is gated.

## Gates (each slice + the whole)
`deno task arch:check` (layering + thinness over `@netscript/plugin` + 5 plugins) · scoped
`run-deno-check`/`run-deno-lint`/`run-deno-fmt --ext ts,tsx` (2-cast budget; NO `any`; no new
`as unknown as` beyond the sanctioned centralized-contract cast — the `AnyRouter` boundary should
VANISH once `createPluginService` owns annotated assembly) · `deno task publish:dry-run` per package ·
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` · **`e2e-cli-prod` (HARD)**
JSR-installed `scaffold.runtime --source jsr` green (never accept red as drift — user mandate) ·
byte-identical generated-output guard at every scaffold-touching step.

## Cast mechanism — Resolution B (LOCKED, finding e)

The plan eliminates the third unsanctioned cast (`as unknown as *PluginManifest`) by **Resolution B**,
not A. Resolution B is chosen because it is the only one consistent with the unification thesis
(centralize inspection in core, delete per-connector duplication) and because a live-base grep proves
the per-connector narrow type has no consumer that survives the slice:

- **B (LOCKED):** `definePlugin().build()` is annotated to return `PluginManifest` (explicit return
  type, isolatedDeclarations-safe — no slow type). Each connector's `<name>Plugin` const becomes
  `PluginManifest` (inferred from `build()`), so the `as unknown as`/`as *PluginManifest` cast is
  deleted. The local `*PluginManifest`/`*Contribution` interfaces are deleted. The per-connector
  `inspect*` function (the ONLY consumer of the narrow type, verified by grep — e.g. workers:
  `src/public/mod.ts:106,244-245,249`, re-exported at `mod.ts:13`; consumed only by README +
  `tests/public/manifest_test.ts`) is deleted and replaced by core `inspectPlugin(<name>Plugin)`;
  README examples and the manifest test repoint to `inspectPlugin`.
- **Why not A:** Resolution A (keep the interfaces, type `build()` as
  `Pick<PluginManifest,'name'|'version'|'dependencies'|'contributions'>`) preserves narrowing the slice
  no longer needs and leaves the per-connector `*PluginManifest` duplication the re-architecture exists
  to delete. The evaluator's objection to B — "typed `inspectWorkers(manifest: WorkersPluginManifest)`
  breaks" — is VOID under B because `inspect*` is deleted, not retyped; its single call shape
  (`inspect<Name>()` with no arg in README/test) is served by `inspectPlugin(<name>Plugin)`.
- **No-dangling gate (per connector):** after the slice, `grep '<Name>PluginManifest'` returns zero
  hits and `grep 'inspect<Name>'` returns zero hits. Surviving sanctioned cast budget = exactly the
  one centralized-contract `as unknown as` in each `-core` contract; no new `any`; the `AnyRouter`
  cast VANISHES once `createPluginService` owns annotated router assembly.

## Open-decision 3 resolution — `runtime/` rename vs `./runtime` subpath

There is no collision: the INTERNAL folder rename and the PUBLIC subpath are different things.
- The orchestration folder `-core/src/runtime/` (engines, schedulers, composition roots) renames to
  `-core/src/application/` and becomes **internal-only** (reachable through `.`, never its own public
  subpath). This is the layering correction (orchestration belongs in `application/`).
- The PUBLIC `./runtime` subpath — retained ONLY where a real external consumer needs it (workers'
  direct-start path) — maps to the **runtime-launch binding in `presentation/`** (the per-plugin bind
  to `@netscript/plugin/protocol`), NOT to the renamed orchestration folder. It is a thin presentation
  entrypoint, not the engine internals.
- Net: `application/` (internal) and the `./runtime` public subpath (presentation runtime-launch)
  coexist. Plan line referencing workers' trimmed subpaths (`. ./contracts/v1 ./runtime ./testing`)
  is correct under this reading; `./runtime` there is the runtime-launch entrypoint. Where no external
  consumer needs direct-start, `./runtime` is dropped entirely.

## Risk register

| # | Risk | Likelihood | Impact | Mitigation / owning slice |
|---|------|-----------|--------|----------------------------|
| R1 | #181 not merged when #184 reaches triggers-conform → 4-hot-file collision or removing now-backed routes | Med | High | S-conform-triggers HARD BLOCK + rebase-onto-main + `deno doc` route re-verify (Slice 5 gate); all other slices proceed independently |
| R2 | Resolution-B `build()→PluginManifest` retype surfaces a hidden narrow-type consumer in a connector | Low | Med | Per-connector no-dangling grep gate (`*PluginManifest`/`inspect*` → 0 hits) before commit; fall back to retyping that one call site to `PluginManifest`, never reintroduce the interface |
| R3 | `./scaffold` typesafe codegen regresses to string-template emission or leaks plugin internals into userland | Med | High | S9 5-gate bar incl. scaffold.runtime type-check of generated userland + byte-identical-output guard; D2 "AST/factory only" assertion in S9 review |
| R4 | `-core` public-subpath trim makes a subpath private that an external consumer still imports | Low | High | Pre-trim `deno doc` + repo-wide grep of each removed subpath specifier across `apps/`/`plugins/`/`packages/`; retain any subpath with a live external importer; record retained exceptions in S-verify |
| R5 | streams delete-set leaves a dangling `stream-api`/manifest consumer | Low | Med | streams explicit delete-set + `grep StreamsPluginManifest → 0` gate (Per-plugin §streams) |
| R6 | `e2e-cli-prod` red after publish while local is green (prod-only scaffold defect) | Med | High | e2e-cli-prod is a HARD gate in §Gates + Acceptance; never accepted as drift; red = fix-forward before close |
| R7 | Greenfield `plugin new` and the 5 conformed plugins drift (output ≠ reference) | Med | Med | byte-identical generated-output guard at every scaffold-touching step; S-verify regenerates dual READMEs byte-identically |
| R8 | `bindPluginContract` `--isolatedDeclarations` mapped-type encapsulation introduces a slow type at the new `./service`/`./scaffold` surface | Low | Med | jsr-audit itemization (below) + `deno publish --dry-run` per package per slice (no NEW slow types) |

## JSR surface itemization (jsr-audit, surface scan)

New / changed public surface and its jsr-audit obligations (each must pass `deno publish --dry-run`
with no new slow types, carry `@module` + symbol docs, and have explicit return types):

- **`@netscript/plugin/scaffold` (NET-NEW subpath)** — `ItemScaffolder`, `defineStub`, the
  registry/runtime-registry generators. Obligations: `@module` doc on the entrypoint; explicit return
  types on every exported factory (isolatedDeclarations-safe); doctest example in module doc; the
  generators must not emit slow types into generated userland; clean file list (no `.stub` test
  fixtures published unless intended). Highest-risk new surface.
- **`@netscript/plugin/service` (CHANGED)** — `createPluginService` now also owns annotated router
  assembly + `bindPluginContract`. Obligations: the assembled-router return type is EXPLICITLY
  annotated (this is what makes the per-connector `AnyRouter` cast vanish) and must be a non-slow type;
  `bindPluginContract(...).handlers(...)` mapped-type result carries an explicit type; symbol docs on
  both new exports.
- **`@netscript/plugin` root — `definePlugin().build(): PluginManifest`** — explicit return type
  annotation (Resolution B); `PluginManifest` + `inspectPlugin` already public, confirm symbol docs.
- **`-core` public-subpath TRIM (workers et al.)** — removing `executor/registry/state/workflow/
  shutdown/abstracts/stores/presets/streams/middleware` as subpaths is a JSR surface REDUCTION (fewer
  entrypoints to doc); each retained role-named subpath (`. ./contracts/v1 ./domain ./ports ./builders
  ./adapters ./testing` + conditional `./runtime`/`./config`/`./telemetry`/`./transports`) keeps its
  `@module` doc. Verify no removed subpath had a live external importer (R4) before trimming.
- **`./templates` core README template** — unchanged surface; byte-deterministic output is the D3
  guard, not a JSR-score item.

All of the above are gated by the existing §Gates `deno task publish:dry-run` per package at every
slice; this section makes the per-symbol obligation explicit so PLAN-EVAL's jsr-audit lens is satisfied
at plan time.

## New debt to record
- `AUTH-BACKEND-ENV-CENTRALIZATION` — deferred breaking sibling-widening sub-wave (Q4).
- (debt-clearing) `.template`-skeleton retirement = the D2 typesafe-codegen slice (Q5).

## Acceptance (issue #191)
`plugin new` emits a conforming both-tier + dual-README plugin that builds/type-checks/runs E2E with
zero legacy constraints; all 5 plugins conform (no convenience barrels, no workaround adapters,
discoverable conventions, role-named files); `arch:check` green across `@netscript/plugin` + 5 plugins;
scoped check/lint/test green; `publish --dry-run` Success; `scaffold.runtime` E2E green AND
`e2e-cli-prod` green.
