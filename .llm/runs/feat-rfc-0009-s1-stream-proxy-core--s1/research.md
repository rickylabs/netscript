# Research: RFC 0009 Slice 1 — Core stream endpoint contract & revocable SSE proxy runtime (#2677)

## Baseline

- Baseline `origin/main`: `af5107b8d` (merged RFC 0009 PR #2658).
- Governing RFC: `rfcs/0009-authorizing-stream-proxy.md` (status: `Accepted`, tracking issue `#2146`, milestone `0.0.10`).
- Slice issue: `#2677` (sub-issue of `#2146`, milestone `0.0.10`).
- Follow-on slice issues: `#2678` (S2, blocked by `#2677`), `#2679` (S3, blocked by `#2678`), `#2680` (S4, blocked by `#2679`).

## Open PR overlap check

- Checked open PRs via `gh pr list --state open --json number,title,files`.
- `#2660` touches `docs/site/**` and `tools/streams-subscriber-capacity/**` (no overlap).
- `#2659` touches `rfcs/0000-in-process-service-link.md` and its run dir (no overlap).
- Zero open PRs touch `packages/contracts/**` or `packages/plugin-streams-core/**`.

## Surface & doctrine findings

1. **`packages/contracts` (Archetype 1 — Small Contract, verdict `Keep`)**:
   - Subpath pattern follows `./commands` (`packages/contracts/commands.ts` re-exporting from `src/domain/*` and `src/application/*`).
   - `ContractObjectSchemaLike`, `ContractSchemaInput`, `ContractSchemaOutput`, and `NetScriptProcedureMeta` already exist in `src/domain/schema-types.ts` and `src/domain/procedure-meta.ts` with zero `@orpc/*` leakage (guarded by `tests/procedure-meta-independence_test.ts`).
   - Root `deno.json` enforces `isolatedDeclarations: true` and `deno publish --dry-run` enforces zero slow types.
2. **`packages/plugin-streams-core` (Archetype 3 — Runtime/Behavior, verdict `Keep`)**:
   - `src/` already has 12 immediate children (doctrine F-16 cardinality cap). Adding a root subpath entrypoint `./proxy.ts` (matching `./admin.ts` and `./commands.ts`) plus files under `src/domain/`, `src/ports/`, `src/adapters/`, and `src/application/proxy/` keeps every directory at or below 12 immediate children and every source file under the F-1 line caps (`<= 300` for domain, `<= 500` for application).
   - `STREAM_SSE_CONTRACT_V1` in `src/domain/sse-contract-v1.ts` owns the `['data', 'control']` wire contract and `control` schema.
   - `buildStreamUrl`, `getStreamsUrl`, and `getStreamsAuth` live in `src/application/stream-url-resolver.ts`.
   - `@netscript/plugin-streams-core` already depends on `@netscript/service` (`packages/plugin-streams-core/deno.json:18`) and workspace resolution resolves `@netscript/contracts/streams` with zero `deno.lock` changes.
3. **CI / MCP asset freshness checks**:
   - Adding new subpath exports requires checking `deno task check:mcp-export-corpus`, `deno task check:assets-barrel`, `deno task check:publish-assets`, `deno task docs:jsdoc-examples`, `deno task docs:readme-fences`, `deno task check:netscript-jsr-specifiers`, `deno task quality:gate`, `deno task doc:lint`, and `deno task publish:dry-run`.
