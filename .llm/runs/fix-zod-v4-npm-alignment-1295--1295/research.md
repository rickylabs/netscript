# Research — fix-zod-v4-npm-alignment-1295--1295

## Re-baseline

- Carried-in source: live issue #1295 measurements.
- Re-derived against `canary/0.0.5-canary.13` at `44d2635e1` on 2026-08-05.
- The reported graph is still current on the train.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | Exactly 18 workspace `deno.json` files bind `zod` to `jsr:@zod/zod@4.4.3`. | `rg -l 'jsr:@zod/zod@4.4.3' --glob deno.json packages plugins` |
| 2 | Root catalog has no Zod entry, so the workspace has no npm-side version home. | `deno.json` catalog |
| 3 | The lock contains JSR Zod 4.4.3, npm Zod 4.4.3, and npm Zod 3.25.76. | `deno.lock` specifiers/packages |
| 4 | MCP/AI peers requiring Zod 4 resolve to 3.25.76. | `NO_COLOR=1 deno info npm:@modelcontextprotocol/sdk` |
| 5 | `packages/sdk/src/openapi/helpers.ts` imports `@orpc/zod`, while service imports the explicit `@orpc/zod/zod4` surface. | focused `rg '@orpc/zod' packages plugins` |
| 6 | Existing npm catalog compliance cannot detect multiple resolved Zod module instances; a graph-specific guard is required. | `.llm/tools/deps/scan-npm-catalog-compliance.ts` and current green task |

## jsr-audit surface scan

- Surface scanned: all 18 affected published package/plugin manifests and their unchanged export maps.
- Public exports and symbol declarations do not change.
- Risk is dependency identity/materialization: `catalog:` must become `npm:zod@^4.4.3` in publish dry-runs without creating slow types or file-list drift.
- Required evidence: full publish dry-run, full-export doc lint for affected published units, and graph guard output. Actual JSR publication is unavailable under #1312 and is not claimed.

## Open questions

- None. Root catalog version is `^4.4.3`, matching the existing npm Zod 4 instance and workspace JSR version.
