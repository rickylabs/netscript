# Worklog — F4a introspection receipt acceptance

## Design

### Public surface

- No new export or entrypoint.
- Existing public `createMcpCliServer()` JSON-RPC calls are the acceptance surface.
- Existing public `recordDrift()` semantics remain command-agnostic for F4a.

### Domain vocabulary

- Reuse `DiagnosticEvidenceReceipt`, `DiagnosticEvidencePort`, `ServiceEndpointDirectoryPort`, and
  the existing `diagnostic_evidence_required` / `tool_result_too_large` outcomes.
- Add no F4b `evidenceKind` or operation-key vocabulary.

### Ports and adapters

- Production composition remains unchanged.
- Tests inject the existing public diagnostic-evidence and service-directory ports, then exercise
  the real CLI composition and MCP runner.

### Constants

- No new finite domain value is introduced. Existing tool names and protocol codes remain the
  authoritative constants.

### Commit slices

| Slice | Proof | Gate | Files |
| --- | --- | --- | --- |
| S0 | Plan locked before source work | milestone composed plan gate | run-dir artifacts |
| S1 | F4a acceptance plus public post-validation negative | focused/public-path tests + full Archetype-2 column | evidence flow guidance, evidence tests, run artifacts |

### Deferred scope

F4b receipt keys and endpoint-shape-specific requirements remain deferred one field wave per the
ratified RFC. They are not latent abstractions in this slice.

### Contributor path

Start at `createMcpCliServer()` to see which flows settle receipts, then read `recordDrift()` for the
shared gate. Add evidence classes by composing the existing lifecycle and proving them end to end in
`tests/drift-evidence_test.ts`; do not special-case commands unless a future issue introduces a
typed evidence-class contract.

## Evidence log

| Date | Phase | Result | Evidence |
| --- | --- | --- | --- |
| 2026-08-04 | dependency | PASS | `origin/main` `3677973b`; focused S8 suite 14 passed / 0 failed |
| 2026-08-04 | JSR baseline | PASS | doc-lint wrapper exit 0; publish dry-run success; no slow types |
| 2026-08-04 | plan-gate | COMPOSED | composed per `milestone-run.md` (orchestrator waiver); plan locked |
| 2026-08-04 | S0 | PASS | `1282ee551`; explicit-refspec push; draft PR #1233 opened |
| 2026-08-04 | implementation | PASS | Public JSON-RPC proves acceptance and post-execution rejection replaces stale green evidence |
| 2026-08-04 | focused tests | PASS | `drift-evidence_test.ts`: 11 passed / 0 failed |
| 2026-08-04 | package tests | PASS | `packages/mcp` `deno task test`: 109 passed / 0 failed |
| 2026-08-04 | static | PASS | configured scoped check/lint/fmt: 103 files each, 0 findings |
| 2026-08-04 | quality | PASS | root `quality:gate` exit 0; focused MCP scan: 0 findings / 0 allowances |
| 2026-08-04 | doctrine | PASS WITH BASELINE NOTE | no changed-file violation; focused reporter only flags existing cardinality and a local fixture function named `describe` |
| 2026-08-04 | JSR final | PASS | doc-lint exit 0; raw publish dry-run succeeds; public surface unchanged |
| 2026-08-04 | opposite-family review | PASS | Claude Opus ordinary slice review; F1 documentation gap actioned before sign-off |
| 2026-08-04 | evaluation handoff | COMPOSED PASS | independent reviewer verdict relayed in the PR; supervisor did not self-certify |
| 2026-08-04 | lifecycle | READY-MERGE | PR non-draft; DoD/evidence mapping complete; final-head mirror/check run triggered after this record |

## Gate results

- **Contract / public API:** unchanged. No export, schema, dependency, receipt key, or evidence-class
  discriminator was added.
- **Runtime + consumer path:** public `createMcpCliServer()` JSON-RPC calls demonstrate both sides
  of F4a. A successful `list_api_services` receipt authorizes `record_drift`; an oversized
  `get_operation_schema` result is rejected by the shipped central runner, replaces an earlier
  green receipt with exit status 1, and leaves `record_drift` refused.
- **Check / lint / fmt:** all pass with `packages/mcp/deno.json`; the unconfigured wrapper attempts
  could not parse the root workspace form and are tooling invocations rather than verdicts.
- **Quality / doctrine:** changed code adds no ignore, cast workaround, allowance, or debt. The
  focused doctrine reporter's A14 failure is a baseline regex false positive on a local
  `const describe = ...` fixture in `service-endpoint-sources_test.ts`, not a Jest global.
- **JSR:** raw `deno publish --dry-run --allow-dirty` is authoritative and succeeds. The audit
  helper mistakes its informational `Checking for slow types...` banner for a warning; no actual
  slow-type warning is present.
- **Lock hygiene:** the pre-existing one-line `deno.lock` diff remains unstaged and untouched.
- **F4b exclusion:** no per-evidence-class receipt keys or endpoint-shape drift predicate exists.

## Reconcile notes

- S0 and S1 are committed and explicitly pushed; PR #1233 is non-draft at `status:ready-merge`.
- S1 opposite-family review: PASS. Its F1 finding was actioned by updating the hand-authored site
  reference; the package README mirror remains deferred with its generated publish asset.
- The final evidence push is deliberately after applying `status:ready-merge`, allowing the live
  acceptance mirror to tick issue #1136 and the close-gate to evaluate the final head.
