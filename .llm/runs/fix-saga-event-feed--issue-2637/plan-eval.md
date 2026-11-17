# PLAN-EVAL — fix-saga-event-feed--issue-2637

- Plan evaluator session: fresh PLAN-EVAL session, 2026-11-17 (session identity held by the dispatching supervisor; kept out of this artifact per scrub policy)
- Run: fix-saga-event-feed--issue-2637
- PR: #2646 (draft), head 224e83706371a1aed813b6962a9583da1a68639a, branch fix/saga-event-feed, base origin/main b0eb079575968e843b781579673c9fe2ae250e07 (merge-base equals base; branch diff verified as 7 run artifacts + 1 committed HTTP test only — product source still equals main)
- Surface / archetype: Archetype 3 (runtime/behavior) — ordered, retained, multi-reader saga event journal
- Scope overlays: KV integration (Archetype 2) + plugin package (Archetype 5, thinness law)

## Route and independence attestation

- Requested: feature-tier PLAN-EVAL primary GLM 5.3 at provider default, via OpenCode Go; fallback Fable 5.1 low.
- Observed: GLM 5.3, provider default, OpenCode Go transport, fresh session; fallback unused, no failure evidence existed.
- Live pinned matrix (read-only documented invocation, Deno 2.9.7 via mise): `agentic:matrix --tier feature --plan-evaluator` → "GLM 5.3 provider default → Fable 5.1 low, max 2 roundtrips; repair fixable failure in flight at round 2; re-steer same evaluator session". Matches supervisor.md and the observed route.
- Generator: owner-selected OpenAI Codex gpt-6.1-sol/xhigh — separate session, different vendor family from the evaluator. No substitution; cycle 1 of 2.
- Tool drift (recorded, not a route change): the pinned matrix's same-session re-steering rule conflicts with this runtime's requirement that every recheck is a fresh delegate; supervisor.md records that drift. Cycle accounting still follows the feature row (max 2 rounds, with authorized in-flight wording repair on a round-2 recheck).

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | research.md exists, baseline named as current main b0eb07957 (verified equal to origin/main); red reproduction executed on unchanged main source; load-bearing claims independently spot-checked (below) |
| Decisions locked                        | PASS   | plan.md §Design points 1–10 with rationale; Archetype-3 checkpoint expectations present (state/lifecycle, ports, constants, identity, delivery guarantee, concurrency, cancellation, diagnostics; clock port explicitly not needed with honest reasoning) |
| Open-decision sweep (evaluator-run)     | PASS   | plan.md §Open-decision sweep declares none rework-forcing; evaluator sweep found no unlisted rework-forcing decision — two wording-level advisories noted under Findings |
| Commit slices (< 30, gate + files each)  | PASS   | plan.md S1–S5 ordered, each names what it proves, proving gates, and file groups; sizes ≤12/≤12/≤10/≤14/≤7 run files, test files <480, adapter files <500 |
| Risk register                           | PASS   | plan.md §Risk register — 12 risks, each mapped to named tests (aggregate value limit, CAS contention, subscribe race, slow reader, overwrite during read, reset/epoch, coalesced wakes, cancellation ambiguity, SSE error framing, custom-KV capability, JSR/folder debt, resource ownership) |
| Gate set selected                       | PASS   | Archetype 3 F1–F19 with KV/plugin overlays; scoped structured wrappers (–unstable-kv), `quality:gate` (quality:scan + arch:check) included, exact doc-lint baselines, JSR dry-run/audit, public type/import tests, release:preflight, docs:accuracy, consumer freshness; real HTTP/native-store behaviors required. Full scaffold.runtime honestly N/A (see below) |
| Deferred scope explicit                 | PASS   | plan.md §Open-decision sweep lists transports files, Redis Streams, general KV watch recovery (#2639, verified OPEN, area:kv), engine/outbox/durable delivery, migration/GC, process/Aspire/scaffold, dependency bumps, broad debt — matches the run's hard scope |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Rubric applied to the PLANNED surface before slicing: canonical SSE type identity moves into an existing 17-line domain vocabulary file with re-exports preserved; no exported Zod implementation, no new domain file or root barrel; adapter TS <500 with cohesive private split provision; zero diagnostic growth against measured baselines (evaluator re-measured: core combined 7, plugin combined 30, matching plan claims); slow-type/surface risk named in the risk register with one slice per named risk |

## Independent verification performed by this evaluator

1. **Red oracles re-executed at branch head** (product source identical to main) through the structured test wrapper: `plugins/sagas/tests/services/event-feed-http_test.ts` → **0 pass / 4 fail / 0 ignored**. Failures map one-to-one to the four issue behaviors: paused concurrent reader times out (destructive consumption), Last-Event-ID reconnect misses consumed events, idle native `list` spy records 4 calls/350 ms, 300 publications retain 300 keys. In-memory native KV only; all handles closed by the test; no external resource started.
2. **Doc-lint baselines re-measured**: `@netscript/plugin-sagas-core` combined 7 (7 private-type-ref, 0 missing JSDoc); `plugins/sagas` combined 30 (30 private-type-ref, 0 missing). The per-entrypoint distributions are retained by the run privately; the plan's zero-new-diagnostics bar is well-defined and matches the measured baseline.
3. **Source claims spot-checked against the tree**:
   - `plugins/sagas/services/src/routers/v1-handlers.ts` subscribe: `kv.watchPrefix(['saga','events'], { signal, pollInterval: 100 })`, per-connection numeric ids, `kv.delete(watchEvent.key)` after yield — the destructive 10-scans/second/client behavior is real.
   - `writeSagaPublishEvent` writes `['saga','events', crypto.randomUUID()]` — random keys, no order.
   - `publishSagaMessage` awaits runtime acceptance before the event write and keeps the `options.writeEvent ?? writeSagaPublishEvent` seam — plan §Design point 9 is accurate.
   - The core contracts file is 742 lines with `SagaSSEEventType`/`SagaSSEEvent` declared there; `src/domain/saga-message.ts` is 17 lines and the domain folder has exactly 14 files — the identity-relocation choice adds no domain cardinality.
   - `WatchableKv.watch(keys, { initial: true })` documents subscribe-first snapshot semantics with an optional `ready` promise on first-party handles — the fixed-head watch design matches the port contract.
   - `DenoKvAdapter.getMany` batches at 10 keys — the facade-reuse claim is accurate.
   - Redis `executeAtomic` runs WATCH → read → check → MULTI → EXEC and publishes watch changes only after a successful commit; `WatchSubscriptions` owns one Redis subscription per channel shared by independent leases — supports the plan's "no hidden process singleton" statement.
   - Memory adapter supports atomic + watch with `ready`/`initial`; `memory-atomic-watch_test.ts` exists.
4. **Native oRPC seams confirmed via `deno doc`** (`npm:/@orpc/server@1.15.5`): `ProcedureHandlerOptions` carries `lastEventId: string | undefined` (plus optional `signal` — currently unused by the subscribe handler, so wiring it is a new use, not a contract change), and `ORPCError` exposes `code`/`status`/`data`/`defined` — consistent with the run's private protocol probe (HTTP 200 already committed, then an error frame). Error-code mapping (400 invalid-cursor / 409 history-lost / 503 unavailable) is therefore native-error-class based, not HTTP-status based.
5. **Cross-references verified real**: issue #2639 (KV watch subscriber recovery) is OPEN, area:kv — deferring general watch recovery there is a coherent boundary; PR #2645 (workers drain) is a separate lane, referenced only as independent context in worklog.md.
6. **Branch safety verified**: `git diff origin/main..HEAD` touches only `.llm/runs/fix-saga-event-feed--issue-2637/**` (7 files) and `plugins/sagas/tests/services/event-feed-http_test.ts`. Transports untouched; no product implementation precedes this verdict.
7. **Release-gate applicability assessed honestly**: the scaffold.runtime class keys on release cuts or scaffold-output/plugin-copy/DB-wiring/Aspire-helper/CLI/publish-shape changes. The planned slices touch core/plugin source, service router wiring, and docs only; the existing `./adapters` entrypoint absorbs the new feed type without publish-map/glob changes, so N/A under the operator's cost policy is consistent with the gate definitions, and the plan carries an explicit drift clause (run one full smoke if reality diverges instead of silently keeping N/A).

## Open-decision sweep (evaluator-run)

No unlisted rework-forcing decision found. Locked items verified as sufficient: ring size and head/slot key layout, one-atomic-commit CAS order, epoch:fenced safe-integer ids never derived from backend versionstamps, live-only vs. afterId replay, ready/heartbeat cursor semantics (heartbeat carries no id), coalescing wake token design, 100-character UUID:decimal cursor syntax, ≤64 CAS retries, per-subscription abort ownership, host-KV ownership, upgrade boundary with no migration scans, sagaName presentation filter after global cursor advancement, and retention windows not per-filter. Deferred decisions (helper split, exact test filenames, error wording) are confined to named file groups and cannot change the public contract or test semantics.

## Issue #2637 acceptance coverage

| Issue box | Covered by |
| --------- | ---------- |
| Two concurrent clients both receive every published event | Red test 1 now failing; S3 turns it green; extended by multi-writer/multi-instance and slow-reader tests (Box1 in plan.md) |
| Publish-order delivery, stable ids, Last-Event-ID replay within retention | Red test 2 now failing; epoch:sequence ids + afterId resume; extended by reconnect/new-instance/overrun/cursor-boundary tests (Box2) |
| Idle feed issues no periodic keyspace scan | Red test 3 now failing (`list` spy 4 calls/350 ms today); fixed-head watch removes SCAN/poll/timer; extended by fixed-key watch instrumentation and actual Redis command observation (Box3) |
| Bounded retention documented | Red test 4 now failing (300 keys); 256-slot ring + head ≤257 keys; large-native-event and exact-slot boundary tests (Box4) + S4 public docs |

## Findings and required repairs (non-blocking; none is a Plan-Gate box failure)

1. **PR body closing keyword (required before ready-merge, owned by the generator/supervisor).** PR #2646's `## Scope` references "Issue #2637" without a closing keyword, so merging will not auto-close the issue — the exact stale-open failure mode the netscript-pr rule exists to stop. Add `Closes #2637` to the PR body when implementation slices land. (Not a plan defect; flagged now because it is the one merge-bar item visible at this phase.)
2. **Epoch-minting wording (clarify when authoring the S1/S2 contract).** plan.md says the epoch comes "from crypto.randomUUID in the adapter" and that empty history "adopts the first append epoch at sequence 0". The only reading consistent with the plan's own multi-adapter-writer and slot-fencing tests is: the first append onto an absent head mints the epoch, and later appends inherit it through the head CAS. Add one sentence pinning that; if per-instance minting were intended it would already fail S2's named tests, so this is wording, not a design hole.
3. **Cross-epoch cursor classification (advisory confirmation).** The locked mapping is: older-than-window/other-epoch/missing-slot → history-lost; malformed/future → invalid-cursor. Ensure S2/S3 tests encode each branch explicitly so the two error classes stay distinguishable on the wire.
4. **Error-frame testing posture (advisory).** Keep S3 assertions on the native SSE error frame (code/status/data after a committed HTTP 200) rather than an HTTP status, exactly as the probe established; red-suite bounded waits (2 s) are fine for red proof, but green S3 tests should keep tolerances robust under gate load.

## Verdict

`PASS` — all eight Plan-Gate boxes are satisfied; the plan is founded on verified current-main behavior with genuine red oracles, locked decisions, ordered sub-30-file slices, named risks with test mappings, an honest gate set including a reasoned scaffold.runtime N/A, explicit deferred scope, and a pre-applied JSR surface scan. Implementation may begin at S1. The findings above are required repairs or advisories to carry into the named slices, not blockers to starting.

Session/route notes: fresh evaluator session; requested and observed route identical to the pinned feature PLAN-EVAL row; fallback unused without failure evidence; generator/evaluator separation by session and vendor family verified; cycle 1 of 2 consumed.
