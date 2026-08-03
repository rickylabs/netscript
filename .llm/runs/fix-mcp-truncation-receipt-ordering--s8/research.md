# Research — fix-mcp-truncation-receipt-ordering--s8

## Re-baseline

- Carried-in sources: issue #1134; RFC PR #1123 §4; seed-run findings S-13 and S-15 under
  `.llm/runs/plan-openapi-mcp-plugin--seed/`.
- Re-derived against `main` @ `fb75cf6fc5ad02130ada0ac42e6f44035ac03a9b` on 2026-08-03.
- What changed vs the carried-in version:
  - Nothing material. The central truncator still slices arrays to 50 without propagating
    truncation metadata and still has no serialized-result byte ceiling.
  - Receipt persistence still occurs in the CLI-local `withReceipt` wrapper before the runner's
    output-schema validation. The prompt's approximate location names `mcp-server.ts`, while the
    wrapper itself is in `cli.ts`; the RFC already describes this as a wrapper/runner integration.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `truncateResult` recursively caps strings/arrays but drops array elements without setting an existing sibling `truncated` flag. | `packages/mcp/src/application/runner/truncation.ts`; `packages/mcp/tests/truncation_test.ts` |
| 2 | The central pass has no UTF-8 serialized-byte ceiling and object property count is unbounded. | `packages/mcp/src/application/runner/truncation.ts:13-31`; S-13 in `adversarial-sol.md` |
| 3 | `withReceipt` writes a success receipt as soon as a flow resolves; output validation happens later in `createMcpServer().handle`. | `packages/mcp/cli.ts:175-211`; `packages/mcp/src/application/runner/mcp-server.ts:96-116` |
| 4 | A throwing flow bypasses receipt writing and escapes the runner, so an older green receipt can remain current. | Same files; no catch around `tool.flow` on baseline |
| 5 | Both package entrypoints are doc-lint clean and the requested behavior can remain internal. | `deno task doc:lint --root packages/mcp --pretty` → 2 entrypoints, 0 diagnostics |
| 6 | The adjacent `MCP-A6-V2-SHAPE` debt is active and explicitly out of scope. | `.llm/harness/debt/arch-debt.md` entry `MCP-A6-V2-SHAPE` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/mcp/deno.json`, `mod.ts`, `cli.ts`, and the full two-entrypoint
  `doc:lint` result.
- Current metadata: scoped name, version, description, license, exports, publish include/exclude,
  and ESM entrypoints are present.
- Current documentation bar: `doc:lint` reports 0 private-type, missing-JSDoc, or other errors.
- Planned surface risk: none. The fix adds no export-map entry and changes no symbol re-exported by
  `mod.ts` or `cli.ts`. If implementation forces an exported type/signature change, stop, log
  significant drift, and add scoped doc-lint plus publish dry-run evidence before proceeding.

## Open questions

- None that force rework. The byte ceiling is locked as an internal fixed policy so the exported
  `TruncationPolicy` shape does not move.
