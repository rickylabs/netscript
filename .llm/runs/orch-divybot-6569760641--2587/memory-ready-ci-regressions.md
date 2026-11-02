# Ready-transition scaffold regression traps

Core CI may be policy-skipped for drafts, then run all six shards when marked ready. A green
draft plus manual runtime does not prove the broader core test matrix. Inspect shard artifacts
`ci-check-test-shard-test-N-gate-receipts-<run>-<attempt>` and `test.report.json`. Job logs are
available with `gh api repos/rickylabs/netscript/actions/jobs/<job>/logs` even while other jobs run.

When adding service output, update `packages/cli/src/kernel/adapters/service/fixtures/collapsed-service.json`
for both Prisma and memory. Keep exact tree/rerun/persistence controls. Activity uses committed
`updatedAt`; generated CRUD test schemas must match Prisma Date timestamps. Do not remove the
activity field requirement to accommodate a fake schema.

Seed date clamping allows equal timestamps. An isolation test must compare the actual mutated
record across fresh repositories, not hardcode the status of a different newest row. Emitted
tests live in canonical templates; regenerate `embedded.generated.ts` with the full carrier chain.

The combined regression set uses the structured test wrapper with --allow-all and these modules:
route-templates_test.ts, service-handler-generated_test.ts, generated-browser-auth-policy_test.ts,
layered-scaffold_test.ts, record-activity_test.ts, workspace-pages_test.ts. All45 pass after repair.
