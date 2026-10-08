# C6 worklog

## Design

Public flow: defineTask(id).payload(selectedSchema).handler(...).build(); workerJobEffect(definition, NoInfer payload, options) / workerTaskEffect(...) in integration/workers; defineSaga(id).durableWorkerCommands().state(...).on(...).build(); runtime registration requires explicit SagaTransitionCommitPort. A named createPrismaSagaTransitionStore consumes the true provider callback and a focused bound database outbox writer. No new saga relay.

Vocabulary: WorkerCommandEffect / SagaTransitionEffect, selected worker schema, SagaTransitionCommitRequest/Result/Port, expected/next version, immutable raw StoredCommandOutbox intents, hashed inbound replay identity, existing saga lifecycle/status constants and worker-job/worker-task finite effect kind constants, versioned saga-worker namespace. Preserve original handler ordinals before removing worker effects from legacy dispatch. Existing send/compensation semantics stay legacy.

Ports: existing SagaStorePort read/legacy paths; explicit atomic capability with same_commit guarantee; actual TransactionClientPort<PostgresCommandClient>; database-owned bound appendOutbox; existing C5 relay and checked WorkerCommandClientPort, existing worker native execution/progress and checked SagaPublisherPort. Clocks/IDs/relay policy remain their current owners. No composition-time resources, hidden timers or global queues. AbortSignal checked around schema/provider boundaries; C5 owns dispatch cancellation/drain.

Slices: S15 worker task schema/type continuity + distinct immutable effects (worker builder/domain/public + saga integration/effect domain + tests/docs; <30 files). S16 opt-in definition/capability + memory atomic store/conformance and refusal (ports/domain/builder/runtime/testing + tests/docs; <30). S17 engine producer/precommit validation/stable identity/replay handling (runtime/application/integration + tests; <30). S18 focused database writer + true Prisma atomic store/reviewed schema/migration/physical fixture (database/saga stores/fixture/gate workflow/docs; <30). S19 actual C5 recovery/cohort consumer faults (consumer fixture/native wrapper/gate; <30). S20 native progress/checked completion example, public inventories/dependencies/pinned generation and whole-runtime qualification (example/fixture/docs/assets; <30).

Risks: schema inference widening (NoInfer and compiler fixtures); false atomicity/root handle (physical generated-client callback and root negative control); eager replay suppression (atomic marker plus failed-message retry); initial/stale version races (exclusive absent-row CAS); mutable/invalid rows (precommit schema/codec/copy validation); duplicate effect (same stable identity with downstream idempotent persistence); unavailable unmerged predecessor (actual immutable external test pin, no product copy); publication slow/private types (complete recursive manifests and isolated/publication checks); legacy documentation debt (retain baseline truth, no false full-map green).

Deferred: broader Prisma SagaIdempotencyPort parity, other providers, KV command outbox, schedule/compensation worker-command effects, generators owned by later command stages, release/version bumps, product concepts. Contributor path: integration/workers constructors -> worker effect vocabulary -> producer serialization -> SagaTransitionCommitPort -> named memory/Prisma adapters -> public consumer/fault fixture. Existing C5 owns all relay extension and lifecycle behavior.

## Bootstrap / Research / Plan / Plan-Gate

Fresh baseline 881d25e8c; C5 READY at 1a93a6acb. Issue/comments and native guidance consulted, doctrine/gate profiles and existing debt reviewed. Research/Design complete before product work. Approved whole-chain PLAN-EVAL PASS reused; no new evaluator run. No product/test file changed, no implementation verdict or readiness claim. Actual raw gates and operational receipts stay in private project runs.

## S15 implementation and Tier-A slice review

RED-first explicit effect test EXIT 1 with named AssertionError; task handler validation assertion separately RED before its wrapper. Three new named tests PASS and five semantic production mutants fail named assertions, restore exact bytes and PASS. Selected-schema NoInfer job/task fixtures, immutable private payload/schema snapshot, async validation and C1 bounded JSON proven. Scoped worker/saga check 234 files, regression 138 PASS/0 FAIL/3 provider-dependent ignored, lint/format/quality/architecture and owned public doc graphs EXIT 0. Native lock normalization retains pinned Deno 2.9.5; no version upgrade or lock deletion/reload. Existing export-map diagnostics remain explicitly non-green; observed resolution difference recorded, no new effect graph debt waived. Full publication/runtime/CI and final independent evaluation pending. S15 signoff: PASS for this slice only.

## S16 implementation and Tier-A slice review

Two named RED assertion failures before implementation. Explicit SagaTransitionCommitPort request/result/capability and definition durableWorkerCommands opt-in; memory whole-transition commit snapshots/validates all rows before one CAS and synchronous map mutation. Actual KV and unbound Prisma composition refuses with atomic transition/outbox diagnostic before I/O. Six semantic named AssertionError mutants, exact restoration and PASS. Scoped check 119 files, saga regression 92 PASS/0 FAIL/3 provider-dependent ignored; lint/format/quality/architecture and owned port/testing/root documentation EXIT 0. S16 signoff: PASS for contract/memory/refusal only. Engine serialization/replay/granular-path replacement remains S17; provider/C5/native consumer and final evaluation remain pending.

S15 lock wording refinement: native Deno normalized already-locked peer identities and dependencies. No newly resolved npm versions/integrity values were introduced; no lock deletion/reload occurred. Already-locked transitive references can be unified, so the earlier shorthand no version upgrade is not a promise of unchanged dependency edges.

## S17 implementation and Tier-A slice review

Three named producer RED AssertionErrors before implementation; stricter canonical input/schema identity assertion separately RED. Ordinary handlers return a typed transition ledger; compensation/scheduled nested cascades refuse worker effects. Selected schema validates detached bounded JSON before writes, refuses transformations changing canonical identity, never invokes input getters, and emits stable SHA-256 versioned identities from original ledger ordinals. Engine makes one atomic commit; both eager engine and bridge reservations are bypassed for opted-in definitions. Failed commit remains retryable, restart replay returns base state with no worker/cascade duplicate. Existing C1 trace validation is reused through a focused service command export, with no new trace parser. Typed registration uses a runtime shape check at the heterogeneous registry boundary rather than unsafe double casts.

Scoped check 204 files, regression 356 PASS/0 FAIL/3 provider-dependent ignored, lint/format/quality/architecture EXIT 0. Owned root, workers-integration, ports, testing and service command doc graphs EXIT 0. The existing saga runtime barrel retains seven private-type diagnostics; this is explicitly non-green legacy debt, not a new public-effect graph waiver. Eight current producer and five current constructor/task-handler semantic mutants fail named assertions and restore byte-identical/PASS (proof below). Provider, actual C5 consumer, progress/completion, full publication/runtime, independent evaluation and final CI remain pending. S17 signoff: PASS for this slice only.

```json
[
  {
    "name": "s17-ordinal",
    "file": "packages/plugin-sagas-core/src/application/produce-worker-commands.ts",
    "test": "durable saga commits pure worker effects once with stable original ordinal and context",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "b30ea6b9fafe8fe29be1594bd7c7c1f0952514fd17f8040793a1c553ab502f25",
    "bytesIdentical": true
  },
  {
    "name": "s17-atomic-path",
    "file": "packages/plugin-sagas-core/src/runtime/saga-engine.ts",
    "test": "durable saga commits pure worker effects once with stable original ordinal and context",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "3c9496d1b518ea9ed22966ca40f9851527c17fb3b0cbbe192d07889435c6a273",
    "bytesIdentical": true
  },
  {
    "name": "s17-replay-result",
    "file": "packages/plugin-sagas-core/src/runtime/saga-engine.ts",
    "test": "durable saga commits pure worker effects once with stable original ordinal and context",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "3c9496d1b518ea9ed22966ca40f9851527c17fb3b0cbbe192d07889435c6a273",
    "bytesIdentical": true
  },
  {
    "name": "s17-selected-schema",
    "file": "packages/plugin-sagas-core/src/integration/workers/worker-effects.ts",
    "test": "durable producer rejects selected payload and canonical JSON faults before writes without consuming replay",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "67554b07389cecedb40495441db46cd719342ac70ad93c8b2ea815436df7946f",
    "bytesIdentical": true
  },
  {
    "name": "s17-json-boundary",
    "file": "packages/plugin-sagas-core/src/integration/workers/worker-effects.ts",
    "test": "durable producer rejects selected payload and canonical JSON faults before writes without consuming replay",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "67554b07389cecedb40495441db46cd719342ac70ad93c8b2ea815436df7946f",
    "bytesIdentical": true
  },
  {
    "name": "s17-bridge-reservation",
    "file": "packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts",
    "test": "durable bridge and engine replay remain retryable after failed commit and dedupe after restart",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "f1aa9acd3833bfcc43628d6043594b44e8528747c4f40ba13182dfa918d5fd6f",
    "bytesIdentical": true
  },
  {
    "name": "s17-engine-reservation",
    "file": "packages/plugin-sagas-core/src/runtime/saga-engine.ts",
    "test": "durable bridge and engine replay remain retryable after failed commit and dedupe after restart",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "3c9496d1b518ea9ed22966ca40f9851527c17fb3b0cbbe192d07889435c6a273",
    "bytesIdentical": true
  },
  {
    "name": "s17-strict-trace",
    "file": "packages/service/src/commands/application/command-identity.ts",
    "test": "durable producer rejects selected payload and canonical JSON faults before writes without consuming replay",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "c7fbfb036056e5fc1ed2dcfcf084009565dc5d48d40b622949a196bb644eb184",
    "bytesIdentical": true
  },
  {
    "name": "s15-tags",
    "file": "packages/plugin-sagas-core/src/integration/workers/worker-effects.ts",
    "test": "worker effects expose distinct explicit job and task constructors",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "67554b07389cecedb40495441db46cd719342ac70ad93c8b2ea815436df7946f",
    "bytesIdentical": true
  },
  {
    "name": "s15-snapshot",
    "file": "packages/plugin-sagas-core/src/integration/workers/worker-effects.ts",
    "test": "worker effects validate the selected schema and privately snapshot payload",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "67554b07389cecedb40495441db46cd719342ac70ad93c8b2ea815436df7946f",
    "bytesIdentical": true
  },
  {
    "name": "s15-schema-required",
    "file": "packages/plugin-sagas-core/src/integration/workers/worker-effects.ts",
    "test": "durable worker effects refuse legacy type-only definitions and non-JSON output",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "67554b07389cecedb40495441db46cd719342ac70ad93c8b2ea815436df7946f",
    "bytesIdentical": true
  },
  {
    "name": "s15-json-required",
    "file": "packages/plugin-sagas-core/src/integration/workers/worker-effects.ts",
    "test": "durable worker effects refuse legacy type-only definitions and non-JSON output",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "67554b07389cecedb40495441db46cd719342ac70ad93c8b2ea815436df7946f",
    "bytesIdentical": true
  },
  {
    "name": "s15-task-handler-schema",
    "file": "packages/plugin-workers-core/src/builders/task-builder.ts",
    "test": "worker effects validate the selected schema and privately snapshot payload",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "restoredSha256": "52f888e5e56f71a7a77c49b9bee816aa66fafdecfeba3b61f2bc97d04f71a933",
    "bytesIdentical": true
  }
]
```

## S18 implementation and Tier-A slice review

Two named contract RED AssertionErrors before the adapter. Database-owned bindPostgresCommandOutbox reuses C3's reviewed append SQL; root/lifecycle handles refused. Named createPrismaSagaTransitionStore preserves the true callback type and commits hashed replay marker, state CAS, owned correlation, append-only history and all outbox rows under one physical transaction/deadline. Cancellation after each actual row seam rolls back all five; same inbound key retries. Initial absence and stale/concurrent/replay races prove one command set. Shared conformance runs on memory and generated-client PostgreSQL. Actual root-write negative control survives rollback, and intentional root-bound outbox production mutation is caught by a named provider assertion. Read hydration revives only framework dates, preserving business state strings. Reviewed shipped replay model and migration fixtures; construction has no DDL. Existing general Prisma idempotency parity remains deferred. Saga-id bound matches the shipped schema.

Static check, scoped regression, lint/format/quality/architecture and complete owned stores/database-postgres doc entrypoints pass. Five semantic mutation controls restore exact bytes and PASS; provider controls verify inner named AssertionError, not wrapper compilation failure. Native provider gate runs both current C3 command-store and C6 generated-client physical suites without ignored tests; raw exits retained privately. S18 native gate EXIT 0 (both provider wrappers, zero ignored); regression 381 PASS/0 FAIL/5 provider-dependent ignored separately certified. S18 signoff: PASS for slice only. S19/S20, final evaluator/CI remain pending.

```json
[
  {
    "name": "s18-bound-root",
    "test": "bound outbox rejects lifecycle and root clients before any write",
    "innerTest": null,
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "bytesIdentical": true,
    "restoredSha256": {
      "packages/database/src/commands/adapters/bind-postgres-command-outbox.ts": "bc989620a4939a76c69e0a6daa4d95a58c2e8fd99b15d0ee5b3fa50e34b1f567"
    }
  },
  {
    "name": "s18-atomic-root",
    "test": "Prisma atomic adapter refuses root callback handles before writes",
    "innerTest": null,
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "bytesIdentical": true,
    "restoredSha256": {
      "packages/database/src/commands/adapters/bind-postgres-command-outbox.ts": "bc989620a4939a76c69e0a6daa4d95a58c2e8fd99b15d0ee5b3fa50e34b1f567"
    }
  },
  {
    "name": "s18-provider-cancel",
    "test": "real PostgreSQL generated-client atomic saga transition conformance",
    "innerTest": "PostgreSQL whole transition rolls back each row seam and retries the same inbound identity",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "bytesIdentical": true,
    "restoredSha256": {
      "packages/plugin-sagas-core/src/stores/prisma-saga-transition-store.ts": "dfb5d3271b3e67e3775c6b658e89985f355397d62be570a1068f65987d0fbcf5"
    }
  },
  {
    "name": "s18-provider-replay",
    "test": "real PostgreSQL generated-client atomic saga transition conformance",
    "innerTest": "PostgreSQL stale saga writers and replay races commit one command set",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "bytesIdentical": true,
    "restoredSha256": {
      "packages/plugin-sagas-core/src/stores/prisma-saga-transition-store.ts": "dfb5d3271b3e67e3775c6b658e89985f355397d62be570a1068f65987d0fbcf5"
    }
  },
  {
    "name": "s18-provider-root-escape",
    "test": "real PostgreSQL generated-client atomic saga transition conformance",
    "innerTest": "PostgreSQL whole transition rolls back each row seam and retries the same inbound identity",
    "mutantExit": 1,
    "namedAssertion": true,
    "restoredExit": 0,
    "bytesIdentical": true,
    "restoredSha256": {
      "packages/database/src/commands/adapters/bind-postgres-command-outbox.ts": "bc989620a4939a76c69e0a6daa4d95a58c2e8fd99b15d0ee5b3fa50e34b1f567",
      "packages/plugin-sagas-core/src/stores/prisma-saga-transition-store.ts": "dfb5d3271b3e67e3775c6b658e89985f355397d62be570a1068f65987d0fbcf5"
    }
  }
]
```

## S19 actual predecessor consumer and Tier-A slice review

Current C6 producer/store and worker definitions target actual C5 production relay/worker sink. Immutable READY pin: 1a93a6acb127f58cb5bb622223180ca5e5e9925e. C5 remains unmerged; no C5 product copy/stack/release. Temporary archive removes only workspace configuration to avoid duplicate package registrations; production modules stay byte-identical, explicit consumer imports preserve current C6 APIs. Native fixture setup applies the actual C5 acceptance migration, never production runtime DDL.

Restart recovers a committed intent. Crash after checked acceptance retains lease; expiry/restart redelivers the same id/dedupe/correlation/W3C. Independent durable SQL downstream applied key proves one effective application for two deliveries; normalized receipt identity/time settle together. Stale leases refuse settlement; malformed bare receipts remain unsettled and a bounded checked retry succeeds. Stop awaits noncooperative acceptance before recovery with the same stable key. At-least-once delivery only, no exactly-once transport claim. Two semantic current-producer mutants cover both inner named tests and outer wrapper; exact restoration/PASS. Native C3/C6/C5 provider gate EXIT 0, scoped check/lint/quality/architecture pass. No new relay/lease/retry/drain infrastructure. S19 signoff PASS for slice only; S20/final evaluator/CI pending.

```json
{
  "cohort": "1a93a6acb127f58cb5bb622223180ca5e5e9925e",
  "productionSourceSha256": {
    "packages/service/src/commands/relay/create-command-outbox-relay.ts": "09276e5e050f69e390254c2cd1db5aeb2d11c9fa03bee2fd089a81c4b29c431d",
    "packages/database/src/commands/adapters/create-postgres-command-outbox-relay-store.ts": "819c0fb746ebca97a08d8382df344670b09a77c43bb7275f8bfa1d0cf5f4b969",
    "packages/plugin-workers-core/src/integration/commands/worker-command-sink.ts": "c3d91f5253d52fde539e3ebee7413a14968c7c801b349d2bba640d13d314adf6",
    "packages/database/tests/fixtures/command-store/relay-acceptance-migration.sql": "01f3d5bba226e60e0830e68ef41fcec1e25d8e6dae5eccb739326f9f8df0bd31"
  },
  "mutations": [
    {
      "name": "s19-stable-dedupe",
      "test": "real PostgreSQL saga commands consume the pinned C5 relay cohort",
      "innerTest": "saga command restart and acceptance crash reuse C5 checked relay and worker sink",
      "mutantExit": 1,
      "namedAssertion": true,
      "restoredExit": 0,
      "bytesIdentical": true,
      "restoredSha256": {
        "packages/plugin-sagas-core/src/application/produce-worker-commands.ts": "b30ea6b9fafe8fe29be1594bd7c7c1f0952514fd17f8040793a1c553ab502f25"
      }
    },
    {
      "name": "s19-due-intent",
      "test": "real PostgreSQL saga commands consume the pinned C5 relay cohort",
      "innerTest": "saga commands reuse C5 lease ownership malformed receipt retry and shutdown drain",
      "mutantExit": 1,
      "namedAssertion": true,
      "restoredExit": 0,
      "bytesIdentical": true,
      "restoredSha256": {
        "packages/plugin-sagas-core/src/application/produce-worker-commands.ts": "b30ea6b9fafe8fe29be1594bd7c7c1f0952514fd17f8040793a1c553ab502f25"
      }
    }
  ]
}
```

- **Owner matrix override:** owner authorized `complex/implementation_evaluation` → `glm_5_3_flash@max` because HARNESS.md owner directive: independent GLM 5.3 Flash max; Google fallback only on unavailability. BRIEF-D4 limits unsuccessful review to three rounds.

## S20a native consumer and publication input checkpoint

The actual pinned C5 consumer now observes current native processWorkerJob execution/progress through KvExecutionState, real Deno KV idempotency storage and the first-party mutation hook/durable stream producer against the native durable-stream server with persistent backend. Progress is 25/75 and survives worker-store reopen/server restart; only the transition command is in the outbox. Checked publishSagaOrThrow completion advances the saga to completed without a mirrored progress command. Acceptance-before-mark restart delivers the same stable command identity; native worker idempotency and independently guarded durable SQL application each remain once. Rejected publisher, malformed/wrong-target receipt, invalid selected payload before every write and same-key valid retry are asserted. The typed job handler retains its existing id/payload API; native execution context owns progress. No queue/service replacement or relay fork.

Two native progress/checked-publisher semantic production mutants fail named inner AssertionErrors and restored PASS. Original state validation now precedes structured cloning to retain prototype/accessor rejection; its named memory assertion fails the intentional omission mutant and passes exact restoration. Aggregate semantic receipts are mutations.json; invalid compilation attempts retain private logs and receive no credit.

Root check EXIT 0 (3261 files, zero failed batches); regression EXIT 0, 535 passed/zero failed/seven ignored separately from dedicated native provider certification. Final native PostgreSQL gate EXIT 0 includes C3, atomic C6 and all three pinned-C5 cohort cases, zero ignored. Final lint/format/quality/architecture EXIT 0. Full export inventory EXIT 0. Native publication dry-runs and JSR audits for all four touched packages pass, as does saga plugin dry-run. Production install and frozen Fresh UI pass after native lock:update normalizes already-locked peer identities; no newly resolved npm integrity/version values, lock deletion or reload.

Owned saga root/effect/port/testing/store and worker root documentation graphs EXIT 0; database/service command graphs already qualified. Entire saga export map EXIT 1 with eight legacy private-type diagnostics (original baseline eight, normalization temporarily nine; store curation removes one). Entire worker map EXIT 1 with seven (original baseline eight). Neither full-map run is claimed green. Public inventory uses native Deno doc JSON v2 and includes all new typed effects/capabilities/factory/bound writer/trace helper.

S20a slice signoff PASS for consumer, validation and publication inputs only. Four generated assets/freshness, canonical full runtime, final current-head CI and independent IMPL-EVAL remain pending.

## S20b pinned generated-input checkpoint

Deno 2.9.5 gen:agent-docs-prose, gen:assets-barrel and gen:publish-assets all EXIT 0. Commit their inputs before native MCP export corpus generation to satisfy its clean read set. Fresh correctly authorized GLM primary canary EXIT 2: native expense guard provider_rate_limited before inference. No primary review verdict; authorized native Google separate-family fallback will use a fresh C6 context. Initial canary invocation was rejected for the missing exact owner-override worklog entry and was corrected before the genuine availability probe; that preflight failure is not provider-unavailability evidence.
