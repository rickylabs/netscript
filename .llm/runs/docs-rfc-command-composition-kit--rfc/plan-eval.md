# PLAN-EVAL — docs-rfc-command-composition-kit--rfc (RFC-B, PR #1389)

## CYCLE 2 — VERDICT: **PASS** (PR vocabulary: APPROVED) — 2026-08-08

Evaluator: same owner-designated Fable 5 · high session as cycle 1. Evaluated: RFC @ remediation
commit `c98c08ada` (branch HEAD `6c2043d91`), updated research/plan/worklog/drift/final-handoff.
Verification: section-level re-read of every finding anchor against the amended text plus the
handoff's evidence table (author's Prisma 7.8 `Prisma.TransactionClient` probe accepted with the
worktree `Omit` spelling verified at L802-811).

### Mechanical re-evaluation F-B1…F-B7

| # | Cycle-2 status | Evidence (amended RFC) |
| --- | --- | --- |
| F-B1 | **RESOLVED — exceeds the asked bar** | Normative per-provider claim table (L935-949): PG `INSERT … ON CONFLICT DO NOTHING RETURNING` + indexed `SELECT`, transaction-local `set_config('lock_timeout')` with save/restore, `55P03`→busy, `40001` retryable; MySQL savepoint + **only** 1062 recovered (`INSERT IGNORE` explicitly forbidden with the warning-downgrade reason), session `innodb_lock_wait_timeout` save/restore with failed-restore-discards-connection; MSSQL `UPDLOCK, HOLDLOCK` on the named generated unique index + `SET LOCK_TIMEOUT` restore, `MERGE`/catch-2627 rejected. Busy is callback-terminal; every timeout path rolls back. Conformance item added (L1553). Primary-source citations appended |
| F-B2 | **RESOLVED** | Ownership completed: `@netscript/service/commands/relay` owns decoded delivery/sink/supervisor (L309); database owns raw rows + lease/token/release types; "the only cross-package edge is `service → database`" with the direct-dependency declaration requirement stated (L1333, L1600); stage split 5a/5b reflects it |
| F-B3 | **RESOLVED** | §"Decision: do not wrap `@netscript/queue` in v1" (L1375-1390) + rejected-alternatives entry (L1837): reuses the verified lease algorithm/test pattern, not queue's delete-on-ack/DLQ/public-loop contract or runtime schema creation; a queue runtime-DDL reconciliation child is proposed for maintainer filing before any code sharing |
| F-B4 | **RESOLVED** | Execute-as-new law stated where identity is defined (L866-867, L983) + negative conformance items 5 and 6 (same key/changed scope; same key/renamed command; changed definitionVersion = mismatch) (L1543-1545); scope determinism requirement mirrors fingerprint's |
| F-B5 | **RESOLVED** | Capability matrix: MySQL "exactly those four selectable values; current lower adapter's exported `SNAPSHOT` and unchecked SQL interpolation must be fixed before conformance" (L1018); Stage 6 cannot pass while `prisma-adapter-mysql` exports `SNAPSHOT` or interpolates unvalidated tokens (L1031-1033); #1293 correctly kept adjacent |
| F-B6 | **RESOLVED** | `CommandTransactionClient = Omit<Prisma.TransactionClient, …>` generator-owned with engine-module re-export (L802-811); in the `db command-store add` deliverables (L1641); `withTransaction` root-client repair retained |
| F-B7 | **RESOLVED (all eight)** | (a) stage archetypes corrected to A4 for contracts/service (L1690-1696); (b) locked decision 10 pins #1350's literal-preserving `ContractBuilder` spelling; (c) vocabulary unified on `claimed` (L468); (d) frontmatter footnote: 0.0.6 = ratification-only (L24); (e) Stage 5 must correct `WorkerIdempotencyPort`'s "exactly-once-effective" doc comment (L1350); (f) SQLite future shape `selectableIsolationLevels: []` + `defaultIsolation: 'Serializable'` folded into FCP Q2 (L1020) — with the improved `selectable`/`default` capability split resolving the refusal-law wart; (g) generator renamed `db command-store add` with the `db init` distinction stated (L785-787); (h) FCP Q3 + locked decision 11 acknowledge the messaging/saga attribute asymmetry and propose the separate vocabulary cleanup |

### FCP-question adjudication (amended set of 4)

All four are policy-only and safe to defer; the three cycle-1 rework-forcing gaps are now resolved
design inputs, not FCP items — exactly the required repair shape.

### Residual advisories (non-blocking)

1. The `selectableIsolationLevels`/`defaultIsolation` split is an improvement over cycle 1's
   reviewed shape — carried into the store capabilities without breaking any law; no action.
2. PR labels (`type:docs` + skips) remain honest for this branch: the diff is RFC + run artifacts
   only (changed-file audit confirms no package/lock change).

**PASS.** One-store transaction, receipt, relay, capability-honesty, and refusal laws all
preserved; the plan is implementable without guessing. Hard-stop lifted for stages 0–2 pending
owner ratification and the root-owned Qwen adversarial acceptance pass. Accepted content SHA of
record: **`c98c08adabbd992a557ff7c596deae68b9c9cd62`** (branch HEAD
`6c2043d915ea2afbe7020bbb88d90ea4d0ea16a5`).

---

# Cycle 1 record (2026-08-08, superseded by the PASS above)

| Field | Value |
| --- | --- |
| Verdict | **FAIL_PLAN** (PR-comment vocabulary: CHANGES_REQUESTED) — cycle 1 of 2 |
| Evaluator | Claude Fable 5 · high — owner-designated cross-family PLAN-EVAL authority (in-turn owner directive, 2026-08-08), separate session/family from the generator (Codex, per run supervisor.md) |
| Route override | Lane-policy Minimax route superseded by explicit owner direction (this Fable session evaluates; OpenRouter/OpenHands/Qwen prohibited here; root owns the later Qwen pass) |
| Evaluated | RFC `rfcs/0000-command-composition-kit.md` @ `ad16c42f8` (branch HEAD `62304176f`), run artifacts, PR #1389, live board (#1361–#1364, #1350, #1293, #1278, #1362), worktree source at baseline `fac9e339042c` |
| Delegations | Workflow `wf_b3416478-edf` (script committed pre-execution on the seed-run branch): `dd:rfc-b-semantics`, Opus 5 · xhigh, read-only/return-only; evidence reviewed and adopted by this evaluator |

## Plan-gate checklist walk

| Box | Status | Evidence |
| --- | --- | --- |
| Research present and current | ✓ | 20 baseline findings (R1–R20), several execution-verified (probe `deno check` runs, `deno doc` on the locked oRPC contract builder); carried proposal adjudicated row-by-row with 12 rejections |
| Decisions locked | ✓ | L0–L13 with rationale; refusal boundary and not-open list are exemplary honesty |
| Open-decision sweep | **✗** | The four FCP questions are individually safe (adjudicated below), but the sweep found **three undeclared decisions that force rework if deferred** (Findings 1–3) — automatic unchecked box |
| Commit slices | ✓ | Docs-run slices evidenced; implementation staged 0–9 with owning archetypes and gates |
| Risk register | ✓ | Present with mitigations |
| Gate set selected | ✓/− | Conformance suite (17-item matrix + fault seams) is the strongest artifact in either RFC; two gaps folded into Findings 4–5 |
| Deferred scope explicit | ✓ | Non-scope + not-open lists precise |
| jsr-audit | ✓ | Per-subpath publish-consequence table with gates; `@standard-schema/spec` direct-dependency requirement verified correct |

## Verdict: FAIL_PLAN — findings (severity-ranked)

**The core promise is verified honest and internally consistent**: one store transaction, explicit
`TTx` (no ambient state — grep-verified against the repo's existing ALS usage), DB-constraint
idempotency, at-least-once relay with stable identity, no hidden migrations, no exactly-once. The
failures are three boundary decisions taken silently plus citable corrections.

### F-B1 (critical) — `claimReceipt`'s unique-violation-inside-transaction algorithm is unspecified

The design correctly rejects check-then-act, but never says how a losing insert becomes
`{kind:'replay'}` **without aborting the enclosing transaction**. On PostgreSQL a unique
violation poisons the transaction (25P02) — a savepoint or `INSERT … ON CONFLICT DO NOTHING
RETURNING` + follow-up `SELECT` is mandatory; SQL Server (error 2627, statement-level) and MySQL
(`INSERT IGNORE`) diverge. The RFC grants adapter-algorithm freedom only for the **relay** claim,
and `callbackAttempts: 'one'` + "call `store.transaction()` once" forbids the retry-outside
strategy. The bounded `busy`/`retryAfterMs` path likewise needs provider lock-timeout mechanics
(`SET LOCAL lock_timeout` / `innodb_lock_wait_timeout` / `SET LOCK_TIMEOUT`) — unmentioned.
**Repair:** add a normative "receipt claim algorithm" subsection (per-provider strategies +
lock-timeout mechanics + conformance items proving no transaction poisoning), or add it as an
explicit FCP question with the provider strategies enumerated. Deferring silently reworks Stage 3.

### F-B2 (critical) — Relay-port package ownership is a hole that can invert the dependency arrow

`CommandOutboxRelayStore`/`CommandOutboxSink`/`CommandOutboxDelivery` have **no row** in the
ownership table; `CommandOutboxDelivery.payload: CommandJson` + `trace?: CommandTraceContext`
reference **service-owned** types; Stage 5 says archetype A3/A5 while the child-issue row says
`area:service, area:database`. Placing the relay ports in `database/commands` forces
database→service — the cycle the RFC's own L3 forbids. **Repair:** add the ownership rows and
decide the package now (e.g. relay store contract in `@netscript/database/commands` with the
delivery value types moved to a shared neutral location, or relay wholly in
`@netscript/service/commands` with database providing only the store adapter). Also state
explicitly that `service → database` is a **new** package edge and `packages/service/deno.json`
must declare it (verified absent today).

### F-B3 (major) — Reuse-vs-reinvent against `@netscript/queue` is undecided and unrecorded

`packages/queue/adapters/postgres.adapter.ts` already implements Postgres claim
(`FOR UPDATE SKIP LOCKED`, :373-396), visibility-timeout lease, redelivery, max-attempts, and a
dead-letter store — the exact mechanics the relay re-derives. The rejected-alternatives list has
no entry for it (A7 wrap-don't-reinvent; AGENTS.md rule 3). The *insert* side genuinely cannot
reuse the queue (it must join the business transaction); the *claim/lease/DLQ* side has no such
constraint. **Repair:** add the rejected-alternative entry with a real decision — reuse the
queue's claim/lease/DLQ mechanics behind the relay store port, or record precisely why not.
Related (same section): the queue's `ensureSchema()` issues runtime `CREATE TABLE IF NOT EXISTS`
(:319-369; dead-letter store :160-172) — the very pattern this RFC's no-hidden-migrations rule
forbids. Scope the rule to the command kit explicitly or call for the reconciliation issue;
otherwise the RFC ships doctrine a sibling package already violates.

### F-B4 (major) — Scope instability silently defeats idempotency; no negative test

`scope({input, actor})` is application code inside the receipt unique key. A scope that varies
across retries of the same intent lands the same idempotency key in a **different** receipt row —
the handler runs again and no law fires (key-reuse law is keyed on the full receipt key). Prose
says "must not vary" with no enforcement; conformance item 4 covers only same-key/different-hash.
**Repair:** add negative conformance items — same key + different scope, and same key + renamed
command — asserting the outcome the RFC intends (execute-as-new is the honest answer; say it),
plus a determinism requirement on `scope()` mirroring `fingerprint()`'s.

### F-B5 (medium) — MySQL `SNAPSHOT` is an undeclared prerequisite of "conforming v1 target"

`packages/prisma-adapter-mysql/src/adapter.ts:476-481` declares `'SNAPSHOT'` in its isolation
union and `:370-372` interpolates the level into SQL with no allow-list at the execution point —
an isolation MySQL cannot honor. Under the RFC's own isolation-refusal law the MySQL command
store must publish a `supportedIsolationLevels` that contradicts the type one layer down.
**Repair:** name this fix in Stage 6's exit condition (and note #1293 adjacency remains correct —
this is a different defect than #1293's surface work).

### F-B6 (medium) — `PrismaTransactionClient` does not exist; the generator must own it

The flagship example imports `PrismaTransactionClient` from `@database` — zero repo hits; the
`@database` alias maps to the root-client surface, and the `db command-store init` deliverable
list does not include emitting or typing the transaction-client type. **Repair:** add the
transaction-client type emission (or its documented derivation, e.g.
`Parameters<PrismaClient['$transaction']>[0]` equivalent) to the generator's deliverables, and
keep the already-correct requirement to fix `withTransaction()`'s root-client assertion.

### F-B7 (minor, batch)

(a) Stage-1 archetype: contracts is A4 per doctrine `06-archetypes.md:375`, not A1. (b)
`commandBaseContract` needs the literal-preserving explicit annotation — state that it must reuse
#1350's spelling or it re-introduces the erasure the RFC depends on #1350 to fix. (c) Vocabulary:
`CommandExecution.idempotency: 'committed'` vs telemetry `'claimed'` — one word per state.
(d) Frontmatter `target-milestone: 0.0.6` is the *ratification* milestone while children sit in
0.0.8 and blocking #1350 in 0.0.7 — add one clarifying sentence so the frontmatter is not read as
an implementation date. (e) `WorkerIdempotencyPort`'s doc-comment claims "exactly-once-effective"
(`plugin-workers-core/src/ports/worker-idempotency-port.ts:30`) — the exact claim-window this RFC
rejects; require its correction in Stage 5's docs. (f) Fold into FCP Q2: Prisma rejects
`isolationLevel` on SQLite entirely, so a future SQLite store's `supportedIsolationLevels` would
be `[]` and the refusal law would refuse `Serializable` — the one level SQLite always provides.
(g) `db command-store init` collides with the existing `db init` noun — name the sub-noun choice
deliberately. (h) Telemetry asymmetry: existing vocabulary already emits `netscript.correlation.id`
and `netscript.idempotency.key` (`attributes/messaging.ts:15`, `attributes/saga.ts:12`) while
command spans exclude both — FCP Q3 should acknowledge the operator-experience asymmetry and the
existing-precedent cleanup question.

## FCP-question adjudication

Q1 (idempotency default), Q3 (correlation telemetry, with F-B7h noted), Q4 (retention): **safe to
defer** — typed both ways, policy-only. Q2 (SQLite timing): safe to defer **after** F-B7f is
folded in. The three genuinely rework-forcing questions (F-B1 claim algorithm, F-B2 relay
ownership, F-B3 queue reuse) are **missing from FCP** and must be resolved in the RFC text or
added as explicit FCP questions before FCP closes.

## Required for PASS (cycle 2)

Resolve F-B1–F-B3 in the RFC text (or as enumerated FCP questions with the option space fully
specified); add F-B4's negative conformance items; land F-B5/F-B6 as stage-condition amendments;
F-B7 as a batch edit. No structural redesign is requested — the transaction/receipt/relay laws,
capability honesty, and refusal boundary all survived adversarial verification.
