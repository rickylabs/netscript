# PLAN-EVAL — feat-worker-pause-drain--issues-2633-2635

- Plan evaluator session: independent GLM 5.3 provider-default (OpenCode) session, 2026-11-16
- Run: feat-worker-pause-drain--issues-2633-2635
- Surface / archetype: Archetype 3 runtime/behavior, folding queue integration (Archetype 2) and workers plugin (Archetype 5) overlays
- Scope overlays: queue integration (packages/queue), workers plugin (plugins/workers), core contracts (packages/plugin-workers-core)
- Evaluated head: 89effd610f04deba89f08149f5d36ed822c6eb27 on feat/worker-pause-drain (base b0eb079575968e843b781579673c9fe2ae250e07)
- Route attestation: requested pinned feature primary `glm_5_3/provider_default` via OpenCode with empty options — observed exactly that route in this fresh session; live matrix lookup (feature tier, plan evaluator) confirms it as the feature primary and the fallback was not used. Generator: Codex gpt-6.1-sol/xhigh (OpenAI vendor family), separate session and separate vendor family. No substitution, no unasked fallback. Feature tier, cycle 1 of 2.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | research.md baselined at the exact base and re-verified at head; both issues read in full; load-bearing findings independently spot-checked in tree (see below) |
| Decisions locked                        | PASS   | plan.md Decisions 1–6 lock lifecycle/intake semantics, two-phase total-budget arithmetic, the clock port, the config precedence chain, the preserved-count handback contract, per-adapter mechanics, stop terminality, and PR2641 independence |
| Open-decision sweep                     | PASS   | plan.md "Open decisions / deferred scope" lists no must-resolve choice; evaluator-run sweep found no unflagged rework-forcing decision (A2 below is a clarity residual, not rework-forcing) |
| Commit slices (< 30, gate + files each) | PASS   | S1–S7 ordered, sized 11/≤18/≤16/≤18/≤17/≤15/≤7 files, each naming what it proves, the proving gate, and its files; one required path correction in S6 (C1 below, no design impact) |
| Risk register                           | PASS   | plan.md risk register covers pause/stop barrier separation, the task bookkeeping gap, concurrent start/stop/pause allocation, shutdown attribution races, refund abuse/stale/duplicate fencing, AMQP broken-baseline honesty, default timing headroom, F-1/F-16 sizing, JSR slow types, and resource hygiene |
| Gate set selected                       | PASS   | Archetype 3 (all F-1…F-19) plus integration/plugin overlays per gates/archetype-gate-matrix.md; scoped check (--unstable-kv)/lint/fmt/test wrappers, arch:check and quality:gate, doc-lint against the measured baseline, JSR audit plus package dry-runs, release:preflight + docs:accuracy + corpus/publish freshness, full backend suites, end-of-run scaffold.runtime on a supported runner, PLAN-EVAL → IMPL-EVAL, review-thread/head gates in S7 |
| Deferred scope explicit                 | PASS   | plan.md final section: PR2641 process lifecycle, saga SSE2637, all saga transports/Streams, transaction/outbox redesign, broad transport changes, dependency bumps; divergence-record rule stated |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Rubric applied to the planned public surface before slicing: explicit owned types/annotations, no exported Zod implementation, no broad any/casts, no new dependency/lock change, no root or sub-barrel mirrors, new types only via existing subpaths (core ./shutdown, core config, queue ports), no new package export, zero-new-diagnostics gate against the measured baseline (combined core2/queue1/plugin2), publish dry-run/audit and consumer type contracts in S7 |

## Independent spot-checks (load-bearing research verified in tree)

- `packages/plugin-workers-core/src/runtime/in-process-job-runner.ts:42` — `options.abortGracePeriodMs ?? 1_000` default confirmed; grace applies to every abort cause.
- `plugins/workers/bin/runtime.ts:181` — standard runtime passes only `{ registry }` as workerPoolOptions, so the default always applies today.
- `plugins/workers/worker/worker.ts` — `drain()` aborts the shared execution/intake controller and every `activeJobs` entry at drain start (:290–:296), with the later `30_000` wait (:378) that cannot be a graceful work interval; no pause/resume API exists.
- Task dispatch never enters `activeJobs` (checked in job-dispatcher: the map is touched only by the job branch), so the drift correction to per-listener generation barriers is real and required.
- `plugins/workers/worker/job-dispatcher.ts:220–228` — aborted claims are requeued via `nack({ requeue: true })` (also :376).
- Redis/Garnet lease: receipt-keyed atomic transition fencing ownership/expiry and dead-lettering at deliveryCount ≥ maxDeliveries confirmed in `_redis-lease.ts`; per-claim increment semantics consistent with the described refund design.
- Postgres `locked_by` receipt column already exists (claim/release paths confirmed), so the opaque per-claim receipt refund is feasible without a schema change.
- KV polling: processing entry deleted before requeue, unconditional automatic settlement around explicit handles, `kv.atomic` preferred with a documented non-atomic fallback — matches the plan's extraction/CAS/settlement-guard need.
- Deno KV: explicit requeue nack is a no-op (returns without requeue); thrown-handler native retry undercounts — matches the recorded reds and the enqueue-before-ack repair.
- AMQP wrapper advertises `nativeRetrial = true` while constructing the upstream queue with no options (native retry consequently left off upstream) and without forwarding the queue name — matches the prerequisite analysis and honest handling.
- Core `./shutdown` subpath exists with exactly ShutdownManager plus its four option/report/resource/state types; `JobRunnerClock` already provides `now()`/`schedule()`, so the drain clock reuses an existing seam without changing that port's meaning.
- `WorkersConfigObjectSchema` is a plain z.object, so unknown budget fields are stripped today — the config red test is genuinely red; `WorkerPoolOptions.abortGracePeriodMs` legacy seam exists for the locked precedence rules.
- Baselines match: Worker 463, dispatcher 414, KV polling 811, Postgres 581; queue adapters folder currently has 20 children, so the `_kv-polling` extraction must update the open F-16 redis-lease-cardinality debt entry exactly as the plan commits.
- All other slice-named files exist at main; the red tests' shared fixtures (`packages/queue/tests/_fixtures/redis-lease-harness.ts`, `plugins/workers/worker/test_utils/redis-worker-context.ts`) pre-exist and are not part of this branch.
- The four new test files are executable against unchanged main contracts (nack options go through an untyped variable; pause/resume access is `in`-narrowed), so the reproduction-before-fix evidence is executable red tests plus native backend controls, not a code-only claim. Diff at head: exactly four red test files under packages/plugins/docs plus run-dir documents — no product source changed.

## Open-decision sweep (evaluator-run)

Examined: pause racing-claim handback counting; deadline arithmetic at boundary totals (safe-integer bounds, grace 0..total, floored settlement reserve keeps the work window non-negative — min(5000, floor(T/5)) and min(1000, max(1, floor(T/25))) are consistent with 25s total = 19s work + 5s abort cleanup + 1s settlement); stop/replace instance policy; the config precedence chain; the preserved-refund first-cause window; Deno KV counted enqueue-before-ack; the AMQP confirm-channel primitive; the KV polling extraction boundary. None is rework-forcing when deferred; none is left without a locked default.

## Acceptance coverage

All nine acceptance boxes (#2633 boxes 1–4, #2635 boxes 1–5) are mapped to concrete planned evidence (plan.md "Acceptance evidence to produce") and are meetable under the locked decisions. #2635's preservation box is covered per adapter that tracks deliveries (memory, KV polling, Deno KV, Redis/Garnet, Postgres) plus the AMQP prerequisite handled honestly through S3; #2635 box3's beyond-limit oracle (8 clean restarts vs limit 5) is in place with real Worker instances and adapter-contract restarts plus final depth controls.

## Verdict

`PASS`

### Required correction before S6 (plan bookkeeping, no design change)

1. S6 names `docs/site/background-processing/how-to/tune-worker-runtime/index.md`, which does not exist. The actual file is `docs/site/background-processing/how-to/tune-worker-runtime.md`. Correct the S6 file name (keeping its box mappings for #2633 box4 / #2635 box5) and record the fix in drift.md.

### Advisories (not blocking)

- A1: In S6, name the generated carriers exactly (the agent-docs-prose carrier and the export-surface corpus — `gen:agent-docs-prose` and `gen:mcp-export-corpus` outputs — plus the publish assets carrier) so S7's freshness checks have unambiguous targets.
- A2: Decision 1 hands back a committed claim racing pause/drain without running a new user handler, while Decision 5 gates preserved-count refunds to the controlled-shutdown first cause. Add one sentence (or a draining-only precondition) stating that a claim raced by pause is an ordinary charged requeue, and have S4 tests pin it.

## Notes

- Feature tier cycle 1/2. On this PASS the generator may begin S2; cycle 2, if ever needed, is a fresh evaluator session and may edit a fixable plan per tier policy.
- PR state at evaluation: draft, `status:plan-eval`, milestone 0.0.10; required CI policy-skipped under the draft skip labels with `command-postgres` green; no reviews yet. Nothing here waives S7, IMPL-EVAL, or the current-head CI/review-thread gates.
- No resources were launched for this evaluation; this run's research backends and volumes were cleaned by proven identity per leak-report.md. Raw reproduction reports and diagnostics remain private to the operator; only repo-relative public evidence is used here.

PR https://github.com/rickylabs/netscript/pull/2645, head 89effd610f04deba89f08149f5d36ed822c6eb27, checks and reviews: required CI policy-skipped (draft, command-postgres green), no reviews yet.

---

# Follow-up PLAN-EVAL — intake drain ownership addendum (cycle 2)

- Follow-up evaluator session: independent GLM 5.3 provider-default (OpenCode) session, opened 2026-11-16, verdict 2026-11-17, fresh per T3 (not the generator or any prior evaluator session)
- Run: feat-worker-pause-drain--issues-2633-2635
- Scope: ONLY the added ownership contract in `plan-intake-drain-addendum.md` plus continued original-plan acceptance/gate coverage; the still-in-progress implementation (S2/S3a context evidence) is not being approved or rejected here, and no implementation PASS or ready state is claimed
- Evaluated head: `014730e1ca4e155fe1059054dc46d4d1dd75603d` on feat/worker-pause-drain; the original Plan-Gate PASS above at `89effd610` is preserved unchanged
- Route attestation: live matrix lookup (feature tier, plan evaluator) confirms primary `glm_5_3/provider_default`, fallback `fable_5_1/low`; requested pinned primary observed exactly in this fresh session, options{}; fallback unused, no substitution. Generator: Codex gpt-6.1-sol/xhigh (OpenAI vendor family), separate session and separate vendor family. Feature tier, cycle 2 of 2.

## Addendum scope verification (load-bearing claims reverified in tree at the exact head)

- `packages/queue/adapters/_redis-listener.ts` — `stop()` arms `drainTimer` at `policy.drainTimeout`; expiry aborts the settlement/receipt controller, closes leases and resolves `expired`; `run()`'s finally races callback settlement (`allSettled`) against `expired`, so the listener generation ends at the visibility-derived timeout even with a held callback. `redisListenerPolicy` (`_redis-lease-state.ts`) derives `drainTimeout` from `options?.visibilityTimeout ?? 30_000`. Addendum claim confirmed in source.
- `packages/queue/adapters/kv-polling.adapter.ts` — `listen()`'s finally wait is bounded by the constructor `visibilityTimeout` with 100 ms poll steps, then resolves with active processing possibly remaining. Addendum claim confirmed; the excluded 200 ms probe is legitimately near-cadence and the 500 ms case settles it.
- Independent re-run of the committed `packages/queue/tests/listener-drain-owner_test.ts` KV polling half at the exact head (in-memory KV only; the lane's retained backend containers untouched by this review): default-bounded-drain control green, owner case red at exactly the pause-barrier assertion. Matches the lane's recorded six-case result: 3 owner-option reds (KV polling, Redis, Garnet), 3 ordinary-default controls green, 0 ignored, one unique assertion. The proposed option passes through a variable against the old public contract and is ignored there, as claimed.
- Worker boundary: the already-approved S2 core drain primitive enforces one monotonic total budget (`started + budget.totalMs` with work/settlement slices) and rejects `TimeoutError` on hung close/cleanup; the three forwarding call sites for jobs/tasks/triggers exist (`worker.ts` job listen, `queue-consumer.ts` task and trigger listens), so S4 forwarding and the unchanged-total claims are meetable exactly as locked.
- Omission-behavior safety: `ListenOptions` currently has no `drainTimeoutMs` field; no native adaptation, Worker lifecycle/config, runner-default or AMQP changes exist at this head — the mandatory stop before implementing the rework-forcing public option is honored.
- Provider exemption rationale verified: Postgres joins callbacks inline in its listen loop, Deno KV `stop()` awaits the listener completion, memory joins per its committed S3a contracts; the planned AMQP native-channel design has no independent cutoff. No new behavior is needed there, and AMQP stays decoupled as its own subsequent slice.
- Implementation-lane S2/S3a gate numbers (Redis/Garnet/Postgres 28/28, budget/PG 8/8, S3a handback/fence/adjacent suites, doc-lint baseline unchanged) are recorded by the lane and used as context only; not re-run and not approved by this verdict.

## Checklist results (8 boxes scoped to the addendum)

| Plan-Gate item (addendum scope)           | Result | Evidence / location |
| ----------------------------------------- | ------ | ------------------- |
| Research present and current              | PASS   | Addendum documents the discovery with a live six-case reproduction at the exact head (3 red owner cases / 3 green default controls / 0 ignored), honest 200 ms near-cadence probe exclusion, and the extended-2 s lease oracle separating listener drain from claim expiry; the committed red test is in-tree executable evidence, reverified independently this session |
| Decisions locked                          | PASS   | Addendum "Locked additional contract": field home (`ListenOptions.drainTimeoutMs` in queue ports), provider scope (Redis/Garnet + KV polling), value domain (finite positive safe integers through 2,147,483,647 or +Infinity; NaN/zero/negative/fractional/excessive rejected before listener allocation), omission semantics, Infinity delegated to a bounded outer owner, Redis "do not arm the post-intake timer" policy, KV polling finally-wait budget, visibility/drain separation, pause-raced committed claim stays an ordinary charged requeue, draining handback stays shutdown-only |
| Open-decision sweep                       | PASS   | Addendum states no open design decision; evaluator-run sweep found none rework-forcing: explicit-Infinity direct consumers opt in knowingly (default finite unchanged), non-scoped adapters ignore the field per the existing provider-specific-field convention, the worker total/stop math is untouched, and config stays forwarding-only |
| Commit slices                             | PASS   | S3b additional group ≤10 files (4 named source files + the committed owner test + existing Redis listener policy/lease tests, verified to exist + up to 3 run docs), contract-first; AMQP as its own subsequent <30 slice; S4 proofs added to the already-named worker/listener test group (<30); S6 +1 docs file (<30); S7 unchanged; all slices remain <30 and name proofs plus proving gates |
| Risk register                             | PASS   | Default-unbounded-stop risk pinned by 3 negative controls plus retained native stop/reclaim regressions; visibility-conflation risk pinned by explicit JSDoc, policy separation and the extended-live-lease oracle; worker forwarding pinned by explicit forwarding plus noncooperative-budget tests; same-name hazard now settled below; no new dependency/lock/command/root surface |
| Gate set selected                         | PASS   | Original Archetype 3 + overlays gate set unchanged; the addendum only adds scoped proofs (6/6 owner/default controls, invalid-values-allocate-no-resources, retained default finite stop/expiry/claim/outage regressions, S4 forwarding/long-pause/stop-bound proofs, S6 docs) and states no gate weakened or replaced — verified against S1–S7 |
| Deferred scope explicit                  | PASS   | Addendum enumerates its non-changes (no Streams, no saga transport, no generic pause/transport abstraction, no lease/visibility semantics change, no new exclusivity guarantee, AMQP decoupled); original deferred list from plan.md stands |
| jsr-audit surface scan                    | PASS   | One optional primitive numeric field through the existing queue ports interface follows the existing provider-specific-field pattern (JSDoc, others ignore); no new exports/subpaths/dependencies/slow types; S3b/S7 doc-lint zero-new-diagnostics against the exact per-entrypoint baseline plus publish dry-run/audit and consumer gates retained |

## Acceptance coverage

9/9 remains. #2633 boxes 1–4 and #2635 boxes 1–5 keep the approved mapping from plan.md "Acceptance evidence to produce"; the addendum adds evidence obligations inside #2635 box1 (pause keeps admitted job/task/trigger work alive beyond the former native cutoffs) and box2 (drain success and stop stay within the worker total) without altering any acceptance box.

## Repairs settled in place (cycle 2 authorization)

1. Addendum risk paragraph now requires the Listener field's JSDoc and the S6 docs to cross-reference the per-listener post-intake cutoff against the already approved, same-named Worker-total stop option (unchanged 25 s total). Wording only, settled in place rather than bounced back; recorded in `drift.md`. No product/tests or design change.

## Findings

None blocking. The six-case control design, the honest near-cadence probe exclusion, and the separation of listener drain from claim expiry (2 s extended lease with a re-checked usable heartbeat) were verified and stand as sound future-contract evidence. The committed red owner cases must not be recorded as false greens — the addendum already commits to exactly that, and S3b must prove 6/6 green once the contract lands.

## Notes

- Feature tier cycle 2/2, narrow implementation-discovery checkpoint after the cycle-1 PASS. On this PASS the generator may begin S3b under the approved slice/gate set. The three positively owned implementation backend containers retained by the lane were not touched, launched or cleaned by this review; no resources were used beyond an in-memory KV re-run.
- Raw red reports and diagnostics remain private to the operator; only repo-relative public evidence is used here. PR remains draft with `status:plan-eval`; new owner-option tests and original Worker/config reds are intentionally pending, so no ready transition, merge or publication is implied, and final independent IMPL-EVAL plus S7 gates remain required.

## Verdict

`PASS` (follow-up; the added ownership contract and continued acceptance/gate coverage are approved; not an implementation approval)

PR https://github.com/rickylabs/netscript/pull/2645, head 014730e1ca4e155fe1059054dc46d4d1dd75603d, checks and reviews: required CI policy-skipped (draft skip labels; command-postgres green), no reviews yet.
