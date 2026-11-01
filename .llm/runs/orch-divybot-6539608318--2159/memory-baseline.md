# Baseline gates

Structured baseline command: `deno run --allow-read --allow-write --allow-run
.llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen
packages/plugin-sagas-core plugins/sagas/tests/runtime plugins/sagas/src/runtime`.
At 4060d1e: exit 0; 242 passed, 0 failed, 7 provider/CI-only ignored.
Native Redis and PostgreSQL binaries are available in prior private project runs, with Redis
requiring its extracted shared-library directory. Reuse binaries read-only and create fresh,
positively owned server data/configuration for this run. No Docker dependency is needed.
