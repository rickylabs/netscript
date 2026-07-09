# RFC — GlideMQ as an opt-in high-performance backend + AI-execution port vocabulary

- **Status:** DRAFT — produced by harness run
  `copilot-evaluate-proposal-and-documentation--glidemq-rfc`; pending owner ratification and a
  separate-session PLAN-EVAL before any issue is filed.
- **Verdict that motivates this RFC:** **conditional-positive.** GlideMQ fits NetScript — but only
  in the adapter shape, never as a seam replacement, and only after a Deno compatibility spike
  passes. Full evidence: `research.md` + `research/`.

## 1. Summary

Adopt GlideMQ in three decoupled tracks:

1. **Track A — adapter:** an experimental `QueueProvider.GlideMq` adapter behind the existing
   `MessageQueue` port in `@netscript/queue`, requiring Valkey/Redis 7.0+, gated on a Deno/NAPI
   compatibility spike. All current backends (Deno KV, Garnet-via-Redis-adapter, RabbitMQ,
   Postgres) are preserved untouched as the portable floor.
2. **Track B — AI-execution ports:** NetScript-owned port vocabulary for durable AI execution
   (usage recording, token streaming, suspend/resume, fallback chains, TPM limits, budgets) in the
   `-core` packages, implementable on **any** backend, with GlideMQ as the reference
   high-performance implementation. This is the layer `plugins/ai` is missing today.
3. **Track C — design harvest (no dependency):** apply GlideMQ's dashboard API/authz surface and
   OTel/metrics patterns as prior art inside the already-planned epics #400 and #399. Track C
   costs nothing and is valuable even if Tracks A/B never ship.

A seam performance benchmark (issue draft `issue-draft-benchmark.md`) is a **hard prerequisite**
for Track A acceptance: no adapter merges without before/after numbers on NetScript workloads.

## 2. Motivation

- NetScript's queue seam positions Redis at "> 10,000 msg/s"; GlideMQ's completeAndFetchNext
  single-FCALL design (author-benchmarked +9%→+38% over BullMQ on ElastiCache Valkey under real
  network latency) is the strongest currently available implementation of that tier, with
  cluster-native hash-tagging for free.
- `plugins/ai` has model adapters but no durable-execution semantics; agentic workloads need cost
  tracking, budget caps, human-in-the-loop suspension, streaming persistence, and model failover
  *as queue-level guarantees*, not per-request middleware.
- Epics #399/#400 are actively designing surfaces GlideMQ has already shipped working versions of;
  harvesting them de-risks both epics.

## 3. Why not "just adopt GlideMQ" (the non-fit half of the verdict)

1. **Backend exclusivity.** Hard dependency on Valkey Functions + Streams excludes Garnet
   (no FUNCTION, no Streams), Deno KV, RabbitMQ, Postgres, Upstash. NetScript's doctrine (Archetype
   2, sagas list-transport precedent) requires the portable floor to survive.
2. **Runtime risk.** Rust NAPI client from a personal valkey-glide fork, CJS-only, with upstream's
   own Deno testing still pending. Unverified ≠ incompatible, but it gates everything.
3. **Supply chain.** Bus factor 1, pre-1.0, fast-churning server library versions. Containment via
   the port boundary is mandatory: **no GlideMQ type ever appears on a NetScript public surface.**

## 4. Design

### 4.1 Track A — `glide-mq` adapter (packages/queue, Archetype 2)

- New `QueueProvider.GlideMq = 'glide-mq'` + `adapters/glide-mq.adapter.ts` implementing
  `MessageQueue<T>` (enqueue → `queue.add`, listen → `Worker` processor, ack/nack → complete/fail
  with retry/backoff mapping, `NackOptions.reason` → DLQ).
- Dead-letter: map `getDeadLetterJobs` to `DeadLetterStorePort` (feeds dashboard S12 / #553/#555).
- Discovery: Aspire env (`ConnectionStrings__valkey` / `services__valkey__*`); CLI scaffold gains a
  Valkey container resource option (OQ2).
- Capability degradation is explicit: priorities/rate-limits/dedup surface as optional
  `EnqueueOptions` capabilities the adapter advertises; other adapters no-op or degrade, mirroring
  how KV watch degrades to polling on Deno KV Connect.
- npm dependency enters via the catalog (`catalog:` — npm-only law) and stays **internal to the
  adapter module**; the adapter is lazily imported so non-users never load the NAPI binary.

### 4.2 Track B — AI-execution ports (plugin-workers-core / plugin-ai-core)

Port set (names indicative; OQ3 decides the home package):
`UsageRecorderPort`, `ExecutionStreamPort`, `SuspensionPort`, `TokenRateLimiterPort`, `BudgetPort`,
plus fallback-chain policy on the ai retry contract and execution-lease (`lockDuration`) on the job
contract. Reference implementations: KV-backed (portable floor, works on Deno KV/Garnet) and
GlideMQ-native (ceiling, if Track A ships). Contract-first per doctrine: schema/type contract →
implementation → tests.

### 4.3 Track C — design harvest into #399/#400

- #400: adopt the `authorize(req, action)` namespaced action-string model for gated write-back;
  treat `@glidemq/dashboard`'s REST/SSE inventory as the S7 console prior art and its
  log-tail/metrics screens as the documented anti-pattern (acceptance line 1).
- #399: keep OTel semconv `messaging.*` naming (recommendation for OQ4); mirror the BYO-tracer
  zero-dep default; evaluate server-side minute-bucket metrics for the T7 query surface; add
  `events`/`metrics` style throughput escape hatches to telemetry config.

## 5. Compatibility & preservation guarantees

| Backend | After this RFC |
| --- | --- |
| Deno KV | unchanged default |
| Garnet | unchanged (Redis adapter for queue/KV; sagas list-transport) |
| Redis / Valkey (plain) | unchanged `redis` provider |
| RabbitMQ / Postgres | unchanged |
| Valkey/Redis 7+ | **new opt-in** `glide-mq` provider |

## 6. Risks & mitigations

| Risk | Severity | Mitigation |
| --- | --- | --- |
| speedkey NAPI fails under Deno | high | Phase 0 spike gates everything; fallback: pure-TS client speaking the documented FCALL wire protocol (keeps 1-RTT server half, loses Rust-client half) |
| upstream abandonment (bus factor 1) | high | port containment; worst-case swap back to `redis` provider is invisible to consumers |
| pre-1.0 API churn / LIBRARY_VERSION bumps | medium | pin exact version; adapter-internal types only |
| perf claims don't reproduce on NetScript workloads | medium | benchmark prerequisite (F8) — adapter acceptance requires before/after numbers |
| scope creep into seam redesign | medium | Tracks are independent; Track B ports are backend-agnostic by construction |

## 7. Phasing

- **Phase 0 (spike, ~1 day):** `deno run` loading `npm:glide-mq` + speedkey against a Valkey
  container; enqueue/process/complete round-trip; record verdict. **Kill-switch:** NAPI failure →
  Track A paused (re-evaluate on upstream valkey-glide NAPI migration or wire-protocol client),
  Tracks B/C proceed unaffected.
- **Phase 1:** benchmark reintroduction (issue draft) — baseline current adapters.
- **Phase 2:** Track A adapter + Aspire/CLI provisioning + benchmark delta; experimental flag.
- **Phase 3:** Track B ports with KV reference implementation; GlideMQ implementation if Phase 2
  landed.
- **Continuous:** Track C inside #399/#400 design work (no new issues needed; cite this RFC in
  those epics).

## 8. Alternatives considered

- **Adopt GlideMQ as the queue seam** — rejected: breaks Garnet/Deno KV/AMQP/Postgres, violates
  Archetype 2 and the portable-floor precedent.
- **BullMQ adapter instead** — weaker: 53 EVAL scripts (NOSCRIPT churn), no AI primitives, same
  Redis-only exclusivity without the 1-RTT design; ioredis works in Deno though — it remains the
  fallback if Phase 0 fails and the wire-protocol route is unwanted.
- **Do nothing** — leaves `plugins/ai` without durable execution and cedes the AI-queue category;
  Track C harvest would still be worth doing.

## 9. Unresolved questions carried to PLAN-EVAL

OQ1–OQ4 in `research.md`. OQ3 (port home package) is the only one that must be resolved before
Track B implementation; OQ1 gates Track A; OQ2/OQ4 are safe to defer.
