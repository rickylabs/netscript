# RFC-B: production command composition kit — one transactional boundary for business state, audit, outbox and idempotency — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T3-RFC-B · **Companion tracking issue draft:** `milestones/0.0.6-verification-docs-rfcs/T3-01-rfc-b-tracking-issue.md`
· **Proposed milestone (ratification):** 0.0.6 · **Proposed milestone (implementation):** 0.0.8 (post-shift "Runtime truth + service slice")
· **Shape:** #1123 numbered-section RFC (the live house RFC form; see `research/github-conventions.md` §5.4)

## Abstract

NetScript generates CRUD handlers and ships durable background primitives, but it has **no seam for
a production command** — the operation that changes business state once, records why it changed,
tells the rest of the system it changed, and survives being retried. Every measured agent run that
built such a product hand-rolled that seam. This RFC proposes a small, DB-adapter-neutral
composition kit in `@netscript/service`: a unit-of-work port, an expected-version condition, an
idempotency key + request-hash + replay receipt, audit and outbox rows written **in the same
commit**, correlation/OTEL attributes that tie a trace to those durable rows, and an injected-failure
test kit that fails when the seam is removed. It also states, per adapter, where that boundary
**cannot** exist, and where the boundary ends and `plugin-sagas` compensation begins. It is not a
billing framework, an ORM, an event-sourcing runtime, or an audit-schema standard.

---

## 1. Motivation

### 1.1 The framework ships the parts and none of the composition

Verified at `fac9e339042c`:

| Part | Where it is | State |
| --- | --- | --- |
| Transaction helper | `packages/database/mod.ts:128` `withTransaction(client, fn, options)` | Exported, documented in generated reference (`docs/site/reference/database/index.md:52`) — and has **zero callers**: `grep -rn "withTransaction"` over `packages/`, `plugins/`, `docs/` returns only the generator row and its own definition. No scaffold template, no how-to, no test. |
| Isolation vocabulary | `packages/database/ports/database-client.ts:59-77` (`IsolationLevel`, `TransactionOptions`) | Exists; never selected anywhere. |
| Idempotency | `packages/plugin-workers-core/src/ports/worker-idempotency-port.ts` (`claim`/`markApplied`/`release`, sources `caller`/`message-id`/`payload-hash`) | Real, KV-backed (`src/stores/kv-worker-idempotency-store.ts`) — but scoped to **worker deliveries**, not to service commands, and structurally unable to join a database transaction. |
| Compensation | `packages/plugin-sagas-core/src/public/mod.ts:43` (`sagaCompensate`, `sagaFail`, `send`, `spawn`) | Real, and the correct owner of multi-commit work. |
| Telemetry attributes | `packages/telemetry/src/attributes/helpers.ts` (`createJobAttributes`, `createExecutionAttributes`, `createSagaAttributes`), `src/attributes/spans.ts:45-46` (`RPC_CLIENT`, `RPC_SERVER`) | Job/saga/execution vocabularies exist; **there is no command vocabulary**. |
| Outbox / audit | — | `grep -rln "outbox"` over `packages/`, `plugins/`, `docs/` → **no match**. No audit-record primitive either. |

`$transaction` appears nowhere in `packages/service`, `packages/cli` scaffold assets, or
`docs/site/services-sdk`. The generated router template writes business state with a bare Prisma
delegate call and no transaction at all
(`packages/cli/src/kernel/assets/service/routers/v1.ts.template:25-53`).

### 1.2 What consumers do instead (measured)

- Wave-6 R3 "Closebook" — the **only** GO-grade run of three — is a month-close billing product whose
  entire command layer (invoice/item/event state advance, HMAC desk-token roles, run events) is
  product-owned. Its evaluator needed two `FAIL_FIX` rounds before a schedule actually advanced state
  (`research/wave-6-runs.md` §R3). Nothing in the framework offered the boundary; the product built
  one.
- Wave-6 R2 "Loom" built a full retry/backoff/compensation/resume executor in app space and never
  adopted `plugin-sagas` (`research/wave-6-runs.md` §R2 adoption, X14). Its blocking NO-GO row was a
  worker dying mid-run with no redelivery or reconciliation — a durability boundary failure.
- R3 recorded `trigger_events` / `job_execution_history` relational projections **empty** while
  authoritative state lived in KV (`research/wave-6-runs.md` §R3 defect table) — the exact shape a
  same-commit outbox/audit exists to prevent.

The pre-plan raises this as item **H** (`research/preplan-package.md`): "production command
composition kit (transaction/UoW, optimistic version, idempotency receipt, audit+outbox same-commit,
injected-failure tests) — DB-adapter-neutral, must not become billing-specific."

### 1.3 Why an RFC and not an issue

Under `rfcs/README.md` this crosses three of the "RFC required" triggers: it adds public API to
`@netscript/service` (a new subpath), it changes the **contracts** surface (a `CONFLICT` /
idempotency-conflict error code in `packages/contracts/src/application/contract-primitives.ts:21-52`
would be a shared error-map addition), and it is cross-cutting (`service`, `database`, `contracts`,
`telemetry`, `cli`, `plugin-workers-core`).

---

## 2. The proposed decision and its rationale

**Decision: ship a composition kit, not a framework.** The kit is a thin, typed orchestration around
primitives that already exist, plus two genuinely missing durable rows (receipt, outbox). It is opt-in
per handler. A CRUD handler that does not import it keeps compiling and behaving exactly as today.

Five rules fix the scope:

1. **One commit or it is a saga.** The kit owns exactly one transactional boundary against one store.
   The moment an operation needs two commits, two stores, or a remote call that must be undone, it is
   a saga (`sagaCompensate`) and the kit refuses it at the type level rather than emulating
   distributed transactions.
2. **The store adapter decides what is possible; the kit reports it.** Capability is data
   (§4), not prose. A deployment whose store cannot give a same-commit receipt gets the weaker
   semantics **named in its type and its telemetry**, never silently.
3. **Idempotency is a receipt, not a mutex.** The durable artifact is a replayable response keyed by
   `(scope, idempotencyKey)` and guarded by a `requestHash`, so a retried request returns the first
   answer instead of a second effect.
4. **Audit and outbox are rows, not opinions.** The kit defines the minimal row shape and the commit
   rule. It does not define a business audit taxonomy, a permission model, an event schema registry,
   or a delivery guarantee beyond at-least-once relay.
5. **No domain vocabulary.** No `Invoice`, `Charge`, `Subscription`, `Money`, `Ledger`, `Period`,
   `Proration`. If a symbol in the kit would only make sense to a billing product, it does not ship.
   (Explicit anti-goal — Wave-6 R3 is the evidence source, and evidence sources are not templates.)

---

## 3. Surface (implementation-level)

Proposed home: `@netscript/service/commands` (new subpath, so `@netscript/service`'s root export
budget is untouched), with adapters in `@netscript/database` and a testing subpath.

### 3.1 Unit of work

```ts
/** One transactional boundary against one store. */
export interface UnitOfWorkPort<TTx> {
  readonly capabilities: UnitOfWorkCapabilities;
  run<T>(fn: (tx: TTx) => Promise<T>, options?: TransactionOptions): Promise<T>;
}

export type UnitOfWorkCapabilities = Readonly<{
  /** Highest isolation the store can actually honor. */
  maxIsolation: IsolationLevel;
  /** True when receipts/audit/outbox can be written on the same commit as business state. */
  sameCommitSideRecords: boolean;
  /** True when a conditional update can report an affected-row count. */
  conditionalWriteCount: boolean;
}>;
```

The Prisma adapter delegates to the existing `withTransaction`
(`packages/database/mod.ts:128`) and reuses `TransactionOptions`/`IsolationLevel` verbatim
(`packages/database/ports/database-client.ts:59-77`) — no second vocabulary.

### 3.2 Command definition and envelope

```ts
export interface CommandEnvelope<TInput> {
  readonly input: TInput;
  readonly actor: Principal | undefined;        // reuse @netscript/service/auth Principal
  readonly correlationId: string;               // from trace or caller
  readonly idempotencyKey?: string;
  readonly expectedVersion?: string | number;   // optimistic condition
}

export function defineCommand<TInput, TOutput, TTx>(spec: {
  readonly name: string;                        // stable, appears in telemetry + receipts
  readonly scope: (envelope: CommandEnvelope<TInput>) => string; // receipt namespace, e.g. tenant
  readonly isolation?: IsolationLevel;
  readonly handler: (ctx: CommandContext<TInput, TTx>) => Promise<TOutput>;
}): CommandDefinition<TInput, TOutput, TTx>;
```

`CommandContext` exposes `tx`, `envelope`, `audit(entry)`, `publish(message)`, and
`expectVersion(current)`. `audit` and `publish` **buffer into the same transaction** and are flushed
before commit; there is no post-commit write path in the kit.

The definition is bound to a router procedure by a thin adapter so the contract stays the source of
truth: `commandHandler(def)` returns something assignable to an oRPC `.handler(...)` callback. The kit
never owns routing, validation, or the contract.

### 3.3 Expected-state / optimistic version

`expectVersion(current)` compares the envelope's `expectedVersion` against the row's version and, on
mismatch, throws the shared `CONFLICT` error carrying `{ expected, actual }`. Where the adapter
reports `conditionalWriteCount`, the preferred lowering is a single conditional update
(`where: { id, version: expected }`, `data: { …, version: { increment: 1 } }`) with a zero-row check —
one round trip, no read-modify-write race. `CONFLICT` is added to `commonErrorMap`
(`packages/contracts/src/application/contract-primitives.ts:21-52`) so it is a **typed, declared**
error, not a 500. (This depends on the error-map widening defect being repaired — see §6.)

### 3.4 Idempotency key, request hash, replay receipt

```ts
export interface CommandReceiptPort<TTx> {
  claim(tx: TTx, claim: ReceiptClaim): Promise<ReceiptClaimResult>;
  complete(tx: TTx, key: ReceiptKey, response: unknown): Promise<void>;
  load(tx: TTx, key: ReceiptKey): Promise<StoredReceipt | undefined>;
}
```

- Key = `(scope, commandName, idempotencyKey)`. When no key is supplied the command runs
  non-idempotently and the receipt is skipped — visibly, via a telemetry attribute, not silently.
- `requestHash` = a canonical, order-stable hash of the validated input plus actor id plus
  `expectedVersion`. Reuse of one key with a different hash is a **client bug** and returns a typed
  `IDEMPOTENCY_KEY_REUSE` conflict rather than a second effect or a wrong replay.
- A completed receipt replays the stored response with `replayed: true`; an in-flight claim returns a
  typed retryable error. Claim, business writes, side records and completion are all inside the same
  transaction when `sameCommitSideRecords` is true.
- Prior art to align with, not duplicate: `WorkerIdempotencyPort`
  (`packages/plugin-workers-core/src/ports/worker-idempotency-port.ts`) — same `caller` /
  `message-id` / `payload-hash` resolution ladder, different scope and different store.

### 3.5 Audit and outbox in the same commit

Minimal row shapes, deliberately generic:

```ts
type AuditEntry   = { action: string; subject: string; actor?: string; correlationId: string; data?: unknown };
type OutboxRecord = { topic: string; payload: unknown; headers?: Record<string,string>; dedupeKey?: string; availableAt?: Date };
```

The outbox **relay** is a first-party worker job template (`@netscript/plugin-workers-core`
`defineJob`) that drains unpublished rows to the configured sink — saga bus, durable stream, or an
outbound HTTP endpoint — marks them published, and honors `dedupeKey` for at-least-once delivery.
The relay is generated, not hidden: a consumer can read it, and deleting it visibly stops delivery.

### 3.6 Correlation and OTEL attributes

A `command` span (`SpanNames.COMMAND`, added next to `RPC_CLIENT`/`RPC_SERVER` at
`packages/telemetry/src/attributes/spans.ts:45-46`) with a `createCommandAttributes` helper beside
the existing job/saga/execution helpers (`packages/telemetry/src/attributes/helpers.ts`):
`netscript.command.name`, `.scope`, `.idempotency_key_present`, `.replayed`, `.expected_version`,
`.isolation`, `.outcome` (`applied` / `replayed` / `conflict` / `failed`), `.audit_count`,
`.outbox_count`. The **same** `correlationId` is written into the audit and outbox rows, so a trace id
found in the dashboard can be joined to durable rows in SQL — the missing link R3 recorded as empty
relational projections.

### 3.7 Injected-failure testing

`@netscript/service/commands/testing` ships a fault injector with **named** seams:
`before-claim`, `after-claim-before-business-write`, `after-business-write-before-side-records`,
`after-flush-before-commit`, `after-commit-before-response`, `on-relay-publish`. The shipped
conformance suite asserts, per adapter: no partial business state after any pre-commit fault; a retry
with the same key and hash returns the first response and produces no second outbox row; a retry with
a different hash conflicts; a relay fault redelivers without duplicating effects at the consumer when
`dedupeKey` is honored; and removing the kit from a handler makes the suite **fail** (the
remove-the-seam-and-it-fails rule from `research/preplan-package.md` §Wave-7).

---

## 4. Honest per-adapter capability limits

This section is load-bearing: the RFC is rejected outright if it claims a portable boundary that a
store cannot provide.

| Store | Transaction | `sameCommitSideRecords` | Notes |
| --- | --- | --- | --- |
| PostgreSQL (Prisma) | Interactive, up to `Serializable` | **yes** | Reference adapter. Full kit semantics. |
| MySQL / MariaDB (Prisma) | Interactive, up to `Serializable` | **yes** | `Snapshot` unavailable (`IsolationLevel` marks it MSSQL-specific, `ports/database-client.ts:59-65`). The MySQL adapter class is currently unexported — see #1293. |
| MSSQL (Prisma) | Interactive, `Snapshot` available | **yes** | — |
| SQLite (Prisma) | Interactive, single writer | **yes** | Isolation vocabulary is narrower; concurrency is serialized by the store. |
| Deno KV (`@netscript/kv`) | `atomic()` with versionstamp `check()` conditions only | **no** | KV cannot enroll relational writes. A KV-only deployment gets *claim → effect → mark applied* with a visible non-atomic window — exactly today's `WorkerIdempotencyPort` semantics — and the kit must type it as such. |
| DB + KV, DB + stream, DB + remote HTTP | **no portable atomic boundary exists** | **no** | This is the honest negative result. The only supported shape is *transactional core + outbox relay*, with at-least-once delivery and consumer-side dedupe. Anything stronger is a saga. |

Consequences the RFC accepts rather than papers over:

- `UnitOfWorkCapabilities` is **public**, and a command that requires `sameCommitSideRecords` fails at
  composition time on a store that lacks it, with a message naming the store.
- The kit publishes nothing directly to sagas/streams/webhooks at commit time. Delivery is always via
  the relay, so "the row committed" and "the world was told" are separate, observable facts.
- Exactly-once end-to-end is never claimed. The claim is: **exactly-once business state**, at-least-once
  delivery, replayable responses.

---

## 5. Plan — waves and gates

| Wave | Scope | Gate |
| --- | --- | --- |
| W0 | Ratify this RFC; decide the two forks in §8 | Owner ratification recorded on the tracking issue |
| W1 | `UnitOfWorkPort` + Prisma adapter over `withTransaction`; `CONFLICT` in `commonErrorMap`; `expectVersion` | Unit + conformance tests; a test that the conditional update reports zero rows and raises a **typed** (not 500) conflict |
| W2 | Receipt port + relational adapter; request hash; replay | Injected-failure suite green on Postgres and SQLite; negative test: same key + different hash → conflict |
| W3 | Audit + outbox rows, buffered flush, relay worker template | Fault at `after-flush-before-commit` leaves **no** audit/outbox row; relay redelivery test |
| W4 | Telemetry vocabulary + docs recipe + generated non-CRUD command example | `deno task check`/`lint`/`fmt` clean on the generated project with **no** `any` / `as unknown as`; a trace assertion for the `command` span |
| W5 | KV-capability path typed and documented as weaker | Negative test: a `sameCommitSideRecords`-requiring command refuses to compose on the KV adapter |

Implementation lands as **T3-03** (`milestones/0.0.8-runtime-truth-service-slice/T3-03-command-kit-implementation.md`),
not in the ratification milestone.

---

## 6. Dependencies and interactions

- **Typed errors must work first.** `safe()`/`isDefinedError()` currently narrow to `never`
  (`packages/sdk/src/client/errors.ts:75-92`) and `baseContract` widens the six-code error map
  (`packages/contracts/src/application/contract-primitives.ts:81`) — both proven by probe in
  `research/repo-audit/services-sdk.md` §3.4/§3.5. Adding `CONFLICT` to a map that is erased at the
  type level buys nothing for consumers. RFC-A / pack T1 owns that repair; this RFC **depends** on it
  for its client-visible half and can land its server half without it.
- **Sagas own multi-commit work** (`sagaCompensate`, `packages/plugin-sagas-core/src/public/mod.ts:43`).
  The kit's refusal boundary is the saga's entry point; the two must reference each other in docs.
- **Workers own delivery.** The relay is a `defineJob` template, and worker-level idempotency stays
  where it is; the kit does not move or wrap `WorkerIdempotencyPort`.
- **Service layout** (T3-02) decides *where* a command file lives in a generated service; this RFC
  decides *what it is*. Neither may restate the other.

---

## 7. Board — NOT FILED

No GitHub mutation has been performed by this run. When the owner ratifies, the house path
(`research/github-conventions.md` §5.4) is an `rfc:`-form tracking issue titled
`RFC: production command composition kit — one transactional boundary for business state, audit, outbox and idempotency`,
labels `rfc`, `type:docs`, `area:service`, `area:database`, `priority:p1`, `status:triage`, milestone
`0.0.6`; the draft body is `milestones/0.0.6-verification-docs-rfcs/T3-01-rfc-b-tracking-issue.md`.
Whether a numbered `rfcs/NNNN-*.md` file is also merged is an owner decision: the documented
file-based process exists (`rfcs/README.md`, `rfcs/0000-template.md`) but **zero numbered RFC files
have ever been merged** and all four live "RFCs" are issues. GitHub wins on conflict.

---

## 8. Open forks for the owner

1. **Receipt storage owner.** A framework-owned Prisma model injected into the consumer's schema
   (discoverable, migrable, one more thing NetScript owns in the user's database) versus a
   consumer-declared model satisfying a documented shape (no schema intrusion, more setup, drift
   risk). Default proposal: **consumer-declared shape + a generator that emits it**, so the framework
   never silently owns rows in a product's database.
2. **Where the kit lives.** `@netscript/service/commands` (commands are a service concern; keeps
   `@netscript/database` a pure data-access package) versus a new `@netscript/commands` package (clean
   archetype, one more publish surface, one more JSR gate). Default proposal: **subpath of
   `@netscript/service`** until a second host (CLI-invoked commands, plugin services) needs it.
3. **`expectedVersion` transport.** Envelope field only, versus a contract-level convention
   (`If-Match`-style header on the OpenAPI projection). Default proposal: envelope field in v1;
   revisit when the OpenAPI→MCP projection (#1126) needs it.

## 9. Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Adjudicated in
`SYNTHESIS.md` §4 (pack T3) from `research/preplan-package.md` item **H**, with evidence from
`research/wave-6-runs.md` (R2/R3) and `research/repo-audit/services-sdk.md`. All source claims in §1
were re-verified against the worktree at `fac9e339042c`. Draft only — no board mutation, owner
ratification pending.
