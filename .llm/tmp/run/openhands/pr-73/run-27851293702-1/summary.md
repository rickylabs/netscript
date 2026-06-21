# PLAN-EVAL — rbp-dlq-contract

## Verdict

**PLAN-EVAL rbp-dlq-contract: FAIL_PLAN**

Single unchecked box in `gates/plan-gate.md`. Plan otherwise structurally sound — research re-baselined against real tree, decisions locked, open-decision sweep clean, slice ordering fine, jsr-audit applied to full export map, production/enterprise bar met.

## Summary

Evaluated the plan only (read-only). Did not commit, did not modify any repo file. Spot-checked every load-bearing research citation against the real tree (HEAD `9678de51`; the cosmetic baseline label `cc3b8731` is the stale local main per prompt and was ignored). All citations verified:

- `kv-polling.adapter.ts:148` KvPrefixes.dlq ✓
- `kv-polling.adapter.ts:283-285` dlqKey ✓
- `kv-polling.adapter.ts:471-523` nack → DLQ ✓
- `kv-polling.adapter.ts:674-698` getStats dlq count ✓
- `kv-polling.adapter.ts:726-760` reprocessDlq ✓
- `postgres.adapter.ts:392-418` createContext, `:420-427` DELETE-as-ack ✓
- `redis.adapter.ts:317-342` createContext nack drops ✓
- `deno-kv.adapter.ts:291-305` no-op ack/nack ✓
- `amqp.adapter.ts:207-221` no-op ack/nack ✓
- `testing/memory-queue.ts:180-213` nack drops ✓
- `create-typed-queue.ts:174-177` `onValidationError:'dlq'` branch ✓
- `ports/options.ts:208-230` advertised 'dlq' enum ✓
- `adapters/_envelope.ts:14-79` MessageEnvelope / createMessageContext ✓
- `deno.json:25-34` imports include `@netscript/kv` (no new dep) ✓

The structural root of the gap is confirmed: only KvPolling has a real DLQ, factory reaches it only under KV Connect (`create-queue.ts:256`), and `onValidationError:'dlq'` is a lie on 4 of 5 adapters. The plan's `DeadLetterStorePort<T>` + `KvDeadLetterStore` (default) + `PostgresDeadLetterStore` + `RedisDeadLetterStore` + per-adapter `deadLetterStore?` constructor option, with `nack({requeue:false})` / max-attempts routing into `#dlq.append` *before* the discard/DELETE, is the correct shape and closes the gap on every adapter (including DenoKv/AMQP where `KvDeadLetterStore` is the always-available sink; RabbitMQ DLX documented as optional higher-throughput path). Behavior of KvPolling is preserved via default `KvDeadLetterStore` mirroring the `['queue:dlq', queueName, failedAt, messageId]` key layout — byte-for-byte. KV resolved lazily on first use (AP-11 ✓). Port minimal (AP-3 ✓): append/list/reprocess/depth with `reenqueue` callback to keep the store transport-agnostic. Idempotent append (ON CONFLICT / keyed). Store errors propagate so the message stays claimed for redelivery (no silent drop). Production/enterprise bar: durable on every adapter; full unit + integration + failure-path + regression + port-contract test plan; no in-memory-only shipped default; no stub advertised surface.

## Per-box check table

| Box (plan-gate.md) | Status | Evidence / required fix |
| --- | --- | --- |
| Research present and current | ✓ | research.md exists; every cited file:line re-verified on real HEAD `9678de51` (label `cc3b8731` ignored per prompt) |
| Decisions locked | ✓ | plan-meta.json lockedDecisions (8 items with rationale); plan.md ## Design labels each section LOCKED |
| Open-decision sweep | ✓ | plan.md ## Open decisions + plan-meta.json openQuestions; "Reprocess concurrency" safe-to-defer (additive); "AMQP DLX vs KV sink" resolved-now (defer would force adapter rework). No latent decision left unflagged |
| Commit slices | ✓ | 8 ordered slices (< 30); each names what it proves, the gate that proves it, the files it touches |
| Risk register | ✓ | 5 risks with explicit mitigations in plan-meta.json `risks` |
| Gate set selected | ✗ | See "Required fix" below |
| Deferred scope explicit | ✓ | scopeOverlays "none — packages/queue is a library"; plan.md ## Locked scope "Unit: packages/queue only. No service/scaffold/docs-site changes." |
| jsr-audit (package wave) | ✓ | ## jsr-audit (planned surface) in plan.md enumerates the 7 new exports, names slow-type risk, mitigates with explicit `Promise<DeadLetterRecord<T>[]>` return annotations, applied to FULL export map (mod.ts + ports/mod.ts + adapters/mod.ts) |

## Required fix (FAIL_PLAN)

**Box: Gate set selected.** plan.md ## Gates to run enumerates only `F-1, F-3, F-5, F-6, F-7, F-8, F-10, F-12, F-14, F-15` (10 gates). Per `gates/archetype-gate-matrix.md`, Archetype-2 (Integration) is **required** for `F-1, F-2, F-3, F-4, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-14, F-15, F-16, F-17, F-18` (F-13 is n/a for Arch-2). Missing: **F-2, F-4, F-9, F-11, F-16, F-17, F-18** (7 gates). The plan's `planGateSelfCheck` overconfidently claims PASS despite this gap.

**Specific fix:** expand `plan.md` ## "Gates to run" to include every required Arch-2 fitness gate, each with a Phase A disposition per the matrix (PASS with manual evidence, PENDING_SCRIPT + manual evidence, DEBT_ACCEPTED with registry entry, or FAIL/FAIL_DEBT). At minimum:

- **F-2** Helper-reinvention scan → PENDING_SCRIPT + manual evidence: no new helper duplicates `_envelope.ts` / `@netscript/kv`; new DLQ stores wrap existing primitives (PostgresQueueClient, Redis commands, WatchableKv).
- **F-4** Inheritance audit → PENDING_SCRIPT + manual evidence: each `*DeadLetterStore` `implements DeadLetterStorePort<T>` — no deep class hierarchies introduced.
- **F-9** Permission decl check → PASS: README slice calls out `--allow-read`/`--allow-write` for KV, network for Postgres/Redis (AP-19 mitigation named in plan.md ## README).
- **F-11** Forbidden-folder lint → PASS with manual evidence: new files land in `ports/`, `adapters/`, `testing/` — no `interfaces/`, no `src/` inside `packages/queue/` (AP-17 satisfied — store ships under `ports/dead-letter.ts`).
- **F-16** Folder-cardinality lint → PENDING_SCRIPT + manual evidence: folder count per `packages/queue/` unchanged; new files are added to existing folders (ports, adapters, testing).
- **F-17** Abstract-derived co-location → PASS: `DeadLetterStorePort<T>` (port) + `KvDeadLetterStore`/`PostgresDeadLetterStore`/`RedisDeadLetterStore` (derived) co-located in `ports/` and `adapters/` respectively, matching doctrine §archetype-2.
- **F-18** Sub-barrel lint → PASS: existing `ports/mod.ts` + `adapters/mod.ts` + `mod.ts` barrels carry the new exports; if the new subpath exports (`./adapters/kv-dead-letter-store`, etc.) cross any sub-barrel boundary, add the `arch:barrel-ok` justification line per existing convention.

Once the gate list is complete, the plan is a clean PASS on every box. No other rework needed.

## Production / enterprise bar

- Durable persistence on every adapter (KV/Postgres/Redis), no in-memory-only shipped default — **PASS**
- Real error handling + idempotency (idempotent append, store-error propagation so message stays claimed for redelivery) — **PASS**
- Observability/spans — routes through existing adapter logging + TracedQueue (F-14 selected) — **PASS** with minor risk that the new DLQ append doesn't introduce a stray console.log (F-14 explicitly selected to catch this)
- Graceful shutdown/drain — KvPolling already drains active processing in `stop()`; new code lives inside existing shutdown boundaries — **PASS**
- Full unit + integration + failure-path tests — testPlan covers 9 scenarios across all 5 adapters + regression — **PASS**
- No stub/no-op advertised surface — closes the `onValidationError:'dlq'` lie on Postgres/Redis/DenoKv/AMQP — **PASS**

## Open-decision sweep (independent re-run)

- `reprocess` concurrency = sequential by default → safe to defer (additive option later, no port-shape change) — flagged in plan, consistent
- RabbitMQ broker-side DLX vs KV sink → KV sink locked as the guaranteed path; DLX documented as optional — must-resolve-now, plan correctly resolved it
- `KvDeadLetterStore` default injection — does the plan own `WatchableKv` or pull from `@netscript/kv` lazily? → plan locks lazy `getKv()` on first use, injected constructor option preferred (AP-11 ✓). No latent decision.
- `PostgresDeadLetterStore` schema migration timing — does `ensureSchema` run on every queue construction, or once at adapter boot? → plan implies once-on-construction, mirrors existing `createSchema` style (`postgres.adapter.ts:294-318`). No rework risk.
- `MemoryQueueAdapter` default store: plan introduces a tiny in-memory `DeadLetterStorePort` impl in `testing/` — additive, not a production default. No rework risk.
- `QueueOptions.deadLetterStore?` placement: added at the right layer (port), threaded through factory — no rework risk.

No decision left unflagged that would force rework if deferred. Sweep is clean.

## Remaining risks (for IMPL-EVAL, not blocking PLAN-EVAL)

1. **KvPolling refactor regression** — highest-impact file. Plan mitigates with default `KvDeadLetterStore` preserving the exact `['queue:dlq', queueName, failedAt, messageId]` layout and a regression test before/after. Verify byte-for-byte during IMPL.
2. **AMQP/DenoKv double-handling** — plan correctly limits DLQ write to explicit `nack({requeue:false})` only, leaving Fedify retry untouched. Confirm during IMPL no implicit DLQ path is added on max-attempts for these two (Fedify owns retry; NetScript only owns terminal sink).
3. **jsr slow-types on generic methods** — plan mitigates with explicit `Promise<DeadLetterRecord<T>[]>` annotations on every port method. Verify during IMPL via the actual jsr-audit pass.
4. **Scope creep into idempotency/applied-keys** — explicitly out of scope; DLQ records carry `messageId` only. Watch during IMPL that no dedup key handling sneaks in (sibling slices own that).

## Files written this session

None (read-only PLAN-EVAL per protocol — "Do not evaluate code, run the implementation gate set, or comment on slices that do not yet exist").

## Changes

None to the repo. The verdict lives in the PR comment per output_mode=pr-comment contract.

## Validation

- Research spot-check: 14 file:line citations re-opened on real tree, all match.
- Plan vs gate matrix: enumerated every required Arch-2 fitness gate against plan.md.
- Open-decision sweep: 5 candidate deferred decisions examined; none unflagged.
- Slice sizing: 8 slices, well under the < 30 cap; each has proof + gate + files.

## Responses to review/issue comments

None (separate-session protocol; no prior PLAN-EVAL comment to update).

## Remaining risks for IMPL-EVAL

Listed above (KvPolling regression, AMQP/DenoKv double-handling, jsr slow-types, scope creep). None block PLAN-EVAL PASS once Box 6 is expanded.
