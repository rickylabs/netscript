# NetScript Ecosystem v0.0.1-alpha — Public JSR Release Plan

> **Status**: planning artifact for the first public alpha of the NetScript
> framework. Authority: this document defines the wave order, gating, and
> harmonisation rules for **every** `@netscript/*` package + `plugins/*`. It
> is the only document that may declare "this package is ready to publish".
>
> **Reading order:** read this file → `harmonisation/STANDARDS.md` →
> `harmonisation/DOCS-STRUCTURE.md` → `harmonisation/PUBLIC-SURFACE-PATTERNS.md`
> → the `evaluate_<pkg>.md` and `plan_<pkg>.md` for the package you own.

---

## 1. Mission

Land a **publishable, doctrine-aligned, DX-perfect** alpha of every NetScript
package on JSR with synchronised version cadence
`0.0.1-alpha.0 → … → 0.0.1-beta.0 → … → 0.1.0`. Alpha is **not** a code-quality
relaxation — alpha means "we want community feedback before we declare API
stability". Code quality at alpha is the **same bar** as at stable. Imagine
shipping the first cut of Next.js or Angular.

The framework's published surface across 24 packages and 5 plugins must feel
like one coherent product:

- Knowing one package means knowing the shape of all packages.
- Public surface MUST be self-documenting and obvious.
- Beneath the public surface, code MUST be perfectly maintainable, doctrine-
  aligned, and refactor-safe.

This is the foundation of the NetScript ecosystem. We get one chance to land
this without backwards-compatibility debt.

---

## 2. Scope inventory (29 publishable units)

| # | Unit | Archetype | Today's state | Action | Wave |
|---|---|---|---|---|---|
| 1 | `@netscript/shared` | A1 (Small Contract) | Wide grab-bag, 35 slow types | **Rewrite** | 0 |
| 2 | `@netscript/contracts` | A1/A4 hybrid | 30 slow types in DSL | **Refactor + DSL split** | 1 |
| 3 | `@netscript/runtime-config` | A1 | License missing, otherwise clean | **Polish** | 1 |
| 4 | `@netscript/streams` | A1 | Clean dry-run, no README | **Polish + docs** | 1 |
| 5 | `@netscript/config` | A1 | 35 slow types | **Refactor** | 1 |
| 6 | `@netscript/aspire` | A2 (Integration) | 20 slow types | **Refactor** | 2 |
| 7 | `@netscript/cron` | A2 | Clean dry-run | **Polish + docs** | 2 |
| 8 | `@netscript/database` | A2 | 3 slow types | **Refactor** | 2 |
| 9 | `@netscript/queue` | A2 | Clean dry-run | **Polish + docs** | 2 |
| 10 | `@netscript/kv` | A2 | Clean dry-run, large surface | **Polish + docs + adapter contracts** | 2 |
| 11 | `@netscript/prisma-adapter-mysql` | A2 | License + 1 slow type | **Polish** | 2 |
| 12 | `@netscript/logger` | A2 | Clean dry-run | **Polish + docs** | 2 |
| 13 | `@netscript/telemetry` | A2 | Clean dry-run, large surface | **Polish + docs** | 2 |
| 14 | `@netscript/plugin` | A4 (DSL) | 33 slow types, restructure | **Restructure** | 3 |
| 15 | `plugins/hello-world` | A5 (Plugin) | 1 slow type | **Polish** (with @netscript/plugin) | 3 |
| 16 | `@netscript/watchers` | A3 (Runtime) | License missing | **Polish + docs** | 4 |
| 17 | `@netscript/triggers` | A3 | 29 slow types, restructure | **Restructure** | 4 |
| 18 | `plugins/triggers` | A5 | 16 slow types | **Refactor** (grouped with @netscript/triggers) | 4 |
| 19 | `@netscript/workers` | A3 | 50 slow types, restructure | **Restructure** | 4 |
| 20 | `plugins/workers` | A5 | 3 slow types | **Refactor** (grouped with @netscript/workers) | 4 |
| 21 | `@netscript/sagas` | A3 | 13 slow types | **Refactor** | 4 |
| 22 | `plugins/sagas` | A5 | 12 slow types | **Refactor** (grouped with @netscript/sagas) | 4 |
| 23 | `plugins/streams` | A5 | 3 slow types | **Polish** | 4 |
| 24 | `@netscript/sdk` | A4 | 2 slow types | **Refactor** | 5 |
| 25 | `@netscript/service` | A4 | 26 slow types | **Refactor** | 5 |
| 26 | `@netscript/fresh` | A4 | 4 slow types, 11 700 LOC | **Restructure** | 5 |
| 27 | `@netscript/fresh-ui` | A4 | 6 slow types | **Refactor** | 5 |
| 28 | `@netscript/cli` | A6 (CLI/Tooling) | Clean dry-run, quality bar reference | **Polish + docs site source** | 6 |

Total: **24 packages + 5 plugins = 29 publishable units**, all pinned to
`0.0.1-alpha.0` at first publish.

---

## 3. Today's mechanical readiness (audit/readiness/_summary.md)

Run: `deno run -A .llm/tools/fitness/release-readiness.ts --out audit/readiness --include-plugins --no-dry-run`

| Tier | Total fail | Count | Targets |
|---|---:|---:|---|
| **Trivially shippable** | 0 | 1 | aspire (14 warnings, mostly slow-type — close in Wave 2) |
| **License + small slow types** | 1–3 | 8 | streams, queue, sdk, fresh-ui, telemetry, kv, plugin, logger, cron, plugins/{hello-world,streams,triggers} |
| **Medium refactor** | 4–8 | 14 | shared, sagas, contracts, database, prisma-adapter-mysql, service, config, runtime-config, watchers, triggers, fresh, plugins/{sagas,workers} |
| **Heavy refactor / restructure** | 9+ | 5 | cli (false positive — see § 9), workers, plugin, fresh, plugins/triggers |

**Plus**: `deno publish --dry-run` reveals 17/24 packages have slow types blocking publish.
The roll-up of slow-type counts is the **single largest line item** for the
release and is folded into every package plan.

---

## 4. Six-wave release plan

The waves are sequenced by dependency edges and by "highest-leverage
foundation first". A wave does not start until the prior wave has all gates
green and is published.

### Wave 0 — Foundation (`@netscript/shared`)

`@netscript/shared` is the type substrate every other package depends on
(error classes, Result/Either, Zod helpers, contract primitives, inspection
report shape). It must be published first. This is a **rewrite**:

- Remove the legacy `utils/` grab-bag. Split into:
  `domain/errors.ts`, `domain/result.ts`, `domain/inspection.ts`,
  `domain/schemas.ts`, `application/zod-helpers.ts`, `application/contract-primitives.ts`.
- Add explicit return types to every export to clear the 35 slow types.
- Write the enterprise README (§ 6 of STANDARDS).
- Write `docs/` per § 7 of STANDARDS.

Exit: `deno publish --dry-run` clean, all readiness FAILs zero, doctrine
WARNs ≤ 5, README ≥ 150 lines, ≥ 1 doctest of every public symbol.

### Wave 1 — Contracts & schemas (A1 small-contract packages)

After Wave 0:

- `@netscript/runtime-config` — license + README + doctest
- `@netscript/streams` — README + docs + doctest, optionally rename one symbol
- `@netscript/config` — slow-type refactor (35 → 0), DSL → builder split
- `@netscript/contracts` — slow-type refactor (30 → 0), align `defineContract`
  with `definePlugin`, `defineTrigger` shape

Exit: same gates as Wave 0 across all four. These are pure type/schema
packages that everything else depends on.

### Wave 2 — Integration adapters (A2 packages)

In dependency-order:

1. `@netscript/logger` — depends only on `@netscript/shared`
2. `@netscript/telemetry` — depends on `logger`
3. `@netscript/aspire` — depends on `logger`
4. `@netscript/kv` — depends on `shared`, `logger` (large surface; harmonise
   adapter contract testing)
5. `@netscript/database` — depends on `shared`, `logger`, `kv`
6. `@netscript/prisma-adapter-mysql` — depends on `database`
7. `@netscript/queue` — depends on `shared`, `logger`, `telemetry`, `kv`
8. `@netscript/cron` — depends on `shared`, `logger`, `queue`

Each adapter package SHIPS an `./testing` entrypoint exporting the port
contract suite (`runKvContract`, `runQueueContract`, …) so plugin and app
authors can test custom adapters against the canonical contract.

### Wave 3 — Plugin runner (`@netscript/plugin` + `plugins/hello-world`)

`@netscript/plugin` is the runtime that hosts every other plugin. It must be
restructured:

- Move from `interfaces/` → `domain/` (port + manifest types) +
  `runtime/` (registry, lifecycle) + `application/` (loader, validator).
- Eliminate 33 slow types via explicit `PluginDefinition<TName, TConfig, …>`.
- Ship abstract `BasePlugin` class as the canonical extension point
  (see § 7).

`plugins/hello-world` is the canonical plugin example and must be the smallest,
cleanest end-to-end plugin demo in the repo.

Wave 3 ships these two together as a grouped release.

PR #84 compatibility:

- `@netscript/plugin` sits on the plugin platform rewrite boundary. Treat this
  wave as the PR #83 quality bar and dependency slot, but use
  `harmonisation/PR84-COMPATIBILITY.md` as the verdict arbiter if PR #84 lands
  first.
- `@netscript/plugin` is superseded from **Restructure** to **Rewrite** by
  PR #84.
- `plugins/hello-world` is dropped from the alpha wave if PR #84 lands first;
  its quality bar still applies, but implementation moves to the scaffold
  template work owned by PR #84.

### Wave 4 — Runtimes & their plugins (A3 + grouped A5)

Sequenced as **package + plugin** atomic releases:

| Sub-wave | Package | Plugin |
|---|---|---|
| 4.1 | `@netscript/watchers` | (no plugin — used by triggers/workers) |
| 4.2 | `@netscript/triggers` | `plugins/triggers` |
| 4.3 | `@netscript/workers` | `plugins/workers` |
| 4.4 | `@netscript/sagas` | `plugins/sagas` |
| 4.5 | (none) | `plugins/streams` (depends on `@netscript/streams` from Wave 1) |

Sub-waves run sequentially, not in parallel — every runtime is a state
machine (axiom A12) and they share crash-boundary patterns codified in
Wave 4.1.

Each runtime ships an abstract base + default implementation + adapter
contract test suite.

PR #84 compatibility:

- Wave 4 is extended, not invalidated, by PR #84.
- New `@netscript/{workers,sagas,triggers,streams}-core` packages are Wave 4
  extensions owned by PR #84, not missing units from this run.
- The PR #83 quality bar in this plan still governs the runtime families above
  even when PR #84 changes the package shape.
- Follow `release/DEPENDENCY-ORDERING.md` §"Plugin Platform Integration
  (PR #84)" before executing any Wave 4 package + plugin pair.

### Wave 5 — Application surfaces (A4)

After all runtimes are landed:

1. `@netscript/sdk` — composes contracts + plugin into the public app SDK
2. `@netscript/service` — service builder DSL that wires sdk + plugins + runtimes
3. `@netscript/fresh` — Fresh adapter + UI primitives (the 11 700 LOC giant)
4. `@netscript/fresh-ui` — design system layer

`@netscript/fresh` is the largest restructure on the board — it is split into:
`@netscript/fresh` (core adapter), `@netscript/fresh-ui` (already its own pkg).
Routes/handlers in current `fresh` that belong to `service` are migrated.

### Wave 6 — Tooling (`@netscript/cli`)

`@netscript/cli` is shipped last because:
- It must demonstrate **all** other packages working together (it's also our
  documentation site source of truth — see § 8).
- Its scaffold templates must reference the published v0.0.1-alpha.0 of every
  other package, which means they all must be on JSR first.

Exit criteria for Wave 6 close out the alpha:
- `deno install -A jsr:@netscript/cli@0.0.1-alpha.0 --name=netscript` works.
- `netscript init my-app && cd my-app && netscript dev` runs end-to-end.

---

## 5. Cross-cutting harmonisation

These three companion docs are normative for every package plan:

- `harmonisation/STANDARDS.md` — repo-wide naming, deno.json shape, mod.ts
  invariants, README structure, test conventions, observability fields.
  Enforced by `.llm/tools/fitness/check-netscript-standards.ts`.
- `harmonisation/DOCS-STRUCTURE.md` — idiomatic `/docs` semantic + frontmatter
  + auto-generated reference pipeline.
- `harmonisation/PUBLIC-SURFACE-PATTERNS.md` — when to use function family vs
  builder vs class hierarchy vs DSL vs registry; abstract-base-class invariants
  (axiom A4); concrete stub examples per pattern.

Every `plan_<pkg>.md` references these via stable section anchors.

---

## 6. The `cli` quality bar

`@netscript/cli` is the only package today with:
- a clean `deno publish --dry-run`,
- a `docs/` folder with eight pages (`architecture.md`, `commands.md`,
  `jsr-publishing.md`, `library-api.md`, `maintainer-cli.md`,
  `permissions.md`, `public-cli.md`, `scaffolding-primitives.md`,
  `troubleshooting.md`),
- the `src/{public,maintainer,kernel,local}` mode-isolation layout,
- a 12-script fitness gate suite under `.llm/tools/fitness/check-cli-*.ts`.

Every plan in this run is tuned to **converge** on the cli's level of
polish. Where the cli's pattern is unique to its archetype (A6 binary), the
generalisable pieces are codified in `harmonisation/STANDARDS.md`.

The cli is *not* the only package allowed to deviate; it is the package that
proves the bar is reachable.

---

## 7. Public-surface harmonisation rules

Codified in `harmonisation/PUBLIC-SURFACE-PATTERNS.md`. Summary:

- **Default**: function family. Stateless, no extension axes, one chained
  call satisfies the 80% path.
- **Builder**: only when multi-step deferred construction with optional
  steps justifies it (cli, service).
- **Abstract base + concrete default**: only for long-lived runtimes
  (workers, sagas, triggers). Base class is **stub-only** (axiom A4).
- **DSL `define…`**: declarative artefacts that runtime consumes (triggers,
  plugin, contracts).
- **Registry**: dynamic discovery (plugin).

When complexity justifies it, switch from function family → abstract base
class with extension method stubs and protected hooks. The decision criteria
live in PUBLIC-SURFACE-PATTERNS § 5.1.

---

## 8. Idiomatic `/docs` structure (source for the future docs site)

Every package with > 25 public symbols ships a `docs/` folder with the
shape codified in `harmonisation/DOCS-STRUCTURE.md`. The layout is
NextJS/Docusaurus-friendly so the future `netscript.dev` site mirrors the
on-disk tree exactly:

```
docs/
├── README.md
├── architecture.md     (Archetype call-out + ascii diagram)
├── concepts.md
├── getting-started.md
├── recipes/
├── reference/          (auto-generated from `deno doc`)
└── advanced/
```

Each markdown page begins with a frontmatter block consumed by the docs
site generator. The generator is added in Wave 0 as
`.llm/tools/generate-reference.ts`.

---

## 9. Known false positives in the readiness scan

- `packages/cli` reports 1 JSR FAIL (an internal `interface IFoo` finding in a
  legacy maintainer module that is excluded from publish via `publish.exclude`).
  This is an audit-tool blind spot — the dry-run is clean. Fix in Wave 6 by
  scoping `check-doctrine.ts` to `publish.include` only.
- `packages/cli` Standards FAIL count of 1 with 199 warnings is dominated by
  per-file LOC caps that the cli legitimately exceeds in vendored content
  templates. STANDARDS § 1 cardinality cap excludes `kernel/assets/` and
  `local/templates/`; the audit script will gain matching skip rules in Wave 6.

These are the only known false positives. Every other failing finding is real
and tracked in the per-package plan.

---

## 10. Synchronised version cadence

All 29 units march in lockstep:

| Phase | Trigger | Cadence |
|---|---|---|
| `0.0.1-alpha.N` | All units publish-ready | every 2 weeks while gathering community feedback |
| `0.0.1-alpha.N`+ | Critical bug or DX defect found | patch-only `alpha.N` bumps as needed |
| `0.0.1-beta.0` | Community consensus on API surface (channel TBD) | one synchronised cut |
| `0.0.1-beta.N` | Bug fixes only | every 2 weeks until stable |
| `0.1.0` | Beta acknowledged stable | first stable; SemVer guarantees apply |

No package may skip a phase. No package may publish a `0.0.1-alpha.N+1`
without every other package also publishing the same N+1 (even if a no-op
republish). This is the only way to maintain enterprise upgrade integrity.

---

## 11. Monorepo handoff

Once every unit is `0.0.1-alpha.0` ready (all FAIL gates closed), the
repository is forked to a fresh public monorepo:

- `netscript/netscript` (proposed) — public repo
- This repo (`rickylabs/netscript-start`) — archived as the bootstrap
- All `@netscript/*` package paths preserved
- `import_map` rewritten so internal deps resolve to JSR (not relative paths)
- A `release.ts` script (added in Wave 0) will:
  1. Bump every package version atomically
  2. Run `deno publish --dry-run` for every package
  3. Run `release-readiness.ts` for every package
  4. If all green, run `deno publish` for every package in dependency order
  5. Tag the monorepo `v0.0.1-alpha.N`
  6. Push the tag

---

## 12. DX criteria (the alpha quality bar)

Every package — without exception — must satisfy these at v0.0.1-alpha.0:

1. **Public surface is immediately understandable.** No "clever public surface
   hiding the shit beneath". Naming follows STANDARDS § 4. Function-family
   default; class hierarchy only when justified.
2. **Self-documented.** Every export has a JSDoc with `@param`, `@returns`,
   `@example` (where the example is non-trivial). `mod.ts` `@module` block
   embeds the 80% path snippet.
3. **Enterprise-grade README.** All 12 mandated sections (STANDARDS § 6).
4. **Slow-type clean.** `deno publish --dry-run --allow-dirty` succeeds.
5. **Doctrine-aligned.** Archetype declared; layering respected; no forbidden
   folders; no I-prefix; no module-level mutable singletons; abstract bases
   stub-only.
6. **Meaningful tests.** Doctest of README examples, port contract suite per
   port, adapter conformance suite per adapter (STANDARDS § 8).
7. **Observability surface.** Logger fields + OTEL spans + metric names
   match telemetry standard.
8. **Diagnostics.** Every package exports an `inspect<Noun>(target)` returning
   an `InspectionReport`.
9. **Beneath the public surface, perfectly maintainable.** Layering passes
   F-DOCT-* gates. Files under cap. Inheritance ≤ 2 deep. No global mutable
   state.

These nine bullets are the alpha definition of done. Every plan checks
against them.

---

## 13. Per-package artefacts

Every unit listed in § 2 has a paired evaluator + planner doc in this run:

| Wave | Unit | Evaluate | Plan |
|---|---|---|---|
| 0 | shared | `evaluate_shared.md` | `plan_shared.md` |
| 1 | runtime-config | `evaluate_runtime-config.md` | `plan_runtime-config.md` |
| 1 | streams | `evaluate_streams.md` | `plan_streams.md` |
| 1 | config | `evaluate_config.md` | `plan_config.md` |
| 1 | contracts | `evaluate_contracts.md` | `plan_contracts.md` |
| 2 | logger | `evaluate_logger.md` | `plan_logger.md` |
| 2 | telemetry | `evaluate_telemetry.md` | `plan_telemetry.md` |
| 2 | aspire | `evaluate_aspire.md` | `plan_aspire.md` |
| 2 | kv | `evaluate_kv.md` | `plan_kv.md` |
| 2 | database | `evaluate_database.md` | `plan_database.md` |
| 2 | prisma-adapter-mysql | `evaluate_prisma-adapter-mysql.md` | `plan_prisma-adapter-mysql.md` |
| 2 | queue | `evaluate_queue.md` | `plan_queue.md` |
| 2 | cron | `evaluate_cron.md` | `plan_cron.md` |
| 3 | plugin | `evaluate_plugin.md` | `plan_plugin.md` |
| 3 | plugins/hello-world | `evaluate_plugin-hello-world.md` | `plan_plugin-hello-world.md` |
| 4 | watchers | `evaluate_watchers.md` | `plan_watchers.md` |
| 4 | triggers | `evaluate_triggers.md` | `plan_triggers.md` |
| 4 | plugins/triggers | `evaluate_plugin-triggers.md` | `plan_plugin-triggers.md` |
| 4 | workers | `evaluate_workers.md` | `plan_workers.md` |
| 4 | plugins/workers | `evaluate_plugin-workers.md` | `plan_plugin-workers.md` |
| 4 | sagas | `evaluate_sagas.md` | `plan_sagas.md` |
| 4 | plugins/sagas | `evaluate_plugin-sagas.md` | `plan_plugin-sagas.md` |
| 4 | plugins/streams | `evaluate_plugin-streams.md` | `plan_plugin-streams.md` |
| 5 | sdk | `evaluate_sdk.md` | `plan_sdk.md` |
| 5 | service | `evaluate_service.md` | `plan_service.md` |
| 5 | fresh | `evaluate_fresh.md` | `plan_fresh.md` |
| 5 | fresh-ui | `evaluate_fresh-ui.md` | `plan_fresh-ui.md` |
| 6 | cli | `evaluate_cli.md` | `plan_cli.md` |

Per-package supporting data:

- `audit/_summary.json` + `audit/packages__<pkg>.json` — JSR audit
- `audit/dry-run/<pkg>.txt` — raw `deno publish --dry-run` tail
- `audit/readiness/jsr/<pkg>.json` — JSR finding detail
- `audit/readiness/doctrine/<pkg>.json` — doctrine finding detail
- `audit/readiness/standards/<pkg>.json` — standards finding detail
- `audit/readiness/_summary.md` — unified roll-up

Every plan references the audit JSONs by path; no audit data is duplicated
into plans — the readiness JSONs are the source of truth.

---

## 14. Drift register pointers

Active drift entries that materially affect this plan:

- DRIFT-001 — Generator + evaluator running in the same session per user
  direction (harness rule § 7 normally enforces separation). Acknowledged.
- DRIFT-002 — Phase A fitness scripts: `release-readiness.ts` is now Phase B
  capable. The CLI-specific gate scripts remain pending generalisation —
  lifted by the fitness scripts added this pass for non-CLI packages.
- DRIFT-003 — Doctrine vs reality: 17/24 packages need slow-type refactor
  (sized by `audit/JSR-DRY-RUN-MATRIX.md`).
- DRIFT-004 — **Cleared**. The shared package was already `@netscript/shared`;
  earlier eval was wrong.
- DRIFT-005 — Multiple packages today expose single-string `exports` instead
  of an exports map — folded into Wave 0/1 deno.json harmonisation.
- DRIFT-006 — 8 packages have no README — every plan adds the README slice.
- DRIFT-007 — `@netscript/shared` exports `./utils` (a forbidden folder
  name). Folded into the Wave 0 rewrite.

See `drift.md` for full text.

---

## 15. Run completion signal

This plan is complete when:

1. Every `plan_<pkg>.md` declares its target folder tree, public-surface
   stubs, test plan, gate matrix, and slice list against this PLAN.md.
2. `harmonisation/{STANDARDS,DOCS-STRUCTURE,PUBLIC-SURFACE-PATTERNS}.md`
   are landed and referenced from every plan.
3. `audit/readiness/_summary.md` is the single mechanical truth source.
4. Drift entries are reconciled.
5. The evaluator (separate session) runs `release-readiness.ts` against
   every package and verifies the per-plan claims match the JSON output.

The implementation runs that follow this plan are **out of scope** for this
harness run — they will each open their own harness sessions per package and
reference back to this PLAN.md as their plan.md anchor.
