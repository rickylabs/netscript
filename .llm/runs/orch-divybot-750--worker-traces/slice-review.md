# S1 slice review — worker trace isolation

**Verdict: PASS_SLICE_REVIEW** (S1 source-diff review only; not merge-readiness, not IMPL-EVAL.)

## Identity and session

- Reviewer: native Claude **Opus 5** (`claude-opus-5`, Anthropic), effort **xhigh**, session
  `0faa9365-3561-462c-96f1-45c3216cd292`, same session as the recorded preflight.
- Role: independent supervisor/reviewer. Implementation was Codex (OpenAI), `sol`/`xhigh` —
  different vendor and different session, so author self-certification does not apply.
- Declared feature-tier fallback per `supervisor.md` routing (primary `muse_spark_1_3` unavailable
  without a fresh paid-allowance snapshot; no paid inference launched).
- Date: 2026-10-18. Baseline `a833dfa8a3095bb6434cf7ae8bf24f954cf2f1bd`.
- Constraints honoured: no delegation, no other model launched, no product-code edit, no commit,
  no push, no GitHub comment. The only file written by this turn is this review. The running
  scaffold runtime smoke was neither started nor stopped.

## Reviewed surface

Working diff of `/home/agent/projects/orchid/worktrees/issue-750` against `a833dfa8`, including the
two untracked new test files:

| File | Kind |
| --- | --- |
| `packages/telemetry/src/context/w3c.ts` | source |
| `packages/telemetry/src/context/message.ts` | source |
| `plugins/triggers/src/runtime/trigger-runtime-processor.ts` | source |
| `packages/telemetry/README.md` | doc |
| `packages/telemetry/tests/context/message-parenting_test.ts` | new test (untracked) |
| `packages/telemetry/tests/instrumentation/queue-parenting_test.ts` | new test (untracked) |
| `plugins/triggers/src/runtime/trigger-runtime-parenting_test.ts` | test |
| `plugins/workers/worker/job-dispatcher_test.ts` | test |

Run artifacts read: `supervisor.md`, `research.md`, `plan.md`, `worklog.md`, `drift.md`,
`context-pack.md`, `leak-report.md`.

## Independent test verdict

Reviewer-run, not author-reported. Structured wrapper, exactly the required command:

```
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts \
  --output /home/agent/projects/orchid/runs/2026-10-18-worker-traces/reviewer-tests.json \
  -- --allow-all packages/telemetry/tests/context packages/telemetry/tests/instrumentation \
  plugins/triggers/src/runtime/trigger-runtime-parenting_test.ts \
  plugins/workers/worker/job-dispatcher_test.ts
```

`{"passed":34,"failed":0,"ignored":0,"totalResults":34,"uniqueFailures":0}` — **exit 0**.
Report: `/home/agent/projects/orchid/runs/2026-10-18-worker-traces/reviewer-tests.json`.

Additional reviewer-initiated blast-radius run (not in the brief; added because the `ROOT_CONTEXT`
change reaches `extractContext` consumers outside the plan's stated surface):

```
... run-deno-test.ts --output .../reviewer-tests-streams.json -- --allow-all \
  packages/plugin-workers-core/tests/streams packages/telemetry/tests/context/w3c_test.ts \
  packages/plugin-sagas-core/tests
```

`{"passed":144,"failed":0,"ignored":4,"totalResults":148,"uniqueFailures":0}` — **exit 0**.
Report: `/home/agent/projects/orchid/runs/2026-10-18-worker-traces/reviewer-tests-streams.json`.

Reviewer-run lint (structured wrapper): `packages/telemetry` 112 files, 0 occurrences, exit 0;
`plugins/triggers` 78 files, 0 occurrences, exit 0.

Author-supplied evidence (`suites.json`, `check.json`, `lint.json`, `fmt.json`,
`quality-receipt.json`, publish dry-run logs, doc-lint baselines) was read as context only and is
**not** adopted as this review's verdict.

## Substantive findings — correctness

All confirmed by reading production code, not by trusting the tests.

1. **Root defect is actually fixed at the root.** `extractContext` (`w3c.ts:201`) now seeds
   `propagation.extract` with `ROOT_CONTEXT` instead of `context.active()`, and every non-parent
   return path returns `extractedContext` instead of `context.active()` (`w3c.ts:214`, `:219`,
   `:234`). Both failure modes in `research.md` are closed: without a registered propagator the
   ambient worker span can no longer mask a valid carrier (the old seed leaked it straight back
   through the `extractedSpan` check at `:202`), and with a propagator registered a
   missing/invalid carrier no longer retains the worker span.

2. **Valid parents, flags and tracestate are preserved.** The manual fallback still reconstructs
   `traceId`/`spanId`/`traceFlags`/`isRemote` and attaches `traceState` via `parseTraceState`
   (`w3c.ts:225-233`); only the context it is layered onto changed. `message-parenting_test.ts`
   asserts this across all three public entry points (`extractContext`, `extractFromTraceContext`,
   `resolveParentContextFromHeaders`), **both with and without** a registered
   `W3CTraceContextPropagator`, including `traceFlags === 0` (unsampled parent is still honoured)
   and `isRemote === true`.

3. **The `tracestate` normalization change is a genuine in-scope fix, not scope creep.**
   `message.ts:27` previously split on `,` for `traceparent` *and* `tracestate`, truncating a
   legitimate multi-member tracestate list to its first vendor entry. Restricting the split to
   `traceparent` (the real concatenated-duplicate-header case) is correct per W3C, and is covered:
   `TRACESTATE = 'vendor1=first,vendor2=second'` round-trips intact through
   `resolveParentContextFromHeaders`.

4. **Absent-carrier policy.** `resolveParentContextFromHeaders(undefined)` returns `ROOT_CONTEXT`
   (`message.ts:20`); `{}`, `{traceparent:'invalid'}` and `{tracestate: ...}`-only all resolve to a
   span-free context. Asserted directly rather than inferred from span output.

5. **Queue-to-job nesting is intact.** `TracedQueue.listen` (`instrumentation/queue.ts:219`) roots
   the `queue.dequeue` consumer span per delivery, then threads
   `contextWithSpan(span, parentContext)` into the handler, so `job.execute` and all handler spans
   remain children of the consumer span. The new real-SDK test proves both halves at once: six
   deliveries produce six distinct trace ids, none equal to the worker trace, while
   `job.execute.parentSpanContext.spanId === consumer.spanId` and
   `handler-N.parentSpanContext.spanId === job.spanId` for every delivery.

6. **The dispatcher fallback under test is the real one.** `processWorkerJob`
   (`job-dispatcher.ts:49`) resolves
   `tracedContext?.parentContext ?? getParentContextFromHeaders(traceHeaders)`, and
   `getParentContextFromHeaders` is the `extractContext` alias exported at
   `src/context/mod.ts:13`. The new dispatcher test calls `processWorkerJob` with **no**
   `tracedContext`, so it exercises the production fallback branch, not test wiring — and it does so
   while an ambient `ACTIVE_TRACEPARENT` context is active, which is exactly the condition that used
   to leak. It further asserts the subprocess `traceparent` handed to the executor carries the
   job's own trace id, so the isolation survives the wire boundary.

7. **Trigger ingress roots correctly.** `TracedTriggerProcessor.process` now always derives the
   parent from the durable carrier (`trigger-runtime-processor.ts:242`). This works only because
   `createSpan` uses `options.parentContext ?? context.active()` (`application/span.ts:25`), so a
   passed `ROOT_CONTEXT` is honoured as a true root rather than falling through to the ambient
   span — checked, not assumed. `#runSpan` threads each child context explicitly, so
   ingress → detect → process nesting holds without a global context manager, and the pre-existing
   `#405` regression test (inbound trace continuation) still passes unchanged.

8. **Deliberate local parenting is not broken.**
   - Subprocess propagation (#2136): `resolveSubprocessTraceHeaders` still prefers the active span
     over message headers and was not touched; the existing test asserting the active traceparent
     wins over a message traceparent still passes.
   - Polyglot **task** path: `processWorkerTask` creates no span of its own and runs inside the
     `TracedQueue` consumer span, so tasks inherit the per-delivery root transitively. No separate
     change was needed and none was made — correct restraint, not an omission.
   - Nested local work continues to use the active context; the README states this rule explicitly.

9. **Concurrency and failure.** The queue test drives three concurrent deliveries through one
   listener with the middle one throwing, under a real `AsyncLocalStorageContextManager` and a real
   `BasicTracerProvider`/`InMemorySpanExporter`. It asserts `['fulfilled','rejected','fulfilled']`,
   `SpanStatusCode.ERROR` on both the consumer and job spans of the failing delivery and `OK`
   elsewhere, trace-id isolation across all six deliveries, that the listener's active span is
   restored to the worker span after the failure, and that no span remains active once the outer
   scope exits. This is a substantive test, not a smoke test.

## Scope and doctrine

- No overreach. Three source files, one doc, four test files. No public signature change, no new
  export, no new dependency, no runtime-lifecycle or delivery-contract change — consistent with the
  `PLAN-EVAL: N/A` justification in `plan.md`, which I independently agree with.
- Lock hygiene clean: `deno.lock` is unmodified, and both npm specifiers used by the new tests
  (`sdk-trace-base@^2.5.0`, `context-async-hooks@^2.9.0`) are already resolved in the lock and
  already used by sibling tests.
- New telemetry tests use relative imports (`../../context.ts`, `../../instrumentation.ts`),
  matching the convention established by `370b70d29`.

## Findings to address (none blocking S1)

- **F1 — new markdown format drift, author-controlled (minor, fix recommended).**
  `packages/telemetry/README.md` adds `deno fmt` violations at lines **88-89** and **91-92** that
  have no baseline counterpart: baseline drift in this file begins only at line 142. Line 91 was a
  *previously well-formed* line that the edit lengthened to 106 chars by changing "a worker's" to
  "a job execution's". Verified by running `deno fmt --check` on the file in both this worktree and
  the read-only baseline worktree at `a833dfa8`. Per `CLAUDE.md` raw root markdown `fmt --check` is
  explicitly not a package-quality verdict, so this does not fail the slice — but it is avoidable
  new drift. Rewrap the new paragraph and the edited sentence at 100 columns.
- **F2 — published-API behavior change needs a release note (minor).** `extractContext`, and its
  `getParentContextFromHeaders` alias, are exported from `@netscript/telemetry`. Their documented
  fallback changes from "active context" to "root context". `packages/telemetry` has no
  `CHANGELOG.md`, so there is no changelog obligation, but the PR body and the 0.0.9 release notes
  should state it: a downstream caller doing `extractContext({})` inside an active span to obtain a
  child now gets a detached root.
- **F3 — unstated blast radius (minor, record in drift).** Two production consumers outside the
  plan's stated write surface inherit the new behavior and are not mentioned in `plan.md`,
  `worklog.md` or `drift.md`:
  `packages/plugin-workers-core/src/streams/producer.ts:132` (`createStreamMutationHook` — an
  execution with no stored traceparent now publishes under a root instead of the ambient context)
  and `packages/plugin-sagas-core/src/telemetry/otel-saga-telemetry.ts:48` (a *malformed* saga
  parent traceparent now roots instead of nesting; valid parents are unaffected). Both are
  consistent with the issue's intent — that ambient context *is* the shared worker trace — and I
  verified both suites stay green (F3 is why the second test run above exists). Record them as
  intentional consequences rather than leaving them silent.
- **F4 — nit.** `trigger-runtime-processor.ts:242` always passes
  `{traceparent: '', tracestate: ''}` for a carrier-less event, bypassing the `!headers` early
  return in `resolveParentContextFromHeaders` and relying on the empty-string path through
  normalization plus `parseTraceState('') → undefined`. I traced it; it is behaviourally identical.
  A conditional spread would express the intent and keep the early return meaningful.
- **F5 — nit.** `packages/telemetry/tests/instrumentation/queue-parenting_test.ts` calls
  `worker.end()` twice (line 80 and the `finally` at line 116). The second call is a no-op that
  emits an SDK diagnostic warning; drop the in-body call or guard it.
- **F6 — nit.** `plugins/workers/worker/job-dispatcher_test.ts:963` hardcodes the parent span id
  `'b7ad6b7169203331'` rather than deriving it from `MESSAGE_TRACEPARENT` (line 48). If that
  constant is ever edited the assertion silently stops testing what it names. Extract a
  `MESSAGE_PARENT_ID` constant, as `trigger-runtime-parenting_test.ts` already does with
  `INBOUND_PARENT_ID`.

## Conclusion

The reviewed source diff meets issue #2393 — inbound queue, job-dispatch and trigger deliveries each
follow their own carrier or start a fresh trace, and the long-lived worker span is no longer a
fallback — without overreaching and without breaking deliberate local parenting (subprocess
continuation, queue→job nesting, trigger ingress→detect→process, nested handler work). Tests are
substantive: real SDK provider, real AsyncLocalStorage, real production entry points, and assertions
on parent span ids rather than trace ids alone.

**The reviewed source diff is suitable for S1 sign-off.** F1 should be fixed before the final pass;
F2 and F3 are recording obligations; F4-F6 are optional.

This is not a merge-readiness certification. The final evaluator must still assess the full E2E
evidence — the in-flight `scaffold.runtime` smoke, `quality:gate`, publish dry runs and the doc-lint
baseline comparison — in a later turn of this same session before `ready-merge`.

---

# S1 repair verification and sign-off — 2026-10-18

**Verdict: PASS_SLICE_REVIEW reaffirmed.** Same reviewer, same session: Claude **Opus 5**
(`claude-opus-5`, Anthropic), xhigh, session `0faa9365-3561-462c-96f1-45c3216cd292`. Product sources
were frozen for this turn; I edited no product source, no other docs, no lockfile.

## Source manifest verification

`receipts/source-manifest.json` lists exactly the eight files I reviewed — no more, no fewer — and
every recorded SHA-256 matches the working tree as reviewed:

| File | Manifest digest matches working tree |
| --- | --- |
| `packages/telemetry/README.md` | yes (`ec264ee3…`) |
| `packages/telemetry/src/context/message.ts` | yes (`c0ac968b…`) |
| `packages/telemetry/src/context/w3c.ts` | yes (`30b0bdd6…`) |
| `packages/telemetry/tests/context/message-parenting_test.ts` | yes (`9c6e6f72…`) |
| `packages/telemetry/tests/instrumentation/queue-parenting_test.ts` | yes (`58947b7c…`) |
| `plugins/triggers/src/runtime/trigger-runtime-parenting_test.ts` | yes (`361db3fe…`) |
| `plugins/triggers/src/runtime/trigger-runtime-processor.ts` | yes (`f4433047…`) |
| `plugins/workers/worker/job-dispatcher_test.ts` | yes (`8e529b14…`) |

Verified by recomputing `sha256sum` over each path, not by reading the manifest alone.

## Repair delta

Re-diffed against `a833dfa8`. The reviewed telemetry contract is unchanged by the repair: `w3c.ts`
and `message.ts` are byte-identical to what I passed, so findings 1-4 in the original review still
stand on the same code.

- **F4 — fixed, and it is now a real improvement, not a wash.**
  `trigger-runtime-processor.ts:240` passes `undefined` directly for a carrier-less event, so the
  `!headers → ROOT_CONTEXT` early return in `resolveParentContextFromHeaders` is reached rather than
  bypassed by an empty-string carrier, and `tracestate` is conditionally spread. Behaviour is
  unchanged (root for an absent carrier); the intent is now expressed in the code.
- **F5 — fixed.** `queue-parenting_test.ts` has a single `worker.end()`, in the `finally` block
  (line 115). The duplicate end and its SDK diagnostic warning are gone.
- **F6 — fixed.** `MESSAGE_PARENT_ID` is declared at `job-dispatcher_test.ts:48`, composed into
  `MESSAGE_TRACEPARENT` at line 49 and asserted at line 964. The assertion can no longer drift from
  the constant it is meant to test.
- **F2 — satisfied.** `release-note.md` states the published behaviour change for `extractContext`
  and its `getParentContextFromHeaders` alias, the preserved valid-parent/flags/tracestate
  guarantees, and the migration advice. I checked the symbols it recommends — `getActiveContext`,
  `withSpan`, `contextWithSpan` — all exist and are exported. It correctly labels itself a handoff,
  not a publication claim.
- **F3 — satisfied.** `drift.md` records both consumer consequences (`createStreamMutationHook` for
  executions without a stored traceparent; malformed saga parent carriers) and preserves the
  distinction that valid stored parents and deliberate local nesting are untouched.

### F1 — withdrawn by the reviewer, not by the implementer

My original F1 was wrong, and I am correcting it rather than crediting a fix. `deno.json` restricts
the formatter's `include` to `packages/**/*.{ts,tsx}` and `plugins/**/*.{ts,tsx}`, and `fmt:check`
runs `--ext ts,tsx`: **Markdown is outside the repository's formatter scope entirely.** My original
check named `README.md` explicitly on the command line, which escaped that configured scope, so the
"new drift" I reported was measured against a formatter the repo does not apply to this file —
which is also why the baseline looked equally unformatted. There was no gate drift to fix.

The implementer rewrapped the paragraph anyway; lines 87 and 91 are 101 and 102 columns, slightly
over the 100-column prose convention the surrounding file follows. That is a style preference, not a
finding, and nothing in the gate set measures it. `receipts/fmt.json` (122 files selected, 0
findings) is consistent with the ts/tsx scope and is not a false claim.

## Independent verification after the repair

Re-ran the targeted structured suite myself on the repaired tree — the trigger processor and two
test files changed, so the earlier run no longer covers them:

`{"passed":34,"failed":0,"ignored":0,"totalResults":34,"uniqueFailures":0}` — **exit 0**.
Report: `/home/agent/projects/orchid/runs/2026-10-18-worker-traces/reviewer-tests-repair.json`.

Author receipts read as corroboration only, not adopted as this verdict: `suites.json` (400 passed,
13 existing ignored, 0 failed, exit 0 across telemetry, workers-core, triggers-core, workers and
triggers), `check.json` (0 errors), `lint.json` (0 findings), `fmt.json` (0 findings),
`quality-receipt.json` (PASS).

## Gate placement

I accept the clarification recorded in `plan.md` and `drift.md`: per `AGENTS.md` the expensive
`scaffold.runtime` smoke is the S2 evaluator/merge-readiness gate, not a per-slice implementation
gate. No functional gate was removed — S1 still carries the complete affected suites, structured
source gates, `quality:gate` and this independent substantive review. The smoke is still running; I
did not run, interrupt, or inspect it for a verdict, and **it is not claimed green**.

## Sign-off

The repair delta introduces no new defect and no regression in the reviewed contract. The eight
reviewed files are suitable for the S1 sign-off commit, which I am taking as the independent
supervisor. **No final IMPL-EVAL and no ready-merge is issued here**: both remain open until the
S2 `scaffold.runtime` smoke terminates and the full evidence set is assessed in a later turn of this
same session.

**Sign-off housekeeping.** `git diff --check` on the staged set reported one trailing blank line at
EOF in the generated `leak-report.md`. I removed that single blank line — whitespace only, no
content altered — so the sign-off commit is clean. No other run artefact was modified beyond
`slice-review.md`, `worklog.md` and `context-pack.md`.
