# Independent S2 slice review

**S2 slice review, IMPL-EVAL round 3 of 5 (working tree since `9d2555a`, plus the whole feature)**

Evaluator: same session as the plan evaluation, `claude-opus-5-5`, high effort, read-only. I ran no tests, used no resources and made no edits. This is a sign-off before the S2 commit, not the review of the final pushed head.

### Scope
- No production TypeScript changed since `9d2555a`. `packages/queue/adapters/**` and `ports/**` have no diff, and the S1 code I reviewed is what was committed.
- The S2 changes are:
  - three new test files: `redis-dispatch-proof_test.ts`, `_fixtures/redis-concurrent-worker.ts`, `_fixtures/redis-scoped-env.ts`;
  - two doc clarifications stating that the bounds assume the connections are already established;
  - two carriers from the native generators: the MCP export corpus (the `queue` and `plugin-workers/./worker` rows) and the CLI agent-docs prose for `tune-worker-runtime`.
- Both carriers are recorded in drift as owned generated output. `tests/` is excluded from publish, so importing a telemetry test fixture across packages doesn't affect what ships.

### Test credibility
- **Concurrent crash.**
  - A real child process holds three receipts at once and heartbeats each one every 40 ms.
  - For 700 ms (more than twice the 300 ms visibility) the test calls `reclaimExpired` repeatedly. Throughout, processing stays at 3 and a competing consumer gets no deliveries.
  - After a SIGKILL of that exact child, all three message IDs come back with deliveryCount 2.
  - The old fences' `settle` and `extend` are refused: processing stays 3, the old extends return `false`, and `staleSettlements` is 6 (3 settles + 3 extends).
  - On baseline the child never fills three slots, so the test fails there. This is a sound test of lease safety under concurrency.
- **Idle pickup.**
  - The interval is set to 200 ms. Each sample is synchronized to an observed empty claim, then checked against an upper bound (interval + 100 ms) and a lower bound (p95 ≥ 150 ms).
  - The lower bound is what tells it apart from the hardcoded 50 ms poll. Measured values were about 201–203 ms on both backends.
- **Delayed pickup.**
  - Each sample is measured from the eligibility score actually stored in Redis, on the same client clock.
  - It asserts the message is never early (≥ 0) and stays within delayed poll + poll + 100 ms.
  - The environment case goes through the public `createQueue` factory, which proves generated workers can be tuned this way.
  - 120 samples in total: 20 × 3 profiles × 2 backends. The p95 is 35 ms (options) and 48–49 ms (env).
- **Trace parentage.**
  - Real `TracedQueue` on both backends, with two producers and two consumers overlapping slow and fast deliveries.
  - Each consumer's parent span is its own producer's span and they share a trace ID. The active span is still correct after an async await.
  - On baseline the serial dispatch makes the fast delivery miss its 500 ms window, so the test fails there.
- **Denied env access.** `--deny-env` on the two variables with `--no-prompt` really triggers `NotCapable`. The fixture's `listen` resolves the policy before returning for the already-aborted signal, so the env read does happen. This is correctly labelled a compatibility control that passes on baseline too.
- **Negative controls.**
  - Reverting to baseline production: S1 0 passed / 14 failed, S2 9 failed / 1 passed. That gives 23 red tests, with only the compatibility control staying green.
  - Six single-mutation runs produced 14 failures, each at the intended assertion:
    - the aborted settlement signal left the claim unsettled;
    - an immediate disconnect left the processing count at 2;
    - an unbounded drain timed out;
    - serial admission timed out;
    - a fixed delayed interval gave about 1.93 s against a 35–50 ms bound;
    - a fixed idle interval failed the lower bound.
  - The public evidence is sanitized: paths appear only as `<cwd>`, and I found no endpoints or session IDs.

### Gates
- The combined run was 193 passed, 0 failed and 3 skipped outside CI (196 results, exit 0). It covered the full queue suite, the worker Redis/Garnet recovery, survival and heartbeat tests, telemetry, and the MCP corpus and flow tests.
- check, lint and fmt pass over all 72 queue files, and `quality:gate` passes.
- JSR dry-run has 0 hard findings. Doc lint shows only the one `WatchableKv` private-type-ref inherited from baseline.
- The corpus, prose and publish freshness checks pass.

### Docs
- The README and tuning page now say the bounds apply once connections are established, and that the promotion client connects lazily, so startup or a reconnect can miss a pass. The ~1.9 s mutant observation is consistent with that.
- No unconditional SLA is claimed.

### Non-blocking
- The new README line ending "…being established. This is not an unconditional wall-clock SLA: saturated workers, outages," runs past the ~100-character wrap. It is cosmetic, and Markdown isn't under the package fmt gate.
- `packages/queue/deno.json`'s `test` task (`--allow-env ./tests/`) can't run the subprocess and backend suites. That was already true before this work, and the evidence correctly uses the structured wrapper with broader permissions.

### Required after the commit, before READY (not blockers now)
- Run `check:assets-barrel` immediately after the S2 commit; its final git diff must exit 0.
- READY must disclose that the fresh cockpit native-refresh/feed-compose p95 and the e2e-cli `scaffold.runtime` CI are UNPROVEN, and ask the coordinator for that CI run.
- The final IMPL-EVAL runs on the exact pushed head after the PR is marked ready. The PR body must start with `Refs https://github.com/rickylabs/netscript/issues/2351`, with no closing keyword.

S2-REVIEW: PASS
