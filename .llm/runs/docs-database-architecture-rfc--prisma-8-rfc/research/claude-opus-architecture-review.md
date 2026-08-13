# Independent Database Architecture Deep Dive — Claude Opus 5 High

Subordinate architecture/research lane for run `docs-database-architecture-rfc--prisma-8-rfc`. This
is **not** PLAN-EVAL. It is an independent report intended to be consumed by the supervisor when
locking the Plan-Gate.

Part 1 of 3. Continuation marker at end of file.

---

## 1. Route identity, evidence provenance, and lane disclosures

### 1.1 Requested versus observed identity

| Field        | Requested (brief)                                      | Observed (this session)                              |
| ------------ | ------------------------------------------------------ | ---------------------------------------------------- |
| Provider     | Anthropic                                              | Anthropic                                            |
| Surface      | Native Claude Code                                     | Native Claude Code CLI, `CLAUDE_CODE_ENTRYPOINT=cli` |
| Model        | Opus 5                                                 | `claude-opus-5`                                      |
| Effort       | high                                                   | `CLAUDE_EFFORT=high`                                 |
| Client build | —                                                      | Claude Code `2.1.231` (`CLAUDE_CODE_EXECPATH`)       |
| Host         | `/home/codex/repos/netscript-db-rfc`                   | same; WSL2 Linux 6.18.33.2, user `codex`             |
| Branch       | `docs/database-architecture-rfc`                       | same                                                 |
| Baseline     | `origin/main@cd720529333328bcba5e1a308ce7632f4350efdf` | same                                                 |

**Session/handle chain.** This lane spanned three process boundaries. The original architecture
session was `3f8a9a69-5589-4b91-9a32-91f7770fe7c2` (`CLAUDE_CODE_CHILD_SESSION=1`, bridge handle
`session_01JusEvesoAn7Jjo2EDPPMcZ`, PID 1944525, job dir `/home/codex/.claude/jobs/3f8a9a69`). It
performed the required reading, the specialist fan-out, and the direct source verification recorded
below, then exited at a bridge boundary immediately after creating the report placeholder. The
resumed session is `f79af5bb-e953-4aae-9585-a1c83e73a00d`, which performed the targeted gap-closing
reads and authored this report. Model and effort are identical across both.

### 1.2 Workflow and sub-agent disclosures

No Claude dynamic **Workflow** was used. The Workflow tool was not invoked at any point in this
lane; CLAUDE.md scopes Claude workflows to a supervisor accelerator and this lane's work was
evidence extraction plus synthesis, which fan-out sub-agents served directly. Delegation used the
`Agent` tool only.

| Identifier          | Role                                                                                                                    | Model              | Status                                          | Consumed?                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `a1dc0e7df5546aa82` | NetScript doctrine, archetype definitions, gate matrix, Plan-Gate text, arch-debt scan, RFC process/template extraction | inherited (Opus 5) | **completed**                                   | **Yes — fully.** Load-bearing for §3 and for every doctrine citation in this report. |
| `a37ac7656406f51bb` | Prisma 8 RC control-plane + runtime + contract-space API signature extraction                                           | inherited (Opus 5) | **lost at process exit; no result returned**    | No                                                                                   |
| `a34be5940cff46313` | Adversarial falsification of the Prisma deep-dive's numeric claims                                                      | inherited (Opus 5) | **lost at process exit; no result returned**    | No                                                                                   |
| `a81f742dd6bc62971` | Adversarial fact-check of the NetScript current-state audit                                                             | inherited (Opus 5) | **lost at process exit; no result returned**    | No                                                                                   |
| `a0529d68dcea25a85` | Relaunch: Prisma RC numeric + seam re-verification                                                                      | Sonnet             | **stopped at process exit; no result returned** | No                                                                                   |
| `a540186ffe4827b0e` | Relaunch: NetScript db CLI/resolver/installer re-verification                                                           | Sonnet             | **stopped at process exit; no result returned** | No                                                                                   |

**Truthful disclosure.** Five of six sub-agents returned nothing. One returned a complete result.
Everything in this report that is marked `[OBSERVED]` was therefore verified either by the completed
doctrine agent or by my own direct reads and greps in this worktree, cited by `path:line`. Claims
that originate only in the committed research documents and that I could **not** re-verify in this
session are explicitly marked `[CARRIED — NOT RE-VERIFIED]`. They must be re-proved before the
canonical RFC cites them; I flag this as a Plan-Gate obligation in Part 3.

### 1.3 Evidence vocabulary used throughout

- `[OBSERVED]` — I read the file or ran the command in this worktree; citation given.
- `[CARRIED — NOT RE-VERIFIED]` — asserted by `research/netscript-current-state.md`,
  `research/prisma-8-deep-dive.md`, or `research/market-analysis.md`; plausible; not independently
  confirmed here.
- `[INFERENCE]` — my reasoning from observed facts.
- `[PROPOSAL]` — my design recommendation.

### 1.4 Precision corrections applied

Per the supervisor's correction, and used consistently from here on: the root catalog pins Prisma at
`^7.8.0`; generated workspace templates encode `^7.4.2`; the generated database workspace currently
emits **30** database tasks (the current-state audit's "more than twenty" understates it). RC-tag
facts (`v8.0.0-rc.1`, `a76a6c5`) are kept strictly separate from post-RC `main` churn (`71e2e0d`)
everywhere in this report; where a claim depends on post-RC main it is labelled as moving, never as
a contract.

---

## 2. Independent verdict and architectural thesis

### 2.1 Verdict

**The direction in the committed research is correct, and its central abstraction is named wrong in
a way that will produce the wrong package if it is carried into the RFC unchanged.**

I agree with the research on the substance: five overlapping subsystems must collapse into one
NetScript-owned model; Prisma 8's contract/control/runtime split is the right shape to integrate
against; contract spaces are the right ownership primitive; engine-as-identity must die; generated
source must stop being textually patched; offline work must stop requiring Aspire. Those conclusions
survive independent scrutiny.

I disagree on three points that change the design:

1. **`DatabaseGraph` is correct as a compile-time intermediate representation and wrong as a runtime
   object.** A "graph" that exists at runtime, that features can reach into to obtain a target, is a
   service locator wearing a domain name. The durable artifact is not a graph — it is a **compiled,
   content-addressed manifest**, which is a _value_: diffable, cacheable, signable, transportable to
   CI, consumable by agents, and comparable across builds. A graph is how you build it, not what you
   ship. Everything the research wants from `DatabaseGraph` — inspection, provenance, digests, agent
   surface, deterministic CI — are properties of a manifest, not of a live object graph.

2. **The plan's archetype set is incomplete and therefore its gate set is under-scoped.** The plan
   names future Archetype 1/2/4/5/6 surfaces. The runtime half of this system owns connection
   lifetime, per-request and per-process scope, graceful close ordering, health/readiness, and
   `AbortSignal` propagation. That is Archetype 3 — "packages that own long-running behavior with
   state, lifecycle, and supervised execution" (`docs/architecture/doctrine/06-archetypes.md:78-83`)
   `[OBSERVED]`. Archetype 3 makes **all** fitness gates F-1 through F-19 required and makes
   **runtime gates required**, not optional (`.llm/harness/gates/archetype-gate-matrix.md:20-65`)
   `[OBSERVED]`. Omitting A3 silently omits a mandatory gate column.

3. **A repo-wide constraint that no research document mentions determines the package boundary.**
   NetScript compiles with `isolatedDeclarations: true` repo-wide (`deno.json` `compilerOptions`)
   `[OBSERVED]`, and doctrine restricts the `--allow-slow-types` carve-out to oRPC-bound packages
   only — `packages/contracts` and plugin `-core`/`services` packages extending the contract base
   classes — with the explicit rule that "any other package that sets `--allow-slow-types` is a
   finding and must carry a debt entry" (`docs/architecture/doctrine/02-public-surface.md:217-242`)
   `[OBSERVED]`. A database package is not covered. Prisma 8's application-facing type is derived by
   inference from the emitted contract. **Therefore no published `@netscript/*` package may export a
   contract-typed runtime value.** This is not a stylistic preference; it is a hard publishability
   constraint that decides where the typed binding lives. I develop the consequence in §3 and §5.

### 2.2 Thesis

> NetScript's durable database asset is a **compiled manifest plus a narrow provider port**, not a
> database abstraction. NetScript owns _identity, composition, ownership, lifecycle, and
> operations_. The provider owns _language, execution, and diffing_. NetScript never abstracts the
> query surface — it delivers a correctly-scoped, lifecycle-owned, target-typed handle and gets out
> of the way.

The single most valuable rule in this design is a refusal: **NetScript does not define a query
API.** Every framework that has tried to sit above an ORM and normalise its query surface has
produced a second, worse ORM with a smaller feature set and a larger bug budget. The research names
this risk ("Replacing manual glue with a larger proprietary abstraction", `plan.md` risk register)
but does not convert it into a structural rule. The structural rule is: the kernel packages contain
**zero query types**. The query surface reaches the application as a generic type parameter that the
application's own generated code supplies. If a future provider replaces Prisma, the kernel does not
change shape; only the generic argument does.

### 2.3 Non-negotiable invariants

These are the properties I would refuse to trade in review. Each is stated so it can be mechanically
checked.

- **I-1 Identity is declared, never derived.** A target's identity is a user-chosen stable key. No
  artifact path, migration lineage, runtime binding, receipt, or output root may be derived from a
  provider or engine name.
- **I-2 One owner per storage object.** Every owned object resolves to exactly one contribution
  space. Overlapping ownership is a compile-time error, not a runtime collision.
- **I-3 Composition is pure.** Compiling a definition into a manifest performs no network, no
  database, no Aspire, and no process spawn. It is a total function from source to
  `Result<Manifest, Diagnostics>`.
- **I-4 Determinism is content-addressed.** The same inputs produce the same manifest digest; every
  emitted artifact root records the digest that produced it; a mismatch is detectable without a
  database.
- **I-5 No generated source is ever textually repaired.** Artifacts are produced from an IR by a
  provider and replaced atomically, or they are not produced.
- **I-6 Nothing reports success from an exit code.** Every operation returns a typed result and a
  receipt with per-target, per-space phase outcomes.
- **I-7 Capability requirements fail early.** A space that needs a capability the target cannot
  provide fails at composition or type-check, never at a late database call.
- **I-8 No published NetScript package re-exports upstream provider types.** Enforced by doctrine
  AP-14 (`09-anti-patterns-and-fitness-functions.md:112-116`) `[OBSERVED]` and by the
  slow-types/`isolatedDeclarations` constraint in §2.1(3).
- **I-9 Cross-target atomicity is never claimed.** Multi-target apply is a resumable saga with
  explicit partial-success reporting.
- **I-10 Data is never destroyed implicitly.** Uninstall, removal, and destructive plan steps
  require an explicit, environment-aware policy decision; the default is retention.

### 2.4 What this redesign explicitly is not

Stating the refusal boundary is as load-bearing as stating the design;
`rfcs/0003-command-composition-kit.md` carries a "Precise refusal boundary" subsection for exactly
this reason `[OBSERVED]`.

- **Not a query abstraction.** No `Repository<T>`, no portable `findMany`, no NetScript query DSL.
- **Not a portability layer.** NetScript will not make PostgreSQL and SQLite look identical.
  Provider differences are surfaced as capabilities, not hidden behind a lowest common denominator.
- **Not a compatibility layer.** No Prisma 7 facade, no legacy generated module, no alias barrel, no
  `setClient` lifecycle, no runtime shim. Data migration safety is required; API compatibility is
  not.
- **Not a schema language.** NetScript does not invent a third model DSL. The application's data
  contract stays in the provider's authoring language. NetScript's DSL composes _targets, spaces,
  policy, capabilities, and lifecycle_ — never entities.
- **Not a control plane product.** Atlas-class semantic lint, promotion pipelines, and hosted policy
  registries are out of scope; the plan/approve/apply/verify _state machine_ is in scope so that
  such a backend could be added later as one more adapter.
- **Not an implementation.** This is a design report feeding an RFC. Nothing here authorises code.

---

## 3. Target package, ownership, and dependency graph

### 3.1 Doctrine constraints that decide the shape

Four doctrine rules bind the partition, all `[OBSERVED]` via the completed doctrine agent:

- **One archetype per package.** "If two archetypes apply, choose the larger one and fold the
  smaller concerns inside it. Do not split one package across two archetypes"
  (`.llm/harness/archetypes/README.md:23-26`). Where two archetypes genuinely apply and neither can
  be folded without harming the other's gate profile, the correct move is **two packages**, not one
  package with two shapes. That is the reasoning behind splitting definition from runtime below.
- **Ports are small.** AP-3 caps a port at three or four methods and names "a port with every
  operation the backend can perform" as the integration-package failure mode
  (`09-anti-patterns-and-fitness-functions.md:46-52`; `ARCHETYPE-2-integration.md:55`). The current
  `DatabaseAdapter<TClient>` — client lifecycle plus health plus status plus raw query plus
  `setClient` — is a live AP-3 god interface and must be split, not renamed.
- **Engine selection is a typed registry, never a switch.** AP-24's canonical counter-example is
  literally a database-engine switch over `'postgres' | 'mysql' | 'sqlite'`
  (`09-anti-patterns-and-fitness-functions.md:167-198`). The current `mapEngine` switch in
  `packages/cli/src/kernel/adapters/database/workspace-resolver.ts:96+` is that anti-pattern in the
  shipped code `[OBSERVED]`.
- **Surface size is capped.** F-5 caps a `mod.ts` at ~20 exported symbols and subpaths are semver
  surface (`02-public-surface.md:111-138`).

### 3.2 The packages

Names are indicative; the archetype assignment and the dependency direction are the contribution.

| Package                               | Archetype                    | Owns                                                                                                                                                                                                                                                                                                                 | Must not contain                                                                                             |
| ------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `@netscript/database-contract`        | **1 — Small Contract**       | Branded identities, manifest schema, capability vocabulary, ownership policy vocabulary, diagnostic/error code catalog, operation request/result/receipt/progress types, the contribution-space descriptor type, and the port _interfaces_ shared by more than one consumer. Pure types and small invariants; no IO. | Any runtime, any provider, any query type, any Prisma import.                                                |
| `@netscript/database`                 | **4 — Public DSL / Builder** | `defineTarget`, `defineSpace`, `defineDatabase`, and the pure compiler `compileDatabase(definition) → Result<Manifest, Diagnostics>`. Frozen definition objects; one file per builder concern per `06-archetypes.md:127-155`.                                                                                        | IO, connections, provider packages, Aspire, filesystem access other than through an injected port.           |
| `@netscript/database-runtime`         | **3 — Runtime / Behavior**   | Binding a manifest + provider to live connections; process and request scope; connection lifetime; graceful close ordering; health/readiness; `AbortSignal` propagation; `{ stop() }` handles; diagnostics normalisation.                                                                                            | Query types, migration logic, CLI presentation, Prisma imports.                                              |
| `@netscript/database-control`         | **2 — Integration**          | The operation plane behind small ports: emit, plan, apply, verify, introspect. Owns locking, receipts, resume, plan expiry, destructive policy, and cross-target sequencing.                                                                                                                                         | Provider-specific SQL, query surface, Aspire specifics.                                                      |
| `@netscript/database-prisma-postgres` | **2 — Integration**          | The _only_ package permitted to import `@prisma/orm-*`. Supplies a capability descriptor, a contract emitter, a control adapter, and a runtime factory. Independently versioned and released.                                                                                                                        | Being imported by anything except an application composition root and the testkit.                           |
| `@netscript/database-testkit`         | **6 — CLI / Tooling**        | Provider conformance certification as user-run automation: a runnable suite that certifies a provider against the capability contract and emits a machine-readable conformance report.                                                                                                                               | Being a dependency of any runtime package.                                                                   |
| `@netscript/cli` (existing, A6)       | **6 — CLI / Tooling**        | The `db` command surface as a _projection_ of the control operation catalog, plus generated agent-manifest emission.                                                                                                                                                                                                 | Any database logic not reachable through `@netscript/database-control`.                                      |
| `@netscript/aspire` (existing, A2)    | **2 — Integration**          | One `ConnectionSourcePort` adapter that resolves an allocated Aspire endpoint.                                                                                                                                                                                                                                       | Being required by any package for non-Aspire connection sources.                                             |
| `@netscript/plugin` (existing, A4)    | **4 — DSL / Builder**        | `defineDatabaseSpace`, typed **only** by `@netscript/database-contract`.                                                                                                                                                                                                                                             | Depending on `-runtime`, `-control`, or any provider — otherwise every plugin drags a driver into its graph. |

**Why definition and runtime are two packages.** They have incompatible gate profiles and
incompatible dependency needs. The definition/compiler package must be usable in a CI job with no
driver, no database, and no provider installed — that is what makes offline determinism and
stale-artifact detection cheap. The runtime package owns lifecycle and therefore carries Archetype
3's mandatory runtime-gate column. Folding them produces a package that is either over-gated when
used as a pure compiler or under-gated when used as a runtime. Doctrine's "do not split one package
across two archetypes" is satisfied by splitting the _packages_, which is the intended remedy.

**Why control is separate from runtime.** Control operations are transactional, one-shot, and
frequently offline. Runtime operations are long-lived and connection-scoped. They share the manifest
and nothing else. Merging them reproduces the current failure in which a read-only database command
had to own the resident AppHost lifecycle.

### 3.3 Dependency directions

```text
                    @netscript/database-contract          (A1, leaf, zero deps)
                        ^        ^         ^        ^
                        |        |         |        |
        @netscript/database   -runtime  -control   @netscript/plugin
              (A4)              (A3)      (A2)          (A4)
                        ^        ^         ^
                        |        |         |
                        +--------+---------+
                                 |
                  @netscript/database-prisma-postgres      (A2, leaf on the far side)
                                 ^
                                 |
                  @netscript/database-testkit              (A6)

  application composition root  ->  -database, -runtime, -control, one provider, emitted contract
```

Rules, each mechanically checkable:

1. `-contract` imports nothing from this family. It is the only package every other member may
   depend on.
2. `-database` (A4) depends on `-contract` only. It never imports a provider.
3. `-runtime` and `-control` depend on `-contract` and may depend on `-database` for manifest types
   they do not redeclare. They never import each other, and never import a provider.
4. Provider packages depend on `-contract` and on upstream. **Nothing in the framework depends on a
   provider.** Providers are selected by the application, passed in as a value.
5. `@netscript/plugin` depends on `-contract` only. This is the rule that keeps `pg` out of every
   plugin's dependency graph.
6. The testkit may depend on everything; nothing may depend on the testkit.

### 3.4 Ownership map — which concept is a durable public contract

This resolves the minimal-kernel tension the brief asks about explicitly: not everything in this
design is public API, and conflating the two is how the current system grew five overlapping
subsystems.

| Concept                                                                 | Status                                             | Rationale                                                                                                             |
| ----------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Target identity, space identity, namespace reference, object key        | **Durable public data contract** (`-contract`)     | These are the join keys for every artifact, receipt, and diagnostic. They must be stable across provider replacement. |
| Manifest schema and manifest digest                                     | **Durable public data contract**                   | It is the CI/agent/runtime interchange format. Versioned with an explicit format version.                             |
| Capability vocabulary and ownership policy vocabulary                   | **Durable public data contract**                   | Plugins and providers both declare against it.                                                                        |
| Diagnostic/error codes, operation request/result/receipt/progress types | **Durable public data contract**                   | The CLI, CI, and agent surfaces are projections of these; log parsing must become impossible.                         |
| Contribution-space descriptor                                           | **Durable public data contract**                   | It is a third-party authoring surface.                                                                                |
| `defineTarget` / `defineSpace` / `defineDatabase`                       | **Public API**, but a builder, not data            | A4 surface; `defineX` returns a frozen definition per `02-public-surface.md:73-82`.                                   |
| Provider ports (emitter, control, runtime factory, connection source)   | **Public SPI**, small, each ≤4 methods             | Third-party providers must be possible without forking.                                                               |
| The compiler's internal phases, graph structures, resolution order      | **Internal**                                       | Nobody outside needs them; publishing them freezes the implementation.                                                |
| The provider registry instance                                          | **Internal, constructed at the composition root**  | Publishing a mutable registry is how a service locator is born.                                                       |
| The query surface                                                       | **Consumer-owned**, supplied as a generic argument | See §2.2 and §5.4.                                                                                                    |
| The typed per-target binding                                            | **Consumer-owned**, generated into the application | Forced by `isolatedDeclarations` + slow-types; see §2.1(3).                                                           |

### 3.5 Doctrine registration obligations

Two obligations follow that the plan does not currently carry `[OBSERVED]`, both from the doctrine
agent's extraction:

- Every new package must be added to **both** `docs/architecture/doctrine/06-archetypes.md`
  (archetype table, `:374-411`) and `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`
  (verdict table, `:25-62`), because `discoverDoctrineRoots()` gates exactly the paths in that table
  (`10:90-95`). An unregistered package is an ungated package.
- Doctrine currently **codifies the model this RFC removes**: Archetype 5 states that plugin schema
  contributions "are plain `*.prisma` files referenced from `database/`. They do not contain a
  private workspace" (`06-archetypes.md:209-211`). The RFC must amend doctrine, and amending
  doctrine is itself an RFC trigger (`rfcs/README.md:14-32`). This is in scope for the same RFC, and
  the plan should say so.

---

## 4. The identity model

Identity is where the current system fails first, so it is where the design must be most precise.
The current system collapses at least four distinct identities into the string `engine`.

### 4.1 What is wrong today, observed

- `workspaceDir` is computed as `join('database', provider.dirName)` where `provider` is looked up
  from a closed engine enum (`packages/cli/src/kernel/adapters/database/workspace-resolver.ts:50`)
  `[OBSERVED]`. Two PostgreSQL targets therefore share one schema tree, one migration history, one
  generated client, and one task set. The identity of a _logical database_ has no representation.
- `resolveTarget` defaults only when exactly one target is enabled:
  `if (!dbFlag && enabled.length === 1) return { kind: 'single', database: enabled[0] }`
  (`workspace-resolver.ts:71-77`) `[OBSERVED]`. With two or more enabled targets and no `--db`, the
  lookup falls through and throws `Unknown database target: (default)`. `NetScript.PrimaryDatabase`
  is never consulted here. The audit's claim is confirmed, and the failure is a throw rather than a
  silent wrong-target selection, which is the better of the two failure modes.
- The plugin installer's target-selection chain is
  `enabled.find(configKey === primaryDatabase) ?? enabled[0] ?? databases[0]`
  (`packages/cli/src/kernel/adapters/plugin/db-integration.ts:101-105`) `[OBSERVED]`. The final
  fallback drops out of the `enabled` filter, so a plugin can be installed into a **disabled**
  target. The audit does not surface this.
- `--db` accepts either a config key or an engine name, resolved by
  `explicitDb.toLowerCase() as DbEngine` after a config-key lookup fails
  (`db-integration.ts:275-300`) `[OBSERVED]`. Two identity spaces share one flag and one string
  type.
- The config schema accepts provider aliases — `postgresql|postgres`, `mssql|sqlserver`
  (`packages/config/src/domain/schemas/database-schema.ts`) `[OBSERVED]` — and `mapEngine`
  normalises `'Postgres'|'postgres'` (`workspace-resolver.ts:96+`) `[OBSERVED]`. Two normalisation
  sites for one concept.

### 4.2 The proposed identities

Each is a branded primitive, which doctrine sanctions for non-interchangeable ids
(`02-public-surface.md:85-99`) `[OBSERVED]`.

| Identity                  | Shape                                                                             | Stability                                   | Derived from                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **TargetId**              | `'primary'`, `'analytics'`                                                        | Permanent; renaming is a breaking migration | Author's choice. **Never** a provider name.                                                    |
| **ConnectionProfileId**   | `'local'`, `'ci'`, `'production'`                                                 | Per environment                             | Author's choice; orthogonal to TargetId.                                                       |
| **RoleRef**               | `(TargetId, 'writer' \| 'reader:<n>')`                                            | Derived                                     | A replica is a _role of a target_, not a target.                                               |
| **NamespaceRef**          | `(TargetId, namespace)`                                                           | Permanent                                   | Author's choice; a physical schema inside one database.                                        |
| **SpaceId**               | `'app'`, `'plugin:@netscript/plugin-auth'`                                        | Permanent per contributor                   | Package identity for plugin spaces; fixed literal for the app.                                 |
| **ObjectKey**             | `(TargetId, namespace, entryKind, name)`                                          | Derived                                     | The unit of ownership; I-2 is stated over this key.                                            |
| **ContractSnapshotId**    | content hash of a space's canonicalised contract                                  | Derived                                     | Content-addressed.                                                                             |
| **MigrationNodeRef**      | `(SpaceId, ContractSnapshotId)` + optional human ref                              | Derived + author's label                    | Lineage nodes are content-addressed; names are labels, not identity.                           |
| **HeadRef**               | `(SpaceId, TargetId) → MigrationNodeRef`                                          | Mutable state                               | Recorded both in the manifest (intent) and in the database marker (fact). Divergence is drift. |
| **ManifestDigest**        | content hash over the canonical manifest                                          | Derived                                     | The determinism anchor (I-4).                                                                  |
| **PlanId**                | `hash(ManifestDigest, TargetId, baselineFingerprint, providerPackageSet, policy)` | Derived                                     | Binds a plan to everything that could invalidate it.                                           |
| **RunId** / **ReceiptId** | ULID-like, supplied by the caller or generated at the edge                        | Per execution                               | Receipts are addressable and resumable.                                                        |
| **SessionScope**          | `'process' \| 'request'`                                                          | Per binding                                 | A _type-level_ discriminator, not a config flag.                                               |

Three deliberate consequences:

1. **Provider is an attribute of a target, never its identity.** `primary` and `analytics` may both
   be PostgreSQL and share nothing. This is the single change that makes
   `db add postgres --name
   analytics` mean what users already believe it means.
2. **A replica is not a target.** Modelling replicas as targets is how Rails users end up migrating
   a read replica. A role is a binding-time choice with a read-only runtime type; migrations are
   defined over targets and cannot address a reader role at all.
3. **Scope is a type, not a flag.** The request-scoped runtime and the process-scoped runtime are
   different types with different capabilities. Prisma's serverless facade already demonstrates that
   the asymmetry is real rather than cosmetic `[CARRIED — NOT RE-VERIFIED]`; making it a type
   prevents the class of bug where a closure caches a per-request handle.

### 4.3 Invariants over the identity model

Compilation is the enforcement point. Each invariant maps to a diagnostic code (Part 2 carries the
catalog).

- **V-1** Every `SpaceId` binds to exactly one `TargetId`. A space never spans databases.
- **V-2** Every `ObjectKey` has exactly one owning space with `ownership: 'managed'`. Two managed
  owners is an error; a managed owner overlapping an `external` declaration is an error.
- **V-3** Cross-space references are legal only within one `TargetId` **and** only along a declared
  `dependsOn` edge. A relation across targets is an error with a next-action that points at the
  application-level composition pattern instead.
- **V-4** The space dependency graph is acyclic; execution order is its topological order, and the
  order is recorded in the manifest so it is reviewable rather than emergent.
- **V-5** Every space's `requires` capability set is a subset of its target's provider capability
  set, checked at compile time and, where expressible, at type-check time.
- **V-6** No two targets share an output root, a migration root, or a runtime binding key.
- **V-7** `ManifestDigest` is a pure function of the definition plus the resolved space contract
  snapshots plus the provider package set. Nothing environmental participates.
- **V-8** Every emitted artifact root records the `ManifestDigest` that produced it. Runtime binding
  refuses a mismatch with a diagnostic naming the exact command to run.

---

## 5. Public API and DSL sketches

These are implementation-grade sketches, not nouns. They are written to satisfy
`isolatedDeclarations` — every exported symbol has an explicit type — and to keep every published
type free of upstream generics.

### 5.1 Identities and the manifest (`@netscript/database-contract`, A1)

```ts
/** Author-chosen stable identity of one logical database. Never a provider name. */
export type TargetId = string & { readonly __targetId: unique symbol };
/** Author-chosen stable identity of one schema-contributing owner. */
export type SpaceId = string & { readonly __spaceId: unique symbol };
/** Content address of one space's canonicalised contract. */
export type ContractSnapshotId = string & { readonly __snapshot: unique symbol };
/** Content address of a compiled manifest. */
export type ManifestDigest = string & { readonly __digest: unique symbol };

/** How much authority NetScript has over a set of storage objects. */
export type OwnershipPolicy = 'managed' | 'adopted' | 'external' | 'ignored';

/** One capability a provider may offer and a space may require. */
export type CapabilityId = string & { readonly __capability: unique symbol };

/** Fully-resolved, serialisable composition output. The CI/agent/runtime interchange format. */
export interface DatabaseManifest {
  readonly formatVersion: 1;
  readonly digest: ManifestDigest;
  readonly targets: readonly ManifestTarget[];
  readonly spaces: readonly ManifestSpace[];
  /** Topological execution order over spaces; recorded so review sees it. */
  readonly spaceOrder: readonly SpaceId[];
  readonly providerSet: readonly ProviderPin[];
}

export interface ManifestTarget {
  readonly id: TargetId;
  readonly family: string;
  readonly provider: ProviderPin;
  readonly namespaces: readonly string[];
  readonly capabilities: readonly CapabilityId[];
  readonly roles: readonly TargetRole[];
  readonly outputRoot: string;
  readonly migrationRoot: string;
  readonly policy: TargetPolicy;
}

export interface ManifestSpace {
  readonly id: SpaceId;
  readonly version: string;
  readonly target: TargetId;
  readonly ownership: OwnershipPolicy;
  readonly requires: readonly CapabilityId[];
  readonly dependsOn: readonly SpaceId[];
  readonly owns: readonly ObjectKey[];
  readonly snapshot: ContractSnapshotId;
  readonly removal: RemovalPolicy;
}

export interface ObjectKey {
  readonly target: TargetId;
  readonly namespace: string;
  readonly entryKind: string;
  readonly name: string;
}
```

Note what is absent: no provider types, no query types, no generics that could become slow types.
`DatabaseManifest` is plain data and can be serialised, hashed, diffed, and shipped to CI.

### 5.2 The definition DSL (`@netscript/database`, A4)

```ts
export interface TargetDefinition<TId extends string> {
  readonly id: TId;
  readonly provider: ProviderDescriptor;
  readonly connection: ConnectionSourceRef;
  readonly namespaces: Readonly<Record<string, string>>;
  readonly roles?: Readonly<Record<string, RoleDefinition>>;
  readonly policy: TargetPolicy;
}

/** Frozen definition; performs no runtime work. */
export declare function defineTarget<TId extends string>(
  input: TargetInput<TId>,
): TargetDefinition<TId>;

export declare function defineSpace<TId extends string, TTarget extends string>(
  input: SpaceInput<TId, TTarget>,
): SpaceDefinition<TId, TTarget>;

export interface DatabaseDefinition<
  TTargets extends Readonly<Record<string, TargetDefinition<string>>>,
  TSpaces extends readonly SpaceDefinition<string, Extract<keyof TTargets, string>>[],
> {
  readonly targets: TTargets;
  readonly spaces: TSpaces;
}

export declare function defineDatabase<
  TTargets extends Readonly<Record<string, TargetDefinition<string>>>,
  TSpaces extends readonly SpaceDefinition<string, Extract<keyof TTargets, string>>[],
>(
  input: { readonly targets: TTargets; readonly spaces: TSpaces },
): DatabaseDefinition<TTargets, TSpaces>;

/** Pure. No network, no database, no Aspire, no process spawn. */
export declare function compileDatabase(
  definition: DatabaseDefinition<never, never>,
  sources: ContractSourceReader,
): Promise<CompileResult>;

export type CompileResult =
  | {
    readonly ok: true;
    readonly manifest: DatabaseManifest;
    readonly warnings: readonly Diagnostic[];
  }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };
```

Authoring, as a user would write it:

```ts
// database.ts — the whole database story in one reviewable file
import { defineDatabase, defineSpace, defineTarget, prismaSchema } from '@netscript/database';
import { postgres } from '@netscript/database-prisma-postgres';
import { fromAspire, fromEnv } from '@netscript/database/connection';
import { authDatabaseSpace } from '@netscript/plugin-auth/database';

const primary = defineTarget({
  id: 'primary',
  provider: postgres({ minVersion: 15 }),
  connection: fromAspire('netscript-db'),
  namespaces: { app: 'public', auth: 'auth' },
  roles: { writer: {}, 'reader:reporting': { readOnly: true } },
  policy: { destructive: 'deny', defaultOwnership: 'managed' },
});

const analytics = defineTarget({
  id: 'analytics', // same provider, different database, zero shared state
  provider: postgres({ minVersion: 15 }),
  connection: fromEnv('ANALYTICS_DATABASE_URL'),
  namespaces: { warehouse: 'warehouse' },
  policy: { destructive: 'plan-only', defaultOwnership: 'adopted' },
});

export const database = defineDatabase({
  targets: { primary, analytics },
  spaces: [
    defineSpace({
      id: 'app',
      target: 'primary', // compile error if not a key of `targets`
      namespace: 'app',
      source: prismaSchema('./database/app'),
      ownership: 'managed',
    }),
    authDatabaseSpace({ target: 'primary', namespace: 'auth' }),
  ],
});
export type AppDatabase = typeof database;
```

`target: 'primary'` is checked against `keyof typeof targets`. Misrouting a space is a type error at
the authoring site, not a runtime surprise at install time — which is precisely the class of failure
the plugin installer's `?? databases[0]` fallback produces today `[OBSERVED]`.

### 5.3 Typed target references and composition (`@netscript/database-runtime`, A3)

```ts
/** Scope is a type, not a flag: the two shapes are not interchangeable. */
export type SessionScope = 'process' | 'request';

export interface TargetSession<TId extends string, TQuery, TScope extends SessionScope> {
  readonly id: TId;
  readonly scope: TScope;
  /** The provider's own surface, supplied by the application. NetScript never names it. */
  readonly query: TQuery;
  health(signal: AbortSignal): Promise<HealthReport>;
}

/** Interactive transactions exist only on process scope. */
export interface ProcessTargetSession<TId extends string, TQuery>
  extends TargetSession<TId, TQuery, 'process'> {
  transaction<T>(fn: (tx: TQuery) => Promise<T>, options?: TransactionOptions): Promise<T>;
}

/** Request scope is disposable and carries no cached collaborators. */
export interface RequestTargetSession<TId extends string, TQuery>
  extends TargetSession<TId, TQuery, 'request'>, AsyncDisposable {}

/** Long-running handle, per Archetype 3 doctrine. */
export interface DatabaseRuntime {
  stop(): Promise<void>;
  health(signal: AbortSignal): Promise<readonly HealthReport[]>;
}

export declare function createDatabaseRuntime(
  options: DatabaseRuntimeOptions,
): Promise<DatabaseRuntime>;
```

Two design points worth defending in review:

- **`query` is a generic parameter, never a declared type.** This is what keeps every published
  NetScript package free of upstream generics and therefore free of the slow-types problem in
  §2.1(3). It also means replacing the provider changes one type argument, not the kernel.
- **`transaction` exists only on `ProcessTargetSession`.** The current `withTransaction` types its
  callback parameter as the _full_ client —
  `withTransaction<T, Client extends { $transaction:
  unknown }>(client: Client, fn: (tx: Client) => Promise<T>, ...)`
  with an unchecked cast (`packages/database/mod.ts:128-140`) `[OBSERVED]` — so
  `tx.$transaction(...)` type-checks inside an interactive transaction. That is a type-level
  correctness defect, not merely an unsafe cast; the current-state audit's phrase
  "structurally-cast" understates it.

### 5.4 The generated application composition root

This is where the typed binding lives, and the reason is structural rather than stylistic: the
application is not published to JSR, so it may use inference freely; a framework package may not.

```ts
// .netscript/database/primary.binding.ts — GENERATED. Do not edit. digest: <ManifestDigest>
import contract from './primary/contract.json' with { type: 'json' };
import type { PrimaryContract } from './primary/contract.d.ts';
import { createPostgresQuery } from '@netscript/database-prisma-postgres/runtime';
import type { ProcessTargetSession } from '@netscript/database-runtime';

export type PrimaryQuery = ReturnType<typeof createPostgresQuery<PrimaryContract>>;
export type PrimarySession = ProcessTargetSession<'primary', PrimaryQuery>;
export const PRIMARY_MANIFEST_DIGEST = '<digest>' as const;
```

```ts
// composition-root.ts — hand-written, small, and the only place a target is looked up by name
const runtime = await createDatabaseRuntime({
  manifest,
  definition: database,
  providers: [postgresProvider],
  targets: ['primary'],
  scope: 'process',
  connections,
});
const primary: PrimarySession = runtime.bind('primary');
const accounts: AccountStore = new PrismaAccountStore(primary);
```

**The service-locator boundary.** `runtime.bind()` is legal only in a composition root. Feature code
receives `AccountStore`, not the runtime — doctrine A10 requires exactly this
(`01-thesis-and-axioms.md:78-82`) `[OBSERVED]`, and a database handle reachable from anywhere is the
service locator the brief asks me to guard against. This is enforceable as an `arch:check` rule
(reachability of `bind`/`target` outside declared composition-root files), and Part 3 lists it as a
required fitness gate rather than a convention.

### 5.5 Contract-derived validation

The owner-provided Prisma-maintainer exchange establishes an important hypothesis: **the contract
carries enough runtime data to derive validation without a second generation step.** I treat this as
primary exploratory evidence and as a design hypothesis, **not** as an upstream commitment — Part 3
records it as a decision checkpoint conditional on Prisma 8 final.

The architectural consequence, if the hypothesis holds, is significant: the entire "generate Zod,
then rewrite its imports, then fix circular references, then rewrite getters, then patch decimals,
then emit an alias barrel, then fix it again" pipeline has no reason to exist. Validation becomes a
_derivation from data already present_, cached by contract identity.

```ts
/** Standard Schema is the boundary contract; NetScript does not re-export a validator. */
import type { StandardSchemaV1 } from '@standard-schema/spec';

export interface ContractSchemas<TContract> {
  input<K extends ModelName<TContract>, TOp extends 'create' | 'update'>(
    model: K,
    op: TOp,
  ): StandardSchemaV1<InputOf<TContract, K, TOp>>;
  output<K extends ModelName<TContract>>(
    model: K,
  ): StandardSchemaV1<OutputOf<TContract, K>>;
}

/**
 * Default: derived at runtime from the contract, memoised by contract identity.
 * No generation step, no emitted validator source, nothing to keep in sync.
 */
export declare function contractSchemas<TContract>(
  contract: ContractRuntime<TContract>,
  options?: { readonly cache?: SchemaCache },
): ContractSchemas<TContract>;
```

Three rules govern this surface:

1. **Runtime-derived is the default.** Cached by contract identity (the emitted contract's own hash
   plus model plus operation), so derivation happens once per process per shape.
2. **Any ahead-of-time form is an optional optimisation that must be observationally equivalent.**
   An AOT emitter may exist for cold-start-sensitive deployments, but it is not the source of truth,
   and a conformance case must assert that AOT and runtime-derived schemas accept and reject the
   same corpus. If they can diverge, the AOT path is a second model universe and is rejected.
3. **NetScript exposes Standard Schema, not a validator.** `@standard-schema/spec` is already a
   NetScript dependency (`packages/plugin/deno.json`, `packages/sdk/deno.json`) `[OBSERVED]`, and
   doctrine AP-14 forbids re-exporting upstream packages
   (`09-anti-patterns-and-fitness-functions.md:112-116`) `[OBSERVED]`. Consumers who want Zod import
   Zod and adapt.

This also removes a contradiction in the current core config contract: `DatabaseConfigSchema`
hardcodes a `zodGenerator` block with an `output` path and a `mode` enum
(`packages/config/src/domain/schemas/database-schema.ts`) `[OBSERVED]`, which bakes one validator
choice into the framework's configuration vocabulary. Under this design the config vocabulary
carries no validator at all.

---

## 6. Contribution protocol: how a package owns part of a database

### 6.1 What exists today, observed

The current-state audit describes plugin schema contribution as "plugins declare schema by shipping
plain `database/**/*.prisma` files". That is true of the _runtime behaviour_, but it misses that
NetScript already publishes a contribution protocol which nothing implements:

- `ContributionAxis` is a closed union that already contains `'database-schema'` and `'migration'`
  (`packages/plugin/src/domain/constants.ts:16-26`) `[OBSERVED]`.
- `PluginDbSchemaContribution` is an exported abstract class with `axis = 'database-schema'`, an
  abstract `path: string`, and an abstract `engine?: 'postgres' | 'mysql' | 'mssql' | 'sqlite'`
  (`packages/plugin/src/abstracts/plugin-db-schema-contribution.ts`) `[OBSERVED]`.
  `PluginMigrationContribution` adds `name` and `path`
  (`packages/plugin/src/abstracts/plugin-migration-contribution.ts`) `[OBSERVED]`. Both are exported
  from `@netscript/plugin/abstracts`.
- A repository-wide grep for implementations returns none: the only hits are the definitions, the
  barrel re-exports, and an axis-list unit test `[OBSERVED]`.

So the published contribution surface is hollow, and the four first-party plugins bypass it entirely
with plain fragments. Three consequences follow that the research does not state:

1. **The clean break is a breaking change to `@netscript/plugin` (Archetype 4), not only to
   `@netscript/database`.** Removing or replacing `PluginDbSchemaContribution`,
   `PluginMigrationContribution`, and two members of the `ContributionAxis` union changes a
   published package's public surface. The plan scopes future A1/A2/A4/A5/A6 surfaces but never
   scopes this removal.
2. **The abstract already repeats the identity collapse.**
   `engine?: 'postgres' | 'mysql' | 'mssql' |
   'sqlite'` is optional and names an engine, not a
   target. Even the intended protocol could not express "this contribution belongs to the
   `analytics` target".
3. **The fragments are already provider-locked while declaring nothing.** Across the four
   first-party plugin schemas the native type attributes used are `@db.VarChar`, `@db.Text`, and
   `@db.Uuid`, with `@db.Uuid` appearing in `plugins/triggers/database/triggers.prisma:13`,
   `plugins/workers/database/workers.prisma:219`, and `plugins/sagas/database/sagas.prisma:57` and
   `:179` `[OBSERVED]`. `@db.Uuid` is PostgreSQL-specific. Meanwhile the installer's
   target-selection chain ends in `?? databases[0]`, which escapes the `enabled` filter
   (`packages/cli/src/kernel/adapters/plugin/db-integration.ts:101-105`) `[OBSERVED]`. Today a
   plugin whose schema only compiles on PostgreSQL can be copied into a disabled MySQL target, and
   nothing in the pipeline objects until Prisma fails to parse.

Model naming reinforces the point: `plugins/auth` and `plugins/sagas` prefix their declarations
(`AuthUser`, `SagaInstance`), while `plugins/workers` and `plugins/triggers` do not
(`JobDefinition`, `TaskDefinition`, `WrapperType`, `TriggerEvent`, `TriggerDefinition`)
`[OBSERVED]`. The namespacing remedy from the historical collision fix was applied where the
collision happened, not as a protocol. `JobDefinition` remains a globally-scoped name in a shared
declaration space.

Finally, the contribution's _capability declaration_ today is a boolean: `scaffold.plugin.json`
carries `capabilities.hasDatabaseMigrations: true` (`plugins/workers/scaffold.plugin.json`)
`[OBSERVED]`. Plugin-level ordering exists (`officialSource.dependencies: ["streams"]`) but is not
connected to schema ordering.

### 6.2 The contribution DSL

A contribution is a **space**: a versioned owner of a disjoint set of storage objects, with its own
lineage. It is declared with types from `@netscript/database-contract` only, so a plugin that
contributes schema does not acquire a driver dependency.

```ts
// plugins/auth/database/space.ts
import { defineDatabaseSpace, sql } from '@netscript/plugin/database';
import { CAP } from '@netscript/database-contract/capabilities';

export const authDatabaseSpace = defineDatabaseSpace({
  id: 'plugin:@netscript/plugin-auth',
  version: '0.0.7',
  contractFormat: '>=1 <2',

  /** Declared, not inferred. Composition fails if the target cannot satisfy these. */
  requires: [CAP.sqlFamily, CAP.nativeUuid, CAP.caseInsensitiveText],

  /** Ordering is a declared edge, not install order. */
  dependsOn: [],

  /** Everything this space owns, and nothing else may own. */
  owns: { namespace: 'auth', entries: ['user', 'session', 'account', 'verification'] },

  /** What another space may add to this space's objects, and what it may never touch. */
  augmentation: {
    grants: [{ entry: 'user', kind: 'add-optional-column', prefix: 'x_' }],
    denies: ['drop-column', 'change-type', 'add-required-column'],
  },

  ownership: 'managed',

  /** Uninstall is a plan, never a delete. */
  removal: { default: 'retain', allowed: ['retain', 'archive'], dropRequires: 'explicit-consent' },

  source: sql.schema(import.meta.resolve('./contract.ts')),
});
```

The consuming application binds it to a target explicitly:

```ts
spaces: [authDatabaseSpace({ target: 'primary', namespace: 'auth' })];
```

`target` is checked against `keyof targets` (§5.2). There is no primary-ish fallback, no
first-available fallback, and no engine string. If the author does not say where a contribution
goes, compilation fails with a diagnostic that lists the candidate targets — which is strictly
better than the current `?? databases[0]`.

### 6.3 Provenance and the pinned mirror

Installation never mutates another contributor's source and never copies declarations into the
application's schema tree. Instead, installation writes a **pinned mirror** under the application's
generated root:

```text
.netscript/database/spaces/plugin--netscript--plugin-auth/
  space.json          # descriptor snapshot: id, version, requires, dependsOn, owns, ownership
  contract.json       # the space's canonicalised contract at the pinned version
  lineage/            # the space's own migration lineage nodes
  PROVENANCE          # package identity, resolved version, integrity hash, mirror digest
```

Three properties fall out. Production apply and verify read the mirror, not `node_modules`, so a
deployment does not need the plugin's package graph resolvable. The mirror digest is comparable
against the installed package's digest, which makes version skew detectable rather than latent. And
because the mirror is per-space, uninstalling a plugin removes a directory that owns nothing of the
application's.

### 6.4 Lifecycle and its state machine

| Transition           | Precondition                                                                                              | Effect                                                                                                                               | Refusal conditions                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Install**          | Target declared; `requires ⊆ target capabilities`; no `owns` overlap; `dependsOn` all present and acyclic | Mirror written; manifest recompiled; a plan is produced                                                                              | Capability gap, ownership overlap, missing/cyclic dependency, contract-format mismatch                                      |
| **Upgrade**          | New version's `owns` diff is expressible; lineage from pinned head to new head resolvable                 | New mirror; lineage edges appended; plan produced                                                                                    | Non-linear lineage without an explicit resolve, ownership widening onto an object another space owns, capability regression |
| **Skew detected**    | Installed package digest ≠ mirror digest                                                                  | Refuse apply; emit `db.space.skew` with both digests and the sync command                                                            | —                                                                                                                           |
| **Uninstall**        | Space is not a `dependsOn` of another installed space                                                     | Space unbound; retirement plan produced                                                                                              | A dependent space still installed; retention policy not satisfiable                                                         |
| **Retire (retain)**  | Default                                                                                                   | Objects remain; space marked orphaned; ownership downgraded `managed → adopted` so verify still notices drift instead of going blind | —                                                                                                                           |
| **Retire (archive)** | Allowed by policy                                                                                         | Objects moved to a quarantine namespace with a recorded reason and a restore path                                                    | Capability missing (e.g. no schema-move support)                                                                            |
| **Retire (drop)**    | Explicit consent + environment policy allows destructive                                                  | Destructive plan produced, requires approval like any destructive plan                                                               | CI without an approved plan; production without signed plan                                                                 |

The important asymmetry: **install is cheap and reversible; removal is a planned operation.** The
current removal path deletes the copied schema directory and plans nothing
`[CARRIED — NOT
RE-VERIFIED]`; under this protocol deleting a directory cannot be the removal,
because the directory was never the ownership record — the database marker and the manifest are.

### 6.5 Ownership, conflict, and augmentation

Conflict resolution today is byte comparison: identical normalised bodies are elided, and differing
bodies are rejected (`packages/cli/src/kernel/adapters/plugin/prisma-schema-writer.ts:133`)
`[OBSERVED]`. That is a _text_ policy standing in for an _ownership_ policy. It cannot express "this
plugin may add an optional column to that plugin's table", and it cannot distinguish "same
declaration, both owners" from "same name, different concept".

The replacement is ownership-first:

- **V-2 disjointness** (Part 1 §4.3) is checked over `ObjectKey`, not over text. Two managed owners
  of one object is `db.space.ownership.conflict`, and the diagnostic names both spaces.
- **Augmentation is a grant, not a merge.** A space may only modify another space's objects along an
  explicitly granted axis; the grant lives with the _owner_, which is the only party that can reason
  about its own invariants. Denied axes are enumerated so the refusal is legible.
- **Namespaces make collisions structural rather than lexical.** `auth.user` and `app.user` are
  different objects; no prefixing convention is required, and the `JobDefinition`-style unprefixed
  global name stops being a hazard.
- **`external` and `ignored` are first-class.** An object marked `external` is excluded from
  planning and diffing but still verifiable as assertions; `ignored` is excluded from everything
  with a recorded reason. This is what makes hosted/managed databases workable rather than a
  permanent source of false drift.

### 6.6 Migrations, conformance, and coexistence with upstream extensions

**Per-space lineage.** Each space carries its own lineage of content-addressed nodes; the database
holds one marker row per `(space, target)`. Applying a space advances only that space's marker.
Cross-space ordering is the topological order recorded in the manifest, so a reviewer can see it
before it runs.

**Data transforms are edges, not a second folder.** The invariant-guarded transition model — a
precondition query that detects remaining work, a mutation plan, and a post-verification of the
invariant `[CARRIED — NOT RE-VERIFIED]` — is the right semantic model and NetScript should adopt it
rather than reinventing a timestamped data-migration directory. The historical failure mode in
comparable frameworks is exactly a second chronological sequence whose correctness depends on
invocation order.

**A contributor conformance kit.** `@netscript/database-testkit` must certify a _space_, not only a
provider: given a space descriptor and an ephemeral target, it asserts that install → upgrade →
skew-detect → uninstall-retain → uninstall-archive all produce the declared outcomes, that `owns` is
truthful (nothing outside `owns` is touched), that `requires` is minimal-and-sufficient (removing
any capability makes composition fail; the declared set is enough to apply), and that augmentation
grants and denials are enforced. Without this, third-party contributions are a documentation
promise.

**Coexistence with upstream extensions.** Prisma 8 extensions can themselves own contract spaces
`[CARRIED — NOT RE-VERIFIED]`. NetScript must not treat an upstream-owned space as unknown
territory: the manifest records it with `ownership: 'external'` and a provenance entry naming the
upstream extension, so verify accounts for its objects instead of reporting them as drift. NetScript
spaces and upstream extension spaces coexist under one disjointness check.

---

## 7. Control plane: typed operations, receipts, and determinism

### 7.1 What must be replaced, observed

The current runner's entire result type is an exit code: `execute(request): Promise<number>`
(`packages/cli/src/kernel/adapters/database/operation-runner.ts:85`) `[OBSERVED]`. Two behaviours
follow directly from that signature:

```ts
if (request.operation === 'studio') {
  return await this.executeOne(request, databases[0]); // silently the first target only
}
for (const database of databases) {
  const code = await this.executeOne(request, database, controller.signal);
  if (code !== 0) return code; // fail-fast, no per-target outcome
}
```

(`operation-runner.ts:90-105`) `[OBSERVED]`

So `--db all` is sequential and fail-fast with no record of which targets succeeded, and `studio`
uses `databases[0]` regardless of the resolved target set. This is not a missing feature that
receipts would improve; **the return type makes structured reporting impossible.** Replacing it is
the load-bearing change, and it is why "add receipts" cannot be an incremental slice.

The CLI surface itself is confirmed as fourteen verbs — `add`, `list`, `remove`, `init`, `generate`,
`migrate`, `seed`, `status`, `studio`, `introspect`, `reset`, `deploy`, `validate`, `resolve`
(`packages/cli/src/public/features/db/db-group.ts:32-53`) `[OBSERVED]`.

### 7.2 Operation classification

Classification is the mechanism that decouples pure work from orchestration, and it must be data on
the operation, not a convention.

| Class       | Examples                                                                         | Requires connection | Requires Aspire                                    | Requires lock | Produces receipt       |
| ----------- | -------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------- | ------------- | ---------------------- |
| `pure`      | compose, validate, emit, format, lineage integrity check                         | No                  | **Never**                                          | No            | Yes (artifact receipt) |
| `live-read` | introspect, status, plan-against-live, verify                                    | Yes                 | Only if the target's connection source _is_ Aspire | No            | Yes                    |
| `mutating`  | init, apply, seed, sign, retire                                                  | Yes                 | Only if the connection source is Aspire            | **Yes**       | Yes                    |
| `resident`  | studio and any operation whose connection exists only inside a resident resource | Yes                 | Yes, explicitly selected                           | Advisory      | Yes                    |

The rule that matters: **Aspire is a property of a target's connection source, not of an operation
class.** The recorded architecture debt `DB-GENERATE-ASPIRE-COUPLING` documents the current inverse
— `DbOperationRunner.executeDetached` always runs `aspire start` before executing any database
operation, so pure codegen fails where the Aspire CLI or .NET is absent
(`.llm/harness/debt/arch-debt.md`, entry `DB-GENERATE-ASPIRE-COUPLING`) `[OBSERVED]`. Under
classification, `emit` cannot reach an orchestrator because a `pure` operation is not given a
connection resolver at all.

### 7.3 Concrete operation types

```ts
export type OperationClass = 'pure' | 'live-read' | 'mutating' | 'resident';

export interface OperationRequest<TOp extends OperationName> {
  readonly operation: TOp;
  readonly manifestDigest: ManifestDigest;
  /** Explicit target set. There is no implicit "all" and no implicit default. */
  readonly targets: readonly TargetId[];
  readonly spaces?: readonly SpaceId[];
  readonly policy: ExecutionPolicy;
  readonly runId: RunId;
  readonly signal: AbortSignal;
}

export interface ExecutionPolicy {
  readonly environment: 'development' | 'ci' | 'staging' | 'production';
  readonly destructive: 'deny' | 'plan-only' | 'allow-with-approval';
  readonly onPartialFailure: 'stop' | 'continue';
  readonly lockTimeoutMs: number;
  readonly planMaxAgeMs: number;
}

/** Every operation returns this. Nothing returns a number. */
export interface OperationResult<TOutcome> {
  readonly runId: RunId;
  readonly outcome: 'succeeded' | 'partially-succeeded' | 'failed' | 'refused';
  readonly perTarget: readonly TargetOutcome<TOutcome>[];
  readonly diagnostics: readonly Diagnostic[];
  readonly receipt: Receipt;
  /** Present iff outcome is 'partially-succeeded' or 'failed' and the run is resumable. */
  readonly resume?: ResumeToken;
}

export interface TargetOutcome<TOutcome> {
  readonly target: TargetId;
  readonly status: 'succeeded' | 'failed' | 'skipped' | 'not-attempted';
  /** Why a target was skipped or not attempted. No silent omissions. */
  readonly reason?: DiagnosticCode;
  readonly spaces: readonly SpaceOutcome[];
  readonly value?: TOutcome;
}
```

**No silent skip.** Every target in the requested set appears in `perTarget` with a status, and
`skipped`/`not-attempted` carry a reason code. This is the direct answer to the market analysis's
strongest cross-product lesson — routing and filter mechanisms that silently omit work are the
recurring severe failure in Django-style multi-database systems.

### 7.4 Plan, consent, expiry, and apply

```ts
export interface MigrationPlan {
  readonly planId: PlanId;
  readonly target: TargetId;
  readonly manifestDigest: ManifestDigest;
  readonly baseline: BaselineFingerprint; // what the live database looked like when planned
  readonly providerSet: readonly ProviderPin[];
  readonly spaceOrder: readonly SpaceId[];
  readonly steps: readonly PlanStep[];
  readonly destructive: readonly DestructiveOperation[];
  readonly capabilitiesUsed: readonly CapabilityId[];
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly signature?: PlanSignature; // required in production
}

export interface DestructiveOperation {
  readonly kind:
    | 'drop-entry'
    | 'drop-column'
    | 'narrow-type'
    | 'add-required-without-default'
    | 'unique-over-existing-data'
    | 'namespace-drop';
  readonly object: ObjectKey;
  readonly dataLossRisk: 'certain' | 'possible' | 'none';
  /** Present only when the provider proved it. Absence is not "safe". */
  readonly observedRowCount?: number;
}
```

Apply refuses a plan whose `manifestDigest`, `baseline`, `providerSet`, or target no longer match,
and refuses an expired plan. Consent is _not_ an interactive prompt: in `ci` and `production` the
policy must be `allow-with-approval` **and** the plan must carry a signature. An interactive "yes"
is a development affordance only. This is the ordering the research proposes and I endorse without
change.

### 7.5 Progress, dotted diagnostics, and receipts

```ts
export type DiagnosticCode =
  | 'db.compose.ownership.conflict'
  | 'db.compose.capability.missing'
  | 'db.compose.dependency.cycle'
  | 'db.space.skew'
  | 'db.plan.stale'
  | 'db.plan.expired'
  | 'db.apply.destructive.refused'
  | 'db.apply.lock.held'
  | 'db.verify.drift'
  | 'db.artifact.stale'
  | 'db.target.ambiguous';

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: 'error' | 'warning' | 'info';
  readonly subject: ObjectKey | TargetId | SpaceId;
  readonly message: string; // human text, never parsed by anything
  readonly nextAction: NextAction; // structured: a command + args, not prose
}

export type ProgressEvent =
  | { readonly kind: 'span-start'; readonly span: SpanRef; readonly label: string }
  | { readonly kind: 'span-end'; readonly span: SpanRef; readonly status: 'ok' | 'error' }
  | { readonly kind: 'note'; readonly span: SpanRef; readonly diagnostic: Diagnostic };

export interface Receipt {
  readonly receiptId: ReceiptId;
  readonly runId: RunId;
  readonly operation: OperationName;
  readonly manifestDigest: ManifestDigest;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly phases: readonly ReceiptPhase[]; // per target, per space, per step
  readonly artifacts: readonly ArtifactAssertion[];
  readonly environment: string;
  readonly toolVersions: readonly ProviderPin[];
}

/** A postcondition the operation proved, not a log line claiming it. */
export interface ArtifactAssertion {
  readonly path: string;
  readonly expected: 'created' | 'unchanged' | 'replaced' | 'absent';
  readonly digestBefore?: string;
  readonly digestAfter?: string;
}
```

`nextAction` being structured rather than prose is what lets the CLI, CI annotations, and the agent
surface all render the same remediation without any of them parsing text. This directly retires the
weakest link in the current gate: the merge-readiness migration fixture asserts on the literal
string `'created no migration artifact'` and refuses to run outside Linux
(`packages/cli/e2e/src/application/gates/scaffold/verify-db-migration-artifacts.ts`) `[OBSERVED]`. A
reworded message breaks the gate, and the platform where the historical schema-engine hangs occurred
is not covered by it at all.

### 7.6 Locks, concurrency, resume, and CI determinism

- **Lock scope is `(target, physical database)`,** acquired for `mutating` operations only, with an
  owner identity, a heartbeat, and a TTL. A lock is a database-level advisory lock where the
  provider has one and a ledger row with fencing otherwise; the capability is declared, so a
  provider without either is refused for concurrent-safe apply rather than silently racing.
- **No shared stateful runner across targets.** Each target gets its own runner instance. This is
  the concrete lesson from ORMs whose migration fan-out documents "shared instance parallel fan-out
  is unsupported"; the architecture should make the unsupported configuration unrepresentable.
- **Resume is per `(runId, target, space, stepIndex)`.** A resumed run re-validates the plan against
  the live baseline before continuing, so resume can refuse rather than compound a divergence.
- **Cross-target apply is a saga, never a transaction.** `partially-succeeded` is a first-class
  outcome. Claiming atomicity across two databases would be a lie, and I-9 forbids it.
- **Offline determinism.** `pure` operations take a source reader and a clock port, never a network.
  Emitting twice from a clean checkout must produce identical digests; emitting into distinct target
  roots must be safe concurrently; artifacts are written to a temporary root and moved atomically so
  an interrupted emit leaves either the old tree or the new tree, never a half-patched one.
- **CI cacheability.** The manifest digest is the cache key. A CI job that has already emitted for a
  digest can skip emission and assert the recorded `ManifestDigest` in the artifact root instead
  (I-4/V-8). Receipts are written as atomic JSON, which is the pattern this repository already uses
  for gate evidence (`.llm/tools/gates/run-gate.ts` receipts under `.llm/tmp/gate-receipts/`)
  `[OBSERVED]` — the database receipts should adopt that shape rather than invent a second one.

### 7.7 The generated agent surface

The agent surface is an _output_, not a maintained document: a generated manifest containing the
target/space inventory with capabilities and ownership, the command catalog with argument schemas
and result schemas, the diagnostic catalog with `nextAction` for each code, the
destructive/environment policy, the list of operations the resolved provider does **not** support,
and compile-checked import examples. Two rules keep it honest: it is regenerated from the manifest
plus the operation catalog on every emit, and a conformance case executes every generated example. A
generated skill that is not executed in CI decays exactly the way hand-maintained agent instructions
do.

---

## 8. Prisma 8: adopt, wrap, defer, reject — and the volatility boundary

### 8.1 Decisions

| Upstream surface or idea                                                                                       | Decision                                                     | Reasoning                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical contract artifact + type declaration ("types-only emission")                                         | **Adopt**                                                    | Removes executable generated clients, which removes the entire textual-repair pipeline. This is the single highest-value upstream change for NetScript.                                 |
| Domain/storage plane separation and per-plane hashes                                                           | **Adopt as internal identity; do not re-publish**            | Excellent internal structure; the representation is explicitly still moving, so NetScript records its own manifest digest and treats upstream hashes as recorded attributes.            |
| Family / target / adapter / driver / extension axis split                                                      | **Adopt conceptually**                                       | Correct open-axis model; it is what makes "engine" stop being the only discriminator.                                                                                                   |
| Contract spaces                                                                                                | **Adopt and extend**                                         | The right ownership primitive. NetScript adds target binding, capability requirements, augmentation grants, removal/retention policy, and provenance — none of which upstream provides. |
| Migration lineage as content-addressed edges + per-space marker + ledger                                       | **Adopt the semantics; own the operations**                  | See §8.2.                                                                                                                                                                               |
| Invariant-guarded data transforms                                                                              | **Adopt**                                                    | Correct model; NetScript generates the descriptor wiring rather than leaving planner placeholders for a human to fill.                                                                  |
| Structured results, progress spans, dotted error codes                                                         | **Adopt and translate**                                      | Enables §7 without log parsing. Translate into NetScript codes so upstream renaming is not a NetScript breaking change.                                                                 |
| Programmatic control client                                                                                    | **Wrap behind a NetScript port, with a contingency backend** | See §8.3. This is where I diverge from the research.                                                                                                                                    |
| PostgreSQL runtime facade                                                                                      | **Wrap; expose as a generic type argument**                  | Powerful, and far too upstream-specific to become NetScript-wide API.                                                                                                                   |
| Standard Schema for parameter validation                                                                       | **Adopt**                                                    | Already a NetScript dependency; aligns the boundary.                                                                                                                                    |
| Project-level agent skill                                                                                      | **Recreate from the NetScript manifest**                     | Direction is right; content generated from RC-era material is not trustworthy enough to consume.                                                                                        |
| CLI binary name and config file shape                                                                          | **Do not bind**                                              | RC-tag names are already not what post-RC `main` carries. Bind to the programmatic seam instead.                                                                                        |
| Public package re-exports                                                                                      | **Reject**                                                   | Doctrine AP-14, plus the slow-types constraint (Part 1 §2.1(3)).                                                                                                                        |
| Hand-written low-level driver adapters                                                                         | **Reject by default**                                        | The existing `@netscript/prisma-adapter-mysql` is the cautionary case. Require certification through the testkit if ever unavoidable.                                                   |
| Copied/merged schema fragments                                                                                 | **Reject**                                                   | No ownership, no lineage, no capability guard, no safe removal.                                                                                                                         |
| Generated-source text patching                                                                                 | **Reject**                                                   | I-5.                                                                                                                                                                                    |
| Universal lowest-common-denominator database API                                                               | **Reject**                                                   | Weakens every provider and hides real semantics.                                                                                                                                        |
| Prisma 7 compatibility facade                                                                                  | **Reject**                                                   | Owner directive; also the source of the current architecture's shape.                                                                                                                   |
| MySQL / SQL Server as 8.0 targets                                                                              | **Defer**                                                    | Not in the 8.0 target set. See §9.4.                                                                                                                                                    |
| Extension removal, shadow-database workflow, cross-target advisory locking, row-count-aware data-loss analysis | **Defer upstream; own in NetScript where required**          | These are precisely the operational gaps §7 fills.                                                                                                                                      |

### 8.2 Where I diverge from the research: own the operational layer outright

The research recommends adopting the migration graph "after conformance". I recommend a sharper
split. **Adopt the semantic layer** — content-addressed lineage nodes, per-space markers,
edge/ledger coupling, invariant-guarded transforms. **Own the operational layer outright** —
locking, receipts, resume, plan expiry and signing, destructive policy, cross-target sequencing,
partial-success reporting, and drift classification.

The reason is that the operational gaps are not incidental: the absence of a mature
reset/resolve/diff/squash workflow, of a general shadow-database workflow, of a complete
advisory-lock story across targets, and of row-count-aware data-loss analysis
`[CARRIED — NOT RE-VERIFIED]` are all in the operational layer. If NetScript waits for upstream to
close them, adoption is gated on someone else's roadmap; if NetScript owns them, adoption is gated
only on the semantic layer, which is the part that is genuinely good. This also means these
operations are NetScript's to keep when a second provider arrives, rather than being re-acquired per
provider.

### 8.3 Volatility containment

The control API is the correct integration direction _and_ it is demonstrably moving: routing
migration and database commands through the control API, adding sectioned config diagnostics and a
control-client test double, and making command output channels explicit are all **post-RC `main`**
changes, not RC-tag facts `[CARRIED — NOT RE-VERIFIED]`. Pinning a moving seam inside a package that
must satisfy JSR publish gates is a real risk, so containment is structural rather than a version
pin:

1. **One package may import upstream.** `@netscript/database-prisma-postgres` and nothing else. A
   dependency-cruiser-style rule fails the build on any upstream import elsewhere.
2. **One module inside that package may name upstream symbols.** An `upstream.ts` facade module is
   the sole import site; every other file imports from it. The blast radius of an upstream rename is
   one file.
3. **An explicit import allowlist.** `@prisma/orm-postgres` publishes on the order of 138 top-level
   export keys `[CARRIED — NOT RE-VERIFIED]`; the overwhelming majority are extension-author
   surface. The allowlist enumerates the handful NetScript uses, and any newly-introduced deep
   import fails a check. Without this, "we depend on Prisma" silently becomes "we depend on Prisma's
   internals".
4. **The provider package is versioned and released independently of the kernel.** An upstream break
   is then a provider patch release, not a framework break. This is the property that makes the
   whole design survivable across an RC-to-GA transition.
5. **A contingency backend behind the same port.** The NetScript `ControlPort` must be satisfiable
   by a second implementation that uses the emitted artifacts plus direct SQL, exercised in CI even
   if it is never the default. A port with exactly one possible implementation is not containment;
   it is a rename.
6. **Contract format version is a gate, not an assumption.** The manifest records the upstream
   contract format version; a change is a deliberate migration with its own conformance run.

---

## 9. Provider, engine, and runtime matrix

### 9.1 Capability model, not a compatibility table

Capabilities are an **open, provider-declared** set. The kernel never requires a capability; only
spaces do (I-7). This is the structural difference between a capability model and a portability
layer: adding a capability does not force every provider to implement it, and using one is a
compile-time decision.

| Axis      | Example capabilities                                                                             |
| --------- | ------------------------------------------------------------------------------------------------ |
| Family    | `sql`, `document`                                                                                |
| Types     | `nativeUuid`, `caseInsensitiveText`, `nativeEnum`, `jsonb`, `arrayColumn`, `vector`              |
| Schema    | `multiNamespace`, `namespaceMove`, `viewDefinition`, `checkConstraint`, `partialIndex`           |
| Migration | `transactionalDdl`, `advisoryLock`, `shadowDatabase`, `rowCountEstimate`                         |
| Runtime   | `interactiveTransaction`, `preparedStatement`, `streamingCursor`, `cancellation`, `externalPool` |

Provider capability claims are not self-certified: they are what `@netscript/database-testkit`
proves against a live instance, and a claim without a passing conformance case is a conformance
failure.

### 9.2 Target matrix and the PostgreSQL-first decision

PostgreSQL is the only credible first implementation, and this is a decision rather than a
preference: it is the sole database intended for the 8.0 GA target set, with MongoDB earlier-stage,
SQLite proof-of-concept, MySQL later, and SQL Server absent `[CARRIED — NOT RE-VERIFIED]`.

| Provider              | Wave     | Status                             | Notes                                                                                                            |
| --------------------- | -------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Prisma 8 · PostgreSQL | 1        | **Primary implementation**         | Must pass the full conformance suite against a real PostgreSQL service, not an emulator.                         |
| Prisma 8 · SQLite     | 3        | Candidate, capability-reduced      | Useful for local/dev and for proving the capability model has teeth; must not be presented as production parity. |
| Prisma 8 · MongoDB    | Deferred | Validates family abstraction       | Proves the `family` axis is real; not a NetScript deliverable in the first waves.                                |
| MySQL                 | Deferred | Contingency, see §9.4              |                                                                                                                  |
| SQL Server            | Deferred | Not in the upstream 8.0 target set | Requires a different provider entirely.                                                                          |

### 9.3 Multi-target, multi-schema, and external ownership semantics

- **Same-provider multi-target** is the default case, not a special case. `primary` and `analytics`
  may both be PostgreSQL; they share no output root, no lineage, no runtime binding, and no receipt
  namespace (V-6). This is the concrete repair for `db add postgres --name analytics` resolving to
  `database/postgres/` (`workspace-resolver.ts:50`) `[OBSERVED]`.
- **Same-database multi-schema** is namespaces within one target. Spaces own namespaces or object
  sets inside them.
- **Cross-space relations** are legal within one target along a declared dependency edge (V-3).
  Cross-_target_ relations are refused at composition with a diagnostic — the honest answer, since
  no amount of framework code makes a foreign key work across two databases.
- **Replicas are roles** (Part 1 §4.2). A reader role yields a read-only session type and is not
  addressable by any migration operation.
- **External/unmanaged** ownership is required, not optional. Hosted platforms evolve tables outside
  the framework's knowledge; a framework that treats every visible object as its own reports
  permanent false drift. `external` objects are excluded from plan and diff and included in verify
  as assertions only.

### 9.4 Runtime constraints: Deno, serverless, and the MySQL contingency

NetScript is a Deno framework publishing to JSR, and the upstream posture is Node-primary with
Bun/Deno best-effort, a PostgreSQL facade that depends on `pg`, and TypeScript 5.9 as an
**optional** peer `[CARRIED — NOT RE-VERIFIED]`. "Deno is listed" is therefore not an adoption
argument. The platform gate must prove: a clean Deno import graph with no undeclared Node globals in
runtime paths; connect/query/transaction/stream/close/error-mapping behaviour against a real
service; no CLI or toolchain module reachable from a runtime graph; leak behaviour under repeated
start/stop and request lifecycles; and the supported bundler/deployment modes.

Serverless is a _scope_, not a deployment flag: the request-scoped session type omits interactive
transactions and cached collaborators and is `AsyncDisposable` (Part 1 §5.3). The upstream
serverless facade's asymmetry is a precedent worth copying rather than smoothing over.

**MySQL contingency.** The current `@netscript/prisma-adapter-mysql` implements Prisma's low-level
driver-adapter contracts directly `[CARRIED — NOT RE-VERIFIED]`; doctrine's verdict for it is _Keep_
(`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:50`) `[OBSERVED]`, which reflects
its fit to the _current_ port, not its fit to this design. Under a clean break there are three
options: retire it and defer MySQL to an upstream target; port it to the new provider port and
certify it through the testkit; or keep it as an out-of-tree provider. I recommend **retire and
defer**, with the testkit path available if a MySQL requirement lands before upstream ships the
target. Carrying a hand-maintained low-level driver adapter through a clean break re-imports the
exact maintenance surface the redesign exists to remove.

---

## 10. Pure-TypeScript schema authoring and the end-to-end type system

### 10.1 The question, answered directly

Prisma 8 supports both a schema language and a TypeScript contract builder, both lowering to the
same contract, with the TypeScript route giving immediate `typeof contract` inference
`[CARRIED — NOT
RE-VERIFIED]`. The brief asks whether NetScript should **expose**, **wrap**, or
**translate** that surface.

**Answer: expose upstream authoring for entities; wrap at the composition seam; translate nothing.**

- **Translate — rejected.** A NetScript model DSL that lowers to the upstream contract is a third
  schema language. It would need to track every native type, index kind, constraint, and default the
  provider supports, it would lag upstream permanently, and its error messages would be a
  translation of a translation. This is the clearest instance of the "proprietary second ORM"
  failure the brief asks me to guard against, and it should be rejected explicitly in the RFC rather
  than left as an open option.
- **Bare expose — rejected.** Handing users the upstream builder with no NetScript layer leaves
  exactly the gaps that produced the current situation: no target binding, no ownership, no
  capability requirement, no augmentation policy, no provenance, no lineage ownership.
- **Wrap at the composition seam — chosen.** NetScript owns _which_ contracts exist, _where_ they
  live, _who_ owns each object, _what capabilities_ they require, and _how_ they compose. Upstream
  owns what a model, relation, index, constraint, native type, and default _are_.

### 10.2 The seam in code

```ts
// plugins/auth/database/contract.ts — entity authoring is upstream's job
import { model, ref, string, timestamp, uuid } from '@netscript/database-prisma-postgres/schema';

export const user = model('user', {
  id: uuid().primaryKey(),
  email: string().unique().citext(), // requires CAP.caseInsensitiveText
  createdAt: timestamp().defaultNow(),
});

export const session = model('session', {
  id: uuid().primaryKey(),
  userId: ref(user).onDelete('cascade'),
  expiresAt: timestamp(),
}).index(['userId']);
```

```ts
// NetScript's wrapper: composition, ownership, capability — no entity vocabulary at all
export declare function schemaSpace<TEntries extends Readonly<Record<string, EntryDefinition>>>(
  entries: TEntries,
): ContractSource<TEntries>;
```

The re-export in the first snippet is deliberate and is **not** an AP-14 violation: it is exported
from the _provider_ package, which is the one package permitted to name upstream symbols (§8.3), and
it is provider-specific by design — `citext()` exists on the PostgreSQL provider and nowhere else.
That is the capability model expressed as an import path, and it is the structural fix for the
observed `@db.Uuid` problem: today a PostgreSQL-only native type sits in a fragment declaring no
provider and gets copied into whatever target the installer picks `[OBSERVED]`; under schema-as-code
the PostgreSQL-only builder is only importable from the PostgreSQL provider, and the space that uses
it must declare `requires: [CAP.nativeUuid]`, which composition checks against the bound target
(V-5).

### 10.3 Two-track identity: inference for DX, content hash for correctness

Static inference and durable identity are different jobs and must not share a mechanism.

- **Static inference** gives editor completion and compile-time errors. It flows from the authored
  TypeScript through `typeof`, and it is _only_ valid within the application's own compilation.
- **Stable runtime identity** is the content hash of the canonicalised contract. It is what
  receipts, markers, lineage nodes, plans, and caches key on.

Conflating them is how a system ends up unable to answer "is this database consistent with this
build?" without type-checking. Keeping them separate is also what makes the `isolatedDeclarations`
constraint tractable: the inferred track never crosses a published package boundary (Part 1 §5.4),
while the hashed track is plain data that crosses every boundary freely.

### 10.4 Propagation: one contract, many consumers

The value of schema-as-code is that a single authored contract propagates without a second
generation step at each hop:

| Consumer           | What it derives                                | How                                                                    |
| ------------------ | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Typed operations   | The query surface                              | Provider's contract-typed runtime, delivered as `TQuery` (Part 1 §5.3) |
| Validation         | Input/output Standard Schemas                  | Runtime derivation from the contract (§11)                             |
| RPC / routes       | Contract-bound procedure input/output          | Standard Schema handed to the existing oRPC-bound surface              |
| Forms / SSR        | Field-level schemas and error paths            | The same Standard Schema instances, per field path                     |
| Migrations         | Lineage edges                                  | Storage-plane diff between content-addressed snapshots                 |
| Generated projects | The typed binding module                       | Emitted per target (Part 1 §5.4)                                       |
| Tooling / agents   | Inventory, capabilities, commands, diagnostics | The manifest plus the operation catalog (§7.7)                         |

Every one of those is a _derivation_, and none is a hand-maintained mirror. That is the property
that retires the current pipeline: the generated workspace today emits 30 database tasks and a
repair chain that rewrites Prisma and Zod output textually
`[OBSERVED for the task count; CARRIED — NOT
RE-VERIFIED for the step ordering]`. Derivations do not
need repair passes because there is no second artifact to keep in sync.

---

## 11. Runtime validation subsystem

### 11.1 The hypothesis and the default

The owner-provided Prisma-maintainer exchange establishes the design hypothesis that **the contract
carries enough runtime data to derive validation without a second generation step**. I treat this as
primary exploratory evidence and as a hypothesis to be proven by NetScript's own conformance run —
not as an upstream commitment. Part 3 records it as an explicit decision checkpoint conditional on
Prisma 8 final.

If it holds, the architectural consequence is large, and it is the reason to reject the obvious
approach:

> **Mirror-validator code generation is rejected as the default.** Generating a parallel validator
> universe from the contract — a schema file per model, per input shape, per output shape — is what
> produces import rewriting, circular-reference repair, getter rewriting, decimal compatibility
> patches, alias barrels, and the split-module-instance class of failure. A mirror must be
> regenerated, re-patched, re-exported, and kept in sync forever, and it is stale the moment the
> schema changes without the pipeline running.

The default is **runtime derivation, memoised by contract identity**.

### 11.2 Why selection-awareness settles the argument

The decisive technical argument against mirror codegen is not maintenance burden — it is
combinatorics. Output validation at a trust boundary must validate _the shape that was actually
selected_, not the full model. A query selecting three fields with one relation included produces a
different result shape from the same model selected wholly.

A static mirror would need one schema per selection shape, which is unbounded. A runtime derivation
takes the selection as a parameter and produces the schema for exactly that shape:

```ts
export interface ContractValidation<TContract> {
  /** Input validation for a mutation or query argument set. */
  input<K extends ModelName<TContract>, TOp extends OperationKind>(
    model: K,
    op: TOp,
  ): StandardSchemaV1<InputOf<TContract, K, TOp>>;

  /** Output validation for the exact projection that was requested. */
  output<K extends ModelName<TContract>, TSel extends Selection<TContract, K>>(
    model: K,
    selection: TSel,
    representation: Representation,
  ): StandardSchemaV1<ProjectionOf<TContract, K, TSel, Representation>>;
}

export type Representation = 'runtime' | 'wire';
```

### 11.3 Runtime versus wire representations, and codecs

One contract yields **two** schema families, and conflating them is a common source of subtle bugs:

- **Runtime representation** — what the provider hands back in-process: decimal objects, `BigInt`,
  `Date`, byte arrays, provider-specific enum values.
- **Wire representation** — what crosses an API, SSR boundary, or external-service call, after JSON
  serialisation: strings for decimals and big integers, ISO-8601 for timestamps, base64 for bytes.

`representation` is therefore a parameter of `output()`, not an afterthought. Codecs are the
bidirectional mapping between them, contributed by the provider or by a space; a codec registers
against a contract type and supplies encode, decode, and the two schemas. Because codecs can be
contributed, a space that introduces a custom column type also introduces its validation without any
framework change — and because codec ownership is checked the same way object ownership is (V-2),
two spaces cannot silently register conflicting codecs for the same type.

### 11.4 Trust boundaries: where validation is mandatory

Input validation is always applied at mutation and query boundaries. **Output** validation is
deliberately _not_ universal, because validating every row on every read is a real cost. It is
mandatory at three boundaries and optional elsewhere:

1. **API/RPC responses** — the shape is a published contract; drift here is a consumer break.
2. **SSR/forms payloads** — the shape reaches a browser and is often user-visible.
3. **External-service calls** — data leaving the trust boundary must match what the recipient was
   promised.

Everywhere else, output validation is opt-in and defaults to off with the cost documented. A design
that validates everything by default gets disabled wholesale in production, which is worse than a
design that validates precisely at boundaries.

### 11.5 Cache identity and invalidation

```ts
type SchemaCacheKey = {
  readonly contractIdentity: ContractSnapshotId; // changes ⇒ every derived schema invalid
  readonly space: SpaceId; // plugin spaces cache independently
  readonly model: string;
  readonly operation: OperationKind | 'output';
  readonly selectionHash: string; // canonicalised selection shape
  readonly representation: Representation;
};
```

Invalidation is by construction: the key contains the contract identity, so a contract change cannot
produce a stale hit — there is nothing to invalidate, only new keys. Plugin spaces cache under their
own `SpaceId`, so upgrading one plugin does not evict the application's schemas. The cache is
bounded and per-process; a cold process pays derivation once per distinct shape it actually uses.

### 11.6 Structured failures and framework integration

Validation failures are Standard Schema issues enriched with NetScript's structured diagnostic
shape: a dotted code, the `ObjectKey` or model/field path, the boundary at which the failure
occurred, and whether the failure is an input rejection (client error) or an output mismatch
(server/contract error). The distinction matters operationally: an input failure is a 4xx with field
paths; an output failure is a 5xx _and_ a signal that the database and the contract have diverged,
which is drift, not a request problem.

Integration follows NetScript's existing seams rather than new ones. `@standard-schema/spec` is
already a dependency of `@netscript/plugin` and `@netscript/sdk` `[OBSERVED]`, so contract-derived
schemas feed the existing oRPC-bound contract surface directly, and forms/SSR consume the same
schema instances per field path. NetScript does not re-export a validator library; a consumer
wanting Zod adapts from Standard Schema, which keeps doctrine AP-14 satisfied and keeps the
split-validator-module failure class out of the design entirely.

### 11.7 The optional AOT projection

An ahead-of-time projection may exist for cold-start-sensitive deployments, under three conditions
that make it an optimisation rather than a second source of truth:

1. **Atomic and content-addressed.** Emitted into a target-scoped root, keyed by contract identity,
   replaced atomically, never patched.
2. **Semantically equivalent.** A conformance case must assert that the AOT and runtime-derived
   schemas accept and reject an identical corpus, across every representation and a representative
   set of selection shapes. Divergence is a build failure, not a warning.
3. **Never the default and never required.** Any code path that works only with AOT artifacts
   present is a design failure; the runtime derivation must remain sufficient.

If condition (2) cannot be met mechanically, the AOT path is a mirror validator wearing a different
name and must be dropped.

---

## 12. Clean-break cutover

### 12.1 Transfer analysis: NetScript's oRPC pattern → Prisma's TypeScript contract builder

Before leaving the API architecture, one question deserves a direct answer, because NetScript has
already solved a structurally identical problem once and the temptation to copy the solution
wholesale is strong.

**The parallel.** NetScript's oRPC surface has exactly the shape the database contract surface will
have: a deeply-inferred upstream type system (`@orpc/contract`) that the framework composes, extends
per plugin, and binds at a composition root. `packages/contracts` (Archetype 1) exports `.`,
`./crud`, `./query`, and `./transform` over `@orpc/contract` and `zod` `[OBSERVED]`;
`packages/plugin` publishes a `./contract-base` subpath and depends on `@orpc/contract`,
`@orpc/server`, and `@standard-schema/spec` `[OBSERVED]`; `packages/service` and `packages/sdk`
consume the same axis `[OBSERVED]`; and `ContributionAxis` already carries a `'contract-version'`
member with a `PluginContractVersionContribution` abstract `[OBSERVED]`. Doctrine grants those
packages — and only those — the `--allow-slow-types` carve-out, precisely because deeply-inferred
contract types cannot be explicitly annotated
(`docs/architecture/doctrine/02-public-surface.md:217-242`) `[OBSERVED]`.

**What should transfer.**

1. **The `defineX` → frozen definition → composition-root binding pattern.** This is already
   NetScript's entry-verb vocabulary (`02-public-surface.md:73-82`) `[OBSERVED]` and it is the right
   shape for `defineTarget`/`defineSpace`/`defineDatabase`. Inference is preserved because the
   definition is a `const` whose type flows through `typeof`, exactly as oRPC contracts do today.
2. **Versioned contribution with skew detection.** The `contract-version` axis is the precedent for
   §6's pinned mirror and `db.space.skew`. NetScript has already accepted that a contribution
   carries a version that can diverge from what the consumer pinned.
3. **Standard Schema as the interop boundary.** `@netscript/contracts` already bridges oRPC and Zod
   through schema interop; the database contract's derived schemas plug into the same seam without
   any new bridging concept (§11.6).
4. **Per-package subpath discipline.** oRPC concerns are split across `./crud`, `./query`,
   `./transform` rather than one barrel. The database surface should split the same way, which F-5's
   20-symbol cap forces anyway.

**What must not transfer.**

1. **The slow-types carve-out must not be extended.** This is the most important line in this
   subsection. The oRPC carve-out is defensible because the inferred contract _is the product_ of
   those packages — consumers import `@netscript/contracts` specifically to obtain those types. The
   database case is different in kind: the inferred type is derived from _the application's own_
   contract, so no framework package ever needs to export it. Extending the carve-out would convert
   an application-local inference problem into permanent framework-wide publish debt, and doctrine
   is explicit that any other package setting `--allow-slow-types` "is a finding and must carry a
   debt entry" `[OBSERVED]`. The correct answer is the generated app-side binding (Part 1 §5.4), not
   a second exception.
2. **No `BaseDatabaseContract`-style cross-package base class.** Plugin `-core` packages extending
   `BaseContractRoute` sits in tension with AP-4, which forbids cross-package implementation
   inheritance and prescribes "registration against an extension axis instead"
   (`09-anti-patterns-and-fitness-functions.md:54-57`; `07-composition-and-extension.md:114-141`)
   `[OBSERVED]`. The database design has no legacy reason to inherit that tension; spaces register,
   they do not subclass.
3. **No wrapper around `defineContract` and no re-export of it from a kernel package.** Wrapping the
   upstream builder to "make it NetScript-flavoured" destroys the native inference that motivates
   using it, adds a translation layer with worse errors, and re-creates the second-DSL failure §10.1
   rejects. The builder is re-exported from the _provider_ package only, where provider-specific
   vocabulary belongs.
4. **No mirror of `packages/contracts` for the database.** A `@netscript/database-contracts` package
   holding CRUD/query/transform mirrors of database models would be the mirror-validator failure of
   §11.1 in a different costume.

**What is additionally required, because a database is not an RPC contract.** These have no analogue
in the oRPC pattern and are the reason the database surface needs its own machinery rather than a
copy:

| Requirement                                      | Why oRPC has no equivalent                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ownership disjointness over `ObjectKey` (V-2)    | Two RPC contracts declaring the same procedure name is a routing conflict caught at composition; two schemas owning one table is a silent data hazard. |
| Lineage coupling                                 | An RPC contract version can be published freely; a schema change implies a _data_ transition that must be planned, ordered, and verified.              |
| Physical identity separate from logical contract | An RPC contract has no target, namespace, or connection; a space must be bound to one target and one namespace.                                        |
| Lifecycle and scope                              | An oRPC contract has no lifetime. A database binding owns connections, close ordering, and request-versus-process scope (Archetype 3).                 |
| Destructive policy and consent                   | There is no destructive operation in publishing a contract.                                                                                            |
| Drift against live state                         | A contract cannot drift from a running server the way a schema drifts from a live database that another system also writes to.                         |
| Capability requirements                          | Every oRPC contract is expressible on every transport; a schema using `citext` is not expressible on every provider.                                   |

**Conclusion of the transfer analysis.** Reuse the composition, contribution, and interop
_patterns_; reuse none of the type-escape _mechanisms_; and add ownership, lineage, physical
identity, lifecycle, consent, drift, and capability as genuinely new concerns. The oRPC pattern is
the right template for how NetScript composes upstream type systems and the wrong template for how
it publishes them.

### 12.2 Cutover principles

- **No runtime compatibility, ever.** No Prisma 7 facade, no `setClient` lifecycle, no alias barrel,
  no dual client, no deprecated re-export. A compatibility shim would encode the old foundation's
  limits into the new layer, which is precisely the outcome the owner directive exists to prevent.
- **Data continuity is absolute.** The database is adopted, never rebuilt. Cutover must be possible
  on a production database with real data and no drop-and-recreate step anywhere in the sequence.
- **Parallel branching is a release-line concern, not a product-API concern.** The old and new
  stacks may coexist in the repository during the waves; they must never coexist in one
  application's composition.

### 12.3 The mechanical migration path

A one-shot importer, `netscript db adopt`, converts an existing project. It is a _tool_, not a
compatibility layer, and it is deleted after the migration window.

| Step | Operation                                                                                                                                                 | Mutates the database?      | Failure behaviour                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1    | Read `appsettings.json` targets, engine mapping, and the generated workspace layout                                                                       | No                         | Refuse on ambiguous or duplicate config keys                                                                    |
| 2    | Emit a proposed `database.ts` with one `defineTarget` per config key — **target ids taken from config keys, never from engine names**                     | No                         | Refuse when two config keys resolved to the same engine directory; require the author to name them              |
| 3    | Introspect each live target                                                                                                                               | No                         | Report unreachable targets; adoption can proceed offline for reachable ones only                                |
| 4    | Derive one space per detected owner: `app` for the base schema, one per installed plugin, inferred from the copied `schema/plugins/<plugin>/` directories | No                         | Objects that cannot be attributed are reported, not guessed                                                     |
| 5    | Emit the ownership proposal for review: every `ObjectKey` mapped to a space or to `external`/`adopted`                                                    | No                         | The author must resolve every unattributed object before continuing                                             |
| 6    | Compile the manifest and emit artifacts                                                                                                                   | No                         | Standard composition diagnostics                                                                                |
| 7    | Establish the baseline: write a lineage root node per space matching the _observed_ live state, and write the marker rows                                 | **Yes — marker rows only** | Idempotent; re-runnable; produces a receipt                                                                     |
| 8    | `verify`                                                                                                                                                  | No                         | Any diff at this point is a genuine finding: either an unattributed object or an incorrect ownership assignment |
| 9    | Cutover commit: delete `database/<engine>/`, its 30 generated tasks, the repair scripts, and the old package dependencies                                 | No                         | Reversible by reverting the commit                                                                              |

The critical property is **step 7 writes marker rows and nothing else**. No table is created,
altered, or dropped during adoption. That is what makes the migration safe on production data and
what makes step 9 the only irreversible-looking step — and it is reversible, because it touches only
the repository.

### 12.4 Data preflight and safety

Before step 7, a preflight report is mandatory and must be attached to the cutover PR: every target
with its reachability and provider version; every `ObjectKey` with its assigned owner and ownership
policy; every object the importer could not attribute; every capability the derived spaces require
against what each target actually provides; and every plugin whose copied fragment cannot be
attributed to an installed package. A preflight with unattributed objects is a hard stop — guessing
ownership is how a later `verify` proposes dropping a table someone else owns.

### 12.5 Rollback boundaries

| Point                            | Rollback                                        | Cost                                                                                  |
| -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| Before step 7                    | Delete generated artifacts                      | None; nothing was written                                                             |
| After step 7, before step 9      | Delete marker rows for the adopted spaces       | Trivial; markers are metadata                                                         |
| After step 9, before first apply | Revert the cutover commit                       | Repository-only; database untouched                                                   |
| After the first `apply`          | Forward-only, using the lineage and the receipt | Ordinary migration rollback semantics; the receipt identifies exactly which steps ran |

There is deliberately no "run both stacks" rollback. That option would require the compatibility
layer this design refuses, and it would double the failure surface during precisely the window when
the system is least understood.

### 12.6 Feature-parity accounting

The fourteen current verbs `[OBSERVED]` map as follows. Parity is claimed only where the new
operation is a superset; everything else is stated as a deliberate removal.

| Current verb | Disposition                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `add`        | Replaced by editing `database.ts`. Scaffolding becomes a code-mod, not a config rewrite plus helper regeneration.                |
| `list`       | `inventory` — superset: targets, spaces, ownership, capabilities, heads, drift status, as structured output.                     |
| `remove`     | Replaced by the space retirement protocol (§6.4). **Behaviour change:** removal produces a plan; it no longer deletes and hopes. |
| `init`       | `apply` against an empty baseline.                                                                                               |
| `generate`   | `emit` — **now `pure`**; never touches an orchestrator. This closes `DB-GENERATE-ASPIRE-COUPLING`.                               |
| `migrate`    | `plan` + `apply`, separated. **Behaviour change:** planning and applying are distinct operations with distinct policies.         |
| `seed`       | `mutating` operation with a receipt.                                                                                             |
| `status`     | `verify` + `inventory`, structured.                                                                                              |
| `studio`     | Retained as `resident`, but **must take an explicit target**; the `databases[0]` silent selection is removed.                    |
| `introspect` | `introspect`, feeding adoption.                                                                                                  |
| `reset`      | Retained, `mutating`, destructive-policy-gated; refused in `production` regardless of consent.                                   |
| `deploy`     | `apply` with a signed plan and `environment: production`.                                                                        |
| `validate`   | `compose` — a `pure` operation returning full diagnostics rather than first-error.                                               |
| `resolve`    | Replaced by explicit lineage operations against named nodes.                                                                     |

Two capabilities are removed on purpose and must be stated in the RFC as such: implicit target
defaulting (there is no primary-ish fallback anywhere), and silent single-target execution for
multi-target commands.

---

## 13. Implementation waves

Each wave lands independently and has a gate that can fail. No wave depends on a later wave.

| Wave                                                   | Scope                                                                                                                                                                                             | Depends on | Acceptance gate                                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **W0 — Doctrine and RFC**                              | Amend `06-archetypes.md` (Archetype 5 fragment rule; archetype table), add verdict rows in `10-codebase-verdict-and-handoff.md`, register the new packages in the gated denominator, land the RFC | —          | RFC accepted; `arch:check` discovers the new roots; doctrine drift (A9 "six archetypes" vs seven) resolved or explicitly deferred with a debt entry                            |
| **W1 — `@netscript/database-contract` (A1)**           | Identities, manifest schema, capability vocabulary, ownership vocabulary, diagnostic catalog, operation/receipt types, space descriptor, ports                                                    | W0         | A1 gate set; `deno publish --dry-run` **without** `--allow-slow-types`; `deno doc --lint`; F-5 ≤20 root exports; zero dependencies                                             |
| **W2 — `@netscript/database` (A4)**                    | `defineTarget`/`defineSpace`/`defineDatabase`, the pure compiler, all composition invariants V-1…V-8, diagnostics                                                                                 | W1         | A4 gate set; property test: compile is deterministic and total; every invariant has a negative test producing the right code; no IO reachable (AP-25 scan)                     |
| **W3 — `@netscript/database-prisma-postgres` (A2)**    | Capability descriptor, emitter, control adapter, runtime factory, `upstream.ts` facade, import allowlist                                                                                          | W1, W2     | A2 gate set + runtime gates; conformance suite green against a **real** PostgreSQL service; import-allowlist check; Deno import-purity check                                   |
| **W4 — `@netscript/database-runtime` (A3)**            | Binding, process/request scope, lifetimes, health, close ordering, `AbortSignal`, `{ stop() }`                                                                                                    | W1, W3     | **All F-1…F-19** and **required runtime gates**; leak test under repeated start/stop and request lifecycles; scope-type test proving request scope cannot cache                |
| **W5 — `@netscript/database-control` (A2)**            | classify/compose/plan/apply/verify/emit, locks, receipts, resume, expiry, partial success                                                                                                         | W1, W2, W3 | A2 gate set; negative-path matrix (§14); atomic-emission test; offline test proving `pure` never reaches an orchestrator                                                       |
| **W6 — `@netscript/database-testkit` (A6)**            | Provider conformance suite, space conformance suite, machine-readable report                                                                                                                      | W1, W3, W5 | A6 gate set + F-CLI rules; certifies W3 provider; a deliberately broken provider fixture must fail                                                                             |
| **W7 — `@netscript/plugin` contribution surface (A4)** | `defineDatabaseSpace`; remove `PluginDbSchemaContribution`/`PluginMigrationContribution`; adjust `ContributionAxis`                                                                               | W1, W6     | A4 gate set; **breaking-change accounting for a published package**; consumer import validation                                                                                |
| **W8 — CLI + agent surface (A6)**                      | `db` verbs as projections; generated agent manifest; adoption tool                                                                                                                                | W5, W6     | A6 gate set; every generated example compiles and runs; command/diagnostic catalogs match machine output                                                                       |
| **W9 — First-party plugin migration (A5)**             | Convert `auth`, `workers`, `sagas`, `triggers` to spaces; namespace their objects; declare capabilities                                                                                           | W7, W8     | A5 gate set + **required runtime gates**; each plugin passes the space conformance kit; `@db.Uuid`-class provider locks now declared                                           |
| **W10 — Cutover**                                      | Adoption tool applied; delete `database/<engine>/`, the 30 tasks, the repair scripts, the old packages                                                                                            | W8, W9     | Release-gate class (DB wiring + scaffold output + Aspire helper generation all change); full `scaffold.runtime` E2E; production-shaped adoption rehearsal on a seeded database |

Retirement of `@netscript/prisma-adapter-mysql` and `@netscript/database` happens in W10, not
earlier: they must keep working until the last consumer moves.

---

## 14. Conformance matrix

This is the artifact that makes "adoption is gated by NetScript proof, not by an upstream label"
operational. Each row is a required, independently-failing case.

### 14.1 Type, plan, artifact, result, and lifecycle

| #    | Case                                                                                             | Passes when                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| T-1  | Space requires a capability the bound target lacks                                               | Composition fails, `db.compose.capability.missing`, names capability + space + target                      |
| T-2  | Space bound to an undeclared target id                                                           | **Type error** at the authoring site, not a runtime diagnostic                                             |
| T-3  | Two spaces own one `ObjectKey`                                                                   | `db.compose.ownership.conflict` naming both spaces                                                         |
| T-4  | Cyclic `dependsOn`                                                                               | `db.compose.dependency.cycle` with the cycle path                                                          |
| T-5  | Cross-target relation declared                                                                   | Refused at composition with a next-action, never emitted                                                   |
| T-6  | Type surface, plan, emitted SQL, and result agree for a non-trivial feature (e.g. null-ordering) | All four consistent — this is the case that catches "published type ignored at runtime"                    |
| T-7  | Request-scoped session used after disposal                                                       | Type-level prevention where possible; runtime error otherwise                                              |
| T-8  | Interactive transaction handle escapes its callback                                              | Rejected; `tx` must not expose transaction-opening members (repairs the observed `withTransaction` defect) |
| T-9  | Every operation returns a typed result                                                           | No code path returns a bare number or relies on an exit code                                               |
| T-10 | Artifact postconditions asserted                                                                 | Every receipt's `ArtifactAssertion` matches the filesystem                                                 |

### 14.2 Deterministic and atomic emission

| #   | Case                                              | Passes when                                                        |
| --- | ------------------------------------------------- | ------------------------------------------------------------------ |
| E-1 | Emit twice from a clean checkout                  | Byte-identical artifacts and identical `ManifestDigest`            |
| E-2 | Emit two targets concurrently into distinct roots | Both succeed; no interleaving                                      |
| E-3 | Emit interrupted mid-write (SIGKILL)              | Artifact root is either fully old or fully new; never half-patched |
| E-4 | Schema edited without re-emitting                 | `db.artifact.stale` at bind time, naming the exact command         |
| E-5 | Manifest digest recorded in every artifact root   | Present and matching (V-8)                                         |
| E-6 | CI re-run with an unchanged digest                | Emission skipped; recorded digest asserted instead                 |

### 14.3 Migration and failure

| #    | Case                                                     | Passes when                                                                                 |
| ---- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| M-1  | Greenfield apply                                         | Succeeds with a full receipt                                                                |
| M-2  | Adoption of an existing populated database               | Marker rows only; zero DDL; `verify` clean                                                  |
| M-3  | Drift introduced externally                              | `db.verify.drift` classifies managed vs adopted vs external correctly                       |
| M-4  | Destructive change under `destructive: 'deny'`           | Refused with the destructive operation list                                                 |
| M-5  | Destructive change in `production` with an unsigned plan | Refused regardless of interactive consent                                                   |
| M-6  | Plan applied after the manifest changed                  | `db.plan.stale`                                                                             |
| M-7  | Plan applied after `planMaxAgeMs`                        | `db.plan.expired`                                                                           |
| M-8  | Apply fails mid-run                                      | Receipt shows the exact failed step; `resume` continues and re-validates the baseline first |
| M-9  | Two concurrent applies on one target                     | Second gets `db.apply.lock.held` with owner and TTL; no interleaved DDL                     |
| M-10 | Lock holder dies                                         | TTL/fencing releases; no permanent wedge                                                    |
| M-11 | Data transform with an unsatisfied invariant             | Fails and reports remaining work; does not advance the head                                 |
| M-12 | Non-default namespace                                    | All operations honour it; a silently ignored schema selector is a failure                   |
| M-13 | Two same-provider targets                                | Fully isolated output, lineage, markers, receipts                                           |
| M-14 | Migration on Windows                                     | Runs — **explicitly required**, since the current fixture refuses non-Linux `[OBSERVED]`    |

### 14.4 Plugin lifecycle

| #    | Case                                              | Passes when                                                                 |
| ---- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| P-1  | Two plugins, one target, declared ordering        | Applied in topological order recorded in the manifest                       |
| P-2  | Plugin object-name collision across spaces        | Namespaced and non-conflicting; no lexical prefix convention required       |
| P-3  | Cross-space foreign key along a declared edge     | Allowed; without the edge, refused                                          |
| P-4  | Plugin upgrade with a lineage step                | Head advances for that space only                                           |
| P-5  | Installed package digest ≠ mirror digest          | `db.space.skew` with both digests                                           |
| P-6  | Apply/verify with **no plugin package installed** | Succeeds from the pinned mirror alone                                       |
| P-7  | Uninstall with retention                          | Objects retained; ownership downgraded to `adopted`; verify still sees them |
| P-8  | Uninstall with a dependent space installed        | Refused, naming the dependent                                               |
| P-9  | Uninstall with `drop`                             | Requires explicit consent and produces a destructive plan                   |
| P-10 | Plugin declares a capability its target lacks     | Install refused at composition (the `@db.Uuid`-class case)                  |
| P-11 | Augmentation outside a granted axis               | Refused, naming the grant that would be required                            |
| P-12 | Upstream extension owning its own space           | Recorded as `external`; not reported as drift                               |

### 14.5 Real PostgreSQL, Deno/import purity, generated projects, journeys, CI/release

| #   | Case                                                                                     | Passes when                                                                                                         |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| R-1 | Full runtime suite against a **real** PostgreSQL service                                 | CRUD, relations, raw, codecs, transactions, prepared statements, streaming, cancellation all pass — not an emulator |
| R-2 | Connection injection and external pool                                                   | Behaves under concurrency; no query serialisation surprise                                                          |
| R-3 | Error mapping and secret redaction                                                       | Connection strings and passwords never appear in diagnostics, receipts, or logs                                     |
| D-1 | Deno import graph of runtime paths                                                       | No undeclared Node globals; no CLI/toolchain module reachable                                                       |
| D-2 | Packed-artifact install into a blank fixture                                             | Every used export and peer resolves exactly once                                                                    |
| D-3 | Deep-import allowlist                                                                    | Any new upstream deep import fails the build                                                                        |
| D-4 | `deno publish --dry-run` on every new package                                            | Passes **without** `--allow-slow-types`                                                                             |
| G-1 | Generated project type-checks and starts                                                 | Scaffold → emit → apply → run, unattended                                                                           |
| G-2 | `emit` in a container with no Aspire CLI, no .NET, no Docker                             | Succeeds                                                                                                            |
| J-1 | Journey: scaffold → add second same-provider target → add two plugins → migrate → deploy | No manual step, no hand-edited generated file                                                                       |
| J-2 | Journey: adopt an existing populated project (§12.3)                                     | Preflight clean; zero DDL; verify clean                                                                             |
| N-1 | Every diagnostic code has a negative test                                                | Each code is reachable and carries a `nextAction`                                                                   |
| N-2 | No gate asserts on human-readable message text                                           | Gates assert on codes and structured results only (repairs the observed string-matching fixture)                    |
| C-1 | Release-gate class                                                                       | Full `scaffold.runtime` E2E green on the cutover                                                                    |
| C-2 | Agent surface                                                                            | Every generated example compiles and executes; catalogs match machine output                                        |

---

## 15. Risks, findings, unresolved decisions, and checkpoints

### 15.1 Severity-tagged findings against the current research and plan

| #    | Severity     | Finding                                                                                                                                                                                                                                                      | Consequence if unaddressed                                                                                                                         |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1  | **Critical** | `isolatedDeclarations: true` is repo-wide `[OBSERVED]` and the `--allow-slow-types` carve-out covers only oRPC-bound packages `[OBSERVED]`. No research document mentions either.                                                                            | The RFC would propose a package that cannot be published, discovered during implementation rather than at plan lock.                               |
| F-2  | **Critical** | The plan's archetype set (A1/A2/A4/A5/A6) omits Archetype 3, but the runtime half owns lifecycle and scope `[OBSERVED:`06-archetypes.md:78-83`]`.                                                                                                            | All F-1…F-19 and _required_ runtime gates are silently dropped from the gate set.                                                                  |
| F-3  | **High**     | The clean break removes published surface from `@netscript/plugin`: `PluginDbSchemaContribution`, `PluginMigrationContribution`, and two `ContributionAxis` members `[OBSERVED]`, none of which has any implementation `[OBSERVED]`. Not scoped anywhere.    | An unplanned breaking change to a second Archetype-4 package, discovered late.                                                                     |
| F-4  | **High**     | Doctrine currently _codifies_ the model being removed: plugin schema contributions "are plain `*.prisma` files… They do not contain a private workspace" (`06-archetypes.md:209-211`) `[OBSERVED]`. Amending doctrine is itself an RFC trigger `[OBSERVED]`. | The RFC contradicts doctrine it never amends; `arch:check` and the RFC disagree.                                                                   |
| F-5  | **High**     | Live defect the audit does not surface: plugin fragments use PostgreSQL-only `@db.Uuid` `[OBSERVED]` while the installer's target chain ends `?? databases[0]`, escaping the `enabled` filter `[OBSERVED]`.                                                  | The capability model is argued abstractly when a concrete reproducible defect could anchor it.                                                     |
| F-6  | **High**     | `execute(): Promise<number>` `[OBSERVED]` means receipts are not additive — the return type makes structured reporting impossible. The audit presents this as missing behaviour.                                                                             | Sequencing error: "add receipts" is planned as a slice when it is a replacement of the operation contract.                                         |
| F-7  | **Medium**   | `withTransaction` types its callback parameter as the full `Client` `[OBSERVED]`, so `tx.$transaction` type-checks inside an interactive transaction. The audit's "structurally-cast" understates a type-level correctness defect.                           | A known-unsound signature is carried forward as merely inelegant.                                                                                  |
| F-8  | **Medium**   | `packages/database` declares **zero** dependencies `[OBSERVED]` — upstream independence is achieved by duck typing, not by design.                                                                                                                           | The RFC must state how the provider obtains _real_ types without re-exporting them; otherwise the new design silently re-adopts structural typing. |
| F-9  | **Medium**   | `DatabaseConfigSchema` hardcodes a `zodGenerator` block and accepts provider aliases (`postgresql\|postgres`, `mssql\|sqlserver`) `[OBSERVED]`, and `mapEngine` normalises again `[OBSERVED]`.                                                               | A validator choice is baked into the core config vocabulary, and there are two normalisation sites for one concept.                                |
| F-10 | **Medium**   | `mapEngine`'s `switch` over the engine union selecting providers `[OBSERVED]` is doctrine AP-24, whose canonical counter-example is literally a database-engine switch `[OBSERVED]`.                                                                         | A live doctrine violation goes uncited in the RFC's motivation.                                                                                    |
| F-11 | **Medium**   | The merge-readiness migration fixture refuses to run outside Linux and asserts on the literal string `'created no migration artifact'` `[OBSERVED]`.                                                                                                         | The gate proving the most expensive historical repair neither covers the platform where the schema-engine hangs occurred nor survives a reword.    |
| F-12 | **Medium**   | Five of six specialist sub-agents returned nothing (§1.2). The Prisma numeric claims, the ADR coverage, the 30-fix-commit count, the ~9,175-line figure, and the control/runtime signatures are `[CARRIED — NOT RE-VERIFIED]`.                               | The RFC would cite unverified figures as evidence.                                                                                                 |
| F-13 | **Low**      | The plan's validation table has no gate that re-proves numeric research claims.                                                                                                                                                                              | Nothing catches F-12.                                                                                                                              |
| F-14 | **Low**      | The plan's risk register lacks "the upstream seam moves during the RFC's own authoring window" — which has already happened (post-RC CLI/config unification) `[CARRIED — NOT RE-VERIFIED]`.                                                                  | The mitigation (§8.3) is not tracked as a risk.                                                                                                    |
| F-15 | **Low**      | Doctrine drift: A9 says "six archetypes" while seven exist `[OBSERVED]`.                                                                                                                                                                                     | Minor, but the RFC touches this file and should not silently inherit it.                                                                           |

### 15.2 Failure-mode ledger

| Failure mode                                          | Structural prevention                                              | Proven by                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| Two logical databases collapsed into one directory    | Target id is declared; V-6 forbids shared roots                    | T-3, M-13                            |
| Wrong or ambiguous target selected implicitly         | No fallback chain anywhere; explicit target sets                   | T-2, feature-parity removals (§12.6) |
| Client constructed in the wrong order                 | No `setClient`; the runtime owns construction                      | W4 gates                             |
| Stale generated types compiled against                | Digest recorded in every artifact root; bind refuses a mismatch    | E-4, E-5                             |
| Success reported without artifacts or state           | Typed results plus `ArtifactAssertion` postconditions              | T-9, T-10                            |
| Unversioned fragment copied without analysis          | Spaces with capability requirements and ownership                  | P-10, P-11                           |
| Adding an engine requires editing switches everywhere | Typed provider registry populated at the composition root          | F-10 remediation                     |
| Aspire/Docker required for pure compilation           | Operation classification; `pure` gets no connection resolver       | G-2                                  |
| Generated text patched as a permanent shim            | I-5; no repair step exists                                         | E-1, E-3                             |
| Plugin schema silently absent                         | Pinned mirror is the source; apply works with no package installed | P-6                                  |
| Read-only command kills the resident host             | Only `resident` operations bind a resident graph                   | §7.2                                 |
| Cross-target apply falsely described as atomic        | `partially-succeeded` is a first-class outcome (I-9)               | M-8                                  |
| Secret leakage through connection parsing             | Redaction is a conformance case                                    | R-3                                  |
| Agent instructions drift from reality                 | Generated from the manifest; every example executed                | C-2                                  |

### 15.3 Rejected alternatives

| Alternative                                                         | Rejected because                                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Keep `DatabaseGraph` as a live runtime object                       | It is a service locator with a domain name; the durable artifact is a manifest value (Part 1 §2.1).                             |
| One `@netscript/database` package holding DSL, runtime, and control | Two incompatible gate profiles and dependency needs; doctrine's "one archetype per package" is satisfied by splitting packages. |
| Re-export the provider's runtime type from a framework package      | Blocked by `isolatedDeclarations` + slow-types, and by AP-14.                                                                   |
| Extend the `--allow-slow-types` carve-out to the database packages  | Converts an application-local inference problem into permanent framework publish debt (§12.1).                                  |
| A NetScript model DSL that lowers to the upstream contract          | A third schema language, permanently lagging, with translated error messages (§10.1).                                           |
| Mirror-validator codegen from the contract                          | Combinatorially impossible for selection-aware output validation, and it re-creates the repair pipeline (§11.1–11.2).           |
| Port `@netscript/prisma-adapter-mysql` forward                      | Re-imports the hand-maintained low-level driver surface the redesign exists to remove (§9.4).                                   |
| Wait for upstream to close the operational gaps                     | Gates adoption on someone else's roadmap; the gaps are NetScript's to own anyway (§8.2).                                        |
| A compatibility facade during cutover                               | Doubles the failure surface in the least-understood window; contradicts the owner directive (§12.5).                            |
| Universal output validation                                         | Gets disabled wholesale in production, which is worse than precise boundaries (§11.4).                                          |

### 15.4 Unresolved and conditional decisions

These must be recorded in the RFC as conditional on Prisma 8 **final**, not resolved by the RC.

| #    | Decision                                                                               | Conditional on                                                                                                |
| ---- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| U-1  | Whether validation can be derived from contract runtime data without a generation step | The maintainer-exchange hypothesis proven by NetScript's own conformance run; if false, revisit §11 wholesale |
| U-2  | The exact control-API package path and option shapes                                   | Post-RC churn settling; contained by §8.3 but not eliminated                                                  |
| U-3  | Contract format version and hash representation                                        | Explicitly still moving; NetScript records its own digest meanwhile                                           |
| U-4  | Whether the contingency control backend is ever needed                                 | Built and CI-exercised regardless; promotion decided at GA                                                    |
| U-5  | SQLite's capability set                                                                | Requires conformance measurement, not the upstream scorecard                                                  |
| U-6  | MySQL strategy                                                                         | Retire-and-defer recommended; revisit if a requirement lands before an upstream target                        |
| U-7  | Whether an AOT validation projection ships at all                                      | Only if semantic equivalence is mechanically provable (§11.7)                                                 |
| U-8  | Advisory-lock strategy per provider                                                    | Native lock vs ledger row with fencing, decided per certified provider                                        |
| U-9  | Whether `@netscript/database-testkit` is A6 or folds into `./testing` subpaths         | Depends on whether it ships a runnable binary                                                                 |
| U-10 | Plan signing mechanism and key custody                                                 | Out of scope here; required before W10 production use                                                         |

### 15.5 Kill-switch criteria

Adoption of Prisma 8 as the first provider should be abandoned, and the provider port satisfied by a
different implementation, if any of these hold at GA:

- The Deno import graph cannot be made clean without vendoring or patching upstream (D-1 unfixable).
- `deno publish --dry-run` cannot pass on the provider package without `--allow-slow-types` (D-4).
- Emission is not deterministic (E-1) or not atomic (E-3) and upstream will not make it so.
- Per-space markers or ledger coupling cannot be made transactional on PostgreSQL (M-9, M-11).
- Contract format changes without a migration path more than once between GA and the first NetScript
  release that depends on it.

The design survives all five because the provider is a leaf behind a port — which is the point of
§8.3. The kill switch costs a provider, not an architecture.

### 15.6 Decision checkpoints for plan lock

The supervisor can treat these as a tick-list before locking the Plan-Gate:

1. Accept or reject the manifest-over-live-graph reframing (Part 1 §2.1).
2. Accept the seven/nine-package split and the per-package archetype assignments, including
   **Archetype 3** for the runtime package (F-2).
3. Confirm that no published package will export a contract-typed value, and that the typed binding
   is generated app-side (F-1).
4. Add the `@netscript/plugin` breaking-change scope to the plan (F-3).
5. Add the doctrine amendment (`06-archetypes.md` Archetype 5 + archetype table + verdict table) to
   the RFC scope (F-4).
6. Add a claim-ledger gate that re-proves every numeric research claim before the RFC cites it
   (F-12, F-13).
7. Decide `expose / wrap / translate` for the upstream TypeScript schema builder — recommended:
   expose for entities, wrap at the composition seam, translate nothing (§10.1).
8. Decide the validation default — recommended: runtime-derived, memoised by contract identity, with
   mirror codegen explicitly rejected (§11.1).
9. Decide the MySQL disposition — recommended: retire and defer (§9.4).
10. Approve the operational-layer ownership split (§8.2), which is the largest scope decision here.
11. Confirm the cutover has no compatibility layer and that adoption writes marker rows only
    (§12.3).
12. Record U-1…U-10 as conditional on Prisma 8 final.

### 15.7 Implementation blockers

- **B-1.** Plan signing and key custody (U-10) block W10 production use, not earlier waves.
- **B-2.** A real PostgreSQL service in CI blocks W3's acceptance gate; PGlite or an emulator does
  not satisfy R-1.
- **B-3.** Windows coverage for migration operations (M-14) needs a runner; without it, the
  historical schema-engine failure class stays unproven.
- **B-4.** The maintainer-exchange hypothesis (U-1) blocks finalising §11's default, though the
  Standard Schema boundary is safe either way.

---

## 16. Source register and recommendation

### 16.1 Local sources verified in this session `[OBSERVED]`

| Path                                                                              | Used for                                                                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `deno.json` (root)                                                                | `isolatedDeclarations: true`; workspace globs; `arch:check`, `quality:scan`, `publish:dry-run`, `doc:lint` tasks |
| `packages/database/deno.json`                                                     | 10 exports; **zero** dependencies                                                                                |
| `packages/database/mod.ts:128-140`                                                | `withTransaction` cast and callback typing                                                                       |
| `packages/database/scripts/`                                                      | `patch-prisma-client.ts`, `migrate.ts`, `fix-zod-imports.ts`, `generate-zod.ts` published via `./scripts`        |
| `packages/plugin/src/domain/constants.ts:16-26`                                   | `ContributionAxis` closed union incl. `database-schema`, `migration`                                             |
| `packages/plugin/src/abstracts/plugin-db-schema-contribution.ts`                  | `path`, optional `engine` union                                                                                  |
| `packages/plugin/src/abstracts/plugin-migration-contribution.ts`                  | `name`, `path`                                                                                                   |
| repo-wide grep for those abstracts                                                | Zero implementations                                                                                             |
| `packages/config/src/domain/schemas/database-schema.ts`                           | Provider aliases; `zodGenerator` in core config                                                                  |
| `packages/cli/src/public/features/db/db-group.ts:32-53`                           | The fourteen verbs                                                                                               |
| `packages/cli/src/kernel/adapters/database/workspace-resolver.ts:50`              | `join('database', provider.dirName)`                                                                             |
| `…/workspace-resolver.ts:71-88`                                                   | `resolveTarget` single-target defaulting                                                                         |
| `…/workspace-resolver.ts:96+`                                                     | `mapEngine` switch (AP-24)                                                                                       |
| `packages/cli/src/kernel/adapters/database/operation-runner.ts:85-107`            | `Promise<number>`; `studio → databases[0]`; fail-fast loop                                                       |
| `packages/cli/src/kernel/adapters/plugin/db-integration.ts:101-105, 275-300`      | Target chain ending `?? databases[0]`; `as DbEngine` cast                                                        |
| `packages/cli/src/kernel/adapters/plugin/prisma-schema-writer.ts:133`             | Normalised-body collision policy                                                                                 |
| `packages/cli/e2e/…/verify-db-migration-artifacts.ts`                             | Linux-only guard; literal-string assertion                                                                       |
| `packages/cli/e2e/…/database-gates.ts`                                            | `GATE.DATABASE_*` command gates                                                                                  |
| `plugins/{auth,workers,sagas,triggers}/database/*.prisma`                         | `@db.Uuid`/`@db.VarChar`/`@db.Text`; unprefixed vs prefixed names                                                |
| `plugins/workers/scaffold.plugin.json`                                            | `hasDatabaseMigrations` boolean; `dependencies: ["streams"]`                                                     |
| `packages/{contracts,plugin,service,sdk}/deno.json`                               | oRPC + `@standard-schema/spec` topology                                                                          |
| `docs/architecture/doctrine/01-thesis-and-axioms.md`                              | A1–A14                                                                                                           |
| `docs/architecture/doctrine/02-public-surface.md:73-138, 217-242`                 | Entry verbs; subpaths; slow-types carve-out                                                                      |
| `docs/architecture/doctrine/05-folder-structure.md`                               | Layering law; folder vocabulary                                                                                  |
| `docs/architecture/doctrine/06-archetypes.md`                                     | Archetypes 1–7; `:209-211` fragment rule; `:374-411` table                                                       |
| `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`            | AP-3, AP-4, AP-14, AP-18, AP-24, AP-25; F-1…F-19                                                                 |
| `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:37, 50, 90-95`     | Verdicts; the 36-path gated denominator                                                                          |
| `.llm/harness/archetypes/README.md:23-26`                                         | One-archetype-per-package law                                                                                    |
| `.llm/harness/gates/archetype-gate-matrix.md`                                     | Gate columns; release-gate class                                                                                 |
| `.llm/harness/gates/plan-gate.md:18-40`                                           | Plan-Gate checklist                                                                                              |
| `.llm/harness/debt/arch-debt.md`                                                  | `AP-17` on `packages/database`; `DB-GENERATE-ASPIRE-COUPLING`; auth roadmap R1                                   |
| `rfcs/README.md`, `rfcs/0000-template.md`, `rfcs/0003-command-composition-kit.md` | RFC triggers, front-matter, section structure, implementation-grade reference                                    |

### 16.2 Sources carried from the committed research `[CARRIED — NOT RE-VERIFIED]`

The Prisma 8 primary-source register in `research/prisma-8-deep-dive.md` — RC tag `v8.0.0-rc.1`
(`a76a6c5`), post-RC `main` (`71e2e0d`), the RC scorecard, ADRs 176/212/242, the control-API and
PostgreSQL runtime sources, the project skill, supported-versions and serverless docs, and the
upstream issue/PR ledger — plus the market comparators in `research/market-analysis.md`. The
owner-provided maintainer exchange is treated as primary exploratory evidence for U-1. Every figure
drawn from these must pass the claim-ledger gate (F-12/F-13) before the RFC cites it. Where this
report needed a number I used the supervisor's corrected values: `^7.8.0` root ranges, `^7.4.2` in
generated templates, 30 generated database tasks, TypeScript 5.9 as an **optional** peer, and
roughly 138 top-level `@prisma/orm-postgres` export keys. No skill-count totals are relied upon
anywhere in this report.

### 16.3 Recommendation

Proceed, with three amendments to the plan before Plan-Gate lock.

The research's direction is sound and the Prisma 8 integration thesis holds: adopt the contract,
space, and lineage _semantics_; own the _operational_ layer; keep the provider a replaceable leaf.
The design that follows is smaller than the system it replaces because it refuses to abstract the
query surface — that refusal is what keeps NetScript from building a second ORM, and it should be
stated in the RFC as a non-goal rather than left implicit.

The three amendments are not stylistic. **First**, reframe the central abstraction from a live graph
to a compiled manifest; this changes what gets published and what stays internal. **Second**, add
Archetype 3 and its mandatory runtime gates; without it the plan's gate set is incomplete by
construction. **Third**, record the `isolatedDeclarations`/slow-types constraint as a first-class
design input; it decides where the typed binding lives, and discovering it during implementation
would invalidate a package boundary after the RFC is accepted.

One caution on the evidence base. Five of six specialist lanes in this session returned nothing, so
a meaningful share of the Prisma-side detail in the committed research remains unverified by any
independent pass. The architecture in this report does not depend on those figures — it depends on
the upstream _shape_, which is corroborated by multiple independent descriptions — but the RFC will
cite them, and it should not do so until the claim-ledger gate has run. That is the cheapest
remaining risk to retire before locking the plan.
