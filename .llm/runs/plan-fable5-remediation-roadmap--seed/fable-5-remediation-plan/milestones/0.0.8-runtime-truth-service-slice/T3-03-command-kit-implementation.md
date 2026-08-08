# feat(service): no supported way to write a production command — transaction, expected version, idempotency, audit and outbox are hand-rolled in every generated app — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T3-03 · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice") ·
**Labels:** `type:feat` `area:service` `area:database` `area:cli` `area:telemetry` `priority:p1`
`status:triage` · **Depends on:** T3-01 (RFC-B ratified), T3-02 (where the command file lands)

## Summary

Everything a consumer needs to change business state correctly exists in the framework and nothing
composes it: `withTransaction` has zero callers, idempotency lives only inside the worker runtime,
and there is no outbox, audit row, expected-version condition, or command span anywhere. Generated
services write state with a bare ORM call, so the first production requirement a product hits —
"do not apply this twice, record why it changed, and tell the rest of the system" — is invented per
app. This issue implements the seam ratified by RFC-B and proves it by generating a representative
**non-CRUD** command that writes business state, an audit row, an outbox row and an idempotent
receipt atomically.

## Evidence

- `packages/database/mod.ts:128` — `withTransaction` exported, documented at
  `docs/site/reference/database/index.md:52`, **zero callers** across `packages/`, `plugins/`,
  `docs/`. `$transaction` appears in no scaffold template and no services-sdk page.
- `packages/cli/src/kernel/assets/service/routers/v1.ts.template:25-53` — generated writes are
  single delegate calls with no transaction and no version condition.
- `packages/plugin-workers-core/src/ports/worker-idempotency-port.ts` — `claim`/`markApplied`/
  `release` exists for worker deliveries, KV-backed
  (`src/stores/kv-worker-idempotency-store.ts`), and cannot join a database transaction.
- `grep -rln "outbox"` over `packages/`, `plugins/`, `docs/` → no match; no audit-record primitive.
- `packages/telemetry/src/attributes/helpers.ts` — job/saga/execution attribute helpers exist, no
  command vocabulary; `src/attributes/spans.ts:45-46` — `rpc.client`/`rpc.server` only.
- `packages/contracts/src/application/contract-primitives.ts:21-52` — the six shared error codes
  contain no conflict code, so optimistic-concurrency failure has no declared representation.
- Wave-6: R3 (billing, the only GO-grade run) owns its entire command layer in app space and needed
  two evaluator `FAIL_FIX` rounds before scheduled state actually advanced; its relational
  `trigger_events`/`job_execution_history` projections were empty while authority lived in KV. R2
  built an app-owned retry/compensation executor and never adopted `plugin-sagas`
  (`research/wave-6-runs.md` §R2/§R3, X14).

## Current surface

A handler receives `ctx.db`, `ctx.principal` and `ctx.traceHeaders`
(`packages/service/src/builder/service-builder-impl.ts:259-282`) and is on its own from there. There
is no unit-of-work object, no receipt store, no side-record buffer, no relay, and no way to express
"apply only if the row is still at version N" other than a read-modify-write race. `IsolationLevel`
and `TransactionOptions` exist (`packages/database/ports/database-client.ts:59-77`) and are never
selected. Multi-commit work has an owner (`sagaCompensate`,
`packages/plugin-sagas-core/src/public/mod.ts:43`); single-commit work has none.

## Target contract

RFC-B's kit, shipped as ratified: a `UnitOfWorkPort` with published `UnitOfWorkCapabilities` and a
Prisma adapter over the existing `withTransaction`; `expectVersion` lowering to a conditional update
with an affected-row check and a **typed** conflict error added to the shared error map; an
idempotency receipt keyed by `(scope, commandName, idempotencyKey)` and guarded by a canonical
request hash, replaying the stored response instead of repeating the effect and rejecting key reuse
under a different hash; buffered `audit()` and `publish()` writes flushed inside the same commit; a
generated outbox relay worker job that delivers at-least-once with a dedupe key; a `command` span
plus `createCommandAttributes` carrying the same `correlationId` written into the audit and outbox
rows; and a fault-injection conformance suite with named seams. Stores that cannot provide
same-commit side records refuse composition at build time with a message naming the store, rather
than degrading silently.

The generation half: the CLI emits one representative non-CRUD command in the generated project — an
operation that is not create/read/update/delete on a single row, that carries an idempotency key,
that asserts an expected version, and that commits business state + audit + outbox + receipt in one
transaction — plus its relay job and its tests.

## Acceptance

- [ ] `@netscript/service` exposes the command kit on a documented subpath with `deno doc --lint` clean.
- [ ] A Prisma unit-of-work adapter delegates to `withTransaction` and selects an isolation level.
- [ ] `UnitOfWorkCapabilities` is public and read by composition, not by prose.
- [ ] The shared error map declares the concurrency-conflict code used by `expectVersion`.
- [ ] A version mismatch returns a typed, contract-declared error, never a 500.
- [ ] A replayed idempotency key returns the first response and produces no second effect.
- [ ] Key reuse with a different request hash returns a typed conflict.
- [ ] Audit and outbox rows are absent after a fault injected before commit.
- [ ] The generated relay redelivers an unpublished outbox row after a publish fault.
- [ ] The `command` span carries the documented attributes and the audit/outbox `correlationId`.
- [ ] A command requiring same-commit side records refuses to compose on a KV-only store.
- [ ] The generated project ships a non-CRUD command using the kit end to end.
- [ ] Removing the kit from that command makes the conformance suite fail.
- [ ] The generated project passes check, lint, fmt and test with no `any` and no `as unknown as`.
- [ ] `gate:e2e` — scaffold runtime E2E exercises the command and observes the relay publish.

## Boundaries

Do not duplicate: **T3-01/RFC-B** (this implements it; it does not re-ratify it); **T3-02** (service
folder placement); **#742** (saga definition versioning); **#884**/**#885** (org-aware authorization
contracts and the auth conformance kit — the kit consumes `Principal` and never decides
authorization); **#1332** (DB-schema-first docs); **#1263** (defined-404 defect in the CRUD template);
**#1326**/**#1329** (stream producer durability and SSE envelope — the relay may publish to a stream
but does not change stream semantics); **#1280** (backing-service health, blocked upstream); **#1278**
(type-soundness inventory — this issue must satisfy it, not restate it). Explicit non-goals: no
billing/ledger/money vocabulary, no event-sourcing runtime, no audit taxonomy, no ORM abstraction, no
distributed-transaction emulation, and no exactly-once delivery claim.

## Docs/consumer proof

A services-sdk how-to that replaces the hand-rolled pattern with the kit and type-checks against the
published export map; the generated non-CRUD command as the executable reference; and a measured
Wave-7 row showing an unfamiliar agent either using the generated command path or recording an
explicit rejection. The negative proof is the load-bearing one: deleting the kit from the generated
command must turn the suite red.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Pack T3 of the Fable-5
remediation plan (`SYNTHESIS.md` §4); source item **H** in `research/preplan-package.md`, evidence
from `research/wave-6-runs.md` and `research/repo-audit/services-sdk.md`. Checked against
`research/github-board-open.md` §7 — no existing owner. Draft only; no board mutation performed.
