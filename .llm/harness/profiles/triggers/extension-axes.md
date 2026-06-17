# Triggers — Extension Axes

> **Purpose.** Enumerate the **named** extension axes of the triggers architecture (Tier-1 core,
> Tier-2 plugin, and the two pre-doctrine primitives `@netscript/cron` / `@netscript/watchers`) and
> the rules for adding a new implementer to each. Resolves evaluator finding F-2 (extension axes not
> enumerated) and F-8 (watcher strategy axis must be open).
>
> **Rule.** A stub-only abstract base may exist in `src/abstracts/` only when (a) the axis is named
> in this document and (b) at least one second implementer exists or is committed in the same group.

## 1. Named axes — `plugin-triggers-core`

| Axis                                | Port interface                                  | Stub-only base                | Current implementers                                                                                                 | Status                                         |
| ----------------------------------- | ----------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Webhook verifier**                | `WebhookVerifierPort`                           | `AbstractWebhookVerifier`     | `HmacSha256WebhookVerifier`, `MemoryWebhookVerifier`                                                                 | Two implementers → base allowed                |
| **Scheduler**                       | `TriggerSchedulerPort`                          | `AbstractTriggerScheduler`    | `CronTriggerSchedulerAdapter` (plugin-side, wraps `@netscript/cron`), `MemoryTriggerSchedulerAdapter` (core/testing) | Two implementers → base allowed                |
| **File watcher**                    | `FileWatcherPort`                               | `AbstractFileWatcher`         | `WatchersFileWatcherAdapter` (plugin-side, wraps `@netscript/watchers`), `MemoryFileWatcherAdapter` (core/testing)   | Two implementers → base allowed                |
| **Event store**                     | `TriggerEventStorePort`                         | `AbstractTriggerEventStore`   | `KvTriggerEventStore`, `MemoryTriggerEventStore`, `RecordingTriggerEventStore`                                       | Three+ implementers → base allowed             |
| **Idempotency**                     | `TriggerIdempotencyPort`                        | none                          | `KvTriggerIdempotencyStore`, `MemoryTriggerIdempotencyStore`                                                         | Two implementers; no base needed               |
| **DLQ**                             | `TriggerDlqPort`                                | none                          | `KvTriggerDlqAdapter`, `MemoryTriggerDlqAdapter`                                                                     | Two implementers; no base needed               |
| **Ingress**                         | `TriggerIngressPort`                            | none                          | `HttpTriggerIngress` (plugin), `MemoryTriggerIngress` (core/testing)                                                 | Two implementers; no base needed               |
| **Processor middleware**            | `TriggerMiddleware<TIn, TOut>`                  | none (functional composition) | None at F-ship; user-supplied                                                                                        | Composed as pure async functions; doctrine §08 |
| **Clock**                           | `TriggerClockPort`                              | none                          | `SystemClock`, `TriggerTestClock`                                                                                    | Two implementers; no base                      |
| **Logger**                          | `LoggerPort` (re-used from `@netscript/logger`) | n/a                           | `@netscript/logger`, `NoopLogger`                                                                                    | Standard                                       |
| **Outbox** (T2)                     | `TriggerOutboxPort`                             | `AbstractTriggerOutbox`       | `PostgresOutbox` (Phase 7d)                                                                                          | Port only in Group F; base deferred            |
| **Replay** (T3)                     | `TriggerReplayPort`                             | `AbstractTriggerReplay`       | (Phase 7d)                                                                                                           | Port only in Group F; base deferred            |
| **Queue source** (kind=`'queue'`)   | `TriggerQueueSourcePort`                        | `AbstractTriggerQueueSource`  | (Group H)                                                                                                            | Port-only reservation in Group F               |
| **Stream source** (kind=`'stream'`) | `TriggerStreamSourcePort`                       | `AbstractTriggerStreamSource` | (Group H)                                                                                                            | Port-only reservation in Group F               |

## 2. Stub-only base pattern (CLI pattern)

```ts
// src/abstracts/abstract-trigger-scheduler.ts
export abstract class AbstractTriggerScheduler implements TriggerSchedulerPort {
  abstract schedule(
    id: TriggerId,
    spec: ScheduledTriggerSpec,
    handler: TriggerHandler,
  ): Promise<ScheduledTriggerHandle>;
  abstract unschedule(id: TriggerId): Promise<boolean>;
  abstract list(): Promise<readonly ScheduledTriggerHandle[]>;
  abstract get(id: TriggerId): Promise<ScheduledTriggerHandle | undefined>;
  abstract pause(id: TriggerId): Promise<boolean>;
  abstract resume(id: TriggerId): Promise<boolean>;
  abstract fireNow(id: TriggerId): Promise<boolean>;
  abstract stop(opts?: { drainTimeoutMs?: number }): Promise<void>;

  // NO concrete methods. NO shared state. NO protected helpers.
  // The base exists only to give external implementers a type to extend
  // for nominal compatibility checks. Concrete implementers may compose
  // ports directly without inheriting from this class.
}
```

Properties:

- The base has **no executable methods** — all abstract.
- The base has **no protected fields, no shared state**.
- Concrete implementers may **either** extend the base **or** implement the port interface directly.
  Both satisfy F-4 (inheritance audit) and F-PLG-1.
- This pattern is identical to `AbstractSagaTransport` in sagas-core and `BaseTriggerHandler` in
  workers-core.

## 3. `@netscript/cron` provider axis (Arch-3 primitive)

This axis is owned by the **primitive package**, not by `plugin-triggers-core`. See
`08-netscript-cron-primitive.md` §5.

| Provider            | Adapter class               | Status              | Notes                                                                                                |
| ------------------- | --------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `'deno'`            | `DenoCronAdapter`           | shipped (in-memory) | Wraps `Deno.cron`; resets on process exit                                                            |
| `'memory'`          | `MemoryCronAdapter`         | shipped             | Test in-process scheduler with manual tick                                                           |
| `'deno-persistent'` | `DenoPersistentCronAdapter` | RESERVED            | Wraps `Deno.cron.persistent` from `denoland/deno#33965`; survives process exit via host OS scheduler |
| `'cloudflare'`      | `CloudflareCronAdapter`     | future              | Wraps Cloudflare Workers Cron Triggers from `wrangler.toml`                                          |
| `'k8s-cronjob'`     | `K8sCronJobAdapter`         | future              | Wraps Kubernetes CronJob                                                                             |

### 3.1 Adding a new provider

| Step | Action                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Verify the provider name is added as a canonical value in `packages/cron/interfaces/types.ts` `CronProvider` (open string with known values). |
| 2    | Create `packages/cron/adapters/<name>.adapter.ts` implementing `CronScheduler`.                                                               |
| 3    | If a second persistent adapter exists, also extend `AbstractCronAdapter` (stub-only base added when the second implementer ships).            |
| 4    | Add a parity test using the same memory-adapter test harness.                                                                                 |
| 5    | Register the factory case in `packages/cron/mod.ts` `createScheduler({ provider })`.                                                          |
| 6    | Document the configuration shape under `packages/cron/README.md`.                                                                             |

### 3.2 Persistence sub-axis (deferred)

When `'deno-persistent'` ships, a sub-axis is named:

| Sub-axis    | Port                  | Implementers                                                                |
| ----------- | --------------------- | --------------------------------------------------------------------------- |
| Persistence | `CronPersistencePort` | in-memory (default), OS-persistent (Deno), KV-persistent (NetScript-native) |

Reserved only — port shipped when the second persistent adapter lands.

## 4. `@netscript/watchers` strategy axis (Arch-3 primitive)

This axis is owned by the **primitive package**, not by `plugin-triggers-core`. See
`09-netscript-watchers-primitive.md` §3.

| Strategy     | Class              | Status  | Notes                                                            |
| ------------ | ------------------ | ------- | ---------------------------------------------------------------- |
| `'native'`   | `NativeStrategy`   | shipped | Wraps `Deno.watchFs`; in-process; default on local FS            |
| `'polling'`  | `PollingStrategy`  | shipped | Periodic `Deno.stat`; default on network FS (SMB/NFS)            |
| `'hybrid'`   | `HybridStrategy`   | shipped | Native + polling overlap; tolerant of event-loss                 |
| `'fsevents'` | `FsEventsStrategy` | future  | Native macOS event source for monorepo trees                     |
| `'inotify'`  | `InotifyStrategy`  | future  | Native Linux raw `inotify` for sub-directory scoping             |
| `'watchman'` | `WatchmanStrategy` | future  | Wraps Facebook Watchman for large-tree subscription (10k+ files) |

### 4.1 Adding a new strategy

| Step | Action                                                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Open the `WatchStrategy` type to an additional canonical value (open string with known set).                                           |
| 2    | Create `packages/watchers/strategies/<name>.ts` implementing the `WatchStrategyHandler` shape (async generator yielding `WatchEvent`). |
| 3    | Compose with existing filters (`GlobFilter`, `StabilityFilter`, `DedupFilter`) via the `FileWatcher` pipeline.                         |
| 4    | Add a parity test using the same `MemoryFileWatcher`-shape contract.                                                                   |
| 5    | Document the strategy and its OS/platform constraints under `packages/watchers/README.md`.                                             |

## 5. Reserved kinds (open `TriggerKind` discriminator)

The `TriggerKind` discriminator is open by rule: new kinds extend the union without breaking
consumers, provided they produce a unified `TriggerEvent`. See `architecture-v2.md` §3.

| Kind value     | Type                              | F runtime               | Reservation                                        |
| -------------- | --------------------------------- | ----------------------- | -------------------------------------------------- |
| `'webhook'`    | `WebhookDefinition<TId>`          | ✓                       | —                                                  |
| `'file-watch'` | `FileWatchDefinition<TId>`        | ✓                       | —                                                  |
| `'scheduled'`  | `ScheduledTriggerDefinition<TId>` | ✓                       | —                                                  |
| `'queue'`      | `QueueTriggerDefinition<TId>`     | runtime in Group H      | Reserve `*Definition` + discriminator branch in F4 |
| `'stream'`     | `StreamTriggerDefinition<TId>`    | runtime in Group H      | Same                                               |
| `'manual'`     | `ManualTriggerDefinition<TId>`    | CLI-fire path only in F | Type and CLI in F30; processor arm in Group H      |

### 5.1 Out-of-scope kinds

Reserved as integration plugins, not as kinds in the core discriminator:

| Kind            | Home                               | Reason                                                                                       |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `'db-cdc'`      | `@netscript/plugin-cdc-triggers`   | Requires streaming infra (Kafka/Redpanda/LISTEN-NOTIFY) and schema evolution outside Group F |
| `'email-inbox'` | `@netscript/plugin-email-triggers` | Provider-specific (SES, SMTP, IMAP); not a primitive                                         |
| `'os-signal'`   | process layer (`bin/`/Aspire)      | Not a trigger axis — signals lifecycle, not trigger fires                                    |

## 6. Forbidden extension patterns

| Pattern                                                          | Reason                                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Plugin auto-discovery of implementers**                        | AP-11 (hidden globals). Implementers must be passed to `createTriggerProcessor` explicitly.  |
| **Decorator-based registration** (`@Trigger`, `@WebhookHandler`) | Decorator semantics are not stable across Deno versions; explicit value passing is portable. |
| **Mixin chains**                                                 | AP-3 (deep inheritance). The CLI stub pattern is the only inheritance allowed.               |
| **Concrete base with `protected` helpers**                       | AP-4/5/6. Extract helpers as pure functions under `src/utility/`.                            |
| **Re-exporting upstream types from the axis**                    | AP-14 / F-15. The port is the boundary.                                                      |
| **Schedule field on workers DSL**                                | F-TRG-18 — scheduling lives on triggers axis (see `architecture-v2.md` §18).                 |

## 7. Versioning extension points

When the public port interface changes:

| Change                                         | Action                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Add a new method                               | Provide a default implementation on the abstract base (returning `TriggersError.notImplemented`) — does not break implementers |
| Change a method signature                      | Major version bump on `@netscript/plugin-triggers-core`. Old method stays as deprecated.                                       |
| Remove a method                                | Two-step: deprecate in v0.N, remove in v0.(N+2)                                                                                |
| Add a new `TriggerKind` value                  | Minor version bump; reserved branch throws until runtime ships                                                                 |
| Add a new `EventKind` to `@netscript/watchers` | Doctrine review — see `09-netscript-watchers-primitive.md` §5.1                                                                |

## 8. References

- Doctrine `07-composition-and-extension.md` — canonical composition rules
- `dsl-canon.md` — userland DSL surface
- `architecture.md` §13 — `@netscript/cron` cross-cutting concern
- `architecture-v2.md` §§3, 13, 14, 18 — open kind discriminator, scheduler & watcher ownership,
  scheduler-axis decision
- `08-netscript-cron-primitive.md` — cron provider audit
- `09-netscript-watchers-primitive.md` — watcher strategy audit
- `10-cross-ecosystem-libraries.md` §§2, 3 — kind taxonomy + watcher comparison evidence
- `migration-strategy.md` — extend-before-replace cut-over including primitive audits
