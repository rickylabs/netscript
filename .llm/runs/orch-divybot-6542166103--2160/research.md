# Research

Re-baselined against current main abe9d3e4303411544502ceb519f39a09d3723fcd.
No existing PR or orchid-triage comment covers #2160. NetScript MCP find_guidance
then search_docs were consulted; guidance reinforces core store ports and thin
plugin/API adapters. The atomic transition and compensation changes are present.

- `saga-instance-projection.ts::projectionState` spreads business state before
  assigning status, identifiers and metadata; KV and Prisma both consume it.
- KV GET calls listSagaInstanceKv, scans all rows, sorts, then finds the match.
- KvSagaStore.findByCorrelation and load already each perform one get, with
  envelope date decoding; these are the required read seams.
- Prisma SagaInstance has an index on (sagaName, correlationId), not a unique
  constraint. findFirst with that predicate and no sort is one indexed query.
- Durable backend and projection backend are independent: KV projection can
  accompany a Prisma canonical store. The service must inject its selected
  canonical store rather than assuming every KV projection uses KV persistence.
- Existing Prisma API mapper mixes record columns into business state and reduces
  every non-completed status to running. New projections can use an unambiguous
  nested business-state payload while retaining runtime JSON status for #2382.
- Contract already separates top-level state and status; no new endpoint needed.
- lastMessageType is optional and absent from the canonical envelope; direct reads
  must not scan history or perform a third read just to synthesize it.

Doctrine archetypes 3 (core runtime) and 5 (plugin). Existing verdict: keep both;
runtime conventions belong in core. No new persistence port required.
JSR surface scan: no new package exports planned; any exported helper gets an
explicit return annotation and JSDoc. Existing export maps/version unchanged.
No dependency change. Slow types and existing publication issues will be checked
with package audit/doc-lint rather than inferred from successful local tests.
