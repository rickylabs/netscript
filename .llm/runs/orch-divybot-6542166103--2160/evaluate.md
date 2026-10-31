# IMPL-EVAL round 2 / S1 substantive slice review

Separate read-only Claude Opus 5.5 high evaluator; same session as round 1.
Supervisor transcription of evaluator output follows. Final exact-pushed-head
confirmation will be posted to the PR and final READY report without another
commit that would invalidate that reviewed head.

**VERDICT: PASS.** The round-1 blocker is fixed and I found no new code blockers, so S1 is approved for its implementation commit.

I made no writes, edits, git changes, comments, resource starts or label changes, and I did not run the local scaffold runtime. The read-only checks I did run:
- The new stream reconciliation test, `instance-read_test.ts` and `instance-query_test.ts`: 19 passed, 0 failed, run with `--no-lock` so `deno.lock` stayed unchanged.
- `git diff --check`: clean.

**The fix, B1 (stream reconciler reading the old Prisma format):**
- **Versioned rows:** `mapSagaRecordToEntity` (`plugins/sagas/streams/producer.ts:152-169`) now checks `SAGA_INSTANCE_PROJECTION_VERSION` and validates the row with the same `parseSagaInstanceReadModel` the HTTP mapper uses. The stream entity gets the nested business `state`, the runtime status (including `compensating`), `lastMessageType` and the dates. Unknown keys such as `projectionVersion` are dropped, so they never appear in the entity.
- **Live and restarted streams now match:** both produce the same entity shape, so business fields no longer move after a service restart.
- **Legacy rows:** the existing code path is unchanged for rows without the marker.
- **Test:** `producer_reconciliation_test.ts` writes a row through the real `PrismaSagaInstanceProjection`, round-trips it through JSON, then reconciles it. Business state with colliding `status`, `metadata`, `state` and `lastMessageType` fields comes back verbatim, beside the runtime status `compensating`, version 3 and message `PaymentFailed`. A second test covers legacy rows. You report that the old mapper fails this test.
- **Drift:** `drift.md` records `producer.ts` and the new test file before the edit, with the reason.

**No regressions from the repair:**
- Moving the schema into `saga-instance-projection.ts` is safe: `zod` was already a dependency of `plugins/sagas`. The new exports are not re-exported from `src/runtime/mod.ts`, `streams/mod.ts` or `mod.ts`, so the package's public surface is unchanged.
- `parseSagaInstanceKv` now calls the shared parser with the same schema, so validation of HTTP GET and list results is unchanged.
- Everything confirmed in round 1 still holds:
  - KV GET does exactly two KV gets: correlation index, then envelope.
  - A Prisma projection GET is one indexed `findFirst`.
  - All six store/projection combinations go through the shared settings loader.
  - The #2499 atomic/replay/transition seam and #2512 compensation are untouched.
  - No #2382 work: `$.status` stays at the top level, so list filtering is unchanged.
  - I saw nothing in the diff that would add a doc-lint finding (plugin 30 / core 7 baseline).

S1 may be committed. That is not permission to merge. The required `scaffold.runtime` verdict is still unproven until the coordinator arms the e2e-cli CI gate and it reports, and that must be named in READY. External CI and the review-thread check have not run yet. The final review of the exact pushed head is the next round in this session.

VERDICT: PASS
