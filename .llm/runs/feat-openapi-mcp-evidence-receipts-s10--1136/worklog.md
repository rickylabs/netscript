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

## Gate results

Pending S1 implementation.

## Reconcile notes

- S0 pending commit/push/PR opening.

