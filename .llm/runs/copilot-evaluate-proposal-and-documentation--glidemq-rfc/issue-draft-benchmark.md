# Issue Draft — Reintroduce the seam performance benchmark suite

> **Draft only.** Authored by harness run `copilot-evaluate-proposal-and-documentation--glidemq-rfc`
> per seed-run drafts-only discipline; the owner files it (or authorizes filing) after ratifying
> `rfc-glidemq.md`. Labels/milestone follow `.github/labels.yml` + the netscript-pr taxonomy.

---

**Title:** `feat(bench): reintroduce the seam performance benchmark suite (queue/KV transports, pre-GlideMQ baseline)`

**Labels:** `type:feature` · `area:queue` (or nearest area label for the queue/KV seams) ·
`priority:p2` · `status:plan` · `wave:v1`

**Milestone:** `Backlog / Triage` (promote to the beta milestone that hosts the GlideMQ Phase-1
work if the RFC is ratified)

**Body:**

## Problem

When the queue/KV seams behind the plugins (workers, sagas, streams, triggers) were first designed,
adapter selection was informed by a benchmark suite in the legacy repo
(`rickylabs/netscript-start/tree/master/benchmark`). That repo is no longer accessible and the
suite has no successor here: `packages/bench` (`@netscript/bench`) is the **agent self-bench**
instrument (scores coding-agent effectiveness), not a transport benchmark. Today we cannot answer
"what does adapter X cost on a NetScript workload" with first-party numbers — including the
provider-tier claims already printed in `packages/queue/ports/options.ts` doc comments
(Deno KV "< 1000 msg/s", Redis "> 10,000 msg/s").

## Why now

The GlideMQ RFC (see run dir `.llm/runs/copilot-evaluate-proposal-and-documentation--glidemq-rfc/`)
makes a benchmark a **hard acceptance prerequisite** for any new queue adapter: GlideMQ's headline
claim (+9%→+38% over BullMQ via 1-RTT completeAndFetchNext) is author-published and must be
re-derived on NetScript workloads before it can justify a dependency. Landing the benchmark
*before* the adapter gives an untainted baseline and a permanent way to measure the benefit of this
and every future backend.

## Scope

- A workload-driven benchmark harness exercising the **`MessageQueue` port** (and optionally
  `WatchableKv` watch latency) across the shipped adapters: Deno KV, Redis, Garnet
  (Redis-compatible path), RabbitMQ, Postgres — same workload, same measurement plane.
- Metrics: throughput (jobs/s) at fixed concurrency steps (e.g. c=1/5/10/20), enqueue→complete
  latency percentiles (p50/p95/p99), RTTs per job cycle, dead-letter/retry overhead.
- Scenarios: fire-and-forget job, retry-with-backoff, delayed message, worker fan-out; sagas
  transport scenario (redis-transport vs list-transport) as a stretch goal.
- Runs locally against Aspire-provisioned containers (compose parity with `scaffold.runtime`
  infra); results emitted as a machine-readable report (JSON) + markdown summary, suitable for PR
  comments and future CI trending.
- Home: extend `packages/bench` with a transport-bench module or a sibling `bench/` surface —
  decide against doctrine (Archetype 6 tooling vs Archetype 3 runtime) during planning; **do not**
  entangle it with the agent self-bench scoring pipeline.

## Non-goals

- Cross-cloud managed-service benchmarking (ElastiCache, Upstash) — local/containerized only.
- Load-testing the HTTP/oRPC layer (separate concern).
- Shipping the GlideMQ adapter itself (RFC Track A, separate issue once ratified).

## Acceptance

- `deno task bench:seams` (name TBD) runs the suite against at least Deno KV + Redis + Garnet and
  produces the JSON + markdown reports.
- Baseline numbers for all current adapters are committed/published before any new queue adapter
  merges; the GlideMQ adapter PR (if ratified) must include a before/after delta from this suite.
- README documents methodology honestly (local containers ≠ production networks; note that
  GlideMQ's own numbers were measured over real network latency, where 1-RTT designs compound).

Refs #301. Related: RFC run dir above; #399/#400 consume some of the same primitives.
