use harness

# IMPL-EVAL — NetScript issue #1398 (PR #1536)

You are a **formal IMPL-EVAL evaluator** in a fresh session. You did not write this code, did not
supervise it, and are not its reviewer. Try to **break** the claim that it is correct and complete,
then return a verdict.

Worktree: `/home/codex/repos/ns006-1398-impleval` (detached). **Read-only** — do not edit, commit,
or push. You may run read-only commands and tests.

## SKILL

- `netscript-harness` — read `.llm/harness/evaluator/protocol.md` and `verdict-definitions.md`.
- `netscript-doctrine` — plugins are Archetype 5 / thin; `-core` owns convention-bearing primitives.
- `netscript-cli` — the `e2e:cli` suite surface.

## The change

Three commits on `fix/1398-publish-job-executions-to-durable-stream`. Job executions were never
published to the durable job stream because the workers **API service** installs the execution-state
mutation hook (`plugins/workers/services/src/main.ts:67`) but the **background** entrypoints that
generated projects actually run never did (`plugins/workers/bin/runtime.ts`). Read the live issue
#1398 for its four acceptance boxes.

Context you must read first, because the plan was already adversarially reviewed and you should not
repeat that work:

- `.llm/runs/release-0.0.6-features--orchestration/plan.md` — the approved plan, D1–D5.
- `.llm/runs/release-0.0.6-features--orchestration/plan-eval.md` — the PLAN-EVAL verdict.
- `.llm/runs/release-0.0.6-features--orchestration/slices/worklog-1398.md` — the implementer's own
  evidence, including **two red live runs**.

These files live on the orchestration branch `chore/release-0.0.6-features-orchestration`, not on the
PR branch. If they are not present in your worktree, read them with
`git show chore/release-0.0.6-features-orchestration:<path>`.

## What to attack, in priority order

1. **Does the trace join actually hold at runtime, not just in the unit test?** D3 wraps publication
   in `withContext(extractContext({traceparent, tracestate}), …)`
   (`packages/plugin-workers-core/src/streams/producer.ts:113-128`). The unit tests assert the
   publish span's trace id. Check the assumption underneath: does `extractContext` return a usable
   context for a **remote** traceparent, and does `withContext` keep it active across the `await`
   boundary inside `producer.upsert`'s async path? If the context is lost after the first `await`,
   the unit test could pass while real publication carries the wrong trace id. **This is the highest
   value thing you can check.**
2. **Is the hook installed exactly where execution state is mutated?** It is installed in
   `startWorkerProcess` and `startCombinedProcess` but **not** `startSchedulerProcess`. Verify the
   scheduler genuinely does not mutate execution state. If it does, executions from scheduled jobs
   are still invisible and the issue is only half fixed.
3. **Double-install and ordering.** `setMutationHook` is destructive (single field). In a combined
   process, can the hook be installed and then replaced or cleared by anything later — for example by
   `registerProjectJobs` or the API service sharing a runtime? Installation happens *before*
   `registerProjectJobs`; confirm nothing in that path resets it.
4. **Volume and buffer pressure.** D2 publishes every mutation, ~4 per execution on the same key,
   against a 256-event / 1 MiB bounded buffer. Look for a realistic path where a busy worker drops
   execution records, and say whether drops are still metered and settled.
5. **The un-deferral is complete and honest.** `SCAFFOLD_RUNTIME_DEFERRED_GATES` is now empty and
   both OTEL gates were added to `RUNTIME_GATES`. Confirm **all** stale pins were updated — the
   implementer found a third in `suite-runner_test.ts` that the plan and PLAN-EVAL both missed.
   Search for a fourth. Confirm the empty-array type change
   (`readonly DeferredGate[]` instead of `as const satisfies`) did not weaken any assertion.
6. **Test quality.** Revert each fix **individually** and confirm each test fails for **its own**
   reason: (a) remove the `withContext` wrapper → trace tests fail; (b) remove the
   `startCombinedProcess` hook install → installation test fails; (c) remove the two gates from
   `RUNTIME_GATES` → suite-registry tests fail. If a test passes while its own defect is
   reintroduced, that is blocking. Restore the tree and confirm it is clean.
7. **Scope.** D4 forbids any `WorkerExecutionZodSchema` change; confirm `streams/schema.ts` is
   untouched. Confirm no #1405 surface, no dependency/export-map change, no new lint suppression or
   unsafe cast.

## On the live gate — read carefully

Two local `scaffold.runtime` runs went red **before** reaching `behavior.otel.stream-consumer` and
`behavior.otel.traces`: run 1 at `runtime.flow-b-fixture` (`generate plugins: fetch failed`), run 2
at `runtime.wait.triggers-api` (unhealthy after 120 s). Neither gave the restored gates a verdict.
The orchestrator escalated to CI, where the same suite runs.

**Do not treat CI's result as your own finding, and do not re-run `scaffold.runtime` yourself** — it
is expensive and serialised across this lane. Your job is the code and the tests. State explicitly in
your verdict whether, in your judgement, the change could plausibly cause a `triggers-api` health
timeout; #1398 touches workers and the e2e suite definitions, not triggers, but say what the code
supports rather than what is convenient.

## Gates to run yourself

```bash
deno task --cwd packages/plugin-workers-core test
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx
deno task quality:gate
```

Use the package-declared `deno task --cwd <pkg> test`; a bare `deno test <path>` omits `--allow-env`
and exits 1 on `NotCapable`. Note `quality:gate`'s configured roots do **not** cover
`packages/plugin-workers-core` or `packages/cli/e2e` — run explicit target scans for those and say so.

## Output

Return your verdict **as text in your final message** — do not write files.

```
**[PHASE: IMPL-EVAL] [VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT]**

<one-line headline>

### Verified
- <claim> — <how you checked, path:line, command output>

### Findings
1. **C1 <title>** — what is wrong, where, the fix, blocking or advisory.

### Acceptance box check (#1398)
- Box 1 …: satisfied / not satisfied / not-yet-live-verified — evidence

### Live-gate judgement
- Could this change plausibly cause the triggers-api timeout? <yes/no/cannot determine> — reasoning.

### Next
- <action + owner>
```

Rules: every finding cites `path:line`. State the verdict token exactly. Distinguish blocking from
advisory. Write "could not verify" rather than guessing. **No praise, no quality adjectives, no
overall-assessment paragraph** — findings and evidence only. An empty `Findings` list is fine if the
code is sound, but only after genuinely attempting 1–7.

Note on acceptance box 3 ("a live subscription … within a bounded time"): if the live gate has not
produced a verdict, the correct answer is **not-yet-live-verified**, not "satisfied". Do not tick it
from unit tests.
