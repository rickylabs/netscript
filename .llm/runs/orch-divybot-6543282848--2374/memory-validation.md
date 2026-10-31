# Validation recipes and baseline

Use structured wrappers. Check wrapper includes --unstable-kv by default; it does not accept a --unstable-kv option (only --no-unstable-kv). Tests: deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv <test paths>. The CLI package is excluded by inherited root fmt/lint config even with explicit CLI targets. For the new CLI test, use a scoped copy of root fmt/lint options with only include/exclude removed; pass it through wrapper --config. Preserve all style and rule settings.

Full quality:gate passes at baseline and implementation. plugins/sagas full doc-lint has 30 preexisting private-type-ref diagnostics, reproduced with baseline source; the changed CLI entrypoint has zero diagnostics. JSR audit exits 0 with unchanged cardinality and slow-types notices. Do not call full doc-lint green.

Negative controls restore sources in finally and confirm exact bytes. Reverting generator rejects the new regressions; include an all-source baseline integration replay as stronger proof. Use targeted helper-inclusion and empty-rejection mutations for preservation requirements that already passed on main.
