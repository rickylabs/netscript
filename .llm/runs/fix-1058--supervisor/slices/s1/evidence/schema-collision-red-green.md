# Schema collision regression evidence

## RED — unmodified merge implementation

The tests were added before changing `db-integration.ts`.

```sh
deno test -A --filter 'dependency fragment' \
  packages/cli/src/kernel/adapters/plugin/db-integration_test.ts
```

Exit 1:

```text
copyPluginSchemasToRootDb rejects a dependency fragment that collides with a base declaration ... FAILED
error: AssertionError: Expected function to reject.
FAILED | 0 passed | 1 failed | 7 filtered out
```

```sh
deno test -A --filter 'deduplicates an identical' \
  packages/cli/src/kernel/adapters/plugin/db-integration_test.ts
```

Exit 1:

```text
copyPluginSchemasToRootDb deduplicates an identical base declaration ... FAILED
[Diff] Actual / Expected
-       written: true,
+       written: false,
FAILED | 0 passed | 1 failed | 7 filtered out
```

The first failure proves the old implementation silently wrote a different-body collision. The
second proves it wrote a redundant identical declaration instead of treating it idempotently.

## GREEN

```sh
deno test -A \
  packages/cli/src/kernel/adapters/plugin/db-integration_test.ts \
  packages/cli/src/public/features/plugins/install/install-plugin_test.ts
```

Exit 0:

```text
copyPluginSchemasToRootDb rejects a dependency fragment that collides with a base declaration ... ok
copyPluginSchemasToRootDb deduplicates an identical base declaration ... ok
installs a published Prisma fragment from JSR metadata into the root schema tree ... ok
rejects a DB-required JSR plugin that declares migrations without a published fragment ... ok
ok | 9 passed (21 steps) | 0 failed
```

The two named #1043 tests were not edited.
