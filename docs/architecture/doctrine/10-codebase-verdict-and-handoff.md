# Codebase Verdict and Engineering-Doc Handoff

The doctrine pages above describe the target. This page closes the
loop: it walks the current `packages/*` and `plugins/*`,
labels each one against the doctrine, and tells the next agent — the
one who will write the *authoritative engineering reference* — what
to produce.

## Verdict per package

The verdict is one of:

- **Keep** — current shape is doctrine-aligned; only minor polish.
- **Refactor** — shape is nearly right; specific files need
  splitting or renaming.
- **Restructure** — shape is wrong; needs an archetype-shaped
  reorganization.
- **Rewrite (small)** — package is small enough that rewriting
  inside a doctrine-aligned skeleton is faster than refactoring.
- **Defer** — the package is barely used; verdict pending real use.

Measured 2026-08-12. A row is a top-level directory with a named `deno.json`; nested workspaces are
not separate units. Paths, rather than remembered package names, are the executable denominator.

| Path | Package | Archetype | Verdict | Headline action |
| --- | --- | --- | --- | --- |
| `packages/ai` | `@netscript/ai` | 4 | Keep | Preserve the engine/port/composition split. |
| `packages/aspire` | `@netscript/aspire` | 2 | Keep | Keep SDK-independent contribution ports. |
| `packages/auth-better-auth` | `@netscript/auth-better-auth` | 2 | Keep | Keep provider wiring behind auth-owned ports. |
| `packages/auth-kv-oauth` | `@netscript/auth-kv-oauth` | 2 | Keep | Preserve the KV-backed auth adapter boundary. |
| `packages/auth-workos` | `@netscript/auth-workos` | 2 | Keep | Keep WorkOS-specific behavior in the adapter. |
| `packages/bench` | `@netscript/bench` | 6 | Keep | Keep benchmark execution isolated as tooling. |
| `packages/cli` | `@netscript/cli` | 6 | Keep | Preserve the Archetype-6 kernel/surface split. |
| `packages/config` | `@netscript/config` | 1 | Keep | Keep schemas and project configuration contracts cohesive. |
| `packages/contracts` | `@netscript/contracts` | 1 | Keep | Keep contract primitives free of runtime ownership. |
| `packages/cron` | `@netscript/cron` | 2 | Keep | Preserve the runtime-agnostic scheduling seam. |
| `packages/database` | `@netscript/database` | 2 | Refactor | Finish the adapter/extension file splits without changing its port contract. |
| `packages/fresh` | `@netscript/fresh` | 4 | Keep | Preserve per-concern builders and route contracts. |
| `packages/fresh-ui` | `@netscript/fresh-ui` | 4 | Keep | Keep registry and interactive foundations explicit. |
| `packages/kv` | `@netscript/kv` | 2 | Refactor | Split oversized adapters while preserving the provider-neutral port. |
| `packages/logger` | `@netscript/logger` | 2 | Keep | Preserve structured logging adapters and integrations. |
| `packages/mcp` | `@netscript/mcp` | 2 | Keep | Keep MCP transports behind token-bounded tool contracts. |
| `packages/plugin` | `@netscript/plugin` | 4 | Keep | Preserve manifest, discovery, validation, and host contracts. |
| `packages/plugin-ai-core` | `@netscript/plugin-ai-core` | 1 | Keep | Keep the versioned AI contract surface contract-only. |
| `packages/plugin-auth-core` | `@netscript/plugin-auth-core` | 2 | Keep | Preserve auth contracts, backend ports, and testing seams. |
| `packages/plugin-sagas-core` | `@netscript/plugin-sagas-core` | 3 | Keep | Preserve saga state-machine/runtime ownership. |
| `packages/plugin-streams-core` | `@netscript/plugin-streams-core` | 3 | Keep | Preserve producer, schema, telemetry, and diagnostics seams. |
| `packages/plugin-triggers-core` | `@netscript/plugin-triggers-core` | 3 | Keep | Preserve trigger DSL/runtime ports and adapters. |
| `packages/plugin-workers-core` | `@netscript/plugin-workers-core` | 3 | Refactor | Reduce contract/domain cardinality without moving conventions into the plugin. |
| `packages/prisma-adapter-mysql` | `@netscript/prisma-adapter-mysql` | 2 | Keep | Keep the MySQL implementation behind the database-owned port. |
| `packages/queue` | `@netscript/queue` | 2 | Keep | Preserve the provider-neutral queue abstraction. |
| `packages/runtime-config` | `@netscript/runtime-config` | 3 | Keep | Keep watcher lifecycle and diagnostics explicit. |
| `packages/sdk` | `@netscript/sdk` | 2 | Keep | Preserve discovery/client/cache adapter boundaries. |
| `packages/service` | `@netscript/service` | 4 | Refactor | Finish builder separation while preserving bootstrap/runtime wiring. |
| `packages/telemetry` | `@netscript/telemetry` | 2 | Keep | Preserve the OpenTelemetry adapter subpaths. |
| `packages/watchers` | `@netscript/watchers` | 3 | Keep | Preserve stop semantics and signal propagation. |
| `plugins/ai` | `@netscript/plugin-ai` | 5 | Keep | Remain thin glue over AI and Fresh primitives. |
| `plugins/auth` | `@netscript/plugin-auth` | 5 | Keep | Remain thin glue over auth-core contracts and backends. |
| `plugins/sagas` | `@netscript/plugin-sagas` | 5 | Keep | Keep runtime conventions in `plugin-sagas-core`. |
| `plugins/streams` | `@netscript/plugin-streams` | 5 | Keep | Keep stream conventions in `plugin-streams-core`. |
| `plugins/triggers` | `@netscript/plugin-triggers` | 5 | Refactor | Complete connector thinness without relocating core conventions. |
| `plugins/workers` | `@netscript/plugin-workers` | 5 | Refactor | Complete connector thinness and the jobs/worker contribution split. |

## Provenance for removed rows

Ancestry claims in this repository must not be derived from a shallow clone. Check the checkout
with `git rev-parse --is-shallow-repository`; when it reports `true`, use the GitHub compare API
(`gh api repos/rickylabs/netscript/compare/<base>...<head>`) as the canonical ancestry source.

- `@netscript/triggers` (`packages/triggers`) is absent from every reachable commit. It was
  superseded before this history by `packages/plugin-triggers-core`, recorded in the
  [resolved triggers debt](../../../.llm/harness/debt/arch-debt.md#packagestriggers--doctrine-verdict-restructure).
- `@netscript/workers` (`packages/workers`) is absent from every reachable commit. It was
  superseded before this history by `packages/plugin-workers-core`, recorded in the
  [resolved workers debt](../../../.llm/harness/debt/arch-debt.md#packagesworkers--ap-1--doctrine-verdict-restructure-task-executorts-1287-loc).
- `@netscript/sagas` (`packages/sagas`) is absent from every reachable commit. Its checked-in
  supersession record says the former top-level directory and resolved debt now live entirely in
  `packages/plugin-sagas-core`.
- `@netscript/streams` (`packages/streams`) is absent from every reachable commit. The successor
  `packages/plugin-streams-core` is present in the root tree, but the same `arch-debt.md` probe that
  finds the sagas record finds no top-level streams supersession record; no stronger provenance is
  asserted.
- `@netscript/shared` (`packages/shared`) existed in this repository's reachable history. It was
  added at `0ef13de359b1eb1cdd653ab4400ae57fd19644f6` (2026-06-05) and removed at
  `fd8259b76d8e71ee76eadd56ce94160de004fc32` (`feat(contracts): consolidate shared foundation
  package`). Both commits are canonical ancestors of `main`.
- `plugins/hello-world` is absent from every reachable commit, with no successor and no
  supersession record in `arch-debt.md`.

## Doctrine gate coverage

Both `deno task arch:check` and `deno task arch:check:repo` iterate `discoverDoctrineRoots()` and
therefore gate exactly the 36 paths in the verdict table above. The nested `packages/cli/e2e`
workspace is intentionally outside that set: it is the CLI's end-to-end harness, not a top-level
published doctrine unit. See the corresponding [F-19 exclusion](./09-anti-patterns-and-fitness-functions.md#f-19-scoped-source-gate-runners).

Tracked `@netscript/fresh` restructure debt (2026-07-12): consolidate the public route-contract
documentation surface exposed by the typed implementation boundary. This focused documentation
debt does not reopen the package's current Keep verdict. The closing gate is
`deno task doc:lint --root packages/fresh` returning zero route-entrypoint diagnostics without
restoring compatibility casts or adding scanner allowances.

## Open verdict remediations

The current denominator carries six Refactor rows: `packages/database`, `packages/kv`,
`packages/plugin-workers-core`, `packages/service`, `plugins/triggers`, and `plugins/workers`.
Their implementation belongs to separate slices; this measurement does not perform them.

## What the next engineering reference must contain

The doctrine is a constitution. The next document is the
*engineering reference* — the authoritative implementation manual
that turns each doctrine clause into a concrete recipe. It is the
artifact a contributor reads alongside the doctrine. It must
include:

### 1. Recipe per archetype

For each of the six archetypes, a step-by-step starter:

- exact starter folder tree,
- exact `deno.json` template (name, version, exports, tasks),
- exact `mod.ts` skeleton with placeholder JSDoc,
- exact `README.md` template with the required sections,
- a `npm:`/`jsr:` dependency budget (what is allowed, what isn't),
- a sample fitness-function configuration block.

### 2. Recipe per role folder

For each role folder (`domain/`, `ports/`, `application/`,
`adapters/`, `runtime/`, `state/`, `middleware/`, `presets/`,
`registry/`, `diagnostics/`, `presentation/`, `testing/`,
`internal/`), a one-page recipe:

- what goes in,
- what does *not* go in,
- naming conventions for files inside,
- examples drawn from the in-repo packages.

### 3. Recipe per pattern

For each pattern named in Phase 0:

- composition root (factory)
- typed-token container (when escalated)
- stub-only base class
- thin dispatcher concrete class
- forwarding class for composition over inheritance
- typestate builder
- saga state machine
- supervisor + crash boundary
- error normalizer
- pipeline middleware
- registration over inheritance

…show the canonical TypeScript skeleton, the test skeleton, and the
fitness-function check that protects it.

### 4. Recipe per anti-pattern

For each AP-N in
[`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md):

- example of the violation,
- example of the fix,
- the fitness function that detects it,
- how to enter an `arch-debt.md` entry if the fix is deferred.

### 5. Concrete refactor playbooks

For each top-priority remediation:

- the current file's responsibilities, enumerated,
- the target shape (folder tree, file names, exported types),
- the migration sequence (what to extract first, what to extract
  last),
- the test plan (what semantic tests must remain green),
- the JSR-publish dry-run target.

### 6. Fitness-function source

The `.llm/tools/check-*.ts` scripts named in
[`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md),
implemented and integrated into `deno task arch:check`. The
engineering doc both describes and ships them.

### 7. Architectural debt registry

The `.llm/arch-debt.md` template plus the rules for when an entry
is required, what fields are mandatory, and how entries are closed.

### 8. Review checklist

The combined PR-review checklist drawn from every doctrine page.

### 9. Glossary

The ubiquitous-language glossary of NetScript terms — saga,
trigger, worker, plugin, contract, port, adapter, runtime, gate,
flow, supervisor — defined once, used everywhere.

### 10. Migration roadmap

A phased plan to bring the current repo into doctrine alignment:

- Phase A — establish fitness functions and `arch-debt.md` registry.
- Phase B — apply doctrine to the five top-priority packages above.
- Phase C — propagate to the remaining packages.
- Phase D — open the `@netscript/*` packages for external
  consumption (JSR publish at full doc score, semver discipline,
  release notes).

## Engineering-reference completion plan — 2026-08-12

The reference is produced from real refactors as a reviewed byproduct, not as a parallel writing
project. Section 6 is partially represented by `.llm/tools/fitness/`; section 7 is the live
`.llm/harness/debt/arch-debt.md`. The remaining sections close as follows:

1. Every separate Refactor slice named above contributes the archetype starter, role-folder recipe,
   pattern skeleton, anti-pattern before/after, and package playbook it actually exercised
   (sections 1–5). Examples are accepted only after the slice gates pass; speculative templates are
   not added.
2. Each such PR appends any reusable review question and newly stabilized vocabulary to the combined
   checklist and glossary (sections 8–9). Terms already defined remain links rather than duplicated
   definitions.
3. This measured verdict table is the migration roadmap source (section 10). The table is refreshed
   when a unit lands, moves archetype, or closes a Refactor verdict; historical rows stay in Git,
   not in the live denominator.
4. Architecture-doctrine maintainers review the accumulated reference at the **2026-09-30** rail
   checkpoint. Any section still lacking a gated in-repo exemplar receives a named owner and target
   then; the target for assembling the complete first reference from accepted exemplars is
   **2026-12-31**.

## Stop conditions

The doctrine is *not* permission to halt feature work and
restructure everything. The doctrine binds *new* code immediately
and *existing* code through the migration roadmap. A package may
remain in violation as long as:

- the violation is recorded in `arch-debt.md`,
- a time-bounded plan exists,
- new code added to that package does not deepen the violation.

A package emerges from violation when its file passes the relevant
fitness functions and the `arch-debt.md` entry is removed.

## Definition of done for the doctrine

The doctrine is complete when:

- `deno task arch:check` passes for every package without opt-outs
  except those that match an active `arch-debt.md` entry,
- every package's README declares its archetype and required
  permissions,
- every published package has JSR doc score 100,
- every published package's `deno publish --dry-run` is clean,
- the codebase walk above shows zero "Restructure" or "Rewrite"
  verdicts.

When that bar is met, NetScript packages can ship to JSR as the
public framework they are meant to be, and the doctrine becomes
self-enforcing through the gates rather than reliant on review
discipline.
