**PASS**: the plan is cleared for implementation.

All five round-1 blockers are fixed in `plan.md` under "PLAN-EVAL round 1 repairs" and backed by repo evidence:

1. **Frozen mechanism:** the native-metadata rebase probe was run. A copied lock passes under `--frozen`, and a forced new API requirement fails. The helper takes only the workspace metadata from that rebase and restores the dependency graph from the committed lock. The reason a raw copy fails is recorded in `memory-frozen-fixtures.md`.
2. **Prisma CLI:** it is frozen by declaring it as a devDependency through the catalog. `packages/database/package.json` is outside the JSR publish include, and `plugins/workers` already uses the same devDependencies pattern. Client maps go back to the existing lock key, `^7.10.0`.
3. **Negative controls:** the plan now defines a success case, an absent-API failure, a corrupted-integrity failure, and a byte-identical check on both locks. It also checks that generation and test/check both use the returned frozen arguments.
4. **Published consumers:** the catalog moves to `~1.10.0`, with the instrumentation 0.300 `<1.11` peer as the stated reason. A separate clean consumer gate covers the combination consumers actually get: `@orpc/otel` 1.16.1, instrumentation 0.300.0 and API 1.10.0.
5. **Inventory:** every writer has a disposition. The write surface in `supervisor.md` is widened to cover the streams fixtures and the CLI postgres-normalizer fixture. Flow-B and desktop are confirmed frozen already.

**For IMPL-EVAL to check** (not blockers):

- **Reference locks:** if `packages/cli/e2e/fixtures/desktop-native/deno.lock` or another E2E reference lock changes, run its gate and ask for the e2e-cli verdict in READY. The coordinator arms that label. The plan only says "refresh required reference locks"; it should name which locks change, or say none do.
- **Streams lock key:** `plugins/streams/src/adapter/resources/resources.test.ts:166` hardcodes `npm:@opentelemetry/api@^1.9.1`. Once frozen, that key has to exist in the lock or follow the catalog, or the fixture will fail even though nothing drifted.
- **Stale text:** the Risks line "private lock copy can omit workspace metadata" and the Open-decisions "follow-up" line are superseded by repairs 1 and 5. Update them so the plan doesn't contradict itself.
- **Inventory edge cases:**
  - `installation-secret-sdk-compile_test.ts` is listed as "synthetic", but it pins `npm:vscode-jsonrpc@8.2.0` under `--no-lock`. That is acceptable as a version pin.
  - Some checked-in configs also run `--no-lock` with exact pins, such as fresh's `query-hydration-*` and `streamdb-consumer-deno.json`. These aren't temporary-config writers, so they are outside the issue's scope.
- **Control evidence:** record the negative-control results in the run directory with their exit codes, because the issue requires that.
