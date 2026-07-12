# Compatibility Matrix — GlideMQ vs NetScript's supported backends

The pivotal question: *can GlideMQ subsume or coexist with the backends NetScript supports today
(Deno KV, Redis, Garnet, RabbitMQ, Postgres), and does it run under Deno at all?*

## 1. What GlideMQ demands from the server

From `glide-mq/docs/ARCHITECTURE.md` (verified first-hand, 2026-07-09):

1. **Valkey Functions** — `FUNCTION LOAD` / `FCALL`, a single Lua library (`#!lua name=glidemq`,
   44 functions, `LIBRARY_VERSION`-tracked, `FUNCTION LOAD REPLACE` on mismatch, routed to
   `allPrimaries` in cluster mode). Introduced in Redis 7.0 / all Valkey versions. **Not EVAL** —
   there is no script-based fallback path.
2. **Redis Streams with consumer groups** — `XADD`, `XREADGROUP ... BLOCK`, `XACK`, `XAUTOCLAIM`
   (stalled-job reclaim), `XTRIM` (broadcast retention).
3. **Sorted sets, hashes, lists** — scheduled/priority ZSet with `(priority * 2^42) + ts` score
   encoding, completed/failed ZSets, job hashes, LIFO list.
4. Optional: **Valkey Search module** (`FT.CREATE`, KNN vector search over job hashes).

Client side: `@glidemq/speedkey` (Rust NAPI `.node` binary, personal fork of valkey-glide), CJS-only
package, `engines.node >= 20`.

## 2. Backend-by-backend verdict

| Backend (NetScript today) | FUNCTION | Streams + XAUTOCLAIM | Verdict for GlideMQ |
| --- | --- | --- | --- |
| **Valkey 7.0+** (incl. ElastiCache Valkey, MemoryDB) | ✅ | ✅ | ✅ full — GlideMQ's first-class target |
| **Redis OSS 7.0+** | ✅ | ✅ | ✅ full |
| **Garnet** | ❌ no FUNCTION/FCALL (Lua EVAL only, Redis ≤6 model) | ❌ no Streams at all | ❌ **hard blocker** — GlideMQ cannot run on Garnet, period |
| **Deno KV** | n/a (not Redis-protocol) | n/a | ❌ structurally impossible |
| **RabbitMQ / Postgres** (queue adapters) | n/a | n/a | ❌ different protocol family |
| Upstash / most serverless Redis | ❌ | partial | ❌ blocker |
| Dragonfly | ⚠️ incomplete FUNCTION | ⚠️ | ⚠️ unverified |

Sources: Garnet docs `microsoft.github.io/garnet/docs/commands/scripting` (Lua EVAL/EVALSHA only,
no FUNCTION) and `docs/welcome/compatibility` (no Streams/XADD/XREADGROUP); microsoft/garnet#509.

**Consequence:** GlideMQ can never *replace* NetScript's queue seam. It can only be **one more
adapter behind the `MessageQueue` port** — exactly the shape the sagas list-transport precedent
established for Garnet. The existing Deno KV / Garnet / RabbitMQ / Postgres paths are untouched;
they remain the portable floor while GlideMQ becomes the opt-in high-performance ceiling.

## 3. Deno runtime compatibility — the gating unknown

- GlideMQ's README claims "Node.js 20+, Bun, or Deno with NAPI support".
- The repo's own `HANDOVER.md` contradicts the marketing: **"Bun/Deno NAPI compatibility testing:
  still pending from 0.14.0 handover"** — unresolved across the whole 0.15.x series (current
  0.15.4, 2026-06-04).
- Risk stack: platform-specific NAPI `.node` binary from a personal fork (`@glidemq/speedkey`),
  CJS-only entry + subpaths (`glide-mq/testing`, `glide-mq/proxy`), dynamic
  `require('@opentelemetry/api')`, `child_process`/`worker_threads` sandbox mode.
- Deno's Node-API layer loads many NAPI modules but is not universal; `--allow-ffi` and a local
  `node_modules` (`nodeModulesDir`) are typically required. NetScript already manages npm deps via
  the catalog (`catalog:` is npm-only — netscript-deno-toolchain), so the packaging mechanics are
  available; the binary-load behavior is the untested part.

**Verdict:** unproven, plausibly workable, must be settled by a ~1-day spike (Phase 0 of the RFC)
before any adapter work is planned. If the NAPI binding fails under Deno, the fallback is writing
the adapter against a pure-TS Redis client speaking `FCALL` to GlideMQ's *server-side function
library* (the wire protocol is documented in `docs/WIRE_PROTOCOL.md` precisely for cross-language
clients) — at the cost of losing the Rust-client performance half of GlideMQ's advantage while
keeping the 1-RTT server-side half.

## 4. Supply-chain / maturity assessment

| Axis | Finding | Risk |
| --- | --- | --- |
| License | Apache-2.0 across core + ecosystem | ✅ none |
| Version | 0.15.4 (pre-1.0), 5 minors in ~3 months | ⚠️ churning API, `LIBRARY_VERSION` bumps (81→84 within 0.15.x) |
| Bus factor | **1** — single author (avifenesh) for core, speedkey NAPI fork, dashboard, all framework integrations | 🔴 highest single risk |
| speedkey | personal fork of valkey-glide core, self-declared temporary ("will be replaced by valkey-glide when glide completes its NAPI migration") | 🔴 transport layer could be orphaned |
| Tests/CI | 2,414 tests, green CI, Valkey 9.1.0 images | ✅ strong for its age |
| Ecosystem | dashboard 3★, hono 13★ — pre-discovery phase | ⚠️ no community safety net |

**Mitigation shape:** never expose GlideMQ types on a NetScript public surface. The
`MessageQueue`/port boundary is the containment vessel: if the project dies, NetScript swaps the
adapter (worst case: back to the plain Redis adapter) without breaking a single consumer.

## 5. What survives even if we never ship the adapter

Three GlideMQ assets are backend-agnostic **design references** with direct NetScript targets:

1. **AI-native job primitives** (`reportUsage`, `job.stream`, suspend/resume signals, fallback
   chains, TPM limiters, flow budgets) → port-level vocabulary for `plugin-workers-core` +
   `plugin-ai-core` (the ai plugin currently has zero durable-job semantics).
2. **Dashboard REST/SSE surface** (`GET /api/queues`, per-job detail + logs, pause/resume/drain/
   retry/clean mutations, `/api/events` SSE, `readOnly` + per-action `authorize` callback, flow
   usage/budget endpoints) → concrete prior art for #400 S7–S10 consoles and the `/_netscript/*`
   introspection plane — including its mistakes (it *is* the log-tail/metrics-chart shape #400's
   acceptance line 1 forbids, so it's both a positive and a negative reference).
3. **OTel span conventions** (`glide-mq.queue.add` spans, bring-your-own-tracer `setTracer()`,
   optional `@opentelemetry/api` peer, server-side per-minute metrics buckets with zero extra
   RTTs, `events:false`/`metrics:false` throughput switches) → input to #399 TC conventions and
   the T6 oRPC/AI port.
