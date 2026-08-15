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
