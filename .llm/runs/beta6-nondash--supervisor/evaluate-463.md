# IMPL-EVAL — Issue #463 (PR #562) — MCP Transport Pool

**Evaluator:** IMPL-EVAL (separate session from Tier-D generator)
**Branch:** feat/463-ai-mcp-pool
**Base:** c9a703bf (origin/main)
**Date:** 2025-01-27

## Verdict: PASS

All four decisive checks passed. Pool implementation is CORE (archetype-1), all acceptance behaviors have real assertions, gates green, lock untouched, no casts.

## Independent Validation

### Check 1: Surface + Core Placement ✅
**Requirement:** `packages/ai/mcp.ts` exports pool symbols; pool lives at `packages/ai/src/mcp/application/pool.ts` (CORE); `plugins/ai` does not re-hand-roll pooling.

**Evidence:**
- `mcp.ts` exports: `createMcpTransportPool`, `createMcpTransportPoolFromTransports`, `extractMcpUiResources`, `McpTransportPool`, `McpUiResource`, `McpPooledToolResult`, `McpTransportPoolConfig`, `McpTransportPoolOptions`
- Implementation: `packages/ai/src/mcp/application/pool.ts` (341 lines)
- `grep -rn 'pool|Pool' plugins/ai/` → zero matches
- Pool wraps `createMcpTransport` (factory.ts); does NOT reimplement stdio/HTTP transport logic

### Check 2: Acceptance Behaviors ✅
**Requirement:** (a) keyed by server id, duplicate throws; (b) keep-alive — `connectCount === 1`; (c) tool-name prefixing `${serverId}__${remoteName}` with collision guard; (d) `ui://` extraction yields data-only `{uri, src, ...}`.

**Evidence:**
- **(a)** Constructor (pool.ts ~280): `if (this.#transports.has(transport.serverId)) throw new AiError()`
- **(b)** Test `mcp_test.ts` "keeps transports warm across turns": asserts `transport.connectCount === 1` after multiple `listTools`/`callTool` calls
- **(c)** `#prefixTool` (pool.ts ~340) produces `${serverId}${separator}${remoteName}`; `#collectTools` (pool.ts ~315) throws on collision: `throw new AiError('Duplicate MCP tool name "${prefixed.name}" in pool.')`
- **(d)** Test "extracts ui resources as plain resource and src data": validates exact shape `{uri, src, mimeType, text, serverId, toolName, toolCallId}` with `assertEquals` — not a stubbed pass

### Check 3: Tests + Gates ✅ (DECISIVE)
**Requirement:** `deno test --allow-all packages/ai/tests/` green (~78 tests); `packages/ai/tests/mcp_test.ts` (~11 tests); `run-deno-doc-lint.ts --root packages/ai` totalErrors=0 with `./mcp.ts` clean; `deno publish --dry-run` from `packages/ai` exit 0 WITHOUT `--allow-slow-types`.

**Evidence:**
- **Tests:** `deno test --allow-all packages/ai/tests/` → **78 passed, 0 failed** (11 MCP tests confirmed)
- **Doc lint:** `deno run --allow-all .llm/tools/run-deno-doc-lint.ts --root packages/ai` → `totalErrors: 0`, `./mcp.ts` clean (0 errors, 0 privateTypeRef, 0 missingJSDoc)
- **Publish:** `deno publish --dry-run` from `packages/ai` → exit 0, "Success Dry run complete", NO `--allow-slow-types` flag used

### Check 4: Lock + Casts ✅ (DECISIVE)
**Requirement:** `git diff c9a703bf..HEAD -- deno.lock` empty; scan diff for `as` casts beyond repo's 2 accepted.

**Evidence:**
- `git diff c9a703bf..HEAD -- deno.lock` → empty (zero changes from base)
- `git diff c9a703bf..HEAD | grep ' as '` → only match: test name string "as plain resource" — zero type casts in implementation

## A1 Carry-Forward (Check 5) — Production `ui://` Shape ✅

**A1 Flagged:** `withUiResources` in `pool.ts` parses `McpToolResult.content` as a JSON string. Confirm live transports actually place a JSON string in `.content`.

**Evidence:**
- `McpToolResult.content` contract (ports/mcp-transport.ts ~40): `readonly content: string` — type-fixed to string
- `tanstack-connector.ts` production path (lines 94, 96, 101): `stringifyContent(result.content)` applied to all tool results
- `stringifyContent` (lines 160-164): if already string, return verbatim; else `JSON.stringify(content ?? null)`
- Live transports guarantee string content; `parseJson` in `pool.ts` never sees already-structured content

**Conclusion:** No silent prod no-op. Extraction path is production-safe.

## Close-Gate (#387)

**Requirement:** Issue #463 acceptance + gate checkboxes checked with evidence (NOT "PR body says Closes #463").

**Status:** Cannot verify without viewing PR body in this session. Supervisor should confirm close-gate separately.

## Final Verdict

**PASS** — All decisive checks green. Implementation is real, gates are green, lock is untouched, no casts.

OPENHANDS_VERDICT: PASS
