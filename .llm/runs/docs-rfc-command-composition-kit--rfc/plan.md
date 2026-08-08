# Plan: production command composition kit RFC

## Run Metadata

| Field                    | Value                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Run ID                   | `docs-rfc-command-composition-kit--rfc`                                                                                     |
| Branch                   | `docs/rfc-command-composition-kit`                                                                                          |
| Phase                    | `plan-eval-ready`                                                                                                           |
| Target                   | `rfcs/0000-command-composition-kit.md` plus harness evidence                                                                |
| Delivery profile         | `SCOPE-docs` with `SCOPE-service` consumer analysis                                                                         |
| Described implementation | A1 contracts, A2 database/telemetry adapters, A3 relay runtime, A4 service DSL, A5 thin plugin consumers, A6 CLI generators |

## Goal

Author an implementable, domain-neutral RFC for a production command seam whose maximum guarantee is
one transaction on one store: business writes, optional replay receipt, audit rows, and outbox rows
commit together; delivery after commit is at least once; unsupported stores and remote effects are
refused rather than disguised.

## Scope

- Re-baseline Claude's proposal against current exports, APIs, tests, generators, live issues, and
  primary database/runtime specifications.
- Freeze exact TypeScript contracts, durable logical rows, canonical hash bytes, semantic laws,
  capability/refusal behavior, typed failures, telemetry, security, and examples.
- Define provider feasibility versus current NetScript support, adapter conformance, injected
  faults, migration/compatibility, rollout stages, docs/scaffold impact, and board decomposition.
- Maintain the draft RFC PR with evidence and stop at `status:plan-eval` for root-owned review.

## Non-Scope

- No product, package, plugin, schema, generated-workspace, CI, or release implementation.
- No domain-specific vocabulary, ORM/repository framework, event-sourcing platform, two-phase
  commit, distributed transaction, cross-store rollback, or exactly-once delivery claim.
- No RFC numbering, merge, issue creation/closure, milestone mutation, evaluator launch, or second
  Codex/Claude session.

## Doctrine and archetype mapping

| Future slice                             | Owner/archetype                            | Doctrine consequence                                                                     |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Command contract error fragment          | `@netscript/contracts/commands`, A1        | Contract first; literal error keys; no global base-map growth.                           |
| Transaction-bound store and SQL adapters | `@netscript/database/commands`, A2         | Port has one purpose; capabilities/refusals are explicit; no generated Prisma type leak. |
| Command definition/executor              | `@netscript/service/commands`, A4          | Public DSL is a subpath and one explicit composition root; no hidden global runtime.     |
| Command telemetry                        | existing telemetry attributes subpath, A2  | Stable bounded vocabulary; privacy/high cardinality excluded by default.                 |
| Outbox relay                             | generated worker plus store/sink ports, A3 | Owned lifecycle, lease/ack/retry, cancellation, and at-least-once boundary.              |
| Worker/saga/webhook consumers            | thin A5 integrations                       | Reuse existing runtime primitives; no semantic forks in plugin wrappers.                 |
| Explicit schema/command/relay generators | CLI A6                                     | Generate discoverable consumer-owned files; never silently inject schema.                |

The docs PR itself uses `SCOPE-docs`; it does not pretend a documentation file is all six
archetypes. Each implementation child must activate only its owning profile plus needed overlays.

## Axioms in play

| Axiom   | Application                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------- |
| A1–A3   | Contract, guide example, and reference laws precede implementation.                               |
| A6–A7   | RFC 8785 + Web Crypto SHA-256 replace bespoke unstable hashing.                                   |
| A9–A11  | Package ownership, composition root, and adapter extension axes are explicit.                     |
| A12–A13 | Abort/timeout/failure states and relay/saga crash boundaries are named.                           |
| A14     | Adapter conformance, injected failures, surface gates, and consumer proof are part of acceptance. |

## Locked decisions

| ID  | Decision                                                                                                                                                                                                                            | Rationale                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| L0  | This PR is ratification documentation only and keeps RFC number `0000`.                                                                                                                                                             | RFC process, brief, and #1361.                                                                                                                   |
| L1  | Atomicity ends at one transaction on one store.                                                                                                                                                                                     | Prevents distributed-transaction fiction.                                                                                                        |
| L2  | A `CommandStorePort` is conformant only when business, receipt, audit, and outbox writes share that commit. There is no weak port mode.                                                                                             | Capability truth is simpler and safer than an optional guarantee callers can overlook.                                                           |
| L3  | Command semantics live at `@netscript/service/commands`; transaction persistence/adapters at `@netscript/database/commands`; opt-in errors at `@netscript/contracts/commands`; telemetry extends `@netscript/telemetry/attributes`. | One-way service → database dependency; no database/service cycle; no new package or root export growth.                                          |
| L4  | Receipt/audit/outbox tables are consumer-owned logical schemas emitted by explicit provider-aware generators.                                                                                                                       | Published packages cannot own product migrations or user Prisma models.                                                                          |
| L5  | The request fingerprint is SHA-256 of RFC-8785 JCS bytes for an exact I-JSON object containing command name/version, scope, application fingerprint, actor subject, and string expected version.                                    | Stable replay comparison without hashing roles, claims, keys, or raw transport bytes.                                                            |
| L6  | Replay output requires an explicit codec to/from canonical JSON text.                                                                                                                                                               | `unknown`, Date, BigInt, class instances, and provider JSON differences cannot silently corrupt receipts.                                        |
| L7  | Optimistic concurrency is a command repository CAS, not `expectVersion(current)` and not a generic store flag.                                                                                                                      | Only the repository knows the model/version predicate; read-then-compare races.                                                                  |
| L8  | Transaction callbacks are never automatically retried by the command executor.                                                                                                                                                      | Hidden callback replay is unsafe for captured state and makes failure injection ambiguous; retry is caller-driven with the same idempotency key. |
| L9  | External I/O in the command callback is unsupported. Remote intent is a same-commit outbox row; the relay is at least once.                                                                                                         | A network effect cannot roll back with SQL.                                                                                                      |
| L10 | Deno KV is not a v1 `CommandStorePort`; SQLite is unclaimed until a NetScript adapter passes conformance.                                                                                                                           | KV is atomic-batch, not interactive; current repo has no SQLite adapter export.                                                                  |
| L11 | Command errors are route-opt-in and depend on #1350 for client-visible type preservation.                                                                                                                                           | Avoids widening every contract and shipping fictional type safety.                                                                               |
| L12 | Default telemetry excludes raw scope, actor, idempotency key/hash, request hash, expected version, payload, and arbitrary correlation identifiers.                                                                                  | Cardinality, PII, and secret leakage.                                                                                                            |
| L13 | Worker and saga idempotency remain separate consumer-side delivery concerns; an outbox message keeps a stable ID across relay attempts.                                                                                             | Commit-once does not imply deliver-once or effect-once.                                                                                          |

## Exact design skeleton

The RFC will specify, with compilable examples:

1. `defineCommand(spec)` with stable `name`, positive `definitionVersion`, isolation requirement,
   idempotency policy, input-fingerprint function, replay codec, audit policy, and async handler.
2. `createCommandExecutor({ store, telemetry, clock, ids, limits })` and
   `execute(definition, envelope, { signal }) -> CommandExecution<T>`.
3. A narrowed envelope: validated input, actor subject/scheme, bounded correlation id, validated W3C
   trace context, optional high-entropy idempotency key, and optional string expected version.
4. A transaction-bound `CommandTransaction<TTx>` exposing `business`, receipt claim/complete, audit
   append, and outbox append; every async port operation accepts cancellation.
5. Synchronous handler recorders `audit(...)` and `publish(...)`, plus a typed `conflict()` helper;
   buffers flush before receipt completion and commit.
6. Logical receipt/audit/outbox/relay-lease schemas, a per-attempt `executionId` joining side
   records, and the exact unique keys/invariants.
7. An opt-in command contract error map plus the internal typed failure union and presentation map.
8. Command span/attribute constants with exact allowed values and redaction rules.
9. Schema-backed codecs for replay outputs and outbox payloads, plus an explicit retry/terminal
   relay release union.

## Semantic laws to encode

- **Atomic commit:** any pre-commit failure leaves no business, receipt, audit, or outbox delta.
- **Receipt replay:** same receipt key + same request hash returns the first decoded value and emits
  no new business/audit/outbox writes.
- **Key mismatch:** same receipt key + different request hash never executes and returns the typed
  idempotency-reuse conflict.
- **Concurrent claim:** one claimant commits; followers replay after it commits, proceed after its
  rollback, or receive a bounded retryable busy result. No incomplete receipt is normally visible.
- **CAS:** a zero-match conditional mutation produces an optimistic conflict and rolls back every
  buffered side record.
- **No hidden retry:** a serialization/deadlock/busy failure aborts the attempt; executor never
  invokes the handler again itself.
- **Stable delivery identity:** one committed outbox row retains its ID across lease expiry and
  relay redelivery; publish-then-crash may duplicate delivery.
- **Boundary refusal:** absent same-commit support, unsupported isolation, cross-store state, or
  external effects fail composition/execution before an overbroad guarantee can be claimed.

## Capability and adapter plan

The RFC matrix will have two independent columns: storage/Prisma feasibility and current NetScript
integration. It will not label a provider “supported” merely because its engine has transactions.

| Target                                  | Planned position                                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| PostgreSQL + Prisma                     | Reference adapter; full semantics after conformance.                                                              |
| MySQL + Prisma                          | Feasible; current DB subpath exists; no `Snapshot`; conformance required. #1293 is adjacent, not blocking.        |
| SQL Server + Prisma                     | Feasible; `Snapshot` only when enabled; response/side payloads use text rather than a portable `Json` assumption. |
| SQLite + Prisma                         | Engine feasible but current NetScript adapter absent; no support claim until added and busy/fault tests pass.     |
| Deno KV                                 | Explicit v1 refusal; existing worker idempotency stays separate.                                                  |
| SQL + KV/stream/HTTP, or two SQL stores | No atomic adapter; use outbox and saga/consumer compensation.                                                     |

## Error and compatibility plan

- Internal failures distinguish optimistic conflict, key reuse, in-flight/busy, unsupported
  capability/isolation, codec/fingerprint failure, corrupt receipt, store failure, relay failure,
  and caller cancellation.
- Contract-visible command errors are only the safe client actions: conflict, key reuse, and
  retryable in-progress. Configuration/codec/store bugs map to existing service-unavailable/internal
  handling without leaking payloads or driver details.
- Existing CRUD/service code is unchanged; adoption is opt-in. No breaking label is required for
  this RFC. New exports require coordinated minor releases and surface-diff review.
- Public command handler/client ergonomics do not release until #1350 is fixed. Core implementation
  may be developed behind non-exported code, but no half-typed public promise ships.

## Risk register

| Risk                                                            | Mitigation                                                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Generic API leaks Prisma/generated types.                       | Package-owned structural port; generated bridge owns delegates; `deno doc` consumer review.         |
| Receipt claim races or commits incomplete state.                | Unique constraint, tx-bound claim/complete, injected faults at every boundary, corruption test.     |
| Canonicalization accepts non-I-JSON values.                     | Explicit fingerprint/response codecs, JCS validation, negative Date/BigInt/non-finite-number tests. |
| Long transactions or hidden retries duplicate captured effects. | No remote I/O, timeout/AbortSignal, no automatic callback retry.                                    |
| Telemetry leaks IDs or explodes cardinality.                    | Closed low-cardinality attributes, forbidden-field tests, optional redaction policy.                |
| Relay is mistaken for exactly-once.                             | Stable IDs, lease/ack crash tests, explicit at-least-once wording, downstream dedupe guidance.      |
| RFC grows into a workflow platform.                             | One callback/one store; multi-step or compensating work hands off to sagas.                         |

## Anti-patterns

| Pattern                       | Resolution                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| AP-3 god port                 | Separate command store, relay store, sink, telemetry; no backend switch inside executor.                            |
| AP-8/AP-9 framework machinery | No DI container, ORM, distributed coordinator, or speculative package.                                              |
| AP-11/AP-12 hidden globals    | Explicit executor composition root with injected store/clock/IDs/telemetry.                                         |
| AP-14 upstream leakage        | No Prisma/oRPC/OTel types in package-owned public contracts except existing `IsolationLevel` ownership in database. |
| AP-19 implicit permissions    | Handler authorization precedes execution; relay/store permissions documented separately.                            |
| AP-24 switch dispatch         | Provider adapters register at composition, not inside command execution.                                            |

## Implementation/board decomposition proposal

No board mutation is authorized. The RFC will recommend retaining #1363 as the umbrella and carving
implementation into PR-sized children: typed contracts; service executor; reference PostgreSQL
store; telemetry; relay; MySQL/MSSQL adapters; optional SQLite adapter; CLI/schema/service
generator; and docs/consumer proof. #1362 owns generated service layering, #1364 owns the
outbound-webhook recipe, and #1350 is the typed-error prerequisite. #1293 remains adjacent and
should not be made a false blocker.

## Fitness and validation gates

| Gate                                | This RFC PR                       | Future implementation                                                        |
| ----------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| Docs source/scope/links/terminology | Required                          | Docs additions required per slice.                                           |
| F-5/F-6/F-7 public surface/JSR      | Design audit                      | Surface diff, full-entrypoint doc lint, dry run, published consumer proof.   |
| Type/slow-type soundness            | API spellings reviewed            | Positive/negative type fixtures with isolated declarations.                  |
| Adapter conformance                 | Exact plan only                   | Real provider runs and named fault injection.                                |
| F-13 runtime semantics              | Laws and relay boundary           | Crash/restart/lease/cancellation tests.                                      |
| CLI consumer                        | Current command/template analysis | `check:emitted-samples` and full `scaffold.runtime` once at merge readiness. |

Final docs gates: scoped Markdown format check, `docs:links`, `docs:accuracy` where applicable,
focused term/path/source assertions, raw `git diff --check`, diff/lock hygiene, and PR
metadata/thread audit. Product E2E is intentionally skipped for this docs-only PR under its CI
labels.

## Plan-gate readiness

| Question                                          | Answer                                                                                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Is the problem and non-scope precise?             | Yes; one-store command atomicity and explicit refusal boundary.                                                              |
| Are target contracts named before implementation? | Yes; four focused subpaths, executor/store/envelope/rows/errors/telemetry.                                                   |
| Are failure and cancellation semantics explicit?  | Yes; no hidden retry, bounded busy, rollback, signal, relay lease.                                                           |
| Are extension axes and anti-patterns handled?     | Yes; store/sink/provider adapters and generated bridges are separate.                                                        |
| Are consumers and gates identified?               | Yes; services, contracts, DB adapters, telemetry, workers/sagas, CLI/scaffold.                                               |
| Are open questions non-blocking to drafting?      | Yes; idempotency default, SQLite release timing, correlation telemetry, retention durations are isolated FCP policy choices. |

Plan gate is ready for RFC authoring. Formal PLAN-EVAL is deliberately not triggered by this
generator; the owner-directed Fable review occurs after the complete draft and handoff.
