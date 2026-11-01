**Blocked: three fixes needed before slice sign-off.** The telemetry choice itself holds up. Pinning instrumentation 0.223.0 through the catalog, plus the explicit side-effect import in `tracing-plugin.ts`, keeps the pin in the published graph. It stays within what the owner authorized, and `consumer-peer-control.ts` shows both the pinned run passing and the forced 0.300 run reproducing the missing `logs` export.

**Blockers**

1. **The overrides force versions outside the requested range, and one of them is now in a checked-in lock.** When a package has only one recorded version, `prepareLockedFixture` overrides it by bare name, whatever range the fixture asks for.
   - **The bad lock entry:** `packages/cli/tests/fixtures/postgres-normalizer/deno.lock` records `npm:dotenv@^16.4.7 → 17.4.2`, which `^16` doesn't allow. dotenv 17.4.2 only exists in the lock because this PR added Prisma's CLI dependency tree.
   - **What the test misses:** the normalizer test never runs the generated consumer's real `dotenv ^16` contract.
   - **Stale README:** re-running the README's own refresh recipe would resolve dotenv 16.x, so that lock can't be reproduced from its documentation. The same mechanism silently pins the 0.0.8 consumer's `@orpc/otel` to instrumentation 0.223, so the README's claim that this lock records "the published dependency graph" isn't true either.
   - **Fix:** never override across the requested range. For example, key single-version overrides by major (`name@^M` / `~0.m` for 0.x), as already done for multi-version packages. Then record any version a fixture really needs (here dotenv 16.x) with the README recipe, and review that delta.

2. **The lock-churn disclosure is inaccurate.** The worklog and gate row say the native Fresh UI lock update "preserves existing package versions/hashes". In both `deno.lock` and `packages/fresh-ui/deno.lock`:
   - `@prisma/debug@7.8.0` is removed, and `@prisma/driver-adapter-utils@7.10.0` now resolves `@prisma/debug@7.10.0`.
   - Because `prisma` is now a satisfied optional peer, the `@prisma/client`, `better-auth` and `@better-auth/prisma-adapter` peer IDs change. Their contexts now include `prisma`, `react-dom` and `@types/react`.
   - 115 npm entries are added, including Prisma's CLI tree with `scripts: true`.

   The owner requires the PR to say why lock churn is needed. Correct the worklog and gate summary, then state these deltas and their cause in the PR.

3. **The fail-closed check the run record relies on has no test.** `locked-fixture_test.ts` only shows frozen execution failing after the config is changed post-preparation. Nothing exercises the guard that throws when preparation resolves an unrecorded version or integrity, yet the worklog cites it as negative-control evidence. Real drift goes through preparation, so a regression there would accept new versions silently.
   - Add a test that calls `prepareLockedFixture` with a requirement absent from every committed lock. Use a package that isn't in any lock, since the overrides pin anything single-version. Assert the "absent from the committed lockfile" error and that the repository locks are byte-identical.
   - Preferably also add a "stays pinned" control: an open-ended instrumentation range (`>=0.203.0`) should prepare to 0.223.0.

**Checked and fine:**
- Version and integrity validation over the combined root, Fresh UI and fixture locks, including jsr and remote hashes.
- The exact JSR self-mappings.
- The 7.8 → 7.10 adapter template fix.
- The nested saga child's `--frozen`, which inherits `lock.frozen` from the temporary config.
- Writing temporary config before Prisma generation.
- Recording the integrity-tamper limitation honestly instead of claiming it.
- Leaving the baseline `quality:gate` and doc-lint failures unclaimed.

One non-blocking note: in `provider-fixture.ts`, the new filter means the `specifier === 'catalog:'` branch can no longer run.
