**FAIL_PLAN**: Plan-gate boxes not checked: open-decision sweep, commit slices (no defined proof), gate set (no consumer gate).

**Blockers**

1. **The frozen-fixture mechanism hasn't been tested, and the plan depends on it.** The four fixtures write a temporary config whose import map doesn't match the committed lock's `workspace` section. It flattens the catalog, maps workspace packages to file URLs, and pins `npm:@prisma/client@7.10.0`. The lock only has `npm:@prisma/client@^7.10.0` and `npm:@opentelemetry/api@^1.9.1`. With Deno 2.9.7, `--lock <copy> --frozen` may report the lock out of date even when nothing has drifted. The plan's line "private lock copy can omit workspace metadata" is an assumption, not a result. The fallback, "add fixture-only specifiers to the committed lock", isn't durable either: specifiers the workspace doesn't reference can be pruned by the next lock update. Required:
   - Add a probe step before slice 2. On one fixture it should show a pass with no drift and a nonzero exit when drift is forced.
   - Choose the fallback now. Options: match fixture specifiers to existing lock keys (for example `@prisma/client@^7.10.0`), or declare fixture dependencies somewhere the workspace keeps them.

2. **The plan doesn't decide what happens to the Prisma generate steps.** All four fixtures run `deno run --no-lock -A npm:prisma@7.10.0 generate`. `npm:prisma` isn't in `deno.lock` at all, so its transitive dependencies are the same drift risk. Either freeze it or defer it with a stated reason.

3. **The negative controls aren't specified.** The issue requires a recorded control showing the fixture fails closed. The plan should define:
   - A drift case: a private lock with the `@opentelemetry/api` entry changed or removed, or a fixture specifier that resolves outside the lock, must fail with the frozen-lock error.
   - A unit test showing `locked-fixture.ts` passes `--lock <private copy> --frozen` and never `--no-lock`.
   - A check that the repo `deno.lock` is byte-identical after a fixture run.

4. **Published consumers aren't proven.** The plan keeps the lock at instrumentation 0.223.0, so the frozen CI path never runs the combination consumers actually get: `@orpc/otel` with instrumentation 0.300.x, whose API peer is `>=1.10.0 <1.11.0`. Required:
   - A lockless consumer gate, such as `deno task deps:prod-install` or a clean resolution of `@netscript/telemetry` and `@orpc/otel`, showing one API at 1.10.x and no `logs` export error.
   - A stated reason for `^1.10.0` over the owner's "1.10.x" (`~1.10.0`), since a future API 1.11 would fall outside instrumentation 0.300's `<1.11` peer range for consumers.

5. **What happens to the other temp-config writers is still open.** The issue says to find every fixture that writes a temporary config. The plan calls the rest a "safe bounded follow-up", and the authorized write surface covers only the database and saga tests. The plan must define how fixtures are classified and give each one a disposition: fixed in this PR, or a follow-up issue with a reason. Two that resolve externally, for example:
   - `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`, which pins `@opentelemetry/api@^1.9.1` and `@orpc/otel@^1.15.5`.
   - `packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts`.

   If any are fixed in this PR, the write surface in `supervisor.md` has to be widened.

**Checked and fine:** research is based on current main and consistent with the lock (API 1.9.1, instrumentation 0.223.0, `@orpc/otel` 1.15.5). The failing `plugins/sagas` test goes through the shared provider fixture, so it's covered. Single-API proof is planned, which also covers the `^1.9.0` lock key. Risks, deferred scope, publish dry-run and the JSR not-applicable rationale are all present.
