# Research — fix-808-mcp-live-defects--mcp-live

## Re-baseline

- Carried-in source: issue #808 and
  `/home/codex/repos/netscript-beta10-cli/.llm/runs/beta10-cli--orchestrator/slices/mcp-live-validation/report.md`.
- Re-derived against `origin/main` @ `7bc256a1f1ed9f2ee7bafb78c37917e59909ffe9` on 2026-07-17.
- What changed vs the carried-in version:
  - GitHub `main` advanced once during bootstrap from `6e8528a0` to `7bc256a1`; the branch was
    rebased before source work. The new commit only improves the MCP README and does not change the
    three owning code paths.
  - The JSR surface scan additionally exposed five existing `private-type-ref` diagnostics on the
    `./cli` entrypoint even though the structured wrapper's combined summary incorrectly reports
    zero; the package dry-run itself is green.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Aspire 13.4.6 returns spans as `{data:{resourceSpans:[…]},totalCount,returnedCount}`; the live report observed two resource groups and 26 spans. | Issue #808 and the carried live report; recapture during S1. |
| 2 | `selectItems()` only inspects keys on the top-level object, so it treats the envelope itself as one candidate; `normalizeSpan()` then rejects it for missing span fields. | `packages/telemetry/src/adapters/aspire-query/aspire-telemetry-normalize.ts`; `AspireTelemetryQuery.querySpans()`. |
| 3 | Even a one-level `data` unwrap is insufficient: OTLP spans are nested under `resourceSpans[].scopeSpans[].spans[]`, and resource attributes live on the containing resource. | Aspire OTLP response contract and live report; recapture during S1. |
| 4 | `doctor` flattens every family check into `DoctorResult.checks`, while its own output schema caps that array at 20. Output validation happens before generic truncation, so the live result becomes JSON-RPC `-32603`. | `doctor-flow.ts`, `tool-contracts.ts`, `mcp-server.ts`. |
| 5 | The default docs root is `<project>/docs/site`; generated projects do not contain that directory, and `FilesystemDocsCorpus` maps a missing root to an empty map without a diagnostic. | `packages/mcp/cli.ts`, `filesystem-docs-corpus.ts`, issue #808. |
| 6 | The package already publishes `README.md`, and Deno 2.9 raw text imports work for it; this is a publish-safe embedded default with no runtime filesystem lookup. | `deno eval 'import source from "./packages/mcp/README.md" with { type: "text" }'`; package dry-run file list. |
| 7 | Correct live paths are 13 tool names, populated `list_commands`, allowed `plugin list`, and pre-spawn denied `deploy`. | Issue #808 and the carried live report; retain in live matrix. |
| 8 | `packages/mcp` is an owner-accepted horizontal Archetype-6 thin protocol router; flows consume ports and external adapters remain in infrastructure. | `MCP-A6-V2-SHAPE` in `.llm/harness/debt/arch-debt.md`. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/mcp/deno.json`, `mod.ts`, `cli.ts`, README, full export map.
- `deno task doc:lint --root packages/mcp --pretty`: exit 0 and combined total 0, but its per-entry
  data records five `./cli` `private-type-ref` findings.
- Raw corroboration: `deno doc --lint packages/mcp/cli.ts` exits non-zero with those five findings.
- `packages/mcp` `deno task publish:dry-run`: exit 0, no slow types, intended file list only.
- Planned surface risk: the embedded default must use a raw import, not runtime
  `Deno.readTextFile(import.meta.url)`, so the published JSR graph remains usable.
- Hidden corrective scope: re-export the existing referenced public types from `./cli` while that
  entrypoint is touched; no new API concept or dependency is introduced.

## Open questions

- None that force rework. The exact live-capture fields are intentionally re-derived before S1 is
  implemented; casing variants outside the observed Aspire 13.4.6 payload are safe to defer.
