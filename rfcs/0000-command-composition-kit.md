---
rfc: 0000
title: Production command composition kit
status: Draft
authors: ['@rickylabs']
created: 2026-08-08
tracking-issue: https://github.com/rickylabs/netscript/issues/1361
target-milestone: 0.0.6
---

# Production command composition kit

## Summary

This RFC defines a small, opt-in NetScript command composition kit for a single transactional store.
A conforming command executes business writes and writes its idempotency receipt, audit records, and
outbox messages in the same commit. A retry with the same idempotency key and canonical request
returns the stored result without re-running the command. Remote delivery begins only after commit
through an at-least-once outbox relay. Stores that cannot provide the same commit, operations that
span stores, and network effects inside the transaction are refused rather than described as atomic.
This is a command boundary, not an ORM, workflow engine, event-sourcing system, or distributed
transaction protocol.

## Motivation

NetScript currently exposes useful pieces but no supported way to compose them into a production
command:

- `@netscript/database` exports `withTransaction()` and transaction options, but the helper has no
  production caller and types the callback as the full root client through an assertion.
- generated service handlers call Prisma delegates directly;
- `@netscript/plugin-workers-core` has KV-backed delivery claims, but they cannot join a relational
  commit or replay a service response;
- `@netscript/plugin-sagas-core` exposes compensation and a reserved saga outbox port, but that port
  has no adapter and is not transaction-bound to service business state;
- service, workers, and sagas propagate W3C trace context, while telemetry has no command
  vocabulary; and
- consumers must invent receipt, audit, outbox, relay, failure, and migration conventions.

The result is not merely duplicated code. Each application can choose a different answer to the hard
parts: whether a retry re-executes, what a reused key means, whether an audit record can commit
after the state it describes, whether an event is published before commit, and whether a remote side
effect is somehow considered transactional.

The cost of doing nothing is a framework that generates CRUD well but leaves the first non-CRUD
state transition to application folklore. The proposed kit supplies one honest composition seam:

> one command attempt, one store transaction, one durable answer, and zero remote effects before
> commit.

It unlocks contract-first state transitions with optimistic concurrency, replay-safe HTTP or RPC
retries, durable operational evidence, and a visible bridge to workers and sagas. It does not make
every effect occur once. It makes the local commit indivisible and makes every boundary after that
commit explicit.

## Guide-level explanation

### The mental model

A command is one validated caller intent that may change state. It has five stages:

1. the service contract validates input and authenticates/authorizes the caller;
2. the executor computes an idempotency fingerprint and opens one supported store transaction;
3. the handler performs business writes through the transaction client and buffers audit/outbox
   records;
4. the store writes the buffers and replay receipt, then commits them with the business state; and
5. a separate relay later publishes committed outbox messages at least once.

If the operation needs another database, a KV mutation, or a remote call before it can be considered
successful, it is not one command transaction. Commit the local intent to the outbox and continue
through a worker or saga.

### Define the contract first

Command errors are opt-in. They do not enlarge every route built from `baseContract`.

```ts
import { commandBaseContract, type CommandContractRoute } from '@netscript/contracts/commands';
import { z } from 'zod';

export const renameProjectInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  expectedVersion: z.string().regex(/^\d+$/),
  idempotencyKey: z.string().min(16).max(256),
});

export const projectOutput = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
});

export const projectRenamedPayload = z.object({
  projectId: z.string(),
  name: z.string(),
  version: z.string(),
});

export const renameProject: CommandContractRoute<
  typeof renameProjectInput,
  typeof projectOutput
> = commandBaseContract
  .route({ method: 'POST', path: '/projects/{id}:rename' })
  .input(renameProjectInput)
  .output(projectOutput);
```

`commandBaseContract` is `baseContract.errors(commandErrorMap)`. `commandErrorMap` adds only the
command failures a client can safely act on: `COMMAND_CONFLICT`, `IDEMPOTENCY_KEY_REUSE`, and
`COMMAND_IN_PROGRESS`. Normal authentication, authorization, validation, and service-unavailable
errors remain the existing contract vocabulary.

### Define one command

The command definition names its isolation, idempotency, replay codec, audit policy, and handler.
The example performs optimistic concurrency as a conditional update. It does not read a version and
compare it in memory.

```ts
import { type CommandDefinition, defineCommand, jsonCodec } from '@netscript/service/commands';
import type { PrismaTransactionClient } from '@database';
import { z } from 'zod';
import { projectOutput, projectRenamedPayload, renameProjectInput } from '../contracts/projects.ts';

export const renameProjectCommand = defineCommand({
  name: 'projects.rename',
  definitionVersion: 1,
  isolationLevel: 'ReadCommitted',
  idempotency: {
    mode: 'required',
    scope: ({ input }) => input.id,
    fingerprint: ({ id, name }) => ({ id, name }),
    response: jsonCodec(projectOutput),
  },
  records: {
    audit: 'required',
    outbox: 'optional',
  },
  async handle(ctx) {
    const updated = await ctx.tx.project.updateMany({
      where: {
        id: ctx.envelope.input.id,
        version: Number(ctx.envelope.expectedVersion),
      },
      data: {
        name: ctx.envelope.input.name,
        version: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      ctx.conflict();
    }

    const project = await ctx.tx.project.findUniqueOrThrow({
      where: { id: ctx.envelope.input.id },
    });

    ctx.audit({
      action: 'project.rename',
      subject: { type: 'project', id: project.id },
      data: { version: String(project.version) },
    });

    ctx.publish({
      destination: 'project-events',
      topic: 'project.renamed.v1',
      codec: jsonCodec(projectRenamedPayload),
      payload: {
        projectId: project.id,
        name: project.name,
        version: String(project.version),
      },
    });

    return {
      id: project.id,
      name: project.name,
      version: String(project.version),
    };
  },
}) satisfies CommandDefinition<
  'projects.rename',
  z.infer<typeof renameProjectInput>,
  z.infer<typeof projectOutput>,
  PrismaTransactionClient
>;
```

The handler may use the transaction client, injected clock/ID source, and synchronous recorders. It
must not call a remote service, enqueue directly, send email, or publish to a saga bus. Capturing
such a client in the closure is possible in TypeScript, but is outside the command guarantee and
fails conformance review.

### Compose the executor explicitly

The consumer owns the Prisma schema and generated client. An explicit generator adds the three
logical tables and a small bridge that binds their generated delegates to the package-owned store
port.

```ts
import { createCommandExecutor } from '@netscript/service/commands';
import { commandStore } from '../infrastructure/command-store.ts';

export const commands = createCommandExecutor({
  store: commandStore,
  limits: {
    auditRecords: 16,
    outboxRecords: 32,
    recordBytes: 64 * 1024,
  },
});
```

The oRPC handler derives the envelope from already-validated input and the authenticated service
context. A system-triggered command must supply an explicit system actor; actor absence is never
silently treated as anonymous.

```ts
import { throwCommandContractError } from '@netscript/contracts/commands';

export const renameProjectHandler = renameProject.handler(
  async ({ input, context, errors }) => {
    try {
      const result = await commands.execute(
        renameProjectCommand,
        {
          input,
          actor: {
            kind: 'principal',
            subject: context.principal.subject,
            scheme: context.principal.scheme,
          },
          correlationId: context.correlationId,
          trace: context.traceHeaders,
          idempotencyKey: input.idempotencyKey,
          expectedVersion: input.expectedVersion,
        },
        { signal: context.signal },
      );
      return result.value;
    } catch (error) {
      throwCommandContractError(error, errors);
    }
  },
);
```

The route returns exactly its declared output. Replay metadata is available to the handler and
telemetry but does not mutate the response shape. A contract that wants to expose replay state may
declare it in its own output.

### What a retry does

For an idempotency key `k`:

- the first successful request commits the business writes, audit/outbox rows, and encoded response;
- the same key plus the same canonical request returns the first response and creates nothing new;
- the same key plus a different canonical request returns `IDEMPOTENCY_KEY_REUSE`;
- a concurrent follower either waits and replays, proceeds after the winner rolls back, or receives
  the retryable `COMMAND_IN_PROGRESS` result when the adapter's bounded wait expires; and
- a failure after commit but before the HTTP response is repaired by the next retry, because receipt
  completion was part of the commit.

An optional-idempotency command may explicitly accept no key. That attempt remains atomic but is not
replay protected; telemetry records `not_requested`. Required-by-default versus permitting this
explicit opt-out is an FCP question.

### Where the relay and saga begin

An outbox row says that delivery is owed; it does not say delivery has happened. The generated relay
claims committed rows with leases, publishes each row's stable message ID, then marks it published.
If it publishes and crashes before marking, it publishes the same ID again. A worker, saga handler,
stream consumer, or webhook receiver must deduplicate or be idempotent.

The command transaction ends before relay publication. A saga begins when later work needs multiple
durable steps, remote calls, time, retries, or compensation. `sagaCompensate()` is not called inside
the command transaction; the outbox can request a saga start after the local commit.

## Reference-level explanation

### Scope and terminology

- **command** — one validated intent applied by one handler inside one supported store transaction;
- **attempt** — one invocation of that handler; the executor never repeats it automatically;
- **receipt key** — command scope, command name, and the SHA-256 digest of an idempotency key;
- **request hash** — SHA-256 of exact RFC-8785 canonical request material;
- **audit record** — immutable same-commit operational evidence supplied by the application;
- **outbox message** — same-commit remote-delivery intent with a stable message ID;
- **relay** — post-commit lease/publish/mark runtime with at-least-once delivery;
- **conformant store** — one that binds all local rows to the same transaction and passes the
  injected-failure suite; and
- **refusal** — a typed failure before an unsupported guarantee is claimed.

“Same commit” refers only to rows in the transaction's store. “Applied” means that transaction
committed. It does not mean a remote consumer observed the message. The RFC makes no end-to-end
exactly-once claim.

### Package and export placement

| Surface                                | Owner                                                                       | Reason                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/service/commands`          | command definition, executor, envelope, context, typed application failures | Commands are a service/application concern. A focused subpath preserves the root export budget.                          |
| `@netscript/service/commands/testing`  | executor fixtures and fault controls                                        | Testing-only public utilities stay off the production root.                                                              |
| `@netscript/database/commands`         | transaction-bound store contracts and provider adapters                     | Database owns transaction/isolation vocabulary and the generated-client bridge. Service depends one way on this subpath. |
| `@netscript/database/commands/testing` | adapter conformance suite                                                   | Provider truth is tested at its owning adapter seam.                                                                     |
| `@netscript/contracts/commands`        | opt-in Zod schemas and command error map                                    | Transport errors remain contract-first without changing all routes.                                                      |
| `@netscript/telemetry/attributes`      | command span/attribute constants and builder                                | Extends the existing telemetry vocabulary where job/saga builders already live.                                          |

No `@netscript/commands` package is introduced. None of these symbols is re-exported from an
existing package root in v1. Internal imports within a package use relative paths, avoiding the
self-referential JSR subpath trap.

### Value, identity, and envelope contracts

```ts
import type { StandardSchemaV1 } from '@standard-schema/spec';

export type CommandJson =
  | null
  | boolean
  | string
  | number
  | readonly CommandJson[]
  | { readonly [key: string]: CommandJson };

export type CommandActor =
  | Readonly<{
    kind: 'principal';
    subject: string;
    scheme?: string;
  }>
  | Readonly<{
    kind: 'system';
    subject: string;
  }>;

export type CommandTraceContext = Readonly<{
  traceparent: string;
  tracestate?: string;
}>;

export type CommandEnvelope<TInput> = Readonly<{
  input: TInput;
  actor: CommandActor;
  correlationId: string;
  trace?: CommandTraceContext;
  idempotencyKey?: string;
  expectedVersion?: string;
}>;

export interface CommandCodec<T> {
  encode(value: T): CommandJson;
  decode(value: CommandJson): T;
}

export function jsonCodec<T>(
  schema: StandardSchemaV1<unknown, T>,
): CommandCodec<T>;
```

`CommandJson` is a static convenience, not sufficient validation by itself. Codec output must be
I-JSON suitable for RFC 8785: object keys are strings; numbers are finite IEEE-754 values; lone
surrogates, `undefined`, sparse arrays, `Date`, `BigInt`, functions, symbols, class instances, and
cyclic values are rejected. Stored values are decoded and validated again; a database row is not
trusted merely because the framework wrote it.

`actor.subject` reuses the authenticated principal identity, while roles, scopes, and claims do not
cross the durable command boundary. Authorization happens before execution. `scheme` may be stored
in audit evidence but is excluded from request identity so a credential mechanism change does not
turn a retry into another request.

`expectedVersion` is a string. Consumers normalize integer, UUID, timestamp, or opaque version
tokens at their repository boundary rather than risk JavaScript numeric precision or a second
portable version algebra.

`jsonCodec()` accepts the package-neutral `StandardSchemaV1` contract. It does not expose Zod in the
service public surface.

### Command definition and execution contracts

```ts
export type CommandIdempotencyMode = 'required' | 'optional';
export type CommandRecordRequirement = 'required' | 'optional' | 'forbidden';

export type CommandIdempotency<TInput, TOutput> = Readonly<{
  mode: CommandIdempotencyMode;
  scope(identity: Readonly<{ input: TInput; actor: CommandActor }>): string;
  fingerprint(input: TInput): CommandJson;
  response: CommandCodec<TOutput>;
}>;

export type CommandDefinitionSpec<
  TName extends string,
  TInput,
  TOutput,
  TTx,
> = Readonly<{
  name: TName;
  definitionVersion: number;
  isolationLevel?: IsolationLevel;
  idempotency: CommandIdempotency<TInput, TOutput>;
  records: Readonly<{
    audit: CommandRecordRequirement;
    outbox: CommandRecordRequirement;
  }>;
  handle(context: CommandContext<TInput, TTx>): Promise<TOutput>;
}>;

export interface CommandDefinition<
  TName extends string,
  TInput,
  TOutput,
  TTx,
> {
  readonly name: TName;
  readonly definitionVersion: number;
  readonly isolationLevel?: IsolationLevel;
  readonly idempotency: CommandIdempotency<TInput, TOutput>;
  readonly records: Readonly<{
    audit: CommandRecordRequirement;
    outbox: CommandRecordRequirement;
  }>;
}

export type CommandAuditInput = Readonly<{
  action: string;
  subject: Readonly<{ type: string; id: string }>;
  data?: CommandJson;
}>;

export type CommandOutboxInput<TPayload> = Readonly<{
  destination: string;
  topic: string;
  payload: TPayload;
  codec: CommandCodec<TPayload>;
  dedupeKey?: string;
  availableAt?: Date;
}>;

export interface CommandContext<TInput, TTx> {
  readonly tx: TTx;
  readonly envelope: CommandEnvelope<TInput>;
  readonly signal: AbortSignal;
  now(): Date;
  newId(): string;
  audit(record: CommandAuditInput): void;
  publish<TPayload>(message: CommandOutboxInput<TPayload>): void;
  conflict(): never;
}

export type CommandExecution<TOutput> = Readonly<{
  value: TOutput;
  outcome: 'applied' | 'replayed';
  idempotency: 'committed' | 'replayed' | 'not_requested';
  correlationId: string;
}>;

export interface CommandExecutor<TTx> {
  execute<TName extends string, TInput, TOutput>(
    command: CommandDefinition<TName, TInput, TOutput, TTx>,
    envelope: CommandEnvelope<TInput>,
    options?: Readonly<{ signal?: AbortSignal }>,
  ): Promise<CommandExecution<TOutput>>;
}

export interface CommandClock {
  now(): Date;
}

export interface CommandIdSource {
  next(): string;
}

export type CommandTelemetryStart = Readonly<{
  name: string;
  definitionVersion: number;
  isolation: IsolationLevel | 'default';
  provider: string;
  idempotency: 'claimed' | 'not_requested';
}>;

export type CommandTelemetryResult = Readonly<{
  outcome: 'applied' | 'replayed' | 'conflict' | 'rejected' | 'failed' | 'cancelled';
  idempotency: 'claimed' | 'replayed' | 'not_requested' | 'missing' | 'mismatch' | 'busy';
  auditCount: number;
  outboxCount: number;
  errorType?: CommandFailure['kind'];
}>;

export interface CommandTelemetrySpan {
  finish(result: CommandTelemetryResult): void;
}

export interface CommandTelemetryPort {
  trace<TResult>(
    start: CommandTelemetryStart,
    operation: (span: CommandTelemetrySpan) => Promise<TResult>,
  ): Promise<TResult>;
}

export type CommandExecutorOptions<TTx> = Readonly<{
  store: CommandStorePort<TTx>;
  clock?: CommandClock;
  ids?: CommandIdSource;
  telemetry?: CommandTelemetryPort;
  limits?: Readonly<{
    auditRecords: number;
    outboxRecords: number;
    recordBytes: number;
  }>;
}>;

export function defineCommand<
  TName extends string,
  TInput,
  TOutput,
  TTx,
>(
  specification: CommandDefinitionSpec<TName, TInput, TOutput, TTx>,
): CommandDefinition<TName, TInput, TOutput, TTx>;

export function createCommandExecutor<TTx>(
  options: CommandExecutorOptions<TTx>,
): CommandExecutor<TTx>;
```

`defineCommand()` validates names and policies once and returns an immutable definition. Command
names are 1–120 characters and match `^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$`; `definitionVersion` is a
positive safe integer. Names and versions are durable protocol data and cannot be changed as a
refactor.

`now()` and `newId()` use executor-injected ports. `audit()` and `publish()` are synchronous
recorders; they do not write or call a transport. The executor enforces the declared required,
optional, or forbidden record counts before flushing. It also enforces configured count/byte limits
before asking the store to write.

The exported `CommandDefinition` is read-only and does not expose a public constructor. The actual
handler remains part of the opaque definition returned by `defineCommand()`, preventing callers from
bypassing the executor by invoking a public `handle` member.

### Transaction-bound store contracts

The database subpath owns the transaction vocabulary and imports no service types. The business
transaction client and side-record methods are one bound handle:

```ts
export type CommandStoreCapabilities = Readonly<{
  provider: DatabaseProvider;
  transactionModel: 'interactive';
  sideRecordAtomicity: 'same_commit';
  callbackAttempts: 'one';
  cancellation: 'cooperative' | 'driver';
  supportedIsolationLevels: readonly IsolationLevel[];
}>;

export type CommandTransactionRequest = Readonly<{
  options?: TransactionOptions;
}>;

export type ReceiptClaim = Readonly<{
  id: string;
  scope: string;
  commandName: string;
  commandVersion: number;
  keyHash: string;
  requestHash: string;
  actorKind: 'principal' | 'system';
  actorSubject: string;
  correlationId: string;
  createdAt: Date;
}>;

export type StoredCommandReceipt = Readonly<{
  id: string;
  requestHash: string;
  commandVersion: number;
  responseJson: string;
  correlationId: string;
  completedAt: Date;
}>;

export type ReceiptClaimResult =
  | Readonly<{ kind: 'execute'; receiptId: string }>
  | Readonly<{ kind: 'replay'; receipt: StoredCommandReceipt }>
  | Readonly<{ kind: 'mismatch' }>
  | Readonly<{ kind: 'busy'; retryAfterMs?: number }>;

export type StoredCommandAudit = Readonly<{
  id: string;
  executionId: string;
  commandName: string;
  commandVersion: number;
  action: string;
  subjectType: string;
  subjectId: string;
  actorKind: 'principal' | 'system';
  actorSubject: string;
  actorScheme?: string;
  correlationId: string;
  dataJson?: string;
  occurredAt: Date;
}>;

export type StoredCommandOutbox = Readonly<{
  id: string;
  executionId: string;
  commandName: string;
  commandVersion: number;
  destination: string;
  topic: string;
  payloadJson: string;
  dedupeKey: string;
  correlationId: string;
  traceparent?: string;
  tracestate?: string;
  availableAt: Date;
}>;

export interface CommandTransaction<TTx> {
  readonly business: TTx;
  claimReceipt(
    claim: ReceiptClaim,
    signal?: AbortSignal,
  ): Promise<ReceiptClaimResult>;
  completeReceipt(
    completion: Readonly<{
      receiptId: string;
      responseJson: string;
      completedAt: Date;
    }>,
    signal?: AbortSignal,
  ): Promise<void>;
  appendAudit(
    records: readonly StoredCommandAudit[],
    signal?: AbortSignal,
  ): Promise<void>;
  appendOutbox(
    messages: readonly StoredCommandOutbox[],
    signal?: AbortSignal,
  ): Promise<void>;
}

export interface CommandStorePort<TTx> {
  readonly capabilities: CommandStoreCapabilities;
  transaction<TResult>(
    request: CommandTransactionRequest,
    work: (transaction: CommandTransaction<TTx>) => Promise<TResult>,
    signal?: AbortSignal,
  ): Promise<TResult>;
}
```

A `CommandStorePort` with `sideRecordAtomicity: "same_commit"` must make that a construction
invariant, not a configuration promise. Its `CommandTransaction` is created inside the provider
callback, all four delegates are derived from that callback's `TTx`, and no root client is accepted
by the side-record bridge.

`callbackAttempts: "one"` forbids an adapter from replaying `work` after serialization, deadlock, or
busy failures. The adapter may retry connection acquisition before invoking `work`, but once invoked
the result is commit, rollback, or a surfaced failure.

`cancellation: "cooperative"` means the adapter checks the signal before beginning and between
framework-controlled steps but the driver cannot interrupt an already-issued query. Such an adapter
must also enforce a transaction timeout. `"driver"` may be advertised only when the actual driver
cancels in-flight operations. Cancellation never means rollback succeeded until the transaction
boundary reports it.

The existing `withTransaction()` cannot implement this contract verbatim: it types its callback as
the full root client through an assertion. The reference implementation must first give that helper
a true `TRoot`/`TTx` signature or call the correctly typed Prisma callback directly. Nested
`$transaction`, connection lifecycle, and other root-only methods must be absent from `TTx`.

### Logical row contracts

The application owns the tables and migrations. The packages own these logical field contracts:

#### Command receipt

| Field            | Logical type                 | Constraint                                                  |
| ---------------- | ---------------------------- | ----------------------------------------------------------- |
| `id`             | UUID/string                  | primary key; generated before claim                         |
| `scope`          | bounded UTF-8 string         | 1–256 bytes; application receipt namespace                  |
| `commandName`    | bounded string               | validated command name                                      |
| `commandVersion` | positive integer             | definition version that produced the receipt                |
| `keyHash`        | 64 lowercase hex chars       | SHA-256 of the UTF-8 idempotency key; raw key is not stored |
| `requestHash`    | 64 lowercase hex chars       | exact canonical request hash                                |
| `actorKind`      | `principal \| system`        | durable origin class                                        |
| `actorSubject`   | bounded string               | authenticated/system subject; no roles/scopes/claims        |
| `correlationId`  | bounded string               | durable application correlation value                       |
| `responseJson`   | nullable canonical JSON text | null only inside the uncommitted claim                      |
| `createdAt`      | UTC timestamp                | claim time from injected clock                              |
| `completedAt`    | nullable UTC timestamp       | set with `responseJson` before commit                       |

There is a unique key on `(scope, commandName, keyHash)`. `responseJson` and `completedAt` must be
both null or both non-null. A committed incomplete receipt is corruption, not “in progress”; normal
concurrency cannot observe the uncommitted claim. Provider-aware generated migrations add the check
constraint where the provider supports it, while conformance tests enforce the invariant on every
adapter.

The idempotency key is not part of `requestHash`. It selects the receipt. Including it in the hash
would add no replay protection. The raw key is never persisted, logged, or emitted to telemetry.

#### Command audit

| Field                                        | Logical type                 | Constraint                           |
| -------------------------------------------- | ---------------------------- | ------------------------------------ |
| `id`                                         | UUID/string                  | primary key                          |
| `executionId`                                | UUID/string                  | originating command attempt          |
| `commandName` / `commandVersion`             | string / integer             | durable command identity             |
| `action`                                     | bounded string               | application-owned action vocabulary  |
| `subjectType` / `subjectId`                  | bounded strings              | application-owned target identity    |
| `actorKind` / `actorSubject` / `actorScheme` | bounded strings              | origin evidence; scheme nullable     |
| `correlationId`                              | bounded string               | copied from the envelope             |
| `dataJson`                                   | nullable canonical JSON text | application-owned, redacted metadata |
| `occurredAt`                                 | UTC timestamp                | injected clock                       |

The kit does not define a domain audit taxonomy, authorization model, legal retention policy, or
tamper-proof log. It guarantees only that a valid audit row supplied by the handler shares the
business commit. Applications restrict update/delete privileges and choose retention according to
their requirements.

#### Command outbox

| Field                            | Logical type               | Constraint                                          |
| -------------------------------- | -------------------------- | --------------------------------------------------- |
| `id`                             | UUID/string                | stable message ID and default downstream dedupe key |
| `executionId`                    | UUID/string                | originating command attempt                         |
| `commandName` / `commandVersion` | string / integer           | originating command                                 |
| `destination`                    | bounded string             | logical sink registry key                           |
| `topic`                          | bounded string             | versioned application message type                  |
| `payloadJson`                    | canonical JSON text        | validated codec output                              |
| `dedupeKey`                      | bounded string             | handler value or `id` by default                    |
| `correlationId`                  | bounded string             | durable application correlation                     |
| `traceparent` / `tracestate`     | nullable validated strings | W3C propagation only                                |
| `availableAt`                    | UTC timestamp              | earliest delivery time                              |
| `attemptCount`                   | non-negative integer       | relay attempts                                      |
| `claimToken` / `claimUntil`      | nullable string/timestamp  | expiring relay lease                                |
| `publishedAt`                    | nullable UTC timestamp     | set only after sink acknowledgement                 |
| `terminalAt`                     | nullable UTC timestamp     | set only when retry policy is exhausted             |
| `lastFailure`                    | nullable bounded enum      | classified failure, not raw payload/stack           |

The command transaction inserts only the immutable delivery intent and initial relay fields.
Lease/attempt/publication updates happen in later relay transactions. There is no arbitrary headers
map: sink adapters construct protocol headers, validate trace context, and retrieve credentials from
runtime configuration rather than durable rows.

Payloads and responses use canonical JSON text, not a provider `Json` scalar. That avoids assuming
identical Prisma JSON support and native types across PostgreSQL, MySQL, SQL Server, and SQLite.
Provider generators may add efficient native projections, but the portable contract is text.

### Schema and bridge ownership

`netscript db command-store init --database <config-key>` is the proposed explicit generator. It:

1. detects the configured Prisma provider;
2. appends provider-specific receipt/audit/outbox models using stable `NetScriptCommand*` names;
3. creates a reviewable migration, including unique/check/index definitions;
4. emits `database/<config-key>/command-store.ts`, which binds the generated delegates and true
   transaction client to `CommandStorePort<TTx>`; and
5. refuses to overwrite edited models or run a migration without the consumer's normal DB command.

The package never injects models during import, service startup, `defineService()`, or relay
startup. The generated bridge is consumer-owned, checked in, and discoverable. Model renames require
an explicit bridge update; they do not change the public store contract.

### Canonical request identity

Before opening the transaction, the executor builds this exact value:

```ts
type CanonicalCommandRequest = Readonly<{
  command: string;
  definitionVersion: number;
  scope: string;
  input: CommandJson;
  actor: Readonly<{
    kind: 'principal' | 'system';
    subject: string;
  }>;
  expectedVersion: string | null;
}>;
```

The steps are normative:

1. validate command/envelope bounds and idempotency policy;
2. call the command's `scope({ input, actor })` and `fingerprint(input)` exactly once;
3. validate the result as I-JSON;
4. serialize the complete value with RFC 8785 JCS to UTF-8;
5. compute SHA-256 with `crypto.subtle.digest("SHA-256", bytes)`; and
6. encode the digest as 64 lowercase hexadecimal characters.

The key digest separately hashes the UTF-8 idempotency key with the same SHA-256/hex encoding. The
request hash is a consistency token, not an authenticator or password hash. It must not be used for
authorization, message signing, or proof of possession.

`fingerprint(input)` intentionally selects the semantic command input. Transport-only values such as
the idempotency key are excluded. The command author must include every input field that can change
the effect. Negative conformance mutates each contract field and proves either that the fingerprint
changes or that the field is explicitly classified transport-only.

`scope()` is equally deterministic: it may use only the supplied input and narrowed actor, performs
no I/O, and excludes transport-only idempotency, trace, and correlation values. Scope partitions a
receipt namespace (for example by tenant or aggregate); it must not vary between retries of the same
intent. The restricted argument deliberately withholds the rest of `CommandEnvelope`.

`definitionVersion` changes when request identity, response decoding, or command meaning changes.
Because the receipt unique key does not include that version, a retry crossing a deployment returns
`IDEMPOTENCY_KEY_REUSE` rather than executing a new command under the old key. This is safer than
silently applying the intent again.

### Transaction algorithm

For one `execute()` call:

1. Validate command metadata, envelope bounds, actor, W3C trace context, required idempotency, store
   atomicity, requested isolation, and buffer limits. Unsupported capabilities fail before the
   handler.
2. Compute scope, input fingerprint, request hash, and key hash outside the transaction. Codec or
   canonicalization failure is a typed non-retryable configuration/input failure.
3. Start `command.execute` as a child of the active RPC/server span when available.
4. Call `store.transaction()` once with the selected isolation/timeout and signal.
5. If a key is present, call `claimReceipt()`:
   - `mismatch` becomes `idempotency_key_reuse` without running the handler;
   - `busy` becomes `in_progress`;
   - `replay` validates the stored hash/version, parses and decodes `responseJson`, and returns
     without business, audit, or outbox writes; and
   - `execute` continues with its receipt ID.
6. Invoke the handler exactly once with `transaction.business` and empty in-memory buffers.
7. Enforce required/optional/forbidden record policies and count/byte limits.
8. Encode the response, validate audit/outbox values, create one attempt `executionId` plus stable
   record IDs, and canonicalize their JSON text. For a keyed attempt, the receipt ID is the
   `executionId`; an unkeyed optional attempt still receives an `executionId` for its side records.
9. Append audit rows, append outbox rows, and complete the receipt, in that order, through the bound
   transaction. A no-key optional attempt skips claim/completion.
10. Return from the transaction callback and wait for the adapter's commit result.
11. Record `applied` or `replayed` telemetry and return the decoded value.

Any exception or cancellation before the successful commit rolls back all transaction writes. A
fault after commit but before step 11 may lose the response to that call; retry with the same key
loads the committed receipt. No post-commit “repair write” exists for receipts, audit, or outbox.

The order in step 9 aids deterministic fault injection but does not create partial visibility: every
append and completion still belongs to the same transaction. A business error thrown by the handler
remains the handler's declared error; the executor does not wrap arbitrary application errors as
storage failures.

### Semantic laws

Every conforming implementation and adapter satisfies these laws:

1. **Atomic rollback law.** A fault before commit leaves no business-state delta, completed receipt,
   audit row, or outbox row.
2. **Same-commit law.** If any one local row from a successful attempt is visible, all local rows
   from that attempt are visible.
3. **Replay law.** Same receipt key and request hash returns the first decoded response, sets
   `outcome = replayed`, and produces no new business/audit/outbox rows.
4. **Key-reuse law.** Same receipt key and different request hash never invokes the handler and
   returns the typed non-retryable key-reuse failure.
5. **Concurrent-claim law.** Of concurrent identical attempts, at most one handler commits. A
   follower replays, runs only after the leader rolled back, or receives a bounded retryable busy
   failure.
6. **Receipt-completion law.** A committed receipt is complete and decodable. An incomplete or
   invalid committed receipt is corruption and never causes handler execution.
7. **CAS law.** A command requiring optimistic concurrency performs the version predicate in the
   mutation. Zero matched rows becomes a conflict and rolls back every buffered record.
8. **No-hidden-retry law.** One executor call invokes the handler no more than once.
9. **Isolation-refusal law.** A requested level absent from `supportedIsolationLevels` is refused
   before opening the transaction.
10. **Stable-message law.** A committed outbox row retains one `id`/`dedupeKey` across every relay
    claim, lease expiry, retry, and redelivery.
11. **At-least-once relay law.** A successful sink acknowledgement eventually permits `publishedAt`,
    but publish-before-crash may result in the same message being observed again.
12. **Boundary law.** No SQL+KV, SQL+stream, SQL+HTTP, two-database, or other cross-store operation
    is represented as one command transaction.

“At most one handler commits” is conditional on a supplied idempotency key. An optional attempt
without one retains only the atomic rollback and same-commit laws.

### Optimistic concurrency and isolation

The executor propagates `expectedVersion` and supplies `ctx.conflict()`. It cannot manufacture a
portable conditional mutation because only the application repository knows the model, key, version
column, and write set.

The supported pattern is one provider query whose predicate includes the expected version and whose
result proves whether it matched. A preliminary read may be useful for business decisions but never
replaces the conditional write. The proposal's `expectVersion(current)` is rejected because another
transaction can write between comparison and mutation.

Isolation is a set, not a scalar “maximum.” The command declares the minimum concrete level its
algorithm was tested with. Omitting `isolationLevel` uses the database default and records `default`
in command telemetry; it does not claim a portable effective level. Commands maintaining multi-row
invariants normally require `Serializable` or another provider-specific locking design and must test
serialization/deadlock outcomes.

The executor does not automatically retry serialization, deadlock, or SQLite busy failures. Those
become retryable store outcomes. A caller can retry the entire request with the same key, which is
safe whether the original attempt rolled back or committed before its response was lost.

### Adapter capability matrix

“Engine feasible” and “currently integrated by NetScript” are deliberately separate:

| Store                                  | Engine/Prisma transaction facts                                                                                                  | Current NetScript integration at `fac9e339`                  | RFC position                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| PostgreSQL + Prisma                    | interactive transactions; `ReadUncommitted` maps to `ReadCommitted`; `ReadCommitted`, `RepeatableRead`, `Serializable` available | Postgres adapter/root surface exists                         | reference v1 adapter after full conformance                                                     |
| MySQL + Prisma                         | interactive; `ReadUncommitted`, `ReadCommitted`, `RepeatableRead`, `Serializable`; no `Snapshot`                                 | `@netscript/database/adapters/mysql` exists                  | conforming v1 target; #1293 is adjacent lower-level surface work, not an atomicity prerequisite |
| SQL Server + Prisma                    | interactive; all five current `IsolationLevel` values; `Snapshot` requires database enablement                                   | `@netscript/database/adapters/mssql` exists                  | conforming v1 target; capability must omit `Snapshot` when not enabled                          |
| SQLite + Prisma                        | transactions are serializable in Prisma's matrix; multiple readers but one writer; busy/timeout behavior differs                 | provider enum exists, but no NetScript SQLite adapter export | feasible but unsupported/unclaimed until an adapter and real contention/fault suite land        |
| Deno KV                                | optimistic atomic checks/mutations with operation limits; no interactive callback                                                | `@netscript/kv` and worker idempotency exist                 | not a v1 `CommandStorePort`; no weaker command mode                                             |
| two SQL stores or SQL + KV/stream/HTTP | no portable shared commit                                                                                                        | components may exist separately                              | refused; commit an outbox intent and continue through a consumer/saga                           |

Same-commit audit/outbox feasibility follows from using tables in the same database and the exact
transaction client. It does not follow from the provider name alone. Each provider becomes
“supported” only when its generated schema, transaction bridge, contention behavior, fault suite,
doc lint, publish gates, and consumer test pass.

The current database helper's `IsolationLevel` vocabulary is reused. The RFC does not introduce a
second enum. Provider adapters publish the exact supported subset and relevant configuration
preconditions.

### Typed failure model

The service subpath exposes a discriminated failure payload on `CommandError`:

```ts
export type CommandFailure =
  | Readonly<{
    kind: 'invalid_envelope';
    retryable: false;
    reason:
      | 'actor'
      | 'correlation'
      | 'idempotency_required'
      | 'trace_context';
  }>
  | Readonly<{
    kind: 'optimistic_conflict';
    retryable: false;
  }>
  | Readonly<{
    kind: 'idempotency_key_reuse';
    retryable: false;
  }>
  | Readonly<{
    kind: 'in_progress';
    retryable: true;
    retryAfterMs?: number;
  }>
  | Readonly<{
    kind: 'unsupported_capability';
    retryable: false;
    capability: 'store_atomicity' | 'isolation' | 'transaction_model';
  }>
  | Readonly<{
    kind: 'codec_failure';
    retryable: false;
    phase: 'fingerprint' | 'response_encode' | 'response_decode' | 'side_record';
  }>
  | Readonly<{
    kind: 'receipt_corrupt';
    retryable: false;
  }>
  | Readonly<{
    kind: 'store_failure';
    retryable: boolean;
    phase: 'begin' | 'claim' | 'business' | 'flush' | 'complete' | 'commit';
  }>
  | Readonly<{
    kind: 'aborted';
    retryable: true;
  }>;

export class CommandError extends Error {
  readonly failure: CommandFailure;

  constructor(failure: CommandFailure, options?: ErrorOptions);
}
```

Driver codes, SQL text, payloads, actor IDs, scope, hashes, and stored response text are never
placed in the public failure. Adapters classify known serialization/deadlock/busy/timeout failures
behind `store_failure` while retaining the original error as a non-serialized `cause` for trusted
logs.

Application/business errors thrown by the handler are outside this union and preserve their own
contract mapping. `ctx.conflict()` is the one convenience constructor because optimistic conflicts
are part of command composition rather than a domain-specific taxonomy.

The opt-in contract fragment is:

```ts
export const commandErrorMap = {
  COMMAND_CONFLICT: {
    status: 409,
    message: 'The command no longer matches current state',
    data: z.object({
      kind: z.literal('optimistic_conflict'),
      retryable: z.literal(false),
    }),
  },
  IDEMPOTENCY_KEY_REUSE: {
    status: 409,
    message: 'The idempotency key was used for another request',
    data: z.object({
      kind: z.literal('idempotency_key_reuse'),
      retryable: z.literal(false),
    }),
  },
  COMMAND_IN_PROGRESS: {
    status: 409,
    message: 'An identical command is still in progress',
    data: z.object({
      kind: z.literal('in_progress'),
      retryable: z.literal(true),
      retryAfterMs: z.number().int().nonnegative().optional(),
    }),
  },
} as const;

export const commandBaseContract = baseContract.errors(commandErrorMap);

export type CommandContractErrors = MergedErrorMap<
  BaseContractErrors,
  typeof commandErrorMap
>;

export type CommandContractRoute<
  TInput extends AnySchema,
  TOutput extends AnySchema,
> = ContractProcedureBuilderWithInputOutput<
  TInput,
  TOutput,
  CommandContractErrors,
  Record<never, never>
>;

export interface CommandErrorConstructors {
  COMMAND_CONFLICT(options: {
    message?: string;
    data: { kind: 'optimistic_conflict'; retryable: false };
  }): unknown;
  IDEMPOTENCY_KEY_REUSE(options: {
    message?: string;
    data: { kind: 'idempotency_key_reuse'; retryable: false };
  }): unknown;
  COMMAND_IN_PROGRESS(options: {
    message?: string;
    data: {
      kind: 'in_progress';
      retryable: true;
      retryAfterMs?: number;
    };
  }): unknown;
}

export function throwCommandContractError(
  error: unknown,
  errors: CommandErrorConstructors,
): never;
```

Invalid envelopes map to existing validation handling. Unsupported capability is a deployment or
composition error and should normally fail startup/registration, not reach a client. Codec,
corruption, and unexpected store failures map through existing internal/service-unavailable
handling. That division keeps safe client action separate from operational detail.

The client-visible typed-error path cannot ship honestly until #1350 preserves the error generic
through `baseContract`, the service client, `safe()`, and `isDefinedError()`. Runtime executor/store
work may be developed behind an unexported seam, but the command subpaths and docs are not released
as complete until the positive and negative #1350 type fixtures pass.

### Relay, workers, sagas, and remote sinks

The relay has its own ports:

```ts
export type CommandRelayFailureClass =
  | 'rejected'
  | 'rate_limited'
  | 'unavailable'
  | 'timeout'
  | 'invalid_response'
  | 'misconfigured';

export type ClaimedCommandOutbox = Readonly<{
  id: string;
  executionId: string;
  destination: string;
  topic: string;
  payloadJson: string;
  dedupeKey: string;
  correlationId: string;
  traceparent?: string;
  tracestate?: string;
  attemptCount: number;
  claimToken: string;
  claimUntil: Date;
}>;

export type CommandOutboxDelivery = Readonly<{
  id: string;
  destination: string;
  topic: string;
  payload: CommandJson;
  dedupeKey: string;
  correlationId: string;
  trace?: CommandTraceContext;
}>;

export type CommandOutboxRelease =
  & Readonly<{
    id: string;
    claimToken: string;
    failure: CommandRelayFailureClass;
  }>
  & (
    | Readonly<{ disposition: 'retry'; retryAt: Date }>
    | Readonly<{ disposition: 'terminal'; terminalAt: Date }>
  );

export interface CommandOutboxRelayStore {
  claim(
    request: Readonly<{
      limit: number;
      leaseMs: number;
      now: Date;
    }>,
    signal?: AbortSignal,
  ): Promise<readonly ClaimedCommandOutbox[]>;
  markPublished(
    request: Readonly<{
      id: string;
      claimToken: string;
      publishedAt: Date;
    }>,
    signal?: AbortSignal,
  ): Promise<boolean>;
  release(
    request: CommandOutboxRelease,
    signal?: AbortSignal,
  ): Promise<boolean>;
}

export interface CommandOutboxSink {
  readonly id: string;
  publish(
    message: CommandOutboxDelivery,
    signal?: AbortSignal,
  ): Promise<void>;
}
```

Claims are bounded and leased. `markPublished` and `release` compare the claim token so an expired
worker cannot acknowledge another worker's lease. Provider adapters choose their correct locking
algorithm; the public port does not pretend `FOR UPDATE SKIP LOCKED` is portable SQL.

`claim()` returns only rows that are unpublished, non-terminal, due, and either unclaimed or have an
expired lease. A retry release clears the lease and advances `availableAt`; a terminal release
clears the lease and sets `terminalAt`. Neither path changes the stable message ID or dedupe key.
Relay configuration owns bounded attempts and backoff; the row stores only the resulting state.

The explicit generator emits a visible `defineJob("netscript.command-outbox-relay")` drain job and a
sink registry. Deleting or disabling that job visibly stops delivery without affecting command
commits. The job's own worker idempotency governs a job delivery, not an outbox row's remote effect,
and therefore does not replace row leases or stable message IDs.

Sink rules:

- **worker job:** set the queue/message idempotency or deduplication key to outbox `dedupeKey` and
  propagate `traceparent`/`tracestate`;
- **saga:** publish a saga message only after local commit, with the outbox ID as idempotency input;
  the saga handler still guards redelivery and owns later compensation;
- **stream:** use the stable producer/message identity supported by the stream and keep the consumer
  idempotent;
- **HTTP/webhook:** #1364's recipe signs at publish time using runtime secrets and sends the stable
  outbox ID as the receiver's idempotency key. Secrets and signatures are not stored in the row.

A sink acknowledgement means only that the sink's documented acceptance boundary succeeded. The
relay marks the row afterward. A crash between those actions causes redelivery. Marking before
publish is forbidden because it can lose a message permanently.

The existing saga outbox port is not merged into this port. It is reserved for atomic saga state and
cascade persistence and lacks this command transaction binding. Future implementation may share
private lease utilities after both contracts exist, but their public semantics remain independently
owned.

### Precise refusal boundary

The kit refuses these shapes:

- business rows and receipt/audit/outbox rows cannot be written through the same `TTx`;
- a handler requires an isolation level the configured adapter cannot honor;
- one operation must commit state in two databases, SQL and KV, or any other two stores;
- success requires a remote response before the local transaction can commit;
- a network call, queue publish, saga publish, file write, or process invocation is placed in the
  handler's transactional effect path;
- a provider offers only claim → effect → mark semantics rather than a replay receipt in the same
  store; or
- a response/payload/fingerprint cannot be represented by the declared codec as canonical I-JSON.

The remedy is not a “best effort” capability flag. Redesign the local command to commit an intent,
then use a worker or saga for later work. If later work fails, its retry/compensation is a runtime
concern; it cannot roll back the already committed command.

### Security and privacy

#### Identity and authorization

Authentication and authorization complete before `execute()`. The command actor is a narrowed copy,
not a mutable reference to all principal claims. A missing authenticated principal on a
principal-required route is an envelope failure. Background/system commands use an explicit,
allow-listed system subject and do not forge `kind: "principal"`.

Actor subject, system subject, scope, and correlation values are bounded and validated before any
query. None is interpolated into SQL, topic names, log templates, or telemetry attribute keys.
Correlation is an observability value, never an authorization credential.

#### Idempotency and canonicalization

Callers should generate at least 128 bits of idempotency entropy. Keys are 16–256 UTF-8 bytes,
transported only over authenticated/encrypted channels, hashed before storage, and never accepted as
proof of identity. Low-entropy keys remain vulnerable to guessing even when hashed; the digest is
data minimization, not password hardening.

Fingerprint and response codecs impose depth, item-count, and byte limits before canonicalization.
Non-finite numbers and non-I-JSON values are rejected. Parsing a stored response repeats these
limits to avoid treating the database as trusted input.

#### Audit/outbox data

Applications put only the minimum operational data into `data` and `payload`. Credentials, session
tokens, raw authorization claims, encryption keys, and unredacted request bodies are forbidden.
Storage encryption, backups, retention, erasure, and row-level access remain deployment concerns.
The command DB role may insert audit/outbox rows; relay roles may lease/update outbox rows but
should not mutate business/audit/receipt tables.

The sink registry is configured code, not a destination URL from an outbox row. That prevents an
untrusted command payload from choosing an arbitrary host. HTTP headers are constructed from an
allow-list, with CR/LF and W3C trace-context validation.

#### Resource exhaustion

The executor enforces maximum records, canonical bytes, string lengths, and transaction timeout. The
relay enforces batch size, lease duration, maximum attempts, backoff, and cancellation. A
permanently failing row moves to an explicitly configured terminal/dead-letter state; it is never
silently marked published.

### OpenTelemetry vocabulary

V1 adds these constants/builders to `@netscript/telemetry/attributes`:

```ts
export const CommandSpanNames = {
  EXECUTE: 'command.execute',
  OUTBOX_RELAY: 'command.outbox.relay',
  OUTBOX_PUBLISH: 'command.outbox.publish',
} as const;

export const CommandAttributes = {
  NAME: 'netscript.command.name',
  DEFINITION_VERSION: 'netscript.command.definition.version',
  OUTCOME: 'netscript.command.outcome',
  IDEMPOTENCY: 'netscript.command.idempotency',
  ISOLATION: 'netscript.command.isolation',
  STORE_PROVIDER: 'netscript.command.store.provider',
  AUDIT_COUNT: 'netscript.command.audit.count',
  OUTBOX_COUNT: 'netscript.command.outbox.count',
} as const;
```

Allowed values are closed:

| Attribute                              | Values / bound                                                        | Default                      |
| -------------------------------------- | --------------------------------------------------------------------- | ---------------------------- |
| `netscript.command.name`               | registered definition name, max 120                                   | required                     |
| `netscript.command.definition.version` | positive integer                                                      | required                     |
| `netscript.command.outcome`            | `applied`, `replayed`, `conflict`, `rejected`, `failed`, `cancelled`  | required                     |
| `netscript.command.idempotency`        | `claimed`, `replayed`, `not_requested`, `missing`, `mismatch`, `busy` | required                     |
| `netscript.command.isolation`          | requested enum value or `default`                                     | required                     |
| `netscript.command.store.provider`     | adapter's bounded provider ID                                         | required                     |
| audit/outbox counts                    | non-negative bounded integers                                         | on successful handler/replay |

The command execution span is `INTERNAL` beneath the active RPC/server span. Relay publish is a
`PRODUCER` span; a later worker/saga/stream creates its normal consumer span using propagated W3C
context or a span link where deferred/batch semantics require it.

Default command telemetry must not contain raw scope, actor/system subject, idempotency key or
digest, request hash, expected/actual version, receipt/outbox/audit IDs, payload/response data,
arbitrary topic/destination, or correlation ID. Trace IDs already exist in span context. Application
logs may include a validated correlation ID under their redaction/access policy; telemetry
inclusion, if ever allowed, is an explicit opt-in FCP policy.

Metrics may count executions and record duration by command name, outcome, idempotency state, and
provider only. No unbounded identifier becomes a metric dimension. Errors record `error.type` as the
stable failure kind, not a driver message or stack-derived value.

### Injected-failure conformance

`@netscript/service/commands/testing` exposes a test-only `CommandFaultController`. Production
constructors do not accept it. The canonical named seams are:

| Seam                         | Expected invariant                                             |
| ---------------------------- | -------------------------------------------------------------- |
| `before_transaction`         | no store call and no rows                                      |
| `after_claim`                | claim rolls back; retry may execute                            |
| `after_handler`              | business writes roll back; no side rows/receipt                |
| `after_audit`                | business and audit roll back; no outbox/receipt                |
| `after_outbox`               | business/audit/outbox roll back; no completed receipt          |
| `after_receipt_complete`     | every write rolls back because commit has not happened         |
| `after_commit_before_return` | all rows exist once; same-key retry replays                    |
| `relay_after_claim`          | lease expires/releases; message remains unpublished            |
| `relay_after_publish`        | message may be observed twice with the same stable ID          |
| `relay_after_mark`           | row remains published; another relay does not publish it again |

The shared suite runs the following positive/negative matrix against every provider:

1. successful applied command with 0/1/many allowed side records;
2. required/forbidden audit and outbox policy failures;
3. same-key/same-hash sequential replay;
4. same-key/different-hash rejection without handler invocation;
5. concurrent identical claims with a barrier around the handler;
6. leader rollback followed by follower execution;
7. bounded busy/timeout classification;
8. CAS zero-match rollback;
9. requested unsupported isolation refusal before begin;
10. serialization/deadlock/busy error with handler invocation count exactly one;
11. invalid/corrupt/incomplete stored receipt refusal without execution;
12. response/payload/fingerprint codec failures, including `Date`, `BigInt`, non-finite numbers,
    cyclic values, depth, and byte overflow;
13. abort before begin, during handler, between flush steps, and during relay;
14. every named command fault seam;
15. relay lease expiry, stale-token mark/release, publish-then-crash redelivery, terminal failure,
    and graceful shutdown;
16. forbidden telemetry fields and exact allowed enum/count attributes; and
17. a negative control that bypasses the executor or writes one side record with a root client and
    proves the same-commit suite fails.

PostgreSQL is the reference real-provider suite. MySQL and SQL Server must run the same semantic
suite, not mocks with provider labels. SQLite, if proposed, additionally runs multiple-connection
writer contention, busy timeout, process crash/reopen, and lease tests. No adapter earns a
capability row from a type-only fake.

The suite records database/runtime versions, schema migration digest, exact command, exit code, and
failed test name. Tests clean only resources they positively own. Implementation merge readiness
also includes package tests, doc lint, publish dry run, and the full generated CLI runtime smoke
once after the explicit generators land.

### Compatibility and migration

This RFC is additive. Existing service builders, contracts, CRUD handlers, database adapters, worker
jobs, saga definitions, and telemetry keep their current behavior. No existing handler is
automatically wrapped, no table is created at startup, and no default scaffold starts a relay.
Therefore the RFC itself does not require a `breaking` label.

Adding public subpaths is a coordinated minor release for `@netscript/service`,
`@netscript/database`, and `@netscript/contracts`; the telemetry attributes subpath gains symbols in
the same release train. Every new entrypoint needs module docs/examples, explicit isolated-
declaration-safe exports, `deno doc --lint` over the full package export map, surface-diff review,
clean publish file lists, and a consumer import fixture. The implementation must not make
self-referential bare imports inside those packages.

Because `jsonCodec()` names `StandardSchemaV1` in a public signature, `@netscript/service` must
declare `@standard-schema/spec` directly in its package import map rather than rely on another
package's transitive resolution. The dependency is already used elsewhere in this workspace but is
not currently declared by the service package. Its exact version follows the normal Deno toolchain
update policy at implementation time.

An existing application adopts the seam explicitly:

1. upgrade after #1350 and the command package slices are published;
2. run `netscript db command-store init --database <config-key>` and review/apply the migration;
3. compose one `commandStore` and executor in the service infrastructure layer;
4. convert one non-CRUD mutation to a command, preserving its existing contract shape;
5. choose and document idempotency scope, semantic fingerprint, output codec, CAS, audit data, and
   outbox topics;
6. run the adapter/failure suite against the application's database;
7. generate/configure the relay and one sink only if the command emits outbox messages; and
8. deploy the relay before depending on timely delivery, then monitor backlog/age/failure metrics.

For an existing application-owned receipt or outbox, migration is not an automatic table copy.
Implement a bridge that satisfies the logical contract, prove it with conformance, and migrate keys
and encoded responses deliberately. Changing receipt scope, command name, fingerprint, codec, or
definition version without a retention/retry plan can turn valid retries into conflicts; those
changes require release notes and compatibility tests.

Receipt retention must be at least the maximum advertised client retry window. Deleting a receipt
earlier permits the same key to execute again. Published outbox cleanup must not remove rows still
needed for operational reconciliation. Audit retention is application policy. Exact default
durations remain an FCP question.

### CLI and scaffold impact

The current CLI already has `contract add-route` and `service add-handler`. V1 extends those
explicit paths rather than changing every scaffold:

- `netscript contract add-route <contract> <procedure> --command` adds the opt-in command error map
  and requires explicit input/output schemas;
- `netscript service add-handler <service> <procedure> --command --database <config-key>` emits a
  command definition stub and router binding in the layered service shape owned by #1362;
- `netscript db command-store init --database <config-key>` emits provider-specific models,
  migration, and transaction bridge; and
- `netscript generate command-relay --database <config-key>` emits the visible worker drain job and
  sink registry.

The proposed service layout is:

```text
services/<service>/src/
  application/commands/<command>.ts
  infrastructure/command-store.ts
  routers/<version>.ts
database/<config-key>/
  schema.prisma
  command-store.ts
workers/jobs/
  command-outbox-relay.ts
  command-outbox-sinks.ts
```

Generators refuse missing #1362 layering, unsupported providers, duplicate models, edited target
files, and routes without declared command errors. They print planned files before writing and never
run database migration/deploy implicitly.

The normal `netscript init` and generated CRUD example remain unchanged initially. After the
implementation is stable, one neutral non-CRUD command may be added to the full scaffold runtime
fixture as consumer proof. That fixture must demonstrate a lost-response replay, CAS conflict,
same-commit audit/outbox, and relay redelivery without using domain-specific vocabulary.

Required docs:

- guide: “Write a transactional command”;
- reference: every new package subpath and logical row/error/telemetry contract;
- operations: relay deployment, backlog, lease, retry, terminal failure, and retention;
- explanation: command versus CRUD versus worker versus saga;
- database matrix with current support/configuration preconditions;
- security/privacy checklist and canonicalization examples; and
- #1364's outbound-webhook recipe using the stable outbox ID and at-least-once wording.

### Staged implementation

No product code belongs in this RFC PR. After acceptance, implementation is staged contract-first:

| Stage | Owning archetype | Deliverable                                                                             | Required gate                                                                                |
| ----- | ---------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 0     | A1/type repair   | close #1350's literal error-map and client error-generic defects                        | positive/negative typed-error fixtures; contracts/SDK publish gates                          |
| 1     | A1               | `@netscript/contracts/commands` schemas/map and canonical JSON/codec contracts          | isolated declarations, doc lint, slow-type, runtime codec negatives                          |
| 2     | A4               | `@netscript/service/commands` definition/executor over an in-memory conformant fake     | semantic law suite, fault seams, forbidden remote/global design review                       |
| 3     | A2               | `@netscript/database/commands` true `TTx` store and PostgreSQL reference adapter/schema | real PostgreSQL concurrency/fault suite; surface/publish gates                               |
| 4     | A2               | command telemetry vocabulary and redaction tests                                        | exact span/attribute assertions; forbidden-field tests                                       |
| 5     | A3/A5            | relay store/sink ports and generated workers/saga/stream bridge                         | lease/crash/redelivery/shutdown tests; no deliver-once claim                                 |
| 6     | A2               | MySQL and SQL Server adapters                                                           | same semantic suite on each real provider; SQL Server snapshot config negative               |
| 7     | A2, optional     | SQLite adapter                                                                          | adapter export plus writer contention/crash/reopen conformance; otherwise remain unsupported |
| 8     | A6               | schema, route, service-command, and relay generators                                    | emitted samples; focused CLI tests; one full `scaffold.runtime` merge-readiness run          |
| 9     | docs             | guide/reference/operations/security/compatibility and #1364 integration                 | docs links/accuracy, executable snippets, published consumer proof                           |

Stages may use separate PRs and can be developed in parallel only where their contracts are already
merged. The public feature is not announced as complete until stages 0–6 and the required parts of
8–9 are green. SQLite is not a completeness requirement unless FCP makes it one.

### Issue and epic decomposition

No issues are created or mutated by this RFC PR. The recommended board reconciliation is:

- keep #1361 as the RFC tracking record through discussion/FCP and follow the RFC process for
  acceptance/numbering;
- keep #1363 as the `0.0.8` implementation umbrella rather than duplicating it;
- make #1350 a stage-0 dependency, not a vague “RFC-A” reference;
- let #1362 own generated service layering and make command-handler generation depend on it;
- let #1364 own the remote HTTP recipe/template and consume the command outbox when available;
- keep #1293 adjacent: it improves `@netscript/prisma-adapter-mysql` but does not block the current
  database package's MySQL transaction subpath; and
- cross-reference the type-soundness umbrella #1278 without merging its broader scope into this
  implementation.

Suggested PR-sized children under #1363:

| Proposed child                                          | Labels (plus one lifecycle status)                           | Milestone    |
| ------------------------------------------------------- | ------------------------------------------------------------ | ------------ |
| command contracts, errors, JCS codecs                   | `type:feat`, `area:contracts`, `area:service`, `priority:p1` | `0.0.8`      |
| command executor and semantic/fault test kit            | `type:feat`, `area:service`, `priority:p1`                   | `0.0.8`      |
| true transaction-client port + PostgreSQL command store | `type:feat`, `area:database`, `priority:p1`                  | `0.0.8`      |
| command OTel vocabulary and privacy tests               | `type:feat`, `area:telemetry`, `priority:p1`                 | `0.0.8`      |
| outbox relay and worker/saga sink adapters              | `type:feat`, `area:service`, `area:database`, `priority:p1`  | `0.0.8`      |
| MySQL/SQL Server command-store conformance              | `type:feat`, `area:database`, `priority:p1`                  | `0.0.8`      |
| optional SQLite adapter/conformance                     | `type:feat`, `area:database`, `priority:p2`                  | FCP decision |
| explicit CLI generators and scaffold consumer           | `type:feat`, `area:cli`, `area:service`, `priority:p1`       | `0.0.8`      |
| command/relay docs and executable examples              | `type:docs`, `area:docs`, `area:service`, `priority:p1`      | `0.0.8`      |

Each child PR that fully resolves its child issue uses a closing keyword in its body. Children
reference #1363 as an umbrella without closing it. The RFC PR references #1361 without a closing
keyword and never closes an epic/umbrella.

## Drawbacks

- The kit adds several public subpaths and durable concepts for what can look like “just a
  transaction.”
- Consumer-owned models and migrations are honest but create setup and upgrade work.
- Response codecs and semantic fingerprints are explicit authoring burden.
- Holding an interactive transaction across application logic can increase contention; strict
  timeouts and a no-network-I/O rule are necessary.
- Portability requires real-provider conformance, not one mock suite. SQL Server, MySQL, and
  potentially SQLite materially increase CI/runtime cost.
- Receipt retention consumes storage and becomes part of API retry compatibility.
- Audit/outbox buffers add memory and transaction writes.
- The type system cannot prevent a closure from capturing a remote client. Review, generated shape,
  tests, and doctrine must enforce that boundary.
- An at-least-once relay pushes deduplication responsibility to every downstream effect, which is
  correct but not effortless.

These costs are preferable to a smaller API that silently provides weaker semantics.

## Rationale and alternatives

### Why this design

The design keeps one public promise that adapters can prove: all local records share one store
commit. It reuses current isolation types, Principal-derived identity, Web Crypto, W3C trace
context, telemetry placement, `defineJob`, and saga compensation. New abstractions exist only where
the repository has no equivalent: replay receipts, command-bound audit/outbox rows, an executor, and
adapter conformance.

The store port is strong rather than configurable because a caller should not need to inspect a
boolean to discover that its audit or receipt is non-atomic. Provider variability still appears in
supported isolation sets, cancellation mode, and conformance status.

### Rejected alternatives

#### Reuse `withTransaction()` unchanged

Rejected because its public callback is asserted as the full root client. It permits code that does
not exist on a real Prisma transaction client. The implementation must correct or bypass the helper
with a true `TTx`.

#### Put everything in `@netscript/database`

Rejected because command identity, actor propagation, contract errors, handler policy, and
presentation are application/service concerns. Database owns only the transaction-bound persistence
and providers.

#### Add `@netscript/commands` now

Rejected as premature surface growth. A service subpath is sufficient until a second independent
host proves package-level reuse. The database subpath keeps provider code out of service.

#### Framework-owned hidden tables or startup migration

Rejected because a published library cannot silently own a product database, migration history,
retention, or provider-specific native types. Explicit generated consumer files are reviewable and
migrable.

#### Consumer-declared arbitrary receipt adapter without a generator

Rejected as the only path because drift in unique keys, nullability, response encoding, or lease
fields would undermine conformance. The logical port remains structural, but the supported path
emits a reviewed schema/bridge.

#### Global `CONFLICT` in `baseContract`

Rejected because it widens non-command contracts and does not distinguish optimistic conflict from
idempotency misuse. Route-local command errors are more precise and depend explicitly on #1350.

#### `expectVersion(current)`

Rejected because read-then-compare is racy. Optimistic concurrency must be enforced by a conditional
mutation or provider-specific locking algorithm.

#### `maxIsolation`

Rejected because isolation support is a provider/configuration set, not one uniformly ordered
portable ceiling. SQL Server `Snapshot` alone demonstrates the configuration issue.

#### Store arbitrary `unknown` responses or payloads

Rejected because replay requires stable round trips across deployments and providers. Explicit
I-JSON codecs and canonical text make failure and compatibility visible.

#### Automatic transaction retries

Rejected because replaying an application callback can repeat captured non-transactional work,
clock/ID reads, or bugs. The receipt makes whole-request retry explicit and observable.

#### Direct publish before or after commit

Publishing before commit can announce state that rolls back. Publishing after commit can lose the
message if the process crashes. A same-commit outbox plus at-least-once relay is the narrow durable
answer.

#### Weak KV command mode

Rejected because claim → effect → mark has a crash window and cannot replay the relational response
inside the business commit. Existing worker idempotency remains valid for its delivery scope; it is
not relabeled as command atomicity.

#### Use a saga for every local command

Rejected because a saga is unnecessary overhead for one atomic store mutation and does not replace
the local transaction. Sagas begin at multiple commits, time, remote work, or compensation.

#### Event sourcing

Rejected because this RFC does not make events authoritative state, rebuild aggregates, or define an
event schema/runtime. The outbox is a delivery intent derived from an ordinary transaction.

#### Ambient transaction context

Rejected because async-local or global context hides ownership and makes tests, nesting, and
cancellation harder to reason about. The transaction client is an explicit handler field.

### Impact of not doing this

Applications continue to hand-roll incompatible receipt tables, request hashes, outbox leases, audit
ordering, failure mapping, and telemetry—or omit them. Generated non-CRUD examples cannot teach a
truthful production boundary, and adapters cannot be held to one portable conformance suite.

## Breaking changes and migration

The RFC is additive and opt-in. It changes no current export, handler, schema, or scaffold by
itself. Future implementation adds focused subpaths and generator commands in minor releases.
Applications migrate command by command as described above; no automatic CRUD conversion occurs.

If FCP chooses to change an existing global contract error map or root export instead, that decision
must be re-evaluated for breaking surface impact. This draft does not propose either change.

## Prior art

- Prisma interactive transactions, transaction options, documented idempotent API design, and
  optimistic concurrency establish the provider-facing mechanics.
- RFC 8785 JCS provides deterministic JSON bytes for hashing instead of a local key-sorting
  convention.
- Deno KV versionstamp checks demonstrate optimistic atomic batches and, equally importantly, why
  that model is not an interactive SQL transaction.
- NetScript's `WorkerIdempotencyPort` demonstrates claim/apply/release for delivery, while its
  different crash boundary explains why command receipts remain separate.
- NetScript's saga message/compensation and queue delivery surfaces own multi-step work after the
  command boundary.
- The reserved `SagaOutboxPort` establishes that saga durability needs an outbox, but its T2
  lifecycle and lack of command transaction binding keep the public contracts separate.
- NetScript telemetry already centralizes job/saga/execution attributes and W3C propagation; the
  command vocabulary follows that placement with stricter cardinality defaults.

Primary references:

- [Prisma transactions and isolation](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [SQL Server transaction isolation](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql?view=sql-server-ver17)
- [SQLite transactions](https://www.sqlite.org/lang_transaction.html)
- [Deno KV transactions](https://docs.deno.com/deploy/kv/transactions/)
- [RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/info/rfc8785/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [OpenTelemetry tracing API](https://opentelemetry.io/docs/specs/otel/trace/api/)
- [OpenTelemetry attribute requirement levels](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/)

## Unresolved questions

These questions are intentionally reserved for discussion/FCP. None changes the one-store atomicity
contract:

1. **Idempotency default.** Must every v1 command require a key, or may a definition explicitly
   choose `mode: "optional"` and emit `not_requested`? Recommendation: required by default, explicit
   optional only for controlled internal callers.
2. **SQLite release timing.** Is a real SQLite adapter and contention suite required for the first
   stable command-kit release, or does SQLite remain unsupported until a later adapter PR?
   Recommendation: later; do not delay the reference/client-server adapters or claim current
   support.
3. **Correlation telemetry.** Should a validated correlation ID be an opt-in command attribute under
   an explicit redaction/cardinality policy, or remain durable-row/log-only? Recommendation:
   durable-row/log-only by default.
4. **Retention defaults.** What minimum receipt retry window and published-outbox cleanup defaults
   should generators document? Recommendation: require explicit deployment values until operational
   evidence establishes safe defaults; audit remains application policy.

The following are not open: no hidden schema ownership, no weak KV semantics, no global conflict
error, no automatic callback retry, no read-then-compare concurrency, no remote I/O in the command
transaction, and no exactly-once delivery claim.

## Future possibilities

Possible later work, requiring its own evidence and possibly another RFC:

- a second host proving that `@netscript/service/commands` should become an independent package;
- provider-native JSON projections behind the canonical-text contract;
- a formal schema registry for outbox payloads;
- configurable opt-in correlation telemetry with tested redaction;
- receipt archival/partition helpers;
- additional stores that can genuinely satisfy the same-commit port;
- tooling that statically flags known remote clients captured by command handlers; and
- a dashboard view joining a trace to durable command/audit/outbox state.

These possibilities do not expand v1's transaction boundary.
