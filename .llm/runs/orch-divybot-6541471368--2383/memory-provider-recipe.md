# Compensation provider proof recipe

Use structured `.llm/tools/run-deno-test.ts --output <private-report> -- --allow-all --unstable-kv --frozen packages/plugin-sagas-core/tests/runtime/saga-compensation-retry_test.ts packages/plugin-sagas-core/tests/prisma-transition-postgres_test.ts`.
Set `NETSCRIPT_TEST_REDIS_URL` and `COMMAND_POSTGRES_SOCKET`, `PGUSER`, `PGPORT` to isolated run-owned providers. Set `SAGA_POSTGRES_TEST_FILTER=compensation` for the focused eight generated-client tests and `SAGA_POSTGRES_EVIDENCE` to a private raw evidence file. The outer report counts the generated PostgreSQL suite as one test; inspect its raw child summary to prove all eight ran. Apply command-store/migration.sql, runtime-migration.sql and command-replay-migration.sql from the existing command-postgres conformance gate before running.

The factory createPrismaSagaTransitionStore requires explicit finite transactionTimeoutMs. SagaTransitionStore has no public history reader; the test-only CompensationTestStore intersection adds the actual adapters' read-only transitions surface. Do not widen production ports just for assertions.
