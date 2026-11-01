# Focused validation recipe

Use the structured source wrappers with `--file` for changed TypeScript (exclude generated carriers from formatting). They need `--allow-write` when `--output` is specified; check already enables unstable-kv.

The combined regression command is:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/watchers packages/plugin-triggers-core/src/adapters/watchers-file-watcher-adapter_test.ts plugins/triggers/src/runtime/trigger-child-health_test.ts plugins/triggers/src/runtime/trigger-watch-health_test.ts plugins/triggers/src/adapter/resources/resources.test.ts packages/plugin/src/presentation/run-child-health-process_test.ts
```

After main #2481 integration this passes 55 tests, with no ignored tests on this worker. `quality:gate` is required beyond scoped wrappers. Use run-gate.ts for durable receipts. Native publish dry-runs pass for all three units. Run doc-lint once per root: repeating `--root` selects only the last one in that wrapper.

Native permission failure fixture needs POSIX filesystem permissions and a non-root process; it calls the real OS API. The host proved directory stat succeeds while native watch setup fails. Explicit skip guards apply only to systems where that fixture cannot enforce denial.
