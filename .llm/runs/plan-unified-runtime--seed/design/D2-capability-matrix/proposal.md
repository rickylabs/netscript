# D2 — Preset × Capability Contract (DRAFT design pack)

Stage-D design pack for topic **D2 capability-matrix**, seed run `plan-unified-runtime--seed`
(issue #824), feeding epic #823. **This is a DRAFT proposal — no GitHub mutation, no code.** It is
the supervisor's frame (`synthesis.md`) reduced to a concrete preset × capability contract.

**Authority note:** GitHub wins on conflict after Stage-H filing. Milestone/issue tags below are
Stage-E/owner-fork suggestions, not filings.

## 0. Frame (from synthesis + corpus)

- Nitro v3 = **host/output substrate**, not an adapter replacement; NetScript ports remain the
  application contracts (synthesis §1; `nitro-v3.md` Verdict + Board input 3; `adapter-mapping.md`
  "Adapter boundary").
- The universal invariant is **logical graph identity** (one composition root); **physical
  one-process execution is a per-preset capability**, not a global promise (synthesis §3;
  `drift-ledger.md` D-01/D-02 + Supervisor reconciliation).
- "Excludes sagas" is dead as a categorical rule; replaced by a per-preset capability declaration
  `sagas: supported | externalized | rejected`, **never task substitution** (synthesis §2;
  `sagas-constraint.md` Verdict + Board consequence 1–3; `drift-ledger.md` D-05).
- v1 board plans **four runtime cells**: `deno_server`, `deno_deploy`, one Node server preset, one
  isolate/serverless preset (synthesis "Preset cell set"; `nitro-v3.md` Board input 2).

## 1. The four v1 runtime cells

Each cell is a **capability-matrix column, not a global promise** (synthesis §3). The isolate cell
is fixed to `cloudflare_module` as the representative non-Deno isolate/serverless output because its
provider page names the preset and adds scheduled/queue/tail/email hooks that exercise the hardest
mapping questions (`nitro-v3.md` Cloud deploy presets table, Cloudflare row). `deno_deploy` covers
the Deno-based isolate/edge case; the two are **separate conformance cells**, not one
(`nitro-v3.md` Deno-preset table row 2, Board input 2).

| Cell | Nitro preset | Execution model | Long-lived process? | Build caveats |
| --- | --- | --- | --- | --- |
| **C1 deno_server** | `deno_server` | Bare-metal / container, long-lived | Yes | Node-built output; launched `deno run --unstable --allow-net --allow-read --allow-env`; broad perms to audit (`nitro-v3.md` Deno-preset table row 2; `drift-ledger.md` D-04) |
| **C2 deno_deploy** | `deno_deploy` | Provider isolate/edge, bounded window | No (per-invocation) | Separate linked-repo / token+deployctl flow; `waitUntil` runtime-dependent (`nitro-v3.md` Deno-preset table row 3, Tasks/schedules row) |
| **C3 node_server** | `node_server` (Nitro default) | Long-lived Node process | Yes | Default production output; no `--unstable`; no Deno-KV-native adapter (use Redis/AMQP/PostgreSQL backings) (`nitro-v3.md` Deno-preset table row 4; `adapter-mapping.md` Queue row) |
| **C4 cloudflare_module** | `cloudflare_module` | Provider isolate/serverless, bounded window | No (per-invocation) | Module preset recommended; platform adds scheduled/email/queue/tail/trace hooks (`nitro-v3.md` Cloudflare row) |

The **long-lived vs bounded-window** axis is the load-bearing distinction: it decides sagas, durable
queue consumers, and exclusive-lock writer ownership per cell (`sagas-constraint.md` Verdict
"preset-conditional"; `nitro-v3.md` Tasks/schedules maturity: "one running invocation per task
name; `waitUntil` runtime-dependent").

## 2. Capability declarations per cell

Mapping vocabulary (`drift-ledger.md` D-06 "lossless/partial/unsupported"):
- **lossless** — NetScript port's shipped guarantees hold unchanged on this cell.
- **partial** — port mounts, but a named guarantee (atomics, long-running consume, held lock)
  degrades or must be negotiated; the degraded axis is stated.
- **unsupported (in-cell)** — the guarantee cannot hold in this cell; app requiring it must
  externalize (macro-service split) or the build rejects (§4).

Ownership rule for every row: **NetScript ports are authoritative; Nitro primitives are host
bindings behind them; never expose unstorage / db0 / H3 / Hono / Nitro-tasks to application code**
(`adapter-mapping.md` KV row + "Adapter boundary"; `drift-ledger.md` D-06 disposition).

### 2.1 Sagas (`supported | externalized | rejected`)

Rule (verbatim intent from `sagas-constraint.md` Board consequence 1–3): in-process **only through
the NetScript saga runtime** (store/transport/outbox/idempotency ports authoritative); "externalized"
= macro-service split of the **same app model**; **never** a downgrade to Nitro tasks. Each preset
proves its declaration against duration, lifecycle, connector, and `SagaDurabilityTier` gates
(`sagas-constraint.md` Verdict "preset-conditional").

| Cell | Declaration | Why | Cite |
| --- | --- | --- | --- |
| C1 deno_server | **supported** | Long-lived process holds saga runtime; shutdown bound to Nitro `close` hook | `sagas-constraint.md` Verdict; `adapter-mapping.md` Startup/shutdown row |
| C2 deno_deploy | **externalized** (else **rejected**) | Bounded window + runtime-dependent `waitUntil` cannot guarantee durable transitions/compensation in-cell; route to a macro-service long-lived process, or reject at build if none configured | `sagas-constraint.md` Verdict "preset-conditional"; `nitro-v3.md` Tasks/schedules row |
| C3 node_server | **supported** | Same long-lived model as C1, no `--unstable` | `sagas-constraint.md` Verdict; `nitro-v3.md` deploy overview row |
| C4 cloudflare_module | **externalized** (else **rejected**) | Isolate window; platform queue/scheduled hooks are activation, not saga state/compensation/outbox | `sagas-constraint.md` Board consequence 2; `adapter-mapping.md` Saga row |

Never-do: replacing saga execution with Nitro tasks discards correlation, persisted transitions,
compensation, retry policy, idempotency, and outbox (`sagas-constraint.md` Verdict ¶2).

### 2.2 KV ownership mapping (`@netscript/kv` `KvStore` authoritative)

| Cell | CRUD/TTL/list | Atomics/CAS | Watch/reactivity | Cite |
| --- | --- | --- | --- | --- |
| C1 deno_server | lossless (Deno KV / memory adapters ship) | lossless (Deno KV `atomic` CAS) | lossless→partial (native where driver permits, else polling) | `adapter-mapping.md` KV rows 1–3; `nitro-v3.md` KV/storage row |
| C2 deno_deploy | lossless (Deno KV on Deploy) | lossless (Deno KV atomics) | partial (polling where no native watch) | `adapter-mapping.md` KV atomics row; `nitro-v3.md` KV/storage row |
| C3 node_server | lossless (Redis/memory adapters) | partial→lossless (depends on backing; Redis CAS ok, memory not durable) | partial | `adapter-mapping.md` KV atomics row; `nitro-v3.md` KV/storage maturity |
| C4 cloudflare_module | partial (CF-KV via unstorage: basic CRUD/TTL only) | **unsupported** (unstorage mount gives no NetScript-style CAS) | partial/unsupported | `adapter-mapping.md` KV atomics row ("mounts without CAS cannot back saga/trigger/idempotency state"); `nitro-v3.md` KV/storage: "never infer persistence, atomics, watch… from `useStorage` alone" |

Consequence: a CAS-dependent consumer (saga/trigger/idempotency state) on a non-CAS mount is a
**build-time rejection** (§4), not a silent best-effort (`adapter-mapping.md` KV atomics row).
Nitro `ocache` response/function cache is a Nitro-native host win and MUST NOT be conflated with
durable KV/workflow state (`adapter-mapping.md` Response/function-cache row; `nitro-v3.md` Cache
row).

### 2.3 Queue ownership mapping (`@netscript/queue` `MessageQueue` authoritative)

NetScript is strictly broader than Nitro tasks; a Nitro task runner MAY dispatch into the queue but
CANNOT replace delivery/consumer/retry/DLQ semantics (`adapter-mapping.md` Queue row + Retry/DLQ
row). The load-bearing axis is the **long-running listener** (`MessageQueue.listen`), which needs a
live process.

| Cell | Enqueue/delayed | Consume (long-running listener) | Retry ledger + DLQ | Cite |
| --- | --- | --- | --- | --- |
| C1 deno_server | lossless | lossless (process hosts `listen`; Deno KV/Redis/AMQP/PostgreSQL + DLQ) | lossless | `adapter-mapping.md` Queue + Retry/DLQ rows |
| C2 deno_deploy | lossless (enqueue) | **externalized** (no long-lived consumer in-isolate) | externalized with the consumer | `adapter-mapping.md` Queue row; `nitro-v3.md` Tasks/schedules maturity |
| C3 node_server | lossless | lossless (Redis/AMQP/PostgreSQL + DLQ) | lossless | `adapter-mapping.md` Queue + Retry/DLQ rows |
| C4 cloudflare_module | partial (CF Queues platform binding behind port) | partial (event-driven consumer via platform hook, not `listen`; ack/nack/retry adapted) | partial (DLQ/attempt-ledger adapted to platform) | `adapter-mapping.md` Queue + Retry/DLQ rows; `nitro-v3.md` Cloudflare row (queue hooks) |

### 2.4 Database ownership mapping (`@netscript/database` `DatabaseAdapter` authoritative)

Board language normalizes to the shipped name `@netscript/database`; `@netscript/data` from #823 is
naming drift and, if intended as a new facade, needs its own contract card — out of D2 scope
(`drift-ledger.md` D-12; `adapter-mapping.md` intro ¶). NetScript owns health, lifecycle, telemetry,
Prisma-driver and transaction contracts; a Nitro db0 bridge is optional, provider-scoped, and never
authoritative (`adapter-mapping.md` SQL row; `nitro-v3.md` SQL-database row).

| Cell | Connect/query + lifecycle | Pool/transaction/health | Backing selection | Cite |
| --- | --- | --- | --- | --- |
| C1 deno_server | lossless | lossless (process holds pool) | provider adapter (Postgres/MSSQL/MySQL) or embedded | `adapter-mapping.md` SQL row |
| C2 deno_deploy | partial (connection-per-invocation) | partial (no long-held pool; use provider-backed / serverless driver) | provider-backed durable required | `nitro-v3.md` SQL-database maturity; `drift-ledger.md` D-03 |
| C3 node_server | lossless | lossless | provider adapter or embedded | `adapter-mapping.md` SQL row |
| C4 cloudflare_module | partial (per-invocation; D1/SQLite host binding) | partial (serverless driver; no long-held pool) | provider-backed durable required | `nitro-v3.md` SQL-database maturity; Cloudflare row |

**Volatility is removed from the definition of "in-process"**: a single process may still use
durable provider-backed KV/queue/DB; capability + durability policy selects the backing
(`drift-ledger.md` D-03). Nitro storage/DB defaults (volatile memory / dev SQLite) are NOT a preset
guarantee (`nitro-v3.md` Board input 3).

### 2.5 Writer-ownership / lock capability (D-08)

Writer ownership and exclusive-lock compatibility are a **declared database capability**; "default
embedded" (single-writer TursoDB at the root) must **not silently override topology constraints**
(`drift-ledger.md` D-08; RFC §3 "exclusive locks / single-writer are constraints that can earn a
graph edge").

| Cell | Exclusive-lock single-writer | Embedded-Turso default | Cite |
| --- | --- | --- | --- |
| C1 deno_server | supported (long-lived holder) | allowed where topology permits | `drift-ledger.md` D-08 |
| C2 deno_deploy | **unsupported in-cell** → externalize or reject | not as a hidden default | `drift-ledger.md` D-08; D-01/D-02 |
| C3 node_server | supported (long-lived holder) | allowed where topology permits | `drift-ledger.md` D-08 |
| C4 cloudflare_module | **unsupported in-cell** → externalize or reject | not as a hidden default | `drift-ledger.md` D-08 |

### 2.6 Offline-sync capability (D-09)

Offline sync (e.g. Turso Sync from #455) is a **database-target capability/profile, not a
unified-runtime invariant and not an assumption on every Nitro preset** (`drift-ledger.md` D-09;
`sagas-constraint`/`nitro-v3.md`: Nitro DB layer is experimental db0, no documented universal
Turso-Sync/offline replication).

| Cell | Offline-sync | Note |
| --- | --- | --- |
| C1 deno_server | capability/profile (supported when DB target provides it) | server-side; desktop-embed is the primary consumer (`drift-ledger.md` D-04 desktop adapter) |
| C2 deno_deploy | not applicable (edge server) | profile only |
| C3 node_server | capability/profile | as C1 |
| C4 cloudflare_module | not applicable (edge server) | profile only |

Offline sync is declared on the **database target**, cross-referenced by the D-04 desktop target
adapter — not owned by D2's runtime cells beyond the capability flag.

### 2.7 Task / schedule mapping (worker + trigger cores authoritative)

Nitro is a preset-aware **clock/activation adapter**; NetScript owns definition, event record,
backfill, retries, dispatch, and durable workflow (`adapter-mapping.md` Cron + One-off-task +
Durable-workflow rows). Nitro's same-name coalescing MUST NOT silently change a worker definition's
expected concurrency (`adapter-mapping.md` One-off-task row).

| Cell | Cron activation | One-off task | Durable workflow | Cite |
| --- | --- | --- | --- | --- |
| C1 deno_server | lossless (croner clock → NetScript dispatch) | lossless (adapter reconciles name/concurrency) | supported (runtime above Nitro) | `adapter-mapping.md` Cron/One-off/Durable-workflow rows |
| C2 deno_deploy | partial (provider-native schedule generation) | partial (bounded window) | externalized | `nitro-v3.md` Tasks/schedules row; `adapter-mapping.md` Durable-workflow row |
| C3 node_server | lossless | lossless | supported | `adapter-mapping.md` Cron/One-off rows |
| C4 cloudflare_module | partial (native CF scheduled hook) | partial (bounded window) | externalized | `nitro-v3.md` Cloudflare row; `adapter-mapping.md` Durable-workflow row |

## 3. Consolidated matrix (one glance)

`L`=lossless · `P`=partial · `U`=unsupported-in-cell · saga = declaration.

| Capability | C1 deno_server | C2 deno_deploy | C3 node_server | C4 cloudflare_module |
| --- | --- | --- | --- | --- |
| Sagas | supported | externalized/reject | supported | externalized/reject |
| KV CRUD/TTL | L | L | L | P |
| KV atomics/CAS | L | L | P | **U** |
| KV watch | L/P | P | P | P |
| Queue enqueue | L | L | L | P |
| Queue consume (listen) | L | externalized | L | P |
| Queue retry+DLQ | L | externalized | L | P |
| Database lifecycle | L | P | L | P |
| Writer exclusive-lock | L | **U** | L | **U** |
| Offline-sync | profile | n/a | profile | n/a |
| Cron activation | L | P | L | P |
| Durable workflow | L | externalized | L | externalized |

## 4. Build-time rejection semantics

**Unsupported combinations fail at BUILD time, never at runtime, and never as a silent downgrade**
(`drift-ledger.md` D-06 "Board cards must state adapter ownership and lossless/partial/unsupported
mappings"; `sagas-constraint.md` Board consequence 2 "reject at build time"). Mechanism:

1. **Every preset ships a capability manifest** — the machine form of §3 (per-cell L/P/U + saga
   declaration + writer/offline flags).
2. **The composition compiler cross-checks declared app requirements against the selected preset's
   manifest.** Requirements are read from the logical graph (does the app mount a saga runtime? a
   long-running queue listener? a CAS-dependent trigger/idempotency store? an exclusive-lock
   single-writer DB?).
3. **On a `U` (or an unmet saga `SagaDurabilityTier`) the build FAILS** with a specific diagnostic
   naming: the capability, the offending cell, and the **externalize path** (macro-service split of
   the same app model). It must never coalesce to a Nitro task or a volatile mount
   (`sagas-constraint.md` Board consequence 1 + 3).
4. **`partial` requires an explicit acknowledgement/adapter selection**, not a hard fail — the
   degraded axis (e.g. polling watch, per-invocation DB) is surfaced as a build warning with the
   named cost (`adapter-mapping.md` KV watch row "document cost/latency").
5. **Nitro same-name task coalescing** is treated as a capability mismatch if it would change a
   worker's declared concurrency → build diagnostic, not silent acceptance (`adapter-mapping.md`
   One-off-task row).

Rejection is the honest realization of synthesis §3: logical graph identity is preserved for all
four cells, while physical/one-process guarantees (sagas, held locks, long-running consumers) are
gated per cell rather than globally promised.

## 5. Cross-pack seams (not owned here)

- **D1 composition-host** owns the composition root, Nitro listener/lifecycle bridge, Fresh
  `app.handler()` mount (no nested `listen()` — `drift-ledger.md` D-10), oRPC in-process bridge +
  H3-conformance gate, and the oRPC `^1.14.6` version pin (`drift-ledger.md` D-11; synthesis §4–5).
  D2 consumes the composition root and the `close`-ordered shutdown it defines.
- **D3 board-mechanics** owns epic decomposition, milestone train, and the supersession map (#451
  D-07 fold-in, #453 D-08, #454 D-02 re-scope, #455 D-09, #349 close). D2's issue drafts
  (`epic-and-issues.md`) are inputs to D3's Stage-E lock, not a competing filing.
- The **D-04 desktop target adapter** consumes D2's offline-sync + writer-ownership capability flags;
  D2 does not own desktop distribution/rollout mechanics.
