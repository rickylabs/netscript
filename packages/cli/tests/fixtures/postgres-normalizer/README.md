# Generated PostgreSQL normalizer reference

This fixture records dependencies reached through the generated normalizer's published package boundaries. It supplies additional recorded versions to `postgres-normalizer_test.ts`; execution uses the shared fixture policy and compatible pins, rather than claiming an unchanged registry-selected graph. The test combines these recorded resolutions with the maintained root and Fresh UI locks, adapts native peer IDs, and rejects any unrecorded version or integrity before executing frozen.

`probe.ts` covers the generated config's published boundaries and Prisma's dynamic configuration loader. When changing the generator's dependency or release contract, refresh this reference deliberately with Deno and review the version delta:

```sh
deno install --config packages/cli/tests/fixtures/postgres-normalizer/deno.json --lock=packages/cli/tests/fixtures/postgres-normalizer/deno.lock --lockfile-only --frozen=false --entrypoint packages/cli/tests/fixtures/postgres-normalizer/probe.ts
```

Run the structured test wrapper on `packages/cli/src/kernel/templates/database/postgres-normalizer_test.ts` afterwards. The normal fixture run never refreshes this checked-in lock.
