# S2 fixture review, round 4

Separate same-session read-only evaluator; source fixture repair approved.
The additional generated docs carrier refresh is mechanical, validated by canonical
freshness checks and reserved for the final exact-head round-5 review.

**VERDICT: PASS.** The S2 fixture repair fixes the actual CI failure, keeps the test at least as strict, and I found no blockers, so it is approved for commit.

I made no writes, edits, git changes, comments, label changes or resource starts, and did not run the local scaffold runtime. Local `HEAD` is still `5acb515…`. The only uncommitted non-run change is `packages/plugin-sagas-core/tests/fixtures/transition-store/postgres-conformance.ts.template`.

**It matches the CI failure.** The failed log for run 41194298113 shows `command-postgres` failing only "PostgreSQL projected atomic runtime commits once and repairs projection without repeating worker intent", with 17 passed. The failure is "undefined, expected 1". That is the old `(row.state as {count}).count` read against the new nested document. The outer test's 1-vs-0 error is just its failed-test count.

**The test is stronger, not weaker:**
- **First check:** it now asserts the `projectionVersion` marker with an explicit Zod literal, then validates the row with the shared `parseSagaInstanceReadModel`. It deep-compares the whole business state `{ count: 1, status: 'business-pending' }` with the runtime `status` `running` beside it. The old single `count` check could not see the business `status` collision. The old writer would have overwritten it with `running`, so the new check fails against the old projection format.
- **Second check, after the next transition:** it also deep-compares business state and runtime status. It does not repeat the explicit marker check, but the parser would reject an old flat row anyway, since those lack required fields such as `sagaName`, `correlationId` and `createdAt`. Not a blocker.
- **Everything else is unchanged:** the version checks, the `counts()` intent/replay check `[2,2,2,1,1]`, the atomic rollback, stale-writer, SIGKILL and compensation tests, and the projection-failure/recovery flow.
- **Adding `status: 'business-pending'`** to the initial saga state does not change any handler or command behaviour.

**It will load in the generated project:**
- The new import uses the same `REPO_URL` substitution as the existing `saga-supervisor.ts` import, which `provider-fixture.ts:108` rewrites.
- `z` is already imported in the template.
- `saga-instance-projection.ts` type-checks on its own.

**No other stale readers:** the other template, `saga-relay-cohort.ts.template`, does not read `SagaInstance` rows. The other `sagaInstance` mentions I found are a doc example, the stream schema entity name and KV retention prefixes, and none assume the old flat format.

**Still unproven:**
- The live PostgreSQL run of this template. It is skipped locally without `COMMAND_POSTGRES_SOCKET`, so it needs the CI `command-postgres` rerun after the push.
- The external `scaffold.runtime` E2E, which the coordinator owns.

The exact final head after commit and push still needs the round-5 verdict.

VERDICT: PASS
