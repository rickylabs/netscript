# Scoped tooling gates

Check wrapper defaults to --unstable-kv; do not pass a wrapper --unstable-kv flag. Lint wrapper respects root lint.exclude, which excludes .llm/. To verify explicitly selected tooling files, pass --config with the same root lint.rules and no global exclusion. The wrapper fails closed on dropped files. Fresh UI and CLI tests can run from root with --unstable-kv through run-deno-test.ts.
