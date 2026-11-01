# Final local gate recipe and limits

Structured package/runtime suite with NETSCRIPT_TEST_REDIS_URL and COMMAND_POSTGRES_SOCKET set:
`deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all
--unstable-kv --frozen packages/plugin-sagas-core plugins/sagas/tests/runtime
plugins/sagas/src/runtime` passed 256 tests, 0 failures, 2 intentional CI/optional-provider ignores.
The PostgreSQL provider wrapper includes six real generated-client tests, including both process
crash tests and ordinary per-write rollback; the full suite also runs relay/publisher provider tests.
Structured check/lint/fmt selected 178 files and returned zero findings. quality:gate (including
dependency and architecture gates) exited 0 through run-gate.ts. JSR dry-run audit passed.
Doc-lint remains inherited: core 7 private references (6 telemetry, 1 contracts), plugin 30.
Both counts were reproduced on the clean baseline, with no new private references.
No local scaffold.runtime was run; operator prohibits competing expensive suites. Coordinator must
arm e2e-cli CI because runtime wiring is affected. No label or milestone mutations are authorized.
