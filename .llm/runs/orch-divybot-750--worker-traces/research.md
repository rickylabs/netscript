# Research

- Upstream #2393: 52,629 spans accumulate in a shared worker trace; each job/trigger delivery
  must follow its message context or start a fresh trace.
- Inbox #750 has no orchid-triage report. GitHub searches found no covering PR; #2136 concerns
  subprocess propagation and #559 trigger inbound parenting, both must remain intact.
- Re-baselined on current main `a833dfa8a3095bb6434cf7ae8bf24f954cf2f1bd`.
  This checkout was shallow: aborted an add/add-conflicted rebase, fetched full history, rebased cleanly.
- Consulted existing NetScript memory before product reads/building. Relevant notes: whole composed
  package suites, missing RTK, wrapper gate evidence, Aspire prerequisites require live verification.
- Root defect: `extractContext` seeds extraction with `context.active()`, then accepts any nonzero
  span. Without a propagator, a worker span masks even valid message headers. With a propagator,
  missing/invalid headers retain the active worker span. `resolveParentContextFromHeaders` and
  trigger processing independently retain ambient context for absent carriers.
- Existing scheduler cron dispatch already supports root context. Queue consumption activates its
  consumer span and `processWorkerJob` explicitly parents job.execute to that consumer or wire carrier.
- Public API inspection: `deno doc --filter extractContext packages/telemetry/context.ts`.
  No signature or dependency change is needed. Inbound extraction must use ROOT_CONTEXT, retaining
  valid remote trace IDs, flags and tracestate. Trigger events without a carrier need explicit root.
- Archetypes: telemetry integration (2), worker runtime (3), triggers plugin (5).
  Doctrine sections 01/08, archetype 3, gate matrix and plan gate consulted.
- JSR planned surface: existing exports only, explicit return types, no new runtime imports beyond
  already-declared OTel API; no slow-type or package metadata changes.
