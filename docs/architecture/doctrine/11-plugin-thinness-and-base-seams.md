# 11. Plugin Thinness and Base Seams

Axioms governed: A9, A10, A11 (and, for the seam, A4, A5).

A plugin is a delivery vehicle, not a home for architecture. Everything a plugin does that another
plugin will also do — a contract shape, an error vocabulary, a store port, a service surface, a set
of schemas — belongs in a core `@netscript/*` package, and the plugin keeps only what is genuinely
its own. Two laws make this precise and checkable. The first governs _where capability lives_
(thinness and core-centralization). The second governs _how a plugin's public surface stays uniform
and type-sound_ (the base-contract and base-service seams). Both are already enforced informally
across the workspace; this chapter ratifies them into doctrine and binds them to the existing axioms
and fitness functions.

## Law 1 — Plugin Thinness / Core-Centralization (R-PLUGIN-THIN)

> Every convention-bearing or by-design-repeating primitive lives in a core `@netscript/*` package.
> A plugin carries only its own specifics. A capability earns its own core package once its
> consumers exceed one plugin; until then it is a subpath or an injected port on an existing core.

### The rule

A first-party plugin under `plugins/*` (Archetype 5) is thin by construction:

- It **declares** contributions, wires a composition root, and names its own specifics.
- It **imports** every shared convention — contract base, error map, capabilities schema, store
  ports, config schemas, telemetry, service builder — from a core package. It does not redeclare
  them.
- It **re-exports** contract types from its `-core` sibling rather than defining them (Archetype 5
  doctrine, §_Plugin Package_).

A primitive is "convention-bearing" when its shape is a decision the framework makes _for_ every
plugin (how errors are reported, what a capabilities document looks like, how a KV store is opened,
how a service is mounted). A primitive is "by-design-repeating" when two or more plugins will
legitimately need the same shape. Either property forces the primitive into a core package. The
plugin that first needs it is not entitled to own it.

### The rationale

Convention that lives in a plugin fragments the moment a second plugin needs the same thing. The
second plugin either copies it (drift) or reaches across a plugin boundary to import it (a cyclic,
inverted dependency — a plugin depending on another plugin's internals). Centralization keeps the
convention in one audited place, keeps the published surface coherent for a JSR consumer, and keeps
each plugin small enough that a reviewer can read it top to bottom. This is A9 applied to plugins
(the plugin archetype is the _smallest_ shape, not a second framework), A11 applied to shared
mechanism (name the axis, then lift it into a core), and the Wet-Codebase discipline of chapter 09
(AP-9) applied at the package granularity rather than the function granularity.

### The reference — `auth`

The `auth` capability is the reference realization:

- `@netscript/plugin-auth-core` (`packages/plugin-auth-core`, Archetype 2) owns the contracts,
  backend ports, stream schemas, config schemas, telemetry factory, and testing primitives. It is
  the capability's brain.
- `@netscript/auth-better-auth`, `@netscript/auth-kv-oauth`, and `@netscript/auth-workos` are thin
  backend adapters — one file group per technology behind the core's backend port.
- `plugins/auth` (Archetype 5) is the delivery shell: it declares the adapter connector
  (`authAdapterPlugin`), wires a service composition root, ships the Prisma schema contribution and
  starter resources, and selects the single active backend. Its `mod.ts` is a few lines; the
  capability lives in the core and the adapters.

The `-core` naming is the established shape for this split: `plugin-auth-core`,
`plugin-workers-core`, `plugin-sagas-core`, `plugin-triggers-core`, and `plugin-streams-core` each
hold the convention-bearing surface for their capability while the `plugins/*` package stays thin.

### The counter-example — store engine-coupling

The cautionary pattern is a plugin (or a plugin-core) that re-implements a convention instead of
depending on the core that owns it. The historical instance is KV store access in the durable-flow
cores: a store bound directly to a concrete `Deno.Kv` engine rather than routed through the shared
`@netscript/kv` port. When the store speaks the concrete engine, the engine axis (A11) is no longer
named and injectable — it is welded in, so the "memory / kv / postgres" store axis promised by
chapter 07 cannot vary, and every store that repeats the coupling repeats the defect.

`plugin-workers-core` is the good reference: its stores import `KvStore` / adapters from
`@netscript/kv` and take the store as an injected port, so the engine is a composition-time choice.
The sagas and triggers stores are the capability that had to be pulled back onto the same
`@netscript/kv` seam. The doctrine records the shape to avoid: a plugin primitive that hard-binds a
convention the framework already centralizes.

### The gate

Law 1 is enforced by a composite of existing fitness functions plus a dedicated audit:

- **F-15** (upstream / cross-boundary re-export lint) and **AP-14**: a plugin must not become a
  vendor for another plugin's surface; shared surface travels through `@netscript/*` cores.
- **F-3** (layering) and **F-16** (folder cardinality): a plugin that starts accreting `domain/`,
  `ports/`, and adapter fan-out is a core in disguise and has outgrown Archetype 5.
- **F-6** (JSR publishability) and **F-5** (public surface ≤ 20 per `mod.ts`): a thin plugin has a
  small, publishable surface; a bloated one fails the surface budget.
- A **plugin-thinness / core-centralization audit** (an addition to the F-family, declared here and
  implemented in `.llm/tools/`): for each `plugins/*` package, assert it imports its capability's
  contracts and ports from a `-core` sibling rather than redeclaring them, and flag any primitive
  duplicated across two plugins as a promotion candidate (see §_Consequences for new packages_).
  Acknowledged exceptions are recorded in `arch-debt.md`, per chapter 09.

### The corollary — thinness is a layering choice, not a quality-bar exemption (R-PLUGIN-PARITY)

> Thinness fixes _where_ a plugin's convention-bearing logic lives (in its `-core`), not _how much_
> the plugin is tested, hardened, or finished. Every first-party plugin — flagship or not — clears
> the same reference-plugin quality bar as `workers` and `sagas`. "Thin by design" is never a
> license for a thin test surface, an unexercised contract, or a degraded developer experience.

Law 1 moves capability into a core so the plugin stays small. That is a statement about layering and
ownership, and it is easy to misread as a statement about effort — as if a thin plugin were also
entitled to a thin quality budget. It is not. The line the framework draws is between _convention_
(which belongs in `-core`) and _delivery_ (which belongs in the plugin); it is not a line between
"fully finished" plugins and "acceptably incomplete" ones. A thin plugin is a small delivery shell,
held to the full quality bar of every other delivery shell.

Concretely, a plugin being thin does not lower the bar on:

- **Tests and contract soundness.** The plugin's contract — authored in its `-core` under the base
  seam (Law 2) — must be _exercised in-repo_ by a real implementation plus a contract-soundness test
  in the mould of `packages/plugin-workers-core/tests/contracts/*`, carrying only the two accepted
  casts (the contract `as unknown as` bridge and the top-router `any`). A published-but-unexercised
  contract is a parity gap, not a thinness dividend.
- **End-to-end coverage.** The plugin joins the `scaffold.runtime` e2e suite alongside
  `workers` / `sagas` / `triggers` / `streams`: install → generate → type-check → Aspire start →
  smoke the scaffolded surface, with cleanup. A capability that ships without an e2e gate has not
  reached parity, regardless of how little code it carries.
- **Developer experience.** The scaffolders emit typesafe userland glue (never string templates or
  source copies), every emitter is pinned by a golden test, and `plugin doctor` covers the plugin's
  required-config and health paths. Thin delivery still means a first-class DX.

The reference-plugin quality checklist is therefore identical for every `plugins/*` package,
independent of how thin the plugin is internally:

- a `verify-plugin.ts` that runs green (the sibling parity harness, not a lone `manifest_test.ts`);
- a golden test for every scaffold emitter;
- `plugin doctor` coverage for the plugin's required-config and health paths;
- a `scaffold.runtime` e2e case registered in `runtime-gates.ts`;
- the plugin's contract implemented and exercised in-repo, with a contract-soundness test.

A plugin that satisfies Law 1 and Law 2 but misses this checklist is _thin and unfinished_, not
_thin and done_. Flagship status raises the ambition — a flagship plugin is a differentiator and
should meet-or-exceed the reference plugins — but it does not raise the _floor_: the floor is this
same checklist for all of them.

> **#238 / #388 motivation.** This corollary is ratified because the AI capability (`plugins/ai`,
> epic #238, parity slice #388) had been framed as "deliberately thin by design, so the missing
> `verify-plugin.ts`, the absent `scaffold.runtime` case, and the unexercised `aiContractV1` are
> acceptable gaps." Under this law they are not acceptable — they are parity debt on a flagship
> plugin, tracked to closure by #388, and the `plugins/ai` README framing that implied otherwise is
> corrected in step. The law names the standard, not the one plugin that motivated it: it binds
> `plugins/ai` and every future first-party plugin equally.

Process consequence: because this checklist _is_ the plugin's acceptance gate, **closing an issue
whose acceptance criteria still carry unchecked gate items is a process violation** — the same
issue-closure discipline the repo enforces through its close-gate guardrail (#387 / #467). A parity
issue closes when its checklist is green, not when the code merely compiles thin.

## Law 2 — Base-Contract / Base-Service Seam (R-PLUGIN-SEAM)

> A plugin's contract lives in its `-core` package and conforms to a base contract defined in
> `@netscript/plugin`; a plugin's connector service converges onto a base plugin service defined in
> `@netscript/plugin`. The base seams are what keep every plugin's public surface uniform and
> type-sound.

### The rule

Two seams are mandatory and both are owned by `@netscript/plugin`:

1. **Base contract.** The contract seam is published from `@netscript/plugin/contract-base`. Every
   feature plugin's contract carries the mandatory `describe` route from the shared fragment and
   conforms to the base contract type. The contract itself lives in the plugin's `-core` package,
   never in the thin plugin, so the dependency runs plugin → core → `@netscript/plugin` and never
   cycles back.
2. **Base service.** The service seam is published from `@netscript/plugin/service` (the uniform
   service builder) and `@netscript/plugin/abstracts` (the contribution-axis base). Every connector
   service converges onto the base service surface rather than hand-rolling a server, and every
   contribution the plugin declares is a subclass of the contribution base.

"Conforms to" and "converges onto" are the operative verbs. The seam is realized _structurally_, not
by a deep runtime class lattice — consistent with A4 (base is a contract, not shared behavior) and
A5 (composition over inheritance). The base contract is enforced by TypeScript `satisfies` /
interface `extends` and object spread; the base service is enforced by a shared factory and a
stub-only contribution abstract. There is no cross-package implementation inheritance (A4, AP-4).

### The rationale

Uniformity of the plugin surface is a product property: a marketplace consumer, the CLI doctor, and
the SDK all expect every plugin to answer the same `describe` route with the same capabilities
shape, to report the same base errors with the same status codes, and to expose the same health and
service-info endpoints. If each plugin invented its own contract skeleton and its own server
bootstrap, that uniformity would be aspirational and unenforceable. Centralizing the skeleton in a
base seam makes uniformity a compile error to violate. Putting the plugin's own contract in its
`-core` package keeps the seam anti-cyclic: the core depends on `@netscript/plugin`; the thin plugin
depends on the core; nothing depends back down.

### The reference — `auth`

Contract seam. `@netscript/plugin/contract-base` exports the base seam: the frozen
`BASE_PLUGIN_CONTRACT_ROUTES` fragment (the mandatory `describe` route, wired to the shared
`BASE_PLUGIN_ERRORS` map and the `PluginCapabilitiesSchema` output) and the `BasePluginContract`
type it must satisfy. The auth contract lives in the core at
`packages/plugin-auth-core/src/contracts/v1/auth.contract.ts`: its shape interface
`extends BasePluginContract`, and the contract object spreads `...BASE_PLUGIN_CONTRACT_ROUTES` and
layers the plugin-specific routes. Because `describe` is a real oRPC `ContractProcedure` (not a
phantom marker) and the additional-routes index signature is constrained to a real contract router,
`satisfies BasePluginContract` is a genuine guard: a plugin that omits `describe` or returns the
wrong capabilities shape fails to compile.

Service seam. `@netscript/plugin/service` publishes `createPluginService`, which applies the fixed
builder chain (cors → logger → openapi → docs → database → middleware → context → withRPC →
withHealth → withServiceInfo) so every plugin service exposes the same operational surface. The auth
service factory (`plugins/auth/services/src/main.ts`) is a data-only description handed to
`createPluginService(...).serve()`; it does not assemble its own server. The contribution side is
the stub-only abstract pair in `@netscript/plugin/abstracts`: `PluginServiceContribution` extends
the base `PluginContribution` and adds only the service axis's own fields (`name`, `entrypoint`),
matching the stub-only contract rule of chapter 03.

### The counter-example — the phantom-typed base contract

The seam earns its keep against its own prior form. An earlier base contract used a phantom-typed
`describe` marker and an index signature widened to `unknown`, so `satisfies` was decorative:
contracts silently drifted and a plugin's contract had to erase its inferred type before handing it
to `implement()`. That is the anti-pattern the law forbids — a base seam that looks uniform but
enforces nothing. A base contract that does not fail compilation when a plugin violates it is not a
seam; it is documentation pretending to be a type.

### The gate

- **F-4** (inheritance audit): the contribution abstracts are `abstract`, same-package, stub-only,
  and depth ≤ 3; no plugin `extends` a base from another package for implementation.
- **F-6** (JSR publishability, slow-types bar): the base contract and every conforming plugin
  contract carry explicit annotations that survive `--isolatedDeclarations`; a phantom-typed seam
  that erases its type fails here.
- **F-5** (public surface audit): the seam keeps each plugin's exported surface small and uniform.
- A **seam-conformance check** (F-family addition): assert every feature plugin's contract object is
  declared `satisfies BasePluginContract` (or an interface that `extends` it) and that every
  connector service is produced through the base service factory rather than a bespoke server.

## How this composes with the archetypes

The two laws are the plugin-facing reading of the archetype and composition doctrine:

- **Archetype 2 (core / integration)** is where convention lives. A `-core` package owns the
  contracts, ports, schemas, and testing primitives for one capability behind small ports. Law 1
  says the convention belongs here; Law 2 says the plugin's own contract is authored here (so it can
  depend on `@netscript/plugin` without a cycle).
- **Archetype 5 (plugin)** is the thin delivery shell. It declares contributions, ships schema files
  and starter resources, selects the active adapter, and re-exports contract types from its `-core`
  sibling. It never redefines a convention and never grows a `domain/`/`ports/` interior; if it
  does, it has become a core and must be split.
- **The composition-root rule (A10)** governs the plugin's service. The plugin's `createXService`
  factory is a composition root: it resolves collaborators (registry, telemetry, db client) and
  hands a declarative description to the base service factory. No hidden globals, no container —
  constructor/factory injection into `createPluginService`, exactly as chapter 07 prescribes.

Read together: convention flows _down_ (`@netscript/plugin` → `-core` → adapters → thin plugin) and
never sideways or back up. That single-direction rule is what both laws protect.

## Consequences for new packages

When a new capability or a new shared primitive appears, apply the promotion test before creating
anything:

1. **The `consumers > one plugin` test.** A primitive stays local to a single plugin only while
   exactly one plugin consumes it. The moment a second plugin needs the same shape, the primitive is
   promoted into a core package (or an existing core) — it does not get copied and it does not get
   imported across a plugin boundary. One consumer: keep it local. Two or more: centralize it. This
   is A11 (name the axis) plus A9 (a core is the right archetype for shared convention).

2. **Prefer a subpath or an injected port over a new top-level package.** Centralizing does not mean
   a new `@netscript/*` package per primitive. The default is to extend an existing core: a new
   subpath export (as `@netscript/plugin` did with `./contract-base` and `./service`) or a new
   injected port on an existing core (as the KV store axis is a port on `@netscript/kv`). A new
   top-level package is justified only when the capability has its own archetype-2 surface, its own
   lifecycle, and consumers beyond the package that would otherwise host it. Spawning a package for
   a single type is the package-level form of the premature-abstraction anti-pattern (AP-9).

3. **A new base seam is a `@netscript/plugin` change, not a plugin change.** If a convention must be
   uniform across _all_ plugins (a new mandatory route, a new shared error, a new service builder
   step), it belongs in `@netscript/plugin`'s base contract or base service, ships with its
   conformance check, and is adopted by every plugin — never forked into one plugin as a local
   convention.

## Chapter checklist

- [ ] The plugin (`plugins/*`) imports its capability's contracts and ports from a `-core` sibling;
      it does not redeclare convention (R-PLUGIN-THIN).
- [ ] No convention-bearing primitive is duplicated across two plugins or imported across a plugin
      boundary; shared surface lives in a core `@netscript/*` package.
- [ ] Shared store/engine access goes through the owning core port (`@netscript/kv`, …), not a
      concrete engine welded into the plugin.
- [ ] The plugin's contract lives in its `-core` package and is declared
      `satisfies
      BasePluginContract` / `extends BasePluginContract`, spreading
      `BASE_PLUGIN_CONTRACT_ROUTES` (R-PLUGIN-SEAM).
- [ ] The connector service is produced through `@netscript/plugin/service`'s base service factory;
      contributions extend the stub-only `PluginContribution` base.
- [ ] The dependency direction is single: `@netscript/plugin` → `-core` → adapters → thin plugin,
      with no cycle back.
- [ ] New shared primitives passed the `consumers > one plugin` promotion test and were added as a
      subpath / injected port on an existing core unless a full new archetype-2 package was
      warranted.
- [ ] The relevant gates pass: F-3, F-4, F-5, F-6, F-15, F-16, and the plugin-thinness /
      seam-conformance audits, or an `arch-debt.md` entry records the exception.

## Cross-references

- Chapter 03 ([`03-base-and-derived-classes.md`](./03-base-and-derived-classes.md)) — the stub-only
  base-class contract the contribution abstracts and base seams obey (A4, A5).
- Chapter 06 ([`06-archetypes.md`](./06-archetypes.md)) — Archetype 2 (core / integration) and
  Archetype 5 (plugin) that Law 1 maps convention and delivery onto (A9).
- Chapter 07 ([`07-composition-and-extension.md`](./07-composition-and-extension.md)) — composition
  roots, named extension axes, and registration-over-inheritance behind the seams (A10, A11).
- Chapter 09
  ([`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md)) —
  AP-4, AP-9, AP-14 and the fitness functions (F-3, F-4, F-5, F-6, F-15, F-16) that enforce both
  laws.
