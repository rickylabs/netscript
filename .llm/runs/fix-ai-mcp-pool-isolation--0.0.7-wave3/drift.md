# Drift Log: AI MCP pool failure isolation

Drift is append-only.

## 2026-08-15 — Live acceptance exceeds the frozen writable surface

- **What:** The live issue requires a committed RED test, resource-read and close cancellation,
  late-success cleanup, a public per-server status/error snapshot, and documentation. The frozen
  contract authorizes only the pool, TanStack connector, and registration implementation files.
- **Source:** GitHub issue #1448; `packages/ai/tests/mcp_test.ts`;
  `packages/ai/src/ports/mcp-transport.ts`;
  `packages/ai/src/mcp/adapters/base-transport.ts`; `packages/ai/mcp.ts`;
  `packages/ai/README.md`.
- **Expected:** The three-file contract can fully resolve the live issue.
- **Actual:** At minimum test/docs/port/lifecycle surfaces are required for the acceptance contract.
- **Severity:** significant
- **Action:** rescope — stop before implementation and request a coordinator amendment.
- **Evidence:** `research.md` red-first outputs and findings 5–7.

## 2026-08-15 — Leaf archetype differs from the package-wide doctrine table

- **What:** The coordinator froze this leaf as Archetype 2 (integration); current doctrine assigns
  `packages/ai` as Archetype 4 (DSL/builder).
- **Source:** user brief; `docs/architecture/doctrine/06-archetypes.md` and
  `10-codebase-verdict-and-handoff.md`.
- **Expected:** One profile classification.
- **Actual:** The narrow MCP adapter/pool leaf is treated as Archetype 2 inside an Archetype-4 package.
- **Severity:** minor
- **Action:** accept — explicit coordinator override recorded in `supervisor.md`.
- **Evidence:** frozen contract and doctrine tables.

## 2026-08-15 — Scope mismatch resolved by coordinator amendment

- **What:** The coordinator added the five test/port/base/public/docs files required by the live
  acceptance contract and ruled the exact synchronous snapshot and cancellation semantics.
- **Source:** committed `scope-ruling.md` at
  `e2faaab15def77c131806aa6cf565d77bd6fe92c`.
- **Expected:** The leaf remains stopped until explicit authorization arrives.
- **Actual:** The amended exactly-eight-file package surface can express the complete fix.
- **Severity:** resolved
- **Action:** accept — re-lock the plan, record `PLAN-EVAL: N/A`, and proceed red-first.
- **Evidence:** amended plan and context pack; prior stop evidence remains unchanged.

## 2026-08-15 — Published concrete transport delegates remain outside amended surface

- **What:** The ruled port/base resource-read and close cancellation contract requires the two
  published composition wrappers to delegate `readResource(options)` and expose `stop(options)`.
- **Source:** `packages/ai/src/mcp/adapters/stdio-transport.ts` and
  `packages/ai/src/mcp/adapters/streamable-http-transport.ts`; both implement
  `McpTransportPort` by composition over `BaseMcpTransport` and are exported from `./mcp`.
- **Expected:** The amended eight-file surface can expose cancellable resource-read and close on
  every published MCP transport.
- **Actual:** Adding the methods only to the port/base either breaks interface conformance or leaves
  the concrete public classes without callable/delegated operations. Making `readResource`
  optional would evade, rather than satisfy, the acceptance contract.
- **Severity:** significant
- **Action:** rescope — stop slice 3 before edits and request explicit authorization for exactly
  the two concrete adapter files.
- **Evidence:** focused source inspection after slice 2; no slice-3 source changes were made.
