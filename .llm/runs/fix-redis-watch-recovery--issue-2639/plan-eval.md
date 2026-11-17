# PLAN-EVAL — fix-redis-watch-recovery--issue-2639

- Evaluated head: `94a7bb380c92f44d028fb4d21788601d47131cd5` — branch `fix/redis-watch-recovery`, clean tree, base `origin/main` `b0eb079575968e843b781579673c9fe2ae250e07`.
- Plan evaluator (requested → observed): feature PLAN-EVAL primary route GLM 5.3 provider default → observed identity GLM 5.3 via OpenCode Go, provider default, options {}. Live matrix (`agentic:matrix --role plan_eval --tier feature`) confirms primary GLM 5.3 provider default, fallback Fable 5.1 low (not used). Fallback reason: none.
- Generator: Codex gpt-6.1-sol/xhigh (OpenAI family). Vendor family and session are independent from the evaluator; no substitution was made.
- Date: 2026-11-16. Separate-session review per `.llm/harness/evaluator/plan-protocol.md` + `gates/plan-gate.md`.
- Method: read-only source inspection of the operational topic worktree plus committed red-test evidence; no containers started (existing evidence accepted per brief), no production/test modifications, nothing committed.

## Checklist results

| Plan-Gate item                           | Result | Evidence / location |
| ---------------------------------------- | ------ | ------------------- |
| Research present and current             | PASS   | `.llm/runs/fix-redis-watch-recovery--issue-2639/research.md`; re-baselined against fresh `main` `b0eb07957`. All load-bearing findings spot-checked against the tree (see below). |
| Decisions locked                         | PASS   | `plan.md` "Locked recovery protocol": single lease owner retained, autoResubscribe disabled only for the dedicated subscriber, explicit SUBSCRIBE ack before reread, 30s cancellable recovery bound, generation fences, queue terminal failure, existing error hierarchy exported with JSDoc, no new settings/dependencies. Rationale stated per decision; state machine (connected → recovering → resynchronizing/connected → failed/closed) named in `worklog.md` ## Design. |
| Open-decision sweep                      | PASS   | `plan.md` "Open decisions: None", each deferred item classified (30s + native window, no public retry option, snapshot repeat semantics, one-time ready, abort/close precedence, prefix discovery unchanged). Evaluator-run sweep found no rework-forcing open decision (see below). |
| Commit slices (< 30, gate + files each)  | PASS   | S1 = 7 files (six run artifacts + `packages/kv/tests/redis-watch-recovery_test.ts`) — landed at `94a7bb380` with per-slice PR comment; S2 ≤ 17 files, enumerated in `plan.md` "Concrete file groups"; S3 ≤ 14 files. Each names what it proves and its proving gate (real Redis outage suite + scoped wrappers + quality:gate/JSR gates). |
| Risk register                            | PASS   | `plan.md` "Risks and deferred scope": seven risks with mitigations (ack-before-reread, serialization + identity fences, cancel-on-close/no-leases, current-state reread incl. deletes, bounded retry + typed queue failure, JSDoc/doc-lint for new exports, real-server baseline against fake-only proof). |
| Gate set selected                        | PASS   | ARCHETYPE-3 (runtime/behavior) folding Integration-2: static scoped check/test/lint/fmt + publish dry-run; fitness via quality:gate (quality:scan + arch:check, F-1..F-19); runtime required → direct real Redis outage suite + full KV suite against isolated owned Redis; consumer gates required (exports change) → consumer/prose/corpus/publish freshness named. Full `scaffold.runtime` N/A justified: no scaffold output, plugin scaffolding, DB wiring, Aspire helper generation, or publish-shape change; PR carries `ci:skip-e2e` + `ci:skip-scaffold` consistent with that. |
| Deferred scope explicit                  | PASS   | Prefix discovery, Redis Streams, saga transport changes, new abstractions, dependency/settings changes — all explicitly deferred in `plan.md` and PR body. No file under `packages/plugin-sagas-core/src/transports/` in the diff. |
| jsr-audit surface scan (package wave)    | PASS   | Planned public surface = existing `KvError`/`KvConnectionError`/`KvClosedError` (`packages/kv/application/errors.ts`) re-exported from `packages/kv/mod.ts` + `packages/kv/redis.ts` with JSDoc. No slow types possible (explicitly typed classes, explicit constructors; verified in source). Surface risks named: symbol JSDoc/doc-lint and publish dry-run assigned to S2/S3. |

### Load-bearing research spot-checks (all verified against tree)

1. `packages/kv/adapters/redis/connection.ts:127-152` — `ensureSubscriber()` has no `status === 'end'` handling (primary does at :94-97). Verified.
2. `connection.ts:298-301` — `retryStrategy` returns `null` after 5 attempts (100–1000 ms delays). Verified.
3. `connection.ts:269-271` — subscriber `error` handler only logs. Verified.
4. `packages/kv/adapters/redis.adapter.ts:530-535` — watch loop awaits `queue.next()` with no failure path; `packages/kv/adapters/redis/watch-batch-queue.ts` has no terminal failure state. Verified.
5. Error classes exist but are not exported from either entrypoint (`mod.ts`, `redis.ts`), while `getKv()` — publicly exported — throws `KvConnectionError` from `packages/kv/application/shared.ts:149`. Export rationale is contract-grounded, not cosmetic. Verified.
6. `@std/async@1.5.1` `RetryOptions.signal` and `delay({ signal })` exist — native AbortSignal cancellation of retry/delay is real. Verified via `deno doc`.
7. ioredis `^5.11.1` (pinned): `readyHandler` sets status `ready` **before** automatic resubscribe, and `autoResubscribe` is an existing option — the "await SUBSCRIBE acknowledgement, not raw ready" decision and the "disable autoResubscribe only for the dedicated subscriber" decision are both grounded in the pinned dependency. Verified in the installed ioredis 5.11.1 source/types.
8. Existing tests cover shared-subscription leases, independent releases, discovery and startup consistency, but no real outage — the only outage coverage is the new red test. Verified.
9. Baseline red evidence: three distinct failures on unchanged main product source — restart-after-end iterator hang (TimeoutError), leave-down case raising `DOMException` (deadline) instead of `KvConnectionError` within 35 s, and short-gap `CLIENT KILL TYPE pubsub` + `SET` value never reported after native reconnect. Structured raw reports (0 passed / 2 failed, then 0/1) reviewed; no mock backend; test-owned containers removed by exact identity and unique label, final label scan empty as recorded in the PLAN comment.

## Acceptance coverage (issue #2639)

| Issue acceptance box | Covered by | Verdict |
| -------------------- | ---------- | ------- |
| After subscriber end, next reconnect restores existing watches; proven by a real stop/restart test failing on main | `packages/kv/tests/redis-watch-recovery_test.ts` (recover=true case): real `SHUTDOWN NOSAVE` → asserts subscriber `status === 'end'` → restart with PING readiness → existing iterator must deliver `['delete', null]` → a subsequent live write must deliver through the restored subscription. Red on main. | COVERED |
| After any reconnect, a watch emits the current value of keys that changed during the gap | Short-gap case: atomic native MULTI `CLIENT KILL TYPE pubsub` + `SET` writes storage before any new subscription can be accepted; iterator must emit the gap value; also covers the ended-then-restart reread (delete/null). Red on main. | COVERED |
| Unrecoverable watch rejects with a typed KV error and does not hang | recover=false case: Redis left down; pending `next()` must reject with `KvConnectionError` within 35 s. Red on main (deadline `DOMException` proves the iterator hangs). Plan's 30 s recovery bound + native window (~1.5 s observed within the 8 s end-wait) fits the 35 s test bound. | COVERED |

## Feasibility review (requested checks)

- **Race/cancellation feasibility:** feasible. `RetryOptions.signal`/`delay` signal support verified; design uses one shared recovery controller with its own abort (cancelled by adapter close or zero remaining leases), generation identity fencing stale callbacks and late results, listeners installed before SUBSCRIBE ack, messages buffered through recovery, and serialization tail never held across fresh-connection retry or rereads so release/cancel stay prompt.
- **Primary connection timing:** addressed precisely — snapshot rereads reuse `getMany` under bounded retry on the same recovery signal, so a still-reconnecting primary client cannot falsely end a watch; terminal failure occurs only when the 30 s budget is exhausted.
- **Ordering semantics:** precise — suppress only snapshot entries for keys touched by live messages during the read; queued messages retain delivery; never compare opaque Redis versionstamps; delivery is at-least-once current state (may repeat unchanged values), missing keys delivered as `delete`/null. Matches the red test expectations exactly.
- **Sibling leases:** live Symbol lease identities retained; one channel subscription restored once, shared by all leases; each lease keeps its own queue, resync and typed failure; releasing one lease never removes another's subscription (existing tests retained; S2 adds recovery-context proof).
- **No hang at terminal end:** queue terminal failure wakes `next()` and rejects with the original typed error; failures interrupt debounce; abort completes cleanly; explicit adapter close rejects waiting watches with `KvClosedError` before closing sockets; ended/reconnecting sockets disconnect rather than awaiting a QUIT that cannot complete; no background unhandled rejection.
- **Deadline math:** 30 s recovery budget bounds connect/auth/readiness, subscription restoration and snapshot retries together; test bounds (10 s post-restart delivery, 35 s terminal failure) are consistent with it plus the native reconnect window.

## Open-decision sweep (evaluator-run)

No unflagged decision that could force rework was found. Items checked and resolved by locked invariants: recovery triggers per case (native end vs short native reconnect — both named), second-outage generation invalidation, new watch acquires joining the shared controller during recovery, release racing resubscribe (generation fences + serialized acquire/release ordering), unsubscribe on dead sockets during terminal paths (disconnect-not-QUIT + phase states), abort-vs-close precedence (abort wins for already-aborted watches), prefix watches riding the shared subscription lifecycle while their SCAN polling self-heals discovery (verified `redis.adapter.ts` watchPrefix), and never-started lazy watches needing no close notification.

## jsr-audit surface scan

Package wave (`packages/kv`). Planned surface: three existing error classes re-exported from two existing entrypoints with JSDoc. No slow-type risk (explicitly typed classes; no inference introduced by re-export). Named risks and slices: symbol JSDoc + `deno doc --lint` (S2/S3), publish dry-run (S3), `application/errors.ts` already inside the publish include glob. One note: `errors.ts` module doc says "Internal error helpers" — update that wording when the classes become public contract so the published docs match the surface.

## Debt

Open `packages/kv` debt (AP-1 god test file `bridge_test.ts`) is not deepened: new coverage goes to `redis-watch-recovery_test.ts` plus one focused lifecycle test file, not `bridge_test.ts`. No new doctrine violation identified: timing stays in `@std` primitives inside adapters, logging via the package logger, no `console.*`, no new folders/ports/globals, each concern stays in its existing owner file. No new debt entry required.

## Verdict

`PASS`

All eight Plan-Gate boxes are checked; all three issue acceptance boxes are covered by committed, red-on-main tests; the design is grounded in the pinned dependencies and existing source. Implementation may begin (S2). Feature-tier loop policy: max 2 cycles — this is cycle 1 with verdict PASS.

## IMPL-EVAL watch-points (non-blocking, from this review)

1. Release during a failed/recovering subscription must degrade to local bookkeeping — a rejecting UNSUBSCRIBE in the generator's `finally` must not mask the typed error already delivered to the consumer.
2. A late recovery generation must not re-subscribe a channel whose final release already completed, and unsubscribe failures on dead sockets must not hang the serialization tail or surface as unhandled rejections.
3. Snapshot synthetic events must keep `previousValues`/`knownVersions` bookkeeping consistent with live messages (previousValue continuity, no opaque-versionstamp comparisons).
4. Confirm prefix-watch behavior under the shared lifecycle change: discovery still self-heals via SCAN polling, and unrecoverable outages fail prefix queues with the same typed error rather than hanging.
5. File-size fitness (F-1): recovery logic lands in existing owner files (`watch-subscriptions.ts`, `connection.ts`, `watch-batch-queue.ts`); if any approaches the size lint, split within the same concern rather than growing a monolith.
6. Whether the connection-establishment series repeats inside the 30 s budget (the stronger reading, consistent with "bounds … retries together") should be settled in code so a server returning late-but-within-budget still recovers; both readings satisfy the acceptance bounds, so this is implementation discretion, not a plan gap.
