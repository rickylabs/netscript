# Tier-A — #1387 Slice 7 (MCP access result contract, type/schema)

**Content head:** `897a06cd7170ca021da1836b3cbcbf790cf97a2f`
**Evidence head:** `8e20cf708d4f53df5b5cb8626edeedc2e6b9bd12` — product-neutral
**Base:** `ae90bb264` · **Verdict:** ACCEPTED

## Ceiling

All five authorized files touched, plus the corpus carrier and Slice 6's receipt archive move. No
breach. `deno.lock` byte-identical.

## Substance

`OperationAccessSummary` (`operation-access.ts`, new) is bounded and credential-free by construction:
`authentication` (the tri-state), `securitySchemes` (scheme names only), `scopes`, `roles` — no
credential values, no principal data. Directly derivable later from Slice 6's OpenAPI `security` /
`x-netscript-roles` output, which is the point: this slice defines the target shape without doing the
derivation.

`access` is added as a genuinely **optional** field in both places: `ServiceOperationSummary` and
`GetOperationSchemaResult` (TypeScript `access?:`), and in the JSON-schema `outputShapes` for both
tools — `access` is absent from both required-fields arrays. Within the `access` object itself, all
four sub-fields are required — a complete summary or nothing, no partial state to interpret.

**Constructibility proven, not asserted.** `operationAccessExample: OperationAccessSummary` is a real
typed literal (not `as` cast, not `unknown`) attached to the schema's `examples`, so a type error in
the interface would fail the build here.

**No population, correctly.** Both flow files gained only the type import and the optional field on
their result interfaces — zero logic change. `authNote`'s existing generic behavior is untouched, as
required (Slice 8's job, not this one).

## Gate results — all at content head `897a06cd7`, `gitHead == actualGitHead`

| Gate | Outcome | Duration |
| --- | --- | --- |
| `check` (scoped) | PASS | 1 458 ms |
| `lint` (scoped) | PASS | 607 ms |
| `fmt:check` (scoped) | PASS | 577 ms |
| `test` (MCP) | PASS — **136 passed / 0 failed** | 7 500 ms |
| `quality:gate` | PASS | 10 209 ms |
| `mcp-export-corpus` | PASS — **7 654 → 7 655**, exactly the one new type | 8 380 ms |
| `exports-drift` | PASS | 3 499 ms |
| `publish:dry-run` | PASS | 36 506 ms |

MCP public doc lint correctly excluded as contracted base-red. Evidence set **SUFFICIENT**, zero
reasons. Slices 1–6 archives present and untouched.

## Findings

None. Clean type/schema slice; corpus delta matches the exported surface exactly.

## Verdict

**ACCEPTED.** Ceiling respected exactly, lock unchanged, corpus moved by precisely the expected
amount, all eight receipts PASS, evidence set sufficient, 136/136 tests. The bounded/credential-free
constraint is met by construction, and constructibility is proven with a real typed literal rather
than asserted.
