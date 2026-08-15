# S4 full export-map documentation audit stop

## Candidate-head evidence

- Immutable evidence head before this artifact-only record:
  `ee479ea851927818404c6311dac78e07a4eef1b5`.
- Product tree was clean before the audits. No product source was edited during S4.

The resumed ordered checks reached the full per-member export-map documentation audits after
formatting, lint, asset freshness, and exact-pin checks passed. The first genuine audit red occurred
there, so the slice stopped before the JSR audits, isolated-declaration/publish dry-runs, and binding
gates.

## Earlier passing steps

| Member | TypeScript format | TypeScript lint | Exact `@netscript/*` pins |
| --- | --- | --- | --- |
| CLI | PASS — 887 files, 1 batch, 0 findings | PASS — 887 files, 1 batch, 0 findings | PASS — 739 scanned files, 0 failures; 1 reviewed exact-target alias allowance |
| Fresh | PASS — 201 files, 2 batches, 0 findings | PASS — 201 files, 2 batches, 0 findings | PASS — 132 scanned files, 0 failures |
| SDK | PASS — 84 files, 1 batch, 0 findings | PASS — 84 files, 1 batch, 0 findings | PASS — 60 scanned files, 0 failures |

`deno task check:assets-barrel` also exited 0 and left the product tree clean.

## Full export-map audit results

### CLI — PASS

All 3 configured public entrypoints passed with 0 documentation diagnostics. Durable structured
output: `reports/doc-lint-cli.json`.

### Fresh — PRE_EXISTING_FAIL

The full 16-entrypoint sweep exited 1 with 45 deduplicated diagnostics:

- 28 `private-type-ref` diagnostics.
- 17 `missing-jsdoc` diagnostics.
- 0 other diagnostics.

Affected source files are:

- `src/application/route/_internal/contract-types.ts` — 8 private references and 17 missing JSDoc.
- `src/runtime/streams/mod.ts` — 7 private references.
- `src/application/query/query-types.ts` — 4 private references.
- `src/application/query/hooks.ts` — 4 private references.
- `src/runtime/streams/create-stream-db.ts` — 4 private references.
- `src/application/builders/mod.ts` — 1 private reference.

Durable structured output: `reports/doc-lint-fresh.json`.

### SDK — PRE_EXISTING_FAIL

The full 12-entrypoint sweep exited 1 with 3 deduplicated `private-type-ref` diagnostics:

- `packages/sdk/src/ports/query-client.ts` — `QueryClientPort` references private `QueryClient`.
- `packages/sdk/src/query-client/query-client-factory.ts` — `createNetScriptQueryClient` references
  private `QueryClient`.
- `packages/plugin-streams-core/src/application/create-durable-stream.ts` —
  `DurableStreamProducerOptions["instrumentation"]` references private `StreamsInstrumentation`.

The first two are the carried SDK root-entrypoint baseline. The third is the separate plugin-streams
diagnostic exposed only by the full export-map sweep through `packages/sdk/src/streams.ts`; it is not
folded into the two-diagnostic root-entrypoint baseline. Durable structured output:
`reports/doc-lint-sdk.json`.

## Attribution

The exact full Fresh and SDK wrapper commands were rerun in a temporary local clone detached at the
pre-implementation PLAN-EVAL verdict commit
`c53726c69b98a35bf293b89aeece12279f470be3`:

- Fresh: exit 1, the same 16 entrypoints and same 45 diagnostics (28 private references, 17 missing
  JSDoc).
- SDK: exit 1, the same 12 entrypoints and same 3 private-reference diagnostics, including the
  plugin-streams diagnostic.

None of the diagnostic-bearing source files differs between `c53726c69` and the candidate head.
Classification: **pre-existing audit failures**. They are not caused by this leaf and are not
silently repaired in this artifact-only slice.

## Stop boundary and sufficiency

Per the dispatch, the following remain NOT_RUN:

- Per-member JSR audits.
- Three isolated-declaration/publish dry-runs.
- All four binding gates.

No gate receipt was generated or edited. Exact contracted sufficiency is **INSUFFICIENT** because
every binding receipt is absent:

1. `receipts/s4-check.json` — invocation ID `app-service-client-wiring-s4-check`; missing / NOT_RUN.
2. `receipts/s4-test.json` — invocation ID `app-service-client-wiring-s4-test`; missing / NOT_RUN.
3. `receipts/s4-publish-dry-run.json` — invocation ID
   `app-service-client-wiring-s4-publish-dry-run`; missing / NOT_RUN.
4. `receipts/s4-arch-check.json` — invocation ID `app-service-client-wiring-s4-arch-check`; missing /
   NOT_RUN.
