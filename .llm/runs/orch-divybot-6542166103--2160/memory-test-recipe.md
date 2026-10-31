# Saga validation recipe

Full local scoped suite:
`deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen packages/plugin-sagas-core plugins/sagas`

This slice: 328 passed, 18 environment-dependent skips, no failures. New tests
are services/src/instance-read_test.ts and instance-query_test.ts. Performance
assertions count both keys even when the API rejects, via Promise.finally.
All four negatives restore production files exactly and fail (2 state tests,
3 KV read-count tests, 1 Prisma forbidden-list test). Do not leave reverted code.
No local scaffold.runtime: coordinator owns its e2e-cli CI label.
