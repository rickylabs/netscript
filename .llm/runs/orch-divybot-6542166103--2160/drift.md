# Drift

- Tool availability: RTK absent; focused raw commands are the documented fallback.
- Owner-selected evaluator override: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
- Allowed docs surface corrected after discovery to docs/site/durable-workflows/sagas.md
  and docs/site/reference/sagas/index.md if needed; initial docs/pages path does not exist.
- PLAN-EVAL identified project-file/processor overrides as a wiring risk. Add
  plugins/sagas/src/runtime/saga-runner.ts to S1: expose and reuse its existing
  settings loader for API and runner (including context-provided settings), rather
  than introduce a second settings reader. Test this from instance-query_test.ts.
  The data flow and owned file surface remain in the assigned saga runtime/API.
- Scoped type-check found two existing publish-boundary test DB fakes that require
  the new findFirst method: tests/services/publish-http-boundary_test.ts and
  tests/services/duplicate-publish-http_test.ts under plugins/sagas. Add only that
  method; no publish behavior changes. The planned source inventory remains <30.
- Atomic recovery test asserts the complete old Prisma document. Update only its
  expected persisted shape in saga-projection-atomic_test.ts; retain all command,
  transition, replay and failure assertions from #2499.
- IMPL-EVAL round 1 FAIL_FIX found the stream startup reconciler reading the old
  Prisma payload. Add plugins/sagas/streams/producer.ts and
  plugins/sagas/streams/producer_reconciliation_test.ts. Share the runtime
  read-model parser with the HTTP mapper so both readers honor the explicit
  projection version. Add a negative control restoring the old stream mapper.
  This repairs a direct consumer of the changed persisted format, within owned
  saga read models; no #2382 status-list/query work is introduced.
- Exact-head CI at 5acb515 found command-postgres red: the generated-client
  postgres-conformance.ts.template still asserted flat row.state.count at two
  projection checks. Latest main run of that workflow (41152000845, a410a815)
  passed; the PR's failure is specific to the intentional JSON-format migration.
  Update only that saga-core fixture's projection assertions, preserve transaction,
  replay and compensation tests, and add a business-status collision assertion to
  the real PostgreSQL projection scenario. This is an S2 validation repair within
  the assigned core read-model surface. Full runtime E2E remains coordinator-owned.
- CI quality failed agent-docs-prose freshness because the sagas migration page
  changes its CLI-shipped Markdown twin. Extend the mechanical S2 generation
  surface to packages/cli/src/kernel/assets/agent-docs-prose.generated.ts,
  its dependent CLI publish-asset carriers, packages/mcp/src/publish-assets.generated.ts
  and .llm/assets/agent-docs/provenance.json only if the canonical generators
  actually change them. Use gen:agent-docs-prose then gen:publish-assets; inspect
  every output and retain only semantically required generated changes. No gate
  policy/label changes or local scaffold runtime.
