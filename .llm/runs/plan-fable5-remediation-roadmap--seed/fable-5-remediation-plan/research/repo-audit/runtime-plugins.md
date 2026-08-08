# Repo audit — durable runtime plugins (workers / sagas / triggers / streams)

Baseline: `fac9e339042c` (origin/main, 2026-08-08). Worktree
`/home/codex/repos/netscript-fable5-remediation-plan`. All claims below were verified against code at
this commit, not against docs.

Classification vocabulary used per gap: **docs/discovery**, **scaffold/generation**, **API/type seam**,
**runtime correctness**, **plugin-composition**, **product-expectation**.

---

## 0. Issue-state ground truth (checked via `gh issue view`, 2026-08-08)

| Issue | State | Title (abridged) | Landed? |
|---|---|---|---|
| #1325 | **OPEN** (p1, `area:plugins`,`area:aspire`, milestone 0.0.5) | triggers generated runtime omits Redis adapter, crash-loops on default Aspire cache | **No** — reproduced at HEAD (§3.1) |
| #1326 | **OPEN** (p0, `area:plugins`, milestone 0.0.5) | `DurableStreamProducer` permanently drops writes after initial connect failure | **No** — reproduced at HEAD (§4.1) |
| #1327 | **OPEN** (p1, `area:cli`,`area:database`) | `db migrate` reports success headless without creating the migration | Out of this domain; not audited |
| #1329 | **OPEN** (p0, `area:plugins`,`area:docs`,`area:telemetry`) | documented SSE consumer shape ≠ wire protocol; no standard envelope | **No** — related evidence §4.4 |
| #1332 | **OPEN** (p1, docs/contracts) | generated DB schemas as normative predecessor to API contracts | Out of this domain |
| #1184 | **CLOSED** 2026-08-04, canary `0.0.5-canary.2` | sagas generated glue registers no KV adapter | **Yes** — `62893db8c` "fix(sagas): register KV adapter in generated runtime glue (#1193)"; fix visible at `plugins/sagas/src/adapter/resources/glue/runtime.stub.ts:16` |

`git log --grep` finds **no commit** referencing #1325/#1326/#1327/#1329/#1332. They are open triage
items, not landed work. The frequent misreading ("these landed recently") is wrong.

Landed work in this domain since 0.0.5 opened (all merged, verified via `git log --oneline`):

- `62893db8c` fix(sagas): register KV adapter in generated runtime glue (#1193 → closes #1184)
- `f7558aa1c` fix(sagas): deliver published messages to the runner (#1198)
- `f7bcf77f0` fix(sagas): revive persisted dates for projections (#1224)
- `7ee9ccf9e` feat(sagas): mirror every durable transition (#1284) — touches
  `saga-instance-projection.ts`, `saga-runner.ts`, `streams/producer.ts` + a new
  `producer_transition_test.ts`
- `f69eebf43` feat(triggers): add durable one-shot defer scheduler (#1283)
- `3677973bc` fix(cron): honor retry and backoff contract (#1226)
- `723d113e4` fix(workers): emit telemetry from scaffold job tools (#1281)
- `d4de5bd66` feat(runtime): orchestrate app-wide shutdown (#1285)
- `7511c13cf` fix(fresh): preserve StreamDB collection types through wrapper (#1238)
- `0b11ca47a` fix(scaffold): randomize default listener ports (#1211) + `595726075` docs sweep (#1242)
  — **this is the commit that turned every hardcoded plugin port into latent breakage** (§1)

---

## 1. Aspire endpoint resolution — the largest surviving structural seam

### 1.1 What exists and works

- `packages/aspire` defines a clean contribution model: `AspireNSPluginContribution` with
  `contribute()` / `declareEnv()` / `declareHealthChecks()`
  (`packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts:10,42,52`) and a typed
  `EnvSource` union `{kind:'literal'|'resource'|'secret'}`.
- `ContributionContext.port(key, fallback)` is a deterministic allocator
  (`packages/aspire/src/application/port-allocation.ts:10-25`): a pre-`assigned` map wins, otherwise
  the fallback, otherwise a sequence from 8090.
- **Workers is the only plugin that uses the seam correctly**:
  `plugins/workers/src/aspire/workers-contribution.ts:71` declares
  `WORKERS_API_URL: { kind:'resource', resource: WORKERS_API_RESOURCE, key:'url' }` and its health
  check reads the *allocated* port back via `ctx.port(...)` at line 78-84.
- Server-side stream URL resolution is genuinely well built:
  `packages/plugin-streams-core/src/application/stream-url-resolver.ts:99-133` tries
  `DURABLE_STREAMS_URL`, then Aspire `services__streams__http__0`, then the Vite browser form, and
  **throws a diagnostic error instead of falling back to a port** — the correct pattern.

### 1.2 Gap — `declareEnv()` / `declareHealthChecks()` are dead code in production

`composeAppHost` calls **only** `contribution.contribute(...)`
(`packages/aspire/src/application/compose-apphost.ts:47`). A repo-wide grep for `declareEnv` /
`declareHealthChecks` outside `packages/aspire` itself, the four plugin implementations, and tests
returns **zero hits**. Further, `composeAppHost` has **no production caller at all** — the only
non-test references are its own definition, the `application/mod.ts` re-export, and
`public/mod.ts:34`.

The real env/port wiring is a parallel CLI-side pipeline:
`packages/cli/src/public/features/plugins/install/install-plugin.ts:502-512` →
`allocateScaffoldDefaultPort()` writing `servicePort`/`hostPort` into appsettings.

**Consequence:** every `declareEnv` value a plugin author writes is inert, and every plugin author
following `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:524-529` (which
scaffolds `extends AspireNSPluginContribution`) writes declarations nothing reads. Two sources of
truth, one of them unreachable.

Classification: **API/type seam** + **plugin-composition failure**.

### 1.3 Gap — hardcoded ports in three of four contributions, post-randomization

`allocateScaffoldDefaultPort` allocates from the IANA dynamic range **49152–65535**
(`packages/cli/src/kernel/domain/scaffold/default-port-allocation.ts:4-7`, landed by #1211). The
contributions still bake the pre-randomization defaults into URLs:

| File:line | Value | Correct? |
|---|---|---|
| `plugins/sagas/src/aspire/sagas-contribution.ts:135` | `SAGAS_API_URL: http://localhost:8092` (literal) | ✗ ignores `ctx.port` used at line 112 |
| `plugins/sagas/src/aspire/sagas-contribution.ts:146` | health `http://localhost:8092/health` | ✗ `_ctx` unused |
| `plugins/triggers/src/aspire/triggers-contribution.ts:139` | `TRIGGERS_API_URL: http://localhost:8093` | ✗ |
| `plugins/triggers/src/aspire/triggers-contribution.ts:149` | health `http://localhost:8093/health` | ✗ `_ctx` unused |
| `plugins/streams/src/aspire/streams-contribution.ts:43` | `DURABLE_STREAMS_URL: http://localhost:4437` (literal, not `EnvSource`) | ✗ |
| `plugins/streams/src/aspire/streams-contribution.ts:51` | health `http://localhost:4437/health` | ✗ `_ctx` unused |
| `plugins/workers/src/aspire/workers-contribution.ts:71,81` | resource EnvSource + `ctx.port(...)` | ✓ |

Each contribution *allocates* through `ctx.port(name, DEFAULT)` in `contribute()` but then publishes
a URL/health probe that assumes the fallback was taken. Currently masked only because §1.2 makes the
declarations unread — fixing §1.2 without fixing §1.3 would ship broken health checks.

Classification: **runtime correctness** (latent) + **plugin-composition failure**.

### 1.4 Gap — the `127.0.0.1:809x` fixed-port fallback the task asked about

Confirmed, and it is the sagas publisher hot path:

```
plugins/sagas/src/runtime/saga-publisher.ts:294-307
  baseUrl
    ?? services__sagas-api__https__0
    ?? services__sagas-api__http__0
    ?? SAGAS_API_URL
    ?? NETSCRIPT_SAGAS_URL
    ?? `http://127.0.0.1:${SAGAS_API_DEFAULT_PORT}`   // 8092
```

`SAGAS_API_DEFAULT_PORT = 8092` at `plugins/sagas/src/constants.ts:11`. Sibling occurrences:

- `plugins/sagas/src/cli/adapters/runtime-api-client.ts:27` — `http://127.0.0.1:8092/api/v1/sagas`
- `plugins/workers/src/cli/adapters/runtime-api-client.ts:27` — `http://127.0.0.1:8091/api/v1/workers`
- `plugins/workers/src/e2e/probes/probe-context.ts:5` — `http://localhost:8091`
- `plugins/sagas/src/e2e/probes/probe-context.ts:3` — `http://127.0.0.1:8092`
- `plugins/streams/src/e2e/probes/probe-context.ts:4` — `http://127.0.0.1:4437`
- `plugins/streams/src/adapter/resources/consumer/consumer.stub.ts:42` — **generated browser code**
  falls back to `http://localhost:4437`, bypassing `getStreamsUrl()` entirely (it passes the literal
  as `baseUrl` to `buildStreamUrl`, so the resolver's throw-on-missing behavior never fires)
- `plugins/{sagas,workers,triggers,auth}/streams/factory.ts` — `baseUrl ?? 'http://localhost:4437'`

The streams resolver throws; the sagas publisher silently falls back. That divergence is the
difference between "fails loudly at boot" and §2.2's silent-drop chain.

Classification: **runtime correctness** + **scaffold/generation failure** (consumer stub).

### 1.5 Gap — service-discovery key normalization asymmetry (needs one experiment)

`packages/sdk/src/discovery/service-url.ts:60` and `saga-publisher.ts:301-302` build
`services__sagas-api__http__0` with the raw hyphen. The browser path
`packages/aspire/src/application/build-vite-env-var-name.ts:54,63-65` normalizes non-alphanumerics to
`_` (`workers-api` → `workers_api`). Only one of the two forms can match what Aspire actually
exports for a hyphenated resource. Flagged as **needs verification against a live AppHost export**;
if the server form is also underscore-normalized, every hyphenated-resource discovery lookup silently
misses and drops to §1.4's fixed-port fallback.

Classification: **API/type seam** (unproven; verification task, not a fix task).

---

## 2. Publish / receipt typing — can a publish failure be silently ignored?

### 2.1 What exists and works

`packages/plugin-sagas-core/src/integration/publisher/saga-publisher-port.ts:24-46` defines a proper
non-throwing receipt union:

```ts
SagaPublisherReceipt  = { published: true;  messageType; messageId?; correlationKey?; acceptedAt }
SagaPublisherRejected = { published: false; messageType; messageId?; correlationKey?; reason; retryable }
SagaPublisherResult   = Receipt | Rejected
```

`HttpSagaPublisher.publish` (`plugins/sagas/src/runtime/saga-publisher.ts:106-134`) never throws:
non-2xx → `rejectedResult(..., retryable = status ∈ {408,409,425,429,500,502,503,504})`; thrown
transport error → `rejectedResult(..., isRetryable(cause))`. `traceparent`/`tracestate` are propagated
as headers (lines 280-289). This is a good design.

### 2.2 Gap — **yes, silently, and the scaffold itself does it**

The union is not a `Result` that TypeScript forces you to unwrap. `await publisher.publish(m)`
type-checks with the receipt discarded. The **first-party sample job the scaffold writes into every
new project** does exactly that:

`plugins/workers/src/cli/official-sample-configuration.ts:392-406`

```ts
const handler = defineJobHandler(async (ctx) => {
  const { userId } = CreateUserSettingsPayloadSchema.parse(ctx.payload ?? {});
  console.info('Creating scaffold sample settings', { userId });

  await sagaPublisher.publish({ type: 'UserSettingsCreated', payload: { userId } });   // receipt dropped

  return createSuccessResult({ userId, settingsCreated: true, source: 'scaffold-sample' });
});
```

The identical code is the canonical documentation example at
`docs/site/durable-workflows/sagas.md:418`, annotated "verbatim from the scaffold" and "a typed
receipt comes back" — the comment describes a receipt the code throws away.

Chained with §1.4: sagas-api unreachable → publisher falls back to `127.0.0.1:8092` → connect refused
→ `rejectedResult` → discarded → **the worker job reports success and the saga never starts**. No
log, no telemetry event, no failed job. This is the highest-severity composed defect found in this
audit and it is not covered by any open issue.

Streams is worse still: `DurableStreamProducer.upsert()` / `.delete()` return **`void`**
(`packages/plugin-streams-core/src/application/create-durable-stream.ts:167,205`). There is no
receipt at all — a failed stream publish is structurally unobservable by the caller, only
`console.warn`-visible (line 131-134).

Classification: **API/type seam** (receipt is ignorable by construction) + **scaffold/generation
failure** (the shipped sample models the wrong pattern) + **docs/discovery failure**.

---

## 3. Runtime architecture (wrapper / child processes) and generated glue

### 3.1 Gap — #1325 reproduced verbatim at HEAD

There are **no** `Deno.Command`/`spawn` child processes inside the plugins (grep across `plugins/` and
`packages/plugin-*-core/src` returns one hit, in a test). "Wrapper/child" is entirely Aspire-level:
each plugin contributes an `addDenoService` API resource plus an `addDenoBackground` runtime resource;
Aspire owns the processes.

Every background runtime reaches Deno KV, and only three of four register the Redis/Garnet adapter:

| Runtime entry | Registers `@netscript/kv/redis`? |
|---|---|
| `plugins/workers/bin/runtime.ts:8` | ✓ (comment: "before `createWorkersServiceRuntime()` calls `getKv()`") |
| `plugins/workers/services/src/main.ts:17` | ✓ |
| `plugins/sagas/services/src/main.ts:18` | ✓ |
| `plugins/sagas/src/adapter/resources/glue/runtime.stub.ts:16` | ✓ (this is the #1184 fix) |
| `plugins/triggers/services/src/main.ts:21` | ✓ |
| **`plugins/triggers/src/adapter/resources/glue/runtime.stub.ts`** | **✗ — emits only `import { startCombinedProcess } from '@netscript/plugin-triggers/runtime'`** |
| `plugins/triggers/src/runtime/mod.ts` / `trigger-processor.ts` | **✗** |

The crash path is provable statically: generated glue → `startCombinedProcess` →
`createRuntimeTriggerProcessor` → `openTriggerRuntimeKv()`
(`plugins/triggers/src/runtime/trigger-runtime-processor.ts:71-79`) →
`getKv({path: ...})` (`packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores.ts:1,28`)
with no Redis adapter registered. #1325 is real, unfixed, and structurally identical to the closed
#1184.

Classification: **scaffold/generation failure**. The remediation must be an *enumerated invariant*
(one test that walks every KV-backed background runtime stub), not a fourth one-off import — #1325's
own acceptance list says so.

### 3.2 Gap — two divergent saga runner shapes

- Aspire contribution's background entrypoint: `plugins/sagas/src/runtime/saga-runner.ts`
  (`sagas-contribution.ts:120`), whose `import.meta.main` block runs `runSagaRunner()`
  (`saga-runner.ts:73-75`) — **no HTTP health surface**.
- Generated glue stub: `startSagaRunner()` **plus** a `Deno.serve` `/health` route returning the
  supervisor snapshot with `status === 'running' ? 200 : 503`
  (`plugins/sagas/src/adapter/resources/glue/runtime.stub.ts:19-30`).

Repo-local Aspire runs a saga runner with no health endpoint; generated projects run one that has a
health endpoint nothing probes (§5). Triggers and workers glue stubs have neither
(`plugins/triggers/.../glue/runtime.stub.ts`, `plugins/workers/.../glue/runtime.stub.ts` are 3-line
`await startCombinedProcess()` shims).

Classification: **plugin-composition failure**.

### 3.3 Gap — `WORKER_CONCURRENCY` vs `WORKERS_CONCURRENCY`

`plugins/workers/src/aspire/workers-contribution.ts:59,72` and
`plugins/workers/scaffold.plugin.json:43` set **`WORKER_CONCURRENCY`** (singular).
`plugins/workers/bin/runtime.ts:96,140` reads **`WORKERS_CONCURRENCY`** (plural), defaulting to `1`.
The Aspire-declared concurrency of `2` is therefore never applied — the worker always runs
concurrency 1 unless the user sets the plural name by hand.

This is *documented as a known mismatch* rather than fixed:
`docs/site/orchestration-runtime/how-to/deploy.md:202` — "Current Aspire metadata also emits
`WORKER_CONCURRENCY`, but the runtime honors `WORKERS_CONCURRENCY`; set the runtime var" — and
repeated at `how-to/author-a-plugin.md:137`. The generated `.env` writer also emits the singular form
(`packages/cli/src/kernel/adapters/windows/environment/env-file-content.ts:228,235`), while the Aspire
helper generator tests assert the plural (`.../aspire/helpers/tests/generators-background-app_test.ts:162`).

Classification: **runtime correctness** — and a case study in doctrine drift, where a defect was
converted into prose instead of a fix.

---

## 4. Streams — persistence, reconnect, protocol

### 4.1 Gap — #1326 reproduced verbatim (P0, no reconnect exists)

`packages/plugin-streams-core/src/application/create-durable-stream.ts`:

- Constructor fires `#connect()` **once**, line 64. There is no timer, no retry, no policy.
- On failure `#connectError` is latched (line 93) and the operator is told
  `"Writes will be dropped until reconnect."` (line 99) — a transition the class cannot perform.
- `#appendEvent` returns early forever while `#connectError` is set (lines 130-135).
- A second latch point at line 117-123 (`drain pending events` failure) sets the same permanent flag.
- `#pendingEvents` (line 51) is an **unbounded** array while connecting — no bound, no overflow
  policy, no backpressure. A slow/never-completing connect grows it without limit.
- `flush()` throws the latched error (line 235-237) but `close()` does not (line 242-247), so graceful
  shutdown swallows the failure.
- `createDurableStream()` memoizes producers per `streamPath` in a module-level map (lines 282-313),
  so a producer poisoned at first construction is handed to every subsequent caller for the process
  lifetime.

Classification: **runtime correctness**. The issue's acceptance criteria (bounded reconnect, explicit
buffer bounds, readiness, OTEL for connection state) are all still unmet.

### 4.2 Gap — `STREAMS_DATA_DIR` semantics: durability is opt-in and nothing opts in

- `plugins/streams/services/src/main.ts:36-40` reads `STREAMS_DATA_DIR`; when unset,
  `describeStorageDurability` returns `{durable:false}`
  (`plugins/streams/services/src/durability.ts:16-29`) and the service emits a single
  `console.warn` — then starts and reports healthy anyway.
- Grep for `STREAMS_DATA_DIR` across `packages/cli/src` and `plugins/streams/src`: **zero hits.** The
  Aspire contribution's `declareEnv` (`streams-contribution.ts:41-45`) sets only `DURABLE_STREAMS_URL`.
  **No scaffold, no AppHost, and no generated project ever sets it.** The documented default
  (`docs/site/durable-workflows/streams.md:287`, `plugins/streams/README.md:20-22`) is therefore the
  *only* configuration any user ever gets: durable streams that are not durable.
- The backing store is `DurableStreamTestServer` from `@durable-streams/server`
  (`main.ts:24,49-53`) — a *test* server used as the product's durable substrate, fronted by a
  transparent proxy (`main.ts:81,122`) that strips a bogus `content-encoding: gzip` (netscript#219/#239)
  and rewrites 404s on live long-poll (netscript#267).

Classification: **product-expectation outside framework scope** *only if* streams is scoped
"development-tier"; otherwise **runtime correctness**. The plugin is named "durable streams" and the
default is non-durable — that naming/default mismatch is the decision the roadmap must make explicitly.

### 4.3 Gap — the manifest-root streams API is a decoy surface

`@netscript/plugin-streams` (the plugin root) re-exports `defineStreamProducer` /
`defineStreamConsumer` whose `publish()` rejects and whose `subscribe()` throws
`StreamUnsupportedOperationError` (`plugins/streams/src/public/stream-api.ts:20-37`, re-exported at
`src/public/mod.ts:11,95`). Docs acknowledge this at
`docs/site/durable-workflows/streams.md:126-133` ("they fail loud, by design"), pointing users to
`@netscript/plugin-streams-core` instead. The package a user installs by name exposes a working-looking
API that never works; the real API is in a differently-named package.

Classification: **docs/discovery failure** + **API/type seam**.

### 4.4 Gap — #1329's envelope problem is confirmed by absence

`packages/plugin-streams-core/src/domain/constants.ts:5,8` fix `STREAMS_RESOURCE_NAME='streams'` and
`STREAMS_URL_PREFIX='/v1/stream/netscript'`, but there is no exported schema for SSE event names or
frame payloads anywhere in `plugin-streams-core`. The producer writes an ad-hoc envelope inline —
`{ type, key, value, headers }` for upsert, `{ type, key, headers }` for delete
(`create-durable-stream.ts:188-193, 222-226`), where `headers` is `{operation}` plus whatever
`instrumentation.publish` injects (lines 249-266). Nothing validates or versions that shape, and the
`control`/offset frames come from the vendored `@durable-streams/server`, unmodelled on the NetScript
side. #1329's core ask — *one exported, versioned schema* — has no seat in the codebase to fill.

Classification: **API/type seam** (missing contract) → downstream **docs/discovery failure**.

---

## 5. Health / readiness vs actual child liveness

### 5.1 What exists

- Workers/sagas/triggers API services each expose `/health` (+ `/health/live`, `/health/ready` for
  those built on `createPluginService`).
- The streams service registers a real upstream probe: `healthChecks.custom('durable-streams-server',
  ...)` fetching the internal port with a 3s abort (`plugins/streams/services/src/main.ts:59-70`).
- `plugins/workers/worker/worker.ts:139-143` computes a genuine `healthStatus`
  (`'healthy' | 'degraded'`) from listener supervisor state
  (`plugins/workers/worker/listener-supervisor.ts:79`).
- The sagas glue health route maps supervisor state to 200/503 (§3.2).

### 5.2 Gap — no health signal covers any background child

Every `declareHealthChecks` implementation returns **exactly one** entry, always the *API* resource:

- `plugins/workers/src/aspire/workers-contribution.ts:79-84` → `workers-api` only. `workers-combined`
  (line 55-61) has none.
- `plugins/sagas/src/aspire/sagas-contribution.ts:145-152` → `sagas-api` only. `sagas-runner` has none.
- `plugins/triggers/src/aspire/triggers-contribution.ts:147-154` → triggers API only.
  `trigger-processor` has none.

`Worker.healthStatus` and the sagas supervisor snapshot exist but are wired to nothing Aspire or the
plugin doctor consults.

The merge-readiness E2E has the same blind spot. `.llm/tools/e2e/scaffold-e2e-test.ts:1240-1267`
probes exactly: workers `/health`, sagas `/health/live` + `/health/ready`, triggers `/health`, auth
`/health/live` + `/health/ready`. **No background resource is probed, and streams is not health-probed
at all** — `streams` appears once in the whole file, at line 843, as a plugin to add.

**This is precisely why #1325 shipped.** A trigger processor that crash-loops on every start leaves
the entire declared health surface green, and the gate that is supposed to be the merge verdict
(`deno task e2e:cli run scaffold.runtime`) never looks at it. #1325's acceptance line — "the scaffold
runtime E2E installs every KV-backed first-party background runtime and proves each reaches a real
healthy state" — is the correct fix and is currently unimplemented.

Classification: **runtime correctness** + **plugin-composition failure**. Highest leverage item in the
audit: it is the *detector* whose absence lets the other defects ship.

---

## 6. Saga correlation and compensation

### 6.1 What exists and works

- Correlation resolution is layered correctly: definition-level `correlations` rules with an
  eventType match, then a `'*'` wildcard, then `message.correlationKey`, then a synthesized
  `${definitionId}:${messageType}` (`packages/plugin-sagas-core/src/runtime/saga-engine.ts:459-464`).
- Correlation → instance mapping is persisted in both stores:
  `packages/plugin-sagas-core/src/stores/kv-saga-store.ts:99-108,181-183` and
  `prisma-saga-store.ts:15,214-234` (`sagaId_correlationKey` composite selector).
- `SagaBusBridge` correctly composes engine + scheduler + compensator, dedupes cascades through the
  idempotency port, and recursively dispatches nested cascades
  (`packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts:98-108,124-156,158-173,190-228`).
  `plugins/sagas/src/runtime/create-durable-saga-runtime.ts:60` supplies a real `SagaCompensator`, so
  the durable path is wired, not stubbed.

### 6.2 Gap — compensation does not roll back prior steps

`SagaCompensator.compensate` looks up **only the current message's** handler:
`request.definition.compensations.get(request.message.type)`
(`packages/plugin-sagas-core/src/runtime/saga-compensator.ts:57`). There is no completed-step history
and no reverse traversal. This is per-message error handling named "compensation", not the
saga-pattern semantics the docs and the plugin name imply. A three-step saga failing at step 3
compensates step 3 only; steps 1–2 stay applied.

Classification: **runtime correctness** (if saga-pattern rollback is in scope) or
**product-expectation outside framework scope** (if per-message compensation is the intended contract)
— but the naming currently promises the former. Must be settled explicitly.

### 6.3 Gap — compensation state mutations are never persisted

`SagaBusBridge` holds `engine`, `scheduler`, `compensator`, `resolveCompensation`, `idempotency`,
`instrumentation`, `#definitions` — **no store** (`saga-bus-bridge.ts:44-52`). In `#compensate`, the
handler's mutated state comes back as `result.state` and is threaded only into `nextRequest` for
further cascades (lines 220-227). It is never written to the saga store. A `.compensate()` handler
that mutates `saga.state` loses that mutation on the next load.

Classification: **runtime correctness**.

### 6.4 Gap — missing compensation handler fails two different ways

- Primary path: no handler → returns `{compensated: false}` silently, no throw, no telemetry
  (`saga-compensator.ts:57-68`).
- Cascaded path: same condition → `SagasError.notImplemented(...)` thrown
  (`saga-compensator.ts:116-120`).

Same user error, silent in one path and fatal in the other.

Classification: **API/type seam**.

### 6.5 Gap — `'compensating'` is a terminal status with no exit

`SAGA_INSTANCE_STATUSES = ['pending','running','completed','failed','compensating','cancelled']`
(`packages/plugin-sagas-core/src/domain/constants.ts:18-25`). There is no `'compensated'`.
`resolvePersistedStatus` writes `'compensating'` when any cascade is `compensate`
(`saga-engine.ts:477-479`) and `isTerminalStatus` counts `'compensating'` as terminal (line 489-491),
so an instance whose compensation *succeeded* is indistinguishable from one still compensating or one
whose compensation failed. Telemetry compounds it: `telemetryOutcomeFromStatus` maps `'compensating'`
→ `SagaTelemetryOutcomes.COMPENSATED` (line 496), reporting a completed compensation for a status that
only means one was requested.

Classification: **runtime correctness** + **API/type seam** (missing state in the union).

### 6.6 Bounded, deliberately-deferred surfaces (fail loudly — acceptable)

- `SagaEngine.dispatchCascaded` throws `notImplemented` for any non-`send` cascade
  (`saga-engine.ts:118-131`) — only relevant when the raw engine is used without the bridge.
- `SagaEngine.signal` rejects, "deferred to phase 7d" (`saga-engine.ts:133-140`).
- Nested cascaded compensation throws, "deferred to phase 7d" (`saga-compensator.ts:103-107`).
- `spawn` cascades throw (`saga-bus-bridge.ts:147`).

These are honest — the failure mode is a loud error, not a silent drop. They belong on a scope ledger,
not a defect ledger.

---

## 7. Reconnect / retry semantics — per-plugin summary

| Plugin | Retry/backoff | Reconnect | Verdict |
|---|---|---|---|
| triggers | Real policy: `maxAttempts`, `initialDelayMs`, `maxDelayMs`, `backoffMultiplier`, `jitter` (`packages/plugin-triggers-core/src/runtime/trigger-processor.ts:276-284`); exponential + cap at `:308-317`; `isRetryable` honors `TriggersError.retryable` and a `nonRetryableErrors` list (`:299-306`); DLQ store + one-shot defer scheduler (#1283) | n/a | **Best in class.** Note `jitter: true` uses *full* jitter — `Math.floor(capped * random())` — so the effective delay floor is ~0, not `initialDelayMs`. Defensible, undocumented. |
| sagas | Publisher classifies retryable by status code (`saga-publisher.ts:69,118-124`) but performs **no retry itself** — retry is the caller's job, and the scaffold caller discards the receipt (§2.2) | n/a | Contract present, no policy, no caller honors it |
| workers | Listener supervisor restarts with a max-restart degradation threshold (`plugins/workers/worker/worker-options.ts:147`, `listener-supervisor.ts:79`) | n/a | Adequate; not surfaced to health (§5.2) |
| streams | **None** | **None** (§4.1) | P0 |

---

## 8. Fixed vs surviving — ledger

**Fixed and verified:**

- #1184 sagas generated glue KV adapter — `plugins/sagas/src/adapter/resources/glue/runtime.stub.ts:16`
- #1198 message delivery to the runner (`f7558aa1c`)
- #1224 persisted-date revival for projections (`f7bcf77f0`)
- #1284 per-transition durable mirror — `plugins/sagas/streams/producer.ts` + `producer_transition_test.ts`
- #1283 durable one-shot defer scheduler — `KvTriggerDeferScheduler` reachable from
  `trigger-runtime-processor.ts:75-76`
- #1226 cron retry/backoff contract

**Surviving seams, ranked by remediation leverage:**

1. **§5.2 background-child health invisibility** — the missing detector; enables 2 and 3. *(runtime correctness / plugin-composition)*
2. **§2.2 ignorable publish receipt, modelled wrong by the shipped scaffold sample** — silent data loss with a green job result; no open issue covers it. *(API/type seam + scaffold)*
3. **§3.1 = #1325** triggers glue omits the KV adapter; needs an enumerated invariant across all four background runtimes, not a fourth import. *(scaffold/generation)*
4. **§4.1 = #1326** `DurableStreamProducer` has no reconnect, an unbounded buffer, and a message that promises a transition it cannot make. *(runtime correctness, P0)*
5. **§1.2 + §1.3** `declareEnv`/`declareHealthChecks` unreachable, and three of four contributions hardcode pre-randomization ports. Fixing either alone makes things worse. *(API/type seam + plugin-composition)*
6. **§6.5 / §6.3 / §6.2** saga compensation: no `'compensated'` status, unpersisted compensation state, no prior-step rollback. *(runtime correctness; §6.2 needs a scope decision first)*
7. **§4.2** `STREAMS_DATA_DIR` never set by anything → "durable streams" is always in-memory, on a `DurableStreamTestServer`. *(scope decision, then either fix or rename)*
8. **§4.4 = #1329** no exported versioned SSE envelope schema exists to conform docs/consumers to. *(API/type seam)*
9. **§1.4** fixed-port fallbacks (`127.0.0.1:8092/8091`, `localhost:4437`) survive in publisher, CLI clients, probes, and the generated browser consumer stub. *(runtime correctness + scaffold)*
10. **§3.3** `WORKER_CONCURRENCY` vs `WORKERS_CONCURRENCY` — a live defect documented as a caveat instead of fixed. *(runtime correctness)*
11. **§4.3** `@netscript/plugin-streams` root exports helpers that always throw. *(docs/discovery)*
12. **§1.5** service-discovery hyphen/underscore asymmetry. *(unproven — schedule a verification, not a fix)*

**Cross-cutting observation.** Three separate defects here (§3.3, §4.2, §4.3) were resolved by writing
prose that documents the broken behavior rather than fixing it, and `26b851529` "docs: reframe
architectural debt caveats as design boundaries" is the pattern's name. Any remediation plan should
carry an explicit rule that a documented caveat is not a closed defect.
