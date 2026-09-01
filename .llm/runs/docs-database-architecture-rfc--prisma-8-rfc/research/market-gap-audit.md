# Independent Market-Analysis Gap Audit

Provenance: independent delegated audit, current 2026-08-13, using official/primary sources only.

Read-only audit completed against the existing `market-analysis.md`, current as of 2026-08-13. No
repository files were changed during the audit.

## Executive corrections

The omitted products materially change the market conclusions:

- Flyway and Liquibase establish that migration ledgers, checksums, locks, repair, rollback
  previews, and partial-failure handling are mature prior art. NetScript’s differentiation is not
  inventing those mechanics; it is composing them across stable targets and contributor-owned spaces
  with typed runtime validation.
- Terraform is useful mainly as negative and recovery prior art. Terraform state is a mutable
  binding database, not a manifest or receipt; its apply is not transactional; saved plans are
  opaque and sensitive; and targeted apply is explicitly exceptional.
- Pulumi strengthens the checkpoint/unknown-outcome lesson, but also shows the operational cost of
  transactional state backends. Its saved update plans remain experimental and are checked
  incrementally during execution.
- Bytebase is a persistent database control plane, not a local framework library. Most of its
  impressive features depend on server-side plans, issues, IAM, stages, tasks, schedulers, and
  metadata. Importantly, Bytebase removed schema drift detection in version 3.14.0 in January 2026.
- ZenStack v3 is the closest omitted comparator for schema/runtime composition. It explicitly
  imports schema files into one AST, has preview schema/CLI/runtime plugins, and derives
  selection-shaped Zod validators from its runtime schema. But it does not provide contributor-owned
  migration spaces, Standard Schema neutrality, or plugin removal/retention semantics.
- No further comparator clears the “truly essential” bar. Kubernetes controllers/finalizers could
  add recovery vocabulary, but would pull the RFC toward a continuous reconciler—the exact
  control-plane expansion NetScript should avoid.

The current matrix’s “Proposed NetScript = Strong everywhere” row should be removed. All proposed
capabilities are design targets, and contributor removal remains conditional on NetScript policy
plus upstream conformance.

## Comparator findings

### Flyway

Architecture and mechanics:

- The Java API centers on `Flyway.configure().dataSource(...).load()` and methods such as
  `migrate()`. The CLI exposes `migrate`, `info`, `validate`, `repair`, `baseline`, and
  edition-gated `undo`, dry-run, drift, and schema-comparison commands.
  [Java API](https://documentation.red-gate.com/flyway/reference/usage/api-java),
  [command inventory](https://documentation.red-gate.com/flyway/reference/commands)
- Recursively scanned `locations` provide SQL or classpath Java migrations. All locations feed one
  resolved migration sequence and one schema-history table; they are not independent owner
  histories.
  [Locations](https://documentation.red-gate.com/flyway/reference/configuration/flyway-namespace/flyway-locations-setting)
- The history table records version, description, checksum, installer, duration, success, and states
  including `Pending`, `Success`, `Failed`, `Missing`, `Future`, `Out of Order`, `Outdated`, and
  `Superseded`. Flyway explicitly warns that replay after an out-of-order migration may differ.
  [Schema history table](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/flyway-schema-history-table)
- `validate` compares available migrations against applied metadata and checksums. `repair` deletes
  failed ledger entries, aligns metadata/checksums, and marks missing migrations deleted. It does
  not clean user objects left by a failed non-transactional migration, and it must use the same
  locations as `migrate`.
  [Repair](https://documentation.red-gate.com/flyway/reference/commands/repair)
- Flyway locks before migration, retrying once per second; the current default is 50 attempts, with
  `-1` meaning indefinitely. Native Connectors currently do not implement this locking.
  [Lock retry](https://documentation.red-gate.com/flyway/reference/configuration/flyway-namespace/flyway-lock-retry-count-setting)
- Migrations are normally transactional where the database permits it. `group=true` can place all
  pending migrations in one transaction, but only on transactional-DDL databases; callbacks are
  excluded and Native Connectors do not support this transaction mode.
  [Group transaction](https://documentation.red-gate.com/flyway/reference/configuration/flyway-namespace/flyway-group-setting)
- PostgreSQL uses transactional advisory locking by default; `CREATE INDEX CONCURRENTLY` may require
  session-level locking instead.
  [PostgreSQL behavior](https://documentation.red-gate.com/flyway/reference/database-driver-reference/postgresql-database)
- Extension hooks include Java migrations, lifecycle callbacks, and custom `MigrationResolver` plus
  `MigrationExecutor` pairs. These add executable migration formats and behavior, not typed schema
  contributions or ownership spaces.
  [API hooks](https://documentation.red-gate.com/flyway/reference/usage/api-java/api-hooks)

DX strengths:

- Extremely legible operational model.
- Same lifecycle available from CLI, build tools, and Java API.
- Explicit status vocabulary and machine-readable command results.
- Honest transaction and cleanup caveats.

Failure modes and NetScript lessons:

- Never let “repair ledger” imply “repair database.” Record cleanup-required and outcome-unknown
  states separately.
- A lock capability must be part of target conformance; unsupported connectors cannot silently
  proceed.
- Out-of-order/cherry-picked application can make fresh replay differ. Selective operations must be
  recovery-only or produce a mandatory full verification.
- Multiple locations do not create ownership. NetScript spaces need stable IDs, independent heads,
  dependency edges, overlap detection, and removal policy.
- Drift checking and dry-run facilities are edition-gated. NetScript’s local safety baseline should
  not depend on reproducing Redgate’s complete comparison product.

### Liquibase

Architecture and mechanics:

- A root changelog in XML, YAML, JSON, or formatted SQL includes changesets and other changelogs.
  `includeAll` recursively includes files in alphabetical order unless a custom comparator is
  installed.
  [includeAll](https://docs.liquibase.com/secure/reference-guide-5-0/changelog-attributes/includeall)
- A changeset is identified by `id + author + filepath`. `logicalFilePath` stabilizes identity
  across moves and can prevent module collisions, but module files still share one changelog
  execution model and ledger.
  [logicalFilePath](https://docs.liquibase.com/secure/reference-guide-5-1-1/changelog-attributes/logicalfilepath)
- `DATABASECHANGELOG` stores each execution, checksum, execution type, order, contexts, labels, and
  deployment ID. A deployment ID groups changesets from one update run.
  [DATABASECHANGELOG](https://docs.liquibase.com/community/user-guide-5-0-2/what-is-the-databasechangelog-table)
- `DATABASECHANGELOGLOCK` is a single-row database lock. Concurrent updaters wait; an unclean exit
  can leave it set, requiring `release-locks`.
  [Lock table](https://docs.liquibase.com/pro/user-guide-4-33/what-is-the-database-changelog-lock-table)
- `update-sql` previews generated SQL but explicitly does not establish correctness or predict
  deployment errors. It is not an apply-bound plan artifact.
  [update-sql](https://docs.liquibase.com/secure/reference-guide-5-2-1/init-update-and-rollback-commands/update-sql)
- Changesets run in a transaction by default where possible. With `runInTransaction=false`, a
  mid-changeset failure can leave both the database and `DATABASECHANGELOG` inconsistent.
  [runInTransaction](https://docs.liquibase.com/secure/reference-guide-5-1/changelog-attributes/runintransaction)
- Checksums reject unexpected edits; `runOnChange` deliberately re-executes changed definitions.
  [runOnChange](https://docs.liquibase.com/reference-guide/changelog-attributes/runonchange)
- Rollback can target a tag, date, count, changeset, or deployment ID depending on edition. Rows are
  removed from the active changelog ledger during rollback; newer history facilities preserve a
  fuller audit. Rollback SQL is often author-supplied and can lose data.
  [Rollback commands](https://docs.liquibase.com/community/reference-guide-5-0/init-update-and-rollback-commands/what-are-rollback-commands)
- `diff`, `snapshot`, and `diff-changelog` compare databases or snapshots. This is explicit
  inspection, not Terraform-style continuous state reconciliation. Machine-readable drift reporting
  and richer object coverage vary by edition.
  [Inspection commands](https://docs.liquibase.com/secure/reference-guide-5-2-1/database-inspection-change-tracking-and-utility-commands/what-are-database-inspection-commands)
- Liquibase’s Java extension surface is broad: database types, changelog formats, changes,
  executors, preconditions, snapshot generators, SQL generators, and resource handlers. Java
  `ServiceLoader` discovers implementations; priority selects the applicable implementation.
  `customChange` can execute code or generate SQL.
  [Extension anatomy](https://contribute.liquibase.com/extensions-integrations/extensions-overview/extension-anatomy/),
  [extension points](https://contribute.liquibase.com/extensions-integrations/extension-guides/),
  [customChange](https://docs.liquibase.com/secure/reference-guide-5-0/change-types/customchange)

DX strengths:

- Flexible changelog formats and database coverage.
- Mature module/path identity tools.
- Rich preview, inspection, rollback, and extension ecosystem.
- Integration-independent engine semantics.

Failure modes and NetScript lessons:

- Path is part of identity. NetScript space IDs and migration IDs must be logical, never derived
  from consumer filesystem layout.
- Alphabetical include order is not a dependency graph. Composition must use declared dependencies
  and deterministic topological ordering.
- A global single-row lock and shared ledger do not isolate contributors.
- `validate` checks changelog structure/checksums, not database-specific SQL correctness or all live
  drift.
- A plugin priority contest is not a safe schema-contribution protocol. NetScript should reject
  ambiguous providers instead of choosing whichever implementation reports the highest priority.
- Arbitrary extension code is a supply-chain boundary; plugin version, checksum, provenance, and
  allowed execution phases belong in the manifest snapshot.

### Terraform state, plan/apply, and providers

Architecture and mechanics:

- Terraform configuration plus modules form desired configuration. State is a separate mutable
  mapping between resource addresses and real remote objects, including provider metadata. It is
  neither desired configuration nor an immutable execution receipt.
  [State](https://developer.hashicorp.com/terraform/language/state)
- `plan` refreshes current objects, compares configuration with prior state, and proposes a graph of
  actions. A speculative plan has no apply intent. `-out` creates an opaque saved plan consumed by
  `apply`; the file embeds full configuration, values, options, and potentially cleartext sensitive
  data. [Plan](https://developer.hashicorp.com/terraform/cli/commands/plan)
- Backends store state and may provide locking. Locking is optional by backend. If remote
  persistence fails, Terraform writes state locally and requires manual recovery. State snapshots
  carry lineage and monotonically increasing serial values to reduce unsafe pushes.
  [Backends](https://developer.hashicorp.com/terraform/language/state/backends)
- State locking is automatic for operations that may write state. `force-unlock` requires a unique
  lock ID but can still cause concurrent writers if misused.
  [State locking](https://developer.hashicorp.com/terraform/language/state/locking)
- On apply failure, Terraform records completed changes in state, unlocks, and exits. It does not
  roll back a partially completed apply; the operator fixes the cause and applies again.
  [Apply failure](https://developer.hashicorp.com/terraform/tutorials/cli/apply)
- `-target` deliberately produces an incomplete view and is documented only for exceptional
  recovery. Terraform recommends splitting routinely independent systems rather than normalizing
  targeted apply.
  [Resource targeting](https://developer.hashicorp.com/terraform/tutorials/state/resource-targeting)
- Normal plan/apply performs an in-memory refresh. `-refresh-only` lets operators review adoption of
  live drift into state; careless refresh can forget resources if provider configuration or
  credentials point at the wrong place.
  [Refresh-only](https://developer.hashicorp.com/terraform/tutorials/state/refresh)
- Providers are separately downloaded executable plugins using gRPC. `GetProviderSchema`,
  validation, configure, read, plan, and apply RPCs form the lifecycle. Provider and resource
  schemas describe configuration and state—not application input/output validation. Provider
  versions and checksums are pinned in the dependency lock file.
  [Provider RPCs](https://developer.hashicorp.com/terraform/plugin/framework/internals/rpcs),
  [provider requirements](https://developer.hashicorp.com/terraform/language/providers/requirements)

DX strengths:

- Clear preview/apply workflow and dependency graph.
- Strong provider isolation and version locking.
- Good partial-failure recovery vocabulary.
- Backend locking, lineage, serial, and state recovery are proven operational patterns.

False analogy and lessons:

- NetScript’s manifest snapshot must not become “Terraform state.” It is immutable resolved
  configuration; live database markers and migration ledgers remain provider-owned.
- An operation receipt must not become an authoritative shadow copy of the database. It records what
  was attempted and observed.
- A NetScript executable plan should exclude secrets, use secret references, bind the live baseline,
  and have a documented stable schema. Copying Terraform’s opaque, sensitive plan artifact would be
  wrong.
- Database migration edges are not CRUD resources. DDL atomicity, irreversible data transforms, and
  “operation completed but ledger write was lost” need explicit treatment.
- Do not expose casual `--target` semantics. A selected apply needs dependency closure,
  omitted-operation reason codes, and a subsequent whole-target verification.
- Do not build a remote state backend, workspace service, or generic provider RPC system merely to
  resemble Terraform.

### Pulumi

Architecture and mechanics:

- `pulumi up` executes the user program, observes resource registrations, builds a goal graph,
  compares it to recorded stack state, and calls resource providers. Unlike Terraform, Pulumi does
  not refresh live resources before every preview/update unless requested.
  [State and refresh](https://www.pulumi.com/docs/iac/concepts/state-and-backends/)
- `pulumi preview --save-plan=plan.json` and `pulumi up --plan=plan.json` constrain an update, but
  update plans are experimental. They are not validated all at once: discrepancies are discovered as
  program execution and input resolution proceed, so earlier planned operations may already have
  run. Unknown outputs, resources created inside `apply`, and providers configured with unknown
  values reduce plan completeness.
  [Update plans](https://www.pulumi.com/docs/iac/concepts/update-plans/)
- State is stored as frequent checkpoints. Pulumi Cloud uses transactional checkpoint APIs; DIY blob
  backends have history and locking but explicitly offer weaker recovery from some partial failures.
  [State backends](https://www.pulumi.com/docs/iac/concepts/state-and-backends/)
- An interrupted create can leave a `pending operation` because the engine cannot know whether the
  provider completed it. Recovery requires checking the provider, then using `pulumi refresh` to
  clear or import the created physical resource.
  [Interrupted updates](https://www.pulumi.com/docs/iac/operations/troubleshooting/interrupted-updates/)
- Pulumi does not automatically roll back a failed update. By default it finishes in-flight
  operations and stops; `--continue-on-error` may continue independent branches while preserving
  dependency constraints.
  [Failure behavior](https://www.pulumi.com/docs/support/faq/infrastructure/)
- Targeted operations use URNs. Non-targeted dependencies are read from recorded state, so targeted
  work can defer code/infrastructure drift.
  [Targeted updates](https://www.pulumi.com/docs/iac/guides/basics/targeted-updates/)
- Providers consist of an executable and a language SDK generated from a package schema. Providers
  can be native, bridged from Terraform/OpenTofu, parameterized, or dynamic. Plugins run as separate
  processes, mostly over gRPC. [Providers](https://www.pulumi.com/docs/iac/concepts/providers/),
  [package schema](https://www.pulumi.com/docs/iac/using-pulumi/extending-pulumi/schema/),
  [plugins](https://www.pulumi.com/docs/iac/concepts/plugins/)

DX strengths:

- Familiar programming languages and strong generated SDKs.
- Frequent checkpoints preserve partial progress.
- Excellent explicit treatment of unknown outcomes after interruption.
- Components and provider inheritance are ergonomic.

Failure modes and NetScript lessons:

- “Preview” is not necessarily a complete plan when the desired graph is computed by arbitrary code.
  NetScript composition must be pure and deterministic.
- Receipts need an `outcome_unknown` phase, not just success/failure, for connection loss after an
  operation begins.
- Resume must verify uncertain operations before retrying; non-idempotent replay can corrupt data.
- Transactional checkpoint services, audit history, scheduled drift, policy hosting, and KMS-backed
  secrets are backend products—not appropriate NetScript kernel responsibilities.
- Pulumi package schemas generate language SDKs. They are not a precedent for Standard
  Schema-compatible runtime boundary validation.

### Bytebase

Architecture and mechanics:

- A Bytebase `Plan` contains one or more DDL/DML changes targeting databases or database groups. It
  begins in `Draft`, receives automatic SQL review, becomes an Issue for approval, and then produces
  a Rollout. [Plans](https://docs.bytebase.com/change-database/plan)
- A rollout is organized into environment stages and per-database tasks. Stages can run sequentially
  while tasks within a stage can run in parallel; the API exposes task status and explicit skip
  operations with a reason. [Batch change](https://docs.bytebase.com/change-database/batch-change),
  [rollout API](https://docs.bytebase.com/api-reference/rolloutservice/get-v1projects-rollouts)
- Rollout policy controls manual versus automatic execution, role permissions, required approvals,
  and enforcement of plan-check errors/warnings.
  [Rollout permissions](https://docs.bytebase.com/change-database/environment-policy/rollout-policy)
- SQL Review checks syntax, engine-specific policy, schema practices, security, and performance, but
  some enforcement levels and approval features are commercial.
  [SQL Review](https://docs.bytebase.com/change-database/review)
- Change history records applied SQL plus before/after schema snapshots. Schema Synchronization
  compares a selected historical/source schema to targets and generates editable DDL.
  [Change history](https://docs.bytebase.com/change-database/change-history),
  [schema synchronization](https://docs.bytebase.com/change-database/synchronize-schema)
- Bytebase previously offered automatic schema-drift detection, but release 3.14.0 explicitly
  removed the feature and related API fields. Current comparisons and synchronization must not be
  described as continuous drift monitoring.
  [3.14.0 removal](https://docs.bytebase.com/changelog/bytebase-3-14-0)
- Bytebase is a persistent server even when self-hosted in one Docker container. Its workflow
  depends on workspace metadata, users, roles, issues, approvals, schedulers, and database
  credentials. It has no application runtime ORM, Standard Schema surface, or typed third-party
  schema-contribution protocol.

DX strengths:

- Excellent human review and fleet rollout UI.
- Concrete stage/task partial-progress reporting.
- Strong SQL policy and approval workflow.
- Useful before/after schema history.

Failure modes and NetScript lessons:

- Do not claim current Bytebase drift detection.
- A server-side Plan/Issue/Rollout record is not the same as a local, portable, signed plan
  artifact.
- Multi-database rollout is visibly staged and partially successful, never atomic.
- Automatic retry is safe only when the operation/task defines idempotency and outcome verification.
- NetScript should integrate with Bytebase as an optional delivery backend, not reproduce IAM,
  approvals, scheduling, audit UI, notifications, database groups, or persistent metadata services.

### ZenStack v3

Architecture and mechanics:

- ZenStack v3 is no longer Prisma-backed at runtime; it uses a Kysely-based ORM while retaining a
  Prisma-superset ZModel language and PrismaClient-compatible query style. Current v3 supports
  PostgreSQL, MySQL, and SQLite. [v3 overview](https://zenstack.dev/docs),
  [v2 migration](https://zenstack.dev/docs/migrate-v2)
- ZModel uses explicit `import` statements. Imported files are type-checked and merged into one
  schema AST before downstream tools run. This is better than implicit directory merging, but still
  one aggregate owner/history. [Multi-file schema](https://zenstack.dev/docs/modeling/multi-file)
- A `plugin` declaration names a built-in plugin, local module, or npm package. Plugins can
  contribute ZModel attributes/functions, generation behavior, CLI behavior, and ORM runtime
  interception. The entire plugin facility is marked preview and subject to breaking changes.
  [Plugin model](https://zenstack.dev/docs/modeling/plugin)
- An npm plugin exports `plugin.zmodel`; the CLI loads ESM from a file, folder, or npm package. CLI
  plugins receive the full resolved AST and arbitrary options. Runtime plugins intercept ORM/Kysely
  query lifecycles. [Plugin development](https://zenstack.dev/docs/recipe/plugin-dev)
- Schema-level enablement and runtime enablement are distinct. For example, the policy plugin must
  be declared in ZModel and installed on the ORM client. This creates a potential mismatch NetScript
  should prevent through one resolved manifest.
- `zen migrate dev/deploy/status/resolve` exposes a single schema and migrations path. The current
  CLI still creates temporary Prisma schemas and provides `resolve --applied` / `--rolled-back`;
  `db push` accepts data-loss and force-reset flags. It is a wrapper around one migration history,
  not contributor-owned histories. [CLI](https://zenstack.dev/docs/reference/cli)
- `@zenstackhq/zod` takes the generated/runtime ZenStack schema and builds typed Zod 4 schemas.
  `makeModelSchema` supports `select`, `include`, `omit`, nested relation selection, and
  create/update optionality. This is the strongest direct prior art for runtime derivation and
  selection-shaped validation. [Zod factory](https://zenstack.dev/docs/utilities/zod)

DX strengths:

- One expressive schema drives runtime, generation, policies, and validators.
- Explicit imports and a typed AST are understandable.
- Selection-shaped runtime validation avoids one-validator-per-model boilerplate.
- Plugins can span schema, tooling, and runtime behavior.

Failure modes and NetScript lessons:

- Explicit imports do not establish independent ownership, migration heads, provenance, retention,
  or removal semantics.
- Schema and runtime plugin installation can diverge. NetScript must resolve both from one
  contribution record and reject half-installed plugins.
- Preview arbitrary-code plugins are not a stable public contract. NetScript’s contribution protocol
  should be declarative; executable hooks belong behind phase-specific, capability-limited adapters.
- ZenStack’s validator is tied to Zod rather than Standard Schema, and documented coverage is
  model/type/enum shape rather than full query/mutation argument semantics, provider codecs, storage
  values, or wire representations.
- NetScript should copy runtime derivation and selection-aware factories, not a generated Zod-only
  layer.

## Revised focused capability matrix

Legend: `Strong` = primary current capability; `Partial` = similar but materially different/manual;
`Hosted` = capability depends on a persistent control plane; `None` = absent. The NetScript row is
deliberately labeled as an unimplemented design target.

| Product/pattern       | Resolved desired manifest                      | Apply-bound plan                                        | Durable run evidence / partial recovery                                   | Contributor-owned schema + history                                  | Runtime selection-aware validation                    | Lock / drift semantics                                         |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| Flyway                | Partial: config + ordered migrations           | None; dry-run is not a bound plan                       | Strong history/repair, but manual cleanup after non-transactional failure | None; locations merge into one history                              | None                                                  | Strong DB lock on JDBC; Native Connector gap; drift Enterprise |
| Liquibase             | Partial: root changelog                        | Partial: `update-sql` preview only                      | Strong ledger/lock/rollback vocabulary                                    | Partial module identity, shared ledger                              | None                                                  | Strong lock; explicit diff/snapshot, not state reconciliation  |
| Terraform CLI         | Strong config graph; mutable state is separate | Strong saved opaque plan                                | Strong mutable state and partial-apply recovery; no rollback              | Partial modules/providers, not DB ownership spaces                  | None; provider schemas are unrelated                  | Backend-dependent locks; refresh/refresh-only drift            |
| Pulumi OSS            | Partial: graph emerges from program execution  | Partial/experimental; incrementally enforced            | Strong checkpoints and pending-operation recovery                         | Partial packages/components, not DB migration owners                | None; package schema generates SDKs                   | DIY locks; explicit refresh                                    |
| Pulumi Cloud          | Same program graph                             | Partial/experimental                                    | Hosted transactional checkpoints, history, policy                         | None for DB schema ownership                                        | None                                                  | Hosted locking and scheduled drift                             |
| Atlas CLI/Pro         | Strong schema graph                            | Partial/strong migration/declarative planning           | Strong migration directory/ledger; local apply evidence                   | Partial composite sources; configuration order, not owned histories | None                                                  | Pre-apply drift is Pro; local apply semantics                  |
| Atlas Cloud           | Strong registry source of truth                | Strong promotion/registry workflow                      | Hosted deployment history and fleet status                                | Partial source composition                                          | None                                                  | Hosted agents, scheduled drift, notifications                  |
| Bytebase current      | Strong persistent server-side Plan             | Strong Plan → Issue → Rollout, but not offline artifact | Strong stage/task history and partial fleet rollout                       | None                                                                | None                                                  | Persistent scheduler; current drift detection removed          |
| ZenStack v3           | Strong single composed AST                     | None beyond wrapped migration workflow                  | Partial Prisma migration status/resolve                                   | Partial schema/plugin contribution; one history                     | Strongest comparator, but Zod-specific and incomplete | No framework-level multi-target lock/drift layer               |
| Prisma 8 RC substrate | Strong contract snapshot per target            | Emerging control plan                                   | Stronger graph/marker/ledger substrate                                    | Strong spaces, but removal/retention conditional                    | No stable public Standard Schema layer                | Adapter/provider dependent                                     |
| Proposed NetScript    | **Design target, not implemented**             | **Design target, conditional on live-baseline binding** | **Design target; must prove unknown/partial/resume paths**                | **Conditional on NetScript policy + upstream conformance**          | **Design target; runtime/AOT equivalence unproven**   | **Design target; local per-target only, no hosted monitor**    |

## Atlas and Terraform analogy corrections

The RFC should state these explicitly:

1. Atlas `composite_schema` is useful source composition, but its documented dependency mechanism is
   load order. NetScript must require semantic dependency edges and reject cycles/overlaps rather
   than inherit configuration order.
   [Atlas project configuration](https://atlasgo.io/atlas-schema/projects)
2. Atlas Cloud’s registry, deployment audit, promotion, fleet status, continuous drift, agents,
   notifications, and UI are online commercial services. They are not evidence that equivalent local
   functionality is cheap. [Atlas Cloud](https://atlasgo.io/cloud/getting-started),
   [Atlas Agent](https://atlasgo.io/cloud/agents),
   [deployment reporting](https://atlasgo.io/cloud/deployment)
3. Terraform configuration, saved plan, mutable state, and backend are four distinct things.
   NetScript must likewise keep source manifest, resolved snapshot, executable plan, database
   ledger, and receipt distinct—but it should not create Terraform-style mutable framework state.
4. Terraform/Pulumi apply proves that plan approval does not imply atomic execution.
   State/checkpoint updates preserve partial progress; rerun converges or continues. NetScript’s
   database operations need per-operation idempotency and verification, not generic “convergence.”
5. Provider schema analogies stop at extension isolation and version pinning. Terraform/Pulumi
   schemas describe provider configuration and resource CRUD, not application query/mutation/result
   validation.
6. Terraform targeting is recovery machinery. It is positive evidence against treating `--db`,
   `--space`, or `--operation` filters as routine unbound apply selectors.
7. Refresh/adoption changes the operator’s record of reality. NetScript verification must never
   silently turn external drift into a new baseline; adoption requires an explicit ownership-policy
   transition and reviewed plan.

## Capabilities a local meta-framework should not rebuild

Keep local:

- pure manifest resolution and digesting;
- contributor dependency/overlap/provenance checks;
- plan generation and local policy evaluation;
- direct database-native lock acquisition;
- target/space migration invocation;
- per-run receipts, uncertain-outcome diagnostics, and resumable verification;
- optional adapters that export plans/results to external systems;
- runtime Standard Schema derivation from the pinned resolved contract.

Leave to optional Atlas/Bytebase/Pulumi/HCP-style integrations:

- remote state/checkpoint backends;
- organization workspaces and RBAC;
- human approval engines and issue tracking;
- schema registries and environment promotion;
- continuous drift agents/schedulers;
- fleet/tenant rollout schedulers and dashboards;
- permanent audit-log servers;
- notifications/webhooks;
- secret storage, KMS, and credential brokering;
- hosted policy distribution.

## Plan-lock decisions affected

1. **Artifact taxonomy:** lock separate definitions for source manifest, resolved snapshot,
   executable plan, upstream ledger/marker, and immutable operation receipt.
2. **No mutable NetScript state:** the snapshot is generated data; receipts are evidence. Neither
   becomes an authoritative shadow database.
3. **Executable plan contract:** bind manifest digest, target IDs, space versions, provider/package
   lock, live baseline, operation digests, policy result, expiry, and environment. Store secret
   references only.
4. **Speculative versus executable:** give offline/speculative plans a distinct type/status; only
   live-baseline-bound plans can be applied.
5. **Apply revalidation:** reacquire the lock and recheck baseline, manifest, package set, target
   identity, ownership policy, and expiry immediately before mutation.
6. **Lock protocol:** specify target/space scope, timeout, owner/nonce, stale-lock diagnostics, safe
   force-unlock rules, and behavior when an adapter lacks locking.
7. **Receipt state machine:** include at least `planned`, `locked`, `started`, `applied`,
   `verified`, `failed`, `partial_success`, `skipped(reason)`, `cleanup_required`, and
   `outcome_unknown`.
8. **Checkpoint granularity:** persist a receipt checkpoint after every irreversible operation or
   transaction group; never only at end-of-target.
9. **Recovery:** uncertain operations are inspected before retry; resume never blindly re-executes
   non-idempotent DDL or data transforms.
10. **No cross-target atomicity:** lock wording now. Multi-target applies are staged collections of
    independent target outcomes.
11. **Selective apply:** target/space filters require dependency closure, explicit omitted reasons,
    plan binding, and whole-target verification afterward. They are not routine convenience
    shortcuts.
12. **Ownership-aware drift:** distinguish migration-integrity drift, managed-object drift, adopted
    baselines, allowed external drift, and ignored objects. Baseline adoption is a reviewed
    mutation.
13. **Contribution identity:** use stable logical space and migration IDs independent of file paths,
    package install paths, provider names, or include order.
14. **Plugin execution boundary:** pin version/checksum/provenance and declare which phases may
    execute code. Composition should consume declarative records by default.
15. **Removal remains conditional:** NetScript can define diagnostics and retention policy now, but
    must not score removal as implemented until upstream behavior and conformance prove it.
16. **Validation scope:** lock operation-aware inputs, selection-aware outputs, runtime versus wire
    representations, codec contribution, stale-cache rejection, and fail-closed unsupported
    constructs.
17. **Validation portability:** Standard Schema is public; Zod is one adapter. ZenStack’s runtime
    schema factory is prior art for ergonomics, not for choosing Zod as the kernel.
18. **Hosted boundary:** explicitly defer RBAC, approval workflows, registry/promotion, continuous
    monitoring, fleet scheduling, and permanent audit services.
19. **Matrix honesty:** replace the proposed “Strong” self-score with “design target / conditional /
    unproven” until each conformance gate passes.
