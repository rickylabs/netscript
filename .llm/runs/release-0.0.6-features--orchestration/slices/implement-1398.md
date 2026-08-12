use harness

# Slice brief — #1398 publish job executions to the durable job stream

You are the implementation agent for this slice. **Codex · GPT-5.6 Sol · medium**
(`normal_implementation`). The plan has already passed a separate-session PLAN-EVAL; your job is to
implement it, not to re-decide it.

| Field | Value |
| --- | --- |
| Issue | #1398 (`priority:p1`) |
| Worktree | `/home/codex/repos/ns006-1398` |
| Branch | `fix/1398-publish-job-executions-to-durable-stream` |
| Base | `origin/main@01aa12b67` |
| Run dir | `.llm/runs/release-0.0.6-features--orchestration/` |

**Read these first, in this order:**

1. `.llm/runs/release-0.0.6-features--orchestration/plan.md` — the approved plan. **Authoritative.**
2. `.llm/runs/release-0.0.6-features--orchestration/plan-eval.md` — the PLAN-EVAL verdict, whose
   findings F1 and F2 are already folded into the plan.
3. `.llm/runs/release-0.0.6-features--orchestration/slices/research-1398.md` — line-cited research.
   **Its "Unverified" section is honest; treat those items as unknown, not as facts.**

## SKILL

- `netscript-doctrine` — plugins are Archetype 5 / thin; convention-bearing primitives belong in
  `-core`. Read before deciding where code lives.
- `netscript-harness` — slice/commit trail, drift recording.
- `netscript-cli` — the `e2e:cli` suite surface and what `scaffold.runtime` actually runs.
- `aspire` — service graph and trace evidence for the live run.
- `netscript-tools` — validation wrappers and what counts as gate evidence.
- `netscript-pr` — draft PR body, closing keyword, phase comments, labels.

## The defect

A triggered job execution completes and emits a `job.execute` span, but **no record for that
execution is ever published to the durable job stream**. The stream contains only the three startup
job-definition snapshots. This is a **wiring gap**, not a missing feature — the producer, the mapper,
the hook, and the execution record's trace fields all already exist.

The workers **API service** installs the stream mutation hook
(`plugins/workers/services/src/main.ts:67`). The **background** entrypoints that generated projects
actually run never do (`plugins/workers/bin/runtime.ts:89-107`, `:110-122`, `:125-152`). Generated
projects run `startCombinedProcess()` as Aspire resource `workers-combined`.

**The repo already admits this.** Two E2E gates are deferred against this issue with that exact
reason (`packages/cli/e2e/suites/scaffold/capability-suites.ts:24-35`).

## LOCKED decisions — implement, do not re-decide

- **D1** — Install the mutation hook on the background runtimes in `plugins/workers/bin/runtime.ts`,
  mirroring `plugins/workers/services/src/main.ts:65-75`. Cover `startWorkerProcess` and
  `startCombinedProcess`; `startSchedulerProcess` only if it owns execution state. Note
  `KvExecutionState.setMutationHook` is destructive (single `onMutation` field), so a second install
  replaces the first rather than double-firing — installation must still be deliberate, not
  incidental.
- **D2** — Publish **all** execution mutations (created / updated / deleted), not only terminal ones.
- **D3 — the join, and the trap.** The hook must wrap its publish in the execution's stored trace
  context:
  `context.with(extractContext({ traceparent, tracestate }), () => producer.upsert(...))` in
  `createStreamMutationHook` (`packages/plugin-workers-core/src/streams/producer.ts:108-118`), which
  today does **no** wrapping.
  **Why this is not optional:** `StreamsTracerPort.startSpan`
  (`packages/plugin-streams-core/src/telemetry/instrumentation.ts:92-102`) takes **no**
  parent-context argument and starts the publish span on the **ambient** context (`:160`), and the
  header is `formatTraceparent(span.spanContext())` (`:172`). Meanwhile `job.execute` is a child of
  the stored dispatch traceparent (`plugins/workers/worker/job-dispatcher.ts:43-44` → `:108` →
  `packages/telemetry/src/application/span.ts:38-43`). So wrapping is what makes the published
  record's trace id equal the `job.execute` trace id.
  **The trap:** `executionState.create()` (`job-dispatcher.ts:74-86`) runs *before* the
  `job.execute` span exists (`:91`). The E2E selector returns the **first** `correlationId` match
  (`select-flow-b-stream-change.ts:96-105`) and TC-14 then asserts that record's trace id
  (`:131-153`). Install the hook **without** D3's wrapping and it will look like it works, then fail
  TC-14 on the `create()` record. Do not skip the wrapping because "the terminal record is inside
  the span anyway".
- **D4** — **No change to `WorkerExecutionZodSchema`** and no new public export. The gate asserts the
  **header** traceparent, not a record field, so no schema field is needed. If you conclude you
  cannot make the join without a schema change, **stop and report** — do not take that decision
  in-slice.
- **D5** — Remove both entries from `SCAFFOLD_RUNTIME_DEFERRED_GATES`
  (`capability-suites.ts:24-35`) and update **both** tests that pin the deferral, in the same commit:
  - `packages/cli/e2e/tests/presentation/suite-registry_test.ts:204-205` — flips `false` → `true`.
  - `packages/cli/e2e/tests/presentation/suite-registry_test.ts:209-234` — *"runtime suites pin the
    exact #1398 OTEL deferral without widening it"*, which asserts the constant equals the exact
    two-entry list (`:210-221`) and that neither runtime tier executes a deferred gate (`:223-233`).
    Both tiers reference the constant (`capability-suites.ts:211,218`).

  Missing the second test is the single most likely way to leave this slice red. It was caught by
  PLAN-EVAL, not by the plan's first draft.

## Slices

- **S1** — D1 + D2 + D3 with unit tests.
- **S2** — D5, both tests, same commit.
- **S3** — live runtime evidence (below).

## Required tests

1. **The join.** The mutation hook publishes under a stored `traceparent`; assert the publish span's
   trace id equals that traceparent's trace id. Today's suite
   (`packages/plugin-workers-core/tests/streams/workers-streams_test.ts:9-104`) has **no traceparent
   assertion** — that gap is why this shipped.
2. **Installation.** The background runtime path installs a mutation hook; the test must fail if
   `startCombinedProcess` stops installing it. **No such test exists today, which is exactly why
   `workers-combined` shipped without the hook.**
3. **Pre-span publication.** A mutation emitted *before* any ambient `job.execute` span still
   produces a publish span on the stored trace id. This pins D3 against the `create()` case — the
   trap above. Without this test, D3 can silently regress.

Each test must fail if its own defect is reintroduced. Assert the positive value **and** that it is
not the pre-fix value where that distinction is meaningful.

## Gates — deliverables, not hopes

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root plugins/workers --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root plugins/workers --ext ts,tsx
deno task quality:gate
deno task --cwd packages/plugin-workers-core test
```

**Use the package-declared `deno task --cwd <pkg> test`, not a bare `deno test <path>`** — the bare
form omits `--allow-env` and exits 1 on `NotCapable` permission errors. That was a defect in the
previous slice brief; it is corrected here rather than repeated.

`deno task quality:gate` is mandatory for a `packages/**`/`plugins/**` slice. Check whether the
configured quality roots actually cover the packages you touched; if they do not, run an explicit
scan against your target paths and say so. A new `deno-lint-ignore`, `as unknown as`, `any`, or
`@ts-ignore` added to green a gate is a review-blocking finding — stop and report instead.

**S3 — live evidence, one pass:**

```bash
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Do **not** split this into individual `gates` invocations. The two formerly-deferred gates
(`behavior.otel.stream-consumer`, `behavior.otel.traces`) must **pass for real** in that run — that
is what makes this issue's acceptance mechanical instead of asserted. Report the raw exit code and
any failing suite/test names.

This gate is **expensive and serialised across this lane** — three concurrent `scaffold.runtime`
runs once produced two failures that were contention, not defects. Confirm no other run of it is
active before you start, and do not run it more than necessary.

**Runtime-evidence order:** use plugin doctor and Aspire logs/OTEL traces **before** hand probes.
Prefer the trace as evidence over a hand-rolled curl. **No hand-waved timing** — the bounded-time
criterion is the gate's own live SSE loop (`consume-flow-b-stream.ts:203-230`), not a stopwatch in a
comment.

**Known residual to observe (not to fix):** the generated Aspire wiring guards with
`if (<ref>Endpoint)` (`generate-register-background.ts:200-218`), so `services__streams__http__0` is
silently omitted if the streams resource exposes no `http` endpoint at wiring time. The env path is
otherwise confirmed wired (`install-plugin_test.ts:1393-1396`). If the producer throws
`Missing plugin reference "streams"` at `create-durable-stream.ts:262-272`, that is this residual —
report it, do not paper over it.

## Out of scope — do not absorb

- Any `packages/plugin-streams-core` reason-string change — that is #1405, landing separately.
- The undeclared `@netscript/plugin-streams-core` imports in `packages/plugin-workers-core/deno.json`
  and `plugins/triggers/deno.json`. Real, but they get their own issue. If `publish:dry-run` flags
  them, **report; do not fix here.**
- Any `WorkerExecutionZodSchema` change (D4).

## Commit trail

1. Open a **draft PR against `main`** in the same session as your first commit. Title:
   `fix(workers): publish job executions to the durable stream on the job.execute trace`.
   Body per `netscript-pr`: `Closes #1398` in `## Scope`, run-dir path, slice checklist, Definition
   of Done, and a fenced `acceptance-evidence` block mapping each of #1398's four acceptance boxes.
   Labels `type:fix`, `area:plugins`, `area:telemetry`, `status:impl`, milestone `0.0.6`.
2. Commit per slice, push by **explicit refspec**
   (`git push origin HEAD:refs/heads/fix/1398-publish-job-executions-to-durable-stream`), and post a
   `[PHASE: IMPL]` comment with commit hash and **pasted real gate output**.
3. Keep your slice worklog current in the same commit.

## Reporting contract

Report: what you changed and where; the exact test names and what each would catch; verbatim gate
output including the E2E exit code; and **anything you could not do, could not verify, or that
surprised you**. If a gate goes red, report the red with its output — do not go idle on it and do
not work around it silently. The previous slice in this lane reported a red caused by a mistake in
its own brief, and that was the correct behaviour.

You do **not** merge and you do **not** flip the PR to ready. The orchestrator holds merge authority.
