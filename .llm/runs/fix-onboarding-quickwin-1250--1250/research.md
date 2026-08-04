# Research — fix-onboarding-quickwin-1250--1250

## Re-baseline

- Carried-in source: owner brief and GitHub issue #1250.
- Re-derived against `origin/main` @ `5957260751f23d675d32bd7fb7b7a9198be84096` on 2026-08-04.
- The branch is byte-identical to current `origin/main`; the only inherited worktree change is an
  unrelated one-line `deno.lock` addition, which this run preserves and excludes.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `handlers.ts` installs the Zod-3 coercion plugin while scaffold contracts use Zod 4. | `packages/service/src/primitives/handlers.ts:25`; issue #1250 |
| 2 | The sibling OpenAPI generator already selects the Zod-4 adapter. | `packages/service/src/primitives/openapi.ts:21` |
| 3 | oRPC 1.14.6 exposes the Zod-4 plugin as `experimental_ZodSmartCoercionPlugin`. | `deno doc npm:@orpc/zod@1.14.6/zod4`; cached declaration export list |
| 4 | Existing service handler tests never send a query-string number through the OpenAPI handler. | `packages/service/tests/handlers_test.ts` |
| 5 | The #1204 introspection surface describes OpenAPI operations but does not execute them; the HTTP handler remains the behavior-owning boundary. | MCP tool catalog and `packages/mcp/src/application/flows/` |

## JSR audit surface scan

- Surface scanned: `packages/service/deno.json`, `mod.ts`, and `deno doc --filter
  createOpenAPIHandler packages/service/mod.ts`.
- Planned delta is an internal dependency subpath plus a test; no export, metadata, permission, or
  documentation contract changes.
- Final package doc-lint and publish dry-run remain gates because the implementation file is in the
  publish include set.

## Open questions

- None that would force rework. The Zod-4 export alias and HTTP regression shape are resolved.

