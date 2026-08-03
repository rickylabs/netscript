# Worklog: OMB S8 existing-machinery correctness fixes

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-truncation-receipt-ordering--s8` |
| Branch | `fix/mcp-truncation-receipt-ordering` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- No new or changed package export. `.` and `./cli` retain their current symbol sets.
- Existing `createMcpServer`, `createMcpCliServer`, `truncateResult`, `TruncationPolicy`, and
  diagnostic evidence contracts remain source-compatible.

### Domain Vocabulary

- `FlowReceiptRecorder` — internal callback that settles one diagnostic attempt after the runner
  determines its final outcome.
- `TruncationOutcome` — internal recursive pair of bounded value plus whether any descendant was
  capped.
- `ResultByteLimitError` — internal signal that the post-truncation serialized value is still too
  large to return honestly.

### Ports

- No new port. `DiagnosticEvidencePort` remains the existing persistence boundary and is consumed
  only by CLI composition.

### Constants

- Internal serialized-result byte ceiling — one fixed runner policy value, not exported.
- Existing `DEFAULT_TRUNCATION_POLICY` — unchanged `{ maxItems, maxStringLength }` public shape.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Receipt-after-validation lifecycle and failed-attempt fixture | targeted `drift-evidence_test.ts` + `doctor_test.ts` | `cli.ts`, `src/application/runner/mcp-server.ts`, one internal runner lifecycle file, receipt tests, run artifacts |
| 2 | Honest truncation metadata and whole-result byte ceiling | targeted `truncation_test.ts` + runner/package tests | `src/application/runner/truncation.ts`, `mcp-server.ts` if error mapping is needed, truncation tests, run artifacts |

### Deferred Scope

- Evidence-class keys (S-16), introspection receipt acceptance, OpenAPI tool wiring, public byte
  policy configuration, and MCP v2-shape work remain outside #1134.

### Contributor Path

Future diagnostic flows continue to use the CLI's `withReceipt` composition wrapper; the runner
owns settlement ordering centrally. Future bounded list results expose a boolean `truncated`
property if clients need truncation metadata; the central policy will flip that existing property
when it applies any descendant cap.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-03 | bootstrap | research/design | Re-baselined #1134 and RFC S-13/S-15 against clean `origin/main`; baseline doc-lint 0 diagnostics. |
| 2026-08-03 | plan-eval | transport | Canonical Qwen evaluator launch timed out before any verdict/file change; retrying same route with a bounded timeout extension. |
| 2026-08-03 | plan-eval | verdict | Separate Claude Code + OpenRouter Qwen session returned `PASS`; both implementation slices authorized. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Internal lifecycle callback | Runner must settle after validation without changing public flow/options types. | plan D1; S-15 |
| Reject irreducibly oversized values | Enforces byte ceiling without deleting schema-required properties. | plan D4; S-13 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Prompt locates `withReceipt` near `mcp-server.ts`; baseline wrapper is in `cli.ts`, with validation in `mcp-server.ts`. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline doc lint | `deno task doc:lint --root packages/mcp --pretty` | PASS | 2 entrypoints, 0 diagnostics before source work |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Full Archetype-2 column | NOT_RUN | plan gate first | Selected per RFC S-20 |
| Plan-Gate | PASS | `plan-eval.md` | All eight checklist items passed; no unresolved decisions |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| MCP targeted fixtures | NOT_RUN | implementation pending | No external service required |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Public export consumers | N/A | locked unchanged surface | Escalates if surface moves |

## Handoff Notes

- PLAN-EVAL should inspect D1/D4 and verify the full Archetype-2 gate disposition, especially the
  conditional F-6/F-7 evidence contract and the no-public-surface constraint.
