# Worklog: OMB S9 activation surfaces and migration fixture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-activation-s9--1135` |
| Branch | `feat/openapi-mcp-activation-s9` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- MCP `initialize.result.instructions` gains one curl-moment sentence.
- Existing `get_recent_errors` and `doctor` result contracts gain bounded operation-schema hints.
- Scaffolded `apps/<app>/AGENTS.md` gains one behavioral line.
- No TypeScript export map or CLI command changes.

### Domain Vocabulary

- `operationSchemaHint` — stable pointer telling an agent to call `get_operation_schema` for a
  service before constructing a request.
- prior-release host file — exact-version `.mcp.json` input that intentionally remains old until
  `agent init` rewrites it.

### Ports

- None added. Existing telemetry query, doctor family, filesystem, and MCP server seams are enough.

### Constants

- One operation-schema hint formatter/constant only if the contract needs consistent bytes.
- `OPENAPI_TOOL_TRIAD` in the migration fixture: `list_api_services`,
  `list_service_operations`, `get_operation_schema`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Activation bytes across initialize, app conventions, and failure outputs | focused MCP + scaffold tests | MCP runner/contracts/flows/tests; CLI app convention/tests; run artifacts |
| 2 | S-18 prior-release exact-pin migration | focused agent-init test | agent-init fixture/test; run artifacts |

### Deferred Scope

- Introspection receipt gating and field-use measurement remain in RFC fork F4 / #1090 lineage.
- Existing-project app-scoped file backfill is not claimed; root guidance is updated by re-init.

### Contributor Path

Start at `mcp-server.ts` for session instructions, the two MCP flows plus `tool-contracts.ts` for
failure hints, `agent-conventions.ts` for new app scaffolds, and `init-agent_test.ts` for host-file
migration behavior.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | bootstrap | research + plan | Current 21-tool surface re-baselined; milestone waiver composed and plan locked. |
| 2026-08-04 | 1 | implementation + focused gate | Initialize, app template, recent-error, and doctor pointer fixtures pass. |
| 2026-08-04 | 1 | review launch | Fable and Opus configured identities both failed pre-inference; no sign-off claimed. |
| 2026-08-04 | 2 | implementation + focused gate | Prior 0.0.4 host fixture is rewritten to the simulated 0.0.5 exact pin; restarted current host lists 21 tools and the triad. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Plan-Gate row composed, no local formal PLAN-EVAL | owner-specified milestone-run ruling D6 | user prompt / `milestone-run.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Issue lineage says 14 tools; current registry is 21 | minor | yes |

## Gate Results

### Focused Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| activation + migration fixtures | `deno test ...init-agent_test.ts ...stdio_test.ts ...telemetry-flows_test.ts ...doctor_test.ts ...public-command-tree_test.ts` | PASS | 29 passed, 0 failed; current tool count 21 |

Full static, quality, JSR, consumer, and formal evaluator gates remain pending.

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| MCP check | scoped check wrapper, `--config=packages/mcp/deno.json` | PASS | 103 files, 0 diagnostics |
| owned CLI check | scoped check wrapper, `--config=packages/cli/deno.json` | PASS | 16 files, 0 diagnostics |
| MCP lint | scoped lint wrapper with package config | PASS | 103 files, 0 occurrences |
| owned CLI lint | scoped lint wrapper with package config | PASS | 16 files, 0 occurrences |
| MCP format | scoped fmt wrapper with package config | PASS | 103 files, 0 findings |
| owned CLI format | scoped fmt wrapper with package config | PASS | 16 files, 0 findings |
| root wrapper attempt | scoped fmt wrapper without explicit config | NOT_RUN | Deno 2.9.3 rejected baseline array-form root `workspace` before scanning; explicit package-config reruns are the verdicts above |
| diff hygiene | `git diff --check`; changed-line ignore/cast scan | PASS after run-artifact EOF cleanup | no new lint ignores, `as unknown as`, `as any`, or `@ts-ignore` |

### Fitness / JSR Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `deno task quality:gate` | PASS | exit 0 | repo task passed; warnings are baseline-only |
| targeted MCP quality scan | PASS | `scan-code-quality.ts --root packages/mcp` | 0 findings, 0 allowances |
| targeted MCP doctrine | BASELINE_FAIL | `check-doctrine.ts --root packages/mcp` | unchanged test-style false positive plus two existing folder-cardinality warnings; changed-file scan introduces none |
| doc-lint | PASS | `deno task doc:lint --root packages/mcp --pretty` | combined total 0 across 3 entrypoints |
| publish dry-run | PASS | package-local `deno publish --dry-run --allow-dirty --no-check=remote` | success, no slow types |
| lock hygiene | PASS | `git diff -- deno.lock` | only the pre-existing queue entry; never staged |

### Runtime / Consumer Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `scaffold.runtime` | PASS | 71 passed, 0 failed | one-pass command with `--cleanup --format pretty`; MCP endpoint-directory behavior passed and cleanup succeeded |

### Post-slice reconcile

- #1135 remains open with two unticked acceptance boxes; draft PR #1232 carries `Closes #1135`,
  `Part of #1126`, milestone 0.0.5, the requested taxonomy, and exactly one `status:impl` label.
- No new issue/PR comments were present at the implementation checkpoint.

## Handoff Notes

- Evaluator should inspect the three byte fixtures and the S-18 causal chain first.
