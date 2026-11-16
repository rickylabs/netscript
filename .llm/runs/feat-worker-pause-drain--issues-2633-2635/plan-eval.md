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
