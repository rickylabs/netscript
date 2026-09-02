use harness

# Leaf brief — #1877 · `runtime.wait.workers` requires a worker startup log line #1864 renamed

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1877`
- Branch: `fix/workers-runtime-ready-markers` @ **`38f2ce735`** (exact `main`), no upstream yet
- Run dir: `.llm/runs/fix-workers-runtime-ready-markers--1877/`
- Push: explicit refspec only — `git push origin HEAD:refs/heads/fix/workers-runtime-ready-markers`
- Closes exactly **#1877**
- Priority **p0**: this is a baseline blocker on `main`; the whole 0.0.7 runtime queue is behind it.

## SKILL

Activate the harness workflow per `.agents/skills/netscript-harness` and `.llm/harness/`. Also load
`.agents/skills/netscript-cli` (E2E gate surface), `.agents/skills/netscript-tools` (structured
wrappers are the verdict source), and `.agents/skills/netscript-pr` (closing keyword, labels,
milestone).

## The defect — already diagnosed, do not re-derive

`packages/cli/e2e/src/application/gates/scaffold/wait-for-workers-runtime.ts:5-8`:

```ts
const readyMarkers = [
  '[Scheduler] Started with',
  'Starting with Web Worker pool',
] as const;
...
if (result.success && readyMarkers.every((marker) => lastLogs.includes(marker))) {
```

**#1864** (`38f2ce735`, current `main`) renamed the second marker in
`plugins/workers/worker/worker.ts:156`:

```diff
-      `[Worker ${this.workerId}] Starting with Web Worker pool (${this.concurrency} workers)...`,
+      `[Worker ${this.workerId}] Starting in-process job runner (queue concurrency: ${this.concurrency})...`,
```

`'Starting with Web Worker pool'` is now emitted **nowhere** in the repo — the only hit is the dead
expectation in the gate. Because `.every()` is used, the gate can never pass, and it burns its full
90 × 2 s budget before failing. Observed in both tiers of run `33531189254` (207 s / 208 s).

## Required change — exactly this shape

Accept the scheduler marker **plus either** valid runner-mode marker:

- `[Scheduler] Started with` — **mandatory**, unchanged.
- **Either** the web-worker-pool marker **or** the in-process-runner marker.

Accepting both modes is the point: swapping one hardcoded string for another would break again the
next time the runner mode changes, which is exactly how this defect and its two siblings (#1863,
#1870) were created. Model it as "scheduler AND (poolMarker OR inProcessMarker)", with the runner
markers in a named collection so a third mode is a one-line addition.

Improve the failure too: when it does fail, the error should say **which** requirement was unmet —
scheduler missing, or no runner-mode marker — rather than the current undifferentiated
"became healthy without runtime startup evidence". A 3.5-minute timeout that does not say what it
wanted is most of why this cost a full hosted run to find.

## Ceiling — do not touch anything outside this list

```
packages/cli/e2e/src/application/gates/scaffold/wait-for-workers-runtime.ts
packages/cli/e2e/tests/application/gates/<new or existing test for this gate>
.llm/runs/fix-workers-runtime-ready-markers--1877/**
```

**Hard prohibitions.**
- **No `plugins/workers/**` change.** The producer is correct; the consumer is stale. Do not "fix"
  the log line to match the gate — that inverts the defect.
- **Do not fold in unrelated product behaviour.** This is a bounded gate repair, nothing else.
- **Do not** modify `deno.lock`. If it moves, stop and report.
- **Do not** run `deno task e2e:cli` — you hold no runtime lease and the suite cannot pass on `main`
  today. Hosted CI owns the runtime proof.
- If the marker constants are not currently exported/testable, you may restructure the module
  minimally to make them testable — but that restructuring is the only structural change allowed.

## Required RED → GREEN

1. **RED commit, tests only, zero product files.** A test asserting the gate's marker predicate
   accepts real current log output — i.e. text containing `[Scheduler] Started with 0 scheduled jobs`
   and `[Worker <id>] Starting in-process job runner (queue concurrency: 1)...` — which the current
   `.every()` implementation rejects.
2. **GREEN commit.** The predicate change.
3. Record both SHAs and the observed RED counts in `worklog.md`.

## Tests — all four cases required

- **Both accepted modes pass**: scheduler + web-worker-pool marker; and scheduler + in-process-runner
  marker.
- **Missing scheduler fails closed**: a runner marker present, scheduler absent → rejected.
- **Missing runner marker fails closed**: scheduler present, neither runner marker → rejected.

Build the in-process fixture text from the **real** emitted shape, not a paraphrase. Anchor it on
`plugins/workers/worker/worker.ts:156` so a future rename is caught by a failing test rather than by
a 3.5-minute hosted timeout.

## Gates (record exit codes in `worklog.md`)

```
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts
```

A root e2e **lint REFUSAL (exit 2)** from the detached `desktop-native` fixture missing catalog `zod`
is a known pre-existing baseline on `origin/main`. If you hit it, record it as REFUSAL with that
attribution and run the focused lint on the touched directory instead — never claim PASS, and never
work around it by touching source or the lock.

## PR

Open as **draft** with `status:impl`, milestone `0.0.7`, labels
`type:fix, area:cli, area:tooling, gate:e2e, priority:p0, orchestrator:fixes, ci:full`.

Body must contain **`Closes #1877`** verbatim, the RED/GREEN SHAs, gate exit codes, and the ceiling
you touched. Leave the Definition of Done checklist unticked — the supervisor mirrors acceptance;
**never hand-tick acceptance boxes**.

Then reply with the GREEN SHA, PR number, and gate exit codes. Do not mark ready-for-review, do not
merge, and do not request a runtime lease.
