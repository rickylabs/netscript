# Independent slice and implementation evaluation

Separate native Claude Opus 5.5 high session; read-only, stdin closed; round 1.

**IMPL-EVAL round 1 for #2390 (reproduction slice, baseline e4875a5, draft PR #2534): no blocking findings.** I only read files; nothing was modified, started or posted.

**Prisma/Postgres atomic flow** (`projected-receipt-flow.ts` with `projected-receipt-postgres.ts.template`)
- The test uses the real generated Prisma client inside a transaction, in an isolated schema that is dropped in `finally`. The saga, the projection with archiving off, and the command relay and worker sink are all first-party code. A real reference stream server and the real HTTP saga router and publisher sit at the edges.
- After the run it checks: one command, published, with an acceptance identity and `attemptCount=1`; two transitions; two applied keys.
- The single-instance GET goes through the indexed `findFirst`. Calls to `findMany` or `count` throw, so a scan would fail the test.
- `startSagaRunner` uses the projection it is given (`saga-runner.ts:144-147`).
- Raw provider output shows the test ran and passed: 1 passed, 0 failed, with the generated test file typechecked.

**Restart and replay**
- The producer writes `prior-document` first, so sequence zero is taken. The admission commit is checked at version 1 with zero worker calls.
- The producer and processor are then stopped. The KV singleton is reset, and a new epoch is claimed with an atomic compare-and-set before the receipt is handled.
- A third processor gets both messages again with queue deduplication off. It is checked for `{pending:0, processing:0, dlq:0}`, version 2, one command, one worker call, two stream events, and `sessions=3`.
- These restarts are rebuilt inside one test process, and the evidence says so. Nothing claims an OS kill or a deployed consumer.

**Physical stream readback**
- Inside the worker handler, the test reads the stream back and requires the exact two-event sequence and a moved offset before it publishes `RECORDED`.
- A worker retry could hide a failed readback. `workerCalls === 1` (flow lines 322 and 342) catches that case.
- `epoch-zero.json` confirms it: forcing `initialEpoch: 0` turns both provider tests red, with 2 worker calls against an expected 1. The refusal test stays green.

**KV path**
- One test checks that KV refuses registration of the atomic worker-command saga and writes no `sagas` rows.
- A separate test runs the supported path: stores are reopened for each runner lifetime, the job is dispatched twice, and worker idempotency suppresses the duplicate.
- It is clearly labelled "no atomic worker outbox", and no KV outbox was added.

**Canary.8 comparison**
- `drift.md` and `evidence.md` state that the full fixture does not compile against canary.8 because three APIs are missing.
- The unchanged probe run with `--no-check` fails at canary.8: only `receipt-0` exists after both writes are acknowledged. The same probe passes on main.

**Attribution**
- #2512 is described as compensation-retry tests and documentation only.
- #2482 is described as worker-listener budget recovery that "does not identify the original saga processor's unexplained exit cause".
- No cause is given for the original exits.

**Gates**
- Reproduction: 3 passed, 0 failed, 0 ignored.
- Neighbouring regressions: 81 passed, 0 failed, 6 backend-specific skips.
- Check, lint and fmt: zero findings. The check gate selected only the two test entrypoints; the fixtures are covered through their imports.
- `quality:gate`: exit 0. JSR audit: no FAIL, dry run succeeds, only existing warnings, no new exports.
- The CI driver gains one invocation (line 33) after the existing ones; nothing was removed.
- The run artifacts contain no concrete machine paths or session IDs.
- The full `scaffold.runtime` run is still a pending CI gate owned by the coordinator, which is not an implementation blocker.

Two non-blocking observations:
1. The check gate selected only the two test entrypoints, so the fixture files are typechecked only through their imports.
2. The readback assertion inside the worker handler cannot fail the test by itself. A worker retry can repair it, so the protection comes from the `workerCalls === 1` assertion. The epoch-zero control shows that assertion works.

VERDICT: PASS
