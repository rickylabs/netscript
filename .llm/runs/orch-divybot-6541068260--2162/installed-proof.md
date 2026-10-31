# Installed empty-plugin acceptance

A fresh no-database local-source project was initialized with Aspire files present. No AppHost
was restored/started and no local full runtime suite was run. Commands used the maintainer CLI
`deno run -A packages/cli/bin/netscript-dev.ts` from the repository root.

| Step (each uses the generated project via --project-root) | Result |
| --- | --- |
| init empty-clean --path .llm/tmp/issue-2162 --db none --no-git --ci --yes | exit 0 |
| plugin install sagas --name sagas --no-db --saga-store-backend kv --no-samples | exit 0 |
| plugin install workers --name workers --no-db --no-samples | exit 0 |
| plugin install triggers --name triggers --no-db --no-samples | exit 0 |
| generate plugins | exit 0, 3 written |
| plugin doctor | exit 0, empty registry warning for each plugin, no error |

Copy empty-startup.specimen.ts from this run into the generated root as empty-startup_test.ts,
then invoke the structured test wrapper from the repository root:

```sh
NETSCRIPT_TELEMETRY_ENABLED=false deno run --allow-read --allow-write --allow-run \
  .llm/tools/run-deno-test.ts --cwd .llm/tmp/issue-2162/empty-clean \
  -- --allow-all --unstable-kv empty-startup_test.ts
```

Result: **1 passed / 0 failed / 0 ignored, exit 0**, normal resource/operation sanitizers enabled.
All three generated registries import with zero entries; workers definitions also has zero.
The actual startSagaRunner, startTriggerProcessorRuntime and startCombinedProcess exports start
against isolated in-memory Deno KV. Saga snapshot is running with definitionCount 0. All three
child snapshots reach state ready with registryReady true and dependencyReady true. Abort/stop,
awaited runtime completion, KV close and streams shutdown release owned resources.

Workers requires a streams reference even with zero jobs: the test supplies an isolated HTTP
streams test double. This proves empty-registry production startup and dependency/readiness
handling; it does not prove durable streams behavior or Aspire orchestration. **Aspire acceptance
and the full scaffold.runtime CI verdict remain unproven until coordinator-armed CI supplies them.**

An earlier scratch fixture was polluted by sync plugin copying official sample jobs; it was not
used as the final empty proof. Fresh init + no-samples installs avoids this. The failed intermediate
startup type-check discovered the empty Object.entries inference bug, now fixed in both writers.
