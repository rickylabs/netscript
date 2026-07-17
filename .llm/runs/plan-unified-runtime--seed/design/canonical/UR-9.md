<!-- seed:plan-unified-runtime slot:UR-9 -->

# UR-9 — KV/queue/cache ownership + durability policy behind NetScript ports

- **Slot:** UR-9
- **Owning pack:** D2 capability-matrix (draft D2-S3, KV/queue/cache portion)
- **Labels:** `type:feat`, `area:kv`, `area:database`, `area:service`, `area:deploy`, `epic:unified-runtime`, `epic:deployment`, `priority:p2`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-5 (capability framework)
- **Blocks:** UR-12

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-9 -->
>
> Realize the ownership mappings in `proposal.md` §2.2–§2.4 across the **three v1 cells**: NetScript
> `KvStore`, `MessageQueue`, and `DatabaseAdapter` remain authoritative; Nitro unstorage / db0 / task
> primitives are host bindings **behind** the ports, never exposed to application code. Board language
> uses the shipped name `@netscript/database` (per **F-8**; naming ownership recorded in UR-11).
>
> - KV: map Nitro mounts behind `KvStore`; a CAS-dependent consumer on a non-CAS mount is a build
>   rejection (UR-5), not best-effort. Nitro `ocache` is a host HTTP/function cache only — never
>   durable KV/workflow state.
> - Queue: `@netscript/queue` owns delivery/consumer/retry/DLQ; a Nitro task runner may dispatch into
>   it but not replace it. Long-running `listen` is externalized on bounded-window cells.
> - Database: `@netscript/database` owns health/lifecycle/telemetry/transactions; a db0 bridge is
>   optional and provider-scoped. Durable provider-backed backing required on bounded-window cells;
>   **volatility is removed from the definition of "in-process"** — capability + durability policy
>   selects the backing.
>
> Evidence: `research/adapter-mapping.md` KV/Queue/SQL/Cache rows + "Adapter boundary";
> `research/drift-ledger.md` D-03/D-06/D-12; `research/nitro-v3.md` KV-storage/SQL/Cache rows.

## Acceptance / gates

- [ ] gate: each v1 cell's KV/queue/database mapping matches proposal.md §3 (L/P/U per row)
- [ ] gate: application code imports only `@netscript/kv|queue|database` surfaces — no unstorage / db0 / Nitro-task symbols leak
- [ ] gate: Nitro response cache and durable KV are separate surfaces (no conflation)

## Fork deltas

None (naming governed by F-8 in UR-11; cell set by F-2 in UR-6).
