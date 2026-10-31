# Scoped CLI validation

Root fmt/lint config excludes packages/cli. The structured wrappers fail closed (all-excluded).
For explicitly owned CLI files pass --config with the run scoped-deno.json (root style/rules,
without broad selection exclusions). This checks both selected files, not a zero-file pass.
Use run-deno-check.ts --file ... and run-deno-test.ts -- --allow-all --unstable-kv <tests>.
The parity test imports .llm/tools via six parent components from public/adapters/agent.
