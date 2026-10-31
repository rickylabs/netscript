# Worklog

## Design

1. Public surface: same adapter contract registration; test-only completion assertions change.
2. Vocabulary: completion = iterator done with no batch; hang guard = generous failure deadline, never a latency target.
3. Ports: WatchableKv, AsyncIterator, AbortSignal, optional ready; @std/async deadline.
4. Constants: replace ABORT_BUDGET_MS with ABORT_TIMEOUT_MS (5 seconds) and ABORT_DEBOUNCE_MS (60 seconds); queue uses matching named constants.
5. Commit slices: bootstrap (run artifacts, plan review); test correction (contract + queue test, scoped wrappers and stress); close evidence (run artifacts, evaluator).
6. Deferred scope: production behavior, unrelated elapsed-time tests, CLI E2E by explicit owner instruction.
7. Contributor path: packages/kv/src/testing/watchable-kv-contract.ts.

## Routing

Read feature routing through agentic:matrix --tier feature --json. Owner override, verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Implementation effort medium is also owner-requested.

## Bootstrap

Assignment read in full. Memory consulted; MCP guidance/search consulted. Baseline equals fetched main. No covering PR found. PLAN-EVAL pending; implementation has not begun.

PLAN-EVAL round 1 FAIL_PLAN: accepted both blockers. Plan now locks a 60-second debounce versus 5-second hang guard and isolated negative-control snapshot. Queue push/microtask ordering carries exact mid-window coverage. No implementation begun.

PLAN-EVAL round 2 PASS before implementation. Constants locked: ABORT_DEBOUNCE_MS=60000, ABORT_TIMEOUT_MS=5000. Implementing clean completion plus terminal next after a post-abort write and queue microtask ordering.

## Gate evidence

| Gate | Result |
| --- | --- |
| Structured focused tests (6 files) | exit 0; 90 passed, 0 failed, 0 ignored |
| 20 sequential runs under two CPU workers | each exit 0; 9 passed, 0 failed, 0 ignored |
| Four simultaneous runs under the same CPU workers | each exit 0; 9 passed, 0 failed, 0 ignored |
| Scoped structured check / lint / format (2 files) | all exit 0; no findings |
| deno task quality:gate | exit 0; pre-existing warnings, no failures |
| deno task doc:lint --root packages/kv --pretty | exit 0; all four export entrypoints |
| Isolated negative control: Redis delay signal removed | exit 1; both targeted abort tests fail with TimeoutError |
| CLI E2E | not required, owner test-only exemption |

Privacy-safe command results, per-trial counts/durations, source hashes, and mutation failures: evidence.json. Raw wrapper outputs remain in private run output because their cwd is absolute. The JSON is a result transcription, not a durable run-gate receipt.

Reproduction: set NETSCRIPT_TEST_REDIS_URL to a real Redis service. Run `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen` with kv-conformance_test.ts, redis-internals_test.ts, watch-initial_test.ts, watch-review_test.ts, watch-confirm_test.ts, and watch-reorder_test.ts under packages/kv/tests/. Stress uses the same wrapper plus `--filter '/aborting during|ends an active debounce|idle abort/'`: 20 sequential processes, then four concurrent processes, with two independent CPU workers active throughout. Negative control uses an isolated archived tree with only the Redis queue's `delay(debounceMs, { signal })` changed to `delay(debounceMs)`; filter `/RedisKvAdapter contract: aborting during|ends an active debounce/`. Both negative failures are TimeoutError (not skipped cases or connection errors).

## Sibling sweep

Memory and Redis use the corrected shared abort scenario. Deno KV idle/pre-start abort scenarios in watch-initial_test.ts and lazy adapter cases in watch-review_test.ts already use 5-second hang-only deadline waits. No equivalent tight debounce/abort budget remains there. Queue internals had the additional 100ms deadline, now fixed. Delivery/coalescing windows, TTL checks and Redis connection retry tests are different contracts and unchanged. Existing optional-readiness-free registration tests also pass. No production defect found.

## Reconcile

Fetched main equals the starting baseline; #2525 is included. Only the declared test harness, queue test, and run artifacts differ. deno.lock is unchanged. No merge, labels or milestone mutation.

Independent substantive slice review / IMPL-EVAL round 1 PASS, no blockers. Applied the reviewer's optional guard-start improvement: retain the raw pending next() promise and start its hang guard only after abort. This also avoids an unobserved timeout during failed setup. Re-running source-bound gates and stress proof for the final test bytes.

The first final-source rerun was launched after the run-owned Redis had already been stopped; that launch failed connection setup and is excluded from the proof set. Restarted the same isolated provider, then ran the complete 20+4 proof set afresh. This is test environment setup, not a production defect. Run-owned CPU workers are terminated in the proof runner's finally block; the isolated Redis is shut down after validation.

Final-source rerun complete: focused 90/90, all 24 stress processes 9/9 with no ignored tests, scoped check/lint/fmt pass, isolated negative control 0 passed / 2 expected TimeoutError failures. Evidence source hashes match final bytes. Review-thread gate PASS: 0 threads, 0 unanswered.
