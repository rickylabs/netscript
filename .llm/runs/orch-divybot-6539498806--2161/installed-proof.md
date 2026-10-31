# Installed-project reproduction

## Result

Maintainer init and both official plugin installs succeeded. With a marked factory in triggers/ and workers/jobs/ plus one valid definition in each folder, generate plugins exits 0 and writes both registries. Plugin doctor exits 0 and names triggers/factory.ts and workers/jobs/factory.ts as explicitly excluded modules.

The committed installed-startup-smoke.specimen.ts was copied as installed-startup-smoke_test.ts into that generated project and run through the structured test wrapper. Both production startup APIs reach ready with registryReady and dependencyReady true. The test uses isolated in-memory Deno KV and a temporary streams HTTP test double; it performs no durable-stream behavioral verification. The wrapper reports one test passed, no ignored tests, exit 0, and normal resource/operation sanitizers pass. It aborts both runtimes and closes its test dependencies.

## Reproduce

1. From repository root, run the maintainer CLI init with --db none --no-git --ci --yes and a scratch parent beneath the checkout. Keep Aspire scaffolding present; do not restore or start Aspire.
2. Add valid trigger and schema-backed worker definitions, using the same shapes as the installed-runtime-registry-integration_test.ts fixtures. Add factory-only helper modules whose first line is // @netscript-registry-ignore.
3. Install trigger and worker with --name triggers/workers, --no-db, --no-samples and --force. Run generate plugins and plugin doctor against that project root. Both commands use packages/cli/bin/netscript-dev.ts in the repository.
4. Copy installed-startup-smoke.specimen.ts from this run directory to the project root as installed-startup-smoke_test.ts. Invoke .llm/tools/run-deno-test.ts with --cwd <project> -- --allow-all --unstable-kv installed-startup-smoke_test.ts and NETSCRIPT_TELEMETRY_ENABLED=false.

The generated project and raw logs remain ignored/local. The full scaffold.runtime suite was not run locally; its CI verdict remains a separate coordinator-owned merge requirement. The focused committed source tests prove path-specific failures for unmarked factories, standalone-writer parity, plugin-provided job directories and read-only doctor behavior.
